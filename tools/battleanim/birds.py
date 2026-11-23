# ラグズ（鳥翼族：タカ・カラス）。1文字＝1ドット、右向き
#   人の姿：歩兵と同じ組み立て（素手と爪）。背中に翼（立つとたたみ、動くと後ろへ広げる）
#   鳥の姿：胴・胸・頭・くちばし・尾羽・脚を形の組み合わせで描き、翼は天馬と同じ関数（羽根の翼）で、
#           はばたき4コマの角度だけ変える。いつも宙に浮いていて、待機中もはばたく
import fighter
from laguz import Area, Chain, ell, cap, human_frames
from mounted import Body, MFOOT
from flyer import wing, FLAP

# ポーズ: ang 胴の傾き（マイナスで頭が上）、dy 上下、wing 翼の角度、legs 脚（tuck たたむ / hang たらす / strike 爪を前へ）、
#        beak くちばしを開く、tail 尾羽（fan 広げる / shut 閉じる）
BIRD = {}
for i, th in enumerate(FLAP):
    BIRD['fly%d' % (i + 1)] = dict(ang=-6, dy=(-1, 0, 1, 0)[i], wing=th, legs='hang', beak=0, tail='fan')
    BIRD['run%d' % (i + 1)] = dict(ang=8, dy=(-1, 0, 1, 0)[i], wing=th, legs='tuck', beak=0, tail='shut')
BIRD.update({
    'ready':  dict(ang=-18, dy=-2, wing=88, legs='strike', beak=1, tail='fan'),     # 翼を高く上げ、爪を構える
    'strike': dict(ang=-26, dy=0, wing=55, legs='strike', beak=1, tail='fan'),      # 爪を前へ突き出してつかみかかる
    'dive':   dict(ang=28, dy=0, wing=6, legs='tuck', beak=0, tail='shut'),         # 翼をたたんで急降下
    'peck':   dict(ang=14, dy=2, wing=40, legs='hang', beak=1, tail='fan'),         # 頭を突き出してくちばしで突く
    'hurt':   dict(ang=-22, dy=-1, wing=34, legs='hang', beak=1, tail='fan'),
    'dodge':  dict(ang=-12, dy=-5, wing=92, legs='tuck', beak=0, tail='fan'),
    'roar':   dict(ang=-16, dy=-1, wing=70, legs='hang', beak=1, tail='fan'),       # 翼を大きく広げて鳴く（化身・必殺）
    'soar':   dict(ang=-34, dy=-2, wing=84, legs='tuck', beak=0, tail='shut'),
})
BIRD['crouch'] = BIRD['ready']
BIRD['idle'] = BIRD['fly1']


def draw_bird(sp, pose):
    s = sp['scale']
    h = BIRD[pose]
    with Area(150, 112, MFOOT):
        cv = fighter.Canvas()

        def S(p):
            return (p[0] * s, p[1] * s)
        B = Body(h['ang'], S((0, -34)), 0, h['dy'])
        C = ('1', '2', '3')
        WC = ('1', '2', '3', '3', '3')
        bars = sp.get('bars')

        def pat(x, y, v, base):
            return '4' if bars and ((x / s + 100) % 3.4) < 0.9 and v < 0.4 else base
        # 奥の翼
        wing(cv, B, S((1, -38)), h['wing'], 30 * s, 12 * s, 'feather', False, WC)
        # 尾羽
        spread = (-4, 0, 4) if h['tail'] == 'fan' else (-1.5, 0, 1.5)
        tl = sp.get('tail_len', 14)
        for k, a in enumerate(spread):
            cap(cv, B, S((-8, -33)), S((-8 - tl, -31 + a)), 2.4 * s, 2.8 * s, C if k == 1 else ('2', '3', '3'), pat)
        # 脚（黄色）と爪
        L8 = ('8', '8', '8')
        if h['legs'] == 'hang':
            for dx in (0, 3):
                cap(cv, B, S((2 + dx, -28)), S((3 + dx, -21)), 1.2 * s, 1.0 * s, L8)
                X, Y = B.T(*S((3 + dx, -21)))
                for t in (-1, 0, 1):
                    cv.put(X + t, Y + 1, '7')
        elif h['legs'] == 'strike':
            for dx, dy in ((0, 0), (3, 1)):
                p0, p1 = S((3 + dx, -29 + dy)), S((13 + dx, -25 + dy))
                cap(cv, B, p0, p1, 1.3 * s, 1.0 * s, L8)
                X, Y = B.T(*p1)
                for t in (-2, 0, 2):
                    cv.put(X + 1, Y + t * 0.8, '9'); cv.put(X + 2, Y + t * 0.8, '9')
        # 胴・胸
        ell(cv, B, *S((-1, -34)), 11 * s, 6.5 * s, C, pat)
        if h['legs'] != 'tuck':
            ell(cv, B, *S((3, -29)), 3.2 * s, 3.0 * s, C)                       # もも
        ell(cv, B, *S((7, -35)), 6.6 * s, 6.6 * s, sp.get('breast', C),
            (lambda x, y, v, b: '6' if ((y / s + 100) % 2.6) < 0.7 and ((x / s + 100) % 3) < 1.2 else b) if sp.get('streak') else None)
        # 頭
        hx, hy = S((13, -42))
        Hd = Chain(B, Body(0, (hx, hy)))
        ell(cv, Hd, hx, hy, 5.4 * s, 5.0 * s, C)
        if sp.get('cap'):
            ell(cv, Hd, hx - 1 * s, hy - 2.4 * s, 4.4 * s, 2.6 * s, ('3', '3', '4'))      # 頭のてっぺんの濃い羽
        bl = sp.get('beak_len', 4)
        if h['beak']:
            cap(cv, Hd, (hx + 3.5 * s, hy + 2.4 * s), (hx + (3.5 + bl * 0.8) * s, hy + 4.4 * s), 1.1 * s, 0.6 * s, ('7', '7', '7'))
            for k in range(2):
                X, Y = Hd.T(hx + (5 + k) * s, hy + 2.2 * s); cv.put(X, Y, '&')
        cap(cv, Hd, (hx + 3.5 * s, hy + 0.4 * s), (hx + (3.5 + bl) * s, hy + (1.4 if sp.get('hook') else 0.6) * s),
            sp.get('beak_w', 1.7) * s, 0.8 * s, ('7', '7', '7'))
        if sp.get('hook'):
            X, Y = Hd.T(hx + (3.5 + bl) * s, hy + 2.6 * s); cv.put(X, Y, '7')
            for (x, y) in ((3.4, -0.6), (3.4, 0.4)):
                X, Y = Hd.T(hx + x * s, hy + y * s); cv.put(X, Y, '8')                  # ろう膜（黄色）
        for (x, y, c) in ((1.4, -1.4, '0'), (2.4, -1.4, '0'), (2.4, -0.4, '4'), (1.4, -0.4, '0'),
                          (0.4, -2.4, '4'), (1.4, -2.4, '4'), (2.4, -2.4, '4'), (3.4, -2.0, '4')):
            X, Y = Hd.T(hx + x * s, hy + y * s); cv.put(X, Y, c)                      # 目と眉（にらむ目つき）
        # 手前の翼
        wing(cv, B, S((0, -38)), h['wing'], 30 * s, 12 * s, 'feather', True, WC)
        return cv.outlined()


def bird_frames(sp):
    return {k: draw_bird(sp, k) for k in BIRD}


# 人の姿の背中の翼：鳥の姿と同じ羽根の翼を小さく描く（立つと下へたたみ、動くと後ろ上へ広げる）
def back_wings(cv, hair, lean, hy):
    th = -62 if hair == 'hang' else 38
    for near in (False, True):
        wing(cv, Body(), (-3 + lean, -20 + hy), th, 17, 7, 'feather', near, ('F', 'f', 'g', 'Z', 'g'))


# ---------------- タカ（男）ソラン ----------------
HAWK_H = {
    'name': 'hawk', 'arm': ('S', 's'), 'weapon': 'claw',
    'pal': {
        'K': '#3a2410', 'H': '#c8963a', 'h': '#f0c870', 'n': '#f0c870',      # 金茶の髪
        'S': '#e8b48a', 's': '#b4764e', 'E': '#c87a10',                    # 鋭い金の目
        'B': '#e8e0c8', 'b': '#a89c80', 'L': '#ffffff',                    # 白い上着
        'Y': '#2a6a8a', 'y': '#183e54',                                    # 青い帯
        'P': '#5a4a3a', 'p': '#3a2e24', 'Q': '#1e1810',
        'W': '#6a4a2a', 'w': '#3e2a16', 'V': '#1e140a', 'M': '#ffffff',
        'F': '#b07a40', 'f': '#7a4a24', 'g': '#3e2410', 'Z': '#f4e6c4',    # 茶色の翼・白い前縁
    },
    'head': [
        "....KKKK.....",
        "..KKHHHHKK...",
        ".KHHhhHHHHK..",
        "KHHHHHHHHHhK.",
        "KHHHHHHHHHHK.",
        "KHHHHSSHHSSK.",
        "KHHHSSSSSES..",
        ".KHHSSSSSES..",
        "KHHKsSSSSSSS.",
        ".K.KssSSSSs..",
        "....ssssSs...",
        ".......ss....",
    ],
    'torso': [
        "...bBBBBBLs.",
        "...bBBBBBBL.",
        "...bBBBBSBB.",
        "...bbBBBSBB.",
        "...bbBBBBBB.",
        "...bbBBBBBb.",
        "...yYYYYYYy.",
        "...bbBBBBBbb",
        "...ppPPPPPp.",
        "...ppPPPPPp.",
        "...ppPPPPpp.",
    ],
}
HAWK_H['back_fn'] = back_wings
HAWK_B = {
    'name': 'hawk_b', 'scale': 1.0, 'bars': True, 'streak': True, 'hook': True, 'cap': True, 'beak_len': 4, 'tail_len': 14,
    'breast': ('5', '5', '6'), 'foot': MFOOT, 'cut': 18, 'cutx': -4,
    'pal': {
        '1': '#c8945a', '2': '#9a6434', '3': '#5e3a1c', '&': '#3a2210', '4': '#2e1c10',
        '5': '#f6e8c8', '6': '#b08a5a', '7': '#2a2a30', '8': '#f0c030', '9': '#ffffff', '0': '#ffd030',
    },
}

# ---------------- カラス（女）ネリ ----------------
CROW_H = {
    'name': 'crow', 'arm': ('S', 's'), 'weapon': 'claw',
    'pal': {
        'K': '#0e0e18', 'H': '#2a2a40', 'h': '#5a5a80', 'n': '#5a5a80',      # 黒い髪（青い光沢）
        'S': '#f0d0b4', 's': '#c09478', 'E': '#c02020',                    # 赤い目
        'B': '#2e2e44', 'b': '#1a1a28', 'L': '#5a5a7a',                    # 黒い服
        'Y': '#8a2a8a', 'y': '#501850',                                    # 紫の帯
        'P': '#2a2a38', 'p': '#181822', 'Q': '#0c0c12',
        'W': '#2a2a34', 'w': '#16161e', 'V': '#0a0a0e', 'M': '#ffffff',
        'F': '#3a3a58', 'f': '#24243a', 'g': '#0e0e18', 'Z': '#7a7aa8',    # 黒い翼（前縁は青く光る）
    },
    'head': [
        "....KKKK.....",
        "..KKHHHHKK...",
        ".KHHhhHHHHK..",
        "KHHHHHHHHHhK.",
        "KHHHHHHHHHHK.",
        "KHHHHSSHHSSK.",
        "KHHHSSSSSES..",
        "KHHHSSSSSES..",
        "KHHKsSSSSSSS.",
        "KHHKssSSSSs..",
        "KHHKssssSs...",
        ".KK....ss....",
    ],
    'torso': [
        "...bBBBBBBs.",
        "...bBBBBBLB.",
        "...bBBBBBBL.",
        "...bbBBBBBB.",
        "...bbBBBBBb.",
        "...bbBBBBBb.",
        "...yYYYYYYy.",
        "...bbBBBBBb.",
        "...bbBBBBBbb",
        "...bbBBBBBbb",
        "...bbbBBBbbb",
    ],
}
CROW_H['back_fn'] = back_wings
CROW_B = {
    'name': 'crow_b', 'scale': 0.88, 'bars': False, 'streak': False, 'hook': False, 'cap': False, 'beak_len': 6, 'beak_w': 2.2, 'tail_len': 13,
    'foot': MFOOT, 'cut': 16, 'cutx': -6,
    'pal': {
        '1': '#4c4c6a', '2': '#2e2e44', '3': '#1a1a28', '&': '#0e0e16', '4': '#08080c',
        '5': '#5a5a7a', '6': '#3a3a52', '7': '#24242c', '8': '#3a3a46', '9': '#ffffff', '0': '#e02828',
    },
}

FRAMES = {
    'hawk': (HAWK_H, human_frames(HAWK_H, upright=True)),
    'hawk_b': (HAWK_B, bird_frames(HAWK_B)),
    'crow': (CROW_H, human_frames(CROW_H, upright=True)),
    'crow_b': (CROW_B, bird_frames(CROW_B)),
}

# ---------------- 2026-11-23 男女共通にするため追加 ----------------
# タカ（女）セイラ：白銀の長い髪・水色の上着・青い帯・背中に茶色の翼。化身は男と同じタカ
HAWK_F = dict(HAWK_H, name='hawk_f', thin=True,
    pal=dict(HAWK_H['pal'], S='#f0c49a', s='#c88a60', R='#d84a6a', K='#5a5a72', H='#d4d4e4', h='#ffffff',
             B='#cce0f0', b='#7a9ab8', L='#ffffff'),
    head=[
        "....KKKKK....",
        "..KKHHHHHK...",
        ".KHHhhHHHHK..",
        "KHHHHHHHHHhK.",
        "KHHHHHHHHHHK.",
        "KHHHHSHHHSSK.",
        "KHHHSSSSSKS..",
        "KHHHSSSSSES..",
        "KHHHSSSSSES..",
        "KHHHsSSSSSS..",
        "KHHKKssSSRs..",
        ".KK....sss...",
    ],
    torso=[
        "....bBBBBL..",
        "...bBBBBBBL.",
        "...bBBBBBBB.",
        "...bbBBBBBB.",
        "...bbBBBBBb.",
        "...bbBBBBBb.",
        "...yYYYYYYy.",
        "...bbBBBBBbb",
        "...ppPPPPPp.",
        "...ppPPPPPp.",
        "...ppPPPPpp.",
    ])

# カラス（男）ヨル：黒いはね髪（青い光沢）・赤い目・黒いコート・紫の帯・背中に黒い翼。化身は女と同じカラス
CROW_M = dict(CROW_H, name='crow_m',
    pal=dict(CROW_H['pal'], S='#e8c4a4', s='#b48a6c'),
    head=[
        "...K.KKK.K...",
        "..KHKHHHKHK..",
        ".KHHhhHHHHHK.",
        "KHHHHHHHHHhK.",
        "KHHHHHHHHHHK.",
        "KHHHHSSHHSSK.",
        ".KHHSSSSSES..",
        "KHHHSSSSSES..",
        ".KHKsSSSSSSS.",
        "..K.ssSSSSs..",
        "....ssssSs...",
        ".......ss....",
    ],
    torso=[
        "...bBBLBBBb.",
        "...bBBLBBBB.",
        "...bBBBLBBB.",
        "...bbBBLBBB.",
        "...bbBBBLBb.",
        "...bbBBBBBb.",
        "...yYYYYYYy.",
        "...bbBBBBBbb",
        "...bbBBBBBbb",
        "...ppPPPPPp.",
        "...ppPPPPpp.",
    ])

FRAMES['hawk_f'] = (HAWK_F, human_frames(HAWK_F, upright=True))
FRAMES['crow_m'] = (CROW_M, human_frames(CROW_M, upright=True))
