// js/gamedata.js(data/*.json の中身)を、ゲームで使いやすい形に整えるファイル。
(function (global) {
  "use strict";
  const D = global.GAME_DATA;
  const C = global.Config;

  const STAT_KEYS = ["hp", "str", "mag", "skl", "spd", "lck", "def", "res"];
  const STAT_LABELS = { hp: "HP", str: "力", mag: "魔力", skl: "技", spd: "速さ", lck: "幸運", def: "守備", res: "魔防", con: "体格" };
  const CATEGORY_LABELS = {
    sword: "剣", lance: "槍", axe: "斧", bow: "弓", knife: "軽器",
    flame: "炎", thunder: "雷", wind: "風", light: "光", laguz: "化身",
  };

  // 「アクスナイト(女)」→「アクスナイト」
  function baseClassName(name) {
    return name.replace(/[((].*$/, "");
  }

  // ---- 武器 ----
  function parseWeapon(raw, category) {
    const effect = raw.effect || "";
    const parts = effect.split("/");
    let targets = [];
    for (const p of parts) {
      const m = p.match(/^(.+)に特効$/);
      if (m) targets = targets.concat(m[1].split("・"));
    }
    targets = targets.concat(C.categoryEffectiveTargets[category] || []);
    const num = (re) => { const m = effect.match(re); return m ? Number(m[1]) : 0; };
    let status = null;
    if (effect.includes("ポイズン付与")) status = "ポイズン";
    if (effect.includes("燃焼付与")) status = "燃焼";
    const statBonus = {};
    for (const [label, key] of [["幸運", "lck"], ["守備", "def"], ["魔防", "res"], ["技", "skl"], ["力", "str"], ["速さ", "spd"]]) {
      const v = num(new RegExp("(?:^|/)" + label + "\\+(\\d+)"));
      if (v) statBonus[key] = v;
    }
    return {
      id: category + ":" + raw.name,
      name: raw.name,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      might: raw.might,
      hit: raw.hit,
      crit: raw.crit,
      weight: raw.weight,
      weaponLv: raw.weaponLv,
      effect: raw.effect,
      custom: !!raw.custom,
      exclusive: !!raw.exclusive,
      isMagic: C.magicCategories.includes(category) || !!raw.magicDamage,
      effectiveTargets: Array.from(new Set(targets)),
      brave: effect.includes("2回攻撃"),
      noCrit: effect.includes("必殺が出ない"),
      drain: effect.includes("敵に与えたダメージ分"),
      status,
      alwaysFirst: effect.includes("必ず先攻"),
      critBonus: num(/必殺率\+(\d+)/),
      avoidBonus: num(/回避\+(\d+)/),
      statBonus,
      selfDamage: !!raw.selfDamage,
      weaponSkill: raw.weaponSkill || null,
    };
  }

  const weapons = {};        // id → 武器
  const weaponsByCategory = {}; // category → 抽選対象の武器(専用・攻城兵器を除く)
  for (const [category, file] of Object.entries(D.weapons)) {
    weaponsByCategory[category] = [];
    for (const raw of file.weapons) {
      const w = parseWeapon(raw, category);
      weapons[w.id] = w;
      if (!w.exclusive) weaponsByCategory[category].push(w);
    }
  }

  function weaponRarity(w) {
    if (w.custom) return C.rarityCustom;
    if (w.weaponLv && C.rarityByLv[w.weaponLv]) return C.rarityByLv[w.weaponLv];
    // 武器LVのない軽器:威力で判断
    return w.might <= 4 ? 10 : 5;
  }

  // 表示用のレア度(★の数)
  function weaponStars(w) {
    if (w.category === "laguz") return 0;
    const r = weaponRarity(w);
    return r >= 8 ? 1 : r >= 5 ? 2 : r >= 3 ? 3 : r >= 2 ? 4 : 5;
  }

  // 特効の判定:武器の対象名に、クラス名(男女表記を除く)か種族名(獣牙族など)が入っているか
  function isEffective(weapon, className) {
    const cls = classByName[className];
    const names = [baseClassName(className)];
    if (cls && cls.tribe) names.push(cls.tribe);
    return names.some((n) => weapon.effectiveTargets.includes(n));
  }

  // ---- 職業 ----
  const byName = (list) => Object.fromEntries(list.map((c) => [c.name, c]));
  const maxByName = byName(D.classesMax.classes);
  const growthByName = byName(D.classesGrowth.classes);
  const weaponTypesByName = Object.fromEntries(D.classWeaponTypes.classWeaponTypes.map((c) => [c.class, c.weaponCategories]));

  const rawByName = byName(D.classesRaw.classes);
  const pickStats = (src) => Object.fromEntries(STAT_KEYS.map((k) => [k, src[k]]));
  const pickMax = (name) => Object.fromEntries(STAT_KEYS.map((k) => [k, maxByName[name][k + "Max"]]));

  const beorc = D.classesBase.classes
    .filter((c) => !c.excludeFromPool)
    .map((c) => {
      const categories = weaponTypesByName[c.name] || [];
      const groups = new Set(categories.map((k) => (["flame", "thunder", "wind"].includes(k) ? "magic" : k)));
      if (c.moveType === "飛行") groups.add("flying");
      if (c.moveType === "重装") groups.add("armor");
      if (c.moveType === "騎馬") groups.add("cavalry");
      return {
        name: c.name,
        race: "ベオク",
        gender: c.gender || "共用",
        tribe: null,
        base: pickStats(c),
        max: pickMax(c.name),
        growth: pickStats(growthByName[c.name]),
        con: D.classesCon.classes[c.name] ?? 7,
        moveType: c.moveType,
        effectivenessTags: c.effectivenessTags || [],
        weaponCategories: categories,
        groups: Array.from(groups),
      };
    });

  // ラグズ:base/max/growth は化身前の値。化身すると transform の分だけ上がる(上限は化身後の上限)
  const laguz = D.laguzClasses.classes.map((c) => {
    const tBase = pickStats(rawByName[c.name]);
    const uBase = pickStats(rawByName[c.untransformed]);
    return {
      name: c.name,
      untransformedName: c.untransformed,
      race: "ラグズ",
      gender: c.gender,
      tribe: c.tribe,
      base: uBase,
      max: pickMax(c.untransformed),
      growth: pickStats(growthByName[c.untransformed]),
      transform: Object.fromEntries(STAT_KEYS.map((k) => [k, tBase[k] - uBase[k]])),
      transformedMax: pickMax(c.name),
      con: D.classesCon.classes[c.name] ?? 9,
      moveType: c.moveType,
      effectivenessTags: c.effectivenessTags || [],
      weaponCategories: ["laguz"],
      fixedWeapon: "laguz:" + c.weapon,
      banned: !!c.banned, // 出禁(生成されない・バトルに出せない)
      // 化身ゲージ初期値のボーナス(v1.3.3:クラス別を優先。タカ+8・カラス+10)
      gaugeBonus: (D.laguzClasses.gaugeBonusByClass || {})[c.name] ?? ((D.laguzClasses.gaugeBonusByTribe || {})[c.tribe] || 0),
      groups: [c.colorGroup],
    };
  });

  const classes = beorc.concat(laguz);
  const classByName = byName(classes);

  // ---- スキル・属性 ----
  const skills = D.skills.skills;
  const elementBonus = D.elementBonus.elements;

  global.GameDB = {
    STAT_KEYS, STAT_LABELS, CATEGORY_LABELS,
    weapons, weaponsByCategory, weaponRarity, weaponStars, isEffective, laguzInfo: D.laguzClasses,
    classes, classByName, baseClassName,
    skills, elementBonus,
  };
})(window);
