"""Tarot spread handlers — daily card, 3-card, Celtic Cross."""

import logging
import random

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command

from src.config import BotConfig
from src.db.repository import Repository
from src.db.models import User
from src.persona.engine import PersonaEngine
from src.persona.context import build_chart_context
from src.bot.keyboards import tarot_types_keyboard, tarot_question_keyboard

logger = logging.getLogger(__name__)
router = Router()

# Standard 78-card tarot deck
MAJOR_ARCANA = [
    "The Fool", "The Magician", "The High Priestess", "The Empress",
    "The Emperor", "The Hierophant", "The Lovers", "The Chariot",
    "Strength", "The Hermit", "Wheel of Fortune", "Justice",
    "The Hanged Man", "Death", "Temperance", "The Devil",
    "The Tower", "The Star", "The Moon", "The Sun",
    "Judgement", "The World",
]

MINOR_SUITS = ["Wands", "Cups", "Swords", "Pentacles"]
MINOR_RANKS = [
    "Ace", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King",
]

FULL_DECK = MAJOR_ARCANA + [
    f"{rank} of {suit}" for suit in MINOR_SUITS for rank in MINOR_RANKS
]


def draw_cards(count: int) -> list[dict]:
    """Draw random cards from the deck. Each card may be reversed."""
    selected = random.sample(FULL_DECK, count)
    return [
        {"name": card, "reversed": random.random() < 0.3}
        for card in selected
    ]


def format_drawn_cards(cards: list[dict]) -> str:
    """Format drawn cards for Claude context."""
    lines = []
    for i, card in enumerate(cards, 1):
        state = " (Reversed)" if card["reversed"] else ""
        lines.append(f"  Card {i}: {card['name']}{state}")
    return "\n".join(lines)


@router.message(Command("tarot"))
@router.callback_query(F.data == "menu:tarot")
async def show_tarot_menu(event, db_user: User = None, **kwargs):
    """Show tarot spread options."""
    text = (
        "Choose your tarot spread: 🃏\n\n"
        "• **3-Card Spread** — Past, Present, Future (free, once per day)\n"
        "• **Celtic Cross** — Deep 10-card reading (premium)"
    )
    if isinstance(event, CallbackQuery):
        await event.message.edit_text(text, reply_markup=tarot_types_keyboard(), parse_mode="Markdown")
        await event.answer()
    else:
        await event.answer(text, reply_markup=tarot_types_keyboard(), parse_mode="Markdown")


@router.callback_query(F.data == "tarot:three_card")
async def three_card_spread(callback: CallbackQuery, db_user: User,
                             repo: Repository, config: BotConfig):
    """Free 3-card spread (once per day)."""
    await callback.answer()

    # Draw 3 cards
    cards = draw_cards(3)
    cards_text = format_drawn_cards(cards)

    positions = ["Past", "Present", "Future"]
    reveal = "Your cards have been drawn: 🃏\n\n"
    for i, (card, position) in enumerate(zip(cards, positions)):
        state = " (Reversed)" if card["reversed"] else ""
        reveal += f"**{position}:** {card['name']}{state}\n"

    await callback.message.answer(reveal, parse_mode="Markdown")
    await callback.message.answer("Let me interpret what the cards are telling you... 🔮")

    # Generate interpretation
    try:
        persona = PersonaEngine(config)
        chart_ctx = ""
        if db_user.has_birth_data:
            chart_ctx = build_chart_context(db_user)

        astro_data = f"TAROT SPREAD: 3-Card (Past/Present/Future)\n\n{cards_text}"
        if chart_ctx:
            astro_data += f"\n\nUSER'S NATAL CHART:\n{chart_ctx}"

        reading_text, tokens = await persona.generate_reading(
            reading_type="tarot",
            astro_data=astro_data,
            user_context=f"User: {db_user.name or 'dear soul'}. This is a 3-card Past/Present/Future spread.",
        )

        await repo.create_reading(
            user_id=db_user.user_id,
            reading_type="tarot_three",
            content=reading_text,
            is_locked=False,
        )

        await callback.message.answer(reading_text)
        await repo.log_event(db_user.user_id, "reading_requested", {"type": "tarot_three"})

    except Exception as e:
        logger.error(f"Tarot reading failed: {e}")
        await callback.message.answer("The cards are being shy today... let me try again. 🌙")


@router.callback_query(F.data == "tarot:celtic_cross")
async def celtic_cross_request(callback: CallbackQuery, db_user: User,
                                repo: Repository, config: BotConfig):
    """Celtic Cross — premium 10-card spread."""
    await callback.answer()

    if db_user.is_vip:
        # VIP gets one Celtic Cross per month included — check if used
        # For now, generate it freely for VIP users
        await _generate_celtic_cross(callback.message, db_user, repo, config, paid=False)
    else:
        # Generate and lock behind paywall
        await _generate_celtic_cross(callback.message, db_user, repo, config, paid=True)


async def _generate_celtic_cross(message: Message, db_user: User,
                                  repo: Repository, config: BotConfig, paid: bool):
    """Generate a Celtic Cross spread."""
    cards = draw_cards(10)
    cards_text = format_drawn_cards(cards)

    positions = [
        "Significator", "Crossing", "Foundation", "Recent Past",
        "Crown", "Near Future", "Your Attitude", "External Influences",
        "Hopes & Fears", "Outcome",
    ]

    reveal = "The Celtic Cross is laid: ✨\n\n"
    for card, position in zip(cards, positions):
        state = " (R)" if card["reversed"] else ""
        reveal += f"**{position}:** {card['name']}{state}\n"

    await message.answer(reveal, parse_mode="Markdown")
    await message.answer("This is a deep spread... let me study the pattern... 🔮")

    try:
        persona = PersonaEngine(config)
        chart_ctx = ""
        if db_user.has_birth_data:
            chart_ctx = build_chart_context(db_user)

        astro_data = f"TAROT SPREAD: Celtic Cross (10 cards)\n\n{cards_text}"
        if chart_ctx:
            astro_data += f"\n\nUSER'S NATAL CHART:\n{chart_ctx}"

        reading_text, tokens = await persona.generate_reading(
            reading_type="tarot",
            astro_data=astro_data,
            user_context=(
                f"User: {db_user.name or 'dear soul'}. "
                f"This is a CELTIC CROSS (10-card) spread — give a thorough, multi-paragraph interpretation."
            ),
        )

        if paid:
            price_stars = config.get_price_stars("celtic_cross")
            price_usd = config.get_price_usd("celtic_cross")

            reading = await repo.create_reading(
                user_id=db_user.user_id,
                reading_type="celtic_cross",
                content=reading_text,
                is_locked=True,
                price_stars=price_stars,
                price_crypto_usd=price_usd,
            )

            # Show teaser
            sentences = reading_text.split(". ")
            teaser = ". ".join(sentences[:3]) + "..."
            await message.answer(teaser)

            from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(
                    text=f"⭐ Unlock Full Reading — {price_stars} Stars",
                    callback_data=f"pay_stars:reading:{reading.reading_id}",
                )],
            ])
            await message.answer(
                "✨ *The Celtic Cross reveals much more...*\n\nUnlock the complete interpretation below.",
                reply_markup=keyboard,
                parse_mode="Markdown",
            )
        else:
            await repo.create_reading(
                user_id=db_user.user_id,
                reading_type="celtic_cross",
                content=reading_text,
                is_locked=False,
            )
            await message.answer(reading_text)

        await repo.log_event(db_user.user_id, "reading_requested", {"type": "celtic_cross"})

    except Exception as e:
        logger.error(f"Celtic Cross reading failed: {e}")
        await message.answer("The cards need a moment to settle... try again shortly. 🌙")
