"""Style frame SF1 — the forced box wall (cold open, "109 / 189"). Illustrative reconstruction.

python3 films/tumbler/tools/rb.py films/false_floor/shots/sf_vault.py -- --stills 1 --pct 40 --samples 16
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
from vault_ff import *

sc = reset()
setup_render(1, 1, res=RES_FINAL, samples=48, look='Medium High Contrast', clamp=4.0)
world_color((0.004, 0.0045, 0.005))
M = mats()
right = build_wall(M, y0=-0.4, cols=22, rows=13, seed=7, forced=0.6, side=1)
left = build_wall(M, y0=-0.4, cols=22, rows=13, seed=19, forced=0.5, side=-1)
floor = box('Floor', (3.0, 9.0, 0.1), (0, 3.0, -0.05), mat=M['floor'])
ceil = box('Ceil', (3.0, 9.0, 0.1), (0, 3.0, 2.95), mat=mat_principled('CeilDark', color=(0.03, 0.03, 0.032), rough=0.6))
# end wall with the open vault doorway: thick door slab swung open, cold antechamber light beyond
ew = mat_concrete('EndConcrete', base=(0.07, 0.072, 0.075), wet=0.0, scale=1.5, contrast=0.4)
box('EndL', (1.0, 0.45, 2.95), (-1.0, 6.45, 1.475), mat=ew)
box('EndR', (1.0, 0.45, 2.95), (1.0, 6.45, 1.475), mat=ew)
box('EndTop', (1.0, 0.45, 0.9), (0.0, 6.45, 2.5), mat=ew)
steel = mat_metal('DoorSlab', base=(0.42, 0.43, 0.44), rough=(0.14, 0.3), scale=2.0, bump=0.004, brushed=(1.0, 1.0, 40.0))
slab_pv = empty('SlabHinge', (0.5, 6.22, 0.0))
slab = box('DoorSlab', (1.0, 0.38, 2.04), (-0.5, -0.19, 1.02), bev=0.01, mat=steel)
parent(slab, slab_pv, keep=False)
for z in (0.35, 0.75, 1.15, 1.55):     # locking bolts on the door edge
    b = prim('cyl', 'EdgeBolt', (-1.0, -0.19, z), (0, math.radians(90), 0), seg=24, r=0.03, depth=0.06)
    set_mat(b, steel)
    parent(b, slab_pv, keep=False)
slab_pv.rotation_euler.z = math.radians(-105)
box('Antechamber', (3.0, 0.1, 3.0), (0, 9.5, 1.5), mat=mat_principled('AnteWall', color=(0.1, 0.105, 0.11), rough=0.8))
light('AREA', 'AnteLight', (0.0, 8.3, 2.2), (math.radians(55), 0, 0), energy=30, color=kelvin(5400), size=1.5)
scatter_debris(M, (-1.1, 0.1, 0), (1.15, 5.5, 0), count=170, seed=11, near=(1.15, 0))
scatter_debris(M, (-1.15, 0.6, 0), (1.0, 5.0, 0), count=60, seed=23, near=(-1.1, 0))
# light: cool overhead fluorescent strips + a cream grazing key that writes the box lips
strip = mat_strip('FluoroFF', color=(0.86, 0.9, 0.95), strength=2.2)
for y in (0.6, 2.4, 4.2):
    box('Tube', (0.06, 1.2, 0.025), (0.0, y, 2.88), bev=0.008, mat=strip)
    light('AREA', 'FluoroL', (0.0, y, 2.85), (0, 0, 0), energy=14, color=kelvin(4600), size=0.12, size_y=1.2, shape='RECTANGLE')
aim = empty('KeyAim', (1.2, 3.0, 1.4))
key_l = light('AREA', 'CreamKey', (-1.05, 0.6, 2.6), energy=38, color=kelvin(3900), size=0.25)
track_to(key_l, aim)
light('AREA', 'Bounce', (0.0, -1.5, 0.6), energy=2.5, color=kelvin(5200), size=2.0, target=(0.5, 2.5, 0.8))
if arg('--debuglight'):
    light('AREA', 'Debug', (0, -1.5, 2.5), energy=800, size=3, target=(0.5, 3, 1))
cam = camera('CamSF1', lens=28, fstop=2.2)
cam.location = (-0.38, -0.25, 0.34)
look_at(cam, (0.95, 3.2, 1.05))
cam.rotation_euler.y += 0.0
foc = empty('FocusSF1', (1.15, 2.2, 0.9))
cam.data.dof.focus_object = foc
motes('Motes', 400, (-1.1, 0.0, 0.1), (1.1, 5.0, 2.6), r=(0.0008, 0.002), seed=4)
finish('SF1_vault')
