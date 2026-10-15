# 04 — Plan

**Date.** 2026-10-15

Locked as executed. This file records the plan the twenty-six commits actually
followed, not a plan that was written before them and then discovered to be
fiction.

## Phase 1 — Scaffold and content (commits `22ad023` → `bf3d472`)

Astro 5, static output, no framework, no UI library. Terminal-console design
tokens. Base layout with OG meta and font loading. A curated `projects.json`.
Portfolio page with client-side category filters where counts, chips and empty
states all derive from the data file. README covering content editing and deploy
paths. Dependency tree locked.

Delivered: a working, filterable catalogue page. It looked like a terminal.

## Phase 2 — The theme swap (commit `6b767f5`)

Terminal console replaced wholesale with the Agent Chronicles newspaper:
halftone, masthead nameplate, ticker, double-rule headers, Cormorant Garamond.

Delivered: the visual identity the repository is now named for.

## Phase 3 — Interaction, first pass (`10f5e0e` → `437993d`)

Web-shooting with gravity sag. Villains with health and score. Spider-sense edge
alarm with the sigil glyph.

Delivered: more than was wanted. Two of these three subsystems were removed within
a day.

## Phase 4 — Fix what the first pass broke (`d920006` → `ff0dfb2`)

Five fixes, each with a specific cause:

| Commit | Cause |
|---|---|
| `d920006` | `stuck` maps to the `<g>` node, so calling `.g.remove()` read `undefined` off an `SVGGElement` — every web survived a clear |
| `905e7bc` | The 78px edge band was too tight and flickered; 110px to arm, 150px to hold |
| `26bcbc0` | `sigil()` returned a string that Astro escaped; wrapped in `set:html` |
| `c607eb3` | `position:fixed` with no offsets stays at static position, so villains sat ~4800px down the document, in the DOM and invisible |
| `9d74e33` | `y += vy` compounded every frame without bound; villains drifted thousands of pixels off. Now `y0 + sin(phase) * bobAmp` |
| `ff0dfb2` | 0.55–1.05 px/frame crossed a 1400px viewport in 22–42s, so villains drifted past unnoticed. Also `scheduleNext` recursed from removal handlers, spawning a second loop and doubling the rate |

## Phase 5 — Deploy (commit `02a23e0`)

GitHub Pages workflow, `NODE_ENV=production` for the base path,
`upload-pages-artifact`, `deploy-pages`, and a `404.html` that redirects deep
links to the root.

## Phase 6 — Reverse the wrong turn (`6ec1d81`)

Combat loop deleted. Web navigation built.

Delivered: the decision this repository is actually about.

## Phase 7 — Close the collection (`c596506` → `6ea8a20`)

`Shipped` category added for apps with a window — Clipper, AI Brain Desktop, OLX
India web app — placed after CLI, since it is what the tools become. Then the two
fixes that mattered: card links (`1b24be5`, `7a4600e`) and the accessibility pass
(`b8e0dc7`). Social handles corrected (`6ea8a20`).

## What this plan deliberately excluded

- No framework, no UI library. The second commit says it outright.
- No tests. Nothing in this repository asserts anything about its behaviour.
- No analytics, no live star counts. The sibling site reads the GitHub API at
  request time; this one does not, because GitHub Pages cannot run the edge
  function that does it.