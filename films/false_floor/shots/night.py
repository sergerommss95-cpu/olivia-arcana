"""v2 'The Night' sequence, lead shots (illustrative reconstruction, door set by A1, cast by lib/cast.py).
  N3  76f  low tracking shot behind the four crew walking up to the vault door (CMU walk), torch beam swinging
  N5 100f  over the Monster's shoulder: King of Keys hauls the handle, the door starts to swing, warm vault light spills
python3 films/tumbler/tools/rb.py films/false_floor/shots/night.py -- --shot N3 --stills 7,40,70 --pct 25 --samples 8
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
import door_ff as D
import human as HU
import cast as CA
import mocap as MC
from mathutils import Vector, Matrix

SHOT = arg('--shot', 'N3')
N = {'N3': 76, 'N5': 100, 'C7': 70}[SHOT]
R = math.radians
reset()
setup_render(1, N, res=RES_FINAL, samples=40, look='Medium High Contrast', clamp=6.0, vol_step=4.0, shutter=0.5)
world_color((0.0015, 0.0016, 0.002))


def heading_yaw(M, a, b, want=(0.0, 1.0)):
    """Yaw (deg) that turns the subject's travel direction over source frames a..b onto the wanted XY direction."""
    _, P0a, _ = MC.fk(M, a)
    _, P0b, _ = MC.fk(M, b)
    d = MC._zup(P0b['root']) - MC._zup(P0a['root'])
    src = math.atan2(d.y, d.x)
    return math.degrees(math.atan2(want[1], want[0]) - src)


def haze(density=0.018):
    hz = box('haze', (3.8, 4.8, 2.5), (0.0, -2.4, 1.25))
    mh = bpy.data.materials.new('Haze')
    mh.use_nodes = True
    nt = mh.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    vol = nt.nodes.new('ShaderNodeVolumePrincipled')
    vol.inputs['Density'].default_value = density
    vol.inputs['Anisotropy'].default_value = 0.55
    nt.links.new(vol.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
    hz.data.materials.append(mh)


def ease(o, path='location'):
    for fc in fcurves(o):
        if fc.data_path.startswith(path):
            for kp in fc.keyframe_points:
                kp.interpolation = 'SINE'
                kp.easing = 'EASE_IN_OUT'


if SHOT == 'N3':
    S = D.build_set(vault=False, stair=True, grate=True, cctv=True, key=False, a2=True)
    D.set_door(S, 0.0)
    S['grate'].rotation_euler.z = R(84)
    D.light_ante(S, 'day', scale=1.35)
    light('AREA', 'StairSpill', (0.0, -4.6, 2.3), energy=260, size=1.6, color=kelvin(4800), target=(0.0, -2.0, 1.0))
    haze(0.014)
    W = MC.load('02', '02_01')
    nfr = len(W['frames'])
    # one lane each (different leg lengths walk at different speeds): >= 0.55 m between lanes, nobody overtakes
    crew = [('king', -0.85, -3.25, 0), ('genius', 0.32, -3.35, 60), ('monster', -0.28, -3.95, 130), ('speedy', 0.88, -3.8, 200)]
    hs = {}
    for who, x, y, off in crew:
        h = CA.make(who)
        a = off % max(1, nfr - 400)
        yaw = heading_yaw(W, a, a + 300)
        MC.apply(h, W, start_frame=1, src_range=(a, a + int(3.4 * N) + 8), step=3.4, pos=(x, y), yaw_deg=yaw)
        hs[who] = h
    bpy.context.scene.frame_set(1)
    CA.torch(hs['monster'], 'R', (0.0, -0.2, 1.3), power=700.0)
    cam = camera('CamN3', lens=20, fstop=2.8)
    cam_path(cam, [(1, (0.05, -4.75, 0.78), (0.0, -0.4, 1.05), 0.0), (N, (0.0, -2.95, 0.8), (0.05, 0.0, 1.2), 0.0)])
    ease(cam)
    shake(cam, 0.006, 0.003, scale=14, seed=21)
    cam.data.dof.focus_distance = 2.6

elif SHOT == 'N5':
    S = D.build_set(vault=True, stair=True, grate=True, cctv=True, key=False, a2=True)
    D.light_ante(S, 'day', scale=1.2)
    D.light_vault(S, 'warm')
    haze(0.02)
    door = S['door']
    # the door: a beat, then 3 tons begin to move (0 -> 15 degrees in this shot), easing in. 15 degrees is as far as
    # the King can haul it with his feet planted (38 made him glide 0.6 m across the floor with the handle).
    d0, d1 = 24, N
    door.rotation_euler.z = 0.0
    door.keyframe_insert('rotation_euler', index=2, frame=1)
    door.keyframe_insert('rotation_euler', index=2, frame=d0)
    door.rotation_euler.z = -R(15.0)
    door.keyframe_insert('rotation_euler', index=2, frame=d1)
    for fc in fcurves(door):
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing = 'EASE_IN'
    k = CA.make('king')
    g = CA.make('genius')
    m = CA.make('monster')
    sp = CA.make('speedy')
    HU.place(g, 1.2, -0.75, 135)
    CA.arms_down(g, 'L', 0.1)
    CA.arms_down(g, 'R', 0.1)
    CA.head_turn(g, -20, 0)
    CA.grip(g, 'L', 0.35)
    CA.grip(g, 'R', 0.35)
    HU.place(m, -0.55, -1.55, 185)
    CA.arms_down(m, 'L', 0.12)
    CA.reach(m, 'R', (-0.2, -0.6, 1.45), 0.05)
    CA.grip(m, 'R', 0.85)
    CA.grip(m, 'L', 0.35)
    CA.torch(m, 'R', (0.2, -0.15, 1.2), power=600.0)
    HU.place(sp, -1.25, -2.4, 160)
    CA.arms_down(sp, 'L', 0.1)
    CA.arms_down(sp, 'R', 0.1)
    CA.head_turn(sp, 30, 0)
    # King of Keys hauls the handle: feet planted, arms follow the handle, and he leans back into it as it gives
    # (the whole body tilts about his heels, so the shoes stay put). Keyed every 4 frames.
    hp_local = Vector(D.HANDLE) + Vector((0.0, -0.06, 0.0))
    piv_h = Vector((D.HINGE_X, D.HINGE_Y, 0))

    def handle_at():
        ang = door.rotation_euler.z
        rel = Vector((hp_local.x - piv_h.x, hp_local.y - piv_h.y, 0))
        rr = Vector((rel.x * math.cos(ang) - rel.y * math.sin(ang), rel.x * math.sin(ang) + rel.y * math.cos(ang), 0))
        return piv_h + rr + Vector((0, 0, hp_local.z))
    bpy.context.scene.frame_set(1)
    hp1 = handle_at()
    KB = Vector((hp1.x + 0.12, hp1.y - 0.6, 0.0))
    yaw = R(172)
    facing = Matrix.Rotation(yaw, 3, 'Z') @ Vector((0, -1, 0))
    axis = facing.cross(Vector((0, 0, 1))).normalized()
    heel = KB - facing * 0.06
    for f in list(range(1, N + 1, 4)) + [N]:
        bpy.context.scene.frame_set(f)
        bpy.context.view_layer.update()
        hp = handle_at()
        t = min(1.0, abs(door.rotation_euler.z) / R(15.0))
        lean = R(1.0 + 5.0 * (t ** 0.6)) if f >= d0 - 6 else R(1.0 * f / (d0 - 6))
        k.rig.matrix_world = (Matrix.Translation(heel) @ Matrix.Rotation(lean, 4, axis) @ Matrix.Translation(-heel) @
                              Matrix.Translation(KB) @ Matrix.Rotation(yaw, 4, 'Z'))
        bpy.context.view_layer.update()
        for pb in k.rig.pose.bones:
            pb.rotation_euler = (0, 0, 0)
        CA.reach(k, 'R', hp, 0.05)
        CA.reach(k, 'L', hp + Vector((-0.06, 0, 0.03)), 0.12)
        CA.grip(k, 'R', 0.9)
        CA.grip(k, 'L', 0.75)
        CA.head_turn(k, 0, -4)
        k.rig.keyframe_insert('location', frame=f)
        k.rig.keyframe_insert('rotation_euler', frame=f)
        for pb in k.rig.pose.bones:
            pb.keyframe_insert('rotation_euler', frame=f)
            pb.keyframe_insert('rotation_quaternion', frame=f)
    bpy.context.scene.frame_set(1)
    cam = camera('CamN5', lens=32, fstop=2.4)
    cam_path(cam, [(1, (1.5, -2.6, 1.42), (0.15, -0.25, 1.15), 0.0), (N, (1.0, -1.85, 1.3), (0.25, -0.15, 1.1), 0.0)])
    ease(cam)
    shake(cam, 0.004, 0.002, scale=20, seed=9)
    cam.data.dof.focus_distance = 1.75

elif SHOT == 'C7':
    # Monday morning: the guard's face as he takes in the open door. Lights on, door wide open behind the camera.
    S = D.build_set(vault=True, stair=True, grate=True, cctv=True, key=False, a2=True)
    D.set_door(S, 112.0)
    S['grate'].rotation_euler.z = R(84)
    D.light_ante(S, 'monday', scale=1.1)
    D.light_vault(S, 'warm')
    gd = CA.make('guard')
    HU.place(gd, 0.35, -1.75, 188)
    CA.arms_down(gd, 'L', 0.12)
    CA.arms_down(gd, 'R', 0.12)
    CA.grip(gd, 'L', 0.35)
    CA.grip(gd, 'R', 0.35)
    # head: looks at the open door, then lowers into the vault (keyed)
    for f, yaw, pitch in ((1, 14, -4), (24, 12, -4), (52, 2, 9), (N, 0, 10)):
        CA.head_turn(gd, yaw, pitch)
        for b_ in ('Neck1', 'Head'):
            gd.rig.pose.bones[b_].keyframe_insert('rotation_euler', frame=f)
    cam = camera('CamC7', lens=55, fstop=2.0)
    cam_path(cam, [(1, (0.98, -0.72, 1.6), (0.33, -1.72, 1.66), 0.0), (N, (0.8, -0.98, 1.62), (0.33, -1.74, 1.64), 0.0)])
    ease(cam)
    shake(cam, 0.003, 0.0015, scale=24, seed=17)
    cam.data.dof.focus_distance = 1.05

bpy.context.scene.camera = cam
finish(SHOT)
