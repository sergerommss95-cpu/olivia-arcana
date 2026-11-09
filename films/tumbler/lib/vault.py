"""Vault: round vault door + antechamber (Act II) and the vault room with deposit boxes, gold, lasers (Act III).

World: Z up, metres. The concrete wall's front face is the plane y = 0; the antechamber is y < 0, the
vault room is y > WALL_T. Door centre DC = (0, 0, 1.6).
"""
import math, random
import bpy, bmesh
from mathutils import Vector
from common import *
from lock import mat_engine_turned, build_dial, mat_fill

DC = Vector((0.0, 0.0, 1.6))
DOOR_R = 1.42
DOOR_T = 0.9
WALL_T = 1.1
BOLT_ANG = [math.radians(a) for a in range(15, 360, 30)]   # 12 radial bolts, none at 12/3/6/9 o'clock


def _rot_y_disc(o):
    """Turn a +Z-facing disc so it faces -Y (toward the antechamber)."""
    o.rotation_euler = (math.radians(90), 0, 0)
    return o


def mats():
    M = {}
    M['face'] = mat_engine_turned('DoorFace', base=(0.40, 0.41, 0.43), rough=(0.16, 0.3), cell=0.2, rings=40.0, bump=0.03)
    M['chrome'] = mat_metal('Chrome', base=(0.78, 0.79, 0.8), rough=(0.05, 0.14), scale=3.0, bump=0.004, grime=0.15, scratches=0.15)
    M['satin'] = mat_concentric('Satin', base=(0.5, 0.51, 0.53), rough=(0.2, 0.3), rings=140.0, bump=0.004)
    M['dark'] = mat_metal('DarkSteel', base=(0.08, 0.085, 0.09), rough=(0.28, 0.5), scale=1.5, bump=0.01, grime=0.3)
    M['edge'] = mat_metal('EdgeSteel', base=(0.5, 0.51, 0.53), rough=(0.1, 0.26), scale=2.0, bump=0.006, brushed=(1.0, 1.0, 60.0))
    M['brass'] = mat_brass('DoorBrass', base=(0.74, 0.52, 0.24), rough=(0.16, 0.34), scale=2.0)
    M['concrete'] = mat_concrete('Wall', base=(0.09, 0.092, 0.095), wet=0.0, scale=1.6, contrast=0.35)
    M['floor'] = mat_concrete('Floor', base=(0.08, 0.082, 0.085), wet=0.85, scale=0.8, puddle_scale=0.5, contrast=0.5)
    M['black'] = mat_principled('Black', color=(0.006, 0.006, 0.007), rough=0.5)
    return M


def disc(name, r, t, y0, seg=192, coll=None, mat=None, bev=0.01, r2=None, loc_xz=(0.0, 1.6)):
    """Cylinder whose axis is Y, spanning y0 .. y0+t."""
    o = prim('cyl', name, (loc_xz[0], y0 + t / 2, loc_xz[1]), (math.radians(90), 0, 0), seg=seg, r=r,
             r2=r2 if r2 is not None else r, depth=t, coll=coll)
    if bev:
        bevel(o, bev, 2, angle=40)
    if mat:
        set_mat(o, mat)
    return o


def ring(name, r_in, r_out, t, y0, seg=192, coll=None, mat=None, bev=0.008, loc_xz=(0.0, 1.6)):
    o_ = [(r_out * math.cos(2 * math.pi * i / seg), r_out * math.sin(2 * math.pi * i / seg)) for i in range(seg)]
    i_ = [(r_in * math.cos(2 * math.pi * i / seg), r_in * math.sin(2 * math.pi * i / seg)) for i in range(seg)]
    o = extrude_profile(name, o_, t, holes=[i_], coll=coll, smooth=True)
    # extrude_profile builds along +Z from 0..t; rotate so +Z -> -Y, then place front at y0
    o.rotation_euler = (math.radians(90), 0, 0)
    o.location = (loc_xz[0], y0 + t, loc_xz[1])
    if bev:
        bevel(o, bev, 2, angle=40)
    if mat:
        set_mat(o, mat)
    return o


# ----------------------------------------------------------------------------- door

def build_door(M, coll=None):
    """Returns dict: pivot (hinge empty; rotate .rotation_euler.z to open, + opens toward -Y), wheel (hand wheel empty,
    rotate .rotation_euler.y), bolts [(empty, angle)], door root."""
    hinge = empty('DoorHinge', (1.78, -0.22, DC.z), coll=coll)
    root = empty('DoorRoot', (0, 0, 0), coll=coll)
    parent(root, hinge, keep=True)
    y_front = -0.06
    # laminated body: stepped plates (front plate biggest), visible on the edge when the door swings
    steps = [(DOOR_R, 0.16), (DOOR_R - 0.035, 0.18), (DOOR_R - 0.06, 0.2), (DOOR_R - 0.085, 0.18), (DOOR_R - 0.13, 0.18)]
    y = y_front
    for i, (r, t) in enumerate(steps):
        d = disc(f'Lam{i}', r, t, y, coll=coll, mat=M['edge'] if i else M['edge'], bev=0.012)
        parent(d, root, keep=True)
        y += t
    # front face plate (engine turned) + polished outer bevel ring + decorative inner ring
    face = disc('Face', DOOR_R - 0.09, 0.02, y_front - 0.012, coll=coll, mat=M['face'], bev=0.004)
    parent(face, root, keep=True)
    outer = ring('OuterRing', DOOR_R - 0.1, DOOR_R, 0.05, y_front - 0.04, coll=coll, mat=M['chrome'], bev=0.015)
    parent(outer, root, keep=True)
    band = ring('Band', 0.88, 0.97, 0.035, y_front - 0.045, coll=coll, mat=M['satin'], bev=0.01)
    parent(band, root, keep=True)
    # rivets around the band
    riv_me = None
    for i in range(36):
        a = 2 * math.pi * i / 36
        r_ = prim('sphere', 'Rivet', (math.cos(a) * 1.1, y_front - 0.015, DC.z + math.sin(a) * 1.1), seg=16, ring=8, r=0.018,
                  coll=coll)
        r_.scale = (1, 0.45, 1)
        set_mat(r_, M['chrome'])
        parent(r_, root, keep=True)
    # hub + hand wheel (4 spokes with ball knobs)
    hub = disc('Hub', 0.3, 0.16, y_front - 0.2, coll=coll, mat=M['satin'], bev=0.02)
    parent(hub, root, keep=True)
    hubcap = disc('HubCap', 0.18, 0.06, y_front - 0.26, coll=coll, mat=M['chrome'], bev=0.02, r2=0.15)
    parent(hubcap, root, keep=True)
    wheel = empty('HandWheel', (0, y_front - 0.17, DC.z), coll=coll)
    parent(wheel, root, keep=True)
    for i in range(4):
        a = math.radians(45 + 90 * i)
        sp = prim('cyl', f'Spoke{i}', (0, 0, 0), seg=24, r=0.032, depth=0.62, coll=coll)
        # spoke along local radial direction in the XZ plane
        sp.rotation_euler = (0, math.pi / 2 - a, 0)
        sp.location = (math.cos(a) * 0.55, 0, math.sin(a) * 0.55)
        bevel(sp, 0.006, 2)
        set_mat(sp, M['chrome'])
        parent(sp, wheel, keep=False)
        kb = prim('sphere', f'Knob{i}', (math.cos(a) * 0.88, 0, math.sin(a) * 0.88), seg=32, ring=16, r=0.065, coll=coll)
        set_mat(kb, M['chrome'])
        parent(kb, wheel, keep=False)
    # combination dial above the hub (Act I dial, scaled to ~16 cm diameter)
    droot = empty('DialRoot', (0, y_front - 0.02, DC.z + 0.6), coll=coll)
    droot.rotation_euler = (math.radians(90), 0, 0)
    droot.scale = (0.085, 0.085, 0.085)
    dial_parts = build_dial(droot, coll=coll)
    # build_dial adds a big plate behind; hide it (the door face is the plate here)
    for o in list(droot.children_recursive):
        if o.name.startswith('Plate'):
            bpy.data.objects.remove(o)
    parent(droot, root, keep=True)
    # radial locking bolts: chrome rods in housings, bridging the seam into the frame when locked
    bolts = []
    rod_m = M['chrome']
    for i, a in enumerate(BOLT_ANG):
        bp = empty(f'BoltPivot{i}', (0, 0, 0), coll=coll)
        bp.location = (0, 0, DC.z)
        bp.rotation_euler = (0, -a, 0)          # local +X points radially at angle a in the XZ plane
        parent(bp, root, keep=True)
        slide = empty(f'BoltSlide{i}', (0, 0, 0), coll=coll)
        parent(slide, bp, keep=False)
        rod = prim('cyl', f'Rod{i}', (1.42, -0.12, 0), (0, math.pi / 2, 0), seg=32, r=0.05, depth=0.52, coll=coll)
        bevel(rod, 0.012, 3)
        set_mat(rod, rod_m)
        parent(rod, slide, keep=False)
        tip = prim('sphere', f'RodTip{i}', (1.68, -0.12, 0), seg=24, ring=12, r=0.05, coll=coll)
        tip.scale = (0.4, 1, 1)
        set_mat(tip, rod_m)
        parent(tip, slide, keep=False)
        housing = box(f'Housing{i}', (0.24, 0.1, 0.16), (1.12, -0.12, 0), coll=coll, bev=0.015, mat=M['dark'])
        parent(housing, bp, keep=False)
        for s in (-1, 1):
            sc_ = prim('cyl', f'HScrew{i}{s}', (1.04 + 0.16 * (s > 0), -0.175, 0.055 * s), (math.pi / 2, 0, 0), seg=16, r=0.012,
                       depth=0.01, coll=coll)
            set_mat(sc_, M['chrome'])
            parent(sc_, bp, keep=False)
        bolts.append((slide, a))
    # hinge arms + knuckles (stay with the door) and frame-side hinge barrels
    for z in (0.75, 2.45):
        arm = box(f'HingeArm{z}', (0.55, 0.16, 0.22), (1.55, -0.18, z), coll=coll, bev=0.03, mat=M['dark'])
        parent(arm, root, keep=True)
        kn = prim('cyl', f'Knuckle{z}', (1.78, -0.22, z), seg=48, r=0.13, depth=0.24, coll=coll)
        bevel(kn, 0.02, 2)
        set_mat(kn, M['satin'])
        parent(kn, root, keep=True)
    return {'hinge': hinge, 'root': root, 'wheel': wheel, 'bolts': bolts, 'dial': dial_parts['dial']}


def build_frame_and_wall(M, coll=None, width=8.0, height=3.8):
    """Concrete wall (with a round opening) + steel frame ring + barrels; returns wall object."""
    # wall as a box with a boolean round hole
    wall = box('Wall', (width, WALL_T, height), (0, WALL_T / 2, height / 2), coll=coll, mat=M['concrete'])
    cut = prim('cyl', 'WallCut', (DC.x, WALL_T / 2, DC.z), (math.radians(90), 0, 0), seg=128, r=1.86, depth=WALL_T * 3, coll=coll)
    b = wall.modifiers.new('hole', 'BOOLEAN')
    b.operation = 'DIFFERENCE'
    b.object = cut
    apply_mods(wall)
    bpy.data.objects.remove(cut)
    # frame: polished bore ring through the wall thickness + front flange
    bore = ring('Bore', 1.44, 1.86, WALL_T, 0.0, coll=coll, mat=M['edge'], bev=0.0)
    flange = ring('Flange', 1.44, 2.05, 0.09, -0.09, coll=coll, mat=M['satin'], bev=0.02)
    # bolt sockets in the flange (dark holes the radial bolts slide into)
    for i, a in enumerate(BOLT_ANG):
        s = prim('cyl', f'Socket{i}', (math.cos(a) * 1.68, -0.1, DC.z + math.sin(a) * 1.68), (math.radians(90), 0, 0), seg=24,
                 r=0.062, depth=0.03, coll=coll)
        set_mat(s, M['black'])
    # frame-side hinge barrels
    for z in (0.45, 1.05, 2.15, 2.75):
        hb = prim('cyl', f'Barrel{z}', (1.78, -0.22, z), seg=48, r=0.13, depth=0.32, coll=coll)
        bevel(hb, 0.02, 2)
        set_mat(hb, M['satin'])
        mount = box(f'BarrelMount{z}', (0.3, 0.2, 0.3), (1.95, -0.1, z), coll=coll, bev=0.02, mat=M['dark'])
    # formwork tie holes on the wall (grid of small dark recesses)
    th = mat_principled('TieHole', color=(0.02, 0.02, 0.02), rough=0.7)
    for ix in range(-6, 7):
        for iz in range(1, 6):
            x, z = ix * 0.6, iz * 0.62
            if Vector((x - DC.x, z - DC.z)).length < 2.25:
                continue
            h = prim('cyl', 'Tie', (x, -0.003, z), (math.radians(90), 0, 0), seg=16, r=0.018, depth=0.01, coll=coll)
            set_mat(h, th)
    return wall


def build_antechamber(M, coll=None, depth=9.0, width=8.0, height=3.8, strips=True):
    floor = box('Floor', (width, depth + WALL_T + 10, 0.1), (0, -depth / 2 + 5, -0.05), coll=coll, mat=M['floor'])
    for sx in (-1, 1):
        w = box(f'SideWall{sx}', (0.2, depth, height), (sx * width / 2, -depth / 2, height / 2), coll=coll, mat=M['concrete'])
    ceil = box('Ceiling', (width, depth, 0.2), (0, -depth / 2, height + 0.1), coll=coll, mat=M['concrete'])
    # threshold plate in front of the door
    th = box('Threshold', (3.2, 1.2, 0.03), (0, -0.6, 0.015), coll=coll, bev=0.005,
             mat=mat_metal('Tread', base=(0.32, 0.33, 0.34), rough=(0.25, 0.45), scale=6.0, bump=0.02))
    out = {'floor': floor}
    if strips:
        sm = mat_strip('Fluoro', color=(0.80, 0.90, 1.0), strength=6.0)
        hm = mat_principled('FixtureHousing', color=(0.05, 0.05, 0.055), rough=0.4, metal=0.8)
        for x in (-2.0, 2.0):
            for k in range(3):
                yc = -1.6 - k * 2.6
                hs = box('Fixture', (0.14, 1.7, 0.06), (x, yc, height - 0.03), coll=coll, mat=hm)
                tube = box('Tube', (0.07, 1.6, 0.03), (x, yc, height - 0.07), coll=coll, bev=0.01, mat=sm)
                light('AREA', 'FluoroL', (x, yc, height - 0.1), energy=40, color=(0.8, 0.9, 1.0), size=0.12, size_y=1.6,
                      shape='RECTANGLE', coll=coll)
    return out


# ----------------------------------------------------------------------------- vault room

def build_deposit_wall(name, origin, cols, rows, side=1, cw=0.26, rh=0.19, coll=None, seed=0, number=True):
    """Wall of safe-deposit boxes in a plane. origin = lower-left corner (world), wall runs along +Y, faces -side*X.
    Each door is a linked copy hinged on its left edge (pivot empty; rotate pivot.rotation_euler.z to open).
    Returns list of (pivot, col, row)."""
    rng = random.Random(seed)
    door_m = mat_metal('BoxDoor', base=(0.42, 0.43, 0.44), rough=(0.18, 0.34), scale=3.0, bump=0.006, brushed=(1.0, 40.0, 1.0),
                       grime=0.3)
    plate_m = mat_brass('BoxPlate', base=(0.72, 0.52, 0.26), rough=(0.18, 0.34), scale=8.0)
    hole_m = mat_principled('Keyhole', color=(0.004, 0.004, 0.004), rough=0.6)
    frame_m = mat_metal('BoxFrame', base=(0.2, 0.205, 0.21), rough=(0.3, 0.45), scale=2.0, bump=0.006)
    # one door mesh (door + plate + 2 keyholes) built at local origin: door spans +Y (width) and +Z (height), front -X
    parts = []
    d = box('bd', (0.018, cw - 0.012, rh - 0.012), (0, (cw - 0.012) / 2, (rh - 0.012) / 2), coll=coll, bev=0.004, mat=door_m)
    apply_mods(d)
    parts.append(d)
    pl = box('bp', (0.004, 0.05, 0.022), (-0.01, (cw - 0.012) * 0.5, (rh - 0.012) * 0.74), coll=coll, bev=0.0015, mat=plate_m)
    apply_mods(pl)
    parts.append(pl)
    for k, yy in enumerate((0.32, 0.68)):
        kh = prim('cyl', 'kh', (-0.0095, (cw - 0.012) * yy, (rh - 0.012) * 0.4), (0, math.radians(90), 0), seg=16, r=0.011,
                  depth=0.003, coll=coll)
        set_mat(kh, plate_m)
        ks = box('ks', (0.004, 0.003, 0.012), (-0.011, (cw - 0.012) * yy, (rh - 0.012) * 0.4 - 0.004), coll=coll, mat=hole_m)
        parts += [kh, ks]
    hinge = prim('cyl', 'bh', (-0.008, 0.002, (rh - 0.012) / 2), seg=12, r=0.005, depth=rh * 0.7, coll=coll)
    set_mat(hinge, frame_m)
    parts.append(hinge)
    proto = join(parts, name + '_doorproto')
    proto.data.name = name + '_doormesh'
    # frame grid behind the doors (one plate with the grid recessed)
    fr = box(name + '_back', (0.05, cols * cw + 0.04, rows * rh + 0.04), (0, 0, 0), coll=coll, mat=frame_m)
    out = []
    root = empty(name + '_root', origin, coll=coll)
    root.rotation_euler = (0, 0, math.pi if side > 0 else 0)   # side>0: wall on -X facing +X; side<0: on +X facing -X
    fr.location = (0.22, cols * cw / 2, rows * rh / 2)
    parent(fr, root, keep=False)
    cell_m = mat_metal('BoxCell', base=(0.12, 0.122, 0.125), rough=(0.35, 0.5), scale=2.0, bump=0.004, grime=0.4)
    for r in range(rows + 1):
        sl = box(f'{name}_hs{r}', (0.2, cols * cw, 0.008), (0.1, cols * cw / 2, r * rh), coll=coll, mat=cell_m)
        parent(sl, root, keep=False)
    for c in range(cols + 1):
        sl = box(f'{name}_vs{c}', (0.2, 0.008, rows * rh), (0.1, c * cw, rows * rh / 2), coll=coll, mat=cell_m)
        parent(sl, root, keep=False)
    for c in range(cols):
        for r in range(rows):
            pv = empty(f'{name}_pv{c}_{r}', (0, c * cw + 0.006, r * rh + 0.006), coll=coll, size=0.02)
            parent(pv, root, keep=False)
            dc = linked_copy(proto, f'{name}_d{c}_{r}', coll=coll)
            dc.location = (0, 0, 0)
            parent(dc, pv, keep=False)
            out.append((pv, c, r))
    proto.location = (0, 0, -100)  # hide the prototype
    proto.hide_render = True
    return out, root


def mat_cash(name='Cash'):
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    tc = nb.n('ShaderNodeTexCoord')
    wv = nb.n('ShaderNodeTexWave', attrs={'wave_type': 'BANDS', 'bands_direction': 'Z'}, Scale=180.0, Distortion=1.0, Detail=2.0)
    nb.l(tc, 'Object', wv, 'Vector')
    c = nb.ramp(wv, 'Fac', [(0.2, (0.42, 0.45, 0.38)), (0.8, (0.62, 0.64, 0.56))])
    nb.l(c, 'Color', p, 'Base Color')
    p.inputs['Roughness'].default_value = 0.7
    return m


def build_cash_brick(name, coll=None):
    b = box(name, (0.156, 0.066, 0.05), (0, 0, 0), coll=coll, bev=0.004, mat=mat_cash())
    band = box(name + '_band', (0.04, 0.068, 0.052), (0, 0, 0), coll=coll, bev=0.001,
               mat=mat_principled('Band', color=(0.55, 0.18, 0.08), rough=0.5))
    parent(band, b, keep=False)
    return b


def build_gold_bar(coll=None):
    """One kilobar-ish trapezoid ingot with stamped text; returns prototype object."""
    gm = mat_gold('Gold', base=(1.0, 0.71, 0.33), rough=(0.12, 0.24))
    L, Wb, Hb, top = 0.24, 0.085, 0.045, 0.82
    bm = bmesh.new()
    vs = []
    for z, sx, sy in ((0.0, 1.0, 1.0), (Hb, 0.93, top)):
        for x, y in ((-L / 2, -Wb / 2), (L / 2, -Wb / 2), (L / 2, Wb / 2), (-L / 2, Wb / 2)):
            vs.append(bm.verts.new((x * sx, y * sy, z)))
    f = bm.faces.new
    f((vs[0], vs[3], vs[2], vs[1])); f((vs[4], vs[5], vs[6], vs[7]))
    for i in range(4):
        j = (i + 1) % 4
        f((vs[i], vs[j], vs[j + 4], vs[i + 4]))
    bar = from_bmesh('GoldBar', bm, coll, smooth=False)
    bevel(bar, 0.006, 3, angle=30)
    set_mat(bar, gm)
    apply_mods(bar)
    parts = [bar]
    for txt, size, y in (('999.9', 0.016, 0.012), ('FINE GOLD', 0.0085, -0.006), ('1000 g', 0.0085, -0.02)):
        t = text_mesh(txt, 'gt', size=size, extrude=0.0006, coll=coll)
        t.location = (0, y, Hb + 0.0002)
        set_mat(t, gm)
        parts.append(t)
    proto = join(parts, 'GoldBarProto')
    return proto


def gold_stack(proto, center, layers=5, coll=None, seed=3):
    """Pyramid stack, alternating orientation per layer. Returns list of bar objects."""
    rng = random.Random(seed)
    bars = []
    L, Wb, Hb = 0.24, 0.085, 0.045
    for k in range(layers):
        n_long = 6 - k
        n_wide = 3 if k % 2 == 0 else 2
        rot = 0 if k % 2 == 0 else math.pi / 2
        for i in range(n_long):
            for j in range(n_wide):
                if k % 2 == 0:
                    x = (i - (n_long - 1) / 2) * (Wb + 0.006)
                    y = (j - (n_wide - 1) / 2) * (L + 0.01)
                    rz = math.pi / 2
                else:
                    x = (i - (n_long - 1) / 2) * (Wb + 0.006) + 0.0
                    y = (j - (n_wide - 1) / 2) * (L + 0.01)
                    rz = math.pi / 2
                b = linked_copy(proto, f'Bar{k}_{i}_{j}', coll=coll)
                b.location = (center[0] + x + rng.uniform(-0.004, 0.004), center[1] + y + rng.uniform(-0.004, 0.004),
                              center[2] + k * (Hb + 0.001))
                b.rotation_euler = (0, 0, rz + rng.uniform(-0.02, 0.02) + (math.pi if rng.random() < 0.5 else 0))
                b.hide_render = False
                bars.append(b)
    return bars


def mat_laser(name='Laser', color=(1.0, 0.07, 0.05), core=9.0):
    return mat_emission(name, color, core)


def mat_laser_glow(name='LaserGlow', color=(1.0, 0.12, 0.08), strength=0.55):
    """Soft halo shell: emission falls off toward the silhouette (fakes scattering in haze), transparent elsewhere."""
    m = new_mat(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    nb = NB(m)
    lw = nb.n('ShaderNodeLayerWeight', Blend=0.5)
    f = nb.math('POWER', None, None, vb=3.0)
    inv = nb.math('SUBTRACT', None, None, va=1.0)
    nb.l(lw, 'Facing', inv, 1)
    nb.L.new(inv.outputs[0], f.inputs[0])
    em = nb.n('ShaderNodeEmission', Color=color, Strength=strength)
    tr = nb.n('ShaderNodeBsdfTransparent')
    mx = nb.n('ShaderNodeMixShader')
    nb.L.new(f.outputs[0], mx.inputs[0])
    nb.L.new(tr.outputs[0], mx.inputs[1])
    nb.L.new(em.outputs[0], mx.inputs[2])
    # add (not mix) emission on top of transparency: use Add shader
    add = nb.n('ShaderNodeAddShader')
    em2 = nb.n('ShaderNodeEmission', Color=color, Strength=0.0)
    nb.L.new(tr.outputs[0], add.inputs[0])
    sc = nb.n('ShaderNodeEmission', Color=color)
    mul = nb.math('MULTIPLY', f, None, vb=strength)
    nb.L.new(mul.outputs[0], sc.inputs['Strength'])
    nb.L.new(sc.outputs[0], add.inputs[1])
    nt.links.new(add.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    try:
        m.blend_method = 'BLEND'
    except Exception:
        pass
    return m


def laser(name, p0, p1, coll=None, core_r=0.0011, glow_r=0.011, core=None, glow=None):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    L = d.length
    mid = (p0 + p1) / 2
    rot = d.to_track_quat('Z', 'Y').to_euler()
    c = prim('cyl', name, mid, rot, seg=8, r=core_r, depth=L, coll=coll)
    set_mat(c, core or mat_laser())
    g = prim('cyl', name + '_glow', mid, rot, seg=16, r=glow_r, depth=L, coll=coll)
    set_mat(g, glow or mat_laser_glow())
    for o in (c, g):
        try:
            o.visible_shadow = False
            o.visible_diffuse = False
            o.visible_glossy = o is c
        except Exception:
            pass
    return c, g


# ----------------------------------------------------------------------------- vault room assembly

ROOM_Y0 = WALL_T + 0.25          # first deposit column starts here
ROOM_LEN = 7.0
ROOM_HALF_W = 1.55
GOLD_Y = WALL_T + 5.4


def build_vault_room(M, coll=None, walls=True, back=True, gold=True, lights=True, cols=27, rows=14, seed=1):
    """Returns dict(left=[(pivot,c,r)], right=[...], back=[...], bars=[...], cart=obj)."""
    out = {}
    floor_m = mat_metal('VaultFloor', base=(0.05, 0.052, 0.055), rough=(0.12, 0.3), scale=0.5, bump=0.004, grime=0.2)
    fl = box('VaultFloor', (ROOM_HALF_W * 2 + 0.4, ROOM_LEN + 2.5, 0.1), (0, ROOM_Y0 + ROOM_LEN / 2, -0.05), coll=coll,
             mat=floor_m)
    # floor plate seams
    seam_m = mat_principled('Seam', color=(0.005, 0.005, 0.006), rough=0.6)
    for k in range(1, 9):
        box('Seam', (ROOM_HALF_W * 2 + 0.3, 0.006, 0.004), (0, ROOM_Y0 + k * 0.9 - 0.4, 0.001), coll=coll, mat=seam_m)
    ce = box('VaultCeil', (ROOM_HALF_W * 2 + 0.4, ROOM_LEN + 2.5, 0.12), (0, ROOM_Y0 + ROOM_LEN / 2, 3.05), coll=coll, mat=M['dark'])
    if walls:
        out['left'], _ = build_deposit_wall('DepL', (-ROOM_HALF_W, ROOM_Y0 + cols * 0.26, 0.25), cols, rows, side=1,
                                            coll=coll, seed=seed)
        out['right'], _ = build_deposit_wall('DepR', (ROOM_HALF_W, ROOM_Y0, 0.25), cols, rows, side=-1, coll=coll,
                                             seed=seed + 1)
    if back:
        bw = 12
        broot_origin = (-bw * 0.26 / 2, ROOM_Y0 + ROOM_LEN + 0.2, 0.25)
        out['back'], br = build_deposit_wall('DepB', broot_origin, bw, rows, side=1, coll=coll, seed=seed + 2)
        br.rotation_euler = (0, 0, math.pi / 2)     # local front -X -> world -Y (toward the door); runs along -X
        br.location = (bw * 0.26 / 2, ROOM_Y0 + ROOM_LEN + 0.2, 0.25)
    # skirting + top trims
    for sx in (-1, 1):
        box('Skirt', (0.08, ROOM_LEN + 1.0, 0.25), (sx * (ROOM_HALF_W + 0.02), ROOM_Y0 + ROOM_LEN / 2, 0.125), coll=coll,
            mat=M['dark'])
        box('Cornice', (0.12, ROOM_LEN + 1.0, 0.1), (sx * (ROOM_HALF_W + 0.0), ROOM_Y0 + ROOM_LEN / 2, 2.97), coll=coll,
            mat=M['brass'])
    if lights:
        dl = mat_strip('Downlight', color=kelvin(2900), strength=4.0)
        for k in range(5):
            y = ROOM_Y0 + 0.7 + k * 1.45
            box('DL', (0.22, 0.22, 0.02), (0, y, 2.985), coll=coll, mat=dl)
            light('SPOT', 'DownL', (0, y, 2.95), (0, 0, 0), energy=45, color=kelvin(2900), spot=70, blend=0.9, radius=0.12,
                  coll=coll)
        # wall washers grazing the box doors (warm, from the cornice)
        for sx in (-1, 1):
            light('AREA', 'Wash', (sx * (ROOM_HALF_W - 0.25), ROOM_Y0 + ROOM_LEN / 2, 2.85), (0, sx * math.radians(25), 0),
                  energy=22, color=kelvin(3000), size=0.1, size_y=ROOM_LEN, shape='RECTANGLE', coll=coll)
    if gold:
        cart_m = mat_metal('Cart', base=(0.3, 0.31, 0.32), rough=(0.2, 0.35), scale=2.0, bump=0.005)
        cart = box('Cart', (0.9, 1.1, 0.06), (0, GOLD_Y, 0.78), coll=coll, bev=0.01, mat=cart_m)
        for sx in (-1, 1):
            for sy in (-1, 1):
                leg = box('CartLeg', (0.04, 0.04, 0.76), (sx * 0.4, GOLD_Y + sy * 0.5, 0.38), coll=coll, bev=0.006, mat=cart_m)
        box('CartShelf', (0.86, 1.06, 0.03), (0, GOLD_Y, 0.2), coll=coll, bev=0.006, mat=cart_m)
        proto = build_gold_bar(coll)
        out['bars'] = gold_stack(proto, (0, GOLD_Y, 0.81), layers=5, coll=coll, seed=seed)
        proto.location = (0, 0, -100)
        proto.hide_render = True
        out['cart'] = cart
        # cash bricks on the lower shelf
        for i in range(10):
            b = build_cash_brick(f'Brick{i}', coll)
            b.location = (-0.3 + (i % 5) * 0.16, GOLD_Y - 0.12 + (i // 5) * 0.2, 0.24)
            b.rotation_euler = (0, 0, random.Random(i).uniform(-0.05, 0.05))
        # the gold's own key light (warm, top), motivated by the downlight
        light('SPOT', 'GoldKey', (0.4, GOLD_Y - 0.6, 2.6), energy=160, color=kelvin(2700), spot=30, blend=0.7, radius=0.15,
              target=(0, GOLD_Y, 0.9), coll=coll)
    return out


def laser_grid(coll=None, seed=5, y0=None, y1=None, count=9):
    """Red beams criss-crossing the aisle between the deposit walls. Returns list of (core, glow, p0, p1)."""
    rng = random.Random(seed)
    y0 = y0 if y0 is not None else ROOM_Y0 + 0.8
    y1 = y1 if y1 is not None else GOLD_Y - 0.8
    em = mat_principled('Emitter', color=(0.02, 0.02, 0.022), rough=0.35, metal=0.8)
    lens = mat_emission('EmitLens', (1.0, 0.05, 0.03), 6.0)
    core, glow = mat_laser(), mat_laser_glow()
    out = []
    for i in range(count):
        ya = y0 + (y1 - y0) * (i + rng.uniform(0.1, 0.9)) / count
        yb = ya + rng.uniform(-0.9, 0.9)
        za, zb = rng.uniform(0.35, 2.3), rng.uniform(0.35, 2.3)
        x = ROOM_HALF_W - 0.06
        p0, p1 = (-x, ya, za), (x, yb, zb)
        c, g = laser(f'Laser{i}', p0, p1, coll=coll, core=core, glow=glow)
        for p, sx in ((p0, -1), (p1, 1)):
            h = box('EmitterBox', (0.05, 0.07, 0.07), (p[0] - sx * 0.0, p[1], p[2]), coll=coll, bev=0.006, mat=em)
            ln = prim('cyl', 'EmitterLens', (p[0] + -sx * 0.026, p[1], p[2]), (0, math.radians(90), 0), seg=16, r=0.012,
                      depth=0.004, coll=coll)
            set_mat(ln, lens)
        out.append((c, g, p0, p1))
    return out
