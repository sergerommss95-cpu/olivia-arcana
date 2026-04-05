"""Handler for /start — onboarding flow with birth data collection."""

import logging
from datetime import datetime

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from src.config import BotConfig
from src.db.repository import Repository
from src.db.models import User
from src.astrology.geocode import geocode_location
from src.astrology.charts import compute_chart_from_user_data
from src.persona.engine import PersonaEngine
from src.persona.context import build_chart_context
from src.bot.keyboards import main_menu_keyboard

logger = logging.getLogger(__name__)
router = Router()


class OnboardingState(StatesGroup):
    waiting_birth_date = State()
    waiting_birth_time = State()
    waiting_birth_location = State()


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext, db_user: User,
                    repo: Repository, config: BotConfig):
    """Welcome message + start onboarding."""
    # Parse referral source from start parameter
    args = message.text.split(maxsplit=1)
    if len(args) > 1:
        ref = args[1]
        if ref.startswith("ref_"):
            referred_by = int(ref.replace("ref_", ""))
            await repo.update_user(db_user.user_id, referral_source=ref, referred_by_user_id=referred_by)
            await repo.log_event(db_user.user_id, "referral_click", {"source": ref})
        else:
            await repo.update_user(db_user.user_id, referral_source=ref)

    if db_user.has_birth_data:
        # Returning user
        await message.answer(
            f"Welcome back, {db_user.name or 'dear soul'}! 🌙\n\n"
            f"The stars have been busy since we last spoke. "
            f"What would you like to explore today?",
            reply_markup=main_menu_keyboard(),
        )
        return

    # New user — start onboarding
    await message.answer(
        f"Welcome, dear soul! ✨\n\n"
        f"I'm {config.persona_name}, your personal astrologer and tarot reader.\n\n"
        f"To cast your chart, I need to know when you were born. "
        f"What is your birth date?\n\n"
        f"(For example: March 15, 1995 or 15.03.1995)",
    )
    await state.set_state(OnboardingState.waiting_birth_date)


@router.message(OnboardingState.waiting_birth_date)
async def process_birth_date(message: Message, state: FSMContext):
    """Parse and store birth date."""
    text = message.text.strip()

    # Try to parse various date formats
    parsed_date = _parse_date(text)
    if parsed_date is None:
        await message.answer(
            "I couldn't quite read that date. Could you try again?\n\n"
            "You can use formats like:\n"
            "• March 15, 1995\n"
            "• 15.03.1995\n"
            "• 1995-03-15",
        )
        return

    await state.update_data(birth_date=parsed_date)
    await message.answer(
        "Wonderful! Now, do you know what time you were born? ⏰\n\n"
        "Even an approximate time helps me calculate your Moon and Rising signs. "
        "If you're not sure, just type 'skip' — I can still read your chart, "
        "just with a bit less detail.",
    )
    await state.set_state(OnboardingState.waiting_birth_time)


@router.message(OnboardingState.waiting_birth_time)
async def process_birth_time(message: Message, state: FSMContext):
    """Parse and store birth time (or skip)."""
    text = message.text.strip().lower()

    birth_time = None
    if text not in ("skip", "don't know", "idk", "no", "not sure", "unknown"):
        birth_time = _parse_time(text)
        if birth_time is None:
            await message.answer(
                "I couldn't parse that time. Try formats like:\n"
                "• 2:30 PM\n"
                "• 14:30\n"
                "• 2pm\n\n"
                "Or type 'skip' if you don't know.",
            )
            return

    await state.update_data(birth_time=birth_time)

    if birth_time:
        await message.answer(
            "Perfect! Last question — where were you born? 🌍\n\n"
            "City and country is all I need. (For example: London, UK)",
        )
    else:
        await message.answer(
            "No worries! I can still read your Sun sign and planetary positions. "
            "We just won't have your Rising and Moon signs for now.\n\n"
            "Where were you born? City and country. 🌍",
        )
    await state.set_state(OnboardingState.waiting_birth_location)


@router.message(OnboardingState.waiting_birth_location)
async def process_birth_location(message: Message, state: FSMContext,
                                  db_user: User, repo: Repository, config: BotConfig):
    """Geocode location, compute chart, deliver free mini-reading."""
    text = message.text.strip()

    await message.answer("Let me look up your cosmic coordinates... 🔭")

    # Geocode
    geo = await geocode_location(text, repo)
    if geo is None:
        await message.answer(
            "I couldn't find that location. Could you be more specific?\n"
            "Try: 'Kyiv, Ukraine' or 'New York, USA'",
        )
        return

    if geo.ambiguous and geo.alternatives:
        await message.answer(
            f"I found a few places with that name. Did you mean:\n"
            f"• {geo.display_name}\n\n"
            f"If not, try adding the country or state.",
        )
        # Proceed with first result anyway — user can correct later

    # Get stored state data
    data = await state.get_data()
    birth_date = data["birth_date"]
    birth_time = data.get("birth_time")

    # Compute chart
    has_time = birth_time is not None
    try:
        from datetime import time as dt_time
        bt = dt_time(birth_time[0], birth_time[1]) if birth_time else None

        chart = compute_chart_from_user_data(
            name=db_user.name or "You",
            birth_date=birth_date,
            birth_time=bt,
            lat=geo.lat,
            lng=geo.lng,
            tz_str=geo.timezone,
        )
    except Exception as e:
        logger.error(f"Chart computation failed: {e}")
        await message.answer(
            "Something went wrong casting your chart. "
            "Let me try again — could you double-check your birth date and location?",
        )
        return

    # Store in database
    from datetime import time as dt_time
    bt_store = dt_time(birth_time[0], birth_time[1]) if birth_time else None
    await repo.update_birth_data(
        user_id=db_user.user_id,
        birth_date=birth_date,
        birth_time=bt_store,
        birth_location=geo.display_name,
        lat=geo.lat,
        lng=geo.lng,
        timezone=geo.timezone,
        sun=chart.sun_sign,
        moon=chart.moon_sign,
        rising=chart.rising_sign,
    )

    await state.clear()

    # Build the reveal message
    reveal = f"Your chart is cast! ✨\n\n"
    reveal += f"☉ Sun: {chart.sun_sign}\n"
    if chart.moon_sign:
        reveal += f"☽ Moon: {chart.moon_sign}\n"
    if chart.rising_sign:
        reveal += f"↑ Rising: {chart.rising_sign}\n"
    reveal += f"\nDominant element: {chart.dominant_element}\n"

    await message.answer(reveal)

    # Generate free mini-reading
    await message.answer("Let me look deeper into your stars... 🔮")

    try:
        persona = PersonaEngine(config)
        chart_context = build_chart_context(
            await repo.get_user(db_user.user_id)  # Refresh user with new data
        )
        reading_text, tokens = await persona.generate_reading(
            reading_type="birth_chart",
            astro_data=chart_context,
            user_context=f"User's name: {db_user.name or 'dear soul'}. This is their FIRST reading — make it memorable and impressive.",
        )

        # Store as a free reading
        await repo.create_reading(
            user_id=db_user.user_id,
            reading_type="birth_chart",
            content=reading_text,
            is_locked=False,
        )

        # Send the teaser (first part free, hint at more)
        paragraphs = reading_text.split("\n\n")
        if len(paragraphs) > 2:
            teaser = "\n\n".join(paragraphs[:2])
            await message.answer(teaser)
            await message.answer(
                f"I can see so much more in your chart, {db_user.name or 'dear soul'}... "
                f"but I want to let that sink in first. 🌙\n\n"
                f"Whenever you're ready to explore deeper, just use the menu below.",
                reply_markup=main_menu_keyboard(),
            )
        else:
            await message.answer(reading_text)
            await message.answer(
                "There's so much more to discover. Use the menu below whenever you're ready.",
                reply_markup=main_menu_keyboard(),
            )

        await repo.log_event(db_user.user_id, "onboarding_complete", {
            "has_birth_time": has_time,
            "sun": chart.sun_sign,
        })

    except Exception as e:
        logger.error(f"Reading generation failed: {e}")
        await message.answer(
            "The stars are momentarily obscured... I'll have your reading ready shortly. "
            "In the meantime, explore the menu below! 🌙",
            reply_markup=main_menu_keyboard(),
        )


def _parse_date(text: str):
    """Try to parse various date formats. Returns datetime.date or None."""
    from datetime import date as dt_date
    import re

    # Try ISO: 1995-03-15
    try:
        return datetime.strptime(text, "%Y-%m-%d").date()
    except ValueError:
        pass

    # Try European: 15.03.1995 or 15/03/1995
    for fmt in ("%d.%m.%Y", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            pass

    # Try natural: March 15, 1995 or 15 March 1995
    for fmt in ("%B %d, %Y", "%d %B %Y", "%B %d %Y", "%b %d, %Y", "%d %b %Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            pass

    return None


def _parse_time(text: str):
    """Parse time string. Returns (hour, minute) tuple or None."""
    import re

    text = text.strip().upper()

    # 14:30 or 2:30
    match = re.match(r"(\d{1,2}):(\d{2})", text)
    if match:
        h, m = int(match.group(1)), int(match.group(2))
        if "PM" in text and h < 12:
            h += 12
        if "AM" in text and h == 12:
            h = 0
        if 0 <= h <= 23 and 0 <= m <= 59:
            return (h, m)

    # 2pm, 2 pm, 2PM
    match = re.match(r"(\d{1,2})\s*(AM|PM)", text)
    if match:
        h = int(match.group(1))
        if match.group(2) == "PM" and h < 12:
            h += 12
        if match.group(2) == "AM" and h == 12:
            h = 0
        if 0 <= h <= 23:
            return (h, 0)

    return None
