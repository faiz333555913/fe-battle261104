# -*- coding: utf-8 -*-
"""v1.6.6:スマホ縦向きのバトル準備・バトル用CSS(css/portrait_auto.css)を作る。

スマホ横向き用の詰めた見た目(css/style.css の
  @media (orientation: landscape) and (max-height: 500px) { ... }
  @media (orientation: landscape) and (max-height: 500px) and (max-width: 760px) { ... })
を、スマホ縦向き(幅600px以下)のバトル準備・バトルの画面にも同じように当てる。
ほかの画面(タイトル・キャラ作成など)の縦向きの見た目は変えないよう、すべてのセレクタの前に
「バトル準備かバトルを開いているとき」の条件(:where で強さ0)をつける。
style.css の横向き用の部分を変えたら、このスクリプトを実行し直すこと:
  python tools/build_portrait_css.py
縦向きだけの手直しは css/portrait.css(手書き)に書く。
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "css", "style.css")
OUT = os.path.join(ROOT, "css", "portrait_auto.css")

LAND = "(orientation: landscape) and (max-height: 500px)"
TARGETS = {LAND, LAND + " and (max-width: 760px)"}
PORTRAIT = "(orientation: portrait) and (max-width: 600px)"
COND = ":has(#screen-prep.active, #screen-battle.active)"


def strip_comments(s):
    return re.sub(r"/\*.*?\*/", "", s, flags=re.S)


def block_end(s, i):
    """s[i] は '{'。対応する '}' の位置を返す"""
    d = 0
    for p in range(i, len(s)):
        if s[p] == "{":
            d += 1
        elif s[p] == "}":
            d -= 1
            if d == 0:
                return p
    raise ValueError("括弧が閉じていない")


def prefix(sel):
    sel = sel.strip()
    if sel == "body" or sel.startswith("body ") or sel.startswith("body:") or sel.startswith("body."):
        return "body:where(" + COND + ")" + sel[4:]
    return ":where(body" + COND + ") " + sel


def split_selectors(sel):
    out, d, cur = [], 0, ""
    for ch in sel:
        if ch == "(":
            d += 1
        elif ch == ")":
            d -= 1
        if ch == "," and d == 0:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    out.append(cur)
    return [x.strip() for x in out if x.strip()]


def convert_rules(body):
    rules, i = [], 0
    while True:
        j = body.find("{", i)
        if j < 0:
            break
        sel = body[i:j].strip()
        k = block_end(body, j)
        decl = body[j + 1:k].strip()
        if sel.startswith("@"):
            raise ValueError("横向き用の中に @ の規則があります: " + sel)
        sels = ",\n".join(prefix(s) for s in split_selectors(sel))
        rules.append("  " + sels.replace("\n", "\n  ") + " { " + " ".join(decl.split()) + " }")
        i = k + 1
    return rules


def main():
    css = strip_comments(open(SRC, encoding="utf-8").read())
    out, i, n = [], 0, 0
    while True:
        j = css.find("@media", i)
        if j < 0:
            break
        b = css.find("{", j)
        cond = " ".join(css[j + 6:b].split())
        e = block_end(css, b)
        if cond in TARGETS:
            n += 1
            out.append("/* style.css: @media " + cond + " */")
            out.extend(convert_rules(css[b + 1:e]))
        i = e + 1
    text = ("/* このファイルは tools/build_portrait_css.py が style.css から作る(手で直さない)。\n"
            "   スマホ縦向きのバトル準備・バトルに、横向き用の詰めた見た目を当てる。 */\n"
            "@media " + PORTRAIT + " {\n" + "\n".join(out) + "\n}\n")
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("portrait_auto.css: %d ブロックから作りました" % n)


if __name__ == "__main__":
    main()
