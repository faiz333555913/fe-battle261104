// v1.6.0:アーケードモードの進め方(画面とは別の、計算だけの部分)。
// キャラを1体選び、11連戦を勝ち抜く。
//   ・味方は Lv1 から。倒すごとにレベルが2つ上がる。Lv21 になるところでクラスチェンジ(上級職 Lv1)。
//   ・敵はランダムに生まれたキャラ(キャラ一覧には入らない)。Lv2 から2つずつ上がる。
//     8体目からは上級職(Lv2 から)。5体目からスキルを持つ。11体目(EXTRA)は必ずイナ(赤竜)。
//   ・ラグズは「Lv10 = ベオクの Lv20」の強さ(キャラ作成と同じ)なので、ラグズのレベル = ベオクのレベル − 10 で数える。
//     ラグズの敵は6体目から(Lv2・Lv4)。ラグズの味方は Lv1 のまま進み、ベオクで Lv12 になるところ(6勝目)から2つずつ上がる。
//   ・スキル:毎回ルーレット / 最初に2つから選んで持ち越し(勝つと、ランダムの2つか倒した敵のスキルと交換できる。
//     10体目を倒したときだけ、交換ではなく2つ目のスキルとして追加)。
//   ・負けてもコンティニューできる。イナ戦は3回まで。10体目を倒すと★、イナを倒すと★★。
// v1.6.1:スキルは「最初に選んで持ち越し」だけ(毎回ルーレットは古い保存データのためだけに残す)。
//   9体目を倒すと2つ目のスキルを追加。10体目からは、1つ目・2つ目のどちらかと交換。
//   アイクモード(全20面):アイク(レンジャー Lv1・てつの剣)で戦う。10体目まではふつうと同じ(Lv20どまり・クラスチェンジなし)。
//   11体目は漆黒の騎士(ラウンド1だけ戦い、耐えればクリア)→ ロードにクラスチェンジ。12〜19体目はLv+3ずつ。
//   18体目はイナ(倒すとラグネルを手に入れる)、19体目はなりそこないの赤竜(ずっと化身)、20体目は漆黒の騎士(ラスボス)。
// v1.6.2:アイクモードの変更(ガトーの改善点リスト v1.6.2)
//   1体目のバンデットは手斧・2体目はてつの斧。ランダムの敵にレンジャー・ロード・ワルキューレは出ない。訓練用の武器は装備しない。
//   12体目からは、敵の武器は★★以上・ラグズも出る。19体目は「なりそこない」。
//   20体目の漆黒の騎士は10ラウンドまでに倒せないとゲームオーバー(負け1回)。
//   コンティニュー3回以内で20体目を倒すと、21体目のアシュナード(変身前 → 倒すとその場で変身後に)と戦える。倒すと ALL CLEAR。
// v1.6.3:アイクモードの変更(ガトーの改善点リスト v1.6.3)
//   18体目はイナではなく、ふつうのランダムの敵(スキル2つ。倒すとラグネルを手に入れるのは同じ)。
//   19体目を倒したときのスキルの交換は、片方が必ず天空。アシュナード戦の前に3つ目のスキルを7つから選べる。
//   アシュナード戦のコンティニューは5回まで(6回目に負けると終わり)。
// v1.6.4:アイクモードの変更(ガトーの改善点リスト v1.6.4)
//   11体目を倒したときのスキルの候補はランダムの2つだけ。15体目からアーマー系(重装)の敵も出る(14体目までは出ない)。
//   19体目を倒すと、ドーピングアイテム3つから1つを選ぶ。20体目を倒したときのスキルの交換は、片方が必ず月光。
//   アシュナード戦の前の3つ目のスキルの候補を変更(大盾・疾風の刃・咆哮・勇将・キャンセル・大器晩成・流星)。
// v1.6.5:アイクモードの変更(ガトーの改善点リスト v1.6.5)
//   3〜6体目の敵の守備は10まで。ランダムの敵のスキルに天空・勇将・瞬殺・援軍は出ない。3つ目のスキルの候補の流星 → 空の祝福。
// 状態(state)はそのまま JSON にしてブラウザに保存できる形にしてある。
(function (global) {
  "use strict";
  const DB = global.GameDB;

  const STAGES = 11;          // 全部で11戦
  const EXTRA = 11;           // 11体目 = EXTRA(イナ)
  const STAR_STAGE = 10;      // 10体目を倒すと★
  const PROMOTED_FROM = 8;    // 8体目から上級職
  const SKILL_FROM = 5;       // 5体目から敵がスキルを使う
  const INA_TRIES = 3;        // イナ戦は3回まで
  const CLASS_CHANGE_LV = 21; // Lv21 でクラスチェンジ
  // 上級職の敵 LvN は、下級職で Lv(10+N) まで育ってからクラスチェンジした強さ
  // (Lv20 からのクラスチェンジだと、8体目の勝率が1割ほどになり、ほぼ勝てなかったため)
  const PROMO_BASE = 10;

  const ADD_SKILL_STAGE = 9;  // v1.6.1:9体目を倒すと2つ目のスキル(v1.6.0 は10体目)
  const MAX_LV = 20;

  // ---- v1.6.1:アイクモード ----
  const IKE = {
    STAGES: 20,
    KNIGHT1: 11,   // 漆黒の騎士(ラウンド1だけ。耐えればクリア)
    INA: 18,       // 18体目(倒すとラグネル)。v1.6.3:イナではなく、ふつうのランダムの敵(スキル2つ)
    SKY_STAGE: 19, // v1.6.3:19体目を倒したときのスキルの交換は、片方が必ず天空
    LUNA_STAGE: 20, // v1.6.4:20体目を倒したときのスキルの交換は、片方が必ず月光
    DOPE_STAGE: 19, // v1.6.4:19体目を倒すと、ドーピングアイテム3つから1つを選ぶ
    ARMOR_FROM: 15, // v1.6.4:アーマー系(重装)の敵は15体目から
    ASH_CONTINUES: 5, // v1.6.3:アシュナード戦のコンティニューは5回まで
    FERAL: 19,     // なりそこないの赤竜(ずっと化身)
    BOSS: 20,      // 漆黒の騎士(ラスボス)
    BOSS_ROUNDS: 10, // v1.6.2:20体目の漆黒の騎士は10ラウンドまでに倒す(倒せなければ負け)
    ASHNARD: 21,   // v1.6.2:コンティニュー3回以内で20体目を倒すと、21体目のアシュナード
    BONUS_CONTINUES: 3,
    STRONG_FROM: 12, // v1.6.2:12体目からは、敵の武器は★★以上・ラグズも出る
    LAGUZ_PLUS: 3,   // v1.6.2:12体目からのラグズの敵のレベル = 上級職の敵のレベル + 3
    LV_STEP: 3,    // 12〜19体目はレベルが3つずつ上がる(自分も敵も)
  };
  // アイク:蒼炎の初期値(レンジャー Lv1)と、蒼炎のユニット別の成長率(ガトー提供の表)
  // v1.6.1(ガトー指定):Lv1 HP19 力5 魔力1 技6 速さ7 幸運6 守備5 魔防0 体格9 属性 地
  const IKE_LV1 = { hp: 19, str: 5, mag: 1, skl: 6, spd: 7, lck: 6, def: 5, res: 0 };
  const IKE_CON = 9;
  const IKE_GROWTH = { hp: 75, str: 50, mag: 20, skl: 50, spd: 55, lck: 35, def: 40, res: 40 };
  const IKE_WEAPON = "sword:てつの剣";
  const RAGNELL = "sword:ラグネル";
  const REGAL = "sword:リガルソード"; // 2体目を倒すと手に入る(アイク専用)
  const REGAL_STAGE = 2;
  const LAGUZ_SWORD = "sword:ラグズソード"; // 5体目を倒すと必ず手に入る
  const LAGUZ_SWORD_STAGE = 5;
  // v1.6.1(ガトー指定):1・2体目はバンデット(てつの斧・Lv1/Lv3)。1体目のあと天使の羽衣(HP+7)、4体目のあとてつの剣が錬成武器に
  const BANDIT_STAGES = { 1: 1, 2: 3 };
  const BANDIT_WEAPON = "axe:てつの斧";
  const BANDIT_WEAPONS = { 1: "axe:手斧", 2: "axe:てつの斧" }; // v1.6.2(ガトー指定):1体目は手斧・2体目はてつの斧(v1.6.1 は逆)
  // v1.6.1(ガトー指定):7体目のあとはがねの剣(錬成)、13体目のあとぎんの剣(錬成)。錬成の数値はランダム
  const FORGED_GIFTS = { 7: "sword:はがねの剣", 13: "sword:ぎんの剣" };
  // 8体目のあと:エナジーの雫(力+2)・女神の像(幸運+2)・竜の盾(守備+2)のどれか1つ(ランダム)
  const STAT_ITEM_STAGE = 8;
  const STAT_ITEMS = [{ item: "エナジーの雫", stat: "str", n: 2 }, { item: "女神の像", stat: "lck", n: 2 }, { item: "竜の盾", stat: "def", n: 2 }];
  // 9体目のあと:祈りの剣(アイクモードの祈りは「HPが0になる攻撃を受けるとき、幸運%でHPが1残る」)
  const PRAYER_STAGE = 9, PRAYER_SWORD = "sword:祈りの剣";
  // ラグネル以外の武器は4つまで。5つ目を手に入れるときは1つ手放す
  const WEAPON_LIMIT = 4;
  // 7〜9体目の上級職の敵は守備(素の値)が15まで
  const IKE_DEF_CAP = { from: 7, to: 9, def: 15 };
  // v1.6.5:3〜6体目の敵は守備(素の値)が10まで(敵が固く、アイクの攻撃が通らなかったため。ガトー指示)
  const IKE_DEF_CAP_EARLY = { from: 3, to: 6, def: 10 };
  // v1.6.5:アイクモードのランダムの敵には出ないスキル(ガトー指示)
  const IKE_NO_ENEMY_SKILLS = ["天空", "勇将", "瞬殺", "援軍"];
  // v1.6.7:アーケードのランダムの敵に出さないスキル(ふつう・アイクモードとも)
  const NO_ENEMY_SKILLS = ["女神の加護"];
  // 18体目のイナ:半化身の指輪(化身ゲージ20でスタート)・能力値を下げる
  const IKE_INA_DELTA = { str: -5, skl: -2, spd: -1, def: -2, res: -2 };
  const ROBE_STAGE = 1, ROBE_HP = 7;
  const FORGE_STAGE = 4;
  const ALONDITE = "sword:エタルド";
  // 漆黒の騎士(名前はジェネラル。能力値の上限は「ジェネラル(漆黒の騎士)」)
  const KNIGHT_STATS = { hp: 60, str: 30, mag: 17, skl: 30, spd: 27, lck: 11, def: 30, res: 22 };
  const KNIGHT_CON = 13;
  // 11体目の漆黒の騎士の手加減(2回攻撃しない・必殺が出ない)。ガトーの判断で「指定どおり(手加減なし)」(耐えられる確率は約2%)
  const KNIGHT1_HOLD_BACK = false;
  // なりそこないの赤竜(化身後の値。ずっと化身している)
  const FERAL_STATS = { hp: 75, str: 36, mag: 5, skl: 26, spd: 22, lck: 8, def: 33, res: 25 };
  const FERAL_CON = 20;
  // v1.6.2:アシュナード(21体目。ディン国王・Lv20・属性 炎・グルグラント。スキル 恐怖・回復・女神の加護)
  // 変身前を倒すと、その場で変身後になって戦いが続く(次のラウンドへ)
  const ASHNARD_STATS = { hp: 60, str: 35, mag: 16, skl: 27, spd: 27, lck: 0, def: 35, res: 26 };
  const ASHNARD2_STATS = { hp: 80, str: 40, mag: 25, skl: 30, spd: 28, lck: 10, def: 35, res: 30 };
  const ASHNARD_CON = 14;
  const GURGURANT = "sword:グルグラント";
  // v1.6.2:アイクモードのランダムの敵に出さない職業(上級職の名前も見る)と、装備しない武器
  const IKE_NO_CLASSES = ["レンジャー", "ロード", "ワルキューレ"];
  // v1.7.2:ふつうのアーケード(3on3も)のランダムの敵に出さない職業(ガトー指定。下級職の名前も上級職の名前も見る)
  const NORMAL_NO_CLASSES = ["レンジャー", "クレリック", "ワルキューレ"];
  // v1.6.3:アシュナード戦の前に選べる3つ目のスキル(ガトー指定)
  // v1.6.4(ガトー指定):大盾・疾風の刃・咆哮・勇将・キャンセル・大器晩成・流星
  // v1.6.5(ガトー指定):流星 → 空の祝福
  const THIRD_SKILLS = ["大盾", "疾風の刃", "咆哮", "勇将", "キャンセル", "大器晩成", "空の祝福"];
  // v1.6.4:19体目のあとに選べるドーピングアイテム(この中からランダムに3つ)
  const DOPE_ITEMS = [
    { item: "天使の衣", stat: "hp", n: 7 }, { item: "エナジーの雫", stat: "str", n: 2 }, { item: "秘伝の書", stat: "skl", n: 2 },
    { item: "疾風の羽", stat: "spd", n: 2 }, { item: "女神の像", stat: "lck", n: 2 }, { item: "竜の盾", stat: "def", n: 2 }, { item: "魔除け", stat: "res", n: 2 },
  ];
  const isTraining = (id) => !!DB.weapons[id] && DB.weapons[id].name.includes("訓練用");
  const isIke = (state) => !!state && state.mode === "ike";
  // v1.6.2:アイクモードは、21体目に進めるようになったら全21面
  const stagesOf = (state) => (isIke(state) ? (state.bonus ? IKE.ASHNARD : IKE.STAGES) : STAGES);
  // 最後の敵(ふつうはEXTRAのイナ、アイクモードは漆黒の騎士)
  const isFinal = (state, stage) => stage === stagesOf(state);

  const LAGUZ_FROM = 6;       // ラグズの敵は6体目から
  const LAGUZ_LV_GAP = 10;    // ラグズのレベル = ベオクのレベル − 10
  const isLaguz = (c) => !!c && c.race === "ラグズ";
  // cleared 体倒したときの味方のレベル(ベオク:1,3,5…。ラグズ:ベオクのレベル − 10、最低1)
  const playerLevelAfter = (laguz, cleared) => (laguz ? Math.max(1, 2 * cleared + 1 - LAGUZ_LV_GAP) : 2 * cleared + 1);

  // 敵のレベル:ベオクは 2,4,6…14。8体目からは上級職で 2,4,6。ラグズ(6・7体目)はベオクのレベル − 10 で 2,4
  function enemyLevel(stage, laguz, mode) {
    // v1.6.1:アイクモードの12〜17体目は、10体目(上級職Lv6)から3つずつ(Lv20まで)
    if (mode === "ike" && stage > IKE.KNIGHT1) return Math.min(MAX_LV, (STAR_STAGE - PROMOTED_FROM + 1) * 2 + IKE.LV_STEP * (stage - IKE.KNIGHT1));
    if (stage === EXTRA) return 10;
    if (stage >= PROMOTED_FROM) return (stage - PROMOTED_FROM + 1) * 2;
    return laguz ? Math.max(1, stage * 2 - LAGUZ_LV_GAP) : stage * 2;
  }

  // ---- 能力値の計算 ----
  // 1回分のレベルアップ(成長率で上がる。上限で頭打ち)。stats を書きかえ、上がった分を返す
  function rollLevel(stats, growth, max, rng) {
    const gains = {};
    for (const k of DB.STAT_KEYS) {
      const g = (growth && growth[k]) || 0;
      const gain = Math.floor(g / 100) + (rng.percent(g % 100) ? 1 : 0);
      const cap = max ? max[k] : 99;
      const v = Math.max(stats[k], Math.min(stats[k] + gain, cap));
      gains[k] = v - stats[k];
      stats[k] = v;
    }
    return gains;
  }
  // クラスチェンジ:能力値 + (上級職の基本値 − 今の職業の基本値)。上限は上級職の上限(エリートと同じ計算)
  function promoteStats(stats, p) {
    const before = { ...stats };
    for (const k of DB.STAT_KEYS) stats[k] = Math.max(stats[k], Math.min(stats[k] + (p.base[k] - p.from[k]), p.max[k]));
    return Object.fromEntries(DB.STAT_KEYS.map((k) => [k, stats[k] - before[k]]));
  }
  // ラグズの化身後の能力値(化身前 + 化身の上がり幅。上限は化身後の上限)
  function transformed(human, className) {
    const cls = DB.classByName[className];
    const out = { ...human };
    if (!cls || !cls.transform) return out;
    for (const k of DB.STAT_KEYS) out[k] = Math.min(human[k] + cls.transform[k], cls.transformedMax[k]);
    return out;
  }
  // 能力値の上限(上級職なら上級職の上限。ラグズは化身前の上限)
  function capOf(state) {
    if (state.promoted) { const p = DB.promotionOf(state.baseClass); if (p) return p.max; }
    const cls = DB.classByName[state.baseClass];
    return cls ? cls.max : null;
  }
  // Lv1 の能力値(ラグズは化身前)。v1.4.0 より前のキャラは入力から作り直して求める
  function lv1Stats(char) {
    if (char.statsLv1) return { ...char.statsLv1 };
    if (char.inputs && global.Generator) {
      const n = global.Generator.normalizeInputs(char.inputs);
      if (n.ok) { const g = global.Generator.generateCharacter(n.value); if (g.statsLv1) return { ...g.statsLv1 }; }
    }
    const cls = DB.classByName[char.className];
    return cls ? { ...cls.base } : { ...char.stats };
  }

  // ---- スキル ----
  // 味方が持てるスキル(抽選と同じ範囲。陽光は魔法の武器を持っているときだけ、エリートは上級職のあるベオクだけ)
  // v1.6.3:判定は DB.skillFits と同じ(翼の守護はタカ・カラスだけ、v1.8.5:大盾はベオクだけ)
  function skillPoolFor(char, className) {
    const magic = (char.weapons || []).some((id) => DB.weapons[id] && DB.weapons[id].isMagic);
    return DB.skills.filter((s) => DB.skillFits(s, { race: char.race, className: className || char.className, magic }));
  }
  const usable = (char, className, name) => skillPoolFor(char, className).some((s) => s.name === name);
  // 重みつきで n 個(同じものは選ばない。exclude のスキルも選ばない)
  function drawSkills(pool, n, exclude, rng) {
    const no = global.Config.noRouletteSkills || []; // v1.7.1:女神の加護は出ない
    let rest = pool.filter((s) => !exclude.includes(s.name) && !no.includes(s.name));
    const out = [];
    while (out.length < n && rest.length) {
      const total = rest.reduce((a, s) => a + (s.weight ?? 1), 0);
      let r = rng.next() * total, pick = rest[rest.length - 1];
      for (const s of rest) { r -= s.weight ?? 1; if (r < 0) { pick = s; break; } }
      out.push(pick.name);
      rest = rest.filter((s) => s !== pick);
    }
    return out;
  }

  // ---- 敵 ----
  // EXTRA:イナ(赤竜)。能力値は化身後の値(このゲームのラグズの能力値の見せ方と同じ)。化身ゲージの初期値は0(幸運は使わない)
  const INA_STATS = { hp: 52, str: 25, mag: 9, skl: 20, spd: 18, lck: 14, def: 25, res: 25 };
  function ina() {
    const className = "赤竜(女)";
    const cls = DB.classByName[className];
    const stats = { ...INA_STATS, con: 18 };
    const human = { con: 18 };
    for (const k of DB.STAT_KEYS) human[k] = Math.max(0, stats[k] - (cls && cls.transform ? cls.transform[k] : 0));
    return {
      id: "arcade-enemy-11", enemy: true, boss: true, name: "イナ", gender: "女", race: "ラグズ",
      level: 10, arcadeLv: 10, colorHex: "#d94545", className, moveType: cls ? cls.moveType : "歩行", element: "地", kanjiType: "",
      growth: null, weapons: [cls ? cls.fixedWeapon : "laguz:ブレス(赤竜)"], marks: {}, stats, statsHuman: human,
      gaugeStart: 0, weapon: cls ? cls.fixedWeapon : "laguz:ブレス(赤竜)", skill: "回復", extraSkills: ["祈り", "地の祝福"],
    };
  }

  // v1.6.1:漆黒の騎士(Lv20・属性 闇・エタルド)。スキル 回復・月光・エンブラの加護(女神の加護と同じ効果)
  // 11体目はラウンド1だけ戦う(roundOne)。20体目はラスボス
  function blackKnight(stage) {
    const max = DB.classMaxOf ? DB.classMaxOf("ジェネラル(漆黒の騎士)") : null;
    return {
      id: `arcade-enemy-${stage}`, enemy: true, boss: true, blackKnight: true, roundOne: stage === IKE.KNIGHT1,
      roundLimit: stage === IKE.BOSS ? IKE.BOSS_ROUNDS : null, // v1.6.2:20体目は10ラウンドまで
      holdBack: stage === IKE.KNIGHT1 && KNIGHT1_HOLD_BACK,
      name: "漆黒の騎士", gender: "男", race: "ベオク", level: MAX_LV, arcadeLv: MAX_LV, colorHex: "#3b3b4a",
      className: "ジェネラル", baseClass: "ジェネラル", moveType: "重装", element: "闇", kanjiType: "",
      growth: null, weapons: [ALONDITE], marks: {}, stats: { ...KNIGHT_STATS, con: KNIGHT_CON }, maxStats: max,
      weapon: ALONDITE, skill: "回復", extraSkills: ["月光", "エンブラの加護"],
    };
  }
  // v1.6.1:なりそこないの赤竜(19体目。v1.6.2 で名前を「なりそこない」に)。化身ゲージは20のまま(ずっと化身後)。スキルなし
  function feral(stage) {
    const className = "赤竜(男)";
    const cls = DB.classByName[className];
    const stats = { ...FERAL_STATS, con: FERAL_CON };
    return {
      id: `arcade-enemy-${stage}`, enemy: true, boss: true, feral: true, name: "なりそこない", gender: "男", race: "ラグズ",
      level: MAX_LV, arcadeLv: MAX_LV, colorHex: "#8a2a22", className, moveType: cls ? cls.moveType : "歩行", element: "炎", kanjiType: "",
      growth: null, weapons: [cls ? cls.fixedWeapon : "laguz:ブレス(赤竜)"], marks: {}, stats, statsHuman: { ...stats },
      gaugeStart: 20, alwaysTransformed: true, weapon: cls ? cls.fixedWeapon : "laguz:ブレス(赤竜)", skill: null, extraSkills: [],
    };
  }
  // v1.6.2:アシュナード。form 1 = 変身前(倒すと phase2 の変身後になる)、form 2 = 変身後
  function ashnard(stage, form = 1) {
    const stats = form === 2 ? ASHNARD2_STATS : ASHNARD_STATS;
    const maxStats = Object.fromEntries(DB.STAT_KEYS.map((k) => [k, Math.max(ASHNARD_STATS[k], ASHNARD2_STATS[k], 40)]));
    const e = {
      id: `arcade-enemy-${stage}`, enemy: true, boss: true, ashnard: form, name: "アシュナード", gender: "男", race: "ベオク",
      level: MAX_LV, arcadeLv: MAX_LV, colorHex: "#7a1f2b", className: "ディン国王", baseClass: "ディン国王", moveType: "飛行", element: "炎", kanjiType: "",
      growth: null, weapons: [GURGURANT], marks: {}, stats: { ...stats, con: ASHNARD_CON }, maxStats,
      weapon: GURGURANT, skill: "恐怖", extraSkills: ["回復", "女神の加護"],
    };
    if (form === 1) e.phase2 = ashnard(stage, 2);
    return e;
  }
  // v1.6.1:アイクモード18体目のイナ。半化身の指輪(化身ゲージ20でスタート)、能力値は 力-5 技-2 速さ-1 守備-2 魔防-2
  function ikeIna(stage) {
    const e = { ...ina(), id: `arcade-enemy-${stage}`, gaugeStart: 20, accessory: "半化身の指輪" };
    e.stats = { ...e.stats };
    e.statsHuman = { ...e.statsHuman };
    for (const [k, d] of Object.entries(IKE_INA_DELTA)) {
      e.stats[k] = Math.max(0, e.stats[k] + d);
      e.statsHuman[k] = Math.max(0, e.statsHuman[k] + d);
    }
    return e;
  }
  // アイクが使える武器か(レンジャー・ロードは剣)
  function ikeCanUse(state, id) {
    const w = DB.weapons[id];
    const cls = DB.classByName["レンジャー"];
    return !!w && !w.exclusive && (cls ? cls.weaponCategories : ["sword"]).includes(w.category);
  }
  // v1.6.1:アイク(アイクモードの自分のキャラ。キャラ一覧には入らない)
  function ikeChar(state) {
    const weapons = state && state.weapons ? state.weapons.slice() : [IKE_WEAPON];
    return {
      id: "arcade-ike", ike: true, name: "アイク", gender: "男", race: "ベオク", className: "レンジャー", level: 1,
      colorHex: "#3d6fd8", element: "地", kanjiType: "", moveType: "歩行", growth: { ...IKE_GROWTH },
      weapons, marks: state && state.marks ? { ...state.marks } : {}, stats: { ...IKE_LV1, con: IKE_CON }, statsLv1: { ...IKE_LV1, con: IKE_CON },
    };
  }
  // 保存されたキャラ(アイクモードならアイク)
  const savedChar = (state, find) => (isIke(state) ? ikeChar(state) : find(state.charId));

  // stage 体目の敵を作る。seed が同じなら同じ敵(コンティニューしても同じ相手)
  // v1.6.1:アイクモードの1・2体目(バンデット・てつの斧)。名前・属性・色はランダム、能力値はキャラ作成と同じ作り方(職業の基本値+個人差、成長率で上げる)
  function bandit(stage, seed) {
    const rng = global.Rng.createSeededRng(`${seed}|bandit${stage}`);
    const C = global.Config;
    let g = null;
    for (let i = 0; i < 20 && !g; i++) {
      const n = global.Generator.normalizeInputs(global.RandomChar.randomInputs(() => rng.next(), { race: "ベオク", gender: "男" }));
      if (n.ok) g = global.Generator.generateCharacter(n.value);
    }
    const cls = DB.classByName["バンデット"];
    const level = BANDIT_STAGES[stage];
    const weapon = BANDIT_WEAPONS[stage] || BANDIT_WEAPON;
    const growth = {}, stats = {};
    for (const k of DB.STAT_KEYS) {
      growth[k] = Math.max(5, cls.growth[k] + rng.int(C.personalGrowthRange[0], C.personalGrowthRange[1]));
      stats[k] = Math.min(cls.base[k] + rng.int(0, k === "hp" ? C.personalBaseMax + 1 : C.personalBaseMax), cls.max[k]);
    }
    for (let lv = 1; lv < level; lv++) rollLevel(stats, growth, cls.max, rng);
    return {
      id: `arcade-enemy-${stage}`, enemy: true, inputs: g.inputs, name: g.name, gender: "男", race: "ベオク",
      level, arcadeLv: level, colorHex: g.colorHex, className: "バンデット", baseClass: "バンデット", moveType: cls.moveType, element: g.element,
      kanjiType: g.kanjiType, growth, weapons: [weapon], marks: {}, stats: { ...stats, con: cls.con }, weapon, skill: null, extraSkills: [],
    };
  }

  function makeEnemy(stage, seed, mode) {
    if (mode === "ike") {
      if (BANDIT_STAGES[stage]) return bandit(stage, seed);
      if (stage === IKE.KNIGHT1 || stage === IKE.BOSS) return blackKnight(stage);
      if (stage === IKE.FERAL) return feral(stage);
      if (stage === IKE.ASHNARD) return ashnard(stage);
    } else if (stage === EXTRA) return ina();
    const rng = global.Rng.createSeededRng(`${seed}|enemy${stage}`);
    const rand = () => rng.next();
    const promoted = stage >= PROMOTED_FROM;
    const ike = mode === "ike";
    const strong = ike && stage >= IKE.STRONG_FROM; // v1.6.2:12体目から(★★以上の武器・ラグズも出る)
    // v1.6.2:アイクモードで使える武器(訓練用は装備しない。12体目からは★★以上)
    const usableWeapons = (c) => c.weapons.filter((id) => DB.weapons[id] && !(ike && isTraining(id))
      && !(strong && !isLaguz(c) && DB.weaponStars(DB.weapons[id]) < 2));
    // v1.6.2:アイクモードに出さない敵(レンジャー・ロード・ワルキューレ、使える武器がない)
    const ikeOk = (c) => {
      const to = promoted && DB.promotionOf(c.className) ? DB.promotionOf(c.className).name : c.className;
      // v1.6.4:アーマー系(重装)は15体目から
      if (c.moveType === "重装" && stage < IKE.ARMOR_FROM) return false;
      return !IKE_NO_CLASSES.includes(c.className) && !IKE_NO_CLASSES.includes(to) && usableWeapons(c).length > 0;
    };
    // v1.7.2:ふつうのアーケードは、レンジャー・クレリック・ワルキューレを出さない
    const normalOk = (c) => {
      const to = promoted && DB.promotionOf(c.className) ? DB.promotionOf(c.className).name : c.className;
      return !NORMAL_NO_CLASSES.includes(c.className) && !NORMAL_NO_CLASSES.includes(to);
    };
    let g = null;
    for (let i = 0; i < 200 && !g; i++) {
      // 5体目まで・8体目からはベオクだけ(ラグズは Lv1 でもベオクの Lv10 くらいの強さがあるため)
      // v1.6.2:アイクモードの12体目からはラグズも出る
      const beorcOnly = (promoted && !strong) || stage < LAGUZ_FROM;
      const n = global.Generator.normalizeInputs(global.RandomChar.randomInputs(rand, beorcOnly ? { race: "ベオク" } : {}));
      if (n.ok) g = global.Generator.generateCharacter(n.value);
      if (g && ike && !ikeOk(g)) g = null;
      if (g && !ike && !normalOk(g)) g = null;
    }
    const laguz = isLaguz(g);
    // v1.6.2:12体目からのラグズは、上級職の敵のレベル + 3(Lv20まで)。
    //   同じレベルだと勝率がほぼ100%、+10だと2割ほどだったので、上級職の敵と同じくらい(7〜9割)になるように決めた
    const level = strong && laguz ? Math.min(MAX_LV, enemyLevel(stage, false, mode) + IKE.LAGUZ_PLUS) : enemyLevel(stage, laguz, mode);
    const cls = DB.classByName[g.className];
    let className = g.className, max = cls.max, stats;
    if (promoted && !laguz && DB.promotionOf(g.className)) {
      // 上級職:下級職で Lv(PROMO_BASE + Lv) まで育ってからクラスチェンジした強さ(表示の Lv は上級職のレベル)
      // v1.6.1:下級職は Lv20 まで。それより上の分は、上級職になってから育てる(アイクモードの12体目から)
      const p = DB.promotionOf(g.className);
      stats = { ...g.statsLv1 };
      const baseLv = Math.min(MAX_LV, PROMO_BASE + level);
      for (let lv = 1; lv < baseLv; lv++) rollLevel(stats, g.growth, cls.max, rng);
      promoteStats(stats, p);
      for (let lv = baseLv; lv < PROMO_BASE + level; lv++) rollLevel(stats, g.growth, p.max, rng);
      className = p.name;
      max = p.max;
    } else {
      stats = { ...g.statsLv1 };
    }
    if (!promoted || laguz) for (let lv = 1; lv < level; lv++) rollLevel(stats, g.growth, max, rng);
    const con = g.stats.con;
    const e = {
      id: `arcade-enemy-${stage}`, enemy: true, inputs: g.inputs, name: g.name, gender: g.gender, race: g.race,
      level, arcadeLv: level, colorHex: g.colorHex, className, baseClass: g.className, moveType: g.moveType, element: g.element,
      kanjiType: g.kanjiType, growth: g.growth, weapons: g.weapons.slice(), marks: g.marks || {},
      stats: { ...stats, con },
    };
    // v1.6.1:アイクモード7〜9体目の上級職は守備が15まで(属性・補正・スキルで上がる分は別)
    if (mode === "ike" && className !== g.className && stage >= IKE_DEF_CAP.from && stage <= IKE_DEF_CAP.to) e.stats.def = Math.min(e.stats.def, IKE_DEF_CAP.def);
    if (laguz) { e.statsHuman = { ...stats, con }; e.stats = { ...transformed(stats, g.className), con }; }
    // v1.6.5:アイクモード3〜6体目は守備が10まで(ラグズは化身前・化身後とも)
    if (ike && stage >= IKE_DEF_CAP_EARLY.from && stage <= IKE_DEF_CAP_EARLY.to) {
      e.stats.def = Math.min(e.stats.def, IKE_DEF_CAP_EARLY.def);
      if (e.statsHuman) e.statsHuman.def = Math.min(e.statsHuman.def, IKE_DEF_CAP_EARLY.def);
    }
    // 武器:4体目までは一番★の少ない武器(はじめは手ごろな相手に)。5体目からはランダム
    const ws = usableWeapons(e);
    if (ike) e.weapons = e.weapons.filter((id) => !isTraining(id)); // v1.6.2:訓練用の武器は持たない
    if (stage < SKILL_FROM) {
      e.weapon = ws.slice().sort((a, b) => DB.weaponStars(DB.weapons[a]) - DB.weaponStars(DB.weapons[b]))[0];
    } else {
      e.weapon = rng.pick(ws);
    }
    // スキル:5体目から(抽選と同じ。武器スキルとかぶらない)
    const unit = global.Battle.makeUnit(e, e.weapon, "right");
    // v1.6.5:アイクモードでは天空・勇将・瞬殺・援軍は出ない
    // v1.6.7:ランダムの敵は(ふつう・アイクとも)女神の加護を持たない。持つのはアシュナードだけ
    const noSkills = (ike ? IKE_NO_ENEMY_SKILLS : []).concat(NO_ENEMY_SKILLS);
    e.skill = stage >= SKILL_FROM ? global.Battle.drawSkill(unit, rng, noSkills) : null;
    e.extraSkills = [];
    // v1.6.3:アイクモードの18体目はスキル2つ(ランダム・同じものは選ばない)
    if (ike && stage === IKE.INA && e.skill) {
      let s2 = null;
      for (let i = 0; i < 40 && (!s2 || s2 === e.skill); i++) s2 = global.Battle.drawSkill(unit, rng, noSkills);
      if (s2 && s2 !== e.skill) e.extraSkills = [s2];
    }
    return e;
  }

  // ---- 進行 ----
  // char:選んだキャラ(保存されたもの)。opts:{ skillMode:"random"|"carry", rng }
  function create(char, opts = {}) {
    const rng = opts.rng;
    const mode = opts.mode === "ike" ? "ike" : "normal";
    if (mode === "ike") char = ikeChar(null);
    const human = lv1Stats(char);
    delete human.con;
    const state = {
      v: 1,
      mode,                 // v1.6.1:"normal" / "ike"(アイクモード)
      charId: char.id,
      skillMode: opts.skillMode === "carry" ? "carry" : "random",
      seed: opts.seed || String(Math.floor(rng.next() * 1e9)),
      stage: 1,             // いま戦う敵(1〜11)
      cleared: 0,           // 倒した敵の数
      level: 1,
      baseClass: char.className,
      className: char.className,
      promoted: false,
      stats: human,         // 今の能力値(ラグズは化身前。体格は含まない)
      skills: [],           // 持ち越しのスキル([1つ目, 2つ目])
      weapon: null,         // 最後に選んだ武器
      weapons: mode === "ike" ? [IKE_WEAPON] : null, // v1.6.1:アイクモードの武器(18体目のあとラグネルが増える)
      seen: {},             // v1.6.1:見たイベント(v1.6.2 では使っていない)
      bonus: false,         // v1.6.2:21体目(アシュナード)に進める(コンティニュー3回以内で20体目を倒した)
      enemies: {},          // 作った敵(コンティニューしても同じ)
      continues: 0,
      inaTries: 0,
      stars: 0,
      done: false,
      result: null,         // "clear"(イナを倒した)/"over"(イナに3回負けた)/"giveup"
      pending: [],          // これから見せるレベルアップ・スキルの選択
    };
    if (state.skillMode === "carry") {
      state.pending.push({ type: "skill", mode: "start", options: drawSkills(skillPoolFor(char), 2, [], rng).map((name) => ({ name, from: "random" })) });
    }
    return state;
  }

  function ensureEnemy(state) {
    if (!state.enemies[state.stage]) state.enemies[state.stage] = isTeam(state) ? makeTeamEnemies(state.stage, state.seed) : makeEnemy(state.stage, state.seed, state.mode);
    return state.enemies[state.stage];
  }

  // バトルで使う味方のキャラ(保存されたキャラに、今のレベル・職業・能力値を入れたもの)
  function playerChar(state, saved) {
    const con = saved.stats.con;
    const c = { ...saved, className: state.className, level: state.level, arcadeLv: state.level, statsLv1: undefined };
    if (isIke(state)) { c.weapons = (state.weapons || [IKE_WEAPON]).slice(); c.marks = { ...(state.marks || {}) }; }
    if (isLaguz(saved)) {
      c.statsHuman = { ...state.stats, con };
      c.stats = { ...transformed(state.stats, saved.className), con };
    } else {
      c.stats = { ...state.stats, con };
    }
    return c;
  }

  // 勝った:レベルアップ(+クラスチェンジ)・★・スキルの追加/交換を pending に積み、次の敵へ
  function levelUps(state, saved, n, rng) {
    for (let i = 0; i < n; i++) {
      const before = { ...state.stats };
      const gains = rollLevel(state.stats, saved.growth, capOf(state), rng);
      state.level++;
      state.pending.push({ type: "levelup", className: state.className, from: state.level - 1, to: state.level, before, after: { ...state.stats }, gains });
    }
  }
  function classChange(state) {
    const p = DB.promotionOf(state.baseClass);
    if (!p) return;
    const before = { ...state.stats };
    const up = promoteStats(state.stats, p);
    state.pending.push({ type: "classchange", fromClass: state.className, toClass: p.name, from: state.level, to: 1, before, after: { ...state.stats }, gains: up });
    state.className = p.name;
    state.promoted = true;
    state.level = 1;
  }
  function win(state, saved, rng) {
    if (state.done) return state;
    const stage = state.stage;
    const enemy = state.enemies[stage];
    const ike = isIke(state);
    state.cleared = stage;
    if (!ike && stage >= STAR_STAGE) state.stars = Math.max(state.stars, stage === EXTRA ? 2 : 1);
    // v1.6.2:コンティニュー3回以内で20体目を倒すと、21体目(アシュナード)に進める
    if (ike && stage === IKE.BOSS && state.continues <= IKE.BONUS_CONTINUES) state.bonus = true;
    if (isFinal(state, stage)) {
      state.done = true; state.result = "clear";
      if (ike && stage === IKE.ASHNARD) state.allClear = true; // v1.6.2:アシュナードを倒した = ALL CLEAR
      return state;
    }
    if (ike) {
      // アイクモード:10体目まではLv+2(Lv20まで・クラスチェンジなし)。漆黒の騎士のあとロードへ。12〜19体目はLv+3(Lv20まで)
      if (stage === IKE.KNIGHT1) classChange(state);
      else levelUps(state, saved, Math.max(0, Math.min(stage < IKE.KNIGHT1 ? 2 : IKE.LV_STEP, MAX_LV - state.level)), rng);
      // v1.6.1:手に入れた武器は「次へ」を押したときに持ち物に入る(ラグネル以外が4つを超えるときは1つ手放す)
      const forge = () => {
        const M = global.Config.weaponMark;
        let m;
        do { m = { might: rng.pick(M.might), hit: rng.pick(M.hit), crit: rng.pick(M.crit), weight: rng.pick(M.weight) }; } while (!m.might && !m.hit && !m.crit && !m.weight);
        return m;
      };
      const got = (id, why, opts = {}) => {
        if (!id || !DB.weapons[id]) return;
        const p = state.pending.find((x) => x.type === "item" && x.add && x.weapon === id);
        if (p) { if (opts.mark && !p.mark) { p.mark = opts.mark; p.why = why; } return; }
        if (state.weapons.includes(id)) {
          // もう持っている剣が錬成されて届いた → 持っている剣を錬成
          if (opts.mark && !(state.marks && state.marks[id])) {
            state.marks = { ...(state.marks || {}), [id]: opts.mark };
            state.pending.push({ type: "item", weapon: id, why: "forge" });
          }
          return;
        }
        state.pending.push({ type: "item", weapon: id, why, add: true, mark: opts.mark || null, select: !!opts.select });
      };
      // 倒したベオクが使っていた武器を手に入れる(アイクが使える種類だけ。漆黒の騎士は除く)
      if (enemy && enemy.race === "ベオク" && !enemy.blackKnight && ikeCanUse(state, enemy.weapon)) {
        got(enemy.weapon, "enemy", { mark: enemy.marks && enemy.marks[enemy.weapon] });
      }
      if (stage === REGAL_STAGE) got(REGAL, "regal");
      // 天使の羽衣:HP+7(上限まで)
      if (stage === ROBE_STAGE) {
        const before = state.stats.hp;
        state.stats.hp = Math.min(state.stats.hp + ROBE_HP, (capOf(state) || { hp: 99 }).hp);
        state.pending.push({ type: "boost", item: "天使の羽衣", stat: "hp", from: before, to: state.stats.hp });
      }
      // てつの剣が錬成武器に(数値はランダム。キャラ作成の錬成と同じ範囲、すべて0は引き直し)
      if (stage === FORGE_STAGE && state.weapons.includes(IKE_WEAPON) && !(state.marks && state.marks[IKE_WEAPON])) {
        state.marks = { ...(state.marks || {}), [IKE_WEAPON]: forge() };
        state.pending.push({ type: "item", weapon: IKE_WEAPON, why: "forge" });
      }
      if (stage === LAGUZ_SWORD_STAGE) got(LAGUZ_SWORD, "laguz");
      if (FORGED_GIFTS[stage]) got(FORGED_GIFTS[stage], "forged", { mark: forge() });
      // 8体目:力・幸運・守備のどれかが+2
      if (stage === STAT_ITEM_STAGE) {
        const it = rng.pick(STAT_ITEMS);
        const before = state.stats[it.stat];
        state.stats[it.stat] = Math.min(before + it.n, (capOf(state) || {})[it.stat] || 99);
        state.pending.push({ type: "boost", item: it.item, stat: it.stat, from: before, to: state.stats[it.stat] });
      }
      if (stage === PRAYER_STAGE) got(PRAYER_SWORD, "prayer");
      if (stage === IKE.INA) got(RAGNELL, "ragnell", { select: true });
      // v1.6.4:19体目のあと、ドーピングアイテム3つから1つを選ぶ(ランダムの3つ)
      if (stage === IKE.DOPE_STAGE) {
        const pool = DOPE_ITEMS.slice(), options = [];
        while (options.length < 3 && pool.length) options.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
        state.pending.push({ type: "dope", options });
      }
    } else {
      // レベルアップの回数:ベオクは2回(Lv21 になるところはクラスチェンジ)、ラグズはベオクのレベル − 10 に追いつく分
      const ups = isLaguz(saved) ? Math.max(0, playerLevelAfter(true, stage) - state.level) : 2;
      for (let i = 0; i < ups; i++) {
        if (!isLaguz(saved) && !state.promoted && state.level + 1 >= CLASS_CHANGE_LV && DB.promotionOf(state.baseClass)) classChange(state);
        else levelUps(state, saved, 1, rng);
      }
    }
    if (state.skillMode === "carry") {
      const have = state.skills.slice();
      const opts = [];
      // v1.6.4:アイクモードの11体目(漆黒の騎士)を倒したときは、ランダムの2つだけ(倒した敵のスキルは出ない)
      const noEnemy = isIke(state) && stage === IKE.KNIGHT1;
      if (!noEnemy && enemy && enemy.skill && !have.includes(enemy.skill) && usable(saved, state.className, enemy.skill)) opts.push({ name: enemy.skill, from: "enemy" });
      const rnd = drawSkills(skillPoolFor(saved, state.className), 2, have.concat(opts.map((o) => o.name)), rng);
      for (const name of rnd) opts.push({ name, from: "random" });
      // v1.6.3:アイクモードの19体目を倒したときは、2つのうち1つが必ず天空(もう持っていれば今までどおり)
      // v1.6.4:20体目を倒したときは、片方が必ず月光
      const sure = isIke(state) && stage === IKE.SKY_STAGE ? "天空" : isIke(state) && stage === IKE.LUNA_STAGE ? "月光" : null;
      if (sure && !have.includes(sure)) {
        const other = rnd.find((n) => n !== sure) || drawSkills(skillPoolFor(saved, state.className), 1, have.concat([sure]), rng)[0];
        opts.length = 0;
        opts.push({ name: sure, from: "sure" });
        if (other) opts.push({ name: other, from: "random" });
      }
      // v1.6.1:9体目を倒すと2つ目を追加。10体目からは1つ目・2つ目のどちらかと交換(2つ目がないときは追加)
      const mode = stage === ADD_SKILL_STAGE || (stage > ADD_SKILL_STAGE && have.length < 2) ? "add" : stage > ADD_SKILL_STAGE ? "swap2" : "swap";
      if (opts.length) state.pending.push({ type: "skill", mode, options: opts });
      // v1.6.3:21体目(アシュナード)に進めるときは、3つ目のスキルを選べる
      if (isIke(state) && stage === IKE.BOSS && state.bonus) {
        const third = THIRD_SKILLS.filter((n) => DB.skills.some((x) => x.name === n)).map((name) => ({ name, from: "third" }));
        state.pending.push({ type: "skill", mode: "add3", options: third });
      }
    }
    state.stage++;
    return state;
  }

  // 負けた:コンティニューの回数を数える。イナ戦は3回負けたら終わり(★はそのまま)
  function lose(state) {
    if (state.done) return state;
    // v1.6.3:アシュナード戦のコンティニューは5回まで(6回目に負けたら終わり)
    if (isIke(state) && state.stage === IKE.ASHNARD) {
      state.ashLosses = (state.ashLosses || 0) + 1;
      if (state.ashLosses > IKE.ASH_CONTINUES) { state.done = true; state.result = "over"; return state; }
    }
    if (!isIke(state) && state.stage === EXTRA) {
      state.inaTries++;
      if (state.inaTries >= INA_TRIES) { state.done = true; state.result = "over"; return state; }
    }
    state.continues++;
    return state;
  }
  const inaLeft = (state) => INA_TRIES - state.inaTries;
  // v1.6.3:アシュナード戦の、残りのコンティニュー
  const ashLeft = (state) => IKE.ASH_CONTINUES - (state.ashLosses || 0);

  function giveUp(state) {
    state.done = true;
    state.result = "giveup";
    return state;
  }

  // スキルを選ぶ(name が null なら交換しない・追加しない。最初の選択は必ず選ぶ)
  // v1.6.1:slot(0 / 1)は「1つ目・2つ目のどちらと交換するか」(mode が swap2 のとき。省略すると1つ目)
  function chooseSkill(state, name, slot = 0) {
    const p = state.pending[0];
    if (!p || p.type !== "skill") return false;
    if (name && (p.mode === "swap2" || p.mode === "add3") && state.skills.includes(name)) return false;
    if (name && !p.options.some((o) => o.name === name)) return false;
    if (!name && p.mode === "start") return false;
    if (name) {
      if (p.mode === "start") state.skills = [name];
      else if (p.mode === "add") state.skills = [state.skills[0], name].filter(Boolean);
      else if (p.mode === "add3") state.skills = state.skills.slice(0, 2).concat([name]); // v1.6.3:3つ目
      else if (p.mode === "swap2") state.skills[slot === 1 && state.skills.length > 1 ? 1 : 0] = name;
      else state.skills[0] = name;
    }
    state.pending.shift();
    return true;
  }

  // v1.6.4:ドーピングアイテムを1つ選ぶ(index は options の番号)。能力値の上限まで
  function chooseDope(state, index) {
    const p = state.pending[0];
    if (!p || p.type !== "dope" || !p.options[index]) return false;
    const it = p.options[index];
    const before = state.stats[it.stat];
    state.stats[it.stat] = Math.min(before + it.n, (capOf(state) || {})[it.stat] || 99);
    state.pending[0] = { type: "boost", item: it.item, stat: it.stat, from: before, to: state.stats[it.stat], chosen: true };
    return true;
  }

  // v1.6.1:ラグネル以外の持ち物の剣
  const heldSwords = (state) => (state.weapons || []).filter((id) => id !== RAGNELL);
  // 次に受け取る武器で、1つ手放す必要があるか
  function needsDiscard(state) {
    const p = state.pending[0];
    return !!p && p.type === "item" && !!p.add && p.weapon !== RAGNELL && heldSwords(state).length >= WEAPON_LIMIT;
  }
  // v1.6.1:手に入れたものを見た(受け取る)。手放す剣が必要なときは discard に持ち物の剣か、新しい剣(受け取らない)を渡す
  function takeItem(state, discard) {
    const p = state.pending[0];
    if (!p || (p.type !== "item" && p.type !== "boost")) return false;
    if (p.type === "item" && p.add) {
      if (needsDiscard(state)) {
        if (!discard || (discard !== p.weapon && !heldSwords(state).includes(discard))) return false;
        if (discard === p.weapon) { state.pending.shift(); return true; }
        state.weapons = state.weapons.filter((id) => id !== discard);
        if (state.marks) delete state.marks[discard];
        if (state.weapon === discard) state.weapon = p.weapon;
      }
      state.weapons.push(p.weapon);
      const marks = { ...(state.marks || {}) };
      if (p.mark) marks[p.weapon] = p.mark; else delete marks[p.weapon];
      state.marks = marks;
      if (p.select) state.weapon = p.weapon;
    }
    state.pending.shift();
    return true;
  }

  // ================= v1.7.1:アーケードの3on3(ふつうのアーケードだけ。アイクモードは対象外) =================
  //   ・キャラを3人選んで11連戦。敵も毎回3人(ランダムに生まれたキャラ。レベル・上級職・スキルは1人のときと同じ)
  //   ・11体目(EXTRA)は、敵の3人の中に必ずイナがいる(ほかの2人は10体目と同じ強さ)
  //   ・勝つと3人ともレベルアップ(1人のときと同じ)。スキルは最初に1人ずつ2つから選ぶ。
  //     勝ったあとのスキルの交換・追加は、3人のうち1人だけ(9体目を倒すと選んだ1人に2つ目を追加。10体目からは、
  //     2つ目のないキャラなら追加、あるキャラなら1つ目・2つ目のどちらかと交換)
  //   ・バトルは 3on3 と同じ(王・休み・継承・神官など)
  const TEAM_SIZE = 3;
  const isTeam = (state) => !!state && state.team === true;
  function newMember(char) {
    const human = lv1Stats(char);
    delete human.con;
    return { charId: char.id, level: 1, baseClass: char.className, className: char.className, promoted: false, stats: human, skills: [], weapon: null };
  }
  function createTeam(chars, opts = {}) {
    const rng = opts.rng;
    const members = chars.slice(0, TEAM_SIZE).map(newMember);
    const state = {
      v: 1, mode: "normal", team: true, members,
      charId: members[0].charId, // 古い画面の部品のため(1人目)
      skillMode: "carry",
      seed: opts.seed || String(Math.floor(rng.next() * 1e9)),
      stage: 1, cleared: 0, level: 1, baseClass: members[0].baseClass, className: members[0].className, promoted: false,
      stats: members[0].stats, skills: [], weapon: null, weapons: null, seen: {}, bonus: false,
      enemies: {}, continues: 0, inaTries: 0, stars: 0, done: false, result: null, pending: [],
    };
    chars.slice(0, TEAM_SIZE).forEach((c, k) => {
      state.pending.push({ type: "skill", mode: "start", who: k, options: drawSkills(skillPoolFor(c), 2, [], rng).map((name) => ({ name, from: "random" })) });
    });
    return state;
  }
  // stage 体目の敵の3人(seed が同じなら同じ敵)。EXTRA はイナ+10体目と同じ強さの2人(イナの位置はランダム)
  function makeTeamEnemies(stage, seed) {
    const rng = global.Rng.createSeededRng(`${seed}|team${stage}`);
    const inaAt = stage === EXTRA ? rng.int(0, TEAM_SIZE - 1) : -1;
    const out = [];
    for (let k = 0; k < TEAM_SIZE; k++) {
      const e = k === inaAt ? ina() : makeEnemy(stage === EXTRA ? STAR_STAGE : stage, `${seed}|t${k}`, "normal");
      e.id = `arcade-enemy-${stage}-${k}`;
      if (stage === EXTRA && k !== inaAt) e.extraStage = true;
      out.push(e);
    }
    return out;
  }
  // savedList:3人の保存されたキャラ
  function winTeam(state, savedList, rng) {
    if (state.done) return state;
    const stage = state.stage;
    const enemies = state.enemies[stage] || [];
    state.cleared = stage;
    if (stage >= STAR_STAGE) state.stars = Math.max(state.stars, stage === EXTRA ? 2 : 1);
    if (isFinal(state, stage)) { state.done = true; state.result = "clear"; return state; }
    state.members.forEach((m, k) => {
      const saved = savedList[k];
      const n0 = state.pending.length;
      m.pending = state.pending; // levelUps / classChange は pending に積む
      const ups = isLaguz(saved) ? Math.max(0, playerLevelAfter(true, stage) - m.level) : 2;
      for (let i = 0; i < ups; i++) {
        if (!isLaguz(saved) && !m.promoted && m.level + 1 >= CLASS_CHANGE_LV && DB.promotionOf(m.baseClass)) classChange(m);
        else levelUps(m, saved, 1, rng);
      }
      delete m.pending;
      for (let j = n0; j < state.pending.length; j++) state.pending[j].who = k;
    });
    // スキル:倒した敵のスキル(3人のだれかが使えるもの)1つ + ランダムの2つ。3人のうち1人だけが交換・追加できる
    const canAny = (name) => state.members.some((m, k) => !m.skills.includes(name) && usable(savedList[k], m.className, name));
    const foeSkills = [];
    for (const e of enemies) for (const n of [e.skill, ...(e.extraSkills || [])]) if (n && !foeSkills.includes(n) && canAny(n)) foeSkills.push(n);
    const opts = [];
    if (foeSkills.length) opts.push({ name: rng.pick(foeSkills), from: "enemy" });
    const pool = DB.skills.filter((sk) => state.members.some((m, k) => usable(savedList[k], m.className, sk.name)));
    for (const name of drawSkills(pool, 2, opts.map((o) => o.name), rng)) opts.push({ name, from: "random" });
    if (opts.length) state.pending.push({ type: "skill", mode: "team", add: stage === ADD_SKILL_STAGE, options: opts });
    state.stage++;
    return state;
  }
  // 3人のうち k 人目にスキルを渡すときの形(add:2つ目として追加 / swap2:1つ目・2つ目のどちらかと交換 / swap:1つ目と交換)
  function teamSkillMode(state, k) {
    const m = state.members[k];
    if (state.cleared >= ADD_SKILL_STAGE && m.skills.length < 2) return "add";
    return state.cleared > ADD_SKILL_STAGE ? "swap2" : "swap";
  }
  const teamCanTake = (state, k, saved, name) => !!state.members[k] && !state.members[k].skills.includes(name) && usable(saved, state.members[k].className, name);
  // 最初のスキル(who は pending にある)/ 勝ったあとの交換・追加(who:3人の何番目か、slot:swap2 のとき 0 / 1)。name が null なら交換しない
  function chooseTeamSkill(state, name, who, slot = 0, saved = null) {
    const p = state.pending[0];
    if (!p || p.type !== "skill") return false;
    if (p.mode === "start") {
      if (!name || !p.options.some((o) => o.name === name)) return false;
      state.members[p.who].skills = [name];
      state.pending.shift();
      return true;
    }
    if (p.mode !== "team") return false;
    if (name) {
      if (!p.options.some((o) => o.name === name)) return false;
      const m = state.members[who];
      if (!m || m.skills.includes(name)) return false;
      if (saved && !usable(saved, m.className, name)) return false;
      const mode = teamSkillMode(state, who);
      if (mode === "add") m.skills = [m.skills[0], name].filter(Boolean);
      else if (mode === "swap2") m.skills[slot === 1 && m.skills.length > 1 ? 1 : 0] = name;
      else m.skills[0] = name;
    }
    state.pending.shift();
    return true;
  }

  // 保存された状態が使えるか(キャラが削除されていないか)
  function valid(state, exists) {
    if (isTeam(state)) {
      return !!(state.v === 1 && Array.isArray(state.members) && state.members.length === TEAM_SIZE
        && state.members.every((m) => m && exists(m.charId) && m.stats) && state.enemies);
    }
    return !!(state && state.v === 1 && state.charId && (isIke(state) || exists(state.charId)) && state.stats && state.enemies);
  }

  const stageName = (stage, state) => (!isIke(state) && stage === EXTRA ? "EXTRA" : `${stage}体目`);

  global.Arcade = {
    STAGES, EXTRA, STAR_STAGE, PROMOTED_FROM, PROMO_BASE, SKILL_FROM, INA_TRIES, CLASS_CHANGE_LV, INA_STATS,
    LAGUZ_FROM, LAGUZ_LV_GAP, enemyLevel, playerLevelAfter, rollLevel, promoteStats, transformed, lv1Stats, skillPoolFor, drawSkills,
    ADD_SKILL_STAGE, MAX_LV, IKE, IKE_LV1, IKE_CON, IKE_GROWTH, KNIGHT_STATS, FERAL_STATS, RAGNELL, REGAL, REGAL_STAGE, LAGUZ_SWORD, LAGUZ_SWORD_STAGE, BANDIT_STAGES, BANDIT_WEAPONS, ROBE_HP, FORGE_STAGE, FORGED_GIFTS, STAT_ITEM_STAGE, STAT_ITEMS, PRAYER_STAGE, PRAYER_SWORD, WEAPON_LIMIT, IKE_DEF_CAP, IKE_INA_DELTA, heldSwords, needsDiscard, ikeIna, bandit, ikeCanUse, isIke, stagesOf, isFinal,
    blackKnight, feral, ikeChar, savedChar, takeItem, THIRD_SKILLS, IKE_NO_ENEMY_SKILLS, NO_ENEMY_SKILLS, IKE_DEF_CAP_EARLY, ashLeft, DOPE_ITEMS, chooseDope, capOf,
    ashnard, ASHNARD_STATS, ASHNARD2_STATS, GURGURANT, IKE_NO_CLASSES, NORMAL_NO_CLASSES, isTraining,
    TEAM_SIZE, isTeam, createTeam, makeTeamEnemies, winTeam, teamSkillMode, teamCanTake, chooseTeamSkill, usable,
    makeEnemy, ina, create, ensureEnemy, playerChar, win, lose, giveUp, chooseSkill, valid, inaLeft, stageName,
  };
})(window);
