"""v2 style frame A: the crew at the vault door, Saturday night, Level -2 (illustrative reconstruction).
King of Keys at the dial, the Genius at the magnetic plates, the Monster holding the torch, Speedy at the stairs
looking back. Torch beams through a thin haze; the grate's bars from the stairwell lamp.
python3 films/tumbler/tools/rb.py films/false_floor/shots/sf2_crew.py -- --stills 1 --pct 40 --samples 24
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
import door_ff as D
import human as HU
from mathutils import Vector

R = math.radians
reset()
setup_render(1, 1, res=(1920, 1080), samples=96, look='Medium High Contrast', clamp=6.0, vol_step=4.0)
world_color((0.0015, 0.0016, 0.002))
S = D.build_set(vault=False, stair=True, grate=True, cctv=True, key=False, a2=True)
D.set_door(S, 0.0)
D.light_ante(S, 'day', scale=0.9)   # investigators: the lights were on (sensor taped), FACTS 19/35

DARK = dict(tint=(0.3, 0.31, 0.34), sat=0.4, val=0.65)
cast = {
    'king': HU.make_human('king', gender=1, age=72, muscle=0.3, weight=0.45, height=0.35, skin='pale',
                          assets=[('clothes/male_elegantsuit01', dict(tint=(0.7, 0.58, 0.45), sat=0.5, val=1.2)),
                                  ('clothes/shoes01', dict(tint=(0.16, 0.12, 0.1), sat=0.3)), ('clothes/fedora01', dict(tint=(0.45, 0.4, 0.34))),
                                  ('eyebrows/eyebrow003', {})], outfit=[HU.OUTFITS['crew_dark'][3]]),
    'genius': HU.make_human('genius', gender=1, age=45, muscle=0.35, weight=0.3, height=0.6, skin='light',
                            assets=[('clothes/male_casualsuit05', DARK), ('clothes/shoes03', {}), ('eyebrows/eyebrow001', {})],
                            outfit=[HU.OUTFITS['crew_dark'][3], HU.OUTFITS['crew_dark'][4]]),
    'monster': HU.make_human('monster', gender=1, age=40, muscle=0.85, weight=0.8, height=0.75, skin='ruddy',
                             assets=[('clothes/male_casualsuit05', dict(tint=(0.28, 0.26, 0.24), sat=0.3, val=0.6)),
                                     ('clothes/shoes03', {}), ('eyebrows/eyebrow003', {})],
                             outfit=[HU.OUTFITS['crew_dark'][3], HU.OUTFITS['crew_dark'][4]]),
    'speedy': HU.make_human('speedy', gender=1, age=55, muscle=0.4, weight=0.55, height=0.4, skin='olive',
                            assets=[('clothes/male_casualsuit05', dict(tint=(0.3, 0.32, 0.3), sat=0.4, val=0.7)),
                                    ('clothes/shoes01', dict(tint=(0.14, 0.11, 0.09), sat=0.3)), ('hair/short01', dict(tint=(0.55, 0.53, 0.5))),
                                    ('eyebrows/eyebrow001', {})], outfit=[HU.OUTFITS['crew_dark'][3]]),
}


def reach(h, side, target, elbow_drop=0.12):
    """Point an arm at a world target: upper arm toward a point a little below the line, forearm onto the target."""
    bpy.context.view_layer.update()
    S_ = 'Left' if side == 'L' else 'Right'
    pb = h.rig.pose.bones[f'{S_}Arm']
    sh = h.rig.matrix_world @ pb.head
    t = Vector(target)
    mid = sh + (t - sh) * 0.5 - Vector((0, 0, elbow_drop))
    HU.aim(h, f'{S_}Arm', mid - sh)
    pf = h.rig.pose.bones[f'{S_}ForeArm']
    el = h.rig.matrix_world @ pf.head
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


# King of Keys at the dial (faces the door: +Y)
k = cast['king']
HU.place(k, -0.02, -0.58, 180)
reach(k, 'R', (0.13, -0.16, 1.36), 0.1)
reach(k, 'L', (0.30, -0.18, 1.18), 0.18)
head_turn(k, 0, -6)
# the Genius at the magnetic plates on the free edge
g = cast['genius']
HU.place(g, 0.78, -0.62, 168)
reach(g, 'R', (0.58, -0.16, 1.62), 0.08)
reach(g, 'L', (0.52, -0.17, 1.52), 0.12)
head_turn(g, 0, 10)
# the Monster behind them, torch up on the door
m = cast['monster']
HU.place(m, -0.55, -1.35, 196)
reach(m, 'R', (-0.25, -0.75, 1.62), 0.02)
arms_down(m, 'L', 0.12, 0.0)
head_turn(m, 8, 4)
# Speedy at the foot of the stairs, facing up the stairs, looking back over his shoulder
sp = cast['speedy']
HU.place(sp, -1.45, -1.75, -25)
arms_down(sp, 'L', 0.1, 0.05)
arms_down(sp, 'R', 0.1, 0.05)
head_turn(sp, -35, 8)

# torches: a small black cylinder in the hand + a hard spot with a soft edge
def torch(h, side, aim_at, power=900.0):
    bpy.context.view_layer.update()
    pb = h.rig.pose.bones[('Left' if side == 'L' else 'Right') + 'Hand']
    p = h.rig.matrix_world @ pb.tail
    t = Vector(aim_at)
    d = (t - p).normalized()
    body = prim('cyl', f'torch_{h.name}', loc=p + d * 0.06, r=0.018, depth=0.09)
    body.rotation_mode = 'QUATERNION'
    body.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    body.data.materials.append(HU._mat('TorchBody', (0.02, 0.02, 0.02), rough=0.35))
    L = light('SPOT', f'torchL_{h.name}', loc=p + d * 0.13, energy=power, color=(1.0, 0.94, 0.84), spot=34.0, blend=0.55,
              radius=0.012, target=t)
    return L

torch(m, 'R', (0.25, -0.1, 1.45))
# a second, lower beam from the Genius's head height onto the plates (headlamp)
light('SPOT', 'headlamp', loc=(0.74, -0.78, 1.72), energy=260, color=(0.92, 0.95, 1.0), spot=40.0, blend=0.6, radius=0.01,
      target=(0.56, -0.14, 1.58))

# thin haze so the beams read
hz = box('haze', (3.8, 3.6, 2.5), (0.0, -1.9, 1.25))
mh = bpy.data.materials.new('Haze')
mh.use_nodes = True
nt = mh.node_tree
nt.nodes.remove(nt.nodes['Principled BSDF'])
vol = nt.nodes.new('ShaderNodeVolumePrincipled')
vol.inputs['Density'].default_value = 0.02
vol.inputs['Anisotropy'].default_value = 0.55
nt.links.new(vol.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
hz.data.materials.append(mh)

cam = camera('CamSF2', loc=(1.5, -3.45, 0.78), target=(-0.15, -0.55, 1.22), lens=24, fstop=2.8)
cam.data.dof.focus_distance = 3.2
bpy.context.scene.camera = cam
finish('SF2_CREW')
