"""v1.8.0:戦闘アニメのドット絵(手描きのコマ)を js/battleanim_sprites.js に書き出す。

ドット絵の元は、このフォルダの *.py(戦闘アニメ サンプル4〜8 の tools をそのまま持ってきたもの)。
コマを直したら、プロジェクトのフォルダで次を実行する:
    python tools/battleanim/build_sprites.py

1文字=1ドットのコマを、同じ文字が4つ以上続くところだけ {文字 個数} に縮めて保存する(約7MB → 約1.2MB)。
js/battleanim.js が読み込むときに元に戻す。
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True

import chars, classes, fighter, mounted, flyer, laguz, birds, throw  # noqa: E402

throw.add_all()


def rle(row):
    return re.sub(r'(.)\1{3,}', lambda m: '{%s%d}' % (m.group(1), len(m.group(0))), row)


def pack(ch, frames):
    pal = dict(ch['pal'])
    pal['o'] = '#16121e'
    return {
        'pal': pal, 'foot': list(ch.get('foot', fighter.FOOT)), 'cut': ch.get('cut', 0), 'cutx': ch.get('cutx', 0),
        'anch': ch.get('anchors', {}), 'throw': ch.get('throw'), 'proj': ch.get('proj'),
        'frames': {k: [rle(''.join(r)) for r in g] for k, g in frames.items()},
    }


def main():
    data = {'allen': pack(chars.MALE, chars.FRAMES_M), 'shizuka': pack(chars.FEMALE, chars.FRAMES_F)}
    for k, (ch, fr) in (list(classes.FRAMES.items()) + list(mounted.FRAMES.items()) + list(flyer.FRAMES.items())
                        + list(laguz.FRAMES.items()) + list(birds.FRAMES.items())):
        data[k] = pack(ch, fr)
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    out = os.path.join(ROOT, 'js', 'battleanim_sprites.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('// v1.8.0:戦闘アニメのドット絵(自動生成。直すときは tools/battleanim/*.py を直して build_sprites.py を実行)\n')
        f.write('window.BATTLE_ANIM_SPRITES = ' + body + ';\n')
    print('wrote', out, len(body), 'chars,', len(data), 'sprites')


if __name__ == '__main__':
    main()
