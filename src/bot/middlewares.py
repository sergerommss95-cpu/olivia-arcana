"""Aiogram middlewares — rate limiting, user tracking, analytics."""

import logging
from datetime import datetime
from typing import Callable, Any, Awaitable

from aiogram import BaseMiddleware
from aiogram.types import Message, CallbackQuery, Update

from src.config import BotConfig
from src.db.repository import Repository

logger = logging.getLogger(__name__)


class UserTrackingMiddleware(BaseMiddleware):
    """Ensures every message sender has a user record and updates last_active."""

    def __init__(self, config: BotConfig, repo: Repository):
        self.config = config
        self.repo = repo

    async def __call__(
        self,
        handler: Callable[[Message, dict[str, Any]], Awaitable[Any]],
        event: Message,
        data: dict[str, Any],
    ) -> Any:
        if not hasattr(event, "from_user") or event.from_user is None:
            return await handler(event, data)

        tg_user = event.from_user
        user = await self.repo.get_or_create_user(
            user_id=tg_user.id,
            language=self.config.lang,
            name=tg_user.full_name,
        )
        await self.repo.update_user(user.user_id, last_active_at=datetime.utcnow())

        # Inject user and repo into handler data
        data["db_user"] = user
        data["repo"] = self.repo
        data["config"] = self.config

        return await handler(event, data)


class RateLimitMiddleware(BaseMiddleware):
    """Enforces free-tier message limits."""

    def __init__(self, config: BotConfig, repo: Repository):
        self.config = config
        self.repo = repo
        self.daily_limit = config.free_tier.get("messages_per_day", 5)

    async def __call__(
        self,
        handler: Callable[[Message, dict[str, Any]], Awaitable[Any]],
        event: Message,
        data: dict[str, Any],
    ) -> Any:
        if not isinstance(event, Message) or not event.text:
            return await handler(event, data)

        # Skip rate limiting for commands
        if event.text.startswith("/"):
            return await handler(event, data)

        user = data.get("db_user")
        if user is None:
            return await handler(event, data)

        # VIP users bypass rate limiting
        if user.is_vip:
            return await handler(event, data)

        # Check free message quota
        can_send = await self.repo.check_free_messages(user.user_id, self.daily_limit)
        if not can_send:
            await event.answer(
                f"You've used your {self.daily_limit} free messages for today. 🌙\n\n"
                f"Unlock unlimited conversations with VIP — "
                f"plus daily personal readings, transit alerts, and more.\n\n"
                f"Type /subscribe to learn more.",
            )
            return

        # Increment counter
        await self.repo.increment_free_messages(user.user_id)
        return await handler(event, data)


class AnalyticsMiddleware(BaseMiddleware):
    """Logs events for analytics tracking."""

    def __init__(self, repo: Repository):
        self.repo = repo

    async def __call__(
        self,
        handler: Callable[[Message, dict[str, Any]], Awaitable[Any]],
        event: Message,
        data: dict[str, Any],
    ) -> Any:
        user = data.get("db_user")
        if user and isinstance(event, Message) and event.text:
            await self.repo.log_event(user.user_id, "message_sent", {
                "text_length": len(event.text),
                "is_command": event.text.startswith("/"),
            })

        return await handler(event, data)
