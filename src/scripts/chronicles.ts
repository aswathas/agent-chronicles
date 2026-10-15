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
/**
 * Card webbing. Hover lays silk over a card; Alt+click pins it in place.
 * Plain clicks are left completely alone so every card link still works —
 * no preventDefault, so middle-click and ctrl-click behave normally.
 */
function initShooter() {
  const svg = document.getElementById("websvg");
  if (!svg) return null;
  const stuck = new Map();
  const TARGETS = ".p,.rlist>div";

  /** A web pattern laid flat at a point: bowed threads + wobbly rings. */
  function webPattern(cx, cy, r) {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "shot stick");
    g.setAttribute("aria-hidden", "true");

    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2) / 10 * i + 0.28;
      const len = r * (0.82 + ((i * 37) % 11) / 30);
      const bx = cx + Math.cos(a) * len * 0.55 + Math.cos(a + 0.5) * r * 0.13;
      const by = cy + Math.sin(a) * len * 0.55 + Math.sin(a + 0.5) * r * 0.13;
      const p = document.createElementNS(NS, "path");
      p.setAttribute(
        "d",
        `M${cx.toFixed(1)} ${cy.toFixed(1)} Q${bx.toFixed(1)} ${by.toFixed(1)} ` +
          `${(cx + Math.cos(a) * len).toFixed(1)} ${(cy + Math.sin(a) * len).toFixed(1)}`
      );
      g.appendChild(p);
    }

    for (let s = 1; s <= 5; s++) {
      const rr = (r * s) / 5;
      const path = document.createElementNS(NS, "path");
      let d = "";
      for (let i = 0; i <= 9; i++) {
        const a = (Math.PI * 2) / 9 * i;
        const wob = 1 + Math.sin(a * 3 + s) * 0.07;
        d += `${i ? "L" : "M"}${(cx + Math.cos(a) * rr * wob).toFixed(1)} ${(cy + Math.sin(a) * rr * wob).toFixed(1)}`;
      }
      path.setAttribute("d", `${d}Z`);
      g.appendChild(path);
    }

    // draw outward rather than appearing all at once
    g.querySelectorAll("path").forEach((p, i) => {
      const len = p.getTotalLength?.() || 160;
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      p.style.transition = `stroke-dashoffset .3s cubic-bezier(.16,1,.3,1) ${i * 0.014}s`;
      requestAnimationFrame(() => { p.style.strokeDashoffset = "0"; });
    });

    return g;
  }

  function webTo(el, clientX, clientY) {
    const r = el.getBoundingClientRect();
    if (stuck.has(el)) {
      stuck.get(el).remove();
      stuck.delete(el);
      el.classList.remove("pinned");
      return;
    }
    const g = webPattern(
      clientX, clientY,
      Math.max(38, Math.min(r.width, r.height) * 0.42)
    );
    svg.appendChild(g);
    el.classList.add("pinned");
    stuck.set(el, g);
  }

  function clearAll() {
    stuck.forEach((g) => g.remove());
    stuck.clear();
    document.querySelectorAll(".pinned").forEach((c) => c.classList.remove("pinned"));
  }

  return { webTo, clearAll, stuck, TARGETS };
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
/**
 * Sections are web nodes. A silk strand runs from the cursor to whichever
 * section holds it, so you always know which part of the page you're in.
 * Uses pointerenter/leave on sections rather than a mousemove hot path,
 * and leaves link clicks entirely alone.
 */
function initWebNav(shooter) {
  const layer = document.getElementById("websvg");
  const sections = [...document.querySelectorAll("section[id]")];

  const tethers = new Map();
  sections.forEach((sec) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("class", "tether");
    p.setAttribute("aria-hidden", "true");
    layer.appendChild(p);
    tethers.set(sec, p);
  });

  function draw(sec, x, y) {
    tethers.forEach((path, s) => {
      if (s !== sec) { path.classList.remove("on"); return; }
      path.classList.add("on");
      const head = s.querySelector(".mline") || s.querySelector("h2") || s;
      const r = head.getBoundingClientRect();
      const ax = Math.max(r.left, Math.min(r.right, x));
      const ay = Math.max(r.top, Math.min(r.bottom, y));
      const mx = (x + ax) / 2;
      const my = (y + ay) / 2;
      const sag = 24 + Math.hypot(ax - x, ay - y) * 0.05;
      path.setAttribute("d", `M${x} ${y} Q${mx} ${my + sag} ${ax} ${ay}`);
    });
  }

  // only redraw when the section actually changes
  let current = null;
  addEventListener("mousemove", (e) => {
    const sec = e.target.closest ? e.target.closest("section[id]") : null;
    if (sec !== current) {
      current = sec;
      tethers.forEach((p, s) => p.classList.toggle("on", s === sec));
    }
    if (sec) draw(sec, e.clientX, e.clientY);
  }, { passive: true });

  // Alt+click pins a web on a card. Everything else falls through to the link.
  addEventListener("click", (e) => {
    if (!e.altKey) return;
    const el = e.target.closest(shooter.TARGETS);
    if (!el) return;
    e.preventDefault();
    shooter.webTo(el, e.clientX, e.clientY);
  });

  // hover silk on cards
  addEventListener("mouseover", (e) => {
    const el = e.target.closest(shooter.TARGETS);
    if (!el || el.classList.contains("pinned")) return;
    el.classList.add("webbed");
  });
  addEventListener("mouseout", (e) => {
    const el = e.target.closest(shooter.TARGETS);
    if (el && !el.contains(e.relatedTarget) && !el.classList.contains("pinned")) {
      el.classList.remove("webbed");
    }
  });

  addEventListener("keydown", (e) => {
    if (e.key === "Escape") shooter.clearAll();
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