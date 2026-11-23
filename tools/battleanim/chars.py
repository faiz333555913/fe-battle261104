# 2人の剣士の手描きパーツ（頭・胴・髪）と色。1文字＝1ドット、右向き
from fighter import build_frames

# ---------------- 男剣士アレン（サンプル2の剣士と同じ顔・服） ----------------
MALE = {
    'name': 'male',
    'pal': {
        'K': '#4a2414', 'H': '#7a3e1c', 'h': '#b0642c',
        'S': '#f4c89c', 's': '#d08e64', 'E': '#1e1a2a', 'e': '#ffffff',
        'B': '#3a64c8', 'b': '#26428e', 'L': '#7aa0f0',
        'P': '#4a4468', 'p': '#2c2842', 'Q': '#1e1a2e', 'W': '#8a5632', 'w': '#4a2a18', 'V': '#3a2414',
        'Y': '#e0b040', 'y': '#9a6e20', 'R': '#d03440', 'r': '#80202c',
        'M': '#f4f8ff', 'm': '#b0bcd4', 'n': '#6a7690', 'G': '#f0c850', 'g': '#a07820', 'U': '#5a3018',
    },
    'blade': 14, 'thin': False,
    'head': [
        ".....KKKKK...",
        "...KKHHHhhK..",
        "..KHHHHHHhhK.",
        "..KHHHHHHHhhK",
        "rRRRRRRRRRRRK",
        "r.RKHHSSSSSS.",
        "...KHSSSSSES.",
        "...KHSSSSSEs.",
        "...KHsSSSSSSS",
        "....KssSSSSs.",
        ".....sssSss..",
        ".......ss....",
    ],
    'torso': [
        "..rRbBBBBLLB",
        ".rRbbBBBBBLB",
        ".rRbbBBBBBBB",
        "rRRbbBBBBBBB",
        "rR.bbBBBBBBB",
        "r..bbBBBBBBb",
        "r..yYYYYYYYy",
        "...bbBBBBBbb",
        "...bbBBBBBb.",
        "...pbbBBbbb.",
        "...ppPPPPpp.",
    ],
}

# ---------------- 女剣士 ----------------
# 黒髪ポニーテール・紫の上着・白い帯・黒いズボン・茶色のブーツ・細身の剣
FEMALE = {
    'name': 'female',
    'pal': {
        'K': '#141020', 'H': '#2c2840', 'h': '#55507a',          # 黒髪（青みのつや）
        'S': '#f6d0aa', 's': '#d49a72', 'E': '#2a1a3a', 'e': '#f4f4fa',
        'B': '#7a3cb4', 'b': '#4c2278', 'L': '#a872dc',          # 紫の上着
        'P': '#3e3850', 'p': '#24202e', 'Q': '#141018',          # 黒いズボン（奥の脚はさらに暗く）・籠手
        'W': '#9a6034', 'w': '#56321a', 'V': '#3a2010',          # 茶色のブーツ
        'Y': '#f2f2f8', 'y': '#b4b4c8',                          # 白い帯
        'R': '#d84a8a', 'r': '#8a2a5a',                          # 口もと・髪ひも
        'M': '#f8fbff', 'm': '#c0cadc', 'n': '#7a86a0',          # 細身の刃
        'G': '#d8c070', 'g': '#8a7430', 'U': '#6a3a1c',          # つば・柄
    },
    'blade': 16, 'thin': True, 'bracer': True,
    'head': [
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
    ],
    'torso': [
        "....bBBBLL..",
        "...bbBBBBLB.",
        "...bbBBBBBLB",
        "...bbBBBBBBB",
        "...bbBBBBBBB",
        "...bbBBBBBBb",
        "..yyYYYYYYYy",
        ".yybbBBBBBbb",
        ".y.bbBBBBBbb",
        "..bbBBBBBBBb",
        "..bbbbbbbbbb",
    ],
    # ポニーテール（頭の後ろ）: (絵, 左上x, 左上y) 体の基準からの位置
    'tail': {
        'hang': ([
            "....rrK",
            "...KHHK",
            "..KHHhK",
            "..KHHh.",
            ".KHHH..",
            ".KHHh..",
            ".KHHh..",
            "KHHH...",
            "KHHh...",
            "KHH....",
            ".KH....",
            ".KK....",
            "..K....",
        ], -9, -34),
        'flow': ([
            "..........rrK",
            "......KKKHHHK",
            "...KKHHHHHHh.",
            ".KKHHHHhhHh..",
            "KHHHHHKK.....",
            "KHHhKK.......",
            ".KK..........",
        ], -16, -34),
    },
}

FRAMES_M = build_frames(MALE)
FRAMES_F = build_frames(FEMALE)

if __name__ == '__main__':
    import sys
    from fighter import preview
    preview([(MALE, FRAMES_M), (FEMALE, FRAMES_F)], sys.argv[1] if len(sys.argv) > 1 else 'preview.png')
