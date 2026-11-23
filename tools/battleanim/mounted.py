# 騎馬（馬の土台＋乗り手）。1文字＝1ドット、右向き
#   馬は胴・首・頭・脚を「形（楕円・先細りの棒）」の組み合わせで描き、ポーズごとに関節の位置だけを変える
#   （どのコマでも馬の大きさ・頭の形・脚の長さが同じになる）。
#   乗り手は歩兵と同じ頭・胴の手描きと武器の関数を使い、鞍の上に座らせる。
#   馬の色は数字の文字（1〜9,0）なので、乗り手の色と混ざらない。
import math
import fighter
from fighter import Canvas, Ray, snap, leg, back_arm, WEAPONS

MW, MH = 150, 112
MFOOT = (66, 107)          # マスの中の足元（馬の前脚と後脚のあいだの地面）


class Mounted:
    """このブロックの中だけ、マスを騎馬用の大きさにする"""
    def __enter__(self):
        self.save = (fighter.W, fighter.H, fighter.FOOT)
        fighter.W, fighter.H, fighter.FOOT = MW, MH, MFOOT

    def __exit__(self, *a):
        fighter.W, fighter.H, fighter.FOOT = self.save


# ---------------- 形（馬の部品） ----------------
def _rot(x, y, c, s):
    return x * c - y * s, x * s + y * c


class Body:
    """馬の胴まわりの座標変換：ふつうの姿勢で描いた点を、pivot まわりに回して dy だけ上下させる"""
    def __init__(self, ang=0, pivot=(0, 0), dx=0, dy=0):
        self.c, self.s = math.cos(math.radians(ang)), math.sin(math.radians(ang))
        self.p, self.dx, self.dy = pivot, dx, dy

    def T(self, x, y):
        X, Y = _rot(x - self.p[0], y - self.p[1], self.c, self.s)
        return X + self.p[0] + self.dx, Y + self.p[1] + self.dy

    def inv(self, X, Y):
        x, y = _rot(X - self.p[0] - self.dx, Y - self.p[1] - self.dy, self.c, -self.s)
        return x + self.p[0], y + self.p[1]


def shade3(v, light, mid, dark, lo=-0.45, hi=0.55):
    return light if v < lo else (dark if v > hi else mid)


def fill_shape(cv, B, bbox, inside, color):
    """ふつうの姿勢の座標で inside(x,y) が真の所を、回した後のマスに塗る（すき間ができないよう、マス側から逆にたどる）"""
    xs, ys = [], []
    for (x, y) in ((bbox[0], bbox[1]), (bbox[2], bbox[1]), (bbox[0], bbox[3]), (bbox[2], bbox[3])):
        X, Y = B.T(x, y); xs.append(X); ys.append(Y)
    for Y in range(int(math.floor(min(ys))) - 1, int(math.ceil(max(ys))) + 2):
        for X in range(int(math.floor(min(xs))) - 1, int(math.ceil(max(xs))) + 2):
            x, y = B.inv(X, Y)
            if inside(x, y):
                c = color(x, y)
                if c:
                    cv.put(X, Y, c)


def ellipse(cv, B, cx, cy, rx, ry, cols):
    L, M, D = cols
    fill_shape(cv, B, (cx - rx, cy - ry, cx + rx, cy + ry),
               lambda x, y: ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0,
               lambda x, y: shade3((y - cy) / ry, L, M, D))


def capsule(cv, B, p0, p1, r0, r1, cols, hi=0.5):
    """先細りの棒（p0 で太さ r0、p1 で r1）。上側が明るく、下側が暗い"""
    L, M, D = cols
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    l2 = dx * dx + dy * dy or 1
    R = max(r0, r1)

    def f(x, y):
        t = max(0.0, min(1.0, ((x - x0) * dx + (y - y0) * dy) / l2))
        px, py = x0 + dx * t, y0 + dy * t
        r = r0 + (r1 - r0) * t
        return (x - px) ** 2 + (y - py) ** 2 <= r * r, (y - py) / max(r, 0.5), (x - px) / max(r, 0.5)

    fill_shape(cv, B, (min(x0, x1) - R, min(y0, y1) - R, max(x0, x1) + R, max(y0, y1) + R),
               lambda x, y: f(x, y)[0],
               lambda x, y: shade3(f(x, y)[1] if abs(dy) < abs(dx) else -f(x, y)[2], L, M, D, -0.5, hi))


def wpoly(cv, pts, rs, cols, B=None):
    """関節の列（ワールド座標）を先細りの棒でつなぐ"""
    I = Body()
    for i in range(len(pts) - 1):
        capsule(cv, I, pts[i], pts[i + 1], rs[i], rs[i + 1], cols)


# ---------------- 馬のポーズ ----------------
# 脚の関節（ふつうの姿勢の座標）。前脚: 付け根→ひざ→球節→ひづめ、後脚: 付け根→飛節→球節→ひづめ
FRONT_TOP, HIND_TOP = (10, -21), (-11, -22)
FL = {
    'stand':   [(11, -11), (11, -4), (12, 0)],
    'stand2':  [(8, -11), (8, -4), (9, 0)],
    'reach':   [(18, -14), (23, -8), (25, -6)],
    'reach2':  [(16, -13), (21, -9), (23, -7)],
    'support': [(9, -11), (8, -4), (8, 0)],
    'push':    [(6, -12), (2, -5), (0, -3)],
    'fold':    [(16, -14), (12, -9), (10, -10)],
    'fold2':   [(14, -13), (10, -9), (8, -9)],
    'brace':   [(15, -12), (18, -5), (19, -1)],
    'brace2':  [(13, -12), (15, -5), (16, -1)],
    'paw':     [(17, -17), (14, -11), (16, -9)],      # 棹立ちで前脚を折って宙をかく
    'paw2':    [(15, -15), (11, -10), (12, -8)],
}
HL = {
    'stand':   [(-14, -11), (-12, -4), (-12, 0)],
    'stand2':  [(-11, -11), (-9, -4), (-9, 0)],
    'under':   [(-9, -12), (-5, -5), (-4, -2)],
    'under2':  [(-10, -12), (-7, -5), (-6, -2)],
    'support': [(-13, -11), (-11, -4), (-11, 0)],
    'back':    [(-18, -13), (-22, -8), (-24, -6)],
    'back2':   [(-17, -13), (-21, -9), (-23, -7)],
    'fold':    [(-8, -13), (-11, -8), (-13, -7)],
    'fold2':   [(-9, -13), (-12, -8), (-14, -7)],
}
# 馬のポーズ: 胴の傾き(度・マイナスで前が上がる)、回す中心、上下、首から先のずれ、脚（手前前・奥前・手前後・奥後）、しっぽ
# rear は後脚をマスの座標（回さない）で与える
HORSE = {
    'stand': dict(ang=0, dy=0, nod=(0, 0), legs=('stand', 'stand2', 'stand', 'stand2'), tail='hang'),
    # 駆け足（ギャロップ）：後脚で着地 → 前脚で着地 → けり出し → 4本をまとめて宙に浮く
    'g1': dict(ang=-3, dy=0, nod=(0, -1), legs=('reach', 'reach2', 'under', 'support'), tail='flow'),
    'g2': dict(ang=0, dy=0, nod=(1, 0), legs=('support', 'reach2', 'back2', 'under2'), tail='flow'),
    'g3': dict(ang=3, dy=-1, nod=(1, 1), legs=('push', 'support', 'back', 'back2'), tail='flow'),
    'g4': dict(ang=0, dy=-3, nod=(0, 0), legs=('fold', 'fold2', 'fold', 'fold2'), tail='flow'),
    # 踏み込み（前脚を前につっぱって止まる）
    'brace': dict(ang=-4, dy=0, nod=(1, -1), legs=('brace', 'brace2', 'under', 'under2'), tail='flow'),
    # ため（後脚を体の下に入れて腰を沈める）
    'gather': dict(ang=4, dy=1, nod=(1, 2), legs=('support', 'stand2', 'under', 'under2'), tail='hang'),
    # のけぞる（被弾・回避）：前が少し浮く
    'shy': dict(ang=-12, dy=0, pivot=(-12, -2), nod=(-2, -2), legs=('fold2', 'brace2', 'under', 'support'), tail='flow'),
    # 棹立ち（前脚を高く上げていななく）
    'rear': dict(ang=-34, dy=0, pivot=(-12, -2), nod=(-1, -2), legs=('paw', 'paw2', None, None), tail='flow',
                 hind_world=([(-13, -12), (-9, -5), (-8, 0)], [(-16, -11), (-12, -4), (-12, 0)])),
}
ROLE = {'L': '1', 'M': '2', 'D': '3', 'X': '&'}   # 馬の明るい面・中間・暗い面・奥の脚の影
# 首と頭（ふつうの姿勢）
NECK = ((10, -28), (18, -41))
SADDLE = (-1, -32)       # 乗り手の腰の位置
BIT = (26, -38)          # はみ（手綱の先）


def _leg(cv, B, top, joints, front, near, P, world=False):
    pts = [B.T(*top)] + [(j if world else B.T(*j)) for j in joints]
    if near:
        cols = (P['L'], P['M'], P['D'])
    else:
        cols = (P['D'], P['D'], P['X'])
    rs = [2.6, 1.6, 1.2, 1.4] if front else [3.2, 1.7, 1.2, 1.4]
    for i in range(3):
        capsule(cv, Body(), pts[i], pts[i + 1], rs[i], rs[i + 1], cols)
    # ひづめ（球節からひづめまでの下側）
    hx, hy = pts[3]
    fx, fy = pts[2]
    capsule(cv, Body(), ((hx * 2 + fx) / 3, (hy * 2 + fy) / 3), (hx, hy), 1.5, 1.5, ('6', '6', '6'))


def draw_horse_back(cv, pose, P):
    """馬の奥側（しっぽ・奥の脚）"""
    h = HORSE[pose]
    B = Body(h['ang'], h.get('pivot', (0, 0)), 0, h['dy'])
    hw = h.get('hind_world')
    # しっぽ
    tc = ('5', '4', '4')
    if h['tail'] == 'hang':
        capsule(cv, B, (-18, -31), (-22, -24), 1.8, 2.4, tc)
        capsule(cv, B, (-22, -24), (-22, -14), 2.4, 1.6, tc)
    else:
        capsule(cv, B, (-18, -31), (-25, -28), 1.8, 2.4, tc)
        capsule(cv, B, (-25, -28), (-31, -23), 2.4, 1.4, tc)
    _, f2, _, h2 = h['legs']
    _leg(cv, B, FRONT_TOP, FL[f2], True, False, P)
    if hw:
        _leg(cv, B, HIND_TOP, hw[1], False, False, P, world=True)
    else:
        _leg(cv, B, (HIND_TOP[0] + 2, HIND_TOP[1]), HL[h2], False, False, P)
    return B


def draw_horse_front(cv, pose, P, B):
    h = HORSE[pose]
    nx, ny = h['nod']
    C = (P['L'], P['M'], P['D'])
    hw = h.get('hind_world')
    f1, _, h1, _ = h['legs']
    # 胴（しり・腹・胸）と首
    ellipse(cv, B, -12, -27, 8, 7.5, C)
    ellipse(cv, B, 0, -26, 13, 6.5, C)
    ellipse(cv, B, 10, -26, 6.5, 7, C)
    n0, n1 = NECK
    capsule(cv, B, n0, (n1[0] + nx, n1[1] + ny), 5.5, 3.6, C)
    # 頭：額から鼻先へ斜め下に。ほおの丸み
    hx, hy = 18 + nx, -43 + ny
    capsule(cv, B, (hx, hy), (hx + 8, hy + 7), 3.4, 2.2, C, hi=0.3)
    ellipse(cv, B, hx + 1, hy + 3, 3.4, 3, C)
    # 鼻先は少し暗く、鼻の穴と目
    fill_shape(cv, B, (hx + 7, hy + 4, hx + 11, hy + 10),
               lambda x, y: (x - hx - 8) ** 2 + (y - hy - 7) ** 2 <= 4.6, lambda x, y: P['D'] if y > hy + 6 else None)
    for (x, y, c) in ((hx + 8, hy + 6, '&'), (hx + 2, hy, '&'), (hx + 2, hy - 1, '&'), (hx + 3, hy - 1, P['L'])):
        X, Y = B.T(x, y); cv.put(X, Y, c)
    # 耳
    capsule(cv, B, (hx - 1, hy - 3), (hx - 1, hy - 6), 1.3, 0.7, C)
    # たてがみ：首の上側に沿って、前髪まで
    for i in range(8):
        t = i / 7
        x = n0[0] - 4 + (n1[0] + nx - 3 - (n0[0] - 4)) * t
        y = n0[1] - 3 + (n1[1] + ny - 2 - (n0[1] - 3)) * t
        capsule(cv, B, (x, y), (x - 2.5, y + 1.5), 1.6, 1.0, ('5', '4', '4'))
    capsule(cv, B, (hx, hy - 3), (hx + 2, hy - 1), 1.3, 0.8, ('5', '4', '4'))
    # 頭絡（革ひも）
    for (x, y) in ((hx + 1, hy - 2), (hx + 1, hy - 1), (hx + 1, hy + 1), (hx + 2, hy + 2), (hx + 3, hy + 3),
                   (hx + 5, hy + 4), (hx + 6, hy + 4), (hx + 7, hy + 4)):
        X, Y = B.T(x, y); cv.put(X, Y, '9')
    X, Y = B.T(hx + 7, hy + 6); cv.put(X, Y, '0')
    # 手前の脚
    _leg(cv, B, FRONT_TOP, FL[f1], True, True, P)
    if hw:
        _leg(cv, B, HIND_TOP, hw[0], False, True, P, world=True)
    else:
        _leg(cv, B, HIND_TOP, HL[h1], False, True, P)
    # 鞍の下の布（馬着）と鞍
    def cloth_bot(x):
        return -20 if -7 <= x <= 4 else -22
    fill_shape(cv, B, (-9, -33, 6, -19),
               lambda x, y: -9 <= x <= 6 and -32 <= y <= cloth_bot(x),
               lambda x, y: '8' if y > cloth_bot(x) - 1.2 else '7')
    for x in range(-9, 7):
        X, Y = B.T(x, -33); cv.put(X, Y, '7')
    for x in range(-7, 5):                      # 鞍
        X, Y = B.T(x, -34); cv.put(X, Y, '9')
    for (x, y) in ((-7, -35), (-8, -36), (-8, -35), (4, -35), (5, -36)):
        X, Y = B.T(x, y); cv.put(X, Y, '9')
    # 胸がい
    for i in range(6):
        X, Y = B.T(6 + i, -29 + i // 2); cv.put(X, Y, '9')


# ---------------- 乗り手 ----------------
def mframe(ch, pose, hand, ang, lean=0, hy=0, back=None, arm_behind=False, reins=True, leg_pose='ride', rider_dx=0, pull=None, wing=None):
    """騎馬の1コマ。pose: 馬のポーズ。hand: 武器を持つ手（乗り手の腰からの位置）。back: 奥の手（None なら手綱を持つ）"""
    with Mounted():
        cv = Canvas()
        P = ROLE
        h = ch.get('poses', HORSE)[pose]
        B = ch.get('mount_back', draw_horse_back)(cv, pose, P)
        if wing is not None:
            ch['wing_fn'](cv, B, wing, False)          # 奥の翼
        sxw, syw = B.T(*ch.get('saddle', SADDLE))
        ox, oy = int(round(sxw)) + rider_dx, int(round(syw)) + 13     # 乗り手の座標 → マスの座標（腰が鞍の上）
        bit = ch.get('bit', BIT)
        bitx, bity = B.T(bit[0] + h['nod'][0], bit[1] + h['nod'][1])
        A, a = ch.get('arm', ('B', 'b'))
        sx, sy = 3 + lean, -21 + hy
        bx, by = -2 + lean, -21 + hy
        # 乗り手の奥の手（手綱を持つ・馬の首の向こう）
        grip = None
        if ch.get('two_hand'):
            r = Ray(hand[0] + lean, hand[1] + hy, snap(ang))
            grip = r.at(-r.steps(ch['two_hand']))
        if pull:
            # 弓を引く手：奥の手をあごの横まで持ってくる（手綱は放す）
            grip = (int(round(pull[0] + lean)), int(round(pull[1] + hy)))
        rein_hand = None
        if not grip:
            if back is None:
                back = (7 + lean // 2, -16 + hy)
                rein_hand = back
        ch.get('mount_front', draw_horse_front)(cv, pose, P, B)
        if wing is not None:
            ch['wing_fn'](cv, B, wing, True)           # 手前の翼（乗り手の後ろ）
        if back and not grip:
            back_arm(cv, ch, ox + bx, oy + by, ox + back[0] + lean, oy + back[1] + hy)
        if rein_hand and reins:
            hx_, hy_ = ox + back[0] + lean, oy + back[1] + hy
            n = int(max(abs(bitx - hx_), abs(bity - hy_))) + 1
            for i in range(n + 1):
                t = i / n
                x = hx_ + (bitx - hx_) * t
                y = hy_ + (bity - hy_) * t + math.sin(t * math.pi) * 1.5
                cv.put(x, y, '9')
        if ch.get('tail'):                          # ポニーテールなど（頭の後ろ）
            rows, tx, ty = ch['tail']['flow' if pose in RUN else 'hang']
            cv.stamp(rows, ox + tx + lean, oy + ty + hy)
        # 胴・頭
        cv.stamp(ch['torso'], ox - 6 + lean, oy - 23 + hy)
        cv.stamp(ch['head'], ox - 6 + lean, oy - 35 + hy)
        # 手前の脚（あぶみに足をかけて、馬の横腹にそわせる）
        legs = {'ride': ((6, -9), (4, -2)), 'stand': ((7, -11), (3, -3))}[leg_pose]
        leg(cv, (ox + 1 + lean // 2, oy - 13 + hy), (ox + legs[0][0], oy + legs[0][1]), (ox + legs[1][0], oy + legs[1][1]), True)
        sx_, sy_ = ox + legs[1][0], oy + legs[1][1] + 1
        for x in range(-1, 3):
            cv.put(sx_ + x, sy_, '0')                 # あぶみ
        # 両手持ちなら奥の手
        if grip:
            cv.line(ox + bx, oy + by, ox + grip[0], oy + grip[1], a, a, 3)
        wfn = WEAPONS[ch.get('weapon', 'sword')]
        if arm_behind:
            cv.line(ox + sx, oy + sy, ox + hand[0] + lean, oy + hand[1] + hy, A, a, 3)
        wfn(cv, ch, ox + sx, oy + sy, ox + hand[0] + lean, oy + hand[1] + hy, ang, arm=not arm_behind,
            pull=(ox + grip[0], oy + grip[1]) if (pull and grip) else None)
        if grip:
            gx, gy = ox + grip[0], oy + grip[1]
            for dx_, dy_ in ((0, 0), (1, 0), (0, 1), (1, 1), (-1, 0), (0, -1)):
                cv.put(gx + dx_, gy + dy_, 's' if dy_ == 1 or dx_ == -1 else 'S')
        return cv.outlined()


RUN = ('g1', 'g2', 'g3', 'g4')


HORSE_BAY = {   # 栗毛の馬・赤い馬着
    '1': '#d08a4c', '2': '#a8602e', '3': '#6e3a1a', '4': '#2e1a10', '5': '#5a3420',
    '6': '#3a3440', '7': '#b8303a', '8': '#f0c850', '9': '#5a3418', '0': '#d8dce8', '&': '#2e1a10',
}
HORSE_GREY = {  # 白い馬・緑の馬着
    '1': '#f6f6fa', '2': '#d4d4e2', '3': '#9a9ab4', '4': '#5a5a74', '5': '#b4b4c8',
    '6': '#3a3440', '7': '#2e7a44', '8': '#f0c850', '9': '#5a3418', '0': '#d8dce8', '&': '#5a5a74',
}

# ---------------- ソードナイト（剣）アルド ----------------
SWORD_KNIGHT = {
    'name': 'sknight', 'foot': (MFOOT[0] + 8, MFOOT[1]), 'cut': 21, 'cutx': 30, 'weapon': 'sword', 'blade': 14, 'thin': False, 'arm': ('B', 'b'),
    'pal': dict(HORSE_BAY, **{
        'K': '#3a1a10', 'H': '#8a3a1c', 'h': '#c0602c',            # 赤茶の髪
        'S': '#f4c89c', 's': '#d08e64', 'E': '#1e1a2a',
        'B': '#c03a3a', 'b': '#7a2028', 'L': '#ec6a5a',            # 赤い服
        'I': '#c8d0e0', 'i': '#6a7490', 'e': '#ffffff',            # 肩当て・胸当て
        'P': '#4a4058', 'p': '#2c2638', 'Q': '#1e1a28',
        'W': '#6a4020', 'w': '#3e2410', 'V': '#2e1a0c',
        'Y': '#e0b040', 'y': '#9a6e20',
        'M': '#f4f8ff', 'm': '#b0bcd4', 'G': '#f0c850', 'g': '#a07820', 'U': '#5a3018',
    }),
    'head': [
        "....KKKKK....",
        "..KKHHHHhK...",
        ".KHHHHHHHhK..",
        "KHHHHHHHHHhK.",
        ".KHHHHHHHHHhK",
        "KHHHHSSHHSSK.",
        ".KHHSSSSSES..",
        "..KHSSSSSES..",
        "...KsSSSSSSS.",
        "....ssSSSSs..",
        ".....sssSs...",
        ".......ss....",
    ],
    'torso': [
        "...bBBBIIIi.",
        "...bbIIIeIIi",
        "...bbIIIIIIi",
        "...bbBiiiiiB",
        "...bbIIIIIBB",
        "...bbIeIIIIb",
        "...yYYYYYYYy",
        "...bbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
}

# ---------------- ランスナイト（槍）ハロルド ----------------
LANCE_KNIGHT = {
    'name': 'lknight', 'foot': (MFOOT[0] + 8, MFOOT[1]), 'cut': 21, 'cutx': 30, 'weapon': 'lance', 'shaft': 24, 'butt': 10, 'head_len': 8, 'arm': ('B', 'b'),
    'pal': dict(HORSE_GREY, **{
        'R': '#d83a3a', 'r': '#8a2028',                            # かぶとの羽根飾り
        'I': '#b4bccc', 'i': '#5e6680', 'e': '#ffffff', 'k': '#3a4258',
        'K': '#3a2a1a', 'H': '#6a4a2a',
        'S': '#f2c49a', 's': '#cc8a60', 'E': '#1e1a2a',
        'B': '#3a8a4a', 'b': '#20582c', 'L': '#6ab870',            # 緑の服
        'P': '#4a4a58', 'p': '#2c2c38', 'Q': '#1e1e28',
        'W': '#6a4020', 'w': '#3e2410', 'V': '#2e1a0c',
        'Y': '#e0b040', 'y': '#9a6e20',
        'J': '#b08048', 'j': '#6a4624',
        'M': '#f4f8ff', 'm': '#9aa6c0', 'G': '#d8b850', 'g': '#7a6428',
    }),
    'head': [
        "..RRRr.......",
        ".RRrr.iii....",
        "..r.iiIIIi...",
        "...iIIeIIIi..",
        "..iIIIIIIIIi.",
        ".iiiiiiiiiiii",
        "..iKHSSSSSS..",
        "..iKHSSSSES..",
        "..iKHSSSSESs.",
        "...iKsSSSSSS.",
        "....ssSSSSs..",
        ".....ssSss...",
    ],
    'torso': [
        "...bBBBIIIi.",
        "...bbIIIeIIi",
        "...bbIIIIIIi",
        "...bbBiiiiiB",
        "...bbIIIIIBB",
        "...bbIeIIIIb",
        "...yYYYYYYYy",
        "...bbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
}


def frames_sknight(ch):
    rh, ra = (8, -15), -45
    f = {
        'idle': mframe(ch, 'stand', (7, -16), -58),
        'raise': mframe(ch, 'g4', (-4, -34), -130, lean=-1, arm_behind=True),
        'swing': mframe(ch, 'brace', (13, -18), 18, lean=3),
        'hurt': mframe(ch, 'shy', (5, -15), 48, lean=-3),
        'dodge': mframe(ch, 'shy', (3, -17), -72, lean=-4),
        'crouch': mframe(ch, 'gather', (8, -14), -20, lean=2),
        'rear': mframe(ch, 'rear', (1, -36), -90, lean=2, arm_behind=True),
    }
    for i, p in enumerate(RUN):
        f['run%d' % (i + 1)] = mframe(ch, p, rh, ra, lean=2)
    return f


def frames_lknight(ch):
    rh, ra = (6, -15), -27
    f = {
        'idle': mframe(ch, 'stand', (6, -16), -63),
        'ready': mframe(ch, 'gather', (1, -17), 27, lean=-1),
        'thrust': mframe(ch, 'brace', (14, -18), 27, lean=4),
        'hurt': mframe(ch, 'shy', (5, -15), 27, lean=-3),
        'dodge': mframe(ch, 'shy', (3, -17), -63, lean=-4),
        'crouch': mframe(ch, 'gather', (6, -15), -27, lean=2),
        'rear': mframe(ch, 'rear', (3, -34), -63, lean=2, arm_behind=True),
    }
    for i, p in enumerate(RUN):
        f['run%d' % (i + 1)] = mframe(ch, p, rh, ra, lean=2)
        # 突撃：槍を脇にかかえて穂先を相手の胸に向け、前かがみで駆ける
        f['ch%d' % (i + 1)] = mframe(ch, p, (9, -15), 27, lean=4)
    return f



HORSE_BLACK = {  # 青毛（黒い馬）・青い馬着
    '1': '#5a5a6e', '2': '#3a3a4c', '3': '#22222e', '4': '#121218', '5': '#44445a', '&': '#121218',
    '6': '#6a6470', '7': '#3a5ab0', '8': '#f0c850', '9': '#6a4020', '0': '#d8dce8',
}
HORSE_PALOMINO = {  # 月毛（クリーム色の馬・白いたてがみ）・紫の馬着
    '1': '#f6dc9a', '2': '#dcb468', '3': '#a87e3c', '4': '#e8e0c8', '5': '#fffaf0', '&': '#6a4a20',
    '6': '#4a3e38', '7': '#7a3cb4', '8': '#f0c850', '9': '#5a3418', '0': '#d8dce8',
}
HORSE_DUN = {  # 河原毛（灰茶の馬・黒いたてがみ）・茶色の皮の馬着
    '1': '#c8b48c', '2': '#a08c68', '3': '#6a5a42', '4': '#2a2018', '5': '#4a3a2a', '&': '#2a2018',
    '6': '#3a3440', '7': '#7a5430', '8': '#c8a060', '9': '#4a2a14', '0': '#d8dce8',
}

# ---------------- アクスナイト（斧）ダリオ ----------------
# 馬上では片手（奥の手は手綱）。柄は短めの片手斧
AXE_KNIGHT = {
    'name': 'aknight', 'foot': (MFOOT[0] + 8, MFOOT[1]), 'cut': 21, 'cutx': 30,
    'weapon': 'axe', 'handle': 18, 'axe_butt': 4, 'arm': ('I', 'i'),
    'pal': dict(HORSE_BLACK, **{
        'I': '#a8b4c8', 'i': '#566078', 'e': '#e8f0ff', 'U': '#a8b4c8', 'u': '#566078', 'v': '#e8f0ff',            # 鋼のかぶと・鎧
        'K': '#2a1a10', 'S': '#e8b88c', 's': '#bc7c54', 'E': '#1e1a2a',
        'D': '#5a3418', 'd': '#3a200c',                            # ひげ
        'B': '#3a5ab0', 'b': '#243a78', 'L': '#6a8ae0',            # 青い服
        'P': '#4a4a5a', 'p': '#2c2c38', 'Q': '#1e1e28',
        'W': '#5a5a6a', 'w': '#34343e', 'V': '#24242c',            # 鉄の靴
        'Y': '#d8b048', 'y': '#8a6a24',
        'J': '#8a5a2c', 'j': '#5a3818', 'g': '#5a3818',
        'M': '#f4f8ff', 'A': '#b8c2d2', 'm': '#8a92a6', 'a': '#5a6276',
    }),
    'head': [
        "....uuuuu....",
        "..uuUUUUUu...",
        ".uUUvUUUUUu..",
        ".uUUUUUUUUUu.",
        "uuuuuuuuuuuuu",
        "..uKSSSuSSS..",
        "..uKSSSuSES..",
        "..uKSSSSSES..",
        "...KDSSSSSSS.",
        "...dDDDSDDD..",
        "....dDDDDD...",
        ".....ddDd....",
    ],
    'torso': [
        "..iIIIIIIIi.",
        ".iIIeIIIIIIi",
        ".iIIIIIIIIIi",
        ".iiIIIIIIIIi",
        "..iIIIIIIIi.",
        "...bBBBBBBBb",
        "...yYYYYYYYy",
        "...bbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
}

# ---------------- ボウナイト（弓）エルナ ----------------
BOW_KNIGHT = {
    'name': 'bknight', 'foot': (MFOOT[0] + 8, MFOOT[1]), 'cut': 21, 'cutx': 30,
    'weapon': 'bow', 'bow_h': 12, 'fist_outline_on': 'SsBbLTt',
    'pal': dict(HORSE_PALOMINO, **{
        'K': '#7a5418', 'H': '#e8c050', 'h': '#fff0a0',            # 金髪
        'S': '#f6d0aa', 's': '#d49a72', 'E': '#2a3a6a', 'R': '#d84a6a',
        'G': '#f0d060', 'g': '#a08020',                            # 金の額飾り・弓の先
        'B': '#6a4a9a', 'b': '#422a68', 'L': '#9a78cc',            # 紫の服
        'T': '#6a4020', 't': '#3e2410',                            # 胸当ての帯
        'P': '#4a4058', 'p': '#2c2638', 'Q': '#1e1a28',
        'W': '#7a4a2a', 'w': '#46281a', 'V': '#2e1a10',
        'Y': '#e0b040', 'y': '#9a6e20',
        'J': '#9a6a3a', 'j': '#5e4024', 'k': '#e8e8f0',            # 弓・弦
        'U': '#a07848', 'M': '#f4f8ff', 'm': '#9aa6c0', 'r': '#7a1e22',
    }),
    'head': [
        "....KKKKK....",
        "..KKHHHHhK...",
        ".KHHHHHHHhK..",
        ".KHHHHHHHHhK.",
        ".KHgGGGGGGGK.",
        ".KHHHHSHHSSK.",
        ".KHHSSSSSKS..",
        ".KHHSSSSSES..",
        "..KHSSSSSES..",
        "..KHsSSSSSS..",
        "...KHssSSRs..",
        "....K..sss...",
    ],
    'torso': [
        "....bBBBLL..",
        "...bbBBBBLB.",
        "...bbTBBBBLB",
        "...bbBTBBBBB",
        "...bbBBTBBBB",
        "...bbBBBTBBb",
        "..yyYYYYYYYy",
        "..bbbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
}

def frames_aknight(ch):
    # 片手斧：肩にかついで駆け、頭の後ろまで振りかぶって馬上から叩き割る
    rh, ra = (6, -17), -63
    f = {
        'idle': mframe(ch, 'stand', (7, -16), -63),
        'raise': mframe(ch, 'g4', (-1, -36), 135, lean=-1, arm_behind=True),
        'swing': mframe(ch, 'brace', (13, -19), 27, lean=3),
        'follow': mframe(ch, 'brace', (12, -17), 63, lean=4),
        'hurt': mframe(ch, 'shy', (5, -15), 27, lean=-3),
        'dodge': mframe(ch, 'shy', (4, -17), -45, lean=-4),
        'crouch': mframe(ch, 'gather', (7, -15), -45, lean=2),
        'rear': mframe(ch, 'rear', (2, -36), -117, lean=2, arm_behind=True),
    }
    for i, p in enumerate(RUN):
        f['run%d' % (i + 1)] = mframe(ch, p, rh, ra, lean=2)
    return f


def frames_bknight(ch):
    # 弓騎兵（重め）：馬を止めて、あぶみに立つように背すじを伸ばし、大きく引きしぼって射る
    rh = (10, -15)
    f = {
        'idle': mframe(ch, 'stand', (10, -14), 0),
        'aim': mframe(ch, 'stand', (13, -21), 1, pull=(1, -21)),
        'shot': mframe(ch, 'stand', (13, -21), 2, lean=-1, back=(-7, -22)),
        'hurt': mframe(ch, 'shy', (8, -14), 0, lean=-3),
        'dodge': mframe(ch, 'shy', (8, -16), 0, lean=-4),
        'crouch': mframe(ch, 'gather', (10, -15), 0, lean=2),
        # 必殺：棹立ちの馬の上で天に向けて引きしぼる
        'rear': mframe(ch, 'rear', (13, -23), 1, lean=1, pull=(1, -23)),
        'rshot': mframe(ch, 'rear', (13, -23), 2, lean=0, back=(-7, -24)),
    }
    for i, p in enumerate(RUN):
        f['run%d' % (i + 1)] = mframe(ch, p, rh, 0, lean=2)
    return f


# ---------------- 女の騎馬（2026-11-23 男女共通にするため追加） ----------------
PONY = {   # 馬上のポニーテール（hang=止まっているとき、flow=駆けているとき）
    'hang': ([
        "....rrK",
        "...KHHK",
        "..KHHhK",
        "..KHHh.",
        ".KHHH..",
        ".KHHh..",
        "KHHH...",
        "KHHh...",
        ".KK....",
    ], -9, -34),
    'flow': ([
        "..........rrK",
        "......KKKHHHK",
        "...KKHHHHHHh.",
        ".KKHHHHhhHh..",
        "KHHHHKK......",
        ".KK..........",
    ], -16, -34),
}
FEM_HEAD = [
    "....KKKKKK...",
    "..KKHHHHHhK..",
    ".KHHHHHHHHhK.",
    ".KHHHHHHHHhhK",
    ".KHHHHHHHHHhK",
    ".KHHHHSHHHSSK",
    ".KHHHSSSSSKS.",
    ".KHHHSSSSSES.",
    "..KHHSSSSSES.",
    "..KHHsSSSSSS.",
    "...KHssSSRs..",
    "....K..sss...",
]
FEM_ARMOR = [
    "....bBIIIi..",
    "...bbIIeIIi.",
    "...bbIIIIIIi",
    "...bbBiiiiiB",
    "...bbIIIIIBB",
    "...bbBBBBBBb",
    "..yyYYYYYYYy",
    "..bbbBBBBBbb",
    "...bbBBBBBb.",
    "...pbbBBbbb.",
    "...ppPPPPpp.",
]

# ソードナイト（女）ロゼ：深紅のポニーテール・赤い服に銀の胸当て・栗毛の馬
SWORD_KNIGHT_F = dict(SWORD_KNIGHT, name='sknight_f', thin=True, head=FEM_HEAD, torso=FEM_ARMOR, tail=PONY,
    pal=dict(SWORD_KNIGHT['pal'], K='#3a0c18', H='#9a1e34', h='#d0465a', r='#e0c050', R='#d84a6a', e='#ffffff'))

# ランスナイト（女）マリカ：羽根飾りのかぶと・かぶとの下から金髪の三つ編み・緑の服・白い馬
LANCE_KNIGHT_F = dict(LANCE_KNIGHT, name='lknight_f', thin=True, torso=FEM_ARMOR, tail=PONY,
    head=[
        "..RRRr.......",
        ".RRrr.iii....",
        "..r.iiIIIi...",
        "...iIIeIIIi..",
        "..iIIIIIIIIi.",
        ".iiiiiiiiiiii",
        "..iHHSSSSSS..",
        "..iHHSSSSKS..",
        "..iHHSSSSES..",
        "...iHsSSSSS..",
        "....HssSSRs..",
        ".....KssSs...",
    ],
    pal=dict(LANCE_KNIGHT['pal'], K='#7a5418', H='#e0b848', h='#fff0a0', R='#d83a3a', r='#8a2028'))
LANCE_KNIGHT_F['tail'] = {k: ([row.replace('rr', 'gg') for row in v[0]], v[1], v[2] + 6) for k, v in PONY.items()}   # かぶとの下から
LANCE_KNIGHT_F['pal']['g'] = LANCE_KNIGHT['pal']['g']

# アクスナイト（女）イルゼ：鋼のかぶと・かぶとの下から銀髪・鋼の鎧に青い服・黒い馬
AXE_KNIGHT_F = dict(AXE_KNIGHT, name='aknight_f', thin=True,
    head=[
        "....iiiii....",
        "..iiIIIIIi...",
        ".iIIeIIIIIi..",
        ".iIIIIIIIIIi.",
        "iiiiiiiiiiiii",
        ".HiHHHSHHHS..",
        ".HiHSSSSSKS..",
        ".HiHSSSSSES..",
        ".HHHSSSSSES..",
        ".HHHsSSSSSS..",
        ".HH.KssSSRs..",
        ".H.....sss...",
    ],
    pal=dict(AXE_KNIGHT['pal'], H='#c8ccdc', K='#5a6076', R='#d84a6a'))

# ボウナイト（男）テオ：こげ茶の短い髪・金の額飾り・紫の服・月毛の馬
BOW_KNIGHT_M = dict(BOW_KNIGHT, name='bknight_m',
    head=[
        "....KKKKK....",
        "..KKHHHHhK...",
        ".KHHHHHHHhK..",
        "KHHHHHHHHHhK.",
        ".KHgGGGGGGGK.",
        "KHHHHSSHHSSK.",
        ".KHHSSSSSES..",
        "..KHSSSSSES..",
        "...KsSSSSSSS.",
        "....ssSSSSs..",
        ".....sssSs...",
        ".......ss....",
    ],
    torso=[
        "...bBBBBLLT.",
        "...bbBBBBTLB",
        "...bbBBBTBBB",
        "...bbBBTBBBB",
        "...bbBTBBBBB",
        "...bbTBBBBBb",
        "...yYYYYYYYy",
        "...bbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
    pal=dict(BOW_KNIGHT['pal'], K='#2a1a10', H='#5a3a20', h='#7a5430', E='#1e1a2a', S='#f2c49a', s='#cc8a60'))


FRAMES = {
    'sknight': (SWORD_KNIGHT, frames_sknight(SWORD_KNIGHT)),
    'lknight': (LANCE_KNIGHT, frames_lknight(LANCE_KNIGHT)),
    'aknight': (AXE_KNIGHT, frames_aknight(AXE_KNIGHT)),
    'bknight': (BOW_KNIGHT, frames_bknight(BOW_KNIGHT)),
    'sknight_f': (SWORD_KNIGHT_F, frames_sknight(SWORD_KNIGHT_F)),
    'lknight_f': (LANCE_KNIGHT_F, frames_lknight(LANCE_KNIGHT_F)),
    'aknight_f': (AXE_KNIGHT_F, frames_aknight(AXE_KNIGHT_F)),
    'bknight_m': (BOW_KNIGHT_M, frames_bknight(BOW_KNIGHT_M)),
}

if __name__ == '__main__':
    import sys
    from PIL import Image
    sc = 4
    rows = []
    for ch, fr in FRAMES.values():
        P = dict(ch['pal']); P['o'] = '#16121e'
        ims = []
        for k, g in fr.items():
            im = Image.new('RGB', (MW, MH), '#c8a46a')
            for y, r in enumerate(g):
                for x, c in enumerate(r):
                    if c != '.':
                        im.putpixel((x, y), tuple(int(P[c][i:i + 2], 16) for i in (1, 3, 5)))
            ims.append(im.resize((MW * sc, MH * sc), Image.NEAREST))
        rows.append(ims)
    n = max(len(r) for r in rows)
    per = 6
    lines = sum((len(r) + per - 1) // per for r in rows)
    sheet = Image.new('RGB', (per * (MW * sc + 4), lines * (MH * sc + 4)), '#000')
    j = 0
    for ims in rows:
        for i, im in enumerate(ims):
            sheet.paste(im, ((i % per) * (MW * sc + 4), (j + i // per) * (MH * sc + 4)))
        j += (len(ims) + per - 1) // per
    sheet.save(sys.argv[1] if len(sys.argv) > 1 else 'm.png')
