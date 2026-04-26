#!/usr/bin/env python3
"""Quick v9 generator - bypass CLI issues."""
import json, time
from pathlib import Path
from prompts import build_prompt_v9
from google import genai
from google.genai import types

HERE = Path("/Users/macbookpro/olivia-arcana/tarot-deck/generator")
OUT_DIR = HERE / "output" / "nano_banana_v9"
OUT_DIR.mkdir(parents=True, exist_ok=True)

MANIFEST = json.loads((HERE / "deck_manifest.json").read_text())

client = genai.Client(vertexai=True, project="olivia-tarot", location="us-central1")

def gen(card):
    out = OUT_DIR / card["output_filename"]
    if out.exists():
        print(f"skip {card['id']}")
        return
    prompt = build_prompt_v9(card)
    print(f"[{card['id']}] {card['card_name']} …")
    resp = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config=types.GenerateContentConfig(response_modalities=["IMAGE"], image_config=types.ImageConfig(aspect_ratio="2:3"))
    )
    for p in resp.candidates[0].content.parts:
        if p.inline_data:
            out.write_bytes(p.inline_data.data)
            print(f"  ✓ {out.name} ({len(p.inline_data.data)//1024}KB)")

for i, card in enumerate(MANIFEST["cards"]):
    try:
        gen(card)
        if i < 77:
            time.sleep(15)
    except Exception as e:
        print(f"  ✗ {e}")
        time.sleep(30)