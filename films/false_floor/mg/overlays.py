"""FALSE FLOOR overlays (RGBA PNG, straight alpha, screen space: no push, no grain) and the end card.

O_109   : 252 frames for S01 — "109 / 189" builds bottom-left like SF1, kicker MONDAY 17 FEBRUARY 2003 · LEVEL −2
O_LAYER : layer_01.png … layer_10.png (corner layer counter, one PNG per value)
O_COUNT : count_001.png … count_109.png ("054 / 189" corner box counter, one PNG per value)
O_TITLE : 72 frames — FALSE FLOOR · CASE No. 02 settles lower-left (S03)
O_LABEL : label.png — persistent ILLUSTRATIVE RECONSTRUCTION + FALSE FLOOR · CASE No. 02 lower corners
END     : 360 frames (15 s) full-frame end card: lockup, NEXT CASE teaser, two video-tile zones + subscribe zone
"""
from kit import W, H, M, Layer, Text, Shot, Cam, ramp, ease_out, ease_out4, ease_in_out, lerp, clamp01, text_width, \
    corner_labels, CASE, LABEL_Y

NEXT_KICKER = 'NEXT CASE'
NEXT_LINE = 'CASE No. 03 · COMING SOON'          # edit here when the next case is locked, then re-run END

TY = H - 190    # title baseline used by SF1 / SF3 / tools/brand_frame.py


class Overlay(Shot):
    rgba = True
    label_left = None
    label_right = None

    def __init__(self, n):
        super().__init__(n)
        self.cam = Cam(n, push=0.0, bg_push=0.0)

    def screen(self, L, f):
        pass


class O_109(Overlay):
    def __init__(self):
        super().__init__(252)
        self.k = Text('MONDAY 17 FEBRUARY 2003 · LEVEL −2', 'SemiBold', 30, M, TY - 168, 'concrete', 4, 'l', 'letter', 24,
                      12, 1)
        self.t = Text('109 / 189', 'Bold', 150, M, TY, 'cream', 2, 'l', 'letter', 46, 14, 3)
        self.s = Text('SAFE-DEPOSIT BOXES FORCED', 'Medium', 34, M, TY + 72, 'concrete', 5, 'l', 'word', 84, 12, 5)

    def layout(self, L, f):
        self.k.draw(L, f)
        self.t.draw(L, f)
        self.s.draw(L, f)


def _corner_counter(L, kick, big, small, a=1.0):
    """Right-aligned corner counter: small kicker over a big tabular number with a quiet suffix."""
    xr = W - M
    ws = text_width(small, 'Medium', 30, 2)
    Text(small, 'Medium', 30, xr, 196, 'concrete', 2, 'r', 'line').draw(L, 10 ** 6, a=a)
    Text(big, 'Bold', 76, xr - ws - 8, 196, 'cream', 1, 'r', 'line').draw(L, 10 ** 6, a=a)
    Text(kick, 'SemiBold', 22, xr, 112, 'concrete', 5, 'r', 'line').draw(L, 10 ** 6, a=a)


class O_LAYER(Overlay):
    def __init__(self):
        super().__init__(10)

    def files(self):
        return [(f'layer_{v + 1:02d}.png', v) for v in range(10)]

    def layout(self, L, f):
        _corner_counter(L, 'LAYER', f'{f + 1:02d}', '/ 10')


class O_COUNT(Overlay):
    def __init__(self):
        super().__init__(109)

    def files(self):
        return [(f'count_{v + 1:03d}.png', v) for v in range(109)]

    def layout(self, L, f):
        _corner_counter(L, 'BOXES FORCED', f'{f + 1:03d}', '/ 189')


class O_TITLE(Overlay):
    def __init__(self):
        super().__init__(72)
        self.t = Text('FALSE FLOOR', 'Bold', 140, M, TY, 'cream', 3, 'l', 'letter', 2, 14, 2)
        self.s = Text('CASE No. 02', 'Medium', 34, M, TY + 72, 'concrete', 6, 'l', 'letter', 22, 12, 2)
        self.sw = self.s.width

    def layout(self, L, f):
        self.t.draw(L, f)
        self.s.draw(L, f)
        p = ease_in_out(ramp(f, 40, 16))
        if p > 0:          # the brand lockup's short orange dash (as on the brand board)
            x0 = M + self.sw + 22
            L.rect(x0, TY + 72 - 16, x0 + 54 * p, TY + 72 - 11, 'orange')


class O_LABEL(Overlay):
    def __init__(self):
        super().__init__(1)

    def files(self):
        return [('label.png', 0)]

    def layout(self, L, f):
        corner_labels(L, 'ILLUSTRATIVE RECONSTRUCTION', CASE)


# ----------------------------------------------------------------------------- end card

# the approved mark (assets_private/ref/transparent-icon-800.png) as vector planes, 800-unit space
MARK_TOP = [(80, 265), (450, 118), (718, 199), (350, 352)]
MARK_LOW = [(80, 474), (450, 327), (718, 408), (350, 561)]
MARK_HOLE = [(383, 437), (483, 396), (580, 425), (480, 467)]
MARK_DROP = [(500, 458), (608, 413), (608, 607), (500, 653)]


class END(Shot):
    """15 s end card. Left: lockup + NEXT CASE teaser + subscribe zone. Right: two 16:9 video-tile zones.
    Zones are drawn as quiet hairline frames so YouTube's end-screen elements sit on them."""
    seed = 99
    label_left = None
    label_right = None
    TILES = [(1180, 180, 1820, 540), (1180, 590, 1820, 950)]
    SUB = (188, 862, 88)

    def __init__(self):
        super().__init__(360)
        self.cam = Cam(360, push=0.006, bg_push=0.028)
        k = 0.26
        self.k = k
        self.mo = (M - 80 * k, 150 - 118 * k)
        x = M + (718 - 80) * k + 44
        self.div_x = x
        self.w1 = Text('FALSE', 'Bold', 96, x + 32, 236, 'cream', 2, 'l', 'letter', 26, 14, 2)
        self.w2 = Text('FLOOR', 'Bold', 96, x + 32, 326, 'cream', 2, 'l', 'letter', 32, 14, 2)
        self.tag = Text('THE STORY BENEATH', 'SemiBold', 24, x + 34, 380, 'concrete', 7, 'l', 'letter', 48, 12, 1)
        self.nk = Text(NEXT_KICKER, 'SemiBold', 26, M, 600, 'concrete', 5, 'l', 'letter', 96, 12, 1)
        self.nl = Text(NEXT_LINE, 'Bold', 64, M, 684, 'cream', 1, 'l', 'letter', 104, 14, 1)
        self.wk = Text('WATCH NEXT', 'SemiBold', 22, self.TILES[0][0], 150, 'concrete', 5, 'l', 'letter', 70, 12, 1)
        cx, cy, r = self.SUB
        self.sl = Text('SUBSCRIBE', 'SemiBold', 30, cx + r + 30, cy + 11, 'cream', 6, 'l', 'letter', 128, 12, 1)

    def P(self, pts, dy=0.0):
        k, (ox, oy) = self.k, self.mo
        return [(ox + x * k, oy + y * k + dy) for x, y in pts]

    def layout(self, L, f):
        # mark: the lower plane separates from the upper (separation reveals depth), then the orange drop
        sp = ease_in_out(ramp(f, 8, 30))
        a = ease_out(ramp(f, 6, 14))
        lift = (1 - sp) * (474 - 265) * self.k
        L.poly(self.P(MARK_LOW, -lift), 'concrete', a)
        L.poly(self.P(MARK_TOP), 'cream', a)
        hp = ease_out(ramp(f, 30, 12))
        L.poly(self.P(MARK_HOLE), 'cream', hp)
        dp = ease_out4(ramp(f, 34, 18))
        if dp > 0:
            d = self.P(MARK_DROP)
            L.poly([d[0], d[1], (d[1][0], lerp(d[1][1], d[2][1], dp)), (d[0][0], lerp(d[0][1], d[3][1], dp))], 'orange')
        # divider + wordmark
        L.line((self.div_x, 152), (self.div_x, 152 + 240 * ease_in_out(ramp(f, 20, 20))), 1.4, 'concrete', 0.8)
        self.w1.draw(L, f)
        self.w2.draw(L, f)
        self.tag.draw(L, f)
        tp = ease_in_out(ramp(f, 62, 14))
        if tp > 0:
            x0 = self.tag.x + self.tag.width + 18
            L.rect(x0, 372, x0 + 50 * tp, 377, 'orange')
        # next case
        self.nk.draw(L, f)
        self.nl.draw(L, f)
        # video tiles
        self.wk.draw(L, f)
        for i, (x0, y0, x1, y1) in enumerate(self.TILES):
            p = ramp(f, 64 + i * 12, 30)
            if p > 0:
                L.rect(x0, y0, x1, y1, (0, 0, 0), 0.22 * ease_out(p))
                L.outline(x0, y0, x1, y1, 1.2, 'concrete', 0.45, ease_in_out(p))
        # subscribe zone
        cx, cy, r = self.SUB
        p = ramp(f, 120, 20)
        if p > 0:
            L.ring(cx, cy, r, 1.4, 'concrete', 0.55 * ease_out(p))
        self.sl.draw(L, f)


REG = {'O_109': O_109, 'O_LAYER': O_LAYER, 'O_COUNT': O_COUNT, 'O_TITLE': O_TITLE, 'O_LABEL': O_LABEL, 'END': END}
