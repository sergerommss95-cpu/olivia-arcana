"""
Step 3: Generate voiceover audio files using ElevenLabs API.
Produces MP3 files for each TikTok script.
"""
import asyncio
from pathlib import Path

try:
    from elevenlabs import ElevenLabs
    HAS_ELEVENLABS = True
except ImportError:
    HAS_ELEVENLABS = False

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config.settings import (
    ELEVENLABS_API_KEY, OLIVIA_VOICE_ID, VOICE_MODEL,
    VOICE_SETTINGS, OUTPUT_DIR,
)


def _build_full_script(script: dict) -> str:
    """Combine hook + body + cta into a single voiceover text."""
    parts = []
    if "hook" in script:
        parts.append(script["hook"])
    if "body" in script:
        parts.append(script["body"])
    if "cta" in script:
        parts.append(script["cta"])
    # For roasts
    if "roast_lines" in script:
        parts.extend(script["roast_lines"])
    if "redemption" in script:
        parts.append(script["redemption"])
    return " ".join(parts)


async def generate_audio_for_script(script: dict, output_path: Path) -> Path:
    """Generate a single MP3 voiceover from a script dict."""
    text = _build_full_script(script)

    if not HAS_ELEVENLABS or not ELEVENLABS_API_KEY:
        # Create a silent placeholder file for testing
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(b"")  # Empty file placeholder
        print(f"  [placeholder] {output_path.name}")
        return output_path

    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

    audio_generator = client.text_to_speech.convert(
        voice_id=OLIVIA_VOICE_ID,
        model_id=VOICE_MODEL,
        text=text,
        voice_settings={
            "stability": VOICE_SETTINGS["stability"],
            "similarity_boost": VOICE_SETTINGS["similarity_boost"],
            "style": VOICE_SETTINGS["style"],
            "use_speaker_boost": VOICE_SETTINGS["use_speaker_boost"],
        },
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        for chunk in audio_generator:
            f.write(chunk)

    print(f"  [audio] {output_path.name} ({output_path.stat().st_size // 1024}KB)")
    return output_path


async def generate_all_daily_audio(tiktok_scripts: list, date_str: str) -> list[Path]:
    """Generate audio for all 12 daily zodiac scripts."""
    day_dir = OUTPUT_DIR / date_str / "audio"
    day_dir.mkdir(parents=True, exist_ok=True)

    audio_files = []
    for script in tiktok_scripts:
        sign = script.get("sign", "unknown").lower()
        output_path = day_dir / f"{sign}_daily.mp3"
        await generate_audio_for_script(script, output_path)
        audio_files.append(output_path)

    print(f"Generated {len(audio_files)} audio files")
    return audio_files


async def generate_skit_audio(script: dict, content_type: str, date_str: str) -> Path:
    """Generate audio for a weekly skit (roast, compatibility, etc.)."""
    day_dir = OUTPUT_DIR / date_str / "audio"
    day_dir.mkdir(parents=True, exist_ok=True)

    sign = script.get("sign", script.get("sign_a", "skit")).lower()
    output_path = day_dir / f"{sign}_{content_type}.mp3"
    await generate_audio_for_script(script, output_path)
    return output_path


if __name__ == "__main__":
    import json
    # Test with placeholder scripts
    test_scripts = [
        {"sign": "Aries", "hook": "Aries, listen up.", "body": "Mars is firing up your chart today.", "cta": "Follow for your daily reading."},
        {"sign": "Taurus", "hook": "Taurus, big news.", "body": "Venus brings sweetness to your day.", "cta": "Link in bio."},
    ]
    from datetime import date
    files = asyncio.run(generate_all_daily_audio(test_scripts, date.today().isoformat()))
    print(f"Generated: {[f.name for f in files]}")
