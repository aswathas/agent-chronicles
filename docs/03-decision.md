# 03 — Decision

**Date.** 2026-10-15

Six decisions. For each, what was chosen and — the part that matters — what
specifically ruled out the alternative.

## The interactive layer is navigation, not combat

**Chosen.** `6ec1d81`, "replace the combat loop with web navigation". The villain
system — spawn, health, knockback, score HUD and all their CSS — was deleted in
one commit. Nothing attacks the reader. Instead, each section has a tether path,
and whichever section holds the cursor gets a red silk strand running from the
pointer to its heading.

### What ruled the alternative out

Not that the combat loop was ugly, and not that it was too expensive. It was that
it made the page hostile.

A villain that drifts in from the right and takes damage when clicked is a
mechanic that requires the reader to participate in it. The reader's actual goal is
to evaluate the work. Every click the combat loop captured was a click that did not
open a project. The theme was consuming the one interaction the page existed to
enable.

The replacement is not a consolation prize. Because sections tile the page, exactly
one tether is lit at a time, which means the web doubles as a position indicator —
you can always see which part of the page you are attached to. The thing that
replaced the decoration does more work than the decoration did.

### What would change this decision

If the collection grows categories large enough that a reader cannot see the whole
page at once, the single-lit-tether property weakens, because more than one section
could plausibly hold the cursor. At that point the tether needs a different way to
signal position.

## A real web pattern, not parallel strands

**Chosen.** `62e5e5d`. Eleven bowed radial threads crossed by six spiral rings that
wobble rather than forming true circles, blooming outward on impact, each ring
drawing in sequence. Pinned webs get all six rings; thrown webs land partial.

### What ruled the alternative out

Five parallel strands with cross-threads read as woven silk. They do not read as a
spider web — there is no centre, no radial structure, nothing that survives being
recognised at a glance.

The detail that makes the new version work is the asymmetry: full rings for a pin,
partial for a throw. "The way a web finishes after it sticks" is the reason it
reads as silk rather than as an SVG icon.

### What would change this decision

Nothing foreseeable. If the effect is ever templated or randomised, the ring count
and thread count are the parameters to vary.

## No custom cursor

**Chosen.** `1b24be5` removed `cursor:none` and the custom cursor entirely.

> "A 12px dot over text-heavy copy was worse than the native pointer, and it broke
> text selection."

### What ruled the alternative out

Two concrete failures, both discovered by using it rather than by reasoning about
it.

A 12px dot following the cursor over dense prose is worse than the OS pointer,
which knows things the dot does not — resize edges, text cursors, scrollbars. And
hiding the native cursor breaks text selection, which is a capability of the page,
not a flourish.

This decision is worth revisiting only if the site moves to long-form prose, where
the trade is different from a card grid.

## Every card is a link, and the link wins

**Chosen.** `1b24be5`. Webbing became hover decoration. Plain clicks fall through
to the link. Alt+click pins a web. Escape clears every pin.

### What ruled the alternative out

Every card was already an `<a href>`. The click handler called `preventDefault()`
on all of them, so no card link ever navigated — which is why cards were not
opening. There was no version of "card click fires a web shot" that did not
require either breaking the link or inventing a modifier nobody would discover.

Alt+click is a real, learnable, low-cost alternative. It also does not fight
middle-click or ctrl-click, both of which the broken version had broken.

### What would change this decision

Nothing. A link that does not navigate is not a design decision.

## Deploy to GitHub Pages, not Cloudflare

**Chosen.** `02a23e0`. Astro build with `NODE_ENV=production` so
`astro.config.mjs` applies the `/agent-chronicles` base path, then
`upload-pages-artifact` and `deploy-pages`, with a `404.html` that redirects deep
links back to the root.

### What ruled the alternative out

Not recorded, honestly. No commit or comment states why this repo is on GitHub
Pages while `aswathas.github.io` is on Cloudflare Pages. The base-path handling and
the 404 redirect are consequences of the choice, not reasons for it.

This is the weakest decision record in the set, and it is left that way rather than
reconstructed into a confident-sounding rationale after the fact.

### What would change this decision

Nothing about the choice is wrong. But if this repository ever needs edge
functions — the sibling site uses one to read the GitHub API at request time for
live star counts — GitHub Pages will not run them, and the choice becomes a real
constraint rather than a preference.

## The catalogue is curated, not generated

**Chosen.** `acb11af`. Only the agentic work, skills and CLI leading. MCP and
Plugins are present but empty, rendering a dashed placeholder so the roadmap is
visible and fills in later.

### What ruled the alternative out

The sibling site generates from the GitHub API and lists seven of seventy-one. Here
the argument depends on the subset being the point. A generated list cannot express
"these are the ones that matter" — it can only express "these exist".

Counts, nav chips and empty states all derive from `projects.json`, so adding a
project needs no markup change. The curation is in the data, not the template.

### What would change this decision

If the collection grows past roughly thirty entries, the page stops being a
portfolio and starts being an index, and an index should probably be generated.