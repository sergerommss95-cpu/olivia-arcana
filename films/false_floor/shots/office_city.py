"""Set C (builder C) — 3D stills for False Floor, Case No. 02. Illustrative reconstruction; nothing legible in frame.

    S04  the diamond district at DUSK: street mouth, steel bollards, police post, facade cameras, first lamps on
    S05  dealer's table under north light: opened diamond paper, rough stones, loupe, tweezers, carat scale, pen
    S08  the rented office, afternoon: seen from the corridor through the open door (brass nameplate on the door),
         slatted sun through venetian blinds, desk, balance, phone, empty chair
    S11  macro: shoulder bag on a chair, a pinhole lens in the strap's box stitch catching a glint
    S23  the district at NIGHT (Saturday): empty wet street, bollards, police post, sodium + cool light; left third calm
    S38  the same office at dusk: cold window light, one warm desk lamp, chair still empty (same camera as S08)

All are 3DS: ONE frame at 2560x1440, composed with ~15% safe room (the edit pushes in).

    python3 films/tumbler/tools/rb.py films/false_floor/shots/office_city.py -- --shot S08 --stills 1 --pct 25 --samples 12
Flags: --debuglight (flat light, no DOF, no haze: layout pass)  --nohaze  --nodof
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
from office_city import *

SHOT = str(arg('--shot', 'S08')).upper()
DEBUG = bool(arg('--debuglight'))
HAZE = not bool(arg('--nohaze')) and not DEBUG
DOF = not bool(arg('--nodof')) and not DEBUG
STILL = (2560, 1440)


def cam_at(name, loc, tgt, lens, fstop, focus, roll=0.0):
    c = camera(name, loc=loc, lens=lens, fstop=fstop if DOF else None, clip=(0.005, 400))
    c.rotation_euler = look_rot(loc, tgt, math.radians(roll))
    if DOF:
        if hasattr(focus, 'location'):
            c.data.dof.focus_object = focus
        else:
            c.data.dof.focus_distance = focus
    return c


def debug_light(target, loc, energy=600.0, size=4.0):
    light('AREA', 'Debug', loc, energy=energy, size=size, target=target)
    world_color((0.05, 0.05, 0.05), 1.0)


# ============================================================================ office (S08 afternoon / S38 dusk)

def shot_office(dusk=False):
    setup_render(1, 1, res=STILL, samples=64, mb=False, look='Medium High Contrast', clamp=5.0,
                 bounces=(3, 3, 4), exposure=-0.9 if not dusk else 0.0)
    world_color((0.0, 0.0, 0.0), 0.0)
    M = office_mats()
    A = build_office(M, door_angle=72.0, blinds_tilt=50.0 if not dusk else 56.0, lamp_on=dusk, lamp_energy=30.0)
    o = OFF
    wx0, wx1, wz0, wz1 = o['win']
    wxc, wzc = (wx0 + wx1) / 2, (wz0 + wz1) / 2
    # outside the window: sky card (no shadow) and, at dusk, an office block across the street
    if not dusk:
        sky = mat_emission('SkyDay', (0.80, 0.88, 1.0), 1.5)
    else:
        sky = mat_emission('SkyDusk', (0.10, 0.20, 0.55), 0.9)
    card = rbox('SkyCard', (14.0, 0.05, 9.0), (wxc, o['y1'] + 4.5, 2.0), sky, bev=0)
    no_shadow(card)
    if dusk:
        fm = mat_facade('Opposite', seed=7.0, bay=2.6, floor=3.3, ww=0.6, wh=0.55, lit=0.4, wall=(0.03, 0.03, 0.035),
                        strength=1.6, shop=False, cool_frac=0.5)
        opp = rbox('OppositeBlock', (30.0, 6.0, 26.0), (wxc, o['y1'] + 16.0, 13.0 - 9.0), fm, bev=0)
        no_shadow(opp)
    if DEBUG:
        debug_light((-0.4, 2.5, 0.9), (-0.4, 1.8, 2.4), energy=600, size=1.5)
    elif not dusk:
        sun('Sun', (-0.16, -0.84, -0.52), 16.0, kelvin(4300), angle=0.6)
        light('AREA', 'SkyFill', (wxc, o['y1'] + 0.7, wzc), (math.radians(-90), 0, 0), energy=120.0,
              color=kelvin(9000), size=wx1 - wx0, size_y=wz1 - wz0, shape='RECTANGLE')
        light('AREA', 'CorridorTroffer', (-1.4, -1.3, o['cor_h'] - 0.02), energy=40.0, color=kelvin(4100),
              size=0.3, size_y=1.2, shape='RECTANGLE')
    else:
        light('AREA', 'DuskFill', (wxc, o['y1'] + 0.7, wzc), (math.radians(-90), 0, 0), energy=90.0,
              color=(0.35, 0.55, 1.0), size=wx1 - wx0, size_y=wz1 - wz0, shape='RECTANGLE')
        light('AREA', 'CorridorNight', (-1.6, -1.7, o['cor_h'] - 0.02), energy=13.0, color=kelvin(4300),
              size=0.25, size_y=0.6, shape='RECTANGLE')
    if HAZE:
        hz = mat_volume('OfficeHaze', density=0.05 if not dusk else 0.012, color=(0.9, 0.9, 0.9), anisotropy=0.6,
                        noise_scale=1.4, contrast=(0.3, 0.75))
        volume_box('Haze', ((o['x0'] + o['x1']) / 2, o['y1'] / 2, o['H'] / 2), (o['x1'] - o['x0'] - 0.02, o['y1'] - 0.02,
                   o['H'] - 0.02), hz)
    foc = empty('Focus', (-0.35, 2.45, 0.95))
    cam_at('CamOffice', (-0.15, -0.82, 1.45), (-0.30, 3.0, 1.02), 24.0, 4.0, foc, roll=0.0)


# ============================================================================ S05 dealer's table

def shot_table():
    setup_render(1, 1, res=STILL, samples=96, mb=False, look='Medium High Contrast', clamp=4.0, bounces=(3, 4, 8),
                 filter_glossy=0.4)
    world_color((0.0, 0.0, 0.0), 0.0)
    M = table_mats()
    A = build_table(M)
    s = A['subject']
    rbox('BackWall', (4.0, 0.1, 2.0), (0.0, 1.4, 0.6), mat_wall('DealerWall', color=(0.18, 0.18, 0.17)), bev=0)
    if DEBUG:
        debug_light(tuple(s), (0.0, -0.3, 1.2), energy=60, size=1.5)
    else:
        nl = light('AREA', 'NorthWindow', (-0.95, 0.75, 0.62), energy=55.0, color=kelvin(7200), size=1.3, size_y=1.0,
                   shape='RECTANGLE', target=tuple(s))
        light('AREA', 'WindowBounce', (-0.4, -0.9, 0.5), energy=3.0, color=kelvin(6500), size=1.0, target=tuple(s))
        lamp = light('SPOT', 'DeskLampOff', (0.62, -0.18, 0.48), energy=9.0, color=kelvin(2900), spot=55, blend=0.6,
                     radius=0.05, target=(0.05, 0.02, 0.0))
    foc = empty('FocusT', tuple(s + Vector((0.0, 0.0, 0.001))))
    loc = s + Vector((0.075, -0.43, 0.345))
    cam_at('CamTable', tuple(loc), tuple(s + Vector((0.004, 0.012, 0.0))), 60.0, 2.8, foc, roll=0.0)


# ============================================================================ S11 bag macro

def shot_bag():
    setup_render(1, 1, res=STILL, samples=96, mb=False, look='Medium High Contrast', clamp=4.0, bounces=(3, 3, 4))
    world_color((0.0, 0.0, 0.0), 0.0)
    M = bag_mats()
    A = build_bag(M)
    L = A['lens']
    if DEBUG:
        debug_light(tuple(L), (0.0, -0.6, 0.6), energy=80, size=1.5)
    else:
        light('AREA', 'Window', (-0.95, 0.02, 0.42), energy=30.0, color=kelvin(6400), size=0.9, size_y=1.2,
              shape='RECTANGLE', target=tuple(L))
        light('AREA', 'Fill', (-0.2, -0.9, 0.3), energy=1.6, color=kelvin(6000), size=0.8, target=tuple(L))
        light('AREA', 'Rim', (0.55, 0.35, 0.45), energy=5.0, color=kelvin(3000), size=0.35, target=(0.0, 0.0, 0.15))
        light('AREA', 'Glint', tuple(L + Vector((-0.36, -0.52, 0.30))), energy=2.2, color=kelvin(7000), size=0.07,
              target=tuple(L))
    foc = empty('FocusB', tuple(L))
    loc = L + Vector((-0.17, -0.29, 0.055))
    cam_at('CamBag', tuple(loc), tuple(L + Vector((-0.008, 0.0, -0.002))), 85.0, 2.8, foc, roll=-1.0)


# ============================================================================ the district (S04 dusk / S23 night)

def shot_street(night=True):
    setup_render(1, 1, res=STILL, samples=64, mb=False, look='Medium High Contrast', clamp=6.0, bounces=(2, 3, 4),
                 exposure=1.3 if night else 0.6)
    M = street_mats(night=night)
    A = build_street(M, night=night)
    if night:
        world_sky((0.0022, 0.0034, 0.0075), (0.010, 0.0075, 0.006), strength=1.0, glow=((0.03, 0.014, 0.004), 0.5))
    else:
        world_sky((0.010, 0.022, 0.065), (0.07, 0.085, 0.11), strength=1.0, glow=((0.10, 0.075, 0.06), 0.35))
    if DEBUG:
        sun('DebugSun', (0.3, 0.5, -0.8), 2.0, (1, 1, 1), angle=5)
        world_color((0.3, 0.3, 0.3), 1.0)
    if HAZE:
        hz = mat_volume('StreetMist', density=0.0018 if night else 0.0012, color=(0.85, 0.85, 0.85), anisotropy=0.6)
        volume_box('Mist', (0.0, 45.0, 6.0), (2 * ST['hw'] - 0.1, 100.0, 12.0), hz)
    if night:
        foc = empty('FocusN', (0.5, 12.0, 1.0))
        cam_at('CamNight', (-3.3, -2.6, 1.3), (1.0, 26.0, 3.6), 30.0, 4.0, foc, roll=0.0)
    else:
        foc = empty('FocusD', (0.5, 9.0, 1.5))
        cam_at('CamDusk', (-3.2, -19.0, 1.95), (2.0, 14.0, 7.0), 36.0, 5.6, foc, roll=0.0)


reset()
if SHOT == 'S08':
    shot_office(dusk=False)
elif SHOT == 'S38':
    shot_office(dusk=True)
elif SHOT == 'S05':
    shot_table()
elif SHOT == 'S11':
    shot_bag()
elif SHOT == 'S23':
    shot_street(night=True)
elif SHOT == 'S04':
    shot_street(night=False)
else:
    raise SystemExit(f'unknown --shot {SHOT}')
for nm in str(arg('--hide', '') or '').split(','):
    if nm and nm in bpy.data.objects:
        bpy.data.objects[nm].hide_render = True
finish(SHOT)
