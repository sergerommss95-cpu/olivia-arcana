"""
Experimental V2 aesthetic — inspired by user's reference image.
- Warm champagne silk (not pristine white)
- Card-within-frame composition
- Apple Liquid Glass card edges
- Single minimal glyph
- Cream card face
"""
import os
import sys
import time
import json
import random
from pathlib import Path
from urllib.request import Request, urlopen

# Load API key
BFL_ENV = Path.home() / "tools" / "bfl-api" / ".env"
if BFL_ENV.exists():
    for line in BFL_ENV.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())
API_KEY = os.environ["BFL_API_KEY"]

OUT_DIR = Path(__file__).parent / "output" / "v2_aesthetic"
OUT_DIR.mkdir(parents=True, exist_ok=True)

ENDPOINT = "https://api.bfl.ai/v1/flux-2-pro"

# ─────────────────────────────────────────────────────────────
# V2 PROMPT — liquid glass bezel + champagne silk + minimal glyph
# (No brand names to avoid safety moderation)
# ─────────────────────────────────────────────────────────────
PROMPT_V2 = (
    "Luxury editorial product photography of a single premium divination card as the "
    "hero object, centered in the frame, occupying approximately 45 percent of the image "
    "height, photographed floating slightly above a dramatically draped champagne silk "
    "background. "

    # The card construction — liquid glass bezel frame
    "The card has a liquid glass outer frame — a translucent borosilicate glass bezel "
    "wrapping all four edges of the card with genuine optical refraction, real-world "
    "light bending through the glass creating soft prismatic edge highlights, subtle "
    "chromatic dispersion where light catches the curved edges, frosted glass inner rim "
    "with gentle specular reflections, the glass bezel catches the silk pattern behind "
    "it distorting it beautifully through refraction. The card edges have pronounced "
    "roundedness with soft meniscus curvature, glass depth visible at the corners, "
    "subsurface light scattering through the glass. "

    # The card face — warm ivory interior
    "The interior card face is a warm ivory cream color with a subtle soft radial "
    "gradient from center, no visible pattern or texture on the face, pristine and "
    "minimalist. "

    # The glyph — centered abstract symbol
    "At the exact geometric center of the card face, a single elegant minimalist "
    "abstract astronomical symbol rendered in deep cosmic indigo ink — a stylized "
    "composite mark featuring a central circle with radiating thin geometric rays and "
    "two delicate crescent arcs above and below, refined line-art, the symbol occupies "
    "only 15 percent of the card face, surrounded by generous cream negative space, "
    "hairline precision geometry. "

    # Silk background — warm champagne hero material
    "The silk background fills the entire frame behind the card and extends to all "
    "edges — a dramatically draped champagne-gold and cream silk fabric with flowing "
    "soft folds that catch warm directional light, creating rich tonal variations from "
    "bright warm gold highlights on the crests of the folds to deep pearlescent cream "
    "shadows in the fold valleys, photographed as a hero editorial material, 30-momme "
    "weight silk with soft directional sheen, the fold pattern sweeps diagonally across "
    "the composition creating visual movement behind the card. "

    # Lighting & composition
    "Soft cinematic directional lighting from upper-left at warm 3400-4000K color "
    "temperature, gentle specular highlights on the glass frame edges, soft shadow "
    "beneath the card indicating it floats slightly above the silk, shallow depth of "
    "field with the card in tack-sharp focus and the silk softly blurred in the "
    "background, bokeh on distant silk areas. "

    # Constraints
    "No text, no typography, no numerals, no letters, no borders beyond the glass "
    "bezel, no other objects. Editorial luxury photography aesthetic, medium format "
    "digital photography, 8K rendering, photorealistic, warm rich tonal palette of "
    "champagne gold cream and deep cosmic indigo accent."
)


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
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def _get(url):
    req = Request(url, headers={"accept": "application/json", "x-key": API_KEY})
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def _download(url, dest):
    with urlopen(url, timeout=120) as r:
        dest.write_bytes(r.read())


def generate(seed, label):
    print(f"[{label}] seed={seed}")
    body = {
        "prompt": PROMPT_V2,
        "aspect_ratio": "custom",
        "width": 896,
        "height": 1536,
        "output_format": "png",
        "output_quality": 100,
        "guidance": 3.5,
        "safety_tolerance": 2,
        "prompt_upsampling": False,
        "seed": seed,
    }
    submit = _post(ENDPOINT, body)
    task_id = submit["id"]
    polling_url = submit.get("polling_url") or f"https://api.bfl.ai/v1/get_result?id={task_id}"
    print(f"  task: {task_id}")

    for _ in range(60):
        time.sleep(2)
        result = _get(polling_url)
        status = result.get("status")
        if status == "Ready":
            image_url = result["result"]["sample"]
            dest = OUT_DIR / f"{label}_seed{seed}.png"
            _download(image_url, dest)
            print(f"  ✓ saved {dest.name}")
            return dest
        if status in ("Error", "Failed", "Content Moderated", "Request Moderated"):
            print(f"  ✗ {status} — safety filter triggered, try different wording")
            return None
        print(f"  ... {status}")
    print("  ✗ timeout")
    return None


if __name__ == "__main__":
    print(f"Prompt length: {len(PROMPT_V2)} chars, ~{len(PROMPT_V2.split())} words")
    print()
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    for i in range(n):
        seed = random.randint(1, 9_999_999)
        generate(seed, f"v2_fool_{i+1:02d}")
        time.sleep(2)
    print("\nDone. Review in output/v2_aesthetic/")
