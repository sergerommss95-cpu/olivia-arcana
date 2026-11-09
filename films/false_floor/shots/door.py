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
Flags: --debuglight (flat layout light), --haze (thin local haze in S00/S01/S52), --novault (fast layout).
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
import door_ff as D

SHOT = arg('--shot', 'S14')
FRAMES = {'S00': 252, 'S01': 252, 'S10': 252, 'S14': 252, 'S20': 1, 'S25': 252, 'S32': 162, 'S52': 252,
          'N2': 90, 'N8': 75,       # N*: v2 test sequence 'The Night' (script/SEQ_NIGHT.json)
          'C3': 90, 'C4': 80, 'C5': 40, 'C11': 90}   # C*: v2 COLD OPEN (script/SEQ_COLD.json), Monday morning
N = FRAMES[SHOT]
H = 6                       # handles
A, B = H + 1, N - H         # first / last frame used by the cut
STILL = SHOT == 'S20'
R = math.radians

sc = reset()
setup_render(1, N, res=(2560, 1440) if STILL else RES_FINAL, samples=96 if STILL else 40, look='Medium High Contrast',
             clamp=4.0, vol_step=6.0, shutter=0.5)
world_color((0.0012, 0.0013, 0.0016))

need_vault = SHOT in ('S00', 'S01', 'S25', 'S32', 'S52', 'N8', 'C3', 'C4', 'C5', 'C11') and not arg('--novault')
# S00/S01 keep the door_ff dial + painted contact plates they were approved/rendered with; every later shot matches A2's
# macros (zinc contact blocks, top-reading lens hood) per the lead.
S = D.build_set(vault=need_vault, stair=True, grate=True, cctv=True, key=(SHOT == 'S25'), a2=SHOT not in ('S00', 'S01'),
                forced=(0.0, 0.0) if SHOT == 'N8' else (0.6, 0.62), debris=SHOT != 'N8')   # N8: before the boxes
COLD = SHOT in ('C3', 'C4', 'C5', 'C11')     # Monday morning = after the heist: door wide open, boxes forced, papers down
if COLD:
    SEIS = D.build_seismic(S)                # on the door's inner face near the hinge edge (VO: "A seismic sensor.")

# ---- door / grate states -----------------------------------------------------------------------------------------
AJAR = 2.0                  # S00/S52 hairline (degrees)
OPEN = 112.0                # wide open (S01/S32/start of S52)
door, grate = S['door'], S['grate']
D.set_bolts(S, extended=SHOT in ('S10', 'S14', 'S20', 'S25', 'S01', 'S32', 'N2') or COLD)   # thrown bolts read best on the open door
D.set_door(S, OPEN if COLD else {'S00': AJAR, 'S01': OPEN, 'S32': OPEN, 'S52': OPEN}.get(SHOT, 0.0))
grate.rotation_euler.z = R(84) if COLD else {'S01': R(84), 'S32': R(84), 'N2': R(78), 'N8': R(78)}.get(SHOT, 0.0)
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
haze_on = bool(arg('--haze'))      # optional thin haze in front of the door (off by default: cost > benefit at this density)

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
        # start on the free side so the closing wedge of light stays in view, settle into S00's frame as it shuts
        cam_path(cam, [(1, (1.08, -2.22, 0.47), (0.12, 0.25, 0.78), 0.0), (A, (1.07, -2.24, 0.47), (0.12, 0.25, 0.78), 0.0),
                       (128, (0.78, -2.62, 0.43), (0.24, 0.08, 0.6), 0.0), (212, P0, T0, 0.0), (N, P0, T0, 0.0)])
        for fc in fcurves(cam):
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
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
        sp = LV['spill']          # what escapes the doorway follows the opening
        key_data(sp.data, sp, 'energy', [(1, 70.0), (d0 + 40, 66.0), (150, 26.0), (180, 8.0), (d1, 0.0)])
    shake(cam, 0.0015, 0.0008, scale=40, seed=3)
    motes_box = ((-0.9, -2.0, 0.05), (1.2, -0.15, 1.6))

elif SHOT == 'S01':
    # Reveal: start tight on the free edge of the open door (chrome bolts, 0.4 m of steel), pull back and around to show
    # the door standing wide open with the forced vault beyond. Warm vault light pours out; the antechamber is cold, low.
    D.light_ante(S, 'day', scale=0.38, on=('A', 'B', 'S'))
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
                   (N, (0.04, -7.30, 3.07), (0.0, -2.2, 1.05), 0.0)])
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
    cam = make_cam(24, 4.0, [(1, (0.1, -0.15, 1.0))])
    cam_path(cam, [(1, (0.30, -3.55, 1.04), (0.10, 0.0, 1.08), 0.0)])
    motes_box = ((-1.0, -2.8, 0.1), (1.3, -0.3, 2.3))

elif SHOT == 'S25':
    # The opening, told by the objects: wheel (four numbers, alternating direction), key slides in and turns, the
    # handle drops, the bolts draw back, the door swings out of the dark. Night state + one batten on.
    D.light_ante(S, 'night', on=('A',), scale=1.0)
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
    cam_path(cam, [(1, (0.66, -0.80, 1.36), (0.16, -0.14, 1.30), 0.0),
                   (A, (0.66, -0.80, 1.36), (0.16, -0.14, 1.30), 0.0),
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
    # Monday: the battens on, the vault lit, the door still standing open. Seen from high in the corner beside the CCTV
    # camera (its vantage: it watched all weekend and saw nothing).
    D.light_ante(S, 'monday')
    D.light_vault(S, 'warm', key_power=32.0)
    cam = make_cam(24, 3.2, [(1, (-0.35, -0.5, 1.0))])
    cam_path(cam, [(1, (1.50, -3.56, 2.38), (-0.30, 0.45, 0.80), 0.0), (N, (1.40, -3.47, 2.36), (-0.36, 0.5, 0.82), 0.0)])
    linear(cam)
    shake(cam, 0.0012, 0.0006, scale=40, seed=32)
    motes_box = ((-1.5, -3.0, 0.1), (1.5, -0.2, 2.4))

elif SHOT in ('N2', 'N8'):
    # v2 'The Night' (script/SEQ_NIGHT.json): stylized cast from lib/cast.py, lights ON (investigators: sensor taped).
    import cast as CA
    import human as HU
    import mocap as MC
    from mathutils import Vector as V3

    def haze_box(name, loc, size, dens):
        hz = box(name, size, loc)
        mh = bpy.data.materials.new(name + 'M')
        mh.use_nodes = True
        nt = mh.node_tree
        nt.nodes.remove(nt.nodes['Principled BSDF'])
        vol = nt.nodes.new('ShaderNodeVolumePrincipled')
        vol.inputs['Density'].default_value = dens
        vol.inputs['Anisotropy'].default_value = 0.6
        nt.links.new(vol.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
        hz.data.materials.append(mh)
        no_shadow = getattr(D, 'no_shadow')
        no_shadow(hz)
        return hz

    if SHOT == 'N2':
        # FPV dive: rush down the flight just above the treads, bank through the S of the descent, flatten out at the
        # landing and drive in behind Monster and Speedy as they walk through the open grate toward the door.
        D.light_ante(S, 'day', scale=1.6, k=4800)
        sc.view_settings.exposure = 1.3
        # soft bounce off the stair soffit (the stairwell read too dark at 0.09 mean luma in the test)
        slope = math.atan2(0.18, 0.28)
        for yy, e in ((-7.6, 140.0), (-10.4, 70.0)):
            zz = 2.5 + max(0.0, (-5.0 - yy)) * 0.18 / 0.28 - 0.15
            fl = light('AREA', f'StairFill{yy}', (0.0, yy, min(zz, 5.2)), (-slope if yy > -9.5 else 0.0, 0, 0), energy=e,
                       color=kelvin(5000), size=1.3, size_y=2.4, shape='RECTANGLE')
            fl.visible_glossy = False
        mo, sp = CA.make('monster'), CA.make('speedy')
        M2 = MC.load('02', '02_01')
        MC.apply(mo, M2, start_frame=26, src_range=(0, 342), step=5, pos=(-0.02, -4.25), yaw_deg=180)
        MC.apply(sp, M2, start_frame=30, src_range=(0, 342), step=5, pos=(0.28, -4.95), yaw_deg=180)
        bpy.context.scene.frame_set(26)
        CA.torch(mo, 'R', (0.0, -0.4, 0.4), power=700.0)
        bpy.context.scene.frame_set(30)
        CA.torch(sp, 'L', (0.4, -1.0, 0.3), power=500.0)
        bpy.context.scene.frame_set(1)
        haze_box('HazeN2', (0.0, -2.6, 1.25), (3.8, 2.4, 2.5), 0.012)
        cam = make_cam(20, 4.0, [(1, (0.0, -7.0, 1.6)), (55, (0.0, -4.4, 1.0)), (N, (0.0, -2.6, 1.1))])
        def nose(y):
            return max(0.0, (STY0 - y) / 0.28 * 0.18)
        STY0 = -5.0
        pts = [(1, (0.28, -11.2, 2.88 + 0.95), (0.0, -6.0, 0.9), R(0)),
               (A, (0.26, -10.7, 2.88 + 0.90), (0.0, -5.8, 0.8), R(-2)),
               (28, (-0.18, -8.6, nose(-8.6) + 0.72), (0.05, -4.6, 0.7), R(-9)),
               (48, (0.16, -6.6, nose(-6.6) + 0.70), (0.0, -3.4, 0.85), R(7)),
               (64, (0.05, -5.15, 0.95), (0.0, -2.2, 1.05), R(-3)),
               (N, (0.02, -4.35, 1.18), (0.0, -1.0, 1.12), R(0))]
        cam_path(cam, pts)
        for fc in fcurves(cam):
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
        shake(cam, 0.006, 0.004, scale=7, seed=22)
        motes_box = ((-0.7, -9.0, 0.3), (0.7, -3.9, 3.8))
    else:
        # REVERSE from inside the (untouched) vault: the door swings out, the crew stand silhouetted in the lit
        # doorway, torch beams flaring through haze into the lens; the camera dollies back fast between the box walls.
        # antechamber lit from BEHIND the crew (far batten + stair) so they read as silhouettes in the doorway
        D.light_ante(S, 'day', scale=2.4, k=4800, on=('B', 'S'))
        LV = D.light_vault(S, 'warm', key_power=30.0, spill=0.0, tube_power=26.0)
        sc.view_settings.exposure = 0.95
        sc.view_settings.keyframe_insert('exposure', frame=1)
        sc.view_settings.exposure = 0.72                     # more lit box wall enters frame as we pull back
        sc.view_settings.keyframe_insert('exposure', frame=N)
        for side in ('vault_left', 'vault_right'):          # untouched vault: no torn-off doors before the break-in
            for d_, c_, r_, st_ in S[side]['doors']:
                if st_ == 'torn':
                    d_.hide_render = False
            for lo in S[side]['loose']:
                lo.hide_render = True
        D.set_bolts(S, extended=False)
        key(door, 'rotation_euler', [(1, 0.0), (A + 2, R(-0.3)), (32, R(-56.0)), (N, R(-78.0))], index=2)
        for fc in fcurves(door):
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
        kg, mo, sp = CA.make('king'), CA.make('monster'), CA.make('speedy')
        for _h in (kg, mo, sp):
            CA.grip(_h, 'L', 0.4)
            CA.grip(_h, 'R', 0.4)
        for h, (x, y, yaw) in ((kg, (0.62, -1.28, 186)), (mo, (0.05, -1.72, 176)), (sp, (0.40, -2.35, 172))):
            HU.place(h, x, y, yaw)
            CA.arms_down(h, 'L', 0.12, 0.05)
            CA.arms_down(h, 'R', 0.12, 0.05)
        CA.head_turn(kg, 0, 6)
        CA.torch(mo, 'R', (0.25, 2.2, 1.35), power=1100.0)
        CA.torch(sp, 'L', (-0.2, 2.6, 1.0), power=800.0)
        haze_box('HazeN8', (0.1, -1.1, 1.3), (3.4, 3.4, 2.5), 0.007)       # antechamber side only: beams flare, vault stays clear
        cam = make_cam(24, 2.8, [(1, (0.1, -0.2, 1.3)), (40, (0.4, -1.3, 1.4)), (N, (0.4, -1.4, 1.35))])
        cam_path(cam, [(1, (-0.05, 1.55, 1.42), (0.12, -1.5, 1.3), R(0)),
                       (A, (-0.05, 1.62, 1.42), (0.12, -1.5, 1.3), R(0)),
                       (N, (0.0, 4.6, 1.55), (0.25, -1.4, 1.2), R(1.5))])
        for fc in fcurves(cam):
            for kp in fc.keyframe_points:
                kp.interpolation = 'SINE'
                kp.easing = 'EASE_OUT'
        shake(cam, 0.003, 0.0015, scale=12, seed=8)
        motes_box = ((-1.1, 0.8, 0.2), (1.1, 4.5, 2.6))

elif COLD:
    # v2 COLD OPEN (script/SEQ_COLD.json): Monday 17 Feb 2003, the guard (lib/cast.py) finds the vault open.
    import cast as CA
    import human as HU
    import mocap as MC
    from mathutils import Vector as V3

    def smooth_keys(ob, interp='BEZIER', easing=None):
        for fc in fcurves(ob):
            for kp in fc.keyframe_points:
                kp.interpolation = interp
                if easing:
                    kp.easing = easing
                else:
                    kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'

    def door_pt(local):
        """World position of a point given in door coordinates (door shut), for the door standing OPEN."""
        c, s_ = math.cos(-R(OPEN)), math.sin(-R(OPEN))
        dx, dy = local[0] - D.HINGE_X, local[1] - D.HINGE_Y
        return V3((D.HINGE_X + c * dx - s_ * dy, D.HINGE_Y + s_ * dx + c * dy, local[2]))

    if SHOT == 'C3':
        # FPV behind the guard: down the last of the flight as he walks off the stairs onto the landing and through the
        # open grate; the antechamber battens stutter on as he crosses the threshold. Before that, the room beyond the
        # bars is lit only by the warm vault doorway.
        LA = D.light_ante(S, 'day', scale=1.5, k=4800)
        D.light_vault(S, 'warm', key_power=40.0, spill=60.0)
        sc.view_settings.exposure = 1.3
        D.fixture(S['M'], 'FixLanding', (0.0, -4.45, 2.488), axis='X', on=True, power=75.0, k=5000, strength=10.0)   # stairwell light, already on (pre-flicker frames read 0.07 mean luma without it)
        slope = math.atan2(0.18, 0.28)
        fl = light('AREA', 'StairFill', (0.0, -7.6, 2.5 + 2.6 * 0.18 / 0.28 - 0.15), (-slope, 0, 0), energy=150.0,
                   color=kelvin(5000), size=1.3, size_y=2.6, shape='RECTANGLE')
        fl.visible_glossy = False
        fx = LA['fix']
        D.key_fixture(fx['A'], [(1, 0.0), (34, 0.0), (35, 0.8), (37, 0.0), (41, 0.5), (42, 1.0), (44, 0.15), (47, 1.0),
                                (49, 0.6), (51, 1.0)])
        D.key_fixture(fx['B'], [(1, 0.0), (36, 0.0), (37, 0.6), (39, 0.0), (43, 0.9), (45, 0.0), (48, 1.0), (50, 0.4),
                                (52, 1.0)])
        g = CA.make('guard')
        MC.apply(g, MC.load('02', '02_01'), start_frame=1, src_range=(0, 342), step=4, pos=(0.10, -4.70), yaw_deg=180)
        cam = make_cam(22, 4.0, [(1, (0.1, -4.6, 1.2)), (N, (0.1, -2.4, 1.2))])
        cam_path(cam, [(1, (0.22, -7.15, 1.36 + 1.42), (0.08, -3.2, 0.95), R(-4)),
                       (A, (0.21, -7.0, 1.27 + 1.42), (0.08, -3.1, 0.95), R(-3)),
                       (40, (0.02, -5.75, 0.48 + 1.25), (0.1, -2.6, 1.05), R(3)),
                       (62, (0.06, -5.0, 1.62), (0.1, -1.6, 1.15), R(-1)),
                       (N, (0.12, -4.25, 1.6), (0.05, -0.6, 1.12), R(0))])
        smooth_keys(cam)
        shake(cam, 0.005, 0.003, scale=8, seed=31)
        motes_box = ((-0.7, -7.0, 0.3), (0.7, -3.9, 3.2))

    elif SHOT == 'C4':
        # Over the guard's right shoulder as he stops dead: the door standing wide open, the lit, forced vault beyond.
        D.light_ante(S, 'monday', scale=1.1)
        D.light_vault(S, 'warm', key_power=45.0, spill=70.0)
        sc.view_settings.exposure = 1.0
        g = CA.make('guard')
        HU.place(g, 0.34, -1.80, 180)
        CA.arms_down(g, 'L', 0.12, 0.04)
        CA.arms_down(g, 'R', 0.12, 0.04)
        CA.grip(g, 'L', 0.3)
        CA.grip(g, 'R', 0.3)
        CA.head_turn(g, -4, 7)
        cam = make_cam(28, 2.8, [(1, (-0.45, -0.6, 1.1))])
        cam_path(cam, [(1, (-0.20, -2.70, 1.55), (-0.42, 0.35, 1.02), R(0)),
                       (A, (-0.20, -2.68, 1.55), (-0.42, 0.35, 1.02), R(0)),
                       (N, (-0.14, -2.32, 1.52), (-0.40, 0.45, 1.02), R(-0.6))])
        smooth_keys(cam, 'SINE', 'EASE_IN_OUT')
        shake(cam, 0.0015, 0.0008, scale=30, seed=41)
        motes_box = ((-1.0, -1.6, 0.3), (1.2, 0.6, 2.3))

    elif SHOT == 'C5':
        # Fast macro push onto the seismic sensor on the inner face of the open door.
        D.light_ante(S, 'monday', scale=1.1)
        D.light_vault(S, 'warm', key_power=45.0, spill=70.0)
        sc.view_settings.exposure = 0.35          # test frames read 0.47-0.73 mean luma at 1.0 with a 14 W key
        p = door_pt((-0.34, D.BODY_Y[1] + 0.036, 1.96))
        nrm = V3((math.cos(-R(OPEN)) * 0 - math.sin(-R(OPEN)) * 1, math.sin(-R(OPEN)) * 0 + math.cos(-R(OPEN)) * 1, 0))
        side = V3((-nrm.y, nrm.x, 0))
        kl = light('AREA', 'SeisKey', p + nrm * 0.6 + V3((0, 0, 0.45)) + side * 0.25, energy=3.0, color=kelvin(4800),
                   size=0.35, target=p)
        kl.visible_glossy = True
        cam = make_cam(55, 4.0, [(1, tuple(p))])
        cam_path(cam, [(1, tuple(p + nrm * 0.95 + side * 0.18 + V3((0, 0, 0.16))), tuple(p), R(-2)),
                       (A, tuple(p + nrm * 0.90 + side * 0.17 + V3((0, 0, 0.15))), tuple(p), R(-2)),
                       (N, tuple(p + nrm * 0.24 + side * 0.04 + V3((0, 0, 0.03))), tuple(p + V3((0, 0, -0.004))), R(0))])
        smooth_keys(cam, 'EXPO', 'EASE_OUT')
        shake(cam, 0.0008, 0.0006, scale=20, seed=51)
        motes_box = (tuple(p + V3((-0.4, -0.4, -0.3))), tuple(p + V3((0.4, 0.4, 0.3))))

    else:   # C11
        # From inside the vault looking out: the guard small in the doorway, phone to his ear; fast pull back down the
        # aisle between the forced box walls and the papers on the floor.
        D.light_ante(S, 'monday', scale=1.3)
        D.light_vault(S, 'warm', key_power=40.0, spill=0.0)
        sc.view_settings.exposure = 0.7
        g = CA.make('guard')
        HU.place(g, 0.18, -0.60, 182)
        CA.arms_down(g, 'L', 0.12, 0.04)
        CA.grip(g, 'L', 0.3)
        bpy.context.view_layer.update()
        rw = g.rig.matrix_world
        head = rw @ g.rig.pose.bones['Head'].head
        rdir = ((rw @ g.rig.pose.bones['RightArm'].head) - (rw @ g.rig.pose.bones['LeftArm'].head)).normalized()
        # phone to the ear, placed from the eyes: ear ~8.5 cm behind and 7.5 cm beside them; the palm cups the phone
        # against the ear, fingers up and back along the head, elbow down and out
        fwd = (rw.to_3x3() @ V3((0, -1, 0))).normalized()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = g.eyes.evaluated_get(dg)
        me_ = ev.to_mesh()
        eyes = sum(((g.eyes.matrix_world @ v.co) for v in me_.vertices), V3()) / len(me_.vertices)
        ev.to_mesh_clear()
        ear = eyes - fwd * 0.085 + rdir * 0.075 - V3((0, 0, 0.015))
        palm = ear + rdir * 0.035 + fwd * 0.02 - V3((0, 0, 0.035))
        sh = rw @ g.rig.pose.bones['RightArm'].head
        MC.shoulder_follow(g.rig, 'RightShoulder', palm - sh)
        CA.place_hand(g, 'R', palm, V3((0, 0, 1)) * 0.85 - fwd * 0.5, -rdir,
                      pole=tuple(rdir * 0.35 + V3((0, 0, -1)) + fwd * 0.55), amount=0.55)
        CA.head_turn(g, 6, 4)
        bpy.context.view_layer.update()
        pb = g.rig.pose.bones['RightHand']
        hp = g.rig.matrix_world @ pb.tail
        # the phone lies against the ear, its length running from the ear toward the mouth, its back in the palm
        ax_l = (fwd * 0.8 - V3((0, 0, 0.6))).normalized()
        ax_t = rdir.normalized()
        ax_w = ax_l.cross(ax_t).normalized()
        ph = box('Phone', (0.012, 0.05, 0.11), tuple(ear + ax_t * 0.017 + ax_l * 0.035), bev=0.004,
                 mat=mat_principled('PhoneBlack', color=(0.02, 0.02, 0.022), rough=0.35, spec=0.5))
        from mathutils import Matrix as _M
        ph.rotation_euler = _M((ax_t, ax_w, ax_l)).transposed().to_euler()
        co = ph.constraints.new('CHILD_OF')
        co.target = g.rig
        co.subtarget = 'RightHand'
        bpy.context.view_layer.update()
        co.inverse_matrix = (g.rig.matrix_world @ pb.matrix).inverted()
        cam = make_cam(28, 3.2, [(1, (0.18, -0.5, 1.5))])
        cam_path(cam, [(1, (0.05, 1.45, 1.52), (0.16, -0.6, 1.42), R(0)),
                       (A, (0.05, 1.55, 1.52), (0.16, -0.6, 1.42), R(0)),
                       (N, (-0.05, 5.0, 1.68), (0.16, -0.6, 1.3), R(-1.5))])
        smooth_keys(cam, 'SINE', 'EASE_OUT')
        shake(cam, 0.003, 0.0015, scale=12, seed=11)
        motes_box = ((-1.1, 0.8, 0.2), (1.1, 5.0, 2.6))

if motes_box:
    motes('Motes', 260, motes_box[0], motes_box[1], r=(0.0005, 0.0013), seed=7, drift=(0.02, 0.03, 0.05), start=1, end=N)

if haze_on and SHOT in ('S00', 'S52', 'S01'):
    D.haze('Haze', (0.0, -1.3, 1.25), (3.8, 2.6, 2.5), density=0.006)

if arg('--debuglight'):
    light('AREA', 'Debug', sc.camera.location + Vector((0, 0, 0.6)), energy=500, size=3.0, target=(0, 0, 1.0))
    world_color((0.05, 0.05, 0.05))

finish(SHOT)
