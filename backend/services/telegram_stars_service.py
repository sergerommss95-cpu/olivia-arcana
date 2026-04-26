"""
Telegram Stars (XTR) integration — in-bot purchases.

Used by @OliviaArcanaBot when a user clicks a "pay with Telegram Stars" link
on the website (the deep-link is `t.me/OliviaArcanaBot?start=pay_<priceKey>`).

Flow:
  1. User taps the link → bot receives `/start pay_<priceKey>`.
  2. Bot calls `send_invoice` with currency="XTR" and prices in Stars.
  3. Telegram fires `pre_checkout_query` → bot answers ok=True.
  4. On `successful_payment` → call `mark_payment_complete()` here.

Star prices are set independently of USD because Telegram converts at its own
rate; we approximate parity at ~$0.013 per Star and round up.

Environment:
  TELEGRAM_BOT_TOKEN_EN — primary bot for Stars (one bot, all locales).
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User, Payment, Purchase

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN_EN", "")
TELEGRAM_API = "https://api.telegram.org"


# ── Star pricing (approximate USD parity, rounded) ──
# 1 Star ≈ $0.013, so $4.99 ≈ 384 Stars. Round up to friendly numbers.

STAR_PRICES: dict[str, int] = {
    # Subscriptions — Telegram Stars subscriptions are still rolling out;
    # for now we sell as one-month passes and re-charge monthly via the bot.
    "insight_monthly":  399,
    "insight_annual":   3199,
    "premium_monthly":  1199,
    "premium_annual":   9499,
    "vip_monthly":      2799,
    "vip_annual":       23999,
    # Addons (one-time)
    "addon_birth_chart":   799,
    "addon_compatibility": 799,
    "addon_celtic_cross":  399,
    "addon_year_ahead":    1599,
    "addon_solar_return":  1199,
    "addon_video_reading": 3999,
}

PRODUCT_TITLES: dict[str, str] = {
    "insight_monthly":  "Olivia Insight — 1 month",
    "insight_annual":   "Olivia Insight — 1 year",
    "premium_monthly":  "Olivia Premium — 1 month",
    "premium_annual":   "Olivia Premium — 1 year",
    "vip_monthly":      "Olivia VIP — 1 month",
    "vip_annual":       "Olivia VIP — 1 year",
    "addon_birth_chart":   "Full Natal Chart Reading",
    "addon_compatibility": "Synastry Report",
    "addon_celtic_cross":  "Celtic Cross Tarot",
    "addon_year_ahead":    "Year-Ahead Forecast",
    "addon_solar_return":  "Solar Return Reading",
    "addon_video_reading": "30-min Video Reading",
}

SUBSCRIPTION_KEYS = {
    k for k in STAR_PRICES if not k.startswith("addon_")
}

TIER_FROM_PRICE_KEY: dict[str, str] = {
    "insight_monthly":  "insight",
    "insight_annual":   "insight",
    "premium_monthly":  "premium",
    "premium_annual":   "premium",
    "vip_monthly":      "vip",
    "vip_annual":       "vip",
}


# ── Bot calls ──

async def send_invoice(
    *,
    chat_id: int,
    user_id: int,
    price_key: str,
) -> dict[str, Any]:
    """
    Send a Stars invoice to a user. Call this from the bot's `/start pay_*`
    handler. Returns the Telegram API response payload.
    """
    if price_key not in STAR_PRICES:
        raise ValueError(f"Unknown price_key: {price_key}")
    if not TELEGRAM_BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN_EN not set")

    title = PRODUCT_TITLES[price_key]
    star_amount = STAR_PRICES[price_key]
    payload = {
        "chat_id": chat_id,
        "title": title,
        "description": f"{title} — paid with Telegram Stars.",
        # `payload` is echoed back on successful_payment so we can identify
        # the user + sku without trusting client state.
        "payload": f"u={user_id}|k={price_key}",
        "currency": "XTR",
        "prices": [{"label": title, "amount": star_amount}],
        # provider_token must be empty string for Stars
        "provider_token": "",
    }

    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.post(
            f"{TELEGRAM_API}/bot{TELEGRAM_BOT_TOKEN}/sendInvoice",
            json=payload,
        )
        if r.status_code >= 300:
            logger.error("sendInvoice failed: %s %s", r.status_code, r.text)
            raise RuntimeError(f"sendInvoice returned {r.status_code}")
        return r.json()


async def answer_pre_checkout(query_id: str, ok: bool = True, error_message: str | None = None) -> None:
    """
    Telegram fires pre_checkout_query before charging. We must answer within
    10 seconds. Call ok=True unless we want to refuse the sale.
    """
    if not TELEGRAM_BOT_TOKEN:
        return
    payload: dict[str, Any] = {"pre_checkout_query_id": query_id, "ok": ok}
    if not ok and error_message:
        payload["error_message"] = error_message
    async with httpx.AsyncClient(timeout=10.0) as http:
        await http.post(
            f"{TELEGRAM_API}/bot{TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery",
            json=payload,
        )


async def refund_star_payment(*, user_telegram_id: int, telegram_payment_charge_id: str) -> bool:
    """
    Refund a completed Stars purchase through Telegram's API.
    Window: ~21 days from the purchase per Telegram docs.
    """
    if not TELEGRAM_BOT_TOKEN:
        return False
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.post(
            f"{TELEGRAM_API}/bot{TELEGRAM_BOT_TOKEN}/refundStarPayment",
            json={
                "user_id": user_telegram_id,
                "telegram_payment_charge_id": telegram_payment_charge_id,
            },
        )
        return r.status_code < 300


# ── Successful payment handler ──

async def mark_payment_complete(
    *,
    db: AsyncSession,
    invoice_payload: str,
    telegram_payment_charge_id: str,
    star_amount: int,
    telegram_user_id: int,
) -> None:
    """
    Called from the bot's successful_payment handler.

    `invoice_payload` is the string we put on send_invoice — `u=<id>|k=<key>`.
    """
    parts = dict(p.split("=", 1) for p in invoice_payload.split("|") if "=" in p)
    user_id = int(parts.get("u", "0") or 0)
    price_key = parts.get("k", "")

    if not user_id or price_key not in STAR_PRICES:
        logger.warning("Stars payment with bad payload: %s", invoice_payload)
        return

    user = await db.get(User, user_id)
    if not user:
        logger.warning("Stars payment for unknown user_id %s", user_id)
        return

    user.telegram_user_id = telegram_user_id

    if price_key in SUBSCRIPTION_KEYS:
        user.tier = TIER_FROM_PRICE_KEY[price_key]
        user.subscription_status = "active"
        # Stars subscriptions: we manage period manually via cron in the bot.
        user.subscription_id = telegram_payment_charge_id
        user.cancel_at_period_end = False
        # NOTE: caller should also set subscription_period_end based on the
        # cadence (monthly = +30d, annual = +365d).
    elif price_key.startswith("addon_"):
        purchase = Purchase(
            user_id=user.id,
            reading_type=price_key.removeprefix("addon_"),
            has_content=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(purchase)

    payment = Payment(
        user_id=user.id,
        provider="telegram_stars",
        provider_id=telegram_payment_charge_id,
        amount_cents=int(star_amount),  # stored as Stars, not cents
        currency="XTR",
        price_key=price_key,
        created_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    await db.commit()
