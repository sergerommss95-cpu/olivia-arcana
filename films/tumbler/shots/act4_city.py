"""ACT IV — THE GETAWAY (night city). Shots 4A (tower grid -> street, car punches out of the garage),
4B (low on the asphalt, car passes inches from the lens, notes swirl), 4C (tracking alongside: police light
on black paint, notes stream from the rear window), 4D (rear chase into a tunnel; one note flies at the lens
and ends flat, filling the frame -> T4).

python3 tools/rb.py shots/act4_city.py -- --shot 4B --stills 7,20 --pct 50 --samples 16
Debug: --debuglight (sun + bright world), --ov x,y,z,tx,ty,tz[,lens] (static overview camera), --nodof,
       --nonotes. Frames are local to the shot and include 6-frame handles (cut = 7..N-6).
"""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from common import *
from city import *

SHOT = arg('--shot', '4A')
H = 6
CUT = {'4A': 48, '4B': 24, '4C': 36, '4D': 36}[SHOT]
LEN = CUT + 2 * H
B = H + 1                 # first cut frame
BEAT = 12
NONOTES = bool(arg('--nonotes'))

sc = reset()
setup_render(1, LEN, samples=32, look='Medium High Contrast', exposure=0.0, bounces=(2, 4, 4), clamp=6.0,
             adaptive=0.04, filter_glossy=1.0)
world_gradient(zenith=(0.0012, 0.0016, 0.0028), horizon=(0.006, 0.0042, 0.0032), strength=1.0)


def key_cam_frames(cam, frames):
    """frames: {f: (loc, target, roll)} keyed every frame (Bezier)."""
    prev = None
    for f in sorted(frames):
        loc, tgt, roll = frames[f]
        cam.location = loc
        e = look_rot(loc, tgt, roll)
        if prev is not None:
            e.make_compatible(prev)
        prev = e.copy()
        cam.rotation_euler = e
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)


def key_focus(cam, pairs):
    for f, d in pairs:
        cam.data.dof.focus_distance = d
        cam.data.dof.keyframe_insert('focus_distance', frame=f)


def lerp3(a, b, t):
    return Vector(a).lerp(Vector(b), t)


def street_lamps(xs_pos, xs_neg, energy=900.0):
    tm = streetlight_mesh(None)
    a = streetlights(None, xs_pos, 1, energy=energy, tmpl=tm)
    b = streetlights(None, xs_neg, -1, energy=energy, tmpl=tm)
    return a + b


def skyline(x0, x1, y0, y1, seed=21, n=14, hmin=30, hmax=90):
    """Distant towers closing the end of the street (shader windows)."""
    rng = random.Random(seed)
    fm = facade_mats(strength=1.3)
    for i in range(n):
        x = rng.uniform(x0, x1)
        y = rng.uniform(y0, y1)
        w, d, h = rng.uniform(14, 30), rng.uniform(14, 30), rng.uniform(hmin, hmax)
        o = box(f'Sky_{i}', (w, d, h), (x, y, h / 2), mat=rng.choice(fm))


# =================================================================================================== 4A
def shot_4A():
    yf = FACADE_Y
    build_street(None, -140, 280, seed=1, driveways=[(-10.2, -2.8, 1)], plaza=[(-14.5, 14.5, -1)], crossing=24.0)
    bank = build_bank_tower(None, xc=0.0, room_strength=2.4)
    fm = facade_mats()
    build_buildings(None, -150, -16.6, +1, seed=11, mats=fm)
    build_buildings(None, 16.6, 280, +1, seed=12, mats=fm)
    build_buildings(None, -150, 280, -1, seed=13, skip=[(-14.5, 14.5)], mats=fm)
    skyline(300, 420, -60, 60, seed=4)
    street_lamps([-44, -28, -14, 12, 28, 44, 60, 76, 92, 108, 124, 140], [-36, -20, 8, 24, 40, 56, 72, 88, 104, 120])
    # architectural uplights grazing the tower piers (warm), dim
    for i, x in enumerate(bank['piers']):
        light('SPOT', f'Uplight{i}', (x, yf - 0.45, 6.25), energy=650, color=kelvin(2900), spot=11, blend=0.6,
              radius=0.05, target=(x, yf - 0.1, 40.0))
    # the car: idles deep in the ramp, punches out at beat 3 (f31), drifts left onto the street
    car = build_car('Getaway', open_window=True, head_energy=200)
    path = Path([(-6.5, 38, -3.0), (-6.5, 28, -3.0), (-6.5, 19, -1.5), (-6.5, 11, 0.0), (-6.3, 7.6, 0.0),
                 (-5.0, 4.0, 0.0), (-1.8, 1.6, 0.0), (4.0, 0.4, 0.0), (14, -0.6, 0.0), (30, -1.6, 0.0),
                 (60, -1.9, 0.0), (140, -1.9, 0.0)])
    s_anchor = path.project((-6.5, yf + 2.45, ramp_z(yf + 2.45)))
    drive(car, path, [(1, 4.0), (12, 10.0), (20, 15.0), (27, 17.0), (33, 15.0), (40, 18.0), (LEN, 26.0)],
          (B + 20, s_anchor), -20, LEN + 2, kfrom=0, kto=LEN + 1, roll_k=0.0035, slip_k=0.008,
          kicks=[(B + 21, 0.10, 0.35), (B + 23, -0.05, -0.30)], seed=3)
    lights_level(car, head=[(1, 5.0)], tail=[(1, 3.5)])
    # police: off-screen to the left (west end of the street), closing in; washing facades + wet road
    pol = []
    for k, (col, y, ph) in enumerate((('red', -3.0, 0), ('blue', -1.4, 0), ('red', 1.5, 3), ('blue', 3.0, 3))):
        x0, x1 = -58 + k, -40 + k
        pol.append(dict(color=col, kind='SPOT', spot=95, blend=1.0, radius=0.15, energy=60000, phase=ph,
                        target=(-4.0, yf, 5.0), path=[(1, (x0, y, 1.4)), (LEN, (x1, y, 1.4))]))
    pol.append(dict(color='blue', kind='SPOT', spot=60, blend=1.0, energy=50000, phase=6, target=(0.0, yf, 16.0),
                    path=[(1, (-50, -6, 1.6)), (LEN, (-36, -6, 1.6))]))
    pol.append(dict(color='red', kind='SPOT', spot=60, blend=1.0, energy=50000, phase=0, target=(0.0, yf, 16.0),
                    path=[(1, (-52, -5, 1.6)), (LEN, (-38, -5, 1.6))]))
    police_strobe(None, pol, 1, LEN, seed=2)
    if not NONOTES:
        note_wake(car, 'Note4A', B + 26, LEN + 1, 1, LEN, n_window=10, release=(B + 28, LEN), seed=7, out_speed=(1.5, 3.0))
    # camera: head-on 7x4 grid (floors 2-5), hold for the dissolve, drone-dive to the garage, follow the car
    cam = camera('Cam4A', lens=28, fstop=4.0, focus=24.0, clip=(0.05, 900))
    zc = 6.0 + 3.2 * 2 + 2.1 + 1.5 * 3.2
    D = 15.4 * 28 / 18.0
    st = car['state']
    cp = lambda f, dz=0.65: st[f]['pos'] + Vector((0, 0, dz))
    keys = {
        1: ((0.0, yf - D, zc), (0.0, yf, zc), 0.0),
        B + 4: ((0.0, yf - D + 0.1, zc - 0.15), (0.0, yf, zc - 0.2), 0.0),
        B + 12: ((-1.4, yf - D + 1.6, 11.8), (-3.0, yf, 8.4), 0.012),
        B + 18: ((-3.0, yf - D + 3.6, 4.7), (-6.2, yf, 1.9), 0.02),
        B + 24: ((-3.5, -8.4, 2.8), tuple(cp(B + 24)), 0.0),
        B + 32: ((-3.2, -7.2, 2.0), tuple(cp(B + 32) + Vector((1.0, 0, 0))), -0.02),
        LEN - 6: ((-2.6, -6.6, 1.72), tuple(cp(LEN - 6) + Vector((2.0, 0, 0))), -0.03),
        LEN: ((-2.4, -6.4, 1.68), tuple(cp(LEN) + Vector((2.5, 0, 0))), -0.03),
    }
    cam_path(cam, [(f, *keys[f]) for f in sorted(keys)])
    shake(cam, 0.008, 0.0015, scale=9, seed=4, start=B + 10, end=LEN + 2)
    key_focus(cam, [(1, 24.0), (B + 4, 24.0), (B + 12, 16.0), (B + 18, 18.0), (B + 24, 12.0), (B + 32, 9.0), (LEN, 12.0)])
    return cam, car


# =================================================================================================== 4B
def shot_4B():
    build_street(None, -200, 160, seed=2)
    fm = facade_mats()
    build_buildings(None, -220, 160, +1, seed=21, mats=fm)
    build_buildings(None, -220, 160, -1, seed=22, mats=fm)
    skyline(-320, -230, -50, 50, seed=5)
    xs = [x for x in range(-190, 160, 16)]
    street_lamps(xs, [x + 8 for x in xs])
    car = build_car('Getaway', open_window=True, head_energy=220)
    yl = -1.85
    path = Path([(-260, yl + 0.1, 0), (-120, yl - 0.05, 0), (-40, yl + 0.08, 0), (0, yl, 0), (60, yl - 0.1, 0),
                 (200, yl, 0)])
    s0 = path.project((0, yl, 0))
    drive(car, path, [(-40, 26.0), (LEN + 4, 27.0)], (B + 12, s0), -40, LEN + 4, kfrom=0, kto=LEN + 1, seed=5)
    lights_level(car, head=[(1, 5.5)], tail=[(1, 3.5)])
    cam_xy = (0.0, -3.32)
    if not NONOTES:
        rng = random.Random(9)
        ground = [(rng.uniform(-7, 9), rng.uniform(-3.6, -0.4)) for _ in range(16)]
        ground += [(rng.uniform(-1.2, 1.8), rng.uniform(-3.9, -2.9)) for _ in range(4)]
        note_wake(car, 'Note4B', -30, LEN + 1, 0, LEN + 1, n_window=46, release=(-26, LEN), ground=ground, seed=11,
                  lift=5.0, turb=1.8)
    # police far behind the car, coming the same way (lights on the street + facades)
    pol = []
    for k, (col, ph) in enumerate((('red', 0), ('blue', 0), ('red', 4), ('blue', 4))):
        y = -2.5 + k * 1.2
        pol.append(dict(color=col, kind='SPOT', spot=110, blend=1.0, energy=40000, phase=ph, target=(20, y * 2, 2.0),
                        path=[(1, (-95 + k, y, 1.4)), (LEN, (-70 + k, y, 1.4))]))
    police_strobe(None, pol, 1, LEN, seed=3)
    cam = camera('Cam4B', lens=18, fstop=2.8, focus=10.0, clip=(0.02, 900))
    z = 0.14
    st = car['state']
    keys = {}
    for f in range(1, LEN + 2):
        if f <= B + 9:
            tgt = st[f]['pos'] + Vector((0, 0.6, 0.55))
            tgt = Vector((min(tgt.x, -6.0), tgt.y, tgt.z))
            keys[f] = ((cam_xy[0] - 0.02 * f, cam_xy[1], z), tuple(tgt), 0.0)
    keys[B + 12] = ((cam_xy[0] - 0.22, cam_xy[1], z + 0.01), (-6.0, 12.0, 0.9), -0.05)
    keys[B + 14] = ((cam_xy[0] - 0.24, cam_xy[1], z + 0.02), (1.5, 30.0, 1.0), -0.08)
    keys[B + 16] = ((cam_xy[0] - 0.25, cam_xy[1], z + 0.02), (14.0, 10.0, 0.9), -0.04)
    for f in range(B + 18, LEN + 2):
        tgt = st[f]['pos'] + Vector((0, 0.0, 0.5))
        keys[f] = ((cam_xy[0] - 0.25, cam_xy[1] + 0.01 * (f - B - 18), z + 0.02), tuple(tgt), -0.02)
    key_cam_frames(cam, keys)
    shake(cam, 0.004, 0.003, scale=4, seed=9, start=B + 8, end=B + 16)
    key_focus(cam, [(1, 18.0), (B, 13.0), (B + 6, 6.5), (B + 10, 2.0), (B + 12, 0.9), (B + 15, 3.0), (B + 18, 6.0),
                    (LEN, 14.0)])
    return cam, car


# =================================================================================================== 4C
def shot_4C():
    build_street(None, -120, 260, seed=3)
    fm = facade_mats()
    build_buildings(None, -140, 260, +1, seed=31, mats=fm, wmin=8, wmax=18)
    build_buildings(None, -140, 260, -1, seed=32, mats=fm, wmin=8, wmax=18)
    xs = [x for x in range(-110, 260, 12)]
    street_lamps(xs, [x + 6 for x in xs], energy=950)
    car = build_car('Getaway', open_window=True, head_energy=220)
    yl = -1.85
    path = Path([(-200, yl, 0), (-60, yl + 0.1, 0), (0, yl, 0), (20, yl - 0.18, 0), (40, yl + 0.12, 0),
                 (70, yl, 0), (200, yl, 0)])
    s0 = path.project((0, yl, 0))
    drive(car, path, [(-40, 22.0), (LEN + 4, 23.0)], (1, s0), -40, LEN + 4, kfrom=0, kto=LEN + 1, seed=7)
    lights_level(car, head=[(1, 5.0)], tail=[(1, 3.5)])
    st = car['state']
    if not NONOTES:
        note_wake(car, 'Note4C', -36, LEN + 1, 0, LEN + 1, n_window=60, release=(-34, LEN), seed=13,
                  out_speed=(1.2, 2.8), keep_speed=(0.55, 0.85))
    # police cruiser off-screen behind: two strobing heads following the car ~14 m back
    pol = []
    for col, dy, ph in (('red', 0.5, 0), ('blue', -0.5, 0), ('red', 0.3, 5), ('blue', -0.7, 5)):
        back = 14.0 if ph == 0 else 26.0
        pth = [(f, tuple(st[f]['pos'] + Vector((-back, dy, 1.45)))) for f in range(0, LEN + 2, 2)]
        pol.append(dict(color=col, kind='SPOT', spot=100, blend=1.0, energy=9000 if ph == 0 else 14000, phase=ph,
                        path=pth, target=None))
    lts = police_strobe(None, pol, 0, LEN + 1, seed=4)
    for L, sp in zip(lts, pol):     # aim forward along the street
        L.rotation_euler = Vector((1, 0, -0.05)).to_track_quat('-Z', 'Y').to_euler()
    cam = camera('Cam4C', lens=32, fstop=2.2, focus=4.4, clip=(0.05, 900))
    keys = {}
    for f in range(0, LEN + 2):
        u = f / LEN
        p = st[f]['pos']
        rel = lerp3((1.9, -4.5, 1.12), (-0.2, -4.1, 0.98), ease(u))
        tg = lerp3((-0.3, 0.0, 0.68), (-1.0, 0.0, 0.74), ease(u))
        keys[f] = (tuple(p + rel), tuple(p + tg), 0.012 * math.sin(f * 0.21))
    key_cam_frames(cam, keys)
    shake(cam, 0.012, 0.004, scale=5, seed=12)
    return cam, car


# =================================================================================================== 4D
def shot_4D():
    XT = 40.0
    build_street(None, -140, XT, seed=4)
    fm = facade_mats()
    build_buildings(None, -160, XT - 2, +1, seed=41, mats=fm)
    build_buildings(None, -160, XT - 2, -1, seed=42, mats=fm)
    # city above/behind the portal
    build_buildings(None, XT + 4, XT + 120, +1, seed=43, front=8.0, hmin=25, hmax=60, mats=fm)
    build_buildings(None, XT + 4, XT + 120, -1, seed=44, front=8.0, hmin=25, hmax=60, mats=fm)
    xs = [x for x in range(-130, int(XT) - 4, 16)]
    street_lamps(xs, [x + 8 for x in xs], energy=900)
    tun = build_tunnel(None, XT, length=260.0, lamp_strength=7.0)
    car = build_car('Getaway', open_window=True, head_energy=220)
    yl = -1.75
    path = Path([(-150, yl, 0), (-40, yl + 0.15, 0), (XT, yl, 0), (XT + 60, yl - 0.1, 0), (XT + 300, yl, 0)])
    s_portal = path.project((XT, yl, 0))
    drive(car, path, [(-40, 23.0), (LEN + 4, 24.0)], (B + 3, s_portal), -40, LEN + 4, kfrom=0, kto=LEN + 1, seed=9)
    lights_level(car, head=[(1, 5.0)], tail=[(1, 3.5)])
    st = car['state']
    # camera: chase behind, slightly right, closing a touch, low
    cam = camera('Cam4D', lens=30, fstop=2.8, focus=7.5, clip=(0.01, 900))
    keys, cms = {}, {}
    for f in range(0, LEN + 2):
        u = f / LEN
        p = st[f]['pos']
        rel = lerp3((-7.2, -0.55, 1.15), (-7.8, -0.35, 1.0), u)
        tg = Vector((0.6, 0.0, 0.62))
        loc = p + rel
        keys[f] = (tuple(loc), tuple(p + tg), 0.0)
        cms[f] = Matrix.Translation(loc) @ look_rot(loc, p + tg).to_matrix().to_4x4()
    key_cam_frames(cam, keys)
    shake(cam, 0.006, 0.002, scale=6, seed=21)
    # police behind the camera
    pol = []
    for col, dy, ph in (('red', 0.6, 0), ('blue', -0.6, 0)):
        pth = [(f, tuple(st[f]['pos'] + Vector((-22.0, dy, 1.45)))) for f in range(0, LEN + 2, 2)]
        pol.append(dict(color=col, kind='SPOT', spot=100, blend=1.0, energy=20000, phase=ph, path=pth, target=None))
    lts = police_strobe(None, pol, 0, LEN + 1, seed=5)
    for L in lts:
        L.rotation_euler = Vector((1, 0, -0.02)).to_track_quat('-Z', 'Y').to_euler()
    if not NONOTES:
        note_wake(car, 'Note4D', -10, LEN + 1, 0, LEN + 1, n_window=14, release=(-8, B + 16), seed=17)
    hero_note(cam, car, cms, f_rel=B + 13, f_land=B + 31)
    return cam, car


def hero_note(cam, car, cms, f_rel, f_land):
    """One note leaves the rear window, tumbles at the lens and ends flat filling the frame (T4).
    Animated in camera space (parented to the camera): front face (print) toward the lens, text upright."""
    from note import make_banknote
    paper = make_banknote('HeroNote', detail='hi')
    kids = [c for c in bpy.data.objects if c.parent == paper]
    paper = join([paper] + kids, 'HeroNote')
    parent(paper, cam, keep=False)
    lens, sw = cam.data.lens, cam.data.sensor_width
    fw = NOTE_W / 1.03                             # frame width at the end: note overfills by 3%
    d_end = fw * lens / sw
    st = car['state']
    w0 = cms[f_rel].inverted() @ (st[f_rel]['M'] @ car['window_local'])
    P0 = Vector(w0)
    P3 = Vector((0, 0, -d_end))
    P1 = P0 + Vector((0.5, 0.9, 2.2))
    P2 = P3 + Vector((-0.35, 0.22, -0.9))
    rng = random.Random(41)
    axis = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))).normalized()
    axis2 = Vector((0.3, 1.0, 0.2)).normalized()
    b = paper.modifiers.new('Bend', 'SIMPLE_DEFORM')
    b.deform_method, b.deform_axis = 'BEND', 'Y'
    tw = paper.modifiers.new('Twist', 'SIMPLE_DEFORM')
    tw.deform_method, tw.deform_axis = 'TWIST', 'X'
    prev = None
    for f in range(1, LEN + 2):
        if f < f_rel - 2:
            paper.scale = (0, 0, 0)
            paper.location = P0
            paper.keyframe_insert('scale', frame=f)
            paper.keyframe_insert('location', frame=f)
            continue
        paper.scale = (1, 1, 1)
        paper.keyframe_insert('scale', frame=f)
        u = max(0.0, min(1.0, (f - f_rel) / (f_land - f_rel)))
        uu = 1 - (1 - u) ** 2.2                      # fast off the car, decelerating onto the lens
        pos = (P0 * (1 - uu) ** 3 + P1 * 3 * uu * (1 - uu) ** 2 + P2 * 3 * uu * uu * (1 - uu) + P3 * uu ** 3)
        settle = smoothstep(f_land - 9, f_land, f)
        ang = 13.0 * (f - f_rel) / FPS * (1 - 0.6 * u)
        qt = Quaternion(axis, ang) @ Quaternion(axis2, 0.7 * math.sin(f * 0.6))
        q = qt.slerp(Quaternion(), settle)
        e = q.to_euler()
        if prev is not None:
            e.make_compatible(prev)
        prev = e.copy()
        if f > f_land:
            res = 0.012 * math.exp(-(f - f_land) / 3.0) * math.sin(f * 1.7)
            pos = P3 + Vector((0, res * 0.01, 0))
            e = Euler((res, -res * 0.6, 0))
        paper.location = pos
        paper.rotation_euler = e
        paper.keyframe_insert('location', frame=f)
        paper.keyframe_insert('rotation_euler', frame=f)
        bend = (1 - settle) * 0.9 * math.sin(f * 0.75 + 0.4) + (0.025 * math.exp(-(f - f_land) / 2.5) if f > f_land else 0)
        b.angle = bend
        b.keyframe_insert('angle', frame=f)
        tw.angle = (1 - settle) * 0.7 * math.sin(f * 0.5 + 1.3)
        tw.keyframe_insert('angle', frame=f)
        cam.data.dof.focus_distance = max(d_end, (pos.length if f >= f_rel + 4 else 7.5))
        cam.data.dof.keyframe_insert('focus_distance', frame=f)
    for fc in fcurves(paper):
        if fc.data_path == 'scale':
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT'
    paper.cycles.motion_steps = 3
    # soft warm fill riding with the camera so the print reads as the note settles (tunnel light)
    fl = light('AREA', 'NoteFill', (0.0, 0.25, 0.05), energy=0.0, color=kelvin(2600), size=0.3)
    parent(fl, cam, keep=False)
    fl.location = (0.02, 0.22, 0.02)
    fl.rotation_euler = Vector((0, -0.22, -d_end - 0.02)).to_track_quat('-Z', 'Y').to_euler()
    key_data(fl.data, fl, 'energy', [(f_land - 10, 0.0), (f_land, 0.6), (LEN, 0.6)])
    return paper


# =================================================================================================== main
cam, car = {'4A': shot_4A, '4B': shot_4B, '4C': shot_4C, '4D': shot_4D}[SHOT]()
if arg('--nodof'):
    cam.data.dof.use_dof = False
if arg('--debuglight'):
    sun = light('SUN', 'DebugSun', (0, 0, 50), energy=3.0, size=2.0, rot=(0.7, 0.2, 0.6))
    bpy.context.scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 60.0
ov = arg('--ov', None)
if ov:
    v = [float(x) for x in str(ov).split(',')]
    oc = camera('Overview', loc=tuple(v[:3]), target=tuple(v[3:6]), lens=v[6] if len(v) > 6 else 24, clip=(0.1, 2000))
    sc.camera = oc
finish(SHOT)
