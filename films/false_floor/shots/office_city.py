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
                 bounces=(3, 3, 4), exposure=-0.55 if not dusk else 1.1)
    world_color((0.0, 0.0, 0.0), 0.0)
    M = office_mats()
    A = build_office(M, door_angle=72.0, blinds_tilt=50.0 if not dusk else 56.0, lamp_on=dusk, lamp_energy=40.0)
    o = OFF
    wx0, wx1, wz0, wz1 = o['win']
    wxc, wzc = (wx0 + wx1) / 2, (wz0 + wz1) / 2
    # outside the window: sky card (no shadow) and, at dusk, an office block across the street
    if not dusk:
        sky = mat_emission('SkyDay', (0.80, 0.88, 1.0), 1.5)
    else:
        sky = mat_emission('SkyDusk', (0.10, 0.20, 0.55), 1.2)
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
        sun('Sun', (-0.16, -0.84, -0.52), 24.0, kelvin(4300), angle=0.25)
        light('AREA', 'SkyFill', (wxc, o['y1'] + 0.7, wzc), (math.radians(-90), 0, 0), energy=200.0,
              color=kelvin(9000), size=wx1 - wx0, size_y=wz1 - wz0, shape='RECTANGLE')
        light('AREA', 'CorridorTroffer', (-0.7, -1.0, o['cor_h'] - 0.02), energy=24.0, color=kelvin(4100),
              size=0.3, size_y=1.2, shape='RECTANGLE')
    else:
        light('AREA', 'DuskFill', (wxc, o['y1'] + 0.7, wzc), (math.radians(-90), 0, 0), energy=170.0,
              color=(0.35, 0.55, 1.0), size=wx1 - wx0, size_y=wz1 - wz0, shape='RECTANGLE')
        light('AREA', 'CorridorNight', (-1.6, -1.7, o['cor_h'] - 0.02), energy=20.0, color=kelvin(4300),
              size=0.25, size_y=0.6, shape='RECTANGLE')
    if HAZE:
        hz = mat_volume('OfficeHaze', density=0.022 if not dusk else 0.012, color=(0.9, 0.9, 0.9), anisotropy=0.6,
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
    setup_render(1, 1, res=STILL, samples=96, mb=False, look='Medium High Contrast', clamp=4.0, bounces=(3, 3, 4),
                 exposure=0.3)
    world_color((0.0, 0.0, 0.0), 0.0)
    M = bag_mats()
    A = build_bag(M)
    L = A['lens']
    if DEBUG:
        debug_light(tuple(L), (0.0, -0.6, 0.6), energy=80, size=1.5)
    else:
        light('AREA', 'Window', (-0.95, 0.02, 0.42), energy=58.0, color=kelvin(6400), size=0.9, size_y=1.2,
              shape='RECTANGLE', target=tuple(L))
        light('AREA', 'Fill', (-0.2, -0.9, 0.3), energy=4.0, color=kelvin(6000), size=0.8, target=tuple(L))
        light('AREA', 'Rim', (0.55, 0.35, 0.45), energy=5.0, color=kelvin(3000), size=0.35, target=(0.0, 0.0, 0.15))
        light('AREA', 'Glint', tuple(L + Vector((-0.36, -0.52, 0.30))), energy=2.2, color=kelvin(7000), size=0.07,
              target=tuple(L))
    foc = empty('FocusB', tuple(L))
    loc = L + Vector((-0.17, -0.29, 0.055))
    cam_at('CamBag', tuple(loc), tuple(L + Vector((-0.008, 0.0, -0.002))), 85.0, 2.8, foc, roll=-1.0)


# ============================================================================ the district (S04 dusk / S23 night)

def shot_street(night=True):
    setup_render(1, 1, res=STILL, samples=64, mb=False, look='Medium High Contrast', clamp=6.0, bounces=(2, 3, 4),
                 exposure=2.2 if night else 1.5)
    M = street_mats(night=night)
    A = build_street(M, night=night)
    if night:
        world_sky((0.006, 0.009, 0.018), (0.022, 0.017, 0.013), strength=1.0, glow=((0.035, 0.018, 0.006), 0.5))
    else:
        world_sky((0.018, 0.038, 0.10), (0.11, 0.13, 0.16), strength=1.0, glow=((0.14, 0.10, 0.075), 0.35))
    if DEBUG:
        sun('DebugSun', (0.3, 0.5, -0.8), 2.0, (1, 1, 1), angle=5)
        world_color((0.3, 0.3, 0.3), 1.0)
    if HAZE:
        hz = mat_volume('StreetMist', density=0.0014 if night else 0.0011, color=(0.85, 0.85, 0.85), anisotropy=0.6)
        volume_box('Mist', (0.0, 45.0, 6.0), (2 * ST['hw'] - 0.1, 100.0, 12.0), hz)
    if night:
        foc = empty('FocusN', (0.5, 12.0, 1.0))
        cam_at('CamNight', (-3.3, -2.6, 1.3), (1.0, 26.0, 3.6), 30.0, 4.0, foc, roll=0.0)
    else:
        foc = empty('FocusD', (0.5, 9.0, 1.5))
        cam_at('CamDusk', (-3.4, -26.0, 2.2), (2.0, 14.0, 5.0), 32.0, 5.6, foc, roll=0.0)


# ============================================================================ N1 (The Night): fast drone push

def shot_n1(frames=80):
    """FAST low drone push up the empty wet night street (S23 set): ~0.6 m over the setts, threading the bollard row
    close to the lens (~f27), then rising and yawing onto the lit lobby entrance on the right (y~23). Frames 1..80,
    cut 7..74. Speed ~9 m/s, easing to ~3.5 m/s over the last 30 frames. Motion blur on."""
    from city import spline
    setup_render(1, frames, res=RES_FINAL, samples=40, mb=True, shutter=0.5, look='Medium High Contrast', clamp=6.0,
                 bounces=(2, 3, 4), exposure=2.7)
    M = street_mats(night=True)
    build_street(M, night=True)
    world_sky((0.009, 0.013, 0.026), (0.03, 0.023, 0.017), strength=1.0, glow=((0.045, 0.024, 0.008), 0.5))
    if HAZE:
        hz = mat_volume('StreetMist', density=0.0013, color=(0.85, 0.85, 0.85), anisotropy=0.6)
        volume_box('Mist', (0.0, 40.0, 4.5), (2 * ST['hw'] - 0.1, 70.0, 9.0), hz)
    ctrl = [(-0.85, -3.0, 0.58), (-0.86, 3.0, 0.60), (-0.80, 8.5, 0.63), (-0.25, 12.5, 0.82), (0.95, 15.3, 1.30),
            (1.80, 17.0, 1.92)]
    P = spline(ctrl, 30)
    cum = [0.0]
    for i in range(1, len(P)):
        cum.append(cum[-1] + (P[i] - P[i - 1]).length)
    total = cum[-1]

    def at(sv):
        sv = max(0.0, min(total, sv))
        for i in range(1, len(cum)):
            if cum[i] >= sv:
                t = (sv - cum[i - 1]) / max(1e-9, cum[i] - cum[i - 1])
                return P[i - 1].lerp(P[i], t)
        return P[-1].copy()

    vel = [9.5 if f < 50 else 9.5 - 6.0 * ease((f - 50) / 30.0, 'out') for f in range(1, frames + 1)]
    dist = [0.0]
    for f in range(1, frames):
        dist.append(dist[-1] + 0.5 * (vel[f - 1] + vel[f]) / 24.0)
    k = total / dist[-1]
    cd = bpy.data.cameras.new('CamN1')
    cd.lens = 24.0
    cd.sensor_width = 36.0
    cd.clip_start, cd.clip_end = 0.02, 400.0
    if DOF:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = 4.0
        cd.dof.focus_distance = 6.0
    cam = bpy.data.objects.new('CamN1', cd)
    link(cam)
    bpy.context.scene.camera = cam
    far = Vector((-0.4, 45.0, 1.6))
    door = Vector((4.4, 23.0, 1.75))
    prev = None
    for f in range(1, frames + 1):
        loc = at(dist[f - 1] * k)
        w = ease((f - 44) / 36.0) if f > 44 else 0.0
        tgt = far.lerp(door, w)
        e = look_rot(loc, tgt, math.radians(2.5 * w))
        if prev is not None:
            e.make_compatible(prev)
        prev = e.copy()
        cam.location = loc
        cam.rotation_euler = e
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
    linear(cam)
    shake(cam, amp=0.004, rot_amp=0.0018, scale=7.0, seed=3)


# ============================================================================ COLD OPEN: C1 (guard, street) / C13 (tenant)

def heading_yaw(MCm, M, a, b, want=(0.0, 1.0)):
    """Yaw (deg) turning the subject's travel over source frames a..b onto the wanted XY direction (as in night.py)."""
    _, P0a, _ = MCm.fk(M, a)
    _, P0b, _ = MCm.fk(M, b)
    d = MCm._zup(P0b['root']) - MCm._zup(P0a['root'])
    return math.degrees(math.atan2(want[1], want[0]) - math.atan2(d.y, d.x))


def ease_keys(o):
    for fc in fcurves(o):
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing = 'EASE_IN_OUT'


def shot_c1(frames=90):
    """Monday morning, cold grey-blue overcast daylight in the district street (S04/S23 set, damp, building lights
    on). The GUARD (cast, navy blazer) enters from frame right on a diagonal (CMU 02_01 walk) and leads a low drone
    up the street toward the entrance. Frames 1..90, cut 7..84."""
    import cast as CA
    import mocap as MC
    setup_render(1, frames, res=RES_FINAL, samples=40, mb=True, shutter=0.5, look='Medium High Contrast', clamp=6.0,
                 bounces=(2, 3, 4), exposure=0.9)
    M = street_mats(night=False)
    build_street(M, night=False)
    world_sky((0.13, 0.17, 0.25), (0.24, 0.26, 0.29), strength=1.0, glow=((0.26, 0.26, 0.27), 0.2))
    light('AREA', 'Overcast', (0.0, 18.0, 30.0), energy=9000.0, color=kelvin(7600), size=12.0, size_y=40.0,
          shape='RECTANGLE')
    if HAZE:
        hz = mat_volume('MorningMist', density=0.0022, color=(0.8, 0.84, 0.9), anisotropy=0.3)
        volume_box('Mist', (0.0, 40.0, 4.5), (2 * ST['hw'] - 0.1, 90.0, 9.0), hz)
    g = CA.make('guard')
    W = MC.load('02', '02_01')
    yaw = heading_yaw(MC, W, 0, 342, want=(-0.45, 1.0))
    MC.apply(g, W, start_frame=1, src_range=(0, 342), step=4.0, pos=(2.35, -1.25), yaw_deg=yaw)
    cam = camera('CamC1', lens=24.0, fstop=4.0 if DOF else None, clip=(0.02, 400))
    cam_path(cam, [(1, (-0.38, -4.3, 0.92), (0.5, 24.0, 2.3), 0.0),
                   (frames, (0.22, -0.35, 1.08), (-0.1, 24.0, 2.1), 0.0)])
    ease_keys(cam)
    for fc in fcurves(cam):          # already moving at the first frame: ease out only
        kp = fc.keyframe_points[0]
        kp.interpolation = 'LINEAR'
    shake(cam, amp=0.006, rot_amp=0.0022, scale=12.0, seed=5)
    if DOF:
        cam.data.dof.focus_object = g.rig
        cam.data.dof.focus_distance = 3.0


def bent_slat(name, src, L, xh, dz, width=0.07, nx=160, ny=7, w=0.025):
    """Replace a linked slat by its own fine strip with a local dip at local x = xh (dz < 0 pulls it down)."""
    bm = bmesh.new()
    grid = []
    for i in range(nx + 1):
        x = -L / 2 + L * i / nx
        d = dz * math.exp(-((x - xh) / width) ** 2)
        row = []
        for j in range(ny + 1):
            yy = -w / 2 + w * j / ny
            zz = 0.0014 * (1 - (2 * yy / w) ** 2) + d * (0.6 + 0.4 * (0.5 - yy / w))
            row.append(bm.verts.new((x, yy, zz)))
        grid.append(row)
    for i in range(nx):
        for j in range(ny):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
    me = bpy.data.meshes.new(name + '_bent')
    bm.to_mesh(me)
    bm.free()
    for p_ in me.polygons:
        p_.use_smooth = True
    src.data = me
    m = src.modifiers.new('Solid', 'SOLIDIFY')
    m.thickness = 0.0005
    m.offset = 0.0
    return src


def shot_c13(frames=80):
    """The TENANT at his office window (style frame B, sf2_tenant.py): slow push in; afternoon sun through the blinds;
    the fingers of his right hand part two slats; over the shot he turns his head a little toward the room.
    Frames 1..80, cut 7..74."""
    import cast as CA
    import human as HU
    setup_render(1, frames, res=RES_FINAL, samples=40, mb=True, shutter=0.5, look='Medium High Contrast', clamp=5.0,
                 bounces=(3, 3, 4), exposure=-0.95)      # test f7/f74 at +0.15 measured mean 0.57/0.63 -> ~0.3
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
    if HAZE:
        hz = mat_volume('OfficeHaze', density=0.02, color=(0.9, 0.9, 0.9), anisotropy=0.6, noise_scale=1.4, contrast=(0.3, 0.75))
        volume_box('Haze', ((o['x0'] + o['x1']) / 2, o['y1'] / 2, o['H'] / 2),
                   (o['x1'] - o['x0'] - 0.02, o['y1'] - 0.02, o['H'] - 0.02), hz)
    A['chair'].location = (-0.98, 3.22, 0.0)        # clear of the tenant (no intersection)
    t = CA.make('tenant')
    HU.place(t, -0.15, 3.78, 192)
    CA.reach(t, 'R', HAND_C13, 0.2)
    CA.grip(t, 'R', 0.55)
    R3 = t.rig.matrix_world.to_3x3()
    HU.aim(t, 'LeftArm', R3 @ Vector((0.12, 0.02, -1)))
    HU.aim(t, 'LeftForeArm', R3 @ Vector((0.05, -0.25, -1)))
    CA.grip(t, 'L', 0.3)
    # the two slats around the fingers: upper lifted, lower pulled down (a parted gap)
    xc = (wx0 - 0.04 + wx1 + 0.04) / 2
    L = (wx1 + 0.04) - (wx0 - 0.04)
    bpy.context.view_layer.update()
    pbt = t.rig.pose.bones
    if 'RightF0_3' in pbt:      # per-finger chains: the slats part round the index + middle fingertips
        tip = t.rig.matrix_world @ ((pbt['RightF0_3'].tail + pbt['RightF1_3'].tail) * 0.5)
    else:
        tip = t.rig.matrix_world @ pbt['RightHandFinger1'].tail
    zs = sorted(A['slats'], key=lambda s_: abs(s_.location.z - tip.z))[:2]
    zs.sort(key=lambda s_: s_.location.z)
    bent_slat('SlatLow', zs[0], L, tip.x - xc, -0.022)
    bent_slat('SlatHigh', zs[1], L, tip.x - xc, 0.007)
    # head: from the window toward the room, keyed over the shot
    for f, (nx, nz, hx, hz_) in ((1, (8, -6, 10, -10)), (26, (8, -6, 10, -10)), (66, (3, -14, 2, -26)), (frames, (3, -15, 2, -27))):
        HU.rot(t, 'Neck1', x=nx, z=nz)
        HU.rot(t, 'Head', x=hx, z=hz_)
        for bn in ('Neck1', 'Head'):
            pb = t.rig.pose.bones[bn]
            pb.keyframe_insert('rotation_quaternion' if pb.rotation_mode == 'QUATERNION' else 'rotation_euler', frame=f)
    for fc in fcurves(t.rig):
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing = 'EASE_IN_OUT'
    DX, DY, DZ = A['desk']
    bag = rbox('ShoulderBag', (0.34, 0.12, 0.26), (DX + 0.28, DY - 0.05, DZ + 0.13),
               mat_leather('BagLeather', color=(0.07, 0.04, 0.025)), bev=0.03)
    bag.rotation_euler.z = math.radians(-14)
    foc = empty('FocusC13', (-0.12, 3.7, 1.55))
    cam = camera('CamC13', lens=32.0, fstop=2.4 if DOF else None, clip=(0.005, 400))
    cam_path(cam, [(1, (1.55, 1.25, 1.42), (-0.25, 3.85, 1.48), 0.0), (frames, (1.18, 1.80, 1.45), (-0.17, 3.86, 1.52), 0.0)])
    ease_keys(cam)
    shake(cam, amp=0.002, rot_amp=0.0008, scale=20.0, seed=13)
    if DOF:
        cam.data.dof.focus_object = foc



# ============================================================================ EP v3: stills of the cast for Kling animation

def _office_day(lamp=False, dusk=False):
    setup_render(1, 1, res=STILL, samples=96, mb=False, look='Medium High Contrast', clamp=5.0, bounces=(3, 3, 4),
                 exposure=-0.6 if not dusk else 0.4)
    world_color((0.0, 0.0, 0.0), 0.0)
    M = office_mats()
    A = build_office(M, door_angle=72.0, blinds_tilt=38.0 if not dusk else 62.0, lamp_on=lamp, lamp_energy=26.0)
    o = OFF
    wx0, wx1, wz0, wz1 = o['win']
    wxc, wzc = (wx0 + wx1) / 2, (wz0 + wz1) / 2
    sky = (0.80, 0.88, 1.0) if not dusk else (0.30, 0.36, 0.55)
    card = rbox('SkyCard', (14.0, 0.05, 9.0), (wxc, o['y1'] + 4.5, 2.0), mat_emission('Sky', sky, 1.6 if not dusk else 0.9), bev=0)
    no_shadow(card)
    if not dusk:
        sun('Sun', (-0.22, -0.82, -0.5), 30.0, kelvin(4100), angle=0.25)
    light('AREA', 'SkyFill', (wxc, o['y1'] + 0.7, wzc), (math.radians(-90), 0, 0), energy=260.0 if not dusk else 120.0,
          color=kelvin(8500), size=wx1 - wx0, size_y=wz1 - wz0, shape='RECTANGLE')
    light('AREA', 'RoomBounce', (1.4, 1.2, 2.5), energy=70.0, color=kelvin(4600), size=1.5)
    if HAZE:
        hz = mat_volume('OfficeHaze', density=0.016, color=(0.9, 0.9, 0.9), anisotropy=0.6, noise_scale=1.4, contrast=(0.3, 0.75))
        volume_box('Haze', ((o['x0'] + o['x1']) / 2, o['y1'] / 2, o['H'] / 2),
                   (o['x1'] - o['x0'] - 0.02, o['y1'] - 0.02, o['H'] - 0.02), hz)
    return M, A


def shot_epa_lease():
    """S07 'you start with a lease': the Tenant, standing at his new desk, signs the lease (pen in hand)."""
    import cast as CA
    import human as HU
    M, A = _office_day()
    DX, DY, DZ = A['desk']
    A['chair'].location = (DX + 1.4, DY + 1.2, 0.0)
    sheet = rbox('Lease', (0.21, 0.297, 0.002), (DX - 0.05, DY + 0.05, DZ + 0.002), mat_paper('LeasePaper') if 'mat_paper' in globals()
                 else mat_principled('LeasePaper', color=(0.82, 0.80, 0.74), rough=0.8), bev=0)
    sheet.rotation_euler.z = math.radians(8)
    t = CA.make('tenant')
    HU.place(t, DX - 0.08, DY + 0.40, 0)
    # lean over the desk from the ankles (feet stay put)
    heel = Vector((DX - 0.08, DY + 0.46, 0.0))
    t.rig.matrix_world = (Matrix.Translation(heel) @ Matrix.Rotation(math.radians(13), 4, 'X') @ Matrix.Translation(-heel) @
                          Matrix.Translation(Vector((DX - 0.08, DY + 0.40, 0.0))))
    bpy.context.view_layer.update()
    tip = Vector((DX - 0.02, DY + 0.02, DZ + 0.03))
    CA.reach(t, 'R', tip, 0.18)
    CA.grip(t, 'R', 0.75)
    CA.reach(t, 'L', Vector((DX - 0.22, DY + 0.12, DZ + 0.02)), 0.2)
    CA.grip(t, 'L', 0.2)
    CA.head_turn(t, 0, 24)
    bpy.context.view_layer.update()
    hp = t.rig.matrix_world @ t.rig.pose.bones['RightHand'].tail
    pen = prim('cyl', 'Pen', loc=tuple(hp + Vector((0.0, -0.01, -0.02))), r=0.0045, depth=0.14)
    pen.rotation_euler = (math.radians(35), 0, math.radians(20))
    pen.data.materials.append(mat_principled('PenBlack', color=(0.01, 0.01, 0.012), rough=0.3))
    foc = empty('FocusLease', tuple(tip))
    cam_at('CamLease', (DX + 0.95, DY - 1.35, 1.48), (DX - 0.1, DY + 0.3, 1.16), 35.0, 2.8, foc, roll=0.0)


def shot_epa_interview():
    """S43 the 2009 interview: the Tenant (older) at the office window at dusk, seen from behind; a small recorder
    with a red light on the desk in the foreground."""
    import cast as CA
    import human as HU
    M, A = _office_day(lamp=True, dusk=True)
    DX, DY, DZ = A['desk']
    A['chair'].location = (-0.98, 3.22, 0.0)
    t = HU.make_human('tenant_old', **dict(CA.SPEC['tenant'], age=58))
    HU.place(t, -0.15, 3.70, 180)
    CA.arms_down(t, 'L', 0.12)
    CA.arms_down(t, 'R', 0.12)
    CA.grip(t, 'L', 0.35)
    CA.grip(t, 'R', 0.35)
    CA.head_turn(t, -8, -4)
    rec = rbox('Recorder', (0.11, 0.06, 0.022), (DX + 0.12, DY - 0.18, DZ + 0.011), mat_principled('RecBody', color=(0.03, 0.03, 0.035), rough=0.35), bev=0.004)
    led = prim('cyl', 'RecLED', loc=(DX + 0.15, DY - 0.205, DZ + 0.023), r=0.0025, depth=0.002)
    led.data.materials.append(mat_emission('LEDRed', (1.0, 0.05, 0.03), 18.0))
    foc = empty('FocusInt', (-0.15, 3.6, 1.5))
    cam_at('CamInt', (1.45, 1.05, 1.30), (-0.2, 3.85, 1.45), 32.0, 2.8, foc, roll=0.0)


def _street_day(exposure=0.9):
    setup_render(1, 1, res=STILL, samples=96, mb=False, look='Medium High Contrast', clamp=6.0, bounces=(2, 3, 4),
                 exposure=exposure)
    M = street_mats(night=False)
    A = build_street(M, night=False)
    world_sky((0.13, 0.17, 0.25), (0.24, 0.26, 0.29), strength=1.0, glow=((0.26, 0.26, 0.27), 0.2))
    light('AREA', 'Overcast', (0.0, 18.0, 30.0), energy=9000.0, color=kelvin(7600), size=12.0, size_y=40.0, shape='RECTANGLE')
    if HAZE:
        hz = mat_volume('MorningMist', density=0.0022, color=(0.8, 0.84, 0.9), anisotropy=0.3)
        volume_box('Mist', (0.0, 40.0, 4.5), (2 * ST['hw'] - 0.1, 90.0, 9.0), hz)
    return M, A


def shot_epa_return():
    """S39 five days later: the Tenant walks back up the district street toward the Diamond Centre entrance (from behind)."""
    import cast as CA
    import mocap as MC
    M, A = _street_day()
    t = CA.make('tenant')
    W = MC.load('02', '02_01')
    yaw = heading_yaw(MC, W, 0, 342, want=(0.0, 1.0))
    MC.apply(t, W, start_frame=1, src_range=(40, 60), step=4.0, pos=(0.6, 3.2), yaw_deg=yaw)
    bpy.context.scene.frame_set(3)
    foc = empty('FocusRet', (0.6, 4.2, 1.3))
    cam_at('CamRet', (-0.35, -0.9, 1.25), (0.9, 14.0, 1.9), 35.0, 4.0, foc, roll=0.0)


def shot_epa_king():
    """S41 the King of Keys, never identified: walks away down the empty district street at night into the mist."""
    import cast as CA
    import mocap as MC
    setup_render(1, 1, res=STILL, samples=96, mb=False, look='Medium High Contrast', clamp=6.0, bounces=(2, 3, 4), exposure=2.2)
    M = street_mats(night=True)
    A = build_street(M, night=True)
    world_sky((0.006, 0.009, 0.018), (0.022, 0.017, 0.013), strength=1.0, glow=((0.035, 0.018, 0.006), 0.5))
    hz = mat_volume('StreetFog', density=0.0045, color=(0.85, 0.85, 0.85), anisotropy=0.6)
    volume_box('Fog', (0.0, 45.0, 6.0), (2 * ST['hw'] - 0.1, 100.0, 12.0), hz)
    k = CA.make('king')
    W = MC.load('02', '02_01')
    yaw = heading_yaw(MC, W, 0, 342, want=(0.0, 1.0))
    MC.apply(k, W, start_frame=1, src_range=(60, 80), step=4.0, pos=(0.3, 9.5), yaw_deg=yaw)
    bpy.context.scene.frame_set(3)
    foc = empty('FocusKing', (0.3, 10.0, 1.2))
    cam_at('CamKing', (-0.6, 3.2, 1.35), (0.5, 30.0, 2.2), 35.0, 4.0, foc, roll=0.0)

HAND_C13 = Vector((-0.02, 4.08, 1.58))

reset()
if SHOT == 'EPA_LEASE':
    shot_epa_lease()
elif SHOT == 'EPA_INTERVIEW':
    shot_epa_interview()
elif SHOT == 'EPA_RETURN':
    shot_epa_return()
elif SHOT == 'EPA_KING':
    shot_epa_king()
elif SHOT == 'C1':
    shot_c1()
elif SHOT == 'C13':
    shot_c13()
elif SHOT == 'N1':
    shot_n1()
elif SHOT == 'S08':
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
