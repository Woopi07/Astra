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
  const fresh = () => ({ xp: 0, awarded: {}, habits: [], questStep: 0, questStarted: false, best: {}, seenEdu: [], seenAdm: [] });
  let state = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { /* storage unavailable: progress lasts this visit only */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  const rankFor = (xp) => RANKS.reduce((r, k) => (xp >= k.min ? k : r), RANKS[0]);

  function renderXP(bump) {
    const rank = rankFor(state.xp);
    $("#xpValue").textContent = String(state.xp).padStart(4, "0");
    $("#rankValue").textContent = rank.name;
    $("#calcMain").textContent = state.xp + " XP";
    const next = RANKS.find((r) => r.min > state.xp);
    $("#calcSub").textContent = "RANK: " + rank.name.toUpperCase() + (next ? " · NEXT AT " + next.min : " · MAX");
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
    toast(after !== before ? `Rank up! You're now a ${after}` : `+${amount} XP${label ? " · " + label : ""}`);
    return amount;
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

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
      if (bal.pick === r.answer && bal.tries === 1) award("bal-" + bal.round, 20, "Balanced on the first try");
      else if (bal.pick === r.answer) award("bal-" + bal.round, 10, "Balanced");
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
      if (thinkPick === q.answer) award("think-1", 20, "Critical thinker");
      renderThink();
    }));
    const retry = $("#thinkRetry", el);
    if (retry) retry.addEventListener("click", () => { thinkPick = null; renderThink(); });
  }

  /* ==========================================================
     STUDENTS — Case study quest + inventory
     ========================================================== */
  const qs = { wrong: [], solved: false };

  function renderInventory() {
    $("#invCount").textContent = state.habits.length + " / " + HABITS.length;
    $("#invList").innerHTML = HABITS.map((h, i) => {
      const got = state.habits.includes(h.id);
      return `<li class="inv-item ${got ? "got" : "locked"}">
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
        if (!state.habits.includes(habit.id)) state.habits.push(habit.id);
        save();
        award("quest-" + step, qs.wrong.length ? 50 : 100, habit.item + " acquired");
        renderInventory();
      } else {
        qs.wrong.push(i);
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
      return `<button type="button" class="sq-card bg-${g.color}" data-g="${n}">
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
    sq = { game, i: -1, score: 0, pick: null, order: [] };
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
          <p class="story">Best score: ${state.best[g.id]} / ${total}</p>
        </div>
        <div class="actions" style="justify-content:center">
          <button type="button" class="key key-yellow" id="sqAgain">Play again</button>
          <button type="button" class="key key-ghost" data-close>Choose another quest</button>
        </div>`;
      $("#sqAgain", p).addEventListener("click", () => { sq.i = -1; sq.score = 0; nextSQ(); });
      bindClose(p);
      renderSQGrid();
      return;
    }

    const q = g.items[sq.i];
    const done = sq.pick !== null;
    const correctPos = sq.order.indexOf(q.answer);
    const right = done && sq.order[sq.pick] === q.answer;

    p.innerHTML = `
      <div class="panel-top"><span class="chip">${esc(g.title)}</span><span class="sq-score">Score ${sq.score} · ${String(sq.i + 1).padStart(2, "0")} / ${g.items.length}</span></div>
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
        award(g.id + "-" + sq.i, 10);
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

  /* ---------------- Init ---------------- */
  function init() {
    $("#year").textContent = new Date().getFullYear();
    renderXP(false);
    renderBalance();
    renderThink();
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
    init();
    toast("Progress reset");
  });

  init();
})();
