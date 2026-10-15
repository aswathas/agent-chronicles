# Attempt 003 — Parallel strands instead of a web pattern

**Opened.** 2026-10-15, commit `10f5e0e`.
**Closed.** 2026-10-15, commit `62e5e5d`. Superseded.

**Hypothesis.** Firing strands from off-screen bottom-centre as quadratic curves
whose control point droops, snapping taut on impact, would read as a web. Five
parallel strands plus cross-threads were chosen specifically to read as "woven silk
rather than a spider shape" — the intent was texture, not a literal web.

Components pin on click with a silk blob at the impact point. Click again to
release, click empty space to clear all.

**How we tested it.** Built and shipped. The gravity sag worked — the drooping
control point was the right idea, and it survived into the version that replaced
this one.

**What actually happened.** Five parallel strands read as woven silk, and woven silk
is not a spider web. There is no centre and no radial structure. At the moment of
impact the reader sees lines arriving, not a web forming. The pinned state made it
worse rather than better, because a "silk blob" of parallel strands is the one
image in this project with no visual referent at all.

The gravity sag was the salvageable part. Everything about the strand arrangement
was not.

**Outcome.** Superseded. `62e5e5d` replaced it with a real pattern at the impact
point: eleven bowed radial threads crossed by six spiral rings that wobble rather
than forming true circles, blooming outward on impact with each ring drawing in
sequence.

**Why we moved on.** A metaphor that has to be explained is a worse metaphor. Five
parallel lines says "fabric"; radial threads and rings say "web" at a glance, with
no caption.

**What this attempt is a reminder of.** The instinct to be literal is not always the
one that lands. The comment in `10f5e0e` says the parallel strands were chosen to
read as silk "rather than a spider shape" — that was a deliberate move away from
the recognisable thing, and it was the wrong move. When a visual shorthand has an
obvious, recognisable form, matching it is usually cheaper than inventing a subtler
one.

**Also carried forward.** The asymmetry in the replacement — full six rings for a
pinned web, partial for a thrown one — exists because this attempt established that
the *arrival* of the web matters as much as the resting shape. "The way a web
finishes after it sticks" is the phrase the successful version was built from.