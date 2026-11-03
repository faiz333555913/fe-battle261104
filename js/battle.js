// バトルの計算式と、自動戦闘の進行。式はすべてこのファイルにまとめてある(仕様書 4-2)。
(function (global) {
  "use strict";
  const C = global.Config;
  const DB = global.GameDB;

  // ---- 戦闘ユニットを作る ----
  // char: 保存されたキャラ / weaponId: その対戦で使う武器
  function makeUnit(char, weaponId, side) {
    const weapon = DB.weapons[weaponId];
    const withBonus = (base) => {
      const s = { ...base };
      for (const [k, v] of Object.entries(weapon.statBonus)) s[k] = (s[k] || 0) + v;
      return s;
    };
    const stats = withBonus(char.stats);
    const u = {
      side,
      char,
      name: char.name,
      className: char.className,
      weapon,
      stats,
      maxHp: stats.hp,
      hp: stats.hp,
      elem: DB.elementBonus[char.element] || { attack: 0, hit: 0, avoid: 0, defense: 0 },
      bio: C.biorhythm[1], // 普通
      skill: null,
      status: null,       // { name, turns }
      sleep: null,        // v1.3.4 睡眠 { turns, round }
      debuff: {},         // v1.3.4 咆哮などで下がった能力値 { str: -3, ... }
      roarStacks: 0,
      rageOn: false,      // v1.3.4 怒り・勇将が発動中か
      broken: false,      // v1.3.4 武器破壊された
      equip: weapon,      // 元の武器(疾風の刃・武器破壊で weapon が入れ替わっても、名前の判定に使う)
      cancelNext: false,
      laguz: null,
    };
    // ラグズ(v1.3.0):最初は化身前。化身ゲージの初期値は幸運(上限20)
    if (char.race === "ラグズ" && char.statsHuman) {
      const human = withBonus(char.statsHuman);
      // 初期値 = 幸運 + 部族ボーナス(鳥翼族のみ+10)、上限20
      const cls = DB.classByName[char.className];
      const bonus = cls ? cls.gaugeBonus || 0 : 0;
      u.laguz = { gauge: Math.min(C.laguzGauge.max, human.lck + bonus), transformed: false, humanStats: human };
    }
    return u;
  }

  function cloneUnit(u) {
    const c = makeUnit(u.char, u.weapon.id, u.side);
    c.bio = u.bio;
    c.skill = u.skill;
    return c;
  }

  // 化身ゲージを増やす(上限20)。化身中は増えない
  function gainGauge(u, amount) {
    if (!u.laguz || u.laguz.transformed) return false;
    u.laguz.gauge = Math.min(C.laguzGauge.max, u.laguz.gauge + amount);
    return true;
  }
  function transformIfFull(u) {
    if (!u.laguz || u.laguz.transformed || u.laguz.gauge < C.laguzGauge.max) return false;
    u.laguz.transformed = true;
    return true;
  }
  // ラウンド1開始時:化身前なら+4し、20になれば即化身
  function roundOneStart(u) {
    gainGauge(u, C.laguzGauge.roundGain);
    return transformIfFull(u);
  }
  // バトル準備の予測用:ラウンド1開始時点の状態にしたコピー
  function previewRoundOne(u) {
    const c = cloneUnit(u);
    roundOneStart(c);
    return c;
  }

  function isSkillOwner(u, name) {
    return u.skill === name || u.weapon.weaponSkill === name;
  }

  // 『能力勝負』が効いているか(v1.3.4)。どちらかが持っていて、相手に『見切り』で消されていなければ有効
  function statsDuel(a, b) {
    if (!a || !b) return false;
    const on = (x, y) => isSkillOwner(x, "能力勝負") && !isSkillOwner(y, "見切り");
    return on(a, b) || on(b, a);
  }

  // スキルが有効か(武器スキルも含む。相手の『見切り』、どちらかの『能力勝負』で無効になる)
  function hasSkill(u, enemy, name) {
    if (!isSkillOwner(u, name)) return false;
    if (enemy && name !== "見切り" && isSkillOwner(enemy, "見切り")) return false;
    if (name !== "能力勝負" && statsDuel(u, enemy)) return false;
    return true;
  }

  // 『女神の加護』が効いているか(v1.3.4)。def が持っていて、att が対象外(エタルド・ラグネル・王族のラグズ・赤竜)でないとき
  function goddessExempt(att) {
    const ex = C.goddessExempt;
    return ex.weapons.includes((att.equip || att.weapon).name) || ex.classes.includes(att.className);
  }
  function goddessGuards(def, att) {
    return hasSkill(def, att, "女神の加護") && !goddessExempt(att);
  }

  // 怒り・勇将の発動中か(HPが半分以下)。発動しているスキル名 or null
  function rageSkill(u, enemy) {
    if (u.hp <= 0 || u.hp * 2 > u.maxHp) return null;
    return C.rageSkills.find((n) => hasSkill(u, enemy, n)) || null;
  }

  // スキルの抽選(v1.3.4):陽光は魔法系の武器を使うときだけ。女神の加護はめったに出ない(weight)
  function skillPool(u) {
    return DB.skills.filter((s) => !s.magicOnly || (u && u.weapon.isMagic));
  }
  function drawSkill(u, rng) {
    const pool = skillPool(u);
    const total = pool.reduce((a, s) => a + (s.weight ?? 1), 0);
    let r = rng.next() * total;
    for (const s of pool) { r -= s.weight ?? 1; if (r < 0) return s.name; }
    return pool[pool.length - 1].name;
  }

  const isHuman = (u) => !!(u.laguz && !u.laguz.transformed);

  // 化身前後の能力値(勇将・咆哮などは含まない)
  function formStats(u) {
    return { ...(u.laguz && !u.laguz.transformed ? u.laguz.humanStats : u.stats) };
  }
  // 化身・『勇将』・下がった能力(咆哮)込みの、今の能力値
  function curStats(u, enemy) {
    const s = formStats(u);
    if (hasSkill(u, enemy, "勇将") && u.hp * 2 <= u.maxHp) {
      for (const k of ["str", "skl", "spd"]) s[k] = Math.floor(s[k] * 1.5);
    }
    for (const [k, v] of Object.entries(u.debuff || {})) s[k] = Math.max(0, s[k] + v);
    return s;
  }

  // バイオリズムの補正 { hit, avoid, crit }
  // 安定:不調を普通にする / 気分屋:補正を倍にする(必殺も)
  function biorhythmMod(u, enemy) {
    if (statsDuel(u, enemy)) return { hit: 0, avoid: 0, crit: 0 }; // 能力勝負:バイオリズムなし
    let b = u.bio;
    if (b.name === "不調" && hasSkill(u, enemy, "安定")) b = C.biorhythm.find((x) => x.name === "普通");
    const m = hasSkill(u, enemy, "気分屋") ? 2 : 1;
    return { hit: b.hit * m, avoid: b.avoid * m, crit: b.crit * m };
  }

  // 3すくみ:+1 有利 / -1 不利 / 0 なし
  function triangle(attWeapon, defWeapon) {
    if (C.triangleAdvantage[attWeapon.category] === defWeapon.category) return 1;
    if (C.triangleAdvantage[defWeapon.category] === attWeapon.category) return -1;
    return 0;
  }

  // 攻速 = 速さ − 武器の重さが「持つ力」を超えた分。
  // v1.3.4:魔導書(炎・雷・風・光)は、力ではなく速さで持つ(力の低い魔道士・クレリックが重い魔導書を持ちづらくならないように)
  function attackSpeed(u, enemy) {
    const s = curStats(u, enemy);
    const carry = C.magicCategories.includes(u.weapon.category) ? s.spd : s.str;
    return Math.max(0, s.spd - Math.max(0, u.weapon.weight - carry));
  }
  const classCrit = (u) => C.classCritBonus[DB.baseClassName(u.className)] || 0;

  // ダメージ(v1.3.4・ガトー指定):
  // (攻撃力 − 防御力)× 特効なら2倍 + 属性の攻撃補正 − 属性の防御補正、必殺ならその3倍
  // 攻撃力 = 力(魔法は魔力)+ 武器の威力 + 3すくみ(有利+1・不利-1)、防御力 = 守備(魔法は魔防)
  function finalDamage(atk, defense, c, crit) {
    if (c.goddess) return 0;
    const core = Math.max(0, atk - defense) * (c.effective ? 2 : 1);
    return Math.max(0, core + c.elemAtk - c.elemDef) * (crit ? 3 : 1);
  }

  const clamp = (v) => Math.max(0, Math.min(100, v));

  // ---- 1回の攻撃の数値(戦闘予測にも使う) ----
  function calc(att, def) {
    const a = curStats(att, def);
    const d = curStats(def, att);
    const w = att.weapon;
    const tri = triangle(w, def.weapon);
    const effective = DB.isEffective(w, def.className);

    // ダメージ
    // ラグズの化身前は、爪・くちばし・ブレスの威力が0
    // v1.3.4(ガトー指定):攻撃力 = 力(魔法は魔力)+ 武器の威力 + 3すくみ。防御力 = 守備(魔法は魔防)
    // 特効は(攻撃力−防御力)を2倍。属性の補正はその後に足し引きする(finalDamage)
    const baseMight = w.category === "laguz" && isHuman(att) ? 0 : w.might;
    const might = baseMight + tri * C.triangleMight; // 3すくみ込みの武器の威力
    // 疾風の刃(v1.3.4):力・魔力の大きいほうで魔法攻撃
    const atkStat = w.windBlade ? Math.max(a.str, a.mag) : w.isMagic ? a.mag : a.str;
    const atk = atkStat + might;
    const defense = w.isMagic ? d.res : d.def;

    // 命中
    const bioA = biorhythmMod(att, def), bioD = biorhythmMod(def, att);
    let hit = w.hit + a.skl * 2 + a.lck + bioA.hit + tri * C.triangleHit + att.elem.hit;
    if (hasSkill(att, def, "千里眼")) hit += 20;
    // 『護り手』(v1.3.4)は、相手のスキルで能力・命中・必殺が下がらない
    const guarded = hasSkill(att, def, "護り手");
    if (hasSkill(def, att, "恐怖") && !guarded) hit -= 10;
    if (hasSkill(att, def, "狙撃")) hit *= 2;

    // 回避
    let avoid = attackSpeed(def, att) * 2 + d.lck + bioD.avoid + def.elem.avoid + def.weapon.avoidBonus;
    if (hasSkill(def, att, "順風耳")) avoid += 20;
    if (def.sleep) avoid = 0; // 睡眠中は回避0(v1.3.4)

    // 必殺
    let crit = 0;
    if (!w.noCrit) {
      crit = w.crit + Math.floor(a.skl / 2) + w.critBonus + bioA.crit + classCrit(att);
      if (hasSkill(att, def, "怒り") && att.hp * 2 <= att.maxHp) crit += 50;
      if (hasSkill(def, att, "恐怖") && !guarded) crit -= 10;
      if (hasSkill(att, def, "一発屋")) crit += C.oneShot.critBonus; // v1.3.4:必殺+40
    }
    const critAvoid = d.lck;
    // 『一発屋』(v1.3.4):回避を引いた後の命中率を半分に
    let finalHit = clamp(hit - avoid);
    if (hasSkill(att, def, "一発屋")) finalHit = Math.floor(finalHit * C.oneShot.hitRate);
    // 『女神の加護』:ダメージ0・必殺なし
    const goddess = goddessGuards(def, att);

    const as = attackSpeed(att, def);
    const enemyAs = attackSpeed(def, att);
    const doubles = as - enemyAs >= C.doubleAttackThreshold;
    const hits = w.brave ? 2 : 1;
    return {
      atk, defense, might, tri, effective,
      elemAtk: att.elem.attack, elemDef: def.elem.defense,
      damage: goddess ? 0 : finalDamage(atk, defense, { effective, elemAtk: att.elem.attack, elemDef: def.elem.defense }, false),
      hit: finalHit,
      crit: goddess ? 0 : clamp(crit - critAvoid),
      goddess,
      as,
      doubles,
      hits,
      times: hits * (doubles ? 2 : 1), // 1ラウンドの攻撃回数(×2・×4 表記用)
    };
  }

  // 補正の合計(画面表示用)。v1.3.3:属性・バイオリズムに加えて、3すくみ・特効・武器の効果(能力値+・必殺+・回避+)も含める
  // ※スキルは対戦開始時に決まるので含めない
  function bonusSummary(u, enemy) {
    const b = biorhythmMod(u, enemy);
    const w = u.weapon, ew = enemy.weapon;
    const tri = triangle(w, ew);
    const sb = w.statBonus || {};
    // v1.3.4:戦闘中に変わる分(怒り・勇将の発動、咆哮で下がった能力)も含める
    const now = curStats(u, enemy), form = formStats(u);
    const dv = (k) => (now[k] || 0) - (form[k] || 0);
    const rage = rageSkill(u, enemy);
    // 攻撃の補正:3すくみ・属性・武器の能力値+・戦闘中の変化。特効(ダメージ2倍)は「⚠特効」の印で表す
    const key = w.isMagic ? "mag" : "str";
    return {
      attack: u.elem.attack + tri * C.triangleMight + (sb[key] || 0) + dv(key),
      defense: u.elem.defense + (ew.isMagic ? sb.res || 0 : sb.def || 0),
      hit: u.elem.hit + b.hit + tri * C.triangleHit + (sb.skl || 0) * 2 + (sb.lck || 0) + dv("skl") * 2,
      avoid: u.elem.avoid + b.avoid + (w.avoidBonus || 0) + (sb.lck || 0) + dv("spd") * 2,
      crit: b.crit + (w.critBonus || 0) + classCrit(u) + Math.floor((sb.skl || 0) / 2) + (Math.floor(now.skl / 2) - Math.floor(form.skl / 2)) + (rage === "怒り" && !w.noCrit ? 50 : 0),
    };
  }

  // 化身予定(v1.3.3):ダメージを受けない場合に、何ラウンド目に化身するか
  // 戻り値:null(ラグズでない)/ { round, when:"化身中"|"開幕"|"終了時" }
  function transformPlan(u) {
    if (!u.laguz) return null;
    if (u.laguz.transformed) return { round: 0, when: "化身中" };
    const max = C.laguzGauge.max, gain = C.laguzGauge.roundGain;
    let g = Math.min(max, u.laguz.gauge + gain);
    if (g >= max) return { round: 1, when: "開幕" };
    for (let r = 1; r <= C.maxRounds; r++) {
      g = Math.min(max, g + gain);
      if (g >= max) return { round: r, when: "終了時" };
    }
    return null;
  }

  // 先攻の優先(シャドウエッジ・『待ち伏せ』)
  function hasPriority(u, enemy) {
    return u.weapon.alwaysFirst || hasSkill(u, enemy, "待ち伏せ");
  }

  // 1ラウンド目の先攻を決める。戻り値 { side, reason }
  function decideFirst(left, right, rng) {
    const lp = hasPriority(left, right), rp = hasPriority(right, left);
    if (lp && !rp) return { side: "left", reason: priorityReason(left) };
    if (rp && !lp) return { side: "right", reason: priorityReason(right) };
    return { side: rng.next() < 0.5 ? "left" : "right", reason: lp && rp ? "(先攻効果が重なったためランダム)" : "(ランダム)" };
  }
  function priorityReason(u) {
    return u.weapon.alwaysFirst ? `(${u.weapon.name}の効果)` : "(『待ち伏せ』発動)";
  }

  function forecast(left, right) {
    return { left: calc(left, right), right: calc(right, left) };
  }

  // 武器破壊(v1.3.4):威力0・効果なし。武器で上がっていた能力値も戻す
  function breakWeapon(u) {
    const w = u.weapon;
    for (const [k, v] of Object.entries(w.statBonus || {})) u.stats[k] = (u.stats[k] || 0) - v;
    u.weapon = {
      ...w, might: 0, broken: true, effectiveTargets: [], brave: false, drain: false, status: null,
      alwaysFirst: false, critBonus: 0, avoidBonus: 0, statBonus: {}, selfDamage: false, weaponSkill: null,
    };
    u.broken = true;
  }

  // ---- 自動戦闘 ----
  // left/right: makeUnit で作ったもの(bio・skill 設定済み)。rng: Rng.createBattleRng()
  // 戻り値: { events, winner: "left" | "right" | "draw" }
  // opts.firstSide: 1ラウンド目の先攻("left"/"right")。画面の先攻ルーレットで決めた結果を渡す
  function simulate(left, right, rng, opts = {}) {
    const events = [];
    const units = { left, right };
    const other = (u) => (u === left ? right : left);

    const gaugeOf = (u) => (u.laguz ? { gauge: u.laguz.gauge, transformed: u.laguz.transformed } : null);
    const push = (e) => {
      e.hp = { left: left.hp, right: right.hp };
      const st = (u) => [u.status && u.status.name, u.sleep && "睡眠"].filter(Boolean).join("・") || null;
      e.status = { left: st(left), right: st(right) };
      e.laguz = { left: gaugeOf(left), right: gaugeOf(right) };
      e.rage = { left: left.rageOn, right: right.rageOn };
      e.broken = { left: left.broken, right: right.broken };
      if (e.forecast) e.bonus = { left: bonusSummary(left, right), right: bonusSummary(right, left) };
      if (e.target && units[e.target].hp <= 0 && (e.type === "hit" || e.type === "self" || e.type === "status")) e.finishing = true;
      events.push(e);
      if (e.type !== "rage") checkRage();
    };
    // 怒り・勇将(v1.3.4):HPが半分以下になったら「発動」、回復して半分を超えたら「解除」を出す
    function checkRage() {
      if (dead()) return; // 決着した後は出さない
      for (const u of [left, right]) {
        const name = rageSkill(u, other(u));
        const on = !!name;
        if (on === u.rageOn) continue;
        u.rageOn = on;
        const s = name || C.rageSkills.find((n) => isSkillOwner(u, n));
        const what = s === "勇将" ? "力・技・速さが1.5倍に!" : "必殺が出やすくなった!";
        push({
          type: "rage", actor: u.side, skill: s, on, forecast: fc(),
          text: on ? `${u.name}の『${s}』発動!${what}` : `${u.name}の『${s}』の効果が切れた`,
        });
      }
    }
    const skillUp = (u, name, text, extra) => push({
      type: "skill", actor: u.side, skill: name,
      ougi: C.ougiSkills.includes(name),
      rare: name === "女神の加護",
      fromWeapon: u.skill !== name && u.weapon.weaponSkill === name,
      text: `${u.name}の『${name}』発動!${text || ""}`,
      ...(extra || {}),
    });
    const sklRoll = (u, enemy) => rng.percent(curStats(u, enemy).skl);
    const dead = () => left.hp <= 0 || right.hp <= 0;
    const damageTo = (u, amount) => { const dealt = Math.min(amount, u.hp); u.hp -= dealt; return dealt; };
    const heal = (u, amount) => { const h = Math.min(amount, u.maxHp - u.hp); u.hp += h; return h; };
    const fc = () => forecast(left, right);
    // 化身(v1.3.3:化身したラウンドを記録し、そのラウンドの終了時は-5しない)
    const pushTransform = (u, instant = false) => {
      u.laguz.transformedRound = round;
      push({ type: "transform", actor: u.side, instant, forecast: fc(), text: `${u.name}が化身した!` });
    };
    // v1.3.3:ゲージが20になった時点で、その場で化身する。
    // ただし流星・天空・連続・疾風の刃など、スキルによる連続攻撃の最中は、その効果が終わるまで待つ
    let combo = 0;
    const transformNow = (u) => { if (u.hp > 0 && !dead() && transformIfFull(u)) pushTransform(u, true); };
    const comboStart = () => { combo++; };
    const comboEnd = () => { combo--; if (combo === 0) { transformNow(left); transformNow(right); } };
    // 化身前のラグズはダメージを受けるたびにゲージ+3(ポイズン・燃焼は除く)
    const hurtGauge = (u, dealt) => {
      if (!(dealt > 0 && u.hp > 0)) return;
      gainGauge(u, C.laguzGauge.damageGain);
      if (combo === 0) transformNow(u);
    };

    function hitRoll(rate) {
      const r = C.useTwoRandomHit ? (rng.int(0, 99) + rng.int(0, 99)) / 2 : rng.int(0, 99);
      return r < rate;
    }

    // 1発の攻撃
    function strike(att, def, opts = {}) {
      const c = calc(att, def);
      const label = opts.label || "攻撃";
      const lead = `${att.name}の${label}!`;
      if (!hitRoll(c.hit)) {
        push({ type: "miss", actor: att.side, target: def.side, lead, result: "ミス!", text: `${lead}……ミス!` });
        return;
      }
      if (hasSkill(def, att, "翼の守護") && sklRoll(def, att)) {
        skillUp(def, "翼の守護", "攻撃を無効にした");
        return;
      }
      if (att.weapon.selfDamage && rng.percent(Math.max(0, 20 - curStats(att, def).lck))) {
        const dealt = damageTo(att, att.weapon.might);
        push({ type: "self", actor: att.side, target: att.side, damage: dealt, text: `${att.name}の${att.weapon.name}が暴発!自分に${dealt}ダメージ` });
        return;
      }
      // 『女神の加護』(v1.3.4):ダメージを受けない(最初の1回だけ発動の演出を出す)
      if (goddessGuards(def, att)) {
        if (!def.goddessShown) { def.goddessShown = true; skillUp(def, "女神の加護", "ダメージを無効にした"); }
        const result = `${def.name}にダメージを与えられない!`;
        push({ type: "hit", actor: att.side, target: def.side, damage: 0, dealt: 0, crit: false, guarded: true, lead, result, text: `${lead}${result}` });
        return;
      }
      if (hasSkill(att, def, "瞬殺") && rng.percent(Math.floor(curStats(att, def).skl / 2))) {
        skillUp(att, "瞬殺");
        const dealt = damageTo(def, def.hp);
        push({ type: "hit", actor: att.side, target: def.side, damage: dealt, crit: true, instantKill: true, lead, result: `${def.name}は一撃で倒された!`, text: `${lead}${def.name}は一撃で倒された!` });
        return;
      }

      const isCrit = rng.int(0, 99) < c.crit;
      let atk = c.atk;
      let defense = c.defense;
      if (opts.luna || (hasSkill(att, def, "月光") && sklRoll(att, def))) {
        defense = Math.floor(defense / 2);
        if (!opts.luna) skillUp(att, "月光", "相手の防御が半分に");
      }
      if (att.weapon.isMagic && hasSkill(att, def, "陽光") && sklRoll(att, def)) {
        defense = Math.floor(defense / 2);
        skillUp(att, "陽光", "相手の魔防が半分に");
      }
      if (hasSkill(att, def, "鳴動") && curStats(att, def).con >= curStats(def, att).con && sklRoll(att, def)) {
        atk += curStats(att, def).con;
        skillUp(att, "鳴動", "攻撃力アップ");
      }
      // 『衝撃』(v1.3.4):守備の値を攻撃力に加える
      if (hasSkill(att, def, "衝撃") && sklRoll(att, def)) {
        atk += curStats(att, def).def;
        skillUp(att, "衝撃", "守備の重みを乗せた一撃");
      }
      let damage = finalDamage(atk, defense, c, isCrit);
      if (opts.half) damage = Math.floor(damage / 2);
      if (damage >= def.hp && def.hp > 0 && hasSkill(def, att, "祈り")) {
        damage = Math.floor(damage / 2);
        skillUp(def, "祈り", "ダメージが半分に");
      }
      const dealt = damageTo(def, damage);
      // v1.3.3:HPが0になる攻撃でも、表示は本来与えるダメージ(dealt は実際に減ったHP)
      const result = `${c.effective ? "特効!" : ""}${def.name}に${damage}ダメージ!`;
      push({
        type: "hit", actor: att.side, target: def.side, damage, dealt, crit: isCrit, effective: c.effective,
        lead, result, text: `${lead}${isCrit ? "必殺の一撃!" : ""}${result}`,
      });
      hurtGauge(def, dealt); // 化身するならダメージの後に出す

      // 吸収(リザイア・ルーンソード・太陽)
      let drain = att.weapon.drain || opts.sol;
      if (!drain && hasSkill(att, def, "太陽") && dealt > 0 && sklRoll(att, def)) {
        skillUp(att, "太陽");
        drain = true;
      }
      if (drain && dealt > 0 && att.hp > 0) {
        const h = heal(att, dealt);
        if (h > 0) push({ type: "heal", actor: att.side, target: att.side, amount: h, text: `${att.name}はHPを${h}回復` });
      }
      // ポイズン・燃焼
      if (att.weapon.status && def.hp > 0) {
        const already = def.status && def.status.name === att.weapon.status;
        def.status = { name: att.weapon.status, turns: C.statusEffect.turns }; // かかっていたら効果時間を延ばす
        if (!already) push({ type: "status-add", actor: att.side, target: def.side, text: `${def.name}は${att.weapon.status}状態になった` });
      }
      // 『狙撃』の睡眠(v1.3.4):技÷2の確率。眠っている間は攻撃できず、回避0
      if (def.hp > 0 && !def.sleep && hasSkill(att, def, "狙撃") && rng.percent(Math.floor(curStats(att, def).skl / C.sleep.chanceDiv))) {
        def.sleep = { turns: C.sleep.turns, round };
        skillUp(att, "狙撃", "相手を眠らせた");
        push({ type: "sleep", actor: att.side, target: def.side, forecast: fc(), text: `${def.name}は眠ってしまった!` });
      }
      // 『武器破壊』(v1.3.4):技÷2の確率。ラグズの武器は対象外
      if (def.hp > 0 && !def.broken && def.weapon.category !== "laguz" && hasSkill(att, def, "武器破壊") && rng.percent(Math.floor(curStats(att, def).skl / C.weaponBreak.chanceDiv))) {
        const name = def.weapon.name;
        breakWeapon(def);
        skillUp(att, "武器破壊", `${name}を破壊した`);
        push({ type: "break", actor: att.side, target: def.side, forecast: fc(), text: `${def.name}の${name}は威力と効果を失った!` });
      }
      // カウンター
      if (dealt > 0 && def.hp > 0 && hasSkill(def, att, "カウンター") && !goddessGuards(att, def) && sklRoll(def, att)) {
        skillUp(def, "カウンター");
        const backDamage = Math.floor(dealt / 2);
        const back = damageTo(att, backDamage);
        push({ type: "hit", actor: def.side, target: att.side, damage: backDamage, dealt: back, lead: "カウンター!", result: `${att.name}に${backDamage}ダメージ!`, text: `カウンター!${att.name}に${backDamage}ダメージ!` });
        hurtGauge(att, back);
      }
    }

    // 「攻撃」1回ぶん(勇者武器なら2連続、スキル『流星』『天空』など)
    function strikeSet(att, def) {
      if (hasSkill(att, def, "流星") && sklRoll(att, def)) {
        skillUp(att, "流星", "5回連続攻撃");
        comboStart();
        for (let i = 0; i < 5 && !dead(); i++) strike(att, def, { half: true, label: `流星${i + 1}撃目` });
        comboEnd();
        return;
      }
      if (hasSkill(att, def, "天空") && sklRoll(att, def)) {
        skillUp(att, "天空");
        comboStart();
        strike(att, def, { sol: true, label: "太陽の一撃" });
        if (!dead()) strike(att, def, { luna: true, label: "月光の一撃" });
        comboEnd();
        return;
      }
      strike(att, def);
      if (!dead() && hasSkill(att, def, "疾風の刃") && sklRoll(att, def)) {
        skillUp(att, "疾風の刃", "風の刃が飛ぶ");
        comboStart();
        windBlade(att, def);
        comboEnd();
      }
    }

    // 『疾風の刃』(v1.3.4):ウインドの効果(飛行系に特効)を持つ魔法攻撃を追加で行う。
    // 攻撃力 = 力・魔力の大きいほう + 装備している武器の威力(化身前のラグズは0)。相手の魔防で計算
    function windBlade(att, def) {
      const saved = att.weapon;
      const wind = DB.weapons["wind:ウインド"];
      const might = saved.category === "laguz" && isHuman(att) ? 0 : saved.might;
      att.weapon = { ...wind, name: "疾風の刃", might, isMagic: true, windBlade: true, statBonus: {}, critBonus: 0, avoidBonus: 0, weaponSkill: null };
      strike(att, def, { label: "疾風の刃" });
      att.weapon = saved;
    }

    function attack(att, def) {
      if (dead()) return;
      if (att.sleep) {
        push({ type: "asleep", actor: att.side, text: `${att.name}は眠っていて動けない!` });
        return;
      }
      if (att.cancelNext) {
        att.cancelNext = false;
        push({ type: "cancel", actor: att.side, text: `${att.name}の攻撃は無効にされた!` });
        return;
      }
      if (hasSkill(att, def, "キャンセル") && sklRoll(att, def)) {
        def.cancelNext = true;
        skillUp(att, "キャンセル", "相手の次の攻撃を無効にする");
      }
      const reps = att.weapon.brave ? 2 : 1;
      for (let i = 0; i < reps && !dead(); i++) strikeSet(att, def);
      if (!dead() && hasSkill(att, def, "連続") && sklRoll(att, def)) {
        skillUp(att, "連続", "もう一度攻撃");
        comboStart();
        for (let i = 0; i < reps && !dead(); i++) strikeSet(att, def);
        comboEnd();
      }
    }

    let first = null;
    let firstR1 = null;
    let round = 0;
    let drawText = `${C.maxRounds}ラウンドで決着がつかず、引き分け`;
    let quietRounds = 0;
    while (!dead() && round < C.maxRounds) {
      round++;
      // 先攻の決定
      const lp = hasPriority(left, right), rp = hasPriority(right, left);
      let reason = "";
      if (round === 1) {
        const d = opts.firstSide ? { side: opts.firstSide, reason: opts.firstReason || "" } : decideFirst(left, right, rng);
        first = units[d.side];
        reason = d.reason;
        firstR1 = first;
      } else if (lp && !rp) { first = left; reason = priorityReason(left); }
      else if (rp && !lp) { first = right; reason = priorityReason(right); }
      else if (lp && rp) { first = rng.next() < 0.5 ? left : right; reason = "(先攻効果が重なったためランダム)"; }
      else {
        // v1.3.4:R1の先攻側(A)、R2はもう一方(B)、以後交互(A,B,A,B…)
        first = round % 2 === 1 ? firstR1 : other(firstR1);
      }
      const second = other(first);
      push({ type: "round", round, first: first.side, text: `── ラウンド${round} ── ${first.name}の先攻${reason}` });
      const hpBefore = left.hp + right.hp;

      // ラウンド1開始時:化身前のラグズはゲージ+4。20なら開幕から化身
      if (round === 1) {
        for (const u of [first, second]) {
          if (!u.laguz) continue;
          if (roundOneStart(u)) pushTransform(u);
          else push({ type: "gauge", actor: u.side, quiet: true, text: `${u.name}の化身ゲージ:${u.laguz.gauge}` });
        }
      }

      // 『能力勝負』(v1.3.4):最初に知らせる
      if (round === 1 && statsDuel(left, right)) {
        const owner = [first, second].find((u) => hasSkill(u, other(u), "能力勝負"));
        skillUp(owner, "能力勝負", "お互いのスキルとバイオリズムが無効に", { forecast: fc() });
      }

      // ラウンド開始時のスキル(v1.3.4):地の祝福・空の祝福・咆哮
      for (const u of [first, second]) {
        if (dead()) break;
        const foe = other(u);
        if (hasSkill(u, foe, "地の祝福") && (u.status || u.sleep)) {
          u.status = null; u.sleep = null;
          skillUp(u, "地の祝福", "状態異常が治った", { forecast: fc() });
        }
        if (hasSkill(u, foe, "空の祝福") && u.hp < u.maxHp) {
          const h = heal(u, Math.floor(u.maxHp * C.skyBlessingPercent / 100));
          skillUp(u, "空の祝福", `HPを${h}回復`, { heal: h });
        }
        if (hasSkill(u, foe, "咆哮") && foe.roarStacks < C.roar.maxStacks && sklRoll(u, foe)) {
          if (hasSkill(foe, u, "護り手")) {
            if (!foe.guardShown) {
              foe.guardShown = true;
              skillUp(u, "咆哮");
              skillUp(foe, "護り手", "能力が下がらない");
            }
          } else {
            foe.roarStacks++;
            for (const k of C.roar.stats) foe.debuff[k] = (foe.debuff[k] || 0) - C.roar.amount;
            skillUp(u, "咆哮", `${foe.name}の力・魔力・速さ-${C.roar.amount}`, { target: foe.side, forecast: fc() });
          }
        }
      }

      // 状態異常(ポイズン・燃焼)
      for (const u of [first, second]) {
        if (dead() || !u.status) continue;
        if (goddessGuards(u, other(u))) continue; // 女神の加護:継続ダメージも受けない
        const dmg = Math.max(1, Math.floor(u.maxHp * (C.statusEffect.percent[u.status.name] || 8) / 100));
        const dealt = damageTo(u, dmg);
        push({ type: "status", target: u.side, damage: dealt, text: `${u.status.name}の効果!${u.name}に${dealt}ダメージ` });
        u.status.turns--;
        if (u.status.turns <= 0) u.status = null;
      }

      attack(first, second);
      attack(second, first);
      if (!dead() && calc(first, second).doubles) attack(first, second);
      if (!dead() && calc(second, first).doubles) attack(second, first);

      // 『回復』
      for (const u of [first, second]) {
        if (dead() || !hasSkill(u, other(u), "回復") || u.hp >= u.maxHp) continue;
        const h = heal(u, Math.floor(u.maxHp / 10));
        skillUp(u, "回復", `HPを${h}回復`);
        events[events.length - 1].heal = h;
      }

      // 睡眠(v1.3.4):眠ったラウンドは数えず、次のラウンドから数えて turns ラウンド目の終了時に目覚める
      for (const u of [first, second]) {
        if (dead() || !u.sleep || u.sleep.round === round) continue;
        if (--u.sleep.turns <= 0) {
          u.sleep = null;
          push({ type: "wake", actor: u.side, forecast: fc(), text: `${u.name}は目を覚ました` });
        }
      }

      // 化身ゲージ(ラウンド終了時):化身中は-5(0で化身が解ける)、化身前は+4(20で化身)
      for (const u of [first, second]) {
        if (dead() || !u.laguz) continue;
        if (u.laguz.transformed) {
          // v1.3.3:化身したラウンド(開幕・その場での化身を含む)の終了時は減らない
          if (u.laguz.transformedRound === round) {
            push({ type: "gauge", actor: u.side, quiet: true, text: `${u.name}の化身ゲージ:${u.laguz.gauge}(化身したラウンドは減らない)` });
            continue;
          }
          u.laguz.gauge = Math.max(0, u.laguz.gauge - C.laguzGauge.decay);
          if (u.laguz.gauge === 0) {
            u.laguz.transformed = false;
            push({ type: "revert", actor: u.side, forecast: fc(), text: `${u.name}の化身が解けた!` });
            continue;
          }
        } else {
          gainGauge(u, C.laguzGauge.roundGain);
          if (transformIfFull(u)) { pushTransform(u); continue; }
        }
        push({ type: "gauge", actor: u.side, quiet: true, text: `${u.name}の化身ゲージ:${u.laguz.gauge}` });
      }

      // 決着がつかない状態なら引き分け
      if (dead()) break;
      quietRounds = left.hp + right.hp === hpBefore && !left.status && !right.status ? quietRounds + 1 : 0;
      if (quietRounds >= C.stalemateRounds) {
        drawText = `${C.stalemateRounds}ラウンドお互いにHPが減らなかったため、引き分け`;
        break;
      }
    }

    let winner = "draw";
    if (left.hp <= 0) winner = "right";
    else if (right.hp <= 0) winner = "left";
    push({
      type: "end", winner,
      text: winner === "draw" ? drawText : `${units[winner].name}の勝利!`,
    });
    return { events, winner };
  }

  global.Battle = { makeUnit, cloneUnit, previewRoundOne, calc, forecast, bonusSummary, transformPlan, simulate, decideFirst, triangle, attackSpeed, biorhythmMod, drawSkill, skillPool, statsDuel };
})(window);
