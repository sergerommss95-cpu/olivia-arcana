"""ACT I — THE COMBINATION. Shots 1A (dial), 1B (wheel pack aligns), 1C (fence drops, bolt slams).

python3 tools/rb.py shots/act1_lock.py -- --shot 1A --stills 10,30 --pct 50
Frames are local to the shot and include 6-frame handles (cut = frames 7..N-6).
"""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from common import *
from lock import *

SHOT = arg('--shot', '1A')
H = 6  # handle frames
LEN = {'1A': 48, '1B': 36, '1C': 36}[SHOT] + 2 * H

sc = reset()
setup_render(1, LEN, samples=40, look='Medium High Contrast')
world_color((0.0015, 0.0019, 0.0024))
B = H + 1                 # first cut frame
BEAT = 12


def haze(loc, size, density=0.03, color=(0.75, 0.82, 0.9)):
    return volume_box('Haze', loc, size, mat_volume('HazeM', density=density, color=color, anisotropy=0.55,
                                                     noise_scale=1.4, contrast=(0.35, 0.75)))


if SHOT == '1A':
    root = empty('LockRoot')
    parts = build_dial(root)
    dial = parts['dial']
    # dial motion: creep, whip ~1.2 turns clockwise on beat 2, hard stop on 40 with a bounce, one tick on beat 4
    T = lambda v: 2 * math.pi * v / 100.0
    key(dial, 'rotation_euler', [(1, T(62)), (B + 14, T(60.5))], index=2, interp='LINEAR')
    key(dial, 'rotation_euler', [(B + 14, T(60.5)), (B + 23, T(40) - 2 * math.pi + T(-0.9))], index=2, interp='BEZIER')
    key(dial, 'rotation_euler', [(B + 26, T(40.35) - 2 * math.pi), (B + 29, T(40) - 2 * math.pi),
                                 (B + 3 * BEAT + 2, T(40) - 2 * math.pi), (B + 3 * BEAT + 4, T(41.1) - 2 * math.pi),
                                 (B + 3 * BEAT + 6, T(41) - 2 * math.pi), (LEN, T(41) - 2 * math.pi)], index=2)
    # camera: three-quarter front, numerals at 12 o'clock in focus, knob edge as a soft foreground occluder
    cam = camera('Cam1A', lens=65, fstop=0.6, ratio=1.6)
    foc = empty('Focus1A', (0.0, 0.72, 0.33))
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, (0.30, -0.55, 3.05), (0.02, 0.74, 0.32), 0.09),
                   (LEN, (0.20, -0.25, 2.62), (0.0, 0.78, 0.32), 0.05)], interp='BEZIER')
    shake(cam, 0.002, 0.001, scale=14, seed=3)
    # light sweep: thin warm strip at a grazing angle, travelling left -> right across the face
    aim = empty('SweepAim', (0, 0.4, 0.3))
    sweep = light('AREA', 'Sweep', energy=26, color=kelvin(3100), size=0.04, size_y=2.2, shape='RECTANGLE')
    key(sweep, 'location', [(1, (-3.4, 1.4, 1.1)), (B + 30, (1.4, 1.6, 1.3)), (LEN, (2.6, 1.6, 1.3))])
    track_to(sweep, aim)
    key(sweep.data, 'energy', [(1, 0.0), (B + 3, 26.0), (LEN, 20.0)])
    # cool rim from behind the top rim (knurl edges), dim cool fill, warm kick on the medallion
    light('AREA', 'Rim', (0.3, 3.2, 1.0), energy=40, color=(0.42, 0.66, 1.0), size=1.0, target=(0, 0.5, 0.3))
    light('AREA', 'Top', (0.0, 2.2, 3.4), energy=5, color=kelvin(3600), size=1.0, target=(0, 0.7, 0.3))
    light('AREA', 'Fill', (3.0, -2.5, 3.5), energy=2.5, color=(0.5, 0.65, 0.9), size=2.0, target=(0, 0, 0))
    light('SPOT', 'Kick', (-0.8, 1.6, 2.6), energy=22, color=kelvin(2800), spot=22, blend=0.9, radius=0.2, target=(0, 0.05, 0.65))
    motes('Motes', 220, (-1.2, -0.6, 0.5), (1.2, 1.4, 2.4), r=(0.0015, 0.004), seed=11, drift=(0.05, 0.02, 0.06), start=1, end=LEN)

elif SHOT in ('1B', '1C'):
    root = empty('PackRoot')
    root.rotation_euler = (math.pi / 2, 0, 0)     # local +Y (gates) -> world up, local +Z (front) -> world -Y
    pk = build_wheel_pack(root, n=3, spacing=0.30)
    if arg('--debuglight'):
        light('AREA', 'Debug', (2, -4, 4), energy=600, size=4, target=(0, 0, 0.5))
    wheels = pk['wheels']
    # gate angle in local frame is +Y (pi/2). Wheel i starts with its gate offset, rotates to align (offset 0)
    if SHOT == '1B':
        offs = [(1.9, B + 0), (-2.6, B + BEAT), (3.4, B + 2 * BEAT)]  # (start offset rad, align frame)
        for (off, fa), pv in zip(offs, wheels):
            key(pv, 'rotation_euler', [(1, off + (0.35 if off > 0 else -0.35)), (fa, 0.012 * (1 if off > 0 else -1)),
                                      (fa + 3, 0.0), (LEN, 0.0)], index=2)
            for fc in fcurves(pv):
                for kp in fc.keyframe_points:
                    if abs(kp.co.x - fa) < 0.1:
                        kp.interpolation = 'BACK'
                        kp.easing = 'EASE_OUT'
        # camera: upper-left-front, lateral dolly back along the stack while focus racks wheel 1 -> 3
        cam = camera('Cam1B', lens=70, fstop=0.5)
        foc = empty('Focus1B', (0, -0.05, 1.0))
        key(foc, 'location', [(1, (0, -0.05, 1.0)), (B + BEAT, (0, 0.3, 1.0)), (LEN, (0, 0.62, 1.0))])
        cam.data.dof.focus_object = foc
        cam_path(cam, [(1, (1.75, -1.15, 1.85), (0.0, 0.0, 0.92), 0.06),
                       (LEN, (1.85, -0.25, 1.75), (0.0, 0.55, 0.92), 0.03)])
        shake(cam, 0.003, 0.0015, scale=12, seed=5)
    else:  # 1C: fence drops into the aligned gates, bolt slams back, camera swings round to the spindle axis
        for pv in wheels:
            pv.rotation_euler.z = 0.0
        lev = pk['lever']
        key(lev, 'location', [(1, (0, 0.0, 0)), (B + 3, (0, 0.0, 0)), (B + 5, (0, -0.13, 0)), (B + 6, (0, -0.118, 0)),
                              (B + 7, (0, -0.13, 0)), (LEN, (0, -0.13, 0))])
        bolt = pk['bolt']
        x0 = bolt.location.x
        key(bolt, 'location', [(1, (x0, 1.05, -0.05)), (B + BEAT, (x0, 1.05, -0.05)), (B + BEAT + 4, (x0 - 1.25, 1.05, -0.05)),
                               (B + BEAT + 5, (x0 - 1.2, 1.05, -0.05)), (LEN, (x0 - 1.2, 1.05, -0.05))])
        key(pk['cam'], 'rotation_euler', [(B + BEAT - 2, 0.0), (B + BEAT + 4, -0.35), (LEN, -0.35)], index=2)
        cam = camera('Cam1C', lens=55, fstop=0.6)
        foc = empty('Focus1C', (0, 0.1, 1.05))
        key(foc, 'location', [(1, (0, 0.1, 1.05)), (B + BEAT, (-1.6, 0.0, 1.05)), (LEN, (-3.6, 0.0, 1.05))])
        cam.data.dof.focus_object = foc
        # macro on the fence dropping into the gates, then whip-pan left with the bolt (motion-blur smear out)
        cam_path(cam, [(1, (1.25, -1.05, 1.62), (0.0, 0.25, 1.0), 0.04),
                       (B + BEAT, (0.9, -1.25, 1.66), (-0.8, 0.15, 1.02), 0.03),
                       (B + BEAT + 6, (0.2, -1.4, 1.6), (-2.6, 0.0, 1.0), -0.05),
                       (LEN, (-0.4, -1.3, 1.55), (-6.0, -0.4, 1.0), -0.25)])
        for fc in fcurves(cam):
            for kp in fc.keyframe_points:
                if kp.co.x > B + BEAT + 1:
                    kp.interpolation = 'QUAD'
                    kp.easing = 'EASE_IN'
        shake(cam, 0.003, 0.0015, scale=10, seed=7)
        shake(cam, 0.012, 0.006, scale=2, seed=8, start=B + 4, end=B + 9)
    # light: warm key from upper left/behind, cool rim from back right, low cool bounce from the front
    light('AREA', 'Key', (-2.0, 1.4, 3.4), energy=120, color=kelvin(3000), size=0.6, size_y=2.4, shape='RECTANGLE',
          target=(0, 0.3, 0.9))
    light('AREA', 'Rim', (2.8, 2.4, 1.6), energy=80, color=(0.4, 0.65, 1.0), size=1.5, target=(0, 0.3, 0.8))
    light('AREA', 'Face', (2.6, -2.2, 0.6), energy=35, color=kelvin(2600), size=1.2, target=(0, 0.2, 0.5))
    light('AREA', 'Bounce', (0.5, -3.0, 1.0), energy=3, color=(0.55, 0.7, 1.0), size=3.0, target=(0, 0, 0.5))
    motes('Motes', 200, (-1.6, -1.2, -0.4), (1.8, 1.2, 2.2), r=(0.002, 0.005), seed=17, drift=(0.05, 0.02, 0.08), start=1, end=LEN)

finish(SHOT)
