#!/usr/bin/env python3
"""
Cron-like scheduler that runs the pipeline at optimal times.

Use this instead of system cron if you want Python-level control.
Alternatively, add to system crontab:

    # Daily pipeline at 04:00 UTC
    0 4 * * * cd ~/olivia-arcana/social-pipeline && python scripts/daily_pipeline.py daily >> logs/pipeline.log 2>&1

    # Weekly skit (full = daily + skit for today)
    0 3 * * 1-5 cd ~/olivia-arcana/social-pipeline && python scripts/daily_pipeline.py full >> logs/pipeline.log 2>&1

This script provides a self-contained scheduler for environments without cron.
"""
import asyncio
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


# Schedule definition (UTC)
SCHEDULE = [
    {"hour": 4, "minute": 0, "task": "daily", "description": "Daily content pipeline"},
    {"hour": 3, "minute": 0, "task": "skit", "days": [0, 1, 2, 3, 4], "description": "Weekly skit (Mon-Fri)"},
]


def next_run_time(hour: int, minute: int, days: list[int] | None = None) -> datetime:
    """Calculate the next run time for a scheduled task."""
    now = datetime.now(timezone.utc)
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

    if target <= now:
        target += timedelta(days=1)

    if days:
        while target.weekday() not in days:
            target += timedelta(days=1)

    return target


async def scheduler_loop():
    """Main scheduler loop. Runs forever, executing tasks at their scheduled times."""
    print("Olivia Arcana Content Scheduler started")
    print(f"Scheduled tasks:")
    for task in SCHEDULE:
        days_str = ""
        if "days" in task:
            day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            days_str = f" ({', '.join(day_names[d] for d in task['days'])})"
        print(f"  {task['hour']:02d}:{task['minute']:02d} UTC{days_str} — {task['description']}")

    while True:
        now = datetime.now(timezone.utc)

        for task in SCHEDULE:
            next_time = next_run_time(task["hour"], task["minute"], task.get("days"))
            time_until = (next_time - now).total_seconds()

            if time_until <= 60:  # Within 1 minute of scheduled time
                print(f"\n{'='*60}")
                print(f"EXECUTING: {task['description']} at {now.isoformat()}")
                print(f"{'='*60}")

                try:
                    from scripts.daily_pipeline import run_daily_pipeline, run_weekly_skit_for_today

                    if task["task"] == "daily":
                        await run_daily_pipeline()
                    elif task["task"] == "skit":
                        await run_weekly_skit_for_today()
                    elif task["task"] == "full":
                        await run_daily_pipeline()
                        await run_weekly_skit_for_today()

                except Exception as e:
                    print(f"ERROR in {task['description']}: {e}")
                    import traceback
                    traceback.print_exc()

                # Sleep past this minute to avoid re-triggering
                await asyncio.sleep(120)
                break

        # Check every 30 seconds
        await asyncio.sleep(30)


if __name__ == "__main__":
    print("Starting Olivia Arcana content scheduler...")
    print("Press Ctrl+C to stop.\n")
    try:
        asyncio.run(scheduler_loop())
    except KeyboardInterrupt:
        print("\nScheduler stopped.")
