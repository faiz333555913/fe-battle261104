# 投げ武器（手槍・ショートスピア・スレンドスピア／手斧・ショートアクス・トマホーク）用のコマを、
# 槍・斧を使うクラスに足す（2026-11-23 サンプル8）。
#   tw_ready = 振りかぶり（武器を持っている） / tw_rel = 投げた瞬間（手は空） / tw_empty = 手が空の待機
#   tw_catch = 戻ってきた斧を受け取る（斧だけ）
#   投げた瞬間の手の位置を anchors に入れて、JS で武器を飛ばし始める場所にする
import fighter, classes, mounted, flyer
from fighter import frame, WEAPONS
from mounted import mframe

LAST = {}


def empty_arm(cv, ch, sx, sy, hx, hy, ang, arm=True, **kw):
    hx, hy = int(round(hx)), int(round(hy))
    if arm:
        fighter._arm(cv, ch, sx, sy, hx, hy)
    fighter._hand(cv, hx, hy)
    LAST['hand'] = (fighter.FOOT[0] + hx, fighter.FOOT[1] + hy)


WEAPONS['empty'] = empty_arm


def anchor(ch, pose, fr):
    """直前に描いた空の手の位置（スプライトの足元からの相対）を記録"""
    X, Y = LAST['hand']
    fx, fy = ch.get('foot', fighter.FOOT)
    ch.setdefault('anchors', {})[pose] = [X - fx, Y - fy]
    return fr


def one(ch):
    c = dict(ch); c.pop('two_hand', None)
    return c


def foot_frames(ch, kind, shield=None):
    c1, ce = one(ch), dict(one(ch), weapon='empty')
    kw = (lambda s: {'shield': s}) if shield else (lambda s: {'back': s})
    f = {}
    if kind == 'lance':
        f['tw_ready'] = frame(c1, 'stand', (-6, -30), -8, lean=-2, **kw(shield or (7, -22)))
    else:
        f['tw_ready'] = frame(c1, 'stand', (-4, -35), 150, lean=-2, arm_behind=True, **({'shield': shield} if shield else {}))
    f['tw_rel'] = anchor(ch, 'tw_rel', frame(ce, 'lunge', (13, -26), 0, lean=4, **kw(shield or (-6, -16))))
    f['tw_empty'] = frame(ce, 'stand', (6, -16), 0, **kw(shield or (-3, -14)))
    if kind == 'axe':
        f['tw_catch'] = anchor(ch, 'tw_catch', frame(ce, 'stand', (9, -27), 0, lean=1, **kw(shield or (-3, -14))))
    return f


def ride_frames(ch, kind, fly=None):
    c1, ce = one(ch), dict(one(ch), weapon='empty')
    st = fly + 'hover' if False else None
    P = {None: ('stand', 'g4' if kind == 'axe' else 'gather', 'brace', 'stand'),
         'peg': ('hover', 'hrise', 'hdive', 'hover'),
         'drg': ('hover', 'drise', 'ddive', 'hover')}[fly]
    wg = (lambda w: {'wing': w}) if fly else (lambda w: {})
    f = {}
    if kind == 'lance':
        f['tw_ready'] = mframe(c1, P[1], (-6, -30), -8, lean=-2, **wg(75))
    else:
        f['tw_ready'] = mframe(c1, P[1], (-3, -35), 150, lean=-2, arm_behind=True, **wg(75))
    f['tw_rel'] = anchor(ch, 'tw_rel', mframe(ce, P[2], (13, -26), 0, lean=4, **wg(-25)))
    f['tw_empty'] = mframe(ce, P[0], (6, -16), 0, **wg(30))
    if kind == 'axe':
        f['tw_catch'] = anchor(ch, 'tw_catch', mframe(ce, P[3], (9, -27), 0, lean=1, **wg(30)))
    return f


THROWERS = {
    # キー: (FRAMES の辞書, 種類, 作り方)
    'soldier': (classes.FRAMES, 'lance', foot_frames, {}),
    'soldier_f': (classes.FRAMES, 'lance', foot_frames, {}),
    'armor': (classes.FRAMES, 'lance', foot_frames, {'shield': (2, -26)}),
    'warrior': (classes.FRAMES, 'axe', foot_frames, {}),
    'bandit': (classes.FRAMES, 'axe', foot_frames, {}),
    'lknight': (mounted.FRAMES, 'lance', ride_frames, {}),
    'lknight_f': (mounted.FRAMES, 'lance', ride_frames, {}),
    'aknight': (mounted.FRAMES, 'axe', ride_frames, {}),
    'aknight_f': (mounted.FRAMES, 'axe', ride_frames, {}),
    'pegasus': (flyer.FRAMES, 'lance', ride_frames, {'fly': 'peg'}),
    'dragon': (flyer.FRAMES, 'axe', ride_frames, {'fly': 'drg'}),
    'dragon_f': (flyer.FRAMES, 'axe', ride_frames, {'fly': 'drg'}),
}


def add_all():
    for k, (F, kind, fn, kw) in THROWERS.items():
        ch, fr = F[k]
        if fn is ride_frames:
            with mounted.Mounted():
                fr.update(fn(ch, kind, **kw))
        else:
            fr.update(fn(ch, kind, **kw))
        ch['throw'] = kind


def proj_grid(ch, kind):
    """飛んでいく武器の絵：手に持っている武器と同じ関数で、手を描かずに描いて切り出す（大きさを手持ちとそろえる）"""
    save = fighter._hand
    fighter._hand = lambda *a: None
    try:
        cv = fighter.Canvas()
        c = one(ch)
        if kind == 'lance':
            WEAPONS['lance'](cv, c, 0, -20, 0, -20, 0, arm=False)      # 穂先を右へ水平に
        else:
            WEAPONS['axe'](cv, c, 0, -20, 0, -20, -90, arm=False)      # 柄を上へ（刃は右）
    finally:
        fighter._hand = save
    g = cv.g
    ys = [y for y, r in enumerate(g) if any(ch_ != '.' for ch_ in r)]
    xs = [x for r in g for x, ch_ in enumerate(r) if ch_ != '.']
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    return [''.join(r[x0:x1 + 1]) for r in g[y0:y1 + 1]]


_add_all = add_all


def add_all():
    _add_all()
    for k, (F, kind, fn, kw) in THROWERS.items():
        ch, fr = F[k]
        ch['proj'] = proj_grid(ch, kind)
