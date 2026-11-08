// 画面の切り替えと操作。
(function (global) {
  "use strict";
  const C = global.Config;
  const DB = global.GameDB;
  const G = global.Generator;
  const B = global.Battle;
  const S = global.Storage_;
  const UI = global.UI;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const battleRng = global.Rng.createBattleRng();
  const T_ = global.Tournament;
  // v1.5.0:トーナメント。tourState:進行中のトーナメント(ブラウザに保存)/ tourMatch:いまバトル準備をしている試合
  let tourState = null;
  let tourMatch = null;
  // v1.6.0:アーケード。arcState:進行中のアーケード(ブラウザに保存)/ arcMatch:いまバトル準備をしている試合 { stage }
  const A_ = global.Arcade;
  let arcState = null;
  let arcMatch = null;

  // ================= 画面切り替え =================
  function goto(name) {
    stopBattle();
    if (name !== "prep" && name !== "battle") { tourMatch = null; arcMatch = null; } // トーナメント・アーケードの試合の準備をやめた
    $$(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + name));
    $("#nav-home").hidden = name === "title";
    if (name === "title") enterMenu();
    if (name === "list") renderList();
    if (name === "prep") renderPrep();
    if (name === "tsetup") renderTourSetup();
    if (name === "tour") renderTour();
    if (name === "asetup") renderArcSetup();
    if (name === "arcade") renderArcade();
    if (name === "howto") $("#screen-howto").scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // ================= タイトル(v1.4.0) =================
  // PRESS START → 押すと速く点滅 → ゆっくり暗転 → メニューが左右からスライドして中央で止まる
  const titleScreen = $("#screen-title");
  const reduceMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const wait_ = (ms) => new Promise((r) => setTimeout(r, ms));
  function enterMenu() {
    if (titleScreen.dataset.stage === "press") return;
    titleScreen.dataset.stage = "menu"; // v1.5.0:モード選択から戻ったときもメニューに
    modeBusy = false;
    const menu = $(".title-menu", titleScreen);
    $$(".exit", titleScreen).forEach((b) => b.classList.remove("exit", "exit-l", "exit-r"));
    $$(".title-menu .btn", titleScreen).forEach((b) => { b.style.animationDelay = ""; });
    menu.classList.remove("enter");
    void menu.offsetWidth; // アニメーションをやり直す
    menu.classList.add("enter");
  }
  let pressing = false;
  async function pressStart() {
    if (pressing || titleScreen.dataset.stage !== "press") return;
    pressing = true;
    const fade = $("#title-fade");
    if (!reduceMotion()) {
      // v1.4.1:押すと点滅し、同時に2秒かけて少しずつ暗転
      $("#press-start").classList.add("pressed");
      fade.classList.remove("out");
      fade.classList.add("on");
      await wait_(2000);
    }
    titleScreen.dataset.stage = "menu";
    enterMenu();
    fade.classList.add("out");
    fade.classList.remove("on");
    pressing = false;
  }
  // ================= モード選択(v1.5.0) =================
  // 「バトル」を押すと、メニューの項目が左右の端へ引っ込み(左から来た項目は左へ、右から来た項目は右へ)、
  // そのあと「闘技場」「トーナメント」「アーケード」「もどる」が左右の端から出てくる。原作の流れだけを参考にした、オリジナルの見た目
  // v1.6.0:出てくる動きは、タイトルのメニュー(キャラ作成〜遊び方)とまったく同じ(同じ動き・同じ速さ)。
  //         引っ込むときも出てくるときも、すべての項目が同じタイミングでスライドする(前は1つずつずらしていた)
  let modeBusy = false;
  async function slideOut(buttons) {
    if (reduceMotion()) return;
    buttons.forEach((b) => {
      b.style.animationDelay = "";
      b.classList.add("exit", b.classList.contains("slide-r") ? "exit-r" : "exit-l");
    });
    await wait_(330);
  }
  function slideIn(nav) {
    $$(".btn", nav).forEach((b) => { b.style.animationDelay = ""; b.classList.remove("exit", "exit-l", "exit-r"); });
    nav.classList.remove("enter");
    void nav.offsetWidth;
    nav.classList.add("enter");
  }
  async function openModeMenu() {
    if (modeBusy || titleScreen.dataset.stage !== "menu") return;
    modeBusy = true;
    await slideOut($$(".title-menu .btn", titleScreen));
    if (titleScreen.dataset.stage !== "menu") { modeBusy = false; return; }
    updateTourButton();
    updateArcButton();
    titleScreen.dataset.stage = "mode";
    slideIn($(".mode-menu", titleScreen));
    modeBusy = false;
  }
  async function closeModeMenu() {
    if (modeBusy || titleScreen.dataset.stage !== "mode") return;
    modeBusy = true;
    await slideOut($$(".mode-menu .btn", titleScreen));
    if (titleScreen.dataset.stage !== "mode") { modeBusy = false; return; }
    enterMenu();
  }
  // トーナメントは、出られるキャラが8人以上いないと選べない(途中のトーナメントがあれば続きから)
  function updateTourButton() {
    const n = S.list().filter((c) => !isBanned(c)).length;
    const btn = $("#btn-mode-tour");
    const saved = loadTour();
    btn.disabled = n < global.Tournament.MIN && !saved;
    $("#tour-mode-note").textContent = saved ? (saved.done ? "結果を見る" : "続きから") : n < global.Tournament.MIN ? `キャラが8人以上必要(いま${n}人)` : "8〜16人で順位を決める";
  }
  // v1.6.0:アーケードは、出られるキャラが1人いれば選べる(途中のアーケードがあれば続きから)
  function updateArcButton() {
    const n = S.list().filter((c) => !isBanned(c)).length;
    const saved = loadArc();
    $("#btn-mode-arcade").disabled = n < 1 && !saved;
    $("#arc-mode-note").textContent = saved ? (saved.done ? "結果を見る" : `続きから(${A_.stageName(saved.stage)})`) : n < 1 ? "キャラが必要です" : "1人で11連戦を勝ち抜く";
  }
  $("#btn-battle-mode").addEventListener("click", openModeMenu);
  $("#btn-mode-back").addEventListener("click", closeModeMenu);
  $("#btn-mode-arena").addEventListener("click", () => { if (!modeBusy) { tourMatch = null; goto("prep"); } });
  $("#btn-mode-tour").addEventListener("click", () => {
    if (modeBusy) return;
    tourMatch = null;
    goto(loadTour() ? "tour" : "tsetup");
  });
  $("#btn-mode-arcade").addEventListener("click", () => {
    if (modeBusy) return;
    arcMatch = null;
    goto(loadArc() ? "arcade" : "asetup");
  });

  // 画面のどこを押しても始まる
  document.addEventListener("click", () => { if (titleScreen.classList.contains("active")) pressStart(); });
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && titleScreen.classList.contains("active") && titleScreen.dataset.stage === "press") { e.preventDefault(); pressStart(); }
  });
  // 背景の光の粒
  $("#title-sparks").innerHTML = Array.from({ length: 22 }, (_, i) => {
    const left = (i * 37) % 100, dur = 7 + (i * 5) % 9, delay = -((i * 3.1) % dur), dx = ((i * 13) % 60) - 30, size = 2 + (i % 3);
    return `<i style="left:${left}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${delay}s;--dx:${dx}px"></i>`;
  }).join("");
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-goto]");
    if (t) goto(t.dataset.goto);
  });

  // ================= キャラ作成 =================
  const form = $("#create-form");
  $("#color-picker").innerHTML = C.colors.map((c, i) => `
    <label class="swatch" title="${c.name}">
      <input type="radio" name="color" value="${c.name}">
      <span style="--c:${c.hex}"></span><em>${c.name}</em>
    </label>`).join("");
  $("#gender-picker").innerHTML = C.genders.map((g, i) => `
    <label class="choice"><input type="radio" name="gender" value="${g}"><span>${g === "男" ? "♂ 男" : "♀ 女"}</span></label>`).join("");
  $("#race-picker").innerHTML = C.races.map((r, i) => `
    <label class="choice"><input type="radio" name="race" value="${r.name}"><span>${r.name}</span></label>`).join("");
  function updateRaceNote() {
    const r = C.races.find((x) => x.name === form.elements.race.value);
    $("#race-note").textContent = r ? r.note : "";
  }
  form.addEventListener("change", (e) => { if (e.target.name === "race") updateRaceNote(); });
  updateRaceNote();

  // v1.4.1:ランダムで生み出す。自分で入力・選択した項目はそのまま使い、空いている項目だけランダムに決める
  // (前回ランダムで入った項目は、自分で変えていなければ次もランダムに引き直す)
  const randomFilled = new Set();
  const markUser = (e) => { if (e.target.name) randomFilled.delete(e.target.name); };
  form.addEventListener("input", markUser);
  form.addEventListener("change", markUser);
  form.addEventListener("click", (e) => { if (e.target.matches('input[type="radio"]')) randomFilled.delete(e.target.name); });
  // v1.4.3:「ランダムで生み出す」はすべての項目をランダムに、「空欄をランダムで生み出す」(v1.4.3の「一部ランダムで生み出す」を v1.4.4 で改名)は空いている項目だけ
  // v1.4.5:「ランダムで生み出す」は「空欄をランダムで生み出す」と役割がかぶるため削除(空欄が全部なら同じ動き)
  $("#btn-random-part").addEventListener("click", () => randomCreate(true));
  function randomCreate(partial) {
    const fd = new FormData(form);
    const current = {};
    for (const k of ["name", "gender", "race", "kanji", "color", "birthdate"]) {
      const v = String(fd.get(k) ?? "").trim();
      if (partial && v && !randomFilled.has(k)) current[k] = v;
    }
    const r = global.RandomChar.randomInputs(Math.random, current);
    for (const k of ["name", "kanji", "birthdate"]) {
      if (k in current) continue;
      form.elements[k].value = r[k];
      randomFilled.add(k);
    }
    for (const k of ["gender", "race", "color"]) {
      if (k in current) continue;
      $$(`input[name="${k}"]`, form).forEach((x) => { x.checked = x.value === r[k]; });
      randomFilled.add(k);
    }
    updateRaceNote();
    if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event("submit", { cancelable: true }));
  }

  // v1.4.1:レベルアップ演出のON/OFF(OFFは v1.3.4 と同じく結果をすぐ表示)。ブラウザに覚えておく
  const LU_KEY = "arenaBattle.levelUpFx";
  const luToggle = $("#toggle-levelup");
  try { luToggle.checked = global.localStorage.getItem(LU_KEY) !== "off"; } catch (e) { luToggle.checked = true; }
  luToggle.addEventListener("change", () => {
    try { global.localStorage.setItem(LU_KEY, luToggle.checked ? "on" : "off"); } catch (e) { /* 保存できなくても動く */ }
  });

  let lastGenerated = null;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const res = G.normalizeInputs({
      name: fd.get("name"), gender: fd.get("gender"), race: fd.get("race"),
      kanji: fd.get("kanji"), color: fd.get("color"), birthdate: fd.get("birthdate"),
    });
    $$("[data-error]", form).forEach((el) => { el.textContent = (res.errors && res.errors[el.dataset.error]) || ""; });
    if (!res.ok) return;
    // 正規化した値を入力欄に戻す(全角数字などを統一して見せる)
    form.elements.name.value = res.value.name;
    form.elements.kanji.value = res.value.kanji;
    form.elements.birthdate.value = res.value.birthdate;
    lastGenerated = G.generateCharacter(res.value);
    const saved = !!S.find(lastGenerated.id);
    $("#create-result").innerHTML = `<div class="reveal">${UI.charCard(lastGenerated, `
      <div class="card-actions">
        <button type="button" class="btn btn-main" id="btn-save" ${saved ? "disabled" : ""}>${saved ? "保存済み" : "このキャラを保存"}</button>
        <span class="message" id="save-message"></span>
      </div>`)}</div>`;
    if (luToggle.checked) playLevelUp(lastGenerated);
  });

  // ================= レベルアップ演出(v1.4.0) =================
  // Lv1 → Lv20(ラグズはLv10)。上がった能力を1つずつ「+N ▲」で見せる。タップで飛ばす/閉じる
  let luRun = 0;
  async function playLevelUp(char) {
    const ov = $("#levelup");
    const from = char.statsLv1;
    const to = char.statsHuman || char.stats;
    if (!from) return;
    const run = ++luRun;
    let skip = reduceMotion();
    let wake = null; // タップしたら、待っている途中でもすぐ飛ばす(v1.4.1)
    const wait = async (ms) => {
      if (!skip) await new Promise((r) => { wake = r; setTimeout(r, ms); });
      return run === luRun;
    };
    $("#lu-name").textContent = char.name;
    $("#lu-class").textContent = char.className;
    $(".lu-banner", ov).textContent = "LEVEL UP!"; // v1.6.0:アーケードのクラスチェンジで書きかえるため
    const lvEl = $("#lu-lv");
    lvEl.textContent = 1;
    $("#lu-stats").innerHTML = DB.STAT_KEYS.map((k) =>
      `<div class="lu-stat" data-k="${k}"><span class="k">${DB.STAT_LABELS[k]}</span><span class="v">${from[k]}</span><span class="up">+${to[k] - from[k]}</span></div>`).join("");
    $("#lu-hint").textContent = "タップで飛ばす";
    ov.dataset.done = "0";
    ov.hidden = false;
    ov.onclick = () => { if (ov.dataset.done === "1") { ov.hidden = true; luRun++; } else { skip = true; if (wake) wake(); } };
    if (!(await wait(700))) return;
    // レベルの数字を数え上げる
    for (let lv = 2; lv <= char.level; lv++) {
      lvEl.textContent = lv;
      if (!skip) { lvEl.classList.remove("bump"); void lvEl.offsetWidth; lvEl.classList.add("bump"); }
      if (!(await wait(45))) return;
    }
    if (!(await wait(400))) return;
    // 上がった能力を1つずつ
    for (const k of DB.STAT_KEYS) {
      if (to[k] <= from[k]) continue;
      const row = $(`.lu-stat[data-k="${k}"]`, ov);
      $(".v", row).textContent = to[k];
      row.classList.add("got");
      if (!(await wait(330))) return;
    }
    ov.dataset.done = "1";
    $("#lu-hint").textContent = "タップで閉じる";
  }
  $("#create-result").addEventListener("click", (e) => {
    if (e.target.id !== "btn-save" || !lastGenerated) return;
    const r = S.save(lastGenerated);
    e.target.disabled = true;
    e.target.textContent = "保存済み";
    $("#save-message").textContent = r === "saved" ? "保存しました。キャラ一覧・バトルで使えます。" : "このキャラはすでに保存されています。";
  });

  // ================= キャラ一覧(左:リスト / 右:詳細) =================
  let selectedId = null;
  // v1.4.3:並び順。"new"=新着(保存した順・これまでと同じ)/"class"=クラス順/"c:職業名"=そのクラスだけ
  let listSort = "new";
  const classOrder = DB.classes.map((c) => c.name);
  function sortedChars(all) {
    if (listSort === "class") {
      return all.map((c, i) => ({ c, i })).sort((a, b) => {
        const ca = classOrder.indexOf(a.c.className), cb = classOrder.indexOf(b.c.className);
        return ca !== cb ? ca - cb : a.i - b.i;
      }).map((x) => x.c);
    }
    if (listSort.startsWith("c:")) return all.filter((c) => c.className === listSort.slice(2));
    return all;
  }
  function renderSortOptions(all) {
    const sel = $("#list-sort");
    const classes = classOrder.filter((n) => all.some((c) => c.className === n));
    if (listSort.startsWith("c:") && !classes.includes(listSort.slice(2))) listSort = "new";
    sel.innerHTML = `<option value="new">新着</option><option value="class">クラス順</option>`
      + (classes.length ? `<optgroup label="クラス指定">${classes.map((n) => `<option value="c:${UI.esc(n)}">${UI.esc(n)}(${all.filter((c) => c.className === n).length})</option>`).join("")}</optgroup>` : "");
    sel.value = listSort;
  }
  function renderList() {
    const all = S.list();
    renderSortOptions(all);
    const chars = sortedChars(all);
    if (!chars.some((c) => c.id === selectedId)) selectedId = chars.length ? chars[0].id : null;
    $("#list-count").textContent = `保存しているキャラ:${all.length}体${chars.length !== all.length ? `(表示:${chars.length}体)` : ""}`;
    $("#char-list").innerHTML = chars.length
      ? chars.map((c) => `<li data-id="${UI.esc(c.id)}" class="${c.id === selectedId ? "selected" : ""}" tabindex="0">
          ${UI.charIcon(c, "small")}
          <div class="li-text"><div class="li-name">${UI.esc(c.name)}${UI.genderMark(c)}</div>
          <div class="li-sub">${UI.esc(c.className)}</div></div>
        </li>`).join("")
      : `<li class="empty">まだキャラがいません。<button type="button" class="link-btn" data-goto="create">キャラ作成</button>から作ってみましょう。</li>`;
    const sel = chars.find((c) => c.id === selectedId);
    $("#char-detail").innerHTML = sel
      ? `${UI.charCard(sel)}<div class="card-actions"><button type="button" class="btn btn-danger" id="btn-delete" data-id="${UI.esc(sel.id)}">このキャラを削除</button></div>`
      : "";
  }
  function listMessage(text) {
    const m = $("#list-message");
    m.textContent = text;
    m.hidden = !text;
  }
  $("#list-sort").addEventListener("change", (e) => { listSort = e.target.value; renderList(); });
  $("#char-list").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    selectedId = li.dataset.id;
    renderList();
  });
  $("#char-list").addEventListener("keydown", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectedId = li.dataset.id; renderList(); }
  });
  $("#char-detail").addEventListener("click", (e) => {
    const btn = e.target.closest("#btn-delete");
    if (!btn) return;
    if (btn.dataset.confirm !== "1") { // 1回目は確認
      btn.dataset.confirm = "1";
      btn.textContent = "本当に削除する?(もう一度押す)";
      return;
    }
    const c = S.find(btn.dataset.id);
    S.remove(btn.dataset.id);
    listMessage(`${c ? c.name : "キャラ"}を削除しました。`);
    renderList();
  });
  $("#btn-export").addEventListener("click", () => {
    if (!S.list().length) { listMessage("書き出すキャラがいません。"); return; }
    exportFile();
    listMessage("書き出しました(ダウンロードフォルダを確認してください)。");
  });
  function exportFile() {
    const blob = new Blob([S.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `arena-characters-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // v1.4.3:キャラを作って書き出しをしていないまま、キャラ一覧から「タイトルへ戻る」を押したら確認する
  const warnBox = $("#export-warn");
  $("#nav-home").addEventListener("click", (e) => {
    if (!$("#screen-list").classList.contains("active") || !S.hasUnexported()) return;
    e.stopPropagation(); // タイトルへはまだ戻らない
    warnBox.hidden = false;
  }, true);
  warnBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-warn]");
    if (!b && e.target !== warnBox) return;
    const act = b ? b.dataset.warn : "cancel";
    warnBox.hidden = true;
    if (act === "export") exportFile();
    if (act === "export" || act === "skip") goto("title");
  });
  // v1.4.5:読み込む前に、ファイルの中のキャラを「新しいキャラ」「登録済み」に分けて見せる。
  // 登録済みかどうかはキャラのID(入力から決まる)と、入力(名前・性別・種族・漢字・色・生年月日)で判定。
  // 新しいキャラだけにチェックが入っていて、外すと読み込まない
  const importBox = $("#import-check");
  let importText = null;
  $("#input-import").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      e.target.value = "";
      let plan;
      try {
        plan = S.importPlan(reader.result);
      } catch (err) {
        listMessage("読み込みに失敗しました:ファイルの形式が正しくありません。");
        return;
      }
      importText = reader.result;
      showImportPlan(plan);
    };
    reader.readAsText(file);
  });
  function showImportPlan(plan) {
    const fresh = plan.items.filter((x) => x.state === "new").length;
    const cnt = (st) => plan.items.filter((x) => x.state === st).length;
    const other = cnt("dup") + cnt("invalid");
    $("#import-summary").textContent = `ファイルのキャラ:${plan.items.length}体(新しいキャラ ${fresh}体・登録済み ${cnt("exists")}体${other ? `・重複など ${other}体` : ""})`;
    const label = { new: "新しいキャラ", exists: "登録済み", dup: "ファイル内で重複", invalid: "形式違い" };
    $("#import-items").innerHTML = plan.items.map((x, i) => `<li class="imp-${x.state}">
        <label><input type="checkbox" data-i="${i}" ${x.state === "new" ? "checked" : "disabled"}>
        <span class="imp-name">${UI.esc(x.name)}<small>${UI.esc(x.className)}</small></span>
        <span class="imp-state">${label[x.state]}</span></label></li>`).join("");
    updateImportButton();
    importBox.hidden = false;
  }
  function updateImportButton() {
    const n = $$('#import-items input:checked').length;
    const b = $("#import-ok");
    b.textContent = `${n}体を読み込む`;
    b.disabled = n === 0;
  }
  $("#import-items").addEventListener("change", updateImportButton);
  importBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-imp]");
    if (!b && e.target !== importBox) return;
    if (b && b.disabled) return;
    const act = b ? b.dataset.imp : "cancel";
    importBox.hidden = true;
    if (act !== "ok" || importText == null) { importText = null; return; }
    const pick = $$('#import-items input:checked').map((x) => Number(x.dataset.i));
    try {
      const r = S.importJson(importText, pick);
      listMessage(`${r.added}体を新しく読み込みました。${r.skipped ? `(${r.skipped}体は登録済み・選ばなかった等のため読み込んでいません)` : ""}`);
    } catch (err) {
      listMessage("読み込みに失敗しました:ファイルの形式が正しくありません。");
    }
    importText = null;
    renderList();
  });

  // ================= バトル準備 =================
  const prep = { left: null, right: null }; // { charId, weaponId, bio, view }  view:ラグズの表示 "human"(化身前)/"transformed"(化身後)
  const rollBio = () => battleRng.pick(C.biorhythm);

  // 出禁の職業(赤竜など)はバトルに出せない
  const isBanned = (c) => !!(DB.classByName[c.className] && DB.classByName[c.className].banned);

  function renderPrep() {
    const chars = S.list().filter((c) => !isBanned(c));
    $("#prep-empty").hidden = chars.length > 0;
    $("#prep-body").hidden = chars.length === 0;
    renderTourInfo();
    // v1.6.0:アーケードの試合は、自分のキャラ(今のレベル)と敵が決まっている。敵の武器も決まっている
    if (arcMatch) {
      $("#prep-empty").hidden = true;
      $("#prep-body").hidden = false;
      const me = arcPlayer(), en = arcEnemy();
      const keep = prep.left && prep.left.charId === me.id && prep.left.arc;
      const w = (keep && prep.left.weaponId) || arcState.weapon;
      prep.left = { charId: me.id, weaponId: me.weapons.includes(w) ? w : me.weapons[0], bio: rollBio(), view: keep ? prep.left.view : "human", skill: null, arc: true };
      prep.right = { charId: en.id, weaponId: en.weapon, bio: rollBio(), view: "human", skill: null, arc: true };
      renderPrepSides();
      return;
    }
    if (!chars.length) return;
    // v1.5.0:トーナメントの試合は、戦う2人が決まっている(武器は前の試合で選んだもの)
    if (tourMatch) {
      const T = tourState;
      ["left", "right"].forEach((side) => {
        const id = side === "left" ? tourMatch.match.a : tourMatch.match.b;
        const c = S.find(id);
        const keep = prep[side] && prep[side].charId === id;
        const w = (keep && prep[side].weaponId) || T.weapons[id];
        prep[side] = { charId: id, weaponId: c.weapons.includes(w) ? w : c.weapons[0], bio: rollBio(), view: keep ? prep[side].view : "human", skill: null };
      });
      renderPrepSides();
      return;
    }
    ["left", "right"].forEach((side, idx) => {
      const p = prep[side];
      if (!p || p.arc || !S.find(p.charId) || isBanned(S.find(p.charId))) {
        const c = chars[Math.min(idx, chars.length - 1)];
        prep[side] = { charId: c.id, weaponId: c.weapons[0], bio: null, view: "human" };
      }
      prep[side].bio = rollBio(); // バイオリズムは対戦ごとに引き直し
    });
    renderPrepSides();
  }

  // v1.6.0:バトル準備のキャラ(アーケードは今のレベルの自分のキャラと、敵)
  function charFor(side) {
    if (arcMatch) return side === "left" ? arcPlayer() : arcEnemy();
    return S.find(prep[side].charId);
  }
  function prepUnits() {
    const l = charFor("left"), r = charFor("right");
    const L = B.makeUnit(l, prep.left.weaponId, "left");
    const R = B.makeUnit(r, prep.right.weaponId, "right");
    L.bio = prep.left.bio;
    R.bio = prep.right.bio;
    // v1.5.0:スキル選択ON(闘技場)・トーナメントの持ち越しは、スキルが先に決まっているので予測にも入れる
    const fixed = fixedSkills(L, R);
    if (fixed) { L.skill = fixed.left; R.skill = fixed.right; }
    if (arcMatch) arcSkills(L, R, false);
    return { L, R };
  }

  // v1.5.0:先に決まっているスキル { left, right }(なければ null)
  function fixedSkills(L, R) {
    if (arcMatch) return null; // アーケードは arcSkills で決める
    if (tourMatch) {
      return tourState.skillMode === "carry" ? { left: tourState.skills[L.char.id] || null, right: tourState.skills[R.char.id] || null } : null;
    }
    if (!battleOpts.skillPick) return null;
    return { left: pickedSkill("left", L), right: pickedSkill("right", R) };
  }
  // スキル選択:選べるスキル(抽選と同じ。武器スキルとかぶるもの・使えないもの(陽光・エリート)は出さない)
  function pickableSkills(u) {
    return B.skillPool(u).map((s) => s.name);
  }
  function pickedSkill(side, u) {
    const list = pickableSkills(u);
    const cur = prep[side].skill;
    return list.includes(cur) ? cur : list[0];
  }
  function skillPickHtml(side, u) {
    if (tourMatch || arcMatch || !battleOpts.skillPick) return "";
    const cur = pickedSkill(side, u);
    const opts = pickableSkills(u).map((n) => `<option value="${UI.esc(n)}" ${n === cur ? "selected" : ""}>${UI.esc(n)}</option>`).join("");
    const info = UI.skillInfo(cur);
    return `<div class="skill-pick"><label><span class="sp-k">スキル</span><select class="skill-select" data-side="${side}">${opts}</select></label>
      <p class="sp-desc">${UI.esc(info ? info.description : "")}</p></div>`;
  }
  // トーナメントの持ち越しスキル(バトル準備で見せる)
  function carrySkillHtml(u) {
    if (arcMatch) {
      // v1.6.0:アーケード。敵のスキルは決まっている。自分は持ち越しなら決まっている、毎回ルーレットなら対戦開始のときに決まる
      const list = [u.skill, ...(u.extraSkills || [])].filter(Boolean);
      const random = u.side === "left" && arcState.skillMode !== "carry";
      const chips = random ? `<span class="muted">対戦開始のときにルーレットで決まる${arcState.stage === A_.EXTRA ? "(イナ戦は2つ)" : ""}</span>` : list.length ? list.map((n) => UI.skillChip(n, false)).join("") : '<span class="muted">なし</span>';
      const desc = random ? "" : list.map((n) => { const s = UI.skillInfo(n); return s ? `${UI.esc(n)}:${UI.esc(s.description)}` : ""; }).filter(Boolean).join("<br>");
      return `<div class="skill-pick carry"><span class="sp-k">スキル</span>${chips}${desc ? `<p class="sp-desc">${desc}</p>` : ""}</div>`;
    }
    if (!tourMatch || tourState.skillMode !== "carry") return "";
    const info = UI.skillInfo(u.skill);
    return `<div class="skill-pick carry"><span class="sp-k">スキル</span>${UI.skillChip(u.skill, false)}<p class="sp-desc">${UI.esc(info ? info.description : "")}</p></div>`;
  }

  // 予測用のユニット:ラグズは切り替えボタンの表示(化身前/化身後)に合わせる
  function viewUnit(u, side) {
    const c = B.cloneUnit(u);
    if (c.laguz) c.laguz.transformed = prep[side].view === "transformed";
    return c;
  }

  // 化身前/化身後の切り替え(ラグズのみ)。v1.4.3:トグル式にして「1P」の横に置く
  function formToggle(side, char) {
    if (char.race !== "ラグズ" || !char.statsHuman) return "";
    const v = prep[side].view;
    return `<label class="form-switch" data-view="${v}" title="能力値の表示(化身前/化身後)">
      <span class="fs-l">化身前</span>
      <input type="checkbox" class="form-check" data-side="${side}" ${v === "transformed" ? "checked" : ""} aria-label="化身後の能力値を表示">
      <span class="fx-switch" aria-hidden="true"></span>
      <span class="fs-r">化身後</span>
    </label>`;
  }

  function renderPrepSides() {
    const chars = S.list();
    const { L, R } = prepUnits();
    for (const side of ["left", "right"]) {
      const me = side === "left" ? L : R;
      const foe = side === "left" ? R : L;
      const char = me.char;
      const options = arcMatch ? `<option selected>${UI.esc(char.name)}(${UI.esc(char.className)} Lv${char.arcadeLv})${side === "right" ? " ※敵" : ""}</option>` : (tourMatch ? chars.filter((c) => c.id === char.id) : chars).map((c) => isBanned(c)
        ? `<option value="${UI.esc(c.id)}" disabled>${UI.esc(c.name)}(${UI.esc(c.className)})※出禁</option>`
        : `<option value="${UI.esc(c.id)}" ${c.id === char.id ? "selected" : ""}>${UI.esc(c.name)}(${UI.esc(c.className)})</option>`).join("");
      // v1.6.0:アーケードの敵は武器が決まっている(その武器だけ出す)
      const weapons = char.weapons.filter((id) => !(arcMatch && side === "right" && id !== me.weapon.id)).map((id) => {
        const w = UI.charWeapon(char, id);
        if (!w) return "";
        const tri = B.triangle(w, foe.weapon);
        const eff = DB.isEffective(w, foe.className);
        return `<label class="weapon weapon-choice ${id === me.weapon.id ? "selected" : ""}">
          <input type="radio" name="weapon-${side}" value="${UI.esc(id)}" ${id === me.weapon.id ? "checked" : ""}>
          ${UI.weaponLine(w, { tri, effective: eff })}</label>`;
      }).join("");
      const view = char.race === "ラグズ" ? prep[side].view : "transformed";
      $(`.prep-side[data-side="${side}"]`).innerHTML = `
        <div class="panel">
          <div class="side-top"><p class="side-label">${side === "left" ? "1P" : "2P"}</p>${formToggle(side, char)}</div>
          <select class="char-select" data-side="${side}" ${tourMatch || arcMatch ? "disabled" : ""}>${options}</select>
          ${UI.fighterHeader(char, { bio: me.bio, hideWeak: true, noIconWeapon: true })}
          ${UI.statGrid(char, { element: true, form: view, foeElement: foe.char.element })}
          <h4 class="sub weapon-head">この対戦で使う武器<span class="wtype" title="武器の種類">${UI.esc(UI.weaponTypeLabel(char, me.weapon.id))}</span></h4>
          <div class="weapon-list">${weapons}</div>
          ${skillPickHtml(side, me)}${carrySkillHtml(me)}
        </div>`;
    }
    // 予測:ラグズは切り替えボタンの表示(化身前/化身後)で計算する
    renderForecast($("#forecast"), viewUnit(L, "left"), viewUnit(R, "right"), { L, R });
    $("#btn-start").disabled = false;
  }

  // 化身前/化身後の切り替え:能力値のバーと数字を動かし、予測を更新する
  function switchView(side, view) {
    if (prep[side].view === view) return;
    prep[side].view = view;
    const panel = $(`.prep-side[data-side="${side}"]`);
    const sw = $(".form-switch", panel);
    if (sw) { sw.dataset.view = view; $(".form-check", sw).checked = view === "transformed"; }
    const char = charFor(side);
    const { stats, max } = UI.formStats(char, view);
    for (const k of DB.STAT_KEYS) {
      const row = $(`.stat[data-k="${k}"]`, panel);
      if (!row) continue;
      const v = stats[k], m = max ? max[k] : 40;
      const valEl = $(".stat-v", row);
      const old = Number(valEl.textContent);
      $(".stat-bar i", row).style.width = Math.min(100, Math.round((v / m) * 100)) + "%";
      row.classList.toggle("capped", v >= m);
      valEl.classList.toggle("capped", v >= m);
      if (v !== old) {
        // v1.4.3:数えている間は、上がる数字を緑・下がる数字を赤で表示(上限の色より優先)
        const cls = v > old ? "counting-up" : "counting-down";
        valEl.classList.remove("counting-up", "counting-down");
        valEl.classList.add(cls);
        clearTimeout(valEl._ct);
        valEl._ct = setTimeout(() => valEl.classList.remove(cls), 900);
        countTo(valEl, old, v, 500);
        flash(row, v > old ? "stat-up" : "stat-down");
      }
    }
    const { L, R } = prepUnits();
    renderForecast($("#forecast"), viewUnit(L, "left"), viewUnit(R, "right"), { L, R });
  }

  // 数字を from → to まで数える演出
  function countTo(el, from, to, ms) {
    const start = performance.now();
    (function step() {
      const p = Math.min(1, (performance.now() - start) / ms);
      el.textContent = Math.round(from + (to - from) * p);
      if (p < 1) requestAnimationFrame(step);
    })();
  }

  $("#prep-body").addEventListener("change", (e) => {
    if (e.target.matches(".form-check")) {
      switchView(e.target.dataset.side, e.target.checked ? "transformed" : "human");
    } else if (e.target.matches(".char-select")) {
      const side = e.target.dataset.side;
      const c = S.find(e.target.value);
      prep[side] = { charId: c.id, weaponId: c.weapons[0], bio: rollBio(), view: "human", skill: null };
      renderPrepSides();
    } else if (e.target.matches(".skill-select")) {
      prep[e.target.dataset.side].skill = e.target.value; // v1.5.0:スキル選択
      renderPrepSides();
    } else if (e.target.matches('input[type="radio"]')) {
      const side = e.target.name.replace("weapon-", "");
      if (arcMatch && side === "right") return; // 敵の武器は変えられない
      prep[side].weaponId = e.target.value;
      if (tourMatch) { tourState.weapons[prep[side].charId] = e.target.value; saveTour(); }
      if (arcMatch) { arcState.weapon = e.target.value; saveArc(); }
      renderPrepSides();
    }
  });

  // 威力の表示:「12 ×2」(追撃・勇者武器で回数が増えるとき)。×2・×4 は円を描くように動く(原作風)
  function dmgText(c) {
    return `${c.damage}${c.times > 1 ? `<b class="x2"><i>×${c.times}</i></b>` : ""}`;
  }
  function skillCells(u) {
    return UI.skillChip(u.skill, false) + (u.extraSkills || []).map((n) => UI.skillChip(n, false)).join("") + (u.weapon.weaponSkill ? UI.skillChip(u.weapon.weaponSkill, true) : "") + UI.classSkillChip(u.className);
  }
  // v1.4.5:スキルの説明(抽選のスキル・武器スキル・俊足などの兵種スキル)
  function skillDescHtml(u) {
    const s = UI.skillInfo(u.skill);
    const ws = u.weapon.weaponSkill ? UI.skillInfo(u.weapon.weaponSkill) : null;
    const cs = UI.skillInfo(DB.classSkillOf(u.className));
    const parts = [];
    if (s) parts.push((u.extraSkills && u.extraSkills.length ? `${UI.esc(s.name)}:` : "") + UI.esc(s.description));
    // v1.6.0:2つ目以降のスキル(アーケード)
    for (const n of u.extraSkills || []) { const x = UI.skillInfo(n); if (x) parts.push(`${UI.esc(n)}:${UI.esc(x.description)}`); }
    if (ws) parts.push(`<span class="ws-desc">武器:${UI.esc(ws.description)}</span>`);
    if (cs) parts.push(`<span class="ws-desc cs-desc">兵種:${UI.esc(cs.name)}(${UI.esc(cs.description)})</span>`);
    return parts.join("<br>");
  }

  // 化身予定の表示
  function planText(p) {
    if (!p) return '<span class="fc-none">―</span>';
    if (p.when === "化身中") return "化身中";
    return `ラウンド${p.round}<small>${p.when}</small>`;
  }

  // 戦闘予測(原作の戦闘予測風)。base:化身予定を計算する元のユニット(開始時の状態)
  function renderForecast(el, L, R, base) {
    // 前の数字を覚えておき、変わったところを光らせる
    const before = {};
    $$("[data-fk]", el).forEach((n) => { before[n.dataset.fk] = n.textContent; });
    const f = B.forecast(L, R);
    const danger = (c) => (c.effective ? '<span class="danger">⚠特効</span>' : "");
    const row = (label, a, b, cls = "", key = "") => `<div class="fc-row ${cls}"><span class="fc-v"${key ? ` data-fk="${key}-l"` : ""}>${a}</span><span class="fc-k">${label}</span><span class="fc-v"${key ? ` data-fk="${key}-r"` : ""}>${b}</span></div>`;
    // 補正の合計(属性・バイオリズム・3すくみ・特効・武器の効果)
    const bl = B.bonusSummary(L, R), br = B.bonusSummary(R, L);
    const bonus = (label, k) => {
      const cell = (v) => `<span class="${v > 0 ? "up" : v < 0 ? "down" : "zero"}">${UI.bonusText(v)}</span>`;
      return row(label, cell(bl[k]), cell(br[k]), "fc-bonus");
    };
    const pl = B.transformPlan(base.L), pr = B.transformPlan(base.R);
    const plan = pl || pr ? `${row("化身<br>予定", planText(pl), planText(pr), "fc-plan")}<p class="fc-note">※ダメージを受けると早まります</p>` : "";
    el.innerHTML = `
      <div class="fc-head">
        <span class="fc-name">${UI.esc(L.name)}${f.right.effective ? '<span class="danger" title="相手の武器が特効">⚠</span>' : ""}</span>
        <span class="fc-k">戦闘予測</span>
        <span class="fc-name">${f.left.effective ? '<span class="danger" title="相手の武器が特効">⚠</span>' : ""}${UI.esc(R.name)}</span>
      </div>
      ${row("武器", `${UI.esc(L.weapon.name)}${UI.triMark(f.left.tri)}`, `${UI.triMark(f.right.tri)}${UI.esc(R.weapon.name)}`, "fc-small")}
      ${row("HP", L.hp, R.hp)}
      ${row("威力", dmgText(f.left) + danger(f.left), danger(f.right) + dmgText(f.right), "", "mt")}
      ${row("命中", f.left.hit, f.right.hit, "", "hit")}
      ${row("必殺", f.left.crit, f.right.crit, "", "crit")}
      ${row("攻速", f.left.as, f.right.as, "", "as")}
      ${plan}
      <div class="fc-section">補正</div>
      ${bonus("攻撃", "attack")}
      ${bonus("防御", "defense")}
      ${bonus("命中", "hit")}
      ${bonus("回避", "avoid")}
      ${bonus("必殺", "crit")}`;
    $$("[data-fk]", el).forEach((n) => {
      const old = before[n.dataset.fk];
      if (old === undefined || old === n.textContent) return;
      const up = parseFloat(n.textContent) > parseFloat(old);
      flash(n, up ? "fc-up" : "fc-down");
    });
  }

  // ================= ルーレット(スキル 3秒 → 先攻・後攻 1秒) =================
  // v1.4.3:ルーレットはタップで飛ばせる(rouletteSkip が true の間は待たない)
  let rouletteSkip = false;
  let rouletteWake = null;
  const sleep = (ms) => new Promise((r) => {
    if (rouletteSkip) return r();
    const t = setTimeout(done, ms);
    function done() { clearTimeout(t); rouletteWake = null; r(); }
    rouletteWake = done;
  });
  $("#roulette").addEventListener("click", () => { rouletteSkip = true; if (rouletteWake) rouletteWake(); });

  function spin(durationMs, onTick) {
    return new Promise((resolve) => {
      const start = performance.now();
      (function tick() {
        const t = performance.now() - start;
        if (t >= durationMs || rouletteSkip) return resolve();
        onTick();
        const p = t / durationMs;
        setTimeout(tick, 50 + p * p * 260); // だんだん遅くなる
      })();
    });
  }

  // keepSkills:スキルはそのまま(抽選しない)。noSkills(v1.4.3):スキル抽選OFF(先攻・後攻だけ)
  // spinSides(v1.6.0):ルーレットを回す側(アーケードは自分だけ。敵のスキルは決まっている)。省略すると両方
  const skillLabel = (u) => [u.skill, ...(u.extraSkills || [])].filter(Boolean).join("・") || "なし";
  async function roulette(L, R, first, keepSkills, noSkills, spinSides) {
    const ov = $("#roulette");
    const slots = { left: $('.roulette-slot[data-side="left"]', ov), right: $('.roulette-slot[data-side="right"]', ov) };
    const units = { left: L, right: R };
    rouletteSkip = false;
    for (const side of ["left", "right"]) {
      $(".r-name", slots[side]).textContent = units[side].name;
      slots[side].classList.remove("done", "first", "second", "lit", "rare");
    }
    ov.hidden = false;
    if (noSkills) {
      // スキルなし:すぐ先攻・後攻へ
    } else if (keepSkills || (spinSides && !spinSides.length)) {
      $("#roulette-title").textContent = spinSides ? "スキル" : "スキル(そのまま)";
      for (const side of ["left", "right"]) {
        $(".r-skill", slots[side]).textContent = skillLabel(units[side]);
        slots[side].classList.add("done");
        slots[side].classList.toggle("rare", isRare(units[side].skill));
      }
      await sleep(800);
    } else {
      $("#roulette-title").textContent = "スキル抽選";
      const spinning = spinSides || ["left", "right"];
      for (const side of ["left", "right"]) {
        if (spinning.includes(side)) continue;
        $(".r-skill", slots[side]).textContent = skillLabel(units[side]); // 決まっている側(アーケードの敵)
        slots[side].classList.add("done");
      }
      // v1.3.4:回っている間も本番と同じ抽選(陽光は魔法系だけ・女神の加護はめったに出ない)
      await spin(C.rouletteMs, () => { for (const side of spinning) $(".r-skill", slots[side]).textContent = B.drawSkill(units[side], battleRng); });
      for (const side of ["left", "right"]) {
        $(".r-skill", slots[side]).textContent = skillLabel(units[side]);
        slots[side].classList.add("done");
        slots[side].classList.toggle("rare", isRare(units[side].skill)); // レアスキルは虹色
      }
      await sleep(900);
    }

    // 先攻・後攻
    $("#roulette-title").textContent = "先攻・後攻";
    for (const side of ["left", "right"]) {
      slots[side].classList.remove("done", "rare");
      $(".r-skill", slots[side]).textContent = "?";
    }
    let lit = "left";
    await spin(C.firstRouletteMs, () => {
      lit = lit === "left" ? "right" : "left";
      for (const side of ["left", "right"]) slots[side].classList.toggle("lit", side === lit);
    });
    for (const side of ["left", "right"]) {
      const isFirst = side === first.side;
      slots[side].classList.remove("lit");
      slots[side].classList.add(isFirst ? "first" : "second", "done");
      $(".r-skill", slots[side]).textContent = isFirst ? "先攻" : "後攻";
    }
    await sleep(1000);
    ov.hidden = true;
  }

  const isRare = (name) => { const s = UI.skillInfo(name); return !!(s && s.rare); };

  // ================= バトル =================
  const battle = { L: null, R: null, events: [], idx: 0, token: 0, speed: 1, skip: false, wake: null, lastSkills: null };

  function stopBattle() {
    battle.token++;
    battle.skip = false;
    if (battle.wake) battle.wake();
    $("#roulette").hidden = true;
    $("#arena").classList.remove("slowmo", "ko-dim");
  }

  // 待つ(スキップ・画面移動で即終了)。中断されたら false
  function wait(ms, token) {
    return new Promise((resolve) => {
      if (battle.skip || token !== battle.token) return resolve(token === battle.token);
      const t = setTimeout(done, ms * battle.speed);
      function done() { clearTimeout(t); battle.wake = null; resolve(token === battle.token); }
      battle.wake = done;
    });
  }

  // ================= バトルのオプション(v1.4.3) =================
  // bestOf:何本先取か(1〜3)/ skills:スキル抽選のON/OFF / rouletteFx:抽選・先攻後攻の演出のON/OFF
  const OPT_KEY = "arenaBattle.battleOptions";
  const battleOpts = { bestOf: 1, skills: true, rouletteFx: true, skillPick: false };
  try { Object.assign(battleOpts, JSON.parse(global.localStorage.getItem(OPT_KEY) || "{}")); } catch (e) { /* 初期値のまま */ }
  battleOpts.bestOf = [1, 2, 3].includes(battleOpts.bestOf) ? battleOpts.bestOf : 1;
  function saveOpts() {
    try { global.localStorage.setItem(OPT_KEY, JSON.stringify(battleOpts)); } catch (e) { /* 保存できなくても動く */ }
  }
  function renderOpts() {
    $$(".bo-btn").forEach((b) => { const on = Number(b.dataset.bestof) === battleOpts.bestOf; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    $("#opt-skills").checked = battleOpts.skills;
    $("#opt-roulette").checked = battleOpts.rouletteFx;
    // v1.5.0:スキル選択がONのときは、スキル抽選・抽選の演出は使わない(スイッチを薄く)
    $("#opt-skillpick").checked = battleOpts.skillPick;
    for (const id of ["#opt-skills", "#opt-roulette"]) {
      $(id).disabled = battleOpts.skillPick;
      $(id).closest(".fx-toggle").classList.toggle("off", battleOpts.skillPick);
    }
  }
  $("#battle-options").addEventListener("click", (e) => {
    const b = e.target.closest(".bo-btn");
    if (!b) return;
    battleOpts.bestOf = Number(b.dataset.bestof);
    saveOpts(); renderOpts();
  });
  $("#opt-skills").addEventListener("change", (e) => { battleOpts.skills = e.target.checked; saveOpts(); });
  $("#opt-roulette").addEventListener("change", (e) => { battleOpts.rouletteFx = e.target.checked; saveOpts(); });
  $("#opt-skillpick").addEventListener("change", (e) => {
    battleOpts.skillPick = e.target.checked;
    saveOpts(); renderOpts();
    if ($("#screen-prep").classList.contains("active") && prep.left) renderPrepSides();
  });
  renderOpts();

  async function startBattle(opts = {}) {
    const { L, R } = prepUnits();
    // v1.5.0:スキル選択ON(闘技場)・トーナメントの持ち越しは、決まったスキルで戦う
    const fixed = fixedSkills(L, R);
    const arc = !!arcMatch; // v1.6.0:アーケード(1本先取。スキルは arcSkills で決める)
    const tourRandom = !!tourMatch && !fixed;
    const noSkills = !arc && !fixed && !tourRandom && !battleOpts.skills;
    const keepSkills = !arc && !fixed && !tourRandom && !noSkills && !!(opts.keepSkills && battle.lastSkills);
    const bestOf = arc ? 1 : tourMatch ? tourState.bestOf : battleOpts.bestOf;
    // スキル選択ON:抽選と演出はなし。トーナメントの持ち越し:スキルは「そのまま」で見せる
    const fx = battleOpts.rouletteFx && !(battleOpts.skillPick && !tourMatch && !arc);
    if (arc) {
      arcSkills(L, R, true);
    } else if (fixed) {
      L.skill = fixed.left;
      R.skill = fixed.right;
    } else if (noSkills) {
      L.skill = null; // v1.4.3:スキル抽選OFF(武器スキル・兵種スキルはそのまま)
      R.skill = null;
    } else if (keepSkills) {
      L.skill = battle.lastSkills.left;
      R.skill = battle.lastSkills.right;
    } else {
      // スキルを先に決めてから先攻を決める(『待ち伏せ』の判定のため)。画面ではルーレットで見せる
      L.skill = B.drawSkill(L, battleRng);
      R.skill = B.drawSkill(R, battleRng);
    }
    $("#btn-start").disabled = true;
    $$(".btn-rematch").forEach((b) => (b.disabled = true));
    stopBattle();
    const first = B.decideFirst(L, R, battleRng);
    if (fx) await roulette(L, R, first, keepSkills || !!fixed, noSkills, arc ? (arcState.skillMode === "carry" ? [] : ["left"]) : null);
    goto("battle");
    const token = battle.token;
    battle.L = L;
    battle.R = R;
    if (!noSkills) battle.lastSkills = { left: L.skill, right: R.skill };
    battle.skip = false;
    $("#battle-log").innerHTML = "";
    $("#battle-result").hidden = true;
    $("#btn-skip").disabled = false;
    $$(".btn-rematch").forEach((b) => (b.disabled = false));
    $("#tour-result").hidden = true;
    $("#arc-result").hidden = true;
    battle.tour = tourMatch ? { ...tourMatch } : null;
    battle.arc = arcMatch ? { ...arcMatch } : null;
    runSet(token, first, bestOf);
  }

  // v1.4.3:N本先取。2試合目からは、前の試合で後攻だったキャラが先攻(シャドウエッジ・待ち伏せは今までどおり先攻)
  async function runSet(token, first, need) {
    const L = battle.L, R = battle.R;
    const wins = { left: 0, right: 0 };
    const maxMatches = need * 2 + 1; // 引き分けが続いたときの上限
    let firstSide = first.side, reason = first.reason;
    let last = null;
    setScore(need, wins, 1);
    for (let match = 1; match <= maxMatches; match++) {
      if (match > 1) {
        const lp = B.hasSkill(L, R, "待ち伏せ") || L.weapon.alwaysFirst, rp = B.hasSkill(R, L, "待ち伏せ") || R.weapon.alwaysFirst;
        if (lp !== rp) {
          firstSide = lp ? "left" : "right";
          reason = (lp ? L : R).weapon.alwaysFirst ? `(${(lp ? L : R).weapon.name}の効果)` : "(『待ち伏せ』発動)";
        } else {
          firstSide = firstSide === "left" ? "right" : "left";
          reason = "(前の試合で後攻)";
        }
      }
      const sim = B.simulate(B.cloneUnit(L), B.cloneUnit(R), battleRng, { firstSide, firstReason: reason });
      battle.events = sim.events;
      battle.idx = 0;
      renderFighters(B.forecast(L, R));
      $("#round-label").textContent = "";
      setScore(need, wins, match);
      // v1.4.5:最終試合(1-1・2-2 のようにどちらも次に勝てば決着、または最大の試合数)は、カウントダウンの前に演出
      const final = need > 1 && ((wins.left === need - 1 && wins.right === need - 1) || match === maxMatches);
      if (need > 1) logLine({ type: "match" }, `━━ 第${match}試合${final ? "(最終試合)" : ""} ━━`);
      setScore(need, wins, match, final);
      last = await play(token, need > 1 ? match : 0, final);
      if (!last) return; // 中断(画面移動など)
      if (last.winner !== "draw") wins[last.winner]++;
      setScore(need, wins, match);
      if (wins.left >= need || wins.right >= need) break;
      if (match === maxMatches) break;
      // 試合の結果を見せてから次の試合へ
      const w = last.winner === "draw" ? null : last.winner === "left" ? L : R;
      if (!battle.skip) {
        arenaFx(w ? `<small>第${match}試合</small>${UI.esc(w.name)} ${wins[last.winner]}本目` : `<small>第${match}試合</small>引き分け`, "fx-match", 1800);
        flash($("#set-score"), "score-pop");
      }
      if (!(await wait(2000, token))) return;
    }
    let winner = "draw";
    if (wins.left !== wins.right) winner = wins.left > wins.right ? "left" : "right";
    if (need === 1) winner = last.winner;
    // v1.5.0:トーナメントは引き分けにしない。最後の試合で残ったHPの割合が多いほうの判定勝ち(同じならランダム)
    let judge = false;
    // v1.6.0:アーケードも同じ(引き分けなし)
    if ((battle.tour || battle.arc) && winner === "draw") { winner = judgeWinner(last, battleRng); judge = true; }
    finish({ winner, judge }, need > 1 ? wins : null);
  }

  // 判定勝ち:最後の試合の残りHPの割合 → 同じならランダム
  function judgeWinner(end, rng) {
    const r = (side) => end.hp[side] / Math.max(1, end.maxHp ? end.maxHp[side] : 1);
    if (r("left") !== r("right")) return r("left") > r("right") ? "left" : "right";
    return rng.next() < 0.5 ? "left" : "right";
  }

  // 先取の表示(1本先取のときは出さない)
  function setScore(need, wins, match, final = false) {
    const el = $("#set-score");
    el.hidden = need <= 1;
    if (need <= 1) return;
    el.classList.toggle("final", final);
    el.innerHTML = `<small>${need}本先取・${final ? "最終試合" : `第${match}試合`}</small><b>${wins.left}</b><i>-</i><b>${wins.right}</b>`;
  }

  function miniFcHtml(calc) {
    return `<span data-k="damage">威力<b><em class="n">${calc.damage}</em>${calc.times > 1 ? `<b class="x2"><i>×${calc.times}</i></b>` : ""}</b></span>
      <span data-k="hit">命中<b><em class="n">${calc.hit}</em></b></span><span data-k="crit">必殺<b><em class="n">${calc.crit}</em></b></span><span data-k="as">攻速<b><em class="n">${calc.as}</em></b></span>`;
  }

  function fighterHtml(u, foe, calc, foeCalc) {
    const gauge = u.laguz
      ? `<div class="gauge"><span class="gauge-k">化身前</span><span class="gauge-bar"><i class="gauge-fill"></i></span><b class="gauge-num">${u.laguz.gauge}</b></div>`
      : `<div class="gauge placeholder" aria-hidden="true"></div>`;
    const danger = foeCalc.effective ? '<span class="danger" title="相手の武器が特効">⚠特効</span>' : "";
    // v1.3.3:特効注意のタグは出さない
    return `
      ${UI.fighterHeader(u.char, { big: true, bio: u.bio, element: true, foeElement: foe.char.element, nameExtra: danger, hideWeak: true })}
      <div class="hp"><span class="hp-num"><b class="hp-cur">${u.hp}</b> / <span class="hp-max">${u.maxHp}</span><span class="status-chip" hidden></span></span><span class="hp-bar"><i class="hp-fill" style="width:100%"></i></span></div>
      ${gauge}
      <div class="fighter-weapon weapon">${UI.weaponLine(u.weapon, { tri: calc.tri, effective: calc.effective })}</div>
      <div class="fighter-row"><div class="skills">${skillCells(u)}</div></div>
      <p class="skill-desc">${skillDescHtml(u)}</p>
      <div class="mini-fc">${miniFcHtml(calc)}</div>
      ${UI.bonusRow(B.bonusSummary(u, foe))}
      <div class="float-layer"></div>`;
  }

  function renderFighters(f) {
    battle.maxHp = { left: battle.L.maxHp, right: battle.R.maxHp }; // v1.4.5:エリート・大器晩成で変わる
    battle.cls = { left: battle.L.className, right: battle.R.className };
    const fl = fighterEl("left"), fr = fighterEl("right");
    fl.className = "fighter";
    fr.className = "fighter";
    fl.innerHTML = fighterHtml(battle.L, battle.R, f.left, f.right);
    fr.innerHTML = fighterHtml(battle.R, battle.L, f.right, f.left);
    for (const side of ["left", "right"]) {
      const u = side === "left" ? battle.L : battle.R;
      if (u.laguz) setGauge(side, { gauge: u.laguz.gauge, transformed: u.laguz.transformed });
    }
    $("#arena-fx").innerHTML = "";
    endKo();
  }

  const fighterEl = (side) => $(`.fighter[data-side="${side}"]`);

  // slowMs:HPをゆっくり減らす(とどめの演出)
  function setHp(side, hp, slowMs = 0) {
    const maxHp = battle.maxHp ? battle.maxHp[side] : (side === "left" ? battle.L : battle.R).maxHp;
    const el = fighterEl(side);
    const cur = $(".hp-cur", el);
    if (slowMs) countTo(cur, Number(cur.textContent), hp, slowMs);
    else cur.textContent = hp;
    const pct = Math.max(0, (hp / maxHp) * 100);
    const fill = $(".hp-fill", el);
    fill.style.width = pct + "%";
    fill.classList.toggle("low", pct <= 30);
  }

  function setStatus(side, name) {
    const chip = $(".status-chip", fighterEl(side));
    chip.hidden = !name;
    chip.textContent = name ? `${name}状態` : "";
  }

  // v1.3.4:怒り・勇将の発動中(赤いスパーク)・武器破壊
  function setRage(side, on) { fighterEl(side).classList.toggle("raging", !!on); }
  function setBroken(side, on) {
    const w = $(".fighter-weapon", fighterEl(side));
    if (w) w.classList.toggle("broken", !!on);
  }
  // 補正の表示を更新(変わったところを光らせる)
  function setBonus(bonus, changed) {
    if (!bonus) return;
    for (const side of ["left", "right"]) {
      const old = $(".bonus-row", fighterEl(side));
      if (!old) continue;
      const before = $$("b", old).map((b) => b.textContent);
      const tmp = document.createElement("div");
      tmp.innerHTML = UI.bonusRow(bonus[side]);
      const row = tmp.firstElementChild;
      old.replaceWith(row);
      if (!changed) continue;
      $$("span", row).forEach((s, i) => {
        const now = $("b", s).textContent;
        if (before[i] === undefined || before[i] === now) return;
        flash(s, parseInt(now, 10) > parseInt(before[i], 10) ? "fc-up" : "fc-down");
      });
    }
  }

  function setGauge(side, g) {
    if (!g) return;
    const el = fighterEl(side);
    const fill = $(".gauge-fill", el);
    if (!fill) return;
    fill.style.width = (g.gauge / C.laguzGauge.max) * 100 + "%";
    $(".gauge-num", el).textContent = g.gauge;
    $(".gauge-k", el).textContent = g.transformed ? "化身中" : "化身前";
    el.classList.toggle("transformed", g.transformed);
    el.classList.toggle("human", !g.transformed);
  }

  // 化身・化身解除のときに、威力などの表示を更新する。
  // v1.3.3:changed(化身した側)は、数字が変わる様子を見せる(上がると緑、下がると赤に光る)
  function setMiniFc(f, changed) {
    if (!f) return;
    for (const side of ["left", "right"]) {
      const box = $(".mini-fc", fighterEl(side));
      const old = {};
      $$("[data-k]", box).forEach((n) => { old[n.dataset.k] = Number($(".n", n).textContent); });
      box.innerHTML = miniFcHtml(f[side]);
      if (!changed) continue;
      $$("[data-k]", box).forEach((n) => {
        const k = n.dataset.k, v = f[side][k];
        if (old[k] === undefined || old[k] === v) return;
        countTo($(".n", n), old[k], v, 700);
        flash(n, v > old[k] ? "fc-up" : "fc-down");
      });
    }
  }

  // 攻撃が当たったときの演出(斬撃の線と光)
  // kind:"crit" / "black"(瞬殺の黒い斬撃)/ "guard"(女神の加護で弾かれた)
  function impact(side, kind) {
    const layer = $(".float-layer", fighterEl(side));
    const span = document.createElement("span");
    span.className = "impact" + (kind === true ? " crit" : kind ? " " + kind : "");
    span.innerHTML = '<i class="slash"></i><i class="slash s2"></i><i class="burst"></i>';
    layer.appendChild(span);
    setTimeout(() => span.remove(), 700);
  }

  // v1.4.5:回復の演出(緑の光・上にのぼる光の粒・HPバーが緑に光る)。ダメージの演出とはっきり分ける
  function healFx(side, amount) {
    const el = fighterEl(side);
    flash(el, "heal-fx");
    const fill = $(".hp-fill", el);
    if (fill) flash(fill, "hp-heal");
    const layer = $(".float-layer", el);
    const box = document.createElement("span");
    box.className = "heal-burst";
    box.innerHTML = Array.from({ length: 10 }, (_, i) => `<i style="left:${8 + i * 9}%;animation-delay:${(i % 4) * 0.08}s"></i>`).join("");
    layer.appendChild(box);
    setTimeout(() => box.remove(), 1200);
    if (amount) floatText(side, `+${amount}`, "heal big-heal");
  }

  // v1.5.0:化身解除のとき、キャラ枠からオレンジのかけらが割れて落ちる
  function revertShards(side) {
    const layer = $(".float-layer", fighterEl(side));
    const box = document.createElement("span");
    box.className = "revert-shards";
    box.innerHTML = Array.from({ length: 14 }, (_, i) => {
      const x = 6 + ((i * 41) % 88), dx = ((i * 29) % 70) - 35, rot = ((i * 67) % 360) - 180, d = (i % 5) * 0.05;
      return `<i style="left:${x}%;top:${10 + ((i * 23) % 50)}%;--dx:${dx}px;--rot:${rot}deg;animation-delay:${d}s"></i>`;
    }).join("");
    layer.appendChild(box);
    setTimeout(() => box.remove(), 1500);
  }

  function floatText(side, text, cls) {
    const layer = $(".float-layer", fighterEl(side));
    const span = document.createElement("span");
    span.className = "float " + cls;
    span.textContent = text;
    layer.appendChild(span);
    setTimeout(() => span.remove(), 1100);
  }

  // v1.4.4:キャラ枠に残った「lunge」(攻撃の踏み込み)は指定の強いCSSなので、残っていると
  // 被ダメージの赤い光・揺れ(hit)などが効かなくなる(2ラウンド目以降に光らなかった原因)。ほかの演出の前に外す
  // v1.5.0:回復の演出(heal-fx)などが残っていると、あとのダメージの演出が緑のままになっていた
  // (heal-fx の指定が hit より後ろにあるため)。キャラ枠に新しい演出を出すときは、前の演出をすべて外す
  const FIGHTER_FX = ["lunge", "hit", "crit-hit", "heal-fx", "skill", "transform-fx", "revert-fx", "rage-fx", "sleep-fx", "poison", "ko"];
  function flash(el, cls) {
    if (el.classList.contains("fighter")) {
      if (cls === "lunge") el.classList.remove("lunge");
      else el.classList.remove(...FIGHTER_FX);
    }
    el.classList.remove(cls);
    void el.offsetWidth; // アニメーションをやり直す
    el.classList.add(cls);
  }

  // アリーナ全体の演出(カウントダウン・ROUND・必殺・奥義・K.O.)
  function arenaFx(html, cls, ms) {
    const fx = $("#arena-fx");
    const div = document.createElement("div");
    div.className = "fx " + cls;
    div.innerHTML = html;
    fx.appendChild(div);
    setTimeout(() => div.remove(), ms);
  }

  function logLine(e, text) {
    const li = document.createElement("li");
    li.className = "log-" + e.type + (e.crit ? " log-crit" : "") + (e.fromWeapon ? " log-weapon" : "");
    li.textContent = text ?? e.text;
    const log = $("#battle-log");
    log.appendChild(li);
    log.scrollTop = log.scrollHeight;
    return li;
  }

  // v1.4.5:エリート(職業が変わる)・大器晩成(最大HPが変わる)を画面に反映
  function setMaxHp(side, maxHp) {
    if (!battle.maxHp || battle.maxHp[side] === maxHp) return;
    battle.maxHp[side] = maxHp;
    const num = $(".hp-max", fighterEl(side));
    if (num) { num.textContent = maxHp; flash(num, "fc-up"); }
  }
  function setClass(side, className) {
    if (!battle.cls || battle.cls[side] === className) return;
    battle.cls[side] = className;
    const el = fighterEl(side);
    const c = $(".char-class", el);
    if (c) { c.innerHTML = `${UI.esc(className)}<small class="lv1">Lv1</small>`; flash(c, "fc-up"); }
    const u = side === "left" ? battle.L : battle.R;
    const tmp = { ...u, className };
    $(".skills", el).innerHTML = skillCells(tmp);
    $(".skill-desc", el).innerHTML = skillDescHtml(tmp);
  }

  function applyState(e, withLog = true) {
    if (withLog && !e.quiet) logLine(e);
    for (const side of ["left", "right"]) {
      if (e.maxHp) setMaxHp(side, e.maxHp[side]);
      if (e.className) setClass(side, e.className[side]);
      setHp(side, e.hp[side]);
      setStatus(side, e.status[side]);
      setGauge(side, e.laguz[side]);
      if (e.rage) setRage(side, e.rage[side]);
      if (e.broken) setBroken(side, e.broken[side]);
    }
    // 数字が変わる様子を見せるイベント(化身・怒り/勇将・睡眠・武器破壊・咆哮など)
    const changed = ["transform", "revert", "rage", "sleep", "wake", "break", "skill", "spd-down", "heal"].includes(e.type);
    if (e.forecast) setMiniFc(e.forecast, changed);
    if (e.bonus) setBonus(e.bonus, changed);
  }

  // とどめ(v1.3.3):命中 → スローモーション → グレーに暗転 → HPがゆっくり0に → 「K」「.」「O」「.」
  // e:HPを0にするイベント(ここでゆっくりHPを減らす)
  async function koSequence(target, token, e) {
    const arena = $("#arena");
    const el = fighterEl(target);
    // v1.4.3:HPが0になるときも、ふだんと同じ速さでHPを減らす(前はゆっくり減らしていた)
    if (e) {
      for (const side of ["left", "right"]) { setHp(side, e.hp[side]); setStatus(side, e.status[side]); setGauge(side, e.laguz[side]); }
    }
    flash(arena, "hard-hit");
    arena.classList.add("slowmo");
    if (!(await wait(500, token))) { endKo(); return false; }
    arena.classList.add("ko-dim");
    if (e && e.instantKill) arena.classList.add("ss-dim"); // 瞬殺:赤黒く暗転
    el.classList.add("ko-target");
    if (!(await wait(700, token))) { endKo(); return false; }
    flash(el, "ko");
    // v1.3.4:瞬殺のときは「K.O.」ではなく「瞬・殺。」
    const ss = !!(e && e.instantKill);
    const letters = (ss ? ["瞬", "・", "殺", "。"] : ["K", ".", "O", "."]).map((ch, i) => `<span class="ko-l" style="animation-delay:${0.1 + i * 0.35}s">${ch}</span>`).join("");
    arenaFx(letters, ss ? "fx-ko ss" : "fx-ko", 2400);
    const ok = await wait(2200, token);
    endKo();
    return ok;
  }
  function endKo() {
    $("#arena").classList.remove("slowmo", "ko-dim", "ss-dim");
    $$(".fighter").forEach((f) => f.classList.remove("hp-slow", "ko-target"));
  }

  // 攻撃:「○○の攻撃!」→ 一拍 →(必殺なら画面が揺れる)→「○○にダメージ!」→ 演出 → HPバーが減る
  async function playStrike(e, token) {
    const li = logLine(e, e.lead);
    flash(fighterEl(e.actor), "lunge");
    if (!(await wait(500, token))) return false;
    if (e.type === "miss") {
      li.textContent = `${e.lead}……${e.result}`;
      floatText(e.target, "MISS", "miss");
      applyState(e, false);
      return wait(600, token);
    }
    if (e.guarded) {
      // 女神の加護:弾かれてダメージ0
      impact(e.target, "guard");
      if (!(await wait(160, token))) return false;
      li.textContent = `${li.textContent}${e.result}`;
      floatText(e.target, "0", "guard");
      applyState(e, false);
      return wait(700, token);
    }
    if (e.instantKill) {
      // 瞬殺:黒い斬撃 → とどめの演出(瞬・殺。)
      impact(e.target, "black");
      flash($("#arena"), "rattle");
      if (!(await wait(260, token))) return false;
      li.textContent = `${li.textContent}${e.result}`;
      return koSequence(e.target, token, e);
    }
    if (e.crit) {
      li.textContent = `${e.lead}必殺の一撃!`;
      li.classList.add("log-crit");
      arenaFx("必殺の一撃!!", "fx-crit", C.bigEffectMs);
      flash($("#arena"), "rattle");
      if (!(await wait(C.bigEffectMs, token))) return false;
    }
    // 命中:斬撃の演出 → ダメージの数字 → HPバーが減る
    // v1.4.3:斬撃からHPが減るまでを早くした(前は 0.16秒後に数字 → さらに0.3秒後にHP)
    impact(e.target, e.crit);
    flash(fighterEl(e.target), e.crit ? "crit-hit" : "hit");
    if (!(await wait(120, token))) return false;
    li.textContent = `${li.textContent}${e.result}`;
    floatText(e.target, `-${e.damage}`, e.crit ? "crit" : "dmg");
    if (e.finishing) return koSequence(e.target, token, e); // とどめ:HPを減らしてからK.O.の演出
    applyState(e, false); // ここでHPバーが減る
    return wait(e.crit ? 1100 : 900, token);
  }

  // その他のイベントの演出。戻り値:次までの待ち時間(ms)
  function animate(e) {
    switch (e.type) {
      case "round":
        // v1.3.3:すべてのラウンドで同じ演出
        $("#round-label").innerHTML = `ROUND <b>${e.round}</b>`;
        arenaFx(`ROUND ${e.round}`, "fx-round big", 1000);
        turnTags(e.first); // v1.4.3:キャラ枠の上に先攻・後攻をスライドで出す
        return 1000;
      case "self":
        flash(fighterEl(e.target), "hit"); floatText(e.target, `-${e.damage}`, "dmg");
        return C.strikeDelayMs;
      case "status":
        flash(fighterEl(e.target), "poison"); floatText(e.target, `-${e.damage}`, "poison");
        return 800;
      case "status-add": return 550;
      case "heal": healFx(e.target, e.amount); return 900; // v1.4.5:太陽・天空・リザイアなどの吸収も回復の演出
      case "skill": {
        // v1.4.5:回復するスキル(回復・空の祝福)は回復の演出。前はスキルの光と同時に数字だけ出ていた
        if (e.heal) healFx(e.actor, e.heal);
        else flash(fighterEl(e.actor), "skill");
        if (e.elite) floatText(e.actor, "クラスチェンジ", "elite");
        if (e.skill === "大器晩成") floatText(e.actor, "能力アップ", "elite");
        if (e.skill === "瞬殺") {
          // v1.3.4:瞬殺専用の演出(背景が赤く、黒い斬撃)
          arenaFx(`<i class="ss-slash"></i><i class="ss-slash s2"></i><i class="ss-slash s3"></i><b><small>奥義</small>瞬殺</b>`, `fx-shunsatsu ${e.actor}`, 1400);
          return 1400;
        }
        if (e.rare) {
          arenaFx(`<small>レアスキル</small>${UI.esc(e.skill)}`, `fx-skill rare ${e.actor}`, C.bigEffectMs + 200);
          return C.bigEffectMs + 300;
        }
        if (e.target && e.skill === "咆哮") floatText(e.target, "能力ダウン", "debuff");
        if (e.ougi) {
          arenaFx(`<small>奥義</small>${UI.esc(e.skill)}`, `fx-ougi ${e.actor}${e.healFx ? " heal" : ""}`, C.bigEffectMs);
          return C.bigEffectMs + (e.healFx ? 400 : 100);
        }
        // v1.3.3:通常スキルもカットイン。防御は青、回復・祈りは淡い緑、それ以外(バフ系)は橙
        const kind = C.skillKinds.guard.includes(e.skill) ? "guard" : C.skillKinds.heal.includes(e.skill) ? "heal" : "buff";
        arenaFx(`<small>${e.fromWeapon ? "武器スキル" : "通常スキル"}</small>${UI.esc(e.skill)}`, `fx-skill ${kind} ${e.actor}`, C.skillEffectMs);
        return C.skillEffectMs + (e.heal || e.elite ? 400 : 100);
      }
      case "cancel": floatText(e.actor, "無効", "miss"); return 750;
      case "transform": {
        const u = e.actor === "left" ? battle.L : battle.R;
        flash(fighterEl(e.actor), "transform-fx");
        arenaFx(`<small>化身</small>${UI.esc(u.name)}`, `fx-transform ${e.actor}`, 1100);
        return 1400; // 威力・命中などの数字が変わる様子も見せる
      }
      case "revert": {
        // v1.5.0:化身解除の演出を強化(オーラが砕けて落ちる → 灰色の帯で「化身解除」→ 数字が下がる様子)
        const u = e.actor === "left" ? battle.L : battle.R;
        const el = fighterEl(e.actor);
        flash(el, "revert-fx");
        revertShards(e.actor);
        arenaFx(`<small>化身解除</small>${UI.esc(u.name)}<em>ゲージ0 ― 元の姿に戻った</em>`, `fx-revert ${e.actor}`, 1400);
        floatText(e.actor, "化身解除", "revert");
        return 1700;
      }
      // v1.3.4:怒り・勇将の発動(化身と同じように数字が変わる様子を見せる。発動中は赤いスパーク)
      case "rage":
        if (!e.on) { floatText(e.actor, "効果切れ", "revert"); return 900; }
        flash(fighterEl(e.actor), "rage-fx");
        arenaFx(`<small>HP半分で発動</small>${UI.esc(e.skill)}`, `fx-skill rage ${e.actor}`, 1100);
        return 1400;
      case "sleep":
        flash(fighterEl(e.target), "sleep-fx");
        floatText(e.target, "Zzz…", "sleep");
        return 900;
      case "asleep":
        floatText(e.actor, "Zzz…", "sleep");
        return 800;
      case "wake":
        floatText(e.actor, "目覚めた!", "revert");
        return 800;
      case "break":
        flash(fighterEl(e.target), "hit");
        floatText(e.target, "武器破壊", "debuff");
        return 1000;
      case "spd-down": // v1.4.4:手斧・手槍系で相手の速さ-1
        floatText(e.target, `速さ-${e.amount}`, "debuff");
        return 650;
      case "gauge": return 200;
      default: return 300;
    }
  }

  // v1.4.3:ラウンドの最初に、キャラ枠の上へ「先攻」「後攻」を1秒ほど出す
  function turnTags(firstSide) {
    for (const side of ["left", "right"]) {
      const el = fighterEl(side);
      $$(".turn-tag", el).forEach((t) => t.remove());
      const tag = document.createElement("div");
      const isFirst = side === firstSide;
      tag.className = "turn-tag " + (isFirst ? "first" : "second");
      tag.textContent = isFirst ? "先攻" : "後攻";
      el.appendChild(tag);
      setTimeout(() => tag.remove(), 1300);
    }
  }

  // 1試合を再生する。戻り値:最後のイベント(end)。中断されたら undefined
  // match:N本先取のときの試合の番号(0なら出さない)
  async function play(token, match = 0, final = false) {
    // v1.4.5:最終試合の演出(画面が暗くなり、赤い帯で「FINAL MATCH」→ 勝ち数)
    if (final && !battle.skip) {
      const arena = $("#arena");
      arena.classList.add("final-dim");
      arenaFx(`<small>第${match}試合</small><b>FINAL MATCH</b><em>最終試合 ― 勝ったほうが優勝</em>`, "fx-final", 2600);
      flash($("#set-score"), "score-pop");
      const ok = await wait(2600, token);
      arena.classList.remove("final-dim");
      $$(".fx-final").forEach((x) => x.remove()); // 速度:はやい のときも、カウントダウンと重ならないように
      if (!ok) return;
    }
    // 3, 2, 1, BATTLE!!
    for (const n of ["3", "2", "1"]) {
      arenaFx(n, "fx-count", 700);
      if (!(await wait(700, token))) return;
    }
    arenaFx(match ? `<small>第${match}試合</small>BATTLE!!` : "BATTLE!!", "fx-count battle", 900);
    if (!(await wait(900, token))) return;

    while (battle.idx < battle.events.length) {
      if (token !== battle.token) return;
      const e = battle.events[battle.idx++];
      if (e.type === "end") { applyState(e); return e; }
      if (battle.skip) { applyState(e); continue; }
      if (e.type === "hit" || e.type === "miss") {
        if (!(await playStrike(e, token)) && token !== battle.token) return;
        continue;
      }
      if (e.finishing) {
        // 継続ダメージ・暴発でHPが0になるとき:HPはとどめの演出でゆっくり減らす
        if (!e.quiet) logLine(e);
        animate(e);
        if (!(await wait(400, token)) && token !== battle.token) return;
        await koSequence(e.target, token, e);
        continue;
      }
      applyState(e);
      const ms = animate(e);
      if (!(await wait(ms, token)) && token !== battle.token) return;
    }
  }

  // wins:N本先取のときの勝ち数(1本先取なら null)
  function finish(e, wins) {
    $("#btn-skip").disabled = true;
    endKo();
    const text = $("#result-text");
    const score = wins ? `(${wins.left}-${wins.right})` : "";
    if (e.winner === "draw") {
      text.textContent = "引き分け" + score;
    } else {
      const winner = e.winner === "left" ? battle.L : battle.R;
      text.textContent = `${winner.name} の${e.judge ? "判定勝ち(残りHPの割合)" : "勝利"}!${score}`;
      fighterEl(e.winner).classList.add("winner");
      fighterEl(e.winner === "left" ? "right" : "left").classList.add("loser");
    }
    // v1.5.0:トーナメントの試合なら、結果を記録してトーナメント表へ(もう一度は出さない)
    const inTour = !!battle.tour;
    const inArc = !!battle.arc; // v1.6.0:アーケードの試合(コンティニュー・次へ)
    $$(".btn-rematch").forEach((b) => (b.hidden = inTour || inArc));
    $("#btn-back-prep").hidden = inTour || inArc;
    $("#tour-result").hidden = !inTour;
    $("#arc-result").hidden = !inArc;
    if (inTour) tourFinished(e, wins);
    if (inArc) arcFinished(e);
    $("#battle-result").hidden = false;
  }

  // ================= トーナメント(v1.5.0) =================
  const TOUR_KEY = "arenaBattle.tournament";
  function loadTour() {
    if (tourState) return tourState;
    let st = null;
    try { st = JSON.parse(global.localStorage.getItem(TOUR_KEY) || "null"); } catch (e) { st = null; }
    if (st && !T_.valid(st, (id) => !!S.find(id))) { st = null; clearTour(); } // キャラが消された
    tourState = st;
    return st;
  }
  function saveTour() {
    try { global.localStorage.setItem(TOUR_KEY, JSON.stringify(tourState)); } catch (e) { /* 保存できなくても動く(ページを閉じると消える) */ }
  }
  function clearTour() {
    tourState = null;
    tourMatch = null;
    try { global.localStorage.removeItem(TOUR_KEY); } catch (e) { /* なし */ }
  }
  // 「2回戦 ・ 1勝どうし」(1回戦は「1回戦」だけ)
  const matchTitle = (st, r, m) => { const l = T_.matchLabel(st, r, m); return UI.esc(T_.roundName(st, r) + (l ? ` ・ ${l}` : "")); };
  const skillModeText = (m) => (m === "carry" ? "最初に決めて持ち越し" : "毎回ランダム");

  // ---- 準備:人数・キャラ・ルール ----
  const tsetup = { count: 8, picked: [], bestOf: 1, skillMode: "random" };
  const eligibleChars = () => S.list().filter((c) => !isBanned(c));
  function renderTourSetup() {
    const chars = eligibleChars();
    const max = Math.min(T_.MAX, chars.length);
    if (chars.length < T_.MIN) {
      $("#ts-count").innerHTML = `<span class="muted">キャラが${T_.MIN}人以上必要です(いま${chars.length}人)</span>`;
    } else {
      tsetup.count = Math.max(T_.MIN, Math.min(max, tsetup.count));
      $("#ts-count").innerHTML = `<select id="ts-count-sel" class="list-sort" aria-label="人数">${Array.from({ length: max - T_.MIN + 1 }, (_, i) => T_.MIN + i)
        .map((n) => `<option value="${n}" ${n === tsetup.count ? "selected" : ""}>${n}人</option>`).join("")}</select>`;
    }
    tsetup.picked = tsetup.picked.filter((id) => chars.some((c) => c.id === id)).slice(0, tsetup.count);
    $$("#ts-bestof .bo-btn").forEach((b) => b.classList.toggle("on", Number(b.dataset.v) === tsetup.bestOf));
    $$("#ts-skill .bo-btn").forEach((b) => b.classList.toggle("on", b.dataset.v === tsetup.skillMode));
    $("#ts-skill-note").textContent = tsetup.skillMode === "carry"
      ? "開始のときに全員のスキルを抽選し、最後まで持ち越します。勝つと、相手のスキルと交換できます(自分の前のスキルは相手へ)。"
      : "試合ごとに、ふだんの闘技場と同じようにスキルを抽選します。";
    $("#ts-chars").innerHTML = chars.map((c) => {
      const n = tsetup.picked.indexOf(c.id);
      return `<li data-id="${UI.esc(c.id)}" class="${n >= 0 ? "picked" : ""}" tabindex="0" role="checkbox" aria-checked="${n >= 0}">
        ${UI.charIcon(c, "small")}<div class="li-text"><div class="li-name">${UI.esc(c.name)}${UI.genderMark(c)}</div><div class="li-sub">${UI.esc(c.className)}</div></div>
        ${n >= 0 ? `<b class="ts-no">${n + 1}</b>` : ""}</li>`;
    }).join("");
    const left = tsetup.count - tsetup.picked.length;
    $("#ts-picked").innerHTML = `選んだキャラ <b>${tsetup.picked.length}</b> / ${tsetup.count}人`;
    $("#ts-start").disabled = chars.length < T_.MIN || left !== 0;
    $("#ts-random").disabled = left <= 0 || chars.length < T_.MIN;
    $("#ts-start-note").textContent = chars.length < T_.MIN ? "" : left > 0 ? `あと${left}人選んでください(「残りをランダムで選ぶ」で埋められます)` : "組み合わせは開始のときにランダムで決まります。";
  }
  function togglePick(id) {
    const i = tsetup.picked.indexOf(id);
    if (i >= 0) tsetup.picked.splice(i, 1);
    else if (tsetup.picked.length < tsetup.count) tsetup.picked.push(id);
    renderTourSetup();
  }
  $("#ts-chars").addEventListener("click", (e) => { const li = e.target.closest("li[data-id]"); if (li) togglePick(li.dataset.id); });
  $("#ts-chars").addEventListener("keydown", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); togglePick(li.dataset.id); }
  });
  $("#screen-tsetup").addEventListener("change", (e) => {
    if (e.target.id === "ts-count-sel") { tsetup.count = Number(e.target.value); renderTourSetup(); }
  });
  $("#ts-bestof").addEventListener("click", (e) => { const b = e.target.closest(".bo-btn"); if (b) { tsetup.bestOf = Number(b.dataset.v); renderTourSetup(); } });
  $("#ts-skill").addEventListener("click", (e) => { const b = e.target.closest(".bo-btn"); if (b) { tsetup.skillMode = b.dataset.v; renderTourSetup(); } });
  // 残りをランダムで選ぶ(選んだキャラと同じキャラは選ばない)
  $("#ts-random").addEventListener("click", () => {
    const rest = eligibleChars().map((c) => c.id).filter((id) => !tsetup.picked.includes(id));
    T_.shuffle(rest, () => battleRng.next());
    tsetup.picked.push(...rest.slice(0, tsetup.count - tsetup.picked.length));
    renderTourSetup();
  });
  $("#ts-clear").addEventListener("click", () => { tsetup.picked = []; renderTourSetup(); });
  $("#ts-start").addEventListener("click", () => {
    const skills = {};
    if (tsetup.skillMode === "carry") {
      for (const id of tsetup.picked) {
        const c = S.find(id);
        skills[id] = B.drawSkill(B.makeUnit(c, c.weapons[0], "left"), battleRng);
      }
    }
    tourState = T_.create(tsetup.picked.slice(), { bestOf: tsetup.bestOf, skillMode: tsetup.skillMode, skills, rng: () => battleRng.next() });
    saveTour();
    tourMsg = "";
    goto("tour");
  });

  // ---- トーナメント表 ----
  let tourMsg = "";
  const tName = (id) => { const c = S.find(id); return c ? c.name : "?"; };
  function tourFighter(id) {
    const c = S.find(id);
    const rec = tourState.record[id];
    const sk = tourState.skillMode === "carry" ? `<div class="tn-skill">${UI.skillChip(tourState.skills[id], false)}</div>` : "";
    return `<div class="tn-fighter">${UI.charIcon(c)}<div class="tn-text"><div class="tn-name">${UI.esc(c.name)}${UI.genderMark(c)}</div>
      <div class="tn-sub">${UI.esc(c.className)} ・ ${rec.w}勝${rec.l}敗</div>${sk}</div></div>`;
  }
  function renderTour() {
    const st = loadTour();
    if (!st) { goto("tsetup"); return; }
    $("#tour-rule").textContent = `${st.ids.length}人 ・ ${st.bestOf}本先取 ・ スキル:${skillModeText(st.skillMode)} ・ 勝っても負けても次の試合があり、全員の順位が決まります`;
    const next = T_.nextMatch(st);
    const box = $("#tour-next");
    if (st.done) {
      const champ = S.find(st.ranking[0].id);
      box.className = "tour-next panel done";
      box.innerHTML = `<p class="tn-head">トーナメント終了</p>
        <div class="tn-champ">${UI.charIcon(champ, "large")}<div><small>優勝</small><b>${UI.esc(champ.name)}</b><span>${UI.esc(champ.className)}</span></div></div>
        <div class="card-actions"><button type="button" class="btn btn-main" id="btn-tour-new">新しいトーナメント</button></div>`;
    } else if (next) {
      const m = next.match;
      box.className = "tour-next panel";
      box.innerHTML = `<p class="tn-head">次の試合<span>${matchTitle(st, next.round, m)}</span></p>
        <div class="tn-vs">${tourFighter(m.a)}<b class="tn-v">VS</b>${tourFighter(m.b)}</div>
        <div class="card-actions tn-buttons">
          <button type="button" class="btn btn-main" id="btn-tour-prep">バトル準備へ</button>
          <button type="button" class="btn" id="btn-tour-auto" title="演出なしで、すぐに結果を出します">結果だけ見る(おまかせ)</button>
          <button type="button" class="btn" id="btn-tour-auto-all" title="残りの試合を全部おまかせで進めます">最後までおまかせ</button>
        </div>${tourMsg ? `<p class="tn-msg">${tourMsg}</p>` : ""}`;
    }
    renderBracket(st, next);
    renderEntries(st);
    const q = $("#btn-tour-quit");
    q.dataset.confirm = "";
    q.textContent = st.done ? "結果を消して最初から" : "トーナメントをやめる";
  }
  function renderBracket(st, next) {
    const R = T_.totalRounds(st);
    const cols = [];
    for (let r = 0; r < R; r++) {
      const round = st.rounds[r];
      let body;
      if (!round) {
        body = `<p class="tb-wait">前の回戦が終わると、組み合わせが決まります</p>`;
      } else {
        body = round.matches.filter((m) => !(T_.isBye(m.a) && T_.isBye(m.b))).map((m) => {
          const i = round.matches.indexOf(m);
          const cur = next && next.round === r && next.index === i;
          const side = (id) => {
            if (T_.isBye(id)) return `<div class="tb-p bye">(不在)</div>`;
            const win = m.winner === id, lose = m.loser === id;
            return `<div class="tb-p${win ? " win" : ""}${lose ? " lose" : ""}"><span>${UI.esc(tName(id))}</span>${win ? `<em>${m.bye ? "不戦勝" : m.judge ? "判定" : m.score || "勝"}</em>` : ""}</div>`;
          };
          const label = m.bye ? "不戦勝" : T_.matchLabel(st, r, m);
          return `<div class="tb-m${cur ? " current" : ""}${m.bye ? " is-bye" : ""}">${label ? `<small>${UI.esc(label)}</small>` : ""}${side(m.a)}${side(m.b)}</div>`;
        }).join("");
      }
      cols.push(`<div class="tb-col${round && r === st.round && !st.done ? " now" : ""}"><p class="tb-h">${T_.roundName(st, r)}</p>${body}</div>`);
    }
    $("#tour-bracket").innerHTML = cols.join("");
  }
  function renderEntries(st) {
    const rankOf = st.ranking ? Object.fromEntries(st.ranking.map((x) => [x.id, x.rank])) : null;
    const ids = st.ids.slice().sort((a, b) => rankOf ? rankOf[a] - rankOf[b] : (st.record[b].w - st.record[a].w) || (st.record[a].l - st.record[b].l));
    const carry = st.skillMode === "carry";
    $("#tour-entries").innerHTML = `<h3 class="sub">${rankOf ? "最終順位" : "参加キャラ(成績順)"}</h3>
      <table class="tour-table"><thead><tr>${rankOf ? "<th>順位</th>" : ""}<th>キャラ</th><th>クラス</th><th>成績</th>${carry ? "<th>スキル</th>" : ""}</tr></thead><tbody>
      ${ids.map((id) => {
        const c = S.find(id), rec = st.record[id], rk = rankOf ? rankOf[id] : 0;
        const medal = rk === 1 ? " gold" : rk === 2 ? " silver" : rk === 3 ? " bronze" : rk === st.ids.length ? " last" : "";
        return `<tr class="${medal}">${rankOf ? `<td class="rk">${rk === st.ids.length ? `${rk}位<small>最下位</small>` : `${rk}位`}</td>` : ""}<td class="nm">${UI.esc(c.name)}${UI.genderMark(c)}</td><td class="cl">${UI.esc(c.className)}</td><td>${rec.w}勝${rec.l}敗</td>${carry ? `<td>${UI.skillChip(st.skills[id], false)}</td>` : ""}</tr>`;
      }).join("")}</tbody></table>`;
  }
  $("#screen-tour").addEventListener("click", (e) => {
    const id = e.target.id;
    if (id === "btn-tour-prep") {
      tourMatch = T_.nextMatch(tourState);
      if (tourMatch) goto("prep");
    } else if (id === "btn-tour-auto") {
      autoNext();
      renderTour();
    } else if (id === "btn-tour-auto-all") {
      let n = 0;
      while (!tourState.done && n < 64) { autoNext(); n++; }
      tourMsg = `${n}試合をおまかせで進めました。`;
      renderTour();
    } else if (id === "btn-tour-new") {
      clearTour();
      goto("tsetup");
    } else if (id === "btn-tour-quit") {
      const b = e.target;
      if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = "本当にやめる?(もう一度押す)"; return; }
      clearTour();
      goto("tsetup");
    }
  });

  // その試合で一番強そうな武器(おまかせ用):1ラウンドに与えるダメージの期待値が大きいもの
  function bestWeapon(char, foe, foeWeapon) {
    let best = char.weapons[0], score = -1;
    for (const w of char.weapons) {
      if (!DB.weapons[w]) continue;
      const me = B.makeUnit(char, w, "left"), en = B.makeUnit(foe, foeWeapon, "right");
      if (me.laguz) me.laguz.transformed = true;
      if (en.laguz) en.laguz.transformed = true;
      const c = B.calc(me, en);
      const v = c.damage * c.times * c.hit + c.crit;
      if (v > score) { score = v; best = w; }
    }
    return best;
  }
  // 結果だけ見る:演出なしで1試合(N本先取)を計算し、記録する
  function autoNext() {
    const st = tourState;
    const nm = T_.nextMatch(st);
    if (!nm) return;
    const m = nm.match;
    const ca = S.find(m.a), cb = S.find(m.b);
    const wa = st.weapons[m.a] || bestWeapon(ca, cb, cb.weapons[0]);
    const wb = st.weapons[m.b] || bestWeapon(cb, ca, wa);
    const L = B.makeUnit(ca, wa, "left"), R = B.makeUnit(cb, wb, "right");
    L.bio = rollBio(); R.bio = rollBio();
    if (st.skillMode === "carry") { L.skill = st.skills[m.a] || null; R.skill = st.skills[m.b] || null; }
    else { L.skill = B.drawSkill(L, battleRng); R.skill = B.drawSkill(R, battleRng); }
    const need = st.bestOf, wins = { left: 0, right: 0 };
    let first = B.decideFirst(L, R, battleRng).side, last = null;
    for (let match = 1; match <= need * 2 + 1; match++) {
      if (match > 1) {
        const lp = B.hasSkill(L, R, "待ち伏せ") || L.weapon.alwaysFirst, rp = B.hasSkill(R, L, "待ち伏せ") || R.weapon.alwaysFirst;
        first = lp !== rp ? (lp ? "left" : "right") : first === "left" ? "right" : "left";
      }
      const sim = B.simulate(B.cloneUnit(L), B.cloneUnit(R), battleRng, { firstSide: first });
      last = sim.events[sim.events.length - 1];
      if (sim.winner !== "draw") wins[sim.winner]++;
      if (wins.left >= need || wins.right >= need) break;
    }
    let side = wins.left === wins.right ? "draw" : wins.left > wins.right ? "left" : "right";
    let judge = false;
    if (side === "draw") { side = judgeWinner(last, battleRng); judge = true; }
    const winId = side === "left" ? m.a : m.b, loseId = side === "left" ? m.b : m.a;
    T_.report(st, nm.index, winId, { score: need > 1 ? `${Math.max(wins.left, wins.right)}-${Math.min(wins.left, wins.right)}` : null, judge });
    // 持ち越し:おまかせのときは、交換すると強くなりそうなら交換する…のではなく、交換しない(選ぶのはプレイヤー)
    saveTour();
    tourMsg = `${UI.esc(tName(winId))} が ${UI.esc(tName(loseId))} に${judge ? "判定" : ""}勝ちました(おまかせ)。`;
  }

  // ---- バトル準備・バトルとのつなぎ ----
  function renderTourInfo() {
    const on = !!tourMatch || !!arcMatch;
    $("#battle-options").hidden = on;
    $("#tour-info").hidden = !on;
    $("#prep-title").textContent = arcMatch ? "アーケード ― バトル準備" : tourMatch ? "トーナメント ― バトル準備" : "バトル準備";
    if (!on) return;
    if (arcMatch) {
      const st = arcState, ex = st.stage === A_.EXTRA;
      $("#tour-info").innerHTML = `<p class="ti-round">${A_.stageName(st.stage)}${ex ? "(赤竜イナ)" : ""} / 全${A_.STAGES}戦</p>
        <p class="ti-rule">1本先取 ・ スキル:${arcSkillModeText(st.skillMode)} ・ ${ex ? `イナ戦 残り${A_.inaLeft(st)}回` : `コンティニュー${st.continues}回`}</p>
        <button type="button" class="link-btn" data-goto="arcade">アーケード画面へ戻る</button>`;
      return;
    }
    const st = tourState, m = tourMatch.match;
    $("#tour-info").innerHTML = `<p class="ti-round">${matchTitle(st, tourMatch.round, m)}</p>
      <p class="ti-rule">${st.bestOf}本先取 ・ スキル:${skillModeText(st.skillMode)}</p>
      <button type="button" class="link-btn" data-goto="tour">トーナメント表へ戻る</button>`;
  }
  // 試合が終わったら記録する。持ち越しなら、勝ったキャラは相手のスキルと交換できる
  let tourSwap = null;
  function tourFinished(e, wins) {
    const t = battle.tour;
    battle.tour = null;
    tourMatch = null;
    const st = loadTour();
    const swapBtn = $("#btn-tour-swap"), text = $("#tour-swap-text");
    swapBtn.hidden = true; text.textContent = ""; tourSwap = null;
    $("#btn-tour-next").textContent = "トーナメント表へ";
    if (!st || st.round !== t.round || st.rounds[t.round].matches[t.index].winner) return; // もう記録済み
    const winId = e.winner === "left" ? t.match.a : t.match.b, loseId = e.winner === "left" ? t.match.b : t.match.a;
    const score = wins ? `${Math.max(wins.left, wins.right)}-${Math.min(wins.left, wins.right)}` : null;
    T_.report(st, t.index, winId, { score, judge: !!e.judge });
    saveTour();
    tourMsg = "";
    if (st.skillMode !== "carry") return;
    const mine = st.skills[winId], theirs = st.skills[loseId];
    if (!theirs || mine === theirs) return;
    // エリートはラグズ・上級職のない職業には使えない
    const wc = S.find(winId);
    const usable = UI.skillInfo(theirs) && !(UI.skillInfo(theirs).beorcOnly && (wc.race === "ラグズ" || !DB.promotionOf(wc.className)));
    text.innerHTML = usable
      ? `勝った <b>${UI.esc(wc.name)}</b> は、${UI.esc(tName(loseId))}のスキル${UI.skillChip(theirs, false)}と、自分の${UI.skillChip(mine, false)}を交換できます。`
      : `${UI.esc(tName(loseId))}のスキル『${UI.esc(theirs)}』は ${UI.esc(wc.name)} には使えないため、交換できません。`;
    if (usable) { swapBtn.hidden = false; tourSwap = { winId, loseId }; }
    $("#btn-tour-next").textContent = usable ? "交換せずにトーナメント表へ" : "トーナメント表へ";
  }
  $("#btn-tour-swap").addEventListener("click", () => {
    if (tourSwap && tourState) {
      T_.swapSkills(tourState, tourSwap.winId, tourSwap.loseId);
      saveTour();
      tourMsg = `${UI.esc(tName(tourSwap.winId))} は『${UI.esc(tourState.skills[tourSwap.winId])}』を手に入れました。`;
    }
    tourSwap = null;
    goto("tour");
  });
  $("#btn-tour-next").addEventListener("click", () => { tourSwap = null; goto("tour"); });

  // ================= アーケード(v1.6.0) =================
  // 計算は js/arcade.js。ここは画面(準備・勝ち抜きの表・スキルの選択・レベルアップの演出・結果)とバトルとのつなぎ
  const ARC_KEY = "arenaBattle.arcade";
  function loadArc() {
    if (arcState && !S.find(arcState.charId)) clearArc(); // キャラが削除された
    if (arcState) return arcState;
    let st = null;
    try { st = JSON.parse(global.localStorage.getItem(ARC_KEY) || "null"); } catch (e) { st = null; }
    if (st && !A_.valid(st, (id) => !!S.find(id))) { st = null; clearArc(); }
    arcState = st;
    return st;
  }
  function saveArc() {
    try { global.localStorage.setItem(ARC_KEY, JSON.stringify(arcState)); } catch (e) { /* 保存できなくても動く */ }
  }
  function clearArc() {
    arcState = null;
    arcMatch = null;
    try { global.localStorage.removeItem(ARC_KEY); } catch (e) { /* なし */ }
  }
  const arcPlayer = () => A_.playerChar(arcState, S.find(arcState.charId));
  const arcEnemy = () => A_.ensureEnemy(arcState);
  const arcSkillModeText = (m) => (m === "carry" ? "最初に選んで持ち越し" : "毎回ルーレット");
  const chips = (list) => list.filter(Boolean).map((n) => UI.skillChip(n, false)).join("");

  // スキルを決める。敵は決まっている。自分は持ち越しなら決まっている、毎回ルーレットなら draw のときに抽選(イナ戦は2つ)
  function arcSkills(L, R, draw) {
    const en = arcEnemy();
    R.skill = en.skill || null;
    R.extraSkills = (en.extraSkills || []).slice();
    if (arcState.skillMode === "carry") {
      L.skill = arcState.skills[0] || null;
      L.extraSkills = arcState.skills.slice(1);
    } else if (draw) {
      L.extraSkills = [];
      L.skill = B.drawSkill(L, battleRng);
      if (arcState.stage === A_.EXTRA) {
        let s2 = null;
        for (let i = 0; i < 40 && (!s2 || s2 === L.skill); i++) s2 = B.drawSkill(L, battleRng);
        if (s2 && s2 !== L.skill) L.extraSkills = [s2];
      }
    } else {
      L.skill = null;
      L.extraSkills = [];
    }
  }

  // ---- 準備:キャラ・スキルの決め方 ----
  const asetup = { pick: null, skillMode: "random" };
  function renderArcSetup() {
    const chars = eligibleChars();
    if (!chars.some((c) => c.id === asetup.pick)) asetup.pick = null;
    $$("#as-skill .bo-btn").forEach((b) => b.classList.toggle("on", b.dataset.v === asetup.skillMode));
    $("#as-skill-note").textContent = asetup.skillMode === "carry"
      ? "最初に、ランダムの2つのスキルから1つを選びます。勝つたびに、ランダムの2つか倒した敵のスキルと交換できます(交換しなくてもよい)。10体目を倒したときだけ、2つ目のスキルとして追加できます。"
      : "試合ごとにスキルのルーレット。EXTRA(イナ戦)だけはスキルが2つになります。";
    $("#as-chars").innerHTML = chars.length ? chars.map((c) => `<li data-id="${UI.esc(c.id)}" class="${c.id === asetup.pick ? "picked" : ""}" tabindex="0" role="radio" aria-checked="${c.id === asetup.pick}">
        ${UI.charIcon(c, "small")}<div class="li-text"><div class="li-name">${UI.esc(c.name)}${UI.genderMark(c)}</div><div class="li-sub">${UI.esc(c.className)}</div></div></li>`).join("")
      : `<li class="empty">バトルに出せるキャラがいません。<button type="button" class="link-btn" data-goto="create">キャラ作成</button>から作ってください。</li>`;
    const c = asetup.pick ? S.find(asetup.pick) : null;
    $("#as-picked").innerHTML = c ? `選んだキャラ <b>${UI.esc(c.name)}</b>(${UI.esc(c.className)})` : "キャラを1人選んでください";
    $("#as-start").disabled = !c;
    $("#as-start-note").textContent = c ? "Lv1から始まります(キャラ一覧の能力値は変わりません)。" : "";
  }
  const pickArc = (id) => { asetup.pick = id; renderArcSetup(); };
  $("#as-chars").addEventListener("click", (e) => { const li = e.target.closest("li[data-id]"); if (li) pickArc(li.dataset.id); });
  $("#as-chars").addEventListener("keydown", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pickArc(li.dataset.id); }
  });
  $("#as-skill").addEventListener("click", (e) => { const b = e.target.closest(".bo-btn"); if (b) { asetup.skillMode = b.dataset.v; renderArcSetup(); } });
  $("#as-start").addEventListener("click", () => {
    const c = asetup.pick && S.find(asetup.pick);
    if (!c) return;
    arcState = A_.create(c, { skillMode: asetup.skillMode, rng: battleRng });
    A_.ensureEnemy(arcState);
    saveArc();
    arcMsg = "";
    goto("arcade");
  });

  // ---- アーケードの画面 ----
  let arcMsg = "";
  let arcPlaying = false;
  function renderArcade() {
    const st = loadArc();
    if (!st) { goto("asetup"); return; }
    const saved = S.find(st.charId);
    $("#arc-rule").textContent = `${saved.name} ・ スキル:${arcSkillModeText(st.skillMode)} ・ コンティニュー${st.continues}回 ・ 10体目を倒すと★、EXTRAのイナを倒すと★★`;
    renderLadder(st);
    renderArcMe(st);
    const q = $("#btn-arc-quit");
    q.dataset.confirm = "";
    q.textContent = st.done ? "結果を消して最初から" : "アーケードをやめる";
    q.hidden = false;
    const box = $("#arc-main");
    box.className = "tour-next panel";
    // 勝ったあとのレベルアップ(1回ずつ)→ スキルの選択 → 次の敵
    if (st.pending.length && st.pending[0].type !== "skill") {
      box.innerHTML = `<p class="tn-head">レベルアップ<span>画面をタップすると次へ進みます</span></p>`;
      playArcPending();
      return;
    }
    if (st.pending.length) { renderSkillChoice(st); return; }
    if (st.done) { renderArcResult(st); return; }
    renderArcNext(st);
  }
  function renderLadder(st) {
    $("#arc-ladder").innerHTML = Array.from({ length: A_.STAGES }, (_, i) => {
      const n = i + 1;
      const e = st.enemies[n];
      const done = n <= st.cleared, now = n === st.stage && !st.done;
      const sub = done && e ? UI.esc(e.name) : n === A_.EXTRA ? "イナ" : n >= A_.PROMOTED_FROM ? "上級職" : "";
      return `<li class="${done ? "done" : ""}${now ? " now" : ""}${n === A_.EXTRA ? " extra" : ""}"><b>${n === A_.EXTRA ? "EX" : n}</b><small>${sub}</small>${n === A_.STAR_STAGE ? '<i class="arc-mark">★</i>' : n === A_.EXTRA ? '<i class="arc-mark arc-full">★★</i>' : ""}</li>`;
    }).join("");
  }
  function renderArcMe(st) {
    const me = arcPlayer();
    const skills = st.skillMode === "carry" ? (chips(st.skills) || '<span class="muted">まだ選んでいない</span>') : '<span class="muted">毎回ルーレット</span>';
    $("#arc-me").innerHTML = `<h3 class="sub">自分のキャラ<span class="muted">(アーケードの中だけのレベル・能力値)</span></h3>
      <div class="arc-me-body">${UI.fighterHeader(me, {})}<div class="arc-me-skill"><span class="sp-k">スキル</span>${skills}</div>${UI.statGrid(me, {})}</div>`;
  }
  function arcFighter(c, skillHtml, weaponId) {
    const w = weaponId ? UI.charWeapon(c, weaponId) : null;
    return `<div class="tn-fighter">${UI.charIcon(c)}<div class="tn-text"><div class="tn-name">${UI.esc(c.name)}${UI.genderMark(c)}</div>
      <div class="tn-sub">${UI.esc(c.className)} ・ Lv${c.arcadeLv}${w ? ` ・ ${UI.esc(w.name)}` : ""}</div><div class="tn-skill">${skillHtml}</div></div></div>`;
  }
  function renderArcNext(st) {
    const me = arcPlayer(), en = arcEnemy();
    saveArc();
    const ex = st.stage === A_.EXTRA;
    const mine = st.skillMode === "carry" ? chips(st.skills) : `<span class="muted">毎回ルーレット${ex ? "(2つ)" : ""}</span>`;
    const theirs = chips([en.skill, ...(en.extraSkills || [])]) || '<span class="muted">スキルなし</span>';
    $("#arc-main").innerHTML = `<p class="tn-head">次の敵<span>${A_.stageName(st.stage)}${ex ? " ― 赤竜イナ" : ""} ・ Lv${en.arcadeLv}${!ex && st.stage >= A_.PROMOTED_FROM ? " ・ 上級職" : ""}</span></p>
      <div class="tn-vs">${arcFighter(me, mine, null)}<b class="tn-v">VS</b>${arcFighter(en, theirs, en.weapon)}</div>
      <div class="card-actions tn-buttons"><button type="button" class="btn btn-main" id="btn-arc-prep">バトル準備へ</button></div>
      ${ex ? `<p class="tn-msg">イナ戦は3回まで(残り${A_.inaLeft(st)}回)</p>` : ""}${arcMsg ? `<p class="tn-msg">${arcMsg}</p>` : ""}`;
  }
  function renderSkillChoice(st) {
    const p = st.pending[0];
    const head = { start: "最初のスキルを選ぶ", swap: "スキルを交換する", add: "2つ目のスキルを追加する" }[p.mode];
    const note = p.mode === "start" ? "どちらか1つを選んでください。このスキルを持ち越して戦います。"
      : p.mode === "add" ? `10体目を倒したので、2つ目のスキルとして追加できます(いまの${chips(st.skills)}はそのまま)。`
        : `いまのスキル${chips(st.skills)}と交換できます。交換しなくてもかまいません。`;
    const opts = p.options.map((o) => {
      const s = UI.skillInfo(o.name);
      return `<button type="button" class="arc-skill${s && s.rare ? " rare" : ""}" data-skill="${UI.esc(o.name)}">
        <span class="as-top">${UI.skillChip(o.name, false)}<small>${o.from === "enemy" ? "倒した敵のスキル" : "ランダム"}</small></span>
        <span class="as-desc">${UI.esc(s ? s.description : "")}</span></button>`;
    }).join("");
    const skip = p.mode === "start" ? "" : `<div class="card-actions tn-buttons"><button type="button" class="btn" id="btn-arc-skip">${p.mode === "add" ? "追加しない" : "交換しない"}</button></div>`;
    $("#arc-main").innerHTML = `<p class="tn-head">${head}</p><p class="arc-note">${note}</p><div class="arc-skills">${opts}</div>${skip}`;
  }
  function renderArcResult(st) {
    const c = S.find(st.charId);
    const title = st.result === "clear" ? "完全制覇" : st.stars ? "アーケード達成" : "アーケード終了";
    const text = st.result === "clear" ? `EXTRAのイナを倒しました!${UI.esc(c.name)}の名前に★★が付きました。`
      : st.result === "over" ? `イナに3回負けました。10体目まで勝ち抜いたので、${UI.esc(c.name)}の名前に★が付きました。`
        : st.stars ? `${A_.stageName(st.stage)}であきらめました。10体目まで勝ち抜いたので、★が付いています。`
          : `${A_.stageName(st.stage)}であきらめました(${st.cleared}体を倒した)。`;
    const box = $("#arc-main");
    box.className = "tour-next panel done";
    box.innerHTML = `<p class="tn-head">アーケード終了</p>
      <div class="tn-champ">${UI.charIcon(c, "large")}<div><small>${title}</small><b>${UI.esc(c.name)}</b><span>${st.stars ? `<i class="arc-mark${st.stars >= 2 ? " arc-full" : ""}">${"★".repeat(st.stars)}</i> ` : ""}${st.cleared}体を倒した ・ コンティニュー${st.continues}回</span></div></div>
      <p class="arc-note">${text}</p>
      <div class="card-actions"><button type="button" class="btn btn-main" id="btn-arc-new">新しいアーケード</button></div>`;
  }

  // 勝ったあとのレベルアップ・クラスチェンジを1回ずつ見せる(タップで次へ)
  async function playArcPending() {
    if (arcPlaying) return;
    arcPlaying = true;
    const saved = S.find(arcState.charId);
    while (arcState && arcState.pending.length && arcState.pending[0].type !== "skill") {
      await levelStep(arcState.pending[0], saved);
      if (!arcState) break;
      arcState.pending.shift();
      saveArc();
    }
    arcPlaying = false;
    if ($("#screen-arcade").classList.contains("active")) renderArcade();
  }
  function levelStep(step, char) {
    return new Promise((resolve) => {
      const ov = $("#levelup");
      const run = ++luRun;
      let skip = reduceMotion();
      let wake = null;
      const wait = async (ms) => {
        if (!skip) await new Promise((r) => { wake = r; setTimeout(r, ms); });
        return run === luRun;
      };
      const cc = step.type === "classchange";
      const laguz = char.race === "ラグズ";
      $(".lu-banner", ov).textContent = cc ? "CLASS CHANGE!" : "LEVEL UP!";
      $("#lu-name").textContent = char.name;
      $("#lu-class").textContent = cc ? `${step.fromClass} → ${step.toClass}` : `${step.className}${laguz ? "(化身前)" : ""}`;
      const lvEl = $("#lu-lv");
      lvEl.textContent = step.from;
      $("#lu-stats").innerHTML = DB.STAT_KEYS.map((k) =>
        `<div class="lu-stat" data-k="${k}"><span class="k">${DB.STAT_LABELS[k]}</span><span class="v">${step.before[k]}</span><span class="up">+${step.gains[k]}</span></div>`).join("");
      $("#lu-hint").textContent = "タップで飛ばす";
      ov.dataset.done = "0";
      ov.hidden = false;
      ov.onclick = () => {
        if (ov.dataset.done === "1") { ov.hidden = true; luRun++; resolve(); }
        else { skip = true; if (wake) wake(); }
      };
      (async () => {
        if (!(await wait(450))) return;
        lvEl.textContent = step.to;
        if (!skip) { lvEl.classList.remove("bump"); void lvEl.offsetWidth; lvEl.classList.add("bump"); }
        if (!(await wait(350))) return;
        for (const k of DB.STAT_KEYS) {
          if (!(step.gains[k] > 0)) continue;
          const row = $(`.lu-stat[data-k="${k}"]`, ov);
          $(".v", row).textContent = step.after[k];
          row.classList.add("got");
          if (!(await wait(cc ? 200 : 300))) return;
        }
        ov.dataset.done = "1";
        $("#lu-hint").textContent = "タップで次へ";
      })();
    });
  }

  $("#screen-arcade").addEventListener("click", (e) => {
    const t = e.target;
    const sk = t.closest(".arc-skill");
    if (t.id === "btn-arc-prep") {
      if (!arcState || arcState.done) return;
      arcMatch = { stage: arcState.stage };
      arcMsg = "";
      goto("prep");
    } else if (sk) {
      const name = sk.dataset.skill;
      const mode = arcState.pending[0] && arcState.pending[0].mode;
      if (A_.chooseSkill(arcState, name)) {
        arcMsg = mode === "add" ? `『${UI.esc(name)}』を2つ目のスキルとして追加しました。` : mode === "swap" ? `『${UI.esc(name)}』に交換しました。` : `『${UI.esc(name)}』で戦います。`;
        saveArc();
        renderArcade();
      }
    } else if (t.id === "btn-arc-skip") {
      if (A_.chooseSkill(arcState, null)) { arcMsg = "スキルはそのままです。"; saveArc(); renderArcade(); }
    } else if (t.id === "btn-arc-new") {
      clearArc();
      goto("asetup");
    } else if (t.id === "btn-arc-quit") {
      if (t.dataset.confirm !== "1") { t.dataset.confirm = "1"; t.textContent = "本当にやめる?(もう一度押す)"; return; }
      clearArc();
      goto("asetup");
    }
  });

  // 試合が終わったら記録する。勝てば次へ(レベルアップ)、負ければコンティニュー/あきらめる
  function arcFinished(e) {
    const t = battle.arc;
    battle.arc = null;
    arcMatch = null;
    const st = loadArc();
    const text = $("#arc-result-text");
    const btnC = $("#btn-arc-continue"), btnN = $("#btn-arc-next"), btnG = $("#btn-arc-giveup");
    btnC.hidden = true; btnG.hidden = true; btnN.hidden = false;
    btnG.dataset.confirm = ""; btnG.textContent = "あきらめる";
    btnN.textContent = "アーケード画面へ";
    text.textContent = "";
    if (!st || st.done || st.stage !== t.stage) return; // もう記録済み
    const saved = S.find(st.charId);
    const stage = t.stage;
    if (e.winner === "left") {
      A_.win(st, saved, battleRng);
      if (st.stars) S.markArcade(st.charId, st.stars);
      const ups = st.pending.filter((p) => p.type !== "skill").length;
      text.innerHTML = stage === A_.EXTRA ? `イナを倒した!アーケード完全制覇 <i class="arc-mark arc-full">★★</i>`
        : stage === A_.STAR_STAGE ? `10体目を倒した!${UI.esc(saved.name)}の名前に<i class="arc-mark">★</i>が付きました。次はEXTRA(赤竜イナ)`
          : `${A_.stageName(stage)}を倒した!${ups ? `レベルが${ups}つ上がります` : ""}`;
      btnN.textContent = "次へ";
    } else {
      A_.lose(st);
      if (st.done) {
        text.textContent = "イナに3回負けました。アーケード終了(10体目までの★はそのまま)";
        btnN.textContent = "結果を見る";
      } else {
        text.textContent = stage === A_.EXTRA ? `負けてしまった…(イナ戦 残り${A_.inaLeft(st)}回)` : "負けてしまった…コンティニューできます(同じ敵ともう一度)";
        btnC.hidden = false; btnG.hidden = false; btnN.hidden = true;
      }
    }
    saveArc();
  }
  $("#btn-arc-continue").addEventListener("click", () => {
    if (!arcState || arcState.done) { goto("arcade"); return; }
    arcMatch = { stage: arcState.stage };
    goto("prep");
  });
  $("#btn-arc-next").addEventListener("click", () => goto("arcade"));
  $("#btn-arc-giveup").addEventListener("click", (e) => {
    const b = e.currentTarget;
    if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = "本当にあきらめる?(もう一度押す)"; return; }
    if (arcState && !arcState.done) { A_.giveUp(arcState); saveArc(); }
    goto("arcade");
  });

  $("#btn-start").addEventListener("click", () => startBattle());
  $("#btn-skip").addEventListener("click", () => {
    battle.skip = true;
    $("#arena-fx").innerHTML = "";
    endKo();
    if (battle.wake) battle.wake();
  });
  $("#btn-speed").addEventListener("click", (e) => {
    battle.speed = battle.speed === 1 ? 0.45 : 1;
    e.target.textContent = battle.speed === 1 ? "速度:ふつう" : "速度:はやい";
  });
  // もう一度:同じキャラ・武器で、バイオリズムと先攻は引き直し。スキルは引き直し or そのまま
  function rematch(keepSkills) {
    prep.left.bio = rollBio();
    prep.right.bio = rollBio();
    startBattle({ keepSkills });
  }
  $("#btn-rematch").addEventListener("click", () => rematch(false));
  $("#btn-rematch-keep").addEventListener("click", () => rematch(true));

  goto("title");
})(window);
