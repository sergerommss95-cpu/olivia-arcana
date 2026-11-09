"""S5 WOODS OFF THE E19 — procedural forest-floor evidence tableau (FALSE FLOOR, Case No. 02).

Builders for: wet leaf litter (oak/beech prototypes scattered as linked copies on a numpy heightfield, so leaves
stack and props drape over them), shallow water patches, twigs, a torn black bin bag, damp paper items (till
receipt, torn envelope, folded document with abstract print lines), rough uncut-diamond pebbles, half a salami
baguette sandwich (cut face, bite), out-of-focus trunks with fake aerial-perspective fog, overcast lighting.

Everything is in metres. Scene layout is driven by a CamRig: props are placed by image coordinates (u, v in
-1..1) cast onto the ground, so the composition survives camera tweaks.

Usage (shot script):
    from ff import *; from woods import *
"""
import bpy, bmesh, math, random
import numpy as np
from mathutils import Vector, Matrix, Euler, noise as mnoise
from mathutils.bvhtree import BVHTree
from ff import *  # noqa: F401,F403  (common toolkit + brand)


# ============================================================================ numpy noise / fields

def _vnoise(X, Y, scale, seed):
    """Smooth value noise in [-1, 1] on arrays X, Y (metres)."""
    rs = np.random.RandomState(seed & 0x7fffffff)
    tab = rs.uniform(-1.0, 1.0, 1 << 16)
    xs = np.asarray(X, np.float64) * scale + 31.7 * (seed % 97)
    ys = np.asarray(Y, np.float64) * scale + 17.3 * (seed % 89)
    x0f, y0f = np.floor(xs), np.floor(ys)
    fx, fy = xs - x0f, ys - y0f
    x0, y0 = x0f.astype(np.int64), y0f.astype(np.int64)

    def h(ix, iy):
        return tab[((ix * 73856093) ^ (iy * 19349663)) & 0xFFFF]
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b, c, d = h(x0, y0), h(x0 + 1, y0), h(x0, y0 + 1), h(x0 + 1, y0 + 1)
    ab = a + (b - a) * sx
    cd = c + (d - c) * sx
    return ab + (cd - ab) * sy


def _fbm(X, Y, scale, seed, octaves=4, gain=0.5):
    tot, amp, norm = 0.0, 1.0, 0.0
    for k in range(octaves):
        tot = tot + amp * _vnoise(X, Y, scale * (2.0 ** k), seed + 101 * k)
        norm += amp
        amp *= gain
    return tot / norm


def _smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def _sstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def _box_blur(a, r, axis):
    if r <= 0:
        return a
    pad = [(0, 0), (0, 0)]
    pad[axis] = (r + 1, r)
    p = np.pad(a, pad, mode='edge')
    c = np.cumsum(p, axis=axis, dtype=np.float64)
    n = a.shape[axis]
    hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return ((hi - lo) / (2 * r + 1)).astype(np.float32)


def _max_filter(a, r):
    out = a.copy()
    for axis in (0, 1):
        src = out.copy()
        pad = [(0, 0), (0, 0)]
        pad[axis] = (r, r)
        p = np.pad(src, pad, mode='edge')
        n = src.shape[axis]
        for k in range(2 * r + 1):
            out = np.maximum(out, np.take(p, np.arange(k, k + n), axis=axis))
    return out


class HField:
    """Ground + litter heightfield on a regular grid; leaves stack on it and props drape over it."""

    def __init__(self, x0, x1, y0, y1, cell=0.004):
        self.x0, self.y0, self.c = x0, y0, cell
        self.nx = int(round((x1 - x0) / cell)) + 1
        self.ny = int(round((y1 - y0) / cell)) + 1
        xs = x0 + np.arange(self.nx) * cell
        ys = y0 + np.arange(self.ny) * cell
        self.X, self.Y = np.meshgrid(xs, ys)
        self.h = np.zeros((self.ny, self.nx), np.float32)
        self.occ = np.zeros((self.ny, self.nx), np.uint8)
        self.smooth = None

    def ij(self, x, y):
        fi = (np.asarray(y) - self.y0) / self.c
        fj = (np.asarray(x) - self.x0) / self.c
        return fi, fj

    def sample(self, x, y, arr=None):
        arr = self.h if arr is None else arr
        fi, fj = self.ij(x, y)
        fi = np.clip(fi, 0, self.ny - 1.001)
        fj = np.clip(fj, 0, self.nx - 1.001)
        i0, j0 = fi.astype(np.int64), fj.astype(np.int64)
        ti, tj = fi - i0, fj - j0
        a = arr[i0, j0]; b = arr[i0, j0 + 1]; c = arr[i0 + 1, j0]; d = arr[i0 + 1, j0 + 1]
        return (a * (1 - tj) + b * tj) * (1 - ti) + (c * (1 - tj) + d * tj) * ti

    def sample_s(self, x, y):
        if self.smooth is None:
            self.make_smooth()
        return self.sample(x, y, self.smooth)

    def occ_at(self, x, y):
        fi, fj = self.ij(x, y)
        i = np.clip(np.round(fi).astype(np.int64), 0, self.ny - 1)
        j = np.clip(np.round(fj).astype(np.int64), 0, self.nx - 1)
        return self.occ[i, j]

    def splat(self, P, thick=0.0008, dil=1):
        fi, fj = self.ij(P[:, 0], P[:, 1])
        i = np.round(fi).astype(np.int64)
        j = np.round(fj).astype(np.int64)
        z = (P[:, 2] + thick).astype(np.float32)
        ok = (i >= dil) & (i < self.ny - dil) & (j >= dil) & (j < self.nx - dil)
        i, j, z = i[ok], j[ok], z[ok]
        for di in range(-dil, dil + 1):
            for dj in range(-dil, dil + 1):
                np.maximum.at(self.h, (i + di, j + dj), z)

    def make_smooth(self, rmax=3, rblur=3):
        m = _max_filter(self.h, rmax)
        self.smooth = _box_blur(_box_blur(_box_blur(_box_blur(m, rblur, 0), rblur, 1), rblur, 0), rblur, 1)
        return self.smooth

    def stamp_object(self, objs, block=True, pad=0):
        """Ray-cast props straight down into the field (world space): raises h, marks occupancy."""
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        for o in (objs if isinstance(objs, (list, tuple)) else [objs]):
            if o.type != 'MESH':
                continue
            ev = o.evaluated_get(dg)
            me = ev.to_mesh()
            mw = o.matrix_world
            verts = [mw @ v.co for v in me.vertices]
            polys = [tuple(p.vertices) for p in me.polygons]
            ev.to_mesh_clear()
            if not polys:
                continue
            bvh = BVHTree.FromPolygons(verts, polys)
            xs = [v.x for v in verts]; ys = [v.y for v in verts]; zs = [v.z for v in verts]
            i0, j0 = self.ij(min(xs), min(ys)); i1, j1 = self.ij(max(xs), max(ys))
            i0, j0 = max(0, int(i0) - pad), max(0, int(j0) - pad)
            i1, j1 = min(self.ny - 1, int(i1) + 1 + pad), min(self.nx - 1, int(j1) + 1 + pad)
            top = max(zs) + 0.05
            for i in range(i0, i1 + 1):
                y = self.y0 + i * self.c
                for j in range(j0, j1 + 1):
                    x = self.x0 + j * self.c
                    hit = bvh.ray_cast(Vector((x, y, top)), Vector((0, 0, -1)), 2.0)
                    if hit[0] is not None:
                        if hit[0].z > self.h[i, j]:
                            self.h[i, j] = hit[0].z
                        if block:
                            self.occ[i, j] = 1
        self.smooth = None


# ============================================================================ camera rig

class CamRig:
    """Camera pose helper. Image coords u (left -1 .. right 1), v (bottom -1 .. top 1)."""

    def __init__(self, loc, target, lens=45.0, sensor=36.0, aspect=16 / 9, roll=0.0):
        self.loc, self.target = Vector(loc), Vector(target)
        self.lens, self.sensor, self.aspect, self.roll = lens, sensor, aspect, roll
        self.rot = look_rot(self.loc, self.target, roll).to_matrix()

    def ray(self, u, v):
        sw = self.sensor
        sh = sw / self.aspect
        d = Vector((u * sw / 2 / self.lens, v * sh / 2 / self.lens, -1.0))
        return (self.rot @ d).normalized()

    def ground(self, u, v, z=0.0):
        d = self.ray(u, v)
        t = (z - self.loc.z) / d.z
        return self.loc + d * t

    def project(self, p):
        q = self.rot.transposed() @ (Vector(p) - self.loc)
        sw = self.sensor
        sh = sw / self.aspect
        return (q.x / -q.z * self.lens / (sw / 2), q.y / -q.z * self.lens / (sh / 2), -q.z)

    def in_view(self, x, y, margin=0.15):
        """Vectorised: is ground point (x, y) roughly inside the frame (plus margin in image units)?"""
        R = np.array(self.rot.transposed())
        P = np.stack([np.asarray(x) - self.loc.x, np.asarray(y) - self.loc.y,
                      np.zeros_like(np.asarray(x, dtype=float)) - self.loc.z], -1)
        q = P @ R.T
        zc = -q[..., 2]
        sw = self.sensor
        sh = sw / self.aspect
        u = q[..., 0] / np.maximum(zc, 1e-4) * self.lens / (sw / 2)
        v = q[..., 1] / np.maximum(zc, 1e-4) * self.lens / (sh / 2)
        return (zc > 0.05) & (np.abs(u) < 1 + margin) & (np.abs(v) < 1 + margin * 2)


# ============================================================================ shader graph helper

class SG:
    """Socket-level node helper: every call returns output sockets, inputs accept sockets or constants."""

    def __init__(self, mat):
        self.nt = mat.node_tree
        self.N, self.L = self.nt.nodes, self.nt.links
        self._tc = None

    def node(self, kind, **props):
        n = self.N.new(kind)
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def feed(self, sock, v):
        if v is None:
            return
        if hasattr(v, 'is_output'):
            self.L.new(v, sock)
        elif hasattr(v, 'outputs'):
            self.L.new(v.outputs[0], sock)
        else:
            if isinstance(v, (tuple, list)) and len(v) == 3 and sock.type == 'RGBA':
                v = (*v, 1.0)
            if isinstance(v, (int, float)) and sock.type in ('RGBA', 'VECTOR'):
                v = (v, v, v, 1.0) if sock.type == 'RGBA' else (v, v, v)
            sock.default_value = v

    def tc(self):
        if self._tc is None:
            self._tc = self.node('ShaderNodeTexCoord')
        return self._tc

    def math(self, op, a, b=None, c=None, clamp=False):
        n = self.node('ShaderNodeMath', operation=op, use_clamp=clamp)
        self.feed(n.inputs[0], a)
        if b is not None:
            self.feed(n.inputs[1], b)
        if c is not None:
            self.feed(n.inputs[2], c)
        return n.outputs[0]

    def add(self, a, b, clamp=False): return self.math('ADD', a, b, clamp=clamp)
    def sub(self, a, b, clamp=False): return self.math('SUBTRACT', a, b, clamp=clamp)
    def mul(self, a, b, clamp=False): return self.math('MULTIPLY', a, b, clamp=clamp)
    def gt(self, a, b): return self.math('GREATER_THAN', a, b)
    def lt(self, a, b): return self.math('LESS_THAN', a, b)

    def vmath(self, op, a, b=None, scale=None):
        n = self.node('ShaderNodeVectorMath', operation=op)
        self.feed(n.inputs[0], a)
        if b is not None:
            self.feed(n.inputs[1], b)
        if scale is not None:
            self.feed(n.inputs[3], scale)
        return n.outputs['Value'] if op in ('LENGTH', 'DOT_PRODUCT', 'DISTANCE') else n.outputs['Vector']

    def maprange(self, v, a, b, c=0.0, d=1.0, clamp=True, interp='LINEAR'):
        n = self.node('ShaderNodeMapRange', clamp=clamp, interpolation_type=interp)
        self.feed(n.inputs[0], v)
        for i, val in zip((1, 2, 3, 4), (a, b, c, d)):
            self.feed(n.inputs[i], val)
        return n.outputs[0]

    def noise(self, vec, scale, detail=4.0, rough=0.5, dist=0.0, dims='3D', w=None):
        n = self.node('ShaderNodeTexNoise', noise_dimensions=dims)
        self.feed(n.inputs['Vector'], vec)
        n.inputs['Scale'].default_value = scale
        n.inputs['Detail'].default_value = detail
        n.inputs['Roughness'].default_value = rough
        n.inputs['Distortion'].default_value = dist
        if w is not None:
            self.feed(n.inputs['W'], w)
        return n.outputs[0], n.outputs[1]

    def voronoi(self, vec, scale, feature='F1', rand=1.0, dims='3D'):
        n = self.node('ShaderNodeTexVoronoi', feature=feature, voronoi_dimensions=dims)
        self.feed(n.inputs['Vector'], vec)
        n.inputs['Scale'].default_value = scale
        n.inputs['Randomness'].default_value = rand
        return n

    def white(self, vec=None, w=None, dims='3D'):
        n = self.node('ShaderNodeTexWhiteNoise', noise_dimensions=dims)
        if vec is not None:
            self.feed(n.inputs['Vector'], vec)
        if w is not None:
            self.feed(n.inputs['W'], w)
        return n.outputs['Value']

    def ramp(self, fac, stops, interp='LINEAR'):
        r = self.node('ShaderNodeValToRGB')
        r.color_ramp.interpolation = interp
        els = r.color_ramp.elements
        while len(els) < len(stops):
            els.new(0.5)
        for e, (pos, col) in zip(els, stops):
            e.position = pos
            col = (col,) * 3 if isinstance(col, (int, float)) else col
            e.color = (*col, 1.0) if len(col) == 3 else col
        self.feed(r.inputs[0], fac)
        return r.outputs['Color']

    def mixc(self, fac, a, b, mode='MIX', clamp=False):
        n = self.node('ShaderNodeMix', data_type='RGBA', blend_type=mode, clamp_result=clamp)
        self.feed(n.inputs[0], fac)
        self.feed(n.inputs[6], a)
        self.feed(n.inputs[7], b)
        return n.outputs[2]

    def mixf(self, fac, a, b):
        n = self.node('ShaderNodeMix', data_type='FLOAT')
        self.feed(n.inputs[0], fac)
        self.feed(n.inputs[2], a)
        self.feed(n.inputs[3], b)
        return n.outputs[0]

    def sep(self, vec):
        n = self.node('ShaderNodeSeparateXYZ')
        self.feed(n.inputs[0], vec)
        return n.outputs[0], n.outputs[1], n.outputs[2]

    def comb(self, x, y, z):
        n = self.node('ShaderNodeCombineXYZ')
        self.feed(n.inputs[0], x); self.feed(n.inputs[1], y); self.feed(n.inputs[2], z)
        return n.outputs[0]

    def attr(self, name):
        n = self.node('ShaderNodeAttribute', attribute_name=name)
        return n

    def bump(self, height, strength, distance, normal=None):
        n = self.node('ShaderNodeBump')
        self.feed(n.inputs['Height'], height)
        n.inputs['Strength'].default_value = strength
        n.inputs['Distance'].default_value = distance
        if normal is not None:
            self.feed(n.inputs['Normal'], normal)
        return n.outputs['Normal']

    def principled(self):
        return self.N.get('Principled BSDF')

    def out(self):
        return self.N.get('Material Output')


def _pset(p, **kw):
    for k, v in kw.items():
        sock = p.inputs[k.replace('_', ' ')]
        if isinstance(v, (tuple, list)) and len(v) == 3 and sock.type == 'RGBA':
            v = (*v, 1.0)
        sock.default_value = v


# ============================================================================ fog (fake aerial perspective)

FOG = {'color': (0.58, 0.61, 0.635), 'strength': 1.0, 'start': 1.6, 'dist': 7.5, 'max': 0.985, 'zfall': 3.0}


def fog_wrap(mat, fog=None):
    """Mix the material's surface toward a fog emission by camera distance (cheap stand-in for a volume)."""
    fog = fog or FOG
    g = SG(mat)
    out = g.out()
    if not out.inputs['Surface'].links:
        return mat
    src = out.inputs['Surface'].links[0].from_socket
    cam = g.node('ShaderNodeCameraData')
    d = g.math('MAXIMUM', g.sub(cam.outputs['View Distance'], fog['start']), 0.0)
    geo = g.node('ShaderNodeNewGeometry')
    _, _, z = g.sep(geo.outputs['Position'])
    # thinner fog higher up: effective distance scale grows with height
    dd = g.mul(fog['dist'], g.add(1.0, g.math('MAXIMUM', g.mul(z, 1.0 / fog['zfall']), 0.0)))
    f = g.mul(g.sub(1.0, g.math('EXPONENT', g.mul(g.math('DIVIDE', d, dd), -1.0))), fog['max'])
    em = g.node('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*fog['color'], 1)
    lp = g.node('ShaderNodeLightPath')
    # secondary rays (wet-leaf reflections at grazing angles) see a dimmer fog wall than the lens does
    g.feed(em.inputs['Strength'], g.mul(fog['strength'], g.mixf(lp.outputs['Is Camera Ray'], fog.get('refl', 0.4), 1.0)))
    mx = g.node('ShaderNodeMixShader')
    g.feed(mx.inputs[0], f)
    g.L.new(src, mx.inputs[1])
    g.L.new(em.outputs[0], mx.inputs[2])
    g.L.new(mx.outputs[0], out.inputs['Surface'])
    return mat


def woods_world(sky_zenith=(0.62, 0.66, 0.70), sky_horizon=(0.07, 0.075, 0.08), strength=1.0, fog=None):
    """Overcast dome for lighting; camera rays see the flat fog colour."""
    fog = fog or FOG
    w = world_color((0.5, 0.5, 0.5), 1.0)
    nt = w.node_tree
    g = SG(w)
    bg = nt.nodes['Background']
    tc = g.node('ShaderNodeTexCoord')
    _, _, z = g.sep(tc.outputs['Generated'])
    # forest: low elevations are trunks and undergrowth (dark), open sky only overhead through bare crowns
    sky = g.ramp(g.maprange(z, -0.05, 0.9), [(0.0, sky_horizon), (0.35, tuple(c * 0.35 + h * 0.65 for c, h in
                 zip(sky_zenith, sky_horizon))), (1.0, sky_zenith)])
    g.feed(bg.inputs['Color'], sky)
    bg.inputs['Strength'].default_value = strength
    bg2 = g.node('ShaderNodeBackground')
    bg2.inputs['Color'].default_value = (*fog['color'], 1)
    bg2.inputs['Strength'].default_value = fog['strength']
    lp = g.node('ShaderNodeLightPath')
    mx = g.node('ShaderNodeMixShader')
    g.feed(mx.inputs[0], lp.outputs['Is Camera Ray'])
    g.L.new(bg.outputs[0], mx.inputs[1])
    g.L.new(bg2.outputs[0], mx.inputs[2])
    out = nt.nodes['World Output']
    g.L.new(mx.outputs[0], out.inputs['Surface'])
    return w


# ============================================================================ materials

def mat_leaf(name='Leaf'):
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    oi = g.node('ShaderNodeObjectInfo')
    tc = g.tc()
    u, v, _ = g.sep(tc.outputs['UV'])
    vn = g.mul(g.math('ABSOLUTE', g.sub(v, 0.5)), 2.0)          # 0 midrib .. 1 margin
    veinf = g.attr('veinf').outputs['Factor']
    rnd = oi.outputs['Random']
    rnd2 = g.math('FRACT', g.mul(rnd, 13.37))
    rnd3 = g.math('FRACT', g.mul(rnd, 71.3))
    co = g.vmath('ADD', tc.outputs['Object'], g.vmath('SCALE', oi.outputs['Location'], scale=7.0))
    # per-leaf base colour: decayed umber .. brown .. tan oak .. muted copper beech
    base = g.ramp(rnd, [(0.0, (0.010, 0.0075, 0.006)), (0.08, (0.014, 0.009, 0.006)), (0.24, (0.040, 0.018, 0.007)),
                        (0.48, (0.080, 0.032, 0.010)), (0.72, (0.150, 0.055, 0.014)), (0.9, (0.200, 0.085, 0.022)),
                        (1.0, (0.175, 0.062, 0.016))])
    mott_f, _ = g.noise(co, 38.0, 6.0, 0.6)
    mott = g.ramp(mott_f, [(0.3, 0.62), (0.55, 1.0), (0.75, 1.12)])
    col = g.mixc(1.0, base, mott, 'MULTIPLY')
    # decay blotches (dark, irregular) on some leaves
    bl_f, _ = g.noise(co, 22.0, 4.0, 0.55, dist=0.4)
    blot = g.mul(g.maprange(bl_f, 0.58, 0.68), g.maprange(rnd3, 0.3, 0.9))
    col = g.mixc(blot, col, (0.016, 0.009, 0.005))
    # veins: midrib + oblique laterals
    mid = g.maprange(vn, 0.0, 0.07, 1.0, 0.0)
    lat = g.math('FRACT', g.sub(g.mul(u, veinf), g.mul(vn, 0.85)))
    latl = g.maprange(g.math('ABSOLUTE', g.sub(lat, 0.5)), 0.43, 0.5)
    latl = g.mul(latl, g.maprange(vn, 0.95, 0.6))
    veins = g.math('MAXIMUM', mid, g.mul(latl, 0.7))
    col = g.mixc(g.mul(veins, 0.3), col, g.mixc(1.0, col, (1.7, 1.45, 1.25), 'MULTIPLY'))
    # margins darker and drier
    edge = g.maprange(vn, 0.72, 1.0)
    col = g.mixc(g.mul(edge, 0.35), col, (0.014, 0.008, 0.005))
    # undersides paler/greyer
    geo = g.node('ShaderNodeNewGeometry')
    col = g.mixc(g.mul(geo.outputs['Backfacing'], 0.3), col, g.mixc(0.5, col, (0.16, 0.10, 0.06)))
    # wetness: per-leaf + patches
    wn_f, _ = g.noise(co, 16.0, 4.0, 0.55, dist=0.25)
    wpatch = g.maprange(wn_f, 0.52, 0.6)                        # glossy wet patches (film of water)
    damp = g.maprange(rnd2, 0.1, 0.9, 0.25, 0.9)                 # per-leaf soak (darkening)
    wet = g.math('MAXIMUM', g.mul(wpatch, g.maprange(rnd2, 0.0, 0.5, 0.45, 1.0)), g.mul(damp, 0.35))
    col = g.mixc(g.mul(damp, 0.55), col, g.mixc(1.0, col, (0.62, 0.5, 0.42), 'MULTIPLY'))
    col = g.mixc(g.mul(wpatch, 0.35), col, g.mixc(1.0, col, (0.7, 0.58, 0.5), 'MULTIPLY'))
    g.feed(p.inputs['Base Color'], col)
    g.feed(p.inputs['Roughness'], g.mixf(wpatch, 0.74, 0.1))
    g.feed(p.inputs['Coat Weight'], g.mul(wpatch, 0.65))
    g.feed(p.inputs['Specular IOR Level'], g.mixf(wpatch, 0.2, 0.5))
    _pset(p, Coat_Roughness=0.04)
    fine_f, _ = g.noise(co, 420.0, 3.0, 0.6)
    h = g.add(g.mul(veins, 0.6), g.mul(fine_f, 0.4))
    nrm = g.bump(h, 0.22, 0.0007)
    g.feed(p.inputs['Normal'], nrm)
    # thin-leaf translucency
    tr = g.node('ShaderNodeBsdfTranslucent')
    g.feed(tr.inputs['Color'], g.mixc(1.0, col, (1.5, 1.25, 1.0), 'MULTIPLY'))
    mx = g.node('ShaderNodeMixShader')
    mx.inputs[0].default_value = 0.16
    g.L.new(p.outputs[0], mx.inputs[1])
    g.L.new(tr.outputs[0], mx.inputs[2])
    g.L.new(mx.outputs[0], g.out().inputs['Surface'])
    return m


def mat_soil(name='Soil', far_from=2.2, far_to=3.6):
    """Dark wet humus near; leaf-mosaic litter texture far (behind the scattered leaves)."""
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    tc = g.tc()
    co = tc.outputs['Object']
    _, y, _ = g.sep(co)
    n1, _ = g.noise(co, 9.0, 8.0, 0.6)
    soil = g.ramp(n1, [(0.3, (0.008, 0.0055, 0.004)), (0.6, (0.016, 0.010, 0.0065)), (0.8, (0.026, 0.017, 0.010))])
    bits = g.voronoi(co, 220.0, 'F1')
    bit = g.mul(g.maprange(bits.outputs['Distance'], 0.1, 0.35, 1.0, 0.0), g.gt(g.sep(bits.outputs['Color'])[0], 0.6))
    soil = g.mixc(g.mul(bit, 0.8), soil, (0.05, 0.022, 0.008))
    # leaf mosaic: distorted voronoi cells ~ leaf size, coloured from the leaf palette
    dn, dc = g.noise(co, 8.0, 2.0, 0.5)
    co2 = g.vmath('ADD', co, g.vmath('SCALE', g.vmath('SUBTRACT', dc, (0.5, 0.5, 0.5)), scale=0.05))
    vo = g.voronoi(co2, 16.0, 'F1')
    cell = vo.outputs['Color']
    cr, _, _ = g.sep(cell)
    litter = g.ramp(cr, [(0.0, (0.03, 0.018, 0.010)), (0.3, (0.075, 0.04, 0.018)), (0.6, (0.14, 0.072, 0.03)),
                         (0.85, (0.22, 0.12, 0.05)), (1.0, (0.17, 0.07, 0.027))])
    ve = g.voronoi(co2, 16.0, 'DISTANCE_TO_EDGE')
    gap = g.maprange(ve.outputs['Distance'], 0.0, 0.06, 1.0, 0.0)
    litter = g.mixc(g.mul(gap, 0.8), litter, (0.02, 0.013, 0.008))
    far = g.maprange(y, far_from, far_to)
    col = g.mixc(far, soil, litter)
    g.feed(p.inputs['Base Color'], col)
    wn, _ = g.noise(co, 3.0, 3.0, 0.5)
    wet = g.maprange(wn, 0.4, 0.6, 0.2, 0.8)
    g.feed(p.inputs['Roughness'], g.mixf(far, g.mixf(wet, 0.7, 0.18), 0.7))
    g.feed(p.inputs['Coat Weight'], g.mul(g.mul(wet, 0.4), g.sub(1.0, far)))
    _pset(p, Coat_Roughness=0.1)
    hb, _ = g.noise(co, 120.0, 6.0, 0.6)
    g.feed(p.inputs['Normal'], g.bump(g.add(hb, gap), 0.35, 0.002))
    return m


def mat_bark(name='Bark', moss=True):
    """Beech (smooth grey, lichen, wet streaks) or oak (dark, furrowed) picked per object."""
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    tc = g.tc()
    oi = g.node('ShaderNodeObjectInfo')
    co = g.vmath('ADD', tc.outputs['Object'], g.vmath('SCALE', oi.outputs['Location'], scale=3.0))
    stretch = g.vmath('MULTIPLY', co, (6.0, 6.0, 0.5))
    st, _ = g.noise(stretch, 3.0, 6.0, 0.6)
    beech = g.ramp(st, [(0.3, (0.11, 0.115, 0.105)), (0.6, (0.19, 0.195, 0.18)), (0.8, (0.24, 0.245, 0.225))])
    lf, _ = g.noise(co, 9.0, 5.0, 0.65)
    beech = g.mixc(g.maprange(lf, 0.58, 0.66, 0.0, 0.7), beech, (0.30, 0.32, 0.26))
    fur = g.vmath('MULTIPLY', co, (30.0, 30.0, 2.5))
    ff_, _ = g.noise(fur, 1.0, 5.0, 0.7)
    oak = g.ramp(ff_, [(0.35, (0.022, 0.019, 0.016)), (0.6, (0.06, 0.052, 0.042)), (0.75, (0.085, 0.078, 0.066))])
    is_oak = g.gt(oi.outputs['Random'], 0.72)
    col = g.mixc(is_oak, beech, oak)
    if moss:
        _, _, z = g.sep(tc.outputs['Object'])
        mn, _ = g.noise(co, 6.0, 4.0, 0.6)
        mz = g.sub(g.maprange(z, 0.45, 0.05), g.maprange(mn, 0.35, 0.65, 0.7, -0.1), clamp=True)
        col = g.mixc(mz, col, (0.035, 0.05, 0.018))
    g.feed(p.inputs['Base Color'], col)
    _pset(p, Roughness=0.72, Specular_IOR_Level=0.35)
    g.feed(p.inputs['Normal'], g.bump(g.mixf(is_oak, st, ff_), 0.5, 0.01))
    return m


def mat_twig(name='Twig'):
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    tc = g.tc()
    oi = g.node('ShaderNodeObjectInfo')
    co = g.vmath('ADD', tc.outputs['Object'], g.vmath('SCALE', oi.outputs['Location'], scale=5.0))
    n1, _ = g.noise(co, 140.0, 6.0, 0.6)
    col = g.ramp(n1, [(0.3, (0.012, 0.010, 0.008)), (0.6, (0.032, 0.025, 0.018)), (0.8, (0.055, 0.045, 0.034))])
    li = g.voronoi(co, 260.0, 'F1')
    lic = g.mul(g.maprange(li.outputs['Distance'], 0.12, 0.3, 1.0, 0.0), g.gt(g.sep(li.outputs['Color'])[0], 0.86))
    col = g.mixc(lic, col, (0.13, 0.14, 0.11))
    g.feed(p.inputs['Base Color'], col)
    _pset(p, Roughness=0.7, Coat_Weight=0.25, Coat_Roughness=0.2)
    rid = g.vmath('MULTIPLY', co, (400.0, 400.0, 400.0))
    n2, _ = g.noise(rid, 1.0, 4.0, 0.7)
    g.feed(p.inputs['Normal'], g.bump(g.add(n1, n2), 0.7, 0.0008))
    return m


def mat_binbag(name='BinBag'):
    """Black LDPE film: low-ish roughness sheen, crinkle creases, wet patches, stretch-whitening at the tear."""
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    co = g.tc().outputs['Object']
    tear = g.attr('tear').outputs['Factor']
    n1, _ = g.noise(co, 9.0, 4.0, 0.5)
    rough = g.maprange(n1, 0.35, 0.65, 0.22, 0.42)
    # crinkle creases: voronoi edges (sharp lines) at two scales
    dn, dc = g.noise(co, 20.0, 2.0, 0.5)
    cod = g.vmath('ADD', co, g.vmath('SCALE', g.vmath('SUBTRACT', dc, (0.5, 0.5, 0.5)), scale=0.02))
    v1 = g.voronoi(cod, 28.0, 'DISTANCE_TO_EDGE')
    v2 = g.voronoi(cod, 75.0, 'DISTANCE_TO_EDGE')
    c1 = g.maprange(v1.outputs['Distance'], 0.0, 0.08, 0.0, 1.0, interp='SMOOTHSTEP')
    c2 = g.maprange(v2.outputs['Distance'], 0.0, 0.1, 0.0, 1.0, interp='SMOOTHSTEP')
    h = g.add(g.mul(c1, 0.7), g.mul(c2, 0.3))
    # stretch whitening near the tear: streaky grey
    sn, _ = g.noise(g.vmath('MULTIPLY', co, (60.0, 60.0, 12.0)), 1.0, 3.0, 0.5)
    whit = g.mul(tear, g.maprange(sn, 0.35, 0.65, 0.3, 1.0))
    col = g.mixc(whit, (0.0075, 0.0075, 0.0085), (0.055, 0.056, 0.06))
    g.feed(p.inputs['Base Color'], col)
    g.feed(p.inputs['Roughness'], g.mixf(whit, rough, 0.55))
    wn, _ = g.noise(co, 6.0, 3.0, 0.5)
    g.feed(p.inputs['Coat Weight'], g.maprange(wn, 0.45, 0.62, 0.0, 0.45))
    _pset(p, Coat_Roughness=0.05, Specular_IOR_Level=0.45)
    g.feed(p.inputs['Normal'], g.bump(h, 0.35, 0.002))
    return m


def _text_ink(g, u, v, box, nlines, cpl, seed, minlen=0.35, blank=0.1, gap=0.14, band=(0.28, 0.70)):
    """Abstract typewritten lines inside box (u0, v0, u1, v1) of UV space -> ink factor socket (0..1)."""
    u0, v0, u1, v1 = box
    uu = g.math('DIVIDE', g.sub(u, u0), u1 - u0)
    vv = g.math('DIVIDE', g.sub(v1, v), v1 - v0)          # lines run top -> bottom
    inside = g.mul(g.mul(g.gt(uu, 0.0), g.lt(uu, 1.0)), g.mul(g.gt(vv, 0.0), g.lt(vv, 1.0)))
    L = g.mul(vv, nlines)
    li = g.math('FLOOR', L)
    lf = g.sub(L, li)
    r1 = g.white(w=g.add(li, seed * 17.31), dims='1D')
    r2 = g.white(w=g.add(g.mul(li, 1.73), seed * 3.1 + 100.0), dims='1D')
    linelen = g.add(minlen, g.mul(r1, 1.0 - minlen))
    linemask = g.mul(g.lt(uu, linelen), g.gt(r2, blank))
    C = g.mul(uu, cpl)
    ci = g.math('FLOOR', C)
    cf = g.sub(C, ci)
    cr = g.white(vec=g.comb(ci, li, seed * 1.0 + 0.5))
    notgap = g.gt(cr, gap)
    glyphx = g.mul(g.gt(cf, 0.14), g.lt(cf, 0.86))
    top = g.add(band[1], g.mul(g.gt(cr, 0.78), 0.14))
    bot = g.sub(band[0], g.mul(g.lt(cr, 0.22), 0.1))
    glyphy = g.mul(g.gt(lf, bot), g.lt(lf, top))
    # sub-glyph structure so close-ups read as letterforms, not bars
    sub = g.white(vec=g.comb(g.math('FLOOR', g.mul(C, 3.0)), g.math('FLOOR', g.mul(L, 4.0)), seed + 7.0))
    subm = g.gt(sub, 0.32)
    ink = g.mul(g.mul(g.mul(inside, linemask), g.mul(notgap, glyphx)), g.mul(glyphy, subm))
    return ink


def mat_paper(name, base=(0.80, 0.78, 0.72), kind='plain', wet_amt=0.6, ink_col=(0.035, 0.035, 0.04), seed=1,
              ink_strength=0.9, rough=0.62):
    """Damp paper: edges and patches go darker/greyer and translucent; optional abstract print by kind."""
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    tc = g.tc()
    co = tc.outputs['Object']
    u, v, _ = g.sep(tc.outputs['UV'])
    edge = g.attr('edge').outputs['Factor']
    # wetness: edge-borne + blotches
    wn, _ = g.noise(co, 18.0, 4.0, 0.6, dist=0.3)
    we = g.maprange(edge, 0.0, 0.018, 1.0, 0.0)
    wb = g.maprange(wn, 0.52, 0.6)
    wet = g.mul(g.math('MAXIMUM', g.mul(we, g.maprange(wn, 0.3, 0.6, 0.4, 1.0)), wb), wet_amt)
    dn, _ = g.noise(co, 60.0, 5.0, 0.6)
    col = g.mixc(1.0, base, g.ramp(dn, [(0.3, 0.9), (0.7, 1.03)]), 'MULTIPLY')
    col = g.mixc(g.mul(wet, 0.55), col, g.mixc(1.0, base, (0.55, 0.52, 0.47), 'MULTIPLY'))
    # mud / dirt specks and a soil tide-line
    sp = g.voronoi(co, 900.0, 'F1')
    spk = g.mul(g.maprange(sp.outputs['Distance'], 0.05, 0.2, 1.0, 0.0), g.gt(g.sep(sp.outputs['Color'])[0], 0.9))
    col = g.mixc(g.mul(spk, 0.8), col, (0.06, 0.045, 0.03))
    ink = None
    if kind == 'receipt':
        parts = [
            _text_ink(g, u, v, (0.22, 0.90, 0.78, 0.96), 2, 14, seed + 1, minlen=0.6, blank=0.0, gap=0.08),
            _text_ink(g, u, v, (0.12, 0.84, 0.88, 0.885), 1, 26, seed + 2, minlen=0.8, blank=0.0, gap=0.12),
            _text_ink(g, u, v, (0.07, 0.40, 0.60, 0.80), 13, 17, seed + 3, minlen=0.4, blank=0.05, gap=0.16),
            _text_ink(g, u, v, (0.72, 0.40, 0.93, 0.80), 13, 6, seed + 4, minlen=0.85, blank=0.05, gap=0.0),
            _text_ink(g, u, v, (0.07, 0.30, 0.93, 0.35), 1, 22, seed + 5, minlen=0.98, blank=0.0, gap=0.25,
                      band=(0.2, 0.8)),
            _text_ink(g, u, v, (0.15, 0.10, 0.85, 0.24), 4, 24, seed + 6, minlen=0.5, blank=0.15, gap=0.12),
        ]
        dash = g.mul(g.lt(g.math('FRACT', g.mul(u, 46.0)), 0.6),
                     g.mul(g.lt(g.math('ABSOLUTE', g.sub(v, 0.825)), 0.0035), g.mul(g.gt(u, 0.06), g.lt(u, 0.94))))
        dash2 = g.mul(g.lt(g.math('FRACT', g.mul(u, 46.0)), 0.6),
                      g.mul(g.lt(g.math('ABSOLUTE', g.sub(v, 0.375)), 0.0035), g.mul(g.gt(u, 0.06), g.lt(u, 0.94))))
        ink = dash
        for s in parts + [dash2]:
            ink = g.math('MAXIMUM', ink, s)
        fade, _ = g.noise(co, 25.0, 3.0, 0.5)
        ink = g.mul(ink, g.maprange(fade, 0.3, 0.7, 0.35, 0.8))
    elif kind == 'document':
        logo = g.mul(g.mul(g.gt(u, 0.09), g.lt(u, 0.17)), g.mul(g.gt(v, 0.905), g.lt(v, 0.955)))
        logo_hole = g.mul(g.mul(g.gt(u, 0.115), g.lt(u, 0.145)), g.mul(g.gt(v, 0.92), g.lt(v, 0.94)))
        logo = g.sub(logo, logo_hole, clamp=True)
        parts = [
            logo,
            _text_ink(g, u, v, (0.62, 0.90, 0.91, 0.96), 3, 26, seed + 1, minlen=0.5, blank=0.0, gap=0.12),
            _text_ink(g, u, v, (0.09, 0.80, 0.70, 0.84), 1, 30, seed + 2, minlen=0.9, blank=0.0, gap=0.1,
                      band=(0.18, 0.82)),
            _text_ink(g, u, v, (0.09, 0.47, 0.91, 0.77), 16, 64, seed + 3, minlen=0.55, blank=0.1, gap=0.15),
            _text_ink(g, u, v, (0.09, 0.16, 0.91, 0.45), 15, 64, seed + 4, minlen=0.5, blank=0.12, gap=0.15),
            _text_ink(g, u, v, (0.55, 0.06, 0.91, 0.12), 2, 24, seed + 5, minlen=0.6, blank=0.0, gap=0.1),
        ]
        ink = parts[0]
        for s in parts[1:]:
            ink = g.math('MAXIMUM', ink, s)
        fade, _ = g.noise(co, 30.0, 3.0, 0.5)
        ink = g.mul(ink, g.maprange(fade, 0.3, 0.7, 0.6, 0.95))
    elif kind == 'envelope':
        # back seams: two diagonal side-flap lines and the bottom-flap edge (subtle shading, not ink)
        s1 = g.math('ABSOLUTE', g.sub(v, g.sub(1.0, g.mul(u, 1.15))))
        s2 = g.math('ABSOLUTE', g.sub(v, g.sub(1.0, g.mul(g.sub(1.0, u), 1.15))))
        bot = g.math('ABSOLUTE', g.sub(v, g.add(0.42, g.mul(g.math('ABSOLUTE', g.sub(u, 0.5)), -0.25))))
        seam = g.math('MINIMUM', g.math('MINIMUM', s1, s2), bot)
        seam_l = g.mul(g.maprange(seam, 0.0, 0.012, 1.0, 0.0), g.lt(v, 1.0))
        col = g.mixc(g.mul(seam_l, 0.35), col, g.mixc(1.0, col, (0.62, 0.6, 0.56), 'MULTIPLY'))
        g.feed(p.inputs['Normal'], g.bump(g.add(seam_l, g.mul(dn, 0.3)), 0.25, 0.0008))
    if ink is not None:
        ink = g.mul(ink, ink_strength)
        # ink bleeds lighter where wet
        ink = g.mul(ink, g.sub(1.0, g.mul(wet, 0.45)))
        col = g.mixc(ink, col, ink_col)
    g.feed(p.inputs['Base Color'], col)
    g.feed(p.inputs['Roughness'], g.mixf(wet, rough, 0.3))
    g.feed(p.inputs['Coat Weight'], g.mul(wet, 0.6))
    _pset(p, Coat_Roughness=0.12, Specular_IOR_Level=0.4)
    if kind != 'envelope':
        fib, _ = g.noise(co, 700.0, 4.0, 0.6)
        g.feed(p.inputs['Normal'], g.bump(g.add(g.mul(fib, 0.7), g.mul(dn, 0.3)), 0.12, 0.0006))
    tr = g.node('ShaderNodeBsdfTranslucent')
    g.feed(tr.inputs['Color'], g.mixc(1.0, col, (0.95, 0.9, 0.8), 'MULTIPLY'))
    mx = g.node('ShaderNodeMixShader')
    g.feed(mx.inputs[0], g.add(0.12, g.mul(wet, 0.38)))
    g.L.new(p.outputs[0], mx.inputs[1])
    g.L.new(tr.outputs[0], mx.inputs[2])
    g.L.new(mx.outputs[0], g.out().inputs['Surface'])
    return m


def mat_crust(name='Crust'):
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    co = g.tc().outputs['Object']
    score = g.attr('score').outputs['Factor']
    geo = g.node('ShaderNodeNewGeometry')
    _, _, nz = g.sep(geo.outputs['Normal'])
    n1, _ = g.noise(co, 55.0, 8.0, 0.62, dist=0.2)
    col = g.ramp(n1, [(0.25, (0.075, 0.036, 0.014)), (0.5, (0.20, 0.10, 0.038)), (0.75, (0.36, 0.215, 0.095))])
    # tops bake darker
    col = g.mixc(g.mul(g.maprange(nz, 0.2, 0.9), 0.45), col, g.mixc(1.0, col, (0.5, 0.42, 0.36), 'MULTIPLY'))
    # opened score: paler, rougher crumb-crust
    col = g.mixc(score, col, (0.46, 0.34, 0.19))
    # flour specks
    fl, _ = g.noise(co, 900.0, 2.0, 0.5)
    col = g.mixc(g.mul(g.maprange(fl, 0.66, 0.72), 0.6), col, (0.62, 0.55, 0.45))
    # damp darker patches from the leaves
    dn, _ = g.noise(co, 30.0, 3.0, 0.5)
    damp = g.maprange(dn, 0.55, 0.65, 0.0, 0.5)
    col = g.mixc(damp, col, g.mixc(1.0, col, (0.6, 0.55, 0.5), 'MULTIPLY'))
    g.feed(p.inputs['Base Color'], col)
    g.feed(p.inputs['Roughness'], g.mixf(score, g.mixf(damp, 0.5, 0.35), 0.75))
    _pset(p, Coat_Weight=0.18, Coat_Roughness=0.25, Specular_IOR_Level=0.45)
    cr = g.voronoi(co, 140.0, 'DISTANCE_TO_EDGE')
    crack = g.maprange(cr.outputs['Distance'], 0.0, 0.05, 0.0, 1.0)
    bl, _ = g.noise(co, 260.0, 5.0, 0.6)
    g.feed(p.inputs['Normal'], g.bump(g.add(g.mul(crack, 0.5), g.mul(bl, 0.6)), 0.4, 0.0006))
    return m


def mat_crumb(name='Crumb', crust=(0.27, 0.115, 0.032)):
    """Cut baguette crumb: open irregular alveoli, crust ring from the 'crustd' attribute (metres to crust)."""
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    co = g.tc().outputs['Object']
    cd = g.attr('crustd').outputs['Factor']
    dn, dc = g.noise(co, 180.0, 2.0, 0.5)
    cod = g.vmath('ADD', co, g.vmath('SCALE', g.vmath('SUBTRACT', dc, (0.5, 0.5, 0.5)), scale=0.003))
    v1 = g.voronoi(cod, 150.0, 'F1')
    r1 = g.sep(v1.outputs['Color'])[0]
    h1 = g.mul(g.maprange(v1.outputs['Distance'], g.add(0.12, g.mul(r1, 0.22)), g.add(0.2, g.mul(r1, 0.3)), 1.0, 0.0),
               g.gt(r1, 0.3))
    v2 = g.voronoi(cod, 750.0, 'F1')
    r2 = g.sep(v2.outputs['Color'])[0]
    h2 = g.mul(g.maprange(v2.outputs['Distance'], 0.1, 0.32, 1.0, 0.0), g.gt(r2, 0.25))
    holes = g.math('MAXIMUM', h1, g.mul(h2, 0.8))
    cn, _ = g.noise(co, 90.0, 4.0, 0.5)
    crumb = g.ramp(cn, [(0.3, (0.48, 0.41, 0.29)), (0.7, (0.58, 0.50, 0.36))])
    col = g.mixc(g.mul(holes, 0.75), crumb, (0.16, 0.12, 0.07))
    # crust ring (thin dark-gold band) fading to crumb within ~3.5 mm
    ring = g.maprange(cd, 0.0012, 0.0038, 1.0, 0.0, interp='SMOOTHSTEP')
    ring_col = g.ramp(g.maprange(cd, 0.0, 0.0035), [(0.0, crust), (0.45, (0.42, 0.24, 0.08)), (1.0, (0.62, 0.5, 0.32))])
    col = g.mixc(ring, col, ring_col)
    g.feed(p.inputs['Base Color'], col)
    _pset(p, Roughness=0.62, Subsurface_Weight=0.25, Subsurface_Scale=0.003, Specular_IOR_Level=0.4)
    p.inputs['Subsurface Radius'].default_value = (1.0, 0.75, 0.5)
    fn, _ = g.noise(co, 900.0, 3.0, 0.6)
    g.feed(p.inputs['Normal'], g.bump(g.add(g.mul(holes, -1.0), g.mul(fn, 0.25)), 0.6, 0.0012))
    return m


def mat_salami(name='Salami'):
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    co = g.tc().outputs['Object']
    rr = g.attr('rr').outputs['Factor']
    dn, dc = g.noise(co, 300.0, 2.0, 0.5)
    cod = g.vmath('ADD', co, g.vmath('SCALE', g.vmath('SUBTRACT', dc, (0.5, 0.5, 0.5)), scale=0.0012))
    mn, _ = g.noise(co, 220.0, 4.0, 0.6)
    meat = g.ramp(mn, [(0.3, (0.075, 0.008, 0.010)), (0.55, (0.13, 0.014, 0.017)), (0.8, (0.19, 0.024, 0.026))])
    vf = g.voronoi(cod, 420.0, 'F1')
    fr = g.sep(vf.outputs['Color'])[0]
    fat = g.mul(g.maprange(vf.outputs['Distance'], g.add(0.16, g.mul(fr, 0.1)), g.add(0.26, g.mul(fr, 0.12)), 1.0, 0.0),
                g.gt(fr, 0.42))
    vf2 = g.voronoi(cod, 1300.0, 'F1')
    fat2 = g.mul(g.maprange(vf2.outputs['Distance'], 0.12, 0.25, 1.0, 0.0), g.gt(g.sep(vf2.outputs['Color'])[0], 0.6))
    fat = g.math('MAXIMUM', fat, g.mul(fat2, 0.85))
    col = g.mixc(fat, meat, (0.62, 0.46, 0.40))
    vp = g.voronoi(co, 260.0, 'F1')
    pep = g.mul(g.maprange(vp.outputs['Distance'], 0.08, 0.16, 1.0, 0.0), g.gt(g.sep(vp.outputs['Color'])[0], 0.93))
    col = g.mixc(pep, col, (0.02, 0.015, 0.012))
    casing = g.maprange(rr, 0.93, 0.975)
    col = g.mixc(casing, col, (0.11, 0.05, 0.035))
    g.feed(p.inputs['Base Color'], col)
    g.feed(p.inputs['Roughness'], g.mixf(fat, 0.3, 0.42))
    _pset(p, Coat_Weight=0.3, Coat_Roughness=0.15, Subsurface_Weight=0.3, Subsurface_Scale=0.002,
          Specular_IOR_Level=0.5)
    p.inputs['Subsurface Radius'].default_value = (1.0, 0.25, 0.2)
    g.feed(p.inputs['Normal'], g.bump(g.add(g.mul(fat, 0.5), g.mul(mn, 0.4)), 0.25, 0.0004))
    return m


def mat_rough_diamond(name='RoughStone'):
    """Uncut diamond: pale, frosted, greasy-translucent. Not faceted, not sparkly."""
    m = new_mat(name)
    g = SG(m)
    p = g.principled()
    oi = g.node('ShaderNodeObjectInfo')
    co = g.tc().outputs['Object']
    tint = g.ramp(oi.outputs['Random'], [(0.0, (0.86, 0.85, 0.80)), (0.5, (0.80, 0.78, 0.68)), (1.0, (0.74, 0.74, 0.72))])
    geo = g.node('ShaderNodeNewGeometry')
    grime = g.maprange(geo.outputs['Pointiness'], 0.47, 0.42)
    col = g.mixc(g.mul(grime, 0.6), tint, (0.18, 0.15, 0.11))
    g.feed(p.inputs['Base Color'], col)
    fr, _ = g.noise(co, 2500.0, 3.0, 0.6)
    g.feed(p.inputs['Roughness'], g.maprange(fr, 0.3, 0.7, 0.24, 0.42))
    _pset(p, Transmission_Weight=0.82, IOR=2.1, Coat_Weight=0.35, Coat_Roughness=0.3, Specular_IOR_Level=0.5)
    g.feed(p.inputs['Normal'], g.bump(fr, 0.25, 0.0002))
    return m


def mat_water(name='Water', tint=(0.86, 0.84, 0.78), rough=0.02):
    m = mat_principled(name, color=tint, rough=rough, transmission=1.0, ior=1.333, spec=0.5)
    return m


# ============================================================================ geometry helpers

def mesh_from_np(name, V, F, coll=None, smooth=True, uv=None, attrs=None, mats=None, mat_idx=None, angle=60.0):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(map(float, v)) for v in V], [], [tuple(int(i) for i in f) for f in F])
    me.validate(clean_customdata=False)
    if uv is not None:
        uvl = me.uv_layers.new(name='UVMap')
        lv = np.zeros(len(me.loops), np.int64)
        me.loops.foreach_get('vertex_index', lv)
        uvl.data.foreach_set('uv', np.asarray(uv, np.float32)[lv].ravel())
    for k, arr in (attrs or {}).items():
        a = me.attributes.new(k, 'FLOAT', 'POINT')
        a.data.foreach_set('value', np.asarray(arr, np.float32))
    if mats:
        for mt in mats:
            me.materials.append(mt)
    if mat_idx is not None:
        me.polygons.foreach_set('material_index', np.asarray(mat_idx, np.int32))
    me.update()
    o = bpy.data.objects.new(name, me)
    if coll is not None or True:
        link(o, coll)
    if smooth:
        shade(o, True, angle)
    return o


def _grid_faces(nr, nc, closed=False):
    F = []
    for i in range(nr - 1):
        for j in range(nc - (0 if closed else 1)):
            j2 = (j + 1) % nc
            F.append((i * nc + j, i * nc + j2, (i + 1) * nc + j2, (i + 1) * nc + j))
    return F


def _rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.0]])


def _rot_to(n):
    """Rotation matrix taking +Z to unit vector n (minimal)."""
    n = np.asarray(n, float)
    n = n / np.linalg.norm(n)
    z = np.array([0, 0, 1.0])
    v = np.cross(z, n)
    s = np.linalg.norm(v)
    c = float(np.dot(z, n))
    if s < 1e-8:
        return np.eye(3)
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx * ((1 - c) / (s * s))


def _mat4(R, t, s=1.0):
    M = np.eye(4)
    M[:3, :3] = R * s
    M[:3, 3] = t
    return Matrix([list(r) for r in M])


def tube_mesh(name, pts, radii, seg=8, coll=None, mat=None, cap=True, noise_amp=0.0, seed=0):
    """Tube along a 3D polyline with per-point radius (parallel-transport frames)."""
    P = [Vector(p) for p in pts]
    n = len(P)
    V, F = [], []
    tang = []
    for i in range(n):
        a = P[min(i + 1, n - 1)] - P[max(i - 1, 0)]
        tang.append(a.normalized())
    ref = Vector((0, 0, 1)) if abs(tang[0].z) < 0.9 else Vector((1, 0, 0))
    nrm = tang[0].cross(ref).normalized()
    for i in range(n):
        if i > 0:
            ax = tang[i - 1].cross(tang[i])
            if ax.length > 1e-6:
                ang = tang[i - 1].angle(tang[i])
                nrm = (Matrix.Rotation(ang, 3, ax.normalized()) @ nrm).normalized()
        bin_ = tang[i].cross(nrm)
        for k in range(seg):
            a = 2 * math.pi * k / seg
            r = radii[i]
            if noise_amp:
                r *= 1 + noise_amp * mnoise.noise(Vector((i * 0.37 + seed, k * 0.9, seed * 0.13)))
            V.append(P[i] + (nrm * math.cos(a) + bin_ * math.sin(a)) * r)
    F = _grid_faces(n, seg, closed=True)
    if cap:
        V.append(P[0]); V.append(P[-1])
        c0, c1 = len(V) - 2, len(V) - 1
        for k in range(seg):
            k2 = (k + 1) % seg
            F.append((c0, k2, k))
            F.append((c1, (n - 1) * seg + k, (n - 1) * seg + k2))
    o = mesh_from_np(name, V, F, coll, smooth=True, angle=80)
    if mat:
        set_mat(o, mat)
    return o


# ============================================================================ ground

def ground_height(X, Y, P):
    z = 0.010 * _fbm(X, Y, 1.3, P.get('seed', 3), 3) + 0.004 * _fbm(X, Y, 6.0, P.get('seed', 3) + 7, 3)
    rs, sl = P.get('rise_start', 3.0), P.get('rise_slope', 0.05)
    t = np.clip((Y - rs) / 2.0, 0, 1)
    z = z + sl * np.where(Y > rs, (Y - rs) - 1.0 * (1 - t) * (Y - rs) * 0.5, 0.0)
    for (cx, cy, rx, ry, depth) in P.get('puddles', []):
        r = np.sqrt(((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2) * (1 + 0.22 * _fbm(X, Y, 9.0, 77, 3))
        z = z - depth * _smoothstep(1.0, 0.45, r)
    return z


def build_ground(P, hf, mat_near, mat_far=None, coll=None):
    """Near relief mesh (cm-res) over the heightfield region + a coarse far ground out to the fog."""
    x0, x1, y0, y1 = P['near']
    res = 0.012
    xs = np.arange(x0 - 0.1, x1 + 0.1 + 1e-9, res)
    ys = np.arange(y0 - 0.1, y1 + 0.2 + 1e-9, res)
    X, Y = np.meshgrid(xs, ys)
    Z = ground_height(X, Y, P)
    V = np.stack([X.ravel(), Y.ravel(), Z.ravel()], -1)
    o = mesh_from_np('GroundNear', V, _grid_faces(len(ys), len(xs)), coll, smooth=True)
    set_mat(o, mat_near)
    hf.h[:] = ground_height(hf.X, hf.Y, P).astype(np.float32)
    # far ground: coarse fan out to 60 m (slightly below near mesh in the overlap)
    fx = np.linspace(-45, 45, 91)
    fy = np.concatenate([np.linspace(y1 - 0.3, 8, 30), np.linspace(8.5, 70, 40)])
    FX, FY = np.meshgrid(fx, fy)
    FZ = ground_height(FX, FY, P) - 0.006
    VF = np.stack([FX.ravel(), FY.ravel(), FZ.ravel()], -1)
    of = mesh_from_np('GroundFar', VF, _grid_faces(len(fy), len(fx)), coll, smooth=True)
    set_mat(of, mat_far or mat_near)
    return o, of


# ============================================================================ leaves

class LeafProto:
    def __init__(self, me, V):
        self.me, self.V = me, V


def make_leaf_proto(name, kind, rng, mat, style='flat'):
    if kind == 'oak':
        L = rng.uniform(0.075, 0.115); W = L * rng.uniform(0.26, 0.32); nu = 48
        lobes = rng.choice([4.5, 5.0, 5.5]); phL = rng.uniform(0, 1); phR = phL + rng.uniform(0.3, 0.7)
        depth = rng.uniform(0.4, 0.62); Lp = rng.uniform(0.004, 0.009)
        veinf = lobes
    else:
        L = rng.uniform(0.055, 0.085); W = L * rng.uniform(0.29, 0.35); nu = 30
        Lp = rng.uniform(0.006, 0.012)
        veinf = rng.uniform(7.5, 9.0)
    nv = 9
    up = np.linspace(-Lp / L, -0.004, 3)
    ub = np.linspace(0.0, 0.993, nu)
    us = np.concatenate([up, ub])
    rows = []
    for u in us:
        if u < 0:
            wl = wr = 0.0009
        elif kind == 'oak':
            env = W * math.sin(math.pi * min(u, 1) ** 1.25) ** 0.6
            ear = W * 0.22 * math.exp(-((u - 0.05) / 0.03) ** 2)
            lob = lambda ph: 0.5 + 0.5 * math.cos(2 * math.pi * (lobes * u + ph))
            wl = env * (1 - depth * (1 - lob(phL)) ** 3) + ear + 0.0009
            wr = env * (1 - depth * (1 - lob(phR)) ** 3) + ear + 0.0009
        else:
            env = W * math.sin(math.pi * u ** 0.85) ** 0.95
            wl = env * (1 + 0.035 * math.sin(2 * math.pi * 8 * u)) + 0.0009
            wr = env * (1 + 0.035 * math.sin(2 * math.pi * 8 * u + 0.6)) + 0.0009
        rows.append((u, wl, wr))
    # shape deformation parameters
    if style == 'flat':
        fold, curl, roll, crum, tip = rng.uniform(0.04, 0.2), rng.uniform(0.15, 0.55), rng.uniform(0.25, 0.6), \
            rng.uniform(0.3, 0.8), rng.uniform(0.0, 0.3)
    else:  # dry curled
        fold, curl, roll, crum, tip = rng.uniform(0.18, 0.45), rng.uniform(0.15, 0.5), rng.uniform(0.2, 0.6), \
            rng.uniform(0.4, 0.9), rng.uniform(0.1, 0.45)
    twist = rng.uniform(-0.35, 0.35)
    seed = rng.uniform(0, 100)
    V, UV = [], []
    for (u, wl, wr) in rows:
        for j in range(nv):
            s = -1 + 2 * j / (nv - 1)
            y = s * (wr if s > 0 else wl)
            x = u * L
            z = fold * abs(y) + curl * ((x / L - 0.45) ** 2) * L * 0.6 + tip * max(u - 0.6, 0) ** 2 * L * 0.5 \
                + roll * (abs(y) / W) ** 2.5 * W * 0.6
            z += crum * L * 0.035 * mnoise.noise(Vector((x * 40 + seed, y * 40, seed * 0.3)))
            if u < 0:
                z += 0.0015 * (-u * L / Lp)
            a = twist * (u - 0.5)
            y2, z2 = y * math.cos(a) - z * math.sin(a), y * math.sin(a) + z * math.cos(a)
            V.append((x - L * 0.45, y2, z2))
            UV.append((max(u, 0.0), (s + 1) / 2))
    V = np.array(V)
    V[:, 2] -= V[:, 2].min()
    F = _grid_faces(len(rows), nv)
    if style == 'broken':
        cu = rng.uniform(0.45, 0.8)
        side = rng.choice([-1, 1])
        Fk = []
        for f in F:
            uu = sum(UV[k][0] for k in f) / 4
            vv = sum(UV[k][1] for k in f) / 4 * 2 - 1
            cut = cu + 0.12 * math.sin(vv * 9 + seed) + 0.25 * side * vv
            if uu < cut:
                Fk.append(f)
        F = Fk
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in V.tolist()], [], F)
    uvl = me.uv_layers.new(name='UVMap')
    lv = np.zeros(len(me.loops), np.int64)
    me.loops.foreach_get('vertex_index', lv)
    uvl.data.foreach_set('uv', np.asarray(UV, np.float32)[lv].ravel())
    a = me.attributes.new('veinf', 'FLOAT', 'POINT')
    a.data.foreach_set('value', np.full(len(V), veinf, np.float32))
    me.materials.append(mat)
    me.update()
    me.shade_smooth()
    lp = LeafProto(me, V)
    lp.style = style
    return lp


def make_leaf_protos(mat, seed=5, n_oak=10, n_beech=9):
    rng = random.Random(seed)
    protos = []
    styles = ['flat', 'flat', 'broken', 'flat', 'curled', 'flat', 'broken', 'flat', 'flat', 'curled']
    for i in range(n_oak):
        protos.append(make_leaf_proto(f'LeafOak{i}', 'oak', rng, mat, styles[i % len(styles)]))
    for i in range(n_beech):
        protos.append(make_leaf_proto(f'LeafBeech{i}', 'beech', rng, mat, styles[(i + 3) % len(styles)]))
    return protos


def place_leaf(hf, proto, x, y, rng, coll, scale=1.0, yaw=None, flip=None, avoid=False, occ_max=0.12,
               max_tilt=14.0, quant=0.62, name='Leaf', compress=0.3):
    V = proto.V * scale
    if flip is None:
        flip = rng.random() < 0.22
    if flip:
        V = V * np.array([1.0, -1.0, -1.0])
        V[:, 2] -= V[:, 2].min()
    yaw = rng.uniform(0, 2 * math.pi) if yaw is None else yaw
    Rz = _rot_z(yaw)
    P = V @ Rz.T
    wx, wy = P[:, 0] + x, P[:, 1] + y
    if avoid:
        if hf.occ_at(wx, wy).mean() > occ_max:
            return None
    hs = hf.sample(wx, wy)
    A = np.stack([P[:, 0], P[:, 1], np.ones(len(P))], -1)
    coef, *_ = np.linalg.lstsq(A, hs, rcond=None)
    lim = math.tan(math.radians(max_tilt))
    a, b = np.clip(coef[0], -lim, lim), np.clip(coef[1], -lim, lim)
    Rt = _rot_to((-a, -b, 1.0))
    P2 = P @ Rt.T
    wx, wy = P2[:, 0] + x, P2[:, 1] + y
    hs2 = hf.sample(wx, wy)
    off = hs2 - P2[:, 2]
    zb = float(np.quantile(off, quant)) + 0.0006
    W = P2 + np.array([x, y, zb])
    Ws = W.copy()
    Ws[:, 2] = np.maximum(hs2, zb + compress * (W[:, 2] - zb))
    hf.splat(Ws, thick=0.0006)
    o = bpy.data.objects.new(name, proto.me)
    coll.objects.link(o)
    R = Rt @ Rz @ (np.diag([1.0, -1.0, -1.0]) if flip else np.eye(3))
    # flip already baked into V offsets: rebuild matrix from the un-flipped proto with same result
    M = np.eye(4)
    M[:3, :3] = R * scale
    t = np.array([x, y, zb])
    if flip:
        # V_flipped = diag(1,-1,-1) @ V*s - zmin_shift; account for the z shift applied above
        zshift = -(proto.V[:, 2] * scale * -1).min()
        t = t + Rt @ Rz @ np.array([0, 0, zshift])
    M[:3, 3] = t
    o.matrix_world = Matrix([list(r) for r in M])
    return o


def scatter_leaves(hf, protos, n, rng, coll, dens, avoid=False, scale=(0.85, 1.15), name='Leaf', max_tries=None,
                   flat_zone=None):
    """dens(x, y) -> acceptance probability (vectorised ok). Returns placed objects."""
    out = []
    tries = 0
    max_tries = max_tries or n * 30
    x0, y0 = hf.x0 + 0.06, hf.y0 + 0.06
    x1, y1 = hf.x0 + (hf.nx - 1) * hf.c - 0.06, hf.y0 + (hf.ny - 1) * hf.c - 0.06
    while len(out) < n and tries < max_tries:
        tries += 1
        x, y = rng.uniform(x0, x1), rng.uniform(y0, y1)
        if rng.random() > float(dens(np.array([x]), np.array([y]))[0]):
            continue
        pr = protos[rng.randrange(len(protos))]
        flip = None
        if flat_zone is not None and flat_zone(x, y):
            flats = [q for q in protos if getattr(q, 'style', 'flat') != 'curled']
            pr = flats[rng.randrange(len(flats))]
            flip = False
        o = place_leaf(hf, pr, x, y, rng, coll, scale=rng.uniform(*scale), avoid=avoid, name=name, flip=flip)
        if o is not None:
            out.append(o)
    return out


# ============================================================================ sheets (paper)

def _path_from_angles(ts, ang):
    """Integrate a 2D profile (y, z) along arc-length samples ts with bend angle(t)."""
    y = np.zeros_like(ts)
    z = np.zeros_like(ts)
    for i in range(1, len(ts)):
        dt = ts[i] - ts[i - 1]
        a = 0.5 * (ang[i] + ang[i - 1])
        y[i] = y[i - 1] + math.cos(a) * dt
        z[i] = z[i - 1] + math.sin(a) * dt
    return y, z


def build_sheet(name, hf, W, H, nx, ny, angle_fn, place, mat, coll=None, keep_fn=None, crumple=0.002, seed=1,
                lift=0.0012, sag=0.003, edge_fn=None, extra_z=None, t_ext=0.0):
    """Paper sheet: flat grid (s across W, t along H) bent along t by angle_fn(t), crumpled, then dropped onto
    the smoothed heightfield: bridges over hollows, rests on high leaves, raised bends stay raised."""
    ss = np.linspace(0, W, nx)
    ts = np.linspace(0, H + t_ext, ny)
    ang = np.array([angle_fn(t) for t in ts])
    py, pz = _path_from_angles(ts, ang)
    S, T = np.meshgrid(ss, np.arange(ny))
    Yp = py[T]
    Zp = pz[T]
    Sx = S
    Tt = ts[T]
    cr = np.zeros_like(Sx)
    for i in range(ny):
        for j in range(nx):
            q = Vector((Sx[i, j] * 30 + seed, Tt[i, j] * 30, seed * 0.7))
            cr[i, j] = crumple * (mnoise.noise(q) + 0.4 * mnoise.noise(q * 3.1))
    Zp = Zp + cr
    if extra_z is not None:
        Zp = Zp + extra_z(Sx, Tt)
    x, y, yaw = place
    Rz = _rot_z(yaw)
    L = np.stack([Sx - W / 2, Yp - (py.max() + py.min()) / 2, Zp], -1).reshape(-1, 3)
    Wd = L @ Rz.T
    wx, wy = Wd[:, 0] + x, Wd[:, 1] + y
    hs = hf.sample_s(wx, wy)
    plane = float(np.quantile(hs, 0.6))
    # bridges hollows (stiff paper), sags a little when wet; raised bends keep their own profile height
    rs = _smoothstep(0.0, 0.012, L[:, 2])
    z = np.maximum(hs + lift, plane + L[:, 2] - sag * (1 - rs))
    Vw = np.stack([wx, wy, z], -1)
    UV = np.stack([(Sx / W).ravel(), (Tt / H).ravel()], -1)
    edge = np.minimum.reduce([Sx, W - Sx, Tt, np.maximum(H - Tt, 0.0)]).ravel() if edge_fn is None \
        else edge_fn(Sx, Tt).ravel()
    F = _grid_faces(ny, nx)
    if keep_fn is not None:
        keep = keep_fn(Sx, Tt).ravel()
        F = [f for f in F if all(keep[k] for k in f)]
    o = mesh_from_np(name, Vw, F, coll, smooth=True, uv=UV, attrs={'edge': edge}, angle=70)
    set_mat(o, mat)
    return o


def build_receipt(hf, place, mat, coll=None, seed=3):
    W, H = 0.079, 0.20
    t0 = 0.135
    R = 0.024

    def ang(t):
        a = 0.0
        a += -0.35 * _sstep(0.05, 0.07, t)            # a crease where it was scrunched
        a += 0.32 * _sstep(0.07, 0.09, t)
        if t > t0:
            a += (t - t0) / R                          # end curls up (thermal paper memory)
        return a
    return build_sheet('Receipt', hf, W, H, 26, 70, ang, place, mat, coll, crumple=0.0012, seed=seed, sag=0.002)


def build_envelope(hf, place, mat, coll=None, seed=5):
    W, H, FL = 0.22, 0.11, 0.045
    rng = random.Random(seed)
    tear_x = W - 0.018

    def keep(S, T):
        tear = tear_x + 0.004 * np.sin(T * 260) + 0.003 * np.sin(T * 610 + 1.3) + 0.012 * (T / H)
        k = S < tear
        fl = T > H
        # flap: rounded triangle beyond the top edge
        flap_w = (1 - np.clip((T - H) / FL, 0, 1)) ** 0.8 * W / 2
        k &= ~fl | (np.abs(S - W / 2) < flap_w + 0.002)
        return k

    def ang(t):
        a = -0.08 * _sstep(0.0, 0.03, t) + 0.12 * _sstep(0.04, 0.09, t)
        a += 0.42 * _sstep(H - 0.002, H + 0.004, t)   # flap opened, standing up a little
        return a

    def edge(S, T):
        tear = tear_x + 0.004 * np.sin(T * 260) + 0.003 * np.sin(T * 610 + 1.3) + 0.012 * (T / H)
        flap_w = (1 - np.clip((T - H) / FL, 0, 1)) ** 0.8 * W / 2
        e = np.minimum.reduce([S, np.abs(tear - S), T])
        e = np.where(T > H, np.minimum(e, np.abs(flap_w - np.abs(S - W / 2))), np.minimum(e, H + FL - T))
        return e
    return build_sheet('Envelope', hf, W, H, 66, 46, ang, place, mat, coll, keep_fn=keep, crumple=0.0025, seed=seed,
                       edge_fn=edge, t_ext=FL)


def build_document(hf, place, mat, coll=None, seed=9, a1=0.55, a2=-1.0):
    W, H = 0.21, 0.297
    t1, t2 = H / 3, 2 * H / 3

    def ang(t):
        return a1 * _sstep(t1 - 0.003, t1 + 0.003, t) + a2 * _sstep(t2 - 0.003, t2 + 0.003, t)
    return build_sheet('Document', hf, W, H, 42, 90, ang, place, mat, coll, crumple=0.0018, seed=seed, sag=0.004)


def crumpled_wad(name, loc, r, mat, coll=None, seed=0):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=r)
    sd = Vector((seed * 1.3, seed * 0.7, seed * 2.1))
    for v in bm.verts:
        d = v.co.normalized()
        k = 1 + 0.28 * mnoise.noise(d * 2.2 + sd) - 0.22 * abs(mnoise.noise(d * 5.0 + sd)) \
            - 0.08 * abs(mnoise.noise(d * 11.0 + sd))
        v.co = d * r * k
    o = from_bmesh(name, bm, coll, smooth=True, angle=35)
    o.location = loc
    uvl = o.data.uv_layers.new(name='UVMap')
    a = o.data.attributes.new('edge', 'FLOAT', 'POINT')
    a.data.foreach_set('value', np.full(len(o.data.vertices), 0.05, np.float32))
    set_mat(o, mat)
    return o


# ============================================================================ bin bag

def build_binbag(hf, center, yaw, mat, coll=None, size=(0.28, 0.20, 0.11), mouth=(-0.55, -0.8, 0.15), seed=11,
                 res=(176, 88)):
    """Lumpy, half-emptied black bin bag lying on its side: gathered neck at local +x with radial pleats running
    into the body, contents bulging the film, sagging film between them, torn open on the `mouth` side with the
    ragged edge slumped onto the leaves. 'tear' attribute = proximity to the torn edge (stretch whitening)."""
    rng = random.Random(seed)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=res[0], v_segments=res[1], radius=1.0)
    sx, sy, sz = size
    sd = Vector((seed * 0.37, seed * 1.1, seed * 0.53))
    dm = Vector(mouth).normalized()
    bulges = []
    for _ in range(7):
        d = Vector((rng.uniform(-1, 0.4), rng.uniform(-1, 1), rng.uniform(-0.2, 1))).normalized()
        bulges.append((d, rng.uniform(0.10, 0.22), rng.uniform(0.25, 0.45)))
    lay = bm.verts.layers.float.new('cut')
    for v in bm.verts:
        p = v.co.copy()
        q = p + sd
        bsum = sum(a * math.exp(-(1 - p.dot(d)) / (w * w)) for d, a, w in bulges)
        r = 1.0 + bsum
        r -= 0.16 * max(0.0, p.z) * max(0.0, 1.0 - 3.0 * bsum)          # film sags between contents
        r += -0.045 * abs(mnoise.noise(q * 2.6)) - 0.02 * abs(mnoise.noise(q * 6.0)) - 0.008 * abs(mnoise.noise(q * 14.0))
        x, y, z = p.x * r * sx, p.y * r * sy, p.z * r * sz
        # gathered neck at +x with radial pleats running back into the body
        t = _sstep(0.35, 1.0, p.x)
        phi = math.atan2(p.z, p.y)
        pleat = abs(math.sin(phi * 4.0 + 0.8 * mnoise.noise(q * 1.5)))
        amp = 0.05 + 0.3 * t
        k = (1 - 0.86 * t) * (1 - amp * pleat)
        y *= k
        z = z * k + 0.25 * sz * t
        x += 0.32 * sx * t * t
        # torn mouth: film around the hole slumps and spreads onto the ground
        md = p.dot(dm)
        thr = 0.42 + 0.10 * mnoise.noise(q * 4.0) + 0.05 * mnoise.noise(q * 13.0) + 0.03 * mnoise.noise(q * 37.0)
        near = _sstep(thr - 0.4, thr, md)
        z = z * (1 - 0.55 * near) - 0.35 * sz * near
        x += 0.16 * sx * near * dm.x
        y += 0.16 * sy * near * dm.y
        v.co = Vector((x, y, z))
        v[lay] = md - thr
    kill = [f for f in bm.faces if sum(v[lay] for v in f.verts) / len(f.verts) > 0]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
    me = bpy.data.meshes.new('BinBag')
    bm.to_mesh(me)
    bm.free()
    V = np.zeros((len(me.vertices), 3))
    me.vertices.foreach_get('co', V.ravel())
    R = np.array(Matrix.Rotation(yaw, 3, 'Z'))
    Vw = V @ R.T
    Vw[:, 0] += center[0]
    Vw[:, 1] += center[1]
    gs = hf.sample_s(Vw[:, 0], Vw[:, 1])
    zmin = Vw[:, 2].min()
    base = float(np.quantile(gs, 0.5))
    Vw[:, 2] += base - zmin - 0.012
    # bottom conforms to the litter (soft film settles over the leaves)
    lowz = gs + 0.0025
    Vw[:, 2] = np.maximum(Vw[:, 2], lowz)
    me.vertices.foreach_set('co', Vw.ravel())
    me.update()
    o = bpy.data.objects.new('BinBag', me)
    link(o, coll)
    shade(o, True, 70)
    bm2 = bmesh.new()
    bm2.from_mesh(me)
    bverts = [tuple(v.co) for v in bm2.verts if v.is_boundary]
    bm2.free()
    tear = np.zeros(len(me.vertices), np.float32)
    if bverts:
        B = np.array(bverts)
        for i0 in range(0, len(Vw), 1024):
            chunk = Vw[i0:i0 + 1024]
            d = np.sqrt(((chunk[:, None, :] - B[None, :, :]) ** 2).sum(-1)).min(1)
            tear[i0:i0 + 1024] = np.clip(1 - d / 0.04, 0, 1) ** 1.5
    a = me.attributes.new('tear', 'FLOAT', 'POINT')
    a.data.foreach_set('value', tear)
    set_mat(o, mat)
    sub = o.modifiers.new('Subd', 'SUBSURF')
    sub.levels = 0
    sub.render_levels = 1
    # neck tip in world space (for the knot)
    i = int(np.argmax(V[:, 0]))
    o['neck'] = tuple(Vw[i])
    return o


def knot(name, loc, r, mat, coll=None, seed=2):
    o = crumpled_wad(name, loc, r, mat, coll, seed)
    o.scale = (1.0, 0.8, 0.7)
    return o


# ============================================================================ stones

def rough_stone(name, loc, size, mat, coll=None, seed=0, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
    sd = Vector((seed * 2.3, seed * 0.9, seed * 1.7))
    rng = random.Random(seed)
    ax = Vector((rng.uniform(0.8, 1.15), rng.uniform(0.75, 1.1), rng.uniform(0.6, 0.95)))
    for v in bm.verts:
        d = v.co.normalized()
        oct_r = 1.0 / (abs(d.x) + abs(d.y) + abs(d.z))       # octahedron radius in this direction
        r = 0.45 * 1.0 + 0.55 * oct_r * 1.45
        r *= 1 + 0.06 * mnoise.noise(d * 3.0 + sd) + 0.02 * mnoise.noise(d * 9.0 + sd)
        v.co = Vector((d.x * ax.x, d.y * ax.y, d.z * ax.z)) * r * size
    o = from_bmesh(name, bm, coll, smooth=True, angle=50)
    o.location = loc
    o.rotation_euler = rot or (rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(0, 6.28))
    set_mat(o, mat)
    return o


# ============================================================================ sandwich

def _superellipse(a, bt, bb, zmid, nt=2.5, nb_=3.4, N=720):
    pts = []
    for k in range(N):
        th = 2 * math.pi * k / N
        c, s = math.cos(th), math.sin(th)
        n = nt if s >= 0 else nb_
        y = a * math.copysign(abs(c) ** (2 / n), c)
        z = zmid + (bt if s >= 0 else bb) * math.copysign(abs(s) ** (2 / n), s)
        pts.append((y, z))
    return pts


def _clip_arc(pts, zc, top=True):
    """Return the outline polyline on one side of z = zc, starting at the right crossing, ordered."""
    N = len(pts)
    out = []
    keep = [(p[1] >= zc) if top else (p[1] <= zc) for p in pts]
    # find start index: transition from not-keep to keep
    start = None
    for i in range(N):
        if keep[i] and not keep[i - 1]:
            start = i
            break
    i = start
    p0, p1 = pts[i - 1], pts[i]
    t = (zc - p0[1]) / (p1[1] - p0[1])
    out.append((p0[0] + (p1[0] - p0[0]) * t, zc))
    while keep[i % N]:
        out.append(pts[i % N])
        i += 1
    p0, p1 = pts[(i - 1) % N], pts[i % N]
    t = (zc - p0[1]) / (p1[1] - p0[1])
    out.append((p0[0] + (p1[0] - p0[0]) * t, zc))
    return out


def _resample(poly, n):
    P = np.array(poly)
    seg = np.sqrt(((P[1:] - P[:-1]) ** 2).sum(1))
    s = np.concatenate([[0], np.cumsum(seg)])
    tgt = np.linspace(0, s[-1], n)
    return np.stack([np.interp(tgt, s, P[:, 0]), np.interp(tgt, s, P[:, 1])], -1)


def _dist_to_poly(Q, A):
    """Q (m,2) points, A (k,2) polyline -> min distance."""
    a, b = A[:-1], A[1:]
    ab = b - a
    L2 = (ab ** 2).sum(1) + 1e-12
    d = np.full(len(Q), 1e9)
    for i0 in range(0, len(Q), 512):
        q = Q[i0:i0 + 512, None, :]
        t = np.clip(((q - a[None]) * ab[None]).sum(-1) / L2[None], 0, 1)
        proj = a[None] + t[..., None] * ab[None]
        d[i0:i0 + 512] = np.sqrt(((q - proj) ** 2).sum(-1)).min(1)
    return d


def _bread_piece(name, top, P, rng, coll, mats, bite=None):
    """One half (top or bottom) of a split baguette segment. Local: x along (0 heel .. L cut), z up."""
    L, a, H = P['L'], P['a'], P['H']
    zc = P['zc']
    outline = _superellipse(a, H * 0.55, H * 0.45, H * 0.45, P.get('nt', 2.4), P.get('nb', 3.6))
    arc = _clip_arc(outline, zc, top)
    n_arc, n_ch = P.get('n_arc', 90), P.get('n_ch', 18)
    A = _resample(arc, n_arc)                      # from right crossing over (or under) to left crossing
    if not top:
        A = A[::-1]                                # keep ring orientation consistent
    chord = np.stack([np.linspace(A[-1, 0], A[0, 0], n_ch + 2)[1:-1], np.full(n_ch, zc)], -1)
    ring = np.concatenate([A, chord], 0)           # closed loop: arc then chord back
    nring = len(ring)
    is_arc = np.zeros(nring, bool)
    is_arc[:n_arc] = True
    # stations along x: dense at heel tip and at the cut end
    K = P.get('K', 96)
    xs = L * (0.5 - 0.5 * np.cos(np.linspace(0.0, math.pi, K))) ** 1.0
    xs[0] = 0.0015
    xt = P.get('xt', 0.05)

    def taper(x):
        if x >= xt:
            return 1.0
        q = (xt - x) / xt
        return max(0.06, (1 - q ** 2) ** 0.55)
    center = np.array([0.0, zc])
    V, crustd, score = [], [], []
    seed = rng.uniform(0, 100)
    for x in xs:
        s = taper(x)
        R = center + (ring - center) * s
        for k in range(nring):
            y, z = R[k]
            if is_arc[k]:
                # outward normal ~ from centre of mass of profile
                nrm = np.array([y, z - H * 0.45])
                nrm = nrm / (np.linalg.norm(nrm) + 1e-9)
                q = Vector((x * 1.0 + seed, y, z))
                bump = 0.0008 * mnoise.noise(q * 240) + 0.0016 * mnoise.noise(q * 70) + 0.0012 * mnoise.noise(q * 22)
                sc = 0.0
                if top and z > zc + 0.35 * (H - zc) * s:
                    for (xa, xb, y0, slope) in P.get('scores', []):
                        if xa < x < xb:
                            d = (y - (y0 + slope * (x - xa)))
                            env = math.sin(math.pi * (x - xa) / (xb - xa)) ** 0.6
                            groove = -0.0026 * math.exp(-(d / 0.0035) ** 2) * env
                            ear = 0.0034 * math.exp(-((d - 0.0055) / 0.0032) ** 2) * env
                            bump += groove + ear
                            sc = max(sc, math.exp(-(d / 0.004) ** 2) * env)
                y, z = y + nrm[0] * bump * s, z + nrm[1] * bump * s
                crustd.append(0.0)
            else:
                # horizontal cut face: distance to the side crust in y
                yl, yr = R[n_arc - 1, 0], R[0, 0]
                crustd.append(min(abs(y - yl), abs(yr - y)))
                sc = 0.0
            V.append((x, y, z))
            score.append(sc)
    F, mi = [], []
    for i in range(K - 1):
        for k in range(nring):
            k2 = (k + 1) % nring
            F.append((i * nring + k, i * nring + k2, (i + 1) * nring + k2, (i + 1) * nring + k))
            mi.append(0 if (is_arc[k] and is_arc[k2]) else 1)
    # heel cap: fan (crust)
    c0 = len(V)
    V.append((0.0, 0.0, zc + (H * 0.12 if top else -H * 0.1)))
    crustd.append(0.0); score.append(0.0)
    for k in range(nring):
        k2 = (k + 1) % nring
        F.append((c0, k2, k))
        mi.append(0)
    # cut cap at x = L: concentric rings toward an interior point; crustd = distance to arc
    last = (K - 1) * nring
    Rl = np.array([(V[last + k][1], V[last + k][2]) for k in range(nring)])
    cpt = np.array([0.0, zc + (0.45 if top else -0.45) * (abs(Rl[:, 1] - zc).max())])
    facs = P.get('cap_rings', [0.97, 0.93, 0.88, 0.8, 0.68, 0.52, 0.34, 0.16])
    prev = list(range(last, last + nring))
    arcL = Rl[:n_arc]
    for f in facs:
        Rf = cpt + (Rl - cpt) * f
        dd = _dist_to_poly(Rf, arcL)
        cur = []
        for k in range(nring):
            V.append((L, Rf[k, 0], Rf[k, 1]))
            crustd.append(float(dd[k])); score.append(0.0)
            cur.append(len(V) - 1)
        for k in range(nring):
            k2 = (k + 1) % nring
            F.append((prev[k], cur[k], cur[k2], prev[k2]))
            mi.append(1)
        prev = cur
    V.append((L, cpt[0], cpt[1]))
    crustd.append(float(_dist_to_poly(cpt[None], arcL)[0])); score.append(0.0)
    cc = len(V) - 1
    for k in range(nring):
        k2 = (k + 1) % nring
        F.append((prev[k], cc, prev[k2]))
        mi.append(1)
    V = np.array(V)
    crustd = np.array(crustd)
    # cap winding: ensure caps face +x (fix later via normals recalc in bmesh)
    if bite is not None:
        bc, br, axis_tilt = np.array(bite[0]), bite[1], bite[2] if len(bite) > 2 else 0.0
        d = V - bc
        dist = np.linalg.norm(d, axis=1)
        dirs = d / (dist[:, None] + 1e-9)
        phi = np.arctan2(dirs[:, 2], dirs[:, 1])
        rad = br * (1 + 0.07 * np.abs(np.sin(phi * 6.0 + 0.5)) - 0.035)
        rn = np.array([mnoise.noise(Vector(tuple(p * 400))) for p in V])
        rad = rad * (1 + 0.04 * rn)
        inside = dist < rad
        newV = bc + dirs * rad[:, None]
        moved = np.where(inside, np.linalg.norm(newV - V, axis=1), 0.0)
        V = np.where(inside[:, None], newV, V)
        crustd = np.maximum(crustd, moved)
        for fi, f in enumerate(F):
            if all(inside[k] for k in f):
                mi[fi] = 1
    o = mesh_from_np(name, V, F, coll, smooth=True, attrs={'crustd': crustd, 'score': np.array(score)},
                     mats=mats, mat_idx=mi, angle=50)
    # make normals consistent outward
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    shade(o, True, 50)
    return o


def _salami_slice(name, cx, cy, cz, r, t, tilt, P, coll, mat, seed=0, droop_side=-1):
    nr, na = 10, 56
    V, rr, F = [], [], []
    rng = random.Random(seed)
    wob = [rng.uniform(-0.04, 0.04) for _ in range(6)]

    def rad(a):
        return r * (1 + wob[0] * math.sin(a + wob[1] * 30) + wob[2] * math.sin(2 * a + wob[3] * 30))
    for side, dz in ((0, t / 2), (1, -t / 2)):
        V.append((0.0, 0.0, dz)); rr.append(0.0)
        for i in range(1, nr + 1):
            f = i / nr
            for j in range(na):
                a = 2 * math.pi * j / na
                R = rad(a) * f
                V.append((R * math.cos(a), R * math.sin(a), dz)); rr.append(f)
    per = 1 + nr * na
    for side in (0, 1):
        b = side * per
        for j in range(na):
            j2 = (j + 1) % na
            f = (b, b + 1 + j, b + 1 + j2) if side == 0 else (b, b + 1 + j2, b + 1 + j)
            F.append(f)
        for i in range(1, nr):
            for j in range(na):
                j2 = (j + 1) % na
                a0 = b + 1 + (i - 1) * na + j; a1 = b + 1 + (i - 1) * na + j2
                c0 = b + 1 + i * na + j; c1 = b + 1 + i * na + j2
                F.append((a0, c0, c1, a1) if side == 0 else (a0, a1, c1, c0))
    # rim
    for j in range(na):
        j2 = (j + 1) % na
        t0 = 1 + (nr - 1) * na + j; t1 = 1 + (nr - 1) * na + j2
        F.append((t0, t0 + per, t1 + per, t1))
    V = np.array(V)
    # tilt about local y, then position; droop beyond the bread edge
    ca, sa = math.cos(tilt), math.sin(tilt)
    x = V[:, 0] * ca - V[:, 2] * sa
    z = V[:, 0] * sa + V[:, 2] * ca
    V = np.stack([x + cx, V[:, 1] + cy, z + cz], -1)
    ae = P['a_cut'] - 0.0015
    over = np.maximum(np.abs(V[:, 1]) - ae, 0.0)
    V[:, 2] -= 0.9 * over ** 1.1 * (1 + 0.3 * np.sin(V[:, 0] * 300))
    for i in range(len(V)):
        V[i, 2] += 0.0004 * mnoise.noise(Vector((V[i, 0] * 300 + seed, V[i, 1] * 300, 0)))
    o = mesh_from_np(name, V, F, coll, smooth=True, attrs={'rr': np.array(rr)}, angle=60)
    set_mat(o, mat)
    # cut flush with the sandwich cut face
    bm = bmesh.new()
    bm.from_mesh(o.data)
    res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(P['L'], 0, 0),
                                 plane_no=(1, 0, 0), clear_outer=True)
    bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    shade(o, True, 60)
    return o


def build_sandwich(root_loc, yaw, mats, coll=None, seed=21, tilt=(0.0, 0.0)):
    """Half a salami baguette: knife-cut face at local +x, rounded heel at x=0, a bite out of the top corner of
    the cut end. Returns (root empty, parts, params). Local frame: x along, y across (visible side -y), z up."""
    rng = random.Random(seed)
    P = dict(L=0.135, a=0.031, H=0.050, zc=0.020, xt=0.05, K=96, n_arc=96, n_ch=20,
             scores=[(0.012, 0.11, 0.004, -0.06), (0.075, 0.14, -0.009, -0.05)])
    root = empty('Sandwich', root_loc, coll)
    root.rotation_euler = (tilt[0], tilt[1], yaw)
    crust, crumb, sal = mats['crust'], mats['crumb'], mats['salami']
    bottom = _bread_piece('BreadBottom', False, P, rng, coll, [crust, crumb])
    bite_c = (P['L'] - 0.006, -P['a'] * 0.95, P['H'] + 0.004)
    top = _bread_piece('BreadTop', True, P, rng, coll, [crust, crumb], bite=(bite_c, 0.022))
    gap = 0.0052
    top.location = (0, 0, gap)
    top.rotation_euler = (math.radians(-3.0), math.radians(-1.2), 0)
    # cut-plane half-width at zc (for salami droop)
    outline = _superellipse(P['a'], P['H'] * 0.55, P['H'] * 0.45, P['H'] * 0.45, 2.4, 3.6)
    P['a_cut'] = max(abs(y) for y, z in outline if abs(z - P['zc']) < 0.002)
    slices = []
    xs = [P['L'] - 0.014, P['L'] - 0.036, P['L'] - 0.058, P['L'] - 0.080, P['L'] - 0.100]
    ys = [-0.010, -0.004, -0.011, -0.006, -0.009]
    for k, (x, y) in enumerate(zip(xs, ys)):
        r = rng.uniform(0.0215, 0.0235)
        cz = P['zc'] + 0.0011 + (0.0018 if k % 2 else 0.0)
        tilt_k = math.radians(rng.uniform(-3.5, 3.5))
        slices.append(_salami_slice(f'Salami{k}', x, y, cz, r, 0.0016, tilt_k, P, coll, sal, seed=k + seed))
    for o in [bottom, top] + slices:
        o.parent = root
    return root, [bottom, top] + slices, P


def crumbs(n, center, radius, mats, coll=None, seed=4, hf=None):
    rng = random.Random(seed)
    objs = []
    for i in range(n):
        a = rng.uniform(0, 2 * math.pi)
        d = radius * rng.random() ** 0.6
        x, y = center[0] + d * math.cos(a), center[1] + d * math.sin(a)
        s = rng.uniform(0.0008, 0.0026)
        z = float(hf.sample(np.array([x]), np.array([y]))[0]) + s * 0.5 if hf else center[2]
        o = rough_stone(f'Crumb{i}', (x, y, z), s, mats['crumb'] if rng.random() < 0.7 else mats['crust'], coll,
                        seed=100 + i)
        a_ = o.data.attributes.new('crustd', 'FLOAT', 'POINT')
        a_.data.foreach_set('value', np.full(len(o.data.vertices), 0.01, np.float32))
        objs.append(o)
    return objs


# ============================================================================ twigs, trunks, log

def twig_points(hf, start, yaw, length, rng, n=24, bend=0.25, r=0.003):
    pts = []
    x, y = start
    step = length / (n - 1)
    ph = rng.uniform(0, 10)
    kinks = sorted(rng.uniform(0.15, 0.85) for _ in range(2))
    kang = [rng.uniform(-0.35, 0.35) for _ in kinks]
    for i in range(n):
        t = i / (n - 1)
        z = float(hf.sample_s(np.array([x]), np.array([y]))[0]) + r * 0.85 if hf else r
        pts.append((x, y, z))
        a = yaw + bend * math.sin(t * 2.3 + ph) + sum(ka for kt, ka in zip(kinks, kang) if t > kt)
        x += math.cos(a) * step
        y += math.sin(a) * step
    return pts


def build_twig(name, hf, start, yaw, length, r0, mat, coll=None, seed=0, branches=2):
    rng = random.Random(seed)
    pts = twig_points(hf, start, yaw, length, rng, n=max(8, int(length / 0.008)), r=r0)
    radii = [r0 * (1 - 0.55 * i / (len(pts) - 1)) for i in range(len(pts))]
    objs = [tube_mesh(name, pts, radii, 8, coll, mat, noise_amp=0.25, seed=seed)]
    for b in range(branches):
        i = rng.randrange(len(pts) // 4, len(pts) - 3)
        a0 = math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0])
        a = a0 + rng.choice([-1, 1]) * rng.uniform(0.4, 0.9)
        L = length * rng.uniform(0.15, 0.35)
        rb = radii[i] * 0.55
        p2 = twig_points(hf, pts[i][:2], a, L, rng, n=max(5, int(L / 0.008)), r=rb)
        p2 = [(p[0], p[1], max(p[2], pts[i][2] + 0.0 * k)) for k, p in enumerate(p2)]
        objs.append(tube_mesh(f'{name}_b{b}', p2, [rb * (1 - 0.6 * k / (len(p2) - 1)) for k in range(len(p2))], 6,
                              coll, mat, noise_amp=0.1, seed=seed + b))
    return objs


def build_trunk(name, base, radius, height, mat, coll=None, seed=0, lean=(0.0, 0.0), seg=28, rings=26):
    rng = random.Random(seed)
    V = []
    zs = [height * (i / (rings - 1)) ** 1.6 for i in range(rings)]
    lobes = rng.randint(4, 6)
    ph = rng.uniform(0, 6.28)
    for z in zs:
        flare = 1 + 0.55 * math.exp(-z / 0.32)
        for k in range(seg):
            a = 2 * math.pi * k / seg
            r = radius * (1 - 0.12 * z / height) * flare
            r *= 1 + 0.18 * math.exp(-z / 0.45) * max(0, math.cos(lobes * a + ph)) ** 2
            r *= 1 + 0.03 * mnoise.noise(Vector((math.cos(a) * 2 + seed, math.sin(a) * 2, z * 1.5)))
            V.append((base[0] + lean[0] * z + r * math.cos(a), base[1] + lean[1] * z + r * math.sin(a), base[2] + z - 0.05))
    F = _grid_faces(rings, seg, closed=True)
    o = mesh_from_np(name, V, F, coll, smooth=True, angle=80)
    set_mat(o, mat)
    return o


# ============================================================================ water, droplets

def build_puddle(name, cx, cy, rx, ry, z, mat, coll=None, seed=0, n=48):
    V = [(cx, cy, z)]
    for k in range(n):
        a = 2 * math.pi * k / n
        k_ = 1 + 0.12 * mnoise.noise(Vector((math.cos(a) * 2 + seed, math.sin(a) * 2, 0.0)))
        V.append((cx + rx * k_ * math.cos(a), cy + ry * k_ * math.sin(a), z))
    F = [(0, 1 + k, 1 + (k + 1) % n) for k in range(n)]
    o = mesh_from_np(name, V, F, coll, smooth=False)
    set_mat(o, mat)
    try:
        o.visible_shadow = False
    except Exception:
        pass
    return o


def droplets_on(obj, n, rmin, rmax, mat, coll=None, seed=0, normal_min=0.45, region=None, name='Drops'):
    """Flattened water beads on upward-facing faces of obj (world space), joined into one mesh."""
    rng = random.Random(seed)
    bpy.context.view_layer.update()
    me = obj.data
    mw = obj.matrix_world
    nm = mw.to_3x3().inverted().transposed()
    cands = []
    for p in me.polygons:
        nw = (nm @ p.normal).normalized()
        if nw.z > normal_min:
            c = mw @ p.center
            if region is None or region(c):
                cands.append((c, nw))
    if not cands:
        return None
    bm = bmesh.new()
    for i in range(n):
        c, nw = cands[rng.randrange(len(cands))]
        r = rng.uniform(rmin, rmax)
        res = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=6, radius=r)
        R = Matrix(_rot_to(tuple(nw)).tolist())
        for v in res['verts']:
            co = v.co.copy()
            co.z = max(co.z, -0.2 * r) * 0.55
            v.co = R @ co + c
    o = from_bmesh(name, bm, coll, smooth=True, angle=89)
    set_mat(o, mat)
    try:
        o.visible_shadow = False
    except Exception:
        pass
    return o
