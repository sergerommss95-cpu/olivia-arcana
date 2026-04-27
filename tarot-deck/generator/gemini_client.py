"""
Olivia Arcana — Google Image generator (Nano Banana via Vertex AI).

Alternate backend to BFL Flux 2 Pro for A/B comparison. Uses the same
prompt library (prompts.py) and the same deck_manifest.json, so cards
rendered here are directly comparable to their BFL counterparts.

AUTH MODES:
  - Vertex AI (default): uses GOOGLE_APPLICATION_CREDENTIALS service account JSON
    + GOOGLE_CLOUD_PROJECT + GOOGLE_CLOUD_LOCATION. Unlocks nano banana
    (gemini-2.5-flash-image) on paid tier via the $300 free credit.
  - AI Studio (fallback): uses GEMINI_API_KEY. Free tier — only Imagen 4
    family works here, and that's gated to 3:4 aspect with no 2:3 option.

Usage:
    python3 gemini_client.py card <id>         # Generate a single card by ID
    python3 gemini_client.py ab                # Generate The Fool / Two of Wands / Justice
    python3 gemini_client.py status
    python3 gemini_client.py card <id> --model gemini-2.5-flash-image

Output saved to output/nano_banana/<filename>.png (never overwrites BFL output).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

from prompts import build_prompt, build_prompt_v2, build_prompt_v9, build_prompt_v10

# ─────────────────────────────────────────────────────────────
# Paths & config
# ─────────────────────────────────────────────────────────────
HERE = Path(__file__).parent
MANIFEST_PATH = HERE / "deck_manifest.json"
NB_OUTPUT_DIR = HERE / "output" / "nano_banana"
NB_V2_OUTPUT_DIR = HERE / "output" / "nano_banana_v2"
NB_V9_OUTPUT_DIR = HERE / "output" / "nano_banana_v9"
NB_V10_OUTPUT_DIR = HERE / "output" / "nano_banana_v10"
NB_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
NB_V2_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
NB_V9_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
NB_V10_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
REFERENCES_DIR = HERE / "references"

# Default reference images for v2 style guidance (nano banana accepts
# up to 14 reference images). Using only the 2 classical figure refs —
# the third reference (ref_motion_sparkles) is dropped because it's
# dominated by a sparkle cluster, and we want NO sparkles on the cards
# per user feedback.
DEFAULT_V2_REFS = [
    REFERENCES_DIR / "ref_fool_classical.png",
    REFERENCES_DIR / "ref_hermit_staff.png",
]

# Load Gemini API key from ~/tools/gemini-api/.env
GEMINI_ENV = Path.home() / "tools" / "gemini-api" / ".env"
if GEMINI_ENV.exists():
    for line in GEMINI_ENV.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

API_KEY = os.environ.get("GEMINI_API_KEY")
GCP_PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")
GCP_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
GCP_CREDS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

# Defensively unset GOOGLE_APPLICATION_CREDENTIALS if the path is missing,
# otherwise google-auth tries to open it before falling back to ADC.
if GCP_CREDS and not Path(GCP_CREDS).exists():
    os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
    GCP_CREDS = None

# Application Default Credentials (ADC) from `gcloud auth application-default login`
ADC_PATH = Path.home() / ".config" / "gcloud" / "application_default_credentials.json"
HAS_ADC = ADC_PATH.exists()
HAS_SA_KEY = bool(GCP_CREDS and Path(GCP_CREDS).exists())

# Vertex mode requires a project + either ADC or a service account JSON key
USE_VERTEX = bool(GCP_PROJECT and (HAS_ADC or HAS_SA_KEY))
if not USE_VERTEX and not API_KEY:
    sys.exit(
        "ERROR: no auth configured.\n"
        "For Vertex (recommended): run `gcloud auth application-default login` "
        "and set GOOGLE_CLOUD_PROJECT in ~/tools/gemini-api/.env\n"
        "For AI Studio (fallback): set GEMINI_API_KEY"
    )

# ─────────────────────────────────────────────────────────────
# Gemini SDK
# ─────────────────────────────────────────────────────────────
try:
    from google import genai
    from google.genai import types
except ImportError:
    sys.exit(
        "ERROR: google-genai not installed. Run: python3 -m pip install google-genai"
    )

# Default model: nano banana on Vertex (paid), or Imagen 4 Ultra on AI Studio (free).
if USE_VERTEX:
    DEFAULT_MODEL = "gemini-2.5-flash-image"
    # Nano banana supports native 2:3 — the classic tarot ratio
    ASPECT_RATIO = "2:3"
else:
    DEFAULT_MODEL = "imagen-4.0-ultra-generate-001"
    # Imagen 4 supports: 1:1, 9:16, 16:9, 4:3, 3:4 — no 2:3, use 3:4
    ASPECT_RATIO = "3:4"


# ─────────────────────────────────────────────────────────────
# Manifest I/O
# ─────────────────────────────────────────────────────────────
def load_manifest() -> dict:
    with open(MANIFEST_PATH) as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────
# Core generation
# ─────────────────────────────────────────────────────────────
def _is_imagen(model_id: str) -> bool:
    return model_id.startswith("imagen")


def _make_client() -> "genai.Client":
    """Initialize the SDK client in Vertex or AI Studio mode."""
    if USE_VERTEX:
        return genai.Client(
            vertexai=True,
            project=GCP_PROJECT,
            location=GCP_LOCATION,
        )
    return genai.Client(api_key=API_KEY)


def _load_reference_parts(ref_paths: list) -> list:
    """Load reference images as Part objects for nano banana multi-image input."""
    parts = []
    for p in ref_paths:
        path = Path(p)
        if not path.exists():
            print(f"    ⚠ reference missing: {path}")
            continue
        data = path.read_bytes()
        mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
        parts.append(types.Part.from_bytes(data=data, mime_type=mime))
        print(f"    + ref: {path.name} ({len(data)//1024} KB)")
    return parts


def generate_one(
    card: dict,
    output_path: Path,
    model_id: str = DEFAULT_MODEL,
    use_v2: bool = False,
    use_v9: bool = False,
    use_v10: bool = False,
    ref_paths: list = None,
) -> dict:
    """Generate a single card."""
    client = _make_client()
    if use_v10:
        prompt = build_prompt_v10(card)
        prompt_label = "v10 fine china porcelain"
    elif use_v9:
        prompt = build_prompt_v9(card)
        prompt_label = "v9 marble + oil"
    elif use_v2:
        prompt = build_prompt_v2(card)
        prompt_label = "v2 tilted-glass"
    else:
        prompt = build_prompt(card)
        prompt_label = "v1 COSMOS"

    backend = "Vertex AI" if USE_VERTEX else "AI Studio"
    print(f"  backend: {backend}  model: {model_id}  aspect: {ASPECT_RATIO}  prompt: {prompt_label}")
    print(f"  prompt length: {len(prompt)} chars, ~{len(prompt.split())} words")

    # Build content parts: reference images (if any) + text prompt
    ref_parts = []
    if ref_paths:
        ref_parts = _load_reference_parts(ref_paths)
        print(f"  references: {len(ref_parts)} loaded")

    max_attempts = 5
    last_err = None
    for attempt in range(1, max_attempts + 1):
        print(f"  attempt {attempt}/{max_attempts} …")
        t0 = time.time()
        try:
            if _is_imagen(model_id):
                # Imagen 4 API — generate_images. Free tier restrictions:
                # - no person_generation override (defaults to block-all-people on free)
                # - no safety_filter_level override (stuck at block_low_and_above)
                # - no 2:3 aspect (use 3:4)
                if ref_parts:
                    print("    ⚠ Imagen doesn't support reference images; ignoring refs")
                response = client.models.generate_images(
                    model=model_id,
                    prompt=prompt,
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        aspect_ratio=ASPECT_RATIO,
                    ),
                )
            else:
                # Nano banana / Gemini Image API — generate_content.
                # When reference parts are provided, contents must be a list of
                # Parts with image parts first and the text prompt last.
                if ref_parts:
                    contents = ref_parts + [prompt]
                else:
                    contents = prompt

                response = client.models.generate_content(
                    model=model_id,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                        image_config=types.ImageConfig(
                            aspect_ratio=ASPECT_RATIO,
                        ),
                    ),
                )
        except Exception as e:
            last_err = e
            msg = str(e)[:300].replace("\n", " ")
            print(f"    ✗ api error ({type(e).__name__}): {msg}")
            # Exponential backoff on 429 rate limits (20s, 40s, 80s, 160s)
            if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                backoff = 20 * (2 ** (attempt - 1))
                print(f"    ⏳ rate limit — waiting {backoff}s before retry")
                time.sleep(backoff)
            else:
                time.sleep(2)
            continue

        elapsed = time.time() - t0
        print(f"    api call took {elapsed:.1f}s")

        # Extract image bytes
        image_bytes = None
        text_notes = []
        try:
            if _is_imagen(model_id):
                imgs = response.generated_images or []
                if imgs:
                    image_bytes = imgs[0].image.image_bytes
            else:
                candidate = response.candidates[0]
                for part in candidate.content.parts:
                    if getattr(part, "inline_data", None):
                        image_bytes = part.inline_data.data
                    elif getattr(part, "text", None):
                        text_notes.append(part.text)
        except Exception as e:
            print(f"    ✗ response parse error: {e}")
            last_err = e
            continue

        if text_notes:
            print(f"    text: {' | '.join(t.strip()[:120] for t in text_notes)}")

        if not image_bytes:
            print("    ✗ no image bytes in response — likely moderation/refusal")
            last_err = RuntimeError("no image in response")
            time.sleep(2)
            continue

        output_path.write_bytes(image_bytes)
        size = len(image_bytes)
        print(f"  ✓ saved {output_path.name} ({size // 1024} KB)")
        return {
            "status": "ok",
            "path": str(output_path),
            "bytes": size,
            "attempts": attempt,
            "model": model_id,
        }

    return {
        "status": "failed",
        "error": str(last_err),
        "attempts": max_attempts,
        "model": model_id,
    }


def _resolve_refs(ref_arg: str) -> list:
    """Parse a --ref CLI value into a list of Paths.
    - None  → no references (text-only)
    - 'default' → the 3 packaged v2 reference images
    - comma-separated list of paths → those paths
    """
    if ref_arg is None:
        return []
    if ref_arg == "default":
        return DEFAULT_V2_REFS
    return [Path(p.strip()).expanduser().resolve() for p in ref_arg.split(",")]


def generate_card_by_id(
    card_id: int,
    force: bool = False,
    model: str = DEFAULT_MODEL,
    use_v2: bool = False,
    use_v9: bool = False,
    use_v10: bool = False,
    ref_arg: str = None,
) -> None:
    manifest = load_manifest()
    card = next((c for c in manifest["cards"] if c["id"] == card_id), None)
    if not card:
        sys.exit(f"Card id {card_id} not found")

    filename = card["output_filename"]
    out_dir = NB_V10_OUTPUT_DIR if use_v10 else (NB_V9_OUTPUT_DIR if use_v9 else (NB_V2_OUTPUT_DIR if use_v2 else NB_OUTPUT_DIR))
    output_path = out_dir / filename
    if output_path.exists() and not force:
        print(f"Skip {card['card_name']} — already exists (use --force to overwrite)")
        return

    ref_paths = _resolve_refs(ref_arg)
    print(f"\n═══ [{card['id']:02d}] {card['card_name']} ({model}) ═══")
    result = generate_one(
        card, output_path, model_id=model, use_v2=use_v2, use_v9=use_v9, use_v10=use_v10, ref_paths=ref_paths
    )
    if result["status"] != "ok":
        sys.exit(1)


def run_ab_set(
    model: str = DEFAULT_MODEL,
    use_v2: bool = False,
    ref_arg: str = None,
) -> None:
    """Generate the three A/B-test cards: Fool, Two of Wands, Justice."""
    manifest = load_manifest()
    card_ids = [0, 23, 11]  # The Fool, Two of Wands, Justice
    out_dir = NB_V2_OUTPUT_DIR if use_v2 else NB_OUTPUT_DIR
    ref_paths = _resolve_refs(ref_arg)
    for cid in card_ids:
        card = next((c for c in manifest["cards"] if c["id"] == cid), None)
        if not card:
            print(f"  ✗ id {cid} missing from manifest")
            continue
        output_path = out_dir / card["output_filename"]
        print(f"\n═══ [{card['id']:02d}] {card['card_name']} ({model}) ═══")
        result = generate_one(
            card, output_path, model_id=model, use_v2=use_v2, use_v9=use_v9, use_v10=use_v10, ref_paths=ref_paths
        )
        if result["status"] != "ok":
            print(f"  ⚠ failed: {result}")
        time.sleep(1)


def run_deck(
    model: str = DEFAULT_MODEL,
    use_v2: bool = False,
    ref_arg: str = None,
    batch_size: int = 4,
    batch_pause: float = 8.0,
    skip_existing: bool = True,
) -> None:
    """Generate the entire 78-card deck with parallel batches.

    Runs `batch_size` cards concurrently using a thread pool, then pauses
    `batch_pause` seconds between batches to stay under Vertex AI's per-
    minute rate limits. Skips existing output files unless --force.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    manifest = load_manifest()
    out_dir = NB_V2_OUTPUT_DIR if use_v2 else NB_OUTPUT_DIR
    ref_paths = _resolve_refs(ref_arg)

    # Build work queue
    todo = []
    skipped = 0
    for card in manifest["cards"]:
        output_path = out_dir / card["output_filename"]
        if skip_existing and output_path.exists():
            skipped += 1
            continue
        todo.append((card, output_path))

    total = len(manifest["cards"])
    est_seconds = (len(todo) / batch_size) * (45 + batch_pause)
    est_cost = len(todo) * 0.039
    print(f"\n═══ Deck generation ═══")
    print(f"  total cards: {total}")
    print(f"  skipped (already exist): {skipped}")
    print(f"  to generate: {len(todo)}")
    print(f"  batch size: {batch_size}  pause: {batch_pause}s")
    print(f"  est time: ~{int(est_seconds // 60)} min")
    print(f"  est cost: ~${est_cost:.2f}")
    print(f"  output: {out_dir}")
    print(f"  prompt: {'v2 tilted-glass' if use_v2 else 'v1 COSMOS'}")
    print(f"  refs: {len(ref_paths)} loaded" if ref_paths else "  refs: none")
    print()

    def worker(card, output_path):
        try:
            result = generate_one(
                card, output_path, model_id=model,
                use_v2=use_v2, use_v9=use_v9, use_v10=use_v10, ref_paths=ref_paths,
            )
            return (card["id"], card["card_name"], result)
        except Exception as e:
            return (card["id"], card["card_name"], {"status": "error", "error": str(e)})

    success = 0
    failed = []
    # Process in batches
    for i in range(0, len(todo), batch_size):
        batch = todo[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(todo) + batch_size - 1) // batch_size
        print(f"─── Batch {batch_num}/{total_batches} ({len(batch)} cards) ───")
        with ThreadPoolExecutor(max_workers=batch_size) as pool:
            futures = {pool.submit(worker, c, p): c for c, p in batch}
            for fut in as_completed(futures):
                cid, name, result = fut.result()
                if result.get("status") == "ok":
                    success += 1
                    print(f"  ✓ [{cid:02d}] {name}  ({result.get('bytes', 0) // 1024} KB)")
                else:
                    failed.append((cid, name, result))
                    print(f"  ✗ [{cid:02d}] {name}  — {result.get('error', 'unknown')[:120]}")

        if i + batch_size < len(todo):
            print(f"  pause {batch_pause}s …")
            time.sleep(batch_pause)

    print(f"\n═══ Deck complete: {success}/{len(todo)} succeeded ═══")
    if failed:
        print(f"  {len(failed)} failed — re-run with same command to retry")
        for cid, name, _ in failed[:10]:
            print(f"    [{cid:02d}] {name}")


def show_status() -> None:
    for label, folder in (("v1 COSMOS", NB_OUTPUT_DIR), ("v2 tilted-glass", NB_V2_OUTPUT_DIR)):
        existing = sorted(p.name for p in folder.glob("*.png"))
        print(f"\n═══ {label} Output ({len(existing)} files) ═══")
        for name in existing:
            p = folder / name
            print(f"  {name:<40} {p.stat().st_size // 1024:>5} KB")


def _add_gen_flags(sp):
    sp.add_argument("--model", default=DEFAULT_MODEL, help=f"Model id (default {DEFAULT_MODEL})")
    sp.add_argument("--v2", action="store_true", help="Use v2 tilted-glass prompt template")
    sp.add_argument("--v9", action="store_true", help="Use v9 marble + oil painting")
    sp.add_argument("--v10", action="store_true", help="Use v10 fine china porcelain")
    sp.add_argument(
        "--ref",
        default=None,
        help=(
            "Reference images to attach (nano banana multi-image input). "
            "Either 'default' (use the packaged 3 refs) or a comma-separated "
            "list of paths. Use with --v2 for best results."
        ),
    )


def main():
    p = argparse.ArgumentParser(description="Olivia Arcana Gemini 2.5 Flash Image generator")
    sub = p.add_subparsers(dest="command", required=True)

    p_card = sub.add_parser("card", help="Generate a single card by ID")
    p_card.add_argument("id", type=int, help="Card ID (0-77)")
    p_card.add_argument("--force", action="store_true", help="Overwrite existing")
    _add_gen_flags(p_card)

    p_ab = sub.add_parser("ab", help="Generate the 3 A/B test cards (Fool, Two of Wands, Justice)")
    _add_gen_flags(p_ab)

    p_deck = sub.add_parser("deck", help="Generate the full 78-card deck in parallel batches")
    _add_gen_flags(p_deck)
    p_deck.add_argument("--batch-size", type=int, default=4, help="Parallel cards per batch (default 4)")
    p_deck.add_argument("--batch-pause", type=float, default=8.0, help="Seconds between batches (default 8)")
    p_deck.add_argument("--force", action="store_true", help="Regenerate even if output exists")

    sub.add_parser("status", help="Show existing nano_banana output")

    args = p.parse_args()

    if args.command == "card":
        generate_card_by_id(
            args.id, force=args.force, model=args.model,
            use_v2=args.v2, use_v9=args.v9, use_v10=args.v10, ref_arg=args.ref,
        )
    elif args.command == "ab":
        run_ab_set(model=args.model, use_v2=args.v2, use_v9=args.v9, ref_arg=args.ref)
    elif args.command == "deck":
        run_deck(
            model=args.model, use_v2=args.v2, use_v9=args.v9, use_v10=args.v10, ref_arg=args.ref,
            batch_size=args.batch_size, batch_pause=args.batch_pause,
            skip_existing=not args.force,
        )
    elif args.command == "status":
        show_status()


if __name__ == "__main__":
    main()
