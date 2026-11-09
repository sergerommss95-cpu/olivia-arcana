"""v2 style frame B: the Tenant in his rented office (illustrative reconstruction). Afternoon sun through the blinds;
he parts a slat and looks down at the street; the shoulder bag with the hidden camera waits on the desk.
python3 films/tumbler/tools/rb.py films/false_floor/shots/sf2_tenant.py -- --stills 1 --pct 40 --samples 24
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
from office_city import *
import human as HU
from mathutils import Vector

reset()
setup_render(1, 1, res=(1920, 1080), samples=96, mb=False, look='Medium High Contrast', clamp=5.0, bounces=(3, 3, 4),
             exposure=0.15)
world_color((0.0, 0.0, 0.0), 0.0)
M = office_mats()
A = build_office(M, door_angle=72.0, blinds_tilt=38.0, lamp_on=False)
o = OFF
wx0, wx1, wz0, wz1 = o['win']
wxc, wzc = (wx0 + wx1) / 2, (wz0 + wz1) / 2
card = rbox('SkyCard', (14.0, 0.05, 9.0), (wxc, o['y1'] + 4.5, 2.0), mat_emission('SkyDay', (0.80, 0.88, 1.0), 1.6), bev=0)
no_shadow(card)
sun('Sun', (-0.22, -0.82, -0.5), 30.0, kelvin(4100), angle=0.25)
light('AREA', 'SkyFill', (wxc, o['y1'] + 0.7, wzc), (math.radians(-90), 0, 0), energy=260.0, color=kelvin(8500),
      size=wx1 - wx0, size_y=wz1 - wz0, shape='RECTANGLE')
light('AREA', 'RoomBounce', (1.4, 1.2, 2.5), energy=60.0, color=kelvin(4600), size=1.5)
hz = mat_volume('OfficeHaze', density=0.02, color=(0.9, 0.9, 0.9), anisotropy=0.6, noise_scale=1.4, contrast=(0.3, 0.75))
volume_box('Haze', ((o['x0'] + o['x1']) / 2, o['y1'] / 2, o['H'] / 2), (o['x1'] - o['x0'] - 0.02, o['y1'] - 0.02, o['H'] - 0.02), hz)

t = HU.make_human('tenant', gender=1, age=50, muscle=0.45, weight=0.62, height=0.52, skin='olive',
                  assets=[('clothes/male_elegantsuit01', {}), ('clothes/shoes04', {}),
                          ('hair/short02', dict(tint=(0.5, 0.46, 0.44), sat=0.4)), ('eyebrows/eyebrow001', {})])
HU.place(t, -0.15, 3.72, 192)


def reach(h, side, target, elbow_drop=0.12):
    bpy.context.view_layer.update()
    S_ = 'Left' if side == 'L' else 'Right'
    sh = h.rig.matrix_world @ h.rig.pose.bones[f'{S_}Arm'].head
    tg = Vector(target)
    HU.aim(h, f'{S_}Arm', (sh + (tg - sh) * 0.5 - Vector((0, 0, elbow_drop))) - sh)
    el = h.rig.matrix_world @ h.rig.pose.bones[f'{S_}ForeArm'].head
    HU.aim(h, f'{S_}ForeArm', tg - el)


reach(t, 'R', (-0.02, 4.0, 1.58), 0.2)          # two fingers part the slats
R3 = t.rig.matrix_world.to_3x3()
HU.aim(t, 'LeftArm', R3 @ Vector((0.12, 0.02, -1)))
HU.aim(t, 'LeftForeArm', R3 @ Vector((0.05, -0.25, -1)))
HU.rot(t, 'Neck1', x=8, z=-6)
HU.rot(t, 'Head', x=10, z=-10)

# the shoulder bag on the desk (camera inside; nothing visible from here)
DX, DY, DZ = A['desk']
bag = rbox('ShoulderBag', (0.34, 0.12, 0.26), (DX + 0.28, DY - 0.05, DZ + 0.13), mat_leather('BagLeather', color=(0.07, 0.04, 0.025)), bev=0.03)
bag.rotation_euler.z = math.radians(-14)

foc = empty('Focus', (-0.12, 3.7, 1.55))
loc, tgt = (1.55, 1.25, 1.42), (-0.25, 3.85, 1.48)
cam = camera('CamTenant', loc=loc, lens=32.0, fstop=2.4, clip=(0.005, 400))
cam.rotation_euler = look_rot(loc, tgt, 0.0)
cam.data.dof.focus_object = foc
bpy.context.scene.camera = cam
finish('SF2_TENANT')
