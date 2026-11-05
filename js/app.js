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
  const fresh = () => ({ xp: 0, awarded: {}, habits: [], questStep: 0, questStarted: false, best: {}, seenEdu: [], seenAdm: [], badges: [], rushBest: 0, sound: false, hubSeen: [] });
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

  /* ---------------- Settings (saved separately from progress) ---------------- */
  const SKEY = "astra-settings-v1";
  let S = { sfx: !!state.sound, sfxVol: 70, music: state.loaderMusic !== false, musicVol: 45, track: "lofi", bg: true, motion: true, confetti: true, loader: true };
  try { const raw = localStorage.getItem(SKEY); if (raw) Object.assign(S, JSON.parse(raw)); } catch (e) { /* defaults */ }
  const saveSettings = () => { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
  document.documentElement.classList.toggle("no-motion", !S.motion);

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
      if (!S.sfx) return;
      const peak = Math.max(0.0002, 0.16 * (S.sfxVol / 100));
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        (tones[name] || tones.click).forEach(([f, at]) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = name === "bad" ? "sawtooth" : "triangle";
          o.frequency.value = f;
          const t0 = ctx.currentTime + at;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
          o.connect(g).connect(ctx.destination);
          o.start(t0); o.stop(t0 + 0.2);
        });
      } catch (e) { /* audio unavailable */ }
    }
    const COLORS = ["#ffd23f", "#7b8cff", "#ff8a75", "#46d6b0", "#eef1ff"];
    const GLYPHS = ["+", "−", "×", "÷", "₱", "★"];
    function burst(origin, n = 26) {
      if (reduceMotion || !S.confetti) return;
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

  /* ---------------- Music follows what you're doing ---------------- */
  function updateMusicContext() {
    if (typeof musicCtl === "undefined") return;
    const view = ($(".view:not([hidden])") || {}).dataset?.view || "home";
    let c = view;
    if (view === "home" && rush.phase === "play") c = "rush";
    if (view === "students" && sq && !$("#sqPlayer").hidden) c = "sidequest";
    musicCtl.setContext(c);
    if (c !== "rush") musicCtl.tempo(1);
  }

  /* ---------------- Router ---------------- */
  const VIEWS = ["home", "students", "hub", "educators", "admins"];
  function route() {
    const hash = (location.hash || "#home").slice(1);
    const target = hash === "sidequests" ? "students" : (VIEWS.includes(hash) ? hash : "home");
    $$(".view").forEach((v) => { v.hidden = v.dataset.view !== target; });
    if (target === "home" && $("#overview")) renderOverview();
    if (target === "hub" && $("#hubTabs").children.length) renderHub();
    updateMusicContext();
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
     HOME — Overview flip cards (with live progress)
     ========================================================== */
  const OVERVIEW = [
    { id: "students", color: "yellow", k: "For accounting students", title: "Five habits that pay off", desc: "Habits for building skills that carry across systems, plus a case-study quest and side quests.", count: "05", cta: "Start the quest", href: "#students",
      list: () => HABITS.map((h) => ({ t: h.title, done: state.habits.includes(h.id) })) },
    { id: "hub", color: "blue", k: "Resource hub", title: "Tutorials to templates", desc: "Software guides, exercises, videos, case studies and templates.", count: "05", cta: "Open the hub", href: "#hub",
      list: () => HUB_TABS.map((t) => ({ t: t.title, done: state.hubSeen.includes(t.id) })) },
    { id: "educators", color: "coral", k: "For educators", title: "Seven approaches", desc: "Ways to teach with software, simulations and rubrics.", count: "07", cta: "See approaches", href: "#educators",
      list: () => APPROACHES.map((x, i) => ({ t: x.title, done: state.seenEdu.includes(i) })) },
    { id: "admins", color: "mint", k: "For PLV admins", title: "Five policies", desc: "Suggested university policies for technology-integrated instruction.", count: "05", cta: "Read policies", href: "#admins",
      list: () => POLICIES.map((x, i) => ({ t: x.title, done: state.seenAdm.includes(i) })) }
  ];

  function ring(pct) {
    const r = 17, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${r}" class="ring-bg"/><circle cx="22" cy="22" r="${r}" class="ring-fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct)).toFixed(1)}"/></svg>`;
  }

  function renderOverview() {
    const el = $("#overview");
    if (!el) return;
    el.innerHTML = OVERVIEW.map((o) => {
      const items = o.list();
      const done = items.filter((x) => x.done).length;
      const pct = items.length ? done / items.length : 0;
      return `<div class="flip" data-tilt>
        <div class="flip-inner ov-${o.color}" role="button" tabindex="0" aria-pressed="false" aria-label="${esc(o.title)}: flip card for details">
          <div class="flip-face flip-front">
            <span class="ov-k">${esc(o.k)}</span>
            <span class="ov-count" aria-hidden="true">${o.count}</span>
            <strong>${esc(o.title)}</strong>
            <span class="ov-desc">${esc(o.desc)}</span>
            <span class="ov-foot">
              <span class="ov-prog">${ring(pct)}<span><b>${done}/${items.length}</b> ${o.id === "students" ? "collected" : "explored"}</span></span>
              <span class="ov-flip-hint">Flip ↻</span>
            </span>
          </div>
          <div class="flip-face flip-back">
            <span class="ov-k">${esc(o.k)} · ${done}/${items.length}</span>
            <ul class="ov-list">${items.map((x) => `<li class="${x.done ? "done" : ""}">${esc(x.t)}</li>`).join("")}</ul>
            <a class="ov-go" href="${o.href}">${esc(o.cta)} →</a>
          </div>
        </div>
      </div>`;
    }).join("");
    $$(".flip-inner", el).forEach((card) => {
      const toggle = () => {
        const on = !card.classList.contains("flipped");
        card.classList.toggle("flipped", on);
        card.setAttribute("aria-pressed", String(on));
        fx.sound("click");
      };
      card.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (link) { fx.sound("click"); return; } // let the shortcut navigate
        toggle();
      });
      card.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === card) { e.preventDefault(); toggle(); } });
    });
  }

  /* ==========================================================
     HOME — Balance the Entry (hanging scale + drag weights)
     ========================================================== */
  const bal = { round: 0, pick: null, tries: 0, angle: 0, anim: null };
  const SCALE = { W: 400, H: 230, cx: 200, cy: 56, L: 128, drop: 34 };

  function balTotals(pickOverride) {
    const r = BALANCE_ROUNDS[bal.round];
    const v = pickOverride === undefined ? bal.pick : pickOverride;
    const sum = (ls) => ls.reduce((t, l) => t + (l.amt === null ? (v || 0) : l.amt), 0);
    return { d: sum(r.debit), c: sum(r.credit) };
  }
  const targetAngle = (t) => {
    const max = Math.max(t.d, t.c, 1);
    return Math.max(-0.24, Math.min(0.24, ((t.c - t.d) / max) * 0.3));
  };

  function placeScale(angle) {
    const st = $("#bscale");
    if (!st) return;
    const { cx, cy, L, drop, W, H } = SCALE;
    const lx = cx - L * Math.cos(angle), ly = cy - L * Math.sin(angle);
    const rx = cx + L * Math.cos(angle), ry = cy + L * Math.sin(angle);
    const beam = $("#bBeam", st);
    beam.setAttribute("x1", lx); beam.setAttribute("y1", ly); beam.setAttribute("x2", rx); beam.setAttribute("y2", ry);
    [["#bStrL1", lx - 22, ly], ["#bStrL2", lx + 22, ly], ["#bStrR1", rx - 22, ry], ["#bStrR2", rx + 22, ry]].forEach(([id, x, y]) => {
      const ln = $(id, st);
      ln.setAttribute("x1", id.includes("L") ? lx : rx); ln.setAttribute("y1", y);
      ln.setAttribute("x2", x); ln.setAttribute("y2", y + drop);
    });
    $("#bKnobL", st).setAttribute("cx", lx); $("#bKnobL", st).setAttribute("cy", ly);
    $("#bKnobR", st).setAttribute("cx", rx); $("#bKnobR", st).setAttribute("cy", ry);
    const pd = $(".bpan-d", st), pc = $(".bpan-c", st);
    pd.style.left = (lx / W) * 100 + "%"; pd.style.top = ((ly + drop) / H) * 100 + "%";
    pc.style.left = (rx / W) * 100 + "%"; pc.style.top = ((ry + drop) / H) * 100 + "%";
    const level = Math.abs(angle) < 0.004;
    st.classList.toggle("level", level && bal.pick !== null);
  }

  function swingTo(target) {
    cancelAnimationFrame(bal.anim);
    if (reduceMotion) { bal.angle = target; placeScale(target); return; }
    let a = bal.angle, v = 0;
    const step = () => {
      v = (v + (target - a) * 0.09) * 0.82; // damped spring
      a += v;
      bal.angle = a;
      placeScale(a);
      if (Math.abs(target - a) > 0.0005 || Math.abs(v) > 0.0005) bal.anim = requestAnimationFrame(step);
      else { bal.angle = target; placeScale(target); }
    };
    bal.anim = requestAnimationFrame(step);
  }

  function renderBalance() {
    const el = $("#balanceGame");
    const r = BALANCE_ROUNDS[bal.round];
    const t = balTotals();
    const balanced = bal.pick !== null && t.d === t.c;
    const unknownSide = r.debit.some((l) => l.amt === null) ? "d" : "c";
    const rows = (ls) => ls.map((l) => {
      if (l.amt !== null) return `<div class="brow"><span>${esc(l.acct)}</span><span>${l.amt.toLocaleString("en-PH")}</span></div>`;
      const filled = bal.pick !== null;
      return `<div class="brow"><span>${esc(l.acct)}</span><span class="slot ${filled ? (balanced ? "ok" : "bad") : ""}">${filled ? bal.pick.toLocaleString("en-PH") : "drop ?"}</span></div>`;
    }).join("");
    const dots = BALANCE_ROUNDS.map((_, i) => `<i class="${i < bal.round ? "done" : i === bal.round ? "on" : ""}"></i>`).join("");
    const diff = Math.abs(t.d - t.c);
    const last = bal.round === BALANCE_ROUNDS.length - 1;

    let fb = "";
    if (bal.pick !== null) {
      fb = balanced
        ? `<div class="feedback ok"><b>Balanced! Debits = Credits = ${peso(t.d)}</b>${esc(r.note)}</div>`
        : `<div class="feedback bad"><b>Off by ${peso(diff)}.</b>${t.c < t.d ? "Credits are short" : "Debits are short"}. Drag another amount onto the pan.</div>`;
    }

    el.innerHTML = `
      <div class="panel-top"><span class="mono-k">Try it: balance the entry</span><div class="dots" aria-label="Round ${bal.round + 1} of ${BALANCE_ROUNDS.length}">${dots}</div></div>
      <h3>${esc(r.prompt)}</h3>
      <div class="bscale" id="bscale">
        <svg viewBox="0 0 ${SCALE.W} ${SCALE.H}" aria-hidden="true">
          <path d="M200 60 L188 200 H212 Z" class="b-post"/>
          <rect x="140" y="198" width="120" height="14" rx="7" class="b-base"/>
          <g class="b-strings"><line id="bStrL1"/><line id="bStrL2"/><line id="bStrR1"/><line id="bStrR2"/></g>
          <line id="bBeam" class="b-beam"/>
          <circle id="bKnobL" r="6" class="b-knob"/><circle id="bKnobR" r="6" class="b-knob"/>
          <circle cx="200" cy="56" r="10" class="b-pivot"/>
        </svg>
        <div class="bpan bpan-d ${unknownSide === "d" && !balanced ? "target" : ""}"><b>Debit</b>${rows(r.debit)}</div>
        <div class="bpan bpan-c ${unknownSide === "c" && !balanced ? "target" : ""}"><b>Credit</b>${rows(r.credit)}</div>
      </div>
      <div class="btotals">
        <span>Dr <b>${t.d.toLocaleString("en-PH")}</b></span>
        <span class="bdiff ${balanced ? "zero" : ""}">${balanced ? "Δ 0 ✓" : "Δ " + diff.toLocaleString("en-PH")}</span>
        <span>Cr <b>${t.c.toLocaleString("en-PH")}</b></span>
      </div>
      ${balanced ? "" : `<p class="bhelp">Drag a weight onto the <b>${unknownSide === "d" ? "debit" : "credit"}</b> pan, or tap one.</p>`}
      <div class="weights" role="group" aria-label="Choose the missing amount">
        ${r.options.map((o) => `<button type="button" class="weight ${bal.pick === o ? (balanced ? "correct" : "wrong") : ""}" data-amt="${o}" ${balanced ? "disabled" : ""}><span>₱</span>${o.toLocaleString("en-PH")}</button>`).join("")}
      </div>
      <div aria-live="polite">${fb}</div>
      ${balanced ? `<div class="actions"><button type="button" class="key key-yellow" id="balNext">${last ? "Play again ↻" : "Next entry →"}</button>${last ? '<a class="key key-ghost" href="#students">Start the case study →</a>' : ""}</div>` : ""}`;

    placeScale(bal.angle);
    swingTo(targetAngle(t));

    const choose = (amt, srcEl) => {
      bal.pick = amt; bal.tries++;
      if (amt === r.answer) {
        good(srcEl || $(".bpan.target", el) || el);
        award("bal-" + bal.round, bal.tries === 1 ? 20 : 10, bal.tries === 1 ? "Balanced on the first try" : "Balanced");
      } else bad(el);
      renderBalance();
    };

    $$(".weight", el).forEach((w) => {
      if (w.disabled) return;
      let drag = null;
      w.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        drag = { x: e.clientX, y: e.clientY, moved: false, ghost: null, over: null };
        w.setPointerCapture(e.pointerId);
      });
      w.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 6) return;
        if (!drag.moved) {
          drag.moved = true;
          drag.ghost = w.cloneNode(true);
          drag.ghost.classList.add("ghost");
          document.body.appendChild(drag.ghost);
          w.classList.add("lifted");
        }
        drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px";
        drag.ghost.style.setProperty("--tilt", Math.max(-18, Math.min(18, dx / 6)) + "deg");
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const pan = under && under.closest(".bpan.target");
        if (pan !== drag.over) {
          if (drag.over) drag.over.classList.remove("hover");
          drag.over = pan;
          if (pan) { pan.classList.add("hover"); swingTo(targetAngle(balTotals(Number(w.dataset.amt)))); }
          else swingTo(targetAngle(balTotals()));
        }
      });
      const end = (e, cancelled) => {
        if (!drag) return;
        const d = drag; drag = null;
        if (d.ghost) d.ghost.remove();
        w.classList.remove("lifted");
        if (d.over) d.over.classList.remove("hover");
        if (cancelled) { swingTo(targetAngle(balTotals())); return; }
        if (!d.moved || d.over) choose(Number(w.dataset.amt), d.over || w);
        else swingTo(targetAngle(balTotals()));
      };
      w.addEventListener("pointerup", (e) => end(e, false));
      w.addEventListener("pointercancel", (e) => end(e, true));
      w.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(Number(w.dataset.amt), w); } });
      w.addEventListener("click", (e) => e.preventDefault());
    });

    const next = $("#balNext", el);
    if (next) next.addEventListener("click", () => {
      bal.round = (bal.round + 1) % BALANCE_ROUNDS.length;
      bal.pick = null; bal.tries = 0;
      renderBalance();
    });
  }

  /* ==========================================================
     HOME — Skill check (4 competency challenges)
     ========================================================== */
  const sk = { i: 0, picks: SKILL_CHECKS.map(() => null), summary: false, dir: 1 };
  const skKey = (i) => (i === 0 ? "think-1" : "skill-" + i);

  function renderSkill() {
    const el = $("#thinkGame");
    const N = SKILL_CHECKS.length;
    const correctCount = sk.picks.filter((p, i) => p === SKILL_CHECKS[i].answer).length;
    const tabs = SKILL_CHECKS.map((q, i) => {
      const p = sk.picks[i];
      const st = p === null ? "" : p === q.answer ? "ok" : "bad";
      return `<button type="button" class="sk-tab ${st} ${i === sk.i && !sk.summary ? "on" : ""}" data-i="${i}" title="${esc(q.tag)}">${p === null ? i + 1 : st === "ok" ? "✓" : "✗"}</button>`;
    }).join("");
    const head = `<div class="panel-top"><div class="sk-tabs" role="group" aria-label="Skill check questions">${tabs}</div><span class="chip sk-points">${correctCount * 10} points</span></div>`;

    if (sk.summary) {
      el.innerHTML = `${head}
        <div class="sk-card sk-in-${sk.dir > 0 ? "r" : "l"}">
          <span class="mono-k">Your achievement</span>
          <h3>${correctCount === N ? "Well-rounded accountant! 🎉" : `${correctCount} of ${N} skills cleared`}</h3>
          <ul class="sk-meter">
            ${SKILL_CHECKS.map((q, i) => {
              const ok = sk.picks[i] === q.answer;
              return `<li><span>${esc(q.tag)}</span><span class="bar"><i style="width:${ok ? 100 : sk.picks[i] === null ? 0 : 35}%" class="${ok ? "" : "low"}"></i></span><b>${ok ? "✓" : "✗"}</b></li>`;
            }).join("")}
          </ul>
          <p class="story">These four areas mirror the IFAC competency areas used in the study: intellectual, personal, technical, and interpersonal skills.</p>
          <div class="actions">${correctCount < N ? '<button type="button" class="key key-yellow" id="skRetry">Retry missed ones ↻</button>' : ""}<a class="key ${correctCount < N ? "key-ghost" : "key-yellow"}" href="#sidequests">More challenges →</a></div>
        </div>`;
      if (correctCount === N) fx.burst($(".sk-card h3", el), 40);
      const retry = $("#skRetry", el);
      if (retry) retry.addEventListener("click", () => {
        SKILL_CHECKS.forEach((q, i) => { if (sk.picks[i] !== q.answer) sk.picks[i] = null; });
        sk.i = sk.picks.findIndex((p) => p === null); sk.summary = false; sk.dir = -1; renderSkill();
      });
      bindSkTabs(el);
      return;
    }

    const q = SKILL_CHECKS[sk.i];
    const pick = sk.picks[sk.i];
    const done = pick !== null;
    const right = pick === q.answer;
    const allDone = sk.picks.every((p) => p !== null);
    el.innerHTML = `${head}
      <div class="sk-card sk-in-${sk.dir > 0 ? "r" : "l"}">
        <div class="sk-meta"><span class="chip">${esc(q.tag)}</span><span class="mono-k">Try it: ${esc(q.skill)}</span></div>
        <h3>${esc(q.title)}</h3>
        <div class="scenario">${esc(q.scenario)}</div>
        <div class="choices two">
          ${q.choices.map((c, i) => {
            let cls = "";
            if (done) cls = i === q.answer ? "correct" : (i === pick ? "wrong" : "dim");
            return `<button type="button" class="choice ${cls}" data-i="${i}" ${done ? "disabled" : ""}><span class="letter">${LETTERS[i]}</span><span>${esc(c)}</span></button>`;
          }).join("")}
        </div>
        <div aria-live="polite">${done ? `<div class="feedback ${right ? "ok" : "bad"}"><b>${right ? "✓ Correct! Well done." : "✗ Not quite."}</b>${esc(q.explain)}</div>` : ""}</div>
        ${done ? `<div class="actions">
          ${allDone ? '<button type="button" class="key key-yellow" id="skSum">See my achievement ★</button>' : '<button type="button" class="key key-yellow" id="skNext">Next challenge →</button>'}
          ${right ? "" : '<button type="button" class="key key-ghost" id="skAgain">Try again</button>'}
        </div>` : ""}
      </div>`;

    $$(".choice", el).forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      sk.picks[sk.i] = i;
      if (i === q.answer) { good(b); award(skKey(sk.i), 20, q.skill); } else bad(el);
      sk.dir = 1;
      renderSkill();
    }));
    const nx = $("#skNext", el);
    if (nx) nx.addEventListener("click", () => {
      const nextOpen = SKILL_CHECKS.findIndex((_, k) => k > sk.i && sk.picks[k] === null);
      sk.i = nextOpen >= 0 ? nextOpen : sk.picks.findIndex((p) => p === null);
      sk.dir = 1; renderSkill();
    });
    const sm = $("#skSum", el);
    if (sm) sm.addEventListener("click", () => { sk.summary = true; sk.dir = 1; renderSkill(); });
    const ag = $("#skAgain", el);
    if (ag) ag.addEventListener("click", () => { sk.picks[sk.i] = null; sk.dir = -1; renderSkill(); });
    bindSkTabs(el);
  }

  function bindSkTabs(el) {
    $$(".sk-tab", el).forEach((t) => t.addEventListener("click", () => {
      const i = Number(t.dataset.i);
      sk.dir = i >= sk.i ? 1 : -1; sk.i = i; sk.summary = false; renderSkill();
    }));
  }

  /* ==========================================================
     STUDENTS — Case study quest + inventory
     ========================================================== */
  const qs = { wrong: [], solved: false };

  let invOpen = null; // which unlocked habit is expanded
  function renderInventory(fresh) {
    if (fresh) invOpen = fresh;
    $("#invCount").textContent = state.habits.length + " / " + HABITS.length;
    $("#invList").innerHTML = HABITS.map((h, i) => {
      const got = state.habits.includes(h.id);
      if (!got) {
        return `<li class="inv-item locked">
          <span class="ic">${ICONS.lock}</span>
          <div class="inv-txt"><span class="item-name">Locked · Challenge ${i + 1}</span><h3>${i + 1}. ${esc(h.title)}</h3></div>
        </li>`;
      }
      const open = invOpen === h.id;
      return `<li class="inv-item got ${open ? "open" : ""} ${fresh === h.id ? "flip-in" : ""}">
        <button type="button" class="inv-btn" data-id="${h.id}" aria-expanded="${open}" aria-controls="inv-${h.id}">
          <span class="ic">${ICONS[h.id]}</span>
          <span class="inv-txt"><span class="item-name">${esc(h.item)}</span><span class="inv-title">${i + 1}. ${esc(h.title)}</span></span>
          <span class="inv-chev" aria-hidden="true">+</span>
        </button>
        <p class="inv-desc" id="inv-${h.id}" ${open ? "" : "hidden"}>${esc(h.desc)}</p>
      </li>`;
    }).join("");
    $$("#invList .inv-btn").forEach((b) => b.addEventListener("click", () => {
      invOpen = invOpen === b.dataset.id ? null : b.dataset.id;
      fx.sound("click");
      renderInventory();
    }));
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
    updateMusicContext();
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
      updateMusicContext();
      $("#sidequests").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }));
  }

  /* ==========================================================
     RESOURCE HUB
     ========================================================== */
  let hubActive = 0;
  /* ---- on-site video player (official YouTube embed) ---- */
  function ytEmbed(url) {
    try {
      const u = new URL(url);
      if (!/youtube\.com$|youtu\.be$/.test(u.hostname.replace(/^www\./, ""))) return null;
      const list = u.searchParams.get("list");
      const id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v");
      const base = "https://www.youtube-nocookie.com/embed/";
      const q = "autoplay=1&rel=0&modestbranding=1&playsinline=1";
      if (id) return `${base}${encodeURIComponent(id)}?${q}${list ? "&list=" + encodeURIComponent(list) : ""}`;
      if (list) return `${base}videoseries?list=${encodeURIComponent(list)}&${q}`;
    } catch (e) { /* not a URL */ }
    return null;
  }
  const player = { tab: 0, i: 0 };
  function videosIn(tab) { return HUB_TABS[tab].links.map((l, i) => ({ l, i })).filter((x) => x.l.kind === "video" && ytEmbed(x.l.url)); }
  function openVideo(tab, i) {
    player.tab = tab; player.i = i;
    const l = HUB_TABS[tab].links[i];
    const list = videosIn(tab), pos = list.findIndex((x) => x.i === i);
    $("#videoBody").innerHTML = `
      <div class="detail-inner sw-in video-inner">
        <div class="detail-head">
          <div class="detail-titles">
            <span class="mono-k">${esc(HUB_TABS[tab].title)} · ${pos + 1} of ${list.length}</span>
            <h3 id="videoTitle">${esc(l.label)}</h3>
          </div>
          <button type="button" class="hud-btn" id="videoClose" aria-label="Close video">✕</button>
        </div>
        <div class="video-frame">
          <div class="video-loading" aria-hidden="true"><span class="eq playing"><i></i><i></i><i></i></span>Loading video…</div>
          <iframe src="${esc(ytEmbed(l.url))}" title="${esc(l.label)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe>
        </div>
        <div class="video-bar">
          <span class="tag">${esc(l.tag)}</span>
          <a class="video-yt" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">Video not playing? Watch on YouTube ↗</a>
        </div>
        <p class="video-credit">Played through YouTube's official player, so views and credit go to the creator.</p>
        ${list.length > 1 ? `<div class="detail-nav">
          <button type="button" class="key key-ghost" id="vidPrev" aria-label="Previous video">←</button>
          <div class="detail-dots">${list.map((x) => `<button type="button" class="ddot ${x.i === i ? "on" : ""} ${(state.watched || []).includes(x.l.url) ? "seen" : ""}" data-v="${x.i}" aria-label="${esc(x.l.label)}"></button>`).join("")}</div>
          <button type="button" class="key key-yellow" id="vidNext" aria-label="Next video">→</button>
        </div>` : ""}
      </div>`;
    const dlg = $("#videoDialog");
    const frame = $("iframe", dlg);
    frame.addEventListener("load", () => dlg.classList.add("ready"), { once: true });
    dlg.classList.remove("ready");
    $("#videoClose", dlg).addEventListener("click", () => dlg.close());
    const step = (d) => { const k = (pos + d + list.length) % list.length; openVideo(tab, list[k].i); };
    const pv = $("#vidPrev", dlg), nx = $("#vidNext", dlg);
    if (pv) pv.addEventListener("click", () => step(-1));
    if (nx) nx.addEventListener("click", () => step(1));
    $$(".ddot", dlg).forEach((d) => d.addEventListener("click", () => openVideo(tab, Number(d.dataset.v))));
    state.watched = state.watched || [];
    if (!state.watched.includes(l.url)) { state.watched.push(l.url); save(); }
    musicCtl.hold(true); // let the video's sound play on its own
    if (!dlg.open) dlg.showModal();
  }
  (function initVideoDialog() {
    const dlg = $("#videoDialog");
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", () => {
      $("#videoBody").innerHTML = ""; // stops playback
      musicCtl.hold(false);
      renderHub();
      const back = $(`.res-video[data-vid="${player.i}"]`); if (back) back.focus({ preventScroll: true });
    });
  })();

  function renderHub() {
    const tabs = $("#hubTabs");
    tabs.innerHTML = HUB_TABS.map((t, i) => `<button type="button" class="sheet-tab" role="tab" id="tab-${t.id}" aria-selected="${i === hubActive}" tabindex="${i === hubActive ? 0 : -1}" data-i="${i}">${esc(t.label)}</button>`).join("");
    const t = HUB_TABS[hubActive];
    if (!state.hubSeen.includes(t.id) && $('[data-view="hub"]') && !$('[data-view="hub"]').hidden) { state.hubSeen.push(t.id); save(); }
    $("#hubFormula").textContent = t.formula;
    const body = $("#hubBody");
    body.setAttribute("aria-labelledby", "tab-" + t.id);
    body.innerHTML = `
      <div class="sheet-card">
        <span class="mono-k">${esc(t.label)}</span>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.desc)}</p>
        <ul class="res-list">
          ${t.links.map((l, i) => {
            const ext = l.kind !== "internal";
            const isVid = l.kind === "video" && ytEmbed(l.url);
            const seen = isVid && (state.watched || []).includes(l.url);
            const kind = isVid ? "▶ Watch here" : l.kind === "site" ? "↗ Website" : "◆ Play on ASTRA";
            return `<li><a class="res ${isVid ? "res-video" : ""}" href="${esc(l.url)}" ${isVid ? `data-vid="${i}"` : ""} ${ext ? 'target="_blank" rel="noopener noreferrer"' : ""}>
              <span class="tag">${esc(l.tag)}</span><span class="lbl">${esc(l.label)}</span><span class="kind">${kind}${seen ? ' <span class="watched">✓ Watched</span>' : ""}</span></a></li>`;
          }).join("")}
        </ul>
      </div>`;
    $$(".res-video", body).forEach((a) => a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let "open in new tab" work
      e.preventDefault();
      openVideo(hubActive, Number(a.dataset.vid));
    }));
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
     EDUCATORS / ADMINS — cards, detail view, plan/roadmap, match game
     ========================================================== */
  const COLORS = ["var(--yellow)", "var(--blue)", "var(--coral)", "var(--mint)"];
  const READY = [["doing", "Already doing it"], ["try", "Want to try it"], ["later", "Not yet"]];
  const STATUS = [["none", "Not started"], ["progress", "In progress"], ["done", "Implemented"]];
  const PRIORITY = [[1, "Low"], [2, "Medium"], [3, "High"]];

  const KINDS = {
    edu: { list: () => APPROACHES, seenKey: "seenEdu", mount: "#eduCards", countEl: "#eduCount", barEl: "#eduBar", label: "approaches", noun: "Approach" },
    adm: { list: () => POLICIES, seenKey: "seenAdm", mount: "#admCards", countEl: "#admCount", barEl: "#admBar", label: "policies", noun: "Policy" }
  };
  const ensureMaps = () => {
    state.eduPlan = state.eduPlan || {};
    state.eduReady = state.eduReady || {};
    state.admStatus = state.admStatus || {};
    state.admPriority = state.admPriority || {};
  };

  function cardMeta(kind, i) {
    ensureMaps();
    if (kind === "edu") {
      const planned = (state.eduPlan[i] || []).length, total = APPROACHES[i].how.length;
      const ready = READY.find((r) => r[0] === state.eduReady[i]);
      return `${planned ? `<span class="meta-chip mint">${planned}/${total} in plan</span>` : ""}${ready ? `<span class="meta-chip">${esc(ready[1])}</span>` : ""}`;
    }
    const st = STATUS.find((r) => r[0] === state.admStatus[i]);
    const pr = PRIORITY.find((r) => r[0] === state.admPriority[i]);
    return `${st && st[0] !== "none" ? `<span class="meta-chip ${st[0] === "done" ? "mint" : "yellow"}">${esc(st[1])}</span>` : ""}${pr ? `<span class="meta-chip">${esc(pr[1])} priority</span>` : ""}`;
  }

  function renderCards(kind) {
    const K = KINDS[kind], list = K.list();
    const wrap = $(K.mount);
    wrap.innerHTML = list.map((item, i) => `
      <article class="card" data-tilt>
        <button type="button" class="card-btn" data-i="${i}" aria-haspopup="dialog">
          <span class="card-num" style="background:${COLORS[i % COLORS.length]}">${String(i + 1).padStart(2, "0")}</span>
          <span class="card-txt">
            <span class="card-title">${esc(item.title)}</span>
            <span class="card-metas">${state[K.seenKey].includes(i) ? '<span class="seen-dot">● Explored</span>' : '<span class="seen-dot new">○ Tap to open</span>'}${cardMeta(kind, i)}</span>
          </span>
          <span class="chev" aria-hidden="true">↗</span>
        </button>
      </article>`).join("");
    const n = state[K.seenKey].length;
    $(K.countEl).textContent = `${n} / ${list.length} explored`;
    $(K.barEl).style.width = (n / list.length) * 100 + "%";
    $$(".card-btn", wrap).forEach((btn) => btn.addEventListener("click", () => openDetail(kind, Number(btn.dataset.i), 0, btn)));
    if (kind === "edu") renderPlan(); else renderRoadmap();
  }

  /* ---- detail dialog ---- */
  const detail = { kind: "edu", i: 0, opener: null };

  function openDetail(kind, i, dir, opener) {
    detail.kind = kind; detail.i = i;
    if (opener) detail.opener = opener;
    const K = KINDS[kind];
    if (!state[K.seenKey].includes(i)) {
      state[K.seenKey].push(i); save();
      if (state[K.seenKey].length === K.list().length) toast(`All ${K.list().length} ${K.label} explored ✓`);
    }
    renderDetail(dir);
    const dlg = $("#detailDialog");
    if (!dlg.open) dlg.showModal();
    fx.sound("click");
  }

  function renderDetail(dir) {
    ensureMaps();
    const { kind, i } = detail;
    const K = KINDS[kind], list = K.list(), item = list[i];
    const color = COLORS[i % COLORS.length];
    let body = "";
    if (kind === "edu") {
      const plan = state.eduPlan[i] || [];
      const pct = plan.length / item.how.length;
      body = `
        <p class="detail-sum">${esc(item.summary)}</p>
        <div class="detail-sec-head"><h4>How to apply? <small>Tap a step to add it to your teaching plan</small></h4>${ring(pct)}</div>
        <ul class="steps">
          ${item.how.map((h, k) => {
            const on = plan.includes(k);
            return `<li><button type="button" class="step ${on ? "on" : ""}" data-k="${k}" aria-pressed="${on}"><span class="step-box">${on ? "✓" : k + 1}</span><span>${esc(h)}</span></button></li>`;
          }).join("")}
        </ul>
        <h4>Where are you with this approach?</h4>
        <div class="seg" role="group" aria-label="Readiness">${READY.map(([v, l]) => `<button type="button" class="seg-btn ${state.eduReady[i] === v ? "on" : ""}" data-ready="${v}" aria-pressed="${state.eduReady[i] === v}">${esc(l)}</button>`).join("")}</div>`;
    } else {
      body = `
        <p class="detail-sum">${esc(item.desc)}</p>
        <h4>Implementation status</h4>
        <div class="seg status-seg" role="group" aria-label="Implementation status">${STATUS.map(([v, l], k) => `<button type="button" class="seg-btn st-${v} ${(state.admStatus[i] || "none") === v ? "on" : ""}" data-status="${v}" aria-pressed="${(state.admStatus[i] || "none") === v}"><span class="st-dot"></span>${esc(l)}</button>`).join("")}</div>
        <h4>Priority for PLV</h4>
        <div class="seg" role="group" aria-label="Priority">${PRIORITY.map(([v, l]) => `<button type="button" class="seg-btn ${state.admPriority[i] === v ? "on" : ""}" data-pri="${v}" aria-pressed="${state.admPriority[i] === v}"><span class="pri-bars p${v}"><i></i><i></i><i></i></span>${esc(l)}</button>`).join("")}</div>`;
    }
    $("#detailCard").innerHTML = `
      <div class="detail-inner ${dir > 0 ? "sw-r" : dir < 0 ? "sw-l" : "sw-in"}" style="--accent:${color}">
        <div class="detail-head">
          <span class="card-num big" style="background:${color}">${String(i + 1).padStart(2, "0")}</span>
          <div class="detail-titles">
            <span class="mono-k">${K.noun} ${i + 1} of ${list.length}</span>
            <h3 id="detailTitle">${esc(item.title)}</h3>
          </div>
          <button type="button" class="hud-btn" id="detailClose" aria-label="Close">✕</button>
        </div>
        <div class="detail-body">${body}</div>
        <div class="detail-nav">
          <button type="button" class="key key-ghost" id="detailPrev" aria-label="Previous">←</button>
          <div class="detail-dots">${list.map((_, k) => `<button type="button" class="ddot ${k === i ? "on" : ""} ${state[K.seenKey].includes(k) ? "seen" : ""}" data-k="${k}" aria-label="${K.noun} ${k + 1}"></button>`).join("")}</div>
          <button type="button" class="key key-yellow" id="detailNext" aria-label="Next">→</button>
        </div>
      </div>`;

    const card = $("#detailCard");
    $("#detailClose", card).addEventListener("click", closeDetail);
    $("#detailPrev", card).addEventListener("click", () => stepDetail(-1));
    $("#detailNext", card).addEventListener("click", () => stepDetail(1));
    $$(".ddot", card).forEach((d) => d.addEventListener("click", () => { const k = Number(d.dataset.k); if (k !== i) openDetail(kind, k, k > i ? 1 : -1); }));

    $$(".step", card).forEach((b) => b.addEventListener("click", () => {
      const k = Number(b.dataset.k);
      const plan = state.eduPlan[i] = state.eduPlan[i] || [];
      const at = plan.indexOf(k);
      if (at >= 0) { plan.splice(at, 1); fx.sound("click"); }
      else {
        plan.push(k); plan.sort();
        good(b, plan.length === item.how.length ? 30 : 10);
        if (plan.length === item.how.length) toast("All steps added to your plan ✓");
      }
      if (!plan.length) delete state.eduPlan[i];
      save(); renderDetail(0); renderCards("edu");
    }));
    $$("[data-ready]", card).forEach((b) => b.addEventListener("click", () => {
      state.eduReady[i] = state.eduReady[i] === b.dataset.ready ? undefined : b.dataset.ready;
      if (!state.eduReady[i]) delete state.eduReady[i];
      fx.sound("click"); save(); renderDetail(0); renderCards("edu");
    }));
    $$("[data-status]", card).forEach((b) => b.addEventListener("click", () => {
      state.admStatus[i] = b.dataset.status;
      if (b.dataset.status === "done") good(b, 24); else fx.sound("click");
      save(); renderDetail(0); renderCards("adm");
    }));
    $$("[data-pri]", card).forEach((b) => b.addEventListener("click", () => {
      const v = Number(b.dataset.pri);
      state.admPriority[i] = state.admPriority[i] === v ? undefined : v;
      if (!state.admPriority[i]) delete state.admPriority[i];
      fx.sound("click"); save(); renderDetail(0); renderCards("adm");
    }));
  }

  function stepDetail(d) {
    const n = KINDS[detail.kind].list().length;
    openDetail(detail.kind, (detail.i + d + n) % n, d);
  }
  function closeDetail() {
    const dlg = $("#detailDialog");
    if (dlg.open) dlg.close();
  }

  /* ---- swipe between items on touch ---- */
  (function initDetailSwipe() {
    const dlg = $("#detailDialog");
    let sx = null, sy = null;
    dlg.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    dlg.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepDetail(dx < 0 ? 1 : -1);
    });
    document.addEventListener("keydown", (e) => {
      if (!dlg.open) return;
      if (e.key === "ArrowRight") { e.preventDefault(); stepDetail(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stepDetail(-1); }
      else if (e.key === "Escape") { e.preventDefault(); closeDetail(); }
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDetail(); });
    dlg.addEventListener("close", () => { if (detail.opener && document.contains(detail.opener)) detail.opener.focus(); else { const b = $(`${KINDS[detail.kind].mount} .card-btn[data-i="${detail.i}"]`); if (b) b.focus(); } });
  })();

  /* ---- copy helper ---- */
  function copyText(text, okMsg) {
    const done = () => { toast(okMsg); fx.sound("ok"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;left:-9999px";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { toast("Couldn't copy. Select the text and copy it manually."); }
      ta.remove();
    }
  }

  /* ---- Educators: My teaching plan ---- */
  function renderPlan() {
    ensureMaps();
    const el = $("#eduPlan");
    if (!el) return;
    const entries = APPROACHES.map((a, i) => ({ a, i, steps: (state.eduPlan[i] || []).map((k) => a.how[k]) })).filter((x) => x.steps.length);
    const totalSteps = entries.reduce((t, x) => t + x.steps.length, 0);
    const readyCounts = READY.map(([v, l]) => [l, Object.values(state.eduReady).filter((r) => r === v).length]);
    el.innerHTML = `
      <div class="panel-top">
        <div><span class="mono-k">My teaching plan</span><h3>${totalSteps ? `${totalSteps} step${totalSteps > 1 ? "s" : ""} across ${entries.length} approach${entries.length > 1 ? "es" : ""}` : "Your plan is empty"}</h3></div>
        ${totalSteps ? '<div class="plan-actions"><button type="button" class="key key-yellow" id="planCopy">Copy plan</button><button type="button" class="linkish" id="planClear">Clear</button></div>' : ""}
      </div>
      ${totalSteps ? `<ol class="plan-list">${entries.map((x) => `<li><button type="button" class="plan-head" data-i="${x.i}"><span class="card-num sm" style="background:${COLORS[x.i % COLORS.length]}">${String(x.i + 1).padStart(2, "0")}</span>${esc(x.a.title)}</button><ul>${x.steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ul></li>`).join("")}</ol>`
        : '<p class="muted">Open an approach and tap its "How to apply" steps to collect them here. Then copy the plan into your syllabus or lesson notes.</p>'}
      <div class="ready-row">${readyCounts.map(([l, n]) => `<span class="chip">${esc(l)}: <b>${n}</b></span>`).join("")}</div>`;
    const cp = $("#planCopy", el);
    if (cp) cp.addEventListener("click", () => {
      const txt = "MY TEACHING PLAN (ASTRA)\n\n" + entries.map((x) => `${x.i + 1}. ${x.a.title}\n` + x.steps.map((st) => `   - ${st}`).join("\n")).join("\n\n");
      copyText(txt, "Plan copied to clipboard ✓");
    });
    const cl = $("#planClear", el);
    if (cl) cl.addEventListener("click", () => { if (confirm("Clear your teaching plan?")) { state.eduPlan = {}; save(); renderCards("edu"); } });
    $$(".plan-head", el).forEach((b) => b.addEventListener("click", () => openDetail("edu", Number(b.dataset.i), 0, b)));
  }

  /* ---- Admins: Policy roadmap board ---- */
  function renderRoadmap() {
    ensureMaps();
    const el = $("#admRoad");
    if (!el) return;
    const cols = STATUS.map(([v, l]) => ({ v, l, items: POLICIES.map((p, i) => ({ p, i })).filter((x) => (state.admStatus[x.i] || "none") === v).sort((x, y) => (state.admPriority[y.i] || 0) - (state.admPriority[x.i] || 0)) }));
    const score = POLICIES.reduce((t, _, i) => t + ({ none: 0, progress: 0.5, done: 1 }[state.admStatus[i] || "none"]), 0);
    const pct = Math.round((score / POLICIES.length) * 100);
    el.innerHTML = `
      <div class="panel-top">
        <div><span class="mono-k">PLV policy roadmap</span><h3>Readiness: <span class="hl">${pct}%</span></h3></div>
        <div class="plan-actions"><button type="button" class="key key-yellow" id="roadCopy">Copy summary</button></div>
      </div>
      <div class="bar road-bar"><i style="width:${pct}%"></i></div>
      <p class="muted road-hint">Drag a policy into a column, or open it to set its status and priority.</p>
      <div class="board">
        ${cols.map((c) => `<div class="col" data-status="${c.v}">
          <div class="col-head st-${c.v}"><span class="st-dot"></span>${esc(c.l)}<b>${c.items.length}</b></div>
          <div class="col-drop">
            ${c.items.map((x) => `<button type="button" class="pchip" data-i="${x.i}" draggable="true"><span class="card-num sm" style="background:${COLORS[x.i % COLORS.length]}">${String(x.i + 1).padStart(2, "0")}</span><span class="pchip-t">${esc(x.p.title)}</span>${state.admPriority[x.i] ? `<span class="pri-bars p${state.admPriority[x.i]}" title="${PRIORITY[state.admPriority[x.i] - 1][1]} priority"><i></i><i></i><i></i></span>` : ""}</button>`).join("") || '<span class="col-empty">Drop here</span>'}
          </div>
        </div>`).join("")}
      </div>`;
    $("#roadCopy", el).addEventListener("click", () => {
      const lines = POLICIES.map((p, i) => `${i + 1}. ${p.title}\n   Status: ${STATUS.find((s) => s[0] === (state.admStatus[i] || "none"))[1]}${state.admPriority[i] ? ` · Priority: ${PRIORITY[state.admPriority[i] - 1][1]}` : ""}`);
      copyText(`PLV POLICY ROADMAP (ASTRA)\nReadiness: ${pct}%\n\n` + lines.join("\n"), "Roadmap copied to clipboard ✓");
    });
    // click opens detail; HTML5 drag (mouse) + pointer drag (touch) move between columns
    $$(".pchip", el).forEach((chip) => {
      chip.addEventListener("click", () => { if (!chip.dataset.dragged) openDetail("adm", Number(chip.dataset.i), 0, chip); delete chip.dataset.dragged; });
      chip.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", chip.dataset.i); e.dataTransfer.effectAllowed = "move"; chip.classList.add("dragging"); });
      chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
    });
    $$(".col", el).forEach((col) => {
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("over"); });
      col.addEventListener("dragleave", () => col.classList.remove("over"));
      col.addEventListener("drop", (e) => {
        e.preventDefault(); col.classList.remove("over");
        const i = Number(e.dataTransfer.getData("text/plain"));
        if (Number.isNaN(i)) return;
        movePolicy(i, col.dataset.status, col);
      });
    });
    // touch drag
    $$(".pchip", el).forEach((chip) => {
      let t = null;
      chip.addEventListener("touchstart", (e) => { t = { x: e.touches[0].clientX, y: e.touches[0].clientY, ghost: null }; }, { passive: true });
      chip.addEventListener("touchmove", (e) => {
        if (!t) return;
        const x = e.touches[0].clientX, y = e.touches[0].clientY;
        if (!t.ghost && Math.hypot(x - t.x, y - t.y) < 10) return;
        e.preventDefault();
        if (!t.ghost) { t.ghost = chip.cloneNode(true); t.ghost.classList.add("pchip-ghost"); document.body.appendChild(t.ghost); chip.classList.add("dragging"); }
        t.ghost.style.left = x + "px"; t.ghost.style.top = y + "px";
        $$(".col", el).forEach((c) => c.classList.remove("over"));
        const under = document.elementFromPoint(x, y);
        const col = under && under.closest(".col"); if (col) col.classList.add("over");
        t.col = col;
      }, { passive: false });
      chip.addEventListener("touchend", () => {
        if (!t) return;
        if (t.ghost) {
          t.ghost.remove(); chip.classList.remove("dragging"); chip.dataset.dragged = "1";
          $$(".col", el).forEach((c) => c.classList.remove("over"));
          if (t.col) movePolicy(Number(chip.dataset.i), t.col.dataset.status, t.col);
        }
        t = null;
      });
    });
  }

  function movePolicy(i, status, col) {
    ensureMaps();
    if ((state.admStatus[i] || "none") === status) return;
    state.admStatus[i] = status;
    if (!state.seenAdm.includes(i)) state.seenAdm.push(i);
    if (status === "done") good(col, 24); else fx.sound("click");
    save(); renderCards("adm");
  }

  /* ---- Match game: "Which one fits?" ---- */
  const match = { edu: { cur: null, pick: null, streak: 0, score: 0 }, adm: { cur: null, pick: null, streak: 0, score: 0 } };
  function newMatch(kind) {
    const m = match[kind];
    if (kind === "edu") {
      const pool = [];
      APPROACHES.forEach((a, i) => a.how.forEach((h, k) => pool.push({ i, text: h, key: `match-edu-${i}-${k}` })));
      let next; do { next = pool[(Math.random() * pool.length) | 0]; } while (m.cur && next.text === m.cur.text && pool.length > 1);
      m.cur = next;
    } else {
      let i; do { i = (Math.random() * POLICIES.length) | 0; } while (m.cur && i === m.cur.i && POLICIES.length > 1);
      // hide the policy's own wording a little: use its description only
      m.cur = { i, text: POLICIES[i].desc, key: `match-adm-${i}` };
    }
    m.pick = null;
  }
  function renderMatch(kind) {
    const el = $(kind === "edu" ? "#eduMatch" : "#admMatch");
    if (!el) return;
    const m = match[kind];
    if (!m.cur) newMatch(kind);
    const list = kind === "edu" ? APPROACHES : POLICIES;
    const done = m.pick !== null, right = m.pick === m.cur.i;
    el.innerHTML = `
      <div class="panel-top">
        <span class="mono-k">Mini game · ${kind === "edu" ? "Which approach is this?" : "Which policy is this?"}</span>
        <span class="rush-stats"><span class="chip">Score <b>${m.score}</b></span><span class="chip ${m.streak >= 3 ? "hot" : ""}">Streak ×${m.streak}</span></span>
      </div>
      <blockquote class="match-q">“${esc(m.cur.text)}”</blockquote>
      <div class="match-opts">
        ${list.map((x, i) => {
          let cls = "";
          if (done) cls = i === m.cur.i ? "correct" : i === m.pick ? "wrong" : "dim";
          return `<button type="button" class="match-opt ${cls}" data-i="${i}" ${done ? "disabled" : ""}><span class="card-num sm" style="background:${COLORS[i % COLORS.length]}">${String(i + 1).padStart(2, "0")}</span><span>${esc(x.title)}</span></button>`;
        }).join("")}
      </div>
      <div aria-live="polite">${done ? `<div class="feedback ${right ? "ok" : "bad"}"><b>${right ? "✓ Correct!" : "✗ That one belongs to #" + (m.cur.i + 1) + "."}</b>${esc(list[m.cur.i].title)}</div>` : ""}</div>
      ${done ? `<div class="actions"><button type="button" class="key key-yellow" data-next>Next one →</button><button type="button" class="key key-ghost" data-open>Open #${m.cur.i + 1}</button></div>` : ""}`;
    $$(".match-opt", el).forEach((b) => b.addEventListener("click", () => {
      m.pick = Number(b.dataset.i);
      if (m.pick === m.cur.i) {
        m.score++; m.streak++; good(b, m.streak >= 3 ? 30 : 16);
        award(m.cur.key, 5);
      } else { m.streak = 0; bad(el); }
      renderMatch(kind);
    }));
    const nx = $("[data-next]", el);
    if (nx) nx.addEventListener("click", () => { newMatch(kind); renderMatch(kind); });
    const op = $("[data-open]", el);
    if (op) op.addEventListener("click", () => openDetail(kind, m.cur.i, 0, op));
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
      if (rush.left === 10) musicCtl.tempo(1.18); // the beat speeds up for the final stretch
      if (rush.left <= 0) endRush();
    }, 1000);
    fx.sound("click");
    renderRush();
    updateMusicContext();
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
    updateMusicContext();
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
    { id: "thinker", icon: "◎", name: "Skill Checker", desc: "Clear all four Skill Check challenges on Home.", test: (s) => SKILL_CHECKS.every((_, i) => s.awarded[i === 0 ? "think-1" : "skill-" + i]) },
    { id: "rush", icon: "⚡", name: "Rush Hour", desc: "Score 15+ in Debit or Credit Rush.", test: (s) => s.rushBest >= 15 },
    { id: "habits", icon: "★", name: "Habit Collector", desc: "Collect all five habits.", test: (s) => s.habits.length >= HABITS.length },
    { id: "triple", icon: "▲", name: "Triple Threat", desc: "Finish all three side quests.", test: (s) => SIDE_QUESTS.every((g) => s.best[g.id] !== undefined) },
    { id: "flawless", icon: "✓", name: "Flawless", desc: "Score 10/10 in any side quest.", test: (s) => SIDE_QUESTS.some((g) => s.best[g.id] === g.items.length) },
    { id: "mentor", icon: "✎", name: "Mentor's Map", desc: "Explore all seven teaching approaches.", test: (s) => s.seenEdu.length >= APPROACHES.length },
    { id: "compass", icon: "⌖", name: "Campus Compass", desc: "Explore all five university policies.", test: (s) => s.seenAdm.length >= POLICIES.length },
    { id: "planner", icon: "☑", name: "Lesson Planner", desc: "Add every step of one approach to your teaching plan.", test: (s) => APPROACHES.some((a, i) => ((s.eduPlan || {})[i] || []).length === a.how.length) },
    { id: "roadmap", icon: "⛳", name: "Policy Champion", desc: "Mark all five policies as implemented on the roadmap.", test: (s) => POLICIES.every((_, i) => (s.admStatus || {})[i] === "done") },
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
      if (!S.motion) { if (cur) reset(cur); cur = null; return; }
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
    if (!S.loader) { L.remove(); if (S.music) musicCtl.apply(); return; }
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
    /* ---- background music: starts automatically (or on the first tap if the browser blocks autoplay) ---- */
    if (S.music) musicCtl.apply();

    L.addEventListener("click", finish);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" || e.key === "Enter") finish(); }, { once: true });
    setTimeout(finish, 6000); // safety net
  }


  /* ==========================================================
     BACKGROUND MUSIC (generated live with Web Audio, no audio files)
     ========================================================== */
  const TRACKS = {
    lofi: { name: "Ledger Lo-fi", desc: "Chill beats · 90 BPM", bpm: 90,
      chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]],
      arpWave: "triangle", arpVol: 0.06, arpEvery: 2, padVol: 0.03, bassWave: "sine", bassVol: 0.2, bassSteps: [0, 10],
      hats: [2, 6, 10, 14], hatVol: 0.05, chime: true, cutoff: 2600, delay: 0.33 },
    chip: { name: "Balance Sheet Bounce", desc: "Upbeat chiptune · 128 BPM", bpm: 128,
      chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
      arpWave: "square", arpVol: 0.03, arpEvery: 1, padVol: 0, bassWave: "square", bassVol: 0.06, bassSteps: [0, 4, 8, 12],
      hats: [2, 6, 10, 14], hatVol: 0.04, chime: false, cutoff: 4200, delay: 0 },
    quest: { name: "Bakeshop Quest", desc: "Adventure march · 104 BPM", bpm: 104,
      chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],
      arpWave: "triangle", arpVol: 0.05, arpEvery: 2, padVol: 0.025, bassWave: "triangle", bassVol: 0.14, bassSteps: [0, 6, 8, 14],
      hats: [4, 12], hatVol: 0.04, chime: false, cutoff: 3200, delay: 0.25 },
    audit: { name: "Audit Mode", desc: "Focused pulse · 96 BPM", bpm: 96,
      chords: [[62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]],
      arpWave: "sine", arpVol: 0.05, arpEvery: 2, padVol: 0.03, bassWave: "sine", bassVol: 0.18, bassSteps: [0, 4, 8, 12],
      hats: [2, 6, 10, 14], hatVol: 0.03, chime: false, cutoff: 2000, delay: 0.2 },
    lounge: { name: "Faculty Lounge", desc: "Mellow jazz · 80 BPM", bpm: 80,
      chords: [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67]],
      arpWave: "triangle", arpVol: 0.045, arpEvery: 2, padVol: 0.035, bassWave: "sine", bassVol: 0.18, bassSteps: [0, 8],
      hats: [4, 12], hatVol: 0.035, chime: true, cutoff: 2200, delay: 0.3 },
    board: { name: "Boardroom", desc: "Stately bells · 72 BPM", bpm: 72,
      chords: [[60, 64, 67], [65, 69, 72], [57, 60, 64], [55, 59, 62]],
      arpWave: "sine", arpVol: 0.05, arpEvery: 4, padVol: 0.04, bassWave: "sine", bassVol: 0.14, bassSteps: [0, 8],
      hats: [], hatVol: 0, chime: true, cutoff: 2400, delay: 0.4 },
    calm: { name: "Quiet Study", desc: "Soft pads · 60 BPM", bpm: 60,
      chords: [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]],
      arpWave: "sine", arpVol: 0.045, arpEvery: 4, padVol: 0.045, bassWave: "sine", bassVol: 0.12, bassSteps: [0],
      hats: [], hatVol: 0, chime: true, cutoff: 1800, delay: 0.45 }
  };

  function createMusic() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    let ctx;
    try { ctx = new AC(); } catch (e) { return null; }
    const master = ctx.createGain(); master.gain.value = 0.0001;
    const tone = ctx.createBiquadFilter(); tone.type = "lowpass";
    const delay = ctx.createDelay(1); const fb = ctx.createGain(); fb.gain.value = 0.28; const wet = ctx.createGain();
    tone.connect(master); tone.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(master);
    master.connect(ctx.destination);

    const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
    let T = TRACKS.lofi, step = 0, next = 0, timer = null, vol = 0.45, token = 0, tempo = 1, swap = null;
    const configure = () => { tone.frequency.value = T.cutoff; delay.delayTime.value = T.delay || 0.01; wet.gain.value = T.delay ? 0.25 : 0; };
    configure();

    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);

    function voice(freq, t, dur, type, v, attack) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + (attack || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(tone); o.start(t); o.stop(t + dur + 0.05);
    }
    function hat(t, v) {
      const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noise; hp.type = "highpass"; hp.frequency.value = 7000; g.gain.value = v;
      src.connect(hp).connect(g).connect(master); src.start(t);
    }
    function schedule(s, t) {
      const len = 60 / (T.bpm * tempo) / 4;
      const chord = T.chords[Math.floor(s / 16) % T.chords.length], L = chord.length, b = s % 16;
      if (b === 0 && T.padVol) chord.forEach((n) => voice(mf(n), t, len * 16, "sine", T.padVol, 0.35));
      if (T.bassSteps.includes(b)) voice(mf(chord[0] - 24), t, len * (T.bassSteps.length > 2 ? 3 : 6), T.bassWave, T.bassVol, 0.02);
      if (b % T.arpEvery === 0) voice(mf(chord[ARP[(b / T.arpEvery) % 8] % L] + 12), t, Math.min(0.32, len * T.arpEvery * 1.6), T.arpWave, T.arpVol);
      if (T.hats.includes(b)) hat(t, T.hatVol);
      if (T.chime && b === 14 && Math.random() < 0.6) voice(mf(chord[(Math.random() * L) | 0] + 24), t, 0.6, "sine", 0.03);
    }
    function pump() {
      while (next < ctx.currentTime + 0.15) { schedule(step, next); step++; next += 60 / (T.bpm * tempo) / 4; }
    }
    function fadeTo(v, secs) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
      master.gain.exponentialRampToValueAtTime(Math.max(v, 0.0001), t + secs);
    }
    const level = () => Math.max(0.0001, vol * 0.7);
    return {
      get running() { return ctx.state === "running" && !!timer; },
      start() {
        token++;
        const go = () => {
          if (!timer) { next = ctx.currentTime + 0.05; timer = setInterval(pump, 25); pump(); }
          fadeTo(level(), 1.2);
        };
        if (ctx.state !== "running") return ctx.resume().then(go, () => {});
        go(); return Promise.resolve();
      },
      stop() {
        if (!timer) return;
        const my = ++token;
        fadeTo(0.0001, 0.8);
        setTimeout(() => { if (my === token && timer) { clearInterval(timer); timer = null; } }, 900);
      },
      setVolume(v) { vol = v; if (timer) fadeTo(level(), 0.15); },
      setTrack(name, smooth) {
        const nt = TRACKS[name] || TRACKS.lofi;
        if (nt === T && !swap) return;
        clearTimeout(swap);
        if (!smooth || !timer) { swap = null; T = nt; configure(); step = 0; return; }
        // crossfade: dip out, switch on a fresh bar, swell back in
        fadeTo(0.0001, 0.35);
        swap = setTimeout(() => { swap = null; T = nt; configure(); step = 0; next = ctx.currentTime + 0.05; fadeTo(level(), 0.7); }, 380);
      },
      setTempo(m) { tempo = m; },
      pause() { if (ctx.state === "running") ctx.suspend(); },
      resume() { if (timer && ctx.state !== "running") ctx.resume(); }
    };
  }

  /* one shared music player for the loader + the whole site */
  // which track fits each part of the site
  const TRACK_FOR = { home: "lofi", rush: "chip", students: "quest", sidequest: "audit", hub: "calm", educators: "lounge", admins: "board" };
  const musicCtl = (() => {
    let eng = null, context = "home";
    const trackId = () => TRACK_FOR[context] || "lofi";
    const listeners = new Set();
    const notify = () => listeners.forEach((fn) => fn());
    let held = false;
    function apply() {
      if (!S.music || held) { if (eng) eng.stop(); setTimeout(notify, 950); notify(); return Promise.resolve(); }
      if (!eng) eng = createMusic();
      if (!eng) return Promise.resolve();
      eng.setTrack(trackId(), eng.running);
      eng.setVolume(S.musicVol / 100);
      return eng.start().then(notify);
    }
    // browsers block audio until the visitor interacts: start on the first tap/key if needed
    const kick = (e) => {
      if (e.target && e.target.closest && e.target.closest("#settingsDialog")) return;
      if (S.music && !held && (!eng || !eng.running)) apply();
    };
    document.addEventListener("pointerdown", kick, { passive: true });
    document.addEventListener("keydown", kick);
    document.addEventListener("visibilitychange", () => { if (!eng) return; if (document.hidden) eng.pause(); else if (S.music) eng.resume(); });
    return {
      apply,
      volume(v) { if (eng) eng.setVolume(v); },
      setContext(c) {
        if (c === context) return;
        context = c;
        if (eng && eng.running) eng.setTrack(trackId(), true);
        notify();
      },
      tempo(m) { if (eng) eng.setTempo(m); },
      hold(on) { if (held === on) return; held = on; apply(); },
      get now() { return TRACKS[trackId()]; },
      get running() { return !!eng && eng.running && S.music; },
      onChange(fn) { listeners.add(fn); }
    };
  })();

  /* ==========================================================
     KEYBOARD SHORTCUTS
     ========================================================== */
  function initKeys() {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || $("#loader:not(.done)") || $("#badgeDialog").open || $("#detailDialog").open || $("#settingsDialog").open || $("#videoDialog").open) return;
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
     HUD: badges dialog
     ========================================================== */
  $("#lcdBtn").addEventListener("click", () => { renderBadges(); $("#badgeDialog").showModal(); });
  $("#badgeClose").addEventListener("click", () => $("#badgeDialog").close());
  $("#badgeDialog").addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); $("#badgeDialog").close(); } });
  $("#badgeDialog").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });


  /* ==========================================================
     INTERACTIVE BACKGROUND (canvas)
     - grid cells glow around the cursor
     - floating calculator glyphs drift, parallax with scroll,
       get pushed away by the cursor and linked to it like stars
     - click/tap on empty space sends out a ripple
     ========================================================== */
  let wakeBackground = () => {};
  function initBackground() {
    const cv = $("#bgCanvas");
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const GLYPHS = ["+", "−", "×", "÷", "₱", "%", "=", "Σ", "★"];
    const COLORS = ["#7b8cff", "#ffd23f", "#ff8a75", "#46d6b0"];
    const CELL = 32;
    let W = 0, H = 0, dpr = 1, parts = [], ripples = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let running = true, sleeping = false;
    wakeBackground = () => { if (sleeping && S.bg && !reduceMotion) { sleeping = false; requestAnimationFrame(frame); } };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(46, (W * H) / 26000));
      while (parts.length < target) parts.push(spawn(true));
      parts.length = target;
    }
    function spawn(anywhere) {
      const z = 0.3 + Math.random() * 0.7; // depth: 0.3 far .. 1 near
      return {
        x: Math.random() * W, y: anywhere ? Math.random() * H : H + 30,
        vx: (Math.random() - 0.5) * 0.15, vy: -(0.12 + Math.random() * 0.25) * z,
        z, g: GLYPHS[(Math.random() * GLYPHS.length) | 0], c: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.01, push: 0
      };
    }

    let lastScroll = window.scrollY;
    function frame() {
      if (!running) return;
      if (!S.bg) { ctx.clearRect(0, 0, W, H); sleeping = true; return; }
      ctx.clearRect(0, 0, W, H);
      const sy = window.scrollY, dScroll = sy - lastScroll; lastScroll = sy;

      // 1) grid spotlight
      if (mouse.active) {
        const R = 150, offY = -(sy % CELL);
        const c0 = Math.floor((mouse.x - R) / CELL), c1 = Math.ceil((mouse.x + R) / CELL);
        const r0 = Math.floor((mouse.y - R - offY) / CELL), r1 = Math.ceil((mouse.y + R - offY) / CELL);
        for (let c = c0; c <= c1; c++) {
          for (let r = r0; r <= r1; r++) {
            const x = c * CELL, y = r * CELL + offY;
            const d = Math.hypot(x + CELL / 2 - mouse.x, y + CELL / 2 - mouse.y);
            if (d > R) continue;
            const a = (1 - d / R) ** 2;
            ctx.fillStyle = `rgba(123,140,255,${(a * 0.16).toFixed(3)})`;
            ctx.fillRect(x + 1, y + 1, CELL - 1, CELL - 1);
            ctx.strokeStyle = `rgba(123,140,255,${(a * 0.45).toFixed(3)})`;
            ctx.strokeRect(x + 0.5, y + 0.5, CELL, CELL);
          }
        }
        // the cell right under the cursor, like a selected spreadsheet cell
        const cx = Math.floor(mouse.x / CELL) * CELL, cy = Math.floor((mouse.y - offY) / CELL) * CELL + offY;
        ctx.strokeStyle = "rgba(255,210,63,.7)"; ctx.lineWidth = 2;
        ctx.strokeRect(cx + 1, cy + 1, CELL - 1, CELL - 1);
        ctx.fillStyle = "#ffd23f"; ctx.fillRect(cx + CELL - 4, cy + CELL - 4, 5, 5);
        ctx.lineWidth = 1;
      }

      // 2) glyphs
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy - dScroll * p.z * 0.35; // parallax with scroll
        p.rot += p.vr;
        if (mouse.active) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 120 && d > 0.1) {
            const f = (1 - d / 120) * 1.6 * p.z;
            p.x += (dx / d) * f; p.y += (dy / d) * f;
          }
        }
        for (const rp of ripples) {
          const dx = p.x - rp.x, dy = p.y - rp.y, d = Math.hypot(dx, dy);
          if (Math.abs(d - rp.r) < 26 && d > 0.1) { p.x += (dx / d) * 3 * p.z; p.y += (dy / d) * 3 * p.z; p.vr += 0.004; }
        }
        p.vr *= 0.995;
        // wrap around the edges so density stays even while scrolling
        if (p.y < -40) p.y += H + 80; else if (p.y > H + 40) p.y -= H + 80;
        if (p.x < -40) p.x += W + 80; else if (p.x > W + 40) p.x -= W + 80;
        // burst glyphs slow back down to a gentle drift
        p.vx *= 0.985; if (Math.abs(p.vx) < 0.08) p.vx = p.vx < 0 ? -0.08 : 0.08;
        if (p.vy > -0.1 * p.z) p.vy -= 0.01; else if (p.vy < -0.4) p.vy *= 0.98;
        const size = 12 + p.z * 16;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = 0.1 + p.z * 0.22;
        ctx.fillStyle = p.c;
        ctx.font = `700 ${size.toFixed(0)}px "JetBrains Mono", monospace`;
        ctx.fillText(p.g, 0, 0);
        ctx.restore();
      }

      // 3) constellation lines to the cursor
      if (mouse.active) {
        for (const p of parts) {
          const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (d < 190) {
            ctx.strokeStyle = `rgba(255,210,63,${((1 - d / 190) * 0.35 * p.z).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          }
        }
      }

      // 4) ripples
      ripples = ripples.filter((rp) => rp.r < rp.max);
      for (const rp of ripples) {
        rp.r += 6;
        const a = 1 - rp.r / rp.max;
        ctx.strokeStyle = `rgba(70,214,176,${(a * 0.6).toFixed(3)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(255,210,63,${(a * 0.4).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r * 0.6, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
      }

      requestAnimationFrame(frame);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of parts) {
        ctx.globalAlpha = 0.1 + p.z * 0.18; ctx.fillStyle = p.c;
        ctx.font = `700 ${(12 + p.z * 16).toFixed(0)}px "JetBrains Mono", monospace`;
        ctx.fillText(p.g, p.x, p.y);
      }
      ctx.globalAlpha = 1;
    }

    resize();
    window.addEventListener("resize", () => { resize(); if (reduceMotion) drawStatic(); });
    if (reduceMotion) { drawStatic(); return; }

    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = e.pointerType === "mouse" || e.pointerType === "pen"; }, { passive: true });
    document.addEventListener("pointerleave", () => { mouse.active = false; });
    window.addEventListener("blur", () => { mouse.active = false; });
    const INTERACTIVE = "a,button,input,select,textarea,label,summary,dialog,.panel,.flip,.calc,.sheet,.card,.inventory,.sq-card,.weight,.topbar,.loader";
    window.addEventListener("pointerdown", (e) => {
      if (!S.bg) return;
      if (e.target.closest && e.target.closest(INTERACTIVE)) return;
      ripples.push({ x: e.clientX, y: e.clientY, r: 4, max: Math.max(W, H) * 0.45 });
      for (let i = 0; i < 4; i++) {
        const p = spawn(true); p.x = e.clientX; p.y = e.clientY;
        const a = Math.random() * Math.PI * 2; p.vx = Math.cos(a) * 1.2; p.vy = Math.sin(a) * 1.2;
        parts.push(p); if (parts.length > 70) parts.shift();
      }
      fx.sound("click");
    });
    document.addEventListener("visibilitychange", () => {
      const was = running; running = !document.hidden;
      if (running && !was) { lastScroll = window.scrollY; requestAnimationFrame(frame); }
    });
    requestAnimationFrame(frame);
  }


  /* ==========================================================
     MOBILE MENU (burger)
     ========================================================== */
  function initMenu() {
    const btn = $("#menuBtn"), nav = $("#siteNav");
    const setOpen = (on) => {
      nav.classList.toggle("open", on);
      btn.classList.toggle("open", on);
      btn.setAttribute("aria-expanded", String(on));
      btn.setAttribute("aria-label", on ? "Close menu" : "Open menu");
    };
    btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(!nav.classList.contains("open")); fx.sound("click"); });
    nav.addEventListener("click", (e) => { if (e.target.closest("a, #settingsBtn")) setOpen(false); });
    document.addEventListener("click", (e) => { if (nav.classList.contains("open") && !e.target.closest("#siteNav, #menuBtn")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); btn.focus(); } });
    window.addEventListener("hashchange", () => setOpen(false));
    window.matchMedia("(min-width: 721px)").addEventListener("change", (m) => { if (m.matches) setOpen(false); });
  }

  /* ==========================================================
     HERO CALCULATOR — idle life (keys press themselves)
     ========================================================== */
  function initCalcLife() {
    if (reduceMotion) return;
    const keys = $$(".calc .ck");
    if (!keys.length) return;
    let last = -1;
    setInterval(() => {
      if (document.hidden) return;
      const calc = $(".calc");
      if (!S.motion || !calc || calc.offsetParent === null || calc.classList.contains("tilting")) return;
      let i; do { i = (Math.random() * keys.length) | 0; } while (i === last && keys.length > 1);
      last = i;
      keys[i].classList.add("pressed");
      setTimeout(() => keys[i].classList.remove("pressed"), 220);
    }, 1400);
  }


  /* ==========================================================
     SETTINGS PANEL
     ========================================================== */
  const SW = (key, title, desc) => `
    <div class="set-row">
      <div class="set-txt"><b id="lbl-${key}">${title}</b><small>${desc}</small></div>
      <button type="button" class="switch" role="switch" aria-checked="${!!S[key]}" aria-labelledby="lbl-${key}" data-key="${key}"><span class="knob"></span></button>
    </div>`;
  const RANGE = (key, label, enabled, extra) => `
    <div class="set-row set-range ${enabled ? "" : "off"}">
      <span class="set-vol-ic" aria-hidden="true">${key === "musicVol" ? "♪" : "◖"}</span>
      <input type="range" min="0" max="100" step="5" value="${S[key]}" data-key="${key}" aria-label="${label}" ${enabled ? "" : "disabled"} style="--p:${S[key]}%" />
      <output data-out="${key}">${S[key]}%</output>${extra || ""}
    </div>`;

  function renderSettings(focusKey) {
    const playing = musicCtl.running;
    $("#settingsBody").innerHTML = `
      <div class="badges-head">
        <div><p class="eyebrow">Make it yours</p><h2 id="setTitle">Settings</h2></div>
        <button type="button" class="hud-btn" id="setClose" aria-label="Close settings">✕</button>
      </div>

      <section class="set-sec">
        <h3>Sound</h3>
        ${SW("sfx", "Sound effects", "Clicks, right/wrong tones, rank-ups and badges")}
        ${RANGE("sfxVol", "Sound effects volume", S.sfx, `<button type="button" class="set-mini" id="sfxTest" ${S.sfx ? "" : "disabled"}>Test</button>`)}
        ${SW("music", "Background music", "A looping soundtrack made right in your browser")}
        ${RANGE("musicVol", "Music volume", S.music)}
        <div class="now-playing ${S.music ? "" : "off"}">
          <span class="eq ${playing ? "playing" : ""}" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="track-txt"><b>${S.music ? (playing ? "Now playing: " : "Up next: ") + esc(musicCtl.now.name) : "Music is off"}</b><small>The soundtrack changes to fit each part of the site, like an upbeat beat for Debit or Credit Rush.</small></span>
        </div>
        ${S.music && !playing ? '<p class="set-note">Music starts after your first tap or key press (browser rule).</p>' : ""}
      </section>

      <section class="set-sec">
        <h3>Visuals</h3>
        ${SW("bg", "Animated background", "Floating symbols, cursor glow and click ripples")}
        ${SW("motion", "3D motion effects", "Card tilt, the swaying calculator and idle animations")}
        ${SW("confetti", "Confetti", "Celebration bursts for correct answers and badges")}
      </section>

      <section class="set-sec">
        <h3>Startup</h3>
        ${SW("loader", "Loading screen", "Show the 3D loading screen when the site opens")}
      </section>

      <section class="set-sec">
        <h3>Progress</h3>
        <div class="set-row">
          <div class="set-txt"><b>Reset my progress</b><small>Clears XP, habits, badges, plans and scores on this device. Settings stay.</small></div>
          <button type="button" class="set-danger" id="setReset">Reset</button>
        </div>
      </section>
      ${reduceMotion ? '<p class="set-note">Your device asks for reduced motion, so some animations stay off.</p>' : ""}`;

    const body = $("#settingsBody");
    $("#setClose", body).addEventListener("click", () => $("#settingsDialog").close());
    $$(".switch", body).forEach((sw) => sw.addEventListener("click", () => {
      const k = sw.dataset.key;
      S[k] = !S[k]; saveSettings();
      applySetting(k, sw);
      renderSettings(k);
    }));
    $$('input[type="range"]', body).forEach((r) => {
      r.addEventListener("input", () => {
        const k = r.dataset.key;
        S[k] = Number(r.value);
        r.style.setProperty("--p", S[k] + "%");
        $(`[data-out="${k}"]`, body).textContent = S[k] + "%";
        if (k === "musicVol") musicCtl.volume(S[k] / 100);
      });
      r.addEventListener("change", () => { saveSettings(); if (r.dataset.key === "sfxVol") fx.sound("ok"); });
    });
    const test = $("#sfxTest", body);
    if (test) test.addEventListener("click", () => { fx.sound("level"); fx.burst(test, 14); });
    $("#setReset", body).addEventListener("click", () => { if (resetProgress()) $("#settingsDialog").close(); });

    if (focusKey) {
      const el = $(`.switch[data-key="${focusKey}"]`, body);
      if (el) el.focus({ preventScroll: true });
    }
  }

  function applySetting(k, src) {
    if (k === "sfx" && S.sfx) fx.sound("ok");
    if (k === "music") musicCtl.apply().then(() => { if ($("#settingsDialog").open) renderSettings("music"); });
    if (k === "bg") { $("#bgCanvas").style.display = S.bg ? "" : "none"; wakeBackground(); }
    if (k === "motion") document.documentElement.classList.toggle("no-motion", !S.motion);
    if (k === "confetti" && S.confetti) fx.burst(src, 20);
  }

  musicCtl.onChange(() => { if ($("#settingsDialog").open) { const f = document.activeElement; renderSettings(); if (f && f.dataset && f.dataset.key) { const again = $(`[data-key="${f.dataset.key}"]`, $("#settingsBody")); if (again) again.focus({ preventScroll: true }); } } });
  $("#settingsBtn").addEventListener("click", () => { renderSettings(); $("#settingsDialog").showModal(); fx.sound("click"); });
  $("#settingsDialog").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  if (!S.bg) $("#bgCanvas").style.display = "none";

  /* ---------------- Init ---------------- */
  function init() {
    $("#year").textContent = new Date().getFullYear();
    renderXP(false);
    renderBalance();
    renderOverview();
    renderSkill();
    renderRush();
    renderInventory();
    renderQuest();
    renderSQGrid();
    renderHub();
renderCards("edu");
    renderCards("adm");
    renderMatch("edu");
    renderMatch("adm");

    route();
  }

  function resetProgress() {
    if (!confirm("Reset your XP, habits, badges and scores on this device? Your settings stay.")) return false;
    state = fresh(); save();
    qs.wrong = []; qs.solved = false; sq = null; $("#sqPlayer").hidden = true;
    bal.round = 0; bal.pick = null; bal.tries = 0; bal.angle = 0;
    match.edu = { cur: null, pick: null, streak: 0, score: 0 }; match.adm = { cur: null, pick: null, streak: 0, score: 0 };
    sk.i = 0; sk.picks = SKILL_CHECKS.map(() => null); sk.summary = false;
    clearInterval(rush.timer); rush.phase = "idle";
    init();
    toast("Progress reset");
    return true;
  }
  $("#resetBtn").addEventListener("click", resetProgress);

  initLoader();
  init();
  initBackground();
  initMenu();
  initCalcLife();
  initTilt();
  initKeys();
  checkBadges();
})();
