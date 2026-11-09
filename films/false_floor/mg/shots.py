"""FALSE FLOOR · Case No. 02 — motion-graphic shots (owner D_mg). Each class renders exactly render_frames frames.
Cue frames come from the temp VO (kit.cue: character position inside the beat); type lands just before the word."""
import math

import numpy as np

from kit import (W, H, M, S, C, Layer, Text, Para, Shot, Cam, ramp, ease_out, ease_out4, ease_in_out, ease_sine,
                 lerp, clamp01, cue, shot_info, charcoal_bg, colf, rect_cover, resample, concrete_tex, light_field,
                 text_width, CASE)

# ----------------------------------------------------------------------------- type styles (match SF1 / SF3)


def kicker(s, x, y, start, color='concrete', anchor='l', px=30, track=4):
    return Text(s, 'SemiBold', px, x, y, color, track, anchor, 'letter', start, dur=12, stagger=1)


def title(s, x, y, start, px=150, color='cream', anchor='l', track=2, stagger=2):
    return Text(s, 'Bold', px, x, y, color, track, anchor, 'letter', start, dur=14, stagger=stagger)


def sub(s, x, y, start, color='concrete', anchor='l', px=34, track=5):
    return Text(s, 'Medium', px, x, y, color, track, anchor, 'word', start, dur=12, stagger=4)


def tag(s, x, y, start, color='cream', anchor='l', px=26, track=3):
    return Text(s, 'SemiBold', px, x, y, color, track, anchor, 'letter', start, dur=10, stagger=1)


def rule(L, f, x, y, w, start, color='orange', dur=16, h=6, a=1.0):
    p = ease_in_out(ramp(f, start, dur))
    if p > 0:
        L.rect(x, y, x + w * p, y + h, color, a)


def leader(L, p0, p1, start, f, color='concrete', a=0.85, dur=12, w=1.3, marker=True, mcolor=None):
    """Label leader: marker square at the anchor, hairline drawn out to the label."""
    p = ramp(f, start, dur)
    if p <= 0:
        return
    if marker:
        L.square(p0[0], p0[1], 4, mcolor or color, a * ease_out(ramp(f, start, 6)))
    L.line(p0, p1, w, color, a, ease_in_out(p))


# ============================================================================= S06 · the vertical stack

class S06(Shot):
    """Street -> ground floor (guards) -> offices -> Level -2 (vault): an architectural line drawing in the brand's
    offset-plane language. The one rule lands as the orange link from the tenant's office down to the vault."""
    sid = 'S06'
    seed = 6
    label_left = 'EDITORIAL SECTION · NOT A FLOOR PLAN'

    X0, X1, DX, DY = 780, 1250, 170, 78
    LEVELS = [('off3', 232), ('off2', 330), ('off1', 428), ('ground', 540), ('m1', 690), ('m2', 830)]

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=10: cue(self.sid, p, l)
        self.t_street = 8
        self.t_ground = c('the Antwerp Diamond Centre', 14)
        self.t_offices = c('Offices above', 16)
        self.t_below = c('Two floors below', 10)
        self.t_vault = c('the vault where', 10)
        self.t_rule = c('one rule', 16)
        self.t_tenant = c('unless you', 10)
        y = dict(self.LEVELS)
        self.y = y
        st = {'ground': self.t_ground, 'off1': self.t_ground + 12, 'off2': self.t_ground + 22,
              'off3': self.t_ground + 32, 'm1': self.t_below, 'm2': self.t_below + 14}
        self.plate_start = st
        self.k = kicker('ANTWERP DIAMOND CENTRE · SCHUPSTRAAT', M, 170, 6)
        lx = 1490
        mid = lambda yy: yy - self.DY / 2
        self.labels = [
            ('off2', tag('OFFICES · TENANTS', lx, mid(y['off3']) + 9, self.t_offices + 8), self.t_offices),
            ('ground', tag('GROUND FLOOR · GUARDS', lx, mid(y['ground']) + 9, self.t_ground + 20), self.t_ground + 12),
            ('m2', tag('LEVEL −2 · THE VAULT', lx, mid(y['m2']) + 9, self.t_vault + 14), self.t_vault + 6),
        ]
        self.street_lbl = tag('STREET LEVEL', 400, 578, self.t_street + 30, 'concrete', px=22)
        self.office_lbl = tag("A TENANT'S OFFICE", lx, mid(y['off2']) + 9, self.t_tenant + 8, 'cream')
        ty = H - 190
        self.title = title('ONE RULE', M, ty, self.t_rule, px=150)
        self.sub = sub('NO OFFICE UPSTAIRS · NO BOX DOWNSTAIRS', M, ty + 72, self.t_rule + 24)

    def plate(self, L, f, yf, start, a=1.0):
        p = ramp(f, start, 18)
        if p <= 0:
            return
        x0, x1, dx, dy = self.X0, self.X1, self.DX, self.DY
        FL, FR, BR, BL = (x0, yf), (x1, yf), (x1 + dx, yf - dy), (x0 + dx, yf - dy)
        fa = ease_out(ramp(f, start + 6, 16))
        L.poly([FL, FR, BR, BL], 'cream', 0.045 * fa * a)
        L.rect(x0, yf, x1, yf + 8, 'concrete', 0.22 * fa * a)
        L.poly([FR, BR, (BR[0], BR[1] + 8), (FR[0], FR[1] + 8)], 'concrete', 0.12 * fa * a)
        L.polyline([FL, FR, BR, BL, FL], 1.4, 'concrete', 0.85 * a, ease_in_out(p))

    def posts(self, L, f, ya, yb, start, a=0.55):
        p = ease_in_out(ramp(f, start, 14))
        if p <= 0:
            return
        x0, x1, dx, dy = self.X0, self.X1, self.DX, self.DY
        for (px, oy) in ((x0 + 6, 0), (x1 - 6, 0), (x1 + dx - 6, -dy)):
            L.line((px, ya + 8 + oy), (px, yb + oy), 1.2, 'concrete', a, p)

    def layout(self, L, f):
        y = self.y
        self.k.draw(L, f)
        # street: long ground line, bollards, police post
        sp = ease_in_out(ramp(f, self.t_street, 30))
        yg = y['ground']
        L.line((330, yg), (W - M, yg), 1.4, 'concrete', 0.7, sp)
        for i, bx in enumerate(range(470, 740, 34)):
            pb = ease_out(ramp(f, self.t_street + 10 + i * 3, 12))
            if pb > 0:
                L.rect(bx - 2.5, yg - 22 * pb, bx + 2.5, yg, 'concrete', 0.8)
        pp = ease_out(ramp(f, self.t_street + 18, 16))
        if pp > 0:
            L.outline(352, yg - 44, 412, yg, 1.4, 'concrete', 0.8, pp)
            L.line((346, yg - 50), (418, yg - 50), 1.4, 'concrete', 0.8 * pp)
            L.rect(364, yg - 34, 400, yg - 24, 'concrete', 0.25 * pp)
        self.street_lbl.draw(L, f)
        # floor plates, bottom-up above ground, top-down below
        order = ['m2', 'm1', 'ground', 'off1', 'off2', 'off3']
        for k in order:
            self.plate(L, f, y[k], self.plate_start[k])
        self.posts(L, f, y['off3'], y['off2'], self.plate_start['off3'] + 8)
        self.posts(L, f, y['off2'], y['off1'], self.plate_start['off2'] + 8)
        self.posts(L, f, y['off1'], y['ground'], self.plate_start['off1'] + 8)
        self.posts(L, f, y['ground'], y['m1'], self.plate_start['m1'] + 6, 0.4)
        self.posts(L, f, y['m1'], y['m2'], self.plate_start['m2'] + 6, 0.4)
        # the vault on Level -2: a box room with the deposit wall as fine lines
        vp = ramp(f, self.t_vault, 22)
        if vp > 0:
            vx0, vx1, vy1, vh, vdx, vdy = 930, 1110, y['m2'] - 22, 92, 60, 28
            vy0 = vy1 - vh
            e = ease_in_out(vp)
            L.rect(vx0, vy0, vx1, vy1, 'charcoal', 0.9 * e)
            L.poly([(vx0, vy0), (vx1, vy0), (vx1 + vdx, vy0 - vdy), (vx0 + vdx, vy0 - vdy)], 'cream', 0.06 * e)
            L.polyline([(vx0, vy1), (vx0, vy0), (vx0 + vdx, vy0 - vdy), (vx1 + vdx, vy0 - vdy), (vx1 + vdx, vy1 - vdy),
                        (vx1, vy1), (vx0, vy1)], 1.4, 'cream', 0.9, e)
            L.line((vx1, vy0), (vx1, vy1), 1.4, 'cream', 0.9, e)
            L.line((vx1, vy0), (vx1 + vdx, vy0 - vdy), 1.4, 'cream', 0.9, e)
            gp = ramp(f, self.t_vault + 14, 20)
            if gp > 0:
                for i in range(1, 9):
                    xx = vx0 + (vx1 - vx0) * i / 9
                    L.line((xx, vy0 + 6), (xx, vy1 - 6), 1.0, 'cream', 0.38, ease_out(ramp(f, self.t_vault + 14 + i, 10)))
                for j in range(1, 4):
                    yy = vy0 + vh * j / 4
                    L.line((vx0 + 6, yy), (vx1 - 6, yy), 1.0, 'cream', 0.38, ease_out(ramp(f, self.t_vault + 20 + j * 2, 12)))
        # the tenant's office (one cell on an office floor)
        op = ramp(f, self.t_tenant, 16)
        ox0, ox1, oy1 = 1000, 1080, y['off2'] - 20
        if op > 0:
            e = ease_out(op)
            L.rect(ox0, oy1 - 46, ox1, oy1, 'cream', 0.20 * e)
            L.outline(ox0, oy1 - 46, ox1, oy1, 1.4, 'cream', 0.95, e)
        # the newly exposed connection: office upstairs -> box in the vault
        lp = ramp(f, self.t_tenant + 12, 40)
        if lp > 0:
            p0, p1 = (1040, oy1), (1020, y['m2'] - 22 - 92)
            L.square(p0[0], p0[1], 4.5, 'orange', ease_out(ramp(f, self.t_tenant + 12, 6)))
            L.line(p0, p1, 2.2, 'orange', 1.0, ease_in_out(lp))
            if lp >= 1:
                L.square(p1[0], p1[1], 4.5, 'orange', ease_out(ramp(f, self.t_tenant + 52, 6)))
        # labels with leaders
        for k, t, st in self.labels:
            yy = y[k if k != 'off2' else 'off3'] - self.DY / 2
            leader(L, (self.X1 + self.DX / 2 + 4, yy), (1474, yy), st, f)
            t.draw(L, f)
        yy = y['off2'] - self.DY / 2
        leader(L, (1084, yy), (1474, yy), self.t_tenant + 4, f, 'cream', 0.9)
        self.office_lbl.draw(L, f)
        # title block
        self.title.draw(L, f)
        rule(L, f, M, H - 190 + 22, 220, self.t_rule + 10)
        self.sub.draw(L, f)


REG = {'S06': S06}
