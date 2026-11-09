#!/usr/bin/env python3
"""QC contact sheet for the MG pass: 3 frames per shot (~20 %, ~60 %, last) + overlays -> tests/QC_mg.jpg"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import shots  # noqa: E402

R = os.path.join(kit.FF, 'out', 'renders')
files = []
for sid in shots.REG:
    n = kit.shot_info(sid)['render_frames']
    for f in (max(1, int(n * 0.2)), int(n * 0.6), n):
        files.append(os.path.join(R, sid, f'{f:04d}.png'))
files += [os.path.join(R, 'END', '0060.png'), os.path.join(R, 'END', '0360.png'),
          os.path.join(R, 'O_109', '0252.png'), os.path.join(R, 'O_TITLE', '0072.png'),
          os.path.join(R, 'O_LAYER', 'layer_03.png'), os.path.join(R, 'O_COUNT', 'count_054.png'),
          os.path.join(R, 'O_LABEL', 'label.png')]
missing = [f for f in files if not os.path.exists(f)]
if missing:
    print('missing:', missing)
files = [f for f in files if os.path.exists(f)]
out = os.path.join(kit.FF, 'tests', 'QC_mg.jpg')
subprocess.run([sys.executable, os.path.join(os.path.dirname(kit.FF), 'tumbler', 'tools', 'sheet.py')] + files +
               ['--cols', '3', '--w', '640', '--out', out], check=True)
