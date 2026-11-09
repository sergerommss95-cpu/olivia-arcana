"""Lead's shots. S03: the building section animates — the floor plate over the vault slides aside (the false floor),
the orange connection draws from the tenant's office down to the vault, the camera eases in.

python3 films/tumbler/tools/rb.py films/false_floor/shots/lead.py -- --shot S03 --stills 7,120,240 --pct 30 --samples 12
"""
import sys, os, math, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
import bmesh

SHOT = arg('--shot', 'S03')
SH = {s['id']: s for s in json.load(open(os.path.join(FF, 'script', 'SHOTS_v2.json')))['shots']}[SHOT]
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
