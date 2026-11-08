// 画面の部品(キャラカード・マーク・バイオリズムの波など)を HTML 文字列で作る。
(function (global) {
  "use strict";
  const DB = global.GameDB;

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const MOVE = {
    歩行: { short: "歩", cls: "move-foot" },
    騎馬: { short: "騎", cls: "move-horse" },
    飛行: { short: "飛", cls: "move-fly" },
    重装: { short: "重", cls: "move-armor" },
  };
  const ELEMENT_CLASS = { 炎: "el-fire", 水: "el-water", 風: "el-wind", 雷: "el-thunder", 光: "el-light", 闇: "el-dark", 天: "el-heaven", 地: "el-earth" };
  const GENDER_MARK = { 男: '<span class="gender male" title="男">♂</span>', 女: '<span class="gender female" title="女">♀</span>' };

  // 武器の種類の表示(剣・斧…。ラグズは 獣・鳥・竜)
  function weaponTypeLabel(char, weaponId) {
    const w = DB.weapons[weaponId || char.weapons[0]];
    const cls = DB.classByName[char.className];
    if (!w) return "";
    return w.category === "laguz" && cls && cls.tribe ? cls.tribe[0] : w.categoryLabel;
  }

  // キャラのアイコン:名前の頭文字 + 右下に武器の種類(フェーズ4でドット絵に差し替える場所)
  // opts.noWeapon:右下の武器の種類を出さない(バトル準備では見出しの右に出す)
  function charIcon(char, size = "", opts = {}) {
    const light = ["#e8e8ee", "#e0b830"].includes(char.colorHex);
    const first = Array.from(char.name || "?")[0];
    const label = weaponTypeLabel(char);
    const chip = label && !opts.noWeapon ? `<span class="icon-weapon">${esc(label)}</span>` : "";
    return `<div class="char-icon ${size}" style="--c:${esc(char.colorHex)};color:${light ? "#222" : "#fff"}">${esc(first)}${chip}</div>`;
  }

  function moveBadge(moveType) {
    const m = MOVE[moveType] || { short: "?", cls: "" };
    return `<span class="badge move ${m.cls}" title="兵種:${esc(moveType)}">${m.short}</span>`;
  }

  // 属性で上がる数値(例:「攻撃+1・命中+5」)
  function elementText(element) {
    const b = DB.elementBonus[element] || {};
    return [["攻撃", b.attack], ["命中", b.hit], ["回避", b.avoid], ["防御", b.defense]].filter(([, v]) => v).map(([k, v]) => `${k}+${v}`).join("・");
  }

  function elementBadge(element) {
    return `<span class="badge element ${ELEMENT_CLASS[element] || ""}" title="属性:${esc(element)}">${esc(element)}</span>`;
  }

  // 属性アイコン + 上がる数値。v1.5.0:weakVs(相手の属性)に不利なら、補正に線を引いて「不利」と出す
  function elementChip(element, weakVs) {
    const weak = !!(weakVs && (global.Config.elementWeakTo[element] || []).includes(weakVs));
    return `<span class="element-chip${weak ? " elem-weak" : ""}"${weak ? ` title="属性不利(${esc(weakVs)}に弱い):属性の補正が無効"` : ""}>${elementBadge(element)}<span class="element-bonus">${esc(elementText(element))}</span>${weak ? '<span class="elem-weak-tag">不利</span>' : ""}</span>`;
  }

  const TRIBES = ["獣牙族", "鳥翼族", "竜鱗族"];
  // 特効注意のタグ。excludeTribe:種族(獣牙族など)のタグを出さない(バトル準備・バトル画面)
  function tagBadges(className, excludeTribe = false) {
    const cls = DB.classByName[className];
    if (!cls || !cls.effectivenessTags.length) return "";
    return cls.effectivenessTags.filter((t) => !(excludeTribe && TRIBES.includes(t))).map((t) => `<span class="badge weak" title="${esc(t)}への特効武器に弱い">特効注意:${esc(t.replace("系", ""))}</span>`).join("");
  }

  function raceBadge(char) {
    return char.race === "ラグズ" ? `<span class="badge race" title="ラグズ(化身する種族)">ラグズ</span>` : "";
  }

  // 兵種は職業データから(v1.3.0でレンジャーを歩行に変更したため、保存済みキャラにも反映)
  function moveTypeOf(char) {
    const cls = DB.classByName[char.className];
    return (cls && cls.moveType) || char.moveType;
  }

  function badges(char) {
    return `${moveBadge(moveTypeOf(char))}${raceBadge(char)}${elementChip(char.element)}${tagBadges(char.className)}`;
  }

  // 種族(ベオク・ラグズ)。名前の横に出す
  function raceChip(char) {
    const race = char.race || "ベオク";
    return `<span class="race-chip ${race === "ラグズ" ? "laguz" : "beorc"}">${race}</span>`;
  }

  // バトル準備・バトル画面の見出し:名前・性別 / 職業 / 兵種・部族 / 右にバイオリズム
  // v1.3.3:種族(ベオク・ラグズ)は顔グラ(アイコン)の下に出す(名前の長さで位置が変わらないように)
  function fighterHeader(char, opts = {}) {
    const cls = DB.classByName[char.className];
    const tribe = cls && cls.tribe ? `<span class="badge tribe" title="部族">${esc(cls.tribe)}</span>` : "";
    const elem = opts.element ? elementChip(char.element, opts.foeElement) : "";
    return `<div class="char-head fighter-head"><div class="icon-col">${charIcon(char, opts.big ? "big" : "", { noWeapon: opts.noIconWeapon })}${raceChip(char)}</div><div class="char-title">
      <div class="char-name">${esc(char.name)}${genderMark(char)}${opts.nameExtra || ""}</div>
      <div class="char-class">${esc(char.className)}${char.arcadeLv ? `<small class="lv1">Lv${char.arcadeLv}</small>` : ""}</div>
      <div class="badges">${moveBadge(moveTypeOf(char))}${tribe}${elem}${opts.hideWeak ? "" : tagBadges(char.className, true)}</div></div>
      ${opts.bio ? `<div class="head-bio">${bioWave(opts.bio)}</div>` : ""}</div>`;
  }

  // 属性+バイオリズムの補正(2文字の項目名)
  function bonusText(v) {
    return v > 0 ? `+${v}` : v < 0 ? `${v}` : "±0";
  }
  function bonusRow(b) {
    return `<div class="bonus-row" title="補正の合計(属性・バイオリズム・3すくみ・特効・武器の効果)">${[["攻撃", b.attack], ["防御", b.defense], ["命中", b.hit], ["回避", b.avoid], ["必殺", b.crit]]
      .map(([k, v]) => `<span class="${v > 0 ? "up" : v < 0 ? "down" : ""}">${k}<b>${bonusText(v)}</b></span>`).join("")}</div>`;
  }

  // v1.6.0:名前の横の印 = 性別 + アーケード達成の★(10体目まで勝ち抜くと★、EXTRAのイナを倒すと★★)
  function genderMark(char) {
    return (GENDER_MARK[char.gender] || "") + arcadeMark(char);
  }
  function arcadeMark(char) {
    const n = char && char.arcade;
    if (!n) return "";
    return `<span class="arc-mark${n >= 2 ? " arc-full" : ""}" title="${n >= 2 ? "アーケード完全制覇(EXTRAのイナを倒した)" : "アーケード達成(10体目まで勝ち抜いた)"}">${"★".repeat(Math.min(2, n))}</span>`;
  }

  // 能力値と上限。ラグズは form="human"(化身前)/"transformed"(化身後)
  function formStats(char, form) {
    const cls = DB.classByName[char.className];
    const human = char.race === "ラグズ" && char.statsHuman && form === "human";
    return {
      stats: human ? char.statsHuman : char.stats,
      max: cls ? (human ? cls.max : cls.transformedMax || cls.max) : null,
    };
  }

  // コンパクトな能力値(バトル準備用)。体格はバーなし。opts.form でラグズの化身前/後を選ぶ
  function statGrid(char, opts = {}) {
    const { stats, max: maxes } = formStats(char, opts.form || "transformed");
    const rows = DB.STAT_KEYS.map((k) => {
      const v = stats[k];
      const max = maxes ? maxes[k] : 40;
      const pct = Math.min(100, Math.round((v / max) * 100));
      return `<div class="stat${v >= max ? " capped" : ""}" data-k="${k}"><span class="stat-k">${DB.STAT_LABELS[k]}</span><span class="stat-bar"><i style="width:${pct}%"></i></span><span class="stat-v${v >= max ? " capped" : ""}">${v}</span></div>`;
    });
    rows.push(`<div class="stat"><span class="stat-k">体格</span><span></span><span class="stat-v">${char.stats.con}</span></div>`);
    if (opts.element) rows.push(`<div class="stat stat-element"><span class="stat-k">属性</span>${elementChip(char.element, opts.foeElement)}</div>`);
    return `<div class="stat-grid">${rows.join("")}</div>`;
  }

  // v1.4.5:キャラ自身の成長率ボーナス(職業の成長率との差。個人差・好きな漢字・誕生月の属性の合計)
  function growthBonus(char, k) {
    const cls = DB.classByName[char.className];
    if (!cls || !cls.growth || !char.growth) return null;
    return char.growth[k] - cls.growth[k];
  }
  function growthBonusCell(char, k) {
    const d = growthBonus(char, k);
    if (d === null) return `<td class="gbonus"></td>`;
    const cls = d > 0 ? "up" : d < 0 ? "down" : "zero";
    return `<td class="gbonus ${cls}" title="このキャラだけの成長率ボーナス(職業の成長率 ${char.growth[k] - d}% との差)">${d > 0 ? "+" + d : d < 0 ? d : "±0"}</td>`;
  }

  // 詳しい能力値の表(値・バー・上限・成長率。ラグズは化身前の値も)
  // v1.4.5:成長率の右に、キャラ自身の成長率ボーナスを表示
  function statTable(char) {
    const cls = DB.classByName[char.className];
    const laguz = char.race === "ラグズ" && char.statsHuman;
    const rows = DB.STAT_KEYS.map((k) => {
      const v = char.stats[k];
      const max = cls ? (cls.transformedMax || cls.max)[k] : 40;
      const capped = v >= max;
      const g = char.growth ? `${char.growth[k]}%` : "―";
      return `<tr class="${capped ? "capped" : ""}">
        <th>${DB.STAT_LABELS[k]}</th>
        <td class="num">${v}</td>
        <td class="bar"><div class="statbar"><div style="width:${Math.min(100, Math.round((v / max) * 100))}%"></div></div></td>
        <td class="cap">/ ${max}</td>
        ${laguz ? `<td class="human">${char.statsHuman[k]}</td>` : ""}
        <td class="growth">${g}</td>
        ${growthBonusCell(char, k)}
      </tr>`;
    }).join("");
    return `<table class="stats">
      <thead><tr><th></th><th>${laguz ? "化身" : "値"}</th><th></th><th>上限</th>${laguz ? '<th class="r">化身前</th>' : ""}<th class="r">成長率</th><th class="gbonus-h" title="このキャラだけの成長率ボーナス(職業の成長率との差)">ボーナス</th></tr></thead>
      <tbody>${rows}
        <tr><th>体格</th><td class="num">${char.stats.con}</td><td></td><td></td>${laguz ? "<td></td>" : ""}<td></td><td></td></tr>
      </tbody>
    </table>`;
  }

  function stars(w) {
    const n = DB.weaponStars(w);
    return n ? `<span class="stars" title="レア度">${"★".repeat(n)}</span>` : "";
  }

  function triMark(tri) {
    if (tri > 0) return `<span class="tri up" title="3すくみ有利(命中+10・威力+1)">▲</span>`;
    if (tri < 0) return `<span class="tri down" title="3すくみ不利(命中-10・威力-1)">▼</span>`;
    return "";
  }

  // 武器の効果の説明。v1.3.3:ラグズの武器には「化身前は威力0」を一律で付ける
  function weaponEffect(w) {
    const parts = [];
    const d = w.desc || w.effect; // v1.4.4:短い説明があればそちらを出す
    if (d) parts.push(d);
    if (w.category === "laguz") parts.push("化身前は威力0");
    return parts.join("/");
  }

  // v1.4.3:キャラの持つ武器(印があれば印の分を足したもの)
  function charWeapon(char, id) {
    return DB.withMark(DB.weapons[id], char && char.marks && char.marks[id]);
  }
  // 印の印(武器名の横)。v1.4.4:印のボーナスの中身も右に書く(例:印 威+1 必+5)
  // v1.4.5:名前を「印」→「錬成」に変更(中身は同じ)
  function markBadge(w) {
    if (!w || !w.mark) return "";
    const m = w.mark, sg = (v) => (v > 0 ? "+" + v : String(v));
    const list = [["威力", "威", m.might], ["命中", "命", m.hit], ["必殺", "必", m.crit], ["重さ", "重", m.weight]].filter(([, , v]) => v);
    const full = list.map(([k, , v]) => k + sg(v)).join("・");
    const short = list.map(([, k, v]) => k + sg(v)).join(" ");
    return `<span class="w-mark" title="錬成:${esc(full)}">錬成<span class="w-mark-d">${esc(short)}</span></span>`;
  }
  // 武器の数値。錬成(印)で変わった数値は緑で表示する(v1.4.3)
  function weaponStatCell(w, key, label, sep = "") {
    const d = w.mark ? w.mark[key] || 0 : 0;
    const v = `${label}${sep}${w[key]}`;
    return d ? `<b class="mk" title="錬成 ${d > 0 ? "+" : ""}${d}">${v}</b>` : v;
  }

  // 武器1行(バトル準備・バトル)
  function weaponLine(w, opts = {}) {
    const effect = weaponEffect(w) ? `<span class="w-effect">${esc(weaponEffect(w))}</span>` : "";
    const st = (k, l) => weaponStatCell(w, k, l);
    // v1.4.5:錬成された武器は、名前も数値と同じ緑で表示
    return `<span class="w-name">${w.mark ? `<span class="forged">${esc(w.name)}</span>` : esc(w.name)}${w.custom ? '<span class="w-custom" title="オリジナル武器">◆</span>' : ""}${stars(w)}${markBadge(w)}${triMark(opts.tri || 0)}${opts.effective ? '<span class="danger" title="相手に特効">⚠特効</span>' : ""}</span>
      <span class="w-cat">${esc(w.categoryLabel)}${w.isMagic ? "・魔" : ""}</span>
      <span class="w-stats">${st("might", "威")} ${st("hit", "命")} ${st("crit", "必")} ${st("weight", "重")}</span>${effect}`;
  }

  // 武器カード(一覧・作成結果)
  function weaponCard(w) {
    return `<div class="weapon-card">
      <div class="wc-name">${w.mark ? `<span class="forged">${esc(w.name)}</span>` : esc(w.name)} <span class="wc-type">${esc(w.categoryLabel)}${w.isMagic ? "・魔" : ""}</span>${stars(w)}${w.custom ? '<span class="w-custom" title="オリジナル武器">◆</span>' : ""}${markBadge(w)}</div>
      <div class="wc-stats">${weaponStatCell(w, "might", "威力", " ")} / ${weaponStatCell(w, "hit", "命中", " ")} / ${weaponStatCell(w, "crit", "必殺", " ")} / ${weaponStatCell(w, "weight", "重さ", " ")}</div>
      ${weaponEffect(w) ? `<div class="wc-notes">${esc(weaponEffect(w))}</div>` : ""}
    </div>`;
  }

  function weaponCards(char) {
    return `<div class="weapon-cards">${char.weapons.map((id) => {
      const w = charWeapon(char, id);
      return w ? weaponCard(w) : `<div class="weapon-card missing">不明な武器(${esc(id)})</div>`;
    }).join("")}</div>`;
  }

  function charHeader(char) {
    return `<div class="char-head">${charIcon(char)}<div class="char-title">
      <div class="char-name">${esc(char.name)}${genderMark(char)}</div>
      <div class="char-class">${esc(char.className)}</div>
      <div class="badges">${badges(char)}</div></div></div>`;
  }

  function birthText(b) {
    return `${b.slice(0, 4)}.${b.slice(4, 6)}.${b.slice(6)}`;
  }

  // キャラの詳しいカード(作成結果・一覧の詳細)
  function charCard(char, footer = "") {
    const i = char.inputs;
    const level = char.level || 20;
    return `<article class="panel char-card">
      <div class="char-head big">
        ${charIcon(char, "large")}
        <div>
          <div class="char-name">${esc(char.name)}${genderMark(char)}</div>
          <div class="char-class gold">${esc(char.className)} Lv${level}${char.race === "ラグズ" ? `<small>(化身前:${esc(DB.classByName[char.className]?.untransformedName || "")})</small>` : ""}</div>
          <div class="badges">${badges(char)}</div>
          <div class="char-meta">属性 <b>${esc(char.element)}</b>(${esc(elementText(char.element))})/ 漢字「${esc(i.kanji)}」<b>${esc(char.kanjiType)}</b> / 色 <b>${esc(i.color)}</b> / ${esc(birthText(i.birthdate))}</div>
        </div>
      </div>
      ${statTable(char)}
      ${weaponCards(char)}
      ${footer}
    </article>`;
  }

  // バイオリズムの波(好調=山、普通=中央、不調=谷に印)
  function bioText(bio) {
    if (bio.name === "普通") return "補正なし";
    const parts = [`命中・回避${bio.hit > 0 ? "+" : ""}${bio.hit}`];
    if (bio.crit) parts.push(`必殺+${bio.crit}`);
    return parts.join(" ");
  }
  function bioWave(bio) {
    const w = 110, h = 34, mid = h / 2, amp = 12;
    let d = "";
    for (let x = 0; x <= w; x += 2) {
      const y = mid - Math.sin((x / w) * Math.PI * 2) * amp;
      d += (x === 0 ? "M" : "L") + x + " " + y.toFixed(1) + " ";
    }
    const pos = { 好調: [w / 4, mid - amp], 普通: [w / 2, mid], 不調: [(w * 3) / 4, mid + amp] }[bio.name];
    const cls = { 好調: "bio-good", 普通: "bio-normal", 不調: "bio-bad" }[bio.name];
    return `<div class="bio ${cls}" title="バイオリズム:${bio.name}(${bioText(bio)})">
      <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
        <line x1="0" y1="${mid}" x2="${w}" y2="${mid}" class="bio-axis"/>
        <path d="${d}" class="bio-line"/>
        <circle cx="${pos[0]}" cy="${pos[1]}" r="4.5" class="bio-dot"/>
      </svg><span class="bio-label">${bio.name}<small>${bioText(bio)}</small></span></div>`;
  }

  function skillInfo(name) {
    return DB.skills.find((s) => s.name === name) || null;
  }

  // スキル表示(武器スキルは緑の枠。v1.5.0:右上の「武器」の札は外した)
  function skillChip(name, fromWeapon) {
    if (!name) return "";
    const s = skillInfo(name);
    return `<span class="skill-chip${fromWeapon ? " weapon-skill" : ""}${s && s.rare ? " rare" : ""}" title="${esc(s ? s.description : "")}">${esc(name)}</span>`;
  }

  // v1.4.3:兵種スキル(オレンジ色)。職業名の(男)(女)は除いて照合
  // v1.4.5:右上の「兵種」の札は外した(色で兵種スキルと分かる。説明はマウスを乗せると出る)。職業名そのままでも照合(魔道士(炎特化・男)の俊足)
  function classSkillChip(className) {
    const name = DB.classSkillOf(className);
    if (!name) return "";
    const s = skillInfo(name);
    return `<span class="skill-chip class-skill" title="兵種スキル:${esc(DB.baseClassName(className))}の${esc(name)}${s ? "(" + esc(s.description) + ")" : ""}">${esc(name)}</span>`;
  }

  global.UI = {
    charWeapon, markBadge, classSkillChip, growthBonus,
    arcadeMark, esc, charIcon, weaponTypeLabel, formStats, weaponEffect, moveBadge, moveTypeOf, raceChip, fighterHeader, bonusText, bonusRow, elementBadge, elementText, elementChip, tagBadges, badges, genderMark,
    statGrid, statTable, triMark, weaponLine, weaponCard, weaponCards, charHeader, charCard,
    bioWave, bioText, skillInfo, skillChip,
  };
})(window);
