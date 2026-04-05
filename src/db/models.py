"""SQLAlchemy models — matches the spec database schema."""

from datetime import datetime, date, time
from typing import Optional

from sqlalchemy import (
    Integer, String, Text, Float, Boolean, DateTime, Date, Time,
    ForeignKey, JSON, event
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.orm import relationship as sa_relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)  # Telegram user ID
    language: Mapped[str] = mapped_column(String(5), default="en")
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    birth_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    birth_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    birth_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    birth_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zodiac_sun: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    zodiac_moon: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    zodiac_rising: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    subscription_status: Mapped[str] = mapped_column(String(10), default="free")
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    subscription_method: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    referral_source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    referred_by_user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    free_messages_today: Mapped[int] = mapped_column(Integer, default=0)
    free_messages_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_active_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profiles: Mapped[list["Profile"]] = sa_relationship(back_populates="user", lazy="selectin")
    conversations: Mapped[list["Conversation"]] = sa_relationship(back_populates="user", lazy="selectin")

    @property
    def is_vip(self) -> bool:
        if self.subscription_status != "vip":
            return False
        if self.subscription_expires_at is None:
            return False
        grace_days = 3
        from datetime import timedelta
        return datetime.utcnow() <= self.subscription_expires_at + timedelta(days=grace_days)

    @property
    def has_birth_data(self) -> bool:
        return self.birth_date is not None and self.birth_lat is not None

    @property
    def has_full_birth_data(self) -> bool:
        return self.has_birth_data and self.birth_time is not None


class Profile(Base):
    __tablename__ = "profiles"

    profile_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"))
    name: Mapped[str] = mapped_column(String(255))
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    birth_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    birth_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    birth_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    birth_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    zodiac_sun: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    zodiac_moon: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    zodiac_rising: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    relation_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = sa_relationship(back_populates="profiles")


class Conversation(Base):
    __tablename__ = "conversations"

    message_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"))
    role: Mapped[str] = mapped_column(String(10))  # user / olivia
    content: Mapped[str] = mapped_column(Text)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = sa_relationship(back_populates="conversations")


class ConversationSummary(Base):
    __tablename__ = "conversation_summaries"

    summary_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"))
    summary_text: Mapped[str] = mapped_column(Text)
    messages_covered: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Reading(Base):
    __tablename__ = "readings"

    reading_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"))
    profile_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("profiles.profile_id"), nullable=True)
    type: Mapped[str] = mapped_column(String(30))  # daily/compatibility/celtic_cross/solar_return/eclipse/retrograde/transit_alert/video/roast
    content: Mapped[str] = mapped_column(Text)
    video_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    price_stars: Mapped[int] = mapped_column(Integer, default=0)
    price_crypto_usd: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    unlocked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class Payment(Base):
    __tablename__ = "payments"

    payment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"))
    reading_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("readings.reading_id"), nullable=True)
    type: Mapped[str] = mapped_column(String(20))  # subscription / one_time
    method: Mapped[str] = mapped_column(String(20))  # stars / cryptobot
    amount_stars: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    amount_crypto: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    crypto_currency: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    telegram_charge_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cryptobot_invoice_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Subscription(Base):
    __tablename__ = "subscriptions"

    subscription_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"))
    tier: Mapped[str] = mapped_column(String(10), default="vip")
    method: Mapped[str] = mapped_column(String(20))
    period: Mapped[str] = mapped_column(String(10))  # monthly / annual
    amount_stars: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    amount_crypto: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class Analytics(Base):
    __tablename__ = "analytics"

    event_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"))
    event_type: Mapped[str] = mapped_column(String(50))
    event_metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GeocodeCache(Base):
    __tablename__ = "geocode_cache"

    query: Mapped[str] = mapped_column(String(255), primary_key=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    display_name: Mapped[str] = mapped_column(String(500))
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
