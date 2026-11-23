"""data/*.json をまとめて js/gamedata.js に書き出すスクリプト。

index.html をダブルクリックで開く(file://)場合、ブラウザの制限で JSON ファイルを
直接読み込めないため、JSON の中身を JavaScript ファイルに埋め込んで使う。

data/ 以下の JSON を編集したら、プロジェクトのフォルダで次を実行すること:
    python tools/build_data.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "js" / "gamedata.js"

FILES = {
    "classesBase": "classes_base.json",
    "classesRaw": "classes_raw.json",
    "classesMax": "classes_maxparam.json",
    "classesGrowth": "classes_growth.json",
    "classesCon": "classes_con.json",
    "classWeaponTypes": "class_weapon_types.json",
    "skills": "skills.json",
    "elementBonus": "element_bonus.json",
    "laguzClasses": "laguz_classes.json",
    "weapons": {
        "laguz": "weapons_laguz.json",
        "sword": "weapons_sword.json",
        "lance": "weapons_lance.json",
        "axe": "weapons_axe.json",
        "bow": "weapons_bow.json",
        "knife": "weapons_knife.json",
        "flame": "weapons_flame.json",
        "thunder": "weapons_thunder.json",
        "wind": "weapons_wind.json",
        "light": "weapons_light.json",
    },
}


def load(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def build(spec):
    if isinstance(spec, dict):
        return {k: build(v) for k, v in spec.items()}
    return load(spec)


def main():
    data = build(FILES)
    body = json.dumps(data, ensure_ascii=False, indent=1)
    OUT.write_text(
        "// 自動生成ファイル(tools/build_data.py)。直接編集せず、data/*.json を編集して再生成すること。\n"
        f"window.GAME_DATA = {body};\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
