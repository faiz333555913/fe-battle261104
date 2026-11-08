// キャラの保存(ブラウザの localStorage)と、JSONファイルへの書き出し・読み込み。
(function (global) {
  "use strict";
  const KEY = "arenaBattle.characters.v1";

  function list() {
    let arr;
    try {
      arr = JSON.parse(global.localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(arr)) return [];
    } catch (e) {
      return [];
    }
    // v1.4.3:印がまだないキャラ(v1.4.2以前に作った・読み込んだキャラ)には、入力から決まる印をつけて保存し直す
    // v1.4.4:印の対象が増えたので、前のルールでつけた印も決め直す。ラグズの化身後の能力値(虎の速さ+1)も計算し直す
    const G = global.Generator;
    if (G) {
      let dirty = false;
      for (const c of arr) {
        if (G.needsMarks(c)) { G.ensureMarks(c); dirty = true; }
        if (G.refreshLaguzStats(c)) dirty = true;
      }
      if (dirty) { try { write(arr); } catch (e) { /* 保存できなくても動く */ } }
    }
    return arr;
  }

  function write(arr) {
    global.localStorage.setItem(KEY, JSON.stringify(arr));
  }

  function find(id) {
    return list().find((c) => c.id === id) || null;
  }

  // v1.4.3:書き出していないキャラがいるか(作成・読み込みで保存したら印をつけ、書き出したら消す)
  const UNEXPORTED_KEY = "arenaBattle.unexported";
  function setUnexported(on) {
    try { global.localStorage.setItem(UNEXPORTED_KEY, on ? "1" : "0"); } catch (e) { /* 保存できなくても動く */ }
  }
  function hasUnexported() {
    try { return global.localStorage.getItem(UNEXPORTED_KEY) === "1" && list().length > 0; } catch (e) { return false; }
  }

  // 戻り値: "saved" | "exists"
  function save(char) {
    const arr = list();
    if (arr.some((c) => c.id === char.id)) return "exists";
    arr.push({ ...char, savedAt: new Date().toISOString() });
    write(arr);
    setUnexported(true);
    return "saved";
  }

  // v1.6.0:アーケード達成の★(1=10体目まで勝ち抜いた、2=EXTRAのイナも倒した)。今より多いときだけ書きかえる
  function markArcade(id, stars) {
    const arr = list();
    const c = arr.find((x) => x.id === id);
    if (!c || (c.arcade || 0) >= stars) return false;
    c.arcade = stars;
    write(arr);
    setUnexported(true); // 書き出し(JSON)にも★を残せるように
    return true;
  }

  function remove(id) {
    write(list().filter((c) => c.id !== id));
  }

  function exportJson() {
    setUnexported(false);
    return JSON.stringify({ app: "arena-battle", version: 1, characters: list() }, null, 2);
  }

  // v1.4.5:登録済みかの判定。キャラのID(入力から決まる)が同じか、入力(名前・性別・種族・漢字・色・生年月日)が同じなら登録済み
  const inputKey = (c) => {
    const i = c && c.inputs;
    return i ? [i.name, i.gender, i.race, i.kanji, i.color, i.birthdate].join("|") : null;
  };
  const isValid = (c) => !!(c && typeof c.id === "string" && c.stats && Array.isArray(c.weapons) && c.className);
  function parseIncoming(text) {
    const data = JSON.parse(text);
    const incoming = Array.isArray(data) ? data : data && data.characters;
    if (!Array.isArray(incoming)) throw new Error("キャラのデータが見つかりません");
    return incoming;
  }

  // v1.4.5:読み込む前の確認用。ファイルのキャラを「new(新しい)」「exists(登録済み)」「dup(ファイル内で重複)」「invalid(形式違い)」に分ける
  // 戻り値:{ items: [{ name, className, state }] }。形式がおかしいときは例外を投げる
  function importPlan(text) {
    const incoming = parseIncoming(text);
    const arr = list();
    const ids = new Set(arr.map((c) => c.id));
    const keys = new Set(arr.map(inputKey).filter(Boolean));
    const seenIds = new Set(), seenKeys = new Set();
    const items = incoming.map((c) => {
      const base = { name: (c && c.name) || "?", className: (c && c.className) || "" };
      if (!isValid(c)) return { ...base, state: "invalid" };
      const k = inputKey(c);
      if (ids.has(c.id) || (k && keys.has(k))) return { ...base, state: "exists" };
      if (seenIds.has(c.id) || (k && seenKeys.has(k))) return { ...base, state: "dup" };
      seenIds.add(c.id);
      if (k) seenKeys.add(k);
      return { ...base, state: "new" };
    });
    return { items };
  }

  // 戻り値: { added, skipped }。形式がおかしいときは例外を投げる
  // pick(v1.4.5):読み込むキャラの番号(ファイルの中の順番)。省略するとすべての新しいキャラ
  function importJson(text, pick) {
    const incoming = parseIncoming(text);
    const arr = list();
    const only = Array.isArray(pick) ? new Set(pick) : null;
    let added = 0, skipped = 0;
    incoming.forEach((c, idx) => {
      const k = isValid(c) ? inputKey(c) : null;
      const exists = isValid(c) && arr.some((x) => x.id === c.id || (k && inputKey(x) === k));
      if (!isValid(c) || exists || (only && !only.has(idx))) { skipped++; return; }
      if (global.Generator) { // 印(錬成)は入力から決まるので計算し直す。ラグズの化身後の能力値も今のルールで
        delete c.marksVersion; global.Generator.ensureMarks(c);
        global.Generator.refreshLaguzStats(c);
      }
      arr.push(c);
      added++;
    });
    write(arr);
    return { added, skipped };
  }

  global.Storage_ = { list, find, save, remove, markArcade, exportJson, importJson, importPlan, hasUnexported };
})(window);
