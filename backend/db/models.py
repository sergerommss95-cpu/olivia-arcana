"""Database models — User + saved charts + payments."""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship, DeclarativeBase
from datetime import datetime, timezone


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
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

    # ── Payment & Subscription ──
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True)
    subscription_tier = Column(String(20), default="free")  # "free" | "vip"
    subscription_status = Column(String(20), default="none")  # "none" | "active" | "past_due" | "canceled" | "trialing"
    subscription_stripe_id = Column(String(255), nullable=True)  # Stripe subscription ID
    subscription_current_period_end = Column(DateTime, nullable=True)
    subscription_cancel_at_period_end = Column(Boolean, default=False)

    # ── Daily limits (website) ──
    free_messages_today = Column(Integer, default=0)
    free_messages_date = Column(String(10), nullable=True)  # "2026-04-12"

    charts = relationship("SavedChart", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    purchases = relationship("Purchase", back_populates="user")

    @property
    def is_vip(self) -> bool:
        """Check if user has active VIP subscription with 3-day grace period."""
        if self.subscription_tier != "vip":
            return False
        if self.subscription_status in ("active", "trialing"):
            return True
        # 3-day grace period for past_due or recently canceled
        if self.subscription_current_period_end:
            from datetime import timedelta
            grace_end = self.subscription_current_period_end + timedelta(days=3)
            return datetime.now(timezone.utc) < grace_end
        return False


class SavedChart(Base):
    __tablename__ = "saved_charts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chart_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="charts")


class Payment(Base):
    """Immutable payment ledger — one row per Stripe checkout session."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stripe_session_id = Column(String(255), nullable=True, unique=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    type = Column(String(20), nullable=False)  # "subscription" | "one_time"
    product = Column(String(50), nullable=False)  # "vip_monthly" | "vip_annual" | "birth_chart" | etc.
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(3), default="usd")
    status = Column(String(20), default="pending")  # "pending" | "completed" | "failed" | "refunded"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="payments")
    purchase = relationship("Purchase", back_populates="payment", uselist=False)


class Purchase(Base):
    """Tracks one-time reading purchases and their generated content."""
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    reading_type = Column(String(50), nullable=False)  # "birth_chart" | "compatibility" | "celtic_cross" | "year_ahead" | "video_reading"
    reading_data = Column(Text, nullable=True)  # JSON content generated after payment
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="purchases")
    payment = relationship("Payment", back_populates="purchase")
