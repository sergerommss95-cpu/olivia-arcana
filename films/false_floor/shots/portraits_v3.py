"""v3 cast portraits for the motion-graphic dossier cards (M_NAME_TENANT, M_CREW, M_GHOSTS).
Head-and-shoulders, 3/4 view (body turned to screen-left, face a little back toward camera), warm key from
screen-left (short lighting), cool rim from behind screen-right, near-black background. Identical rig for all five.
Proposed, original faces (lib/cast.py) — a dramatization, not likenesses of the real people.

    cd films && python3 tumbler/tools/rb.py false_floor/shots/portraits_v3.py -- --stills 1 [--only tenant,king] [--samples 24] [--pct 100]

Writes false_floor/assets/portraits/<who>_alpha.png (RGBA, transparent background) and <who>.png (on the dark
backdrop), 1200x1500.
"""
import sys, os, math, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
import cast as CA
import human as HU
from mathutils import Vector

OUT = os.path.join(FF, 'assets', 'portraits')
os.makedirs(OUT, exist_ok=True)
WHO = ['tenant', 'genius', 'monster', 'king', 'speedy']
only = arg('--only', None)
if only:
    WHO = [w for w in str(only).split(',') if w]
samples = arg('--samples', 24, int)
pct = arg('--pct', 100, int)
RES = (1200, 1500)
YAW = -28.0          # body turned to screen-left
HEAD_YAW = 12.0      # face turned a little back toward the lens

reset()
sc = setup_render(1, 1, res=RES, samples=samples, mb=False, look='Medium High Contrast', film_transparent=True,
                  bounces=(3, 2, 4))
sc.render.resolution_percentage = pct
world_color((0.004, 0.0042, 0.005), 1.0)


def render_one(who):
    t0 = time.time()
    h = CA.make(who)
    HU.place(h, 0, 0, YAW)
    HU.stand(h)
    CA.head_turn(h, yaw=HEAD_YAW, pitch=-2)
    bpy.context.view_layer.update()
    pbs = h.rig.pose.bones
    head = h.rig.matrix_world @ pbs['Head'].head          # base of the skull
    neck = h.rig.matrix_world @ pbs['Neck'].head
    face = head + Vector((0, 0, 0.07))
    # frame: eyes about 38 % from the top, chest at the bottom edge (85 mm, ~1.5 m)
    aim_pt = face + Vector((0, 0, -0.15))
    cam_pos = Vector((0.10, -1.42, face.z - 0.02))
    cam = camera('CamP_' + who, loc=tuple(cam_pos), target=tuple(aim_pt), lens=85, fstop=4.0)
    cam.data.dof.focus_distance = (face - cam_pos).length
    sc.camera = cam
    lights = [
        # warm key: screen-left, front, above (short light on the turned face)
        light('AREA', 'key_' + who, (-1.35, -0.55, face.z + 0.6), energy=80, size=0.7, color=(1.0, 0.80, 0.58),
              target=tuple(face)),
        # faint warm fill from camera side, low
        light('AREA', 'fill_' + who, (0.6, -1.6, face.z - 0.3), energy=2.5, size=1.5, color=(1.0, 0.9, 0.8),
              target=tuple(face)),
        # cool rim: behind, screen-right, high
        light('AREA', 'rim_' + who, (0.85, 0.75, face.z + 0.4), energy=90, size=0.5, color=(0.75, 0.84, 1.0),
              target=tuple(face + Vector((0, 0, -0.1)))),
        # second rim on the left shoulder edge, very soft
        light('AREA', 'rim2_' + who, (-0.9, 0.9, face.z + 0.2), energy=18, size=0.8, color=(1.0, 0.85, 0.7),
              target=tuple(neck)),
    ]
    p = os.path.join(OUT, f'{who}_alpha.png')
    sc.render.filepath = p
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    bpy.ops.render.render(write_still=True)
    print(f'[still] {p} {time.time() - t0:.1f}s', flush=True)
    # hide this character + its lights for the next one
    objs = [h.rig] + [o for o in bpy.data.objects if o.parent == h.rig] + lights
    for o in objs:
        o.hide_render = True
        o.hide_viewport = True
    return p


done = [render_one(w) for w in WHO]

# composite each RGBA render onto the dark backdrop (soft warm falloff behind the head) with the system python + PIL
import subprocess
COMP = r"""
import sys, numpy as np
from PIL import Image
for p in sys.argv[1:]:
    im = Image.open(p).convert('RGBA')
    w, h = im.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - 0.40 * w) / (0.8 * w)) ** 2 + ((yy - 0.30 * h) / (0.8 * h)) ** 2)
    g = np.clip(1 - r, 0, 1) ** 2
    bg = np.stack([14 + 22 * g, 14 + 17 * g, 16 + 11 * g], -1)
    a = np.asarray(im).astype(np.float32)
    al = a[..., 3:4] / 255.0
    out = a[..., :3] * al + bg * (1 - al)
    q = p.replace('_alpha.png', '.png')
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(q)
    print('[still]', q, flush=True)
"""
subprocess.run(['/usr/bin/python3', '-c', COMP] + done, check=True)
