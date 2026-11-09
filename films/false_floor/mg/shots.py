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


    _under = None

    def soft(self, f):
        """The ground below street level reads a shade deeper once the street line is drawn."""
        if S06._under is None:
            yy = np.arange(H, dtype=np.float32)[:, None]
            a = np.clip((yy - self.y['ground']) / 40.0, 0, 1) * np.ones((1, W), np.float32)
            S06._under = a.astype(np.float32)
        k = 0.30 * ease_in_out(ramp(f, self.t_street + 6, 40))
        if k <= 0:
            return None
        return ((6, 9, 10), S06._under * k)


# ============================================================================= S09 · two years of days

def _days():
    import datetime as dt
    d0, d1 = dt.date(2001, 1, 1), dt.date(2003, 2, 15)
    out = []
    d = d0
    while d <= d1:
        out.append(d)
        d += dt.timedelta(days=1)
    return out


class S09(Shot):
    """A calendar, one fine mark per day from 1 January 2001, one row per year, ticking past to a single orange mark:
    Saturday 15 February 2003. (Rows, not one long strip: a 2 px day pitch would moire under the push.)"""
    sid = 'S09'
    seed = 9
    label_left = 'ONE MARK PER DAY · JANUARY 2001 TO FEBRUARY 2003'
    X0, X1 = 232, 1820
    ROWS = {2001: 470, 2002: 590, 2003: 710}
    MONTHS = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split()

    def __init__(self):
        import datetime as dt
        super().__init__(shot_info(self.sid)['render_frames'])
        self.days = _days()
        self.nd = len(self.days)
        pitch = (self.X1 - self.X0) / 364.6
        self.pos = []
        for d in self.days:
            doy = (d - dt.date(d.year, 1, 1)).days
            self.pos.append((self.X0 + doy * pitch, self.ROWS[d.year]))
        self.t0, self.t1 = 14, cue(self.sid, 'And the lease', 26)
        self.k = kicker('THE TENANT · MORE THAN TWO YEARS', M, 170, 6)
        # first frame the leading edge reaches each day (labels build from there)
        self.reach = [self.n] * self.nd
        j = 0
        for ff in range(self.n):
            e = self.edge(ff)
            while j < self.nd and e >= j:
                self.reach[j] = ff
                j += 1
        self.labels = []
        for i, d in enumerate(self.days):
            if d.day == 1 and d.month == 1:
                self.labels.append(Text(str(d.year), 'Bold', 50, M, self.ROWS[d.year] + 1, 'cream', 1, 'l', 'letter',
                                        self.reach[i], 12, 2))
            if d.day == 1 and d.year == 2001:
                self.labels.append(Text(self.MONTHS[d.month - 1], 'SemiBold', 18, self.pos[i][0] + 3, 384, 'concrete',
                                        2, 'l', 'letter', 8 + d.month * 3, 10, 1))
        self.t_hit = self.t1 + 4
        xe, ye = self.pos[-1]
        self.hit_sub = tag('SATURDAY', xe + 24, ye - 52, self.t_hit + 14, 'concrete', px=20)
        self.hit_lbl = tag('15 FEBRUARY 2003', xe + 24, ye - 10, self.t_hit + 20, 'cream', px=32)
        ty = H - 190
        self.title = title('AN ORDINARY TENANT', M, ty, self.t_hit + 30, px=130)
        self.sub = sub('HIS LEASE CAME WITH HIS OWN BOX IN THE VAULT', M, ty + 72,
                       max(cue(self.sid, 'the only thing', 30), self.title.start + 26))

    def edge(self, f):
        p = ramp(f, self.t0, self.t1 - self.t0)
        return (self.nd - 1) * (0.25 * p + 0.75 * ease_in_out(p)) if p < 1 else self.nd - 1 + 1e-3

    def layout(self, L, f):
        self.k.draw(L, f)
        d = self.edge(f)
        for yr, y in self.ROWS.items():
            x1 = self.X1 if yr < 2003 else self.pos[-1][0]
            L.line((self.X0, y), (x1, y), 1.2, 'concrete', 0.5, ease_in_out(ramp(f, 4 + (yr - 2001) * 8, 30)))
        n_on = int(min(self.nd - 2, math.floor(d)))     # the last mark is the orange one, drawn on its own
        if f >= self.t0:
            bins = [(0, 4, 'cream', 1.0), (4, 12, 'cream', 0.72), (12, 30, 'cream', 0.48), (30, 1e9, 'concrete', 0.55)]
            for lo, hi, c, a in bins:
                idx = [i for i in range(0, n_on + 1) if lo <= d - i < hi]
                if not idx:
                    continue

                def fn(dr, P, idx=idx):
                    for i in idx:
                        dd = self.days[i]
                        h = 42 if dd.day == 1 else 22
                        x, y = self.pos[i]
                        dr.rectangle([P(x - 0.5, y - h), P(x + 0.5, y)], fill=255)
                L.group(fn, c, a, (self.X0 - 2, 400, self.X1 + 2, 720))
        for t in self.labels:
            t.draw(L, f)
        hp = ramp(f, self.t_hit, 22)
        if hp > 0:
            xe, ye = self.pos[-1]
            L.rect(xe - 1.5, ye - 92 * ease_out4(hp), xe + 1.5, ye, 'orange', 1.0)
            L.square(xe, ye, 4, 'orange', ease_out(hp))
        self.hit_sub.draw(L, f)
        self.hit_lbl.draw(L, f)
        self.title.draw(L, f)
        self.sub.draw(L, f)


# ============================================================================= S12 · four alias cards

class S12(Shot):
    """Typographic alias cards, one at a time; Speedy's card comes last and is held while the others recede."""
    sid = 'S12'
    seed = 12
    label_left = 'NICKNAMES AS REPORTED · SCHOOL OF TURIN'
    CARDS = [('01', ['THE', 'GENIUS'], ['ALARMS'], 'The Genius'),
             ('02', ['THE', 'MONSTER'], ['LOCKS · WIRING · DRIVING'], 'The Monster'),
             ('03', ['THE KING', 'OF KEYS'], ['AN OLD FORGER', 'REAL NAME NEVER KNOWN'], 'The King of Keys'),
             ('04', ['SPEEDY'], ['A LONG-TIME FRIEND', 'ANXIOUS · PARANOID'], 'And Speedy')]
    CW, CH, GAP, CY = 400, 470, 40, 360

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=12: cue(self.sid, p, l)
        self.k = kicker('POLICE LINK HIM TO A LOOSE NETWORK OF ITALIAN THIEVES', M, 160, 6)
        self.t = title('THE SCHOOL OF TURIN', M, 268, c('School of Turin', 60), px=96, stagger=2)
        self.cards = []
        for i, (num, name, role, ph) in enumerate(self.CARDS):
            st = c(ph, 22)
            x = M + i * (self.CW + self.GAP)
            y = self.CY
            o = {'st': st, 'x': x}
            o['num'] = Text('ALIAS ' + num, 'SemiBold', 22, x + 32, y + 58, 'concrete', 4, 'l', 'letter', st + 10, 10, 1)
            nb = y + 318
            o['name'] = [Text(ln, 'Bold', 74, x + 30, nb - (len(name) - 1 - j) * 74, 'cream', 1, 'l', 'letter',
                              st + 16 + j * 8, 14, 2) for j, ln in enumerate(name)]
            o['role'] = [Text(ln, 'Medium', 24, x + 32, y + 398 + j * 34, 'concrete', 3, 'l', 'word',
                              st + 34 + j * 8, 12, 4) for j, ln in enumerate(role)]
            self.cards.append(o)
        self.t_keep = c('Keep him', 24)

    def layout(self, L, f):
        self.k.draw(L, f)
        self.t.draw(L, f)
        dim = ease_in_out(ramp(f, self.t_keep, 36))
        for i, o in enumerate(self.cards):
            p = ramp(f, o['st'], 18)
            if p <= 0:
                continue
            a = 1 - 0.62 * dim if i < 3 else 1.0
            e = ease_out(p)
            dy = 22 * (1 - ease_out4(p))
            x, y, cw, ch = o['x'], self.CY + dy, self.CW, self.CH
            L.rect(x, y, x + cw, y + ch, 'cream', 0.045 * e * a)
            L.outline(x, y, x + cw, y + ch, 1.2, 'concrete', 0.42 * a, ease_in_out(ramp(f, o['st'], 26)))
            hot = i == 3
            L.rect(x, y, x + cw * ease_in_out(ramp(f, o['st'] + 8, 22)), y + 3, 'cream', (0.95 if hot else 0.6) * a)
            o['num'].draw(L, f, a=a, dy=dy)
            for t in o['name']:
                t.draw(L, f, a=a, dy=dy)
            rp = ease_in_out(ramp(f, o['st'] + 28, 18))
            L.line((x + 32, y + 352), (x + 32 + (cw - 64), y + 352), 1.2, 'concrete', 0.6 * a, rp)
            for t in o['role']:
                t.draw(L, f, a=a, dy=dy)


# ============================================================================= S19 · the vault room in plan

class S19(Shot):
    """Orthographic plan of the vault room: 189 boxes as fine cells around three walls, soft cream sensor fields."""
    sid = 'S19'
    seed = 19
    label_left = 'ILLUSTRATIVE RECONSTRUCTION · SCHEMATIC PLAN, NOT TO SCALE'
    RX0, RY0, RX1, RY1, WT, BD = 700, 196, 1424, 760, 12, 34

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=10: cue(self.sid, p, l)
        self.k = kicker('LEVEL −2 · THE VAULT ROOM', M, 170, 6)
        self.t = title('INSIDE THE ROOM', M, 262, 14, px=88)
        ix0, iy0, ix1, iy1 = self.RX0 + self.WT, self.RY0 + self.WT, self.RX1 - self.WT, self.RY1 - self.WT
        self.inner = (ix0, iy0, ix1, iy1)
        bd = self.BD
        # sensors: (key, pos, direction deg, spread deg, radius, label, label pos, anchor, start)
        self.sensors = [
            ('heat', (ix0 + bd + 10, iy0 + bd + 10), 42, 86, 470, 'HEAT · INFRARED', (ix0 + bd + 26, iy0 + bd + 52), 'l',
             c('heat and motion', 14)),
            ('motion', (ix1 - bd - 10, iy0 + bd + 10), 138, 80, 450, 'MOTION', (ix1 - bd - 26, iy0 + bd + 52), 'r',
             c('heat and motion', 2)),
            ('light', ((ix0 + ix1) / 2, (iy0 + iy1) / 2 + 20), None, None, 175, 'LIGHT · CEILING',
             ((ix0 + ix1) / 2, (iy0 + iy1) / 2 + 66), 'c', c('a light sensor', 8)),
            ('radar', (ix1 - bd - 8, iy1 - 150), 200, 64, 330, 'RADAR', (ix1 - bd - 26, iy1 - 112), 'r', c('radar', 8)),
            ('camera', (ix0 + 170, iy1 - 8), -62, 46, 500, 'CAMERA · FEED TO THE GUARD STATION', (ix0 + 188, iy1 - 28),
             'l', c('a camera', 8)),
        ]
        self.slabels = {k: tag(lbl, lp[0], lp[1], st + 10, 'cream', anc, px=22) for k, _, _, _, _, lbl, lp, anc, st in
                        self.sensors}
        self.t_boxes = c('189 boxes', 16)
        self.t_combo = c('three-letter', 16)
        self.t_num = c('Seventeen', 14)
        # 189 cells: 81 on the far wall, 54 down each side
        cells = []
        n_top, n_side = 81, 54
        for i in range(n_top):
            x0 = ix0 + (ix1 - ix0) * i / n_top
            cells.append(('top', x0, iy0, ix0 + (ix1 - ix0) * (i + 1) / n_top, iy0 + bd))
        for i in range(n_side):
            y0 = iy0 + bd + (iy1 - iy0 - bd) * i / n_side
            y1 = iy0 + bd + (iy1 - iy0 - bd) * (i + 1) / n_side
            cells.append(('left', ix0, y0, ix0 + bd, y1))
            cells.append(('right', ix1 - bd, y0, ix1, y1))
        # order the build as a sweep around the room: left wall up, far wall across, right wall down
        lefts = sorted([c_ for c_ in cells if c_[0] == 'left'], key=lambda c_: -c_[2])
        tops = sorted([c_ for c_ in cells if c_[0] == 'top'], key=lambda c_: c_[1])
        rights = sorted([c_ for c_ in cells if c_[0] == 'right'], key=lambda c_: c_[2])
        self.cells = lefts + tops + rights
        rx = 1478
        self.n189 = Text('189', 'Bold', 120, rx, 470, 'cream', 2, 'l', 'letter', self.t_boxes + 40, 14, 3)
        self.n189k = kicker('ON THE WALLS', rx, 330, self.t_boxes + 30, px=24, track=4)
        self.n189s = Text('BOXES', 'SemiBold', 30, rx, 520, 'concrete', 5, 'l', 'letter', self.t_boxes + 52, 12, 2)
        self.combo = Para('EACH WITH ITS OWN KEY AND THREE LETTER WHEELS', 'Medium', 24, rx, 590, 330, 1.35, 'concrete',
                          2, self.t_combo, 12, 3)
        ty = H - 190
        self.big = title('17,576', M, ty, self.t_num, px=150)
        self.bigs = sub('POSSIBLE COMBINATIONS · PER BOX', M, ty + 72, self.t_num + 26)
        self.bigk = kicker('26 × 26 × 26', M, ty - 168, self.t_num + 14, px=30)
        # soft sensor fields (layout space), precomputed once
        self._fields = None

    def _build_fields(self):
        ix0, iy0, ix1, iy1 = self.inner
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        inside = ((xx > ix0) & (xx < ix1) & (yy > iy0) & (yy < iy1)).astype(np.float32)
        fields = {}
        for k, pos, ang, spread, R, *_ in self.sensors:
            dx, dy = xx - pos[0], yy - pos[1]
            dist = np.sqrt(dx * dx + dy * dy)
            if ang is None:
                shape = np.exp(-(dist / (R * 0.62)) ** 2)
                peak = 0.20
            else:
                th = np.degrees(np.arctan2(dy, dx))
                dth = (th - ang + 180) % 360 - 180
                angf = np.clip(1 - (np.abs(dth) / (spread / 2)), 0, 1) ** 0.8
                radf = np.clip(1 - dist / R, 0, 1) ** 1.3
                shape = angf * radf
                if k == 'radar':
                    shape = shape * (0.72 + 0.28 * np.cos(dist / 14.0) ** 2)
                peak = 0.17 if k != 'camera' else 0.14
            fields[k] = (shape * peak * inside).astype(np.float32), dist.astype(np.float32), R
        self._fields = fields

    def soft(self, f):
        if self._fields is None:
            self._build_fields()
        acc = None
        for k, pos, ang, spread, R, lbl, lp, anc, st in self.sensors:
            p = ramp(f, st, 30)
            if p <= 0:
                continue
            shape, dist, R = self._fields[k]
            g = ease_out(p)
            if g < 1:
                edge = np.clip((R * 1.05 * g - dist) / 60.0, 0, 1)
                a = shape * edge * g
            else:
                a = shape
            acc = a if acc is None else acc + a
        if acc is None:
            return None
        return ('cream', np.minimum(acc, 0.32))

    def layout(self, L, f):
        self.k.draw(L, f)
        self.t.draw(L, f)
        X0, Y0, X1, Y1, wt = self.RX0, self.RY0, self.RX1, self.RY1, self.WT
        ix0, iy0, ix1, iy1 = self.inner
        dp = ease_in_out(ramp(f, 10, 40))
        # walls: poché between two hairlines, door opening on the near wall
        door0, door1 = 1040, 1150
        wa = ease_out(ramp(f, 18, 30))
        if wa > 0:
            for (a0, b0, a1, b1) in [(X0, Y0, X1, iy0), (X0, iy0, ix0, Y1), (ix1, iy0, X1, Y1), (X0, iy1, door0, Y1),
                                     (door1, iy1, X1, Y1)]:
                L.rect(a0, b0, a1, b1, 'concrete', 0.22 * wa)
        L.polyline([(door0, Y1), (X0, Y1), (X0, Y0), (X1, Y0), (X1, Y1), (door1, Y1)], 1.4, 'concrete', 0.9, dp)
        L.polyline([(door0, iy1), (ix0, iy1), (ix0, iy0), (ix1, iy0), (ix1, iy1), (door1, iy1)], 1.2, 'concrete', 0.75, dp)
        # the door, standing open, with its swing
        sp = ease_in_out(ramp(f, 34, 26))
        if sp > 0:
            L.rect(door0 - 1, Y1, door0 + 13, Y1 + (door1 - door0) * sp, 'cream', 0.85)
            pts = [(door0 + (door1 - door0) * math.cos(t), Y1 + (door1 - door0) * math.sin(t))
                   for t in np.linspace(0, math.pi / 2, 24)]
            L.dashed(pts, 1.0, 'concrete', 0.6, 5, 5, sp)
        Text('DOOR', 'SemiBold', 18, door0 + 24, Y1 + 76, 'concrete', 3, 'l', 'letter', 50, 10, 1).draw(L, f)
        # the boxes: 189 fine cells sweeping round the walls
        bp = ramp(f, self.t_boxes, 70)
        if bp > 0:
            nc = int(round(len(self.cells) * ease_in_out(bp)))
            cells = self.cells[:nc]

            def fn(d, P, cells=cells):
                for _, a0, b0, a1, b1 in cells:
                    d.rectangle([P(a0, b0), P(a1, b1)], outline=255, width=2)
            L.group(fn, 'cream', 0.42, (ix0 - 2, iy0 - 2, ix1 + 2, iy1 + 2))
            hot = self.cells[max(0, nc - 6):nc] if bp < 1 else []
            if hot:
                def fn2(d, P, cells=hot):
                    for _, a0, b0, a1, b1 in cells:
                        d.rectangle([P(a0, b0), P(a1, b1)], fill=255)
                L.group(fn2, 'cream', 0.35, (ix0 - 2, iy0 - 2, ix1 + 2, iy1 + 2))
        # sensors: marker + label
        for k, pos, ang, spread, R, lbl, lp, anc, st in self.sensors:
            p = ramp(f, st, 10)
            if p > 0:
                L.square(pos[0], pos[1], 5, 'cream', ease_out(p))
            self.slabels[k].draw(L, f)
        # camera feed leaves the room toward the guard station
        cam = self.sensors[4]
        fp = ramp(f, cam[8] + 20, 30)
        if fp > 0:
            x = cam[1][0]
            L.dashed([(x, iy1 + 4), (x, Y1 + 90)], 1.4, 'cream', 0.7, 6, 6, ease_in_out(fp))
        # right column: the count
        self.n189k.draw(L, f)
        if f >= self.n189.start:
            v = int(round(189 * ease_in_out(ramp(f, self.t_boxes, 70))))
            if v < 189:
                Text(f'{v:03d}', 'Bold', 120, self.n189.x, 470, 'cream', 2, 'l', 'line').draw(L, f, a=ease_out(
                    ramp(f, self.n189.start, 12)))
            else:
                self.n189.start = min(self.n189.start, f)
                Text('189', 'Bold', 120, self.n189.x, 470, 'cream', 2, 'l', 'line').draw(L, f)
        self.n189s.draw(L, f)
        self.combo.draw(L, f)
        self.bigk.draw(L, f)
        self.big.draw(L, f)
        self.bigs.draw(L, f)


# ============================================================================= S30 · Antwerp -> E19 -> Brussels

class S30(Shot):
    """Abstract schematic: two cities, one road, the orange line of where the rubbish went. No tiles."""
    sid = 'S30'
    seed = 30
    label_left = 'SCHEMATIC · NOT A RECONSTRUCTED ESCAPE ROUTE'
    ANT, BRU = (1250, 236), (1372, 836)

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=8: cue(self.sid, p, l)
        self.k = kicker('ACCORDING TO NOTARBARTOLO', M, 170, 6)
        self.t = title('BURN EVERYTHING', M, 300, c('burn everything', 40), px=110)
        self.ts = sub('FROM THE JOB AND THE SAFE HOUSE', M, 362, c('burn everything', 10), px=30)
        words = [('TAPE', 'Tape'), ('TOOLS', 'Tools'), ('PACKAGING', 'Packaging'), ('FOOD', 'Food')]
        self.items = []
        for i, (w_, ph) in enumerate(words):
            st = min(c(ph, 14), self.n - 60)
            y = 520 + i * 92
            self.items.append((Text(f'0{i + 1}', 'SemiBold', 24, M, y - 4, 'concrete', 3, 'l', 'letter', st, 10, 2),
                               Text(w_, 'Bold', 76, M + 64, y + 16, 'cream', 2, 'l', 'letter', st + 4, 12, 2), st))
        a, b = self.ANT, self.BRU
        self.route = [a, (a[0] + 18, a[1] + 140), (a[0] + 52, a[1] + 300), (b[0] - 30, b[1] - 140), b]
        self.t_line = 26
        self.la = tag('ANTWERP', a[0] + 26, a[1] + 10, 18, 'cream', px=30)
        self.lb = tag('BRUSSELS', b[0] + 26, b[1] + 10, self.t_line + 70, 'cream', px=30)
        mid = self.route[2]
        self.le = tag('E19', mid[0] + 30, mid[1] + 8, self.t_line + 40, 'concrete', px=26)

    def layout(self, L, f):
        self.k.draw(L, f)
        self.t.draw(L, f)
        self.ts.draw(L, f)
        for n_, w_, st in self.items:
            n_.draw(L, f)
            w_.draw(L, f)
        # faint cartographic context: two parallels
        for lat, y in (('51.2° N', self.ANT[1]), ('50.8° N', self.BRU[1])):
            gp = ease_in_out(ramp(f, 8, 40))
            L.line((980, y), (980 + 840 * gp, y), 1.0, 'concrete', 0.18)
            Text(lat, 'Medium', 18, W - M, y - 10, 'concrete', 2, 'r', 'line').draw(L, f, a=0.6 * gp)
        a, b = self.ANT, self.BRU
        L.ring(a[0], a[1], 9, 1.6, 'cream', ease_out(ramp(f, 10, 12)))
        L.dot(a[0], a[1], 3.5, 'cream', ease_out(ramp(f, 10, 12)))
        self.la.draw(L, f)
        lp = ramp(f, self.t_line, 70)
        L.polyline(self.route, 2.6, 'orange', 1.0, ease_in_out(lp))
        if lp >= 1:
            g = ease_out(ramp(f, self.t_line + 70, 12))
            L.ring(b[0], b[1], 9, 1.6, 'cream', g)
            L.dot(b[0], b[1], 3.5, 'cream', g)
        self.lb.draw(L, f)
        self.le.draw(L, f)


# ============================================================================= S37 · DNA -> MATCH

class S37(Shot):
    """DNA builds in cream; an orange hairline reaches across; LINKED builds in orange. Never a percentage, never 'match'."""
    sid = 'S37'
    seed = 37
    label_left = 'FROM THE WOODS OFF THE E19 · c. 17 FEBRUARY 2003'

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=8: cue(self.sid, p, l)
        px, y = 250, 640
        wd = text_width('DNA', 'Bold', px, 4)
        wm = text_width('LINKED', 'Bold', px, 4)
        gap = 230
        x0 = (W - (wd + gap + wm)) / 2
        self.x0, self.y = x0, y
        self.dna = Text('DNA', 'Bold', px, x0, y, 'cream', 4, 'l', 'letter', max(10, c('take DNA', 4)), 14, 4)
        self.t_link = c('goes into the case', 24)
        self.l0, self.l1 = x0 + wd + 40, x0 + wd + gap - 40
        self.match = Text('LINKED', 'Bold', px, x0 + wd + gap, y, 'orange', 4, 'l', 'letter', self.t_link + 22, 14, 3)
        self.k = kicker('HALF A SALAMI SANDWICH', x0, y - 262, 6)
        self.s = sub('TO THE CASE FILE', x0 + wd + gap, y + 86, self.t_link + 46)

    def layout(self, L, f):
        self.k.draw(L, f)
        self.dna.draw(L, f)
        yy = self.y - 92
        lp = ramp(f, self.t_link, 22)
        if lp > 0:
            L.square(self.l0, yy, 4, 'orange', ease_out(ramp(f, self.t_link, 6)))
            L.line((self.l0, yy), (self.l1, yy), 2.2, 'orange', 1.0, ease_in_out(lp))
        if lp >= 1:
            L.square(self.l1, yy, 4, 'orange', ease_out(ramp(f, self.t_link + 22, 6)))
        self.match.draw(L, f)
        self.s.draw(L, f)


# ============================================================================= S39 · Friday 21 February 2003

class S39(Shot):
    sid = 'S39'
    seed = 39

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=8: cue(self.sid, p, l)
        self.k = kicker('FIVE DAYS AFTER THE HEIST', M, 350, 8)
        self.t = title('FRIDAY · 21 FEBRUARY 2003', M, 482, 18, px=124)
        self.s = sub('LEONARDO NOTARBARTOLO WALKS BACK INTO THE DIAMOND CENTRE', M, 554, c('Leonardo', 20), px=30)
        st = c('Detectives', 36)
        self.cards = []
        for i, name in enumerate(['AGIM DE BRUYCKER', 'PATRICK PEYS']):
            x = M + i * 860
            s0 = st + i * 22
            self.cards.append((x, s0,
                               Text('DETECTIVE · DIAMOND SQUAD', 'SemiBold', 24, x, 770, 'concrete', 4, 'l', 'letter', s0 + 8,
                                    10, 1),
                               Text(name, 'Bold', 84, x, 870, 'cream', 1, 'l', 'letter', s0 + 16, 14, 2)))

    def layout(self, L, f):
        self.k.draw(L, f)
        self.t.draw(L, f)
        self.s.draw(L, f)
        for x, s0, k, n in self.cards:
            p = ease_in_out(ramp(f, s0, 24))
            if p > 0:
                L.rect(x, 720, x + 720 * p, 722, 'cream', 0.75)
            k.draw(L, f)
            n.draw(L, f)


# ============================================================================= S40 · the sentences, 2005

class S40(Shot):
    sid = 'S40'
    seed = 40
    label_left = 'ANTWERP COURT OF APPEAL · 2005'
    CW, GAP, CY, CH = 400, 40, 650, 250

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=8: cue(self.sid, p, l)
        self.k = kicker('2005 · ANTWERP COURT OF APPEAL', M, 160, 8)
        self.name = Text('LEONARDO NOTARBARTOLO', 'SemiBold', 34, M, 262, 'concrete', 4, 'l', 'letter', c('ten years', 46), 12, 1)
        self.big = title('10 YEARS', M, 452, c('ten years', 22), px=190)
        self.why = sub('FOR ORGANISING THE HEIST', M, 520, c('for organising', 18), px=32)
        self.rowk = kicker('THREE MORE MEN · WHO POLICE BELIEVE ARE', M, self.CY - 34, c('Three more', 10), px=24)
        al = [('SPEEDY', 'Speedy'), ('THE MONSTER', 'the Monster'), ('THE GENIUS', 'the Genius'), ('THE KING OF KEYS', None)]
        self.cards = []
        last = 0
        for i, (nm, ph) in enumerate(al):
            st = c(ph, 34) if ph else last + 26
            last = st
            x = M + i * (self.CW + self.GAP)
            blank = ph is None
            t1 = Text(nm, 'SemiBold', 28, x + 28, self.CY + 58, 'concrete', 3, 'l', 'letter', st + 8, 10, 1,
                      a=0.6 if blank else 1.0)
            t2 = None if blank else Text('5 YEARS', 'Bold', 100, x + 26, self.CY + 182, 'cream', 1, 'l', 'letter', st + 18, 14, 2)
            t3 = Text('NEVER IDENTIFIED', 'Medium', 22, x + 28, self.CY + 212, 'concrete', 4, 'l', 'word', st + 40, 12, 4,
                      a=0.75) if blank else None
            self.cards.append((x, st, blank, t1, t2, t3))

    def layout(self, L, f):
        self.k.draw(L, f)
        self.name.draw(L, f)
        self.big.draw(L, f)
        self.why.draw(L, f)
        self.rowk.draw(L, f)
        for x, st, blank, t1, t2, t3 in self.cards:
            p = ramp(f, st, 22)
            if p <= 0:
                continue
            y0, y1 = self.CY, self.CY + self.CH
            if blank:
                pts = [(x, y0), (x + self.CW, y0), (x + self.CW, y1), (x, y1), (x, y0)]
                L.dashed(pts, 1.2, 'concrete', 0.55, 8, 7, ease_in_out(p))
                # the slot where a sentence would be stays empty
                L.line((x + 28, y0 + 150), (x + 28 + 120, y0 + 150), 1.2, 'concrete', 0.45,
                       ease_in_out(ramp(f, st + 20, 16)))
            else:
                L.rect(x, y0, x + self.CW, y1, 'cream', 0.045 * ease_out(p))
                L.outline(x, y0, x + self.CW, y1, 1.2, 'concrete', 0.4, ease_in_out(p))
                L.rect(x, y0, x + self.CW * ease_in_out(ramp(f, st + 6, 20)), y0 + 3, 'cream', 0.7)
            t1.draw(L, f)
            if t2:
                t2.draw(L, f)
            if t3:
                t3.draw(L, f)


# ============================================================================= split frame family: S43, S44, S47

def cream_panel_bg(f, cam, panels, base=None):
    """Background with flat-lit paper panels (subtle texture) composited with exact edge coverage in output space."""
    img = base if base is not None else charcoal_bg(f, cam)
    X0, Y0, s = cam.win(f)
    tb = cam.win(f, bg=True)
    tex = resample(concrete_tex(), *tb)
    lf = resample(light_field(), *tb)
    for (x0, y0, x1, y1, c) in panels:
        if x1 <= x0:
            continue
        cov = rect_cover((x0 - X0) * s, (y0 - Y0) * s, (x1 - X0) * s, (y1 - Y0) * s)[..., None]
        if c == 'cream':
            pc = colf('cream')[None, None, :] * (1 + tex[..., None] * 0.007 + lf[..., None] * 0.035 - 0.02)
        else:
            pc = charcoal_bg(f, cam)
        img = img * (1 - cov) + pc * cov
    return img


_UV = None


def _uv():
    global _UV
    if _UV is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        _UV = (xx / W, yy / H)
    return _UV


def orange_space(f, cam):
    """The revealed interior: signal orange, lit from above, falling to a deep burnt tone at the edges; concrete grain."""
    u, v = _uv()
    tb = cam.win(f, bg=True)
    tex = resample(concrete_tex(23), *tb)
    light = 0.70 + 0.42 * np.exp(-(((u - 0.5) / 0.42) ** 2 + ((v - 0.18) / 0.62) ** 2))
    light = light * (1 - 0.30 * np.clip(v - 0.35, 0, 1) ** 1.2)
    light = light * (1 - 0.22 * np.clip(np.abs(u - 0.5) * 2 - 0.55, 0, 1))
    o = colf('orange')[None, None, :]
    deep = np.array([0.40, 0.10, 0.07], np.float32)[None, None, :]
    k = np.clip(light, 0, 1.2)[..., None]
    img = deep + (o - deep) * np.clip(k, 0, 1) + (k - 1).clip(0) * 0.25
    img = img * (1 + tex[..., None] * 0.035)
    return img.astype(np.float32)


class S43(Shot):
    """Split frame: HIS STORY on a cream panel that slides in, THE EVIDENCE on charcoal; one orange link across."""
    sid = 'S43'
    seed = 43
    static_screen = False
    PW = 960

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=8: cue(self.sid, p, l)
        self.t_in = 4
        self.kl = kicker('HIS ACCOUNT · WIRED, 2009', M, 170, 20, color='ink')
        self.tl = title('HIS STORY', M, 290, 26, px=110, color='ink')
        self.sl = sub('AS TOLD TO JOSHUA DAVIS', M, 350, c('his version', 30), color='ink', px=26, track=4)
        self.kr = kicker('THE INVESTIGATION · 2003', self.PW + M, 170, 40)
        self.tr = title('THE EVIDENCE', self.PW + M, 290, 48, px=110)
        self.sr = sub('WHAT THE DETECTIVES FOUND', self.PW + M, 350, c('his version', 10), px=26, track=4)
        self.t_link = c('It points', 16)
        self.wl = text_width('HIS STORY', 'Bold', 110, 2)

    def pw(self, f):
        return self.PW * ease_in_out(ramp(f, self.t_in, 26))

    def background(self, f):
        return cream_panel_bg(f, self.cam, [(-40, -40, self.pw(f), H + 40, 'cream')])

    def layout(self, L, f):
        self.kl.draw(L, f, a=0.7)
        self.tl.draw(L, f)
        self.sl.draw(L, f, a=0.75)
        self.kr.draw(L, f)
        self.tr.draw(L, f)
        self.sr.draw(L, f)
        lp = ramp(f, self.t_link, 26)
        if lp > 0:
            y = 252
            x0, x1 = M + self.wl + 34, self.PW + M - 34
            L.square(x0, y, 4, 'orange', ease_out(ramp(f, self.t_link, 6)))
            L.line((x0, y), (x1, y), 2.2, 'orange', 1.0, ease_in_out(lp))
            if lp >= 1:
                L.square(x1, y, 4, 'orange', ease_out(ramp(f, self.t_link + 26, 6)))

    def screen(self, L, f):
        k = ease_in_out(ramp(f, self.t_in + 24, 12))
        F = 10 ** 6     # labels are present from frame 1 (screen-locked); only the ink label waits for its panel
        Text('HIS ACCOUNT · DISPUTED BY INVESTIGATORS', 'Medium', 22, M, 1028, 'ink', 3, 'l', 'line').draw(L, F, a=0.7 * k)
        Text(CASE, 'Medium', 22, W - M, 1028, 'concrete', 3, 'r', 'line').draw(L, F)


class S44(Shot):
    """His claims, typeset one by one in his panel, each prefixed HE SAYS; earlier claims recede as new ones land."""
    sid = 'S44'
    seed = 44
    static_screen = True
    PW0, PW1 = 960, 1150
    CLAIMS = [('He wasn’t the mastermind.', 'He says he'),
              ('A diamond dealer hired them to stage it for the insurance.', 'He says a'),
              ('They rehearsed in a replica vault, to work in the dark.', 'He says they'),
              ('Most bags were nearly empty: the stones were moved out before the weekend.', 'And his biggest'),
              ('About twenty million was taken. Not a hundred.', 'Twenty million')]

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=8: cue(self.sid, p, l)
        self.kl = kicker('HIS ACCOUNT · WIRED, 2009', M, 170, -100, color='ink')
        self.tl = title('HIS STORY', M, 290, -100, px=110, color='ink')
        self.kr = kicker('THE INVESTIGATION · 2003', self.PW0 + M, 170, -100)
        self.tr = title('THE EVIDENCE', self.PW0 + M, 290, -100, px=110)
        self.blocks = []
        y = 404
        maxw = self.PW1 - M - 70
        for i, (txt, ph) in enumerate(self.CLAIMS):
            st = max(14, c(ph, 10)) if i else 16
            k = Text('HE SAYS', 'SemiBold', 20, M, y, 'ink', 5, 'l', 'letter', st, 10, 1)
            p = Para(txt, 'Bold', 44, M, y + 46, maxw, 1.08, 'ink', 0.5, st + 8, 12, 2)
            self.blocks.append((st, k, p))
            y = p.y_last + 66
        self.y_end = y

    def pw(self, f):
        return lerp(self.PW0, self.PW1, ease_in_out(ramp(f, 2, 30)))

    def background(self, f):
        return cream_panel_bg(f, self.cam, [(-40, -40, self.pw(f), H + 40, 'cream')])

    def layout(self, L, f):
        self.kl.draw(L, f, a=0.7)
        self.tl.draw(L, f)
        dx = self.pw(f) - self.PW0
        dim = ease_in_out(ramp(f, 2, 30))
        self.kr.draw(L, f, dx=dx, a=1 - 0.55 * dim)
        self.tr.draw(L, f, dx=dx, a=1 - 0.55 * dim)
        starts = [b[0] for b in self.blocks]
        for i, (st, k, p) in enumerate(self.blocks):
            nxt = starts[i + 1] if i + 1 < len(starts) else 10 ** 6
            a = 1 - 0.5 * ease_in_out(ramp(f, nxt, 20))
            k.draw(L, f, a=0.6 * a)
            p.draw(L, f, a=a)

    def screen(self, L, f):
        Text('HIS ACCOUNT · DISPUTED BY INVESTIGATORS', 'Medium', 22, M, 1028, 'ink', 3, 'l', 'line').draw(L, f, a=0.7)
        Text(CASE, 'Medium', 22, W - M, 1028, 'concrete', 3, 'r', 'line').draw(L, f)


class S46(Shot):
    """Full-frame quote card, cream on charcoal, attributed."""
    sid = 'S46'
    seed = 46
    label_left = 'QUOTED IN COLUMBIA JOURNALISM REVIEW'
    Q = 'Not one detail of Leo’s story can be confirmed by the facts in the investigation.'

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        self.att = kicker('AGIM DE BRUYCKER · LEAD DETECTIVE', M + 4, 250, 10, px=30)
        self.qm = Text('“', 'Bold', 200, M - 6, 470, 'concrete', 0, 'l', 'line', 22, 16)
        self.q = Para(self.Q, 'Bold', 92, M + 4, 520, 1640, 1.08, 'cream', 0.5, 34, 12, 3)
        self.att2 = Text('— AGIM DE BRUYCKER, LEAD DETECTIVE', 'SemiBold', 30, M + 4, self.q.y_last + 112, 'concrete', 4,
                         'l', 'letter', self.q.end + 4, 12, 1)

    def layout(self, L, f):
        self.att.draw(L, f, out=(self.q.end - 6, 20))
        self.qm.draw(L, f, a=0.55)
        self.q.draw(L, f)
        self.att2.draw(L, f)


class S47(Shot):
    """The split frame again; each panel takes one branch of the argument; then the two panels slide apart
    (the false-floor reveal) onto an empty, lit orange space."""
    sid = 'S47'
    seed = 47
    static_screen = False
    PW = 960

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=8: cue(self.sid, p, l)
        self.kl = kicker('HIS ACCOUNT · WIRED, 2009', M, 170, -100, color='ink')
        self.tl = title('HIS STORY', M, 290, -100, px=110, color='ink')
        self.kr = kicker('THE INVESTIGATION · 2003', self.PW + M, 170, -100)
        self.tr = title('THE EVIDENCE', self.PW + M, 290, -100, px=110)
        s1 = max(20, c("If he's telling", 4))
        self.bl = [kicker('IF HE’S TELLING THE TRUTH', M, 560, s1, color='ink', px=26),
                   Para('The real crime happened inside the building.', 'Bold', 54, M, 640, 760, 1.08, 'ink', 0.5,
                        s1 + 14, 12, 3),
                   Text('HE’S THE FALL GUY', 'Bold', 54, M, 820, 'ink', 1, 'l', 'word', c('fall guy', 6), 12, 4)]
        s2 = c('If he isn', 4)
        self.br = [kicker('IF HE ISN’T', self.PW + M, 560, s2, px=26),
                   Para('A mostly empty vault is a very convenient story', 'Bold', 54, self.PW + M, 640, 760, 1.08,
                        'cream', 0.5, s2 + 14, 12, 3),
                   Text('FOR THE ONE MAN WHO KNOWS WHERE THE REST WENT', 'SemiBold', 24, self.PW + M, 820, 'concrete', 3,
                        'l', 'word', c('the one man', 10), 12, 3)]
        self.t_open = c('the one man', -14)
        self.t_open = min(self.t_open, self.n - 84)     # reveal (54 f) completes with >= 30 f of empty orange

    def d(self, f):
        return (self.PW + 60) * ease_in_out(ramp(f, self.t_open, 54))

    def background(self, f):
        d = self.d(f)
        if d <= 0:
            return cream_panel_bg(f, self.cam, [(-40, -40, self.PW, H + 40, 'cream')])
        base = orange_space(f, self.cam)
        X0, Y0, s = self.cam.win(f)
        xl = (self.PW - d - X0) * s
        xr = (self.PW + d - X0) * s
        u = np.arange(W, dtype=np.float32)
        sh = 0.42 * np.exp(-np.clip(u - xl, 0, None) / 70.0) * (u >= xl) + \
            0.42 * np.exp(-np.clip(xr - u, 0, None) / 70.0) * (u <= xr)
        base = base * (1 - np.clip(sh, 0, 0.6))[None, :, None]
        right = charcoal_bg(f, self.cam)
        cov_r = rect_cover(xr, -10, W + 10, H + 10)[..., None]
        base = base * (1 - cov_r) + right * cov_r
        return cream_panel_bg(f, self.cam, [(-40 - d, -40, self.PW - d, H + 40, 'cream')], base=base)

    def layout(self, L, f):
        d = self.d(f)
        self.kl.draw(L, f, a=0.7, dx=-d)
        self.tl.draw(L, f, dx=-d)
        self.kr.draw(L, f, dx=d)
        self.tr.draw(L, f, dx=d)
        for t in self.bl:
            t.draw(L, f, dx=-d)
        for t in self.br:
            t.draw(L, f, dx=d)

    def screen(self, L, f):
        d = self.d(f)
        F = 10 ** 6
        Text('TWO ACCOUNTS · ONE VAULT', 'Medium', 22, M, 1028, 'ink', 3, 'l', 'line').draw(L, F, a=0.7)
        k = clamp01((d - 560) / 80)
        Text(CASE, 'Medium', 22, W - M, 1028, 'concrete', 3, 'r', 'line').draw(L, F, a=1 - k)
        Text(CASE, 'Medium', 22, W - M, 1028, 'ink', 3, 'r', 'line').draw(L, F, a=0.7 * k)


# ============================================================================= S49 · timeline 2009 -> 2017

class S49(Shot):
    sid = 'S49'
    seed = 49
    label_left = None
    AX, Y = (100, 1820), 400
    EVENTS = [(2009, 'PAROLED'), (2010, 'MILAN'), (2011, 'WARRANT'), (2013, 'PARIS'), (2017, 'SENTENCE SERVED')]

    def xo(self, yr):
        return self.AX[0] + (yr - 2008.6) / (2018.4 - 2008.6) * (self.AX[1] - self.AX[0])

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=8: cue(self.sid, p, l)
        self.k = kicker('AFTER THE SENTENCE · 2009–2017', M, 170, 6)
        st = {2009: 30, 2010: c('In 2010', 10), 2011: self.n - 112, 2013: self.n - 100, 2017: self.n - 88}
        self.st = st
        self.ev = []
        for yr, lbl in self.EVENTS:
            x = self.xo(yr)
            future = yr > 2010
            self.ev.append((yr, x, st[yr], future,
                            Text(str(yr), 'Bold', 64, x - 4, self.Y - 30, 'cream', 1, 'l', 'letter', st[yr], 12, 2),
                            Text(lbl, 'SemiBold', 24, x, self.Y + 46, 'concrete' if future else 'cream', 3, 'l', 'letter',
                                 st[yr] + 10, 10, 1)))
        self.e09 = Text('THE YEAR HIS STORY RUNS', 'Medium', 20, self.xo(2009), self.Y + 78, 'concrete', 3, 'l', 'word',
                        44, 12, 3)
        x = self.xo(2010)
        self.bx = x
        s = c('about a kilogram', 16)
        self.s10 = s
        self.d1 = Text('ABOUT A KILOGRAM OF DIAMONDS', 'Bold', 64, x, 610, 'cream', 1, 'l', 'letter', s, 12, 1)
        self.d2 = sub('HIDDEN BETWEEN THE SEATS OF HIS CAR', x, 666, s + 26, px=28, track=4)
        s3 = c('He says', 20)
        s4 = c('Belgian police', 24)
        self.c1 = [Text('HE SAYS', 'SemiBold', 22, x, 770, 'concrete', 5, 'l', 'letter', s3, 10, 1),
                   Para('Cheap industrial stones, bought legally.', 'Bold', 44, x, 830, 600, 1.1, 'cream', 0.5, s3 + 8, 12, 3)]
        x2 = x + 720
        self.c2 = [Text('BELGIAN POLICE SAY', 'SemiBold', 22, x2, 770, 'concrete', 5, 'l', 'letter', s4, 10, 1),
                   Para('Of the highest quality.', 'Bold', 44, x2, 830, 560, 1.1, 'cream', 0.5, s4 + 8, 12, 3)]
        self.x2 = x2
        self.s3, self.s4 = s3, s4

    def layout(self, L, f):
        self.k.draw(L, f)
        Y = self.Y
        ap = ease_in_out(ramp(f, 8, 50))
        L.line((self.AX[0], Y), (self.AX[1], Y), 1.4, 'concrete', 0.7, ap)
        for yr in range(2009, 2019):
            x = self.xo(yr)
            tp = ramp(f, 8 + (x - self.AX[0]) / (self.AX[1] - self.AX[0]) * 50, 10)
            L.line((x, Y), (x, Y - 10), 1.2, 'concrete', 0.6 * ease_out(tp))
        for yr, x, st, future, ty, tl in self.ev:
            a = 0.55 if future else 1.0
            p = ramp(f, st, 10)
            if p > 0:
                L.square(x, Y, 5, 'cream' if not future else 'concrete', ease_out(p) * a)
            ty.draw(L, f, a=a, color='concrete' if future else None)
            tl.draw(L, f, a=a)
        self.e09.draw(L, f)
        # 2010 detail, hung from its tick
        dp = ramp(f, self.s10 - 14, 20)
        if dp > 0:
            L.line((self.bx, Y + 100), (self.bx, 548), 1.2, 'concrete', 0.6, ease_in_out(dp))
        self.d1.draw(L, f)
        self.d2.draw(L, f)
        for t in self.c1 + self.c2:
            t.draw(L, f)
        sp = ramp(f, self.s4 - 4, 20)
        if sp > 0:
            L.line((self.x2 - 60, 750), (self.x2 - 60, 750 + 160 * ease_in_out(sp)), 1.2, 'concrete', 0.5)


# ============================================================================= S50 · Turin -> Paris CDG

class S50(Shot):
    """Schematic: a flight line arrives from the west (FROM THE UNITED STATES) to Paris CDG, the orange arrest mark,
    then a faint dashed continuation toward Turin that stops: never reached. No tiles."""
    sid = 'S50'
    seed = 50
    label_left = 'SCHEMATIC · NOT TO SCALE'
    PAR, TUR = (1160, 470), (1580, 880)

    def __init__(self):
        super().__init__(shot_info(self.sid)['render_frames'])
        c = lambda p, l=8: cue(self.sid, p, l)
        self.items = [Text('NEVER COMPENSATED HIS VICTIMS', 'SemiBold', 30, M, 200, 'concrete', 4, 'l', 'letter', 8, 12, 1),
                      Text('BROKE HIS PAROLE', 'SemiBold', 30, M, 254, 'concrete', 4, 'l', 'letter', c('He breaks', 10), 12, 1),
                      Text('2011 · EUROPEAN ARREST WARRANT', 'SemiBold', 30, M, 308, 'concrete', 4, 'l', 'letter',
                           c('He breaks', -16), 12, 1)]
        self.t_line = min(c('And in 2013', 30), self.n - 200)
        self.t_arrest = self.t_line + 64
        self.t_dash = self.t_arrest + 26
        self.t = title('PARIS · 2013', M, H - 190, min(c('a European', 24), self.n - 120), px=150)
        self.s = sub('ARRESTED ON A LAYOVER · SENTENCE SERVED BY 2017', M, H - 118, min(c('He serves', 24), self.n - 90))
        p, t = self.PAR, self.TUR
        x0, y0 = -60, 610
        mx, my = (x0 + p[0]) / 2, min(y0, p[1]) - 70
        self.route = [(lerp(lerp(x0, mx, u), lerp(mx, p[0], u), u), lerp(lerp(y0, my, u), lerp(my, p[1], u), u))
                      for u in np.linspace(0, 1, 48)]
        self.dash = [p, (lerp(p[0], t[0], 0.52), lerp(p[1], t[1], 0.52))]
        self.lus = tag('FROM THE UNITED STATES', M, 628, self.t_line + 6, 'concrete', px=24)
        self.lp = tag('PARIS · CHARLES DE GAULLE', p[0] + 30, p[1] - 14, self.t_line + 50, 'cream', px=30)
        self.la = tag('ARRESTED · 2013', p[0] + 30, p[1] + 26, self.t_arrest + 6, 'orange', px=24)
        self.lt = tag('TURIN', t[0] + 26, t[1] + 10, self.t_dash + 6, 'concrete', px=26)

    def layout(self, L, f):
        for t in self.items:
            t.draw(L, f)
        p, t = self.PAR, self.TUR
        self.lus.draw(L, f)
        lp = ramp(f, self.t_line, 64)
        L.polyline(self.route, 2.0, 'cream', 0.85, ease_in_out(lp))
        g = ease_out(ramp(f, self.t_line + 44, 14))
        L.dot(p[0], p[1], 3.5, 'cream', g)
        self.lp.draw(L, f)
        ap = ramp(f, self.t_arrest, 16)
        if ap > 0:
            e = ease_out(ap)
            L.ring(p[0], p[1], 9 + 5 * (1 - e), 2.0, 'orange', e)
            L.square(p[0], p[1], 3.5, 'orange', e)
        self.la.draw(L, f)
        dp = ramp(f, self.t_dash, 40)
        if dp > 0:
            L.dashed(self.dash, 1.4, 'concrete', 0.55, 7, 7, ease_in_out(dp))
            gt = ease_out(ramp(f, self.t_dash, 20))
            L.ring(t[0], t[1], 8, 1.4, 'concrete', 0.5 * gt)
        self.lt.draw(L, f, a=0.6)
        self.t.draw(L, f)
        self.s.draw(L, f)


REG = {'S06': S06, 'S09': S09, 'S12': S12, 'S19': S19, 'S30': S30, 'S37': S37, 'S39': S39, 'S40': S40, 'S43': S43,
       'S44': S44, 'S46': S46, 'S47': S47, 'S49': S49, 'S50': S50}
