// 自動生成ファイル(tools/build_data.py)。直接編集せず、data/*.json を編集して再生成すること。
window.GAME_DATA = {
 "classesBase": {
  "comment": "classes_raw.json のうち、クラスチェンジ対応表(silver-intention.com、ガトー確認済み)+ ガトーの個別判断で下級職プールとして確定したもの。レンジャー(実質アイク専用)・バンデット(敵専用斧職)は含める方針。クレリック・神官は杖専用だがハウスルールで光魔法攻撃を可能とする。バーサーカー・勇者は下級/上級不明のため除外。 moveType(歩行/騎馬/飛行/重装)はガトー提供データに含まれていなかったため、クラス名からAIが判定・付与(2026-11-01)。表示用マーク分類のみで、移動・地形処理には使用しない。 effectivenessTags: このクラスが対象になる武器特効カテゴリ(飛行系=弓・風・魔力依存武器の飛行特効/重装系=スティレットの対アーマー特効)。猫系・竜系(獣牙族・竜鱗族)はラグズ専用特効のため、下級職プールに該当クラスがなく常に空(2026-11-01付与)。 騎馬系: ナイトキラー・長柄刀・ポールアクスの「アクスナイト・ソードナイト・パラディン・ボウナイト・ランスナイトに特効」対象(2026-11-01追加。実際の特効判定は武器effectの対象名とクラス名の照合で行う)。 gender: 男/女/共用(キャラの性別で選べる職業を絞る。名前に(男)(女)がない職業は蒼炎の登場ユニットから判断:アーチャー・シーフ・戦士・重歩兵・神官・バンデットは男のみ、クレリック・ペガサスナイトは女のみ、レンジャーは男女共用。2026-11-01追加、ガトー確認待ち)。 v1.3.0:レンジャーを騎馬→歩行に変更(ガトー指示)。",
  "classes": [
   {
    "name": "アクスナイト(女)",
    "hp": 18,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 6,
    "lck": 0,
    "def": 5,
    "res": 1,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "騎馬",
    "effectivenessTags": [
     "騎馬系"
    ],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "アクスナイト(男)",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 5,
    "lck": 0,
    "def": 6,
    "res": 0,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "騎馬",
    "effectivenessTags": [
     "騎馬系"
    ],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "アーチャー",
    "hp": 18,
    "str": 3,
    "mag": 0,
    "skl": 6,
    "spd": 3,
    "lck": 0,
    "def": 4,
    "res": 0,
    "capacity": 20,
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "クレリック",
    "hp": 16,
    "str": 2,
    "mag": 1,
    "skl": 2,
    "spd": 2,
    "lck": 0,
    "def": 0,
    "res": 6,
    "capacity": 20,
    "note": "本来は杖専用だが、本ゲームではハウスルールとして光魔法での攻撃を可能とする(ガトー確認済み)",
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "シーフ",
    "hp": 16,
    "str": 3,
    "mag": 0,
    "skl": 2,
    "spd": 9,
    "lck": 0,
    "def": 2,
    "res": 0,
    "capacity": 20,
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "ソルジャー(女)",
    "hp": 18,
    "str": 2,
    "mag": 0,
    "skl": 4,
    "spd": 5,
    "lck": 0,
    "def": 3,
    "res": 1,
    "capacity": 20,
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "ソルジャー(男)",
    "hp": 20,
    "str": 4,
    "mag": 0,
    "skl": 4,
    "spd": 4,
    "lck": 0,
    "def": 4,
    "res": 0,
    "capacity": 20,
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "ソードナイト(女)",
    "hp": 18,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 6,
    "lck": 0,
    "def": 5,
    "res": 1,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "騎馬",
    "effectivenessTags": [
     "騎馬系"
    ],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "ソードナイト(男)",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 5,
    "lck": 0,
    "def": 6,
    "res": 0,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "騎馬",
    "effectivenessTags": [
     "騎馬系"
    ],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "ドラゴンナイト(女)",
    "hp": 19,
    "str": 6,
    "mag": 0,
    "skl": 4,
    "spd": 3,
    "lck": 0,
    "def": 7,
    "res": 1,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "飛行",
    "effectivenessTags": [
     "飛行系"
    ],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "ドラゴンナイト(男)",
    "hp": 20,
    "str": 6,
    "mag": 0,
    "skl": 4,
    "spd": 3,
    "lck": 0,
    "def": 8,
    "res": 0,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "飛行",
    "effectivenessTags": [
     "飛行系"
    ],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "ペガサスナイト",
    "hp": 14,
    "str": 4,
    "mag": 0,
    "skl": 4,
    "spd": 8,
    "lck": 0,
    "def": 3,
    "res": 2,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "飛行",
    "effectivenessTags": [
     "飛行系"
    ],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "ボウナイト(女)",
    "hp": 18,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 6,
    "lck": 0,
    "def": 5,
    "res": 1,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "騎馬",
    "effectivenessTags": [
     "騎馬系"
    ],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "ボウナイト(男)",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 5,
    "lck": 0,
    "def": 6,
    "res": 0,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "騎馬",
    "effectivenessTags": [
     "騎馬系"
    ],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "ランスナイト(女)",
    "hp": 18,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 6,
    "lck": 0,
    "def": 5,
    "res": 1,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "騎馬",
    "effectivenessTags": [
     "騎馬系"
    ],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "ランスナイト(男)",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 5,
    "lck": 0,
    "def": 6,
    "res": 0,
    "capacity": 15,
    "excludeFromPool": false,
    "moveType": "騎馬",
    "effectivenessTags": [
     "騎馬系"
    ],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "レンジャー",
    "hp": 18,
    "str": 3,
    "mag": 1,
    "skl": 3,
    "spd": 4,
    "lck": 0,
    "def": 5,
    "res": 0,
    "capacity": 20,
    "note": "シーフの上級職と思われる(アサシンと分岐)",
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "共用",
    "race": "ベオク"
   },
   {
    "name": "剣士(女)",
    "hp": 15,
    "str": 3,
    "mag": 0,
    "skl": 5,
    "spd": 6,
    "lck": 0,
    "def": 3,
    "res": 1,
    "capacity": 20,
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "剣士(男)",
    "hp": 17,
    "str": 4,
    "mag": 0,
    "skl": 5,
    "spd": 5,
    "lck": 0,
    "def": 3,
    "res": 0,
    "capacity": 20,
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "戦士",
    "hp": 24,
    "str": 5,
    "mag": 0,
    "skl": 3,
    "spd": 3,
    "lck": 0,
    "def": 3,
    "res": 0,
    "capacity": 20,
    "note": "ウォーリア/バーサーカーの下級職と思われる",
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "神官",
    "hp": 18,
    "str": 0,
    "mag": 3,
    "skl": 3,
    "spd": 3,
    "lck": 0,
    "def": 1,
    "res": 8,
    "capacity": 20,
    "note": "光魔法で攻撃可能(クレリックと同じハウスルールを仮適用。要最終確認)",
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "重歩兵",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 0,
    "lck": 0,
    "def": 9,
    "res": 0,
    "capacity": 20,
    "note": "ジェネラルの下級職と思われる",
    "excludeFromPool": false,
    "moveType": "重装",
    "effectivenessTags": [
     "重装系"
    ],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "魔道士(炎特化・男)",
    "hp": 16,
    "str": 0,
    "mag": 1,
    "skl": 2,
    "spd": 3,
    "lck": 0,
    "def": 3,
    "res": 3,
    "capacity": 20,
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "魔道士(通常・女)",
    "hp": 16,
    "str": 0,
    "mag": 3,
    "skl": 1,
    "spd": 5,
    "lck": 0,
    "def": 1,
    "res": 5,
    "capacity": 20,
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "女",
    "race": "ベオク"
   },
   {
    "name": "魔道士(通常・男)",
    "hp": 16,
    "str": 0,
    "mag": 3,
    "skl": 2,
    "spd": 4,
    "lck": 0,
    "def": 2,
    "res": 4,
    "capacity": 20,
    "excludeFromPool": false,
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "男",
    "race": "ベオク"
   },
   {
    "name": "バンデット",
    "hp": 25,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 4,
    "lck": 0,
    "def": 2,
    "res": 0,
    "capacity": 20,
    "confirmedTier": null,
    "excludeFromPool": false,
    "note": "敵専用の斧下級職として採用(ガトー確認済み)。プレイヤーキャラのランダム抽選にも使用する",
    "moveType": "歩行",
    "effectivenessTags": [],
    "gender": "男",
    "race": "ベオク"
   }
  ]
 },
 "classesRaw": {
  "comment": "出典: pegasusknight.com『クラス/基本パラメータ』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。五十音順の表の途中(アクスナイト〜パラディン槍・女 まで)。続きのスクショ待ち。tierフラグは暫定の見た目判断で未確定、ガトーの確認が必要。",
  "status": "partial - 続きのページを収集中",
  "tierLegend": {
   "lagz": "ラグズ(獣牙族・鳥翼族・竜鱗族)のため仕様上使用しない",
   "exclusive": "特定キャラクター専用クラスの可能性が高い(通常の職業生成には使わない想定)",
   "promoted_suspected": "上級職(クラスチェンジ後)と思われる。仕様は下級職のみ使用なので要確認",
   "base_suspected": "下級職(未クラスチェンジ)と思われる"
  },
  "classes": [
   {
    "name": "アクスナイト(女)",
    "hp": 18,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 6,
    "lck": 0,
    "def": 5,
    "res": 1,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "アクスナイト(男)",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 5,
    "lck": 0,
    "def": 6,
    "res": 0,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "アサシン",
    "hp": 18,
    "str": 5,
    "mag": 1,
    "skl": 5,
    "spd": 11,
    "lck": 0,
    "def": 4,
    "res": 2,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "アーチャー",
    "hp": 18,
    "str": 3,
    "mag": 0,
    "skl": 6,
    "spd": 3,
    "lck": 0,
    "def": 4,
    "res": 0,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ウォーリア",
    "hp": 30,
    "str": 7,
    "mag": 1,
    "skl": 5,
    "spd": 4,
    "lck": 0,
    "def": 5,
    "res": 2,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "カラス",
    "hp": 24,
    "str": 9,
    "mag": 4,
    "skl": 10,
    "spd": 12,
    "lck": 0,
    "def": 8,
    "res": 7,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "カラス(ネサラ)",
    "hp": 26,
    "str": 11,
    "mag": 5,
    "skl": 11,
    "spd": 13,
    "lck": 0,
    "def": 10,
    "res": 7,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "クリミア王女",
    "hp": 20,
    "str": 6,
    "mag": 1,
    "skl": 7,
    "spd": 7,
    "lck": 0,
    "def": 5,
    "res": 5,
    "capacity": 20,
    "tierGuess": "exclusive",
    "confirmedTier": null
   },
   {
    "name": "クレリック",
    "hp": 16,
    "str": 2,
    "mag": 1,
    "skl": 2,
    "spd": 2,
    "lck": 0,
    "def": 0,
    "res": 6,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "note": "杖専用職の可能性(仕様上使用しない想定)",
    "confirmedTier": "base"
   },
   {
    "name": "サギ(女)",
    "hp": 18,
    "str": 0,
    "mag": 10,
    "skl": 6,
    "spd": 12,
    "lck": 0,
    "def": 2,
    "res": 25,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "サギ(男)",
    "hp": 18,
    "str": 0,
    "mag": 10,
    "skl": 6,
    "spd": 11,
    "lck": 0,
    "def": 3,
    "res": 25,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "シーフ",
    "hp": 16,
    "str": 3,
    "mag": 0,
    "skl": 2,
    "spd": 9,
    "lck": 0,
    "def": 2,
    "res": 0,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ジェネラル",
    "hp": 23,
    "str": 8,
    "mag": 2,
    "skl": 4,
    "spd": 2,
    "lck": 0,
    "def": 10,
    "res": 3,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "ジェネラル(漆黒の騎士)",
    "hp": 24,
    "str": 7,
    "mag": 1,
    "skl": 4,
    "spd": 1,
    "lck": 0,
    "def": 11,
    "res": 2,
    "capacity": 40,
    "tierGuess": "exclusive",
    "confirmedTier": null
   },
   {
    "name": "スナイパー",
    "hp": 21,
    "str": 6,
    "mag": 2,
    "skl": 8,
    "spd": 5,
    "lck": 0,
    "def": 6,
    "res": 2,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "ソルジャー(女)",
    "hp": 18,
    "str": 2,
    "mag": 0,
    "skl": 4,
    "spd": 5,
    "lck": 0,
    "def": 3,
    "res": 1,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ソルジャー(男)",
    "hp": 20,
    "str": 4,
    "mag": 0,
    "skl": 4,
    "spd": 4,
    "lck": 0,
    "def": 4,
    "res": 0,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ソードナイト(女)",
    "hp": 18,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 6,
    "lck": 0,
    "def": 5,
    "res": 1,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ソードナイト(男)",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 5,
    "lck": 0,
    "def": 6,
    "res": 0,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ソードマスター(女)",
    "hp": 19,
    "str": 4,
    "mag": 2,
    "skl": 7,
    "spd": 8,
    "lck": 0,
    "def": 5,
    "res": 3,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "ソードマスター(男)",
    "hp": 21,
    "str": 5,
    "mag": 2,
    "skl": 7,
    "spd": 7,
    "lck": 0,
    "def": 5,
    "res": 2,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "タカ",
    "hp": 26,
    "str": 12,
    "mag": 2,
    "skl": 11,
    "spd": 11,
    "lck": 0,
    "def": 9,
    "res": 5,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "タカ(ティバーン)",
    "hp": 28,
    "str": 15,
    "mag": 3,
    "skl": 12,
    "spd": 11,
    "lck": 0,
    "def": 11,
    "res": 5,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "デイン国王",
    "hp": 25,
    "str": 9,
    "mag": 1,
    "skl": 7,
    "spd": 5,
    "lck": 0,
    "def": 9,
    "res": 1,
    "capacity": 40,
    "tierGuess": "exclusive",
    "confirmedTier": null
   },
   {
    "name": "ドラゴンナイト(女)",
    "hp": 19,
    "str": 6,
    "mag": 0,
    "skl": 4,
    "spd": 3,
    "lck": 0,
    "def": 7,
    "res": 1,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ドラゴンナイト(男)",
    "hp": 20,
    "str": 6,
    "mag": 0,
    "skl": 4,
    "spd": 3,
    "lck": 0,
    "def": 8,
    "res": 0,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ドラゴンマスター(女)",
    "hp": 24,
    "str": 8,
    "mag": 1,
    "skl": 6,
    "spd": 5,
    "lck": 0,
    "def": 9,
    "res": 2,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "ドラゴンマスター(男)",
    "hp": 25,
    "str": 8,
    "mag": 1,
    "skl": 6,
    "spd": 5,
    "lck": 0,
    "def": 10,
    "res": 1,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "ハルバーディア(女)",
    "hp": 22,
    "str": 4,
    "mag": 1,
    "skl": 6,
    "spd": 7,
    "lck": 0,
    "def": 5,
    "res": 3,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "ハルバーディア(男)",
    "hp": 24,
    "str": 6,
    "mag": 1,
    "skl": 6,
    "spd": 6,
    "lck": 0,
    "def": 6,
    "res": 2,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "バンデット",
    "hp": 25,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 4,
    "lck": 0,
    "def": 2,
    "res": 0,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": null
   },
   {
    "name": "バーサーカー",
    "hp": 28,
    "str": 8,
    "mag": 0,
    "skl": 5,
    "spd": 7,
    "lck": 0,
    "def": 6,
    "res": 0,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": null
   },
   {
    "name": "パラディン(ティアマト)",
    "hp": 23,
    "str": 7,
    "mag": 2,
    "skl": 4,
    "spd": 7,
    "lck": 0,
    "def": 8,
    "res": 3,
    "capacity": 20,
    "tierGuess": "exclusive",
    "confirmedTier": "promoted"
   },
   {
    "name": "パラディン(剣・女)",
    "hp": 23,
    "str": 7,
    "mag": 2,
    "skl": 4,
    "spd": 7,
    "lck": 0,
    "def": 8,
    "res": 3,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "パラディン(剣・男)",
    "hp": 23,
    "str": 7,
    "mag": 2,
    "skl": 4,
    "spd": 7,
    "lck": 0,
    "def": 8,
    "res": 3,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "パラディン(弓・女)",
    "hp": 23,
    "str": 7,
    "mag": 2,
    "skl": 4,
    "spd": 7,
    "lck": 0,
    "def": 8,
    "res": 3,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "パラディン(弓・男)",
    "hp": 23,
    "str": 7,
    "mag": 2,
    "skl": 4,
    "spd": 7,
    "lck": 0,
    "def": 8,
    "res": 3,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "パラディン(斧・女)",
    "hp": 23,
    "str": 7,
    "mag": 2,
    "skl": 4,
    "spd": 7,
    "lck": 0,
    "def": 8,
    "res": 3,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "パラディン(斧・男)",
    "hp": 23,
    "str": 7,
    "mag": 2,
    "skl": 4,
    "spd": 7,
    "lck": 0,
    "def": 8,
    "res": 3,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "パラディン(槍・女)",
    "hp": 23,
    "str": 7,
    "mag": 2,
    "skl": 4,
    "spd": 7,
    "lck": 0,
    "def": 8,
    "res": 3,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "パラディン(槍・男)",
    "hp": 23,
    "str": 7,
    "mag": 2,
    "skl": 4,
    "spd": 7,
    "lck": 0,
    "def": 8,
    "res": 3,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "ファルコンナイト",
    "hp": 18,
    "str": 6,
    "mag": 2,
    "skl": 6,
    "spd": 9,
    "lck": 0,
    "def": 5,
    "res": 5,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "note": "ペガサスナイトの上級職と思われる",
    "confirmedTier": "promoted"
   },
   {
    "name": "ペガサスナイト",
    "hp": 14,
    "str": 4,
    "mag": 0,
    "skl": 4,
    "spd": 8,
    "lck": 0,
    "def": 3,
    "res": 2,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ボウナイト(女)",
    "hp": 18,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 6,
    "lck": 0,
    "def": 5,
    "res": 1,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ボウナイト(男)",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 5,
    "lck": 0,
    "def": 6,
    "res": 0,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ランスナイト(女)",
    "hp": 18,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 6,
    "lck": 0,
    "def": 5,
    "res": 1,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "ランスナイト(男)",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 5,
    "lck": 0,
    "def": 6,
    "res": 0,
    "capacity": 15,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "レンジャー",
    "hp": 18,
    "str": 3,
    "mag": 1,
    "skl": 3,
    "spd": 4,
    "lck": 0,
    "def": 5,
    "res": 0,
    "capacity": 20,
    "tierGuess": "promoted_suspected",
    "note": "シーフの上級職と思われる(アサシンと分岐)",
    "confirmedTier": "base"
   },
   {
    "name": "ロード",
    "hp": 22,
    "str": 6,
    "mag": 3,
    "skl": 5,
    "spd": 6,
    "lck": 0,
    "def": 8,
    "res": 2,
    "capacity": 25,
    "tierGuess": "exclusive",
    "note": "主人公(アイク)専用クラスの可能性が高い",
    "confirmedTier": "promoted"
   },
   {
    "name": "ワルキューレ",
    "hp": 19,
    "str": 4,
    "mag": 5,
    "skl": 3,
    "spd": 5,
    "lck": 0,
    "def": 3,
    "res": 8,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "note": "クレリック/司祭系の上級職と思われる",
    "confirmedTier": "promoted"
   },
   {
    "name": "剣士(女)",
    "hp": 15,
    "str": 3,
    "mag": 0,
    "skl": 5,
    "spd": 6,
    "lck": 0,
    "def": 3,
    "res": 1,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "剣士(男)",
    "hp": 17,
    "str": 4,
    "mag": 0,
    "skl": 5,
    "spd": 5,
    "lck": 0,
    "def": 3,
    "res": 0,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "勇者",
    "hp": 22,
    "str": 6,
    "mag": 1,
    "skl": 9,
    "spd": 10,
    "lck": 0,
    "def": 8,
    "res": 2,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "note": "剣士系の上級職(ヒーロー)と思われる",
    "confirmedTier": null
   },
   {
    "name": "司祭(女)",
    "hp": 19,
    "str": 1,
    "mag": 5,
    "skl": 3,
    "spd": 6,
    "lck": 0,
    "def": 2,
    "res": 12,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "note": "クレリックの上級職、杖専用の可能性",
    "confirmedTier": "promoted"
   },
   {
    "name": "司祭(男)",
    "hp": 21,
    "str": 1,
    "mag": 6,
    "skl": 5,
    "spd": 5,
    "lck": 0,
    "def": 3,
    "res": 11,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "note": "クレリックの上級職、杖専用の可能性",
    "confirmedTier": "promoted"
   },
   {
    "name": "子供(女)",
    "hp": 10,
    "str": 0,
    "mag": 0,
    "skl": 0,
    "spd": 0,
    "lck": 0,
    "def": 0,
    "res": 0,
    "capacity": 0,
    "tierGuess": "exclusive",
    "note": "非戦闘NPC。使用対象外",
    "confirmedTier": null
   },
   {
    "name": "子供(男)",
    "hp": 10,
    "str": 0,
    "mag": 0,
    "skl": 0,
    "spd": 0,
    "lck": 0,
    "def": 0,
    "res": 0,
    "capacity": 0,
    "tierGuess": "exclusive",
    "note": "非戦闘NPC。使用対象外",
    "confirmedTier": null
   },
   {
    "name": "市民",
    "hp": 10,
    "str": 0,
    "mag": 0,
    "skl": 0,
    "spd": 0,
    "lck": 0,
    "def": 0,
    "res": 0,
    "capacity": 0,
    "tierGuess": "exclusive",
    "note": "非戦闘NPC。使用対象外",
    "confirmedTier": null
   },
   {
    "name": "戦士",
    "hp": 24,
    "str": 5,
    "mag": 0,
    "skl": 3,
    "spd": 3,
    "lck": 0,
    "def": 3,
    "res": 0,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "note": "ウォーリア/バーサーカーの下級職と思われる",
    "confirmedTier": "base"
   },
   {
    "name": "猫(女)",
    "hp": 26,
    "str": 12,
    "mag": 4,
    "skl": 10,
    "spd": 11,
    "lck": 0,
    "def": 8,
    "res": 6,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "猫(男)",
    "hp": 27,
    "str": 12,
    "mag": 4,
    "skl": 10,
    "spd": 11,
    "lck": 0,
    "def": 9,
    "res": 5,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "獅子",
    "hp": 30,
    "str": 18,
    "mag": 2,
    "skl": 11,
    "spd": 11,
    "lck": 0,
    "def": 15,
    "res": 5,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "獣牙族(猫・女)",
    "hp": 26,
    "str": 6,
    "mag": 4,
    "skl": 6,
    "spd": 8,
    "lck": 0,
    "def": 3,
    "res": 3,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "獣牙族(猫・男)",
    "hp": 27,
    "str": 6,
    "mag": 4,
    "skl": 6,
    "spd": 8,
    "lck": 0,
    "def": 4,
    "res": 2,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "獣牙族(獅子)",
    "hp": 30,
    "str": 10,
    "mag": 2,
    "skl": 7,
    "spd": 8,
    "lck": 0,
    "def": 10,
    "res": 2,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "獣牙族(虎)",
    "hp": 28,
    "str": 8,
    "mag": 2,
    "skl": 6,
    "spd": 6,
    "lck": 0,
    "def": 7,
    "res": 2,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null,
    "note": "v1.3.3:速さ 7→6(バランス調整・ガトー指示)"
   },
   {
    "name": "白竜",
    "hp": 30,
    "str": 20,
    "mag": 5,
    "skl": 12,
    "spd": 8,
    "lck": 0,
    "def": 15,
    "res": 25,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "神官",
    "hp": 18,
    "str": 0,
    "mag": 3,
    "skl": 3,
    "spd": 3,
    "lck": 0,
    "def": 1,
    "res": 8,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "note": "杖専用職の可能性(仕様上使用しない想定)",
    "confirmedTier": "base"
   },
   {
    "name": "竜鱗族(女)",
    "hp": 30,
    "str": 13,
    "mag": 6,
    "skl": 5,
    "spd": 5,
    "lck": 0,
    "def": 14,
    "res": 16,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "竜鱗族(男)",
    "hp": 35,
    "str": 15,
    "mag": 5,
    "skl": 6,
    "spd": 7,
    "lck": 0,
    "def": 14,
    "res": 13,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "竜鱗族(白竜)",
    "hp": 30,
    "str": 10,
    "mag": 5,
    "skl": 7,
    "spd": 5,
    "lck": 0,
    "def": 10,
    "res": 20,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "虎",
    "hp": 28,
    "str": 15,
    "mag": 2,
    "skl": 10,
    "spd": 9,
    "lck": 0,
    "def": 10,
    "res": 5,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null,
    "note": "v1.3.3:速さ 10→9(化身前と合わせて-1。化身による上昇量+3は維持)"
   },
   {
    "name": "賢者(杖・男)",
    "hp": 20,
    "str": 2,
    "mag": 4,
    "skl": 4,
    "spd": 6,
    "lck": 0,
    "def": 4,
    "res": 6,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "note": "杖専用武器セットの賢者。仕様上使用しない可能性",
    "confirmedTier": "promoted"
   },
   {
    "name": "賢者(軽器・女)",
    "hp": 20,
    "str": 2,
    "mag": 4,
    "skl": 3,
    "spd": 7,
    "lck": 0,
    "def": 3,
    "res": 7,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "賢者(軽器・男)",
    "hp": 20,
    "str": 2,
    "mag": 4,
    "skl": 4,
    "spd": 6,
    "lck": 0,
    "def": 4,
    "res": 6,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "賢者(通常・女)",
    "hp": 20,
    "str": 2,
    "mag": 4,
    "skl": 3,
    "spd": 7,
    "lck": 0,
    "def": 3,
    "res": 7,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "賢者(通常・男)",
    "hp": 20,
    "str": 2,
    "mag": 4,
    "skl": 4,
    "spd": 6,
    "lck": 0,
    "def": 4,
    "res": 6,
    "capacity": 25,
    "tierGuess": "promoted_suspected",
    "confirmedTier": "promoted"
   },
   {
    "name": "赤竜(女)",
    "hp": 30,
    "str": 18,
    "mag": 6,
    "skl": 9,
    "spd": 9,
    "lck": 0,
    "def": 18,
    "res": 21,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "赤竜(男)",
    "hp": 35,
    "str": 25,
    "mag": 5,
    "skl": 12,
    "spd": 10,
    "lck": 0,
    "def": 18,
    "res": 18,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "重歩兵",
    "hp": 20,
    "str": 5,
    "mag": 0,
    "skl": 2,
    "spd": 0,
    "lck": 0,
    "def": 9,
    "res": 0,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "note": "ジェネラルの下級職と思われる",
    "confirmedTier": "base"
   },
   {
    "name": "魔道士(炎特化・男)",
    "hp": 16,
    "str": 0,
    "mag": 1,
    "skl": 2,
    "spd": 3,
    "lck": 0,
    "def": 3,
    "res": 3,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "魔道士(通常・女)",
    "hp": 16,
    "str": 0,
    "mag": 3,
    "skl": 1,
    "spd": 5,
    "lck": 0,
    "def": 1,
    "res": 5,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "魔道士(通常・男)",
    "hp": 16,
    "str": 0,
    "mag": 3,
    "skl": 2,
    "spd": 4,
    "lck": 0,
    "def": 2,
    "res": 4,
    "capacity": 20,
    "tierGuess": "base_suspected",
    "confirmedTier": "base"
   },
   {
    "name": "鳥翼族(カラス)",
    "hp": 24,
    "str": 4,
    "mag": 3,
    "skl": 6,
    "spd": 8,
    "lck": 0,
    "def": 5,
    "res": 3,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "鳥翼族(タカ)",
    "hp": 26,
    "str": 6,
    "mag": 2,
    "skl": 6,
    "spd": 8,
    "lck": 0,
    "def": 5,
    "res": 3,
    "capacity": 25,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "鳥翼族(ティバーン)",
    "hp": 28,
    "str": 8,
    "mag": 2,
    "skl": 7,
    "spd": 8,
    "lck": 0,
    "def": 8,
    "res": 4,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "鳥翼族(ネサラ)",
    "hp": 26,
    "str": 5,
    "mag": 3,
    "skl": 7,
    "spd": 10,
    "lck": 0,
    "def": 7,
    "res": 4,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "鳥翼族(女)",
    "hp": 18,
    "str": 0,
    "mag": 5,
    "skl": 3,
    "spd": 8,
    "lck": 0,
    "def": 1,
    "res": 20,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   },
   {
    "name": "鳥翼族(男)",
    "hp": 18,
    "str": 0,
    "mag": 5,
    "skl": 3,
    "spd": 7,
    "lck": 0,
    "def": 2,
    "res": 20,
    "capacity": 40,
    "tierGuess": "lagz",
    "confirmedTier": null
   }
  ]
 },
 "classesMax": {
  "comment": "出典: pegasusknight.com『クラス/最大パラメータ』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。全89クラス分完了。",
  "status": "complete",
  "uncertain": [],
  "classes": [
   {
    "name": "アクスナイト(女)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 15
   },
   {
    "name": "アクスナイト(男)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "アサシン",
    "hpMax": 60,
    "strMax": 23,
    "magMax": 20,
    "sklMax": 30,
    "spdMax": 30,
    "lckMax": 40,
    "defMax": 22,
    "resMax": 20
   },
   {
    "name": "アーチャー",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ウォーリア",
    "hpMax": 60,
    "strMax": 30,
    "magMax": 20,
    "sklMax": 28,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 25,
    "resMax": 20
   },
   {
    "name": "カラス",
    "hpMax": 65,
    "strMax": 30,
    "magMax": 21,
    "sklMax": 35,
    "spdMax": 38,
    "lckMax": 40,
    "defMax": 28,
    "resMax": 35
   },
   {
    "name": "カラス(ネサラ)",
    "hpMax": 70,
    "strMax": 35,
    "magMax": 25,
    "sklMax": 38,
    "spdMax": 40,
    "lckMax": 40,
    "defMax": 30,
    "resMax": 35
   },
   {
    "name": "クリミア王女",
    "hpMax": 60,
    "strMax": 20,
    "magMax": 25,
    "sklMax": 26,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 24,
    "resMax": 27
   },
   {
    "name": "クレリック",
    "hpMax": 40,
    "strMax": 15,
    "magMax": 20,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "サギ(女)",
    "hpMax": 60,
    "strMax": 10,
    "magMax": 25,
    "sklMax": 20,
    "spdMax": 30,
    "lckMax": 40,
    "defMax": 16,
    "resMax": 40
   },
   {
    "name": "サギ(男)",
    "hpMax": 60,
    "strMax": 10,
    "magMax": 25,
    "sklMax": 20,
    "spdMax": 30,
    "lckMax": 40,
    "defMax": 16,
    "resMax": 40
   },
   {
    "name": "シーフ",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ジェネラル",
    "hpMax": 60,
    "strMax": 29,
    "magMax": 20,
    "sklMax": 27,
    "spdMax": 24,
    "lckMax": 40,
    "defMax": 30,
    "resMax": 25
   },
   {
    "name": "ジェネラル(漆黒の騎士)",
    "hpMax": 70,
    "strMax": 30,
    "magMax": 20,
    "sklMax": 30,
    "spdMax": 35,
    "lckMax": 40,
    "defMax": 30,
    "resMax": 30
   },
   {
    "name": "スナイパー",
    "hpMax": 60,
    "strMax": 25,
    "magMax": 20,
    "sklMax": 30,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 25,
    "resMax": 23
   },
   {
    "name": "ソルジャー(女)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ソルジャー(男)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ソードナイト(女)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 15
   },
   {
    "name": "ソードナイト(男)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ソードマスター(女)",
    "hpMax": 60,
    "strMax": 22,
    "magMax": 20,
    "sklMax": 29,
    "spdMax": 30,
    "lckMax": 40,
    "defMax": 22,
    "resMax": 25
   },
   {
    "name": "ソードマスター(男)",
    "hpMax": 60,
    "strMax": 24,
    "magMax": 20,
    "sklMax": 29,
    "spdMax": 30,
    "lckMax": 40,
    "defMax": 24,
    "resMax": 22
   },
   {
    "name": "タカ",
    "hpMax": 65,
    "strMax": 32,
    "magMax": 20,
    "sklMax": 40,
    "spdMax": 39,
    "lckMax": 40,
    "defMax": 30,
    "resMax": 30
   },
   {
    "name": "タカ(ティバーン)",
    "hpMax": 75,
    "strMax": 40,
    "magMax": 20,
    "sklMax": 40,
    "spdMax": 39,
    "lckMax": 40,
    "defMax": 35,
    "resMax": 30
   },
   {
    "name": "デイン国王",
    "hpMax": 80,
    "strMax": 40,
    "magMax": 40,
    "sklMax": 40,
    "spdMax": 40,
    "lckMax": 40,
    "defMax": 40,
    "resMax": 40
   },
   {
    "name": "ドラゴンナイト(女)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ドラゴンナイト(男)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ドラゴンマスター(女)",
    "hpMax": 60,
    "strMax": 27,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 25
   },
   {
    "name": "ドラゴンマスター(男)",
    "hpMax": 60,
    "strMax": 29,
    "magMax": 20,
    "sklMax": 28,
    "spdMax": 26,
    "lckMax": 40,
    "defMax": 29,
    "resMax": 22
   },
   {
    "name": "ハルバーディア(女)",
    "hpMax": 60,
    "strMax": 25,
    "magMax": 20,
    "sklMax": 28,
    "spdMax": 26,
    "lckMax": 40,
    "defMax": 28,
    "resMax": 25
   },
   {
    "name": "ハルバーディア(男)",
    "hpMax": 60,
    "strMax": 25,
    "magMax": 20,
    "sklMax": 28,
    "spdMax": 26,
    "lckMax": 40,
    "defMax": 28,
    "resMax": 25
   },
   {
    "name": "バンデット",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "バーサーカー",
    "hpMax": 60,
    "strMax": 30,
    "magMax": 20,
    "sklMax": 24,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 26,
    "resMax": 20
   },
   {
    "name": "パラディン(ティアマト)",
    "hpMax": 60,
    "strMax": 25,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 26
   },
   {
    "name": "パラディン(剣・女)",
    "hpMax": 60,
    "strMax": 25,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 26
   },
   {
    "name": "パラディン(剣・男)",
    "hpMax": 60,
    "strMax": 26,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 25
   },
   {
    "name": "パラディン(弓・女)",
    "hpMax": 60,
    "strMax": 25,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 26
   },
   {
    "name": "パラディン(弓・男)",
    "hpMax": 60,
    "strMax": 26,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 25
   },
   {
    "name": "パラディン(斧・女)",
    "hpMax": 60,
    "strMax": 25,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 26
   },
   {
    "name": "パラディン(斧・男)",
    "hpMax": 60,
    "strMax": 26,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 25
   },
   {
    "name": "パラディン(槍・女)",
    "hpMax": 60,
    "strMax": 25,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 26
   },
   {
    "name": "パラディン(槍・男)",
    "hpMax": 60,
    "strMax": 26,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 27,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 25
   },
   {
    "name": "ファルコンナイト",
    "hpMax": 60,
    "strMax": 23,
    "magMax": 20,
    "sklMax": 26,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 24,
    "resMax": 27
   },
   {
    "name": "ペガサスナイト",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ボウナイト(女)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 15
   },
   {
    "name": "ボウナイト(男)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ランスナイト(女)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 15
   },
   {
    "name": "ランスナイト(男)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "レンジャー",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "ロード",
    "hpMax": 60,
    "strMax": 26,
    "magMax": 20,
    "sklMax": 27,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 24,
    "resMax": 22
   },
   {
    "name": "ワルキューレ",
    "hpMax": 60,
    "strMax": 20,
    "magMax": 26,
    "sklMax": 24,
    "spdMax": 26,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 29
   },
   {
    "name": "剣士(女)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "剣士(男)",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "勇者",
    "hpMax": 60,
    "strMax": 26,
    "magMax": 20,
    "sklMax": 27,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 24,
    "resMax": 22
   },
   {
    "name": "司祭(女)",
    "hpMax": 60,
    "strMax": 15,
    "magMax": 29,
    "sklMax": 22,
    "spdMax": 25,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 30
   },
   {
    "name": "司祭(男)",
    "hpMax": 60,
    "strMax": 15,
    "magMax": 29,
    "sklMax": 22,
    "spdMax": 25,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 30
   },
   {
    "name": "子供(女)",
    "hpMax": 60,
    "strMax": 20,
    "magMax": 20,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "子供(男)",
    "hpMax": 60,
    "strMax": 20,
    "magMax": 20,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "市民",
    "hpMax": 60,
    "strMax": 20,
    "magMax": 20,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "戦士",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "猫(女)",
    "hpMax": 70,
    "strMax": 32,
    "magMax": 20,
    "sklMax": 38,
    "spdMax": 39,
    "lckMax": 40,
    "defMax": 32,
    "resMax": 30
   },
   {
    "name": "猫(男)",
    "hpMax": 70,
    "strMax": 35,
    "magMax": 20,
    "sklMax": 38,
    "spdMax": 38,
    "lckMax": 40,
    "defMax": 35,
    "resMax": 27
   },
   {
    "name": "獅子",
    "hpMax": 80,
    "strMax": 40,
    "magMax": 20,
    "sklMax": 39,
    "spdMax": 36,
    "lckMax": 40,
    "defMax": 40,
    "resMax": 30
   },
   {
    "name": "獣牙族(猫・女)",
    "hpMax": 70,
    "strMax": 26,
    "magMax": 20,
    "sklMax": 34,
    "spdMax": 36,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 27
   },
   {
    "name": "獣牙族(猫・男)",
    "hpMax": 70,
    "strMax": 29,
    "magMax": 20,
    "sklMax": 34,
    "spdMax": 35,
    "lckMax": 40,
    "defMax": 30,
    "resMax": 24
   },
   {
    "name": "獣牙族(獅子)",
    "hpMax": 80,
    "strMax": 32,
    "magMax": 20,
    "sklMax": 35,
    "spdMax": 33,
    "lckMax": 40,
    "defMax": 35,
    "resMax": 27
   },
   {
    "name": "獣牙族(虎)",
    "hpMax": 75,
    "strMax": 30,
    "magMax": 20,
    "sklMax": 33,
    "spdMax": 34,
    "lckMax": 40,
    "defMax": 30,
    "resMax": 24
   },
   {
    "name": "白竜",
    "hpMax": 80,
    "strMax": 40,
    "magMax": 25,
    "sklMax": 36,
    "spdMax": 35,
    "lckMax": 40,
    "defMax": 40,
    "resMax": 40
   },
   {
    "name": "神官",
    "hpMax": 40,
    "strMax": 15,
    "magMax": 20,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "竜鱗族(女)",
    "hpMax": 75,
    "strMax": 35,
    "magMax": 20,
    "sklMax": 31,
    "spdMax": 31,
    "lckMax": 40,
    "defMax": 36,
    "resMax": 30
   },
   {
    "name": "竜鱗族(男)",
    "hpMax": 80,
    "strMax": 35,
    "magMax": 20,
    "sklMax": 31,
    "spdMax": 32,
    "lckMax": 40,
    "defMax": 36,
    "resMax": 30
   },
   {
    "name": "竜鱗族(白竜)",
    "hpMax": 80,
    "strMax": 30,
    "magMax": 25,
    "sklMax": 30,
    "spdMax": 32,
    "lckMax": 40,
    "defMax": 35,
    "resMax": 35
   },
   {
    "name": "虎",
    "hpMax": 75,
    "strMax": 37,
    "magMax": 20,
    "sklMax": 37,
    "spdMax": 37,
    "lckMax": 40,
    "defMax": 35,
    "resMax": 27
   },
   {
    "name": "賢者(杖・男)",
    "hpMax": 60,
    "strMax": 15,
    "magMax": 30,
    "sklMax": 28,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 28
   },
   {
    "name": "賢者(軽器・女)",
    "hpMax": 60,
    "strMax": 15,
    "magMax": 30,
    "sklMax": 28,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 28
   },
   {
    "name": "賢者(軽器・男)",
    "hpMax": 60,
    "strMax": 15,
    "magMax": 30,
    "sklMax": 28,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 28
   },
   {
    "name": "賢者(通常・女)",
    "hpMax": 60,
    "strMax": 15,
    "magMax": 30,
    "sklMax": 28,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 28
   },
   {
    "name": "賢者(通常・男)",
    "hpMax": 60,
    "strMax": 15,
    "magMax": 30,
    "sklMax": 28,
    "spdMax": 28,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 28
   },
   {
    "name": "赤竜(女)",
    "hpMax": 75,
    "strMax": 40,
    "magMax": 20,
    "sklMax": 35,
    "spdMax": 35,
    "lckMax": 40,
    "defMax": 40,
    "resMax": 35
   },
   {
    "name": "赤竜(男)",
    "hpMax": 80,
    "strMax": 45,
    "magMax": 20,
    "sklMax": 35,
    "spdMax": 35,
    "lckMax": 40,
    "defMax": 40,
    "resMax": 35
   },
   {
    "name": "重歩兵",
    "hpMax": 40,
    "strMax": 20,
    "magMax": 15,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 20,
    "resMax": 20
   },
   {
    "name": "魔道士(炎特化・男)",
    "hpMax": 40,
    "strMax": 10,
    "magMax": 20,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 10,
    "resMax": 20
   },
   {
    "name": "魔道士(通常・女)",
    "hpMax": 40,
    "strMax": 10,
    "magMax": 20,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 10,
    "resMax": 20
   },
   {
    "name": "魔道士(通常・男)",
    "hpMax": 40,
    "strMax": 10,
    "magMax": 20,
    "sklMax": 20,
    "spdMax": 20,
    "lckMax": 40,
    "defMax": 10,
    "resMax": 20
   },
   {
    "name": "鳥翼族(カラス)",
    "hpMax": 65,
    "strMax": 25,
    "magMax": 20,
    "sklMax": 31,
    "spdMax": 34,
    "lckMax": 40,
    "defMax": 25,
    "resMax": 31
   },
   {
    "name": "鳥翼族(タカ)",
    "hpMax": 65,
    "strMax": 26,
    "magMax": 20,
    "sklMax": 35,
    "spdMax": 36,
    "lckMax": 40,
    "defMax": 26,
    "resMax": 26
   },
   {
    "name": "鳥翼族(ティバーン)",
    "hpMax": 75,
    "strMax": 33,
    "magMax": 20,
    "sklMax": 35,
    "spdMax": 36,
    "lckMax": 40,
    "defMax": 32,
    "resMax": 29
   },
   {
    "name": "鳥翼族(ネサラ)",
    "hpMax": 70,
    "strMax": 29,
    "magMax": 24,
    "sklMax": 34,
    "spdMax": 37,
    "lckMax": 40,
    "defMax": 27,
    "resMax": 32
   },
   {
    "name": "鳥翼族(女)",
    "hpMax": 60,
    "strMax": 10,
    "magMax": 20,
    "sklMax": 17,
    "spdMax": 25,
    "lckMax": 40,
    "defMax": 15,
    "resMax": 35
   },
   {
    "name": "鳥翼族(男)",
    "hpMax": 60,
    "strMax": 10,
    "magMax": 20,
    "sklMax": 17,
    "spdMax": 26,
    "lckMax": 40,
    "defMax": 15,
    "resMax": 35
   }
  ]
 },
 "classesGrowth": {
  "comment": "出典: pegasusknight.com『クラス/パラメータ成長率』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。全89クラス分完了。値は%。",
  "status": "complete",
  "classes": [
   {
    "name": "アクスナイト(女)",
    "hp": 65,
    "str": 35,
    "mag": 20,
    "skl": 40,
    "spd": 55,
    "lck": 30,
    "def": 45,
    "res": 50
   },
   {
    "name": "アクスナイト(男)",
    "hp": 70,
    "str": 45,
    "mag": 15,
    "skl": 40,
    "spd": 50,
    "lck": 30,
    "def": 45,
    "res": 40
   },
   {
    "name": "アサシン",
    "hp": 50,
    "str": 40,
    "mag": 15,
    "skl": 50,
    "spd": 55,
    "lck": 35,
    "def": 20,
    "res": 15
   },
   {
    "name": "アーチャー",
    "hp": 60,
    "str": 40,
    "mag": 10,
    "skl": 60,
    "spd": 55,
    "lck": 30,
    "def": 40,
    "res": 40
   },
   {
    "name": "ウォーリア",
    "hp": 85,
    "str": 60,
    "mag": 10,
    "skl": 35,
    "spd": 50,
    "lck": 30,
    "def": 35,
    "res": 25
   },
   {
    "name": "カラス(ネサラ)",
    "hp": 110,
    "str": 45,
    "mag": 15,
    "skl": 40,
    "spd": 70,
    "lck": 30,
    "def": 30,
    "res": 15
   },
   {
    "name": "カラス",
    "hp": 110,
    "str": 55,
    "mag": 15,
    "skl": 60,
    "spd": 80,
    "lck": 25,
    "def": 35,
    "res": 35
   },
   {
    "name": "クリミア王女",
    "hp": 60,
    "str": 25,
    "mag": 20,
    "skl": 45,
    "spd": 50,
    "lck": 35,
    "def": 30,
    "res": 45
   },
   {
    "name": "クレリック",
    "hp": 50,
    "str": 15,
    "mag": 45,
    "skl": 40,
    "spd": 50,
    "lck": 45,
    "def": 10,
    "res": 50
   },
   {
    "name": "サギ(女)",
    "hp": 50,
    "str": 20,
    "mag": 55,
    "skl": 50,
    "spd": 40,
    "lck": 40,
    "def": 15,
    "res": 50
   },
   {
    "name": "サギ(男)",
    "hp": 50,
    "str": 20,
    "mag": 55,
    "skl": 50,
    "spd": 40,
    "lck": 40,
    "def": 15,
    "res": 50
   },
   {
    "name": "シーフ",
    "hp": 70,
    "str": 45,
    "mag": 15,
    "skl": 60,
    "spd": 60,
    "lck": 40,
    "def": 30,
    "res": 20
   },
   {
    "name": "ジェネラル(漆黒の騎士)",
    "hp": 75,
    "str": 45,
    "mag": 20,
    "skl": 40,
    "spd": 25,
    "lck": 25,
    "def": 55,
    "res": 40
   },
   {
    "name": "ジェネラル",
    "hp": 75,
    "str": 45,
    "mag": 20,
    "skl": 45,
    "spd": 30,
    "lck": 25,
    "def": 55,
    "res": 45
   },
   {
    "name": "スナイパー",
    "hp": 60,
    "str": 45,
    "mag": 10,
    "skl": 55,
    "spd": 45,
    "lck": 30,
    "def": 35,
    "res": 35
   },
   {
    "name": "ソルジャー(女)",
    "hp": 80,
    "str": 35,
    "mag": 15,
    "skl": 50,
    "spd": 50,
    "lck": 25,
    "def": 40,
    "res": 35
   },
   {
    "name": "ソルジャー(男)",
    "hp": 80,
    "str": 40,
    "mag": 15,
    "skl": 50,
    "spd": 45,
    "lck": 25,
    "def": 40,
    "res": 35
   },
   {
    "name": "ソードナイト(女)",
    "hp": 65,
    "str": 35,
    "mag": 20,
    "skl": 40,
    "spd": 55,
    "lck": 30,
    "def": 45,
    "res": 50
   },
   {
    "name": "ソードナイト(男)",
    "hp": 70,
    "str": 45,
    "mag": 15,
    "skl": 40,
    "spd": 50,
    "lck": 30,
    "def": 45,
    "res": 40
   },
   {
    "name": "ソードマスター(女)",
    "hp": 65,
    "str": 45,
    "mag": 10,
    "skl": 65,
    "spd": 65,
    "lck": 30,
    "def": 20,
    "res": 30
   },
   {
    "name": "ソードマスター(男)",
    "hp": 65,
    "str": 45,
    "mag": 10,
    "skl": 65,
    "spd": 65,
    "lck": 30,
    "def": 25,
    "res": 25
   },
   {
    "name": "タカ(ティバーン)",
    "hp": 120,
    "str": 50,
    "mag": 10,
    "skl": 55,
    "spd": 55,
    "lck": 25,
    "def": 35,
    "res": 10
   },
   {
    "name": "タカ",
    "hp": 120,
    "str": 55,
    "mag": 10,
    "skl": 70,
    "spd": 65,
    "lck": 30,
    "def": 45,
    "res": 35
   },
   {
    "name": "デイン国王",
    "hp": 80,
    "str": 50,
    "mag": 50,
    "skl": 50,
    "spd": 50,
    "lck": 50,
    "def": 50,
    "res": 50
   },
   {
    "name": "ドラゴンナイト(女)",
    "hp": 80,
    "str": 50,
    "mag": 10,
    "skl": 50,
    "spd": 45,
    "lck": 25,
    "def": 50,
    "res": 45
   },
   {
    "name": "ドラゴンナイト(男)",
    "hp": 80,
    "str": 55,
    "mag": 10,
    "skl": 50,
    "spd": 40,
    "lck": 25,
    "def": 55,
    "res": 40
   },
   {
    "name": "ドラゴンマスター(女)",
    "hp": 80,
    "str": 45,
    "mag": 10,
    "skl": 40,
    "spd": 40,
    "lck": 25,
    "def": 45,
    "res": 40
   },
   {
    "name": "ドラゴンマスター(男)",
    "hp": 80,
    "str": 50,
    "mag": 10,
    "skl": 40,
    "spd": 35,
    "lck": 25,
    "def": 50,
    "res": 35
   },
   {
    "name": "ハルバーディア(女)",
    "hp": 75,
    "str": 40,
    "mag": 20,
    "skl": 45,
    "spd": 45,
    "lck": 25,
    "def": 40,
    "res": 40
   },
   {
    "name": "ハルバーディア(男)",
    "hp": 75,
    "str": 45,
    "mag": 20,
    "skl": 45,
    "spd": 40,
    "lck": 25,
    "def": 45,
    "res": 40
   },
   {
    "name": "バンデット",
    "hp": 90,
    "str": 60,
    "mag": 10,
    "skl": 30,
    "spd": 50,
    "lck": 25,
    "def": 40,
    "res": 20
   },
   {
    "name": "バーサーカー",
    "hp": 80,
    "str": 60,
    "mag": 10,
    "skl": 25,
    "spd": 40,
    "lck": 25,
    "def": 35,
    "res": 15
   },
   {
    "name": "パラディン(ティアマト)",
    "hp": 65,
    "str": 45,
    "mag": 20,
    "skl": 35,
    "spd": 50,
    "lck": 30,
    "def": 40,
    "res": 45
   },
   {
    "name": "パラディン(弓・女)",
    "hp": 65,
    "str": 45,
    "mag": 20,
    "skl": 35,
    "spd": 50,
    "lck": 30,
    "def": 40,
    "res": 45
   },
   {
    "name": "パラディン(斧・女)",
    "hp": 65,
    "str": 45,
    "mag": 20,
    "skl": 35,
    "spd": 50,
    "lck": 30,
    "def": 40,
    "res": 45
   },
   {
    "name": "パラディン(槍・女)",
    "hp": 65,
    "str": 45,
    "mag": 20,
    "skl": 35,
    "spd": 50,
    "lck": 30,
    "def": 40,
    "res": 45
   },
   {
    "name": "パラディン(剣・女)",
    "hp": 65,
    "str": 45,
    "mag": 20,
    "skl": 35,
    "spd": 50,
    "lck": 30,
    "def": 40,
    "res": 45
   },
   {
    "name": "パラディン(弓・男)",
    "hp": 65,
    "str": 45,
    "mag": 20,
    "skl": 35,
    "spd": 45,
    "lck": 30,
    "def": 45,
    "res": 40
   },
   {
    "name": "パラディン(斧・男)",
    "hp": 65,
    "str": 45,
    "mag": 20,
    "skl": 35,
    "spd": 45,
    "lck": 30,
    "def": 45,
    "res": 40
   },
   {
    "name": "パラディン(槍・男)",
    "hp": 65,
    "str": 45,
    "mag": 20,
    "skl": 35,
    "spd": 45,
    "lck": 30,
    "def": 45,
    "res": 40
   },
   {
    "name": "パラディン(剣・男)",
    "hp": 65,
    "str": 45,
    "mag": 20,
    "skl": 35,
    "spd": 45,
    "lck": 30,
    "def": 45,
    "res": 40
   },
   {
    "name": "ファルコンナイト",
    "hp": 60,
    "str": 35,
    "mag": 20,
    "skl": 45,
    "spd": 50,
    "lck": 35,
    "def": 30,
    "res": 45
   },
   {
    "name": "ペガサスナイト",
    "hp": 60,
    "str": 40,
    "mag": 20,
    "skl": 55,
    "spd": 55,
    "lck": 35,
    "def": 35,
    "res": 50
   },
   {
    "name": "ボウナイト(女)",
    "hp": 65,
    "str": 35,
    "mag": 20,
    "skl": 40,
    "spd": 55,
    "lck": 30,
    "def": 45,
    "res": 50
   },
   {
    "name": "ボウナイト(男)",
    "hp": 70,
    "str": 45,
    "mag": 15,
    "skl": 40,
    "spd": 50,
    "lck": 30,
    "def": 45,
    "res": 40
   },
   {
    "name": "ランスナイト(女)",
    "hp": 65,
    "str": 35,
    "mag": 20,
    "skl": 40,
    "spd": 55,
    "lck": 30,
    "def": 45,
    "res": 50
   },
   {
    "name": "ランスナイト(男)",
    "hp": 70,
    "str": 45,
    "mag": 15,
    "skl": 40,
    "spd": 50,
    "lck": 30,
    "def": 45,
    "res": 40
   },
   {
    "name": "レンジャー",
    "hp": 90,
    "str": 45,
    "mag": 20,
    "skl": 30,
    "spd": 45,
    "lck": 40,
    "def": 15,
    "res": 20
   },
   {
    "name": "ロード",
    "hp": 90,
    "str": 45,
    "mag": 20,
    "skl": 40,
    "spd": 35,
    "lck": 40,
    "def": 15,
    "res": 20
   },
   {
    "name": "ワルキューレ",
    "hp": 50,
    "str": 35,
    "mag": 40,
    "skl": 30,
    "spd": 45,
    "lck": 40,
    "def": 10,
    "res": 45
   },
   {
    "name": "剣士(女)",
    "hp": 60,
    "str": 45,
    "mag": 10,
    "skl": 60,
    "spd": 65,
    "lck": 30,
    "def": 25,
    "res": 30
   },
   {
    "name": "剣士(男)",
    "hp": 65,
    "str": 50,
    "mag": 10,
    "skl": 60,
    "spd": 65,
    "lck": 30,
    "def": 30,
    "res": 25
   },
   {
    "name": "勇者",
    "hp": 90,
    "str": 45,
    "mag": 15,
    "skl": 45,
    "spd": 40,
    "lck": 25,
    "def": 25,
    "res": 20
   },
   {
    "name": "司祭(女)",
    "hp": 50,
    "str": 15,
    "mag": 55,
    "skl": 30,
    "spd": 40,
    "lck": 50,
    "def": 15,
    "res": 55
   },
   {
    "name": "司祭(男)",
    "hp": 50,
    "str": 15,
    "mag": 55,
    "skl": 30,
    "spd": 40,
    "lck": 50,
    "def": 15,
    "res": 55
   },
   {
    "name": "子供(女)",
    "hp": 80,
    "str": 20,
    "mag": 20,
    "skl": 20,
    "spd": 20,
    "lck": 20,
    "def": 20,
    "res": 20
   },
   {
    "name": "子供(男)",
    "hp": 80,
    "str": 20,
    "mag": 20,
    "skl": 20,
    "spd": 20,
    "lck": 20,
    "def": 20,
    "res": 20
   },
   {
    "name": "市民",
    "hp": 80,
    "str": 20,
    "mag": 20,
    "skl": 20,
    "spd": 20,
    "lck": 20,
    "def": 20,
    "res": 20
   },
   {
    "name": "戦士",
    "hp": 85,
    "str": 55,
    "mag": 10,
    "skl": 40,
    "spd": 45,
    "lck": 30,
    "def": 40,
    "res": 30
   },
   {
    "name": "猫(女)",
    "hp": 130,
    "str": 65,
    "mag": 10,
    "skl": 65,
    "spd": 80,
    "lck": 30,
    "def": 65,
    "res": 40
   },
   {
    "name": "猫(男)",
    "hp": 130,
    "str": 70,
    "mag": 10,
    "skl": 65,
    "spd": 75,
    "lck": 30,
    "def": 65,
    "res": 40
   },
   {
    "name": "獅子",
    "hp": 140,
    "str": 70,
    "mag": 10,
    "skl": 80,
    "spd": 70,
    "lck": 30,
    "def": 70,
    "res": 50
   },
   {
    "name": "獣牙族(猫・女)",
    "hp": 130,
    "str": 65,
    "mag": 10,
    "skl": 65,
    "spd": 80,
    "lck": 30,
    "def": 65,
    "res": 40
   },
   {
    "name": "獣牙族(猫・男)",
    "hp": 130,
    "str": 70,
    "mag": 10,
    "skl": 65,
    "spd": 75,
    "lck": 30,
    "def": 65,
    "res": 40
   },
   {
    "name": "獣牙族(虎)",
    "hp": 135,
    "str": 70,
    "mag": 10,
    "skl": 70,
    "spd": 65,
    "lck": 30,
    "def": 70,
    "res": 35
   },
   {
    "name": "獣牙族(獅子)",
    "hp": 140,
    "str": 70,
    "mag": 10,
    "skl": 80,
    "spd": 70,
    "lck": 30,
    "def": 70,
    "res": 60
   },
   {
    "name": "白竜",
    "hp": 130,
    "str": 70,
    "mag": 10,
    "skl": 75,
    "spd": 70,
    "lck": 30,
    "def": 80,
    "res": 80
   },
   {
    "name": "神官",
    "hp": 55,
    "str": 15,
    "mag": 55,
    "skl": 25,
    "spd": 40,
    "lck": 50,
    "def": 20,
    "res": 60
   },
   {
    "name": "竜鱗族(女)",
    "hp": 135,
    "str": 75,
    "mag": 10,
    "skl": 65,
    "spd": 65,
    "lck": 30,
    "def": 80,
    "res": 65
   },
   {
    "name": "竜鱗族(男)",
    "hp": 145,
    "str": 80,
    "mag": 10,
    "skl": 70,
    "spd": 70,
    "lck": 30,
    "def": 80,
    "res": 55
   },
   {
    "name": "竜鱗族(白竜)",
    "hp": 130,
    "str": 70,
    "mag": 10,
    "skl": 75,
    "spd": 70,
    "lck": 30,
    "def": 80,
    "res": 80
   },
   {
    "name": "虎",
    "hp": 135,
    "str": 70,
    "mag": 10,
    "skl": 70,
    "spd": 65,
    "lck": 30,
    "def": 70,
    "res": 35
   },
   {
    "name": "賢者(軽器・女)",
    "hp": 55,
    "str": 10,
    "mag": 55,
    "skl": 45,
    "spd": 50,
    "lck": 20,
    "def": 20,
    "res": 55
   },
   {
    "name": "賢者(軽器・男)",
    "hp": 55,
    "str": 15,
    "mag": 55,
    "skl": 45,
    "spd": 45,
    "lck": 20,
    "def": 35,
    "res": 50
   },
   {
    "name": "賢者(杖・男)",
    "hp": 55,
    "str": 15,
    "mag": 55,
    "skl": 45,
    "spd": 45,
    "lck": 20,
    "def": 35,
    "res": 50
   },
   {
    "name": "賢者(通常・女)",
    "hp": 55,
    "str": 10,
    "mag": 55,
    "skl": 45,
    "spd": 50,
    "lck": 20,
    "def": 20,
    "res": 55
   },
   {
    "name": "賢者(通常・男)",
    "hp": 55,
    "str": 15,
    "mag": 55,
    "skl": 45,
    "spd": 45,
    "lck": 20,
    "def": 35,
    "res": 50
   },
   {
    "name": "赤竜(女)",
    "hp": 135,
    "str": 75,
    "mag": 10,
    "skl": 65,
    "spd": 65,
    "lck": 30,
    "def": 80,
    "res": 65
   },
   {
    "name": "赤竜(男)",
    "hp": 145,
    "str": 80,
    "mag": 10,
    "skl": 70,
    "spd": 70,
    "lck": 30,
    "def": 80,
    "res": 55
   },
   {
    "name": "重歩兵",
    "hp": 75,
    "str": 50,
    "mag": 20,
    "skl": 45,
    "spd": 30,
    "lck": 25,
    "def": 60,
    "res": 45
   },
   {
    "name": "魔道士(通常・女)",
    "hp": 60,
    "str": 15,
    "mag": 65,
    "skl": 50,
    "spd": 55,
    "lck": 20,
    "def": 25,
    "res": 65
   },
   {
    "name": "魔道士(通常・男)",
    "hp": 60,
    "str": 20,
    "mag": 65,
    "skl": 50,
    "spd": 50,
    "lck": 20,
    "def": 30,
    "res": 60
   },
   {
    "name": "魔道士(炎特化・男)",
    "hp": 55,
    "str": 5,
    "mag": 55,
    "skl": 40,
    "spd": 35,
    "lck": 20,
    "def": 5,
    "res": 30
   },
   {
    "name": "鳥翼族(ネサラ)",
    "hp": 110,
    "str": 45,
    "mag": 15,
    "skl": 75,
    "spd": 80,
    "lck": 30,
    "def": 60,
    "res": 65
   },
   {
    "name": "鳥翼族(ティバーン)",
    "hp": 140,
    "str": 70,
    "mag": 10,
    "skl": 80,
    "spd": 75,
    "lck": 30,
    "def": 60,
    "res": 60
   },
   {
    "name": "鳥翼族(女)",
    "hp": 100,
    "str": 20,
    "mag": 15,
    "skl": 15,
    "spd": 70,
    "lck": 40,
    "def": 10,
    "res": 80
   },
   {
    "name": "鳥翼族(男)",
    "hp": 100,
    "str": 20,
    "mag": 15,
    "skl": 15,
    "spd": 70,
    "lck": 40,
    "def": 10,
    "res": 80
   },
   {
    "name": "鳥翼族(カラス)",
    "hp": 110,
    "str": 55,
    "mag": 15,
    "skl": 60,
    "spd": 80,
    "lck": 25,
    "def": 35,
    "res": 35
   },
   {
    "name": "鳥翼族(タカ)",
    "hp": 120,
    "str": 55,
    "mag": 10,
    "skl": 70,
    "spd": 65,
    "lck": 30,
    "def": 45,
    "res": 35
   }
  ]
 },
 "classesCon": {
  "comment": "体格(con)の仮データ。蒼炎の軌跡の職業データ(スクリーンショット)に体格の列がなかったため、職業の系統からAIが仮に設定した値。現在はスキル『鳴動』の判定にのみ使用。ガトー確認待ち。 ラグズ(猫・虎・タカ・カラス・赤竜)の値もv1.2.0で仮に追加。",
  "status": "provisional",
  "classes": {
   "アクスナイト(女)": 9,
   "アクスナイト(男)": 11,
   "アーチャー": 7,
   "クレリック": 5,
   "シーフ": 6,
   "ソルジャー(女)": 6,
   "ソルジャー(男)": 8,
   "ソードナイト(女)": 8,
   "ソードナイト(男)": 10,
   "ドラゴンナイト(女)": 9,
   "ドラゴンナイト(男)": 11,
   "ペガサスナイト": 5,
   "ボウナイト(女)": 8,
   "ボウナイト(男)": 10,
   "ランスナイト(女)": 8,
   "ランスナイト(男)": 10,
   "レンジャー": 9,
   "剣士(女)": 5,
   "剣士(男)": 7,
   "戦士": 11,
   "神官": 6,
   "重歩兵": 13,
   "魔道士(炎特化・男)": 6,
   "魔道士(通常・女)": 5,
   "魔道士(通常・男)": 6,
   "バンデット": 12,
   "猫(女)": 7,
   "猫(男)": 8,
   "虎": 10,
   "タカ": 9,
   "カラス": 7,
   "赤竜(女)": 14,
   "赤竜(男)": 16
  }
 },
 "classWeaponTypes": {
  "comment": "下級職プール(classes_base.json)の各クラスが使用する武器カテゴリ(data/weapons_*.json のcategoryと対応)。スクレイピングしたデータには存在せず、クラス名から筆者(Claude)が推測した案。ガトーの確認・修正が必要。武器LV(weaponLv)の概念は今回のゲームでは使用しないため、各クラスは対応カテゴリの非専用(exclusive:false)武器すべてが抽選対象。",
  "status": "draft - 要確認",
  "classWeaponTypes": [
   {
    "class": "アクスナイト(女)",
    "weaponCategories": [
     "axe"
    ]
   },
   {
    "class": "アクスナイト(男)",
    "weaponCategories": [
     "axe"
    ]
   },
   {
    "class": "アーチャー",
    "weaponCategories": [
     "bow"
    ]
   },
   {
    "class": "クレリック",
    "weaponCategories": [
     "light"
    ],
    "note": "本来は杖専用。ハウスルールで光魔法攻撃可とした件に対応"
   },
   {
    "class": "シーフ",
    "weaponCategories": [
     "knife"
    ]
   },
   {
    "class": "ソルジャー(女)",
    "weaponCategories": [
     "lance"
    ]
   },
   {
    "class": "ソルジャー(男)",
    "weaponCategories": [
     "lance"
    ]
   },
   {
    "class": "ソードナイト(女)",
    "weaponCategories": [
     "sword"
    ]
   },
   {
    "class": "ソードナイト(男)",
    "weaponCategories": [
     "sword"
    ]
   },
   {
    "class": "ドラゴンナイト(女)",
    "weaponCategories": [
     "lance"
    ],
    "note": "竜騎士は槍使用と推測"
   },
   {
    "class": "ドラゴンナイト(男)",
    "weaponCategories": [
     "lance"
    ],
    "note": "竜騎士は槍使用と推測"
   },
   {
    "class": "ペガサスナイト",
    "weaponCategories": [
     "lance"
    ]
   },
   {
    "class": "ボウナイト(女)",
    "weaponCategories": [
     "bow"
    ]
   },
   {
    "class": "ボウナイト(男)",
    "weaponCategories": [
     "bow"
    ]
   },
   {
    "class": "ランスナイト(女)",
    "weaponCategories": [
     "lance"
    ]
   },
   {
    "class": "ランスナイト(男)",
    "weaponCategories": [
     "lance"
    ]
   },
   {
    "class": "レンジャー",
    "weaponCategories": [
     "sword"
    ],
    "note": "アイクは剣使用と記憶しているが要確認"
   },
   {
    "class": "剣士(女)",
    "weaponCategories": [
     "sword"
    ]
   },
   {
    "class": "剣士(男)",
    "weaponCategories": [
     "sword"
    ]
   },
   {
    "class": "戦士",
    "weaponCategories": [
     "axe"
    ]
   },
   {
    "class": "神官",
    "weaponCategories": [
     "light"
    ],
    "note": "本来は杖専用。クレリックと同じハウスルール適用"
   },
   {
    "class": "重歩兵",
    "weaponCategories": [
     "lance"
    ],
    "note": "重装歩兵は槍使用と推測"
   },
   {
    "class": "魔道士(炎特化・男)",
    "weaponCategories": [
     "flame"
    ]
   },
   {
    "class": "魔道士(通常・女)",
    "weaponCategories": [
     "flame",
     "thunder",
     "wind"
    ],
    "note": "炎・雷・風すべて使用可能(ガトー確認済み)"
   },
   {
    "class": "魔道士(通常・男)",
    "weaponCategories": [
     "flame",
     "thunder",
     "wind"
    ],
    "note": "炎・雷・風すべて使用可能(ガトー確認済み)"
   },
   {
    "class": "バンデット",
    "weaponCategories": [
     "axe"
    ]
   }
  ]
 },
 "skills": {
  "comment": "出典: 蒼炎の軌跡スキルデータ(ガトー提供、2026-11-01時点で転記)。全30種のうち、本ゲームの仕様(1vs1・隣接ユニット/地形効果/支援効果なし・武器耐久なし・専用武器なし)では再現不可能、または機能しない以下5種は削除した。 v1.3.4:削除していた能力勝負・地の祝福・空の祝福・女神の加護・武器破壊を、ガトー指示で効果を変えて追加。狙撃の睡眠を復活。衝撃・咆哮・護り手を新規追加。 v1.4.5:ぶちかまし・エリート・大器晩成(抽選あり)、俊足(兵種スキル)を追加。",
  "removed": [],
  "modified": [],
  "skills": [
   {
    "name": "回復",
    "capacity": 15,
    "description": "ラウンド毎でHPの10%を回復します"
   },
   {
    "name": "勇将",
    "capacity": 10,
    "description": "HPが半分になった時、力・技・速さが1.5倍上がります"
   },
   {
    "name": "気分屋",
    "capacity": 5,
    "description": "バイオリズムの効果が普通の倍になります。好調のときは属性の補正も倍になります",
    "note": "v1.4.3:好調のとき、属性の補正(攻撃・防御・命中・回避)も倍"
   },
   {
    "name": "安定",
    "capacity": 5,
    "description": "自分の補正のマイナス(不調・3すくみ不利・相手のスキルや武器による低下)を受けず、相手の追撃も受けません",
    "note": "v1.3.4:説明文を実際の効果(不調→普通)に合わせて修正。v1.4.3:マイナスの補正をすべて受けない(不調・3すくみ不利・恐怖・咆哮・相手の攻速-2)+相手の追撃を受けない。v1.4.4:手斧・手槍系の速さ-1も受けない"
   },
   {
    "name": "待ち伏せ",
    "capacity": 10,
    "description": "毎ラウンド、常に先攻を取ります。敵も持っている場合は、先攻後攻をランダムに振り分けます。"
   },
   {
    "name": "見切り",
    "capacity": 15,
    "description": "敵のスキルを無効にします"
   },
   {
    "name": "怒り",
    "capacity": 10,
    "description": "HPが半分になった時、必殺が出やすくなります"
   },
   {
    "name": "キャンセル",
    "capacity": 10,
    "description": "技の確率で、相手の攻撃を1回無効にします"
   },
   {
    "name": "翼の守護",
    "capacity": 20,
    "description": "技の確率で、相手の攻撃を無効にします"
   },
   {
    "name": "祈り",
    "capacity": 5,
    "description": "当たればHPが0となる攻撃を受けた時、受けるダメージを半分にします"
   },
   {
    "name": "太陽",
    "capacity": 20,
    "description": "一定の確率で、相手に与えたダメージ分、自分が回復します"
   },
   {
    "name": "月光",
    "capacity": 20,
    "description": "技の確率で、相手の防御を半分にします"
   },
   {
    "name": "流星",
    "capacity": 20,
    "description": "技の確率で、ダメージ半分の攻撃を5回連続で行います"
   },
   {
    "name": "連続",
    "capacity": 10,
    "description": "技の確率で、2回連続攻撃します"
   },
   {
    "name": "瞬殺",
    "capacity": 20,
    "description": "技÷2の確率で敵を一撃で倒します。特定の敵にはききません",
    "implementationNote": "「特定の敵」の基準は本ゲームにボス的存在がないため実装時に別途定義する(例:特殊な除外フラグを持つキャラのみ無効、など)"
   },
   {
    "name": "狙撃",
    "capacity": 20,
    "description": "命中率が倍になり、攻撃が当たったとき技÷2の確率で相手を眠らせます",
    "note": "v1.3.4:睡眠を付与。攻撃が当たったとき技÷2の確率。眠った相手は攻撃できず回避0。眠ったラウンドは数えず、次のラウンドから2ラウンド数えて、2ラウンド目の終了時に目覚める v1.4.5:説明文を技÷2に"
   },
   {
    "name": "カウンター",
    "capacity": 10,
    "description": "ダメージを受けた時、技の確率でその75%を相手に与えます",
    "note": "v1.4.3:半分→75%"
   },
   {
    "name": "鳴動",
    "capacity": 20,
    "description": "体格が相手以上のとき、技の確率で与えるダメージを増やします"
   },
   {
    "name": "恐怖",
    "capacity": 10,
    "description": "相手の命中値・必殺値を-10下げます"
   },
   {
    "name": "一発屋",
    "capacity": 10,
    "description": "命中率が半分になりますが、当たれば必ず必殺になります",
    "note": "v1.3.4:最終的な命中率(回避を引いた後)を半分、必殺値+40。v1.4.3:必殺+40→必ず必殺(必殺が出ない武器・女神の加護・護り手の相手には必殺にならない)"
   },
   {
    "name": "疾風の刃",
    "capacity": 20,
    "description": "ウインドと同効果の攻撃を行います",
    "implementationNote": "v1.3.4:技の確率で追加の魔法攻撃。攻撃力=力・魔力の大きいほう+装備している武器の威力(化身前のラグズは0)、相手の魔防で計算。ウインドの効果(飛行系に特効)を持つ"
   },
   {
    "name": "天空",
    "capacity": 20,
    "description": "技の確率で、スキル「太陽」と「月光」の2回攻撃を行います",
    "implementationNote": "「太陽」「月光」それぞれの効果を内包する複合スキル"
   },
   {
    "name": "千里眼",
    "capacity": 0,
    "description": "命中+20が上がります"
   },
   {
    "name": "順風耳",
    "capacity": 0,
    "description": "回避+20が上がります"
   },
   {
    "name": "陽光",
    "capacity": 20,
    "description": "一定の確率で、相手の魔法への防御を半分にします",
    "magicOnly": true,
    "note": "v1.3.4:魔法系(魔法・魔力依存の武器を使う)ユニットにしか抽選で出ない"
   },
   {
    "name": "能力勝負",
    "capacity": 10,
    "description": "お互いの支援、地形効果、スキル、バイオリズムを無効化して戦います",
    "note": "v1.3.4追加。支援・地形はこのゲームにないため、実際はお互いのスキル(武器スキル含む)とバイオリズムを無効化。相手の『見切り』には無効にされる"
   },
   {
    "name": "衝撃",
    "capacity": 20,
    "description": "技の確率で、自分の速さの値を攻撃力に加えて攻撃します",
    "note": "v1.3.4追加(奥義・効果はAI考案)。v1.4.3:守備→速さの値を加える(ガトー指示)"
   },
   {
    "name": "地の祝福",
    "capacity": 20,
    "description": "ラウンド開始時、自分の状態異常とマイナス補正(下がった能力)を消します",
    "note": "v1.3.4追加(奥義)。ポイズン・燃焼・睡眠を治す。継続ダメージより先に治る v1.5.0:状態異常に加えて、咆哮・手斧手槍の速さ-1など戦闘中に下がった能力も0に戻す(ガトー指示)"
   },
   {
    "name": "空の祝福",
    "capacity": 20,
    "description": "ラウンド開始時、自分のHPを20%回復します",
    "note": "v1.3.4追加(奥義)"
   },
   {
    "name": "咆哮",
    "capacity": 20,
    "description": "ラウンド開始時、技の確率で吠え、相手の力・魔力・速さを下げます",
    "note": "v1.3.4追加(奥義・効果はAI考案)。1回につき-3、戦闘終了まで続き、重ねがけは2回(-6)まで"
   },
   {
    "name": "女神の加護",
    "capacity": 30,
    "description": "ほとんどの攻撃を無効化する",
    "rare": true,
    "weight": 0.15,
    "note": "v1.3.4追加。受けるダメージをすべて0にし、相手の必殺を無効にする。エタルド・ラグネル、王族のラグズ(獅子・ティバーン・ネサラ)、赤竜は対象外。抽選ではめったに出ない(約0.5%)"
   },
   {
    "name": "武器破壊",
    "capacity": 15,
    "description": "攻撃が当たったとき、技÷2の確率で相手の武器の威力と効果を無効にします(ラグズの武器は対象外)",
    "note": "v1.3.4追加。攻撃が当たったとき技÷2の確率で発動し、戦闘終了まで続く。威力0・効果(特効・必殺+・能力値+・回避+・2回攻撃・吸収・状態異常・先攻・武器スキル)なし v1.4.5:説明文を技÷2に(発動率は v1.3.4 から技÷2)"
   },
   {
    "name": "護り手",
    "capacity": 10,
    "description": "相手のスキルや武器の効果で能力が下がらず、相手の必殺・瞬殺、デビルアクスの暴発を受けません",
    "note": "v1.3.4追加。『恐怖』『咆哮』などによる能力・命中・必殺の低下を受けない。v1.4.3:相手の必殺を無効(必殺率0)、瞬殺を受けない、自分のデビルアクスが暴発しない、一発屋の命中半減なし、相手の攻速-2を受けない。v1.4.4:手斧・手槍系の速さ-1を受けない"
   },
   {
    "name": "ぶちかまし",
    "capacity": 15,
    "description": "攻撃が当たったとき、体格×1.5の確率で、そのあとに体格の数値のダメージを追加で与えます",
    "note": "v1.4.5追加(ガトー指示)。必殺の3倍はかからない(追加分はそのまま足す) v1.5.0:通常の攻撃のダメージに足すのではなく、攻撃のあとに別の一撃として体格分のダメージ(守備・必殺は関係なし)(ガトー指示)"
   },
   {
    "name": "エリート",
    "capacity": 20,
    "description": "開幕に発動し、上級職(Lv1)にクラスチェンジして戦います。能力値は引き継ぎ、上級職の基本値の差の分だけ上がります",
    "beorcOnly": true,
    "note": "v1.4.5追加(ガトー指示)。ベオク専用(ラグズは抽選に出ない)。上がり幅=上級職の基本値−今の職業の基本値、上限は上級職の上限"
   },
   {
    "name": "大器晩成",
    "capacity": 15,
    "description": "4ラウンド目以降、体格以外の全ての能力値が+3されます",
    "note": "v1.4.5追加(ガトー指示)。4ラウンド目の開始時に発動。HPは最大HPと今のHPが+3"
   },
   {
    "name": "俊足",
    "capacity": 0,
    "description": "回避+20・速さ+3",
    "classOnly": true,
    "note": "v1.4.5追加。魔道士(炎特化・男)の兵種スキル(抽選には出ない)。回避+20は補正に表示"
   }
  ]
 },
 "elementBonus": {
  "comment": "出典: 蒼炎の軌跡『属性別の補正効果(支援レベル上昇時)』(ガトー提供、2026-11-01時点で転記)。原作は支援(隣接ユニット)のレベルに応じて発動するが、本ゲームには支援・隣接ユニットの概念がないため、キャラ自身の属性(data/game_spec.md 3-3参照、生年月日の誕生月で決定)に応じて常時固定で加算する値として採用する(ガトー指示・2026-11-01)。4-2のダメージ/確率計算式における「支援効果」の項に、この値を代入する。 v1.3.0:攻撃・防御の補正を+1→+2に変更(ガトー指示)。 v1.4.3:命中・回避の+5を+10に変更(ガトー指示。天・地は変更なし)。",
  "elements": {
   "炎": {
    "attack": 2,
    "hit": 10,
    "avoid": 0,
    "defense": 0
   },
   "水": {
    "attack": 2,
    "hit": 0,
    "avoid": 0,
    "defense": 2
   },
   "風": {
    "attack": 0,
    "hit": 10,
    "avoid": 10,
    "defense": 0
   },
   "雷": {
    "attack": 0,
    "hit": 0,
    "avoid": 10,
    "defense": 2
   },
   "光": {
    "attack": 0,
    "hit": 10,
    "avoid": 0,
    "defense": 2
   },
   "闇": {
    "attack": 2,
    "hit": 0,
    "avoid": 10,
    "defense": 0
   },
   "天": {
    "attack": 0,
    "hit": 18,
    "avoid": 0,
    "defense": 0
   },
   "地": {
    "attack": 0,
    "hit": 0,
    "avoid": 15,
    "defense": 0
   }
  }
 },
 "laguzClasses": {
  "comment": "ラグズの職業(v1.2.0で解禁)。化身後(transformed)と化身前(untransformed)の基本値・成長率・上限は classes_raw/classes_growth/classes_maxparam の該当クラスを参照する。化身による能力上昇 = 化身後の基本値 − 化身前の基本値。獅子・白竜は除外(ガトー指示)。サギ(攻撃不可)、ティバーン・ネサラ(固有キャラ)も対象外。レベルはLv10相当(ガトー指示、ベオクとの釣り合いのため)。虎・タカ・カラスは元データに男女の区別がないため男女共用とした。赤竜のブレスは物理扱い(赤竜は力が高く魔力が低いため)。 v1.3.1:赤竜は強すぎるため出禁(banned:true。新しく生成されず、保存済みの赤竜もバトルに出せない)。化身ゲージの初期値は幸運、鳥翼族のみ+10(ガトー指示)。 v1.3.3:タカの初期ゲージボーナスを+10→+8、被ダメージ時のゲージ上昇を+2→+3、その場で化身・化身したラウンドは-5免除(ガトー指示)。 v1.4.4:タカのゲージボーナス+8→+6、猫+2を追加、虎の化身後の速さ+1。 v1.4.5:カラスのゲージボーナス+10→+8、化身したラウンドの-5免除を廃止。",
  "level": 10,
  "transformGauge": {
   "max": 20,
   "initial": "幸運(上限20)。タカ+6・カラス+8・猫+2(v1.4.5)",
   "roundGain": 4,
   "damageGain": 3,
   "decay": 5,
   "note": "v1.3.3:最初は化身前。ゲージの初期値は幸運(タカ+8・カラス+10)。化身前ならラウンド1開始時と各ラウンド終了時に+4、ダメージを受けるたびに+3(ポイズン・燃焼は除く)。20になった時点でその場で化身して戦闘を続ける(ただし流星・天空・連続・疾風の刃などスキルによる連続攻撃の最中は、その効果が終わるまで化身しない)。化身したラウンドの終了時は-5しない。化身中はそれ以外のラウンド終了ごとに-5、0で化身が解ける(解けた後もまた溜まる)。化身前も攻撃できるが、爪・くちばし・ブレスの威力は0になる。 v1.4.5:「化身したラウンドの終了時は-5しない」を廃止(化身したラウンドも終了時に-5)。"
  },
  "classes": [
   {
    "name": "猫(女)",
    "untransformed": "獣牙族(猫・女)",
    "tribe": "獣牙族",
    "gender": "女",
    "moveType": "歩行",
    "weapon": "爪(猫)",
    "effectivenessTags": [
     "獣牙族"
    ],
    "colorGroup": "cat"
   },
   {
    "name": "猫(男)",
    "untransformed": "獣牙族(猫・男)",
    "tribe": "獣牙族",
    "gender": "男",
    "moveType": "歩行",
    "weapon": "爪(猫)",
    "effectivenessTags": [
     "獣牙族"
    ],
    "colorGroup": "cat"
   },
   {
    "name": "虎",
    "untransformed": "獣牙族(虎)",
    "tribe": "獣牙族",
    "gender": "共用",
    "moveType": "歩行",
    "weapon": "爪(虎)",
    "effectivenessTags": [
     "獣牙族"
    ],
    "colorGroup": "tiger"
   },
   {
    "name": "タカ",
    "untransformed": "鳥翼族(タカ)",
    "tribe": "鳥翼族",
    "gender": "共用",
    "moveType": "飛行",
    "weapon": "くちばし(タカ)",
    "effectivenessTags": [
     "鳥翼族",
     "飛行系"
    ],
    "colorGroup": "hawk"
   },
   {
    "name": "カラス",
    "untransformed": "鳥翼族(カラス)",
    "tribe": "鳥翼族",
    "gender": "共用",
    "moveType": "飛行",
    "weapon": "くちばし(カラス)",
    "effectivenessTags": [
     "鳥翼族",
     "飛行系"
    ],
    "colorGroup": "raven"
   },
   {
    "name": "赤竜(女)",
    "untransformed": "竜鱗族(女)",
    "tribe": "竜鱗族",
    "gender": "女",
    "moveType": "歩行",
    "weapon": "ブレス(赤竜)",
    "effectivenessTags": [
     "竜鱗族"
    ],
    "colorGroup": "dragon",
    "banned": true
   },
   {
    "name": "赤竜(男)",
    "untransformed": "竜鱗族(男)",
    "tribe": "竜鱗族",
    "gender": "男",
    "moveType": "歩行",
    "weapon": "ブレス(赤竜)",
    "effectivenessTags": [
     "竜鱗族"
    ],
    "colorGroup": "dragon",
    "banned": true
   }
  ],
  "gaugeBonusByTribe": {
   "鳥翼族": 10
  },
  "gaugeBonusByClass": {
   "タカ": 6,
   "カラス": 8,
   "猫(女)": 2,
   "猫(男)": 2
  },
  "gaugeBonusNote": "v1.3.3:クラス別の指定(gaugeBonusByClass)を優先。タカ+8・カラス+10。指定がなければ部族別(gaugeBonusByTribe) v1.4.4:タカ+8→+6、猫0→+2(ガトー指示) v1.4.5:カラス+10→+8(ガトー指示)",
  "transformExtra": {
   "虎": {
    "spd": 1
   }
  },
  "transformExtraNote": "v1.4.4:化身したときの上がり幅に足す分(上限も同じだけ上げる)。虎は速さ+1(ガトー指示)"
 },
 "weapons": {
  "laguz": {
   "comment": "ラグズの武器(化身中の攻撃)。出典:ガトー提供の表(2026-11-01)。ティバーン・ネサラ専用と、ゲームから除外した獅子・白竜の武器は exclusive:true。重さが空欄だったティバーン・ネサラ専用は1とした。三すくみなし、すべて物理扱い。",
   "category": "laguz",
   "weapons": [
    {
     "name": "爪(猫)",
     "weaponLv": null,
     "price": null,
     "might": 8,
     "hit": 90,
     "weight": 1,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "爪(虎)",
     "weaponLv": null,
     "price": null,
     "might": 9,
     "hit": 90,
     "weight": 1,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "爪(獅子)",
     "weaponLv": null,
     "price": null,
     "might": 10,
     "hit": 90,
     "weight": 1,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": "獅子(除外)"
    },
    {
     "name": "くちばし(タカ)",
     "weaponLv": null,
     "price": null,
     "might": 7,
     "hit": 90,
     "weight": 1,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "くちばし(ティバーン)",
     "weaponLv": null,
     "price": null,
     "might": 8,
     "hit": 95,
     "weight": 1,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": "ティバーン"
    },
    {
     "name": "くちばし(カラス)",
     "weaponLv": null,
     "price": null,
     "might": 7,
     "hit": 90,
     "weight": 1,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "くちばし(ネサラ)",
     "weaponLv": null,
     "price": null,
     "might": 8,
     "hit": 95,
     "weight": 1,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": "ネサラ"
    },
    {
     "name": "ブレス(赤竜)",
     "weaponLv": null,
     "price": null,
     "might": 10,
     "hit": 90,
     "weight": 1,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ブレス(白竜)",
     "weaponLv": null,
     "price": null,
     "might": 10,
     "hit": 75,
     "weight": 1,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": "白竜(除外)"
    }
   ]
  },
  "sword": {
   "comment": "出典: pegasusknight.com『アイテム/剣』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。exclusive: true の武器は特定キャラクター専用のためランダム抽選対象から除外する想定(要確認)。ソニックソードはmagicDamage:trueで、攻撃力に力ではなく魔力、相手の防御に守備ではなく魔防を使用する魔力依存武器(2026-11-01修正)。 祈り・回復シリーズ(custom:true、weaponSkillでスキルを付与)はv1.2.0で追加。",
   "category": "sword",
   "weapons": [
    {
     "name": "どくの剣",
     "weaponLv": "D",
     "price": 520,
     "might": 3,
     "hit": 70,
     "weight": 8,
     "uses": 40,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "ポイズン付与",
     "exclusive": false
    },
    {
     "name": "細身の剣",
     "weaponLv": "E",
     "price": 560,
     "might": 3,
     "hit": 100,
     "weight": 5,
     "uses": 35,
     "crit": 5,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "てつの剣",
     "weaponLv": "E",
     "price": 460,
     "might": 5,
     "hit": 90,
     "weight": 7,
     "uses": 46,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "訓練用の剣",
     "weaponLv": "E",
     "price": 230,
     "might": 6,
     "hit": 150,
     "weight": 3,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "必殺が出ない",
     "exclusive": false
    },
    {
     "name": "長柄刀",
     "weaponLv": "D",
     "price": 1260,
     "might": 6,
     "hit": 85,
     "weight": 12,
     "uses": 18,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "アクスナイト・ソードナイト・パラディン・ボウナイト・ランスナイトに特効",
     "desc": "騎馬系に特効",
     "exclusive": false
    },
    {
     "name": "リガルソード",
     "weaponLv": null,
     "price": null,
     "might": 7,
     "hit": 95,
     "weight": 6,
     "uses": 40,
     "crit": 10,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "アクスナイト・ソードナイト・パラディン・ボウナイト・ランスナイト・ジェネラル・重歩兵に特効/アイク専用/売却不可",
     "desc": "騎馬系・アーマー系に特効/アイク専用",
     "exclusive": true,
     "exclusiveOwner": "アイク"
    },
    {
     "name": "はがねの剣",
     "weaponLv": "D",
     "price": 700,
     "might": 8,
     "hit": 75,
     "weight": 12,
     "uses": 35,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "アーマーキラー",
     "weaponLv": "D",
     "price": 1260,
     "might": 8,
     "hit": 80,
     "weight": 14,
     "uses": 18,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "ジェネラル・重歩兵に特効",
     "desc": "アーマー系に特効",
     "exclusive": false
    },
    {
     "name": "てつの大剣",
     "weaponLv": "D",
     "price": 980,
     "might": 9,
     "hit": 70,
     "weight": 15,
     "uses": 35,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "キルソード",
     "weaponLv": "C",
     "price": 1300,
     "might": 9,
     "hit": 75,
     "weight": 9,
     "uses": 20,
     "crit": 30,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false,
     "rarity": 3,
     "rarityNote": "v1.4.5:キラー系はレア度★★→★★★(ガトー指示)"
    },
    {
     "name": "ラグズソード",
     "weaponLv": "C",
     "price": 1800,
     "might": 9,
     "hit": 75,
     "weight": 12,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "カラス・サギ・タカ・猫・獅子・獣牙族・白竜・竜鱗族・虎・赤竜・鳥翼族・黒竜に特効",
     "desc": "ラグズに特効",
     "exclusive": false
    },
    {
     "name": "勇者の剣",
     "weaponLv": "B",
     "price": 5400,
     "might": 9,
     "hit": 75,
     "weight": 16,
     "uses": 30,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "2回攻撃",
     "exclusive": false
    },
    {
     "name": "アミーテ",
     "weaponLv": null,
     "price": null,
     "might": 9,
     "hit": 75,
     "weight": 12,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "エリンシア専用/売却不可/2回攻撃/守備+3/魔防+3",
     "desc": "2回攻撃/守備+3/魔防+3/エリンシア専用",
     "exclusive": true,
     "exclusiveOwner": "エリンシア"
    },
    {
     "name": "ソニックソード",
     "weaponLv": "B",
     "price": 5500,
     "might": 10,
     "hit": 70,
     "weight": 9,
     "uses": 25,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 1,
     "effect": "カラス・クリミア王女・サギ・タカ・デイン国王・ドラゴンナイト・ドラゴンマスター・ファルコンナイト・ペガサスナイトに特効/魔力依存(攻撃力・ダメージ計算に力ではなく魔力、相手の防御力に守備ではなく魔防を使用。剣だが魔法武器として扱う)",
     "desc": "飛行系に特効/魔法武器(魔力で攻撃し、相手は魔防で受ける)",
     "exclusive": false,
     "magicDamage": true
    },
    {
     "name": "はがねの大剣",
     "weaponLv": "C",
     "price": 700,
     "might": 11,
     "hit": 75,
     "weight": 17,
     "uses": 35,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ヴァーグ・カティ",
     "weaponLv": "S",
     "price": null,
     "might": 12,
     "hit": 80,
     "weight": 8,
     "uses": 25,
     "crit": 35,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "売却不可/守備+3",
     "desc": "守備+3",
     "exclusive": true,
     "exclusiveOwner": null
    },
    {
     "name": "ぎんの剣",
     "weaponLv": "A",
     "price": 1875,
     "might": 13,
     "hit": 80,
     "weight": 11,
     "uses": 25,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ぎんの大剣",
     "weaponLv": "A",
     "price": 1800,
     "might": 15,
     "hit": 60,
     "weight": 14,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ルーンソード",
     "weaponLv": "A",
     "price": 7200,
     "might": 15,
     "hit": 65,
     "weight": 19,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "敵に与えたダメージ分、自分のHPを回復",
     "desc": "与えたダメージ分HP回復",
     "exclusive": false
    },
    {
     "name": "エタルド",
     "weaponLv": null,
     "price": null,
     "might": 18,
     "hit": 80,
     "weight": 20,
     "uses": null,
     "crit": 5,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "漆黒の騎士専用/売却不可/守備+5",
     "desc": "守備+5/漆黒の騎士専用",
     "exclusive": true,
     "exclusiveOwner": "漆黒の騎士"
    },
    {
     "name": "ラグネル",
     "weaponLv": null,
     "price": null,
     "might": 18,
     "hit": 80,
     "weight": 20,
     "uses": null,
     "crit": 5,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "アイク専用/売却不可/女神の祝福を受けた防具に攻撃可能/守備+5",
     "desc": "守備+5/アイク専用",
     "exclusive": true,
     "exclusiveOwner": "アイク"
    },
    {
     "name": "グルグラント",
     "weaponLv": null,
     "price": null,
     "might": 20,
     "hit": 90,
     "weight": 25,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "アシュナード専用/売却不可",
     "desc": "アシュナード専用",
     "exclusive": true,
     "exclusiveOwner": "アシュナード"
    },
    {
     "name": "祈りの剣",
     "weaponLv": null,
     "price": null,
     "might": 5,
     "hit": 95,
     "weight": 5,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": "スキル『祈り』が付く(武器スキル)",
     "desc": "スキル『祈り』付き",
     "exclusive": false,
     "custom": true,
     "weaponSkill": "祈り",
     "note": "オリジナル武器(v1.2.0追加、v1.3.0でガトー指示により変更)。性能はてつの剣から命中+5・重さ-2"
    },
    {
     "name": "回復の剣",
     "weaponLv": null,
     "price": null,
     "might": 5,
     "hit": 95,
     "weight": 5,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": "スキル『回復』が付く(武器スキル)",
     "desc": "スキル『回復』付き",
     "exclusive": false,
     "custom": true,
     "weaponSkill": "回復",
     "note": "オリジナル武器(v1.2.0追加、v1.3.0でガトー指示により変更)。性能はてつの剣から命中+5・重さ-2"
    }
   ]
  },
  "lance": {
   "comment": "出典: pegasusknight.com『アイテム/槍』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。exclusive: true の武器は特定キャラクター専用のためランダム抽選対象から除外(CPU専用武器として別途使用予定)。ゼーンズフトは専用表記なしだが売却不可のためnotesに記載。フレイムランスはmagicDamage:trueで、攻撃力に力ではなく魔力、相手の防御に守備ではなく魔防を使用する魔力依存武器(2026-11-01修正)。 祈り・回復シリーズ(custom:true、weaponSkillでスキルを付与)はv1.2.0で追加。",
   "category": "lance",
   "weapons": [
    {
     "name": "どくの槍",
     "weaponLv": "D",
     "price": 440,
     "might": 4,
     "hit": 65,
     "weight": 9,
     "uses": 40,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "ポイズン付与",
     "exclusive": false
    },
    {
     "name": "細身の槍",
     "weaponLv": "E",
     "price": 525,
     "might": 4,
     "hit": 85,
     "weight": 6,
     "uses": 35,
     "crit": 5,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "手槍",
     "weaponLv": "E",
     "price": 500,
     "might": 6,
     "hit": 60,
     "weight": 11,
     "uses": 25,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 1,
     "effect": "ダメージを与えると相手の速さ-1",
     "desc": "ダメージを与えると相手の速さ-1",
     "exclusive": false,
     "note": "v1.4.4:効果を「ダメージを与えると相手の速さ-1」に統一(v1.4.2の回避+20・必殺+10、v1.4.3の相手の攻速-2は削除)"
    },
    {
     "name": "てつの槍",
     "weaponLv": "E",
     "price": 360,
     "might": 7,
     "hit": 80,
     "weight": 8,
     "uses": 45,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ナイトキラー",
     "weaponLv": "D",
     "price": 1170,
     "might": 7,
     "hit": 70,
     "weight": 13,
     "uses": 18,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "アクスナイト・ソードナイト・パラディン・ボウナイト・ランスナイトに特効",
     "desc": "騎馬系に特効",
     "exclusive": false
    },
    {
     "name": "貫きの槍",
     "weaponLv": "D",
     "price": 1260,
     "might": 8,
     "hit": 80,
     "weight": 15,
     "uses": 18,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "ジェネラル・重歩兵に特効",
     "desc": "アーマー系に特効",
     "exclusive": false
    },
    {
     "name": "ショートスピア",
     "weaponLv": "C",
     "price": 1950,
     "might": 9,
     "hit": 70,
     "weight": 12,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "ダメージを与えると相手の速さ-1",
     "desc": "ダメージを与えると相手の速さ-1",
     "exclusive": false,
     "note": "v1.4.4:効果を「ダメージを与えると相手の速さ-1」に統一(v1.4.2の回避+20・必殺+10、v1.4.3の相手の攻速-2は削除)"
    },
    {
     "name": "はがねの槍",
     "weaponLv": "D",
     "price": 560,
     "might": 10,
     "hit": 70,
     "weight": 13,
     "uses": 35,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "キラーランス",
     "weaponLv": "C",
     "price": 1200,
     "might": 10,
     "hit": 70,
     "weight": 10,
     "uses": 20,
     "crit": 30,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false,
     "rarity": 3,
     "rarityNote": "v1.4.5:キラー系はレア度★★→★★★(ガトー指示)"
    },
    {
     "name": "フレイムランス",
     "weaponLv": "B",
     "price": 7500,
     "might": 10,
     "hit": 70,
     "weight": 12,
     "uses": 25,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "猫・獅子・虎に特効/魔力依存(攻撃力・ダメージ計算に力ではなく魔力、相手の防御力に守備ではなく魔防を使用。槍だが魔法武器として扱う)",
     "desc": "獣牙族に特効/魔法武器(魔力で攻撃し、相手は魔防で受ける)",
     "exclusive": false,
     "magicDamage": true
    },
    {
     "name": "勇者の槍",
     "weaponLv": "B",
     "price": 5700,
     "might": 11,
     "hit": 70,
     "weight": 17,
     "uses": 30,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "2回攻撃",
     "exclusive": false
    },
    {
     "name": "ラグズランス",
     "weaponLv": "C",
     "price": 1620,
     "might": 12,
     "hit": 75,
     "weight": 14,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "カラス・サギ・タカ・猫・獅子・獣牙族・白竜・竜鱗族・虎・赤竜・鳥翼族・黒竜に特効",
     "desc": "ラグズに特効",
     "exclusive": false
    },
    {
     "name": "スレンドスピア",
     "weaponLv": "B",
     "price": 5700,
     "might": 12,
     "hit": 70,
     "weight": 15,
     "uses": 15,
     "crit": 5,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "ダメージを与えると相手の速さ-1",
     "desc": "ダメージを与えると相手の速さ-1",
     "exclusive": false,
     "note": "v1.4.4:効果を「ダメージを与えると相手の速さ-1」に統一(v1.4.2の回避+20・必殺+10、v1.4.3の相手の攻速-2は削除)"
    },
    {
     "name": "ぎんの槍",
     "weaponLv": "A",
     "price": 1500,
     "might": 15,
     "hit": 75,
     "weight": 12,
     "uses": 25,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ゼーンズフト",
     "weaponLv": "S",
     "price": null,
     "might": 16,
     "hit": 80,
     "weight": 15,
     "uses": 20,
     "crit": 5,
     "range": [
      1,
      2
     ],
     "weaponExp": 1,
     "effect": "売却不可/幸運+3",
     "desc": "幸運+3",
     "exclusive": false,
     "notes": "専用キャラ表記なしだが売却不可。Sランクのため扱いは要検討(通常ランダム抽選に含めるか、CPU専用枠にするか)"
    },
    {
     "name": "祈りの槍",
     "weaponLv": null,
     "price": null,
     "might": 7,
     "hit": 85,
     "weight": 6,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": "スキル『祈り』が付く(武器スキル)",
     "desc": "スキル『祈り』付き",
     "exclusive": false,
     "custom": true,
     "weaponSkill": "祈り",
     "note": "オリジナル武器(v1.2.0追加、v1.3.0でガトー指示により変更)。性能はてつの槍から命中+5・重さ-2"
    },
    {
     "name": "回復の槍",
     "weaponLv": null,
     "price": null,
     "might": 7,
     "hit": 85,
     "weight": 6,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": "スキル『回復』が付く(武器スキル)",
     "desc": "スキル『回復』付き",
     "exclusive": false,
     "custom": true,
     "weaponSkill": "回復",
     "note": "オリジナル武器(v1.2.0追加、v1.3.0でガトー指示により変更)。性能はてつの槍から命中+5・重さ-2"
    }
   ]
  },
  "axe": {
   "comment": "出典: pegasusknight.com『アイテム/斧』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。斧カテゴリには専用武器(exclusive)は含まれていなかった。ボルトアクスはmagicDamage:trueで、攻撃力に力ではなく魔力、相手の防御に守備ではなく魔防を使用する魔力依存武器。デビルアクスはselfDamageフィールドで自傷効果を表現(いずれも2026-11-01修正、デビルアクスの自傷確率はオリジナル仕様でガトー確認待ち)。 祈り・回復シリーズ(custom:true、weaponSkillでスキルを付与)はv1.2.0で追加。",
   "category": "axe",
   "weapons": [
    {
     "name": "どくの斧",
     "weaponLv": "D",
     "price": 360,
     "might": 5,
     "hit": 60,
     "weight": 11,
     "uses": 40,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "ポイズン付与",
     "exclusive": false
    },
    {
     "name": "手斧",
     "weaponLv": "E",
     "price": 375,
     "might": 7,
     "hit": 55,
     "weight": 13,
     "uses": 25,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 1,
     "effect": "ダメージを与えると相手の速さ-1",
     "desc": "ダメージを与えると相手の速さ-1",
     "exclusive": false,
     "note": "v1.4.4:効果を「ダメージを与えると相手の速さ-1」に統一(v1.4.2の回避+20・必殺+10、v1.4.3の相手の攻速-2は削除)"
    },
    {
     "name": "訓練用の斧",
     "weaponLv": "E",
     "price": 225,
     "might": 8,
     "hit": 150,
     "weight": 4,
     "uses": 45,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "必殺が出ない/消耗しない",
     "desc": "必殺が出ない",
     "exclusive": false
    },
    {
     "name": "てつの斧",
     "weaponLv": "E",
     "price": 270,
     "might": 8,
     "hit": 75,
     "weight": 10,
     "uses": 45,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ハンマー",
     "weaponLv": "D",
     "price": 800,
     "might": 10,
     "hit": 55,
     "weight": 17,
     "uses": 20,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "ジェネラル・重歩兵に特効",
     "desc": "アーマー系に特効",
     "exclusive": false
    },
    {
     "name": "ポールアクス",
     "weaponLv": "D",
     "price": 810,
     "might": 10,
     "hit": 60,
     "weight": 15,
     "uses": 18,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "アクスナイト・ソードナイト・パラディン・ボウナイト・ランスナイトに特効",
     "desc": "騎馬系に特効",
     "exclusive": false
    },
    {
     "name": "ショートアクス",
     "weaponLv": "C",
     "price": 1500,
     "might": 10,
     "hit": 65,
     "weight": 13,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "ダメージを与えると相手の速さ-1",
     "desc": "ダメージを与えると相手の速さ-1",
     "exclusive": false,
     "note": "v1.4.4:効果を「ダメージを与えると相手の速さ-1」に統一(v1.4.2の回避+20・必殺+10、v1.4.3の相手の攻速-2は削除)"
    },
    {
     "name": "ボルトアクス",
     "weaponLv": "B",
     "price": 3750,
     "might": 10,
     "hit": 70,
     "weight": 12,
     "uses": 25,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "白竜・赤竜・黒竜に特効/魔力依存(攻撃力・ダメージ計算に力ではなく魔力、相手の防御力に守備ではなく魔防を使用。斧だが魔法武器として扱う)",
     "desc": "竜鱗族に特効/魔法武器(魔力で攻撃し、相手は魔防で受ける)",
     "exclusive": false,
     "magicDamage": true
    },
    {
     "name": "勇者の斧",
     "weaponLv": "B",
     "price": 5250,
     "might": 10,
     "hit": 65,
     "weight": 20,
     "uses": 30,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "2回攻撃",
     "exclusive": false
    },
    {
     "name": "はがねの斧",
     "weaponLv": "E",
     "price": 420,
     "might": 11,
     "hit": 65,
     "weight": 15,
     "uses": 35,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "キラーアクス",
     "weaponLv": "C",
     "price": 1000,
     "might": 12,
     "hit": 65,
     "weight": 12,
     "uses": 20,
     "crit": 30,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false,
     "rarity": 3,
     "rarityNote": "v1.4.5:キラー系はレア度★★→★★★(ガトー指示)"
    },
    {
     "name": "ラグズアクス",
     "weaponLv": "C",
     "price": 5250,
     "might": 13,
     "hit": 65,
     "weight": 13,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": "カラス・サギ・タカ・猫・獅子・獣牙族・白竜・竜鱗族・虎・赤竜・鳥翼族・黒竜に特効",
     "desc": "ラグズに特効",
     "exclusive": false
    },
    {
     "name": "トマホーク",
     "weaponLv": "B",
     "price": 5550,
     "might": 13,
     "hit": 65,
     "weight": 17,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "ダメージを与えると相手の速さ-1",
     "desc": "ダメージを与えると相手の速さ-1",
     "exclusive": false,
     "note": "v1.4.4:効果を「ダメージを与えると相手の速さ-1」に統一(v1.4.2の回避+20・必殺+10、v1.4.3の相手の攻速-2は削除)"
    },
    {
     "name": "ぎんの斧",
     "weaponLv": "A",
     "price": 1250,
     "might": 16,
     "hit": 70,
     "weight": 14,
     "uses": 25,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "デビルアクス",
     "weaponLv": "E",
     "price": 900,
     "might": 18,
     "hit": 55,
     "weight": 18,
     "uses": 20,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 8,
     "effect": "自傷効果(命中時、一定確率で攻撃が自分に跳ね返り、威力そのまま・防御無視のダメージを自分が受ける。確率=max(0, 20-幸運)%)",
     "desc": "命中時、(20−幸運)%で自分にダメージ",
     "exclusive": false,
     "selfDamage": {
      "chanceFormula": "max(0, 20 - 幸運)",
      "chanceNote": "攻撃側の幸運を参照。幸運20以上で発生率0%",
      "damage": "武器の威力(18)をそのまま自分が受ける(防御力を参照しない)。必殺修正は適用しない",
      "trigger": "命中判定に成功した攻撃のたびに、ダメージ計算の前に自傷判定を行う。自傷が発生した場合、相手への攻撃は不発(ダメージ0)とし、代わりに自分がダメージを受ける",
      "note": "蒼炎の軌跡の正確な自傷確率データが未確認のため、既存の確率計算式(幸運ベース)に合わせたオリジナル仕様。ガトー確認待ち"
     }
    },
    {
     "name": "祈りの斧",
     "weaponLv": null,
     "price": null,
     "might": 8,
     "hit": 80,
     "weight": 8,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": "スキル『祈り』が付く(武器スキル)",
     "desc": "スキル『祈り』付き",
     "exclusive": false,
     "custom": true,
     "weaponSkill": "祈り",
     "note": "オリジナル武器(v1.2.0追加、v1.3.0でガトー指示により変更)。性能はてつの斧から命中+5・重さ-2"
    },
    {
     "name": "回復の斧",
     "weaponLv": null,
     "price": null,
     "might": 8,
     "hit": 80,
     "weight": 8,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": "スキル『回復』が付く(武器スキル)",
     "desc": "スキル『回復』付き",
     "exclusive": false,
     "custom": true,
     "weaponSkill": "回復",
     "note": "オリジナル武器(v1.2.0追加、v1.3.0でガトー指示により変更)。性能はてつの斧から命中+5・重さ-2"
    }
   ]
  },
  "bow": {
   "comment": "出典: pegasusknight.com『アイテム/弓』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。弓は全種、飛行系ユニット(カラス・クリミア王女・サギ・タカ・デイン国王・ドラゴンナイト・ドラゴンマスター・ファルコンナイト・ペガサスナイト)に共通で特効がある(flierEffectiveness:trueで表現、effectには追加効果のみ記載)。ラグズボウの重量は10で確定(ガトー確認済み)。ロングアーチ・キラーアーチ・投石器・アイアンアーチは射程3~10以上の攻城兵器で、1対1闘技場のランダム抽選からは除外確定(exclusive:trueで表現、使うならCPU/イベント専用枠)。ブライトボウはmagicDamage:trueで、攻撃力に力ではなく魔力、相手の防御に守備ではなく魔防を使用する魔力依存武器(2026-11-01修正)。 祈り・回復シリーズ(custom:true、weaponSkillでスキルを付与)はv1.2.0で追加。",
   "category": "bow",
   "flierEffectivenessNote": "このカテゴリの武器は全て、カラス・クリミア王女・サギ・タカ・デイン国王・ドラゴンナイト・ドラゴンマスター・ファルコンナイト・ペガサスナイトに特効を持つ",
   "weapons": [
    {
     "name": "どくの弓",
     "weaponLv": "D",
     "price": 600,
     "might": 4,
     "hit": 65,
     "weight": 5,
     "uses": 40,
     "crit": 0,
     "range": [
      2,
      2
     ],
     "weaponExp": 1,
     "effect": "ポイズン付与",
     "exclusive": false
    },
    {
     "name": "長弓",
     "weaponLv": "D",
     "price": 2000,
     "might": 5,
     "hit": 65,
     "weight": 10,
     "uses": 20,
     "crit": 0,
     "range": [
      2,
      3
     ],
     "weaponExp": 2,
     "effect": "アーチャー・スナイパー専用",
     "exclusive": true,
     "exclusiveOwner": "アーチャー/スナイパー(職業専用)"
    },
    {
     "name": "てつの弓",
     "weaponLv": "E",
     "price": 540,
     "might": 6,
     "hit": 85,
     "weight": 5,
     "uses": 45,
     "crit": 0,
     "range": [
      2,
      2
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "バルフレチェ",
     "weaponLv": "S",
     "price": null,
     "might": 7,
     "hit": 65,
     "weight": 10,
     "uses": 20,
     "crit": 0,
     "range": [
      4,
      4
     ],
     "weaponExp": 2,
     "effect": "アーチャー・スナイパー専用/売却不可/力+3",
     "desc": "力+3/アーチャー・スナイパー専用",
     "exclusive": true,
     "exclusiveOwner": "アーチャー/スナイパー(職業専用)"
    },
    {
     "name": "ヨファの弓",
     "weaponLv": null,
     "price": null,
     "might": 8,
     "hit": 100,
     "weight": 2,
     "uses": 45,
     "crit": 5,
     "range": [
      2,
      2
     ],
     "weaponExp": 2,
     "effect": "ヨファ専用/売却不可",
     "exclusive": true,
     "exclusiveOwner": "ヨファ"
    },
    {
     "name": "はがねの弓",
     "weaponLv": "D",
     "price": 840,
     "might": 9,
     "hit": 70,
     "weight": 9,
     "uses": 35,
     "crit": 0,
     "range": [
      2,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "キラーボウ",
     "weaponLv": "C",
     "price": 1050,
     "might": 9,
     "hit": 75,
     "weight": 7,
     "uses": 15,
     "crit": 30,
     "range": [
      2,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false,
     "rarity": 3,
     "rarityNote": "v1.4.5:キラー系はレア度★★→★★★(ガトー指示)"
    },
    {
     "name": "ラグズボウ",
     "weaponLv": "C",
     "price": 1950,
     "might": 10,
     "hit": 75,
     "weight": 10,
     "uses": 15,
     "crit": 0,
     "range": [
      2,
      2
     ],
     "weaponExp": 2,
     "effect": "カラス・サギ・タカ・猫・獅子・獣牙族・白竜・竜鱗族・虎・赤竜・鳥翼族・黒竜に特効",
     "desc": "ラグズに特効",
     "exclusive": false
    },
    {
     "name": "ブライトボウ",
     "weaponLv": "B",
     "price": 5750,
     "might": 10,
     "hit": 70,
     "weight": 9,
     "uses": 25,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 1,
     "effect": "魔力依存(攻撃力・ダメージ計算に力ではなく魔力、相手の防御力に守備ではなく魔防を使用。弓だが魔法武器として扱う)",
     "desc": "魔法武器(魔力で攻撃し、相手は魔防で受ける)",
     "exclusive": false,
     "magicDamage": true
    },
    {
     "name": "勇者の弓",
     "weaponLv": "B",
     "price": 5850,
     "might": 10,
     "hit": 70,
     "weight": 12,
     "uses": 30,
     "crit": 0,
     "range": [
      2,
      2
     ],
     "weaponExp": 1,
     "effect": "2回攻撃",
     "exclusive": false
    },
    {
     "name": "ぎんの弓",
     "weaponLv": "A",
     "price": 2000,
     "might": 13,
     "hit": 75,
     "weight": 6,
     "uses": 25,
     "crit": 0,
     "range": [
      2,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ロングアーチ",
     "weaponLv": "E",
     "price": 0,
     "might": 18,
     "hit": 100,
     "weight": 20,
     "uses": 5,
     "crit": 0,
     "range": [
      3,
      10
     ],
     "weaponExp": 4,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": null,
     "notes": "攻城兵器(範囲3~10)。1対1闘技場のランダム抽選からは除外確定(ガトー確認済み)"
    },
    {
     "name": "キラーアーチ",
     "weaponLv": "E",
     "price": 0,
     "might": 20,
     "hit": 95,
     "weight": 20,
     "uses": 5,
     "crit": 10,
     "range": [
      3,
      10
     ],
     "weaponExp": 4,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": null,
     "notes": "攻城兵器(範囲3~10)。1対1闘技場のランダム抽選からは除外確定(ガトー確認済み)"
    },
    {
     "name": "投石器",
     "weaponLv": "E",
     "price": 0,
     "might": 20,
     "hit": 255,
     "weight": 20,
     "uses": 5,
     "crit": 0,
     "range": [
      3,
      10
     ],
     "weaponExp": 4,
     "effect": "必ず命中/必殺が出ない",
     "exclusive": true,
     "exclusiveOwner": null,
     "notes": "攻城兵器(範囲3~10)。1対1闘技場のランダム抽選からは除外確定(ガトー確認済み)"
    },
    {
     "name": "アイアンアーチ",
     "weaponLv": "E",
     "price": 0,
     "might": 22,
     "hit": 90,
     "weight": 20,
     "uses": 5,
     "crit": 0,
     "range": [
      3,
      15
     ],
     "weaponExp": 4,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": null,
     "notes": "攻城兵器(範囲3~15)。1対1闘技場のランダム抽選からは除外確定(ガトー確認済み)"
    },
    {
     "name": "祈りの弓",
     "weaponLv": null,
     "price": null,
     "might": 6,
     "hit": 90,
     "weight": 3,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": "スキル『祈り』が付く(武器スキル)",
     "desc": "スキル『祈り』付き",
     "exclusive": false,
     "custom": true,
     "weaponSkill": "祈り",
     "note": "オリジナル武器(v1.2.0追加、v1.3.0でガトー指示により変更)。性能はてつの弓から命中+5・重さ-2"
    },
    {
     "name": "回復の弓",
     "weaponLv": null,
     "price": null,
     "might": 6,
     "hit": 90,
     "weight": 3,
     "uses": null,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": null,
     "effect": "スキル『回復』が付く(武器スキル)",
     "desc": "スキル『回復』付き",
     "exclusive": false,
     "custom": true,
     "weaponSkill": "回復",
     "note": "オリジナル武器(v1.2.0追加、v1.3.0でガトー指示により変更)。性能はてつの弓から命中+5・重さ-2"
    }
   ]
  },
  "knife": {
   "comment": "出典: pegasusknight.com『アイテム/軽器』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。武器LVの概念がなく(シーフ/盗賊系職業が無条件で使用)、専用武器なし。custom:true の2種はバランス調整のためAIが考案したオリジナル武器(蒼炎の軌跡には存在しない、ガトー確認済み・ネーミング一任)。名称はカタカナで統一。",
   "category": "knife",
   "weapons": [
    {
     "name": "ナイフ",
     "weaponLv": null,
     "price": 480,
     "might": 2,
     "hit": 100,
     "weight": 2,
     "uses": 30,
     "crit": 5,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ダガー",
     "weaponLv": null,
     "price": 600,
     "might": 4,
     "hit": 90,
     "weight": 4,
     "uses": 30,
     "crit": 0,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "スティレット",
     "weaponLv": null,
     "price": 1500,
     "might": 8,
     "hit": 95,
     "weight": 8,
     "uses": 20,
     "crit": 10,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "ジェネラル・重歩兵に特効",
     "desc": "アーマー系に特効",
     "exclusive": false
    },
    {
     "name": "ポイズンニードル",
     "weaponLv": null,
     "price": null,
     "might": 6,
     "hit": 90,
     "weight": 3,
     "uses": 25,
     "crit": 5,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "ポイズン付与(命中時、対象に2ターンの継続ダメージ。毎ターンHPの8%を失う)",
     "desc": "ポイズン付与",
     "exclusive": false,
     "custom": true,
     "note": "オリジナル武器(バランス調整用)。旧名:忍びの毒針"
    },
    {
     "name": "シャドウエッジ",
     "weaponLv": null,
     "price": null,
     "might": 10,
     "hit": 85,
     "weight": 6,
     "uses": 20,
     "crit": 10,
     "range": [
      1,
      1
     ],
     "weaponExp": 1,
     "effect": "必ず先攻を取れる(速さの数値に関わらず、この武器を装備している側が先手)",
     "desc": "必ず先攻",
     "exclusive": false,
     "custom": true,
     "note": "オリジナル武器(バランス調整用)。旧名:隠し刃"
    }
   ]
  },
  "flame": {
   "comment": "出典: pegasusknight.com『アイテム/炎』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。炎は全種、猫・獅子・虎に共通で特効がある。メティオは射程3~10の攻城兵器のため、弓の攻城兵器4種と同じ方針でランダム抽選から除外(exclusive:true)。custom:trueの1種は魔道士の選択肢を広げるためAIが考案したオリジナル武器(蒼炎の軌跡には存在しない、ガトー確認済み・ネーミング一任)。 v1.3.0:紅蓮の書の『やけど』を『燃焼』(毎ターン最大HPの20%)に変更。 v1.3.4:レクスフレイムを追加(ガトー提供)。",
   "category": "flame",
   "effectivenessNote": "このカテゴリの武器は全て、猫・獅子・虎に特効を持つ",
   "weapons": [
    {
     "name": "ファイアー",
     "weaponLv": "E",
     "price": 560,
     "might": 3,
     "hit": 95,
     "weight": 3,
     "uses": 40,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "エルファイアー",
     "weaponLv": "D",
     "price": 1800,
     "might": 5,
     "hit": 85,
     "weight": 5,
     "uses": 30,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ボルガノン",
     "weaponLv": "A",
     "price": 2000,
     "might": 9,
     "hit": 85,
     "weight": 9,
     "uses": 20,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "メティオ",
     "weaponLv": "C",
     "price": 750,
     "might": 11,
     "hit": 70,
     "weight": 11,
     "uses": 5,
     "crit": 0,
     "range": [
      3,
      10
     ],
     "weaponExp": 3,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": null,
     "notes": "攻城兵器(範囲3~10)。1対1闘技場のランダム抽選からは除外(弓の攻城兵器と同方針)"
    },
    {
     "name": "紅蓮の書",
     "weaponLv": null,
     "price": null,
     "might": 9,
     "hit": 75,
     "weight": 10,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "猫・獅子・虎に特効/燃焼付与(命中時、対象に2ターンの継続ダメージ。毎ターンHPの20%を失う)",
     "desc": "獣牙族に特効/燃焼付与",
     "exclusive": false,
     "custom": true,
     "note": "オリジナル武器(バランス調整用)、上位枠。威力-4調整済み"
    },
    {
     "name": "レクスフレイム",
     "weaponLv": "S",
     "price": null,
     "might": 14,
     "hit": 85,
     "weight": 12,
     "uses": 20,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "獣牙族に特効/速さ+3",
     "exclusive": false,
     "note": "v1.3.4追加(ガトー提供)。蒼炎では未使用データ(正式登場は暁の女神)。内部名FORBLAZE。炎の共通特効(猫・獅子・虎)に加えて獣牙族に特効"
    }
   ]
  },
  "thunder": {
   "comment": "出典: pegasusknight.com『アイテム/雷』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。雷は全種、白竜・赤竜・黒竜に共通で特効がある。サンダーストームは射程3~10の攻城兵器のため除外(exclusive:true)。custom:trueの1種は魔道士の選択肢を広げるためAIが考案したオリジナル武器(蒼炎の軌跡には存在しない、ガトー確認済み・ネーミング一任)。 v1.3.4:レクスボルトをキャラ生成の抽選に解禁(ガトー指示)。",
   "category": "thunder",
   "effectivenessNote": "このカテゴリの武器は全て、白竜・赤竜・黒竜に特効を持つ",
   "weapons": [
    {
     "name": "サンダー",
     "weaponLv": "E",
     "price": 600,
     "might": 4,
     "hit": 85,
     "weight": 3,
     "uses": 40,
     "crit": 5,
     "range": [
      1,
      2
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "エルサンダー",
     "weaponLv": "D",
     "price": 1950,
     "might": 7,
     "hit": 75,
     "weight": 6,
     "uses": 30,
     "crit": 10,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "トロン",
     "weaponLv": "A",
     "price": 2200,
     "might": 10,
     "hit": 85,
     "weight": 7,
     "uses": 20,
     "crit": 5,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "サンダーストーム",
     "weaponLv": "C",
     "price": 800,
     "might": 13,
     "hit": 65,
     "weight": 13,
     "uses": 5,
     "crit": 5,
     "range": [
      3,
      10
     ],
     "weaponExp": 3,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": null,
     "notes": "攻城兵器(範囲3~10)。1対1闘技場のランダム抽選からは除外(弓の攻城兵器と同方針)"
    },
    {
     "name": "レクスボルト",
     "weaponLv": "S",
     "price": null,
     "might": 15,
     "hit": 75,
     "weight": 14,
     "uses": 20,
     "crit": 10,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "売却不可/技+3",
     "desc": "技+3",
     "exclusive": false,
     "exclusiveOwner": null,
     "notes": "専用キャラ表記なしだが売却不可(槍のゼーンズフトと同系統)。通常ランダム抽選に含めるかは要検討(いったん除外側に寄せておく)",
     "note": "v1.3.4:キャラ生成で選べるように解禁(ガトー指示)"
    },
    {
     "name": "裂空雷",
     "weaponLv": null,
     "price": null,
     "might": 10,
     "hit": 70,
     "weight": 11,
     "uses": 15,
     "crit": 10,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "白竜・赤竜・黒竜に特効/必殺率+15(雷撃の閃き)",
     "desc": "竜鱗族に特効/必殺+15",
     "exclusive": false,
     "custom": true,
     "note": "オリジナル武器(バランス調整用)、上位枠。威力-4調整済み"
    }
   ]
  },
  "wind": {
   "comment": "出典: pegasusknight.com『アイテム/風』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。風は全種、飛行系ユニット(カラス・クリミア王女・サギ・タカ・デイン国王・ドラゴンナイト・ドラゴンマスター・ファルコンナイト・ペガサスナイト)に共通で特効がある。ブリザードは射程3~10の攻城兵器のため除外(exclusive:true)。custom:trueの1種は魔道士の選択肢を広げるためAIが考案したオリジナル武器(蒼炎の軌跡には存在しない、ガトー確認済み・ネーミング一任)。 v1.3.4:レクスカリバーを追加(ガトー提供)。",
   "category": "wind",
   "flierEffectivenessNote": "このカテゴリの武器は全て、カラス・クリミア王女・サギ・タカ・デイン国王・ドラゴンナイト・ドラゴンマスター・ファルコンナイト・ペガサスナイトに特効を持つ",
   "weapons": [
    {
     "name": "ウインド",
     "weaponLv": "E",
     "price": 520,
     "might": 2,
     "hit": 100,
     "weight": 1,
     "uses": 40,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "エルウインド",
     "weaponLv": "D",
     "price": 1650,
     "might": 4,
     "hit": 90,
     "weight": 2,
     "uses": 30,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "トルネード",
     "weaponLv": "A",
     "price": 1800,
     "might": 6,
     "hit": 90,
     "weight": 5,
     "uses": 20,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "ブリザード",
     "weaponLv": "C",
     "price": 700,
     "might": 8,
     "hit": 75,
     "weight": 10,
     "uses": 5,
     "crit": 0,
     "range": [
      3,
      10
     ],
     "weaponExp": 3,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": null,
     "notes": "攻城兵器(範囲3~10)。1対1闘技場のランダム抽選からは除外(弓の攻城兵器と同方針)"
    },
    {
     "name": "嵐風の書",
     "weaponLv": null,
     "price": null,
     "might": 7,
     "hit": 85,
     "weight": 7,
     "uses": 15,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "カラス・クリミア王女・サギ・タカ・デイン国王・ドラゴンナイト・ドラゴンマスター・ファルコンナイト・ペガサスナイトに特効/回避+15(風のように身をかわす)",
     "desc": "飛行系に特効/回避+15",
     "exclusive": false,
     "custom": true,
     "note": "オリジナル武器(バランス調整用)、上位枠。威力-4調整済み"
    },
    {
     "name": "レクスカリバー",
     "weaponLv": "S",
     "price": null,
     "might": 12,
     "hit": 85,
     "weight": 9,
     "uses": 20,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "鳥翼族に特効/幸運+3",
     "exclusive": false,
     "note": "v1.3.4追加(ガトー提供)。内部名FIMBULVETR。風の共通特効(飛行系)に加えて、Tanas Manorの一覧に従い鳥翼族にも特効"
    }
   ]
  },
  "light": {
   "comment": "出典: pegasusknight.com『アイテム/光』(ガトー提供のスクリーンショットより2026-11-01時点で転記)。光属性に共通の特効は記載なし。パージは射程3~10の攻城兵器のため除外(exclusive:true)。 v1.3.4:レクスオーラをキャラ生成の抽選に解禁(ガトー指示)。",
   "category": "light",
   "weapons": [
    {
     "name": "ライト",
     "weaponLv": "D",
     "price": 800,
     "might": 2,
     "hit": 80,
     "weight": 4,
     "uses": 40,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 1,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "シャイン",
     "weaponLv": "C",
     "price": 2100,
     "might": 4,
     "hit": 75,
     "weight": 6,
     "uses": 30,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": null,
     "exclusive": false
    },
    {
     "name": "リザイア",
     "weaponLv": "A",
     "price": 3000,
     "might": 7,
     "hit": 70,
     "weight": 12,
     "uses": 20,
     "crit": 0,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "敵に与えたダメージ分、自分のHPを回復",
     "desc": "与えたダメージ分HP回復",
     "exclusive": false
    },
    {
     "name": "パージ",
     "weaponLv": "B",
     "price": 1000,
     "might": 10,
     "hit": 70,
     "weight": 8,
     "uses": 5,
     "crit": 0,
     "range": [
      3,
      10
     ],
     "weaponExp": 3,
     "effect": null,
     "exclusive": true,
     "exclusiveOwner": null,
     "notes": "攻城兵器(範囲3~10)。1対1闘技場のランダム抽選からは除外(弓の攻城兵器と同方針)"
    },
    {
     "name": "レクスオーラ",
     "weaponLv": "S",
     "price": null,
     "might": 12,
     "hit": 85,
     "weight": 10,
     "uses": 20,
     "crit": 5,
     "range": [
      1,
      2
     ],
     "weaponExp": 2,
     "effect": "売却不可/守備+3",
     "desc": "守備+3",
     "exclusive": false,
     "exclusiveOwner": null,
     "notes": "専用キャラ表記なしだが売却不可(槍のゼーンズフト・雷のレクスボルトと同系統)。いったん除外側に寄せておく",
     "note": "v1.3.4:キャラ生成で選べるように解禁(ガトー指示)"
    }
   ]
  }
 }
};
