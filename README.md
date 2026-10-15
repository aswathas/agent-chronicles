# aswathas-ai

> Agent systems, skills, CLI tools and courses by Aswath S.

Static portfolio site built with [Astro](https://astro.build). Terminal-console
visual language — the site looks like the kind of thing it documents.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # serve the built output
```

## Editing content

**All site content lives in `src/data/projects.json`.** You never need to touch
the markup to add, remove, or reorder a project.

```jsonc
{
  "name": "my-project",
  "lang": "TypeScript",      // shown as a badge
  "desc": "One or two sentences.",
  "url": "https://github.com/aswathas/my-project",
  "install": "npx skills add ...",   // optional, renders a copyable block
  "status": "live"                    // optional badge: live | building
}
```

Adding a category means adding an object to `categories`. The nav chips, the
counts, and the empty states all derive from that array — nothing else to update.

## Structure

```
src/
├── data/projects.json    ← all content lives here
├── layouts/Base.astro    ← head, fonts, meta
├── pages/index.astro     ← hero, filters, category grid, styles
└── styles/global.css     ← tokens, resets, base type
```

## Categories

| # | Category | State |
|---|----------|-------|
| 1 | Skills | 9 published |
| 2 | CLI & Tools | 4 |
| 3 | Products | 1 |
| 4 | Agents | 1 |
| 5 | MCP Servers | empty — next build |
| 6 | Plugins | empty |
| 7 | Courses | 2 |

Empty categories render a dashed placeholder rather than disappearing, so the
roadmap is visible. Fill them in and the dashed box goes away on its own.

## Deploy

Static output, no server needed. Works on Vercel, Netlify, GitHub Pages, or
Cloudflare Pages with no config.

```bash
npm run build
# deploy dist/
```

On Vercel: import the repo, framework is detected as Astro, done.