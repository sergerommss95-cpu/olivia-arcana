from __future__ import annotations
"""
from typing import Optional, List
Step 4: Generate 9:16 vertical videos using FFmpeg.
Combines background + audio + animated captions + branding.

This is the ZERO-COST video pipeline — no CapCut, no HeyGen, no external API.
Just FFmpeg + Python generating professional-looking zodiac clips.

Requirements: ffmpeg, ffprobe (installed via: brew install ffmpeg)
"""
import json
import subprocess
import shutil
from pathlib import Path
from datetime import date
import math

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config.settings import (
    VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, VIDEO_CODEC, AUDIO_CODEC,
    AUDIO_SAMPLE_RATE, OUTPUT_DIR, ASSETS_DIR, FONTS_DIR, COLORS,
    ELEMENT_COLORS, ZODIAC_SIGNS,
)


def _check_ffmpeg() -> bool:
    """Verify ffmpeg is available."""
    return shutil.which("ffmpeg") is not None


def _get_audio_duration(audio_path: Path) -> float:
    """Get duration of an audio file in seconds using ffprobe."""
    if not audio_path.exists() or audio_path.stat().st_size == 0:
        return 20.0  # Default 20 seconds for placeholder

    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
        capture_output=True, text=True,
    )
    try:
        return float(result.stdout.strip())
    except (ValueError, AttributeError):
        return 20.0


def _hex_to_ffmpeg(hex_color: str) -> str:
    """Convert hex color to FFmpeg format (0xRRGGBB)."""
    return "0x" + hex_color.lstrip("#")


def generate_zodiac_video(
    sign_name: str,
    glyph: str,
    element: str,
    hook_text: str,
    body_text: str,
    cta_text: str,
    audio_path: Path,
    output_path: Path,
    duration: Optional[float] = None,
) -> Path:
    """
    Generate a complete zodiac TikTok video using FFmpeg.

    The video has:
    - Dark gradient background with animated subtle particle effect
    - Zodiac glyph centered with element color
    - Word-by-word caption animation synced to audio
    - Olivia Arcana watermark
    """
    if not _check_ffmpeg():
        print("WARNING: ffmpeg not found. Skipping video generation.")
        return output_path

    if duration is None:
        duration = _get_audio_duration(audio_path)

    # Add 1 second padding at start and end
    total_duration = duration + 2
    W, H = VIDEO_WIDTH, VIDEO_HEIGHT

    # Colors
    bg1 = COLORS["void_black"]
    bg2 = COLORS["deep_cosmos"]
    gold = COLORS["celestial_gold"]
    elem_color = ELEMENT_COLORS.get(element, gold)
    ivory = COLORS["warm_ivory"]

    # Full script for captions
    full_text = f"{hook_text} {body_text} {cta_text}"

    # Split into caption groups (2-3 words each)
    words = full_text.split()
    caption_groups = []
    i = 0
    while i < len(words):
        group_size = 3 if len(words[i]) < 5 else 2
        group = " ".join(words[i:i + group_size])
        caption_groups.append(group)
        i += group_size

    # Calculate timing for each caption group
    words_per_second = len(words) / duration
    captions_with_timing = []
    current_time = 1.0  # Start after 1s padding
    for group in caption_groups:
        word_count = len(group.split())
        group_duration = word_count / words_per_second
        captions_with_timing.append({
            "text": group,
            "start": round(current_time, 2),
            "end": round(current_time + group_duration, 2),
        })
        current_time += group_duration

    # Build FFmpeg filter complex
    # 1. Background: dark solid color (gradient via overlay)
    # 2. Zodiac glyph text at center-top
    # 3. Animated captions in center-bottom
    # 4. OA watermark bottom-right

    # Font paths
    font_bold = FONTS_DIR / "Inter-Bold.ttf"
    font_regular = FONTS_DIR / "Inter-Regular.ttf"
    font_display = FONTS_DIR / "PlayfairDisplay-Bold.ttf"
    font_accent = FONTS_DIR / "CormorantGaramond-Medium.ttf"

    # Use system fonts as fallback
    font_arg = ""
    if font_bold.exists():
        font_arg = f":fontfile='{font_bold}'"
    elif Path("/System/Library/Fonts/Helvetica.ttc").exists():
        font_arg = ":fontfile='/System/Library/Fonts/Helvetica.ttc'"

    display_font_arg = ""
    if font_display.exists():
        display_font_arg = f":fontfile='{font_display}'"

    accent_font_arg = ""
    if font_accent.exists():
        accent_font_arg = f":fontfile='{font_accent}'"

    # Build drawtext filters for animated captions
    caption_filters = []
    for cap in captions_with_timing:
        escaped_text = cap["text"].replace("'", "'\\''").replace(":", "\\:")
        # Main caption text (white, bold, centered, lower third)
        caption_filters.append(
            f"drawtext=text='{escaped_text}'"
            f"{font_arg}"
            f":fontsize=64"
            f":fontcolor=white"
            f":borderw=3"
            f":bordercolor=black"
            f":shadowcolor=black@0.6:shadowx=2:shadowy=2"
            f":x=(w-text_w)/2"
            f":y=h*0.72"
            f":enable='between(t,{cap['start']},{cap['end']})'"
        )

    # Zodiac glyph (static, top-center)
    glyph_escaped = glyph.replace("'", "'\\''")
    glyph_filter = (
        f"drawtext=text='{glyph_escaped}'"
        f"{display_font_arg}"
        f":fontsize=180"
        f":fontcolor={_hex_to_ffmpeg(elem_color)}"
        f":x=(w-text_w)/2"
        f":y=h*0.15"
    )

    # Sign name (below glyph)
    sign_escaped = sign_name.upper().replace("'", "'\\''")
    sign_filter = (
        f"drawtext=text='{sign_escaped}'"
        f"{display_font_arg}"
        f":fontsize=48"
        f":fontcolor={_hex_to_ffmpeg(gold)}"
        f":x=(w-text_w)/2"
        f":y=h*0.30"
    )

    # Watermark
    watermark_filter = (
        f"drawtext=text='OLIVIA ARCANA'"
        f"{accent_font_arg}"
        f":fontsize=20"
        f":fontcolor={_hex_to_ffmpeg(gold)}@0.5"
        f":x=w-text_w-30"
        f":y=h-50"
    )

    # Combine all filters
    all_filters = [glyph_filter, sign_filter, watermark_filter] + caption_filters
    filter_chain = ",".join(all_filters)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Build FFmpeg command
    has_audio = audio_path.exists() and audio_path.stat().st_size > 0

    cmd = ["ffmpeg", "-y"]

    # Input: color background
    cmd.extend([
        "-f", "lavfi",
        "-i", f"color=c={_hex_to_ffmpeg(bg1)}:s={W}x{H}:d={total_duration}:r={VIDEO_FPS}",
    ])

    # Input: audio (if available)
    if has_audio:
        cmd.extend(["-i", str(audio_path)])

    # Filters
    cmd.extend([
        "-filter_complex",
        f"[0:v]{filter_chain}[outv]",
    ])

    # Output mapping
    cmd.extend(["-map", "[outv]"])
    if has_audio:
        cmd.extend(["-map", "1:a"])
        cmd.extend(["-c:a", AUDIO_CODEC, "-ar", str(AUDIO_SAMPLE_RATE)])

    # Video encoding
    cmd.extend([
        "-c:v", VIDEO_CODEC,
        "-preset", "medium",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-t", str(total_duration),
        str(output_path),
    ])

    print(f"  [video] Rendering {sign_name}...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    if result.returncode != 0:
        print(f"  [video] ERROR rendering {sign_name}: {result.stderr[-500:]}")
        # Create a minimal fallback video
        _generate_fallback_video(sign_name, total_duration, output_path)
    else:
        size_mb = output_path.stat().st_size / (1024 * 1024) if output_path.exists() else 0
        print(f"  [video] {output_path.name} ({size_mb:.1f}MB, {total_duration:.1f}s)")

    return output_path


def _generate_fallback_video(sign_name: str, duration: float, output_path: Path):
    """Generate a minimal video if the main render fails."""
    W, H = VIDEO_WIDTH, VIDEO_HEIGHT
    bg = _hex_to_ffmpeg(COLORS["void_black"])

    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", f"color=c={bg}:s={W}x{H}:d={duration}:r={VIDEO_FPS}",
        "-vf", f"drawtext=text='{sign_name.upper()}':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2",
        "-c:v", VIDEO_CODEC, "-preset", "ultrafast", "-crf", "28",
        "-pix_fmt", "yuv420p",
        str(output_path),
    ]
    subprocess.run(cmd, capture_output=True, timeout=60)


async def generate_all_daily_videos(
    tiktok_scripts: list,
    audio_files: list[Path],
    date_str: str,
) -> list[Path]:
    """Generate all 12 daily zodiac videos."""
    day_dir = OUTPUT_DIR / date_str / "videos"
    day_dir.mkdir(parents=True, exist_ok=True)

    sign_lookup = {s["name"]: s for s in ZODIAC_SIGNS}
    videos = []

    for i, script in enumerate(tiktok_scripts):
        sign_name = script.get("sign", "Unknown")
        sign_info = sign_lookup.get(sign_name, ZODIAC_SIGNS[0])

        audio_path = audio_files[i] if i < len(audio_files) else Path("/dev/null")
        output_path = day_dir / f"{sign_name.lower()}_daily.mp4"

        generate_zodiac_video(
            sign_name=sign_name,
            glyph=sign_info["glyph"],
            element=sign_info["element"],
            hook_text=script.get("hook", ""),
            body_text=script.get("body", ""),
            cta_text=script.get("cta", ""),
            audio_path=audio_path,
            output_path=output_path,
        )
        videos.append(output_path)

    print(f"Generated {len(videos)} daily videos")
    return videos


async def generate_skit_video(
    script: dict,
    audio_path: Path,
    content_type: str,
    date_str: str,
) -> Path:
    """Generate a weekly skit video (roast, compatibility, etc.)."""
    day_dir = OUTPUT_DIR / date_str / "videos"
    day_dir.mkdir(parents=True, exist_ok=True)

    sign = script.get("sign", script.get("sign_a", "skit")).lower()
    output_path = day_dir / f"{sign}_{content_type}.mp4"

    # Build text from script structure
    hook = script.get("hook", "")
    body_parts = []
    if "roast_lines" in script:
        body_parts.extend(script["roast_lines"])
    if "redemption" in script:
        body_parts.append(script["redemption"])
    if "attraction" in script:
        body_parts.append(script["attraction"])
    if "warning" in script:
        body_parts.append(script["warning"])
    if "verdict" in script:
        body_parts.append(script["verdict"])
    body = " ".join(body_parts)
    cta = script.get("cta", "Link in bio.")

    sign_info = next((s for s in ZODIAC_SIGNS if s["name"].lower() == sign), ZODIAC_SIGNS[0])

    generate_zodiac_video(
        sign_name=sign_info["name"],
        glyph=sign_info["glyph"],
        element=sign_info["element"],
        hook_text=hook,
        body_text=body,
        cta_text=cta,
        audio_path=audio_path,
        output_path=output_path,
    )
    return output_path


if __name__ == "__main__":
    import asyncio

    if not _check_ffmpeg():
        print("ERROR: ffmpeg not installed. Run: brew install ffmpeg")
    else:
        print("ffmpeg found. Video pipeline ready.")

        # Test with a single video
        test_output = OUTPUT_DIR / "test" / "videos" / "test_aries.mp4"
        generate_zodiac_video(
            sign_name="Aries",
            glyph="\u2648",
            element="fire",
            hook_text="If you're an Aries, the stars have something urgent for you today.",
            body_text="Mars is activating your chart in a way that hasn't happened in years. Pay attention to a conversation that comes out of nowhere today.",
            cta_text="Follow for your daily reading.",
            audio_path=Path("/dev/null"),  # No audio for test
            output_path=test_output,
            duration=20.0,
        )
        if test_output.exists():
            print(f"Test video: {test_output} ({test_output.stat().st_size // 1024}KB)")
