"""Style frame SF3 — editorial building section (brand motif): offset concrete planes; the slab above Level −2 slides
aside to reveal the orange vault; a thin orange line connects the tenant's office to it. Schematic, not a floor plan.

python3 films/tumbler/tools/rb.py films/false_floor/shots/sf_section.py -- --stills 1 --pct 40 --samples 16
"""
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *

sc = reset()
setup_render(1, 1, res=RES_FINAL, samples=48, look='Medium High Contrast', mb=False)
world_color(tuple(c * 0.9 for c in CHARCOAL))
rng = random.Random(3)

conc = mat_concrete('SecConcrete', base=(0.42, 0.42, 0.41), wet=0.0, scale=0.25, contrast=0.35)
conc_dark = mat_concrete('SecConcreteDark', base=(0.16, 0.165, 0.17), wet=0.0, scale=0.3, contrast=0.35)
earth = mat_concrete('SecEarth', base=(0.07, 0.072, 0.075), wet=0.0, scale=0.4, contrast=0.3)
cream_m = mat_principled('CreamPlane', color=CREAM, rough=0.7)
orange_glow = mat_emission('VaultGlow', ORANGE, 2.2)
orange_line = mat_emission('ConnectLine', ORANGE, 4.0)
warm_win = mat_emission('OfficeWindow', kelvin(2900), 1.6)

W, D = 14.0, 10.0          # building footprint
FL = 3.6                   # floor height
# street level: a cut slab of ground with its section face showing the earth below
box('Street', (W + 16, D + 10, 0.35), (0, 0, -0.175), mat=conc)
box('GroundSection', (W + 16, D + 10, 8.6), (0, 0, -4.7), mat=earth)
# carve the basement out of the ground: a pit the size of the building, open toward the camera
pit = box('Pit', (W - 0.6, D - 0.6, 8.2), (0, 0, -4.5))
b = bpy.data.objects['GroundSection'].modifiers.new('pit', 'BOOLEAN')
b.operation = 'DIFFERENCE'
b.object = pit
apply_mods(bpy.data.objects['GroundSection'])
bpy.data.objects.remove(pit)
# cut the front of ground + street away so the section reads (front face toward -Y)
for name in ('Street', 'GroundSection'):
    o = bpy.data.objects[name]
    cutter = box('FrontCut', (W + 20, 10, 20), (0, -5 - D / 2 + 1.2, 0))
    m = o.modifiers.new('front', 'BOOLEAN')
    m.operation = 'DIFFERENCE'
    m.object = cutter
    apply_mods(o)
    bpy.data.objects.remove(cutter)

# floors above ground (offset planes, slightly misaligned like the logo)
for k in range(4):
    z = k * FL
    off = (0.0 if k % 2 == 0 else 0.35, 0.0 if k % 2 == 0 else -0.2)
    box(f'Slab{k}', (W, D, 0.32), (off[0], off[1], z + 0.16), bev=0.02, mat=conc)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(f'Col{k}{sx}{sy}', (0.45, 0.45, FL - 0.32), (sx * (W / 2 - 0.6), sy * (D / 2 - 0.6), z + 0.32 + (FL - 0.32) / 2),
                mat=conc_dark)
box('Roof', (W, D, 0.32), (0, 0, 4 * FL + 0.16), bev=0.02, mat=conc)
box('BackWall', (W, 0.3, 4 * FL), (0, D / 2 - 0.15, 4 * FL / 2), mat=conc_dark)
# the tenant's office: one lit room on the 2nd floor
oz = 2 * FL
box('Office', (3.6, 3.0, FL - 0.4), (-3.2, 1.6, oz + 0.32 + (FL - 0.4) / 2), mat=conc_dark)
box('OfficeWin', (3.2, 0.05, 1.4), (-3.2, 0.08, oz + 1.9), mat=warm_win)
light('AREA', 'OfficeLight', (-3.2, 0.6, oz + 2.6), (0, 0, 0), energy=120, color=kelvin(2900), size=2.0)
# basement levels: -1 slab (sliding aside = the false floor) and the vault at -2
m1 = box('SlabM1', (W - 0.8, D - 0.8, 0.32), (0, 0, -FL + 0.16), mat=conc)
hole = box('Hole', (5.2, 4.6, 2.0), (-0.4, 0.2, -FL))
bm_ = m1.modifiers.new('hole', 'BOOLEAN')
bm_.operation = 'DIFFERENCE'
bm_.object = hole
apply_mods(m1)
bpy.data.objects.remove(hole)
lid = box('SlabOverVault', (5.2, 4.6, 0.34), (-0.4, 0.2, -FL + 0.17), bev=0.03, mat=cream_m)
lid.location.x += 4.2     # the false floor: slid aside to reveal the vault below
lid.location.z += 0.36
vz = -2 * FL
box('SlabM2', (W - 0.8, D - 0.8, 0.32), (0, 0, vz + 0.16), mat=conc)
# vault: thick-walled box, open top, orange revealed interior
for (sx, sy, lx, ly) in ((0, 2.4, 6.0, 0.6), (-2.7, 0, 0.6, 4.2), (2.7, 0, 0.6, 4.2)):   # front wall cut away
    box('VaultWall', (lx, ly, FL - 0.5), (-0.4 + sx, 0.2 + sy, vz + 0.32 + (FL - 0.5) / 2), bev=0.02, mat=conc_dark)
inner = box('VaultFloorGlow', (4.8, 4.2, 0.05), (-0.4, 0.2, vz + 0.36), mat=orange_glow)
light('AREA', 'VaultLight', (-0.4, 0.2, vz + 1.2), (0, 0, 0), energy=430, color=ORANGE, size=4.0)
light('AREA', 'VaultUp', (-0.4, 0.2, vz + 0.6), (math.pi, 0, 0), energy=220, color=ORANGE, size=3.0)
# deposit-box texture on the vault's inner walls: small grid of boxes
grid_m = mat_paint('VaultBoxes', color=(0.35, 0.18, 0.12), rough=(0.4, 0.5), wear=0.1)
for i in range(10):
    for j in range(4):
        box('Cell', (0.42, 0.04, 0.5), (-2.75 + 0.5 * i + 0.4, 2.05, vz + 0.6 + 0.55 * j), bev=0.01, mat=grid_m)
# the connection: a thin orange line from the office floor down to the vault
p0, p1 = Vector((-3.2, 0.9, oz + 0.35)), Vector((-1.2, 0.6, vz + 0.5))
mid, d = (p0 + p1) / 2, p1 - p0
ln = prim('cyl', 'Connection', mid, d.to_track_quat('Z', 'Y').to_euler(), seg=12, r=0.035, depth=d.length)
set_mat(ln, orange_line)
for p in (p0, p1):
    dot = prim('sphere', 'ConnDot', p, seg=16, ring=8, r=0.12)
    set_mat(dot, orange_line)
# street furniture: bollards along the kerb, a police post
for i in range(14):
    bo = prim('cyl', 'Bollard', (-W / 2 - 3 + i * 1.6, -D / 2 + 1.8, 0.45), seg=16, r=0.12, depth=0.9)
    set_mat(bo, conc_dark)
box('PolicePost', (1.6, 1.6, 2.6), (W / 2 + 3.5, -1.0, 1.3), bev=0.03, mat=conc_dark)

# light: soft architectural key from upper left, cool sky fill
sun = light('SUN', 'Key', (0, 0, 30), (math.radians(48), math.radians(-18), math.radians(-35)), energy=3.0, color=kelvin(5200), size=6)
light('AREA', 'Fill', (-25, -30, 25), energy=9000, color=kelvin(7500), size=20, target=(0, 0, 0))
# camera: orthographic three-quarter god view
cam = camera('CamSF3', lens=50)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 44.0
cam.location = (12, -60, 15)
look_at(cam, (-9.0, 0.0, 2.2))
# label anchors for post (normalised image coords, y down)
import json
from bpy_extras.object_utils import world_to_camera_view
bpy.context.view_layer.update()
anch = {}
for name, p in {'office': (-1.3, 0.08, oz + 1.9), 'vault': (2.1, -2.0, vz + 1.5), 'street': (6.0, -D / 2 + 1.8, 0.9)}.items():
    v = world_to_camera_view(sc, cam, Vector(p))
    anch[name] = (round(v.x, 4), round(1 - v.y, 4))
os.makedirs(os.path.join(FF, 'tests'), exist_ok=True)
json.dump(anch, open(os.path.join(FF, 'tests', 'SF3_section_anchors.json'), 'w'))
finish('SF3_section')
