"""SF2 — S5 WOODS OFF THE E19 (style frame). Macro evidence tableau on a wet February forest floor: torn bin bag
spilling paper, loose rough stones, and the hero: half a salami sandwich. Grey overcast morning, soft fog.

    python3 films/tumbler/tools/rb.py films/false_floor/shots/sf_woods.py -- --stills 1 --pct 40 --samples 16

Flags:
    --debuglight      flat bright light, no DOF, no fog (layout / scale check)
    --nodof           beauty light without depth of field
    --dolly           key a slow lateral camera dolly over frames 1..240 (CAM['dolly']); focus stays on the cut face.
                      Without it the still is the dolly midpoint at frame 1.
    --seed N          leaf scatter seed
Everything in metres. Props are placed by image coordinates (u, v in -1..1) cast onto the ground from the
mid-dolly camera, so the layout survives lens/height tweaks.
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
from woods import *

SHOT = 'SF2_woods'
DEBUG = bool(arg('--debuglight'))
DOLLY = bool(arg('--dolly'))
SEED = arg('--seed', 7, int)
T0 = time.time()

# ------------------------------------------------------------------------------------------------ parameters
CAM = dict(h=0.12, pitch=5.0, yaw=0.0, lens=50.0, fstop=4.5, roll=0.4,
           dolly=((-0.10, -0.03), (0.10, 0.03)),       # (x, y) offsets at frame 1 and 240, midpoint = still
           frames=240)
GROUND = dict(seed=3, rise_start=2.6, rise_slope=0.06, near=(-1.5, 1.5, 0.2, 3.4),
              puddles=[])                                   # filled below from image coords
LITTER_Z = 0.012                                            # mean litter surface height used for image->ground
LAYOUT = dict(
    sandwich=(0.16, -0.36), sandwich_delta=14.0, sandwich_mirror=True,
    bag=(-0.40, 0.16), bag_size=(0.26, 0.19, 0.10),
    envelope=(-0.70, -0.10, 0.45), receipt=(-0.66, -0.50, -0.55), document=(0.74, 0.02, 2.3),
    puddle=(-0.86, -0.50, 0.09, 0.06, 0.014),             # u, v, rx, ry, depth
    stones=[(-0.08, -0.72, 0.0062), (0.62, -0.74, 0.0074), (-0.18, -0.34, 0.0052), (-0.30, -0.08, 0.0046),
            (0.56, -0.30, 0.0044), (-0.62, -0.78, 0.0056)],
)
LEAVES = dict(n1=2400, n2=900, on_bag=7)
FOG.update(color=(0.43, 0.45, 0.47), strength=1.0, start=1.4, dist=6.5)

# ------------------------------------------------------------------------------------------------ scene
sc = reset()
setup_render(1, CAM['frames'] if DOLLY else 1, res=RES_FINAL, samples=48, mb=False, look='Medium High Contrast',
             bounces=(2, 2, 4), clamp=5.0, filter_glossy=0.6, adaptive=0.02)
sc.cycles.transparent_max_bounces = 8
woods_world(strength=1.0)
rng = random.Random(SEED)
nrng = np.random.RandomState(SEED)


def cam_pose(t):
    (ax, ay), (bx, by) = CAM['dolly']
    x, y = ax + (bx - ax) * t, ay + (by - ay) * t
    loc = Vector((x, y, CAM['h']))
    p, yw = math.radians(CAM['pitch']), math.radians(CAM['yaw'])
    tgt = loc + Vector((math.sin(yw) * math.cos(p), math.cos(yw) * math.cos(p), -math.sin(p)))
    return loc, tgt


rig = CamRig(*cam_pose(0.5), lens=CAM['lens'], roll=math.radians(CAM['roll']))
rigs = [CamRig(*cam_pose(t), lens=CAM['lens'], roll=math.radians(CAM['roll'])) for t in (0.0, 1.0)]


def G(u, v, z=None):
    p = rig.ground(u, v, LITTER_Z if z is None else z)
    return p.x, p.y


C_LEAF, C_PROP, C_BG = collection('Leaves'), collection('Props'), collection('Background')

# ground + heightfield
pu = LAYOUT['puddle']
px, py = G(pu[0], pu[1])
GROUND['puddles'] = [(px, py, pu[2], pu[3], pu[4])]
hf = HField(*GROUND['near'], cell=0.004)
M = dict(leaf=mat_leaf(), soil=mat_soil(), bark=mat_bark(), twig=mat_twig(), bag=mat_binbag(),
         receipt=mat_paper('ReceiptPaper', base=(0.66, 0.65, 0.61), kind='receipt', wet_amt=0.75, seed=3,
                           ink_col=(0.10, 0.10, 0.11), rough=0.45),
         envelope=mat_paper('EnvelopePaper', base=(0.62, 0.60, 0.55), kind='envelope', wet_amt=0.8, seed=5),
         document=mat_paper('DocPaper', base=(0.68, 0.67, 0.63), kind='document', wet_amt=0.6, seed=9),
         wad=mat_paper('WadPaper', base=(0.58, 0.57, 0.54), kind='plain', wet_amt=0.5, seed=13),
         crust=mat_crust(), crumb=mat_crumb(), salami=mat_salami(), stone=mat_rough_diamond(),
         water=mat_water(), drop=mat_water('Drop', tint=(1, 1, 1), rough=0.0))
build_ground(GROUND, hf, M['soil'], coll=C_BG)

# ------------------------------------------------------------------------------------------------ litter pass 1
protos = make_leaf_protos(M['leaf'], seed=SEED + 4)


def dens(x, y):
    iv = (rigs[0].in_view(x, y, 0.14) | rigs[1].in_view(x, y, 0.14)).astype(float)
    base = np.clip(1.0 - (y - 1.7) / 2.2, 0.35, 1.0)
    r = np.sqrt(((x - px) / (pu[2] * 0.9)) ** 2 + ((y - py) / (pu[3] * 0.9)) ** 2)
    pud = np.clip(r, 0.12, 1.0)
    return iv * base * pud


_sxy = G(*LAYOUT['sandwich'])
_su, _sv, _sd = rig.project((_sxy[0], _sxy[1], LITTER_Z))


def sightline(x, y):
    """Between lens and hero: only flat, face-up leaves so the cut face is not hidden."""
    u, v, d = rig.project((x, y, LITTER_Z))
    return abs(u - _su) < 0.30 and d < _sd - 0.03


L1 = scatter_leaves(hf, protos, LEAVES['n1'], rng, C_LEAF, dens, flat_zone=sightline)
hf.make_smooth()
_g0 = ground_height(hf.X, hf.Y, GROUND)
_m = (rig.in_view(hf.X, hf.Y, 0.0)) & (hf.Y < 1.5)
print(f'[info] litter pass 1: {len(L1)} leaves, litter thickness in view (y<1.5): mean '
      f'{float((hf.h - _g0)[_m].mean()) * 1000:.1f} mm, p90 {float(np.quantile((hf.h - _g0)[_m], 0.9)) * 1000:.1f} mm '
      f' t={time.time() - T0:.1f}s', flush=True)

# twigs
twigs = []
for i, (u, v, yaw, L, r) in enumerate([(-0.98, -0.70, 0.9, 0.30, 0.0030), (0.36, -0.10, 2.6, 0.26, 0.0026),
                                        (-0.08, 0.12, 0.35, 0.40, 0.0042), (0.88, -0.58, 1.9, 0.22, 0.0024)]):
    x, y = G(u, v)
    twigs += build_twig(f'Twig{i}', hf, (x, y), yaw, L, r, M['twig'], C_PROP, seed=50 + i, branches=2)
hf.stamp_object(twigs, block=False)
hf.make_smooth()

# ------------------------------------------------------------------------------------------------ props
sx, sy = G(*LAYOUT['sandwich'])
bx, by = G(*LAYOUT['bag'])
# bin bag: torn mouth facing the sandwich / camera
mouth_local = (-0.55, -0.8, 0.15)
ang_to = math.atan2(sy - by, sx - bx) - math.radians(25)
bag_yaw = ang_to - math.atan2(mouth_local[1], mouth_local[0])
bag = build_binbag(hf, (bx, by), bag_yaw, M['bag'], C_PROP, size=LAYOUT['bag_size'], mouth=mouth_local, seed=11)
knot('BagKnot', Vector(bag['neck']), 0.02, M['bag'], C_PROP, seed=3)
hf.stamp_object(bag, block=True)
mouth_w = Vector((bx, by, 0)) + Matrix.Rotation(bag_yaw, 3, 'Z') @ Vector((mouth_local[0], mouth_local[1], 0)).normalized() \
    * LAYOUT['bag_size'][1] * 0.9
for i, (dx, dy, r) in enumerate([(0.0, 0.0, 0.034), (0.05, 0.03, 0.026), (-0.04, 0.035, 0.022)]):
    w = Vector((mouth_w.x + dx, mouth_w.y + dy, 0))
    w.z = float(hf.sample_s(np.array([w.x]), np.array([w.y]))[0]) + r * 0.55
    wd = crumpled_wad(f'Wad{i}', w, r, M['wad'], C_PROP, seed=i + 2)
    hf.stamp_object(wd, block=True)

# sandwich
cvec = Vector((rig.loc.x - sx, rig.loc.y - sy))
ang_c = math.atan2(cvec.y, cvec.x)
if LAYOUT['sandwich_mirror']:
    s_yaw = ang_c - math.radians(45) + math.radians(LAYOUT['sandwich_delta'])
else:
    s_yaw = ang_c + math.radians(45) - math.radians(LAYOUT['sandwich_delta'])
s_root, s_parts, SP = build_sandwich((sx, sy, 0.0), s_yaw, M, C_PROP, seed=21, tilt=(0.05, -0.03))
if LAYOUT['sandwich_mirror']:
    s_root.scale = (1, -1, 1)
bpy.context.view_layer.update()
bot = s_parts[0]
mw = bot.matrix_world
vs = [mw @ v.co for v in bot.data.vertices if v.co.z < 0.008]
VX = np.array([[v.x, v.y, v.z] for v in vs])
off = hf.sample_s(VX[:, 0], VX[:, 1]) - VX[:, 2]
s_root.location.z = float(np.quantile(off, 0.7)) - 0.003
hf.stamp_object(s_parts, block=True)
bpy.context.view_layer.update()
cut_center = s_root.matrix_world @ Vector((SP['L'], 0.0, SP['zc'] + 0.006))
crumbs(26, (cut_center.x, cut_center.y, 0), 0.09, M, C_PROP, seed=4, hf=hf)

# paper
ex, ey = G(LAYOUT['envelope'][0], LAYOUT['envelope'][1])
env = build_envelope(hf, (ex, ey, LAYOUT['envelope'][2]), M['envelope'], C_PROP)
hf.stamp_object(env, block=False)
rx_, ry_ = G(LAYOUT['receipt'][0], LAYOUT['receipt'][1])
rec = build_receipt(hf, (rx_, ry_, LAYOUT['receipt'][2]), M['receipt'], C_PROP)
hf.stamp_object(rec, block=False)
dx_, dy_ = G(LAYOUT['document'][0], LAYOUT['document'][1])
doc = build_document(hf, (dx_, dy_, LAYOUT['document'][2]), M['document'], C_PROP)
hf.stamp_object(doc, block=False)

# rough stones
stones = []
for i, (u, v, s) in enumerate(LAYOUT['stones']):
    x, y = G(u, v)
    z = float(hf.sample_s(np.array([x]), np.array([y]))[0]) + s * 0.55
    st = rough_stone(f'Stone{i}', (x, y, z), s, M['stone'], C_PROP, seed=30 + i)
    stones.append(st)
hf.stamp_object(stones, block=True)

hf.make_smooth()

# ------------------------------------------------------------------------------------------------ litter pass 2
L2 = scatter_leaves(hf, protos, LEAVES['n2'], rng, C_LEAF, dens, avoid=True, name='Leaf2', flat_zone=sightline)
# a few leaves that blew onto the bag
bag_leaves = []
for i in range(LEAVES['on_bag']):
    a = rng.uniform(0, 2 * math.pi)
    d = rng.uniform(0.0, 0.12)
    o = place_leaf(hf, protos[rng.randrange(len(protos))], bx + d * math.cos(a), by + d * math.sin(a), rng, C_LEAF,
                   scale=rng.uniform(0.8, 1.0), max_tilt=40, quant=0.7, name='LeafBag')
    bag_leaves.append(o)
print(f'[info] litter pass 2: {len(L2)} + {len(bag_leaves)} on bag  t={time.time() - T0:.1f}s', flush=True)

# shallow water in the puddle hollow (leaves below the level read as submerged)
pz = float(ground_height(np.array([px]), np.array([py]), GROUND)[0]) + pu[4] * 0.62
build_puddle('Puddle', px, py, pu[2] * 1.15, pu[3] * 1.15, pz, M['water'], C_PROP, seed=2)

# dew beads on the bag
droplets_on(bag, 260, 0.0009, 0.0032, M['drop'], C_PROP, seed=8, normal_min=0.35, name='BagDrops')

# ------------------------------------------------------------------------------------------------ background
trng = random.Random(SEED + 99)
trunks = []
tries = 0
while len(trunks) < 34 and tries < 4000:
    tries += 1
    y = 3.6 + 26.0 * trng.random() ** 1.5
    x = trng.uniform(-(0.65 * y + 1.5), 0.65 * y + 1.5)
    if any((x - t[0]) ** 2 + (y - t[1]) ** 2 < 1.6 ** 2 for t in trunks):
        continue
    trunks.append((x, y))
for i, (x, y) in enumerate(trunks):
    z0 = float(ground_height(np.array([x]), np.array([y]), GROUND)[0])
    r = trng.uniform(0.10, 0.28)
    build_trunk(f'Trunk{i}', (x, y, z0), r, 16.0, M['bark'], C_BG, seed=i,
                lean=(trng.uniform(-0.03, 0.03), trng.uniform(-0.02, 0.02)))
# fallen mossy log across the mid-background + a few bare saplings
lx, ly = G(0.15, 0.42)
lz = float(ground_height(np.array([lx]), np.array([ly]), GROUND)[0])
log_pts = [(lx - 1.4 + 2.8 * k / 20, ly + 0.25 * math.sin(k / 20 * 2.0), lz + 0.06) for k in range(21)]
tube_mesh('Log', log_pts, [0.11 - 0.03 * k / 20 for k in range(21)], 20, C_BG, M['bark'], noise_amp=0.08, seed=3)
for i in range(7):
    x, y = trng.uniform(-1.5, 1.5), trng.uniform(2.0, 4.5)
    z0 = float(ground_height(np.array([x]), np.array([y]), GROUND)[0])
    h = trng.uniform(0.6, 1.8)
    pts = [(x + 0.04 * math.sin(k * 0.7 + i), y + 0.03 * math.cos(k * 0.5 + i), z0 + h * k / 12) for k in range(13)]
    tube_mesh(f'Sapling{i}', pts, [0.008 * (1 - 0.8 * k / 12) + 0.001 for k in range(13)], 6, C_BG, M['twig'])

# ------------------------------------------------------------------------------------------------ light + camera
if DEBUG:
    light('SUN', 'DebugSun', (0, 0, 5), rot=(math.radians(35), 0, math.radians(20)), energy=4.0, size=5)
else:
    # overcast: the dome does most of it; a big soft key from above-behind, a little cool fill from camera side
    light('AREA', 'Key', (0.5, 3.2, 3.4), energy=420, color=kelvin(6800), size=5.0, size_y=3.0, shape='RECTANGLE',
          target=(0.0, 0.8, 0.0))
    light('AREA', 'Fill', (-1.0, -1.6, 0.9), energy=18, color=kelvin(9500), size=2.0, target=(0.0, 0.7, 0.0))
    for m in list(bpy.data.materials):
        if m.name not in ('Water', 'Drop'):
            fog_wrap(m)

cam = camera('CamSF2', lens=CAM['lens'], fstop=None if (DEBUG or arg('--nodof')) else CAM['fstop'], ratio=1.0,
             blades=9, clip=(0.01, 200))
foc = empty('FocusSF2', cut_center, C_PROP)
if cam.data.dof.use_dof:
    cam.data.dof.focus_object = foc
if arg('--closeup'):
    cam.data.lens = 60
    cc = cut_center
    d = Vector((rig.loc.x - cc.x, rig.loc.y - cc.y, 0)).normalized()
    cam.location = cc + d * 0.28 + Vector((0, 0, 0.09))
    cam.rotation_euler = look_rot(cam.location, cc + Vector((0, 0, -0.01)))
elif DOLLY:
    keys = []
    for k in range(5):
        t = k / 4
        loc, tgt = cam_pose(t)
        keys.append((1 + (CAM['frames'] - 1) * t, tuple(loc), tuple(tgt), math.radians(CAM['roll'])))
    cam_path(cam, keys)
else:
    loc, tgt = cam_pose(0.5)
    cam.location = loc
    cam.rotation_euler = look_rot(loc, tgt, math.radians(CAM['roll']))
print(f'[info] build done t={time.time() - T0:.1f}s objects={len(bpy.data.objects)}', flush=True)
finish(SHOT)
