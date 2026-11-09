"""Study card for the ACT IV getaway car (not part of the film).
python3 tools/rb.py shots/test_car.py -- --stills 1,2,3,4 --pct 50 --samples 16 [--studio]
Frames 1..4 = 3/4 front, side (right, open window), 3/4 rear, high 3/4."""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from common import *
from city import *

sc = reset()
setup_render(1, 4, samples=24, mb=False)
world_gradient(zenith=(0.002, 0.0026, 0.004), horizon=(0.01, 0.008, 0.006), strength=1.0)
car = build_car('Getaway')
for wd in car['wheels']:
    if wd['front']:
        wd['pivot'].rotation_euler.z = 0.25
g = prim('plane', 'Ground', scale=(40, 40, 1))
set_mat(g, mat_wet_asphalt())
cam = camera('CamStudy', lens=40, fstop=None)
views = [((5.6, -4.2, 1.35), (0.3, 0, 0.62)), ((0.0, -6.8, 1.0), (0.0, 0, 0.7)), ((-5.8, -3.6, 1.5), (-0.4, 0, 0.6)),
         ((4.0, -5.0, 4.2), (0, 0, 0.5))]
for i, (loc, tgt) in enumerate(views):
    cam.location = loc
    cam.rotation_euler = look_rot(loc, tgt)
    cam.keyframe_insert('location', frame=i + 1)
    cam.keyframe_insert('rotation_euler', frame=i + 1)
for fc in fcurves(cam):
    for kp in fc.keyframe_points:
        kp.interpolation = 'CONSTANT'
if arg('--studio'):
    light('AREA', 'Soft', (0, 0, 6), energy=1500, size=8, size_y=3, shape='RECTANGLE', color=(1, 1, 1))
    light('AREA', 'Side', (0, -8, 2), energy=600, size=10, size_y=0.6, shape='RECTANGLE', target=(0, 0, 0.6))
else:
    light('SPOT', 'Sodium', (2.0, -3.5, 8.0), energy=1600, color=SODIUM, spot=110, blend=0.8, radius=0.2, target=(0, 0, 0))
    light('AREA', 'StripA', (-1.0, -7.0, 3.2), energy=400, size=12, size_y=0.25, shape='RECTANGLE', color=(0.7, 0.85, 1.0), target=(0, 0, 0.7))
    light('AREA', 'Blue', (-6, 3, 1.5), energy=800, size=0.6, color=BLUE, target=(0, 0, 0.6))
    light('AREA', 'Red', (6, 3, 1.5), energy=600, size=0.6, color=RED, target=(0, 0, 0.6))
finish('car_study')
