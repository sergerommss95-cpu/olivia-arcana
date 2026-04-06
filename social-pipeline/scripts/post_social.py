from __future__ import annotations
"""
from typing import Optional, List
Step 6b-d: Post to TikTok, Instagram, and YouTube.

This module handles automated posting to all three platforms.

APPROACH:
1. TikTok: Content Posting API (requires developer account approval)
   - Fallback: Buffer/Later API for scheduling
2. Instagram: Meta Graph API (requires Business account + Facebook Page)
   - Reels: Instagram Content Publishing API
   - Stories: Meta Business Suite API
3. YouTube: YouTube Data API v3
   - Shorts: Upload as regular video (<60s, 9:16 → auto-detected as Short)

For Phase 1 (before API approval), use Later.com or Buffer API as unified scheduler.
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
from config.settings import (
    TIKTOK_ACCESS_TOKEN, TIKTOK_CLIENT_KEY,
    META_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID,
    YOUTUBE_API_KEY,
    TIKTOK_POST_HOURS, IG_REEL_POST_HOURS, YT_SHORT_POST_HOURS,
    PEAK_HOURS, ZODIAC_SIGNS,
    TIKTOK_CORE_HASHTAGS, TIKTOK_DISCOVERY_HASHTAGS, SIGN_HASHTAGS,
)


# ─── TikTok Content Posting API ─────────────────────────────────────────────

TIKTOK_UPLOAD_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/"
TIKTOK_UPLOAD_CHUNK_URL = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"

async def post_to_tiktok(
    video_path: Path,
    caption: str,
    hashtags: Optional[List[str]] = None,
    schedule_time: Optional[datetime] = None,
) -> dict:
    """
    Post a video to TikTok using the Content Posting API.

    Requires:
    - TikTok Developer account (https://developers.tiktok.com)
    - App with video.publish scope
    - OAuth2 access token

    Rate limit: 20 posts per day per user.
    """
    if not TIKTOK_ACCESS_TOKEN:
        # Log the intent but don't fail
        tag_str = " ".join(hashtags or [])
        print(f"  [tiktok] QUEUE: {video_path.name} | {caption[:60]}... {tag_str}")
        return {"status": "queued", "path": str(video_path), "caption": caption}

    # Build caption with hashtags
    full_caption = caption
    if hashtags:
        full_caption += "\n" + " ".join(hashtags)

    # TikTok Content Posting API flow:
    # 1. Initialize upload
    # 2. Upload video file
    # 3. Publish

    headers = {
        "Authorization": f"Bearer {TIKTOK_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }

    # Step 1: Initialize video upload
    file_size = video_path.stat().st_size
    init_payload = {
        "post_info": {
            "title": full_caption[:150],  # TikTok title limit
            "privacy_level": "PUBLIC_TO_EVERYONE",
            "disable_duet": False,
            "disable_comment": False,
            "disable_stitch": False,
        },
        "source_info": {
            "source": "FILE_UPLOAD",
            "video_size": file_size,
            "chunk_size": file_size,  # Single chunk for small files
            "total_chunk_count": 1,
        },
    }

    async with httpx.AsyncClient() as client:
        # Initialize
        resp = await client.post(
            TIKTOK_UPLOAD_URL,
            headers=headers,
            json=init_payload,
            timeout=30,
        )

        if resp.status_code != 200:
            print(f"  [tiktok] ERROR init: {resp.status_code} - {resp.text[:200]}")
            return {"status": "error", "error": resp.text}

        data = resp.json().get("data", {})
        upload_url = data.get("upload_url", "")
        publish_id = data.get("publish_id", "")

        if not upload_url:
            print(f"  [tiktok] ERROR: No upload URL returned")
            return {"status": "error", "error": "no upload url"}

        # Step 2: Upload video chunk
        with open(video_path, "rb") as f:
            video_bytes = f.read()

        upload_headers = {
            "Content-Range": f"bytes 0-{file_size - 1}/{file_size}",
            "Content-Type": "video/mp4",
        }
        upload_resp = await client.put(
            upload_url,
            headers=upload_headers,
            content=video_bytes,
            timeout=120,
        )

        if upload_resp.status_code in (200, 201):
            print(f"  [tiktok] POSTED: {video_path.name} (publish_id: {publish_id})")
            return {"status": "published", "publish_id": publish_id}
        else:
            print(f"  [tiktok] ERROR upload: {upload_resp.status_code}")
            return {"status": "error", "error": upload_resp.text}


async def schedule_tiktok_posts(
    videos: list[Path],
    scripts: list[dict],
    date_str: str,
) -> list[dict]:
    """Schedule staggered TikTok posts throughout the day."""
    results = []
    today = datetime.fromisoformat(date_str)

    for i, (video, script) in enumerate(zip(videos, scripts)):
        if i >= len(TIKTOK_POST_HOURS):
            break

        sign_name = script.get("sign", "").lower()
        caption = f"{script.get('hook', '')} {script.get('cta', '')}"

        # Build hashtags
        hashtags = list(TIKTOK_CORE_HASHTAGS[:3])
        if sign_name in SIGN_HASHTAGS:
            hashtags.append(SIGN_HASHTAGS[sign_name])
        hashtags.extend(TIKTOK_DISCOVERY_HASHTAGS[:2])

        # Schedule time
        hour = TIKTOK_POST_HOURS[i]
        schedule_time = today.replace(hour=hour, minute=0, tzinfo=timezone.utc)

        result = await post_to_tiktok(
            video_path=video,
            caption=caption,
            hashtags=hashtags,
            schedule_time=schedule_time,
        )
        results.append(result)

        # Rate limiting between posts
        await asyncio.sleep(2)

    return results


# ─── Instagram Graph API ────────────────────────────────────────────────────

GRAPH_API = "https://graph.facebook.com/v19.0"

async def post_reel_to_instagram(
    video_path: Path,
    caption: str,
    hashtags: Optional[List[str]] = None,
) -> dict:
    """
    Post a Reel to Instagram using the Meta Graph API.

    Requires:
    - Instagram Business or Creator account
    - Facebook Page linked to Instagram
    - Meta Developer App with instagram_content_publish permission
    - Long-lived access token

    Process:
    1. Upload video to a public URL (or use Meta's container system)
    2. Create media container
    3. Publish media container
    """
    if not META_ACCESS_TOKEN or not INSTAGRAM_BUSINESS_ACCOUNT_ID:
        tag_str = " ".join(hashtags or [])
        print(f"  [instagram] QUEUE REEL: {video_path.name} | {caption[:60]}... {tag_str}")
        return {"status": "queued", "platform": "instagram_reel", "path": str(video_path)}

    full_caption = caption
    if hashtags:
        full_caption += "\n\n" + " ".join(hashtags)

    async with httpx.AsyncClient() as client:
        # Step 1: Create media container for Reel
        # Note: Video must be accessible via public URL or uploaded first
        # For self-hosted: upload to your server or use a temporary storage
        container_resp = await client.post(
            f"{GRAPH_API}/{INSTAGRAM_BUSINESS_ACCOUNT_ID}/media",
            params={
                "media_type": "REELS",
                "video_url": str(video_path),  # Must be a public URL
                "caption": full_caption,
                "access_token": META_ACCESS_TOKEN,
            },
            timeout=60,
        )

        if container_resp.status_code != 200:
            print(f"  [instagram] ERROR container: {container_resp.text[:200]}")
            return {"status": "error", "error": container_resp.text}

        container_id = container_resp.json().get("id")

        # Step 2: Wait for processing (poll status)
        for _ in range(30):  # Max 5 minutes
            status_resp = await client.get(
                f"{GRAPH_API}/{container_id}",
                params={"fields": "status_code", "access_token": META_ACCESS_TOKEN},
                timeout=30,
            )
            status = status_resp.json().get("status_code")
            if status == "FINISHED":
                break
            elif status == "ERROR":
                return {"status": "error", "error": "processing failed"}
            await asyncio.sleep(10)

        # Step 3: Publish
        publish_resp = await client.post(
            f"{GRAPH_API}/{INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish",
            params={
                "creation_id": container_id,
                "access_token": META_ACCESS_TOKEN,
            },
            timeout=30,
        )

        if publish_resp.status_code == 200:
            media_id = publish_resp.json().get("id")
            print(f"  [instagram] REEL POSTED: {video_path.name} (id: {media_id})")
            return {"status": "published", "media_id": media_id}
        else:
            print(f"  [instagram] ERROR publish: {publish_resp.text[:200]}")
            return {"status": "error", "error": publish_resp.text}


async def post_story_image_to_instagram(image_path: Path) -> dict:
    """Post an image to Instagram Stories via Meta Graph API."""
    if not META_ACCESS_TOKEN or not INSTAGRAM_BUSINESS_ACCOUNT_ID:
        print(f"  [instagram] QUEUE STORY: {image_path.name}")
        return {"status": "queued", "platform": "instagram_story", "path": str(image_path)}

    # Instagram Stories API requires the image to be at a public URL
    # In production, upload to your CDN first
    print(f"  [instagram] Story posting requires public image URL. Queue: {image_path.name}")
    return {"status": "queued", "platform": "instagram_story", "path": str(image_path)}


# ─── YouTube Data API ────────────────────────────────────────────────────────

async def upload_youtube_short(
    video_path: Path,
    title: str,
    description: str,
    tags: Optional[List[str]] = None,
) -> dict:
    """
    Upload a Short to YouTube using the YouTube Data API v3.

    Shorts are auto-detected: video <60s + 9:16 aspect ratio.
    Add #Shorts to title or description.

    Requires:
    - Google Cloud project with YouTube Data API enabled
    - OAuth2 credentials (client_secrets.json)
    - Authorized token with youtube.upload scope
    """
    if not YOUTUBE_API_KEY:
        print(f"  [youtube] QUEUE SHORT: {video_path.name} | {title[:60]}...")
        return {"status": "queued", "platform": "youtube_shorts", "path": str(video_path)}

    # YouTube upload requires google-api-python-client + oauth2client
    # Full implementation uses resumable upload protocol
    try:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        from google.oauth2.credentials import Credentials

        # Load saved credentials
        # In production, these would be stored securely
        print(f"  [youtube] Uploading: {title}")

        # Build service
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

        body = {
            "snippet": {
                "title": title + " #Shorts",
                "description": description,
                "tags": tags or ["astrology", "horoscope", "zodiac"],
                "categoryId": "27",  # Education
            },
            "status": {
                "privacyStatus": "public",
                "selfDeclaredMadeForKids": False,
            },
        }

        media = MediaFileUpload(str(video_path), chunksize=-1, resumable=True)
        request = youtube.videos().insert(
            part=",".join(body.keys()),
            body=body,
            media_body=media,
        )

        response = request.execute()
        video_id = response.get("id", "")
        print(f"  [youtube] SHORT POSTED: {video_path.name} (id: {video_id})")
        return {"status": "published", "video_id": video_id}

    except ImportError:
        print(f"  [youtube] google-api-python-client not installed. Queued: {video_path.name}")
        return {"status": "queued", "reason": "missing dependency"}
    except Exception as e:
        print(f"  [youtube] ERROR: {e}")
        return {"status": "error", "error": str(e)}


# ─── Unified Scheduling ─────────────────────────────────────────────────────

async def schedule_all_social_posts(
    videos: list[Path],
    scripts: list[dict],
    story_cards: list[Path],
    date_str: str,
) -> dict:
    """
    Schedule all social media posts for the day.

    Returns a manifest of what was posted/queued and when.
    """
    manifest = {
        "date": date_str,
        "tiktok": [],
        "instagram_reels": [],
        "instagram_stories": [],
        "youtube_shorts": [],
    }

    # 1. TikTok: all 12 daily videos (staggered hourly)
    print("\n--- TikTok Posts ---")
    tiktok_results = await schedule_tiktok_posts(videos, scripts, date_str)
    manifest["tiktok"] = tiktok_results

    # 2. Instagram Reels: top 3-5 videos at peak hours
    print("\n--- Instagram Reels ---")
    reel_indices = _select_peak_content(scripts, count=3)
    for idx in reel_indices:
        if idx < len(videos):
            caption = f"{scripts[idx].get('hook', '')} {scripts[idx].get('cta', '')}"
            result = await post_reel_to_instagram(
                videos[idx], caption,
                hashtags=["#astrology", f"#{scripts[idx].get('sign', '').lower()}", "#dailyhoroscope"],
            )
            manifest["instagram_reels"].append(result)
            await asyncio.sleep(2)

    # 3. Instagram Stories: all 12 story cards
    print("\n--- Instagram Stories ---")
    for card in story_cards:
        result = await post_story_image_to_instagram(card)
        manifest["instagram_stories"].append(result)
        await asyncio.sleep(1)

    # 4. YouTube Shorts: top 2-3 videos
    print("\n--- YouTube Shorts ---")
    short_indices = _select_peak_content(scripts, count=2)
    for idx in short_indices:
        if idx < len(videos) and idx < len(scripts):
            sign = scripts[idx].get("sign", "Zodiac")
            title = f"{sign} Daily Horoscope {date_str}"
            description = (
                f"{scripts[idx].get('hook', '')} {scripts[idx].get('body', '')}\n\n"
                f"Get your FREE birth chart: {WEBSITE_URL}\n"
                f"Personal readings: t.me/OliviaArcanaBot\n\n"
                f"#astrology #horoscope #{sign.lower()} #zodiac #Shorts"
            )
            result = await upload_youtube_short(
                videos[idx], title, description,
                tags=["astrology", "horoscope", sign.lower(), "zodiac", "daily horoscope"],
            )
            manifest["youtube_shorts"].append(result)
            await asyncio.sleep(5)

    return manifest


def _select_peak_content(scripts: list, count: int = 3) -> list[int]:
    """Select the best scripts for cross-posting based on hook quality heuristics."""
    # Score each script by hook engagement potential
    scores = []
    high_value_words = ["urgent", "warning", "danger", "secret", "truth", "never",
                         "nobody", "shocking", "worst", "best", "only"]

    for i, script in enumerate(scripts):
        hook = script.get("hook", "").lower()
        score = 0
        for word in high_value_words:
            if word in hook:
                score += 2
        if "?" in hook:
            score += 1  # Questions engage
        if any(c.isupper() for c in script.get("hook", "")[1:]):
            score += 1  # ALL CAPS emphasis
        scores.append((i, score))

    scores.sort(key=lambda x: x[1], reverse=True)
    return [s[0] for s in scores[:count]]


# ─── Export posting manifest ─────────────────────────────────────────────────

def save_posting_manifest(manifest: dict, date_str: str) -> Path:
    """Save the posting manifest for audit/tracking."""
    from config.settings import OUTPUT_DIR
    day_dir = OUTPUT_DIR / date_str
    day_dir.mkdir(parents=True, exist_ok=True)
    path = day_dir / "posting_manifest.json"
    with open(path, "w") as f:
        json.dump(manifest, f, indent=2, default=str)
    return path


if __name__ == "__main__":
    print("Social posting module loaded. Requires API tokens to post.")
    print("Set environment variables:")
    print("  TIKTOK_ACCESS_TOKEN - for TikTok Content Posting API")
    print("  META_ACCESS_TOKEN - for Instagram Graph API")
    print("  YOUTUBE_API_KEY - for YouTube Data API")
