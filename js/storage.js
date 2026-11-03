// キャラの保存(ブラウザの localStorage)と、JSONファイルへの書き出し・読み込み。
(function (global) {
  "use strict";
  const KEY = "arenaBattle.characters.v1";

  function list() {
    try {
      const arr = JSON.parse(global.localStorage.getItem(KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function write(arr) {
    global.localStorage.setItem(KEY, JSON.stringify(arr));
  }

  function find(id) {
    return list().find((c) => c.id === id) || null;
  }

  // 戻り値: "saved" | "exists"
  function save(char) {
    const arr = list();
    if (arr.some((c) => c.id === char.id)) return "exists";
    arr.push({ ...char, savedAt: new Date().toISOString() });
    write(arr);
    return "saved";
  }

  function remove(id) {
    write(list().filter((c) => c.id !== id));
  }

  function exportJson() {
    return JSON.stringify({ app: "arena-battle", version: 1, characters: list() }, null, 2);
  }

  // 戻り値: { added, skipped }。形式がおかしいときは例外を投げる
  function importJson(text) {
    const data = JSON.parse(text);
    const incoming = Array.isArray(data) ? data : data.characters;
    if (!Array.isArray(incoming)) throw new Error("キャラのデータが見つかりません");
    const arr = list();
    let added = 0, skipped = 0;
    for (const c of incoming) {
      const valid = c && typeof c.id === "string" && c.stats && Array.isArray(c.weapons) && c.className;
      if (!valid || arr.some((x) => x.id === c.id)) { skipped++; continue; }
      arr.push(c);
      added++;
    }
    write(arr);
    return { added, skipped };
  }

  global.Storage_ = { list, find, save, remove, exportJson, importJson };
})(window);
