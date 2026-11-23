# 手描きドットの剣士（男女共通の組み立て）
#  - 頭・胴は文字で手描き（キャラごと）。脚・腕・剣は関節の位置から点を打つ
#  - 全コマで同じ頭・同じ剣の長さ・同じ持ち手（手前の手で順手）になるよう、ここで一括して作る
#  - 絵がマスからはみ出したらエラーにする（コマが切れない）
import math

W, H = 96, 80
FOOT = (40, 76)          # マスの中の足元の位置


class Clip(Exception):
    pass


class Canvas:
    def __init__(self):
        self.g = [['.'] * W for _ in range(H)]

    def put(self, x, y, c):
        X, Y = FOOT[0] + int(round(x)), FOOT[1] + int(round(y))
        if not (0 <= X < W and 0 <= Y < H):
            raise Clip((x, y))
        self.g[Y][X] = c

    def stamp(self, rows, dx, dy):
        for y, r in enumerate(rows):
            for x, c in enumerate(r):
                if c not in '.+':
                    self.put(dx + x, dy + y, c)

    def line(self, x0, y0, x1, y1, c, c2=None, t=3):
        """太い線。c2 は下側（影）の色"""
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        dx, dy = x1 - x0, y1 - y0
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        for i in range(n + 1):
            px, py = x0 + dx * i / n, y0 + dy * i / n
            for k in range(t):
                o = k - (t - 1) / 2
                self.put(px + nx * o, py + ny * o, c2 if (c2 and k == t - 1) else c)

    def outlined(self):
        g = self.g
        out = [r[:] for r in g]
        for y in range(H):
            for x in range(W):
                if g[y][x] != '.':
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H and g[Y][X] != '.':
                        out[y][x] = 'o'
                        break
        # 外枠1マスは空けておく（輪郭まで切れないことの確認）
        for y in range(H):
            if out[y][0] != '.' or out[y][W - 1] != '.':
                raise Clip(('edge', y))
        if any(c != '.' for c in out[0]):
            raise Clip(('top',))
        return out


# ---------------- 脚 ----------------
def leg(cv, hip, knee, foot, near):
    """股→ひざ→足首。手前の脚は明るく、奥の脚は暗くして、左右がどちらか見分けられるようにする"""
    P, p = ('P', 'p') if near else ('Q', 'Q')
    Wc, wc = ('W', 'w') if near else ('V', 'V')
    ax, ay = foot[0], foot[1] - 3
    cv.line(hip[0], hip[1], knee[0], knee[1], P, p, 3)
    cv.line(knee[0], knee[1], ax, ay, P, p, 3)
    # ブーツ（つま先は前＝右）
    for yy in (-3, -2, -1):
        for xx in (-1, 0, 1):
            cv.put(foot[0] + xx, foot[1] + yy, wc if xx == -1 else Wc)
    for xx in (-1, 0, 1, 2):
        cv.put(foot[0] + xx, foot[1], wc)
    cv.put(foot[0] + 2, foot[1] - 1, Wc)


# 脚の形（ひざ・足の位置。股は自動）: (手前の脚(ひざ,足), 奥の脚(ひざ,足), 体の上下)
LEGS = {
    'stand': (((3, -6), (5, 0)), ((-3, -6), (-5, 0)), 0),
    # 走り：右足(手前)前で着地 → 空中 → 左足(奥)前で着地 → 空中
    'run1': (((6, -7), (9, 0)), ((-4, -6), (-9, -3)), 0),
    'run2': (((-1, -7), (-7, -5)), ((6, -9), (5, -3)), -2),
    'run3': (((-4, -6), (-9, -3)), ((6, -7), (9, 0)), 0),
    'run4': (((6, -9), (5, -3)), ((-1, -7), (-7, -5)), -2),
    'lunge': (((8, -6), (11, 0)), ((-6, -5), (-11, 0)), 2),
    'back': (((3, -6), (6, 0)), ((-5, -6), (-7, 0)), 1),
    'crouch': (((6, -5), (6, 0)), ((-2, -5), (-5, 0)), 3),
    # 腰を落とした低い構え（足を前後に大きく開く）
    'low': (((6, -5), (9, 0)), ((-4, -5), (-8, 0)), 3),
}


# ---------------- 剣と腕 ----------------
# 剣はドット絵の決まった傾き（横・2:1・1:1・1:2・縦）だけで描く。
# 斜めの線を回転で描くと段差がそろわず欠けて見えるので、1段ずつ同じ長さの階段になる線にする。
_DIRS = []
for a, b in ((1, 0), (2, 1), (1, 1), (1, 2), (0, 1)):
    for sa in (1, -1):
        for sb in (1, -1):
            if (sa * a, sb * b) not in _DIRS:
                _DIRS.append((sa * a, sb * b))


def snap(ang):
    """角度にいちばん近い、きれいな傾き (a,b) を返す"""
    def diff(d):
        t = math.degrees(math.atan2(d[1], d[0]))
        return abs((t - ang + 180) % 360 - 180)
    return min(_DIRS, key=diff)


def _f(i, b, maj):
    """i 歩進んだときの、短いほうの軸のずれ（符号に関係なく同じ段差になる）"""
    q = (abs(i) * abs(b)) // maj
    return q * (1 if b >= 0 else -1) * (1 if i >= 0 else -1)


class Ray:
    """手の位置から、決まった傾きで伸びる1本の線。i 番目のドットの位置を返す"""
    def __init__(self, x, y, d):
        self.x, self.y = int(round(x)), int(round(y))
        self.a, self.b = d
        self.maj = max(abs(d[0]), abs(d[1]))
        self.k = self.maj / math.hypot(*d)      # 長さ（ドット）→ 歩数

    def steps(self, length):
        return int(round(length * self.k))

    def at(self, i):
        a, b, m = self.a, self.b, self.maj
        if abs(a) >= abs(b):
            return self.x + i * (1 if a > 0 else -1) * (1 if abs(a) == m else 0), self.y + _f(i, b, m)
        return self.x + _f(i, a, m), self.y + i * (1 if b > 0 else -1)

    def shade(self):
        """影の面の向き（刃の下側／右側に1ドット）"""
        if abs(self.a) >= abs(self.b):
            return (0, 1)
        return (1, 0) if self.b < 0 else (-1, 0)


def sword_arm(cv, ch, sx, sy, hx, hy, ang, arm=True, **kw):
    """肩(sx,sy)→手(hx,hy)。剣は手の中の柄から ang に近いきれいな傾きで、キャラごとに決まった長さで伸びる（順手）"""
    hx, hy = int(round(hx)), int(round(hy))
    d = snap(ang)
    r = Ray(hx, hy, d)
    blade, thin = ch['blade'], ch['thin']
    ox, oy = r.shade()
    i0, i1 = r.steps(4), r.steps(blade + 3)
    # 柄（手の後ろ）と柄頭
    for i in range(-r.steps(4), r.steps(2) + 1):
        x, y = r.at(i)
        cv.put(x, y, 'U'); cv.put(x + ox, y + oy, 'U')
    x, y = r.at(-r.steps(4) - 1)
    cv.put(x, y, 'G')
    # 刃：光る面（1本の線）＋影の面（その横に1本）。細身は光る面だけ
    for i in range(i0, i1 + 1):
        x, y = r.at(i)
        if not thin:
            cv.put(x + ox, y + oy, 'm')
        cv.put(x, y, 'M')
    x, y = r.at(i1 + 1)
    cv.put(x, y, 'm')                     # 切っ先
    # つば（刃に直角のきれいな傾き）
    gx, gy = r.at(r.steps(3))
    g = Ray(gx, gy, (-d[1], d[0]))
    gw = 2 if thin else 3
    for k in range(-gw, gw + 1):
        x, y = g.at(k)
        cv.put(x, y, 'G' if k < 1 else 'g')
    if arm:
        A, a = ch.get('arm', ('B', 'b'))
        cv.line(sx, sy, hx, hy, A, a, 3)
        if ch.get('bracer'):   # 手首の黒い籠手
            L = math.hypot(hx - sx, hy - sy) or 1
            ux, uy = (hx - sx) / L, (hy - sy) / L
            cv.line(hx - ux * 3, hy - uy * 3, hx - ux * 1.5, hy - uy * 1.5, 'p', 'p', 3)
    for ox in (-1, 0, 1):
        for oy in (-1, 0, 1):
            cv.put(hx + ox, hy + oy, 's' if oy == 1 or (ox, oy) == (-1, 0) else 'S')


def back_arm(cv, ch, sx, sy, hx, hy):
    """奥の腕（体の後ろ・暗い色）"""
    cv.line(sx, sy, hx, hy, ch.get('arm', ('B', 'b'))[1], ch.get('arm', ('B', 'b'))[1], 3)
    for ox in (-1, 0):
        for oy in (-1, 0):
            cv.put(hx + ox, hy + oy, 's')


# ---------------- 槍・斧・魔道書 ----------------
def _hand(cv, hx, hy):
    for ox in (-1, 0, 1):
        for oy in (-1, 0, 1):
            cv.put(hx + ox, hy + oy, 's' if oy == 1 or (ox, oy) == (-1, 0) else 'S')


def _arm(cv, ch, sx, sy, hx, hy):
    A, a = ch.get('arm', ('B', 'b'))
    cv.line(sx, sy, hx, hy, A, a, 3)


def lance_arm(cv, ch, sx, sy, hx, hy, ang, arm=True, **kw):
    """槍：手の位置を通る長い柄。前に穂先、後ろに石突き。長さはキャラごとに固定"""
    hx, hy = int(round(hx)), int(round(hy))
    d = snap(ang)
    r = Ray(hx, hy, d)
    ox, oy = r.shade()
    fwd, bwd = r.steps(ch['shaft']), r.steps(ch['butt'])
    for i in range(-bwd, fwd + 1):          # 柄（明るい線＋影の線）
        x, y = r.at(i)
        cv.put(x + ox, y + oy, 'j')
        cv.put(x, y, 'J')
    x, y = r.at(-bwd - 1)
    cv.put(x, y, 'g'); cv.put(x + ox, y + oy, 'g')   # 石突き
    # 穂先：菱形（真ん中の線は明るく、両わきは刃）
    head = ch.get('head_len', 7)
    p = Ray(0, 0, (-d[1], d[0]))
    for k in range(head):
        x, y = r.at(fwd + 1 + k)
        w = 1 if 1 <= k <= head - 3 else 0
        for j in range(-w, w + 1):
            px, py = p.at(j)
            cv.put(x + px, y + py, 'M' if j <= 0 else 'm')
    x, y = r.at(fwd + 1 + head)
    cv.put(x, y, 'm')
    # 穂先の根元の金具
    x, y = r.at(fwd)
    for j in (-1, 1):
        px, py = p.at(j)
        cv.put(x + px, y + py, 'G')
    cv.put(x, y, 'G')
    if arm:
        _arm(cv, ch, sx, sy, hx, hy)
    _hand(cv, hx, hy)


def axe_arm(cv, ch, sx, sy, hx, hy, ang, arm=True, **kw):
    """斧：手から決まった長さの柄、先に刃。刃は振り下ろす側（時計回りの側）につく"""
    hx, hy = int(round(hx)), int(round(hy))
    d = snap(ang)
    r = Ray(hx, hy, d)
    ox, oy = r.shade()
    L = r.steps(ch['handle'])
    bk = r.steps(ch.get('axe_butt', 3))
    for i in range(-bk, L + 1):
        x, y = r.at(i)
        cv.put(x + ox, y + oy, 'j')
        cv.put(x, y, 'J')
    x, y = r.at(-bk - 1)
    cv.put(x, y, 'g')
    # 刃：柄から離れるほど上下に広がる三日月形。いちばん外側のふちが光る
    p = Ray(0, 0, (-d[1], d[0]))
    q = Ray(0, 0, (d[1], -d[0]))
    spans = ch.get('axe_spans', [(-1, 1), (-1, 1), (-2, 2), (-3, 3), (-3, 3), (-2, 2)])
    c0 = L - 2
    pts = {}
    for j, (lo, hi) in enumerate(spans, start=1):
        for k in range(lo, hi + 1):
            x, y = r.at(c0 + k)
            px, py = p.at(j)
            edge = j == len(spans) or k in (lo, hi) and j >= 4
            pts[(x + px, y + py)] = 'M' if edge else ('a' if j == 1 else ('A' if k <= 0 else 'm'))
    xs = [k[0] for k in pts]; ys = [k[1] for k in pts]
    filled = dict(pts)
    for X in range(min(xs), max(xs) + 1):
        for Y in range(min(ys), max(ys) + 1):
            if (X, Y) in pts:
                continue
            nb = [pts.get((X + 1, Y)), pts.get((X - 1, Y)), pts.get((X, Y + 1)), pts.get((X, Y - 1))]
            if sum(c is not None for c in nb) >= 3:
                filled[(X, Y)] = 'A'
    for (X, Y), c in filled.items():
        cv.put(X, Y, c)
    n = 3; base = c0 - 1
    # 背の突起と、刃の付け根の金具
    x, y = r.at(base + n // 2)
    px, py = q.at(1); cv.put(x + px, y + py, 'a')
    px, py = q.at(2); cv.put(x + px, y + py, 'a')
    for k in range(n):
        x, y = r.at(base + k)
        cv.put(x, y, 'a')
    if arm:
        _arm(cv, ch, sx, sy, hx, hy)
    _hand(cv, hx, hy)


BOOK_CLOSED = [
    "XXXXX",
    "XZZZX",
    "XZGZX",
    "XZZZX",
    "XXXXX",
    "xxxxx",
]
BOOK_OPEN = [
    "XFF..FFX",
    "XFfFFfFX",
    "XFFFfFFX",
    "XFfFFfFX",
    "XXXxxXXX",
]


def tome_arm(cv, ch, sx, sy, hx, hy, ang, arm=True, **kw):
    """魔道書：手前の手で本を持つ。ang>=0 なら開いた本（詠唱）、<0 なら閉じた本"""
    hx, hy = int(round(hx)), int(round(hy))
    if arm:
        _arm(cv, ch, sx, sy, hx, hy)
    if ang >= 0:
        cv.stamp(BOOK_OPEN, hx - 3, hy - 5)
    else:
        cv.stamp(BOOK_CLOSED, hx - 2, hy - 3)
    _hand(cv, hx, hy)


def _px(cv, x, y, c):
    cv.put(x, y, c)


def _line1(cv, x0, y0, x1, y1, c):
    """1ドットの細い線（弓の弦）"""
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for i in range(n + 1):
        cv.put(round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n), c)


def bow_arm(cv, ch, sx, sy, hx, hy, ang, arm=True, pull=None, **kw):
    """弓：手前の手で弓の真ん中を握る（弓はいつも縦）。ang=0 ふつう、1 引きしぼって矢をつがえる、2 放した直後
    弓の形は手描きの弧（決まった点）なので、どのコマでも同じ大きさになる"""
    hx, hy = int(round(hx)), int(round(hy))
    h = ch.get('bow_h', 11)
    bend = 4 if ang == 1 else 3
    pts = []
    for y in range(-h, h + 1):
        x = 1 - round(bend * (y / h) ** 2)
        pts.append((hx + x, hy + y))
    if arm:
        _arm(cv, ch, sx, sy, hx, hy)
    top, bot = pts[0], pts[-1]
    # 弦
    if ang == 1 and pull:
        _line1(cv, top[0], top[1], pull[0], pull[1], 'k')
        _line1(cv, bot[0], bot[1], pull[0], pull[1], 'k')
    else:
        _line1(cv, top[0] - 1, top[1], bot[0] - 1, bot[1], 'k')
    # 弓の本体（2ドットの太さ：外側が明るい）
    for (x, y) in pts:
        cv.put(x, y, 'J'); cv.put(x - 1, y, 'j') if ang != 1 or abs(y - hy) > 1 else None
    for (x, y) in (top, bot):
        cv.put(x, y, 'G')
    # 矢（つがえているときだけ）：引き手から弓の前まで。矢じりは鉄、羽は赤
    if ang == 1 and pull:
        ax0, ay = pull[0] - 2, hy
        L = hx + 7
        for x in range(ax0, L):
            cv.put(x, ay, 'U')
        cv.put(L, ay, 'M'); cv.put(L + 1, ay, 'M'); cv.put(L + 2, ay, 'm')
        cv.put(L, ay - 1, 'm'); cv.put(L, ay + 1, 'm')
        cv.put(ax0, ay - 1, 'R'); cv.put(ax0 + 1, ay - 1, 'R'); cv.put(ax0, ay + 1, 'r')
    _hand(cv, hx, hy)


WEAPONS = {'bow': bow_arm, 'sword': sword_arm, 'lance': lance_arm, 'axe': axe_arm, 'tome': tome_arm}


def robe(cv, ch, hip_y, knees, lean):
    """ローブのすそ：腰から、ひざの少し下まで広がる。ひざの位置に合わせて広がり方が変わる"""
    top = hip_y
    bot = max(k[1] for k in knees) + 1
    lo = min(k[0] for k in knees) - 2
    hi = max(k[0] for k in knees) + 2
    x0a, x1a = -4 + lean, 5 + lean
    for y in range(top, bot + 1):
        t = (y - top) / max(1, bot - top)
        xl = round(x0a + (lo - x0a) * t)
        xr = round(x1a + (hi - x1a) * t)
        for x in range(xl, xr + 1):
            c = 'C'
            if x <= xl + 1:
                c = 'c'
            if y == bot:
                c = 'Y' if (x + y) % 2 == 0 else 'y'
            elif x == xr:
                c = 'L'
            cv.put(x, y, c)


# ---------------- 1コマを作る ----------------
def frame(ch, legs, hand, ang, lean=0, hy=0, arm_behind=False, back=None, hair='hang', back_on_weapon=False, pull=None, back_ang=None, shield=None):
    """ch: キャラ定義。legs: LEGS の名前。hand: 武器を持つ手の位置。ang: 武器の向き。
    lean: 上半身の前後。hy: 上半身の上下。back: 奥の手の位置（None なら隠す）"""
    cv = Canvas()
    (nk, nf), (fk, ff), ly = LEGS[legs]
    up = ly
    hy2 = hy + up
    sx, sy = 3 + lean, -21 + hy2
    bx, by = -2 + lean, -21 + hy2
    if ch.get('tail'):
        rows, tx, ty = ch['tail'][hair]
        cv.stamp(rows, tx + lean, ty + hy2)
    if ch.get('cape'):
        rows, tx, ty = ch['cape'][hair]
        cv.stamp(rows, tx + lean, ty + hy2)
    if ch.get('back_fn'):
        ch['back_fn'](cv, hair, lean, hy2)          # 背中の翼など（体の後ろに描くもの）
    grip = None
    if ch.get('two_hand'):
        # 両手持ち：奥の手は柄の、手前の手より石突き寄りを握る（全コマ同じ間隔）
        r = Ray(hand[0] + lean, hand[1] + hy2, snap(ang))
        grip = r.at(-r.steps(ch['two_hand']))
    if pull:
        # 弓を引く手：奥の手を体の前（あごの横）まで持ってくる
        grip = (int(round(pull[0] + lean)), int(round(pull[1] + hy2)))
    if grip:
        back = None
        cv.line(bx, by, grip[0], grip[1], ch.get('arm', ('B', 'b'))[1], ch.get('arm', ('B', 'b'))[1], 3)
    if back:
        back_arm(cv, ch, bx, by, back[0] + lean, back[1] + hy2)
        if back_ang is not None:
            # 二刀流：奥の手にもう1本（体の後ろなので、はみ出した刃だけが見える）
            sword_arm(cv, ch, bx, by, back[0] + lean, back[1] + hy2, back_ang, arm=False)
    knees = [(fk[0], fk[1] + up), (nk[0], nk[1] + up)]
    leg(cv, (-1 + lean // 2, -13 + hy2), knees[0], (ff[0], ff[1] + min(up, 0)), False)
    leg(cv, (1 + lean // 2, -13 + hy2), knees[1], (nf[0], nf[1] + min(up, 0)), True)
    if ch.get('robe'):
        robe(cv, ch, -13 + hy2, knees, lean)
    cv.stamp(ch['torso'], -6 + lean, -23 + hy2)
    wfn = WEAPONS[ch.get('weapon', 'sword')]
    if arm_behind:
        A, a = ch.get('arm', ('B', 'b'))
        cv.line(sx, sy, hand[0] + lean, hand[1] + hy2, A, a, 3)
    cv.stamp(ch['head'], -6 + lean, -35 + hy2)
    if shield:
        # 大盾：奥の腕で体の前に構える（体より手前に描き、その上に槍を通す）
        cv.stamp(ch['shield'], shield[0] + lean, shield[1] + hy2)
    wfn(cv, ch, sx, sy, hand[0] + lean, hand[1] + hy2, ang, arm=not arm_behind, pull=grip)
    if grip:
        # 奥の手のこぶし。腕や胸の肌と重なっても見分けられるよう、肌の上だけ輪郭をつける
        hand_px = [(0, 0), (1, 0), (0, 1), (1, 1), (-1, 0), (0, -1)]
        gx, gy = grip
        for ox, oy in ((-2, 0), (-1, -1), (0, -2), (1, -1), (2, 0), (2, 1), (1, 2), (0, 2), (-1, 1)):
            X, Y = FOOT[0] + gx + ox, FOOT[1] + gy + oy
            if (ox, oy) not in hand_px and cv.g[Y][X] in ch.get('fist_outline_on', 'SsTt'):
                cv.g[Y][X] = 'o'
        for ox, oy in hand_px:
            cv.put(gx + ox, gy + oy, 's' if oy == 1 or ox == -1 else 'S')
    return cv.outlined()


def build_frames(ch):
    run_hand, run_ang = (7, -16), -38
    return {
        'idle':  frame(ch, 'stand', (6, -16), -58, back=(-3, -14)),
        'run1':  frame(ch, 'run1', run_hand, run_ang, lean=2, hy=1, back=(-6, -15), hair='flow'),
        'run2':  frame(ch, 'run2', run_hand, run_ang, lean=2, hy=1, back=(-3, -14), hair='flow'),
        'run3':  frame(ch, 'run3', run_hand, run_ang, lean=2, hy=1, back=(2, -15), hair='flow'),
        'run4':  frame(ch, 'run4', run_hand, run_ang, lean=2, hy=1, back=(-3, -14), hair='flow'),
        'raise': frame(ch, 'stand', (-4, -34), -130, lean=-1, arm_behind=True),
        'swing': frame(ch, 'lunge', (12, -19), 4, lean=3, hy=0, back=(-5, -16), hair='flow'),
        'thrust': frame(ch, 'lunge', (14, -21), -4, lean=4, hy=0, back=(-6, -18), hair='flow'),
        'hurt':  frame(ch, 'back', (5, -15), 48, lean=-3, hy=0, back=(-6, -13), hair='flow'),
        'dodge': frame(ch, 'back', (3, -17), -72, lean=-5, hy=0, back=(-7, -15), hair='flow'),
        'crouch': frame(ch, 'crouch', (8, -14), -20, lean=2, hy=0, back=(-4, -12)),
        'low':   frame(ch, 'lunge', (12, -18), 45, lean=3, hy=1, back=(-5, -15), hair='flow'),
        'upcut': frame(ch, 'lunge', (9, -27), -63, lean=2, hy=-1, back=(-6, -17), hair='flow'),
    }


def preview(chars, path, scale=6):
    from PIL import Image
    rows = []
    for ch, frames in chars:
        P = dict(ch['pal']); P['o'] = '#16121e'
        ims = []
        for k, g in frames.items():
            im = Image.new('RGB', (W, H), '#c8a46a')
            for y, r in enumerate(g):
                for x, c in enumerate(r):
                    if c != '.':
                        im.putpixel((x, y), tuple(int(P[c][i:i + 2], 16) for i in (1, 3, 5)))
            ims.append(im.resize((W * scale, H * scale), Image.NEAREST))
        rows.append(ims)
    n = max(len(r) for r in rows)
    sheet = Image.new('RGB', (n * (W * scale + 6), len(rows) * (H * scale + 6)), '#000')
    for j, ims in enumerate(rows):
        for i, im in enumerate(ims):
            sheet.paste(im, (i * (W * scale + 6), j * (H * scale + 6)))
    sheet.save(path)
