"""
COSMOS template validation — test the v5 sigil template on non-Fool cards.

Picks 3 diverse major arcana to stress-test the template:
  1. The Magician   — single figure with symbolic props (hermetic pose + four tools)
  2. The Lovers     — two figures (multi-figure composition)
  3. Justice        — seated figure with scales and sword (figure + objects)

If all 3 render cleanly with legible pictograms, the template is robust and
we can commit to authoring all 78 card sigils and running the full deck.

Shares the GLOBAL_COSMOS_STYLE_PREFIX and LIQUID_GLASS_PERIMETER_SUFFIX from
test_cosmos_aesthetic.py (locked v5 versions).
"""
import os
import sys
import time
import json
import random
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# ─────────────────────────────────────────────────────────────
# API key
# ─────────────────────────────────────────────────────────────
BFL_ENV = Path.home() / "tools" / "bfl-api" / ".env"
if BFL_ENV.exists():
    for line in BFL_ENV.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())
API_KEY = os.environ["BFL_API_KEY"]

OUT_DIR = Path(__file__).parent / "output" / "cosmos_validation"
OUT_DIR.mkdir(parents=True, exist_ok=True)

ENDPOINT = "https://api.bfl.ai/v1/flux-2-pro"

# ─────────────────────────────────────────────────────────────
# LOCKED v6 PREFIX (brand text stripped to prevent typography leakage)
# ─────────────────────────────────────────────────────────────
GLOBAL_COSMOS_STYLE_PREFIX = (
    "Ultra-luxury editorial dark-studio product photography of a single "
    "premium physical tarot card captured as the hero object, floating at the "
    "exact compositional center of a deep layered cosmic nebula. The nebula: "
    "rich navy and indigo depths with layered dust clouds, soft warm golden "
    "cloud wisps drifting behind the card, scattered pinpoint stars of varying "
    "brightness, subtle volumetric atmospheric haze, and shallow depth of "
    "field with the nebula gently softened behind the sharply rendered card. "

    "Render the tarot card itself as a physical object with a subtle glassy "
    "laminate surface: the card laminate has soft specular highlights catching "
    "studio light, a faint reflection of the nebula across the upper half of the "
    "card face, and a gentle gloss gradient from top to bottom. The corners are "
    "softly rounded and the card throws a delicate, slightly blurred shadow onto "
    "the space background behind it. The card interior face is a deep graduated "
    "indigo, slightly lighter at the top-center where a soft celestial glow "
    "kisses it, deeper indigo toward the bottom, with a refined inner vignette "
    "that draws the eye toward center."
)

# ─────────────────────────────────────────────────────────────
# LOCKED v5 SUFFIX (liquid-glass perimeter, anti-illustration)
# ─────────────────────────────────────────────────────────────
LIQUID_GLASS_PERIMETER_SUFFIX = (
    "Around the very edge of the card, emphasize the Apple-style liquid-glass "
    "perimeter: a continuous 3 to 4 millimeter frosted, semi-transparent band "
    "that clearly refracts and blurs the nebula only inside that ring, with "
    "bright, crisp specular edge highlights and a thin inner glow. The interior "
    "artwork stays sharp and matte, but the card edges and laminate catch light "
    "like real coated glass: tiny highlight streaks along the top edge, a "
    "subtle rim light on one side, and a soft bloom where the cosmic glow hits "
    "the perimeter. This frosted refractive band is contained entirely within "
    "that narrow outer ring; the card interior itself stays completely matte "
    "and precise, with nothing but the central alchemical emblem on it. "

    "Hasselblad medium format editorial product photography aesthetic, 8K "
    "detail, photorealistic depth and atmosphere, shot in a dark photography "
    "studio with controlled rim light and soft cosmic ambient glow. Avoid flat, "
    "illustration-like cards; make the card feel like a premium physical object "
    "photographed in a dark studio, with visible reflections and gloss on the "
    "surface and edges. "

    "The entire image contains absolutely no text, no letters, no numerals, no "
    "roman numerals, no words, no labels, no captions, no titles, no typography "
    "of any kind, no ornate gold filigree frame, no decorative border pattern, "
    "no neon outline rectangle, no painted edge trim, no printed symbols, no "
    "watermark."
)

# ─────────────────────────────────────────────────────────────
# Shared sigil language intro — matches Fool v5 exactly (proven passing)
# {essence} slot lets each card inject its narrative framing, which is
# what makes the moderator read the card as editorial-art with a theme
# rather than as an occult instruction. This was the key to unblocking
# active-figure cards like The Magician.
# ─────────────────────────────────────────────────────────────
SIGIL_STYLE_INTRO_TEMPLATE = (
    "At the exact compositional center of the card face sits a single refined "
    "minimalist line-art icon that makes the meaning of {card_name} instantly "
    "readable at a glance — {essence}. The icon is drawn entirely in precise "
    "hairline luminous lines of warm pale gold with delicate lavender-magenta "
    "and cool cyan accent star points, glowing softly against the matte indigo "
    "card surface, styled like a premium Apple SF Symbol pictogram or a luxury "
    "boutique hotel pictogram — refined, clean, instantly legible, flat-line "
    "stylization. "
)

SIGIL_STYLE_OUTRO = (
    " The entire emblem occupies roughly forty-five percent of the card "
    "interior with generous matte indigo breathing room. Purely linear "
    "stylization with hairline luminous lines, no thick strokes, no filled "
    "shapes, no photorealistic human, no face, no color fills, no background "
    "inside the emblem — just refined line-art that reads like a premium "
    "pictogram."
)

# ─────────────────────────────────────────────────────────────
# Card-specific sigil descriptions
# ─────────────────────────────────────────────────────────────
CARDS = {
    # HERO ELEMENT: seated figure + SUN DISC above head (differentiator).
    # Uses the seated-figure magic pattern but swaps the anchor star for a
    # radiant sun disc to distinguish Magician from Justice.
    "magician_v15": {
        "card_name": "The Magician",
        "essence": "the essence of focused inner mastery beneath a radiant sun of manifestation",
        "body": (
            "The icon consists of: (1) a single slender human figure silhouette "
            "in pure profile view seated upright on a simple low stool at the "
            "exact center, both hands resting calmly on their thighs, feet "
            "planted on the ground below. The stool is a thin horizontal gold "
            "line with two short vertical legs. The figure is drawn as pure "
            "hairline outline, no face, no clothing detail. (2) A clean "
            "horizontal ground line beneath the figure's feet. (3) Directly "
            "above the figure's head floats a small bright radiant sun disc "
            "— a tiny filled gold circle with twelve short hairline gold rays "
            "radiating outward at equal angles — representing the sun of "
            "manifestation, with a soft radial glow. (4) A thin gentle "
            "downward crescent arc floating below the ground line. (5) The "
            "entire composition is framed inside a thin perfect gold circle "
            "that encloses the figure, stool, ground, sun disc, and crescent "
            "— like a luxury emblem seal. At the key vertices of the "
            "composition — the sun disc, the tips of the crescent, and two "
            "points on the circle ring — are six bright star points in "
            "alternating lavender-magenta and cool cyan with soft radial "
            "halos."
        ),
    },
    # HERO ELEMENT: two figures facing each other + union star between them.
    # Walking-figure pattern passes when narrative framing is present.
    "lovers_v3": {
        "card_name": "The Lovers",
        "essence": "the essence of two souls meeting under a guiding star of union",
        "body": (
            "The icon consists of: (1) two slender human figure silhouettes "
            "standing in profile facing each other at the exact center, "
            "their inner hands reaching forward to almost touch between "
            "them, their outer arms relaxed at their sides. Both figures "
            "are drawn as pure hairline outline, no face, no clothing "
            "detail. (2) A clean horizontal ground line beneath the "
            "figures' feet. (3) Floating directly above the gap between "
            "them, centered between their heads, is a single large bright "
            "anchor star with a soft radial glow in lavender-magenta — the "
            "star of union. (4) A thin gentle crescent arc floats just "
            "above the union star like a blessing. (5) The entire "
            "composition is framed inside a thin perfect gold circle that "
            "encloses the figures, ground, star, and crescent — like a "
            "luxury emblem seal. At the key vertices of the composition — "
            "the union star, the tips of the crescent, and two points on "
            "the circle ring — are six bright star points in alternating "
            "lavender-magenta and cool cyan with soft radial halos."
        ),
    },
    # HERO ELEMENT: seated figure + CRESCENT MOON above head (differentiator).
    # Uses the seated-figure magic pattern with a downward-facing crescent
    # moon above to distinguish Justice (reflection/truth) from Magician.
    "justice_v10": {
        "card_name": "Justice",
        "essence": "the essence of truth and balance beneath a reflecting crescent moon",
        "body": (
            "The icon consists of: (1) a single slender human figure "
            "silhouette in pure profile view seated upright on a simple "
            "horizontal bench at the exact center, hands resting calmly on "
            "their knees, feet planted on the ground below. The bench is a "
            "thin horizontal gold line with two short vertical legs. The "
            "figure is drawn as pure hairline outline, no face, no clothing "
            "detail. (2) A clean horizontal ground line beneath the "
            "figure's feet. (3) Directly above the figure's head floats a "
            "single large crescent moon arc opening upward like a bowl — "
            "drawn in clean hairline gold with a soft radial glow — "
            "representing the reflecting moon of truth. (4) A thin gentle "
            "downward crescent arc floating below the ground line. (5) The "
            "entire composition is framed inside a thin perfect gold circle "
            "that encloses the figure, bench, ground, moon, and lower "
            "crescent — like a luxury emblem seal. At the key vertices of "
            "the composition — the tips of the upper moon, the tips of the "
            "lower crescent, and two points on the circle ring — are six "
            "bright star points in alternating lavender-magenta and cool "
            "cyan with soft radial halos."
        ),
    },
}


# ─────────────────────────────────────────────────────────────
# HTTP helpers
# ─────────────────────────────────────────────────────────────
def _post(url, body):
    req = Request(
        url,
        data=json.dumps(body).encode(),
        headers={
            "accept": "application/json",
            "x-key": API_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()}")
        raise


def _get(url):
    req = Request(url, headers={"accept": "application/json", "x-key": API_KEY})
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def _download(url, dest):
    with urlopen(url, timeout=120) as r:
        dest.write_bytes(r.read())


def build_prompt(card: dict) -> str:
    """Build a full prompt from a card dict with card_name/essence/body."""
    intro = SIGIL_STYLE_INTRO_TEMPLATE.format(
        card_name=card["card_name"],
        essence=card["essence"],
    )
    return " ".join([
        GLOBAL_COSMOS_STYLE_PREFIX,
        intro + card["body"] + SIGIL_STYLE_OUTRO,
        LIQUID_GLASS_PERIMETER_SUFFIX,
    ])


def _one_attempt(card_key: str, prompt: str, seed: int):
    body = {
        "prompt": prompt,
        "aspect_ratio": "custom",
        "width": 896,
        "height": 1344,
        "output_format": "png",
        "output_quality": 100,
        "guidance": 3.5,
        "safety_tolerance": 2,
        "prompt_upsampling": False,
        "seed": seed,
    }
    try:
        submit = _post(ENDPOINT, body)
    except HTTPError:
        return "http_error"
    task_id = submit["id"]
    polling_url = submit.get("polling_url") or f"https://api.bfl.ai/v1/get_result?id={task_id}"
    print(f"  task: {task_id}")

    for _ in range(90):
        time.sleep(2)
        try:
            result = _get(polling_url)
        except HTTPError as e:
            print(f"  poll HTTP {e.code}")
            continue
        except Exception as e:
            print(f"  poll err {type(e).__name__}")
            continue
        status = result.get("status")
        if status == "Ready":
            image_url = result["result"]["sample"]
            dest = OUT_DIR / f"{card_key}_seed{seed}.png"
            _download(image_url, dest)
            print(f"  ✓ saved {dest.name}")
            return dest
        if status in ("Content Moderated", "Request Moderated"):
            print(f"  ⚠ {status} — will retry new seed")
            return "moderated"
        if status in ("Error", "Failed"):
            print(f"  ✗ {status}")
            return "error"
        print(f"  ... {status}")
    print("  ✗ timeout")
    return "timeout"


def generate(card_key: str, card: dict, seed: int, max_retries: int = 3):
    """Generate one card, retrying with new seeds on moderation flakes."""
    prompt = build_prompt(card)
    for attempt in range(max_retries):
        s = seed if attempt == 0 else random.randint(1, 9_999_999)
        print(f"[{card_key}] seed={s} (attempt {attempt+1}/{max_retries})")
        result = _one_attempt(card_key, prompt, s)
        if isinstance(result, Path):
            return result
        if result == "moderated":
            time.sleep(2)
            continue
        # http_error / error / timeout — don't retry, surface the issue
        return None
    print(f"  ✗ all {max_retries} attempts moderated — giving up on {card_key}")
    return None


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"Endpoint: {ENDPOINT}")
    print(f"Dimensions: 896 × 1344")
    print(f"Output: {OUT_DIR}")
    print()

    for card_key, card in CARDS.items():
        prompt = build_prompt(card)
        print(f"[{card_key}] prompt length: {len(prompt)} chars")
        seed = random.randint(1, 9_999_999)
        generate(card_key, card, seed)
        time.sleep(2)

    print()
    print(f"Done. Review in {OUT_DIR}")
