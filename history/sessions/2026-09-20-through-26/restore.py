#!/usr/bin/env python3
"""Restore preserved Olivia snapshots outside the active repository; stdlib only."""
import argparse
import base64
import collections
import functools
import gzip
import hashlib
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
MANIFEST = json.loads((HERE / 'manifest.json').read_text())

@functools.lru_cache(maxsize=24)
def object_bytes(key):
    obj = MANIFEST['objects'][key]
    if obj['encoding'] == 'git':
        data = subprocess.check_output(['git', 'show', obj['commit'] + ':' + obj['path']], cwd=REPO)
    else:
        data = (HERE / obj['path']).read_bytes()
        if obj['encoding'] == 'gzip':
            data = gzip.decompress(data)
    for ref in obj.get('base64', []):
        token = ref['token'].encode()
        if data.count(token) != 1:
            raise ValueError('Invalid embedded-image token for ' + key)
        data = data.replace(token, base64.b64encode(object_bytes(ref['object'])))
    if len(data) != obj['bytes'] or hashlib.sha256(data).hexdigest() != key:
        raise ValueError('Checksum mismatch for ' + key)
    return data

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--list', action='store_true', help='List preserved collections, or files in a selected collection')
    parser.add_argument('--verify', action='store_true', help='Reconstruct every unique object in memory and check SHA-256')
    parser.add_argument('--collection', default=None, help='Exact collection name shown by --list')
    parser.add_argument('--path', default=None, help='Restore only this exact original path within the collection')
    parser.add_argument('--output', type=Path, help='New destination outside this Git checkout; existing files are never overwritten')
    args = parser.parse_args()
    rows = [r for r in MANIFEST['entries'] if 'object' in r]
    if args.list:
        if args.collection:
            for row in rows:
                if row['collection'] == args.collection:
                    print(row['path'])
        else:
            for name, count in sorted(collections.Counter(r['collection'] for r in rows).items()):
                print(f'{count:5}  {name}')
        return
    if args.verify:
        for index, key in enumerate(MANIFEST['objects'], 1):
            object_bytes(key)
            if index % 200 == 0:
                print(f'Verified {index}/{len(MANIFEST["objects"])} objects', flush=True)
        for row in rows:
            if row['object'] != row['sha256']:
                raise ValueError('Invalid file-to-object link: ' + row['path'])
        print(f'All {len(MANIFEST["objects"])} objects and {len(rows)} retained paths verified.')
        return
    if not args.collection or args.output is None:
        parser.error('Choose --list, --verify, or --collection NAME --output DIRECTORY.')
    target = args.output.expanduser().resolve()
    if target == REPO or REPO in target.parents:
        parser.error('Restore outside the active checkout to avoid mixing historical and current sources.')
    selected = [r for r in rows if r['collection'] == args.collection and (args.path is None or r['path'] == args.path)]
    if not selected:
        parser.error('No preserved files match; use --list to see exact names.')
    # Validate every target before writing any file.
    targets = []
    for row in selected:
        out = (target / row['path']).resolve()
        if target not in out.parents or out.exists():
            parser.error('Unsafe or existing destination: ' + str(out))
        targets.append((row, out))
    for row, out in targets:
        data = object_bytes(row['object'])
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)
    print(f'Restored and checksum-verified {len(targets)} files to {target}.')

if __name__ == '__main__':
    main()
