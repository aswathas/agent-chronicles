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

/* ── 5. spider sense ── */
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

/* ── 6. cursor + web navigation ── */
/**
 * The web IS the navigation. Sections are nodes; silk runs from your cursor
 * to whichever one holds it, so you can always see what you're attached to.
 */
function initWebNav(shooter) {
  const cur = document.querySelector(".cur");
  const curtain = document.getElementById("curtain");
  const layer = document.getElementById("websvg");
  const TARGETS = ".p,.rlist>div,.pj,.next div";

  const tethers = new Map();
  document.querySelectorAll("section[id]").forEach((sec) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("class", "tether");
    layer.appendChild(p);
    tethers.set(sec, p);
  });

  /** Silk from the cursor to the heading of the section under it. */
  function tetherTo(sec, fromX, fromY) {
    tethers.forEach((path, s) => {
      if (s !== sec) { path.classList.remove("on"); return; }
      path.classList.add("on");
      const head = s.querySelector(".mline") || s.querySelector("h2") || s;
      const r = head.getBoundingClientRect();
      const ax = Math.max(r.left, Math.min(r.right, fromX));
      const ay = Math.max(r.top, Math.min(r.bottom, fromY));
      const mx = (fromX + ax) / 2;
      const my = (fromY + ay) / 2;
      const sag = 24 + Math.hypot(ax - fromX, ay - fromY) * 0.05;
      path.setAttribute("d", `M${fromX} ${fromY} Q${mx} ${my + sag} ${ax} ${ay}`);
    });
  }

  if (cur) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
    addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
  }

  addEventListener("mousemove", (e) => {
    const x = e.clientX, y = e.clientY;
    curtain?.style.setProperty("--cx", `${x}px`);
    curtain?.style.setProperty("--cy", `${y}px`);
    const onCard = !!(e.target.closest && e.target.closest(TARGETS));
    curtain?.classList.toggle("on", onCard);
    if (cur && !cur.classList.contains("act")) cur.classList.toggle("act", onCard);
    tetherTo(e.target.closest ? e.target.closest("section[id]") : null, x, y);
  });

  addEventListener("click", (e) => {
    const el = e.target.closest(TARGETS);
    if (el) { e.preventDefault(); shooter.webTo(el, e.clientX, e.clientY); return; }
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
    initSense();
    initWebNav(shooter);
  }
}