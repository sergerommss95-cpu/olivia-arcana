"""Fictional banknote ("TUMBLER RESERVE NOTE"): procedural intaglio-style print on a bendable paper plane.

Not a real currency: original layout, fictional issuer, no portrait, no real security features.
Size 0.156 x 0.066 m (ratio 2.36, so a flat note almost exactly fills the 2.39:1 frame).

make_banknote(name, detail='hi'|'lo', coll=None) -> paper object (UV 0..1), text children parented to it.
    'hi': full material with intaglio ink relief + paper-fibre bump, and text meshes.
    'lo': same print (identical colours/layout), no bump and no text meshes (cheap; for flying notes).
mat_banknote(name, detail) is cached by name (one material shared by every note of that detail).
flutter(o, start, end, ...) adds an animated bend + travelling wave (paper in the air).
conform(o, fn) shapes a resting note (fold/curl) with its text meshes following the paper.

Layout, in note-height units (u: 0..R=2.364 left->right, v: 0..1 bottom->top; 1 unit = 66 mm):
    HERO  green guilloche rosette at (0.56, 0.50); rosette rim rho=1 at r=0.14 (18.5 mm diameter),
          surrounded by a lighter scalloped wreath out to r~0.31. Rings at rho 0.32 / 0.445 / 0.955 / 1.0
          echo the combination dial (medallion / knob / face / knurled rim) for the Act V dissolve.
    MED   engraved vault-door medallion (instead of a portrait) at (1.28, 0.46), radius 0.24.
    SEAL  red toothed guilloche seal at (1.80, 0.40).
    corner rosettes behind the '100' numerals, rope-guilloche border, fine background lines.
HERO_UV / hero_xy() give the hero rosette centre (UV units / note-local metres).
"""
import math, random
import bpy, bmesh
from common import *

W, HGT = 0.156, 0.066
R = W / HGT
INK = (0.006, 0.072, 0.050)       # deep bottle-green intaglio ink (a little blue: warm keys push it olive)
INK_MID = (0.04, 0.19, 0.13)      # mid green (wreaths, corner rosettes, background lines)
TINT = (0.30, 0.60, 0.46)         # pale green underprint
TINT2 = (0.78, 0.66, 0.36)        # pale ochre underprint (medallion)
INK2 = (0.32, 0.03, 0.022)        # red seal / serial
PAPER = (0.68, 0.66, 0.54)        # cream rag paper

HERO_UV = (0.56, 0.50)
HERO_R = 0.14                     # rosette rim radius in note-height units (rho = 1)
MED_UV = (1.28, 0.46)
MED_R = 0.24
SEAL_UV = (1.80, 0.40)
SEAL_R = 0.12


def uv_to_xy(u, v):
    """Note-height UV units -> note-local metres (note centred on its origin)."""
    return (u * HGT - W / 2, (v - 0.5) * HGT)


def hero_xy():
    return uv_to_xy(*HERO_UV)


HERO_RADIUS_M = HERO_R * HGT      # 9.24 mm


# ----------------------------------------------------------------------------- node expressions

class X:
    """Scalar shader expression: arithmetic on wrapped sockets builds Math nodes (keeps patterns readable)."""

    def __init__(self, nb, sock):
        self.nb, self.s = nb, sock

    def _m(self, op, *args, clamp=False):
        nb = self.nb
        m = nb.N.new('ShaderNodeMath')
        m.operation = op
        m.use_clamp = clamp
        for i, v in enumerate(args):
            if isinstance(v, X):
                nb.L.new(v.s, m.inputs[i])
            else:
                m.inputs[i].default_value = float(v)
        return X(nb, m.outputs[0])

    def __add__(self, o): return self._m('ADD', self, o)
    def __radd__(self, o): return self._m('ADD', o, self)
    def __sub__(self, o): return self._m('SUBTRACT', self, o)
    def __rsub__(self, o): return self._m('SUBTRACT', o, self)
    def __mul__(self, o): return self._m('MULTIPLY', self, o)
    def __rmul__(self, o): return self._m('MULTIPLY', o, self)
    def __truediv__(self, o): return self._m('DIVIDE', self, o)
    def __neg__(self): return self._m('MULTIPLY', self, -1.0)
    def sin(self): return self._m('SINE', self)
    def cos(self): return self._m('COSINE', self)
    def abs(self): return self._m('ABSOLUTE', self)
    def sqrt(self): return self._m('SQRT', self)
    def fract(self): return self._m('FRACT', self)
    def clamp(self): return self._m('ADD', self, 0.0, clamp=True)
    def max(self, o): return self._m('MAXIMUM', self, o)
    def min(self, o): return self._m('MINIMUM', self, o)
    def atan2(self, x): return self._m('ARCTAN2', self, x)        # self = y

    def lin(self, a, b):
        """Clamped linear remap: a -> 0, b -> 1 (a > b allowed)."""
        mr = self.nb.N.new('ShaderNodeMapRange')
        mr.clamp = True
        self.nb.L.new(self.s, mr.inputs['Value'])
        for sock, val in ((mr.inputs['From Min'], a), (mr.inputs['From Max'], b)):
            if isinstance(val, X):
                self.nb.L.new(val.s, sock)
            else:
                sock.default_value = val
        return X(self.nb, mr.outputs[0])


def _xmax(*xs):
    out = xs[0]
    for x in xs[1:]:
        out = out.max(x)
    return out


def lines(phase, width):
    """1 on engraved lines where |sin(phase)| < width (line weight ~ width), soft edge for AA."""
    return phase.sin().abs().lin(width, width * 0.45)


def ring(rho, r0, hw):
    return (rho - r0).abs().lin(hw, hw * 0.4)


def band(rho, a, b, e=0.01):
    return rho.lin(a, a + e) * rho.lin(b, b - e)


def polar(u, v, c, scale):
    dx = (u - c[0]) / scale
    dy = (v - c[1]) / scale
    rho = (dx * dx + dy * dy).sqrt()
    th = dy.atan2(dx)
    return rho, th, dx, dy


TAU = 2 * math.pi


# ----------------------------------------------------------------------------- motifs

def _hero(u, v):
    """Main green rosette. Returns (dark_ink, mid_ink, tint)."""
    rho, th, _, _ = polar(u, v, HERO_UV, HERO_R)
    # zone A (centre, <-> dial medallion): small crossing rosette + solid centre
    ra = rho + (th * 8).sin() * 0.03
    za = _xmax(lines(th * 12 + ra * 52, 0.30), lines(th * 12 - ra * 52, 0.30)) * band(rho, 0.07, 0.30, 0.012)
    dot = rho.lin(0.055, 0.045)
    # milled band (<-> knob knurl)
    mill = lines(th * 40, 0.40) * band(rho, 0.335, 0.43, 0.006)
    # zone B (<-> dial face): crossing spiral guilloche with 12-petal modulation
    rb = rho + (th * 12).sin() * 0.035
    zb = _xmax(lines(th * 36 + rb * 105, 0.36), lines(th * 36 - rb * 105, 0.36)) * band(rho, 0.46, 0.94, 0.008)
    # finer petal rings woven over the outer half
    rb2 = rho + (th * 12 + math.pi / 12).sin() * 0.05
    zb2 = lines(rb2 * 120, 0.22) * band(rho, 0.64, 0.94, 0.03)
    # rim (<-> knurled dial rim): double ring + radial milling
    rim = _xmax(ring(rho, 0.955, 0.009), ring(rho, 1.0, 0.011), ring(rho, 0.32, 0.009), ring(rho, 0.445, 0.009),
                lines(th * 120, 0.42) * band(rho, 0.962, 0.993, 0.003))
    dark = _xmax(za, dot, mill, zb, zb2 * 0.9, rim)
    # wreath: crossing wavy rings in lighter ink, 16 lobes; the lines simply stop at a lobed envelope
    lobe = (th * 16).cos().abs()
    env = (rho - (lobe * 0.13 + 1.80)).lin(0.0, -0.02)
    w1 = lines((rho + (th * 16).sin() * 0.05) * 105, 0.30)
    w2 = lines((rho + (th * 16 + math.pi).sin() * 0.05) * 105, 0.30)
    wreath = w1.max(w2) * env * rho.lin(1.04, 1.07)
    tint = rho.lin(2.15, 1.85)
    return dark, wreath, tint


def _medallion(u, v):
    """Engraved vault door (tone rendered by line weight). Returns (dark_ink, tint)."""
    rho, th, dx, dy = polar(u, v, MED_UV, MED_R)
    lit = (th - 2.36).cos()                                  # light from top-left
    # door face: stepped rings; tone from the profile's slope facing the light
    slope = (rho * TAU * 3.0).cos()
    tone = (slope * lit * 0.45 + 0.45).clamp()               # 0 = lit, 1 = shadow
    face = lines(rho * TAU * 34, tone * 0.55 + 0.10) * band(rho, 0.17, 0.80, 0.01)
    # outer frame ring with radial milling + bolts
    frame = lines(th * 70, 0.42) * band(rho, 0.93, 1.0, 0.006)
    rings_ = _xmax(ring(rho, 0.80, 0.010), ring(rho, 0.93, 0.010), ring(rho, 1.0, 0.014))
    nb_ = 20
    ph = (th * (nb_ / TAU) + 0.5).fract() - 0.5               # -0.5..0.5 within one bolt sector
    bx = ph * (TAU / nb_) * rho
    by = rho - 0.865
    bd = (bx * bx + by * by).sqrt()
    hx, hy = bx + 0.012, by - 0.012
    hl = (hx * hx + hy * hy).sqrt().lin(0.016, 0.024)        # lit crescent left blank
    bolt = bd.lin(0.042, 0.036) * (hl * 0.9 + 0.1)
    # hand wheel: 5 spokes + rim + hub with ball knobs, densely cross-hatched (reads as a dark solid)
    ps = (th * (5 / TAU) + 0.5).fract() - 0.5
    perp = (ps * (TAU / 5) * rho).abs()
    spoke = perp.lin(0.034, 0.028) * band(rho, 0.15, 0.60, 0.01)
    wheel = (rho - 0.60).abs().lin(0.038, 0.032)
    knob_d = ((perp * perp) + (rho - 0.63) * (rho - 0.63)).sqrt()
    knob = knob_d.lin(0.07, 0.062)
    hub = rho.lin(0.17, 0.16)
    solid = _xmax(spoke, wheel, knob, hub)
    hatch1 = lines((u - v) * 230, 0.75)
    hatch2 = lines((u + v) * 230, 0.45)
    shade_side = (lit * -0.5 + 0.5)                          # far side darker
    hatched = solid * (hatch1.max(hatch2 * shade_side))
    gap = _xmax(perp.lin(0.055, 0.04) * band(rho, 0.15, 0.6, 0.01), (rho - 0.60).abs().lin(0.058, 0.042),
                knob_d.lin(0.09, 0.072), rho.lin(0.19, 0.17))
    face = face * (1 - gap)
    dark = _xmax(face, frame, rings_, bolt * (1 - gap), hatched)
    tint = rho.lin(1.3, 1.02)
    return dark, tint


def _seal(u, v):
    rho, th, _, _ = polar(u, v, SEAL_UV, SEAL_R)
    saw = (th * (32 / TAU)).fract()
    edge = rho - saw * 0.07
    inside = edge.lin(1.0, 0.98)
    g = _xmax(lines(th * 16 + rho * 45, 0.34), lines(th * 16 - rho * 45, 0.34)) * band(rho, 0.2, 0.86, 0.01)
    rr = _xmax(ring(rho, 0.88, 0.022), ring(edge, 0.985, 0.016), ring(rho, 0.2, 0.022), rho.lin(0.1, 0.08))
    return (g.max(rr)) * inside.max(rr)


def _corner(u, v, c, s):
    rho, th, _, _ = polar(u, v, c, s)
    g = _xmax(lines(th * 20 + rho * 34, 0.26), lines(th * 20 - rho * 34, 0.26)) * band(rho, 0.15, 1.0, 0.02)
    return g * 0.85, rho.lin(1.15, 0.95)


def _border(u, v):
    du = (u - 0.03).min((R - 0.03) - u)
    dv = (v - 0.035).min(0.965 - v)
    inside = du.lin(0.0, 0.002) * dv.lin(0.0, 0.002)
    d = du.min(dv)                                           # distance to the outer edge
    horiz = (du - dv).lin(-0.001, 0.001)                     # 1 in top/bottom bands
    t = u * horiz + (v + 7.3) * (1 - horiz)                  # coordinate along the band
    wob = (t * 60).sin() * 0.9
    rope = _xmax(lines(d * 300 + wob, 0.36), lines(d * 300 - wob, 0.36))
    bandm = d.lin(0.0, 0.002) * d.lin(0.062, 0.058)
    frame = _xmax(ring(d, 0.004, 0.0026), ring(d, 0.068, 0.0026), ring(d, 0.075, 0.0014))
    return (rope * bandm).max(frame) * inside


def _background(u, v):
    return lines((v + (u * 9).sin() * 0.012 + (u * 23).sin() * 0.004) * 260, 0.14)


def _field(u, v):
    """Mask of the open field inside the border (where the background lines are printed)."""
    return u.lin(0.1, 0.13) * u.lin(R - 0.1, R - 0.13) * v.lin(0.1, 0.13) * v.lin(0.9, 0.87)


# Regions: each gets its own copy of the print graph + bump; hard 0/1 Mix Shaders between them let Cycles
# skip the other regions' nodes (jump-if-zero), so a shading point only pays for the motifs near it.
SPLIT_AB, SPLIT_BC = 0.98, 1.58
SPLIT_HERO = 0.32                 # radius (note-height units) of the hero-only disc
CORNER1_UV, CORNER2_UV = (2.04, 0.70), (0.22, 0.17)


def _region(nb, u, v, region):
    """-> (tint_green, tint_ochre, dark, mid, red) X-expressions for one region of the note."""
    zero = u * 0.0
    border = _border(u, v)
    bg = _background(u, v) * _field(u, v)
    if region == 'H':                                        # disc around the hero rosette: nothing else there
        hd, hm, ht = _hero(u, v)
        return ht * 0.5, zero, hd, hm.max(bg * (1 - ht) * 0.55), zero
    if region == 'A':
        c2, ct2 = _corner(u, v, CORNER2_UV, 0.12)
        bg = bg * (1 - ct2)
        return ct2 * 0.45, zero, border * 0.92, c2.max(bg * 0.55), zero
    if region == 'B':
        md, mt = _medallion(u, v)
        bg = bg * (1 - mt)
        return zero, mt * 0.32, md.max(border * 0.92), bg * 0.55, zero
    sl = _seal(u, v)
    c1, ct1 = _corner(u, v, CORNER1_UV, 0.17)
    bg = bg * (1 - ct1)
    return ct1 * 0.45, zero, border * 0.92, c1.max(bg * 0.55), sl


# ----------------------------------------------------------------------------- material

def mat_banknote(name='Banknote', detail='hi'):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = new_mat(name)
    nb = NB(m)
    nt = m.node_tree
    out = nt.nodes['Material Output']
    nt.nodes.remove(principled(m))
    tc = nb.n('ShaderNodeTexCoord')
    mp = nb.n('ShaderNodeMapping', Scale=(R, 1.0, 1.0))
    nb.l(tc, 'UV', mp, 'Vector')
    sep = nb.n('ShaderNodeSeparateXYZ')
    nb.l(mp, 'Vector', sep, 0)
    u, v = X(nb, sep.outputs['X']), X(nb, sep.outputs['Y'])

    # shared: paper colour (cream, mottled) x a soft green -> cream -> ochre rainbow underprint
    fib = nb.n('ShaderNodeTexNoise', Scale=90.0, Detail=3.0, Roughness=0.65)
    nb.l(mp, 'Vector', fib, 'Vector')
    paper = nb.ramp(fib, 'Fac', [(0.3, tuple(c * 0.92 for c in PAPER)), (0.7, PAPER)])
    rainbow = nb.n('ShaderNodeValToRGB')
    els = rainbow.color_ramp.elements
    els[0].color = (0.90, 0.98, 0.88, 1.0)             # u = 0: green tint
    els[1].color = (0.98, 0.93, 0.84, 1.0)             # u = R: ochre tint
    els.new(0.38).color = (0.97, 0.99, 0.93, 1.0)
    els.new(0.63).color = (1.0, 0.97, 0.88, 1.0)
    nb.L.new((u / R).s, rainbow.inputs[0])
    base = nb.mix(paper, rainbow, 1.0, mode='MULTIPLY')
    # shared: ink density varies (intaglio wiping)
    blot = nb.n('ShaderNodeTexNoise', Scale=18.0, Detail=1.0)
    nb.l(mp, 'Vector', blot, 'Vector')
    dens = X(nb, blot.outputs['Fac']).lin(0.3, 0.7) * 0.2 + 0.8

    bsdfs = {}
    for region in 'HABC':
        tg, to, dark, mid, red = _region(nb, u, v, region)
        dark, mid, red = dark * dens, mid * dens, red * dens
        col = nb.mix(base, TINT2, to.s)
        col = nb.mix(col, TINT, tg.s)
        col = nb.mix(col, INK_MID, mid.s)
        col = nb.mix(col, INK, dark.s)
        col = nb.mix(col, INK2, red.s)
        p = nb.n('ShaderNodeBsdfPrincipled')
        p.inputs['Specular IOR Level'].default_value = 0.35
        nb.L.new(nb.out_of(col), p.inputs['Base Color'])
        ink = _xmax(dark, mid * 0.8, red)
        nb.L.new((ink * -0.3 + 0.68).s, p.inputs['Roughness'])        # ink a touch glossier than paper
        if detail == 'hi':
            # raised intaglio ink + paper fibres / tooth (heights tuned by eye under grazing light)
            f1 = nb.n('ShaderNodeTexNoise', Scale=170.0, Detail=2.0, Roughness=0.55)
            st1 = nb.n('ShaderNodeMapping', Rotation=(0, 0, 0.5), Scale=(1.0, 8.0, 1.0))
            nb.l(mp, 'Vector', st1, 'Vector')
            nb.l(st1, 'Vector', f1, 'Vector')
            f2 = nb.n('ShaderNodeTexNoise', Scale=150.0, Detail=2.0, Roughness=0.55)
            st2 = nb.n('ShaderNodeMapping', Rotation=(0, 0, -1.1), Scale=(1.0, 7.0, 1.0))
            nb.l(mp, 'Vector', st2, 'Vector')
            nb.l(st2, 'Vector', f2, 'Vector')
            grain = nb.n('ShaderNodeTexNoise', Scale=900.0, Detail=0.0)
            nb.l(mp, 'Vector', grain, 'Vector')
            fibres = X(nb, f1.outputs['Fac']).lin(0.55, 0.68).max(X(nb, f2.outputs['Fac']).lin(0.55, 0.68))
            hgt = ink * 24.0 + fibres * 5.0 + X(nb, grain.outputs['Fac']) * 1.2
            bmp = nb.n('ShaderNodeBump', Strength=1.0, Distance=1e-5)
            if 'Filter Width' in bmp.inputs:
                bmp.inputs['Filter Width'].default_value = 0.4
            nb.L.new(hgt.s, bmp.inputs['Height'])
            nb.l(bmp, 'Normal', p, 'Normal')
        bsdfs[region] = p
    fa = u._m('LESS_THAN', u, SPLIT_AB)                      # 1 in region A
    fc = u._m('GREATER_THAN', u, SPLIT_BC)                   # 1 in region C
    mbc = nb.n('ShaderNodeMixShader')
    nb.L.new(fc.s, mbc.inputs[0])
    nb.L.new(bsdfs['B'].outputs[0], mbc.inputs[1])
    nb.L.new(bsdfs['C'].outputs[0], mbc.inputs[2])
    hx_, hy_ = u - HERO_UV[0], v - HERO_UV[1]
    fh = u._m('LESS_THAN', hx_ * hx_ + hy_ * hy_, SPLIT_HERO ** 2)   # 1 inside the hero disc
    mah = nb.n('ShaderNodeMixShader')
    nb.L.new(fh.s, mah.inputs[0])
    nb.L.new(bsdfs['A'].outputs[0], mah.inputs[1])
    nb.L.new(bsdfs['H'].outputs[0], mah.inputs[2])
    mall = nb.n('ShaderNodeMixShader')
    nb.L.new(fa.s, mall.inputs[0])
    nb.L.new(mbc.outputs[0], mall.inputs[1])
    nb.L.new(mah.outputs[0], mall.inputs[2])
    nb.L.new(mall.outputs[0], out.inputs['Surface'])
    return m


def mat_note_ink(name='NoteInk', color=INK):
    m = bpy.data.materials.get(name)
    return m or mat_principled(name, color=color, rough=0.42, spec=0.4)


TEXTS = [  # (text, size m, (u, v), material key)
    ('TUMBLER RESERVE NOTE', 0.0040, (1.28, 0.845), 'ink'),
    ('WILL PAY THE BEARER ON DEMAND', 0.0016, (1.28, 0.775), 'ink'),
    ('ONE HUNDRED', 0.0034, (1.28, 0.145), 'ink'),
    ('100', 0.0110, (2.04, 0.70), 'ink'),
    ('100', 0.0075, (0.22, 0.17), 'ink'),
    ('TR 004417 B', 0.0028, (0.42, 0.875), 'red'),
    ('TR 004417 B', 0.0028, (2.00, 0.175), 'red'),
    ('SERIES  A', 0.0018, (1.80, 0.585), 'ink'),
]


def make_banknote(name='Note', detail='hi', coll=None, xs=24, ys=10):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=xs, y_segments=ys, size=0.5)
    uvl = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for lp in f.loops:
            lp[uvl].uv = (lp.vert.co.x + 0.5, lp.vert.co.y + 0.5)
    for v in bm.verts:
        v.co.x *= W
        v.co.y *= HGT
    o = from_bmesh(name, bm, coll, smooth=True)
    set_mat(o, mat_banknote('Banknote', 'hi') if detail == 'hi' else mat_banknote('BanknoteLo', 'lo'))
    if detail == 'hi':
        mats = {'ink': mat_note_ink('NoteInk', INK), 'red': mat_note_ink('NoteRed', INK2)}
        ext = 0.000008
        for i, (txt, size, (uu, vv), mk) in enumerate(TEXTS):
            t = text_mesh(txt, f'{name}_t{i}', size=size, extrude=ext, coll=coll, spacing=1.05)
            x, y = uv_to_xy(uu, vv)
            t.location = (x, y, ext + 0.000004)
            set_mat(t, mats[mk])
            parent(t, o, keep=False)
    return o


def conform(o, fn):
    """Set the paper's height to fn(x, y) (note-local metres) and make the text meshes follow it per vertex."""
    for vtx in o.data.vertices:
        vtx.co.z = fn(vtx.co.x, vtx.co.y)
    for ch in o.children:
        if ch.type == 'MESH':
            lx, ly = ch.location.x, ch.location.y
            for vtx in ch.data.vertices:
                vtx.co.z += fn(lx + vtx.co.x, ly + vtx.co.y)
    return o


def flutter(o, start, end, seed=0, bend=0.6, wave=0.004, speed=1.0):
    """Paper flutter: animated bend + a travelling wave along the note."""
    rng = random.Random(seed)
    b = o.modifiers.new('Bend', 'SIMPLE_DEFORM')
    b.deform_method = 'BEND'
    b.deform_axis = 'Y'
    b.angle = 0.0
    fr = start
    while fr <= end + 6:
        b.angle = rng.uniform(-bend, bend)
        b.keyframe_insert('angle', frame=fr)
        fr += rng.randint(3, 6) / speed
    w = o.modifiers.new('Wave', 'WAVE')
    w.use_normal = True
    w.use_x, w.use_y = True, False
    w.height = wave
    w.width = 0.05
    w.speed = 0.012 * speed
    w.time_offset = rng.uniform(-30, 0)
    return o
