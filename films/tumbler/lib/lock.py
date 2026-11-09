"""Combination lock: dial, bezel, engine-turned door plate, and the tumbler wheel pack.

Local frame: the dial face points +Z (toward the viewer). Parent everything to a root empty and
rotate it to place the lock in the scene. Units are 'dial radii' (1.0 = dial radius, ~45 mm real).
"""
import math, random
import bpy, bmesh
from mathutils import Vector, Matrix
from common import *


# ----------------------------------------------------------------------------- shaders

def _polar(nb, center=(0, 0, 0), coord='Object', src=None):
    mp = nb.n('ShaderNodeMapping', Location=tuple(-c for c in center))
    if src is not None:      # (node, output) vector source, e.g. aspect-corrected UVs
        nb.l(src[0], src[1], mp, 'Vector')
    else:
        tc = nb.n('ShaderNodeTexCoord')
        nb.l(tc, coord, mp, 'Vector')
    sep = nb.n('ShaderNodeSeparateXYZ')
    nb.l(mp, 'Vector', sep, 0)
    th = nb.math('ARCTAN2', None, None)
    nb.l(sep, 'Y', th, 0)
    nb.l(sep, 'X', th, 1)
    comb = nb.n('ShaderNodeCombineXYZ')
    nb.l(sep, 'X', comb, 'X')
    nb.l(sep, 'Y', comb, 'Y')
    r = nb.n('ShaderNodeVectorMath', {'operation': 'LENGTH'})
    nb.l(comb, 'Vector', r, 0)
    return r, th, sep


def guilloche_lines(nb, center=(0, 0, 0), k=36, w=60.0, petals=8, amp=0.06, r0=0.0, r1=1.0, width=0.18, coord='Object',
                    src=None):
    """Returns a node whose output 0 is 1.0 on engraved guilloche lines, 0 elsewhere (crossing spiral rosette)."""
    r, th, _ = _polar(nb, center, coord, src)
    # petal modulation: r' = r + amp*sin(petals*theta)
    pm = nb.math('MULTIPLY', th, None, vb=petals)
    ps = nb.math('SINE', pm)
    pa = nb.math('MULTIPLY_ADD', ps, None, vb=amp)
    nb.L.new(r.outputs['Value'], pa.inputs[2])
    kt = nb.math('MULTIPLY', th, None, vb=k)
    wr = nb.math('MULTIPLY', pa, None, vb=w)
    s1 = nb.math('SINE', nb.math('ADD', kt, wr))
    s2 = nb.math('SINE', nb.math('SUBTRACT', kt, wr))
    a1 = nb.math('ABSOLUTE', s1)
    a2 = nb.math('ABSOLUTE', s2)
    mn = nb.math('MINIMUM', a1, a2)
    line = nb.math('SUBTRACT', None, mn, va=1.0)   # 1 at line centre
    ln = nb.n('ShaderNodeMapRange', **{'From Min': 1.0 - width, 'From Max': 1.0 - width * 0.35})
    nb.L.new(line.outputs[0], ln.inputs['Value'])
    # annulus mask
    m0 = nb.n('ShaderNodeMapRange', **{'From Min': r0, 'From Max': r0 + 0.01})
    nb.L.new(r.outputs['Value'], m0.inputs['Value'])
    m1 = nb.n('ShaderNodeMapRange', **{'From Min': r1, 'From Max': r1 - 0.01})
    nb.L.new(r.outputs['Value'], m1.inputs['Value'])
    mk = nb.math('MULTIPLY', m0, m1)
    out = nb.math('MULTIPLY', ln, mk)
    return out


def mat_engine_turned(name='EngineTurned', base=(0.5, 0.51, 0.53), rough=(0.12, 0.34), cell=0.22, rings=70.0,
                      bump=0.06):
    """Perlage / engine-turned steel: overlapping turned circles on a grid (classic safe-door finish)."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    p.inputs['Metallic'].default_value = 1.0
    tc = nb.n('ShaderNodeTexCoord')
    sep = nb.n('ShaderNodeSeparateXYZ')
    nb.l(tc, 'Object', sep, 0)
    # two staggered grids, the second offset half a cell -> overlapping circles
    acc = None
    for off, layer in ((0.0, 0), (0.5, 1)):
        gx = nb.math('MULTIPLY_ADD', sep, None, vb=1.0 / cell)
        nb.L.new(sep.outputs['X'], gx.inputs[0])
        gx.inputs[2].default_value = off
        gy = nb.math('MULTIPLY_ADD', None, None, vb=1.0 / cell)
        nb.L.new(sep.outputs['Y'], gy.inputs[0])
        gy.inputs[2].default_value = off * 0.0
        fx = nb.math('SUBTRACT', nb.math('FRACT', gx), None, vb=0.5)
        fy = nb.math('SUBTRACT', nb.math('FRACT', gy), None, vb=0.5)
        cmb = nb.n('ShaderNodeCombineXYZ')
        nb.L.new(fx.outputs[0], cmb.inputs['X'])
        nb.L.new(fy.outputs[0], cmb.inputs['Y'])
        ln = nb.n('ShaderNodeVectorMath', {'operation': 'LENGTH'})
        nb.l(cmb, 'Vector', ln, 0)
        rs = nb.math('SINE', nb.math('MULTIPLY', ln, None, vb=rings * cell))
        msk = nb.math('LESS_THAN', ln, None, vb=0.62)
        v = nb.math('MULTIPLY', rs, msk)
        acc = v if acc is None else nb.math('MAXIMUM', acc, v)
    nz = nb.n('ShaderNodeTexNoise', Scale=7.0, Detail=6.0)
    nb.l(tc, 'Object', nz, 'Vector')
    bm = nb.n('ShaderNodeBump', Strength=bump, Distance=0.004)
    nb.L.new(acc.outputs[0], bm.inputs['Height'])
    nb.l(bm, 'Normal', p, 'Normal')
    rr = nb.ramp(nz, 'Fac', [(0.3, (rough[0],) * 3), (0.75, (rough[1],) * 3)])
    nb.l(rr, 'Color', p, 'Roughness')
    cr = nb.ramp(nz, 'Fac', [(0.25, tuple(c * 0.7 for c in base)), (0.75, base)])
    nb.l(cr, 'Color', p, 'Base Color')
    p.inputs['Anisotropic'].default_value = 0.35
    return m


def mat_dial_face(name='DialFace', base=(0.52, 0.53, 0.55)):
    """Satin-turned steel with fine concentric grooves (anisotropic) + faint wear."""
    return mat_concentric(name, base=base, rough=(0.16, 0.3), rings=900.0, bump=0.02)


def mat_dial_black(name='DialBlack'):
    """Black satin enamel over steel with a clear coat; edges worn to steel."""
    m = mat_paint(name, color=(0.012, 0.012, 0.014), rough=(0.3, 0.42), wear=0.25, edge_metal=(0.55, 0.55, 0.57))
    p = principled(m)
    p.inputs['Coat Weight'].default_value = 0.6
    p.inputs['Coat Roughness'].default_value = 0.12
    return m


def mat_fill(name='Fill', color=(0.80, 0.74, 0.58)):
    """Cream paint fill in engravings: slightly worn, satin."""
    m = mat_paint(name, color=color, rough=(0.45, 0.65), wear=0.15, edge_metal=(0.4, 0.4, 0.42))
    return m


def mat_medallion(name='Medallion', base=(0.7, 0.5, 0.24)):
    """Brass medallion with engraved guilloche rosette (bump + darkened grooves)."""
    m = mat_brass(name, base=base, rough=(0.14, 0.3))
    nb = NB(m)
    p = principled(m)
    g = guilloche_lines(nb, k=56, w=190.0, petals=12, amp=0.018, r0=0.04, r1=0.30, width=0.2)
    bm = nb.n('ShaderNodeBump', Strength=0.35, Distance=0.003, attrs={'invert': True})
    nb.L.new(g.outputs[0], bm.inputs['Height'])
    nb.l(bm, 'Normal', p, 'Normal')
    # darken grooves: multiply base colour
    cur = p.inputs['Base Color'].links[0].from_socket
    mul = nb.n('ShaderNodeMix', {'data_type': 'RGBA', 'blend_type': 'MIX'})
    nb.L.new(g.outputs[0], mul.inputs[0])
    nb.L.new(cur, mul.inputs[6])
    mul.inputs[7].default_value = (0.08, 0.05, 0.02, 1)
    nb.L.new(mul.outputs[2], p.inputs['Base Color'])
    return m


# ----------------------------------------------------------------------------- dial

def build_dial(root, coll=None, mats=None):
    """Rotating dial (child of returned 'dial' empty) + fixed bezel/plate. Returns dict of parts."""
    mats = mats or {}
    steel = mats.get('dial') or mat_dial_black('DialBlack')
    fill = mats.get('fill') or mat_fill('DialFill')
    knurl_m = mats.get('knurl') or mat_metal('Knurl', base=(0.62, 0.62, 0.64), rough=(0.14, 0.28), scale=8.0, grime=0.35)
    plate_m = mats.get('plate') or mat_engine_turned('DoorPlate')
    bez_m = mats.get('bezel') or mat_concentric('Bezel', base=(0.42, 0.43, 0.45), rough=(0.2, 0.36), rings=500.0)
    dark_m = mats.get('dark') or mat_principled('Blacked', color=(0.012, 0.012, 0.014), rough=0.4, metal=0.6)
    med_m = mats.get('medallion') or mat_medallion()

    dial = empty('Dial', coll=coll)
    parent(dial, root, keep=False)

    # dial body with knurled rim
    out = gear_outline(240, 0.986, 1.0, pts_per_tooth=4, tooth_frac=0.45)
    body = extrude_profile('DialBody', out, 0.30, coll=coll)
    bevel(body, 0.012, 2, angle=50)
    set_mat(body, knurl_m)
    parent(body, dial, keep=False)
    # face disc (slightly inset from knurl, turned finish)
    face = prim('cyl', 'DialFace', (0, 0, 0.305), seg=180, r=0.955, depth=0.03, coll=coll)
    bevel(face, 0.006, 2, angle=40)
    set_mat(face, steel)
    parent(face, dial, keep=False)
    # numeral ring step (raised skirt 0.5..0.955)
    # ticks: 100 marks
    tick_bm = bmesh.new()
    for i in range(100):
        a = math.pi / 2 - 2 * math.pi * i / 100
        l_in = 0.70 if i % 10 == 0 else (0.76 if i % 5 == 0 else 0.81)
        w = 0.0065 if i % 5 else 0.011
        cx, cy = math.cos(a), math.sin(a)
        r0, r1 = l_in, 0.93
        # quad along radius, slightly raised (inlaid paint)
        px, py = -cy * w / 2, cx * w / 2
        z = 0.3215
        v = [tick_bm.verts.new((cx * r0 + px, cy * r0 + py, z)), tick_bm.verts.new((cx * r1 + px, cy * r1 + py, z)),
             tick_bm.verts.new((cx * r1 - px, cy * r1 - py, z)), tick_bm.verts.new((cx * r0 - px, cy * r0 - py, z))]
        tick_bm.faces.new(v)
    bmesh.ops.solidify(tick_bm, geom=tick_bm.faces[:], thickness=0.002)
    ticks = from_bmesh('Ticks', tick_bm, coll, smooth=False)
    set_mat(ticks, fill)
    parent(ticks, dial, keep=False)
    # engraved groove ring for the ticks (dark recess look)
    groove = prim('torus', 'TickGroove', (0, 0, 0.318), R=0.935, r=0.006, seg=180, seg2=8, coll=coll)
    set_mat(groove, dark_m)
    parent(groove, dial, keep=False)
    # numerals 0..90 (every 10), upright toward rim
    for i in range(10):
        val = i * 10
        a = math.pi / 2 - 2 * math.pi * val / 100
        t = text_mesh(str(val), f'Num{val}', size=0.13, extrude=0.004, coll=coll)
        t.location = (math.cos(a) * 0.585, math.sin(a) * 0.585, 0.322)
        t.rotation_euler = (0, 0, a - math.pi / 2)
        set_mat(t, fill)
        parent(t, dial, keep=False)
    # knob (front grip) with fine knurling + medallion
    kout = gear_outline(160, 0.434, 0.445, pts_per_tooth=4, tooth_frac=0.45)
    knob = extrude_profile('Knob', kout, 0.30, coll=coll)
    knob.location = (0, 0, 0.32)
    bevel(knob, 0.015, 3, angle=50)
    set_mat(knob, knurl_m)
    parent(knob, dial, keep=False)
    cap = prim('cyl', 'KnobCap', (0, 0, 0.63), seg=128, r=0.415, r2=0.38, depth=0.03, coll=coll)
    bevel(cap, 0.01, 2, angle=30)
    set_mat(cap, mat_concentric('KnobFace', base=(0.55, 0.56, 0.58), rough=(0.12, 0.26), rings=700.0))
    parent(cap, dial, keep=False)
    med = prim('cyl', 'Medallion', (0, 0, 0.648), seg=128, r=0.31, depth=0.012, coll=coll)
    bevel(med, 0.004, 2, angle=30)
    set_mat(med, med_m)
    parent(med, dial, keep=False)
    # finger notch spoke on knob rim (a raised fin so rotation reads)
    fin = box('KnobFin', (0.07, 0.10, 0.27), (0, 0.46, 0.47), coll=coll, bev=0.012, mat=knurl_m)
    parent(fin, dial, keep=False)

    # fixed bezel ring (does not rotate) + index notch
    bout = [(1.24 * math.cos(2 * math.pi * i / 192), 1.24 * math.sin(2 * math.pi * i / 192)) for i in range(192)]
    bin_ = [(1.02 * math.cos(2 * math.pi * i / 192), 1.02 * math.sin(2 * math.pi * i / 192)) for i in range(192)]
    bez = extrude_profile('Bezel', bout, 0.16, holes=[bin_], coll=coll)
    bez.location = (0, 0, 0.0)
    bevel(bez, 0.02, 3, angle=40)
    set_mat(bez, bez_m)
    parent(bez, root, keep=False)
    # index notch: cream wedge at 12 o'clock on the bezel
    ib = bmesh.new()
    vs = [ib.verts.new(p) for p in ((-0.035, 1.20, 0.161), (0.035, 1.20, 0.161), (0.0, 1.05, 0.161))]
    ib.faces.new(vs)
    bmesh.ops.solidify(ib, geom=ib.faces[:], thickness=0.003)
    idx = from_bmesh('Index', ib, coll, smooth=False)
    set_mat(idx, fill)
    parent(idx, root, keep=False)
    # bezel screws
    screw_m = mats.get('screw') or mat_metal('Screw', base=(0.4, 0.4, 0.42), rough=(0.25, 0.4), scale=20)
    for i in range(6):
        a = math.pi / 6 + i * math.pi / 3
        s = prim('cyl', f'Screw{i}', (math.cos(a) * 1.13, math.sin(a) * 1.13, 0.165), seg=32, r=0.045, depth=0.03, coll=coll)
        bevel(s, 0.012, 3, angle=30)
        set_mat(s, screw_m)
        slot = box(f'Slot{i}', (0.075, 0.011, 0.02), (math.cos(a) * 1.13, math.sin(a) * 1.13, 0.18),
                   (0, 0, a + 0.7 * i), coll=coll, mat=dark_m)
        parent(s, root, keep=False)
        parent(slot, root, keep=False)
    # door plate behind (engine turned)
    plate = box('Plate', (9.0, 9.0, 0.2), (0, 0, -0.1), coll=coll, bev=0.0, mat=plate_m)
    parent(plate, root, keep=False)
    return {'dial': dial, 'bezel': bez}


# ----------------------------------------------------------------------------- wheel pack

def wheel_outline(r_out, r_in, gate_ang, gate_w=0.16, gate_depth=0.13, n=256):
    o, h = [], []
    for i in range(n):
        a = 2 * math.pi * i / n
        d = math.atan2(math.sin(a - gate_ang), math.cos(a - gate_ang))
        r = r_out - (gate_depth if abs(d) < gate_w / 2 / r_out else 0.0)
        o.append((r * math.cos(a), r * math.sin(a)))
        h.append((r_in * math.cos(a), r_in * math.sin(a)))
    return o, h


def build_wheel(name, r_out=1.0, r_in=0.16, thick=0.11, gate_ang=math.pi / 2, mat=None, coll=None, holes=5, hole_r=0.17):
    o, h = wheel_outline(r_out, r_in, gate_ang)
    w = extrude_profile(name, o, thick, holes=[h], coll=coll)
    w.location.z = -thick / 2
    apply_transform_z(w)
    # lightening holes via boolean
    if holes:
        cutters = []
        for i in range(holes):
            a = gate_ang + math.pi / holes + 2 * math.pi * i / holes
            c = prim('cyl', f'{name}_h{i}', (math.cos(a) * 0.58, math.sin(a) * 0.58, 0), seg=40, r=hole_r, depth=thick * 3, coll=coll)
            cutters.append(c)
        cut = join(cutters, f'{name}_cut')
        b = w.modifiers.new('holes', 'BOOLEAN')
        b.operation = 'DIFFERENCE'
        b.object = cut
        try:
            b.solver = 'EXACT'
        except Exception:
            pass
        apply_mods(w)
        bpy.data.objects.remove(cut)
    bevel(w, 0.008, 2, angle=40)
    # rim hairline grooves on the face (two thin rings) for detail
    if mat:
        set_mat(w, mat)
    return w


def apply_transform_z(o):
    me = o.data
    for v in me.vertices:
        v.co.z += o.location.z
    o.location.z = 0


def build_wheel_pack(root, coll=None, n=3, spacing=0.30):
    """Wheels stacked along local Z (spindle axis), each child of its own pivot empty (rotate .rotation_euler.z).
    Returns dict(wheels=[pivot...], fence, lever, bolt, cam)."""
    brass = [mat_brass(f'WheelBrass{i}', base=(0.80 - 0.04 * i, 0.55 - 0.03 * i, 0.24), rough=(0.14, 0.36), scale=3.0)
             for i in range(n)]
    steel = mat_metal('PackSteel', base=(0.5, 0.51, 0.53), rough=(0.16, 0.34), scale=1.5, bump=0.008, brushed=(30.0, 1.0, 1.0))
    dark = mat_metal('CaseSteel', base=(0.11, 0.115, 0.12), rough=(0.3, 0.55), scale=1.0, bump=0.012, grime=0.4)
    pivots = []
    for i in range(n):
        pv = empty(f'WheelPivot{i}', (0, 0, -i * spacing), coll=coll)
        parent(pv, root, keep=False)
        w = build_wheel(f'Wheel{i}', mat=brass[i], coll=coll)
        parent(w, pv, keep=False)
        # fly (drive pin) on the wheel face
        fly = prim('cyl', f'Fly{i}', (math.cos(-0.6) * 0.86, math.sin(-0.6) * 0.86, 0.075), seg=24, r=0.04, depth=0.07, coll=coll)
        bevel(fly, 0.008, 2)
        set_mat(fly, steel)
        parent(fly, pv, keep=False)
        # spacer washer
        if i < n - 1:
            wa = prim('cyl', f'Washer{i}', (0, 0, -i * spacing - spacing / 2), seg=64, r=0.32, depth=spacing - 0.12, coll=coll)
            bevel(wa, 0.01, 2)
            set_mat(wa, steel)
            parent(wa, root, keep=False)
        pivots.append(pv)
    # drive cam in front (steel) with a notch at top
    cpv = empty('CamPivot', (0, 0, spacing * 0.9), coll=coll)
    parent(cpv, root, keep=False)
    co, ch = wheel_outline(0.92, 0.16, math.pi / 2, gate_w=0.22, gate_depth=0.18)
    cam = extrude_profile('DriveCam', co, 0.16, holes=[ch], coll=coll)
    cam.location.z = -0.08
    apply_transform_z(cam)
    bevel(cam, 0.01, 2)
    set_mat(cam, mat_concentric('CamFace', base=(0.55, 0.56, 0.58), rough=(0.12, 0.3), rings=600.0))
    parent(cam, cpv, keep=False)
    # spindle
    sp = prim('cyl', 'Spindle', (0, 0, -spacing * (n - 1) / 2 + 0.2), seg=48, r=0.155, depth=spacing * (n + 3), coll=coll)
    bevel(sp, 0.01, 2)
    set_mat(sp, steel)
    parent(sp, root, keep=False)
    # fence: hardened bar parallel to the spindle, riding on the wheel rims at the top (+Y)
    lev_pv = empty('LeverPivot', (0, 0, 0), coll=coll)
    parent(lev_pv, root, keep=False)
    fence_m = mat_metal('FenceSteel', base=(0.62, 0.62, 0.64), rough=(0.1, 0.25), scale=6)
    flen = spacing * (n - 1) + 0.2
    fence = box('Fence', (0.11, 0.13, flen), (0, 1.0 + 0.065, -spacing * (n - 1) / 2), coll=coll, bev=0.012, mat=fence_m)
    parent(fence, lev_pv, keep=False)
    # lever: flat plate in front of the drive cam, from the bolt (right) to a nose over the cam
    lb = bmesh.new()
    pts = [(-x, y) for x, y in reversed([(-0.15, 1.02), (0.2, 0.98), (1.9, 1.05), (2.3, 1.18), (2.3, 1.42), (1.9, 1.5), (0.1, 1.36), (-0.2, 1.22)])]
    lev = extrude_profile('Lever', pts, 0.09, coll=coll)
    lev.location = (0, 0, spacing * 0.9 + 0.1)
    bevel(lev, 0.012, 2)
    set_mat(lev, steel)
    parent(lev, lev_pv, keep=False)
    # fence carrier tying fence to lever
    car = box('FenceCarrier', (0.14, 0.2, 0.42), (0, 1.17, spacing * 0.75), coll=coll, bev=0.015, mat=steel)
    parent(car, lev_pv, keep=False)
    # bolt: chunky block to the right, sliding along +X when it retracts
    bolt = box('Bolt', (1.7, 0.75, 0.62), (-2.75, 1.05, -0.05), coll=coll, bev=0.035, mat=mat_metal(
        'BoltSteel', base=(0.6, 0.6, 0.62), rough=(0.12, 0.3), scale=3.0, brushed=(40.0, 1.0, 1.0)))
    parent(bolt, root, keep=False)
    pin = prim('cyl', 'LeverPin', (-2.1, 1.3, spacing * 0.9 + 0.2), seg=32, r=0.07, depth=0.12, coll=coll)
    set_mat(pin, steel)
    parent(pin, bolt, keep=True)
    # case: back plate + side walls, dark steel with screws and stamped plate
    back = box('CaseBack', (7.5, 5.4, 0.12), (-0.4, 0.3, -spacing * (n - 1) - 1.1), coll=coll, bev=0.02, mat=dark)
    parent(back, root, keep=False)
    for sx in (3.4,):
        wall = box(f'CaseWall{sx}', (0.14, 4.4, spacing * n + 0.9), (sx, 0.3, -spacing * (n - 1) / 2 - 0.0), coll=coll,
                   bev=0.02, mat=dark)
        parent(wall, root, keep=False)
    rng = random.Random(4)
    screw_m = mat_metal('CaseScrew', base=(0.35, 0.35, 0.37), rough=(0.25, 0.45), scale=20)
    for (x, y) in ((-2.4, -1.6), (2.7, -1.6), (-2.4, 2.1), (2.7, 2.1)):
        s = prim('cyl', 'CaseScrew', (x, y, -spacing * (n - 1) - 1.02), seg=32, r=0.1, depth=0.06, coll=coll)
        bevel(s, 0.02, 3)
        set_mat(s, screw_m)
        parent(s, root, keep=False)
        sl = box('CaseSlot', (0.17, 0.025, 0.04), (x, y, -spacing * (n - 1) - 0.99), (0, 0, rng.uniform(0, 3)), coll=coll,
                 mat=mat_principled('SlotDark', color=(0.01, 0.01, 0.01), rough=0.5))
        parent(sl, root, keep=False)
    stamp = text_mesh('NO. 4417  ·  6-WHEEL GROUP II', 'Stamp', size=0.16, extrude=0.006, coll=coll)
    stamp.location = (0.6, -1.55, -spacing * (n - 1) - 1.035)
    set_mat(stamp, mat_metal('StampSteel', base=(0.2, 0.2, 0.21), rough=(0.3, 0.5), scale=10))
    parent(stamp, root, keep=False)
    return {'wheels': pivots, 'cam': cpv, 'lever': lev_pv, 'fence': fence, 'bolt': bolt}
