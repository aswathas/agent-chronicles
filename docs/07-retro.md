# 07 — Retro

**Date.** 2026-10-15

Written after the site shipped, not before.

## What worked

**Writing the reason into the commit message.** Every commit in this repository
explains why, not just what. "A truncated install command is worse than no install
command." "The skill bans generic body faces." "Knockback nudges y0 and is clamped,
so stacked hits cannot fling a villain off-screen." That is why this chronicle could
be written a day later without guessing — the reasoning was already committed
alongside the code.

**Deleting a whole subsystem in one commit.** `6ec1d81` removed the villain system,
its health, its knockback, its score HUD and its CSS in a single change, and put
the replacement in the same commit. No deprecation, no flag, no six-commit
de-increment. That is only possible when the feature is still young enough to delete
cheaply, which is an argument for deleting earlier.

**Letting the data drive the page.** Counts, filter chips and empty states all
derive from `projects.json`. Adding a project is a data change. Nothing about the
category system needs to be re-implemented when the collection grows.

**Honouring reduced motion from the first commit.** The terminal-console design
already declared it, before there was anything to animate. When the theme was
replaced and animation was added everywhere, the constraint was already in place.

## What did not work

**Building the combat loop at all.** Nine commits exist for a feature deleted in
one. Four were bug fixes that made it work correctly, and not one of those four
changed the decision to build it. The debugging was not evidence that the feature
was worth having. This is the single largest waste in the repository's history and
it was avoidable in one decision, at the point of `37584bf`.

**Shipping with no tests.** Six defects reached production and were found by
looking at the page. Three were the same mistake — an unbounded per-frame
accumulation in a `requestAnimationFrame` loop. That class of bug is caught by a
test that advances the frame count, and there is no such test.

**Two failures that review could not have caught.** Cards not navigating, and text
selection not working. Both looked correct in the diff. Both were only findable by
using the page. No static check and no unit test would have found either, which is
the uncomfortable part: the tests that would have helped most are the ones that
require driving a real browser.

**The theme swap mid-project.** Commit `6b767f5` replaced the entire visual
identity four commits in. The first four commits were on a design that was
discarded. Not fatal here, because the token structure survived the swap, but it is
four commits of building on a foundation that was about to be replaced.

## What would be done differently

**Decide the interaction model before building the interaction.** The combat loop
was four commits of work answering a question that had not been asked. The question
was "what does the reader do on this page?" and the answer turned out to be "read
it and open a repository." That was knowable before any code.

**Write the first test before the first `requestAnimationFrame` loop.** Not after.
The unbounded `y += vy` bug is a four-line test.

**Open the page once per feature, manually, before committing.** Two of the four
failures here were invisible to review and obvious in use. This costs nothing.

**Settle the visual direction first.** One design, chosen deliberately, rather than
a terminal console that is good and then a newspaper that is better, discovered at
commit five.

## What the next iteration should start with

**Tests.** Specifically, in priority order:

1. Cards navigate on plain click, and do not on Alt+click. This is the regression
   that shipped twice already in spirit — once as a bug, and the previous interaction
   model would have made it permanent.
2. The tether highlights exactly one section, the one under the pointer.
3. The edge alarm does not re-fire while the pointer sits inside the hysteresis
   band.
4. A frame-advance test on any loop that accumulates state.

**Then:** a second `impeccable` sweep, so the first one is a baseline rather than an
event.

**Then:** decide whether this page should exist separately from
`aswathas.github.io`, or merge back into it. Two portfolios for one person is a
maintenance cost, and the answer may change as the collection grows. This has not
been asked yet.