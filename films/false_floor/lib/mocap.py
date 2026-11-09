"""CMU motion capture (ASF/AMC, mocap.cs.cmu.edu, free for any use) -> our MakeHuman CMU rig, by direction matching.

    M = load('02', '02_01')                       # cached under films/vendor/cmu/
    apply(h, M, start_frame=1, src_range=(0, 240), step=1.0, pos=(x, y), yaw_deg=0, scale=None)

Forward kinematics follows the ASF/AMC convention (local = C * R(dofs) * C^-1, R = Rz Ry Rx). Each target bone is
aimed along its source segment's world direction frame by frame; the Hips bone takes the full pelvis orientation and
the rig's root follows the subject's root position (scaled to our character's leg length).
"""
import math, os, urllib.request
import numpy as np
import bpy
from mathutils import Matrix, Vector, Quaternion

CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'vendor', 'cmu')
UNIT = (1.0 / 0.45) * 2.54 / 100.0                          # CMU length unit -> metres

# our bone -> (source segment start bone, source segment end bone)
MAP = {
    'LowerBack': 'lowerback', 'Spine': 'upperback', 'Spine1': 'thorax', 'Neck': 'lowerneck', 'Neck1': 'upperneck',
    'Head': 'head', 'LeftShoulder': 'lclavicle', 'LeftArm': 'lhumerus', 'LeftForeArm': 'lradius', 'LeftHand': 'lwrist',
    'RightShoulder': 'rclavicle', 'RightArm': 'rhumerus', 'RightForeArm': 'rradius', 'RightHand': 'rwrist',
    'LeftUpLeg': 'lfemur', 'LeftLeg': 'ltibia', 'LeftFoot': 'lfoot', 'LeftToeBase': 'ltoes',
    'RightUpLeg': 'rfemur', 'RightLeg': 'rtibia', 'RightFoot': 'rfoot', 'RightToeBase': 'rtoes',
}
ORDER = ['Hips', 'LowerBack', 'Spine', 'Spine1', 'Neck', 'Neck1', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
         'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase',
         'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase']


def _get(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not os.path.exists(path):
        req = urllib.request.Request(url, headers={'User-Agent': 'false-floor-production/1.0'})
        with urllib.request.urlopen(req, timeout=120) as r:
            open(path, 'wb').write(r.read())
    return path


def _euler(ax, ay, az):
    cx, sx, cy, sy, cz, sz = math.cos(ax), math.sin(ax), math.cos(ay), math.sin(ay), math.cos(az), math.sin(az)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Rz @ Ry @ Rx


def parse_asf(path):
    bones, hier, sect, cur = {'root': dict(name='root', dof=['tx', 'ty', 'tz', 'rx', 'ry', 'rz'], dir=np.zeros(3), length=0.0,
                                         C=np.eye(3))}, {}, None, None
    for ln in open(path):
        t = ln.split()
        if not t or t[0].startswith('#'):
            continue
        if t[0].startswith(':'):
            sect = t[0][1:]
            continue
        if sect == 'root' and t[0] == 'axis':
            pass
        if sect == 'root' and t[0] == 'orientation':
            bones['root']['C'] = _euler(*[math.radians(float(v)) for v in t[1:4]])
        if sect == 'bonedata':
            if t[0] == 'begin':
                cur = {}
            elif t[0] == 'name':
                cur['name'] = t[1]
            elif t[0] == 'direction':
                cur['dir'] = np.array([float(v) for v in t[1:4]])
            elif t[0] == 'length':
                cur['length'] = float(t[1]) * UNIT
            elif t[0] == 'axis':
                cur['C'] = _euler(*[math.radians(float(v)) for v in t[1:4]])
            elif t[0] == 'dof':
                cur['dof'] = t[1:]
            elif t[0] == 'end':
                cur.setdefault('dof', [])
                bones[cur['name']] = cur
        if sect == 'hierarchy' and t[0] not in ('begin', 'end'):
            for c in t[1:]:
                hier[c] = t[0]
    return bones, hier


def parse_amc(path):
    frames, cur = [], None
    for ln in open(path):
        t = ln.split()
        if not t or t[0].startswith('#') or t[0].startswith(':'):
            continue
        if len(t) == 1 and t[0].isdigit():
            cur = {}
            frames.append(cur)
            continue
        if cur is not None:
            cur[t[0]] = [float(v) for v in t[1:]]
    return frames


def load(subject, trial):
    s = subject.zfill(2)
    asf = _get(f'http://mocap.cs.cmu.edu/subjects/{s}/{s}.asf', os.path.join(CACHE, f'{s}.asf'))
    amc = _get(f'http://mocap.cs.cmu.edu/subjects/{s}/{trial}.amc', os.path.join(CACHE, f'{trial}.amc'))
    bones, hier = parse_asf(asf)
    return dict(bones=bones, hier=hier, frames=parse_amc(amc), name=trial)


def fk(M, fr):
    """World start/end points (Y-up, metres) of every segment for one AMC frame."""
    B, H = M['bones'], M['hier']
    mot = M['frames'][fr]
    order = ['root']
    i = 0
    while i < len(order):
        order += [c for c, p in H.items() if p == order[i]]
        i += 1
    W, P0, P1 = {}, {}, {}
    r = mot['root']
    W['root'] = B['root']['C'] @ _euler(*[math.radians(v) for v in r[3:6]]) @ B['root']['C'].T
    P0['root'] = P1['root'] = np.array(r[:3]) * UNIT
    for b in order[1:]:
        bd = B[b]
        rot = [0.0, 0.0, 0.0]
        vals = mot.get(b, [])
        for k, d in enumerate(bd['dof']):
            if k < len(vals):
                rot['xyz'.index(d[1])] = math.radians(vals[k])
        W[b] = W[H[b]] @ bd['C'] @ _euler(*rot) @ bd['C'].T
        P0[b] = P1[H[b]]
        P1[b] = P0[b] + bd['length'] * (W[b] @ bd['dir'])
    return W, P0, P1


def _zup(v):
    return Vector((v[0], -v[2], v[1]))


def _curl(rig, amount):
    from mathutils import Euler
    for side in ('Left', 'Right'):
        for bn, deg in ((f'{side}FingerBase', 38), (f'{side}HandFinger1', 75)):
            rig.pose.bones[bn].rotation_quaternion = Euler((math.radians(deg * amount), 0, 0), 'XYZ').to_quaternion()
        t = 'LThumb' if side == 'Left' else 'RThumb'
        rig.pose.bones[t].rotation_quaternion = Euler((math.radians(20 * amount), 0,
                                                       math.radians((-1 if side == 'Left' else 1) * 25 * amount)), 'XYZ').to_quaternion()


def apply(h, M, start_frame=1, src_range=None, step=1.0, pos=(0.0, 0.0), yaw_deg=0.0, scale=None, root_motion=True, hands=0.35):
    """Bake CMU motion onto human h. Source frames are 120 fps; step=5 gives 24 fps real time (smaller = slow-mo)."""
    rig = h.rig
    a, b = src_range or (0, len(M['frames']) - 1)
    # leg-length scale: source femur+tibia vs ours
    if scale is None:
        bl = rig.data.bones
        ours = bl['LeftUpLeg'].length + bl['LeftLeg'].length
        src = M['bones']['lfemur']['length'] + M['bones']['ltibia']['length']
        scale = ours / src
    Ryaw = Matrix.Rotation(math.radians(yaw_deg), 3, 'Z')
    hidden = []
    for ob in [h.body, h.eyes] + list(h.shells):          # cheap depsgraph while baking
        for m in ob.modifiers:
            if m.show_viewport:
                m.show_viewport = False
                hidden.append(m)
    _, P00, _ = fk(M, a)
    root0 = _zup(P00['root'])
    # twist references: each bone's local 'front' (or 'up' for feet/toes) axis, from the rest pose (rig faces -Y)
    for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    bpy.context.view_layer.update()
    TW = {}
    for name in ORDER[1:]:
        bone = rig.data.bones[name]
        Rl = bone.matrix_local.to_3x3()
        ref_world = Vector((0, 0, 1)) if name.endswith(('Foot', 'ToeBase')) else Vector((0, -1, 0))
        src_ref = np.array([0.0, 1.0, 0.0]) if name.endswith(('Foot', 'ToeBase')) else np.array([0.0, 0.0, 1.0])
        TW[name] = (Rl.inverted() @ ref_world, src_ref)
    prevq = {}
    rest_hips_z = rig.data.bones['Hips'].head_local.z
    f, src = start_frame, float(a)
    while src <= b:
        W, P0, P1 = fk(M, int(src))
        for pb in rig.pose.bones:
            pb.matrix_basis = Matrix.Identity(4)
        rig.location = (0, 0, 0)
        rig.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        # root: position (scaled, relative to the first frame) and pelvis orientation from the hip line + spine
        root = _zup(P0['root'])
        off = (root - root0) * scale
        if not root_motion:
            off = Vector((0, 0, off.z))
        hips = rig.pose.bones['Hips']
        lh, rh = _zup(P1['lhipjoint']), _zup(P1['rhipjoint'])
        up = (_zup(P1['lowerback']) - _zup(P0['lowerback'])).normalized()
        right_src = (rh - lh).normalized()
        rest = rig.data.bones['Hips'].matrix_local.to_3x3()
        # rest frame of our pelvis: up = bone Y, right = from left hip to right hip in rest
        r_up = (rest @ Vector((0, 1, 0))).normalized()
        r_right = (rig.data.bones['RightUpLeg'].head_local - rig.data.bones['LeftUpLeg'].head_local).normalized()

        def frame(u, r):
            r = (r - u * r.dot(u)).normalized()
            return Matrix((r, u, r.cross(u))).transposed()
        Rw = Ryaw @ frame(up, right_src) @ frame(r_up, r_right).inverted()
        m = (Rw @ rest).to_4x4()
        m.translation = Vector(hips.bone.head_local) + Vector((0, 0, 0))
        hips.matrix = m
        bpy.context.view_layer.update()
        for ob_name in ORDER[1:]:
            sname = MAP[ob_name]
            d = _zup(P1[sname]) - _zup(P0[sname])
            if d.length < 1e-6:
                continue
            _aim_fast(rig, ob_name, Ryaw @ d)
            # twist: turn the bone about its own axis so its front/up matches the captured segment's
            loc_ref, src_ref = TW[ob_name]
            want_ref = Ryaw @ _zup(W[sname] @ src_ref)
            _twist(rig, ob_name, loc_ref, want_ref)
        _curl(rig, hands)                      # relaxed, natural hands (not splayed)
        rig.location = Vector((pos[0], pos[1], 0)) + Ryaw @ Vector((off.x, off.y, 0)) + Vector((0, 0, off.z))
        rig.keyframe_insert('location', frame=f)
        for pb in rig.pose.bones:
            q = pb.rotation_quaternion.copy()
            if pb.name in prevq and q.dot(prevq[pb.name]) < 0:      # keep quaternions continuous (no flips in blur)
                q.negate()
                pb.rotation_quaternion = q
            prevq[pb.name] = q
            pb.keyframe_insert('rotation_quaternion', frame=f)
            pb.keyframe_insert('location', frame=f)
        f += 1
        src += step
    for m in hidden:
        m.show_viewport = True
    return f - 1


def _aim_fast(rig, bone, world_dir):
    pb = rig.pose.bones[bone]
    cur = (pb.tail - pb.head).normalized()
    want = Vector(world_dir).normalized()
    q = cur.rotation_difference(want)
    m = pb.matrix.copy()
    head = m.to_translation()
    pb.matrix = Matrix.Translation(head) @ q.to_matrix().to_4x4() @ Matrix.Translation(-head) @ m
    bpy.context.view_layer.update()


def _twist(rig, bone, loc_ref, want_world):
    """Rotate a pose bone about its own axis so that its local reference axis points as close as possible to
    want_world (both projected on the plane perpendicular to the bone)."""
    pb = rig.pose.bones[bone]
    M3 = pb.matrix.to_3x3()
    axis = (M3 @ Vector((0, 1, 0))).normalized()
    cur = M3 @ loc_ref
    cur = cur - axis * cur.dot(axis)
    w = Vector(want_world) - axis * Vector(want_world).dot(axis)
    if cur.length < 1e-5 or w.length < 1e-5:
        return
    cur.normalize()
    w.normalize()
    ang = math.atan2(cur.cross(w).dot(axis), max(-1.0, min(1.0, cur.dot(w))))
    m = pb.matrix.copy()
    head = m.to_translation()
    pb.matrix = Matrix.Translation(head) @ Matrix.Rotation(ang, 4, axis) @ Matrix.Translation(-head) @ m
    bpy.context.view_layer.update()
