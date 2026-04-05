"""Compatibility/synastry reading handler."""

import logging

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from src.config import BotConfig
from src.db.repository import Repository
from src.db.models import User
from src.persona.engine import PersonaEngine
from src.astrology.charts import compute_chart_from_user_data
from src.astrology.synastry import compute_synastry, format_synastry_summary
from src.astrology.geocode import geocode_location
from src.bot.handlers.start import _parse_date, _parse_time

logger = logging.getLogger(__name__)
router = Router()


class CompatibilityState(StatesGroup):
    waiting_partner_name = State()
    waiting_partner_birth_date = State()
    waiting_partner_birth_time = State()
    waiting_partner_birth_location = State()


@router.message(Command("compatibility"))
@router.callback_query(F.data == "menu:compatibility")
async def start_compatibility(event, db_user: User = None, state: FSMContext = None, **kwargs):
    """Start compatibility reading flow."""
    if isinstance(event, CallbackQuery):
        msg = event.message
        await event.answer()
    else:
        msg = event

    if not db_user.has_birth_data:
        await msg.answer("I need your birth data first! Type /start to set up your chart. 💕")
        return

    await msg.answer(
        "Let's explore your cosmic compatibility! 💕\n\n"
        "I'll need some details about the other person.\n\n"
        "What's their name?"
    )
    await state.set_state(CompatibilityState.waiting_partner_name)


@router.message(CompatibilityState.waiting_partner_name)
async def get_partner_name(message: Message, state: FSMContext):
    await state.update_data(partner_name=message.text.strip())
    await message.answer(
        f"When was {message.text.strip()} born?\n\n"
        f"(For example: March 15, 1995 or 15.03.1995)"
    )
    await state.set_state(CompatibilityState.waiting_partner_birth_date)


@router.message(CompatibilityState.waiting_partner_birth_date)
async def get_partner_birth_date(message: Message, state: FSMContext):
    parsed = _parse_date(message.text.strip())
    if not parsed:
        await message.answer("I couldn't parse that date. Try: March 15, 1995 or 15.03.1995")
        return
    await state.update_data(partner_birth_date=parsed)

    data = await state.get_data()
    await message.answer(
        f"Do you know what time {data['partner_name']} was born?\n\n"
        f"Type a time (e.g., 2:30 PM) or 'skip' if unknown."
    )
    await state.set_state(CompatibilityState.waiting_partner_birth_time)


@router.message(CompatibilityState.waiting_partner_birth_time)
async def get_partner_birth_time(message: Message, state: FSMContext):
    text = message.text.strip().lower()
    birth_time = None
    if text not in ("skip", "don't know", "idk", "no"):
        birth_time = _parse_time(text)
        if birth_time is None:
            await message.answer("Couldn't parse that time. Try '2:30 PM' or '14:30', or 'skip'.")
            return
    await state.update_data(partner_birth_time=birth_time)

    data = await state.get_data()
    await message.answer(
        f"Where was {data['partner_name']} born? (City and country)"
    )
    await state.set_state(CompatibilityState.waiting_partner_birth_location)


@router.message(CompatibilityState.waiting_partner_birth_location)
async def compute_compatibility(message: Message, state: FSMContext,
                                 db_user: User, repo: Repository, config: BotConfig):
    """Compute and deliver compatibility reading."""
    data = await state.get_data()
    await state.clear()

    await message.answer("Let me compare your stars... 💫")

    # Geocode partner location
    geo = await geocode_location(message.text.strip(), repo)
    if not geo:
        await message.answer("I couldn't find that location. Please try again with /compatibility")
        return

    # Compute partner chart
    from datetime import time as dt_time
    bt = dt_time(data["partner_birth_time"][0], data["partner_birth_time"][1]) if data.get("partner_birth_time") else None

    try:
        partner_chart = compute_chart_from_user_data(
            name=data["partner_name"],
            birth_date=data["partner_birth_date"],
            birth_time=bt,
            lat=geo.lat,
            lng=geo.lng,
            tz_str=geo.timezone,
        )

        # Compute user chart
        user_chart = compute_chart_from_user_data(
            name=db_user.name or "You",
            birth_date=db_user.birth_date,
            birth_time=db_user.birth_time,
            lat=db_user.birth_lat,
            lng=db_user.birth_lng,
            tz_str=db_user.timezone or "UTC",
        )

        # Compute synastry
        synastry = compute_synastry(user_chart, partner_chart)
        synastry_summary = format_synastry_summary(synastry)

        scores = synastry["scores"]
        overall = scores["overall"]

        # Show quick free summary
        free_summary = (
            f"💕 **{db_user.name or 'You'} & {data['partner_name']}**\n\n"
            f"Overall Compatibility: **{overall}%**\n\n"
            f"☉ Sun Harmony: {scores['sun_harmony']}%\n"
            f"☽ Moon Bond: {scores['moon_bond']}%\n"
            f"♀ Venus Match: {scores['venus_match']}%\n"
        )
        await message.answer(free_summary, parse_mode="Markdown")

        # Generate full reading (locked)
        persona = PersonaEngine(config)
        reading_text, tokens = await persona.generate_reading(
            reading_type="compatibility",
            astro_data=synastry_summary,
            user_context=f"Person A: {db_user.name}, Person B: {data['partner_name']}",
        )

        price_stars = config.get_price_stars("compatibility")
        price_usd = config.get_price_usd("compatibility")

        reading = await repo.create_reading(
            user_id=db_user.user_id,
            reading_type="compatibility",
            content=reading_text,
            is_locked=True,
            price_stars=price_stars,
            price_crypto_usd=price_usd,
        )

        # Teaser
        sentences = reading_text.split(". ")
        teaser = ". ".join(sentences[:2]) + "..."
        await message.answer(teaser)

        from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text=f"⭐ Unlock Full Report — {price_stars} Stars",
                callback_data=f"pay_stars:reading:{reading.reading_id}",
            )],
        ])

        await message.answer(
            "��� *I can see the deeper dynamics between your charts...*\n\n"
            "Unlock the full compatibility report for Venus/Mars analysis, "
            "tension points, and relationship advice.",
            reply_markup=keyboard,
            parse_mode="Markdown",
        )

        # Save partner as a profile
        await repo.add_profile(
            user_id=db_user.user_id,
            name=data["partner_name"],
            birth_date=data["partner_birth_date"],
            birth_time=bt,
            birth_location=geo.display_name,
            lat=geo.lat,
            lng=geo.lng,
            sun=partner_chart.sun_sign,
            moon=partner_chart.moon_sign,
            rising=partner_chart.rising_sign,
            relationship="partner",
        )

        await repo.log_event(db_user.user_id, "reading_requested", {"type": "compatibility"})

    except Exception as e:
        logger.error(f"Compatibility reading failed: {e}")
        await message.answer("Something went wrong comparing your charts. Please try /compatibility again. 🌙")
