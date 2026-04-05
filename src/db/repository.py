"""Data access layer — all DB operations go through this class."""

import json
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Optional

from sqlalchemy import select, update, delete, func, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from src.db.models import (
    Base, User, Profile, Conversation, ConversationSummary,
    Reading, Payment, Subscription, Analytics, GeocodeCache,
)


class Repository:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self.engine = create_async_engine(
            f"sqlite+aiosqlite:///{db_path}",
            echo=False,
        )
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

    async def init_db(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # Enable WAL mode for concurrent read/write safety
            await conn.execute(text("PRAGMA journal_mode=WAL"))

    # ── Users ──

    async def get_user(self, user_id: int) -> Optional[User]:
        async with self.session_factory() as session:
            return await session.get(User, user_id)

    async def create_user(self, user_id: int, language: str, name: Optional[str] = None,
                          referral_source: Optional[str] = None,
                          referred_by: Optional[int] = None) -> User:
        user = User(
            user_id=user_id,
            language=language,
            name=name,
            referral_source=referral_source,
            referred_by_user_id=referred_by,
        )
        async with self.session_factory() as session:
            session.add(user)
            await session.commit()
            await session.refresh(user)
            return user

    async def get_or_create_user(self, user_id: int, language: str, name: Optional[str] = None,
                                  referral_source: Optional[str] = None) -> User:
        user = await self.get_user(user_id)
        if user is None:
            user = await self.create_user(user_id, language, name, referral_source)
        return user

    async def update_user(self, user_id: int, **kwargs) -> None:
        async with self.session_factory() as session:
            await session.execute(
                update(User).where(User.user_id == user_id).values(**kwargs)
            )
            await session.commit()

    async def update_birth_data(self, user_id: int, birth_date: date,
                                 birth_time: Optional[str], birth_location: str,
                                 lat: float, lng: float, timezone: str,
                                 sun: str, moon: Optional[str], rising: Optional[str]) -> None:
        await self.update_user(
            user_id,
            birth_date=birth_date,
            birth_time=birth_time,
            birth_location=birth_location,
            birth_lat=lat,
            birth_lng=lng,
            timezone=timezone,
            zodiac_sun=sun,
            zodiac_moon=moon,
            zodiac_rising=rising,
        )

    async def check_free_messages(self, user_id: int, daily_limit: int) -> bool:
        """Returns True if user can send a free message, False if limit reached."""
        user = await self.get_user(user_id)
        if user is None:
            return False
        if user.is_vip:
            return True
        today = date.today()
        if user.free_messages_date != today:
            await self.update_user(user_id, free_messages_today=0, free_messages_date=today)
            return True
        return user.free_messages_today < daily_limit

    async def increment_free_messages(self, user_id: int) -> None:
        user = await self.get_user(user_id)
        if user is None:
            return
        today = date.today()
        if user.free_messages_date != today:
            await self.update_user(user_id, free_messages_today=1, free_messages_date=today)
        else:
            await self.update_user(user_id, free_messages_today=user.free_messages_today + 1)

    # ── Profiles ──

    async def add_profile(self, user_id: int, name: str, birth_date: date,
                          birth_time: Optional[str], birth_location: str,
                          lat: float, lng: float, sun: str,
                          moon: Optional[str], rising: Optional[str],
                          relationship: str) -> Profile:
        profile = Profile(
            user_id=user_id, name=name, birth_date=birth_date,
            birth_time=birth_time, birth_location=birth_location,
            birth_lat=lat, birth_lng=lng, zodiac_sun=sun,
            zodiac_moon=moon, zodiac_rising=rising,
            relation_type=relationship,
        )
        async with self.session_factory() as session:
            session.add(profile)
            await session.commit()
            await session.refresh(profile)
            return profile

    async def get_profiles(self, user_id: int) -> list[Profile]:
        async with self.session_factory() as session:
            result = await session.execute(
                select(Profile).where(Profile.user_id == user_id)
            )
            return list(result.scalars().all())

    # ── Conversations ──

    async def add_message(self, user_id: int, role: str, content: str,
                          tokens_used: int = 0) -> Conversation:
        msg = Conversation(
            user_id=user_id, role=role, content=content, tokens_used=tokens_used,
        )
        async with self.session_factory() as session:
            session.add(msg)
            await session.commit()
            return msg

    async def get_recent_messages(self, user_id: int, limit: int = 10) -> list[Conversation]:
        async with self.session_factory() as session:
            result = await session.execute(
                select(Conversation)
                .where(Conversation.user_id == user_id)
                .order_by(Conversation.created_at.desc())
                .limit(limit)
            )
            messages = list(result.scalars().all())
            messages.reverse()  # oldest first
            return messages

    async def count_messages(self, user_id: int) -> int:
        async with self.session_factory() as session:
            result = await session.execute(
                select(func.count()).where(Conversation.user_id == user_id)
            )
            return result.scalar() or 0

    async def get_oldest_messages(self, user_id: int, limit: int) -> list[Conversation]:
        async with self.session_factory() as session:
            result = await session.execute(
                select(Conversation)
                .where(Conversation.user_id == user_id)
                .order_by(Conversation.created_at.asc())
                .limit(limit)
            )
            return list(result.scalars().all())

    async def delete_messages(self, message_ids: list[int]) -> None:
        async with self.session_factory() as session:
            await session.execute(
                delete(Conversation).where(Conversation.message_id.in_(message_ids))
            )
            await session.commit()

    async def add_summary(self, user_id: int, summary_text: str,
                          messages_covered: str) -> ConversationSummary:
        summary = ConversationSummary(
            user_id=user_id, summary_text=summary_text,
            messages_covered=messages_covered,
        )
        async with self.session_factory() as session:
            session.add(summary)
            await session.commit()
            return summary

    async def get_summaries(self, user_id: int) -> list[ConversationSummary]:
        async with self.session_factory() as session:
            result = await session.execute(
                select(ConversationSummary)
                .where(ConversationSummary.user_id == user_id)
                .order_by(ConversationSummary.created_at.asc())
            )
            return list(result.scalars().all())

    # ── Readings ──

    async def create_reading(self, user_id: int, reading_type: str, content: str,
                              is_locked: bool = False, price_stars: int = 0,
                              price_crypto_usd: float = 0.0,
                              profile_id: Optional[int] = None) -> Reading:
        reading = Reading(
            user_id=user_id, type=reading_type, content=content,
            is_locked=is_locked, price_stars=price_stars,
            price_crypto_usd=price_crypto_usd, profile_id=profile_id,
        )
        async with self.session_factory() as session:
            session.add(reading)
            await session.commit()
            await session.refresh(reading)
            return reading

    async def unlock_reading(self, reading_id: int) -> Optional[Reading]:
        async with self.session_factory() as session:
            reading = await session.get(Reading, reading_id)
            if reading:
                reading.is_locked = False
                reading.unlocked_at = datetime.utcnow()
                await session.commit()
                await session.refresh(reading)
            return reading

    async def get_reading(self, reading_id: int) -> Optional[Reading]:
        async with self.session_factory() as session:
            return await session.get(Reading, reading_id)

    # ── Payments ──

    async def create_payment(self, user_id: int, payment_type: str, method: str,
                              amount_stars: Optional[int] = None,
                              amount_crypto: Optional[float] = None,
                              crypto_currency: Optional[str] = None,
                              reading_id: Optional[int] = None) -> Payment:
        payment = Payment(
            user_id=user_id, type=payment_type, method=method,
            amount_stars=amount_stars, amount_crypto=amount_crypto,
            crypto_currency=crypto_currency, reading_id=reading_id,
        )
        async with self.session_factory() as session:
            session.add(payment)
            await session.commit()
            await session.refresh(payment)
            return payment

    async def update_payment_status(self, payment_id: int, status: str,
                                     telegram_charge_id: Optional[str] = None,
                                     cryptobot_invoice_id: Optional[str] = None) -> None:
        kwargs = {"status": status}
        if telegram_charge_id:
            kwargs["telegram_charge_id"] = telegram_charge_id
        if cryptobot_invoice_id:
            kwargs["cryptobot_invoice_id"] = cryptobot_invoice_id
        async with self.session_factory() as session:
            await session.execute(
                update(Payment).where(Payment.payment_id == payment_id).values(**kwargs)
            )
            await session.commit()

    # ── Subscriptions ──

    async def create_subscription(self, user_id: int, method: str, period: str,
                                   amount_stars: Optional[int] = None,
                                   amount_crypto: Optional[float] = None) -> Subscription:
        if period == "monthly":
            expires_at = datetime.utcnow() + timedelta(days=30)
        else:  # annual
            expires_at = datetime.utcnow() + timedelta(days=365)

        sub = Subscription(
            user_id=user_id, method=method, period=period,
            amount_stars=amount_stars, amount_crypto=amount_crypto,
            expires_at=expires_at,
        )
        async with self.session_factory() as session:
            session.add(sub)
            await session.commit()

        await self.update_user(
            user_id,
            subscription_status="vip",
            subscription_expires_at=expires_at,
            subscription_method=method,
        )
        return sub

    async def cancel_subscription(self, user_id: int) -> None:
        async with self.session_factory() as session:
            result = await session.execute(
                select(Subscription)
                .where(Subscription.user_id == user_id, Subscription.cancelled_at.is_(None))
                .order_by(Subscription.started_at.desc())
                .limit(1)
            )
            sub = result.scalar_one_or_none()
            if sub:
                sub.cancelled_at = datetime.utcnow()
                sub.auto_renew = False
                await session.commit()

    # ── Analytics ──

    async def log_event(self, user_id: int, event_type: str,
                        metadata: Optional[dict] = None) -> None:
        event = Analytics(
            user_id=user_id, event_type=event_type,
            event_metadata=json.dumps(metadata) if metadata else None,
        )
        async with self.session_factory() as session:
            session.add(event)
            await session.commit()

    # ── Geocode Cache ──

    async def get_cached_geocode(self, query: str) -> Optional[GeocodeCache]:
        async with self.session_factory() as session:
            return await session.get(GeocodeCache, query.lower().strip())

    async def cache_geocode(self, query: str, lat: float, lng: float,
                            display_name: str, timezone: Optional[str] = None) -> None:
        entry = GeocodeCache(
            query=query.lower().strip(), lat=lat, lng=lng,
            display_name=display_name, timezone=timezone,
        )
        async with self.session_factory() as session:
            await session.merge(entry)
            await session.commit()

    # ── VIP Queries ──

    async def get_vip_users(self) -> list[User]:
        async with self.session_factory() as session:
            result = await session.execute(
                select(User).where(User.subscription_status == "vip")
            )
            return list(result.scalars().all())

    async def get_inactive_users(self, days: int = 7) -> list[User]:
        threshold = datetime.utcnow() - timedelta(days=days)
        async with self.session_factory() as session:
            result = await session.execute(
                select(User).where(User.last_active_at < threshold)
            )
            return list(result.scalars().all())

    async def get_birthday_users(self, target_date: date) -> list[User]:
        async with self.session_factory() as session:
            result = await session.execute(
                select(User).where(
                    func.strftime("%m-%d", User.birth_date) == target_date.strftime("%m-%d")
                )
            )
            return list(result.scalars().all())
