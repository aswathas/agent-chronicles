# 01 — The problem

**Date.** 2026-10-15

## What was missing

There were two portfolios and neither one was right for this work.

`aswathas.github.io` existed and was good — a macOS desktop simulation, an Astro
build on Cloudflare Pages. But its project list is generated from the whole GitHub
account and it had seven entries out of seventy-one repositories. It says
"AI Developer". It does not say *agentic*.

The other half of the problem was that the actual work had no argument. The
repository catalogue existed, the skills were built, the CLI tools existed. There
was no page anywhere that said what the through-line was, and no reason for
someone to keep reading past the first screen.

The first commit that names this directly:

> `feat(data): catalogue of agentic projects`
> "Only the agentic work, not the whole account. Skills and CLI lead because that
> is the actual emphasis. MCP and Plugins are present but empty - they render a
> dashed placeholder so the roadmap is visible and they fill themselves in later."

## What it cost

Every share of the work was a link to a repo with no frame around it. A visitor
arriving from a LinkedIn post saw a commit message, not a body of work. There was
no place where the skills, the CLI tools and the forensics work sat next to each
other and added up to something.

The cost of not fixing it is not a broken page. It is that the portfolio reads as
a list of unrelated repositories.

## Two requirements that were not obvious at the start

Both were discovered by building, not by planning, and both are recorded in
`attempts/`.

**The page must not be hostile.** The obvious Spider-Man treatment — villains,
combat, damage — attacks the reader. Commit `37584bf` built exactly that: six
villains that drift in and take damage from clicks, with a health bar and a score
HUD. It was removed entirely nine commits later.

**The links must work.** This sounds trivial and was not. The card click handler
called `preventDefault()` on every card, so no card link ever navigated. It is
recorded in `attempts/004`.

Neither of these was a stated requirement. Both were discovered by shipping a page
and watching it fail.