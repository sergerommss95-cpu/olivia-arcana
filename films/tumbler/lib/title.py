"""Act V helpers: engine-turned steel (perlage), machined letter steel, title text with weight, the 5A2 dial.

mat_perlage()       engine-turned steel: staggered rows of overlapping turned circles (each with fine
                    concentric swirl grooves). Self-contained replacement for lock.mat_engine_turned, whose
                    LENGTH nodes link the VectorMath 'Vector' output (zero) so its pattern never renders.
mat_letter_steel()  brushed faces (anisotropic along world X) + polished chamfers, split by object-space normal.
title_text()        text mesh with curve offset (adds weight to the built-in font), extrude and bevel.
"""
import math
import bpy
from common import *


def _len2(nb, x, y):
    """sqrt(x^2 + y^2) from two float sockets, via Math nodes (returns the node)."""
    xx = nb.math('MULTIPLY', x, x)
    yy = nb.math('MULTIPLY', y, y)
    return nb.math('SQRT', nb.math('ADD', xx, yy))


def mat_perlage(name='Perlage', base=(0.5, 0.51, 0.53), rough=(0.2, 0.3), cell=0.2, bump=0.3, coord='Object',
                metal=1.0, dark=0.75, bump_dist=0.002, aniso=0.85, swirl=0.0):
    """Engine-turned steel: staggered rows of overlapping turned circles. Each circle carries circular grain,
    rendered as anisotropic reflection with a tangent running round the circle (the bowtie glint of real
    perlage) plus a slight step at each circle's edge. cell = circle pitch in coordinate units.
    The tangent is built in object space: use on objects without rotation (plates, door faces)."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Anisotropic'].default_value = aniso
    tc = nb.n('ShaderNodeTexCoord')
    sep = nb.n('ShaderNodeSeparateXYZ')
    nb.l(tc, coord, sep, 0)

    def mixf(fac, a, b):
        mx = nb.n('ShaderNodeMix', {'data_type': 'FLOAT'})
        nb.L.new(fac.outputs[0], mx.inputs[0])
        nb.L.new(a.outputs[0], mx.inputs[2])
        nb.L.new(b.outputs[0], mx.inputs[3])
        return mx
    hx = hy = hr = None
    # later layers are cut over earlier ones where they cover (overlap order, like the real tool marks)
    for ox, oy in ((0.0, 0.0), (0.5, 0.0), (0.25, 0.5), (0.75, 0.5)):
        gx = nb.math('MULTIPLY_ADD', sep.outputs['X'], None, vb=1.0 / cell)
        gx.inputs[2].default_value = ox
        gy = nb.math('MULTIPLY_ADD', sep.outputs['Y'], None, vb=1.0 / cell)
        gy.inputs[2].default_value = oy
        fx = nb.math('SUBTRACT', nb.math('FRACT', gx), None, vb=0.5)
        fy = nb.math('SUBTRACT', nb.math('FRACT', gy), None, vb=0.5)
        ln = _len2(nb, fx, fy)
        inside = nb.math('LESS_THAN', ln, None, vb=0.5)
        if hx is None:
            hx, hy, hr = fx, fy, ln
        else:
            hx, hy, hr = mixf(inside, hx, fx), mixf(inside, hy, fy), mixf(inside, hr, ln)
    tg = nb.n('ShaderNodeCombineXYZ')
    neg = nb.math('MULTIPLY', hy, None, vb=-1.0)
    nb.L.new(neg.outputs[0], tg.inputs['X'])
    nb.L.new(hx.outputs[0], tg.inputs['Y'])
    nb.L.new(tg.outputs[0], p.inputs['Tangent'])
    # height: shallow dish per circle (edge step) + optional visible swirl grooves
    h = nb.math('MULTIPLY', hr, hr)
    if swirl:
        sw = nb.math('SINE', nb.math('MULTIPLY', hr, None, vb=swirl * 2 * math.pi))
        h = nb.math('MULTIPLY_ADD', sw, None, vb=0.08)
        nb.L.new(nb.math('MULTIPLY', hr, hr).outputs[0], h.inputs[2])
    bm = nb.n('ShaderNodeBump', Strength=bump, Distance=bump_dist)
    nb.L.new(h.outputs[0], bm.inputs['Height'])
    nb.l(bm, 'Normal', p, 'Normal')
    nz = nb.n('ShaderNodeTexNoise', Scale=5.0, Detail=4.0)
    nb.l(tc, coord, nz, 'Vector')
    rr = nb.ramp(nz, 'Fac', [(0.3, (rough[0],) * 3), (0.75, (rough[1],) * 3)])
    nb.l(rr, 'Color', p, 'Roughness')
    cr = nb.ramp(nz, 'Fac', [(0.25, tuple(c * dark for c in base)), (0.75, base)])
    nb.l(cr, 'Color', p, 'Base Color')
    return m


def mat_letter_steel(name='LetterSteel', base=(0.58, 0.59, 0.61), face_rough=0.24, bevel_rough=0.11, aniso=0.75,
                     brush_scale=(1.5, 140.0, 140.0), bump=0.25):
    """Machined steel letters: horizontally brushed faces, polished chamfers (object-space normal z > 0.97 = face)."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    p.inputs['Metallic'].default_value = 1.0
    tc = nb.n('ShaderNodeTexCoord')
    sn = nb.n('ShaderNodeSeparateXYZ')
    nb.l(tc, 'Normal', sn, 0)
    face = nb.n('ShaderNodeMapRange', **{'From Min': 0.95, 'From Max': 0.99})
    nb.l(sn, 'Z', face, 'Value')
    # brushing streaks along local X (text baseline)
    st = nb.n('ShaderNodeMapping', Scale=brush_scale)
    nb.l(tc, 'Object', st, 'Vector')
    br = nb.n('ShaderNodeTexNoise', Scale=1.0, Detail=6.0, Roughness=0.7)
    nb.l(st, 'Vector', br, 'Vector')
    blot = nb.n('ShaderNodeTexNoise', Scale=3.0, Detail=4.0)
    nb.l(tc, 'Object', blot, 'Vector')
    rough_face = nb.ramp(br, 'Fac', [(0.3, (face_rough * 0.75,) * 3), (0.7, (face_rough * 1.25,) * 3)])
    rmix = nb.mix(bevel_rough, rough_face, face, dtype='FLOAT')
    nb.L.new(nb.out_of(rmix), p.inputs['Roughness'])
    an = nb.math('MULTIPLY', face, None, vb=aniso)
    nb.L.new(an.outputs[0], p.inputs['Anisotropic'])
    cr = nb.ramp(blot, 'Fac', [(0.3, tuple(c * 0.86 for c in base)), (0.7, base)])
    nb.l(cr, 'Color', p, 'Base Color')
    # tangent along the object's X axis (world-space vector of local X)
    tg = nb.n('ShaderNodeVectorTransform', {'vector_type': 'VECTOR', 'convert_from': 'OBJECT', 'convert_to': 'WORLD'})
    tg.inputs[0].default_value = (1.0, 0.0, 0.0)
    nb.L.new(tg.outputs[0], p.inputs['Tangent'])
    bmp = nb.n('ShaderNodeBump', Strength=bump, Distance=0.0005)
    nb.l(br, 'Fac', bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def title_text(body, name='Title', size=1.0, extrude=0.08, bevel=0.012, offset=0.0, spacing=1.0, resolution=6,
               bevel_res=3, coll=None, font=None):
    """Text -> mesh with extra weight (curve offset), extrusion and a real chamfer."""
    cu = bpy.data.curves.new(name + '_cu', 'FONT')
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.bevel_resolution = bevel_res
    cu.offset = offset
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.space_character = spacing
    cu.resolution_u = resolution
    if font:
        cu.font = bpy.data.fonts.load(font)
    o = bpy.data.objects.new(name + '_tmp', cu)
    link(o)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o)
    ob = bpy.data.objects.new(name, me)
    link(ob, coll)
    shade(ob, True, 30.0)
    return ob
