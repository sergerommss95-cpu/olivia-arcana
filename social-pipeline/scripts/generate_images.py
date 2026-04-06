"""
Step 5: Generate Story cards and Feed cards using Python Pillow.
Produces PNG images for Instagram Stories, Feed posts, and Carousels.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import textwrap

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config.settings import (
    ZODIAC_SIGNS, COLORS, ELEMENT_COLORS, OUTPUT_DIR, FONTS_DIR, ASSETS_DIR,
)


# ─── Font Loading ────────────────────────────────────────────────────────────

def _load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    """Load a font, falling back to default if not found."""
    font_paths = [
        FONTS_DIR / name,
        Path("/System/Library/Fonts") / name,
        Path("/usr/share/fonts/truetype") / name,
    ]
    for path in font_paths:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    # Fallback to default
    try:
        return ImageFont.truetype("Arial", size)
    except OSError:
        return ImageFont.load_default()


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


# ─── Story Card (1080 x 1920) ───────────────────────────────────────────────

def generate_story_card(
    sign_name: str,
    date_range: str,
    glyph: str,
    reading_text: str,
    output_path: Path,
    element: str = "fire",
) -> Path:
    """Generate a 1080x1920 Instagram Story horoscope card."""
    W, H = 1080, 1920
    bg_color = _hex_to_rgb(COLORS["void_black"])
    gold = _hex_to_rgb(COLORS["celestial_gold"])
    ivory = _hex_to_rgb(COLORS["warm_ivory"])
    lavender = _hex_to_rgb(COLORS["muted_lavender"])
    element_color = _hex_to_rgb(ELEMENT_COLORS.get(element, COLORS["celestial_gold"]))

    # Create gradient background
    img = Image.new("RGB", (W, H), bg_color)
    draw = ImageDraw.Draw(img)

    # Subtle diagonal gradient overlay
    deep = _hex_to_rgb(COLORS["deep_cosmos"])
    for y in range(H):
        ratio = y / H
        r = int(bg_color[0] + (deep[0] - bg_color[0]) * ratio * 0.5)
        g = int(bg_color[1] + (deep[1] - bg_color[1]) * ratio * 0.5)
        b = int(bg_color[2] + (deep[2] - bg_color[2]) * ratio * 0.5)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Gold border (thin, elegant)
    draw.rectangle([20, 20, W - 20, H - 20], outline=(*gold, 80), width=1)

    # Fonts
    glyph_font = _load_font("PlayfairDisplay-Bold.ttf", 200)
    sign_font = _load_font("PlayfairDisplay-Bold.ttf", 52)
    date_font = _load_font("Inter-Regular.ttf", 18)
    body_font = _load_font("Inter-Regular.ttf", 26)
    label_font = _load_font("CormorantGaramond-Medium.ttf", 20)
    cta_font = _load_font("Inter-Medium.ttf", 18)

    y_cursor = 160

    # "DAILY HOROSCOPE" label
    draw.text((W // 2, y_cursor), "DAILY HOROSCOPE", font=label_font,
              fill=gold, anchor="mt")
    y_cursor += 60

    # Zodiac glyph (large, centered)
    draw.text((W // 2, y_cursor), glyph, font=glyph_font,
              fill=element_color, anchor="mt")
    y_cursor += 260

    # Sign name
    draw.text((W // 2, y_cursor), sign_name.upper(), font=sign_font,
              fill=gold, anchor="mt")
    y_cursor += 70

    # Date range
    draw.text((W // 2, y_cursor), date_range, font=date_font,
              fill=lavender, anchor="mt")
    y_cursor += 50

    # Gold divider
    div_w = int(W * 0.5)
    div_x = (W - div_w) // 2
    draw.line([(div_x, y_cursor), (div_x + div_w, y_cursor)], fill=gold, width=1)
    y_cursor += 50

    # Reading text (word-wrapped)
    margin = 80
    max_width = W - (margin * 2)
    wrapped = textwrap.fill(reading_text, width=42)
    lines = wrapped.split("\n")

    for line in lines:
        draw.text((W // 2, y_cursor), line, font=body_font,
                  fill=ivory, anchor="mt")
        y_cursor += 42

    y_cursor += 30

    # Gold divider
    draw.line([(div_x, y_cursor), (div_x + div_w, y_cursor)], fill=gold, width=1)
    y_cursor += 50

    # CTA
    slate = _hex_to_rgb(COLORS["slate_blue"])
    draw.text((W // 2, y_cursor), "Swipe up for your personal reading",
              font=cta_font, fill=slate, anchor="mt")

    # Footer: OLIVIA ARCANA
    draw.text((W // 2, H - 120), "OLIVIA ARCANA", font=label_font,
              fill=(*gold, 150), anchor="mt")

    # Small star decorations
    import random
    random.seed(hash(sign_name))  # Deterministic per sign
    for _ in range(30):
        x = random.randint(30, W - 30)
        y = random.randint(30, H - 30)
        # Avoid text areas
        if 100 < y < H - 150 and 60 < x < W - 60:
            if y < 140 or y > y_cursor + 60:
                size = random.randint(1, 3)
                alpha = random.randint(40, 120)
                draw.ellipse([x, y, x + size, y + size], fill=(*ivory, alpha))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path), "PNG", quality=95)
    return output_path


# ─── Feed Card (1080 x 1080) ────────────────────────────────────────────────

def generate_feed_card(
    sign_name: str,
    date_range: str,
    glyph: str,
    reading_text: str,
    output_path: Path,
    element: str = "fire",
) -> Path:
    """Generate a 1080x1080 Instagram feed horoscope card."""
    W, H = 1080, 1080
    bg_color = _hex_to_rgb(COLORS["void_black"])
    gold = _hex_to_rgb(COLORS["celestial_gold"])
    ivory = _hex_to_rgb(COLORS["warm_ivory"])
    lavender = _hex_to_rgb(COLORS["muted_lavender"])
    element_color = _hex_to_rgb(ELEMENT_COLORS.get(element, COLORS["celestial_gold"]))

    img = Image.new("RGB", (W, H), bg_color)
    draw = ImageDraw.Draw(img)

    # Gradient
    deep = _hex_to_rgb(COLORS["deep_cosmos"])
    for y in range(H):
        ratio = y / H
        r = int(bg_color[0] + (deep[0] - bg_color[0]) * ratio * 0.3)
        g = int(bg_color[1] + (deep[1] - bg_color[1]) * ratio * 0.3)
        b = int(bg_color[2] + (deep[2] - bg_color[2]) * ratio * 0.3)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Gold border
    draw.rectangle([15, 15, W - 15, H - 15], outline=gold, width=1)

    # Fonts
    glyph_font = _load_font("PlayfairDisplay-Bold.ttf", 100)
    sign_font = _load_font("PlayfairDisplay-Bold.ttf", 42)
    date_font = _load_font("Inter-Regular.ttf", 16)
    body_font = _load_font("Inter-Regular.ttf", 20)
    label_font = _load_font("CormorantGaramond-Medium.ttf", 18)

    y_cursor = 50

    # "DAILY HOROSCOPE" label
    draw.text((W // 2, y_cursor), "DAILY HOROSCOPE", font=label_font,
              fill=gold, anchor="mt")
    y_cursor += 40

    # Zodiac glyph
    draw.text((W // 2, y_cursor), glyph, font=glyph_font,
              fill=element_color, anchor="mt")
    y_cursor += 140

    # Sign name
    draw.text((W // 2, y_cursor), sign_name.upper(), font=sign_font,
              fill=gold, anchor="mt")
    y_cursor += 55

    # Date range
    draw.text((W // 2, y_cursor), date_range, font=date_font,
              fill=lavender, anchor="mt")
    y_cursor += 35

    # Divider
    div_w = int(W * 0.4)
    div_x = (W - div_w) // 2
    draw.line([(div_x, y_cursor), (div_x + div_w, y_cursor)], fill=gold, width=1)
    y_cursor += 30

    # Reading text
    wrapped = textwrap.fill(reading_text, width=48)
    lines = wrapped.split("\n")
    margin_left = 50
    for line in lines:
        draw.text((margin_left, y_cursor), line, font=body_font, fill=ivory)
        y_cursor += 32

    # Footer
    slate = _hex_to_rgb(COLORS["slate_blue"])
    draw.text((W // 2, H - 80), "VIP: Unlock your personal daily reading",
              font=label_font, fill=slate, anchor="mt")
    draw.text((W // 2, H - 45), "OLIVIA ARCANA", font=label_font,
              fill=gold, anchor="mt")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path), "PNG", quality=95)
    return output_path


# ─── Carousel Slide (1080 x 1080) ───────────────────────────────────────────

def generate_carousel_cover(
    title: str,
    subtitle: str,
    output_path: Path,
) -> Path:
    """Generate a carousel cover slide."""
    W, H = 1080, 1080
    bg_color = _hex_to_rgb(COLORS["void_black"])
    gold = _hex_to_rgb(COLORS["celestial_gold"])
    ivory = _hex_to_rgb(COLORS["warm_ivory"])

    img = Image.new("RGB", (W, H), bg_color)
    draw = ImageDraw.Draw(img)

    # Gradient
    deep = _hex_to_rgb(COLORS["deep_cosmos"])
    for y in range(H):
        ratio = y / H
        r = int(bg_color[0] + (deep[0] - bg_color[0]) * ratio * 0.4)
        g = int(bg_color[1] + (deep[1] - bg_color[1]) * ratio * 0.4)
        b = int(bg_color[2] + (deep[2] - bg_color[2]) * ratio * 0.4)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    draw.rectangle([15, 15, W - 15, H - 15], outline=gold, width=1)

    title_font = _load_font("PlayfairDisplay-Bold.ttf", 48)
    subtitle_font = _load_font("Inter-Regular.ttf", 22)
    label_font = _load_font("CormorantGaramond-Medium.ttf", 18)

    # Title (centered vertically)
    wrapped_title = textwrap.fill(title, width=20)
    draw.text((W // 2, H // 2 - 40), wrapped_title, font=title_font,
              fill=gold, anchor="mm", align="center")

    # Subtitle
    draw.text((W // 2, H // 2 + 60), subtitle, font=subtitle_font,
              fill=ivory, anchor="mt", align="center")

    # Footer
    draw.text((W // 2, H - 50), "OLIVIA ARCANA", font=label_font,
              fill=gold, anchor="mt")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path), "PNG", quality=95)
    return output_path


def generate_carousel_cta(output_path: Path) -> Path:
    """Generate a carousel CTA (last slide)."""
    W, H = 1080, 1080
    bg_color = _hex_to_rgb(COLORS["void_black"])
    gold = _hex_to_rgb(COLORS["celestial_gold"])
    ivory = _hex_to_rgb(COLORS["warm_ivory"])
    slate = _hex_to_rgb(COLORS["slate_blue"])

    img = Image.new("RGB", (W, H), bg_color)
    draw = ImageDraw.Draw(img)

    draw.rectangle([15, 15, W - 15, H - 15], outline=gold, width=1)

    title_font = _load_font("PlayfairDisplay-Bold.ttf", 36)
    body_font = _load_font("Inter-Regular.ttf", 24)
    cta_font = _load_font("Inter-Medium.ttf", 20)
    label_font = _load_font("CormorantGaramond-Medium.ttf", 18)

    draw.text((W // 2, H // 2 - 80), "Want to know YOUR chart?", font=title_font,
              fill=gold, anchor="mm")
    draw.text((W // 2, H // 2), "Get your free birth chart reading", font=body_font,
              fill=ivory, anchor="mm")
    draw.text((W // 2, H // 2 + 60), "Link in bio → @OliviaArcanaBot", font=cta_font,
              fill=slate, anchor="mm")
    draw.text((W // 2, H - 50), "OLIVIA ARCANA", font=label_font,
              fill=gold, anchor="mt")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path), "PNG", quality=95)
    return output_path


# ─── Batch Generation ────────────────────────────────────────────────────────

async def generate_all_story_cards(story_scripts: list, date_str: str) -> list[Path]:
    """Generate 12 Story horoscope cards."""
    day_dir = OUTPUT_DIR / date_str / "stories"
    day_dir.mkdir(parents=True, exist_ok=True)

    cards = []
    sign_lookup = {s["name"]: s for s in ZODIAC_SIGNS}

    for script in story_scripts:
        sign_name = script.get("sign", "Unknown")
        sign_info = sign_lookup.get(sign_name, ZODIAC_SIGNS[0])
        output_path = day_dir / f"{sign_name.lower()}_story.png"

        generate_story_card(
            sign_name=sign_name,
            date_range=sign_info["dates"],
            glyph=sign_info["glyph"],
            reading_text=script.get("text", "The stars are aligning for you today."),
            output_path=output_path,
            element=sign_info["element"],
        )
        cards.append(output_path)
        print(f"  [story] {output_path.name}")

    return cards


async def generate_all_feed_cards(story_scripts: list, date_str: str) -> list[Path]:
    """Generate 12 Feed horoscope cards."""
    day_dir = OUTPUT_DIR / date_str / "feed"
    day_dir.mkdir(parents=True, exist_ok=True)

    cards = []
    sign_lookup = {s["name"]: s for s in ZODIAC_SIGNS}

    for script in story_scripts:
        sign_name = script.get("sign", "Unknown")
        sign_info = sign_lookup.get(sign_name, ZODIAC_SIGNS[0])
        output_path = day_dir / f"{sign_name.lower()}_feed.png"

        generate_feed_card(
            sign_name=sign_name,
            date_range=sign_info["dates"],
            glyph=sign_info["glyph"],
            reading_text=script.get("text", "The stars are aligning for you today."),
            output_path=output_path,
            element=sign_info["element"],
        )
        cards.append(output_path)
        print(f"  [feed] {output_path.name}")

    return cards


if __name__ == "__main__":
    import asyncio
    from datetime import date

    # Test with placeholder data
    test_stories = [
        {"sign": s["name"], "text": f"Dear {s['name']}, today the cosmos invites you to slow down and listen. There's wisdom waiting for you."}
        for s in ZODIAC_SIGNS
    ]

    today = date.today().isoformat()
    story_cards = asyncio.run(generate_all_story_cards(test_stories, today))
    feed_cards = asyncio.run(generate_all_feed_cards(test_stories, today))
    print(f"\nGenerated {len(story_cards)} story cards + {len(feed_cards)} feed cards")
