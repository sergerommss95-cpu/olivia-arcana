"""
Phase 1 Posting: Use Later.com or Buffer API for scheduling posts.

This is the EASIEST way to auto-post to TikTok + Instagram + YouTube
before getting native API approval from each platform.

Later.com: $25/mo - true auto-post for TikTok, IG Reels, IG Stories, YT
Buffer: $15/mo - auto-post for TikTok, IG Feed, IG Reels (no Stories auto-post)

ALTERNATIVE: Publer.io ($12/mo) - auto-post all 3 platforms

This script uses the Later.com Media Library API to:
1. Upload video/image files
2. Schedule posts with captions, hashtags, and optimal timing
3. Cross-post to all connected platforms
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config.settings import OUTPUT_DIR


# ─── Configuration ───────────────────────────────────────────────────────────

# Set these after creating accounts:
LATER_API_TOKEN = ""       # Later.com API token (if using Later)
BUFFER_ACCESS_TOKEN = ""   # Buffer API token (if using Buffer)
PUBLER_API_KEY = ""        # Publer API key (if using Publer)

# Which scheduler to use
SCHEDULER = "manual"  # "later", "buffer", "publer", or "manual"


# ─── Manual File Export (Default — No API needed) ────────────────────────────

def export_for_manual_upload(
    videos: list[Path],
    scripts: list[dict],
    story_cards: list[Path],
    feed_cards: list[Path],
    date_str: str,
) -> Path:
    """
    Export all content with a manifest for manual upload.

    Creates a folder structure optimized for batch uploading:
    - /tiktok/ — videos with caption files
    - /instagram_reels/ — same videos (no TT watermark)
    - /instagram_stories/ — story card images
    - /instagram_feed/ — feed card images
    - /youtube_shorts/ — same videos with YT-optimized titles
    - /upload_guide.txt — step-by-step upload instructions
    """
    export_dir = OUTPUT_DIR / date_str / "export"
    export_dir.mkdir(parents=True, exist_ok=True)

    # Create platform-specific directories
    for platform in ["tiktok", "instagram_reels", "instagram_stories",
                      "instagram_feed", "youtube_shorts"]:
        (export_dir / platform).mkdir(exist_ok=True)

    # TikTok: videos + caption files
    for i, (video, script) in enumerate(zip(videos, scripts)):
        sign = script.get("sign", f"sign_{i}").lower()
        # Symlink or copy video
        tiktok_path = export_dir / "tiktok" / f"{i+1:02d}_{sign}.mp4"
        if not tiktok_path.exists() and video.exists():
            import shutil
            shutil.copy2(video, tiktok_path)

        # Caption file
        caption = _build_tiktok_caption(script)
        (export_dir / "tiktok" / f"{i+1:02d}_{sign}_caption.txt").write_text(caption)

        # IG Reels (same video, different caption)
        if i < 5:  # Top 5 for Reels
            reel_path = export_dir / "instagram_reels" / f"{i+1:02d}_{sign}.mp4"
            if not reel_path.exists() and video.exists():
                import shutil
                shutil.copy2(video, reel_path)
            ig_caption = _build_instagram_caption(script)
            (export_dir / "instagram_reels" / f"{i+1:02d}_{sign}_caption.txt").write_text(ig_caption)

        # YouTube Shorts (top 3)
        if i < 3:
            yt_path = export_dir / "youtube_shorts" / f"{i+1:02d}_{sign}.mp4"
            if not yt_path.exists() and video.exists():
                import shutil
                shutil.copy2(video, yt_path)
            yt_title, yt_desc = _build_youtube_metadata(script, date_str)
            (export_dir / "youtube_shorts" / f"{i+1:02d}_{sign}_metadata.txt").write_text(
                f"TITLE: {yt_title}\n\nDESCRIPTION:\n{yt_desc}"
            )

    # Instagram Stories
    for i, card in enumerate(story_cards):
        if card.exists():
            import shutil
            shutil.copy2(card, export_dir / "instagram_stories" / card.name)

    # Instagram Feed
    for i, card in enumerate(feed_cards):
        if card.exists():
            import shutil
            shutil.copy2(card, export_dir / "instagram_feed" / card.name)

    # Upload guide
    guide = _generate_upload_guide(date_str, len(videos), len(story_cards))
    (export_dir / "UPLOAD_GUIDE.txt").write_text(guide)

    print(f"\nExport ready: {export_dir}")
    print(f"  TikTok: {len(videos)} videos with captions")
    print(f"  IG Reels: {min(5, len(videos))} videos with captions")
    print(f"  IG Stories: {len(story_cards)} cards")
    print(f"  IG Feed: {len(feed_cards)} cards")
    print(f"  YT Shorts: {min(3, len(videos))} videos with metadata")
    print(f"\nRead {export_dir / 'UPLOAD_GUIDE.txt'} for posting instructions.")

    return export_dir


def _build_tiktok_caption(script: dict) -> str:
    """Build TikTok caption with hashtags."""
    sign = script.get("sign", "")
    hook = script.get("hook", "")
    cta = script.get("cta", "Follow for your daily reading.")
    hashtags = script.get("hashtags", [
        "#astrology", f"#{sign.lower()}", "#zodiac", "#horoscope",
        "#fyp", "#astrologytok",
    ])
    return f"{hook}\n\n{cta}\n\n{' '.join(hashtags)}"


def _build_instagram_caption(script: dict) -> str:
    """Build Instagram Reel caption with more hashtags."""
    sign = script.get("sign", "")
    hook = script.get("hook", "")
    body = script.get("body", "")
    cta = "Get your FREE birth chart reading — link in bio"

    hashtags = [
        "#astrology", "#zodiac", "#horoscope", f"#{sign.lower()}",
        "#dailyhoroscope", "#birthchart", "#zodiacsigns",
        "#astrologyfacts", "#cosmicguidance", "#astrologycommunity",
        "#spirituality", "#zodiacmemes", "#astrologytiktok",
        "#mystic", "#cosmic",
    ]
    return f"{hook}\n\n{body}\n\n{cta}\n\n{' '.join(hashtags)}"


def _build_youtube_metadata(script: dict, date_str: str) -> tuple[str, str]:
    """Build YouTube Short title and description."""
    sign = script.get("sign", "Zodiac")
    # Format date nicely
    from datetime import date
    d = date.fromisoformat(date_str)
    date_nice = d.strftime("%B %d, %Y")

    title = f"{sign} Daily Horoscope {date_nice}"
    description = (
        f"{script.get('hook', '')}\n\n"
        f"{script.get('body', '')}\n\n"
        f"Get your FREE birth chart reading:\n"
        f"Website: https://olivia-arcana.netlify.app\n"
        f"Telegram: https://t.me/OliviaArcanaBot\n\n"
        f"Olivia Arcana uses NASA JPL DE440 Ephemeris data for accurate planetary calculations.\n\n"
        f"#astrology #horoscope #{sign.lower()} #zodiac #dailyhoroscope #Shorts"
    )
    return title, description


def _generate_upload_guide(date_str: str, video_count: int, story_count: int) -> str:
    """Generate step-by-step upload instructions."""
    return f"""OLIVIA ARCANA — DAILY UPLOAD GUIDE
Date: {date_str}
Content: {video_count} videos, {story_count} story cards

═══════════════════════════════════════
TIKTOK ({video_count} videos)
═══════════════════════════════════════

1. Open TikTok app (or Later.com/Buffer)
2. Upload videos from tiktok/ folder IN ORDER (01-12)
3. For each video:
   - Copy caption from the corresponding _caption.txt file
   - Set to "Public"
   - Enable Duets and Stitches
4. Schedule: one per hour from 06:00-17:00 UTC
   (Use TikTok's built-in scheduler or Later.com)
5. Pin a comment on each: "Get your FREE birth chart: link in bio"

POSTING SCHEDULE (UTC):
06:00 — 01_aries.mp4
07:00 — 02_taurus.mp4
08:00 — 03_gemini.mp4
09:00 — 04_cancer.mp4
10:00 — 05_leo.mp4
11:00 — 06_virgo.mp4
12:00 — 07_libra.mp4     ← PEAK HOUR (best content here)
13:00 — 08_scorpio.mp4   ← PEAK HOUR
14:00 — 09_sagittarius.mp4 ← PEAK HOUR
15:00 — 10_capricorn.mp4 ← PEAK HOUR
16:00 — 11_aquarius.mp4
17:00 — 12_pisces.mp4

═══════════════════════════════════════
INSTAGRAM REELS (top 5 videos)
═══════════════════════════════════════

1. Open Instagram (or Later.com/Buffer)
2. Upload videos from instagram_reels/ folder
3. For each: copy caption from _caption.txt (includes 15 hashtags)
4. Schedule: spread across 07:00, 10:00, 12:00, 15:00, 18:00 UTC

═══════════════════════════════════════
INSTAGRAM STORIES ({story_count} cards)
═══════════════════════════════════════

1. Open Instagram Stories
2. Upload ALL story cards from instagram_stories/ folder
3. Add link sticker: "Get your reading → link in bio"
4. Best to batch-upload in the morning (05:30-06:00 UTC)
5. Stories auto-disappear after 24h — save best ones to Highlights

═══════════════════════════════════════
INSTAGRAM FEED (carousel or card)
═══════════════════════════════════════

1. Pick 1 feed card from instagram_feed/ OR create a carousel from multiple
2. Post at 15:00 UTC (peak engagement)
3. Use caption with 15-20 hashtags

═══════════════════════════════════════
YOUTUBE SHORTS (top 3 videos)
═══════════════════════════════════════

1. Open YouTube Studio
2. Upload videos from youtube_shorts/ folder
3. For each: use title and description from _metadata.txt
4. Category: Education
5. Tags: astrology, horoscope, zodiac, daily horoscope, [sign name]
6. Schedule: 07:00, 12:00, 17:00 UTC

═══════════════════════════════════════
DAILY TIME ESTIMATE: 20-30 minutes
(Later.com can reduce this to ~10 minutes with batch scheduling)
═══════════════════════════════════════
"""


# ─── Buffer API Integration ──────────────────────────────────────────────────

BUFFER_API = "https://api.bufferapp.com/1"

async def schedule_via_buffer(
    video_path: Path,
    caption: str,
    profile_ids: list[str],
    scheduled_at: datetime,
) -> dict:
    """Schedule a post via Buffer API."""
    if not BUFFER_ACCESS_TOKEN:
        return {"status": "skipped", "reason": "no buffer token"}

    async with httpx.AsyncClient() as client:
        # Step 1: Upload media
        with open(video_path, "rb") as f:
            upload_resp = await client.post(
                f"{BUFFER_API}/media/upload.json",
                params={"access_token": BUFFER_ACCESS_TOKEN},
                files={"media": f},
                timeout=120,
            )

        if upload_resp.status_code != 200:
            return {"status": "error", "error": upload_resp.text}

        media = upload_resp.json()

        # Step 2: Create scheduled update
        for profile_id in profile_ids:
            update_resp = await client.post(
                f"{BUFFER_API}/updates/create.json",
                params={"access_token": BUFFER_ACCESS_TOKEN},
                json={
                    "text": caption,
                    "profile_ids[]": profile_id,
                    "media": {"video": media.get("url")},
                    "scheduled_at": scheduled_at.isoformat(),
                },
                timeout=30,
            )

    return {"status": "scheduled", "platform": "buffer"}


if __name__ == "__main__":
    # Test export
    from datetime import date as date_cls
    today = date_cls.today().isoformat()
    test_videos = [OUTPUT_DIR / today / "videos" / f"{s['name'].lower()}_daily.mp4" for s in ZODIAC_SIGNS]
    test_scripts = [{"sign": s["name"], "hook": f"Test hook for {s['name']}", "body": "Test body.", "cta": "Follow."} for s in ZODIAC_SIGNS]

    # Just generate the guide
    guide = _generate_upload_guide(today, 12, 12)
    print(guide)

    from config.settings import ZODIAC_SIGNS
