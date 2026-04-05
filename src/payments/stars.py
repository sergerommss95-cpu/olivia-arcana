"""Telegram Stars payment integration."""

import logging
from typing import Optional

from aiogram import Bot
from aiogram.types import LabeledPrice, Message

logger = logging.getLogger(__name__)


async def send_stars_invoice(
    bot: Bot,
    chat_id: int,
    title: str,
    description: str,
    payload: str,
    amount_stars: int,
) -> Message:
    """Send a Stars payment invoice to the user.

    payload format: "{type}:{id}" e.g. "reading:42" or "subscription:monthly"
    """
    return await bot.send_invoice(
        chat_id=chat_id,
        title=title,
        description=description,
        payload=payload,
        provider_token="",  # Empty for Stars
        currency="XTR",  # Telegram Stars currency code
        prices=[LabeledPrice(label=title, amount=amount_stars)],
    )


async def send_reading_invoice(
    bot: Bot,
    chat_id: int,
    reading_id: int,
    reading_type: str,
    amount_stars: int,
    language: str = "en",
) -> Message:
    """Send an invoice for a specific reading unlock."""
    titles = {
        "birth_chart": "Full Birth Chart Reading",
        "compatibility": "Cosmic Compatibility Report",
        "celtic_cross": "Celtic Cross Tarot Spread",
        "solar_return": "Solar Return Report",
        "eclipse": "Eclipse Impact Report",
        "retrograde": "Retrograde Survival Guide",
        "year_ahead": "Year-Ahead Cosmic Forecast",
        "video": "Personal Video Reading by Olivia",
        "roast": "The Full Cosmic Autopsy",
    }

    descriptions = {
        "birth_chart": "Your complete natal chart reading based on real planetary positions",
        "compatibility": "Deep synastry analysis of your cosmic connection",
        "celtic_cross": "A full 10-card Celtic Cross spread interpreted personally for you",
        "solar_return": "Your astrological year ahead based on your Solar Return chart",
        "eclipse": "How the upcoming eclipse impacts YOUR specific chart",
        "retrograde": "Your personalized guide to navigating this retrograde",
        "year_ahead": "Comprehensive forecast of the major transits hitting your chart",
        "video": "A personal 5-8 minute video reading by Olivia, just for you",
        "roast": "The brutally honest, no-holds-barred deep dive into your chart's shadow",
    }

    title = titles.get(reading_type, "Astrology Reading")
    description = descriptions.get(reading_type, "A personalized reading from Olivia Arcana")

    return await send_stars_invoice(
        bot=bot,
        chat_id=chat_id,
        title=title,
        description=description,
        payload=f"reading:{reading_id}",
        amount_stars=amount_stars,
    )


async def send_subscription_invoice(
    bot: Bot,
    chat_id: int,
    period: str,
    amount_stars: int,
) -> Message:
    """Send a VIP subscription invoice."""
    if period == "annual":
        title = "Olivia Arcana VIP — Annual"
        description = "365 days of daily personal readings, transit alerts, tarot, and more. 2 months free."
    else:
        title = "Olivia Arcana VIP — Monthly"
        description = "Daily personal readings, transit alerts, weekly tarot, and unlimited chat with Olivia."

    return await send_stars_invoice(
        bot=bot,
        chat_id=chat_id,
        title=title,
        description=description,
        payload=f"subscription:{period}",
        amount_stars=amount_stars,
    )
