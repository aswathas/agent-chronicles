// Guards the two defects this site actually shipped, plus the accessibility
// floor, from the build output rather than from a DOM.
//
// The repo has no test setup and no DOM dependency, and adding one is a larger
// change than the problem needs. Both shipped defects are visible in the built
// artefacts, so that is where they are checked.
//
// Run: npx astro build && node --test test/build.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const html = readFileSync(`${dist}index.html`, 'utf8');
const css = readdirSync(`${dist}_astro`)
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(`${dist}_astro/${f}`, 'utf8'))
  .join('\n');

test('cards are real links', () => {
  // The shipped bug: every card was an <a href>, and a click handler called
  // preventDefault() on all of them, so no card ever navigated.
  const external = html.match(/<a [^>]*href="https?:\/\/[^"]*"[^>]*>/g) ?? [];
  assert.ok(external.length > 10, `expected many outbound links, found ${external.length}`);

  for (const a of external) {
    assert.match(a, /href="https?:\/\/[^"]+"/, `malformed anchor: ${a}`);
    assert.ok(!a.includes('href="#"'), `placeholder href shipped: ${a}`);
  }
});

test('no anchor has an empty or placeholder destination', () => {
  const anchors = html.match(/<a [^>]*>/g) ?? [];
  for (const a of anchors) {
    const href = /href="([^"]*)"/.exec(a)?.[1];
    if (href === undefined) continue; // hash-only navigation is fine
    assert.ok(href.trim().length > 0, `empty href: ${a}`);
  }
});

test('the custom cursor stays removed', () => {
  // Removed in 1b24be5: a 12px dot over text-heavy copy was worse than the
  // native pointer and it broke text selection. `cursor: none` is what took
  // the selection affordance away.
  assert.ok(!/cursor:\s*none/.test(css), 'cursor:none must not return — it breaks text selection');
  assert.ok(!/cursor:\s*none/.test(html), 'cursor:none must not return in inline styles');
});

test('no script cancels navigation on a card link', () => {
  // The class of bug behind the shipped defect: preventDefault() applied
  // blanketly to elements that are already links.
  const scripts = readdirSync(`${dist}_astro`)
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(`${dist}_astro/${f}`, 'utf8'))
    .join('\n');
  const blanket = scripts.match(/addEventListener\(\s*['"]click['"][^)]{0,400}preventDefault/g) ?? [];
  for (const hit of blanket) {
    // Allowed only if the handler is scoped to a modifier key, which is how a
    // pinned web is added without taking the link away.
    assert.ok(
      /altKey|metaKey|ctrlKey|shiftKey/.test(hit),
      `click handler cancels navigation with no modifier guard: ${hit.slice(0, 120)}`,
    );
  }
});

test('inline code meets the 11px legibility floor', () => {
  // b8e0dc7 raised thirteen functional labels that sat at 8-10px. Decorative
  // glyphs are allowed below the floor — `.burst span` at 8px is a particle
  // effect, not text anyone reads — but inline code inside a project paragraph
  // is read. It was left at 10px.
  const rule = /\.p code\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
  const px = Number(/font-size:\s*(\d+(?:\.\d+)?)px/.exec(rule)?.[1] ?? 0);
  assert.ok(px > 0, '.p code rule not found — the test needs updating if the selector changed');
  assert.ok(px >= 11, `inline code is ${px}px, under the 11px legibility floor`);
});

test('focus is visible', () => {
  assert.match(css, /:focus-visible/, 'the site must keep a :focus-visible style');
});

test('reduced motion is still honoured', () => {
  // The guard lives in the bundled script here, not in the stylesheet, so both
  // have to be searched.
  const js = readdirSync(`${dist}_astro`)
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(`${dist}_astro/${f}`, 'utf8'))
    .join('\n');
  assert.match(
    css + js,
    /prefers-reduced-motion/,
    'reduced-motion guards must not be removed',
  );
});

test('the 404 page redirects deep links to the root', () => {
  // Required because GitHub Pages has no server-side routing, and the base path
  // means a project URL is not the root. Implemented as a meta refresh, which
  // works where the platform serves the 404 document directly.
  const notFound = readFileSync(`${dist}404.html`, 'utf8');
  assert.match(
    notFound,
    /http-equiv="refresh"/,
    '404.html must redirect deep links back to the root',
  );
});
test('no card nests one anchor inside another', () => {
  // Cards carry a Source and a Live destination. Nesting anchors is invalid
  // HTML and breaks both links, so the card must stay a div with two siblings.
  const html = readFileSync(`${dist}index.html`, 'utf8');
  assert.equal(/<a[^>]*>(?:(?!<\/a>)[\s\S])*<a\s/.test(html), false,
    'no <a> may contain another <a>');
});
