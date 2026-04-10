"""
COSMOS aesthetic test — Olivia Arcana tarot deck.

Per user's COSMOS design guide:
- flux-pro-1.1 endpoint
- 896 × 1344 (2:3 ratio)
- 3-module prompt: GLOBAL_COSMOS_STYLE_PREFIX + CARD_SIGIL + LIQUID_GLASS_PERIMETER_SUFFIX
- Dark navy/indigo nebula, lavender-magenta + cyan sigils, liquid-glass perimeter only
- No interior glass, no text

Generates 4 variations of The Fool for user approval before committing
to the full 78-card pipeline.
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

OUT_DIR = Path(__file__).parent / "output" / "cosmos"
OUT_DIR.mkdir(parents=True, exist_ok=True)

ENDPOINT = "https://api.bfl.ai/v1/flux-2-pro"

# ─────────────────────────────────────────────────────────────
# GLOBAL COSMOS STYLE PREFIX — v4 (physical card object, studio photography)
# ─────────────────────────────────────────────────────────────
GLOBAL_COSMOS_STYLE_PREFIX = (
    "Ultra-luxury editorial dark-studio product photography of a single "
    "premium physical tarot card captured as the hero object, floating at the "
    "exact compositional center of a deep layered cosmic nebula. The nebula: "
    "rich navy and indigo depths "
    "with layered dust clouds, soft warm golden cloud wisps drifting behind the "
    "card, scattered pinpoint stars of varying brightness, subtle volumetric "
    "atmospheric haze, and shallow depth of field with the nebula gently "
    "softened behind the sharply rendered card. "

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
# THE FOOL — v5 sigil (legible minimalist pictogram + geometric framing)
# ─────────────────────────────────────────────────────────────
FOOL_SIGIL = (
    "At the exact compositional center of the card face sits a single refined "
    "minimalist line-art icon that makes the meaning of The Fool instantly "
    "readable at a glance — the essence of stepping into the unknown toward a "
    "guiding star. The icon is drawn entirely in precise hairline luminous lines "
    "of warm pale gold with delicate lavender-magenta and cool cyan accent star "
    "points, glowing softly against the matte indigo card surface, styled like "
    "a premium Apple SF Symbol pictogram or a luxury boutique hotel pictogram — "
    "refined, clean, instantly legible, flat-line stylization. "

    "The icon consists of: (1) a small stylized human figure silhouette in pure "
    "profile view, drawn as a continuous hairline outline — the figure is "
    "mid-stride with one foot lifted forward and arms slightly raised in "
    "movement, body leaning into the step, clearly reading as a person walking "
    "forward. No face, no clothing detail, just the minimalist silhouette line. "
    "(2) A clean horizontal line beneath the figure's trailing foot representing "
    "the cliff edge — the figure's front foot extends out beyond this line into "
    "empty space, making the 'stepping off the edge' reading unmistakable. "
    "(3) A single small bright anchor star positioned directly above the "
    "figure's head representing the guiding star, with a soft radial glow in "
    "lavender-magenta. (4) A thin gentle downward crescent arc floating below "
    "the cliff line representing the open void being stepped into. (5) The "
    "entire composition is framed inside a thin perfect gold circle that "
    "encloses the figure, cliff, star, and crescent — like a luxury emblem seal. "

    "At the key vertices of the composition — the guiding star, the tips of "
    "the crescent, the point where the figure's front foot meets empty space, "
    "and two points on the circle ring — are six bright star points in "
    "alternating lavender-magenta and cool cyan with soft radial halos. The "
    "entire emblem occupies roughly forty-five percent of the card interior "
    "with generous matte indigo breathing room. Purely linear stylization with "
    "hairline luminous lines, no thick strokes, no filled shapes, no "
    "photorealistic human, no face, no color fills, no background inside the "
    "emblem — just refined line-art that reads like a premium pictogram."
)

# ─────────────────────────────────────────────────────────────
# PERIMETER SUFFIX — v4 (physical liquid-glass edge, studio light interaction)
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

PROMPT_COSMOS_FOOL = " ".join([
    GLOBAL_COSMOS_STYLE_PREFIX,
    FOOL_SIGIL,
    LIQUID_GLASS_PERIMETER_SUFFIX,
])


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
        body = e.read().decode()
        print(f"  HTTP {e.code}: {body}")
        raise


def _get(url):
    req = Request(url, headers={"accept": "application/json", "x-key": API_KEY})
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def _download(url, dest):
    with urlopen(url, timeout=120) as r:
        dest.write_bytes(r.read())


# ─────────────────────────────────────────────────────────────
# Generate one variation
# ─────────────────────────────────────────────────────────────
def generate(seed, label):
    print(f"[{label}] seed={seed}")
    body = {
        "prompt": PROMPT_COSMOS_FOOL,
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
        return None
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
            print(f"  poll err {type(e).__name__}: {e}")
            continue
        status = result.get("status")
        if status == "Ready":
            image_url = result["result"]["sample"]
            dest = OUT_DIR / f"{label}_seed{seed}.png"
            _download(image_url, dest)
            print(f"  ✓ saved {dest.name}")
            return dest
        if status in ("Error", "Failed", "Content Moderated", "Request Moderated"):
            print(f"  ✗ {status}")
            return None
        print(f"  ... {status}")
    print("  ✗ timeout")
    return None


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"Prompt length: {len(PROMPT_COSMOS_FOOL)} chars, ~{len(PROMPT_COSMOS_FOOL.split())} words")
    print(f"Endpoint: {ENDPOINT}")
    print(f"Dimensions: 896 × 1344 (2:3)")
    print(f"Output: {OUT_DIR}")
    print()

    n = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    results = []
    for i in range(n):
        seed = random.randint(1, 9_999_999)
        path = generate(seed, f"cosmos_fool_v5_{i+1:02d}")
        if path:
            results.append(path)
        time.sleep(2)

    print()
    print(f"Done: {len(results)}/{n} saved. Review in {OUT_DIR}")
