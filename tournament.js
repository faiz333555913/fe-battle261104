// v1.5.0:トーナメントモードの進め方(画面とは別の、計算だけの部分)。
// 「勝っても負けても次の試合がある」順位決定トーナメント。
//   1回戦の勝者どうし・敗者どうしが2回戦で当たり、これを繰り返して、最後に全員の順位(優勝〜最下位)が決まる。
//   8人なら3回戦、9〜16人なら4回戦。16人に足りない分は「不在(bye)」で埋め、不在と当たったら不戦勝。
// 状態(state)はそのまま JSON にしてブラウザに保存できる形にしてある。
(function (global) {
  "use strict";

  const BYE = "#bye";
  const isBye = (id) => typeof id === "string" && id.startsWith(BYE);
  const MIN = 8, MAX = 16;

  // ids:参加するキャラのID(8〜16人、重複なし)。opts:{ bestOf, skillMode:"random"|"carry", skills, rng }
  // rng():0以上1未満を返す関数(並び順をシャッフルする)
  function create(ids, opts = {}) {
    const uniq = Array.from(new Set(ids));
    if (uniq.length !== ids.length) throw new Error("同じキャラが2回選ばれています");
    if (ids.length < MIN || ids.length > MAX) throw new Error(`参加は${MIN}〜${MAX}人です`);
    const rnd = opts.rng || Math.random;
    const size = ids.length <= 8 ? 8 : 16;
    const players = shuffle(ids.slice(), rnd);
    const byes = size - ids.length;
    // 不在は1回戦で必ず誰かと当たるように、[キャラ, 不在] の組を先に作る。組の順番もシャッフル
    const pairs = [];
    for (let i = 0; i < byes; i++) pairs.push([players[i], BYE + (i + 1)]);
    for (let i = byes; i < players.length; i += 2) pairs.push([players[i], players[i + 1]]);
    const order = shuffle(pairs, rnd).flat();
    const state = {
      v: 1,
      ids: ids.slice(),
      size,
      bestOf: opts.bestOf === 2 ? 2 : 1,
      skillMode: opts.skillMode === "carry" ? "carry" : "random",
      skills: { ...(opts.skills || {}) },
      weapons: {},              // キャラごとに最後に選んだ武器
      record: Object.fromEntries(ids.map((id) => [id, { w: 0, l: 0 }])),
      rounds: [],
      round: 0,
      done: false,
      ranking: null,            // [{ id, rank }]
      createdAt: Date.now(),
    };
    state.rounds.push(makeRound([{ lo: 1, hi: size, order }]));
    settleByes(state);
    return state;
  }

  function shuffle(a, rnd) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // グループ(同じ成績の人たち)の中で、並び順に2人ずつ当てる
  function makeRound(groups) {
    const matches = [];
    for (const g of groups) {
      for (let i = 0; i + 1 < g.order.length; i += 2) {
        matches.push({ lo: g.lo, hi: g.hi, a: g.order[i], b: g.order[i + 1], winner: null, loser: null, bye: false, score: null, judge: false });
      }
    }
    return { groups: groups.map((g) => ({ lo: g.lo, hi: g.hi, order: g.order.slice() })), matches };
  }

  // 不在が絡む試合は、すぐに結果を決める(キャラ vs 不在 = キャラの不戦勝。不在どうしは前の不在が勝ち扱い)
  function settleByes(state) {
    const r = state.rounds[state.round];
    for (const m of r.matches) {
      if (m.winner || !(isBye(m.a) || isBye(m.b))) continue;
      const aWins = !isBye(m.a) || isBye(m.b);
      m.winner = aWins ? m.a : m.b;
      m.loser = aWins ? m.b : m.a;
      m.bye = true;
    }
    maybeAdvance(state);
  }

  // いまの回戦が全部終わったら、次の回戦を作る(全員の順位が決まったら終了)
  function maybeAdvance(state) {
    const r = state.rounds[state.round];
    if (r.matches.some((m) => !m.winner)) return;
    const next = [];
    for (const g of r.groups) {
      const ms = r.matches.filter((m) => m.lo === g.lo && m.hi === g.hi);
      const half = (g.hi - g.lo + 1) / 2;
      next.push({ lo: g.lo, hi: g.lo + half - 1, order: ms.map((m) => m.winner) });
      next.push({ lo: g.lo + half, hi: g.hi, order: ms.map((m) => m.loser) });
    }
    if (next.every((g) => g.order.length === 1)) {
      state.done = true;
      const placed = next.sort((x, y) => x.lo - y.lo).map((g) => g.order[0]).filter((id) => !isBye(id));
      state.ranking = placed.map((id, i) => ({ id, rank: i + 1 }));
      return;
    }
    state.rounds.push(makeRound(next));
    state.round++;
    settleByes(state);
  }

  // 次に戦う試合(不在の試合は飛ばす)。{ round, index, match } or null
  function nextMatch(state) {
    if (state.done) return null;
    const r = state.rounds[state.round];
    const index = r.matches.findIndex((m) => !m.winner);
    return index < 0 ? null : { round: state.round, index, match: r.matches[index] };
  }

  // 試合の結果を記録する。winnerId は a か b。info:{ score:"2-1", judge:true(判定勝ち) }
  function report(state, index, winnerId, info = {}) {
    const m = state.rounds[state.round].matches[index];
    if (!m || m.winner) throw new Error("その試合は終わっています");
    if (winnerId !== m.a && winnerId !== m.b) throw new Error("この試合のキャラではありません");
    m.winner = winnerId;
    m.loser = winnerId === m.a ? m.b : m.a;
    m.score = info.score || null;
    m.judge = !!info.judge;
    state.record[m.winner].w++;
    state.record[m.loser].l++;
    maybeAdvance(state);
    return m;
  }

  // 『持ち越し』のとき:勝ったキャラは相手のスキルをもらい、自分の前のスキルを相手に渡す(交換)
  function swapSkills(state, winnerId, loserId) {
    const s = state.skills;
    [s[winnerId], s[loserId]] = [s[loserId], s[winnerId]];
  }

  const totalRounds = (state) => Math.log2(state.size);

  // 試合の名前。最後の回戦:1位の組=優勝決定戦、キャラがいる一番下の組=最下位決定戦、ほかは順位決定戦
  // それより前の回戦:「全勝どうし」「全敗どうし」「1勝1敗どうし」のように成績で呼ぶ
  function matchLabel(state, roundIdx, m) {
    const last = roundIdx === totalRounds(state) - 1;
    // ここまでの勝ち数:グループが上から何番目か(pos)を2進数で見て、0 の桁が勝ち・1 の桁が負け
    const span = m.hi - m.lo + 1;
    const pos = (m.lo - 1) / span; // 0 が全勝の組
    let w = 0;
    for (let b = 0; b < roundIdx; b++) if (((pos >> (roundIdx - 1 - b)) & 1) === 0) w++;
    const l = roundIdx - w;
    if (last) {
      if (m.lo === 1) return "優勝決定戦";
      const lowest = lowestRealGroup(state, roundIdx);
      if (lowest && lowest.lo === m.lo) return "最下位決定戦";
      // 上の組にいるキャラ(不在は数えない)の人数 + 1 位を決める試合
      const above = state.rounds[roundIdx].matches.filter((x) => x.lo < m.lo).reduce((n, x) => n + [x.a, x.b].filter((id) => !isBye(id)).length, 0);
      return `${above + 1}位決定戦`;
    }
    if (roundIdx === 0) return "";
    if (l === 0) return `${w}勝どうし`;
    if (w === 0) return `${l}敗どうし`;
    return `${w}勝${l}敗どうし`;
  }
  function lowestRealGroup(state, roundIdx) {
    const r = state.rounds[roundIdx];
    const real = r.matches.filter((m) => !isBye(m.a) && !isBye(m.b));
    return real.length ? real.reduce((x, y) => (y.lo > x.lo ? y : x)) : null;
  }
  function roundName(state, roundIdx) {
    return roundIdx === totalRounds(state) - 1 ? "最終戦" : `${roundIdx + 1}回戦`;
  }

  // 保存したデータが使えるか(キャラが消されていないか)
  function valid(state, exists) {
    return !!(state && state.v === 1 && Array.isArray(state.ids) && state.ids.every(exists) && state.rounds && state.rounds.length);
  }

  // 試合の数(不在の試合は除く)と、終わった数
  function progress(state) {
    let total = 0, done = 0;
    const R = totalRounds(state);
    // まだ作られていない回戦も数える:どの回戦も、キャラどうしの試合はだいたい同じ数。作られた回戦は実数、残りは1回戦の数で見積もる
    for (let i = 0; i < R; i++) {
      const r = state.rounds[i];
      if (r) {
        const real = r.matches.filter((m) => !m.bye);
        total += real.length;
        done += real.filter((m) => m.winner).length;
      } else {
        total += Math.floor(state.ids.length / 2);
      }
    }
    return { total, done };
  }

  global.Tournament = { BYE, MIN, MAX, isBye, create, nextMatch, report, swapSkills, matchLabel, roundName, totalRounds, valid, progress, shuffle };
})(window);
