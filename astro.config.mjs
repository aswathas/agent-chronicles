import { defineConfig } from "astro/config";

// Pages serves this from https://aswathas.github.io/agent-chronicles/, so the
// production build needs the /agent-chronicles prefix. Local dev must NOT have
// it, or every asset request 404s against a dev server rooted at /.
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  site: "https://aswathas.github.io",
  ...(isProd ? { base: "/agent-chronicles" } : {}),
  build: { format: "directory" },
});