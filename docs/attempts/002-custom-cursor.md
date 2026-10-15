# Attempt 002 — Custom cursor with `cursor: none`

**Opened.** 2026-10-15.
**Closed.** 2026-10-15, commit `1b24be5`. Abandoned.

**Hypothesis.** The page is a Spider-Man newspaper. Replacing the OS pointer with a
small web-shooter dot would complete the illusion and make the page feel authored
rather than styled.

**How we tested it.** Built it, with `cursor: none` on the document and a custom
element tracking the pointer.

**What actually happened.** Two failures, neither of which was visible from reading
the code.

**It was worse than the native pointer.** A 12px dot over text-heavy copy is a
regression in usability, not a stylistic upgrade. The OS cursor carries information
a dot cannot: resize edges, text I-beam cursors, scrollbar affordances. Every place
the dot was wrong was a place the real cursor was right.

**It broke text selection.** Hiding the native cursor took the selection affordance
with it. Selecting the project descriptions — the one piece of copy on the page a
visitor might actually want to keep — stopped working.

Both failures are only findable by using the page. Neither appears when reviewing
the diff.

**Outcome.** Abandoned. `cursor: none` and the custom cursor removed entirely in
`1b24be5`.

**Why we moved on.** A custom cursor is a site-wide decision made for the sake of
one interaction. It degrades text selection everywhere and it competes with the
platform on a task the platform is better at. The web-shooting already delivers the
theme — on hover, where it is decoration and costs the reader nothing.

**What this attempt is a reminder of.** Theme expressed through something the
reader can interact with costs more than theme expressed through something they
merely watch. The same Spider-Man reading is available in the web patterns, the
tether, and the edge alarm — none of which take anything away from the reader.

**If you are about to try this again:** the test is not "does it look good in a
screenshot". Open the page, try to select a paragraph, then try to grab a resize
edge. If either is harder than on any other site, the cursor is too expensive.

**Note for the sibling repository.** `aswathas.github.io` has the same question open
in `docs/attempts/003-spider-man-cursor-effect.md`. This attempt is the answer for
the same effect on a different page, and it should be read before that one is
built.