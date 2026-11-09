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
                metal=1.0, dark=0.75, bump_dist=0.002, aniso=0.85, radius=0.72):
    """Engine-turned steel (perlage), cut the way the tool does it: circles of `radius` (in cells) on a square
    grid of pitch `cell`, overlapping in raster order (each later circle cuts over its neighbours -> fish scales).
    Each circle carries circular grain, rendered as anisotropic reflection with the tangent running round the
    circle (the bowtie glint of real perlage), plus a slight dish so the overlap edges catch light.
    The tangent is built in object space: use on objects without rotation (plates, door faces)."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Anisotropic'].default_value = aniso
    tc = nb.n('ShaderNodeTexCoord')
    sep = nb.n('ShaderNodeSeparateXYZ')
    nb.l(tc, coord, sep, 0)
    gx = nb.math('MULTIPLY', sep.outputs['X'], None, vb=1.0 / cell)
    gy = nb.math('MULTIPLY', sep.outputs['Y'], None, vb=1.0 / cell)
    fx = nb.math('FRACT', gx)          # position inside the cell, 0..1
    fy = nb.math('FRACT', gy)

    def mixf(fac, a, b):
        mx = nb.n('ShaderNodeMix', {'data_type': 'FLOAT'})
        nb.L.new(fac.outputs[0], mx.inputs[0])
        nb.L.new(a.outputs[0], mx.inputs[2])
        nb.L.new(b.outputs[0], mx.inputs[3])
        return mx
    hx = hy = hr = None
    for dj in (-1, 0, 1):              # raster order: lower rows first, left to right; later circles win
        for di in (-1, 0, 1):
            rx = nb.math('SUBTRACT', fx, None, vb=0.5 + di)
            ry = nb.math('SUBTRACT', fy, None, vb=0.5 + dj)
            ln = nb.math('DIVIDE', _len2(nb, rx, ry), None, vb=radius)   # 0 centre .. 1 rim
            inside = nb.math('LESS_THAN', ln, None, vb=1.0)
            if hx is None:
                hx, hy, hr = rx, ry, ln
            else:
                hx, hy, hr = mixf(inside, hx, rx), mixf(inside, hy, ry), mixf(inside, hr, ln)
    tg = nb.n('ShaderNodeCombineXYZ')
    neg = nb.math('MULTIPLY', hy, None, vb=-1.0)
    nb.L.new(neg.outputs[0], tg.inputs['X'])
    nb.L.new(hx.outputs[0], tg.inputs['Y'])
    nb.L.new(tg.outputs[0], p.inputs['Tangent'])
    h = nb.math('MULTIPLY', hr, hr)    # shallow dish: the overlap edges step
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


def mat_letter_steel(name='LetterSteel', base=(0.58, 0.60, 0.63), face_rough=0.18, bevel_rough=0.11, aniso=0.75,
                     brush_scale=(1.5, 140.0, 140.0), bump=0.25):
    """Machined steel letters: horizontally brushed faces, polished chamfers (object-space normal z > 0.97 = face).
    Grooves run along local X, so reflections smear along local Y: anisotropy tangent = local Y. A vertical strip
    light then reads as a crisp vertical band that travels across the word."""
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
    # tangent along the object's Y axis (world-space vector of local Y)
    tg = nb.n('ShaderNodeVectorTransform', {'vector_type': 'VECTOR', 'convert_from': 'OBJECT', 'convert_to': 'WORLD'})
    tg.inputs[0].default_value = (0.0, 1.0, 0.0)
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


def link_light(light_obj, objs, name=None):
    """Cycles light linking: the light illuminates only `objs` (a flag, like on set)."""
    coll = bpy.data.collections.new(name or (light_obj.name + '_recv'))
    for o in objs:
        coll.objects.link(o)
    light_obj.light_linking.receiver_collection = coll
    return coll
