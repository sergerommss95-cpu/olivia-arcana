"""ACT V — THE ROSETTE + TITLE. Shots 5A (note -> rosette), 5A2 (dial clicks to 0), 5B (title card).

python3 tools/rb.py shots/act5_title.py -- --shot 5A --stills 7,30 --pct 50 --samples 16
    --debuglight   flat bright overhead light, no DOF (layout check)

Frames are local to the shot and include 6-frame handles (cut = frames 7..N-6).

5A  (60 frames, cut 7..54). The banknote lies flat on an engine-turned steel plate, filling the frame
    (camera orthogonal, note front up, 'TUMBLER RESERVE NOTE' upright, hero rosette left). From f8 the
    camera pushes in (log-zoom, ease in/out) onto the hero rosette while the note turns clockwise about
    the rosette centre. From ARRIVE (f31) the rosette is centred, its rim filling FILL (80%) of frame
    height, turning clockwise at OMEGA, size creeping +CREEP per frame.
5A2 (36 frames, cut 7..30) — the combination dial head-on (lock.build_dial), for the T5 dissolve.
    5A2 local frame f  ==  5A local frame f + 24 (5A2 f7..f30 overlay 5A f31..f54).
    The dial's knurled rim (r = 1 dial radius) has exactly the rosette's on-screen size and the same
    clockwise speed and creep through f18; then it accelerates and clicks onto 0 at the index mark on f19
    (= 5A f43, a beat), overshoots a hair and settles by f22.
5B  (72 frames, cut 7..66). Title TUMBLER in machined steel over slowly turning brass tumbler wheels; a warm
    light sweep crosses the letters f8..f46; the light dims from f50 (edit does the final fade).
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from common import *
from lock import build_dial, build_wheel, mat_medallion
from note import *
from title import *

SHOT = arg('--shot', '5A')
H = 6
LEN = {'5A': 48, '5A2': 24, '5B': 60}[SHOT] + 2 * H
DEBUG = bool(arg('--debuglight'))
B = H + 1                  # first cut frame
BEAT = 12

# shared by 5A and 5A2 (the dissolve)
OMEGA = math.radians(-1.6)     # rad/frame; negative = clockwise as seen by the camera
ARRIVE = 33                    # 5A frame where the push lands (rosette rim = FILL of frame height)
FILL = 0.8
CREEP = 0.0025                 # relative size growth per frame after ARRIVE
OFFSET_5A2 = 24                # 5A2 frame f <-> 5A frame f + OFFSET_5A2
CLICK = 19                     # 5A2 frame where the dial lands on 0 (= 5A f43, beat 3 of the shot)
SENSOR = 36.0


def size_k(f5a):
    return 1.0 + CREEP * max(0.0, f5a - ARRIVE)


def dist_for_height(h, lens):
    """Camera distance at which the frame height is h (horizontal sensor fit, 2.39:1 frame)."""
    w = h * RES[0] / RES[1]
    return w * lens / SENSOR


sc = reset()
setup_render(1, LEN, samples=24, look='Medium High Contrast')
world_color((0.0012, 0.0014, 0.0018))


def debug_light(loc, target, energy):
    if DEBUG:
        light('AREA', 'Debug', loc, energy=energy, size=4.0, target=target)


def per_frame(obj, path, fn, frames, index=None):
    """Key obj.path from fn(frame) on every frame (linear between keys) - exact control of the motion."""
    for f in frames:
        v = fn(f)
        if index is None:
            setattr(obj, path, v)
            obj.keyframe_insert(path, frame=f)
        else:
            getattr(obj, path)[index] = v
            obj.keyframe_insert(path, index=index, frame=f)
    for fc in fcurves(obj):
        if fc.data_path == path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'
            fc.extrapolation = 'LINEAR'


# ============================================================================= 5A
if SHOT == '5A':
    sc.cycles.samples = 20
    hx, hy = hero_xy()
    LENS = 100.0
    PUSH0, PUSH1 = B, ARRIVE
    sc.render.motion_blur_shutter = 0.4
    D0 = W * 0.998 * LENS / SENSOR                       # note width fills the frame width
    D1 = dist_for_height(2 * HERO_RADIUS_M / FILL, LENS)  # rosette rim = FILL of frame height

    def warp(x, y):
        """Paper is never flat: a soft old centre fold + a slight curl toward the short ends (metres)."""
        fold = 0.00045 * (math.sqrt(x * x + 0.004 ** 2) - 0.004) / 0.074
        curl = 0.00035 * (x / 0.078) ** 4 + 0.00012 * (y / 0.033) ** 2
        ripple = 0.00006 * math.sin(x * 70 + 1.3) * math.cos(y * 55)
        return 0.00008 + fold + curl + ripple

    note = conform(make_banknote('Note', 'hi', xs=72, ys=30), warp)
    pivot = empty('NotePivot', (hx, hy, 0.0))
    parent(note, pivot, keep=False)
    note.location = (-hx, -hy, 0.0)

    # note rotation: clockwise, angular speed eases up from 0 (f8) to OMEGA (f24), constant afterwards
    def omega_5a(f):
        return OMEGA * ease((f - PUSH0) / 15.0)

    def theta_5a(f):
        th, t, dt = 0.0, PUSH0, 0.05
        while t < f:
            th += omega_5a(t + dt / 2) * dt
            t += dt
        return th
    per_frame(pivot, 'rotation_euler', theta_5a, range(1, LEN + 1), index=2)

    # the steel it lies on: dark engine-turned plate (vault door)
    plate = box('Plate', (0.7, 0.45, 0.01), (hx, 0.0, -0.0051), mat=mat_perlage(
        'PlateTurned', base=(0.30, 0.30, 0.31), rough=(0.2, 0.3), cell=0.011, bump=1.0, bump_dist=0.0004,
        dark=0.6))

    # camera: orthogonal (looking straight down), push from full note to the rosette
    cam = camera('Cam5A', (0, 0, D0), lens=LENS, fstop=8.0, clip=(0.002, 5.0), ratio=1.6)
    cam.rotation_euler = (0, 0, 0)
    foc = empty('Focus5A', (hx, hy, warp(hx, hy)))
    cam.data.dof.focus_object = foc
    if DEBUG:
        cam.data.dof.use_dof = False

    def s_push(f):
        return ease((f - PUSH0) / (PUSH1 - PUSH0))

    def cam_loc(f):
        s = s_push(f)
        if f <= PUSH1:
            d = D0 * (D1 / D0) ** s
        else:
            d = D1 / size_k(f)
        return (hx * s, hy * s, warp(hx, hy) + d)
    per_frame(cam, 'location', cam_loc, range(1, LEN + 1))
    key_data(cam.data.dof, cam, 'aperture_fstop', [(1, 8.0), (PUSH0, 8.0), (PUSH1, 3.2), (LEN, 3.0)])

    # light: warm grazing strip from screen upper-left (fixed in the world: the turning note rakes through it)
    def around(az, el, dist):
        a, e = math.radians(az), math.radians(el)
        return (hx + dist * math.cos(e) * math.cos(a), hy + dist * math.cos(e) * math.sin(a), dist * math.sin(e))
    # key: a soft warm pool on the rosette, the rest of the note falls off; rake: a very low strip for the relief
    # the key irises down from a wide pool (whole left of the note) to a tight pool around the rosette
    key_l = light('SPOT', 'Key', around(158, 40, 0.30), energy=3.0, color=kelvin(4000), spot=26, blend=1.0,
                  radius=0.01, target=(hx, hy, 0.0))
    key_data(key_l.data, key_l, 'spot_size', [(1, math.radians(26)), (PUSH0, math.radians(26)),
                                              (PUSH1, math.radians(12)), (LEN, math.radians(11))])
    rake = light('SPOT', 'Rake', around(152, 7, 0.30), energy=2.2, color=kelvin(3300), spot=14, blend=1.0,
                 radius=0.004, target=(hx, hy, 0.0))
    light('AREA', 'Fill', around(-20, 48, 0.35), energy=0.06, color=(0.55, 0.7, 1.0), size=0.25, target=(hx, hy, 0))
    light('AREA', 'Edge', around(70, 14, 0.35), energy=0.25, color=(0.5, 0.68, 1.0), size=0.2, size_y=0.02,
          shape='RECTANGLE', target=(hx, hy, 0))
    motes('Motes', 140, (hx - 0.05, hy - 0.025, 0.006), (hx + 0.05, hy + 0.025, 0.06), r=(0.00003, 0.00008), seed=21,
          drift=(0.004, 0.002, 0.003), start=1, end=LEN)
    debug_light((hx, hy, 0.6), (hx, hy, 0), 30)

# ============================================================================= 5A2
elif SHOT == '5A2':
    sc.cycles.samples = 24
    LENS = 70.0
    root = empty('LockRoot')
    parts = build_dial(root, mats={'plate': mat_perlage('DoorPlate', base=(0.48, 0.49, 0.51), rough=(0.14, 0.32),
                                                         cell=0.24, bump=1.0, bump_dist=0.02)})
    dial = parts['dial']
    T = 2 * math.pi / 100.0   # one dial tick

    def omega_d(f):            # matched speed, then a decisive last turn into 0
        return OMEGA * (1.0 + 1.3 * ease((f - 15.0) / 4.0, 'in'))

    def theta_d(f):
        if f >= CLICK:         # detent: overshoot a hair past 0, spring back, settle
            return {CLICK: 0.0, CLICK + 1: -0.55 * T, CLICK + 2: 0.12 * T}.get(int(f), 0.0)
        th, t, dt = 0.0, float(CLICK), 0.05
        while t > f:
            th -= omega_d(t - dt / 2) * dt
            t -= dt
        return th
    per_frame(dial, 'rotation_euler', theta_d, range(1, LEN + 1), index=2)
    # camera head-on; rim r=1 fills FILL of frame height at the dial face plane, same creep as 5A
    FACE_Z = 0.32
    D1 = dist_for_height(2.0 / FILL, LENS)
    cam = camera('Cam5A2', (0, 0, FACE_Z + D1), lens=LENS, fstop=0.16, clip=(0.05, 100.0), ratio=1.6)
    cam.rotation_euler = (0, 0, 0)
    foc = empty('Focus5A2', (0, 0.6, FACE_Z))
    cam.data.dof.focus_object = foc
    if DEBUG:
        cam.data.dof.use_dof = False
    per_frame(cam, 'location', lambda f: (0, 0, FACE_Z + D1 / size_k(f + OFFSET_5A2)), range(1, LEN + 1))
    # Act I lighting language: warm grazing sweep from the left, cool rim from the top, warm kick on the medallion
    aim = empty('SweepAim', (0, 0.3, 0.3))
    sweep = light('AREA', 'Sweep', energy=24, color=kelvin(3100), size=2.4, size_y=0.05, shape='RECTANGLE')
    key(sweep, 'location', [(1, (-3.3, 0.6, 1.0)), (LEN, (-3.0, 1.4, 1.1))])
    track_to(sweep, aim)
    light('AREA', 'Rim', (0.2, 3.3, 1.0), energy=36, color=(0.42, 0.66, 1.0), size=1.0, target=(0, 0.5, 0.3))
    light('AREA', 'Fill', (3.0, -2.5, 3.5), energy=2.0, color=(0.5, 0.65, 0.9), size=2.0, target=(0, 0, 0))
    light('SPOT', 'Kick', (-0.8, 1.6, 2.6), energy=18, color=kelvin(2800), spot=22, blend=0.9, radius=0.2,
          target=(0, 0.05, 0.65))
    motes('Motes', 160, (-1.6, -1.0, 0.5), (1.6, 1.0, 3.0), r=(0.002, 0.005), seed=31, drift=(0.04, 0.02, 0.05),
          start=1, end=LEN)
    debug_light((0, -1, 8), (0, 0, 0), 900)

# ============================================================================= 5B
elif SHOT == '5B':
    sc.cycles.samples = 24
    WORD_W = 2.7                     # word width (m); camera frame is ~4.6 m wide at the letters
    steel = mat_letter_steel('LetterSteel')
    txt = title_text('TUMBLER', 'Title', size=1.0, extrude=0.07, bevel=0.016, offset=0.012, spacing=1.18)
    set_mat(txt, steel)
    bb = [Vector(c) for c in txt.bound_box]
    wid = max(c.x for c in bb) - min(c.x for c in bb)
    sca = WORD_W / wid
    txt.scale = (sca, sca, sca)
    txt.rotation_euler = (math.pi / 2, 0, 0)     # text faces -Y (toward the camera)
    txt.location = (0, 0, 0.0)

    # tumbler wheels behind (brass, out of focus, turning slowly in alternating directions)
    wroot = empty('WheelRoot', (0.9, 4.6, -0.55))
    wroot.rotation_euler = (math.radians(90 - 32), 0, math.radians(-24))   # wheel axis toward camera, tilted
    wroot.scale = (2.3, 2.3, 2.3)
    brass = [mat_brass(f'TBrass{i}', base=(0.80 - 0.05 * i, 0.55 - 0.04 * i, 0.24), rough=(0.16, 0.38), scale=3.0)
             for i in range(3)]
    speeds = (math.radians(0.55), math.radians(-0.4), math.radians(0.75))
    for i in range(3):
        pv = empty(f'WPivot{i}', (0, 0, -i * 0.30))
        parent(pv, wroot, keep=False)
        w = build_wheel(f'TWheel{i}', gate_ang=math.pi / 2 + 1.1 * i, mat=brass[i])
        parent(w, pv, keep=False)
        key(pv, 'rotation_euler', [(1, 0.7 * i), (LEN, 0.7 * i + speeds[i] * (LEN - 1))], index=2, interp='LINEAR')
    sp = prim('cyl', 'TSpindle', (0, 0, -0.3), seg=48, r=0.155, depth=1.4)
    set_mat(sp, mat_metal('TSpindleSteel', base=(0.45, 0.46, 0.48), rough=(0.18, 0.34), scale=1.5))
    parent(sp, wroot, keep=False)
    # second, smaller wheel group lower left, further back
    wroot2 = empty('WheelRoot2', (-4.2, 7.5, 0.9))
    wroot2.rotation_euler = (math.radians(90 + 14), 0, math.radians(38))
    wroot2.scale = (1.8, 1.8, 1.8)
    for i in range(2):
        pv = empty(f'WPivotB{i}', (0, 0, -i * 0.30))
        parent(pv, wroot2, keep=False)
        w = build_wheel(f'TWheelB{i}', gate_ang=0.4 + 2.0 * i, mat=brass[2 - i])
        parent(w, pv, keep=False)
        key(pv, 'rotation_euler', [(1, 1.3 * i), (LEN, 1.3 * i - math.radians(0.5) * (LEN - 1))], index=2,
            interp='LINEAR')

    # camera: low, straight on, slow push; focus on the letters, wheels fall off
    cam = camera('Cam5B', lens=55, fstop=0.35, ratio=1.6, clip=(0.05, 100))
    foc = empty('Focus5B', (0, -0.03, 0.0))
    cam.data.dof.focus_object = foc
    if DEBUG:
        cam.data.dof.use_dof = False
    cam_path(cam, [(1, (0.05, -7.25, 0.18), (0.0, 0.0, 0.02), 0.0),
                   (LEN, (-0.05, -6.75, 0.10), (0.0, 0.0, 0.02), 0.0)], interp='BEZIER')
    shake(cam, 0.002, 0.0006, scale=18, seed=9)

    # light: warm sweep strip (behind the camera, reflected in the letter faces) travelling left -> right
    sweep = light('AREA', 'Sweep', energy=0.0, color=kelvin(3300), size=0.35, size_y=5.0, shape='RECTANGLE')
    sweep.rotation_euler = (math.pi / 2, 0, 0)      # faces +Y (toward the letters)
    key(sweep, 'location', [(1, (-7.5, -7.0, 0.4)), (B + 1, (-6.5, -7.0, 0.4)), (46, (6.5, -7.0, 0.4)),
                            (LEN, (8.0, -7.0, 0.4))])
    key(sweep.data, 'energy', [(1, 0.0), (B + 2, 300.0), (40, 300.0), (54, 60.0), (LEN, 0.0)])
    # cool top rim on the upper chamfers, warm low side kick on the left chamfers
    rim = light('AREA', 'Rim', (0.0, 1.2, 2.6), energy=60, color=(0.45, 0.65, 1.0), size=5.0, size_y=0.3,
                shape='RECTANGLE', target=(0, 0, 0.3))
    key(rim.data, 'energy', [(1, 45.0), (50, 60.0), (LEN, 20.0)])
    kick = light('AREA', 'Kick', (-4.5, -1.0, -0.6), energy=40, color=kelvin(2900), size=0.4, size_y=2.0,
                 shape='RECTANGLE', target=(0, 0, 0))
    key(kick.data, 'energy', [(1, 30.0), (50, 40.0), (LEN, 10.0)])
    # wheels: warm grazing from the right + a cool edge
    wl = light('AREA', 'WheelKey', (6.0, 4.0, 2.2), energy=260, color=kelvin(2800), size=0.6, size_y=3.0,
               shape='RECTANGLE', target=(0.9, 4.6, -0.5))
    key(wl.data, 'energy', [(1, 220.0), (50, 260.0), (LEN, 80.0)])
    wl2 = light('AREA', 'WheelRim', (-1.0, 9.5, 3.5), energy=200, color=(0.45, 0.62, 1.0), size=2.0,
                target=(0.5, 4.6, -0.5))
    key(wl2.data, 'energy', [(1, 160.0), (50, 200.0), (LEN, 60.0)])
    motes('Motes', 220, (-3.0, -1.5, -1.6), (3.0, 3.5, 1.8), r=(0.004, 0.01), seed=41, drift=(0.15, 0.05, 0.12),
          start=1, end=LEN)
    debug_light((0, -5, 3), (0, 0, 0), 1500)

finish(SHOT)
