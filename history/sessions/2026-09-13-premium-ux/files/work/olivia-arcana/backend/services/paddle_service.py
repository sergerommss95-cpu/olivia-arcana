"""
Paddle Billing integration — checkout, webhooks, subscription management.

Paddle is our Merchant of Record. They handle global tax/VAT/MoSS,
chargebacks, and fraud. We send price IDs and customer email; they return a
hosted checkout URL.

Stripe is BANNED for tarot/psychic/occult businesses — see LLC Guide.

Environment:
  PADDLE_API_KEY              — server-side API key (Paddle Vendor Dashboard)
  PADDLE_WEBHOOK_SECRET       — for verifying webhook signatures
  PADDLE_ENV                  — "sandbox" or "production" (default: sandbox)

  Subscription price IDs (one per tier × period):
  PADDLE_PRICE_INSIGHT_MONTHLY
  PADDLE_PRICE_INSIGHT_ANNUAL
  PADDLE_PRICE_PREMIUM_MONTHLY
  PADDLE_PRICE_PREMIUM_ANNUAL
  PADDLE_PRICE_VIP_MONTHLY
  PADDLE_PRICE_VIP_ANNUAL

  Addon price IDs (one-time):
  PADDLE_PRICE_ADDON_BIRTH_CHART
  PADDLE_PRICE_ADDON_COMPATIBILITY
  PADDLE_PRICE_ADDON_CELTIC_CROSS
  PADDLE_PRICE_ADDON_YEAR_AHEAD
  PADDLE_PRICE_ADDON_SOLAR_RETURN
  PADDLE_PRICE_ADDON_VIDEO_READING
"""

from __future__ import annotations

import hmac
import hashlib
import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User, Payment, Purchase

logger = logging.getLogger(__name__)

# ── Config ──

PADDLE_ENV = os.getenv("PADDLE_ENV", "sandbox")
PADDLE_API_KEY = os.getenv("PADDLE_API_KEY", "")
PADDLE_WEBHOOK_SECRET = os.getenv("PADDLE_WEBHOOK_SECRET", "")

PADDLE_API_BASE = (
    "https://api.paddle.com" if PADDLE_ENV == "production"
    else "https://sandbox-api.paddle.com"
)

# Maps our internal price keys → Paddle price IDs
# When env vars are missing we fall back to a placeholder string so that
# missing-config errors are explicit ("price not set") rather than silently
# routing to a sandbox product.
def _env(key: str) -> str:
    val = os.getenv(key, "")
    return val or f"<MISSING_{key}>"


PRICE_MAP: dict[str, str] = {
    # Subscriptions
    "insight_monthly":  _env("PADDLE_PRICE_INSIGHT_MONTHLY"),
    "insight_annual":   _env("PADDLE_PRICE_INSIGHT_ANNUAL"),
    "premium_monthly":  _env("PADDLE_PRICE_PREMIUM_MONTHLY"),
    "premium_annual":   _env("PADDLE_PRICE_PREMIUM_ANNUAL"),
    "vip_monthly":      _env("PADDLE_PRICE_VIP_MONTHLY"),
    "vip_annual":       _env("PADDLE_PRICE_VIP_ANNUAL"),
    # Addons (one-time)
    "addon_birth_chart":   _env("PADDLE_PRICE_ADDON_BIRTH_CHART"),
    "addon_compatibility": _env("PADDLE_PRICE_ADDON_COMPATIBILITY"),
    "addon_celtic_cross":  _env("PADDLE_PRICE_ADDON_CELTIC_CROSS"),
    "addon_year_ahead":    _env("PADDLE_PRICE_ADDON_YEAR_AHEAD"),
    "addon_solar_return":  _env("PADDLE_PRICE_ADDON_SOLAR_RETURN"),
    "addon_video_reading": _env("PADDLE_PRICE_ADDON_VIDEO_READING"),
}

SUBSCRIPTION_KEYS = {
    "insight_monthly", "insight_annual",
    "premium_monthly", "premium_annual",
    "vip_monthly", "vip_annual",
}

ADDON_KEYS = {k for k in PRICE_MAP if k.startswith("addon_")}

# Maps a price key → tier so webhook handlers know which tier to grant.
TIER_FROM_PRICE_KEY: dict[str, str] = {
    "insight_monthly":  "insight",
    "insight_annual":   "insight",
    "premium_monthly":  "premium",
    "premium_annual":   "premium",
    "vip_monthly":      "vip",
    "vip_annual":       "vip",
}


# ── HTTP client ──

def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=PADDLE_API_BASE,
        headers={
            "Authorization": f"Bearer {PADDLE_API_KEY}",
            "Content-Type": "application/json",
        },
        timeout=20.0,
    )


# ── Public API ──

async def create_checkout_session(
    *,
    user: User,
    price_key: str,
    success_url: str,
    cancel_url: str,
    db: AsyncSession,
) -> str:
    """
    Create a Paddle transaction and return a hosted-checkout URL.

    For subscriptions, Paddle creates a transaction tied to a recurring price.
    For one-time addons, Paddle creates a one-off transaction.
    """
    if price_key not in PRICE_MAP:
        raise ValueError(f"Unknown price_key: {price_key}")

    paddle_price_id = PRICE_MAP[price_key]
    if paddle_price_id.startswith("<MISSING_"):
        raise RuntimeError(f"Paddle price not configured: {price_key}")

    payload = {
        "items": [{"price_id": paddle_price_id, "quantity": 1}],
        "customer": {"email": user.email},
        "custom_data": {
            "user_id": str(user.id),
            "price_key": price_key,
        },
        "checkout": {"url": success_url},
    }

    async with _client() as http:
        r = await http.post("/transactions", json=payload)
        if r.status_code >= 300:
            logger.error("Paddle checkout error: %s %s", r.status_code, r.text)
            raise RuntimeError(f"Paddle returned {r.status_code}")
        data = r.json().get("data", {})

    # Paddle returns the hosted-checkout URL inside `checkout.url`.
    checkout_url = (data.get("checkout") or {}).get("url")
    if not checkout_url:
        raise RuntimeError("Paddle did not return a checkout URL")
    return checkout_url


async def create_portal_session(*, user: User, db: AsyncSession) -> str:
    """
    Generate a Paddle customer portal link so the user can manage / cancel.
    Paddle calls this an "update payment method" or "customer portal" link.
    """
    if not user.paddle_customer_id:
        raise RuntimeError("User has no Paddle customer record yet")

    async with _client() as http:
        r = await http.post(
            f"/customers/{user.paddle_customer_id}/portal-sessions",
            json={},
        )
        if r.status_code >= 300:
            logger.error("Paddle portal error: %s %s", r.status_code, r.text)
            raise RuntimeError(f"Paddle returned {r.status_code}")
        data = r.json().get("data", {})

    portal_url = (data.get("urls") or {}).get("general", {}).get("overview")
    if not portal_url:
        raise RuntimeError("Paddle did not return a portal URL")
    return portal_url


# ── Webhook ──

def verify_webhook(payload: bytes, signature_header: str) -> bool:
    """
    Verify a Paddle webhook using the HMAC-SHA256 scheme.

    Header format: `ts=<timestamp>;h1=<hmac>`
    """
    if not PADDLE_WEBHOOK_SECRET or not signature_header:
        return False
    parts = dict(p.split("=", 1) for p in signature_header.split(";"))
    ts = parts.get("ts", "")
    received_hmac = parts.get("h1", "")
    if not ts or not received_hmac:
        return False
    signed_payload = f"{ts}:{payload.decode('utf-8')}".encode("utf-8")
    expected = hmac.new(
        PADDLE_WEBHOOK_SECRET.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, received_hmac)


async def process_webhook_event(event: dict[str, Any], db: AsyncSession) -> None:
    """
    Dispatch a Paddle webhook event.

    Events of interest:
      - transaction.completed     → grant addon or activate subscription
      - subscription.activated    → set tier on user
      - subscription.updated      → update period / status
      - subscription.canceled     → mark cancellation pending
      - subscription.past_due     → mark past_due
    """
    event_type = event.get("event_type", "")
    data = event.get("data", {}) or {}
    handler = _HANDLERS.get(event_type)
    if not handler:
        logger.info("Paddle webhook: unhandled event type %s", event_type)
        return
    await handler(data, db)


async def _handle_transaction_completed(data: dict[str, Any], db: AsyncSession) -> None:
    custom = data.get("custom_data") or {}
    user_id = custom.get("user_id")
    price_key = custom.get("price_key")
    if not user_id or not price_key:
        logger.warning("transaction.completed missing custom_data")
        return

    user = await db.get(User, int(user_id))
    if not user:
        return

    # Track Paddle customer/subscription IDs for portal access.
    if customer_id := data.get("customer_id"):
        user.paddle_customer_id = customer_id

    if price_key in ADDON_KEYS:
        purchase = Purchase(
            user_id=user.id,
            reading_type=price_key.removeprefix("addon_"),
            has_content=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(purchase)

    payment = Payment(
        user_id=user.id,
        provider="paddle",
        provider_id=data.get("id"),
        amount_cents=int((data.get("details") or {}).get("totals", {}).get("grand_total", 0)),
        currency=(data.get("currency_code") or "USD").upper(),
        price_key=price_key,
        created_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    await db.commit()


async def _handle_subscription_activated(data: dict[str, Any], db: AsyncSession) -> None:
    await _apply_subscription(data, db, status_override="active")


async def _handle_subscription_updated(data: dict[str, Any], db: AsyncSession) -> None:
    await _apply_subscription(data, db)


async def _handle_subscription_canceled(data: dict[str, Any], db: AsyncSession) -> None:
    await _apply_subscription(data, db, status_override="canceled")


async def _handle_subscription_past_due(data: dict[str, Any], db: AsyncSession) -> None:
    await _apply_subscription(data, db, status_override="past_due")


async def _apply_subscription(
    data: dict[str, Any],
    db: AsyncSession,
    status_override: str | None = None,
) -> None:
    custom = data.get("custom_data") or {}
    user_id = custom.get("user_id")
    if not user_id:
        return

    user = await db.get(User, int(user_id))
    if not user:
        return

    items = data.get("items") or []
    price_key = None
    for item in items:
        # When activated, our price_key flows through custom_data; on later
        # updates, derive from the price_id by reverse-lookup.
        pid = (item.get("price") or {}).get("id") or item.get("price_id")
        if not pid:
            continue
        for k, v in PRICE_MAP.items():
            if v == pid:
                price_key = k
                break
        if price_key:
            break
    price_key = price_key or custom.get("price_key")

    if price_key in TIER_FROM_PRICE_KEY:
        user.tier = TIER_FROM_PRICE_KEY[price_key]

    user.subscription_status = status_override or data.get("status", "active")
    user.subscription_id = data.get("id")
    user.paddle_customer_id = data.get("customer_id") or user.paddle_customer_id
    period_end = (data.get("current_billing_period") or {}).get("ends_at")
    if period_end:
        user.subscription_period_end = period_end

    # Honor cancel-at-period-end flag
    sched = data.get("scheduled_change") or {}
    user.cancel_at_period_end = sched.get("action") == "cancel"

    if status_override == "canceled" and not user.cancel_at_period_end:
        user.tier = "free"

    await db.commit()


_HANDLERS = {
    "transaction.completed":     _handle_transaction_completed,
    "subscription.activated":    _handle_subscription_activated,
    "subscription.updated":      _handle_subscription_updated,
    "subscription.canceled":     _handle_subscription_canceled,
    "subscription.past_due":     _handle_subscription_past_due,
}
