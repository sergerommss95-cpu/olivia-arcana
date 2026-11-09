"""Cast check: the five proposed crew characters in a row, neutral light.
python3 films/tumbler/tools/rb.py films/false_floor/shots/cast_test.py -- --stills 1 --pct 40 --samples 16
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
import human as HU

reset()
setup_render(1, 1, (1920, 1080), samples=32)
world_color((0.02, 0.022, 0.025), 1.0)

DARK = dict(tint=(0.35, 0.36, 0.4), sat=0.5, val=0.7)
CAST = [
    ('tenant', dict(gender=1, age=50, muscle=0.45, weight=0.62, height=0.52, skin='olive',
                    assets=[('clothes/male_elegantsuit01', {}), ('clothes/shoes04', {}),
                            ('hair/short02', dict(tint=(0.55, 0.5, 0.48), sat=0.4)), ('eyebrows/eyebrow001', {})])),
    ('genius', dict(gender=1, age=45, muscle=0.35, weight=0.3, height=0.6, skin='light',
                    assets=[('clothes/male_casualsuit05', DARK), ('clothes/shoes03', {}), ('hair/short04', {}),
                            ('eyebrows/eyebrow001', {})], outfit=[HU.OUTFITS['crew_dark'][3]])),
    ('monster', dict(gender=1, age=40, muscle=0.85, weight=0.8, height=0.75, skin='ruddy',
                     assets=[('clothes/male_worksuit01', dict(tint=(0.45, 0.42, 0.38), sat=0.35, val=0.75)), ('clothes/shoes03', {}),
                             ('eyebrows/eyebrow003', {})], outfit=[HU.OUTFITS['crew_dark'][4]])),
    ('speedy', dict(gender=1, age=55, muscle=0.4, weight=0.55, height=0.4, skin='olive',
                    assets=[('clothes/male_casualsuit03', dict(sat=0.6, val=0.85)), ('clothes/shoes01', dict(tint=(0.16, 0.12, 0.1), sat=0.3)),
                            ('hair/short01', dict(tint=(0.6, 0.58, 0.56))), ('eyebrows/eyebrow001', {})])),
    ('kingofkeys', dict(gender=1, age=72, muscle=0.3, weight=0.45, height=0.35, skin='pale',
                        assets=[('clothes/male_elegantsuit01', dict(tint=(0.75, 0.62, 0.48), sat=0.5, val=1.3)),
                                ('clothes/shoes01', dict(tint=(0.16, 0.12, 0.1), sat=0.3)), ('clothes/fedora01', dict(tint=(0.5, 0.45, 0.38))),
                                ('eyebrows/eyebrow003', dict(tint=(1.6, 1.6, 1.6)))])),
]
hs = []
for i, (n, kw) in enumerate(CAST):
    h = HU.make_human(n, **kw)
    HU.place(h, (i - 2) * 0.85, 0, 0)
    HU.stand(h)
    hs.append(h)

floor = box('floor', (12, 12, 0.02), (0, 0, -0.01))
floor.data.materials.append(HU._mat('Floor', (0.06, 0.065, 0.07), rough=0.5))
wall = box('wall', (12, 0.05, 6), (0, 2.5, 3))
wall.data.materials.append(HU._mat('Wall', (0.05, 0.055, 0.06), rough=0.9))
light('AREA', 'key', (-3, -4, 4), energy=900, size=3, color=(1, 0.95, 0.9), target=(0, 0, 1))
light('AREA', 'rim', (3, 2, 3), energy=500, size=2, color=(0.8, 0.88, 1.0), target=(0, 0, 1.2))
cam = camera('Cam', loc=(0, -6.2, 1.25), target=(0, 0, 0.95), lens=35)
bpy.context.scene.camera = cam
finish('CAST')
