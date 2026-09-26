"""
Database models — User + saved charts + payments.

Subscription model:
  tier: "free" | "insight" | "premium" | "vip"
  provider: "paddle" | "telegram_stars" | None
  payment ledger entries reference provider + provider_id

Stripe is BANNED for tarot — see LLC Guide. Migrating: legacy fields
(stripe_customer_id, subscription_stripe_id, subscription_current_period_end,
subscription_tier, subscription_cancel_at_period_end) are kept temporarily as
nullable for the data migration window. New code should use the new fields.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    # Google sign-in via Supabase: password_hash kept nullable for legacy users
    # but no new accounts use it.
    password_hash = Column(String(255), nullable=True)
    google_sub = Column(String(255), nullable=True, unique=True, index=True)
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Birth data
    birth_year = Column(Integer, nullable=True)
    birth_month = Column(Integer, nullable=True)
    birth_day = Column(Integer, nullable=True)
    birth_hour = Column(Integer, nullable=True)
    birth_minute = Column(Integer, nullable=True)
    birth_city = Column(String(100), nullable=True)
    birth_lat = Column(Float, nullable=True)
    birth_lon = Column(Float, nullable=True)
    birth_tz = Column(Float, nullable=True)

    # Computed chart summary
    sun_sign = Column(String(20), nullable=True)
    moon_sign = Column(String(20), nullable=True)
    rising_sign = Column(String(20), nullable=True)

    # ── Subscription (provider-agnostic) ──
    tier = Column(String(20), default="free")  # "free" | "insight" | "premium" | "vip"
    subscription_status = Column(String(20), default="none")  # none | active | trialing | past_due | canceled
    subscription_id = Column(String(255), nullable=True)  # Paddle sub ID OR Telegram payment charge id
    subscription_period_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)

    # ── Provider IDs ──
    paddle_customer_id = Column(String(255), nullable=True, unique=True, index=True)
    telegram_user_id = Column(Integer, nullable=True, unique=True, index=True)

    # ── Legacy Stripe fields (deprecated; do not write) ──
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True)
    subscription_tier = Column(String(20), nullable=True)  # legacy: "free" | "vip"
    subscription_stripe_id = Column(String(255), nullable=True)
    subscription_current_period_end = Column(DateTime, nullable=True)
    subscription_cancel_at_period_end = Column(Boolean, nullable=True)

    # ── Daily limits (website) ──
    free_messages_today = Column(Integer, default=0)
    free_messages_date = Column(String(10), nullable=True)

    charts = relationship("SavedChart", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    purchases = relationship("Purchase", back_populates="user")

    # ── Tier helpers ──

    _TIER_RANK = {"free": 0, "insight": 1, "premium": 2, "vip": 3}

    def has_tier(self, required: str) -> bool:
        """True if user's effective tier is >= required (with 3-day grace)."""
        if self._effective_tier_rank() >= self._TIER_RANK.get(required, 0):
            return True
        return False

    def _effective_tier_rank(self) -> int:
        rank = self._TIER_RANK.get(self.tier or "free", 0)
        if rank == 0:
            return 0
        if self.subscription_status in ("active", "trialing"):
            return rank
        # 3-day grace for past_due / recently canceled
        if self.subscription_period_end:
            grace_end = self.subscription_period_end + timedelta(days=3)
            if datetime.now(timezone.utc) < grace_end:
                return rank
        return 0

    @property
    def is_paid(self) -> bool:
        return self._effective_tier_rank() > 0

    @property
    def is_premium_or_above(self) -> bool:
        return self.has_tier("premium")

    @property
    def is_vip(self) -> bool:
        return self.has_tier("vip")


class SavedChart(Base):
    __tablename__ = "saved_charts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chart_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="charts")


class Payment(Base):
    """
    Immutable payment ledger — one row per Paddle transaction or Stars charge.
    """
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(20), nullable=False)  # "paddle" | "telegram_stars"
    provider_id = Column(String(255), nullable=True, unique=True)  # Paddle txn id or Telegram charge id
    price_key = Column(String(50), nullable=False)  # "premium_annual" | "addon_birth_chart" | etc.
    amount_cents = Column(Integer, nullable=False)  # Stars stored as raw star count
    currency = Column(String(3), default="USD")
    status = Column(String(20), default="completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Legacy Stripe-only fields (deprecated)
    stripe_session_id = Column(String(255), nullable=True, unique=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    type = Column(String(20), nullable=True)  # legacy: "subscription" | "one_time"
    product = Column(String(50), nullable=True)  # legacy alias of price_key

    user = relationship("User", back_populates="payments")
    purchase = relationship("Purchase", back_populates="payment", uselist=False)


class Purchase(Base):
    """Tracks one-time addon purchases and their generated content."""
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    reading_type = Column(String(50), nullable=False)
    has_content = Column(Boolean, default=False)
    reading_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="purchases")
    payment = relationship("Payment", back_populates="purchase")
