"""Entry point — launches all bot instances in a single async process."""

import asyncio
import logging
import sys
from pathlib import Path

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from dotenv import load_dotenv

from src.config import BotConfig, load_base_config
from src.db.repository import Repository
from src.bot.middlewares import UserTrackingMiddleware, RateLimitMiddleware, AnalyticsMiddleware
from src.bot.handlers import start, chat, readings, tarot, subscribe, compatibility
from src.content.scheduler import ContentScheduler

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("olivia-arcana.log"),
    ],
)
logger = logging.getLogger("olivia-arcana")


async def create_bot_instance(lang: str) -> tuple:
    """Create a complete bot instance for a given language."""
    config = BotConfig(lang)

    if not config.bot_token:
        logger.warning(f"No bot token for {lang}, skipping")
        return None

    # Initialize database
    repo = Repository(config.db_path)
    await repo.init_db()

    # Create bot and dispatcher
    bot = Bot(token=config.bot_token, default={"parse_mode": ParseMode.HTML})
    dp = Dispatcher()

    # Register middlewares (order matters: tracking → rate limit → analytics)
    dp.message.middleware(UserTrackingMiddleware(config, repo))
    dp.message.middleware(RateLimitMiddleware(config, repo))
    dp.message.middleware(AnalyticsMiddleware(repo))
    dp.callback_query.middleware(UserTrackingMiddleware(config, repo))

    # Register routers (order matters: specific commands before catch-all chat)
    dp.include_router(start.router)
    dp.include_router(readings.router)
    dp.include_router(tarot.router)
    dp.include_router(compatibility.router)
    dp.include_router(subscribe.router)
    dp.include_router(chat.router)  # Must be LAST — catch-all for free text

    # Start content scheduler
    scheduler = ContentScheduler(config, repo, bot)
    scheduler.start()

    logger.info(f"Bot instance ready: {config.persona_name} ({lang})")
    return bot, dp


async def main():
    """Launch all configured bot instances."""
    base_config = load_base_config()
    languages = base_config.get("languages", ["en"])

    # Allow running a single language via command line
    if len(sys.argv) > 1:
        languages = [lang for lang in sys.argv[1:] if lang in languages]
        if not languages:
            logger.error(f"Invalid language(s). Available: {base_config.get('languages')}")
            sys.exit(1)

    logger.info(f"Starting Olivia Arcana bots for: {', '.join(languages)}")

    # Create all bot instances
    instances = []
    for lang in languages:
        result = await create_bot_instance(lang)
        if result:
            instances.append(result)

    if not instances:
        logger.error("No bot instances could be created. Check your .env file.")
        sys.exit(1)

    # Run all dispatchers concurrently
    logger.info(f"Launching {len(instances)} bot(s)...")

    tasks = []
    for bot, dp in instances:
        tasks.append(dp.start_polling(bot))

    try:
        await asyncio.gather(*tasks)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down...")
    finally:
        for bot, dp in instances:
            await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
