// バトルの計算式と、自動戦闘の進行。式はすべてこのファイルにまとめてある(仕様書 4-2)。
(function (global) {
  "use strict";
  const C = global.Config;
  const DB = global.GameDB;

  // ---- 戦闘ユニットを作る ----
  // char: 保存されたキャラ / weaponId: その対戦で使う武器
  function makeUnit(char, weaponId, side) {
    // v1.4.3:印のついた武器は、印の分だけ武器の数値が変わる
    const weapon = DB.withMark(DB.weapons[weaponId], char.marks && char.marks[weaponId]);
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
      extraSkills: [],    // v1.6.0:2つ目以降のスキル(アーケードの追加スキル・イナの回復/祈り/地の祝福)
      status: null,       // { name, turns }
      sleep: null,        // v1.3.4 睡眠 { turns, round }
      debuff: {},         // v1.3.4 咆哮などで下がった能力値 { str: -3, ... }
      buff: {},           // v1.6.5 『盗む』のドーピングで上がった能力値 { str: 2, ... }(安定・地の祝福でも消えない)
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
      // v1.6.0:gaugeStart があればその値(アーケードのイナは0。幸運は使わない)
      const start = char.gaugeStart != null ? char.gaugeStart : human.lck + bonus;
      u.laguz = { gauge: Math.min(C.laguzGauge.max, start), transformed: false, humanStats: human };
      // v1.6.1:ずっと化身している(アーケードのなりそこないの赤竜)。ゲージは減らない
      if (char.alwaysTransformed) u.laguz.fixed = true;
    }
    // v1.6.1:手加減(アイクモード11体目の漆黒の騎士)。2回攻撃しない・必殺が出ない
    if (char.holdBack) { u.holdBack = true; u.weapon = { ...u.weapon, noCrit: true }; u.equip = u.weapon; }
    // v1.6.2:倒されると、その場で別の姿になって戦いが続く(アイクモード21体目のアシュナード)
    if (char.phase2) u.phase2 = char.phase2;
    return u;
  }

  function cloneUnit(u) {
    const c = makeUnit(u.char, u.weapon.id, u.side);
    c.bio = u.bio;
    c.skill = u.skill;
    c.extraSkills = (u.extraSkills || []).slice();
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
    return u.skill === name || u.weapon.weaponSkill === name || !!(u.extraSkills && u.extraSkills.includes(name));
  }

  // v1.6.4:『衝撃』の麻痺。麻痺している間は、スキル(武器スキルも)が働かない(兵種スキルは働く)
  const owns = (u, name) => !u.paralysis && isSkillOwner(u, name);

  // 『能力勝負』が効いているか(v1.3.4)。どちらかが持っていて、相手に『見切り』で消されていなければ有効
  // v1.6.4:『能力勝負』と相手の『見切り』は相殺(どちらも働かない。ほかのスキルはお互いに働く)
  function statsDuel(a, b) {
    if (!a || !b) return false;
    const on = (x, y) => owns(x, "能力勝負") && !owns(y, "見切り");
    return on(a, b) || on(b, a);
  }
  // v1.6.4:x の『能力勝負』と y の『見切り』が相殺しあっているか
  const cancelOut = (x, y) => !!x && !!y && owns(x, "能力勝負") && owns(y, "見切り");

  // スキルが有効か(武器スキルも含む。相手の『見切り』、どちらかの『能力勝負』で無効になる)
  function hasSkill(u, enemy, name) {
    if (!owns(u, name)) return false;
    if (enemy && name === "見切り" && cancelOut(enemy, u)) return false; // v1.6.4:相殺
    if (enemy && name !== "見切り" && owns(enemy, "見切り") && !cancelOut(u, enemy)) return false;
    if (enemy && name === "能力勝負" && cancelOut(u, enemy)) return false;
    if (name !== "能力勝負" && statsDuel(u, enemy)) return false;
    return true;
  }

  // 『女神の加護』が効いているか(v1.3.4)。def が持っていて、att が対象外(エタルド・ラグネル・王族のラグズ・赤竜)でないとき
  function goddessExempt(att) {
    const ex = C.goddessExempt;
    return ex.weapons.includes((att.equip || att.weapon).name) || ex.classes.includes(att.className);
  }
  // v1.6.1:『エンブラの加護』(漆黒の騎士)は女神の加護と同じ効果
  const goddessName = (u, enemy) => (hasSkill(u, enemy, "女神の加護") ? "女神の加護" : hasSkill(u, enemy, "エンブラの加護") ? "エンブラの加護" : null);
  function goddessGuards(def, att) {
    return !!goddessName(def, att) && !goddessExempt(att);
  }

  // 怒り・勇将の発動中か(HPが半分以下)。発動しているスキル名 or null
  function rageSkill(u, enemy) {
    return rageSkills(u, enemy)[0] || null;
  }
  // v1.6.4:発動している怒り・勇将のすべて(両方持っていれば両方)
  function rageSkills(u, enemy) {
    if (u.hp <= 0 || u.hp * 2 > u.maxHp) return [];
    return C.rageSkills.filter((n) => hasSkill(u, enemy, n));
  }

  // スキルの抽選(v1.3.4):陽光は魔法系の武器を使うときだけ。女神の加護は v1.7.1 から出ない(Config.noRouletteSkills)
  // v1.4.5:兵種スキル(俊足)は抽選に出ない。エリートはベオク(上級職があるとき)だけ
  // v1.5.0:武器スキルと同じスキルは抽選に出ない(かぶらないように)
  // v1.6.3:使える・使えないの判定は DB.skillFits にまとめた(翼の守護はタカ・カラスだけ、大盾はそれ以外のラグズだけ)
  function skillPool(u) {
    const ws = u && u.weapon && u.weapon.weaponSkill;
    const who = u ? { race: u.laguz || (u.char && u.char.race === "ラグズ") ? "ラグズ" : "ベオク", className: u.className, magic: !!u.weapon.isMagic } : { race: "ベオク", className: "", magic: false };
    return DB.skills.filter((s) => !(ws && s.name === ws) && DB.skillFits(s, who));
  }
  // v1.6.5:exclude に入っているスキルは出さない(アイクモードの敵)
  // v1.7.1:女神の加護はスキルルーレット(抽選)に出ない(ガトー指示。Config.noRouletteSkills)
  function drawSkill(u, rng, exclude) {
    const no = C.noRouletteSkills || [];
    const pool = skillPool(u).filter((s) => !(exclude && exclude.includes(s.name)) && !no.includes(s.name));
    const total = pool.reduce((a, s) => a + (s.weight ?? 1), 0);
    let r = rng.next() * total;
    for (const s of pool) { r -= s.weight ?? 1; if (r < 0) return s.name; }
    return pool[pool.length - 1].name;
  }

  const isHuman = (u) => !!(u.laguz && !u.laguz.transformed);

  // v1.4.5:兵種スキルの効果(俊足:回避+20・速さ+3)。見切りでは消えない(兵種スキルは常に有効)
  function classEffect(u) {
    const name = DB.classSkillOf(u.className);
    return (name && C.classSkillEffects && C.classSkillEffects[name]) || {};
  }

  // 化身前後の能力値(勇将・咆哮などは含まない)。v1.4.5:兵種スキルの速さ+3 はここに含める
  function formStats(u) {
    const s = { ...(u.laguz && !u.laguz.transformed ? u.laguz.humanStats : u.stats) };
    const ce = classEffect(u);
    if (ce.spd) s.spd += ce.spd;
    return s;
  }
  // 化身・『勇将』・下がった能力(咆哮)込みの、今の能力値
  function curStats(u, enemy) {
    const s = formStats(u);
    // v1.4.5:大器晩成(4ラウンド目から体格以外+3。HPは発動したときに最大HPと今のHPに足す)
    if (u.lateBloom && hasSkill(u, enemy, "大器晩成")) {
      for (const k of DB.STAT_KEYS) if (k !== "hp") s[k] += C.lateBloomer.amount;
    }
    // v1.6.3:『手加減』。v1.6.4:技・速さ+5(HPも+5。戦いの始めに最大HPと今のHPに足す)。ほかの能力値は上がらない
    if (hasSkill(u, enemy, "手加減")) {
      for (const k of C.mercy.stats) if (k !== "hp") s[k] += C.mercy.amount;
    }
    if (hasSkill(u, enemy, "勇将") && u.hp * 2 <= u.maxHp) {
      for (const k of ["str", "skl", "spd"]) s[k] = Math.floor(s[k] * 1.5);
    }
    // v1.6.5:『盗む』で盗んだドーピングアイテム(戦闘中ずっと)
    for (const [k, v] of Object.entries(u.buff || {})) s[k] = (s[k] || 0) + v;
    if (!hasSkill(u, enemy, "安定")) { // v1.4.3:安定は下がった能力を受けない
      for (const [k, v] of Object.entries(u.debuff || {})) s[k] = Math.max(0, s[k] + v);
    }
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

  // 『護り手』『安定』(v1.4.3):相手のスキル・武器の効果で能力などが下がらない
  function resistsDown(u, enemy) {
    return hasSkill(u, enemy, "護り手") || hasSkill(u, enemy, "安定");
  }

  // v1.5.0:属性の不利(炎<水<雷<風<炎、光⇔闇。天・地はなし)。不利な側は属性の補正が無効
  // v1.7.2:3on3で属性を受け継ぐと、属性を2つ持つ(char.element2)。属性ごとに不利を見て、効く分だけ足す
  const elementsOf = (char) => (char ? [char.element, char.element2].filter((x, i, a) => x && a.indexOf(x) === i) : []);
  const weakOne = (element, enemy) => elementsOf(enemy.char).some((x) => (C.elementWeakTo[element] || []).includes(x));
  function elementWeak(u, enemy) {
    if (!u || !enemy || !u.char || !enemy.char) return false;
    const mine = elementsOf(u.char);
    return mine.length > 0 && mine.every((x) => weakOne(x, enemy));
  }
  const NO_ELEM = { attack: 0, hit: 0, avoid: 0, defense: 0 };
  const ELEM_KEYS = ["attack", "hit", "avoid", "defense"];

  // 属性の補正(v1.4.3:『気分屋』でバイオリズムが好調なら倍)
  function elemOf(u, enemy) {
    if (elementWeak(u, enemy)) return NO_ELEM;
    if (statsDuel(u, enemy)) return NO_ELEM; // v1.6.4:『能力勝負』はお互いの属性も無効
    let e = u.elem;
    // v1.7.2:属性が2つのときは、不利でないほうの属性の補正を足す
    if (u.char && u.char.element2 && enemy && enemy.char) {
      e = { ...NO_ELEM };
      for (const x of elementsOf(u.char)) {
        if (weakOne(x, enemy)) continue;
        const b = DB.elementBonus[x] || NO_ELEM;
        for (const k of ELEM_KEYS) e[k] += b[k] || 0;
      }
    }
    if (!(hasSkill(u, enemy, "気分屋") && u.bio && u.bio.name === "好調")) return e;
    return { attack: e.attack * 2, hit: e.hit * 2, avoid: e.avoid * 2, defense: e.defense * 2 };
  }

  // 3すくみの、実際に効く値(v1.4.3:『安定』は不利の-1を受けない)
  function triangleFor(u, enemy) {
    const t = triangle(u.weapon, enemy.weapon);
    return t < 0 && hasSkill(u, enemy, "安定") ? 0 : t;
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
    // v1.4.4:手斧・手槍系の「相手の攻速-2」は廃止(ダメージを与えると相手の速さ-1 に変更。strike で処理)
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
    const triEff = triangleFor(att, def); // 実際に効く3すくみ(安定は不利を受けない)
    const effective = DB.isEffective(w, def.className);
    const eA = elemOf(att, def), eD = elemOf(def, att);

    // ダメージ
    // ラグズの化身前は、爪・くちばし・ブレスの威力が0
    // v1.3.4(ガトー指定):攻撃力 = 力(魔法は魔力)+ 武器の威力 + 3すくみ。防御力 = 守備(魔法は魔防)
    // 特効は(攻撃力−防御力)を2倍。属性の補正はその後に足し引きする(finalDamage)
    const baseMight = w.category === "laguz" && isHuman(att) ? 0 : w.might;
    const might = baseMight + triEff * C.triangleMight; // 3すくみ込みの武器の威力
    // 疾風の刃(v1.3.4):力・魔力の大きいほうで魔法攻撃
    const atkStat = w.windBlade ? Math.max(a.str, a.mag) : w.isMagic ? a.mag : a.str;
    // v1.6.3:『鳴動』体格が相手以上なら、必ず自分の体格を攻撃力に足す(予測にも入る)
    const rumble = hasSkill(att, def, "鳴動") && a.con >= d.con ? a.con : 0;
    const atk = atkStat + might + rumble;
    const defense = w.isMagic ? d.res : d.def;

    // 命中
    const bioA = biorhythmMod(att, def), bioD = biorhythmMod(def, att);
    let hit = w.hit + a.skl * 2 + a.lck + bioA.hit + triEff * C.triangleHit + eA.hit;
    if (hasSkill(att, def, "千里眼")) hit += 20;
    // 『護り手』(v1.3.4)は、相手のスキルで能力・命中・必殺が下がらない(v1.4.3:『安定』も)
    const guarded = resistsDown(att, def);
    // v1.7.1:3on3では、チームのだれか(生きている控えも)が『恐怖』を持っていれば、相手のキャラ全員に効く(teamFear)
    const fear = hasSkill(def, att, "恐怖") || (!!def.teamFear && !owns(att, "見切り") && !statsDuel(def, att));
    if (fear && !guarded) hit -= 10;
    if (hasSkill(def, att, "挑発") && !guarded) hit -= C.taunt.hit; // v1.6.3
    if (hasSkill(att, def, "狙撃")) hit *= 2;

    // 回避
    let avoid = attackSpeed(def, att) * 2 + d.lck + bioD.avoid + eD.avoid + def.weapon.avoidBonus;
    if (hasSkill(def, att, "順風耳")) avoid += 20;
    avoid += classEffect(def).avoid || 0; // v1.4.5:俊足
    if (def.sleep) avoid = 0; // 睡眠中は回避0(v1.3.4)

    // 必殺
    let crit = 0;
    if (!w.noCrit) {
      crit = w.crit + Math.floor(a.skl / 2) + w.critBonus + bioA.crit + classCrit(att);
      if (hasSkill(att, def, "怒り") && att.hp * 2 <= att.maxHp) crit += 50;
      if (fear && !guarded) crit -= 10;
      if (hasSkill(def, att, "挑発")) crit += C.taunt.crit; // v1.6.5:『挑発』相手(挑発された側)の必殺+5
    }
    let critAvoid = d.lck;
    // 『一発屋』(v1.4.3):当たれば必ず必殺(必殺が出ない武器は除く)
    const oneShot = hasSkill(att, def, "一発屋");
    if (oneShot && !w.noCrit) { crit = 100; critAvoid = 0; }
    // 『護り手』(v1.4.3):相手の必殺を無効にする
    if (hasSkill(def, att, "護り手")) crit = 0;
    // v1.6.3:ラグネル・エタルドを装備した相手には必殺が出ない(原作再現)
    if (def.weapon.critGuard) crit = 0;
    // 『一発屋』(v1.3.4):回避を引いた後の命中率を半分に(v1.4.3:護り手を持っていれば半分にならない)
    let finalHit = clamp(hit - avoid);
    if (oneShot && !hasSkill(att, def, "護り手")) finalHit = Math.floor(finalHit * C.oneShot.hitRate);
    // 『女神の加護』:ダメージ0・必殺なし
    const goddess = goddessGuards(def, att);

    const as = attackSpeed(att, def);
    const enemyAs = attackSpeed(def, att);
    // v1.4.3:『安定』を持つ相手には追撃できない
    // v1.6.1:holdBack(アイクモード11体目の漆黒の騎士)は2回攻撃しない
    const doubles = as - enemyAs >= C.doubleAttackThreshold && !hasSkill(def, att, "安定") && !att.holdBack;
    const hits = w.brave ? 2 : 1;
    return {
      atk, defense, might, tri, effective, rumble,
      elemAtk: eA.attack, elemDef: eD.defense,
      damage: goddess ? 0 : finalDamage(atk, defense, { effective, elemAtk: eA.attack, elemDef: eD.defense }, false),
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
  // ※スキルは対戦開始時に決まるので含めない(v1.4.3:千里眼・順風耳・気分屋の属性倍は含める)
  function bonusSummary(u, enemy) {
    const b = biorhythmMod(u, enemy);
    const w = u.weapon, ew = enemy.weapon;
    const tri = triangleFor(u, enemy);
    const el = elemOf(u, enemy);
    const sb = w.statBonus || {};
    // v1.3.4:戦闘中に変わる分(怒り・勇将の発動、咆哮で下がった能力)も含める
    const now = curStats(u, enemy), form = formStats(u);
    const dv = (k) => (now[k] || 0) - (form[k] || 0);
    // 攻撃の補正:3すくみ・属性・武器の能力値+・戦闘中の変化。特効(ダメージ2倍)は「⚠特効」の印で表す
    const key = w.isMagic ? "mag" : "str";
    // v1.6.3:俊足の速さ+3(回避+6)、鳴動(攻撃+体格)、挑発(命中-5・幸運-5)、影(回避+10)も補正に入れる
    const ce = classEffect(u);
    const rumble = hasSkill(u, enemy, "鳴動") && now.con >= curStats(enemy, u).con ? now.con : 0;
    const taunted = hasSkill(enemy, u, "挑発") && !resistsDown(u, enemy) ? C.taunt.hit : 0;
    const tauntCrit = hasSkill(enemy, u, "挑発") && !w.noCrit ? C.taunt.crit : 0; // v1.6.5:相手の挑発で自分の必殺+5
    return {
      attack: el.attack + tri * C.triangleMight + (sb[key] || 0) + dv(key) + rumble,
      defense: el.defense + (ew.isMagic ? sb.res || 0 : sb.def || 0),
      hit: el.hit + b.hit + tri * C.triangleHit + (sb.skl || 0) * 2 + (sb.lck || 0) + dv("skl") * 2 + dv("lck") + (hasSkill(u, enemy, "千里眼") ? 20 : 0) - taunted,
      avoid: el.avoid + b.avoid + (w.avoidBonus || 0) + (sb.lck || 0) + dv("spd") * 2 + dv("lck") + (hasSkill(u, enemy, "順風耳") ? 20 : 0) + (ce.avoid || 0) + (ce.spd || 0) * 2,
      crit: b.crit + (w.critBonus || 0) + classCrit(u) + Math.floor((sb.skl || 0) / 2) + (Math.floor(now.skl / 2) - Math.floor(form.skl / 2)) + (rageSkills(u, enemy).includes("怒り") && !w.noCrit ? 50 : 0) + tauntCrit,
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
      // v1.6.3:威力0 → 威力半分(切り捨て)
      ...w, might: Math.floor(w.might / 2), broken: true, effectiveTargets: [], brave: false, drain: false, status: null,
      alwaysFirst: false, critBonus: 0, avoidBonus: 0, statBonus: {}, selfDamage: false, weaponSkill: null, spdDownOnHit: 0, critGuard: false, statDown: null,
    };
    u.broken = true;
  }

  // v1.4.5:エリート。上級職へクラスチェンジ(Lv1)。
  // 能力値 = 今の能力値 +(上級職の基本値 − 今の職業の基本値)。上限は上級職の上限(武器の能力値+の分は上限に足す)。体格はそのまま
  function promote(u) {
    const p = DB.promotionOf(u.className);
    if (!p) return null;
    const sb = u.weapon.statBonus || {};
    const before = { ...u.stats };
    for (const k of DB.STAT_KEYS) {
      const v = u.stats[k] + (p.base[k] - p.from[k]);
      u.stats[k] = Math.max(u.stats[k], Math.min(v, p.max[k] + (sb[k] || 0)));
    }
    const from = u.className;
    u.className = p.name;
    u.level = 1;
    u.maxHp = u.stats.hp;
    u.hp += u.stats.hp - before.hp;
    const up = Object.fromEntries(DB.STAT_KEYS.map((k) => [k, u.stats[k] - before[k]]));
    return { from, to: p.name, up };
  }

  // v1.6.3:『援軍』のキャラ。ペガサスナイト Lv10・手槍(5%でファルコンナイト Lv1・ぎんの槍)。能力値はランダム
  //   能力値 = 職業の基本値 + 個人差(キャラ作成と同じ 0〜2、HPは0〜3)、ペガサスナイトはそこから成長率(±10)で Lv15 まで上げる
  // v1.6.7:ファルコンナイト(12%)は、ペガサスナイトを Lv20 まで上げてからクラスチェンジした強さ(Lv1)
  function reinforcementChar(rng) {
    const R = C.reinforcement;
    const falcon = rng.percent(R.falconPercent);
    const pk = DB.classByName[R.className];
    const p = DB.promotionOf(R.className);
    const base = pk.base, max = pk.max;
    const stats = {}, growth = {};
    for (const k of DB.STAT_KEYS) {
      stats[k] = Math.min(base[k] + rng.int(0, k === "hp" ? C.personalBaseMax + 1 : C.personalBaseMax), max[k]);
      growth[k] = Math.max(5, pk.growth[k] + rng.int(C.personalGrowthRange[0], C.personalGrowthRange[1]));
    }
    const grow = falcon ? R.falconFromLevel : R.level;
    for (let lv = 1; lv < grow; lv++) {
      for (const k of DB.STAT_KEYS) {
        const g = growth[k];
        stats[k] = Math.min(stats[k] + Math.floor(g / 100) + (rng.percent(g % 100) ? 1 : 0), max[k]);
      }
    }
    // クラスチェンジ:上級職の基本値 − ペガサスナイトの基本値 を足す(上限は上級職の上限)
    if (falcon && p) for (const k of DB.STAT_KEYS) stats[k] = Math.max(stats[k], Math.min(stats[k] + (p.base[k] - p.from[k]), p.max[k]));
    const level = falcon ? R.falconLevel : R.level;
    const rn = global.RandomChar && global.RandomChar.randomName;
    const elements = Object.keys(DB.elementBonus);
    const weapon = falcon ? R.falconWeapon : R.weapon;
    return {
      id: "reinforcement", reinforcement: true, name: rn ? rn("女", () => rng.next()) : "ペガサス", gender: "女", race: "ベオク",
      level, arcadeLv: level, className: falcon ? (p ? p.name : "ファルコンナイト") : R.className, moveType: "飛行",
      element: elements[rng.int(0, elements.length - 1)], kanjiType: "", colorHex: falcon ? "#e8e8ee" : "#7ec8e3",
      growth, weapons: [weapon], weapon, marks: {}, stats: { ...stats, con: pk.con }, maxStats: { ...(falcon && p ? p.max : max) },
    };
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
      const st = (u) => [u.status && u.status.name, u.sleep && "睡眠", u.paralysis && "麻痺"].filter(Boolean).join("・") || null;
      e.status = { left: st(left), right: st(right) };
      e.laguz = { left: gaugeOf(left), right: gaugeOf(right) };
      e.rage = { left: left.rageOn, right: right.rageOn };
      e.broken = { left: left.broken, right: right.broken };
      // v1.4.5:エリート・大器晩成で最大HP・職業が変わるので、毎回入れておく
      e.maxHp = { left: left.maxHp, right: right.maxHp };
      e.className = { left: left.className, right: right.className };
      if (e.forecast) e.bonus = { left: bonusSummary(left, right), right: bonusSummary(right, left) };
      if (e.target && units[e.target].hp <= 0 && (e.type === "hit" || e.type === "self" || e.type === "status")) e.finishing = true;
      events.push(e);
      if (e.type !== "rage") checkRage();
    };
    // 怒り・勇将(v1.3.4):HPが半分以下になったら「発動」、回復して半分を超えたら「解除」を出す
    // v1.6.4:『勇将』と『怒り』を両方持っているときは、両方の発動を出す(前は怒りだけだった)
    function checkRage() {
      if (dead()) return; // 決着した後は出さない
      for (const u of [left, right]) {
        const names = rageSkills(u, other(u));
        u.rageSet = u.rageSet || {};
        for (const s of C.rageSkills) {
          const on = names.includes(s);
          if (on === !!u.rageSet[s]) continue;
          if (!on && !isSkillOwner(u, s)) { u.rageSet[s] = false; continue; }
          u.rageSet[s] = on;
          u.rageOn = names.length > 0;
          const what = s === "勇将" ? "力・技・速さが1.5倍に!" : "必殺が出やすくなった!";
          push({
            type: "rage", actor: u.side, skill: s, on, forecast: fc(),
            text: on ? `${u.name}の『${s}』発動!${what}` : `${u.name}の『${s}』の効果が切れた`,
          });
        }
        u.rageOn = names.length > 0;
      }
    }
    const skillUp = (u, name, text, extra) => push({
      type: "skill", actor: u.side, skill: name,
      ougi: C.ougiSkills.includes(name),
      rare: name === "女神の加護" || name === "エンブラの加護",
      fromWeapon: u.skill !== name && u.weapon.weaponSkill === name,
      text: `${u.name}の『${name}』発動!${text || ""}`,
      healFx: C.healSkills.includes(name) && !!(extra && extra.heal), // v1.4.5:回復の演出
      ...(extra || {}),
    });
    // v1.6.4:『挑発』を持っていると、奥義(流星・太陽・月光・天空・瞬殺・陽光・衝撃・咆哮)の発動率+15
    const ougiPlus = (u, enemy, name) => (name && C.ougiSkills.includes(name) && hasSkill(u, enemy, "挑発") ? C.taunt.ougi : 0);
    const sklRoll = (u, enemy, name) => rng.percent(curStats(u, enemy).skl + ougiPlus(u, enemy, name));
    const dead = () => left.hp <= 0 || right.hp <= 0;
    const damageTo = (u, amount) => { const dealt = Math.min(amount, u.hp); u.hp -= dealt; return dealt; };
    const heal = (u, amount) => { const h = Math.min(amount, u.maxHp - u.hp); u.hp += h; return h; };
    // v1.6.3:『手加減』相手を倒すダメージのとき、1度だけHPを1残す
    const mercy = (att, def, amount) => {
      if (amount < def.hp || def.hp <= 1 || att.mercyUsed || !hasSkill(att, def, "手加減")) return amount;
      att.mercyUsed = true;
      skillUp(att, "手加減", `${def.name}のHPを1残した`);
      return def.hp - 1;
    };
    const fc = () => forecast(left, right);
    // 化身(v1.3.3:化身したラウンドを記録。v1.4.5:記録はそのまま、-5の免除は廃止)
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
    // (v1.6.4 の「化身前に攻撃が当たると自分のゲージ+1」は v1.6.5 で廃止)
    // v1.6.4:『地の祝福』状態異常(ポイズン・燃焼・睡眠・麻痺)を受けない。防いだ最初の1回だけ発動を出す
    const earthWard = (def, att) => {
      if (!hasSkill(def, att, "地の祝福")) return false;
      if (!def.earthShown) { def.earthShown = true; skillUp(def, "地の祝福", "状態異常を受けない"); }
      return true;
    };

    function hitRoll(rate) {
      const r = C.useTwoRandomHit ? (rng.int(0, 99) + rng.int(0, 99)) / 2 : rng.int(0, 99);
      return r < rate;
    }

    // 1発の攻撃
    function strike(att, def, opts = {}) {
      // v1.6.4:『キャンセル』は攻撃(流星・連続・天空などの1撃ずつ)のたびに、発動するかを決める
      if (!def.cancelNext && hasSkill(att, def, "キャンセル") && sklRoll(att, def)) {
        def.cancelNext = true;
        skillUp(att, "キャンセル", "相手の次の攻撃を無効にする");
      }
      const c = calc(att, def);
      const label = opts.label || "攻撃";
      const lead = `${att.name}の${label}!`;
      const fx = opts.fx || null; // v1.6.4:奥義の演出(流星・月光・太陽・天空)
      // v1.6.4:『影』15%の確率で、相手は見失い、攻撃が外れる
      if (hasSkill(def, att, "影") && rng.percent(C.shadow.missPercent)) {
        skillUp(def, "影", `${att.name}は${def.name}を見失った`);
        push({ type: "miss", actor: att.side, target: def.side, lead, result: "見失った!", fx, n: opts.n, text: `${lead}……見失った!` });
        return;
      }
      if (!hitRoll(c.hit)) {
        push({ type: "miss", actor: att.side, target: def.side, lead, result: "ミス!", fx, n: opts.n, text: `${lead}……ミス!` });
        return;
      }
      // v1.6.3:『大盾』は翼の守護と同じ効果(タカ・カラス以外のラグズ)
      const wardName = hasSkill(def, att, "翼の守護") ? "翼の守護" : hasSkill(def, att, "大盾") ? "大盾" : null;
      if (wardName && sklRoll(def, att)) {
        skillUp(def, wardName, "攻撃を無効にした");
        return;
      }
      // v1.4.3:『護り手』はデビルアクスが暴発しない
      if (att.weapon.selfDamage && !hasSkill(att, def, "護り手") && rng.percent(Math.max(0, 20 - curStats(att, def).lck))) {
        const dealt = damageTo(att, att.weapon.might);
        push({ type: "self", actor: att.side, target: att.side, damage: dealt, text: `${att.name}の${att.weapon.name}が暴発!自分に${dealt}ダメージ` });
        return;
      }
      // 『女神の加護』(v1.3.4):ダメージを受けない(最初の1回だけ発動の演出を出す)
      if (goddessGuards(def, att)) {
        if (!def.goddessShown) { def.goddessShown = true; skillUp(def, goddessName(def, att), "ダメージを無効にした"); }
        const result = `${def.name}にダメージを与えられない!`;
        push({ type: "hit", actor: att.side, target: def.side, damage: 0, dealt: 0, crit: false, guarded: true, lead, result, fx, n: opts.n, text: `${lead}${result}` });
        return;
      }
      // v1.4.3:『護り手』を持つ相手には瞬殺が効かない
      if (hasSkill(att, def, "瞬殺") && !hasSkill(def, att, "護り手") && rng.percent(Math.floor(curStats(att, def).skl / 2) + ougiPlus(att, def, "瞬殺"))) {
        skillUp(att, "瞬殺");
        const dealt = damageTo(def, mercy(att, def, def.hp));
        push({ type: "hit", actor: att.side, target: def.side, damage: dealt, crit: true, instantKill: true, lead, result: `${def.name}は一撃で倒された!`, text: `${lead}${def.name}は一撃で倒された!` });
        return;
      }

      const isCrit = rng.int(0, 99) < c.crit;
      let atk = c.atk;
      let defense = c.defense;
      let hitFx = fx;
      if (opts.luna || (hasSkill(att, def, "月光") && sklRoll(att, def, "月光"))) {
        defense = Math.floor(defense / 2);
        if (!opts.luna) { skillUp(att, "月光", "相手の防御が半分に", { fx: "luna" }); hitFx = "luna"; }
      }
      // v1.6.4:『陽光』相手の魔防を半分にし、与えたダメージの半分を自分が回復する
      let sunlight = false;
      if (att.weapon.isMagic && hasSkill(att, def, "陽光") && sklRoll(att, def, "陽光")) {
        defense = Math.floor(defense / 2);
        sunlight = true;
        skillUp(att, "陽光", "相手の魔防が半分に");
      }
      // v1.6.3:『鳴動』は確定(攻撃力は calc で足してある)。発動の演出は最初の1回だけ
      if (c.rumble && !att.rumbleShown) {
        att.rumbleShown = true;
        skillUp(att, "鳴動", `体格${c.rumble}を攻撃力に`);
      }
      // 『衝撃』(v1.4.3:守備→速さ):速さの値を攻撃力に加える
      let shock = false;
      if (hasSkill(att, def, "衝撃") && sklRoll(att, def, "衝撃")) {
        atk += curStats(att, def).spd;
        shock = true;
        skillUp(att, "衝撃", "速さを乗せた一撃");
      }
      let damage = finalDamage(atk, defense, c, isCrit);
      if (opts.half) damage = Math.floor(damage / 2);
      if (damage >= def.hp && def.hp > 0 && hasSkill(def, att, "祈り")) {
        // v1.6.1:アイクモードのアイクの祈りは「幸運%でHPが1残る」(発動しなければそのまま)
        if (def.char && def.char.ike) {
          if (rng.percent(curStats(def, att).lck)) { damage = def.hp - 1; skillUp(def, "祈り", "HPが1残った"); }
        } else {
          damage = Math.floor(damage / 2);
          skillUp(def, "祈り", "ダメージが半分に");
        }
      }
      damage = mercy(att, def, damage);
      const dealt = damageTo(def, damage);
      // v1.3.3:HPが0になる攻撃でも、表示は本来与えるダメージ(dealt は実際に減ったHP)
      const result = `${c.effective ? "特効!" : ""}${def.name}に${damage}ダメージ!`;
      push({
        type: "hit", actor: att.side, target: def.side, damage, dealt, crit: isCrit, effective: c.effective,
        lead, result, fx: hitFx, n: opts.n, text: `${lead}${isCrit ? "必殺の一撃!" : ""}${result}`,
      });
      hurtGauge(def, dealt); // 化身するならダメージの後に出す

      // v1.5.0:『ぶちかまし』体格×1.5の確率で、通常の攻撃のあとに、体格の数値のダメージを別に与える
      if (def.hp > 0 && hasSkill(att, def, "ぶちかまし") && rng.percent(Math.floor(curStats(att, def).con * C.bodySlam.chanceRate))) {
        const con = curStats(att, def).con;
        skillUp(att, "ぶちかまし", `体格${con}の追加ダメージ`);
        const slam = damageTo(def, mercy(att, def, con));
        const res2 = `${def.name}に${con}ダメージ!`;
        push({ type: "hit", actor: att.side, target: def.side, damage: con, dealt: slam, bodySlam: true, lead: "ぶちかまし!", result: res2, text: `ぶちかまし!${res2}` });
        hurtGauge(def, slam);
      }

      // v1.4.4:手斧・手槍系。ダメージを与えると相手の速さ-1(戦闘中ずっと続き、重なる。護り手・安定は受けない)
      const spdDown = att.weapon.spdDownOnHit;
      if (spdDown && dealt > 0 && def.hp > 0 && !resistsDown(def, att) && curStats(def, att).spd > 0) {
        def.debuff.spd = (def.debuff.spd || 0) - spdDown;
        push({ type: "spd-down", actor: att.side, target: def.side, amount: spdDown, forecast: fc(), text: `${def.name}の速さ-${spdDown}` });
      }

      // v1.6.5:長弓・蛇毒のナイフ・バルフレチェ。当てると、相手のHP・体格以外の能力をランダムに下げる
      //   (違う能力を count 個、amount ずつ。戦闘中ずっと続き、重なる。護り手・安定は受けない。地の祝福はラウンドの始めに戻す)
      const sd = att.weapon.statDown;
      if (sd && def.hp > 0 && !resistsDown(def, att)) {
        const pool = DB.STAT_KEYS.filter((k) => k !== "hp");
        const picked = [];
        for (let i = 0; i < sd.count && pool.length; i++) picked.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
        for (const k of picked) def.debuff[k] = (def.debuff[k] || 0) - sd.amount;
        const label = picked.map((k) => `${DB.STAT_LABELS[k]}-${sd.amount}`).join("・");
        push({ type: "spd-down", actor: att.side, target: def.side, amount: sd.amount, stats: picked, label, forecast: fc(), text: `${att.weapon.name}の効果!${def.name}の${label}` });
      }

      // 吸収(リザイア・ルーンソード・太陽)。v1.6.3:『太陽』は攻撃の前に発動(strikeSet で opts.sol)
      const drain = att.weapon.drain || opts.sol;
      if (drain && dealt > 0 && att.hp > 0) {
        const h = heal(att, dealt);
        if (h > 0) push({ type: "heal", actor: att.side, target: att.side, amount: h, fx: opts.sol ? fx || "sol" : null, forecast: fc(), text: `${att.name}はHPを${h}回復` });
      }
      // v1.6.4:『陽光』与えたダメージの半分を回復
      if (sunlight && dealt > 0 && att.hp > 0) {
        const h = heal(att, Math.floor(dealt / 2));
        if (h > 0) push({ type: "heal", actor: att.side, target: att.side, amount: h, forecast: fc(), text: `${att.name}はHPを${h}回復` });
      }
      // ポイズン・燃焼(v1.6.4:『地の祝福』は状態異常を受けない)
      if (att.weapon.status && def.hp > 0 && !earthWard(def, att)) {
        const already = def.status && def.status.name === att.weapon.status;
        def.status = { name: att.weapon.status, turns: C.statusEffect.turns }; // かかっていたら効果時間を延ばす
        if (!already) push({ type: "status-add", actor: att.side, target: def.side, text: `${def.name}は${att.weapon.status}状態になった` });
      }
      // 『狙撃』の睡眠(v1.3.4):技÷2の確率。眠っている間は攻撃できず、回避0
      if (def.hp > 0 && !def.sleep && hasSkill(att, def, "狙撃") && rng.percent(Math.floor(curStats(att, def).skl / C.sleep.chanceDiv)) && !earthWard(def, att)) {
        def.sleep = { turns: C.sleep.turns, round };
        skillUp(att, "狙撃", "相手を眠らせた");
        push({ type: "sleep", actor: att.side, target: def.side, forecast: fc(), text: `${def.name}は眠ってしまった!` });
      }
      // v1.6.4:『衝撃』の追加効果。当たったとき、幸運÷2の確率で相手を麻痺させる(次のラウンドの終わりまで、スキルが働かない)
      if (shock && def.hp > 0 && !def.paralysis && rng.percent(Math.floor(curStats(att, def).lck / 2)) && !earthWard(def, att)) {
        def.paralysis = { turns: C.paralysis.turns, round };
        def.rageSet = {}; def.rageOn = false;
        push({ type: "paralyze", actor: att.side, target: def.side, forecast: fc(), text: `${def.name}は麻痺した!スキルが働かない` });
      }
      // 『武器破壊』(v1.3.4):技÷2の確率。ラグズの武器は対象外
      if (def.hp > 0 && !def.broken && def.weapon.category !== "laguz" && hasSkill(att, def, "武器破壊") && rng.percent(Math.floor(curStats(att, def).skl / C.weaponBreak.chanceDiv))) {
        const name = def.weapon.name;
        breakWeapon(def);
        skillUp(att, "武器破壊", `${name}を破壊した`);
        push({ type: "break", actor: att.side, target: def.side, forecast: fc(), text: `${def.name}の${name}は威力が半分になり、効果を失った!` });
      }
      // カウンター
      if (dealt > 0 && def.hp > 0 && hasSkill(def, att, "カウンター") && !goddessGuards(att, def) && sklRoll(def, att)) {
        skillUp(def, "カウンター");
        const backDamage = Math.floor(dealt * C.counterRate); // v1.4.3:半分→75%
        const back = damageTo(att, mercy(def, att, backDamage));
        push({ type: "hit", actor: def.side, target: att.side, damage: backDamage, dealt: back, lead: "カウンター!", result: `${att.name}に${backDamage}ダメージ!`, text: `カウンター!${att.name}に${backDamage}ダメージ!` });
        hurtGauge(att, back);
      }
    }

    // 「攻撃」1回ぶん(勇者武器なら2連続、スキル『流星』『天空』など)
    function strikeSet(att, def) {
      // v1.6.4:演出用に fx(meteor / aether / sol / luna)と何撃目か(n)をイベントに入れる
      if (hasSkill(att, def, "流星") && sklRoll(att, def, "流星")) {
        skillUp(att, "流星", "5回連続攻撃", { fx: "meteor" });
        comboStart();
        for (let i = 0; i < 5 && !dead(); i++) strike(att, def, { half: true, label: `流星${i + 1}撃目`, fx: "meteor", n: i + 1 });
        comboEnd();
        return;
      }
      if (hasSkill(att, def, "天空") && sklRoll(att, def, "天空")) {
        skillUp(att, "天空", "", { fx: "aether" });
        comboStart();
        strike(att, def, { sol: true, label: "太陽の一撃", fx: "aether", n: 1 });
        if (!dead()) strike(att, def, { luna: true, label: "月光の一撃", fx: "aether", n: 2 });
        comboEnd();
        return;
      }
      // v1.6.3:『太陽』は攻撃の前に発動(当たれば、与えたダメージ分回復)
      if (hasSkill(att, def, "太陽") && sklRoll(att, def, "太陽")) {
        skillUp(att, "太陽", "与えたダメージ分回復する", { fx: "sol" });
        strike(att, def, { sol: true, label: "太陽の一撃", fx: "sol" });
      } else strike(att, def);
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
      // v1.6.4:『影』は1撃ごとに判定(strike)。『キャンセル』も1撃ごとに判定(strike)
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
    // v1.6.1:opts.maxRounds(アイクモードの漆黒の騎士はラウンド1だけ)
    let maxRounds = opts.maxRounds || C.maxRounds;
    // v1.7.0:3on3。1ラウンドずつ進める。opts.round0:これまでのラウンド数 / opts.oneRound:1ラウンドだけ /
    //   opts.firstR1Side:ラウンド1の先攻の側(先攻・後攻の交互に使う)/ opts.bench:{ left: [控え], right: [控え] }
    if (opts.oneRound) { round = opts.round0 || 0; maxRounds = round + 1; }
    if (opts.firstR1Side) firstR1 = units[opts.firstR1Side];
    const bench = opts.bench || { left: [], right: [] };
    let drawText = opts.drawText || `${maxRounds}ラウンドで決着がつかず、引き分け`;
    let quietRounds = 0;
    // v1.6.2:変身(phase2)。HPが0になったユニットが phase2 を持っていれば、別の姿で全回復して次のラウンドへ
    // v1.6.3:援軍が倒れた → 自分(援軍を呼んだキャラ)に戻る
    // v1.6.7:倒れたその場で交代し、そのラウンドの残りの攻撃(自分の側の攻撃・追撃)を自分が行う。
    //   ラウンドの制限は延ばさない(11体目の漆黒の騎士はラウンド1で終わる)。ラウンドの終わりの化身ゲージなどもふつうに進む
    const swapBack = () => {
      const r = [left, right].find((x) => x.hp <= 0 && x.returnTo);
      if (!r || other(r).hp <= 0) return false;
      const allyName = r.name;
      const owner = r.returnTo;
      for (const k of Object.keys(r)) delete r[k];
      Object.assign(r, owner);
      quietRounds = 0;
      push({ type: "swap", actor: r.side, back: true, forecast: fc(), text: `${allyName}は倒れた!${r.name}が戦う!` });
      if (r.laguz) push({ type: "gauge", actor: r.side, quiet: true, text: `${r.name}の化身ゲージ:${r.laguz.gauge}` });
      return true;
    };
    const phaseChange = () => {
      if (swapBack()) return true;
      const u = [left, right].find((x) => x.hp <= 0 && x.phase2);
      if (!u || other(u).hp <= 0) return false;
      const p = u.phase2;
      const nu = makeUnit(p, DB.weapons[p.weapon] ? p.weapon : (u.equip || u.weapon).id, u.side);
      const before = u.name;
      Object.assign(u, {
        char: p, name: nu.name, className: nu.className, weapon: nu.weapon, equip: nu.equip, stats: nu.stats,
        maxHp: nu.maxHp, hp: nu.hp, elem: nu.elem, status: null, sleep: null, debuff: {}, roarStacks: 0,
        rageOn: false, broken: false, cancelNext: false, phase2: null,
      });
      u.skill = p.skill !== undefined ? p.skill : u.skill;
      u.extraSkills = (p.extraSkills || u.extraSkills || []).slice();
      quietRounds = 0;
      push({ type: "phase2", actor: u.side, forecast: fc(), text: `${before}が真の姿を現した!(HP${u.hp})` });
      return true;
    };
    // v1.6.3:『手加減』のHP+3(最大HPと今のHP)。v1.6.4:+5
    for (const u of [left, right]) {
      if (!u.mercyHp && hasSkill(u, other(u), "手加減")) { u.mercyHp = true; u.maxHp += C.mercy.amount; u.hp += C.mercy.amount; }
    }
    // v1.6.4:援軍が戦っている間も、呼んだキャラ(控え)の化身ゲージ・スキルは見えないところで進む
    //   ラウンドの始め:化身ゲージ(ラウンド1は+4)・エリート(ラウンド1)・大器晩成(4ラウンド目)・空の祝福・回復
    //   ラウンドの終わり:化身ゲージ(化身中は-5、化身前は+4)
    const benchStart = (o, foe) => {
      if (round === 1) {
        if (o.laguz) roundOneStart(o);
        // v1.7.3:3on3(oneRound)の控えはここではクラスチェンジしない(はじめて出たラウンドに、見えるところでクラスチェンジ)
        else if (!opts.oneRound && hasSkill(o, foe, "エリート")) promote(o);
      }
      if (round >= C.lateBloomer.fromRound && !o.lateBloom && hasSkill(o, foe, "大器晩成")) {
        o.lateBloom = true; o.maxHp += C.lateBloomer.amount; o.hp += C.lateBloomer.amount;
      }
      if (hasSkill(o, foe, "空の祝福")) heal(o, Math.floor(o.maxHp * C.skyBlessingPercent / 100));
    };
    const benchEnd = (o, foe) => {
      if (hasSkill(o, foe, "回復")) heal(o, Math.floor(o.maxHp / 10));
      if (!o.laguz || o.laguz.fixed) return;
      if (o.laguz.transformed) {
        o.laguz.gauge = Math.max(0, o.laguz.gauge - C.laguzGauge.decay);
        if (o.laguz.gauge === 0) o.laguz.transformed = false;
      } else {
        gainGauge(o, C.laguzGauge.roundGain);
        transformIfFull(o);
      }
    };
    for (;;) {
    while (!dead() && round < maxRounds) {
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

      // v1.6.3:『援軍』開幕にペガサスナイト(5%でファルコンナイト)が参戦し、代わりに戦う
      if (round === 1) {
        for (const u of [first, second]) {
          if (!hasSkill(u, other(u), "援軍") || u.reinforced) continue;
          const ally = reinforcementChar(rng);
          const owner = { ...u, reinforced: true };
          const au = makeUnit(ally, ally.weapon, u.side);
          const name = u.name;
          skillUp(u, "援軍", `${ally.className}の${ally.name}が参戦!`);
          Object.assign(u, {
            char: ally, name: au.name, className: au.className, weapon: au.weapon, equip: au.equip, stats: au.stats,
            maxHp: au.maxHp, hp: au.hp, elem: au.elem, bio: C.biorhythm[1], skill: null, extraSkills: [], status: null, sleep: null,
            debuff: {}, roarStacks: 0, rageOn: false, broken: false, cancelNext: false, laguz: null, phase2: null,
            returnTo: owner, reinforced: true, lateBloom: false, mercyUsed: false, rumbleShown: false, goddessShown: false,
          });
          push({ type: "swap", actor: u.side, char: ally, weaponId: ally.weapon, forecast: fc(), text: `${name}の援軍:${ally.className}の${ally.name}(Lv${ally.level})が代わりに戦う!` });
        }
      }
      const hpBefore = left.hp + right.hp;

      // v1.4.5:『エリート』開幕に上級職へクラスチェンジ(Lv1)。v1.6.4:援軍が戦っている間は、控えのキャラが見えないところでクラスチェンジ
      for (const u of [first, second]) if (u.returnTo) benchStart(u.returnTo, other(u));
      // v1.7.0:3on3の控えのキャラも、見えないところで進む(援軍の控えと同じ)
      for (const side of ["left", "right"]) for (const o of bench[side] || []) if (o.hp > 0) benchStart(o, units[side === "left" ? "right" : "left"]);
      // v1.7.3:3on3(oneRound)では、ラウンド1だけでなく、はじめて出たラウンド(受け継いだときは次に出たラウンド)にクラスチェンジ
      //   (前は全体のラウンド1しか見ていなかったので、2ラウンド目から出たキャラ・受け継いだキャラが発動しなかった)
      if (round === 1 || opts.oneRound) {
        for (const u of [first, second]) {
          if (u.laguz || u.elited || !hasSkill(u, other(u), "エリート")) continue;
          u.elited = true;
          const p = promote(u);
          if (p) skillUp(u, "エリート", `${p.to}(Lv1)にクラスチェンジ!`, { elite: p, forecast: fc() });
        }
      }

      // ラウンド1開始時:化身前のラグズはゲージ+4。20なら開幕から化身
      if (round === 1) {
        for (const u of [first, second]) {
          if (!u.laguz) continue;
          if (roundOneStart(u)) pushTransform(u);
          else push({ type: "gauge", actor: u.side, quiet: true, text: `${u.name}の化身ゲージ:${u.laguz.gauge}` });
        }
      }

      // 『能力勝負』(v1.3.4):最初に知らせる
      if ((round === 1 || opts.newPair) && statsDuel(left, right)) {
        const owner = [first, second].find((u) => hasSkill(u, other(u), "能力勝負"));
        skillUp(owner, "能力勝負", "お互いのスキルとバイオリズムが無効に", { forecast: fc() });
      }

      // ラウンド開始時のスキル(v1.3.4):地の祝福・空の祝福・咆哮
      for (const u of [first, second]) {
        if (dead()) break;
        const foe = other(u);
        // v1.5.0:状態異常に加えて、戦闘中に下がった能力(咆哮・手斧手槍の速さ-1)も0に戻す
        // v1.6.4:状態異常はそもそも受けない(strike)。ラウンドの始めに、戦闘中に下がった能力を元に戻す
        const minus = Object.values(u.debuff || {}).some((v) => v < 0);
        if (hasSkill(u, foe, "地の祝福") && (u.status || u.sleep || u.paralysis || minus)) {
          u.status = null; u.sleep = null; u.paralysis = null;
          u.debuff = {}; u.roarStacks = 0;
          skillUp(u, "地の祝福", "下がった能力を元に戻した", { forecast: fc() });
        }
        // v1.4.5:『大器晩成』4ラウンド目の開始時に発動(体格以外+3。HPは最大HPと今のHPに+3)
        // v1.6.3:援軍のあとに戻ってきたキャラは、4ラウンド目より後でも戻ったときに発動(>=)
        if (round >= C.lateBloomer.fromRound && !u.lateBloom && hasSkill(u, foe, "大器晩成")) {
          u.lateBloom = true;
          u.maxHp += C.lateBloomer.amount;
          u.hp += C.lateBloomer.amount;
          skillUp(u, "大器晩成", `体格以外の能力値+${C.lateBloomer.amount}`, { forecast: fc() });
        }
        if (hasSkill(u, foe, "空の祝福") && u.hp < u.maxHp) {
          const h = heal(u, Math.floor(u.maxHp * C.skyBlessingPercent / 100));
          skillUp(u, "空の祝福", `HPを${h}回復`, { heal: h });
        }
        if (hasSkill(u, foe, "咆哮") && foe.roarStacks < C.roar.maxStacks && sklRoll(u, foe, "咆哮")) {
          if (resistsDown(foe, u)) { // v1.4.3:安定も下がらない
            if (!foe.guardShown) {
              foe.guardShown = true;
              skillUp(u, "咆哮");
              skillUp(foe, hasSkill(foe, u, "護り手") ? "護り手" : "安定", "能力が下がらない");
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

      // v1.6.7:援軍が倒れたら、その場で自分に交代して残りの攻撃を続ける(act)
      const act = (a, d) => { attack(a, d); swapBack(); };
      swapBack(); // 状態異常で援軍が倒れたとき
      act(first, second);
      act(second, first);
      if (!dead() && calc(first, second).doubles) act(first, second);
      if (!dead() && calc(second, first).doubles) act(second, first);
      // v1.6.3:『再行動』幸運の確率で、自分だけもう一度攻撃(追撃も含む)。1ラウンドに1回
      for (const u of [first, second]) {
        const foe = other(u);
        if (dead() || !hasSkill(u, foe, "再行動") || u.sleep || !rng.percent(curStats(u, foe).lck)) continue;
        skillUp(u, "再行動", "もう一度攻撃");
        act(u, foe);
        if (!dead() && calc(u, foe).doubles) act(u, foe);
      }

      // 『回復』
      for (const u of [first, second]) {
        if (dead() || !hasSkill(u, other(u), "回復") || u.hp >= u.maxHp) continue;
        const h = heal(u, Math.floor(u.maxHp / 10));
        skillUp(u, "回復", `HPを${h}回復`, { heal: h }); // v1.4.5:回復量は発動のイベントに直接入れる
      }

      // v1.6.5:『盗む』(シーフ・アサシンの兵種スキル)。相手より速さが4以上高いと、ラウンドの終わりに幸運%で発動
      //   傷薬(HP10回復・70%)/特効薬(HP全回復・15%)/ドーピングアイテム(力・技・幸運・守備のどれか+2・15%)
      for (const u of [first, second]) {
        const foe = other(u);
        if (dead() || u.sleep || DB.classSkillOf(u.className) !== "盗む") continue;
        if (curStats(u, foe).spd - curStats(foe, u).spd < C.steal.spdGap || !rng.percent(curStats(u, foe).lck)) continue;
        const items = C.steal.items;
        let r = rng.int(0, items.reduce((a, it) => a + it.percent, 0) - 1);
        const item = items.find((it) => (r -= it.percent) < 0) || items[0];
        const ev = { type: "skill", actor: u.side, skill: "盗む", classSkill: true, steal: item.name };
        if (item.stats) {
          const k = item.stats[rng.int(0, item.stats.length - 1)];
          u.buff = u.buff || {};
          u.buff[k] = (u.buff[k] || 0) + item.amount;
          push({ ...ev, buffText: `${DB.STAT_LABELS[k]}+${item.amount}`, forecast: fc(), text: `${u.name}の『盗む』発動!${item.name}を盗んだ!${DB.STAT_LABELS[k]}+${item.amount}` });
        } else {
          const h = heal(u, item.fullHeal ? u.maxHp : item.heal);
          push({ ...ev, heal: h, healFx: true, forecast: fc(), text: `${u.name}の『盗む』発動!${item.name}を盗んだ!HPを${h}回復` });
        }
      }

      // 睡眠(v1.3.4):眠ったラウンドは数えず、次のラウンドから数えて turns ラウンド目の終了時に目覚める
      for (const u of [first, second]) {
        if (dead() || !u.sleep || u.sleep.round === round) continue;
        if (--u.sleep.turns <= 0) {
          u.sleep = null;
          push({ type: "wake", actor: u.side, forecast: fc(), text: `${u.name}は目を覚ました` });
        }
      }

      // v1.6.4:麻痺(衝撃)。麻痺したラウンドは数えず、次のラウンドの終わりに治る
      for (const u of [first, second]) {
        if (dead() || !u.paralysis || u.paralysis.round === round) continue;
        if (--u.paralysis.turns <= 0) {
          u.paralysis = null;
          push({ type: "wake", actor: u.side, paralysis: true, forecast: fc(), text: `${u.name}の麻痺が治った` });
        }
      }
      // v1.6.4:援軍が戦っている間の、控えのキャラ(回復・化身ゲージ)
      for (const u of [first, second]) if (!dead() && u.returnTo) benchEnd(u.returnTo, other(u));
      for (const side of ["left", "right"]) for (const o of bench[side] || []) if (!dead() && o.hp > 0) benchEnd(o, units[side === "left" ? "right" : "left"]);

      // 化身ゲージ(ラウンド終了時):化身中は-5(0で化身が解ける)、化身前は+4(20で化身)
      for (const u of [first, second]) {
        if (dead() || !u.laguz) continue;
        if (u.laguz.transformed && u.laguz.fixed) continue; // v1.6.1:ずっと化身
        if (u.laguz.transformed) {
          // v1.4.5:「化身したラウンドの終了時は減らない」(v1.3.3)を廃止。化身したラウンドも-5
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
    // v1.6.4:援軍が倒れたときは、ラウンドの制限に届いていても自分に戻って続ける
    if (round < maxRounds && phaseChange()) continue;
    swapBack(); // v1.6.7:制限のラウンドの終わりに援軍が倒れていたら、自分に戻して終わる(ラウンドは延ばさない)
    break;
    }
    // v1.7.2:3on3は、だれかが倒れたラウンドも続きがあるので、ラウンドの終わりの化身ゲージを進める
    //   (前は倒れた時点で止まり、残ったキャラ・控えの化身ゲージがそのままだった)
    if (opts.oneRound && dead()) {
      for (const side of ["left", "right"]) for (const o of bench[side] || []) if (o.hp > 0) benchEnd(o, units[side === "left" ? "right" : "left"]);
      for (const u of [left, right]) {
        if (u.hp <= 0 || !u.laguz || (u.laguz.transformed && u.laguz.fixed)) continue;
        if (u.laguz.transformed) {
          u.laguz.gauge = Math.max(0, u.laguz.gauge - C.laguzGauge.decay);
          if (u.laguz.gauge === 0) u.laguz.transformed = false;
        } else {
          gainGauge(u, C.laguzGauge.roundGain);
          transformIfFull(u);
        }
      }
    }

    let winner = "draw";
    if (left.hp <= 0) winner = "right";
    else if (right.hp <= 0) winner = "left";
    // v1.6.3:援軍のまま決着したら、勝ち負けは呼んだキャラのもの(戦いのあとは元のキャラに戻す)
    const winName = winner === "draw" ? "" : units[winner].returnTo ? units[winner].returnTo.name : units[winner].name;
    push({
      type: "end", winner,
      text: winner === "draw" ? drawText : `${winName}の勝利!`,
    });
    for (const u of [left, right]) {
      if (!u.returnTo) continue;
      const owner = u.returnTo;
      for (const k of Object.keys(u)) delete u[k];
      Object.assign(u, owner);
    }
    return { events, winner };
  }

  global.Battle = { reinforcementChar, elementWeak, promote, classEffect, makeUnit, cloneUnit, previewRoundOne, calc, forecast, bonusSummary, transformPlan, simulate, decideFirst, hasPriority, priorityReason, triangle, attackSpeed, biorhythmMod, drawSkill, skillPool, statsDuel, hasSkill, elemOf, classCrit, elementsOf };
})(window);
