"""ACT II — THE DOOR. 2A (whip-in + reveal, hand wheel spins), 2B (radial bolts retract on 4 beats),
2C (door swings open, light + haze pour out, camera pushes through into the vault).

python3 tools/rb.py shots/act2_door.py -- --shot 2A --stills 7,40 --pct 50
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from common import *
from vault import *

SHOT = arg('--shot', '2A')
H = 6
LEN = {'2A': 48, '2B': 36, '2C': 48}[SHOT] + 2 * H
B = H + 1
BEAT = 12

sc = reset()
setup_render(1, LEN, samples=36, look='Medium High Contrast', vol_step=6.0)
world_color((0.002, 0.0024, 0.003))
M = mats()
door = build_door(M)
wall = build_frame_and_wall(M)
ante = build_antechamber(M)
if arg('--debuglight'):
    light('AREA', 'Debug', (2, -7, 5), energy=3000, size=6, target=(0, 0, 1.4))

GROUPS = [[0, 3, 6, 9], [1, 4, 7, 10], [2, 5, 8, 11]]   # 3 beats x 4 bolts (90 deg apart)


def retract(bolts, idx, f0, dur=4):
    slide, a = bolts[idx]
    key(slide, 'location', [(1, (0, 0, 0)), (f0, (0, 0, 0)), (f0 + dur, (-0.36, 0, 0)), (f0 + dur + 1, (-0.345, 0, 0)),
                            (f0 + dur + 2, (-0.35, 0, 0)), (LEN, (-0.35, 0, 0))])


if SHOT == '2A':
    wheel = door['wheel']
    key(wheel, 'rotation_euler', [(1, 0.0), (B + 14, 0.0), (LEN, -2 * math.pi * 1.25)], index=1)
    cam = camera('Cam2A', lens=50, fstop=2.0)
    foc = empty('Focus2A', (0, -0.3, 1.6))
    key(foc, 'location', [(1, (0, -0.3, 1.6)), (LEN, (0, -0.1, 1.6))])
    cam.data.dof.focus_object = foc
    # whip arrives (fast yaw settling onto the hub), then a long pull back to reveal the whole door
    cam_path(cam, [(1, (0.25, -1.05, 1.62), (-1.6, -0.2, 1.5), 0.05),
                   (B + 2, (0.05, -1.0, 1.6), (0.0, -0.3, 1.6), 0.0),
                   (B + 8, (0.03, -1.15, 1.6), (0.0, -0.3, 1.6), 0.0),
                   (LEN, (0.9, -7.6, 1.15), (0.0, 0.0, 1.55), 0.015)])
    for fc in fcurves(cam):
        kps = fc.keyframe_points
        for kp in kps:
            if kp.co.x < B + 3:
                kp.interpolation = 'QUAD'
                kp.easing = 'EASE_OUT'
            elif kp.co.x >= B + 8:
                kp.interpolation = 'EXPO'
                kp.easing = 'EASE_OUT'
    key(cam.data, 'lens', [(1, 50.0), (B + 8, 50.0), (LEN, 30.0)])
    shake(cam, 0.004, 0.002, scale=10, seed=21)
    light('AREA', 'Practical', (-2.6, -2.2, 2.6), energy=80, color=kelvin(3200), size=0.4, target=(0, 0, 1.6))
    light('AREA', 'FaceFill', (0.6, -6.0, 1.5), energy=25, color=(0.6, 0.75, 1.0), size=3.0, target=(0, 0, 1.6))
    motes('Motes', 300, (-2.5, -4.0, 0.3), (2.5, -0.3, 3.2), r=(0.0015, 0.004), seed=3, drift=(0.05, 0.0, 0.08), end=LEN)

elif SHOT == '2B':
    for k, grp in enumerate(GROUPS):
        for idx in grp:
            retract(door['bolts'], idx, B + k * BEAT)
    cam = camera('Cam2B', lens=45, fstop=1.8)
    foc = empty('Focus2B', (-1.25, -0.12, 0.85))
    key(foc, 'location', [(1, (-1.3, -0.12, 0.9)), (LEN, (-0.75, -0.12, 0.35))])
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, (-2.4, -1.15, 0.55), (-1.1, -0.05, 0.85), -0.12),
                   (LEN, (-1.9, -1.35, 0.3), (-0.6, -0.05, 0.55), -0.08)])
    shake(cam, 0.003, 0.0015, scale=10, seed=22)
    for k in range(3):
        shake(cam, 0.006, 0.004, scale=1.5, seed=30 + k, start=B + k * BEAT + 2, end=B + k * BEAT + 7)
    light('AREA', 'Practical', (-2.8, -1.5, 2.0), energy=70, color=kelvin(3200), size=0.3, target=(-1.0, 0, 0.8))
    light('AREA', 'Rim', (0.5, -1.5, -0.2), energy=20, color=(0.55, 0.75, 1.0), size=1.0, target=(-1.0, 0, 0.6))
    motes('Motes', 200, (-2.4, -1.4, 0.1), (-0.4, -0.2, 1.4), r=(0.001, 0.003), seed=5, drift=(0.03, 0.0, 0.05), end=LEN)

else:  # 2C
    for grp in GROUPS:
        for idx in grp:
            slide, a = door['bolts'][idx]
            slide.location = (-0.35, 0, 0)
    room = build_vault_room(M, walls=True, back=True, gold=True, lights=True, cols=20, rows=14)
    hinge = door['hinge']
    key(hinge, 'rotation_euler', [(1, 0.0), (B + 2, 0.0), (B + 6, math.radians(3)), (LEN - 4, math.radians(78)),
                                  (LEN, math.radians(80))], index=2)
    # warm spill light inside the bore, aimed out (occluded by the door until it opens)
    light('AREA', 'Spill', (0.0, 1.0, 1.6), (math.radians(-90), 0, 0), energy=260, color=kelvin(2700), size=2.4, coll=None)
    haze = mat_volume('Haze2C', density=0.022, color=(0.85, 0.82, 0.78), anisotropy=0.65, noise_scale=1.0, contrast=(0.3, 0.8))
    volume_box('HazeBox', (0.0, -2.2, 1.7), (5.0, 4.6, 3.4), haze)
    cam = camera('Cam2C', lens=32, fstop=2.8)
    foc = empty('Focus2C', (0, 0, 1.6))
    key(foc, 'location', [(1, (0, 0, 1.6)), (LEN - 14, (-0.3, 0.0, 1.5)), (LEN, (0, 5.0, 1.2))])
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, (-0.9, -5.6, 1.45), (0.0, 0.0, 1.6), 0.0),
                   (B + 24, (-0.75, -3.0, 1.5), (-0.2, 0.5, 1.55), 0.01),
                   (LEN - 8, (-0.4, -0.4, 1.5), (0.0, 4.0, 1.4), -0.03),
                   (LEN, (-0.1, 2.0, 1.45), (0.0, 8.0, 1.25), -0.05)])
    for fc in fcurves(cam):
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
    shake(cam, 0.006, 0.003, scale=9, seed=23)
    light('AREA', 'Practical', (-2.6, -2.2, 2.6), energy=50, color=kelvin(3200), size=0.4, target=(0, 0, 1.6))

finish(SHOT)
