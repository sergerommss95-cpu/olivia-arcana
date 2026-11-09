"""ACT III — THE VAULT. 3A (FPV through the laser grid toward the gold), 3B (deposit doors fly open in a wave),
3C (gold bar macro + light sweep), 3D (head-on pull back on the box grid -> T3 to the tower facade).

python3 tools/rb.py shots/act3_vault.py -- --shot 3A --stills 7,30 --pct 50
"""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from common import *
from vault import *

SHOT = arg('--shot', '3A')
H = 6
LEN = {'3A': 48, '3B': 36, '3C': 36, '3D': 24}[SHOT] + 2 * H
B = H + 1
BEAT = 12

sc = reset()
setup_render(1, LEN, samples=32, look='Medium High Contrast')
world_color((0.002, 0.0018, 0.0015))
M = mats()
room = build_vault_room(M, walls=True, back=True, gold=True, lights=True, cols=27, rows=14, seed=7)
if arg('--debuglight'):
    light('AREA', 'Debug', (0, 2, 2.6), energy=1500, size=2, target=(0, 6, 1.0))


def cam_xz(y):
    """FPV flight line through the aisle (x, z) as a function of y."""
    return (0.18 * math.sin(y * 1.3), 1.32 + 0.22 * math.sin(y * 2.1 + 0.6))


if SHOT == '3A':
    # lasers placed to cross the flight line with near misses (never through the lens)
    rng = random.Random(41)
    core, glow = mat_laser(), mat_laser_glow()
    placed = 0
    tries = 0
    while placed < 11 and tries < 400:
        tries += 1
        ya = rng.uniform(2.2, 5.7)
        yb = ya + rng.uniform(-0.8, 0.8)
        za, zb = rng.uniform(0.3, 2.5), rng.uniform(0.3, 2.5)
        ym, zm = (ya + yb) / 2, (za + zb) / 2
        cx, cz = cam_xz(ym)
        # beam height at the camera's x
        t = (cx + ROOM_HALF_W) / (2 * ROOM_HALF_W)
        zc = za + (zb - za) * t
        if abs(zc - cz) < 0.2 or abs(zc - cz) > 0.9:
            continue
        x = ROOM_HALF_W - 0.06
        laser(f'Laser{placed}', (-x, ya, za), (x, yb, zb), core=core, glow=glow)
        for p in ((-x, ya, za), (x, yb, zb)):
            box('Emitter', (0.05, 0.07, 0.07), p, bev=0.006, mat=M['dark'])
        placed += 1
    cam = camera('Cam3A', lens=22, fstop=4.0)
    cam.data.dof.focus_distance = 1.2
    keys = []
    ys = [1.5 + (6.0 - 1.5) * (i / 8) ** 0.9 for i in range(9)]
    for i, y in enumerate(ys):
        f = 1 + (LEN - 1) * i / 8
        x, z = cam_xz(y)
        xn, zn = cam_xz(y + 0.6)
        roll = -0.35 * math.cos(y * 1.3) * 0.6
        keys.append((f, (x, y, z), (xn * 0.6, y + 1.0, zn - 0.12 - 0.05 * i), roll))
    keys[-1] = (LEN, (0.05, 6.0, 1.18), (0.0, 6.5, 0.95), 0.0)
    cam_path(cam, keys)
    shake(cam, 0.006, 0.004, scale=6, seed=31)
    motes('Motes', 500, (-1.4, 1.5, 0.2), (1.4, 6.5, 2.8), r=(0.0012, 0.003), seed=9, drift=(0.03, 0.02, 0.05), end=LEN)

elif SHOT == '3B':
    rng = random.Random(5)
    # right wall (x=+1.55, faces -X): doors open outward in a wave from near (low y) to far
    for pv, c, r in room['right']:
        if c < 1 or c > 20:
            continue
        f0 = B + 2 + (c - 1) * 1.15 + (13 - r) * 0.22 + rng.uniform(-0.6, 0.6)
        ang = math.radians(rng.uniform(98, 112))
        key(pv, 'rotation_euler', [(1, 0.0), (f0, 0.0), (f0 + 4, ang * 1.06), (f0 + 6, ang * 0.97), (f0 + 8, ang)], index=2)
    # contents in the right-wall cells (cash bricks, a few gold bars) for the visible columns
    bar_proto = next(o for o in bpy.data.objects if o.name == 'GoldBarProto')
    brick = build_cash_brick('CellBrick')
    brick.location = (0, 0, -100)
    for pv, c, r in room['right']:
        if c < 1 or c > 20:
            continue
        roll = rng.random()
        wy = ROOM_Y0 + c * 0.26 + 0.13
        wz = 0.25 + r * 0.19 + 0.04
        if roll < 0.55:
            o = linked_copy(brick, loc=(ROOM_HALF_W + 0.1, wy + rng.uniform(-0.03, 0.03), wz + 0.0), rot=(0, 0, math.pi / 2 + rng.uniform(-0.15, 0.15)))
            o.hide_render = False
            for ch in brick.children:
                cc = linked_copy(ch)
                cc.parent = o
        elif roll < 0.68:
            o = linked_copy(bar_proto, loc=(ROOM_HALF_W + 0.12, wy, wz - 0.025), rot=(0, 0, rng.uniform(-0.2, 0.2)))
            o.hide_render = False
    cam = camera('Cam3B', lens=28, fstop=2.2)
    foc = empty('Focus3B', (ROOM_HALF_W - 0.1, 2.9, 1.2))
    key(foc, 'location', [(1, (ROOM_HALF_W - 0.1, 2.6, 1.2)), (LEN, (ROOM_HALF_W - 0.1, 3.9, 1.3))])
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, (-0.95, 1.55, 0.85), (ROOM_HALF_W, 3.6, 1.3), 0.05),
                   (LEN, (-0.85, 2.35, 1.0), (ROOM_HALF_W, 4.9, 1.4), 0.02)])
    light('AREA', 'RightWall', (-0.6, 3.8, 2.7), energy=70, color=kelvin(3000), size=0.3, size_y=4.0, shape='RECTANGLE',
          target=(ROOM_HALF_W, 3.8, 1.2))
    shake(cam, 0.004, 0.002, scale=9, seed=32)
    motes('Motes', 300, (0.0, 1.5, 0.3), (1.5, 6.0, 2.5), r=(0.0012, 0.003), seed=10, drift=(0.03, 0.02, 0.05), end=LEN)

elif SHOT == '3C':
    cam = camera('Cam3C', lens=85, fstop=1.6)
    foc = empty('Focus3C', (0.0, GOLD_Y - 0.1, 1.04))
    key(foc, 'location', [(1, (0.03, GOLD_Y - 0.18, 1.04)), (LEN, (0.0, GOLD_Y + 0.12, 1.04))])
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, (0.30, GOLD_Y - 0.42, 1.26), (0.0, GOLD_Y - 0.12, 1.03), 0.05),
                   (LEN, (0.26, GOLD_Y - 0.05, 1.25), (-0.02, GOLD_Y + 0.18, 1.03), 0.02)])
    for o in bpy.data.objects:
        if o.name == 'GoldKey':
            o.data.energy = 70
    shake(cam, 0.0015, 0.0008, scale=12, seed=33)
    aim = empty('SweepAim3C', (0, GOLD_Y, 1.0))
    sw = light('AREA', 'Sweep3C', energy=7, color=kelvin(3300), size=0.04, size_y=1.2, shape='RECTANGLE')
    key(sw, 'location', [(1, (-0.9, GOLD_Y - 0.6, 1.6)), (LEN, (-0.4, GOLD_Y + 0.7, 1.6))])
    track_to(sw, aim)
    motes('Motes', 160, (-0.3, GOLD_Y - 0.5, 0.95), (0.4, GOLD_Y + 0.4, 1.4), r=(0.0006, 0.0015), seed=12,
          drift=(0.01, 0.01, 0.02), end=LEN)

else:  # 3D: head-on pull back on the back wall of boxes -> 7 x 4 grid at the end (T3)
    tgt = (-0.13, ROOM_Y0 + ROOM_LEN + 0.2, 0.25 + 7 * 0.19)
    cam = camera('Cam3D', lens=50, fstop=4.0)
    foc = empty('Focus3D', tgt)
    cam.data.dof.focus_object = foc
    dist_end = 0.91 / math.tan(math.atan(18 / 50))
    cam_path(cam, [(1, (tgt[0] + 0.02, tgt[1] - 0.42, tgt[2] + 0.02), tgt, 0.03),
                   (LEN - 6, (tgt[0], tgt[1] - dist_end * 0.985, tgt[2]), tgt, 0.0),
                   (LEN, (tgt[0], tgt[1] - dist_end, tgt[2]), tgt, 0.0)])
    for fc in fcurves(cam):
        for kp in fc.keyframe_points:
            kp.interpolation = 'EXPO'
            kp.easing = 'EASE_OUT'
    light('AREA', 'Face3D', (0.0, tgt[1] - 2.2, 2.6), energy=40, color=kelvin(3100), size=1.5, target=tgt)

finish(SHOT)
