"""Set S2 for False Floor: the Antwerp vault room after the break-in (illustrative reconstruction).

A wall of safe-deposit boxes (each door: one key lock + three letter wheels, per the reported design), forced open at
irregular angles with bent and torn-off doors, dark mouths, and the floor covered in what the thieves left behind:
envelopes, papers, empty pouches, small parcel boxes, a passport, cards, a couple of rings.
Z up, metres. The wall runs along +Y at x = WALL_X and faces -X.
"""
import math, random
import bpy, bmesh
from mathutils import Vector
from ff import *

WALL_X = 1.25
CW, RH = 0.30, 0.20          # box module (width, height)


def mats():
    M = {}
    M['door'] = mat_paint('BoxPaint', color=(0.2, 0.198, 0.185), rough=(0.22, 0.38), scale=2.0, wear=0.22,
                          edge_metal=(0.55, 0.55, 0.56))
    M['frame'] = mat_paint('BoxFrame', color=(0.085, 0.085, 0.082), rough=(0.4, 0.55), scale=3.0, wear=0.2,
                           edge_metal=(0.45, 0.45, 0.46))
    M['cell'] = mat_metal('CellDark', base=(0.02, 0.02, 0.021), rough=(0.45, 0.6), scale=2.0, bump=0.004, grime=0.5)
    M['brass'] = mat_brass('LockBrass', base=(0.66, 0.5, 0.27), rough=(0.2, 0.38), scale=12.0)
    M['hole'] = mat_principled('Keyhole', color=(0.003, 0.003, 0.003), rough=0.6)
    M['wheel'] = mat_metal('LetterWheel', base=(0.5, 0.5, 0.5), rough=(0.18, 0.32), scale=20.0, bump=0.002)
    M['floor'] = mat_concrete('VaultFloorFF', base=(0.20, 0.205, 0.21), wet=0.0, scale=1.2, contrast=0.4)
    M['paper'] = mat_principled('Paper', color=(0.78, 0.75, 0.68), rough=0.75, spec=0.3)
    M['kraft'] = mat_principled('Kraft', color=(0.55, 0.42, 0.28), rough=0.8, spec=0.25)
    M['white_env'] = mat_principled('EnvWhite', color=(0.82, 0.81, 0.78), rough=0.7, spec=0.3)
    for k in ('Paper', 'Kraft', 'EnvWhite'):
        p = principled(bpy.data.materials[k])
        p.inputs['Subsurface Weight'].default_value = 0.08
    M['velvet_b'] = mat_principled('VelvetBlue', color=(0.03, 0.04, 0.10), rough=0.9, spec=0.2)
    M['velvet_r'] = mat_principled('VelvetRed', color=(0.12, 0.02, 0.03), rough=0.9, spec=0.2)
    for k in ('VelvetBlue', 'VelvetRed'):
        p = principled(bpy.data.materials[k])
        p.inputs['Sheen Weight'].default_value = 0.8
        p.inputs['Sheen Roughness'].default_value = 0.4
    M['passport'] = mat_principled('Passport', color=(0.16, 0.03, 0.04), rough=0.55, spec=0.35)
    M['card'] = [mat_principled(f'Card{i}', color=c, rough=0.25, spec=0.6) for i, c in
                 enumerate([(0.05, 0.12, 0.3), (0.4, 0.4, 0.42), (0.02, 0.02, 0.02), (0.5, 0.36, 0.1)])]
    M['parcel'] = mat_principled('Parcel', color=(0.02, 0.02, 0.022), rough=0.4, spec=0.4)
    M['gold'] = mat_gold('RingGold', rough=(0.12, 0.22))
    return M


def door_proto(M, coll=None):
    """Door at local origin: spans +Y (width) and +Z (height), front face toward -X, hinge on the y=0 edge."""
    w, h = CW - 0.012, RH - 0.012
    parts = []
    d = box('fd', (0.016, w, h), (0, w / 2, h / 2), coll=coll, bev=0.003, mat=M['door'])
    apply_mods(d)
    parts.append(d)
    # key lock: brass rosette + slot
    ro = prim('cyl', 'fr', (-0.009, w * 0.72, h * 0.5), (0, math.radians(90), 0), seg=20, r=0.014, depth=0.004, coll=coll)
    set_mat(ro, M['brass'])
    sl = box('fs', (0.003, 0.003, 0.014), (-0.0112, w * 0.72, h * 0.5 - 0.002), coll=coll, mat=M['hole'])
    parts += [ro, sl]
    # three letter wheels in a small recessed window
    win = box('fw', (0.004, 0.075, 0.03), (-0.0085, w * 0.32, h * 0.5), coll=coll, bev=0.0015, mat=M['hole'])
    parts.append(win)
    for k in range(3):
        wh = prim('cyl', 'fwh', (-0.0095, w * 0.32 + (k - 1) * 0.024, h * 0.5), (0, 0, 0), seg=16, r=0.012, depth=0.018,
                  coll=coll)
        wh.rotation_euler = (0, 0, 0)
        set_mat(wh, M['wheel'])
        parts.append(wh)
    # number plate
    np_ = box('fn', (0.003, 0.05, 0.016), (-0.009, w * 0.5, h * 0.82), coll=coll, bev=0.001, mat=M['brass'])
    parts.append(np_)
    proto = join(parts, 'FFDoorProto')
    return proto


def build_wall(M, y0=0.0, cols=22, rows=13, z0=0.18, coll=None, seed=7, forced=0.62, side=1):
    """Wall + cells + doors. Returns dict(doors=[(obj, col, row, state)], loose=[...])."""
    rng = random.Random(seed)
    proto = door_proto(M, coll)
    if side > 0:
        root = empty('WallRoot', (WALL_X, y0, z0), coll=coll)
    else:   # mirror wall on the -X side, facing +X
        root = empty('WallRootL', (-WALL_X, y0 + cols * CW, z0), coll=coll)
        root.rotation_euler = (0, 0, math.pi)
    # back plate and cell dividers (deep cells so open mouths read dark)
    depth = 0.42
    back = box('WallBack', (0.04, cols * CW + 0.04, rows * RH + 0.04), (depth + 0.02, cols * CW / 2, rows * RH / 2), coll=coll,
               mat=M['cell'])
    parent(back, root, keep=False)
    for r in range(rows + 1):
        s = box('HDiv', (depth, cols * CW + 0.01, 0.01), (depth / 2, cols * CW / 2, r * RH), coll=coll, mat=M['frame'])
        parent(s, root, keep=False)
    for c in range(cols + 1):
        s = box('VDiv', (depth, 0.01, rows * RH + 0.01), (depth / 2, c * CW, rows * RH / 2), coll=coll, mat=M['frame'])
        parent(s, root, keep=False)
    # face frame lip around each cell (catches the cream rim light)
    lip = box('FaceFrame', (0.012, cols * CW + 0.03, rows * RH + 0.03), (-0.002, cols * CW / 2, rows * RH / 2), coll=coll,
              mat=M['frame'])
    cut = []
    for r in range(rows):
        for c in range(cols):
            cut.append(box('cut', (0.05, CW - 0.016, RH - 0.016), (-0.002, c * CW + CW / 2, r * RH + RH / 2), coll=coll))
    cutter = join(cut, 'LipCutter')
    b = lip.modifiers.new('cells', 'BOOLEAN')
    b.operation = 'DIFFERENCE'
    b.object = cutter
    try:
        b.solver = 'MANIFOLD'
    except Exception:
        pass
    apply_mods(lip)
    bpy.data.objects.remove(cutter)
    bevel(lip, 0.002, 2)
    parent(lip, root, keep=False)
    doors, loose = [], []
    for c in range(cols):
        for r in range(rows):
            pv = empty(f'pv{c}_{r}', (0, c * CW + 0.006, r * RH + 0.006), coll=coll, size=0.02)
            parent(pv, root, keep=False)
            d = linked_copy(proto, f'door{c}_{r}', coll=coll)
            d.location = (-0.01, 0, 0)
            parent(d, pv, keep=False)
            state = 'closed'
            roll = rng.random()
            if roll < forced:
                state = 'open'
                ang = rng.choice([rng.uniform(8, 35), rng.uniform(70, 120), rng.uniform(120, 172), rng.uniform(120, 172)])
                pv.rotation_euler = (rng.uniform(-0.05, 0.05), rng.uniform(-0.06, 0.06), math.radians(ang))
                if rng.random() < 0.25:      # bent/sprung: twist around its own vertical
                    d.rotation_euler = (rng.uniform(-0.12, 0.12), 0, rng.uniform(-0.15, 0.15))
            elif roll < forced + 0.04:
                state = 'torn'
                d.hide_render = True
                ld = linked_copy(proto, f'loose{c}_{r}', coll=coll)
                ld.parent = None
                ld.location = (side * (WALL_X - rng.uniform(0.3, 1.2)), y0 + c * CW + rng.uniform(-0.3, 0.3), 0.012)
                ld.rotation_euler = (0, math.radians(90) * (1 if rng.random() < 0.5 else -1), rng.uniform(0, math.pi))
                loose.append(ld)
            doors.append((d, c, r, state))
    proto.hide_render = True
    proto.location = (0, 0, -50)
    return {'doors': doors, 'loose': loose, 'root': root}


def paper_sheet(name, size, mat, coll=None, bend=0.0, seed=0):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=8, y_segments=8, size=0.5)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
    o = from_bmesh(name, bm, coll, smooth=True)
    sol = o.modifiers.new('thick', 'SOLIDIFY')
    sol.thickness = 0.0004
    if bend:
        m = o.modifiers.new('bend', 'SIMPLE_DEFORM')
        m.deform_method = 'BEND'
        m.deform_axis = 'Y'
        m.angle = bend
    set_mat(o, mat)
    return o


def pouch(name, mat, coll=None, seed=0):
    rng = random.Random(seed)
    o = prim('sphere', name, (0, 0, 0), seg=24, ring=12, r=0.05, coll=coll)
    for v in o.data.vertices:
        v.co.z *= 0.35
        v.co.x *= 1.0 + 0.2 * rng.random()
        v.co *= 1.0 + 0.08 * (rng.random() - 0.5)
    subsurf(o, 1)
    set_mat(o, mat)
    return o


def scatter_debris(M, area_min, area_max, count=140, seed=11, coll=None, near=None):
    """Floor debris. near: (x, y) point where density concentrates (under the wall)."""
    rng = random.Random(seed)
    made = []
    kinds = (['env'] * 30 + ['paper'] * 22 + ['kraft'] * 12 + ['pouch'] * 10 + ['parcel'] * 8 + ['card'] * 6 +
             ['passport'] * 2 + ['ring'] * 2)
    for i in range(count):
        k = rng.choice(kinds)
        if near and rng.random() < 0.65:
            x = near[0] - abs(rng.gauss(0, 0.45))
            y = rng.uniform(area_min[1], area_max[1])
        else:
            x = rng.uniform(area_min[0], area_max[0])
            y = rng.uniform(area_min[1], area_max[1])
        z = 0.0015 + 0.0012 * (i % 7)
        rz = rng.uniform(0, 2 * math.pi)
        if k == 'env':
            o = paper_sheet(f'env{i}', (0.22, 0.11), M['white_env'] if rng.random() < 0.6 else M['kraft'], coll,
                            bend=rng.uniform(-0.4, 0.4))
        elif k == 'paper':
            o = paper_sheet(f'paper{i}', (0.21, 0.297), M['paper'], coll, bend=rng.uniform(-0.6, 0.6))
        elif k == 'kraft':
            o = paper_sheet(f'kraft{i}', (0.16, 0.23), M['kraft'], coll, bend=rng.uniform(-0.3, 0.3))
        elif k == 'pouch':
            o = pouch(f'pouch{i}', M['velvet_b'] if rng.random() < 0.6 else M['velvet_r'], coll, seed=i)
            z = 0.012
        elif k == 'parcel':
            o = box(f'parcel{i}', (0.06, 0.045, 0.02), coll=coll, bev=0.002, mat=M['parcel'])
            z = 0.01
        elif k == 'card':
            o = box(f'card{i}', (0.0856, 0.054, 0.0008), coll=coll, bev=0.0003, mat=rng.choice(M['card']))
        elif k == 'passport':
            o = box(f'passport{i}', (0.125, 0.088, 0.005), coll=coll, bev=0.0015, mat=M['passport'])
            z = 0.003
        else:
            o = prim('torus', f'ring{i}', R=0.009, r=0.0016, seg=32, seg2=10, coll=coll)
            set_mat(o, M['gold'])
            z = 0.0016
        o.location = (x, y, z)
        o.rotation_euler = (rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04), rz)
        made.append(o)
    return made
