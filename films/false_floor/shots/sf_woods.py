"""SF2 — S5 WOODS OFF THE E19 (style frame). Macro evidence tableau on a wet February forest floor: torn bin bag
spilling paper, loose rough stones, and the hero: half a salami sandwich. Grey overcast morning, soft fog.

    python3 films/tumbler/tools/rb.py films/false_floor/shots/sf_woods.py -- --stills 1 --pct 40 --samples 16

Flags:
    --debuglight      flat bright light, no DOF, no fog (layout / scale check)
    --nodof           beauty light without depth of field
    --dolly           key a slow lateral camera dolly over frames 1..240 (CAM['dolly']); focus stays on the cut face.
                      Without it the still is the dolly midpoint at frame 1.
    --seed N          leaf scatter seed
Everything in metres. Props are placed by image coordinates (u, v in -1..1) cast onto the ground from the
mid-dolly camera, so the layout survives lens/height tweaks.
"""
import sys, os, math, random, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
from woods import *

SHOT = 'SF2_woods'
DEBUG = bool(arg('--debuglight'))
DOLLY = bool(arg('--dolly'))
SEED = arg('--seed', 7, int)
T0 = time.time()

# ------------------------------------------------------------------------------------------------ parameters
CAM = dict(h=0.12, pitch=5.0, yaw=0.0, lens=50.0, fstop=4.5, roll=0.4,
           dolly=((-0.10, -0.03), (0.10, 0.03)),       # (x, y) offsets at frame 1 and 240, midpoint = still
           frames=240)
GROUND = dict(seed=3, rise_start=2.6, rise_slope=0.06, near=(-1.5, 1.5, 0.2, 3.4),
              puddles=[])                                   # filled below from image coords
LITTER_Z = 0.012                                            # mean litter surface height used for image->ground
LAYOUT = dict(
    sandwich=(0.16, -0.36), sandwich_delta=14.0, sandwich_mirror=True,
    bag=(-0.40, 0.16), bag_size=(0.26, 0.19, 0.10),
    envelope=(-0.70, -0.10, 0.45), receipt=(-0.66, -0.50, -0.55), document=(0.74, 0.02, 2.3),
    puddle=(-0.86, -0.50, 0.09, 0.06, 0.014),             # u, v, rx, ry, depth
    stones=[(-0.08, -0.72, 0.0062), (0.62, -0.74, 0.0074), (-0.18, -0.34, 0.0052), (-0.30, -0.08, 0.0046),
            (0.56, -0.30, 0.0044), (-0.62, -0.78, 0.0056)],
)
LEAVES = dict(n1=2400, n2=900, on_bag=7)
FOG.update(color=(0.43, 0.45, 0.47), strength=1.0, start=2.0, dist=6.0, refl=0.3)
# ------------------------------------------------------------------------------------------------ scene
T = build_tableau(dict(CAM=CAM, GROUND=GROUND, LAYOUT=LAYOUT, LEAVES=LEAVES, LITTER_Z=LITTER_Z, SEED=SEED, DEBUG=DEBUG,
                       DOLLY=DOLLY, NODOF=bool(arg('--nodof')), CLOSEUP=bool(arg('--closeup'))))
finish(SHOT)
