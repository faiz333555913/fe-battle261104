# 空を飛ぶクラス（ペガサス・飛竜）。1文字＝1ドット、右向き
#   ペガサスは馬の土台（mounted.py）に翼を足し、宙に浮いたポーズを加える。
#   飛竜は胴・長い首・頭・しっぽ・脚を形の組み合わせで描き、こうもりの翼をつける。
#   翼は「はばたき4コマ（上→中→下→中）」の角度だけを変えるので、どのコマでも翼の大きさは同じ。
import math
import mounted
from mounted import (Body, capsule, ellipse, fill_shape, mframe, _leg, FL, HL, FRONT_TOP, HIND_TOP,
                     HORSE, MFOOT, ROLE)

AIR = -12      # 宙に浮く高さ（地面からの距離）

# ペガサスの宙のポーズ（前脚は折りたたみ、後脚は後ろへ流す）
HORSE.update({
    'hover': dict(ang=0, dy=AIR, nod=(0, -1), legs=('fold', 'fold2', 'back2', 'back'), tail='flow'),
    'hrise': dict(ang=-10, dy=AIR - 2, nod=(-1, -2), legs=('fold', 'fold2', 'back2', 'back'), tail='flow'),
    'hdive': dict(ang=14, dy=AIR + 2, nod=(2, 2), legs=('reach2', 'fold2', 'back', 'back2'), tail='flow'),
    'hshy': dict(ang=-16, dy=AIR, nod=(-2, -3), legs=('fold2', 'fold', 'under', 'back2'), tail='flow'),
})

# はばたき（翼の角度：上へ 75° → 30° → 下へ -25° → 30°）
FLAP = (75, 30, -25, 20)


def wing(cv, B, root, theta, length, chord, style, near, cols):
    """翼。root（胴の座標）から、後ろ上へ theta 度の向きに長さ length の前縁。前縁から後ろ側へ羽（膜）が広がる"""
    rx, ry = B.T(*root)
    if not near:
        rx -= 2; ry -= 1; theta += 8
    t = math.radians(theta)
    ux, uy = -math.cos(t), -math.sin(t)          # 前縁の向き（後ろ上）
    nx, ny = -uy, ux                              # 羽が広がる向き
    if nx > 0.05 or (abs(nx) <= 0.05 and ny < 0):
        nx, ny = -nx, -ny
    L, M, D, E, F = cols
    pts = {}
    steps = int(length * 3)
    for i in range(steps + 1):
        tt = i / steps
        if style == 'feather':
            c = chord * (0.55 + 0.45 * math.sin(math.pi * min(1, 0.2 + tt * 0.95))) * (1 - 0.55 * tt ** 3)
            seg = int(tt * length / 3)
            c += 1.2 if seg % 2 else 0            # 羽先のぎざぎざ
        else:
            c = chord * (1 - tt) ** 0.6 * (0.6 + 0.4 * abs(math.cos(tt * math.pi * 2.5)))
        ex, ey = rx + ux * length * tt, ry + uy * length * tt
        kk = 0.0
        while kk <= c:
            X, Y = int(round(ex + nx * kk)), int(round(ey + ny * kk))
            if kk < 1.2:
                col = E                            # 前縁（骨・ふち）
            elif style == 'feather':
                col = D if (int(tt * length) % 3 == 0 and kk > c * 0.35) else (L if kk < c * 0.45 else M)
            else:
                col = M if kk < c * 0.6 else D
            if (X, Y) not in pts or col == E:
                pts[(X, Y)] = col
            kk += 0.5
    if style == 'bat':                             # こうもりの翼の指の骨（先から後ろ縁へ）
        for f in (0.35, 0.6, 0.85):
            bx, by = rx + ux * length * f, ry + uy * length * f
            c = chord * (1 - f) ** 0.6 * (0.6 + 0.4 * abs(math.cos(f * math.pi * 2.5)))
            k = 0.0
            while k <= c:
                pts[(int(round(bx + nx * k - ux * k * 0.4)), int(round(by + ny * k - uy * k * 0.4)))] = F
                k += 0.5
    # ふち：翼のまわり1ドットを暗くして、同じ色の胴と重なっても形が分かるようにする
    rim = {}
    for (X, Y), c in pts.items():
        if c in (L, M) and any((X + dx, Y + dy) not in pts for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            rim[(X, Y)] = D
    pts.update(rim)
    if not near:
        pts = {k: (D if v in (L, M) else v) for k, v in pts.items()}
    for (X, Y), c in pts.items():
        cv.put(X, Y, c)


def pegasus_wing(cv, B, theta, near):
    wing(cv, B, (2, -32), theta, 32, 12, 'feather', near, ('1', '2', '3', '1', '3'))


# ---------------- 飛竜 ----------------
DRAGON = {
    'hover': dict(ang=0, dy=AIR, nod=(0, 0), legs='tuck'),
    'drise': dict(ang=-10, dy=AIR - 2, nod=(-1, -2), legs='tuck'),
    'ddive': dict(ang=14, dy=AIR + 2, nod=(2, 2), legs='claw'),
    'dshy': dict(ang=-16, dy=AIR, nod=(-2, -3), legs='hang'),
}
DLEGS = {   # 後脚（ふともも→ひざ→足首→つま先）と前脚
    'tuck': ([(-7, -24), (-4, -17), (-10, -13), (-14, -13)], [(9, -24), (12, -20), (15, -19)]),
    'claw': ([(-7, -24), (-2, -17), (2, -13), (6, -12)], [(9, -24), (14, -21), (18, -21)]),
    'hang': ([(-7, -24), (-5, -16), (-8, -10), (-6, -8)], [(9, -24), (10, -18), (13, -17)]),
}
DSADDLE = (-2, -35)
DBIT = (27, -47)


def _dleg(cv, B, joints, rs, cols, claw):
    pts = [B.T(*j) for j in joints]
    I = Body()
    for i in range(len(pts) - 1):
        capsule(cv, I, pts[i], pts[i + 1], rs[i], rs[i + 1], cols)
    x, y = pts[-1]
    for dx, dy in ((1, 1), (2, 1), (1, 2)):
        cv.put(x + dx, y + dy, claw)


def draw_dragon_back(cv, pose, P):
    h = DRAGON[pose]
    B = Body(h['ang'], (0, -26), 0, h['dy'])
    C = ('1', '2', '3')
    # しっぽ（長く、先が細い）
    capsule(cv, B, (-12, -27), (-24, -24), 5, 3.5, C)
    capsule(cv, B, (-24, -24), (-34, -26), 3.5, 2.2, C)
    capsule(cv, B, (-34, -26), (-41, -31), 2.2, 0.8, C)
    for (x, y) in ((-20, -30), (-28, -29), (-35, -31)):
        X, Y = B.T(x, y); cv.put(X, Y, '@')
    hind, front = DLEGS[h['legs']]
    _dleg(cv, B, [(-6, -24)] + hind[1:], [3.5, 2.2, 1.6, 1.2], ('3', '3', '&'), '@')
    _dleg(cv, B, [(8, -24)] + front[1:], [2.2, 1.4, 1.0], ('3', '3', '&'), '@')
    return B


def draw_dragon_front(cv, pose, P, B):
    h = DRAGON[pose]
    nx, ny = h['nod']
    C = ('1', '2', '3')
    ellipse(cv, B, -1, -27, 13, 7, C)
    ellipse(cv, B, 10, -28, 7, 7, C)
    # 腹（明るい黄土色のうろこ）
    fill_shape(cv, B, (-14, -25, 12, -19), lambda x, y: ((x + 1) / 13) ** 2 + ((y + 27) / 7) ** 2 <= 1 and y >= -23.5,
               lambda x, y: '#' if y > -21 else '%')
    for i in range(-10, 14, 3):
        X, Y = B.T(i, -22); cv.put(X, Y, '#')
    # 首（S字）と頭
    capsule(cv, B, (12, -31), (18, -40), 5, 3.8, C)
    capsule(cv, B, (18, -40), (21 + nx, -46 + ny), 3.8, 3.2, C)
    hx, hy = 21 + nx, -49 + ny
    capsule(cv, B, (hx, hy), (hx + 10, hy + 3), 3.6, 2.0, C)          # 上あご
    capsule(cv, B, (hx + 1, hy + 3), (hx + 9, hy + 5), 2.0, 1.2, ('3', '3', '&'))   # 下あご
    capsule(cv, B, (hx - 1, hy - 2), (hx - 6, hy - 5), 1.1, 0.4, ('@', '@', '@'))   # 角
    for (x, y, c) in ((hx + 2, hy - 1, '!'), (hx + 3, hy - 1, '&'), (hx + 9, hy + 1, '&'), (hx + 4, hy + 3, '@'), (hx + 7, hy + 4, '@')):
        X, Y = B.T(x, y); cv.put(X, Y, c)
    # 首すじのとげ
    for (x, y) in ((14, -38), (16, -42), (18, -46), (10, -35), (6, -34)):
        X, Y = B.T(x, y); cv.put(X, Y, '@'); X, Y = B.T(x - 1, y - 1); cv.put(X, Y, '@')
    hind, front = DLEGS[h['legs']]
    _dleg(cv, B, hind, [4, 2.6, 1.8, 1.3], C, '@')
    _dleg(cv, B, front, [2.6, 1.6, 1.1], C, '@')
    # 鞍
    fill_shape(cv, B, (-8, -36, 5, -26), lambda x, y: -7 <= x <= 4 and -35 <= y <= -27 - (2 if x < -5 or x > 2 else 0),
               lambda x, y: '8' if y > -28.5 - (2 if x < -5 or x > 2 else 0) else '7')
    for x in range(-6, 4):
        X, Y = B.T(x, -36); cv.put(X, Y, '9')
    for (x, y) in ((-6, -37), (-7, -38), (3, -37), (4, -38)):
        X, Y = B.T(x, y); cv.put(X, Y, '9')


def dragon_wing(cv, B, theta, near):
    wing(cv, B, (1, -34), theta, 36, 18, 'bat', near, ('*', '*', '=', '$', '$'))


# ---------------- ペガサスナイト（槍）ルナ ----------------
PEGASUS_PAL = {   # 白い天馬・水色の馬着
    '1': '#ffffff', '2': '#dce4f4', '3': '#9aa6c8', '4': '#c8d4ec', '5': '#f4f8ff', '&': '#6a7494',
    '6': '#8a8aa0', '7': '#3a9ab0', '8': '#f0d060', '9': '#7a5430', '0': '#e8ecf4',
}
PEGASUS_KNIGHT = {
    'name': 'pegasus', 'foot': (MFOOT[0] + 8, MFOOT[1]), 'cut': 27, 'cutx': 30,
    'weapon': 'lance', 'shaft': 22, 'butt': 8, 'head_len': 7, 'arm': ('B', 'b'),
    'wing_fn': pegasus_wing,
    'pal': dict(PEGASUS_PAL, **{
        'K': '#2a4a7a', 'H': '#4a7ac0', 'h': '#8ab4f0',            # 青い髪
        'S': '#f6d0aa', 's': '#d49a72', 'E': '#1a2a4a', 'R': '#d84a6a',
        'I': '#e8ecf4', 'i': '#8a96b4', 'e': '#ffffff',            # 白い胸当て・額当て
        'B': '#3a9ab0', 'b': '#226070', 'L': '#7ad0e0',            # 水色の服
        'P': '#3a4058', 'p': '#262a3a', 'Q': '#181a26',
        'W': '#e8ecf4', 'w': '#9aa6c0', 'V': '#5a6480',            # 白いブーツ
        'Y': '#f0d060', 'y': '#a08020',
        'J': '#c8a060', 'j': '#7a5a30',
        'M': '#f4f8ff', 'm': '#9aa6c0', 'G': '#f0d060', 'g': '#8a7028',
    }),
    'head': [
        "....KKKKK....",
        "..KKHHHHhK...",
        ".KHHHHHHHhK..",
        "KHHHHHHHHHhK.",
        "KHHiIIIIIIIi.",
        "KHHHHHSHHSSK.",
        "KHHHSSSSSKS..",
        "KHHHSSSSSES..",
        "KHHKSSSSSES..",
        "KHHKsSSSSSS..",
        ".KH.KssSSRs..",
        ".K.....sss...",
    ],
    'torso': [
        "....bBBBLL..",
        "...bIIIIILB.",
        "...bIIeIIIIB",
        "...bIIIIIIIB",
        "...bbIIIIIBB",
        "...bbBBBBBBb",
        "..yyYYYYYYYy",
        "..bbbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
}

# ---------------- ドラゴンナイト（斧）ヴァルド ----------------
DRAGON_GREEN = {'1': '#5a9a5a', '2': '#3a6e44', '3': '#22442c', '&': '#101e14'}   # 深緑（女のベルナ）
DRAGON_PAL = {   # 深紅の飛竜・赤い鞍（男のヴァルド、2026-11-23 ガトー指示で深紅に）
    '1': '#c43440', '2': '#8e1c28', '3': '#5a0e18', '&': '#2a060c',
    '%': '#d8c078', '#': '#a08a4a', '@': '#b8a880', '!': '#ffe060',
    '*': '#4a3036', '=': '#2e1c22', '$': '#180e12',
    '7': '#b02a2a', '8': '#f0c850', '9': '#3a2a1a', '0': '#d8dce8',
}
DRAGON_KNIGHT = {
    'name': 'dragon', 'foot': (MFOOT[0] + 8, MFOOT[1]), 'cut': 27, 'cutx': 30,
    'weapon': 'axe', 'handle': 18, 'axe_butt': 4, 'arm': ('I', 'i'),
    'wing_fn': dragon_wing, 'poses': DRAGON, 'mount_back': draw_dragon_back, 'mount_front': draw_dragon_front,
    'saddle': DSADDLE, 'bit': DBIT,
    'pal': dict(DRAGON_PAL, **{
        'I': '#4a4a5a', 'i': '#24242e', 'e': '#8a8aa0', 'U': '#4a4a5a', 'u': '#24242e', 'v': '#8a8aa0',            # 黒い鎧
        'R': '#c83030', 'r': '#7a1a1a',                            # 赤いかぶとの房
        'K': '#1a1a20', 'S': '#e8b88c', 's': '#bc7c54', 'E': '#1e1a2a',
        'B': '#a02a2a', 'b': '#621820', 'L': '#d05050',            # 赤い服
        'P': '#3a3440', 'p': '#24202a', 'Q': '#16141a',
        'W': '#3a3a48', 'w': '#22222c', 'V': '#16161c',
        'Y': '#d8b048', 'y': '#8a6a24',
        'J': '#6a4428', 'j': '#3e2614', 'g': '#3e2614',
        'M': '#f4f8ff', 'A': '#b8c2d2', 'm': '#8a92a6', 'a': '#5a6276',
    }),
    'head': [
        ".....RR......",
        "...RRrUu.....",
        "..uUUUUUUu...",
        ".uUvUUUUUUu..",
        ".uUUUUUUUUUu.",
        ".uuuuuuuuuuuu",
        "..uKSSSSSSS..",
        "..uKSSSSSES..",
        "..uKSSSSSES..",
        "...uKsSSSSSS.",
        "....ssSSSSs..",
        ".....ssSss...",
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


def frames_pegasus(ch):
    # 天馬騎士：槍を片手で。宙に浮いてはばたき、急降下の勢いで斜め下へ突く
    f = {}
    for i, w in enumerate(FLAP):
        f['fly%d' % (i + 1)] = mframe(ch, 'hover', (6, -16), -63, wing=w)
        f['run%d' % (i + 1)] = mframe(ch, 'hdive' if i % 2 else 'hover', (6, -15), -27, lean=2, wing=w)
    f['idle'] = f['fly1']
    f['ready'] = mframe(ch, 'hrise', (1, -17), 27, lean=-1, wing=75)
    f['thrust'] = mframe(ch, 'hdive', (14, -18), 27, lean=4, wing=-25)
    f['hurt'] = mframe(ch, 'hshy', (5, -15), 27, lean=-3, wing=40)
    f['dodge'] = mframe(ch, 'hrise', (3, -17), -63, lean=-4, wing=75)
    f['crouch'] = mframe(ch, 'hrise', (6, -15), -27, lean=1, wing=30)
    # 必殺：空高く舞い上がって槍を天に → 真下へ急降下して貫く
    f['soar'] = mframe(ch, 'hrise', (3, -34), -63, lean=1, arm_behind=True, wing=75)
    f['plunge'] = mframe(ch, 'hdive', (12, -20), 45, lean=4, wing=60)
    return f


def frames_dragon(ch):
    # 竜騎士：長柄の斧を片手で。飛竜ごと上から襲いかかり、頭上から叩き割る
    f = {}
    for i, w in enumerate(FLAP):
        f['fly%d' % (i + 1)] = mframe(ch, 'hover', (9, -16), -90, wing=w)
        f['run%d' % (i + 1)] = mframe(ch, 'ddive' if i % 2 else 'hover', (6, -17), -63, lean=2, wing=w)
    f['idle'] = f['fly1']
    f['raise'] = mframe(ch, 'drise', (-1, -36), 135, lean=-1, arm_behind=True, wing=75)
    f['swing'] = mframe(ch, 'ddive', (13, -19), 27, lean=3, wing=-25)
    f['follow'] = mframe(ch, 'ddive', (12, -17), 63, lean=4, wing=-25)
    f['hurt'] = mframe(ch, 'dshy', (5, -15), 27, lean=-3, wing=40)
    f['dodge'] = mframe(ch, 'drise', (4, -17), -45, lean=-4, wing=75)
    f['crouch'] = mframe(ch, 'drise', (7, -15), -45, lean=1, wing=30)
    f['soar'] = mframe(ch, 'drise', (2, -36), -117, lean=1, arm_behind=True, wing=75)
    f['plunge'] = mframe(ch, 'ddive', (13, -19), 45, lean=4, wing=60)
    return f


FRAMES = {
    'pegasus': (PEGASUS_KNIGHT, frames_pegasus(PEGASUS_KNIGHT)),
    'dragon': (DRAGON_KNIGHT, frames_dragon(DRAGON_KNIGHT)),
}

# ---------------- ドラゴンナイト（女）ベルナ（2026-11-23 男女共通にするため追加） ----------------
# 黒い鎧・赤い房のかぶと・かぶとの下から紫の髪のポニーテール・赤い服。飛竜は男と同じ
DRAGON_KNIGHT_F = dict(DRAGON_KNIGHT, name='dragon_f', thin=True,
    pal=dict(DRAGON_KNIGHT['pal'], **DRAGON_GREEN, **{'*': '#9a3a3a', '=': '#6a2228', '$': '#3a1a14'}, H='#7a3a9a', h='#a86ac8', K='#2a1236', R='#c83030', r='#7a1a1a', S='#f0c49a', s='#c88a60'),
    head=[
        ".....RR......",
        "...RRrIi.....",
        "..iIIIIIIi...",
        ".iIeIIIIIIi..",
        ".iIIIIIIIIIi.",
        ".iiiiiiiiiiii",
        "..iHHSSSSSS..",
        "..iHHSSSSKS..",
        "..iHHSSSSES..",
        "...iHsSSSSS..",
        "....HssSSRs..",
        ".....KssSs...",
    ],
    tail={k: ([row.replace('rr', 'RR') for row in v[0]], v[1], v[2] + 6) for k, v in {
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
        ], -16, -34)}.items()})
FRAMES['dragon_f'] = (DRAGON_KNIGHT_F, frames_dragon(DRAGON_KNIGHT_F))
