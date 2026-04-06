#!/usr/bin/env python3
"""
OLIVIA ARCANA — DAILY CONTENT PIPELINE ORCHESTRATOR

Run daily at 04:00 UTC via cron:
  0 4 * * * cd /path/to/social-pipeline && python scripts/daily_pipeline.py

What it does:
  1. Computes today's planetary transits (kerykeion / NASA JPL)
  2. Generates 12 TikTok scripts + 12 Story texts + 12 Telegram texts (Claude API)
  3. Generates 12 voiceover audio files (ElevenLabs)
  4. Renders 12 captioned videos (FFmpeg)
  5. Generates 24 image cards (Pillow: 12 Story + 12 Feed)
  6. Posts to Telegram channel
  7. Schedules TikTok + Instagram + YouTube posts

Total time: ~10-15 minutes
Total daily cost: ~$1.50 (Claude ~$0.60, ElevenLabs ~$0.60, everything else free)
"""
import asyncio
import json
import time
from datetime import date, datetime, timezone
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config.settings import OUTPUT_DIR
from scripts.compute_transits import get_daily_transits, save_transit_data
from scripts.generate_scripts import generate_daily_scripts, save_scripts
from scripts.generate_audio import generate_all_daily_audio
from scripts.generate_video import generate_all_daily_videos
from scripts.generate_images import generate_all_story_cards, generate_all_feed_cards
from scripts.post_telegram import post_all_daily_readings
from scripts.post_social import schedule_all_social_posts, save_posting_manifest
from scripts.post_via_scheduler import export_for_manual_upload


async def run_daily_pipeline():
    """Execute the full daily content pipeline."""
    start_time = time.time()
    today = date.today().isoformat()
    print(f"{'='*60}")
    print(f"OLIVIA ARCANA — Daily Content Pipeline")
    print(f"Date: {today}")
    print(f"Started: {datetime.now(timezone.utc).isoformat()}")
    print(f"{'='*60}")

    # Create output directory
    day_dir = OUTPUT_DIR / today
    day_dir.mkdir(parents=True, exist_ok=True)

    # ─── Step 1: Transit Data ────────────────────────────────────────────
    print(f"\n[Step 1/7] Computing planetary transits...")
    t1 = time.time()
    transit_data = get_daily_transits()
    save_transit_data(transit_data, today)
    print(f"  Done ({time.time()-t1:.1f}s). Moon phase: {transit_data['moon_phase']}")

    # ─── Step 2: Script Generation ───────────────────────────────────────
    print(f"\n[Step 2/7] Generating scripts (Claude API)...")
    t2 = time.time()
    scripts = await generate_daily_scripts(transit_data)
    save_scripts(scripts, today)

    tiktok_scripts = scripts.get("tiktok", [])
    story_scripts = scripts.get("stories", [])
    telegram_scripts = scripts.get("telegram", [])
    print(f"  Done ({time.time()-t2:.1f}s). "
          f"{len(tiktok_scripts)} TikTok + {len(story_scripts)} Story + {len(telegram_scripts)} Telegram")

    # ─── Step 3: Audio Generation ────────────────────────────────────────
    print(f"\n[Step 3/7] Generating voiceover audio (ElevenLabs)...")
    t3 = time.time()
    audio_files = await generate_all_daily_audio(tiktok_scripts, today)
    print(f"  Done ({time.time()-t3:.1f}s). {len(audio_files)} audio files")

    # ─── Step 4: Video Rendering ─────────────────────────────────────────
    print(f"\n[Step 4/7] Rendering videos (FFmpeg)...")
    t4 = time.time()
    video_files = await generate_all_daily_videos(tiktok_scripts, audio_files, today)
    print(f"  Done ({time.time()-t4:.1f}s). {len(video_files)} videos")

    # ─── Step 5: Image Generation ────────────────────────────────────────
    print(f"\n[Step 5/7] Generating image cards (Pillow)...")
    t5 = time.time()
    story_cards, feed_cards = await asyncio.gather(
        generate_all_story_cards(story_scripts, today),
        generate_all_feed_cards(story_scripts, today),
    )
    print(f"  Done ({time.time()-t5:.1f}s). {len(story_cards)} story + {len(feed_cards)} feed cards")

    # ─── Step 6: Post to Telegram ────────────────────────────────────────
    print(f"\n[Step 6/7] Posting to Telegram channel...")
    t6 = time.time()
    telegram_count = await post_all_daily_readings(telegram_scripts)
    print(f"  Done ({time.time()-t6:.1f}s). {telegram_count} posts sent")

    # ─── Step 7: Schedule Social Media ───────────────────────────────────
    print(f"\n[Step 7/8] Scheduling social media posts...")
    t7 = time.time()
    manifest = await schedule_all_social_posts(video_files, tiktok_scripts, story_cards, today)
    manifest_path = save_posting_manifest(manifest, today)
    print(f"  Done ({time.time()-t7:.1f}s). Manifest: {manifest_path}")

    # ─── Step 8: Export for Manual Upload (Phase 1 fallback) ─────────────
    print(f"\n[Step 8/8] Exporting for manual upload...")
    t8 = time.time()
    export_dir = export_for_manual_upload(video_files, tiktok_scripts, story_cards, feed_cards, today)
    print(f"  Done ({time.time()-t8:.1f}s). Export: {export_dir}")

    # ─── Summary ─────────────────────────────────────────────────────────
    total_time = time.time() - start_time
    total_content = (
        len(video_files) + len(story_cards) + len(feed_cards)
    )

    print(f"\n{'='*60}")
    print(f"PIPELINE COMPLETE")
    print(f"{'='*60}")
    print(f"  Total time: {total_time:.0f}s ({total_time/60:.1f} minutes)")
    print(f"  Content generated:")
    print(f"    - {len(video_files)} videos (TikTok/Reels/Shorts)")
    print(f"    - {len(story_cards)} Story cards")
    print(f"    - {len(feed_cards)} Feed cards")
    print(f"    - {telegram_count} Telegram posts")
    print(f"  Total pieces: {total_content}")
    print(f"  Output directory: {day_dir}")

    # Save summary
    summary = {
        "date": today,
        "started": datetime.now(timezone.utc).isoformat(),
        "total_time_seconds": round(total_time, 1),
        "videos": len(video_files),
        "story_cards": len(story_cards),
        "feed_cards": len(feed_cards),
        "telegram_posts": telegram_count,
        "total_content_pieces": total_content,
        "transit_data": transit_data["date"],
        "moon_phase": transit_data["moon_phase"],
    }
    with open(day_dir / "pipeline_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    return summary


async def run_weekly_skit(content_type: str, **kwargs):
    """Run a weekly skit generation (roast, compatibility, celebrity, etc.)."""
    today = date.today().isoformat()
    print(f"\n{'='*60}")
    print(f"OLIVIA ARCANA — Weekly Skit: {content_type}")
    print(f"{'='*60}")

    transit_data = get_daily_transits()

    from scripts.generate_scripts import (
        generate_roast_script, generate_compatibility_script,
        generate_celebrity_script, generate_relatable_script,
    )
    from scripts.generate_audio import generate_skit_audio
    from scripts.generate_video import generate_skit_video

    if content_type == "roast":
        sign = kwargs.get("sign", "Gemini")  # Default roast target
        script = await generate_roast_script(sign, transit_data)
    elif content_type == "compatibility":
        sign_a = kwargs.get("sign_a", "Leo")
        sign_b = kwargs.get("sign_b", "Scorpio")
        script = await generate_compatibility_script(sign_a, sign_b)
    elif content_type == "celebrity":
        celebrity = kwargs.get("celebrity", "Taylor Swift")
        sun_sign = kwargs.get("sun_sign", "Sagittarius")
        birth_date = kwargs.get("birth_date", "December 13, 1989")
        script = await generate_celebrity_script(celebrity, sun_sign, birth_date)
    elif content_type == "relatable":
        topic = kwargs.get("topic", "they get a text from their ex")
        script = await generate_relatable_script(topic)
    else:
        print(f"Unknown content type: {content_type}")
        return

    # Generate audio
    audio_path = await generate_skit_audio(script, content_type, today)

    # Generate video
    video_path = await generate_skit_video(script, audio_path, content_type, today)

    print(f"\nSkit generated: {video_path}")
    return video_path


# ─── Weekly Skit Schedule ────────────────────────────────────────────────────

WEEKLY_SKIT_SCHEDULE = {
    0: {"type": "roast", "signs": ["Gemini", "Scorpio", "Aries", "Leo", "Pisces", "Virgo",
                                    "Sagittarius", "Cancer", "Libra", "Aquarius", "Taurus", "Capricorn"]},
    1: {"type": "compatibility", "pairs": [
        ("Leo", "Scorpio"), ("Aries", "Libra"), ("Gemini", "Sagittarius"),
        ("Cancer", "Capricorn"), ("Taurus", "Scorpio"), ("Virgo", "Pisces"),
    ]},
    2: {"type": "celebrity"},  # Manually set trending celebrity
    3: {"type": "relatable", "topics": [
        "they get a text from their ex",
        "they're running late",
        "someone cancels plans",
        "they have a crush",
        "they get into an argument",
        "they're stressed about money",
    ]},
    4: {"type": "birth_chart_reveal"},
}


async def run_weekly_skit_for_today():
    """Run the appropriate weekly skit based on day of week."""
    from datetime import date as date_cls
    weekday = date_cls.today().weekday()
    week_number = date_cls.today().isocalendar()[1]

    schedule = WEEKLY_SKIT_SCHEDULE.get(weekday)
    if not schedule:
        print(f"No weekly skit scheduled for today (weekday {weekday})")
        return

    skit_type = schedule["type"]

    if skit_type == "roast":
        signs = schedule["signs"]
        sign = signs[week_number % len(signs)]
        await run_weekly_skit("roast", sign=sign)

    elif skit_type == "compatibility":
        pairs = schedule["pairs"]
        pair = pairs[week_number % len(pairs)]
        await run_weekly_skit("compatibility", sign_a=pair[0], sign_b=pair[1])

    elif skit_type == "relatable":
        topics = schedule["topics"]
        topic = topics[week_number % len(topics)]
        await run_weekly_skit("relatable", topic=topic)

    elif skit_type == "celebrity":
        # Celebrity needs manual input (trending person)
        print("Celebrity skit: set celebrity manually or use trending detection")

    elif skit_type == "birth_chart_reveal":
        # Use the same roast pipeline but with reveal script
        await run_weekly_skit("roast", sign="Pisces")  # Placeholder


# ─── CLI Interface ───────────────────────────────────────────────────────────

def main():
    """CLI entry point."""
    import argparse
    parser = argparse.ArgumentParser(description="Olivia Arcana Content Pipeline")
    parser.add_argument("command", choices=["daily", "skit", "full"],
                        help="daily=12 daily clips, skit=weekly skit, full=daily+skit")
    parser.add_argument("--type", default="roast",
                        help="Skit type: roast, compatibility, celebrity, relatable")
    parser.add_argument("--sign", default="Gemini", help="Sign for roast")
    parser.add_argument("--sign-a", default="Leo", help="Sign A for compatibility")
    parser.add_argument("--sign-b", default="Scorpio", help="Sign B for compatibility")
    parser.add_argument("--celebrity", default="Taylor Swift", help="Celebrity name")
    parser.add_argument("--topic", default="they get a text from their ex", help="Relatable topic")

    args = parser.parse_args()

    if args.command == "daily":
        asyncio.run(run_daily_pipeline())
    elif args.command == "skit":
        kwargs = {
            "sign": args.sign,
            "sign_a": args.sign_a,
            "sign_b": args.sign_b,
            "celebrity": args.celebrity,
            "sun_sign": "Sagittarius",
            "birth_date": "December 13, 1989",
            "topic": args.topic,
        }
        asyncio.run(run_weekly_skit(args.type, **kwargs))
    elif args.command == "full":
        async def full():
            await run_daily_pipeline()
            await run_weekly_skit_for_today()
        asyncio.run(full())


if __name__ == "__main__":
    main()
