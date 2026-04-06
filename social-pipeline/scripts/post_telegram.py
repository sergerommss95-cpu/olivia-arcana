from __future__ import annotations
"""
from typing import Optional, List
Step 6a: Post to Telegram channels.
Posts daily zodiac readings + tarot to the public channel.
"""
import asyncio
from pathlib import Path

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config.settings import TELEGRAM_BOT_TOKEN, CHANNEL_URL


TELEGRAM_API = "https://api.telegram.org/bot{token}"


async def post_text_to_channel(text: str, channel: str = "@OliviaArcanaDaily") -> bool:
    """Post a text message to a Telegram channel."""
    if not TELEGRAM_BOT_TOKEN:
        print(f"  [telegram] SKIP (no token): {text[:60]}...")
        return False

    url = f"{TELEGRAM_API.format(token=TELEGRAM_BOT_TOKEN)}/sendMessage"
    payload = {
        "chat_id": channel,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            print(f"  [telegram] Posted to {channel}")
            return True
        else:
            print(f"  [telegram] ERROR: {response.status_code} - {response.text[:200]}")
            return False


async def post_photo_to_channel(
    photo_path: Path,
    caption: str = "",
    channel: str = "@OliviaArcanaDaily",
) -> bool:
    """Post a photo to a Telegram channel."""
    if not TELEGRAM_BOT_TOKEN:
        print(f"  [telegram] SKIP (no token): photo {photo_path.name}")
        return False

    url = f"{TELEGRAM_API.format(token=TELEGRAM_BOT_TOKEN)}/sendPhoto"

    async with httpx.AsyncClient() as client:
        with open(photo_path, "rb") as f:
            response = await client.post(
                url,
                data={"chat_id": channel, "caption": caption, "parse_mode": "HTML"},
                files={"photo": f},
                timeout=60,
            )
        if response.status_code == 200:
            print(f"  [telegram] Photo posted to {channel}")
            return True
        else:
            print(f"  [telegram] ERROR: {response.status_code}")
            return False


async def post_all_daily_readings(telegram_scripts: list, channel: str = "@OliviaArcanaDaily") -> int:
    """Post all 12 daily zodiac readings to the channel."""
    success_count = 0
    for script in telegram_scripts:
        text = script.get("text", "")
        if text:
            success = await post_text_to_channel(text, channel)
            if success:
                success_count += 1
            # Rate limiting: 1 message per 3 seconds
            await asyncio.sleep(3)

    print(f"Posted {success_count}/{len(telegram_scripts)} readings to {channel}")
    return success_count


async def post_tarot_card(reading_text: str, card_image: Optional[Path] = None, channel: str = "@OliviaArcanaDaily"):
    """Post the daily tarot card reading."""
    if card_image and card_image.exists():
        await post_photo_to_channel(card_image, reading_text, channel)
    else:
        await post_text_to_channel(f"🃏 TAROT CARD OF THE DAY\n\n{reading_text}", channel)


async def post_evening_teaser(teaser_text: str, channel: str = "@OliviaArcanaDaily"):
    """Post the evening teaser for tomorrow's readings."""
    await post_text_to_channel(
        f"✨ COMING TOMORROW\n\n{teaser_text}\n\n"
        f"Want your PERSONAL reading? → @OliviaArcanaBot",
        channel,
    )


if __name__ == "__main__":
    test_scripts = [
        {"sign": "Aries", "glyph": "♈", "text": "♈ ARIES\n\nTest reading for Aries today.\n\nWant your PERSONAL reading? → @OliviaArcanaBot"},
    ]
    asyncio.run(post_all_daily_readings(test_scripts))
