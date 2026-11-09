"""Lead's shots. S03: the building section animates — the floor plate over the vault slides aside (the false floor),
the orange connection draws from the tenant's office down to the vault, the camera eases in.

python3 films/tumbler/tools/rb.py films/false_floor/shots/lead.py -- --shot S03 --stills 7,120,240 --pct 30 --samples 12
"""
import sys, os, math, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
import bmesh

SHOT = arg('--shot', 'S03')
_ALL = {s['id']: s for s in json.load(open(os.path.join(FF, 'script', 'SHOTS_v2.json')))['shots']}
_ALL.update({s['id']: s for s in json.load(open(os.path.join(FF, 'script', 'SEQ_COLD.json')))['shots']})
SH = _ALL[SHOT]
N = SH['render_frames']

if SHOT == 'S03':
    from section import build_section
    h = build_section()
    sc, cam, lid = h['scene'], h['cam'], h['lid']
    setup_render(1, N, res=RES_FINAL, samples=40, look='Medium High Contrast', mb=True)
    oz, vz = h['oz'], h['vz']
    # replace the static connection line with one that draws on (origin at the office end)
    for o in list(bpy.data.objects):
        if o.name.startswith(('Connection', 'ConnDot')):
            bpy.data.objects.remove(o)
    p0, p1 = Vector((-3.2, 0.9, oz + 0.35)), Vector((-1.2, 0.6, vz + 0.5))
    d = p1 - p0
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.035, radius2=0.035, depth=d.length)
    for v in bm.verts:
        v.co.z += d.length / 2
    line = from_bmesh('ConnectionAnim', bm)
    line.location = p0
    line.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    set_mat(line, bpy.data.materials['ConnectLine'])
    top = prim('sphere', 'ConnDotTop', p0, seg=16, ring=8, r=0.12)
    bot = prim('sphere', 'ConnDotBot', p1, seg=16, ring=8, r=0.12)
    for o in (top, bot):
        set_mat(o, bpy.data.materials['ConnectLine'])
    # timing (cut frames 7..N-6): lid closed -> slides aside; then the line draws down; dots pop on with it
    lo = lid.location.copy()
    closed = (lo.x - 4.2, lo.y, lo.z - 0.36)
    key(lid, 'location', [(1, closed), (36, closed), (70, (lo.x - 4.2, lo.y, lo.z)), (120, tuple(lo))])
    key(line, 'scale', [(1, (1, 1, 0.001)), (110, (1, 1, 0.001)), (170, (1, 1, 1))])
    key(top, 'scale', [(1, (0, 0, 0)), (104, (0, 0, 0)), (112, (1, 1, 1))])
    key(bot, 'scale', [(1, (0, 0, 0)), (166, (0, 0, 0)), (174, (1, 1, 1))])
    # the vault is dark until the false floor opens; then its orange light fades up
    em = bpy.data.materials['VaultGlow'].node_tree.nodes.get('Emission')
    key_socket(em.inputs['Strength'], [(1, 0.0), (52, 0.0), (118, 2.2)])
    for ln_name, full in (('VaultLight', 430.0), ('VaultUp', 220.0)):
        lo_ = bpy.data.objects[ln_name]
        key(lo_.data, 'energy', [(1, 0.0), (52, 0.0), (118, full)])
    gm = bpy.data.materials.get('VaultBoxes')
    # camera: slow ease-in push
    key(cam.data, 'ortho_scale', [(1, 47.0), (N, 42.5)])
    c0 = cam.location.copy()
    key(cam, 'location', [(1, tuple(c0)), (N, (c0.x - 0.6, c0.y, c0.z - 0.4))])
    finish(SHOT)


if SHOT in ('C2', 'C12'):
    # Cold open: a perspective camera travels down (C2) / up (C12) in front of the cut building section.
    from section import build_section
    h = build_section()
    sc = h['scene']
    oz, vz = h['oz'], h['vz']
    setup_render(1, N, res=RES_FINAL, samples=40, look='Medium High Contrast', mb=True, shutter=0.5)
    for o in list(bpy.data.objects):          # the old ortho camera + static line go; we draw our own
        if o.name.startswith(('Connection', 'ConnDot')) or o.type == 'CAMERA':
            bpy.data.objects.remove(o)
    cam = camera('Cam' + SHOT, lens=26, fstop=None)
    sc.camera = cam
    street = ((-0.4, -15.5, 3.2), (-0.4, 0.0, -1.0))
    vault = ((-0.6, -7.4, -5.4), (-0.4, 0.4, -6.9))
    office = ((-3.0, -7.6, 8.6), (-3.2, 1.6, 8.3))
    if SHOT == 'C2':
        # Monday: the vault already lit; plunge from street level down to Level -2, easing in
        cam_path(cam, [(1, *street, 0.0), (int(N * 0.55), (-0.5, -10.5, -2.6), (-0.4, 0.2, -5.5), 0.0), (N, *vault, 0.0)])
    else:
        # rise from the vault up through the floors; the tenant's office lights; the orange line draws up to it
        cam_path(cam, [(1, *vault, 0.0), (int(N * 0.45), (-1.6, -10.8, 1.5), (-1.8, 0.8, 1.0), 0.0), (N, *office, 0.0)])
        p0, p1 = Vector((-1.2, 0.6, vz + 0.5)), Vector((-3.2, 0.9, oz + 0.35))
        d = p1 - p0
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.035, radius2=0.035, depth=d.length)
        for v in bm.verts:
            v.co.z += d.length / 2
        line = from_bmesh('ConnectionRise', bm)
        line.location = p0
        line.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        set_mat(line, bpy.data.materials['ConnectLine'])
        top = prim('sphere', 'ConnDotTop', p1, seg=16, ring=8, r=0.12)
        bot = prim('sphere', 'ConnDotBot', p0, seg=16, ring=8, r=0.12)
        for o in (top, bot):
            set_mat(o, bpy.data.materials['ConnectLine'])
        a0, a1 = int(N * 0.25), int(N * 0.85)
        key(line, 'scale', [(1, (1, 1, 0.001)), (a0, (1, 1, 0.001)), (a1, (1, 1, 1))])
        key(bot, 'scale', [(1, (0, 0, 0)), (a0 - 4, (0, 0, 0)), (a0 + 4, (1, 1, 1))])
        key(top, 'scale', [(1, (0, 0, 0)), (a1 - 4, (0, 0, 0)), (a1 + 4, (1, 1, 1))])
        # the office window wakes as the camera arrives
        win = bpy.data.materials['OfficeWindow'].node_tree.nodes.get('Emission')
        key_socket(win.inputs['Strength'], [(1, 0.15), (int(N * 0.6), 0.15), (int(N * 0.9), 2.4)])
        ol = bpy.data.objects['OfficeLight']
        key(ol.data, 'energy', [(1, 10.0), (int(N * 0.6), 10.0), (int(N * 0.9), 220.0)])
    for fc in fcurves(cam):
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
    shake(cam, 0.01, 0.002, scale=18, seed=31)
    finish(SHOT)
