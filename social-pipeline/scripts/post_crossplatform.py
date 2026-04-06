from __future__ import annotations
"""
from typing import Optional, List
Cross-platform posting via Late.dev API ($19/mo).

Late.dev is the cheapest unified API for posting to TikTok + Instagram + YouTube.
Single REST call → all connected platforms.

Alternative APIs:
- Ayrshare ($149/mo) — more platforms, more expensive
- Buffer API ($99/mo) — mainstream but pricier
- Direct platform APIs (free) — more setup, maintained separately

Late.dev setup:
1. Sign up at https://getlate.dev
2. Connect TikTok, Instagram, YouTube accounts
3. Get API key
4. Set LATE_DEV_API_KEY environment variable
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
from config.settings import LATE_DEV_API_KEY, OUTPUT_DIR

LATE_API = "https://api.getlate.dev/v1"


async def post_video_all_platforms(
    video_path: Path,
    caption: str,
    platforms: list[str],  # ["tiktok", "instagram", "youtube"]
    scheduled_at: Optional[datetime] = None,
    title: Optional[str] = None,  # YouTube title
    hashtags: Optional[List[str]] = None,
) -> dict:
    """
    Post a single video to multiple platforms via Late.dev API.

    Args:
        video_path: Path to MP4 file
        caption: Text caption (used for TikTok + IG)
        platforms: List of platforms to post to
        scheduled_at: Optional scheduled time (UTC)
        title: YouTube video title
        hashtags: List of hashtags to append
    """
    if not LATE_DEV_API_KEY:
        print(f"  [late.dev] NO API KEY. Queued: {video_path.name} → {', '.join(platforms)}")
        return {
            "status": "queued",
            "video": str(video_path),
            "platforms": platforms,
            "caption": caption[:100],
        }

    if not HAS_HTTPX:
        print("  [late.dev] httpx not installed. pip install httpx")
        return {"status": "error", "error": "httpx not installed"}

    # Build full caption with hashtags
    full_caption = caption
    if hashtags:
        full_caption += "\n\n" + " ".join(hashtags)

    headers = {
        "Authorization": f"Bearer {LATE_DEV_API_KEY}",
    }

    async with httpx.AsyncClient() as client:
        # Step 1: Upload video
        with open(video_path, "rb") as f:
            upload_resp = await client.post(
                f"{LATE_API}/media/upload",
                headers=headers,
                files={"file": (video_path.name, f, "video/mp4")},
                timeout=120,
            )

        if upload_resp.status_code not in (200, 201):
            print(f"  [late.dev] Upload ERROR: {upload_resp.status_code} - {upload_resp.text[:200]}")
            return {"status": "error", "error": upload_resp.text}

        media_id = upload_resp.json().get("id", upload_resp.json().get("media_id"))

        # Step 2: Create post
        post_body = {
            "text": full_caption,
            "media_ids": [media_id],
            "platforms": platforms,
        }

        if scheduled_at:
            post_body["scheduled_at"] = scheduled_at.isoformat()

        if title and "youtube" in platforms:
            post_body["youtube_title"] = title

        post_resp = await client.post(
            f"{LATE_API}/posts",
            headers=headers,
            json=post_body,
            timeout=30,
        )

        if post_resp.status_code in (200, 201):
            post_id = post_resp.json().get("id", "")
            status = "scheduled" if scheduled_at else "published"
            print(f"  [late.dev] {status.upper()}: {video_path.name} → {', '.join(platforms)} (id: {post_id})")
            return {"status": status, "post_id": post_id, "platforms": platforms}
        else:
            print(f"  [late.dev] Post ERROR: {post_resp.status_code} - {post_resp.text[:200]}")
            return {"status": "error", "error": post_resp.text}


async def schedule_daily_content(
    videos: list[Path],
    scripts: list[dict],
    story_cards: list[Path],
    date_str: str,
) -> dict:
    """
    Schedule the full day's content across all platforms.

    Revised frequency (2026 algorithm-optimized):
    - TikTok: 3-5 videos/day at optimal times
    - IG Reels: 1-2/day at peak hours
    - IG Stories: 4-5 cards/day
    - YT Shorts: 2-3/day
    """
    from config.settings import (
        TIKTOK_POST_HOURS, IG_REEL_POST_HOURS, YT_SHORT_POST_HOURS,
        IG_STORY_POST_HOURS, TIKTOK_DAILY_VIDEO_COUNT,
    )

    today = datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)
    manifest = {
        "date": date_str,
        "tiktok": [],
        "instagram_reels": [],
        "instagram_stories": [],
        "youtube_shorts": [],
    }

    # Select best videos for each platform
    video_count = min(len(videos), TIKTOK_DAILY_VIDEO_COUNT)
    best_videos = videos[:video_count]
    best_scripts = scripts[:video_count]

    # ─── TikTok: 3-5 posts staggered ──────────────────────────────────
    print(f"\n--- TikTok ({video_count} posts) ---")
    for i, (video, script) in enumerate(zip(best_videos, best_scripts)):
        if i >= len(TIKTOK_POST_HOURS):
            break

        sign = script.get("sign", "")
        caption = f"{script.get('hook', '')} {script.get('cta', '')}"
        hashtags = [
            "#astrology", f"#{sign.lower()}", "#zodiac", "#horoscope",
            "#fyp", "#astrologytok",
        ]

        schedule_time = today.replace(hour=TIKTOK_POST_HOURS[i], minute=0)

        result = await post_video_all_platforms(
            video_path=video,
            caption=caption,
            platforms=["tiktok"],
            scheduled_at=schedule_time,
            hashtags=hashtags,
        )
        manifest["tiktok"].append(result)
        await asyncio.sleep(1)

    # ─── Instagram Reels: 1-2 posts at peak hours ─────────────────────
    print(f"\n--- Instagram Reels (1-2 posts) ---")
    reel_count = min(2, video_count)
    for i in range(reel_count):
        if i >= len(IG_REEL_POST_HOURS):
            break

        sign = best_scripts[i].get("sign", "")
        caption = (
            f"{best_scripts[i].get('hook', '')} "
            f"{best_scripts[i].get('body', '')}\n\n"
            f"Get your FREE birth chart reading — link in bio"
        )
        hashtags = [
            "#astrology", "#zodiac", "#horoscope", f"#{sign.lower()}",
            "#dailyhoroscope", "#birthchart", "#zodiacsigns",
            "#astrologyfacts", "#cosmicguidance", "#astrologycommunity",
            "#spirituality", "#zodiacmemes",
        ]

        schedule_time = today.replace(hour=IG_REEL_POST_HOURS[i], minute=0)

        result = await post_video_all_platforms(
            video_path=best_videos[i],
            caption=caption,
            platforms=["instagram"],
            scheduled_at=schedule_time,
            hashtags=hashtags,
        )
        manifest["instagram_reels"].append(result)
        await asyncio.sleep(1)

    # ─── YouTube Shorts: 2-3 posts ────────────────────────────────────
    print(f"\n--- YouTube Shorts (2-3 posts) ---")
    short_count = min(3, video_count)
    for i in range(short_count):
        if i >= len(YT_SHORT_POST_HOURS):
            break

        sign = best_scripts[i].get("sign", "")
        from datetime import date
        d = date.fromisoformat(date_str)
        title = f"{sign} Daily Horoscope {d.strftime('%B %d, %Y')}"
        description = (
            f"{best_scripts[i].get('hook', '')} {best_scripts[i].get('body', '')}\n\n"
            f"Get your FREE birth chart: https://olivia-arcana.netlify.app\n"
            f"Personal readings: https://t.me/OliviaArcanaBot\n\n"
            f"#astrology #horoscope #{sign.lower()} #zodiac #Shorts"
        )

        schedule_time = today.replace(hour=YT_SHORT_POST_HOURS[i], minute=0)

        result = await post_video_all_platforms(
            video_path=best_videos[i],
            caption=description,
            platforms=["youtube"],
            scheduled_at=schedule_time,
            title=title,
        )
        manifest["youtube_shorts"].append(result)
        await asyncio.sleep(1)

    # ─── Instagram Stories: 4-5 cards at staggered times ──────────────
    print(f"\n--- Instagram Stories ({min(5, len(story_cards))} stories) ---")
    # Select best 4-5 story cards (rotate signs)
    story_count = min(5, len(story_cards))
    selected_stories = story_cards[:story_count]

    for i, card in enumerate(selected_stories):
        if i >= len(IG_STORY_POST_HOURS):
            break

        result = await post_video_all_platforms(
            video_path=card,  # Late.dev supports image upload too
            caption="",
            platforms=["instagram"],  # As story
            scheduled_at=today.replace(hour=IG_STORY_POST_HOURS[i], minute=0),
        )
        manifest["instagram_stories"].append(result)
        await asyncio.sleep(1)

    # Save manifest
    day_dir = OUTPUT_DIR / date_str
    day_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = day_dir / "crosspost_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2, default=str)

    # Summary
    total = (
        len(manifest["tiktok"]) +
        len(manifest["instagram_reels"]) +
        len(manifest["instagram_stories"]) +
        len(manifest["youtube_shorts"])
    )
    print(f"\n--- Summary: {total} posts scheduled ---")
    print(f"  TikTok: {len(manifest['tiktok'])}")
    print(f"  IG Reels: {len(manifest['instagram_reels'])}")
    print(f"  IG Stories: {len(manifest['instagram_stories'])}")
    print(f"  YT Shorts: {len(manifest['youtube_shorts'])}")

    return manifest


def select_daily_video_signs(date_str: str, total_signs: int = 12, video_count: int = 4) -> list[int]:
    """
    Select which signs get full video treatment today.
    Rotates so every sign gets a video approximately every 3 days.

    Returns list of indices (0-11) into ZODIAC_SIGNS.
    """
    from datetime import date
    d = date.fromisoformat(date_str)
    day_number = d.toordinal()

    # Rotate starting position
    start = (day_number * video_count) % total_signs
    indices = [(start + i) % total_signs for i in range(video_count)]
    return indices


if __name__ == "__main__":
    from config.settings import ZODIAC_SIGNS

    # Test sign rotation
    from datetime import date, timedelta
    base = date(2026, 4, 7)
    for i in range(7):
        d = base + timedelta(days=i)
        indices = select_daily_video_signs(d.isoformat())
        signs = [ZODIAC_SIGNS[idx]["name"] for idx in indices]
        print(f"{d}: Videos for {', '.join(signs)}")
