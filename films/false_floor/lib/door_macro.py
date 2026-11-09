"""FALSE FLOOR · set A2 "door macro": macro close-ups of the vault door's security layers (illustrative
reconstruction). S15 drill bit vs the door edge, S16 0-99 wheel + reading lens, S17 long two-part key,
S18 / S22 / S24 the magnetic contact plates across the door/frame seam.

Units are real metres (1 BU = 1 m): every part is millimetres to centimetres, so DOF from the camera f-stop is physical
(macro-thin). World frame shared by every builder here (same convention as the door set): Z up, the door's front face is
the plane y = 0 facing -Y (antechamber side, where the camera stands), +X to the right.

Materials reuse the TUMBLER constructors (common.mat_metal / mat_paint / mat_concentric, lock.build_dial /
mat_dial_black / mat_fill) with the base colours and roughness of tumbler/lib/vault.mats() (door steel = 'edge',
dark steel = 'dark', turned bosses = 'satin', chrome) and a dark painted frame; only the grain is resized for macro.
The tape is the film's black cloth gaffer tape (vault_ff.mat_tape colour/roughness) with a macro cloth weave.
"""
import math, os, random
import bpy, bmesh
from mathutils import Vector, Matrix
from ff import *
from lock import build_dial, mat_dial_black, mat_fill

FONT_NUM = os.path.join(FF, 'fonts', 'BarlowCondensed-SemiBold.ttf')


# ----------------------------------------------------------------------------- material helpers

def set_bump(m, strength=None, distance=None):
    for n in m.node_tree.nodes:
        if n.bl_idname == 'ShaderNodeBump':
            if strength is not None:
                n.inputs['Strength'].default_value = strength
            if distance is not None:
                n.inputs['Distance'].default_value = distance
    return m


def set_aniso(m, amount=0.45, axis=(1.0, 0.0, 0.0)):
    """Anisotropic highlights with a fixed object-space tangent (brushing direction)."""
    nb = NB(m)
    p = principled(m)
    c = nb.n('ShaderNodeCombineXYZ', X=axis[0], Y=axis[1], Z=axis[2])
    vt = nb.n('ShaderNodeVectorTransform', {'vector_type': 'VECTOR', 'convert_from': 'OBJECT', 'convert_to': 'WORLD'})
    nb.l(c, 'Vector', vt, 'Vector')
    nb.l(vt, 'Vector', p, 'Tangent')
    p.inputs['Anisotropic'].default_value = amount
    return m


def mat_lens_glass(name='LensGlass', tint=(0.965, 0.985, 0.975), ior=1.52):
    """Optical glass; shadow rays pass straight through (lets the room light reach what sits under the lens)."""
    m = new_mat(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    nb = NB(m)
    g = nb.n('ShaderNodeBsdfGlass', Color=tint, Roughness=0.0, IOR=ior)
    t = nb.n('ShaderNodeBsdfTransparent')
    lp = nb.n('ShaderNodeLightPath')
    mx = nb.n('ShaderNodeMixShader')
    nt.links.new(lp.outputs['Is Shadow Ray'], mx.inputs[0])
    nt.links.new(g.outputs[0], mx.inputs[1])
    nt.links.new(t.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m


def mat_gaff_macro(name='GaffTapeMacro'):
    """Black cloth gaffer tape (same colour/roughness as vault_ff.mat_tape), with a cloth weave sized for macro.
    Uses the ribbon UVs (u along the strip, v across, both in metres)."""
    m = mat_principled(name, color=(0.011, 0.011, 0.012), rough=0.55, spec=0.45)
    nb = NB(m)
    p = principled(m)
    uv = nb.n('ShaderNodeUVMap')
    sep = nb.n('ShaderNodeSeparateXYZ')
    nb.l(uv, 'UV', sep, 0)
    # plain weave: product of two sine gratings ~0.35 mm pitch, slightly irregular
    wa = nb.n('ShaderNodeTexWave', {'wave_type': 'BANDS', 'bands_direction': 'X'}, Scale=900.0, Distortion=1.2, Detail=1.0)
    wb = nb.n('ShaderNodeTexWave', {'wave_type': 'BANDS', 'bands_direction': 'Y'}, Scale=900.0, Distortion=1.2, Detail=1.0)
    nb.l(uv, 'UV', wa, 'Vector')
    nb.l(uv, 'UV', wb, 'Vector')
    weave = nb.math('MULTIPLY', None, None)
    nb.l(wa, 'Fac', weave, 0)
    nb.l(wb, 'Fac', weave, 1)
    tc = nb.n('ShaderNodeTexCoord')
    nz = nb.n('ShaderNodeTexNoise', Scale=900.0, Detail=3.0)
    nb.l(tc, 'Object', nz, 'Vector')
    nz2 = nb.n('ShaderNodeTexNoise', Scale=60.0, Detail=3.0)
    nb.l(tc, 'Object', nz2, 'Vector')
    h = nb.math('ADD', weave, nb.math('MULTIPLY', nz, None, vb=0.5))
    rr = nb.ramp(nz2, 'Fac', [(0.35, (0.40,) * 3), (0.7, (0.62,) * 3)])     # glossier where pressed flat
    nb.l(rr, 'Color', p, 'Roughness')
    cr = nb.ramp(nz2, 'Fac', [(0.3, (0.009, 0.009, 0.010)), (0.75, (0.02, 0.02, 0.021))])   # dust / handling
    nb.l(cr, 'Color', p, 'Base Color')
    bmp = nb.n('ShaderNodeBump', Strength=0.35, Distance=0.000015)
    nb.l(h, 0, bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def mat_macro_steel(name, base=(0.5, 0.51, 0.53), rough=(0.14, 0.32), brush='X', scale=1.0, streak=0.6,
                    scratch=0.6, grime=0.12, aniso=0.45):
    """Machined, brushed steel at macro scale (same base colour/roughness as tumbler vault 'edge'): fine brushing
    streaks along `brush`, soft smudges in the roughness, sparse straight hairline scratches at two angles."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    p.inputs['Metallic'].default_value = 1.0
    tc = nb.n('ShaderNodeTexCoord')
    co = nb.n('ShaderNodeMapping', Scale=(scale, scale, scale))
    nb.l(tc, 'Object', co, 'Vector')
    st = {'X': (0.06, 0.06, 30.0), 'Z': (30.0, 0.06, 0.06), 'Y': (30.0, 0.06, 0.06)}[brush]
    bm_ = nb.n('ShaderNodeMapping', Scale=st)
    nb.l(co, 'Vector', bm_, 'Vector')
    brn = nb.n('ShaderNodeTexNoise', Scale=420.0, Detail=3.0, Roughness=0.6)
    nb.l(bm_, 'Vector', brn, 'Vector')
    smu = nb.n('ShaderNodeTexNoise', Scale=45.0, Detail=6.0, Roughness=0.6)
    nb.l(co, 'Vector', smu, 'Vector')
    col = nb.n('ShaderNodeTexNoise', Scale=260.0, Detail=4.0, Roughness=0.6)
    nb.l(co, 'Vector', col, 'Vector')
    acc = None
    for ang, sc_, seed in ((0.48, 34.0, 0.0), (-0.62, 27.0, 7.3), (1.31, 22.0, 3.1)):
        mp = nb.n('ShaderNodeMapping', Rotation=(0.0, ang, 0.0), Location=(seed, seed * 0.7, seed * 1.3))
        nb.l(co, 'Vector', mp, 'Vector')
        mp2 = nb.n('ShaderNodeMapping', Scale=(1.0, 1.0, 260.0))
        nb.l(mp, 'Vector', mp2, 'Vector')
        nz = nb.n('ShaderNodeTexNoise', Scale=sc_, Detail=1.0)
        nb.l(mp2, 'Vector', nz, 'Vector')
        ln = nb.ramp(nz, 'Fac', [(0.0, (0, 0, 0)), (0.705, (0, 0, 0)), (0.715, (1, 1, 1)), (0.725, (0, 0, 0))])
        acc = ln if acc is None else nb.mix(acc, (1, 1, 1), ln, mode='LIGHTEN')
    scr = nb.math('MULTIPLY', acc, None, vb=scratch)
    rr = nb.ramp(smu, 'Fac', [(0.3, (rough[0],) * 3), (0.72, (rough[1],) * 3)])
    rmix = nb.mix(rr, (rough[0] * 0.45,) * 3, scr)
    nb.L.new(nb.out_of(rmix), p.inputs['Roughness'])
    cr = nb.ramp(col, 'Fac', [(0.3, tuple(c * (1 - grime) for c in base)), (0.7, base)])
    cmix = nb.mix(cr, tuple(min(1.0, c * 1.18) for c in base), scr)
    nb.L.new(nb.out_of(cmix), p.inputs['Base Color'])
    h = nb.math('ADD', nb.math('MULTIPLY', brn, None, vb=streak), scr)
    bmp = nb.n('ShaderNodeBump', Strength=0.55, Distance=4e-6)
    nb.l(h, 0, bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    if aniso:
        set_aniso(m, aniso, (1, 0, 0) if brush == 'X' else (0, 0, 1))
    return m


def mat_turned(name, base, rough=(0.1, 0.2), grime=0.12):
    """Lathe-turned bar stock (parts built along local Z): fine circumferential turning marks, no crack scratches."""
    m = mat_metal(name, base=base, rough=rough, scale=6.0, bump=1.0, brushed=(0.05, 0.05, 40.0), grime=grime,
                  scratches=0.0)
    set_bump(m, 0.4, 4e-6)
    return m


def no_aniso(m):
    p = principled(m)
    p.inputs['Anisotropic'].default_value = 0.0
    for l in list(p.inputs['Tangent'].links):
        m.node_tree.links.remove(l)
    return m


def _a1_paint(name, color, rough, scale, **kw):
    """A1's worn-paint shader (door_ff.mat_worn_paint) at macro grain; plain mat_paint if door_ff is unavailable."""
    try:
        from door_ff import mat_worn_paint
        return mat_worn_paint(name, color, rough=rough, scale=scale, **kw)
    except Exception as e:
        print('[info] door_ff.mat_worn_paint unavailable, using mat_paint:', e, flush=True)
        m = mat_paint(name, color=color, rough=rough, scale=scale, wear=0.25, edge_metal=(0.42, 0.42, 0.43))
        set_bump(m, 0.3, 1.5e-5)
        return m


def macro_mats():
    """Colours/roughness follow A1's door set (door_ff.mats): panel, border, frame paint, MagFace paint, dark steel,
    chrome; grain resized for macro."""
    M = {}
    M['door'] = mat_macro_steel('MDoorPanel', base=(0.52, 0.525, 0.535), rough=(0.18, 0.33), brush='X')   # raised panel
    M['border'] = mat_macro_steel('MDoorBorder', base=(0.48, 0.485, 0.495), rough=(0.19, 0.34), brush='Z')  # plate border
    M['frame'] = _a1_paint('MFramePaint', (0.075, 0.08, 0.08), (0.34, 0.52), 12.0, edge=0.9, scuff=0.6, low=0.0,
                           steel=(0.40, 0.40, 0.41), sheen=0.15, bev_r=0.0015)
    M['magface'] = _a1_paint('MMagFace', (0.19, 0.19, 0.185), (0.45, 0.6), 30.0, edge=0.5, scuff=0.2, low=0.0,
                             bev_r=0.0015)
    M['dark'] = mat_metal('MDarkSteel', base=(0.10, 0.10, 0.105), rough=(0.3, 0.46), scale=30.0, bump=1.0, grime=0.3,
                          scratches=0.0)
    set_bump(M['dark'], 0.4, 3e-5)
    M['satin'] = mat_concentric('MSatinTurned', base=(0.5, 0.51, 0.53), rough=(0.18, 0.3), rings=14000.0, bump=0.5,
                                axis='Z')
    set_bump(M['satin'], 0.5, 2.5e-6)
    M['chrome'] = mat_turned('MChrome', base=(0.80, 0.80, 0.81), rough=(0.05, 0.12), grime=0.1)
    M['chrome_face'] = mat_concentric('MChromeFace', base=(0.78, 0.785, 0.79), rough=(0.06, 0.14), rings=16000.0,
                                      bump=0.5, axis='Z')
    set_bump(M['chrome_face'], 0.4, 2e-6)
    M['screw'] = mat_metal('MScrewDark', base=(0.10, 0.10, 0.105), rough=(0.28, 0.42), scale=400.0, bump=0.0,
                           grime=0.25, scratches=0.0)
    M['thread'] = mat_metal('MThread', base=(0.34, 0.34, 0.35), rough=(0.2, 0.34), scale=400.0, bump=0.0, grime=0.3,
                            scratches=0.0)
    M['galv'] = mat_metal('MGalv', base=(0.38, 0.385, 0.39), rough=(0.38, 0.55), scale=200.0, bump=0.0, grime=0.3,
                          scratches=0.0)
    M['cable'] = mat_principled('MCable', color=(0.03, 0.03, 0.032), rough=0.55)
    M['alu'] = mat_macro_steel('MAluminium', base=(0.80, 0.81, 0.82), rough=(0.26, 0.42), brush='X', scale=1.6,
                               streak=0.9, scratch=0.4, grime=0.06, aniso=0.55)
    M['tape'] = mat_gaff_macro()
    M['black'] = mat_principled('MBlack', color=(0.004, 0.004, 0.0045), rough=0.6)
    M['glass'] = mat_lens_glass()
    # drill bit: ground HSS lands and point, darker oxide flutes, satin shank
    M['land'] = mat_metal('MBitLand', base=(0.6, 0.6, 0.62), rough=(0.1, 0.2), scale=300.0, bump=0.0, grime=0.15,
                          scratches=0.0)
    M['flute'] = mat_metal('MBitFlute', base=(0.075, 0.07, 0.068), rough=(0.24, 0.38), scale=300.0, bump=0.0, grime=0.3,
                           scratches=0.0)
    M['point'] = mat_metal('MBitPoint', base=(0.66, 0.66, 0.68), rough=(0.08, 0.16), scale=300.0, bump=0.0, grime=0.1,
                           scratches=0.0)
    M['shank'] = mat_metal('MBitShank', base=(0.42, 0.42, 0.43), rough=(0.18, 0.3), scale=300.0, bump=0.0, grime=0.25,
                           scratches=0.0)
    # key (A1: chrome shank and T-bow, dark steel coupling collar)
    M['key'] = mat_turned('MKeyChrome', base=(0.78, 0.785, 0.79), rough=(0.06, 0.14))
    M['knurl'] = mat_metal('MKnurl', base=(0.10, 0.10, 0.105), rough=(0.22, 0.36), scale=200.0, bump=0.0, grime=0.3,
                           scratches=0.0)
    return M


# ----------------------------------------------------------------------------- geometry helpers

def rbox(name, x0, x1, y0, y1, z0, z1, bev=0.0, seg=2, mat=None, coll=None):
    return box(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), coll=coll, bev=bev,
               seg=seg, mat=mat)


def boolean_cut(o, cutter, op='DIFFERENCE'):
    b = o.modifiers.new('cut_' + cutter.name, 'BOOLEAN')
    b.operation = op
    b.object = cutter
    try:
        b.solver = 'EXACT'
    except Exception:
        pass
    cutter.hide_render = True
    cutter.display_type = 'WIRE'
    return b


def cyl_axis(name, p0, p1, r, seg=48, coll=None, mat=None, bev=0.0):
    """Cylinder from p0 to p1 (world)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    o = prim('cyl', name, (p0 + p1) / 2, d.to_track_quat('Z', 'Y').to_euler(), seg=seg, r=r, depth=d.length, coll=coll)
    if bev:
        bevel(o, bev, 2, angle=40)
    if mat:
        set_mat(o, mat)
    return o


def no_shadow(o):
    try:
        o.visible_shadow = False
    except Exception:
        pass
    return o


def motion_steps(o, n=3):
    for tgt in (o, getattr(o, 'cycles', None)):
        try:
            tgt.motion_steps = n
            return o
        except Exception:
            continue
    return o


def macro_motes(name, center, size, count=120, seed=1, start=1, end=250, drift=(0.0004, 0.0002, 0.0009),
                r=(0.000018, 0.00005)):
    c, s = Vector(center), Vector(size)
    lo, hi = c - s / 2, c + s / 2
    m = mat_principled(name + '_m', color=(0.82, 0.78, 0.7), rough=0.6, spec=0.3)
    principled(m).inputs['Transmission Weight'].default_value = 0.35
    return motes(name, count, tuple(lo), tuple(hi), r=r, seed=seed, mat=m, drift=drift, start=start, end=end)


# ----------------------------------------------------------------------------- door / frame fragments

# A1's door (door_ff): front plate border (brushed vertically) ends at the free edge; the frame (worn dark paint) starts
# 6 mm further and stands 2 mm proud; the raised machined panel starts 83 mm in from the edge and is 20 mm proud.
SEAM = 0.003          # half width of the door/frame seam
FRAME_PROUD = 0.002
PANEL_IN, PANEL_PROUD = 0.083, 0.020


def door_fragment(M, x0=-0.30, x1=-SEAM, z0=-0.2, z1=0.2, depth=0.1, bev=0.0016, mat=None, name='DoorPlate', coll=None,
                  panel=True):
    """A piece of the door's front plate (border) at the free edge: front face y = 0, body to +Y; optional raised panel."""
    o = rbox(name, x0, x1, 0.0, depth, z0, z1, bev=bev, seg=3, mat=mat or M['border'], coll=coll)
    out = [o]
    if panel and x0 < -PANEL_IN:
        out.append(rbox(name + 'Panel', x0, -PANEL_IN, -PANEL_PROUD, 0.001, z0, z1, bev=0.006, seg=1, mat=M['door'],
                        coll=coll))
    return out


def frame_fragment(M, x0=SEAM, x1=0.3, z0=-0.2, z1=0.2, depth=0.1, bev=0.0016, name='Frame', coll=None):
    return rbox(name, x0, x1, -FRAME_PROUD, depth, z0, z1, bev=bev, seg=3, mat=M['frame'], coll=coll)


# ----------------------------------------------------------------------------- S15: twist drill bit

def drill_bit(M, name='DrillBit', d=0.010, flute_len=0.085, shank_len=0.07, helix=30.0, n_ang=128, n_len=280,
              coll=None):
    """Two-flute twist drill along local +Z, point (118 deg) at z = flute_len, shank to -shank_len.
    Material slots: 0 ground land/margin, 1 flute, 2 point, 3 shank."""
    R = d / 2.0
    web = 0.17 * R
    rate = 2.0 * math.tan(math.radians(helix)) / d          # helix twist, rad per metre
    k = 1.0 / math.tan(math.radians(59.0))                   # cone: z = tip - k * rho
    z_tip = flute_len

    def prof(phi):
        ph = phi % math.pi
        marg, land = 0.055 * math.pi, 0.40 * math.pi
        if ph < marg:
            return R
        if ph < land:
            return R * 0.962
        t = (ph - land) / (math.pi - land)
        s = max(0.0, math.sin(math.pi * (t ** 0.8)))
        return R * 0.962 - (R * 0.962 - web) * (s ** 0.7)

    bm = bmesh.new()
    rings = []
    for j in range(n_len):
        z = z_tip * j / n_len
        tw = z * rate
        rmax = (z_tip - z) / k
        ring = []
        for i in range(n_ang):
            phi = 2 * math.pi * i / n_ang
            r = prof(phi)
            c = r > rmax
            if c:
                r = rmax
            a = phi + tw
            v = bm.verts.new((r * math.cos(a), r * math.sin(a), z))
            if c:
                v.tag = True
            ring.append(v)
        rings.append(ring)
    tip = bm.verts.new((0.0, 0.0, z_tip))
    tip.tag = True
    for j in range(len(rings) - 1):
        for i in range(n_ang):
            i2 = (i + 1) % n_ang
            bm.faces.new((rings[j][i], rings[j][i2], rings[j + 1][i2], rings[j + 1][i]))
    for i in range(n_ang):
        bm.faces.new((rings[-1][i], rings[-1][(i + 1) % n_ang], tip))
    bm.faces.new(list(reversed(rings[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for f in bm.faces:
        if any(v.tag for v in f.verts):
            f.material_index = 2
        else:
            rr = max(math.hypot(v.co.x, v.co.y) for v in f.verts)
            f.material_index = 0 if rr > 0.95 * R else 1
    o = from_bmesh(name, bm, coll, smooth=True, angle=38.0)
    for key_ in ('land', 'flute', 'point', 'shank'):
        o.data.materials.append(M[key_])
    sh = prim('cyl', name + '_shank', (0, 0, -shank_len / 2 + 0.0015), seg=96, r=R * 0.975, depth=shank_len + 0.003,
              coll=coll)
    bevel(sh, 0.0003, 2, angle=30)
    set_mat(sh, M['shank'])
    parent(sh, o, keep=False)
    return o


# ----------------------------------------------------------------------------- S16: dial with the reading lens

def _plano_convex(name, a, Rc, edge=0.0005, seg=96, rings=20, coll=None):
    """Plano-convex lens: flat face at z = 0, dome up (+Z). a = aperture radius, Rc = curvature radius."""
    h = Rc - math.sqrt(Rc * Rc - a * a)
    prof = []
    for i in range(rings + 1):          # dome from the axis out to the rim
        rho = a * i / rings
        z = edge + math.sqrt(Rc * Rc - rho * rho) - (Rc - h)
        prof.append((rho, z))
    prof += [(a, 0.0), (0.0, 0.0)]
    bm = bmesh.new()
    vs = [bm.verts.new((x, 0.0, z)) for x, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return from_bmesh(name, bm, coll, smooth=True, angle=60.0), edge + h


def _annulus_along(name, center, axis, r_in, r_out, length, seg=96, coll=None, mat=None, bev=0.0):
    o_ = [(r_out * math.cos(2 * math.pi * i / seg), r_out * math.sin(2 * math.pi * i / seg)) for i in range(seg)]
    i_ = [(r_in * math.cos(2 * math.pi * i / seg), r_in * math.sin(2 * math.pi * i / seg)) for i in range(seg)]
    o = extrude_profile(name, o_, length, holes=[i_], coll=coll, smooth=True)
    o.rotation_euler = Vector(axis).to_track_quat('Z', 'Y').to_euler()
    o.location = center
    if bev:
        bevel(o, bev, 2, angle=40)
    if mat:
        set_mat(o, mat)
    return o


def _numeral_band(dial, s, fill_m, band_m, coll=None, r_band=1.0065, z0=0.168, h=0.08, size=0.06):
    """Rim band on the turning wheel with all 100 numbers (read from above, through the lens). Dial-local units."""
    ob = [(r_band * math.cos(2 * math.pi * i / 256), r_band * math.sin(2 * math.pi * i / 256)) for i in range(256)]
    ib = [(0.993 * math.cos(2 * math.pi * i / 256), 0.993 * math.sin(2 * math.pi * i / 256)) for i in range(256)]
    band = extrude_profile('NumberBand', ob, h, holes=[ib], coll=coll, smooth=True)
    band.location = (0, 0, z0)
    bevel(band, 0.003, 2, angle=40)
    set_mat(band, band_m)
    parent(band, dial, keep=False)
    fnt = bpy.data.fonts.load(FONT_NUM, check_existing=True)
    bm = bmesh.new()
    zc = z0 + h / 2
    for v in range(100):
        cu = bpy.data.curves.new('bn_cu', 'FONT')
        cu.body = str(v)
        cu.font = fnt
        cu.size = size
        cu.extrude = 0.0012
        cu.align_x = 'CENTER'
        cu.align_y = 'CENTER'
        cu.resolution_u = 3
        tmp = bpy.data.objects.new('bn_tmp', cu)
        bpy.context.scene.collection.objects.link(tmp)
        dg = bpy.context.evaluated_depsgraph_get()
        me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
        bpy.data.objects.remove(tmp)
        bpy.data.curves.remove(cu)
        a = math.pi / 2 - 2 * math.pi * v / 100
        rh = Vector((math.cos(a), math.sin(a), 0.0))
        tg = Vector((math.sin(a), -math.cos(a), 0.0))
        up = Vector((0.0, 0.0, -1.0))                   # top of the numeral points back toward the door
        m4 = Matrix((tg, up, rh)).transposed().to_4x4()
        m4.translation = rh * (r_band + 0.0012) + Vector((0.0, 0.0, zc))
        me.transform(m4)
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    nums = from_bmesh('BandNumerals', bm, coll, smooth=False)
    set_mat(nums, fill_m)
    parent(nums, dial, keep=False)
    # index ticks between numbers (fine engraved lines)
    tb = bmesh.new()
    for v in range(100):
        a = math.pi / 2 - 2 * math.pi * (v + 0.5) / 100
        rh = Vector((math.cos(a), math.sin(a), 0.0))
        tg = Vector((math.sin(a), -math.cos(a), 0.0))
        w = 0.0025
        p0 = rh * (r_band + 0.0006)
        for zz in ((z0 + 0.012, z0 + 0.024), (z0 + h - 0.024, z0 + h - 0.012)):
            vs = [tb.verts.new(p0 + tg * sx * w + Vector((0, 0, zq))) for sx, zq in ((-1, zz[0]), (1, zz[0]), (1, zz[1]), (-1, zz[1]))]
            tb.faces.new(vs)
    ticks = from_bmesh('BandTicks', tb, coll, smooth=False)
    set_mat(ticks, fill_m)
    parent(ticks, dial, keep=False)
    return band


def dial_with_lens(M, s=0.062, tilt=40.0, coll=None):
    """The 0-99 wheel (tumbler lock.build_dial, black satin + cream numerals; A1's scale 0.062 m) on the door panel,
    centre at the origin, with a top-reading hood: the numbers sit on a rim band at the back of the wheel and can only
    be read through the small lens on top (axis tilted `tilt` deg from vertical toward the operator).
    Returns dict(dial=empty to rotate about local Z (T(v) = 2*pi*v/100 puts v under the lens), lens_c (centre of the
    lens's flat face), lens_top, axis, num (number under the lens), image (virtual image: focus here))."""
    root = empty('DialRoot', (0, 0, 0), coll=coll)
    root.rotation_euler = (math.radians(90), 0, 0)     # local +Z -> world -Y (toward the viewer), local +Y -> up
    root.scale = (s, s, s)
    fill = mat_fill('DialFill')
    parts = build_dial(root, coll=coll, mats={'fill': fill})
    for o in list(root.children_recursive):
        if o.name.startswith('Plate'):
            bpy.data.objects.remove(o)
    dial = parts['dial']
    band_m = mat_dial_black('BandBlack')
    _numeral_band(dial, s, fill, band_m, coll=coll)
    # hood + lens (world space, fixed to the door)
    tl = math.radians(tilt)
    u = Vector((0.0, -math.sin(tl), math.cos(tl)))
    P = Vector((0.0, -s * 0.208, s * 1.0077))           # centre of the number at 12 o'clock
    a, Rc, d_obj = 0.008, 0.011, 0.0128                 # plano-convex magnifier: f ~ 22 mm, ~2.4x
    C0 = P + u * d_obj
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    hx, y0, y1, z0, z1 = 0.016, -0.034, 0.0, 0.050, 0.094
    for v in bm.verts:
        v.co.x = v.co.x * 2 * hx
        v.co.y = y0 + (v.co.y + 0.5) * (y1 - y0)
        v.co.z = z0 + (v.co.z + 0.5) * (z1 - z0)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=C0, plane_no=u, clear_outer=True)
    bmesh.ops.holes_fill(bm, edges=bm.edges[:], sides=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    hood = from_bmesh('LensHood', bm, coll, smooth=False)
    bevel(hood, 0.0016, 3, angle=40)
    set_mat(hood, M['border'])
    clr = prim('cyl', 'HoodClear', (0, -s * 0.174 + 0.0007, 0), (math.radians(90), 0, 0), seg=192, r=s * 1.024,
               depth=s * 0.348 + 0.0014, coll=coll)
    boolean_cut(hood, clr)
    bore = cyl_axis('HoodBore', C0 + u * 0.002, P - u * 0.006, a - 0.0002, seg=64, coll=coll)
    boolean_cut(hood, bore)
    lens, lens_h = _plano_convex('ReadingLens', a, Rc, coll=coll)
    lens.location = C0
    lens.rotation_euler = u.to_track_quat('Z', 'Y').to_euler()
    set_mat(lens, M['glass'])
    _annulus_along('LensBezel', C0 - u * 0.0005, u, a - 0.00005, a + 0.0026, 0.0034, coll=coll, mat=M['chrome'],
                   bev=0.0005)
    # index notch on the bezel (cream wedge on the far side, pointing at the number)
    w = Vector((0.0, math.cos(tl), math.sin(tl)))      # in-plane direction toward the door
    nb_ = bmesh.new()
    tipv = C0 + u * 0.00292 + w * (a + 0.0003)
    vs = [nb_.verts.new(tipv), nb_.verts.new(tipv + w * 0.0017 + Vector((0.0009, 0, 0))),
          nb_.verts.new(tipv + w * 0.0017 - Vector((0.0009, 0, 0)))]
    nb_.faces.new(vs)
    notch = from_bmesh('LensIndex', nb_, coll, smooth=False)
    set_mat(notch, fill)
    # hood side screws (small socket heads)
    for sx in (-1, 1):
        for yy, zz in ((-0.008, 0.083), (-0.008, 0.060)):
            sc_ = prim('cyl', 'HoodScrew', (sx * (hx + 0.0002), yy, zz), (0, math.radians(90), 0), seg=32, r=0.0019,
                       depth=0.0009, coll=coll)
            bevel(sc_, 0.00025, 2)
            set_mat(sc_, M['chrome'])
            hx_ = prim('cyl', 'HoodScrewHex', (sx * (hx + 0.00067), yy, zz), (0, math.radians(90), 0), seg=6, r=0.0008,
                       depth=0.0002, coll=coll)
            set_mat(hx_, M['black'])
    return {'root': root, 'dial': dial, 'lens_c': C0, 'lens_top': C0 + u * lens_h, 'axis': u, 'num': P,
            'image': C0 - u * 0.03, 'hood': hood}


def door_plate(M, x0=-0.2, x1=0.2, z0=-0.18, z1=0.2, depth=0.06, mat=None, name='DoorFace', coll=None):
    return rbox(name, x0, x1, 0.0, depth, z0, z1, bev=0.0, mat=mat or M['door'], coll=coll)


# ----------------------------------------------------------------------------- S17: long two-part key + lock boss
# Matches A1 (door_ff.build_door): chrome boss r 36 mm + steel ring r 24 mm, round keyway r 8.5 mm with a slot below;
# key: chrome shank r 6.8 mm, dark coupling collar (the joint of the two parts) + chrome collar, T-bar bow with balls.
# Origin = keyhole centre on the panel face (y = 0); the boss front is at y = -0.020.

def lock_boss(M, door, coll=None):
    cut = cyl_axis('KeywayCut', (0, 0.06, 0), (0, -0.04, 0), 0.0085, seg=96, coll=coll)
    slot = rbox('KeySlotCut', -0.0029, 0.0029, -0.04, 0.06, -0.028, 0.0, coll=coll)
    boss = cyl_axis('KeyBoss', (0, 0.001, 0), (0, -0.014, 0), 0.036, seg=192, coll=coll, mat=M['chrome_face'], bev=0.0035)
    ring = cyl_axis('KeyBoss2', (0, -0.012, 0), (0, -0.020, 0), 0.024, seg=192, coll=coll, mat=M['border'], bev=0.0025)
    for o in (boss, ring, door):
        boolean_cut(o, cut)
        o.modifiers.new('cut2', 'BOOLEAN').object = slot
    try:
        for o in (boss, ring, door):
            o.modifiers['cut2'].solver = 'EXACT'
    except Exception:
        pass
    slot.hide_render = True
    # dark inner sleeve (the keyway goes deep into the door) + slot liner
    _annulus_along('KeywaySleeve', (0, 0.10, 0), (0, -1, 0), 0.0085, 0.0105, 0.118, coll=coll, mat=M['dark'])
    rbox('SlotLinerL', -0.0035, -0.0029, -0.018, 0.10, -0.028, -0.006, mat=M['dark'], coll=coll)
    rbox('SlotLinerR', 0.0029, 0.0035, -0.018, 0.10, -0.028, -0.006, mat=M['dark'], coll=coll)
    rbox('SlotFloor', -0.0035, 0.0035, -0.018, 0.10, -0.0286, -0.028, mat=M['dark'], coll=coll)
    cyl_axis('KeywayEnd', (0, 0.10, 0), (0, 0.102, 0), 0.0106, seg=48, coll=coll, mat=M['black'])
    return boss


def long_key(M, coll=None):
    """Returns the turn empty (rotate .rotation_euler.y). Key axis = Y; boss front at y = -0.020."""
    kt = empty('KeyTurn', (0, 0, 0), coll=coll)
    y0 = -0.020
    parts = []
    parts.append(cyl_axis('KShank', (0, y0 + 0.28, 0), (0, y0 - 0.106, 0), 0.0068, seg=64, coll=coll, mat=M['key'],
                          bev=0.0004))
    bit = rbox('KBit', -0.0022, 0.0022, y0 + 0.20, y0 + 0.27, -0.026, -0.004, bev=0.0003, mat=M['key'], coll=coll)
    for i, (yy, dd) in enumerate(((0.205, 0.006), (0.215, 0.012), (0.225, 0.004), (0.235, 0.010), (0.245, 0.007),
                                  (0.258, 0.013))):
        boolean_cut(bit, rbox(f'KBitCut{i}', -0.003, 0.003, y0 + yy - 0.0025, y0 + yy + 0.0025, -0.027, -0.027 + dd,
                              coll=coll))
    parts.append(bit)
    # coupling: dark knurled collar (part one) screwed onto a chrome collar (part two) -> hairline joint
    kout = gear_outline(84, 0.0101, 0.0105, pts_per_tooth=4, tooth_frac=0.45)
    col = extrude_profile('KCollar', kout, 0.022, coll=coll, smooth=False)
    col.rotation_euler = (math.radians(90), 0, 0)
    col.location = (0, y0 - 0.106, 0)
    bevel(col, 0.0008, 2, angle=40)
    set_mat(col, M['knurl'])
    parts.append(col)
    parts.append(cyl_axis('KJoint', (0, y0 - 0.1278, 0), (0, y0 - 0.1284, 0), 0.0079, seg=64, coll=coll, mat=M['black']))
    parts.append(cyl_axis('KCollar2', (0, y0 - 0.1284, 0), (0, y0 - 0.140, 0), 0.0085, seg=64, coll=coll, mat=M['key'],
                          bev=0.0012))
    bar = cyl_axis('KBow', (-0.055, y0 - 0.152, 0), (0.055, y0 - 0.152, 0), 0.0085, seg=64, coll=coll, mat=M['key'],
                   bev=0.0025)
    parts.append(bar)
    parts.append(cyl_axis('KBowNeck', (0, y0 - 0.139, 0), (0, y0 - 0.150, 0), 0.0072, seg=64, coll=coll, mat=M['key']))
    for sx in (-1, 1):
        b = prim('sphere', 'KBowEnd', (sx * 0.056, y0 - 0.152, 0), seg=48, ring=24, r=0.0115, coll=coll)
        set_mat(b, M['key'])
        parts.append(b)
    for o in parts:
        parent(o, kt, keep=True)
    return kt


# ----------------------------------------------------------------------------- S18/S22/S24: magnetic contact plates
# Matches A1 (door_ff): MagDoor x 0.512..0.574 on the door plate, MagFrame x 0.594..0.656 on the frame (2 mm proud),
# z 1.50..1.70, 13 mm thick, grey worn paint, four cap screws r 4.8 mm at the corners; armoured cable up from the
# frame half. Here: seam centre x = 0, plates centred on z = 0.
PL = dict(gap=0.010, w=0.062, h=0.200, t=0.013, sdx=(0.010, 0.052), sdz=0.088)


def screw_proto(M, coll=None, r=0.0048, hh=0.0032, shank=0.023):
    """Cap screw along local +Z: head (r, height hh) from z = 0 to hh with a hex socket; M5 thread down to -shank."""
    head = prim('cyl', 'ScrewHead', (0, 0, hh / 2), seg=48, r=r, depth=hh, coll=coll)
    bevel(head, 0.0006, 3, angle=40)
    apply_mods(head)
    hexc = prim('cyl', 'ScrewHexCut', (0, 0, hh), seg=6, r=r * 0.42, depth=hh * 1.2, coll=coll)
    boolean_cut(head, hexc)
    apply_mods(head)
    bpy.data.objects.remove(hexc)
    set_mat(head, M['screw'])
    parts = [head]
    core = prim('cyl', 'ScrewCore', (0, 0, -shank / 2), seg=32, r=0.0021, depth=shank, coll=coll)
    set_mat(core, M['thread'])
    parts.append(core)
    pitch = 0.0008
    for i in range(int(shank / pitch)):
        t = prim('torus', 'ScrewThread', (0, 0, -pitch * (i + 0.5)), R=0.0021, r=0.00042, seg=32, seg2=8, coll=coll)
        set_mat(t, M['thread'])
        parts.append(t)
    proto = join(parts, 'ScrewProto')
    proto.location = (0, 0, -5)
    proto.hide_render = True
    return proto


def mag_plate(M, side, proto, name, loosen=(0.0, 0.0, 0.0, 0.0), coll=None, cable=False):
    """side -1: door half (on the door plate, face y = 0), +1: frame half (frame face y = -FRAME_PROUD).
    loosen: how far each screw head stands off the block (top-inner, top-outer, bottom-inner, bottom-outer), metres.
    Returns dict(root, block, screws)."""
    root = empty(name, (0, 0, 0), coll=coll)
    g, w, h, t = PL['gap'], PL['w'], PL['h'], PL['t']
    yb = 0.0 if side < 0 else -FRAME_PROUD
    xa, xb = sorted((side * g, side * (g + w)))
    blk = rbox(name + '_block', xa, xb, yb - t, yb + 0.0003, -h / 2, h / 2, bev=0.0025, seg=3, mat=M['magface'],
               coll=coll)
    parts, screws = [blk], []
    rng = random.Random(11 + side)
    k = 0
    for zz in (PL['sdz'], -PL['sdz']):
        for dx in PL['sdx']:
            sc_ = linked_copy(proto, f'{name}_screw{k}', coll=coll)
            sc_.hide_render = False
            sc_.rotation_euler = (math.radians(90), 0, 0)
            sc_.rotation_euler.rotate_axis('Z', rng.uniform(0, 1.0))
            sc_.location = (side * (g + dx), yb - t - loosen[k], zz)
            screws.append(sc_)
            parts.append(sc_)
            k += 1
    if cable:      # armoured cable from the top of the frame half up to the junction box
        x = side * (g + 0.046)
        y = yb - 0.008
        gl = cyl_axis(name + '_gland', (x, y, h / 2 - 0.001), (x, y, h / 2 + 0.008), 0.0068, seg=6, coll=coll,
                      mat=M['galv'], bev=0.0006)
        parts.append(gl)
        c = cyl_axis(name + '_cable', (x, y, h / 2 + 0.006), (x, y, h / 2 + 0.42), 0.0040, seg=24, coll=coll,
                     mat=M['galv'])
        parts.append(c)
        for i in range(160):
            rr = prim('torus', 'CableRib', (x, y, h / 2 + 0.009 + i * 0.0026), R=0.0040, r=0.0008, seg=24, seg2=6,
                      coll=coll)
            set_mat(rr, M['galv'])
            parts.append(rr)
    for o in parts:
        parent(o, root, keep=True)
    return {'root': root, 'block': blk, 'screws': screws}


def _polyline_dense(pts, step=0.0004):
    out = []
    for (a, b) in zip(pts[:-1], pts[1:]):
        a, b = Vector(a), Vector(b)
        n = max(1, int((b - a).length / step))
        for i in range(n):
            out.append(a.lerp(b, i / n))
    out.append(Vector(pts[-1]))
    return out


def tape_strip(M, pts2d, z0, z1, name='Tape', coll=None, seed=3, lift=0.00006, ws=14, thick=0.00022, tear=(True, True)):
    """Ribbon of tape following a polyline in the XY plane (surface points, path running so that the outward side
    is to the right of the direction of travel), spanning z0..z1. UVs in metres (u along, v across)."""
    rng = random.Random(seed)
    P = _polyline_dense(pts2d)
    n = len(P)
    nrm = []
    for i in range(n):
        a = P[max(0, i - 1)]
        b = P[min(n - 1, i + 1)]
        t = (b - a).normalized()
        nrm.append(Vector((t.y, -t.x)))
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    grid = []
    u = 0.0
    us = []
    for i in range(n):
        if i:
            u += (P[i] - P[i - 1]).length
        us.append(u)
    L = us[-1]
    for i in range(n):
        row = []
        for j in range(ws + 1):
            v = j / ws
            z = z0 + (z1 - z0) * v
            # wrinkle lift: low-frequency bubbles + slightly lifted edges
            wr = lift + 0.00004 * max(0.0, math.sin(us[i] * 900 + j * 0.7 + seed)) * (abs(v - 0.5) * 2) ** 2
            p = P[i] + nrm[i] * wr
            x = p.x
            if (i == 0 and tear[0]) or (i == n - 1 and tear[1]):
                x += (rng.uniform(-0.0006, 0.0006)) * (1 if i == 0 else -1) * (0.3 + 0.7 * ((j % 2) == 0))
            row.append(bm.verts.new((x, p.y, z)))
        grid.append(row)
    for i in range(n - 1):
        for j in range(ws):
            f = bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
            for lp, (ii, jj) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                lp[uvl].uv = (us[ii], (z1 - z0) * jj / ws)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = from_bmesh(name, bm, coll, smooth=True, angle=50.0)
    sol = o.modifiers.new('Thick', 'SOLIDIFY')
    sol.thickness = thick
    sol.offset = 1.0
    set_mat(o, M['tape'])
    return o


def alu_plate(M, proto=None, coll=None, name='AluPlate'):
    """Custom aluminium plate over both magnetic plates: 2 mm sheet with a 2 mm shim under its door half (the door
    block sits 2 mm deeper than the frame block), four countersunk screws. Root at the world origin when in place."""
    root = empty(name, (0, 0, 0), coll=coll)
    t, hw, hh = 0.002, 0.079, 0.056
    yf = -FRAME_PROUD - PL['t']                     # frame block front
    parts = [rbox(name + '_sheet', -hw, hw, yf - t, yf, -hh, hh, bev=0.0005, seg=2, mat=M['alu'], coll=coll),
             rbox(name + '_shim', -PL['gap'] - PL['w'] + 0.003, -PL['gap'] - 0.0005, yf, -PL['t'], -hh + 0.004,
                  hh - 0.004, bev=0.0003, mat=M['alu'], coll=coll)]
    for sx in (-1, 1):
        for sz in (-1, 1):
            p = Vector((sx * (PL['gap'] + PL['w'] / 2), yf - t - 0.00005, sz * 0.036))
            hd = cyl_axis(name + '_csk', p + Vector((0, 0.0004, 0)), p - Vector((0, 0.0001, 0)), 0.0033, seg=32,
                          coll=coll, mat=M['screw'])
            hx_ = cyl_axis(name + '_hex', p - Vector((0, 0.00005, 0)), p - Vector((0, 0.00015, 0)), 0.0013, seg=6,
                           coll=coll, mat=M['black'])
            parts += [hd, hx_]
    for o in parts:
        parent(o, root, keep=True)
    return root


def seam_set(M, coll=None, h=0.5, hinge=False):
    """Door plate fragment (x < -SEAM) and frame fragment (x > SEAM) as on A1's door; dark void behind the seam.
    Returns dict(door=[objects], hinge=empty or None, frame=obj)."""
    hv = None
    door = door_fragment(M, x0=-0.30, z0=-h / 2, z1=h / 2, coll=coll)
    if hinge:
        hv = empty('DoorHinge', (-1.0, 0.1, 0.0), coll=coll)
        for o in door:
            parent(o, hv, keep=True)
    frame = frame_fragment(M, z0=-h / 2, z1=h / 2, coll=coll)
    return {'door': door, 'hinge': hv, 'frame': frame}


def write_anchors(path, cam, points, f0, f1, note=''):
    """Normalised screen positions (x right, y down, 0..1) of world points per frame, for the lead's post lines."""
    import json
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    out = {'note': note, 'res': [sc.render.resolution_x, sc.render.resolution_y], 'frames': {}}
    for f in range(f0, f1 + 1):
        sc.frame_set(f)
        row = {}
        for k, p in points.items():
            pw = p() if callable(p) else Vector(p)
            c = world_to_camera_view(sc, cam, pw)
            row[k] = [round(c.x, 5), round(1.0 - c.y, 5)]
        out['frames'][str(f)] = row
    with open(path, 'w') as fh:
        json.dump(out, fh, indent=0)
    print('[anchors]', path, flush=True)
