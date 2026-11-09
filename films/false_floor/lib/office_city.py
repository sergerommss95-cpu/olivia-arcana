"""Set C for False Floor (builder C): the tenant's office, the dealer's table, the shoulder-bag macro, and the
diamond-district street. Illustrative reconstruction. Nothing legible anywhere: no text, no digits, no signs.

    office_mats() / build_office()     rented office seen from the corridor through the open door (S08 afternoon,
                                       S38 dusk): venetian blinds (linked slats), desk, precision balance, phone,
                                       desk lamp, empty task chair, door with a brass nameplate (abstract engraving)
    table_mats() / build_table()       dealer's table (S05): opened diamond paper with blue liner, rough stones, loupe,
                                       tweezers, pocket carat scale, pen, closed parcels
    bag_mats() / build_bag()           shoulder bag on a wooden chair (S11), pinhole lens in the strap's box stitch
    street_mats() / build_street()     the district (S04 dusk / S23 night): narrow pedestrian street of stone and glass
                                       office fronts, shuttered shopfronts, steel bollards across the entrance, police
                                       post kiosk, facade cameras, catenary sodium lamps, wet granite setts

Z up, metres. Materials are procedural (object coordinates). Reuses the TUMBLER city kit (SB, bm_box, sweep...).
"""
import math, random
import bpy, bmesh
from mathutils import Vector, Matrix, Euler, noise as mnoise
from ff import *  # noqa: F401,F403
from city import (SB, bm_box, bm_quad, sweep, rrect, spline, obj_bm, no_emit_sampling, smooth_angle,
                  mat_stone, mat_room, mat_facade, mat_window_glass, SODIUM)


def _m(name):
    return bpy.data.materials.get(name)


def ob(name, bm, mats, coll=None, smooth=None):
    return obj_bm(name, bm, mats if isinstance(mats, (list, tuple)) else [mats], coll, smooth)


def cyl(name, loc, r, depth, mat, rot=(0, 0, 0), seg=32, coll=None, r2=None, bev=0.0):
    o = prim('cyl', name, loc, rot, seg=seg, r=r, r2=r2 if r2 is not None else r, depth=depth, coll=coll)
    if bev:
        bevel(o, bev, 2, angle=50)
    set_mat(o, mat)
    return o


def rbox(name, size, loc, mat, bev=0.003, seg=2, rot=(0, 0, 0), coll=None, smooth=False):
    o = box(name, size, loc, rot, coll, bev=bev, seg=seg, mat=mat)
    if smooth:
        shade(o, True, 35)
    return o


def solidify(o, t, offset=-1.0, mat_off=0, rim_off=0):
    m = o.modifiers.new('Solid', 'SOLIDIFY')
    m.thickness = t
    m.offset = offset
    m.material_offset = mat_off
    m.material_offset_rim = rim_off
    m.use_even_offset = True
    return m


def no_shadow(o):
    try:
        o.visible_shadow = False
    except Exception:
        pass
    return o


def sun(name, direction, strength, color, angle=0.5, coll=None):
    ld = bpy.data.lights.new(name, 'SUN')
    ld.energy = strength
    ld.color = color
    ld.angle = math.radians(angle)
    o = bpy.data.objects.new(name, ld)
    link(o, coll)
    d = Vector(direction).normalized()
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return o


def world_sky(zenith, horizon, ground=(0.002, 0.002, 0.002), strength=1.0, glow=None):
    """Sky by view direction: horizon -> zenith, dark below the horizon; optional warm city glow near the horizon."""
    w = bpy.data.worlds.new('Sky')
    bpy.context.scene.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    s = SB(w)
    tc = s.node('ShaderNodeTexCoord')
    X, Y, Z = s.sep(tc.outputs['Generated'])
    col = s.mix(s.mr(Z, 0.0, 0.55, 0, 1, 'SMOOTHSTEP'), horizon, zenith)
    if glow:
        col = s.mix(s.m('MULTIPLY', s.mr(Z, 0.18, 0.0, 0, 1, 'SMOOTHSTEP'), glow[1]), col, glow[0])
    col = s.mix(s.mr(Z, -0.02, 0.01), ground, col)
    bg = s.node('ShaderNodeBackground', Strength=strength)
    s.put(col, bg.inputs['Color'])
    out = s.node('ShaderNodeOutputWorld')
    s.L.new(bg.outputs[0], out.inputs['Surface'])
    return w


# ============================================================================ materials

def mat_wall(name='WallPaint', color=(0.55, 0.53, 0.49), rough=0.82, stipple=0.05, dirt=0.25):
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    n1 = s.tex('ShaderNodeTexNoise', co, Scale=0.45, Detail=6.0, Roughness=0.6)
    n2 = s.tex('ShaderNodeTexNoise', co, Scale=110.0, Detail=3.0)
    col = s.mix(s.mr(n1.outputs['Fac'], 0.3, 0.7), tuple(c * 0.86 for c in color), tuple(min(1, c * 1.05) for c in color))
    low = s.m('MULTIPLY', s.mr(Z, 0.35, 0.0), dirt)       # scuffed lower wall
    col = s.mix(low, col, tuple(c * 0.6 for c in color))
    s.put(col, p.inputs['Base Color'])
    s.put(s.mr(n2.outputs['Fac'], 0.3, 0.7, rough - 0.08, rough + 0.06), p.inputs['Roughness'])
    s.put(s.bump(n2.outputs['Fac'], stipple, 0.002), p.inputs['Normal'])
    return m


def mat_wood(name, light=(0.40, 0.24, 0.12), dark=(0.16, 0.08, 0.035), along='X', scale=1.0, rough=(0.28, 0.48),
             coat=0.0, coat_rough=0.12, lines=380.0, wear=0.0):
    """Wood veneer: straight grain lines along `along`, figured by distorted noise, pores, optional lacquer coat."""
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    perp = {'X': Y, 'Y': X, 'Z': X}[along]
    st = {'X': (1.0, 14.0, 14.0), 'Y': (14.0, 1.0, 14.0), 'Z': (14.0, 14.0, 1.0)}[along]
    mp = s.node('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = tuple(v * scale for v in st)
    s.put(co, mp.inputs['Vector'])
    fig = s.tex('ShaderNodeTexNoise', mp.outputs[0], Scale=2.2, Detail=6.0, Roughness=0.55, Distortion=1.2)
    g = s.m('SINE', s.m('ADD', s.m('MULTIPLY', perp, lines * scale), s.m('MULTIPLY', fig.outputs['Fac'], 14.0)))
    g = s.mr(g, -1.0, 1.0)
    pores = s.tex('ShaderNodeTexNoise', mp.outputs[0], Scale=160.0, Detail=2.0)
    blot = s.tex('ShaderNodeTexNoise', co, Scale=3.0 * scale, Detail=4.0)
    t = s.m('ADD', s.m('MULTIPLY', g, 0.55), s.m('MULTIPLY', fig.outputs['Fac'], 0.45))
    col = s.mix(s.mr(t, 0.25, 0.85), dark, light)
    col = s.mix(s.m('MULTIPLY', s.mr(pores.outputs['Fac'], 0.55, 0.7), 0.5), col, tuple(c * 0.55 for c in dark))
    col = s.mix(s.mr(blot.outputs['Fac'], 0.4, 0.7, 0.0, 0.25), col, tuple(c * 0.7 for c in dark))
    if wear > 0:
        geo = s.node('ShaderNodeNewGeometry')
        e = s.m('MULTIPLY', s.mr(geo.outputs['Pointiness'], 0.52, 0.6), wear)
        col = s.mix(e, col, tuple(min(1, c * 1.5) for c in light))
    s.put(col, p.inputs['Base Color'])
    s.put(s.mr(blot.outputs['Fac'], 0.3, 0.7, rough[0], rough[1]), p.inputs['Roughness'])
    p.inputs['Coat Weight'].default_value = coat
    p.inputs['Coat Roughness'].default_value = coat_rough
    s.put(s.bump(s.m('ADD', s.m('MULTIPLY', g, 0.3), pores.outputs['Fac']), 0.06, 0.0006), p.inputs['Normal'])
    scr = s.tex('ShaderNodeTexWave', co, {'wave_type': 'BANDS', 'bands_direction': 'DIAGONAL'},
                Scale=4.0 * scale, Distortion=22.0, Detail=6.0, Detail_Scale=2.0)
    if coat > 0:
        s.put(s.mr(scr.outputs['Fac'], 0.97, 1.0, coat_rough, coat_rough + 0.25), p.inputs['Coat Roughness'])
    return m


def mat_weave(name, color, period=0.0011, axes=('X', 'Z'), rough=0.86, bump=0.5, sheen=0.35, slub=0.3, var=0.25):
    """Plain-weave textile (canvas / upholstery): crossing thread heights from object coordinates on two axes."""
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    ax = {'X': X, 'Y': Y, 'Z': Z}
    A, B = ax[axes[0]], ax[axes[1]]
    k = math.pi / period
    nn = s.tex('ShaderNodeTexNoise', co, Scale=1.0 / period * 0.12, Detail=3.0)
    jit = s.m('MULTIPLY', s.m('SUBTRACT', nn.outputs['Fac'], 0.5), period * 0.6)
    sa = s.m('SINE', s.m('MULTIPLY', s.m('ADD', A, jit), k))
    sb_ = s.m('SINE', s.m('MULTIPLY', s.m('ADD', B, jit), k))
    sa2 = s.m('SINE', s.m('MULTIPLY', A, k * 0.5))
    sb2 = s.m('SINE', s.m('MULTIPLY', B, k * 0.5))
    warp = s.m('MULTIPLY', s.m('ABSOLUTE', sb_), s.m('ADD', 0.62, s.m('MULTIPLY', s.m('MULTIPLY', sa2, sb2), 0.38)))
    weft = s.m('MULTIPLY', s.m('ABSOLUTE', sa), s.m('SUBTRACT', 0.62, s.m('MULTIPLY', s.m('MULTIPLY', sa2, sb2), 0.38)))
    h = s.m('MAXIMUM', warp, weft)
    sl = s.tex('ShaderNodeTexNoise', s.comb(s.m('MULTIPLY', A, 3.0), B, 0.0), Scale=1.0 / period * 0.05, Detail=2.0)
    big = s.tex('ShaderNodeTexNoise', co, Scale=9.0, Detail=5.0)
    col = s.mix(s.mr(big.outputs['Fac'], 0.3, 0.7), tuple(c * (1 - var) for c in color), tuple(min(1, c * (1 + var)) for c in color))
    col = s.mix(s.m('MULTIPLY', s.mr(sl.outputs['Fac'], 0.45, 0.75), slub), col, tuple(min(1, c * 1.35) for c in color))
    col = s.mix(s.m('MULTIPLY', s.mr(h, 0.5, 0.0), 0.45), col, tuple(c * 0.45 for c in color))
    s.put(col, p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    p.inputs['Sheen Weight'].default_value = sheen
    p.inputs['Sheen Roughness'].default_value = 0.5
    p.inputs['Specular IOR Level'].default_value = 0.35
    cr = s.tex('ShaderNodeTexNoise', co, Scale=18.0, Detail=4.0, Roughness=0.55, Distortion=0.4)
    nrm = s.bump(cr.outputs['Fac'], 0.12, 0.004)
    s.put(s.bump(h, bump, period * 0.35, normal=nrm), p.inputs['Normal'])
    return m


def mat_leather(name, color=(0.10, 0.045, 0.02), rough=(0.36, 0.62), grain=1.0, worn=0.35, bump=0.25):
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    vor = s.tex('ShaderNodeTexVoronoi', co, Scale=900.0 * grain)
    wr = s.tex('ShaderNodeTexNoise', co, Scale=140.0 * grain, Detail=6.0, Roughness=0.6)
    patch = s.tex('ShaderNodeTexNoise', co, Scale=12.0, Detail=5.0)
    col = s.mix(s.mr(patch.outputs['Fac'], 0.3, 0.7), tuple(c * 0.7 for c in color), tuple(min(1, c * 1.3) for c in color))
    if worn > 0:
        geo = s.node('ShaderNodeNewGeometry')
        e = s.m('MULTIPLY', s.mr(geo.outputs['Pointiness'], 0.51, 0.58), worn)
        col = s.mix(e, col, tuple(min(1, c * 1.9) for c in color))
    s.put(col, p.inputs['Base Color'])
    s.put(s.mr(patch.outputs['Fac'], 0.3, 0.7, rough[0], rough[1]), p.inputs['Roughness'])
    h = s.m('ADD', s.m('MULTIPLY', vor.outputs['Distance'], 0.7), s.m('MULTIPLY', wr.outputs['Fac'], 0.5))
    s.put(s.bump(h, bump, 0.0004), p.inputs['Normal'])
    p.inputs['Coat Weight'].default_value = 0.15
    p.inputs['Coat Roughness'].default_value = 0.35
    return m


def mat_plastic(name, color, rough=0.42, tex=0.12, scale=420.0, spec=0.5):
    if _m(name):
        return _m(name)
    m = mat_principled(name, color=color, rough=rough, spec=spec)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    n = s.tex('ShaderNodeTexNoise', co, Scale=scale, Detail=3.0)
    blot = s.tex('ShaderNodeTexNoise', co, Scale=8.0, Detail=4.0)
    s.put(s.mr(blot.outputs['Fac'], 0.3, 0.7, rough - 0.08, rough + 0.1), p.inputs['Roughness'])
    s.put(s.bump(n.outputs['Fac'], tex, 0.0003), p.inputs['Normal'])
    return m


def mat_paper(name, color=(0.80, 0.80, 0.78), rough=0.6, sss=0.12, fiber=0.03, scale=1.0):
    if _m(name):
        return _m(name)
    m = mat_principled(name, color=color, rough=rough, spec=0.35)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    n1 = s.tex('ShaderNodeTexNoise', co, Scale=1800.0 * scale, Detail=3.0)
    n2 = s.tex('ShaderNodeTexNoise', co, Scale=40.0 * scale, Detail=4.0)
    s.put(s.mix(s.mr(n2.outputs['Fac'], 0.35, 0.7), tuple(c * 0.93 for c in color), color), p.inputs['Base Color'])
    p.inputs['Subsurface Weight'].default_value = sss
    try:
        p.inputs['Subsurface Radius'].default_value = (1.0, 0.9, 0.8)
        p.inputs['Subsurface Scale'].default_value = 0.002
    except Exception:
        pass
    s.put(s.bump(n1.outputs['Fac'], fiber, 0.0002), p.inputs['Normal'])
    return m


def mat_rough_diamond(name='RoughDiamond'):
    """Uncut stone: pale, frosted, greasy-translucent pebble. Not faceted, not sparkly."""
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    oi = s.node('ShaderNodeObjectInfo')
    co = s.coords()
    tint = s.mix(s.mr(oi.outputs['Random'], 0.0, 1.0), (0.84, 0.83, 0.79), (0.78, 0.76, 0.66))
    geo = s.node('ShaderNodeNewGeometry')
    grime = s.mr(geo.outputs['Pointiness'], 0.47, 0.42)
    col = s.mix(s.m('MULTIPLY', grime, 0.5), tint, (0.30, 0.28, 0.24))
    s.put(col, p.inputs['Base Color'])
    fr = s.tex('ShaderNodeTexNoise', co, Scale=2600.0, Detail=3.0, Roughness=0.6)
    s.put(s.mr(fr.outputs['Fac'], 0.3, 0.7, 0.26, 0.46), p.inputs['Roughness'])
    p.inputs['Transmission Weight'].default_value = 0.8
    p.inputs['IOR'].default_value = 2.1
    p.inputs['Coat Weight'].default_value = 0.3
    p.inputs['Coat Roughness'].default_value = 0.3
    s.put(s.bump(fr.outputs['Fac'], 0.3, 0.0002), p.inputs['Normal'])
    return m


def mat_carpet(name='Carpet', color=(0.055, 0.06, 0.068)):
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    n1 = s.tex('ShaderNodeTexNoise', co, Scale=700.0, Detail=4.0)
    vor = s.tex('ShaderNodeTexVoronoi', co, Scale=260.0)
    blot = s.tex('ShaderNodeTexNoise', co, Scale=1.2, Detail=5.0)
    col = s.mix(s.mr(vor.outputs['Distance'], 0.0, 0.5), tuple(c * 0.6 for c in color), tuple(c * 1.3 for c in color))
    col = s.mix(s.mr(blot.outputs['Fac'], 0.35, 0.7, 0, 0.5), col, tuple(c * 0.7 for c in color))
    s.put(col, p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.95
    p.inputs['Sheen Weight'].default_value = 0.4
    p.inputs['Specular IOR Level'].default_value = 0.25
    s.put(s.bump(s.m('ADD', n1.outputs['Fac'], vor.outputs['Distance']), 0.5, 0.0015), p.inputs['Normal'])
    # carpet-tile seams every 0.5 m
    X, Y, Z = s.sep(co)
    jx = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('DIVIDE', X, 0.5)), 0.5)), 0.493, 0.499)
    jy = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('DIVIDE', Y, 0.5)), 0.5)), 0.493, 0.499)
    s.put(s.mix(s.m('MULTIPLY', s.m('MAXIMUM', jx, jy), 0.6), col, tuple(c * 0.5 for c in color)), p.inputs['Base Color'])
    return m


def mat_ceiling_tiles(name='CeilTiles', color=(0.5, 0.5, 0.48), tile=0.6):
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    jx = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('DIVIDE', X, tile)), 0.5)), 0.485, 0.495)
    jy = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('DIVIDE', Y, tile)), 0.5)), 0.485, 0.495)
    j = s.m('MAXIMUM', jx, jy)
    n = s.tex('ShaderNodeTexNoise', co, Scale=300.0, Detail=3.0)
    s.put(s.mix(j, color, (0.35, 0.35, 0.34)), p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.9
    s.put(s.bump(s.m('SUBTRACT', n.outputs['Fac'], j), 0.3, 0.003), p.inputs['Normal'])
    return m


def mat_terrazzo(name='Terrazzo', base=(0.22, 0.21, 0.19)):
    if _m(name):
        return _m(name)
    m = mat_stone(name, base=base, rough=(0.16, 0.34), speck=0.5, scale=3.0)
    p = principled(m)
    p.inputs['Coat Weight'].default_value = 0.3
    p.inputs['Coat Roughness'].default_value = 0.15
    return m


def mat_engraved_brass(name='PlateBrass', w=0.20, h=0.06):
    """Brass plate with black-filled engraving: two 'lines' of word-length bars, never letters.
    Plate local coords: X across (-w/2..w/2), Z up (-h/2..h/2)."""
    if _m(name):
        return _m(name)
    m = mat_brass(name, base=(0.80, 0.56, 0.26), dark=(0.42, 0.26, 0.09), rough=(0.42, 0.58), scale=8.0, worn=0.3)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)

    def line(z0, z1, x0, x1, unit, seed):
        cell = s.m('FLOOR', s.m('DIVIDE', X, unit))
        wn = s.tex('ShaderNodeTexWhiteNoise', s.comb(cell, seed, 0.0), {'noise_dimensions': '2D'})
        word = s.m('GREATER_THAN', wn.outputs['Value'], 0.22)
        inner = s.band(s.m('FRACT', s.m('DIVIDE', X, unit)), 0.06, 0.94, 0.02)
        return s.mul(word, inner, s.band(Z, z0, z1, 0.0004), s.band(X, x0, x1, 0.0005))

    l1 = line(0.004, 0.013, -w * 0.36, w * 0.36, 0.009, 3.0)
    l2 = line(-0.014, -0.008, -w * 0.24, w * 0.24, 0.006, 7.0)
    border = s.m('SUBTRACT', s.mul(s.band(X, -w / 2 + 0.005, w / 2 - 0.005, 0.0003), s.band(Z, -h / 2 + 0.005, h / 2 - 0.005, 0.0003)),
                 s.mul(s.band(X, -w / 2 + 0.0065, w / 2 - 0.0065, 0.0003), s.band(Z, -h / 2 + 0.0065, h / 2 - 0.0065, 0.0003)))
    eng = s.m('MAXIMUM', s.m('MAXIMUM', l1, l2), s.m('MULTIPLY', border, 0.8))
    bc = p.inputs['Base Color'].links[0].from_socket
    s.put(s.mix(eng, bc, (0.02, 0.018, 0.015)), p.inputs['Base Color'])
    s.put(s.m('SUBTRACT', 1.0, eng), p.inputs['Metallic'])
    rl = p.inputs['Roughness'].links[0].from_socket
    s.put(s.mix(eng, rl, 0.6, 'FLOAT'), p.inputs['Roughness'])
    s.put(s.bump(s.m('MULTIPLY', eng, -1.0), 0.6, 0.0003), p.inputs['Normal'])
    return m


def mat_lcd_off(name='LcdOff'):
    if _m(name):
        return _m(name)
    m = mat_principled(name, color=(0.045, 0.05, 0.042), rough=0.08, spec=0.6)
    return m


def mat_glass_clear(name='ClearGlass', rough=0.0):
    if _m(name):
        return _m(name)
    return mat_principled(name, color=(0.95, 0.97, 0.96), rough=rough, transmission=1.0, ior=1.5)


def mat_corrugated(name='Shutter', base=(0.20, 0.205, 0.21), pitch=0.075, metal=0.75):
    """Roller shutter: horizontal corrugations every `pitch` (object Z), grime rising from the bottom, streaks."""
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    w = s.m('SINE', s.m('MULTIPLY', Z, 2 * math.pi / pitch))
    seam = s.mr(s.m('FRACT', s.m('DIVIDE', Z, pitch)), 0.0, 0.08, 1.0, 0.0)
    st = s.node('ShaderNodeMapping')
    st.inputs['Scale'].default_value = (6.0, 6.0, 0.25)
    s.put(co, st.inputs['Vector'])
    streak = s.tex('ShaderNodeTexNoise', st.outputs[0], Scale=4.0, Detail=6.0)
    blot = s.tex('ShaderNodeTexNoise', co, Scale=1.5, Detail=6.0)
    grime = s.m('MAXIMUM', s.mr(Z, 0.9, 0.0), s.mr(streak.outputs['Fac'], 0.55, 0.75, 0.0, 0.6))
    col = s.mix(s.mr(blot.outputs['Fac'], 0.3, 0.7), tuple(c * 0.8 for c in base), tuple(min(1, c * 1.15) for c in base))
    col = s.mix(grime, col, tuple(c * 0.35 for c in base))
    col = s.mix(s.m('MULTIPLY', seam, 0.7), col, (0.01, 0.01, 0.01))
    s.put(col, p.inputs['Base Color'])
    s.put(s.mix(grime, 0.38, 0.75, 'FLOAT'), p.inputs['Roughness'])
    s.put(s.mix(grime, metal, 0.2, 'FLOAT'), p.inputs['Metallic'])
    s.put(s.bump(s.m('SUBTRACT', w, seam), 0.7, 0.008), p.inputs['Normal'])
    return m


def mat_panel_stone(name, base=(0.36, 0.33, 0.29), joint=(1.2, 0.6), rough=(0.45, 0.7), dirt=0.4, scale=1.0, axes=('U', 'Z')):
    """Stone cladding panels with dark joints and weather streaks (object coords; U = X + Y so either facade
    orientation gets the joint grid)."""
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    U = s.m('ADD', X, Y)
    ju = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('DIVIDE', U, joint[0])), 0.5)), 0.493, 0.499)
    jz = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', s.m('FRACT', s.m('DIVIDE', Z, joint[1])), 0.5)), 0.485, 0.497)
    j = s.m('MAXIMUM', ju, jz)
    pid = s.tex('ShaderNodeTexWhiteNoise', s.comb(s.m('FLOOR', s.m('DIVIDE', U, joint[0])), s.m('FLOOR', s.m('DIVIDE', Z, joint[1])), 1.0),
                {'noise_dimensions': '3D'})
    n1 = s.tex('ShaderNodeTexNoise', co, Scale=3.0 * scale, Detail=8.0)
    st = s.node('ShaderNodeMapping')
    st.inputs['Scale'].default_value = (3.0, 3.0, 0.15)
    s.put(co, st.inputs['Vector'])
    streak = s.tex('ShaderNodeTexNoise', st.outputs[0], Scale=6.0, Detail=5.0)
    col = s.mix(s.mr(pid.outputs['Value'], 0, 1, 0.0, 1.0), tuple(c * 0.85 for c in base), tuple(min(1, c * 1.1) for c in base))
    col = s.mix(s.mr(n1.outputs['Fac'], 0.3, 0.7, 0.0, 0.5), col, tuple(c * 0.75 for c in base))
    col = s.mix(s.m('MULTIPLY', s.mr(streak.outputs['Fac'], 0.5, 0.75), dirt), col, tuple(c * 0.4 for c in base))
    col = s.mix(j, col, tuple(c * 0.25 for c in base))
    s.put(col, p.inputs['Base Color'])
    s.put(s.mr(n1.outputs['Fac'], 0.3, 0.7, rough[0], rough[1]), p.inputs['Roughness'])
    s.put(s.bump(s.m('SUBTRACT', s.m('MULTIPLY', n1.outputs['Fac'], 0.3), j), 0.4, 0.004), p.inputs['Normal'])
    return m


def mat_setts(name='Setts', base=(0.075, 0.072, 0.07), wet=0.55, size=(0.11, 0.095), puddle_scale=0.22):
    """Granite setts in running bond (object XY), dark joints, wet film + puddles (mirror-flat)."""
    if _m(name):
        return _m(name)
    m = new_mat(name)
    s = SB(m)
    p = principled(m)
    co = s.coords()
    X, Y, Z = s.sep(co)
    row = s.m('FLOOR', s.m('DIVIDE', Y, size[1]))
    off = s.m('MULTIPLY', s.m('FRACT', s.m('MULTIPLY', row, 0.618)), size[0])
    cu = s.m('DIVIDE', s.m('ADD', X, off), size[0])
    col_i = s.m('FLOOR', cu)
    fu = s.m('FRACT', cu)
    fv = s.m('FRACT', s.m('DIVIDE', Y, size[1]))
    ju = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', fu, 0.5)), 0.40, 0.48)
    jv = s.mr(s.m('ABSOLUTE', s.m('SUBTRACT', fv, 0.5)), 0.38, 0.47)
    joint = s.m('MAXIMUM', ju, jv)
    dome = s.m('MULTIPLY', s.m('SUBTRACT', 1.0, s.m('MULTIPLY', s.m('ABSOLUTE', s.m('SUBTRACT', fu, 0.5)), 2.0)),
               s.m('SUBTRACT', 1.0, s.m('MULTIPLY', s.m('ABSOLUTE', s.m('SUBTRACT', fv, 0.5)), 2.0)))
    wn = s.tex('ShaderNodeTexWhiteNoise', s.comb(col_i, row, 0.5), {'noise_dimensions': '3D'})
    r1, r2, r3 = s.sep(wn.outputs['Color'])
    speck = s.tex('ShaderNodeTexVoronoi', co, Scale=140.0)
    n2 = s.tex('ShaderNodeTexNoise', co, Scale=puddle_scale, Detail=5.0, Roughness=0.6)
    n3 = s.tex('ShaderNodeTexNoise', co, Scale=1.6, Detail=6.0)
    pud = s.mr(n2.outputs['Fac'], 0.58 - wet * 0.12, 0.62 - wet * 0.12)
    col = s.mix(r1, tuple(c * 0.65 for c in base), tuple(c * 1.45 for c in base))
    col = s.mix(s.m('MULTIPLY', s.mr(r2, 0.85, 1.0), 0.6), col, (0.11, 0.09, 0.075))
    col = s.mix(s.m('MULTIPLY', s.mr(speck.outputs['Distance'], 0.1, 0.02), 0.4), col, tuple(min(1, c * 2.2) for c in base))
    col = s.mix(joint, col, (0.008, 0.008, 0.008))
    col = s.mix(s.m('MULTIPLY', pud, 0.7), col, tuple(c * 0.5 for c in base))
    s.put(col, p.inputs['Base Color'])
    s.put(s.mix(pud, s.mr(n3.outputs['Fac'], 0.3, 0.7, 0.28, 0.5), 0.05, 'FLOAT'), p.inputs['Roughness'])
    p.inputs['Coat IOR'].default_value = 1.33
    wetfilm = s.m('MAXIMUM', pud, s.m('MULTIPLY', s.mr(n3.outputs['Fac'], 0.35, 0.65), wet))
    s.put(s.m('MAXIMUM', wetfilm, s.m('MULTIPLY', joint, wet)), p.inputs['Coat Weight'])
    s.put(s.mix(pud, 0.12, 0.01, 'FLOAT'), p.inputs['Coat Roughness'])
    h = s.m('MULTIPLY', s.m('SUBTRACT', s.m('POWER', s.m('MAXIMUM', dome, 0.0), 0.35), joint), s.m('SUBTRACT', 1.0, pud))
    s.put(s.bump(h, 0.7, 0.012), p.inputs['Normal'])
    s.put(s.bump(s.m('MULTIPLY', h, 0.3), 0.3, 0.004), p.inputs['Coat Normal'])
    return m


def mat_office_glass(name, dark_frac=0.8, strength=1.6, cool_frac=0.6, refl=0.08):
    """Office windows from the street: city.mat_room interior (per-pane UV 'WinData') + a glossy reflection layer."""
    if _m(name):
        return _m(name)
    m = mat_room(name, strength=strength, dark_frac=dark_frac, cool_frac=cool_frac)
    nt = m.node_tree
    out = nt.nodes['Material Output']
    em_link = out.inputs['Surface'].links[0]
    em_sock = em_link.from_socket
    nt.links.remove(em_link)
    s = SB(m)
    gl = s.node('ShaderNodeBsdfGlossy', Color=(0.9, 0.92, 0.95), Roughness=0.04)
    lw = s.node('ShaderNodeLayerWeight', Blend=0.2)
    fac = s.m('ADD', lw.outputs['Fresnel'], refl, clamp=True)
    tint = s.node('ShaderNodeBsdfDiffuse', Color=(0.003, 0.0035, 0.004))
    add = s.node('ShaderNodeAddShader')
    s.L.new(em_sock, add.inputs[0])
    s.L.new(tint.outputs[0], add.inputs[1])
    mx = s.node('ShaderNodeMixShader')
    s.put(fac, mx.inputs[0])
    s.L.new(add.outputs[0], mx.inputs[1])
    s.L.new(gl.outputs[0], mx.inputs[2])
    s.L.new(mx.outputs[0], out.inputs['Surface'])
    return m


# ============================================================================ shared props

def build_carat_scale(name, loc, rot_z, M, coll=None, lid_angle=105.0):
    """Pocket carat scale: black body, steel platform, blank (off) LCD, two unlabelled buttons, hinged lid open."""
    root = empty(name, loc, coll, size=0.03)
    root.rotation_euler.z = rot_z
    W, D, H = 0.118, 0.072, 0.018
    parts = []
    b = rbox(name + 'Body', (W, D, H), (0, 0, H / 2), M['black_plastic'], bev=0.004, seg=3, coll=coll)
    parts.append(b)
    pan = rbox(name + 'Pan', (0.058, 0.058, 0.0016), (-0.022, 0.002, H + 0.0018), M['steel'], bev=0.0006, coll=coll)
    parts.append(pan)
    post = cyl(name + 'Post', (-0.022, 0.002, H + 0.0006), 0.006, 0.0012, M['steel'], coll=coll)
    parts.append(post)
    lcd = rbox(name + 'Lcd', (0.026, 0.014, 0.0008), (0.035, -0.016, H + 0.0001), M['lcd'], bev=0.0004, coll=coll)
    parts.append(lcd)
    for i, yy in enumerate((0.008, 0.024)):
        bt = cyl(name + f'Btn{i}', (0.035, yy, H + 0.0006), 0.0034, 0.0016, M['grey_plastic'], seg=20, coll=coll, bev=0.0004)
        parts.append(bt)
    hinge = empty(name + 'Hinge', (0, D / 2, H), coll, size=0.01)
    lid = rbox(name + 'Lid', (W, D, 0.0045), (0, -D / 2, 0.00225), M['black_plastic'], bev=0.0018, seg=2, coll=coll)
    parent(lid, hinge, keep=False)
    hinge.rotation_euler.x = math.radians(lid_angle)
    parent(hinge, root, keep=False)
    for o in parts:
        parent(o, root, keep=False)
    return root


def build_tweezers(name, loc, rot_z, M, coll=None, L=0.162, spread=0.0075):
    """Diamond tweezers lying flat: two tapered brushed-steel arms joined at the back, tips touching."""
    bm = bmesh.new()
    n = 40
    for side in (-1, 1):
        path, secs = [], []
        for i in range(n + 1):
            t = i / n
            x = t * L
            gap = spread * math.sin(math.pi * min(1.0, t / 0.92)) ** 0.7 * (1 - t ** 6) * 0.5
            if t > 0.92:
                gap = 0.0004
            path.append(Vector((x, side * (gap + 0.0012), 0.0008)))
        width = lambda t: 0.0058 * (1 - t) + 0.0017 * t if t < 0.85 else 0.0017 * (1 - (t - 0.85) / 0.15 * 0.6)
        rings = []
        for i, P in enumerate(path):
            t = i / n
            w = width(t)
            th = 0.0013 if t > 0.1 else 0.0018
            T = (path[min(i + 1, n)] - path[max(i - 1, 0)]).normalized()
            N = Vector((-T.y, T.x, 0))
            sec = [(-w / 2, -th / 2), (w / 2, -th / 2), (w / 2, th / 2), (-w / 2, th / 2)]
            rings.append([bm.verts.new(P + N * a + Vector((0, 0, b))) for a, b in sec])
        for i in range(n):
            for j in range(4):
                bm.faces.new((rings[i][j], rings[i][(j + 1) % 4], rings[i + 1][(j + 1) % 4], rings[i + 1][j]))
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bm_box(bm, (0.006, 0, 0.0008), (0.012, 0.007, 0.0016))
    o = ob(name, bm, [M['steel_brushed']], coll, smooth=40)
    bevel(o, 0.0003, 1, angle=30)
    o.location = loc
    o.rotation_euler = (0, 0, rot_z)
    return o


def build_pen(name, loc, rot_z, M, coll=None, roll=0.6):
    root = empty(name, loc, coll, size=0.02)
    root.rotation_euler = (0, 0, rot_z)
    r = 0.0055
    parts = [cyl(name + 'Barrel', (0.0, 0, r), r, 0.105, M['black_lacquer'], rot=(0, math.pi / 2, 0), seg=32),
             cyl(name + 'Cap', (0.074, 0, r), r * 1.04, 0.045, M['black_lacquer'], rot=(0, math.pi / 2, 0), seg=32),
             cyl(name + 'Ring', (0.0515, 0, r), r * 1.07, 0.004, M['gilt'], rot=(0, math.pi / 2, 0), seg=32),
             cyl(name + 'Tip', (-0.062, 0, r), r * 0.85, 0.014, M['gilt'], rot=(0, math.pi / 2, 0), seg=32, r2=r * 0.25),
             cyl(name + 'End', (0.098, 0, r), r * 0.98, 0.003, M['gilt'], rot=(0, math.pi / 2, 0), seg=32)]
    clip = rbox(name + 'Clip', (0.04, 0.0022, 0.0012), (0.075, 0, 2 * r + 0.0009), M['gilt'], bev=0.0004)
    parts.append(clip)
    for o in parts:
        if o.name.startswith(name + 'Barrel') or o.name.startswith(name + 'Cap'):
            bevel(o, 0.001, 2, angle=50)
        parent(o, root, keep=False)
    return root


def build_closed_parcel(name, loc, rot_z, M, coll=None, size=(0.092, 0.046), seed=1):
    """A folded diamond paper, closed: flat packet with the top third folded over and the ends tucked."""
    rng = random.Random(seed)
    W, D = size
    root = empty(name, loc, coll, size=0.02)
    root.rotation_euler = (rng.uniform(-0.01, 0.01), rng.uniform(-0.01, 0.01), rot_z)
    parts = [rbox(name + 'Base', (W, D, 0.0022), (0, 0, 0.0011), M['paper_white'], bev=0.0007, seg=2),
             rbox(name + 'Flap', (W - 0.002, D * 0.62, 0.0006), (0, -D * 0.19, 0.0025), M['paper_white'], bev=0.0002),
             rbox(name + 'EndL', (0.016, D - 0.003, 0.0005), (-W / 2 + 0.008, 0, 0.0031), M['paper_white'], bev=0.0002),
             rbox(name + 'EndR', (0.016, D - 0.003, 0.0005), (W / 2 - 0.008, 0, 0.0031), M['paper_white'], bev=0.0002)]
    parts[1].rotation_euler.x = math.radians(rng.uniform(-1.5, 1.5))
    parts[2].rotation_euler.y = math.radians(rng.uniform(2, 6))
    parts[3].rotation_euler.y = math.radians(-rng.uniform(1, 5))
    for o in parts:
        parent(o, root, keep=False)
    return root


def rough_stone(name, loc, size, mat, coll=None, seed=0, rot=None):
    """Octahedral pebble (same recipe as woods.rough_stone, kept local so the sets stay independent)."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
    sd = Vector((seed * 2.3, seed * 0.9, seed * 1.7))
    rng = random.Random(seed)
    ax = Vector((rng.uniform(0.8, 1.15), rng.uniform(0.75, 1.1), rng.uniform(0.6, 0.95)))
    for v in bm.verts:
        d = v.co.normalized()
        oct_r = 1.0 / (abs(d.x) + abs(d.y) + abs(d.z))
        r = 0.45 + 0.55 * oct_r * 1.45
        r *= 1 + 0.07 * mnoise.noise(d * 3.0 + sd) + 0.025 * mnoise.noise(d * 9.0 + sd)
        v.co = Vector((d.x * ax.x, d.y * ax.y, d.z * ax.z)) * r * size
    o = from_bmesh(name, bm, coll, smooth=True, angle=50)
    o.location = loc
    o.rotation_euler = rot or (rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(0, 6.28))
    set_mat(o, mat)
    return o


def brilliant(name, loc, r, mat, coll=None, rot=(0, 0, 0)):
    """Small round brilliant (16-sided approximation, flat-shaded facets)."""
    bm = bmesh.new()
    n = 16
    crown_h, table_r, pav_d, gird = 0.32 * r, 0.55 * r, 0.86 * r, 0.03 * r
    rings = []
    for z, rr, off in ((0.0, 0.0, 0.0), (pav_d, r, 0.0), (pav_d + gird, r, 0.0), (pav_d + gird + crown_h, table_r, 0.5)):
        if rr == 0:
            rings.append([bm.verts.new((0, 0, 0))])
            continue
        rings.append([bm.verts.new((rr * math.cos(2 * math.pi * (i + off) / n), rr * math.sin(2 * math.pi * (i + off) / n), z))
                      for i in range(n)])
    c = rings[0][0]
    for i in range(n):
        bm.faces.new((c, rings[1][(i + 1) % n], rings[1][i]))
    for a, b in ((1, 2), (2, 3)):
        for i in range(n):
            bm.faces.new((rings[a][i], rings[a][(i + 1) % n], rings[b][(i + 1) % n], rings[b][i]))
    bm.faces.new(rings[3])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = from_bmesh(name, bm, coll, smooth=False)
    o.location = loc
    o.rotation_euler = rot
    set_mat(o, mat)
    return o


# ============================================================================ S08 / S38: the office

OFF = dict(x0=-1.9, x1=2.5, y1=4.1, H=2.65, door=(-0.45, 0.45, 2.05), win=(-1.5, 1.1, 0.88, 2.36),
           cor=(-4.2, 4.2, -2.6), cor_h=2.6, t=0.12)


def office_mats():
    M = {}
    M['wall'] = mat_wall('OfficeWall', color=(0.50, 0.48, 0.44))
    M['wall_cor'] = mat_wall('CorridorWall', color=(0.40, 0.40, 0.37), dirt=0.35)
    M['carpet'] = mat_carpet('OfficeCarpet', color=(0.05, 0.055, 0.062))
    M['terrazzo'] = mat_terrazzo('CorridorFloor', base=(0.20, 0.19, 0.17))
    M['ceiling'] = mat_ceiling_tiles('CeilTiles', color=(0.42, 0.42, 0.40))
    M['desk_top'] = mat_wood('DeskVeneer', light=(0.46, 0.30, 0.17), dark=(0.25, 0.14, 0.07), along='X', scale=1.0,
                             rough=(0.3, 0.45), coat=0.25, coat_rough=0.18, lines=260.0, wear=0.0)
    M['desk_body'] = mat_plastic('DeskMelamine', (0.16, 0.16, 0.155), rough=0.55, tex=0.05)
    M['desk_edge'] = mat_plastic('DeskEdge', (0.035, 0.035, 0.036), rough=0.4, tex=0.05)
    M['metal_grey'] = mat_paint('GreyPowder', color=(0.13, 0.135, 0.14), rough=(0.35, 0.5), scale=4.0, wear=0.15)
    M['chair_fab'] = mat_weave('ChairFabric', (0.018, 0.019, 0.021), period=0.0016, axes=('X', 'Y'), rough=0.9, bump=0.4,
                               sheen=0.5, var=0.15)
    M['black_plastic'] = mat_plastic('BlackPlastic', (0.014, 0.014, 0.015), rough=0.38, tex=0.15)
    M['grey_plastic'] = mat_plastic('GreyPlastic', (0.09, 0.09, 0.088), rough=0.45, tex=0.12)
    M['beige_plastic'] = mat_plastic('BeigePlastic', (0.42, 0.40, 0.34), rough=0.45, tex=0.12)
    M['chrome'] = mat_metal('Chrome', base=(0.82, 0.82, 0.84), rough=(0.05, 0.12), scale=6.0, bump=0.002, grime=0.05)
    M['steel'] = mat_metal('Steel', base=(0.62, 0.62, 0.63), rough=(0.18, 0.3), scale=20.0, bump=0.002, grime=0.1)
    M['brass'] = mat_brass('DoorBrass', base=(0.74, 0.52, 0.24), rough=(0.2, 0.4), scale=8.0)
    M['plate'] = mat_engraved_brass('PlateBrass', w=0.20, h=0.06)
    M['door'] = mat_wood('DoorVeneer', light=(0.38, 0.25, 0.14), dark=(0.2, 0.12, 0.06), along='Z', scale=0.8,
                         rough=(0.35, 0.5), coat=0.15, lines=200.0)
    M['frame'] = mat_paint('DoorFrame', color=(0.30, 0.30, 0.29), rough=(0.3, 0.45), scale=3.0, wear=0.25,
                           edge_metal=(0.4, 0.4, 0.4))
    M['slat'] = mat_plastic('BlindSlat', (0.56, 0.54, 0.49), rough=0.4, tex=0.04, spec=0.5)
    M['cord'] = mat_principled('BlindCord', color=(0.45, 0.42, 0.36), rough=0.8)
    M['sill'] = mat_stone('WindowSill', base=(0.28, 0.27, 0.25), rough=(0.25, 0.4), speck=0.4, scale=4.0)
    M['alu'] = mat_metal('WinAlu', base=(0.45, 0.46, 0.47), rough=(0.3, 0.45), scale=3.0, grime=0.2)
    M['radiator'] = mat_paint('Radiator', color=(0.55, 0.54, 0.5), rough=(0.25, 0.4), scale=3.0, wear=0.1)
    M['paper'] = mat_paper('OfficePaper', color=(0.72, 0.71, 0.67))
    M['paper_white'] = mat_paper('DiamondPaperW', color=(0.80, 0.80, 0.78), rough=0.45)
    M['kraft'] = mat_paper('Kraft', color=(0.42, 0.30, 0.17), rough=0.75, sss=0.05)
    M['blotter'] = mat_leather('Blotter', color=(0.02, 0.03, 0.025), rough=(0.45, 0.65), grain=0.6, worn=0.15, bump=0.12)
    M['lamp_paint'] = mat_paint('LampPaint', color=(0.02, 0.022, 0.024), rough=(0.25, 0.4), scale=5.0, wear=0.2,
                                edge_metal=(0.5, 0.5, 0.5))
    M['lamp_inner'] = mat_principled('LampInner', color=(0.7, 0.68, 0.62), rough=0.4)
    M['lcd'] = mat_lcd_off('LcdOff')
    M['glass'] = mat_glass_clear('ClearGlass')
    M['black_lacquer'] = mat_principled('BlackLacquer', color=(0.01, 0.01, 0.011), rough=0.12, coat=0.6, coat_rough=0.05)
    M['gilt'] = mat_brass('Gilt', base=(0.85, 0.62, 0.3), rough=(0.12, 0.22), scale=30.0, worn=0.1)
    M['rubber'] = mat_rubber('Rubber')
    M['skirting'] = mat_plastic('Skirting', (0.06, 0.06, 0.062), rough=0.45, tex=0.05)
    return M


def build_blinds(M, coll, x0, x1, z0, z1, y, tilt=48.0, pitch=0.0215, seed=3):
    """Venetian blind: curved 25 mm slats (linked copies), head rail, bottom rail, ladder cords, tilt wand."""
    rng = random.Random(seed)
    L = x1 - x0
    bm = bmesh.new()
    nx, ny = 4, 7
    w = 0.025
    grid = []
    for i in range(nx + 1):
        row = []
        for j in range(ny + 1):
            yy = -w / 2 + w * j / ny
            zz = 0.0014 * (1 - (2 * yy / w) ** 2)
            row.append(bm.verts.new((-L / 2 + L * i / nx, yy, zz)))
        grid.append(row)
    for i in range(nx):
        for j in range(ny):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
    proto = ob('SlatProto', bm, [M['slat']], coll, smooth=60)
    solidify(proto, 0.0005, 0.0)
    apply_mods(proto)
    proto.location = (0, 0, -50)
    xc = (x0 + x1) / 2
    n = int((z1 - z0 - 0.05) / pitch)
    slats = []
    for k in range(n):
        z = z1 - 0.045 - k * pitch
        s_ = linked_copy(proto, f'Slat{k}', loc=(xc, y, z),
                         rot=(math.radians(tilt + rng.uniform(-1.6, 1.6)), rng.uniform(-0.004, 0.004), rng.uniform(-0.002, 0.002)))
        slats.append(s_)
    zb = z1 - 0.045 - n * pitch
    rbox('BlindBottom', (L, 0.026, 0.008), (xc, y, zb), M['slat'], bev=0.002)
    rbox('BlindHead', (L + 0.01, 0.05, 0.04), (xc, y, z1 - 0.02), M['slat'], bev=0.004)
    for xx in (x0 + 0.12, xc, x1 - 0.12):
        for dy in (-0.0125, 0.0125):
            c = rbox('Cord', (0.0012, 0.0012, z1 - zb - 0.03), (xx, y + dy, (z1 + zb) / 2 - 0.02), M['cord'], bev=0)
            no_shadow(c)
    wand = cyl('Wand', (x1 - 0.05, y - 0.03, z1 - 0.55), 0.004, 0.9, M['glass'], seg=12)
    no_shadow(wand)
    return slats


def build_task_chair(M, coll, loc, rot_z, seat_h=0.47):
    root = empty('TaskChair', loc, coll, size=0.2)
    parts = []
    for i in range(5):
        a = 2 * math.pi * i / 5 + 0.3
        bm = bmesh.new()
        path = [Vector((0.03 * math.cos(a), 0.03 * math.sin(a), 0.105)),
                Vector((0.17 * math.cos(a), 0.17 * math.sin(a), 0.085)),
                Vector((0.31 * math.cos(a), 0.31 * math.sin(a), 0.07))]
        sweep(bm, path, rrect(0.045, 0.03, 0.01, 2), mi=0)
        parts.append(ob(f'ChairLeg{i}', bm, [M['black_plastic']], coll, smooth=40))
        cx, cy = 0.30 * math.cos(a), 0.30 * math.sin(a)
        parts.append(cyl(f'Caster{i}', (cx, cy, 0.028), 0.027, 0.034, M['black_plastic'], rot=(math.pi / 2, 0, a + math.pi / 2),
                         seg=24, bev=0.006))
        parts.append(cyl(f'CasterStem{i}', (cx, cy, 0.06), 0.008, 0.03, M['chrome'], seg=12))
    parts.append(cyl('ChairHub', (0, 0, 0.1), 0.045, 0.06, M['black_plastic'], seg=32, bev=0.008))
    parts.append(cyl('GasLift', (0, 0, 0.22), 0.014, 0.22, M['chrome'], seg=24))
    parts.append(cyl('GasShroud', (0, 0, 0.27), 0.028, 0.16, M['black_plastic'], seg=24, r2=0.024))
    parts.append(rbox('Mech', (0.2, 0.22, 0.05), (0, 0, seat_h - 0.065), M['black_plastic'], bev=0.01))
    seat = rbox('Seat', (0.48, 0.46, 0.075), (0, 0, seat_h), M['chair_fab'], bev=0.03, seg=4)
    subsurf(seat, 1)
    shade(seat, True, 60)
    parts.append(seat)
    parts.append(rbox('SeatShell', (0.44, 0.42, 0.015), (0, 0, seat_h - 0.042), M['black_plastic'], bev=0.006))
    bm = bmesh.new()
    sweep(bm, [Vector((0, -0.12, seat_h - 0.05)), Vector((0, -0.25, seat_h - 0.03)), Vector((0, -0.29, seat_h + 0.12)),
               Vector((0, -0.30, seat_h + 0.22))], rrect(0.06, 0.016, 0.006, 2), mi=0)
    parts.append(ob('BackBar', bm, [M['black_plastic']], coll, smooth=40))
    back = rbox('Backrest', (0.44, 0.065, 0.46), (0, -0.315, seat_h + 0.42), M['chair_fab'], bev=0.028, seg=4,
                rot=(math.radians(-7), 0, 0))
    subsurf(back, 1)
    shade(back, True, 60)
    parts.append(back)
    for sx in (-1, 1):
        bm = bmesh.new()
        sweep(bm, [Vector((sx * 0.2, 0.0, seat_h - 0.04)), Vector((sx * 0.26, 0.0, seat_h - 0.02)),
                   Vector((sx * 0.265, 0.0, seat_h + 0.2))], rrect(0.04, 0.02, 0.007, 2), mi=0)
        parts.append(ob(f'ArmPost{sx}', bm, [M['black_plastic']], coll, smooth=40))
        parts.append(rbox(f'ArmPad{sx}', (0.075, 0.25, 0.03), (sx * 0.265, 0.03, seat_h + 0.215), M['black_plastic'],
                          bev=0.012, seg=3))
    for o in parts:
        parent(o, root, keep=False)
    root.rotation_euler.z = rot_z
    return root


def build_phone(M, coll, loc, rot_z):
    """Early-2000s office desk phone: wedge body, handset in the cradle, blank keys, coiled cord."""
    root = empty('Phone', loc, coll, size=0.05)
    root.rotation_euler.z = rot_z
    bm = bmesh.new()
    W, D = 0.19, 0.21
    prof = [(-D / 2, 0.0), (D / 2, 0.0), (D / 2, 0.075), (-D / 2 + 0.02, 0.032), (-D / 2, 0.026)]
    vs = []
    for x in (-W / 2, W / 2):
        vs.append([bm.verts.new((x, y, z)) for y, z in prof])
    n = len(prof)
    bm.faces.new(list(reversed(vs[0])))
    bm.faces.new(vs[1])
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((vs[0][i], vs[0][j], vs[1][j], vs[1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    body = ob('PhoneBody', bm, [M['grey_plastic']], coll)
    bevel(body, 0.006, 3, angle=30)
    parts = [body]
    slope = math.atan2(0.075 - 0.032, D - 0.02)
    for r in range(4):
        for c in range(3):
            y = -0.055 + r * 0.026
            z = 0.032 + (y + D / 2 - 0.02) * math.tan(slope) + 0.004
            k = rbox(f'Key{r}{c}', (0.02, 0.016, 0.006), (0.025 + c * 0.024, y, z), M['beige_plastic'], bev=0.0025, seg=2,
                     rot=(slope, 0, 0))
            parts.append(k)
    for r in range(3):
        y = -0.045 + r * 0.03
        z = 0.032 + (y + D / 2 - 0.02) * math.tan(slope) + 0.004
        parts.append(rbox(f'FKey{r}', (0.026, 0.012, 0.005), (-0.012, y, z), M['black_plastic'], bev=0.002, rot=(slope, 0, 0)))
    y = 0.07
    parts.append(rbox('PhoneLcd', (0.07, 0.03, 0.002), (0.045, y, 0.032 + (y + D / 2 - 0.02) * math.tan(slope) + 0.002),
                      M['lcd'], bev=0.001, rot=(slope, 0, 0)))
    # handset lying in the cradle along Y on the left
    zmid = 0.032 + (0.0 + D / 2 - 0.02) * math.tan(slope) + 0.004
    hs = empty('Handset', (-0.062, 0.0, zmid), coll, size=0.02)
    bm = bmesh.new()
    pth = spline([(0, -0.105, 0.0), (0, -0.06, 0.02), (0, 0.0, 0.026), (0, 0.06, 0.02), (0, 0.105, 0.0)], 6)
    sweep(bm, pth, rrect(0.05, 0.03, 0.012, 3), mi=0)
    h = ob('HandsetBar', bm, [M['grey_plastic']], coll, smooth=50)
    parts_h = [h]
    for yy in (-0.1, 0.1):
        cup = rbox('HCup', (0.056, 0.06, 0.03), (0, yy, 0.002), M['grey_plastic'], bev=0.013, seg=3)
        shade(cup, True, 50)
        parts_h.append(cup)
    for o in parts_h:
        parent(o, hs, keep=False)
    hs.rotation_euler.x = slope
    parent(hs, root, keep=False)
    # coiled cord: helix around a lazy path from the handset end to the body side
    base = spline([(-0.062, -0.13, 0.04), (-0.09, -0.16, 0.012), (-0.15, -0.12, 0.006), (-0.16, 0.0, 0.006),
                   (-0.11, 0.06, 0.008), (-0.097, 0.05, 0.02)], 16)
    pts = []
    turns_per_m = 260
    acc = 0.0
    for i in range(len(base) - 1):
        a, b = base[i], base[i + 1]
        seg_n = 10
        T = (b - a)
        ln = T.length
        T.normalize()
        N = T.cross(Vector((0, 0, 1)))
        if N.length < 1e-6:
            N = Vector((1, 0, 0))
        N.normalize()
        B = N.cross(T)
        for k in range(seg_n):
            t = k / seg_n
            ang = 2 * math.pi * turns_per_m * (acc + ln * t)
            pts.append(a + (b - a) * t + (N * math.cos(ang) + B * math.sin(ang)) * 0.0045)
        acc += ln
    bm = bmesh.new()
    sweep(bm, pts, [(0.0013 * math.cos(2 * math.pi * k / 6), 0.0013 * math.sin(2 * math.pi * k / 6)) for k in range(6)], mi=0)
    parts.append(ob('CoilCord', bm, [M['grey_plastic']], coll, smooth=60))
    for o in parts:
        parent(o, root, keep=False)
    return root


def build_balance(M, coll, loc, rot_z):
    """Desktop precision balance with a glass draft shield (reads as 'a scale' from across the room)."""
    root = empty('Balance', loc, coll, size=0.05)
    root.rotation_euler.z = rot_z
    parts = []
    parts.append(rbox('BalBody', (0.20, 0.30, 0.07), (0, 0, 0.035), M['beige_plastic'], bev=0.01, seg=3))
    bm = bmesh.new()
    pr = [(-0.15, 0.0), (-0.11, 0.0), (-0.11, 0.075), (-0.15, 0.055)]
    vs = [[bm.verts.new((x, y, z)) for y, z in pr] for x in (-0.095, 0.095)]
    bm.faces.new(list(reversed(vs[0])))
    bm.faces.new(vs[1])
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((vs[0][i], vs[0][j], vs[1][j], vs[1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    panel = ob('BalPanel', bm, [M['grey_plastic']], coll)
    bevel(panel, 0.004, 2)
    parts.append(panel)
    ang = math.atan2(0.02, 0.04)
    parts.append(rbox('BalLcd', (0.08, 0.022, 0.002), (0.0, -0.13, 0.066), M['lcd'], bev=0.001, rot=(-ang, 0, 0)))
    for i, xx in enumerate((-0.07, 0.07)):
        parts.append(cyl(f'BalBtn{i}', (xx, -0.13, 0.066), 0.006, 0.004, M['black_plastic'], rot=(-ang, 0, 0), seg=16))
    parts.append(cyl('BalPan', (0, 0.04, 0.083), 0.045, 0.003, M['steel'], seg=48, bev=0.001))
    parts.append(cyl('BalPost', (0, 0.04, 0.075), 0.008, 0.012, M['steel'], seg=16))
    # draft shield: glass box with aluminium edges
    S, H, yc = 0.17, 0.16, 0.04
    for sx, sy, w, d in ((-1, 0, 0.003, S), (1, 0, 0.003, S), (0, -1, S, 0.003), (0, 1, S, 0.003)):
        parts.append(rbox('Shield', (w, d, H), (sx * S / 2, yc + sy * S / 2, 0.07 + H / 2), M['glass'], bev=0))
    parts.append(rbox('ShieldTop', (S, S, 0.003), (0, yc, 0.07 + H), M['glass'], bev=0))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(rbox('ShieldPost', (0.008, 0.008, H), (sx * S / 2, yc + sy * S / 2, 0.07 + H / 2), M['alu'], bev=0.001))
    parts.append(rbox('ShieldHandle', (0.05, 0.008, 0.008), (0, yc - S / 2 - 0.005, 0.07 + H - 0.02), M['alu'], bev=0.002))
    for o in parts:
        parent(o, root, keep=False)
    return root


def build_desk_lamp(M, coll, loc, rot_z, on=False, energy=18.0):
    """Black articulated desk lamp; shade aims down-forward (local -Y). Returns (root, light or None)."""
    root = empty('DeskLamp', loc, coll, size=0.05)
    parts = [cyl('LampBase', (0, 0, 0.012), 0.08, 0.024, M['lamp_paint'], seg=48, bev=0.004)]
    j1 = Vector((0, 0.02, 0.03))
    j2 = Vector((0, 0.08, 0.40))
    j3 = Vector((0, -0.22, 0.47))
    for a, b, nm in ((j1, j2, 'Arm1'), (j2, j3, 'Arm2')):
        bm = bmesh.new()
        sweep(bm, [a, b], [(0.006 * math.cos(2 * math.pi * k / 10), 0.006 * math.sin(2 * math.pi * k / 10)) for k in range(10)])
        parts.append(ob('Lamp' + nm, bm, [M['lamp_paint']], coll, smooth=40))
    for j in (j1, j2):
        parts.append(cyl('LampJoint', tuple(j), 0.012, 0.022, M['lamp_paint'], rot=(0, math.pi / 2, 0), seg=16))
    # shade: open cone pointing along dirn
    dirn = Vector((0, -0.35, -1.0)).normalized()
    bm = bmesh.new()
    prof = [(0.018, 0.0), (0.03, 0.02), (0.062, 0.1), (0.078, 0.15), (0.0795, 0.152)]
    rings = []
    n = 40
    for r, a in prof:
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), -a)) for i in range(n)])
    for k in range(len(prof) - 1):
        for i in range(n):
            bm.faces.new((rings[k][i], rings[k][(i + 1) % n], rings[k + 1][(i + 1) % n], rings[k + 1][i]))
    bm.faces.new(list(reversed(rings[0])))
    shade_o = ob('LampShade', bm, [M['lamp_paint'], M['lamp_inner']], coll, smooth=50)
    solidify(shade_o, 0.0012, 1.0, mat_off=1)
    shade_o.location = j3
    shade_o.rotation_euler = (-dirn).to_track_quat('Z', 'Y').to_euler()
    parts.append(shade_o)
    bulb_pos = j3 + dirn * 0.06
    bulb = prim('sphere', 'Bulb', tuple(bulb_pos), seg=24, ring=12, r=0.024)
    if on:
        set_mat(bulb, mat_emission('BulbOn', kelvin(2700), 25.0))
    else:
        set_mat(bulb, mat_principled('BulbOff', color=(0.8, 0.8, 0.78), rough=0.25, transmission=0.6))
    parts.append(bulb)
    for o in parts:
        parent(o, root, keep=False)
    root.rotation_euler.z = rot_z
    L = None
    if on:
        bpy.context.view_layer.update()
        wp = root.matrix_world @ (bulb_pos + dirn * 0.03)
        L = light('POINT', 'LampLight', tuple(wp), energy=energy, color=kelvin(2700), radius=0.02)
    return root, L


def build_office(M, coll=None, door_angle=78.0, blinds_tilt=48.0, lamp_on=False, lamp_energy=18.0):
    """Room + corridor shell, door with nameplate, window with blinds, radiator, desk and props, empty chair.
    Returns dict of anchors."""
    o = OFF
    x0, x1, y1, H, t = o['x0'], o['x1'], o['y1'], o['H'], o['t']
    dx0, dx1, dh = o['door']
    wx0, wx1, wz0, wz1 = o['win']
    cx0, cx1, cy0 = o['cor']
    A = {}
    # floors / ceilings
    rbox('OfficeFloor', (x1 - x0, y1, 0.02), ((x0 + x1) / 2, y1 / 2, -0.01), M['carpet'], bev=0)
    rbox('CorFloor', (cx1 - cx0, -cy0 + t, 0.02), (0, (cy0 - t) / 2, -0.01), M['terrazzo'], bev=0)
    rbox('OfficeCeil', (x1 - x0, y1, 0.04), ((x0 + x1) / 2, y1 / 2, H + 0.02), M['ceiling'], bev=0)
    rbox('CorCeil', (cx1 - cx0, -cy0, 0.04), (0, cy0 / 2, o['cor_h'] + 0.02), M['ceiling'], bev=0)
    # front wall with the door opening (corridor face at y=-t)
    rbox('FrontL', (dx0 - cx0, t, H), ((dx0 + cx0) / 2, -t / 2, H / 2), M['wall_cor'], bev=0)
    rbox('FrontR', (cx1 - dx1, t, H), ((dx1 + cx1) / 2, -t / 2, H / 2), M['wall_cor'], bev=0)
    rbox('FrontTop', (dx1 - dx0, t, H - dh), ((dx0 + dx1) / 2, -t / 2, (H + dh) / 2), M['wall_cor'], bev=0)
    # room walls
    rbox('WallL', (0.15, y1 + 0.3, H), (x0 - 0.075, y1 / 2, H / 2), M['wall'], bev=0)
    rbox('WallR', (0.15, y1 + 0.3, H), (x1 + 0.075, y1 / 2, H / 2), M['wall'], bev=0)
    bt = 0.3
    rbox('BackLow', (x1 - x0, bt, wz0), ((x0 + x1) / 2, y1 + bt / 2, wz0 / 2), M['wall'], bev=0)
    rbox('BackHigh', (x1 - x0, bt, H - wz1), ((x0 + x1) / 2, y1 + bt / 2, (H + wz1) / 2), M['wall'], bev=0)
    rbox('BackL', (wx0 - x0, bt, wz1 - wz0), ((x0 + wx0) / 2, y1 + bt / 2, (wz0 + wz1) / 2), M['wall'], bev=0)
    rbox('BackR', (x1 - wx1, bt, wz1 - wz0), ((x1 + wx1) / 2, y1 + bt / 2, (wz0 + wz1) / 2), M['wall'], bev=0)
    # corridor walls
    rbox('CorBack', (cx1 - cx0, 0.15, o['cor_h']), (0, cy0 - 0.075, o['cor_h'] / 2), M['wall_cor'], bev=0)
    rbox('CorEndL', (0.15, -cy0, o['cor_h']), (cx0 - 0.075, cy0 / 2, o['cor_h'] / 2), M['wall_cor'], bev=0)
    rbox('CorEndR', (0.15, -cy0, o['cor_h']), (cx1 + 0.075, cy0 / 2, o['cor_h'] / 2), M['wall_cor'], bev=0)
    # skirting
    rbox('SkirtCorL', (dx0 - cx0, 0.012, 0.08), ((dx0 + cx0) / 2, -t - 0.006, 0.04), M['skirting'], bev=0.002)
    rbox('SkirtCorR', (cx1 - dx1, 0.012, 0.08), ((dx1 + cx1) / 2, -t - 0.006, 0.04), M['skirting'], bev=0.002)
    rbox('SkirtBack', (x1 - x0, 0.012, 0.08), ((x0 + x1) / 2, y1 - 0.006, 0.04), M['skirting'], bev=0.002)
    rbox('SkirtL', (0.012, y1, 0.08), (x0 + 0.006, y1 / 2, 0.04), M['skirting'], bev=0.002)
    rbox('SkirtR', (0.012, y1, 0.08), (x1 - 0.006, y1 / 2, 0.04), M['skirting'], bev=0.002)
    # door frame (steel, painted) on both faces + door leaf hinged on the right jamb, open into the room
    fw = 0.05
    for nm, sz, lc in (('JambL', (fw, t + 0.03, dh + fw), (dx0 - fw / 2 + 0.01, -t / 2, (dh + fw) / 2)),
                       ('JambR', (fw, t + 0.03, dh + fw), (dx1 + fw / 2 - 0.01, -t / 2, (dh + fw) / 2)),
                       ('Head', (dx1 - dx0 + 2 * fw - 0.02, t + 0.03, fw), ((dx0 + dx1) / 2, -t / 2, dh + fw / 2 - 0.01))):
        rbox('Frame' + nm, sz, lc, M['frame'], bev=0.004)
    piv = empty('DoorPivot', (dx1 - 0.012, 0.012, 0.0), coll, size=0.1)
    DW, DT = dx1 - dx0 - 0.03, 0.042
    leaf = rbox('DoorLeaf', (DW, DT, dh - 0.012), (-DW / 2, DT / 2, (dh - 0.012) / 2 + 0.006), M['door'], bev=0.003)
    parent(leaf, piv, keep=False)
    plate = rbox('Nameplate', (0.20, 0.004, 0.06), (-DW / 2, -0.002, 1.56), M['plate'], bev=0.0012, seg=2)
    parent(plate, piv, keep=False)
    for sx in (-1, 1):
        sc_ = cyl('PlateScrew', (-DW / 2 + sx * 0.088, -0.0045, 1.56), 0.0028, 0.0018, M['brass'],
                  rot=(math.pi / 2, 0, 0), seg=16)
        parent(sc_, piv, keep=False)
    for face, yy in (('out', -0.002), ('in', DT + 0.002)):
        sgn = -1 if face == 'out' else 1
        ro = cyl('Rose' + face, (-DW + 0.065, yy + sgn * 0.004, 1.02), 0.026, 0.008, M['chrome'], rot=(math.pi / 2, 0, 0), seg=32,
                 bev=0.002)
        parent(ro, piv, keep=False)
        bm = bmesh.new()
        pth = [Vector((-DW + 0.065, yy + sgn * 0.008, 1.02)), Vector((-DW + 0.065, yy + sgn * 0.05, 1.02)),
               Vector((-DW + 0.08, yy + sgn * 0.062, 1.02)), Vector((-DW + 0.19, yy + sgn * 0.065, 1.02))]
        sweep(bm, spline(pth, 4), rrect(0.02, 0.012, 0.005, 2), mi=0)
        lv = ob('Lever' + face, bm, [M['chrome']], coll, smooth=40)
        parent(lv, piv, keep=False)
        es = rbox('Escut' + face, (0.03, 0.006, 0.07), (-DW + 0.065, yy + sgn * 0.003, 0.88), M['chrome'], bev=0.003)
        parent(es, piv, keep=False)
    for z in (0.25, 1.0, 1.8):
        hg = cyl('Hinge', (0.004, DT / 2, z), 0.007, 0.1, M['steel'], seg=16)
        parent(hg, piv, keep=False)
    piv.rotation_euler.z = -math.radians(door_angle)
    A['plate'] = plate
    A['door_pivot'] = piv
    # window: aluminium frame, mullions, sill, radiator, blinds, exterior
    fy = y1 + 0.16
    for nm, sz, lc in (('WinFrameB', (wx1 - wx0, 0.07, 0.05), ((wx0 + wx1) / 2, fy, wz0 + 0.025)),
                       ('WinFrameT', (wx1 - wx0, 0.07, 0.05), ((wx0 + wx1) / 2, fy, wz1 - 0.025)),
                       ('WinFrameL', (0.05, 0.07, wz1 - wz0), (wx0 + 0.025, fy, (wz0 + wz1) / 2)),
                       ('WinFrameR', (0.05, 0.07, wz1 - wz0), (wx1 - 0.025, fy, (wz0 + wz1) / 2)),
                       ('WinMull', (0.06, 0.07, wz1 - wz0), ((wx0 + wx1) / 2, fy, (wz0 + wz1) / 2)),
                       ('WinTransom', (wx1 - wx0, 0.06, 0.05), ((wx0 + wx1) / 2, fy, wz1 - 0.42))):
        rbox(nm, sz, lc, M['alu'], bev=0.004)
    rbox('Sill', (wx1 - wx0 + 0.1, 0.22, 0.03), ((wx0 + wx1) / 2, y1 + 0.06, wz0 - 0.015), M['sill'], bev=0.004)
    # radiator under the window
    rad_w = 1.5
    rad = rbox('Radiator', (rad_w, 0.08, 0.5), ((wx0 + wx1) / 2, y1 - 0.06, 0.38), M['radiator'], bev=0.006)
    for k in range(int(rad_w / 0.05)):
        rbox('RadFin', (0.012, 0.006, 0.46), ((wx0 + wx1) / 2 - rad_w / 2 + 0.025 + k * 0.05, y1 - 0.102, 0.38), M['radiator'],
             bev=0.002)
    A['slats'] = build_blinds(M, coll, wx0 - 0.04, wx1 + 0.04, wz0 + 0.0, wz1 + 0.05, y1 - 0.03, tilt=blinds_tilt)
    # desk (front faces the door / camera, -Y)
    DX, DY, DZ = -0.38, 2.85, 0.74
    W, D = 1.55, 0.78
    rbox('DeskTop', (W, D, 0.028), (DX, DY, DZ - 0.014), M['desk_top'], bev=0.003)
    rbox('DeskEdgeF', (W + 0.002, 0.004, 0.03), (DX, DY - D / 2 - 0.001, DZ - 0.014), M['desk_edge'], bev=0.0015)
    for sx in (-1, 1):
        rbox('DeskSide', (0.025, D - 0.04, DZ - 0.028), (DX + sx * (W / 2 - 0.05), DY, (DZ - 0.028) / 2), M['desk_body'], bev=0.003)
    rbox('Modesty', (W - 0.12, 0.018, 0.42), (DX, DY - D / 2 + 0.09, DZ - 0.25), M['desk_body'], bev=0.003)
    # drawer pedestal on the right (from the sitter: left) side
    px = DX + W / 2 - 0.27
    rbox('Pedestal', (0.42, D - 0.1, DZ - 0.06), (px, DY - 0.02, (DZ - 0.06) / 2 + 0.02), M['desk_body'], bev=0.004)
    for k, (z0_, h_) in enumerate(((0.04, 0.27), (0.33, 0.17), (0.52, 0.13))):
        rbox(f'DrawerF{k}', (0.405, 0.016, h_ - 0.008), (px, DY - D / 2 + 0.045, z0_ + h_ / 2), M['desk_body'], bev=0.003)
        rbox(f'DrawerH{k}', (0.11, 0.012, 0.012), (px, DY - D / 2 + 0.034, z0_ + h_ - 0.035), M['alu'], bev=0.003)
    top = DZ
    A['desk'] = (DX, DY, DZ)
    # props on the desk
    rbox('Blotter', (0.56, 0.4, 0.004), (DX - 0.12, DY - 0.08, top + 0.002), M['blotter'], bev=0.0015)
    build_balance(M, coll, (DX - 0.56, DY + 0.08, top), math.radians(18))
    build_phone(M, coll, (DX + 0.48, DY - 0.08, top), math.radians(-24))
    lamp, LL = build_desk_lamp(M, coll, (DX + 0.6, DY + 0.27, top), math.radians(-32), on=lamp_on, energy=lamp_energy)
    A['lamp_light'] = LL
    for k in range(5):
        rbox(f'Paper{k}', (0.21, 0.297, 0.0004), (DX + 0.17 + k * 0.002, DY + 0.16 - k * 0.003, top + 0.0003 + k * 0.0005),
             M['paper'], bev=0, rot=(0, 0, math.radians(-6 + k * 2.2)))
    rbox('Folder', (0.235, 0.31, 0.003), (DX + 0.17, DY + 0.18, top - 0.0005), M['kraft'], bev=0.0008, rot=(0, 0, math.radians(-9)))
    for k in range(3):
        build_closed_parcel(f'DeskParcel{k}', (DX - 0.21 + 0.004 * k, DY - 0.15 - 0.002 * k, top + 0.004 + 0.0034 * k),
                            math.radians(12 + 7 * k), M, coll, seed=k + 3)
    build_pen('DeskPen', (DX - 0.02, DY - 0.17, top + 0.004), math.radians(70), M, coll)
    A['chair'] = build_task_chair(M, coll, (DX - 0.12, DY + 0.68, 0.0), math.radians(200))
    # grey filing cabinet against the right wall
    rbox('Cabinet', (0.47, 0.62, 0.72), (x0 + 0.26, 1.9, 0.36), M['metal_grey'], bev=0.005)
    for k in range(2):
        rbox('CabDrawer', (0.008, 0.56, 0.32), (x0 + 0.497, 1.9, 0.18 + k * 0.36), M['metal_grey'], bev=0.003)
        rbox('CabHandle', (0.02, 0.12, 0.02), (x0 + 0.51, 1.9, 0.3 + k * 0.36), M['alu'], bev=0.004)
    # coat stand by the left wall (silhouette depth)
    cyl('CoatPole', (x0 + 0.35, 3.6, 0.88), 0.016, 1.76, M['lamp_paint'], seg=16)
    cyl('CoatBase', (x0 + 0.35, 3.6, 0.015), 0.2, 0.03, M['lamp_paint'], seg=32, bev=0.004)
    for k in range(4):
        a = k * math.pi / 2 + 0.4
        bm = bmesh.new()
        sweep(bm, spline([(0, 0, 1.68), (0.06 * math.cos(a), 0.06 * math.sin(a), 1.74), (0.11 * math.cos(a), 0.11 * math.sin(a), 1.80)], 4),
              [(0.007 * math.cos(2 * math.pi * j / 8), 0.007 * math.sin(2 * math.pi * j / 8)) for j in range(8)])
        hk = ob('CoatHook', bm, [M['lamp_paint']], coll, smooth=40)
        hk.location = (x0 + 0.35, 3.6, 0)
    # ceiling troffer (off)
    rbox('Troffer', (0.6, 1.2, 0.02), (DX, 2.2, H - 0.008), M['alu'], bev=0.002)
    rbox('TrofferLens', (0.56, 1.16, 0.004), (DX, 2.2, H - 0.019), mat_principled('Diffuser', color=(0.6, 0.6, 0.6), rough=0.3,
                                                                                         transmission=0.5), bev=0)
    return A


# ============================================================================ S05: the dealer's table

def table_mats():
    M = office_mats()
    M['desk_dark'] = mat_wood('DealerDesk', light=(0.16, 0.085, 0.04), dark=(0.05, 0.025, 0.012), along='X', scale=2.5,
                              rough=(0.3, 0.5), coat=0.45, coat_rough=0.1, lines=520.0)
    M['pad'] = mat_leather('DeskPad', color=(0.012, 0.012, 0.013), rough=(0.4, 0.62), grain=1.2, worn=0.2, bump=0.15)
    M['liner'] = mat_paper('Liner', color=(0.33, 0.48, 0.70), rough=0.7, sss=0.0, fiber=0.05, scale=1.6)
    M['paper_white'] = mat_paper('DiamondPaperW', color=(0.80, 0.80, 0.78), rough=0.45, sss=0.0)
    M['stone'] = mat_rough_diamond('RoughDiamond')
    M['polished'] = mat_principled('Polished', color=(1.0, 1.0, 1.0), rough=0.01, transmission=1.0, ior=2.42)
    M['steel_brushed'] = mat_metal('BrushedSteel', base=(0.66, 0.66, 0.67), rough=(0.16, 0.26), scale=30.0, bump=0.001,
                                   aniso=0.5, brushed=(1.0, 40.0, 40.0), grime=0.08, scratches=0.4)
    M['loupe_glass'] = mat_principled('LoupeGlass', color=(0.96, 0.98, 0.97), rough=0.0, transmission=1.0, ior=1.6)
    M['knurl'] = mat_metal('Knurl', base=(0.7, 0.7, 0.72), rough=(0.12, 0.22), scale=40.0, bump=0.01, grime=0.15)
    return M


def build_open_parcel(name, loc, rot_z, M, coll=None, c=0.090, e=0.040, a=0.046, side_open=(11.0, 19.0),
                      end_open=(26.0, 15.0), res=0.0012, seed=2):
    """Diamond paper opened: the centre panel flat (blue liner up), side flaps and end flaps lifted at different
    angles with crease memory and light crumple. Top surface = liner (slot 0), underside = white paper (slot 1)."""
    L, W = c + 2 * e, 3 * a
    nu, nv = int(L / res), int(W / res)
    sd = Vector((seed * 1.3, seed * 2.1, 0.7))
    bm = bmesh.new()
    verts = []
    for i in range(nu + 1):
        u = -L / 2 + L * i / nu
        row = []
        for j in range(nv + 1):
            v = -W / 2 + W * j / nv
            x, y, z = u, v, 0.0
            # side flaps: rotate about v = +-a/2 (lift), with crease memory (curl near the fold)
            if abs(v) > a / 2:
                sg = 1 if v > 0 else -1
                d = abs(v) - a / 2
                ang = math.radians(side_open[0 if sg > 0 else 1]) * (1 + 0.5 * min(1.0, d / a)) - 0.12 * max(0.0, d / a - 0.6)
                y = sg * (a / 2 + d * math.cos(ang))
                z = d * math.sin(ang)
            # end flaps: rotate the (x, z) about u = +-c/2
            if abs(u) > c / 2:
                sg = 1 if u > 0 else -1
                d = abs(u) - c / 2
                ang = math.radians(end_open[0 if sg > 0 else 1]) * (1 + 0.3 * min(1.0, d / e))
                x = sg * (c / 2 + d * math.cos(ang) - z * math.sin(ang))
                z = d * math.sin(ang) + z * math.cos(ang)
            # centre panel sags slightly into a shallow valley; crumple
            cv = max(0.0, 1 - (abs(v) / (a / 2)) ** 2) * max(0.0, 1 - (abs(u) / (c / 2)) ** 4)
            z += -0.00025 * cv
            # crease memory: a soft ridge along each fold line (the paper was folded the other way)
            for dd in (abs(abs(v) - a / 2), abs(abs(u) - c / 2) if abs(v) <= a / 2 + 0.002 else 1.0):
                z += 0.00035 * math.exp(-(dd / 0.0012) ** 2)
            p = Vector((u, v, 0)) * 60.0 + sd
            z += 0.00025 * (1 + mnoise.noise(p)) + 0.0001 * mnoise.noise(p * 3.1)
            row.append(bm.verts.new((x, y, z + 0.00045)))
        verts.append(row)
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((verts[i][j], verts[i + 1][j], verts[i + 1][j + 1], verts[i][j + 1]))
    o = ob(name, bm, [M['liner'], M['paper_white']], coll, smooth=None)
    for p_ in o.data.polygons:
        p_.use_smooth = True
    sm = solidify(o, 0.00035, -1.0, mat_off=1, rim_off=1)
    sm.use_even_offset = False
    o.location = loc
    o.rotation_euler.z = rot_z
    return o


def build_loupe(name, loc, rot_z, M, coll=None, open_angle=150.0):
    """Folding 10x loupe lying flat: black case plate + chrome-banded barrel swung out, lens facing up."""
    root = empty(name, loc, coll, size=0.02)
    root.rotation_euler.z = rot_z
    parts = []
    bm = bmesh.new()
    outline = []
    for k in range(48):
        t = 2 * math.pi * k / 48
        r = 0.0175 * (1 + 0.18 * max(0.0, math.cos(t)) ** 2)
        outline.append((r * math.cos(t) + 0.004 * max(0.0, math.cos(t)), r * math.sin(t)))
    case = extrude_profile(name + 'Case', outline, 0.0042)
    set_mat(case, M['black_plastic'])
    bevel(case, 0.0012, 2, angle=30)
    parts.append(case)
    piv = empty(name + 'Pivot', (0.022, 0.0, 0.0), coll, size=0.005)
    barrel = cyl(name + 'Barrel', (-0.022, 0.0, 0.0072), 0.0135, 0.0105, M['black_plastic'], seg=48, bev=0.0008)
    band = cyl(name + 'Band', (-0.022, 0.0, 0.0072), 0.0139, 0.006, M['knurl'], seg=48)
    lens = prim('sphere', name + 'Lens', (-0.022, 0.0, 0.0115), seg=40, ring=20, r=0.0108)
    lens.scale = (1.0, 1.0, 0.22)
    set_mat(lens, M['loupe_glass'])
    arm = rbox(name + 'Arm', (0.012, 0.009, 0.003), (-0.006, 0.0, 0.0035), M['black_plastic'], bev=0.001)
    for p_ in (barrel, band, lens, arm):
        parent(p_, piv, keep=False)
    piv.rotation_euler.z = math.radians(180 - open_angle)
    parent(piv, root, keep=False)
    cyl(name + 'Rivet', (0.022, 0.0, 0.0046), 0.0022, 0.001, M['knurl'], seg=16)
    for p_ in parts:
        parent(p_, root, keep=False)
    return root


def build_table(M, coll=None, seed=5):
    """Dealer's table tableau. Returns anchors (subject point etc.)."""
    rng = random.Random(seed)
    A = {}
    rbox('Desk', (1.6, 1.0, 0.04), (0.1, 0.25, -0.02), M['desk_dark'], bev=0.003)
    rbox('Pad', (0.62, 0.46, 0.003), (0.02, 0.02, 0.0015), M['pad'], bev=0.0012)
    z0 = 0.003
    rot = math.radians(-11)
    par = build_open_parcel('OpenParcel', (0.0, 0.0, z0), rot, M, coll)
    A['parcel'] = par
    # stones in the centre valley of the parcel + a few on the pad
    R = Matrix.Rotation(rot, 3, 'Z')
    spots = [(-0.006, 0.002, 0.0031), (0.005, -0.005, 0.0025), (0.013, 0.007, 0.0021), (-0.016, -0.008, 0.0019),
             (0.001, 0.013, 0.0017), (-0.024, 0.009, 0.0024), (0.021, -0.012, 0.0016), (0.028, 0.004, 0.002),
             (-0.003, -0.017, 0.0015), (0.015, 0.019, 0.0013), (-0.013, 0.017, 0.0014)]
    # surface heights first (ray casts onto the parcel / pad), then drop each stone so its lowest point rests there
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    sc = bpy.context.scene

    def surf(x, y, r):
        zs = []
        for dx, dy in ((0, 0), (r, 0), (-r, 0), (0, r), (0, -r), (0.7 * r, 0.7 * r), (-0.7 * r, -0.7 * r)):
            hit, loc_, *_ = sc.ray_cast(dg, Vector((x + dx, y + dy, 0.3)), Vector((0, 0, -1)))
            zs.append(loc_.z if hit else z0)
        return max(zs)

    items = []
    for k, (u, v, s_) in enumerate(spots):
        p = R @ Vector((u, v, 0))
        items.append(('rough', f'Stone{k}', p.x, p.y, s_ * 1.25, 40 + k))
    for k, (u, v, r_) in enumerate(((0.0085, 0.0025, 0.0019), (-0.010, 0.011, 0.0015))):
        p = R @ Vector((u, v, 0))
        items.append(('pol', f'Polished{k}', p.x, p.y, r_, 60 + k))
    for k, (x, y, s_) in enumerate(((0.088, 0.012, 0.0022), (0.099, 0.026, 0.0016), (0.079, -0.006, 0.0014))):
        items.append(('rough', f'Spill{k}', x, y, s_ * 1.25, 80 + k))
    heights = [surf(x, y, s_ * 0.9) for _, _, x, y, s_, _ in items]
    for (kind, nm, x, y, s_, sd), zs in zip(items, heights):
        if kind == 'rough':
            o = rough_stone(nm, (x, y, zs), s_, M['stone'], coll, seed=sd)
        else:
            o = brilliant(nm, (x, y, zs), s_, M['polished'], coll,
                          rot=(math.radians(rng.uniform(70, 100)), 0, rng.uniform(0, 6)))
        Rm = o.rotation_euler.to_matrix()
        zmin = min((Rm @ v.co).z for v in o.data.vertices)
        o.location.z = zs - zmin + 0.00002
    A['subject'] = Vector((0.0, 0.0, z0 + 0.002))
    build_tweezers('Tweezers', (0.178, -0.118, z0), math.radians(119), M, coll)
    build_loupe('Loupe', (-0.112, -0.055, z0), math.radians(25), M, coll)
    build_carat_scale('PocketScale', (0.118, 0.142, z0), math.radians(-20), M, coll, lid_angle=108)
    build_pen('Pen', (-0.085, -0.142, z0), math.radians(17), M, coll)
    for k in range(3):
        build_closed_parcel(f'Parcel{k}', (-0.095 + 0.003 * k, 0.12 + 0.004 * k, z0 + 0.0032 * k),
                            math.radians(-14 + 9 * k), M, coll, seed=10 + k)
    build_closed_parcel('ParcelLone', (0.03, 0.135, z0), math.radians(8), M, coll, seed=21)
    return A


# ============================================================================ S11: the shoulder bag

def bag_mats():
    M = {}
    M['canvas'] = mat_weave('Canvas', (0.085, 0.075, 0.04), period=0.0009, axes=('X', 'Z'), rough=0.84, bump=0.6,
                            sheen=0.3, slub=0.45, var=0.35)
    M['strap_web'] = mat_weave('Webbing', (0.07, 0.06, 0.032), period=0.0007, axes=('X', 'Y'), rough=0.85, bump=0.6,
                               sheen=0.25, var=0.2)
    M['leather'] = mat_leather('BagLeather', color=(0.034, 0.015, 0.0065), rough=(0.3, 0.6), grain=1.3, worn=0.8, bump=0.4)
    M['thread'] = mat_principled('Thread', color=(0.20, 0.155, 0.095), rough=0.6, spec=0.3)
    p = principled(M['thread'])
    p.inputs['Sheen Weight'].default_value = 0.4
    M['brass'] = mat_brass('BuckleBrass', base=(0.62, 0.44, 0.2), dark=(0.28, 0.17, 0.06), rough=(0.25, 0.45), scale=60.0,
                           worn=0.6)
    M['lens_glass'] = mat_principled('PinholeGlass', color=(0.004, 0.004, 0.005), rough=0.015, coat=1.0, coat_rough=0.01)
    try:
        principled(M['lens_glass']).inputs['Thin Film Thickness'].default_value = 320.0
    except Exception:
        pass
    M['bezel'] = mat_metal('Bezel', base=(0.05, 0.05, 0.055), rough=(0.2, 0.35), scale=200.0, bump=0.002, grime=0.3)
    M['seat_wood'] = mat_wood('ChairBeech', light=(0.45, 0.30, 0.17), dark=(0.28, 0.17, 0.08), along='X', scale=2.0,
                              rough=(0.35, 0.55), coat=0.2, coat_rough=0.25, lines=420.0, wear=0.6)
    M['wall'] = mat_wall('BagWall', color=(0.35, 0.34, 0.31))
    M['floor'] = mat_carpet('BagCarpet', color=(0.05, 0.055, 0.062))
    return M


def _rr_path(x0, x1, z0, z1, r, n=6):
    """Open path along left side (top->bottom), bottom, right side (bottom->top) of a rect with rounded bottom
    corners, CCW so sweep normals point inward."""
    pts = [Vector((x0, 0, z1))]
    for k in range(1, 6):
        pts.append(Vector((x0, 0, z1 - (z1 - z0 - r) * k / 6)))
    for k in range(n + 1):
        a = math.pi + (math.pi / 2) * k / n
        pts.append(Vector((x0 + r + r * math.cos(a), 0, z0 + r + r * math.sin(a))))
    for k in range(1, 12):
        pts.append(Vector((x0 + r + (x1 - x0 - 2 * r) * k / 12, 0, z0)))
    for k in range(n + 1):
        a = 1.5 * math.pi + (math.pi / 2) * k / n
        pts.append(Vector((x1 - r + r * math.cos(a), 0, z0 + r + r * math.sin(a))))
    for k in range(1, 7):
        pts.append(Vector((x1, 0, z0 + r + (z1 - z0 - r) * k / 6)))
    return pts


def _resample(path, step):
    out = [path[0].copy()]
    acc = 0.0
    for a, b in zip(path[:-1], path[1:]):
        seg = (b - a).length
        d = step - acc
        while d <= seg:
            out.append(a + (b - a) * (d / seg))
            d += step
        acc = seg - (d - step)
    return out


def stitch_row(name, pts, normal, M, coll=None, length=0.0034, gap=0.0009, lift=0.0, seed=0, skip=()):
    """Stitches along a polyline lying on a surface with outward `normal` (constant). Linked copies of one capsule."""
    rng = random.Random(seed)
    proto_name = 'StitchProto'
    proto = bpy.data.objects.get(proto_name)
    if proto is None:
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=6, radius=0.5)
        for v in bm.verts:
            v.co = Vector((v.co.x * 1.0, v.co.y * 0.2, v.co.z * 0.16))
        proto = from_bmesh(proto_name, bm, coll, smooth=True)
        set_mat(proto, M['thread'])
        proto.location = (0, 0, -50)
    Nn = Vector(normal).normalized()
    out = []
    pts = _resample(pts, length + gap)
    for k, P in enumerate(pts[:-1]):
        if k in skip:
            continue
        Q = pts[k + 1]
        T = (Q - P)
        if T.length < 1e-6:
            continue
        T.normalize()
        Bv = Nn.cross(T)
        mat3 = Matrix((T, Bv, Nn)).transposed()
        c = linked_copy(proto, f'{name}{k}', coll=coll)
        c.matrix_world = Matrix.Translation(P + T * (length + gap) * 0.5 + Nn * (lift - 0.00005)) @ mat3.to_4x4() @ \
            Matrix.Diagonal((length * rng.uniform(0.92, 1.05), 0.0042, 0.0042, 1.0))
        out.append(c)
    return out


def build_bag(M, coll=None):
    """Messenger bag sitting on a wooden chair seat (seat top at z=0, bag front face at y~0, facing -Y).
    Returns anchors incl. the lens position."""
    A = {}
    # chair: seat, back posts and rail, legs
    rbox('ChairSeat', (0.44, 0.42, 0.024), (0.0, 0.08, -0.012), M['seat_wood'], bev=0.006, seg=3)
    for sx in (-1, 1):
        rbox('ChairPost', (0.034, 0.03, 0.46), (sx * 0.19, 0.27, 0.23), M['seat_wood'], bev=0.006, seg=3,
             rot=(math.radians(-6), 0, 0))
        rbox('ChairLeg', (0.034, 0.034, 0.45), (sx * 0.19, -0.11, -0.25), M['seat_wood'], bev=0.006, seg=3)
    rbox('ChairRail', (0.42, 0.022, 0.09), (0.0, 0.295, 0.40), M['seat_wood'], bev=0.006, seg=3, rot=(math.radians(-6), 0, 0))
    rbox('Floor', (4, 4, 0.02), (0, 0.5, -0.47), M['floor'], bev=0)
    rbox('BackWall', (4, 0.1, 3), (0, 1.6, 1.0), M['wall'], bev=0)
    # bag body: rounded box with soft sag
    BW, BD, BH = 0.33, 0.095, 0.245
    body = rbox('BagBody', (BW, BD, BH), (0.0, BD / 2 + 0.002, BH / 2), M['canvas'], bev=0.022, seg=4)
    apply_mods(body)
    me = body.data
    sd = Vector((3.1, 1.7, 0.4))
    for v in me.vertices:
        p = v.co
        k = 1 - (p.z / (BH / 2)) ** 2 if abs(p.z) < BH / 2 else 0
        v.co.y += -0.006 * max(0.0, 1 - (p.x / (BW / 2)) ** 2) * k * (1 if p.y < 0 else -0.3)
        v.co += Vector((0, 1, 0)) * 0.0015 * mnoise.noise(p * 30 + sd)
        if p.z < -BH / 2 + 0.01:
            v.co.z = max(v.co.z, -BH / 2 + 0.001)
    subsurf(body, 1)
    shade(body, True, 70)
    # flap: front panel with rounded bottom corners, slight bulge, 3 mm thick, binding + stitches
    fx0, fx1, fz0, fz1, fr = -0.164, 0.164, 0.09, 0.252, 0.032
    fy = -0.0075
    res = 0.002
    nx, nz = int((fx1 - fx0) / res), int((fz1 - fz0) / res)
    bm = bmesh.new()
    grid = {}

    def inside(x, z):
        if z < fz0 + fr:
            if x < fx0 + fr:
                return (x - fx0 - fr) ** 2 + (z - fz0 - fr) ** 2 <= fr * fr
            if x > fx1 - fr:
                return (x - fx1 + fr) ** 2 + (z - fz0 - fr) ** 2 <= fr * fr
        return fx0 <= x <= fx1 and fz0 <= z <= fz1

    def fy_at(x, z):
        return fy - 0.0055 * max(0.0, 1 - (x / 0.17) ** 2) * min(1.0, (z - fz0) / 0.05 + 0.3) \
            + 0.0009 * mnoise.noise(Vector((x * 40, z * 40, 2.2)))

    for i in range(nx + 1):
        for j in range(nz + 1):
            x, z = fx0 + (fx1 - fx0) * i / nx, fz0 + (fz1 - fz0) * j / nz
            grid[i, j] = bm.verts.new((x, fy_at(x, z), z))
    for i in range(nx):
        for j in range(nz):
            cx, cz = fx0 + (fx1 - fx0) * (i + 0.5) / nx, fz0 + (fz1 - fz0) * (j + 0.5) / nz
            if inside(cx, cz):
                bm.faces.new((grid[i, j], grid[i, j + 1], grid[i + 1, j + 1], grid[i + 1, j]))
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
    flap = ob('Flap', bm, [M['canvas']], coll, smooth=60)
    solidify(flap, 0.003, 1.0)
    # flap top roll over the bag top
    bm = bmesh.new()
    arc = [Vector((0, fy_at(0, fz1) + 0.0, fz1))] + [Vector((0, 0.05 - 0.058 * math.cos(math.pi / 2 * k / 6),
                                                            BH + 0.004 + 0.007 * math.sin(math.pi / 2 * k / 6))) for k in range(7)]
    rings = []
    for xx in (fx0, fx1):
        rings.append([bm.verts.new((xx, p.y, p.z)) for p in arc])
    for k in range(len(arc) - 1):
        bm.faces.new((rings[0][k], rings[0][k + 1], rings[1][k + 1], rings[1][k]))
    roll = ob('FlapRoll', bm, [M['canvas']], coll, smooth=60)
    solidify(roll, 0.003, 1.0)
    # leather binding around the flap edge
    path = _rr_path(fx0, fx1, fz0, fz1, fr)
    path3 = [Vector((p.x, fy_at(p.x, max(fz0, p.z)) - 0.0005, p.z)) for p in path]
    bm = bmesh.new()
    sec = [(a, b) for a, b in rrect(0.011, 0.0068, 0.0025, 3, cx=0.0035, cy=0.0005)]
    sweep(bm, path3, sec, up=(0, 1, 0), mi=0, cap=True)
    ob('Binding', bm, [M['leather']], coll, smooth=50)
    inset = [Vector((p.x, p.y - 0.0035, p.z)) for p in _rr_path(fx0 + 0.0055, fx1 - 0.0055, fz0 + 0.0055, fz1 - 0.004, fr - 0.0055)]
    inset = [Vector((p.x, fy_at(p.x, max(fz0, p.z)) - 0.0039, p.z)) for p in inset]
    stitch_row('BindStitch', inset, (0, -1, 0), M, coll, seed=1)
    # front strap with buckle; box-X stitch at its top holds the pinhole lens
    sx = -0.072
    sw, st_ = 0.024, 0.0032
    top_z, bot_z = 0.245, 0.035
    bm = bmesh.new()
    pts = []
    for k in range(40):
        z = top_z - (top_z - bot_z) * k / 39
        if z >= fz0 - 0.004:
            y = fy_at(sx, max(fz0, z)) - 0.0018
        else:
            y = 0.002 - 0.006 * max(0.0, 1 - (sx / 0.165) ** 2) * (1 - ((z - BH / 2) / (BH / 2)) ** 2) - 0.0019
        if fz0 - 0.012 < z < fz0 + 0.004:
            y -= 0.0035 * math.sin(math.pi * (z - fz0 + 0.012) / 0.016)
        pts.append(Vector((sx, y, z)))
    sweep(bm, pts, rrect(sw, st_, 0.0012, 2), up=(0, -1, 0), mi=0)
    strap = ob('FrontStrap', bm, [M['leather']], coll, smooth=50)
    strap_y = lambda z: min(pts, key=lambda p: abs(p.z - z)).y
    # buckle on the lower body
    bz = 0.066
    bm = bmesh.new()
    pth = [Vector((sx + a, strap_y(bz) - 0.0035, bz + b)) for a, b in rrect(0.03, 0.026, 0.004, 3)]
    sweep(bm, pth, [(0.0013 * math.cos(2 * math.pi * k / 8), 0.0013 * math.sin(2 * math.pi * k / 8)) for k in range(8)],
          up=(0, -1, 0), closed=True)
    pth = [Vector((sx, strap_y(bz) - 0.004, bz - 0.012)), Vector((sx, strap_y(bz) - 0.0045, bz + 0.012))]
    sweep(bm, pth, [(0.0009 * math.cos(2 * math.pi * k / 8), 0.0009 * math.sin(2 * math.pi * k / 8)) for k in range(8)], up=(1, 0, 0))
    ob('Buckle', bm, [M['brass']], coll, smooth=40)
    # stitched box with an X on the strap where it meets the flap
    bx0, bx1, bz0, bz1 = sx - sw / 2 + 0.0035, sx + sw / 2 - 0.0035, 0.110, 0.146

    def onstrap(x, z):
        return Vector((x, strap_y(z) - st_ / 2 - 0.0001, z))

    box_pts = [onstrap(bx0, bz1), onstrap(bx0, bz0), onstrap(bx1, bz0), onstrap(bx1, bz1), onstrap(bx0, bz1)]
    dense = []
    for a, b in zip(box_pts[:-1], box_pts[1:]):
        for k in range(12):
            dense.append(a + (b - a) * k / 12)
    dense.append(box_pts[-1])
    stitch_row('BoxStitch', dense, (0, -1, 0), M, coll, length=0.0026, gap=0.0011, seed=2)
    lens_z = (bz0 + bz1) / 2
    lens_p = onstrap(sx, lens_z)
    for k, (a, b) in enumerate(((onstrap(bx0, bz0), onstrap(bx1, bz1)), (onstrap(bx0, bz1), onstrap(bx1, bz0)))):
        line = [a + (b - a) * t / 20 for t in range(21)]
        line = [p for p in line if (p - lens_p).length > 0.0036]
        mid = len(line) // 2
        stitch_row(f'XStitch{k}a', line[:mid], (0, -1, 0), M, coll, length=0.0026, gap=0.0011, seed=3 + k)
        stitch_row(f'XStitch{k}b', line[mid:], (0, -1, 0), M, coll, length=0.0026, gap=0.0011, seed=5 + k)
    for side in (-1, 1):
        edge = [onstrap(sx + side * (sw / 2 - 0.0022), z) for z in [bot_z + (top_z - 0.01 - bot_z) * t / 50 for t in range(51)]]
        edge = [p for p in edge if not (bz - 0.016 < p.z < bz + 0.016) and not (bz0 - 0.002 < p.z < bz1 + 0.002)
                and not (fz0 - 0.006 < p.z < fz0 + 0.004)]
        stitch_row(f'StrapEdge{side}', edge, (0, -1, 0), M, coll, length=0.003, gap=0.0012, seed=7 + side)
    # the pinhole lens: dark bezel ring flush in the leather + a domed black glass bead
    nrm = Vector((0, -1, 0))
    bez = cyl('LensBezel', tuple(lens_p + nrm * 0.0001), 0.0022, 0.001, M['bezel'], rot=(math.pi / 2, 0, 0), seg=40, bev=0.0003)
    shade(bez, True, 40)
    dome = prim('sphere', 'LensDome', tuple(lens_p + nrm * 0.0003), seg=48, ring=24, r=0.0015)
    dome.scale = (1.0, 0.7, 1.0)
    set_mat(dome, M['lens_glass'])
    A['lens'] = lens_p + nrm * 0.0012
    # second strap (right), plain, softer in the background
    bm = bmesh.new()
    pts2 = [Vector((-p.x, p.y + 0.0003, p.z)) for p in pts]
    sweep(bm, pts2, rrect(sw, st_, 0.0012, 2), up=(0, -1, 0), mi=0)
    ob('FrontStrap2', bm, [M['leather']], coll, smooth=50)
    # shoulder strap: webbing from the left side, lying across the seat front and off its edge
    bm = bmesh.new()
    sp = spline([(-0.168, 0.05, 0.2), (-0.185, 0.0, 0.12), (-0.17, -0.06, 0.012), (-0.08, -0.105, 0.004), (0.05, -0.12, 0.004),
                 (0.16, -0.10, 0.004), (0.215, -0.07, -0.02), (0.23, -0.06, -0.12)], 10)
    sweep(bm, sp, rrect(0.038, 0.0028, 0.001, 2), up=(0, 0, 1), mi=0)
    sh = ob('ShoulderStrap', bm, [M['strap_web']], coll, smooth=40)
    ring = prim('torus', 'DRing', (-0.168, 0.05, 0.205), (0, math.pi / 2, 0), R=0.018, r=0.0022, seg=32, seg2=10)
    set_mat(ring, M['brass'])
    A['flap_center'] = Vector((0, fy, (fz0 + fz1) / 2))
    return A


# ============================================================================ S04 / S23: the district

ST = dict(hw=4.6, y_in=6.0, y_end=92.0, bollard_y=7.4)


def street_mats(night=True):
    M = {}
    M['setts'] = mat_setts('Setts', base=(0.075, 0.072, 0.07), wet=0.6 if night else 0.45)
    M['gutter'] = mat_stone('GutterStone', base=(0.06, 0.06, 0.062), rough=(0.1, 0.3), speck=0.4, scale=2.0)
    p = principled(M['gutter'])
    p.inputs['Coat Weight'].default_value = 0.8
    p.inputs['Coat Roughness'].default_value = 0.05
    M['stone_pale'] = mat_panel_stone('StonePale', base=(0.34, 0.31, 0.27), joint=(1.2, 0.55))
    M['stone_grey'] = mat_panel_stone('StoneGrey', base=(0.20, 0.20, 0.195), joint=(1.5, 0.75), dirt=0.5)
    M['stone_dark'] = mat_stone('StoneDark', base=(0.03, 0.03, 0.032), rough=(0.12, 0.3), speck=0.35, scale=2.0)
    M['brick'] = mat_panel_stone('BrickBrown', base=(0.11, 0.06, 0.04), joint=(0.22, 0.065), rough=(0.6, 0.8), dirt=0.3)
    M['alu'] = mat_metal('FacadeAlu', base=(0.30, 0.31, 0.32), rough=(0.3, 0.45), scale=2.0, grime=0.35)
    M['alu_dark'] = mat_paint('AluDark', color=(0.025, 0.026, 0.028), rough=(0.3, 0.45), scale=2.0, wear=0.1)
    M['shutter'] = mat_corrugated('Shutter', base=(0.17, 0.175, 0.18))
    M['shutter2'] = mat_corrugated('ShutterLight', base=(0.28, 0.285, 0.29), pitch=0.09)
    dark = 0.72 if night else 0.42
    M['win'] = mat_office_glass('OfficeWin', dark_frac=dark, strength=1.4 if night else 2.0, cool_frac=0.65)
    M['win_shop'] = mat_office_glass('ShopWin', dark_frac=0.9, strength=0.8, cool_frac=0.8)
    M['lobby'] = mat_office_glass('LobbyWin', dark_frac=0.0, strength=1.1, cool_frac=1.0)
    M['steel'] = mat_metal('BollardSteel', base=(0.55, 0.56, 0.57), rough=(0.16, 0.3), scale=3.0, bump=0.003,
                           brushed=(1.0, 1.0, 30.0), grime=0.25, scratches=0.4)
    M['kiosk'] = mat_paint('KioskPanel', color=(0.035, 0.05, 0.075), rough=(0.3, 0.45), scale=2.0, wear=0.15,
                           edge_metal=(0.35, 0.35, 0.36))
    M['kiosk_light'] = mat_paint('KioskBand', color=(0.32, 0.33, 0.33), rough=(0.3, 0.45), scale=2.0, wear=0.1)
    M['glass'] = mat_window_glass('KioskGlass', tint=(0.78, 0.84, 0.82), refl=0.1)
    M['kiosk_in'] = mat_wall('KioskInside', color=(0.42, 0.43, 0.40), dirt=0.2)
    M['cam_body'] = mat_paint('CamBody', color=(0.42, 0.42, 0.41), rough=(0.3, 0.45), scale=6.0, wear=0.2,
                              edge_metal=(0.5, 0.5, 0.5))
    M['cam_glass'] = mat_principled('CamLens', color=(0.004, 0.004, 0.005), rough=0.03, coat=1.0, coat_rough=0.02)
    M['dome'] = mat_principled('DomeSmoke', color=(0.02, 0.02, 0.022), rough=0.05, coat=1.0, coat_rough=0.02, spec=0.8)
    M['wire'] = mat_principled('Wire', color=(0.01, 0.01, 0.01), rough=0.5)
    M['lamp_housing'] = mat_paint('LampHousing', color=(0.05, 0.052, 0.055), rough=(0.35, 0.5), scale=4.0, wear=0.15)
    M['sodium'] = no_emit_sampling(mat_emission('SodiumBowl', SODIUM, 14.0))
    M['tube'] = no_emit_sampling(mat_emission('KioskTube', (0.82, 0.95, 1.0), 9.0))
    M['security'] = no_emit_sampling(mat_emission('SecLamp', (0.85, 0.92, 1.0), 12.0))
    M['rubber'] = mat_rubber('KerbRubber')
    return M


def _xf(side, hw):
    """Local facade frame -> world. Local: u along the street (= world y), w outward toward the street, z up.
    side=-1: facade on the left at x=-hw facing +X; side=+1: on the right at x=+hw facing -X."""
    if side < 0:
        return Matrix(((0, 1, 0, -hw), (1, 0, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1)))   # x = w - hw, y = u
    return Matrix(((0, -1, 0, hw), (1, 0, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1)))       # x = hw - w, y = u


def _pane(bm, uvl, wdl, u0, u1, z0, z1, w, rng, mi):
    f = bm_quad(bm, [(u0, w, z0), (u1, w, z0), (u1, w, z1), (u0, w, z1)], mi)
    r = (rng.random(), rng.random())
    for lp, uv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        lp[uvl].uv = uv
        lp[wdl].uv = r
    return f


def build_facade(name, M, side, u0, u1, h, style, seed, coll=None, hw=None, shop_bay=4.2, gf=4.2, fl=3.3,
                 shutters_down=1.0, entrances=(), cams=(), corner_return=None):
    """One building front. Material slots: 0 cladding, 1 frames, 2 office glass, 3 shutter, 4 dark stone,
    5 shop glass, 6 lobby glass. Returns dict(obj, cams=[world points], lights=[...])."""
    rng = random.Random(seed)
    hw = ST['hw'] if hw is None else hw
    clad = {'pale': M['stone_pale'], 'grey': M['stone_grey'], 'brick': M['brick'], 'glass': M['alu_dark']}[style]
    mats = [clad, M['alu'], M['win'], M['shutter'] if rng.random() < 0.6 else M['shutter2'], M['stone_dark'], M['win_shop'],
            M['lobby']]
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    wdl = bm.loops.layers.uv.new('WinData')
    Lw = u1 - u0
    # mass behind the face
    bm_box(bm, ((u0 + u1) / 2, -6.35, h / 2), (Lw, 12.0, h), 0)
    # ---- ground floor: pilasters + recessed shuttered bays, fascia band, cornice
    ent_u = []
    nb = max(1, round(Lw / shop_bay))
    bw = Lw / nb
    pil = 0.42
    for k in range(nb + 1):
        uc = u0 + k * bw
        a, b = max(u0, uc - pil / 2), min(u1, uc + pil / 2)
        bm_box(bm, ((a + b) / 2, 0.06, gf / 2), (b - a, 0.12, gf), 4)
    bays = []
    for k in range(nb):
        a, b = u0 + k * bw + pil / 2, u0 + (k + 1) * bw - pil / 2
        bays.append((a, b))
        bm_box(bm, ((a + b) / 2, -0.25, gf / 2), (b - a, 0.1, gf), 4)            # recess back wall
        if k in entrances:
            # glass entrance: lobby light behind, steel frame, small canopy
            ent_u.append((a + b) / 2)
            _pane(bm, uvl, wdl, a + 0.1, b - 0.1, 0.05, 2.9, -0.2, rng, 6)
            for uu in (a + 0.1, (a + b) / 2, b - 0.1):
                bm_box(bm, (uu, -0.18, 1.48), (0.06, 0.06, 2.9), 1)
            bm_box(bm, ((a + b) / 2, -0.18, 2.92), (b - a - 0.2, 0.06, 0.06), 1)
            bm_box(bm, ((a + b) / 2, -0.18, 1.2), (b - a - 0.2, 0.04, 0.04), 1)
            continue
        drop = shutters_down if rng.random() < 0.85 else rng.uniform(0.25, 0.6)
        top = 3.05
        sz0 = top - (top - 0.02) * drop
        bm_quad(bm, [(a, -0.16, sz0), (b, -0.16, sz0), (b, -0.16, top), (a, -0.16, top)], 3)
        bm_box(bm, ((a + b) / 2, -0.15, sz0 + 0.02), (b - a, 0.05, 0.05), 1)      # bottom bar
        for uu in (a + 0.03, b - 0.03):
            bm_box(bm, (uu, -0.13, top / 2), (0.05, 0.06, top), 1)                # guide rails
        if sz0 > 0.1:                                                              # half-open: dark shop glass below
            _pane(bm, uvl, wdl, a + 0.06, b - 0.06, 0.05, sz0, -0.22, rng, 5)
        bm_box(bm, ((a + b) / 2, -0.1, top + 0.2), (b - a, 0.32, 0.36), 1)        # shutter box
    bm_box(bm, ((u0 + u1) / 2, 0.02, gf - 0.45), (Lw, 0.16, 0.9), 4)              # blank fascia band
    bm_box(bm, ((u0 + u1) / 2, 0.12, gf + 0.08), (Lw + 0.2, 0.36, 0.16), 4)       # cornice / canopy lip
    # ---- upper floors
    z = gf + 0.16
    nfl = int((h - z - 0.9) / fl)
    for f in range(nfl):
        zf = z + f * fl
        if style == 'glass':
            # curtain wall: dark spandrel glass + vision glass, mullions every 1.5 m
            n = max(1, round(Lw / 1.5))
            for k in range(n):
                a, b = u0 + Lw * k / n, u0 + Lw * (k + 1) / n
                _pane(bm, uvl, wdl, a + 0.03, b - 0.03, zf + 0.95, zf + fl - 0.05, -0.04, rng, 2)
                bm_box(bm, (a, 0.0, zf + fl / 2), (0.07, 0.14, fl), 1)
            bm_box(bm, ((u0 + u1) / 2, -0.03, zf + 0.47), (Lw, 0.06, 0.94), 1)
            bm_box(bm, ((u0 + u1) / 2, 0.0, zf + 0.95), (Lw, 0.12, 0.06), 1)
        elif style in ('pale', 'grey'):
            # ribbon windows between stone spandrels
            bm_box(bm, ((u0 + u1) / 2, 0.04, zf + 0.55), (Lw, 0.08, 1.1), 0)
            n = max(1, round(Lw / 1.25))
            for k in range(n):
                a, b = u0 + Lw * k / n, u0 + Lw * (k + 1) / n
                _pane(bm, uvl, wdl, a + 0.02, b - 0.02, zf + 1.12, zf + fl - 0.22, -0.12, rng, 2)
                bm_box(bm, (a, -0.08, zf + 1.1 + (fl - 1.32) / 2), (0.06, 0.1, fl - 1.32), 1)
            bm_box(bm, ((u0 + u1) / 2, 0.0, zf + fl - 0.11), (Lw, 0.16, 0.22), 0)
            bm_box(bm, ((u0 + u1) / 2, -0.06, zf + 1.1), (Lw, 0.14, 0.04), 1)
            bm_box(bm, ((u0 + u1) / 2, 0.06, zf + 1.07), (Lw, 0.08, 0.03), 0)    # sill lip
        else:
            # brick with punched windows
            n = max(1, round(Lw / 2.4))
            bm_box(bm, ((u0 + u1) / 2, 0.0, zf + fl / 2), (Lw, 0.02, fl), 0)
            for k in range(n):
                uc = u0 + Lw * (k + 0.5) / n
                a, b = uc - 0.75, uc + 0.75
                _pane(bm, uvl, wdl, a, b, zf + 0.95, zf + 2.75, -0.16, rng, 2)
                bm_box(bm, (uc, 0.04, zf + 0.92), (1.64, 0.1, 0.06), 4)
                bm_box(bm, (uc, -0.14, zf + 1.85), (0.05, 0.05, 1.8), 1)
    if nfl * fl + z < h:
        bm_box(bm, ((u0 + u1) / 2, 0.03, (z + nfl * fl + h) / 2), (Lw, 0.06, h - z - nfl * fl), 0 if style != 'glass' else 1)
    bm_box(bm, ((u0 + u1) / 2, 0.08, h + 0.05), (Lw + 0.1, 0.2, 0.1), 1)          # parapet coping
    bmesh.ops.transform(bm, matrix=_xf(side, hw), verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = ob(name, bm, mats, coll, smooth=None)
    out = dict(obj=o, cams=[], bays=bays, entr=[])
    X = _xf(side, hw)
    for u in ent_u:
        out['entr'].append(X @ Vector((u, 0.22, 3.12)))
    for (u, z) in cams:
        out['cams'].append((X @ Vector((u, 0.12, z)), side))
    return out


def build_camera_unit(name, M, base, out, aim, coll=None):
    """Bullet CCTV camera on a wall bracket. base = wall point, out = unit vector away from the wall, aim = world point."""
    root = empty(name, tuple(base), coll, size=0.1)
    out = Vector(out).normalized()
    arm_end = base + out * 0.32 + Vector((0, 0, 0.12))
    bm = bmesh.new()
    bm_box(bm, base + out * 0.01, (0.02, 0.12, 0.16), 0)
    sweep(bm, [base + out * 0.02, base + out * 0.2, arm_end], rrect(0.04, 0.04, 0.012, 2), mi=0)
    o1 = ob(name + 'Bracket', bm, [M['cam_body']], coll, smooth=40)
    d = (Vector(aim) - arm_end).normalized()
    q = d.to_track_quat('X', 'Z')
    body = rbox(name + 'Body', (0.34, 0.11, 0.11), (0.0, 0, 0), M['cam_body'], bev=0.015, seg=3)
    hood = rbox(name + 'Hood', (0.42, 0.14, 0.01), (0.04, 0, 0.066), M['cam_body'], bev=0.004)
    lens = cyl(name + 'Lens', (0.171, 0, 0), 0.034, 0.004, M['cam_glass'], rot=(0, math.pi / 2, 0), seg=24)
    piv = empty(name + 'Head', tuple(arm_end + Vector((0, 0, 0.05))), coll, size=0.05)
    for p_ in (body, hood, lens):
        parent(p_, piv, keep=False)
    piv.rotation_euler = q.to_euler()
    return root


def build_dome_cam(name, M, p, coll=None):
    cyl(name + 'Mount', tuple(p + Vector((0, 0, -0.02))), 0.075, 0.04, M['cam_body'], seg=32, bev=0.006)
    d = prim('sphere', name + 'Dome', tuple(p + Vector((0, 0, -0.04))), seg=32, ring=16, r=0.06)
    d.scale = (1, 1, 0.8)
    set_mat(d, M['dome'])


def build_bollard(M, coll=None):
    """Template stainless bollard (linked copies placed by the caller)."""
    bm = bmesh.new()
    prof = [(0.0, 0.0), (0.105, 0.0), (0.105, 0.012), (0.1, 0.02), (0.1, 0.78), (0.098, 0.785), (0.1, 0.79), (0.1, 0.86),
            (0.09, 0.9), (0.06, 0.925), (0.0, 0.932)]
    n = 40
    rings = []
    for r, z in prof:
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), z)) for i in range(n)])
    for k in range(len(prof) - 1):
        for i in range(n):
            bm.faces.new((rings[k][i], rings[k][(i + 1) % n], rings[k + 1][(i + 1) % n], rings[k + 1][i]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    o = ob('BollardProto', bm, [M['steel']], coll, smooth=40)
    o.location = (0, 0, -100)
    return o


def build_kiosk(M, coll, cx, cy, rot_z=0.0, inside_energy=60.0):
    """Small police-post kiosk: dark panelled base, band of windows, blank top band, flat roof with overhang,
    lit interior (one fluorescent tube), a desk and a filing box inside; dome camera on the roof corner."""
    root = empty('Kiosk', (cx, cy, 0.0), coll, size=0.3)
    W, D, H = 2.5, 2.0, 2.75
    parts = []
    parts.append(rbox('KPlinth', (W + 0.06, D + 0.06, 0.12), (0, 0, 0.06), M['stone_dark'], bev=0.01))
    for (sx, sy, w, d) in ((0, -1, W, 0.06), (0, 1, W, 0.06), (-1, 0, 0.06, D), (1, 0, 0.06, D)):
        cxp, cyp = sx * (W / 2 - 0.03), sy * (D / 2 - 0.03)
        parts.append(rbox('KLow', (w, d, 0.95), (cxp, cyp, 0.12 + 0.475), M['kiosk'], bev=0.006))
        parts.append(rbox('KTop', (w, d, 0.42), (cxp, cyp, 2.15 + 0.21), M['kiosk_light'], bev=0.006))
        parts.append(rbox('KGlass', (w if sx == 0 else 0.012, d if sy == 0 else 0.012, 1.08), (cxp, cyp, 1.07 + 0.54),
                          M['glass'], bev=0))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(rbox('KPost', (0.09, 0.09, H - 0.12), (sx * (W / 2 - 0.045), sy * (D / 2 - 0.045), 0.12 + (H - 0.12) / 2),
                              M['alu_dark'], bev=0.006))
    for k in range(1, 3):
        u = -W / 2 + W * k / 3
        parts.append(rbox('KMull', (0.05, 0.08, 1.1), (u, -D / 2 + 0.03, 1.62), M['alu_dark'], bev=0.004))
    parts.append(rbox('KMullS', (0.08, 0.05, 1.1), (-W / 2 + 0.03, 0.0, 1.62), M['alu_dark'], bev=0.004))
    parts.append(rbox('KRoof', (W + 0.3, D + 0.3, 0.16), (0, 0, H + 0.08), M['kiosk'], bev=0.01))
    parts.append(rbox('KFloor', (W - 0.1, D - 0.1, 0.02), (0, 0, 0.13), M['stone_dark'], bev=0))
    parts.append(rbox('KCeil', (W - 0.1, D - 0.1, 0.02), (0, 0, H - 0.02), M['kiosk_in'], bev=0))
    parts.append(rbox('KDesk', (1.4, 0.55, 0.04), (0.2, 0.55, 0.85), M['alu'], bev=0.004))
    parts.append(rbox('KDeskBox', (0.45, 0.5, 0.7), (0.65, 0.55, 0.47), M['kiosk_light'], bev=0.004))
    parts.append(rbox('KCab', (0.5, 0.45, 1.2), (-0.85, 0.65, 0.73), M['kiosk_light'], bev=0.004))
    parts.append(rbox('KMonitor', (0.4, 0.06, 0.3), (-0.05, 0.7, 1.05), M['alu_dark'], bev=0.01))
    tube = rbox('KTube', (1.2, 0.04, 0.03), (0, 0.1, H - 0.05), M['tube'], bev=0.006)
    parts.append(tube)
    # vertical blinds half-drawn on the back side
    for k in range(9):
        parts.append(rbox('KVBlind', (0.004, 0.09, 1.0), (-0.9 + k * 0.1, D / 2 - 0.12, 1.62), M['kiosk_in'], bev=0,
                          rot=(0, 0, math.radians(70))))
    # door on the -X side (towards the street)
    parts.append(rbox('KDoorLine', (0.01, 0.012, 2.0), (-W / 2 - 0.002, -0.35, 1.12), M['alu_dark'], bev=0))
    for p_ in parts:
        parent(p_, root, keep=False)
    root.rotation_euler.z = rot_z
    bpy.context.view_layer.update()
    Lw = root.matrix_world @ Vector((0, 0.1, H - 0.12))
    Lk = light('AREA', 'KioskLight', tuple(Lw), energy=inside_energy, color=kelvin(5200), size=1.2, size_y=0.25, shape='RECTANGLE')
    Lk.rotation_euler = (0, 0, rot_z)
    dome_p = root.matrix_world @ Vector((W / 2 + 0.1, -D / 2 - 0.1, H))
    build_dome_cam('KioskDome', M, dome_p, coll)
    return root


def catenary_lamp(name, M, y, z, hw, coll=None, energy=900.0, sag=0.35):
    """Lamp hung on a span wire across the street (facade to facade), sodium bowl, spot light below."""
    bm = bmesh.new()
    pts = [Vector((-hw + 0.1 + (2 * hw - 0.2) * k / 16, y, z + 0.5 - sag * (1 - (2 * k / 16 - 1) ** 2))) for k in range(17)]
    sweep(bm, pts, [(0.006 * math.cos(2 * math.pi * k / 6), 0.006 * math.sin(2 * math.pi * k / 6)) for k in range(6)])
    ob(name + 'Wire', bm, [M['wire']], coll, smooth=40)
    zc = z + 0.5 - sag
    bm = bmesh.new()
    prof = [(0.02, 0.38), (0.05, 0.32), (0.26, 0.12), (0.33, 0.04), (0.34, 0.0)]
    n = 32
    rings = []
    for r, a in prof:
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), a)) for i in range(n)])
    for k in range(len(prof) - 1):
        for i in range(n):
            bm.faces.new((rings[k][i], rings[k][(i + 1) % n], rings[k + 1][(i + 1) % n], rings[k + 1][i]))
    bm.faces.new(list(reversed(rings[0])))
    h_ = ob(name + 'Housing', bm, [M['lamp_housing']], coll, smooth=40)
    solidify(h_, 0.01, 1.0)
    h_.location = (0, y, zc - 0.4)
    bowl = prim('sphere', name + 'Bowl', (0, y, zc - 0.4), seg=32, ring=12, r=0.3)
    bowl.scale = (1, 1, 0.28)
    set_mat(bowl, M['sodium'])
    no_shadow(bowl)
    cyl(name + 'Hanger', (0, y, zc - 0.03), 0.012, 0.06, M['wire'], seg=8)
    L = light('SPOT', name + 'Light', (0, y, zc - 0.5), energy=energy, color=SODIUM, spot=140, blend=0.9, radius=0.2)
    return L


def build_street(M, coll=None, night=True, seed=11):
    """The district street. Returns anchors: bollard positions, kiosk, camera points, lamp lights."""
    rng = random.Random(seed)
    hw, yin, yend = ST['hw'], ST['y_in'], ST['y_end']
    A = dict(lamps=[], cams=[])
    # ground: plaza + street paved in setts, centre gutter of flat stones
    rbox('Ground', (80.0, 112.6, 0.02), (0.0, 53.8, -0.01), M['setts'], bev=0)
    # the road in front of the district (wet asphalt) and a granite kerb line
    from city import mat_wet_asphalt
    rbox('Road', (80.0, 27.6, 0.02), (0.0, -16.3, -0.13), mat_wet_asphalt('RoadAsphalt', wet=0.6), bev=0)
    rbox('Kerb', (80.0, 0.3, 0.14), (0.0, -2.6, -0.06), mat_stone('KerbStone', base=(0.12, 0.12, 0.12), rough=(0.3, 0.55),
                                                                 speck=0.5, scale=3.0), bev=0.01)
    rbox('Gutter', (0.42, yend - yin + 4, 0.012), (0.0, (yin + yend) / 2, -0.002), M['gutter'], bev=0.002)
    for k in range(int((yend - yin) / 1.2)):
        rbox('GutterJoint', (0.43, 0.008, 0.002), (0.0, yin + k * 1.2, 0.0045), M['stone_dark'], bev=0)
    # building fronts: left (side -1) and right (+1)
    specs_l = [(yin, 21.0, 8.9, 'pale', (2,), [(7.6, 4.75), (14.0, 4.75)]),
               (21.0, 38.0, 14.6, 'glass', (1,), [(29.0, 4.75)]),
               (38.0, 52.0, 16.0, 'brick', (), [(44.0, 4.75)]),
               (52.0, 70.0, 23.0, 'grey', (0,), [(60.0, 4.75)]),
               (70.0, yend, 22.0, 'pale', (), [])]
    specs_r = [(yin, 17.0, 27.0, 'grey', (), [(10.5, 4.75)]),
               (17.0, 33.0, 22.0, 'pale', (1,), [(24.0, 4.75)]),
               (33.0, 49.0, 34.0, 'glass', (2,), [(40.0, 4.75)]),
               (49.0, 64.0, 20.0, 'brick', (), [(56.0, 4.75)]),
               (64.0, yend, 25.0, 'grey', (0,), [])]
    fac = []
    for side, specs in ((-1, specs_l), (1, specs_r)):
        for k, (a, b, h, style, ent, cams) in enumerate(specs):
            r = build_facade(f'Fac{side}_{k}', M, side, a, b, h, style, seed + k * 7 + (side + 1) * 31, coll,
                             entrances=ent, cams=cams)
            fac.append(r)
            for p, sd in r['cams']:
                A['cams'].append((p, sd))
    # corner buildings facing the plaza (fronts at y = yin, facing -Y). Built as a right-hand facade at x=0 running
    # along +Y (facing -X), then turned +90 deg about Z: +Y -> -X (runs toward -X), facing -X -> -Y.
    corner_cams = []
    corner_fac = []
    for side in (-1, 1):
        r = build_facade(f'Corner{side}', M, 1, 0.0, 22.0, 8.9 if side < 0 else 27.0, 'pale' if side < 0 else 'grey',
                         seed + 90 + side, coll, hw=0.0, entrances=(1,), cams=[(3.2, 4.75), (13.5, 4.75)])
        o = r['obj']
        o.rotation_euler.z = math.pi / 2
        o.location = (-hw, yin, 0.0) if side < 0 else (hw + 22.0, yin, 0.0)
        bpy.context.view_layer.update()
        for p, sd in r['cams']:
            corner_cams.append(o.matrix_world @ p)
        A.setdefault('corner_objs', []).append(o)
        corner_fac.append(r)
    # end of the street: a cross block with shader facades
    fm = mat_facade('EndFacade', seed=4.0, bay=2.4, floor=3.3, ww=0.6, wh=0.55, lit=0.12 if night else 0.35,
                    wall=(0.06, 0.055, 0.05), strength=1.2, shop=False)
    eb = rbox('EndBlock', (30.0, 14.0, 30.0), (0.0, yend + 7.0, 15.0), fm, bev=0)
    # bollards across the entrance (one gap with a retracted bollard) and along the kiosk edge
    proto = build_bollard(M, coll)
    A['bollards'] = []
    xs = [-3.95 + k * 1.32 for k in range(6)]
    for k, x in enumerate(xs):
        if k == 3:
            cyl('BollardSleeve', (x, ST['bollard_y'], 0.004), 0.14, 0.012, M['steel'], seg=40, bev=0.002)
            cyl('BollardTop', (x, ST['bollard_y'], 0.012), 0.1, 0.006, M['steel'], seg=40, bev=0.002)
            continue
        b = linked_copy(proto, f'Bollard{k}', loc=(x, ST['bollard_y'], 0.0), rot=(0, 0, rng.uniform(0, 6.28)))
        A['bollards'].append(b)
    for k, (x, y) in enumerate(((hw - 0.5, 4.2), (hw - 0.5, 2.6), (-hw + 0.5, 4.4), (-hw + 0.5, 2.8))):
        A['bollards'].append(linked_copy(proto, f'BollardE{k}', loc=(x, y, 0.0), rot=(0, 0, rng.uniform(0, 6.28))))
    # police post at the right corner of the entrance
    A['kiosk'] = build_kiosk(M, coll, 2.95, ST['bollard_y'] + 2.1, rot_z=0.0, inside_energy=70.0 if night else 50.0)
    # facade cameras (aim down the street / at the entrance)
    for i, (p, sd) in enumerate(A['cams']):
        aim = Vector((0.0, p.y + (14.0 if rng.random() < 0.5 else -10.0), 0.0))
        build_camera_unit(f'Cam{i}', M, p, (-sd, 0, 0), aim, coll)
    for i, p in enumerate(corner_cams):
        build_camera_unit(f'CamC{i}', M, p, (0, -1, 0), Vector((0.0, 0.0, 0.0)), coll)
    A['cams'] += [(p, 0) for p in corner_cams]
    # span-wire sodium lamps
    for k, y in enumerate((12.0, 26.0, 40.0, 54.0, 68.0, 82.0)):
        A['lamps'].append(catenary_lamp(f'Span{k}', M, y, 7.2, hw, coll, energy=700.0 if night else 450.0))
    # sodium wall lanterns on the corner fronts (light the plaza and the bollard line)
    for k, (x, sgn) in enumerate(((-hw - 3.0, -1), (hw + 3.0, 1))):
        p = Vector((x, yin - 0.05, 5.2))
        bm = bmesh.new()
        bm_box(bm, p + Vector((0, -0.25, 0.1)), (0.05, 0.5, 0.05), 0)
        bm_box(bm, p + Vector((0, -0.55, -0.05)), (0.26, 0.26, 0.34), 0)
        ob(f'Lantern{k}', bm, [M['lamp_housing']], coll)
        g = rbox(f'LanternGlass{k}', (0.2, 0.2, 0.16), tuple(p + Vector((0, -0.55, -0.27))), M['sodium'], bev=0.01)
        no_shadow(g)
        A['lamps'].append(light('SPOT', f'LanternL{k}', tuple(p + Vector((0, -0.55, -0.36))), energy=380.0 if night else 260.0,
                                color=SODIUM, spot=150, blend=0.9, radius=0.12))
    # cool security lights over the building entrances (small fixture under the fascia + a spot down)
    A['sec'] = []
    for r in fac + corner_fac:
        mw = r['obj'].matrix_world
        for p in r['entr']:
            wp = mw @ p
            g = rbox('SecFixture', (0.3, 0.3, 0.06), tuple(wp + Vector((0, 0, 0.0))), M['security'], bev=0.01)
            no_shadow(g)
            A['sec'].append(light('SPOT', 'SecLight', tuple(wp + Vector((0, 0, -0.08))), energy=160.0 if night else 80.0,
                                  color=kelvin(5600), spot=120, blend=0.8, radius=0.1))
    A['fac'] = fac
    return A
