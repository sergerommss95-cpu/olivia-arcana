"""Subscription and payment handlers."""

import logging

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, PreCheckoutQuery, ContentType
from aiogram.filters import Command

from src.config import BotConfig
from src.db.repository import Repository
from src.db.models import User
from src.payments.stars import send_subscription_invoice, send_reading_invoice
from src.bot.keyboards import subscription_keyboard, main_menu_keyboard

logger = logging.getLogger(__name__)
router = Router()


@router.message(Command("subscribe"))
@router.callback_query(F.data == "menu:subscribe")
async def show_subscribe_menu(event, db_user: User = None, config: BotConfig = None, **kwargs):
    """Show VIP subscription options."""
    monthly_price = config.get_price_stars("vip_monthly") if config else 500
    annual_price = config.get_price_stars("vip_annual") if config else 5000

    text = (
        "✨ **Olivia Arcana VIP** ✨\n\n"
        "Unlock the full power of your chart:\n\n"
        "☽ Daily personal reading based on YOUR birth chart\n"
        "⚡ Real-time transit alerts\n"
        "🃏 Weekly tarot pull + monthly Celtic Cross\n"
        "💕 Full compatibility reports\n"
        "🌑 Eclipse & retrograde impact reports\n"
        "♾ Unlimited chat with Olivia\n\n"
        f"**Monthly:** ⭐ {monthly_price} Stars (~${monthly_price * 0.013:.2f}/month)\n"
        f"**Annual:** ⭐ {annual_price} Stars (~${annual_price * 0.013:.2f}/year) — 2 months free!\n"
    )

    if isinstance(event, CallbackQuery):
        await event.message.edit_text(text, reply_markup=subscription_keyboard(), parse_mode="Markdown")
        await event.answer()
    else:
        await event.answer(text, reply_markup=subscription_keyboard(), parse_mode="Markdown")


@router.callback_query(F.data.startswith("subscribe:"))
async def handle_subscribe(callback: CallbackQuery, db_user: User,
                            repo: Repository, config: BotConfig):
    """Send subscription invoice."""
    period = callback.data.split(":")[1]
    await callback.answer()

    product_key = f"vip_{period}"
    amount = config.get_price_stars(product_key)

    await send_subscription_invoice(
        bot=callback.bot,
        chat_id=callback.from_user.id,
        period=period,
        amount_stars=amount,
    )


@router.callback_query(F.data.startswith("pay_stars:reading:"))
async def handle_pay_stars_reading(callback: CallbackQuery, db_user: User,
                                    repo: Repository, config: BotConfig):
    """Send Stars invoice for a reading unlock."""
    reading_id = int(callback.data.split(":")[2])
    await callback.answer()

    reading = await repo.get_reading(reading_id)
    if not reading:
        await callback.message.answer("This reading is no longer available.")
        return

    await send_reading_invoice(
        bot=callback.bot,
        chat_id=callback.from_user.id,
        reading_id=reading_id,
        reading_type=reading.type,
        amount_stars=reading.price_stars,
    )


# ── Stars payment flow ──

@router.pre_checkout_query()
async def handle_pre_checkout(pre_checkout: PreCheckoutQuery):
    """Approve pre-checkout queries for Stars payments."""
    await pre_checkout.answer(ok=True)


@router.message(F.content_type == ContentType.SUCCESSFUL_PAYMENT)
async def handle_successful_payment(message: Message, db_user: User,
                                     repo: Repository, config: BotConfig):
    """Process successful Stars payment."""
    payment = message.successful_payment
    payload = payment.invoice_payload

    logger.info(f"Payment received: {payload} from user {db_user.user_id}")

    if payload.startswith("reading:"):
        reading_id = int(payload.split(":")[1])
        reading = await repo.unlock_reading(reading_id)

        if reading:
            await repo.create_payment(
                user_id=db_user.user_id,
                payment_type="one_time",
                method="stars",
                amount_stars=payment.total_amount,
                reading_id=reading_id,
            )
            await repo.log_event(db_user.user_id, "reading_unlocked", {
                "reading_id": reading_id,
                "type": reading.type,
            })

            await message.answer(
                f"Payment received! Here's your complete reading: 🌙\n\n"
                f"{reading.content}"
            )
        else:
            await message.answer("Payment received, but I couldn't find the reading. Please contact support.")

    elif payload.startswith("subscription:"):
        period = payload.split(":")[1]

        await repo.create_subscription(
            user_id=db_user.user_id,
            method="stars",
            period=period,
            amount_stars=payment.total_amount,
        )
        await repo.log_event(db_user.user_id, "subscription_started", {
            "period": period,
            "method": "stars",
        })

        await message.answer(
            f"Welcome to VIP, {db_user.name or 'dear soul'}! ✨\n\n"
            f"Your daily personal readings start tomorrow morning. "
            f"You now have unlimited access to everything Olivia offers.\n\n"
            f"The stars are truly yours now. 🌙",
            reply_markup=main_menu_keyboard(),
        )


@router.message(Command("cancel"))
async def cmd_cancel_subscription(message: Message, db_user: User,
                                   repo: Repository, config: BotConfig):
    """Cancel VIP subscription."""
    if not db_user.is_vip:
        await message.answer("You don't have an active VIP subscription.")
        return

    await repo.cancel_subscription(db_user.user_id)

    expires = db_user.subscription_expires_at
    expires_str = expires.strftime("%B %d, %Y") if expires else "soon"

    await message.answer(
        f"I understand, {db_user.name or 'dear soul'}. 🌙\n\n"
        f"Your VIP access will continue until {expires_str}. "
        f"The stars will always be here for you.\n\n"
        f"You can resubscribe anytime with /subscribe."
    )


# ── Menu navigation ──

@router.callback_query(F.data == "menu:main")
async def back_to_main(callback: CallbackQuery, **kwargs):
    """Return to main menu."""
    await callback.message.edit_text(
        "What would you like to explore? 🌙",
        reply_markup=main_menu_keyboard(),
    )
    await callback.answer()


@router.callback_query(F.data == "menu:profile")
async def show_profile(callback: CallbackQuery, db_user: User, **kwargs):
    """Show user profile."""
    await callback.answer()

    profile = f"**Your Cosmic Profile** 👤\n\n"
    profile += f"Name: {db_user.name or 'Not set'}\n"
    if db_user.zodiac_sun:
        profile += f"☉ Sun: {db_user.zodiac_sun}\n"
    if db_user.zodiac_moon:
        profile += f"☽ Moon: {db_user.zodiac_moon}\n"
    if db_user.zodiac_rising:
        profile += f"↑ Rising: {db_user.zodiac_rising}\n"
    if db_user.birth_location:
        profile += f"📍 Born in: {db_user.birth_location}\n"

    profile += f"\nStatus: {'⭐ VIP' if db_user.is_vip else 'Free'}\n"

    if db_user.is_vip and db_user.subscription_expires_at:
        profile += f"VIP expires: {db_user.subscription_expires_at.strftime('%B %d, %Y')}\n"

    await callback.message.edit_text(
        profile,
        reply_markup=main_menu_keyboard(),
        parse_mode="Markdown",
    )


@router.callback_query(F.data == "menu:cosmic_clock")
async def cosmic_clock(callback: CallbackQuery, db_user: User,
                        repo: Repository, config: BotConfig):
    """Real-time cosmic weather snapshot."""
    await callback.answer()

    if not db_user.has_birth_data:
        await callback.message.answer(
            "I need your birth data to show your cosmic clock. Type /start first! 🔭"
        )
        return

    from src.astrology.transits import get_current_transits, find_active_transits_to_natal, get_cosmic_weather_score
    from src.astrology.charts import compute_chart_from_user_data

    try:
        chart = compute_chart_from_user_data(
            name=db_user.name or "You",
            birth_date=db_user.birth_date,
            birth_time=db_user.birth_time,
            lat=db_user.birth_lat,
            lng=db_user.birth_lng,
            tz_str=db_user.timezone or "UTC",
        )
        transits = get_current_transits()
        active = find_active_transits_to_natal(chart, transits)
        score = get_cosmic_weather_score(active)

        emoji = {"green": "🟢", "yellow": "🟡", "red": "🔴"}[score]
        label = {"green": "Smooth Sailing", "yellow": "Active Energies", "red": "Intense Transits"}[score]

        text = f"**Cosmic Clock** ⚡\n\n"
        text += f"Your cosmic weather right now: {emoji} **{label}**\n\n"

        if active[:3]:
            text += "Active transits on your chart:\n"
            for t in active[:3]:
                text += f"• {t['transit_planet']} {t['aspect']} your {t['natal_planet']}\n"

        if not db_user.is_vip:
            text += "\n🔑 VIP: Full transit list + alerts when major planets hit your chart"

        await callback.message.answer(text, parse_mode="Markdown")

    except Exception as e:
        logger.error(f"Cosmic clock failed: {e}")
        await callback.message.answer("The cosmic clock is recalibrating... try again in a moment. 🌙")
