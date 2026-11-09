#!/usr/bin/env python3
"""QC contact sheet for the MG pass: 3 frames per shot (~20 %, ~60 %, last) + end card + overlays -> tests/QC_mg.jpg.
Reads out/renders/<ID>/NNNN.png when present, otherwise decodes the packed clip out/clips/<ID>.mkv."""
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import shots  # noqa: E402

R = os.path.join(kit.FF, 'out', 'renders')
CL = os.path.join(kit.FF, 'out', 'clips')
tmp = tempfile.mkdtemp(prefix='qc_mg_')


def frames(sid, picks):
    """picks: 1-based frame numbers -> list of image paths."""
    d = os.path.join(R, sid)
    if os.path.isdir(d) and all(os.path.exists(os.path.join(d, f'{f:04d}.png')) for f in picks):
        return [os.path.join(d, f'{f:04d}.png') for f in picks]
    clip = os.path.join(CL, f'{sid}.mkv')
    out = []
    for f in picks:
        p = os.path.join(tmp, f'{sid}_{f:04d}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', clip, '-vf', f'select=eq(n\\,{f - 1})', '-vsync', '0',
                        '-frames:v', '1', '-pix_fmt', 'rgb24', p], check=True)
        out.append(p)
    return out


files = []
for sid in shots.REG:
    n = kit.shot_info(sid)['render_frames']
    files += frames(sid, [max(1, int(n * 0.2)), int(n * 0.6), n])
files += frames('END', [60, 360])
files += [os.path.join(R, 'O_109', '0252.png'), os.path.join(R, 'O_TITLE', '0072.png'),
          os.path.join(R, 'O_LAYER', 'layer_03.png'), os.path.join(R, 'O_COUNT', 'count_054.png'),
          os.path.join(R, 'O_LABEL', 'label.png')]
out = os.path.join(kit.FF, 'tests', 'QC_mg.jpg')
subprocess.run([sys.executable, os.path.join(os.path.dirname(kit.FF), 'tumbler', 'tools', 'sheet.py')] + files +
               ['--cols', '3', '--w', '640', '--out', out], check=True)
