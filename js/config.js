// ゲームの調整用の値をまとめたファイル。数値を変えたいときはここを編集する。
(function (global) {
  "use strict";

  const Config = {
    // ---- キャラ作成 ----
    nameMaxLength: 8,

    // 好きな色(リスト)。bias = この色で出やすくなる職業グループ
    // (cat・tiger・hawk・raven・dragon はラグズ用)
    colors: [
      { name: "赤", hex: "#d94545", bias: ["sword", "dragon"] },
      { name: "青", hex: "#3f6fd8", bias: ["lance"] },
      { name: "緑", hex: "#3fa65a", bias: ["axe", "tiger"] },
      { name: "黄", hex: "#e0b830", bias: ["light", "knife", "cat"] },
      { name: "白", hex: "#e8e8ee", bias: ["bow", "flying", "hawk"] },
      { name: "黒", hex: "#3a3a44", bias: ["knife", "armor", "raven"] },
      { name: "紫", hex: "#8a4fc8", bias: ["magic"] },
      { name: "橙", hex: "#e57f2e", bias: ["cavalry"] },
    ],

    genders: ["男", "女"],
    races: [
      { name: "ベオク", note: "人間の種族。剣・槍・斧・弓・魔法など、さまざまな武器を使いこなす。武器は2〜4本持てる。" },
      { name: "ラグズ", note: "獣や鳥、竜に姿を変える種族。最初は化身前で、化身ゲージ(初期値は幸運。タカは+8、カラスは+10)が20たまると、その場で化身してとても強くなる。ゲージはラウンドごとに+4、ダメージを受けるたびに+3。化身中はラウンドごとに-5され(化身したラウンドは減らない)、0で化身が解ける。化身前も戦えるが爪・くちばし・ブレスの威力は0。武器はその1つだけ。" },
    ],
    colorBiasWeight: 4, // 色と合う職業グループは 4 倍出やすい(完全固定にはしない)

    // 誕生月 → 属性(天・地・光・闇は各1か月で珍しい)
    monthElement: {
      1: "天", 2: "水", 3: "風", 4: "炎", 5: "雷", 6: "光",
      7: "闇", 8: "地", 9: "炎", 10: "水", 11: "風", 12: "雷",
    },
    // 属性ごとに少し伸びやすくなる能力(成長率 +5)
    elementGrowthBonus: {
      炎: "str", 水: "hp", 風: "spd", 雷: "skl", 光: "res", 闇: "mag", 天: "lck", 地: "def",
    },

    // 好きな漢字 → 成長の傾向(文字コードで振り分け)。up は +15、down は -5
    kanjiTypes: [
      { name: "力型", up: ["str"], down: "mag" },
      { name: "魔力型", up: ["mag"], down: "str" },
      { name: "技型", up: ["skl"], down: "lck" },
      { name: "速さ型", up: ["spd"], down: "def" },
      { name: "守備型", up: ["def"], down: "spd" },
      { name: "幸運型", up: ["lck"], down: "skl" },
      { name: "体力型", up: ["hp"], down: "res" },
      { name: "魔防型", up: ["res"], down: "hp" },
    ],
    kanjiGrowthUp: 15,
    kanjiGrowthDown: 5,

    personalBaseMax: 2,     // 職業の基本値に足す個人差(0〜2、HPは0〜3)
    personalGrowthRange: [-10, 10], // 成長率の個人差
    levelUps: 19,           // Lv1 → Lv20
    laguzLevelUps: 9,       // ラグズは Lv10 相当(Lv1 → Lv10)

    // 持ち武器の本数
    weaponCountDefault: 4,
    // 武器の少ない職業(v1.3.0:魔道士は2→3本。v1.3.4:魔道士3→4本・シーフ2→3本、クレリックは光魔法が増えて4本)
    weaponCountByClassPrefix: { 魔道士: 4, シーフ: 3 },
    // 職業ごとの必殺の補正(v1.3.4:剣士・ソードマスター +5)。名前の(男)(女)などは除いて照合
    classCritBonus: { 剣士: 5, ソードマスター: 5 },

    // 武器のレア度(数字が大きいほど出やすい)。武器LVを「強さの目安」として流用
    rarityByLv: { E: 10, D: 8, C: 5, B: 3, A: 2, S: 1 },
    rarityCustom: 3,

    // ---- バトル ----
    // 3すくみ(攻撃側 → 有利な相手)。有利なら 命中+10・威力+1、不利なら逆
    triangleAdvantage: {
      sword: "axe", axe: "lance", lance: "sword",
      flame: "wind", wind: "thunder", thunder: "flame",
    },
    triangleHit: 10,
    triangleMight: 1,

    magicCategories: ["flame", "thunder", "wind", "light"],

    // 武器カテゴリ全体にかかる特効(弓・風は飛行特効)
    categoryEffectiveTargets: {
      bow: ["カラス", "クリミア王女", "サギ", "タカ", "デイン国王", "ドラゴンナイト", "ドラゴンマスター", "ファルコンナイト", "ペガサスナイト"],
      wind: ["カラス", "クリミア王女", "サギ", "タカ", "デイン国王", "ドラゴンナイト", "ドラゴンマスター", "ファルコンナイト", "ペガサスナイト"],
    },

    // バイオリズム(v1.2.0):命中・回避 ±10、好調は必殺+5
    biorhythm: [
      { name: "不調", hit: -10, avoid: -10, crit: 0 },
      { name: "普通", hit: 0, avoid: 0, crit: 0 },
      { name: "好調", hit: 10, avoid: 10, crit: 5 },
    ],

    // 発動時に1秒の演出を出す「奥義」スキル
    // v1.3.4:衝撃・地の祝福・空の祝福・咆哮を追加
    ougiSkills: ["流星", "太陽", "月光", "天空", "瞬殺", "陽光", "鳴動", "衝撃", "地の祝福", "空の祝福", "咆哮"],
    // v1.3.3:奥義以外の「通常スキル」もカットインを出す。色分け:防御=青、回復・祈り=淡い緑、それ以外(バフ系)=橙
    skillKinds: {
      guard: ["翼の守護", "キャンセル", "見切り", "護り手", "能力勝負"],
      heal: ["回復", "祈り"],
    },

    // 化身ゲージ(v1.3.0)
    // v1.3.3:被ダメージ +2→+3。20になった時点でその場で化身(スキルの連続攻撃中は終わるまで待つ)。化身したラウンドは-5しない
    laguzGauge: { max: 20, roundGain: 4, damageGain: 3, decay: 5 },

    // ---- v1.3.4 のスキル ----
    // 一発屋:回避を引いた後の命中率 × hitRate、必殺値 + critBonus
    oneShot: { hitRate: 0.5, critBonus: 40 },
    // 睡眠(狙撃):当たったとき 技÷chanceDiv の確率。眠ったラウンドは数えず、次のラウンドから turns ラウンド数えて終了時に目覚める
    sleep: { chanceDiv: 2, turns: 2 },
    // 咆哮:ラウンド開始時に技の確率。相手の力・魔力・速さを amount 下げる(maxStacks 回まで重ねがけ)
    roar: { amount: 3, maxStacks: 2, stats: ["str", "mag", "spd"] },
    // 武器破壊:当たったとき 技÷chanceDiv の確率
    weaponBreak: { chanceDiv: 2 },
    // 空の祝福:ラウンド開始時に最大HPの◯%回復
    skyBlessingPercent: 20,
    // 女神の加護が効かない相手(武器名・職業名)。王族のラグズ・赤竜
    goddessExempt: { weapons: ["エタルド", "ラグネル"], classes: ["獅子", "タカ(ティバーン)", "カラス(ネサラ)", "赤竜(男)", "赤竜(女)"] },
    // HPが半分以下で発動するスキル(発動したときに演出を出す)
    rageSkills: ["怒り", "勇将"],

    stalemateRounds: 10, // HPが動かないラウンドがこれだけ続いたら引き分け

    // 状態異常:2ターン、毎ターン最大HPの◯%(v1.3.0:やけど→燃焼 20%)
    statusEffect: { turns: 2, percent: { ポイズン: 8, 燃焼: 20 } },

    doubleAttackThreshold: 4, // 攻速差がこれ以上で追撃
    useTwoRandomHit: true,    // 命中判定を2回の乱数の平均で行う(蒼炎方式)。false なら1回
    maxRounds: 60,            // これを超えたら引き分け

    // 演出
    strikeDelayMs: 900,
    rouletteMs: 3000,
    firstRouletteMs: 1000, // 先攻・後攻のルーレット
    bigEffectMs: 1000,     // 必殺・奥義の演出
    skillEffectMs: 850,    // 通常スキルの演出(v1.3.3)
  };

  global.Config = Config;
})(window);
