"""
Google Cloud Storage client for the Olivia Arcana pipeline.

Uploads daily output (videos, images, manifests) to a GCS bucket
organized by date. The poster service reads from the same bucket.

Usage:
    from gcs_client import upload_daily_output, download_manifest, update_manifest

Bucket structure:
    gs://olivia-arcana-daily/
    └── 2026-04-13/
        ├── videos/01_aries.mp4
        ├── stories/01_aries.png
        ├── feed/01_aries.png
        └── manifest.json
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

BUCKET_NAME = os.environ.get("GCS_BUCKET", "olivia-arcana-daily")
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "project-f778abe0-d2d9-47df-802")


def _get_client():
    from google.cloud import storage
    return storage.Client(project=PROJECT_ID)


def _today_prefix():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def upload_file(local_path: str, gcs_path: str) -> str:
    """Upload a single file to GCS. Returns the gs:// URI."""
    client = _get_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(gcs_path)
    blob.upload_from_filename(local_path)
    uri = f"gs://{BUCKET_NAME}/{gcs_path}"
    print(f"  uploaded: {uri} ({Path(local_path).stat().st_size // 1024} KB)")
    return uri


def upload_daily_output(output_dir: str) -> dict:
    """Upload all daily output to GCS under today's date prefix.

    Expected output_dir structure:
        output/
        ├── videos/  (*.mp4)
        ├── stories/ (*.png)
        ├── feed/    (*.png)
        └── audio/   (*.mp3)

    Returns a manifest dict with all uploaded URIs.
    """
    prefix = _today_prefix()
    output_path = Path(output_dir)
    manifest = {
        "date": prefix,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "videos": [],
        "stories": [],
        "feed": [],
        "audio": [],
        "posting_status": {},
    }

    for subdir in ["videos", "stories", "feed", "audio"]:
        local_dir = output_path / subdir
        if not local_dir.exists():
            continue
        for f in sorted(local_dir.iterdir()):
            if f.is_file() and f.suffix in (".mp4", ".png", ".mp3", ".jpg"):
                gcs_path = f"{prefix}/{subdir}/{f.name}"
                uri = upload_file(str(f), gcs_path)
                manifest[subdir].append({
                    "filename": f.name,
                    "gcs_uri": uri,
                    "gcs_path": gcs_path,
                    "size_kb": f.stat().st_size // 1024,
                })

    # Initialize posting status for each platform
    for platform in ["tiktok", "youtube", "instagram_reels", "instagram_stories", "telegram"]:
        manifest["posting_status"][platform] = {
            "posted": [],
            "queued": [v["filename"] for v in manifest["videos"]],
            "failed": [],
        }
    # Telegram gets all content types
    manifest["posting_status"]["telegram"]["queued"] = [
        s["filename"] for s in manifest["stories"]
    ]

    # Upload manifest
    manifest_json = json.dumps(manifest, indent=2)
    client = _get_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"{prefix}/manifest.json")
    blob.upload_from_string(manifest_json, content_type="application/json")
    print(f"  uploaded: gs://{BUCKET_NAME}/{prefix}/manifest.json")

    return manifest


def download_manifest(date: str = None) -> dict:
    """Download today's (or a specific date's) manifest from GCS."""
    prefix = date or _today_prefix()
    client = _get_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"{prefix}/manifest.json")
    if not blob.exists():
        return None
    return json.loads(blob.download_as_text())


def update_manifest(manifest: dict) -> None:
    """Write an updated manifest back to GCS."""
    prefix = manifest["date"]
    client = _get_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"{prefix}/manifest.json")
    blob.upload_from_string(
        json.dumps(manifest, indent=2),
        content_type="application/json",
    )


def get_signed_url(gcs_path: str, expiration_minutes: int = 60) -> str:
    """Generate a signed URL for a GCS object (for posting APIs that need HTTP URLs)."""
    from datetime import timedelta
    client = _get_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(gcs_path)
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=expiration_minutes),
        method="GET",
    )


def download_file(gcs_path: str, local_path: str) -> str:
    """Download a file from GCS to local disk."""
    client = _get_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(gcs_path)
    Path(local_path).parent.mkdir(parents=True, exist_ok=True)
    blob.download_to_filename(local_path)
    return local_path
