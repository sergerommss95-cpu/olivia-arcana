#!/usr/bin/env python3
"""Reconstruct this historical snapshot into a new directory, validating every hash."""
from pathlib import Path
import argparse, hashlib, json, subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("destination", help="A new directory outside this repository")
args = parser.parse_args()
session = Path(__file__).resolve().parent
repo = session.parents[2]
destination = Path(args.destination).expanduser().resolve()
if destination.exists() or destination == repo or repo in destination.parents:
    parser.error("Use a new directory outside the handoff repository; nothing will be overwritten.")
manifest = json.loads((session / "manifest.json").read_text())
pending = []
for entry in manifest["entries"]:
    if entry["status"] == "excluded":
        continue
    source = (repo / entry["destination"]).resolve()
    if repo not in source.parents or not source.is_file():
        raise SystemExit("Missing or invalid retained path: " + entry["destination"])
    data = source.read_bytes()
    if hashlib.sha256(data).hexdigest() != entry["sha256"]:
        # A shared source can have checkout line-ending conversion. The Git blob
        # is acceptable only if it matches the manifest's historical checksum.
        try:
            data = subprocess.check_output(["git", "show", "HEAD:" + entry["destination"]], cwd=repo, stderr=subprocess.DEVNULL)
        except subprocess.CalledProcessError:
            pass
    if hashlib.sha256(data).hexdigest() != entry["sha256"]:
        raise SystemExit("Hash mismatch; retained file changed: " + entry["destination"])
    relative = Path(entry["source"])
    if entry.get("source_root", "session") != "session":
        relative = Path("_external") / entry["source_root"] / relative
    target = (destination / relative).resolve()
    if destination not in target.parents:
        raise SystemExit("Invalid source-relative path in manifest.")
    pending.append((target, data))
for target, data in pending:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
print("Reconstructed", len(pending), "files into", destination)
print("Excluded environment, dependencies, caches and raw session records are not restored.")
