"""VAULT ROOM, Level -2 (owner B_room). Illustrative reconstruction. Extends the approved SF1 look (lib/vault_ff.py).

States:  BEFORE  all boxes shut, tidy, cold daytime light ........ S21, S41
         NIGHT   dark, then the tubes strike; boxes forced ......... S26, S27
         AFTER   forced wall + floor debris, as SF1 ................ S02, S28, S34, S45a/S45b, S51
3D  (animated, 1920x1080, 6-frame handles, cut = 7..N-6): S02 S21 S26 S27 (252 f), S34 (98 f)
3DS (one still, 2560x1440, ~15 % safe room for the push in post): S28 S41 S45a S45b S51

python3 films/tumbler/tools/rb.py films/false_floor/shots/room.py -- --shot S27 --stills 7,40 --pct 30 --samples 12
Extra flags: --debuglight (flat layout light), --counter_json (S27: write notes/room_S27_counter.json)
"""
import sys, os, math, random, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
from vault_ff import *

SHOT = arg('--shot', 'S02')
INFO = {'S02': ('3D', 252), 'S21': ('3D', 252), 'S26': ('3D', 252), 'S27': ('3D', 252), 'S34': ('3D', 98),
        'S28': ('3DS', 1), 'S41': ('3DS', 1), 'S45a': ('3DS', 1), 'S45b': ('3DS', 1), 'S51': ('3DS', 1)}
KIND, N = INFO[SHOT]
STILL_RES = (2560, 1440)

sc = reset()
if KIND == '3D':
    setup_render(1, N, res=RES_FINAL, samples=40, look='Medium High Contrast', clamp=4.0)
else:
    setup_render(1, 1, res=STILL_RES, samples=64, look='Medium High Contrast', clamp=4.0, mb=False)
world_color((0.004, 0.0045, 0.005))
M = mats()
mats_room(M)


# ----------------------------------------------------------------------------- shared set dressing

def walls(state):
    if state == 'after':      # the SF1 walls exactly (same seeds / forced ratios)
        r = build_wall(M, y0=WALL_Y0, cols=22, rows=13, seed=7, forced=0.6, side=1)
        l = build_wall(M, y0=WALL_Y0, cols=22, rows=13, seed=19, forced=0.5, side=-1)
        for w in (r, l):      # torn-off doors kept clear of the sorted loot and the S02 hero props
            clear_loose(w, [(LOOT_C[0], LOOT_C[1], 0.8), (HERO_C[0], HERO_C[1], 0.36)])
    else:
        r = build_wall(M, y0=WALL_Y0, cols=22, rows=13, seed=7, side=1, closed=True)
        l = build_wall(M, y0=WALL_Y0, cols=22, rows=13, seed=19, side=-1, closed=True)
    return r, l


LOOT_C = (0.15, 3.0)
HERO_C = (0.8, 2.62)


def debris_after(avoid=None):
    scatter_debris(M, (-1.1, 0.1, 0), (1.15, 5.5, 0), count=170, seed=11, near=(1.15, 0), avoid=avoid)
    scatter_debris(M, (-1.15, 0.6, 0), (1.0, 5.0, 0), count=60, seed=23, near=(-1.1, 0), avoid=avoid)


def fixtures(strength=2.2, energy=14.0, kelv=4600, tube_color=(0.86, 0.9, 0.95), on=(1, 1, 1)):
    out = []
    for i, y in enumerate(FIX_Y):
        out.append(fixture(M, f'Fx{i}', 0.0, y, strength=strength * on[i], energy=energy * on[i], kelv=kelv,
                           tube_color=tube_color))
        out[-1]['strength'], out[-1]['energy'] = strength, energy      # full values (for flicker)
    return out


def cream_key(pos=(-1.05, 0.6, 2.6), aim=(1.2, 3.0, 1.4), energy=38.0, size=0.25, name='CreamKey'):
    a = empty(name + 'Aim', aim)
    k = light('AREA', name, pos, energy=energy, color=kelvin(3900), size=size)
    track_to(k, a)
    return k


def sensors(taped, led=True):
    pir = pir_sensor(M)
    ls = light_sensor(M, taped=taped)
    cam_ = cctv(M, led=led)
    return pir, ls, cam_


def ante_spill(energy=70.0, kelv=5200, target=(0.2, 4.0, 0.0)):
    """The antechamber's light falling through the open vault doorway into the dark room (casts the doorway on the
    floor; the only key at night)."""
    return light('AREA', 'AnteSpill', (0.0, 7.3, 1.85), energy=energy, color=kelvin(kelv), size=0.9, target=target)


def lens_cam(name, lens, fstop, focus_obj=None):
    c = camera(name, lens=lens, fstop=fstop)
    if focus_obj is not None:
        c.data.dof.focus_object = focus_obj
    return c


def eased(o, path='location'):
    for fc in fcurves(o):
        if fc.data_path == path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'


if arg('--debuglight'):
    light('AREA', 'Debug', (0, 1.0, 2.6), energy=500, size=3, target=(0.5, 3.5, 0.8))
    light('AREA', 'Debug2', (0, 5.0, 2.6), energy=300, size=3, target=(0.5, 1.5, 0.8))


# ============================================================================= BEFORE

if SHOT == 'S41':
    # The sealed vault, cold light: one-point view down the room to the shut door. Every box closed, floor clean.
    build_room(M, door='closed', ante_energy=0.0)
    walls('before')
    sensors(taped=False)
    # after hours: the near tube is off, the far two burn cold; the room falls off toward the camera
    fx = fixtures(strength=3.0, energy=22.0, kelv=6200, tube_color=(0.82, 0.88, 1.0), on=(0, 1, 1))
    for o in bpy.data.objects:      # a sealed, cleaned floor: polished concrete that carries the tube reflections
        if o.name in ('Floor',):
            set_mat(o, mat_concrete('PolishedFloor', base=(0.16, 0.165, 0.17), wet=0.0, scale=1.0, contrast=0.35))
    pf = bpy.data.materials['PolishedFloor']
    for n in pf.node_tree.nodes:
        if n.bl_idname == 'ShaderNodeBump':
            n.inputs['Strength'].default_value = 0.05
    principled(pf).inputs['Coat Weight'].default_value = 0.35
    principled(pf).inputs['Coat Roughness'].default_value = 0.12
    for sx in (-1, 1):       # cold grazing wash along the far half of each wall (fixture spill on the boxes)
        light('AREA', f'ColdGraze{sx}', (sx * 0.5, 4.3, 2.85), energy=9.0, color=kelvin(6400), size=0.12, size_y=3.4,
              shape='RECTANGLE', target=(sx * 1.25, 4.3, 1.0))
    light('AREA', 'DoorCold', (0.0, 4.9, 2.6), energy=4.0, color=kelvin(6200), size=0.6, target=(0.0, 6.3, 1.0))
    foc = empty('FocusS41', (0.0, 3.4, 1.2))
    cam = lens_cam('CamS41', 24, 5.6, foc)
    cam.location = (0.0, -0.42, 1.42)
    look_at(cam, (0.0, 6.3, 1.18))
    motes('Motes', 220, (-1.1, 0.0, 0.2), (1.1, 6.0, 2.7), r=(0.0007, 0.0016), seed=41)

elif SHOT == 'S21':
    # The sweat beat (daytime). Rack: the wall camera and its red status LED -> the heat/motion sensor in the ceiling
    # corner as a fine hair-spray mist drifts across its lens -> back to the camera.
    build_room(M, door='open', ante_energy=26.0, ante_kelvin=6000)
    walls('before')
    pir, ls, cc = sensors(taped=False)
    fx = fixtures(strength=3.0, energy=22.0, kelv=6000, tube_color=(0.83, 0.89, 1.0))
    light('AREA', 'DayFill', (0.2, 4.6, 1.2), energy=16.0, color=kelvin(6500), size=1.2, target=(1.0, 6.1, 2.6))
    light('AREA', 'EndWash', (0.45, 5.3, 2.82), energy=12.0, color=kelvin(6000), size=0.6, target=(0.9, 6.2, 2.3))
    lens_c = pir['lens_center']
    led_c = cc['led_world']
    cam_front = cc['root'].matrix_world @ Vector((0, 0.135, 0.0))
    # mist: two puffs of droplets rising from below-left across the lens, expanding and thinning out
    rng = random.Random(21)
    spray = M['spray']
    for k, (f0, f1, dly) in enumerate(((100, 200, 0.0), (116, 206, 0.015))):
        bm = bmesh.new()
        for i in range(260 if k == 0 else 160):
            p = Vector((rng.gauss(0, 0.022), rng.gauss(0, 0.022), rng.gauss(0, 0.028)))
            rad = rng.uniform(0.0002, 0.0007) * (1.0 if rng.random() < 0.9 else 1.4)
            res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rad)
            bmesh.ops.translate(bm, verts=res['verts'], vec=p)
        puff = from_bmesh(f'Mist{k}', bm, None, smooth=True)
        set_mat(puff, spray)
        try:
            puff.visible_shadow = False
        except Exception:
            pass
        start = lens_c + Vector((-0.17, -0.16, -0.36 - dly))
        mid = lens_c + Vector((-0.005, -0.03, -0.012))
        end = lens_c + Vector((0.09, 0.03, 0.12))
        key(puff, 'location', [(f0, tuple(start)), ((f0 + f1) // 2, tuple(mid)), (f1, tuple(end))])
        key(puff, 'scale', [(f0 - 1, (0.0,) * 3), (f0, (0.45,) * 3), ((f0 + f1) // 2, (1.2,) * 3), (f1, (2.4,) * 3),
                            (f1 + 1, (0.0,) * 3)])
        key(puff, 'rotation_euler', [(f0, (0, 0, 0)), (f1, (0.6, 0.3, 1.1))])
    haze = prim('sphere', 'MistHaze', tuple(lens_c + Vector((-0.04, -0.06, -0.08))), seg=16, ring=8, r=0.07)
    hm = mat_volume('MistVol', density=0.0, color=(0.9, 0.9, 0.88), anisotropy=0.3, noise_scale=30.0,
                    contrast=(0.3, 0.7))
    sc.cycles.volume_step_rate = 1.0      # the haze is tiny: fine steps are cheap here
    set_mat(haze, hm)
    try:
        haze.visible_shadow = False
    except Exception:
        pass
    dens = next(n for n in hm.node_tree.nodes if n.bl_idname == 'ShaderNodeMath')
    key_socket(dens.inputs[1], [(1, 0.0), (106, 0.0), (140, 9.0), (172, 4.0), (208, 0.0)])
    key(haze, 'location', [(104, tuple(lens_c + Vector((-0.06, -0.08, -0.12)))), (205, tuple(lens_c + Vector((0.05, 0.0, 0.08))))])
    key(haze, 'scale', [(104, (0.6,) * 3), (205, (1.6,) * 3)])
    # the coat it leaves: a faint glossy film + a few beads on the lens facets
    key_socket(M['fresnel_coat'], [(1, 0.0), (138, 0.0), (172, 0.55)])
    lm = pir['lens'].matrix_world
    for i in range(34):
        u = rng.uniform(-0.024, 0.024)
        zz = rng.uniform(-0.045, 0.012)
        yy = 0.0012 + 0.0085 * math.cos(math.pi * u / 0.054) + 0.0016
        b = prim('sphere', 'Bead', tuple(lm @ Vector((u, yy, zz))), seg=10, ring=6, r=rng.uniform(0.0003, 0.0008))
        set_mat(b, spray)
        t0 = rng.randint(136, 168)
        key(b, 'scale', [(1, (0.0, 0.0, 0.0)), (t0, (0.0, 0.0, 0.0)), (t0 + 4, (1.0, 1.0, 0.55))])
    # camera: medium close on the wall camera; push/pan to the sensor while focus racks; back again
    foc = empty('FocusS21', tuple(cam_front))
    key(foc, 'location', [(1, tuple(cam_front)), (72, tuple(cam_front)), (100, tuple(lens_c)), (186, tuple(lens_c)),
                          (214, tuple(cam_front)), (N, tuple(cam_front))])
    cam = lens_cam('CamS21', 50, 1.8, foc)
    p0 = Vector((0.46, 4.98, 2.08))
    tc = cam_front + Vector((0.05, 0, -0.02))
    tp = lens_c + Vector((-0.02, 0, -0.03))
    cam_path(cam, [(1, tuple(p0), tuple(tc), 0.0),
                   (72, tuple(p0 + Vector((0.03, 0.06, 0.01))), tuple(tc), 0.0),
                   (104, tuple(p0 + Vector((0.36, 0.52, 0.34))), tuple(tp), 0.0),
                   (184, tuple(p0 + Vector((0.4, 0.6, 0.37))), tuple(tp), 0.0),
                   (218, tuple(p0 + Vector((0.08, 0.22, 0.03))), tuple(tc), 0.0),
                   (N, tuple(p0 + Vector((0.09, 0.27, 0.03))), tuple(tc), 0.0)])
    eased(cam, 'location')
    eased(cam, 'rotation_euler')
    shake(cam, 0.0012, 0.0008, scale=14, seed=21)
    motes('Motes', 120, (0.3, 5.2, 1.7), (1.2, 6.15, 2.85), r=(0.0003, 0.0009), seed=22, drift=(0.02, 0.0, 0.03),
          end=N)

# ============================================================================= THE NIGHT

elif SHOT == 'S26':
    # Dark room, door open, the antechamber spill the only light. A white EPS sheet glides in through the doorway and
    # along the right wall under the heat/motion sensor, always facing it (no person). Camera cranes up to the light
    # sensor on the ceiling: a strip of black tape over it.
    build_room(M, door='open', ante_energy=34.0, ante_kelvin=5200)
    walls('before')
    pir, ls, cc = sensors(taped=True, led=False)
    fx = fixtures(on=(0, 0, 0))
    # spill bounce: the lit floor patch inside the doorway throws a little light back up (keeps the ceiling readable)
    ante_spill()
    # bounce from the lit floor patch / boxes, placed off the foam's path so nothing gets a near-field hot spot
    light('AREA', 'SpillBounce', (-0.5, 5.0, 0.01), (0, 0, 0), energy=6.0, color=kelvin(5000), size=1.0, size_y=1.2,
          shape='RECTANGLE', target=(-0.25, 4.9, 2.9))
    light('AREA', 'CornerBounce', (-1.0, 4.7, 2.0), energy=3.0, color=kelvin(5000), size=0.8, target=PIR_CORNER)
    foam = foam_sheet(M)
    pirw = Vector(pir['root'].location)

    def face_pir(xy):
        d = Vector((pirw.x - xy[0], pirw.y - xy[1]))
        return math.atan2(-d.x, d.y)        # local +Y of the sheet toward the sensor

    path = [(1, (0.0, 7.0)), (40, (0.08, 6.1)), (100, (0.5, 5.35)), (160, (0.68, 4.7)), (210, (0.72, 4.15)),
            (N, (0.74, 3.7))]
    for f, (x, y) in path:
        foam.location = (x, y, 0.13)
        foam.keyframe_insert('location', frame=f)
        yaw = 0.0 if f <= 40 else face_pir((x, y))
        foam.rotation_euler = (0.0, 0.0, yaw)
        foam.keyframe_insert('rotation_euler', frame=f)
    eased(foam, 'location')
    # carried: a slow bob at walking cadence and a slight sway (no carrier visible)
    for fc in fcurves(foam):
        if fc.data_path == 'location' and fc.array_index == 2:
            m = fc.modifiers.new('NOISE')
            m.scale, m.strength, m.phase = 9.0, 0.022, 3.0
        if fc.data_path == 'rotation_euler' and fc.array_index in (0, 1):
            m = fc.modifiers.new('NOISE')
            m.scale, m.strength, m.phase = 14.0, 0.02, 7.0 + fc.array_index
    lsw = Vector(LIGHT_SENSOR)
    foc = empty('FocusS26', (0.4, 5.2, 1.0))
    key(foc, 'location', [(1, (0.05, 6.2, 1.0)), (100, (0.5, 5.35, 1.0)), (150, (0.66, 4.85, 1.1)),
                          (226, tuple(lsw)), (N, tuple(lsw))])
    cam = lens_cam('CamS26', 28, 2.0, foc)
    cam_path(cam, [(1, (-0.66, 1.2, 0.5), (0.3, 6.1, 1.3), 0.0),
                   (125, (-0.6, 1.75, 0.58), (0.6, 5.0, 1.45), 0.0),
                   (232, (-0.34, 4.5, 2.3), tuple(lsw + Vector((0.03, 0.06, 0.0))), 0.0),
                   (N, (-0.335, 4.52, 2.31), tuple(lsw + Vector((0.03, 0.06, 0.0))), 0.0)])
    eased(cam, 'location')
    eased(cam, 'rotation_euler')
    shake(cam, 0.002, 0.0012, scale=12, seed=26)
    motes('Motes', 300, (-1.0, 3.5, 0.1), (1.0, 6.2, 2.6), r=(0.0006, 0.0016), seed=26, drift=(0.02, -0.03, 0.04),
          end=N)

elif SHOT == 'S27':
    # The tubes strike (starter-ballast flicker), the crank tool draws the first door, then the boxes go in an even
    # wave down the wall: door k (1..109) starts its snap at OPEN_F[k-1] (default 30 + 2(k-1) -> 30..246), so a linear
    # counter 001..109 syncs. --wave_start 7 spreads them over the whole cut instead (interval (246-7)/108).
    build_room(M, door='open', ante_energy=34.0, ante_kelvin=5200)
    right, left = walls('before')
    sensors(taped=True, led=False)
    fx = fixtures(on=(0, 0, 0))
    ante_spill()
    key_l = cream_key(pos=(-1.05, -0.35, 2.6), aim=(1.2, 2.6, 1.3), energy=0.0)
    bounce = light('AREA', 'Bounce', (0.0, -0.4, 0.6), energy=0.0, color=kelvin(5200), size=2.0, target=(0.5, 2.5, 0.8))
    pats = [[(1, 0.0), (5, 0.04), (9, 1.0), (10, 0.35), (11, 0.0), (15, 1.0), (17, 0.0), (19, 0.9), (20, 1.0),
             (21, 0.93), (22, 1.0)],
            [(1, 0.0), (7, 0.03), (12, 1.0), (13, 0.0), (18, 0.6), (19, 1.0), (20, 0.2), (23, 1.0), (24, 0.95),
             (25, 1.0)],
            [(1, 0.0), (6, 0.03), (14, 0.8), (15, 0.0), (21, 1.0), (22, 0.0), (25, 1.0), (26, 0.86), (27, 1.0)]]
    flicker(fx[0], pats[0], extra=[(key_l, 38.0)])
    flicker(fx[1], pats[1], extra=[(bounce, 2.5)])
    flicker(fx[2], pats[2])
    # the crank tool on door (c=3, r=6)
    TC, TR = 3, 6
    tool = crank_tool(M, TC, TR)
    doors = {(c, r): d for d, c, r, st in right['doors']}
    WS = arg('--wave_start', 30, int)
    LAST = N - 6
    OPEN_F = [WS + (LAST - WS) * k / 108.0 for k in range(109)]
    # crank: ~3 turns, slowing under load; the screw draws out; the door bulges, then gives at OPEN_F[0]
    f_pop = OPEN_F[0]
    key(tool['crank'], 'rotation_euler', [(1, 0.0), (4, 0.0), (f_pop - 2, -2 * math.pi * 3.1), (f_pop + 3, -2 * math.pi * 3.45)],
        index=0)
    for fc in fcurves(tool['crank']):
        for kp in fc.keyframe_points:
            kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
    key(tool['screw'], 'location', [(1, 0.0), (4, 0.0), (f_pop - 1, -0.009), (f_pop + 1, -0.034), (f_pop + 4, -0.031)],
        index=0)
    pv1 = doors[TC, TR].parent
    key(pv1, 'rotation_euler', [(1, 0.0), (6, 0.0), (f_pop - 1, math.radians(2.2)), (f_pop + 1, math.radians(12.5)),
                                (f_pop + 3, math.radians(10.0)), (f_pop + 6, math.radians(11.0))], index=2)
    key(tool['root'], 'rotation_euler', [(f_pop - 1, (0, 0, 0)), (f_pop + 1, (0.012, -0.01, 0.02)), (f_pop + 5, (0.003, -0.002, 0.005))])
    # the wave: 108 more doors, columns 3..21, near -> far, rows mixed
    rng = random.Random(2703)
    cand = [(c, r) for c in range(3, 22) for r in range(13) if (c, r) != (TC, TR)]
    rng.shuffle(cand)
    pick = sorted(cand[:108], key=lambda cr: cr[0] + rng.uniform(0.0, 2.6))
    order = [(TC, TR)] + pick
    for k, (c, r) in enumerate(order[1:], start=1):
        pv = doors[c, r].parent
        f0 = OPEN_F[k]
        roll = rng.random()
        ang = math.radians(rng.choice([rng.uniform(10, 35), rng.uniform(75, 120), rng.uniform(120, 168),
                                       rng.uniform(120, 168)]))
        # the snap straddles f0: closed at f0-1, mid-swing (motion-blurred) on f0, home by f0+7
        key(pv, 'rotation_euler', [(1, 0.0), (f0 - 1, 0.0), (f0 + 1, ang * 0.9), (f0 + 2, ang * 1.05), (f0 + 4, ang * 0.97),
                                   (f0 + 7, ang)], index=2)
        if roll < 0.22:      # sprung / bent on its hinge
            d = doors[c, r]
            d.rotation_euler = (rng.uniform(-0.12, 0.12), 0, rng.uniform(-0.15, 0.15))
            d.keyframe_insert('rotation_euler', frame=f0)
            d.rotation_euler = (0, 0, 0)
            d.keyframe_insert('rotation_euler', frame=f0 - 1)
    if arg('--counter_json'):
        rows = [{'n': k + 1, 'col': c, 'row': r, 'snap_frame': round(OPEN_F[k], 2)} for k, (c, r) in enumerate(order)]
        out = {'shot': 'S27', 'cut': [7, N - 6], 'rule': 'snap_frame(n) = WS + (246 - WS) * (n - 1) / 108; with WS = 30: 30 + 2 (n - 1)',
               'wave_start': WS, 'counter': 'show n from frame snap_frame(n): the door is closed on the frame before, '
                                             'mid-swing (blurred) on snap_frame, settled by snap_frame + 7',
               'doors': rows}
        with open(os.path.join(FF, 'notes', 'room_S27_counter.json'), 'w') as fh:
            json.dump(out, fh, indent=1)
    # camera: three-quarter view down the right wall, the tool large in the foreground; slow pull back and pan as the
    # wave runs away; focus follows the wave front
    lock = door_lock_point(TC, TR)
    foc = empty('FocusS27', tuple(lock + Vector((-0.08, 0, 0))))
    key(foc, 'location', [(1, tuple(lock + Vector((-0.08, 0, 0)))), (int(f_pop) + 8, tuple(lock + Vector((-0.08, 0, 0)))),
                          (150, (1.2, 2.6, 1.3)), (LAST, (1.2, 4.6, 1.3))])
    cam = lens_cam('CamS27', 30, 2.8, foc)
    cam_path(cam, [(1, (0.3, -0.4, 1.3), (1.2, 1.7, 1.38), 0.0),
                   (int(f_pop) + 6, (0.28, -0.42, 1.31), (1.2, 1.85, 1.38), 0.0),
                   (N, (0.06, -0.52, 1.4), (1.15, 3.7, 1.3), 0.0)])
    eased(cam, 'location')
    eased(cam, 'rotation_euler')
    shake(cam, 0.0015, 0.001, scale=12, seed=27)
    motes('Motes', 300, (-1.0, 0.0, 0.3), (1.1, 5.0, 2.6), r=(0.0007, 0.0018), seed=27, drift=(0.02, 0.02, 0.04), end=N)

# ============================================================================= AFTER

elif SHOT == 'S02':
    # Descent along the forced wall to the floor: torn envelopes, an emptied pouch, a passport, a ring.
    build_room(M, door='open')
    walls('after')
    sensors(taped=True, led=False)
    hero = (0.8, 2.62)
    debris_after(avoid=[(hero[0], hero[1], 0.34)])
    torn_envelope(M, 'HEnv0', (0.74, 2.66, 0.0), 0.35, mat=M['white_env'], seed=1)
    torn_envelope(M, 'HEnv1', (0.93, 2.47, 0.0012), -1.1, mat=M['kraft'], seed=2, strip=False)
    pouch_empty(M, 'HPouch', (0.62, 2.48, 0.0), 2.3, mat=M['velvet_b'], seed=3)
    passport(M, 'HPass', (0.9, 2.79, 0.0), -0.45, open_deg=14)
    ring_jewel(M, 'HRing', (0.76, 2.53, 0.0031), 0.9)
    diamond_paper(M, 'HDp', (1.02, 2.66, 0.0), 1.2, open_a=0.7, seed=4)
    fx = fixtures()
    cream_key()
    light('AREA', 'Bounce', (0.0, -0.4, 0.6), energy=2.5, color=kelvin(5200), size=2.0, target=(0.5, 2.5, 0.8))
    light('AREA', 'FloorKick', (0.2, 3.6, 0.9), energy=4.0, color=kelvin(4200), size=0.4, target=(0.8, 2.6, 0.0))
    ringw = Vector((0.76, 2.53, 0.004))
    foc = empty('FocusS02', (1.15, 1.6, 2.2))
    key(foc, 'location', [(1, (1.15, 1.7, 2.2)), (120, (1.1, 2.6, 1.1)), (205, (0.85, 2.7, 0.03)),
                          (232, tuple(ringw)), (N, tuple(ringw))])
    cam = lens_cam('CamS02', 28, 2.2, foc)
    cam_path(cam, [(1, (0.7, -0.2, 2.55), (1.15, 3.3, 1.95), 0.03),
                   (125, (0.62, 0.95, 1.45), (1.05, 3.1, 0.85), 0.015),
                   (232, (0.52, 2.16, 0.34), (0.77, 2.6, 0.0), 0.0),
                   (N, (0.515, 2.175, 0.335), (0.765, 2.6, 0.0), 0.0)])
    eased(cam, 'location')
    eased(cam, 'rotation_euler')
    shake(cam, 0.002, 0.001, scale=12, seed=2)
    motes('Motes', 400, (-1.1, 0.0, 0.1), (1.1, 5.0, 2.6), r=(0.0008, 0.002), seed=4, drift=(0.02, 0.02, 0.05), end=N)

elif SHOT == 'S34':
    # Monday morning: the room dark, a torch beam sweeps the debris floor and finds the foot of the forced wall.
    build_room(M, door='open', ante_energy=12.0, ante_kelvin=5600)
    walls('after')
    sensors(taped=True, led=False)
    debris_after(avoid=[(0.15, 3.0, 0.55)])
    sorted_loot(M, (0.15, 3.0))
    fx = fixtures(on=(0, 0, 0))
    aim = empty('TorchAim', (-0.55, 2.5, 0.0))
    key(aim, 'location', [(1, (-0.75, 2.35, 0.0)), (20, (-0.55, 2.6, 0.0)), (78, (0.75, 3.55, 0.05)),
                          (N, (1.05, 3.9, 0.28))])
    eased(aim, 'location')
    tpos = empty('TorchPos', (-1.0, 0.85, 1.42))
    key(tpos, 'location', [(1, (-1.02, 0.8, 1.42)), (N, (-0.9, 1.05, 1.38))])
    shake(tpos, 0.004, 0.0, scale=7, seed=34)
    core = light('SPOT', 'TorchCore', (0, 0, 0), energy=150.0, color=kelvin(3700), spot=17.0, blend=0.4, radius=0.012)
    spill = light('SPOT', 'TorchSpill', (0, 0, 0), energy=55.0, color=kelvin(3600), spot=50.0, blend=1.0, radius=0.02)
    ante_spill(energy=22.0, kelv=5600)
    for L in (core, spill):
        L.parent = tpos
        track_to(L, aim)
        try:
            L.visible_volume_scatter = True
        except Exception:
            pass
    dust = volume_box('BeamDust', (0.0, 2.6, 0.9), (2.4, 3.6, 1.8),
                      mat_volume('Dust', density=0.13, color=(0.85, 0.84, 0.82), anisotropy=-0.1, noise_scale=3.0,
                                 contrast=(0.35, 0.8)))
    sc.cycles.volume_step_rate = 6.0
    foc = empty('FocusS34', (-0.2, 2.6, 0.0))
    key(foc, 'location', [(1, (-0.35, 2.55, 0.0)), (78, (0.6, 3.4, 0.0)), (N, (0.85, 3.75, 0.1))])
    cam = lens_cam('CamS34', 28, 2.8, foc)
    cam_path(cam, [(1, (-0.62, 1.45, 0.42), (0.45, 3.6, 0.0), 0.02), (N, (-0.52, 1.7, 0.4), (0.6, 3.75, 0.02), 0.0)])
    eased(cam, 'location')
    shake(cam, 0.0018, 0.001, scale=10, seed=35)

elif SHOT == 'S28':
    # The floor where they sorted the haul (lights on): envelope heap, opened diamond papers, emptied cases and trays,
    # passports and cards, emptied pouches, two rings left behind. Low across the floor toward the forced wall.
    build_room(M, door='open')
    walls('after')
    sensors(taped=True, led=False)
    C = (0.15, 3.0)
    debris_after(avoid=[(C[0], C[1], 0.78)])
    sorted_loot(M, C)
    fx = fixtures()
    cream_key(pos=(-0.35, 4.5, 1.9), aim=(0.15, 2.9, 0.0), energy=30.0, size=0.3)   # side-back: paper edges catch it
    light('AREA', 'Bounce', (0.0, -0.4, 0.6), energy=2.5, color=kelvin(5200), size=2.0, target=(0.5, 2.5, 0.8))
    foc = empty('FocusS28', (C[0] - 0.42, C[1] + 0.06, 0.01))
    cam = lens_cam('CamS28', 32, 2.8, foc)
    cam.location = (-0.88, 2.84, 0.3)
    look_at(cam, (0.62, 3.12, 0.04))

elif SHOT == 'S45a':
    # Counter-evidence: the light sensor on the ceiling under black tape, the room lights burning right beside it.
    build_room(M, door='open')
    walls('after')
    sensors(taped=True, led=False)
    debris_after()
    fx = fixtures()
    cream_key()
    light('AREA', 'Bounce', (0.0, -0.4, 0.6), energy=2.5, color=kelvin(5200), size=2.0, target=(0.5, 2.5, 0.8))
    light('AREA', 'FloorBounce', (-0.2, 4.4, 0.05), energy=22.0, color=kelvin(4400), size=1.4, target=(-0.2, 4.8, 2.9))
    lsw = Vector(LIGHT_SENSOR)
    foc = empty('FocusS45a', tuple(lsw + Vector((0, 0, -0.016))))
    cam = lens_cam('CamS45a', 40, 2.8, foc)
    cam.location = (0.05, 4.48, 2.42)
    look_at(cam, (-0.17, 4.9, 2.87))

elif SHOT == 'S45b':
    # Counter-evidence: the sorted loot on the lit floor, seen from above like a scene photograph.
    build_room(M, door='open')
    walls('after')
    sensors(taped=True, led=False)
    C = (0.15, 3.0)
    debris_after(avoid=[(C[0], C[1], 0.78)])
    sorted_loot(M, C)
    fx = fixtures()
    cream_key(pos=(-1.1, 3.7, 1.15), aim=(0.15, 3.0, 0.0), energy=30.0, size=0.3)     # raking: every pile casts
    light('AREA', 'Bounce', (0.0, -0.4, 0.6), energy=2.5, color=kelvin(5200), size=2.0, target=(0.5, 2.5, 0.8))
    foc = empty('FocusS45b', (C[0], C[1], 0.0))
    cam = lens_cam('CamS45b', 35, 5.6, foc)
    cam.location = (C[0] - 0.05, C[1] - 0.42, 1.78)
    look_at(cam, (C[0] + 0.02, C[1] + 0.02, 0.0))

elif SHOT == 'S51':
    # Return to the forced wall, wide: one pool of light near camera, the wall receding into darkness (pull back in post).
    build_room(M, door='open', ante_energy=0.0)
    walls('after')
    sensors(taped=True, led=False)
    debris_after()
    fx = fixtures(on=(0, 0, 1))
    cream_key(pos=(-0.55, 5.3, 2.7), aim=(1.25, 3.4, 1.3), energy=46.0, size=0.3)
    foc = empty('FocusS51', (1.2, 3.6, 1.2))
    cam = lens_cam('CamS51', 24, 4.0, foc)
    cam.location = (-0.78, 5.75, 1.18)
    look_at(cam, (0.95, 1.4, 1.05))

finish(f'{SHOT}')
