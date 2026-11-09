"""ACT IV — THE GETAWAY: reusable night-city toolkit for shots/act4_city.py.

    build_car()        dark 70s/80s four-door getaway sedan (no make, no logos), rigged:
                       root (path position + yaw + terrain pitch) -> body (roll/pitch/heave) -> panels,
                       root -> steer pivots -> wheels (spin about local Y)
    Path / drive()     Catmull-Rom path + speed profile -> per-frame keys with body roll, squat, drift slip,
                       wheel spin and steering; car['state'][frame] keeps world matrices for the note wake
    build_street()     wet asphalt, kerbs, sidewalks, lane markings
    build_buildings()  rows of shader-windowed buildings (cheap: one box + one material each)
    build_bank_tower() hero tower: 7-bay geometric window grid (match-cut from the deposit-box wall),
                       podium with bank entrance and the garage ramp
    streetlights()     sodium cobra-head lamps (2000 K)
    build_tunnel()     portal + tiled tube with amber strip fixtures
    police_strobe()    off-screen red/blue lights keyed per frame on the beat
    note_wake()        banknotes thrown from the open rear window / lifted off the road by the wake

World: Z-up, metres. The street runs along X; road |y| < ROAD_HW; building line at |y| = FACADE_Y.
Car local frame: +X forward, +Y left, Z up, origin on the ground at mid-wheelbase.
"""
import math, random, bisect
import bpy, bmesh
from mathutils import Vector, Matrix, Euler, Quaternion, noise as mnoise
from common import *
from note import make_banknote, W as NOTE_W, HGT as NOTE_H

ROAD_HW = 7.0
KERB_H = 0.15
FACADE_Y = 11.0
SODIUM = kelvin(2000)          # (1, 0.25, 0.002)
RED = (1.0, 0.018, 0.012)
BLUE = (0.025, 0.10, 1.0)


# ============================================================================ small helpers

def smooth_angle(o, deg=32.0):
    me = o.data
    try:
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(deg))
    except Exception:
        for p in me.polygons:
            p.use_smooth = True
    return o


def no_emit_sampling(m):
    try:
        m.cycles.emission_sampling = 'NONE'
    except Exception:
        pass
    return m


def obj_bm(name, bm, mats, coll=None, smooth=None):
    """bmesh -> object with material slots; smooth=None flat, else auto-smooth angle in degrees."""
    o = from_bmesh(name, bm, coll, smooth=False)
    for m in mats:
        o.data.materials.append(m)
    if smooth:
        smooth_angle(o, smooth)
    return o


def bm_box(bm, c, s, mi=0, rot=None):
    """Axis-aligned (or rotated by Matrix rot about its centre) box appended to bm."""
    hx, hy, hz = s[0] / 2, s[1] / 2, s[2] / 2
    corners = [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]
    vs = []
    for dx, dy, dz in corners:
        v = Vector((dx * hx, dy * hy, dz * hz))
        if rot is not None:
            v = rot @ v
        vs.append(bm.verts.new(Vector(c) + v))
    out = []
    for f in ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)):
        fa = bm.faces.new([vs[i] for i in f])
        fa.material_index = mi
        out.append(fa)
    return out


def bm_quad(bm, pts, mi=0, uvs=None, uvl=None, uv2=None, uvl2=None):
    vs = [bm.verts.new(Vector(p)) for p in pts]
    f = bm.faces.new(vs)
    f.material_index = mi
    if uvs and uvl is not None:
        for lp, uv in zip(f.loops, uvs):
            lp[uvl].uv = uv
    if uv2 is not None and uvl2 is not None:
        for lp in f.loops:
            lp[uvl2].uv = uv2
    return f


def bm_revolve(bm, prof, segs, mi=0, closed=False, axis_y=True):
    """Revolve a profile [(r, a)] about the Y axis (a = y)."""
    rings = []
    for i in range(segs):
        an = 2 * math.pi * i / segs
        ca, sa = math.cos(an), math.sin(an)
        rings.append([bm.verts.new((r * ca, a, r * sa)) for r, a in prof])
    n = len(prof)
    m = n if closed else n - 1
    for i in range(segs):
        r0, r1 = rings[i], rings[(i + 1) % segs]
        for j in range(m):
            j2 = (j + 1) % n
            f = bm.faces.new((r0[j], r0[j2], r1[j2], r1[j]))
            f.material_index = mi
    return rings


def sweep(bm, path, section, up=(0, 0, 1), mi=0, closed=False, cap=True):
    """Sweep a 2D section [(a, b)] along a 3D polyline. a runs along N = T x up, b along B = N x T."""
    path = [Vector(p) for p in path]
    n = len(path)
    U = Vector(up)
    rings = []
    for i, P in enumerate(path):
        if closed:
            T = path[(i + 1) % n] - path[(i - 1) % n]
        else:
            T = path[min(i + 1, n - 1)] - path[max(i - 1, 0)]
        T.normalize()
        N = T.cross(U)
        if N.length < 1e-6:
            N = T.orthogonal()
        N.normalize()
        Bv = N.cross(T)
        rings.append([bm.verts.new(P + N * a + Bv * b) for a, b in section])
    m = len(section)
    for i in range(n if closed else n - 1):
        r0, r1 = rings[i], rings[(i + 1) % n]
        for j in range(m):
            j2 = (j + 1) % m
            f = bm.faces.new((r0[j], r0[j2], r1[j2], r1[j]))
            f.material_index = mi
    if cap and not closed:
        f = bm.faces.new(list(reversed(rings[0])))
        f.material_index = mi
        f = bm.faces.new(rings[-1])
        f.material_index = mi
    return rings


def rrect(w, h, r, n=3, cx=0.0, cy=0.0):
    """Rounded rectangle outline (CCW) of width w (a) and height h (b)."""
    r = min(r, w / 2 - 1e-4, h / 2 - 1e-4)
    pts = []
    for (ox, oy, a0) in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180),
                         (w / 2 - r, -h / 2 + r, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cx + ox + r * math.cos(a), cy + oy + r * math.sin(a)))
    return pts


def _cr(p0, p1, p2, p3, t, alpha=0.5):
    def tj(ti, a, b):
        return ti + max(1e-4, (b - a).length) ** alpha
    t0 = 0.0
    t1 = tj(t0, p0, p1)
    t2 = tj(t1, p1, p2)
    t3 = tj(t2, p2, p3)
    tt = t1 + (t2 - t1) * t
    A1 = p0 * ((t1 - tt) / (t1 - t0)) + p1 * ((tt - t0) / (t1 - t0))
    A2 = p1 * ((t2 - tt) / (t2 - t1)) + p2 * ((tt - t1) / (t2 - t1))
    A3 = p2 * ((t3 - tt) / (t3 - t2)) + p3 * ((tt - t2) / (t3 - t2))
    B1 = A1 * ((t2 - tt) / (t2 - t0)) + A2 * ((tt - t0) / (t2 - t0))
    B2 = A2 * ((t3 - tt) / (t3 - t1)) + A3 * ((tt - t1) / (t3 - t1))
    return B1 * ((t2 - tt) / (t2 - t1)) + B2 * ((tt - t1) / (t2 - t1))


def spline(pts, per_seg=12):
    P = [Vector(p) for p in pts]
    if len(P) < 3:
        return P
    ext = [P[0] + (P[0] - P[1])] + P + [P[-1] + (P[-1] - P[-2])]
    out = []
    for i in range(1, len(ext) - 2):
        for k in range(per_seg):
            out.append(_cr(ext[i - 1], ext[i], ext[i + 1], ext[i + 2], k / per_seg))
    out.append(P[-1].copy())
    return out


def _interp(xs, ys, x):
    if x <= xs[0]:
        return ys[0]
    if x >= xs[-1]:
        return ys[-1]
    i = bisect.bisect_right(xs, x) - 1
    t = (x - xs[i]) / (xs[i + 1] - xs[i])
    return ys[i] + (ys[i + 1] - ys[i]) * t


def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


# ============================================================================ shader helper

class SB:
    """Socket-level shader builder (wraps common.NB)."""

    def __init__(self, mat):
        self.nb = NB(mat)
        self.L = self.nb.L
        self.mat = mat

    def node(self, kind, attrs=None, **inp):
        return self.nb.n(kind, attrs, **inp)

    def put(self, v, target):
        if hasattr(v, 'is_output'):
            self.L.new(v, target)
        elif hasattr(v, 'outputs'):
            self.L.new(v.outputs[0], target)
        else:
            if target.type == 'RGBA' and isinstance(v, (tuple, list)) and len(v) == 3:
                v = (*v, 1.0)
            elif target.type == 'RGBA' and isinstance(v, (int, float)):
                v = (v, v, v, 1.0)
            elif target.type == 'VECTOR' and isinstance(v, (int, float)):
                v = (v, v, v)
            target.default_value = v

    def m(self, op, a, b=0.0, c=None, clamp=False):
        n = self.nb.n('ShaderNodeMath', {'operation': op, 'use_clamp': clamp})
        self.put(a, n.inputs[0])
        self.put(b, n.inputs[1])
        if c is not None:
            self.put(c, n.inputs[2])
        return n.outputs[0]

    def mul(self, *xs):
        out = xs[0]
        for x in xs[1:]:
            out = self.m('MULTIPLY', out, x)
        return out

    def mr(self, x, a, b, c=0.0, d=1.0, interp='LINEAR', clamp=True):
        n = self.nb.n('ShaderNodeMapRange', {'interpolation_type': interp, 'clamp': clamp})
        self.put(x, n.inputs[0])
        n.inputs[1].default_value = a
        n.inputs[2].default_value = b
        n.inputs[3].default_value = c
        n.inputs[4].default_value = d
        return n.outputs[0]

    def band(self, x, a, b, soft):
        """1 inside [a, b] with soft edges."""
        return self.m('MULTIPLY', self.mr(x, a - soft, a + soft), self.mr(x, b + soft, b - soft))

    def mix(self, fac, a, b, dtype='RGBA', blend='MIX'):
        n = self.nb.n('ShaderNodeMix', {'data_type': dtype, 'blend_type': blend})
        idx = {'RGBA': (0, 6, 7), 'FLOAT': (0, 2, 3), 'VECTOR': (0, 4, 5)}[dtype]
        self.put(fac, n.inputs[idx[0]])
        self.put(a, n.inputs[idx[1]])
        self.put(b, n.inputs[idx[2]])
        return n.outputs[{'FLOAT': 0, 'VECTOR': 1, 'RGBA': 2}[dtype]]

    def cmul(self, a, b):
        return self.mix(1.0, a, b, 'RGBA', 'MULTIPLY')

    def sep(self, v):
        n = self.nb.n('ShaderNodeSeparateXYZ')
        self.put(v, n.inputs[0])
        return n.outputs[0], n.outputs[1], n.outputs[2]

    def comb(self, x, y, z):
        n = self.nb.n('ShaderNodeCombineXYZ')
        for s_, v in zip(n.inputs, (x, y, z)):
            self.put(v, s_)
        return n.outputs[0]

    def tex(self, kind, vec, attrs=None, **inp):
        n = self.nb.n(kind, attrs, **inp)
        self.put(vec, n.inputs['Vector'])
        return n

    def coords(self, kind='Object'):
        tc = self.nb.n('ShaderNodeTexCoord')
        return tc.outputs[kind]

    def bump(self, h, strength, dist, normal=None):
        b = self.nb.n('ShaderNodeBump', Strength=strength, Distance=dist)
        self.put(h, b.inputs['Height'])
        if normal is not None:
            self.put(normal, b.inputs['Normal'])
        return b.outputs['Normal']

    def out(self):
        return self.mat.node_tree.nodes['Material Output']


def _get(name):
    return bpy.data.materials.get(name)


# ============================================================================ materials

def mat_carpaint(name='CarPaint', color=(0.0045, 0.005, 0.006), metal=0.5):
    """Black clearcoat: metallic flake base, glassy coat with orange peel, panel gaps from object coords."""
    if _get(name):
        return _get(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Coat Weight'].default_value = 1.0
    p.inputs['Coat IOR'].default_value = 1.52
    tc = s.node('ShaderNodeTexCoord')
    X, Y, Z = s.sep(tc.outputs['Object'])
    NX, NY, NZ = s.sep(tc.outputs['Normal'])
    ay = s.m('ABSOLUTE', Y)

    def line(v, c, w=0.0024):
        return s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', v, c)), w * 0.45, w, 1.0, 0.0)
    side = s.mr(s.m('ABSOLUTE', NY), 0.55, 0.75)
    top = s.mr(NZ, 0.55, 0.75)
    zm = s.m('MULTIPLY', s.mr(Z, 0.29, 0.32), s.mr(Z, 0.865, 0.83))
    sg = s.m('MAXIMUM', s.m('MAXIMUM', line(X, 0.72), line(X, -0.42)), line(X, -1.38))
    side_g = s.mul(sg, side, zm)
    hood = s.m('MAXIMUM', s.m('MULTIPLY', line(X, 0.80), s.mr(ay, 0.80, 0.78)),
               s.m('MULTIPLY', line(ay, 0.80), s.mr(X, 0.79, 0.81)))
    trunk = s.m('MAXIMUM', s.m('MULTIPLY', line(X, -1.52), s.mr(ay, 0.82, 0.80)),
                s.m('MULTIPLY', line(ay, 0.82), s.mr(X, -1.51, -1.53)))
    gap = s.m('MAXIMUM', side_g, s.m('MULTIPLY', s.m('MAXIMUM', hood, trunk), top), clamp=True)
    # subtle colour variation (flake) and slightly varying base roughness
    fl = s.tex('ShaderNodeTexNoise', tc.outputs['Object'], Scale=900.0, Detail=1.0)
    base = s.mix(s.mr(fl.outputs['Fac'], 0.3, 0.7), tuple(c * 0.7 for c in color), tuple(c * 1.5 for c in color))
    s.put(s.mix(gap, base, (0.0, 0.0, 0.0)), p.inputs['Base Color'])
    s.put(s.mix(gap, 0.32, 0.8, 'FLOAT'), p.inputs['Roughness'])
    s.put(s.m('SUBTRACT', 1.0, gap), p.inputs['Coat Weight'])
    cr = s.tex('ShaderNodeTexNoise', tc.outputs['Object'], Scale=3.0, Detail=2.0)
    s.put(s.mr(cr.outputs['Fac'], 0.3, 0.7, 0.012, 0.035), p.inputs['Coat Roughness'])
    gn = s.bump(s.m('MULTIPLY', gap, -1.0), 0.8, 0.003)
    s.put(gn, p.inputs['Normal'])
    peel = s.tex('ShaderNodeTexNoise', tc.outputs['Object'], Scale=240.0, Detail=2.0, Roughness=0.5)
    s.put(s.bump(peel.outputs['Fac'], 0.03, 0.0006, normal=gn), p.inputs['Coat Normal'])
    return m


def mat_chrome(name='Chrome', base=(0.90, 0.90, 0.92), rough=(0.04, 0.10)):
    if _get(name):
        return _get(name)
    m = mat_principled(name, color=base, rough=rough[0], metal=1.0)
    s = SB(m)
    p = principled(m)
    nz = s.tex('ShaderNodeTexNoise', s.coords(), Scale=30.0, Detail=3.0)
    s.put(s.mr(nz.outputs['Fac'], 0.3, 0.7, rough[0], rough[1]), p.inputs['Roughness'])
    return m


def mat_carglass(name='CarGlass'):
    if _get(name):
        return _get(name)
    return mat_principled(name, color=(0.004, 0.0045, 0.005), rough=0.0, spec=0.5)


def mat_lens(name, emit, strength, base=(0.2, 0.2, 0.2), pattern='ribs', scale=110.0):
    """Lamp lens: glossy plastic with emission broken up by a moulded optic pattern."""
    if _get(name):
        return _get(name)
    m = mat_principled(name, color=base, rough=0.12, coat=1.0, coat_rough=0.02)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    if pattern == 'ribs':          # horizontal ribs + faint vertical flutes (tail bar)
        r1 = s.m('ABSOLUTE', s.m('SINE', s.m('MULTIPLY', Z, scale)))
        r2 = s.m('ABSOLUTE', s.m('SINE', s.m('MULTIPLY', Y, scale * 0.5)))
        pat = s.m('MULTIPLY', s.mr(r1, 0.0, 1.0, 0.45, 1.0), s.mr(r2, 0.0, 1.0, 0.8, 1.0))
    else:                          # 'grid': square prism cells (sealed-beam headlamp)
        r1 = s.m('ABSOLUTE', s.m('SINE', s.m('MULTIPLY', Z, scale)))
        r2 = s.m('ABSOLUTE', s.m('SINE', s.m('MULTIPLY', Y, scale)))
        pat = s.m('MULTIPLY', s.mr(r1, 0.0, 1.0, 0.55, 1.0), s.mr(r2, 0.0, 1.0, 0.55, 1.0))
    p.inputs['Emission Color'].default_value = (*emit, 1)
    st = s.m('MULTIPLY', pat, strength)
    s.put(st, p.inputs['Emission Strength'])
    m['strength_node'] = st.node.name
    return m


def lens_strength_socket(m):
    """Input socket that scales a mat_lens emission (for keying)."""
    n = m.node_tree.nodes[m['strength_node']]
    return n.inputs[1]


def mat_wet_asphalt(name='WetAsphalt', base=(0.020, 0.020, 0.022), wet=0.5, puddle_scale=0.16):
    """Aggregate asphalt under a thin water film (coat); puddles are mirror-flat."""
    if _get(name):
        return _get(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    n1 = s.tex('ShaderNodeTexNoise', co, Scale=0.7, Detail=8.0, Roughness=0.6)
    n2 = s.tex('ShaderNodeTexNoise', co, Scale=puddle_scale, Detail=5.0, Roughness=0.6)
    n3 = s.tex('ShaderNodeTexNoise', co, Scale=6.0, Detail=6.0, Roughness=0.7)
    vor = s.tex('ShaderNodeTexVoronoi', co, Scale=240.0)
    pud = s.mr(n2.outputs['Fac'], 0.56 - wet * 0.1, 0.60 - wet * 0.1)
    col = s.mix(s.mr(n1.outputs['Fac'], 0.3, 0.7), tuple(c * 0.65 for c in base), tuple(c * 1.4 for c in base))
    col = s.mix(s.mr(n3.outputs['Fac'], 0.4, 0.7), col, tuple(c * 0.75 for c in base))
    s.put(s.mix(pud, col, tuple(c * 0.45 for c in base)), p.inputs['Base Color'])
    s.put(s.mix(pud, 0.62, 0.3, 'FLOAT'), p.inputs['Roughness'])
    p.inputs['Coat IOR'].default_value = 1.33
    s.put(s.mix(pud, s.mr(n3.outputs['Fac'], 0.3, 0.7, 0.55, 0.95), 1.0, 'FLOAT'), p.inputs['Coat Weight'])
    s.put(s.mix(pud, s.mr(n1.outputs['Fac'], 0.3, 0.7, 0.06, 0.20), 0.012, 'FLOAT'), p.inputs['Coat Roughness'])
    agg = s.m('MULTIPLY', vor.outputs['Distance'], s.m('SUBTRACT', 1.0, pud))
    nn = s.bump(agg, 0.5, 0.004)
    s.put(nn, p.inputs['Normal'])
    s.put(s.bump(s.m('MULTIPLY', agg, 0.25), 0.15, 0.002), p.inputs['Coat Normal'])
    return m


def mat_slabs(name='Sidewalk', base=(0.085, 0.083, 0.08), slab=(1.2, 1.2), wet=0.45):
    """Wet concrete paving slabs with dark joints (object XY)."""
    if _get(name):
        return _get(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    jx = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('DIVIDE', X, slab[0])), 0.5)), 0.49, 0.497)
    jy = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('DIVIDE', Y, slab[1])), 0.5)), 0.49, 0.497)
    joint = s.m('MAXIMUM', jx, jy)
    n1 = s.tex('ShaderNodeTexNoise', co, Scale=1.3, Detail=8.0)
    n2 = s.tex('ShaderNodeTexNoise', co, Scale=0.35, Detail=4.0)
    wetm = s.mr(n2.outputs['Fac'], 0.5 - wet * 0.1, 0.56 - wet * 0.1)
    col = s.mix(s.mr(n1.outputs['Fac'], 0.3, 0.7), tuple(c * 0.7 for c in base), tuple(c * 1.25 for c in base))
    col = s.mix(wetm, col, tuple(c * 0.5 for c in base))
    col = s.mix(joint, col, (0.01, 0.01, 0.01))
    s.put(col, p.inputs['Base Color'])
    s.put(s.mix(wetm, 0.55, 0.06, 'FLOAT'), p.inputs['Roughness'])
    s.put(s.bump(s.m('MULTIPLY', joint, -1.0), 0.6, 0.006), p.inputs['Normal'])
    return m


def mat_stone(name='Granite', base=(0.035, 0.034, 0.036), rough=(0.18, 0.4), speck=0.3, scale=1.0):
    """Polished dark stone with speckle and soft cloudy variation."""
    if _get(name):
        return _get(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    n1 = s.tex('ShaderNodeTexNoise', co, Scale=1.5 * scale, Detail=8.0, Roughness=0.6)
    vor = s.tex('ShaderNodeTexVoronoi', co, Scale=90.0 * scale)
    sp = s.mr(vor.outputs['Distance'], 0.08, 0.02)
    col = s.mix(s.mr(n1.outputs['Fac'], 0.3, 0.7), tuple(c * 0.7 for c in base), tuple(c * 1.3 for c in base))
    col = s.mix(s.m('MULTIPLY', sp, speck), col, tuple(min(1, c * 3.0) for c in base))
    s.put(col, p.inputs['Base Color'])
    s.put(s.mr(n1.outputs['Fac'], 0.3, 0.7, rough[0], rough[1]), p.inputs['Roughness'])
    return m


def mat_tiles(name='TunnelTile', base=(0.42, 0.40, 0.32), tile=(0.30, 0.15)):
    """Glazed tunnel tiles (object X along, Z up) with grout and road grime toward the floor."""
    if _get(name):
        return _get(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    U = s.m('ADD', X, Y)
    row = s.m('FLOOR', s.m('DIVIDE', Z, tile[1]))
    off = s.m('MULTIPLY', s.m('MODULO', row, 2.0), 0.5)
    gx = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('ADD', s.m('DIVIDE', U, tile[0]), off)), 0.5)), 0.47, 0.49)
    gz = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('DIVIDE', Z, tile[1])), 0.5)), 0.44, 0.47)
    grout = s.m('MAXIMUM', gx, gz)
    n1 = s.tex('ShaderNodeTexNoise', co, Scale=0.8, Detail=6.0)
    grime = s.m('MAXIMUM', s.mr(Z, 1.6, 0.2), s.mr(n1.outputs['Fac'], 0.55, 0.75))
    col = s.mix(grime, base, tuple(c * 0.22 for c in base))
    col = s.mix(grout, col, (0.03, 0.028, 0.025))
    s.put(col, p.inputs['Base Color'])
    s.put(s.mix(s.m('MAXIMUM', grout, s.m('MULTIPLY', grime, 0.6)), 0.12, 0.6, 'FLOAT'), p.inputs['Roughness'])
    s.put(s.bump(s.m('MULTIPLY', grout, -1.0), 0.5, 0.004), p.inputs['Normal'])
    return m


def mat_window_glass(name='WinGlass', tint=(0.80, 0.85, 0.82), refl=0.12):
    """Thin pane: straight-through transparency + Fresnel glossy reflection (no refraction)."""
    if _get(name):
        return _get(name)
    m = new_mat(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    s = SB(m)
    tr = s.node('ShaderNodeBsdfTransparent', Color=tint)
    gl = s.node('ShaderNodeBsdfGlossy', Color=(1, 1, 1), Roughness=0.02)
    lw = s.node('ShaderNodeLayerWeight', Blend=0.25)
    fac = s.m('ADD', lw.outputs['Fresnel'], refl, clamp=True)
    mx = s.node('ShaderNodeMixShader')
    s.put(fac, mx.inputs[0])
    s.L.new(tr.outputs[0], mx.inputs[1])
    s.L.new(gl.outputs[0], mx.inputs[2])
    s.L.new(mx.outputs[0], s.out().inputs['Surface'])
    return m


def mat_room(name='Room', strength=2.2, warm=kelvin(3100), cool=(0.62, 0.86, 1.0), dark_frac=0.18, cool_frac=0.33):
    """Office interior seen through a window: per-window data in UV 'WinData' (u, v random).
    Ceiling-light gradient, venetian blinds on some, desk/partition silhouettes, a few dark rooms."""
    if _get(name):
        return _get(name)
    m = new_mat(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    s = SB(m)
    uvn = s.node('ShaderNodeUVMap')
    uvn.uv_map = 'UVMap'
    wdn = s.node('ShaderNodeUVMap')
    wdn.uv_map = 'WinData'
    U, V, _ = s.sep(uvn.outputs[0])
    r1, r2, _ = s.sep(wdn.outputs[0])
    wn = s.tex('ShaderNodeTexWhiteNoise', s.comb(r1, r2, 0.37), {'noise_dimensions': '3D'})
    r3, r4, r5 = s.sep(wn.outputs['Color'])
    lit = s.m('GREATER_THAN', r1, dark_frac)
    col = s.mix(s.m('GREATER_THAN', r2, 1.0 - cool_frac), warm, cool)
    inten = s.mr(r3, 0.0, 1.0, 0.35, 1.0)
    # ceiling light gradient (brighter toward the top), soft vertical falloff at the sides
    grad = s.mr(V, 0.15, 0.95, 0.45, 1.0)
    side = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', U, s.mr(r4, 0, 1, 0.35, 0.65))), 0.2, 0.62, 1.0, 0.7)
    # blinds: venetian slats lowered from the top to a random depth on ~45% of windows
    has_bl = s.m('GREATER_THAN', r4, 0.55)
    cover = s.mr(r5, 0.0, 1.0, 0.25, 0.95)
    bl_zone = s.m('GREATER_THAN', V, s.m('SUBTRACT', 1.0, cover))
    slats = s.mr(s.m('ABSOLUTE', s.m('SINE', s.m('MULTIPLY', V, 95.0))), 0.0, 1.0, 0.35, 0.95)
    bl = s.m('MULTIPLY', has_bl, bl_zone)
    blinds = s.mix(bl, 1.0, s.m('MULTIPLY', slats, 0.75), 'FLOAT')
    # silhouettes: desk/partition band near the bottom, an occasional column or plant at a random x
    desk = s.m('LESS_THAN', V, s.mr(r3, 0, 1, 0.10, 0.28))
    deskd = s.mix(desk, 1.0, 0.25, 'FLOAT')
    colx = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', U, r5)), 0.03, 0.05, 0.15, 1.0)
    colm = s.mix(s.m('GREATER_THAN', r2, 0.7), 1.0, colx, 'FLOAT')
    k = s.mul(lit, inten, grad, side, blinds, deskd, colm, strength)
    k = s.m('ADD', k, s.m('MULTIPLY', s.m('SUBTRACT', 1.0, lit), 0.015 * strength))
    em = s.node('ShaderNodeEmission')
    s.put(col, em.inputs['Color'])
    s.put(k, em.inputs['Strength'])
    s.L.new(em.outputs[0], s.out().inputs['Surface'])
    no_emit_sampling(m)
    return m


def mat_facade(name, seed=0.0, bay=3.0, floor=3.4, ww=0.62, wh=0.52, sill=0.30, lit=0.45,
               wall=(0.05, 0.045, 0.04), wall_rough=0.75, ground=4.6, strength=1.6, cool_frac=0.3,
               shop=True, shop_strength=1.2):
    """Cheap building facade on a box: window grid with random lit/dark/warm/cool rooms (object coords,
    u = x + y so both street and end faces get windows), shopfronts below `ground`."""
    if _get(name):
        return _get(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    Uc = s.m('ADD', X, Y)
    cu = s.m('DIVIDE', Uc, bay)
    cv = s.m('DIVIDE', s.m('SUBTRACT', Z, ground), floor)
    iu, iv = s.m('FLOOR', cu), s.m('FLOOR', cv)
    fu, fv = s.m('FRACT', cu), s.m('FRACT', cv)
    e = 0.012
    wx = s.band(fu, (1 - ww) / 2, (1 + ww) / 2, e)
    wz = s.band(fv, sill, sill + wh, e * 2)
    above = s.mr(Z, ground - 0.05, ground + 0.05)
    mask = s.mul(wx, wz, above)
    wn = s.tex('ShaderNodeTexWhiteNoise', s.comb(iu, iv, seed), {'noise_dimensions': '3D'})
    r1, r2, r3 = s.sep(wn.outputs['Color'])
    islit = s.m('GREATER_THAN', wn.outputs['Value'], 1.0 - lit)
    col = s.mix(s.m('GREATER_THAN', r2, 1.0 - cool_frac), kelvin(3000), (0.65, 0.85, 1.0))
    inten = s.mr(r3, 0, 1, 0.25, 1.0)
    fvl = s.mr(fv, sill, sill + wh)
    grad = s.mr(fvl, 0.0, 1.0, 0.5, 1.0)
    bl = s.m('MULTIPLY', s.m('GREATER_THAN', r1, 0.6),
             s.m('GREATER_THAN', fvl, s.mr(r3, 0, 1, 0.3, 0.9)))
    slat = s.mr(s.m('ABSOLUTE', s.m('SINE', s.m('MULTIPLY', fv, 110.0))), 0, 1, 0.3, 0.9)
    blf = s.mix(bl, 1.0, slat, 'FLOAT')
    k = s.mul(mask, islit, inten, grad, blf, strength)
    emi = s.cmul(col, s.comb(k, k, k))
    # shopfronts: wide bays with lit interiors, dark fascia above
    if shop:
        sc = s.m('DIVIDE', s.m('ADD', Uc, seed * 7.0), 6.5)
        su, sfu = s.m('FLOOR', sc), s.m('FRACT', sc)
        sw = s.mul(s.band(sfu, 0.08, 0.92, 0.01), s.band(Z, 0.45, ground - 1.25, 0.02))
        sn = s.tex('ShaderNodeTexWhiteNoise', s.comb(su, seed, 3.0), {'noise_dimensions': '3D'})
        s1, s2, s3 = s.sep(sn.outputs['Color'])
        slit = s.m('GREATER_THAN', s1, 0.35)
        scol = s.mix(s.m('GREATER_THAN', s2, 0.55), kelvin(2900), (0.7, 0.9, 1.0))
        scol = s.mix(s.m('GREATER_THAN', s3, 0.85), scol, (1.0, 0.25, 0.45))
        sk = s.mul(sw, slit, s.mr(Z, 0.45, ground - 1.25, 1.0, 0.55), shop_strength, s.mr(s2, 0, 1, 0.4, 1.0))
        emi = s.mix(1.0, emi, s.cmul(scol, s.comb(sk, sk, sk)), 'RGBA', 'ADD')
        mask = s.m('MAXIMUM', mask, sw)
    n1 = s.tex('ShaderNodeTexNoise', co, Scale=0.25, Detail=6.0)
    n2 = s.tex('ShaderNodeTexNoise', co, Scale=4.0, Detail=4.0)
    wcol = s.mix(s.mr(n1.outputs['Fac'], 0.3, 0.7), tuple(c * 0.6 for c in wall), tuple(c * 1.3 for c in wall))
    wcol = s.mix(s.mr(n2.outputs['Fac'], 0.45, 0.7), wcol, tuple(c * 0.7 for c in wall))
    ledge = s.mul(s.band(fv, 0.0, 0.05, 0.01), above)
    wcol = s.mix(ledge, wcol, tuple(min(1, c * 1.6) for c in wall))
    s.put(s.mix(mask, wcol, (0.006, 0.007, 0.008)), p.inputs['Base Color'])
    s.put(s.mix(mask, wall_rough, 0.06, 'FLOAT'), p.inputs['Roughness'])
    s.put(emi, p.inputs['Emission Color'])
    p.inputs['Emission Strength'].default_value = 1.0
    s.put(s.bump(s.m('SUBTRACT', ledge, mask), 0.5, 0.06), p.inputs['Normal'])
    no_emit_sampling(m)
    return m


def mat_hazard(name='Hazard'):
    if _get(name):
        return _get(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    X, Y, Z = s.sep(s.coords())
    st = s.m('GREATER_THAN', s.m('FRACT', s.m('DIVIDE', s.m('ADD', s.m('ADD', X, Y), Z), 0.25)), 0.5)
    s.put(s.mix(st, (0.45, 0.30, 0.0), (0.01, 0.01, 0.01)), p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.5
    return m


# ============================================================================ the car

CAR = dict(xf=2.38, xr=-2.40, xa_f=1.43, xa_r=-1.42, track=0.775, R=0.335, wheelbase=2.85)


def _w(x):
    if x > 2.05:
        return 0.93 - 0.05 * ((x - 2.05) / 0.33) ** 2
    if x < -2.05:
        return 0.93 - 0.045 * ((-2.05 - x) / 0.35) ** 2
    return 0.93


def _zb(x):
    if x > 1.95:
        return 0.25 + 0.10 * (x - 1.95) / 0.43
    if x < -1.90:
        return 0.25 + 0.12 * (-1.90 - x) / 0.50
    return 0.25


def _zbelt(x):
    return 0.868 - 0.018 * x / 2.4


def _ztop(x):
    zl = _zbelt(x)
    if x > 0.72:
        return zl - 0.004 - 0.035 * max(0.0, (x - 2.18) / 0.20) ** 2
    if x < -1.45:
        return zl + 0.012 - 0.03 * max(0.0, (-2.25 - x) / 0.15) ** 2
    return zl


def _section(x):
    w, zb, zl, zt = _w(x), _zb(x), _zbelt(x), _ztop(x)
    zc = 0.63
    return [(0.0, zb), (w - 0.16, zb), (w - 0.07, zb + 0.01), (w - 0.025, zb + 0.04), (w - 0.006, zb + 0.10),
            (w, zc - 0.10), (w + 0.006, zc - 0.012), (w + 0.007, zc), (w + 0.002, zc + 0.012),
            (w - 0.006, zl - 0.07), (w - 0.013, zl - 0.028), (w - 0.026, zl - 0.004), (w - 0.05, zt + 0.006),
            (w - 0.22, zt + 0.011), (w * 0.45, zt + 0.015), (0.0, zt + 0.016)]


def _body_shell(mats, coll):
    xs = [-2.40, -2.397, -2.39, -2.375, -2.35, -2.31, -2.26, -2.19, -2.10, -2.0]
    xs += [-1.88 + 0.125 * i for i in range(31)]
    xs = [x for x in xs if x < 1.96] + [2.0, 2.08, 2.15, 2.21, 2.26, 2.30, 2.335, 2.36, 2.373, 2.38]
    bm = bmesh.new()
    rings = []
    for x in xs:
        half = _section(x)
        ring = half + [(-y, z) for (y, z) in reversed(half[1:-1])]
        rings.append([bm.verts.new((x, y, z)) for y, z in ring])
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for j in range(n):
            j2 = (j + 1) % n
            bm.faces.new((a[j], a[j2], b[j2], b[j]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    body = obj_bm('CarShell', bm, [mats['paint']], coll)
    # wheel wells: boolean with short cylinders on each side (inner wall closes the well)
    cb = bmesh.new()
    for xa in (CAR['xa_f'], CAR['xa_r']):
        for sgn in (1, -1):
            res = bmesh.ops.create_cone(cb, cap_ends=True, segments=56, radius1=0.405, radius2=0.405, depth=0.44)
            mtx = Matrix.Translation((xa, sgn * 0.84, 0.355)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
            bmesh.ops.transform(cb, matrix=mtx, verts=res['verts'])
    cutter = obj_bm('WellCutter', cb, [mats['well']], coll)
    md = body.modifiers.new('Wells', 'BOOLEAN')
    md.operation = 'DIFFERENCE'
    md.object = cutter
    try:
        md.solver = 'EXACT'
        md.material_mode = 'TRANSFER'
    except Exception:
        pass
    apply_mods(body)
    bpy.data.objects.remove(cutter)
    bevel(body, 0.012, 2, angle=50, harden=False)
    apply_mods(body)
    smooth_angle(body, 34)
    return body


def cab_xform(x, y, z):
    """Greenhouse shaping: windshield/backlight wrap in plan, roof crown, tumblehome."""
    yy = (y / 0.86) ** 2
    x = x - 0.075 * yy * smoothstep(-0.30, 0.05, x) + 0.045 * yy * smoothstep(-0.85, -1.10, x)
    z = z + 0.028 * (1 - yy) * smoothstep(1.24, 1.34, z)
    y = y * (1 - 0.21 * (z - 0.87) / 0.5)
    return Vector((x, y, z))


CAB_PROF = [(0.74, None), (0.32, 1.118), (-0.08, 1.343), (-0.19, 1.370), (-0.55, 1.383), (-0.92, 1.377),
            (-1.03, 1.352), (-1.25, 1.125), (-1.47, None)]


def _cab_prof():
    return [(x, (z if z is not None else _zbelt(x) - 0.003)) for x, z in CAB_PROF]


def _cabin(mats, coll, open_window=True):
    prof = _cab_prof()
    ys = [-0.86, -0.84, -0.78, -0.62, -0.40, -0.14, 0.14, 0.40, 0.62, 0.78, 0.84, 0.86]
    bm = bmesh.new()
    rings = [[bm.verts.new((x, y, z)) for x, z in prof] for y in ys]
    n = len(prof)
    loft = []
    for (ya, a), (yb, b) in zip(zip(ys, rings), zip(ys[1:], rings[1:])):
        for j in range(n):
            j2 = (j + 1) % n
            f = bm.faces.new((a[j], a[j2], b[j2], b[j]))
            f.material_index = 1 if (j in (0, 1, 6, 7) and abs((ya + yb) / 2) < 0.80) else 0
            loft.append(f)
    capL = bm.faces.new(rings[-1])
    capR = bm.faces.new(list(reversed(rings[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # split the side caps into window / pillar regions
    p0, p2 = Vector((prof[0][0], 0, prof[0][1])), Vector((prof[2][0], 0, prof[2][1]))
    d = (p2 - p0).normalized()
    nin = Vector((-d.z, 0, d.x))
    if nin.x > 0:
        nin = -nin
    planes = [((-0.38, 0, 0), (1, 0, 0)), ((-0.46, 0, 0), (1, 0, 0)), ((-0.985, 0, 0), (1, 0, 0)),
              ((0, 0, 1.30), (0, 0, 1)), ((0, 0, 0.905), (0, 0, 1)), (tuple(p0 + nin * 0.07), tuple(nin))]

    def side_faces():
        bm.normal_update()
        return [f for f in bm.faces if abs(f.normal.y) > 0.9 and abs(f.calc_center_median().y) > 0.84]
    for co, no in planes:
        fs = side_faces()
        geom = list(set(fs) | {e for f in fs for e in f.edges} | {v for f in fs for v in f.verts})
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no)
    # material classes: 0 paint, 1 glass, 2 satin black
    a_pt = p0 + nin * 0.07
    kill = []
    bm.normal_update()
    for f in bm.faces:
        c = f.calc_center_median()
        nrm = f.normal
        if abs(nrm.y) > 0.9 and abs(c.y) > 0.84:
            if c.z > 1.30 or c.z < 0.905 or c.x < -0.985:
                f.material_index = 0
            elif (c - a_pt).dot(nin) < 0:
                f.material_index = 0
            elif -0.46 < c.x < -0.38:
                f.material_index = 2
            else:
                f.material_index = 1
                if open_window and c.y < 0 and c.x < -0.46:
                    kill.append(f)
    if kill:
        bmesh.ops.delete(bm, geom=kill, context='FACES_ONLY')
    for v in bm.verts:
        v.co = cab_xform(v.co.x, v.co.y, v.co.z)
    o = obj_bm('CarCabin', bm, [mats['paint'], mats['glass'], mats['satin']], coll, smooth=30)
    return o


def _cab_side_pt(x, z, side, out=0.004):
    """Point on the greenhouse side surface (before tumblehome y=0.86), pushed outward."""
    p = cab_xform(x, side * 0.86, z)
    return p + Vector((0, side * out, 0))


def _details(mats, coll, plate_text='TMB 417', open_window=True):
    """Chrome, lamps, grille, bumpers, trims, mirrors, interior: one mesh, many material slots."""
    order = ['chrome', 'satin', 'head', 'tail', 'amber', 'dark', 'plate', 'interior', 'glass', 'paint', 'white']
    MI = {k: i for i, k in enumerate(order)}
    bm = bmesh.new()
    zc = 0.42
    # ---------------------------------------------------------------- bumpers
    sec = rrect(0.10, 0.17, 0.035, 3)
    fp = spline([(2.20, -0.955, zc), (2.37, -0.935, zc), (2.45, -0.86, zc), (2.475, -0.6, zc), (2.48, 0, zc),
                 (2.475, 0.6, zc), (2.45, 0.86, zc), (2.37, 0.935, zc), (2.20, 0.955, zc)], 8)
    sweep(bm, fp, sec, mi=MI['chrome'])
    rp = spline([(-2.22, 0.955, zc + 0.02), (-2.39, 0.935, zc + 0.02), (-2.47, 0.86, zc + 0.02),
                 (-2.495, 0.6, zc + 0.02), (-2.50, 0, zc + 0.02), (-2.495, -0.6, zc + 0.02), (-2.47, -0.86, zc + 0.02),
                 (-2.39, -0.935, zc + 0.02), (-2.22, -0.955, zc + 0.02)], 8)
    sweep(bm, rp, sec, mi=MI['chrome'])
    # rubber guards on bumper faces
    for x, sgn in ((2.535, 1), (-2.555, -1)):
        for y in (-0.42, 0.42):
            bm_box(bm, (x, y, zc - 0.005 + (0.02 if sgn < 0 else 0)), (0.03, 0.06, 0.15), MI['satin'])
    # ---------------------------------------------------------------- front: grille + quad headlamps
    xf = CAR['xf']
    bm_box(bm, (xf - 0.01, 0, 0.62), (0.03, 0.74, 0.29), MI['dark'])
    for k in range(7):
        bm_box(bm, (xf + 0.009, 0, 0.495 + k * 0.042), (0.012, 0.72, 0.011), MI['chrome'])
    for y in (-0.24, -0.12, 0.0, 0.12, 0.24):
        bm_box(bm, (xf + 0.011, y, 0.62), (0.012, 0.010, 0.27), MI['chrome'])
    for (c, s_) in (((xf + 0.012, 0, 0.765), (0.02, 0.76, 0.018)), ((xf + 0.012, 0, 0.475), (0.02, 0.76, 0.018)),
                    ((xf + 0.012, 0.372, 0.62), (0.02, 0.018, 0.30)), ((xf + 0.012, -0.372, 0.62), (0.02, 0.018, 0.30))):
        bm_box(bm, c, s_, MI['chrome'])
    for sgn in (1, -1):
        yc = sgn * 0.61
        bm_box(bm, (xf - 0.004, yc, 0.655), (0.022, 0.46, 0.20), MI['dark'])
        for yy in (sgn * 0.505, sgn * 0.715):
            bm_box(bm, (xf + 0.004, yy, 0.655), (0.012, 0.185, 0.14), MI['head'])
        for (c, s_) in (((xf + 0.012, yc, 0.755), (0.022, 0.47, 0.022)), ((xf + 0.012, yc, 0.555), (0.022, 0.47, 0.022)),
                        ((xf + 0.012, yc + 0.226, 0.655), (0.022, 0.022, 0.22)), ((xf + 0.012, yc - 0.226, 0.655), (0.022, 0.022, 0.22)),
                        ((xf + 0.012, yc, 0.655), (0.022, 0.016, 0.20))):
            bm_box(bm, c, s_, MI['chrome'])
        bm_box(bm, (xf + 0.004, yc, 0.515), (0.012, 0.44, 0.045), MI['amber'])
        # side marker lamps
        bm_box(bm, (2.16, sgn * (_w(2.16) + 0.002), 0.56), (0.12, 0.012, 0.04), MI['amber'])
        bm_box(bm, (-2.18, sgn * (_w(-2.18) + 0.002), 0.60), (0.12, 0.012, 0.04), MI['tail'])
    # ---------------------------------------------------------------- rear: full-width tail-light bar
    xr = CAR['xr']
    bm_box(bm, (xr - 0.006, 0, 0.72), (0.014, 1.68, 0.16), MI['tail'])
    for (c, s_) in (((xr - 0.012, 0, 0.805), (0.02, 1.71, 0.02)), ((xr - 0.012, 0, 0.635), (0.02, 1.71, 0.02)),
                    ((xr - 0.012, 0.85, 0.72), (0.02, 0.02, 0.19)), ((xr - 0.012, -0.85, 0.72), (0.02, 0.02, 0.19))):
        bm_box(bm, c, s_, MI['chrome'])
    for y in (-0.56, -0.28, 0.28, 0.56):
        bm_box(bm, (xr - 0.012, y, 0.72), (0.016, 0.012, 0.16), MI['chrome'])
    bm_box(bm, (xr - 0.013, 0, 0.72), (0.014, 0.50, 0.012), MI['chrome'])
    # plate recess + plate
    bm_box(bm, (xr - 0.002, 0, 0.58), (0.012, 0.56, 0.13), MI['dark'])
    bm_box(bm, (xr - 0.010, 0, 0.58), (0.008, 0.52, 0.11), MI['plate'])
    bm_box(bm, (2.53, 0, 0.42), (0.008, 0.52, 0.11), MI['plate'])
    # exhaust tip
    res = bmesh.ops.create_cone(bm, cap_ends=False, segments=16, radius1=0.032, radius2=0.032, depth=0.16)
    bmesh.ops.transform(bm, matrix=Matrix.Translation((-2.43, 0.55, 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'),
                        verts=res['verts'])
    for f in {f for v in res['verts'] for f in v.link_faces}:
        f.material_index = MI['chrome']
    # ---------------------------------------------------------------- side trims
    for sgn in (1, -1):
        # belt chrome
        xs = [2.25 - 0.1 * i for i in range(46)]
        path = [(x, sgn * (_w(x) - 0.028), _zbelt(x) - 0.002) for x in xs]
        if sgn < 0:
            path = list(reversed(path))
        sweep(bm, path, rrect(0.016, 0.014, 0.006, 2), mi=MI['chrome'])
        # body-side rub strip (rubber with chrome insert), interrupted at the arches
        for x0, x1 in ((-2.33, -1.80), (-1.04, 1.05), (1.81, 2.30)):
            xs = [x0 + (x1 - x0) * i / 10 for i in range(11)]
            pth = [(x, sgn * (_w(x) + 0.006), 0.545) for x in xs]
            if sgn > 0:
                pth = list(reversed(pth))
            sweep(bm, pth, rrect(0.016, 0.04, 0.007, 2), mi=MI['satin'])
            pth2 = [(p[0], p[1] + sgn * 0.009, p[2]) for p in pth]
            sweep(bm, pth2, rrect(0.006, 0.008, 0.003, 1), mi=MI['chrome'])
        # rocker chrome
        pth = [(x, sgn * 0.935, 0.30) for x in [-1.0 + 0.2 * i for i in range(11)]]
        if sgn > 0:
            pth = list(reversed(pth))
        sweep(bm, pth, rrect(0.012, 0.05, 0.006, 2), mi=MI['chrome'])
        # wheel-arch lip mouldings
        for xa in (CAR['xa_f'], CAR['xa_r']):
            pth = []
            for k in range(29):
                a = math.radians(-12 + 204 * k / 28)
                pth.append((xa + 0.412 * math.cos(a), sgn * 0.937, 0.355 + 0.412 * math.sin(a)))
            sweep(bm, pth, rrect(0.024, 0.016, 0.006, 2), up=(0, 1, 0), mi=MI['chrome'])
        # drip rail + A-pillar + window surround chrome on the greenhouse
        prof = _cab_prof()
        p0, p2 = Vector((prof[0][0], 0, prof[0][1])), Vector((prof[2][0], 0, prof[2][1]))
        drip = [_cab_side_pt(x, 1.305, sgn, 0.006) for x in [0.0 - 0.1 * i for i in range(11)]]
        a_line = [_cab_side_pt(p0.x + (p2.x - p0.x) * t, p0.z + (p2.z - p0.z) * t, sgn, 0.006)
                  for t in [0.92 * i / 8 for i in range(9)]]
        sweep(bm, a_line + drip[1:], rrect(0.014, 0.014, 0.005, 2), up=(0, 0, 1), mi=MI['chrome'])
        sweep(bm, [_cab_side_pt(x, 0.908, sgn, 0.006) for x in [0.66 - 0.1 * i for i in range(17)]],
              rrect(0.012, 0.012, 0.005, 2), mi=MI['chrome'])
        # door handles, mirror
        for xh in (0.18, -0.86):
            bm_box(bm, (xh, sgn * (_w(xh) - 0.0), 0.79), (0.13, 0.016, 0.026), MI['chrome'])
        mc = Vector((0.60, sgn * 1.0, 0.955))
        res = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=0.05)
        bmesh.ops.transform(bm, matrix=Matrix.Translation(mc) @ Matrix.Diagonal((1.6, 0.9, 0.8, 1.0)), verts=res['verts'])
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.material_index = MI['chrome']
        bm_box(bm, (0.62, sgn * 0.95, 0.915), (0.03, 0.09, 0.02), MI['chrome'])
    # windshield + backlight surrounds
    prof = _cab_prof()
    for (xa, za), (xb, zb_) in ((prof[0], prof[2]), (prof[6], prof[8])):
        for t in (0.0, 1.0):
            x = xa + (xb - xa) * t
            z = za + (zb_ - za) * t
            pth = [cab_xform(x, y, z) for y in [-0.80 + 0.1 * i for i in range(17)]]
            out = Vector((1 if xa > 0 else -1, 0, 0.6)).normalized() * 0.004
            sweep(bm, [p + out for p in pth], rrect(0.014, 0.014, 0.005, 2), up=(0, 0, 1), mi=MI['chrome'])
    # wipers (parked on the cowl)
    for y0 in (-0.05, 0.62):
        pth = [cab_xform(0.70, y, _zbelt(0.70) + 0.01) + Vector((0.02, 0, 0.01)) for y in (y0 - 0.52, y0)]
        sweep(bm, pth, rrect(0.012, 0.012, 0.004, 1), mi=MI['satin'])
    # antenna on the right front fender
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.004, radius2=0.002, depth=0.75)
    bmesh.ops.transform(bm, matrix=Matrix.Translation((1.55, -0.86, 0.86 + 0.375)) @ Matrix.Rotation(-0.25, 4, 'Y'),
                        verts=res['verts'])
    for f in {f for v in res['verts'] for f in v.link_faces}:
        f.material_index = MI['chrome']
    # ---------------------------------------------------------------- interior (dark silhouettes)
    bm_box(bm, (0.40, 0, 0.90), (0.22, 1.40, 0.10), MI['interior'])            # dash
    bm_box(bm, (-0.15, 0, 0.62), (0.55, 1.50, 0.25), MI['interior'])           # front bench
    bm_box(bm, (-0.38, 0, 0.92), (0.12, 1.45, 0.55), MI['interior'], rot=Matrix.Rotation(-0.25, 3, 'Y'))
    for yy in (-0.42, 0.42):
        bm_box(bm, (-0.47, yy, 1.24), (0.10, 0.26, 0.16), MI['interior'])
    bm_box(bm, (-0.95, 0, 0.62), (0.50, 1.50, 0.25), MI['interior'])           # rear bench
    bm_box(bm, (-1.13, 0, 0.90), (0.12, 1.45, 0.50), MI['interior'], rot=Matrix.Rotation(-0.30, 3, 'Y'))
    bm_box(bm, (-1.25, 0, 0.955), (0.16, 1.45, 0.03), MI['interior'])          # parcel shelf
    res = bmesh.ops.create_cone(bm, cap_ends=False, segments=24, radius1=0.19, radius2=0.19, depth=0.03)
    bmesh.ops.transform(bm, matrix=Matrix.Translation((0.32, 0.38, 1.0)) @ Matrix.Rotation(math.radians(62), 4, 'Y'),
                        verts=res['verts'])
    for f in {f for v in res['verts'] for f in v.link_faces}:
        f.material_index = MI['interior']
    o = obj_bm('CarDetail', bm, [mats[k] for k in order], coll, smooth=40)
    # plate text (fictional)
    if plate_text:
        t = text_mesh(plate_text, 'CarPlateTxt', size=0.075, extrude=0.0015, coll=coll)
        t.rotation_euler = (math.pi / 2, 0, -math.pi / 2)
        t.location = (xr - 0.0145, 0, 0.578)
        set_mat(t, mats['platetxt'])
        t2 = text_mesh(plate_text, 'CarPlateTxtF', size=0.075, extrude=0.0015, coll=coll)
        t2.rotation_euler = (math.pi / 2, 0, math.pi / 2)
        t2.location = (2.5345, 0, 0.418)
        set_mat(t2, mats['platetxt'])
        return o, [t, t2]
    return o, []


def _wheel_mesh(name, side, mats, coll):
    bm = bmesh.new()
    tyre = [(0.19, -0.098), (0.235, -0.104), (0.275, -0.108), (0.305, -0.106), (0.324, -0.098), (0.332, -0.085),
            (0.335, -0.07), (0.335, -0.042), (0.328, -0.038), (0.328, -0.030), (0.335, -0.026), (0.335, 0.026),
            (0.328, 0.030), (0.328, 0.038), (0.335, 0.042), (0.335, 0.07), (0.332, 0.085), (0.324, 0.098),
            (0.305, 0.106), (0.275, 0.108), (0.235, 0.104), (0.19, 0.098)]
    bm_revolve(bm, tyre, 64, mi=0, closed=True)
    bm_revolve(bm, [(0.186, 0.05), (0.192, 0.088), (0.200, 0.100), (0.205, 0.096), (0.199, 0.086)], 48, mi=1)
    bm_revolve(bm, [(0.192, 0.082), (0.178, 0.078), (0.155, 0.080), (0.125, 0.088), (0.095, 0.095), (0.07, 0.100),
                    (0.058, 0.106), (0.048, 0.114), (0.032, 0.119), (0.004, 0.121)], 48, mi=1)
    bm_revolve(bm, [(0.188, 0.02), (0.004, 0.02)], 32, mi=2)
    for k in range(10):
        a = 2 * math.pi * k / 10
        rot = Matrix.Rotation(-a, 3, 'Y')
        c = rot @ Vector((0.125, 0.092, 0.0))
        bm_box(bm, c, (0.05, 0.012, 0.022), mi=2, rot=rot)
    for k in range(5):
        a = 2 * math.pi * k / 5 + 0.3
        c = Vector((0.072 * math.cos(a), 0.104, 0.072 * math.sin(a)))
        bm_box(bm, c, (0.014, 0.012, 0.014), mi=1)
    if side < 0:
        for v in bm.verts:
            v.co.y = -v.co.y
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return obj_bm(name, bm, [mats['tyre'], mats['chrome'], mats['dark']], coll, smooth=42)


def car_materials(paint_color=None):
    mats = dict(
        paint=mat_carpaint('CarPaint', color=paint_color or (0.0045, 0.005, 0.006)),
        well=mat_principled('WellBlack', color=(0.006, 0.006, 0.006), rough=0.85),
        glass=mat_carglass(),
        satin=mat_principled('SatinBlack', color=(0.008, 0.008, 0.009), rough=0.42),
        chrome=mat_chrome(),
        head=mat_lens('HeadLens', emit=(1.0, 0.86, 0.66), strength=5.0, base=(0.6, 0.6, 0.6), pattern='grid', scale=160.0),
        tail=mat_lens('TailLens', emit=(1.0, 0.02, 0.008), strength=4.0, base=(0.22, 0.004, 0.003), pattern='ribs', scale=120.0),
        amber=mat_principled('AmberLens', color=(0.35, 0.10, 0.0), rough=0.1, coat=1.0, emit=(1.0, 0.35, 0.0), emit_strength=0.25),
        dark=mat_principled('DarkPlastic', color=(0.01, 0.01, 0.011), rough=0.5),
        plate=mat_principled('Plate', color=(0.55, 0.52, 0.42), rough=0.4),
        platetxt=mat_principled('PlateTxt', color=(0.02, 0.03, 0.08), rough=0.4),
        interior=mat_principled('Interior', color=(0.012, 0.011, 0.010), rough=0.8),
        white=mat_principled('RevLens', color=(0.7, 0.7, 0.7), rough=0.1),
        tyre=mat_rubber('Tyre', color=(0.014, 0.014, 0.015), rough=0.65),
    )
    return mats


def build_car(name='Getaway', coll=None, open_window=True, plate='TMB 417', lights=True, head_energy=180.0,
              tail_energy=6.0, paint_color=None):
    """Returns dict(root, body, wheels[{pivot, wheel, front}], parts, mats, head_lights, tail_light,
    window_local, window_out)."""
    mats = car_materials(paint_color)
    root = empty(name, (0, 0, 0), coll, size=1.0)
    body = empty(name + '_body', (0, 0, 0), coll, size=0.5)
    parent(body, root, keep=False)
    shell = _body_shell(mats, coll)
    cab = _cabin(mats, coll, open_window)
    det, txt = _details(mats, coll, plate, open_window)
    parts = [shell, cab, det] + txt
    for p in parts:
        parent(p, body, keep=False)
    wl = _wheel_mesh(name + '_wheelL', 1, mats, coll)
    wr = _wheel_mesh(name + '_wheelR', -1, mats, coll)
    wheels = []
    for xa, front in ((CAR['xa_f'], True), (CAR['xa_r'], False)):
        for sgn, src in ((1, wl), (-1, wr)):
            pv = empty(f'{name}_pivot{"F" if front else "R"}{"L" if sgn > 0 else "R"}', (xa, sgn * CAR['track'], CAR['R']), coll, size=0.2)
            parent(pv, root, keep=False)
            w = src if not any(wd['wheel'] is src for wd in wheels) else linked_copy(src, src.name + '_b')
            w.location = (0, 0, 0)
            parent(w, pv, keep=False)
            try:
                w.cycles.motion_steps = 3
            except Exception:
                pass
            wheels.append(dict(pivot=pv, wheel=w, front=front, side=sgn))
    car = dict(root=root, body=body, parts=parts, wheels=wheels, mats=mats, name=name,
               window_local=Vector((-0.74, -0.80, 1.10)), window_out=Vector((0, -1, 0)),
               head_lights=[], tail_light=None, state={})
    if lights:
        for sgn in (1, -1):
            hl = light('SPOT', f'{name}_head{sgn}', (2.42, sgn * 0.61, 0.655), energy=head_energy, color=kelvin(4300),
                       spot=58, blend=0.55, radius=0.06)
            hl.rotation_euler = Vector((1.0, sgn * 0.03, -0.085)).to_track_quat('-Z', 'Y').to_euler()
            parent(hl, body, keep=False)
            car['head_lights'].append(hl)
        tl = light('POINT', f'{name}_tailglow', (-2.62, 0, 0.70), energy=tail_energy, color=(1.0, 0.03, 0.015), radius=0.25)
        parent(tl, body, keep=False)
        car['tail_light'] = tl
    return car


# ============================================================================ paths and driving

class Path:
    """Centripetal Catmull-Rom path through 3D points, arc-length parametrised (linear past the ends)."""

    def __init__(self, pts, per_seg=60):
        P = [Vector(p if len(p) == 3 else (p[0], p[1], 0.0)) for p in pts]
        self.p = spline(P, per_seg)
        self.s = [0.0]
        for a, b in zip(self.p, self.p[1:]):
            self.s.append(self.s[-1] + (b - a).length)
        self.length = self.s[-1]

    def at(self, s):
        if s <= 0:
            return self.p[0] + (self.p[1] - self.p[0]).normalized() * s
        if s >= self.length:
            return self.p[-1] + (self.p[-1] - self.p[-2]).normalized() * (s - self.length)
        i = bisect.bisect_right(self.s, s) - 1
        i = min(i, len(self.p) - 2)
        t = (s - self.s[i]) / max(1e-9, self.s[i + 1] - self.s[i])
        return self.p[i].lerp(self.p[i + 1], t)

    def tan(self, s, ds=0.3):
        d = self.at(s + ds) - self.at(s - ds)
        return d.normalized() if d.length > 1e-9 else Vector((1, 0, 0))

    def project(self, q):
        q = Vector(q)
        i = min(range(len(self.p)), key=lambda k: (self.p[k] - q).length)
        return self.s[i]


def _spring(targets, dt, freq, zeta, kicks=None):
    x, v = targets[0], 0.0
    w = 2 * math.pi * freq
    out = []
    for i, tg in enumerate(targets):
        if kicks and i in kicks:
            v += kicks[i]
        a = w * w * (tg - x) - 2 * zeta * w * v
        v += a * dt
        x += v * dt
        out.append(x)
    return out


def drive(car, path, speed, anchor, f0, f1, kfrom=1, kto=None, sub=4, roll_k=0.0042, pitch_k=0.006,
          slip_k=0.008, roll_max=0.075, slip_max=0.22, kicks=(), vib=0.003, seed=0):
    """Animate car along path. speed: [(frame, m/s)] piecewise linear. anchor: (frame, s) — where the car is.
    Simulates frames f0..f1 (sub-steps), keys kfrom..kto. kicks: [(frame, heave_vel, pitch_vel)].
    Fills car['state'][f] = dict(M=body world matrix, R=root matrix, pos, vel, dir, speed, s)."""
    kto = kto if kto is not None else f1
    n = int(round((f1 - f0) * sub)) + 1
    T = [f0 + i / sub for i in range(n)]
    sf, sv = [a for a, b in speed], [b for a, b in speed]
    V = [_interp(sf, sv, t) for t in T]
    I = [0.0]
    for i in range(1, n):
        I.append(I[-1] + 0.5 * (V[i - 1] + V[i]) / sub / FPS)
    Ia = _interp(T, I, anchor[0])
    S = [anchor[1] + x - Ia for x in I]
    P = [path.at(s) for s in S]
    TG = [path.tan(s) for s in S]
    psi = []
    for t in TG:
        a = math.atan2(t.y, t.x)
        if psi:
            while a - psi[-1] > math.pi:
                a -= 2 * math.pi
            while a - psi[-1] < -math.pi:
                a += 2 * math.pi
        psi.append(a)
    dts = 1.0 / sub / FPS
    kap = []
    for i in range(n):
        i0, i1 = max(0, i - 2), min(n - 1, i + 2)
        ds = S[i1] - S[i0]
        kap.append((psi[i1] - psi[i0]) / ds if abs(ds) > 1e-4 else 0.0)
    alat = [V[i] ** 2 * kap[i] for i in range(n)]
    along = [(V[min(n - 1, i + 1)] - V[max(0, i - 1)]) / (2 * dts) for i in range(n)]
    # smooth accelerations (tyres + chassis compliance)
    def blur(a, r=3):
        return [sum(a[max(0, i - r):i + r + 1]) / len(a[max(0, i - r):i + r + 1]) for i in range(len(a))]
    alat, along = blur(alat, 4), blur(along, 4)
    clamp = lambda v, m: max(-m, min(m, v))
    roll_t = [clamp(roll_k * a, roll_max) for a in alat]
    pitch_t = [clamp(-pitch_k * a, 0.05) for a in along]
    slip_t = [clamp(slip_k * a, slip_max) for a in alat]
    kk_h, kk_p = {}, {}
    for (kf, hv, pv) in kicks:
        idx = int(round((kf - f0) * sub))
        if 0 <= idx < n:
            kk_h[idx] = hv
            kk_p[idx] = pv
    roll = _spring(roll_t, dts, 1.3, 0.32)
    pitch = _spring(pitch_t, dts, 1.6, 0.38, kk_p)
    slip = _spring(slip_t, dts, 0.9, 0.55)
    heave = _spring([0.0] * n, dts, 2.2, 0.35, kk_h)
    steer = [clamp(math.atan(CAR['wheelbase'] * kap[i]) - 0.9 * slip[i], 0.55) for i in range(n)]
    rng = random.Random(seed)
    ph = [rng.uniform(0, 100) for _ in range(4)]
    root, body = car['root'], car['body']
    for f in range(f0, f1 + 1):
        i = (f - f0) * sub
        tg = TG[i]
        hxy = math.hypot(tg.x, tg.y)
        th = -math.atan2(tg.z, hxy)
        yaw = psi[i] + slip[i]
        sp = V[i]
        vz = vib * min(1.0, sp / 15.0)
        hv = heave[i] + vz * mnoise.noise(Vector((f * 0.45, ph[0], 0)))
        rv = roll[i] + vz * 1.5 * mnoise.noise(Vector((f * 0.4, ph[1], 0)))
        pv = pitch[i] + vz * 1.0 * mnoise.noise(Vector((f * 0.5, ph[2], 0)))
        Rm = Matrix.Translation(P[i]) @ Euler((0, th, yaw)).to_matrix().to_4x4()
        Bm = Matrix.Translation((0, 0, hv)) @ Euler((rv, pv, 0)).to_matrix().to_4x4()
        car['state'][f] = dict(M=Rm @ Bm, R=Rm, pos=P[i].copy(), vel=tg * sp, dir=tg.copy(), speed=sp, s=S[i])
        if kfrom <= f <= kto:
            root.location = P[i]
            root.rotation_euler = (0, th, yaw)
            root.keyframe_insert('location', frame=f)
            root.keyframe_insert('rotation_euler', frame=f)
            body.location = (0, 0, hv)
            body.rotation_euler = (rv, pv, 0)
            body.keyframe_insert('location', frame=f)
            body.keyframe_insert('rotation_euler', frame=f)
            for wd in car['wheels']:
                wd['wheel'].rotation_euler = (0, S[i] / CAR['R'], 0)
                wd['wheel'].keyframe_insert('rotation_euler', index=1, frame=f)
                if wd['front']:
                    wd['pivot'].rotation_euler = (0, 0, steer[i])
                    wd['pivot'].keyframe_insert('rotation_euler', index=2, frame=f)
    # keep the dense trajectory for wake fields
    car['traj'] = dict(T=T, P=P, D=TG, V=V)
    return car


def car_at(car, t):
    """Interpolated (pos, dir, speed) of the car path at fractional frame t."""
    tr = car['traj']
    T = tr['T']
    if t <= T[0]:
        i = 0
    elif t >= T[-1]:
        i = len(T) - 2
    else:
        i = min(len(T) - 2, bisect.bisect_right(T, t) - 1)
    u = max(0.0, min(1.0, (t - T[i]) / (T[i + 1] - T[i])))
    return tr['P'][i].lerp(tr['P'][i + 1], u), tr['D'][i].lerp(tr['D'][i + 1], u).normalized(), \
        tr['V'][i] + (tr['V'][i + 1] - tr['V'][i]) * u


def car_world(car, local, f):
    """World position of a car-local point at integer frame f (needs drive())."""
    st = car['state'][max(min(car['state']), min(max(car['state']), int(round(f))))]
    return st['M'] @ Vector(local)


def lights_level(car, head=None, tail=None, frames=None):
    """Key lamp emission (lens strength) and the actual head/tail lights."""
    if head is not None:
        for f, v in head:
            for hl in car['head_lights']:
                hl.data.energy = v * 36.0
                hl.data.keyframe_insert('energy', frame=f)
            sk = lens_strength_socket(car['mats']['head'])
            sk.default_value = v
            sk.keyframe_insert('default_value', frame=f)
    if tail is not None:
        for f, v in tail:
            sk = lens_strength_socket(car['mats']['tail'])
            sk.default_value = v
            sk.keyframe_insert('default_value', frame=f)


# ============================================================================ street

def build_street(coll, x0, x1, seed=1, driveways=(), crossing=None, plaza=(), dashes=True):
    """Road (|y| < ROAD_HW), kerbs, sidewalks to FACADE_Y on both sides, lane markings.
    driveways: [(xa, xb, side)] dropped-kerb gaps; plaza: [(xa, xb, side)] sidewalk extended outward."""
    road = mat_wet_asphalt('WetAsphalt')
    walk = mat_slabs('Sidewalk')
    kerb = mat_stone('Kerb', base=(0.10, 0.10, 0.10), rough=(0.25, 0.5), speck=0.5, scale=3.0)
    paint = mat_principled('RoadPaint', color=(0.55, 0.55, 0.52), rough=0.35, coat=0.6, coat_rough=0.08)
    yell = mat_principled('RoadYellow', color=(0.55, 0.33, 0.03), rough=0.35, coat=0.6, coat_rough=0.08)
    s_ = SB(paint)
    nz = s_.tex('ShaderNodeTexNoise', s_.coords(), Scale=3.0, Detail=6.0)
    s_.put(s_.mix(s_.mr(nz.outputs['Fac'], 0.35, 0.65), (0.08, 0.08, 0.075), (0.55, 0.55, 0.52)), principled(paint).inputs['Base Color'])
    bm = bmesh.new()
    bm_quad(bm, [(x0, -ROAD_HW - 0.2, 0), (x1, -ROAD_HW - 0.2, 0), (x1, ROAD_HW + 0.2, 0), (x0, ROAD_HW + 0.2, 0)])
    o_road = obj_bm('Road', bm, [road], coll)
    # kerbs + sidewalks with gaps
    bm = bmesh.new()
    for side in (1, -1):
        gaps = sorted([(a, b) for a, b, sd in driveways if sd == side])
        segs, cur = [], x0
        for a, b in gaps:
            segs.append((cur, a))
            cur = b
        segs.append((cur, x1))
        for a, b in segs:
            if b - a < 0.05:
                continue
            bm_box(bm, ((a + b) / 2, side * (ROAD_HW + 0.1), KERB_H / 2 - 0.05), (b - a, 0.2, KERB_H + 0.1), 0)
            bm_box(bm, ((a + b) / 2, side * (ROAD_HW + 0.2 + (FACADE_Y - ROAD_HW - 0.2) / 2), KERB_H / 2 - 0.05),
                   (b - a, FACADE_Y - ROAD_HW - 0.2, KERB_H + 0.1), 1)
        for a, b in gaps:    # driveway apron, flush with the road
            bm_box(bm, ((a + b) / 2, side * (ROAD_HW + (FACADE_Y - ROAD_HW) / 2), -0.04),
                   (b - a, FACADE_Y - ROAD_HW, 0.1), 1)
        for a, b, sd in plaza:
            if sd == side:
                bm_box(bm, ((a + b) / 2, side * (FACADE_Y + 15), KERB_H / 2 - 0.05), (b - a, 30, KERB_H + 0.1), 1)
    o_walk = obj_bm('Kerbs', bm, [kerb, walk], coll)
    # markings
    bm = bmesh.new()
    z = 0.003
    for yy in (-0.09, 0.09):
        bm_quad(bm, [(x0, yy - 0.05, z), (x1, yy - 0.05, z), (x1, yy + 0.05, z), (x0, yy + 0.05, z)], 1)
    if dashes:
        for yy in (-3.5, 3.5):
            x = x0 + (seed * 3.7) % 12
            while x < x1:
                bm_quad(bm, [(x, yy - 0.06, z), (x + 3.0, yy - 0.06, z), (x + 3.0, yy + 0.06, z), (x, yy + 0.06, z)], 0)
                x += 12.0
        for yy in (-6.7, 6.7):
            bm_quad(bm, [(x0, yy - 0.06, z), (x1, yy - 0.06, z), (x1, yy + 0.06, z), (x0, yy + 0.06, z)], 0)
    if crossing is not None:
        for k in range(14):
            yy = -6.3 + k * 0.95
            bm_quad(bm, [(crossing - 1.6, yy, z), (crossing + 1.6, yy, z), (crossing + 1.6, yy + 0.5, z),
                         (crossing - 1.6, yy + 0.5, z)], 0)
    o_mark = obj_bm('Markings', bm, [paint, yell], coll)
    # manhole covers
    rng = random.Random(seed)
    bm = bmesh.new()
    metal = mat_metal('ManholeIron', base=(0.06, 0.055, 0.05), rough=(0.25, 0.55), scale=4.0, grime=0.5)
    x = x0 + rng.uniform(5, 25)
    while x < x1:
        res = bmesh.ops.create_circle(bm, cap_ends=True, segments=32, radius=0.32)
        bmesh.ops.translate(bm, verts=res['verts'], vec=(x, rng.choice((-5.2, -1.8, 1.8, 5.2)), 0.004))
        x += rng.uniform(25, 45)
    if bm.verts:
        obj_bm('Manholes', bm, [metal], coll)
    else:
        bm.free()
    return dict(road=o_road, walk=o_walk, marks=o_mark)


FACADES = [
    dict(seed=1.0, bay=3.0, floor=3.3, ww=0.58, wh=0.52, lit=0.42, wall=(0.075, 0.062, 0.05), cool_frac=0.25),
    dict(seed=2.0, bay=2.5, floor=3.1, ww=0.48, wh=0.55, lit=0.35, wall=(0.07, 0.03, 0.022), cool_frac=0.15),
    dict(seed=3.0, bay=1.6, floor=3.6, ww=0.86, wh=0.78, lit=0.30, wall=(0.02, 0.024, 0.03), cool_frac=0.6, wall_rough=0.3),
    dict(seed=4.0, bay=3.6, floor=3.7, ww=0.55, wh=0.5, lit=0.5, wall=(0.11, 0.10, 0.09), cool_frac=0.3),
    dict(seed=5.0, bay=2.2, floor=3.0, ww=0.6, wh=0.5, lit=0.4, wall=(0.04, 0.04, 0.045), cool_frac=0.4),
]


def facade_mats(strength=1.6):
    return [mat_facade(f'Facade{i}', strength=strength, **kw) for i, kw in enumerate(FACADES)]


def build_buildings(coll, x0, x1, side, seed=3, front=FACADE_Y, skip=(), hmin=12.0, hmax=42.0, depth=22.0,
                    wmin=10.0, wmax=26.0, mats=None, cornice=True):
    """A row of box buildings with shader facades along X. side=+1 -> facades at y=+front facing -Y."""
    rng = random.Random(seed)
    mats = mats or facade_mats()
    dark = mat_stone('Cornice', base=(0.03, 0.03, 0.032), rough=(0.4, 0.7))
    out = []
    x = x0
    while x < x1:
        w = rng.uniform(wmin, wmax)
        xa, xb = x, min(x + w, x1)
        x = xb + rng.choice((0.0, 0.0, 0.4, 1.5))
        if any(not (xb <= a or xa >= b) for a, b in skip):
            continue
        h = rng.uniform(hmin, hmax)
        set_back = rng.choice((0.0, 0.0, 0.3, 0.8))
        yf = side * (front + set_back)
        yb = side * (front + set_back + depth)
        bm = bmesh.new()
        cx = (xa + xb) / 2
        bm_box(bm, (0, side * depth / 2, h / 2), (xb - xa, depth, h), 0)
        if cornice:
            bm_box(bm, (0, side * (depth / 2 - 0.25), h + 0.25), (xb - xa + 0.3, depth + 0.5, 0.5), 1)
            bm_box(bm, (0, side * (-0.12), 4.35), (xb - xa, 0.25, 0.35), 1)
        o = obj_bm(f'Bldg_{side}_{int(xa)}', bm, [rng.choice(mats), dark], coll)
        o.location = (cx, yf, 0)
        out.append(o)
    return out


# ============================================================================ street lights

def streetlight_mesh(coll, h=8.6, arm=2.0):
    """Template lamp (pole at origin, arm along -Y local, head over the road). Lens = slot 2."""
    pole = mat_paint('LampPaint', color=(0.03, 0.033, 0.03), rough=(0.4, 0.6), wear=0.15)
    head = mat_metal('LampHead', base=(0.25, 0.26, 0.27), rough=(0.3, 0.5), scale=3.0, grime=0.4)
    lens = mat_emission('SodiumLens', color=SODIUM, strength=9.0)
    no_emit_sampling(lens)
    bm = bmesh.new()
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.12, radius2=0.075, depth=h)
    bmesh.ops.translate(bm, verts=res['verts'], vec=(0, 0, h / 2))
    bm_box(bm, (0, 0, 0.35), (0.34, 0.34, 0.7), 0)
    pth = spline([(0, 0, h - 0.6), (0, -0.25, h - 0.05), (0, -0.9, h + 0.12), (0, -arm, h + 0.05)], 6)
    sweep(bm, pth, rrect(0.07, 0.07, 0.03, 2), mi=0)
    hc = Vector((0, -arm - 0.32, h - 0.02))
    res = bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=10, radius=0.5)
    for v in res['verts']:
        v.co = Vector((v.co.x * 0.36, v.co.y * 0.95, max(v.co.z, -0.05) * 0.26)) + hc
    for f in {f for v in res['verts'] for f in v.link_faces}:
        f.material_index = 1
    bm_box(bm, hc + Vector((0, 0, -0.03)), (0.40, 0.70, 0.03), 2)
    o = obj_bm('LampTemplate', bm, [pole, head, lens], coll, smooth=45)
    o.location = (0, 0, -500)          # template parked out of sight; lamps are linked copies
    return o, Vector((0, -arm - 0.32, h - 0.06))


def streetlights(coll, xs, side, y=ROAD_HW + 0.55, energy=900.0, color=SODIUM, h=8.6, arm=2.0, spot=125,
                 tmpl=None, mesh_only=False):
    """Lamps along X on one side (side=+1 at +y, arm reaching toward the road)."""
    if tmpl is None:
        tmpl = streetlight_mesh(coll, h, arm)
    t, head_local = tmpl
    out = []
    ld = None
    for i, x in enumerate(xs):
        o = linked_copy(t, f'Lamp_{side}_{i}', loc=(x, side * y, KERB_H), rot=(0, 0, 0 if side > 0 else math.pi))
        rot = Matrix.Rotation(0 if side > 0 else math.pi, 3, 'Z')
        hp = Vector((x, side * y, KERB_H)) + rot @ head_local
        if not mesh_only:
            L = light('SPOT', f'LampL_{side}_{i}', tuple(hp), energy=energy, color=color, spot=spot, blend=0.85, radius=0.18)
            if ld is None:
                ld = L.data
            else:
                L.data = ld
            L.rotation_euler = (0, 0, 0)  # spot points down -Z
            out.append((o, L, hp))
        else:
            out.append((o, None, hp))
    return out


# ============================================================================ police strobes

def strobe_pattern(f, phase=0, color='red'):
    """Beat-locked light-bar pattern: 12-frame cycle, red double flash then blue double flash."""
    k = (f + phase) % 12
    if color == 'red':
        return {0: 1.0, 1: 0.55, 2: 0.0, 3: 1.0, 4: 0.5}.get(k, 0.0)
    return {6: 1.0, 7: 0.55, 8: 0.0, 9: 1.0, 10: 0.5}.get(k, 0.0)


def police_strobe(coll, specs, f0, f1, seed=0):
    """specs: [dict(color='red'|'blue', loc, target, energy, kind='SPOT'|'AREA'|'POINT', size, spot, phase,
    parent=None, path=[(frame, loc)])] -> list of light objects, energies keyed per frame (CONSTANT)."""
    rng = random.Random(seed)
    out = []
    for i, sp in enumerate(specs):
        col = RED if sp.get('color', 'red') == 'red' else BLUE
        kind = sp.get('kind', 'SPOT')
        L = light(kind, f'Police_{i}', sp.get('loc', (0, 0, 1.4)), energy=0.0, color=col,
                  size=sp.get('size', 0.4), spot=sp.get('spot', 70), blend=sp.get('blend', 0.9), radius=sp.get('radius', 0.12),
                  target=sp.get('target'))
        if sp.get('parent') is not None:
            parent(L, sp['parent'], keep=False)
            L.location = sp.get('loc', (0, 0, 0))
            if sp.get('target') is not None:
                L.rotation_euler = (Vector(sp['target']) - Vector(sp['loc'])).to_track_quat('-Z', 'Y').to_euler()
        if sp.get('path'):
            for f, loc in sp['path']:
                L.location = loc
                L.keyframe_insert('location', frame=f)
                if sp.get('target') is not None:
                    L.rotation_euler = (Vector(sp['target']) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
                    L.keyframe_insert('rotation_euler', frame=f)
        E = sp.get('energy', 1000.0)
        ph = sp.get('phase', 0)
        jit = sp.get('jitter', 0.15)
        for f in range(f0, f1 + 1):
            v = strobe_pattern(f, ph, sp.get('color', 'red'))
            v = v * (1 - jit + jit * rng.random()) + sp.get('floor', 0.0)
            L.data.energy = E * v
            L.data.keyframe_insert('energy', frame=f)
        for fc in fcurves(L.data):
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT'
        out.append(L)
    return out


# ============================================================================ hero tower (bank)

def build_bank_tower(coll, xc=0.0, yf=FACADE_Y, bays=7, floors=14, bay=4.4, fh=3.2, podium=6.0,
                     garage=(-9.2, -3.8), entrance=(2.0, 10.0), seed=7, room_strength=2.2, name='Bank'):
    """7-bay office tower over a granite podium. Windows are real recesses with frames, mullions, glass and a
    lit room plane (mat_room). Returns dict with objects and key positions."""
    rng = random.Random(seed)
    granite = mat_stone('BankGranite', base=(0.030, 0.029, 0.031), rough=(0.16, 0.34), speck=0.35)
    bronze = mat_metal('Spandrel', base=(0.07, 0.055, 0.04), rough=(0.28, 0.45), scale=0.5, grime=0.3, scratches=0.0)
    frame = mat_principled('WinFrame', color=(0.10, 0.085, 0.07), rough=0.35, metal=1.0)
    glass = mat_window_glass('WinGlass')
    room = mat_room('Room', strength=room_strength)
    cavity = mat_principled('Cavity', color=(0.03, 0.028, 0.026), rough=0.9)
    sill = mat_stone('Sill', base=(0.09, 0.088, 0.085), rough=(0.25, 0.45), speck=0.3)
    concrete = mat_concrete('GarageConcrete', base=(0.11, 0.11, 0.105), wet=0.3, scale=0.6)
    side_f = mat_facade('TowerSide', seed=9.0, bay=bay / 2, floor=fh, ww=0.8, wh=0.6, sill=0.36, lit=0.5,
                        wall=(0.03, 0.029, 0.031), wall_rough=0.3, ground=podium, shop=False)
    lobby = mat_room('Lobby', strength=0.9, dark_frac=-1.0, cool_frac=0.0)
    mats = [granite, bronze, frame, glass, room, cavity, sill, concrete, side_f, lobby]
    G, BR, FR, GL, RM, CV, SL, CO, SF, LB = range(10)
    W = bays * bay
    xL = xc - W / 2
    top = podium + floors * fh + 1.6
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    uvd = bm.loops.layers.uv.new('WinData')
    pw, cw = 0.56, 1.0
    dep = 1.6                      # facade zone depth
    gy = yf + 0.38                 # glass plane
    # piers: outer stone (to the glass line) + inner cavity part
    for i in range(bays + 1):
        x = xL + i * bay
        w_ = cw if i in (0, bays) else pw
        xcen = x - (w_ - pw) / 2 if i == 0 else (x + (w_ - pw) / 2 if i == bays else x)
        bm_box(bm, (xcen, yf + 0.19, (podium + top) / 2), (w_, 0.38, top - podium), G)
        bm_box(bm, (xcen, (gy + yf + dep) / 2, (podium + top) / 2), (w_, yf + dep - gy, top - podium), CV)
    # floors: spandrels, sills, frames, glass, rooms
    for k in range(floors + 1):
        z0 = podium + k * fh
        zw0, zw1 = z0 + 1.15, z0 + 3.05
        zs0 = podium if k == 0 else podium + (k - 1) * fh + 3.05
        zs1 = zw0 if k < floors else top - 1.4
        for i in range(bays):
            xa, xb = xL + i * bay + pw / 2, xL + (i + 1) * bay - pw / 2
            xm = (xa + xb) / 2
            if zs1 > zs0:
                bm_box(bm, (xm, yf + 0.12 + (gy - yf - 0.12) / 2, (zs0 + zs1) / 2), (xb - xa, gy - yf - 0.12, zs1 - zs0), BR)
                bm_box(bm, (xm, (gy + yf + dep) / 2, (zs0 + zs1) / 2), (xb - xa, yf + dep - gy, zs1 - zs0), CV)
            if k == floors:
                continue
            # sill ledge
            bm_box(bm, (xm, yf + 0.06, zw0 - 0.02), (xb - xa + 0.02, 0.24, 0.07), SL)
            # frame + mullions
            for (c, s_) in (((xm, gy, zw1 - 0.03), (xb - xa, 0.09, 0.06)), ((xm, gy, zw0 + 0.03), (xb - xa, 0.09, 0.06)),
                            ((xa + 0.03, gy, (zw0 + zw1) / 2), (0.06, 0.09, zw1 - zw0)),
                            ((xb - 0.03, gy, (zw0 + zw1) / 2), (0.06, 0.09, zw1 - zw0))):
                bm_box(bm, c, s_, FR)
            for t in (1 / 3, 2 / 3):
                bm_box(bm, (xa + (xb - xa) * t, gy, (zw0 + zw1) / 2), (0.045, 0.07, zw1 - zw0), FR)
            bm_box(bm, (xm, gy, zw0 + 0.62), (xb - xa, 0.05, 0.035), FR)   # transom
            bm_quad(bm, [(xa, gy, zw0), (xb, gy, zw0), (xb, gy, zw1), (xa, gy, zw1)], GL)
            r1, r2 = rng.random(), rng.random()
            ry0, ry1 = zw0 - 0.25, zw1 + 0.15
            bm_quad(bm, [(xa - 0.1, yf + dep - 0.02, ry0), (xb + 0.1, yf + dep - 0.02, ry0), (xb + 0.1, yf + dep - 0.02, ry1),
                         (xa - 0.1, yf + dep - 0.02, ry1)], RM,
                    uvs=[(0, 0), (1, 0), (1, 1), (0, 1)], uvl=uvl, uv2=(r1, r2), uvl2=uvd)
    # crown
    bm_box(bm, (xc, yf + 0.0, top - 0.7), (W + 0.4, 0.5, 1.4), G)
    # building body behind (side faces get the cheap facade)
    body_d = 26.0
    bf = bm_box(bm, (xc, yf + dep + body_d / 2, top / 2), (W + 0.8, body_d, top), G)
    bf[3].material_index = SF
    bf[5].material_index = SF
    # ---------------------------------------------------------------- podium
    g0, g1 = garage
    e0, e1 = entrance
    gh, eh = 3.7, 4.4
    xa_, xb_ = xL - 0.5, xL + W + 0.5
    pd = 0.8
    for a, b, za, zb in ((xa_, g0, 0, podium), (g0, g1, gh, podium), (g1, e0, 0, podium), (e0, e1, eh, podium),
                         (e1, xb_, 0, podium)):
        bm_box(bm, ((a + b) / 2, yf + pd / 2, (za + zb) / 2), (b - a, pd, zb - za), G)
    bm_box(bm, (xc, yf - 0.12, podium - 0.25), (W + 1.4, 0.36, 0.5), SL)             # podium cornice
    for a, b in ((xa_ - 0.05, g0), (g1, e0), (e1, xb_ + 0.05)):                         # plinth
        bm_box(bm, ((a + b) / 2, yf - 0.04, 0.35), (b - a, 0.12, 0.7), SL)
    # entrance: recessed glazing + lobby glow
    ey = yf + 1.6
    bm_quad(bm, [(e0, ey, 0.0), (e1, ey, 0.0), (e1, ey, eh), (e0, ey, eh)], GL)
    for j in range(7):
        xx = e0 + (e1 - e0) * j / 6
        bm_box(bm, (xx, ey, eh / 2), (0.08, 0.12, eh), FR)
    bm_box(bm, ((e0 + e1) / 2, ey, 2.7), (e1 - e0, 0.12, 0.1), FR)
    bm_quad(bm, [(e0 - 0.5, ey + 6.0, 0.0), (e1 + 0.5, ey + 6.0, 0.0), (e1 + 0.5, ey + 6.0, eh + 0.6),
                 (e0 - 0.5, ey + 6.0, eh + 0.6)], LB, uvs=[(0, 0), (1, 0), (1, 1), (0, 1)], uvl=uvl, uv2=(0.9, 0.2), uvl2=uvd)
    for a, b in ((e0 - 0.3, e0), (e1, e1 + 0.3)):
        bm_box(bm, ((a + b) / 2, yf + pd + 3.2, eh / 2), (b - a, 6.4, eh), G)
    bm_box(bm, ((e0 + e1) / 2, yf + pd + 3.2, eh + 0.15), (e1 - e0 + 0.6, 6.4, 0.3), CV)
    bm_quad(bm, [(e0, yf + pd, 0.001), (e1, yf + pd, 0.001), (e1, ey + 6, 0.001), (e0, ey + 6, 0.001)], SL)
    # garage ramp: walls, sloped floor, ceiling
    L_r, drop = 16.0, 3.0
    yb = yf + 24.0
    for a, b in ((g0 - 0.35, g0), (g1, g1 + 0.35)):
        bm_box(bm, ((a + b) / 2, (yf + yb) / 2, 0.5), (b - a, yb - yf, 6.6), CO)
    bm_box(bm, ((g0 + g1) / 2, (yf + yb) / 2, gh + 0.15), (g1 - g0 + 0.7, yb - yf, 0.3), CO)
    rf = [(g0, yf, 0.0), (g1, yf, 0.0), (g1, yf + L_r, -drop), (g0, yf + L_r, -drop)]
    bm_quad(bm, rf, CO)
    bm_quad(bm, [(g0, yf + L_r, -drop), (g1, yf + L_r, -drop), (g1, yb, -drop), (g0, yb, -drop)], CO)
    bm_box(bm, ((g0 + g1) / 2, yb + 0.2, 0), (g1 - g0 + 0.7, 0.4, 7.0), CV)
    # roller shutter drum
    bm_box(bm, ((g0 + g1) / 2, yf + 0.55, gh - 0.25), (g1 - g0, 0.5, 0.45), FR)
    o = obj_bm(name + 'Tower', bm, mats, coll)
    # hazard jamb guards + garage fluorescent tubes + brass letters
    hz = mat_hazard()
    for xx in (g0 + 0.15, g1 - 0.15):
        box('GarageGuard', (0.3, 0.3, 1.1), (xx, yf - 0.15, 0.55), coll=coll, bev=0.02, mat=hz)
    tube = mat_strip('GarageTube', color=(0.75, 0.9, 1.0), strength=6.0)
    tubes = []
    for yy, zz in ((yf + 4.0, gh - 0.05), (yf + 11.0, gh - 0.05), (yf + 18.0, gh - 0.05)):
        tubes.append(box('GarageTube', (1.4, 0.08, 0.05), ((g0 + g1) / 2, yy, zz), coll=coll, mat=tube))
    brass = mat_brass('BrassLetters')
    t = text_mesh('TUMBLER TRUST', 'BankSign', size=0.62, extrude=0.03, coll=coll, spacing=1.15)
    t.rotation_euler = (math.pi / 2, 0, 0)
    t.location = ((e0 + e1) / 2, yf - 0.06, podium - 1.05)
    set_mat(t, brass)
    piers = [xL + i * bay for i in range(bays + 1)]
    return dict(obj=o, sign=t, tubes=tubes, top=top, piers=piers, xL=xL, W=W, garage=garage,
                garage_mouth=Vector(((g0 + g1) / 2, yf, 1.5)), ramp=(yf, L_r, drop))


def ramp_z(y, yf=FACADE_Y, L_r=16.0, drop=3.0):
    if y <= yf:
        return 0.0
    if y >= yf + L_r:
        return -drop
    return -drop * (y - yf) / L_r


# ============================================================================ tunnel

def build_tunnel(coll, x0, length=220.0, hw=6.2, h=5.4, every=3.2, lamp_strength=7.0, lamp_color=(1.0, 0.42, 0.10),
                 portal=True, seed=5):
    """Tunnel along +X starting at x0: tiled walls, dark ceiling, walkways, two rows of amber fixtures."""
    tiles = mat_tiles('TunnelTile')
    ceil = mat_concrete('TunnelCeil', base=(0.05, 0.05, 0.05), wet=0.0, scale=0.5)
    walkc = mat_slabs('TunnelWalk', base=(0.06, 0.06, 0.06), slab=(1.0, 0.9), wet=0.2)
    road = mat_wet_asphalt('TunnelRoad', base=(0.03, 0.03, 0.032), wet=0.25, puddle_scale=0.3)
    house = mat_metal('FixtureHousing', base=(0.2, 0.2, 0.21), rough=(0.3, 0.5), grime=0.4)
    lens = mat_strip('TunnelLamp', color=lamp_color, strength=lamp_strength)
    x1 = x0 + length
    bm = bmesh.new()
    ch = 0.9
    prof = [(-hw, 0.3), (-hw, h - ch), (-hw + ch, h), (hw - ch, h), (hw, h - ch), (hw, 0.3)]
    for (ya, za), (yb, zb) in zip(prof, prof[1:]):
        mi = 0 if abs(ya) == hw and abs(yb) == hw else 1
        bm_quad(bm, [(x0, ya, za), (x0, yb, zb), (x1, yb, zb), (x1, ya, za)], mi)
    for sgn in (1, -1):
        bm_box(bm, ((x0 + x1) / 2, sgn * (hw - 0.45), 0.15), (length, 0.9, 0.3), 2)
    bm_quad(bm, [(x0, -hw + 0.9, 0), (x1, -hw + 0.9, 0), (x1, hw - 0.9, 0), (x0, hw - 0.9, 0)], 3)
    o = obj_bm('Tunnel', bm, [tiles, ceil, walkc, road], coll)
    # markings inside
    paint = bpy.data.materials.get('RoadPaint') or mat_principled('RoadPaint', color=(0.55, 0.55, 0.52), rough=0.35)
    bm = bmesh.new()
    x = x0
    while x < x1:
        bm_quad(bm, [(x, -0.06, 0.003), (x + 3, -0.06, 0.003), (x + 3, 0.06, 0.003), (x, 0.06, 0.003)], 0)
        x += 9
    for yy in (-hw + 1.15, hw - 1.15):
        bm_quad(bm, [(x0, yy - 0.06, 0.003), (x1, yy - 0.06, 0.003), (x1, yy + 0.06, 0.003), (x0, yy + 0.06, 0.003)], 0)
    obj_bm('TunnelMarks', bm, [paint], coll)
    # fixtures (linked copies of one housing+lens mesh)
    bm = bmesh.new()
    bm_box(bm, (0, 0, 0.06), (1.5, 0.30, 0.12), 0)
    bm_box(bm, (0, 0, -0.005), (1.38, 0.2, 0.02), 1)
    fx = obj_bm('Fixture', bm, [house, lens], coll)
    fyz = lambda sgn: (sgn * (hw - ch * 0.5 - 0.07), h - ch * 0.5 - 0.07)
    fx.location = (x0 + 1.5, *fyz(1))
    fx.rotation_euler = (-math.pi / 4, 0, 0)
    fixtures = [fx]
    x = x0 + 1.5
    k = 0
    while x < x1 - 1:
        for sgn in (1, -1):
            if k == 0:
                k += 1
                continue
            c = linked_copy(fx, f'Fixture_{k}', loc=(x, *fyz(sgn)), rot=(-sgn * math.pi / 4, 0, 0))
            fixtures.append(c)
            k += 1
        x += every
    out = dict(tube=o, fixtures=fixtures)
    if portal:
        conc = mat_concrete('PortalConcrete', base=(0.12, 0.118, 0.11), wet=0.4, scale=0.5)
        th = 1.6
        bm = bmesh.new()
        bm_box(bm, (x0 - th / 2, -(hw + 12.5), 6.5), (th, 25, 13), 0)
        bm_box(bm, (x0 - th / 2, (hw + 12.5), 6.5), (th, 25, 13), 0)
        bm_box(bm, (x0 - th / 2, 0, h + (13 - h) / 2), (th, 2 * hw, 13 - h), 0)
        bm_box(bm, (x0 - th - 0.15, 0, 12.6), (0.4, 2 * hw + 50, 0.8), 1)   # parapet
        bm_box(bm, (x0 - th - 0.1, 0, h + 0.35), (0.25, 2 * hw + 0.4, 0.7), 1)  # lintel band
        for sgn in (1, -1):        # retaining walls of the approach cutting, rising toward the portal
            yw = sgn * (FACADE_Y - 0.3)
            for k in range(6):
                xa_, xb_ = x0 - 60 + k * 10, x0 - 50 + k * 10
                bm_box(bm, ((xa_ + xb_) / 2, yw, 0), (10.0, 0.6, 2 * (2.0 + 1.9 * (k + 1))), 0)
        o2 = obj_bm('Portal', bm, [conc, mat_stone('PortalCap', base=(0.06, 0.06, 0.06))], coll)
        out['portal'] = o2
    return out


# ============================================================================ banknotes in the wake

class _Note:
    pass


def note_wake(car, name, f0, f1, kf0, kf1, coll=None, n_window=40, release=(1, 30), ground=(), seed=3,
              lift=4.0, out_speed=(1.2, 3.2), keep_speed=(0.45, 0.8), zground=None, wake_len=9.0, wake_w=1.4,
              turb=1.6, sub=4, inside=0.32, max_bend=1.0):
    """Paper notes thrown out of the car's open rear window (and/or lifted off the road) and carried by
    a wake field: entrainment behind the car, a swirl about its axis, upwash, turbulence; anisotropic drag
    (paper falls slowly flat), sway, tumbling, landing flat on the wet road.
    Keys location/rotation per frame kf0..kf1 + bend/twist modifiers. Returns list of objects."""
    rng = random.Random(seed)
    zg = zground or (lambda p: 0.0)
    tmpl = make_banknote(name + '_0', detail='lo', coll=coll)
    notes = []
    rels = sorted(rng.uniform(*release) for _ in range(n_window))
    allspec = [('win', r, None) for r in rels] + [('gnd', None, g) for g in ground]
    for i, (kind, r, g) in enumerate(allspec):
        o = tmpl if i == 0 else linked_copy(tmpl, f'{name}_{i}')
        nt = _Note()
        nt.o, nt.kind = o, kind
        nt.release = r
        nt.cd_h = rng.uniform(1.6, 3.2)
        nt.cd_v = rng.uniform(8.0, 14.0)
        nt.sw_a = rng.uniform(3.0, 7.0)
        nt.sw_w = rng.uniform(5.0, 9.0)
        nt.sw_ph = rng.uniform(0, 6.28)
        nt.sw_dir = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), 0)).normalized()
        nt.jit = Vector((rng.uniform(-0.25, 0.25), rng.uniform(-0.05, 0.05), rng.uniform(-0.12, 0.10)))
        nt.w_fl = Vector([rng.uniform(-6, 6) for _ in range(3)])
        nt.bend_ph = rng.uniform(0, 6.28)
        nt.bend_w = rng.uniform(0.25, 0.6)
        nt.curl = rng.uniform(-0.25, 0.25)
        if kind == 'win':
            nt.state = 'held'
            nt.p = None
            nt.rot = Vector((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, 6.28)))
        else:
            nt.state = 'ground'
            nt.p = Vector((g[0], g[1], zg(Vector((g[0], g[1], 0))) + 0.004))
            nt.rot = Vector((rng.choice((0.0, math.pi)), 0.0, rng.uniform(0, 6.28)))
        nt.v = Vector((0, 0, 0))
        nt.w = Vector((0, 0, 0))
        nt.keys = {}
        notes.append(nt)
    dt = 1.0 / sub / FPS
    n = int(round((f1 - f0) * sub))

    def air(p, t):
        c, d, vc = car_at(car, t)
        cc = c + Vector((0, 0, 0.6))
        r = p - cc
        al = r.dot(d)
        lat = r - d * al
        lat_xy = Vector((lat.x, lat.y, 0))
        ld = lat_xy.length
        if al > 2.6:
            g = 0.0
        elif al > -2.4:
            g = 1.0
        else:
            g = math.exp((al + 2.4) / wake_len)
        hprof = math.exp(-(ld / wake_w) ** 2) * math.exp(-max(0.0, p.z - 1.5) ** 2 / 0.8)
        k = g * hprof
        u = d * (vc * 0.62 * k)
        if ld > 1e-3 and k > 1e-3:
            lu = lat_xy / ld
            u += d.cross(lu) * (vc * 0.10 * k)                  # swirl about the car axis
            if -2.6 < al < 2.6:
                u += lu * (vc * 0.12 * hprof)                    # displacement as the body passes
        if al < -2.0:
            u.z += vc * 0.07 * k                                 # upwash behind the boot
        tv = mnoise.noise_vector(p * 0.55 + Vector((0, 0, t * 0.06)))
        u += Vector(tv) * (turb * (0.4 + 1.6 * k))
        return u, k * vc
    for step in range(n + 1):
        t = f0 + step / sub
        for nt in notes:
            if nt.state == 'held':
                if t >= nt.release:
                    st = car['state'][max(min(car['state']), int(math.floor(t)))]
                    frac = t - math.floor(t)
                    loc = car['window_local'] + Vector((nt.jit.x, 0.0, nt.jit.z))
                    nt.p = st['M'] @ loc + st['vel'] * (frac / FPS)
                    outv = (st['M'].to_3x3() @ car['window_out']).normalized()
                    nt.v = st['vel'] * rng.uniform(*keep_speed) + outv * rng.uniform(*out_speed) + \
                        Vector((0, 0, rng.uniform(0.2, 1.4)))
                    nt.w = Vector([rng.uniform(-22, 22) for _ in range(3)])
                    yaw = math.atan2(st['dir'].y, st['dir'].x)
                    nt.rot = Vector((nt.rot.x, nt.rot.y, yaw + nt.rot.z * 0.2))
                    nt.state = 'air'
                else:
                    continue
            if nt.state == 'ground':
                u, strength = air(nt.p, t)
                if strength > lift and Vector((u.x, u.y, 0)).length > lift * 0.5:
                    nt.state = 'air'
                    nt.v = u * rng.uniform(0.3, 0.6) + Vector((0, 0, rng.uniform(1.5, 3.8)))
                    nt.w = Vector([rng.uniform(-18, 18) for _ in range(3)])
                else:
                    continue
            u, _ = air(nt.p, t)
            v = nt.v
            ah = (Vector((u.x, u.y, 0)) - Vector((v.x, v.y, 0))) * nt.cd_h
            av = (u.z - v.z) * nt.cd_v - 9.81
            sway = nt.sw_dir * (nt.sw_a * math.sin(nt.sw_w * t / FPS + nt.sw_ph))
            v = v + (ah + Vector((0, 0, av)) + sway) * dt
            p = nt.p + v * dt
            gz = zg(p) + 0.004
            if p.z < gz:
                p.z = gz
                if v.z < 0:
                    v.z = 0.0
                v.x *= math.exp(-7 * dt)
                v.y *= math.exp(-7 * dt)
                if Vector((v.x, v.y, 0)).length < 1.2:
                    nt.state = 'ground'
                    v = Vector((0, 0, 0))
            nt.p, nt.v = p, v
            nt.w = nt.w + (nt.w_fl - nt.w) * (1.0 - math.exp(-1.2 * dt))
            nt.rot = nt.rot + nt.w * dt
            if nt.state == 'ground':
                nt.rot.x = round(nt.rot.x / math.pi) * math.pi
                nt.rot.y = round(nt.rot.y / math.pi) * math.pi
        if step % sub == 0:
            f = int(round(t))
            for nt in notes:
                if nt.state == 'held':
                    if f >= (nt.release or 1e9) - 2.5:
                        st = car['state'][max(min(car['state']), f)]
                        loc = car['window_local'] + Vector((nt.jit.x, inside, nt.jit.z - 0.05))
                        yaw = math.atan2(st['dir'].y, st['dir'].x)
                        nt.keys[f] = (st['M'] @ loc, Vector((0.0, 0.2, yaw + nt.rot.z * 0.2)), 'held')
                    else:
                        nt.keys[f] = None
                else:
                    nt.keys[f] = (nt.p.copy(), nt.rot.copy(), nt.state)
    objs = []
    for nt in notes:
        o = nt.o
        b = o.modifiers.new('Bend', 'SIMPLE_DEFORM')
        b.deform_method = 'BEND'
        b.deform_axis = 'Y'
        tw = o.modifiers.new('Twist', 'SIMPLE_DEFORM')
        tw.deform_method = 'TWIST'
        tw.deform_axis = 'X'
        prev = None
        for f in range(kf0, kf1 + 1):
            kv = nt.keys.get(f)
            if kv is None:
                o.scale = (0, 0, 0)
                o.keyframe_insert('scale', frame=f)
                hp = nt.keys.get(f + 3) or nt.keys.get(f + 2) or nt.keys.get(f + 1)
                if hp:
                    o.location = hp[0]
                    o.keyframe_insert('location', frame=f)
                continue
            loc, rot, stt = kv
            o.scale = (1, 1, 1)
            o.keyframe_insert('scale', frame=f)
            o.location = loc
            e = Euler(rot)
            if prev is not None:
                e.make_compatible(prev)
            prev = e.copy()
            o.rotation_euler = e
            o.keyframe_insert('location', frame=f)
            o.keyframe_insert('rotation_euler', frame=f)
            if stt == 'air':
                ang = max_bend * math.sin(f * nt.bend_w + nt.bend_ph) + nt.curl
                twa = 0.6 * math.sin(f * nt.bend_w * 0.7 + nt.bend_ph * 2.0)
            elif stt == 'held':
                ang, twa = 0.6 + nt.curl, 0.0
            else:
                ang, twa = nt.curl * 0.6, 0.0
            b.angle = ang
            b.keyframe_insert('angle', frame=f)
            tw.angle = twa
            tw.keyframe_insert('angle', frame=f)
        for fc in fcurves(o):
            if fc.data_path == 'scale':
                for kp in fc.keyframe_points:
                    kp.interpolation = 'CONSTANT'
        try:
            o.cycles.motion_steps = 2
        except Exception:
            pass
        objs.append(o)
    return objs
