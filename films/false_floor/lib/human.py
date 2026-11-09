"""Stylized human characters for False Floor, built in our own code from MakeHuman's CC0 data files only
(base mesh, shape targets, CMU-compatible rig joints + skin weights; films/vendor/makehuman_data, see
films/vendor/fetch_vendor.sh). No add-on code is run.

    h = make_human('tenant', gender=1, age=50, muscle=0.45, weight=0.62, height=0.55, outfit=OUTFITS['suit'])
    aim(h, 'LeftArm', (0.15, 0.05, -1))      # point a bone along a world direction (pose, root to leaf)
    h.rig.location = (x, y, 0); h.rig.rotation_euler.z = ...

Look: sculpted "figurine" people (Fern-like documentary reconstruction): matte clay skin, real anatomy from
MakeHuman, dark glossy eyes, no hair strands (caps/short hair shells), modelled clothing shells offset from the body
and skinned with the same weights, so mocap or hand poses move body and clothes together.
"""
import gzip, json, math, os
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix

VENDOR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'vendor', 'makehuman_data')
_BASE = {}


# ----------------------------------------------------------------------------- data

def _base():
    if _BASE:
        return _BASE
    vs, faces, groups, cur = [], [], {}, None
    for ln in open(os.path.join(VENDOR, 'base.obj')):
        if ln.startswith('v '):
            x, y, z = map(float, ln.split()[1:4])
            vs.append((x, y, z))
        elif ln.startswith('g '):
            cur = ln.split()[1]
        elif ln.startswith('f '):
            idx = [int(p.split('/')[0]) - 1 for p in ln.split()[1:]]
            groups.setdefault(cur, []).append(len(faces))
            faces.append(idx)
    _BASE.update(v=np.array(vs, np.float64), faces=faces, groups=groups)
    return _BASE


def _target(rel):
    p = os.path.join(VENDOR, 'targets', rel + '.target.gz')
    if not os.path.exists(p):
        return None
    raw = gzip.open(p).read().decode()
    if not raw.strip():
        return None
    a = np.array([ln.split() for ln in raw.splitlines() if ln.strip()], np.float64)
    return a[:, 0].astype(int), a[:, 1:4]


def _tri(v, lo_name, mid_name, hi_name):
    """MakeHuman-style 3-way split of a 0..1 slider: (name, weight) pairs."""
    if v < 0.5:
        return [(lo_name, (0.5 - v) * 2), (mid_name, 1 - (0.5 - v) * 2)]
    return [(mid_name, 1 - (v - 0.5) * 2), (hi_name, (v - 0.5) * 2)]


def shaped_verts(gender=1.0, age=35, muscle=0.5, weight=0.5, height=0.5, proportions=0.6, eth=None, extra=None):
    """Base vertices with MakeHuman macro targets blended in (MH units, Y-up)."""
    B = _base()
    v = B['v'].copy()
    eth = eth or {'caucasian': 0.8, 'african': 0.05, 'asian': 0.15}
    av = 0.5 + (min(max(age, 25), 90) - 25) / 65 * 0.5          # MH age slider (adult range)
    ages = [('young', 1 - (av - 0.5) * 2), ('old', (av - 0.5) * 2)]
    gens = [('male', gender), ('female', 1 - gender)]

    def add(rel, w):
        if w <= 1e-4:
            return
        t = _target(rel)
        if t is not None:
            v[t[0]] += t[1] * w

    for e, ew in eth.items():
        for g, gw in gens:
            for a, aw in ages:
                add(f'macrodetails/{e}-{g}-{a}', ew * gw * aw)
    mus = _tri(muscle, 'minmuscle', 'averagemuscle', 'maxmuscle')
    wts = _tri(weight, 'minweight', 'averageweight', 'maxweight')
    for g, gw in gens:
        for a, aw in ages:
            for m, mw in mus:
                for w_, ww in wts:
                    base = gw * aw * mw * ww
                    add(f'macrodetails/universal-{g}-{a}-{m}-{w_}', base)
                    hn = 'maxheight' if height >= 0.5 else 'minheight'
                    add(f'macrodetails/height/{g}-{a}-{m}-{w_}-{hn}', base * abs(height - 0.5) * 2)
                    add(f'macrodetails/proportions/{g}-{a}-{m}-{w_}-idealproportions', base * proportions)
    for rel, w in (extra or {}).items():
        add(rel, w)
    return v


def _to_blender(v):
    """MH decimetres, Y-up -> metres, Z-up."""
    return np.stack([v[:, 0] * 0.1, -v[:, 2] * 0.1, v[:, 1] * 0.1], 1)


# ----------------------------------------------------------------------------- materials

def _mat(name, base, rough=0.6, sheen=0.0, sss=0.0, spec=0.4, bump=0.0, bump_scale=60.0, coat=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*base, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Specular IOR Level'].default_value = spec
    if sheen:
        p.inputs['Sheen Weight'].default_value = sheen
        p.inputs['Sheen Roughness'].default_value = 0.5
    if sss:
        p.inputs['Subsurface Weight'].default_value = sss
        p.inputs['Subsurface Scale'].default_value = 0.01
        p.inputs['Subsurface Radius'].default_value = (1.0, 0.45, 0.3)
    if coat:
        p.inputs['Coat Weight'].default_value = coat
    if bump:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        nz = nt.nodes.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = bump_scale
        nz.inputs['Detail'].default_value = 8
        bp = nt.nodes.new('ShaderNodeBump')
        bp.inputs['Strength'].default_value = bump
        bp.inputs['Distance'].default_value = 0.002
        nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        nt.links.new(nz.outputs['Fac'], bp.inputs['Height'])
        nt.links.new(bp.outputs['Normal'], p.inputs['Normal'])
        # fabric: break the flat colour a touch with the same noise
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.inputs['Factor'].default_value = 0.12
        mix.inputs[6].default_value = (*base, 1)
        mix.inputs[7].default_value = (*[c * 0.7 for c in base], 1)
        nt.links.new(nz.outputs['Fac'], mix.inputs['Factor'])
        nt.links.new(mix.outputs[2], p.inputs['Base Color'])
    return m


SKIN = {'light': (0.46, 0.31, 0.24), 'olive': (0.38, 0.25, 0.17), 'pale': (0.52, 0.37, 0.3), 'ruddy': (0.47, 0.28, 0.22)}

# outfit: list of (shell, colour, kind). shells: shirt jacket longjacket trousers shoes gloves beanie cap hair
OUTFITS = {
    'suit': [('shirt', (0.62, 0.62, 0.6), 'cotton'), ('longjacket', (0.075, 0.08, 0.09), 'wool'),
             ('trousers', (0.075, 0.08, 0.09), 'wool'), ('shoes', (0.03, 0.025, 0.02), 'leather'),
             ('hair', (0.16, 0.15, 0.14), 'hair')],
    'crew_dark': [('jacket', (0.05, 0.055, 0.06), 'nylon'), ('trousers', (0.06, 0.06, 0.065), 'cotton'),
                  ('shoes', (0.03, 0.03, 0.03), 'leather'), ('gloves', (0.025, 0.025, 0.025), 'leather'),
                  ('beanie', (0.04, 0.04, 0.045), 'knit')],
    'crew_work': [('jacket', (0.16, 0.14, 0.11), 'canvas'), ('trousers', (0.07, 0.08, 0.1), 'denim'),
                  ('shoes', (0.05, 0.035, 0.025), 'leather'), ('gloves', (0.03, 0.03, 0.03), 'leather'),
                  ('cap', (0.06, 0.06, 0.06), 'cotton')],
    'old_coat': [('shirt', (0.5, 0.48, 0.44), 'cotton'), ('longjacket', (0.19, 0.17, 0.14), 'wool'),
                 ('trousers', (0.14, 0.13, 0.12), 'wool'), ('shoes', (0.04, 0.03, 0.02), 'leather'),
                 ('hair', (0.62, 0.6, 0.57), 'hair')],
    'guard': [('shirt', (0.42, 0.46, 0.52), 'cotton'), ('trousers', (0.08, 0.09, 0.12), 'wool'),
              ('shoes', (0.03, 0.03, 0.03), 'leather'), ('hair', (0.12, 0.1, 0.09), 'hair')],
    'farmer': [('jacket', (0.2, 0.22, 0.16), 'canvas'), ('trousers', (0.18, 0.16, 0.13), 'cotton'),
               ('shoes', (0.06, 0.04, 0.03), 'leather'), ('cap', (0.16, 0.15, 0.13), 'wool')],
}
KIND = {'cotton': dict(rough=0.8, sheen=0.1, bump=0.15, bump_scale=300), 'wool': dict(rough=0.8, sheen=0.12, bump=0.2, bump_scale=200),
        'leather': dict(rough=0.38, spec=0.5, bump=0.1, bump_scale=80, coat=0.15), 'nylon': dict(rough=0.42, spec=0.5, bump=0.05),
        'knit': dict(rough=0.95, sheen=0.2, bump=0.5, bump_scale=420), 'canvas': dict(rough=0.85, sheen=0.25, bump=0.25, bump_scale=260),
        'denim': dict(rough=0.8, sheen=0.2, bump=0.25, bump_scale=500), 'hair': dict(rough=0.55, sheen=0.4, bump=0.6, bump_scale=900)}



# ----------------------------------------------------------------------------- MakeHuman CC0 assets (clothes, hair, eyebrows)

ASSETS = os.path.join(VENDOR, 'assets')


def _mhclo(rel):
    d = os.path.join(ASSETS, rel)
    n = os.path.basename(rel)
    info, verts, delete, mode = {}, [], set(), None
    for ln in open(os.path.join(d, n + '.mhclo')):
        ln = ln.strip()
        if not ln or ln.startswith('#'):
            continue
        if ln.startswith('verts'):
            mode = 'v'
            continue
        if ln.startswith('delete_verts'):
            mode = 'd'
            continue
        if mode == 'v' and ln[0].isdigit():
            verts.append([float(x) for x in ln.split()])
            continue
        if mode == 'd' and ln[0].isdigit():
            tok = ln.split()
            i = 0
            while i < len(tok):
                if i + 2 < len(tok) and tok[i + 1] == '-':
                    delete.update(range(int(tok[i]), int(tok[i + 2]) + 1))
                    i += 3
                else:
                    delete.add(int(tok[i]))
                    i += 1
            continue
        k, _, rest = ln.partition(' ')
        info[k] = rest.strip()
    obj = os.path.join(d, info.get('obj_file', n + '.obj'))
    assert verts, f'no fitting verts parsed for {rel}'
    vs, vts, faces, fuv = [], [], [], []
    for ln in open(obj):
        if ln.startswith('v '):
            vs.append(1)
        elif ln.startswith('vt '):
            vts.append(tuple(float(x) for x in ln.split()[1:3]))
        elif ln.startswith('f '):
            ps = [p.split('/') for p in ln.split()[1:]]
            faces.append([int(p[0]) - 1 for p in ps])
            fuv.append([int(p[1]) - 1 if len(p) > 1 and p[1] else 0 for p in ps])
    mat = {}
    mp = os.path.join(d, info.get('material', n + '.mhmat'))
    if os.path.exists(mp):
        for ln in open(mp):
            k, _, v = ln.strip().partition(' ')
            v = v.strip()
            if k in ('diffuseTexture', 'normalmapTexture', 'transparent', 'alphaToCoverage'):
                mat[k] = v
    return dict(dir=d, info=info, verts=verts, delete=delete, faces=faces, fuv=fuv, uv=vts, mat=mat, nverts=len(vs))


def _fit(a, Vmh):
    def sc(key, axis):
        i, j, ref = a['info'][key].split()
        return abs(Vmh[int(i), axis] - Vmh[int(j), axis]) / float(ref)
    s = np.array([sc('x_scale', 0), sc('y_scale', 1), sc('z_scale', 2)])
    P = np.zeros((len(a['verts']), 3))
    refs = []
    for k, row in enumerate(a['verts']):
        if len(row) >= 9:
            v = [int(row[0]), int(row[1]), int(row[2])]
            w = row[3:6]
            P[k] = w[0] * Vmh[v[0]] + w[1] * Vmh[v[1]] + w[2] * Vmh[v[2]] + np.array(row[6:9]) * s
            refs.append((v, w))
        else:
            v = int(row[0])
            P[k] = Vmh[v]
            refs.append(([v], [1.0]))
    return P, refs


def _asset_mat(a, name, tint=None, sat=1.0, val=1.0, rough=0.75, sheen=0.1):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = rough
    p.inputs['Specular IOR Level'].default_value = 0.35
    if sheen:
        p.inputs['Sheen Weight'].default_value = sheen
    tex = a['mat'].get('diffuseTexture')
    if tex and os.path.exists(os.path.join(a['dir'], tex)):
        im = nt.nodes.new('ShaderNodeTexImage')
        im.image = bpy.data.images.load(os.path.join(a['dir'], tex), check_existing=True)
        hs = nt.nodes.new('ShaderNodeHueSaturation')
        hs.inputs['Saturation'].default_value = sat
        hs.inputs['Value'].default_value = val
        nt.links.new(im.outputs['Color'], hs.inputs['Color'])
        out = hs.outputs['Color']
        if tint:
            mx = nt.nodes.new('ShaderNodeMix')
            mx.data_type = 'RGBA'
            mx.blend_type = 'MULTIPLY'
            mx.inputs['Factor'].default_value = 1.0
            nt.links.new(out, mx.inputs[6])
            mx.inputs[7].default_value = (*tint, 1)
            out = mx.outputs[2]
        nt.links.new(out, p.inputs['Base Color'])
        if a['mat'].get('transparent', 'False') == 'True' or 'hair' in a['dir'] or 'eyebrow' in a['dir']:
            nt.links.new(im.outputs['Alpha'], p.inputs['Alpha'])
    nrm = None
    for f in os.listdir(a['dir']):
        if f.endswith('_normal.png'):
            nrm = f
    if nrm:
        im2 = nt.nodes.new('ShaderNodeTexImage')
        im2.image = bpy.data.images.load(os.path.join(a['dir'], nrm), check_existing=True)
        im2.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = 0.8
        nt.links.new(im2.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], p.inputs['Normal'])
    return m



FINGER_JOINTS = (0.47, 0.77)          # proximal / middle / distal phalanx split along each finger (MCP -> tip)


def finger_bones(side):
    """New per-finger chains made by _split_fingers: [(proximal, middle, distal)] x 4, index .. little."""
    return [(f'{side}F{k}_1', f'{side}F{k}_2', f'{side}F{k}_3') for k in range(4)]


def _split_fingers(arm, weights, V):
    """The cmu_mb rig drives all four fingers with ONE chain (FingerBase -> HandFinger1): a 'grip' bent flat fingers
    at the knuckle and never wrapped a handle. Give each finger its own 3-bone chain (children of HandFinger1, so the
    old knuckle bend still works), found from the mesh: finger vertices split into 4 by their position across the
    hand, joints at FINGER_JOINTS of each finger's length, weights blended across each joint.
    Must run in armature EDIT mode, before the weights are handed to the meshes."""
    import numpy as np
    out = dict(weights)
    for side in ('Left', 'Right'):
        hf = arm.edit_bones[f'{side}HandFinger1']
        lst = weights.get(f'{side}HandFinger1', [])
        if len(lst) < 40:
            continue
        ids = np.array([vi for vi, w in lst])
        ws = np.array([w for vi, w in lst])
        P = V[ids]
        h0 = np.array(hf.head)
        a = np.array(hf.tail - hf.head)
        a /= np.linalg.norm(a)
        rel = P - h0
        sa = rel @ a
        perp = rel - np.outer(sa, a)
        U, S_, Vt = np.linalg.svd(perp - perp.mean(0), full_matrices=False)
        e1, e2 = Vt[0], Vt[1]
        lat, thk = perp @ e1, perp @ e2
        core = ws > 0.5
        c = np.quantile(lat[core], [0.125, 0.375, 0.625, 0.875])          # 1-D k-means, 4 fingers side by side
        for _ in range(20):
            lab = np.argmin(np.abs(lat[:, None] - c[None, :]), 1)
            c = np.array([lat[lab == k].mean() if (lab == k).any() else c[k] for k in range(4)])
        order = np.argsort(c)
        if side == 'Left':
            order = order[::-1]
        z_axis = hf.z_axis.copy()
        new = {}
        names = finger_bones(side)
        for k, ci in enumerate(order):
            m = lab == ci
            if m.sum() < 8:
                continue
            mc = m & core if (m & core).sum() >= 4 else m
            s_k, s_t = float(np.quantile(sa[mc], 0.05)), float(sa[m].max())
            L = max(s_t - s_k, 1e-3)
            cl, ct = float(lat[m].mean()), float(np.median(thk[m]))
            def pt(sv):
                return Vector(tuple(h0 + a * sv + e1 * cl + e2 * ct))
            js = [s_k, s_k + FINGER_JOINTS[0] * L, s_k + FINGER_JOINTS[1] * L, s_t]
            parent = hf
            for j in range(3):
                eb = arm.edit_bones.new(names[k][j])
                eb.head, eb.tail = pt(js[j]), pt(js[j + 1])
                eb.align_roll(z_axis)
                eb.parent = parent
                eb.use_connect = j > 0
                eb.use_deform = True
                parent = eb
            t = (sa[m] - s_k) / L
            def sm(x):
                x = np.clip(x, 0, 1)
                return x * x * (3 - 2 * x)
            f12 = sm((t - FINGER_JOINTS[0]) / 0.14 + 0.5)
            f23 = sm((t - FINGER_JOINTS[1]) / 0.12 + 0.5)
            parts = (1 - f12, f12 * (1 - f23), f12 * f23)
            for j in range(3):
                wj = ws[m] * parts[j]
                new[names[k][j]] = [[int(v), float(w)] for v, w in zip(ids[m], wj) if w > 0.003]
        assigned = set(int(v) for k in new for v, _ in new[k])
        out[f'{side}HandFinger1'] = [[vi, w] for vi, w in lst if vi not in assigned]
        out.update(new)
        SETS['hand'] |= set(new)
    return out


SHOULDER_SMOOTH = 30          # weight-diffusion iterations at the shoulders (0 = MakeHuman weights as shipped)
SHOULDER_SET = ('LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm')   # Spine1 left out: it ballooned the back
CLOTH_SMOOTH = int(os.environ.get('FF_CLOTH_SMOOTH', 8))   # Laplacian drape iterations on fitted clothes
CLOTH_LAMBDA = float(os.environ.get('FF_CLOTH_LAMBDA', 0.6))
CLOTH_VP = bool(int(os.environ.get('FF_CLOTH_VP', 0)))
PRESERVE_VOLUME = False       # dual-quaternion skinning puffed shoulders into a hump on any forward reach


def _smooth_shoulder_weights(weights, faces, nv, iters, alpha=0.6):
    """The shipped cmu_mb weights hand the shoulder over from clavicle to upper arm within ~1 cm, so lowering the
    arm from the A-pose rest folds the deltoid into a square shelf (the 'boxy shoulders'). Diffuse the weights of the
    shoulder bones over the mesh so the bend is spread across the whole deltoid. Only these bones trade weight with
    each other; each vertex keeps its total, so the rest of the body is untouched."""
    import numpy as np
    S = list(SHOULDER_SET)
    Wm = np.zeros((nv, len(S)))
    for j, b in enumerate(S):
        for vi, w in weights.get(b, ()):
            Wm[vi, j] = w
    tot = Wm.sum(1)
    reg = tot > 1e-6
    e = set()
    for f in faces:
        for a, b in zip(f, f[1:] + f[:1]):
            e.add((min(a, b), max(a, b)))
    e = np.array(sorted(e))
    deg = np.zeros(nv)
    np.add.at(deg, e[:, 0], 1)
    np.add.at(deg, e[:, 1], 1)
    deg = np.maximum(deg, 1)
    for _ in range(iters):
        acc = np.zeros_like(Wm)
        np.add.at(acc, e[:, 0], Wm[e[:, 1]])
        np.add.at(acc, e[:, 1], Wm[e[:, 0]])
        nb = acc / deg[:, None]
        Wn = (1 - alpha) * Wm + alpha * nb
        sm = Wn.sum(1)
        Wn = np.where((sm > 1e-9)[:, None], Wn / np.maximum(sm, 1e-9)[:, None] * tot[:, None], 0.0)
        Wm = np.where(reg[:, None], Wn, Wm)
    out = {b: lst for b, lst in weights.items() if b not in S}
    for j, b in enumerate(S):
        idx = np.nonzero(Wm[:, j] > 0.004)[0]
        out[b] = [[int(i), float(Wm[i, j])] for i in idx]
    return out


def wear_assets(name, rig, Vmh, Vbl_shift, weights, items):
    """Fit MakeHuman assets to the shaped body; returns (objects, deleted base-vertex set)."""
    objs, deleted = [], set()
    for rel, opts in items:
        a = _mhclo(rel)
        deleted |= a['delete']
        P, refs = _fit(a, Vmh)
        Pb = _to_blender(P)
        Pb[:, 2] -= Vbl_shift
        me = bpy.data.meshes.new(f'{name}_{os.path.basename(rel)}')
        me.from_pydata([tuple(p) for p in Pb], [], a['faces'])
        me.update()
        if a['uv']:
            uvl = me.uv_layers.new(name='UV')
            k = 0
            for poly, fu in zip(me.polygons, a['fuv']):
                for li, ui in zip(poly.loop_indices, fu):
                    uvl.data[li].uv = a['uv'][ui] if ui < len(a['uv']) else (0, 0)
        ob = bpy.data.objects.new(me.name, me)
        bpy.context.scene.collection.objects.link(ob)
        for poly in me.polygons:
            poly.use_smooth = True
        # skin weights interpolated from the three reference vertices
        acc = {}
        for k, (vv, ww) in enumerate(refs):
            for vi, wi in zip(vv, ww):
                for b, wb in weights.get(vi, ()):
                    acc.setdefault(b, {}).setdefault(k, 0.0)
                    acc[b][k] += wi * wb
        for b, dct in acc.items():
            g = ob.vertex_groups.new(name=b)
            for k, w in dct.items():
                if w > 0.01:
                    g.add([k], min(1.0, w), 'REPLACE')
        if CLOTH_SMOOTH and rel.startswith('clothes/') and not any(k in rel for k in ('shoes', 'fedora', 'hat')):
            # fabric does not show the spine, shoulder blades and buttocks underneath: smooth the fitted garment at rest
            # (volume-preserving), so it drapes over the body instead of shrink-wrapping its muscle relief
            ls = ob.modifiers.new('Drape', 'LAPLACIANSMOOTH')
            ls.iterations = CLOTH_SMOOTH
            ls.lambda_factor = CLOTH_LAMBDA
            ls.lambda_border = 0.0
            ls.use_volume_preserve = CLOTH_VP
            ls.use_normalized = True
        if not ('hair' in rel or 'eyebrow' in rel):
            push = ob.modifiers.new('Push', 'DISPLACE')      # garments sit a few mm off the body: no poke-through
            push.strength = 0.004 if 'shoes' not in rel else 0.002
            push.mid_level = 0.0
        am = ob.modifiers.new('Armature', 'ARMATURE')
        am.object = rig
        am.use_deform_preserve_volume = PRESERVE_VOLUME
        if not ('hair' in rel or 'eyebrow' in rel):
            sub = ob.modifiers.new('Sub', 'SUBSURF')
            sub.levels = sub.render_levels = 1
        ob.data.materials.append(_asset_mat(a, f'{name}_{os.path.basename(rel)}_mat', **opts))
        ob.parent = rig
        objs.append(ob)
    return objs, deleted


# ----------------------------------------------------------------------------- build

class Human:
    pass


def _bone_dominant(weights, nverts):
    dom = np.full(nverts, -1)
    best = np.zeros(nverts)
    names = list(weights)
    for bi, b in enumerate(names):
        for vi, w in weights[b]:
            if vi < nverts and w > best[vi]:
                best[vi], dom[vi] = w, bi
    return names, dom



LIMB = {'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'}
TORSO = {'Hips', 'LowerBack', 'Spine', 'Spine1', 'LeftShoulder', 'RightShoulder', 'LHipJoint', 'RHipJoint', 'Neck'}


def _garment_volume(P, bone_of, axes, shell, chest_z, hip_z):
    """Give a garment real volume: limb parts become rounded tubes (no muscle detail), torso slices fill their
    concavities and, for jackets, hang straight down from the chest instead of following the waist."""
    P = P.copy()
    fill = {'jacket': 0.9, 'longjacket': 0.9, 'trousers': 0.8, 'shirt': 0.45}.get(shell, 0.0)
    if fill <= 0:
        return P
    # limbs: per bone, per 12 bins along the axis -> radius toward the bin's max radius
    for b in LIMB:
        idx = np.where(bone_of == b)[0]
        if len(idx) < 8:
            continue
        h, t = axes[b]
        ax = t - h
        L = np.linalg.norm(ax)
        u = ax / L
        rel = P[idx] - h
        tt = rel @ u
        radial = rel - np.outer(tt, u)
        r = np.linalg.norm(radial, axis=1) + 1e-9
        bins = np.clip(((tt / L) * 12).astype(int), -2, 13)
        target = r.copy()
        for k in np.unique(bins):
            m = bins == k
            target[m] = np.percentile(r[m], 92)
        newr = r + (np.maximum(target, r) - r) * fill
        P[idx] = h + np.outer(tt, u) + radial * (newr / r)[:, None]
    # torso: slices of 2 cm, 24 angular sectors -> fill toward the sector's (smoothed) max radius
    idx = np.where(np.isin(bone_of, list(TORSO)))[0]
    if len(idx) > 30:
        Q = P[idx]
        cz = Q[:, 2]
        out = Q.copy()
        chest_profile = None
        zbins = np.floor(cz / 0.02).astype(int)
        order = sorted(np.unique(zbins), reverse=True)
        for zb in order:
            m = zbins == zb
            pts = Q[m]
            c = pts[:, :2].mean(0)
            d = pts[:, :2] - c
            r = np.linalg.norm(d, axis=1) + 1e-9
            ang = np.arctan2(d[:, 1], d[:, 0])
            sec = ((ang + np.pi) / (2 * np.pi) * 24).astype(int) % 24
            smax = np.zeros(24)
            for k in range(24):
                if np.any(sec == k):
                    smax[k] = r[sec == k].max()
            for k in range(24):           # fill empty sectors from neighbours, then smooth (convex-ish)
                if smax[k] == 0:
                    smax[k] = max(smax[(k - 1) % 24], smax[(k + 1) % 24])
            sm = np.maximum(smax, (np.roll(smax, 1) + np.roll(smax, -1)) / 2)
            zc = zb * 0.02
            if shell in ('jacket', 'longjacket') and zc < chest_z:
                if chest_profile is not None:
                    sm = np.maximum(sm, chest_profile * (0.93 if zc > hip_z else 0.97))
            if shell in ('jacket', 'longjacket') and abs(zc - chest_z) < 0.011:
                chest_profile = sm.copy()
            tr = sm[sec]
            newr = r + (np.maximum(tr, r) - r) * fill
            out[m, :2] = c + d * (newr / r)[:, None]
        P[idx] = out
    return P


SETS = {
    'torso': {'Hips', 'LowerBack', 'Spine', 'Spine1', 'Neck', 'LeftShoulder', 'RightShoulder', 'LHipJoint', 'RHipJoint'},
    'upperarm': {'LeftArm', 'RightArm'}, 'forearm': {'LeftForeArm', 'RightForeArm'},
    'hand': {'LeftHand', 'RightHand', 'LThumb', 'RThumb', 'LeftFingerBase', 'RightFingerBase', 'LeftHandFinger1',
             'RightHandFinger1'},
    'thigh': {'LeftUpLeg', 'RightUpLeg'}, 'shin': {'LeftLeg', 'RightLeg'}, 'foot': {'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'},
    'head': {'Head', 'Neck1'},
}
SHELL = {   # bone sets covered, offset (m), extra z rules handled in _shell
    'shirt': (['torso', 'upperarm', 'forearm'], 0.004), 'jacket': (['torso', 'upperarm', 'forearm'], 0.014),
    'longjacket': (['torso', 'upperarm', 'forearm'], 0.012), 'trousers': (['thigh', 'shin', 'torso'], 0.007),
    'shoes': (['foot', 'shin'], 0.009), 'gloves': (['hand', 'forearm'], 0.003), 'beanie': (['head'], 0.012),
    'cap': (['head'], 0.010), 'hair': (['head'], 0.006),
}


def make_human(name, gender=1.0, age=35, muscle=0.5, weight=0.5, height=0.5, proportions=0.6, eth=None, skin='light',
               outfit=None, extra=None, subdiv=2, assets=None):
    B = _base()
    Vmh = shaped_verts(gender, age, muscle, weight, height, proportions, eth, extra)
    V = _to_blender(Vmh)
    # ground the figure: lowest body vertex at z=0
    body_f = [B['faces'][i] for i in B['groups']['body']]
    body_vids = sorted({i for f in body_f for i in f})
    zshift = float(V[body_vids, 2].min())
    V[:, 2] -= zshift

    rig_def = json.load(open(os.path.join(VENDOR, 'rigs', 'rig.cmu_mb.json')))
    weights = json.load(open(os.path.join(VENDOR, 'rigs', 'weights.cmu_mb.json')))['weights']
    if SHOULDER_SMOOTH:
        weights = _smooth_shoulder_weights(weights, body_f, len(V), SHOULDER_SMOOTH)

    def joint(spec):
        if spec['strategy'] == 'CUBE':
            fs = [B['faces'][i] for i in B['groups'][spec['cube_name']]]
            ids = sorted({i for f in fs for i in f})
        else:
            ids = spec['vertex_indices']
        return Vector(V[ids].mean(0))

    # armature
    arm = bpy.data.armatures.new(name + '_rig')
    rig = bpy.data.objects.new(name + '_rig', arm)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    order, done = [], set()
    while len(order) < len(rig_def):
        for b, d in rig_def.items():
            if b not in done and (not d['parent'] or d['parent'] in done):
                order.append(b)
                done.add(b)
    for b in order:
        d = rig_def[b]
        eb = arm.edit_bones.new(b)
        eb.head, eb.tail = joint(d['head']), joint(d['tail'])
        if (eb.tail - eb.head).length < 1e-4:
            eb.tail = eb.head + Vector((0, 0, 0.02))
        eb.roll = d['roll']
        if d['parent']:
            eb.parent = arm.edit_bones[d['parent']]
            eb.use_connect = d['use_connect']
    weights = _split_fingers(arm, weights, V)
    bpy.ops.object.mode_set(mode='OBJECT')

    # body mesh (body group only) + eyes
    def mesh_from(groups, oname):
        fs = [B['faces'][i] for g in groups for i in B['groups'].get(g, [])]
        ids = sorted({i for f in fs for i in f})
        remap = {o: n for n, o in enumerate(ids)}
        me = bpy.data.meshes.new(oname)
        me.from_pydata([tuple(V[i]) for i in ids], [], [[remap[i] for i in f] for f in fs])
        me.update()
        ob = bpy.data.objects.new(oname, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob, ids, remap

    # ---- garment face selections (indices into body_f), decided before the body is built
    names, dom = _bone_dominant(weights, len(B['v']))
    zs = {b: joint(rig_def[b]['head']).z for b in ('Hips', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'Head', 'Neck1', 'LeftForeArm', 'LeftHand')}
    head_top = float(V[body_vids, 2].max())
    zs['chest'] = zs['Hips'] + (zs['Neck1'] - zs['Hips']) * 0.62
    sel = {}
    for shell, col, kind in (outfit or []):
        sets, off = SHELL[shell]
        bones = set().union(*[SETS[s] for s in sets])
        keep = []
        for fi, f in enumerate(body_f):
            bs = {names[dom[i]] for i in f if dom[i] >= 0}
            if not bs & bones:
                continue
            zc = float(np.mean(V[f, 2]))
            fy = float(np.mean(V[f, 1]))
            if shell in ('shirt', 'jacket', 'longjacket'):
                if bs & (SETS['head'] | SETS['hand']) or zc > zs['Neck1'] - 0.03:
                    continue
                low = {'shirt': zs['Hips'] - 0.02, 'jacket': zs['Hips'] - 0.09, 'longjacket': zs['Hips'] - 0.2}[shell]
                if zc < low or (bs & SETS['thigh'] and shell != 'longjacket'):
                    continue
                if bs & SETS['forearm'] and zc < 0 and False:
                    continue
            elif shell == 'trousers':
                if zc > zs['Hips'] + 0.07 or zc < zs['LeftFoot'] + 0.045 or bs & (SETS['upperarm'] | SETS['forearm'] | SETS['hand']):
                    continue
            elif shell == 'shoes':
                if zc > zs['LeftFoot'] + 0.075:
                    continue
            elif shell == 'gloves':
                if not bs & SETS['hand']:
                    continue
            elif shell in ('beanie', 'cap', 'hair'):
                cut = head_top - {'beanie': 0.11, 'cap': 0.085, 'hair': 0.08}[shell]
                if zc < cut:
                    continue
                if shell == 'hair' and fy < -0.055 and zc < head_top - 0.03:
                    continue
                if shell == 'beanie' and fy < -0.065 and zc < head_top - 0.055:
                    continue
            keep.append(fi)
        if keep:
            sel[(shell, col, kind)] = keep

    # body faces fully under an opaque garment (away from its edges) are dropped: no poke-through when posed
    covered = set()
    for (shell, col, kind), keep in sel.items():
        if shell in ('hair', 'cap', 'beanie'):
            continue
        ks = set(keep)
        edge_cnt = {}
        for fi in keep:
            f = body_f[fi]
            for a, b in zip(f, f[1:] + f[:1]):
                e = (min(a, b), max(a, b))
                edge_cnt[e] = edge_cnt.get(e, 0) + 1
        bverts = {v for e, c in edge_cnt.items() if c == 1 for v in e}
        ring = {fi for fi in keep if any(v in bverts for v in body_f[fi])}
        ring2 = {fi for fi in keep if any(v in {u for r in ring for u in body_f[r]} for v in body_f[fi])}
        covered |= ks - ring - ring2

    # ---- MakeHuman clothes / hair / eyebrows (their delete lists hide the body underneath)
    wmap = {}
    for bn, lst in weights.items():
        for vi, w in lst:
            wmap.setdefault(vi, []).append((bn, w))
    worn, deleted = wear_assets(name, rig, Vmh, zshift, wmap, assets or [])
    if deleted:
        covered |= {fi for fi, f in enumerate(body_f) if any(i in deleted for i in f)}

    # ---- body mesh (uncovered body faces) + eyes
    body_groups_faces = [fi for fi in range(len(body_f)) if fi not in covered]
    fs = [body_f[fi] for fi in body_groups_faces]
    ids = sorted({i for f in fs for i in f})
    remap = {o: n for n, o in enumerate(ids)}
    me = bpy.data.meshes.new(name + '_body')
    me.from_pydata([tuple(V[i]) for i in ids], [], [[remap[i] for i in f] for f in fs])
    me.update()
    body = bpy.data.objects.new(name + '_body', me)
    bpy.context.scene.collection.objects.link(body)
    for p in body.data.polygons:
        p.use_smooth = True
    for b, lst in weights.items():
        g = body.vertex_groups.new(name=b)
        for vi, w in lst:
            if vi in remap:
                g.add([remap[vi]], w, 'REPLACE')
    body.parent = rig
    mod = body.modifiers.new('Armature', 'ARMATURE')
    mod.object = rig
    mod.use_deform_preserve_volume = PRESERVE_VOLUME
    sub = body.modifiers.new('Sub', 'SUBSURF')
    sub.levels = sub.render_levels = subdiv
    body.data.materials.append(_mat(f'Skin_{skin}', SKIN[skin], rough=0.5, sss=0.18, spec=0.4, bump=0.04, bump_scale=900))

    eyes, _, _ = mesh_from(['helper-l-eye', 'helper-r-eye'], name + '_eyes')
    for p in eyes.data.polygons:
        p.use_smooth = True
    eyes.data.materials.append(_mat('Eye', (0.02, 0.018, 0.016), rough=0.08, spec=0.7, coat=1.0))
    eyes.parent = rig
    ge = eyes.vertex_groups.new(name='Head')
    ge.add(list(range(len(eyes.data.vertices))), 1.0, 'REPLACE')
    em = eyes.modifiers.new('Armature', 'ARMATURE')
    em.object = rig

    # ---- garment shells: offset, relaxed (loose fit), collar, wrinkles, thickness, same skin weights
    shells = []
    neck_c = joint(rig_def['Neck1']['head'])
    for (shell, col, kind), keep in sel.items():
        sets, off = SHELL[shell]
        fs = [body_f[fi] for fi in keep]
        sids = sorted({i for f in fs for i in f})
        srm = {o: n for n, o in enumerate(sids)}
        bone_of = np.array([names[dom[i]] if dom[i] >= 0 else '' for i in sids])
        axes = {bn: (np.array(joint(rig_def[bn]['head'])), np.array(joint(rig_def[bn]['tail']))) for bn in LIMB}
        GP = _garment_volume(V[sids], bone_of, axes, shell, zs['chest'], zs['Hips'] - 0.02)
        me = bpy.data.meshes.new(f'{name}_{shell}')
        me.from_pydata([tuple(p) for p in GP], [], [[srm[i] for i in f] for f in fs])
        me.update()
        ob = bpy.data.objects.new(f'{name}_{shell}', me)
        bpy.context.scene.collection.objects.link(ob)
        for b, lst in weights.items():
            g = ob.vertex_groups.new(name=b)
            for vi, w in lst:
                if vi in srm:
                    g.add([srm[vi]], w, 'REPLACE')
        bm = bmesh.new()
        bm.from_mesh(me)
        bm.normal_update()
        loose = {'jacket': 8, 'longjacket': 8, 'trousers': 6, 'shirt': 2, 'shoes': 3, 'gloves': 1, 'beanie': 3, 'cap': 3, 'hair': 2}[shell]
        for v in bm.verts:
            v.co += v.normal * off
        inner = [v for v in bm.verts if not v.is_boundary]
        for _ in range(loose):
            bmesh.ops.smooth_vert(bm, verts=inner, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
        bm.normal_update()
        for v in bm.verts:                       # restore volume lost to relaxing
            v.co += v.normal * off * (0.35 if loose >= 6 else 0.15)
        if shell in ('shirt', 'jacket', 'longjacket'):
            ring = [e for e in bm.edges if e.is_boundary and min(v.co.z for v in e.verts) > zs['Neck1'] - 0.09]
            if ring:
                ext = bmesh.ops.extrude_edge_only(bm, edges=ring)
                for v in [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]:
                    r = Vector((v.co.x - neck_c.x, v.co.y - neck_c.y, 0))
                    r = r.normalized() if r.length > 1e-6 else Vector((0, 0, 0))
                    if shell == 'shirt':
                        v.co += Vector((0, 0, 0.022)) + r * 0.003
                    else:
                        v.co += Vector((0, 0, 0.012)) + r * 0.016
        if shell in ('cap',):
            # brim: extrude the front boundary forward
            front = [e for e in bm.edges if e.is_boundary and max(v.co.y for v in e.verts) < -0.02]
            if front:
                ext = bmesh.ops.extrude_edge_only(bm, edges=front)
                for v in [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]:
                    v.co += Vector((0, -0.06, 0.004))
        bm.to_mesh(me)
        bm.free()
        for p in me.polygons:
            p.use_smooth = True
        if shell in ('jacket', 'longjacket', 'trousers', 'shirt'):
            tex = bpy.data.textures.get('ClothFolds') or bpy.data.textures.new('ClothFolds', 'CLOUDS')
            tex.noise_scale = 0.07
            tex.noise_depth = 2
            d = ob.modifiers.new('Folds', 'DISPLACE')
            d.texture = tex
            d.texture_coords = 'LOCAL'
            d.strength = 0.012 if shell != 'shirt' else 0.004
            d.mid_level = 0.5
        sol = ob.modifiers.new('Thick', 'SOLIDIFY')
        sol.thickness = 0.005 if shell not in ('beanie', 'hair', 'cap') else 0.008
        sol.offset = 1.0
        a = ob.modifiers.new('Armature', 'ARMATURE')
        a.object = rig
        a.use_deform_preserve_volume = PRESERVE_VOLUME
        s_ = ob.modifiers.new('Sub', 'SUBSURF')
        s_.levels = s_.render_levels = 1 if shell != 'hair' else 2
        ob.data.materials.append(_mat(f'{shell}_{kind}_{"%.2f%.2f%.2f" % col}', col, **KIND[kind]))
        ob.parent = rig
        shells.append(ob)

    h = Human()
    h.name, h.rig, h.body, h.eyes, h.shells = name, rig, body, eyes, shells + worn
    h.height = float(V[body_vids, 2].max())
    for b in rig.pose.bones:
        b.rotation_mode = 'XYZ'
    return h


# ----------------------------------------------------------------------------- posing

def aim(h, bone, direction, twist=0.0):
    """Rotate pose bone so its axis (head->tail) points along a WORLD direction. Call root-to-leaf."""
    bpy.context.view_layer.update()
    pb = h.rig.pose.bones[bone]
    mw = h.rig.matrix_world
    cur = (mw.to_3x3() @ (pb.tail - pb.head)).normalized()
    want = Vector(direction).normalized()
    q = cur.rotation_difference(want)
    # world-space rotation about the bone head -> apply in armature space
    m_arm = pb.matrix.copy()
    rot_arm = (mw.to_3x3().inverted() @ q.to_matrix() @ mw.to_3x3()).to_4x4()
    head = m_arm.to_translation()
    new = Matrix.Translation(head) @ rot_arm @ Matrix.Translation(-head) @ m_arm
    if twist:
        new = new @ Matrix.Rotation(twist, 4, 'Y')
    pb.matrix = new
    bpy.context.view_layer.update()


def rot(h, bone, x=0.0, y=0.0, z=0.0):
    """Local bone rotation in degrees (fine adjustments, fingers, head nods). Works in Euler or quaternion mode."""
    from mathutils import Euler
    pb = h.rig.pose.bones[bone]
    e = Euler((math.radians(x), math.radians(y), math.radians(z)), 'XYZ')
    if pb.rotation_mode == 'QUATERNION':
        pb.rotation_quaternion = e.to_quaternion()
    else:
        pb.rotation_euler = e
    bpy.context.view_layer.update()


def curl(rig, side, amount, sign=1.0):
    """Close a hand on the per-finger chains: amount 1 = fist round a ~3 cm handle, ~0.3 = relaxed hang."""
    from mathutils import Euler
    S_ = side if side in ('Left', 'Right') else ('Left' if side == 'L' else 'Right')
    T_ = 'LThumb' if S_ == 'Left' else 'RThumb'
    pbs = rig.pose.bones

    def setr(bn, x=0.0, z=0.0):
        if bn not in pbs:
            return
        pb = pbs[bn]
        e = Euler((math.radians(x), 0.0, math.radians(z)), 'XYZ')
        if pb.rotation_mode == 'QUATERNION':
            pb.rotation_quaternion = e.to_quaternion()
        else:
            pb.rotation_euler = e
    a, s = amount, sign
    split = f'{S_}F0_2' in pbs
    setr(f'{S_}FingerBase', s * (10 if split else 38) * a)
    setr(f'{S_}HandFinger1', s * (55 if split else 75) * a)
    for k, (p1, p2, p3) in enumerate(finger_bones(S_)):
        spread = (k - 1.5) * 1.5 * a           # fingers fan in slightly as they close
        setr(p1, s * 4 * a, spread)
        setr(p2, s * (80 + 6 * k) * a)
        setr(p3, s * 55 * a)
    setr(T_, s * 20 * a, (-1 if S_ == 'Left' else 1) * 25 * a)


def place(h, x, y, yaw_deg=0.0, z=0.0):
    h.rig.location = (x, y, z)
    h.rig.rotation_euler = (0, 0, math.radians(yaw_deg))
    bpy.context.view_layer.update()


def stand(h, arms='down', spread=0.12):
    """Neutral standing pose in the rig's local frame (character faces -Y)."""
    R = h.rig.matrix_world.to_3x3()
    if arms == 'down':
        aim(h, 'LeftArm', R @ Vector((spread + 0.05, 0.03, -1)))
        aim(h, 'LeftForeArm', R @ Vector((spread * 0.6, -0.12, -1)))
        aim(h, 'RightArm', R @ Vector((-spread - 0.05, 0.03, -1)))
        aim(h, 'RightForeArm', R @ Vector((-spread * 0.6, -0.12, -1)))
