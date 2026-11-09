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
from common import _coord

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


def build_wall(M, y0=0.0, cols=22, rows=13, z0=0.18, coll=None, seed=7, forced=0.62, side=1, closed=False):
    """Wall + cells + doors. Returns dict(doors=[(obj, col, row, state)], loose=[...]).
    closed=True: every door shut (the BEFORE state); the door's pivot empty is obj.parent (rotate .z to open)."""
    rng = random.Random(seed)
    if closed:
        forced = -1.0     # roll < forced never true: every door stays shut (RNG still advances the same way)
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


def scatter_debris(M, area_min, area_max, count=140, seed=11, coll=None, near=None, avoid=None):
    """Floor debris. near: (x, y) point where density concentrates (under the wall).
    avoid: optional [(x, y, radius), ...] keep-out discs (hero props); skipped items still advance the RNG."""
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
        if avoid and any((x - ax) ** 2 + (y - ay) ** 2 < ar * ar for ax, ay, ar in avoid):
            bpy.data.objects.remove(o)
            continue
        made.append(o)
    return made


# =====================================================================================================================
# v2 room set (builder B, shots/room.py). Nothing above changed behaviour (two opt-in params: build_wall(closed=),
# scatter_debris(avoid=)), and sf_vault.py calls none of the helpers below, so SF1 re-renders identically.
# Room coordinates follow SF1: box walls at x = +-WALL_X (boxes y -0.4..6.2, z 0.18..2.78), ceiling underside z = 2.9,
# end wall with the vault doorway (x -0.5..0.5, z 0..2.05) face at y = 6.225, back wall face y = -0.62.
# =====================================================================================================================
CEIL_Z = 2.9
END_Y = 6.225
BACK_Y = -0.62
WALL_Y0 = -0.4
FIX_Y = (0.6, 2.4, 4.2)                  # SF1 fluorescent positions (x = 0, along Y)
PIR_CORNER = (WALL_X - 0.01, END_Y, CEIL_Z)            # far-right ceiling corner (heat/motion)
LIGHT_SENSOR = (-0.25, 4.95, CEIL_Z)                   # light sensor on the ceiling, near the doorway end
CCTV_LOC = (0.86, END_Y - 0.17, 2.6)                   # camera on the end wall, right of the doorway


def _two_sided(name, front, back, rough=0.7, sss=0.08):
    """Paper with a different colour on each face (diamond paper: white outside, pale blue liner inside).
    The mesh normal side shows `front`. Use on unsolidified sheets."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    geo = nb.n('ShaderNodeNewGeometry')
    nz = nb.n('ShaderNodeTexNoise', Scale=120.0, Detail=4.0)
    mx = nb.mix(front, back, geo.outputs['Backfacing'])
    var = nb.n('ShaderNodeMix', {'data_type': 'RGBA', 'blend_type': 'MULTIPLY'})
    var.inputs[0].default_value = 0.08
    nb.L.new(nb.out_of(mx), var.inputs[6])
    nb.l(nz, 'Color', var, 7)
    nb.L.new(var.outputs[2], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    p.inputs['Specular IOR Level'].default_value = 0.3
    p.inputs['Subsurface Weight'].default_value = sss
    bmp = nb.n('ShaderNodeBump', Strength=0.05, Distance=0.002)
    nb.l(nz, 'Fac', bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def mat_tube(name, color=(0.86, 0.9, 0.95), strength=2.2):
    """Fluorescent tube: milky phosphor glass when off + emission on top. Returns (mat, strength socket)."""
    m = new_mat(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    nb = NB(m)
    em = nb.n('ShaderNodeEmission', Color=color, Strength=strength)
    df = nb.n('ShaderNodeBsdfPrincipled')
    df.inputs['Base Color'].default_value = (0.62, 0.63, 0.62, 1)
    df.inputs['Roughness'].default_value = 0.22
    df.inputs['Coat Weight'].default_value = 0.6
    add = nb.n('ShaderNodeAddShader')
    nt.links.new(df.outputs[0], add.inputs[0])
    nt.links.new(em.outputs[0], add.inputs[1])
    nt.links.new(add.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m, em.inputs['Strength']


def mat_foam(name='EPSFoam'):
    """Expanded polystyrene: bead structure (voronoi bump), soft translucency."""
    m = mat_principled(name, color=(0.80, 0.80, 0.78), rough=0.88, spec=0.25)
    nb = NB(m)
    p = principled(m)
    p.inputs['Subsurface Weight'].default_value = 0.45
    p.inputs['Subsurface Scale'].default_value = 0.008
    co = _coord(nb, 1.0)
    vor = nb.n('ShaderNodeTexVoronoi', Scale=210.0)
    nb.l(co, 'Vector', vor, 'Vector')
    nz = nb.n('ShaderNodeTexNoise', Scale=9.0, Detail=5.0)
    nb.l(co, 'Vector', nz, 'Vector')
    cr = nb.ramp(nz, 'Fac', [(0.3, (0.70, 0.70, 0.68)), (0.7, (0.84, 0.84, 0.82))])
    nb.l(cr, 'Color', p, 'Base Color')
    bmp = nb.n('ShaderNodeBump', Strength=0.35, Distance=0.0015)
    nb.l(vor, 'Distance', bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def mat_tape(name='GaffTape'):
    """Black cloth gaffer tape: matte, faint cloth texture, slightly glossy where pressed flat."""
    m = mat_principled(name, color=(0.011, 0.011, 0.012), rough=0.55, spec=0.45)
    nb = NB(m)
    p = principled(m)
    co = _coord(nb, 1.0)
    nz = nb.n('ShaderNodeTexNoise', Scale=700.0, Detail=2.0)
    nb.l(co, 'Vector', nz, 'Vector')
    nz2 = nb.n('ShaderNodeTexNoise', Scale=40.0, Detail=3.0)
    nb.l(co, 'Vector', nz2, 'Vector')
    rr = nb.ramp(nz2, 'Fac', [(0.35, (0.42,) * 3), (0.7, (0.62,) * 3)])
    nb.l(rr, 'Color', p, 'Roughness')
    bmp = nb.n('ShaderNodeBump', Strength=0.12, Distance=0.0005)
    nb.l(nz, 'Fac', bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def mats_room(M):
    """Adds the room-set materials to M (from mats())."""
    M['fixture'] = mat_paint('FixtureWhite', color=(0.5, 0.5, 0.48), rough=(0.3, 0.45), scale=4.0, wear=0.12,
                             edge_metal=(0.5, 0.5, 0.5))
    M['socket'] = mat_principled('TubeSocket', color=(0.32, 0.32, 0.3), rough=0.45, spec=0.4)
    M['abs'] = mat_principled('SensorABS', color=(0.55, 0.54, 0.49), rough=0.4, spec=0.45)
    nb = NB(M['abs'])
    nz = nb.n('ShaderNodeTexNoise', Scale=300.0, Detail=3.0)
    bmp = nb.n('ShaderNodeBump', Strength=0.04, Distance=0.0005)
    nb.l(nz, 'Fac', bmp, 'Height')
    nb.l(bmp, 'Normal', principled(M['abs']), 'Normal')
    M['fresnel'] = mat_principled('FresnelLens', color=(0.66, 0.66, 0.62), rough=0.38, spec=0.5)
    pf = principled(M['fresnel'])
    pf.inputs['Subsurface Weight'].default_value = 0.5
    pf.inputs['Subsurface Scale'].default_value = 0.002
    pf.inputs['Coat Roughness'].default_value = 0.08     # Coat Weight keyed by S21 (hair-spray film)
    M['fresnel_coat'] = pf.inputs['Coat Weight']
    M['smoke'] = mat_principled('SmokeWindow', color=(0.02, 0.02, 0.022), rough=0.08, spec=0.6)
    M['tape'] = mat_tape()
    M['housing'] = mat_paint('CamHousing', color=(0.36, 0.37, 0.37), rough=(0.28, 0.42), scale=6.0, wear=0.15,
                             edge_metal=(0.6, 0.6, 0.6))
    M['camglass'] = mat_principled('CamGlass', color=(0.92, 0.93, 0.94), rough=0.02, transmission=1.0, ior=1.5)
    M['lensblack'] = mat_principled('LensBlack', color=(0.006, 0.006, 0.007), rough=0.3, spec=0.5)
    M['coated'] = mat_principled('LensCoat', color=(0.01, 0.012, 0.02), rough=0.03, spec=1.0, coat=1.0)
    M['led'] = mat_emission('StatusLED', (1.0, 0.025, 0.012), 60.0)
    M['cable'] = mat_rubber('Cable', color=(0.015, 0.015, 0.016), rough=0.5)
    M['foam'] = mat_foam()
    M['tool'] = mat_metal('ToolSteel', base=(0.2, 0.205, 0.21), rough=(0.3, 0.55), scale=6.0, bump=0.006, grime=0.55,
                          scratches=0.6)
    M['toolbright'] = mat_metal('ToolBright', base=(0.5, 0.5, 0.51), rough=(0.16, 0.32), scale=20.0, bump=0.003,
                                grime=0.35)
    M['grip'] = mat_rubber('Grip', color=(0.018, 0.016, 0.014), rough=0.62)
    M['tray'] = mat_paint('TrayPaint', color=(0.15, 0.15, 0.142), rough=(0.3, 0.5), scale=3.0, wear=0.35,
                          edge_metal=(0.55, 0.55, 0.56))
    M['leather'] = [mat_principled(f'Leatherette{i}', color=c, rough=0.45, spec=0.4) for i, c in
                    enumerate([(0.02, 0.025, 0.06), (0.09, 0.015, 0.02), (0.012, 0.012, 0.012)])]
    M['satin'] = mat_principled('Satin', color=(0.62, 0.58, 0.5), rough=0.35, spec=0.5)
    principled(M['satin']).inputs['Sheen Weight'].default_value = 0.6
    M['dpaper'] = _two_sided('DiamondPaper', (0.42, 0.55, 0.72), (0.8, 0.79, 0.76))
    M['pages'] = mat_principled('Pages', color=(0.74, 0.71, 0.62), rough=0.8, spec=0.25)
    M['stone'] = mat_principled('PaleStone', color=(0.9, 0.9, 0.87), rough=0.12, transmission=0.85, ior=1.9)
    M['slab'] = mat_metal('VaultSlab', base=(0.42, 0.43, 0.44), rough=(0.14, 0.3), scale=2.0, bump=0.004,
                          brushed=(1.0, 1.0, 40.0))
    M['wallconc'] = mat_concrete('EndConcrete', base=(0.07, 0.072, 0.075), wet=0.0, scale=1.5, contrast=0.4)
    M['ceil'] = mat_concrete('CeilConc', base=(0.045, 0.046, 0.048), wet=0.0, scale=1.8, contrast=0.35)
    M['spray'] = mat_principled('SprayDrop', color=(0.95, 0.95, 0.93), rough=0.05, transmission=0.9, ior=1.36)
    return M


# ----------------------------------------------------------------------------- small geometry helpers

def cyl_between(name, p0, p1, r, mat, coll=None, seg=16):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    o = prim('cyl', name, tuple((p0 + p1) / 2), seg=seg, r=r, depth=d.length, coll=coll)
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    set_mat(o, mat)
    return o


def cord(name, pts, r, mat, coll=None):
    """Poly curve with a round bevel through world points (cables, drawstrings)."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    sp = cu.splines.new('NURBS')
    sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        p.co = (q[0], q[1], q[2], 1.0)
    sp.use_endpoint_u = True
    sp.order_u = 3
    o = bpy.data.objects.new(name, cu)
    link(o, coll)
    cu.materials.append(mat)
    return o


def rrect(w, h, r, n=6):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180),
                       (w / 2 - r, -h / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def open_box(name, size, wall, mat, coll=None, bev=0.0008):
    """Box with no top face, walls grown inward (deposit trays, jewellery-box bases)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal.z > 0.9], context='FACES')
    o = from_bmesh(name, bm, coll, smooth=False)
    sol = o.modifiers.new('wall', 'SOLIDIFY')
    sol.thickness = wall
    sol.offset = -1.0
    bevel(o, bev, 2)
    set_mat(o, mat)
    return o


# ----------------------------------------------------------------------------- room shell, lights

def build_room(M, door='open', ante_energy=30.0, ante_kelvin=5400, coll=None, back_wall=True, plinth=True):
    """Floor, ceiling, end wall with the vault doorway (door 'open' as in SF1 or 'closed'), antechamber, back wall,
    plinths under both box walls. Returns dict(ante=light, slab=pivot)."""
    box('Floor', (3.0, 9.0, 0.1), (0, 3.0, -0.05), coll=coll, mat=M['floor'])
    box('AnteFloor', (3.0, 3.2, 0.1), (0, 8.1, -0.05), coll=coll, mat=M['floor'])
    box('Ceil', (3.0, 9.0, 0.1), (0, 3.0, 2.95), coll=coll, mat=M['ceil'])
    ew = M['wallconc']
    box('EndL', (1.0, 0.45, 2.95), (-1.0, 6.45, 1.475), coll=coll, mat=ew)
    box('EndR', (1.0, 0.45, 2.95), (1.0, 6.45, 1.475), coll=coll, mat=ew)
    box('EndTop', (1.0, 0.45, 0.9), (0.0, 6.45, 2.5), coll=coll, mat=ew)
    if back_wall:
        box('BackWall', (3.0, 0.2, 2.95), (0, BACK_Y - 0.1, 1.475), coll=coll, mat=ew)
    if plinth:
        for sx in (-1, 1):
            box('Plinth', (0.46, 6.64, 0.175), (sx * (WALL_X + 0.23), WALL_Y0 + 3.3, 0.0875), coll=coll, bev=0.003,
                mat=M['frame'])
    if door == 'open':
        slab_pv = empty('SlabHinge', (0.5, 6.22, 0.0), coll=coll)
    else:
        slab_pv = empty('SlabHinge', (0.5, 6.62, 0.0), coll=coll)
    slab = box('DoorSlab', (1.0, 0.38, 2.04), (-0.5, -0.19, 1.02), coll=coll, bev=0.01, mat=M['slab'])
    parent(slab, slab_pv, keep=False)
    for z in (0.35, 0.75, 1.15, 1.55):
        b = prim('cyl', 'EdgeBolt', (-1.0, -0.19, z), (0, math.radians(90), 0), seg=24, r=0.03, depth=0.06, coll=coll)
        set_mat(b, M['slab'])
        parent(b, slab_pv, keep=False)
    if door == 'open':
        slab_pv.rotation_euler.z = math.radians(-105)
    else:      # inner face detail: cover plate + cap screws
        cp = box('SlabCover', (0.72, 0.012, 1.5), (-0.5, -0.386, 1.05), coll=coll, bev=0.004, mat=M['slab'])
        parent(cp, slab_pv, keep=False)
        for sx in (-0.33, 0.33):
            for sz in (0.36, 1.05, 1.74):
                s = prim('cyl', 'CapScrew', (-0.5 + sx, -0.394, sz), (math.radians(90), 0, 0), seg=16, r=0.009,
                         depth=0.006, coll=coll)
                set_mat(s, M['slab'])
                parent(s, slab_pv, keep=False)
    box('Antechamber', (3.0, 0.1, 3.0), (0, 9.5, 1.5), coll=coll,
        mat=mat_principled('AnteWall', color=(0.1, 0.105, 0.11), rough=0.8))
    ante = light('AREA', 'AnteLight', (0.0, 8.3, 2.2), (math.radians(55), 0, 0), energy=ante_energy,
                 color=kelvin(ante_kelvin), size=1.5, coll=coll)
    return {'ante': ante, 'slab': slab_pv}


def fixture(M, name, x, y, length=1.22, strength=2.2, energy=14.0, kelv=4600, coll=None,
            tube_color=(0.86, 0.9, 0.95)):
    """Ceiling batten with two bare fluorescent tubes + its area light. Returns a dict for flicker()."""
    z = CEIL_Z
    box(name + 'Body', (0.105, length + 0.08, 0.04), (x, y, z - 0.02), coll=coll, bev=0.005, mat=M['fixture'])
    tm, sock = mat_tube(name + 'Tube', tube_color, strength)
    for dx in (-0.027, 0.027):
        t = prim('cyl', name + 'T', (x + dx, y, z - 0.058), (math.radians(90), 0, 0), seg=24, r=0.0125, depth=length,
                 coll=coll)
        set_mat(t, tm)
        for sy in (-1, 1):
            box(name + 'Sock', (0.026, 0.024, 0.034), (x + dx, y + sy * (length / 2 + 0.012), z - 0.05), coll=coll,
                bev=0.003, mat=M['socket'])
    L = light('AREA', name + 'L', (x, y, z - 0.078), (0, 0, 0), energy=energy, color=kelvin(kelv), size=0.1,
              size_y=length, shape='RECTANGLE', coll=coll)
    return {'mat': tm, 'sock': sock, 'light': L, 'strength': strength, 'energy': energy}


def flicker(fx, pattern, extra=()):
    """Starter-ballast switch-on: pattern [(frame, level), ...] held until the next key (CONSTANT).
    extra: [(light_obj, full_energy), ...] driven by the same pattern (e.g. a key light from that fixture)."""
    for f, lv in pattern:
        fx['sock'].default_value = fx['strength'] * lv
        fx['sock'].keyframe_insert('default_value', frame=f)
        fx['light'].data.energy = fx['energy'] * lv
        fx['light'].data.keyframe_insert('energy', frame=f)
        for lo, en in extra:
            lo.data.energy = en * lv
            lo.data.keyframe_insert('energy', frame=f)
    ids = [fx['mat'].node_tree, fx['light'].data] + [lo.data for lo, _ in extra]
    for idb in ids:
        for fc in fcurves(idb):
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT'


# ----------------------------------------------------------------------------- sensors and camera

def pir_sensor(M, corner=PIR_CORNER, diag=(-0.7071, -0.7071), aim=(-0.3, 2.6, 0.6), name='PIR', coll=None):
    """Heat/motion (PIR) detector on a corner bracket just under the ceiling. Off-white ABS body, faceted Fresnel lens
    across the lower front. Returns dict(root, lens, lens_center (world))."""
    cx, cy, cz = corner
    dx, dy = diag
    # corner bracket: plate across the corner at 45 degrees + short arm
    plate_c = (cx + dx * 0.035, cy + dy * 0.035, cz - 0.07)
    pl = box(name + 'Plate', (0.075, 0.008, 0.1), plate_c, (0, 0, math.atan2(dy, dx) + math.pi / 2), coll=coll,
             bev=0.002, mat=M['abs'])
    loc = Vector((cx + dx * 0.105, cy + dy * 0.105, cz - 0.1))
    root = empty(name, tuple(loc), coll=coll)
    d = Vector(aim) - loc
    root.rotation_euler = d.to_track_quat('Y', 'Z').to_euler()
    body = box(name + 'Body', (0.064, 0.044, 0.108), (0, -0.022, 0), coll=coll, bev=0.008, seg=3, mat=M['abs'])
    parent(body, root, keep=False)
    # Fresnel lens: faceted shallow cylinder (vertical facet strips, 3 horizontal bands)
    bm = bmesh.new()
    nx, nz = 10, 3
    vs = {}
    for ix in range(nx + 1):
        for iz in range(nz + 1):
            x = -0.027 + 0.054 * ix / nx
            z = -0.047 + 0.062 * iz / nz
            y = 0.0012 + 0.0085 * math.cos(math.pi * x / 0.054) * (0.86 + 0.14 * math.sin(math.pi * iz / nz))
            vs[ix, iz] = bm.verts.new((x, y, z))
    for ix in range(nx):
        for iz in range(nz):
            bm.faces.new((vs[ix, iz], vs[ix + 1, iz], vs[ix + 1, iz + 1], vs[ix, iz + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    lens = from_bmesh(name + 'Lens', bm, coll, smooth=False)
    sol = lens.modifiers.new('t', 'SOLIDIFY')
    sol.thickness = 0.0015
    set_mat(lens, M['fresnel'])
    parent(lens, root, keep=False)
    win = prim('cyl', name + 'Win', (0.019, 0.0003, 0.036), (math.radians(90), 0, 0), seg=16, r=0.0032, depth=0.0012,
               coll=coll)
    set_mat(win, M['smoke'])
    parent(win, root, keep=False)
    scr = prim('cyl', name + 'Screw', (0.0, 0.0003, 0.046), (math.radians(90), 0, 0), seg=12, r=0.0022, depth=0.001,
               coll=coll)
    set_mat(scr, M['socket'])
    parent(scr, root, keep=False)
    bpy.context.view_layer.update()
    back = root.matrix_world @ Vector((0, -0.044, 0.02))
    cyl_between(name + 'Arm', back, (plate_c[0], plate_c[1], plate_c[2] + 0.01), 0.007, M['abs'], coll=coll)
    ball = prim('sphere', name + 'Ball', tuple(back), seg=16, ring=8, r=0.011, coll=coll)
    set_mat(ball, M['abs'])
    return {'root': root, 'lens': lens, 'lens_center': root.matrix_world @ Vector((0, 0.008, -0.016))}


def light_sensor(M, loc=LIGHT_SENSOR, taped=True, tape_angle=0.35, name='LightSensor', coll=None, seed=3):
    """Ceiling light detector: round base + small dome lens. taped: a strip of black gaffer tape stretched over it
    (tents over the dome, bridges the step, one end lifting). Returns dict(base, tape)."""
    x, y, z = loc
    base = prim('cyl', name + 'Base', (x, y, z - 0.007), seg=48, r=0.04, depth=0.014, coll=coll)
    bevel(base, 0.003, 2)
    set_mat(base, M['abs'])
    bez = prim('torus', name + 'Bezel', (x, y, z - 0.0142), R=0.0135, r=0.0018, seg=32, seg2=8, coll=coll)
    set_mat(bez, M['abs'])
    dome = prim('sphere', name + 'Dome', (x, y, z - 0.014), seg=24, ring=12, r=0.011, coll=coll)
    dome.scale = (1, 1, 0.8)
    set_mat(dome, M['smoke'])
    tape = None
    if taped:
        rng = random.Random(seed)
        L, Wt = 0.17, 0.048
        nu, nv = 68, 14
        ca, sa = math.cos(tape_angle), math.sin(tape_angle)
        ph = [rng.uniform(0, 6.28) for _ in range(4)]

        def drop(r):          # how far below the ceiling the tape sits at radius r from the sensor centre
            dome_h = 0.014 + (0.0088 * math.sqrt(max(0.0, 1 - (r / 0.011) ** 2)) if r < 0.011 else 0.0)
            tent = 0.0228 - (0.0228 - 0.0143) * min(r / 0.034, 1.0)
            if r <= 0.04:
                h = max(dome_h, tent, 0.0143)
            elif r <= 0.062:
                k = (r - 0.04) / 0.022
                h = 0.0143 * (1 - k * k * (3 - 2 * k))
            else:
                h = 0.0
            return h + 0.0004

        bm = bmesh.new()
        vs = {}
        for iu in range(nu + 1):
            u = -L / 2 + L * iu / nu
            for iv in range(nv + 1):
                v = -Wt / 2 + Wt * iv / nv
                px, py = x + u * ca - v * sa, y + u * sa + v * ca
                r = math.hypot(px - x, py - y)
                h = drop(r)
                h += 0.00035 * math.sin(u * 160 + ph[0]) * math.sin(v * 90 + ph[1]) * (1 if r > 0.035 else 0.3)
                if u > L / 2 - 0.03 and v > 0:        # the free end peels away from the ceiling
                    k = (u - (L / 2 - 0.03)) / 0.03 * (v / (Wt / 2))
                    h += 0.009 * k * k
                vs[iu, iv] = bm.verts.new((px, py, z - h))
        for iu in range(nu):
            for iv in range(nv):
                bm.faces.new((vs[iu, iv], vs[iu, iv + 1], vs[iu + 1, iv + 1], vs[iu + 1, iv]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        tape = from_bmesh(name + 'Tape', bm, coll, smooth=True, angle=60)
        sol = tape.modifiers.new('t', 'SOLIDIFY')
        sol.thickness = 0.0003
        set_mat(tape, M['tape'])
    return {'base': base, 'tape': tape}


def cctv(M, loc=CCTV_LOC, aim=(0.1, 1.0, 0.9), wall_pt=None, name='CCTV', coll=None, led=True):
    """Early-2000s box camera in a housing with a sunshield, on a wall arm. A small red status LED on the front bezel
    (the only red in the film). Built facing local +Y. Returns dict(root, led, led_world)."""
    root = empty(name, loc, coll=coll)
    d = Vector(aim) - Vector(loc)
    root.rotation_euler = d.to_track_quat('Y', 'Z').to_euler()
    ps = []
    ps.append(box(name + 'Housing', (0.082, 0.25, 0.074), (0, 0, 0), coll=coll, bev=0.006, seg=3, mat=M['housing']))
    ps.append(box(name + 'Bezel', (0.088, 0.016, 0.08), (0, 0.129, 0), coll=coll, bev=0.004, mat=M['socket']))
    ps.append(box(name + 'Glass', (0.07, 0.002, 0.062), (0, 0.1375, 0), coll=coll, mat=M['camglass']))
    lb = prim('cyl', name + 'Barrel', (0, 0.112, 0.003), (math.radians(90), 0, 0), seg=32, r=0.021, depth=0.045, coll=coll)
    set_mat(lb, M['lensblack'])
    ps.append(lb)
    le = prim('sphere', name + 'Elem', (0, 0.133, 0.003), seg=24, ring=12, r=0.016, coll=coll)
    le.scale = (1, 0.25, 1)
    set_mat(le, M['coated'])
    ps.append(le)
    ps.append(box(name + 'Shield', (0.1, 0.3, 0.003), (0, 0.022, 0.0445), coll=coll, bev=0.001, mat=M['housing']))
    for sx in (-1, 1):
        ps.append(box(name + 'Rail', (0.004, 0.24, 0.006), (sx * 0.045, 0.022, 0.0412), coll=coll, mat=M['housing']))
    ps.append(box(name + 'Rear', (0.085, 0.012, 0.077), (0, -0.129, 0), coll=coll, bev=0.003, mat=M['socket']))
    gl = prim('cyl', name + 'Gland', (0, -0.14, -0.018), (math.radians(90), 0, 0), seg=16, r=0.006, depth=0.016,
              coll=coll)
    set_mat(gl, M['lensblack'])
    ps.append(gl)
    ps.append(box(name + 'Clamp', (0.03, 0.07, 0.012), (0, -0.03, -0.043), coll=coll, bev=0.002, mat=M['socket']))
    ball = prim('sphere', name + 'Ball', (0, -0.03, -0.058), seg=16, ring=8, r=0.012, coll=coll)
    set_mat(ball, M['socket'])
    ps.append(ball)
    ledo = None
    if led:
        ring_ = prim('cyl', name + 'LedRing', (0.031, 0.1375, -0.03), (math.radians(90), 0, 0), seg=16, r=0.0028,
                     depth=0.0016, coll=coll)
        set_mat(ring_, M['lensblack'])
        ps.append(ring_)
        ledo = prim('sphere', name + 'LED', (0.031, 0.1385, -0.03), seg=12, ring=6, r=0.0017, coll=coll)
        set_mat(ledo, M['led'])
        ps.append(ledo)
    for p in ps:
        parent(p, root, keep=False)
    bpy.context.view_layer.update()
    bw = root.matrix_world @ Vector((0, -0.03, -0.062))
    if wall_pt is None:
        wall_pt = (loc[0], END_Y, loc[2] - 0.1)
    arm = cyl_between(name + 'Arm', bw, wall_pt, 0.0085, M['socket'], coll=coll)
    wp = box(name + 'WallPlate', (0.07, 0.01, 0.1), (wall_pt[0], wall_pt[1] - 0.004, wall_pt[2]), coll=coll, bev=0.002,
             mat=M['socket'])
    g = root.matrix_world @ Vector((0, -0.148, -0.018))
    cord(name + 'Cable', [tuple(g), (g.x, g.y + 0.03, g.z - 0.05), (wall_pt[0] - 0.05, wall_pt[1] - 0.012, wall_pt[2] - 0.08),
                          (wall_pt[0] - 0.06, wall_pt[1] - 0.006, wall_pt[2] - 0.4),
                          (wall_pt[0] - 0.06, wall_pt[1] - 0.006, wall_pt[2] - 0.6)], 0.0035, M['cable'], coll=coll)
    led_w = root.matrix_world @ Vector((0.031, 0.1405, -0.03))
    return {'root': root, 'led': ledo, 'led_world': led_w}


# ----------------------------------------------------------------------------- the night: foam shield, crank tool

def foam_sheet(M, name='Foam', size=(0.9, 0.04, 1.75), coll=None):
    """White EPS sheet, local origin at the centre of its bottom edge; the big faces look along local +-Y."""
    o = box(name, size, (0, 0, size[2] / 2), coll=coll, bev=0.006, seg=2, mat=M['foam'])
    root = empty(name + 'Root', (0, 0, 0), coll=coll)
    parent(o, root, keep=False)
    return root


def door_lock_point(c, r, y0=WALL_Y0, z0=0.18):
    """World position of a closed right-wall door's lock rosette (front face)."""
    w, h = CW - 0.012, RH - 0.012
    return Vector((WALL_X - 0.01 - 0.008 - 0.004, y0 + c * CW + 0.006 + w * 0.72, z0 + r * RH + 0.006 + h * 0.5))


def crank_tool(M, c, r, y0=WALL_Y0, z0=0.18, name='Crank', coll=None):
    """The custom hand-cranked puller (no hand): a heavy bridge clamp braced on the neighbouring cells, a lead screw
    through a boss on the door's lock, a crank arm with a worn grip. Right wall only (faces -X).
    Returns dict(root, crank (rotate .x), screw (slides along x), claw)."""
    L = door_lock_point(c, r, y0, z0)
    face = WALL_X - 0.018
    dc = y0 + c * CW + CW / 2                         # door centre (y)
    root = empty(name, (face, dc, L.z), coll=coll)
    stand = 0.085
    ps = []
    ps.append(box(name + 'Bridge', (0.032, 0.42, 0.042), (-stand, 0, 0), coll=coll, bev=0.004, seg=2, mat=M['tool']))
    for sy in (-1, 1):
        ps.append(box(name + 'Foot', (stand - 0.014, 0.034, 0.05), (-(stand - 0.014) / 2 - 0.007, sy * 0.195, 0),
                      coll=coll, bev=0.003, mat=M['tool']))
        ps.append(box(name + 'Pad', (0.008, 0.04, 0.056), (-0.004, sy * 0.195, 0), coll=coll, bev=0.002, mat=M['grip']))
        ps.append(box(name + 'Gusset', (0.03, 0.012, 0.03), (-stand + 0.03, sy * 0.17, 0.0), coll=coll, bev=0.002,
                      mat=M['tool']))
    ly = L.y - dc
    boss = prim('cyl', name + 'Boss', (-stand - 0.005, ly, 0), (0, math.radians(90), 0), seg=24, r=0.021, depth=0.06,
                coll=coll)
    set_mat(boss, M['tool'])
    ps.append(boss)
    nut = prim('cyl', name + 'Nut', (-stand - 0.04, ly, 0), (0, math.radians(90), 0), seg=6, r=0.019, depth=0.014,
               coll=coll)
    bevel(nut, 0.0015, 1)
    set_mat(nut, M['toolbright'])
    ps.append(nut)
    for p in ps:
        parent(p, root, keep=False)
    # screw assembly (slides along x as it draws the door): claw + threaded rod + crank
    scr = empty(name + 'Screw', (0, ly, 0), coll=coll)
    parent(scr, root, keep=False)
    claw = box(name + 'Claw', (0.012, 0.05, 0.04), (-0.008, 0, 0), coll=coll, bev=0.003, mat=M['tool'])
    parent(claw, scr, keep=False)
    for sz in (-1, 1):
        f = box(name + 'Finger', (0.02, 0.008, 0.008), (0.002, 0, sz * 0.02), coll=coll, bev=0.0015, mat=M['tool'])
        parent(f, scr, keep=False)
    rod = prim('cyl', name + 'Rod', (-0.1, 0, 0), (0, math.radians(90), 0), seg=20, r=0.0085, depth=0.19, coll=coll)
    set_mat(rod, M['toolbright'])
    parent(rod, scr, keep=False)
    crank = empty(name + 'CrankPv', (-0.19, 0, 0), coll=coll)
    parent(crank, scr, keep=False)
    hub = prim('cyl', name + 'Hub', (0, 0, 0), (0, math.radians(90), 0), seg=20, r=0.016, depth=0.024, coll=coll)
    set_mat(hub, M['tool'])
    arm = box(name + 'Arm', (0.014, 0.022, 0.13), (-0.004, 0, 0.06), coll=coll, bev=0.003, mat=M['tool'])
    grip = prim('cyl', name + 'Grip', (-0.05, 0, 0.12), (0, math.radians(90), 0), seg=20, r=0.0125, depth=0.085,
                coll=coll)
    bevel(grip, 0.003, 2)
    set_mat(grip, M['grip'])
    cap = prim('cyl', name + 'Cap', (-0.095, 0, 0.12), (0, math.radians(90), 0), seg=16, r=0.009, depth=0.008,
               coll=coll)
    set_mat(cap, M['toolbright'])
    for p in (hub, arm, grip, cap):
        parent(p, crank, keep=False)
    return {'root': root, 'crank': crank, 'screw': scr, 'claw': claw}


# ----------------------------------------------------------------------------- floor props (hero scale)

def torn_envelope(M, name, loc, rz=0.0, mat=None, coll=None, seed=0, size=(0.22, 0.11), gap=0.006, strip=True):
    """Envelope torn open along the top: back sheet + front sheet with ragged tear lines, mouth slightly open; plus
    the torn-off strip lying beside it."""
    rng = random.Random(seed)
    W, H = size
    mat = mat or M['white_env']
    nx, ny = 56, 8

    def walk(n, amp, base):
        out, v = [], 0.0
        for i in range(n + 1):
            v = v * 0.7 + rng.uniform(-1, 1) * amp
            out.append(base + v + 0.002 * math.sin(i * 0.4 + seed))
        return out

    tf = walk(nx, 0.0028, H / 2 - 0.016)
    tb = walk(nx, 0.0022, H / 2 - 0.009)
    ph = rng.uniform(0, 6.28)

    def crumple(x, y):
        return 0.0018 * math.sin(x * 23 + ph) * math.sin(y * 31 + ph * 0.7) + 0.0012 * math.sin(x * 57 + y * 41)

    bm = bmesh.new()
    for top, zf in ((tb, 0.0), (tf, 1.0)):
        vs = {}
        for ix in range(nx + 1):
            x = -W / 2 + W * ix / nx
            for iy in range(ny + 1):
                t = iy / ny
                y = -H / 2 + t * (top[ix] + H / 2)
                z = 0.0006 + crumple(x, y) + zf * (0.0007 + gap * t * t * (0.55 + 0.45 * math.cos(math.pi * x / W)))
                vs[ix, iy] = bm.verts.new((x, y, z))
        for ix in range(nx):
            for iy in range(ny):
                bm.faces.new((vs[ix, iy], vs[ix + 1, iy], vs[ix + 1, iy + 1], vs[ix, iy + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = from_bmesh(name, bm, coll, smooth=True, angle=70)
    sol = o.modifiers.new('t', 'SOLIDIFY')
    sol.thickness = 0.0004
    set_mat(o, mat)
    o.location = loc
    o.rotation_euler = (0, 0, rz)
    made = [o]
    if strip:
        bm = bmesh.new()
        vs = {}
        for ix in range(nx + 1):
            x = -W / 2 + W * ix / nx
            for iy in range(3):
                y = tf[ix] + (H / 2 - tf[ix]) * iy / 2
                vs[ix, iy] = bm.verts.new((x, y - H / 2 + 0.012, 0.0))
        for ix in range(nx):
            for iy in range(2):
                bm.faces.new((vs[ix, iy], vs[ix + 1, iy], vs[ix + 1, iy + 1], vs[ix, iy + 1]))
        s = from_bmesh(name + 'Strip', bm, coll, smooth=True)
        sol = s.modifiers.new('t', 'SOLIDIFY')
        sol.thickness = 0.0004
        bd = s.modifiers.new('bend', 'SIMPLE_DEFORM')
        bd.deform_method = 'BEND'
        bd.deform_axis = 'Y'
        bd.angle = rng.uniform(0.6, 1.2)
        set_mat(s, mat)
        a = rz + rng.uniform(-0.6, 0.6)
        s.location = (loc[0] + 0.05 * math.cos(rz + 1.4), loc[1] + 0.09 * math.sin(rz + 1.4), loc[2] + 0.004)
        s.rotation_euler = (0, 0, a)
        made.append(s)
    return made


def pouch_empty(M, name, loc, rz=0.0, mat=None, coll=None, seed=0, length=0.12, width=0.078):
    """Emptied velvet drawstring pouch lying flat: deflated body, gathered neck, open ruffled mouth, loose cord."""
    rng = random.Random(seed)
    mat = mat or M['velvet_b']
    nu, nv = 30, 24
    ph = [rng.uniform(0, 6.28) for _ in range(3)]

    def half_w(u):
        if u < 0.2:
            k = u / 0.2
            return width / 2 * math.sqrt(max(0.0, 1 - (1 - k) ** 2)) + 0.002
        if u < 0.66:
            return width / 2 * (1 - 0.06 * (u - 0.2))
        if u < 0.8:
            k = (u - 0.66) / 0.14
            return width / 2 * (1 - k * k * (3 - 2 * k)) * 0.97 + 0.009 * k
        k = (u - 0.8) / 0.2
        return 0.009 + 0.022 * k ** 0.7

    def thick(u):
        if u < 0.66:
            return 0.008 + 0.003 * math.sin(u * 9 + ph[0])
        if u < 0.82:
            return 0.008 + 0.008 * (u - 0.66) / 0.16
        return 0.016 - 0.004 * (u - 0.82) / 0.18

    bm = bmesh.new()
    rings = []
    for iu in range(nu + 1):
        u = iu / nu
        x = -length / 2 + u * length
        w, t = half_w(u), thick(u)
        ring_ = []
        for iv in range(nv):
            v = 2 * math.pi * iv / nv
            ruff = 1 + (0.18 * math.sin(7 * v + ph[1]) if u > 0.82 else 0.0)
            yv = w * math.cos(v) * ruff
            zv = t / 2 * math.sin(v) * ruff
            zv += 0.0015 * math.sin(x * 90 + ph[2]) * math.cos(yv * 70) * (1 if u < 0.7 else 0.4)
            ring_.append(bm.verts.new((x, yv, zv + t / 2)))
        rings.append(ring_)
    for iu in range(nu):
        a, b = rings[iu], rings[iu + 1]
        for iv in range(nv):
            j = (iv + 1) % nv
            bm.faces.new((a[iv], a[j], b[j], b[iv]))
    c0 = bm.verts.new((-length / 2, 0, thick(0) / 2))
    for iv in range(nv):
        bm.faces.new((rings[0][(iv + 1) % nv], rings[0][iv], c0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = from_bmesh(name, bm, coll, smooth=True, angle=80)
    sol = o.modifiers.new('t', 'SOLIDIFY')
    sol.thickness = 0.0012
    set_mat(o, mat)
    o.location = loc
    o.rotation_euler = (0, 0, rz)
    # drawstring: loop around the neck, two loose tails on the floor (world points)
    bpy.context.view_layer.update()
    mw = o.matrix_world
    xn = -length / 2 + 0.79 * length
    loop = [mw @ Vector((xn, 0.0115 * math.cos(a), 0.0105 + 0.0085 * math.sin(a))) for a in
            [2 * math.pi * k / 12 for k in range(13)]]
    cmat = M.get('cord_mat') or mat_principled('PouchCord', color=(0.5, 0.42, 0.25), rough=0.6, spec=0.3)
    M['cord_mat'] = cmat
    cord(name + 'Loop', [tuple(p) for p in loop], 0.0011, cmat, coll=coll)
    for s in (-1, 1):
        pts = [mw @ Vector((xn, s * 0.011, 0.006))]
        for k in range(1, 5):
            pts.append(mw @ Vector((xn + 0.012 * k + rng.uniform(-0.004, 0.004), s * (0.014 + 0.012 * k) +
                                    rng.uniform(-0.006, 0.006), 0.0012)))
        cord(name + 'Tail', [tuple(p) for p in pts], 0.0011, cmat, coll=coll)
        kn = prim('sphere', name + 'Knot', tuple(pts[-1]), seg=10, ring=6, r=0.0024, coll=coll)
        set_mat(kn, cmat)
    return o


def passport(M, name, loc, rz=0.0, open_deg=0.0, cover=None, coll=None, tilt=0.0):
    """Closed (or slightly open) passport booklet: rounded covers with leather grain, cream page block."""
    W, H = 0.125, 0.088
    cover = cover or M['passport']
    root = empty(name, loc, coll=coll)
    root.rotation_euler = (tilt, 0, rz)
    back = extrude_profile(name + 'Back', rrect(W, H, 0.0045), 0.0011, coll=coll)
    set_mat(back, cover)
    pages = extrude_profile(name + 'Pages', rrect(W - 0.004, H - 0.004, 0.0035), 0.0034, coll=coll)
    pages.location = (0.0012, 0, 0.0011)
    set_mat(pages, M['pages'])
    hinge = empty(name + 'Hinge', (-W / 2, 0, 0.0045), coll=coll)
    front = extrude_profile(name + 'Front', rrect(W, H, 0.0045), 0.0011, coll=coll)
    front.location = (W / 2, 0, 0)
    set_mat(front, cover)
    for o in (back, pages, hinge):
        parent(o, root, keep=False)
    parent(front, hinge, keep=False)
    hinge.rotation_euler.y = -math.radians(open_deg)
    return root


def ring_jewel(M, name, loc, rz=0.0, coll=None):
    """A gold ring with a small pale stone in a four-prong setting, lying on its side (no sparkle-ad treatment)."""
    root = empty(name, loc, coll=coll)
    root.rotation_euler = (0, math.radians(-9), rz)
    band = prim('torus', name + 'Band', (0, 0, 0), R=0.0093, r=0.0017, seg=48, seg2=12, coll=coll)
    band.scale = (1, 1, 0.85)
    set_mat(band, M['gold'])
    cup = prim('cone', name + 'Cup', (0.0112, 0, 0), (0, math.radians(90), 0), seg=16, r=0.0022, r2=0.0036,
               depth=0.0028, coll=coll)
    set_mat(cup, M['gold'])
    crown = prim('cone', name + 'Crown', (0.0139, 0, 0), (0, math.radians(90), 0), seg=8, r=0.0036, r2=0.0021,
                 depth=0.0014, coll=coll)
    pav = prim('cone', name + 'Pav', (0.0121, 0, 0), (0, math.radians(-90), 0), seg=8, r=0.0036, r2=0.0, depth=0.0026,
               coll=coll)
    for s in (crown, pav):
        set_mat(s, M['stone'])
        s.data.polygons.foreach_set('use_smooth', [False] * len(s.data.polygons))
    parts = [band, cup, crown, pav]
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        pr = prim('cyl', name + 'Prong', (0.0128, 0.0034 * math.cos(a), 0.0034 * math.sin(a)), (0, math.radians(90), 0),
                  seg=8, r=0.0005, depth=0.0034, coll=coll)
        set_mat(pr, M['gold'])
        parts.append(pr)
    for p in parts:
        parent(p, root, keep=False)
    return root


def diamond_paper(M, name, loc, rz=0.0, open_a=0.5, coll=None, seed=0, size=(0.19, 0.125)):
    """Opened diamond paper ('briefke'): creased white sheet, pale blue liner inside, panels half folded up."""
    rng = random.Random(seed)
    W, H = size
    nx, ny = 24, 18
    a1, a2 = open_a * rng.uniform(0.6, 1.0), open_a * rng.uniform(0.2, 0.9)
    b = open_a * rng.uniform(0.0, 0.5)
    ph = rng.uniform(0, 6.28)
    bm = bmesh.new()
    vs = {}
    for ix in range(nx + 1):
        x = -W / 2 + W * ix / nx
        for iy in range(ny + 1):
            y = -H / 2 + H * iy / ny
            z = 0.0
            yy = y
            if abs(y) > H / 6:
                s = 1 if y > 0 else -1
                a = a1 if s > 0 else a2
                dd = abs(y) - H / 6
                yy = s * (H / 6 + dd * math.cos(a))
                z = dd * math.sin(a)
            xx = x
            if abs(x) > W * 0.36:
                s = 1 if x > 0 else -1
                dd = abs(x) - W * 0.36
                xx = s * (W * 0.36 + dd * math.cos(b))
                z += dd * math.sin(b)
            z += 0.0008 * math.sin(x * 60 + ph) * math.sin(y * 70) + 0.0006
            vs[ix, iy] = bm.verts.new((xx, yy, z))
    for ix in range(nx):
        for iy in range(ny):
            bm.faces.new((vs[ix, iy], vs[ix + 1, iy], vs[ix + 1, iy + 1], vs[ix, iy + 1]))
    for f in bm.faces:
        f.normal_update()
    if sum(f.normal.z for f in bm.faces) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    o = from_bmesh(name, bm, coll, smooth=True, angle=25)
    set_mat(o, M['dpaper'])
    o.location = loc
    o.rotation_euler = (0, 0, rz)
    return o


def jewel_box(M, name, loc, rz=0.0, kind='ring', lid_deg=105.0, coll=None, mat=None):
    """Emptied jewellery case: leatherette shell, satin insert, lid thrown back. kind 'ring' or 'necklace'."""
    W, D, H = (0.058, 0.058, 0.032) if kind == 'ring' else (0.21, 0.065, 0.028)
    mat = mat or M['leather'][0]
    root = empty(name, loc, coll=coll)
    root.rotation_euler = (0, 0, rz)
    hb = H * 0.6
    base = open_box(name + 'Base', (W, D, hb), 0.0035, mat, coll=coll)
    base.location = (0, 0, hb / 2)
    ins = box(name + 'Insert', (W - 0.008, D - 0.008, 0.004), (0, 0, hb - 0.006), coll=coll, bev=0.0015, mat=M['satin'])
    parts = [base, ins]
    if kind == 'ring':
        parts.append(box(name + 'Slot', (W * 0.55, 0.0022, 0.003), (0, 0, hb - 0.0035), coll=coll, mat=M['hole']))
    hinge = empty(name + 'Hinge', (0, D / 2, hb), coll=coll)
    lid = box(name + 'Lid', (W, D, H - hb), (0, -D / 2, (H - hb) / 2), coll=coll, bev=0.003, seg=2, mat=mat)
    lin = box(name + 'Lining', (W - 0.008, D - 0.008, 0.001), (0, -D / 2, -0.0004), coll=coll, mat=M['satin'])
    parent(lid, hinge, keep=False)
    parent(lin, hinge, keep=False)
    hinge.rotation_euler.x = -math.radians(lid_deg)
    for p in parts + [hinge]:
        parent(p, root, keep=False)
    return root


def deposit_tray(M, name, loc, rot=(0, 0, 0), coll=None):
    """Emptied steel box insert (the long tray inside a deposit cell), dumped on the floor."""
    root = empty(name, loc, coll=coll)
    root.rotation_euler = rot
    t = open_box(name + 'Tray', (0.27, 0.15, 0.055), 0.0013, M['tray'], coll=coll)
    t.location = (0, 0, 0.0275)
    h = box(name + 'Pull', (0.006, 0.05, 0.01), (0.139, 0, 0.04), coll=coll, bev=0.002, mat=M['toolbright'])
    parent(t, root, keep=False)
    parent(h, root, keep=False)
    return root


def card(M, name, loc, rz=0.0, k=0, coll=None, z_tilt=0.0):
    o = box(name, (0.0856, 0.054, 0.0008), (loc[0], loc[1], loc[2] + 0.0004), (z_tilt, 0, rz), coll=coll, bev=0.0003,
            mat=M['card'][k % len(M['card'])])
    return o


def sorted_loot(M, center, seed=5, coll=None):
    """What the crew left where they sorted the haul: piles by kind (torn envelopes, opened diamond papers, emptied
    cases and trays, passports and cards, emptied pouches, a couple of rings). center: (x, y)."""
    rng = random.Random(seed)
    cx, cy = center
    made = []
    # envelope heap
    for i in range(16):
        a = rng.uniform(0, 2 * math.pi)
        r = abs(rng.gauss(0, 0.07))
        made += torn_envelope(M, f'SEnv{i}', (cx + 0.02 + r * math.cos(a), cy + 0.05 + r * math.sin(a), 0.0015 * i),
                              rng.uniform(-0.6, 0.6) + (math.pi if i % 3 == 0 else 0),
                              mat=M['white_env'] if rng.random() < 0.6 else M['kraft'], coll=coll, seed=100 + i,
                              strip=(i % 4 == 0))
    # opened diamond papers in a loose row
    for i in range(9):
        made.append(diamond_paper(M, f'SDp{i}', (cx + 0.28 + 0.06 * i + rng.uniform(-0.03, 0.03),
                                                 cy + 0.3 + rng.uniform(-0.06, 0.06), 0.0005 * i),
                                  rng.uniform(-0.4, 0.4) + 0.3, open_a=rng.uniform(0.3, 0.9), coll=coll, seed=200 + i))
    # passports stacked askew + one open, cards fanned beside
    for i in range(4):
        made.append(passport(M, f'SPass{i}', (cx - 0.38 + rng.uniform(-0.01, 0.01), cy + 0.12 + rng.uniform(-0.012, 0.012),
                                              0.0057 * i), 0.4 + rng.uniform(-0.25, 0.25), coll=coll,
                             cover=M['passport'] if i != 2 else M['card'][0]))
    made.append(passport(M, 'SPassOpen', (cx - 0.25, cy - 0.04, 0.0), 1.2, open_deg=24, coll=coll))
    for i in range(7):
        made.append(card(M, f'SCard{i}', (cx - 0.52 + 0.012 * i, cy - 0.06 + 0.006 * i, 0.0009 * i),
                         0.2 + 0.11 * i, k=i, coll=coll))
    # emptied containers
    made.append(jewel_box(M, 'SJBox0', (cx + 0.36, cy - 0.12, 0), 0.5, coll=coll, mat=M['leather'][0]))
    made.append(jewel_box(M, 'SJBox1', (cx + 0.45, cy - 0.02, 0), -0.4, lid_deg=120, coll=coll, mat=M['leather'][1]))
    made.append(jewel_box(M, 'SJBox2', (cx + 0.5, cy - 0.26, 0), 2.6, kind='necklace', lid_deg=95, coll=coll,
                          mat=M['leather'][2]))
    made.append(deposit_tray(M, 'STray0', (cx + 0.12, cy - 0.38, 0), (0, 0, 0.15), coll=coll))
    made.append(deposit_tray(M, 'STray1', (cx + 0.18, cy - 0.40, 0.056), (0, 0, -0.08), coll=coll))
    made.append(deposit_tray(M, 'STray2', (cx - 0.12, cy - 0.5, 0.075), (math.radians(90), 0, 0.5), coll=coll))
    # emptied pouches
    for i in range(3):
        made.append(pouch_empty(M, f'SPouch{i}', (cx - 0.24 + 0.09 * i, cy - 0.27 + 0.03 * i, 0.0),
                                rng.uniform(0, 6.28), mat=M['velvet_b'] if i != 1 else M['velvet_r'], coll=coll,
                                seed=300 + i))
    # left behind: two rings
    made.append(ring_jewel(M, 'SRing0', (cx - 0.2, cy + 0.27, 0.0031), 0.7, coll=coll))
    made.append(ring_jewel(M, 'SRing1', (cx - 0.33, cy + 0.3, 0.0031), 2.4, coll=coll))
    return made
