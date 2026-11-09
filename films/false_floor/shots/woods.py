"""S5 WOODS OFF THE E19 — shots S31 (3D night throw), S33 / S35 / S36 (3DS stills, 2560x1440).

    python3 films/tumbler/tools/rb.py films/false_floor/shots/woods.py -- --shot S36 --stills 1 --pct 30 --samples 12
    python3 films/tumbler/tools/rb.py films/false_floor/shots/woods.py -- --shot S31 --stills 7,90,246 --pct 30 --samples 12

S31  3D  252 frames (cut 7..246): night woods, fog between trunks, two torn bin bags thrown in from the motorway side,
         land, tear and spill paper; cold moonless sky + distant sodium glow. Slow push-in, motion blur.
S33  3DS one frame: same woods, grey morning, a path, a walking stick leaning against a beech.
S35  3DS one frame: the torn bags in daylight, contents spread across the leaves.
S36  3DS one frame: the macro tableau (SF2 composition) with ~15% safe room for a slow push.
Flags: --debuglight (flat light, no DOF/fog), --nodof, --seed N.
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
from woods import *

SHOT = arg('--shot', 'S36')
DEBUG = bool(arg('--debuglight'))
SEED = arg('--seed', 7, int)
RES_3DS = (2560, 1440)

if SHOT == 'S36':
    # SF2 composition on the 50 mm "layout" lens; rendered on 50 * 0.75 = 37.5 mm so the SF2 frame sits inside the
    # central ~75% (push room). f/2.8 at 37.5 mm keeps roughly SF2's background blur.
    CAM = dict(h=0.12, pitch=5.0, yaw=0.0, lens=50.0, fstop=4.5, roll=0.4, dolly=((0.0, 0.0), (0.0, 0.0)), frames=1)
    GROUND = dict(seed=3, rise_start=2.6, rise_slope=0.06, near=(-2.0, 2.0, 0.2, 3.6), puddles=[])
    LAYOUT = dict(
        sandwich=(0.16, -0.36), sandwich_delta=14.0, sandwich_mirror=True,
        bag=(-0.40, 0.16), bag_size=(0.26, 0.19, 0.10),
        envelope=(-0.70, -0.10, 0.45), receipt=(-0.66, -0.50, -0.55), document=(0.74, 0.02, 2.3),
        puddle=(-0.86, -0.50, 0.09, 0.06, 0.014),
        stones=[(-0.08, -0.72, 0.0062), (0.62, -0.74, 0.0074), (-0.18, -0.34, 0.0052), (-0.30, -0.08, 0.0046),
                (0.56, -0.30, 0.0044), (-0.62, -0.78, 0.0056)],
    )
    FOG.update(color=(0.43, 0.45, 0.47), strength=1.0, start=2.0, dist=6.0, refl=0.3)
    T = build_tableau(dict(CAM=CAM, GROUND=GROUND, LAYOUT=LAYOUT, LEAVES=dict(n1=4300, n2=1500, on_bag=7),
                           LITTER_Z=0.012, SEED=SEED, DEBUG=DEBUG, DOLLY=False, NODOF=bool(arg('--nodof')),
                           RES=RES_3DS, SAMPLES=48, LENS_K=0.75, FSTOP=2.8))

if SHOT in ('S35', 'S33'):
    sc = reset()
    setup_render(1, 1, res=RES_3DS, samples=48, mb=False, look='Medium High Contrast', bounces=(2, 2, 3), clamp=5.0,
                 filter_glossy=0.6, adaptive=0.03, exposure=-0.35)
    sc.cycles.transparent_max_bounces = 8
    rng = random.Random(SEED)
    C_LEAF, C_PROP, C_BG = collection('Leaves'), collection('Props'), collection('Background')
    M = make_materials()

    def aim(loc, pitch, yaw=0.0):
        p_, y_ = math.radians(pitch), math.radians(yaw)
        loc = Vector(loc)
        return loc, loc + Vector((math.sin(y_) * math.cos(p_), math.cos(y_) * math.cos(p_), -math.sin(p_)))

if SHOT == 'S35':
    # the torn bags in daylight: low standing-height-ish view (a walker crouching), bags 2-3 m out, contents fanned
    FOG.update(color=(0.43, 0.45, 0.47), strength=1.0, start=3.6, dist=8.0, refl=0.3)
    M['soil'] = mat_soil('SoilS35', far_from=5.2, far_to=7.5)
    loc, tgt = aim((0.0, 0.0, 0.62), 15.0, 2.0)
    rig = CamRig(loc, tgt, lens=35.0)
    G = lambda u, v: tuple(rig.ground(u, v, 0.008))[:2]
    GROUND = dict(seed=5, rise_start=5.0, rise_slope=0.05, near=(-3.0, 3.0, 0.6, 7.2), puddles=[])
    hf = HField(*GROUND['near'], cell=0.008)
    protos, dens, L1 = forest_floor(GROUND, hf, [rig], M, C_LEAF, C_BG, rng, 6200, SEED, fade=(3.6, 6.5))
    print(f'[info] S35 litter {len(L1)}', flush=True)
    twigs = []
    for i, (u, v, yaw, L, r) in enumerate([(-0.8, -0.7, 0.4, 0.6, 0.006), (0.55, -0.55, 2.4, 0.45, 0.004),
                                            (0.1, 0.35, 0.2, 0.8, 0.007), (-0.35, -0.3, 1.2, 0.35, 0.0035),
                                            (0.85, 0.05, 1.9, 0.5, 0.005)]):
        x, y = G(u, v)
        twigs += build_twig(f'Twig{i}', hf, (x, y), yaw, L, r, M['twig'], C_PROP, seed=60 + i, branches=3)
    hf.stamp_object(twigs, block=False)
    hf.make_smooth()
    bags = []
    spill = []
    cam_xy = (loc.x, loc.y)
    for name, (u, v), size, seed, turn, items in [
            ('BagA', (-0.06, -0.14), (0.34, 0.25, 0.13), 11, 35,
             ['envelope', 'receipt', 'envelope', 'document', 'packet', 'packet', 'wad', 'wad', 'receipt', 'wad',
              'stone', 'stone', 'stone', 'stone', 'envelope']),
            ('BagB', (0.40, 0.20), (0.30, 0.22, 0.12), 23, -40, ['document', 'envelope', 'wad', 'receipt', 'packet']),
            ('BagC', (-0.48, 0.16), (0.36, 0.27, 0.05), 31, 10, ['wad', 'envelope', 'receipt'])]:
        bx, by = G(u, v)
        mouth_local = (-0.55, -0.8, 0.15)
        to_cam = math.atan2(cam_xy[1] - by, cam_xy[0] - bx) + math.radians(turn)
        yaw = to_cam - math.atan2(mouth_local[1], mouth_local[0])
        b = build_binbag(hf, (bx, by), yaw, M['bag'], C_PROP, size=size, mouth=mouth_local, seed=seed, name=name)
        knot(name + 'Knot', Vector(b['neck']), 0.024, M['bag'], C_PROP, seed=seed)
        hf.stamp_object(b, block=True)
        hf.make_smooth()
        bags.append(b)
        mx, my = bx + math.cos(to_cam) * size[1] * 1.1, by + math.sin(to_cam) * size[1] * 1.1
        spill += spill_items(hf, (mx, my), (math.cos(to_cam), math.sin(to_cam)), items, M, C_PROP, rng,
                             reach=(0.08, 0.75 if name == 'BagA' else 0.45), spread=0.9)
    L2 = scatter_leaves(hf, protos, 1600, rng, C_LEAF, dens, avoid=True, name='Leaf2')
    for b in bags:
        bx, by = b.location.x or 0, 0
    for o in spill[:12]:
        if o.get('kind') in ('envelope', 'receipt', 'document') and rng.random() < 0.6:
            me = o.data
            v = me.vertices[rng.randrange(len(me.vertices))].co
            place_leaf(hf, protos[rng.randrange(len(protos))], v.x, v.y, rng, C_LEAF, scale=0.9, flip=False,
                       max_tilt=20, quant=0.66, name='LeafSheet')
    droplets_on(bags[0], 300, 0.0012, 0.0035, M['drop'], C_PROP, seed=8, normal_min=0.35, name='BagDrops')
    pts, _ = trunk_field(GROUND, M, C_BG, random.Random(SEED + 99), 38, 4.8, 34.0, xk=0.7, xpad=2.0,
                         fixed=[(-1.75, 3.7, 0.27), (2.3, 5.4, 0.22)])
    lx, ly = G(0.25, 0.62)
    lz = float(ground_height(np.array([lx]), np.array([ly]), GROUND)[0])
    tube_mesh('Log', [(lx - 1.8 + 3.6 * k / 24, ly + 0.4 * math.sin(k / 24 * 2.0), lz + 0.08) for k in range(25)],
              [0.13 - 0.04 * k / 24 for k in range(25)], 20, C_BG, M['bark'], noise_amp=0.08, seed=3)
    daylight(DEBUG, key=((1.5, 9.0, 7.5), (0.0, 2.5, 0.0)), key_e=1100, key_size=(12.0, 8.0),
             fill=((-1.6, -2.2, 1.6), (0.0, 2.0, 0.0)), fill_e=40)
    cam = camera('CamS35', lens=35.0, fstop=None if (DEBUG or arg('--nodof')) else 4.0, ratio=1.0, blades=9,
                 clip=(0.02, 300))
    cam.location = loc
    cam.rotation_euler = look_rot(loc, tgt, math.radians(0.3))
    foc = empty('FocusS35', (G(-0.06, -0.14)[0], G(-0.06, -0.14)[1], 0.08), C_PROP)
    if cam.data.dof.use_dof:
        cam.data.dof.focus_object = foc

elif SHOT == 'S33':
    # the same woods, grey morning: a worn path into the fog; a walking stick leaning on a beech by the path
    FOG.update(color=(0.43, 0.45, 0.47), strength=1.0, start=4.0, dist=9.0, refl=0.3)
    M['soil'] = mat_soil('SoilS33', far_from=9.0, far_to=13.0)
    M['stick'] = mat_stick()
    M['rubber'] = mat_rubber('Ferrule', color=(0.012, 0.012, 0.013), rough=0.6)
    loc, tgt = aim((0.0, 0.0, 1.12), 7.0, 0.0)
    rig = CamRig(loc, tgt, lens=40.0)

    def xc(y):
        y = np.asarray(y, float)
        return -0.25 + 0.6 * np.sin((y - 2.0) * 0.17) + 0.35 * np.sin((y - 2.0) * 0.06 + 1.0) - 0.35

    def path_w(x, y):
        return 1.0 - _smoothstep(0.30, 0.58, np.abs(np.asarray(x) - xc(y)))

    from woods import _smoothstep
    GROUND = dict(seed=8, rise_start=9.0, rise_slope=0.04, near=(-5.0, 5.0, 2.2, 16.0), puddles=[],
                  trough=lambda X, Y: 0.035 * path_w(X, Y))
    hf = HField(*GROUND['near'], cell=0.012)
    protos, dens, L1 = forest_floor(GROUND, hf, [rig], M, C_LEAF, C_BG, rng, 7000, SEED, fade=(6.0, 12.0),
                                    extra_dens=lambda x, y: 1.0 - 0.88 * path_w(x, y), ground_res=0.03,
                                    attr_fn=lambda X, Y: {'path': path_w(X, Y)}, scale=(0.9, 1.2), floor=0.3)
    print(f'[info] S33 litter {len(L1)}', flush=True)
    # the beech with the stick: right of the path, ~4.3 m out
    ty = 4.3
    tx = float(xc(ty)) + 0.95
    tr = 0.33
    pts, _ = trunk_field(GROUND, M, C_BG, random.Random(SEED + 77), 64, 3.0, 42.0, xk=0.75, xpad=2.5, min_d=1.7,
                         keep_out=lambda x, y: abs(x - float(xc(y))) < 0.9 or (y < 8 and abs(x - float(xc(y))) < 1.3),
                         fixed=[(tx, ty, tr), (-2.4, 3.4, 0.24), (2.9, 6.6, 0.28)])
    tz = float(ground_height(np.array([tx]), np.array([ty]), GROUND)[0])
    to_cam = Vector((loc.x - tx, loc.y - ty, 0)).normalized()
    side = Vector((-to_cam.y, to_cam.x, 0))
    contact = Vector((tx, ty, tz)) + (to_cam * 0.82 - side * 0.55) * (tr + 0.012) / (to_cam * 0.82 - side * 0.55).length
    contact.z = tz + 1.06
    foot = contact + (to_cam * 0.82 - side * 0.55).normalized() * 0.36
    foot.z = float(hf.sample_s(np.array([foot.x]), np.array([foot.y]))[0]) + 0.005
    stick_root, stick = walking_stick('WalkingStick', tuple(foot), tuple(contact), M['stick'], M['rubber'], C_PROP)
    stick_root.rotation_euler.rotate_axis('Z', math.radians(150))
    # fallen branches along the path edges
    for i, (y, off, yaw, L, r) in enumerate([(3.4, -0.75, 0.3, 0.9, 0.012), (5.2, 0.7, 2.7, 1.2, 0.016),
                                             (6.8, -0.8, 1.2, 0.7, 0.01), (3.0, 1.2, 2.0, 0.6, 0.008)]):
        x = float(xc(y)) + off
        build_twig(f'Branch{i}', hf, (x, y), yaw, L, r, M['twig'], C_PROP, seed=80 + i, branches=3)
    daylight(DEBUG, key=((0.0, 30.0, 14.0), (0.0, 6.0, 0.0)), key_e=6000, key_size=(20.0, 10.0),
             fill=((-2.0, -2.5, 2.0), (0.0, 4.0, 0.5)), fill_e=60)
    cam = camera('CamS33', lens=40.0, fstop=None if (DEBUG or arg('--nodof')) else 2.8, ratio=1.0, blades=9,
                 clip=(0.05, 400))
    cam.location = loc
    cam.rotation_euler = look_rot(loc, tgt, 0.0)
    foc = empty('FocusS33', tuple(contact), C_PROP)
    if cam.data.dof.use_dof:
        cam.data.dof.focus_object = foc

if SHOT not in ('S36', 'S35', 'S33', 'S31'):
    raise SystemExit(f'unknown shot {SHOT}')

finish(SHOT)
