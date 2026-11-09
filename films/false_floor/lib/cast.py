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

DARK = dict(tint=(0.3, 0.31, 0.34), sat=0.4, val=0.65)
GLOVES, BEANIE = HU.OUTFITS['crew_dark'][3], HU.OUTFITS['crew_dark'][4]

SPEC = {
    'tenant': dict(gender=1, age=50, muscle=0.45, weight=0.62, height=0.52, skin='olive',
                   assets=[('clothes/male_elegantsuit01', {}), ('clothes/shoes04', {}),
                           ('hair/short02', dict(tint=(0.5, 0.46, 0.44), sat=0.4)), ('eyebrows/eyebrow001', {})]),
    'king': dict(gender=1, age=72, muscle=0.3, weight=0.45, height=0.35, skin='pale',
                 assets=[('clothes/male_elegantsuit01', dict(tint=(0.7, 0.58, 0.45), sat=0.5, val=1.2)),
                         ('clothes/shoes01', dict(tint=(0.16, 0.12, 0.1), sat=0.3)), ('clothes/fedora01', dict(tint=(0.45, 0.4, 0.34))),
                         ('eyebrows/eyebrow003', {})], outfit=[GLOVES]),
    'genius': dict(gender=1, age=45, muscle=0.35, weight=0.3, height=0.6, skin='light',
                   assets=[('clothes/male_casualsuit05', DARK), ('clothes/shoes03', {}), ('eyebrows/eyebrow001', {})],
                   outfit=[GLOVES, BEANIE]),
    'monster': dict(gender=1, age=40, muscle=0.85, weight=0.8, height=0.75, skin='ruddy',
                    assets=[('clothes/male_casualsuit05', dict(tint=(0.28, 0.26, 0.24), sat=0.3, val=0.6)),
                            ('clothes/shoes03', {}), ('eyebrows/eyebrow003', {})], outfit=[GLOVES, BEANIE]),
    'speedy': dict(gender=1, age=55, muscle=0.4, weight=0.55, height=0.4, skin='olive',
                   assets=[('clothes/male_casualsuit05', dict(tint=(0.3, 0.32, 0.3), sat=0.4, val=0.7)),
                           ('clothes/shoes01', dict(tint=(0.14, 0.11, 0.09), sat=0.3)), ('hair/short01', dict(tint=(0.55, 0.53, 0.5))),
                           ('eyebrows/eyebrow001', {})], outfit=[GLOVES]),
    'guard': dict(gender=1, age=48, muscle=0.5, weight=0.65, height=0.5, skin='light',
                  assets=[('clothes/male_casualsuit01', dict(tint=(0.55, 0.6, 0.7), sat=0.5)), ('clothes/shoes04', {}),
                          ('hair/short04', {}), ('eyebrows/eyebrow001', {})]),
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
    HU.aim(h, f'{S_}Arm', (sh + (t - sh) * 0.5 - Vector((0, 0, elbow_drop))) - sh)
    el = h.rig.matrix_world @ h.rig.pose.bones[f'{S_}ForeArm'].head
    HU.aim(h, f'{S_}ForeArm', t - el)


def arms_down(h, side, out=0.15, fwd=0.05):
    R3 = h.rig.matrix_world.to_3x3()
    s = 1 if side == 'L' else -1
    S_ = 'Left' if side == 'L' else 'Right'
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
