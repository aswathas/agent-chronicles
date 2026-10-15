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

  function buildShot(tx, ty, pinned = false) {
    const g = document.createElementNS(NS, "g");
    const paths = [];
    const spread = pinned ? 34 : 26;

    for (let i = 0; i < 5; i++) {
      const off = (i - 2) * (spread / 4);
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", `shot${pinned ? " stick" : ""}`);
      p.setAttribute("d", sagPath(OX(), OY(), tx + off, ty + off * 0.5, 1));
      g.appendChild(p); paths.push(p);
    }
    // cross-threads: woven silk, not a spider shape
    for (let i = 0; i < 4; i++) {
      const c = document.createElementNS(NS, "path");
      c.setAttribute("class", `shot${pinned ? " stick" : ""}`);
      const t1 = 0.3 + i * 0.15, t2 = t1 + 0.14;
      const x1 = OX() + (tx - OX()) * t1, y1 = OY() + (ty - OY()) * t1;
      const x2 = OX() + (tx - OX()) * t2, y2 = OY() + (ty - OY()) * t2;
      c.setAttribute("d", sagPath(x1, y1, x2, y2, 0.8));
      g.appendChild(c); paths.push(c);
    }
    const blob = document.createElementNS(NS, "circle");
    blob.setAttribute("class", "blob");
    blob.setAttribute("cx", tx); blob.setAttribute("cy", ty);
    blob.setAttribute("r", pinned ? 13 : 8);
    g.appendChild(blob);

    return { g, paths, tx, ty, pinned };
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
    g.remove(); stuck.delete(el);
    el.classList.remove("webbed", "pinned", "shake");
  }

  function clearAll() {
    stuck.forEach((s) => s.g.remove());
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
    const y = innerHeight * (0.2 + Math.random() * 0.6);
    el.style.transform = `translate(${innerWidth + 90}px, ${y}px)`;
    document.body.appendChild(el);
    actors.push({
      el, spec, hp: spec.hp, x: innerWidth + 90, y,
      vx: -(0.55 + Math.random() * 0.5),
      vy: (Math.random() - 0.5) * 0.28,
      phase: Math.random() * 6,
    });
  }

  function scheduleNext() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (started && actors.length === 0) spawn();
    }, 9000 + Math.random() * 7000);
  }

  function begin() {
    if (started) return;
    started = true;
    setTimeout(spawn, 1200);
  }

  (function tick() {
    for (let i = actors.length - 1; i >= 0; i--) {
      const a = actors[i];
      a.phase += 0.02;
      a.x += a.vx;
      a.y += a.vy + Math.sin(a.phase) * 0.22;
      a.el.style.transform =
        `translate(${a.x}px, ${a.y}px) rotate(${Math.sin(a.phase) * 8}deg)`;
      if (a.x < -120) {
        a.el.remove(); actors.splice(i, 1);
        if (started && actors.length === 0) scheduleNext();
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
    a.vy += (Math.random() - 0.5) * 2;
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
        if (started && actors.length === 0) scheduleNext();
      }, 620);
    }
  }

  return { villainAt, hit, begin, actors };
}

/* ── 6. spider sense ── */
function initSense() {
  const EDGE = 78;
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
  addEventListener("mousemove", (e) => {
    const { clientX: x, clientY: y } = e;
    if (x < EDGE) set("L");
    else if (x > innerWidth - EDGE) set("R");
    else if (y < EDGE) set("T");
    else if (y > innerHeight - EDGE) set("B");
    else set(null);
  });
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