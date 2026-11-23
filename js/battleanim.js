// v1.8.0:戦闘アニメ(設定で「戦闘アニメ」をONにしたときだけ使う)。
// 中身は「戦闘アニメ サンプル8」(samples/battle_anim/v8_weapons/tools/template.html)のアニメをそのまま持ってきて、
// ゲームの結果(命中・必殺・ダメージ・回復)どおりに動くようにしたもの。ドット絵は js/battleanim_sprites.js。
// 内部 256×168 ドット(下の48ドットが名前・HP・ATK/HIT/CRT のパネル)を、キャンバスで拡大して表示する。
// 使い方は main.js の「v1.8.0:戦闘アニメ」。外から使うのは window.BattleAnim(このファイルの最後)。
(function (global) {
'use strict';
let fast = false;   // 飛ばすとき:1コマ待ちをせずに最後まで進める
function decodeSprites(src) {
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    const frames = {};
    for (const [p, g] of Object.entries(v.frames)) frames[p] = g.map((r) => r.replace(/\{(.)(\d+)\}/g, (m, c, n) => c.repeat(+n)));
    out[k] = Object.assign({}, v, { frames });
  }
  return out;
}
const SPR = decodeSprites(global.BATTLE_ANIM_SPRITES || {});

/* ===== 基本設定 ===== */
const W = 256, H = 168, S = 3, FLOOR = 106;
const cv = document.createElement('canvas'); cv.className = 'ba-canvas';
cv.width = W * S; cv.height = H * S;
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
let camX = 0, camY = 0;
function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect((Math.round(x) + camX) * S, (Math.round(y) + camY) * S, w * S, h * S); }
function rng(seed) { return () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; }

/* ===== 背景（闘技場） ===== */
const bg = document.createElement('canvas');
bg.width = W * S; bg.height = 120 * S;
(function drawBG() {
  const b = bg.getContext('2d');
  const r = (x, y, w, h, c) => { b.fillStyle = c; b.fillRect(x * S, y * S, w * S, h * S); };
  const rand = rng(7);
  const sky = ['#1c2458', '#25306c', '#2f3e82', '#3b4f98', '#4a62ad'];
  sky.forEach((c, i) => r(0, i * 7, W, 7, c));
  for (let i = 1; i < sky.length; i++) for (let x = 0; x < W; x += 2) r(x + (i % 2), i * 7 - 1, 1, 1, sky[i]);
  r(0, 35, W, 14, '#2a2238');
  const crowd = ['#c05050', '#d8b060', '#5a7cc8', '#e0d0c0', '#6ca060', '#9a60b0', '#d08850'];
  for (let y = 36; y < 48; y += 3) for (let x = (y % 2) * 2; x < W; x += 4)
    if (rand() < 0.85) { r(x, y, 2, 1, crowd[(rand() * crowd.length) | 0]); r(x, y + 1, 2, 1, '#e8c09a'); }
  r(0, 49, W, 33, '#8c7a66'); r(0, 49, W, 2, '#b8a48a');
  for (let y = 51; y < 82; y += 5) { r(0, y + 4, W, 1, '#6c5c4c'); for (let x = ((y / 5) % 2) * 8; x < W; x += 16) r(x, y, 1, 4, '#6c5c4c'); }
  for (let ax = 8; ax < W; ax += 40) {
    r(ax, 60, 16, 22, '#2e2420'); r(ax + 2, 57, 12, 3, '#2e2420'); r(ax + 4, 55, 8, 2, '#2e2420');
    r(ax - 1, 60, 1, 22, '#b8a48a'); r(ax + 16, 60, 1, 22, '#6c5c4c');
  }
  for (let fx = 28; fx < W; fx += 40) {
    const c = fx % 80 === 28 ? '#b83a3a' : '#3a5ab8';
    r(fx, 40, 1, 12, '#3a2a20'); r(fx + 1, 41, 7, 8, c); r(fx + 1, 49, 3, 2, c); r(fx + 3, 43, 3, 3, '#e8c86a');
  }
  const sand = ['#b48c58', '#c09862', '#caa46c', '#d2ac76', '#d8b480'];
  sand.forEach((c, i) => r(0, 82 + i * 8, W, 8, c));
  r(0, 82, W, 1, '#7a5e3a');
  for (let i = 0; i < 260; i++) {
    const y = 84 + ((rand() * 36) | 0), x = (rand() * W) | 0;
    r(x, y, rand() < 0.5 ? 2 : 1, 1, rand() < 0.5 ? '#9c7848' : '#e4c494');
  }
})();

/* ===== キャラ（文字のドット絵をそのまま描く） ===== */
// pose → 絵の名前（無い絵は近いものを使う）
// 走りは run1(右足前)→run2(空中)→run3(左足前)→run4(空中) の4コマ
const POSE_ALIAS = { bash: 'thrust', aim: 'idle', shot: 'idle', kneel: 'crouch', follow: 'swing', ready: 'crouch', plunge: 'thrust', cast: 'idle', raise: 'idle', swing: 'idle', thrust: 'idle' };
function poseOf(sp, p) { while (!sp.frames[p] && POSE_ALIAS[p]) p = POSE_ALIAS[p]; return p; }
const CHARS = {
  allen:   { name: 'アレン', cls: '剣士', wpn: '鉄の剣', hp: 26, st: { hit: 84, dmg: 9, crt: 14 }, range: 30, accent: '#3a64c8', tint: '#7ab0ff', skill: '瞬速の連撃', style: 'slash' },
  shizuka: { name: 'シズカ', cls: '剣士', wpn: '細身の剣', hp: 24, st: { hit: 90, dmg: 8, crt: 18 }, range: 32, accent: '#9a50d8', tint: '#d0a0ff', skill: '紫電の五連突き', style: 'thrust' },
  soldier: { name: 'トマス', cls: 'ソルジャー', wpn: '鉄の槍', hp: 27, st: { hit: 80, dmg: 10, crt: 5 }, range: 50, accent: '#4c8c48', tint: '#9ae08a', skill: '天落の槍', style: 'lance' },
  warrior: { name: 'ボルグ', cls: '戦士', wpn: '鉄の斧', hp: 32, st: { hit: 70, dmg: 11, crt: 6 }, range: 38, accent: '#3c9a44', tint: '#e0b080', skill: '大地割り', style: 'axe' },
  archer:  { name: 'ロイド', cls: 'アーチャー', wpn: '鉄の弓', hp: 25, st: { hit: 85, dmg: 9, crt: 6 }, range: 0, accent: '#3e7a3a', tint: '#c8e890', skill: '閃光の一矢', style: 'bow' },
  thief:   { name: 'ジン', cls: 'シーフ', wpn: '鉄のナイフ', hp: 22, st: { hit: 92, dmg: 7, crt: 15 }, range: 26, accent: '#d04040', tint: '#b0b8e0', skill: '影走り', style: 'knife' },
  archer_f: { name: 'フィオ', cls: 'アーチャー', wpn: '鉄の弓', hp: 23, st: { hit: 88, dmg: 8, crt: 7 }, range: 0, accent: '#3e8a3a', tint: '#d8f0a0', skill: '閃光の一矢', style: 'bow' },
  thief_f: { name: 'ミア', cls: 'シーフ', wpn: '鉄のナイフ', hp: 21, st: { hit: 94, dmg: 6, crt: 16 }, range: 26, accent: '#d04040', tint: '#a0e0e8', skill: '影走り', style: 'knife' },
  cleric:  { name: 'セラ', cls: 'クレリック', wpn: 'ライト', hp: 19, st: { hit: 90, dmg: 8, crt: 6 }, range: 0, accent: '#4a6ad8', tint: '#fff4b0', skill: '聖光の十字', style: 'light' },
  priest:  { name: 'オルテ', cls: '神官', wpn: 'ライト', hp: 21, st: { hit: 88, dmg: 8, crt: 5 }, range: 0, accent: '#3a9a6a', tint: '#d8f8c0', skill: '聖光の十字', style: 'light' },
  armor:   { name: 'ガルド', cls: '重歩兵', wpn: '鉄の槍', hp: 30, st: { hit: 75, dmg: 12, crt: 3 }, range: 48, accent: '#3a5ab0', tint: '#c8d4f0', skill: '鉄壁突撃', style: 'armor' },
  bandit:  { name: 'ゴズ', cls: 'バンデット', wpn: '鋼の斧', hp: 31, st: { hit: 68, dmg: 12, crt: 5 }, range: 38, accent: '#c83030', tint: '#f0b080', skill: '大旋風', style: 'bandit' },
  soldier_f: { name: 'ミラ', cls: 'ソルジャー', wpn: '鉄の槍', hp: 25, st: { hit: 85, dmg: 9, crt: 8 }, range: 50, accent: '#3a6ab0', tint: '#a8c8f0', skill: '疾風の連槍', style: 'lance2' },
  mage_m:  { name: 'ユーリ', cls: '魔道士', wpn: 'エルファイアー', hp: 21, st: { hit: 85, dmg: 11, crt: 6 }, range: 0, accent: '#a83a2a', tint: '#ffb080', skill: '焦熱の流星', style: 'fire2' },
  sknight: { name: 'アルド', cls: 'ソードナイト', wpn: '鉄の剣', hp: 28, st: { hit: 82, dmg: 10, crt: 8 }, range: 34, accent: '#c03a3a', tint: '#ffb0a0', skill: '疾風の騎馬斬り', style: 'cav_sword' },
  lknight: { name: 'ハロルド', cls: 'ランスナイト', wpn: '鉄の槍', hp: 29, st: { hit: 80, dmg: 11, crt: 6 }, range: 42, accent: '#3a8a4a', tint: '#b0e8b0', skill: '怒涛の突撃', style: 'cav_lance' },
  aknight: { name: 'ダリオ', cls: 'アクスナイト', wpn: '鉄の斧', hp: 30, st: { hit: 72, dmg: 12, crt: 6 }, range: 34, accent: '#3a5ab0', tint: '#b0c0f0', skill: '黒嵐の大斧', style: 'cav_axe' },
  bknight: { name: 'エルナ', cls: 'ボウナイト', wpn: '鋼の弓', hp: 26, st: { hit: 85, dmg: 10, crt: 6 }, range: 0, accent: '#7a3cb4', tint: '#e0c8ff', skill: '光迅の一矢', style: 'cav_bow' },
  sknight_f: { name: 'ロゼ', cls: 'ソードナイト', wpn: '鉄の剣', hp: 26, st: { hit: 84, dmg: 9, crt: 9 }, range: 34, accent: '#c03a3a', tint: '#ffb0b8', skill: '疾風の騎馬斬り', style: 'cav_sword' },
  lknight_f: { name: 'マリカ', cls: 'ランスナイト', wpn: '鉄の槍', hp: 27, st: { hit: 82, dmg: 10, crt: 7 }, range: 42, accent: '#3a8a4a', tint: '#e8f0a0', skill: '怒涛の突撃', style: 'cav_lance' },
  aknight_f: { name: 'イルゼ', cls: 'アクスナイト', wpn: '鉄の斧', hp: 28, st: { hit: 74, dmg: 11, crt: 7 }, range: 34, accent: '#3a5ab0', tint: '#d0d8f0', skill: '黒嵐の大斧', style: 'cav_axe' },
  bknight_m: { name: 'テオ', cls: 'ボウナイト', wpn: '鋼の弓', hp: 28, st: { hit: 83, dmg: 11, crt: 5 }, range: 0, accent: '#7a3cb4', tint: '#e0c8ff', skill: '光迅の一矢', style: 'cav_bow' },
  ranger:  { name: 'カイ', cls: 'レンジャー', wpn: '鋼の剣', hp: 28, st: { hit: 86, dmg: 11, crt: 10 }, range: 30, accent: '#2e6a64', tint: '#a8e0d8', skill: '烈空斬', style: 'hero' },
  pegasus: { name: 'ルナ', cls: 'ペガサスナイト', wpn: '鉄の槍', hp: 23, st: { hit: 85, dmg: 9, crt: 8 }, range: 36, accent: '#3a9ab0', tint: '#c8f0ff', skill: '天翔ける槍', style: 'fly_lance' },
  dragon:  { name: 'ヴァルド', cls: 'ドラゴンナイト', wpn: '鋼の斧', hp: 32, st: { hit: 72, dmg: 13, crt: 5 }, range: 30, accent: '#b02a2a', tint: '#a8e0a8', skill: '竜墜撃', style: 'fly_axe' },
  dragon_f: { name: 'ベルナ', cls: 'ドラゴンナイト', wpn: '鋼の斧', hp: 30, st: { hit: 74, dmg: 12, crt: 6 }, range: 30, accent: '#b02a2a', tint: '#a8e0a8', skill: '竜墜撃', style: 'fly_axe' },
  cat:     { name: 'リコ', cls: '猫', wpn: '爪', hp: 24, st: { hit: 82, dmg: 3, crt: 0 }, range: 24, accent: '#e0883a', tint: '#ffd0a0', skill: '乱れ爪', style: 'laguz',
             beast: 'cat_b', bst: { hit: 92, dmg: 10, crt: 10 }, brange: 40 },
  tiger:   { name: 'ガロウ', cls: '虎', wpn: '牙', hp: 34, st: { hit: 74, dmg: 4, crt: 0 }, range: 24, accent: '#d8782a', tint: '#ffc080', skill: '猛虎咆哮撃', style: 'laguz',
             beast: 'tiger_b', bst: { hit: 82, dmg: 14, crt: 6 }, brange: 48 },
  cat_m:   { name: 'ノワ', cls: '猫', wpn: '爪', hp: 25, st: { hit: 80, dmg: 3, crt: 0 }, range: 24, accent: '#6a6a8a', tint: '#d0d4f0', skill: '乱れ爪', style: 'laguz', kin: 'cat',
             beast: 'cat_mb', bst: { hit: 90, dmg: 11, crt: 10 }, brange: 40 },
  tiger_f: { name: 'ヤエ', cls: '虎', wpn: '牙', hp: 32, st: { hit: 76, dmg: 4, crt: 0 }, range: 24, accent: '#d8782a', tint: '#ffc080', skill: '猛虎咆哮撃', style: 'laguz', kin: 'tiger',
             beast: 'tiger_fb', bst: { hit: 84, dmg: 13, crt: 6 }, brange: 48 },
  hawk:    { name: 'ソラン', cls: 'タカ', wpn: '爪', hp: 27, st: { hit: 84, dmg: 3, crt: 0 }, range: 24, accent: '#b07a40', tint: '#f0d8a8', skill: '烈風の鉤爪', style: 'laguz',
             beast: 'hawk_b', bst: { hit: 90, dmg: 11, crt: 8 }, brange: 28 },
  crow:    { name: 'ネリ', cls: 'カラス', wpn: 'くちばし', hp: 23, st: { hit: 86, dmg: 3, crt: 0 }, range: 24, accent: '#6a3a8a', tint: '#b0a8d8', skill: '黒羽の嵐', style: 'laguz',
             beast: 'crow_b', bst: { hit: 92, dmg: 9, crt: 12 }, brange: 28 },
  rdragon: { name: 'ドルガ', cls: '赤竜', wpn: 'ブレス', hp: 40, st: { hit: 76, dmg: 4, crt: 0 }, range: 24, accent: '#c0302a', tint: '#ffb0a0', skill: '紅蓮の咆哮', style: 'laguz',
             beast: 'rdragon_b', bst: { hit: 80, dmg: 16, crt: 3 }, brange: 80 },
  hawk_f:  { name: 'セイラ', cls: 'タカ', wpn: '爪', hp: 26, st: { hit: 86, dmg: 3, crt: 0 }, range: 24, accent: '#b07a40', tint: '#e0f0ff', skill: '烈風の鉤爪', style: 'laguz', kin: 'hawk',
             beast: 'hawk_b', bst: { hit: 90, dmg: 11, crt: 8 }, brange: 28 },
  crow_m:  { name: 'ヨル', cls: 'カラス', wpn: 'くちばし', hp: 24, st: { hit: 84, dmg: 3, crt: 0 }, range: 24, accent: '#6a3a8a', tint: '#b0a8d8', skill: '黒羽の嵐', style: 'laguz', kin: 'crow',
             beast: 'crow_b', bst: { hit: 90, dmg: 10, crt: 12 }, brange: 28 },
  rdragon_f: { name: 'カリナ', cls: '赤竜', wpn: 'ブレス', hp: 38, st: { hit: 78, dmg: 4, crt: 0 }, range: 24, accent: '#c0302a', tint: '#ffb0b8', skill: '紅蓮の咆哮', style: 'laguz', kin: 'rdragon',
             beast: 'rdragon_b', bst: { hit: 82, dmg: 15, crt: 3 }, brange: 80 },
  mage:    { name: 'リーネ', cls: '魔道士', wpn: 'ファイアー', hp: 20, st: { hit: 88, dmg: 10, crt: 8 }, range: 0, accent: '#c0402c', tint: '#ffa080', skill: '紅蓮の火柱', style: 'magic' },
};
function makeUnit(id, home, dir) {
  const c = CHARS[id];
  return Object.assign({ pose: 'idle', dy: 0, flash: 0, glow: 0, alpha: 1, ghosts: [] },
    c, { kind: id, base: id, home, x: home, dir, max: c.hp, disp: c.hp, st: Object.assign({}, c.st) });
}
const units = { s: null, a: null };
// 追撃（2回攻撃の2撃目）のモーションがあるキャラ
// ラグズの種類（男女で別のキャラでも、同じ種類なら同じ動き）
const kin = u => CHARS[u.base].kin || u.base;
const FOLLOW = new Set(['allen', 'shizuka', 'soldier', 'soldier_f', 'warrior', 'thief', 'thief_f', 'ranger', 'cat', 'cat_m', 'tiger', 'tiger_f', 'hawk', 'hawk_f', 'crow', 'crow_m', 'rdragon', 'rdragon_f']);
let T = 0;
const GLOW = ['#fff6a0', '#ffc040', '#ff7030'];
function drawSprite(u, x, y, alpha, opt = {}) {
  const sp = SPR[u.kind];
  let pz = opt.pose || u.pose;
  if (pz === 'idle' && sp.frames.fly1) pz = 'fly' + (((T >> 3) & 3) + 1);   // 飛ぶクラスは待機中もはばたく
  const g = sp.frames[poseOf(sp, pz)];
  const sc = opt.scale || 1, fx = sp.foot[0], fy = sp.foot[1];
  const bob = (opt.pose || u.pose) === 'idle' && !sp.frames.fly1 && (T % 48) >= 24 ? 1 : 0;
  const white = !opt.ghost && u.flash > 0 && (u.flash % 4) < 2;
  const glow = u.glow > 0 ? GLOW[((T / 3) | 0) % 3] : null;
  const tint = opt.tint;
  ctx.globalAlpha = alpha;
  for (let r = 0; r < g.length; r++) {
    const row = g[r];
    for (let i = 0; i < row.length; i++) {
      const c = row[i]; if (c === '.') continue;
      const lx = i - fx, ly = r - fy;
      const ov = u.palOv && u.palOv[u.kind];
      let col = white ? '#ffffff' : (c === 'o' && glow) ? glow : (ov && ov[c]) || sp.pal[c];
      if (tint) col = c === 'o' ? '#0c1030' : tint;
      const px = u.dir > 0 ? x + lx * sc : x - lx * sc - (sc - 1);
      R(px, y + ly * sc + (bob && ly < -12 ? sc : 0), sc, sc, col);
    }
  }
  ctx.globalAlpha = 1;
}
function drawUnit(u, x, alpha, ghost) {
  if (alpha <= 0) return;
  drawSprite(u, x, FLOOR + u.dy, alpha, { ghost, tint: ghost ? u.tint : null });
}


/* ===== 好きな色（髪・猫と虎の化身の毛なみ）=====
   ドットは髪を専用の色番号（K=暗い・H=中・h=明るい）で描いているので、表示するときにその色だけ差し替える。
   色は本体 v1.7.5 の「好きな色」10色。どの色も 暗い・中・明るい の3段を手で決めた */
const HAIR_COLORS = {
  赤: ['#5a1010', '#b02a2a', '#e05a4a'], 青: ['#14244a', '#2e5ab0', '#6a9ae8'], 緑: ['#14381e', '#2e8048', '#6ac080'],
  黄: ['#7a5418', '#e0b030', '#fff0a0'], 白: ['#6a6a80', '#d8d8e8', '#ffffff'], 黒: ['#0e0e16', '#2a2a3a', '#55556e'],
  紫: ['#2a1440', '#7040a8', '#a878d8'], 橙: ['#5a2a10', '#d8782a', '#f6b060'], 桃: ['#7a2a4a', '#e07aa8', '#ffc0dc'],
  銀: ['#4a4e5a', '#a8b0bc', '#e8ecf4'],
};
// 髪の色番号 → 段（d=暗い・m=中・l=明るい）。猫は耳・しっぽ・素足の毛も髪と同じ色。虎は黒いしまの K と t は変えない
const HAIR_KEYS = { K: 'd', H: 'm', h: 'l' };
const HAIR_KEYS_BY = {
  cat:   { K: 'd', H: 'm', h: 'l', T: 'm', t: 'd', W: 'm', w: 'd', V: 'd' },
  tiger: { H: 'm', h: 'l', T: 'm' },
  // 兜・フードで髪が隠れるキャラは、かわりに兜・フード・バンダナ・鉢巻の色を変える（ガトー指示 2026-11-23）
  warrior: { N: 'm', n: 'd' }, bandit: { R: 'm', r: 'd' }, mage_m: { N: 'm', n: 'd' }, thief: { N: 'm', n: 'd' },
  armor: { U: 'm', u: 'd', v: 'l' }, aknight: { U: 'm', u: 'd', v: 'l' }, dragon: { U: 'm', u: 'd', v: 'l' },
};
function mixHex(a, b, t) {
  const p = x => [1, 3, 5].map(i => parseInt(x.substr(i, 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
// 化身の毛なみ（猫・虎だけ）：1=明るい・2=中・3=暗い・&=いちばん暗い。猫のしま(4)も色に合わせ、虎の黒いしま(4)はそのまま
function furMap(c, kn) {
  const [d, m, l] = HAIR_COLORS[c];
  const o = { 1: l, 2: m, 3: mixHex(m, d, 0.55), '&': mixHex(d, '#000000', 0.35) };
  if (kn === 'cat') o[4] = mixHex(m, d, 0.4);
  return o;
}
function applyColor(u, c) {
  u.colorName = c; u.palOv = {};
  if (!HAIR_COLORS[c]) return;
  const [d, m, l] = HAIR_COLORS[c], R3 = { d, m, l };
  const kn = CHARS[u.base].kin || u.base;
  const keys = HAIR_KEYS_BY[kn] || HAIR_KEYS, pal = SPR[u.base].pal, ov = {};
  for (const [k, r] of Object.entries(keys)) if (pal[k]) ov[k] = R3[r];
  u.palOv[u.base] = ov;
  /* 猫・虎の化身の毛なみは今回なし（ガトー指示 2026-11-23）。furMap は試作として残す */
}

/* ===== エフェクト ===== */
const fx = [], texts = [], marks = [];
let flashA = 0, shake = 0, shakeAmp = 0, hShake = 0, darkA = 0, darkTarget = 0, cut = null;
function addPx(x, y, life, colors, vx = 0, vy = 0, size = 1, grav = 0) { fx.push({ x, y, life, max: life, colors, vx, vy, size, grav }); }
const HOT = ['#ffffff', '#fff2a0', '#ffc040', '#ff7a30', '#c03a20'];
const COOL = ['#ffffff', '#d8f4ff', '#88c8ff', '#4878d8', '#283c90'];
const DUST = ['#f0dcb0', '#d8bc88', '#b89a68', '#8c7050'];
const ROCK = ['#a08060', '#a08060', '#806448', '#5e4a36'];

async function slashArc(cx, cy, dir, r, big, a0 = -125, a1 = 45) {
  const steps = 6;
  for (let s = 0; s < steps; s++) {
    const from = a0 + (a1 - a0) * s / steps, to = a0 + (a1 - a0) * (s + 1) / steps;
    const st = to > from ? 3 : -3;
    for (let a = from; st > 0 ? a < to : a > to; a += st) {
      const rad = a * Math.PI / 180;
      for (let k = 0; k < (big ? 4 : 3); k++) addPx(cx + dir * Math.cos(rad) * (r - k), cy + Math.sin(rad) * (r - k), 10 + k * 2, big ? HOT : COOL);
    }
    await frame();
  }
}
// 斧の振り下ろしの軌跡（上から前下へ）
async function chopArc(cx, cy, dir, r, big) {
  const a0 = -150, a1 = 30, steps = 4;
  for (let s = 0; s < steps; s++) {
    const from = a0 + (a1 - a0) * s / steps, to = a0 + (a1 - a0) * (s + 1) / steps;
    for (let a = from; a < to; a += 2.5) {
      const rad = a * Math.PI / 180;
      for (let k = 0; k < (big ? 6 : 4); k++) addPx(cx + dir * Math.cos(rad) * (r - k), cy + Math.sin(rad) * (r - k), 9 + k * 2, big ? HOT : ['#ffffff', '#fff0d0', '#e8c890', '#b08850']);
    }
    await frame();
  }
}
function spark(x, y, big) {
  const n = big ? 18 : 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, sp = (big ? 2.6 : 1.6) * (0.7 + Math.random() * 0.5);
    addPx(x, y, big ? 16 : 11, HOT, Math.cos(a) * sp, Math.sin(a) * sp, big ? 2 : 1);
  }
  for (let i = 0; i < 6; i++) addPx(x + (Math.random() * 6 - 3), y + (Math.random() * 6 - 3), 8, HOT, 0, 0, 2);
}
function dust(x, n, spread) {
  for (let i = 0; i < n; i++) {
    const s = Math.random() < 0.5 ? -1 : 1;
    addPx(x + s * Math.random() * 4, FLOOR - 1 - Math.random() * 3, 18 + (Math.random() * 10 | 0), DUST, s * (0.5 + Math.random() * spread), -Math.random() * 0.8, 2);
  }
}
function rocks(x, n) {
  for (let i = 0; i < n; i++) {
    const s = Math.random() < 0.5 ? -1 : 1;
    addPx(x + s * Math.random() * 10, FLOOR - 2, 30, ROCK, s * (0.6 + Math.random() * 2.2), -(2.2 + Math.random() * 2.6), 2, 0.28);
  }
}
function popText(str, x, y, color, size = 11) { texts.push({ str, x, y, color, size, life: 46, t: 0 }); }

/* ===== コルーチン ===== */
let waiters = [];
const frame = () => fast ? (update(), Promise.resolve()) : new Promise(r => waiters.push(r));
async function wait(n) { for (let i = 0; i < n; i++) await frame(); }

function update() {
  T++;
  for (const u of Object.values(units)) {
    if (u.flash > 0) u.flash--;
    if (u.glow > 0) { u.glow--; if (T % 2 === 0) addPx(u.x + (Math.random() * 24 - 12), FLOOR + u.dy - 2 - Math.random() * 30, 14, HOT, 0, -0.8); }
    // HPの数字：減るたびに一瞬大きくなって赤くなる（減っているあいだは赤のまま、止まると白へ戻る）
    if (u.hpPop > 0) u.hpPop--;
    if (u.disp > u.hp && u.hpFast) { u.hpRed = 16; u.disp = Math.max(u.hp, u.disp - Math.max(1, Math.ceil((u.disp - u.hp) / 5))); u.hpPop = 8; if (u.disp === u.hp) u.hpFast = false; }
    else if (u.disp > u.hp) { u.hpRed = 16; if (T % 3 === 0) { u.disp--; u.hpPop = u.hpPop > 0 ? 5 : 8; } }
    else if (u.hpRed > 0) u.hpRed--;
    u.ghosts.forEach(g => g.a -= 0.05); u.ghosts = u.ghosts.filter(g => g.a > 0);
    if (u.pose !== u._lp) { u.prevPose = u._lp; u._lp = u.pose; }        // ひとつ前のポーズ（奥義の連撃で使う）
    if (u.sleep > 0) { u.sleep--; if (u.sleep % 18 === 0) popText('Z', u.x + 8 - (u.sleep % 36 ? 0 : 4), FLOOR + u.dy - 40, '#c8d8ff', 8); }
  }
  if (ougiBg) ougiBg.t++;
  for (let i = frameTimers.length - 1; i >= 0; i--) if (--frameTimers[i].n <= 0) { const f = frameTimers[i].f; frameTimers.splice(i, 1); f(); }
  for (const p of fx) {
    p.x += p.vx; p.y += p.vy; p.vy += p.grav;
    if (p.grav) { if (p.y > FLOOR) { p.y = FLOOR; p.vy *= -0.3; p.vx *= 0.5; } }
    else { p.vx *= 0.9; p.vy *= 0.9; }
    p.life--;
  }
  for (let i = fx.length - 1; i >= 0; i--) if (fx[i].life <= 0) fx.splice(i, 1);
  for (const t of texts) { t.t++; t.life--; }
  for (let i = texts.length - 1; i >= 0; i--) if (texts[i].life <= 0) texts.splice(i, 1);
  for (const m of marks) m.life--;
  for (let i = marks.length - 1; i >= 0; i--) if (marks[i].life <= 0) marks.splice(i, 1);
  if (flashA > 0) flashA = Math.max(0, flashA - 0.1);
  darkA += (darkTarget - darkA) * 0.15;
  if (shake > 0) shake--;
  if (hShake > 0) hShake--;
  if (cut) cut.t++;
}

function draw() {
  camX = shake > 0 ? ((shake % 2) ? 1 : -1) * shakeAmp : 0;
  camY = shake > 0 ? ((shake % 4) < 2 ? 1 : 0) * Math.ceil(shakeAmp / 2) : 0;
  // 必殺を受けた瞬間：画面を横だけに大きく揺らす（だんだん小さく）
  if (hShake > 0) { camX = ((hShake % 4) < 2 ? 1 : -1) * Math.ceil(6 * hShake / 16); camY = 0; }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(bg, camX * S, camY * S);
  if (darkA > 0.01) { ctx.fillStyle = `rgba(10,6,30,${darkA})`; ctx.fillRect(0, 0, cv.width, 120 * S); }
  if (ougiBg) drawOugiBg();
  if (darkA > 0.3 && !ougiBg) for (let i = 0; i < 14; i++) R(((i * 53 + T * 11) % W), (i * 37 + T * 5) % 116, 10 + (i % 3) * 6, 1, 'rgba(255,230,150,0.35)');
  // 地割れ・斬撃の跡
  for (const m of marks) {
    ctx.globalAlpha = Math.min(1, m.life / 20);
    if (m.k === 'crack') for (const [x, y, c] of m.px) R(x, y, 1, 1, c);
    if (m.k === 'x') for (const [x, y, c] of m.px) R(x, y, 1, 1, c);
    ctx.globalAlpha = 1;
  }
  for (const u of Object.values(units)) for (const g of u.ghosts) drawSprite(u, g.x, FLOOR + g.dy, g.a * u.alpha, { ghost: true, pose: g.pose, tint: u.tint });
  const order = Object.values(units).sort((a, b) => (a.front ? 1 : 0) - (b.front ? 1 : 0));
  for (const u of order) drawUnit(u, u.x, u.alpha);
  for (const f of projs) f();
  for (const p of fx) {
    const k = Math.min(p.colors.length - 1, Math.floor((1 - p.life / p.max) * p.colors.length));
    R(p.x, p.y, p.size, p.size, p.colors[k]);
  }
  camX = 0; camY = 0;
  if (cut) drawCutIn();
  drawHUD();
  for (const t of texts) {
    const rise = Math.min(t.t, 10), bounce = t.t < 6 ? -Math.round(Math.sin(t.t / 6 * Math.PI) * 3) : 0;
    ctx.globalAlpha = t.life < 10 ? t.life / 10 : 1;
    ctx.font = `bold ${t.size * S}px "Arial Black","Hiragino Kaku Gothic ProN","Meiryo",sans-serif`;
    ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = S * 2; ctx.strokeStyle = '#180c10';
    const x = t.x * S, y = (t.y - rise + bounce) * S;
    ctx.strokeText(t.str, x, y); ctx.fillStyle = t.color; ctx.fillText(t.str, x, y);
    ctx.globalAlpha = 1;
  }
  if (flashA > 0) { ctx.fillStyle = `rgba(255,255,255,${flashA})`; ctx.fillRect(0, 0, cv.width, cv.height); }
}

/* ----- 必殺のカットイン：帯がすべり込み、キャラを2倍で大きく見せる ----- */
function drawCutIn() {
  const u = cut.u, t = cut.t, n = cut.len;
  const open = Math.min(1, t / 6), close = t > n - 6 ? (n - t) / 6 : 1;
  const h = Math.round(44 * Math.min(open, close));
  if (h <= 0) return;
  const y0 = 58 - (h >> 1);
  R(0, y0, W, h, cut.bg || '#0a0c24');
  R(0, y0, W, 1, '#e8c86a'); R(0, y0 + h - 1, W, 1, '#e8c86a');
  // 流れる線（攻撃側の向きと逆へ流れる）
  for (let i = 0; i < 18; i++) {
    const yy = y0 + 2 + ((i * 7) % Math.max(1, h - 4));
    const xx = ((i * 41 - t * 9 * u.dir) % (W + 40) + W + 40) % (W + 40) - 20;
    R(xx, yy, 8 + (i % 4) * 5, 1, i % 3 ? (cut.band || '#2a3a80') : (cut.accent || u.accent));
  }
  // キャラ（2倍・上半身）
  ctx.save();
  ctx.beginPath(); ctx.rect(0, (y0 + 1) * S, W * S, (h - 2) * S); ctx.clip();
  const slide = Math.max(0, 14 - t) * 6;
  const cx = (u.dir > 0 ? 70 - slide : 186 + slide) + (SPR[u.kind].cutx || 0) * u.dir;
  const saveDir = u.dir, saveFlash = u.flash; u.flash = 0;
  drawSprite(u, cx, 58 + 52 + (SPR[u.kind].cut || 0) * 2, 1, { scale: 2, pose: cut.pose });
  u.dir = saveDir; u.flash = saveFlash;
  ctx.restore();
  // 技名
  if (t > 8 && h > 30) {
    ctx.font = `bold ${13 * S}px "Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif`;
    ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = S * 2; ctx.strokeStyle = '#180c10';
    const tx = (u.dir > 0 ? 170 : 86) * S, ty = 56 * S;
    const title = cut.title || u.skill, sub = cut.sub || '必殺の一撃';
    ctx.strokeText(title, tx, ty); ctx.fillStyle = cut.color || '#ffe070'; ctx.fillText(title, tx, ty);
    ctx.font = `bold ${7 * S}px "Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif`;
    ctx.strokeText(sub, tx, ty + 12 * S); ctx.fillStyle = '#ffffff'; ctx.fillText(sub, tx, ty + 12 * S);
  }
}

/* ----- 下部パネル ----- */
function txt(str, x, y, size, color, align = 'left', maxW) {
  ctx.font = `bold ${size * S}px "Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif`;
  ctx.textAlign = align; ctx.fillStyle = '#05060f';
  const mw = maxW ? maxW * S : undefined;
  ctx.fillText(str, x * S + S, y * S + S, mw);
  ctx.fillStyle = color; ctx.fillText(str, x * S, y * S, mw);
}
function panel(u, x0) {
  R(x0, 120, 128, 48, '#0e1636');
  R(x0, 120, 128, 1, '#d8cca0'); R(x0, 167, 128, 1, '#d8cca0'); R(x0, 120, 1, 48, '#d8cca0'); R(x0 + 127, 120, 1, 48, '#d8cca0');
  R(x0 + 2, 122, 124, 1, u.accent); R(x0 + 2, 165, 124, 1, u.accent);
  txt(u.name, x0 + 6, 132, 8, '#ffffff', 'left', 84);
  txt(`${u.cls}／${u.wpn}`, x0 + 6, 142, 6, '#b8c4ff', 'left', 84);
  txt('HP', x0 + 6, 160, 7, '#f0d060');
  const pop = u.hpPop > 0 ? u.hpPop : 0, red = (u.hpRed || 0) / 16;
  txt(String(Math.max(0, u.disp)), x0 + 23, 160 + Math.round(pop * 0.25), 9 + pop * 0.5, red > 0 ? mixHex('#ffffff', '#ff3a30', Math.min(1, red * 1.5)) : '#ffffff', 'center');
  const gx = x0 + 32, gy = 153;
  // v1.8.0:HPが60より多いときは、1目盛りを2以上にして2段に収める
  const per = Math.max(1, Math.ceil(u.max / 60)), ticks = Math.ceil(u.max / per);
  const dispT = Math.ceil(u.disp / per), hpT = Math.ceil(u.hp / per);
  for (let i = 0; i < ticks; i++) {
    const on = i < dispT, lost = i >= hpT && i < dispT;
    // 光沢のある淡い緑：上の1ドットは白に近いハイライト、まん中は淡い緑、下は少し濃い緑（減った分は赤、空は暗い色）
    const bx = gx + (i % 30) * 2, by = gy + ((i / 30) | 0) * 4;
    const c3 = on ? (lost ? ['#ffb0a0', '#ff6050', '#c03a30'] : ['#f0fff4', '#a8f0c0', '#62c88a']) : ['#2e2826', '#3a2a28', '#3a2a28'];
    for (let k = 0; k < 3; k++) R(bx, by + k, 1, 1, c3[k]);
    // すき間も少し暗い同じ色でうめて、1本のつやのあるバーに見せる（目盛りの線は濃い緑で見えるように）
    const nxt = i + 1 < ticks && (i % 30) < 29, on2 = i + 1 < dispT, lost2 = i + 1 >= hpT && i + 1 < dispT;
    if (nxt) { const g3 = on && on2 ? (lost || lost2 ? ['#d87060', '#b83228', '#7a1a14'] : ['#a8d8b4', '#4ea870', '#2e7a4e']) : ['#241e1e', '#2e2424', '#2e2424'];
      for (let k = 0; k < 3; k++) R(bx + 1, by + k, 1, 1, g3[k]); }
  }
  // 威力・命中・必殺は英大文字3文字で（ATK・HIT・CRT）
  [['ATK', u.st.dmg], ['HIT', u.st.hit], ['CRT', u.st.crt]].forEach(([k, v], i) => {
    txt(k, x0 + 94, 133 + i * 11, 6, '#9ab0e8'); txt(String(v), x0 + 123, 133 + i * 11, 6, '#ffffff', 'right');
  });
}
function drawHUD() { panel(units.s, 0); panel(units.a, 128); }

/* ===== 動き ===== */
async function moveTo(u, tx, speed, run = true) {
  while (u.x !== tx) {
    const d = tx - u.x; u.x += Math.sign(d) * Math.min(speed, Math.abs(d));
    if (run) u.pose = 'run' + (((T >> 2) & 3) + 1);
    await frame();
  }
}
async function hopTo(u, tx, n = 12, hgt = 6) {
  const sx = u.x; u.pose = 'idle';
  for (let i = 1; i <= n; i++) { u.x = Math.round(sx + (tx - sx) * i / n); u.dy = -Math.round(Math.sin(i / n * Math.PI) * hgt); await frame(); }
  u.dy = 0; u.x = tx;
}
async function cutIn(u, pose, opt = {}) {
  cut = Object.assign({ u, t: 0, len: 46, pose }, opt);
  flashA = 0.5;
  await wait(46); cut = null;
}

// 命中・回避の処理（共通）
async function resolve(a, d, o, impX, impY) {
  // 奥義：当たる瞬間を奥義の演出に置きかえる（1回だけ）
  if (o.ougi && OUGI_HIT[o.ougi] && !o._ougiDone) { o._ougiDone = true; return OUGI_HIT[o.ougi](a, d, o, impX, impY); }
  return resolve0(a, d, o, impX, impY);
}
async function resolve0(a, d, o, impX, impY) {
  // v1.8.0:ゲームの結果の記録(o.q)を1つずつ使う。命中・必殺・ダメージ・HPはゲームの計算のまま
  let rec = null;
  if (o.q) {
    rec = o.q.length ? o.q.shift() : { hit: false, none: true };
    if (rec.none) return;
    o = Object.assign({}, o, { hit: rec.hit, crit: !!rec.crit });
  }
  if (rec && rec.guarded) {   // 女神の加護:弾かれて0
    spark(impX, impY, false); d.flash = 6;
    popText('0', d.x, FLOOR - 42, '#a8d8ff', 11);
    await wait(8);
    return;
  }
  if (o.hit) {
    const dmg = rec ? rec.damage : (o.crit ? o.dmg * 3 : o.dmg);
    d.hp = rec ? Math.max(0, rec.hpAfter) : Math.max(0, d.hp - dmg);
    d.pose = 'hurt'; d.flash = o.crit ? 18 : 10;
    spark(impX, impY, o.crit);
    shake = o.shake || (o.crit ? 18 : 7); shakeAmp = o.amp || (o.crit ? 3 : 1);
    if (o.crit) { flashA = 0.9; hShake = 16; shake = 0; d.hpFast = true; }   // 必殺：横揺れ＋HPがぎゅーんと減る
    popText(String(dmg), d.x + (o.numDx || 0), FLOOR - 42 + (o.numDy || 0), o.numCol || (o.crit ? '#ffd040' : '#ffffff'), o.crit || o.numCol ? 15 : 11);
    const kb = o.kb !== undefined ? o.kb : (o.crit ? 10 : 3);
    const away = Math.sign(d.x - a.x) || -d.dir;   // 攻撃した側から離れる向きへ飛ぶ
    for (let i = 0; i < kb; i++) { d.x += away; if (o.crit && i < 5) d.dy = -Math.round(Math.sin(i / 5 * Math.PI) * 4); await frame(); }
    d.dy = 0;
  } else {
    // 回避：残像を残して後ろへ跳ぶ
    d.pose = 'dodge';
    popText('MISS', d.x - d.dir * 6, FLOOR - 44, '#a8d8ff', 9);
    for (let i = 0; i < 7; i++) { d.ghosts.push({ x: d.x, dy: d.dy, a: 0.5, pose: 'dodge' }); d.x -= d.dir * 3; d.dy = -Math.round(Math.sin(i / 6 * Math.PI) * 4); await frame(); }
    d.dy = 0;
  }
}
async function finish(a, d) {
  if (d.hp <= 0) {
    for (let i = 0; i < 40; i++) {
      d.flash = (i % 6 < 3) ? 2 : 0; d.alpha = 1 - i / 40;
      if (i % 3 === 0) addPx(d.x + (Math.random() * 16 - 8), FLOOR - Math.random() * 34, 18, COOL, 0, -0.6, 2);
      await frame();
    }
    d.alpha = 0;
  }
  const ret = d.hp > 0 ? (async () => { d.pose = 'idle'; await wait(6); await moveTo(d, d.home, 2, false); })() : null;
  await hopTo(a, a.home);
  if (ret) await ret;
  a.pose = 'idle'; a.front = false;
  await wait(12);
}

/* ----- 剣士 ----- */
async function swordAttack(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * a.range, 4);
  a.pose = 'raise'; await wait(9);
  a.pose = 'swing';
  slashArc(a.x + a.dir * 9, FLOOR - 18, a.dir, 18, false);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 5, FLOOR - 20);
  if (o.two && d.hp > 0) await swordFollow(a, d, o.two);
  await wait(10); await wait(14);
  await finish(a, d);
}
// 追撃（アレン）：振り下ろした剣を下段で返し、踏み込みながら下から斬り上げる
async function swordFollow(a, d, o) {
  a.pose = 'low'; await wait(7);
  for (let i = 0; i < 3; i++) { a.x += a.dir * 2; await frame(); }
  a.pose = 'upcut';
  slashArc(a.x + a.dir * 9, FLOOR - 20, a.dir, 19, false, 60, -115);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 5, FLOOR - 24);
}
// 必殺「瞬速の連撃」：消えるような踏み込み → 相手の後ろへ抜ける → 一拍おいて × の斬撃
async function swordCrit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 48, 4);
  a.pose = 'raise'; a.glow = 60; darkTarget = 0.65;
  await cutIn(a, 'raise');
  await wait(10);
  // 3回切り抜ける（往復）
  const passes = [d.x + a.dir * 26, d.x - a.dir * 24, d.x + a.dir * 30];
  for (let p = 0; p < passes.length; p++) {
    const tx = passes[p], dir = Math.sign(tx - a.x);
    a.dir = dir; a.pose = 'swing';
    while (a.x !== tx) {
      a.ghosts.push({ x: a.x, dy: 0, a: 0.55, pose: 'swing' });
      a.x += dir * Math.min(12, Math.abs(tx - a.x));
      for (let k = 0; k < 6; k++) addPx(a.x - dir * k * 2, FLOOR - 18 + (k % 3) - 1, 6, COOL);
      await frame();
    }
    // 切り抜けた瞬間：相手に細い光
    for (let k = -12; k <= 12; k++) addPx(d.x + k, FLOOR - 20 - k * (p % 2 ? 0.8 : -0.8), 10, HOT);
    d.flash = 4; shake = 4; shakeAmp = 1;
    await wait(4);
  }
  // 背中を向けて静止（ため） → ×の傷が光り、まとめてダメージ
  a.dir = d.x > a.x ? 1 : -1; a.dir = -a.dir;   // 相手に背を向ける
  a.pose = 'idle'; await wait(16);
  a.dir = d.x > a.x ? 1 : -1;
  const xp = [];
  for (let k = -14; k <= 14; k++) { xp.push([d.x + k, FLOOR - 20 + k, '#ffffff']); xp.push([d.x + k, FLOOR - 20 - k, '#ffffff']); xp.push([d.x + k + 1, FLOOR - 20 + k, '#ffe070']); xp.push([d.x + k + 1, FLOOR - 20 - k, '#ffe070']); }
  marks.push({ k: 'x', px: xp, life: 30 });
  await resolve(a, d, o, d.x, FLOOR - 20);
  darkTarget = 0;
  await wait(18);
  // 元の向きに戻って帰る
  a.dir = a.home < units[a === units.s ? 'a' : 's'].home ? 1 : -1;
  if (d.hp <= 0) { a.dir = a.home < d.home ? 1 : -1; }
  await finishSword(a, d);
}
async function finishSword(a, d) {
  if (d.hp <= 0) {
    for (let i = 0; i < 40; i++) {
      d.flash = (i % 6 < 3) ? 2 : 0; d.alpha = 1 - i / 40;
      if (i % 3 === 0) addPx(d.x + (Math.random() * 16 - 8), FLOOR - Math.random() * 34, 18, COOL, 0, -0.6, 2);
      await frame();
    }
    d.alpha = 0;
  }
  const ret = d.hp > 0 ? (async () => { d.pose = 'idle'; await wait(6); await moveTo(d, d.home, 2, false); })() : null;
  // 相手の後ろにいるので、飛び越えて戻る
  a.dir = a.home < d.home ? 1 : -1;
  await hopTo(a, a.home, 20, 22);
  if (ret) await ret;
  a.pose = 'idle'; a.front = false;
  await wait(12);
}

/* ----- 女剣士 ----- */
// 光の突きの線（手元から前へ）
function thrustLine(x0, x1, y, hot) {
  const d = Math.sign(x1 - x0) || 1;
  for (let x = x0; x !== x1; x += d) { addPx(x, y, 8, hot ? HOT : ['#ffffff', '#f0dcff', '#c8a0ff', '#8a50d0']); }
}
// 通常攻撃：腰をためて鋭く突く
async function thrustAttack(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * a.range, 4);
  a.pose = 'crouch'; await wait(8);
  a.pose = 'thrust';
  for (let i = 0; i < 3; i++) { a.x += a.dir * 2; await frame(); }
  thrustLine(a.x + a.dir * 20, d.x + a.dir * 8, FLOOR - 21, false);
  await resolve(a, d, o, d.x + d.dir * 5, FLOOR - 21);
  if (o.two && d.hp > 0) await thrustFollow(a, d, o.two);
  await wait(20);
  await finish(a, d);
}
// 追撃（シズカ）：突いた剣を素早く引き上げ、踏み込みながら袈裟に斬り下ろす
async function thrustFollow(a, d, o) {
  a.pose = 'crouch'; await wait(3);
  a.pose = 'raise'; await wait(6);
  for (let i = 0; i < 3; i++) { a.x += a.dir * 2; await frame(); }
  a.pose = 'swing';
  slashArc(a.x + a.dir * 9, FLOOR - 18, a.dir, 18, false);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 5, FLOOR - 20);
}
// 必殺「紫電の五連突き」：踏み込んで5回の連続突き → 下がってため → 相手を貫いて後ろへ抜ける
async function thrustCrit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 48, 4);
  a.pose = 'crouch'; a.glow = 80; darkTarget = 0.65;
  await cutIn(a, 'thrust');
  await wait(6);
  const near = d.x - a.dir * 26;
  a.pose = 'run1';
  while (a.x !== near) { a.ghosts.push({ x: a.x, dy: 0, a: 0.5, pose: 'thrust' }); a.x += Math.sign(near - a.x) * Math.min(8, Math.abs(near - a.x)); a.pose = 'thrust'; await frame(); }
  const ys = [-22, -16, -25, -19, -21];
  for (let p = 0; p < 5; p++) {
    a.pose = 'crouch'; a.x -= a.dir * 2; await wait(2);
    a.pose = 'thrust'; a.x += a.dir * 2;
    a.ghosts.push({ x: a.x - a.dir * 3, dy: 0, a: 0.45, pose: 'thrust' });
    thrustLine(a.x + a.dir * 20, d.x + a.dir * 6, FLOOR + ys[p], true);
    spark(d.x + d.dir * 4, FLOOR + ys[p], false);
    d.flash = 3; shake = 3; shakeAmp = 1;
    await wait(4);
  }
  // 一度下がってため → 一気に貫く
  a.pose = 'crouch';
  for (let i = 0; i < 6; i++) { a.x -= a.dir; await frame(); }
  await wait(10);
  const tx = d.x + a.dir * 30;
  a.pose = 'thrust';
  while (a.x !== tx) {
    a.ghosts.push({ x: a.x, dy: 0, a: 0.55, pose: 'thrust' });
    a.x += a.dir * Math.min(12, Math.abs(tx - a.x));
    for (let k = 0; k < 8; k++) addPx(a.x - a.dir * k * 2, FLOOR - 21 + (k % 3) - 1, 7, ['#ffffff', '#f0dcff', '#c8a0ff', '#8a50d0']);
    await frame();
  }
  const xp = [];
  for (let k = -22; k <= 22; k++) { xp.push([d.x + k, FLOOR - 21, '#ffffff']); xp.push([d.x + k, FLOOR - 20, '#d8b0ff']); }
  marks.push({ k: 'x', px: xp, life: 26 });
  await wait(8);
  await resolve(a, d, o, d.x, FLOOR - 21);
  darkTarget = 0;
  await wait(18);
  await finishSword(a, d);
}

/* ----- ソルジャー（槍） ----- */
// 通常攻撃：槍を引いてため → 踏み込んで突く
async function lanceAttack(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * a.range, 4);
  a.pose = 'ready'; await wait(9);
  a.pose = 'thrust';
  for (let i = 0; i < 3; i++) { a.x += a.dir * 2; await frame(); }
  thrustLine(a.x + a.dir * 34, d.x + a.dir * 6, FLOOR - 20, false);
  await resolve(a, d, o, d.x + d.dir * 5, FLOOR - 20);
  if (o.two && d.hp > 0) await lanceFollow(a, d, o.two);
  await wait(20);
  await finish(a, d);
}
// 追撃（ソルジャー男）：突いた槍を頭上へ振り上げ、踏み込んで穂先を叩きつける打ち下ろし
async function lanceFollow(a, d, o) {
  for (let i = 0; i < 3; i++) { a.x -= a.dir * 2; await frame(); }
  a.pose = 'lift'; await wait(8);
  for (let i = 0; i < 3; i++) { a.x += a.dir * 2; await frame(); }
  a.pose = 'smash';
  chopArc(a.x + a.dir * 10, FLOOR - 28, a.dir, 30, false);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 26);
  dust(d.x, 4, 1);
}
// 必殺「天落の槍」：かがんでため → 高く跳ぶ → 真上から槍ごと落ちて貫く（光の柱）
async function lanceCrit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 56, 4);
  a.pose = 'crouch'; a.glow = 80; darkTarget = 0.65;
  await cutIn(a, 'thrust');
  dust(a.x, 10, 1);
  await wait(6);
  // 跳躍：画面の上まで
  a.pose = 'crouch';
  const sx = a.x, tx = d.x - a.dir * 24, n = 16;
  for (let i = 1; i <= n; i++) {
    a.x = Math.round(sx + (tx - sx) * i / n);
    a.dy = -Math.round(Math.sin(i / n * Math.PI / 2) * 50);
    if (i % 2) a.ghosts.push({ x: a.x, dy: a.dy, a: 0.4, pose: 'crouch' });
    await frame();
  }
  // 頂点で一瞬止まり、穂先が光る
  a.pose = 'plunge';
  for (let i = 0; i < 10; i++) { if (i % 2 === 0) addPx(a.x + a.dir * 14, FLOOR + a.dy - 2, 10, HOT, 0, 0, 2); await frame(); }
  // 急降下
  const top = a.dy;
  for (let i = 1; i <= 5; i++) {
    a.dy = Math.round(top * (1 - i / 5));
    a.ghosts.push({ x: a.x, dy: a.dy, a: 0.45, pose: 'plunge' });
    for (let k = 0; k < 4; k++) addPx(a.x + a.dir * (8 + k), FLOOR + a.dy - 30 - k * 3, 9, HOT);
    await frame();
  }
  a.dy = 0;
  // 光の柱と土けむり
  for (let y = 0; y < 100; y += 2) { addPx(d.x - 1, FLOOR - y, 16, HOT, 0, 0, 2); if (y % 6 === 0) addPx(d.x + 2, FLOOR - y, 12, ['#ffffff', '#fff2a0'], 0, 0, 1); }
  rocks(d.x, 10); dust(d.x, 22, 2.2);
  await resolve(a, d, o, d.x, FLOOR - 16);
  darkTarget = 0;
  await wait(24);
  await finish(a, d);
}

/* ----- 戦士（斧） ----- */
async function axeAttack(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * a.range, 3);
  a.pose = 'raise';
  for (let i = 0; i < 4; i++) { a.dy = -i; await frame(); }
  await wait(10);
  a.dy = 0; a.pose = 'swing';
  chopArc(a.x + a.dir * 6, FLOOR - 22, a.dir, 24, false);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 18);
  a.pose = 'follow'; dust(a.x + a.dir * 18, 8, 1.2); shake = Math.max(shake, 4);
  if (o.two && d.hp > 0) await axeFollow(a, d, o.two);
  await wait(22);
  await finish(a, d);
}
// 追撃（戦士）：振り抜いた斧の勢いを止めずに返し、踏み込みながら下から斜めに斬り上げる
async function axeFollow(a, d, o) {
  await wait(6);
  for (let i = 0; i < 3; i++) { a.x += a.dir * 2; await frame(); }
  a.pose = 'upswing';
  slashArc(a.x + a.dir * 8, FLOOR - 20, a.dir, 24, false, 70, -100);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 26);
}
// 必殺「大地割り」：ため → 高く跳ぶ → 真上から叩きつけ、地面が割れて岩が飛ぶ
async function axeCrit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 56, 3);
  a.pose = 'crouch'; a.glow = 70; darkTarget = 0.65;
  await cutIn(a, 'raise');
  dust(a.x, 10, 1);
  await wait(8);
  a.pose = 'raise';
  const sx = a.x, tx = d.x - a.dir * 34, n = 20;
  for (let i = 1; i <= n; i++) {
    a.x = Math.round(sx + (tx - sx) * i / n);
    a.dy = -Math.round(Math.sin(i / n * Math.PI * 0.62) * 52);
    if (i % 2) a.ghosts.push({ x: a.x, dy: a.dy, a: 0.4, pose: 'raise' });
    await frame();
  }
  await wait(6);
  a.pose = 'swing';
  const top = a.dy;
  for (let i = 1; i <= 5; i++) { a.dy = Math.round(top * (1 - i / 5)); if (i % 2) a.ghosts.push({ x: a.x, dy: a.dy, a: 0.35, pose: 'swing' }); await frame(); }
  a.dy = 0; a.pose = 'follow';
  const cx = a.x + a.dir * 20, px = [];
  for (const s of [-1, 1]) {
    let y = 0, x = 0;
    for (let k = 0; k < 34; k++) { x += s; if (Math.random() < 0.4) y += Math.random() < 0.5 ? -1 : 1; y = Math.max(-1, Math.min(4, y)); px.push([cx + x, FLOOR + 1 + y, '#3a2614']); px.push([cx + x, FLOOR + 2 + y, '#ffd070']); }
  }
  marks.push({ k: 'crack', px, life: 60 });
  rocks(cx, 22); dust(cx, 26, 2.4);
  shake = 16; shakeAmp = 3;
  await resolve(a, d, o, d.x + d.dir * 2, FLOOR - 16);
  darkTarget = 0;
  await wait(26);
  await finish(a, d);
}

/* ----- 魔道士（魔道書） ----- */
const FIRE = ['#ffffff', '#fff2a0', '#ffc040', '#ff7a30', '#c03a20', '#5a1a10'];
function fireBurst(x, y, n, sp) {
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random() * 0.8);
    addPx(x, y, 14 + (Math.random() * 10 | 0), FIRE, Math.cos(ang) * v, Math.sin(ang) * v - 0.4, 2);
  }
}
// 通常攻撃：その場で本を開いて詠唱 → 火の玉が飛ぶ
async function magicAttack(a, d, o) {
  a.front = true;
  await moveTo(a, a.x + a.dir * 10, 2);
  a.pose = 'cast'; a.glow = 20;
  // 本の前に火が集まる
  const bx = a.x + a.dir * 17, by = FLOOR - 24;
  for (let i = 0; i < 14; i++) {
    const ang = Math.random() * Math.PI * 2, r = 12;
    addPx(bx + Math.cos(ang) * r, by + Math.sin(ang) * r, 8, FIRE, -Math.cos(ang) * 1.4, -Math.sin(ang) * 1.4, 1);
    await frame();
  }
  // 火の玉（3×3）が飛ぶ。外れたら相手の後ろまで抜ける
  let x = bx;
  const end = o.hit ? d.x + d.dir * 4 : d.x - a.dir * -40;
  let dodged = false;
  while ((end - x) * a.dir > 0) {
    x += a.dir * 6;
    for (let k = 0; k < 4; k++) addPx(x - a.dir * k * 2 + (Math.random() * 2 - 1), by + (Math.random() * 3 - 1.5), 10, FIRE, 0, -0.2, 2);
    addPx(x, by - 1, 4, ['#ffffff'], 0, 0, 3);
    if (!o.hit && !dodged && Math.abs(x - d.x) < 26) { dodged = true; resolve(a, d, o, 0, 0); }
    await frame();
  }
  if (o.hit) { fireBurst(d.x + d.dir * 4, by + 2, 26, 2); await resolve(a, d, o, d.x + d.dir * 4, by + 2); }
  else await wait(8);
  a.pose = 'idle';
  await wait(20);
  await finish(a, d);
}
// 必殺「紅蓮の火柱」：本を高く掲げる → 相手の足元に魔法陣 → 巨大な火柱
async function magicCrit(a, d, o) {
  a.front = true;
  await moveTo(a, a.x + a.dir * 10, 2);
  a.pose = 'raise'; a.glow = 110; darkTarget = 0.7;
  await cutIn(a, 'raise');
  // 魔法陣（足元の楕円が広がる）
  const ring = [];
  for (let t = 0; t < 18; t++) {
    const r = Math.min(22, 4 + t * 1.5);
    for (let k = 0; k < 40; k++) { const ang = k / 40 * Math.PI * 2; addPx(d.x + Math.cos(ang) * r, FLOOR + 1 + Math.sin(ang) * r * 0.25, 3, ['#ffe070', '#ff9040']); }
    if (t % 3 === 0) addPx(a.x + a.dir * 6, FLOOR - 40, 10, FIRE, 0, -0.5, 2);
    await frame();
  }
  // 火柱
  shake = 30; shakeAmp = 2;
  for (let t = 0; t < 34; t++) {
    const w = Math.min(14, t * 2);
    const hgt = Math.min(100, t * 9);
    for (let k = 0; k < 16; k++) {
      const yy = Math.random() * hgt, ww = w * (1 - yy / 140);
      addPx(d.x + (Math.random() * 2 - 1) * ww, FLOOR - yy, 8 + (Math.random() * 8 | 0), FIRE, 0, -1.2, 2);
    }
    for (let k = 0; k < 3; k++) addPx(d.x + (Math.random() * 2 - 1) * 3, FLOOR - Math.random() * hgt, 6, ['#ffffff', '#fff2a0'], 0, -1, 2);
    if (t === 10) { flashA = 0.8; }
    if (t === 12) resolve(a, d, o, d.x, FLOOR - 24);
    await frame();
  }
  await wait(10);
  darkTarget = 0;
  a.pose = 'idle';
  await wait(18);
  await finish(a, d);
}

/* ----- アーチャー（弓） ----- */
const ARROW_COOL = ['#ffffff', '#fff6d0', '#e8d090', '#b09050'];
function drawArrowFx(x, y, dir, hot) {
  // 飛んでいる矢：柄と矢じり（1コマだけ残る点で描く）
  for (let k = 0; k < 10; k++) addPx(x - dir * k, y, 2, k < 2 ? ['#f4f8ff'] : ['#a07848']);
  addPx(x - dir * 9, y - 1, 2, ['#d03a3a']); addPx(x - dir * 9, y + 1, 2, ['#7a1e22']);
  if (hot) for (let k = 0; k < 6; k++) addPx(x - dir * (10 + k * 3), y + (Math.random() * 2 - 1), 10, HOT, 0, 0, 2);
}
async function bowAttack(a, d, o) {
  a.front = true;
  a.pose = 'aim'; await wait(14);
  a.pose = 'shot';
  const y = FLOOR - 21;
  let x = a.x + a.dir * 20;
  const end = o.hit ? d.x + d.dir * 4 : d.x + a.dir * 60;
  let dodged = false;
  while ((end - x) * a.dir > 0) {
    x += a.dir * 9; drawArrowFx(x, y, a.dir, false);
    if (!o.hit && !dodged && Math.abs(x - d.x) < 30) { dodged = true; resolve(a, d, o, 0, 0); }
    await frame();
  }
  if (o.hit) await resolve(a, d, o, d.x + d.dir * 4, y);
  await wait(20);
  a.pose = 'idle';
  await finish(a, d);
}
// 必殺「閃光の一矢」：片ひざをついて狙いを定め、光る矢を放つ（相手を貫いて画面の外へ）
async function bowCrit(a, d, o) {
  a.front = true;
  a.pose = 'kneel'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'aim');
  const y = FLOOR - 19;
  for (let i = 0; i < 18; i++) {      // 矢じりに光が集まる
    const ang = Math.random() * Math.PI * 2;
    addPx(a.x + a.dir * 20 + Math.cos(ang) * 10, y + Math.sin(ang) * 10, 8, HOT, -Math.cos(ang) * 1.2, -Math.sin(ang) * 1.2);
    await frame();
  }
  a.pose = 'shot'; flashA = 0.4;
  let x = a.x + a.dir * 20, hit = false;
  while (x > -20 && x < W + 20) {
    x += a.dir * 14; drawArrowFx(x, y, a.dir, true);
    if (!hit && (x - d.x) * a.dir > -4) { hit = true; resolve(a, d, o, d.x, y); const xp = []; for (let k = -40; k <= 40; k++) { xp.push([d.x + k, y, '#ffffff']); xp.push([d.x + k, y + 1, '#ffe070']); } marks.push({ k: 'x', px: xp, life: 24 }); }
    await frame();
  }
  await wait(30);
  darkTarget = 0;
  a.pose = 'idle';
  await finish(a, d);
}

/* ----- シーフ（ナイフ） ----- */
async function knifeAttack(a, d, o) {
  // 通常攻撃：低く構えて一気に駆け抜け、すれちがいざまにダガーで斬る（相手の後ろへ抜ける）
  a.front = true;
  await moveTo(a, d.x - a.dir * 46, 6);
  a.pose = 'crouch'; await wait(6);
  a.pose = 'swing';
  const tx = d.x + a.dir * 30;
  let cut = false;
  while (a.x !== tx) {
    a.ghosts.push({ x: a.x, dy: 0, a: 0.45, pose: 'swing' });
    a.x += a.dir * Math.min(10, Math.abs(tx - a.x));
    for (let k = 0; k < 5; k++) addPx(a.x - a.dir * k * 2, FLOOR - 17 + (k % 2), 6, COOL);
    if (!cut && (a.x - d.x) * a.dir > 4) {
      cut = true;
      if (o.hit) for (let k = -10; k <= 10; k++) addPx(d.x + k, FLOOR - 20 - k * 0.5, 10, COOL);
      resolve(a, d, o, d.x + d.dir * 2, FLOOR - 19);
    }
    await frame();
  }
  a.pose = 'crouch'; dust(a.x, 6, 1);
  if (o.two && d.hp > 0) await knifeFollow(a, d, o.two);
  await wait(24);
  await finishSword(a, d);
}
// 追撃（シーフ）：切り抜けた先で振り向かず、後ろへ下がりながら左手の逆手ダガーで背後の相手を突き刺す
async function knifeFollow(a, d, o) {
  await wait(4);
  const tx = d.x + a.dir * 20;            // 背中合わせの位置まで後ろ向きに下がる
  a.pose = 'crouch';
  while ((a.x - tx) * a.dir > 0) { a.x -= a.dir * Math.min(4, (a.x - tx) * a.dir); await frame(); }
  a.pose = 'backstab';
  for (let i = 0; i < 2; i++) { a.x -= a.dir; await frame(); }
  thrustLine(a.x - a.dir * 14, d.x - a.dir * 4, FLOOR - 19, false);
  const sx = d.x - a.dir * 4, sy = FLOOR - 19;
  if (o.hit) {
    // 突き刺したまましばらく止める（相手は小刻みにふるえる）
    d.pose = 'hurt'; d.flash = 3;
    for (let i = 0; i < 18; i++) {
      if (i % 4 === 0) { d.x += (i % 8 === 0 ? 1 : -1); addPx(sx + (Math.random() * 4 - 2), sy + (Math.random() * 4 - 2), 6, ['#ffffff', '#e0c8ff']); }
      await frame();
    }
    // 刃をひねる：刺した所から放射状に影の刃が走り、閃光
    flashA = 0.5;
    for (let k = 0; k < 8; k++) {
      const ang = k / 8 * Math.PI * 2 + Math.PI / 8;
      for (let r = 2; r < 16; r++) addPx(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r, 6 + (16 - r), ['#ffffff', '#e8d0ff', '#b080f0', '#6a30b0', '#2a1040']);
    }
    for (let i = 0; i < 16; i++) { const ang = Math.random() * Math.PI * 2, v = 1 + Math.random() * 1.6; addPx(sx, sy, 14, ['#ffffff', '#c8a0ff', '#7a40c0', '#2a1040'], Math.cos(ang) * v, Math.sin(ang) * v, 2); }
    await wait(3);
  }
  await resolve(a, d, o, sx, sy);
  await wait(10);
  a.pose = 'crouch';
}
// 必殺「影走り」：一瞬で消える → 相手の懐に現れる → 一閃 → 静止の後、とどめ
async function knifeCrit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 56, 6);
  a.pose = 'crouch'; a.glow = 80; darkTarget = 0.75;
  await cutIn(a, 'crouch');
  await wait(6);
  // 一瞬で消える（残像だけが残る）
  a.ghosts.push({ x: a.x, dy: 0, a: 0.7, pose: 'crouch' });
  a.alpha = 0; dust(a.x, 6, 1.4);
  await wait(7);
  // 相手の懐に現れる
  a.x = d.x - a.dir * 14; a.pose = 'crouch'; a.alpha = 1;
  for (let k = 0; k < 8; k++) addPx(a.x + (Math.random() * 10 - 5), FLOOR - Math.random() * 30, 8, ['#ffffff', '#c8d0ff', '#6a70a0'], 0, -0.4);
  await wait(5);
  // 一閃：横一文字の光が走り、相手の後ろへ抜ける
  a.pose = 'swing'; flashA = 0.5;
  const y = FLOOR - 18, x0 = a.x;
  const tx = d.x + a.dir * 26;
  while (a.x !== tx) { a.ghosts.push({ x: a.x, dy: 0, a: 0.5, pose: 'swing' }); a.x += a.dir * Math.min(14, Math.abs(tx - a.x)); await frame(); }
  const xp = [];
  for (let x = Math.min(x0, tx) - 10; x <= Math.max(x0, tx) + 10; x++) { xp.push([x, y, '#ffffff']); xp.push([x, y + 1, '#c8d0ff']); }
  marks.push({ k: 'x', px: xp, life: 34 });
  // 背中を向けたまま静止 → 斬られたことに気づく
  a.pose = 'crouch';
  await wait(22);
  await resolve(a, d, o, d.x, y);
  darkTarget = 0;
  await wait(18);
  await finishSword(a, d);
}

/* ----- クレリック（光魔法） ----- */
const LIGHT = ['#ffffff', '#fffbe0', '#fff0a0', '#e8d070', '#a0a8e0'];
async function lightAttack(a, d, o) {
  a.front = true;
  await moveTo(a, a.x + a.dir * 10, 2);
  a.pose = 'cast'; a.glow = 20;
  // 相手の頭上に光の粒が集まり、まとめて降りそそぐ
  const tx = d.x, ty = FLOOR - 56;
  for (let i = 0; i < 16; i++) {
    const ang = Math.random() * Math.PI * 2;
    addPx(tx + Math.cos(ang) * 16, ty + Math.sin(ang) * 8, 10, LIGHT, -Math.cos(ang) * 1.5, -Math.sin(ang) * 0.8, 2);
    await frame();
  }
  if (!o.hit) resolve(a, d, o, 0, 0);
  for (let i = 0; i < 8; i++) {
    for (let k = 0; k < 6; k++) addPx(tx + (Math.random() * 6 - 3), ty + i * 6 + Math.random() * 6, 10, LIGHT, 0, 1.5, 2);
    await frame();
  }
  for (let i = 0; i < 20; i++) { const ang = i / 20 * Math.PI * 2; addPx(tx, FLOOR - 18, 14, LIGHT, Math.cos(ang) * 2, Math.sin(ang) * 1.4, 2); }
  if (o.hit) await resolve(a, d, o, tx, FLOOR - 20); else await wait(10);
  a.pose = 'idle';
  await wait(20);
  await finish(a, d);
}
// 必殺「聖光の十字」：本を掲げる → 天から光の柱 → 横にも光が走って十字になる
async function lightCrit(a, d, o) {
  a.front = true;
  await moveTo(a, a.x + a.dir * 10, 2);
  a.pose = 'raise'; a.glow = 110; darkTarget = 0.75;
  await cutIn(a, 'raise');
  const cx = d.x, cy = FLOOR - 22;
  for (let t = 0; t < 14; t++) {     // 光の柱が上から降りる
    const yb = Math.min(FLOOR, t * 8);
    for (let y = 0; y < yb; y += 2) addPx(cx + (Math.random() * 4 - 2), y, 3, LIGHT, 0, 0, 2);
    await frame();
  }
  for (let t = 0; t < 12; t++) {     // 横に走る
    const w = t * 4;
    for (let x = -w; x <= w; x += 2) addPx(cx + x, cy + (Math.random() * 2 - 1), 3, LIGHT, 0, 0, 2);
    for (let y = 0; y < FLOOR; y += 2) addPx(cx + (Math.random() * 4 - 2), y, 3, LIGHT, 0, 0, 2);
    await frame();
  }
  flashA = 0.9;
  const xp = [];
  for (let k = -40; k <= 40; k++) { xp.push([cx + k, cy, '#ffffff']); xp.push([cx + k, cy + 1, '#fff0a0']); }
  for (let y = 10; y < FLOOR; y++) { xp.push([cx, y, '#ffffff']); xp.push([cx + 1, y, '#fff0a0']); }
  marks.push({ k: 'x', px: xp, life: 30 });
  for (let i = 0; i < 30; i++) { const ang = Math.random() * Math.PI * 2, v = 1 + Math.random() * 2.5; addPx(cx, cy, 20, LIGHT, Math.cos(ang) * v, Math.sin(ang) * v, 2); }
  shake = 14; shakeAmp = 2;
  await resolve(a, d, o, cx, cy);
  darkTarget = 0;
  a.pose = 'idle';
  await wait(26);
  await finish(a, d);
}

/* ----- 重歩兵（槍と大盾） ----- */
// 重いので歩いて近づく
async function walkTo(u, tx, speed) {
  while (u.x !== tx) {
    const d = tx - u.x; u.x += Math.sign(d) * Math.min(speed, Math.abs(d));
    u.pose = 'run' + (((T >> 3) & 3) + 1);
    if ((T & 15) === 0) { shake = Math.max(shake, 2); shakeAmp = 1; }
    await frame();
  }
}
// 通常攻撃：盾を前に出して歩み寄り、盾の横から槍を突き出す
async function armorAttack(a, d, o) {
  a.front = true;
  await walkTo(a, d.x - a.dir * a.range, 2);
  a.pose = 'ready'; await wait(10);
  a.pose = 'thrust';
  for (let i = 0; i < 3; i++) { a.x += a.dir * 2; await frame(); }
  thrustLine(a.x + a.dir * 32, d.x + a.dir * 6, FLOOR - 18, false);
  await resolve(a, d, o, d.x + d.dir * 5, FLOOR - 18);
  await wait(20);
  await armorFinish(a, d);
}
// 重歩兵は跳ばずに歩いて戻る
async function armorFinish(a, d) {
  if (d.hp <= 0) {
    for (let i = 0; i < 40; i++) {
      d.flash = (i % 6 < 3) ? 2 : 0; d.alpha = 1 - i / 40;
      if (i % 3 === 0) addPx(d.x + (Math.random() * 16 - 8), FLOOR - Math.random() * 34, 18, COOL, 0, -0.6, 2);
      await frame();
    }
    d.alpha = 0;
  }
  const ret = d.hp > 0 ? (async () => { d.pose = 'idle'; await wait(6); await moveTo(d, d.home, 2, false); })() : null;
  const dir = a.dir; a.dir = a.home < d.home ? 1 : -1;
  if (a.x !== a.home) { a.dir = Math.sign(a.home - a.x); await walkTo(a, a.home, 3); }
  a.dir = dir; a.pose = 'idle';
  if (ret) await ret;
  a.front = false;
  await wait(12);
}
// 必殺「鉄壁突撃」：盾を構えて突進し体当たり → よろけた相手を槍で貫く
async function armorCrit(a, d, o) {
  a.front = true;
  await walkTo(a, d.x - a.dir * 64, 2);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'bash');
  a.pose = 'bash';
  const tx = d.x - a.dir * 22;
  while (a.x !== tx) {
    a.ghosts.push({ x: a.x, dy: 0, a: 0.4, pose: 'bash' });
    a.x += a.dir * Math.min(6, Math.abs(tx - a.x));
    dust(a.x - a.dir * 6, 2, 1);
    await frame();
  }
  // 盾の体当たり
  spark(d.x - a.dir * 4, FLOOR - 22, false); shake = 10; shakeAmp = 2; d.flash = 6;
  for (let i = 0; i < 6; i++) { d.x += a.dir * 2; await frame(); }
  d.pose = 'hurt';
  a.pose = 'ready'; await wait(8);
  a.pose = 'thrust';
  for (let i = 0; i < 3; i++) { a.x += a.dir * 3; await frame(); }
  thrustLine(a.x + a.dir * 32, d.x + a.dir * 10, FLOOR - 18, true);
  await resolve(a, d, o, d.x, FLOOR - 18);
  darkTarget = 0;
  await wait(24);
  await armorFinish(a, d);
}

/* ----- バンデット（斧） ----- */
// 通常攻撃：駆け寄って頭の上まで振りかぶり、全身で振り下ろす
async function banditAttack(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * a.range, 4);
  a.pose = 'raise';
  for (let i = 0; i < 4; i++) { a.dy = -i; await frame(); }
  await wait(12);
  a.dy = 0; a.pose = 'swing';
  chopArc(a.x + a.dir * 6, FLOOR - 22, a.dir, 26, false);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 18);
  a.pose = 'follow'; dust(a.x + a.dir * 20, 10, 1.4); shake = Math.max(shake, 5); shakeAmp = Math.max(shakeAmp, 1);
  await wait(22);
  await finish(a, d);
}
// 必殺「大旋風」：斧を振り回して回転しながら突進 → 2回斬りつけ → 跳んで真上から叩き割る
async function banditCrit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 62, 4);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'raise');
  const dir0 = a.dir, tx = d.x - dir0 * 22;
  let k = 0;
  while (a.x !== tx) {
    a.x += dir0 * Math.min(4, Math.abs(tx - a.x));
    a.dir = ((k >> 1) & 1) ? -dir0 : dir0; a.pose = 'swing';
    a.ghosts.push({ x: a.x, dy: 0, a: 0.35, pose: 'swing' });
    dust(a.x, 2, 1.6);
    k++; await frame();
  }
  for (let h = 0; h < 2; h++) {
    for (let j = 0; j < 6; j++) { a.dir = (j & 1) ? -dir0 : dir0; await frame(); }
    a.dir = dir0; spark(d.x - dir0 * 4, FLOOR - 20, false); d.flash = 4; shake = 4; shakeAmp = 1;
    await wait(3);
  }
  a.dir = dir0; a.pose = 'raise';
  const sx = a.x;
  for (let i = 1; i <= 12; i++) { a.dy = -Math.round(Math.sin(i / 12 * Math.PI / 2) * 40); a.x = Math.round(sx - dir0 * 4 * i / 12); await frame(); }
  await wait(5);
  a.pose = 'swing';
  const top = a.dy;
  for (let i = 1; i <= 4; i++) { a.dy = Math.round(top * (1 - i / 4)); a.ghosts.push({ x: a.x, dy: a.dy, a: 0.35, pose: 'swing' }); await frame(); }
  a.dy = 0; a.pose = 'follow';
  const cx = a.x + a.dir * 20, px = [];
  for (const s of [-1, 1]) {
    let y = 0, x = 0;
    for (let q = 0; q < 30; q++) { x += s; if (Math.random() < 0.4) y += Math.random() < 0.5 ? -1 : 1; y = Math.max(-1, Math.min(4, y)); px.push([cx + x, FLOOR + 1 + y, '#3a2614']); px.push([cx + x, FLOOR + 2 + y, '#ffd070']); }
  }
  marks.push({ k: 'crack', px, life: 60 });
  rocks(cx, 18); dust(cx, 22, 2.2); shake = 16; shakeAmp = 3;
  await resolve(a, d, o, d.x + d.dir * 2, FLOOR - 16);
  darkTarget = 0;
  await wait(26);
  await finish(a, d);
}

/* ----- 女ソルジャー（両手槍） ----- */
// 通常攻撃：両手で構えた槍で、すばやく二段突き
async function lance2Attack(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * a.range, 4);
  for (let t = 0; t < 2; t++) {
    a.pose = 'ready'; await wait(t ? 4 : 8);
    a.pose = 'thrust';
    for (let i = 0; i < 2; i++) { a.x += a.dir * 2; await frame(); }
    thrustLine(a.x + a.dir * 34, d.x + a.dir * 6, FLOOR - 19 + t * 2, false);
    if (t === 0) { if (o.hit) { spark(d.x + d.dir * 5, FLOOR - 19, false); d.flash = 3; } await wait(4); for (let i = 0; i < 4; i++) { a.x -= a.dir; await frame(); } }
  }
  await resolve(a, d, o, d.x + d.dir * 5, FLOOR - 17);
  if (o.two && d.hp > 0) await lance2Follow(a, d, o.two);
  await wait(20);
  await finish(a, d);
}
// 追撃（ソルジャー女）：槍を体の後ろへ大きく引き、腰をひねって横に薙ぎ払う
async function lance2Follow(a, d, o) {
  a.pose = 'wind'; await wait(8);
  for (let i = 0; i < 3; i++) { a.x += a.dir * 2; await frame(); }
  a.pose = 'sweep';
  slashArc(a.x + a.dir * 6, FLOOR - 20, a.dir, 32, false, -150, 20);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 20);
}
// 必殺「疾風の連槍」：低く構えて駆け込み、三連突き → 体ごと相手を貫いて後ろへ抜ける
async function lance2Crit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 64, 4);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'thrust');
  const near = d.x - a.dir * a.range;
  while (a.x !== near) { a.ghosts.push({ x: a.x, dy: 0, a: 0.45, pose: 'ready' }); a.x += Math.sign(near - a.x) * Math.min(8, Math.abs(near - a.x)); a.pose = 'ready'; await frame(); }
  const ys = [-21, -16, -19];
  for (let p = 0; p < 3; p++) {
    a.pose = 'ready'; a.x -= a.dir * 2; await wait(2);
    a.pose = 'thrust'; a.x += a.dir * 2;
    thrustLine(a.x + a.dir * 34, d.x + a.dir * 6, FLOOR + ys[p], true);
    spark(d.x + d.dir * 4, FLOOR + ys[p], false); d.flash = 3; shake = 3; shakeAmp = 1;
    await wait(4);
  }
  a.pose = 'ready';
  for (let i = 0; i < 6; i++) { a.x -= a.dir; await frame(); }
  await wait(8);
  const tx = d.x + a.dir * 30;
  a.pose = 'thrust';
  while (a.x !== tx) {
    a.ghosts.push({ x: a.x, dy: 0, a: 0.55, pose: 'thrust' });
    a.x += a.dir * Math.min(12, Math.abs(tx - a.x));
    for (let k = 0; k < 8; k++) addPx(a.x - a.dir * k * 2, FLOOR - 19 + (k % 3) - 1, 7, HOT);
    await frame();
  }
  const xp = [];
  for (let k = -24; k <= 24; k++) { xp.push([d.x + k, FLOOR - 19, '#ffffff']); xp.push([d.x + k, FLOOR - 18, '#ffe070']); }
  marks.push({ k: 'x', px: xp, life: 26 });
  await wait(8);
  await resolve(a, d, o, d.x, FLOOR - 19);
  darkTarget = 0;
  await wait(18);
  await finishSword(a, d);
}

/* ----- 男魔道士（炎） ----- */
// 通常攻撃「エルファイアー」：足元から炎の波が地をはって走り、相手の足元で燃え上がる
async function fire2Attack(a, d, o) {
  a.front = true;
  await moveTo(a, a.x + a.dir * 10, 2);
  a.pose = 'cast'; a.glow = 20;
  for (let i = 0; i < 10; i++) { addPx(a.x + a.dir * 17 + (Math.random() * 6 - 3), FLOOR - 24 + (Math.random() * 6 - 3), 10, FIRE, 0, -0.5); await frame(); }
  let x = a.x + a.dir * 12;
  const end = d.x;
  let dodged = false;
  while ((end - x) * a.dir > 0) {
    x += a.dir * 5;
    for (let k = 0; k < 5; k++) addPx(x + (Math.random() * 6 - 3), FLOOR - Math.random() * 3, 14 + (Math.random() * 6 | 0), FIRE, 0, -(0.8 + Math.random() * 1.4), 2);
    if (!o.hit && !dodged && Math.abs(x - d.x) < 26) { dodged = true; resolve(a, d, o, 0, 0); }
    await frame();
  }
  for (let t = 0; t < 10; t++) {
    for (let k = 0; k < 8; k++) addPx(end + (Math.random() * 14 - 7), FLOOR - Math.random() * 4, 16, FIRE, (Math.random() - 0.5) * 0.4, -(1.5 + Math.random() * 2.5), 2);
    if (t === 3 && o.hit) resolve(a, d, o, d.x, FLOOR - 16);
    await frame();
  }
  a.pose = 'idle';
  await wait(24);
  await finish(a, d);
}
// 必殺「焦熱の流星」：本を掲げる → 空が赤く光り、燃える岩が3つ斜めに降りそそぐ
async function fire2Crit(a, d, o) {
  a.front = true;
  await moveTo(a, a.x + a.dir * 10, 2);
  a.pose = 'raise'; a.glow = 120; darkTarget = 0.75;
  await cutIn(a, 'raise');
  await wait(8);
  for (let m = 0; m < 3; m++) {
    const ex = d.x + (m - 1) * 10, ey = FLOOR - 14;
    let x = ex - a.dir * 70, y = -10;
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const px = x + (ex - x) * i / n, py = y + (ey - y) * i / n;
      for (let k = 0; k < 12; k++) addPx(px + (Math.random() * 8 - 4), py + (Math.random() * 8 - 4), 16, FIRE, 0, -0.3, 3);
      addPx(px - 2, py - 2, 3, ['#5a1a10'], 0, 0, 6);
      addPx(px - 1, py - 1, 3, ['#ffe080'], 0, 0, 4);
      await frame();
    }
    fireBurst(ex, ey, 30, 2.4); rocks(ex, 6); shake = 8; shakeAmp = 2; d.flash = 4;
    if (m === 2) { flashA = 0.7; await resolve(a, d, o, d.x, FLOOR - 18); }
    else await wait(3);
  }
  darkTarget = 0;
  a.pose = 'idle';
  await wait(26);
  await finish(a, d);
}

/* ----- レンジャー（剣） ----- */
// 通常：剣を後ろに流して駆け込み、肩の上まで引いてから体ごとひねって大きく横に斬る
async function heroAttack(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * a.range, 5);
  a.pose = 'raise'; await wait(8);
  a.pose = 'swing'; a.x += a.dir * 3;
  slashArc(a.x + a.dir * 6, FLOOR - 22, a.dir, 22, false, -70, 50);
  await wait(2);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 21);
  a.pose = 'follow';
  if (o.two && d.hp > 0) await heroFollow(a, d, o.two);
  await wait(22);
  await finish(a, d);
}
// 追撃（レンジャー）：振り抜いた剣を下に返し、もう一歩踏み込んで下から斜めに斬り上げる
async function heroFollow(a, d, o) {
  await wait(4);
  a.pose = 'low'; await wait(6);
  for (let i = 0; i < 3; i++) { a.x += a.dir * 2; await frame(); }
  a.pose = 'upcut';
  slashArc(a.x + a.dir * 8, FLOOR - 22, a.dir, 22, false, 60, -115);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 26);
}
// 必殺「烈空斬」：高く跳んで剣を真上にかかげ、光を集める → 真上から落ちて斬り下ろす（光の柱）
async function heroCrit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 50, 5);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'raise');
  dust(a.x, 12, 1.2);
  const sx = a.x, tx = d.x - a.dir * 22, n = 16;
  a.pose = 'leap';
  for (let i = 1; i <= n; i++) {
    a.x = Math.round(sx + (tx - sx) * i / n);
    a.dy = -Math.round(Math.sin(i / n * Math.PI / 2) * 42);
    if (i % 2) a.ghosts.push({ x: a.x, dy: a.dy, a: 0.4, pose: 'leap' });
    await frame();
  }
  // 頂点で剣に光が集まる
  for (let i = 0; i < 14; i++) {
    const ang = Math.random() * Math.PI * 2, bx = a.x + a.dir * 2, by = FLOOR + a.dy - 52;
    addPx(bx + Math.cos(ang) * 10, by + Math.sin(ang) * 10, 8, HOT, -Math.cos(ang) * 1.1, -Math.sin(ang) * 1.1);
    await frame();
  }
  a.pose = 'dive';
  const top = a.dy;
  for (let i = 1; i <= 5; i++) {
    a.dy = Math.round(top * (1 - i / 5));
    a.ghosts.push({ x: a.x, dy: a.dy, a: 0.45, pose: 'dive' });
    for (let k = 0; k < 4; k++) addPx(a.x + a.dir * (12 + k), FLOOR + a.dy - 26 - k * 3, 9, HOT);
    await frame();
  }
  a.dy = 0;
  slashArc(a.x + a.dir * 6, FLOOR - 30, a.dir, 26, true, -100, 70);
  for (let y = 0; y < 120; y += 2) { addPx(d.x, FLOOR - y, 16, HOT, 0, 0, 2); if (y % 6 === 0) addPx(d.x + 3, FLOOR - y, 12, ['#ffffff', '#fff2a0'], 0, 0, 1); }
  rocks(d.x, 12); dust(d.x, 22, 2.2);
  await resolve(a, d, o, d.x, FLOOR - 20);
  darkTarget = 0;
  await wait(24);
  await finish(a, d);
}

/* ----- 騎馬（ソードナイト・ランスナイト） ----- */
// 馬は跳ばずに、足踏みしながら後ずさりして戻る
async function backTo(u, tx, speed = 2) {
  while (u.x !== tx) {
    const d = tx - u.x; u.x += Math.sign(d) * Math.min(speed, Math.abs(d));
    u.pose = 'run' + (4 - ((T >> 3) & 3));
    await frame();
  }
  u.pose = 'idle';
}
async function cavFinish(a, d) {
  if (d.hp <= 0) {
    for (let i = 0; i < 40; i++) {
      d.flash = (i % 6 < 3) ? 2 : 0; d.alpha = 1 - i / 40;
      if (i % 3 === 0) addPx(d.x + (Math.random() * 16 - 8), FLOOR - Math.random() * 34, 18, COOL, 0, -0.6, 2);
      await frame();
    }
    d.alpha = 0;
  }
  const ret = d.hp > 0 ? (async () => { d.pose = 'idle'; await wait(6); await moveTo(d, d.home, 2, false); })() : null;
  await backTo(a, a.home, 3);
  if (ret) await ret;
  a.pose = 'idle'; a.front = false;
  await wait(12);
}
// 駆け寄る（ひづめの土けむり）
async function gallopTo(u, tx, speed) {
  while (u.x !== tx) {
    const d = tx - u.x; u.x += Math.sign(d) * Math.min(speed, Math.abs(d));
    u.pose = 'run' + (((T >> 2) & 3) + 1);
    if ((T & 3) === 0) dust(u.x - u.dir * 6, 2, 0.6);
    await frame();
  }
}
// 棹立ち：前脚を高く上げていななく
async function rearUp(a, n) {
  a.pose = 'rear';
  for (let i = 0; i < n; i++) { if (i % 4 === 0) dust(a.x - a.dir * 4, 3, 0.8); await frame(); }
  a.pose = 'crouch'; shake = Math.max(shake, 6); shakeAmp = 2; dust(a.x + a.dir * 14, 10, 1.4);
  await wait(4);
}

// ソードナイト 通常：駆け寄りながら剣を振りかぶり、馬を止める勢いで馬上から斬り下ろす
async function cavSwordAttack(a, d, o) {
  a.front = true;
  await gallopTo(a, d.x - a.dir * (a.range + 14), 5);
  a.pose = 'raise';
  for (let i = 0; i < 4; i++) { a.x += a.dir * 3; await frame(); }
  await wait(3);
  a.pose = 'swing'; a.x += a.dir * 2; dust(a.x + a.dir * 14, 6, 1);
  slashArc(a.x + a.dir * 10, FLOOR - 32, a.dir, 21, false);
  await wait(2);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 24);
  await wait(22);
  await cavFinish(a, d);
}
// 必殺「疾風の騎馬斬り」：馬を棹立ちにして剣を天にかかげ → 一気に駆けて、すれちがいざまに大きく斬り下ろす
async function cavSwordCrit(a, d, o) {
  a.front = true;
  await gallopTo(a, d.x - a.dir * 80, 4);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'raise');
  await rearUp(a, 18);
  // 突進（残像）
  const tx = d.x - a.dir * (a.range + 4);
  while ((tx - a.x) * a.dir > 0) {
    a.ghosts.push({ x: a.x, dy: 0, a: 0.5, pose: a.pose });
    a.x += a.dir * Math.min(9, (tx - a.x) * a.dir);
    a.pose = 'run' + (((T >> 1) & 3) + 1);
    dust(a.x - a.dir * 8, 3, 1);
    for (let k = 0; k < 6; k++) addPx(a.x - a.dir * (10 + k * 3), FLOOR - 30 + (k % 3) * 4, 6, COOL);
    await frame();
  }
  a.pose = 'raise'; await wait(3);
  a.pose = 'swing'; dust(a.x + a.dir * 14, 12, 1.6);
  slashArc(a.x + a.dir * 10, FLOOR - 34, a.dir, 26, true);
  await wait(2);
  for (let k = -16; k <= 16; k++) addPx(d.x + k * 0.6, FLOOR - 22 + k, 16, HOT, 0, 0, 2);
  await resolve(a, d, o, d.x, FLOOR - 24);
  darkTarget = 0;
  await wait(24);
  await cavFinish(a, d);
}

// 斜めの突きの光（手元から下向き 2:1 / 1:1）
function thrustDiag(x0, y0, x1, dir, slope) {
  for (let x = x0; (x1 - x) * dir > 0; x += dir) addPx(x, y0 + Math.abs(x - x0) * slope, 8, ['#ffffff', '#f0dcff', '#c8a0ff', '#8a50d0']);
}
// ランスナイト 通常：駆け寄って馬の腰を沈め、馬が踏み込む勢いに乗せて槍を突き下ろす
async function cavLanceAttack(a, d, o) {
  a.front = true;
  await gallopTo(a, d.x - a.dir * (a.range + 8), 5);
  a.pose = 'ready'; await wait(9);
  a.pose = 'thrust';
  for (let i = 0; i < 4; i++) { a.x += a.dir * 2; await frame(); }
  dust(a.x + a.dir * 12, 6, 1);
  thrustDiag(a.x + a.dir * 14, FLOOR - 35, d.x + a.dir * 4, a.dir, 0.5);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 22);
  await wait(22);
  await cavFinish(a, d);
}
// 必殺「怒涛の突撃」：棹立ち → 槍を脇にかかえて全力で駆け、馬ごとぶつかるように貫く
async function cavLanceCrit(a, d, o) {
  a.front = true;
  await gallopTo(a, d.x - a.dir * 100, 4);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'thrust');
  await rearUp(a, 18);
  const tx = d.x - a.dir * (a.range - 4);
  let i = 0;
  while ((tx - a.x) * a.dir > 0) {
    a.ghosts.push({ x: a.x, dy: 0, a: 0.5, pose: a.pose });
    a.x += a.dir * Math.min(4 + i, 10, (tx - a.x) * a.dir); i++;
    a.pose = 'ch' + (((T >> 1) & 3) + 1);
    dust(a.x - a.dir * 8, 3, 1);
    for (let k = 0; k < 6; k++) addPx(a.x - a.dir * (12 + k * 3), FLOOR - 26 + (k % 3) * 4, 6, HOT);
    await frame();
  }
  a.pose = 'thrust'; dust(a.x + a.dir * 12, 14, 1.8);
  thrustDiag(a.x + a.dir * 14, FLOOR - 35, d.x + a.dir * 14, a.dir, 0.5);
  // 貫いた先へ光が抜ける
  for (let k = 0; k < 30; k++) addPx(d.x + a.dir * k, FLOOR - 22 + k * 0.5, 14, HOT, a.dir * 0.8, 0, 2);
  await resolve(a, d, o, d.x, FLOOR - 22);
  darkTarget = 0;
  await wait(24);
  await cavFinish(a, d);
}

// アクスナイト 通常：片手斧を肩にかついで駆け寄り、頭の後ろまで振りかぶって馬上から叩き割る
async function cavAxeAttack(a, d, o) {
  a.front = true;
  await gallopTo(a, d.x - a.dir * (a.range + 14), 5);
  a.pose = 'raise';
  for (let i = 0; i < 4; i++) { a.x += a.dir * 3; await frame(); }
  await wait(5);
  a.pose = 'swing'; a.x += a.dir * 2;
  chopArc(a.x + a.dir * 8, FLOOR - 32, a.dir, 22, false);
  await wait(3);
  await resolve(a, d, o, d.x + d.dir * 4, FLOOR - 24);
  a.pose = 'follow'; dust(a.x + a.dir * 16, 8, 1.2); shake = Math.max(shake, 4);
  await wait(22);
  await cavFinish(a, d);
}
// 必殺「黒嵐の大斧」：棹立ちで斧を天にかかげ → 駆け込んで真上から叩きつけ、地面が割れて岩が飛ぶ
async function cavAxeCrit(a, d, o) {
  a.front = true;
  await gallopTo(a, d.x - a.dir * 80, 4);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'raise');
  await rearUp(a, 18);
  const tx = d.x - a.dir * (a.range + 2);
  while ((tx - a.x) * a.dir > 0) {
    a.ghosts.push({ x: a.x, dy: 0, a: 0.5, pose: a.pose });
    a.x += a.dir * Math.min(9, (tx - a.x) * a.dir);
    a.pose = 'run' + (((T >> 1) & 3) + 1);
    dust(a.x - a.dir * 8, 3, 1);
    await frame();
  }
  a.pose = 'raise'; await wait(6);
  a.pose = 'swing';
  chopArc(a.x + a.dir * 8, FLOOR - 32, a.dir, 26, true);
  await wait(2);
  a.pose = 'follow';
  const cx = d.x, px = [];
  for (const s of [-1, 1]) {
    let y = 0, x = 0;
    for (let k = 0; k < 34; k++) { x += s; if (Math.random() < 0.4) y += Math.random() < 0.5 ? -1 : 1; y = Math.max(-1, Math.min(4, y)); px.push([cx + x, FLOOR + 1 + y, '#3a2614']); px.push([cx + x, FLOOR + 2 + y, '#ffd070']); }
  }
  marks.push({ k: 'crack', px, life: 60 });
  rocks(cx, 22); dust(cx, 26, 2.4);
  shake = 16; shakeAmp = 3;
  await resolve(a, d, o, d.x, FLOOR - 20);
  darkTarget = 0;
  await wait(26);
  await cavFinish(a, d);
}

// 馬上から射る矢：弓の高さから相手の胸へ、少し下向きに飛ぶ。外れたら相手の後ろまで抜ける
async function rideArrow(a, d, o, hot, speed, resolveIt = true) {
  const x0 = a.x + a.dir * 12, y0 = FLOOR - 40, y1 = FLOOR - 22;
  const span = Math.abs(d.x - x0) || 1;
  const end = o.hit ? d.x + d.dir * 4 : d.x + a.dir * 60;
  let x = x0, dodged = false;
  while ((end - x) * a.dir > 0) {
    x += a.dir * speed;
    const y = Math.round(y0 + (y1 - y0) * Math.min(1.3, Math.abs(x - x0) / span));
    drawArrowFx(x, y, a.dir, hot);
    if (!o.hit && !dodged && Math.abs(x - d.x) < 30) { dodged = true; resolve(a, d, o, 0, 0); }
    await frame();
  }
  if (o.hit && resolveIt) await resolve(a, d, o, d.x + d.dir * 4, y1);
}
// ボウナイト 通常：馬を止め、大きく引きしぼって射下ろす
async function cavBowAttack(a, d, o) {
  a.front = true;
  await moveTo(a, a.x + a.dir * 10, 2);
  a.pose = 'aim'; await wait(14);
  a.pose = 'shot';
  await rideArrow(a, d, o, false, 9);
  await wait(20);
  a.pose = 'idle';
  await cavFinish(a, d);
}
// 必殺「光迅の一矢」：馬を棹立ちにして引きしぼり、光をためた矢で相手を貫く（画面の外まで抜ける）
async function cavBowCrit(a, d, o) {
  a.front = true;
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'aim');
  a.pose = 'rear';
  const hx = a.x + a.dir * 14, hy = FLOOR - 46;
  for (let i = 0; i < 22; i++) {
    const ang = Math.random() * Math.PI * 2;
    addPx(hx + Math.cos(ang) * 11, hy + Math.sin(ang) * 11, 8, HOT, -Math.cos(ang) * 1.2, -Math.sin(ang) * 1.2);
    if (i % 5 === 0) dust(a.x - a.dir * 4, 3, 0.8);
    await frame();
  }
  a.pose = 'rshot'; flashA = 0.5;
  const y1 = FLOOR - 22, span = Math.abs(d.x - hx) || 1;
  let x = hx, hit = false;
  while (x > -20 && x < W + 20) {
    x += a.dir * 14;
    const y = Math.round(hy + (y1 - hy) * Math.abs(x - hx) / span);
    drawArrowFx(x, y, a.dir, true);
    if (!hit && (x - d.x) * a.dir > -4) {
      hit = true; resolve(a, d, o, d.x, y1);
      for (let k = 0; k < 24; k++) { const g = k / 24 * Math.PI * 2; addPx(d.x + Math.cos(g) * 14, y1 + Math.sin(g) * 14, 16, HOT, Math.cos(g) * 0.6, Math.sin(g) * 0.6, 2); }
    }
    await frame();
  }
  a.pose = 'crouch'; shake = Math.max(shake, 6); shakeAmp = 2; dust(a.x + a.dir * 14, 10, 1.4);
  await wait(26);
  darkTarget = 0;
  a.pose = 'idle';
  await cavFinish(a, d);
}
/* ----- 飛行（ペガサスナイト・ドラゴンナイト） ----- */
// 高さ（dy）をなめらかに変える
async function flyDy(a, to, n, pose) {
  const from = a.dy;
  for (let i = 1; i <= n; i++) { a.dy = Math.round(from + (to - from) * i / n); if (pose) a.pose = pose + (((T >> 1) & 3) + 1); await frame(); }
}
// ペガサスナイト 通常：はばたいて近づき、少し舞い上がって槍を引き → 急降下の勢いで斜め下へ突く
async function flyLanceAttack(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * (a.range + 10), 5);
  a.pose = 'ready'; await flyDy(a, -5, 8);
  a.pose = 'thrust';
  for (let i = 0; i < 4; i++) { a.x += a.dir * 2; a.dy = Math.min(6, a.dy + 3); await frame(); }
  thrustDiag(a.x + a.dir * 12, FLOOR - 44 + a.dy, d.x + a.dir * 2, a.dir, 1);
  await resolve(a, d, o, d.x + d.dir * 3, FLOOR - 24);
  await wait(16);
  await flyDy(a, 0, 8);
  await cavFinish(a, d);
}
// 必殺「天翔ける槍」：空高く舞い上がって槍を天にかかげ → 一直線に急降下して貫き → 槍を引き抜いて画面の外へ飛び去り、後ろから舞い降りて戻る
async function flyLanceCrit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 70, 4);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'soar');
  a.pose = 'soar';
  await flyDy(a, -22, 14);
  for (let i = 0; i < 12; i++) { if (i % 2 === 0) addPx(a.x + a.dir * 4, FLOOR + a.dy - 64, 10, HOT, 0, 0, 2); await frame(); }
  a.pose = 'plunge';
  const sx = a.x, tx = d.x - a.dir * a.range, sy = a.dy, n = 7;
  for (let i = 1; i <= n; i++) {
    a.ghosts.push({ x: a.x, dy: a.dy, a: 0.45, pose: 'plunge' });
    a.x = Math.round(sx + (tx - sx) * i / n); a.dy = Math.round(sy + (6 - sy) * i / n);
    for (let k = 0; k < 5; k++) addPx(a.x - a.dir * (8 + k * 3), FLOOR + a.dy - 40 - k * 3, 9, COOL);
    await frame();
  }
  for (let k = 0; k < 34; k++) addPx(d.x - a.dir * 18 + a.dir * k, FLOOR - 44 + k, 14, HOT, 0, 0, 2);
  dust(d.x, 18, 2); shake = 14; shakeAmp = 3;
  const rv = resolve(a, d, o, d.x, FLOOR - 22);
  // 突き刺したまま少し止め → 槍を引き抜いて相手の上を越え、画面の外へ飛び去る
  const bx = a.x;
  for (let i = 0; i < 16; i++) { a.x = bx + ((i % 4 < 2) ? 1 : 0); if (i % 4 === 0) addPx(d.x, FLOOR - 26, 10, HOT, a.dir * 0.8, -0.6, 2); await frame(); }
  a.x = bx; await rv;
  flashA = 0.3;
  for (let k = 0; k < 16; k++) { const g = k / 16 * Math.PI * 2; addPx(d.x + Math.cos(g) * 8, FLOOR - 26 + Math.sin(g) * 8, 12, HOT, Math.cos(g) * 0.9, Math.sin(g) * 0.9, 2); }
  let vx = 1, vy = -1;
  for (let i = 0; FLOOR + a.dy > -40 && (a.x > -60 && a.x < W + 60) && i < 80; i++) {
    a.ghosts.push({ x: a.x, dy: a.dy, a: 0.4, pose: a.pose });
    a.pose = 'fly' + (((i >> 1) & 3) + 1);
    vx = Math.min(7, vx + 0.5); vy = Math.max(-4.5, vy - 0.3);
    a.x = Math.round(a.x + a.dir * vx); a.dy = Math.round(a.dy + vy);
    if (i % 2 === 0) addPx(a.x - a.dir * 10, FLOOR + a.dy - 30, 14, '#ffffff', -a.dir * 0.4, 0.5, 2);
    await frame();
  }
  darkTarget = 0;
  a.alpha = 0; a.ghosts = [];
  await wait(16);
  // 相手の後始末（倒れたら消える・生きていれば元の位置へ）
  if (d.hp <= 0) {
    for (let i = 0; i < 40; i++) {
      d.flash = (i % 6 < 3) ? 2 : 0; d.alpha = 1 - i / 40;
      if (i % 3 === 0) addPx(d.x + (Math.random() * 16 - 8), FLOOR - Math.random() * 34, 18, COOL, 0, -0.6, 2);
      await frame();
    }
    d.alpha = 0;
  }
  const ret = d.hp > 0 ? (async () => { d.pose = 'idle'; await wait(6); await moveTo(d, d.home, 2, false); })() : null;
  // 自分の後ろの画面外から舞い降りて元の位置へ
  const ex = a.dir > 0 ? -50 : W + 50, ey = -70, m = 40;
  a.x = ex; a.dy = ey; a.alpha = 1;
  for (let i = 1; i <= m; i++) {
    const t = i / m, e = 1 - (1 - t) * (1 - t);
    a.x = Math.round(ex + (a.home - ex) * e); a.dy = Math.round(ey * (1 - e));
    a.pose = 'fly' + (((T >> 2) & 3) + 1);
    await frame();
  }
  a.x = a.home; a.dy = 0; a.pose = 'idle';
  if (ret) await ret;
  a.front = false;
  await wait(12);
}
// ドラゴンナイト 通常：飛竜ごと近づいて斧を振りかぶり → 飛竜が急降下する勢いで頭上から叩き割る
async function flyAxeAttack(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * (a.range + 12), 4);
  a.pose = 'raise'; await flyDy(a, -6, 9);
  a.pose = 'swing';
  for (let i = 0; i < 3; i++) { a.x += a.dir * 4; a.dy = Math.min(8, a.dy + 5); await frame(); }
  chopArc(a.x + a.dir * 6, FLOOR - 40 + a.dy, a.dir, 24, false);
  await wait(2);
  await resolve(a, d, o, d.x + d.dir * 3, FLOOR - 26);
  a.pose = 'follow'; shake = Math.max(shake, 4);
  await wait(20);
  await flyDy(a, 0, 8);
  await cavFinish(a, d);
}
// 必殺「竜墜撃」：3秒かけて羽ばたきながら上空へ（画面の外へ消える）→ ひと呼吸 → 真上から急降下して叩きつけ、地面が割れる
async function flyAxeCrit(a, d, o) {
  a.front = true;
  await moveTo(a, d.x - a.dir * 60, 4);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'soar');
  // 3秒（180コマ）かけて羽ばたきながら上空へ。画面の上に消える
  const sx = a.x, tx = d.x - a.dir * (a.range + 2), RISE = 180, TOP = -200;
  for (let i = 1; i <= RISE; i++) {
    const t = i / RISE, e = t * t * (3 - 2 * t);
    a.pose = 'fly' + (((i >> 3) & 3) + 1);
    a.x = Math.round(sx + (tx - sx) * e); a.dy = Math.round(TOP * e);
    if (i % 4 === 0) addPx(a.x + (Math.random() * 40 - 20), FLOOR + a.dy - 10, 20, '#d8e8ff', 0, 1.2, 1);
    if (i % 10 === 0) dust(a.x, 3, 0.6 * (1 - t));
    await frame();
  }
  // 上空でひと呼吸（相手の真上に光が見える）
  for (let i = 0; i < 24; i++) { if (i % 3 === 0) addPx(tx + a.dir * 6 + (Math.random() * 6 - 3), 6 + Math.random() * 4, 8, HOT, 0, 0.4, 2); await frame(); }
  // 急降下でとどめ
  a.pose = 'plunge';
  const top = a.dy, n = 10;
  for (let i = 1; i <= n; i++) {
    a.ghosts.push({ x: a.x, dy: a.dy, a: 0.45, pose: 'plunge' });
    a.dy = Math.round(top + (8 - top) * (i / n) * (i / n));
    for (let k = 0; k < 4; k++) addPx(a.x + (Math.random() * 20 - 10), FLOOR + a.dy - 70 - k * 6, 8, COOL, 0, -1, 1);
    await frame();
  }
  a.pose = 'swing';
  chopArc(a.x + a.dir * 6, FLOOR - 40 + a.dy, a.dir, 28, true);
  await wait(2);
  a.pose = 'follow';
  const cx = d.x, px = [];
  for (const s of [-1, 1]) {
    let y = 0, x = 0;
    for (let k = 0; k < 34; k++) { x += s; if (Math.random() < 0.4) y += Math.random() < 0.5 ? -1 : 1; y = Math.max(-1, Math.min(4, y)); px.push([cx + x, FLOOR + 1 + y, '#3a2614']); px.push([cx + x, FLOOR + 2 + y, '#ffd070']); }
  }
  marks.push({ k: 'crack', px, life: 60 });
  rocks(cx, 22); dust(cx, 26, 2.4);
  shake = 16; shakeAmp = 3;
  await resolve(a, d, o, d.x, FLOOR - 20);
  darkTarget = 0;
  await wait(24);
  await flyDy(a, 0, 8);
  await cavFinish(a, d);
}

/* ----- ラグズ（猫・虎）：人の姿 ⇄ 獣の姿（化身） ----- */
const ORANGE = ['#ffffff', '#fff0b0', '#ffc050', '#ff8a30', '#d04a18'];
const CLAWC = ['#ffffff', '#ffffff', '#ffe0e0', '#ff9aa0', '#c04050'];
// 化身（on=true）・化身解除（on=false）
async function shift(u, on) {
  const c = CHARS[u.base];
  u.front = true;
  if (on) {
    u.pose = 'crouch'; darkTarget = 0.45;
    for (let i = 0; i < 30; i++) {            // オレンジの光が渦を巻いて集まる
      const g = i * 0.7, r = 26 - i * 0.6;
      addPx(u.x + Math.cos(g) * r, FLOOR - 20 + Math.sin(g) * r * 0.6, 12, ORANGE, -Math.cos(g) * 0.6, -Math.sin(g) * 0.4, 2);
      addPx(u.x + Math.cos(g + 3.1) * r, FLOOR - 20 + Math.sin(g + 3.1) * r * 0.6, 12, ORANGE, 0, -0.3, 1);
      if (i % 2) u.flash = 2;
      await frame();
    }
    flashA = 0.9; u.flash = 0;
    u.kind = c.beast; u.st = Object.assign({}, c.bst); u.pose = 'roar';
    for (let k = 0; k < 28; k++) { const g = k / 28 * Math.PI * 2; addPx(u.x, FLOOR - 22, 22, ORANGE, Math.cos(g) * 2.2, Math.sin(g) * 1.4, 2); }
    shake = 10; shakeAmp = 2; dust(u.x, 12, 1.6);
    await cutIn(u, 'roar', { title: '化身', sub: c.cls + 'の姿', accent: '#ffb040', band: '#6a3410', bg: '#24100a', color: '#ffc060' });
    popText('化身', u.x, FLOOR - 52, '#ffb040', 11);
    await wait(16);
    darkTarget = 0;
  } else {
    u.pose = 'hurt';
    for (let i = 0; i < 18; i++) { if (i % 2 === 0) addPx(u.x + (Math.random() * 30 - 15), FLOOR - Math.random() * 30, 16, COOL, 0, -0.6, 2); u.flash = i % 4 < 2 ? 2 : 0; await frame(); }
    flashA = 0.5; u.flash = 0;
    u.kind = u.base; u.st = Object.assign({}, c.st); u.pose = 'crouch';
    popText('化身解除', u.x, FLOOR - 46, '#a8d8ff', 9);
    await wait(20);
  }
  u.pose = 'idle'; u.front = false;
  await wait(8);
}
const isBeast = u => u.beast && u.kind === u.beast;
// 爪あと：3本の平行な線をななめに引く（big で太く長く）
async function clawMarks(cx, cy, dir, big, up = false) {
  const len = big ? 26 : 16, n = 4;
  for (let s = 0; s < n; s++) {
    for (let k = -1; k <= 1; k++) {
      for (let i = Math.floor(len * s / n); i < Math.floor(len * (s + 1) / n); i++) {
        const t = i - len / 2;
        const x = cx + dir * (t * 0.7 + k * 4), y = cy + (up ? -t : t) * 0.9 + k * -1;
        addPx(x, y, big ? 16 : 11, big ? HOT : CLAWC, 0, 0, big ? 2 : 1);
      }
    }
    await frame();
  }
}
// 牙：上下から閉じる2本の弧
async function biteFx(cx, cy, big) {
  const r = big ? 16 : 10;
  for (let s = 0; s < 5; s++) {
    const o = (4 - s) * (big ? 4 : 3);
    for (let a = -60; a <= 60; a += 8) {
      const rad = a * Math.PI / 180;
      addPx(cx + Math.sin(rad) * r, cy - o - Math.cos(rad) * 3, 8, big ? HOT : CLAWC, 0, 0, big ? 2 : 1);
      addPx(cx + Math.sin(rad) * r, cy + o + Math.cos(rad) * 3, 8, big ? HOT : CLAWC, 0, 0, big ? 2 : 1);
    }
    await frame();
  }
}
// 獣の姿：後ろへ跳ねて元の位置へ戻る
async function beastBack(u) {
  const sx = u.x, n = 16;
  u.pose = 'dodge';
  for (let i = 1; i <= n; i++) { u.x = Math.round(sx + (u.home - sx) * i / n); u.dy = -Math.round(Math.sin(i / n * Math.PI) * 10); await frame(); }
  u.x = u.home; u.dy = 0; u.pose = 'crouch'; dust(u.x, 6, 1); await wait(6);
  u.pose = 'idle';
}
async function laguzFinish(a, d) {
  if (d.hp <= 0) {
    for (let i = 0; i < 40; i++) {
      d.flash = (i % 6 < 3) ? 2 : 0; d.alpha = 1 - i / 40;
      if (i % 3 === 0) addPx(d.x + (Math.random() * 16 - 8), FLOOR - Math.random() * 34, 18, COOL, 0, -0.6, 2);
      await frame();
    }
    d.alpha = 0;
  }
  const ret = d.hp > 0 ? (async () => { d.pose = 'idle'; await wait(6); await moveTo(d, d.home, 2, false); })() : null;
  await beastBack(a);
  if (ret) await ret;
  a.front = false;
  await wait(12);
}
// 通常攻撃
async function laguzAttack(a, d, o) {
  a.front = true;
  if (!isBeast(a)) {
    // 人の姿：駆け寄り、腕を振り上げて爪で引っかく（化身前は威力0）
    await moveTo(a, d.x - a.dir * a.range, 3);
    a.pose = 'raise'; await wait(8);
    a.pose = 'swing';
    await clawMarks(d.x - a.dir * 2, FLOOR - 26, a.dir, false);
    await resolve(a, d, o, d.x, FLOOR - 26);
    if (o.two && d.hp > 0) await (['tiger', 'rdragon'].includes(kin(a)) ? tigerFollow : catFollow)(a, d, o.two);
    await wait(14);
    a.pose = 'idle';
    await finish(a, d);
    return;
  }
  if (BIRDS.has(kin(a))) return birdAttack(a, d, o);
  if (kin(a) === 'rdragon') return dragonAttack(a, d, o);
  const c = CHARS[a.base];
  await moveTo(a, d.x - a.dir * (c.brange + 22), 4);
  a.pose = 'crouch'; await wait(8);
  // 飛びかかる
  a.pose = 'pounce';
  const sx = a.x, tx = d.x - a.dir * c.brange, n = 9;
  for (let i = 1; i <= n; i++) { a.x = Math.round(sx + (tx - sx) * i / n); a.dy = -Math.round(Math.sin(i / n * Math.PI) * 10); await frame(); }
  a.dy = 0;
  if (kin(a) === 'cat') {
    // 猫：前足を振りかぶって、すばやく引っかく
    a.pose = 'swipe'; await wait(4);
    a.pose = 'rake';
    await clawMarks(d.x, FLOOR - 24, a.dir, false);
  } else {
    // 虎：頭から飛び込んで、かみつく
    a.pose = 'bite';
    await biteFx(d.x + a.dir * 2, FLOOR - 26, false);
  }
  await resolve(a, d, o, d.x, FLOOR - 24);
  if (o.two && d.hp > 0) await (kin(a) === 'tiger' ? tigerFollow : catFollow)(a, d, o.two);
  await wait(14);
  await laguzFinish(a, d);
}
// 虎の追撃：かみついたまま首を振って相手をゆさぶり → 体を起こして前足を振りかぶり、上から叩きつける
async function tigerFollow(a, d, o) {
  if (isBeast(a)) {
    const bx = a.x, dx0 = d.x;
    for (let i = 0; i < 12; i++) {
      const s = (i % 4 < 2) ? 1 : -1;
      a.x = bx + s; d.x = dx0 + s; d.flash = i % 4 === 0 ? 2 : 0;
      await frame();
    }
    a.x = bx; d.x = dx0;
    a.pose = 'swipe'; await wait(8);
    for (let i = 0; i < 2; i++) { a.x += a.dir * 3; await frame(); }
    a.pose = 'rake';
    clawMarks(d.x, FLOOR - 26, a.dir, false);
    shake = Math.max(shake, 5); shakeAmp = 2; dust(d.x, 8, 1.2);
    await wait(2);
    await resolve(a, d, o, d.x, FLOOR - 22);
  } else {
    // 人の姿：腕を高く振り上げ、踏み込んで上から爪を振り下ろす
    await wait(3);
    a.pose = 'raise'; await wait(8);
    for (let i = 0; i < 2; i++) { a.x += a.dir * 2; await frame(); }
    a.pose = 'swing';
    clawMarks(d.x, FLOOR - 26, a.dir, false);
    await wait(2);
    await resolve(a, d, o, d.x, FLOOR - 24);
  }
}
// 猫の追撃：引っかいた前足をそのまま返し、身を沈めてから下から上へ跳ね上げるように引っかく
async function catFollow(a, d, o) {
  await wait(3);
  a.pose = 'crouch'; await wait(5);
  if (isBeast(a)) {
    a.pose = 'swipe';
    for (let i = 1; i <= 4; i++) { a.x += a.dir * 2; a.dy = -Math.round(Math.sin(i / 4 * Math.PI / 2) * 7); await frame(); }
    clawMarks(d.x + a.dir * 2, FLOOR - 26, a.dir, false, true);
    await wait(3);
    await resolve(a, d, o, d.x, FLOOR - 28);
    for (let i = 0; i < 4; i++) { a.dy = Math.min(0, a.dy + 2); await frame(); }
    a.dy = 0; a.pose = 'rake';
  } else {
    a.pose = 'raise';
    for (let i = 0; i < 2; i++) { a.x += a.dir * 2; await frame(); }
    clawMarks(d.x, FLOOR - 28, a.dir, false, true);
    await wait(3);
    await resolve(a, d, o, d.x, FLOOR - 28);
  }
}
// 必殺（人の姿なら先に化身する）
async function laguzCrit(a, d, o) {
  if (!isBeast(a)) await shift(a, true);
  if (kin(a) === 'hawk') return hawkCrit(a, d, o);
  if (kin(a) === 'crow') return crowCrit(a, d, o);
  if (kin(a) === 'rdragon') return dragonCrit(a, d, o);
  const c = CHARS[a.base];
  a.front = true;
  if (kin(a) === 'cat') {
    // 猫「乱れ爪」：残像を残して相手の前後を何度も駆け抜け、すれちがうたびに引っかく → 最後に大きく振り下ろす
    await moveTo(a, d.x - a.dir * 60, 4);
    a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
    await cutIn(a, 'roar');
    const dir0 = a.dir;
    for (let p = 0; p < 4; p++) {
      a.pose = 'pounce';
      const sx = a.x, tx = d.x + a.dir * 52, n = 6;
      for (let i = 1; i <= n; i++) {
        a.ghosts.push({ x: a.x, dy: a.dy, a: 0.5, pose: 'pounce' });
        a.x = Math.round(sx + (tx - sx) * i / n); a.dy = -Math.round(Math.sin(i / n * Math.PI) * 6);
        if (i === 3) { clawMarks(d.x, FLOOR - 22 - p * 3, a.dir, false, p % 2 === 1); d.pose = 'hurt'; d.flash = 4; spark(d.x, FLOOR - 24, false); }
        await frame();
      }
      a.dy = 0; a.pose = 'crouch'; await wait(3);
      a.dir = -a.dir;                         // 向きを変えて、また飛び込む
    }
    a.dir = dir0;
    if ((a.x - d.x) * a.dir > 0) {            // 最後は元の側から
      a.ghosts.push({ x: a.x, dy: 0, a: 0.5, pose: 'pounce' });
      a.x = d.x - a.dir * 52;
    }
    a.pose = 'swipe'; await wait(8);
    for (let i = 0; i < 3; i++) { a.x += a.dir * 4; await frame(); }
    a.pose = 'rake';
    clawMarks(d.x, FLOOR - 26, a.dir, true);
    await resolve(a, d, o, d.x, FLOOR - 24);
    darkTarget = 0;
    await wait(20);
    await laguzFinish(a, d);
    return;
  }
  // 虎「猛虎咆哮撃」：ほえて衝撃波で相手をひるませ → 高く飛びかかって全体重でかみつく
  await moveTo(a, d.x - a.dir * 76, 4);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'roar');
  a.pose = 'roar';
  for (let i = 0; i < 36; i++) {
    if (i % 6 === 0) {                        // 衝撃波の輪
      for (let k = 0; k < 20; k++) { const g = (k / 20 - 0.5) * Math.PI * 0.9; addPx(a.x + a.dir * 22, FLOOR - 34, 20, ORANGE, a.dir * Math.cos(g) * 3, Math.sin(g) * 3, 1); }
      shake = Math.max(shake, 4); shakeAmp = 2;
    }
    if (i === 14) { d.pose = 'hurt'; d.flash = 6; }
    await frame();
  }
  a.pose = 'crouch'; await wait(10);
  a.pose = 'pounce';
  const sx = a.x, tx = d.x - a.dir * c.brange, n = 18;
  for (let i = 1; i <= n; i++) {
    a.ghosts.push({ x: a.x, dy: a.dy, a: 0.4, pose: 'pounce' });
    a.x = Math.round(sx + (tx - sx) * i / n); a.dy = -Math.round(Math.sin(i / n * Math.PI) * 30);
    await frame();
  }
  a.dy = 0; a.pose = 'bite';
  biteFx(d.x + a.dir * 2, FLOOR - 26, true);
  rocks(d.x, 16); dust(d.x, 22, 2.2);
  await wait(3);
  await resolve(a, d, o, d.x, FLOOR - 24);
  darkTarget = 0;
  await wait(22);
  await laguzFinish(a, d);
}

/* ----- ラグズ（タカ・カラス・赤竜） ----- */
const BIRDS = new Set(['hawk', 'crow']);

const FEATHER = ['#5a5a7a', '#3a3a52', '#24243a', '#14141e'];
// 鳥：はばたきながら元の位置へ戻る
async function birdBack(u) {
  u.pose = 'dodge';
  for (let i = 0; i < 6; i++) { u.dy -= 1; await frame(); }
  const sx = u.x, n = Math.max(10, Math.round(Math.abs(u.home - sx) / 4)), y0 = u.dy;
  for (let i = 1; i <= n; i++) { u.x = Math.round(sx + (u.home - sx) * i / n); u.dy = Math.round(y0 * (1 - i / n)); u.pose = 'fly' + (((T >> 2) & 3) + 1); await frame(); }
  u.x = u.home; u.dy = 0; u.pose = 'idle';
}
// 竜：足踏みしながら後ずさりで戻る
async function dragonBack(u) { await backTo(u, u.home, 2); u.pose = 'idle'; }
async function laguzEnd(a, d, back) {
  if (d.hp <= 0) {
    for (let i = 0; i < 40; i++) {
      d.flash = (i % 6 < 3) ? 2 : 0; d.alpha = 1 - i / 40;
      if (i % 3 === 0) addPx(d.x + (Math.random() * 16 - 8), FLOOR - Math.random() * 34, 18, COOL, 0, -0.6, 2);
      await frame();
    }
    d.alpha = 0;
  }
  const ret = d.hp > 0 ? (async () => { d.pose = 'idle'; await wait(6); await moveTo(d, d.home, 2, false); })() : null;
  await back(a);
  if (ret) await ret;
  a.front = false;
  await wait(12);
}
function feathers(x, y, n, spread = 10) {
  for (let i = 0; i < n; i++) addPx(x + (Math.random() * 2 - 1) * spread, y + (Math.random() * 2 - 1) * spread * 0.6, 30 + (Math.random() * 20 | 0), FEATHER, (Math.random() - 0.5) * 1.2, 0.2 + Math.random() * 0.4, 2);
}
// 竜のブレス：口から相手へ炎の帯を吐く（big で太く長く）
async function breath(a, d, n, big) {
  const mx = a.x + a.dir * 35, my = FLOOR + a.dy - 58, tx = d.x, ty = FLOOR - 22;
  for (let i = 0; i < n; i++) {
    const reach = Math.min(1, (i + 1) / 5);       // 炎の先が口から相手へのびていく
    for (let k = 0; k < (big ? 16 : 10); k++) {
      const t = Math.random() * reach;
      const x = mx + (tx - mx) * t, y = my + (ty - my) * t + (Math.random() - 0.5) * (3 + t * (big ? 22 : 10));
      addPx(x, y, 8 + (Math.random() * 8 | 0), HOT, a.dir * 1.2, (Math.random() - 0.5) * 0.6, big ? 4 : 3);
    }
    if (i % 3 === 0) addPx(tx + (Math.random() - 0.5) * 12, ty - Math.random() * 10, 16, HOT, 0, -1, 3);
    await frame();
  }
}
// 通常攻撃（獣の姿）
async function birdAttack(a, d, o) {
  const c = CHARS[a.base];
  await moveTo(a, d.x - a.dir * (c.brange + 24), 4);
  a.pose = 'ready';
  for (let i = 0; i < 8; i++) { a.dy = -Math.round(i * 1.4); await frame(); }
  // 斜め下へ急降下してつかみかかる（カラスはくちばしで突く）
  a.pose = kin(a) === 'crow' ? 'dive' : 'strike';
  const sx = a.x, sy = a.dy, tx = d.x - a.dir * c.brange, n = 6;
  for (let i = 1; i <= n; i++) { a.ghosts.push({ x: a.x, dy: a.dy, a: 0.35, pose: a.pose }); a.x = Math.round(sx + (tx - sx) * i / n); a.dy = Math.round(sy * (1 - i / n)); await frame(); }
  if (kin(a) === 'crow') { a.pose = 'peck'; feathers(d.x, FLOOR - 30, 6); spark(d.x, FLOOR - 26, false); }
  else { a.pose = 'strike'; await clawMarks(d.x, FLOOR - 26, a.dir, false); }
  await resolve(a, d, o, d.x, FLOOR - 26);
  if (o.two && d.hp > 0) await birdFollow(a, d, o.two);
  await wait(12);
  await laguzEnd(a, d, birdBack);
}
// 鳥の追撃：いったん舞い上がって宙で向きを整え、もう一度上から襲いかかる
async function birdFollow(a, d, o) {
  const c = CHARS[a.base];
  a.pose = 'dodge';
  for (let i = 0; i < 8; i++) { a.x -= a.dir * 2; a.dy -= 2; await frame(); }
  a.pose = 'ready'; await wait(5);
  a.pose = kin(a) === 'crow' ? 'dive' : 'strike';
  const sx = a.x, sy = a.dy, tx = d.x - a.dir * c.brange, n = 5;
  for (let i = 1; i <= n; i++) { a.ghosts.push({ x: a.x, dy: a.dy, a: 0.35, pose: a.pose }); a.x = Math.round(sx + (tx - sx) * i / n); a.dy = Math.round(sy * (1 - i / n)); await frame(); }
  if (kin(a) === 'crow') { a.pose = 'peck'; feathers(d.x, FLOOR - 30, 6); spark(d.x, FLOOR - 26, false); }
  else { a.pose = 'strike'; clawMarks(d.x, FLOOR - 28, a.dir, false, true); }
  await wait(2);
  await resolve(a, d, o, d.x, FLOOR - 28);
}
async function dragonAttack(a, d, o) {
  const c = CHARS[a.base];
  await moveTo(a, d.x - a.dir * c.brange, 2);
  a.pose = 'crouch';                          // 息を吸い込む（口に火の粉が集まる）
  for (let i = 0; i < 16; i++) { if (i % 2 === 0) addPx(a.x + a.dir * (34 + Math.random() * 10), FLOOR + a.dy - 52 + (Math.random() - 0.5) * 10, 10, HOT, -a.dir * 0.8, 0, 1); await frame(); }
  a.pose = 'bite';
  await breath(a, d, 14, false);
  await resolve(a, d, o, d.x, FLOOR - 24);
  if (o.two && d.hp > 0) await dragonFollow(a, d, o.two);
  await wait(14);
  await laguzEnd(a, d, dragonBack);
}
// 竜の追撃：首を引いてから、火の玉を吐きつけて爆発させる
async function dragonFollow(a, d, o) {
  a.pose = 'roar'; await wait(10);
  a.pose = 'bite';
  const x0 = a.x + a.dir * 35, y0 = FLOOR + a.dy - 58;
  let x = x0;
  while ((d.x - x) * a.dir > 0) {
    x += a.dir * 6;
    const y = y0 + (FLOOR - 24 - y0) * Math.min(1, (x - x0) / (d.x - x0));   // 口から相手へ斜めに落ちる
    for (let k = 0; k < 6; k++) addPx(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6, 8, HOT, -a.dir * 0.6, 0, 2);
    await frame();
  }
  for (let k = 0; k < 20; k++) { const g = k / 20 * Math.PI * 2; addPx(d.x, FLOOR - 24, 18, HOT, Math.cos(g) * 1.8, Math.sin(g) * 1.4, 2); }
  shake = Math.max(shake, 6); shakeAmp = 2;
  await resolve(a, d, o, d.x, FLOOR - 24);
}
// 必殺
async function hawkCrit(a, d, o) {
  // タカ「烈風の鉤爪」：空高く舞い上がって見えなくなり → 風をまとって3度すれちがいざまに切り裂く → 真上から急降下して鉤爪を突き立てる
  const c = CHARS[a.base];
  await moveTo(a, d.x - a.dir * 70, 4);
  a.pose = 'ready'; a.glow = 90; darkTarget = 0.65;
  await cutIn(a, 'roar');
  a.pose = 'soar';
  for (let i = 0; i < 18; i++) { a.dy -= 6; a.x += a.dir; if (i % 2 === 0) addPx(a.x, FLOOR + a.dy - 10, 14, COOL, 0, 1, 1); await frame(); }
  const dir0 = a.dir;
  for (let p = 0; p < 3; p++) {
    a.pose = 'dive';
    const sx = d.x - a.dir * 90, ex = d.x + a.dir * 90, n = 10;
    for (let i = 0; i <= n; i++) {
      a.ghosts.push({ x: a.x, dy: a.dy, a: 0.45, pose: 'dive' });
      a.x = Math.round(sx + (ex - sx) * i / n); a.dy = -Math.round(Math.abs(i - n / 2) * 7) - 4;
      for (let k = 0; k < 3; k++) addPx(a.x - a.dir * (14 + k * 6), FLOOR + a.dy - 34 + k, 10, COOL, -a.dir * 1.5, 0, 1);
      if (i === n / 2) { clawMarks(d.x, FLOOR - 24 - p * 3, a.dir, false, p % 2 === 1); d.pose = 'hurt'; d.flash = 4; spark(d.x, FLOOR - 26, false); }
      await frame();
    }
    a.dir = -a.dir;
  }
  a.dir = dir0;
  // 真上から急降下
  a.x = d.x - a.dir * c.brange; a.dy = -100; a.pose = 'strike';
  for (let i = 1; i <= 8; i++) { a.ghosts.push({ x: a.x, dy: a.dy, a: 0.45, pose: 'strike' }); a.dy = Math.round(-100 * (1 - i / 8)); await frame(); }
  clawMarks(d.x, FLOOR - 26, a.dir, true);
  dust(d.x, 14, 1.6); shake = Math.max(shake, 8);
  await resolve(a, d, o, d.x, FLOOR - 26);
  darkTarget = 0;
  await wait(20);
  await laguzEnd(a, d, birdBack);
}
async function crowCrit(a, d, o) {
  // カラス「黒羽の嵐」：大きくはばたいて黒い羽の嵐を起こし、相手を包む → 嵐の中を一直線に突き抜けてくちばしで貫く
  const c = CHARS[a.base];
  await moveTo(a, d.x - a.dir * 70, 4);
  a.pose = 'ready'; a.glow = 90; darkTarget = 0.7;
  await cutIn(a, 'roar');
  for (let i = 0; i < 44; i++) {
    a.pose = 'fly' + (((i >> 1) & 3) + 1);
    const g = i * 0.5;
    for (let k = 0; k < 3; k++) {
      const r = 22 - (i % 11);
      addPx(d.x + Math.cos(g + k * 2.1) * r, FLOOR - 24 + Math.sin(g + k * 2.1) * r * 0.7, 18, FEATHER, -Math.sin(g + k * 2.1) * 1.2, Math.cos(g + k * 2.1) * 0.8, 2);
    }
    if (i % 8 === 0) { d.pose = 'hurt'; d.flash = 3; }
    await frame();
  }
  a.pose = 'dive';
  const sx = a.x, tx = d.x - a.dir * c.brange, n = 6;
  for (let i = 1; i <= n; i++) { a.ghosts.push({ x: a.x, dy: a.dy, a: 0.5, pose: 'dive' }); a.x = Math.round(sx + (tx - sx) * i / n); await frame(); }
  a.pose = 'peck';
  feathers(d.x, FLOOR - 28, 24, 18);
  for (let k = 0; k < 16; k++) addPx(d.x + a.dir * k * 2, FLOOR - 28 + (Math.random() - 0.5) * 4, 14, ['#ffffff', '#ff8080', '#c02020', '#600010'], a.dir * 1.5, 0, 2);
  await resolve(a, d, o, d.x, FLOOR - 26);
  darkTarget = 0;
  await wait(20);
  await laguzEnd(a, d, birdBack);
}
async function dragonCrit(a, d, o) {
  // 赤竜「紅蓮の咆哮」：天へほえて熱をため（足元から火の粉が立ちのぼる）→ 太い炎の奔流を吐き → 相手の足元から火柱が噴き上がる
  const c = CHARS[a.base];
  await moveTo(a, d.x - a.dir * c.brange, 2);
  a.pose = 'crouch'; a.glow = 90; darkTarget = 0.7;
  await cutIn(a, 'roar');
  a.pose = 'roar';
  for (let i = 0; i < 34; i++) {
    for (let k = 0; k < 2; k++) addPx(a.x + (Math.random() - 0.5) * 70, FLOOR - Math.random() * 6, 24, HOT, 0, -1.2 - Math.random(), 2);
    if (i % 8 === 0) { shake = Math.max(shake, 5); shakeAmp = 2; }
    await frame();
  }
  a.pose = 'bite'; flashA = 0.4;
  await breath(a, d, 30, true);
  // 火柱
  for (let i = 0; i < 18; i++) {
    for (let k = 0; k < 5; k++) addPx(d.x + (Math.random() - 0.5) * 16, FLOOR - Math.random() * 6, 20, HOT, (Math.random() - 0.5) * 0.6, -2.5 - Math.random() * 2, 3);
    await frame();
  }
  rocks(d.x, 16); shake = 16; shakeAmp = 3;
  await resolve(a, d, o, d.x, FLOOR - 24);
  darkTarget = 0;
  await wait(22);
  await laguzEnd(a, d, dragonBack);
}

/* ===== 奥義（全クラス共通の演出） =====
   クラスの「攻撃（命中）」の動きをそのまま使い、当たる瞬間（resolve）と前後に共通の演出を重ねる。
   クラスごとの作り直しはいらない。背景はアリーナ全体に重ねる（v5 と同じ考え方） */
let ougiBg = null;
const OUGI = {
  meteor: { name: '流星', col: '#40c060', tcol: '#a0ffb0', band: '#1e5a30' },
  luna:   { name: '月光', col: '#4a78e0', tcol: '#b8d8ff', band: '#1e2e70' },
  sol:    { name: '太陽', col: '#e0b020', tcol: '#ffe070', band: '#6a4a10' },
  aether: { name: '天空', col: '#c8a0ff', tcol: '#eee0ff', band: '#3a2a70' },
  lethal: { name: '瞬殺', col: '#e03040', tcol: '#ffb0b8', band: '#3a0a10', bg: '#000000' },
  sunray: { name: '陽光', col: '#ff9a30', tcol: '#ffd8a0', band: '#6a3010' },
  quake:  { name: '鳴動', col: '#b08050', tcol: '#f0d0a0', band: '#4a3020' },
  impact: { name: '衝撃', col: '#f0e040', tcol: '#fff8b0', band: '#5a5010' },
  earth:  { name: '地の祝福', col: '#60b050', tcol: '#d0ffc0', band: '#2a4a1e', self: true },
  sky:    { name: '空の祝福', col: '#60c8f0', tcol: '#d8f4ff', band: '#1e4a6a', self: true },
  roar:   { name: '咆哮', col: '#d84a30', tcol: '#ffc0a8', band: '#5a1a10', self: true },
  snipe:  { name: '狙撃', col: '#a0d8ff', tcol: '#e0f4ff', band: '#1a3a5a' },
};
const OUGI_ORDER = ['meteor', 'luna', 'sol', 'aether', 'lethal', 'sunray', 'quake', 'impact', 'snipe', 'roar', 'earth', 'sky'];
const MOON = ['#ffffff', '#e0f0ff', '#a8ccff', '#5a88e8', '#2a48a8'];
const SUN = ['#ffffff', '#fff6a0', '#ffd040', '#e0a000'];
const LEAF = ['#ffffff', '#c8ffc8', '#60d880', '#30a050'];
const STAR = ['#ffffff', '#c8ffd0', '#70e090', '#30a050'];
const ZAP = ['#ffffff', '#fffab0', '#f0e040', '#b0a010'];
const SKY = ['#ffffff', '#d8f4ff', '#8ad8ff', '#3a98d8'];
const SOIL = ['#f0dca0', '#c8a060', '#8a6438', '#5a3e20'];
const midY = u => FLOOR + u.dy - 20;   // 体のまん中の高さ（飛んでいれば上）

// アリーナ全体に重ねる背景
function drawOugiBg() {
  const t = ougiBg.t, k = ougiBg.k;
  const veil = (c) => { ctx.fillStyle = c; ctx.fillRect(0, 0, cv.width, 120 * S); };
  const disc = (mx, my, r, inner, edge) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) R(mx + x, my + y, 1, 1, x * x + y * y > (r - 2) * (r - 2) ? edge : inner); };
  const rays = (mx, my, n, len, col, spin) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + t / spin; for (let q = 12; q < len; q++) R(mx + Math.cos(a) * q, my + Math.sin(a) * q, 1, 1, `rgba(${col},${0.45 - q / (len * 2.2)})`); } };
  if (k === 'meteor') {          // 緑の星が降りそそぐ
    for (let i = 0; i < 22; i++) {
      const x = ((i * 47 + t * 3) % (W + 40)) - 20, y = ((i * 29 + t * 4) % 130) - 10;
      for (let q = 1; q < 7; q++) R(x - q, y - q, 1, 1, `rgba(120,255,150,${0.5 - q * 0.07})`);
      R(x - 1, y, 3, 1, '#c8ffd0'); R(x, y - 1, 1, 3, '#c8ffd0'); R(x, y, 1, 1, '#ffffff');
    }
  } else if (k === 'luna' || (k === 'aether' && ougiBg.phase === 2)) {   // 青い月とさしこむ光
    veil('rgba(20,40,120,0.35)');
    const mx = 128, my = 26, r = 13;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const cres = (x + 5) * (x + 5) + (y - 2) * (y - 2) < (r - 2) * (r - 2);
      R(mx + x, my + y, 1, 1, cres ? 'rgba(160,200,255,0.25)' : (x * x + y * y > (r - 1) * (r - 1) ? '#a8d0ff' : '#e8f4ff'));
    }
    for (let i = 0; i < 6; i++) { const x = 40 + i * 36 + Math.round(Math.sin((t + i * 9) / 10) * 4); ctx.fillStyle = `rgba(150,200,255,${0.10 + 0.05 * Math.sin((t + i * 7) / 6)})`; ctx.fillRect(x * S, 0, 10 * S, 120 * S); }
  } else if (k === 'sol' || k === 'aether') {   // 黄色い太陽と回る光（天空は太陽 → 月光）
    veil(k === 'aether' ? 'rgba(70,40,120,0.30)' : 'rgba(120,80,10,0.25)');
    rays(128, 26, 12, 60, '255,220,100', 30);
    disc(128, 26, 10, '#fff2a0', '#ffc030');
  } else if (k === 'lethal') {   // 赤黒い空と、横に走る一本の線
    veil('rgba(40,0,6,0.55)');
    for (let i = 0; i < 10; i++) R(((i * 61 + t * 14) % (W + 60)) - 30, 10 + i * 11, 30 + (i % 3) * 12, 1, 'rgba(255,60,70,0.45)');
  } else if (k === 'sunray') {   // 夕日色の空と、上から降りる光の柱
    veil('rgba(140,60,10,0.28)');
    rays(128, 14, 16, 70, '255,170,80', 40);
    disc(128, 14, 8, '#fff0c0', '#ff9a30');
  } else if (k === 'quake') {    // 地面がうなり、砂が舞い上がる
    veil('rgba(70,40,10,0.30)');
    for (let i = 0; i < 26; i++) R((i * 37 + (t * (i % 3 + 1))) % W, 118 - ((i * 13 + t * 2) % 60), 2, 1, 'rgba(220,180,120,0.55)');
  } else if (k === 'impact') {   // 黄色い稲光が走る
    veil('rgba(60,60,0,0.25)');
    if ((t >> 2) % 3 === 0) { let x = 40 + ((t * 53) % 170), y = 0; while (y < 100) { const nx = x + ((y * 7 + t) % 9) - 4; for (let q = 0; q < 6; q++) R(x + (nx - x) * q / 6, y + q, 1, 1, '#fff8b0'); x = nx; y += 6; } }
  } else if (k === 'snipe') {    // 暗くして、遠くまで見通す照準の線
    veil('rgba(0,20,40,0.40)');
    for (let y = 8; y < 118; y += 6) R(0, y, W, 1, 'rgba(160,216,255,0.08)');
  } else if (k === 'roar') {     // 赤い空気が震える
    veil('rgba(90,10,0,0.30)');
    for (let i = 0; i < 4; i++) { const r = ((t * 2 + i * 22) % 90); ctx.strokeStyle = `rgba(255,120,80,${0.4 - r / 240})`; ctx.lineWidth = S; ctx.beginPath(); ctx.arc(ougiBg.x * S, (ougiBg.y) * S, r * S, 0, Math.PI * 2); ctx.stroke(); }
  } else if (k === 'earth') {    // 地面から緑の光
    veil('rgba(20,60,10,0.30)');
    for (let i = 0; i < 14; i++) R((i * 41 + 7) % W, 118 - ((t * 1.5 + i * 17) % 110), 1, 3, 'rgba(150,240,120,0.45)');
  } else if (k === 'sky') {      // 空が明るく開け、光の羽が舞う
    veil('rgba(120,200,255,0.25)');
    for (let i = 0; i < 6; i++) { const x = 30 + i * 40; ctx.fillStyle = 'rgba(220,245,255,0.12)'; ctx.fillRect(x * S, 0, 12 * S, 120 * S); }
    for (let i = 0; i < 12; i++) { const x = (i * 43 + Math.sin((t + i * 10) / 12) * 8) % W, y = ((i * 23 + t) % 120); R(x, y, 2, 1, '#ffffff'); R(x + 1, y + 1, 1, 1, '#c8ecff'); }
  }
}

// 1回分の当たり（クラスの resolve をそのまま使う）。col は数字の色
async function hit1(a, d, o, impX, impY, extra = {}) {
  if (d.hp <= 0) return 0;
  const before = d.hp;
  await resolve0(a, d, Object.assign({}, o, { ougi: null }, extra), impX, impY);
  return before - d.hp;
}
// 攻撃した側が、ためのポーズと当てるポーズを素早く行き来する（流星・天空の2撃目）
async function reStrike(a, n = 2) {
  const hitPose = a.pose, prep = a.prevPose && a.prevPose !== hitPose ? a.prevPose : 'idle';
  a.ghosts.push({ x: a.x, dy: a.dy, a: 0.5, pose: hitPose });
  a.pose = prep; await wait(n);
  a.pose = hitPose;
}
// 攻撃した側の前から相手へ光の線（近くても遠くても同じに見える）
function streak(a, d, cols, y0, y1) {
  const x0 = a.x + a.dir * 10, x1 = d.x;
  const n = Math.max(4, Math.abs(x1 - x0));
  for (let i = 0; i <= n; i += 1) addPx(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, 6 + ((i * 3) % 5), cols);
}
function crescent(x, y, dir, r, cols) {
  for (let s = -70; s <= 70; s += 4) { const t = s * Math.PI / 180; for (let w = 0; w < 3; w++) addPx(x + dir * Math.cos(t) * (r - w * 2) - dir * 6, y + Math.sin(t) * (r - w * 2), 14 + w * 2, cols, dir * 0.6, 0, w === 0 ? 2 : 1); }
}
function ring(x, y, r, cols, n = 24, out = 1) {
  for (let i = 0; i < n; i++) { const g = i / n * Math.PI * 2; addPx(x + Math.cos(g) * r, y + Math.sin(g) * r * 1.1, 18, cols, Math.cos(g) * out, Math.sin(g) * out, 2); }
}
function healUp(u, n, cols = LEAF) {
  ring(u.x, midY(u), 14, SUN, 24, -0.6);
  for (let i = 0; i < 10; i++) addPx(u.x + (Math.random() * 20 - 10), FLOOR + u.dy - 4 - Math.random() * 20, 26, cols, 0, -0.9, 1);
  if (u.healQ) { n = u.healQ.length ? u.healQ.shift() : 0; if (!n) return; }
  u.hp = Math.min(u.max, u.hp + n); u.disp = u.hp;
  popText('+' + n, u.x, FLOOR + u.dy - 44, '#70f090', 13);
}

// 当たる瞬間の演出（奥義ごと）。o.dmg が1撃のダメージ
const OUGI_HIT = {
  // 流星：半分のダメージで5回。たたたん → 4撃目 → 5撃目は大きく
  async meteor(a, d, o, ix, iy) {
    const h = Math.max(1, Math.round(o.dmg / 2));
    for (let n = 0; n < 5 && d.hp > 0; n++) {
      if (n) await reStrike(a, n < 3 ? 2 : 4);
      streak(a, d, STAR, midY(a), iy);
      for (let q = 0; q < 6; q++) addPx(ix + (Math.random() * 10 - 5), iy + (Math.random() * 10 - 5), 10, STAR, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
      await hit1(a, d, o, ix, iy, { dmg: h, numDx: [0, -8, 8, -4, 4][n], numDy: -n * 4, numCol: '#a0ffb0', kb: n === 4 ? 6 : 1, shake: n === 4 ? 12 : 4 });
      await wait(n === 3 ? 6 : 2);
    }
  },
  // 月光：青い三日月の一撃（守備を無視 → 少し大きいダメージ）
  async luna(a, d, o, ix, iy) {
    crescent(d.x, iy, a.dir, 16, MOON); flashA = 0.5;
    await hit1(a, d, o, ix, iy, { dmg: Math.round(o.dmg * 1.6), numCol: '#b8d8ff', kb: 6, shake: 16, amp: 3 });
  },
  // 太陽：当てたぶん回復
  async sol(a, d, o, ix, iy) {
    ring(ix, iy, 10, SUN, 18, 1.2);
    const got = await hit1(a, d, o, ix, iy, { numCol: '#ffe070' });
    await wait(6);
    for (let i = 0; i < 16; i++) addPx(d.x + (a.x - d.x) * i / 16, iy - Math.sin(i / 16 * Math.PI) * 14, 16 + i, SUN);   // 光が自分へ戻る
    await wait(10);
    if (got) healUp(a, got);
    await wait(16);
  },
  // 天空：太陽の一撃 → 背景が月に変わって月光の一撃
  async aether(a, d, o, ix, iy) {
    ring(ix, iy, 10, SUN, 18, 1.2);
    const got = await hit1(a, d, o, ix, iy, { numCol: '#ffe070' });
    if (got) { await wait(6); healUp(a, got); }
    await wait(14);
    if (d.hp > 0) {
      ougiBg.phase = 2; flashA = 0.6;
      await reStrike(a, 6);
      crescent(d.x, iy, a.dir, 16, MOON);
      await hit1(a, d, o, ix, iy, { dmg: Math.round(o.dmg * 1.6), numCol: '#b8d8ff', kb: 6, shake: 16, amp: 3 });
    }
    await wait(10);
  },
  // 瞬殺：時が止まったように静まり → 一本の赤い線 → 一撃で倒れる
  async lethal(a, d, o, ix, iy) {
    darkTarget = 0.85; await wait(12);
    for (let x = -40; x <= 40; x++) addPx(d.x + x, iy - x * 0.25, 18 + Math.abs(x) % 4, ['#ffffff', '#ffd0d4', '#ff3040', '#800010']);
    flashA = 1; await wait(10);
    await hit1(a, d, o, ix, iy, { dmg: d.hp, numCol: '#ff4050', kb: 8, shake: 20, amp: 3, label: '瞬殺' });
    darkTarget = 0.55;
  },
  // 陽光：空から光の柱が相手に落ち、半分を回復
  async sunray(a, d, o, ix, iy) {
    for (let i = 0; i < 14; i++) { for (let k = 0; k < 6; k++) addPx(d.x + (Math.random() * 10 - 5), i * 8 - 10 + Math.random() * 8, 12, ORANGE, 0, 2.5); await frame(); }
    const got = await hit1(a, d, o, ix, iy, { dmg: Math.round(o.dmg * 1.4), numCol: '#ffc080', shake: 10 });
    await wait(10);
    if (got) healUp(a, Math.max(1, Math.round(got / 2)), ORANGE);
    await wait(16);
  },
  // 鳴動：地面が割れて揺れ、体格の分だけ重い一撃
  async quake(a, d, o, ix, iy) {
    shake = 20; shakeAmp = 2;
    for (let x = Math.min(a.x, d.x); x <= Math.max(a.x, d.x); x += 3) addPx(x, FLOOR + 1, 20, SOIL, 0, -1.2 - Math.random(), 2, 0.12);
    rocks(d.x, 14);
    await wait(6);
    await hit1(a, d, o, ix, iy, { dmg: Math.round(o.dmg * 1.5), numCol: '#f0d0a0', kb: 5, shake: 18, amp: 3 });
  },
  // 衝撃：雷のような輪 → 当たると「麻痺」
  async impact(a, d, o, ix, iy) {
    ring(ix, iy, 6, ZAP, 28, 2.2); flashA = 0.4;
    await hit1(a, d, o, ix, iy, { dmg: Math.round(o.dmg * 1.4), numCol: '#fff8b0', kb: 4, shake: 12, amp: 2 });
    if (d.hp > 0) {
      for (let i = 0; i < 24; i++) { if (i % 2 === 0) for (let k = 0; k < 4; k++) addPx(d.x + (Math.random() * 18 - 9), midY(d) + (Math.random() * 30 - 15), 6, ZAP); d.flash = i % 4 < 2 ? 2 : 0; await frame(); }
      popText('麻痺', d.x, FLOOR + d.dy - 56, '#fff060', 10);
    }
  },
  // 狙撃：照準が相手に合い、当たると「眠り」
  async snipe(a, d, o, ix, iy) {
    await hit1(a, d, o, ix, iy, { numCol: '#e0f4ff' });
    if (d.hp > 0) {
      d.sleep = 70;
      popText('眠り', d.x, FLOOR + d.dy - 56, '#c8d8ff', 10);
      await wait(30);
    }
  },
};

// 攻撃の前の演出（ため・照準など）
const OUGI_PRE = {
  luna: async (a) => {   // 青い光が集まる
    for (let i = 0; i < 24; i++) { const g = Math.random() * Math.PI * 2, r = 20 + Math.random() * 10; addPx(a.x + Math.cos(g) * r, midY(a) - 6 + Math.sin(g) * r, 12, MOON, -Math.cos(g) * r / 11, -Math.sin(g) * r / 11, 1); await frame(); }
  },
  snipe: async (a, d) => {  // 相手に照準の十字が縮んでいく
    for (let i = 0; i < 30; i++) {
      const r = Math.max(5, 26 - i), y = midY(d);
      for (let q = -r; q <= r; q += 2) { addPx(d.x + q, y - r, 2, ['#c8ecff']); addPx(d.x + q, y + r, 2, ['#c8ecff']); addPx(d.x - r, y + q, 2, ['#c8ecff']); addPx(d.x + r, y + q, 2, ['#c8ecff']); }
      for (let q = -4; q <= 4; q++) { addPx(d.x + q, y, 2, ['#ff6070']); addPx(d.x, y + q, 2, ['#ff6070']); }
      await frame();
    }
  },
  quake: async (a) => { for (let i = 0; i < 16; i++) { shake = 3; shakeAmp = 1; if (i % 2 === 0) dust(a.x, 2, 10); await frame(); } },
  impact: async (a) => { for (let i = 0; i < 16; i++) { if (i % 2 === 0) addPx(a.x + (Math.random() * 20 - 10), midY(a) + (Math.random() * 30 - 15), 8, ZAP, 0, 0, 1); await frame(); } },
};

// その場で働く奥義（攻撃しない）
const OUGI_SELF = {
  // 咆哮：ほえて、相手の力・魔力・速さを下げる
  async roar(a, d) {
    a.pose = a.beast && a.kind !== a.base ? 'roar' : 'crouch';
    ougiBg.x = a.x; ougiBg.y = midY(a) - 6;
    for (let i = 0; i < 30; i++) { if (i % 6 === 0) { ring(a.x + a.dir * 6, midY(a) - 6, 6, ['#ffffff', '#ffc0a8', '#ff7050', '#c03020'], 26, 2.4); shake = 4; shakeAmp = 1; } await frame(); }
    d.pose = 'hurt'; d.flash = 8;
    ['力 -3', '魔力 -3', '速さ -3'].forEach((s, i) => setTimeoutFrames(i * 8, () => popText(s, d.x, FLOOR + d.dy - 48 + i * 10, '#ff9080', 8)));
    for (let i = 0; i < 24; i++) { if (i % 3 === 0) addPx(d.x + (Math.random() * 16 - 8), midY(d) - 16, 20, ['#ff9080', '#e04030', '#801810'], 0, 1.2, 1); await frame(); }
    await wait(20); a.pose = 'idle'; d.pose = 'idle';
  },
  // 地の祝福：足元から緑の光が立ちのぼり、下がった能力が戻る
  async earth(a) {
    for (let i = 0; i < 40; i++) { for (let k = 0; k < 2; k++) addPx(a.x + (Math.random() * 24 - 12), FLOOR - 1, 24, LEAF, 0, -1.2 - Math.random(), 1); if (i % 10 === 0) ring(a.x, FLOOR - 2, 12, LEAF, 18, 0.8); await frame(); }
    a.glow = 0; popText('能力が元に戻った', a.x, FLOOR + a.dy - 48, '#b8ffb0', 7);
    await wait(30);
  },
  // 空の祝福：空から光の羽が降り、HPを20%回復
  async sky(a) {
    for (let i = 0; i < 36; i++) { if (i % 2 === 0) addPx(a.x + (Math.random() * 30 - 15), FLOOR + a.dy - 70, 30, SKY, (Math.random() - 0.5) * 0.4, 1.3, 2); await frame(); }
    a.hp = Math.max(1, a.hp - 0);
    healUp(a, Math.max(1, Math.ceil(a.max * 0.2)), SKY);
    await wait(36);
  },
};
const frameTimers = [];
function setTimeoutFrames(n, f) { frameTimers.push({ n, f }); }

async function ougiAct(a, d, k, o = {}) {
  const O = OUGI[k];
  ougiBg = { k, t: 0, phase: 1, x: a.x, y: midY(a) };
  a.glow = 40; darkTarget = 0.55;
  await cutIn(a, a.beast && a.kind !== a.base ? 'roar' : 'idle', { title: O.name, sub: '奥義', color: O.tcol, accent: O.col, band: O.band, bg: O.bg });
  a.glow = 0;
  if (OUGI_SELF[k]) { await OUGI_SELF[k](a, d); }
  else {
    if (OUGI_PRE[k]) await OUGI_PRE[k](a, d);
    const done = act(a, d, Object.assign({ hit: true, ougi: k }, o));
    // 当たり終えたら背景を消す（帰る動きはクラスのまま）
    await done;
  }
  ougiBg = null; darkTarget = 0;
}

/* ===== 再生 ===== */
function resetUnits() {
  if (typeof projs !== "undefined") projs.length = 0;
  for (const u of Object.values(units)) Object.assign(u, { sleep: 0, kind: u.base, st: Object.assign({}, CHARS[u.base].st), hp: u.max, disp: u.max, hpFast: false, x: u.home, alpha: 1, pose: 'idle', dy: 0, flash: 0, glow: 0, ghosts: [], dir: u === units.s ? 1 : -1, front: false });
}

/* ===== 投げ武器（サンプル8 段階1）=====
   手槍・ショートスピア・スレンドスピア（投げ槍）／手斧・ショートアクス・トマホーク（投げ斧）。
   槍・斧を使うクラスが、離れたまま投げる。槍は刺さって消え（手元に次の槍）、斧は回りながら戻ってきて受け取る。
   コマ：tw_ready（振りかぶり）→ tw_rel（投げた瞬間・手は空）→ tw_empty（手が空）→ 斧は tw_catch（受け取り） */
const THROW_W = {
  // 形と大きさは手に持っている武器と同じ（SPR[キャラ].proj）。武器ごとに色だけ変える。
  // pal = 手持ち・飛ぶ武器の両方の色、fly = 飛ぶ武器だけの色（金具など。体の他の部分と同じ色番号なので手持ちでは変えない）
  te_yari:  { name: '手槍', kind: 'lance', pal: { J: '#a07a4a', j: '#5e4428', M: '#eef2f8', m: '#98a4bc' }, fly: {} },
  short_sp: { name: 'ショートスピア', kind: 'lance', pal: { J: '#6a4a30', j: '#3e2a18', M: '#ffffff', m: '#b0c0d8' }, fly: { G: '#e04040', g: '#8a1e22' } },
  slend_sp: { name: 'スレンドスピア', kind: 'lance', pal: { J: '#e4e8f2', j: '#8e96ac', M: '#ffffff', m: '#bfe8ff' }, fly: { G: '#3a6ad8', g: '#24408a' } },
  te_ono:   { name: '手斧', kind: 'axe', spin: 0.5, pal: { J: '#9a6434', j: '#5a3818', M: '#eef2f8', A: '#aab2c2', m: '#808898', a: '#50586a' }, fly: { g: '#3a2414' } },
  short_ax: { name: 'ショートアクス', kind: 'axe', spin: 0.55, pal: { J: '#4a3424', j: '#2a1c12', M: '#ffffff', A: '#c8d4e8', m: '#98a8c0', a: '#5a6a88' }, fly: { g: '#1a120a' } },
  tomahawk: { name: 'トマホーク', kind: 'axe', spin: 0.7, trail: true, pal: { J: '#8a2a20', j: '#5a160f', M: '#fff6d0', A: '#e8c860', m: '#b08a30', a: '#6a5018' }, fly: { g: '#e04a3a' } },
};
// 選ぶのは「段」（槍を投げるクラスなら槍、斧なら斧になる）
const THROW_TIER = [['te_yari', 'te_ono'], ['short_sp', 'short_ax'], ['slend_sp', 'tomahawk']];
const THROW_TIER_NAME = ['手槍／手斧', 'ショートスピア／ショートアクス', 'スレンドスピア／トマホーク'];
const projs = [];   // 飛んでいる武器（キャラより手前に、毎コマ描き直す）
const canThrow = u => !!(SPR[u.base] && SPR[u.base].throw);
function throwWeapon(u, tier) { const t = THROW_TIER[tier] || THROW_TIER[0]; return SPR[u.base].throw === 'axe' ? t[1] : t[0]; }
// キャラの胸の高さ（スプライトのいちばん上から足元までの 55%）
const _topCache = {};
function chestY(u) {
  const k = u.kind + ':' + u.pose;
  if (_topCache[u.kind] === undefined) { const sp = SPR[u.kind], g = sp.frames[poseOf(sp, 'idle')]; let t = 0; while (t < g.length && !/[^.]/.test(g[t])) t++; _topCache[u.kind] = sp.foot[1] - t; }
  return FLOOR + u.dy - Math.round(_topCache[u.kind] * 0.55);
}
function handPos(u, pose) {
  const a = (SPR[u.kind].anch || {})[pose] || [12, -26];
  return [u.x + u.dir * a[0], FLOOR + u.dy + a[1]];
}
const OUTLINE = '#16121e';
function drawPxSet(m, alpha = 1) {
  // 点の集まりを、まわりに暗い輪郭をつけて描く（地面や背景の上でも見えるように）
  ctx.globalAlpha = alpha;
  for (const k of m.keys()) { const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!m.has((x + dx) + ',' + (y + dy))) R(x + dx, y + dy, 1, 1, OUTLINE); }
  for (const [k, c] of m) { const [x, y] = k.split(',').map(Number); R(x, y, 1, 1, c); }
  ctx.globalAlpha = 1;
}
function drawWeaponRot(x, y, u, w, ang) {
  // 手持ちと同じ絵（SPR[u.base].proj、右向き）を、右向きの世界での角度 ang だけ回して (x,y) を中心に描く。左向きのキャラは左右反転
  const g = SPR[u.base].proj, gh = g.length, gw = g[0].length, cx = (gw - 1) / 2, cy = (gh - 1) / 2, dir = u.dir;
  const P = Object.assign({}, SPR[u.base].pal, w.pal, w.fly), m = new Map();
  const r = Math.ceil(Math.hypot(gw, gh) / 2) + 1, c = Math.cos(ang), s = Math.sin(ang);
  for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
    const lx = ox * dir, ly = oy;                       // 右向きの世界へ
    const sx = Math.round(cx + lx * c + ly * s), sy = Math.round(cy - lx * s + ly * c);
    if (sx < 0 || sy < 0 || sx >= gw || sy >= gh) continue;
    const ch = g[sy][sx]; if (ch === '.') continue;
    m.set(Math.round(x + ox) + ',' + Math.round(y + oy), P[ch]);
  }
  drawPxSet(m);
}
// 飛ぶ道：p0 から p1 へ、山なり h の放物線を n コマで
function arcPt(p0, p1, h, t) { return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t - h * 4 * t * (1 - t)]; }
function setHeldWeapon(u, w) {
  // 手に持っている槍・斧の色をその武器の色に（持ち替えた見た目）。null で元に戻す
  if (!u.palOv) u.palOv = {};
  if (u._wpnBackup === undefined) u._wpnBackup = Object.assign({}, u.palOv[u.base] || {});
  u.palOv[u.base] = w ? Object.assign({}, u._wpnBackup, w.pal) : u._wpnBackup;
  if (!w) delete u._wpnBackup;
}
async function throwAttack(a, d, o) {
  const w = THROW_W[o.w || throwWeapon(a, 0)];
  a.front = true; setHeldWeapon(a, w);
  a.pose = 'tw_ready'; await wait(14);
  a.pose = 'tw_rel';
  const p0 = handPos(a, 'tw_rel');
  const tgt = [d.x + d.dir * 2, chestY(d)];
  const dist = Math.abs(tgt[0] - p0[0]);
  if (w.kind === 'lance') {
    // 投げ槍：山なりに飛び、穂先から当たる
    const n = Math.round(dist / 6) + 4, h = 6 + dist * 0.06;
    // 槍の絵は真ん中が基準なので、穂先が相手に届くところで止める
    const halfL = SPR[a.base].proj[0].length / 2, tgtC = [tgt[0] - a.dir * (halfL - 4), tgt[1]];
    let prev = p0, dodged = false;
    for (let i = 1; i <= n; i++) {
      const t = i / n, p = arcPt(p0, o.hit ? tgtC : tgt, h, t);
      const ang = Math.atan2(p[1] - prev[1], p[0] - prev[0]);
      if (i % 2 === 0) addPx(prev[0], prev[1], 6, ['#ffffff', '#e8e0c8', '#b8a890'], 0, 0);
      const la = Math.atan2(p[1] - prev[1], (p[0] - prev[0]) * a.dir); projs.length = 0; projs.push(() => drawWeaponRot(p[0], p[1], a, w, la));
      if (!o.hit && !dodged && t > 0.55) { dodged = true; resolve(a, d, o, 0, 0); }
      if (i === 3) a.pose = 'tw_empty';
      prev = p; await frame();
    }
    if (o.hit) {
      projs.length = 0;
      await resolve(a, d, o, tgt[0], tgt[1]);
    } else {
      // 外れ：そのまま飛んでいき、後ろの地面に刺さる
      let vx = (tgt[0] - prev[0]) / 1, p = tgt.slice(), vy = 1.2, ang = 0;
      vx = a.dir * Math.max(4, Math.abs(dist / n));
      const half = SPR[a.base].proj[0].length / 2;
      for (let i = 0; i < 40 && p[1] + half * Math.sin(ang) < FLOOR + 3; i++) { const q = [p[0] + vx, p[1] + vy]; vy += 0.35; ang = Math.atan2(q[1] - p[1], (q[0] - p[0]) * a.dir); p = q; const pp = p, aa = ang; projs.length = 0; projs.push(() => drawWeaponRot(pp[0], pp[1], a, w, aa)); await frame(); }
      const stuck = [p[0], p[1], ang]; dust(stuck[0] + a.dir * half * Math.cos(ang), 4, 4);
      for (let i = 0; i < 30; i++) { projs.length = 0; if (i < 22 || i % 2) projs.push(() => drawWeaponRot(stuck[0], stuck[1], a, w, stuck[2])); await frame(); }
      projs.length = 0;
    }
    await wait(10);
    a.pose = 'idle';     // 背中から次の槍を取り出す
  } else {
    // 投げ斧：回りながら飛び、当たったら弧を描いて手元へ戻る
    const n = Math.round(dist / 5) + 4;
    let rot = 0, p = p0;
    const spinDraw = () => { const q = p, rr = rot; projs.length = 0; projs.push(() => drawWeaponRot(q[0], q[1], a, w, rr)); if (w.trail) addPx(q[0], q[1], 8, ['#fff6d0', '#e8c860', '#b08a30'], 0, 0); };
    let dodged = false;
    for (let i = 1; i <= n; i++) {
      const t = i / n; p = arcPt(p0, tgt, 8, t); rot += w.spin;
      if (!o.hit && !dodged && t > 0.55) { dodged = true; resolve(a, d, o, 0, 0); }
      if (i === 3) a.pose = 'tw_empty';
      spinDraw(); await frame();
    }
    let far = tgt;
    if (o.hit) {
      // 当たった瞬間に少しはね返る
      projs.length = 0; projs.push(() => drawWeaponRot(tgt[0], tgt[1], a, w, rot));
      await resolve(a, d, o, tgt[0], tgt[1]);
    } else {
      far = [tgt[0] + a.dir * 34, tgt[1] - 4];
      for (let i = 1; i <= 8; i++) { p = arcPt(tgt, far, 2, i / 8); rot += w.spin; spinDraw(); await frame(); }
    }
    // 戻り：上に大きく弧を描いて、受け取る手へ
    const p1 = handPos(a, 'tw_catch'), back = Math.round(Math.abs(far[0] - p1[0]) / 5) + 6;
    const start = o.hit ? [tgt[0] - a.dir * 4, tgt[1] - 4] : far;
    for (let i = 1; i <= back; i++) {
      p = arcPt(start, p1, 22, i / back); rot += w.spin;
      if (i === back - 3) a.pose = 'tw_catch';
      spinDraw(); await frame();
    }
    projs.length = 0;
    a.pose = 'tw_catch'; addPx(p1[0], p1[1], 6, ['#ffffff', '#fff2a0'], 0, -0.4); await wait(10);
    a.pose = 'idle';
  }
  setHeldWeapon(a, null);
  await finish(a, d);
}

/* ===== 魔法の武器（サンプル8 段階2）=====
   ソニックソード・ルーンソード（剣）／フレイムランス（槍）／ボルトアクス（斧）／ブライトボウ（弓）。
   離れた位置から、ふだんの構え→振り（突き・射る）に合わせて魔法を飛ばす。必殺の動きはなし */
const WIND = ['#ffffff', '#e0fff4', '#90f0d0', '#40c0a0', '#208070'];
const RUNE = ['#ffffff', '#f0d8ff', '#c090ff', '#8040d0', '#401870'];
const MW = {
  sonic:  { name: 'ソニックソード', fam: 'sword' },
  rune:   { name: 'ルーンソード', fam: 'sword' },
  flance: { name: 'フレイムランス', fam: 'lance' },
  bolt:   { name: 'ボルトアクス', fam: 'axe' },
  bright: { name: 'ブライトボウ', fam: 'bow' },
};
const MW_ORDER = ['sonic', 'rune', 'flance', 'bolt', 'bright'];
const FAM = { allen: 'sword', shizuka: 'sword', ranger: 'sword', sknight: 'sword', sknight_f: 'sword',
  soldier: 'lance', soldier_f: 'lance', armor: 'lance', lknight: 'lance', lknight_f: 'lance', pegasus: 'lance',
  warrior: 'axe', bandit: 'axe', aknight: 'axe', aknight_f: 'axe', dragon: 'axe', dragon_f: 'axe',
  archer: 'bow', archer_f: 'bow', bknight: 'bow', bknight_m: 'bow' };
const FAM_POSE = { sword: ['raise', 'swing'], lance: ['ready', 'thrust'], axe: ['raise', 'swing'], bow: ['aim', 'shot'] };
const canMW = (u, k) => FAM[u.base] === MW[k].fam;
// 剣・槍・斧・弓の使い手が使える魔法の武器（剣は2種あるので、選んだ方。合わなければその種類の最初）
function mwFor(u, k) { if (canMW(u, k)) return k; return MW_ORDER.find(x => MW[x].fam === FAM[u.base]); }
const tipOf = u => [u.x + u.dir * 16, chestY(u) - 3];
// そのポーズの絵のいちばん上の点（掲げた剣先・斧の刃など）を、画面の座標で
function topPixel(u, pose) {
  const sp = SPR[u.kind], g = sp.frames[poseOf(sp, pose)];
  for (let r = 0; r < g.length; r++) { const i = g[r].search(/[^.]/); if (i >= 0) { const lx = i - sp.foot[0]; return [u.x + u.dir * lx, FLOOR + u.dy + r - sp.foot[1]]; } }
  return tipOf(u);
}
function aura(x, y, cols, n = 3, r = 9) {
  for (let i = 0; i < n; i++) { const g = Math.random() * Math.PI * 2; addPx(x + Math.cos(g) * r, y + Math.sin(g) * r, 10, cols, -Math.cos(g) * r / 10, -Math.sin(g) * r / 10, 1); }
}
function disc(x, y, r, col) { for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) if (ox * ox + oy * oy <= r * r + r * 0.6) R(Math.round(x + ox), Math.round(y + oy), 1, 1, col); }
// 三日月の刃（dir の向きにふくらむ）：外側から 濃い→明るい→白 の3重
function drawCrescent(x, y, dir, h, cols) {
  for (let k = 0; k < 3; k++) for (let s = -h; s <= h; s++) {
    const t = s / h, bulge = Math.round((1 - t * t) * (7 - k * 2));
    const w = Math.round((1 - t * t) * 3) + 1;
    for (let q = 0; q < w; q++) R(Math.round(x + dir * (bulge - q - k)), Math.round(y + s), 1, 1, cols[k]);
  }
}
async function mwAttack(a, d, o) {
  const k = o.mw, fam = FAM[a.base], [pre, act] = FAM_POSE[fam];
  a.front = true;
  const cols = { sonic: WIND, rune: RUNE, flance: FIRE, bolt: ZAP, bright: LIGHT }[k];
  // ためる：武器の先に魔力が集まる
  a.pose = pre;
  for (let i = 0; i < (k === 'sonic' ? 0 : 18); i++) { const [x, y] = (fam === 'sword' || fam === 'axe') ? topPixel(a, pre) : tipOf(a); aura(x, y + 2, cols); await frame(); }
  a.pose = act;
  const [x0, y0] = tipOf(a), tx = d.x, ty = chestY(d);
  let dodged = false;
  const dodge = t => { if (!o.hit && !dodged && t > 0.5) { dodged = true; resolve(a, d, o, 0, 0); } };
  if (k === 'sonic') {
    // 剣を天に掲げる → 剣先から4つのかまいたちが飛び出して相手を囲む → 2秒そのまま回る → 一斉に当たる（2026-11-23 ガトー指示）
    a.pose = 'raise';
    const [sx0, sy0] = topPixel(a, 'raise');                      // 掲げた剣先
    for (let i = 0; i < 24; i++) { aura(sx0, sy0, WIND, 3, 10); if (i > 12) addPx(sx0, sy0, 4, ['#ffffff', '#e0fff4'], 0, 0, 2); await frame(); }
    const cx = d.x, cy = chestY(d), R0 = 26;
    const slots = [0, 1, 2, 3].map(q => Math.PI / 4 + q * Math.PI / 2);   // 斜め4方向
    const pos = (q, r, ph) => [cx + Math.cos(slots[q] + ph) * r, cy + Math.sin(slots[q] + ph) * r * 0.85];
    // かまいたちの絵：中心に向かって刃をむけた三日月（左右どちらに開くかは位置で決める）
    const blade = (x, y) => drawCrescent(x, y, x < cx ? 1 : -1, 7, ['#208070', '#60e0c0', '#ffffff']);
    for (let i = 1; i <= 14; i++) {                               // 剣先から相手のまわりへ
      const t = i / 14;
      projs.length = 0; projs.push(() => { for (let q = 0; q < 4; q++) { const [px, py] = pos(q, R0, 0); blade(sx0 + (px - sx0) * t, sy0 + (py - sy0) * t - Math.sin(t * Math.PI) * 14); } });
      await frame();
    }
    for (let i = 0; i < 120; i++) {                               // 2秒、相手のまわりをゆっくり回る
      const ph = i * 0.03, r = R0 + Math.sin(i * 0.25) * 1.5;
      projs.length = 0; projs.push(() => { for (let q = 0; q < 4; q++) { const [px, py] = pos(q, r, ph); blade(px, py); } });
      if (i % 3 === 0) { const q = (i / 3) & 3, [px, py] = pos(q, r, ph); addPx(px, py, 12, WIND, 0, 0, 1); }
      if (i === 96) a.pose = 'swing';                              // 剣を振り下ろす合図
      await frame();
    }
    if (!o.hit) resolve(a, d, o, 0, 0);                            // 外れ：寄せる瞬間にとびのく
    const ph = 120 * 0.03;
    for (let i = 1; i <= 6; i++) {                                // 一斉に中心へ
      const r = R0 * (1 - i / 6);
      projs.length = 0; projs.push(() => { for (let q = 0; q < 4; q++) { const [px, py] = pos(q, r, ph); blade(px, py); } });
      await frame();
    }
    projs.length = 0;
    for (let q = 0; q < 4; q++) { const [px, py] = pos(q, 14, ph); segL([px, py], [2 * cx - px, 2 * cy - py], 2, '#e0fff4'); }
    ring(cx, cy, 12, WIND, 24, 1.6);
    if (o.hit) { for (let q = 0; q < 4; q++) { const g = slots[q] + ph; addPx(cx, cy, 14, WIND, Math.cos(g) * 2.5, Math.sin(g) * 2.5, 2); } flashA = 0.3; await resolve(a, d, o, cx, cy); }
    else { for (let i = 0; i < 6; i++) { ring(cx, cy, 4 + i * 3, WIND, 12, 0.6); await frame(); } }
  } else if (k === 'rune') {
    // 紫の魔法陣が開いて、ルーンの玉が飛ぶ → 当たると相手の力を吸い取って回復
    for (let i = 0; i < 6; i++) { ring(x0, y0, 6 + i, RUNE, 12, 0); await frame(); }
    const n = Math.max(10, Math.round(Math.abs(tx - x0) / 5));
    for (let i = 1; i <= n + (o.hit ? 0 : 8); i++) {
      const t = i / n, x = x0 + (tx - x0) * t, y = y0 + (ty - y0) * Math.min(t, 1) + Math.sin(t * 9) * 2;
      const cx = x, cy = y, ph = i * 0.45;
      projs.length = 0; projs.push(() => { disc(cx, cy, 5, '#401870'); disc(cx, cy, 4, '#8040d0'); disc(cx, cy, 2, '#e0c8ff'); R(cx, cy, 1, 1, '#ffffff');
        for (let q = 0; q < 6; q++) { const g = q / 6 * Math.PI * 2 + ph; R(Math.round(cx + Math.cos(g) * 8), Math.round(cy + Math.sin(g) * 8), 2, 2, q % 2 ? '#c090ff' : '#ffffff'); } });
      addPx(x - a.dir * 6, y + Math.random() * 6 - 3, 12, RUNE, -a.dir * 0.4, 0, 2);
      dodge(t); await frame();
    }
    projs.length = 0;
    if (o.hit) {
      ring(tx, ty, 9, RUNE, 20, 1.2);
      await resolve(a, d, o, tx, ty);
      // 吸い取る：紫の粒が相手から自分へ流れて、そのぶん回復
      for (let i = 0; i < 18; i++) { for (let q = 0; q < 2; q++) { const t = Math.random(); addPx(tx + (a.x - tx) * 0.1 * Math.random(), ty + Math.random() * 10 - 5, 22, RUNE, (a.x - tx) / 22, (chestY(a) - ty) / 22 + (Math.random() - 0.5), 1); } await frame(); }
      const hv = a.healQ ? (a.healQ.shift() || 0) : o.dmg;
      if (hv) { a.hp = Math.min(a.max, a.hp + hv); a.disp = a.hp; a.flash = 6;
      ring(a.x, chestY(a), 12, RUNE, 20, -0.6); popText('+' + hv, a.x, FLOOR + a.dy - 44, '#d8a8ff', 13); }
      await wait(14);
    }
  } else if (k === 'flance') {
    // 穂先から炎のかたまりが渦を巻いて飛ぶ
    const n = Math.max(10, Math.round(Math.abs(tx - x0) / 6));
    for (let i = 1; i <= n + (o.hit ? 0 : 6); i++) {
      const t = i / n, x = x0 + (tx - x0) * t, y = y0 + (ty - y0) * Math.min(t, 1);
      const cx = x, cy = y, fl = i % 2;
      projs.length = 0; projs.push(() => { disc(cx, cy, 6, '#c03a20'); disc(cx + a.dir, cy, 5, '#ff7a30'); disc(cx + a.dir * 2, cy - fl, 3, '#ffc040'); disc(cx + a.dir * 2, cy - fl, 1, '#fff2a0'); });
      for (let q = 0; q < 4; q++) addPx(x - a.dir * (4 + Math.random() * 4), y + Math.random() * 8 - 4, 12 + (q * 3), FIRE, -a.dir * (0.6 + Math.random()), -0.4, 2);
      dodge(t); await frame();
    }
    projs.length = 0;
    if (o.hit) { fireBurst(tx, ty, 30, 2.2); await resolve(a, d, o, tx, ty); }
  } else if (k === 'bolt') {
    // 斧を振り下ろすと、相手の頭上に雷雲がわき、稲妻が落ちる
    const bx = o.hit ? tx : d.home + a.dir * 8;
    const cloud = n => () => { for (const [ox, oy, r, c] of [[-10, 8, 6, '#3a3e5a'], [0, 5, 8, '#4a4e6e'], [11, 8, 6, '#3a3e5a'], [-4, 10, 5, '#5a5e80'], [6, 11, 5, '#5a5e80']]) disc(bx + ox, oy, Math.max(1, Math.round(r * n)), c); };
    for (let i = 1; i <= 10; i++) { projs.length = 0; projs.push(cloud(Math.min(1, i / 6))); if (i > 6 && i % 2) addPx(bx + Math.random() * 16 - 8, 12, 4, ZAP, 0, 0, 1); await frame(); }
    if (!o.hit) { resolve(a, d, o, 0, 0); await wait(8); }
    // 稲妻：ジグザグの太い線（白い芯・黄色・こげ茶のふち）と枝分かれ
    const path = [[bx, 12]]; let x = bx;
    for (let y = 12; y < FLOOR; ) { y = Math.min(FLOOR, y + 6 + Math.random() * 6); x = bx + (Math.random() * 12 - 6); path.push([x, y]); }
    const br = path.slice(2, 5).map(([px, py]) => [[px, py], [px + (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 8), py + 10 + Math.random() * 6]]);
    const seg = (p, q, w, c) => { const n = Math.ceil(Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1]))); for (let t = 0; t <= n; t++) { const X = p[0] + (q[0] - p[0]) * t / n, Y = p[1] + (q[1] - p[1]) * t / n; R(Math.round(X - (w >> 1)), Math.round(Y), w, 1, c); } };
    const bolt = on => () => { cloud(1)(); if (!on) return;
      for (let i = 1; i < path.length; i++) { seg(path[i - 1], path[i], 5, '#8a7010'); seg(path[i - 1], path[i], 3, '#f0e040'); seg(path[i - 1], path[i], 1, '#ffffff'); }
      for (const [p, q] of br) { seg(p, q, 3, '#b0a010'); seg(p, q, 1, '#fffab0'); } };
    for (let f = 0; f < 10; f++) {
      projs.length = 0; projs.push(bolt(f < 4 || f === 5 || f === 7));
      if (f === 0) { flashA = 0.6; shake = 8; shakeAmp = 2; for (let i = 0; i < 16; i++) { const g = i / 16 * Math.PI * 2; addPx(bx, FLOOR - 2, 14, ZAP, Math.cos(g) * 2.2, Math.sin(g) * 1 - 0.6, 2); } }
      if (f === 1 && o.hit) resolve(a, d, o, tx, ty);
      await frame();
    }
    projs.length = 0;
    if (o.hit) await wait(10); else dust(bx, 6, 8);
  } else if (k === 'bright') {
    // 光の矢：白く光る矢が、きらめきを残して飛ぶ → 当たると十字に光る
    let x = x0; const y = y0 + 2;
    const end = o.hit ? tx : tx + a.dir * 60;
    while ((end - x) * a.dir > 0) {
      x += a.dir * 8;
      const cx = x;
      projs.length = 0; projs.push(() => {
        for (let q = 0; q < 16; q++) { R(cx - a.dir * q, y - 1, 1, 1, q < 4 ? '#ffffff' : '#fff0a0'); R(cx - a.dir * q, y, 1, 1, '#ffffff'); R(cx - a.dir * q, y + 1, 1, 1, q < 4 ? '#ffffff' : '#e8d070'); }
        for (const [dx, dy] of [[1, 0], [2, 0], [0, -2], [0, 2], [-1, -3], [-1, 3]]) R(cx + a.dir * dx, y + dy, 1, 1, '#ffffff');
        for (let q = 13; q < 16; q++) { R(cx - a.dir * q, y - 3, 1, 1, '#fff6c0'); R(cx - a.dir * q, y + 3, 1, 1, '#fff6c0'); } });
      addPx(x - a.dir * (8 + Math.random() * 10), y + Math.random() * 6 - 3, 12, LIGHT, 0, 0, 1);
      dodge(Math.abs(x - x0) / Math.abs(tx - x0)); await frame();
    }
    projs.length = 0;
    if (o.hit) {
      for (let r = -14; r <= 14; r++) { addPx(tx + r, ty, 14, LIGHT, 0, 0, 1); addPx(tx, ty + r, 14, LIGHT, 0, 0, 1); }
      ring(tx, ty, 8, LIGHT, 16, 1.2); await resolve(a, d, o, tx, ty);
    }
  }
  await wait(14);
  a.pose = 'idle';
  await finish(a, d);
}

/* ===== 魔法（サンプル8 段階3）=====
   炎・雷・風・光 の 19種（遠距離の メティオ・サンダーストーム・ブリザード・パージ は除く）。
   魔道士（リーネ）は炎・雷・風、魔道士（ユーリ）は炎だけ、クレリック・神官は光。
   本を開いて（強い魔法は本を掲げて）魔力をため、魔法ごとの形で当てる。下級→中級→上級で大きく・派手にし、特別な書は色と形を変える */
const CRIMSON = ['#ffffff', '#ffb0a0', '#e83a3a', '#9a1020', '#3a0810'];
const GOLDF = ['#ffffff', '#fff6c0', '#ffd860', '#f0a020', '#b05010'];
const BLUEZ = ['#ffffff', '#d8f0ff', '#80c8ff', '#3a78e8', '#1a3090'];
const PURZ = ['#ffffff', '#f0d8ff', '#c890ff', '#8048e0', '#3a1880'];
const SKYZ = ['#ffffff', '#e0ffff', '#80f0ff', '#30b0e0', '#1060a0'];
const STORM = ['#ffffff', '#d0f0e8', '#80c0b0', '#408878', '#20483e'];
const HOLY = ['#ffffff', '#fffbe0', '#fff0a0', '#e8d070', '#b0a060'];
const PINKL = ['#ffffff', '#ffe0f0', '#ffa0d0', '#e060a8', '#802058'];
const SP_USERS = { fire: ['mage', 'mage_m'], thunder: ['mage', 'mage_m'], wind: ['mage', 'mage_m'], light: ['cleric', 'priest'] };
const EL_COLS = { fire: FIRE, thunder: ZAP, wind: WIND, light: HOLY };
const canSpell = (u, k) => SP_USERS[SPELLS[k].el].includes(u.base);
const isCaster = u => Object.values(SP_USERS).some(l => l.includes(u.base));
const bookOf = u => [u.x + u.dir * 17, FLOOR + u.dy - 24];
function segL(p, q, w, c) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])))); for (let t = 0; t <= n; t++) { const X = p[0] + (q[0] - p[0]) * t / n, Y = p[1] + (q[1] - p[1]) * t / n; R(Math.round(X - (w >> 1)), Math.round(Y - (w >> 1)), w, w, c); } }
function zigzag(x0, y0, x1, y1, step, amp) { const pts = [[x0, y0]], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)); for (let i = 1; i < n; i++) { const t = i / n, nx = -(y1 - y0), ny = (x1 - x0), L = Math.hypot(nx, ny) || 1, o = (Math.random() * 2 - 1) * amp; pts.push([x0 + (x1 - x0) * t + nx / L * o, y0 + (y1 - y0) * t + ny / L * o]); } pts.push([x1, y1]); return pts; }
function drawBolt(pts, w, cols) { for (let k = 0; k < cols.length; k++) for (let i = 1; i < pts.length; i++) segL(pts[i - 1], pts[i], Math.max(1, w - k * 2), cols[k]); }
// 飛び道具：(x0,y0)→(x1,y1) を n コマで。draw(x,y,i) を毎コマ描き直す。外れのときは途中でよけさせ、そのまま奥まで飛ぶ
async function flyShot(a, d, o, x0, y0, x1, y1, n, draw, trail) {
  let dodged = false; const extra = o.hit ? 0 : Math.round(n * 0.6);
  for (let i = 1; i <= n + extra; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    projs.length = 0; projs.push(() => draw(x, y, i));
    if (trail) trail(x, y, i);
    if (!o.hit && !dodged && t > 0.55) { dodged = true; resolve(a, d, o, 0, 0); }
    await frame();
  }
  projs.length = 0;
}
// 相手の場所に落とす魔法：外れなら先によけさせて、元いた場所に落とす
async function aimAt(a, d, o) { if (!o.hit) { resolve(a, d, o, 0, 0); await wait(10); return [d.home, chestY(d)]; } return [d.x, chestY(d)]; }
async function charge(a, cols, n = 16, raise = false) {
  a.pose = raise ? 'raise' : 'cast'; a.glow = n + 6;
  for (let i = 0; i < n; i++) { const [bx, by] = bookOf(a); aura(bx, raise ? by - 12 : by, cols, 2, 12); await frame(); }
}
const SPELLS = {
  // ---------- 炎 ----------
  fire: { name: 'ファイアー', el: 'fire', run: async (a, d, o) => {
    await charge(a, FIRE, 14); const [bx, by] = bookOf(a), tx = d.x, ty = chestY(d);
    await flyShot(a, d, o, bx, by, tx, ty, 12, (x, y) => { disc(x, y, 3, '#ff7a30'); disc(x + a.dir, y, 2, '#ffc040'); R(x + a.dir, y, 1, 1, '#ffffff'); }, (x, y) => addPx(x - a.dir * 3, y + Math.random() * 4 - 2, 10, FIRE, 0, -0.3, 1));
    if (o.hit) { fireBurst(tx, ty, 18, 1.6); await resolve(a, d, o, tx, ty); } } },
  elfire: { name: 'エルファイアー', el: 'fire', run: async (a, d, o) => {
    await charge(a, FIRE, 18); const [bx, by] = bookOf(a), tx = d.x, ty = chestY(d);
    await flyShot(a, d, o, bx, by, tx, ty, 14, (x, y, i) => { disc(x, y, 6, '#c03a20'); disc(x + a.dir, y, 5, '#ff7a30'); disc(x + a.dir * 2, y - (i & 1), 3, '#ffc040'); disc(x + a.dir * 2, y, 1, '#fff2a0');
      for (let q = 0; q < 3; q++) { const g = i * 0.8 + q * 2.1; disc(x - a.dir * 4 + Math.cos(g) * 6, y + Math.sin(g) * 5, 2, '#ff7a30'); } }, (x, y) => { for (let q = 0; q < 3; q++) addPx(x - a.dir * 6, y + Math.random() * 10 - 5, 14, FIRE, -a.dir * 0.6, -0.5, 2); });
    if (o.hit) { fireBurst(tx, ty, 32, 2.4); for (let i = 0; i < 12; i++) addPx(tx + Math.random() * 20 - 10, FLOOR - 4, 24, FIRE, 0, -1.4, 2); await resolve(a, d, o, tx, ty); } } },
  bolganone: { name: 'ボルガノン', el: 'fire', run: async (a, d, o) => {
    await charge(a, FIRE, 20, true); const [tx] = await aimAt(a, d, o);
    // 足元の地面が赤く割れて光り → 溶岩の柱が噴き上がる
    for (let i = 0; i < 14; i++) { projs.length = 0; const w = 4 + i * 1.5; projs.push(() => { for (let x = -w; x <= w; x += 2) R(tx + x, FLOOR - 1 + ((x * 7) & 1), 2, 1, i % 4 < 2 ? '#ff7a30' : '#c03a20'); }); if (i % 3 === 0) shake = 3, shakeAmp = 1; await frame(); }
    flashA = 0.5; shake = 14; shakeAmp = 3;
    for (let f = 0; f < 22; f++) {
      const h = Math.min(FLOOR, f * 12), wv = 9 - Math.max(0, f - 14);
      projs.length = 0; projs.push(() => { for (let y = FLOOR - h; y < FLOOR; y++) { const sw = wv + Math.sin(y * 0.4 + f) * 2; R(tx - sw, y, sw * 2, 1, '#c03a20'); R(tx - sw * 0.65, y, sw * 1.3, 1, '#ff7a30'); R(tx - sw * 0.3, y, sw * 0.6, 1, '#fff2a0'); } });
      if (f % 2 === 0) { fireBurst(tx, FLOOR - h, 6, 1.8); rocks(tx, 2); }
      if (f === 4 && o.hit) resolve(a, d, o, tx, chestY(d));
      await frame();
    }
    projs.length = 0; await wait(12); } },
  guren: { name: '紅蓮の書', el: 'fire', run: async (a, d, o) => {
    await charge(a, CRIMSON, 18); const [bx, by] = bookOf(a), tx = d.x, ty = chestY(d);
    // 紅の火の玉が3つ、うねりながら相手へ → 当たると紅い炎がまとわりつく（燃焼）
    const n = 18; let dodged = false;
    for (let i = 1; i <= n + (o.hit ? 0 : 10); i++) {
      const t = i / n;
      projs.length = 0; projs.push(() => { for (let q = 0; q < 3; q++) { const x = bx + (tx - bx) * t, y = by + (ty - by) * t + Math.sin(t * 7 + q * 2.1) * (10 * (1 - Math.min(t, 1)) + 1) ; disc(x, y, 4, '#3a0810'); disc(x, y, 3, '#9a1020'); disc(x, y, 2, '#e83a3a'); R(x, y, 1, 1, '#ffe0d0'); } });
      addPx(bx + (tx - bx) * t, by + (ty - by) * t + Math.random() * 12 - 6, 14, CRIMSON, 0, -0.4, 2);
      if (!o.hit && !dodged && t > 0.55) { dodged = true; resolve(a, d, o, 0, 0); }
      await frame();
    }
    projs.length = 0;
    if (o.hit) { for (let i = 0; i < 24; i++) { const g = i / 24 * Math.PI * 2; addPx(tx, ty, 18, CRIMSON, Math.cos(g) * 1.8, Math.sin(g) * 1.8, 2); } resolve(a, d, o, tx, ty);
      for (let f = 0; f < 34; f++) { if (f % 2 === 0) for (let q = 0; q < 3; q++) addPx(d.x + Math.random() * 16 - 8, FLOOR + d.dy - 4 - Math.random() * 26, 16, CRIMSON, 0, -0.9, 2); await frame(); } } } },
  rexflame: { name: 'レクスフレイム', el: 'fire', run: async (a, d, o) => {
    await charge(a, GOLDF, 22, true);
    // 金色の炎の壁が地面を走り、相手をのみこんで高く燃え上がる
    const x0 = a.x + a.dir * 14, tx = d.x; let dodged = false;
    for (let f = 0; f < 30; f++) {
      const head = x0 + a.dir * f * 6, reach = (tx - head) * a.dir <= 0;
      projs.length = 0; projs.push(() => { for (let x = x0; (head - x) * a.dir >= 0; x += a.dir * 2) { const k = Math.abs(head - x), h = Math.max(0, 22 - k * 0.25) * (0.7 + 0.3 * Math.sin(x * 0.7 + f)); R(x, FLOOR - h, 2, h, '#f0a020'); R(x, FLOOR - h * 0.6, 2, h * 0.6, '#ffd860'); R(x, FLOOR - h * 0.25, 2, h * 0.25, '#fff6c0'); } });
      addPx(head, FLOOR - 10 - Math.random() * 14, 16, GOLDF, a.dir * 0.4, -1.2, 2);
      if (!o.hit && !dodged && (tx - head) * a.dir < 30) { dodged = true; resolve(a, d, o, 0, 0); }
      if (reach) { if (o.hit) { fireBurst(tx, chestY(d), 34, 2.6); for (let i = 0; i < 20; i++) addPx(tx + Math.random() * 24 - 12, FLOOR - 4, 28, GOLDF, 0, -1.8, 2); flashA = 0.4; projs.length = 0; await resolve(a, d, o, tx, chestY(d)); } break; }
      await frame();
    }
    projs.length = 0; await wait(10); } },
  // ---------- 雷 ----------
  thunder: { name: 'サンダー', el: 'thunder', run: async (a, d, o) => {
    await charge(a, ZAP, 14); const [tx, ty] = await aimAt(a, d, o);
    const pts = zigzag(tx, 0, tx, FLOOR - 2, 10, 5);
    for (let f = 0; f < 6; f++) { projs.length = 0; if (f !== 3) projs.push(() => drawBolt(pts, 3, ['#b0a010', '#ffffff'])); if (f === 0) { flashA = 0.3; if (o.hit) resolve(a, d, o, tx, ty); } await frame(); }
    projs.length = 0; await wait(14); } },
  elthunder: { name: 'エルサンダー', el: 'thunder', run: async (a, d, o) => {
    await charge(a, ZAP, 18); const [tx, ty] = await aimAt(a, d, o);
    // 2回落ちる（2本目は太い）→ 足元に雷の輪
    for (const [w, del] of [[3, 0], [5, 6]]) {
      const pts = zigzag(tx + (w === 3 ? -6 : 0), 0, tx, FLOOR - 2, 9, 7);
      for (let f = 0; f < 5; f++) { projs.length = 0; if (f !== 2) projs.push(() => drawBolt(pts, w, ['#8a7010', '#f0e040', '#ffffff'])); if (f === 0) { flashA = w === 5 ? 0.6 : 0.3; shake = 6; shakeAmp = 2; } await frame(); }
      if (w === 5) { for (let i = 0; i < 20; i++) { const g = i / 20 * Math.PI * 2; addPx(tx, FLOOR - 3, 14, ZAP, Math.cos(g) * 2.4, Math.sin(g) * 0.8, 2); } if (o.hit) await resolve(a, d, o, tx, ty); }
      projs.length = 0; await wait(del);
    }
    await wait(10); } },
  thoron: { name: 'トロン', el: 'thunder', run: async (a, d, o) => {
    await charge(a, BLUEZ, 22, false);
    // 本からまっすぐ、うずを巻く雷の光線が伸びて相手をつらぬく
    const [bx, by] = bookOf(a); const ty = chestY(d), tx = d.x; if (!o.hit) { resolve(a, d, o, 0, 0); await wait(6); }
    const end = a.dir > 0 ? W + 10 : -10;
    for (let f = 0; f < 26; f++) {
      const head = bx + a.dir * Math.min(Math.abs(end - bx), f * 16), y1 = by + (ty - by) * 0.3;
      projs.length = 0; projs.push(() => { const L = Math.abs(head - bx); for (let k = 0; k <= L; k++) { const x = bx + a.dir * k, y = by + (y1 - by) * (k / Math.max(L, 1)); const w = f < 18 ? 5 : Math.max(1, 5 - (f - 18)); R(x, y - (w >> 1), 1, w, '#3a78e8'); R(x, y - (w >> 2), 1, Math.max(1, w >> 1), '#d8f0ff');
        const s = Math.sin(k * 0.35 - f) * 5; R(x, y + s, 1, 1, '#ffffff'); R(x, y - s, 1, 1, '#80c8ff'); } });
      if (f === 3) { flashA = 0.4; if (o.hit) resolve(a, d, o, tx, ty); }
      if (f % 2 === 0) addPx(head, y1 + Math.random() * 6 - 3, 10, BLUEZ, 0, 0, 2);
      await frame();
    }
    projs.length = 0; await wait(10); } },
  rexbolt: { name: 'レクスボルト', el: 'thunder', run: async (a, d, o) => {
    await charge(a, PURZ, 22, true); const [tx, ty] = await aimAt(a, d, o);
    // 相手を囲んで細い雷が4本 → まん中に紫白の大きな雷
    for (const dx of [-22, 22, -12, 12]) { const pts = zigzag(tx + dx, 0, tx + dx, FLOOR - 2, 10, 4); for (let f = 0; f < 3; f++) { projs.length = 0; projs.push(() => drawBolt(pts, 3, ['#8048e0', '#ffffff'])); await frame(); } projs.length = 0; await frame(); }
    const pts = zigzag(tx, 0, tx, FLOOR - 2, 8, 6);
    for (let f = 0; f < 10; f++) { projs.length = 0; if (f % 3 !== 2) projs.push(() => drawBolt(pts, 7, ['#3a1880', '#c890ff', '#f0d8ff', '#ffffff'])); if (f === 0) { flashA = 0.8; shake = 12; shakeAmp = 3; ring(tx, FLOOR - 4, 16, PURZ, 28, 1.6); if (o.hit) resolve(a, d, o, tx, ty); } await frame(); }
    projs.length = 0; await wait(12); } },
  rekkuu: { name: '裂空雷', el: 'thunder', run: async (a, d, o) => {
    await charge(a, SKYZ, 20, true); const [tx, ty] = await aimAt(a, d, o);
    // 空に横一文字の裂け目が走り → そこから枝分かれした稲妻が何本も相手へ
    for (let f = 0; f < 10; f++) { const w = f * 14; projs.length = 0; projs.push(() => { for (let x = -w; x <= w; x++) { R(tx + x, 14 + Math.sin(x * 0.5) * 2, 1, 2, '#ffffff'); R(tx + x, 16 + Math.sin(x * 0.5) * 2, 1, 1, '#30b0e0'); } }); await frame(); }
    const bolts = [-40, -18, 0, 18, 40].map(sx => zigzag(tx + sx, 15, tx + sx * 0.1, ty, 8, 6));
    for (let f = 0; f < 10; f++) { projs.length = 0; projs.push(() => { for (let x = -140; x <= 140; x++) R(tx + x, 14 + Math.sin(x * 0.5) * 2, 1, 2, f % 2 ? '#e0ffff' : '#ffffff'); if (f % 3 !== 2) bolts.forEach((p, i) => drawBolt(p, i === 2 ? 5 : 3, ['#1060a0', '#80f0ff', '#ffffff'])); });
      if (f === 0) { flashA = 0.7; shake = 10; shakeAmp = 3; if (o.hit) resolve(a, d, o, tx, ty); } await frame(); }
    projs.length = 0; await wait(12); } },
  // ---------- 風 ----------
  wind: { name: 'ウインド', el: 'wind', run: async (a, d, o) => {
    await charge(a, WIND, 14); const [bx, by] = bookOf(a), tx = d.x, ty = chestY(d);
    await flyShot(a, d, o, bx, by, tx, ty, 11, (x, y) => { drawCrescent(x, y - 3, a.dir, 6, ['#208070', '#60e0c0', '#ffffff']); drawCrescent(x - a.dir * 7, y + 3, a.dir, 6, ['#208070', '#60e0c0', '#ffffff']); }, (x, y) => addPx(x - a.dir * 10, y + Math.random() * 10 - 5, 8, WIND, -a.dir * 0.6, 0, 1));
    if (o.hit) { ring(tx, ty, 8, WIND, 16, 1.2); await resolve(a, d, o, tx, ty); } } },
  elwind: { name: 'エルウインド', el: 'wind', run: async (a, d, o) => {
    await charge(a, WIND, 18); const [tx, ty] = await aimAt(a, d, o);
    // 相手のまわりに風の刃が4枚現れ、回りながら切り裂く
    for (let f = 0; f < 26; f++) {
      const r = Math.max(4, 26 - f), ph = f * 0.45;
      projs.length = 0; projs.push(() => { for (let q = 0; q < 4; q++) { const g = ph + q * Math.PI / 2; drawCrescent(tx + Math.cos(g) * r, ty + Math.sin(g) * r * 0.8, Math.cos(g + Math.PI / 2) > 0 ? 1 : -1, 7, ['#208070', '#60e0c0', '#ffffff']); } });
      if (f % 2) addPx(tx + Math.random() * 40 - 20, ty + Math.random() * 30 - 15, 10, WIND, 0, 0, 1);
      if (f === 20 && o.hit) resolve(a, d, o, tx, ty);
      await frame();
    }
    projs.length = 0; await wait(12); } },
  tornado: { name: 'トルネード', el: 'wind', run: async (a, d, o) => {
    await charge(a, WIND, 20, true); const [tx, ty] = await aimAt(a, d, o);
    // 相手の足元から竜巻が立ち上がる（下が細く上が広い、渦の線が回る）
    for (let f = 0; f < 36; f++) {
      const h = Math.min(FLOOR + 10, f * 7);
      projs.length = 0; projs.push(() => { for (let y = FLOOR - h; y < FLOOR; y += 1) { const k = (FLOOR - y) / (FLOOR), w = 4 + k * 26; const ph = y * 0.35 + f * 0.8;
        for (let q = 0; q < 3; q++) { const x = tx + Math.sin(ph + q * 2.1) * w; R(x, y, 2, 1, q === 0 ? '#ffffff' : q === 1 ? '#60e0c0' : '#208070'); } } });
      if (f % 2 === 0) { dust(tx, 2, 20); addPx(tx + Math.random() * 30 - 15, FLOOR - Math.random() * h, 12, DUST, Math.random() * 2 - 1, -1.5, 2); }
      if (f === 8 && o.hit) { resolve(a, d, o, tx, ty); }
      if (f > 8 && f < 26 && o.hit) d.dy = -Math.round(Math.sin((f - 8) / 18 * Math.PI) * 10);
      await frame();
    }
    d.dy = 0; projs.length = 0; await wait(10); } },
  arashi: { name: '嵐風の書', el: 'wind', run: async (a, d, o) => {
    await charge(a, STORM, 18); const tx = d.x, ty = chestY(d); let dodged = false;
    // 画面に斜めの雨まじりの突風が吹き荒れ、風の刃が何枚も相手へ
    const [bx, by] = bookOf(a);
    for (let f = 0; f < 30; f++) {
      projs.length = 0; projs.push(() => { for (let q = 0; q < 26; q++) { const x = ((q * 37 + f * 13 * a.dir) % (W + 40) + W + 40) % (W + 40) - 20, y = (q * 53 + f * 9) % 120; segL([x, y], [x + a.dir * 8, y + 4], 1, q % 3 ? '#80c0b0' : '#ffffff'); }
        for (let q = 0; q < 3; q++) { const t = Math.min(1, Math.max(0, (f - q * 5) / 14)); if (t <= 0 || (o.hit && t >= 1)) continue; const x = bx + (tx - bx) * t + (o.hit ? 0 : a.dir * 30 * Math.max(0, t - 0.8)), y = by + (ty - by) * t + (q - 1) * 7; drawCrescent(x, y, a.dir, 7, ['#20483e', '#80c0b0', '#ffffff']); } });
      if (!o.hit && !dodged && f === 10) { dodged = true; resolve(a, d, o, 0, 0); }
      if (o.hit && f === 14) resolve(a, d, o, tx, ty);
      await frame();
    }
    projs.length = 0; await wait(10); } },
  rexcalibur: { name: 'レクスカリバー', el: 'wind', run: async (a, d, o) => {
    await charge(a, SKYZ, 24, true); const [tx, ty] = await aimAt(a, d, o);
    // 巨大な風の刃が十字・斜め十字に何度も切り裂き、最後に大きな風の柱
    const cuts = [[-1, -1, 1, 1], [1, -1, -1, 1], [-1, 0, 1, 0], [0, -1, 0, 1], [-1, -1, 1, 1], [1, -1, -1, 1]];
    for (let c = 0; c < cuts.length; c++) { const [x0, y0, x1, y1] = cuts[c];
      for (let f = 0; f < 4; f++) { const t = (f + 1) / 4; projs.length = 0; projs.push(() => { const p = [tx + x0 * 26, ty + y0 * 26], q = [tx + x0 * 26 + (x1 - x0) * 26 * t, ty + y0 * 26 + (y1 - y0) * 26 * t]; segL(p, q, 4, '#30b0e0'); segL(p, q, 2, '#e0ffff'); segL(p, q, 1, '#ffffff'); }); await frame(); }
      if (c === 1 && o.hit) resolve(a, d, o, tx, ty);
      addPx(tx, ty, 10, SKYZ, 0, 0, 3); }
    for (let f = 0; f < 14; f++) { projs.length = 0; projs.push(() => { for (let y = 0; y < FLOOR; y++) { const w = 6 + Math.sin(y * 0.3 + f) * 3; R(tx - w, y, w * 2, 1, 'rgba(128,240,255,0.5)'); R(tx - w * 0.4, y, w * 0.8, 1, '#ffffff'); } }); if (f === 0) flashA = 0.5; await frame(); }
    projs.length = 0; await wait(10); } },
  // ---------- 光 ----------
  light: { name: 'ライト', el: 'light', run: async (a, d, o) => {
    await charge(a, HOLY, 14); const [tx, ty] = await aimAt(a, d, o);
    // 相手の頭上に光の玉 → 降りてはじける
    for (let f = 0; f < 18; f++) { const y = Math.min(ty, 20 + f * 6), r = Math.min(4, 1 + f / 3); projs.length = 0; projs.push(() => { disc(tx, y, r + 1, '#e8d070'); disc(tx, y, r, '#fff0a0'); disc(tx, y, r - 2, '#ffffff'); }); addPx(tx + Math.random() * 6 - 3, y - 4, 10, HOLY, 0, -0.4, 1); if (y >= ty) break; await frame(); }
    projs.length = 0; ring(tx, ty, 6, HOLY, 18, 1.4); if (o.hit) await resolve(a, d, o, tx, ty); await wait(10); } },
  shine: { name: 'シャイン', el: 'light', run: async (a, d, o) => {
    await charge(a, HOLY, 18); const [tx, ty] = await aimAt(a, d, o);
    // 相手のまわりに光の粒が集まって輝き → 光の輪が何重にも広がってはじける
    for (let f = 0; f < 16; f++) { const g = Math.random() * Math.PI * 2; addPx(tx + Math.cos(g) * 26, ty + Math.sin(g) * 22, 12, HOLY, -Math.cos(g) * 2, -Math.sin(g) * 1.8, 2); projs.length = 0; projs.push(() => disc(tx, ty, Math.round(f / 4), '#ffffff')); await frame(); }
    flashA = 0.5; if (o.hit) resolve(a, d, o, tx, ty);
    for (let f = 0; f < 14; f++) { projs.length = 0; projs.push(() => { for (const r of [f * 3, f * 3 - 8, f * 3 - 16]) if (r > 0) for (let i = 0; i < 40; i++) { const g = i / 40 * Math.PI * 2; R(tx + Math.cos(g) * r, ty + Math.sin(g) * r * 0.9, 1, 1, r === f * 3 ? '#ffffff' : '#fff0a0'); } }); await frame(); }
    projs.length = 0; await wait(10); } },
  resire: { name: 'リザイア', el: 'light', run: async (a, d, o) => {
    await charge(a, PINKL, 18); const [tx, ty] = await aimAt(a, d, o);
    // 桃色の光が相手をつつみ → 光の粒を吸い取って自分が回復
    for (let f = 0; f < 16; f++) { projs.length = 0; projs.push(() => { for (let i = 0; i < 16; i++) { const g = i / 16 * Math.PI * 2 + f * 0.3, r = 18 - f * 0.6; R(tx + Math.cos(g) * r, ty + Math.sin(g) * r * 1.2, 2, 2, i % 2 ? '#ffa0d0' : '#ffffff'); } }); await frame(); }
    projs.length = 0;
    if (o.hit) { await resolve(a, d, o, tx, ty);
      for (let i = 0; i < 18; i++) { for (let q = 0; q < 2; q++) addPx(tx, ty + Math.random() * 10 - 5, 22, PINKL, (a.x - tx) / 22, (chestY(a) - ty) / 22 + (Math.random() - 0.5), 1); await frame(); }
      const hv = a.healQ ? (a.healQ.shift() || 0) : o.dmg;
      if (hv) { a.hp = Math.min(a.max, a.hp + hv); a.disp = a.hp; a.flash = 6; ring(a.x, chestY(a), 12, PINKL, 20, -0.6); popText('+' + hv, a.x, FLOOR + a.dy - 44, '#ffa0d0', 13); } }
    await wait(12); } },
  rexaura: { name: 'レクスオーラ', el: 'light', run: async (a, d, o) => {
    await charge(a, HOLY, 24, true); const [tx, ty] = await aimAt(a, d, o);
    // 相手を囲んで光の柱が6本立ち → まん中へ寄り集まって、大きな光の柱になる
    for (let f = 0; f < 26; f++) {
      const r = f < 12 ? 30 : Math.max(0, 30 - (f - 12) * 3), on = Math.min(6, Math.floor(f / 2) + 1);
      projs.length = 0; projs.push(() => { for (let q = 0; q < on; q++) { const g = q / 6 * Math.PI * 2 + f * 0.08, x = tx + Math.cos(g) * r; const w = 3; R(x - w / 2, 0, w, FLOOR, 'rgba(255,240,160,0.55)'); R(x - 0.5, 0, 1, FLOOR, '#ffffff'); } });
      await frame();
    }
    flashA = 0.9; shake = 10; shakeAmp = 2; if (o.hit) resolve(a, d, o, tx, ty);
    for (let f = 0; f < 18; f++) { const w = 16 - f * 0.6; projs.length = 0; projs.push(() => { R(tx - w, 0, w * 2, FLOOR, 'rgba(255,246,200,0.6)'); R(tx - w * 0.4, 0, w * 0.8, FLOOR, '#ffffff'); }); if (f % 2 === 0) for (let q = 0; q < 4; q++) addPx(tx + Math.random() * 30 - 15, FLOOR - Math.random() * 90, 16, HOLY, 0, -1, 2); await frame(); }
    projs.length = 0; await wait(10); } },
};
const SPELL_ORDER = Object.keys(SPELLS);
async function spellAttack(a, d, o) {
  a.front = true;
  await SPELLS[o.sp].run(a, d, o);
  a.pose = 'idle'; a.glow = 0;
  await wait(12);
  await finish(a, d);
}
const MOVES = {
  slash: [swordAttack, swordCrit], thrust: [thrustAttack, thrustCrit],
  lance: [lanceAttack, lanceCrit], axe: [axeAttack, axeCrit], magic: [magicAttack, magicCrit],
  armor: [armorAttack, armorCrit], bandit: [banditAttack, banditCrit], lance2: [lance2Attack, lance2Crit], fire2: [fire2Attack, fire2Crit],
  bow: [bowAttack, bowCrit], knife: [knifeAttack, knifeCrit], light: [lightAttack, lightCrit],
  cav_sword: [cavSwordAttack, cavSwordCrit], cav_lance: [cavLanceAttack, cavLanceCrit],
  laguz: [laguzAttack, laguzCrit], hero: [heroAttack, heroCrit], fly_lance: [flyLanceAttack, flyLanceCrit], fly_axe: [flyAxeAttack, flyAxeCrit], cav_axe: [cavAxeAttack, cavAxeCrit], cav_bow: [cavBowAttack, cavBowCrit],
};
const act = (a, d, o) => MOVES[a.style][o.crit ? 1 : 0](a, d, o.dmg === undefined ? Object.assign({ dmg: a.st.dmg }, o) : o);
/* ===================== v1.8.0:ゲームとつなぐところ ===================== */
// ゲームの職業 → ドット絵のキャラ。上級職は元の職業と同じ絵。武器の種類が合わないときは武器から選ぶ
const CLASS_SPR = [
  [/剣士|ソードマスター/, (g) => (g === '女' ? 'shizuka' : 'allen')],
  [/ソルジャー|ハルバーディア/, (g) => (g === '女' ? 'soldier_f' : 'soldier')],
  [/バンデット|バーサーカー/, () => 'bandit'],
  [/戦士|ウォーリア/, () => 'warrior'],
  [/アーチャー|スナイパー/, (g) => (g === '女' ? 'archer_f' : 'archer')],
  [/シーフ|アサシン/, (g) => (g === '女' ? 'thief_f' : 'thief')],
  [/クレリック|ワルキューレ/, () => 'cleric'],
  [/神官|司祭/, () => 'priest'],
  [/重歩兵|ジェネラル/, () => 'armor'],
  [/魔道士|賢者/, (g) => (g === '女' ? 'mage' : 'mage_m')],
  [/ソードナイト|パラディン\(剣/, (g) => (g === '女' ? 'sknight_f' : 'sknight')],
  [/ランスナイト|パラディン\(槍/, (g) => (g === '女' ? 'lknight_f' : 'lknight')],
  [/アクスナイト|パラディン\(斧/, (g) => (g === '女' ? 'aknight_f' : 'aknight')],
  [/ボウナイト|パラディン\(弓/, (g) => (g === '男' ? 'bknight_m' : 'bknight')],
  [/レンジャー|ロード/, () => 'ranger'],
  [/ペガサスナイト|ファルコンナイト/, () => 'pegasus'],
  [/ドラゴンナイト|ドラゴンマスター/, (g) => (g === '女' ? 'dragon_f' : 'dragon')],
  [/猫/, (g) => (g === '男' ? 'cat_m' : 'cat')],
  [/虎/, (g) => (g === '女' ? 'tiger_f' : 'tiger')],
  [/タカ/, (g) => (g === '女' ? 'hawk_f' : 'hawk')],
  [/カラス/, (g) => (g === '男' ? 'crow_m' : 'crow')],
  [/竜/, (g) => (g === '女' ? 'rdragon_f' : 'rdragon')],
];
const CASTERS = { light: ['cleric', 'priest'], flame: ['mage', 'mage_m'], thunder: ['mage', 'mage_m'], wind: ['mage', 'mage_m'] };
function famOf(id) {
  if (FAM[id]) return FAM[id];
  if (id === 'thief' || id === 'thief_f') return 'knife';
  if (CHARS[id] && CHARS[id].beast) return 'laguz';
  if (id === 'cleric' || id === 'priest') return 'light';
  return 'magic';
}
const catFam = (c) => (['flame', 'thunder', 'wind'].includes(c) ? 'magic' : c);
// info: { className, gender, race, category(武器の種類), moveType }
function spriteFor(info) {
  const g = info.gender, cat = info.category || '', mv = info.moveType || '';
  for (const [re, f] of CLASS_SPR) {
    if (!re.test(info.className || '')) continue;
    const id = f(g);
    const fam = famOf(id);
    if (!cat || fam === catFam(cat) || (fam === 'light' && cat === 'light')) return id;
    break;   // 武器が合わない(特別なキャラ)→ 武器から選ぶ
  }
  const fem = g === '女';
  switch (cat) {
    case 'sword': return mv === '騎馬' ? (fem ? 'sknight_f' : 'sknight') : fem ? 'shizuka' : 'allen';
    case 'lance': return mv === '騎馬' ? (fem ? 'lknight_f' : 'lknight') : mv === '飛行' ? (fem ? 'pegasus' : 'dragon') : mv === '重装' ? 'armor' : fem ? 'soldier_f' : 'soldier';
    case 'axe': return mv === '騎馬' ? (fem ? 'aknight_f' : 'aknight') : mv === '飛行' ? (fem ? 'dragon_f' : 'dragon') : 'warrior';
    case 'bow': return mv === '騎馬' ? (fem ? 'bknight' : 'bknight_m') : fem ? 'archer_f' : 'archer';
    case 'knife': return fem ? 'thief_f' : 'thief';
    case 'light': return fem ? 'cleric' : 'priest';
    case 'flame': case 'thunder': case 'wind': return fem ? 'mage' : 'mage_m';
    case 'laguz': return fem ? 'tiger_f' : 'tiger';
    default: return fem ? 'shizuka' : 'allen';
  }
}
// 武器の名前 → 武器ごとの動き(投げ武器・魔法の武器・魔法)。合わなければ null(クラスのふだんの動き)
const THROW_BY_NAME = { 手槍: 'te_yari', ショートスピア: 'short_sp', スレンドスピア: 'slend_sp', 手斧: 'te_ono', ショートアクス: 'short_ax', トマホーク: 'tomahawk' };
const MW_BY_NAME = { ソニックソード: 'sonic', ルーンソード: 'rune', フレイムランス: 'flance', ボルトアクス: 'bolt', ブライトボウ: 'bright' };
const SPELL_BY_NAME = Object.fromEntries(Object.entries(SPELLS).map(([k, v]) => [v.name, k]));
const SPELL_DEFAULT = { flame: 'fire', thunder: 'thunder', wind: 'wind', light: 'light' };
function moveFor(id, weaponName, category) {
  const name = String(weaponName || '');
  const tw = THROW_BY_NAME[name];
  if (tw && SPR[id] && SPR[id].throw && THROW_W[tw].kind === SPR[id].throw) return { kind: 'throw', key: tw };
  const mw = MW_BY_NAME[name];
  if (mw && FAM[id] === MW[mw].fam) return { kind: 'mw', key: mw };
  if (isCaster({ base: id }) && CASTERS[category]) {
    let sp = SPELL_BY_NAME[name];
    if (!sp || !canSpell({ base: id }, sp)) sp = SPELL_DEFAULT[category];
    if (sp && canSpell({ base: id }, sp)) return { kind: 'spell', key: sp };
  }
  return null;
}

let wrap = null, running = false, speed = 1, acc = 0, lastSetup = null, maxSteps = 6;
function step() { if (!units.s || !units.a) return; update(); draw(); const w = waiters; waiters = []; w.forEach((r) => r()); }
// v1.8.0:時間で進める(画面のリフレッシュレートが 120Hz などでも同じ速さ)。
// サンプルは 1秒に60コマだったが、ガトー「早すぎる」で ふつう=1秒に STEPS_PER_SEC コマ
const STEPS_PER_SEC = 38;
let lastT = 0;
function loop(t) {
  if (!running) return;
  const now = typeof t === 'number' ? t : Date.now();
  const dt = lastT ? Math.min(0.1, Math.max(0, (now - lastT) / 1000)) : 0;
  lastT = now;
  if (!fast) {
    acc += dt * STEPS_PER_SEC / (speed || 1);
    let n = Math.min(maxSteps, Math.floor(acc));
    acc -= n;
    while (n-- > 0) step();
  }
  global.requestAnimationFrame(loop);
}
// 待っているコルーチンを、絵を出さずに最後まで進める
function flush() {
  fast = true;
  for (let i = 0; i < 50 && waiters.length; i++) { const w = waiters; waiters = []; w.forEach((r) => r()); }
}
function mount(container) {
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'ba-wrap';
    wrap.appendChild(cv);
  }
  if (wrap.parentNode !== container) container.appendChild(wrap);
  wrap.hidden = false;
  if (!running) { running = true; lastT = 0; global.requestAnimationFrame(loop); }
}
function unmount() {
  flush();
  running = false;
  if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
}
const unitOf = (side) => (side === 'left' ? units.s : units.a);
const foeOf = (side) => (side === 'left' ? units.a : units.s);
function applyInfo(u, p) {
  u.name = p.name; u.cls = p.cls; u.wpn = p.wpn;
  u.max = Math.max(1, p.max || 1);
  u.hp = Math.max(0, Math.min(u.max, p.hp)); u.disp = u.hp; u.hpFast = false; u.hpRed = 0; u.hpPop = 0;
  if (p.st) u.st = { dmg: p.st.dmg, hit: p.st.hit, crt: p.st.crt };
  u.move = p.move || null;
  applyColor(u, p.color);
}
function makeGameUnit(p, home, dir) {
  const id = CHARS[p.id] ? p.id : 'allen';
  const u = makeUnit(id, home, dir);
  applyInfo(u, p);
  if (u.beast && p.transformed) u.kind = u.beast;
  u.alpha = u.hp > 0 ? 1 : 0;
  return u;
}
function clearFx() {
  fx.length = 0; texts.length = 0; marks.length = 0; projs.length = 0; frameTimers.length = 0;
  flashA = 0; shake = 0; hShake = 0; darkA = 0; darkTarget = 0; cut = null; ougiBg = null;
}
// 2人をそろえる(対戦の始め・援軍・変身・3on3のラウンドごと)
// L, R: { id, name, cls, wpn, hp, max, st:{dmg,hit,crt}, color, transformed, move }
function setup(L, R) {
  flush();
  fast = false;
  clearFx();
  units.s = makeGameUnit(L, 84, 1);
  units.a = makeGameUnit(R, 174, -1);
  lastSetup = { L, R };
  draw();
}
const sideReady = () => !!(units.s && units.a);
// HPを合わせる(減ると数字が赤くなって減っていく。増えるときはすぐ)
function setHp(side, hp, max) {
  if (!sideReady()) return;
  const u = unitOf(side);
  if (max) u.max = Math.max(1, max);
  hp = Math.max(0, Math.min(u.max, hp));
  if (hp > u.hp) { u.hp = hp; u.disp = hp; }
  else u.hp = hp;
  if (fast) u.disp = u.hp;
}
function setStats(side, st) {
  if (!sideReady() || !st) return;
  unitOf(side).st = { dmg: st.dmg, hit: st.hit, crt: st.crt };
}
function popAt(side, str, color, size = 9) {
  if (!sideReady()) return;
  const u = unitOf(side);
  popText(str, u.x, FLOOR + u.dy - 50, color, size);
}
// 攻撃1回ぶん(流星・天空などの連続攻撃、勇者の武器の2回目、ぶちかましも含む)
// plan: { recs:[{hit, crit, damage, hpAfter, guarded}], heals:[回復量], ougi:'meteor'など, hpEnd:{left,right} }
async function attack(side, plan) {
  if (!sideReady()) return;
  const a = unitOf(side), d = foeOf(side);
  const q = plan.recs.map((r) => Object.assign({}, r));
  if (!q.length) return;
  a.healQ = (plan.heals || []).slice();
  a.dir = side === 'left' ? 1 : -1; d.dir = -a.dir;
  if (d.alpha <= 0 && d.hp > 0) d.alpha = 1;
  const mv = a.move && !isBeast(a) ? moveFor(a.kind, a.wpn, a.move.category) : null;
  const one = async (first, allowTwo) => {
    const o = { hit: first.hit, crit: first.crit, q, dmg: first.damage || 0 };
    if (plan.ougi) {
      o.crit = false;
      await ougiAct(a, d, plan.ougi, o);
      return;
    }
    if (mv) {
      if (first.crit) await cutIn(a, mv.kind === 'spell' ? 'cast' : 'idle', { title: '必殺の一撃', sub: a.wpn });
      if (mv.kind === 'throw') await throwAttack(a, d, Object.assign(o, { w: mv.key }));
      else if (mv.kind === 'mw') await mwAttack(a, d, Object.assign(o, { mw: mv.key }));
      else await spellAttack(a, d, Object.assign(o, { sp: mv.key }));
      return;
    }
    if (allowTwo && q.length >= 2 && FOLLOW.has(a.base)) o.two = { hit: q[1].hit, crit: q[1].crit, q, dmg: q[1].damage || 0 };
    await act(a, d, o);
  };
  await one(q[0], true);
  plan = Object.assign({}, plan, { ougi: null });
  // まだ残っている攻撃(追撃のない職業の2回目など)は、もう一度ふつうに攻撃する
  for (let i = 0; i < 4 && q.length && d.hp > 0; i++) await one(q[0], true);
  a.healQ = null;
  if (plan.hpEnd) { setHp('left', plan.hpEnd.left); setHp('right', plan.hpEnd.right); }
  a.pose = 'idle'; a.front = false; a.dir = side === 'left' ? 1 : -1;
  if (d.hp > 0) { d.pose = 'idle'; d.dir = -a.dir; d.x = d.home; d.alpha = 1; }
  a.x = a.home; a.dy = 0;
}
// その場で働く奥義(咆哮・地の祝福・空の祝福)
async function ougiSelf(side, k, info = {}) {
  if (!sideReady() || !OUGI_SELF[k]) return;
  const a = unitOf(side), d = foeOf(side);
  a.healQ = info.heal != null ? [info.heal] : [];
  if (k === 'roar' && !info.down) {
    // 咆哮が防がれた(護り手・安定):ほえるだけ
    ougiBg = { k, t: 0, phase: 1, x: a.x, y: midY(a) };
    await cutIn(a, a.beast && a.kind !== a.base ? 'roar' : 'idle', { title: OUGI[k].name, sub: '奥義', color: OUGI[k].tcol, accent: OUGI[k].col, band: OUGI[k].band });
    ougiBg = null; a.healQ = null;
    return;
  }
  await ougiAct(a, d, k);
  a.healQ = null;
}
// 化身(on=true)・化身解除(on=false)
async function transform(side, on, st) {
  if (!sideReady()) return;
  const u = unitOf(side);
  if (!u.beast) return;
  if (on === (u.kind === u.beast)) { if (st) setStats(side, st); return; }
  await shift(u, on);
  if (st) setStats(side, st);
}
// 倒れた(ポイズン・暴発など、攻撃以外で)
async function ko(side) {
  if (!sideReady()) return;
  const d = unitOf(side);
  for (let i = 0; i < 40 && d.alpha > 0; i++) {
    d.flash = (i % 6 < 3) ? 2 : 0; d.alpha = 1 - i / 40;
    if (i % 3 === 0) addPx(d.x + (Math.random() * 16 - 8), FLOOR - Math.random() * 34, 18, COOL, 0, -0.6, 2);
    await frame();
  }
  d.alpha = 0;
}
// ダメージ(攻撃以外:ポイズン・燃焼・暴発)
function hurt(side, dmg, hpAfter, color) {
  if (!sideReady()) return;
  const u = unitOf(side);
  u.flash = 8; u.pose = 'hurt';
  popText(String(dmg), u.x, FLOOR - 42, color || '#c890ff', 11);
  setHp(side, hpAfter);
  setTimeoutFrames(16, () => { if (u.pose === 'hurt') u.pose = 'idle'; });
}
function heal(side, n, cols) {
  if (!sideReady() || !n) return;
  const u = unitOf(side);
  ring(u.x, midY(u), 14, cols || LEAF, 24, -0.6);
  for (let i = 0; i < 10; i++) addPx(u.x + (Math.random() * 20 - 10), FLOOR + u.dy - 4 - Math.random() * 20, 26, cols || LEAF, 0, -0.9, 1);
  popText('+' + n, u.x, FLOOR + u.dy - 44, '#70f090', 13);
}
function sleep(side, on) { if (sideReady()) unitOf(side).sleep = on ? 9999 : 0; }
function glow(side, n = 40) { if (sideReady()) unitOf(side).glow = n; }

global.BattleAnim = {
  mount, unmount, setup, setHp, setStats, attack, ougiSelf, transform, ko, hurt, heal, sleep, glow, popAt,
  flush, spriteFor, moveFor,
  setSpeed: (s) => { speed = s || 1; },
  isFast: () => fast,
  // テスト用
  _units: () => units, _turbo: (n) => { maxSteps = n || 6; }, _step: (n = 1) => { for (let i = 0; i < n; i++) step(); }, _sprites: () => Object.keys(SPR), _chars: CHARS, _ougi: OUGI_ORDER,
};
})(window);
