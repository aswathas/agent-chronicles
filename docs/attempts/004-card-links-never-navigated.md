# Attempt 004 — Card click fires a web shot

**Opened.** 2026-10-15, alongside the first web-shooting system.
**Closed.** 2026-10-15, commit `1b24be5`. Abandoned.

**Hypothesis.** Every card is already an `<a href>` pointing at a repository. Rather
than navigating on a plain click, fire a web shot at the card — the link becomes
the trigger for the effect, and navigation takes over on a modifier.

**How we tested it.** Shipped it. The web shot fired on click. The link did not
navigate.

**What actually happened.** The click handler called `preventDefault()` on every
card. The href was correct the whole time and had been the whole time — but the
handler cancelled it before the browser acted on it.

The symptom that surfaced it was not a bug report from a user. It was noticing that
the cards were not opening, and then the specific question of why: **cards weren't
opening.** Every card, every time, on plain click.

Worse than the visible symptom was what it took from the reader. Middle-click and
ctrl-click, which are how people open a link in a background tab, were broken the
same way — the handler did not distinguish them.

**Outcome.** Abandoned. Webbing became hover decoration. Plain clicks fall through
to the link. Alt+click pins a web on a card. Escape clears every pin.

**Why we moved on.** There was no version of "card click fires a web shot" that did
not either break the link or hide the interaction behind a modifier nobody would
discover. And the modifier that survives — Alt+click — costs nothing on a plain
click, which is the interaction the page exists to support.

**What this attempt is a reminder of.** `preventDefault()` on an element that is
already a link is almost always a mistake, because it is silently cancelling the
element's only reason for existing. The href was right; the handler made it a lie.

The general form: when an element is both a control and a link, decide which one it
is, and let the other be decoration. Do not have the control quietly break the link.

**How it was found.** By using the page, not by reading the code. The handler looked
defensible in review — it was doing something visible, and doing it correctly. This
is the second attempt in this repository whose failure was invisible to review and
visible only in use. The first was the custom cursor, which broke text selection.