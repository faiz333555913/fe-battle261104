# ラグズ（獣牙族：猫・虎）。1文字＝1ドット、右向き
#   人の姿：歩兵と同じ組み立て（頭・胴は手描き、脚・腕は関節から）。武器は持たず、素手（爪）で戦う。耳としっぽつき
#   獣の姿：騎馬の馬と同じく、胴・頭・脚・しっぽを「形（楕円・先細りの棒）」の組み合わせで描き、ポーズごとに関節だけ変える
#           （どのコマでも大きさと頭の形が同じ）。猫は虎の 0.8 倍の大きさで、体つきも細い
import math
import fighter
from fighter import frame, _arm, _hand, WEAPONS
from mounted import Mounted, MFOOT, Body, fill_shape, shade3
from flyer import wing


# ---------------- 人の姿の「武器」：素手と爪 ----------------
def claw_arm(cv, ch, sx, sy, hx, hy, ang, arm=True, **kw):
    if arm:
        _arm(cv, ch, sx, sy, hx, hy)
    _hand(cv, hx, hy)
    if ang is None:
        return
    # 爪：こぶしの先から3本、ang の向きに短く伸ばす
    r = math.radians(ang)
    dx, dy = math.cos(r), math.sin(r)
    nx, ny = -dy, dx
    for k in (-1, 0, 1):
        for i in range(2, 5):
            cv.put(hx + dx * i + nx * k * 1.2, hy + dy * i + ny * k * 1.2, 'M')


WEAPONS['claw'] = claw_arm


# ---------------- 獣の形（模様つき） ----------------
class Area:
    """このブロックの中だけ、マスの大きさと足元を変える（竜は騎馬より大きなマス）"""
    def __init__(self, w, h, foot):
        self.v = (w, h, foot)

    def __enter__(self):
        self.save = (fighter.W, fighter.H, fighter.FOOT)
        fighter.W, fighter.H, fighter.FOOT = self.v

    def __exit__(self, *a):
        fighter.W, fighter.H, fighter.FOOT = self.save


class Chain:
    """頭だけ首の付け根まわりに回す → 胴の変換、の2段の座標変換"""
    def __init__(self, B, H):
        self.B, self.H = B, H

    def T(self, x, y):
        return self.B.T(*self.H.T(x, y))

    def inv(self, X, Y):
        return self.H.inv(*self.B.inv(X, Y))


def ell(cv, B, cx, cy, rx, ry, C, pat=None):
    L, M, D = C

    def col(x, y):
        base = shade3((y - cy) / ry, L, M, D)
        return pat(x, y, (y - cy) / ry, base) if pat else base
    fill_shape(cv, B, (cx - rx, cy - ry, cx + rx, cy + ry),
               lambda x, y: ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0, col)


def cap(cv, B, p0, p1, r0, r1, C, pat=None):
    L, M, D = C
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    l2 = dx * dx + dy * dy or 1
    R = max(r0, r1)

    def f(x, y):
        t = max(0.0, min(1.0, ((x - x0) * dx + (y - y0) * dy) / l2))
        px, py = x0 + dx * t, y0 + dy * t
        r = r0 + (r1 - r0) * t
        return (x - px) ** 2 + (y - py) ** 2 <= r * r, (y - py) / max(r, 0.5), (x - px) / max(r, 0.5), t

    def col(x, y):
        _, vy, vx, t = f(x, y)
        v = vy if abs(dy) < abs(dx) else -vx
        base = shade3(v, L, M, D, -0.5, 0.5)
        return pat(x, y, v, base) if pat else base
    fill_shape(cv, B, (min(x0, x1) - R, min(y0, y1) - R, max(x0, x1) + R, max(y0, y1) + R),
               lambda x, y: f(x, y)[0], col)


# ---------------- 獣のポーズ（虎の大きさの座標。猫は全体を縮める） ----------------
F_TOP, H_TOP = (11, -17), (-14, -18)
FL = {   # 前脚: ひじ → 手首 → 足先
    'stand':  [(12, -9), (13, -3), (15, -1)],
    'stand2': [(9, -9), (9, -3), (11, -1)],
    'reach':  [(20, -14), (26, -12), (30, -11)],
    'reach2': [(18, -13), (24, -10), (28, -9)],
    'plant':  [(14, -8), (14, -2), (16, -1)],
    'under':  [(8, -9), (4, -4), (5, -1)],
    'fold':   [(17, -12), (13, -8), (15, -6)],
    'fold2':  [(15, -11), (11, -7), (13, -5)],
    'swipe':  [(23, -14), (30, -15), (35, -16)],     # 前足を高く振りかぶる
    'rake':   [(21, -12), (27, -7), (31, -5)],       # 振り下ろして引っかく
    'leap':   [(20, -13), (27, -12), (32, -11)],     # 飛びかかる（爪を前へ）
    'leap2':  [(17, -9), (23, -6), (27, -5)],
    'crouch': [(16, -6), (16, -2), (19, -1)],
    'crouch2': [(13, -6), (13, -2), (16, -1)],
    'low':    [(16, -8), (17, -5), (20, -4)],        # 伏せ（胴を下げた分、足先を上の座標に）
    'low2':   [(13, -8), (14, -5), (17, -4)],
}
HL = {   # 後脚: ひざ → かかと → 足先
    'stand':  [(-10, -10), (-17, -5), (-15, -1)],
    'stand2': [(-8, -10), (-15, -5), (-13, -1)],
    'back':   [(-21, -12), (-28, -9), (-32, -8)],
    'back2':  [(-19, -13), (-26, -11), (-30, -10)],
    'under':  [(-4, -11), (-8, -5), (-4, -1)],
    'under2': [(-6, -11), (-10, -5), (-6, -1)],
    'push':   [(-13, -9), (-21, -4), (-21, -1)],
    'crouch': [(-7, -6), (-16, -3), (-13, -1)],
    'crouch2': [(-9, -6), (-18, -3), (-15, -1)],
    'low':    [(-6, -9), (-16, -6), (-13, -4)],
    'low2':   [(-8, -9), (-18, -6), (-15, -4)],
}
TAIL = {
    'up':   [(-21, -22), (-27, -20), (-31, -24), (-33, -31), (-31, -36)],
    'back': [(-21, -22), (-28, -23), (-35, -24), (-41, -26), (-46, -27)],
    'low':  [(-21, -21), (-27, -17), (-32, -13), (-37, -12), (-41, -14)],
    'lash': [(-21, -22), (-27, -26), (-30, -32), (-28, -38), (-24, -41)],
}
# ang: 胴の傾き（マイナスで前が上がる）、piv: 回す中心、dy: 上下、nod: 頭のずれ、tilt: 頭の傾き、mouth: 口の開き（0〜2）
BEAST = {
    'stand':  dict(ang=0, dy=0, legs=('stand', 'stand2', 'stand', 'stand2'), tail='up', nod=(0, 1), tilt=0, mouth=0),
    # 走り（バウンド走り）：4本を伸ばして宙を飛ぶ → 前足で着地 → 4本を体の下に集める → 後足でけり出す
    'run1':   dict(ang=0, dy=-4, legs=('reach', 'reach2', 'back', 'back2'), tail='back', nod=(1, 0), tilt=0, mouth=0),
    'run2':   dict(ang=4, dy=0, legs=('plant', 'under', 'push', 'back2'), tail='back', nod=(1, 1), tilt=4, mouth=0),
    'run3':   dict(ang=0, dy=-2, legs=('under', 'fold2', 'under', 'under2'), tail='back', nod=(0, 1), tilt=0, mouth=0),
    'run4':   dict(ang=-5, dy=0, legs=('fold', 'reach2', 'push', 'under2'), tail='back', nod=(1, -1), tilt=-3, mouth=0),
    # 飛びかかる前に身を低く伏せる
    'crouch': dict(ang=3, dy=3, legs=('low', 'low2', 'low', 'low2'), tail='low', nod=(2, 3), tilt=6, mouth=1),
    # 飛びかかる（口を開け、爪を前へ）
    'pounce': dict(ang=-12, dy=-7, legs=('leap', 'leap2', 'back', 'back2'), tail='back', nod=(1, -1), tilt=-6, mouth=2, claw=True),
    # 前足を振りかぶる → 振り下ろす（後足で立ち上がって）
    'swipe':  dict(ang=-16, piv=(-14, -2), dy=0, legs=('swipe', 'plant', 'stand', 'stand2'), tail='lash', nod=(0, -1), tilt=-8, mouth=2, claw=True),
    'rake':   dict(ang=-3, dy=0, legs=('rake', 'plant', 'push', 'stand2'), tail='back', nod=(2, 1), tilt=4, mouth=2, claw=True),
    # かみつく（頭を前へ突き出す）
    'bite':   dict(ang=3, dy=1, legs=('plant', 'stand2', 'push', 'back2'), tail='back', nod=(4, 2), tilt=6, mouth=2),
    'hurt':   dict(ang=-8, piv=(-14, -2), dy=0, legs=('stand2', 'stand', 'crouch', 'stand2'), tail='low', nod=(-2, -2), tilt=-10, mouth=1),
    'dodge':  dict(ang=-6, dy=-4, legs=('fold', 'fold2', 'under', 'under2'), tail='back', nod=(-1, -1), tilt=-4, mouth=0),
    # ほえる（必殺のカットイン）：頭を上げて大きく口を開く
    'roar':   dict(ang=-10, piv=(-14, -2), dy=0, legs=('plant', 'stand2', 'crouch', 'crouch2'), tail='lash', nod=(0, -3), tilt=-18, mouth=2),
}
# 竜の翼の角度（たたんだ翼を、ポーズで少し開く）
WING_ANG = {'roar': 78, 'pounce': 62, 'swipe': 66, 'hurt': 58, 'dodge': 70, 'bite': 48, 'rake': 50, 'run1': 52, 'run4': 48}
HEAD = (23, -27)
DHEAD = (27, -33)       # 竜の頭（長い首の先）
NECK0 = (12, -22)


def draw_beast(sp, pose):
    s, bulk = sp['scale'], sp['bulk']
    h = BEAST[pose]
    piv = h.get('piv', (0, 0))
    with Area(*sp.get('canvas', (150, 112, MFOOT))):
        cv = fighter.Canvas()

        def S(p):
            return (p[0] * s, p[1] * s)
        B = Body(h['ang'], S(piv), 0, h['dy'] * s)
        C = ('1', '2', '3')
        CF = ('3', '3', '&')          # 奥の脚
        stripe = sp.get('stripe')

        def body_pat(x, y, v, base):
            if sp.get('dragon') and v > 0.5:
                return '6' if ((x / s + 100) % 4) < 0.9 else '5'      # 腹のうろこ（横じま）
            if v > 0.55:
                return '5' if sp.get('belly') else base
            if stripe and v < 0.45 and ((x / s * 0.9 - y / s * 0.35 + 100) % stripe) < 1.9 - (v + 1) * 0.9:
                return '4'
            return base

        def leg_pat(x, y, v, base):
            if stripe and ((y / s + 100) % 5) < 1.0 and v < 0.4:
                return '4'
            return base

        def tail_pat_fn(i):
            def f(x, y, v, base):
                return '4' if sp.get('rings') and i % 2 == 1 else base
            return f

        def leg_(top, joints, front, near):
            pts = [B.T(*S(top))] + [B.T(*S(j)) for j in joints]
            cols = C if near else CF
            rs = ([4.2, 2.8, 2.2, 2.0] if front else [5.2, 3.0, 2.0, 2.0])
            if sp.get('dragon'):
                rs = [r * 1.25 for r in rs]
            I = Body()
            for i in range(3):
                cap(cv, I, pts[i], pts[i + 1], rs[i] * s * bulk, rs[i + 1] * s * bulk, cols, leg_pat if near else None)
            px, py = pts[3]
            ell(cv, I, px + (1.2 if front else 0.6) * s, py, 3.0 * s, 1.8 * s, cols if near else CF)
            return pts[3]

        fl, fl2, hl, hl2 = h['legs']
        dragon = sp.get('dragon')
        WCOL = ('2', '3', '&', '4', '4')
        wth = h.get('wing', 40)
        if dragon:                     # 奥の翼（たたんで背中の上へ）
            wing(cv, B, S((2, -27)), wth + 6, 34 * s, 18 * s, 'bat', False, WCOL)
        # しっぽ（体の後ろ）
        tp = [B.T(*S(p)) for p in TAIL[h['tail']]]
        rs = [3.0, 2.6, 2.2, 1.9, 1.7] if not dragon else [5.0, 4.0, 3.0, 2.0, 1.0]
        for i in range(len(tp) - 1):
            tip = i == len(tp) - 2
            cap(cv, Body(), tp[i], tp[i + 1], rs[i] * s, rs[i + 1] * s,
                ('4', '4', '4') if (tip and sp.get('dark_tip')) else C, tail_pat_fn(i))
            if dragon:                 # しっぽのとげ
                (x0, y0), (x1, y1) = tp[i], tp[i + 1]
                for f in (0.3, 0.8):
                    bx, by = x0 + (x1 - x0) * f, y0 + (y1 - y0) * f
                    r = (rs[i] + (rs[i + 1] - rs[i]) * f) * s
                    cap(cv, Body(), (bx, by - r + 0.5), (bx - 1.5 * s, by - r - 2.5 * s), 1.2 * s, 0.4, ('4', '4', '4'))
        # 奥の脚
        leg_(F_TOP, FL[fl2], True, False)
        leg_((H_TOP[0] + 2, H_TOP[1]), HL[hl2], False, False)
        # 胴（しり・腹・胸）
        ell(cv, B, -14 * s, -20 * s, 8.5 * s * bulk, 7.5 * s * bulk, C, body_pat)
        ell(cv, B, -2 * s, -19.5 * s, 13 * s, 6.8 * s * bulk, C, body_pat)
        ell(cv, B, 10 * s, -21 * s, 8 * s * bulk, 8.5 * s * bulk, C, body_pat)
        if dragon:
            # 背中のとげ
            for x in range(-22, 14, 4):
                top = -20 - (7.5 if x < -8 else 7.2 if x < 4 else 8.5) * bulk
                cap(cv, B, S((x, top + 1)), S((x - 1.5, top - 2.5)), 1.5 * s, 0.5, ('4', '4', '4'))
            # 首と頭（長い首・とがった鼻先・角）
            nx, ny = h['nod']
            Hc = (DHEAD[0] + nx, DHEAD[1] + ny)
            cap(cv, B, S(NECK0), S((Hc[0] - 3, Hc[1] + 1)), 7.5 * s * bulk, 4.8 * s, C, body_pat)
            for f in (0.3, 0.6):
                x = NECK0[0] + (Hc[0] - 3 - NECK0[0]) * f
                y = NECK0[1] + (Hc[1] + 1 - NECK0[1]) * f - (7.5 - 2.5 * f) * bulk
                cap(cv, B, S((x, y + 1)), S((x - 1.5, y - 2)), 1.3 * s, 0.5, ('4', '4', '4'))
            Hd = Chain(B, Body(h['tilt'], S(Hc)))
            hx, hy = S(Hc)
            m = h['mouth']
            cap(cv, Hd, (hx - 2 * s, hy - 3 * s), (hx - 9 * s, hy - 8 * s), 1.6 * s, 0.6 * s, ('6', '6', '6'))   # 奥の角
            jaw = Chain(B, Body(h['tilt'] + 11 * m, S(Hc)))
            if m:
                ell(cv, Hd, hx + 6 * s, hy + 3.6 * s, 6 * s, 1.6 * s + m * 0.6, ('8', '8', '8'))           # 口の中（炎の色）
                cap(cv, jaw, (hx + 1 * s, hy + 4.4 * s), (hx + 10 * s, hy + 5.4 * s), 2.2 * s, 1.4 * s, ('2', '3', '3'))
                for k in (3, 5.5, 8):
                    X, Y = jaw.T(hx + k * s, hy + 3.4 * s); cv.put(X, Y, '9')
            ell(cv, Hd, hx, hy, 6.2 * s, 5.2 * s, C)
            cap(cv, Hd, (hx + 2 * s, hy + 0.5 * s), (hx + 11 * s, hy + 2 * s), 4.2 * s, 2.6 * s, C)            # 鼻先
            if m:
                for k in (4, 6.5, 9):
                    X, Y = Hd.T(hx + k * s, hy + 3.6 * s); cv.put(X, Y, '9')
            else:
                for k in range(2, 12):
                    X, Y = Hd.T(hx + k * s, hy + 3.4 * s); cv.put(X, Y, '3')
            for (x, y, c) in ((11, 0, '7'), (10, 0, '7'), (2, -2.5, '4'), (3, -2.5, '4'), (4, -2.5, '4'),
                              (2.5, -1.5, '0'), (3.5, -1.5, '0'), (3.5, -0.5, '4')):
                X, Y = Hd.T(hx + x * s, hy + y * s); cv.put(X, Y, c)
            cap(cv, Hd, (hx - 2 * s, hy - 2 * s), (hx - 10 * s, hy - 6 * s), 1.9 * s, 0.7 * s, ('5', '5', '6'))  # 手前の角
            # 手前の翼（たたんで背中に）
            wing(cv, B, S((1, -27)), wth, 34 * s, 18 * s, 'bat', True, WCOL)
            paw = leg_(F_TOP, FL[fl], True, True)
            leg_(H_TOP, HL[hl], False, True)
            px, py = paw
            for k in (-1, 0, 1):
                cv.put(px + 3 * s + 1, py + k * 1.4, '9')
            return cv.outlined()
        # 首と頭
        nx, ny = h['nod']
        Hc = (HEAD[0] + nx, HEAD[1] + ny)
        cap(cv, B, S(NECK0), S((Hc[0] - 3, Hc[1] + 1)), 7.5 * s * bulk, 5.5 * s, C, body_pat)
        Hd = Chain(B, Body(h['tilt'], S(Hc)))
        hx, hy = S(Hc)
        m = h['mouth']
        # 奥の耳
        cap(cv, Hd, (hx - 1 * s, hy - 5 * s), (hx - 2 * s, hy - 9 * s), 2.2 * s, 1.0 * s, ('3', '3', '3'))
        # 頭（丸い頭・白い鼻先とほお）
        ell(cv, Hd, hx, hy, 7.5 * s, 6.5 * s, C, body_pat if stripe else None)
        ell(cv, Hd, hx - 1.5 * s, hy + 3.6 * s, 4.2 * s, 2.6 * s, ('5', '5', '6'))   # ほおの白い毛
        jaw = Chain(B, Body(h['tilt'] + 10 * m, S(Hc)))
        if m:
            ell(cv, Hd, hx + 5.5 * s, hy + 5.0 * s + m * 0.4, 4.4 * s, 1.6 * s + m * 0.5, ('8', '8', '8'))     # 口の中
        ell(cv, Hd, hx + 6.5 * s, hy + 1.8 * s, 4.0 * s, 2.8 * s, ('5', '5', '6'))       # 鼻先（上あご）
        if m:
            cap(cv, jaw, (hx + 1 * s, hy + 6.2 * s), (hx + 7.5 * s, hy + 6.6 * s), 1.8 * s, 1.3 * s, ('5', '6', '6'))  # 下あご
            for k in (8.0, 5.0):
                X, Y = Hd.T(hx + k * s, hy + 4.9 * s); cv.put(X, Y, '9')                # 上の牙
            X, Y = jaw.T(hx + 6.6 * s, hy + 5.0 * s); cv.put(X, Y, '9')                 # 下の牙
        else:
            for k in range(3, 9):
                X, Y = Hd.T(hx + k * s, hy + 4.2 * s); cv.put(X, Y, '6')
        # 鼻・目・手前の耳
        for (x, y, c) in ((10.2, 0.6, '7'), (10.2, -0.4, '7'), (9.2, -0.4, '7'),
                          (3.5, -2.5, '0'), (4.5, -2.5, '0'), (4.5, -1.5, '&'), (3.5, -1.5, '0')):
            X, Y = Hd.T(hx + x * s, hy + y * s); cv.put(X, Y, c)
        cap(cv, Hd, (hx - 3 * s, hy - 4 * s), (hx - 4 * s, hy - 9 * s), 2.4 * s, 1.0 * s, C)
        X, Y = Hd.T(hx - 3.6 * s, hy - 6 * s); cv.put(X, Y, '6')
        if stripe:
            for (x, y) in ((1, -5), (1, -4), (-1, -4), (-1, -3), (5, -4), (6, -4)):
                X, Y = Hd.T(hx + x * s, hy + y * s); cv.put(X, Y, '4')
        # 手前の脚
        paw = leg_(F_TOP, FL[fl], True, True)
        leg_(H_TOP, HL[hl], False, True)
        if h.get('claw'):
            px, py = paw
            for k in (-1, 0, 1):
                for i in (3, 4):
                    cv.put(px + i * s + 1, py + k * 1.4, '9')
        return cv.outlined()


def beast_frames(sp):
    f = {k: draw_beast(sp, k) for k in BEAST}
    f['idle'] = f['stand']
    return f


# ---------------- 猫（女）リコ ----------------
CAT_H = {
    'name': 'cat', 'arm': ('S', 's'), 'weapon': 'claw',
    'pal': {
        'K': '#5a2a10', 'H': '#e0883a', 'h': '#f6b468', 'n': '#f0a0a0',      # 橙の髪・猫の耳
        'S': '#f4cc9e', 's': '#d0946a', 'E': '#1e6a3a',                    # 緑の目
        'B': '#3a8a5a', 'b': '#22583a', 'L': '#6ab884',                    # 緑の胸あて
        'Y': '#c83a3a', 'y': '#7a2020',                                    # 赤い帯
        'P': '#7a5232', 'p': '#4a3020', 'Q': '#2e1e12',                    # 茶色の短いズボン・脚
        'W': '#e0883a', 'w': '#a85a22', 'V': '#7a3e16',                    # はだしの足（毛の色）
        'T': '#e0883a', 't': '#a85a22', 'M': '#ffffff',
    },
    'head': [
        "..K.....K....",
        ".KnK...KnK...",
        ".KHHKKKHHHK..",
        "KHHhHHHHHHhK.",
        "KHHHHHHHHHHK.",
        "KHHHHSSHHSSK.",
        "KHHHSSSSSES..",
        ".KHHSSSSSES..",
        "..KHsSSSSSSS.",
        "...KssSSSSs..",
        "....HsssSs...",
        ".......ss....",
    ],
    'torso': [
        "....sSSSSs..",
        "...bBBBBLBs.",
        "...bBBBBBLB.",
        "...bbBBBBBB.",
        "...bbBBBBBb.",
        "...SSsSSSSs.",
        "...yYYYYYYy.",
        "...SSsSSSSs.",
        "...ppPPPPPp.",
        "...ppPPPPPp.",
        "...ppPPPPpp.",
    ],
    'tail': {
        'hang': ([
            "..tt",
            ".tT.",
            "tT..",
            "tT..",
            "tT..",
            ".tT.",
            "..tT",
            "..tT",
            ".tT.",
        ], -9, -15),
        'flow': ([
            "......tt",
            "....ttT.",
            "..ttTT..",
            "ttTT....",
            "tT......",
        ], -15, -16),
    },
}
CAT_B = {
    'name': 'cat_b', 'scale': 0.8, 'bulk': 0.92, 'stripe': 7.5, 'belly': True, 'rings': False, 'dark_tip': False,
    'foot': MFOOT, 'cut': 2, 'cutx': -10,
    'pal': {
        '1': '#f6c070', '2': '#e08c3e', '3': '#a85a22', '&': '#5a2a10', '4': '#b8642a',
        '5': '#fff4e0', '6': '#d8c4a8', '7': '#7a3a3a', '8': '#a8283a', '9': '#ffffff', '0': '#70e070',
    },
}

# ---------------- 虎（男）ガロウ ----------------
TIGER_H = {
    'name': 'tiger', 'arm': ('S', 's'), 'weapon': 'claw',
    'pal': {
        'K': '#1a1210', 'H': '#d8782a', 'h': '#f0a050', 'n': '#f4e0c0',      # 黒の混じる橙の髪・丸い耳
        'S': '#e4b48a', 's': '#b0764e', 'E': '#c89a10',                    # 金の目
        'R': '#2a4a8a', 'r': '#18284a',                                    # 紺のはちまき
        'B': '#3a3a4a', 'b': '#22222e', 'L': '#5a5a6e',                    # 黒い袖なしの上着
        'Y': '#2a4a8a', 'y': '#18284a',                                    # 紺の帯
        'P': '#6a5a48', 'p': '#463a2c', 'Q': '#2a2218',
        'W': '#3a2a1c', 'w': '#22180e', 'V': '#140e08',
        'T': '#d8782a', 't': '#1a1210', 'M': '#ffffff',
    },
    'head': [
        "..KK...KK....",
        ".KnK..KnKK...",
        "KHHKHHKHHHK..",
        "KHKHHKHHHHhK.",
        "KRRRRRRRRRRK.",
        "KHHHHSSHHSSK.",
        ".KHHSSSSSES..",
        "KHHHSSSSSES..",
        ".KHKsSSSSSSS.",
        "..KHssSSSSs..",
        "...KssssSs...",
        ".....sssss...",
    ],
    'torso': [
        "...bSSSSSSs.",
        "..bBBSSSSBBb",
        "..bBBSSSSSBB",
        "..bBBBSSSSBB",
        "..bbBBSSSBBb",
        "...bBBSSSBBb",
        "...yYYYYYYYy",
        "...bbBBBBBbb",
        "...ppPPPPPp.",
        "...ppPPPPPp.",
        "...ppPPPPpp.",
    ],
    'tail': {
        'hang': ([
            "..TT",
            ".tT.",
            "TT..",
            "tT..",
            "TT..",
            ".tT.",
            "..TT",
            "..tt",
        ], -9, -15),
        'flow': ([
            ".......tT",
            ".....TTt.",
            "...tTT...",
            ".TTt.....",
            "tT.......",
        ], -16, -16),
    },
}
TIGER_B = {
    'name': 'tiger_b', 'scale': 1.0, 'bulk': 1.08, 'stripe': 6.0, 'belly': True, 'rings': True, 'dark_tip': True,
    'foot': MFOOT, 'cut': 6, 'cutx': -6,
    'pal': {
        '1': '#f8b050', '2': '#e07a22', '3': '#9a4612', '&': '#4a200a', '4': '#1e120c',
        '5': '#fff8ec', '6': '#d4c4b0', '7': '#3a2420', '8': '#a8283a', '9': '#ffffff', '0': '#f0d030',
    },
}


def human_frames(ch, upright=False):
    # 素手の構え：腰を落とし、こぶしを前に出して爪を立てる。攻撃は踏み込んで爪で引っかく
    rh = (8, -17)
    return {
        # 待機：猫は腰を落とした低い構え。虎は剣士と同じ背の高さになるよう、立って構える
        'idle':  (frame(ch, 'stand', (9, -21), None, lean=1, back=(5, -23)) if upright
                  else frame(ch, 'low', (9, -21), None, lean=1, hy=1, back=(5, -23))),
        'run1':  frame(ch, 'run1', rh, None, lean=3, hy=1, back=(-6, -15), hair='flow'),
        'run2':  frame(ch, 'run2', rh, None, lean=3, hy=1, back=(-3, -14), hair='flow'),
        'run3':  frame(ch, 'run3', rh, None, lean=3, hy=1, back=(2, -15), hair='flow'),
        'run4':  frame(ch, 'run4', rh, None, lean=3, hy=1, back=(-3, -14), hair='flow'),
        'raise': frame(ch, 'crouch', (4, -31), -60, lean=-1, back=(-5, -18)),
        'swing': frame(ch, 'lunge', (15, -16), 40, lean=4, back=(-6, -17), hair='flow'),
        'hurt':  frame(ch, 'back', (6, -18), None, lean=-3, back=(-5, -15), hair='flow'),
        'dodge': frame(ch, 'back', (4, -22), None, lean=-5, back=(-6, -18), hair='flow'),
        'crouch': frame(ch, 'crouch', (6, -19), None, lean=2, back=(3, -18)),
    }


for _k, _v in WING_ANG.items():
    BEAST[_k]['wing'] = _v

# ---------------- 赤竜（男）ドルガ ----------------
DRAGON_H = {
    'name': 'rdragon', 'arm': ('S', 's'), 'weapon': 'claw',
    'pal': {
        'K': '#3a0c0c', 'H': '#b02a22', 'h': '#e05a3a', 'n': '#f0d090',      # 赤い髪・小さな角
        'S': '#e8b48a', 's': '#b4764e', 'E': '#c89a10',                    # 金の目
        'B': '#5a1c1c', 'b': '#34100e', 'L': '#8a3028',                    # 赤黒い上着
        'T': '#c8a040', 't': '#7a5a1c',                                    # 金の肩当て
        'Y': '#c8a040', 'y': '#7a5a1c',
        'P': '#3a2a2a', 'p': '#221818', 'Q': '#140e0e',
        'W': '#4a2a1c', 'w': '#2a1810', 'V': '#140c08', 'M': '#ffffff',
    },
    'head': [
        "..n......n...",
        "..KnKKKKnK...",
        ".KHHhHHHHHK..",
        "KHHHHHHHHHhK.",
        "KHHHHHHHHHHK.",
        "KHHHHSSHHSSK.",
        "KHHHSSSSSES..",
        "KHHHSSSSSES..",
        ".KHKsSSSSSSS.",
        ".KHKssSSSSs..",
        "..KKssssSs...",
        ".....sssss...",
    ],
    'torso': [
        "...bBBBTTTt.",
        "..bbBBTTTTTt",
        "..bBBBBtTTTt",
        "..bBBLBBBBBB",
        "..bbBLBBBBBB",
        "...bBLBBBBBb",
        "...yYYYYYYYy",
        "...bbBBBBBbb",
        "...ppPPPPPp.",
        "...ppPPPPPp.",
        "...ppPPPPpp.",
    ],
}
DRAGON_B = {
    'name': 'rdragon_b', 'scale': 1.28, 'bulk': 1.12, 'stripe': None, 'belly': True, 'rings': False, 'dark_tip': False, 'dragon': True,
    'canvas': (190, 124, (92, 119)), 'foot': (92, 119), 'cut': 47, 'cutx': 0,
    'pal': {
        '1': '#ec6a4a', '2': '#c0362a', '3': '#7a1a18', '&': '#4a0e0e', '4': '#2e0c0a',
        '5': '#f0cc80', '6': '#b8924a', '7': '#1e0606', '8': '#ffa040', '9': '#ffffff', '0': '#ffe040',
    },
}

FRAMES = {
    'cat': (CAT_H, human_frames(CAT_H)),
    'cat_b': (CAT_B, beast_frames(CAT_B)),
    'tiger': (TIGER_H, human_frames(TIGER_H, upright=True)),
    'tiger_b': (TIGER_B, beast_frames(TIGER_B)),
    'rdragon': (DRAGON_H, human_frames(DRAGON_H, upright=True)),
    'rdragon_b': (DRAGON_B, beast_frames(DRAGON_B)),
}


# ---------------- 赤竜（二足で立つ） ----------------
# 胴を後脚の付け根（腰）まわりに起こして立たせる。後脚・しっぽは地面の座標、前脚（腕）は肩からのずれで与える
#   ang: 胴の起こし方（マイナスで起きる）、lean: 前かがみの量（ang に足す）、legs: (手前の脚, 奥の脚)、arms: (手前の腕, 奥の腕)
BIPED_LEG = {   # 腰からのずれ: ひざ → かかと → つま先
    'stand':  [(6, 9), (0, 18), (5, 22)],
    'stand2': [(3, 9), (-4, 18), (1, 22)],
    'step':   [(11, 7), (8, 16), (13, 22)],         # 前へ踏み出す
    'back':   [(1, 10), (-9, 16), (-5, 22)],        # 後ろでける
    'lift':   [(10, 5), (8, 12), (12, 15)],         # ひざを上げる
    'crouch': [(10, 7), (2, 13), (7, 17)],
    'crouch2': [(7, 7), (-2, 13), (3, 17)],
    'brace':  [(14, 10), (14, 18), (19, 22)],       # 前へつっぱる
}
BIPED_ARM = {   # 肩からのずれ: ひじ → 手首 → 爪の先
    'rest':   [(4, 7), (10, 6), (13, 4)],
    'rest2':  [(3, 7), (8, 7), (11, 6)],
    'raise':  [(3, -7), (6, -14), (8, -18)],         # 振りかぶる
    'rake':   [(9, 4), (15, 9), (18, 12)],          # 振り下ろす
    'spread': [(2, 6), (-2, 11), (-4, 13)],         # 広げる（ほえる）
    'reach':  [(8, -1), (15, -2), (19, -3)],         # 前へのばす
}
BIPED_TAIL = {  # 腰からのずれ（地面にそって後ろへ）
    'ground': [(-6, 2), (-16, 10), (-28, 16), (-40, 19), (-50, 19)],
    'swing':  [(-6, 1), (-17, 6), (-29, 8), (-40, 6), (-48, 2)],
    'up':     [(-6, 1), (-16, 4), (-26, 2), (-34, -4), (-38, -11)],
}
BIPED = {
    'stand':  dict(ang=-58, hip=(-4, -22), legs=('stand', 'stand2'), arms=('rest', 'rest2'), tail='ground', nod=(0, 0), tilt=60, mouth=0, wing=40),
    'run1':   dict(ang=-50, hip=(-4, -22), legs=('step', 'back'), arms=('rest', 'rest2'), tail='swing', nod=(1, 0), tilt=52, mouth=0, wing=44),
    'run2':   dict(ang=-52, hip=(-4, -24), legs=('lift', 'stand2'), arms=('rest2', 'rest'), tail='ground', nod=(1, 0), tilt=54, mouth=0, wing=40),
    'run3':   dict(ang=-50, hip=(-4, -22), legs=('back', 'step'), arms=('rest2', 'rest'), tail='swing', nod=(1, 0), tilt=52, mouth=0, wing=44),
    'run4':   dict(ang=-52, hip=(-4, -24), legs=('stand2', 'lift'), arms=('rest', 'rest2'), tail='ground', nod=(1, 0), tilt=54, mouth=0, wing=40),
    'crouch': dict(ang=-40, hip=(-4, -17), legs=('crouch', 'crouch2'), arms=('rest', 'rest2'), tail='ground', nod=(2, 2), tilt=48, mouth=1, wing=36),
    'pounce': dict(ang=-34, hip=(0, -22), legs=('brace', 'back'), arms=('reach', 'rest'), tail='swing', nod=(2, 0), tilt=40, mouth=2, wing=60, claw=True),
    'swipe':  dict(ang=-66, hip=(-4, -23), legs=('stand', 'back'), arms=('raise', 'rest2'), tail='up', nod=(0, -1), tilt=62, mouth=2, wing=66, claw=True),
    'rake':   dict(ang=-42, hip=(-2, -22), legs=('brace', 'back'), arms=('rake', 'rest2'), tail='swing', nod=(2, 1), tilt=46, mouth=2, wing=50, claw=True),
    'bite':   dict(ang=-40, hip=(-2, -22), legs=('brace', 'stand2'), arms=('rest', 'rest2'), tail='ground', nod=(3, 1), tilt=42, mouth=2, wing=48),
    'hurt':   dict(ang=-70, hip=(-6, -22), legs=('stand', 'back'), arms=('spread', 'rest2'), tail='ground', nod=(-2, -2), tilt=62, mouth=1, wing=58),
    'dodge':  dict(ang=-62, hip=(-8, -25), legs=('lift', 'back'), arms=('rest', 'rest2'), tail='swing', nod=(-1, -1), tilt=60, mouth=0, wing=70),
    'roar':   dict(ang=-72, hip=(-4, -22), legs=('stand', 'stand2'), arms=('spread', 'spread'), tail='up', nod=(0, -2), tilt=52, mouth=2, wing=78),
}


def draw_biped(sp, pose):
    s, bulk = sp['scale'], sp['bulk']
    h = BIPED[pose]
    with Area(*sp['canvas']):
        cv = fighter.Canvas()

        def S(p):
            return (p[0] * s, p[1] * s)
        hx0, hy0 = S(h['hip'])
        # 腰（H_TOP）が地面の座標 hip に来るように、胴を腰まわりに起こす
        B = Body(h['ang'], S(H_TOP), hx0 - H_TOP[0] * s, hy0 - H_TOP[1] * s)
        C = ('1', '2', '3')
        CF = ('3', '3', '&')
        WCOL = ('2', '3', '&', '4', '4')
        I = Body()

        def body_pat(x, y, v, base):
            if v > 0.5:
                return '6' if ((x / s + 100) % 4) < 0.9 else '5'
            return base

        def limb(base, offs, rs, near, foot):
            pts = [base] + [(base[0] + o[0] * s, base[1] + o[1] * s) for o in offs]
            cols = C if near else CF
            for i in range(3):
                cap(cv, I, pts[i], pts[i + 1], rs[i] * s * bulk, rs[i + 1] * s * bulk, cols)
            px, py = pts[3]
            if foot:
                ell(cv, I, px + 1.5 * s, py - 1.2 * s, 3.6 * s, 1.8 * s, cols)
                for k in (3.5, 5):
                    cv.put(px + k * s, py, '9')
            return pts[3]
        hip = (hx0, hy0)
        sh = B.T(*S(F_TOP))
        # 奥の翼・奥の腕・奥の脚
        wing(cv, B, S((2, -27)), h['wing'] + 6, 34 * s, 18 * s, 'bat', False, WCOL)
        limb((sh[0] - 2, sh[1]), BIPED_ARM[h['arms'][1]], [3.2, 2.4, 1.8, 1.2], False, False)
        limb((hip[0] - 2, hip[1]), BIPED_LEG[h['legs'][1]], [6.0, 3.6, 2.8, 2.2], False, True)
        # しっぽ（地面にそって後ろへ）
        tp = [hip] + [(hip[0] + o[0] * s, hip[1] + o[1] * s) for o in BIPED_TAIL[h['tail']]]
        rs = [6.0, 5.0, 4.0, 3.0, 2.0, 1.0]
        for i in range(len(tp) - 1):
            cap(cv, I, tp[i], tp[i + 1], rs[i] * s, rs[i + 1] * s, C)
            (x0, y0), (x1, y1) = tp[i], tp[i + 1]
            if i >= 1:
                for f in (0.3, 0.8):
                    bx, by = x0 + (x1 - x0) * f, y0 + (y1 - y0) * f
                    r = (rs[i] + (rs[i + 1] - rs[i]) * f) * s
                    cap(cv, I, (bx, by - r + 0.5), (bx - 1.5 * s, by - r - 2.5 * s), 1.2 * s, 0.4, ('4', '4', '4'))
        # 胴（起こした胴：しり・腹・胸）
        ell(cv, B, -14 * s, -20 * s, 8.5 * s * bulk, 7.5 * s * bulk, C, body_pat)
        ell(cv, B, -2 * s, -19.5 * s, 13 * s, 6.8 * s * bulk, C, body_pat)
        ell(cv, B, 10 * s, -21 * s, 8 * s * bulk, 8.5 * s * bulk, C, body_pat)
        for x in range(-22, 14, 4):        # 背中のとげ
            top = -20 - (7.5 if x < -8 else 7.2 if x < 4 else 8.5) * bulk
            cap(cv, B, S((x, top + 1)), S((x - 1.5, top - 2.5)), 1.5 * s, 0.5, ('4', '4', '4'))
        # 首と頭
        nx, ny = h['nod']
        Hc = (DHEAD[0] + nx, DHEAD[1] + ny)
        cap(cv, B, S(NECK0), S((Hc[0] - 3, Hc[1] + 1)), 7.5 * s * bulk, 4.8 * s, C, body_pat)
        Hd = Chain(B, Body(h['tilt'], S(Hc)))
        hx, hy = S(Hc)
        m = h['mouth']
        cap(cv, Hd, (hx - 2 * s, hy - 3 * s), (hx - 9 * s, hy - 8 * s), 1.6 * s, 0.6 * s, ('6', '6', '6'))
        jaw = Chain(B, Body(h['tilt'] + 11 * m, S(Hc)))
        if m:
            ell(cv, Hd, hx + 6 * s, hy + 3.6 * s, 6 * s, 1.6 * s + m * 0.6, ('8', '8', '8'))
            cap(cv, jaw, (hx + 1 * s, hy + 4.4 * s), (hx + 10 * s, hy + 5.4 * s), 2.2 * s, 1.4 * s, ('2', '3', '3'))
            for k in (3, 5.5, 8):
                X, Y = jaw.T(hx + k * s, hy + 3.4 * s); cv.put(X, Y, '9')
        ell(cv, Hd, hx, hy, 6.2 * s, 5.2 * s, C)
        cap(cv, Hd, (hx + 2 * s, hy + 0.5 * s), (hx + 11 * s, hy + 2 * s), 4.2 * s, 2.6 * s, C)
        if m:
            for k in (4, 6.5, 9):
                X, Y = Hd.T(hx + k * s, hy + 3.6 * s); cv.put(X, Y, '9')
        else:
            for k in range(2, 12):
                X, Y = Hd.T(hx + k * s, hy + 3.4 * s); cv.put(X, Y, '3')
        for (x, y, c) in ((11, 0, '7'), (10, 0, '7'), (2, -2.5, '4'), (3, -2.5, '4'), (4, -2.5, '4'),
                          (2.5, -1.5, '0'), (3.5, -1.5, '0'), (3.5, -0.5, '4')):
            X, Y = Hd.T(hx + x * s, hy + y * s); cv.put(X, Y, c)
        cap(cv, Hd, (hx - 2 * s, hy - 2 * s), (hx - 10 * s, hy - 6 * s), 1.9 * s, 0.7 * s, ('5', '5', '6'))
        # 手前の翼・手前の脚・手前の腕
        wing(cv, B, S((1, -27)), h['wing'], 34 * s, 18 * s, 'bat', True, WCOL)
        limb(hip, BIPED_LEG[h['legs'][0]], [6.5, 4.0, 3.0, 2.4], True, True)
        claw = limb(sh, BIPED_ARM[h['arms'][0]], [3.6, 2.6, 2.0, 1.4], True, False)
        px, py = claw
        for k in (-1, 0, 1):
            cv.put(px + 1, py + k * 1.3, '9')
            if h.get('claw'):
                cv.put(px + 2, py + k * 1.3, '9')
        return cv.outlined()


def biped_frames(sp):
    f = {k: draw_biped(sp, k) for k in BIPED}
    f['idle'] = f['stand']
    return f


DRAGON_B.update({'biped': True, 'scale': 1.05, 'bulk': 1.12})
FRAMES['rdragon_b'] = (DRAGON_B, biped_frames(DRAGON_B))

# ---------------- 2026-11-23 男女共通にするため追加 ----------------
# 猫（男）ノワ：黒に近い灰色の髪・猫の耳・青いベスト（前を開けた）・紺の帯。化身は灰色のしま猫
CAT_M = dict(CAT_H, name='cat_m',
    pal=dict(CAT_H['pal'], K='#14141e', H='#4a4a5e', h='#7a7a92', n='#d8a0b0', E='#c8a010',
             B='#3a5a9a', b='#22386a', L='#6a8ad0', Y='#2a2a5a', y='#14143a',
             W='#4a4a5e', w='#2a2a3a', V='#14141e', T='#4a4a5e', t='#22222e'),
    head=[
        "..K.....K....",
        ".KnK...KnK...",
        ".KHHKKKHHHK..",
        "KHHhHHHHHHhK.",
        "KHHHHHHHHHHK.",
        "KHHHHSSHHSSK.",
        ".KHHSSSSSES..",
        "..KHSSSSSES..",
        "...KsSSSSSSS.",
        "....ssSSSSs..",
        ".....sssSs...",
        ".......ss....",
    ],
    torso=[
        "...bBSSSSBb.",
        "...bBSSSSBB.",
        "...bBBSSSBB.",
        "...bBBSSSBB.",
        "...bbBSSSBb.",
        "...bbBSSBBb.",
        "...yYYYYYYy.",
        "...bbBBBBBb.",
        "...ppPPPPPp.",
        "...ppPPPPPp.",
        "...ppPPPPpp.",
    ])
CAT_MB = dict(CAT_B, name='cat_mb', scale=0.84, bulk=0.96,
    pal={'1': '#a8a8bc', '2': '#7a7a90', '3': '#4a4a5e', '&': '#1e1e2a', '4': '#3a3a4c',
         '5': '#e8e8f0', '6': '#b8b8c8', '7': '#5a3a4a', '8': '#a8283a', '9': '#ffffff', '0': '#f0d030'})

# 虎（女）ヤエ：黒の混じる橙の長い髪・丸い耳・紺のはちまき・黒い胸あてと帯。化身は男と同じ虎（少し細身）
TIGER_F = dict(TIGER_H, name='tiger_f', thin=True,
    pal=dict(TIGER_H['pal'], S='#f0c49a', s='#c88a60', R='#2a4a8a', r='#18284a'),
    head=[
        "..KK....KK...",
        ".KnK...KnK...",
        ".KHHKKKHHHK..",
        "KHHKHHHKHHhK.",
        "KRRRRRRRRRRK.",
        "KHHHHSHHHSSK.",
        "KHHHSSSSSKS..",
        "KHKHSSSSSES..",
        "KHHHSSSSSES..",
        "KHKHsSSSSSS..",
        ".KHHKssSSRs..",
        "..KK...sss...",
    ],
    torso=[
        "....sSSSSs..",
        "...bBBBBLBs.",
        "...bBBBBBLB.",
        "...bbBBBBBB.",
        "...bbBBBBBb.",
        "...SSsSSSSs.",
        "...yYYYYYYy.",
        "...SSsSSSSs.",
        "...ppPPPPPp.",
        "...ppPPPPPp.",
        "...ppPPPPpp.",
    ])
TIGER_FB = dict(TIGER_B, name='tiger_fb', scale=0.95, bulk=1.0)

FRAMES['cat_m'] = (CAT_M, human_frames(CAT_M))
FRAMES['cat_mb'] = (CAT_MB, beast_frames(CAT_MB))
FRAMES['tiger_f'] = (TIGER_F, human_frames(TIGER_F, upright=True))
FRAMES['tiger_fb'] = (TIGER_FB, beast_frames(TIGER_FB))

# 赤竜（女）カリナ：深紅の長い髪・小さな角・赤黒い服に金の肩当て。化身は男と同じ二足の赤竜
DRAGON_HF = dict(DRAGON_H, name='rdragon_f', thin=True,
    pal=dict(DRAGON_H['pal'], H='#a0202e', h='#d8485a', S='#f0c49a', s='#c88a60', R='#d84a6a'),
    head=[
        "..n......n...",
        "..KnKKKKnK...",
        ".KHHhHHHHHK..",
        "KHHHHHHHHHhK.",
        "KHHHHHHHHHHK.",
        "KHHHHSHHHSSK.",
        "KHHHSSSSSKS..",
        "KHHHSSSSSES..",
        "KHHHSSSSSES..",
        "KHHHsSSSSSS..",
        "KHHKKssSSRs..",
        ".KKK...sss...",
    ],
    torso=[
        "....bBTTTt..",
        "...bBBTTTTt.",
        "...bBBBtTTt.",
        "...bbBBBBBB.",
        "...bbBBBBBb.",
        "...bbBBBBBb.",
        "...yYYYYYYy.",
        "...bbBBBBBbb",
        "...ppPPPPPp.",
        "...ppPPPPPp.",
        "...ppPPPPpp.",
    ])
FRAMES['rdragon_f'] = (DRAGON_HF, human_frames(DRAGON_HF, upright=True))
