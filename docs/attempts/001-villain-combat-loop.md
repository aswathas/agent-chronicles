# Attempt 001 — Villain combat loop

**Opened.** 2026-10-15, commit `37584bf`.
**Closed.** 2026-10-15, commit `6ec1d81`. Abandoned.

**Hypothesis.** A Spider-Man portfolio should feel like Spider-Man. Villains that
drift in from the right, take damage on click, drain a health bar across three
hits and increment a score HUD would give the page a game in it.

**How we tested it.** Built it and shipped it. Six villains with distinct
silhouettes, spawning after the reader scrolls past the fold, on a sine bob. Each
hit knocks them back and drains health; three hits kills. Hit-testing via
`getBoundingClientRect` rather than raw transform coordinates, because transform Y
is document-space while pointer events are viewport-space — that one was correct
from the start.

Three follow-up fixes followed quickly, and each was a real bug rather than a
polish item:

- `c607eb3` — `position: fixed` with no offsets stays at static position. Villains
  appended to `body` sat ~4800px down the document. They existed in the DOM and were
  never visible.
- `9d74e33` — `y += vy` compounded every frame with no bound, drifting villains
  thousands of pixels away within seconds. Changed to `y0 + sin(phase) * bobAmp`,
  which oscillates and cannot diverge. Knockback nudges `y0` and is clamped.
- `ff0dfb2` — 0.55–1.05 px/frame crossed a 1400px viewport in 22–42s, so villains
  drifted past unnoticed. Raised to 1.8–3.4 px/frame, about 7s across. Also found
  `scheduleNext` was recursing from removal handlers, spawning a second parallel
  loop and doubling the rate.

**What actually happened.** All three fixes worked. The villains were visible, fast
enough to notice, and correctly positioned. The mechanic functioned exactly as
built.

It was still wrong.

The page had become a game that the reader did not choose to play. Every click the
combat loop captured was a click that did not open a project, and opening projects
is the only reason the page exists. The health bar and score HUD were interface for
a game with no score the reader cared about. And the whole loop consumed a day of
fixes — three commits chasing entities that were then deleted in one.

**Outcome.** Abandoned. Spawn, health, knockback, score HUD and their CSS removed in
`6ec1d81`.

**Why we moved on.** The theme was eating the one interaction the page existed to
enable. The replacement — web navigation — was built in the same commit and does
more: because sections tile the page, exactly one tether is lit at a time, which
makes the decoration a position indicator.

**What this attempt is a reminder of.** A feature can be correctly implemented and
still be wrong. Three of the four commits after this one were bug fixes that made a
feature work properly, and none of them changed the decision to build it. Debugging
harder is not evidence that the thing is worth having.

**If you are about to try this again:** do not. The reasoning is that a portfolio's
job is to be read.