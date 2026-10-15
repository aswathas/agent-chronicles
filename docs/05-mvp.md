# 05 — MVP scope

**Date.** 2026-10-15

## What the MVP does

- **One page.** `src/pages/index.astro`. No routing, no detail views. Every project
  opens its repository.
- **A curated catalogue** in `src/data/projects.json`. Not generated from the GitHub
  API. Adding a project is a data change with no markup edit — counts, nav chips and
  empty states all derive from the file.
- **Categories with client-side filters.** Including categories that are declared but
  empty, which render a dashed placeholder rather than disappearing. The roadmap is
  meant to be visible.
- **A newspaper visual identity.** Halftone texture, masthead nameplate, ticker,
  double-rule section headers, Cormorant Garamond.
- **Web-shooting on hover.** A real pattern at the impact point — eleven radial
  threads, six spiral rings — blooming outward.
- **Web navigation.** One tether lit at a time, from pointer to the heading of the
  section under the cursor.
- **Spider-sense edge alarm** with hysteresis: 110px to arm, 150px to hold.
- **Static deployment to GitHub Pages** with a 404 redirect for deep links.
- **Reduced-motion honoured throughout**, including from the very first design
  commit, before there was anything to animate.

## What the MVP deliberately does not do

Every exclusion below is a decision, with its reason. None of these are oversights
waiting to be re-added.

- **No project detail pages.** Every card opens the repository. A detail page would
  duplicate the repo README and would be a second thing to keep true.

- **No live GitHub stars.** The sibling site reads the API at request time through a
  Cloudflare edge function. GitHub Pages cannot run edge functions. Fetching at
  build time would bake in a number that goes stale and quietly lies.

- **No tests.** Nothing asserts the behaviour of this page. This is the largest
  known gap and it was accepted for v1, not overlooked. See `06-verification.md`.

- **No custom cursor.** Built, then removed. `attempts/002`.

- **No villain or combat system.** Built, then removed. `attempts/001`.

- **No dark mode.** The newspaper identity is a light-paper design. A dark variant
  would be a different design, not a palette swap.

- **No search.** The sibling site has one, backed by tests. The catalogue here is
  small enough to filter with category chips.

- **No analytics.** Nothing measures whether anyone reads it.

## What is excluded because it cannot be done here

- **Anything requiring a server.** Static output only.
- **Edge functions, worker-side API calls, or request-time rendering.** See the
  live-stars exclusion above; the same constraint blocks it.