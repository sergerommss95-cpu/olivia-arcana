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
    door_fragment(M, x0=-0.25, x1=0.0, z0=-0.12, z1=0.12)
    rbox('DoorEdgeVoid', -0.01, 0.01, 0.006, 0.25, -0.13, 0.13, mat=M['black'])
    frame_fragment(M, x0=0.004, x1=0.22, z0=-0.12, z1=0.12)
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
    k = light('AREA', 'Key', tuple(T + Vector((-0.11, -0.016, 0.085))), energy=0.18, color=CREAM, size=0.006,
              target=tuple(T + Vector((0.012, 0.0, -0.01))))
    # sheen: a cool strip far right, placed so its mirror image in the steel sits behind the point -> the bit and its
    # reflection read in silhouette against the brushed sheen
    light('AREA', 'Sheen', tuple(T + Vector((0.135, -0.042, -0.006))), energy=0.03, color=kelvin(5200), size=0.004,
          size_y=0.06, shape='RECTANGLE', target=tuple(T + Vector((0.028, 0.0, 0.0))))
    light('AREA', 'Rim', tuple(T + Vector((0.025, -0.02, 0.11))), energy=0.10, color=COOL, size=0.03,
          target=tuple(T + Vector((0.0, -0.02, 0.0))))
    light('AREA', 'Fill', tuple(T + Vector((0.05, -0.16, -0.05))), energy=0.02, color=COOL, size=0.1, target=tuple(T))
    light('AREA', 'Edge', tuple(T + Vector((0.06, -0.03, 0.04))), energy=0.05, color=CREAM, size=0.004,
          target=(0.0, 0.0, tip_z))
    macro_motes('Motes', T + Vector((-0.015, -0.02, 0.004)), (0.05, 0.05, 0.035), count=150, seed=7, start=1, end=F,
                drift=(0.0006, 0.0003, 0.0012))
    debug_light(cam)
    return cam


# ============================================================================= S16
def s16():
    door_plate(M, x0=-0.16, x1=0.16, z0=-0.14, z1=0.17)
    D = dial_with_lens(M, s=0.05, tilt=35.0)
    dial = D['dial']
    Tv = lambda v: 2 * pi * v / 100.0
    key(dial, 'rotation_euler', [(1, Tv(18)), (58, Tv(47)), (76, Tv(47)), (146, Tv(24)), (158, Tv(24)), (200, Tv(36.35)),
                                 (206, Tv(35.92)), (212, Tv(36.0)), (N, Tv(36.0))], index=2)
    motion_steps(dial, 3)
    u, top, img = D['axis'], D['lens_top'], D['image']
    cam = camera('CamS16', lens=90, fstop=8.0, ratio=1.6)
    key_data(cam.data.dof, cam, 'aperture_fstop', [(1, 8.0), (150, 8.0), (204, 16.0), (N, 16.0)])
    foc = empty('FocusS16', (-0.0146, -0.0164, 0.0254))
    cam.data.dof.focus_object = foc
    side = Vector((0.0032, 0.0, 0.0))
    end1 = top + u * 0.066 + side
    end2 = top + u * 0.058 + side * 0.8
    cam_path(cam, [(1, (-0.064, -0.118, 0.004), (-0.013, -0.017, 0.027), 0.02),
                   (70, (-0.058, -0.112, 0.016), (-0.010, -0.017, 0.032), 0.015),
                   (150, (-0.030, -0.105, 0.074), (-0.001, -0.018, 0.054), 0.0),
                   (204, tuple(end1), tuple(top - u * 0.004), 0.0),
                   (N, tuple(end2), tuple(top - u * 0.004), 0.0)])
    key(foc, 'location', [(1, (-0.0146, -0.0164, 0.0254)), (95, (-0.0130, -0.0164, 0.0290)),
                          (170, tuple(top - u * 0.004)), (204, tuple(img)), (N, tuple(img))])
    shake(cam, 0.00010, 0.0005, scale=20, seed=3)
    # light: hard cream key raking the face from upper left (numerals, ticks and knurl catch it); a reading light from
    # above the operator's shoulder through the lens; cool fill and a top rim on the hood
    light('AREA', 'Key', (-0.13, -0.075, 0.11), energy=0.55, color=CREAM, size=0.008, target=(0.0, -0.016, 0.028))
    rd = light('SPOT', 'Reading', tuple(top + (u * 0.22) + Vector((-0.07, 0.0, 0.0))), energy=0.35, color=kelvin(4300),
               spot=9.0, blend=0.8, radius=0.004, target=tuple(D['num']))
    # light that leaks into the hood and falls on the number under the lens (invisible to camera and reflections)
    il = light('POINT', 'LensInner', tuple(D['lens_c'] - u * 0.0035 + Vector((0.0, 0.0012, 0.0))), energy=0.0035,
               color=kelvin(4300), radius=0.0012)
    try:
        il.visible_glossy = False
        il.visible_transmission = False
    except Exception:
        pass
    light('AREA', 'Fill', (0.16, -0.10, 0.05), energy=0.015, color=COOL, size=0.10, target=(0.0, -0.01, 0.02))
    light('AREA', 'Rim', (0.07, -0.012, 0.14), energy=0.16, color=COOL, size=0.03, target=(0.0, -0.012, 0.06))
    macro_motes('Motes', (-0.01, -0.05, 0.045), (0.07, 0.07, 0.06), count=160, seed=11, start=1, end=N,
                drift=(0.0012, 0.0004, 0.0018))
    debug_light(cam)
    return cam


# ============================================================================= S17
def s17():
    door = door_plate(M, x0=-0.25, x1=0.25, z0=-0.2, z1=0.25, depth=0.08)
    lock_boss(M, door)
    kp = long_key(M)
    key(kp, 'rotation_euler', [(1, 0.0), (28, 0.0), (92, -pi / 2), (112, -pi / 2), (156, -pi - 0.035), (162, -pi + 0.01),
                               (168, -pi), (N, -pi)], index=1)
    motion_steps(kp, 3)
    cam = camera('CamS17', lens=50, fstop=3.2, ratio=1.6)
    foc = empty('FocusS17', (0.0, -0.212, 0.0))
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, (0.052, -0.330, 0.034), (0.0, -0.205, 0.002), 0.03),
                   (100, (0.050, -0.215, 0.032), (0.0, -0.10, 0.002), 0.02),
                   (N, (0.046, -0.105, 0.028), (0.0, -0.016, 0.0), 0.0)])
    key(foc, 'location', [(1, (0.0, -0.214, 0.0)), (40, (0.0, -0.212, 0.0)), (150, (0.0, -0.06, 0.0)),
                          (N, (0.0, -0.024, 0.0))])
    shake(cam, 0.0002, 0.0006, scale=18, seed=9)
    light('AREA', 'Key', (-0.13, -0.11, 0.17), energy=1.6, color=CREAM, size=0.012, target=(0.0, -0.06, 0.0))
    light('AREA', 'Graze', (0.17, -0.02, 0.09), energy=0.6, color=kelvin(4600), size=0.01, target=(0.0, 0.0, 0.0))
    light('AREA', 'Fill', (0.12, -0.30, -0.08), energy=0.10, color=COOL, size=0.15, target=(0.0, -0.15, 0.0))
    light('AREA', 'Rim', (-0.05, -0.20, 0.16), energy=0.25, color=COOL, size=0.04, target=(0.0, -0.22, 0.0))
    macro_motes('Motes', (0.01, -0.17, 0.02), (0.10, 0.28, 0.08), count=240, seed=13, start=1, end=N,
                drift=(0.002, 0.001, 0.003), r=(0.00003, 0.00008))
    debug_light(cam)
    return cam


# ============================================================================= S18 / S22 / S24: magnetic plates
def plates(loosen_door=(0.0, 0.0), loosen_frame=(0.0, 0.0), hinge=False):
    S = seam_set(M, hinge=hinge)
    proto = screw_proto(M)
    proto.location = (0, 0, -5)
    proto.hide_render = True
    D = mag_plate(M, -1, proto, 'MagDoor', loosen=loosen_door)
    Fm = mag_plate(M, 1, proto, 'MagFrame', loosen=loosen_frame)
    return S, D, Fm


ANCH = {'door_contact': (-0.0025, -0.013, 0.0), 'frame_contact': (0.0025, -0.013, 0.0),
        'door_front': (-0.0145, -0.022, 0.0), 'frame_front': (0.0145, -0.022, 0.0),
        'door_top': (-0.0145, -0.013, 0.0225), 'frame_top': (0.0145, -0.013, 0.0225)}


def s18():
    plates()
    tgt = Vector((0.0, -0.016, 0.010))
    cam = camera('CamS18', lens=60, fstop=8.0, ratio=1.6)
    foc = empty('FocusS18', (0.0, -0.021, 0.012))
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, from_dir(tgt, (-0.30, -0.88, 0.40), 0.235), tuple(tgt), 0.0),
                   (N, from_dir(tgt, (-0.25, -0.89, 0.40), 0.185), tuple(tgt), 0.0)])
    shake(cam, 0.00015, 0.0004, scale=20, seed=4)
    night_plate_lights()
    macro_motes('Motes', (0.0, -0.05, 0.01), (0.09, 0.09, 0.07), count=170, seed=5, start=1, end=N)
    debug_light(cam)
    return cam


def night_plate_lights():
    # hard cream key grazing from upper left (screw heads, block chamfers); cool top rim; very low cool fill.
    light('AREA', 'Key', (-0.12, -0.05, 0.20), energy=0.9, color=CREAM, size=0.008, target=(0.0, -0.014, 0.012))
    light('AREA', 'Rim', (0.05, -0.02, 0.17), energy=0.22, color=COOL, size=0.03, target=(0.0, -0.014, 0.02))
    light('AREA', 'Fill', (0.12, -0.22, -0.09), energy=0.09, color=(0.75, 0.83, 1.0), size=0.16, target=(0.0, -0.01, 0.0))
    light('AREA', 'Kick', (0.16, -0.06, 0.02), energy=0.12, color=CREAM, size=0.006, target=(0.0145, -0.02, 0.0))


def s22():
    S, D, Fm = plates(loosen_door=(0.0034, 0.0029), loosen_frame=(0.0022, 0.0026))
    g, ft, bw, bt = PL['gap'], PL['fl_t'], PL['b_w'], PL['b_t']
    fx0 = -(g + PL['fl_w'])                        # flange outer edge
    bx0 = -(g + bw)                                # block outer face
    yb = -ft - bt                                  # block front
    pts = [(-0.072, 0.0), (fx0 - 0.0026, 0.0), (fx0, -0.0027), (fx0, -ft), (bx0 - 0.0021, -ft), (bx0, -ft - 0.0022),
           (bx0, yb + 0.0011), (bx0 + 0.0011, yb), (-0.0068, yb)]
    tape_strip(M, pts, -0.0095, 0.0095, name='TapeStrip', seed=5)
    scr = Vector((-0.0175, -0.0094, 0.031))        # raised top screw head
    tp = Vector((-0.016, -0.0222, 0.0))            # tape across the block front
    cam = camera('CamS22', lens=70, fstop=7.0, ratio=1.6)
    foc = empty('FocusS22', tuple(scr))
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, from_dir(scr, (-0.70, -0.55, 0.46), 0.085), tuple(scr + Vector((0.0, 0.0, -0.002))), 0.0),
                   (110, from_dir(scr + Vector((0.0, -0.004, -0.012)), (-0.62, -0.66, 0.42), 0.095),
                    tuple(scr + Vector((0.0, -0.004, -0.012))), 0.0),
                   (N, from_dir(tp, (-0.50, -0.78, 0.38), 0.105), tuple(tp + Vector((-0.004, 0.0, 0.004))), 0.0)])
    key(foc, 'location', [(1, tuple(scr)), (75, tuple(scr)), (175, tuple(tp + Vector((-0.004, 0.0, 0.002)))),
                          (N, tuple(tp + Vector((-0.004, 0.0, 0.002))))])
    shake(cam, 0.00015, 0.0004, scale=20, seed=8)
    # daylight-ish: the room's neutral overhead fluorescents (broad, soft, from above) + a soft neutral side; no hard key
    light('AREA', 'Overhead', (-0.04, -0.22, 0.40), energy=2.2, color=kelvin(5200), size=0.25, size_y=0.06,
          shape='RECTANGLE', target=(-0.015, -0.01, 0.01))
    light('AREA', 'Side', (-0.30, -0.10, 0.12), energy=0.5, color=kelvin(5000), size=0.12, target=(-0.015, -0.01, 0.0))
    light('AREA', 'Fill', (0.25, -0.30, -0.05), energy=0.18, color=kelvin(6000), size=0.3, target=(0.0, -0.01, 0.0))
    bpy.context.scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.004, 0.0042, 0.0045, 1)
    macro_motes('Motes', (-0.02, -0.05, 0.02), (0.08, 0.08, 0.07), count=110, seed=9, start=1, end=N)
    debug_light(cam)
    return cam


def s24():
    S, D, Fm = plates(loosen_door=(0.0016, 0.0013), hinge=True)
    sl = alu_sleeve(M)
    key(sl, 'location', [(1, (0.095, 0, 0)), (16, (0.095, 0, 0)), (66, (0.0012, 0, 0)), (74, (0.0, 0, 0)), (N, (0, 0, 0))])
    motion_steps(sl, 2)
    hv = S['hinge']
    key(hv, 'rotation_euler', [(1, 0.0), (122, 0.0), (228, 0.165), (N, 0.168)], index=2)
    tgt = Vector((-0.003, -0.015, 0.0))
    cam = camera('CamS24', lens=60, fstop=5.0, ratio=1.6)
    foc = empty('FocusS24', (0.0, -0.0235, 0.0))
    cam.data.dof.focus_object = foc
    cam_path(cam, [(1, from_dir(tgt, (-0.40, -0.85, 0.33), 0.165), tuple(tgt), 0.0),
                   (115, from_dir(tgt, (-0.40, -0.85, 0.33), 0.145), tuple(tgt), 0.0),
                   (N, from_dir(tgt + Vector((-0.004, 0.0, 0.0)), (-0.52, -0.78, 0.34), 0.175),
                    tuple(tgt + Vector((-0.004, 0.0, 0.0))), 0.0)])
    shake(cam, 0.00015, 0.0004, scale=20, seed=6)
    night_plate_lights()
    macro_motes('Motes', (0.0, -0.05, 0.01), (0.10, 0.09, 0.07), count=170, seed=15, start=1, end=N)
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
