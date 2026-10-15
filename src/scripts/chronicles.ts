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
  const TARGETS = ".p,.rlist>.p";

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
/**
 * The spidey-sense HUD. Proximity to any edge drives a three-state machine:
 * idle is nearly invisible, warn clusters the ring toward the vector, impact
 * floods the page and jolts. The paper underneath never changes.
 */
function initSense() {
  const RING = 280;
  const SEGS = 48;

  const ringHost = document.getElementById("senseRing");
  const alarm = document.getElementById("alarm");
  const readout = document.getElementById("alarmReadout");
  const silk = document.getElementById("silkLayer");
  if (!ringHost) return;

  let segs: SVGPathElement[] = [];
  const pt = (a: number, r: number): [number, number] => [
    Math.cos(a) * r,
    Math.sin(a) * r,
  ];

  /* build the 360-degree ring once */
  ringHost.innerHTML =
    `<svg viewBox="${-RING - 20} ${-RING - 20} ${RING * 2 + 40} ${RING * 2 + 40}">` +
    `<circle class="track" r="${RING}"/>` +
    `<circle class="track" r="${RING - 16}" opacity=".5"/>` +
    `<g class="ticks"></g><g class="segs"></g>` +
    `<circle class="halo" r="${RING}"/><g class="blips"></g></svg>`;

  const svg = ringHost.querySelector("svg");
  const ticks = svg!.querySelector(".ticks");
  const segGroup = svg!.querySelector(".segs");

  for (let i = 0; i < 24; i++) {
    const a = (Math.PI * 2 / 24) * i - Math.PI / 2;
    const [x1, y1] = pt(a, i % 6 === 0 ? RING - 13 : RING - 7);
    const [x2, y2] = pt(a, RING - 1);
    const l = document.createElementNS(NS, "line");
    l.setAttribute("class", "tick");
    l.setAttribute("x1", x1.toFixed(1));
    l.setAttribute("y1", y1.toFixed(1));
    l.setAttribute("x2", x2.toFixed(1));
    l.setAttribute("y2", y2.toFixed(1));
    ticks!.appendChild(l);
  }

  for (let i = 0; i < SEGS; i++) {
    const a0 = (Math.PI * 2 / SEGS) * i - Math.PI / 2 - 0.045;
    const a1 = a0 + 0.09;
    const [x1, y1] = pt(a0, RING);
    const [x2, y2] = pt(a1, RING);
    const p = document.createElementNS(NS, "path");
    p.setAttribute("class", "seg");
    p.setAttribute(
      "d",
      `M${x1.toFixed(1)} ${y1.toFixed(1)} A ${RING} ${RING} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
    );
    segGroup!.appendChild(p);
    segs.push(p);
  }

  const spots = ["hotA", "hotB", "hotC"]
    .map((id) => document.getElementById(id))
    .filter(Boolean) as HTMLElement[];

  const $ = (id: string) => document.getElementById(id);
  let state = "idle";
  let armedEdge = "";

  /** Which ring segment faces the pointer. */
  function segFor(x: number, y: number) {
    let a = Math.atan2(y - 0.5, x - 0.5) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    return Math.floor((a / (Math.PI * 2)) * SEGS) % SEGS;
  }

  function apply(next: string, x: number, y: number) {
    if (next === state) return;
    state = next;
    document.documentElement.dataset.sense = next;
    $("tState")!.textContent = next;

    alarm?.style.setProperty("--ax", `${(x * 100).toFixed(1)}%`);
    alarm?.style.setProperty("--ay", `${(y * 100).toFixed(1)}%`);

    if (next === "idle") {
      segs.forEach((e) => (e.style.opacity = "0"));
      spots.forEach((s) => (s.style.opacity = "0"));
      readout?.classList.remove("on");
      armedEdge = "";
      $("tThreat")!.textContent = "none";
      $("tTti")!.textContent = "—";
      $("tTraj")!.textContent = "—";
      $("tVel")!.textContent = "0.0";
      $("tCon")!.textContent = "0";
      $("tSig")!.textContent = "0%";
      return;
    }

    // announce once per edge entered, not on every pixel
    const edge = y < 0.2 ? "top" : y > 0.8 ? "bottom" : x < 0.2 ? "left" : "right";
    if (edge !== armedEdge) {
      armedEdge = edge;
      readout?.classList.add("on");
    }

    const idx = segFor(x, y);
    const spread = next === "impact" ? 8 : 3;
    segs.forEach((e, i) => {
      const d = Math.min(Math.abs(i - idx), SEGS - Math.abs(i - idx));
      e.style.opacity = d <= spread ? String(1 - d / (spread + 1)) : "0";
    });

    // ripples bloom from the threat's own position on the ring
    const [bx, by] = pt((Math.PI * 2 / SEGS) * idx - Math.PI / 2, RING);
    const cx = innerWidth / 2 + bx;
    const cy = innerHeight / 2 + by;
    spots.forEach((s, i) => {
      s.style.opacity = "1";
      s.style.left = `${cx}px`;
      s.style.top = `${cy}px`;
      s.style.transform = `scale(${0.9 + i * 0.22})`;
    });

    if (next === "warn") {
      $("tThreat")!.textContent = "anomaly";
      $("tTti")!.textContent = "0.9s";
      $("tTraj")!.textContent = `${edge.toUpperCase()}`;
      $("tVel")!.textContent = "14.2";
      $("tCon")!.textContent = "1";
      $("tSig")!.textContent = "62%";
    } else {
      $("tThreat")!.textContent = "impact";
      $("tTti")!.textContent = "0.04s";
      $("tTraj")!.textContent = `${edge.toUpperCase()} / DESC`;
      $("tVel")!.textContent = "38.7";
      $("tCon")!.textContent = "3";
      $("tSig")!.textContent = "100%";
    }
  }

  addEventListener(
    "mousemove",
    (e) => {
      const x = e.clientX / innerWidth;
      const y = e.clientY / innerHeight;
      const edgePx = Math.min(e.clientX, innerWidth - e.clientX, e.clientY, innerHeight - e.clientY);
      // bands in px rather than fractions: 0.045 of 1440 is 65px, which a
      // cursor reaches only by deliberately jamming it into the corner
      if (edgePx < 26) apply("impact", x, y);
      else if (edgePx < 130) apply("warn", x, y);
      else apply("idle", x, y);
    },
    { passive: true }
  );

  addEventListener("resize", () => apply("idle", 0.5, 0.5), { passive: true });

  /* clicking throws silk from the point you clicked */
  addEventListener("pointerdown", (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const g = document.createElementNS(NS, "g");
    const spokes = 7 + Math.floor(Math.random() * 5);
    const reach = 70 + Math.random() * 90;

    for (let i = 0; i < spokes; i++) {
      const a = (Math.PI * 2 / spokes) * i + Math.random() * 0.3;
      const len = reach * (0.6 + Math.random() * 0.6);
      const p = document.createElementNS(NS, "path");
      // bow each thread so it reads as silk under tension, not spokes
      const mx = x + Math.cos(a) * len * 0.55 + Math.cos(a + 0.6) * len * 0.16;
      const my = y + Math.sin(a) * len * 0.55 + Math.sin(a + 0.6) * len * 0.16;
      p.setAttribute(
        "d",
        `M${x} ${y} Q${mx.toFixed(1)} ${my.toFixed(1)} ${(x + Math.cos(a) * len).toFixed(1)} ${(y + Math.sin(a) * len).toFixed(1)}`
      );
      g.appendChild(p);
    }
    for (const r of [18, 31, 44]) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x);
      c.setAttribute("cy", y);
      c.setAttribute("r", String(r));
      g.appendChild(c);
    }
    silk?.appendChild(g);
    setTimeout(() => g.remove(), 980);
  });

  apply("idle", 0.5, 0.5);
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
    initBrowse();
  }
}
/**
 * Two behaviours for the hero filter row and the AI Projects section.
 *
 * Filtering hides whole sections that contain nothing matching, so choosing
 * "Web3" narrows the page rather than leaving gaps. The AI Projects section
 * shows three cards until asked for the rest, because sixteen at once is a
 * wall, not a showcase.
 */
function initBrowse() {
  /* ---- filters ---- */
  const filters = [...document.querySelectorAll<HTMLElement>(".filter")];
  const sections = [...document.querySelectorAll<HTMLElement>("section[id]")];

  function applyFilter(tag: string) {
    for (const sec of sections) {
      if (!sec.querySelector(".p")) continue;
      // tags ride on the wrapper as a comma list
      const tagged = [...sec.querySelectorAll<HTMLElement>(".p-wrap")];
      const hit = tagged.filter((w) =>
        (w.dataset.tags || "").split(",").map((t) => t.trim()).includes(tag)
      ).length;
      sec.hidden = tag !== "all" && hit === 0;
    }
    for (const f of filters) {
      const on = f.dataset.filter === tag;
      f.classList.toggle("is-on", on);
      f.setAttribute("aria-pressed", String(on));
    }
  }

  for (const f of filters) {
    f.addEventListener("click", () => applyFilter(f.dataset.filter || "all"));
  }

  /* ---- collapsible sections ---- */
  for (const grid of document.querySelectorAll<HTMLElement>("[data-collapsible]")) {
    const more = grid.querySelectorAll<HTMLElement>(".is-more");
    if (!more.length) continue;

    const btn = document.createElement("button");
    btn.className = "expand";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    const label = () =>
      `${more.length} more — show all ${more.length + 3}`;
    btn.textContent = label();
    grid.insertAdjacentElement("afterend", btn);

    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      grid.classList.toggle("is-open", !open);
      btn.textContent = open ? label() : "Show fewer";
    });
  }
}
