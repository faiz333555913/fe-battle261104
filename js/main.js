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

  // ================= 画面切り替え =================
  function goto(name) {
    stopBattle();
    $$(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + name));
    $("#nav-home").hidden = name === "title";
    if (name === "list") renderList();
    if (name === "prep") renderPrep();
    window.scrollTo(0, 0);
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-goto]");
    if (t) goto(t.dataset.goto);
  });

  // ================= キャラ作成 =================
  const form = $("#create-form");
  $("#color-picker").innerHTML = C.colors.map((c, i) => `
    <label class="swatch" title="${c.name}">
      <input type="radio" name="color" value="${c.name}" ${i === 0 ? "checked" : ""}>
      <span style="--c:${c.hex}"></span><em>${c.name}</em>
    </label>`).join("");
  $("#gender-picker").innerHTML = C.genders.map((g, i) => `
    <label class="choice"><input type="radio" name="gender" value="${g}" ${i === 0 ? "checked" : ""}><span>${g === "男" ? "♂ 男" : "♀ 女"}</span></label>`).join("");
  $("#race-picker").innerHTML = C.races.map((r, i) => `
    <label class="choice"><input type="radio" name="race" value="${r.name}" ${i === 0 ? "checked" : ""}><span>${r.name}</span></label>`).join("");
  function updateRaceNote() {
    const r = C.races.find((x) => x.name === form.elements.race.value);
    $("#race-note").textContent = r ? r.note : "";
  }
  form.addEventListener("change", (e) => { if (e.target.name === "race") updateRaceNote(); });
  updateRaceNote();

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
  });
  $("#create-result").addEventListener("click", (e) => {
    if (e.target.id !== "btn-save" || !lastGenerated) return;
    const r = S.save(lastGenerated);
    e.target.disabled = true;
    e.target.textContent = "保存済み";
    $("#save-message").textContent = r === "saved" ? "保存しました。キャラ一覧・バトルで使えます。" : "このキャラはすでに保存されています。";
  });

  // ================= キャラ一覧(左:リスト / 右:詳細) =================
  let selectedId = null;
  function renderList() {
    const chars = S.list();
    if (!chars.some((c) => c.id === selectedId)) selectedId = chars.length ? chars[0].id : null;
    $("#list-count").textContent = `保存しているキャラ:${chars.length}体`;
    $("#char-list").innerHTML = chars.length
      ? chars.map((c) => {
        const w = c.weapons.map((id) => DB.weapons[id]?.name).filter(Boolean);
        return `<li data-id="${UI.esc(c.id)}" class="${c.id === selectedId ? "selected" : ""}" tabindex="0">
          ${UI.charIcon(c, "small")}
          <div class="li-text"><div class="li-name">${UI.esc(c.name)}${UI.genderMark(c)}</div>
          <div class="li-sub">${UI.esc(c.className)} / ${UI.esc(w[0] || "")}${w.length > 1 ? ` ほか${w.length - 1}本` : ""}</div></div>
        </li>`;
      }).join("")
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
    const blob = new Blob([S.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `arena-characters-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    listMessage("書き出しました(ダウンロードフォルダを確認してください)。");
  });
  $("#input-import").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const r = S.importJson(reader.result);
        listMessage(`${r.added}体を読み込みました。${r.skipped ? `(${r.skipped}体は保存済み・形式違いのためスキップ)` : ""}`);
      } catch (err) {
        listMessage("読み込みに失敗しました:ファイルの形式が正しくありません。");
      }
      e.target.value = "";
      renderList();
    };
    reader.readAsText(file);
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
    if (!chars.length) return;
    ["left", "right"].forEach((side, idx) => {
      const p = prep[side];
      if (!p || !S.find(p.charId) || isBanned(S.find(p.charId))) {
        const c = chars[Math.min(idx, chars.length - 1)];
        prep[side] = { charId: c.id, weaponId: c.weapons[0], bio: null, view: "human" };
      }
      prep[side].bio = rollBio(); // バイオリズムは対戦ごとに引き直し
    });
    renderPrepSides();
  }

  function prepUnits() {
    const l = S.find(prep.left.charId), r = S.find(prep.right.charId);
    const L = B.makeUnit(l, prep.left.weaponId, "left");
    const R = B.makeUnit(r, prep.right.weaponId, "right");
    L.bio = prep.left.bio;
    R.bio = prep.right.bio;
    return { L, R };
  }

  // 予測用のユニット:ラグズは切り替えボタンの表示(化身前/化身後)に合わせる
  function viewUnit(u, side) {
    const c = B.cloneUnit(u);
    if (c.laguz) c.laguz.transformed = prep[side].view === "transformed";
    return c;
  }

  // 化身前/化身後の切り替えボタン(ラグズのみ)
  function formToggle(side, char) {
    if (char.race !== "ラグズ" || !char.statsHuman) return "";
    const v = prep[side].view;
    return `<div class="form-toggle" role="group" aria-label="能力値の表示">
      <button type="button" class="form-btn ${v === "human" ? "on" : ""}" data-side="${side}" data-view="human" aria-pressed="${v === "human"}">化身前</button>
      <button type="button" class="form-btn ${v === "transformed" ? "on" : ""}" data-side="${side}" data-view="transformed" aria-pressed="${v === "transformed"}">化身後</button>
    </div>`;
  }

  function renderPrepSides() {
    const chars = S.list();
    const { L, R } = prepUnits();
    for (const side of ["left", "right"]) {
      const me = side === "left" ? L : R;
      const foe = side === "left" ? R : L;
      const char = me.char;
      const options = chars.map((c) => isBanned(c)
        ? `<option value="${UI.esc(c.id)}" disabled>${UI.esc(c.name)}(${UI.esc(c.className)})※出禁</option>`
        : `<option value="${UI.esc(c.id)}" ${c.id === char.id ? "selected" : ""}>${UI.esc(c.name)}(${UI.esc(c.className)})</option>`).join("");
      const weapons = char.weapons.map((id) => {
        const w = DB.weapons[id];
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
          <p class="side-label">${side === "left" ? "1P" : "2P"}</p>
          <select class="char-select" data-side="${side}">${options}</select>
          ${UI.fighterHeader(char, { bio: me.bio, hideWeak: true, noIconWeapon: true })}
          ${formToggle(side, char)}
          ${UI.statGrid(char, { element: true, form: view })}
          <h4 class="sub weapon-head">この対戦で使う武器<span class="wtype" title="武器の種類">${UI.esc(UI.weaponTypeLabel(char, me.weapon.id))}</span></h4>
          <div class="weapon-list">${weapons}</div>
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
    $$(".form-btn", panel).forEach((b) => { const on = b.dataset.view === view; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    const char = S.find(prep[side].charId);
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

  $("#prep-body").addEventListener("click", (e) => {
    const b = e.target.closest(".form-btn");
    if (b) switchView(b.dataset.side, b.dataset.view);
  });
  $("#prep-body").addEventListener("change", (e) => {
    if (e.target.matches(".char-select")) {
      const side = e.target.dataset.side;
      const c = S.find(e.target.value);
      prep[side] = { charId: c.id, weaponId: c.weapons[0], bio: rollBio(), view: "human" };
      renderPrepSides();
    } else if (e.target.matches('input[type="radio"]')) {
      const side = e.target.name.replace("weapon-", "");
      prep[side].weaponId = e.target.value;
      renderPrepSides();
    }
  });

  // 威力の表示:「12 ×2」(追撃・勇者武器で回数が増えるとき)。×2・×4 は円を描くように動く(原作風)
  function dmgText(c) {
    return `${c.damage}${c.times > 1 ? `<b class="x2"><i>×${c.times}</i></b>` : ""}`;
  }
  function skillCells(u) {
    return UI.skillChip(u.skill, false) + (u.weapon.weaponSkill ? UI.skillChip(u.weapon.weaponSkill, true) : "");
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
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function spin(durationMs, onTick) {
    return new Promise((resolve) => {
      const start = performance.now();
      (function tick() {
        const t = performance.now() - start;
        if (t >= durationMs) return resolve();
        onTick();
        const p = t / durationMs;
        setTimeout(tick, 50 + p * p * 260); // だんだん遅くなる
      })();
    });
  }

  // keepSkills:スキルはそのまま(抽選しない)
  async function roulette(L, R, first, keepSkills) {
    const ov = $("#roulette");
    const slots = { left: $('.roulette-slot[data-side="left"]', ov), right: $('.roulette-slot[data-side="right"]', ov) };
    const units = { left: L, right: R };
    for (const side of ["left", "right"]) {
      $(".r-name", slots[side]).textContent = units[side].name;
      slots[side].classList.remove("done", "first", "second", "lit", "rare");
    }
    ov.hidden = false;
    if (keepSkills) {
      $("#roulette-title").textContent = "スキル(そのまま)";
      for (const side of ["left", "right"]) {
        $(".r-skill", slots[side]).textContent = units[side].skill;
        slots[side].classList.add("done");
        slots[side].classList.toggle("rare", isRare(units[side].skill));
      }
      await sleep(800);
    } else {
      $("#roulette-title").textContent = "スキル抽選";
      // v1.3.4:回っている間も本番と同じ抽選(陽光は魔法系だけ・女神の加護はめったに出ない)
      await spin(C.rouletteMs, () => { for (const side of ["left", "right"]) $(".r-skill", slots[side]).textContent = B.drawSkill(units[side], battleRng); });
      for (const side of ["left", "right"]) {
        $(".r-skill", slots[side]).textContent = units[side].skill;
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

  async function startBattle(opts = {}) {
    const { L, R } = prepUnits();
    const keepSkills = !!(opts.keepSkills && battle.lastSkills);
    if (keepSkills) {
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
    await roulette(L, R, first, keepSkills);
    goto("battle");
    const token = battle.token;
    battle.L = L;
    battle.R = R;
    battle.lastSkills = { left: L.skill, right: R.skill };
    battle.skip = false;
    const sim = B.simulate(B.cloneUnit(L), B.cloneUnit(R), battleRng, { firstSide: first.side, firstReason: first.reason });
    battle.events = sim.events;
    battle.idx = 0;
    renderFighters(B.forecast(L, R));
    $("#battle-log").innerHTML = "";
    $("#battle-result").hidden = true;
    $("#round-label").textContent = "";
    $("#btn-skip").disabled = false;
    $$(".btn-rematch").forEach((b) => (b.disabled = false));
    play(token);
  }

  function miniFcHtml(calc) {
    return `<span data-k="damage">威力<b><em class="n">${calc.damage}</em>${calc.times > 1 ? `<b class="x2"><i>×${calc.times}</i></b>` : ""}</b></span>
      <span data-k="hit">命中<b><em class="n">${calc.hit}</em></b></span><span data-k="crit">必殺<b><em class="n">${calc.crit}</em></b></span><span data-k="as">攻速<b><em class="n">${calc.as}</em></b></span>`;
  }

  function fighterHtml(u, foe, calc, foeCalc) {
    const s = UI.skillInfo(u.skill);
    const ws = u.weapon.weaponSkill ? UI.skillInfo(u.weapon.weaponSkill) : null;
    const gauge = u.laguz
      ? `<div class="gauge"><span class="gauge-k">化身前</span><span class="gauge-bar"><i class="gauge-fill"></i></span><b class="gauge-num">${u.laguz.gauge}</b></div>`
      : `<div class="gauge placeholder" aria-hidden="true"></div>`;
    const danger = foeCalc.effective ? '<span class="danger" title="相手の武器が特効">⚠特効</span>' : "";
    // v1.3.3:特効注意のタグは出さない
    return `
      ${UI.fighterHeader(u.char, { big: true, bio: u.bio, element: true, nameExtra: danger, hideWeak: true })}
      <div class="hp"><span class="hp-num"><b class="hp-cur">${u.hp}</b> / ${u.maxHp}<span class="status-chip" hidden></span></span><span class="hp-bar"><i class="hp-fill" style="width:100%"></i></span></div>
      ${gauge}
      <div class="fighter-weapon weapon">${UI.weaponLine(u.weapon, { tri: calc.tri, effective: calc.effective })}</div>
      <div class="fighter-row"><div class="skills">${skillCells(u)}</div></div>
      <p class="skill-desc">${UI.esc(s ? s.description : "")}${ws ? `<br><span class="ws-desc">武器:${UI.esc(ws.description)}</span>` : ""}</p>
      <div class="mini-fc">${miniFcHtml(calc)}</div>
      ${UI.bonusRow(B.bonusSummary(u, foe))}
      <div class="float-layer"></div>`;
  }

  function renderFighters(f) {
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
    const u = side === "left" ? battle.L : battle.R;
    const el = fighterEl(side);
    const cur = $(".hp-cur", el);
    if (slowMs) countTo(cur, Number(cur.textContent), hp, slowMs);
    else cur.textContent = hp;
    const pct = Math.max(0, (hp / u.maxHp) * 100);
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

  function floatText(side, text, cls) {
    const layer = $(".float-layer", fighterEl(side));
    const span = document.createElement("span");
    span.className = "float " + cls;
    span.textContent = text;
    layer.appendChild(span);
    setTimeout(() => span.remove(), 1100);
  }

  function flash(el, cls) {
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

  function applyState(e, withLog = true) {
    if (withLog && !e.quiet) logLine(e);
    for (const side of ["left", "right"]) {
      setHp(side, e.hp[side]);
      setStatus(side, e.status[side]);
      setGauge(side, e.laguz[side]);
      if (e.rage) setRage(side, e.rage[side]);
      if (e.broken) setBroken(side, e.broken[side]);
    }
    // 数字が変わる様子を見せるイベント(化身・怒り/勇将・睡眠・武器破壊・咆哮など)
    const changed = ["transform", "revert", "rage", "sleep", "wake", "break", "skill"].includes(e.type);
    if (e.forecast) setMiniFc(e.forecast, changed);
    if (e.bonus) setBonus(e.bonus, changed);
  }

  // とどめ(v1.3.3):命中 → スローモーション → グレーに暗転 → HPがゆっくり0に → 「K」「.」「O」「.」
  // e:HPを0にするイベント(ここでゆっくりHPを減らす)
  async function koSequence(target, token, e) {
    const arena = $("#arena");
    const el = fighterEl(target);
    flash(arena, "hard-hit");
    arena.classList.add("slowmo");
    if (!(await wait(450, token))) { endKo(); return false; }
    arena.classList.add("ko-dim");
    if (e && e.instantKill) arena.classList.add("ss-dim"); // 瞬殺:赤黒く暗転
    el.classList.add("ko-target");
    if (e) {
      el.classList.add("hp-slow");
      for (const side of ["left", "right"]) setHp(side, e.hp[side], side === target ? 1500 : 0);
      for (const side of ["left", "right"]) { setStatus(side, e.status[side]); setGauge(side, e.laguz[side]); }
    }
    if (!(await wait(1600, token))) { endKo(); return false; }
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
    impact(e.target, e.crit);
    flash(fighterEl(e.target), e.crit ? "crit-hit" : "hit");
    if (!(await wait(160, token))) return false;
    li.textContent = `${li.textContent}${e.result}`;
    floatText(e.target, `-${e.damage}`, e.crit ? "crit" : "dmg");
    if (!(await wait(300, token))) return false;
    if (e.finishing) return koSequence(e.target, token, e); // とどめはHPをゆっくり減らす
    applyState(e, false); // ここでHPバーが減る
    return wait(e.crit ? 900 : 700, token);
  }

  // その他のイベントの演出。戻り値:次までの待ち時間(ms)
  function animate(e) {
    switch (e.type) {
      case "round":
        // v1.3.3:すべてのラウンドで同じ演出
        $("#round-label").textContent = `ROUND ${e.round}`;
        arenaFx(`ROUND ${e.round}`, "fx-round big", 1000);
        return 1000;
      case "self":
        flash(fighterEl(e.target), "hit"); floatText(e.target, `-${e.damage}`, "dmg");
        return C.strikeDelayMs;
      case "status":
        flash(fighterEl(e.target), "poison"); floatText(e.target, `-${e.damage}`, "poison");
        return 800;
      case "status-add": return 550;
      case "heal": floatText(e.target, `+${e.amount}`, "heal"); return 650;
      case "skill": {
        flash(fighterEl(e.actor), "skill");
        if (e.heal) floatText(e.actor, `+${e.heal}`, "heal");
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
          arenaFx(`<small>奥義</small>${UI.esc(e.skill)}`, `fx-ougi ${e.actor}`, C.bigEffectMs);
          return C.bigEffectMs + 100;
        }
        // v1.3.3:通常スキルもカットイン。防御は青、回復・祈りは淡い緑、それ以外(バフ系)は橙
        const kind = C.skillKinds.guard.includes(e.skill) ? "guard" : C.skillKinds.heal.includes(e.skill) ? "heal" : "buff";
        arenaFx(`<small>${e.fromWeapon ? "武器スキル" : "通常スキル"}</small>${UI.esc(e.skill)}`, `fx-skill ${kind} ${e.actor}`, C.skillEffectMs);
        return C.skillEffectMs + 100;
      }
      case "cancel": floatText(e.actor, "無効", "miss"); return 750;
      case "transform": {
        const u = e.actor === "left" ? battle.L : battle.R;
        flash(fighterEl(e.actor), "transform-fx");
        arenaFx(`<small>化身</small>${UI.esc(u.name)}`, `fx-transform ${e.actor}`, 1100);
        return 1400; // 威力・命中などの数字が変わる様子も見せる
      }
      case "revert":
        flash(fighterEl(e.actor), "revert-fx");
        floatText(e.actor, "化身解除", "revert");
        return 1000;
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
      case "gauge": return 200;
      default: return 300;
    }
  }

  async function play(token) {
    // 3, 2, 1, BATTLE!!
    for (const n of ["3", "2", "1"]) {
      arenaFx(n, "fx-count", 700);
      if (!(await wait(700, token))) return;
    }
    arenaFx("BATTLE!!", "fx-count battle", 900);
    if (!(await wait(900, token))) return;

    while (battle.idx < battle.events.length) {
      if (token !== battle.token) return;
      const e = battle.events[battle.idx++];
      if (e.type === "end") { applyState(e); return finish(e); }
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

  function finish(e) {
    $("#btn-skip").disabled = true;
    endKo();
    const text = $("#result-text");
    if (e.winner === "draw") {
      text.textContent = "引き分け";
    } else {
      const winner = e.winner === "left" ? battle.L : battle.R;
      text.textContent = `${winner.name} の勝利!`;
      fighterEl(e.winner).classList.add("winner");
      fighterEl(e.winner === "left" ? "right" : "left").classList.add("loser");
    }
    $("#battle-result").hidden = false;
  }

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
