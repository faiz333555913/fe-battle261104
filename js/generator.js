// キャラ生成。入力(名前・性別・種族・漢字・色・生年月日)から、必ず同じキャラを作る。
// ここでは Math.random() を使わず、すべて Rng.createSeededRng の乱数で決める。
(function (global) {
  "use strict";
  const C = global.Config;
  const DB = global.GameDB;

  const GENERATOR_VERSION = 2; // v1.2.0:性別・種族を追加

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
  function generateCharacter(inputs) {
    const key = seedKey(inputs);
    const rng = global.Rng.createSeededRng(key);
    const month = +inputs.birthdate.slice(4, 6);
    const day = +inputs.birthdate.slice(6, 8);

    // 属性:誕生月
    const element = C.monthElement[month];

    // 職業:性別・種族で絞り、好きな色で出やすさに偏り
    const colorDef = C.colors.find((c) => c.name === inputs.color);
    const cls = rng.weightedPick(classPool(inputs.gender, inputs.race), (c) =>
      c.groups.some((g) => colorDef.bias.includes(g)) ? C.colorBiasWeight : 1);
    const isLaguz = cls.race === "ラグズ";

    // 成長の傾向:好きな漢字の文字コード
    const kanjiType = C.kanjiTypes[inputs.kanji.codePointAt(0) % C.kanjiTypes.length];

    // 成長率 = 職業の成長率 + 個人差 + 漢字の傾向 + 属性の傾向
    const growth = {};
    for (const k of DB.STAT_KEYS) {
      let g = cls.growth[k] + rng.int(C.personalGrowthRange[0], C.personalGrowthRange[1]);
      if (kanjiType.up.includes(k)) g += C.kanjiGrowthUp;
      if (kanjiType.down === k) g -= C.kanjiGrowthDown;
      if (C.elementGrowthBonus[element] === k) g += 5;
      growth[k] = Math.max(5, g);
    }

    // Lv1:職業の基本値 + 個人差(幸運には誕生日の補正)。ラグズは化身前の値
    const stats = {};
    for (const k of DB.STAT_KEYS) {
      stats[k] = cls.base[k] + rng.int(0, k === "hp" ? C.personalBaseMax + 1 : C.personalBaseMax);
    }
    stats.lck += day % 3;
    for (const k of DB.STAT_KEYS) stats[k] = Math.min(stats[k], cls.max[k]);

    // レベルアップを再現(上限で頭打ち)。ベオクはLv20、ラグズはLv10相当
    const levelUps = isLaguz ? C.laguzLevelUps : C.levelUps;
    for (let lv = 0; lv < levelUps; lv++) {
      for (const k of DB.STAT_KEYS) {
        const g = growth[k];
        const gain = Math.floor(g / 100) + (rng.percent(g % 100) ? 1 : 0);
        stats[k] = Math.min(stats[k] + gain, cls.max[k]);
      }
    }
    const con = cls.con + rng.int(0, 1);

    // 武器:ラグズは固定の1つ。ベオクは使えるカテゴリから、レア度に応じて抽選(重複なし)
    let weapons;
    if (isLaguz) {
      weapons = [cls.fixedWeapon];
    } else {
      let pool = cls.weaponCategories.flatMap((cat) => DB.weaponsByCategory[cat] || []);
      const prefix = Object.keys(C.weaponCountByClassPrefix).find((p) => cls.name.startsWith(p));
      const count = Math.min(prefix ? C.weaponCountByClassPrefix[prefix] : C.weaponCountDefault, pool.length);
      const picked = [];
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
    };
    // ラグズ:stats は化身中の値、statsHuman は化身前の値
    if (isLaguz) {
      char.statsHuman = { ...stats, con };
      for (const k of DB.STAT_KEYS) char.stats[k] = Math.min(stats[k] + cls.transform[k], cls.transformedMax[k]);
    }
    return char;
  }

  global.Generator = { normalizeInputs, generateCharacter, seedKey, classPool, GENERATOR_VERSION };
})(window);
