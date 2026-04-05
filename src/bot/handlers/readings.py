"""Handlers for reading requests — birth chart, year-ahead, roast, etc."""

import logging

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command

from src.config import BotConfig
from src.db.repository import Repository
from src.db.models import User
from src.persona.engine import PersonaEngine
from src.persona.context import build_chart_context
from src.payments.manager import PaymentManager
from src.bot.keyboards import reading_types_keyboard, main_menu_keyboard

logger = logging.getLogger(__name__)
router = Router()


@router.message(Command("reading"))
@router.callback_query(F.data == "menu:reading")
async def show_reading_menu(event, db_user: User, **kwargs):
    """Show available reading types."""
    text = (
        "What kind of reading would you like? 🔮\n\n"
        "Choose from the options below:"
    )
    if isinstance(event, CallbackQuery):
        await event.message.edit_text(text, reply_markup=reading_types_keyboard())
        await event.answer()
    else:
        await event.answer(text, reply_markup=reading_types_keyboard())


@router.callback_query(F.data.startswith("reading:"))
async def handle_reading_request(callback: CallbackQuery, db_user: User,
                                  repo: Repository, config: BotConfig):
    """Handle a specific reading type request."""
    reading_type = callback.data.split(":")[1]
    await callback.answer()

    if not db_user.has_birth_data:
        await callback.message.answer(
            "I need your birth data first to cast your chart. "
            "Type /start to begin the onboarding process. 🌙"
        )
        return

    # Check if this is a free or paid reading
    if reading_type == "roast":
        await _generate_roast(callback.message, db_user, repo, config)
    elif reading_type in ("birth_chart", "year_ahead", "solar_return"):
        await _generate_paid_reading(callback.message, db_user, repo, config, reading_type)
    elif reading_type == "video":
        await callback.message.answer(
            "A personal video reading by Olivia — 5-8 minutes of intimate cosmic guidance, "
            "filmed just for you. 🎬\n\n"
            "Tell me: what area of your life needs guidance right now?\n\n"
            "Just describe your situation and I'll prepare your reading."
        )
        # Video flow is handled separately in video.py


@router.message(Command("roast"))
async def cmd_roast(message: Message, db_user: User, repo: Repository, config: BotConfig):
    """Direct /roast command."""
    if not db_user.has_birth_data:
        await message.answer("I need your birth data to roast your chart properly. Type /start first! 🔥")
        return
    await _generate_roast(message, db_user, repo, config)


async def _generate_roast(message: Message, db_user: User, repo: Repository, config: BotConfig):
    """Generate a free zodiac roast."""
    await message.answer("Alright, you asked for it... let me look at your chart with *brutally honest* eyes. 🔥")

    try:
        persona = PersonaEngine(config)
        chart_ctx = build_chart_context(db_user)

        roast_text, tokens = await persona.generate_roast(
            astro_data=chart_ctx,
            user_name=db_user.name or "you",
        )

        # Store as a reading
        await repo.create_reading(
            user_id=db_user.user_id,
            reading_type="roast",
            content=roast_text,
            is_locked=False,
        )

        await message.answer(roast_text)

        # Offer premium roast
        price = config.get_price_stars("roast_premium")
        if price > 0:
            await message.answer(
                "That was the appetizer. Want **The Full Cosmic Autopsy**? 💀\n\n"
                "A comprehensive deep dive into every shadow aspect of your chart. "
                "The kind of reading that's so accurate it's uncomfortable.\n\n"
                f"⭐ {price} Stars",
            )

        await repo.log_event(db_user.user_id, "reading_requested", {"type": "roast"})

    except Exception as e:
        logger.error(f"Roast generation failed: {e}")
        await message.answer("Even the cosmos flinched... let me try that again in a moment. 🌙")


async def _generate_paid_reading(message: Message, db_user: User,
                                  repo: Repository, config: BotConfig, reading_type: str):
    """Generate a reading, lock it, show teaser + payment options."""
    await message.answer("Let me consult the stars... 🔭")

    try:
        persona = PersonaEngine(config)
        chart_ctx = build_chart_context(db_user)

        reading_text, tokens = await persona.generate_reading(
            reading_type=reading_type,
            astro_data=chart_ctx,
            user_context=f"User: {db_user.name or 'dear soul'}",
        )

        # Store as locked reading
        price_stars = config.get_price_stars(reading_type)
        price_usd = config.get_price_usd(reading_type)

        reading = await repo.create_reading(
            user_id=db_user.user_id,
            reading_type=reading_type,
            content=reading_text,
            is_locked=True,
            price_stars=price_stars,
            price_crypto_usd=price_usd,
        )

        # Send teaser (first 2-3 sentences)
        sentences = reading_text.split(". ")
        teaser = ". ".join(sentences[:3]) + "..."
        await message.answer(teaser)

        # Show paywall
        from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text=f"⭐ Unlock Full Reading — {price_stars} Stars",
                callback_data=f"pay_stars:reading:{reading.reading_id}",
            )],
        ])
        if config.cryptobot_token:
            keyboard.inline_keyboard.append([
                InlineKeyboardButton(
                    text=f"💎 Pay with Crypto — ${price_usd:.2f}",
                    callback_data=f"pay_crypto:reading:{reading.reading_id}",
                ),
            ])

        await message.answer(
            "✨ *Your full reading continues...*\n\n"
            "I can see so much more. Unlock the complete reading below.",
            reply_markup=keyboard,
            parse_mode="Markdown",
        )

        await repo.log_event(db_user.user_id, "reading_requested", {
            "type": reading_type,
            "reading_id": reading.reading_id,
        })

    except Exception as e:
        logger.error(f"Reading generation failed: {e}")
        await message.answer("The stars are momentarily obscured... I'll try again shortly. 🌙")
