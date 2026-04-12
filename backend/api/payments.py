"""Payment endpoints — Stripe checkout, webhooks, billing portal, status."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import User, Payment, Purchase
from api.auth import get_current_user
from services.stripe_service import (
    create_checkout_session,
    create_portal_session,
    verify_webhook,
    process_webhook_event,
    SUBSCRIPTION_PRODUCTS,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Schemas ──

class CheckoutRequest(BaseModel):
    price_key: str  # "vip_monthly" | "vip_annual" | "birth_chart" | etc.
    success_url: str | None = None
    cancel_url: str | None = None


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


class SubscriptionStatus(BaseModel):
    tier: str               # "free" | "vip"
    status: str             # "none" | "active" | "trialing" | "past_due" | "canceled"
    is_vip: bool
    period_end: str | None  # ISO datetime
    cancel_at_period_end: bool
    purchases: list[dict]


# ── Helpers ──

async def _get_authenticated_user(authorization: str, db: AsyncSession) -> User:
    """Extract and validate JWT from Authorization header."""
    token = authorization.replace("Bearer ", "").strip() if authorization else ""
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    return await get_current_user(token, db)


# ── Endpoints ──

@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(
    req: CheckoutRequest,
    authorization: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session and return the URL."""
    user = await _get_authenticated_user(authorization, db)

    # Prevent duplicate active subscriptions
    if req.price_key in SUBSCRIPTION_PRODUCTS and user.is_vip:
        raise HTTPException(
            status_code=400,
            detail="You already have an active VIP subscription. Use the billing portal to manage it.",
        )

    try:
        checkout_url = await create_checkout_session(
            user=user,
            price_key=req.price_key,
            success_url=req.success_url,
            cancel_url=req.cancel_url,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Checkout creation failed: {e}")
        raise HTTPException(status_code=500, detail="Could not create checkout session")

    return CheckoutResponse(checkout_url=checkout_url)


@router.post("/webhook")
async def webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events. No auth — verified by Stripe signature."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = verify_webhook(payload, sig_header)
    except Exception as e:
        logger.warning(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        await process_webhook_event(event, db)
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

    return {"status": "ok"}


@router.get("/status", response_model=SubscriptionStatus)
async def status(
    authorization: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's subscription status and purchases."""
    user = await _get_authenticated_user(authorization, db)

    # Get purchases
    result = await db.execute(
        select(Purchase).where(Purchase.user_id == user.id).order_by(Purchase.created_at.desc())
    )
    purchases = result.scalars().all()

    return SubscriptionStatus(
        tier=user.subscription_tier or "free",
        status=user.subscription_status or "none",
        is_vip=user.is_vip,
        period_end=user.subscription_current_period_end.isoformat() if user.subscription_current_period_end else None,
        cancel_at_period_end=user.subscription_cancel_at_period_end or False,
        purchases=[
            {
                "id": p.id,
                "reading_type": p.reading_type,
                "has_content": p.reading_data is not None,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in purchases
        ],
    )


@router.post("/portal", response_model=PortalResponse)
async def portal(
    authorization: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Customer Portal session for billing management."""
    user = await _get_authenticated_user(authorization, db)

    if not user.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No billing account found. Subscribe first.",
        )

    try:
        portal_url = await create_portal_session(user, db)
    except Exception as e:
        logger.error(f"Portal creation failed: {e}")
        raise HTTPException(status_code=500, detail="Could not create billing portal")

    return PortalResponse(portal_url=portal_url)
