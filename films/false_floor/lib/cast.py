"""The approved False Floor v2 cast (Collin, 9 Nov: "people stills approved"). Build characters ONLY through here so
every shot uses identical looks. Proposed, original faces: a dramatization, not likenesses of the real people.

    import cast as CA
    k = CA.make('king')                     # tenant | genius | monster | speedy | king | guard | vancamp
    HU.place(k, x, y, yaw_deg)              # rig faces -Y at yaw 0; yaw 180 faces +Y (toward the vault door)
    CA.reach(k, 'R', (x, y, z))             # point an arm at a world target (elbow drops naturally)
    CA.arms_down(k, 'L'); CA.head_turn(k, yaw=30, pitch=-5)
    CA.torch(k, 'R', aim_at)                # small black torch in the hand + a hard spot light
    import mocap as MC; MC.apply(k, MC.load('02', '02_01'), start_frame=1, src_range=(0, 300), step=5, pos=(x, y), yaw_deg=180)
"""
import bpy
from mathutils import Vector
import human as HU
import mocap as MC

DARK = dict(tint=(0.3, 0.31, 0.34), sat=0.4, val=0.65)
GLOVES, BEANIE = HU.OUTFITS['crew_dark'][3], HU.OUTFITS['crew_dark'][4]

SPEC = {   # exactly the approved lineup (stills/v2/D_cast_lineup.jpg): each character is recognisable by outfit
    'tenant': dict(gender=1, age=50, muscle=0.45, weight=0.62, height=0.52, skin='olive',
                   assets=[('clothes/male_elegantsuit01', {}), ('clothes/shoes04', {}),
                           ('hair/short02', dict(tint=(0.55, 0.5, 0.48), sat=0.4)), ('eyebrows/eyebrow001', {})]),
    'genius': dict(gender=1, age=45, muscle=0.35, weight=0.3, height=0.6, skin='light',
                   assets=[('clothes/male_casualsuit05', DARK), ('clothes/shoes03', {}), ('hair/short04', {}),
                           ('eyebrows/eyebrow001', {})], outfit=[GLOVES]),
    'monster': dict(gender=1, age=40, muscle=0.85, weight=0.8, height=0.75, skin='ruddy',
                    assets=[('clothes/male_worksuit01', dict(tint=(0.45, 0.42, 0.38), sat=0.35, val=0.75)), ('clothes/shoes03', {}),
                            ('eyebrows/eyebrow003', {})], outfit=[BEANIE]),
    'speedy': dict(gender=1, age=55, muscle=0.4, weight=0.55, height=0.4, skin='olive',
                   assets=[('clothes/male_casualsuit03', dict(sat=0.6, val=0.85)), ('clothes/shoes01', dict(tint=(0.16, 0.12, 0.1), sat=0.3)),
                           ('hair/short01', dict(tint=(0.6, 0.58, 0.56))), ('eyebrows/eyebrow001', {})]),
    'king': dict(gender=1, age=72, muscle=0.3, weight=0.45, height=0.35, skin='pale',
                 assets=[('clothes/male_elegantsuit01', dict(tint=(0.75, 0.62, 0.48), sat=0.5, val=1.3)),
                         ('clothes/shoes01', dict(tint=(0.16, 0.12, 0.1), sat=0.3)), ('clothes/fedora01', dict(tint=(0.5, 0.45, 0.38))),
                         ('eyebrows/eyebrow003', dict(tint=(1.6, 1.6, 1.6)))]),
    'guard': dict(gender=1, age=48, muscle=0.5, weight=0.65, height=0.5, skin='light',     # navy uniform blazer + tie
                  assets=[('clothes/male_elegantsuit01', dict(tint=(0.32, 0.38, 0.62), sat=0.55, val=0.9)), ('clothes/shoes04', {}),
                          ('hair/short04', dict(tint=(0.7, 0.66, 0.62))), ('eyebrows/eyebrow001', {})]),
    'vancamp': dict(gender=1, age=68, muscle=0.45, weight=0.55, height=0.45, skin='ruddy',
                    assets=[('clothes/male_casualsuit05', dict(tint=(0.55, 0.6, 0.45), sat=0.5)), ('clothes/shoes02', {}),
                            ('clothes/fedora01', dict(tint=(0.35, 0.33, 0.28))), ('eyebrows/eyebrow003', {})]),
}


def make(who, name=None):
    return HU.make_human(name or who, **SPEC[who])


def reach(h, side, target, elbow_drop=0.12):
    bpy.context.view_layer.update()
    S_ = 'Left' if side == 'L' else 'Right'
    sh = h.rig.matrix_world @ h.rig.pose.bones[f'{S_}Arm'].head
    t = Vector(target)
    MC.shoulder_follow(h.rig, f'{S_}Shoulder', (sh + (t - sh) * 0.5 - Vector((0, 0, elbow_drop))) - sh)
    bpy.context.view_layer.update()
    sh = h.rig.matrix_world @ h.rig.pose.bones[f'{S_}Arm'].head
    HU.aim(h, f'{S_}Arm', (sh + (t - sh) * 0.5 - Vector((0, 0, elbow_drop))) - sh)
    el = h.rig.matrix_world @ h.rig.pose.bones[f'{S_}ForeArm'].head
    HU.aim(h, f'{S_}ForeArm', t - el)


def arms_down(h, side, out=0.15, fwd=0.05):
    R3 = h.rig.matrix_world.to_3x3()
    s = 1 if side == 'L' else -1
    S_ = 'Left' if side == 'L' else 'Right'
    MC.shoulder_follow(h.rig, f'{S_}Shoulder', R3 @ Vector((s * out, -fwd, -1)))
    HU.aim(h, f'{S_}Arm', R3 @ Vector((s * out, -fwd, -1)))
    HU.aim(h, f'{S_}ForeArm', R3 @ Vector((s * out * 0.5, -fwd - 0.15, -1)))


def head_turn(h, yaw=0.0, pitch=0.0):
    HU.rot(h, 'Neck1', x=pitch * 0.5, z=yaw * 0.4)
    HU.rot(h, 'Head', x=pitch * 0.5, z=yaw * 0.6)


def torch(h, side, aim_at, power=900.0, parent_to_hand=True):
    """Hand torch: a black cylinder + hard spot. Parented to the hand bone so it follows animation."""
    from ff import prim, light
    bpy.context.view_layer.update()
    bn = ('Left' if side == 'L' else 'Right') + 'Hand'
    pb = h.rig.pose.bones[bn]
    p = h.rig.matrix_world @ pb.tail
    t = Vector(aim_at)
    d = (t - p).normalized()
    body = prim('cyl', f'torch_{h.name}', loc=p + d * 0.06, r=0.018, depth=0.09)
    body.rotation_mode = 'QUATERNION'
    body.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    body.data.materials.append(HU._mat('TorchBody', (0.02, 0.02, 0.02), rough=0.35))
    L = light('SPOT', f'torchL_{h.name}', loc=p + d * 0.13, energy=power, color=(1.0, 0.94, 0.84), spot=34.0, blend=0.55,
              radius=0.012, target=t)
    if parent_to_hand:
        # follow the hand: Child Of the hand bone, inverse captured at the current pose (keeps the world placement)
        for ob in (body, L):
            for c in list(ob.constraints):
                c_track = c.type in ('TRACK_TO', 'DAMPED_TRACK')
                if c_track:
                    ob.constraints.remove(c)
            if ob is L:
                ob.rotation_mode = 'QUATERNION'
                ob.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d)
            co = ob.constraints.new('CHILD_OF')
            co.target = h.rig
            co.subtarget = bn
            bpy.context.view_layer.update()
            co.inverse_matrix = (h.rig.matrix_world @ pb.matrix).inverted()
    return L


def grip(h, side, amount=1.0, sign=1.0):
    """Close the hand: amount 1 = fist round a handle, ~0.3 = relaxed hang (walking). Each finger has its own
    3-joint chain (human._split_fingers), plus the thumb."""
    HU.curl(h.rig, side, amount, sign)
    bpy.context.view_layer.update()


def ik_arm(h, side, wrist, pole=(0.0, 0.0, -1.0)):
    """Two-bone IK over HU.aim: shoulder -> elbow -> wrist lands on `wrist` (world), elbow toward `pole` (world dir)."""
    import math
    S_ = 'Left' if side == 'L' else 'Right'
    bpy.context.view_layer.update()
    pa, pf = h.rig.pose.bones[f'{S_}Arm'], h.rig.pose.bones[f'{S_}ForeArm']
    L1, L2 = pa.length, pf.length
    sh = h.rig.matrix_world @ pa.head
    t = Vector(wrist)
    d = max(abs(L1 - L2) + 1e-3, min((t - sh).length, L1 + L2 - 1e-3))
    u = (t - sh).normalized()
    pv_ = Vector(pole)
    v = (pv_ - pv_.dot(u) * u).normalized()
    ca = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)
    sa = math.sqrt(max(0.0, 1 - ca * ca))
    elbow = sh + L1 * (ca * u + sa * v)
    HU.aim(h, f'{S_}Arm', elbow - sh)
    bpy.context.view_layer.update()
    el = h.rig.matrix_world @ pf.head
    HU.aim(h, f'{S_}ForeArm', sh + u * d - el)


HOLD_DEBUG = False


def hold(h, side, center, axis, pole=(0.0, 0.0, -1.0), radius=0.0125, amount=0.95, max_cross=40.0, state=None):
    """Power grip on a cylinder (world centre + axis): the arm is solved so the cylinder lies across the palm at the
    base of the fingers, the hand is turned to face it and the fingers close round it. The palm faces the cylinder
    from the side the forearm comes in (least wrist bend); the cylinder may cross the palm up to `max_cross` degrees
    off square (real grips on a handle that points at the body are oblique). Pass the same `state` dict on every
    frame of an animation: where the forearm lines up with the handle the choice is ambiguous and the previous
    frame's palm decides, so the hand never flips."""
    import math
    from mathutils import Matrix
    S_ = 'Left' if side == 'L' else 'Right'
    rig = h.rig
    bl = rig.data.bones
    C = bl[f'{S_}Hand'].matrix_local.to_3x3().inverted() @ bl[f'{S_}HandFinger1'].matrix_local.to_3x3()
    fdir_rest = bl[f'{S_}HandFinger1'].matrix_local.to_3x3().col[1]
    knuck = sum((Vector(bl[p1].head_local) for p1, _, _ in HU.finger_bones(S_) if p1 in bl), Vector()) / 4.0
    d_k = (knuck - Vector(bl[f'{S_}Hand'].head_local)).dot(fdir_rest)
    g = Vector(axis).normalized()
    c = Vector(center)
    st = state if state is not None else {}
    bpy.context.view_layer.update()
    sh = rig.matrix_world @ rig.pose.bones[f'{S_}Arm'].head
    wrist = c - (c - sh).normalized() * (d_k + 0.01)
    cmax = math.cos(math.radians(90.0 - max_cross))
    Lat = Fd = Pn = None
    for _ in range(4):
        ik_arm(h, side, wrist, pole)
        mw = rig.matrix_world
        pf = rig.pose.bones[f'{S_}ForeArm']
        f = ((mw @ pf.tail) - (mw @ pf.head)).normalized()
        n = g.cross(f)
        prev = st.get('Pn')
        if prev is None:
            R3 = mw.to_3x3().normalized()
            prev = R3 @ (rig.pose.bones[f'{S_}Hand'].matrix.to_3x3() @ C).col[2]
        prev = (prev - g * prev.dot(g))
        prev = prev.normalized() if prev.length > 1e-6 else g.orthogonal().normalized()
        if n.length > 1e-6:
            nn = n.normalized()
            if nn.dot(prev) < 0:
                nn = -nn
            wgt = min(1.0, n.length / 0.4)               # near-parallel forearm: lean on last frame's palm
            Pn = (nn * wgt + prev * (1.0 - wgt)).normalized()
        else:
            Pn = prev
        Fd = f - Pn * f.dot(Pn)
        Fd = Fd.normalized() if Fd.length > 1e-6 else st.get('Fd', Pn.orthogonal()).normalized()
        e = Pn.cross(g).normalized()                     # in the palm plane, square to the handle
        al, be = Fd.dot(g), Fd.dot(e)
        if abs(be) < 1e-3 and 'Fd' in st:
            be = math.copysign(max(abs(be), 1e-3), st['Fd'].dot(e))
        if abs(al) > cmax:
            al = math.copysign(cmax, al)
        be = math.copysign(math.sqrt(max(0.0, 1 - al * al)), be if be != 0 else 1.0)
        Fd = (g * al + e * be).normalized()
        Lat = Fd.cross(Pn).normalized()
        wrist = c - Pn * (radius + 0.014) - Fd * (d_k - 0.012)
    ik_arm(h, side, wrist, pole)
    if 'Pn' in st and HOLD_DEBUG:
        print('HOLD', round(math.degrees(st['Pn'].angle(Pn)), 1), round(math.degrees(st['Fd'].angle(Fd)), 1),
              'f.g', round(f.dot(g), 2), '|n|', round(n.length, 2), 'al', round(al, 2), 'be', round(be, 2), flush=True)
    st['Pn'], st['Fd'] = Pn.copy(), Fd.copy()
    mw = rig.matrix_world
    R3 = mw.to_3x3().normalized()
    Rpalm = Matrix((Lat, Fd, Pn)).transposed()
    Rhand = R3.inverted() @ Rpalm @ C.inverted()
    pb = rig.pose.bones[f'{S_}Hand']
    head = pb.matrix.to_translation()
    pb.matrix = Matrix.Translation(head) @ Rhand.to_4x4()
    bpy.context.view_layer.update()
    grip(h, side, amount)
