"""Rebuild the editable experience and sync it into the native website.
Run from any directory: python3 experience/build.py
Install both source package locks first; see experience/README.md.
"""
from pathlib import Path
import json
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(root / "work/olivia-product/build.py")], check=True)
source = root / "outputs/olivia-experience"
destination = root.parent / "website/public/experience"
shutil.copytree(source, destination, dirs_exist_ok=True)
# The Telegram Mini App pages point at these same hashed assets. Rebuild them
# before pruning, while both the old and the new assets are still present.
subprocess.run([sys.executable, str(root / "telegram/build.py")], check=True)
# Keep only the current build's hashed assets in the website snapshot.
current = set(json.loads((source / "manifest.json").read_text())["assets"])
removed = [file for file in (destination / "assets").iterdir() if "assets/" + file.name not in current]
for file in removed:
    file.unlink()
print(f"Synced the current experience into website/public/experience ({len(removed)} earlier files removed). Run the website build next.")
