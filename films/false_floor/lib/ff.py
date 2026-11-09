"""False Floor shared bits: imports the TUMBLER toolkit and adds the brand palette and paths.

In a shot script:
    import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
    from ff import *            # brings in everything from tumbler/lib/common.py too
"""
import os, sys
FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TUMBLER_LIB = os.path.join(os.path.dirname(FF), 'tumbler', 'lib')
if TUMBLER_LIB not in sys.path:
    sys.path.insert(0, TUMBLER_LIB)
from common import *            # noqa: F401,F403  (reset, setup_render, materials, camera, light, finish...)
import common as _common

# finish() writes tests/ and out/ under the False Floor folder, not under tumbler/
_common.FILM = FF

# Brand (locked): linear-ish values for materials/lights; sRGB hex in BRAND_HEX for post/type
BRAND_HEX = {'charcoal': '#111719', 'cream': '#ECE8DF', 'concrete': '#B7BAB8', 'orange': '#E4442E'}


def srgb_to_lin(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


CHARCOAL = srgb_to_lin(BRAND_HEX['charcoal'])
CREAM = srgb_to_lin(BRAND_HEX['cream'])
CONCRETE = srgb_to_lin(BRAND_HEX['concrete'])
ORANGE = srgb_to_lin(BRAND_HEX['orange'])
RES_FINAL = (1920, 1080)    # full 16:9 (channel spec), 100 px safe margins for type
