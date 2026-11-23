# 剣士以外のクラスの手描きパーツ（頭・胴）と色、コマの作り方。1文字＝1ドット、右向き
#   python tools/classes.py 見本.png  でコマ一覧
from fighter import frame

BASE_ROW = {'o': '#16121e'}

# ---------------- ソルジャー（男・槍）トマス ----------------
SOLDIER = {
    'name': 'soldier', 'weapon': 'lance', 'shaft': 20, 'butt': 10, 'head_len': 7,
    'pal': {
        'I': '#b4bccc', 'i': '#5e6680', 'e': '#ffffff',            # 鉄のかぶと
        'K': '#3a2414', 'H': '#6a4020',                            # 茶色の髪
        'S': '#f2c49a', 's': '#cc8a60', 'E': '#1e1a2a',
        'B': '#4c8c48', 'b': '#2c5a30', 'L': '#7cbc6c',            # 緑の服
        'P': '#6a5a48', 'p': '#40362a', 'Q': '#2a221a',            # 茶色のズボン
        'W': '#8a5632', 'w': '#4a2a18', 'V': '#3a2414',            # ブーツ
        'Y': '#c89a48', 'y': '#7a5a24', 'T': '#7a4a24',            # ベルト・たすき
        'J': '#b08048', 'j': '#6a4624',                            # 槍の柄
        'M': '#f4f8ff', 'm': '#9aa6c0', 'G': '#d8b850', 'g': '#7a6428',
    },
    'head': [
        "....iiiii....",
        "..iiIIIIIi...",
        ".iIIeIIIIIi..",
        ".iIIIIIIIIIi.",
        "iiiiiiiiiiiii",
        "...KHHSSSSSS.",
        "...KHSSSSSES.",
        "...KHSSSSSEs.",
        "...KHsSSSSSSS",
        "....KssSSSSs.",
        ".....sssSss..",
        ".......ss....",
    ],
    'torso': [
        "...bBBBBLLB.",
        "...bbTBBBBLB",
        "...bbBTBBBBB",
        "...bbBBTBBBB",
        "...bbBBBTBBB",
        "...bbBBBBTBb",
        "...yYYYYYYYy",
        "...bbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
}

# ---------------- 戦士（斧）ボルグ ----------------
WARRIOR = {
    'name': 'warrior', 'weapon': 'axe', 'handle': 15, 'axe_butt': 7, 'two_hand': 5, 'arm': ('S', 's'), 'bracer': True,
    'pal': {
        'N': '#3c9a44', 'n': '#226030',                            # バンダナ
        'S': '#d89a6a', 's': '#a8683e', 'E': '#1e1a2a',            # 日焼けした肌
        'D': '#6a3a1e', 'd': '#3e200e',                            # ひげ
        'T': '#9a6430', 't': '#62381a', 'F': '#d8c8a0',            # 皮のベスト・毛皮
        'P': '#5a5a7a', 'p': '#38384e', 'Q': '#24243a',            # ズボン
        'W': '#6a4020', 'w': '#3e2410', 'V': '#2e1a0c',            # ブーツ
        'Y': '#d0a040', 'y': '#8a6420',                            # ベルト
        'J': '#9a6434', 'j': '#5a3818', 'g': '#5a3818',            # 柄
        'M': '#f4f8ff', 'A': '#b8c2d2', 'm': '#8a92a6', 'a': '#5a6276',   # 斧の刃
    },
    'head': [
        "....nNNNNN...",
        "...nNNNNNNN..",
        "..nNNNNNNNNN.",
        "nnnnnnnnnnnN.",
        "n.nsSSSSSSS..",
        "n..sSSSSSES..",
        "...sSSSSSSSS.",
        "...sDSSSSSSS.",
        "...dDDSSDDDD.",
        "...dDDDDDDD..",
        "....dDDDDD...",
        ".....ddDd....",
    ],
    'torso': [
        "..FFFFFFFFF.",
        ".FtTTSSSSTTF",
        "sstTTSSSSTTS",
        "sstTTSSSSTTS",
        ".stTTTSSTTTS",
        "..ttTTTTTTTT",
        "..ttTTTTTTTT",
        "..yYYYYYYYYy",
        "..pttTTTTTTt",
        "..ppPPPPPPPp",
        "..ppPPPPPPP.",
    ],
}

# ---------------- 魔道士（女・魔道書）リーネ ----------------
MAGE = {
    'name': 'mage', 'weapon': 'tome', 'robe': True,
    'pal': {
        'K': '#5a1a14', 'H': '#c0402c', 'h': '#ec7a4c',            # 赤い髪
        'S': '#f6d0aa', 's': '#d49a72', 'E': '#1a3a2a', 'R': '#d84a6a',
        'G': '#f0d060', 'g': '#a08020',                            # 金の額飾り
        'B': '#2e7a6a', 'b': '#1a4a42', 'L': '#5ab0a0',            # 緑のローブ
        'C': '#2e7a6a', 'c': '#1a4a42',
        'Y': '#e8c860', 'y': '#9a7a2a',                            # 金のふち
        'P': '#3a3448', 'p': '#24202e', 'Q': '#18141e',            # 黒いタイツ
        'W': '#7a4a2a', 'w': '#46281a', 'V': '#2e1a10',            # ブーツ
        'X': '#8a2a2a', 'x': '#4a1418', 'Z': '#b44a3a',            # 赤い表紙の魔道書
        'F': '#f4ecd4', 'f': '#b8a888',                            # ページ
    },
    'head': [
        "....KKKKKK...",
        "..KKHHHHHhK..",
        ".KHHHHHHHHhK.",
        ".KHHHHHHHHhhK",
        ".KHgGGGGGRGGK",
        ".KHHHHSHHHSSK",
        ".KHHHSSSSSKS.",
        ".KHHHSSSSSES.",
        ".KHHHSSSSSES.",
        ".KHHHsSSSSSS.",
        ".KHHKssSSRs..",
        "..KK...sss...",
    ],
    'torso': [
        "...YbBBBLL..",
        "...bYYBBBLB.",
        "...bbBYYBBLB",
        "...bbBBBYBBB",
        "...bbBBBBBBB",
        "...bbBBBBBBb",
        "..yyYYYYYYYy",
        "..cbBBBBBBbb",
        "..cbBBBBBBbb",
        "..ccCCCCCCCC",
        "..ccCCCCCCCC",
    ],
}


def frames_lance(ch):
    rh, ra = (7, -16), -27
    return {
        'idle':  frame(ch, 'stand', (6, -16), -63, back=(-3, -14)),
        'run1':  frame(ch, 'run1', rh, ra, lean=2, hy=1, back=(-6, -15)),
        'run2':  frame(ch, 'run2', rh, ra, lean=2, hy=1, back=(-3, -14)),
        'run3':  frame(ch, 'run3', rh, ra, lean=2, hy=1, back=(2, -15)),
        'run4':  frame(ch, 'run4', rh, ra, lean=2, hy=1, back=(-3, -14)),
        'ready': frame(ch, 'crouch', (1, -17), 0, lean=-1, back=(-6, -16)),
        'thrust': frame(ch, 'lunge', (14, -20), 0, lean=4, back=(-6, -18)),
        'hurt':  frame(ch, 'back', (5, -15), 27, lean=-3, back=(-6, -13)),
        'dodge': frame(ch, 'back', (3, -17), -63, lean=-5, back=(-7, -15)),
        'crouch': frame(ch, 'crouch', (6, -15), -27, lean=2, back=(-4, -12)),
        'plunge': frame(ch, 'crouch', (7, -27), 63, lean=1, back=(-4, -24)),
        # 追撃：突いた槍を頭上へ振り上げ → 踏み込んで穂先を叩きつける（打ち下ろし）
        'lift':  frame(ch, 'stand', (3, -37), 0, lean=-1, arm_behind=True),
        'smash': frame(ch, 'lunge', (13, -17), 27, lean=4, back=(-5, -16)),
    }


def frames_axe(ch):
    rh, ra = (7, -16), -45
    return {
        'idle':  frame(ch, 'stand', (6, -16), -63, back=(-3, -14)),
        'run1':  frame(ch, 'run1', rh, ra, lean=2, hy=1, back=(-6, -15)),
        'run2':  frame(ch, 'run2', rh, ra, lean=2, hy=1, back=(-3, -14)),
        'run3':  frame(ch, 'run3', rh, ra, lean=2, hy=1, back=(2, -15)),
        'run4':  frame(ch, 'run4', rh, ra, lean=2, hy=1, back=(-3, -14)),
        'raise': frame(ch, 'stand', (-1, -38), 135, lean=-1, arm_behind=True),
        'swing': frame(ch, 'lunge', (12, -19), 27, lean=3, back=(-5, -16)),
        'follow': frame(ch, 'lunge', (12, -19), 45, lean=4, hy=0, back=(-5, -14)),
        'hurt':  frame(ch, 'back', (5, -15), 63, lean=-3, back=(-6, -13)),
        'dodge': frame(ch, 'back', (3, -17), -90, lean=-5, back=(-7, -15)),
        'crouch': frame(ch, 'crouch', (8, -14), -27, lean=2, back=(-4, -12)),
        # 追撃：振り抜いた斧を返し、踏み込みながら下から斜めに斬り上げる
        'upswing': frame(ch, 'lunge', (9, -27), -45, lean=2, hy=-1, back=(-5, -17)),
    }


def frames_tome(ch):
    rh = (6, -17)
    return {
        'idle':  frame(ch, 'stand', (5, -16), -1, back=(-3, -14)),
        'run1':  frame(ch, 'run1', rh, -1, lean=2, hy=1, back=(-6, -15)),
        'run2':  frame(ch, 'run2', rh, -1, lean=2, hy=1, back=(-3, -14)),
        'run3':  frame(ch, 'run3', rh, -1, lean=2, hy=1, back=(2, -15)),
        'run4':  frame(ch, 'run4', rh, -1, lean=2, hy=1, back=(-3, -14)),
        'cast':  frame(ch, 'back', (13, -21), 1, lean=1, back=(-5, -16)),
        'raise': frame(ch, 'stand', (6, -35), 1, lean=0, back=(-6, -27)),
        'hurt':  frame(ch, 'back', (4, -14), -1, lean=-3, back=(-6, -13)),
        'dodge': frame(ch, 'back', (2, -17), -1, lean=-5, back=(-7, -15)),
        'crouch': frame(ch, 'crouch', (7, -16), 1, lean=2, back=(-4, -13)),
    }


# ---------------- アーチャー（男・弓）ロイド ----------------
ARCHER = {
    'name': 'archer', 'weapon': 'bow', 'bow_h': 11, 'fist_outline_on': 'SsBbLTt',
    'pal': {
        'N': '#3e7a3a', 'n': '#244a22', 'R': '#d03a3a', 'r': '#7a1e22',   # 緑の帽子・赤い羽
        'K': '#6a4418', 'H': '#c08a3a',                                  # 金茶の髪
        'S': '#f2c49a', 's': '#cc8a60', 'E': '#1e1a2a',
        'B': '#b08a52', 'b': '#7a5a30', 'L': '#d8b478',                  # 皮の上着
        'T': '#5a3a1c', 't': '#3a2410',                                  # 矢筒の帯
        'P': '#4e6a3a', 'p': '#30442a', 'Q': '#1e2a1a',                  # 緑のズボン
        'W': '#8a5632', 'w': '#4a2a18', 'V': '#3a2414',
        'Y': '#c89a48', 'y': '#7a5a24',
        'J': '#c08a48', 'j': '#7a5424', 'G': '#e0c060', 'k': '#cfc6b0',  # 弓・弦
        'U': '#a07848', 'M': '#f4f8ff', 'm': '#9aa6c0',                  # 矢
    },
    'head': [
        "........RR...",
        "....nNNNNRr..",
        "...nNNNNNNN..",
        "..nNNNNNNNNN.",
        "..nnnnnnnnnnn",
        "...KHHSSSSSS.",
        "...KHSSSSSES.",
        "...KHSSSSSEs.",
        "...KHsSSSSSSS",
        "....KssSSSSs.",
        ".....sssSss..",
        ".......ss....",
    ],
    'torso': [
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
    # 背中の矢筒（体の後ろ）
    'cape': {k: ([
        "..R.R",
        ".RRRR",
        ".TttT",
        ".TttT",
        "TttT.",
        "TttT.",
        "TttT.",
        "Ttt..",
        "Tt...",
    ], -9, -27) for k in ('hang', 'flow')},
}

# ---------------- シーフ（男・ナイフ）ジン ----------------
THIEF = {
    'name': 'thief', 'blade': 7, 'thin': True,
    'pal': {
        'N': '#4a4a6a', 'n': '#2a2a40',                                  # 灰紫のフード
        'K': '#2a1a10', 'H': '#5a3a20',
        'S': '#f2c49a', 's': '#cc8a60', 'E': '#1e1a2a', 'e': '#ffffff',
        'R': '#d04040', 'r': '#7a2028',                                  # 赤いスカーフ
        'B': '#5a6a7a', 'b': '#36424e', 'L': '#8a9aaa',                  # 灰色の上着
        'P': '#3a3a4a', 'p': '#24242e', 'Q': '#141418',
        'W': '#5a4030', 'w': '#34241a', 'V': '#1e140e',
        'Y': '#8a6a3a', 'y': '#5a4424',
        'M': '#f8fbff', 'm': '#a8b2c8', 'n2': '#000',
        'G': '#b0a070', 'g': '#6a5a30', 'U': '#3a2418',
    },
    'head': [
        ".....nnnn....",
        "...nnNNNNn...",
        "..nNNNNNNNn..",
        ".nNNNNNNNNNn.",
        ".nNNKHHHHHHn.",
        ".nNNKHSSSSSS.",
        ".nNNKSSSSSES.",
        ".nNNKSSSSSEs.",
        "..nNKsSSSSSSS",
        "..nNNssSSSSs.",
        "...rRRRRRRR..",
        "...rRRRRRr...",
    ],
    'torso': [
        "..rRbBBBBLLB",
        ".rR.bBBBBBLB",
        "rr..bBBBBBBB",
        "r...bBBBBBBB",
        "...bbBBBBBBB",
        "...bbBBBBBBb",
        "...yYYYYYYYy",
        "...bbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
}
del THIEF['pal']['n2']

# ---------------- クレリック（女・光魔法）セラ ----------------
CLERIC = {
    'name': 'cleric', 'weapon': 'tome', 'robe': True,
    'pal': {
        'I': '#f4f4fc', 'i': '#a4a8c8',                                  # 白いベール
        'G': '#e8c860', 'g': '#9a7a2a',
        'K': '#8a6a20', 'H': '#f0d070', 'h': '#fff0a8',                  # 金の髪
        'S': '#f8d8b8', 's': '#d8a07c', 'E': '#2a4a8a', 'R': '#e07090',
        'B': '#eceaf6', 'b': '#b0aed0', 'L': '#ffffff',                  # 白いローブ
        'C': '#eceaf6', 'c': '#b0aed0',
        'Y': '#4a6ad8', 'y': '#2a3a8a',                                  # 青いふち
        'P': '#6a6a8a', 'p': '#44445a', 'Q': '#2a2a3a',
        'W': '#a0805a', 'w': '#5a4430', 'V': '#3a2a1a',
        'X': '#e8d080', 'x': '#8a7030', 'Z': '#fff4c0',                  # 光の魔道書（金の表紙）
        'F': '#ffffff', 'f': '#c8c8d8',
    },
    'head': [
        "....iiiiii...",
        "..iiIIIIIIi..",
        ".iIIIIIIIIIi.",
        ".iIIIIIIIIIIi",
        ".iIIIGGGGGGGi",
        ".iIIHHHHHHHH.",
        ".iIIHHSSSSHS.",
        ".iIIHSSSSSES.",
        ".iIIISSSSSES.",
        ".iIIIsSSSSSS.",
        ".iIIissSSRs..",
        "..ii...sss...",
    ],
    'torso': [
        "..iIbBBBLL..",
        "..iIYYBBBBLB",
        "..iIbBYYBBBB",
        "..iibBBBYBBB",
        "...bbBBBBBBB",
        "...bbBBBBBBb",
        "..yyYYYYYYYy",
        "..cbBBBBBBbb",
        "..cbBBBBBBbb",
        "..ccCCCCCCCC",
        "..ccCCCCCCCC",
    ],
}


def frames_bow(ch):
    rh = (10, -15)
    return {
        'idle':  frame(ch, 'stand', (10, -14), 0, back=(-3, -14)),
        'run1':  frame(ch, 'run1', rh, 0, lean=2, hy=1, back=(-6, -15)),
        'run2':  frame(ch, 'run2', rh, 0, lean=2, hy=1, back=(-3, -14)),
        'run3':  frame(ch, 'run3', rh, 0, lean=2, hy=1, back=(2, -15)),
        'run4':  frame(ch, 'run4', rh, 0, lean=2, hy=1, back=(-3, -14)),
        'aim':   frame(ch, 'stand', (13, -21), 1, lean=0, pull=(1, -21)),
        'shot':  frame(ch, 'stand', (13, -21), 2, lean=-1, back=(-7, -22)),
        'kneel': frame(ch, 'crouch', (13, -21), 1, lean=1, pull=(1, -21)),
        'hurt':  frame(ch, 'back', (8, -14), 0, lean=-3, back=(-6, -13)),
        'dodge': frame(ch, 'back', (8, -16), 0, lean=-5, back=(-7, -15)),
        'crouch': frame(ch, 'crouch', (10, -15), 0, lean=2, back=(-4, -13)),
    }


def frames_knife(ch):
    # 二刀流・逆手持ち：両手にダガー。刃は小指側（こぶしの下）から出る
    # 重心を低く・上半身は前傾。手前の腕を前に突き出して牽制、奥の腕は腰に引いて構える
    R = 117          # 逆手の刃の向き（下、やや後ろ）
    rh = (11, -17)
    return {
        'idle':  frame(ch, 'low', (12, -19), R, lean=3, hy=1, back=(-10, -14), back_ang=R),
        'run1':  frame(ch, 'run1', rh, R, lean=4, hy=3, back=(-6, -15), back_ang=R),
        'run2':  frame(ch, 'run2', rh, R, lean=4, hy=3, back=(-3, -14), back_ang=R),
        'run3':  frame(ch, 'run3', rh, R, lean=4, hy=3, back=(1, -15), back_ang=R),
        'run4':  frame(ch, 'run4', rh, R, lean=4, hy=3, back=(-3, -14), back_ang=R),
        'raise': frame(ch, 'low', (-1, -16), R, lean=2, hy=1, back=(-10, -14), back_ang=R),
        'swing': frame(ch, 'lunge', (16, -18), 153, lean=5, hy=1, back=(-10, -14), back_ang=R),
        'thrust': frame(ch, 'lunge', (15, -21), 90, lean=5, hy=1, back=(-10, -14), back_ang=R),
        'hurt':  frame(ch, 'back', (6, -16), R, lean=-3, back=(-6, -13), back_ang=R),
        'dodge': frame(ch, 'back', (5, -18), R, lean=-5, back=(-7, -15), back_ang=R),
        'crouch': frame(ch, 'low', (13, -16), R, lean=4, hy=2, back=(-10, -13), back_ang=R),
        # 追撃：振り向かず、左手（奥の手）の逆手ダガーで真後ろを突き刺す
        'backstab': frame(ch, 'low', (10, -16), R, lean=1, hy=1, back=(-15, -19), back_ang=180),
    }


# ---------------- 重歩兵（男・槍と大盾）ガルド ----------------
ARMOR = {
    'name': 'armor', 'weapon': 'lance', 'shaft': 18, 'butt': 8, 'head_len': 7, 'arm': ('I', 'i'),
    'pal': {
        'I': '#a8b4c8', 'i': '#5a6680', 'e': '#e8f0ff', 'U': '#a8b4c8', 'u': '#5a6680', 'v': '#e8f0ff', 'k': '#3a4258',   # 鋼の鎧
        'R': '#c03a3a', 'r': '#7a2028',                                  # 赤い房飾り・盾の地
        'S': '#f2c49a', 's': '#cc8a60', 'E': '#1e1a2a',
        'P': '#8a96ac', 'p': '#4e5a72', 'Q': '#343c50',                  # 脚の鎧
        'W': '#6a7690', 'w': '#3a4258', 'V': '#262c3c',                  # 鉄の靴
        'Y': '#d8b048', 'y': '#8a6a24',
        'J': '#9a7448', 'j': '#5e4428',
        'M': '#f4f8ff', 'm': '#9aa6c0', 'G': '#e0c060', 'g': '#8a7028',
        'B': '#3a5ab0', 'b': '#243a78',                                  # 盾の青
    },
    'head': [
        "......RR.....",
        "....RRrUu....",
        "..uUUUUUUUu..",
        ".uUvUUUUUUUu.",
        ".uUvUUUUUUUUu",
        ".uUUUUUUuuuuu",
        ".uUUUUUUkESSk",
        ".uUUUUUUkkkkk",
        ".uUUUUUUUUUUu",
        ".uuUUUUUUUUu.",
        "..uuUUUUUuu..",
        "...uuuuuuu...",
    ],
    'torso': [
        ".iiIIIIIIIi..",
        "iIIeIIIIIIIi.",
        "iIeIIIIIIIIIi",
        "iIIIIIIIIIIIi",
        ".iIIIIIIIIIi.",
        ".iIIIIIIIIIi.",
        ".yYYYYYYYYYy.",
        ".iIIIIIIIIIi.",
        ".iIIiIIIiIIi.",
        ".iiIIiiiIIii.",
        "..iiIIIIIii..",
    ],
    'shield': [
        ".GGGGGGG.",
        "GBBBBBBBG",
        "GBBBBBBBG",
        "GBBYYYBBG",
        "GBYYeYYBG",
        "GBBYYYBBG",
        "GBBBBBBBG",
        "GbBBBBBbG",
        "GbBBBBBbG",
        ".GbBBBbG.",
        "..GbbbG..",
        "...GGG...",
    ],
}

# ---------------- バンデット（男・斧）ゴズ ----------------
BANDIT = {
    'name': 'bandit', 'weapon': 'axe', 'handle': 14, 'axe_butt': 7, 'two_hand': 5, 'arm': ('S', 's'),
    'axe_spans': [(-1, 1), (-1, 1), (-2, 2), (-3, 3), (-4, 4), (-4, 4), (-3, 3)],
    'fist_outline_on': 'SsF',
    'pal': {
        'S': '#c8865a', 's': '#8e5434', 'E': '#1e1a2a',                  # 日焼けした肌
        'R': '#c83030', 'r': '#7a1a1a',                                  # 赤い鉢巻
        'D': '#4a2a16', 'd': '#2a160a',                                  # 無精ひげ
        'F': '#a08060', 'f': '#5a4430',                                  # 毛皮の肩当て
        'P': '#7a4a30', 'p': '#4a2a18', 'Q': '#2a180c',                  # 茶色のズボン
        'W': '#4a3424', 'w': '#2a1c12', 'V': '#1a100a',
        'Y': '#5a3a1a', 'y': '#3a240e',                                  # 太いベルト
        'J': '#8a5a2c', 'j': '#4e3016', 'g': '#4e3016',
        'M': '#e8ecf4', 'A': '#a0a8b8', 'm': '#7a8294', 'a': '#4a5062',  # 使い込んだ刃
    },
    'head': [
        ".....sss.....",
        "...sSSSSSs...",
        "..sSSSSSSSS..",
        ".sSSSSSSSSSS.",
        "rRRRRRRRRRRR.",
        "r.sSSSSSSSS..",
        "..sSSSSSESS..",
        "..sSSSSSSSSS.",
        "..sDSSSSSSSS.",
        "..dDDSSDDDD..",
        "...dDDDDDD...",
        "....ddddd....",
    ],
    'torso': [
        ".fFFFsSSSS...",
        "fFFFFsSSSSS..",
        "fFFsSSsSSSSS.",
        ".ssSSSSsSSSSs",
        "..sSSSSSSSSs.",
        "..sSSsSSSSs..",
        "..ssSSSSSSs..",
        "..yYYYYYYYYy.",
        "..pPPPPPPPPp.",
        "..ppPPPPPPPp.",
        "..ppPPPPPPP..",
    ],
}

# ---------------- ソルジャー（女・槍を両手で）ミラ ----------------
SOLDIER_F = {
    'name': 'soldier_f', 'weapon': 'lance', 'shaft': 20, 'butt': 10, 'head_len': 7, 'two_hand': 7,
    'fist_outline_on': 'BbLT',
    'pal': {
        'K': '#4a2a14', 'H': '#9a5a2a', 'h': '#c8884a',                  # 栗色の髪
        'I': '#b4bccc', 'i': '#5e6680',                                  # 鉄の額当て
        'S': '#f6d0aa', 's': '#d49a72', 'E': '#2a3a6a', 'R': '#d84a6a',
        'B': '#3a6ab0', 'b': '#24427a', 'L': '#6a9ad8',                  # 青い服
        'T': '#8a5a30', 't': '#5a381a',                                  # 皮の胸当て
        'P': '#5a4a3a', 'p': '#3a3024', 'Q': '#221c14',
        'W': '#8a5632', 'w': '#4a2a18', 'V': '#3a2414',
        'Y': '#c89a48', 'y': '#7a5a24',
        'J': '#b08048', 'j': '#6a4624',
        'M': '#f4f8ff', 'm': '#9aa6c0', 'G': '#d8b850', 'g': '#7a6428',
    },
    'head': [
        "....KKKKKK...",
        "..KKHHHHHhK..",
        ".KHHHHHHHHhK.",
        ".KHHHHHHHHhhK",
        ".KHiIIIIIIIIK",
        ".KHHHHSHHHSSK",
        ".KHHHSSSSSKS.",
        ".KHHHSSSSSES.",
        "..KHHSSSSSES.",
        "..KHHsSSSSSS.",
        "...KHssSSRs..",
        "....K..sss...",
    ],
    'torso': [
        "....bBBBLL..",
        "...bbTTTTLB.",
        "...bbTTTTTLB",
        "...bbtTTTTTB",
        "...bbtTTTTTB",
        "...bbBBBBBBb",
        "..yyYYYYYYYy",
        ".bbbbBBBBBbb",
        ".b.bbBBBBBbb",
        "..bbBBBBBBBb",
        "..bbbbbbbbbb",
    ],
}

# ---------------- 魔道士（男・炎）ユーリ ----------------
MAGE_M = {
    'name': 'mage_m', 'weapon': 'tome', 'robe': True,
    'pal': {
        'N': '#8a2a24', 'n': '#4e1410',                                  # 深紅のフード
        'K': '#2a1a10', 'H': '#4a3020',
        'S': '#f2c49a', 's': '#cc8a60', 'E': '#1e1a2a',
        'B': '#a83a2a', 'b': '#64201a', 'L': '#d8644a',                  # 赤いローブ
        'C': '#a83a2a', 'c': '#64201a',
        'Y': '#e8b040', 'y': '#8a6420',                                  # 金のふち
        'P': '#3a3040', 'p': '#241e2a', 'Q': '#141018',
        'W': '#5a3a24', 'w': '#341f12', 'V': '#1e120a',
        'X': '#3a2a5a', 'x': '#1e1430', 'Z': '#5a4a8a', 'G': '#ff8a3a',  # 黒い表紙に炎の印
        'F': '#f4ecd4', 'f': '#b8a888',
    },
    'head': [
        ".....nnnn....",
        "...nnNNNNn...",
        "..nNNNNNNNn..",
        ".nNNNNNNNNNn.",
        ".nNNKHHHHHHN.",
        ".nNNKHSSSSSS.",
        ".nNNKSSSSSES.",
        ".nNNKSSSSSEs.",
        "..nNKsSSSSSSS",
        "..nNNssSSSSs.",
        "...nNNsssss..",
        "....nnn......",
    ],
    'torso': [
        ".nNNbBBBLL..",
        ".nNbbYBBBLB.",
        "..nbbBYBBBLB",
        "...bbBBYBBBB",
        "...bbBBBBBBB",
        "...bbBBBBBBb",
        "..yyYYYYYYYy",
        "..cbBBBBBBbb",
        "..cbBBBBBBbb",
        "..ccCCCCCCCC",
        "..ccCCCCCCCC",
    ],
}


def frames_armor(ch):
    # 重歩兵：左手（奥）の大盾を体の前に構え、右手（手前）の槍を盾の横から突き出す。重いので走らずに歩く
    sh = (2, -26)
    wh, wa = (8, -15), -27
    return {
        'idle':  frame(ch, 'stand', (8, -15), -63, shield=sh),
        'run1':  frame(ch, 'run1', wh, wa, lean=1, shield=sh),
        'run2':  frame(ch, 'stand', wh, wa, lean=1, hy=1, shield=sh),
        'run3':  frame(ch, 'run3', wh, wa, lean=1, shield=sh),
        'run4':  frame(ch, 'stand', wh, wa, lean=1, hy=1, shield=sh),
        'ready': frame(ch, 'crouch', (3, -17), 0, lean=0, shield=(3, -26)),
        'thrust': frame(ch, 'lunge', (15, -18), 0, lean=3, shield=(3, -26)),
        'bash':  frame(ch, 'lunge', (5, -15), -27, lean=4, shield=(7, -27)),
        'hurt':  frame(ch, 'back', (5, -14), 27, lean=-2, shield=(0, -25)),
        'dodge': frame(ch, 'back', (5, -15), -63, lean=-3, shield=(1, -26)),
        'crouch': frame(ch, 'crouch', (6, -14), -27, lean=1, shield=(4, -26)),
    }


def frames_lance2(ch):
    # 両手槍：前の手（手前）と後ろの手（奥・石突き寄り）で柄を握り、腰の高さで穂先を相手に向ける
    rh, ra = (9, -16), -27
    return {
        'idle':  frame(ch, 'stand', (8, -17), -27, lean=1),
        'run1':  frame(ch, 'run1', rh, ra, lean=2, hy=1, hair='flow'),
        'run2':  frame(ch, 'run2', rh, ra, lean=2, hy=1, hair='flow'),
        'run3':  frame(ch, 'run3', rh, ra, lean=2, hy=1, hair='flow'),
        'run4':  frame(ch, 'run4', rh, ra, lean=2, hy=1, hair='flow'),
        'ready': frame(ch, 'crouch', (5, -17), 0, lean=0),
        'thrust': frame(ch, 'lunge', (15, -19), 0, lean=4, hair='flow'),
        'hurt':  frame(ch, 'back', (6, -15), 27, lean=-3, hair='flow'),
        'dodge': frame(ch, 'back', (5, -17), -63, lean=-5, hair='flow'),
        'crouch': frame(ch, 'crouch', (8, -15), -27, lean=2),
        # 追撃：槍を体の後ろへ大きく引き → 腰をひねって横に薙ぎ払う
        'wind':  frame(ch, 'crouch', (2, -20), -153, lean=-1),
        'sweep': frame(ch, 'lunge', (14, -20), -27, lean=5, hair='flow'),
    }


def frames_bandit(ch):
    # バンデット：大きな斧を両手で。待機は刃を前に下げて構え、頭の上まで振りかぶって全身で振り下ろす
    rh, ra = (7, -16), -45
    return {
        'idle':  frame(ch, 'stand', (8, -17), 27),
        'run1':  frame(ch, 'run1', rh, ra, lean=2, hy=1),
        'run2':  frame(ch, 'run2', rh, ra, lean=2, hy=1),
        'run3':  frame(ch, 'run3', rh, ra, lean=2, hy=1),
        'run4':  frame(ch, 'run4', rh, ra, lean=2, hy=1),
        'raise': frame(ch, 'stand', (-1, -38), 135, lean=-1, arm_behind=True),
        'swing': frame(ch, 'lunge', (12, -19), 27, lean=3),
        'follow': frame(ch, 'lunge', (12, -21), 45, lean=4),
        'hurt':  frame(ch, 'back', (5, -16), 27, lean=-3),
        'dodge': frame(ch, 'back', (4, -17), -45, lean=-5),
        'crouch': frame(ch, 'crouch', (8, -14), -27, lean=2),
    }



# ---------------- レンジャー（男・剣）カイ ----------------
# 徒歩の剣士（主人公らしい力強い片手剣）。幅広の剣を体ごと振る。オリジナルの見た目
RANGER = {
    'name': 'ranger', 'blade': 16, 'thin': False, 'bracer': True,
    'pal': {
        'K': '#24160e', 'H': '#4a2e1c', 'h': '#7a5232',                  # こげ茶の髪
        'S': '#f2c49a', 's': '#cc8a60', 'E': '#1e1a2a',
        'B': '#2e6a64', 'b': '#1a4440', 'L': '#5a9a90',                  # 深緑の上着
        'T': '#7a4a24', 't': '#4a2a12',                                  # 皮の肩当て・たすき
        'C': '#9a3a28', 'c': '#5e2016',                                  # 赤茶のマント
        'P': '#3e3a48', 'p': '#26222e', 'Q': '#141218',
        'W': '#6a4020', 'w': '#3e2410', 'V': '#2e1a0c',
        'Y': '#c89a48', 'y': '#7a5a24',
        'M': '#f4f8ff', 'm': '#b0bcd4', 'G': '#e0c060', 'g': '#8a7028', 'U': '#4a2a14',
    },
    'head': [
        "...K.KK.K....",
        "..KHKHHKHK...",
        ".KHHHHHHHhK..",
        "KHHHHHHHHHhK.",
        ".KHHHHHHHHHK.",
        "KHHHHSSHHSSK.",
        ".KHHSSSSSES..",
        "..KHSSSSSES..",
        "...KsSSSSSSS.",
        "....ssSSSSs..",
        ".....sssSs...",
        ".......ss....",
    ],
    'torso': [
        "...bBBBTTTt.",
        "...bbBTTTTTt",
        "...bbBBtTTTt",
        "...bbBTBBBBB",
        "...bbTBBBBBB",
        "...bTBBBBBBb",
        "...yYYYYYYYy",
        "...bbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
    'cape': {
        # 立ち：両肩から背中へ垂れて、ひざの上まで。すそは少し広がる
        'hang': ([
            "....CC",
            "...CCc",
            "..CCCc",
            "..CCCc",
            ".CCCCc",
            ".CCCcc",
            ".CCCcc",
            "CCCCcc",
            "CCCCcc",
            "CCCcc.",
            "CCCcc.",
            "CCCcc.",
            "CcCcc.",
            "c.cc..",
        ], -8, -23),
        # 動き：肩から後ろ下へ斜めに流れ（走る風を受けて後ろへ）、すそが波打つ
        'flow': ([
            "........CC",
            "......CCCc",
            ".....CCCcc",
            "....CCCCcc",
            "...CCCCcc.",
            "..CCCCcc..",
            "..CCCcc...",
            ".CCCCcc...",
            ".CCCcc....",
            "CCCcc.....",
            "CCcc......",
            "Cc.c......",
        ], -13, -23),
    },
}


def frames_hero(ch):
    # 片手の幅広剣：剣先を下げて構え、走るときは剣を後ろに流す。体ごとひねって大きく横に斬る
    rh, ra = (5, -15), 153
    return {
        # 待機：足を大きく開いて腰を落とし、剣を頭の上で水平に寝かせ、剣先を相手に向けて両手で構える
        'idle':  frame(ch, 'low', (1, -38), 0, lean=-1, hy=1, back=(-2, -37), arm_behind=True),
        'run1':  frame(ch, 'run1', rh, ra, lean=2, hy=1, back=(-6, -15), hair='flow'),
        'run2':  frame(ch, 'run2', rh, ra, lean=2, hy=1, back=(-3, -14), hair='flow'),
        'run3':  frame(ch, 'run3', rh, ra, lean=2, hy=1, back=(2, -15), hair='flow'),
        'run4':  frame(ch, 'run4', rh, ra, lean=2, hy=1, back=(-3, -14), hair='flow'),
        'raise': frame(ch, 'crouch', (-5, -30), -153, lean=-2, arm_behind=True),
        'swing': frame(ch, 'lunge', (13, -20), 0, lean=4, back=(-6, -18), hair='flow'),
        'follow': frame(ch, 'lunge', (11, -15), 45, lean=4, back=(-6, -17), hair='flow'),
        'hurt':  frame(ch, 'back', (5, -15), 45, lean=-3, back=(-6, -13), hair='flow'),
        'dodge': frame(ch, 'back', (3, -17), -63, lean=-5, back=(-7, -15), hair='flow'),
        'crouch': frame(ch, 'crouch', (8, -14), 27, lean=2, back=(-4, -12)),
        # 追撃：振り抜いた剣を返し、踏み込んで下から斜めに斬り上げる
        'low':   frame(ch, 'crouch', (10, -14), 153, lean=3, back=(-5, -13), hair='flow'),
        'upcut': frame(ch, 'lunge', (10, -30), -63, lean=2, hy=-1, back=(-6, -17), hair='flow'),
        # 必殺：高く跳んで剣を真上にかかげ → 落ちながら真下へ斬り下ろす
        'leap':  frame(ch, 'run2', (2, -38), -90, lean=0, arm_behind=True, hair='flow'),
        'dive':  frame(ch, 'lunge', (12, -18), 63, lean=4, back=(-6, -18), hair='flow'),
    }

# ---------------- アーチャー（女・弓）フィオ ----------------
# 赤みのある金髪のポニーテール・緑のはちまき・緑の上着に皮の胸当て・背中に矢筒
ARCHER_F = {
    'name': 'archer_f', 'weapon': 'bow', 'bow_h': 11, 'fist_outline_on': 'SsBbLTt', 'thin': True,
    'pal': {
        'K': '#6a3418', 'H': '#d88a3a', 'h': '#f4bc6a',                  # 赤みのある金髪
        'N': '#3e8a3a', 'n': '#245222',                                  # 緑のはちまき・髪ひも
        'S': '#f6d0aa', 's': '#d49a72', 'E': '#2a5a3a', 'R': '#d84a6a', 'r': '#7a1e22',
        'B': '#4e8a46', 'b': '#2e5a2a', 'L': '#82bc6e',                  # 緑の上着
        'T': '#8a5a30', 't': '#5a381a',                                  # 皮の胸当て・矢筒
        'P': '#6a5438', 'p': '#463624', 'Q': '#221c14',                  # 茶色のズボン
        'W': '#8a5632', 'w': '#4a2a18', 'V': '#3a2414',
        'Y': '#c89a48', 'y': '#7a5a24',
        'J': '#c08a48', 'j': '#7a5424', 'G': '#e0c060', 'k': '#cfc6b0',  # 弓・弦
        'U': '#a07848', 'M': '#f4f8ff', 'm': '#9aa6c0',                  # 矢
    },
    'head': [
        "....KKKKKK...",
        "..KKHHHHHhK..",
        ".KHHHHHHHhhK.",
        ".KHHHHHHHHhhK",
        ".KHnNNNNNNNNK",
        ".KHHHHSHHHSSK",
        ".KHHHSSSSSKS.",
        ".KHHHSSSSSES.",
        "..KHHSSSSSES.",
        "..KHHsSSSSSS.",
        "...KHssSSRs..",
        "....K..sss...",
    ],
    'torso': [
        "....bBBBLT..",
        "...bbBBBTLB.",
        "...bbBBTtTLB",
        "...bbBTtTTTB",
        "...bbTtTTTTB",
        "...bbBBBBBBb",
        "..yyYYYYYYYy",
        ".bbbbBBBBBbb",
        ".b.bbBBBBBbb",
        "..bbBBBBBBBb",
        "..bbbbbbbbbb",
    ],
    'tail': {
        'hang': ([
            "....nnK",
            "...KHHK",
            "..KHHhK",
            "..KHHh.",
            ".KHHH..",
            ".KHHh..",
            ".KHHh..",
            "KHHH...",
            "KHHh...",
            ".KH....",
            ".KK....",
        ], -9, -34),
        'flow': ([
            "..........nnK",
            "......KKKHHHK",
            "...KKHHHHHHh.",
            ".KKHHHHhhHh..",
            "KHHHHKK......",
            ".KK..........",
        ], -16, -34),
    },
    'cape': {k: ([
        "..R.R",
        ".RRRR",
        ".TttT",
        ".TttT",
        "TttT.",
        "TttT.",
        "TttT.",
        "Ttt..",
        "Tt...",
    ], -9, -27) for k in ('hang', 'flow')},
}

# ---------------- シーフ（女・ナイフ）ミア ----------------
# 青緑のショートボブ・赤い鉢巻・赤いスカーフ・黒紫の上着。二刀流・逆手持ちは男のシーフと同じ
THIEF_F = {
    'name': 'thief_f', 'blade': 7, 'thin': True,
    'pal': {
        'K': '#12303a', 'H': '#2a6a78', 'h': '#4aa0ae',                  # 青緑の髪
        'S': '#f6d0aa', 's': '#d49a72', 'E': '#1e1a2a', 'e': '#ffffff',
        'R': '#d04040', 'r': '#7a2028',                                  # 赤い鉢巻・スカーフ
        'B': '#4a3a62', 'b': '#2c2240', 'L': '#7a6a9a',                  # 黒紫の上着
        'P': '#3a3a4a', 'p': '#24242e', 'Q': '#141418',
        'W': '#5a4030', 'w': '#34241a', 'V': '#1e140e',
        'Y': '#8a6a3a', 'y': '#5a4424',
        'M': '#f8fbff', 'm': '#a8b2c8',
        'G': '#b0a070', 'g': '#6a5a30', 'U': '#3a2418',
    },
    'head': [
        "....KKKKKK...",
        "..KKHHHHHhK..",
        ".KHHHHHHHhhK.",
        ".KHHHHHHHHhhK",
        "rRRRRRRRRRRRK",
        "r.KHHHSHHHSSK",
        "..KHHSSSSSKS.",
        "..KHHSSSSSES.",
        "..KHHSSSSSES.",
        "..KHHsSSSSSS.",
        "...rRRRRRRR..",
        "...rRRRRRr...",
    ],
    'torso': [
        "..rRbBBBBLL.",
        ".rR.bBBBBBLB",
        "rr..bBBBBBBB",
        "r...bBBBBBBB",
        "...bbBBBBBBB",
        "...bbBBBBBBb",
        "..yyYYYYYYYy",
        "...bbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
}


# ---------------- 神官（男・光魔法）オルテ（2026-11-23 追加） ----------------
# 白い帽子・こげ茶の短い髪・白いローブに緑のふちと金の帯（ストラ）。動きはクレリックと同じ
PRIEST = dict(CLERIC, name='priest',
    pal=dict(CLERIC['pal'], I='#f4f4fc', i='#a4a8c8', G='#3a9a6a', g='#1e5a3a',
             K='#2a1a10', H='#5a3a20', h='#7a5430', S='#f2c49a', s='#cc8a60', E='#1e1a2a', R='#c87a6a',
             Y='#3a9a6a', y='#1e5a3a', T='#e8c860', t='#9a7a2a'),
    head=[
        "....iiiii....",
        "...iIIIIIi...",
        "..iIIIGIIIi..",
        "..iIIGGGIIi..",
        ".iiGGGGGGGii.",
        ".KHHHHHHHHHK.",
        ".KHHHSSHHSS..",
        ".KHHSSSSSES..",
        "..KHSSSSSES..",
        "...KsSSSSSSS.",
        "....ssSSSSs..",
        ".....sssSs...",
    ],
    torso=[
        "...bBTBBTL..",
        "...bbTBBTBB.",
        "...bbTBBTBBB",
        "...bbTBBTBBB",
        "...bbTBBTBBB",
        "...bbTBBTBBb",
        "..yyYYYYYYYy",
        "..cbTBBBTBbb",
        "..cbTBBBTBbb",
        "..ccCCCCCCCC",
        "..yyYYYYYYYY",
    ])


FRAMES = {
    'soldier': (SOLDIER, frames_lance(SOLDIER)),
    'warrior': (WARRIOR, frames_axe(WARRIOR)),
    'mage': (MAGE, frames_tome(MAGE)),
    'archer': (ARCHER, frames_bow(ARCHER)),
    'thief': (THIEF, frames_knife(THIEF)),
    'cleric': (CLERIC, frames_tome(CLERIC)),
    'armor': (ARMOR, frames_armor(ARMOR)),
    'bandit': (BANDIT, frames_bandit(BANDIT)),
    'soldier_f': (SOLDIER_F, frames_lance2(SOLDIER_F)),
    'mage_m': (MAGE_M, frames_tome(MAGE_M)),
    'ranger': (RANGER, frames_hero(RANGER)),
    'archer_f': (ARCHER_F, frames_bow(ARCHER_F)),
    'thief_f': (THIEF_F, frames_knife(THIEF_F)),
    'priest': (PRIEST, frames_tome(PRIEST)),
}

if __name__ == '__main__':
    import sys
    from fighter import preview
    preview(list(FRAMES.values()), sys.argv[1] if len(sys.argv) > 1 else 'preview.png')
