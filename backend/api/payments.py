"""
Payment endpoints — Paddle (web) + Telegram Stars (in-bot).

Stripe is BANNED for tarot/psychic/occult. See LLC Guide.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import User, Purchase
from api.auth import get_current_user
from services.paddle_service import (
    create_checkout_session as paddle_create_checkout,
    create_portal_session as paddle_create_portal,
    verify_webhook as paddle_verify_webhook,
    process_webhook_event as paddle_process_webhook,
    SUBSCRIPTION_KEYS,
)
from services.telegram_stars_service import (
    send_invoice as stars_send_invoice,
    STAR_PRICES,
    PRODUCT_TITLES as STAR_PRODUCT_TITLES,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Schemas ──

class CheckoutRequest(BaseModel):
    price_key: str
    success_url: str | None = None
    cancel_url: str | None = None


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


class StarsInvoiceRequest(BaseModel):
    price_key: str
    chat_id: int


class SubscriptionStatusResponse(BaseModel):
    tier: str
    status: str
    is_paid: bool
    period_end: str | None
    cancel_at_period_end: bool
    provider: str | None
    purchases: list[dict]


# ── Helpers ──

async def _get_authenticated_user(authorization: str, db: AsyncSession) -> User:
    token = authorization.replace("Bearer ", "").strip() if authorization else ""
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    return await get_current_user(token, db)


# ── Paddle: web checkout ──

@router.post("/paddle/checkout", response_model=CheckoutResponse)
async def paddle_checkout(
    req: CheckoutRequest,
    authorization: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Create a Paddle hosted-checkout session."""
    user = await _get_authenticated_user(authorization, db)

    if req.price_key in SUBSCRIPTION_KEYS and (user.tier or "free") != "free":
        raise HTTPException(
            status_code=400,
            detail="You already have an active subscription. Use the billing portal to change plan.",
        )

    try:
        checkout_url = await paddle_create_checkout(
            user=user,
            price_key=req.price_key,
            success_url=req.success_url or "",
            cancel_url=req.cancel_url or "",
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Paddle checkout failed")
        raise HTTPException(status_code=500, detail=str(e))

    return CheckoutResponse(checkout_url=checkout_url)


@router.post("/paddle/portal", response_model=PortalResponse)
async def paddle_portal(
    authorization: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Generate a Paddle customer portal link."""
    user = await _get_authenticated_user(authorization, db)
    if not getattr(user, "paddle_customer_id", None):
        raise HTTPException(status_code=400, detail="No Paddle customer record yet.")
    try:
        portal_url = await paddle_create_portal(user=user, db=db)
    except Exception as e:
        logger.exception("Paddle portal failed")
        raise HTTPException(status_code=500, detail=str(e))
    return PortalResponse(portal_url=portal_url)


@router.post("/paddle/webhook")
async def paddle_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive Paddle webhooks. Verified by HMAC signature."""
    payload = await request.body()
    sig = request.headers.get("paddle-signature", "")
    if not paddle_verify_webhook(payload, sig):
        raise HTTPException(status_code=400, detail="Invalid signature")
    try:
        event = json.loads(payload)
        await paddle_process_webhook(event, db)
    except Exception:
        logger.exception("Paddle webhook processing error")
        raise HTTPException(status_code=500, detail="Webhook processing failed")
    return {"status": "ok"}


# ── Telegram Stars: in-bot invoice trigger ──

@router.post("/stars/invoice")
async def stars_invoice(
    req: StarsInvoiceRequest,
    authorization: str = "",
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a Telegram Stars invoice for the authenticated user.

    The bot receives this and dispatches sendInvoice. The actual successful_payment
    handling lives in the bot itself (it calls services.telegram_stars_service.mark_payment_complete).
    """
    user = await _get_authenticated_user(authorization, db)

    if req.price_key not in STAR_PRICES:
        raise HTTPException(status_code=400, detail="Unknown price_key")

    try:
        await stars_send_invoice(chat_id=req.chat_id, user_id=user.id, price_key=req.price_key)
    except Exception as e:
        logger.exception("Stars invoice failed")
        raise HTTPException(status_code=500, detail=str(e))

    return {"ok": True, "title": STAR_PRODUCT_TITLES[req.price_key], "stars": STAR_PRICES[req.price_key]}


# ── Subscription status (provider-agnostic) ──

@router.get("/status", response_model=SubscriptionStatusResponse)
async def status(
    authorization: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's subscription status + purchases."""
    user = await _get_authenticated_user(authorization, db)

    result = await db.execute(
        select(Purchase).where(Purchase.user_id == user.id).order_by(Purchase.created_at.desc())
    )
    purchases = result.scalars().all()

    tier = user.tier or "free"
    is_paid = tier != "free"

    # Provider hint — paddle if a paddle id is set, else telegram_stars if a TG one is set.
    provider: str | None = None
    if getattr(user, "paddle_customer_id", None):
        provider = "paddle"
    elif getattr(user, "telegram_user_id", None):
        provider = "telegram_stars"

    period_end = getattr(user, "subscription_period_end", None)
    if hasattr(period_end, "isoformat"):
        period_end = period_end.isoformat()

    return SubscriptionStatusResponse(
        tier=tier,
        status=user.subscription_status or "none",
        is_paid=is_paid,
        period_end=period_end,
        cancel_at_period_end=bool(getattr(user, "cancel_at_period_end", False)),
        provider=provider,
        purchases=[
            {
                "id": p.id,
                "reading_type": p.reading_type,
                "has_content": getattr(p, "has_content", None) if hasattr(p, "has_content") else (p.reading_data is not None if hasattr(p, "reading_data") else False),
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in purchases
        ],
    )
