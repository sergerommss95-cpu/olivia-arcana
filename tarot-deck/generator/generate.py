"""
Olivia Arcana — Flux 2 Pro deck generator.

Usage:
    python3 generate.py discover          # Phase 1: generate 5x The Fool for style seed selection
    python3 generate.py card <id>         # Generate a single card by ID (0-77)
    python3 generate.py deck              # Phase 2: generate all pending/regenerate cards
    python3 generate.py deck --batch 10   # Limit to N cards per run
    python3 generate.py status            # Show manifest status

Implements §4 of the Master Guide: seed management, error handling, polling, rate limiting.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
from pathlib import Path
from typing import Optional
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from prompts import (
    build_prompt,
    GLOBAL_COSMOS_STYLE_PREFIX,
    LIQUID_GLASS_PERIMETER_SUFFIX,
)

# ─────────────────────────────────────────────────────────────
# Paths & config
# ─────────────────────────────────────────────────────────────
HERE = Path(__file__).parent
MANIFEST_PATH = HERE / "deck_manifest.json"
OUTPUT_DIR = HERE / "output"
MAJOR_DIR = OUTPUT_DIR / "major"
MINOR_DIR = OUTPUT_DIR / "minor"
DISCOVERY_DIR = OUTPUT_DIR / "style_discovery"

for d in (OUTPUT_DIR, MAJOR_DIR, MINOR_DIR, DISCOVERY_DIR):
    d.mkdir(parents=True, exist_ok=True)

# Load BFL API key from ~/tools/bfl-api/.env or env
BFL_ENV = Path.home() / "tools" / "bfl-api" / ".env"
if BFL_ENV.exists():
    for line in BFL_ENV.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

API_KEY = os.environ.get("BFL_API_KEY")
if not API_KEY:
    sys.exit("ERROR: BFL_API_KEY not set. Add it to ~/tools/bfl-api/.env")


# ─────────────────────────────────────────────────────────────
# Manifest I/O
# ─────────────────────────────────────────────────────────────
def load_manifest() -> dict:
    with open(MANIFEST_PATH) as f:
        return json.load(f)


def save_manifest(manifest: dict) -> None:
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)


def card_output_dir(card: dict) -> Path:
    return MAJOR_DIR if card["arcana"] == "major" else MINOR_DIR


# ─────────────────────────────────────────────────────────────
# API calls
# ─────────────────────────────────────────────────────────────
def _post(url: str, body: dict) -> dict:
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


def _get(url: str) -> dict:
    req = Request(url, headers={"accept": "application/json", "x-key": API_KEY})
    with urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def _download(url: str, dest: Path) -> int:
    with urlopen(url, timeout=120) as r:
        data = r.read()
    dest.write_bytes(data)
    return len(data)


def submit_generation(
    prompt: str,
    width: int,
    height: int,
    seed: Optional[int],
    guidance: float,
    safety_tolerance: int,
    prompt_upsampling: bool,
    endpoint: str,
) -> dict:
    """Submit one generation and return {id, polling_url}."""
    payload = {
        "prompt": prompt,
        "aspect_ratio": "custom",
        "width": width,
        "height": height,
        "output_format": "png",
        "output_quality": 100,
        "guidance": guidance,
        "safety_tolerance": safety_tolerance,
        "prompt_upsampling": prompt_upsampling,
    }
    if seed is not None:
        payload["seed"] = seed
    return _post(endpoint, payload)


class ModerationError(RuntimeError):
    """Raised when a generation is flagged as Content/Request Moderated."""


def poll_result(polling_url: str, max_polls: int = 90, interval: float = 2.0) -> dict:
    """Poll until Ready or failure. Raises ModerationError on moderation so
    the caller can retry with a new seed, or RuntimeError on hard failure."""
    for _ in range(max_polls):
        time.sleep(interval)
        try:
            result = _get(polling_url)
        except (HTTPError, URLError) as e:
            print(f"    poll warning: {e}")
            continue
        except Exception as e:
            print(f"    poll err {type(e).__name__}: {e}")
            continue
        status = result.get("status")
        if status == "Ready":
            return result
        if status in ("Content Moderated", "Request Moderated"):
            raise ModerationError(status)
        if status in ("Error", "Failed"):
            raise RuntimeError(f"Generation failed — status={status}: {result}")
        print(f"    ... {status}")
    raise TimeoutError(f"Polling exceeded {max_polls * interval}s")


# ─────────────────────────────────────────────────────────────
# Higher-level operations
# ─────────────────────────────────────────────────────────────
def generate_one(
    card: dict,
    seed: Optional[int],
    meta: dict,
    output_path: Path,
    max_moderation_retries: int = 3,
) -> dict:
    """Submit + poll + download one card, retrying with new random seeds
    on moderation flakes. Returns the poll result dict on success."""
    prompt = build_prompt(card)
    print(f"  prompt length: {len(prompt)} chars, ~{len(prompt.split())} words")

    current_seed = seed
    for attempt in range(max_moderation_retries):
        try:
            submit = submit_generation(
                prompt=prompt,
                width=meta["width"],
                height=meta["height"],
                seed=current_seed,
                guidance=meta.get("guidance", 3.5),
                safety_tolerance=meta.get("safety_tolerance", 2),
                prompt_upsampling=meta.get("prompt_upsampling", False),
                endpoint=meta["model_endpoint"],
            )
        except HTTPError as e:
            body = e.read().decode() if hasattr(e, "read") else str(e)
            raise RuntimeError(f"HTTP {e.code} on submit: {body}")

        task_id = submit.get("id")
        polling_url = (
            submit.get("polling_url")
            or f"https://api.bfl.ai/v1/get_result?id={task_id}"
        )
        print(f"    attempt {attempt+1}/{max_moderation_retries} seed={current_seed} task={task_id}")

        try:
            result = poll_result(polling_url)
        except ModerationError as e:
            print(f"    ⚠ {e} — retrying with new seed")
            current_seed = random.randint(1, 9_999_999)
            time.sleep(2)
            continue

        image_url = result["result"]["sample"]
        size = _download(image_url, output_path)
        print(f"  ✓ saved {output_path.name} ({size//1024} KB)")

        if size < 50_000:
            print(f"  ⚠ WARNING: file is only {size} bytes — may be malformed")

        # record the seed that actually succeeded
        card["seed"] = current_seed
        return result

    raise ModerationError(
        f"all {max_moderation_retries} moderation attempts failed for {card['card_name']}"
    )


def phase1_style_discovery(n_variations: int = 5) -> None:
    """
    Phase 1 — Style Seed Discovery (§4.2).
    Generate N variations of The Fool with random seeds.
    User then picks the best one visually and records its seed as GLOBAL_STYLE_SEED.
    """
    manifest = load_manifest()
    meta = manifest["deck_metadata"]
    fool = next(c for c in manifest["cards"] if c["id"] == 0)

    print(f"\n═══ Phase 1: Style Discovery ═══")
    print(f"Generating {n_variations} variations of The Fool...")
    print(f"Endpoint: {meta['model_endpoint']}")
    print(f"Dimensions: {meta['width']}x{meta['height']}")
    print()

    results = []
    for i in range(n_variations):
        # Random seed per variation
        seed = random.randint(1, 9_999_999)
        print(f"[{i+1}/{n_variations}] seed={seed}")
        out_path = DISCOVERY_DIR / f"fool_v{i+1:02d}_seed{seed}.png"
        try:
            result = generate_one(fool, seed, meta, out_path)
            results.append({"index": i + 1, "seed": seed, "path": str(out_path)})
        except Exception as e:
            print(f"  ✗ FAILED: {e}")
            continue
        time.sleep(2)  # Rate limiting

    # Save discovery log
    log_path = DISCOVERY_DIR / "discovery_log.json"
    log_path.write_text(json.dumps(results, indent=2))
    print(f"\n✓ Discovery complete — {len(results)}/{n_variations} succeeded")
    print(f"  log: {log_path}")
    print(f"\nNext step: review output/style_discovery/ and choose the best variant.")
    print(f"Then set deck_metadata.global_style_seed = <chosen seed> in deck_manifest.json")


def generate_card_by_id(card_id: int, force: bool = False) -> None:
    """Generate (or regenerate) a single card by ID."""
    manifest = load_manifest()
    meta = manifest["deck_metadata"]
    card = next((c for c in manifest["cards"] if c["id"] == card_id), None)
    if not card:
        sys.exit(f"Card id {card_id} not found")

    global_seed = meta.get("global_style_seed")
    if global_seed is None and card.get("seed") is None:
        print("⚠ No global_style_seed set and card has no locked seed.")
        print("  Using a random seed. Run `python3 generate.py discover` first to lock style.")
        card_seed = random.randint(1, 9_999_999)
    else:
        card_seed = card.get("seed") or (global_seed + card_id)

    output_path = card_output_dir(card) / card["output_filename"]
    if output_path.exists() and not force:
        print(f"Skip {card['card_name']} — already exists. Use --force to regenerate.")
        return

    print(f"\n═══ [{card['id']:02d}] {card['card_name']} ═══")
    print(f"  seed: {card_seed}")
    try:
        generate_one(card, card_seed, meta, output_path)
        card["seed"] = card_seed
        card["status"] = "generated"
        save_manifest(manifest)
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        card["status"] = "regenerate"
        save_manifest(manifest)
        sys.exit(1)


def generate_deck(batch_size: Optional[int] = None) -> None:
    """Phase 2 — generate all cards with status pending or regenerate."""
    manifest = load_manifest()
    meta = manifest["deck_metadata"]
    global_seed = meta.get("global_style_seed")

    if global_seed is None:
        print("⚠ WARNING: global_style_seed is null. Style consistency not guaranteed.")
        print("  Run `python3 generate.py discover` first, pick best, set global_style_seed.")
        resp = input("  Continue anyway with random seeds? (y/N) ")
        if resp.lower() != "y":
            return

    to_do = [c for c in manifest["cards"] if c["status"] in ("pending", "regenerate")]
    if batch_size:
        to_do = to_do[:batch_size]

    print(f"\n═══ Phase 2: Deck Generation ═══")
    print(f"Cards to generate: {len(to_do)}")
    print(f"Endpoint: {meta['model_endpoint']}")
    print(f"Est. cost: ${len(to_do) * 0.03:.2f}")
    print()

    success, failed = 0, 0
    for card in to_do:
        initial_seed = card.get("seed") or ((global_seed or 0) + card["id"])
        output_path = card_output_dir(card) / card["output_filename"]

        print(f"[{card['id']:02d}/{len(to_do)}] {card['card_name']} (seed={initial_seed})")
        try:
            generate_one(card, initial_seed, meta, output_path)
            card["status"] = "generated"
            success += 1
        except ModerationError as e:
            print(f"  ✗ moderation gave up: {e}")
            card["status"] = "regenerate"
            failed += 1
        except (RuntimeError, TimeoutError) as e:
            print(f"  ✗ {e}")
            card["status"] = "regenerate"
            failed += 1
        except Exception as e:
            print(f"  ✗ unexpected: {type(e).__name__}: {e}")
            card["status"] = "regenerate"
            failed += 1

        save_manifest(manifest)  # preserve progress after every card
        time.sleep(1)  # rate limiting

    print(f"\n═══ Complete: {success} succeeded, {failed} failed ═══")
    if failed:
        print(f"Run `python3 generate.py deck` again to retry failed cards.")


def show_status() -> None:
    """Print manifest summary."""
    manifest = load_manifest()
    cards = manifest["cards"]
    meta = manifest["deck_metadata"]

    by_status = {}
    for c in cards:
        by_status[c["status"]] = by_status.get(c["status"], 0) + 1

    print(f"\n═══ Olivia Arcana Deck Status ═══")
    print(f"Endpoint: {meta['model_endpoint']}")
    print(f"Global style seed: {meta.get('global_style_seed', 'NOT SET')}")
    print(f"Total cards: {len(cards)}")
    for status, count in sorted(by_status.items()):
        print(f"  {status}: {count}")

    pending = [c["card_name"] for c in cards if c["status"] == "pending"]
    if pending and len(pending) <= 10:
        print(f"\nPending: {', '.join(pending)}")
    elif pending:
        print(f"\nPending: {len(pending)} cards")


# ─────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description="Olivia Arcana Flux 2 Pro generator")
    sub = p.add_subparsers(dest="command", required=True)

    p_disc = sub.add_parser("discover", help="Phase 1 — generate N variations of The Fool")
    p_disc.add_argument("-n", type=int, default=5, help="Number of variations (default 5)")

    p_card = sub.add_parser("card", help="Generate a single card by ID")
    p_card.add_argument("id", type=int, help="Card ID (0-77)")
    p_card.add_argument("--force", action="store_true", help="Overwrite existing")

    p_deck = sub.add_parser("deck", help="Phase 2 — generate all pending/regenerate cards")
    p_deck.add_argument("--batch", type=int, default=None, help="Max cards per run")

    sub.add_parser("status", help="Show manifest status")

    args = p.parse_args()

    if args.command == "discover":
        phase1_style_discovery(n_variations=args.n)
    elif args.command == "card":
        generate_card_by_id(args.id, force=args.force)
    elif args.command == "deck":
        generate_deck(batch_size=args.batch)
    elif args.command == "status":
        show_status()


if __name__ == "__main__":
    main()
