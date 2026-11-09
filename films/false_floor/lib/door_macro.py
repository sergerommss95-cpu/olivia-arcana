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
    bmp = nb.n('ShaderNodeBump', Strength=0.6, Distance=0.00002)
    nb.l(h, 0, bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def fine_scratches(m, scale=14.0, distortion=5.0, weight=None):
    """mat_metal's wave scratches are sized for metre-scale doors; at macro they read as cracks. Tighten them."""
    for n in m.node_tree.nodes:
        if n.bl_idname == 'ShaderNodeTexWave':
            n.inputs['Scale'].default_value = scale
            n.inputs['Distortion'].default_value = distortion
    if weight is not None:
        for n in m.node_tree.nodes:
            if n.bl_idname == 'ShaderNodeMath' and n.operation == 'MULTIPLY' and abs(n.inputs[1].default_value - 0.4) < 1e-6:
                n.inputs[1].default_value = weight
    return m


def macro_mats():
    M = {}
    # door steel: tumbler vault 'edge' (brushed machined steel) base + roughness, horizontal brushing at macro grain
    M['door'] = mat_metal('MDoorSteel', base=(0.5, 0.51, 0.53), rough=(0.14, 0.32), scale=8.0, bump=1.0,
                          brushed=(0.08, 0.08, 25.0), grime=0.14, scratches=0.25)
    set_bump(M['door'], 0.6, 5e-6)
    fine_scratches(M['door'], 16.0, 4.0)
    set_aniso(M['door'], 0.45, (1, 0, 0))
    # vertical-brushed variant (door edge faces / key boss plate)
    M['door_v'] = mat_metal('MDoorSteelV', base=(0.48, 0.49, 0.51), rough=(0.16, 0.34), scale=8.0, bump=1.0,
                            brushed=(25.0, 0.08, 0.08), grime=0.16, scratches=0.25)
    set_bump(M['door_v'], 0.6, 5e-6)
    fine_scratches(M['door_v'], 16.0, 4.0)
    # frame: dark painted steel with worn edges (A1: dark painted frame)
    M['frame'] = mat_paint('MFramePaint', color=(0.024, 0.026, 0.028), rough=(0.32, 0.52), scale=25.0, wear=0.3,
                           edge_metal=(0.42, 0.42, 0.44))
    set_bump(M['frame'], 0.5, 1.2e-4)
    M['dark'] = mat_metal('MDarkSteel', base=(0.08, 0.085, 0.09), rough=(0.28, 0.5), scale=30.0, bump=1.0, grime=0.3)
    set_bump(M['dark'], 0.4, 3e-5)
    # lathe-turned parts (local Z = turning axis): tumbler vault 'satin'
    M['satin'] = mat_concentric('MSatinTurned', base=(0.5, 0.51, 0.53), rough=(0.18, 0.3), rings=14000.0, bump=0.5,
                                axis='Z')
    set_bump(M['satin'], 0.5, 2.5e-6)
    M['chrome'] = mat_metal('MChrome', base=(0.78, 0.79, 0.8), rough=(0.05, 0.14), scale=60.0, bump=0.0, grime=0.15,
                            scratches=0.15)
    # magnetic contact blocks: fly-cut machined steel (arcs from a far-off cutter centre), a touch darker than the door
    M['block'] = mat_concentric('MBlockFlycut', base=(0.36, 0.37, 0.38), rough=(0.18, 0.32), rings=26000.0, bump=0.5,
                                center=(0.11, 0.0, 0.16), axis='Y')
    set_bump(M['block'], 0.5, 1.6e-6)
    M['magnet'] = mat_metal('MMagnetFace', base=(0.16, 0.16, 0.165), rough=(0.32, 0.45), scale=200.0, bump=0.0,
                            grime=0.2)
    M['screw'] = mat_metal('MScrewOxide', base=(0.045, 0.045, 0.05), rough=(0.26, 0.42), scale=400.0, bump=0.0,
                           grime=0.2)
    M['thread'] = mat_metal('MThread', base=(0.32, 0.32, 0.33), rough=(0.2, 0.34), scale=400.0, bump=0.0, grime=0.3)
    # aluminium: lighter, more diffuse, brushed along X
    M['alu'] = mat_metal('MAluminium', base=(0.80, 0.81, 0.82), rough=(0.26, 0.4), scale=8.0, bump=1.0,
                         brushed=(0.08, 0.08, 25.0), grime=0.15, scratches=0.25)
    set_bump(M['alu'], 0.5, 4e-6)
    set_aniso(M['alu'], 0.55, (1, 0, 0))
    M['tape'] = mat_gaff_macro()
    M['black'] = mat_principled('MBlack', color=(0.004, 0.004, 0.0045), rough=0.6)
    M['glass'] = mat_lens_glass()
    # drill bit: ground HSS lands and point, darker oxide flutes, satin shank
    M['land'] = mat_metal('MBitLand', base=(0.6, 0.6, 0.62), rough=(0.1, 0.2), scale=300.0, bump=0.0, grime=0.15,
                          scratches=0.1)
    M['flute'] = mat_metal('MBitFlute', base=(0.075, 0.07, 0.068), rough=(0.24, 0.38), scale=300.0, bump=0.0, grime=0.3)
    M['point'] = mat_metal('MBitPoint', base=(0.66, 0.66, 0.68), rough=(0.08, 0.16), scale=300.0, bump=0.0, grime=0.1)
    M['shank'] = mat_metal('MBitShank', base=(0.42, 0.42, 0.43), rough=(0.18, 0.3), scale=300.0, bump=0.0, grime=0.25)
    # key: part two (shaft + bit) bright nickel steel, part one (bow) blued steel, knurled coupling
    M['nickel'] = mat_metal('MKeyNickel', base=(0.6, 0.59, 0.56), rough=(0.12, 0.24), scale=60.0, bump=0.0, grime=0.25,
                            scratches=0.3)
    M['blued'] = mat_metal('MKeyBlued', base=(0.10, 0.108, 0.12), rough=(0.16, 0.3), scale=60.0, bump=0.0, grime=0.2,
                           scratches=0.3)
    M['knurl'] = mat_metal('MKnurl', base=(0.55, 0.55, 0.57), rough=(0.14, 0.28), scale=200.0, bump=0.0, grime=0.35)
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

def door_fragment(M, x0=-0.30, x1=0.0, z0=-0.2, z1=0.2, depth=0.2, bev=0.0016, mat=None, name='DoorSlab', coll=None):
    """A piece of the 3-ton door: front face y = 0, body to +Y."""
    return rbox(name, x0, x1, 0.0, depth, z0, z1, bev=bev, seg=3, mat=mat or M['door'], coll=coll)


def frame_fragment(M, x0=0.004, x1=0.3, z0=-0.2, z1=0.2, depth=0.2, bev=0.0016, name='FrameJamb', coll=None):
    return rbox(name, x0, x1, 0.0, depth, z0, z1, bev=bev, seg=3, mat=M['frame'], coll=coll)


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


def dial_with_lens(M, s=0.05, tilt=35.0, coll=None):
    """The 0-99 wheel (tumbler lock.build_dial, black satin + cream numerals) on the door face, centre at the origin,
    with a top-reading hood: the numbers sit on a rim band and can only be read through a small lens on top.
    Returns dict(dial=empty to rotate about local Z (T(v) = 2*pi*v/100 puts v under the lens), lens_top, lens_axis,
    image=point of the magnified number (focus here), cavity light position)."""
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
    d_obj = 0.0105                                      # number -> lens flat face (magnifier, ~2.2x)
    C0 = P + u * d_obj
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    hx, y0, y1, z0, z1 = 0.0118, -0.0238, 0.0, 0.0395, 0.071
    for v in bm.verts:
        v.co.x = v.co.x * 2 * hx
        v.co.y = y0 + (v.co.y + 0.5) * (y1 - y0)
        v.co.z = z0 + (v.co.z + 0.5) * (z1 - z0)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=C0, plane_no=u, clear_outer=True)
    bmesh.ops.holes_fill(bm, edges=bm.edges[:], sides=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    hood = from_bmesh('LensHood', bm, coll, smooth=False)
    bevel(hood, 0.0006, 3, angle=40)
    set_mat(hood, M['dark'])
    clr = prim('cyl', 'HoodClear', (0, -0.0081, 0), (math.radians(90), 0, 0), seg=192, r=s * 1.024, depth=0.0186,
               coll=coll)
    boolean_cut(hood, clr)
    bore = cyl_axis('HoodBore', C0 + u * 0.002, P - u * 0.004, 0.0049, seg=64, coll=coll)
    boolean_cut(hood, bore)
    a, Rc = 0.0052, 0.0095
    lens, lens_h = _plano_convex('ReadingLens', a, Rc, coll=coll)
    lens.location = C0
    lens.rotation_euler = u.to_track_quat('Z', 'Y').to_euler()
    set_mat(lens, M['glass'])
    ring = _annulus_along('LensBezel', C0 - u * 0.0004, u, a - 0.00005, a + 0.0017, 0.0024, coll=coll,
                          mat=M['chrome'], bev=0.00035)
    # index notch on the bezel (cream wedge on the far side, pointing at the number)
    w = Vector((0.0, math.cos(tl), math.sin(tl)))      # in-plane direction toward the door
    nb_ = bmesh.new()
    tipv = C0 + u * 0.00205 + w * (a + 0.0002)
    vs = [nb_.verts.new(tipv), nb_.verts.new(tipv + w * 0.0012 + Vector((0.0007, 0, 0))),
          nb_.verts.new(tipv + w * 0.0012 - Vector((0.0007, 0, 0)))]
    nb_.faces.new(vs)
    notch = from_bmesh('LensIndex', nb_, coll, smooth=False)
    set_mat(notch, fill)
    # hood side screws (small socket heads)
    for sx in (-1, 1):
        sc_ = prim('cyl', 'HoodScrew', (sx * (hx + 0.0002), -0.006, 0.062), (0, math.radians(90), 0), seg=32,
                   r=0.0016, depth=0.0008, coll=coll)
        bevel(sc_, 0.0002, 2)
        set_mat(sc_, M['chrome'])
        hx_ = prim('cyl', 'HoodScrewHex', (sx * (hx + 0.00062), -0.006, 0.062), (0, math.radians(90), 0), seg=6,
                   r=0.0007, depth=0.0002, coll=coll)
        set_mat(hx_, M['black'])
    return {'root': root, 'dial': dial, 'lens_c': C0, 'lens_top': C0 + u * lens_h, 'axis': u, 'num': P,
            'image': C0 - u * 0.023, 'hood': hood}


def door_plate(M, x0=-0.2, x1=0.2, z0=-0.18, z1=0.2, depth=0.06, mat=None, name='DoorFace', coll=None):
    return rbox(name, x0, x1, 0.0, depth, z0, z1, bev=0.0, mat=mat or M['door'], coll=coll)


# ----------------------------------------------------------------------------- S17: long two-part key + lock boss

def _superellipse(a, b, n=96, p=4.0, cx=0.0, cy=0.0):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        c, s_ = math.cos(t), math.sin(t)
        pts.append((cx + a * math.copysign(abs(c) ** (2 / p), c), cy + b * math.copysign(abs(s_) ** (2 / p), s_)))
    return pts


def long_key(M, coll=None, depth_in=0.05):
    """Long two-part key along -Y out of the lock face at the origin (~29 cm outside + `depth_in` inside).
    Part two: nickel shaft + stepped 3D bit (inside the lock); part one: blued bow + stem; knurled coupling between.
    Returns the pivot empty (rotate .rotation_euler.y to turn)."""
    pv = empty('KeyPivot', (0, 0, 0), coll=coll)
    parts = []
    shaft = cyl_axis('KeyShaft', (0, depth_in, 0), (0, -0.205, 0), 0.0045, seg=64, coll=coll, mat=M['nickel'],
                     bev=0.0003)
    parts.append(shaft)
    # flats along the shaft (a long milled flat reads the rotation)
    flat = rbox('KeyFlat', -0.0046, 0.0046, -0.200, -0.03, 0.0041, 0.0047, mat=M['nickel'], coll=coll)
    boolean_cut(shaft, flat)
    # coupling: two knurled collars with a hairline seam (the key comes apart here)
    for nm, ya, yb in (('CollarB', -0.2052, -0.2172), ('CollarA', -0.2177, -0.2295)):
        kout = gear_outline(72, 0.0068, 0.0071, pts_per_tooth=4, tooth_frac=0.45)
        c = extrude_profile(nm, kout, abs(yb - ya), coll=coll, smooth=False)
        c.rotation_euler = (math.radians(90), 0, 0)
        c.location = (0, ya, 0)
        bevel(c, 0.0005, 2, angle=40)
        set_mat(c, M['knurl'])
        parts.append(c)
    seam = cyl_axis('CollarSeam', (0, -0.2171, 0), (0, -0.2178, 0), 0.0062, seg=64, coll=coll, mat=M['black'])
    parts.append(seam)
    stem = cyl_axis('KeyStem', (0, -0.229, 0), (0, -0.247, 0), 0.0045, seg=64, coll=coll, mat=M['blued'], bev=0.0003)
    neck = prim('cyl', 'KeyNeck', (0, -0.2505, 0), (math.radians(90), 0, 0), seg=64, r=0.0045, r2=0.0075, depth=0.007,
                coll=coll)
    set_mat(neck, M['blued'])
    parts += [stem, neck]
    # bow: flat superellipse plate with an oval opening, in the vertical (Y-Z) plane, 6 mm thick
    outer = _superellipse(0.021, 0.026, n=128, p=3.2)
    inner = _superellipse(0.0125, 0.0165, n=128, p=2.6, cx=-0.002)
    bow = extrude_profile('KeyBow', outer, 0.006, holes=[inner], coll=coll, smooth=True)
    # local X -> -Y (outward along the key), local Y -> +Z, local Z -> -X (thickness)
    rot = Matrix(((0.0, 0.0, -1.0), (-1.0, 0.0, 0.0), (0.0, 1.0, 0.0)))
    bow.matrix_world = Matrix.Translation((0.003, -0.2745, 0.0)) @ rot.to_4x4()
    bevel(bow, 0.0009, 3, angle=40)
    set_mat(bow, M['blued'])
    parts.append(bow)
    # bit (inside the lock): stepped blade with cuts on three faces
    bit = rbox('KeyBit', -0.0018, 0.0018, 0.012, 0.038, -0.0165, -0.003, bev=0.0002, mat=M['nickel'], coll=coll)
    parts.append(bit)
    for i, (y, depth) in enumerate(((0.015, 0.004), (0.019, 0.009), (0.023, 0.002), (0.027, 0.007), (0.031, 0.005),
                                    (0.035, 0.008))):
        ct = rbox(f'BitCut{i}', -0.003, 0.003, y - 0.0012, y + 0.0012, -0.0166, -0.0166 + depth, coll=coll)
        boolean_cut(bit, ct)
    for o in parts:
        parent(o, pv, keep=True)
    return pv


def lock_boss(M, door, coll=None):
    """Large turned lock boss on the door face at the origin with a deep keyhole bore (key axis = Y)."""
    hole = cyl_axis('KeyholeCut', (0, 0.08, 0), (0, -0.05, 0), 0.0074, seg=96, coll=coll)
    base = cyl_axis('BossBase', (0, 0.002, 0), (0, -0.013, 0), 0.040, seg=192, coll=coll, mat=M['satin'], bev=0.0012)
    top = cyl_axis('BossRing', (0, -0.012, 0), (0, -0.024, 0), 0.0235, seg=192, coll=coll, mat=M['satin'], bev=0.001)
    lip = cyl_axis('BossLip', (0, -0.0235, 0), (0, -0.0262, 0), 0.0118, seg=128, coll=coll, mat=M['chrome'],
                   bev=0.0007)
    for o in (base, top, lip, door):
        boolean_cut(o, hole)
    sleeve = _annulus_along('KeyholeSleeve', (0, 0.07, 0), (0, -1, 0), 0.0074, 0.0092, 0.096, coll=coll,
                            mat=M['dark'])
    cap = cyl_axis('KeyholeEnd', (0, 0.07, 0), (0, 0.072, 0), 0.0093, seg=48, coll=coll, mat=M['black'])
    # four countersunk socket screws in the base
    for i in range(4):
        a = math.radians(45 + 90 * i)
        p = Vector((math.cos(a) * 0.0318, -0.0131, math.sin(a) * 0.0318))
        sc_ = cyl_axis(f'BossScrew{i}', p + Vector((0, 0.0006, 0)), p - Vector((0, 0.0004, 0)), 0.0034, seg=48,
                       coll=coll, mat=M['chrome'], bev=0.0003)
        hx_ = cyl_axis(f'BossScrewHex{i}', p - Vector((0, 0.0003, 0)), p - Vector((0, 0.00045, 0)), 0.0014, seg=6,
                       coll=coll, mat=M['black'])
    return base


# ----------------------------------------------------------------------------- S18/S22/S24: magnetic contact plates

PL = dict(gap=0.0025, fl_w=0.030, fl_h=0.080, fl_t=0.004, b_w=0.024, b_h=0.045, b_t=0.018, screw_z=0.031)


def screw_proto(M, coll=None, shank=0.018):
    """Socket-head cap screw M5 along local +Z (head top at z = 0.005), threads down to z = -shank."""
    kout = gear_outline(60, 0.0041, 0.00425, pts_per_tooth=4, tooth_frac=0.5)
    head = extrude_profile('ScrewHead', kout, 0.005, coll=coll, smooth=False)
    bevel(head, 0.00045, 3, angle=40)
    hexc = prim('cyl', 'ScrewHexCut', (0, 0, 0.005), seg=6, r=0.0023, depth=0.0052, coll=coll)
    boolean_cut(head, hexc)
    apply_mods(head)
    bpy.data.objects.remove(hexc)
    set_mat(head, M['screw'])
    parts = [head]
    core = prim('cyl', 'ScrewCore', (0, 0, -shank / 2), seg=32, r=0.0021, depth=shank, coll=coll)
    set_mat(core, M['thread'])
    parts.append(core)
    pitch = 0.0008
    n = int(shank / pitch)
    for i in range(n):
        t = prim('torus', 'ScrewThread', (0, 0, -pitch * (i + 0.5)), R=0.0021, r=0.00042, seg=32, seg2=8, coll=coll)
        set_mat(t, M['thread'])
        parts.append(t)
    proto = join(parts, 'ScrewProto')
    return proto


def mag_plate(M, side, proto, name, loosen=(0.0, 0.0), coll=None):
    """Magnetic contact plate. side -1: door half (x < 0), +1: frame half. Screws on the flange, raised by `loosen`
    (top, bottom) metres. Returns the root empty (parts parented; root at the world origin)."""
    root = empty(name, (0, 0, 0), coll=coll)
    g, fw, fh, ft, bw, bh, bt = PL['gap'], PL['fl_w'], PL['fl_h'], PL['fl_t'], PL['b_w'], PL['b_h'], PL['b_t']
    xa, xb = sorted((side * g, side * (g + fw)))
    fl = rbox(name + '_flange', xa, xb, -ft, 0.0, -fh / 2, fh / 2, bev=0.0007, seg=2, mat=M['block'], coll=coll)
    bxa, bxb = sorted((side * g, side * (g + bw)))
    body = rbox(name + '_body', bxa, bxb, -ft - bt, -ft + 0.0002, -bh / 2, bh / 2, bev=0.0012, seg=3, mat=M['block'],
                coll=coll)
    mx = side * (g - 0.00015)
    mag = rbox(name + '_magnet', min(mx, side * g + side * 0.0004), max(mx, side * g + side * 0.0004),
               -ft - bt + 0.003, -ft - 0.003, -bh / 2 + 0.006, bh / 2 - 0.006, bev=0.0002, mat=M['magnet'], coll=coll)
    parts = [fl, body, mag]
    screws = []
    sxc = side * (g + fw / 2)
    for k, zz in enumerate((PL['screw_z'], -PL['screw_z'])):
        sc_ = linked_copy(proto, f'{name}_screw{k}', coll=coll)
        sc_.rotation_euler = (math.radians(90), 0, math.radians(random.Random(k * 7 + side).uniform(0, 60)))
        sc_.location = (sxc, -ft - loosen[k], zz)
        screws.append(sc_)
        parts.append(sc_)
    for o in parts:
        parent(o, root, keep=True)
    return {'root': root, 'screws': screws, 'body': body, 'flange': fl}


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


def alu_sleeve(M, coll=None, name='AluPlate'):
    """Custom aluminium plate: a thin front plate with folded top/bottom lips that slides over both contact blocks
    (open at the sides). Root at the world origin when in place."""
    root = empty(name, (0, 0, 0), coll=coll)
    ft, bt, bh = PL['fl_t'], PL['b_t'], PL['b_h']
    yf = -ft - bt - 0.0006
    t = 0.002
    zt = bh / 2 + 0.0009
    front = rbox(name + '_front', -0.0315, 0.0315, yf - t, yf, -zt - t, zt + t, bev=0.0004, seg=2, mat=M['alu'],
                 coll=coll)
    lips = [rbox(name + f'_lip{s}', -0.0315, 0.0315, yf - t, -ft - 0.0009, (zt if s > 0 else -zt - t),
                 (zt + t if s > 0 else -zt), bev=0.0004, seg=2, mat=M['alu'], coll=coll) for s in (1, -1)]
    for o in [front] + lips:
        parent(o, root, keep=True)
    return root


def seam_set(M, coll=None, h=0.5, hinge=False):
    """Door fragment (x < 0) and frame fragment (x > 0) with a 4 mm seam at x = 0, faces flush at y = 0.
    Returns dict(door=slab, hinge=empty or None, frame=jamb)."""
    hv = None
    door = door_fragment(M, x0=-0.36, x1=-0.002, z0=-h / 2, z1=h / 2, coll=coll)
    if hinge:
        hv = empty('DoorHinge', (-1.0, 0.2, 0.0), coll=coll)
        parent(door, hv, keep=True)
    frame = frame_fragment(M, x0=0.002, x1=0.36, z0=-h / 2, z1=h / 2, coll=coll)
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
