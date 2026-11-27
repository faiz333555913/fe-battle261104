// シード付き疑似乱数(キャラ生成用)。Math.random() は使わない。
// 同じ文字列を入れれば、必ず同じ乱数列が出る。
(function (global) {
  "use strict";

  // 文字列 → 128bit ハッシュ(cyrb128)
  function hashString(str) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0; i < str.length; i++) {
      const k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= h2 ^ h3 ^ h4; h2 ^= h1; h3 ^= h1; h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
  }

  // sfc32: 0以上1未満の数を返す関数を作る
  function sfc32(a, b, c, d) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      let t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }

  // 0以上1未満を返す関数(next)を包んで、便利な関数をつける
  function wrap(next) {
    return {
      next,
      int(min, max) { return min + Math.floor(next() * (max - min + 1)); }, // min〜max(両端含む)
      percent(p) { return next() * 100 < p; },                              // p% で true
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      weightedPick(items, weightOf) {
        const total = items.reduce((s, x) => s + weightOf(x), 0);
        let r = next() * total;
        for (const x of items) {
          r -= weightOf(x);
          if (r < 0) return x;
        }
        return items[items.length - 1];
      },
    };
  }

  function createSeededRng(seedString) {
    const [a, b, c, d] = hashString(seedString);
    const next = sfc32(a, b, c, d);
    for (let i = 0; i < 15; i++) next(); // 立ち上がりの偏りを捨てる
    return wrap(next);
  }

  // 対戦用(バイオリズム・スキル・命中判定)。テスト時は差し替えできる。
  function createBattleRng(nextFn) {
    return wrap(nextFn || Math.random);
  }

  global.Rng = { hashString, createSeededRng, createBattleRng };
})(window);
