"""Set S1 for False Floor: the vault door + antechamber at Level -2 (illustrative reconstruction).

A rectangular, stepped 3-ton vault door (front plate 1.16 x 2.10 m, 0.42 m deep, tapered free edge with chrome bolts)
hung on two barrel hinges in a painted steel frame set into a 0.7 m concrete wall. Door front: 0-99 combination wheel
(tumbler/lib/lock.py build_dial, scaled) with a small reading lens on top, a keyhole for the long two-part key, a
3-spoke boltwork handle, and the two magnetic plates across the door/frame seam (hinge-opposite side). Keypad on the
wall right of the frame. Antechamber: low board-formed concrete room, ceiling fluorescent battens, CCTV camera, the
stairwell from Level -1 coming down to a steel grate (gate) opposite the door. Behind the door: the SF1 vault room
(forced box walls from lib/vault_ff.py) so the doorway can show it.

World: Z up, metres. Door wall front face is the plane y = 0; antechamber is y < 0; vault room is y > WALL_T.
Door hinge on the LEFT (seen from the antechamber), axis at (HINGE_X, HINGE_Y). The door opens toward the camera:
    S['door'].rotation_euler.z = -radians(angle)      (0 = shut, ~112 = wide open, ~1 = ajar hairline)

Usage (from a shot script, after `from ff import *`):
    import door_ff as D
    S = D.build_set(vault=True, stair=True)          # geometry + materials, no lights
    D.light_ante(S, 'day')                            # or 'night', 'dark', 'monday'
    D.light_vault(S, 'warm')                          # or 'off'
Handles in S (dict):
    door (hinge pivot empty), dial (rotate .rotation_euler.z), key_root (slide along local -Y to pull out),
    key_turn (rotate .rotation_euler.y), handle (rotate .rotation_euler.y), bolts [slide empties: +X extends],
    top_bolts [slide empties: +Z extends], grate (gate pivot: +rotation_euler.z opens into the antechamber),
    grate_bolt (slide empty: +X retracts), mag_door / mag_frame (the two magnetic plates), keypad, cctv,
    fixtures {name: dict(tubes, light, mat_on, mat_off)}, M (materials), points (useful world positions).
"""
import math, random
import bpy, bmesh
from mathutils import Vector
from ff import *
import vault_ff as VF

# ----------------------------------------------------------------------------- dimensions
WALL_T = 0.70                 # door wall thickness (y 0 .. WALL_T)
BORE_HW, BORE_H = 0.52, 2.06  # clear opening through the wall
REB_HW, REB_TOP = 0.586, 2.126
FRAME_HW, FRAME_TOP, FRAME_Y = 0.80, 2.34, -0.12
PLATE_HW, PLATE_Z = 0.58, (0.02, 2.12)
PLATE_Y = (-0.118, -0.02)
PANEL_HW, PANEL_Z, PANEL_FRONT = 0.50, (0.10, 2.04), -0.138
BODY_Y = (-0.02, 0.30)
BODY_Z = (0.02, 2.05)
BODY_FREE = (0.508, 0.4135)   # free-side x at front / back of the body (taper so it swings clear of the jamb)
HINGE_X, HINGE_Y = -0.66, -0.19
HINGE_Z = (0.42, 1.72)
BOLT_Y = 0.14
BOLT_Z = (0.28, 0.65, 1.03, 1.41, 1.78)
DIAL = Vector((0.16, PANEL_FRONT, 1.38))
DIAL_S = 0.062                # dial radius in metres (lock.py units are dial radii)
KEYHOLE = Vector((0.16, PANEL_FRONT, 1.12))
HANDLE = Vector((0.16, PANEL_FRONT, 0.84))
MAG_Z = (1.50, 1.70)
KEYPAD = Vector((1.10, 0.0, 1.40))
ROOM_X, ROOM_BACK, CEIL = 1.95, -3.80, 2.50
STAIR_HW, STAIR_RISE, STAIR_RUN, STAIR_N, STAIR_Y0 = 0.75, 0.18, 0.28, 16, -5.0
GATE_HW = 0.62
NIGHT_LAMP = (-0.69, -7.7, 2.85)     # bulkhead on the left stair wall (its light lands on the door's free side)
VAULT_CEIL = 2.95


def _free_x(y):
    """Free-side x of the door body at depth y (linear taper)."""
    t = (y - BODY_Y[0]) / (BODY_Y[1] - BODY_Y[0])
    return BODY_FREE[0] + (BODY_FREE[1] - BODY_FREE[0]) * t


# ----------------------------------------------------------------------------- geometry helpers

def xbox(name, x0, x1, y0, y1, z0, z1, mat=None, bev=0.0, seg=2, coll=None, angle=40.0):
    o = box(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), coll=coll, mat=mat)
    if bev:
        m = bevel(o, bev, seg, angle=angle)
        if seg == 1:
            m.profile = 0.5
    return o


def ycyl(name, x, y0, y1, z, r, mat=None, seg=32, bev=0.0, bseg=2, coll=None, r2=None):
    """Cylinder along Y from y0 to y1."""
    o = prim('cyl', name, (x, (y0 + y1) / 2, z), (math.radians(90), 0, 0), seg=seg, r=r, r2=r2 if r2 is not None else r,
             depth=abs(y1 - y0), coll=coll)
    if bev:
        bevel(o, bev, bseg, angle=30)
    if mat:
        set_mat(o, mat)
    return o


def xcyl(name, x0, x1, y, z, r, mat=None, seg=32, bev=0.0, coll=None):
    o = prim('cyl', name, ((x0 + x1) / 2, y, z), (0, math.radians(90), 0), seg=seg, r=r, depth=abs(x1 - x0), coll=coll)
    if bev:
        bevel(o, bev, 2, angle=30)
    if mat:
        set_mat(o, mat)
    return o


def zcyl(name, x, y, z0, z1, r, mat=None, seg=32, bev=0.0, coll=None):
    o = prim('cyl', name, (x, y, (z0 + z1) / 2), (0, 0, 0), seg=seg, r=r, depth=abs(z1 - z0), coll=coll)
    if bev:
        bevel(o, bev, 2, angle=30)
    if mat:
        set_mat(o, mat)
    return o


def pipe(name, pts, r, mat, coll=None, seg=12):
    """Polyline tube through world points (straight segments + small elbows)."""
    objs = []
    for i in range(len(pts) - 1):
        a, b = Vector(pts[i]), Vector(pts[i + 1])
        d = b - a
        o = prim('cyl', f'{name}{i}', (a + b) / 2, (0, 0, 0), seg=seg, r=r, depth=d.length, coll=coll)
        o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        set_mat(o, mat)
        objs.append(o)
        if 0 < i:
            e = prim('sphere', f'{name}e{i}', a, seg=seg, ring=8, r=r * 1.02, coll=coll)
            set_mat(e, mat)
            objs.append(e)
    return objs


def no_shadow(o):
    try:
        o.visible_shadow = False
    except Exception:
        pass
    return o


# ----------------------------------------------------------------------------- materials

def _tc(nb, kind='Object'):
    tc = nb.n('ShaderNodeTexCoord')
    return tc.outputs[kind]


def _maprange(nb, src, a, b, c=0.0, d=1.0, clamp=True):
    m = nb.n('ShaderNodeMapRange', **{'From Min': a, 'From Max': b, 'To Min': c, 'To Max': d})
    m.clamp = clamp
    nb.L.new(src, m.inputs['Value'])
    return m.outputs['Result']


def _m(nb, op, a, b=None, va=0.0, vb=0.0, clamp=False):
    """Math node on sockets (a/b may be sockets or None)."""
    n = nb.n('ShaderNodeMath', {'operation': op, 'use_clamp': clamp})
    n.inputs[0].default_value = va
    n.inputs[1].default_value = vb
    if a is not None:
        nb.L.new(a, n.inputs[0])
    if b is not None:
        nb.L.new(b, n.inputs[1])
    return n.outputs[0]


def _mixc(nb, fac, a, b, mode='MIX'):
    m = nb.n('ShaderNodeMix', {'data_type': 'RGBA', 'blend_type': mode})
    for sock, v in ((m.inputs[0], fac), (m.inputs[6], a), (m.inputs[7], b)):
        if hasattr(v, 'is_output'):
            nb.L.new(v, sock)
        else:
            if isinstance(v, (tuple, list)) and len(v) == 3:
                v = (*v, 1.0)
            sock.default_value = v
    return m.outputs[2]


def _mixf(nb, fac, a, b):
    m = nb.n('ShaderNodeMix', {'data_type': 'FLOAT'})
    for sock, v in ((m.inputs[0], fac), (m.inputs[2], a), (m.inputs[3], b)):
        if hasattr(v, 'is_output'):
            nb.L.new(v, sock)
        else:
            sock.default_value = v
    return m.outputs[0]


def _noise(nb, vec, scale, detail=6.0, rough=0.6, mapping=None):
    n = nb.n('ShaderNodeTexNoise', Scale=scale, Detail=detail, Roughness=rough)
    if mapping is not None:
        mp = nb.n('ShaderNodeMapping', Scale=mapping)
        nb.L.new(vec, mp.inputs['Vector'])
        vec = mp.outputs['Vector']
    nb.L.new(vec, n.inputs['Vector'])
    return n.outputs['Fac']


def mat_machined(name, base=(0.46, 0.47, 0.49), rough=(0.16, 0.30), axis='X', streak=650.0, aniso=0.5, smudge=0.5,
                 scratch=0.35, bump=0.012, dark=0.86, coord='Object'):
    """Machined/brushed steel: fine directional streaks (grooves run along `axis`), anisotropic highlights across the
    grooves, smudges/wipes, sparse bright scratches."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    p.inputs['Metallic'].default_value = 1.0
    if coord == 'World':
        v = nb.n('ShaderNodeNewGeometry').outputs['Position']
    else:
        v = _tc(nb, coord)
    st = {'X': (2.0, streak, streak), 'Y': (streak, 2.0, streak), 'Z': (streak, streak, 2.0)}[axis]
    nbr = _noise(nb, v, 1.0, 3.0, 0.55, mapping=st)
    nmac = _noise(nb, v, 2.2, 6.0, 0.62)
    nfin = _noise(nb, v, 16.0, 8.0, 0.6)
    r1 = _maprange(nb, nbr, 0.3, 0.7, rough[0], rough[0] + 0.7 * (rough[1] - rough[0]))
    r1 = _m(nb, 'ADD', r1, _maprange(nb, nfin, 0.3, 0.7, 0.0, 0.3 * (rough[1] - rough[0])))
    r2 = _maprange(nb, nmac, 0.5, 0.75, 0.0, 0.12 * smudge)
    rr = _m(nb, 'ADD', r1, r2)
    # sparse fine scratches: thin, long streaks in a few directions (stretched noise, thresholded high)
    scr = None
    for k, (rz, ry) in enumerate(((0.35, 0.0), (1.9, 0.4), (-0.8, 1.2))):
        mp = nb.n('ShaderNodeMapping', Rotation=(0.0, ry, rz), Scale=(900.0, 3.0, 3.0))
        nb.L.new(v, mp.inputs['Vector'])
        nz = nb.n('ShaderNodeTexNoise', Scale=1.0 + 0.37 * k, Detail=1.0, Roughness=0.5)
        nb.L.new(mp.outputs['Vector'], nz.inputs['Vector'])
        sk = _maprange(nb, nz.outputs['Fac'], 0.71, 0.76, 0.0, 1.0)
        gate = _maprange(nb, _noise(nb, v, 3.0 + k, 2.0, 0.5), 0.55, 0.7, 0.0, 1.0)
        sk = _m(nb, 'MULTIPLY', sk, gate)
        scr = sk if scr is None else _m(nb, 'MAXIMUM', scr, sk)
    scr = _m(nb, 'MULTIPLY', scr, None, vb=scratch)
    nb.L.new(_mixf(nb, scr, rr, rough[0] * 0.45), p.inputs['Roughness'])
    cr = nb.n('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].position = 0.25
    cr.color_ramp.elements[0].color = (*[c * dark for c in base], 1)
    cr.color_ramp.elements[1].position = 0.72
    cr.color_ramp.elements[1].color = (*base, 1)
    nb.L.new(nmac, cr.inputs[0])
    cf = _maprange(nb, nfin, 0.3, 0.7, 0.9, 1.05)
    cfc = nb.n('ShaderNodeCombineColor')
    for i in range(3):
        nb.L.new(cf, cfc.inputs[i])
    col = _mixc(nb, 1.0, cr.outputs['Color'], cfc.outputs[0], 'MULTIPLY')
    col = _mixc(nb, scr, col, tuple(min(1.0, c * 1.25) for c in base))
    nb.L.new(col, p.inputs['Base Color'])
    bmp = nb.n('ShaderNodeBump', Strength=bump, Distance=0.0015)
    nb.L.new(nbr, bmp.inputs['Height'])
    nb.L.new(bmp.outputs['Normal'], p.inputs['Normal'])
    if aniso:
        # brushing tangent in object space; on faces whose normal is (nearly) parallel to it, fall back to a second axis
        # so the anisotropy never degenerates into a swirl
        p.inputs['Anisotropic'].default_value = aniso
        ax = {'X': (1, 0, 0), 'Y': (0, 1, 0), 'Z': (0, 0, 1)}
        fb = {'X': 'Z', 'Y': 'Z', 'Z': 'X'}[axis]
        vt = nb.n('ShaderNodeVectorTransform', {'vector_type': 'VECTOR', 'convert_from': 'OBJECT', 'convert_to': 'WORLD'})
        vt.inputs['Vector'].default_value = ax[axis]
        vf = nb.n('ShaderNodeVectorTransform', {'vector_type': 'VECTOR', 'convert_from': 'OBJECT', 'convert_to': 'WORLD'})
        vf.inputs['Vector'].default_value = ax[fb]
        geo = nb.n('ShaderNodeNewGeometry')
        dp = nb.n('ShaderNodeVectorMath', {'operation': 'DOT_PRODUCT'})
        nb.L.new(geo.outputs['Normal'], dp.inputs[0])
        nb.L.new(vt.outputs['Vector'], dp.inputs[1])
        par = _maprange(nb, _m(nb, 'ABSOLUTE', dp.outputs['Value']), 0.8, 0.95)
        mv = nb.n('ShaderNodeMix', {'data_type': 'VECTOR'})
        nb.L.new(par, mv.inputs[0])
        nb.L.new(vt.outputs['Vector'], mv.inputs[4])
        nb.L.new(vf.outputs['Vector'], mv.inputs[5])
        nb.L.new(mv.outputs[1], p.inputs['Tangent'])
    return m


def mat_worn_paint(name, color, rough=(0.38, 0.58), edge=0.8, scuff=0.55, low=0.9, primer=(0.09, 0.075, 0.06),
                   steel=(0.42, 0.42, 0.43), bev_r=0.006, scale=1.0, dirt=0.5, sheen=0.0):
    """Painted steel: chipped edges (Bevel-node edge mask), scuffs concentrated low (kick zone), grime toward the floor."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    v = _tc(nb, 'Object')
    geo = nb.n('ShaderNodeNewGeometry')
    bv = nb.n('ShaderNodeBevel', {'samples': 4}, Radius=bev_r)
    dp = nb.n('ShaderNodeVectorMath', {'operation': 'DOT_PRODUCT'})
    nb.L.new(bv.outputs['Normal'], dp.inputs[0])
    nb.L.new(geo.outputs['Normal'], dp.inputs[1])
    e = _maprange(nb, dp.outputs['Value'], 0.995, 0.93, 0.0, 1.0)
    ne = _noise(nb, v, 22.0 * scale, 10.0, 0.7)
    eb = _maprange(nb, ne, 0.38, 0.62, 0.0, 1.0)
    em = _m(nb, 'MULTIPLY', _m(nb, 'MULTIPLY', e, eb), None, vb=edge * 1.6)
    ns = _noise(nb, v, 4.0 * scale, 12.0, 0.68)
    sm = _maprange(nb, ns, 0.6, 0.66, 0.0, 1.0)
    z = nb.n('ShaderNodeSeparateXYZ')
    nb.L.new(geo.outputs['Position'], z.inputs[0])
    zg = _maprange(nb, z.outputs['Z'], 0.05, 0.85, 1.0, 0.15)
    smm = _m(nb, 'MULTIPLY', _m(nb, 'MULTIPLY', sm, zg), None, vb=scuff * 1.5)
    smm = _m(nb, 'MULTIPLY', smm, None, vb=1.0)
    wear = _m(nb, 'MAXIMUM', em, smm, clamp=True)
    w_pr = _maprange(nb, wear, 0.12, 0.35)
    w_st = _maprange(nb, wear, 0.45, 0.85)
    nm = _noise(nb, v, 2.6 * scale, 6.0, 0.6)
    pc = nb.n('ShaderNodeValToRGB')
    pc.color_ramp.elements[0].position = 0.28
    pc.color_ramp.elements[0].color = (*[c * 0.82 for c in color], 1)
    pc.color_ramp.elements[1].position = 0.75
    pc.color_ramp.elements[1].color = (*[min(1, c * 1.12) for c in color], 1)
    nb.L.new(nm, pc.inputs[0])
    col = _mixc(nb, w_pr, pc.outputs['Color'], primer)
    col = _mixc(nb, w_st, col, steel)
    # grime toward the floor, broken by noise
    nd = _noise(nb, v, 7.0 * scale, 8.0, 0.65)
    gd = _m(nb, 'MULTIPLY', _maprange(nb, z.outputs['Z'], 0.0, 0.5, low * 0.55, 0.0), _maprange(nb, nd, 0.35, 0.7, 0.4, 1.0))
    gd = _m(nb, 'ADD', gd, _m(nb, 'MULTIPLY', _maprange(nb, nd, 0.5, 0.8, 0.0, 1.0), None, vb=dirt * 0.25))
    col = _mixc(nb, gd, col, (0.025, 0.022, 0.02))
    nb.L.new(col, p.inputs['Base Color'])
    nb.L.new(w_st, p.inputs['Metallic'])
    pr = _maprange(nb, nm, 0.3, 0.75, rough[0], rough[1])
    rr = _mixf(nb, w_pr, pr, 0.72)
    rr = _mixf(nb, w_st, rr, 0.32)
    rr = _mixf(nb, gd, rr, 0.85)
    nb.L.new(rr, p.inputs['Roughness'])
    # chips read as slightly recessed; plus fine orange peel
    op = _noise(nb, v, 160.0, 3.0, 0.5)
    h = _m(nb, 'ADD', _m(nb, 'MULTIPLY', w_pr, None, vb=-1.0), _m(nb, 'MULTIPLY', op, None, vb=0.08))
    bmp = nb.n('ShaderNodeBump', Strength=0.25, Distance=0.0006)
    nb.L.new(h, bmp.inputs['Height'])
    nb.L.new(bmp.outputs['Normal'], p.inputs['Normal'])
    if sheen:
        p.inputs['Coat Weight'].default_value = sheen
        p.inputs['Coat Roughness'].default_value = 0.35
    return m


def mat_board_concrete(name, base=(0.15, 0.148, 0.143), boards=0.17, axis='Z', stain=0.6, low=0.6, contrast=1.0,
                       seam=0.18):
    """Board-formed concrete (world coords so neighbouring boxes line up): mottling, board seams and grain, rain-like
    vertical stains, dirt toward the floor."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    geo = nb.n('ShaderNodeNewGeometry')
    v = geo.outputs['Position']
    z = nb.n('ShaderNodeSeparateXYZ')
    nb.L.new(v, z.inputs[0])
    n1 = _noise(nb, v, 1.4, 10.0, 0.62)
    n2 = _noise(nb, v, 7.0, 8.0, 0.6)
    gr_map = {'Z': (4.0, 4.0, 46.0), 'Y': (4.0, 46.0, 4.0), 'X': (46.0, 4.0, 4.0)}[axis]
    gr = _noise(nb, v, 1.0, 4.0, 0.6, mapping=gr_map)
    wv = nb.n('ShaderNodeTexWave', {'wave_type': 'BANDS', 'bands_direction': axis}, Scale=0.3142 / boards,
              Distortion=0.6, Detail=2.0, Detail_Scale=0.6)
    nb.L.new(v, wv.inputs['Vector'])
    sl = _maprange(nb, wv.outputs['Fac'], 0.0, 0.02, 1.0, 0.0)
    sl = _m(nb, 'MULTIPLY', sl, _maprange(nb, n2, 0.35, 0.6, 0.25, 1.0))
    st = _noise(nb, v, 1.0, 6.0, 0.6, mapping=(5.0, 5.0, 0.45) if axis == 'Z' else (0.45, 5.0, 5.0))
    stm = _m(nb, 'MULTIPLY', _maprange(nb, st, 0.52, 0.7, 0.0, 1.0), _maprange(nb, n1, 0.4, 0.65, 0.0, 1.0))
    lo, hi = 1 - 0.38 * contrast, 1 + 0.25 * contrast
    cr = nb.n('ShaderNodeValToRGB')
    els = cr.color_ramp.elements
    els[0].position, els[0].color = 0.25, (*[c * lo for c in base], 1)
    els[1].position, els[1].color = 0.78, (*[min(1, c * hi) for c in base], 1)
    nb.L.new(n1, cr.inputs[0])
    gf = _maprange(nb, gr, 0.3, 0.7, 0.88, 1.08)
    gfc = nb.n('ShaderNodeCombineColor')
    for i in range(3):
        nb.L.new(gf, gfc.inputs[i])
    col = _mixc(nb, 1.0, cr.outputs['Color'], gfc.outputs[0], 'MULTIPLY')
    col = _mixc(nb, _m(nb, 'MULTIPLY', sl, None, vb=seam), col, [c * 0.35 for c in base])
    col = _mixc(nb, _m(nb, 'MULTIPLY', stm, None, vb=stain * 0.5), col, [c * 0.55 for c in base])
    lowm = _m(nb, 'MULTIPLY', _maprange(nb, z.outputs['Z'], 0.0, 0.45, low * 0.6, 0.0), _maprange(nb, n2, 0.3, 0.7, 0.5, 1.0))
    col = _mixc(nb, lowm, col, [c * 0.4 for c in base])
    nb.L.new(col, p.inputs['Base Color'])
    nb.L.new(_maprange(nb, n2, 0.3, 0.7, 0.74, 0.93), p.inputs['Roughness'])
    p.inputs['Specular IOR Level'].default_value = 0.35
    vo = nb.n('ShaderNodeTexVoronoi', Scale=90.0)
    nb.L.new(v, vo.inputs['Vector'])
    pores = _maprange(nb, vo.outputs['Distance'], 0.0, 0.12, 0.0, 1.0)
    h = _m(nb, 'ADD', _m(nb, 'MULTIPLY', sl, None, vb=-0.35), _m(nb, 'MULTIPLY', pores, None, vb=0.12))
    h = _m(nb, 'ADD', h, _m(nb, 'MULTIPLY', gr, None, vb=0.25))
    bmp = nb.n('ShaderNodeBump', Strength=0.3, Distance=0.004)
    nb.L.new(h, bmp.inputs['Height'])
    nb.L.new(bmp.outputs['Normal'], p.inputs['Normal'])
    return m


def mat_floor(name, base=(0.085, 0.086, 0.088)):
    """Painted basement floor: worn walking path (smoother, lighter) from the stair to the door, dust along the walls,
    rubber scuffs."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    geo = nb.n('ShaderNodeNewGeometry')
    v = geo.outputs['Position']
    s = nb.n('ShaderNodeSeparateXYZ')
    nb.L.new(v, s.inputs[0])
    ax = _m(nb, 'ABSOLUTE', s.outputs['X'])
    n1 = _noise(nb, v, 1.2, 10.0, 0.62)
    n2 = _noise(nb, v, 9.0, 8.0, 0.6)
    path = _m(nb, 'MULTIPLY', _maprange(nb, ax, 0.15, 0.85, 1.0, 0.0), _maprange(nb, n1, 0.3, 0.7, 0.3, 1.0))
    # distance to the antechamber walls (sides, door wall y=0, back wall y=ROOM_BACK)
    dx = _m(nb, 'SUBTRACT', None, ax, va=ROOM_X)
    dyd = _m(nb, 'MULTIPLY', s.outputs['Y'], None, vb=-1.0)
    dyb = _m(nb, 'SUBTRACT', s.outputs['Y'], None, vb=ROOM_BACK)
    dmin = _m(nb, 'MINIMUM', _m(nb, 'MINIMUM', dx, dyd), dyb)
    dust = _m(nb, 'MULTIPLY', _maprange(nb, dmin, 0.0, 0.35, 1.0, 0.0), _maprange(nb, n2, 0.25, 0.7, 0.35, 1.0))
    cr = nb.n('ShaderNodeValToRGB')
    els = cr.color_ramp.elements
    els[0].position, els[0].color = 0.25, (*[c * 0.7 for c in base], 1)
    els[1].position, els[1].color = 0.78, (*[c * 1.18 for c in base], 1)
    nb.L.new(n1, cr.inputs[0])
    col = _mixc(nb, _m(nb, 'MULTIPLY', path, None, vb=0.45), cr.outputs['Color'], [c * 1.45 for c in base])
    col = _mixc(nb, dust, col, (0.15, 0.142, 0.13))
    sc = _noise(nb, v, 1.0, 3.0, 0.5, mapping=(3.0, 26.0, 3.0))
    scm = _m(nb, 'MULTIPLY', _maprange(nb, sc, 0.66, 0.72, 0.0, 1.0), _maprange(nb, n2, 0.5, 0.65, 0.0, 1.0))
    col = _mixc(nb, _m(nb, 'MULTIPLY', scm, None, vb=0.6), col, (0.01, 0.01, 0.01))
    nb.L.new(col, p.inputs['Base Color'])
    rr = _maprange(nb, n2, 0.3, 0.7, 0.42, 0.62)
    rr = _mixf(nb, path, rr, 0.24)
    rr = _mixf(nb, dust, rr, 0.92)
    nb.L.new(rr, p.inputs['Roughness'])
    vo = nb.n('ShaderNodeTexVoronoi', Scale=140.0)
    nb.L.new(v, vo.inputs['Vector'])
    bmp = nb.n('ShaderNodeBump', Strength=0.08, Distance=0.002)
    nb.L.new(vo.outputs['Distance'], bmp.inputs['Height'])
    nb.L.new(bmp.outputs['Normal'], p.inputs['Normal'])
    return m


def mat_tube(name, strength=14.0, k=5600):
    """Bare fluorescent tube: emission with slight banding toward the cathode ends (object Z = tube axis)."""
    m = new_mat(name)
    nb = NB(m)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    e = nb.n('ShaderNodeEmission', Color=kelvin(k), Strength=strength)
    v = _tc(nb, 'Generated')
    s = nb.n('ShaderNodeSeparateXYZ')
    nb.L.new(v, s.inputs[0])
    endm = _m(nb, 'MULTIPLY', _maprange(nb, s.outputs['Z'], 0.0, 0.035, 0.35, 1.0), _maprange(nb, s.outputs['Z'], 0.965, 1.0, 1.0, 0.35))
    nb.L.new(_m(nb, 'MULTIPLY', endm, None, vb=strength), e.inputs['Strength'])
    nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m


def mats():
    M = {}
    M['panel'] = mat_machined('DoorPanel', base=(0.52, 0.525, 0.535), rough=(0.21, 0.34), axis='X', aniso=0.55,
                              smudge=0.55, scratch=0.4)
    M['border'] = mat_machined('DoorBorder', base=(0.48, 0.485, 0.495), rough=(0.22, 0.36), axis='Z', aniso=0.5,
                               smudge=0.6, scratch=0.35)
    M['edge'] = mat_machined('DoorEdge', base=(0.44, 0.445, 0.455), rough=(0.2, 0.34), axis='Z', aniso=0.4, smudge=0.7,
                             scratch=0.25)
    M['jamb'] = mat_machined('Jamb', base=(0.36, 0.365, 0.37), rough=(0.24, 0.42), axis='Y', aniso=0.35, smudge=0.8,
                             scratch=0.3, dark=0.55)
    M['chrome'] = mat_machined('Chrome', base=(0.80, 0.80, 0.81), rough=(0.06, 0.13), axis='X', aniso=0.0, smudge=0.35,
                               scratch=0.15, bump=0.01, dark=0.85)
    M['dark'] = mat_machined('DarkSteel', base=(0.10, 0.10, 0.105), rough=(0.3, 0.46), axis='Z', aniso=0.2, smudge=0.8,
                             scratch=0.4, dark=0.6)
    M['frame'] = mat_worn_paint('FramePaint', color=(0.075, 0.08, 0.08), rough=(0.34, 0.52), edge=0.9, scuff=0.6,
                                low=1.0, steel=(0.40, 0.40, 0.41), sheen=0.15)
    M['grate'] = mat_worn_paint('GratePaint', color=(0.05, 0.055, 0.052), rough=(0.4, 0.6), edge=1.0, scuff=0.5,
                                low=0.8, bev_r=0.003, scale=2.0)
    M['wall'] = mat_board_concrete('AnteConcrete', base=(0.16, 0.158, 0.152), boards=0.17, axis='Z')
    M['ceil'] = mat_board_concrete('AnteCeil', base=(0.10, 0.10, 0.098), boards=0.2, axis='X', stain=0.2, low=0.0)
    M['stairc'] = mat_board_concrete('StairConcrete', base=(0.14, 0.138, 0.133), boards=0.17, axis='Z')
    M['floor'] = mat_floor('AnteFloor')
    M['tread'] = mat_machined('Tread', base=(0.34, 0.345, 0.35), rough=(0.22, 0.4), axis='Y', aniso=0.3, smudge=0.9,
                              scratch=0.6, dark=0.5)
    M['engine'] = None
    M['hole'] = mat_principled('DoorHole', color=(0.004, 0.004, 0.004), rough=0.6)
    M['glass'] = mat_principled('LensGlass', color=(0.9, 0.92, 0.95), rough=0.02, transmission=1.0, ior=1.52)
    M['magface'] = mat_worn_paint('MagFace', color=(0.19, 0.19, 0.185), rough=(0.45, 0.6), edge=0.5, scuff=0.2, low=0.0,
                                  bev_r=0.002, scale=6.0)
    M['galv'] = mat_machined('Galvanised', base=(0.38, 0.385, 0.39), rough=(0.38, 0.55), axis='Z', aniso=0.0, smudge=1.0,
                             scratch=0.1, bump=0.02, dark=0.55)
    M['housing'] = mat_worn_paint('FixtureWhite', color=(0.42, 0.40, 0.36), rough=(0.4, 0.55), edge=0.3, scuff=0.0,
                                  low=0.0, bev_r=0.002, dirt=0.8)
    M['cctv'] = mat_worn_paint('CCTVHousing', color=(0.36, 0.355, 0.34), rough=(0.38, 0.5), edge=0.3, scuff=0.0, low=0.0,
                               bev_r=0.003, dirt=0.6)
    M['black'] = mat_principled('BlackPlastic', color=(0.012, 0.012, 0.013), rough=0.35, spec=0.5)
    M['rubber'] = mat_rubber('Rubber')
    M['cable'] = mat_principled('Cable', color=(0.03, 0.03, 0.032), rough=0.55)
    M['tube_off'] = mat_principled('TubeOff', color=(0.62, 0.63, 0.62), rough=0.35, spec=0.5)
    principled(M['tube_off']).inputs['Transmission Weight'].default_value = 0.4
    return M


# ----------------------------------------------------------------------------- prototypes

_PROTO = {}


def _proto(key, builder):
    if key not in _PROTO or _PROTO[key].name not in bpy.data.objects:
        o = builder()
        o.hide_render = True
        o.hide_viewport = True
        o.location = (0, 0, -60)
        _PROTO[key] = o
    return _PROTO[key]


def screw_proto(M, r=0.0105, h=0.007):
    """Socket-head cap screw facing -Y at the origin (seat plane y = 0)."""
    def b():
        c = ycyl('scr_c', 0, -h, 0, 0, r, M['dark'], seg=24, bev=0.002)
        apply_mods(c)
        hx = ycyl('scr_h', 0, -h - 0.0004, -h + 0.002, 0, r * 0.42, M['hole'], seg=6)
        return join([c, hx], 'ScrewProto')
    return _proto(('screw', r, h), b)


def hexbolt_proto(M, r=0.016, h=0.012):
    def b():
        c = ycyl('hb_c', 0, -h, 0, 0, r, M['dark'], seg=6, bev=0.002)
        apply_mods(c)
        w = ycyl('hb_w', 0, -0.003, 0, 0, r * 1.3, M['dark'], seg=24, bev=0.0008)
        apply_mods(w)
        return join([c, w], 'HexBoltProto')
    return _proto(('hexbolt', r, h), b)


def place(proto, name, loc, rot=(0, 0, 0), coll=None, par=None):
    o = linked_copy(proto, name, loc=loc, rot=rot, coll=coll)
    o.hide_render = False
    o.hide_viewport = False
    if par is not None:
        parent(o, par, keep=True)
    return o


def tie_holes(M, x_range, z_range, y, step=(0.6, 0.6), skip=None, coll=None, normal=-1):
    """Formwork tie cones: small dark recessed discs on a concrete face (normal -1: face points -Y)."""
    tm = M.setdefault('tie', mat_principled('TieHole', color=(0.02, 0.019, 0.018), rough=0.8))
    def b():
        o = ycyl('tie', 0, -0.004, 0.004, 0, 0.016, tm, seg=16)
        return o
    pr = _proto(('tie',), b)
    x = x_range[0]
    out = []
    while x <= x_range[1] + 1e-6:
        z = z_range[0]
        while z <= z_range[1] + 1e-6:
            if not (skip and skip(x, z)):
                out.append(place(pr, 'Tie', (x, y, z), coll=coll))
            z += step[1]
        x += step[0]
    return out


# ----------------------------------------------------------------------------- the door

def build_door(M, coll=None, numerals=False, key=True, a2=False):
    piv = empty('DoorPivot', (HINGE_X, HINGE_Y, 0.0), coll=coll)
    bpy.context.view_layer.update()

    def P(o):
        parent(o, piv, keep=True)
        return o

    # front plate (border, brushed vertically) + raised machined panel (brushed horizontally) with a chamfer
    P(xbox('DoorPlate', -PLATE_HW, PLATE_HW, PLATE_Y[0], PLATE_Y[1], PLATE_Z[0], PLATE_Z[1], M['border'], bev=0.007, seg=3))
    P(xbox('DoorPanel', -PANEL_HW, PANEL_HW, PANEL_FRONT, PLATE_Y[0] + 0.002, PANEL_Z[0], PANEL_Z[1], M['panel'], bev=0.01,
           seg=1))
    # body: tapered free side
    bm = bmesh.new()
    y0, y1 = BODY_Y
    z0, z1 = BODY_Z
    xh = -0.51
    pts = [(xh, y0), (BODY_FREE[0], y0), (BODY_FREE[1], y1), (xh, y1)]
    vb = [bm.verts.new((x, y, z0)) for x, y in pts]
    vt = [bm.verts.new((x, y, z1)) for x, y in pts]
    bm.faces.new(list(reversed(vb)))
    bm.faces.new(vt)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((vb[i], vb[j], vt[j], vt[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    body = from_bmesh('DoorBody', bm, coll, smooth=True, angle=30)
    bevel(body, 0.006, 2, angle=30)
    set_mat(body, M['edge'])
    P(body)
    # border screws
    sp = screw_proto(M)
    k = 0
    for z in [0.16 + i * 0.165 for i in range(12)]:
        for x in (-0.54, 0.54):
            if x > 0 and MAG_Z[0] - 0.05 < z < MAG_Z[1] + 0.05:
                continue
            if x < 0 and any(abs(z - hz) < 0.17 for hz in HINGE_Z):
                continue
            place(sp, f'DScrew{k}', (x, PLATE_Y[0], z), par=piv)
            k += 1
    for x in [-0.42 + i * 0.168 for i in range(6)]:
        for z in (0.06, 2.08):
            place(sp, f'DScrew{k}', (x, PLATE_Y[0], z), par=piv)
            k += 1
    # combination wheel (lock.py dial) scaled into the panel + its fixed bezel, with the reading lens on top.
    # a2=True: A2's dial_with_lens() (lib/door_macro.py: top-reading hood, plano-convex lens, number band) for exact
    # continuity with the macro shots; its parts are built about the origin on a y = 0 face, so they are carried to the
    # dial position by one placement empty that rides on the door.
    from lock import build_dial, mat_engine_turned
    a2_ok = False
    if a2:
        try:
            import door_macro as A2
            before = set(bpy.data.objects)
            dl = A2.dial_with_lens(M, s=DIAL_S, coll=coll)
            place_e = empty('A2DialPlace', tuple(DIAL), coll=coll)
            for o in [o for o in bpy.data.objects if o not in before and o is not place_e]:
                if o.parent is None:
                    o.parent = place_e
            parent(place_e, piv, keep=True)
            dparts = {'dial': dl['dial']}
            droot = dl['root']
            a2_ok = True
        except Exception as e:
            print('[info] door_macro.dial_with_lens unavailable, using the door_ff dial:', e, flush=True)
    if not a2_ok:
        droot = empty('DialRoot', tuple(DIAL), coll=coll)
        droot.rotation_euler = (math.radians(90), 0, 0)
        droot.scale = (DIAL_S,) * 3
        dparts = build_dial(droot, coll=coll)
        for o in list(droot.children_recursive):
            if o.name.startswith('Plate') or (not numerals and o.name.startswith('Num')):
                bpy.data.objects.remove(o)
        parent(droot, piv, keep=True)
        # reading lens on top of the dial: small hood over the 12 o'clock rim with a round lens tilted toward the eye
        lz = DIAL.z + 1.32 * DIAL_S
        hood = P(xbox('LensHood', DIAL.x - 0.019, DIAL.x + 0.019, PANEL_FRONT - 0.05, PANEL_FRONT, lz - 0.012, lz + 0.022,
                      M['border'], bev=0.005, seg=3))
        lens_par = empty('LensTilt', (DIAL.x, PANEL_FRONT - 0.05, lz + 0.006), coll=coll)
        lens_par.rotation_euler = (math.radians(-28), 0, 0)
        ring = ycyl('LensRing', 0, -0.006, 0.002, 0, 0.0125, M['chrome'], seg=32, bev=0.0015)
        ring.location = (0, -0.002, 0)
        parent(ring, lens_par, keep=False)
        gl = prim('sphere', 'Lens', (0, -0.006, 0), seg=32, ring=16, r=0.0098, coll=coll)
        gl.scale = (1, 0.45, 1)
        set_mat(gl, M['glass'])
        parent(gl, lens_par, keep=False)
        dk = ycyl('LensBack', 0, -0.003, 0.0, 0, 0.0096, M['hole'], seg=24)
        parent(dk, lens_par, keep=False)
        parent(lens_par, piv, keep=True)
    # keyhole: turned boss + keyway (round + slot)
    P(ycyl('KeyBoss', KEYHOLE.x, PANEL_FRONT - 0.014, PANEL_FRONT + 0.001, KEYHOLE.z, 0.036, M['chrome'], seg=48, bev=0.004,
           bseg=3))
    P(ycyl('KeyBoss2', KEYHOLE.x, PANEL_FRONT - 0.02, PANEL_FRONT - 0.012, KEYHOLE.z, 0.024, M['border'], seg=48, bev=0.003))
    P(ycyl('Keyway', KEYHOLE.x, PANEL_FRONT - 0.0208, PANEL_FRONT - 0.019, KEYHOLE.z, 0.0085, M['hole'], seg=24))
    P(xbox('KeySlot', KEYHOLE.x - 0.0029, KEYHOLE.x + 0.0029, PANEL_FRONT - 0.0208, PANEL_FRONT - 0.019, KEYHOLE.z - 0.028,
           KEYHOLE.z, M['hole']))
    out = {'door': piv, 'dial': dparts['dial'], 'dial_root': droot}
    # the long two-part key (root slides along -Y to pull it out; turn rotates about the key axis)
    if key:
        kr = empty('KeyRoot', (KEYHOLE.x, PANEL_FRONT - 0.02, KEYHOLE.z), coll=coll)
        kt = empty('KeyTurn', (0, 0, 0), coll=coll)
        parent(kt, kr, keep=False)
        km = M['chrome']
        parts = [ycyl('KShank', 0, -0.11, 0.28, 0, 0.0068, km, seg=24, bev=0.001)]
        parts.append(xbox('KBit', -0.0022, 0.0022, 0.20, 0.27, -0.026, -0.004, km))
        parts.append(ycyl('KCollar', 0, -0.128, -0.106, 0, 0.0105, M['dark'], seg=24, bev=0.002))   # joint of the 2 parts
        parts.append(ycyl('KCollar2', 0, -0.14, -0.128, 0, 0.0085, km, seg=24, bev=0.0015))
        bar = prim('cyl', 'KBow', (0, -0.152, 0), (0, math.radians(90), 0), seg=24, r=0.0085, depth=0.11, coll=coll)
        bevel(bar, 0.003, 2)
        set_mat(bar, km)
        parts.append(bar)
        for sx in (-1, 1):
            parts.append(prim('sphere', 'KBowEnd', (sx * 0.056, -0.152, 0), seg=20, ring=10, r=0.0115, coll=coll))
            set_mat(parts[-1], km)
        for o in parts:
            parent(o, kt, keep=False)
        parent(kr, piv, keep=True)
        out['key_root'], out['key_turn'] = kr, kt
    # 3-spoke boltwork handle
    hd = empty('Handle', tuple(HANDLE), coll=coll)
    hp = [ycyl('HHub', 0, -0.07, 0.0, 0, 0.042, M['chrome'], seg=48, bev=0.006, bseg=3),
          ycyl('HHubCap', 0, -0.078, -0.068, 0, 0.03, M['border'], seg=48, bev=0.003)]
    for i, a in enumerate((math.radians(30), math.radians(150), math.radians(270))):
        sp_ = prim('cyl', f'HSpoke{i}', (math.cos(a) * 0.1, -0.052, math.sin(a) * 0.1), (0, 0, 0), seg=24, r=0.017,
                   r2=0.0125, depth=0.17, coll=coll)
        sp_.rotation_euler = (0, math.pi / 2 - a, 0)
        bevel(sp_, 0.002, 2)
        set_mat(sp_, M['chrome'])
        hp.append(sp_)
        kb = prim('sphere', f'HKnob{i}', (math.cos(a) * 0.19, -0.052, math.sin(a) * 0.19), seg=32, ring=16, r=0.029,
                  coll=coll)
        set_mat(kb, M['chrome'])
        hp.append(kb)
    for o in hp:
        parent(o, hd, keep=False)
    parent(hd, piv, keep=True)
    out['handle'] = hd
    # magnetic plate, door half (frame half is built with the frame)
    mz0, mz1 = MAG_Z
    mag = P(xbox('MagDoor', 0.512, 0.574, PLATE_Y[0] - 0.013, PLATE_Y[0], mz0, mz1, M.get('magplate', M['magface']),
                 bev=0.0025, seg=2))
    ss = screw_proto(M, r=0.0048, h=0.003)
    for (x, z) in ((0.522, mz0 + 0.012), (0.564, mz0 + 0.012), (0.522, mz1 - 0.012), (0.564, mz1 - 0.012)):
        place(ss, 'MagScrewD', (x, PLATE_Y[0] - 0.013, z), par=piv)
    out['mag_door'] = mag
    # hinge arms + door knuckles
    for hz in HINGE_Z:
        P(xbox(f'HArm{hz}', HINGE_X, -0.505, PLATE_Y[0] - 0.05, PLATE_Y[0], hz - 0.055, hz + 0.055, M['dark'], bev=0.008))
        P(zcyl(f'HKnD{hz}', HINGE_X, HINGE_Y, hz - 0.058, hz + 0.058, 0.056, M['dark'], seg=48, bev=0.006))
        hb = hexbolt_proto(M, r=0.011, h=0.008)
        for (x, z) in ((-0.62, hz - 0.03), (-0.62, hz + 0.03), (-0.54, hz - 0.03), (-0.54, hz + 0.03)):
            place(hb, 'HArmBolt', (x, PLATE_Y[0] - 0.05, z), par=piv)
    # locking bolts: free edge (5, slide +X) and top edge (2, slide +Z); chrome with bushings on the tapered face
    bolts, tops = [], []
    fx = _free_x(BOLT_Y)
    ang = math.atan2(BODY_Y[1] - BODY_Y[0], BODY_FREE[0] - BODY_FREE[1])   # tapered face normal angle in XY
    nrm = math.pi / 2 - ang
    for i, z in enumerate(BOLT_Z):
        sl = empty(f'BoltSlide{i}', (0, 0, 0), coll=coll)
        parent(sl, piv, keep=True)
        rod = xcyl(f'Bolt{i}', fx - 0.12, fx + 0.045, BOLT_Y, z, 0.037, M['chrome'], seg=40, bev=0.007)
        parent(rod, sl, keep=True)
        bush = prim('cyl', f'Bush{i}', (fx + 0.001, BOLT_Y, z), (0, math.radians(90), nrm), seg=40, r=0.052, depth=0.008,
                    coll=coll)
        bevel(bush, 0.0015, 2)
        set_mat(bush, M['chrome'])
        P(bush)
        bolts.append(sl)
    for i, x in enumerate((-0.25, 0.20)):
        sl = empty(f'TopSlide{i}', (0, 0, 0), coll=coll)
        parent(sl, piv, keep=True)
        rod = zcyl(f'TopBolt{i}', x, BOLT_Y, BODY_Z[1] - 0.1, BODY_Z[1] + 0.006, 0.028, M['chrome'], seg=40, bev=0.005)
        parent(rod, sl, keep=True)
        tops.append(sl)
    out['bolts'], out['top_bolts'] = bolts, tops
    # back face (vault side, seen when the door stands open): engine-turned boltwork cover, bolt bar, lock cases
    eng = M.get('engine') or mat_machined('BackCover', base=(0.45, 0.455, 0.465), rough=(0.2, 0.34), axis='Z', aniso=0.3,
                                           smudge=0.8, scratch=0.5)
    M['engine'] = eng
    by = BODY_Y[1]
    P(xbox('BackCover', -0.43, 0.33, by - 0.002, by + 0.014, 0.22, 1.86, eng, bev=0.004))
    for x in (-0.405, 0.305):
        for z in [0.25 + i * 0.2 for i in range(9)]:
            place(sp, 'BackScrew', (x, by + 0.014, z), rot=(0, 0, math.pi), par=piv)
    P(xbox('BoltBar', 0.345, 0.385, by, by + 0.04, 0.2, 1.88, M['chrome'], bev=0.004))
    for i, z in enumerate(BOLT_Z):
        P(xbox(f'Clevis{i}', 0.33, 0.405, by, by + 0.05, z - 0.032, z + 0.032, M['dark'], bev=0.005))
        place(hexbolt_proto(M, r=0.009, h=0.008), 'ClevisPin', (0.3675, by + 0.05, z), rot=(0, 0, math.pi), par=piv)
    P(xbox('LockCaseA', DIAL.x - 0.08, DIAL.x + 0.08, by, by + 0.055, DIAL.z - 0.065, DIAL.z + 0.065, M['dark'], bev=0.005))
    P(xbox('LockCaseB', KEYHOLE.x - 0.065, KEYHOLE.x + 0.065, by, by + 0.05, KEYHOLE.z - 0.08, KEYHOLE.z + 0.06, M['dark'],
           bev=0.005))
    P(xbox('LinkBar', DIAL.x + 0.06, 0.35, by + 0.03, by + 0.044, 1.24, 1.27, M['chrome'], bev=0.003))
    P(xbox('LinkBar2', HANDLE.x, 0.35, by + 0.03, by + 0.044, HANDLE.z - 0.015, HANDLE.z + 0.015, M['chrome'], bev=0.003))
    P(ycyl('HandleSpindle', HANDLE.x, by, by + 0.05, HANDLE.z, 0.04, M['dark'], seg=32, bev=0.004))
    return out


# ----------------------------------------------------------------------------- frame, wall, room

def build_frame(M, coll=None):
    o = {}
    fm = M['frame']
    xbox('FrameL', -FRAME_HW, -REB_HW, FRAME_Y, 0.0, 0.0, REB_TOP, fm, bev=0.006, coll=coll)
    xbox('FrameR', REB_HW, FRAME_HW, FRAME_Y, 0.0, 0.0, REB_TOP, fm, bev=0.006, coll=coll)
    xbox('FrameHead', -FRAME_HW, FRAME_HW, FRAME_Y, 0.0, REB_TOP, FRAME_TOP, fm, bev=0.006, coll=coll)
    # bare-steel jamb liners through the wall (and the rebate step)
    jm = M['jamb']
    xbox('JambL', -0.60, -BORE_HW, -0.02, WALL_T, 0.0, 2.10, jm, bev=0.003, coll=coll)
    xbox('JambR', BORE_HW, 0.60, -0.02, WALL_T, 0.0, 2.10, jm, bev=0.003, coll=coll)
    xbox('JambHead', -0.60, 0.60, -0.02, WALL_T, BORE_H, 2.14, jm, bev=0.003, coll=coll)
    xbox('Threshold', -0.60, 0.60, -0.42, WALL_T + 0.02, -0.02, 0.008, M['tread'], bev=0.003, coll=coll)
    # bolt sockets in the free jamb (+ striker rings) and the head jamb
    for i, z in enumerate(BOLT_Z):
        s = prim('cyl', f'Socket{i}', (BORE_HW - 0.001, BOLT_Y, z), (0, math.radians(90), 0), seg=32, r=0.036, depth=0.004,
                 coll=coll)
        set_mat(s, M['hole'])
        r = prim('torus', f'Striker{i}', R=0.041, r=0.006, seg=40, seg2=8, coll=coll)
        r.location = (BORE_HW - 0.001, BOLT_Y, z)
        r.rotation_euler = (0, math.radians(90), 0)
        set_mat(r, M['chrome'])
    for i, x in enumerate((-0.25, 0.20)):
        s = zcyl(f'TopSocket{i}', x, BOLT_Y, BORE_H - 0.004, BORE_H + 0.001, 0.032, M['hole'], seg=32, coll=coll)
    # frame-side hinge knuckles + brackets
    for hz in HINGE_Z:
        for s in (-1, 1):
            zc = hz + s * 0.125
            zcyl(f'HKnF{hz}{s}', HINGE_X, HINGE_Y, zc - 0.064, zc + 0.064, 0.056, M['dark'], seg=48, bev=0.006, coll=coll)
            xbox(f'HBr{hz}{s}', HINGE_X - 0.11, HINGE_X + 0.015, HINGE_Y + 0.02, FRAME_Y, zc - 0.058, zc + 0.058, M['dark'],
                 bev=0.008, coll=coll)
            zcyl(f'HWasher{hz}{s}', HINGE_X, HINGE_Y, hz + s * 0.0585 - 0.002, hz + s * 0.0585 + 0.002, 0.05, M['chrome'],
                 seg=48, coll=coll)
        cap = prim('sphere', f'HPinCap{hz}', (HINGE_X, HINGE_Y, hz + 0.19), seg=32, ring=16, r=0.04, coll=coll)
        cap.scale = (1, 1, 0.45)
        set_mat(cap, M['chrome'])
        cap2 = prim('sphere', f'HPinCapB{hz}', (HINGE_X, HINGE_Y, hz - 0.19), seg=32, ring=16, r=0.04, coll=coll)
        cap2.scale = (1, 1, 0.45)
        set_mat(cap2, M['chrome'])
        hb = hexbolt_proto(M)
        for zz in (hz - 0.17, hz - 0.08, hz + 0.08, hz + 0.17):
            place(hb, 'HBrBolt', (HINGE_X - 0.08, HINGE_Y + 0.02, zz), coll=coll)
    # frame anchor bolts
    hb = hexbolt_proto(M)
    for z in (0.2, 0.62, 1.04, 1.46, 1.88):
        for x in (-0.70, 0.70):
            if x < 0 and any(abs(z - hz) < 0.25 for hz in HINGE_Z):
                continue
            if x > 0 and MAG_Z[0] - 0.08 < z < MAG_Z[1] + 0.08:
                continue
            place(hb, 'Anchor', (x, FRAME_Y, z), coll=coll)
    for x in (-0.5, -0.17, 0.17, 0.5):
        place(hb, 'Anchor', (x, FRAME_Y, 2.235), coll=coll)
    # magnetic plate, frame half + its armoured cable to a junction box and up into the ceiling
    mz0, mz1 = MAG_Z
    o['mag_frame'] = xbox('MagFrame', 0.594, 0.656, FRAME_Y - 0.013, FRAME_Y, mz0, mz1, M.get('magplate', M['magface']),
                          bev=0.0025, coll=coll)
    ss = screw_proto(M, r=0.0048, h=0.003)
    for (x, z) in ((0.604, mz0 + 0.012), (0.646, mz0 + 0.012), (0.604, mz1 - 0.012), (0.646, mz1 - 0.012)):
        place(ss, 'MagScrewF', (x, FRAME_Y - 0.013, z), coll=coll)
    pipe('MagCable', [(0.64, FRAME_Y - 0.008, mz1), (0.64, FRAME_Y - 0.008, 2.2), (0.70, FRAME_Y - 0.008, 2.26)], 0.0045,
         M['cable'], coll=coll)
    xbox('JBox', 0.66, 0.78, FRAME_Y - 0.05, FRAME_Y, 2.2, 2.32, M['galv'], bev=0.004, coll=coll)
    zcyl('JConduit', 0.74, FRAME_Y - 0.03, 2.32, CEIL, 0.011, M['galv'], seg=16, coll=coll)
    return o


def build_room(M, coll=None, stair=True, vault_shell=True):
    wm = M['wall']
    # door wall (around the jamb opening)
    xbox('WallL', -2.2, -0.60, 0.0, WALL_T, -0.1, VAULT_CEIL + 0.1, wm, coll=coll)
    xbox('WallR', 0.60, 2.2, 0.0, WALL_T, -0.1, VAULT_CEIL + 0.1, wm, coll=coll)
    xbox('WallTop', -0.60, 0.60, 0.0, WALL_T, 2.10, VAULT_CEIL + 0.1, wm, coll=coll)
    tie_holes(M, (-1.8, 1.8), (0.45, 2.25), -0.0, step=(0.6, 0.6),
              skip=lambda x, z: abs(x) < FRAME_HW + 0.12 or (abs(x - KEYPAD.x) < 0.25 and abs(z - KEYPAD.z) < 0.3),
              coll=coll)
    # side walls, back wall with stair opening, ceiling, floor
    for sx in (-1, 1):
        xbox(f'Side{sx}', sx * ROOM_X if sx > 0 else -ROOM_X - 0.25, ROOM_X + 0.25 if sx > 0 else -ROOM_X, ROOM_BACK - 0.3,
             0.02, -0.1, CEIL + 0.05, wm, coll=coll)
    xbox('BackL', -ROOM_X - 0.1, -GATE_HW, ROOM_BACK - 0.25, ROOM_BACK, -0.1, CEIL + 0.05, wm, coll=coll)
    xbox('BackR', GATE_HW, ROOM_X + 0.1, ROOM_BACK - 0.25, ROOM_BACK, -0.1, CEIL + 0.05, wm, coll=coll)
    xbox('BackTop', -GATE_HW, GATE_HW, ROOM_BACK - 0.25, ROOM_BACK, 2.2, CEIL + 0.05, wm, coll=coll)
    xbox('Ceiling', -ROOM_X - 0.1, ROOM_X + 0.1, ROOM_BACK - 0.25, 0.02, CEIL, CEIL + 0.2, M['ceil'], coll=coll)
    xbox('Beam', -ROOM_X, ROOM_X, -0.32, 0.0, CEIL - 0.1, CEIL + 0.01, M['ceil'], bev=0.01, coll=coll)
    xbox('Floor', -ROOM_X - 0.1, ROOM_X + 0.1, ROOM_BACK - 0.25, WALL_T, -0.12, 0.0, M['floor'], coll=coll)
    # conduits on the ceiling + keypad conduit
    g = M['galv']
    for x in (1.55, 1.62):
        xbox(f'CondC{x}', x - 0.011, x + 0.011, ROOM_BACK, -0.32, CEIL - 0.026, CEIL - 0.004, g, bev=0.008, coll=coll)
    xbox('CondX', -1.5, 1.62, -0.36, -0.338, CEIL - 0.026, CEIL - 0.004, g, bev=0.008, coll=coll)
    stp = mat_principled('Strap', color=(0.25, 0.25, 0.26), rough=0.5, metal=1.0)
    for y in (-0.8, -1.6, -2.4, -3.2):
        for x in (1.55, 1.62):
            xbox('Strap', x - 0.016, x + 0.016, y - 0.01, y + 0.01, CEIL - 0.03, CEIL, stp, coll=coll)
    out = {}
    if stair:
        out.update(build_stair(M, coll))
    return out


def build_stair(M, coll=None):
    sc = M['stairc']
    y_top = STAIR_Y0 - STAIR_N * STAIR_RUN
    z_top = STAIR_N * STAIR_RISE
    for sx in (-1, 1):
        x0, x1 = (STAIR_HW, STAIR_HW + 0.25) if sx > 0 else (-STAIR_HW - 0.25, -STAIR_HW)
        xbox(f'StairWall{sx}', x0, x1, y_top - 2.2, ROOM_BACK - 0.25, -0.2, z_top + 3.2, sc, coll=coll)
    xbox('Landing', -STAIR_HW, STAIR_HW, STAIR_Y0, ROOM_BACK - 0.2, -0.12, 0.0, M['floor'], coll=coll)
    nose = mat_machined('Nosing', base=(0.30, 0.3, 0.3), rough=(0.25, 0.42), axis='X', aniso=0.2, smudge=1.0, scratch=0.6,
                        dark=0.45)
    stepm = mat_board_concrete('StepConcrete', base=(0.12, 0.118, 0.114), boards=0.5, axis='Y', stain=0.0, low=0.0)
    nproto = xbox('NoseProto', -STAIR_HW + 0.03, STAIR_HW - 0.03, -0.045, 0.004, -0.014, 0.003, nose, bev=0.002)
    apply_mods(nproto)
    nproto.hide_render = True
    for i in range(STAIR_N):
        yr = STAIR_Y0 - i * STAIR_RUN
        zt = (i + 1) * STAIR_RISE
        xbox(f'Step{i}', -STAIR_HW, STAIR_HW, yr - STAIR_RUN - 0.01, yr, zt - 0.5, zt, stepm, bev=0.004, coll=coll)
        place(nproto, f'Nose{i}', (0, yr, zt), coll=coll)
    xbox('TopLanding', -STAIR_HW, STAIR_HW, y_top - 2.2, y_top, z_top - 0.4, z_top, M['floor'], coll=coll)
    xbox('TopWall', -STAIR_HW - 0.2, STAIR_HW + 0.2, y_top - 2.45, y_top - 2.2, z_top - 0.4, z_top + 3.2, sc, coll=coll)
    # soffit: flat over the landing, sloped over the flight, flat over the upper landing
    xbox('SoffitLow', -STAIR_HW - 0.02, STAIR_HW + 0.02, STAIR_Y0, ROOM_BACK - 0.25, CEIL, CEIL + 0.25, M['ceil'], coll=coll)
    xbox('SoffitTop', -STAIR_HW - 0.02, STAIR_HW + 0.02, y_top - 2.3, y_top, CEIL + z_top, CEIL + z_top + 0.25, M['ceil'],
         coll=coll)
    slope = math.atan2(STAIR_RISE, STAIR_RUN)
    ln = math.hypot(STAIR_Y0 - y_top, z_top) + 0.3
    so = box('SoffitSlope', (2 * STAIR_HW + 0.04, ln, 0.25), (0, (STAIR_Y0 + y_top) / 2, CEIL + z_top / 2 + 0.125 / math.cos(slope)),
             coll=coll, mat=M['ceil'])
    so.rotation_euler = (-slope, 0, 0)
    # handrails on both walls (tube on brackets), with a level run at the bottom
    rail = M['galv']
    for sx in (-1, 1):
        x = sx * (STAIR_HW - 0.07)
        a = (x, ROOM_BACK - 0.55, 0.92)
        b = (x, STAIR_Y0 + 0.05, 0.92)
        c = (x, y_top + 0.3, 0.92 + (STAIR_Y0 + 0.05 - (y_top + 0.3)) * STAIR_RISE / STAIR_RUN)
        pipe(f'Rail{sx}', [a, b, c], 0.021, rail, coll=coll, seg=20)
        for t in (0.15, 0.45, 0.75):
            yy = b[1] + (c[1] - b[1]) * t
            zz = b[2] + (c[2] - b[2]) * t
            pipe(f'RailBr{sx}', [(x, yy, zz - 0.02), (x, yy, zz - 0.07), (sx * STAIR_HW, yy, zz - 0.07)], 0.008, rail,
                 coll=coll, seg=10)
    return {'stair_top': (0.0, y_top, z_top)}


def build_grate(M, coll=None):
    """Steel grate gate in the stair opening (hinge left; +rotation_euler.z swings it into the antechamber)."""
    gm = M['grate']
    y0, y1 = ROOM_BACK - 0.06, ROOM_BACK
    xbox('GPostL', -GATE_HW, -0.575, y0, y1, 0.0, 2.2, gm, bev=0.004, coll=coll)
    xbox('GPostR', 0.575, GATE_HW, y0, y1, 0.0, 2.2, gm, bev=0.004, coll=coll)
    xbox('GHead', -GATE_HW, GATE_HW, y0, y1, 2.155, 2.2, gm, bev=0.004, coll=coll)
    piv = empty('GatePivot', (-0.565, ROOM_BACK - 0.03, 0.0), coll=coll)
    bpy.context.view_layer.update()
    parts = []
    gy0, gy1 = ROOM_BACK - 0.05, ROOM_BACK - 0.01
    parts.append(xbox('GStileL', -0.56, -0.52, gy0, gy1, 0.03, 2.14, gm, bev=0.004, coll=coll))
    parts.append(xbox('GStileR', 0.52, 0.56, gy0, gy1, 0.03, 2.14, gm, bev=0.004, coll=coll))
    for z0 in (0.03, 1.04, 2.10):
        parts.append(xbox('GRail', -0.56, 0.56, gy0, gy1, z0, z0 + 0.04, gm, bev=0.004, coll=coll))
    bar = zcyl('GBarProto', 0, 0, 0.07, 2.10, 0.0085, gm, seg=12, coll=coll)
    xs = [-0.45 + i * 0.1 for i in range(10)]
    for x in xs:
        parts.append(linked_copy(bar, 'GBar', loc=(x, ROOM_BACK - 0.03, (0.07 + 2.10) / 2)))
    bar.hide_render = True
    for z in (0.55, 1.6):
        parts.append(xbox('GFlat', -0.52, 0.52, ROOM_BACK - 0.042, ROOM_BACK - 0.018, z, z + 0.035, gm, bev=0.002, coll=coll))
    parts.append(xbox('GLockBox', 0.42, 0.56, ROOM_BACK - 0.09, gy0, 0.96, 1.2, gm, bev=0.006, coll=coll))
    parts.append(xbox('GHandle', 0.46, 0.475, ROOM_BACK - 0.16, ROOM_BACK - 0.09, 1.03, 1.13, M['dark'], bev=0.005, coll=coll))
    for o in parts:
        parent(o, piv, keep=True)
    # solenoid lock on the fixed post (antechamber side) + its bolt (slide +X to retract)
    xbox('GSolenoid', 0.575, 0.66, ROOM_BACK, ROOM_BACK + 0.07, 0.94, 1.24, M['galv'], bev=0.006, coll=coll)
    sl = empty('GateBoltSlide', (0, 0, 0), coll=coll)
    gb = xbox('GateBolt', 0.53, 0.60, ROOM_BACK - 0.03, ROOM_BACK - 0.01, 1.07, 1.11, M['chrome'], bev=0.003, coll=coll)
    parent(gb, sl, keep=True)
    pipe('GCable', [(0.62, ROOM_BACK + 0.035, 1.24), (0.62, ROOM_BACK + 0.035, 2.2), (0.9, ROOM_BACK + 0.035, 2.45)],
         0.009, M['galv'], coll=coll)
    return {'grate': piv, 'grate_bolt': sl}


def build_keypad(M, coll=None):
    x, z = KEYPAD.x, KEYPAD.z
    face = mat_machined('KeypadFace', base=(0.5, 0.5, 0.51), rough=(0.22, 0.34), axis='Z', aniso=0.35, smudge=0.9)
    root = xbox('Keypad', x - 0.065, x + 0.065, -0.035, 0.0, z - 0.09, z + 0.09, face, bev=0.005, seg=3, coll=coll)
    xbox('KPDisplay', x - 0.045, x + 0.045, -0.0365, -0.034, z + 0.045, z + 0.072, M['black'], bev=0.0015, coll=coll)
    keym = mat_machined('KeyCap', base=(0.42, 0.42, 0.43), rough=(0.25, 0.4), axis='Z', aniso=0.0, smudge=1.2, dark=0.5)
    kp = xbox('KeyCapProto', -0.011, 0.011, -0.006, 0.0, -0.009, 0.009, keym, bev=0.003, seg=2)
    apply_mods(kp)
    kp.hide_render = True
    for r in range(4):
        for c in range(3):
            place(kp, 'KeyCap', (x + (c - 1) * 0.031, -0.035, z + 0.02 - r * 0.028), coll=coll)
    ss = screw_proto(M, r=0.004, h=0.002)
    for sx in (-1, 1):
        for sz in (-1, 1):
            place(ss, 'KPScrew', (x + sx * 0.055, -0.035, z + sz * 0.08), coll=coll)
    zcyl('KPConduit', x, -0.02, z + 0.09, CEIL - 0.1, 0.011, M['galv'], seg=16, coll=coll)
    xbox('KPConduitTop', x - 0.011, 1.62, -0.03, -0.008, CEIL - 0.11, CEIL - 0.089, M['galv'], bev=0.008, coll=coll)
    return root


def build_cctv(M, coll=None, loc=(ROOM_X - 0.02, ROOM_BACK + 0.35, 2.28), aim=(0.1, 0.0, 1.2)):
    """2003-era box camera in a weather housing with sunshield, on a wall arm (wall at +X)."""
    root = empty('CCTV', loc, coll=coll)
    xbox('CamMount', -0.01, 0.0, -0.05, 0.05, -0.07, 0.07, M['cctv'], bev=0.003, coll=coll)   # wall plate (local)
    parts = [bpy.data.objects['CamMount']]
    arm = prim('cyl', 'CamArm', (-0.12, 0, 0), (0, math.radians(90), 0), seg=16, r=0.014, depth=0.24, coll=coll)
    set_mat(arm, M['cctv'])
    parts.append(arm)
    head = empty('CamHead', (-0.24, 0, 0.02), coll=coll)
    hp = [xbox('CamBody', -0.045, 0.045, -0.16, 0.13, -0.04, 0.04, M['cctv'], bev=0.01, seg=3, coll=coll),
          xbox('CamShield', -0.06, 0.06, -0.20, 0.14, 0.045, 0.052, M['cctv'], bev=0.003, coll=coll),
          ycyl('CamLensRim', 0, -0.167, -0.16, 0, 0.032, M['black'], seg=32, coll=coll),
          ycyl('CamGlass', 0, -0.169, -0.165, 0, 0.028, M['glass'], seg=32, coll=coll),
          ycyl('CamLensIn', 0, -0.15, -0.14, 0, 0.02, M['black'], seg=24, coll=coll),
          xbox('CamYoke', -0.012, 0.012, -0.02, 0.02, -0.06, -0.04, M['cctv'], bev=0.003, coll=coll)]
    for o in hp:
        parent(o, head, keep=False)
    parent(head, root, keep=False)
    for o in parts:
        parent(o, root, keep=False)
    bpy.context.view_layer.update()
    hw = head.matrix_world.translation
    d = Vector(aim) - hw
    head.rotation_euler = d.to_track_quat('-Y', 'Z').to_euler()
    pipe('CamCable', [(loc[0] - 0.005, loc[1] + 0.05, loc[2]), (loc[0] - 0.005, loc[1] + 0.05, CEIL - 0.01)], 0.006, M['cable'],
         coll=coll)
    return root


# ----------------------------------------------------------------------------- lights

def fixture(M, name, loc, length=1.22, axis='X', rot=None, on=True, power=32.0, k=5400, strength=14.0, coll=None,
            tubes=2):
    """Ceiling batten with bare tubes. Tubes are emissive (visible to camera + glossy only); an invisible area light under
    them does the diffuse lighting. Returns dict(root, tubes, light, mat_on, mat_off)."""
    root = empty(name, loc, coll=coll)
    if rot:
        root.rotation_euler = rot
    alongx = axis == 'X'
    L = length
    hw = (L / 2 + 0.03, 0.06) if alongx else (0.06, L / 2 + 0.03)
    hs = xbox(name + 'Housing', -hw[0], hw[0], -hw[1], hw[1], -0.05, 0.0, M['housing'], bev=0.006, coll=coll)
    parent(hs, root, keep=False)
    mon = mat_tube(name + 'TubeOn', strength=strength, k=k)
    trs = []
    offs = (-0.03, 0.03) if tubes == 2 else (0.0,)
    for i, o in enumerate(offs):
        if alongx:
            t = prim('cyl', f'{name}Tube{i}', (0, o, -0.075), (0, math.radians(90), 0), seg=16, r=0.013, depth=L, coll=coll)
        else:
            t = prim('cyl', f'{name}Tube{i}', (o, 0, -0.075), (math.radians(90), 0, 0), seg=16, r=0.013, depth=L, coll=coll)
        set_mat(t, mon if on else M['tube_off'])
        try:
            t.visible_diffuse = not on
            t.visible_shadow = False
        except Exception:
            pass
        parent(t, root, keep=False)
        trs.append(t)
        for s in (-1, 1):   # sockets
            if alongx:
                c = xbox(f'{name}Sock', s * L / 2 - 0.02, s * L / 2 + 0.02, o - 0.02, o + 0.02, -0.095, -0.05, M['housing'],
                         bev=0.004, coll=coll)
            else:
                c = xbox(f'{name}Sock', o - 0.02, o + 0.02, s * L / 2 - 0.02, s * L / 2 + 0.02, -0.095, -0.05, M['housing'],
                         bev=0.004, coll=coll)
            parent(c, root, keep=False)
    lt = None
    if on:
        sx, sy = (L, 0.08) if alongx else (0.08, L)
        lt = light('AREA', name + 'L', (0, 0, -0.1), (0, 0, 0), energy=power, color=kelvin(k), size=sx, size_y=sy,
                   shape='RECTANGLE', coll=coll)
        try:
            lt.visible_glossy = False
        except Exception:
            pass
        parent(lt, root, keep=False)
    return {'root': root, 'tubes': trs, 'light': lt, 'mat_on': mon}


def light_ante(S, state='day', scale=1.0, on=None, night=None, coll=None):
    """Antechamber light. Presets: 'day' (battens A, B and the stair batten on, cold), 'monday' (same, a touch warmer and
    brighter), 'night' (battens off; a small hard source high in the stairwell throws the grate's bars across the floor
    and door), 'dark' (near black: only a faint trickle down the stairs). `on` overrides which battens are lit (subset
    of 'A', 'B', 'S'), `night` the stairwell source power (W), `scale` the batten power."""
    presets = {'day': (('A', 'B', 'S'), 30.0, 6200, 0.0), 'monday': (('A', 'B', 'S'), 38.0, 5200, 0.0),
               'night': ((), 30.0, 6200, 520.0), 'dark': ((), 30.0, 6200, 12.0)}
    lit, pw, kk, nl = presets[state]
    if on is not None:
        lit = on
    if night is not None:
        nl = night
    pw *= scale
    M = S['M']
    f = {}
    f['A'] = fixture(M, 'FixA', (0.0, -0.78, CEIL - 0.012), axis='X', on='A' in lit, power=pw * 1.25, k=kk, coll=coll)
    f['B'] = fixture(M, 'FixB', (-0.3, -2.95, CEIL - 0.012), axis='X', on='B' in lit, power=pw * 0.8, k=kk, coll=coll)
    out = {'fix': f}
    if S.get('stair_built'):
        y = -7.0
        zs = CEIL + (STAIR_Y0 - y) * STAIR_RISE / STAIR_RUN
        slope = math.atan2(STAIR_RISE, STAIR_RUN)
        f['S'] = fixture(M, 'FixS', (0.0, y, zs - 0.01), axis='X', rot=(-slope, 0, 0), on='S' in lit, power=16.0 * scale,
                         k=5000, coll=coll, strength=10.0)
        # bulkhead night light on the stair wall (caged glass dome); lit only in the night states
        bp = NIGHT_LAMP
        cage = prim('sphere', 'BulkGlass', bp, seg=24, ring=12, r=0.06, coll=coll)
        cage.scale = (0.5, 1.0, 0.7)
        gl = mat_emission('BulkGlassOn', color=kelvin(4300), strength=18.0) if nl > 0 else M['tube_off']
        set_mat(cage, gl)
        no_shadow(cage)
        sgn = 1 if bp[0] > 0 else -1
        xbox('BulkBase', bp[0] + sgn * 0.03, bp[0] + sgn * 0.06, bp[1] - 0.09, bp[1] + 0.09, bp[2] - 0.07, bp[2] + 0.07,
             M['housing'], bev=0.008, coll=coll)
        for dz in (-0.03, 0.0, 0.03):
            r = prim('torus', 'BulkCage', R=0.055, r=0.003, seg=24, seg2=6, coll=coll)
            r.location = (bp[0] - sgn * 0.005, bp[1], bp[2] + dz)
            r.rotation_euler = (0, math.radians(90), 0)
            r.scale = (0.7, 1.0, 1.0)
            set_mat(r, M['dark'])
        if nl > 0:
            out['night'] = light('POINT', 'StairNight', (bp[0] - sgn * 0.05, bp[1], bp[2]), energy=nl, color=kelvin(4300),
                                 radius=0.03, coll=coll)
    return out


def light_vault(S, state='warm', coll=None, leak=False, key_power=55.0, spill=70.0, tube_power=42.0):
    """Lights inside the vault room. 'warm': ceiling tubes on (warm-white, 'lights blazing') + a cream key that writes
    the box lips + low invisible bounce cards near the door so light leaks through the door seam. 'off': nothing."""
    out = {}
    if state == 'off':
        return out
    M = S['M']
    k = 3700
    ts = []
    for i, y in enumerate((1.5, 3.3, 5.1)):
        f = fixture(M, f'FixV{i}', (0.0, y, VAULT_CEIL - 0.01), axis='Y', on=True, power=tube_power, k=k, coll=coll, tubes=1,
                    strength=12.0)
        ts.append(f)
    out['tubes'] = ts
    aim = empty('VKeyAim', (-1.2, 3.0, 1.2), coll=coll)
    kl = light('AREA', 'VaultKey', (0.95, 1.1, 2.7), energy=key_power, color=kelvin(3500), size=0.3, coll=coll)
    track_to(kl, aim)
    out['key'] = kl
    if spill:
        # the lit room seen as a light source from outside: a warm soft panel just inside the doorway, aimed out through
        # the opening (lays the warm trapezoid on the antechamber floor, warms the open door's back and its bolts)
        sp = light('AREA', 'DoorSpill', (0.0, WALL_T + 0.35, 1.25), (math.radians(-80), 0, 0), energy=spill,
                   color=kelvin(3500), size=1.0, size_y=1.9, shape='RECTANGLE', coll=coll)
        try:
            sp.visible_glossy = False
        except Exception:
            pass
        out['spill'] = sp
    if leak:
        out['leak'] = leak_lights(coll)
    return out


def leak_lights(coll=None, under=10.0, side=13.0, glow=6.0, k=3200):
    """Warm light escaping through the seams of the ajar door (motivated by the lit vault behind it):
    - a thin strip source in the bottom gap and one in the free-edge slit, aimed out at the antechamber: they lay a warm
      fan across the threshold and a blade of light on the floor, and catch the chamfers either side of the slit;
    - two hairline emissive strips, seen only through the gaps (on the threshold under the plate, and on the sliver of
      rebate step behind the slit).
    Use only while the door is ajar (S00, the end of S52): with the door open they would show. Returns dict of lights,
    emissive objects and the glow material's strength socket (for keying)."""
    lu = light('AREA', 'LeakUnder', (0.0, -0.075, 0.0135), (math.radians(-90), 0, 0), energy=under, color=kelvin(k),
               size=1.12, size_y=0.004, shape='RECTANGLE', coll=coll)
    ls = light('AREA', 'LeakSide', (REB_HW - 0.003, -0.05, 1.07), (math.radians(-90), 0, 0), energy=side, color=kelvin(k),
               size=0.004, size_y=2.05, shape='RECTANGLE', coll=coll)
    for lt in (lu, ls):
        try:
            lt.visible_glossy = False
        except Exception:
            pass
    gm = mat_emission('LeakGlow', color=kelvin(k - 300), strength=glow)
    g1 = xbox('LeakGlowUnder', -0.57, 0.57, PLATE_Y[0] + 0.004, -0.03, 0.0081, 0.0085, gm, coll=coll)
    g2 = xbox('LeakGlowSlit', PLATE_HW - 0.002, REB_HW - 0.0003, -0.0214, -0.0204, PLATE_Z[0], REB_TOP - 0.003, gm, coll=coll)
    for g in (g1, g2):
        no_shadow(g)
    strength = gm.node_tree.nodes['Emission'].inputs['Strength']
    return {'lights': (lu, ls), 'glow': (g1, g2), 'strength': strength}


# ----------------------------------------------------------------------------- vault room (SF1 look) behind the door

def build_vault(coll=None, cols=18, rows=13, seed_r=7, seed_l=19, debris=True):
    VM = VF.mats()
    y0 = WALL_T + 0.02
    right = VF.build_wall(VM, y0=y0, cols=cols, rows=rows, seed=seed_r, forced=0.6, side=1, coll=coll)
    left = VF.build_wall(VM, y0=y0, cols=cols, rows=rows, seed=seed_l, forced=0.62, side=-1, coll=coll)
    yend = y0 + cols * VF.CW
    box('VFloor', (3.6, yend - WALL_T + 0.4, 0.1), (0, (WALL_T + yend) / 2, -0.05), coll=coll, mat=VM['floor'])
    vc = mat_principled('VaultCeil', color=(0.035, 0.035, 0.037), rough=0.65)
    box('VCeil', (3.6, yend - WALL_T + 0.4, 0.1), (0, (WALL_T + yend) / 2, VAULT_CEIL + 0.05), coll=coll, mat=vc)
    ew = mat_concrete('VaultEndConcrete', base=(0.07, 0.072, 0.075), wet=0.0, scale=1.5, contrast=0.4)
    box('VEnd', (3.6, 0.2, VAULT_CEIL), (0, yend + 0.12, VAULT_CEIL / 2), coll=coll, mat=ew)
    for sx in (-1, 1):
        box(f'VSide{sx}', (0.2, yend - WALL_T + 0.4, VAULT_CEIL), (sx * 1.85, (WALL_T + yend) / 2, VAULT_CEIL / 2), coll=coll,
            mat=ew)
    if debris:
        VF.scatter_debris(VM, (-1.1, WALL_T + 0.25, 0), (1.15, yend - 0.2, 0), count=150, seed=11, near=(1.15, 0), coll=coll)
        VF.scatter_debris(VM, (-1.15, WALL_T + 0.25, 0), (1.0, yend - 0.4, 0), count=70, seed=23, near=(-1.1, 0), coll=coll)
    return {'vault_right': right, 'vault_left': left, 'VM': VM}


# ----------------------------------------------------------------------------- whole set

def build_set(coll=None, vault=True, stair=True, grate=True, cctv=True, key=True, numerals=False, debris=True, a2=False):
    """a2=True: continuity with A2's macro shots (lib/door_macro.py): zinc contact blocks (mat_zinc) for the two
    magnetic plates and A2's dial_with_lens() for the wheel + reading lens. Falls back to door_ff's own parts if the
    import fails. Default False (S00/S01 were approved and rendered without it)."""
    M = mats()
    S = {'M': M}
    if a2:
        try:
            import door_macro as A2
            M['magplate'] = A2.mat_zinc('ZincBlock')
        except Exception as e:
            print('[info] door_macro.mat_zinc unavailable, keeping MagFace paint:', e, flush=True)
    S.update(build_door(M, coll, numerals=numerals, key=key, a2=a2))
    S.update(build_frame(M, coll))
    S.update(build_room(M, coll, stair=stair))
    S['stair_built'] = stair
    S['keypad'] = build_keypad(M, coll)
    if grate:
        S.update(build_grate(M, coll))
    if cctv:
        S['cctv'] = build_cctv(M, coll)
    if vault:
        S.update(build_vault(coll, debris=debris))
    S['points'] = {'door_center': Vector((0.0, PANEL_FRONT, 1.08)), 'dial': DIAL.copy(), 'keyhole': KEYHOLE.copy(),
                   'hinge': Vector((HINGE_X, HINGE_Y, 1.05)), 'mag': Vector((0.584, FRAME_Y, sum(MAG_Z) / 2)),
                   'keypad': KEYPAD.copy(), 'gate': Vector((0.0, ROOM_BACK, 1.1))}
    return S


def set_door(S, angle_deg, frame=None):
    """Door opening angle in degrees (0 shut, ~112 wide open). Keys it if frame is given."""
    S['door'].rotation_euler.z = -math.radians(angle_deg)
    if frame is not None:
        S['door'].keyframe_insert('rotation_euler', index=2, frame=frame)


def set_bolts(S, extended=True, frame=None):
    for sl in S['bolts']:
        sl.location.x = 0.07 if extended else 0.0
        if frame is not None:
            sl.keyframe_insert('location', index=0, frame=frame)
    for sl in S['top_bolts']:
        sl.location.z = 0.035 if extended else 0.0
        if frame is not None:
            sl.keyframe_insert('location', index=2, frame=frame)


def hide_key(S, hidden=True):
    if 'key_root' in S:
        for o in [S['key_root']] + list(S['key_root'].children_recursive):
            o.hide_render = hidden
            o.hide_viewport = hidden


def haze(name, loc, size, density=0.012, color=(0.9, 0.88, 0.85), coll=None):
    m = mat_volume(name + 'M', density=density, color=color, anisotropy=0.45, noise_scale=1.4, contrast=(0.3, 0.8))
    return volume_box(name, loc, size, m, coll=coll)
