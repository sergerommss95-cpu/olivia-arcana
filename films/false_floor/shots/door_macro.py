"""FALSE FLOOR · set A2 "door macro": macro close-ups of the vault door's security layers (illustrative
reconstruction). Shots (SHOTS_v2.json, owner A2_macro):
  S15  drill bit approaches the door edge and FREEZES millimetres short (seismic sensor beat)
  S16  0-99 wheel; camera cranes up and pushes into the small reading lens on top, one number magnified
  S17  the long two-part key turning deep in the lock (no hand)
  S18  two magnetic contact plates across the door/frame seam, clean dark gap (lead adds field lines in post)
  S22  same plates in daylight: screws backed out, held with a strip of tape
  S24  aluminium plate slides over both plates; the door edge moves away, the plates stay paired

python3 films/tumbler/tools/rb.py films/false_floor/shots/door_macro.py -- --shot S15 --stills 7,40 --pct 30 --samples 12
Extra flags: --debuglight (flat layout light), --anchors (S18/S24: write tests/<shot>_anchors.json for the post lines).
Render frames 1..N (N = render_frames, 6-frame handles each side; the cut uses 7..N-6).
"""
import sys, os, math, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
from ff import *
from door_macro import *

SHOT = arg('--shot', 'S15')
SH = {s['id']: s for s in json.load(open(os.path.join(FF, 'script', 'SHOTS_v2.json')))['shots']}[SHOT]
N = SH['render_frames']
H = 6
A, B = H + 1, N - H                     # first / last frame of the cut

sc = reset()
setup_render(1, N, res=RES_FINAL, samples=40, look='Medium High Contrast', clamp=4.0)
world_color((0.0011, 0.0013, 0.0016))
M = macro_mats()
COOL = (0.62, 0.74, 1.0)
CREAM = kelvin(4000)
pi = math.pi


def debug_light(cam):
    if arg('--debuglight'):
        light('AREA', 'Debug', tuple(cam.matrix_world.translation), energy=3.0, size=0.25,
              target=tuple(cam.matrix_world.translation + cam.matrix_world.to_3x3() @ Vector((0, 0, -1))))
        bpy.context.scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 30.0


def from_dir(target, direction, dist):
    d = Vector(direction).normalized()
    return tuple(Vector(target) + d * dist)


# ============================================================================= S15
def s15():
    F = A + 44                                       # freeze frame (cut frame 45, ~1.8 s in)
    door_fragment(M, x0=-0.25, z0=-0.12, z1=0.12)
    rbox('SeamVoid', -0.012, 0.012, 0.008, 0.25, -0.13, 0.13, mat=M['black'])
    frame_fragment(M, x1=0.22, z0=-0.12, z1=0.12)
    tip_x, tip_z, gap = -0.034, 0.003, 0.0016
    T = Vector((tip_x, -gap, tip_z))
    flen = 0.085
    adv = empty('BitAdvance', (tip_x, 0, tip_z))
    adv.rotation_euler = (-pi / 2, 0, 0)             # bit local +Z -> world +Y (into the door)
    bit = drill_bit(M, flute_len=flen)
    parent(bit, adv, keep=False)
    motion_steps(bit, 3)
    y_end = -gap - flen
    y_start = y_end - 0.046
    key(adv, 'location', [(1, (tip_x, y_start, tip_z)), (F, (tip_x, y_end, tip_z))], interp='LINEAR')
    spin = math.radians(128)                          # per frame, clockwise seen from the chuck
    key(bit, 'rotation_euler', [(1, 0.0), (F, spin * (F - 1))], index=2, interp='LINEAR')
    # camera: low on the door face, looking across the steel at the point; dollies with the bit, then creeps in on
    # the frozen gap
    cam = camera('CamS15', lens=65, fstop=14.0, ratio=1.6)
    foc = empty('FocusS15', tuple(T + Vector((0, 0.0004, 0))))
    cam.data.dof.focus_object = foc
    dr = (-0.86, -0.50, 0.16)
    cam_path(cam, [(1, from_dir(T + Vector((0.0, -0.022, 0.0)), dr, 0.125), T + Vector((0.0, -0.022, 0.0)), 0.0),
                   (F, from_dir(T, dr, 0.082), T + Vector((0.0, -0.003, 0.0)), 0.0),
                   (N, from_dir(T, (-0.85, -0.50, 0.19), 0.064), T + Vector((0.0, -0.001, 0.0)), 0.0)])
    for fc in fcurves(cam):
        for kp in fc.keyframe_points:
            if kp.co.x == F:
                kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
    shake(cam, 0.00012, 0.0006, scale=18, seed=5)
    # light: hard cream key grazing the door face from upper left; cool top rim; faint cool fill
    k = light('SPOT', 'Key', tuple(T + Vector((-0.11, -0.016, 0.085))), energy=0.30, color=CREAM, spot=22.0, blend=0.75,
              radius=0.003, target=tuple(T + Vector((0.004, 0.0, -0.004))))
    # sheen: a cool strip far right, placed so its mirror image in the steel sits behind the point -> the bit and its
    # reflection read in silhouette against the brushed sheen
    light('AREA', 'Sheen', tuple(T + Vector((0.135, -0.042, -0.006))), energy=0.03, color=kelvin(5200), size=0.004,
          size_y=0.06, shape='RECTANGLE', target=tuple(T + Vector((0.028, 0.0, 0.0))))
    light('AREA', 'Rim', tuple(T + Vector((0.025, -0.02, 0.11))), energy=0.10, color=COOL, size=0.03,
          target=tuple(T + Vector((0.0, -0.02, 0.0))))
    light('AREA', 'Fill', tuple(T + Vector((0.05, -0.16, -0.05))), energy=0.012, color=COOL, size=0.1, target=tuple(T))
    light('AREA', 'Edge', tuple(T + Vector((0.06, -0.03, 0.04))), energy=0.05, color=CREAM, size=0.004,
          target=(0.0, 0.0, tip_z))
    macro_motes('Motes', T + Vector((-0.015, -0.02, 0.004)), (0.05, 0.05, 0.035), count=150, seed=7, start=1, end=F,
                drift=(0.0006, 0.0003, 0.0012))
    debug_light(cam)
    return cam


# ============================================================================= S16
def s16():
    door_plate(M, x0=-0.2, x1=0.2, z0=-0.17, z1=0.2)
    D = dial_with_lens(M, s=0.062, tilt=40.0)
    dial = D['dial']
    Tv = lambda v: 2 * pi * v / 100.0
    key(dial, 'rotation_euler', [(1, Tv(18)), (58, Tv(47)), (76, Tv(47)), (146, Tv(24)), (158, Tv(24)), (200, Tv(36.35)),
                                 (206, Tv(35.92)), (212, Tv(36.0)), (N, Tv(36.0))], index=2)
    motion_steps(dial, 3)
    u, top, img = D['axis'], D['lens_top'], D['image']
    cam = camera('CamS16', lens=90, fstop=8.0, ratio=1.6)
    key_data(cam.data.dof, cam, 'aperture_fstop', [(1, 8.0), (150, 8.0), (204, 18.0), (N, 18.0)])
    f0 = (-0.0181, -0.0203, 0.0315)                    # numerals at ten past (start focus)
    foc = empty('FocusS16', f0)
    cam.data.dof.focus_object = foc
    side = Vector((0.004, 0.0, 0.0))
    end1 = top + u * 0.082 + side
    end2 = top + u * 0.072 + side * 0.8
    cam_path(cam, [(1, (-0.080, -0.147, 0.005), (-0.016, -0.021, 0.034), 0.02),
                   (70, (-0.072, -0.139, 0.020), (-0.012, -0.021, 0.040), 0.015),
                   (150, (-0.036, -0.135, 0.100), (-0.001, -0.024, 0.070), 0.0),
                   (204, tuple(end1), tuple(top - u * 0.004), 0.0),
                   (N, tuple(end2), tuple(top - u * 0.004), 0.0)])
    key(foc, 'location', [(1, f0), (95, (-0.0161, -0.0203, 0.036)), (170, tuple(top - u * 0.004)), (204, tuple(img)),
                          (N, tuple(img))])
    shake(cam, 0.00012, 0.0005, scale=20, seed=3)
    # light: hard cream key raking the face from upper left (numerals, ticks and knurl catch it); light leaking into the
    # hood onto the number under the lens; a top rim on the hood; very low cool fill out of the face's mirror path
    light('AREA', 'Key', (-0.16, -0.09, 0.14), energy=0.8, color=CREAM, size=0.01, target=(0.0, -0.02, 0.035))
    il = light('POINT', 'LensInner', tuple(D['lens_c'] - u * 0.005 + Vector((0.0, 0.0015, 0.0))), energy=0.006,
               color=kelvin(4300), radius=0.0015)
    try:
        il.visible_glossy = False
        il.visible_transmission = False
    except Exception:
        pass
    light('AREA', 'Fill', (0.20, -0.12, 0.06), energy=0.02, color=COOL, size=0.12, target=(0.0, -0.01, 0.02))
    light('AREA', 'Rim', (0.09, -0.015, 0.18), energy=0.25, color=COOL, size=0.04, target=(0.0, -0.015, 0.075))
    macro_motes('Motes', (-0.012, -0.065, 0.055), (0.09, 0.09, 0.075), count=170, seed=11, start=1, end=N,
                drift=(0.0015, 0.0005, 0.0022))
    debug_light(cam)
    return cam


# ============================================================================= S17
def s17():
    door = door_plate(M, x0=-0.25, x1=0.25, z0=-0.2, z1=0.25, depth=0.12)
    lock_boss(M, door)
    kt = long_key(M)
    key(kt, 'rotation_euler', [(1, 0.0), (28, 0.0), (92, -pi / 2), (112, -pi / 2), (156, -pi - 0.035), (162, -pi + 0.01),
                               (168, -pi), (N, -pi)], index=1)
    motion_steps(kt, 3)
    cam = camera('CamS17', lens=50, fstop=4.0, ratio=1.6)
    foc = empty('FocusS17', (0.0, -0.138, 0.0))
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, (0.066, -0.262, 0.046), (0.0, -0.140, 0.002), 0.03),
                   (100, (0.060, -0.180, 0.040), (0.0, -0.075, 0.0), 0.02),
                   (N, (0.052, -0.098, 0.032), (0.0, -0.016, -0.002), 0.0)])
    key(foc, 'location', [(1, (0.0, -0.138, 0.0)), (40, (0.0, -0.136, 0.0)), (150, (0.0, -0.045, 0.0)),
                          (N, (0.0, -0.021, 0.0))])
    shake(cam, 0.0002, 0.0006, scale=18, seed=9)
    light('AREA', 'Key', (-0.13, -0.11, 0.17), energy=1.4, color=CREAM, size=0.012, target=(0.0, -0.06, 0.0))
    light('AREA', 'Graze', (0.17, -0.02, 0.09), energy=0.5, color=kelvin(4600), size=0.01, target=(0.0, 0.0, 0.0))
    light('AREA', 'Fill', (0.12, -0.30, -0.08), energy=0.10, color=COOL, size=0.15, target=(0.0, -0.15, 0.0))
    light('AREA', 'Rim', (-0.05, -0.20, 0.16), energy=0.25, color=COOL, size=0.04, target=(0.0, -0.16, 0.0))
    # sheen in the panel's mirror path so the brushed door steel around the boss reads as metal
    light('AREA', 'PanelSheen', (-0.17, -0.12, -0.04), energy=0.03, color=kelvin(4800), size=0.06, size_y=0.2,
          shape='RECTANGLE', target=(-0.05, 0.0, 0.0))
    macro_motes('Motes', (0.01, -0.15, 0.02), (0.12, 0.24, 0.09), count=240, seed=13, start=1, end=N,
                drift=(0.002, 0.001, 0.003), r=(0.00003, 0.00008))
    debug_light(cam)
    return cam


# ============================================================================= S18 / S22 / S24: magnetic plates
def plates(loosen_door=(0.0,) * 4, loosen_frame=(0.0,) * 4, hinge=False):
    S = seam_set(M, hinge=hinge)
    rbox('SeamVoid', -0.012, 0.012, 0.04, 0.3, -0.3, 0.3, mat=M['black'])
    proto = screw_proto(M)
    D = mag_plate(M, -1, proto, 'MagDoor', loosen=loosen_door)
    Fm = mag_plate(M, 1, proto, 'MagFrame', loosen=loosen_frame, cable=True)
    return S, D, Fm


G, T_ = PL['gap'], PL['t']
ANCH = {}
for _z in (0.02, 0.045, 0.07):
    ANCH[f'door_contact_z{int(_z * 1000)}'] = (-G, -0.0065, _z)          # inner (gap-facing) face of each half
    ANCH[f'frame_contact_z{int(_z * 1000)}'] = (G, -0.0085, _z)
    ANCH[f'door_front_z{int(_z * 1000)}'] = (-G - 0.004, -T_, _z)        # front face, 4 mm from the gap edge
    ANCH[f'frame_front_z{int(_z * 1000)}'] = (G + 0.004, -T_ - FRAME_PROUD, _z)


def night_plate_lights(sheen=True):
    # hard cream key grazing down from upper left (screw heads, block bevels); cool top rim; very low cool fill.
    light('AREA', 'Key', (-0.15, -0.075, 0.27), energy=1.3, color=CREAM, size=0.01, target=(0.0, -0.012, 0.04))
    light('AREA', 'Rim', (0.06, -0.03, 0.27), energy=0.35, color=COOL, size=0.04, target=(0.0, -0.012, 0.05))
    light('AREA', 'Fill', (0.14, -0.25, -0.10), energy=0.10, color=(0.75, 0.83, 1.0), size=0.18, target=(0.0, -0.01, 0.0))
    light('AREA', 'Kick', (0.22, -0.07, 0.06), energy=0.10, color=CREAM, size=0.008, target=(0.04, -0.015, 0.04))
    if not sheen:
        return
    # soft sheen placed in the door face's mirror path: the brushed door steel left of the plates reads as metal
    light('AREA', 'DoorSheen', (-0.21, -0.33, -0.09), energy=0.22, color=kelvin(4800), size=0.05, size_y=0.22,
          shape='RECTANGLE', target=(-0.06, 0.0, 0.05))


def s18():
    plates()
    tgt = Vector((0.0, -0.010, 0.050))
    cam = camera('CamS18', lens=60, fstop=9.0, ratio=1.6)
    foc = empty('FocusS18', (0.0, -0.012, 0.050))
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, from_dir(tgt, (0.24, -0.89, 0.38), 0.36), tuple(tgt), 0.0),
                   (N, from_dir(tgt, (0.20, -0.90, 0.38), 0.27), tuple(tgt + Vector((0.0, 0.0, -0.004))), 0.0)])
    shake(cam, 0.00015, 0.0004, scale=20, seed=4)
    night_plate_lights()
    macro_motes('Motes', (0.0, -0.07, 0.05), (0.14, 0.12, 0.10), count=170, seed=5, start=1, end=N,
                r=(0.00003, 0.00007))
    debug_light(cam)
    return cam


def s22():
    S, D, Fm = plates(loosen_door=(0.0034, 0.0029, 0.0031, 0.0026), loosen_frame=(0.0027, 0.0023, 0.0024, 0.0020))
    # door half: from the door plate, over the block, down its gap face onto the plate again
    pd = [(-0.112, 0.0), (-0.0748, 0.0), (-0.0720, -0.0026), (-0.0720, -0.0105), (-0.0713, -0.0123), (-0.0695, -0.0130),
          (-0.0125, -0.0130), (-0.0107, -0.0123), (-0.0100, -0.0105), (-0.0100, -0.0026), (-0.0074, 0.0), (-0.0042, 0.0)]
    tape_strip(M, pd, 0.0535, 0.0725, name='TapeDoor', seed=5)
    # frame half (frame face 2 mm proud), slightly lower and not quite square to the first
    yf = -FRAME_PROUD
    pf = [(0.0043, yf), (0.0074, yf), (0.0100, yf - 0.0026), (0.0100, yf - 0.0105), (0.0107, yf - 0.0123),
          (0.0125, yf - 0.0130), (0.0695, yf - 0.0130), (0.0713, yf - 0.0123), (0.0720, yf - 0.0105),
          (0.0720, yf - 0.0026), (0.0748, yf), (0.109, yf)]
    tape_strip(M, pf, 0.0490, 0.0680, name='TapeFrame', seed=9)
    scr = Vector((0.0, -0.0175, 0.088))            # between the two raised inner top screws
    tp = Vector((-0.020, -0.0133, 0.063))          # door-half tape on the block front
    cam = camera('CamS22', lens=70, fstop=6.0, ratio=1.6)
    foc = empty('FocusS22', (-0.020, -0.0178, 0.088))
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, from_dir(scr, (0.12, -0.58, 0.80), 0.165), tuple(scr + Vector((0.0, 0.0, -0.004))), 0.0),
                   (N, from_dir(tp + Vector((0.012, 0.0, 0.008)), (0.07, -0.70, 0.71), 0.15),
                    tuple(tp + Vector((0.012, 0.0, 0.008))), 0.0)])
    key(foc, 'location', [(1, (-0.020, -0.0178, 0.088)), (80, (-0.020, -0.0178, 0.088)), (180, tuple(tp)),
                          (N, tuple(tp))])
    shake(cam, 0.00015, 0.0004, scale=20, seed=8)
    # daylight-ish: neutral overhead fluorescents (broad) + a crisp neutral grazing key from upper left (screw slots,
    # bevels, tape creases), soft fill; brighter, cleaner than the night shots
    light('AREA', 'Overhead', (-0.02, -0.24, 0.50), energy=1.6, color=kelvin(5200), size=0.25, size_y=0.06,
          shape='RECTANGLE', target=(0.0, -0.01, 0.06))
    light('AREA', 'Graze', (-0.20, -0.06, 0.24), energy=1.1, color=kelvin(5000), size=0.012, target=(0.0, -0.014, 0.07))
    light('AREA', 'Fill', (0.25, -0.30, 0.0), energy=0.15, color=kelvin(6000), size=0.3, target=(0.0, -0.01, 0.05))
    bpy.context.scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.004, 0.0042, 0.0045, 1)
    macro_motes('Motes', (0.0, -0.06, 0.075), (0.10, 0.10, 0.07), count=110, seed=9, start=1, end=N,
                r=(0.00003, 0.00007))
    debug_light(cam)
    return cam


def s24():
    S, D, Fm = plates(loosen_door=(0.0016, 0.0013, 0.0015, 0.0012), hinge=True)
    al = alu_plate(M)
    key(al, 'location', [(1, (0.175, -0.022, 0)), (16, (0.175, -0.022, 0)), (62, (0.004, -0.007, 0)),
                         (72, (0.0, 0.0, 0)), (N, (0, 0, 0))])
    motion_steps(al, 2)
    hv = S['hinge']
    key(hv, 'rotation_euler', [(1, 0.0), (122, 0.0), (228, 0.16), (N, 0.163)], index=2)
    tgt = Vector((-0.012, -0.010, 0.012))
    cam = camera('CamS24', lens=40, fstop=5.6, ratio=1.6)
    foc = empty('FocusS24', (0.0, -0.017, 0.012))
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, from_dir(tgt, (-0.40, -0.84, 0.36), 0.34), tuple(tgt), 0.0),
                   (115, from_dir(tgt, (-0.40, -0.84, 0.36), 0.31), tuple(tgt), 0.0),
                   (N, from_dir(tgt + Vector((-0.02, 0.0, 0.0)), (-0.55, -0.76, 0.35), 0.36),
                    tuple(tgt + Vector((-0.02, 0.02, 0.0))), 0.0)])
    shake(cam, 0.00015, 0.0004, scale=20, seed=6)
    night_plate_lights(sheen=False)
    macro_motes('Motes', (0.0, -0.07, 0.04), (0.16, 0.12, 0.10), count=170, seed=15, start=1, end=N,
                r=(0.00003, 0.00007))
    debug_light(cam)
    return cam


cam = {'S15': s15, 'S16': s16, 'S17': s17, 'S18': s18, 'S22': s22, 'S24': s24}[SHOT]()

if arg('--fstop'):
    cam.data.dof.aperture_fstop = float(arg('--fstop'))

if arg('--anchors') and SHOT in ('S18', 'S24'):
    pts = dict(ANCH)
    write_anchors(os.path.join(FF, 'tests', f'{SHOT}_anchors.json'), cam, pts, A, B,
                  note=f'{SHOT}: normalised screen positions (x right, y down) of the magnetic plates for the post field '
                       f'lines, cut frames {A}..{B}. *_contact = centre of each contact face across the gap.')

finish(SHOT)
