// v1.4.0:キャラ作成の「ランダムで生み出す」。全項目(名前・性別・種族・漢字・色・生年月日)をランダムに決める。
// ここで決めるのは「入力」だけ。キャラそのものは今までどおり Generator が入力から必ず同じに作る。
(function (global) {
  "use strict";
  const C = global.Config;

  // 名前は音のパーツを組み合わせて作る(カタカナ・6文字以内・漢字なし)
  const NAME_PARTS = {
    男: {
      head: ["アル", "ベル", "カイ", "ダン", "エル", "ガル", "ハイ", "イヴァ", "ジェ", "ケイ", "ラン", "マル", "ノル", "オス", "ロー", "セド",
        "ティ", "ヴァ", "ウル", "ゼノ", "フェ", "グレ", "レイ", "シグ", "ディ", "バル", "クロ", "ギル", "ヘク", "ラウ", "ミル", "トー"],
      mid: ["", "", "", "ル", "ド", "ガ", "レ", "ナ", "ベ", "ヴィ"],
      tail: ["ス", "ド", "ン", "ク", "ト", "ル", "ロ", "ム", "ガー", "ベルト", "ヴィン", "リック", "ランド", "ウス", "ネス", "ロス", "ハルト", "ディン", "ザー", "ドル"],
    },
    女: {
      head: ["ア", "エ", "リ", "ミ", "セ", "ル", "フィ", "ソ", "ノ", "カ", "ティ", "ユ", "レ", "マ", "イ", "シ", "ヴィ", "ロ", "メ", "クラ"],
      mid: ["", "リ", "ル", "ナ", "ラ", "レ", "ミ", "シ", "ネ", "ゼ"],
      tail: ["ア", "ナ", "ネ", "ル", "ラ", "リア", "エル", "ーナ", "ッタ", "ーヌ", "ティア", "ーシャ", "ン", "ディア", "リス", "ベル"],
    },
  };
  // 好きな漢字の候補
  const KANJI = Array.from("剣炎龍雷風光闇月星華蒼刃鋼翼牙獅虎鷹狼桜雪氷海空天地心愛勇誠義忍静烈迅轟覇煌凛紅碧翠金銀夢想希魂鬼神聖魔影嵐波岳森花蓮鈴舞歌剛鉄盾弓槍斧罵夜朝陽燕鳳麗柔智武王");
  // 種族の出やすさ(ベオク:ラグズ = 3:1)
  const RACE_WEIGHT = { ベオク: 3, ラグズ: 1 };

  const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

  function randomName(gender, rand = Math.random) {
    const p = NAME_PARTS[gender] || NAME_PARTS.男;
    for (let i = 0; i < 30; i++) {
      const body = pick(rand, p.head) + pick(rand, p.mid);
      const tail = pick(rand, p.tail);
      const name = body + tail;
      const len = Array.from(name).length;
      if (len < 2 || len > Math.min(6, C.nameMaxLength)) continue;
      if (/[ーッン]$/.test(body) && /^[ーッン]/.test(tail)) continue; // 「ンー」「ーッ」のような並びは避ける
      if (/(.)\1/.test(name)) continue; // 同じ文字の連続は避ける
      return name;
    }
    return pick(rand, p.head) + "ス";
  }

  function randomBirthdate(rand = Math.random) {
    const y = 1960 + Math.floor(rand() * 53); // 1960〜2012
    const m = 1 + Math.floor(rand() * 12);
    const days = new Date(y, m, 0).getDate();
    const d = 1 + Math.floor(rand() * days);
    return `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`;
  }

  // 戻り値:Generator.normalizeInputs にそのまま渡せる入力
  // keep:すでに決まっている項目(v1.4.1)。入っている項目はそのまま使い、ほかだけランダムに決める
  function randomInputs(rand = Math.random, keep = {}) {
    const gender = keep.gender || pick(rand, C.genders);
    let race = keep.race;
    if (!race) {
      const races = C.races.map((r) => r.name);
      const total = races.reduce((s, r) => s + (RACE_WEIGHT[r] || 1), 0);
      let x = rand() * total;
      race = races[0];
      for (const r of races) { x -= RACE_WEIGHT[r] || 1; if (x < 0) { race = r; break; } }
    }
    return {
      name: keep.name || randomName(gender, rand),
      gender,
      race,
      kanji: keep.kanji || pick(rand, KANJI),
      color: keep.color || pick(rand, C.colors).name,
      birthdate: keep.birthdate || randomBirthdate(rand),
    };
  }

  global.RandomChar = { randomInputs, randomName, randomBirthdate, KANJI };
})(window);
