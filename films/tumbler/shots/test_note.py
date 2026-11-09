"""Test card for the banknote material (not part of the film).

python3 tools/rb.py shots/test_note.py -- --stills 1 --pct 100            # full note, even light
python3 tools/rb.py shots/test_note.py -- --view macro --stills 1 --pct 100  # hero rosette, grazing light
python3 tools/rb.py shots/test_note.py -- --view lo --stills 1             # detail='lo' note at a distance
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from common import *
from note import *

VIEW = arg('--view', 'full')
sc = reset()
setup_render(1, 1, samples=24)
world_color((0.02, 0.022, 0.025))
n = make_banknote('Note', detail='lo' if VIEW == 'lo' else 'hi')
hx, hy = hero_xy()
if VIEW == 'macro':
    d = 0.16
    cam = camera('C', (hx, hy, d), target=(hx, hy, 0), lens=100, fstop=4.0, focus=d, clip=(0.001, 10))
    light('AREA', 'K', (hx - 0.25, hy + 0.08, 0.05), energy=3.0, color=kelvin(4200), size=0.02, size_y=0.3,
          shape='RECTANGLE', target=(hx, hy, 0))
    light('AREA', 'F', (hx + 0.2, hy - 0.1, 0.25), energy=0.25, color=(0.6, 0.75, 1.0), size=0.2, target=(hx, hy, 0))
    tag = 'macro'
elif VIEW == 'lo':
    cam = camera('C', (0, 0, 0.9), target=(0, 0, 0), lens=50, fstop=8.0, focus=0.9, clip=(0.001, 10))
    light('AREA', 'K', (-0.2, -0.15, 0.4), energy=6, color=kelvin(3800), size=0.3, target=(0, 0, 0))
    tag = 'lo'
else:
    cam = camera('C', (0, 0, 0.26), target=(0, 0, 0), lens=50, fstop=8.0, focus=0.26, clip=(0.001, 10))
    light('AREA', 'K', (-0.2, -0.15, 0.4), energy=6, color=kelvin(3800), size=0.3, target=(0, 0, 0))
    light('AREA', 'R', (0.3, 0.2, 0.2), energy=2, color=(0.6, 0.75, 1.0), size=0.3, target=(0, 0, 0))
    tag = 'full'
bk = arg('--bump', None, float)
if bk:
    for mt in bpy.data.materials:
        if mt.node_tree:
            for nd in mt.node_tree.nodes:
                if nd.bl_idname == 'ShaderNodeBump':
                    nd.inputs['Distance'].default_value *= bk
                    print('[info] bump inputs', [(i.name, i.default_value if hasattr(i, 'default_value') and not hasattr(i.default_value, '__len__') else '-') for i in nd.inputs])
print('[info] banknote nodes:', len(bpy.data.materials['Banknote' if VIEW != 'lo' else 'BanknoteLo'].node_tree.nodes))
finish('note_test_' + tag + arg('--tag2', ''))
