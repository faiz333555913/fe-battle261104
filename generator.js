// キャラ生成。入力(名前・性別・種族・漢字・色・生年月日)から、必ず同じキャラを作る。
// ここでは Math.random() を使わず、すべて Rng.createSeededRng の乱数で決める。
(function (global) {
  "use strict";
  const C = global.Config;
  const DB = global.GameDB;

  const GENERATOR_VERSION = 2; // v1.2.0:性別・種族を追加
  // v1.6.1:錬成の範囲を変更(威力0〜5・命中0〜25・必殺0〜10・重さ0〜5)。前に作ったキャラも決め直す
  // v1.6.4:錬成の対象にスキル付きの武器・エル魔法を追加(スキル付きの武器は★2になったので、持っていても錬成がつく)。前に作ったキャラも決め直す
  // v1.6.5:長弓・蛇毒のナイフ・待ち伏せのダガー(スキル付き)が錬成の対象に。前に作ったキャラも決め直す
  const MARKS_VERSION = 6;

  // ---- 入力の正規化とチェック ----
  // 戻り値: { ok: true, value } または { ok: false, errors: {項目: メッセージ} }
  function normalizeInputs(raw) {
    const errors = {};
    const nfkc = (s) => String(s ?? "").normalize("NFKC");

    const name = nfkc(raw.name).replace(/\s+/g, "");
    const nameLen = Array.from(name).length;
    if (nameLen === 0) errors.name = "名前を入力してください";
    else if (nameLen > C.nameMaxLength) errors.name = `名前は${C.nameMaxLength}文字までです`;
    else if (/\p{Script=Han}/u.test(name)) errors.name = "名前に漢字は使えません(カタカナ・ひらがな・英字で入力してください)";

    const gender = String(raw.gender ?? "");
    if (!C.genders.includes(gender)) errors.gender = "性別を選んでください";

    const race = String(raw.race ?? "");
    if (!C.races.some((r) => r.name === race)) errors.race = "種族を選んでください";

    const kanji = nfkc(raw.kanji).replace(/\s+/g, "");
    if (Array.from(kanji).length !== 1 || !/^\p{Script=Han}$/u.test(kanji)) errors.kanji = "漢字を1文字入力してください";

    const color = String(raw.color ?? "");
    if (!C.colors.some((c) => c.name === color)) errors.color = "色を選んでください";

    const birth = nfkc(raw.birthdate).replace(/[\s/\-.年月日]/g, "");
    if (!/^\d{8}$/.test(birth)) {
      errors.birthdate = "生年月日は8桁の数字で入力してください(例:19800123)";
    } else {
      const y = +birth.slice(0, 4), m = +birth.slice(4, 6), d = +birth.slice(6, 8);
      const dt = new Date(y, m - 1, d);
      if (y < 1900 || dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
        errors.birthdate = "存在しない日付です";
      }
    }

    if (Object.keys(errors).length) return { ok: false, errors };
    return { ok: true, value: { name, gender, race, kanji, color, birthdate: birth } };
  }

  function seedKey(inputs) {
    return `v${GENERATOR_VERSION}|${inputs.name}|${inputs.gender}|${inputs.race}|${inputs.kanji}|${inputs.color}|${inputs.birthdate}`;
  }

  // 性別・種族で選べる職業
  function classPool(gender, race) {
    return DB.classes.filter((c) => !c.banned && c.race === race && (c.gender === gender || c.gender === "共用"));
  }

  // ---- 生成 ----
  // inputs は normalizeInputs 済みのもの
  // v1.8.4:trace にオブジェクトを渡すと、どう決まったか(内部データ)を書きこむ(キャラ作成の「詳しい内部データ」)。結果は変わらない
  function generateCharacter(inputs, trace) {
    const key = seedKey(inputs);
    const T = trace || null;
    const rng = global.Rng.createSeededRng(key);
    const day = +inputs.birthdate.slice(6, 8);

    // 属性:v1.6.5 から誕生月ではなく、入力すべてから決まる別の乱数で決める(誕生日だけ変えて選べないように)
    const element = elementOf(inputs);

    // 職業:性別・種族で絞り、好きな色で出やすさに偏り
    const colorDef = C.colors.find((c) => c.name === inputs.color);
    const classWeight = (c) => (c.groups.some((g) => colorDef.bias.includes(g)) ? C.colorBiasWeight : 1);
    const cls = rng.weightedPick(classPool(inputs.gender, inputs.race), classWeight);
    if (T) {
      T.seedKey = key;
      T.colorBias = colorDef.bias.slice();
      T.classPool = classPool(inputs.gender, inputs.race).map((c) => ({ name: c.name, weight: classWeight(c) }));
      T.className = cls.name;
      const ew = C.elementWeights, sum = Object.values(ew).reduce((a, b) => a + b, 0);
      T.elementPool = Object.keys(ew).map((e) => ({ name: e, weight: ew[e], pct: Math.round((ew[e] / sum) * 1000) / 10 }));
      T.element = element;
      T.growth = {}; T.base = {}; T.levelUps = [];
    }
    const isLaguz = cls.race === "ラグズ";

    // 成長の傾向:好きな漢字の文字コード
    const kanjiType = C.kanjiTypes[inputs.kanji.codePointAt(0) % C.kanjiTypes.length];

    // 成長率 = 職業の成長率 + 個人差 + 漢字の傾向 + 属性の傾向
    const growth = {};
    for (const k of DB.STAT_KEYS) {
      const personal = rng.int(C.personalGrowthRange[0], C.personalGrowthRange[1]);
      let g = cls.growth[k] + personal;
      const kj = (kanjiType.up.includes(k) ? C.kanjiGrowthUp : 0) - (kanjiType.down === k ? C.kanjiGrowthDown : 0);
      const el = C.elementGrowthBonus[element] === k ? 5 : 0;
      g += kj + el;
      growth[k] = Math.max(5, g);
      if (T) T.growth[k] = { cls: cls.growth[k], personal, kanji: kj, element: el, total: growth[k] };
    }
    if (T) T.kanjiType = { name: kanjiType.name, up: kanjiType.up.slice(), down: kanjiType.down, code: inputs.kanji.codePointAt(0) };

    // Lv1:職業の基本値 + 個人差(幸運には誕生日の補正)。ラグズは化身前の値
    const stats = {};
    for (const k of DB.STAT_KEYS) {
      const roll = rng.int(0, k === "hp" ? C.personalBaseMax + 1 : C.personalBaseMax);
      stats[k] = cls.base[k] + roll;
      if (T) T.base[k] = { cls: cls.base[k], personal: roll, day: 0, max: cls.max[k] };
    }
    stats.lck += day % 3;
    if (T) T.base.lck.day = day % 3;
    for (const k of DB.STAT_KEYS) { stats[k] = Math.min(stats[k], cls.max[k]); if (T) T.base[k].total = stats[k]; }
    const statsLv1 = { ...stats }; // v1.4.0:レベルアップ演出用(Lv1の値。ラグズは化身前)

    // レベルアップを再現(上限で頭打ち)。ベオクはLv20、ラグズはLv10相当
    const levelUps = isLaguz ? C.laguzLevelUps : C.levelUps;
    for (let lv = 0; lv < levelUps; lv++) {
      const row = {};
      for (const k of DB.STAT_KEYS) {
        const g = growth[k];
        const gain = Math.floor(g / 100) + (rng.percent(g % 100) ? 1 : 0);
        const before = stats[k];
        stats[k] = Math.min(stats[k] + gain, cls.max[k]);
        row[k] = { gain, got: stats[k] - before }; // got:上限で止まった分は gain より小さい
      }
      if (T) T.levelUps.push(row);
    }
    const conRoll = rng.int(0, 1);
    const con = cls.con + conRoll;
    if (T) T.con = { cls: cls.con, personal: conRoll, total: con };

    // 武器:ラグズは固定の1つ。ベオクは使えるカテゴリから、レア度に応じて抽選(重複なし)
    let weapons;
    if (isLaguz) {
      weapons = [cls.fixedWeapon];
    } else {
      // v1.6.5:職業専用の武器(onlyClasses)は、その職業のときだけ
      let pool = cls.weaponCategories.flatMap((cat) => DB.weaponsByCategory[cat] || [])
        .filter((w) => !w.onlyClasses || w.onlyClasses.includes(DB.baseClassName(cls.name)));
      const prefix = Object.keys(C.weaponCountByClassPrefix).find((p) => cls.name.startsWith(p));
      const count = Math.min(prefix ? C.weaponCountByClassPrefix[prefix] : C.weaponCountDefault, pool.length);
      const picked = [];
      if (T) {
        const sum = pool.reduce((a, w) => a + DB.weaponRarity(w), 0);
        T.weaponPool = pool.map((w) => ({ id: w.id, name: w.name, weight: DB.weaponRarity(w), pct: Math.round((DB.weaponRarity(w) / sum) * 1000) / 10 }));
        T.weaponCount = count;
      }
      for (let i = 0; i < count; i++) {
        const w = rng.weightedPick(pool, DB.weaponRarity);
        picked.push(w);
        pool = pool.filter((x) => x !== w);
      }
      const order = Object.values(DB.weapons).map((w) => w.id);
      picked.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      weapons = picked.map((w) => w.id);
    }

    const char = {
      id: global.Rng.hashString(key).map((n) => n.toString(16).padStart(8, "0")).join("").slice(0, 16),
      version: GENERATOR_VERSION,
      inputs: { ...inputs },
      name: inputs.name,
      gender: inputs.gender,
      race: cls.race,
      level: isLaguz ? C.laguzLevelUps + 1 : C.levelUps + 1,
      colorHex: colorDef.hex,
      className: cls.name,
      moveType: cls.moveType,
      element,
      kanjiType: kanjiType.name,
      stats: { ...stats, con },
      growth,
      weapons,
      statsLv1,
    };
    char.marks = weaponMarks(char); // v1.4.3:武器の印
    char.marksVersion = MARKS_VERSION;
    // ラグズ:stats は化身中の値、statsHuman は化身前の値
    if (isLaguz) {
      char.statsHuman = { ...stats, con };
      for (const k of DB.STAT_KEYS) char.stats[k] = Math.min(stats[k] + cls.transform[k], cls.transformedMax[k]);
      if (T) T.transform = DB.STAT_KEYS.reduce((o, k) => { o[k] = { human: stats[k], plus: cls.transform[k], max: cls.transformedMax[k], total: char.stats[k] }; return o; }, {});
      if (T) T.gauge = { lck: stats.lck, bonus: cls.gaugeBonus || 0, total: Math.min(C.laguzGauge.max, stats.lck + (cls.gaugeBonus || 0)) };
    }
    if (T) { T.id = char.id; T.version = GENERATOR_VERSION; T.marks = char.marks; T.isLaguz = isLaguz; T.levelUpsCount = levelUps; T.weapons = weapons.slice(); }
    return char;
  }

  // v1.6.5:属性。キャラ本体とは別の乱数(能力値・武器の決まり方は変わらない)。出やすさは C.elementWeights
  function elementOf(inputs) {
    const rng = global.Rng.createSeededRng(seedKey(inputs) + "|element");
    const list = Object.keys(C.elementWeights);
    return rng.weightedPick(list, (e) => C.elementWeights[e]);
  }

  // ---- v1.4.3:武器の印 ----
  // キャラの入力から決まる(キャラ本体の乱数とは別の乱数なので、これまでの能力値・武器は変わらない)。
  // 戻り値:{ 武器id: { might, hit, crit, weight } }(印がなければ {})
  function weaponMarks(char) {
    const M = C.weaponMark;
    const weapons = (char.weapons || []).map((id) => DB.weapons[id]).filter(Boolean);
    if (weapons.some((w) => DB.weaponStars(w) >= M.noMarkStars)) return {};
    const targets = weapons.filter((w) => DB.isMarkable(w));
    if (!targets.length) return {};
    const key = char.inputs ? seedKey(char.inputs) : String(char.id);
    const rng = global.Rng.createSeededRng(key + "|mark");
    const w = rng.pick(targets);
    let m;
    do {
      m = { might: rng.pick(M.might), hit: rng.pick(M.hit), crit: rng.pick(M.crit), weight: rng.pick(M.weight) };
    } while (!m.might && !m.hit && !m.crit && !m.weight); // すべて0の印は引き直す
    return { [w.id]: m };
  }
  // 印がまだ決まっていないキャラ(v1.4.2以前に作ったキャラ・読み込んだキャラ)に印をつける。
  // v1.4.4:印の対象が増えたので、v1.4.3までに印をつけたキャラも今のルールで決め直す(作り直したキャラと同じ印になる)
  const needsMarks = (char) => !!char && (!char.marks || char.marksVersion !== MARKS_VERSION);
  function ensureMarks(char) {
    if (needsMarks(char)) { char.marks = weaponMarks(char); char.marksVersion = MARKS_VERSION; }
    return char;
  }

  // v1.6.5:名前が変わった武器(ポイズンニードル → 蛇毒のナイフ、シャドウエッジ → 待ち伏せのダガー)を新しい名前にする。変わったら true
  function renameWeapons(char) {
    if (!char || !Array.isArray(char.weapons)) return false;
    const R = DB.weaponRenames || {};
    let changed = false;
    char.weapons = char.weapons.map((id) => { if (R[id]) { changed = true; return R[id]; } return id; });
    if (char.weapon && R[char.weapon]) { char.weapon = R[char.weapon]; changed = true; }
    if (changed) { delete char.marksVersion; ensureMarks(char); }
    return changed;
  }

  // v1.4.4:ラグズの化身後の能力値を、化身前の能力値 + 今の化身の上がり幅で計算し直す(虎の速さ+1 を作成済みのキャラにも反映)。
  // 何度呼んでも同じ結果。変わったら true
  function refreshLaguzStats(char) {
    if (!char || char.race !== "ラグズ" || !char.statsHuman) return false;
    const cls = DB.classByName[char.className];
    if (!cls || !cls.transform) return false;
    let changed = false;
    for (const k of DB.STAT_KEYS) {
      const v = Math.min(char.statsHuman[k] + cls.transform[k], cls.transformedMax[k]);
      if (char.stats[k] !== v) { char.stats[k] = v; changed = true; }
    }
    return changed;
  }

  // v1.8.0:ドラゴンナイト・ドラゴンマスターは槍 → 斧に変更。前に作ったキャラが槍を持っていたら、
  //   入力から作り直したときと同じ斧に持ち替える(作り直せないときは、入力から決まる別の乱数で斧を選ぶ)。変わったら true
  const isDragonKnight = (name) => /^ドラゴン(ナイト|マスター)/.test(String(name || ""));
  function fixDragonAxes(char) {
    if (!char || !Array.isArray(char.weapons) || !isDragonKnight(char.className)) return false;
    const isLance = (id) => { const w = DB.weapons[id]; return !!w && w.category === "lance"; };
    if (!char.weapons.some(isLance)) return false;
    let next = null;
    try {
      const inp = char.inputs && normalizeInputs(char.inputs);
      if (inp && inp.ok) {
        const g = generateCharacter(inp.value);
        if (isDragonKnight(g.className)) next = g.weapons.slice();
      }
    } catch (e) { next = null; }
    if (!next || !next.length) {
      const key = char.inputs ? seedKey(char.inputs) : String(char.id);
      const rng = global.Rng.createSeededRng(key + "|axe");
      let pool = (DB.weaponsByCategory.axe || []).filter((w) => !w.onlyClasses);
      next = [];
      const count = Math.min(char.weapons.length || C.weaponCountDefault, pool.length);
      for (let i = 0; i < count; i++) { const w = rng.weightedPick(pool, DB.weaponRarity); next.push(w.id); pool = pool.filter((x) => x !== w); }
      const order = Object.values(DB.weapons).map((w) => w.id);
      next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    // 槍以外(アーケードで手に入れた武器など)はそのまま残す
    const keep = char.weapons.filter((id) => !isLance(id) && !next.includes(id));
    char.weapons = next.concat(keep);
    if (char.weapon && isLance(char.weapon)) char.weapon = char.weapons[0];
    delete char.marksVersion; ensureMarks(char);
    return true;
  }

  global.Generator = { fixDragonAxes, elementOf, renameWeapons, normalizeInputs, generateCharacter, seedKey, classPool, weaponMarks, ensureMarks, needsMarks, refreshLaguzStats, GENERATOR_VERSION };
})(window);
