"""Shared toolkit for every TUMBLER shot script (Blender 5.2, Cycles on CPU).

Import from a shot script with:
    import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
    from common import *

CLI handled by finish(shot):
    --stills F1,F2 [--pct 50] [--tag x]   JPEG stills to tests/<shot><tag>_fNNNN.jpg
    --anim [--from A --to B] [--step N] [--jpg] [--outdir D]   frame sequence (default out/renders/<shot>/)
    --samples N                          override Cycles samples
    --save                               save blend/<shot>.blend
Structure and naming follow ESCAPEMENT's toolkit (github.com/Leonxlnx/escapement, MIT), rewritten
for Cycles/CPU and for this film.
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Euler, Matrix, noise as mnoise

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 24
RES = (1280, 536)          # 2.39:1 band, upscaled to 1920x804 in the edit


# ----------------------------------------------------------------------------- scene

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = FPS
    return sc


def setup_render(start=1, end=48, res=RES, samples=40, mb=True, shutter=0.5, adaptive=0.03,
                 look='Medium High Contrast', exposure=0.0, bounces=(2, 3, 4), vol_bounces=0,
                 vol_step=4.0, clamp=6.0, filter_glossy=0.8, film_transparent=False):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    cy = sc.cycles
    cy.device = 'CPU'
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = float(os.environ.get('TUMBLER_ADAPTIVE', adaptive))
    cy.adaptive_min_samples = 0
    cy.use_denoising = True
    try:
        cy.denoiser = 'OPENIMAGEDENOISE'
        cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
        cy.denoising_prefilter = 'ACCURATE'
    except Exception:
        pass
    d, g, t = bounces
    cy.max_bounces = max(d, g, t) + 2
    cy.diffuse_bounces = d
    cy.glossy_bounces = g
    cy.transmission_bounces = t
    cy.volume_bounces = vol_bounces
    cy.transparent_max_bounces = 16
    cy.sample_clamp_direct = 0.0
    cy.sample_clamp_indirect = clamp
    cy.blur_glossy = filter_glossy
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.volume_step_rate = vol_step
    cy.volume_max_steps = 256
    try:
        cy.use_light_tree = True
    except Exception:
        pass
    sc.render.use_persistent_data = True
    sc.render.threads_mode = 'AUTO'
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = start, end
    sc.render.film_transparent = film_transparent
    sc.render.use_motion_blur = mb
    sc.render.motion_blur_shutter = shutter
    try:
        sc.render.motion_blur_position = 'CENTER'
    except Exception:
        pass
    sc.view_settings.view_transform = 'AgX'
    _set_look(sc, look)
    sc.view_settings.exposure = exposure
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_depth = '16'
    sc.render.image_settings.compression = 15
    sc.render.dither_intensity = 0.5
    return sc


def _set_look(sc, look):
    items = [i.identifier for i in sc.view_settings.bl_rna.properties['look'].enum_items_static] \
        if hasattr(sc.view_settings.bl_rna.properties['look'], 'enum_items_static') else []
    for cand in (look, 'AgX - ' + look, look.replace('AgX - ', '')):
        try:
            sc.view_settings.look = cand
            return
        except Exception:
            continue


def world_color(color=(0.003, 0.004, 0.005), strength=1.0):
    w = bpy.data.worlds.new('World')
    bpy.context.scene.world = w
    nt = w.node_tree if w.node_tree else None
    if nt is None:
        w.use_nodes = True
        nt = w.node_tree
    bg = nt.nodes.get('Background') or nt.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (*color, 1)
    bg.inputs['Strength'].default_value = strength
    out = nt.nodes.get('World Output') or nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(bg.outputs[0], out.inputs['Surface'])
    return w


def world_gradient(zenith=(0.004, 0.006, 0.01), horizon=(0.02, 0.015, 0.012), strength=1.0):
    w = world_color()
    nt = w.node_tree
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    nt.links.new(tc.outputs['Generated'], sep.inputs[0])
    mp = nt.nodes.new('ShaderNodeMapRange')
    mp.inputs['From Min'].default_value = 0.5
    mp.inputs['From Max'].default_value = 0.8
    nt.links.new(sep.outputs['Z'], mp.inputs['Value'])
    nt.links.new(mp.outputs[0], ramp.inputs[0])
    ramp.color_ramp.elements[0].color = (*horizon, 1)
    ramp.color_ramp.elements[1].color = (*zenith, 1)
    bg = nt.nodes['Background']
    nt.links.new(ramp.outputs[0], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    return w


def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


# ----------------------------------------------------------------------------- geometry

def mesh_obj(name, verts, faces, coll=None, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    link(o, coll)
    if smooth:
        shade(o)
    return o


def shade(o, smooth=True, angle=32.0):
    me = o.data
    if smooth:
        try:
            me.shade_smooth_by_angle(angle=math.radians(angle))  # Blender 4.1+
        except Exception:
            for p in me.polygons:
                p.use_smooth = True
    return o


def from_bmesh(name, bm, coll=None, smooth=True, angle=32.0):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    link(o, coll)
    if smooth:
        shade(o, True, angle)
    return o


def prim(kind, name='obj', loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), coll=None, **kw):
    """kind: cube | cyl | sphere | plane | cone | torus. Built with bmesh (no ops context issues)."""
    bm = bmesh.new()
    if kind == 'cube':
        bmesh.ops.create_cube(bm, size=1.0)
    elif kind == 'cyl':
        bmesh.ops.create_cone(bm, cap_ends=True, segments=kw.get('seg', 48), radius1=kw.get('r', 0.5),
                              radius2=kw.get('r2', kw.get('r', 0.5)), depth=kw.get('depth', 1.0))
    elif kind == 'cone':
        bmesh.ops.create_cone(bm, cap_ends=True, segments=kw.get('seg', 48), radius1=kw.get('r', 0.5),
                              radius2=kw.get('r2', 0.0), depth=kw.get('depth', 1.0))
    elif kind == 'sphere':
        bmesh.ops.create_uvsphere(bm, u_segments=kw.get('seg', 32), v_segments=kw.get('ring', 16), radius=kw.get('r', 0.5))
    elif kind == 'plane':
        bmesh.ops.create_grid(bm, x_segments=kw.get('xs', 1), y_segments=kw.get('ys', 1), size=0.5)
    elif kind == 'torus':
        R, r = kw.get('R', 1.0), kw.get('r', 0.1)
        su, sv = kw.get('seg', 64), kw.get('seg2', 16)
        verts = []
        for i in range(su):
            a = 2 * math.pi * i / su
            for j in range(sv):
                b = 2 * math.pi * j / sv
                verts.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
        for i in range(su):
            for j in range(sv):
                a = verts[i * sv + j]; b = verts[((i + 1) % su) * sv + j]
                c = verts[((i + 1) % su) * sv + (j + 1) % sv]; d = verts[i * sv + (j + 1) % sv]
                bm.faces.new((a, b, c, d))
    o = from_bmesh(name, bm, coll, smooth=kind in ('cyl', 'sphere', 'torus', 'cone'))
    o.location, o.rotation_euler, o.scale = loc, rot, scale
    return o


def box(name, size, loc=(0, 0, 0), rot=(0, 0, 0), coll=None, bev=0.0, seg=2, mat=None):
    o = prim('cube', name, loc, rot, (1, 1, 1), coll)
    for v in o.data.vertices:                # bake size into the mesh so bevel widths are in metres
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    if bev > 0:
        bevel(o, bev, seg)
    if mat:
        set_mat(o, mat)
    return o


def bevel(o, width=0.01, segments=2, angle=40.0, harden=True, limit='ANGLE'):
    m = o.modifiers.new('Bevel', 'BEVEL')
    m.width = width
    m.segments = segments
    m.limit_method = limit
    if limit == 'ANGLE':
        m.angle_limit = math.radians(angle)
    m.use_clamp_overlap = True
    try:
        m.harden_normals = harden
    except Exception:
        pass
    return m


def subsurf(o, levels=2):
    m = o.modifiers.new('Subd', 'SUBSURF')
    m.levels = levels
    m.render_levels = levels
    return m


def apply_mods(o):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    o.modifiers.clear()
    old = o.data
    o.data = me
    if old.users == 0:
        bpy.data.meshes.remove(old)
    return o


def set_mat(o, mat, slot=None):
    if slot is None:
        o.data.materials.clear()
        o.data.materials.append(mat)
    else:
        while len(o.data.materials) <= slot:
            o.data.materials.append(mat)
        o.data.materials[slot] = mat
    return o


def parent(child, par, keep=True):
    if keep:
        bpy.context.view_layer.update()      # matrix_world of fresh objects is stale until an update
        child.parent = par
        child.matrix_parent_inverse = par.matrix_world.inverted()
    else:
        child.parent = par
    return child


def empty(name, loc=(0, 0, 0), coll=None, kind='PLAIN_AXES', size=0.2):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = kind
    e.empty_display_size = size
    link(e, coll)
    e.location = loc
    return e


def join(objs, name=None):
    """Join mesh objects into the first (keeps materials)."""
    objs = [o for o in objs if o.type == 'MESH']
    if not objs:
        return None
    with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    if name:
        objs[0].name = name
    return objs[0]


def linked_copy(o, name=None, loc=None, rot=None, scale=None, coll=None):
    c = o.copy()
    if name:
        c.name = name
    link(c, coll or (o.users_collection[0] if o.users_collection else None))
    if loc is not None:
        c.location = loc
    if rot is not None:
        c.rotation_euler = rot
    if scale is not None:
        c.scale = scale
    return c


def text_mesh(body, name='txt', size=1.0, extrude=0.05, bevel_depth=0.0, align='CENTER', font=None, coll=None,
              spacing=1.0, resolution=4):
    cu = bpy.data.curves.new(name + '_cu', 'FONT')
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.bevel_depth = bevel_depth
    cu.bevel_resolution = 2
    cu.align_x = align
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
    return ob


def ring_profile(n, r_func):
    return [(r_func(i) * math.cos(2 * math.pi * i / n), r_func(i) * math.sin(2 * math.pi * i / n)) for i in range(n)]


def extrude_profile(name, outer, thick, holes=(), coll=None, smooth=False):
    """Solid prism from a 2D outline (list of (x,y)) along Z from 0..thick; holes = list of 2D outlines."""
    bm = bmesh.new()
    def ring(pts, z):
        return [bm.verts.new((x, y, z)) for x, y in pts]
    if not holes:
        b = ring(outer, 0.0)
        t = ring(outer, thick)
        n = len(outer)
        bm.faces.new(list(reversed(b)))
        bm.faces.new(t)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((b[i], b[j], t[j], t[i]))
    else:
        # single hole (annulus) bridged face-by-face; outer and hole must have equal point counts
        h = holes[0]
        n = len(outer)
        assert len(h) == n
        ob, ot = ring(outer, 0.0), ring(outer, thick)
        hb, ht = ring(h, 0.0), ring(h, thick)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ob[i], ob[j], ot[j], ot[i]))
            bm.faces.new((hb[j], hb[i], ht[i], ht[j]))
            bm.faces.new((ot[i], ot[j], ht[j], ht[i]))
            bm.faces.new((ob[j], ob[i], hb[i], hb[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return from_bmesh(name, bm, coll, smooth=smooth)


def gear_outline(teeth, r_root, r_tip, pts_per_tooth=8, tooth_frac=0.5):
    out = []
    n = teeth * pts_per_tooth
    for i in range(n):
        t = (i % pts_per_tooth) / pts_per_tooth
        # trapezoid tooth: rise 0..0.15, top 0.15..0.15+frac*0.7, fall, root
        a, b = 0.12, 0.12 + tooth_frac * 0.76
        if t < a:
            k = t / a
        elif t < b:
            k = 1.0
        elif t < b + 0.12:
            k = 1.0 - (t - b) / 0.12
        else:
            k = 0.0
        r = r_root + (r_tip - r_root) * k
        ang = 2 * math.pi * i / n
        out.append((r * math.cos(ang), r * math.sin(ang)))
    return out


# ----------------------------------------------------------------------------- animation

def fcurves(idblock):
    ad = idblock.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    out = []
    if hasattr(act, 'fcurves'):
        try:
            out = list(act.fcurves)
        except Exception:
            out = []
    if out:
        return out
    try:  # layered actions (4.4+ / 5.x)
        for layer in act.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    out.extend(cb.fcurves)
    except Exception:
        pass
    return out


def key(o, path, pairs, index=None, interp='BEZIER', easing='AUTO', handle='AUTO_CLAMPED'):
    """pairs: [(frame, value), ...]. value is a scalar (index given or scalar prop) or a tuple."""
    for f, v in pairs:
        if index is None:
            setattr(o, path, v)
            o.keyframe_insert(path, frame=f)
        else:
            getattr(o, path)[index] = v
            o.keyframe_insert(path, index=index, frame=f)
    for fc in fcurves(o):
        if fc.data_path == path and (index is None or fc.array_index == index):
            for kp in fc.keyframe_points:
                kp.interpolation = interp
                kp.easing = easing
                kp.handle_left_type = handle
                kp.handle_right_type = handle
    return o


def key_data(idb, owner_obj, path, pairs, index=None, interp='BEZIER'):
    """Keyframe a property on a datablock (light, camera data, material node socket...)."""
    for f, v in pairs:
        if index is None:
            setattr(idb, path, v)
            idb.keyframe_insert(path, frame=f)
        else:
            getattr(idb, path)[index] = v
            idb.keyframe_insert(path, index=index, frame=f)


def key_socket(sock, pairs, interp='BEZIER'):
    for f, v in pairs:
        sock.default_value = v
        sock.keyframe_insert('default_value', frame=f)


def linear(o, path=None):
    for fc in fcurves(o):
        if path and fc.data_path != path:
            continue
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def extrapolate(o, path=None, mode='LINEAR'):
    for fc in fcurves(o):
        if path and fc.data_path != path:
            continue
        fc.extrapolation = mode


def shake(o, amp=0.01, rot_amp=0.004, scale=10.0, seed=0, start=None, end=None):
    have = {(fc.data_path, fc.array_index) for fc in fcurves(o)}
    for path, a in (('location', amp), ('rotation_euler', rot_amp)):
        if a <= 0:
            continue
        for i in range(3):
            if (path, i) not in have:
                o.keyframe_insert(path, index=i, frame=bpy.context.scene.frame_start)
    for fc in fcurves(o):
        if fc.data_path not in ('location', 'rotation_euler'):
            continue
        a = amp if fc.data_path == 'location' else rot_amp
        if a <= 0:
            continue
        m = fc.modifiers.new('NOISE')
        m.scale = scale
        m.strength = a
        m.phase = seed * 13.7 + fc.array_index * 5.1 + (0 if fc.data_path == 'location' else 50)
        if start is not None:
            m.use_restricted_range = True
            m.frame_start = start
            m.frame_end = end
            m.blend_in = 2
            m.blend_out = 2


def look_at(o, target, up='Y'):
    t = Vector(target) if not hasattr(target, 'location') else target.matrix_world.translation
    d = t - Vector(o.location)
    o.rotation_euler = d.to_track_quat('-Z', up).to_euler()
    return o.rotation_euler.copy()


def look_rot(frm, to, roll=0.0):
    d = Vector(to) - Vector(frm)
    q = d.to_track_quat('-Z', 'Y')
    e = q.to_euler()
    if roll:
        m = q.to_matrix() @ Matrix.Rotation(roll, 3, 'Z')
        e = m.to_euler()
    return e


def cam_path(cam, keys, interp='BEZIER', target_obj=None):
    """keys: [(frame, loc, look_target, roll_rad), ...] -> loc + rotation keys (rotation unwrapped)."""
    prev = None
    for f, loc, tgt, roll in keys:
        cam.location = loc
        e = look_rot(loc, tgt, roll)
        if prev is not None:
            e.make_compatible(prev)
        prev = e.copy()
        cam.rotation_euler = e
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
    for fc in fcurves(cam):
        for kp in fc.keyframe_points:
            kp.interpolation = interp


def track_to(o, target):
    c = o.constraints.new('TRACK_TO')
    c.target = target
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'
    return c


def ease(t, kind='inout'):
    t = max(0.0, min(1.0, t))
    if kind == 'in':
        return t * t * t
    if kind == 'out':
        return 1 - (1 - t) ** 3
    return t * t * (3 - 2 * t)


# ----------------------------------------------------------------------------- camera & lights

def camera(name='Cam', loc=(0, -5, 1), target=None, lens=50, fstop=None, focus=None, sensor=36.0,
           clip=(0.01, 500), coll=None, ratio=1.6, blades=8):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_width = sensor
    cd.sensor_fit = 'HORIZONTAL'
    cd.clip_start, cd.clip_end = clip
    c = bpy.data.objects.new(name, cd)
    link(c, coll)
    c.location = loc
    if target is not None:
        look_at(c, target)
    if fstop:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
        cd.dof.aperture_blades = blades
        cd.dof.aperture_rotation = math.radians(10)
        cd.dof.aperture_ratio = ratio          # anamorphic oval bokeh
        if hasattr(focus, 'location'):
            cd.dof.focus_object = focus
        elif focus is not None:
            cd.dof.focus_distance = focus
    bpy.context.scene.camera = c
    return c


def light(kind='AREA', name='L', loc=(0, 0, 3), rot=(0, 0, 0), energy=100.0, color=(1, 1, 1), size=1.0,
          size_y=None, spot=45.0, blend=0.3, radius=0.05, coll=None, target=None, shape=None, spread=None,
          visible=False):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = color
    if kind == 'AREA':
        ld.shape = shape or ('RECTANGLE' if size_y else 'SQUARE')
        ld.size = size
        if size_y:
            ld.size_y = size_y
        if spread is not None:
            ld.spread = math.radians(spread)
    elif kind == 'SPOT':
        ld.spot_size = math.radians(spot)
        ld.spot_blend = blend
        ld.shadow_soft_size = radius
    elif kind == 'POINT':
        ld.shadow_soft_size = radius
    elif kind == 'SUN':
        ld.angle = math.radians(size)
    o = bpy.data.objects.new(name, ld)
    link(o, coll)
    o.location = loc
    o.rotation_euler = rot
    try:
        o.visible_camera = visible
        o.visible_glossy = True
    except Exception:
        pass
    if target is not None:
        look_at(o, target)
    return o


def kelvin(k):
    """Approximate blackbody RGB (linear-ish) for 1000..12000 K."""
    t = k / 100.0
    if t <= 66:
        r = 1.0
        g = max(0.0, min(1.0, (99.47 * math.log(t) - 161.12) / 255))
        b = 0.0 if t <= 19 else max(0.0, min(1.0, (138.52 * math.log(t - 10) - 305.04) / 255))
    else:
        r = max(0.0, min(1.0, 329.7 * ((t - 60) ** -0.1332) / 255))
        g = max(0.0, min(1.0, 288.1 * ((t - 60) ** -0.0755) / 255))
        b = 1.0
    return (r ** 2.2, g ** 2.2, b ** 2.2)


# ----------------------------------------------------------------------------- materials

class NB:
    """Tiny node builder: nb = NB(mat); n = nb.n('ShaderNodeTexNoise', Scale=4); nb.l(n, 'Fac', other, 'Roughness')."""

    def __init__(self, mat_or_tree):
        self.t = mat_or_tree.node_tree if hasattr(mat_or_tree, 'node_tree') else mat_or_tree
        self.N, self.L = self.t.nodes, self.t.links
        self.x = 0

    def n(self, kind, attrs=None, **inputs):
        node = self.N.new(kind)
        self.x -= 200
        node.location = (self.x, 0)
        for k, v in (attrs or {}).items():
            setattr(node, k, v)
        for k, v in inputs.items():
            k2 = k.replace('_', ' ')
            sock = node.inputs.get(k2) or node.inputs.get(k)
            if sock is None:
                raise KeyError(f'{kind} has no input {k2}: {[s.name for s in node.inputs]}')
            if isinstance(v, (tuple, list)) and len(v) == 3 and getattr(sock, 'type', '') == 'RGBA':
                v = (*v, 1.0)
            sock.default_value = v
        return node

    def l(self, a, a_out, b, b_in):
        ao = a.outputs[a_out] if isinstance(a_out, int) else a.outputs.get(a_out) or a.outputs[a_out]
        bi = b.inputs[b_in] if isinstance(b_in, int) else b.inputs.get(b_in) or b.inputs[b_in]
        self.L.new(ao, bi)
        return b

    def math(self, op, a=None, b=None, va=0.0, vb=0.0, clamp=False):
        m = self.n('ShaderNodeMath', {'operation': op, 'use_clamp': clamp})
        m.inputs[0].default_value = va
        m.inputs[1].default_value = vb
        if a is not None:
            self.L.new(a if not hasattr(a, 'outputs') else self.out_of(a), m.inputs[0])
        if b is not None:
            self.L.new(b if not hasattr(b, 'outputs') else self.out_of(b), m.inputs[1])
        return m

    def ramp(self, src, src_out, stops, interp='LINEAR'):
        r = self.n('ShaderNodeValToRGB')
        r.color_ramp.interpolation = interp
        els = r.color_ramp.elements
        while len(els) < len(stops):
            els.new(0.5)
        for e, (pos, col) in zip(els, stops):
            e.position = pos
            e.color = (*col, 1.0) if len(col) == 3 else col
        self.l(src, src_out, r, 0)
        return r

    def mix(self, a, b, fac, mode='MIX', dtype='RGBA'):
        m = self.n('ShaderNodeMix', {'data_type': dtype, 'blend_type': mode})
        idx = {'RGBA': (0, 6, 7), 'FLOAT': (0, 2, 3), 'VECTOR': (0, 4, 5)}[dtype]
        fac_s, a_s, b_s = (m.inputs[i] for i in idx)
        for sock, v in ((fac_s, fac), (a_s, a), (b_s, b)):
            if hasattr(v, 'outputs'):
                self.L.new(self.out_of(v), sock)
            elif hasattr(v, 'is_output'):
                self.L.new(v, sock)
            else:
                if isinstance(v, (tuple, list)) and len(v) == 3:
                    v = (*v, 1.0)
                sock.default_value = v
        return m

    def out_of(self, m):
        if m.bl_idname == 'ShaderNodeMix':
            return m.outputs[{'FLOAT': 0, 'VECTOR': 1, 'RGBA': 2}[m.data_type]]
        return m.outputs[0]


def new_mat(name):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    return m


def principled(m):
    return m.node_tree.nodes.get('Principled BSDF')


def mat_principled(name, color=(0.5, 0.5, 0.5), rough=0.5, metal=0.0, coat=0.0, coat_rough=0.05, spec=0.5,
                   emit=None, emit_strength=0.0, aniso=0.0, transmission=0.0, ior=1.45, alpha=1.0):
    m = new_mat(name)
    p = principled(m)
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Coat Weight'].default_value = coat
    p.inputs['Coat Roughness'].default_value = coat_rough
    p.inputs['Specular IOR Level'].default_value = spec
    p.inputs['Anisotropic'].default_value = aniso
    p.inputs['Transmission Weight'].default_value = transmission
    p.inputs['IOR'].default_value = ior
    p.inputs['Alpha'].default_value = alpha
    if emit:
        p.inputs['Emission Color'].default_value = (*emit, 1)
        p.inputs['Emission Strength'].default_value = emit_strength
    return m


def _coord(nb, scale=1.0, kind='Object'):
    tc = nb.n('ShaderNodeTexCoord')
    mp = nb.n('ShaderNodeMapping', Scale=(scale, scale, scale))
    nb.l(tc, kind, mp, 'Vector')
    return mp


def mat_metal(name='Steel', base=(0.55, 0.56, 0.58), rough=(0.18, 0.38), scale=1.0, bump=0.04, aniso=0.0,
              brushed=None, grime=0.25, scratches=0.3):
    """Machined metal: noise-driven roughness/colour, optional brushing direction, scratches, grime."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    p.inputs['Metallic'].default_value = 1.0
    p.inputs['Anisotropic'].default_value = aniso
    co = _coord(nb, scale)
    n1 = nb.n('ShaderNodeTexNoise', Scale=6.0, Detail=8.0, Roughness=0.6)
    nb.l(co, 'Vector', n1, 'Vector')
    n2 = nb.n('ShaderNodeTexNoise', Scale=40.0, Detail=4.0, Roughness=0.7)
    nb.l(co, 'Vector', n2, 'Vector')
    if brushed:  # streaks: stretch noise along an axis
        st = nb.n('ShaderNodeMapping', Scale=brushed)
        nb.l(co, 'Vector', st, 'Vector')
        n3 = nb.n('ShaderNodeTexNoise', Scale=60.0, Detail=2.0, Roughness=0.5)
        nb.l(st, 'Vector', n3, 'Vector')
    else:
        n3 = n2
    # scratches: thin wave lines thresholded
    sc_ = nb.n('ShaderNodeTexWave', attrs={'wave_type': 'BANDS', 'bands_direction': 'DIAGONAL'},
               Scale=3.0, Distortion=18.0, Detail=6.0, Detail_Scale=2.0)
    nb.l(co, 'Vector', sc_, 'Vector')
    scr = nb.ramp(sc_, 'Fac', [(0.0, (0, 0, 0)), (0.985, (0, 0, 0)), (1.0, (1, 1, 1))])
    rr = nb.ramp(n1, 'Fac', [(0.35, (rough[0],) * 3), (0.7, (rough[1],) * 3)])
    sfac = nb.math('MULTIPLY', None, None, vb=scratches)
    nb.l(scr, 'Color', sfac, 0)
    mix_r = nb.n('ShaderNodeMix', {'data_type': 'FLOAT'})
    nb.L.new(sfac.outputs[0], mix_r.inputs[0])
    nb.l(rr, 'Color', mix_r, 2)
    mix_r.inputs[3].default_value = rough[0] * 0.6
    nb.L.new(mix_r.outputs[0], p.inputs['Roughness'])
    dark = tuple(c * (1 - grime) for c in base)
    cr = nb.ramp(n2, 'Fac', [(0.3, dark), (0.65, base)])
    nb.l(cr, 'Color', p, 'Base Color')
    bmp = nb.n('ShaderNodeBump', Strength=bump, Distance=0.02)
    nb.l(n3, 'Fac', bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def mat_concentric(name='Machined', base=(0.6, 0.6, 0.62), rough=(0.14, 0.32), rings=180.0, bump=0.05,
                   center=(0, 0, 0), axis='Z', metal=1.0):
    """Lathe-turned face: concentric ring micro-grooves (spiral highlight) via radial distance bands."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    p.inputs['Metallic'].default_value = metal
    tc = nb.n('ShaderNodeTexCoord')
    mp = nb.n('ShaderNodeMapping', Location=tuple(-c for c in center))
    nb.l(tc, 'Object', mp, 'Vector')
    sep = nb.n('ShaderNodeSeparateXYZ')
    nb.l(mp, 'Vector', sep, 0)
    ax = {'Z': ('X', 'Y'), 'Y': ('X', 'Z'), 'X': ('Y', 'Z')}[axis]
    comb = nb.n('ShaderNodeCombineXYZ')
    nb.l(sep, ax[0], comb, 'X')
    nb.l(sep, ax[1], comb, 'Y')
    ln = nb.n('ShaderNodeVectorMath', {'operation': 'LENGTH'})
    nb.l(comb, 'Vector', ln, 0)
    mul = nb.math('MULTIPLY', ln, None, vb=rings)
    sin = nb.math('SINE', mul)
    nz = nb.n('ShaderNodeTexNoise', Scale=30.0, Detail=6.0)
    nb.l(tc, 'Object', nz, 'Vector')
    add = nb.math('MULTIPLY_ADD', sin, None, vb=0.5)
    add.inputs[2].default_value = 0.5
    bmp = nb.n('ShaderNodeBump', Strength=bump, Distance=0.01)
    nb.l(add, 0, bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    rr = nb.ramp(nz, 'Fac', [(0.3, (rough[0],) * 3), (0.75, (rough[1],) * 3)])
    nb.l(rr, 'Color', p, 'Roughness')
    cr = nb.ramp(nz, 'Fac', [(0.2, tuple(c * 0.8 for c in base)), (0.8, base)])
    nb.l(cr, 'Color', p, 'Base Color')
    # anisotropy tangential to the rings: tangent = radial UV around axis
    p.inputs['Anisotropic'].default_value = 0.6
    tg = nb.n('ShaderNodeTangent', {'direction_type': 'RADIAL', 'axis': axis})
    nb.l(tg, 'Tangent', p, 'Tangent')
    return m


def mat_brass(name='Brass', base=(0.78, 0.52, 0.22), dark=(0.38, 0.22, 0.08), rough=(0.16, 0.42), scale=1.0, worn=0.5):
    m = mat_metal(name, base=base, rough=rough, scale=scale, bump=0.03, grime=0.0)
    nb = NB(m)
    p = principled(m)
    co = _coord(nb, scale * 2.0)
    n = nb.n('ShaderNodeTexNoise', Scale=3.0, Detail=10.0, Roughness=0.65)
    nb.l(co, 'Vector', n, 'Vector')
    cr = nb.ramp(n, 'Fac', [(0.25, dark), (0.45 + 0.2 * (1 - worn), base), (0.9, tuple(min(1, c * 1.12) for c in base))])
    nb.l(cr, 'Color', p, 'Base Color')
    return m


def mat_gold(name='Gold', base=(1.0, 0.70, 0.30), rough=(0.10, 0.26), scale=1.0):
    return mat_brass(name, base=base, dark=(0.72, 0.42, 0.12), rough=rough, scale=scale, worn=0.15)


def mat_paint(name='Paint', color=(0.05, 0.06, 0.06), rough=(0.3, 0.55), scale=1.0, wear=0.3, edge_metal=(0.5, 0.5, 0.5)):
    """Painted steel with worn edges (pointiness drives metal showing through)."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    geo = nb.n('ShaderNodeNewGeometry')
    co = _coord(nb, scale)
    nz = nb.n('ShaderNodeTexNoise', Scale=12.0, Detail=8.0)
    nb.l(co, 'Vector', nz, 'Vector')
    pt = nb.ramp(geo, 'Pointiness', [(0.52, (0, 0, 0)), (0.6, (1, 1, 1))])
    mul = nb.math('MULTIPLY', None, None)
    nb.l(pt, 'Color', mul, 0)
    nb.l(nz, 'Fac', mul, 1)
    w = nb.math('MULTIPLY', mul, None, vb=wear * 3.0, clamp=True)
    cvar = nb.ramp(nz, 'Fac', [(0.3, tuple(c * 0.8 for c in color)), (0.7, tuple(min(1, c * 1.15) for c in color))])
    mixc = nb.mix(cvar, edge_metal, w)
    nb.L.new(nb.out_of(mixc), p.inputs['Base Color'])
    nb.L.new(w.outputs[0], p.inputs['Metallic'])
    rr = nb.ramp(nz, 'Fac', [(0.3, (rough[0],) * 3), (0.7, (rough[1],) * 3)])
    nb.l(rr, 'Color', p, 'Roughness')
    bmp = nb.n('ShaderNodeBump', Strength=0.04, Distance=0.01)
    nb.l(nz, 'Fac', bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def mat_emission(name='Emit', color=(1, 0.2, 0.1), strength=4.0):
    m = new_mat(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = (*color, 1)
    e.inputs['Strength'].default_value = strength
    nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m


def mat_strip(name='Strip', color=(0.85, 0.92, 1.0), strength=5.0, leds=0.0):
    """Practical fluorescent/LED strip: diffuser gradient across width, optional LED dot structure."""
    m = new_mat(name)
    nb = NB(m)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    e = nb.n('ShaderNodeEmission', Color=color, Strength=strength)
    tc = nb.n('ShaderNodeTexCoord')
    nz = nb.n('ShaderNodeTexNoise', Scale=3.0, Detail=2.0)
    nb.l(tc, 'Object', nz, 'Vector')
    r = nb.ramp(nz, 'Fac', [(0.3, (0.75,) * 3), (0.7, (1.0,) * 3)])
    mul = nb.n('ShaderNodeMix', {'data_type': 'RGBA', 'blend_type': 'MULTIPLY'})
    mul.inputs[0].default_value = 1.0
    mul.inputs[6].default_value = (*color, 1)
    nb.l(r, 'Color', mul, 7)
    nb.L.new(mul.outputs[2], e.inputs['Color'])
    nb.L.new(e.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m


def mat_glass(name='Glass', tint=(0.9, 0.95, 1.0), rough=0.02, ior=1.5):
    return mat_principled(name, color=tint, rough=rough, transmission=1.0, ior=ior)


def mat_rubber(name='Rubber', color=(0.012, 0.012, 0.013), rough=0.72):
    m = mat_principled(name, color=color, rough=rough, spec=0.35)
    nb = NB(m)
    p = principled(m)
    nz = nb.n('ShaderNodeTexNoise', Scale=80.0, Detail=4.0)
    bmp = nb.n('ShaderNodeBump', Strength=0.08, Distance=0.005)
    nb.l(nz, 'Fac', bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def mat_concrete(name='Concrete', base=(0.16, 0.165, 0.17), wet=0.6, scale=1.0, puddle_scale=0.4, contrast=1.0):
    """Concrete with wet patches: puddles = low roughness + darker base, cracks/stains noise."""
    m = new_mat(name)
    nb = NB(m)
    p = principled(m)
    co = _coord(nb, scale)
    n1 = nb.n('ShaderNodeTexNoise', Scale=2.5, Detail=12.0, Roughness=0.62)
    nb.l(co, 'Vector', n1, 'Vector')
    n2 = nb.n('ShaderNodeTexNoise', Scale=puddle_scale, Detail=6.0, Roughness=0.55)
    nb.l(co, 'Vector', n2, 'Vector')
    vor = nb.n('ShaderNodeTexVoronoi', Scale=18.0)
    nb.l(co, 'Vector', vor, 'Vector')
    if wet > 0:
        puddle = nb.ramp(n2, 'Fac', [(0.62 - wet * 0.2, (0, 0, 0)), (0.67 - wet * 0.2, (1, 1, 1))])
    else:
        puddle = nb.n('ShaderNodeValue')
        puddle.outputs[0].default_value = 0.0
    lo, hi = 1 - 0.45 * contrast, 1 + 0.35 * contrast
    base_c = nb.ramp(n1, 'Fac', [(0.25, tuple(c * lo for c in base)), (0.5, base), (0.8, tuple(min(1, c * hi) for c in base))])
    darker = nb.mix(base_c, tuple(c * 0.35 for c in base), puddle)
    nb.L.new(nb.out_of(darker), p.inputs['Base Color'])
    rr = nb.ramp(n1, 'Fac', [(0.3, (0.55,) * 3), (0.7, (0.85,) * 3)])
    rmix = nb.mix(rr, (0.04,) * 3, puddle)
    nb.L.new(nb.out_of(rmix), p.inputs['Roughness'])
    bmp = nb.n('ShaderNodeBump', Strength=0.25, Distance=0.02)
    inv = nb.math('SUBTRACT', None, None, va=1.0)
    nb.L.new(puddle.outputs[0], inv.inputs[1])
    hm = nb.math('MULTIPLY', vor, inv)
    nb.l(vor, 'Distance', hm, 0)
    nb.l(hm, 0, bmp, 'Height')
    nb.l(bmp, 'Normal', p, 'Normal')
    return m


def mat_asphalt(name='Asphalt', base=(0.03, 0.03, 0.033), wet=0.7, scale=1.0, puddle_scale=0.25):
    m = mat_concrete(name, base=base, wet=wet, scale=scale * 2.0, puddle_scale=puddle_scale)
    return m


def mat_volume(name='Haze', density=0.02, color=(0.8, 0.82, 0.85), anisotropy=0.5, noise_scale=None,
               contrast=(0.4, 0.7), emission=None, emission_strength=0.0):
    m = new_mat(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    nb = NB(m)
    v = nb.n('ShaderNodeVolumePrincipled', Color=color, Density=density, Anisotropy=anisotropy)
    if emission:
        v.inputs['Emission Color'].default_value = (*emission, 1)
        v.inputs['Emission Strength'].default_value = emission_strength
    if noise_scale:
        tc = nb.n('ShaderNodeTexCoord')
        nz = nb.n('ShaderNodeTexNoise', Scale=noise_scale, Detail=3.0)
        nb.l(tc, 'Object', nz, 'Vector')
        r = nb.ramp(nz, 'Fac', [(contrast[0], (0, 0, 0)), (contrast[1], (1, 1, 1))])
        mul = nb.math('MULTIPLY', None, None, vb=density)
        nb.l(r, 'Color', mul, 0)
        nb.l(mul, 0, v, 'Density')
    nt.links.new(v.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
    return m


def volume_box(name, loc, size, mat, coll=None):
    o = prim('cube', name, loc, (0, 0, 0), size, coll)
    set_mat(o, mat)
    try:
        o.visible_shadow = False
    except Exception:
        pass
    return o


def motes(name, count, bounds_min, bounds_max, r=(0.0015, 0.004), seed=1, coll=None, mat=None, drift=(0, 0, 0.02),
          start=1, end=100):
    """Sparse dust: tiny icospheres scattered in a box, drifting slowly (keyed on a parent)."""
    rng = random.Random(seed)
    bm = bmesh.new()
    for i in range(count):
        p = Vector([rng.uniform(a, b) for a, b in zip(bounds_min, bounds_max)])
        rad = rng.uniform(*r)
        res = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rad)
        bmesh.ops.translate(bm, verts=res['verts'], vec=p)
    o = from_bmesh(name, bm, coll, smooth=True)
    if mat is None:
        mat = mat_principled(name + '_m', color=(0.8, 0.75, 0.65), rough=0.6, spec=0.3)
        principled(mat).inputs['Transmission Weight'].default_value = 0.4
    set_mat(o, mat)
    try:
        o.visible_shadow = False
    except Exception:
        pass
    key(o, 'location', [(start, (0, 0, 0)), (end, drift)], interp='LINEAR')
    return o


# ----------------------------------------------------------------------------- CLI

def _argv():
    a = sys.argv
    return a[a.index('--') + 1:] if '--' in a else []


def arg(name, default=None, cast=str):
    a = _argv()
    if name in a:
        i = a.index(name)
        if i + 1 < len(a) and not a[i + 1].startswith('--'):
            return cast(a[i + 1])
        return True
    return default


def finish(shot):
    import time
    sc = bpy.context.scene
    samples = arg('--samples', None, int)
    if samples:
        sc.cycles.samples = samples
    pct = arg('--pct', 100, int)
    sc.render.resolution_percentage = pct
    if arg('--nomb'):
        sc.render.use_motion_blur = False
    if arg('--save'):
        os.makedirs(os.path.join(FILM, 'blend'), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(FILM, 'blend', f'{shot}.blend'))
    stills = arg('--stills', None) or arg('--still', None)
    if stills:
        os.makedirs(os.path.join(FILM, 'tests'), exist_ok=True)
        tag = arg('--tag', '')
        isf = sc.render.image_settings
        isf.file_format = 'JPEG'
        isf.quality = 92
        for f in [int(x) for x in str(stills).split(',')]:
            sc.frame_set(f)
            sc.render.filepath = os.path.join(FILM, 'tests', f'{shot}{tag}_f{f:04d}.jpg')
            t = time.time()
            bpy.ops.render.render(write_still=True)
            print(f'[still] {sc.render.filepath} {time.time() - t:.1f}s', flush=True)
    if arg('--anim'):
        a = arg('--from', sc.frame_start, int)
        b = arg('--to', sc.frame_end, int)
        outdir = arg('--outdir', os.path.join(FILM, 'out', 'renders', shot))
        if not os.path.isabs(outdir):
            outdir = os.path.join(FILM, outdir)
        os.makedirs(outdir, exist_ok=True)
        step = arg('--step', 1, int)
        if arg('--jpg'):
            sc.render.image_settings.file_format = 'JPEG'
            sc.render.image_settings.quality = 85
        ext = '.jpg' if arg('--jpg') else '.png'
        overwrite = bool(arg('--overwrite', False))
        for f in range(a, b + 1, step):
            fp = os.path.join(outdir, f'{f:04d}{ext}')
            if os.path.exists(fp) and not overwrite:
                continue
            sc.frame_set(f)
            sc.render.filepath = fp
            t = time.time()
            bpy.ops.render.render(write_still=True)
            print(f'[frame] {shot} {f} {time.time() - t:.1f}s', flush=True)
        print('[anim] done', outdir, flush=True)
