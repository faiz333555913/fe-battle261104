// v1.7.0:3on3(3体どうしのチーム戦)の計算だけ。画面は main.js
//   ・おたがいに3体。1P(自分)はキャラ一覧から3体と武器を選ぶ。2P はコンピューター(相手のチーム)
//   ・スキルは対戦の前に6体ともランダム(1体に1つ。援軍は出ない)。バイオリズムも対戦の前に決まる
//   ・ラウンドごとに、おたがいに出すキャラを選ぶ(同時に選ぶ。相手はこちらの選んだキャラを知らない)
//   ・1ラウンド戦ったら、また選び直す。HP・化身ゲージ・状態異常・下がった能力・スキルの状態はキャラごとに続く
//   ・控えのキャラも、見えないところで進む(化身ゲージ・空の祝福・回復・大器晩成・エリート。援軍の控えと同じ)
//   ・相手のチームを全員倒したら勝ち。60ラウンド・10ラウンドHPが動かないときは、残りHPの割合で判定
// v1.7.1(ガトーの改善点リスト v1.7.1)
//   ・王:3人のうち1人がランダムで王(HP+5・体格以外+2。素の能力値に足すので補正には出ない)。王が倒れたらそのチームの負け。相手の王は分からない
//   ・前のラウンドに出たキャラは、次のラウンドには出せない(生きているのが1人だけのときは別)
//   ・一度戦った相手のスキルは、ラウンドが終わったら全部見える
//   ・2人倒れて最後の1人(王)になったら、2人目に倒れたキャラのスキルと属性を受け継ぐ
//   ・『恐怖』はチームのだれかが持っていれば(控えでも、生きていれば)相手のキャラ全員に効く
//   ・神官(司祭)がチームにいて生きていれば、ラウンドの終わりに神官以外のキャラ(控えも)のHPが最大HPの15%回復
//   ・アーケードの3on3のために、武器・スキルを決めて作れる(opts.foeWeapons / opts.skills)
// v1.7.2(ガトーの改善点リスト v1.7.2)
//   ・受け継いだ属性は2つ目の属性として足す(自分の属性も残る。補正は2つ分。不利な属性の分だけ無効)
//   ・だれかが倒れたラウンドも、ラウンドの終わりの化身ゲージ(残ったキャラ・控え)が進む(battle.js simulate)
// v1.7.3(ガトーの改善点リスト v1.7.3)
//   ・王のHPは+4(職業のHPの上限まで)
//   ・休みは「2ラウンド続けて出たら、次の1ラウンド休み」(前は「出たら次の1ラウンド休み」)
//   ・4on4(人数は create に渡したキャラの数。3か4)。最後の1人は、直前に倒れたキャラから受け継ぐ
//   ・ラウンドの先攻・後攻を、選ぶ前に分かるようにする(nextFirst。ラウンド1のランダムも作ったときに決めておく)
//   ・2P対戦(1台を交代で使う)のため、相手から見たか(seen)を両方のチームで持つ
//   ・対戦中の武器の変更(changeWeapon。ベオクだけ)
// v1.7.4(ガトーの改善点リスト v1.7.4)
//   ・フェイズ:1人が戦ったら、フェイズが変わるまで出せない。お互いの生きているキャラが全員戦ったら、次のフェイズ
//     (v1.7.3 の「2ラウンド続けて出たら休み」はフェイズに置きかえ。片方のチームが先に全員戦ったときは、そのチームは生きているだれでも出せる)
//   ・決着がつかないときの上限は 60 → 20 ラウンド
//   ・王のHPは+3(職業のHPの上限まで)
//   ・同じ属性を受け継いだときは、属性の補正が重なる(char.element2 に同じ属性)
//   ・コンピューターの選び方を賢く:1ラウンドを試しに戦わせて(何回か)、倒される見込み・倒す見込みを数える。
//     王は倒されるとチームの負けなので、倒されそうな相手がいるうちは出さない
//   ・援軍は、はじめて出たラウンドに参戦し、倒れるまで次のラウンドも代わりに戦う(battle.js。allyState)
// v1.7.5(ガトーの改善点リスト v1.7.5 と、3on3ルールの整理案)
//   ・決着がつかないときの上限は 20 → 30 ラウンド(Config.maxRounds)
//   ・闘技場の3on3でも、スキルの抽選に援軍が出る(NO_SKILLS を空に)
//   ・神官の回復は、ラウンドの終わりごと → フェイズが変わったとき
//   ・継承:王がひとりになったら、1人目に倒れたキャラの属性と、2人目に倒れたキャラの属性とスキルを受け継ぐ
//     (4on4は、倒れた仲間全員の属性と、最後に倒れたキャラのスキル)。属性は char.element2 / element3 / element4
//   ・使っていない「休み」のしくみ(REST_AFTER・streak・restNext)を消す(整理案。フェイズに置きかえ済み)
(function (global) {
  "use strict";
  const C = global.Config;
  const DB = global.GameDB;
  const B = global.Battle;
  const G = global.Generator;

  const SIZE = 3;
  // v1.7.5:援軍も抽選に出る(前は「控えと入れ替えのしくみが重なるため」出さなかった。ガトー指示)
  const NO_SKILLS = [];
  const MAX_ROUNDS = C.maxRounds; // v1.7.4:60 → 20、v1.7.5:30(Config.maxRounds と同じ)
  const SIDES = ["left", "right"];
  const foeOf = (side) => (side === "left" ? "right" : "left");

  // 1体ずつの状態は、ラウンドごとに写しをとって戦わせ、終わったら写しのほうを続きにする
  const clone = (x) => (typeof global.structuredClone === "function" ? global.structuredClone(x) : JSON.parse(JSON.stringify(x)));
  const isBanned = (c) => !!(DB.classByName[c.className] && DB.classByName[c.className].banned);

  // ---- 相手のチーム ----
  // source:"list" = キャラ一覧から(自分のチーム以外)。足りなければ新しく生まれたキャラで埋める / "new" = 全員、新しく生まれたキャラ
  function pickOpponents(list, excludeIds, source, rng, size = SIZE) {
    const SIZE_ = size;
    const pool = source === "new" ? [] : list.filter((c) => !excludeIds.includes(c.id) && !isBanned(c));
    const out = [];
    while (out.length < SIZE_ && pool.length) out.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
    for (let guard = 0; out.length < SIZE_ && guard < 100; guard++) {
      const n = G.normalizeInputs(global.RandomChar.randomInputs(() => rng.next()));
      if (!n.ok) continue;
      const c = G.generateCharacter(n.value);
      if (isBanned(c) || out.some((x) => x.id === c.id)) continue;
      c.generated = true; // キャラ一覧には入らない
      out.push(c);
    }
    return out;
  }

  // 相手の武器:こちらのチーム3体に平均していちばん効く武器(化身後どうしで比べる)
  function bestWeaponVs(char, foes, foeWeapons) {
    let best = char.weapons[0], score = -Infinity;
    for (const w of char.weapons) {
      if (!DB.weapons[w]) continue;
      let v = 0;
      foes.forEach((f, i) => {
        const me = B.makeUnit(char, w, "right"), en = B.makeUnit(f, foeWeapons[i] || f.weapons[0], "left");
        if (me.laguz) me.laguz.transformed = true;
        if (en.laguz) en.laguz.transformed = true;
        const c = B.calc(me, en);
        v += c.damage * c.times * c.hit + c.crit;
      });
      if (v > score) { score = v; best = w; }
    }
    return best;
  }

  // skills:決まったスキル([[1つ目, 2つ目…], …]。アーケード)。なければランダムで1つずつ
  function makeTeam(chars, weaponIds, side, rng, skills) {
    return chars.map((c, i) => {
      const id = c.weapons.includes(weaponIds[i]) ? weaponIds[i] : c.weapons[0];
      const u = B.makeUnit(c, id, side);
      u.bio = rng.pick(C.biorhythm);
      if (skills) {
        const list = (skills[i] || []).filter(Boolean);
        u.skill = list[0] || null;
        u.extraSkills = list.slice(1);
      } else u.skill = B.drawSkill(u, rng, NO_SKILLS);
      return u;
    });
  }

  // v1.7.1:王。HP+5・体格以外の能力値+2(素の能力値に足す。補正の行には出ない)
  // v1.7.3:HPは+4にして、職業のHPの上限(武器でHPが上がる分は上限に足す)を超えないようにする
  const KING = (C.team && C.team.king) || { hp: 4, stats: 2 };
  function hpCap(u) {
    const cls = DB.classByName[u.className];
    const max = (cls && (cls.transformedMax || cls.max)) || (DB.classMaxOf && DB.classMaxOf(u.className));
    if (!max || max.hp == null) return Infinity;
    return max.hp + ((u.weapon && u.weapon.statBonus && u.weapon.statBonus.hp) || 0);
  }
  function crown(u) {
    u.king = true;
    const cap = hpCap(u);
    const hpAdd = Math.max(0, Math.min(KING.hp, cap - u.stats.hp));
    const add = (s, hp) => {
      for (const k of DB.STAT_KEYS) s[k] = (s[k] || 0) + (k === "hp" ? hp : KING.stats);
    };
    add(u.stats, hpAdd);
    if (u.laguz && u.laguz.humanStats) add(u.laguz.humanStats, hpAdd);
    u.maxHp += hpAdd;
    u.hp += hpAdd;
    u.kingHp = hpAdd; // 実際に上がったHP(上限で+4より少ないことがある)
  }

  // myChars:自分の3体 / myWeapons:その武器 / foeChars:相手の3体
  // opts:{ foeWeapons(相手の武器を決める), skills:{ left, right }(スキルを決める), kings:{ left, right }(王を決める。テスト用) }
  function create(myChars, myWeapons, foeChars, rng, opts = {}) {
    const foeWeapons = opts.foeWeapons || foeChars.map((c) => bestWeaponVs(c, myChars, myWeapons));
    const sk = opts.skills || {};
    const team = { left: makeTeam(myChars, myWeapons, "left", rng, sk.left), right: makeTeam(foeChars, foeWeapons, "right", rng, sk.right) };
    const king = {};
    const n = { left: team.left.length, right: team.right.length };
    for (const side of SIDES) {
      king[side] = opts.kings && opts.kings[side] != null ? opts.kings[side] : rng.int(0, team[side].length - 1);
      crown(team[side][king[side]]);
    }
    return {
      team,
      king,              // v1.7.1:王(チームの何番目か)。相手の王は終わるまで見せない
      fallen: { left: [], right: [] },        // v1.7.1:倒れた順
      inherited: { left: null, right: null }, // v1.7.1:最後の1人が受け継いだもの
      active: { left: null, right: null }, // いま出ているキャラ(チームの何番目か)
      round: 0,
      firstR1Side: null,
      quiet: 0,          // HPが動かなかったラウンドの数
      lastPair: null,
      // v1.7.3:両方のチームで「相手から見たか」を持つ(2P対戦で使う。1Pから見た相手は right)
      seen: { left: Array(n.left).fill(false), right: Array(n.right).fill(false) },      // 出てきたか(出てきたら一部公開)
      skillSeen: { left: Array(n.left).fill(false), right: Array(n.right).fill(false) }, // 一度戦ったか(スキルを全部公開)
      phase: 1,          // v1.7.4:フェイズ
      used: { left: Array(n.left).fill(false), right: Array(n.right).fill(false) },     // v1.7.4:このフェイズに戦ったか
      coin: rng.next() < 0.5 ? "left" : "right", // v1.7.3:ラウンド1の先攻(先攻の武器・待ち伏せがないとき)
      done: false, winner: null, judge: false, endText: "",
    };
  }

  const alive = (st, side) => st.team[side].map((u, i) => i).filter((i) => st.team[side][i].hp > 0);
  // このラウンドに出せるキャラ(v1.7.4:フェイズ)。このフェイズにもう戦ったキャラ(st.used)は出せない。
  //   出せるキャラがいないチームは、生きているだれでも出せる(v1.7.1〜v1.7.3 の「休み」は v1.7.5 で消した)
  const usedOf = (st, side, i) => !!(st.used && st.used[side] && st.used[side][i]);
  function allowed(st, side) {
    const a = alive(st, side);
    const fresh = a.filter((i) => !usedOf(st, side, i));
    return fresh.length ? fresh : a;
  }
  // v1.7.4:このフェイズにもう戦ったので出せないキャラか(画面の「出撃済み」)
  const isUsed = (st, side, i) => st.team[side][i].hp > 0 && usedOf(st, side, i) && !allowed(st, side).includes(i);
  const resting = (st, side) => { const i = st.active[side]; return i != null && isUsed(st, side, i) ? i : null; };
  // v1.7.4:お互いの生きているキャラが全員戦ったら、次のフェイズ
  function advancePhase(st) {
    const done = SIDES.every((side) => alive(st, side).every((i) => usedOf(st, side, i)));
    if (!done) return false;
    st.phase = (st.phase || 1) + 1;
    for (const side of SIDES) st.used[side] = st.team[side].map(() => false);
    return true;
  }
  // v1.7.4:援軍が残っていれば、戦うのは援軍(戦闘予測・コンピューターの見込みに使う)
  const fighterOf = (u) => (u.allyState && u.allyState.hp > 0 ? { ...u.allyState, side: u.side, teamFear: u.teamFear } : u);

  // v1.7.3:このラウンドの先攻。picks があれば、出るキャラの先攻の武器・『待ち伏せ』も入れる
  //   戻り値:{ side, reason, fixed(先攻の武器などで決まった) , random(両方にあってランダム) }
  function nextFirst(st, picks) {
    const r = st.round + 1;
    let base;
    if (r === 1) base = st.coin || "left";
    else base = r % 2 === 1 ? st.firstR1Side : foeOf(st.firstR1Side);
    if (picks && picks.left != null && picks.right != null) {
      const L = st.team.left[picks.left], Rr = st.team.right[picks.right];
      const lp = B.hasPriority ? B.hasPriority(L, Rr) : false, rp = B.hasPriority ? B.hasPriority(Rr, L) : false;
      if (lp && !rp) return { side: "left", reason: B.priorityReason(L), fixed: true };
      if (rp && !lp) return { side: "right", reason: B.priorityReason(Rr), fixed: true };
      if (lp && rp) return { side: r === 1 ? base : null, reason: "(先攻効果が重なったためランダム)", random: true };
    }
    return { side: base, reason: "" };
  }
  // v1.7.3:武器を変える(ベオクだけ。対戦中の武器の変更)。HP・状態異常などはそのまま。武器で上がる能力値は入れかえる
  function changeWeapon(u, weaponId) {
    if (u.laguz || !u.char.weapons.includes(weaponId) || !DB.weapons[weaponId]) return false;
    if (u.equip && u.equip.id === weaponId && !u.broken) return false;
    const old = u.broken ? {} : (u.weapon.statBonus || {});
    for (const [k, v] of Object.entries(old)) u.stats[k] = (u.stats[k] || 0) - v;
    const w = DB.withMark(DB.weapons[weaponId], u.char.marks && u.char.marks[weaponId]);
    for (const [k, v] of Object.entries(w.statBonus || {})) u.stats[k] = (u.stats[k] || 0) + v;
    const dHp = (w.statBonus && w.statBonus.hp || 0) - (old.hp || 0);
    u.maxHp += dHp;
    u.hp = Math.min(u.maxHp, u.hp + Math.max(0, dHp));
    u.weapon = u.holdBack ? { ...w, noCrit: true } : w;
    u.equip = u.weapon;
    u.broken = false;
    return true;
  }
  // v1.7.3:コンピューターの武器(武器の変更がONのとき)。出すキャラの武器を、相手の出せるキャラに平均していちばん効く武器に
  function cpuWeapon(st, side, i) {
    const u = st.team[side][i];
    if (u.laguz || u.char.weapons.length < 2) return null;
    const foes = allowed(st, foeOf(side)).map((j) => st.team[foeOf(side)][j]);
    let best = null, score = -Infinity;
    for (const w of u.char.weapons) {
      const c = clone(u);
      if (!(c.equip && c.equip.id === w && !c.broken) && !changeWeapon(c, w)) continue;
      const v = foes.reduce((a, f) => a + matchScore(c, f), 0) / Math.max(1, foes.length);
      if (v > score) { score = v; best = w; }
    }
    return best;
  }
  const isPriest = (u) => ((C.team && C.team.priestClasses) || []).includes(u.className);
  const skillsOf = (u) => [u.skill].concat(u.extraSkills || []).filter(Boolean);

  // ---- 出すキャラを選ぶ(コンピューター・おまかせ) ----
  // 1ラウンドあたりの、相手に与えるダメージの見込み
  function perRound(att, def) {
    const c = B.calc(att, def);
    return c.damage * c.times * c.hit / 100 + (c.crit / 100) * c.damage * 2 * c.hits;
  }
  // a で b と戦ったときの良さ(倒されるまでのラウンド数 − 倒すまでのラウンド数)
  function matchScore(a, b) {
    const kill = Math.min(30, b.hp / Math.max(0.2, perRound(a, b)));
    const die = Math.min(30, a.hp / Math.max(0.2, perRound(b, a)));
    return die - kill;
  }
  // side の側が出すキャラ。相手が何を出すかは分からないので、相手の出せるキャラ全員との見込みで決める
  // v1.7.4:フェイズで出せるキャラ(allowed)から選ぶ
  // v1.7.4:賢くした(ガトー指示)。それぞれの組み合わせで1ラウンドを試しに AI.sims 回戦わせて、
  //   倒す見込み・倒される見込み・与えるダメージ・受けるダメージを数える(+ 長い目で見た matchScore を少し)。
  //   王(と最後の1人)が倒されるとチームの負けなので、とても重く見る。王が倒されそうな相手(見込み AI.kingRisk 以上)が
  //   出てくるかもしれないうちは、ほかに出せるキャラがいれば王を出さない。気まぐれ(AI.random)は、王を危ない目にあわせない範囲で
  const AI = { sims: 8, kingRisk: 0.34, random: 0.1, lose: 8, ms: 20 };
  function trialRound(st, side, i, j, rng) {
    const me = clone(st.team[side][i]), foe = clone(st.team[foeOf(side)][j]);
    const L = side === "left" ? me : foe, R = side === "left" ? foe : me;
    const so = { oneRound: true, round0: st.round, firstR1Side: st.firstR1Side, bench: { left: [], right: [] }, newPair: false };
    if (st.round === 0) {
      const f = nextFirst(st, { [side]: i, [foeOf(side)]: j });
      if (f.side) { so.firstSide = f.side; so.firstReason = ""; }
    }
    B.simulate(L, R, rng, so);
    return { me, foe };
  }
  function pairOdds(st, side, i, j, rng) {
    const u0 = st.team[side][i], f0 = st.team[foeOf(side)][j];
    let kill = 0, die = 0, dealt = 0, taken = 0;
    for (let n = 0; n < AI.sims; n++) {
      const { me, foe } = trialRound(st, side, i, j, rng);
      if (foe.hp <= 0) kill++;
      if (me.hp <= 0) die++;
      dealt += Math.max(0, f0.hp - Math.max(0, foe.hp)) / Math.max(1, f0.maxHp);
      taken += Math.max(0, u0.hp - Math.max(0, me.hp)) / Math.max(1, u0.maxHp);
    }
    return { kill: kill / AI.sims, die: die / AI.sims, dealt: dealt / AI.sims, taken: taken / AI.sims };
  }
  // 戦ってみたときの、side から見た良さ。i が倒れると負けになる(王・最後の1人)なら倒される見込みを重く見る
  function pickScores(st, side, rng) {
    const mine = allowed(st, side), foes = allowed(st, foeOf(side));
    const aliveMine = alive(st, side).length, aliveFoe = alive(st, foeOf(side)).length;
    const val = {}, risk = {};
    for (const i of mine) {
      const fatal = i === st.king[side] || aliveMine === 1;
      risk[i] = 0;
      for (const j of foes) {
        const o = pairOdds(st, side, i, j, rng);
        const killVal = aliveFoe === 1 ? AI.lose : 1.2;
        const dieVal = fatal ? AI.lose : 1;
        val[i + ":" + j] = o.kill * killVal - o.die * dieVal + o.dealt - o.taken + (AI.ms ? matchScore(fighterOf(st.team[side][i]), fighterOf(st.team[foeOf(side)][j])) / AI.ms : 0);
        if (fatal) risk[i] = Math.max(risk[i], o.die);
      }
    }
    const Q = (i, M, F) => F.reduce((a, j) => a + val[i + ":" + j], 0) / Math.max(1, F.length);
    return mine.map((i) => ({ i, v: Q(i, mine, foes), risk: risk[i], king: i === st.king[side] }));
  }
  function cpuPick(st, side, rng) {
    const mine = allowed(st, side);
    if (mine.length <= 1) return mine[0];
    const aiRng = global.Rng && global.Rng.createSeededRng ? global.Rng.createSeededRng(`tt-ai:${st.round}:${side}:${rng ? rng.next() : 0}`) : rng;
    const scores = pickScores(st, side, aiRng);
    // 王が倒されそうなら、ほかに出せるキャラがいるうちは出さない
    const safe = scores.filter((x) => !(x.king && x.risk >= AI.kingRisk));
    const pool = safe.length ? safe : scores;
    // 気まぐれ(AI.random)は、王を危ない目にあわせない範囲で
    if (rng && rng.next() < AI.random) return pool[rng.int(0, pool.length - 1)].i;
    return pool.reduce((a, b) => (b.v > a.v ? b : a)).i;
  }

  // ---- 1ラウンド戦う ----
  // picks:{ left: 何番目, right: 何番目 }。戻り値:{ events, before:{ left, right }(ラウンドの前の2体。画面に出す用), ko:[side...] }
  function playRound(st, picks, rng) {
    for (const side of SIDES) {
      if (!(st.team[side][picks[side]] && st.team[side][picks[side]].hp > 0)) throw new Error("倒れたキャラは出せない");
      if (!allowed(st, side).includes(picks[side])) throw new Error("出撃済みのキャラは出せない");
    }
    const first = nextFirst(st, picks);
    const before = { left: st.team.left[picks.left], right: st.team.right[picks.right] };
    const team = clone(st.team);
    const L = team.left[picks.left], R = team.right[picks.right];
    const bench = {};
    for (const side of SIDES) bench[side] = team[side].filter((u, i) => i !== picks[side]);
    // v1.7.1:『恐怖』はチームのだれか(生きている控えも)が持っていれば、相手のキャラ全員に効く
    for (const side of SIDES) {
      const fear = team[side].some((u) => u.hp > 0 && skillsOf(u).includes("恐怖"));
      for (const u of team[side]) u.teamFear = fear;
    }
    const pair = `${picks.left}-${picks.right}`;
    const hpBefore = st.team.left.concat(st.team.right).reduce((a, u) => a + u.hp, 0);
    // v1.7.3:ラウンド1の先攻(ランダムのとき)は、作ったときに決めておいた側(選ぶ画面に出すため)
    const so = { oneRound: true, round0: st.round, firstR1Side: st.firstR1Side, bench, newPair: pair !== st.lastPair };
    if (st.round === 0 && first.side) { so.firstSide = first.side; so.firstReason = first.fixed || first.random ? first.reason : "(ランダム)"; }
    const sim = B.simulate(L, R, rng, so);
    st.team = team;
    st.round++;
    if (st.round === 1) {
      const r = sim.events.find((e) => e.type === "round");
      st.firstR1Side = r ? r.first : "left";
    }
    st.active = { ...picks };
    st.lastPair = pair;
    for (const side of SIDES) {
      st.seen[side][picks[side]] = true;
      // v1.7.1:一度戦った相手のスキルは、ラウンドが終わったら全部見える(ラウンドの途中は、発動したら公開)
      st.skillSeen[side][picks[side]] = true;
      // v1.7.4:このフェイズに戦った
      st.used[side][picks[side]] = true;
    }
    const ko = SIDES.filter((s) => team[s][picks[s]].hp <= 0);
    for (const s of ko) st.fallen[s].push(picks[s]);
    // 最後のイベント(end)は、倒れたときは「○○は倒れた!」、倒れていなければ出さない
    const end = sim.events[sim.events.length - 1];
    if (end && end.type === "end") {
      if (ko.length) end.text = ko.map((s) => `${team[s][picks[s]].name}は倒れた!`).join("");
      else end.quiet = true;
      end.teamKo = ko;
    }
    const all = team.left.concat(team.right);
    const hpAfter = all.reduce((a, u) => a + u.hp, 0);
    st.quiet = hpAfter === hpBefore && !all.some((u) => u.hp > 0 && u.status) ? st.quiet + 1 : 0;
    checkOver(st, rng);
    const inherit = [], heals = [];
    let phase = null;
    if (!st.done) {
      for (const side of SIDES) { const x = inheritLast(st, side); if (x) inherit.push(x); }
      if (advancePhase(st)) {
        phase = st.phase; // v1.7.4:次のフェイズへ
        // v1.7.5:神官の回復は、フェイズが変わったとき(前はラウンドの終わりごと)
        for (const side of SIDES) heals.push(...priestHeal(st, side));
      }
    }
    return { events: sim.events, before, ko, inherit, heals, phase };
  }

  // v1.7.1:2人倒れて最後の1人(王)になったら、2人目に倒れたキャラのスキル(全部)と属性を受け継ぐ
  // v1.7.3:4on4のときは、3人倒れて最後の1人になったら、直前(3人目)に倒れたキャラから(3on3では今までどおり2人目)
  // v1.7.5:王がひとりになったら、1人目に倒れたキャラの属性と、2人目(最後)に倒れたキャラの属性とスキルを受け継ぐ。
  //   属性は倒れた順に char.element2・element3(4on4は element4)。同じ属性でも足す(補正が重なる)
  const ELEM_SLOTS = ["element2", "element3", "element4"];
  function inheritLast(st, side) {
    const a = alive(st, side);
    const f = st.fallen[side];
    if (a.length !== 1 || st.inherited[side] || f.length < 2) return null;
    const from = f[f.length - 1];
    const donor = st.team[side][from], heir = st.team[side][a[0]];
    const have = skillsOf(heir);
    const added = skillsOf(donor).filter((n) => !have.includes(n));
    if (!heir.skill && added.length) heir.skill = added[0];
    heir.extraSkills = (heir.extraSkills || []).concat(added.filter((n) => n !== heir.skill));
    // v1.7.2:属性は置きかえず、2つ目の属性として足す(char.element2)。補正は2つ分(battle.js elemOf)
    // v1.7.4:同じ属性でも2つ目として足す(補正が重なる。前は1つのまま)
    // v1.7.5:倒れた仲間全員の属性を、倒れた順に足す(3on3は2つ。自分の属性と合わせて3つ)
    const fromElement = heir.char.element;
    const gained = f.map((k) => ({ name: st.team[side][k].name, element: st.team[side][k].char.element })).filter((x) => x.element);
    const ch = { ...heir.char };
    gained.slice(0, ELEM_SLOTS.length).forEach((x, n) => { ch[ELEM_SLOTS[n]] = x.element; });
    heir.char = ch;
    const element = donor.char.element;
    const elements = gained.map((x) => x.element);
    st.inherited[side] = { from, to: a[0], skills: added, element, elements, fromElement };
    return { side, from, to: a[0], skills: added, element, elements, gained, fromElement, fromName: donor.name, toName: heir.name };
  }

  // v1.7.1:神官(司祭)がチームにいて生きていれば、ラウンドの終わりに神官以外のキャラ(控えも)のHPが最大HPの15%回復
  function priestHeal(st, side) {
    const t = st.team[side];
    const priest = t.find((u) => u.hp > 0 && isPriest(u));
    if (!priest) return [];
    const pct = (C.team && C.team.priestHealPercent) || 15;
    const out = [];
    t.forEach((u, i) => {
      if (u.hp <= 0 || isPriest(u) || u.hp >= u.maxHp) return;
      const h = Math.min(u.maxHp - u.hp, Math.ceil((u.maxHp * pct) / 100));
      u.hp += h;
      out.push({ side, i, name: u.name, amount: h, priest: priest.name });
    });
    return out;
  }

  // 決着したか(全員倒した・ラウンドの上限・HPが動かない)
  function ratio(st, side) {
    const t = st.team[side];
    return t.reduce((a, u) => a + Math.max(0, u.hp), 0) / Math.max(1, t.reduce((a, u) => a + u.maxHp, 0));
  }
  // v1.7.1:王が倒れたら、そのチームの負け
  const kingDown = (st, side) => st.team[side][st.king[side]].hp <= 0;
  function checkOver(st, rng) {
    const l = alive(st, "left").length, r = alive(st, "right").length;
    const kl = kingDown(st, "left"), kr = kingDown(st, "right");
    if (l && r && !kl && !kr && st.round < MAX_ROUNDS && st.quiet < C.stalemateRounds) return false;
    st.done = true;
    if (kl !== kr) { st.winner = kl ? "right" : "left"; st.endText = "王を倒した"; st.kingKill = true; return true; }
    if (!l || !r) {
      if (l !== r) { st.winner = l ? "left" : "right"; st.endText = "全員倒した"; return true; }
    }
    // 判定:残りHPの割合(同じならランダム)
    st.judge = true;
    st.endText = !l && !r ? "相打ち" : st.round >= MAX_ROUNDS ? `${MAX_ROUNDS}ラウンドで決着がつかない` : `${C.stalemateRounds}ラウンドHPが動かない`;
    const a = ratio(st, "left"), b = ratio(st, "right");
    st.winner = a !== b ? (a > b ? "left" : "right") : rng.next() < 0.5 ? "left" : "right";
    return true;
  }

  // 両方おまかせで最後まで(テスト・バランスを見る用)
  function autoPlay(st, rng) {
    while (!st.done) playRound(st, { left: cpuPick(st, "left", rng), right: cpuPick(st, "right", rng) }, rng);
    return st.winner;
  }

  global.TeamBattle = { SIZE, SIZES: [3, 4], NO_SKILLS, MAX_ROUNDS, KING, AI, pickOpponents, bestWeaponVs, create, alive, allowed, isUsed, resting, advancePhase, fighterOf, nextFirst, changeWeapon, cpuWeapon, hpCap, isPriest, skillsOf, kingDown, cpuPick, pickScores, pairOdds, matchScore, playRound, inheritLast, priestHeal, ratio, autoPlay };
})(window);
