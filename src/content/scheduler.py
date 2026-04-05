"""Content scheduler — automates daily zodiac, tarot, VIP readings, re-engagement."""

import logging
from datetime import datetime, date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from aiogram import Bot

from src.config import BotConfig
from src.db.repository import Repository
from src.persona.engine import PersonaEngine
from src.persona.context import build_chart_context
from src.astrology.transits import get_current_transits, format_transits_summary

logger = logging.getLogger(__name__)

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]


class ContentScheduler:
    def __init__(self, config: BotConfig, repo: Repository, bot: Bot):
        self.config = config
        self.repo = repo
        self.bot = bot
        self.persona = PersonaEngine(config)
        self.scheduler = AsyncIOScheduler()

    def start(self):
        """Register all scheduled jobs and start the scheduler."""
        sched = self.config.scheduler

        # Daily zodiac forecast
        self.scheduler.add_job(
            self.generate_daily_zodiac,
            "cron",
            hour=sched.get("daily_zodiac_hour", 6),
            minute=0,
            id=f"daily_zodiac_{self.config.lang}",
        )

        # Daily tarot card
        self.scheduler.add_job(
            self.generate_daily_tarot,
            "cron",
            hour=sched.get("tarot_daily_hour", 9),
            minute=0,
            id=f"daily_tarot_{self.config.lang}",
        )

        # Weekly cosmic weather (Monday)
        self.scheduler.add_job(
            self.generate_weekly_forecast,
            "cron",
            day_of_week=sched.get("weekly_forecast_day", 0),
            hour=sched.get("weekly_forecast_hour", 7),
            minute=0,
            id=f"weekly_forecast_{self.config.lang}",
        )

        # VIP daily readings
        self.scheduler.add_job(
            self.generate_vip_daily_readings,
            "cron",
            hour=sched.get("vip_reading_hour", 8),
            minute=0,
            id=f"vip_readings_{self.config.lang}",
        )

        # Re-engagement check (hourly)
        interval = sched.get("reengagement_check_interval_hours", 1)
        self.scheduler.add_job(
            self.check_reengagement,
            "interval",
            hours=interval,
            id=f"reengagement_{self.config.lang}",
        )

        # Birthday check (daily)
        self.scheduler.add_job(
            self.check_birthdays,
            "cron",
            hour=8,
            minute=30,
            id=f"birthdays_{self.config.lang}",
        )

        self.scheduler.start()
        logger.info(f"Content scheduler started for {self.config.lang}")

    async def generate_daily_zodiac(self):
        """Generate and post daily horoscope for all 12 signs."""
        logger.info(f"Generating daily zodiac for {self.config.lang}")

        transits = get_current_transits()
        transit_summary = format_transits_summary(transits)

        channel_id = self.config.channel_id
        if not channel_id:
            logger.warning(f"No channel ID for {self.config.lang}, skipping zodiac post")
            return

        for sign in ZODIAC_SIGNS:
            try:
                horoscope, _ = await self.persona.generate_daily_horoscope(
                    sign=sign,
                    transit_data=transit_summary,
                )

                sign_glyphs = {
                    "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋",
                    "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Scorpio": "♏",
                    "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓",
                }
                glyph = sign_glyphs.get(sign, "")

                post = (
                    f"{glyph} **{sign.upper()}** — {datetime.now().strftime('%B %d, %Y')}\n\n"
                    f"{horoscope}\n\n"
                    f"{self.config.channel_vip_teaser}"
                )

                await self.bot.send_message(
                    chat_id=channel_id,
                    text=post,
                    parse_mode="Markdown",
                )

            except Exception as e:
                logger.error(f"Failed to generate horoscope for {sign}: {e}")

    async def generate_daily_tarot(self):
        """Generate and post tarot card of the day."""
        logger.info(f"Generating daily tarot for {self.config.lang}")

        from src.bot.handlers.tarot import draw_cards
        cards = draw_cards(1)
        card = cards[0]
        state = " (Reversed)" if card["reversed"] else ""

        try:
            transits = get_current_transits()
            transit_summary = format_transits_summary(transits)

            response, _ = await self.persona.chat(
                user_message=(
                    f"Generate a tarot card of the day interpretation for: {card['name']}{state}. "
                    f"Today's transits: {transit_summary}. "
                    f"Keep it 3-4 sentences. Mystical, warm, actionable."
                ),
                conversation_history=[],
                user_context="This is a public channel post, not a personal reading.",
            )

            post = (
                f"🃏 **Card of the Day** — {datetime.now().strftime('%B %d')}\n\n"
                f"**{card['name']}{state}**\n\n"
                f"{response}\n\n"
                f"Want a personal tarot pull? DM me at @{self.config.lang}OliviaArcanaBot"
            )

            channel_id = self.config.channel_id
            if channel_id:
                await self.bot.send_message(
                    chat_id=channel_id,
                    text=post,
                    parse_mode="Markdown",
                )

        except Exception as e:
            logger.error(f"Daily tarot generation failed: {e}")

    async def generate_weekly_forecast(self):
        """Generate and post weekly cosmic weather."""
        logger.info(f"Generating weekly forecast for {self.config.lang}")

        transits = get_current_transits()
        transit_summary = format_transits_summary(transits)

        try:
            response, _ = await self.persona.chat(
                user_message=(
                    f"Generate a weekly cosmic weather forecast for the coming week. "
                    f"Current planetary positions: {transit_summary}. "
                    f"Cover the 3-4 most significant transits this week. "
                    f"Mention which signs are most affected. "
                    f"Keep it 5-8 sentences. Informative but warm."
                ),
                conversation_history=[],
                user_context="This is a public channel post for the weekly forecast.",
            )

            post = (
                f"✨ **Weekly Cosmic Weather** — {datetime.now().strftime('%B %d')} Week\n\n"
                f"{response}\n\n"
                f"{self.config.channel_vip_teaser}"
            )

            channel_id = self.config.channel_id
            if channel_id:
                await self.bot.send_message(
                    chat_id=channel_id,
                    text=post,
                    parse_mode="Markdown",
                )

        except Exception as e:
            logger.error(f"Weekly forecast generation failed: {e}")

    async def generate_vip_daily_readings(self):
        """Push personalized daily readings to all VIP subscribers."""
        logger.info(f"Generating VIP daily readings for {self.config.lang}")

        vip_users = await self.repo.get_vip_users()
        for user in vip_users:
            if not user.has_birth_data:
                continue

            try:
                chart_ctx = build_chart_context(user)

                reading, tokens = await self.persona.generate_reading(
                    reading_type="birth_chart",
                    astro_data=chart_ctx,
                    user_context=(
                        f"User: {user.name or 'dear soul'}. "
                        f"This is their DAILY personal reading — keep it concise (2-3 paragraphs), "
                        f"focused on TODAY's transits affecting their chart specifically."
                    ),
                )

                await self.bot.send_message(
                    chat_id=user.user_id,
                    text=f"Good morning, {user.name or 'dear soul'}! 🌙\n\nYour daily cosmic guidance:\n\n{reading}",
                )

                await self.repo.create_reading(
                    user_id=user.user_id,
                    reading_type="daily",
                    content=reading,
                    is_locked=False,
                )

            except Exception as e:
                logger.error(f"VIP daily reading failed for user {user.user_id}: {e}")

    async def check_reengagement(self):
        """Send re-engagement messages to inactive users."""
        days = self.config.scheduler.get("reengagement_days_threshold", 7)
        inactive_users = await self.repo.get_inactive_users(days=days)

        for user in inactive_users:
            try:
                msg = (
                    f"The stars have shifted since we last spoke, {user.name or 'dear soul'}... 🌙\n\n"
                )

                if user.has_birth_data:
                    from src.astrology.transits import get_current_transits, find_active_transits_to_natal
                    from src.astrology.charts import compute_chart_from_user_data

                    chart = compute_chart_from_user_data(
                        name=user.name or "You",
                        birth_date=user.birth_date,
                        birth_time=user.birth_time,
                        lat=user.birth_lat,
                        lng=user.birth_lng,
                        tz_str=user.timezone or "UTC",
                    )
                    transits = get_current_transits()
                    active = find_active_transits_to_natal(chart, transits)

                    if active:
                        t = active[0]
                        msg += (
                            f"{t['transit_planet']} has moved into a significant position "
                            f"affecting your chart. I have something important to share with you."
                        )
                    else:
                        msg += "I've been studying the cosmic shifts and noticed something about your chart."
                else:
                    msg += "The cosmic weather has changed dramatically. Come back and let me catch you up."

                await self.bot.send_message(chat_id=user.user_id, text=msg)
                await self.repo.update_user(user.user_id, last_active_at=datetime.utcnow())
                await self.repo.log_event(user.user_id, "reengagement_sent")

            except Exception as e:
                logger.debug(f"Re-engagement failed for user {user.user_id}: {e}")

    async def check_birthdays(self):
        """Send birthday readings to users whose birthday is today."""
        today = date.today()
        birthday_users = await self.repo.get_birthday_users(today)

        for user in birthday_users:
            try:
                msg = (
                    f"Happy Solar Return, {user.name or 'dear soul'}! 🎂✨\n\n"
                    f"The Sun returns to the exact position it held at the moment of your birth. "
                    f"This is YOUR cosmic new year.\n\n"
                )

                if user.has_birth_data:
                    chart_ctx = build_chart_context(user)
                    reading, _ = await self.persona.generate_reading(
                        reading_type="birth_chart",
                        astro_data=chart_ctx,
                        user_context=(
                            f"Today is {user.name}'s birthday! Generate a special birthday/solar return "
                            f"mini-reading. Focus on the year ahead based on current transits. "
                            f"Warm and celebratory. 2-3 paragraphs."
                        ),
                    )
                    msg += reading
                else:
                    msg += "Share your birth time and location, and I'll cast your full Solar Return chart for the year ahead!"

                await self.bot.send_message(chat_id=user.user_id, text=msg)
                await self.repo.log_event(user.user_id, "birthday_reading_sent")

            except Exception as e:
                logger.debug(f"Birthday reading failed for user {user.user_id}: {e}")
