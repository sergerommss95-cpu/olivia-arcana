"""Inline keyboards for bot interactions."""

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def main_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔮 Get a Reading", callback_data="menu:reading")],
        [InlineKeyboardButton(text="🃏 Tarot Spread", callback_data="menu:tarot")],
        [InlineKeyboardButton(text="💕 Compatibility", callback_data="menu:compatibility")],
        [InlineKeyboardButton(text="⚡ Cosmic Clock", callback_data="menu:cosmic_clock")],
        [InlineKeyboardButton(text="⭐ VIP Access", callback_data="menu:subscribe")],
        [InlineKeyboardButton(text="👤 My Profile", callback_data="menu:profile")],
    ])


def reading_types_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🌟 Birth Chart Reading", callback_data="reading:birth_chart")],
        [InlineKeyboardButton(text="🔮 Year-Ahead Forecast", callback_data="reading:year_ahead")],
        [InlineKeyboardButton(text="☀️ Solar Return Report", callback_data="reading:solar_return")],
        [InlineKeyboardButton(text="🔥 Roast My Chart", callback_data="reading:roast")],
        [InlineKeyboardButton(text="🎬 Personal Video Reading", callback_data="reading:video")],
        [InlineKeyboardButton(text="◀️ Back", callback_data="menu:main")],
    ])


def tarot_types_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🃏 3-Card Spread (Free)", callback_data="tarot:three_card")],
        [InlineKeyboardButton(text="✨ Celtic Cross (10 cards)", callback_data="tarot:celtic_cross")],
        [InlineKeyboardButton(text="◀️ Back", callback_data="menu:main")],
    ])


def subscription_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ Monthly VIP", callback_data="subscribe:monthly")],
        [InlineKeyboardButton(text="💎 Annual VIP (2 months free)", callback_data="subscribe:annual")],
        [InlineKeyboardButton(text="◀️ Back", callback_data="menu:main")],
    ])


def tarot_question_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💕 Love & Relationships", callback_data="tarot_q:love")],
        [InlineKeyboardButton(text="💼 Career & Money", callback_data="tarot_q:career")],
        [InlineKeyboardButton(text="🌟 General Guidance", callback_data="tarot_q:general")],
    ])


def payment_method_keyboard(reading_id: int, product: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ Pay with Stars", callback_data=f"pay_stars:{product}:{reading_id}")],
        [InlineKeyboardButton(text="💎 Pay with Crypto", callback_data=f"pay_crypto:{product}:{reading_id}")],
    ])


def confirm_keyboard(action: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Yes", callback_data=f"confirm:{action}"),
            InlineKeyboardButton(text="❌ No", callback_data="cancel"),
        ],
    ])
