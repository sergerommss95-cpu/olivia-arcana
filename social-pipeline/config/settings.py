"""
Olivia Arcana — Social Media Pipeline Configuration
All API keys loaded from environment variables.
"""
import os
from pathlib import Path

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "output"
PROMPTS_DIR = BASE_DIR / "prompts"
TEMPLATES_DIR = BASE_DIR / "templates"
ASSETS_DIR = BASE_DIR / "assets"
FONTS_DIR = BASE_DIR / "fonts"

# ─── API Keys ────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")

# TikTok Content Posting API
TIKTOK_CLIENT_KEY = os.environ.get("TIKTOK_CLIENT_KEY", "")
TIKTOK_CLIENT_SECRET = os.environ.get("TIKTOK_CLIENT_SECRET", "")
TIKTOK_ACCESS_TOKEN = os.environ.get("TIKTOK_ACCESS_TOKEN", "")

# Meta (Instagram) Graph API
META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN", "")
INSTAGRAM_BUSINESS_ACCOUNT_ID = os.environ.get("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")

# YouTube Data API
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
YOUTUBE_CLIENT_SECRETS_FILE = os.environ.get("YOUTUBE_CLIENT_SECRETS", "")

# ─── ElevenLabs Voice ────────────────────────────────────────────────────────
OLIVIA_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel default
VOICE_MODEL = "eleven_multilingual_v2"
VOICE_SETTINGS = {
    "stability": 0.55,
    "similarity_boost": 0.80,
    "style": 0.35,
    "use_speaker_boost": True,
}

# ─── Social Media Accounts ───────────────────────────────────────────────────
TIKTOK_USERNAME = "oliviaarcana"
INSTAGRAM_USERNAME = "oliviaarcana"
YOUTUBE_CHANNEL_NAME = "Olivia Arcana"

# ─── Links & CTAs ────────────────────────────────────────────────────────────
LINKTREE_URL = "https://linktr.ee/oliviaarcana"
WEBSITE_URL = "https://olivia-arcana.netlify.app"
BOT_URL = "https://t.me/OliviaArcanaBot"
CHANNEL_URL = "https://t.me/OliviaArcanaDaily"

# Bot deep links with source tracking
def bot_link(source: str) -> str:
    return f"https://t.me/OliviaArcanaBot?start={source}"

def website_link(source: str) -> str:
    return f"{WEBSITE_URL}?utm_source={source}&utm_medium=social"

# ─── Design Tokens (Celestial Noir) ─────────────────────────────────────────
COLORS = {
    "void_black": "#0D0D1A",
    "deep_cosmos": "#1A1A3E",
    "celestial_gold": "#D4AF37",
    "slate_blue": "#7B68EE",
    "warm_ivory": "#F5F0E8",
    "muted_lavender": "#9B96A8",
    "cosmic_teal": "#4ECDC4",
    "mars_red": "#E8524A",
}

# Element colors for zodiac signs
ELEMENT_COLORS = {
    "fire": "#E8524A",     # Aries, Leo, Sagittarius
    "earth": "#4ECDC4",    # Taurus, Virgo, Capricorn
    "air": "#7B68EE",      # Gemini, Libra, Aquarius
    "water": "#5B8DEF",    # Cancer, Scorpio, Pisces
}

# ─── Zodiac Data ─────────────────────────────────────────────────────────────
ZODIAC_SIGNS = [
    {"name": "Aries",       "glyph": "\u2648", "element": "fire",  "dates": "Mar 21 - Apr 19"},
    {"name": "Taurus",      "glyph": "\u2649", "element": "earth", "dates": "Apr 20 - May 20"},
    {"name": "Gemini",      "glyph": "\u264A", "element": "air",   "dates": "May 21 - Jun 20"},
    {"name": "Cancer",      "glyph": "\u264B", "element": "water", "dates": "Jun 21 - Jul 22"},
    {"name": "Leo",         "glyph": "\u264C", "element": "fire",  "dates": "Jul 23 - Aug 22"},
    {"name": "Virgo",       "glyph": "\u264D", "element": "earth", "dates": "Aug 23 - Sep 22"},
    {"name": "Libra",       "glyph": "\u264E", "element": "air",   "dates": "Sep 23 - Oct 22"},
    {"name": "Scorpio",     "glyph": "\u264F", "element": "water", "dates": "Oct 23 - Nov 21"},
    {"name": "Sagittarius", "glyph": "\u2650", "element": "fire",  "dates": "Nov 22 - Dec 21"},
    {"name": "Capricorn",   "glyph": "\u2651", "element": "earth", "dates": "Dec 22 - Jan 19"},
    {"name": "Aquarius",    "glyph": "\u2652", "element": "air",   "dates": "Jan 20 - Feb 18"},
    {"name": "Pisces",      "glyph": "\u2653", "element": "water", "dates": "Feb 19 - Mar 20"},
]

# ─── Video Specs ─────────────────────────────────────────────────────────────
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920
VIDEO_FPS = 30
VIDEO_CODEC = "libx264"
AUDIO_CODEC = "aac"
AUDIO_SAMPLE_RATE = 44100

# ─── Posting Schedule (UTC) ─────────────────────────────────────────────────
# TikTok: stagger 12 daily clips across the day (1 per hour, 06:00-17:00 UTC)
TIKTOK_POST_HOURS = list(range(6, 18))  # 06:00 to 17:00 UTC

# Peak hours for weekly skits (highest engagement)
PEAK_HOURS = [12, 13, 14, 15]  # 12:00-15:00 UTC = 7-10 AM EST

# Instagram Stories: batch upload at 05:30 UTC
IG_STORY_POST_HOUR = 5

# Instagram Reels: post at peak hours
IG_REEL_POST_HOURS = [7, 12, 18]

# YouTube Shorts: 2-3 per day
YT_SHORT_POST_HOURS = [7, 14]

# Telegram: batch post at 05:15 UTC
TELEGRAM_POST_HOUR = 5

# ─── Content Types ───────────────────────────────────────────────────────────
CONTENT_TYPES = {
    "daily_zodiac": {
        "duration_range": (15, 30),
        "frequency": "daily",
        "count": 12,
        "platforms": ["tiktok", "youtube_shorts"],
    },
    "zodiac_roast": {
        "duration_range": (30, 60),
        "frequency": "weekly",
        "day": "monday",
        "count": 1,
        "platforms": ["tiktok", "instagram_reels", "youtube_shorts"],
    },
    "compatibility": {
        "duration_range": (30, 45),
        "frequency": "weekly",
        "day": "tuesday",
        "count": 1,
        "platforms": ["tiktok", "instagram_reels"],
    },
    "celebrity_chart": {
        "duration_range": (45, 60),
        "frequency": "weekly",
        "day": "wednesday",
        "count": 1,
        "platforms": ["tiktok", "instagram_reels", "youtube_shorts"],
    },
    "relatable": {
        "duration_range": (15, 30),
        "frequency": "weekly",
        "day": "thursday",
        "count": 1,
        "platforms": ["tiktok", "instagram_reels"],
    },
    "birth_chart_reveal": {
        "duration_range": (30, 45),
        "frequency": "weekly",
        "day": "friday",
        "count": 1,
        "platforms": ["tiktok", "instagram_reels", "youtube_shorts"],
    },
}

# ─── Hashtags ────────────────────────────────────────────────────────────────
TIKTOK_CORE_HASHTAGS = ["#astrology", "#zodiac", "#horoscope", "#zodiacsigns", "#birthchart"]
TIKTOK_DISCOVERY_HASHTAGS = ["#fyp", "#foryou", "#astrologytiktok", "#astrologytok"]

INSTAGRAM_CORE_HASHTAGS = [
    "#astrology", "#zodiac", "#horoscope", "#birthchart", "#zodiacsigns",
    "#dailyhoroscope", "#cosmicguidance", "#astrologyfacts",
]
INSTAGRAM_ENGAGEMENT_HASHTAGS = [
    "#astrologycommunity", "#spirituality", "#mystic", "#cosmic",
]

SIGN_HASHTAGS = {sign["name"].lower(): f"#{sign['name'].lower()}" for sign in ZODIAC_SIGNS}
