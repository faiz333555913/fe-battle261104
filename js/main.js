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
  // v1.7.0:3on3(計算は js/teambattle.js)
  const TB = global.TeamBattle;

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
    if (name === "ttsetup") renderTTSetup(); // v1.7.0
    if (name !== "battle") battle.team = null;
    $("#tt-topnext").hidden = true; // v1.7.4
    arcStatsSync(); // v1.8.2
    if (name === "howto") $("#screen-howto").scrollTop = 0;
    if (name === "data") renderData(); // v1.6.4
    window.scrollTo(0, 0);
  }

  // ================= v1.6.4:データ集(武器・スキル・職業・ラグズ・属性) =================
  // 中身はすべて data/*.json(GameDB)と config.js から作る(数値を変えれば、データ集も変わる)
  const dataView = { tab: "weapon", weapon: "sword", cls: "base", laguz: "base", skill: "all" };
  const STAT_HEAD = (keys) => keys.map((k) => `<th>${DB.STAT_LABELS[k]}</th>`).join("");
  const STAT_KEYS_CON = DB.STAT_KEYS.concat(["con"]);
  function dataFilterHtml(key, items) {
    return `<div class="data-chips" data-key="${key}">${items.map(([v, label]) =>
      `<button type="button" class="data-chip${dataView[key] === v ? " on" : ""}" data-val="${UI.esc(v)}">${UI.esc(label)}</button>`).join("")}</div>`;
  }
  // スキルの「出る相手・条件」の札
  function skillTags(s) {
    const tags = [];
    if (s.bossOnly) tags.push("ボス専用");
    else if (s.classOnly) {
      const who = Object.entries(C.classSkills || {}).filter(([, n]) => n === s.name).map(([c]) => c);
      tags.push(`兵種スキル:${who.join("・")}`);
    }
    if (C.ougiSkills.includes(s.name)) tags.push("奥義");
    if (s.rare) tags.push("レア");
    // v1.6.5:「◯◯だけ」の「だけ」を削除(ガトー指示)
    if (s.magicOnly) tags.push("魔法を使うキャラ");
    if (s.beorcOnly) tags.push("ベオク");
    if (s.onlyClasses) tags.push(`${s.onlyClasses.join("・")}`);
    if (s.laguzOnly) tags.push(s.excludeClasses ? `${s.excludeClasses.join("・")}以外のラグズ` : "ラグズ");
    const weapons = Object.values(DB.weapons).filter((w) => w.weaponSkill === s.name).map((w) => w.name);
    if (weapons.length) tags.push(`武器:${weapons.join("・")}`);
    return tags;
  }
  function renderData() {
    const tab = dataView.tab;
    $$("#screen-data .data-tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    const filter = $("#data-filter"), body = $("#data-body");
    let f = "", html = "";
    if (tab === "weapon") {
      const cats = Object.keys(DB.CATEGORY_LABELS).map((k) => [k, DB.CATEGORY_LABELS[k]]);
      f = dataFilterHtml("weapon", cats);
      const list = Object.values(DB.weapons).filter((w) => w.category === dataView.weapon);
      html = `<h3>武器:${UI.esc(DB.CATEGORY_LABELS[dataView.weapon])}<small>${list.length}種類</small></h3>
        <p class="data-note">★はレア度(★が多いほど出にくい)。◆はオリジナル武器、「専用」はキャラ作成では出ない武器です。${dataView.weapon === "laguz" ? "化身前は威力0です。" : ""}</p>
        <div class="data-scroll"><table class="data-table weapon-table"><thead><tr><th class="l">名前</th><th>★</th><th>威力</th><th>命中</th><th>必殺</th><th>重さ</th><th class="l">効果</th></tr></thead><tbody>
        ${list.map((w) => `<tr><td class="l"><b>${UI.esc(w.name)}</b>${w.custom ? '<span class="w-custom" title="オリジナル武器">◆</span>' : ""}${w.exclusive ? '<span class="data-tag">専用</span>' : ""}${w.isMagic && !C.magicCategories.includes(w.category) ? '<span class="data-tag">魔</span>' : ""}</td>
          <td class="star">${DB.weaponStars(w) ? "★".repeat(DB.weaponStars(w)) : "-"}</td><td>${w.might}</td><td>${w.hit}</td><td>${w.crit}</td><td>${w.weight}</td>
          <td class="l eff">${UI.esc(UI.weaponEffect(w) || "")}${DB.isMarkable(w) ? '<span class="data-tag forge">錬成の対象</span>' : ""}</td></tr>`).join("")}
        </tbody></table></div>`;
    } else if (tab === "skill") {
      f = dataFilterHtml("skill", [["all", "すべて"], ["draw", "抽選に出る"], ["ougi", "奥義"], ["class", "兵種・ボス"]]);
      const all = DB.skills.filter((s) => {
        if (dataView.skill === "draw") return !s.classOnly;
        if (dataView.skill === "ougi") return C.ougiSkills.includes(s.name);
        if (dataView.skill === "class") return !!s.classOnly;
        return true;
      });
      html = `<h3>スキル<small>${all.length}種類</small></h3>
        <p class="data-note">多くのスキルは、技の数値%の確率で発動します。抽選のスキルは、対戦のはじめにルーレットで1人1つ決まります。</p>
        <div class="data-skills">${all.map((s) => `<div class="data-skill"><div class="ds-top">${s.classOnly && !s.bossOnly ? `<span class="skill-chip class-skill">${UI.esc(s.name)}</span>` : UI.skillChip(s.name, false)}${skillTags(s).map((t) => `<span class="data-tag">${UI.esc(t)}</span>`).join("")}</div>
          <p>${UI.esc(s.description)}</p></div>`).join("")}</div>`;
    } else if (tab === "class") {
      f = dataFilterHtml("cls", [["base", "基本値(Lv1)"], ["growth", "成長率(%)"], ["max", "上限"]]);
      const list = DB.classes.filter((c) => c.race === "ベオク");
      const val = (c, k) => (k === "con" ? c.con : dataView.cls === "growth" ? c.growth[k] : dataView.cls === "max" ? c.max[k] : c.base[k]);
      const keys = dataView.cls === "base" ? STAT_KEYS_CON : DB.STAT_KEYS;
      html = `<h3>職業(ベオク)<small>${list.length}種類</small></h3>
        <p class="data-note">キャラ作成では、職業の基本値に個人差(0〜2)を足し、成長率でLv20まで育ちます。エリート・アーケードでは右の上級職にクラスチェンジします。</p>
        <div class="data-scroll"><table class="data-table"><thead><tr><th class="l">職業</th><th>移動</th><th class="l">武器</th>${STAT_HEAD(keys)}<th class="l">上級職</th></tr></thead><tbody>
        ${list.map((c) => { const p = DB.promotionOf(c.name); const cs = DB.classSkillOf(c.name); return `<tr><td class="l"><b>${UI.esc(c.name)}</b>${cs ? `<span class="skill-chip class-skill mini">${UI.esc(cs)}</span>` : ""}</td><td>${UI.esc(c.moveType)}</td>
          <td class="l">${c.weaponCategories.map((k) => DB.CATEGORY_LABELS[k]).join("・")}</td>${keys.map((k) => `<td>${val(c, k)}</td>`).join("")}<td class="l">${p ? UI.esc(p.name) : "-"}</td></tr>`; }).join("")}
        </tbody></table></div>`;
    } else if (tab === "laguz") {
      f = dataFilterHtml("laguz", [["base", "化身前の基本値"], ["transform", "化身で上がる分"], ["growth", "成長率(%)"]]);
      const list = DB.classes.filter((c) => c.race === "ラグズ" && !c.banned);
      const keys = dataView.laguz === "base" ? STAT_KEYS_CON : DB.STAT_KEYS;
      const val = (c, k) => (k === "con" ? c.con : dataView.laguz === "growth" ? c.growth[k] : dataView.laguz === "transform" ? `+${c.transform[k]}` : c.base[k]);
      html = `<h3>ラグズ<small>${list.length}種類</small></h3>
        <p class="data-note">ラグズはLv10まで育った状態で生まれます。化身ゲージの初期値は幸運+部族の分。化身前はラウンドごとに+4、ダメージを受けると+${C.laguzGauge.damageGain}。20で化身し、化身中はラウンドの終わりに-${C.laguzGauge.decay}されます。</p>
        <div class="data-scroll"><table class="data-table"><thead><tr><th class="l">種類</th><th>部族</th><th>移動</th><th>ゲージ</th><th class="l">武器</th>${STAT_HEAD(keys)}</tr></thead><tbody>
        ${list.map((c) => `<tr><td class="l"><b>${UI.esc(c.name)}</b></td><td>${UI.esc(c.tribe || "")}</td><td>${UI.esc(c.moveType)}</td><td>幸運${c.gaugeBonus ? "+" + c.gaugeBonus : ""}</td>
          <td class="l">${UI.esc((DB.weapons[c.fixedWeapon] || {}).name || "")}</td>${keys.map((k) => `<td>${val(c, k)}</td>`).join("")}</tr>`).join("")}
        </tbody></table></div>`;
    } else {
      // v1.6.5:属性は入力すべてからランダム。出やすさ(12分のいくつ)を出す
      const wsum = Object.values(C.elementWeights).reduce((a, b) => a + b, 0);
      const months = (el) => `${C.elementWeights[el] || 0}/${wsum}`;
      const sg = (v) => (v ? "+" + v : "-");
      html = `<h3>属性<small>入力からランダムで決まる</small></h3>
        <p class="data-note">属性の補正は、いつも能力に足されます。不利な相手(炎→水、水→雷、雷→風、風→炎、光⇔闇)と戦うときは、補正がなくなります。『能力勝負』でも無効になります。</p>
        <div class="data-scroll"><table class="data-table"><thead><tr><th class="l">属性</th><th>出やすさ</th><th>攻撃</th><th>防御</th><th>命中</th><th>回避</th><th>伸びやすい能力</th><th>苦手な属性</th></tr></thead><tbody>
        ${Object.entries(DB.elementBonus).map(([el, b]) => `<tr><td class="l">${UI.elementBadge ? UI.elementBadge(el) : UI.esc(el)}</td><td>${months(el)}</td><td>${sg(b.attack)}</td><td>${sg(b.defense)}</td><td>${sg(b.hit)}</td><td>${sg(b.avoid)}</td>
          <td>${DB.STAT_LABELS[C.elementGrowthBonus[el]] || ""}</td><td>${(C.elementWeakTo[el] || []).join("・") || "なし"}</td></tr>`).join("")}
        </tbody></table></div>`;
    }
    filter.innerHTML = f;
    filter.hidden = !f;
    body.innerHTML = html;
  }
  $("#screen-data").addEventListener("click", (e) => {
    const tab = e.target.closest(".data-tab");
    if (tab) { dataView.tab = tab.dataset.tab; renderData(); return; }
    const chip = e.target.closest(".data-chip");
    if (chip) { dataView[chip.closest(".data-chips").dataset.key] = chip.dataset.val; renderData(); }
  });

  // ================= タイトル(v1.4.0) =================
  // PRESS START → 押すと速く点滅 → ゆっくり暗転 → メニューが左右からスライドして中央で止まる
  const titleScreen = $("#screen-title");
  // v1.8.1:端末の「視差効果を減らす」がONでも演出は出す(iPhone でタイトルの演出が出なかった)
  const reduceMotion = () => false;
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
  // v1.8.2:起動したとき、背景だけが下から上へスクロールして今の位置で止まり、そのあと紋章とロゴ、残りの文字が出る。
  //         途中で押すと(クリック・Enter)最後の形まで飛ばす
  let introTimers = [];
  const titleBg = $(".title-bg");
  function endIntro() {
    introTimers.forEach(clearTimeout); introTimers = [];
    titleScreen.classList.remove("intro", "show"); titleBg.classList.remove("intro", "show");
  }
  function startIntro() {
    if (!titleScreen.classList.contains("active")) return;
    titleScreen.classList.add("intro"); titleBg.classList.add("intro");
    introTimers.push(setTimeout(() => { titleScreen.classList.add("show"); titleBg.classList.add("show"); }, 3200));
    introTimers.push(setTimeout(endIntro, 3200 + 1800));
  }
  startIntro();
  let pressing = false;
  async function pressStart() {
    if (titleScreen.classList.contains("intro")) { endIntro(); return; }
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
    updateTTButton();
    showModeGroup("main");
    titleScreen.dataset.stage = "mode";
    slideIn($(".mode-menu", titleScreen));
    modeBusy = false;
  }
  async function closeModeMenu() {
    if (modeBusy || titleScreen.dataset.stage !== "mode") return;
    modeBusy = true;
    await slideOut(modeButtons());
    if (titleScreen.dataset.stage !== "mode") { modeBusy = false; return; }
    showModeGroup("main");
    enterMenu();
  }
  // v1.7.4:モードの中の選択(闘技場 → 1対1 / 3on3、アーケード → 1対1 / 3on3 / アイクモード)。
  //   同じメニューの中でボタンを入れかえ、タイトルのメニューと同じ動き(引っ込む → 左右から出てくる)で出す
  const modeButtons = () => $$(".mode-menu .btn", titleScreen).filter((b) => !b.hidden);
  function showModeGroup(group) {
    $$(".mode-menu .btn", titleScreen).forEach((b) => { b.hidden = b.dataset.group !== group; });
    $(".mode-menu", titleScreen).dataset.group = group;
  }
  async function switchModeGroup(group) {
    if (modeBusy || titleScreen.dataset.stage !== "mode") return;
    modeBusy = true;
    await slideOut(modeButtons());
    if (titleScreen.dataset.stage !== "mode") { modeBusy = false; return; }
    updateTTButton();
    updateArcSubButtons();
    showModeGroup(group);
    slideIn($(".mode-menu", titleScreen));
    modeBusy = false;
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
    // v1.6.1:アイクモードはキャラがいなくても遊べる
    $("#btn-mode-arcade").disabled = false;
    $("#arc-mode-note").textContent = saved ? (saved.done ? "結果を見る" : `続きから(${A_.isIke(saved) ? "アイク・" : A_.isTeam(saved) ? "3on3・" : ""}${A_.stageName(saved.stage, saved)})`) : n < 1 ? "アイクモードで遊べる" : "1人もしくは3on3で連戦を勝ち抜く";
  }
  // v1.7.4:アーケードの中の 1対1(キャラ1人以上)/ 3on3(3人以上)/ アイクモード(いつでも)
  function updateArcSubButtons() {
    const n = S.list().filter((c) => !isBanned(c)).length;
    $("#btn-arc-normal").disabled = n < 1;
    $("#arc-normal-note").textContent = n < 1 ? "キャラが1人以上必要" : "1人で11連戦を勝ち抜く";
    $("#btn-arc-team").disabled = n < A_.TEAM_SIZE;
    $("#arc-team-note").textContent = n < A_.TEAM_SIZE ? `キャラが3人以上必要(いま${n}人)` : "3人のチームで11連戦を勝ち抜く";
  }
  // v1.7.0:3on3は、出られるキャラが3人以上いないと選べない
  function updateTTButton() {
    const n = S.list().filter((c) => !isBanned(c)).length;
    $("#btn-mode-3on3").disabled = n < TB.SIZE;
    $("#tt-mode-note").textContent = n < TB.SIZE ? `キャラが3人以上必要(いま${n}人)` : "3体のチームで戦う";
  }
  $("#btn-battle-mode").addEventListener("click", openModeMenu);
  $("#btn-mode-back").addEventListener("click", closeModeMenu);
  // v1.6.6:縦向きのバトルでは、スキルの説明はスキルの札をタップすると開く(もう一度タップで閉じる)
  $("#arena").addEventListener("click", (e) => {
    const row = e.target.closest(".fighter-row");
    if (row) row.closest(".fighter").classList.toggle("desc-open");
  });
  // v1.7.4:闘技場 → 1対1 / 3on3 を選ぶ
  $("#btn-mode-arena").addEventListener("click", () => switchModeGroup("arena"));
  $("#btn-arena-1v1").addEventListener("click", () => { if (!modeBusy) { tourMatch = null; goto("prep"); } });
  $("#btn-arena-back").addEventListener("click", () => switchModeGroup("main"));
  $("#btn-arcsub-back").addEventListener("click", () => switchModeGroup("main"));
  $("#btn-mode-tour").addEventListener("click", () => {
    if (modeBusy) return;
    tourMatch = null;
    goto(loadTour() ? "tour" : "tsetup");
  });
  // v1.7.4:アーケード → 1対1 / 3on3 / アイクモード を選ぶ(途中のアーケードがあれば、今までどおり続きから)
  $("#btn-mode-arcade").addEventListener("click", () => {
    if (modeBusy) return;
    arcMatch = null;
    if (loadArc()) goto("arcade");
    else switchModeGroup("arcade");
  });
  $$("[data-arc]", titleScreen).forEach((b) => b.addEventListener("click", () => {
    if (modeBusy || b.disabled) return;
    arcMatch = null;
    asetup.mode = b.dataset.arc;
    goto(loadArc() ? "arcade" : "asetup");
  }));
  $("#btn-mode-3on3").addEventListener("click", () => { if (!modeBusy) goto("ttsetup"); });

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
    $("#screen-prep").classList.remove("pt-set-open"); // v1.6.6:縦向きの⚙設定は閉じて始める
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
      // v1.6.1:なりそこない(v1.6.1 の名前は「なりそこないの赤竜」)はずっと化身しているので、化身後を見せる
      prep.right = { charId: en.id, weaponId: en.weapon, bio: rollBio(), view: en.alwaysTransformed || en.gaugeStart >= 20 ? "transformed" : "human", skill: null, arc: true };
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
    return `<div class="skill-pick${ptInfoOpen[side] ? " info-open" : ""}"><label><span class="sp-k">スキル</span><select class="skill-select" data-side="${side}">${opts}</select></label>${ptInfoBtn(side)}
      <p class="sp-desc">${UI.esc(info ? info.description : "")}</p>${ptInfoBox(u, [cur])}</div>`;
  }
  // v1.6.1:アイクモードのアイクの祈りは効果が違う
  const IKE_PRAYER_DESC = "当たればHPが0となる攻撃を受けた時、幸運の確率でHPが1残ります(アイクモード)";
  const arcSkillDesc = (n, ike) => (ike && n === "祈り" ? IKE_PRAYER_DESC : (UI.skillInfo(n) || {}).description || "");
  // トーナメントの持ち越しスキル(バトル準備で見せる)
  function carrySkillHtml(u) {
    if (arcMatch) {
      // v1.6.0:アーケード。敵のスキルは決まっている。自分は持ち越しなら決まっている、毎回ルーレットなら対戦開始のときに決まる
      const list = [u.skill, ...(u.extraSkills || [])].filter(Boolean);
      const random = u.side === "left" && arcState.skillMode !== "carry";
      const chips = random ? `<span class="muted">対戦開始のときにルーレットで決まる${arcState.stage === A_.EXTRA ? "(イナ戦は2つ)" : ""}</span>` : list.length ? list.map((n) => UI.skillChip(n, false)).join("") : '<span class="muted">なし</span>';
      const desc = random ? "" : list.map((n) => { const s = UI.skillInfo(n); return s ? `${UI.esc(n)}:${UI.esc(arcSkillDesc(n, u.side === "left" && A_.isIke(arcState)))}` : ""; }).filter(Boolean).join("<br>");
      return `<div class="skill-pick carry${ptInfoOpen[u.side] ? " info-open" : ""}"><span class="sp-k">スキル</span>${chips}${ptInfoBtn(u.side)}${desc ? `<p class="sp-desc">${desc}</p>` : ""}${ptInfoBox(u, random ? [] : list)}</div>`;
    }
    if (!tourMatch || tourState.skillMode !== "carry") return ptOnlySkillHtml(u);
    const info = UI.skillInfo(u.skill);
    return `<div class="skill-pick carry${ptInfoOpen[u.side] ? " info-open" : ""}"><span class="sp-k">スキル</span>${UI.skillChip(u.skill, false)}${ptInfoBtn(u.side)}<p class="sp-desc">${UI.esc(info ? info.description : "")}</p>${ptInfoBox(u, [u.skill])}</div>`;
  }
  // v1.6.7:スマホ縦向きのバトル準備。スキルの効果は ⓘ ボタンで開く(PC・横向きでは出さない)
  //   中身:スキル(選んだ・持ち越し・敵のスキル)・武器スキル・兵種スキルの効果
  const ptInfoOpen = { left: false, right: false };
  function ptInfoBtn(side) {
    return `<button type="button" class="pt-info" data-side="${side}" aria-label="スキルの効果" aria-expanded="${ptInfoOpen[side] ? "true" : "false"}">i</button>`;
  }
  function ptInfoBox(u, names) {
    const ike = !!(u.char && u.char.ike);
    const parts = names.filter(Boolean).map((n) => `<b>${UI.esc(n)}</b>:${UI.esc(arcSkillDesc(n, ike))}`);
    const ws = u.weapon && u.weapon.weaponSkill ? UI.skillInfo(u.weapon.weaponSkill) : null;
    const cs = UI.skillInfo(DB.classSkillOf(u.className));
    if (ws) parts.push(`<span class="ws-desc">武器:<b>${UI.esc(ws.name)}</b>:${UI.esc(arcSkillDesc(ws.name, ike))}</span>`);
    if (cs) parts.push(`<span class="ws-desc cs-desc">兵種:<b>${UI.esc(cs.name)}</b>:${UI.esc(cs.description)}</span>`);
    return `<p class="pt-sdesc">${parts.join("<br>") || "スキルはありません"}</p>`;
  }
  // 闘技場(スキルは対戦開始のときに決まる)でも、武器スキル・兵種スキルがあれば縦向きでは行を出す
  function ptOnlySkillHtml(u) {
    if (arcMatch || tourMatch || battleOpts.skillPick) return "";
    const ws = u.weapon && u.weapon.weaponSkill;
    const cs = DB.classSkillOf(u.className);
    if (!ws && !cs) return "";
    const chips = (ws ? UI.skillChip(ws, true) : "") + UI.classSkillChip(u.className);
    return `<div class="skill-pick carry pt-only${ptInfoOpen[u.side] ? " info-open" : ""}"><span class="sp-k">スキル</span>${chips}${ptInfoBtn(u.side)}${ptInfoBox(u, [])}</div>`;
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
      $(`#pt-name-${side}`).textContent = char.name; // v1.6.6:縦向きのタブに名前
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
  // v1.7.0:3on3の相手のスキルは、発動するまで「？？？」(hideSkill)
  const hiddenSkillChip = '<span class="skill-chip tt-hidden" title="発動するか、一度戦うと分かります">？？？</span>';
  function skillCells(u) {
    return (u.hideSkill ? hiddenSkillChip : UI.skillChip(u.skill, false)) + (u.extraSkills || []).map((n) => UI.skillChip(n, false)).join("") + (u.weapon.weaponSkill ? UI.skillChip(u.weapon.weaponSkill, true) : "") + UI.classSkillChip(u.className);
  }
  // v1.4.5:スキルの説明(抽選のスキル・武器スキル・俊足などの兵種スキル)
  function skillDescHtml(u) {
    const s = u.hideSkill ? null : UI.skillInfo(u.skill);
    const ws = u.weapon.weaponSkill ? UI.skillInfo(u.weapon.weaponSkill) : null;
    const cs = UI.skillInfo(DB.classSkillOf(u.className));
    const parts = [];
    const ike = !!(u.char && u.char.ike);
    if (s) parts.push((u.extraSkills && u.extraSkills.length ? `${UI.esc(s.name)}:` : "") + UI.esc(arcSkillDesc(s.name, ike)));
    // v1.6.0:2つ目以降のスキル(アーケード)
    for (const n of u.extraSkills || []) { const x = UI.skillInfo(n); if (x) parts.push(`${UI.esc(n)}:${UI.esc(arcSkillDesc(n, ike))}`); }
    if (ws) parts.push(`<span class="ws-desc">武器:${UI.esc(arcSkillDesc(ws.name, ike))}</span>`);
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
    if (el.id === "forecast") renderPtMini(L, R, f);
    $$("[data-fk]", el).forEach((n) => {
      const old = before[n.dataset.fk];
      if (old === undefined || old === n.textContent) return;
      const up = parseFloat(n.textContent) > parseFloat(old);
      flash(n, up ? "fc-up" : "fc-down");
    });
  }

  // ================= v1.6.6:スマホ縦向きのバトル準備 =================
  // 1P・2P・対戦(戦闘予測)のタブ、画面の下に固定する小さな戦闘予測、武器の「変更」、⚙設定。
  // どれも縦向きのときだけ見える(PC・横向きでは CSS で隠している)
  let ptTab = "left";
  function setPtTab(tab) {
    ptTab = tab;
    $("#screen-prep").dataset.ptab = tab;
    $$("#pt-tabs .pt-tab").forEach((b) => { b.classList.toggle("on", b.dataset.ptab === tab); b.setAttribute("aria-selected", b.dataset.ptab === tab ? "true" : "false"); });
  }
  setPtTab("left");
  $("#pt-tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".pt-tab");
    if (b) { setPtTab(b.dataset.ptab); window.scrollTo(0, 0); }
  });
  function renderPtMini(L, R, f) {
    const cell = (v) => `<b>${v}</b>`;
    $("#pt-mini").innerHTML = `<span></span><span>HP</span><span>威力</span><span>命中</span><span>必殺</span><span>攻速</span>
      <span class="pm-name l">${UI.esc(L.name)}</span>${cell(L.hp)}${cell(dmgText(f.left))}${cell(f.left.hit)}${cell(f.left.crit)}${cell(f.left.as)}
      <span class="pm-name r">${UI.esc(R.name)}</span>${cell(R.hp)}${cell(dmgText(f.right))}${cell(f.right.hit)}${cell(f.right.crit)}${cell(f.right.as)}`;
  }
  // v1.6.7:武器は縦向きでも最初から全部見せる(「変更」ボタンは削除)。スキルの効果は ⓘ で開く
  $("#prep-body").addEventListener("click", (e) => {
    const b = e.target.closest(".pt-info");
    if (!b) return;
    e.preventDefault();
    const side = b.dataset.side;
    ptInfoOpen[side] = !ptInfoOpen[side];
    const row = b.closest(".skill-pick");
    row.classList.toggle("info-open", ptInfoOpen[side]);
    b.setAttribute("aria-expanded", ptInfoOpen[side] ? "true" : "false");
  });
  const ptSetting = (open) => $("#screen-prep").classList.toggle("pt-set-open", open);
  $("#btn-pt-gear").addEventListener("click", () => ptSetting(true));
  $("#btn-pt-close").addEventListener("click", () => ptSetting(false));
  // 設定の外側(暗いところ)をタップしても閉じる
  $("#battle-options").addEventListener("click", (e) => { if (e.target === e.currentTarget && $("#screen-prep").classList.contains("pt-set-open")) ptSetting(false); });

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
  // choose(v1.6.1):アーケード。先攻・後攻は「選ぶ権利」を決めて選ぶ(choose が先攻を返す)
  async function roulette(L, R, first, keepSkills, noSkills, spinSides, choose) {
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

    if (choose) {
      const f = await choose(slots, units);
      ov.hidden = true;
      return f;
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
    return first;
  }

  // ---- v1.6.1:アーケードの先攻・後攻(選ぶ権利をルーレットで決める) ----
  // 待ち伏せ・必ず先攻の武器があるときは、今までどおり(選べない)
  async function arcChooseFirst(L, R, slots, units, fx) {
    const choiceText = $("#roulette-choice-text"), choiceBox = $("#roulette-choice");
    const lp = B.hasSkill(L, R, "待ち伏せ") || L.weapon.alwaysFirst, rp = B.hasSkill(R, L, "待ち伏せ") || R.weapon.alwaysFirst;
    const reset = () => { for (const side of ["left", "right"]) { slots[side].classList.remove("done", "rare", "first", "second", "lit"); $(".r-skill", slots[side]).textContent = "?"; } };
    const show = (firstSide) => {
      for (const side of ["left", "right"]) {
        const isFirst = side === firstSide;
        slots[side].classList.remove("lit", "first", "second");
        slots[side].classList.add(isFirst ? "first" : "second", "done");
        $(".r-skill", slots[side]).textContent = isFirst ? "先攻" : "後攻";
      }
    };
    reset();
    if (lp || rp) {
      const d = B.decideFirst(L, R, battleRng);
      $("#roulette-title").textContent = "先攻・後攻";
      show(d.side);
      choiceText.hidden = false;
      choiceText.textContent = `${units[d.side].name}が先攻${d.reason}`;
      await sleep(1400);
      choiceText.hidden = true;
      return d;
    }
    $("#roulette-title").textContent = "先攻・後攻を選ぶ権利";
    let lit = "left";
    if (fx) {
      await spin(C.firstRouletteMs, () => {
        lit = lit === "left" ? "right" : "left";
        for (const side of ["left", "right"]) slots[side].classList.toggle("lit", side === lit);
      });
    }
    const holder = battleRng.next() < 0.5 ? "left" : "right";
    for (const side of ["left", "right"]) {
      slots[side].classList.remove("lit");
      slots[side].classList.toggle("first", side === holder);
      slots[side].classList.toggle("second", side !== holder);
      slots[side].classList.add("done");
      $(".r-skill", slots[side]).textContent = side === holder ? "選ぶ権利!" : "―";
    }
    choiceText.hidden = false;
    let firstSide;
    if (holder === "left") {
      choiceText.textContent = `${L.name}が選べます。先攻にしますか?後攻にしますか?`;
      choiceBox.hidden = false;
      firstSide = await new Promise((resolve) => {
        choiceBox.onclick = (e) => {
          e.stopPropagation();
          const b = e.target.closest("[data-first]");
          if (!b) return;
          choiceBox.onclick = null;
          resolve(b.dataset.first === "me" ? "left" : "right");
        };
      });
      choiceBox.hidden = true;
      rouletteSkip = false;
    } else {
      // 敵は、先攻・後攻のどちらが勝ちやすいかを試してから選ぶ
      const wantFirst = enemyWantsFirst(L, R);
      firstSide = wantFirst ? "right" : "left";
      choiceText.textContent = `${R.name}が選びます…`;
      await sleep(900);
    }
    const chooser = holder === "left" ? L : R;
    const pickedFirst = firstSide === holder;
    show(firstSide);
    choiceText.textContent = `${chooser.name}は${pickedFirst ? "先攻" : "後攻"}を選んだ`;
    await sleep(1100);
    choiceText.hidden = true;
    return { side: firstSide, reason: `(${chooser.name}が${pickedFirst ? "先攻" : "後攻"}を選んだ)` };
  }
  // 敵の選び方:先攻・後攻でそれぞれ何回か戦わせて、勝ちが多いほう(同じなら先攻)
  function enemyWantsFirst(L, R) {
    const extra = battleExtra();
    let first = 0, second = 0;
    // v1.6.2:ラウンドの制限(20体目の漆黒の騎士)は、引き分け = 敵の勝ち
    const enemyWins = (w) => w === "right" || (extra.timeLimit && w === "draw");
    for (let i = 0; i < 100; i++) {
      if (enemyWins(B.simulate(B.cloneUnit(L), B.cloneUnit(R), battleRng, { firstSide: "right", ...extra }).winner)) first++;
      if (enemyWins(B.simulate(B.cloneUnit(L), B.cloneUnit(R), battleRng, { firstSide: "left", ...extra }).winner)) second++;
    }
    return first >= second;
  }
  // v1.6.1:アイクモードの11体目(漆黒の騎士)はラウンド1だけ
  // v1.6.2:20体目の漆黒の騎士は10ラウンドまで(倒せなければ負け)
  function battleExtra(arc = arcMatch) {
    const en = arc && arcState ? arcState.enemies[arc.stage] : null;
    if (en && en.roundOne) return { maxRounds: 1, drawText: "ラウンド1が終わった", roundOne: true };
    if (en && en.roundLimit) return { maxRounds: en.roundLimit, drawText: `${en.roundLimit}ラウンドまでに${en.name}を倒せなかった…`, timeLimit: true };
    return {};
  }

  const isRare = (name) => { const s = UI.skillInfo(name); return !!(s && s.rare); };

  // ================= バトル =================
  const battle = { L: null, R: null, events: [], idx: 0, token: 0, speed: 1, skip: false, wake: null, lastSkills: null };

  function stopBattle() {
    battle.token++;
    battle.skip = false;
    animStop(); // v1.8.0:戦闘アニメの途中なら最後まで進めて止める
    if (battle.wake) battle.wake();
    $("#roulette").hidden = true;
    $("#tt-pick").hidden = true; // v1.7.0
    if (ttPickResolve) { const r = ttPickResolve; ttPickResolve = null; r(null); }
    if (ttCoverResolve) ttCoverResolve(false); // v1.7.3:2P対戦の交代の幕
    $("#arena").classList.remove("slowmo", "ko-dim");
    $$(".fighter").forEach((f) => f.classList.remove("attacking", "desc-open"));
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

  // ================= v1.8.0:戦闘アニメ =================
  // 設定で「戦闘アニメ」をONにすると、バトル画面のキャラ枠の上に、ドット絵の戦闘アニメ(js/battleanim.js)を重ねて見せる。
  // 攻撃(流星・天空などの連続攻撃、勇者の武器・ぶちかましの2回目も1回の動きにまとめる)・奥義・化身はアニメで見せ、
  // 命中・必殺・ダメージ・回復はゲームの計算のまま。ROUND・スキルの帯・K.O. などは今までどおりアニメの上に出る。OFFなら今までどおり
  const BA = global.BattleAnim || null;
  const ANIM_KEY = "arenaBattle.battleAnim";
  let animPref = false;
  try { animPref = global.localStorage.getItem(ANIM_KEY) === "1"; } catch (e) { /* 初期値のまま(OFF) */ }
  const anim = { pend: {}, quiet: new WeakSet(), shown: false, syncing: false };
  const animActive = () => !!BA && animPref && anim.shown;
  // ゲームの奥義 → アニメの奥義
  const ANIM_OUGI = { 流星: "meteor", 月光: "luna", 太陽: "sol", 天空: "aether", 瞬殺: "lethal", 陽光: "sunray", 鳴動: "quake", 衝撃: "impact", 狙撃: "snipe", 咆哮: "roar", 地の祝福: "earth", 空の祝福: "sky" };
  const ANIM_SELF = new Set(["roar", "earth", "sky"]);
  function animSaveRender() {
    try { global.localStorage.setItem(ANIM_KEY, animPref ? "1" : "0"); } catch (e) { /* 保存できなくても動く */ }
    const box = $("#opt-anim");
    if (box) box.checked = animPref;
    const btn = $("#btn-anim");
    if (btn) { btn.textContent = animPref ? "戦闘アニメ:ON" : "戦闘アニメ:OFF"; btn.classList.toggle("on", animPref); }
  }
  // 画面に出ているキャラ枠から、アニメの2人を作る(HP・威力・命中・必殺は画面の数字のまま)
  function animDesc(side) {
    const u = side === "left" ? battle.L : battle.R;
    const el = fighterEl(side);
    const c = u.char || {};
    const w = u.weapon || {};
    const num = (sel, d) => { const n = $(sel, el); const v = n ? Number(n.textContent) : NaN; return Number.isFinite(v) ? v : d; };
    const colorName = (c.inputs && c.inputs.color) || ((C.colors || []).find((x) => x.hex === c.colorHex) || {}).name || "";
    const className = (battle.cls && battle.cls[side]) || u.className || c.className || "";
    const moveType = u.moveType || c.moveType || (DB.classByName[className] || {}).moveType || "";
    return {
      id: BA.spriteFor({ className, gender: c.gender, race: c.race, category: w.category, moveType }),
      name: u.name, cls: className, wpn: w.name || "",
      hp: num(".hp-cur", u.hp), max: (battle.maxHp && battle.maxHp[side]) || u.maxHp,
      st: { dmg: num('[data-k="damage"] .n', 0), hit: num('[data-k="hit"] .n', 0), crt: num('[data-k="crit"] .n', 0), times: animTimes(el) },
      skills: animSkills(side),
      color: colorName, transformed: el.classList.contains("transformed"), move: { category: w.category },
    };
  }
  // v1.8.1:ATK の「×2」(追撃・勇者の武器で2回以上攻撃できるとき)。キャラ枠の威力の表示から読む
  function animTimes(el) {
    const x = $('[data-k="damage"] .x2 i', el);
    const n = x ? Number(String(x.textContent).replace(/[^0-9]/g, "")) : 1;
    return n > 1 ? n : 1;
  }
  // v1.8.1:パネルのクラス/武器の下に出すスキル。キャラ枠に見えているスキル(3on3の相手のまだ出ていないスキルは出さない)
  function animSkills(side) {
    return $$(".fighter-row .skills .skill-chip", fighterEl(side)).map((c) => c.textContent.trim()).filter(Boolean);
  }
  function animSetup() {
    const arena = $("#arena");
    if (!BA || !animPref || !battle.L || !battle.R) {
      if (anim.shown && BA) BA.unmount();
      anim.shown = false;
      arena.classList.remove("ba-on");
      return;
    }
    anim.pend = {};
    BA.setSpeed(battle.speed);
    BA.setup(animDesc("left"), animDesc("right"));
    BA.mount(arena);
    anim.shown = true;
    arena.classList.add("ba-on");
  }
  function animStop() { if (BA && anim.shown) BA.flush(); }
  // 化身などで威力・命中・必殺が変わったら、アニメの下の数字も合わせる
  function animStats(f) {
    if (!f) return;
    for (const side of ["left", "right"]) if (f[side]) BA.setStats(side, { dmg: f[side].damage, hit: f[side].hit, crt: f[side].crit, times: f[side].times || 1 });
  }
  function animSkillsSync() { for (const side of ["left", "right"]) BA.setSkills(side, animSkills(side)); }
  // 1つのイベントをアニメで見せる。true:見せ終わった(いつもの演出はしない)/ false:いつもの演出も続ける
  async function animEvent(e, token) {
    if (e.type === "round") { anim.pend = {}; animTurnTags(e.first); return false; }
    if (e.type === "hit" || e.type === "miss") return animStrike(e, token);
    if (e.type === "skill" && e.ougi && ANIM_OUGI[e.skill]) {
      const k = ANIM_OUGI[e.skill];
      // v1.8.1:回復する奥義(空の祝福)は、先に回復したHPをアニメに送ると、アニメの回復と2回分増えてから元に戻って見えた。
      //   キャラ枠だけ先に合わせ、アニメのHPはアニメの回復で増やす(最後にゲームのHPにそろえる)
      anim.syncing = true;
      try { applyState(e); } finally { anim.syncing = false; }
      animSkillsSync();
      if (anim.quiet.has(e)) return true; // 狙撃:攻撃といっしょに見せた
      if (ANIM_SELF.has(k)) {
        BA.setSpeed(battle.speed);
        await BA.ougiSelf(e.actor, k, { heal: e.heal != null ? e.heal : null, down: !!e.target });
        for (const side of ["left", "right"]) BA.setHp(side, e.hp[side]);
        animStats(e.forecast);
        return token === battle.token;
      }
      anim.pend[e.actor] = k; // 次の攻撃を奥義の演出で見せる
      return true;
    }
    if (e.type === "transform" || e.type === "revert") {
      applyState(e);
      BA.setSpeed(battle.speed);
      await BA.transform(e.actor, e.type === "transform", null);
      animStats(e.forecast);
      return true;
    }
    animNote(e);
    return false;
  }
  // v1.8.2:ラウンドの最初に、アニメの画面の左と右へ「先攻」「後攻」を数秒(2.6秒)出す
  //         (キャラ枠の上の札はアニメに隠れて見えないため。左右から入ってきて、少しして消える)
  function animTurnTags(firstSide) {
    if (!firstSide || battle.skip) return;
    const arena = $("#arena");
    $$(".ba-turn", arena).forEach((t) => t.remove());
    for (const side of ["left", "right"]) {
      const tag = document.createElement("div");
      const isFirst = side === firstSide;
      tag.className = `ba-turn ${side} ${isFirst ? "first" : "second"}`;
      tag.textContent = isFirst ? "先攻" : "後攻";
      arena.appendChild(tag);
      setTimeout(() => tag.remove(), 2700);
    }
  }
  // 攻撃以外のイベント:アニメの上にも数字・文字を出す
  function animNote(e) {
    animStats(e.forecast);
    if (e.type === "skill") animSkillsSync(); // v1.8.1:3on3で公開されたスキルなど
    switch (e.type) {
      case "status": BA.hurt(e.target, e.damage, e.hp[e.target], "#c890ff"); if (e.finishing) BA.ko(e.target); break;
      case "self": BA.hurt(e.target, e.damage, e.hp[e.target], "#ff9080"); if (e.finishing) BA.ko(e.target); break;
      case "heal": BA.heal(e.target, e.amount); break;
      case "skill":
        if (e.heal) BA.heal(e.actor, e.heal);
        if (e.buffText) BA.popAt(e.actor, e.buffText, "#ffe080", 8);
        if (e.elite) BA.popAt(e.actor, "クラスチェンジ", "#ffe080", 8);
        if (e.skill === "大器晩成") BA.popAt(e.actor, "能力アップ", "#ffe080", 8);
        if (e.target && e.skill === "咆哮") BA.popAt(e.target, "能力ダウン", "#ff9080", 8);
        break;
      case "sleep": BA.sleep(e.target, true); break;
      case "asleep": BA.popAt(e.actor, "Zzz…", "#c8d8ff", 8); break;
      case "wake": BA.sleep(e.actor, false); BA.popAt(e.actor, e.paralysis ? "麻痺が治った" : "目覚めた!", "#b0ffc0", 8); break;
      case "paralyze": BA.popAt(e.target, "麻痺", "#fff060", 10); break;
      case "break": BA.popAt(e.target, "武器破壊", "#ff9080", 8); break;
      case "spd-down": BA.popAt(e.target, e.label || `速さ-${e.amount}`, "#ff9080", 8); break;
      case "cancel": BA.popAt(e.actor, "無効", "#a8d8ff", 9); break;
      case "rage": if (e.on) BA.glow(e.actor, 60); break;
      default: break;
    }
  }
  // 攻撃をアニメで見せる。同じキャラの続けての攻撃(流星・天空・勇者の武器・ぶちかまし)は1回の動きにまとめる
  async function animStrike(e, token) {
    const evs = battle.events, start = battle.idx - 1;
    const A = e.actor, T = e.target;
    const att = A === "left" ? battle.L : battle.R;
    const fxGroup = e.fx === "meteor" || e.fx === "aether";
    const brave = !!(att && att.weapon && att.weapon.brave);
    // v1.8.1:『疾風の刃』の攻撃は、どの職業でもウインドの動き
    const isWind = (x) => typeof x.lead === "string" && x.lead.endsWith("の疾風の刃!");
    const wind = isWind(e);
    // v1.8.1:追撃(攻速の差)。勇者の武器以外で、同じキャラの攻撃が相手の攻撃をはさまずに続いたら(後攻の「攻撃+追撃」など)、
    //   1回の動きにまとめ、追撃はその場で続けて攻撃する(サンプル4の追撃の動き)
    let follows = 0;
    const between = (x) => ["heal", "spd-down", "status-add", "gauge"].includes(x.type) || (fxGroup && x.type === "skill" && !x.ougi);
    const strikes = [e];
    let last = start;
    for (let j = start + 1; j < evs.length; j++) {
      const x = evs[j], prev = strikes[strikes.length - 1];
      const isStrike = (x.type === "hit" || x.type === "miss") && x.actor === A && x.target === T && !prev.finishing;
      if (isStrike && ((fxGroup && x.fx === e.fx) || x.bodySlam || (brave && !x.fx && !e.fx && !x.instantKill && strikes.length < 2))) { strikes.push(x); last = j; continue; }
      if (isStrike && !brave && !fxGroup && !wind && !e.instantKill && !x.fx && !x.instantKill && !isWind(x) && !follows && !anim.pend[A]
        && evs.slice(start + 1, j).every((y) => y.type !== "skill")) { follows++; strikes.push(x); last = j; continue; }
      if (between(x)) continue;
      break;
    }
    // 攻撃のあとの回復(太陽・リザイア・ルーンソードなど)もまとめる
    for (let j = last + 1; j < evs.length && between(evs[j]); j++) if (evs[j].type === "heal" && evs[j].actor === A) last = j;
    // 狙撃:当たったあとに発動するので、先に見つけて攻撃といっしょに見せる
    let ougi = e.instantKill ? "lethal" : anim.pend[A] || null;
    for (let j = last + 1; j < evs.length && j <= last + 8; j++) {
      const x = evs[j];
      if (["hit", "miss", "round", "end", "swap", "phase2"].includes(x.type)) break;
      if (x.type === "skill" && x.skill === "狙撃" && x.actor === A && !ougi) { ougi = "snipe"; anim.quiet.add(x); }
    }
    delete anim.pend[A];
    const group = evs.slice(start, last + 1);
    const recs = strikes.map((x) => ({ hit: x.type === "hit", crit: !!x.crit, damage: x.damage || 0, hpAfter: x.hp[T], guarded: !!x.guarded }));
    const heals = group.filter((x) => x.type === "heal" && x.actor === A).map((x) => x.amount);
    const lastEv = group[group.length - 1];
    $$(".fighter").forEach((f) => f.classList.toggle("attacking", f === fighterEl(A)));
    BA.setSpeed(battle.speed);
    // v1.8.1:とどめは、HPが0になった瞬間に K.O. を出す(アニメはスローになって、そのまま倒れたキャラが消えるまで進む)
    let koAt = 0, koDiv = null;
    const finisher = group.find((x) => (x.type === "hit" || x.type === "miss") && x.finishing);
    BA.onKo((side) => {
      if (!finisher || side !== finisher.target || koAt || battle.skip || token !== battle.token) return;
      koAt = Date.now();
      koDiv = koLetters(finisher, 9000); // 倒れたキャラが消えるまで出しておく
    });
    try {
      await BA.attack(A, { recs, heals, ougi, wind, hpEnd: { left: lastEv.hp.left, right: lastEv.hp.right } });
    } finally { BA.onKo(null); }
    battle.idx = last + 1;
    if (token !== battle.token) { endKo(); return true; }
    // 記録(ログ・キャラ枠のHPなど)はアニメのあとにまとめて。とどめはいつもの K.O. の演出
    // (途中のHPをアニメに戻すと、HPが一度増えてからまた減って見え、倒れたキャラが出てきてしまうので、アニメのHPはそのまま)
    anim.syncing = true;
    try {
      for (const x of group) {
        if (battle.skip) { applyState(x); continue; }
        if ((x.type === "hit" || x.type === "miss") && x.finishing) {
          logLine(x);
          if (koAt) {
            // K.O. はもう出ている。文字が出終わるまで待つ
            for (const side of ["left", "right"]) { setHp(side, x.hp[side]); setStatus(side, x.status[side]); setGauge(side, x.laguz[side]); }
            // 倒れたキャラが消えたあと、少しだけ K.O. を残してから消す(最低でも文字が出そろう 1.6秒)
            const ok = await wait(Math.max(350, 1600 - (Date.now() - koAt)), token);
            if (koDiv) koDiv.remove();
            endKo();
            if (!ok && token !== battle.token) return true;
            continue;
          }
          if (!(await koSequence(x.target, token, x)) && token !== battle.token) return true;
          continue;
        }
        applyState(x);
        animStats(x.forecast);
      }
    } finally { anim.syncing = false; }
    if (!battle.skip && !lastEv.finishing) await wait(250, token);
    return true;
  }
  $("#opt-anim") && $("#opt-anim").addEventListener("change", (e) => { animPref = e.target.checked; animSaveRender(); });
  $("#btn-anim") && $("#btn-anim").addEventListener("click", () => {
    animPref = !animPref;
    animSaveRender();
    // 対戦の途中でも切りかえられる(次の攻撃から)
    if ($("#screen-battle").classList.contains("active") && battle.L && battle.R) animSetup();
  });
  animSaveRender();

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
    let first = B.decideFirst(L, R, battleRng);
    const arcNow = arc ? { ...arcMatch } : null;
    // v1.6.2:20体目の前のイベント(イナと漆黒の騎士・アイクと漆黒の騎士の会話)は削除。戦いの前の会話だけ残す(下の arcOpening)
    if (arc) {
      // v1.6.1:アーケードは、先攻・後攻を選ぶ権利を決める(演出OFFでも選ぶ画面は出す)
      const spinSides = arcState.skillMode === "carry" ? [] : ["left"];
      first = await roulette(L, R, first, false, !fx, fx ? spinSides : [], (slots, units) => arcChooseFirst(L, R, slots, units, fx));
    } else if (fx) await roulette(L, R, first, keepSkills || !!fixed, noSkills, null);
    goto("battle");
    if (arc) arcMatch = arcNow;
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
    $("#tt-result").hidden = true; // v1.7.0
    $("#tt-strip").hidden = true;
    battle.team = null;
    battle.tour = tourMatch ? { ...tourMatch } : null;
    battle.arc = arcMatch ? { ...arcMatch, roundOne: !!battleExtra().roundOne, timeLimit: !!battleExtra().timeLimit } : null;
    // v1.6.1:アイクモードの11体目(漆黒の騎士)は、戦いの前にセリフ
    // v1.6.2:20体目の漆黒の騎士・21体目のアシュナードも、戦いの前に会話(毎回。スキップできる)
    const opening = battle.arc ? arcOpening() : null;
    if (opening) {
      showBattleScreen(L, R);
      await runTalk(opening);
      if (token !== battle.token) return;
    }
    runSet(token, first, bestOf);
  }
  // バトル画面に2人を出す(試合の前の会話・イベントのため)
  function showBattleScreen(L, R) {
    battle.L = L;
    battle.R = R;
    $("#battle-log").innerHTML = "";
    $("#battle-result").hidden = true;
    $("#round-label").textContent = "";
    setScore(1, { left: 0, right: 0 }, 1);
    renderFighters(B.forecast(L, R));
    setHp("left", L.hp);
    setHp("right", R.hp);
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
      battle.L = L; battle.R = R; battle.owner = {}; // v1.6.3:援軍・変身で入れ替わった枠を元に戻す
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
      const sim = B.simulate(B.cloneUnit(L), B.cloneUnit(R), battleRng, { firstSide, firstReason: reason, ...(battle.arc ? battleExtra(battle.arc) : {}) });
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
      if (battle.arc && battle.arc.roundOne) break; // v1.6.1:漆黒の騎士(ラウンド1だけ)は1試合で終わり
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
    // v1.6.1:漆黒の騎士(ラウンド1だけ)は、アイクが倒れていなければクリア
    if (battle.arc && battle.arc.roundOne) winner = last.hp.left > 0 ? "left" : "right";
    // v1.6.2:20体目の漆黒の騎士は、10ラウンドまでに倒せなければ負け(判定勝ちはなし)
    let timeOut = false;
    if (battle.arc && battle.arc.timeLimit && winner === "draw") { winner = "right"; timeOut = true; }
    if ((battle.tour || battle.arc) && winner === "draw") { winner = judgeWinner(last, battleRng); judge = true; }
    finish({ winner, judge, timeOut }, need > 1 ? wins : null);
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
      ${UI.fighterHeader(u.char, { big: true, bio: u.bio, element: true, foeElement: B.elementsOf(foe.char), nameExtra: danger, hideWeak: true })}
      <div class="hp"><span class="hp-num"><b class="hp-cur">${u.hp}</b> / <span class="hp-max">${u.maxHp}</span><span class="status-chip" hidden></span></span><span class="hp-bar"><i class="hp-fill" style="width:100%"></i></span></div>
      ${gauge}
      <div class="fighter-weapon weapon">${UI.weaponLine(u.weapon, { tri: calc.tri, effective: calc.effective })}</div>
      <div class="fighter-row"><div class="skills">${skillCells(u)}</div></div>
      <p class="skill-desc">${skillDescHtml(u)}</p>
      <div class="mini-fc">${miniFcHtml(calc)}</div>
      ${UI.bonusRow(B.bonusSummary(u, foe))}
      <span class="atk-tag" aria-hidden="true">攻撃</span>
      <div class="float-layer"></div>`;
  }

  // now:戦いの途中で描き直すとき(変身・援軍)の、そのときのHP・最大HP(イベント)。
  // v1.6.4:前は一度HPが満タンで描かれてから元に戻っていた(アシュナードの変身でアイクのHPが満タンに見えた)
  function renderFighters(f, now) {
    battle.maxHp = { left: battle.L.maxHp, right: battle.R.maxHp }; // v1.4.5:エリート・大器晩成で変わる
    if (now && now.maxHp) battle.maxHp = { ...now.maxHp };
    battle.cls = { left: battle.L.className, right: battle.R.className };
    const fl = fighterEl("left"), fr = fighterEl("right");
    fl.className = "fighter";
    fr.className = "fighter";
    fl.innerHTML = fighterHtml(battle.L, battle.R, f.left, f.right);
    fr.innerHTML = fighterHtml(battle.R, battle.L, f.right, f.left);
    if (now && now.hp) for (const side of ["left", "right"]) { $(".hp-max", fighterEl(side)).textContent = battle.maxHp[side]; setHp(side, now.hp[side]); }
    for (const side of ["left", "right"]) {
      const u = side === "left" ? battle.L : battle.R;
      if (u.laguz) setGauge(side, { gauge: u.laguz.gauge, transformed: u.laguz.transformed });
    }
    $("#arena-fx").innerHTML = "";
    endKo();
    animSetup(); // v1.8.0:戦闘アニメ
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
    if (animActive() && !anim.syncing) BA.setHp(side, hp, maxHp); // v1.8.0(攻撃のあとにまとめて記録するときは、アニメのHPはもう合っている)
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

  // v1.6.4:太陽・天空の回復。黄色い閃光が自分を包んで、HPが回復する
  function sunHeal(side, amount, keepPose) {
    const el = fighterEl(side);
    if (keepPose) { el.classList.remove("sol-glow"); void el.offsetWidth; el.classList.add("sol-glow"); setTimeout(() => el.classList.remove("sol-glow"), 900); }
    else flash(el, "sol-glow");
    const fill = $(".hp-fill", el);
    if (fill) flash(fill, "hp-heal");
    const layer = $(".float-layer", el);
    const box = document.createElement("span");
    box.className = "sun-burst";
    box.innerHTML = `<i class="sb-ring"></i><i class="sb-ring r2"></i>${Array.from({ length: 10 }, (_, i) => `<i class="sb-p" style="left:${8 + i * 9}%;animation-delay:${(i % 4) * 0.08}s"></i>`).join("")}`;
    layer.appendChild(box);
    setTimeout(() => box.remove(), 1300);
    if (amount) floatText(side, `+${amount}`, "heal big-heal sun");
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
  // v1.6.4:奥義の動き(rise-up・dive-down・charge・charge-luna・leap・hover・sol-glow)を追加
  const FIGHTER_FX = ["lunge", "hit", "crit-hit", "heal-fx", "skill", "transform-fx", "revert-fx", "rage-fx", "sleep-fx", "poison", "ko",
    "rise-up", "dive-down", "charge", "charge-luna", "leap", "hover", "sol-glow", "vanish-fx"];
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
    return div;
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
    const changed = ["transform", "revert", "rage", "sleep", "wake", "break", "skill", "spd-down", "heal", "paralyze"].includes(e.type);
    if (e.forecast) setMiniFc(e.forecast, changed);
    if (e.bonus) setBonus(e.bonus, changed);
    if (battle.team && e.type === "skill") ttRevealSkill(e); // v1.7.0
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
    koLetters(e);
    const ok = await wait(KO_TEXT_MS, token);
    endKo();
    return ok;
  }
  // 「K」「.」「O」「.」の文字(v1.3.4:瞬殺のときは「瞬・殺。」)。v1.8.1:戦闘アニメでも使うので関数に
  const KO_TEXT_MS = 2200;
  function koLetters(e, ms = 2400) {
    const ss = !!(e && e.instantKill);
    const letters = (ss ? ["瞬", "・", "殺", "。"] : ["K", ".", "O", "."]).map((ch, i) => `<span class="ko-l" style="animation-delay:${0.1 + i * 0.35}s">${ch}</span>`).join("");
    return arenaFx(letters, ss ? "fx-ko ss" : "fx-ko", ms);
  }
  function endKo() {
    $("#arena").classList.remove("slowmo", "ko-dim", "ss-dim");
    $$(".fighter").forEach((f) => f.classList.remove("hp-slow", "ko-target"));
  }

  // ================= v1.6.4:奥義(流星・月光・太陽・天空)の演出 =================
  // 背景:アリーナ全体に、奥義ごとの背景(流星=緑の星、月光=青い月の光、太陽=黄色い太陽、天空=空と光の柱)を重ねる。
  // 攻撃の1撃ごとに背景の時間を延ばし、最後の1撃のあとに消える
  const OUGI_BG = {
    meteor: () => `<i class="ob-glow"></i>${Array.from({ length: 14 }, (_, i) => `<i class="ob-star" style="left:${(i * 37) % 100}%;top:${-20 + ((i * 23) % 50)}%;animation-delay:${(i % 7) * 0.13}s;--s:${0.6 + (i % 4) * 0.25}"></i>`).join("")}`,
    luna: () => `<i class="ob-glow"></i><i class="ob-moon"></i><i class="ob-ray"></i><i class="ob-ray r2"></i><i class="ob-ray r3"></i>`,
    sol: () => `<i class="ob-glow"></i><i class="ob-sun"></i><i class="ob-sunrays"></i>`,
    aether: () => `<i class="ob-glow"></i><i class="ob-emblem"><b class="sun"></b><b class="moon"></b></i><i class="ob-pillar"></i>${Array.from({ length: 12 }, (_, i) => `<i class="ob-spark" style="left:${8 + ((i * 41) % 84)}%;animation-delay:${(i % 6) * 0.15}s"></i>`).join("")}`,
  };
  function ougiBg(kind, side) {
    if (battle.skip || !OUGI_BG[kind]) return;
    const arena = $("#arena");
    // v1.7.5:2回続けて発動したとき、消えかけの背景(.out。0.5秒後に消す予約あり)を使い回していたので、
    //   2回目の背景がすぐ消えて演出が出なかった。消えかけの背景は使わず、新しく作る
    let bg = $(".ougi-bg:not(.out)", arena);
    if (!bg) { bg = document.createElement("div"); arena.appendChild(bg); }
    bg.className = `ougi-bg ${kind} ${side}`;
    bg.innerHTML = OUGI_BG[kind]();
    ougiKeep(3200);
  }
  function ougiKeep(ms) {
    clearTimeout(battle.ougiTimer);
    battle.ougiTimer = setTimeout(ougiEnd, ms * (battle.speed || 1));
  }
  function ougiEnd() {
    clearTimeout(battle.ougiTimer);
    $$(".ougi-bg").forEach((bg) => { bg.classList.add("out"); setTimeout(() => bg.remove(), 500); });
  }
  // 攻撃の前の動き(踏み込み・タメ・上昇)。戻り値:待ち時間(ms)。null なら中断
  async function strikeLead(e, token) {
    const el = fighterEl(e.actor), n = e.n || 0;
    $$(".fighter").forEach((f) => f.classList.toggle("attacking", f === el)); // v1.6.6:攻撃している側(縦向きで枠が光る)
    switch (e.fx) {
      case "meteor":
        // 流星:1〜3撃目は3連符(たたたん)、4撃目は上昇斬り、5撃目は少しタメてから振り下ろし
        if (n <= 3) { flash(el, "lunge"); return 170; }
        if (n === 4) { flash(el, "rise-up"); return 260; }
        flash(el, "charge");
        if (!(await wait(700, token))) return null;
        flash(el, "dive-down");
        return 200;
      case "luna":
        // 月光:青い光をためてから、一撃
        flash(el, "charge-luna");
        if (!(await wait(900, token))) return null;
        flash(el, "lunge");
        return 260;
      case "sol":
        flash(el, "lunge");
        return 420;
      case "aether":
        // 天空:1撃目(太陽)は高く跳び上がりながら斬り上げる → 2撃目(月光)は空中でためてから、まっすぐ落ちて斬り下ろす
        if (n <= 1) { flash(el, "leap"); return 560; }
        el.classList.add("hover");
        if (!(await wait(650, token))) return null;
        el.classList.remove("hover", "leap");
        flash(el, "dive-down");
        return 180;
      default:
        flash(el, "lunge");
        return 500;
    }
  }
  // 攻撃の演出の種類(斬撃の色・向き)
  function strikeImpact(e) {
    const n = e.n || 0;
    const kind = e.fx === "meteor" ? (n === 4 ? "meteor rise" : n === 5 ? "meteor down" : "meteor")
      : e.fx === "aether" ? (n <= 1 ? "aether rise" : "aether down") : e.fx || "";
    return (kind + (e.crit ? " crit" : "")).trim() || e.crit;
  }
  // 当たったあとの待ち時間
  function strikeAfter(e) {
    const n = e.n || 0;
    if (e.fx === "meteor") return n <= 2 ? 240 : n === 3 ? 520 : n === 4 ? 420 : 1100;
    if (e.fx === "luna") return 1050;
    if (e.fx === "aether") return n <= 1 ? 700 : 1150;
    return e.crit ? 1100 : 900;
  }

  // 攻撃:「○○の攻撃!」→ 一拍 →(必殺なら画面が揺れる)→「○○にダメージ!」→ 演出 → HPバーが減る
  // v1.6.4:奥義(e.fx)のときは、奥義ごとのテンポと斬撃
  async function playStrike(e, token) {
    if (e.fx) ougiKeep(3200);
    const li = logLine(e, e.lead);
    const lead = await strikeLead(e, token);
    if (lead == null || !(await wait(lead, token))) return false;
    if (e.type === "miss") {
      li.textContent = `${e.lead}……${e.result}`;
      floatText(e.target, e.result === "見失った!" ? "見失った" : "MISS", "miss");
      applyState(e, false);
      if (e.fx && (e.fx !== "meteor" || e.n === 5) && (e.fx !== "aether" || e.n === 2)) ougiKeep(700);
      return wait(e.fx === "meteor" && e.n < 5 ? 260 : 600, token);
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
    // v1.6.4:流星の1〜4撃目はテンポを崩さないように、必殺の大きな文字を出さない(斬撃と数字は必殺のまま)
    const quickCrit = e.fx === "meteor" && (e.n || 0) <= 4;
    if (e.crit) {
      li.textContent = `${e.lead}必殺の一撃!`;
      li.classList.add("log-crit");
      if (!quickCrit) {
        arenaFx("必殺の一撃!!", "fx-crit", C.bigEffectMs);
        flash($("#arena"), "rattle");
        if (!(await wait(C.bigEffectMs, token))) return false;
      }
    }
    // 命中:斬撃の演出 → ダメージの数字 → HPバーが減る
    // v1.4.3:斬撃からHPが減るまでを早くした(前は 0.16秒後に数字 → さらに0.3秒後にHP)
    impact(e.target, strikeImpact(e));
    flash(fighterEl(e.target), e.crit ? "crit-hit" : "hit");
    if (e.fx === "luna" || (e.fx === "meteor" && e.n === 5) || (e.fx === "aether" && e.n === 2)) flash($("#arena"), "hard-hit");
    if (!(await wait(120, token))) return false;
    li.textContent = `${li.textContent}${e.result}`;
    floatText(e.target, `-${e.damage}`, e.crit ? "crit" : "dmg");
    // 最後の1撃のあと、背景は少しして消える(太陽・天空の1撃目は、このあと回復があるので長め)
    if (e.fx) ougiKeep((e.fx === "aether" && (e.n || 0) <= 1) || (e.fx === "meteor" && e.n < 5) ? 2400 : e.fx === "sol" ? 1800 : 1000);
    if (e.finishing) { ougiEnd(); return koSequence(e.target, token, e); } // とどめ:HPを減らしてからK.O.の演出
    applyState(e, false); // ここでHPバーが減る
    return wait(strikeAfter(e), token);
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
      case "heal":
        // v1.6.4:太陽・天空の回復は、黄色い閃光が自分を包む(天空は空中のまま)
        if (e.fx) { sunHeal(e.target, e.amount, e.fx === "aether"); return e.fx === "aether" ? 800 : 1200; }
        healFx(e.target, e.amount); return 900; // v1.4.5:太陽・天空・リザイアなどの吸収も回復の演出
      case "paralyze": // v1.6.4:衝撃の麻痺
        flash(fighterEl(e.target), "hit");
        floatText(e.target, "麻痺", "debuff");
        return 900;
      case "skill": {
        // v1.4.5:回復するスキル(回復・空の祝福)は回復の演出。前はスキルの光と同時に数字だけ出ていた
        if (e.heal) healFx(e.actor, e.heal);
        else flash(fighterEl(e.actor), "skill");
        if (e.elite) floatText(e.actor, "クラスチェンジ", "elite");
        if (e.skill === "大器晩成") floatText(e.actor, "能力アップ", "elite");
        if (e.buffText) floatText(e.actor, e.buffText, "elite"); // v1.6.5:『盗む』のドーピング
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
          // v1.6.4:流星・月光・太陽・天空は、奥義ごとの背景と色の帯
          if (e.fx) ougiBg(e.fx, e.actor);
          $$(".fighter").forEach((f) => f.classList.toggle("attacking", f === fighterEl(e.actor))); // v1.6.6:奥義を出す側を光らせる
          arenaFx(`<small>奥義</small>${UI.esc(e.skill)}`, `fx-ougi ${e.actor}${e.healFx ? " heal" : ""}${e.fx ? " ob-" + e.fx : ""}`, C.bigEffectMs + (e.fx ? 200 : 0));
          return C.bigEffectMs + (e.healFx ? 400 : 100) + (e.fx ? 200 : 0);
        }
        // v1.3.3:通常スキルもカットイン。防御は青、回復・祈りは淡い緑、それ以外(バフ系)は橙
        const kind = C.skillKinds.guard.includes(e.skill) ? "guard" : C.skillKinds.heal.includes(e.skill) || (e.steal && e.heal != null) ? "heal" : "buff";
        // v1.6.5:兵種スキル(盗む)は「兵種スキル」と、盗んだ物の名前を出す
        arenaFx(`<small>${e.fromWeapon ? "武器スキル" : e.classSkill ? "兵種スキル" : "通常スキル"}</small>${UI.esc(e.skill)}${e.steal ? `<em>${UI.esc(e.steal)}を盗んだ!</em>` : ""}`, `fx-skill ${kind} ${e.actor}`, C.skillEffectMs + (e.steal ? 300 : 0));
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
        floatText(e.actor, e.paralysis ? "麻痺が治った" : "目覚めた!", "revert");
        return 800;
      case "break":
        flash(fighterEl(e.target), "hit");
        floatText(e.target, "武器破壊", "debuff");
        return 1000;
      case "spd-down": // v1.4.4:手斧・手槍系で相手の速さ-1
        floatText(e.target, e.label || `速さ-${e.amount}`, "debuff"); // v1.6.5:長弓などは下がった能力の名前
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
  async function play(token, match = 0, final = false, noCount = false) {
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
    // 3, 2, 1, BATTLE!!(v1.6.1:イベントの戦いは出さない)
    for (const n of noCount ? [] : ["3", "2", "1"]) {
      arenaFx(n, "fx-count", 700);
      if (!(await wait(700, token))) return;
    }
    if (!noCount) {
      arenaFx(match ? `<small>第${match}試合</small>BATTLE!!` : "BATTLE!!", "fx-count battle", 900);
      if (!(await wait(900, token))) return;
    }

    while (battle.idx < battle.events.length) {
      if (token !== battle.token) return;
      const e = battle.events[battle.idx++];
      if (e.type === "end") { ougiEnd(); applyState(e); return e; }
      // v1.6.2:変身(アシュナード)。スキップ中は会話も飛ばして、変身後の姿にするだけ
      if (e.type === "phase2") { if (!(await playPhase2(e, token)) && token !== battle.token) return; continue; }
      // v1.6.3:『援軍』が参戦する/倒れて元のキャラに戻る
      if (e.type === "swap") { if (!(await playSwap(e, token)) && token !== battle.token) return; continue; }
      if (battle.skip) { applyState(e); continue; }
      // v1.8.0:戦闘アニメ(ONのとき)。攻撃・奥義・化身はアニメで見せる。それ以外はいつもどおり(アニメにも数字などを出す)
      if (animActive()) {
        const r = await animEvent(e, token);
        if (token !== battle.token) return;
        if (r) continue;
        if (battle.skip) { applyState(e); continue; }
      }
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

  // v1.6.2:変身前のアシュナードを倒した → 戦闘画面のまま会話 → 変身の演出 → 変身後の会話 → 次のラウンドへ
  async function playPhase2(e, token) {
    const side = e.actor;
    const old = side === "left" ? battle.L : battle.R;
    const p = old.char.phase2;
    const talk = !battle.skip;
    endKo();
    if (talk) { await runTalk(ashnardDownScript()); if (token !== battle.token) return false; }
    if (p) {
      const nu = B.makeUnit(p, DB.weapons[p.weapon] ? p.weapon : old.weapon.id, side);
      nu.bio = old.bio;
      nu.skill = p.skill !== undefined ? p.skill : old.skill;
      nu.extraSkills = (p.extraSkills || old.extraSkills || []).slice();
      if (side === "left") battle.L = nu; else battle.R = nu;
    }
    const arena = $("#arena");
    if (talk) {
      // 変身の演出:画面が赤黒く暗転 → 大きく揺れて、化身と同じ光 → HPが満タンになる
      arena.classList.add("ko-dim", "ss-dim");
      if (!(await wait(900, token))) { arena.classList.remove("ko-dim", "ss-dim"); return false; }
      flash(arena, "hard-hit");
    }
    renderFighters(e.forecast || B.forecast(battle.L, battle.R), e);
    applyState(e);
    if (talk) {
      arena.classList.add("ko-dim", "ss-dim");
      flash(fighterEl(side), "transform-fx");
      arenaFx(`<small>メダリオンの力</small>${UI.esc((side === "left" ? battle.L : battle.R).name)}`, `fx-transform ${side}`, 1600);
      const ok = await wait(1800, token);
      arena.classList.remove("ko-dim", "ss-dim");
      if (!ok) return false;
      await runTalk(ashnardRiseScript());
      if (token !== battle.token) return false;
    }
    return true;
  }

  // v1.6.3:『援軍』。参戦したら、その側のキャラ枠を援軍に入れ替える(倒れたら元のキャラに戻す)
  async function playSwap(e, token) {
    const side = e.actor, key = side === "left" ? "L" : "R";
    battle.owner = battle.owner || {};
    if (e.back) {
      if (battle.owner[side]) battle[key] = battle.owner[side];
      delete battle.owner[side];
    } else {
      battle.owner[side] = battle[key];
      const nu = B.makeUnit(e.char, e.weaponId, side);
      nu.bio = C.biorhythm[1];
      battle[key] = nu;
    }
    renderFighters(e.forecast || B.forecast(battle.L, battle.R), e);
    applyState(e);
    if (battle.skip) return true;
    const u = battle[key];
    flash(fighterEl(side), "transform-fx");
    arenaFx(`<small>${e.back ? "交代" : "援軍"}</small>${UI.esc(u.name)}`, `fx-transform ${side}`, 1300);
    return wait(1500, token);
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
      // v1.6.3:援軍が戦っていても、勝ったのは援軍を呼んだキャラ
      const winner = (battle.owner && battle.owner[e.winner]) || (e.winner === "left" ? battle.L : battle.R);
      text.textContent = `${winner.name} の${e.judge ? "判定勝ち(残りHPの割合)" : "勝利"}!${score}`;
      if (battle.arc && battle.arc.roundOne && e.winner === "left") text.textContent = `${winner.name}は${battle.R.name}の攻撃に耐えた!`;
      if (e.timeOut) text.textContent = `${battleExtra(battle.arc).maxRounds}ラウンドまでに${battle.R.name}を倒せなかった…`;
      fighterEl(e.winner).classList.add("winner");
      fighterEl(e.winner === "left" ? "right" : "left").classList.add("loser");
    }
    // v1.5.0:トーナメントの試合なら、結果を記録してトーナメント表へ(もう一度は出さない)
    $$(".fighter").forEach((f) => f.classList.remove("attacking"));
    const inTour = !!battle.tour;
    const inArc = !!battle.arc; // v1.6.0:アーケードの試合(コンティニュー・次へ)
    $$(".btn-rematch").forEach((b) => (b.hidden = inTour || inArc));
    $("#btn-back-prep").hidden = inTour || inArc;
    $("#tour-result").hidden = !inTour;
    $("#arc-result").hidden = !inArc;
    $("#tt-result").hidden = true; // v1.7.0
    if (inTour) tourFinished(e, wins);
    const seq = inArc ? arcFinished(e) : null;
    // v1.6.1:アーケードのクリア・ゲームオーバーなどの演出のあとで、結果のボタンを出す
    if (seq) {
      $("#battle-result").hidden = true;
      const token = battle.token;
      seq().then(() => { if (token === battle.token) $("#battle-result").hidden = false; });
      return;
    }
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
        return `<tr class="${medal}">${rankOf ? `<td class="rk">${rk === st.ids.length ? `${rk}位<small>最下位</small>` : `${rk}位`}</td>` : ""}<td class="nm">${UI.esc(c.name)}${UI.genderMark(c)}</td><td class="cl">${UI.esc(c.className)}</td><td class="rec">${rec.w}勝${rec.l}敗</td>${carry ? `<td class="sk">${UI.skillChip(st.skills[id], false)}</td>` : ""}</tr>`;
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
    if (arcMatch) { arcPrepInfo(); return; }
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
  // v1.6.1:スキルは持ち越しだけ・選んだキャラの能力値と武器・先攻後攻を選ぶ権利・クリア/ゲームオーバーの演出・アイクモード(会話とイベント)
  const ARC_KEY = "arenaBattle.arcade";
  function loadArc() {
    if (arcState && !A_.valid(arcState, (id) => !!S.find(id))) clearArc(); // キャラが削除された(v1.7.1:3on3は3人とも見る)
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
  // 自分のキャラ(保存されたもの。アイクモードならアイク)
  const arcSaved = (st = arcState) => A_.savedChar(st, (id) => S.find(id));
  const arcPlayer = () => A_.playerChar(arcState, arcSaved());
  const arcEnemy = () => A_.ensureEnemy(arcState);
  const arcSkillModeText = (m) => (m === "carry" ? "最初に選んで持ち越し" : "毎回ルーレット");
  const chips = (list) => list.filter(Boolean).map((n) => UI.skillChip(n, false)).join("");
  // 敵の呼び名(勝ち抜きの表・次の敵)
  function arcStageLabel(st, stage) {
    if (A_.isIke(st)) {
      const I = A_.IKE;
      // v1.6.3:18体目はイナではなく、ふつうの敵
      return { [I.KNIGHT1]: "漆黒の騎士", [I.FERAL]: "赤竜", [I.BOSS]: "漆黒の騎士", [I.ASHNARD]: "アシュナード" }[stage] || (stage >= A_.PROMOTED_FROM ? "上級職" : "");
    }
    return stage === A_.EXTRA ? "イナ" : stage >= A_.PROMOTED_FROM ? "上級職" : "";
  }
  function arcNextTitle(st, en) {
    const stage = st.stage;
    if (A_.isIke(st)) {
      const I = A_.IKE;
      const extra = { [I.KNIGHT1]: " ― 漆黒の騎士(ラウンド1だけ)", [I.FERAL]: " ― なりそこない", [I.BOSS]: " ― 漆黒の騎士との決戦", [I.ASHNARD]: " ― 狂王アシュナード" }[stage] || "";
      return `${A_.stageName(stage, st)}${extra} ・ Lv${en.arcadeLv}${!extra && stage >= A_.PROMOTED_FROM ? " ・ 上級職" : ""}`;
    }
    const ex = stage === A_.EXTRA;
    return `${A_.stageName(stage, st)}${ex ? " ― 赤竜イナ" : ""} ・ Lv${en.arcadeLv}${!ex && stage >= A_.PROMOTED_FROM ? " ・ 上級職" : ""}`;
  }
  const inaLimited = (st) => !A_.isIke(st) && st.stage === A_.EXTRA;
  // v1.6.3:アシュナード戦はコンティニュー5回まで
  const ashLimited = (st) => A_.isIke(st) && st.stage === A_.IKE.ASHNARD;

  // スキルを決める。敵は決まっている。自分は持ち越しなら決まっている、毎回ルーレット(v1.6.0 の保存データだけ)なら draw のときに抽選
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

  // ---- 準備:モード・キャラ(v1.6.1:スキルは持ち越しだけ。選んだキャラの能力値と武器を出す) ----
  const asetup = { pick: null, mode: "normal", view: "human", picks: [] }; // v1.7.1:picks は3on3の3人
  const AS_RULES = {
    normal: [
      "11連戦を勝ち抜く。敵はランダムに生まれたキャラ",
      "自分はLv1から。1勝でLv+2、Lv21でクラスチェンジ(ラグズはLv1のまま進み、6勝目から+2)",
      "敵はLv2から2つずつ上がる。5体目からスキル、8体目から上級職",
      "スキルは最初に2つから1つ。勝つと交換できる。9体目を倒すと2つ目を追加",
      "先攻・後攻は、選ぶ権利をルーレットで決める",
      "11体目(EXTRA)は赤竜のイナ。10体目を倒すと★、イナを倒すと★★",
      "負けてもコンティニューできる(イナ戦は3回まで)",
    ],
    ike: [
      "アイク(レンジャー Lv1・てつの剣)で全20面",
      "10体目まではふつうと同じ。ただしLv20まで(クラスチェンジなし)",
      "倒した敵の剣などを手に入れる。剣はラグネルのほかに4つまで(5つ目は1つ手放す)",
      "11体目は漆黒の騎士。ラウンド1を耐えればクリア → ロードにクラスチェンジ",
      "12〜19体目はLv+3ずつ。18体目の敵はスキル2つ",
      "19体目はなりそこない、20体目は漆黒の騎士(10ラウンドまでに倒せないとゲームオーバー)",
      "スキル・先攻後攻はふつうと同じ。負けてもコンティニューできる(回数の制限なし)",
    ],
    // v1.7.1:アーケードの3on3
    team: [
      "キャラを3人選んで11連戦。敵も毎回3人(ランダムに生まれたキャラ)",
      "3人ともLv1から。1勝でLv+2、Lv21でクラスチェンジ(ふつうと同じ)",
      "バトルは3on3と同じ(王・フェイズ・継承・神官など)。相手の王を倒せば勝ち",
      "スキルは最初に1人ずつ2つから選ぶ。勝つと、3人のうち1人だけ交換・追加できる(9体目を倒すと2つ目を追加)",
      "11体目(EXTRA)は、敵の3人の中に必ず赤竜のイナがいる。10体目を倒すと★、EXTRAに勝つと★★(3人とも)",
      "負けてもコンティニューできる(EXTRAは3回まで)",
    ],
  };
  function renderArcSetup() {
    if (asetup.mode === "team") { renderArcTeamSetup(); return; } // v1.7.1
    $("#asetup").classList.remove("team");
    const ike = asetup.mode === "ike";
    const chars = eligibleChars();
    if (!chars.some((c) => c.id === asetup.pick)) asetup.pick = null;
    $$("#as-mode .bo-btn").forEach((b) => b.classList.toggle("on", b.dataset.v === asetup.mode));
    $("#asetup").classList.toggle("ike", ike);
    $("#as-pick").hidden = ike;
    $("#as-mode-note").textContent = ike ? "アイクで全20面を勝ち抜く、物語つきのモードです。" : "自分のキャラを1人選んで、11連戦を勝ち抜きます。";
    $("#as-rules").innerHTML = AS_RULES[asetup.mode].map((t) => `<li>${UI.esc(t)}</li>`).join("");
    $("#as-chars").innerHTML = chars.length ? chars.map((c) => `<li data-id="${UI.esc(c.id)}" class="${c.id === asetup.pick ? "picked" : ""}" tabindex="0" role="radio" aria-checked="${c.id === asetup.pick}">
        ${UI.charIcon(c, "small")}<div class="li-text"><div class="li-name">${UI.esc(c.name)}${UI.genderMark(c)}</div><div class="li-sub">${UI.esc(c.className)}</div></div></li>`).join("")
      : `<li class="empty">バトルに出せるキャラがいません。<button type="button" class="link-btn" data-goto="create">キャラ作成</button>から作ってください。</li>`;
    const c = ike ? A_.ikeChar(null) : asetup.pick ? S.find(asetup.pick) : null;
    $("#as-picked").innerHTML = c && !ike ? `選んだキャラ <b>${UI.esc(c.name)}</b>(${UI.esc(c.className)})` : "キャラを1人選んでください";
    renderArcDetail(c, ike);
    $("#as-start").disabled = !c;
    $("#as-start-note").textContent = !c ? "" : "Lv1から始まります。最初に、ランダムの2つのスキルから1つを選びます。" + (ike ? "" : "(キャラ一覧の能力値は変わりません)");
  }
  // 選んだキャラの能力値(アーケードの始まりの Lv1)と武器。ラグズは化身前/化身後の切り替えつき
  function renderArcDetail(c, ike) {
    const box = $("#as-detail");
    if (!c) { box.innerHTML = `<p class="muted as-detail-empty">キャラを選ぶと、ここに能力値と武器が出ます</p>`; return; }
    const st = A_.create(c, { mode: ike ? "ike" : "normal", rng: global.Rng.createSeededRng("asetup") });
    const me = { ...A_.playerChar(st, ike ? A_.ikeChar(st) : c), arcadeLv: 1 };
    const laguz = me.race === "ラグズ" && me.statsHuman;
    const view = laguz ? asetup.view : "transformed";
    const toggle = laguz ? `<label class="form-switch" data-view="${view}" title="能力値の表示(化身前/化身後)">
      <span class="fs-l">化身前</span><input type="checkbox" class="form-check as-form" ${view === "transformed" ? "checked" : ""} aria-label="化身後の能力値を表示">
      <span class="fx-switch" aria-hidden="true"></span><span class="fs-r">化身後</span></label>` : "";
    box.innerHTML = `<div class="side-top"><p class="side-label">${ike ? "アイクモードのキャラ" : "選んだキャラ"}<small>アーケードの始まり(Lv1)</small></p>${toggle}</div>
      ${UI.fighterHeader(me, { element: true })}
      ${UI.statGrid(me, { element: true, form: view })}
      <h4 class="sub weapon-head">武器</h4>
      ${UI.weaponCards(me)}`;
  }
  // v1.7.1:アーケードの3on3の準備(3人を選ぶ。選んだ順に 1・2・3)
  function renderArcTeamSetup() {
    const chars = eligibleChars();
    asetup.picks = asetup.picks.filter((id) => chars.some((c) => c.id === id));
    $$("#as-mode .bo-btn").forEach((b) => b.classList.toggle("on", b.dataset.v === asetup.mode));
    $("#asetup").classList.remove("ike");
    $("#asetup").classList.add("team");
    $("#as-pick").hidden = false;
    $("#as-mode-note").textContent = "自分のキャラを3人選んで、3on3で11連戦を勝ち抜きます(アイクモードは1人だけ)。";
    $("#as-rules").innerHTML = AS_RULES.team.map((t) => `<li>${UI.esc(t)}</li>`).join("");
    $("#as-chars").innerHTML = chars.length ? chars.map((c) => {
      const n = asetup.picks.indexOf(c.id);
      return `<li data-id="${UI.esc(c.id)}" class="${n >= 0 ? "picked" : ""}" tabindex="0" role="checkbox" aria-checked="${n >= 0}">
        ${UI.charIcon(c, "small")}<div class="li-text"><div class="li-name">${UI.esc(c.name)}${UI.genderMark(c)}</div><div class="li-sub">${UI.esc(c.className)}</div></div>${n >= 0 ? `<b class="ts-no">${n + 1}</b>` : ""}</li>`;
    }).join("") : `<li class="empty">バトルに出せるキャラがいません。<button type="button" class="link-btn" data-goto="create">キャラ作成</button>から作ってください。</li>`;
    $("#as-picked").innerHTML = `選んだキャラ <b>${asetup.picks.length}</b> / ${A_.TEAM_SIZE}人`;
    $("#as-random").disabled = asetup.picks.length >= A_.TEAM_SIZE || chars.length < A_.TEAM_SIZE;
    $("#as-clear").disabled = !asetup.picks.length;
    const rows = asetup.picks.map((id, i) => {
      const c = S.find(id);
      if (!c) return "";
      const st = A_.create(c, { mode: "normal", rng: global.Rng.createSeededRng("asetup") });
      const me = { ...A_.playerChar(st, c), arcadeLv: 1 };
      // v1.7.4:能力値(アーケードの始まりの Lv1)と武器も出す
      return `<div class="tt-arc-member"><b class="ts-no">${i + 1}</b><div class="tt-slot-body">${UI.fighterHeader(me, { element: true })}${ttStatsHtml(me, me.stats, me.weapons)}</div></div>`;
    }).join("");
    $("#as-detail").innerHTML = `<div class="side-top"><p class="side-label">自分のチーム<small>アーケードの始まり(Lv1)</small></p></div>
      <div class="tt-arc-team">${rows || '<p class="muted as-detail-empty">キャラを3人選ぶと、ここに出ます</p>'}</div>`;
    const ok = asetup.picks.length === A_.TEAM_SIZE;
    $("#as-start").disabled = !ok;
    $("#as-start-note").textContent = ok ? "Lv1から始まります。最初に、1人ずつランダムの2つのスキルから1つを選びます。(キャラ一覧の能力値は変わりません)"
      : chars.length < A_.TEAM_SIZE ? `キャラが3人以上必要です(いま${chars.length}人)。` : `あと${A_.TEAM_SIZE - asetup.picks.length}人選んでください。`;
  }
  const pickArc = (id) => {
    if (asetup.mode === "team") {
      const i = asetup.picks.indexOf(id);
      if (i >= 0) asetup.picks.splice(i, 1);
      else if (asetup.picks.length < A_.TEAM_SIZE) asetup.picks.push(id);
    } else asetup.pick = id;
    renderArcSetup();
  };
  $("#as-chars").addEventListener("click", (e) => { const li = e.target.closest("li[data-id]"); if (li) pickArc(li.dataset.id); });
  $("#as-chars").addEventListener("keydown", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pickArc(li.dataset.id); }
  });
  // v1.6.7:スマホ:モードの説明は ▼ ボタンで下にスライドして開く
  $("#as-more").addEventListener("click", () => {
    const open = !$("#asetup").classList.contains("explain-open");
    $("#asetup").classList.toggle("explain-open", open);
    $("#as-more").setAttribute("aria-expanded", open ? "true" : "false");
  });
  // v1.7.5:アーケードの3on3:残りをランダムで選ぶ・選び直す(3on3の準備と同じ)
  $("#as-random").addEventListener("click", () => {
    const rest = eligibleChars().filter((c) => !asetup.picks.includes(c.id));
    while (asetup.picks.length < A_.TEAM_SIZE && rest.length) asetup.picks.push(rest.splice(battleRng.int(0, rest.length - 1), 1)[0].id);
    renderArcSetup();
  });
  $("#as-clear").addEventListener("click", () => { asetup.picks = []; renderArcSetup(); });
  $("#as-mode").addEventListener("click", (e) => { const b = e.target.closest(".bo-btn"); if (b) { asetup.mode = b.dataset.v; renderArcSetup(); } });
  $("#as-detail").addEventListener("change", (e) => {
    if (!e.target.classList.contains("as-form")) return;
    asetup.view = e.target.checked ? "transformed" : "human";
    renderArcSetup();
  });
  $("#as-start").addEventListener("click", () => {
    if (asetup.mode === "team") {
      const chars = asetup.picks.map((id) => S.find(id)).filter(Boolean);
      if (chars.length !== A_.TEAM_SIZE) return;
      arcState = A_.createTeam(chars, { rng: battleRng });
      A_.ensureEnemy(arcState);
      saveArc();
      arcMsg = "";
      goto("arcade");
      return;
    }
    const ike = asetup.mode === "ike";
    const c = ike ? A_.ikeChar(null) : asetup.pick && S.find(asetup.pick);
    if (!c) return;
    arcState = A_.create(c, { mode: asetup.mode, skillMode: "carry", rng: battleRng });
    A_.ensureEnemy(arcState);
    saveArc();
    arcMsg = "";
    goto("arcade");
  });

  // ---- アーケードの画面 ----
  let arcMsg = "";
  let arcPlaying = false;
  let arcSwapName = null; // v1.6.1:交換するスキル(1つ目・2つ目のどちらと交換するかを選ぶ間)
  function renderArcade() {
    const st = loadArc();
    if (!st) { goto("asetup"); return; }
    const saved = arcSaved(st);
    $("#arc-rule").textContent = A_.isIke(st)
      ? `アイクモード(全${A_.stagesOf(st)}面) ・ スキル:${arcSkillModeText(st.skillMode)} ・ コンティニュー${st.continues}回`
      : A_.isTeam(st) ? `3on3(${arcTeamSaved(st).map((c) => c.name).join("・")}) ・ コンティニュー${st.continues}回 ・ 10体目を倒すと★、EXTRAに勝つと★★`
      : `${saved.name} ・ スキル:${arcSkillModeText(st.skillMode)} ・ コンティニュー${st.continues}回 ・ 10体目を倒すと★、EXTRAのイナを倒すと★★`;
    renderLadder(st);
    renderArcMe(st);
    arcStatsSync(); // v1.8.2
    const q = $("#btn-arc-quit");
    q.dataset.confirm = "";
    q.textContent = st.done ? "結果を消して最初から" : "アーケードをやめる";
    q.hidden = false;
    const box = $("#arc-main");
    box.className = "tour-next panel";
    // 勝ったあとのレベルアップ(1回ずつ)→ 手に入れたもの → スキルの選択 → 次の敵
    const head = st.pending[0];
    if (head && !["skill", "item", "boost", "dope"].includes(head.type)) {
      box.innerHTML = `<p class="tn-head">レベルアップ<span>画面をタップすると次へ進みます</span></p>`;
      playArcPending();
      return;
    }
    if (head && head.type === "item") { renderArcItem(st, head); return; }
    if (head && head.type === "boost") { renderArcBoost(st, head); return; }
    if (head && head.type === "dope") { renderArcDope(st, head); return; }
    if (head) { renderSkillChoice(st); return; }
    if (st.done) { renderArcResult(st); return; }
    renderArcNext(st);
  }
  function renderLadder(st) {
    const n = A_.stagesOf(st), ike = A_.isIke(st);
    const ol = $("#arc-ladder");
    ol.classList.toggle("ike", ike);
    ol.innerHTML = Array.from({ length: n }, (_, i) => {
      const k = i + 1;
      const e = st.enemies[k];
      const done = k <= st.cleared, now = k === st.stage && !st.done;
      const sub = done && e ? (Array.isArray(e) ? "撃破" : UI.esc(e.name)) : arcStageLabel(st, k);
      const boss = ike ? [A_.IKE.KNIGHT1, A_.IKE.FERAL, A_.IKE.BOSS, A_.IKE.ASHNARD].includes(k) : k === A_.EXTRA;
      const mark = ike ? "" : k === A_.STAR_STAGE ? '<i class="arc-mark">★</i>' : k === A_.EXTRA ? '<i class="arc-mark arc-full">★★</i>' : "";
      const bonus = ike && k === A_.IKE.ASHNARD; // v1.6.2:21体目は横いっぱいの枠
      return `<li class="${done ? "done" : ""}${now ? " now" : ""}${boss ? " extra" : ""}${bonus ? " bonus" : ""}"><b>${!ike && k === A_.EXTRA ? "EX" : k}</b><small>${sub}</small>${mark}</li>`;
    }).join("");
  }
  function renderArcMe(st) {
    if (A_.isTeam(st)) { renderArcTeamMe(st); return; } // v1.7.1
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
    if (A_.isTeam(st)) { renderArcTeamNext(st); return; } // v1.7.1
    const me = arcPlayer(), en = arcEnemy();
    saveArc();
    const ex = inaLimited(st);
    const mine = st.skillMode === "carry" ? chips(st.skills) : `<span class="muted">毎回ルーレット${ex ? "(2つ)" : ""}</span>`;
    const theirs = chips([en.skill, ...(en.extraSkills || [])]) || '<span class="muted">スキルなし</span>';
    const note = en.roundOne ? "ラウンド1だけ戦います。アイクが倒れなければクリア"
      : en.roundLimit ? `${en.roundLimit}ラウンドまでに倒せないとゲームオーバー(負け1回)`
        : en.phase2 ? "倒しても、まだ終わらない……"
          : en.feral ? "ずっと化身している(化身ゲージ20のまま)" : "";
    $("#arc-main").innerHTML = `<p class="tn-head">次の敵<span>${arcNextTitle(st, en)}</span></p>
      <div class="tn-vs">${arcFighter(me, mine, null)}<b class="tn-v">VS</b>${arcFighter(en, theirs, en.weapon)}</div>
      <div class="card-actions tn-buttons"><button type="button" class="btn btn-main" id="btn-arc-prep">バトル準備へ</button></div>
      ${ex ? `<p class="tn-msg">イナ戦は3回まで(残り${A_.inaLeft(st)}回)</p>` : ""}${ashLimited(st) ? `<p class="tn-msg">アシュナード戦のコンティニューは${A_.IKE.ASH_CONTINUES}回まで(残り${A_.ashLeft(st)}回)</p>` : ""}${note ? `<p class="tn-msg">${note}</p>` : ""}${arcMsg ? `<p class="tn-msg">${arcMsg}</p>` : ""}`;
  }
  function renderSkillChoice(st) {
    const p = st.pending[0];
    if (A_.isTeam(st)) { renderArcTeamSkill(st, p); return; } // v1.7.1
    if (p.mode === "swap2" && arcSwapName) {
      // v1.6.1:1つ目・2つ目のどちらと交換するか
      const slotBtn = (i) => `<button type="button" class="arc-skill arc-slot" data-slot="${i}"><span class="as-top">${UI.skillChip(st.skills[i], false)}<small>${i + 1}つ目</small></span>
        <span class="as-desc">${UI.esc(arcSkillDesc(st.skills[i], A_.isIke(st)))}</span></button>`;
      $("#arc-main").innerHTML = `<p class="tn-head">スキルを交換する</p>
        <p class="arc-note">${chips([arcSwapName])}を、どちらのスキルと交換しますか?</p>
        <div class="arc-skills">${slotBtn(0)}${slotBtn(1)}</div>
        <div class="card-actions tn-buttons"><button type="button" class="btn" id="btn-arc-swap-back">選び直す</button></div>`;
      return;
    }
    const head = { start: "最初のスキルを選ぶ", swap: "スキルを交換する", swap2: "スキルを交換する", add: "2つ目のスキルを追加する", add3: "3つ目のスキルを追加する" }[p.mode];
    const note = p.mode === "start" ? "どちらか1つを選んでください。このスキルを持ち越して戦います。"
      : p.mode === "add3" ? `アシュナードとの戦いの前に、3つ目のスキルを1つ選べます(いまの${chips(st.skills)}はそのまま)。`
      : p.mode === "add" ? `${st.cleared === A_.ADD_SKILL_STAGE ? `${A_.ADD_SKILL_STAGE}体目を倒したので、` : ""}2つ目のスキルとして追加できます(いまの${chips(st.skills)}はそのまま)。`
        : p.mode === "swap2" ? `いまのスキル${chips(st.skills)}の、どちらかと交換できます。交換しなくてもかまいません。`
          : `いまのスキル${chips(st.skills)}と交換できます。交換しなくてもかまいません。`;
    const opts = p.options.map((o) => {
      const s = UI.skillInfo(o.name);
      return `<button type="button" class="arc-skill${s && s.rare ? " rare" : ""}" data-skill="${UI.esc(o.name)}">
        <span class="as-top">${UI.skillChip(o.name, false)}<small>${o.from === "enemy" ? "倒した敵のスキル" : o.from === "third" ? "3つ目" : o.from === "sure" ? "必ず出る" : "ランダム"}</small></span>
        <span class="as-desc">${UI.esc(s ? arcSkillDesc(o.name, A_.isIke(st)) : "")}</span></button>`;
    }).join("");
    const skip = p.mode === "start" ? "" : `<div class="card-actions tn-buttons"><button type="button" class="btn" id="btn-arc-skip">${p.mode === "add" || p.mode === "add3" ? "追加しない" : "交換しない"}</button></div>`;
    // v1.6.4:2つ目(3つ目)のスキルを追加できるときは、目立つ枠で知らせる(最初の1回は画面に大きく出す)
    const adding = p.mode === "add" || p.mode === "add3";
    const notice = adding ? `<div class="arc-add-notice"><b>${p.mode === "add3" ? "3" : "2"}つ目のスキルを追加できます!</b><span>いまのスキルはそのままで、スキルが1つ増えます。下から1つ選んでください。</span></div>` : "";
    $("#arc-main").innerHTML = `<p class="tn-head">${head}</p>${notice}<p class="arc-note">${note}</p><div class="arc-skills">${opts}</div>${skip}`;
    if (adding && !p.noticed) {
      p.noticed = true;
      saveArc();
      runTalk([{ dark: "dim", ms: 300 }, { banner: "SKILL UP!", sub: `${p.mode === "add3" ? "3" : "2"}つ目のスキルを手に入れられる!`, cls: "clear skillup" }], { skippable: false });
    }
  }
  // v1.6.1:手に入れた武器(アイクモードのラグネル)
  let arcDiscard = null; // v1.6.1:手放す剣(4つを超えるとき)
  function renderArcItem(st, p) {
    const pc = arcPlayer();
    const w = (p.mark ? DB.withMark(DB.weapons[p.weapon], p.mark) : UI.charWeapon(pc, p.weapon)) || DB.weapons[p.weapon];
    const name = UI.esc(w ? w.name : "");
    const forge = p.why === "forge";
    const head = forge ? `${name}が錬成武器にパワーアップ!` : p.mark ? `${name}(錬成)を手に入れた!` : `${name}を手に入れた!`;
    const note = forge ? "錬成されました(名前が緑・錬成の数値はランダム)。次の試合から使えます。"
      : p.why === "ragnell" ? "神剣ラグネル。漆黒の騎士の鎧(エンブラの加護)を打ち破れる剣です。次の試合から使えます。"
        : p.why === "regal" ? "アイク専用の剣。次の試合から使えます。"
          : p.why === "laguz" ? "ラグズに特効の剣。次の試合から使えます。"
            : p.why === "prayer" ? "スキル『祈り』付き。アイクの祈りは、HPが0になる攻撃を受けるとき、幸運の確率でHPが1残ります。"
              : p.why === "forged" ? "錬成された剣です(錬成の数値はランダム)。次の試合から使えます。" : "倒した敵が使っていた武器です。次の試合から使えます。";
    if (A_.needsDiscard(st)) {
      // ラグネル以外の剣は4つまで:手放す剣を1つ選ぶ(新しい剣を選ぶと受け取らない)
      const ids = A_.heldSwords(st).concat([p.weapon]);
      if (!ids.includes(arcDiscard)) arcDiscard = null;
      const card = (id) => {
        const x = id === p.weapon ? w : UI.charWeapon(pc, id) || DB.weapons[id];
        return `<button type="button" class="arc-discard${arcDiscard === id ? " on" : ""}" data-discard="${UI.esc(id)}">${id === p.weapon ? "<small>新しい剣</small>" : ""}${x ? UI.weaponCard(x) : ""}</button>`;
      };
      $("#arc-main").innerHTML = `<p class="tn-head">${head}</p>
        <p class="arc-note">剣はラグネルのほかに${A_.WEAPON_LIMIT}つまで持てます。手放す剣を1つ選んでください(新しい剣を選ぶと受け取りません)。</p>
        <div class="arc-discards">${ids.map(card).join("")}</div>
        <div class="card-actions tn-buttons"><button type="button" class="btn btn-main" id="btn-arc-item"${arcDiscard ? "" : " disabled"}>${arcDiscard === p.weapon ? "受け取らない" : arcDiscard ? "手放して受け取る" : "手放す剣を選んでください"}</button></div>`;
      return;
    }
    $("#arc-main").innerHTML = `<p class="tn-head">${head}</p>
      <p class="arc-note">${note}</p>
      <div class="arc-item">${w ? UI.weaponCard(w) : ""}</div>
      <div class="card-actions tn-buttons"><button type="button" class="btn btn-main" id="btn-arc-item">次へ</button></div>`;
  }
  // v1.6.4:19体目のあと、ドーピングアイテム3つから1つを選ぶ
  function renderArcDope(st, p) {
    const cards = p.options.map((o, i) => {
      const label = DB.STAT_LABELS[o.stat] || "HP";
      const now = st.stats[o.stat];
      return `<button type="button" class="arc-skill arc-dope" data-dope="${i}"><span class="as-top"><b class="dope-name">${UI.esc(o.item)}</b><small>${o.stat === "hp" ? "最大HP" : label}+${o.n}</small></span>
        <span class="as-desc">${label} ${now} → <b class="up">${Math.min(now + o.n, (A_.capOf(st) || {})[o.stat] || 99)}</b></span></button>`;
    }).join("");
    $("#arc-main").innerHTML = `<p class="tn-head">ドーピングアイテムを1つ選ぶ</p>
      <p class="arc-note">なりそこないを倒した!3つのアイテムから、1つだけ選んで使えます。</p>
      <div class="arc-skills">${cards}</div>`;
  }
  // v1.6.1:能力値が上がるアイテム(天使の羽衣・エナジーの雫・女神の像・竜の盾)
  function renderArcBoost(st, p) {
    const label = DB.STAT_LABELS[p.stat] || "HP";
    $("#arc-main").innerHTML = `<p class="tn-head">${UI.esc(p.item)}を手に入れた!</p>
      <p class="arc-note">${p.stat === "hp" ? "最大HP" : label}が${p.to - p.from}上がった!</p>
      <div class="arc-boost"><span>${label}</span><b>${p.from}</b><span>→</span><b class="up">${p.to}</b></div>
      <div class="card-actions tn-buttons"><button type="button" class="btn btn-main" id="btn-arc-item">次へ</button></div>`;
  }
  function renderArcResult(st) {
    if (A_.isTeam(st)) { renderArcTeamResult(st); return; } // v1.7.1
    const c = arcSaved(st);
    const ike = A_.isIke(st);
    const box = $("#arc-main");
    box.className = "tour-next panel done";
    let title, text;
    if (ike) {
      // v1.6.2:アシュナードを倒すと ALL CLEAR。コンティニューが4回以上のクリアには、21体目のヒント
      title = st.allClear ? "アイクモード ALL CLEAR" : st.result === "clear" || st.result === "over" ? "アイクモード制覇" : "アイクモード終了";
      text = st.allClear ? "狂王アシュナードを倒しました!アイクモード完全制覇です。"
        : st.result === "over" ? `漆黒の騎士は倒しましたが、アシュナードに${A_.IKE.ASH_CONTINUES + 1}回負けました(アイクモード クリア)。`
        : st.result === "clear" ? `漆黒の騎士を倒しました!アイクモード クリアです。<br><small class="muted">(コンティニュー${A_.IKE.BONUS_CONTINUES}回以内でクリアすると……?)</small>`
          : `${A_.stageName(st.stage, st)}であきらめました(${st.cleared}体を倒した)。`;
    } else {
      title = st.result === "clear" ? "完全制覇" : st.stars ? "アーケード達成" : "アーケード終了";
      text = st.result === "clear" ? `EXTRAのイナを倒しました!${UI.esc(c.name)}の名前に★★が付きました。`
        : st.result === "over" ? `イナに3回負けました。10体目まで勝ち抜いたので、${UI.esc(c.name)}の名前に★が付きました。`
          : st.stars ? `${A_.stageName(st.stage, st)}であきらめました。10体目まで勝ち抜いたので、★が付いています。`
            : `${A_.stageName(st.stage, st)}であきらめました(${st.cleared}体を倒した)。`;
    }
    box.innerHTML = `<p class="tn-head">アーケード終了</p>
      <div class="tn-champ">${UI.charIcon(c, "large")}<div><small>${title}</small><b>${UI.esc(c.name)}</b><span>${st.stars ? `<i class="arc-mark${st.stars >= 2 ? " arc-full" : ""}">${"★".repeat(st.stars)}</i> ` : ""}${st.cleared}体を倒した ・ コンティニュー${st.continues}回</span></div></div>
      <p class="arc-note">${text}</p>
      <div class="card-actions"><button type="button" class="btn btn-main" id="btn-arc-new">新しいアーケード</button></div>`;
  }

  // ================= v1.7.1:アーケードの3on3(画面) =================
  // 計算は js/arcade.js(createTeam / winTeam / chooseTeamSkill)。バトルは 3on3 と同じ(ttStart に arc を渡す)
  function arcTeamSaved(st = arcState) { return st.members.map((m) => S.find(m.charId)); }
  let arcTeamWho = null; // スキルを渡すキャラ(3人の何番目か)を選んだあと(1つ目・2つ目のどちらと交換するかを選ぶ間)
  function renderArcTeamMe(st) {
    const saved = arcTeamSaved(st);
    const html = st.members.map((m, k) => {
      const me = A_.playerChar(m, saved[k]);
      return `<div>${UI.fighterHeader(me, {})}<div class="arc-me-skill"><span class="sp-k">スキル</span>${chips(m.skills) || '<span class="muted">まだ選んでいない</span>'}</div>${UI.statGrid(me, {})}</div>`;
    }).join("");
    $("#arc-me").innerHTML = `<h3 class="sub">自分のチーム<span class="muted">(アーケードの中だけのレベル・能力値)</span></h3><div class="arc-team-me">${html}</div>`;
  }
  function renderArcTeamNext(st) {
    const saved = arcTeamSaved(st), foes = A_.ensureEnemy(st);
    saveArc();
    const mine = st.members.map((m, k) => {
      const c = A_.playerChar(m, saved[k]);
      const w = c.weapons.includes(m.weapon) ? m.weapon : c.weapons[0];
      const opts = c.weapons.map((id) => { const x = UI.charWeapon(c, id); return x ? `<option value="${UI.esc(id)}" ${id === w ? "selected" : ""}>${UI.esc(x.name)}(威力${x.might}・命中${x.hit}・必殺${x.crit}・重さ${x.weight})</option>` : ""; }).join("");
      return `<div class="tn-fighter">${UI.charIcon(c)}<div class="tn-text"><div class="tn-name">${UI.esc(c.name)}${UI.genderMark(c)}</div>
        <div class="tn-sub">${UI.elementBadge(c.element)} ${UI.esc(c.className)} ・ Lv${m.level}</div><div class="tn-skill">${chips(m.skills) || '<span class="muted">スキルなし</span>'}</div>
        <select class="tt-weapon tt-arc-weapon" data-k="${k}" ${c.weapons.length < 2 ? "disabled" : ""} aria-label="${UI.esc(c.name)}の武器">${opts}</select></div></div>`;
    }).join("");
    // 相手は 3on3 と同じく、職業と属性だけ(名前・武器・スキルは出てくるまで分からない)
    const theirs = foes.map((e) => `<div class="tn-fighter"><div class="char-icon tt-q">？</div><div class="tn-text"><div class="tn-name">？？？</div>
      <div class="tn-sub">${UI.elementBadge(e.element)} ${UI.esc(e.className)} ・ Lv${e.arcadeLv}</div></div></div>`).join("");
    const ex = inaLimited(st);
    $("#arc-main").innerHTML = `<p class="tn-head">次の敵<span>${A_.stageName(st.stage, st)}${ex ? " ― 赤竜イナと2人" : ""} ・ 3人${!ex && st.stage >= A_.PROMOTED_FROM ? " ・ 上級職" : ""}</span></p>
      <div class="tn-vs team"><div class="tn-team">${mine}</div><b class="tn-v">VS</b><div class="tn-team">${theirs}</div></div>
      <div class="card-actions tn-buttons"><button type="button" class="btn btn-main" id="btn-arc-tt">3on3開始</button></div>
      <p class="tn-msg">武器を選んでから始めてください。王はバトルの始めにランダムで決まります。</p>
      ${ex ? `<p class="tn-msg">EXTRAは3回まで(残り${A_.inaLeft(st)}回)</p>` : ""}${arcMsg ? `<p class="tn-msg">${arcMsg}</p>` : ""}`;
  }
  function renderArcTeamSkill(st, p) {
    const saved = arcTeamSaved(st);
    const optBtn = (o) => {
      const s = UI.skillInfo(o.name);
      return `<button type="button" class="arc-skill${s && s.rare ? " rare" : ""}" data-skill="${UI.esc(o.name)}">
        <span class="as-top">${UI.skillChip(o.name, false)}<small>${o.from === "enemy" ? "倒した敵のスキル" : "ランダム"}</small></span>
        <span class="as-desc">${UI.esc(s ? arcSkillDesc(o.name, false) : "")}</span></button>`;
    };
    if (p.mode === "start") {
      const c = saved[p.who];
      $("#arc-main").innerHTML = `<p class="tn-head">最初のスキルを選ぶ<span>${p.who + 1} / ${A_.TEAM_SIZE}人目</span></p>
        <div class="tn-vs">${arcFighter({ ...c, arcadeLv: 1 }, "", null)}</div>
        <p class="arc-note"><b>${UI.esc(c.name)}</b>のスキルを、どちらか1つ選んでください。このスキルを持ち越して戦います。</p>
        <div class="arc-skills">${p.options.map(optBtn).join("")}</div>`;
      return;
    }
    if (arcSwapName && arcTeamWho != null) {
      // 1つ目・2つ目のどちらと交換するか
      const m = st.members[arcTeamWho];
      const slotBtn = (i) => `<button type="button" class="arc-skill arc-slot" data-slot="${i}"><span class="as-top">${UI.skillChip(m.skills[i], false)}<small>${i + 1}つ目</small></span>
        <span class="as-desc">${UI.esc(arcSkillDesc(m.skills[i], false))}</span></button>`;
      $("#arc-main").innerHTML = `<p class="tn-head">スキルを交換する<span>${UI.esc(saved[arcTeamWho].name)}</span></p>
        <p class="arc-note">${chips([arcSwapName])}を、どちらのスキルと交換しますか?</p>
        <div class="arc-skills">${slotBtn(0)}${slotBtn(1)}</div>
        <div class="card-actions tn-buttons"><button type="button" class="btn" id="btn-arc-swap-back">選び直す</button></div>`;
      return;
    }
    if (arcSwapName) {
      // 3人のうち、だれに渡すか(1人だけ)
      const btns = st.members.map((m, k) => {
        const ok = A_.teamCanTake(st, k, saved[k], arcSwapName);
        const mode = A_.teamSkillMode(st, k);
        const why = m.skills.includes(arcSwapName) ? "もう持っている" : !ok ? "このキャラは使えない" : mode === "add" ? "2つ目として追加" : mode === "swap2" ? "1つ目か2つ目と交換" : "いまのスキルと交換";
        return `<button type="button" class="arc-skill arc-who-btn" data-who="${k}" ${ok ? "" : "disabled"}>
          <span class="as-top"><b>${UI.esc(saved[k].name)}</b><small>${UI.esc(m.className)}</small></span>
          <span class="as-desc">${chips(m.skills)}<br>${why}</span></button>`;
      }).join("");
      $("#arc-main").innerHTML = `<p class="tn-head">だれに渡す?</p>
        <p class="arc-note">${chips([arcSwapName])}を渡すキャラを1人選んでください(3人のうち1人だけ)。</p>
        <div class="arc-who">${btns}</div>
        <div class="card-actions tn-buttons"><button type="button" class="btn" id="btn-arc-swap-back">選び直す</button></div>`;
      return;
    }
    const notice = p.add ? `<div class="arc-add-notice"><b>2つ目のスキルを追加できます!</b><span>3人のうち1人に、スキルを1つ追加できます。下から1つ選んでください。</span></div>` : "";
    $("#arc-main").innerHTML = `<p class="tn-head">${p.add ? "2つ目のスキルを追加する" : "スキルを交換・追加する"}</p>${notice}
      <p class="arc-note">スキルを1つ選んで、3人のうち<b>1人だけ</b>に渡せます(2つ目のないキャラは追加${st.cleared > A_.ADD_SKILL_STAGE ? "、2つあるキャラはどちらかと交換" : st.cleared < A_.ADD_SKILL_STAGE ? "ではなく交換" : ""})。渡さなくてもかまいません。</p>
      <div class="arc-skills">${p.options.map(optBtn).join("")}</div>
      <div class="card-actions tn-buttons"><button type="button" class="btn" id="btn-arc-skip">${p.add ? "追加しない" : "交換・追加しない"}</button></div>`;
    if (p.add && !p.noticed) {
      p.noticed = true;
      saveArc();
      runTalk([{ dark: "dim", ms: 300 }, { banner: "SKILL UP!", sub: "2つ目のスキルを手に入れられる!", cls: "clear skillup" }], { skippable: false });
    }
  }
  function renderArcTeamResult(st) {
    const saved = arcTeamSaved(st);
    const box = $("#arc-main");
    box.className = "tour-next panel done";
    const title = st.result === "clear" ? "完全制覇" : st.stars ? "アーケード達成" : "アーケード終了";
    const text = st.result === "clear" ? "EXTRA(赤竜イナのチーム)に勝ちました!3人の名前に★★が付きました。"
      : st.result === "over" ? "EXTRAで3回負けました。10体目まで勝ち抜いたので、3人の名前に★が付きました。"
        : st.stars ? `${A_.stageName(st.stage, st)}であきらめました。10体目まで勝ち抜いたので、★が付いています。`
          : `${A_.stageName(st.stage, st)}であきらめました(${st.cleared}体目まで勝った)。`;
    box.innerHTML = `<p class="tn-head">アーケード終了(3on3)</p>
      <div class="tn-champ">${saved.map((c) => UI.charIcon(c, "large")).join("")}<div><small>${title}</small><b>${saved.map((c) => UI.esc(c.name)).join("・")}</b><span>${st.stars ? `<i class="arc-mark${st.stars >= 2 ? " arc-full" : ""}">${"★".repeat(st.stars)}</i> ` : ""}${st.cleared}体目まで勝った ・ コンティニュー${st.continues}回</span></div></div>
      <p class="arc-note">${text}</p>
      <div class="card-actions"><button type="button" class="btn btn-main" id="btn-arc-new">新しいアーケード</button></div>`;
  }
  function arcTeamApply(k, slot) {
    const saved = arcTeamSaved(arcState)[k];
    const m = arcState.members[k];
    const mode = A_.teamSkillMode(arcState, k);
    const old = mode === "swap2" ? m.skills[slot] : m.skills[0];
    const name = arcSwapName;
    if (!A_.chooseTeamSkill(arcState, name, k, slot, saved)) return;
    arcMsg = mode === "add" ? `${UI.esc(saved.name)}に『${UI.esc(name)}』を2つ目のスキルとして追加しました。` : `${UI.esc(saved.name)}の『${UI.esc(old)}』を『${UI.esc(name)}』に交換しました。`;
    arcSwapName = null; arcTeamWho = null;
    saveArc();
    renderArcade();
  }
  // アーケード画面のクリック(3on3のときだけ。扱ったら true)
  function arcTeamClick(e) {
    const t = e.target;
    if (t.id === "btn-arc-tt") { arcTeamStart(); return true; }
    const p = arcState.pending[0];
    if (!p || p.type !== "skill") return false;
    const sk = t.closest(".arc-skill[data-skill]");
    if (sk) {
      const name = sk.dataset.skill;
      if (p.mode === "start") {
        const c = arcTeamSaved(arcState)[p.who];
        if (A_.chooseTeamSkill(arcState, name)) { arcMsg = `${UI.esc(c.name)}は『${UI.esc(name)}』で戦います。`; saveArc(); renderArcade(); }
        return true;
      }
      arcSwapName = name; arcTeamWho = null;
      renderArcade();
      return true;
    }
    const w = t.closest("[data-who]");
    if (w) {
      if (w.disabled || !arcSwapName) return true;
      const k = Number(w.dataset.who);
      if (A_.teamSkillMode(arcState, k) === "swap2") { arcTeamWho = k; renderArcade(); } else arcTeamApply(k, 0);
      return true;
    }
    const sl = t.closest("[data-slot]");
    if (sl && arcTeamWho != null) { arcTeamApply(arcTeamWho, Number(sl.dataset.slot)); return true; }
    if (t.id === "btn-arc-swap-back") {
      if (arcTeamWho != null) arcTeamWho = null; else arcSwapName = null;
      renderArcade();
      return true;
    }
    if (t.id === "btn-arc-skip") {
      if (p.add && t.dataset.confirm !== "1") { t.dataset.confirm = "1"; t.textContent = "本当に追加しない?(もう一度押す)"; return true; }
      arcSwapName = null; arcTeamWho = null;
      if (A_.chooseTeamSkill(arcState, null)) { arcMsg = "スキルはそのままです。"; saveArc(); renderArcade(); }
      return true;
    }
    return false;
  }
  $("#screen-arcade").addEventListener("change", (e) => {
    const sel = e.target.closest(".tt-arc-weapon");
    if (!sel || !arcState || !A_.isTeam(arcState)) return;
    arcState.members[Number(sel.dataset.k)].weapon = sel.value;
    saveArc();
  });
  // アーケードの3on3のバトルを始める(コンティニューも同じ相手)
  function arcTeamStart() {
    const st = arcState;
    if (!st || st.done || !A_.isTeam(st)) return;
    const saved = arcTeamSaved(st);
    const chars = st.members.map((m, k) => A_.playerChar(m, saved[k]));
    const weapons = st.members.map((m, k) => (chars[k].weapons.includes(m.weapon) ? m.weapon : chars[k].weapons[0]));
    const foes = A_.ensureEnemy(st);
    saveArc();
    arcMsg = "";
    ttStart({
      mine: chars, weapons, foes, arc: { stage: st.stage },
      opts: { foeWeapons: foes.map((e) => e.weapon), skills: { left: st.members.map((m) => m.skills.slice()), right: foes.map((e) => [e.skill, ...(e.extraSkills || [])]) } },
    });
  }

  // v1.8.2:アーケードの3on3のとき、「タイトルへ戻る」の右に「3人のステータス」ボタン。押すと3人のレベル・能力値・スキル・武器
  //         (アーケードの画面と、3on3のバトル(出すキャラを選ぶ画面の上にも出る))
  function arcStatsOn() {
    const st = arcState;
    if (!st || !A_.isTeam(st) || st.done) return false;
    const scr = ($(".screen.active") || {}).id;
    if (scr === "screen-arcade") return true;
    return scr === "screen-battle" && !!(battle.team && battle.ttCfg && battle.ttCfg.arc);
  }
  function arcStatsPlace() {
    const btn = $("#nav-arcstats"), home = $("#nav-home");
    if (btn.hidden || home.hidden) return;
    const r = home.getBoundingClientRect();
    btn.style.top = Math.round(r.top) + "px";
    btn.style.left = Math.round(r.right + 10) + "px";
    btn.style.height = Math.round(r.height) + "px";
  }
  function arcStatsSync() {
    const on = arcStatsOn();
    $("#nav-arcstats").hidden = !on;
    if (!on) $("#arc-stats").hidden = true;
    else global.requestAnimationFrame(arcStatsPlace);
  }
  function arcStatsOpen() {
    const st = arcState;
    if (!st || !A_.isTeam(st)) return;
    const saved = arcTeamSaved(st);
    $("#arc-stats-body").innerHTML = st.members.map((m, k) => {
      const me = A_.playerChar(m, saved[k]);
      if (!me) return "";
      const wid = me.weapons.includes(m.weapon) ? m.weapon : me.weapons[0];
      const w = wid ? UI.charWeapon(me, wid) : null;
      return `<div>${UI.fighterHeader(me, {})}<div class="arc-me-skill"><span class="sp-k">スキル</span>${chips(m.skills) || '<span class="muted">まだ選んでいない</span>'}</div>${UI.statGrid(me, {})}${w ? `<div class="weapon-line tt-wline">${UI.weaponLine(w)}</div>` : ""}</div>`;
    }).join("");
    $("#arc-stats").hidden = false;
    $(".arc-stats-box", $("#arc-stats")).scrollTop = 0;
  }
  $("#nav-arcstats").addEventListener("click", (e) => { e.stopPropagation(); arcStatsOpen(); });
  $("#arc-stats").addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.target.id === "arc-stats" || e.target.closest("#arc-stats-close")) $("#arc-stats").hidden = true;
  });
  global.addEventListener("resize", () => arcStatsSync());

  // 勝ったあとのレベルアップ・クラスチェンジを1回ずつ見せる(タップで次へ)
  async function playArcPending() {
    if (arcPlaying) return;
    arcPlaying = true;
    const saved = arcSaved();
    // v1.7.4:3on3は、3人分のレベルアップ・クラスチェンジをまとめて1回で見せる
    if (arcState && A_.isTeam(arcState)) {
      const n = arcState.pending.findIndex((p) => ["skill", "item", "boost", "dope"].includes(p.type));
      const steps = arcState.pending.slice(0, n < 0 ? arcState.pending.length : n);
      if (steps.length) {
        await levelTeamStep(steps, arcTeamSaved(arcState));
        if (arcState) { arcState.pending.splice(0, steps.length); saveArc(); }
      }
    }
    while (arcState && arcState.pending.length && !["skill", "item", "boost", "dope"].includes(arcState.pending[0].type)) {
      const step = arcState.pending[0];
      // v1.7.1:3on3は、だれのレベルアップか(who)
      await levelStep(step, A_.isTeam(arcState) && step.who != null ? arcTeamSaved(arcState)[step.who] : saved);
      if (!arcState) break;
      arcState.pending.shift();
      saveArc();
    }
    arcPlaying = false;
    if ($("#screen-arcade").classList.contains("active")) renderArcade();
  }
  // v1.7.4:3on3のレベルアップ。3人分の上がった数値を1回で見せる(1人ずつのレベルアップを合わせた分。クラスチェンジもいっしょに)
  function levelTeamStep(steps, chars) {
    return new Promise((resolve) => {
      const ov = $("#levelup");
      const run = ++luRun;
      let skip = reduceMotion();
      let wake = null;
      const wait = async (ms) => {
        if (!skip) await new Promise((r) => { wake = r; setTimeout(r, ms); });
        return run === luRun;
      };
      const who = [...new Set(steps.map((s) => s.who))].filter((k) => k != null);
      const cols = who.map((k) => {
        const mine = steps.filter((s) => s.who === k);
        const first = mine[0], last = mine[mine.length - 1];
        const gains = {};
        for (const key of DB.STAT_KEYS) gains[key] = mine.reduce((a, s) => a + (s.gains[key] || 0), 0);
        const cc = mine.find((s) => s.type === "classchange");
        const c = chars[k] || {};
        return { k, name: c.name || "", laguz: c.race === "ラグズ", cc, from: first.type === "classchange" ? first.from : first.from, to: last.to, before: first.before, after: last.after, gains,
          cls: cc ? `${cc.fromClass} → ${cc.toClass}` : `${first.className || ""}${c.race === "ラグズ" ? "(化身前)" : ""}` };
      });
      const anyCc = cols.some((c) => c.cc);
      $(".lu-banner", ov).textContent = anyCc ? "CLASS CHANGE!" : "LEVEL UP!";
      $("#lu-name").textContent = `${cols.length}人`;
      $("#lu-class").textContent = "まとめてレベルアップ";
      $("#lu-lv").textContent = "";
      ov.classList.add("lu-team-mode");
      $("#lu-stats").innerHTML = `<div class="lu-team">${cols.map((c) => `<div class="lu-col" data-k="${c.k}">
        <p class="lu-col-name">${UI.esc(c.name)}</p><p class="lu-col-class">${UI.esc(c.cls)}</p><p class="lu-col-lv">Lv <b>${c.from}</b> → <b class="lu-col-to">${c.cc && c.to === 1 ? "1" : c.to}</b></p>
        ${DB.STAT_KEYS.map((key) => `<div class="lu-stat" data-k="${key}"><span class="k">${DB.STAT_LABELS[key]}</span><span class="v">${c.before[key]}</span><span class="up">${c.gains[key] > 0 ? "+" + c.gains[key] : ""}</span></div>`).join("")}</div>`).join("")}</div>`;
      $("#lu-hint").textContent = "タップで飛ばす";
      ov.dataset.done = "0";
      ov.hidden = false;
      const close = () => { ov.hidden = true; ov.classList.remove("lu-team-mode"); luRun++; resolve(); };
      ov.onclick = () => {
        if (ov.dataset.done === "1") close();
        else { skip = true; if (wake) wake(); }
      };
      (async () => {
        if (!(await wait(450))) return;
        // 能力値は、3人とも同じ行を同時に上げる(HP → 力 → …)
        for (const key of DB.STAT_KEYS) {
          let any = false;
          for (const c of cols) {
            if (!(c.gains[key] > 0)) continue;
            const row = $(`.lu-col[data-k="${c.k}"] .lu-stat[data-k="${key}"]`, ov);
            $(".v", row).textContent = c.after[key];
            row.classList.add("got");
            any = true;
          }
          if (any && !(await wait(260))) return;
        }
        ov.dataset.done = "1";
        $("#lu-hint").textContent = "タップで次へ";
      })();
    });
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
    const dope = t.closest(".arc-dope");
    if (dope) {
      if (A_.chooseDope(arcState, Number(dope.dataset.dope))) { saveArc(); renderArcade(); }
      return;
    }
    if (A_.isTeam(arcState) && arcTeamClick(e)) return; // v1.7.1
    if (t.id === "btn-arc-prep") {
      if (!arcState || arcState.done) return;
      arcMatch = { stage: arcState.stage };
      arcMsg = "";
      goto("prep");
    } else if (sk && sk.dataset.slot != null) {
      // v1.6.1:1つ目・2つ目のどちらと交換するか
      const slot = Number(sk.dataset.slot);
      const old = arcState.skills[slot];
      if (A_.chooseSkill(arcState, arcSwapName, slot)) {
        arcMsg = `『${UI.esc(old)}』を『${UI.esc(arcSwapName)}』に交換しました。`;
        arcSwapName = null;
        saveArc();
        renderArcade();
      }
    } else if (sk) {
      const name = sk.dataset.skill;
      const mode = arcState.pending[0] && arcState.pending[0].mode;
      if (mode === "swap2") { arcSwapName = name; renderArcade(); return; }
      if (A_.chooseSkill(arcState, name)) {
        arcMsg = mode === "add3" ? `『${UI.esc(name)}』を3つ目のスキルとして追加しました。` : mode === "add" ? `『${UI.esc(name)}』を2つ目のスキルとして追加しました。` : mode === "swap" ? `『${UI.esc(name)}』に交換しました。` : `『${UI.esc(name)}』で戦います。`;
        saveArc();
        renderArcade();
      }
    } else if (t.id === "btn-arc-swap-back") {
      arcSwapName = null;
      renderArcade();
    } else if (t.id === "btn-arc-skip") {
      // v1.6.2:「追加しない」は、もう一度押すまで確かめる(2つ目のスキルは、あとから追加できないため)
      const p0 = arcState.pending[0];
      if (p0 && (p0.mode === "add" || p0.mode === "add3") && t.dataset.confirm !== "1") {
        t.dataset.confirm = "1";
        t.textContent = "本当に追加しない?(もう一度押す)";
        return;
      }
      arcSwapName = null;
      if (A_.chooseSkill(arcState, null)) { arcMsg = "スキルはそのままです。"; saveArc(); renderArcade(); }
    } else if (t.id === "btn-arc-item") {
      if (A_.takeItem(arcState, arcDiscard)) {
        arcDiscard = null; saveArc(); renderArcade();
      }
    } else if (t.closest && t.closest("[data-discard]")) {
      arcDiscard = t.closest("[data-discard]").dataset.discard;
      renderArcade();
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
  // v1.6.1:クリア・ゲームオーバー・会話の演出があれば、その演出(Promise を返す関数)を返す
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
    if (!st || st.done || st.stage !== t.stage) return null; // もう記録済み
    const saved = arcSaved(st);
    const stage = t.stage;
    const ike = A_.isIke(st), I = A_.IKE;
    let seq = null;
    const team = A_.isTeam(st); // v1.7.1:3on3
    const who = team ? "3人" : saved.name;
    if (e.winner === "left") {
      if (team) A_.winTeam(st, arcTeamSaved(st), battleRng);
      else A_.win(st, saved, battleRng);
      if (team && st.stars) st.members.forEach((m) => S.markArcade(m.charId, st.stars));
      else if (!ike && st.stars) S.markArcade(st.charId, st.stars);
      const ups = st.pending.filter((p) => p.type === "levelup").length;
      const cc = st.pending.some((p) => p.type === "classchange");
      const upText = team ? (cc ? "クラスチェンジ・レベルアップします" : ups ? "3人ともレベルが上がります" : "") : cc ? `${st.className}にクラスチェンジします` : ups ? `レベルが${ups}つ上がります` : "";
      if (ike) {
        text.innerHTML = stage === I.KNIGHT1 ? `漆黒の騎士の攻撃に耐えた!ステージクリア。${upText}`
          : stage === I.ASHNARD ? "アシュナードを倒した!アイクモード ALL CLEAR"
          : stage === I.BOSS ? (st.bonus ? `漆黒の騎士を倒した!コンティニュー${I.BONUS_CONTINUES}回以内のクリアで、21体目に挑戦できます` : "漆黒の騎士を倒した!アイクモード クリア")
            : `${A_.stageName(stage, st)}を倒した!${st.pending.filter((p) => p.type === "item" || p.type === "boost").map((p) => p.type === "boost" ? `${p.item}を手に入れた。` : p.mark ? `${DB.weapons[p.weapon].name}(錬成)を手に入れた。` : p.why === "forge" ? `${DB.weapons[p.weapon].name}が錬成された。` : `${DB.weapons[p.weapon].name}を手に入れた。`).join("")}${upText}`;
        if (stage === I.KNIGHT1) seq = () => runTalk(knightSurviveScript());
        if (stage === I.BOSS) seq = () => runTalk(bossDefeatScript(st.bonus));
        if (stage === I.ASHNARD) seq = () => runTalk(ashnardEndScript(), { skippable: false });
      } else {
        text.innerHTML = stage === A_.EXTRA ? `${team ? "EXTRAに勝った" : "イナを倒した"}!アーケード完全制覇 <i class="arc-mark arc-full">★★</i>`
          : stage === A_.STAR_STAGE ? `10体目を倒した!${UI.esc(who)}の名前に<i class="arc-mark">★</i>が付きました。次はEXTRA(赤竜イナ)`
            : `${A_.stageName(stage, st)}を倒した!${upText}`;
        // v1.6.1:10体目・EXを倒したときのクリア演出
        if (stage === A_.STAR_STAGE) seq = () => runTalk(clearScript("STAGE CLEAR", `10体目を撃破!${who}に ★`), { skippable: false });
        if (stage === A_.EXTRA) seq = () => runTalk(clearScript("ALL CLEAR", `EXTRA${team ? "" : "のイナ"}を撃破!${who}に ★★`), { skippable: false });
      }
      btnN.textContent = st.done ? "結果を見る" : "次へ";
    } else {
      A_.lose(st);
      if (st.done) {
        text.textContent = ike ? `アシュナードに${A_.IKE.ASH_CONTINUES + 1}回負けました。アイクモード終了(20体目まではクリア)` : `${team ? "EXTRAで" : "イナに"}3回負けました。アーケード終了(10体目までの★はそのまま)`;
        btnN.textContent = "結果を見る";
        // v1.6.4:アシュナード戦で負けたときは、アイクの散り際のセリフ
        seq = () => runTalk([...(ike && stage === I.ASHNARD ? ikeFallScript() : []), ...gameOverScript()], { skippable: false });
      } else {
        text.textContent = inaLimited(st) ? `負けてしまった…(イナ戦 残り${A_.inaLeft(st)}回)` : ashLimited(st) ? `負けてしまった…(アシュナード戦 コンティニュー残り${A_.ashLeft(st)}回)` : "負けてしまった…コンティニューできます(同じ敵ともう一度)";
        btnC.hidden = false; btnG.hidden = false; btnN.hidden = true;
        if (ike && stage === I.KNIGHT1) seq = () => runTalk(knightDefeatScript());
        if (ike && stage === I.ASHNARD) seq = () => runTalk(ikeFallScript()); // v1.6.4:アイクの散り際のセリフ
        // v1.6.2:20体目の漆黒の騎士を10ラウンドまでに倒せなかった → ゲームオーバー(負け1回。コンティニューできる)
        if (ike && e.timeOut) {
          text.textContent = `${I.BOSS_ROUNDS}ラウンドまでに漆黒の騎士を倒せなかった…コンティニューできます(同じ敵ともう一度)`;
          seq = () => runTalk(gameOverScript(), { skippable: false });
        }
      }
    }
    saveArc();
    return seq;
  }
  $("#btn-arc-continue").addEventListener("click", () => {
    if (!arcState || arcState.done) { goto("arcade"); return; }
    if (A_.isTeam(arcState)) { arcTeamStart(); return; } // v1.7.1
    arcMatch = { stage: arcState.stage };
    goto("prep");
  });
  $("#btn-arc-next").addEventListener("click", () => goto("arcade"));
  // v1.6.1:あきらめる → 画面はそのまま、暗転して GAME OVER → タップでアーケード画面(結果)へ
  $("#btn-arc-giveup").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = "本当にあきらめる?(もう一度押す)"; return; }
    if (!arcState || arcState.done) { goto("arcade"); return; }
    A_.giveUp(arcState);
    saveArc();
    $("#battle-result").hidden = true;
    await runTalk(gameOverScript(), { skippable: false, keepDark: true });
    goto("arcade");
    await talkDark(false);
    $("#talk").hidden = true;
  });

  // ================= v1.6.1:会話・暗転・クリア/ゲームオーバーの演出 =================
  // 台本(steps)の1つ1つ:
  //   { who, text }   … 会話(タップで次へ)
  //   { dark: true|false|"dim", ms } … 暗転(dim は半分暗く)/ 暗転から戻る
  //   { wait: ms }    … 待つ
  //   { banner, sub, cls } … STAGE CLEAR などの大きな文字(タップで次へ)
  //   { fn, hide }    … 関数を実行(hide:演出の幕を外して、後ろの画面を見せる。スキップすると実行しない)
  // スキップ:会話・イベントを飛ばす(暗転・大きな文字は出す)
  const talkEl = $("#talk");
  let talkWake = null, talkSkip = false;
  talkEl.addEventListener("click", (e) => {
    if (e.target.id === "talk-skip") { talkSkip = true; $("#talk-skip").hidden = true; }
    if (talkWake) talkWake();
  });
  // v1.6.3:キーボードでも会話を進める・飛ばす(Enter・スペースで次へ、Esc でスキップ)
  document.addEventListener("keydown", (e) => {
    if (talkEl.hidden) return;
    if (e.key === "Escape" && !$("#talk-skip").hidden) { talkSkip = true; $("#talk-skip").hidden = true; if (talkWake) talkWake(); }
    else if ((e.key === "Enter" || e.key === " ") && talkWake) { e.preventDefault(); talkWake(); }
  });
  function talkWait(ms) {
    return new Promise((resolve) => {
      let t = null;
      const done = () => { clearTimeout(t); talkWake = null; resolve(); };
      talkWake = ms == null ? done : null; // 時間で進むものはタップで早めない(暗転など)
      if (ms != null) t = setTimeout(done, reduceMotion() ? Math.min(ms, 200) : ms);
    });
  }
  async function talkDark(on, ms = 700) {
    const d = $("#talk-dark");
    talkEl.hidden = false;
    d.classList.toggle("dim", on === "dim");
    d.classList.toggle("on", !!on);
    await talkWait(ms);
  }
  async function runTalk(steps, opts = {}) {
    steps = splitTalk(steps); // v1.6.4:3行ずつ
    const skippable = opts.skippable !== false;
    talkSkip = false;
    talkEl.hidden = false;
    talkEl.classList.remove("hide");
    $("#talk-skip").hidden = !skippable;
    const box = $("#talk-box"), banner = $("#talk-banner");
    for (const st of steps) {
      if (st.who !== undefined) {
        if (talkSkip) continue;
        box.hidden = false;
        box.classList.toggle("narration", !st.who);
        $("#talk-name").textContent = st.who;
        $("#talk-name").hidden = !st.who;
        const p = $("#talk-text");
        p.textContent = st.text;
        p.classList.remove("in"); void p.offsetWidth; p.classList.add("in");
        await talkWait(null);
        continue;
      }
      box.hidden = true;
      if (st.dark !== undefined) { await talkDark(st.dark, st.ms ?? 700); continue; }
      if (st.wait) { if (!talkSkip) await talkWait(st.wait); continue; }
      if (st.banner) {
        banner.className = "talk-banner " + (st.cls || "");
        banner.innerHTML = `<b>${UI.esc(st.banner)}</b>${st.sub ? `<small>${UI.esc(st.sub)}</small>` : ""}<em>タップで次へ</em>`;
        banner.hidden = false;
        $("#talk-skip").hidden = true;
        await talkWait(900);
        await talkWait(null);
        banner.hidden = true;
        $("#talk-skip").hidden = !skippable || talkSkip;
        continue;
      }
      if (st.fn) {
        if (talkSkip && st.skippable !== false) continue;
        if (st.hide) talkEl.classList.add("hide");
        await st.fn();
        talkEl.classList.remove("hide");
      }
    }
    box.hidden = true;
    banner.hidden = true;
    $("#talk-skip").hidden = true;
    if (opts.keepDark) return;
    await talkDark(false, 500);
    talkEl.hidden = true;
  }
  const say = (who, text) => ({ who, text });
  // v1.6.4:セリフは3行ずつに区切る(4行以上のセリフは、行数がなるべく同じになるように2つ以上の箱に分ける)
  function splitLines(text) {
    const lines = String(text).split("\n");
    if (lines.length <= 3) return [text];
    const n = Math.ceil(lines.length / 3), out = [];
    let i = 0;
    for (let k = 0; k < n; k++) {
      const size = Math.ceil((lines.length - i) / (n - k));
      out.push(lines.slice(i, i + size).join("\n"));
      i += size;
    }
    return out;
  }
  const splitTalk = (steps) => steps.flatMap((st) => (st && st.who !== undefined ? splitLines(st.text).map((text) => ({ ...st, text })) : [st]));
  const KNIGHT = "漆黒の騎士", IKE_ = "アイク", ASH = "アシュナード";
  const clearScript = (title, sub) => [{ dark: "dim" }, { banner: title, sub, cls: "clear" }];
  const gameOverScript = () => [{ dark: true, ms: 1200 }, { banner: "GAME OVER", cls: "over" }];
  // 11体目:漆黒の騎士(戦いの前のセリフ。パターン1は50%、2は10%、3・4は20%)
  function knightOpeningScript() {
    const r = battleRng.next();
    if (r < 0.1) {
      return [
        say(KNIGHT, "やあ、(´・ω・`)ようこそ、しっこくハウスへ。"),
        say(KNIGHT, "このエタルドはサービスだから、まずは喰らって死んで欲しい。"),
        say(KNIGHT, "うん、「絶対に勝てない」んだ。済まない。"),
        say(KNIGHT, "仏の顔もって言うしね、謝って許してもらおうとも思っていない。"),
        say(KNIGHT, "でも、このパラメータを見たとき、君は、\nきっと言葉では言い表せない 「絶望」みたいなものを感じてくれたと思う。"),
        say(KNIGHT, "殺伐とした世の中でそういう気持ちを忘れないで欲しい、\nそう思ってこの攻撃をしかけたんだ。"),
        say(KNIGHT, "______________じゃあ、リセットしようか。"),
      ];
    }
    if (r < 0.3) return [say(KNIGHT, "…貴様ごときに\n私の相手が務まると思ったか？\n身の程をわきまえよ。")];
    if (r < 0.5) return [say(KNIGHT, "…この程度の兵力に、てこずるとは…\n私の見込み違いということか？"), say(IKE_, "…！！\nあいつは…！")];
    return [
      say(KNIGHT, "また会ったな、小僧。"),
      say(IKE_, "……"),
      say(KNIGHT, "何故、仕掛けてくる？\nおまえでは私の敵にはならん。\n全力で逃げるべきではないのか？"),
      say(IKE_, "うっ…\nうおおおおおお！"),
      say(KNIGHT, "…愚か者め。"),
    ];
  }
  // v1.6.2:アイクとミストの会話(11体目のあと)は削除
  // 11体目:ラウンド1を耐えた(パターン1は80%、パターン2は20%)
  function knightSurviveScript() {
    const talk = battleRng.next() < 0.2
      ? [say(IKE_, "…っ…なぜだ…\nオレの攻撃が…きかない…？"), say(KNIGHT, "かなり、やる。\nだが、私の敵ではないな。")]
      : [say(KNIGHT, "……ほぅ　かわしたか。\nだが…次はどうだ？"), say(IKE_, "！！")];
    return [...talk, { dark: true, ms: 900 }, { banner: "STAGE CLEAR", sub: "漆黒の騎士の攻撃に耐えた", cls: "clear" }];
  }
  // 11体目:アイクが倒された
  const knightDefeatScript = () => [
    say(IKE_, "ぐっうっ…\n……俺の…力では………\n…………ま………だ………"),
    say(KNIGHT, "……その程度の腕で、\n私に敵うとでも思ったか？\n時に退くことも知らぬようでは……\nどのみち、生き残れなかったろうがな。"),
    ...gameOverScript(),
  ];
  // v1.6.2:戦いの前の会話(11体目・20体目の漆黒の騎士、21体目のアシュナード)。ないときは null
  function arcOpening() {
    if (!arcState || !A_.isIke(arcState)) return null;
    const en = arcEnemy(), I = A_.IKE;
    if (en.roundOne) return knightOpeningScript();
    if (arcState.stage === I.BOSS) return bossOpeningScript();
    if (arcState.stage === I.ASHNARD) return ashnardOpeningScript();
    return null;
  }
  // 20体目:戦いの前の会話(v1.6.2:イナと漆黒の騎士・そのあとのアイクとの会話、イナが倒されるイベントは削除。ここだけ残す)
  const bossOpeningScript = () => [
    say(KNIGHT, "奇妙な縁だな……\n貴様との勝負はこれが３度目か。\n１度目はガリアの森……\n２度目はクリミアのデルブレー……"),
    say(IKE_, "ああ。\n俺は２度戦い、２度負けた。\nだが――\nこの３度目は、違う。"),
    say(KNIGHT, "ほう……"),
    say(IKE_, "…幼い頃から、親父に基礎を\n叩き込まれた俺の剣技は……\n極めれば…誰にも負けるはずがない。"),
    say(KNIGHT, "…貴様の父親を倒した私に、\n同じ剣技は通用しないと……\n考えなかったのか？"),
    say(IKE_, "親父は……！\n利き手を封じていた。\nそうでなければ…おまえに\n負けはしなかったはずだ……"),
    say(KNIGHT, "……フッ　そういうことか。\nでは、試してみよう。\nガウェインの剣技の後継者よ…\nその力、この私に見せてみよ！"),
  ];
  // v1.6.2:21体目 アシュナード(戦いの前の会話)
  const ashnardOpeningScript = () => [
    say(IKE_, "………"),
    say(ASH, "くくく　その構え…\nよく覚えておるぞ……\n父親の剣技を継いだか。\n実に良いぞ……"),
    say(IKE_, "狂王アシュナード！\nこの剣で…おまえを倒し…\n戦いを終わらせる。"),
    say(ASH, "おまえが我を…\n力持って制するというなら、\n望むところだ……\nそれこそが我の理想とする\n世界の在りかたというものだからな。"),
    say(IKE_, "…なんだと？"),
  ];
  // v1.6.2:変身前のアシュナードを倒した(戦闘画面のまま)
  const ashnardDownScript = () => [
    say(ASH, "……我が敗れる、か。\nく…"),
    say(ASH, "くくくくくくくく\nだが、まだだ。\nまだ、おまえの力、見尽くしてはおらぬ。"),
    say(IKE_, "……何をする気だ？"),
    say(ASH, "今こそ、これを使う時ぞ……"),
    say(IKE_, "まさか……"),
  ];
  // v1.6.2:変身後のアシュナード(そのまま戦いの前の会話 → 次のラウンドへ)
  const ashnardRiseScript = () => [
    say(ASH, "…ふしゅぅぅぅうううう…\n……………………\n………よい心地だ………"),
    say(IKE_, "メダリオンを手にして…\nまだ、正気を……？"),
    say(ASH, "くくくくくくく\n……………参る……"),
  ];
  // v1.6.4:変身後のアシュナードを倒した → アシュナードのセリフ → 消滅の演出 → アイクのセリフ → フェードアウト → ALL CLEAR
  const ashnardEndScript = () => [
    say(ASH, "くく……良い……\n良いぞ、実に良い！\nもっと……もっとだ……！"),
    say(ASH, "この至上の時は、\nまだ……まだ……"),
    { fn: () => ashnardVanish(), hide: true, skippable: false },
    say(IKE_, "……これで本当に終わりだ。"),
    { dark: true, ms: 1600 },
    { banner: "ALL CLEAR", sub: "狂王アシュナードを撃破!アイクモード完全制覇", cls: "clear" },
  ];
  // v1.6.4:アシュナード戦でアイクが倒れたときの、散り際のセリフ
  const ikeFallScript = () => [say(IKE_, "畜生……っ！　俺は……\nここまで来て……！\n……すまない、エリンシア……")];
  // v1.6.4:アシュナードの消滅の演出(赤黒い光に包まれ、灰のように崩れて消える)
  async function ashnardVanish() {
    const el = fighterEl("right");
    if (!el) return;
    const arena = $("#arena");
    arena.classList.remove("slowmo", "ko-dim", "ss-dim");
    el.classList.remove("loser", "ko-target");
    flash(el, "vanish-fx");
    const layer = $(".float-layer", el);
    if (layer) {
      const box = document.createElement("span");
      box.className = "vanish-ash";
      box.innerHTML = Array.from({ length: 24 }, (_, i) => `<i style="left:${4 + ((i * 37) % 92)}%;top:${10 + ((i * 53) % 70)}%;--dx:${((i * 29) % 80) - 40}px;animation-delay:${(i % 8) * 0.12}s"></i>`).join("");
      layer.appendChild(box);
    }
    await new Promise((r) => setTimeout(r, reduceMotion() ? 300 : 2600));
    el.classList.add("vanished");
  }
  // 20体目:漆黒の騎士を倒した(v1.6.2:コンティニュー3回以内なら STAGE CLEAR → 21体目へ)
  const bossDefeatScript = (bonus) => [
    say(KNIGHT, "…強くなったな……\n褒めてやろう……"),
    say(IKE_, "………親父………\n……俺は……やった……\nあいつを倒した……\n親父…………"),
    { dark: true, ms: 1200 },
    bonus ? { banner: "STAGE CLEAR", sub: "漆黒の騎士を撃破 ― 21体目へ", cls: "clear" } : { banner: "CLEAR", sub: "アイクモード クリア", cls: "clear" },
  ];
  // ---- バトル準備・バトルとのつなぎ(アーケード) ----
  function arcPrepInfo() {
    const st = arcState, ex = inaLimited(st);
    const en = arcEnemy();
    const extra = A_.isIke(st) ? (en.roundOne ? "(漆黒の騎士・ラウンド1だけ)" : st.stage === A_.IKE.BOSS ? "(漆黒の騎士・10ラウンドまで)" : st.stage === A_.IKE.ASHNARD ? "(狂王アシュナード)" : st.stage === A_.IKE.FERAL ? "(なりそこない)" : "") : ex ? "(赤竜イナ)" : "";
    $("#tour-info").innerHTML = `<p class="ti-round">${A_.isIke(st) ? "アイクモード ・ " : ""}${A_.stageName(st.stage, st)}${extra} / 全${A_.stagesOf(st)}戦</p>
        <p class="ti-rule">1本先取 ・ スキル:${arcSkillModeText(st.skillMode)} ・ ${ex ? `イナ戦 残り${A_.inaLeft(st)}回` : ashLimited(st) ? `コンティニュー 残り${A_.ashLeft(st)}回` : `コンティニュー${st.continues}回`}</p>
        <button type="button" class="link-btn" data-goto="arcade">アーケード画面へ戻る</button>`;
  }

  // ================= v1.7.0:3on3(3体どうしのチーム戦) =================
  // 準備:自分のチーム3人と武器、相手(キャラ一覧から/新しく生まれたキャラ)を選ぶ。
  // バトル:ラウンドの前に、出すキャラを選ぶ(相手も同時に選ぶ)→ 1ラウンド戦う → また選ぶ。相手を全員倒したら勝ち
  // v1.7.3:設定で4on4(モードの名前は3on3のまま)・対戦中の武器の変更・2P対戦(1台を交代で使う)
  //   2P対戦:1Pがチームを選ぶ →「2Pに渡してください」の画面 → 2Pがチームを選ぶ。ラウンドごとに
  //   「1Pの番」→ 1Pが選ぶ →「2Pの番」→ 2Pが選ぶ → 2人で戦いを見る。選ぶ画面は、選ぶ人から見た情報だけ
  //   (相手のまだ出ていないキャラの能力値・HP・武器・スキル・王は見えない)。交代の画面は、何も見えない幕
  const TT_OPT_KEY = "arenaBattle.ttOptions";
  const ttsetup = { picks: [], weapons: {}, foe: "list", size: 3, wchange: false, stage: 1, p1: null };
  try {
    const o = JSON.parse(global.localStorage.getItem(TT_OPT_KEY) || "{}");
    if (["list", "new", "2p"].includes(o.foe)) ttsetup.foe = o.foe;
    if (TB.SIZES.includes(o.size)) ttsetup.size = o.size;
    ttsetup.wchange = !!o.wchange;
  } catch (e) { /* 初期値のまま */ }
  const saveTTOpts = () => { try { global.localStorage.setItem(TT_OPT_KEY, JSON.stringify({ foe: ttsetup.foe, size: ttsetup.size, wchange: ttsetup.wchange })); } catch (e) { /* 保存できなくても動く */ } };
  let ttPickResolve = null;
  let ttCoverResolve = null;
  const ttVs = () => ttsetup.foe === "2p";
  // v1.7.1:王・休み・スキルの公開・継承・恐怖・神官を追加
  // v1.7.3:人数・休み・王のHP・2P対戦・武器の変更
  // v1.7.5:3on3ルールの整理案(ガトー承認)。「王を倒せば勝ち」「フェイズ」「控えも時間は進む」を柱に、短い文で。
  //   細かいことは後ろの「くわしく」の行(tt-rule-more)に
  function ttRules() {
    const n = ttsetup.size;
    return [
      ttVs() ? `1Pと2Pが、キャラ一覧から${n}人ずつと、それぞれの武器を選ぶ(1台を交代で使う。同じキャラを選んでもよい)` : `キャラ一覧から${n}人と、それぞれの武器を選ぶ。相手はコンピューターの${n}人`,
      `勝ち方:${n}人のうち1人が「王」(少し強い)。相手の王を倒したら勝ち、自分の王が倒れたら負け。相手の王がだれかは、終わるまで分からない`,
      "出し方:ラウンドごとに1人を選んで「決定」。相手も同時に選ぶ。一度戦ったキャラは、全員が戦い終わるまで出せない(フェイズ)。出せるのが1人なら、選ばずにそのまま戦う",
      "続くもの:HP・状態異常・下がった能力は、控えに戻ってもそのまま。化身ゲージや回復は、控えでも時間どおり進む",
      "見えるもの:相手の名前・職業・属性・調子(⤴→⤵)は最初から。武器・HP・スキル・補正・戦闘予測は、一度出てきたら。能力値と王は終わるまで秘密",
      "逆転:王がひとりになると、1人目に倒れた仲間の属性と、2人目に倒れた仲間の属性とスキルを受け継ぐ。神官がいると、フェイズが変わるたびに仲間のHPが15%回復",
      `${TB.MAX_ROUNDS}ラウンドで決着しないときは、チームの残りHPの割合で判定`,
      { more: true, text: `くわしく:王はHP+${TB.KING.hp}(職業の上限まで)・体格以外+${TB.KING.stats}。スキルは対戦の前に全員ランダムで1つずつ(援軍も出る。援軍は倒れるまで代わりに戦う)。『恐怖』はチームのだれかが持てば相手の全員に。ポイズン・燃焼は3on3では4ラウンド(出たラウンドで数える)。先攻・後攻は選ぶ画面に出る。『エリート』は、はじめて出たときにクラスチェンジ。先に全員が戦ったチームは、生きているだれでも出せる` },
      { more: true, text: ttsetup.wchange ? "その他の設定:対戦中の武器の変更 ON(選ぶ画面で、出すキャラ(ベオク)の武器を変えられる)" : `その他の設定:人数(3on3/4on4)・対戦中の武器の変更(いまはOFF)` },
    ];
  }
  // v1.7.4:3on3でキャラを選ぶとき、能力値と武器が見えるように(ガトー指示:「ステータスが見れないと選出しずらい」)
  //   能力値は1行(ラグズは化身後。化身前は title に)。武器は選んだ武器の数値と効果(アーケードは持っている武器ぜんぶ)
  function ttStatsHtml(c, stats, weaponIds) {
    const s = stats || c.stats;
    const lz = c.race === "ラグズ" && c.statsHuman;
    const cells = DB.STAT_KEYS.map((k) => `<span>${DB.STAT_LABELS[k]}<b>${s[k]}</b></span>`).join("") + `<span>体格<b>${c.stats.con}</b></span>`;
    const human = lz ? DB.STAT_KEYS.map((k) => `${DB.STAT_LABELS[k]}${c.statsHuman[k]}`).join(" ") : "";
    const ws = (weaponIds || []).map((id) => UI.charWeapon(c, id)).filter(Boolean).map((w) => `<div class="weapon-line tt-wline">${UI.weaponLine(w)}</div>`).join("");
    return `<div class="tt-stats"${lz ? ` title="化身前:${UI.esc(human)}"` : ""}>${lz ? "<em>化身後</em>" : ""}${cells}</div>${ws}`;
  }
  function renderTTSetup() {
    const chars = eligibleChars();
    const N = ttsetup.size;
    if (!ttVs()) { ttsetup.stage = 1; ttsetup.p1 = null; }
    ttsetup.picks = ttsetup.picks.filter((id) => chars.some((c) => c.id === id)).slice(0, N);
    $$("#tt-foe .bo-btn").forEach((b) => b.classList.toggle("on", b.dataset.v === ttsetup.foe));
    $$("#tt-size .bo-btn").forEach((b) => b.classList.toggle("on", Number(b.dataset.v) === N));
    $$("#tt-wchange .bo-btn").forEach((b) => b.classList.toggle("on", (b.dataset.v === "on") === ttsetup.wchange));
    // v1.7.5:「その他の設定」(人数・武器変更)は閉じていても、いまの設定が見出しに出る
    $("#tt-moreopts-now").textContent = `${N}on${N} ・ 武器変更${ttsetup.wchange ? "ON" : "OFF"}`;
    // 2Pがチームを選んでいる間は、設定を変えない(1Pの選んだ人数のまま)
    $$("#tt-foe .bo-btn, #tt-size .bo-btn, #tt-wchange .bo-btn").forEach((b) => { b.disabled = ttsetup.stage === 2; });
    const others = chars.length - ttsetup.picks.length;
    $("#tt-foe-note").textContent = ttVs()
      ? "2P対戦:1台のスマホ・iPadを交代で使います。選ぶときは「交代」の画面が出るので、相手に画面を見せないで渡してください。"
      : ttsetup.foe === "new"
        ? `相手は、ランダムに生まれた${N}人です(キャラ一覧には入りません)。`
        : `相手は、キャラ一覧から自分のチーム以外の${N}人をランダムに選びます。${others < N && ttsetup.picks.length === N ? "足りない分は、新しく生まれたキャラです。" : ""}`;
    $("#tt-rules").innerHTML = ttRules().map((t) => (typeof t === "string" ? `<li>${UI.esc(t)}</li>` : `<li class="tt-rule-more">${UI.esc(t.text)}</li>`)).join("");
    $("#tt-chars").innerHTML = chars.map((c) => {
      const n = ttsetup.picks.indexOf(c.id);
      return `<li data-id="${UI.esc(c.id)}" class="${n >= 0 ? "picked" : ""}" tabindex="0" role="checkbox" aria-checked="${n >= 0}">
        ${UI.charIcon(c, "small")}<div class="li-text"><div class="li-name">${UI.esc(c.name)}${UI.genderMark(c)}</div><div class="li-sub">${UI.esc(c.className)}</div></div>${n >= 0 ? `<b class="ts-no">${n + 1}</b>` : ""}</li>`;
    }).join("");
    const who = ttVs() ? (ttsetup.stage === 2 ? "2P" : "1P") : "";
    $("#tt-picked").innerHTML = `${who ? `<em class="tt-who">${who}</em>` : ""}選んだキャラ <b>${ttsetup.picks.length}</b> / ${N}人`;
    $("#tt-team").innerHTML = `<p class="side-label">${who ? `${who}の` : "自分の"}チーム<small>武器を選べます</small></p>` + Array.from({ length: N }, (_, i) => {
      const c = ttsetup.picks[i] && S.find(ttsetup.picks[i]);
      if (!c) return `<div class="tt-slot empty"><b class="ts-no">${i + 1}</b><span class="muted">キャラを選んでください</span></div>`;
      const w = c.weapons.includes(ttsetup.weapons[c.id]) ? ttsetup.weapons[c.id] : c.weapons[0];
      const opts = c.weapons.map((id) => { const x = UI.charWeapon(c, id); return x ? `<option value="${UI.esc(id)}" ${id === w ? "selected" : ""}>${UI.esc(x.name)}(威力${x.might}・命中${x.hit}・必殺${x.crit}・重さ${x.weight})</option>` : ""; }).join("");
      return `<div class="tt-slot"><b class="ts-no">${i + 1}</b>${UI.charIcon(c, "small")}<div class="tt-slot-body"><div class="li-name">${UI.esc(c.name)}${UI.genderMark(c)}<small>${UI.esc(c.className)}</small>${UI.elementBadge ? UI.elementBadge(c.element) : ""}</div>
        <select class="tt-weapon" data-id="${UI.esc(c.id)}" ${c.weapons.length < 2 ? "disabled" : ""} aria-label="${UI.esc(c.name)}の武器">${opts}</select>${ttStatsHtml(c, null, [w])}</div></div>`;
    }).join("");
    const ok = ttsetup.picks.length === N;
    $("#tt-start").disabled = !ok;
    $("#tt-start").textContent = ttVs() && ttsetup.stage === 1 ? "2Pに交代" : `${N}on${N}開始`;
    $("#tt-random").disabled = ok || chars.length < N;
    $("#tt-start-note").textContent = !ok ? `あと${N - ttsetup.picks.length}人選んでください。${chars.length < N ? `(キャラが${N}人以上必要です)` : ""}`
      : ttVs() && ttsetup.stage === 1 ? "次は2Pがチームを選びます。2Pに渡す前に、画面が隠れます。" : "スキルは対戦の前にランダムで決まります。";
    $("#ttsetup").classList.toggle("p2", ttsetup.stage === 2);
    $("#screen-ttsetup .screen-title").textContent = ttsetup.stage === 2 ? "3on3の準備(2Pのチーム)" : ttVs() ? "3on3の準備(1Pのチーム)" : "3on3の準備";
  }
  function toggleTT(id) {
    const i = ttsetup.picks.indexOf(id);
    if (i >= 0) ttsetup.picks.splice(i, 1);
    else if (ttsetup.picks.length < ttsetup.size) ttsetup.picks.push(id);
    renderTTSetup();
  }
  $("#tt-chars").addEventListener("click", (e) => { const li = e.target.closest("li[data-id]"); if (li) toggleTT(li.dataset.id); });
  $("#tt-chars").addEventListener("keydown", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleTT(li.dataset.id); }
  });
  $("#tt-foe").addEventListener("click", (e) => { const b = e.target.closest(".bo-btn"); if (b && !b.disabled) { ttsetup.foe = b.dataset.v; saveTTOpts(); renderTTSetup(); } });
  $("#tt-size").addEventListener("click", (e) => { const b = e.target.closest(".bo-btn"); if (b && !b.disabled) { ttsetup.size = Number(b.dataset.v); saveTTOpts(); renderTTSetup(); } });
  $("#tt-wchange").addEventListener("click", (e) => { const b = e.target.closest(".bo-btn"); if (b && !b.disabled) { ttsetup.wchange = b.dataset.v === "on"; saveTTOpts(); renderTTSetup(); } });
  $("#tt-team").addEventListener("change", (e) => { if (e.target.classList.contains("tt-weapon")) { ttsetup.weapons[e.target.dataset.id] = e.target.value; renderTTSetup(); } });
  $("#tt-random").addEventListener("click", () => {
    const rest = eligibleChars().filter((c) => !ttsetup.picks.includes(c.id));
    while (ttsetup.picks.length < ttsetup.size && rest.length) ttsetup.picks.push(rest.splice(battleRng.int(0, rest.length - 1), 1)[0].id);
    renderTTSetup();
  });
  $("#tt-clear").addEventListener("click", () => { ttsetup.picks = []; renderTTSetup(); });
  $("#tt-more").addEventListener("click", () => {
    const open = !$("#ttsetup").classList.contains("explain-open");
    $("#ttsetup").classList.toggle("explain-open", open);
    $("#tt-more").setAttribute("aria-expanded", open ? "true" : "false");
  });
  // v1.7.3:2P対戦は、1Pが選んだら幕を出して2Pに交代 → 2Pが選んだら開始
  $("#tt-start").addEventListener("click", async () => {
    if (ttVs() && ttsetup.stage === 1) {
      const chars = ttsetup.picks.map((id) => S.find(id)).filter(Boolean);
      if (chars.length !== ttsetup.size) return;
      ttsetup.p1 = { picks: ttsetup.picks.slice(), weapons: chars.map((c) => (c.weapons.includes(ttsetup.weapons[c.id]) ? ttsetup.weapons[c.id] : c.weapons[0])) };
      ttsetup.picks = [];
      ttsetup.stage = 2;
      renderTTSetup();
      window.scrollTo(0, 0);
      await ttCover("2Pの番", "1Pのチームが決まりました。画面を2Pに渡してください", "2Pがチームを選ぶ");
      return;
    }
    ttStart();
  });
  $("#btn-tt-again").addEventListener("click", () => {
    const cfg = battle.ttCfg;
    if (cfg && cfg.versus) ttStart({ ...cfg, opts: { foeWeapons: cfg.opts.foeWeapons } });
    else ttStart();
  });
  $("#btn-tt-setup").addEventListener("click", () => { ttsetup.stage = 1; ttsetup.p1 = null; goto("ttsetup"); });

  // v1.7.3:交代の幕(2P対戦)。ボタンを押すまで、うしろの画面は見えない
  function ttCover(title, sub, btn) {
    $("#tt-cover-title").textContent = title;
    $("#tt-cover-sub").textContent = sub;
    $("#tt-cover-btn").textContent = btn;
    $("#tt-cover").hidden = false;
    $("#tt-cover-btn").focus();
    return new Promise((resolve) => {
      ttCoverResolve = (ok) => { ttCoverResolve = null; $("#tt-cover").hidden = true; resolve(ok); };
    });
  }
  $("#tt-cover-btn").addEventListener("click", () => { if (ttCoverResolve) ttCoverResolve(true); });

  // ---- 画面の部品 ----
  // ttView:いま画面を見ている人。"left"(1P。コンピューター戦はずっと)/"right"(2P)/null(2P対戦で2人で見ている)
  let ttView = "left";
  const ttStatus = (u) => [u.status && u.status.name, u.sleep && "睡眠", u.paralysis && "麻痺"].filter(Boolean).join("・") || null;
  const ttKnown = (st, side, i, view = ttView) => side === view || !!st.seen[side][i];
  const ttPct = (u) => Math.max(0, Math.round((u.hp / Math.max(1, u.maxHp)) * 100));
  const ttSideName = (st, side) => (st.versus ? (side === "left" ? "1P" : "2P") : side === "left" ? "1P" : "相手");
  // v1.7.1:王の印(自分の王はいつも、相手の王は終わってから)
  const ttIsKing = (st, side, i, view = ttView) => st.king && st.king[side] === i && (side === view || st.done);
  const ttKingTitle = () => `王:HP+${TB.KING.hp}(職業の上限まで)・体格以外の能力値+${TB.KING.stats}。王が倒れたらチームの負け`;
  const ttKingTag = (st, side, i, view = ttView) => (ttIsKing(st, side, i, view) ? `<b class="tt-king" title="${ttKingTitle()}">王</b>` : "");
  // 相手から見た武器(出てきたときの武器。対戦中に変えても、次に出るまでは前の武器)
  const ttWeaponName = (st, side, i, view = ttView) => (side === view || !st.seenWeapon || !st.seenWeapon[side][i] ? st.team[side][i].weapon.name : st.seenWeapon[side][i]);
  // 上の帯:チームの3人(相手はまだ出ていないキャラは「？」)。2P対戦は2人で見るので、どちらも出てきたキャラだけ
  function ttRenderStrip(st, picks) {
    const view = st.versus ? null : "left";
    const html = (side) => st.team[side].map((u, i) => {
      const known = ttKnown(st, side, i, view) || (picks && picks[side] === i);
      const dead = u.hp <= 0, on = (picks ? picks[side] : st.active[side]) === i;
      const icon = known ? UI.charIcon(u.char, "small", { noWeapon: true }) : '<div class="char-icon small tt-q">？</div>';
      const king = ttIsKing(st, side, i, view) ? '<b class="tt-crown" aria-label="王">王</b>' : "";
      return `<div class="tt-mini${dead ? " dead" : ""}${on ? " on" : ""}" title="${UI.esc(u.name)}${known ? "" : "(まだ出ていない)"}${ttIsKing(st, side, i, view) ? "(王)" : ""}">${icon}${king}${dead ? "" : UI.bioArrow(u.bio)}<span class="tt-mhp"><i style="width:${known ? ttPct(u) : 100}%"></i></span></div>`;
    }).join("");
    $("#tt-strip").innerHTML = `<div class="tt-side" data-side="left"><small>1P</small>${html("left")}</div><div class="tt-side" data-side="right">${html("right")}<small>${ttSideName(st, "right")}</small></div>`;
  }
  // 選ぶ画面のカード。v1.7.1:属性・職業は最初から見える(相手のまだ出ていないキャラも)。
  //   自分のキャラは選ぶ(決定ボタンで決まる)、相手のキャラは選ぶと戦闘予測が出る
  // v1.7.3:相手の名前も最初から見える。回復したキャラは回復の演出(v1.7.4:休み → フェイズの「出撃済み」)
  let ttSel = { left: null, right: null };
  let ttHealLive = false;
  function ttCardHtml(st, side, i, pickable) {
    const u = st.team[side][i];
    const dead = u.hp <= 0;
    const mine = side === ttView;
    // v1.7.4:フェイズ。このフェイズにもう戦ったキャラは「出撃済み」(相手のキャラも)
    const rest = pickable && !dead && TB.isUsed(st, side, i);
    const sel = pickable && ttSel[side] === i;
    // v1.7.2:受け継いだ属性は2つ並べる。バイオリズムは全員に矢印で(⤴好調・→普通・⤵不調)
    const elem = UI.elementBadges(u.char);
    const bio = UI.bioArrow(u.bio);
    const restTag = rest ? '<span class="tt-rest" title="このフェイズはもう戦った。お互いの全員が戦うと次のフェイズで、また出せる">出撃済み</span>' : "";
    const attrs = pickable ? ` type="button" data-side="${side}" data-i="${i}"${dead || (mine && rest) ? " disabled" : ""} aria-pressed="${sel}"` : "";
    const tag = pickable ? "button" : "div";
    if (!ttKnown(st, side, i)) {
      return `<${tag} class="tt-card unknown${sel ? " sel" : ""}${rest ? " rest" : ""}"${attrs}><div class="char-icon small tt-q">？</div><div class="tt-c-body"><b>${UI.esc(u.name)}${bio}</b><small>${UI.esc(u.className)}</small>
        <span class="tt-c-skill">${elem}<span class="tt-unseen">まだ出ていない</span></span></div>${restTag}</${tag}>`;
    }
    const names = TB.skillsOf(u);
    const skill = mine || st.skillSeen[side][i] ? (names.map((n) => UI.skillChip(n, false)).join("") || '<span class="muted">スキルなし</span>') : hiddenSkillChip;
    const gauge = u.laguz ? `<span class="tt-gauge${u.laguz.transformed ? " on" : ""}">${u.laguz.transformed ? "化身中" : "化身前"} ${u.laguz.gauge}</span>` : "";
    const stat = ttStatus(u) ? `<span class="tt-st">${UI.esc(ttStatus(u))}</span>` : "";
    // v1.7.4:援軍が残っていれば、次に出たときも援軍が戦う
    const al = u.allyState && u.allyState.hp > 0 ? u.allyState : null;
    const ally = al && !dead ? `<span class="tt-ally" title="次に出たときも、援軍が代わりに戦う">援軍 ${UI.esc(al.className)} HP${al.hp}/${al.maxHp}</span>` : "";
    // v1.7.3:前のラウンドの終わり(神官・回復スキル)に回復したキャラは、HPのバーが伸びる演出(ttHealAnimate)
    const hl = ttHealLive && !dead && battle.ttHeal && battle.ttHeal[side] && battle.ttHeal[side][i];
    const pct = ttPct(u);
    const from = hl ? Math.max(0, Math.round(((u.hp - hl.amount) / Math.max(1, u.maxHp)) * 100)) : pct;
    const healPop = hl ? `<span class="tt-heal-pop" aria-label="HP${hl.amount}回復"><small>${UI.esc(hl.src)}</small>+${hl.amount}</span>` : "";
    const inner = `${UI.charIcon(u.char, "small", { noWeapon: true })}<div class="tt-c-body"><b>${ttKingTag(st, side, i)}${UI.esc(u.name)}${bio}</b><small>${elem}${UI.esc(u.className)} ・ ${UI.esc(ttWeaponName(st, side, i))}</small>
      <span class="tt-hp"><span class="tt-hpbar"><i style="width:${from}%"${hl ? ` data-to="${pct}"` : ""}></i></span><em>${Math.max(0, u.hp)}/${u.maxHp}</em></span>
      <span class="tt-c-skill">${skill}${gauge}${stat}${ally}</span>${!dead ? ttBonusHtml(u, mine) : ""}</div>${dead ? '<span class="tt-ko">撃破</span>' : restTag}${healPop}`;
    const cls = `tt-card${dead ? " dead" : ""}${st.active[side] === i ? " last" : ""}${sel ? " sel" : ""}${rest ? " rest" : ""}${hl ? " tt-healed" : ""}`;
    return `<${tag} class="${cls}"${attrs}>${inner}</${tag}>`;
  }
  // v1.7.3:回復の演出(HPのバーを、回復する前から今の長さへ伸ばす)。1ラウンドに1回だけ(選ぶ人ごと)
  function ttHealAnimate() {
    const bars = $$("#tt-pick .tt-hpbar i[data-to]");
    if (!bars.length) return;
    requestAnimationFrame(() => requestAnimationFrame(() => bars.forEach((b) => { b.style.width = b.dataset.to + "%"; })));
  }
  // v1.7.2:自分のキャラに付いている補正(属性・バイオリズム・武器・兵種・下がった能力・受け継いだ属性)。
  //   相手によって変わる分(3すくみ・属性の不利・相手のスキル)は入れない。±0以外だけ
  // v1.7.5:相手のキャラ(出てきたキャラ)にも出す。王の分は、自分のキャラだけ足す(相手の王は分からないので入れない)
  //   王:体格以外+s → 攻撃+s・防御+s・命中+3s(技×2+幸運)・回避+3s(速さ×2+幸運)・必殺(技÷2の増えた分)
  function ttKingBonus(u) {
    const s = TB.KING.stats, skl = u.stats.skl;
    return { attack: s, defense: s, hit: s * 3, avoid: s * 3, crit: Math.floor(skl / 2) - Math.floor((skl - s) / 2) };
  }
  function ttBonusHtml(u, mine = true) {
    // 比べる相手:同じ武器・属性なし・スキルなし(鳴動は相手の体格しだいなので入れない)
    const plain = { ...u, char: { ...u.char, element: null, element2: null, element3: null, element4: null }, skill: null, extraSkills: [], weapon: { ...u.weapon, weaponSkill: null }, teamFear: false,
      laguz: null, stats: { ...u.stats, con: 999 }, debuff: {}, buff: {} };
    const b = { ...B.bonusSummary(u, plain) };
    const king = mine && u.king;
    if (king) { const k = ttKingBonus(u); for (const key of Object.keys(k)) b[key] = (b[key] || 0) + k[key]; }
    const parts = [["攻撃", b.attack], ["防御", b.defense], ["命中", b.hit], ["回避", b.avoid], ["必殺", b.crit]].filter(([, v]) => v);
    const body = parts.map(([k, v]) => `<span class="${v > 0 ? "up" : "down"}">${k}<b>${UI.bonusText(v)}</b></span>`).join("") || '<span class="muted">なし</span>';
    const title = mine ? `付いている補正(属性・バイオリズム・武器など${king ? "・王" : ""}。3すくみ・相手のスキルは入らない)` : "相手に付いている補正(属性・バイオリズム・武器など。王の分は入らない。3すくみ・こちらのスキルは入らない)";
    return `<span class="tt-bonus" title="${title}"><em>補正</em>${body}</span>`;
  }
  // v1.7.3:このラウンドの先攻・後攻(選ぶ人から見て)。選んだ2人に先攻の武器・待ち伏せがあると変わる
  function ttOrderHtml(st) {
    const me = ttView, foe = me === "left" ? "right" : "left";
    const base = TB.nextFirst(st);
    const word = (side) => (side === me ? "あなたのチームが先攻" : "相手が先攻");
    // v1.7.4:いまのフェイズ(お互いの全員が戦うと次のフェイズ)
    let html = `<span class="tt-phase" title="1度戦ったキャラは、お互いの全員が戦うまで出せない">PHASE ${st.phase || 1}</span><span class="tt-order-tag ${base.side === me ? "first" : "second"}">${base.side === me ? "先攻" : "後攻"}</span>ROUND ${st.round + 1}は<b>${word(base.side)}</b>`;
    if (ttSel[me] != null && ttSel[foe] != null) {
      const p = TB.nextFirst(st, { [me]: ttSel[me], [foe]: ttSel[foe] });
      if (p.random) html += `<small>(この組み合わせは、両方に先攻の効果があるのでランダム)</small>`;
      else if (p.fixed && p.side !== base.side) html += `<small>(この組み合わせは${UI.esc(p.reason.replace(/[()]/g, ""))}で${p.side === me ? "あなたが先攻" : "相手が先攻"})</small>`;
    }
    return html;
  }
  // v1.7.1:選んだ自分のキャラと相手のキャラが戦ったときの戦闘予測(いまのHP・化身・下がった能力のまま)
  // v1.7.2:まだ戦っていない(出てきていない)相手の戦闘予測は見えない
  function ttFcHtml(st) {
    const me = ttView, foe = me === "left" ? "right" : "left";
    const l = ttSel[me], r = ttSel[foe];
    if (l == null || r == null) return `<p class="tt-fc-empty">${l == null ? "出すキャラを選んでください。" : ""}一度戦った相手のキャラを選ぶと、戦闘予測が出ます</p>`;
    if (!ttKnown(st, foe, r)) return `<p class="tt-fc-empty">まだ戦っていない相手の戦闘予測は見えません</p>`;
    // v1.7.4:援軍が残っていれば、戦うのは援軍
    const L = TB.fighterOf(st.team[me][l]), R = TB.fighterOf(st.team[foe][r]);
    const f = B.forecast(L, R);
    const form = (u) => (u.laguz ? `<span class="tt-gauge${u.laguz.transformed ? " on" : ""}">${u.laguz.transformed ? "化身中" : "化身前"}</span>` : "");
    const side = (u, c, name, hp) => `<div class="tt-fc-side"><p class="tt-fc-name"><b>${name}</b><small>HP ${hp}</small>${form(u)}</p><div class="mini-fc">${miniFcHtml(c)}</div></div>`;
    return `<p class="tt-fc-title">戦闘予測</p><div class="tt-fc-body">${side(L, f.left, UI.esc(L.name), `${L.hp}/${L.maxHp}`)}<b class="tt-fc-vs">VS</b>${side(R, f.right, UI.esc(R.name), `${R.hp}/${R.maxHp}`)}</div>`;
  }
  // v1.7.3:武器の変更(設定がONのとき。選んだ自分のキャラがベオクで、武器が2つ以上)
  function ttWeaponHtml(st) {
    const me = ttView, i = ttSel[me];
    if (!st.wchange || i == null) return "";
    const u = st.team[me][i];
    if (u.laguz || u.char.weapons.length < 2) return `<p class="tt-wc-note muted">${u.laguz ? "ラグズは武器を変えられません" : "武器は1つだけです"}</p>`;
    const cur = u.equip ? u.equip.id : u.weapon.id;
    const opts = u.char.weapons.map((id) => { const x = UI.charWeapon(u.char, id); return x ? `<option value="${UI.esc(id)}" ${id === cur ? "selected" : ""}>${UI.esc(x.name)}(威力${x.might}・命中${x.hit}・必殺${x.crit}・重さ${x.weight})</option>` : ""; }).join("");
    return `<label class="tt-wc"><span>${UI.esc(u.name)}の武器</span><select id="tt-wc-select" class="tt-weapon" aria-label="${UI.esc(u.name)}の武器を変える">${opts}</select>${u.broken ? '<small class="tt-st">壊れている</small>' : ""}</label>`;
  }
  function ttRenderPick(st, title, sub, pickable = true) {
    const me = ttView, foe = me === "left" ? "right" : "left";
    $("#tt-pick-title").textContent = title;
    $("#tt-pick-sub").textContent = sub;
    const n4 = Math.max(st.team.left.length, st.team.right.length) > 3;
    $("#tt-pick-mine").classList.toggle("n4", n4);
    $("#tt-pick-foe").classList.toggle("n4", n4);
    $("#tt-pick-mine").innerHTML = st.team[me].map((u, i) => ttCardHtml(st, me, i, pickable)).join("");
    $("#tt-pick-foe").innerHTML = st.team[foe].map((u, i) => ttCardHtml(st, foe, i, pickable)).join("");
    $("#tt-pick-mine").dataset.label = st.versus ? `${ttSideName(st, me)}(あなた)` : "";
    $("#tt-pick-foe").dataset.label = st.versus ? ttSideName(st, foe) : "";
    $("#tt-fc").hidden = !pickable;
    $("#tt-decide").hidden = !pickable;
    $("#tt-order").hidden = !pickable;
    $("#tt-wc-box").hidden = !pickable || !st.wchange;
    $("#tt-skipall").hidden = !pickable;
    if (pickable) {
      $("#tt-order").innerHTML = ttOrderHtml(st);
      $("#tt-fc").innerHTML = ttFcHtml(st);
      $("#tt-wc-box").innerHTML = ttWeaponHtml(st);
      const ok = ttSel[me] != null && TB.allowed(st, me).includes(ttSel[me]);
      $("#tt-decide").disabled = !ok;
      $("#tt-decide").textContent = ok ? `決定(${st.team[me][ttSel[me]].name})` : "決定";
    }
  }
  // 自分の出すキャラ(1人しか出せない・結果まで飛ばす のときは選ばない)
  // v1.7.3:side = 選ぶ側(2P対戦では "right" も)。前のラウンドの回復は、選ぶ画面を開いたときに演出
  function ttMyPick(st, token, side = "left") {
    const mine = TB.allowed(st, side);
    if (battle.skip) return Promise.resolve(ttAutoPick(st, side));
    // v1.7.5:出せるキャラが1人だけなら、選ぶ画面を出さずにそのまま戦う(2P対戦・回復の演出があるときも)
    if (mine.length === 1) return Promise.resolve(mine[0]);
    ttView = side;
    // v1.7.4:最初から自分のキャラ(出せるいちばん左)と相手のキャラにカーソルを合わせ、戦闘予測も出しておく。
    //   相手は、戦闘予測が見られる(一度出てきた)・このフェイズに出てこられる いちばん左のキャラ。いなければ、いちばん左の倒れていないキャラ
    const foeSide = side === "left" ? "right" : "left";
    const foeAlive = st.team[foeSide].map((u, i) => i).filter((i) => st.team[foeSide][i].hp > 0);
    const foeOk = TB.allowed(st, foeSide);
    const foeSeen = foeAlive.filter((i) => ttKnown(st, foeSide, i, side));
    const foeFirst = foeSeen.find((i) => foeOk.includes(i)) ?? foeSeen[0] ?? foeOk[0] ?? foeAlive[0];
    ttSel = { left: null, right: null };
    ttLastTap = null; // v1.8.2
    ttSel[side] = mine[0];
    ttSel[foeSide] = foeFirst == null ? null : foeFirst;
    const who = st.versus ? `${ttSideName(st, side)}が` : "";
    const sub = st.round ? "相手も同時に選びます。戦ったキャラは、お互いの全員が戦うまで出撃済み(フェイズ)。一度戦った相手を選ぶと戦闘予測" : "相手も同時に選びます。戦闘予測は、一度戦った相手だけ見られます";
    const render = () => ttRenderPick(st, `ROUND ${st.round + 1} ・ ${who}出すキャラを選ぶ`, sub);
    ttHealLive = true; // 回復の演出は、選ぶ画面を開いたときの1回だけ(カードを選んで描き直すときは出さない)
    render();
    ttHealLive = false;
    ttHealAnimate();
    $("#tt-pick").hidden = false;
    $("#tt-auto").hidden = false;
    $(".tt-box", $("#tt-pick")).scrollTop = 0;
    $("#tt-pick").scrollTop = 0;
    return new Promise((resolve) => {
      ttPickResolve = (i) => { ttPickResolve = null; ttPickRender = null; $("#tt-pick").hidden = true; resolve(token === battle.token ? i : null); };
      ttPickRender = render;
    });
  }
  // おまかせ(コンピューターと同じ選び方)。武器の変更がONなら、武器もコンピューターが選ぶ
  function ttAutoPick(st, side) {
    const i = TB.cpuPick(st, side, battleRng);
    if (st.wchange) { const w = TB.cpuWeapon(st, side, i); if (w) TB.changeWeapon(st.team[side][i], w); }
    return i;
  }
  let ttPickRender = null;
  let ttLastTap = null; // v1.8.2:ダブルタップの判定(最後に押したカードと時刻)
  $("#tt-pick").addEventListener("click", (e) => {
    if (!ttPickResolve || !battle.team) return;
    const st = battle.team;
    const me = ttView, foe = me === "left" ? "right" : "left";
    const b = e.target.closest("button.tt-card[data-i]");
    if (b && !b.disabled) {
      const side = b.dataset.side, i = Number(b.dataset.i);
      // v1.8.2:相手のキャラをもう一度押しても、カーソル(戦闘予測)を外さない(前は外れていた)
      ttSel[side] = i;
      // v1.8.2:自分のキャラをダブルタップ(すばやく2回押す)すると、そのキャラを出す(「決定」と同じ)
      const now = Date.now(), lt = ttLastTap;
      ttLastTap = { side, i, t: now };
      if (side === me && lt && lt.side === side && lt.i === i && now - lt.t < 450 && TB.allowed(st, me).includes(i)) {
        ttLastTap = null;
        ttPickResolve(i);
        return;
      }
      // v1.7.2:自分のキャラを選んだら、相手のいちばん左の(倒れていない)キャラに自動でカーソルを合わせる
      if (side === me && ttSel[foe] == null) {
        const first = st.team[foe].findIndex((u) => u.hp > 0);
        if (first >= 0) ttSel[foe] = first;
      }
      if (ttPickRender) ttPickRender();
      return;
    }
    if (e.target.closest("#tt-decide")) {
      if (ttSel[me] != null && TB.allowed(st, me).includes(ttSel[me])) ttPickResolve(ttSel[me]);
    } else if (e.target.closest("#tt-auto")) ttPickResolve(ttAutoPick(st, me));
    else if (e.target.closest("#tt-skipall")) {
      // v1.7.3:結果まで飛ばす(ここから先は、両方ともおまかせで最後まで)
      battle.skip = true;
      ttPickResolve(ttAutoPick(st, me));
    }
  });
  // v1.7.3:武器の変更(選んだ自分のキャラの武器をすぐ変える。戦闘予測・補正も変わる)
  $("#tt-pick").addEventListener("change", (e) => {
    if (e.target.id !== "tt-wc-select" || !battle.team || !ttPickResolve) return;
    const st = battle.team, me = ttView, i = ttSel[me];
    if (i == null) return;
    if (TB.changeWeapon(st.team[me][i], e.target.value)) {
      st.weaponLog = st.weaponLog || [];
      st.weaponLog.push({ side: me, i, name: st.team[me][i].weapon.name });
    }
    if (ttPickRender) ttPickRender();
  });
  // 最初のスキル抽選(自分の3人だけ回して見せる。相手は分からない)
  async function ttSkillDraw(st, token) {
    ttView = "left";
    ttRenderPick(st, "スキル抽選", "6人ともランダムで1つずつ。相手のスキルは、発動するか一度戦うと分かります".replace("6人", `${st.team.left.length + st.team.right.length}人`), false);
    $("#tt-auto").hidden = true;
    $("#tt-pick").classList.add("drawing"); // 抽選の間は選べない
    $("#tt-pick").hidden = false;
    const chips = $$("#tt-pick-mine .tt-c-skill .skill-chip");
    if (battleOpts.rouletteFx && !battle.skip) {
      chips.forEach((c) => c.classList.add("spinning"));
      await spinTT(1500, () => chips.forEach((c, i) => { c.textContent = B.drawSkill(st.team.left[i], battleRng, TB.NO_SKILLS); }), token);
      chips.forEach((c, i) => { c.classList.remove("spinning"); c.textContent = st.team.left[i].skill; c.classList.toggle("rare", isRare(st.team.left[i].skill)); flash(c, "score-pop"); });
    }
    const ok = await wait(battle.skip ? 0 : 1300, token);
    $("#tt-pick").hidden = true;
    $("#tt-pick").classList.remove("drawing");
    return ok;
  }
  function spinTT(ms, onTick, token) {
    return new Promise((resolve) => {
      const start = performance.now();
      (function tick() {
        const t = performance.now() - start;
        if (t >= ms || battle.skip || token !== battle.token) return resolve();
        onTick();
        setTimeout(tick, 50 + (t / ms) * (t / ms) * 220);
      })();
    });
  }
  // 相手のスキルが発動したら、札を「？？？」から本当の名前に
  function ttRevealSkill(e) {
    const u = e.actor === "right" ? battle.R : null;
    if (!u || !u.hideSkill || e.skill !== u.skill) return;
    u.hideSkill = false;
    const el = fighterEl("right");
    $(".skills", el).innerHTML = skillCells(u);
    $(".skill-desc", el).innerHTML = skillDescHtml(u);
  }
  // ラウンドの前の2人を画面に出す
  function ttShowFighters(L, R) {
    battle.L = L; battle.R = R;
    battle.owner = {}; // v1.7.4:前のラウンドの援軍の記録は使わない
    renderFighters(B.forecast(L, R));
    for (const [side, u] of [["left", L], ["right", R]]) {
      $(".hp-max", fighterEl(side)).textContent = u.maxHp;
      setHp(side, u.hp); setStatus(side, ttStatus(u)); setRage(side, u.rageOn); setBroken(side, u.broken);
      // v1.7.3:前のラウンドまでにエリートでクラスチェンジしていれば、その職業を出す(見出しは元の職業のままだった)
      if (u.className !== u.char.className) {
        const c = $(".char-class", fighterEl(side));
        if (c) c.innerHTML = `${UI.esc(u.className)}<small class="lv1">Lv1</small>`;
        battle.cls[side] = u.className;
      }
    }
  }
  // v1.7.3:ラウンドのあいだに回復した分(控えの回復スキル・空の祝福、ラウンドの終わりの神官)。選ぶ画面で演出する
  //   hp0:ラウンドの前のHP・最大HP / shown:戦いの画面で最後に見せたHP(戦った2人)
  // v1.7.5:そのラウンドを援軍が戦ったまま終わったか(援軍が来て、自分に戻らなかった)
  function allyEnded(events, side) {
    const sw = events.filter((e) => e.type === "swap" && e.actor === side);
    return sw.length > 0 && !sw[sw.length - 1].back;
  }
  function ttHealsOf(st, hp0, picks, shown, res) {
    const out = { left: [], right: [] };
    let any = false;
    for (const side of ["left", "right"]) {
      st.team[side].forEach((u, i) => {
        if (u.hp <= 0) return;
        // v1.7.5:援軍が戦ったまま終わったときは、戦いの画面で最後に見せたHPは援軍のもの。呼んだキャラは控えと同じく、ラウンドの前のHPと比べる
        //   (前は援軍のHPと比べていたので、呼んだキャラが回復したように見えていた)
        const fought = picks[side] === i && !allyEnded(res.events, side);
        const was = fought ? shown[side] : hp0[side][i];
        const grow = u.maxHp - (fought ? shown.max[side] : hp0.max[side][i]); // 大器晩成などで最大HPが増えた分は回復に入れない
        const amount = u.hp - was - Math.max(0, grow);
        if (amount <= 0) return;
        const priest = res.heals.some((h) => h.side === side && h.i === i);
        const sk = TB.skillsOf(u).filter((n) => n === "回復" || n === "空の祝福");
        const src = priest && sk.length && !fought ? "回復" : priest ? "神官" : sk[0] || "回復";
        out[side][i] = { amount, src };
        any = true;
      });
    }
    return any ? out : null;
  }

  // ---- 3on3の始まりから終わりまで ----
  // cfg:なし = 3on3の準備画面から / { mine, weapons, foes, opts, arc:{ stage } } = v1.7.1 アーケードの3on3(スキルは決まっている)
  // v1.7.3:cfg.versus = 2P対戦(1台を交代で使う)。cfg.wchange = 対戦中の武器の変更
  async function ttStart(cfg = null) {
    if (!cfg) {
      const N = ttsetup.size;
      if (ttVs()) {
        const p1 = ttsetup.p1;
        const mine = p1 ? p1.picks.map((id) => S.find(id)).filter(Boolean) : [];
        const foes = ttsetup.picks.map((id) => S.find(id)).filter(Boolean);
        if (mine.length !== N || foes.length !== N) { ttsetup.stage = 1; ttsetup.p1 = null; goto("ttsetup"); return; }
        cfg = { mine, weapons: p1.weapons, foes, opts: { foeWeapons: foes.map((c) => (c.weapons.includes(ttsetup.weapons[c.id]) ? ttsetup.weapons[c.id] : c.weapons[0])) }, arc: null, versus: true, wchange: ttsetup.wchange };
        ttsetup.stage = 1; ttsetup.p1 = null; ttsetup.picks = p1.picks.slice();
      } else {
        const mine = ttsetup.picks.map((id) => S.find(id)).filter(Boolean);
        if (mine.length !== N) { goto("ttsetup"); return; }
        cfg = { mine, weapons: mine.map((c) => ttsetup.weapons[c.id] || c.weapons[0]), foes: TB.pickOpponents(eligibleChars(), ttsetup.picks, ttsetup.foe, battleRng, N), opts: {}, arc: null, wchange: ttsetup.wchange };
      }
    }
    const st = TB.create(cfg.mine, cfg.weapons, cfg.foes, battleRng, cfg.opts);
    st.versus = !!cfg.versus;
    st.wchange = !!cfg.wchange;
    // 2P対戦で同じキャラを選んだときは、2Pのほうに(2P)を付けて見分ける
    if (st.versus) for (const u of st.team.right) if (st.team.left.some((x) => x.name === u.name)) u.name += "(2P)";
    st.seenWeapon = { left: [], right: [] };
    tourMatch = null; arcMatch = null;
    goto("battle");
    battle.team = st; battle.ttCfg = cfg; battle.tour = null; battle.arc = null; battle.owner = {}; battle.skip = false; battle.ttHeal = null;
    arcStatsSync(); // v1.8.2
    ttView = "left";
    const token = battle.token;
    $("#battle-log").innerHTML = "";
    $("#battle-result").hidden = true;
    $("#tt-topnext").hidden = true; // v1.7.4
    $("#btn-skip").disabled = false;
    $("#set-score").hidden = true;
    $("#round-label").textContent = "";
    $("#arena-fx").innerHTML = "";
    for (const side of ["left", "right"]) { const el = fighterEl(side); el.className = "fighter tt-empty"; el.innerHTML = '<p class="tt-wait">？</p>'; }
    $("#tt-strip").hidden = false;
    ttRenderStrip(st);
    logLine({ type: "match" }, "━━ PHASE 1 ━━");
    if (st.versus) logLine({ type: "match" }, `2P対戦(${st.team.left.length}on${st.team.right.length})。王はそれぞれの選ぶ画面で分かる。王が倒れたら負け`);
    else {
      const k = st.team.left[st.king.left];
      logLine({ type: "match" }, `王は${k.name}(HP+${k.kingHp}${k.kingHp < TB.KING.hp ? "・上限まで" : ""}・体格以外+${TB.KING.stats})。王が倒れたら負け`);
    }
    if (!cfg.arc && !st.versus && !(await ttSkillDraw(st, token))) return;
    const shown = { left: null, right: null };
    while (!st.done) {
      let picks;
      if (st.versus && !battle.skip) {
        // v1.7.3:2P対戦。幕 → 1Pが選ぶ → 幕 → 2Pが選ぶ
        // v1.7.5:出せるキャラが1人だけの側は、選ぶ画面(と交代の幕)を出さない
        const only = (side) => TB.allowed(st, side).length === 1;
        if (!only("left") && !(await ttCover("1Pの番", `ROUND ${st.round + 1}。2Pは画面を見ないでください`, "1Pが選ぶ"))) return;
        const a = await ttMyPick(st, token, "left");
        if (a == null || token !== battle.token) return;
        let b;
        if (battle.skip) b = ttAutoPick(st, "right");
        else {
          if (!only("right") && !(await ttCover("2Pの番", "画面を2Pに渡してください。1Pは画面を見ないでください", "2Pが選ぶ"))) return;
          b = await ttMyPick(st, token, "right");
        }
        if (b == null || token !== battle.token) return;
        picks = { left: a, right: b };
        ttView = null;
      } else {
        const myPick = await ttMyPick(st, token, "left");
        if (myPick == null || token !== battle.token) return;
        // v1.7.3:武器の変更がONなら、コンピューターも出すキャラの武器を選び直す
        const cp = st.versus ? ttAutoPick(st, "right") : TB.cpuPick(st, "right", battleRng);
        if (st.wchange && !st.versus) { const w = TB.cpuWeapon(st, "right", cp); if (w) TB.changeWeapon(st.team.right[cp], w); }
        picks = { left: myPick, right: cp };
      }
      // v1.7.2:ROUNDの始めに、戦う相手のスキルを見せる(前は発動するまで「？？？」)
      const hide = false;
      const roundNo = st.round + 1;
      ttRenderStrip(st, picks);
      const hp0 = { left: st.team.left.map((u) => u.hp), right: st.team.right.map((u) => u.hp), max: { left: st.team.left.map((u) => u.maxHp), right: st.team.right.map((u) => u.maxHp) } };
      const res = TB.playRound(st, picks, battleRng);
      for (const side of ["left", "right"]) st.seenWeapon[side][picks[side]] = res.before[side].weapon.name;
      res.before.right.hideSkill = hide;
      logLine({ type: "match" }, `━━ ROUND ${roundNo}:${res.before.left.name} VS ${res.before.right.name} ━━`);
      ttShowFighters(res.before.left, res.before.right);
      $("#round-label").innerHTML = `ROUND <b>${roundNo}</b>`;
      for (const side of st.versus ? ["left", "right"] : ["right"]) { const fs = TB.skillsOf(res.before[side]); logLine({ type: "skill" }, `${res.before[side].name}のスキル:${fs.length ? fs.map((n) => `『${n}』`).join("") : "なし"}`); }
      // 前のラウンドと違うキャラが出てきたら、入れ替わりの演出(ラウンド1は両方が登場)
      if (!battle.skip) {
        const fx = ["left", "right"].filter((side) => shown[side] !== picks[side]);
        for (const side of fx) {
          flash(fighterEl(side), "transform-fx");
          arenaFx(`<small>${shown[side] == null ? "登場" : "交代"}</small>${UI.esc(side === "left" ? battle.L.name : battle.R.name)}`, `fx-transform ${side}`, 1100);
          if (!(await wait(1100, token))) return;
        }
      }
      shown.left = picks.left; shown.right = picks.right;
      battle.events = res.events;
      battle.idx = 0;
      const last = await play(token, 0, false, roundNo > 1);
      if (!last || token !== battle.token) return;
      for (const side of res.ko) fighterEl(side).classList.add("tt-down");
      // v1.7.1:最後の1人が受け継ぐ・神官の回復
      // v1.7.5:1人目に倒れたキャラの属性と、2人目(最後)に倒れたキャラの属性とスキル
      for (const x of res.inherit) {
        const skills = x.skills.length ? `スキル${x.skills.map((n) => `『${n}』`).join("")}と` : "";
        const others = (x.gained || []).slice(0, -1).map((g) => `${g.name}の属性(${g.element})`).join("・");
        const all = [x.fromElement].concat(x.elements || []).filter(Boolean);
        logLine({ type: "skill" }, `${x.toName}は${others ? others + "と、" : ""}${x.fromName}の${skills}属性(${x.element})を受け継いだ!(属性は${all.join("+")}の${all.length}つに)`);
        if (!battle.skip) {
          arenaFx(`<small>継承</small>${UI.esc(x.toName)}`, `fx-transform ${x.side}`, 1300);
          if (!(await wait(1300, token))) return;
        }
      }
      const pubView = st.versus ? null : "left";
      for (const side of ["left", "right"]) {
        const hs = res.heals.filter((h) => h.side === side);
        if (hs.length) logLine({ type: "heal" }, `神官の癒し(${hs[0].priest}):${hs.map((h) => `${ttKnown(st, side, h.i, pubView) ? h.name : "？？？"} HP+${h.amount}`).join("・")}`);
      }
      // v1.7.3:回復した分は、次の選ぶ画面で演出する
      const ev = res.events.slice().reverse().find((e) => e.hp);
      const shownHp = { left: ev ? ev.hp.left : res.before.left.hp, right: ev ? ev.hp.right : res.before.right.hp, max: { left: ev && ev.maxHp ? ev.maxHp.left : res.before.left.maxHp, right: ev && ev.maxHp ? ev.maxHp.right : res.before.right.maxHp } };
      battle.ttHeal = st.done ? null : ttHealsOf(st, hp0, picks, shownHp, res);
      // v1.7.4:お互いの全員が戦ったら、次のフェイズ
      if (res.phase) {
        logLine({ type: "match" }, `━━ PHASE ${res.phase}:お互いの全員が戦ったので、また全員出せる ━━`);
        if (!battle.skip) arenaFx(`<small>NEXT</small>PHASE ${res.phase}`, "fx-match", 1200);
      }
      ttRenderStrip(st);
      if (!st.done && !(await wait(res.phase && !battle.skip ? 1300 : res.ko.length ? 900 : 500, token))) return;
    }
    ttFinish(st);
  }

  function ttFinish(st) {
    $("#btn-skip").disabled = true;
    endKo();
    $$(".fighter").forEach((f) => f.classList.remove("attacking"));
    ttView = st.versus ? null : "left";
    ttRenderStrip(st);
    const win = st.winner === "left";
    const pct = (side) => Math.round(TB.ratio(st, side) * 100);
    const left = TB.alive(st, "left").length, right = TB.alive(st, "right").length;
    const kingOf = (side) => st.team[side][st.king[side]].name;
    const why = st.judge ? `(判定:${st.endText}。残りHP ${pct("left")}% 対 ${pct("right")}%)`
      : st.kingKill ? (st.versus ? `(${win ? "2P" : "1P"}の王 ${kingOf(win ? "right" : "left")} を倒した)` : win ? `(相手の王 ${kingOf("right")} を倒した)` : `(王 ${kingOf("left")} が倒れた)`) : `(残り ${left} 対 ${right})`;
    const winName = st.versus ? (win ? "1P" : "2P") : win ? "1Pチーム" : "相手チーム";
    $("#result-text").textContent = `${st.versus ? `${winName}の勝利!` : win ? "1Pチームの勝利!" : "相手チームの勝利…"}${why}`;
    logLine({ type: "end" }, `${winName}の${st.judge ? "判定" : ""}勝利!(${st.round}ラウンド)`);
    // 終わったら、相手のチームを全部見せる(王も)。2P対戦は両方のチーム
    const rows = (side) => st.team[side].map((u, i) => {
      const s = u.stats;
      return `<li>${UI.charIcon(u.char, "small", { noWeapon: true })}<div><b>${ttKingTag(st, side, i)}${UI.esc(u.name)}</b><small>${UI.esc(u.className)} ・ ${UI.esc(u.weapon.name)}${u.char.generated ? " ・ 新しく生まれたキャラ" : ""}</small>
        <span class="tt-rv-skill">${TB.skillsOf(u).map((n) => UI.skillChip(n, false)).join("") || '<span class="muted">スキルなし</span>'}<span class="muted">HP${u.maxHp} 力${s.str} 魔力${s.mag} 技${s.skl} 速さ${s.spd} 幸運${s.lck} 守備${s.def} 魔防${s.res}</span></span></div>${u.hp <= 0 ? '<span class="tt-ko">撃破</span>' : ""}</li>`;
    }).join("");
    // v1.7.4:相手のチームの情報は、最初は閉じておく(押すと開く)
    const fold = (title, body) => `<details class="tt-rv-fold"><summary class="tt-rv-title">${title}<small>(押すと開く)</small></summary><ul class="tt-rv">${body}</ul></details>`;
    $("#tt-reveal").innerHTML = st.versus
      ? fold("1Pのチーム", rows("left")) + fold("2Pのチーム", rows("right"))
      : fold("相手のチーム", rows("right"));
    $("#btn-tt-again").textContent = st.versus ? "同じチームでもう一度(1Pと2P)" : "同じチームで次の相手と戦う";
    $$(".btn-rematch").forEach((b) => (b.hidden = true));
    $("#btn-back-prep").hidden = true;
    $("#tour-result").hidden = true;
    const cfg = battle.ttCfg || {};
    // v1.7.1:アーケードの3on3は、アーケードの結果(コンティニュー・次へ)
    if (cfg.arc) {
      $("#tt-result").hidden = true;
      $("#arc-result").hidden = false;
      $("#tt-arc-reveal").innerHTML = $("#tt-reveal").innerHTML;
      battle.arc = cfg.arc;
      const seq = arcFinished({ winner: st.winner });
      if (seq) {
        $("#battle-result").hidden = true;
        const token = battle.token;
        seq().then(() => { if (token === battle.token) { $("#battle-result").hidden = false; ttTopNext(st); } });
        return;
      }
      $("#battle-result").hidden = false;
      ttTopNext(st);
      return;
    }
    $("#tt-arc-reveal").innerHTML = "";
    $("#arc-result").hidden = true;
    $("#tt-result").hidden = false;
    $("#battle-result").hidden = false;
    ttTopNext(st);
  }
  // v1.7.4:相手のチームを倒したら(1Pの勝ち)、「次へ」を速度・結果まで飛ばすの上にも出す。押すと下の「次へ」と同じ
  //   アーケードの3on3:下の「次へ」(結果を見る)と同じ / 3on3:「同じチームで次の相手と戦う」と同じ。2P対戦は出さない
  function ttTopNext(st) {
    const box = $("#tt-topnext"), btn = $("#btn-tt-topnext");
    const arc = !$("#arc-result").hidden;
    const target = arc ? $("#btn-arc-next") : $("#btn-tt-again");
    box.hidden = st.versus || st.winner !== "left" || !target || target.hidden;
    if (box.hidden) return;
    btn.textContent = arc ? target.textContent : "次の相手と戦う";
    btn.onclick = () => target.click();
  }

  $("#btn-start").addEventListener("click", () => startBattle());
  $("#btn-skip").addEventListener("click", () => {
    battle.skip = true;
    if (BA) BA.flush(); // v1.8.0:戦闘アニメも最後まで進める
    $("#arena-fx").innerHTML = "";
    ougiEnd(); // v1.6.4
    endKo();
    if (battle.wake) battle.wake();
  });
  // v1.8.1:速度は ふつう → はやい → おそい の3つ。おそい = v1.8.0 の戦闘アニメの速さ(1秒に38コマ。ふつうは49コマ)。選んだ速度は覚えておく
  const SPEEDS = [{ v: 1, label: "ふつう" }, { v: 0.45, label: "はやい" }, { v: 54 / 38, label: "おそい" }]  // v1.8.2:ふつう 49→54コマ。おそいは v1.8.0 の38コマのまま;
  const SPEED_KEY = "arenaBattle.speed";
  function speedRender() {
    const sp = SPEEDS.find((x) => x.v === battle.speed) || SPEEDS[0];
    $("#btn-speed").textContent = `速度:${sp.label}`;
    if (BA) BA.setSpeed(battle.speed); // v1.8.0
  }
  try { let v = Number(global.localStorage.getItem(SPEED_KEY)); if (Math.abs(v - 49 / 38) < 1e-9) v = 54 / 38; /* v1.8.1 の おそい */ if (SPEEDS.some((x) => x.v === v)) battle.speed = v; } catch (e) { /* ふつうのまま */ }
  speedRender();
  $("#btn-speed").addEventListener("click", () => {
    const i = SPEEDS.findIndex((x) => x.v === battle.speed);
    battle.speed = SPEEDS[(i + 1) % SPEEDS.length].v;
    try { global.localStorage.setItem(SPEED_KEY, String(battle.speed)); } catch (e) { /* 保存できなくても動く */ }
    speedRender();
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
