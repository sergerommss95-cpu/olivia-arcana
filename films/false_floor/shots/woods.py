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
OUTNAME = SHOT
WHO = None
if SHOT == 'EPA_VANCAMP':          # EP v3 stills for Kling: August Van Camp walks his land (S33 woods)
    SHOT, WHO = 'S33', 'walk'
elif SHOT == 'EPA_BAGS':           # ... and stands over the torn bags (S35 woods)
    SHOT, WHO = 'S35', 'look'
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
    protos, dens, L1 = forest_floor(GROUND, hf, [rig], M, C_LEAF, C_BG, rng, 9000, SEED, fade=(3.8, 7.0), floor=0.3)
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
    for name, (u, v), size, seed, turn, opening, items in [
            ('BagA', (-0.10, -0.05), (0.34, 0.25, 0.13), 11, 55, 0.52,
             ['envelope', 'receipt', 'envelope', 'document', 'packet', 'packet', 'wad', 'wad', 'receipt', 'wad',
              'stone', 'stone', 'stone', 'stone', 'envelope']),
            ('BagB', (0.40, 0.24), (0.30, 0.22, 0.12), 23, -50, 0.48, ['document', 'envelope', 'wad', 'receipt', 'packet']),
            ('BagC', (-0.50, 0.22), (0.36, 0.27, 0.05), 31, 10, 0.3, ['wad', 'envelope', 'receipt'])]:
        bx, by = G(u, v)
        mouth_local = (-0.55, -0.8, 0.15)
        to_cam = math.atan2(cam_xy[1] - by, cam_xy[0] - bx) + math.radians(turn)
        yaw = to_cam - math.atan2(mouth_local[1], mouth_local[0])
        b = build_binbag(hf, (bx, by), yaw, M['bag'], C_PROP, size=size, mouth=mouth_local, seed=seed, name=name,
                         opening=opening)
        knot(name + 'Knot', Vector(b['neck']), 0.024, M['bag'], C_PROP, seed=seed)
        hf.stamp_object(b, block=True)
        hf.make_smooth()
        bags.append(b)
        mx, my = bx + math.cos(to_cam) * size[1] * 1.1, by + math.sin(to_cam) * size[1] * 1.1
        spill += spill_items(hf, (mx, my), (math.cos(to_cam), math.sin(to_cam)), items, M, C_PROP, rng,
                             reach=(0.08, 0.6 if name == 'BagA' else 0.4), spread=1.3)
    L2 = scatter_leaves(hf, protos, 1600, rng, C_LEAF, dens, avoid=True, name='Leaf2')
    for o in spill[:12]:
        if o.get('kind') in ('envelope', 'receipt', 'document') and rng.random() < 0.6:
            me = o.data
            v = me.vertices[rng.randrange(len(me.vertices))].co
            place_leaf(hf, protos[rng.randrange(len(protos))], v.x, v.y, rng, C_LEAF, scale=0.9, flip=False,
                       max_tilt=20, quant=0.66, name='LeafSheet')
    droplets_on(bags[0], 300, 0.0012, 0.0035, M['drop'], C_PROP, seed=8, normal_min=0.35, name='BagDrops')
    pts, _ = trunk_field(GROUND, M, C_BG, random.Random(SEED + 99), 30, 5.0, 34.0, xk=0.7, xpad=2.0, min_d=2.3,
                         r=(0.08, 0.32), fixed=[(-1.75, 3.9, 0.24), (2.4, 5.6, 0.2)])
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
    M['soil'] = mat_soil('SoilS33', far_from=-10.0, far_to=-9.0)        # litter mosaic everywhere, mud on the path
    M['stick'] = mat_stick()
    M['rubber'] = mat_rubber('Ferrule', color=(0.012, 0.012, 0.013), rough=0.6)
    loc, tgt = aim((-0.15, 0.6, 0.95), 6.5, 2.0)
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
    protos, dens, L1 = forest_floor(GROUND, hf, [rig], M, C_LEAF, C_BG, rng, 9500, SEED, fade=(5.0, 10.0),
                                    extra_dens=lambda x, y: 1.0 - 0.72 * path_w(x, y), ground_res=0.03,
                                    attr_fn=lambda X, Y: {'path': path_w(X, Y)}, scale=(0.8, 1.25), floor=0.35)
    print(f'[info] S33 litter {len(L1)}', flush=True)
    # the beech with the stick: right of the path, ~4.3 m out
    ty = 4.7
    tx = float(xc(ty)) + 0.9
    tr = 0.26
    pts, _ = trunk_field(GROUND, M, C_BG, random.Random(SEED + 77), 60, 3.5, 42.0, xk=0.75, xpad=2.5, min_d=2.0,
                         r=(0.09, 0.38),
                         keep_out=lambda x, y: abs(x - float(xc(y))) < 1.0 or (y < 9 and abs(x - float(xc(y))) < 1.6),
                         fixed=[(tx, ty, tr), (-2.6, 3.6, 0.2), (3.1, 7.4, 0.3)])
    tz = float(ground_height(np.array([tx]), np.array([ty]), GROUND)[0])
    to_cam = Vector((loc.x - tx, loc.y - ty, 0)).normalized()
    side = Vector((-to_cam.y, to_cam.x, 0))
    contact = Vector((tx, ty, tz)) + (to_cam * 0.82 - side * 0.55) * (tr + 0.012) / (to_cam * 0.82 - side * 0.55).length
    contact.z = tz + 1.06
    foot = contact + (to_cam * 0.82 - side * 0.55).normalized() * 0.36
    foot.z = float(hf.sample_s(np.array([foot.x]), np.array([foot.y]))[0]) + 0.005
    if not WHO:        # the stick stands in for Van Camp only while he is not in the shot (with him it reads as a prop left behind)
        stick_root, stick = walking_stick('WalkingStick', tuple(foot), tuple(contact), M['stick'], M['rubber'], C_PROP,
                                          r=0.0145)
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

if SHOT == 'S31':
    N = 252                                   # render frames incl. 6-frame handles (cut 7..246)
    sc = reset()
    setup_render(1, N, res=RES_FINAL, samples=40, mb=True, shutter=0.5, look='Medium High Contrast', bounces=(2, 2, 3),
                 clamp=4.0, filter_glossy=0.6, adaptive=0.03, exposure=2.5, vol_bounces=0, vol_step=2.0)
    sc.cycles.transparent_max_bounces = 8
    rng = random.Random(SEED)
    C_LEAF, C_PROP, C_BG = collection('Leaves'), collection('Props'), collection('Background')
    M = make_materials()
    M['soil'] = mat_soil('SoilS31', far_from=5.5, far_to=8.0)
    FOG.update(color=(0.0030, 0.0038, 0.0055), strength=1.0, start=2.5, dist=7.0, refl=1.0)

    def aim(loc, pitch, yaw=0.0):
        p_, y_ = math.radians(pitch), math.radians(yaw)
        loc = Vector(loc)
        return loc, loc + Vector((math.sin(y_) * math.cos(p_), math.cos(y_) * math.cos(p_), -math.sin(p_)))
    loc0, tgt0 = aim((0.07, 0.0, 0.44), 4.0, -1.0)
    loc1, tgt1 = aim((-0.02, 0.40, 0.41), 4.5, 0.5)
    rigs = [CamRig(loc0, tgt0, lens=32.0), CamRig(loc1, tgt1, lens=32.0)]
    rig = rigs[0]
    G = lambda u, v: tuple(rig.ground(u, v, 0.008))[:2]
    GROUND = dict(seed=11, rise_start=6.0, rise_slope=0.05, near=(-3.2, 3.2, 0.5, 7.6), puddles=[])
    hf = HField(*GROUND['near'], cell=0.008)
    protos, dens, L1 = forest_floor(GROUND, hf, rigs, M, C_LEAF, C_BG, rng, 7000, SEED, fade=(4.0, 7.0), floor=0.3)
    print(f'[info] S31 litter {len(L1)}', flush=True)
    for i, (u, v, yaw, L, r) in enumerate([(-0.75, -0.6, 0.5, 0.6, 0.006), (0.6, -0.45, 2.3, 0.5, 0.005),
                                            (0.2, 0.05, 0.1, 0.9, 0.008)]):
        x, y = G(u, v)
        build_twig(f'Twig{i}', hf, (x, y), yaw, L, r, M['twig'], C_PROP, seed=70 + i, branches=3)
    # two throws from the motorway side (left, behind): (land u,v, launch offset, flight frames, impact frame)
    throws = [dict(name='Bag1', uv=(-0.30, -0.30), size=(0.33, 0.24, 0.13), seed=11, f_hit=70, flight=15,
                   launch=(-3.0, 2.6, 1.7), spin=(5.0, -2.5, 3.0), turn=40, opening=0.5,
                   items=['envelope', 'receipt', 'document', 'wad', 'wad', 'envelope', 'packet', 'receipt', 'wad',
                          'stone', 'stone']),
              dict(name='Bag2', uv=(0.30, -0.44), size=(0.30, 0.22, 0.12), seed=23, f_hit=128, flight=17,
                   launch=(-3.6, 3.2, 2.0), spin=(-4.0, 3.5, -2.0), turn=-20, opening=0.46,
                   items=['document', 'envelope', 'wad', 'receipt', 'packet', 'envelope', 'wad'])]
    cam_xy = (loc0.x, loc0.y)
    for T_ in throws:
        lx, ly = G(*T_['uv'])
        mouth_local = (-0.55, -0.8, 0.15)
        to_cam = math.atan2(cam_xy[1] - ly, cam_xy[0] - lx) + math.radians(T_['turn'])
        yaw = to_cam - math.atan2(mouth_local[1], mouth_local[0])
        torn = build_binbag(hf, (lx, ly), yaw, M['bag'], C_PROP, size=T_['size'], mouth=mouth_local, seed=T_['seed'],
                            name=T_['name'] + 'Torn', pivot=True, opening=T_['opening'], res=(140, 70))
        kn = knot(T_['name'] + 'Knot', Vector(torn['neck']), 0.024, M['bag'], C_PROP, seed=T_['seed'])
        parent(kn, torn)
        hf.stamp_object(torn, block=True)
        hf.make_smooth()
        T_['torn'], T_['land'], T_['yaw'], T_['dir'] = torn, Vector(torn.location), yaw, to_cam
        mx, my = lx + math.cos(to_cam) * T_['size'][1] * 1.1, ly + math.sin(to_cam) * T_['size'][1] * 1.1
        T_['spill'] = spill_items(hf, (mx, my), (math.cos(to_cam), math.sin(to_cam)), T_['items'], M, C_PROP, rng,
                                  reach=(0.08, 0.55), spread=1.2)
    L2 = scatter_leaves(hf, protos, 1500, rng, C_LEAF, dens, avoid=True, name='Leaf2')
    pts, _ = trunk_field(GROUND, M, C_BG, random.Random(SEED + 55), 34, 4.0, 34.0, xk=0.7, xpad=2.0, min_d=2.2,
                         r=(0.08, 0.32), keep_out=lambda x, y: abs(x + 0.2) < 1.5 and y < 5.5,
                         fixed=[(-1.05, 1.6, 0.19), (1.35, 2.4, 0.23), (0.6, 6.4, 0.27), (-1.6, 5.2, 0.22)])

    # ---- animation: closed bag flies a ballistic arc, tumbling; at impact it swaps to the torn, settled bag
    g = 9.81
    for T_ in throws:
        fh, fl = T_['f_hit'], T_['flight']
        land = T_['land'].copy()
        start = land + Vector(T_['launch'])
        tf = fl / 24.0
        v0 = (land - start - 0.5 * Vector((0, 0, -g)) * tf * tf) / tf
        fb = build_bag_flight(T_['name'] + 'Fly', T_['size'], M['bag'], C_PROP, seed=T_['seed'])
        fk = knot(T_['name'] + 'FlyKnot', Vector((T_['size'][0] * 1.35, 0, T_['size'][2] * 0.25)), 0.024, M['bag'],
                  C_PROP, seed=T_['seed'])
        parent(fk, fb)
        w = Vector(T_['spin'])
        for f in range(fh - fl - 2, fh + 1):
            t = (f - (fh - fl)) / 24.0
            p_ = start + v0 * t + 0.5 * Vector((0, 0, -g)) * t * t
            fb.location = p_
            dt = (f - fh) / 24.0
            fb.rotation_euler = (w.x * dt, w.y * dt, T_['yaw'] + w.z * dt)
            fb.keyframe_insert('location', frame=f)
            fb.keyframe_insert('rotation_euler', frame=f)
        linear(fb)
        for f, hid in ((1, True), (fh - fl - 3, False), (fh, True)):
            fb.hide_render = hid
            fb.keyframe_insert('hide_render', frame=f)
            fb.hide_viewport = hid
            fb.keyframe_insert('hide_viewport', frame=f)
        tb = T_['torn']
        for f, hid in ((1, True), (fh, False)):
            for o in [tb] + list(tb.children):
                o.hide_render = hid
                o.keyframe_insert('hide_render', frame=f)
        d = Vector((math.cos(T_['dir']), math.sin(T_['dir']), 0))
        key(tb, 'scale', [(fh, (1.10, 1.10, 0.62)), (fh + 3, (0.97, 0.97, 1.07)), (fh + 6, (1.01, 1.01, 0.98)),
                          (fh + 9, (1.0, 1.0, 1.0))])
        key(tb, 'location', [(fh, tuple(land - d * 0.06 + Vector((0, 0, 0.01)))), (fh + 5, tuple(land - d * 0.01)),
                             (fh + 9, tuple(land))])
        # contents burst out of the mouth and land at their rest pose
        mouth = land + d * T_['size'][1] * 0.9 + Vector((0, 0, 0.05))
        for i, o in enumerate(T_['spill']):
            if o.get('kind') in ('envelope', 'receipt', 'document', 'packet'):
                recentre(o)
            rest_loc, rest_rot = o.location.copy(), o.rotation_euler.copy()
            delay = rng.uniform(0, 3)
            dur = rng.uniform(7, 14) if o.get('kind') in ('wad', 'stone') else rng.uniform(10, 22)
            if i == 0 and o.get('kind') != 'stone':
                dur = 34                                   # one sheet floats down late
            f0 = fh + delay
            f1 = f0 + dur
            hop = rng.uniform(0.12, 0.35) if o.get('kind') != 'stone' else 0.08
            r0 = Euler((rng.uniform(-1.4, 1.4), rng.uniform(-1.4, 1.4), rest_rot.z + rng.uniform(-2, 2)))
            mid = (mouth + rest_loc) * 0.5 + Vector((0, 0, hop))
            o.location, o.rotation_euler = mouth, r0
            o.keyframe_insert('location', frame=f0); o.keyframe_insert('rotation_euler', frame=f0)
            o.location = mid
            o.rotation_euler = Euler((r0.x * 0.4, r0.y * 0.4, (r0.z + rest_rot.z) / 2))
            o.keyframe_insert('location', frame=(f0 + f1) / 2); o.keyframe_insert('rotation_euler', frame=(f0 + f1) / 2)
            o.location, o.rotation_euler = rest_loc + Vector((0, 0, 0.004)), rest_rot
            o.keyframe_insert('location', frame=f1); o.keyframe_insert('rotation_euler', frame=f1)
            o.location = rest_loc
            o.keyframe_insert('location', frame=f1 + 3)
            for f, hid in ((1, True), (int(f0), False)):
                o.hide_render = hid
                o.keyframe_insert('hide_render', frame=f)
        # a few leaves kicked up by the impact
        near = [l for l in L1 if (Vector((l.matrix_world.translation.x, l.matrix_world.translation.y, 0))
                                  - Vector((land.x, land.y, 0))).length < 0.45][:7]
        for l in near:
            m0 = l.matrix_world.copy()
            l.matrix_world = m0
            l.keyframe_insert('location', frame=fh)
            l.keyframe_insert('rotation_euler', frame=fh)
            l.location = l.location + Vector((rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), rng.uniform(0.06, 0.16)))
            l.rotation_euler = Euler((l.rotation_euler.x + rng.uniform(-1.2, 1.2), l.rotation_euler.y + rng.uniform(-1.2, 1.2),
                                      l.rotation_euler.z + rng.uniform(-1, 1)))
            l.keyframe_insert('location', frame=fh + 5)
            l.keyframe_insert('rotation_euler', frame=fh + 5)
            l.matrix_world = m0
            l.keyframe_insert('location', frame=fh + rng.randint(13, 20))
            l.keyframe_insert('rotation_euler', frame=fh + 20)

    # ---- light: cold moonless sky, distant sodium glow from the motorway through thin fog
    woods_world(sky_zenith=(0.010, 0.013, 0.020), sky_horizon=(0.0025, 0.003, 0.004), strength=1.0)
    GLOW = tuple(0.45 * c + 0.55 for c in kelvin(2700))     # distant motorway lights: desaturated amber-white
    if DEBUG:
        light('SUN', 'DebugSun', (0, 0, 5), rot=(math.radians(35), 0, math.radians(20)), energy=4.0, size=5)
    else:
        # moonless overcast: cold dome + a cool soft key from camera right so plastic and paper read
        light('AREA', 'Sky', (0.5, 3.0, 9.0), energy=110, color=kelvin(11000), size=14.0, target=(0, 3.0, 0))
        light('AREA', 'CoolKey', (2.2, 0.6, 1.7), energy=7.0, color=kelvin(9000), size=3.0, target=(0.0, 2.3, 0.1))
        # small, faint glow far off between the trunks where the motorway is
        light('AREA', 'RoadGlow', (-9.0, 30.0, 2.6), energy=160, color=GLOW, size=5.0, size_y=1.5,
              shape='RECTANGLE', target=(0.0, 3.0, 0.4))
        for m in list(bpy.data.materials):
            if m.name not in ('Water', 'Drop'):
                fog_wrap(m)
        fogm = mat_fog_soft('NightFog', density=0.02, color=(0.74, 0.8, 0.88), anisotropy=0.5, noise_scale=0.35)
        vb = volume_box('FogBank', (-2.0, 18.5, 1.6), (30.0, 28.0, 3.2), fogm, C_BG)
        key(vb, 'location', [(1, (-2.0, 18.5, 1.6)), (N, (-1.1, 18.8, 1.6))], interp='LINEAR')
    cam = camera('CamS31', lens=32.0, fstop=None if (DEBUG or arg('--nodof')) else 2.8, ratio=1.0, blades=9,
                 clip=(0.02, 300))
    cam_path(cam, [(1, tuple(loc0), tuple(tgt0), 0.0), (N, tuple(loc1), tuple(tgt1), 0.0)])
    for fc in fcurves(cam):
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing = 'EASE_IN_OUT'
    shake(cam, 0.0015, 0.0008, scale=30, seed=5)
    lc = throws[0]['land']
    foc = empty('FocusS31', (lc.x + 0.15, lc.y - 0.1, 0.08), C_PROP)
    if cam.data.dof.use_dof:
        cam.data.dof.focus_object = foc

if SHOT == 'S31' and arg('--sf2'):
    # v2 style frame C: Speedy at the edge of the woods mid-throw, silhouetted by the car's headlights in the fog
    import human as HU
    T0 = throws[0]
    start = T0['land'] + Vector(T0['launch'])
    d = (T0['land'] - start)
    d.z = 0
    d.normalize()
    sp = HU.make_human('speedy', gender=1, age=55, muscle=0.4, weight=0.55, height=0.4, skin='olive',
                       assets=[('clothes/male_casualsuit05', dict(tint=(0.3, 0.32, 0.3), sat=0.4, val=0.7)),
                               ('clothes/shoes01', dict(tint=(0.14, 0.11, 0.09), sat=0.3)), ('hair/short01', dict(tint=(0.55, 0.53, 0.5))),
                               ('eyebrows/eyebrow001', {})])
    yaw = math.degrees(math.atan2(d.y, d.x)) + 90.0          # rig faces -Y; turn to face the throw direction
    base = start - d * 0.35
    HU.place(sp, base.x, base.y, yaw, z=max(0.0, start.z - 1.62))
    R3 = sp.rig.matrix_world.to_3x3()
    HU.aim(sp, 'RightArm', R3 @ Vector((-0.25, -0.9, 0.55)))
    HU.aim(sp, 'RightForeArm', R3 @ Vector((-0.1, -1.0, 0.7)))
    HU.aim(sp, 'LeftArm', R3 @ Vector((0.45, 0.6, -0.5)))
    HU.aim(sp, 'LeftForeArm', R3 @ Vector((0.3, 0.2, -1.0)))
    HU.aim(sp, 'RightUpLeg', R3 @ Vector((-0.05, 0.35, -1)))
    HU.aim(sp, 'LeftUpLeg', R3 @ Vector((0.05, -0.3, -1)))
    HU.aim(sp, 'LeftLeg', R3 @ Vector((0.0, 0.15, -1)))
    HU.rot(sp, 'Spine1', x=-8, z=-18)
    HU.rot(sp, 'Head', x=-4, z=-10)
    # the car on the shoulder behind him: two headlights into the fog
    car = base - d * 3.2 + Vector((0, 0, 0))
    side = Vector((-d.y, d.x, 0)) * 0.62
    for k, sgn in enumerate((-1, 1)):
        hl = car + side * sgn * 0.5 + Vector((0, 0, 0.68))
        light('SPOT', f'Headlight{k}', tuple(hl), energy=1400, color=(1.0, 0.93, 0.8), spot=55.0, blend=0.5, radius=0.06,
              target=tuple(T0['land'] + Vector((0, 0, 0.4))))
        disc = prim('cyl', f'HeadlightLens{k}', loc=tuple(hl), r=0.09, depth=0.02)
        disc.rotation_mode = 'QUATERNION'
        disc.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
        disc.data.materials.append(mat_emission(f'HLLens{k}', (1.0, 0.92, 0.78), 60.0))
    near = mat_fog_soft('NearFog', density=0.012, color=(0.8, 0.84, 0.9), anisotropy=0.6, noise_scale=0.5)
    volume_box('NearFog', tuple((base + T0['land']) / 2 + Vector((0, 0, 1.4))), (9.0, 9.0, 2.8), near, C_BG)
    # camera: low, from beyond the landing spot, looking back at the thrower against the lights
    sd = Vector((-d.y, d.x, 0))
    if (sd.dot(Vector(tuple(loc0)) - base)) < 0:
        sd = -sd                                           # stay on the side the woods camera lives on
    gz = sp.rig.location.z
    cl = base + sd * 3.3 + d * 1.6 + Vector((0, 0, 0))
    cl.z = gz + 1.05
    cam.animation_data_clear()
    for c in list(cam.constraints):
        cam.constraints.remove(c)
    cam.location = cl
    tg = base - d * 0.7
    tg.z = gz + 1.2
    cam.rotation_euler = look_rot(tuple(cl), tuple(tg), 0.0)
    cam.data.lens = 30.0
    if cam.data.dof.use_dof:
        cam.data.dof.focus_object = None
        cam.data.dof.focus_distance = (cl - base).length

if SHOT not in ('S36', 'S35', 'S33', 'S31'):
    raise SystemExit(f'unknown shot {SHOT}')

if WHO:
    import cast as CA
    import human as HU
    import mocap as MC
    vc = CA.make('vancamp')
    if WHO == 'walk':                       # on the path ~4 m out, walking toward the camera, eyes on the ground
        py = 7.4
        px = float(xc(py))
        gz = float(hf.sample_s(np.array([px]), np.array([py]))[0]) - 0.01   # the real litter surface, not the base terrain
        base = empty('VanCampGround', (0.0, 0.0, gz))
        vc.rig.parent = base
        W = MC.load('02', '02_01')
        _, Pa, _ = MC.fk(W, 40)
        _, Pb, _ = MC.fk(W, 200)
        d = MC._zup(Pb['root']) - MC._zup(Pa['root'])
        yaw = math.degrees(math.atan2(-1.0, 0.0) - math.atan2(d.y, d.x))
        MC.apply(vc, W, start_frame=1, src_range=(40, 60), step=4.0, pos=(px, py), yaw_deg=yaw, root_motion=False)
        bpy.context.scene.frame_set(3)
    else:                                   # standing behind the bags, looking down at them
        bx, by = G(0.16, 0.40)
        gz = float(hf.sample_s(np.array([bx]), np.array([by]))[0]) - 0.01
        to_cam = math.degrees(math.atan2(loc.y - by, loc.x - bx))
        HU.place(vc, bx, by, to_cam + 90.0, z=gz)
        HU.stand(vc)
        CA.arms_down(vc, 'L', 0.14)
        CA.arms_down(vc, 'R', 0.14)
        CA.grip(vc, 'L', 0.35)
        CA.grip(vc, 'R', 0.35)
        CA.head_turn(vc, 0, 30)
        # camera up at standing eye level so he reads standing over the bags (bags in the lower third)
        bpy.context.view_layer.update()
        chest = Vector((bx, by, gz + 1.15))
        bagc = Vector((G(-0.10, -0.05)[0], G(-0.10, -0.05)[1], 0.1))
        tgt2 = bagc.lerp(chest, 0.55)
        loc2 = Vector((loc.x + 0.35, loc.y - 0.15, 1.45))
        cam.location = loc2
        cam.rotation_euler = look_rot(loc2, tgt2, 0.0)

finish(OUTNAME)
