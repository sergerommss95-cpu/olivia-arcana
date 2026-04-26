"""
Olivia Arcana — Social Media Poster Service

Lightweight FastAPI service deployed on Cloud Run. Reads the daily
manifest from GCS and posts content to the requested platform.

Triggered by Cloud Scheduler at staggered times throughout the day.

Endpoints:
    POST /post-next?platform=tiktok    — post next queued TikTok video
    POST /post-next?platform=youtube   — post next queued YouTube Short
    POST /post-next?platform=telegram  — post all queued Telegram messages
    GET  /status                       — today's posting progress
    GET  /health                       — health check
"""

import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse

# Add parent dir to path so we can import shared modules
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.gcs_client import (
    download_manifest,
    update_manifest,
    download_file,
    get_signed_url,
    BUCKET_NAME,
)

app = FastAPI(title="Olivia Arcana Poster", version="1.0.0")

# ─── Platform Posting Logic ────────────────────────────────────────────────


async def post_to_telegram(manifest: dict) -> dict:
    """Post all queued Telegram content."""
    import httpx

    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    channel = os.environ.get("TELEGRAM_CHANNEL", "@OliviaArcanaDaily")
    if not bot_token:
        raise HTTPException(500, "TELEGRAM_BOT_TOKEN not set")

    status = manifest["posting_status"]["telegram"]
    posted = []

    # For Telegram, we post text readings (from the generation scripts)
    # The manifest stores story filenames; we post them as photos with captions
    async with httpx.AsyncClient() as client:
        for filename in list(status["queued"]):
            # Download the story image
            gcs_path = f"{manifest['date']}/stories/{filename}"
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                try:
                    download_file(gcs_path, tmp.name)
                except Exception:
                    status["failed"].append(filename)
                    status["queued"].remove(filename)
                    continue

                # Post photo to Telegram
                url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
                with open(tmp.name, "rb") as photo:
                    resp = await client.post(url, data={
                        "chat_id": channel,
                    }, files={"photo": photo}, timeout=30)

                if resp.status_code == 200:
                    posted.append(filename)
                    status["posted"].append(filename)
                    status["queued"].remove(filename)
                else:
                    status["failed"].append(filename)
                    status["queued"].remove(filename)

                Path(tmp.name).unlink(missing_ok=True)

            # Rate limit: 3s between posts
            import asyncio
            await asyncio.sleep(3)

    update_manifest(manifest)
    return {"platform": "telegram", "posted": len(posted), "remaining": len(status["queued"])}


async def post_to_tiktok(manifest: dict) -> dict:
    """Post next queued video to TikTok via Content Posting API."""
    access_token = os.environ.get("TIKTOK_ACCESS_TOKEN")
    if not access_token:
        raise HTTPException(500, "TIKTOK_ACCESS_TOKEN not set — apply at developers.tiktok.com")

    status = manifest["posting_status"]["tiktok"]
    if not status["queued"]:
        return {"platform": "tiktok", "posted": 0, "message": "nothing queued"}

    filename = status["queued"][0]
    video_entry = next((v for v in manifest["videos"] if v["filename"] == filename), None)
    if not video_entry:
        status["queued"].pop(0)
        update_manifest(manifest)
        raise HTTPException(404, f"Video {filename} not found in manifest")

    import httpx

    # Step 1: Init upload
    async with httpx.AsyncClient() as client:
        # Get video from GCS
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            download_file(video_entry["gcs_path"], tmp.name)
            video_size = Path(tmp.name).stat().st_size

            # TikTok Content Posting API - init upload
            init_resp = await client.post(
                "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "post_info": {
                        "title": f"Daily zodiac reading {filename.replace('.mp4', '').replace('_', ' ')}",
                        "privacy_level": "PUBLIC_TO_EVERYONE",
                    },
                    "source_info": {
                        "source": "FILE_UPLOAD",
                        "video_size": video_size,
                        "chunk_size": video_size,
                        "total_chunk_count": 1,
                    },
                },
                timeout=30,
            )

            if init_resp.status_code != 200:
                status["failed"].append(filename)
                status["queued"].remove(filename)
                update_manifest(manifest)
                Path(tmp.name).unlink(missing_ok=True)
                return {"platform": "tiktok", "error": init_resp.text}

            upload_url = init_resp.json().get("data", {}).get("upload_url")
            if not upload_url:
                status["failed"].append(filename)
                status["queued"].remove(filename)
                update_manifest(manifest)
                Path(tmp.name).unlink(missing_ok=True)
                return {"platform": "tiktok", "error": "no upload_url in response"}

            # Step 2: Upload video
            with open(tmp.name, "rb") as vf:
                upload_resp = await client.put(
                    upload_url,
                    content=vf.read(),
                    headers={
                        "Content-Type": "video/mp4",
                        "Content-Range": f"bytes 0-{video_size - 1}/{video_size}",
                    },
                    timeout=120,
                )

            Path(tmp.name).unlink(missing_ok=True)

            if upload_resp.status_code in (200, 201):
                status["posted"].append(filename)
                status["queued"].remove(filename)
                update_manifest(manifest)
                return {"platform": "tiktok", "posted": 1, "file": filename}
            else:
                status["failed"].append(filename)
                status["queued"].remove(filename)
                update_manifest(manifest)
                return {"platform": "tiktok", "error": upload_resp.text}


async def post_to_youtube(manifest: dict) -> dict:
    """Post next queued video as YouTube Short."""
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        raise HTTPException(500, "YOUTUBE_API_KEY not set")

    status = manifest["posting_status"]["youtube"]
    if not status["queued"]:
        return {"platform": "youtube", "posted": 0, "message": "nothing queued"}

    filename = status["queued"][0]
    video_entry = next((v for v in manifest["videos"] if v["filename"] == filename), None)
    if not video_entry:
        status["queued"].pop(0)
        update_manifest(manifest)
        return {"platform": "youtube", "error": f"Video {filename} not in manifest"}

    # YouTube upload requires OAuth2 (not just API key)
    # For now, mark as needing manual upload
    # TODO: implement OAuth2 flow with refresh token stored in Secret Manager
    return {
        "platform": "youtube",
        "message": "YouTube OAuth2 not yet configured. Video ready at: " + video_entry["gcs_uri"],
        "file": filename,
    }


# ─── Endpoints ──────────────────────────────────────────────────────────────


@app.post("/post-next")
async def post_next(platform: str = Query(..., description="Platform: tiktok, youtube, telegram")):
    manifest = download_manifest()
    if not manifest:
        raise HTTPException(404, "No manifest for today — has the daily pipeline run?")

    if platform == "telegram":
        return await post_to_telegram(manifest)
    elif platform == "tiktok":
        return await post_to_tiktok(manifest)
    elif platform == "youtube":
        return await post_to_youtube(manifest)
    else:
        raise HTTPException(400, f"Unknown platform: {platform}")


@app.get("/status")
async def status():
    manifest = download_manifest()
    if not manifest:
        return {"date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "status": "no manifest"}

    summary = {
        "date": manifest["date"],
        "generated_at": manifest["generated_at"],
        "content": {
            "videos": len(manifest["videos"]),
            "stories": len(manifest["stories"]),
            "feed": len(manifest["feed"]),
        },
        "posting": {},
    }
    for platform, s in manifest["posting_status"].items():
        summary["posting"][platform] = {
            "posted": len(s["posted"]),
            "queued": len(s["queued"]),
            "failed": len(s["failed"]),
        }
    return summary


@app.get("/health")
async def health():
    return {"status": "ok", "service": "olivia-poster", "time": datetime.now(timezone.utc).isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
