/* ==========================================================
   ASTRA — app logic (routing, XP, games)
   ========================================================== */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const peso = (n) => "₱" + n.toLocaleString("en-PH");
  const LETTERS = ["A", "B", "C", "D", "E"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Progress (saved per browser) ---------------- */
  const KEY = "astra-progress-v1";
  const fresh = () => ({ xp: 0, awarded: {}, habits: [], questStep: 0, questStarted: false, best: {}, seenEdu: [], seenAdm: [], badges: [], rushBest: 0, sound: false });
  let state = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { /* storage unavailable: progress lasts this visit only */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };
  let badgeCheckQueued = false;
  const save = () => {
    persist();
    if (!badgeCheckQueued) { badgeCheckQueued = true; setTimeout(() => { badgeCheckQueued = false; checkBadges(); }, 0); }
  };

  const rankFor = (xp) => RANKS.reduce((r, k) => (xp >= k.min ? k : r), RANKS[0]);

  function renderXP(bump) {
    const rank = rankFor(state.xp);
    $("#xpValue").textContent = String(state.xp).padStart(4, "0");
    $("#rankValue").textContent = rank.name;
    $("#calcMain").textContent = state.xp + " XP";
    const next = RANKS.find((r) => r.min > state.xp);
    $("#calcSub").textContent = "RANK: " + rank.name.toUpperCase() + (next ? " · NEXT AT " + next.min : " · MAX");
    $("#badgeCount").textContent = state.badges.length + "★";
    if (bump && !reduceMotion) {
      const lcd = $(".lcd");
      lcd.classList.remove("bump"); void lcd.offsetWidth; lcd.classList.add("bump");
    }
  }

  /** Give XP once per key so replays can't farm points. */
  function award(key, amount, label) {
    if (state.awarded[key]) return 0;
    const before = rankFor(state.xp).name;
    state.awarded[key] = amount;
    state.xp += amount;
    save();
    renderXP(true);
    const after = rankFor(state.xp).name;
    if (after !== before) { toast(`Rank up! You're now a ${after}`); fx.sound("level"); fx.burst(null, 70); }
    else toast(`+${amount} XP${label ? " · " + label : ""}`);
    return amount;
  }

  const toastQueue = [];
  let toastBusy = false;
  function toast(msg) {
    toastQueue.push(msg);
    if (!toastBusy) nextToast();
  }
  function nextToast() {
    const t = $("#toast");
    const msg = toastQueue.shift();
    if (!msg) { toastBusy = false; return; }
    toastBusy = true;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => { t.classList.remove("show"); setTimeout(nextToast, 300); }, 1900);
  }

  /* ---------------- Effects: sound + confetti ---------------- */
  const fx = (() => {
    let ctx = null;
    const tones = {
      ok: [[660, 0], [880, 0.08]],
      bad: [[220, 0], [180, 0.09]],
      click: [[520, 0]],
      level: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]],
      badge: [[784, 0], [1175, 0.12]]
    };
    function sound(name) {
      if (!state.sound) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        (tones[name] || tones.click).forEach(([f, at]) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = name === "bad" ? "sawtooth" : "triangle";
          o.frequency.value = f;
          const t0 = ctx.currentTime + at;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
          o.connect(g).connect(ctx.destination);
          o.start(t0); o.stop(t0 + 0.2);
        });
      } catch (e) { /* audio unavailable */ }
    }
    const COLORS = ["#ffd23f", "#7b8cff", "#ff8a75", "#46d6b0", "#eef1ff"];
    const GLYPHS = ["+", "−", "×", "÷", "₱", "★"];
    function burst(origin, n = 26) {
      if (reduceMotion) return;
      let x = window.innerWidth / 2, y = window.innerHeight / 3;
      if (origin && origin.getBoundingClientRect) {
        const r = origin.getBoundingClientRect();
        if (!r.width && !r.height) return;
        x = r.left + r.width / 2; y = r.top + r.height / 2;
      }
      for (let i = 0; i < n; i++) {
        const el = document.createElement("span");
        el.className = "confetti";
        const glyph = Math.random() < 0.45;
        el.textContent = glyph ? GLYPHS[i % GLYPHS.length] : "";
        el.style.cssText = `left:${x}px;top:${y}px;color:${COLORS[i % COLORS.length]};${glyph ? "" : "background:" + COLORS[i % COLORS.length] + ";"}`;
        document.body.appendChild(el);
        const ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 180;
        const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 120;
        el.animate([
          { transform: "translate(-50%,-50%) rotate3d(1,1,0,0deg) scale(1)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 260}px)) rotate3d(1,1,0,${540 + Math.random() * 540}deg) scale(.6)`, opacity: 0 }
        ], { duration: 1000 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => el.remove();
      }
    }
    return { sound, burst };
  })();
  const good = (el, n) => { fx.sound("ok"); fx.burst(el, n || 18); };
  const bad = (el) => {
    fx.sound("bad");
    if (el && !reduceMotion) el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 260 });
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------------- Router ---------------- */
  const VIEWS = ["home", "students", "hub", "educators", "admins"];
  function route() {
    const hash = (location.hash || "#home").slice(1);
    const target = hash === "sidequests" ? "students" : (VIEWS.includes(hash) ? hash : "home");
    $$(".view").forEach((v) => { v.hidden = v.dataset.view !== target; });
    $$(".pill").forEach((p) => {
      const on = p.dataset.tab === target;
      p.classList.toggle("active", on);
      if (on) p.setAttribute("aria-current", "page"); else p.removeAttribute("aria-current");
    });
    if (hash === "sidequests") {
      requestAnimationFrame(() => $("#sidequests").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }));
    } else {
      window.scrollTo(0, 0);
    }
  }
  window.addEventListener("hashchange", route);

  /* ---------------- Icons ---------------- */
  const ICONS = {
    apply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 20h10M12 16v4M7 9h2M11 9h2M15 9h2M7 12h10"/></svg>',
    process: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 8v3M10.5 13.5v.01"/></svg>',
    explore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    adapt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };

  /* ==========================================================
     HOME — Balance the Entry
     ========================================================== */
  const bal = { round: 0, pick: null, tries: 0 };

  function renderBalance() {
    const el = $("#balanceGame");
    const r = BALANCE_ROUNDS[bal.round];
    const fill = (lines) => lines.map((l) => ({ acct: l.acct, amt: l.amt === null ? bal.pick : l.amt, unknown: l.amt === null }));
    const debit = fill(r.debit), credit = fill(r.credit);
    const sum = (ls) => ls.reduce((s, l) => s + (l.amt || 0), 0);
    const dT = sum(debit), cT = sum(credit);
    const max = Math.max(dT, cT, 1);
    const angle = Math.max(-10, Math.min(10, ((cT - dT) / max) * 14));
    const balanced = bal.pick !== null && dT === cT;

    const rows = (ls) => ls.map((l) => `<div class="row"><span>${esc(l.acct)}</span><span class="${l.unknown && bal.pick === null ? "q" : ""}">${l.amt === null ? "?" : l.amt.toLocaleString("en-PH")}</span></div>`).join("");
    const dots = BALANCE_ROUNDS.map((_, i) => `<i class="${i < bal.round ? "done" : i === bal.round ? "on" : ""}"></i>`).join("");

    let fb = "";
    if (bal.pick !== null) {
      if (balanced) fb = `<div class="feedback ok"><b>Balanced! Debits = Credits = ${peso(dT)}</b>${esc(r.note)}</div>`;
      else {
        const diff = Math.abs(dT - cT);
        const side = cT < dT ? "Credits are short" : "Debits are short";
        fb = `<div class="feedback bad"><b>Off by ${peso(diff)}.</b>${side}. Try another amount.</div>`;
      }
    }
    const last = bal.round === BALANCE_ROUNDS.length - 1;

    el.innerHTML = `
      <div class="panel-top"><span class="mono-k">Try it: balance the entry</span><div class="dots" aria-label="Round ${bal.round + 1} of ${BALANCE_ROUNDS.length}">${dots}</div></div>
      <h3>${esc(r.prompt)}</h3>
      <div class="scale" aria-hidden="true">
        <div class="fulcrum"></div>
        <div class="beam" style="transform: rotate(${angle}deg)">
          <div class="pan pan-debit" style="transform: rotate(${-angle}deg)"><b>Debit</b>${rows(debit)}</div>
          <div class="pan pan-credit" style="transform: rotate(${-angle}deg)"><b>Credit</b>${rows(credit)}</div>
        </div>
      </div>
      <div class="scale-totals"><span>Dr ${dT.toLocaleString("en-PH")}</span><span>Cr ${cT.toLocaleString("en-PH")}</span></div>
      <div class="amounts" role="group" aria-label="Choose the missing amount">
        ${r.options.map((o) => `<button type="button" class="choice amount ${bal.pick === o ? (balanced ? "correct" : "wrong") : ""}" data-amt="${o}" ${balanced ? "disabled" : ""}>${o.toLocaleString("en-PH")}</button>`).join("")}
      </div>
      <div aria-live="polite">${fb}</div>
      ${balanced ? `<div class="actions"><button type="button" class="key key-yellow" id="balNext">${last ? "Play again" : "Next entry →"}</button>${last ? '<a class="key key-ghost" href="#students">Start the case study →</a>' : ""}</div>` : ""}`;

    $$(".amount", el).forEach((b) => b.addEventListener("click", () => {
      bal.pick = Number(b.dataset.amt);
      bal.tries++;
      if (bal.pick === r.answer) {
        good(b);
        award("bal-" + bal.round, bal.tries === 1 ? 20 : 10, bal.tries === 1 ? "Balanced on the first try" : "Balanced");
      } else bad(el);
      renderBalance();
    }));
    const next = $("#balNext", el);
    if (next) next.addEventListener("click", () => {
      bal.round = (bal.round + 1) % BALANCE_ROUNDS.length;
      bal.pick = null; bal.tries = 0;
      renderBalance();
    });
  }

  /* ---------------- HOME — Think critically ---------------- */
  let thinkPick = null;
  function renderThink() {
    const q = THINK_QUESTION;
    const el = $("#thinkGame");
    const done = thinkPick !== null;
    const right = thinkPick === q.answer;
    el.innerHTML = `
      <div class="panel-top"><span class="chip">${esc(q.tag)}</span><span class="mono-k">Try it: think critically</span></div>
      <h3>${esc(q.title)}</h3>
      <div class="scenario">${esc(q.scenario)}</div>
      <div class="choices two">
        ${q.choices.map((c, i) => {
          let cls = "";
          if (done) cls = i === q.answer ? "correct" : (i === thinkPick ? "wrong" : "dim");
          return `<button type="button" class="choice ${cls}" data-i="${i}" ${done ? "disabled" : ""}><span class="letter">${LETTERS[i]}</span><span>${esc(c)}</span></button>`;
        }).join("")}
      </div>
      <div aria-live="polite">${done ? `<div class="feedback ${right ? "ok" : "bad"}"><b>${right ? "✓ Correct! Well done." : "Not quite."}</b>${esc(q.explain)}</div>` : ""}</div>
      ${done ? `<div class="actions"><a class="key key-yellow" href="#sidequests">More challenges →</a>${right ? "" : '<button type="button" class="key key-ghost" id="thinkRetry">Try again</button>'}</div>` : ""}`;
    $$(".choice", el).forEach((b) => b.addEventListener("click", () => {
      thinkPick = Number(b.dataset.i);
      if (thinkPick === q.answer) { good(b); award("think-1", 20, "Critical thinker"); } else bad(el);
      renderThink();
    }));
    const retry = $("#thinkRetry", el);
    if (retry) retry.addEventListener("click", () => { thinkPick = null; renderThink(); });
  }

  /* ==========================================================
     STUDENTS — Case study quest + inventory
     ========================================================== */
  const qs = { wrong: [], solved: false };

  function renderInventory(fresh) {
    $("#invCount").textContent = state.habits.length + " / " + HABITS.length;
    $("#invList").innerHTML = HABITS.map((h, i) => {
      const got = state.habits.includes(h.id);
      return `<li class="inv-item ${got ? "got" : "locked"} ${fresh === h.id ? "flip-in" : ""}">
        <span class="ic">${got ? ICONS[h.id] : ICONS.lock}</span>
        <div>
          <span class="item-name">${got ? esc(h.item) : "Locked · Challenge " + (i + 1)}</span>
          <h3>${i + 1}. ${esc(h.title)}</h3>
          ${got ? `<p>${esc(h.desc)}</p>` : ""}
        </div>
      </li>`;
    }).join("");
  }

  function renderQuest() {
    const el = $("#questPanel");
    const C = CASE_STUDY.challenges;
    const step = state.questStep;
    const bars = C.map((_, i) => `<i class="${i < step || (i === step && qs.solved) ? "done" : i === step ? "now" : ""}"></i>`).join("");

    if (!state.questStarted) {
      el.innerHTML = `
        <div class="panel-top"><span class="company-tag">Case study</span><span class="mono-k">5 challenges · up to 500 XP</span></div>
        <h3>${esc(CASE_STUDY.company)}: Month-End Close</h3>
        <p class="story">${esc(CASE_STUDY.intro)}</p>
        <div class="actions"><button type="button" class="key key-yellow" id="qStart">Begin case study →</button></div>`;
      $("#qStart", el).addEventListener("click", () => { state.questStarted = true; save(); renderQuest(); });
      return;
    }

    if (step >= C.length) {
      el.innerHTML = `
        <div class="quest-progress">${bars}</div>
        <div class="trophy">
          <span class="mono-k">Case study complete</span>
          <div class="big">5 / 5</div>
          <h3>All five habits collected!</h3>
          <p class="story">You closed the books for ${esc(CASE_STUDY.company)}. Keep these habits equipped. They carry across every accounting system you'll use.</p>
        </div>
        <div class="actions" style="justify-content:center">
          <a class="key key-yellow" href="#sidequests">Take on the side quests →</a>
          <button type="button" class="key key-ghost" id="qReplay">Replay case study</button>
        </div>`;
      fx.burst($(".trophy .big", el), 60);
      $("#qReplay", el).addEventListener("click", () => { state.questStep = 0; qs.wrong = []; qs.solved = false; save(); renderQuest(); });
      return;
    }

    const c = C[step];
    const habit = HABITS[c.habit];
    el.innerHTML = `
      <div class="panel-top"><span class="company-tag">${esc(CASE_STUDY.company)}</span><span class="mono-k">Challenge ${String(step + 1).padStart(2, "0")} / ${String(C.length).padStart(2, "0")}</span></div>
      <div class="quest-progress" aria-hidden="true">${bars}</div>
      <h3>${esc(c.title)}</h3>
      <div class="scenario">${esc(c.scenario)}</div>
      <p><strong>${esc(c.question)}</strong></p>
      <div class="choices">
        ${c.choices.map((ch, i) => {
          let cls = "";
          if (qs.solved) cls = i === c.answer ? "correct" : "dim";
          else if (qs.wrong.includes(i)) cls = "wrong";
          const dis = qs.solved || qs.wrong.includes(i);
          return `<button type="button" class="choice ${cls}" data-i="${i}" ${dis ? "disabled" : ""}><span class="letter">${LETTERS[i]}</span><span>${esc(ch)}</span></button>`;
        }).join("")}
      </div>
      <div aria-live="polite">
        ${!qs.solved && qs.wrong.length ? '<div class="feedback bad"><b>Not quite. Try again.</b>Every adventurer misses sometimes. Re-read the scenario and pick another move.</div>' : ""}
        ${qs.solved ? `<div class="feedback ok"><b>✓ Challenge cleared!</b>${esc(c.explain)}</div>
          <div class="unlock"><span class="ic">${ICONS[habit.id]}</span><div><small>Habit unlocked · ${esc(habit.item)}</small><strong>${esc(habit.title)}</strong></div></div>` : ""}
      </div>
      ${qs.solved ? `<div class="actions"><button type="button" class="key key-yellow" id="qNext">${step === C.length - 1 ? "Finish the close →" : "Next challenge →"}</button></div>` : ""}`;

    $$(".choice", el).forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      if (i === c.answer) {
        qs.solved = true;
        const isNew = !state.habits.includes(habit.id);
        if (isNew) state.habits.push(habit.id);
        save();
        good(b, 34);
        award("quest-" + step, qs.wrong.length ? 50 : 100, habit.item + " acquired");
        renderInventory(isNew ? habit.id : null);
      } else {
        qs.wrong.push(i);
        bad(el);
      }
      renderQuest();
    }));
    const next = $("#qNext", el);
    if (next) next.addEventListener("click", () => {
      state.questStep++; qs.wrong = []; qs.solved = false; save(); renderQuest();
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }

  /* ---------------- STUDENTS — Side quests ---------------- */
  let sq = null; // { game, i, score, pick, order }

  function renderSQGrid() {
    $("#sqGrid").innerHTML = SIDE_QUESTS.map((g, n) => {
      const best = state.best[g.id];
      return `<button type="button" class="sq-card bg-${g.color}" data-tilt data-g="${n}">
        <span class="n">Side quest ${n + 1} · ${esc(g.focus)}</span>
        <span class="sq-title">${esc(g.title)}</span>
        <span class="sq-desc">${esc(g.objective)}</span>
        <span class="meta"><span>${best === undefined ? "Not played yet" : "Best: " + best + " / " + g.items.length}</span><span class="play">${best === undefined ? "Play ▶" : "Replay ▶"}</span></span>
      </button>`;
    }).join("");
    $$(".sq-card").forEach((b) => b.addEventListener("click", () => startSQ(Number(b.dataset.g))));
  }

  function startSQ(n) {
    const game = SIDE_QUESTS[n];
    sq = { game, i: -1, score: 0, pick: null, order: [], streak: 0, maxStreak: 0 };
    const p = $("#sqPlayer");
    p.hidden = false;
    renderSQ();
    p.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function renderSQ() {
    const p = $("#sqPlayer");
    const g = sq.game;

    if (sq.i === -1) {
      p.innerHTML = `
        <div class="panel-top"><span class="chip">${esc(g.focus)}</span><button type="button" class="linkish" data-close>Close ✕</button></div>
        <h3>${esc(g.title)}</h3>
        <p class="story"><strong>Objective:</strong> ${esc(g.objective)}</p>
        <div class="scenario"><strong>Instructions:</strong> ${esc(g.instructions)}</div>
        <div class="actions"><button type="button" class="key key-yellow" id="sqGo">Start · ${g.items.length} activities →</button></div>`;
      $("#sqGo", p).addEventListener("click", () => nextSQ());
      bindClose(p);
      return;
    }

    if (sq.i >= g.items.length) {
      const total = g.items.length;
      const pct = sq.score / total;
      const msg = pct === 1 ? "Flawless! Audit-ready." : pct >= .8 ? "Excellent work. You're nearly CPA-ready." : pct >= .5 ? "Solid effort. Review the explanations and go again." : "Keep practicing. Every attempt builds the habit.";
      const prev = state.best[g.id];
      if (prev === undefined || sq.score > prev) { state.best[g.id] = sq.score; save(); }
      p.innerHTML = `
        <div class="panel-top"><span class="chip">${esc(g.title)}</span><button type="button" class="linkish" data-close>Close ✕</button></div>
        <div class="trophy">
          <span class="mono-k">Side quest complete</span>
          <div class="big">${sq.score} / ${total}</div>
          <h3>${esc(msg)}</h3>
          <p class="story">Best score: ${state.best[g.id]} / ${total} · Longest streak: ${sq.maxStreak}</p>
        </div>
        <div class="actions" style="justify-content:center">
          <button type="button" class="key key-yellow" id="sqAgain">Play again</button>
          <button type="button" class="key key-ghost" data-close>Choose another quest</button>
        </div>`;
      $("#sqAgain", p).addEventListener("click", () => { sq.i = -1; sq.score = 0; sq.streak = 0; sq.maxStreak = 0; nextSQ(); });
      bindClose(p);
      renderSQGrid();
      if (pct >= .8) { fx.sound("level"); fx.burst($(".trophy .big", p), 60); }
      return;
    }

    const q = g.items[sq.i];
    const done = sq.pick !== null;
    const correctPos = sq.order.indexOf(q.answer);
    const right = done && sq.order[sq.pick] === q.answer;

    p.innerHTML = `
      <div class="panel-top"><span class="chip">${esc(g.title)}</span><span class="sq-score">${sq.streak >= 2 ? `<span class="streak">Streak ×${sq.streak}</span>` : ""}Score ${sq.score} · ${String(sq.i + 1).padStart(2, "0")} / ${g.items.length}</span></div>
      <div class="quest-progress" aria-hidden="true">${g.items.map((_, k) => `<i class="${k < sq.i ? "done" : k === sq.i ? "now" : ""}"></i>`).join("")}</div>
      <span class="mono-k">Activity ${sq.i + 1}</span>
      <h3>${esc(q.title)}</h3>
      <div class="scenario">${esc(q.scenario)}</div>
      <p><strong>${esc(q.question)}</strong></p>
      <div class="choices">
        ${sq.order.map((orig, pos) => {
          let cls = "";
          if (done) cls = pos === correctPos ? "correct" : (pos === sq.pick ? "wrong" : "dim");
          return `<button type="button" class="choice ${cls}" data-pos="${pos}" ${done ? "disabled" : ""}><span class="letter">${LETTERS[pos]}</span><span>${esc(q.choices[orig])}</span></button>`;
        }).join("")}
      </div>
      <div aria-live="polite">${done ? `<div class="feedback ${right ? "ok" : "bad"}"><b>${right ? "✓ Correct!" : "✗ The best answer is " + LETTERS[correctPos] + "."}</b>${esc(q.explain)}</div>` : ""}</div>
      <div class="actions">
        ${done ? `<button type="button" class="key key-yellow" id="sqNext">${sq.i === g.items.length - 1 ? "See results →" : "Next activity →"}</button>` : ""}
        <button type="button" class="linkish" data-close>Quit</button>
      </div>`;

    $$(".choice", p).forEach((b) => b.addEventListener("click", () => {
      sq.pick = Number(b.dataset.pos);
      if (sq.order[sq.pick] === q.answer) {
        sq.score++;
        sq.streak++;
        sq.maxStreak = Math.max(sq.maxStreak, sq.streak);
        good(b, sq.streak >= 3 ? 40 : 18);
        if (sq.streak === 3 || sq.streak === 5 || sq.streak === 10) toast(`Streak ×${sq.streak}! Keep it going`);
        award(g.id + "-" + sq.i, 10);
      } else {
        sq.streak = 0;
        bad(p);
      }
      renderSQ();
      const nb = $("#sqNext", p); if (nb) nb.focus({ preventScroll: true });
    }));
    const nb = $("#sqNext", p);
    if (nb) nb.addEventListener("click", () => { nextSQ(); p.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); });
    bindClose(p);
  }

  function nextSQ() {
    sq.i++;
    sq.pick = null;
    const q = sq.game.items[sq.i];
    if (q) sq.order = shuffle(q.choices.map((_, k) => k));
    renderSQ();
  }

  function bindClose(p) {
    $$("[data-close]", p).forEach((b) => b.addEventListener("click", () => {
      p.hidden = true; sq = null;
      $("#sidequests").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }));
  }

  /* ==========================================================
     RESOURCE HUB
     ========================================================== */
  let hubActive = 0;
  function renderHub() {
    const tabs = $("#hubTabs");
    tabs.innerHTML = HUB_TABS.map((t, i) => `<button type="button" class="sheet-tab" role="tab" id="tab-${t.id}" aria-selected="${i === hubActive}" tabindex="${i === hubActive ? 0 : -1}" data-i="${i}">${esc(t.label)}</button>`).join("");
    const t = HUB_TABS[hubActive];
    $("#hubFormula").textContent = t.formula;
    const body = $("#hubBody");
    body.setAttribute("aria-labelledby", "tab-" + t.id);
    body.innerHTML = `
      <div class="sheet-card">
        <span class="mono-k">${esc(t.label)}</span>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.desc)}</p>
        <ul class="res-list">
          ${t.links.map((l) => {
            const ext = l.kind !== "internal";
            const kind = l.kind === "video" ? "▶ YouTube" : l.kind === "site" ? "↗ Website" : "◆ Play on ASTRA";
            return `<li><a class="res" href="${esc(l.url)}" ${ext ? 'target="_blank" rel="noopener noreferrer"' : ""}>
              <span class="tag">${esc(l.tag)}</span><span class="lbl">${esc(l.label)}</span><span class="kind">${kind}</span></a></li>`;
          }).join("")}
        </ul>
      </div>`;
    $$(".sheet-tab", tabs).forEach((b) => {
      b.addEventListener("click", () => { hubActive = Number(b.dataset.i); renderHub(); });
      b.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        hubActive = (hubActive + (e.key === "ArrowRight" ? 1 : -1) + HUB_TABS.length) % HUB_TABS.length;
        renderHub();
        $(`[data-i="${hubActive}"]`, tabs).focus();
      });
    });
  }

  /* ==========================================================
     EDUCATORS / ADMINS — expandable cards
     ========================================================== */
  const COLORS = ["var(--yellow)", "var(--blue)", "var(--coral)", "var(--mint)"];

  function renderCards(cfg) {
    const { list, mount, seenKey, countEl, barEl, label, bodyFn } = cfg;
    const wrap = $(mount);
    wrap.innerHTML = list.map((item, i) => `
      <article class="card">
        <button type="button" class="card-btn" aria-expanded="false" aria-controls="${seenKey}-${i}">
          <span class="card-num" style="background:${COLORS[i % COLORS.length]}">${String(i + 1).padStart(2, "0")}</span>
          <span>
            <span class="card-title">${esc(item.title)}</span>
            ${state[seenKey].includes(i) ? '<span class="seen-dot">● Explored</span>' : ""}
          </span>
          <span class="chev" aria-hidden="true">+</span>
        </button>
        <div class="card-body" id="${seenKey}-${i}" hidden>${bodyFn(item)}</div>
      </article>`).join("");

    const update = () => {
      const n = state[seenKey].length;
      $(countEl).textContent = `${n} / ${list.length} explored`;
      $(barEl).style.width = (n / list.length) * 100 + "%";
    };
    update();

    $$(".card-btn", wrap).forEach((btn, i) => btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      const body = card.querySelector(".card-body");
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      body.hidden = open;
      card.classList.toggle("open", !open);
      if (!open && !state[seenKey].includes(i)) {
        state[seenKey].push(i);
        save();
        const tag = document.createElement("span");
        tag.className = "seen-dot"; tag.textContent = "● Explored";
        btn.querySelector(".card-title").after(tag);
        update();
        if (state[seenKey].length === list.length) toast(`All ${list.length} ${label} explored ✓`);
      }
    }));
  }


  /* ==========================================================
     HOME — Debit or Credit Rush (timed)
     ========================================================== */
  const RUSH_TIME = 30;
  const rush = { phase: "idle", score: 0, streak: 0, best: 0, deck: [], cur: null, left: RUSH_TIME, timer: null, last: null };

  function renderRush() {
    const el = $("#rushGame");
    if (rush.phase === "idle" || rush.phase === "over") {
      const over = rush.phase === "over";
      el.innerHTML = `
        <div class="rush-intro">
          <div>
            <span class="mono-k">Speed round · ${RUSH_TIME} seconds</span>
            <h3>${over ? `Time's up! You scored <span class="hl">${rush.score}</span>` : "Debit or Credit Rush"}</h3>
            <p class="story">${over
              ? `Best: ${state.rushBest} · Longest streak: ${rush.best}. ${rush.score >= 15 ? "Lightning-fast ledger work!" : rush.score >= 10 ? "Great instincts. Can you hit 15?" : "Remember DEALER: Drawings, Expenses, Assets increase with debits; Liabilities, Equity, Revenue increase with credits."}`
              : "An account change flashes on the card. Decide if it's recorded as a <b>debit</b> or a <b>credit</b> before time runs out. Use the buttons, or press <kbd>←</kbd>/<kbd>D</kbd> for debit and <kbd>→</kbd>/<kbd>C</kbd> for credit."}</p>
            <div class="actions"><button type="button" class="key key-yellow" id="rushStart">${over ? "Play again ↻" : "Start rush ▶"}</button>
            <span class="chip">Personal best: ${state.rushBest}</span></div>
          </div>
          <div class="rush-preview" aria-hidden="true">
            <div class="rush-card demo"><span class="rush-type">Asset</span><strong>Cash increases</strong><span class="rush-q">Debit or credit?</span></div>
          </div>
        </div>`;
      $("#rushStart", el).addEventListener("click", startRush);
      return;
    }
    // playing
    const c = rush.cur;
    el.innerHTML = `
      <div class="panel-top">
        <span class="mono-k">Debit or Credit Rush</span>
        <span class="rush-stats"><span class="chip">Score <b id="rushScore">${rush.score}</b></span><span class="chip ${rush.streak >= 3 ? "hot" : ""}">Streak ×${rush.streak}</span><span class="chip">⏱ <b id="rushLeft">${rush.left}</b>s</span></span>
      </div>
      <div class="bar rush-time"><i id="rushBar" style="width:${(rush.left / RUSH_TIME) * 100}%"></i></div>
      <div class="rush-stage">
        <div class="rush-card ${rush.last ? "flash-" + rush.last : ""}" id="rushCard">
          <span class="rush-type">${esc(c.type)}</span>
          <strong>${esc(c.t)}</strong>
          <span class="rush-q">Debit or credit?</span>
        </div>
      </div>
      <div class="rush-btns">
        <button type="button" class="key rush-d" data-a="D">← Debit</button>
        <button type="button" class="key rush-c" data-a="C">Credit →</button>
      </div>`;
    $$(".rush-btns .key", el).forEach((b) => b.addEventListener("click", () => answerRush(b.dataset.a, b)));
  }

  function startRush() {
    rush.phase = "play"; rush.score = 0; rush.streak = 0; rush.best = 0; rush.left = RUSH_TIME; rush.last = null;
    rush.deck = shuffle(RUSH_ITEMS);
    rush.cur = rush.deck.pop();
    clearInterval(rush.timer);
    rush.timer = setInterval(() => {
      rush.left--;
      const l = $("#rushLeft"), bar = $("#rushBar");
      if (l) l.textContent = rush.left;
      if (bar) bar.style.width = (rush.left / RUSH_TIME) * 100 + "%";
      if (rush.left <= 5 && rush.left > 0) fx.sound("click");
      if (rush.left <= 0) endRush();
    }, 1000);
    fx.sound("click");
    renderRush();
  }

  function answerRush(a, btn) {
    if (rush.phase !== "play") return;
    const right = a === rush.cur.a;
    if (right) {
      rush.score++; rush.streak++; rush.best = Math.max(rush.best, rush.streak);
      fx.sound("ok");
      if (rush.streak % 5 === 0) fx.burst(btn || $("#rushCard"), 24);
    } else {
      rush.streak = 0; fx.sound("bad");
      toast(`${rush.cur.t} → ${rush.cur.a === "D" ? "Debit" : "Credit"}`);
    }
    rush.last = right ? "ok" : "bad";
    if (!rush.deck.length) rush.deck = shuffle(RUSH_ITEMS);
    rush.cur = rush.deck.pop();
    renderRush();
  }

  function endRush() {
    clearInterval(rush.timer);
    rush.phase = "over";
    if (rush.score > state.rushBest) { state.rushBest = rush.score; save(); }
    if (rush.score >= 5) award("rush-5", 20, "Rush: 5 correct");
    if (rush.score >= 10) award("rush-10", 30, "Rush: 10 correct");
    if (rush.score >= 15) award("rush-15", 40, "Rush: 15 correct");
    if (rush.score >= 10) fx.burst($("#rushGame"), 50);
    renderRush();
  }

  /* ==========================================================
     BADGES
     ========================================================== */
  const BADGES = [
    { id: "first", icon: "₱", name: "First Entry", desc: "Earn your first XP.", test: (s) => s.xp > 0 },
    { id: "balanced", icon: "⚖", name: "Balanced Books", desc: "Balance all three entries on Home.", test: (s) => [0, 1, 2].every((i) => s.awarded["bal-" + i]) },
    { id: "thinker", icon: "◎", name: "Critical Thinker", desc: "Solve the Think Critically challenge.", test: (s) => !!s.awarded["think-1"] },
    { id: "rush", icon: "⚡", name: "Rush Hour", desc: "Score 15+ in Debit or Credit Rush.", test: (s) => s.rushBest >= 15 },
    { id: "habits", icon: "★", name: "Habit Collector", desc: "Collect all five habits.", test: (s) => s.habits.length >= HABITS.length },
    { id: "triple", icon: "▲", name: "Triple Threat", desc: "Finish all three side quests.", test: (s) => SIDE_QUESTS.every((g) => s.best[g.id] !== undefined) },
    { id: "flawless", icon: "✓", name: "Flawless", desc: "Score 10/10 in any side quest.", test: (s) => SIDE_QUESTS.some((g) => s.best[g.id] === g.items.length) },
    { id: "mentor", icon: "✎", name: "Mentor's Map", desc: "Explore all seven teaching approaches.", test: (s) => s.seenEdu.length >= APPROACHES.length },
    { id: "compass", icon: "⌖", name: "Campus Compass", desc: "Explore all five university policies.", test: (s) => s.seenAdm.length >= POLICIES.length },
    { id: "cpa", icon: "♛", name: "CPA-Ready", desc: "Reach the top rank.", test: (s) => s.xp >= RANKS[RANKS.length - 1].min }
  ];

  function checkBadges() {
    let changed = false;
    BADGES.forEach((b) => {
      if (!state.badges.includes(b.id) && b.test(state)) {
        state.badges.push(b.id); changed = true;
        toast(`Badge unlocked: ${b.icon} ${b.name}`);
        fx.sound("badge");
        fx.burst($("#lcdBtn"), 30);
      }
    });
    if (changed) { persist(); renderXP(true); if ($("#badgeDialog").open) renderBadges(); }
  }

  function renderBadges() {
    const rank = rankFor(state.xp);
    const next = RANKS.find((r) => r.min > state.xp);
    const pct = next ? ((state.xp - rank.min) / (next.min - rank.min)) * 100 : 100;
    $("#badgeRank").innerHTML = `
      <div class="br-top"><span><b>${esc(rank.name)}</b> · ${state.xp} XP</span><span class="muted">${next ? `${next.min - state.xp} XP to ${esc(next.name)}` : "Top rank reached"}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>`;
    $("#badgeGrid").innerHTML = BADGES.map((b) => {
      const got = state.badges.includes(b.id);
      return `<li class="badge ${got ? "got" : ""}"><span class="badge-coin"><span>${got ? b.icon : "?"}</span></span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></li>`;
    }).join("");
  }

  /* ==========================================================
     3D TILT (pointer-follow perspective + glare)
     ========================================================== */
  function initTilt() {
    if (reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let cur = null;
    const reset = (el) => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); el.classList.remove("tilting"); };
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest("[data-tilt]");
      if (cur && cur !== el) reset(cur);
      cur = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      const max = el.classList.contains("calc") ? 14 : 9;
      el.style.setProperty("--rx", ((0.5 - py) * max).toFixed(2) + "deg");
      el.style.setProperty("--ry", ((px - 0.5) * max).toFixed(2) + "deg");
      el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      el.classList.add("tilting");
    }, { passive: true });
    document.addEventListener("pointerleave", () => { if (cur) reset(cur); cur = null; });
  }

  /* ==========================================================
     LOADER (3D cube) 
     ========================================================== */
  function initLoader() {
    const L = $("#loader");
    if (!L) return;
    const msgs = ["Opening the books…", "Posting journal entries…", "Balancing the ledger…", "Reconciling accounts…", "Closing the period…", "Ready!"];
    const minTime = reduceMotion ? 300 : 2000;
    const start = performance.now();
    let loaded = document.readyState === "complete", finished = false;
    window.addEventListener("load", () => { loaded = true; });
    const pctEl = $("#loadPct"), bar = $("#loadBar"), msg = $("#loadMsg");
    document.documentElement.classList.add("is-loading");
    function finish() {
      if (finished) return;
      finished = true;
      pctEl.textContent = "100%"; bar.style.width = "100%"; msg.textContent = msgs[msgs.length - 1];
      L.classList.add("done");
      document.documentElement.classList.remove("is-loading");
      setTimeout(() => L.remove(), reduceMotion ? 50 : 900);
    }
    function tick(now) {
      if (finished) return;
      const t = Math.min(1, (now - start) / minTime);
      const shown = Math.floor((loaded ? t : Math.min(t, 0.9)) * 100);
      pctEl.textContent = String(shown).padStart(3, "0") + "%";
      bar.style.width = shown + "%";
      msg.textContent = msgs[Math.min(msgs.length - 2, Math.floor(shown / 20))];
      if (t >= 1 && loaded) { setTimeout(finish, 250); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    L.addEventListener("click", finish);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" || e.key === "Enter") finish(); }, { once: true });
    setTimeout(finish, 6000); // safety net
  }

  /* ==========================================================
     KEYBOARD SHORTCUTS
     ========================================================== */
  function initKeys() {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || $("#loader:not(.done)") || $("#badgeDialog").open) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const view = ($(".view:not([hidden])") || {}).dataset?.view;
      const k = e.key.toLowerCase();

      if (view === "home" && rush.phase === "play") {
        if (k === "arrowleft" || k === "d") { e.preventDefault(); answerRush("D", $(".rush-d")); }
        if (k === "arrowright" || k === "c") { e.preventDefault(); answerRush("C", $(".rush-c")); }
        return;
      }
      if (view !== "students") return;
      const panel = !$("#sqPlayer").hidden ? $("#sqPlayer") : $("#questPanel");
      const idx = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (idx >= 0 && k.length === 1) {
        const btn = $$(".choice:not([disabled])", panel).find((b) => (b.dataset.pos ?? b.dataset.i) === String(idx));
        if (btn) { e.preventDefault(); btn.click(); }
      } else if (k === "enter" && tag !== "button" && tag !== "a") {
        const go = $("#sqNext, #sqGo, #qNext, #qStart", panel);
        if (go) { e.preventDefault(); go.click(); }
      }
    });
  }

  /* ==========================================================
     HUD: sound toggle + badges dialog
     ========================================================== */
  function renderSoundBtn() {
    const b = $("#soundBtn");
    b.setAttribute("aria-pressed", String(!!state.sound));
    b.classList.toggle("on", !!state.sound);
    b.title = state.sound ? "Sound on (click to mute)" : "Sound off (click to unmute)";
  }
  $("#soundBtn").addEventListener("click", () => { state.sound = !state.sound; persist(); renderSoundBtn(); fx.sound("click"); });
  $("#lcdBtn").addEventListener("click", () => { renderBadges(); $("#badgeDialog").showModal(); });
  $("#badgeClose").addEventListener("click", () => $("#badgeDialog").close());
  $("#badgeDialog").addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); $("#badgeDialog").close(); } });
  $("#badgeDialog").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  /* ---------------- Init ---------------- */
  function init() {
    $("#year").textContent = new Date().getFullYear();
    renderXP(false);
    renderBalance();
    renderThink();
    renderRush();
    renderSoundBtn();
    renderInventory();
    renderQuest();
    renderSQGrid();
    renderHub();
    renderCards({
      list: APPROACHES, mount: "#eduCards", seenKey: "seenEdu", countEl: "#eduCount", barEl: "#eduBar", label: "approaches",
      bodyFn: (a) => `<p>${esc(a.summary)}</p><h4 style="margin-top:14px">How to apply?</h4><ul>${a.how.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
    });
    renderCards({
      list: POLICIES, mount: "#admCards", seenKey: "seenAdm", countEl: "#admCount", barEl: "#admBar", label: "policies",
      bodyFn: (p) => `<p>${esc(p.desc)}</p>`
    });

    route();
  }

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset your XP, habits and scores on this device?")) return;
    state = fresh(); save();
    qs.wrong = []; qs.solved = false; sq = null; $("#sqPlayer").hidden = true;
    bal.round = 0; bal.pick = null; bal.tries = 0; thinkPick = null;
    clearInterval(rush.timer); rush.phase = "idle";
    init();
    toast("Progress reset");
  });

  initLoader();
  init();
  initTilt();
  initKeys();
  checkBadges();
})();
