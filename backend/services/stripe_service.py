"""Stripe integration service — checkout sessions, webhooks, customer portal."""

import os
import logging
from datetime import datetime, timezone

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User, Payment, Purchase

logger = logging.getLogger(__name__)

# ── Config ──

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

SITE_URL = os.getenv("SITE_URL", "https://oliviaarcana.com")

# Map price keys to Stripe Price IDs (set in Stripe Dashboard → Products)
PRICE_MAP: dict[str, str] = {
    "vip_monthly": os.getenv("STRIPE_PRICE_VIP_MONTHLY", ""),
    "vip_annual": os.getenv("STRIPE_PRICE_VIP_ANNUAL", ""),
    "birth_chart": os.getenv("STRIPE_PRICE_BIRTH_CHART", ""),
    "compatibility": os.getenv("STRIPE_PRICE_COMPATIBILITY", ""),
    "celtic_cross": os.getenv("STRIPE_PRICE_CELTIC_CROSS", ""),
    "year_ahead": os.getenv("STRIPE_PRICE_YEAR_AHEAD", ""),
    "video_reading": os.getenv("STRIPE_PRICE_VIDEO_READING", ""),
}

# Which products are subscriptions vs one-time
SUBSCRIPTION_PRODUCTS = {"vip_monthly", "vip_annual"}


# ── Customer Management ──

async def get_or_create_customer(user: User, db: AsyncSession) -> str:
    """Get existing Stripe customer or create one. Returns customer ID."""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        name=user.name or user.email,
        metadata={"user_id": str(user.id)},
    )

    user.stripe_customer_id = customer.id
    await db.commit()
    return customer.id


# ── Checkout ──

async def create_checkout_session(
    user: User,
    price_key: str,
    success_url: str | None = None,
    cancel_url: str | None = None,
    db: AsyncSession | None = None,
) -> str:
    """Create a Stripe Checkout session. Returns the checkout URL."""
    price_id = PRICE_MAP.get(price_key)
    if not price_id:
        raise ValueError(f"Unknown price key: {price_key}")

    customer_id = await get_or_create_customer(user, db)

    is_subscription = price_key in SUBSCRIPTION_PRODUCTS
    mode = "subscription" if is_subscription else "payment"

    params: dict = {
        "customer": customer_id,
        "mode": mode,
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": success_url or f"{SITE_URL}/checkout/success/?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": cancel_url or f"{SITE_URL}/checkout/cancel/",
        "metadata": {
            "user_id": str(user.id),
            "price_key": price_key,
        },
        "allow_promotion_codes": True,
    }

    # Add 3-day free trial for new VIP subscriptions
    if is_subscription and user.subscription_tier == "free":
        params["subscription_data"] = {
            "trial_period_days": 3,
            "metadata": {"user_id": str(user.id), "price_key": price_key},
        }

    session = stripe.checkout.Session.create(**params)

    # Record pending payment
    if db:
        payment = Payment(
            user_id=user.id,
            stripe_session_id=session.id,
            type="subscription" if is_subscription else "one_time",
            product=price_key,
            amount_cents=session.amount_total or 0,
            currency=(session.currency or "usd").lower(),
            status="pending",
        )
        db.add(payment)
        await db.commit()

    return session.url


# ── Customer Portal ──

async def create_portal_session(user: User, db: AsyncSession) -> str:
    """Create a Stripe Customer Portal session for billing management."""
    if not user.stripe_customer_id:
        raise ValueError("User has no Stripe customer record")

    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{SITE_URL}/account/billing/",
    )
    return session.url


# ── Webhook Handling ──

def verify_webhook(payload: bytes, sig_header: str) -> stripe.Event:
    """Verify and parse a Stripe webhook event."""
    return stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)


async def handle_checkout_completed(event: stripe.Event, db: AsyncSession) -> None:
    """Handle checkout.session.completed — activate subscription or record purchase."""
    session = event.data.object
    user_id = int(session.metadata.get("user_id", 0))
    price_key = session.metadata.get("price_key", "")

    if not user_id:
        logger.warning("Checkout completed without user_id in metadata")
        return

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        logger.warning(f"Checkout completed for unknown user_id={user_id}")
        return

    # Update payment record
    pay_result = await db.execute(
        select(Payment).where(Payment.stripe_session_id == session.id)
    )
    payment = pay_result.scalar_one_or_none()
    if payment:
        payment.status = "completed"
        payment.stripe_payment_intent_id = session.payment_intent
        payment.amount_cents = session.amount_total or payment.amount_cents

    if price_key in SUBSCRIPTION_PRODUCTS:
        # Subscription checkout — get subscription details
        subscription_id = session.subscription
        if subscription_id:
            sub = stripe.Subscription.retrieve(subscription_id)
            user.subscription_tier = "vip"
            user.subscription_status = sub.status  # "active" or "trialing"
            user.subscription_stripe_id = subscription_id
            user.subscription_current_period_end = datetime.fromtimestamp(
                sub.current_period_end, tz=timezone.utc
            )
            user.subscription_cancel_at_period_end = sub.cancel_at_period_end
    else:
        # One-time purchase — create purchase record
        if payment:
            purchase = Purchase(
                user_id=user_id,
                payment_id=payment.id,
                reading_type=price_key,
            )
            db.add(purchase)

    await db.commit()
    logger.info(f"Checkout completed: user={user_id}, product={price_key}")


async def handle_subscription_updated(event: stripe.Event, db: AsyncSession) -> None:
    """Handle customer.subscription.updated — sync tier/status."""
    sub = event.data.object
    customer_id = sub.customer

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        logger.warning(f"Subscription updated for unknown customer={customer_id}")
        return

    user.subscription_status = sub.status
    user.subscription_stripe_id = sub.id
    user.subscription_current_period_end = datetime.fromtimestamp(
        sub.current_period_end, tz=timezone.utc
    )
    user.subscription_cancel_at_period_end = sub.cancel_at_period_end

    # If subscription is active/trialing, ensure tier is VIP
    if sub.status in ("active", "trialing"):
        user.subscription_tier = "vip"

    await db.commit()
    logger.info(f"Subscription updated: user={user.id}, status={sub.status}")


async def handle_subscription_deleted(event: stripe.Event, db: AsyncSession) -> None:
    """Handle customer.subscription.deleted — downgrade to free."""
    sub = event.data.object
    customer_id = sub.customer

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        return

    user.subscription_status = "canceled"
    # Keep tier as "vip" until period_end + grace (is_vip property handles this)
    user.subscription_current_period_end = datetime.fromtimestamp(
        sub.current_period_end, tz=timezone.utc
    )

    await db.commit()
    logger.info(f"Subscription deleted: user={user.id}")


async def handle_invoice_payment_failed(event: stripe.Event, db: AsyncSession) -> None:
    """Handle invoice.payment_failed — mark as past_due."""
    invoice = event.data.object
    customer_id = invoice.customer

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        return

    user.subscription_status = "past_due"
    await db.commit()
    logger.info(f"Payment failed: user={user.id}")


# ── Master Webhook Router ──

WEBHOOK_HANDLERS = {
    "checkout.session.completed": handle_checkout_completed,
    "customer.subscription.updated": handle_subscription_updated,
    "customer.subscription.deleted": handle_subscription_deleted,
    "invoice.payment_failed": handle_invoice_payment_failed,
}


async def process_webhook_event(event: stripe.Event, db: AsyncSession) -> None:
    """Route a verified webhook event to the appropriate handler."""
    handler = WEBHOOK_HANDLERS.get(event.type)
    if handler:
        await handler(event, db)
    else:
        logger.debug(f"Unhandled Stripe event: {event.type}")
