# 02 — Options considered

**Date.** 2026-10-15

Four decisions were open in one sitting. Each had at least one option that was
built, tried, and then thrown away. Those are recorded here as carefully as the
ones that survived, because the thrown-away ones are where the reasoning is.

## What visual language should the collection use

### Option A — terminal console

The first design, and it shipped. A dark palette on `#0d1117`, a single green
accent, JetBrains Mono for UI and Inter for prose, a CRT scanline overlay.

From `a0f1aee`:

> "Dark palette on #0d1117 with a single green accent... CRT scanline texture is a
> fixed non-interactive overlay so it never blocks clicks. Honours
> prefers-reduced-motion."

The care taken in that first design — a non-interactive overlay so it cannot eat
clicks, and reduced-motion honoured from the first commit — is worth noting. The
click bug later in this repository came from a different layer, not this one.

**Built. Kept for four commits. Then replaced.**

### Option B — the Agent Chronicles newspaper

A Spider-Man newspaper: halftone printing texture, masthead nameplate, ticker,
double-rule section headers, Cormorant Garamond replacing Inter.

From `6b767f5`:

> "Swaps the terminal-console design for a Spider-Man newspaper... Cormorant
> Garamond replaces Inter — the skill bans generic body faces."

This is the one that shipped.

### Option C — extend the existing macOS site instead

The `aswathas.github.io` repo was already a portfolio. Building a second one is
duplicative on its face.

**Never built.** The reason is visible in the data: the existing site lists seven
projects out of seventy-one, drawn from the whole account. This repository's
entire reason for existing is a curated subset. Same audience, different argument —
which is a real reason for a separate site, but it was never written down at the
time and is reconstructed here from the two codebases rather than from a decision
anyone recorded.

## What should the interactive layer do

This is the decision with the most dead ends.

### Option A — parallel strands

From `10f5e0e`, the first web system:

> "Five parallel strands plus cross-threads read as woven silk rather than a
> spider shape."

Fired from off-screen, quadratic curves with a drooping control point, snapping
taut on impact.

**Built. Shipped. Then superseded** by option B, because five parallel strands do
not read as a spider web. See `attempts/003`.

### Option B — a real web pattern at the impact point

From `62e5e5d`:

> "Each shot now ends in a pattern at the target: eleven bowed radial threads
> crossed by six spiral rings that wobble rather than forming true circles. It
> blooms outward on impact, each ring drawing in sequence. Pinned webs use a full
> six rings; thrown webs land partial, the way a web finishes after it sticks."

**Chosen. This is what shipped.**

### Option C — a combat loop

From `37584bf`:

> "Six villains with distinct silhouettes drift in from the right, on a sine bob,
> after the reader scrolls past the fold. Each hit knocks them back and drains a
> health bar; three hits kills and increments the score HUD."

**Built. Shipped. Then deleted entirely.** See `attempts/001`.

### Option D — the web as navigation rather than as decoration

From `6ec1d81`, the commit that removed option C:

> "The web is now the navigation. Every section gets a tether path; whichever
> section holds your cursor gets a red silk strand running from the pointer to its
> heading, sagging under its own weight. Because sections tile the page, exactly
> one tether is lit while you are reading, which doubles as a position indicator:
> you can always see which part you are attached to."

**Chosen.** This is the decision that turned a theme into a tool.

### Option E — a custom cursor

A `cursor:none` replacement, a web-shooter dot following the pointer.

**Built. Then removed.** See `attempts/002`.

## Where should this deploy

### Option A — Cloudflare Pages, like the existing site

Consistent with `aswathas.github.io`.

**Not chosen.** No reason was recorded at the time.

### Option B — GitHub Pages, from the repo

From `02a23e0`:

> "Astro build with NODE_ENV=production so astro.config.mjs applies the
> /agent-chronicles base path, then upload-pages-artifact and deploy-pages.
> 404.html redirects deep links back to the root."

**Chosen.** The base path and the 404 redirect exist specifically because a
project page is not the root and GitHub Pages has no server-side routing.

## What the interaction model should be

### Option A — every card click fires a web shot

The obvious one. It is also the bug.

**Built. Removed** in `1b24be5`. See `attempts/004`.

### Option B — webbing is hover decoration; Alt+click pins

From `1b24be5`:

> "Webbing is now hover decoration only; plain clicks fall through to the link so
> middle-click and ctrl-click behave normally. Alt+click pins a web on a card,
> Escape clears every pin."

**Chosen.**