"""FALSE FLOOR set S1 — the vault door + antechamber, Level -2 (illustrative reconstruction). Owner A1_door.

Shots (ids/frames from script/SHOTS_v2.json; 3D frames include 6-frame handles each side, the cut uses 7..N-6):
  S00 3D 252  near-black, hairline of warm light round the ajar door; slow push in (mirror of S52's last frame)
  S01 3D 252  reveal: close on the open door's chrome edge bolts, pull back to the door standing wide open on the vault
  S10 3D 252  POV gliding down the stairwell to Level -2; the grate's lock releases and the gate swings in
  S14 3D 252  the door head-on, shut, before the heist, cold light; slow push
  S20 3DS 1   the shut door at night (end state of the light shift), bars of the grate thrown across it; 2560x1440
  S25 3D 252  the dial turns to four numbers, the key slides in and turns, the handle drops, the door swings
  S32 3D 162  Monday light, the open door from the CCTV corner (callback to S01)
  S52 3D 252  the door swings shut to a hairline of warm light; camera ends exactly on S00's first frame

python3 films/tumbler/tools/rb.py films/false_floor/shots/door.py -- --shot S14 --stills 7,126,246 --pct 30 --samples 12
Flags: --debuglight (flat layout light), --nohaze, --novault (fast layout).
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
import door_ff as D

SHOT = arg('--shot', 'S14')
FRAMES = {'S00': 252, 'S01': 252, 'S10': 252, 'S14': 252, 'S20': 1, 'S25': 252, 'S32': 162, 'S52': 252}
N = FRAMES[SHOT]
H = 6                       # handles
A, B = H + 1, N - H         # first / last frame used by the cut
STILL = SHOT == 'S20'
R = math.radians

sc = reset()
setup_render(1, N, res=(2560, 1440) if STILL else RES_FINAL, samples=96 if STILL else 40, look='Medium High Contrast',
             clamp=4.0, vol_step=6.0, shutter=0.5)
world_color((0.0012, 0.0013, 0.0016))

need_vault = SHOT in ('S00', 'S01', 'S25', 'S32', 'S52') and not arg('--novault')
S = D.build_set(vault=need_vault, stair=True, grate=True, cctv=True, key=(SHOT == 'S25'))

# ---- door / grate states -----------------------------------------------------------------------------------------
AJAR = 2.0                  # S00/S52 hairline (degrees)
OPEN = 112.0                # wide open (S01/S32/start of S52)
door, grate = S['door'], S['grate']
D.set_bolts(S, extended=SHOT in ('S10', 'S14', 'S20', 'S25', 'S01', 'S32'))   # thrown bolts read best on the open door
D.set_door(S, {'S00': AJAR, 'S01': OPEN, 'S32': OPEN, 'S52': OPEN}.get(SHOT, 0.0))
grate.rotation_euler.z = {'S01': R(84), 'S32': R(84)}.get(SHOT, 0.0)
S['dial'].rotation_euler.z = R(-23.0)        # resting position of the wheel (an arbitrary number; no numerals shown)

# ---- camera helpers ----------------------------------------------------------------------------------------------
def make_cam(lens, fstop, focus_pts):
    cam = camera('Cam' + SHOT, lens=lens, fstop=fstop)
    foc = empty('Focus' + SHOT, focus_pts[0][1])
    if len(focus_pts) > 1:
        key(foc, 'location', focus_pts)
    cam.data.dof.focus_object = foc
    return cam


def ease_keys(o, path, pairs, interp='BEZIER'):
    key(o, path, pairs)
    for fc in fcurves(o):
        if fc.data_path == path:
            for kp in fc.keyframe_points:
                kp.interpolation = interp
                kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'


motes_box = None
haze_on = not arg('--nohaze')

# ---- shots -------------------------------------------------------------------------------------------------------
if SHOT in ('S00', 'S52'):
    # The two ends of the film, framed identically: low, near black, the door ajar, warm vault light escaping as a
    # hairline round the free edge and under the door; a whisper of cold light trickles down the stairs behind us.
    D.light_ante(S, 'dark')
    LV = D.light_vault(S, 'warm', leak=True, spill=70.0 if SHOT == 'S52' else 0.0)
    P0, T0 = (0.44, -2.95, 0.40), (0.30, 0.0, 0.50)       # S00 first frame == S52 last frame
    P1, T1 = (0.42, -2.10, 0.36), (0.31, 0.0, 0.48)
    cam = make_cam(35, 2.4, [(1, (0.5, -0.1, 0.45))])
    if SHOT == 'S00':
        cam_path(cam, [(1, P0, T0, 0.0), (A, P0, T0, 0.0), (N, P1, T1, 0.0)])
    else:
        cam_path(cam, [(1, P1, T1, 0.0), (B - 40, P0, T0, 0.0), (N, P0, T0, 0.0)])
        # the door: a beat of stillness, then 3 tons swing shut, decelerating into the hairline
        d0, d1 = 18, 196
        door.rotation_euler.z = -R(OPEN)
        door.keyframe_insert('rotation_euler', index=2, frame=1)
        door.keyframe_insert('rotation_euler', index=2, frame=d0)
        door.rotation_euler.z = -R(AJAR)
        door.keyframe_insert('rotation_euler', index=2, frame=d1)
        door.keyframe_insert('rotation_euler', index=2, frame=N)
        for fc in fcurves(door):
            for kp in fc.keyframe_points:
                kp.interpolation = 'SINE'
                kp.easing = 'EASE_IN_OUT'
        # the seam glow only exists once the door is almost home
        lk = LV['leak']
        for lt in lk['lights']:
            e = lt.data.energy
            key_data(lt.data, lt, 'energy', [(1, 0.0), (d1 - 14, 0.0), (d1 - 2, e)])
        g = lk['strength']
        key_socket(g, [(1, 0.0), (d1 - 14, 0.0), (d1 - 2, g.default_value)])
        sp = LV['spill']
        key_data(sp.data, sp, 'energy', [(1, 70.0), (d0 + 40, 70.0), (d1 - 8, 0.0)])
    shake(cam, 0.0015, 0.0008, scale=40, seed=3)
    motes_box = ((-0.9, -2.0, 0.05), (1.2, -0.15, 1.6))

elif SHOT == 'S01':
    # Reveal: start tight on the free edge of the open door (chrome bolts, 0.4 m of steel), pull back and around to show
    # the door standing wide open with the forced vault beyond. Warm vault light pours out; the antechamber is cold, low.
    D.light_ante(S, 'day', scale=0.45, on=('B', 'S'))
    D.light_vault(S, 'warm')
    cam = make_cam(32, 2.0, [(1, (-0.74, -1.40, 0.9)), (95, (-0.74, -1.40, 0.9)), (205, (-0.3, 0.35, 1.0))])
    cam_path(cam, [(1, (-0.57, -2.02, 0.66), (-0.80, -1.36, 1.16), 0.0),
                   (A, (-0.57, -2.03, 0.66), (-0.80, -1.36, 1.16), 0.0),
                   (N, (0.95, -3.45, 1.32), (-0.18, 0.25, 0.98), 0.0)])
    for fc in fcurves(cam):
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing = 'EASE_IN_OUT'
    shake(cam, 0.002, 0.001, scale=30, seed=11)
    motes_box = ((-1.5, -2.8, 0.05), (1.2, -0.2, 2.3))

elif SHOT == 'S10':
    # POV down the stair to Level -2: the grate at the foot, the door small and cold at the end of the room.
    D.light_ante(S, 'day')
    cam = make_cam(24, 4.0, [(1, (0.0, -3.8, 1.1))])
    cam_path(cam, [(1, (0.10, -8.95, 4.12), (0.0, -3.6, 1.05), 0.0),
                   (N, (0.04, -7.30, 3.07), (0.0, -3.4, 0.95), 0.0)])
    for fc in fcurves(cam):
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing = 'EASE_OUT'
    shake(cam, 0.004, 0.002, scale=24, seed=5)
    # remote release: the lock bolt snaps back, the leaf jolts on its latch, then swings slowly into the room
    gb = S['grate_bolt']
    key(gb, 'location', [(1, (0, 0, 0)), (128, (0, 0, 0)), (131, (0.062, 0, 0)), (N, (0.062, 0, 0))])
    key(grate, 'rotation_euler', [(1, 0.0), (132, 0.0), (135, R(2.2)), (139, R(1.4)), (150, R(3.0)), (234, R(52.0)),
                                  (N, R(54.0))], index=2)
    for fc in fcurves(grate):
        kps = fc.keyframe_points
        for kp in kps:
            kp.interpolation = 'BEZIER'
    motes_box = ((-0.7, -6.5, 0.6), (0.7, -3.9, 3.0))

elif SHOT == 'S14':
    # The door head-on: shut, cold, before the heist. Slow, centred push.
    D.light_ante(S, 'day')
    cam = make_cam(28, 5.6, [(1, (0.0, -0.13, 1.1))])
    cam_path(cam, [(1, (0.0, -3.62, 1.06), (0.0, 0.0, 1.13), 0.0), (N, (0.0, -3.22, 1.05), (0.0, 0.0, 1.13), 0.0)])
    linear(cam)
    shake(cam, 0.0015, 0.0007, scale=40, seed=14)
    motes_box = ((-1.6, -3.0, 0.1), (1.6, -0.3, 2.4))

elif SHOT == 'S20':
    # Night (end state of the light shift): battens dark; the only light falls down the stairwell through the grate and
    # lays its bars across the floor and the door. 2560x1440 still, composed with safe room for the edit's push.
    D.light_ante(S, 'night')
    cam = make_cam(30, 4.0, [(1, (0.1, -0.15, 1.0))])
    cam_path(cam, [(1, (0.55, -3.05, 0.92), (0.02, 0.0, 1.1), 0.0)])
    motes_box = ((-1.0, -2.8, 0.1), (1.3, -0.3, 2.3))

elif SHOT == 'S25':
    # The opening, told by the objects: wheel (four numbers, alternating direction), key slides in and turns, the
    # handle drops, the bolts draw back, the door swings out of the dark. Night state + one batten on.
    D.light_ante(S, 'night', on=('A',), scale=0.55, night=200.0)
    D.light_vault(S, 'off')
    dial = S['dial']
    seq = [(A, -23.0), (A + 6, -23.0), (A + 26, -23.0 - 400.0), (A + 30, -423.0), (A + 46, -423.0 + 290.0),
           (A + 50, -133.0), (A + 62, -133.0 - 170.0), (A + 66, -303.0), (A + 74, -303.0 + 64.0), (A + 84, -239.0)]
    key(dial, 'rotation_euler', [(1, R(-23.0))] + [(f, R(v)) for f, v in seq], index=2)
    for fc in fcurves(dial):
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing = 'EASE_IN_OUT'
    kr, kt = S['key_root'], S['key_turn']
    k0 = A + 88
    base = kr.location.copy()
    out = (base.x, base.y - 0.42, base.z)
    kr.location = out
    key(kr, 'location', [(1, out), (k0, out), (k0 + 26, base[:]), (N, base[:])])
    for o in [kr] + list(kr.children_recursive):      # the key only exists once it starts to move in
        o.hide_render = True
        o.keyframe_insert('hide_render', frame=k0 - 1)
        o.hide_render = False
        o.keyframe_insert('hide_render', frame=k0)
        for fc in fcurves(o):
            if fc.data_path == 'hide_render':
                for kp in fc.keyframe_points:
                    kp.interpolation = 'CONSTANT'
    key(kt, 'rotation_euler', [(1, 0.0), (k0 + 32, 0.0), (k0 + 44, R(-92.0)), (k0 + 47, R(-90.0)), (N, R(-90.0))], index=1)
    hd = S['handle']
    t0 = k0 + 54
    key(hd, 'rotation_euler', [(1, 0.0), (t0, 0.0), (t0 + 10, R(-38.0)), (t0 + 12, R(-36.0)), (N, R(-36.0))], index=1)
    for sl in S['bolts']:
        key(sl, 'location', [(1, (0.07, 0, 0)), (t0 + 2, (0.07, 0, 0)), (t0 + 12, (0.0, 0, 0)), (N, (0.0, 0, 0))])
    for sl in S['top_bolts']:
        key(sl, 'location', [(1, (0, 0, 0.035)), (t0 + 2, (0, 0, 0.035)), (t0 + 12, (0, 0, 0)), (N, (0, 0, 0))])
    s0 = t0 + 20
    key(door, 'rotation_euler', [(1, 0.0), (s0, 0.0), (s0 + 4, R(-0.4)), (N - 2, R(-36.0)), (N, R(-36.4))], index=2)
    for fc in fcurves(door):
        for kp in fc.keyframe_points:
            if kp.co.x >= s0:
                kp.interpolation = 'SINE'
                kp.easing = 'EASE_IN'
    cam = make_cam(40, 2.8, [(1, (0.16, -0.18, 1.3)), (k0, (0.16, -0.2, 1.2)), (s0, (0.2, -0.2, 1.15)),
                             (N, (0.15, -0.6, 1.1))])
    cam_path(cam, [(1, (0.66, -0.80, 1.36), (0.16, -0.14, 1.27), 0.0),
                   (A, (0.66, -0.80, 1.36), (0.16, -0.14, 1.27), 0.0),
                   (k0, (0.78, -0.98, 1.30), (0.16, -0.14, 1.18), 0.0),
                   (s0, (0.98, -1.28, 1.28), (0.12, -0.16, 1.12), 0.0),
                   (N, (1.42, -2.25, 1.30), (-0.05, -0.32, 1.08), 0.0)])
    for fc in fcurves(cam):
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing = 'EASE_IN_OUT'
    shake(cam, 0.0015, 0.0008, scale=32, seed=25)
    motes_box = ((-0.6, -2.0, 0.4), (1.3, -0.15, 2.0))

elif SHOT == 'S32':
    # Monday: the battens on, the vault lit, the door still standing open. Seen from the CCTV corner (the housing soft in
    # the foreground): the camera that watched all weekend and saw nothing.
    D.light_ante(S, 'monday')
    D.light_vault(S, 'warm', key_power=32.0)
    cam = make_cam(24, 3.2, [(1, (-0.35, -0.5, 1.0))])
    cam_path(cam, [(1, (1.50, -3.10, 2.20), (-0.35, 0.45, 0.82), 0.0), (N, (1.34, -2.98, 2.17), (-0.38, 0.5, 0.84), 0.0)])
    linear(cam)
    shake(cam, 0.0012, 0.0006, scale=40, seed=32)
    motes_box = ((-1.5, -3.0, 0.1), (1.5, -0.2, 2.4))

if motes_box:
    motes('Motes', 260, motes_box[0], motes_box[1], r=(0.0005, 0.0013), seed=7, drift=(0.02, 0.03, 0.05), start=1, end=N)

if haze_on and SHOT in ('S00', 'S52', 'S01'):
    D.haze('Haze', (0.0, -1.3, 1.25), (3.8, 2.6, 2.5), density=0.006)

if arg('--debuglight'):
    light('AREA', 'Debug', sc.camera.location + Vector((0, 0, 0.6)), energy=500, size=3.0, target=(0, 0, 1.0))
    world_color((0.05, 0.05, 0.05))

finish(SHOT)
