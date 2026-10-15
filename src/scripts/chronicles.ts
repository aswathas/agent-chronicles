/**
 * The Agent Chronicles — web combat system
 *
 * Vanilla, no dependencies. Respects prefers-reduced-motion and disables
 * itself on coarse pointers, where hover webs mean nothing anyway.
 */
const NS = "http://www.w3.org/2000/svg";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;

/* ── 1. hero web — draws itself on load ── */
function drawHeroWeb() {
  const svg = document.getElementById("webart");
  if (!svg) return;
  const cx = 200, cy = 200;
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2) / 16 * i;
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", cx); l.setAttribute("y1", cy);
    l.setAttribute("x2", cx + Math.cos(a) * 400);
    l.setAttribute("y2", cy + Math.sin(a) * 400);
    l.setAttribute("class", "strand");
    l.style.setProperty("--L", 820);
    l.style.animationDelay = `${i * 0.04}s`;
    svg.appendChild(l);
  }
  for (let r = 30; r <= 400; r += 34) {
    const p = document.createElementNS(NS, "path");
    let d = "";
    for (let i = 0; i <= 16; i++) {
      const a = (Math.PI * 2) / 16 * i;
      d += `${i ? "L" : "M"}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
    }
    p.setAttribute("d", `${d}Z`);
    p.setAttribute("class", "strand");
    p.style.setProperty("--L", Math.round(2 * Math.PI * r));
    p.style.animationDelay = `${0.3 + r / 800}s`;
    svg.appendChild(p);
  }
}

/* ── 2. section dividers ── */
function drawDividers() {
  document.querySelectorAll(".webrule svg").forEach((s) => {
    for (let x = 0; x <= 1200; x += 120) {
      const c = document.createElementNS(NS, "path");
      const up = (x / 120) % 2 === 0;
      c.setAttribute("d", `M${x} 15 Q${x + 60} ${up ? 0 : 30} ${x + 120} 15`);
      c.setAttribute("class", "strand");
      c.style.setProperty("--L", 260);
      c.style.animationDelay = `${(x / 1200) * 0.5}s`;
      s.appendChild(c);
    }
  });
}

/* ── 3. scroll reveal ── */
function scrollReveal() {
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.1 }
  );
  document.querySelectorAll(".rev").forEach((el) => io.observe(el));
}

/* ── 4. shooter — strands sag under gravity, snap taut on impact ── */
function initShooter() {
  const svg = document.getElementById("websvg");
  if (!svg) return null;

  const OX = () => innerWidth / 2;
  const OY = () => innerHeight + 40;
  const stuck = new Map();

  function sagPath(x1, y1, x2, y2, tension) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const drop = (1 - tension) * Math.min(180, Math.hypot(x2 - x1, y2 - y1) * 0.28);
    return `M${x1} ${y1} Q${mx} ${my + drop} ${x2} ${y2}`;
  }

  /**
   * A real web pattern, not parallel lines: radial threads from the impact
   * point crossed by concentric rings. `partial` draws only the outer 40%
   * of the rings, the way a web actually lands before it's finished.
   */
  function webPattern(cx, cy, r, { partial = false, cls = "" } = {}) {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", cls);

    const rays = 11;
    for (let i = 0; i < rays; i++) {
      const a = (Math.PI * 2) / rays * i + 0.28;
      const len = r * (0.82 + Math.random() * 0.36);
      const p = document.createElementNS(NS, "path");
      // each thread bows slightly, the way silk under tension curves
      const bx = cx + Math.cos(a) * len * 0.55 + Math.cos(a + 0.5) * r * 0.14;
      const by = cy + Math.sin(a) * len * 0.55 + Math.sin(a + 0.5) * r * 0.14;
      p.setAttribute(
        "d",
        `M${cx} ${cy} Q${bx.toFixed(1)} ${by.toFixed(1)} ${(cx + Math.cos(a) * len).toFixed(1)} ${(cy + Math.sin(a) * len).toFixed(1)}`
      );
      g.appendChild(p);
    }

    // spiral in rather than perfect circles — webs are never true circles
    const steps = partial ? 3 : 6;
    for (let s = 1; s <= steps; s++) {
      const rr = (r * s) / steps;
      const path = document.createElementNS(NS, "path");
      let d = "";
      const segs = 9;
      for (let i = 0; i <= segs; i++) {
        const a = (Math.PI * 2) / segs * i;
        const wob = 1 + Math.sin(a * 3 + s) * 0.07;
        const x = cx + Math.cos(a) * rr * wob;
        const y = cy + Math.sin(a) * rr * wob;
        d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      path.setAttribute("d", `${d}Z`);
      g.appendChild(path);
    }
    return g;
  }

  function buildShot(tx, ty, pinned = false) {
    const g = document.createElementNS(NS, "g");
    const paths = [];

    // the travelling threads: a small spray that widens as it flies
    for (let i = 0; i < 3; i++) {
      const off = (i - 1) * 7;
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", `shot${pinned ? " stick" : ""}`);
      p.setAttribute("d", sagPath(OX(), OY(), tx + off, ty + off, 1));
      g.appendChild(p); paths.push(p);
    }

    // the pattern that lands at the target
    const pattern = webPattern(tx, ty, pinned ? 40 : 30, {
      partial: !pinned,
      cls: `shot${pinned ? " stick" : ""} webp${pinned ? " pinned" : ""}`,
    });
    g.appendChild(pattern);

    const blob = document.createElementNS(NS, "circle");
    blob.setAttribute("class", "blob");
    blob.setAttribute("cx", tx); blob.setAttribute("cy", ty);
    blob.setAttribute("r", pinned ? 11 : 7);
    g.appendChild(blob);

    // pattern paths stay put — only the travelling strands animate
    return { g, paths, tx, ty, pinned, pattern };
  }

  function impactAt(x, y) {
    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("class", "impact");
    ring.setAttribute("cx", x); ring.setAttribute("cy", y); ring.setAttribute("r", 4);
    svg.appendChild(ring);
    setTimeout(() => ring.remove(), 520);
  }

  /** Animate the head from origin to target; tension rises, then it snaps taut. */
  function fire(shot, done) {
    const { g, paths, tx, ty, pinned } = shot;
    svg.appendChild(g);
    const T = pinned ? 340 : 250;
    const start = performance.now();
    const spread = pinned ? 34 : 26;
    // #websvg is position:fixed, so targets are viewport coordinates
    const ox = OX(), oy = OY();

    const frame = (now) => {
      const t = Math.min(1, (now - start) / T);
      const e = 1 - Math.pow(1 - t, 3);
      const hx = ox + (tx - ox) * e;
      const hy = oy + (ty - oy) * e;
      const tension = Math.min(1, e * 1.15);
      paths.forEach((p, i) => {
        const off = (i - 2) * (spread / 4);
        p.setAttribute("d", sagPath(ox, oy, hx + off, hy + off * 0.5, tension));
      });
      if (t < 1) requestAnimationFrame(frame);
      else {
        impactAt(tx, ty);
        paths.forEach((p) =>
          p.setAttribute("d", sagPath(ox, oy, tx, ty, pinned ? 0.96 : 1))
        );
        // the web blooms outward from the impact point
        const rings = shot.pattern?.querySelectorAll("path");
        if (rings) {
          rings.forEach((p, i) => {
            const len = p.getTotalLength?.() || 200;
            p.style.strokeDasharray = `${len}`;
            p.style.strokeDashoffset = `${len}`;
            p.style.transition = `stroke-dashoffset .34s cubic-bezier(.16,1,.3,1) ${i * 0.018}s`;
            requestAnimationFrame(() => { p.style.strokeDashoffset = "0"; });
          });
        }
        done?.();
      }
    };
    requestAnimationFrame(frame);
  }

  function webTo(el, clientX, clientY) {
    if (stuck.has(el)) return release(el);
    const r = el.getBoundingClientRect();
    const tx = r.left + r.width * (0.28 + Math.random() * 0.44);
    const ty = r.top + r.height * (0.22 + Math.random() * 0.56);
    const shot = buildShot(tx, ty, true);
    fire(shot);
    el.style.setProperty("--wx", `${((clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--wy", `${((clientY - r.top) / r.height) * 100}%`);
    el.classList.add("webbed", "pinned");
    el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
    stuck.set(el, shot.g);
  }

  function release(el) {
    const g = stuck.get(el);
    if (!g) return;
    g.remove();               // removes the outer group and everything inside it
    stuck.delete(el);
    el.classList.remove("webbed", "pinned", "shake");
  }

  function clearAll() {
    stuck.forEach((g) => g.remove());
    stuck.clear();
    document.querySelectorAll(".webbed")
      .forEach((c) => c.classList.remove("webbed", "pinned", "shake"));
  }

  return { svg, fire, buildShot, webTo, clearAll, stuck };
}

/* ── 5. villains ── */
const VILLAINS = [
  { id: "venom", name: "Venom", hp: 3 },
  { id: "symbiote", name: "Symbiote", hp: 2 },
  { id: "shocker", name: "Shocker", hp: 2 },
  { id: "doom", name: "Doctor Doom", hp: 3 },
  { id: "vulture", name: "Vulture", hp: 2 },
  { id: "carnage", name: "Carnage", hp: 3 },
];

const VILLAGE_SVG = {
  venom: `<path class="body" d="M32 6c12 0 20 9 20 22 0 12-4 22-10 26-4 3-7 4-10 4s-6-1-10-4c-6-4-10-14-10-26C12 15 20 6 32 6z"/><path class="body" d="M14 20c-4 6-4 16 0 22M50 20c4 6 4 16 0 22"/><ellipse class="eye" cx="24" cy="26" rx="5.5" ry="3.6" transform="rotate(-18 24 26)"/><ellipse class="eye" cx="40" cy="26" rx="5.5" ry="3.6" transform="rotate(18 40 26)"/><path class="grin" d="M20 38q12 9 24 0"/>`,
  symbiote: `<path class="body" d="M32 8c11 0 19 8 19 20 0 11-4 20-9 24-4 3-16 3-20 0-5-4-9-13-9-24C13 16 21 8 32 8z"/><path class="eye" d="M22 25l8 3-8 3zM42 25l-8 3 8 3z"/><path class="grin" d="M22 38h20" stroke-width="3"/>`,
  shocker: `<circle class="body" cx="32" cy="26" r="16"/><path class="body" d="M32 42v16M22 46h20"/><circle class="eye" cx="26" cy="22" r="4"/><circle class="eye" cx="38" cy="22" r="4"/><path class="grin" d="M24 32h16"/>`,
  doom: `<path class="body" d="M18 18h28v22c0 8-6 14-14 14s-14-6-14-14z"/><rect class="body" x="22" y="12" width="20" height="10" rx="2"/><path class="eye" d="M26 24h8v5h-8zM34 24h8v5h-8z"/>`,
  vulture: `<path class="body" d="M32 14c8 0 14 7 14 16s-6 16-14 16-14-7-14-16 6-16 14-16z"/><path class="tendril" d="M18 22L2 12M18 30L0 28M18 38L4 46M46 22l16-10M46 30l18-2M46 38l14 8"/><circle class="eye" cx="26" cy="26" r="3.4"/><circle class="eye" cx="38" cy="26" r="3.4"/>`,
  carnage: `<path class="body" d="M32 6c13 0 21 10 21 24 0 13-5 23-11 27-3 2-17 2-20 0-6-4-11-14-11-27C11 16 19 6 32 6z"/><path class="eye" d="M18 22l12 5-12 4zM46 22l-12 5 12 4z"/><path class="grin" d="M18 36l7 6 7-6 7 6 7-6" stroke-width="2.4"/>`,
};

function initVillains(shooter) {
  const actors = [];
  const hud = document.getElementById("hud");
  const scoreEl = document.getElementById("score");
  let score = 0, started = false, timer = null;

  function spawn() {
    const spec = VILLAINS[Math.floor(Math.random() * VILLAINS.length)];
    const el = document.createElement("div");
    el.className = "villain";
    el.innerHTML =
      `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${VILLAGE_SVG[spec.id]}</svg>` +
      `<div class="hp"><b style="width:100%"></b></div>`;
    // position:fixed means coordinates are viewport-relative. Spawning at
    // document height would drop the villain thousands of px below the fold.
    const y = innerHeight * (0.18 + Math.random() * 0.55);
    el.style.transform = `translate(${innerWidth + 90}px, ${y}px)`;
    document.body.appendChild(el);
    actors.push({
      el, spec, hp: spec.hp, x: innerWidth + 90, y, y0: y,
      // 1.8–3.4 px/frame crosses a 1400px viewport in roughly 7s. The old
      // 0.55–1.05 took 22–42s, so villains drifted past unnoticed.
      vx: -(1.8 + Math.random() * 1.6),
      bobRate: 0.012 + Math.random() * 0.012,
      bobAmp: 22 + Math.random() * 26,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function scheduleNext() {
    clearTimeout(timer);
    // short and jittered so it reads as continuous, not as a metronome
    timer = setTimeout(() => {
      if (!started) return;
      // never let more than two on screen at once
      if (actors.length < 2) spawn();
      scheduleNext();
    }, 5200 + Math.random() * 3800);
  }

  function begin() {
    if (started) return;
    started = true;
    spawn();          // one straight away
    scheduleNext();   // then keep them coming
  }

  (function tick() {
    for (let i = actors.length - 1; i >= 0; i--) {
      const a = actors[i];
      a.phase += a.bobRate;
      a.x += a.vx;
      // bob around a fixed base rather than accumulating y each frame —
      // `y += vy` compounded without bound and drifted villains off-screen
      const bob = Math.sin(a.phase) * a.bobAmp;
      const tilt = Math.sin(a.phase * 0.7) * 9;
      const y = a.y0 + bob;
      a.el.style.transform =
        `translate(${a.x}px, ${y.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`;
      if (a.x < -140) {
        a.el.remove(); actors.splice(i, 1);
      }
    }
    requestAnimationFrame(tick);
  })();

  function villainAt(x, y) {
    // hit-test against the rendered rect, not the transform's raw coords —
    // a.y is document-space, the pointer is viewport-space
    for (const a of actors) {
      const r = a.el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy < 42 * 42) return a;
    }
    return null;
  }

  function hit(a) {
    a.hp--;
    a.el.classList.add("bruise");
    a.el.querySelector(".hp b").style.width = `${(a.hp / a.spec.hp) * 100}%`;
    a.vx -= 2.4;                        // the hit should knock it back
    // nudge its lane, but clamp: stacked hits must not fling it off-screen
    a.y0 = Math.max(80, Math.min(innerHeight - 90, a.y0 + (Math.random() - 0.5) * 40));
    if (a.vx < -4.5) a.vx = -4.5;       // cap the knockback too
    if (a.hp <= 0) {
      score++;
      if (scoreEl) scoreEl.textContent = String(score).padStart(2, "0");
      hud?.classList.add("on");
      setTimeout(() => hud?.classList.remove("on"), 2600);
      a.el.classList.add("dead");
      setTimeout(() => {
        a.el.remove();
        const i = actors.indexOf(a);
        if (i >= 0) actors.splice(i, 1);
      }, 620);
    }
  }

  return { villainAt, hit, begin, actors };
}

/* ── 6. spider sense ── */
function initSense() {
  // a generous band so it reliably triggers, but with hysteresis so it
  // doesn't flicker on and off as you hover right at the threshold
  const NEAR = 110;
  const FAR = 150;
  const N = { L: "senseL", R: "senseR", T: "senseT", B: "senseB" };
  const W = { L: "washL", R: "washR", T: "washT", B: "washB" };
  let armed = null;

  function set(side) {
    if (armed === side) return;
    for (const k in N) document.getElementById(N[k])?.classList.remove("on");
    for (const k in W) document.getElementById(W[k])?.classList.remove("on");
    armed = side;
    if (side) {
      document.getElementById(N[side])?.classList.add("on");
      document.getElementById(W[side])?.classList.add("on");
    }
  }

  function near(x, y) {
    const t = armed ? FAR : NEAR;
    if (x < t) return "L";
    if (x > innerWidth - t) return "R";
    if (y < t) return "T";
    if (y > innerHeight - t) return "B";
    return null;
  }

  addEventListener("mousemove", (e) => set(near(e.clientX, e.clientY)), { passive: true });
  // a window resize can leave you inside the band with no mouse movement
  addEventListener("resize", () => set(null), { passive: true });
}

/* ── 7. cursor + click routing ── */
function initCursor(shooter, villains) {
  const cur = document.querySelector(".cur");
  const curtain = document.getElementById("curtain");
  const TARGETS = ".p,.rlist>div,.pj,.next div";

  if (cur && fine) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
    addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    document.querySelectorAll("a,.chip,.soc").forEach((el) => {
      el.addEventListener("mouseenter", () => cur.classList.add("act"));
      el.addEventListener("mouseleave", () => cur.classList.remove("act"));
    });
  }

  addEventListener("mousemove", (e) => {
    curtain?.style.setProperty("--cx", `${e.clientX}px`);
    curtain?.style.setProperty("--cy", `${e.clientY}px`);
    const on = !!villains.villainAt(e.clientX, e.clientY);
    curtain?.classList.toggle("on", on);
    if (cur && !cur.classList.contains("act")) cur.classList.toggle("act", on);
  });

  addEventListener("click", (e) => {
    // 1. villains take priority
    const v = villains.villainAt(e.clientX, e.clientY);
    if (v) { shooter.fire(shooter.buildShot(e.clientX, e.clientY)); villains.hit(v); return; }
    // 2. web a component
    const el = e.target.closest(TARGETS);
    if (el) { e.preventDefault(); shooter.webTo(el, e.clientX, e.clientY); return; }
    // 3. empty space clears everything
    shooter.clearAll();
  });

  addEventListener("mouseover", (e) => {
    const el = e.target.closest(TARGETS);
    if (!el || shooter.stuck.has(el)) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--wx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--wy", `${((e.clientY - r.top) / r.height) * 100}%`);
    el.classList.add("webbed");
  });
  addEventListener("mousemove", (e) => {
    const el = e.target.closest(TARGETS);
    if (!el || shooter.stuck.has(el)) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--wx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--wy", `${((e.clientY - r.top) / r.height) * 100}%`);
  });
  addEventListener("mouseout", (e) => {
    const el = e.target.closest(TARGETS);
    if (el && !el.contains(e.relatedTarget) && !shooter.stuck.has(el)) {
      el.classList.remove("webbed");
    }
  });
}

/* ── boot ── */
drawHeroWeb();
drawDividers();
scrollReveal();

if (!reduce && fine) {
  const shooter = initShooter();
  if (shooter) {
    const villains = initVillains(shooter);
    initSense();
    initCursor(shooter, villains);
    // villains wait until the reader is actually into the page
    addEventListener("scroll", () => {
      if (window.scrollY > innerHeight * 0.5) villains.begin();
    }, { once: true, passive: true });
  }
}