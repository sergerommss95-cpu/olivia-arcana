"""Mocap check: CMU 02_01 (walk) on Speedy, three frames.
python3 films/tumbler/tools/rb.py films/false_floor/shots/mocap_test.py -- --stills 1,20,40 --pct 30 --samples 12
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
import human as HU
import mocap as MC

reset()
setup_render(1, 60, (1920, 1080), samples=24)
world_color((0.05, 0.055, 0.06), 1.0)
h = HU.make_human('speedy', gender=1, age=55, muscle=0.4, weight=0.55, height=0.4, skin='olive',
                  assets=[('clothes/male_casualsuit05', dict(tint=(0.3, 0.32, 0.3), sat=0.4, val=0.7)), ('clothes/shoes01', {}),
                          ('hair/short01', {}), ('eyebrows/eyebrow001', {})])
M = MC.load('02', '02_01')
n = MC.apply(h, M, start_frame=1, src_range=(0, 290), step=5.0, pos=(0, 0), yaw_deg=0)
print('[mocap] baked frames', n, flush=True)
floor = box('floor', (20, 20, 0.02), (0, 0, -0.01))
floor.data.materials.append(HU._mat('Floor', (0.2, 0.2, 0.2), rough=0.7))
light('AREA', 'key', (-3, -4, 5), energy=1200, size=4, color=(1, 0.95, 0.9), target=(0, 0, 1))
cam = camera('Cam', loc=(5.5, -4.0, 1.4), target=(0, -1.0, 0.95), lens=35)
bpy.context.scene.camera = cam
tc = bpy.data.objects.new('track', None)
bpy.context.scene.collection.objects.link(tc)
cons = cam.constraints.new('TRACK_TO')
cons.target = h.rig
cons.track_axis, cons.up_axis = 'TRACK_NEGATIVE_Z', 'UP_Y'
finish('MOCAP')
