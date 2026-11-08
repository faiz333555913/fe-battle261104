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

  const LAGUZ_FROM = 6;       // ラグズの敵は6体目から
  const LAGUZ_LV_GAP = 10;    // ラグズのレベル = ベオクのレベル − 10
  const isLaguz = (c) => !!c && c.race === "ラグズ";
  // cleared 体倒したときの味方のレベル(ベオク:1,3,5…。ラグズ:ベオクのレベル − 10、最低1)
  const playerLevelAfter = (laguz, cleared) => (laguz ? Math.max(1, 2 * cleared + 1 - LAGUZ_LV_GAP) : 2 * cleared + 1);

  // 敵のレベル:ベオクは 2,4,6…14。8体目からは上級職で 2,4,6。ラグズ(6・7体目)はベオクのレベル − 10 で 2,4
  function enemyLevel(stage, laguz) {
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
  function skillPoolFor(char, className) {
    const magic = (char.weapons || []).some((id) => DB.weapons[id] && DB.weapons[id].isMagic);
    return DB.skills.filter((s) => !s.classOnly && !(s.magicOnly && !magic)
      && !(s.beorcOnly && (isLaguz(char) || !DB.promotionOf(className || char.className))));
  }
  const usable = (char, className, name) => skillPoolFor(char, className).some((s) => s.name === name);
  // 重みつきで n 個(同じものは選ばない。exclude のスキルも選ばない)
  function drawSkills(pool, n, exclude, rng) {
    let rest = pool.filter((s) => !exclude.includes(s.name));
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

  // stage 体目の敵を作る。seed が同じなら同じ敵(コンティニューしても同じ相手)
  function makeEnemy(stage, seed) {
    if (stage === EXTRA) return ina();
    const rng = global.Rng.createSeededRng(`${seed}|enemy${stage}`);
    const rand = () => rng.next();
    const promoted = stage >= PROMOTED_FROM;
    let g = null;
    for (let i = 0; i < 20 && !g; i++) {
      // 5体目まで・8体目からはベオクだけ(ラグズは Lv1 でもベオクの Lv10 くらいの強さがあるため)
      const beorcOnly = promoted || stage < LAGUZ_FROM;
      const n = global.Generator.normalizeInputs(global.RandomChar.randomInputs(rand, beorcOnly ? { race: "ベオク" } : {}));
      if (n.ok) g = global.Generator.generateCharacter(n.value);
    }
    const laguz = isLaguz(g);
    const level = enemyLevel(stage, laguz);
    const cls = DB.classByName[g.className];
    let className = g.className, max = cls.max, stats;
    if (promoted && DB.promotionOf(g.className)) {
      // 上級職:下級職で Lv(PROMO_BASE + Lv) まで育ってからクラスチェンジした強さ(表示の Lv は上級職のレベル)
      const p = DB.promotionOf(g.className);
      stats = { ...g.statsLv1 };
      for (let lv = 1; lv < PROMO_BASE + level; lv++) rollLevel(stats, g.growth, cls.max, rng);
      promoteStats(stats, p);
      className = p.name;
      max = p.max;
    } else {
      stats = { ...g.statsLv1 };
    }
    if (!promoted) for (let lv = 1; lv < level; lv++) rollLevel(stats, g.growth, max, rng);
    const con = g.stats.con;
    const e = {
      id: `arcade-enemy-${stage}`, enemy: true, inputs: g.inputs, name: g.name, gender: g.gender, race: g.race,
      level, arcadeLv: level, colorHex: g.colorHex, className, baseClass: g.className, moveType: g.moveType, element: g.element,
      kanjiType: g.kanjiType, growth: g.growth, weapons: g.weapons.slice(), marks: g.marks || {},
      stats: { ...stats, con },
    };
    if (laguz) { e.statsHuman = { ...stats, con }; e.stats = { ...transformed(stats, g.className), con }; }
    // 武器:4体目までは一番★の少ない武器(はじめは手ごろな相手に)。5体目からはランダム
    const ws = e.weapons.filter((id) => DB.weapons[id]);
    if (stage < SKILL_FROM) {
      e.weapon = ws.slice().sort((a, b) => DB.weaponStars(DB.weapons[a]) - DB.weaponStars(DB.weapons[b]))[0];
    } else {
      e.weapon = rng.pick(ws);
    }
    // スキル:5体目から(抽選と同じ。武器スキルとかぶらない)
    e.skill = stage >= SKILL_FROM ? global.Battle.drawSkill(global.Battle.makeUnit(e, e.weapon, "right"), rng) : null;
    e.extraSkills = [];
    return e;
  }

  // ---- 進行 ----
  // char:選んだキャラ(保存されたもの)。opts:{ skillMode:"random"|"carry", rng }
  function create(char, opts = {}) {
    const rng = opts.rng;
    const human = lv1Stats(char);
    delete human.con;
    const state = {
      v: 1,
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
    if (!state.enemies[state.stage]) state.enemies[state.stage] = makeEnemy(state.stage, state.seed);
    return state.enemies[state.stage];
  }

  // バトルで使う味方のキャラ(保存されたキャラに、今のレベル・職業・能力値を入れたもの)
  function playerChar(state, saved) {
    const con = saved.stats.con;
    const c = { ...saved, className: state.className, level: state.level, arcadeLv: state.level, statsLv1: undefined };
    if (isLaguz(saved)) {
      c.statsHuman = { ...state.stats, con };
      c.stats = { ...transformed(state.stats, saved.className), con };
    } else {
      c.stats = { ...state.stats, con };
    }
    return c;
  }

  // 勝った:レベルアップ(+クラスチェンジ)・★・持ち越しならスキルの交換(10体目は追加)を pending に積み、次の敵へ
  function win(state, saved, rng) {
    if (state.done) return state;
    const stage = state.stage;
    const enemy = state.enemies[stage];
    state.cleared = stage;
    if (stage >= STAR_STAGE) state.stars = Math.max(state.stars, stage === EXTRA ? 2 : 1);
    if (stage === EXTRA) { state.done = true; state.result = "clear"; return state; }
    // レベルアップの回数:ベオクは2回(Lv21 になるところはクラスチェンジ)、ラグズはベオクのレベル − 10 に追いつく分
    const ups = isLaguz(saved) ? Math.max(0, playerLevelAfter(true, stage) - state.level) : 2;
    for (let i = 0; i < ups; i++) {
      const before = { ...state.stats };
      const p = !isLaguz(saved) && !state.promoted && state.level + 1 >= CLASS_CHANGE_LV ? DB.promotionOf(state.baseClass) : null;
      if (p) {
        // Lv20 → Lv21 になるところで、上級職(Lv1)にクラスチェンジ
        const up = promoteStats(state.stats, p);
        state.pending.push({ type: "classchange", fromClass: state.className, toClass: p.name, from: state.level, to: 1, before, after: { ...state.stats }, gains: up });
        state.className = p.name;
        state.promoted = true;
        state.level = 1;
      } else {
        const gains = rollLevel(state.stats, saved.growth, capOf(state), rng);
        state.level++;
        state.pending.push({ type: "levelup", className: state.className, from: state.level - 1, to: state.level, before, after: { ...state.stats }, gains });
      }
    }
    if (state.skillMode === "carry") {
      const have = state.skills.slice();
      const opts = [];
      if (enemy && enemy.skill && !have.includes(enemy.skill) && usable(saved, state.className, enemy.skill)) opts.push({ name: enemy.skill, from: "enemy" });
      const rnd = drawSkills(skillPoolFor(saved, state.className), 2, have.concat(opts.map((o) => o.name)), rng);
      for (const name of rnd) opts.push({ name, from: "random" });
      if (opts.length) state.pending.push({ type: "skill", mode: stage === STAR_STAGE ? "add" : "swap", options: opts });
    }
    state.stage++;
    return state;
  }

  // 負けた:コンティニューの回数を数える。イナ戦は3回負けたら終わり(★はそのまま)
  function lose(state) {
    if (state.done) return state;
    if (state.stage === EXTRA) {
      state.inaTries++;
      if (state.inaTries >= INA_TRIES) { state.done = true; state.result = "over"; return state; }
    }
    state.continues++;
    return state;
  }
  const inaLeft = (state) => INA_TRIES - state.inaTries;

  function giveUp(state) {
    state.done = true;
    state.result = "giveup";
    return state;
  }

  // スキルを選ぶ(name が null なら交換しない・追加しない。最初の選択は必ず選ぶ)
  function chooseSkill(state, name) {
    const p = state.pending[0];
    if (!p || p.type !== "skill") return false;
    if (name && !p.options.some((o) => o.name === name)) return false;
    if (!name && p.mode === "start") return false;
    if (name) {
      if (p.mode === "start") state.skills = [name];
      else if (p.mode === "add") state.skills = [state.skills[0], name].filter(Boolean);
      else state.skills[0] = name;
    }
    state.pending.shift();
    return true;
  }

  // 保存された状態が使えるか(キャラが削除されていないか)
  function valid(state, exists) {
    return !!(state && state.v === 1 && state.charId && exists(state.charId) && state.stats && state.enemies);
  }

  const stageName = (stage) => (stage === EXTRA ? "EXTRA" : `${stage}体目`);

  global.Arcade = {
    STAGES, EXTRA, STAR_STAGE, PROMOTED_FROM, PROMO_BASE, SKILL_FROM, INA_TRIES, CLASS_CHANGE_LV, INA_STATS,
    LAGUZ_FROM, LAGUZ_LV_GAP, enemyLevel, playerLevelAfter, rollLevel, promoteStats, transformed, lv1Stats, skillPoolFor, drawSkills,
    makeEnemy, ina, create, ensureEnemy, playerChar, win, lose, giveUp, chooseSkill, valid, inaLeft, stageName,
  };
})(window);
