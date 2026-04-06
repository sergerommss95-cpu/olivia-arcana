"""
Step 2: Generate all content scripts using Claude API.
Produces TikTok scripts, Story texts, Telegram texts, and weekly skit scripts.
"""
import json
import asyncio
from pathlib import Path
from datetime import date

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config.settings import ANTHROPIC_API_KEY, ZODIAC_SIGNS, OUTPUT_DIR
from scripts.compute_transits import format_transits_for_claude, format_sign_impact_for_claude


DAILY_SCRIPT_PROMPT = """You are Olivia Arcana, a warm, mystical, empowering astrologer. You write TikTok scripts.

Today's transit data:
{transit_data}

Write 12 TikTok scripts (one per zodiac sign, 15-20 seconds each).

For EACH sign, output this JSON structure:
{{
  "sign": "Aries",
  "hook": "First 3 seconds. Punchy. Creates urgency or curiosity. Must make the viewer stop scrolling.",
  "body": "8-12 seconds. 2-3 sentences about today's energy. Reference the ACTUAL transit. Use 'you' language. Be specific, not generic. Create emotional resonance.",
  "cta": "Last 2 seconds. Rotate between: 'Follow for your daily reading' / 'Link in bio for your full chart' / 'Comment your sign below'",
  "hashtags": ["#astrology", "#aries", "#fyp"]
}}

RULES:
- Reference ACTUAL transits (e.g., "Mars entering your 7th house") — NEVER generic
- "Today is a good day" = BANNED. Be specific or be quiet.
- Each sign MUST feel unique — no copy-paste with sign names swapped
- Olivia's voice: warm, mystical, empowering. "Dear soul" not "Hey guys"
- Under 80 words per script total
- Hook categories to rotate through: fear/curiosity, specificity, identity, comparison, authority, FOMO

{sign_impacts}

Output a JSON array of 12 objects. ONLY output valid JSON, no markdown fences."""


STORY_TEXT_PROMPT = """You are Olivia Arcana. Write 12 Instagram Story horoscope texts (one per sign).

Today's transits:
{transit_data}

For EACH sign, write 3-4 lines (under 60 words) in Olivia's warm, intimate voice.
Stories feel personal — use "Dear [Sign]" or "Beloved [Sign]" openings.
Reference the actual transit affecting them today.

Output as JSON array: [{{"sign": "Aries", "text": "Dear Aries, ..."}}, ...]
ONLY output valid JSON, no markdown fences.

{sign_impacts}"""


TELEGRAM_TEXT_PROMPT = """You are Olivia Arcana. Write 12 Telegram channel horoscope posts (one per sign).

Today's transits:
{transit_data}

For EACH sign, write a 4-6 line reading in Olivia's voice. Include:
- The zodiac glyph emoji at the start
- Reference to the actual transit
- A brief interpretation of what it means practically
- End with a teaser: "Want your PERSONAL reading? → @OliviaArcanaBot"

Output as JSON array: [{{"sign": "Aries", "glyph": "♈", "text": "♈ ARIES\\n\\n..."}}, ...]
ONLY output valid JSON, no markdown fences.

{sign_impacts}"""


ROAST_PROMPT = """You are Olivia Arcana, writing a 30-second TikTok zodiac roast for {sign}.

Current transits affecting {sign}:
{sign_impact}

Write a brutally honest but ultimately loving roast.

Output JSON:
{{
  "sign": "{sign}",
  "hook": "Oh, {sign}. We need to talk.",
  "roast_lines": ["line 1", "line 2", "line 3"],
  "redemption": "But here's the thing — [genuine positive observation about their strength]",
  "cta": "Think you can handle YOUR cosmic truth? Link in bio."
}}

RULES:
- Sharp, funny, SPECIFIC (not generic zodiac stereotypes)
- Reference real planetary energy from current transits
- Never cruel, always loving underneath
- Make people say "HOW DID SHE KNOW"
- Under 120 words total
ONLY output valid JSON, no markdown fences."""


COMPATIBILITY_PROMPT = """You are Olivia Arcana, analyzing {sign_a} and {sign_b} compatibility for a 30-second TikTok.

Output JSON:
{{
  "sign_a": "{sign_a}",
  "sign_b": "{sign_b}",
  "hook": "Are {sign_a} and {sign_b} actually soulmates? Let's check the stars.",
  "attraction": "What draws them together (2 sentences)",
  "warning": "The biggest tension point (2 sentences)",
  "score": 73,
  "verdict": "One-line summary of the pairing",
  "cta": "Tag your {sign_a}/{sign_b} partner. Get your REAL compatibility: link in bio."
}}

Be honest. If it's tough, say so with nuance. Under 100 words body.
ONLY output valid JSON, no markdown fences."""


CELEBRITY_PROMPT = """You are Olivia Arcana, breaking down {celebrity}'s birth chart for a 45-second TikTok.

Celebrity: {celebrity}
Known birth data: Sun in {sun_sign}, born {birth_date}

Output JSON:
{{
  "celebrity": "{celebrity}",
  "hook": "I looked up {celebrity}'s birth chart and everything makes sense now.",
  "reveal_1": {{
    "placement": "Sun in {sun_sign}",
    "explanation": "What it means for their public persona (2-3 sentences, reference known behavior)"
  }},
  "reveal_2": {{
    "placement": "Likely Moon sign analysis",
    "explanation": "Their emotional core (2-3 sentences, reference specific public moment)"
  }},
  "reveal_3": {{
    "placement": "One surprising aspect",
    "explanation": "Explains something unexpected (2-3 sentences)"
  }},
  "cta": "Want to see YOUR chart? Link in bio."
}}

Connect placements to known behaviors. Under 150 words body.
ONLY output valid JSON, no markdown fences."""


RELATABLE_PROMPT = """You are Olivia Arcana, writing a "What your sign does when..." TikTok (15-20 seconds).

Topic: "{topic}"

Pick the 6 most entertaining signs for this topic and write their reactions.

Output JSON:
{{
  "topic": "{topic}",
  "hook": "What each sign does when {topic}...",
  "signs": [
    {{"sign": "Gemini", "reaction": "Already texted back, deleted it, wrote a new one, deleted that too"}},
    ...
  ],
  "cta": "Which one are YOU? Comment below. Follow for daily readings."
}}

Make each reaction SPECIFIC and uncomfortably accurate. Funny > generic.
ONLY output valid JSON, no markdown fences."""


async def generate_daily_scripts(transit_data: dict) -> dict:
    """Generate all daily content scripts via Claude API."""
    if not HAS_ANTHROPIC or not ANTHROPIC_API_KEY:
        print("WARNING: Anthropic SDK not available. Using placeholder scripts.")
        return _placeholder_scripts()

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # Build sign impact summaries
    sign_impacts_text = ""
    for sign_info in ZODIAC_SIGNS:
        name = sign_info["name"]
        impacts = transit_data["sign_impacts"].get(name, [])
        sign_impacts_text += format_sign_impact_for_claude(name, impacts) + "\n"

    transit_text = format_transits_for_claude(transit_data)

    # Generate all 3 types in parallel-ish (Claude API is sync, but we batch)
    results = {}

    # 1. TikTok scripts
    print("  Generating TikTok scripts...")
    tiktok_response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[{
            "role": "user",
            "content": DAILY_SCRIPT_PROMPT.format(
                transit_data=transit_text,
                sign_impacts=sign_impacts_text,
            )
        }]
    )
    results["tiktok"] = _parse_json_response(tiktok_response.content[0].text)

    # 2. Story texts
    print("  Generating Story texts...")
    story_response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=3000,
        messages=[{
            "role": "user",
            "content": STORY_TEXT_PROMPT.format(
                transit_data=transit_text,
                sign_impacts=sign_impacts_text,
            )
        }]
    )
    results["stories"] = _parse_json_response(story_response.content[0].text)

    # 3. Telegram texts
    print("  Generating Telegram texts...")
    telegram_response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=3000,
        messages=[{
            "role": "user",
            "content": TELEGRAM_TEXT_PROMPT.format(
                transit_data=transit_text,
                sign_impacts=sign_impacts_text,
            )
        }]
    )
    results["telegram"] = _parse_json_response(telegram_response.content[0].text)

    return results


async def generate_roast_script(sign: str, transit_data: dict) -> dict:
    """Generate a zodiac roast script for one sign."""
    if not HAS_ANTHROPIC or not ANTHROPIC_API_KEY:
        return {"sign": sign, "hook": f"Oh, {sign}. We need to talk.", "roast_lines": ["Placeholder roast"], "redemption": "But you're great.", "cta": "Link in bio."}

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    impacts = transit_data["sign_impacts"].get(sign, [])
    impact_text = format_sign_impact_for_claude(sign, impacts)

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": ROAST_PROMPT.format(sign=sign, sign_impact=impact_text)}]
    )
    return _parse_json_response(response.content[0].text)


async def generate_compatibility_script(sign_a: str, sign_b: str) -> dict:
    """Generate a compatibility analysis script."""
    if not HAS_ANTHROPIC or not ANTHROPIC_API_KEY:
        return {"sign_a": sign_a, "sign_b": sign_b, "hook": f"Are {sign_a} and {sign_b} soulmates?", "score": 75}

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": COMPATIBILITY_PROMPT.format(sign_a=sign_a, sign_b=sign_b)}]
    )
    return _parse_json_response(response.content[0].text)


async def generate_celebrity_script(celebrity: str, sun_sign: str, birth_date: str) -> dict:
    """Generate a celebrity chart breakdown script."""
    if not HAS_ANTHROPIC or not ANTHROPIC_API_KEY:
        return {"celebrity": celebrity, "hook": f"I looked up {celebrity}'s chart..."}

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": CELEBRITY_PROMPT.format(
            celebrity=celebrity, sun_sign=sun_sign, birth_date=birth_date
        )}]
    )
    return _parse_json_response(response.content[0].text)


async def generate_relatable_script(topic: str) -> dict:
    """Generate a 'What your sign does when...' script."""
    if not HAS_ANTHROPIC or not ANTHROPIC_API_KEY:
        return {"topic": topic, "hook": f"What each sign does when {topic}..."}

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": RELATABLE_PROMPT.format(topic=topic)}]
    )
    return _parse_json_response(response.content[0].text)


def _parse_json_response(text: str) -> list | dict:
    """Parse Claude's JSON response, handling markdown fences."""
    text = text.strip()
    if text.startswith("```"):
        # Remove markdown code fences
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON in the response
        start = text.find("[")
        if start == -1:
            start = text.find("{")
        if start != -1:
            try:
                return json.loads(text[start:])
            except json.JSONDecodeError:
                pass
        print(f"WARNING: Could not parse JSON response. Raw text:\n{text[:500]}")
        return []


def _placeholder_scripts() -> dict:
    """Placeholder content for testing without API key."""
    tiktok = []
    stories = []
    telegram = []
    for sign_info in ZODIAC_SIGNS:
        name = sign_info["name"]
        glyph = sign_info["glyph"]
        tiktok.append({
            "sign": name,
            "hook": f"If you're a {name}, the stars have something urgent for you today.",
            "body": f"Today's energy brings a powerful shift for {name}. Pay attention to unexpected conversations — the universe is trying to tell you something important about your path forward.",
            "cta": "Follow for your daily reading.",
            "hashtags": ["#astrology", f"#{name.lower()}", "#fyp"],
        })
        stories.append({
            "sign": name,
            "text": f"Dear {name}, today the cosmos invites you to slow down and listen. There's wisdom waiting for you in the quiet moments between your thoughts.",
        })
        telegram.append({
            "sign": name,
            "glyph": glyph,
            "text": f"{glyph} {name.upper()}\n\nToday's cosmic energy brings focus to your inner world. Pay attention to your intuition — it's sharper than usual.\n\nWant your PERSONAL reading? → @OliviaArcanaBot",
        })
    return {"tiktok": tiktok, "stories": stories, "telegram": telegram}


def save_scripts(scripts: dict, date_str: str) -> Path:
    """Save generated scripts to daily output directory."""
    day_dir = OUTPUT_DIR / date_str
    day_dir.mkdir(parents=True, exist_ok=True)
    output_path = day_dir / "scripts.json"
    with open(output_path, "w") as f:
        json.dump(scripts, f, indent=2, ensure_ascii=False)
    return output_path


if __name__ == "__main__":
    from scripts.compute_transits import get_daily_transits
    transit_data = get_daily_transits()
    scripts = asyncio.run(generate_daily_scripts(transit_data))
    print(f"Generated {len(scripts.get('tiktok', []))} TikTok scripts")
    print(f"Generated {len(scripts.get('stories', []))} Story texts")
    print(f"Generated {len(scripts.get('telegram', []))} Telegram texts")
    save_path = save_scripts(scripts, transit_data["date"])
    print(f"Saved to: {save_path}")
