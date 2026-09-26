"""Rebuild the editable experience and sync it into the native website.
Run from any directory: python3 experience/build.py
Install both source package locks first; see experience/README.md.
"""
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(root / "work/olivia-product/build.py")], check=True)
shutil.copytree(root / "outputs/olivia-experience", root.parent / "website/public/experience", dirs_exist_ok=True)
print("Synced the current experience into website/public/experience. Run the website build next.")
