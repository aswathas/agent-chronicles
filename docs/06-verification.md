# 06 — Verification

**Date.** 2026-10-15

## What passed

**The build.** `astro build` with `NODE_ENV=production` produces a static `dist/`
and the GitHub Pages workflow uploads and deploys it. Deep links hit `404.html`,
which redirects to the root.

**The accessibility pass.** `b8e0dc7` ran `pbakaus/impeccable`'s 59-rule detector and
took findings from 11 to 1. What it fixed is worth listing because it is the only
systematic verification this repository has ever had:

- `--grey` measured 3.8:1 against the cream ground, under the 4.5:1 AA floor
- thirteen functional labels sat at 8–10px, below the 11px legibility floor
- `.pj` entries were `<h4>` under an `<h2>`, skipping `h3`
- `cover-left` and the MCP cells had text flush against their bottom border
- added `:focus-visible`, `scroll-margin-top`, `touch-action`,
  `text-wrap: balance`, `tabular-nums` on figures, `theme-color`, `color-scheme`

**The one remaining detector finding was judged a false read and left alone.**

> "flat-type-hierarchy is a false read — the section headings are `clamp()` display
> sizes and h1/h2/h3 measure identically only after compression. Deliberate."

**Cards navigate.** After `1b24be5`, a plain click on a card reaches the repository,
and middle-click and ctrl-click work as the browser intends.

**Copy is above the overlay.** `7a4600e` fixed the mesh rendering at `z-index: 5`
over card text at `z-index: 2`, which made descriptions hard to read on dark cards.
Text now sits above the strands and the strands are lighter.

**Social handles are correct.** `6ea8a20` set LinkedIn to `aswathas11` and Instagram
to `aswath_ig`.

**Reduced motion is honoured from the first design commit**, before there was
anything to animate.

## What failed

**Every one of the six fixes in phase 4 was a shipped defect.** None of them were
caught before deploy. They are the record of what shipping without tests looks
like:

| Commit | What was broken in production |
|---|---|
| `d920006` | `.g.remove()` read `undefined` off an `SVGGElement` — every web survived a clear |
| `905e7bc` | The spider-sense flickered at the threshold |
| `26bcbc0` | The spider sigil rendered as escaped text, not an SVG |
| `c607eb3` | Villains were in the DOM at y≈4800px and never visible |
| `9d74e33` | `y += vy` diverged; villains drifted off-screen within seconds |
| `ff0dfb2` | Villains crossed the viewport in 22–42s; a duplicate spawn loop doubled the rate |

Three of these are the same class of mistake: an unbounded accumulation applied per
frame, in a `requestAnimationFrame` loop, with no clamp.

**Two whole subsystems shipped broken in ways no check would have caught.** Cards
did not navigate (`attempts/004`) and text selection did not work
(`attempts/002`). Both are invisible to a static review and to any test that does
not simulate a real pointer.

## Still untested

**There are no tests.** Not one. Nothing asserts that cards navigate, that the
filter chips filter, that the tether highlights the right section, that the
edge alarm fires once and not twice, or that reduced motion is actually honoured at
runtime. The entire verification record of this repository is: a build that
succeeds, one accessibility detector sweep, and manual use.

**The accessibility sweep is a single pass with no regression.** Running
`impeccable` twice is the minimum, and it was run once. The remaining false-positive
judgement has not been re-checked.

**Nothing was tested in a real browser during this documentation round.** Every
statement above is taken from commit messages written by the person who made the
change. None of it was independently reproduced. That includes the claim that cards
navigate.

**Cross-browser untested.** No Safari, Firefox, or Edge check is recorded.

**Touch untested.** `touch-action` was added by the detector sweep and `pointer:coarse`
handling is not recorded anywhere. This is a portfolio people will open on a phone.

**No performance measurement.** The page has a `requestAnimationFrame` loop for the
tether, an SVG-heavy web system, and no measurement of its cost.

**The build was not re-run during this round.** These files are documentation and
they do not affect the build, but the `dist/` in this repository's history is from
the last real change, not from now.