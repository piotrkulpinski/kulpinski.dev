// @ts-check
import { writeFile } from "node:fs/promises"
import mdx from "@astrojs/mdx"
import preact from "@astrojs/preact"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"

// The Highseat proxy path. The script tag loads the tracker from it, and the Pages Function in
// `functions/[path].ts` answers it at runtime from the same variable.
const { HIGHSEAT_PATH } = process.env

/**
 * Writes the Pages `_routes.json` that runs the proxy function on the proxy path alone, so every
 * other request is served as a static asset without invoking a function.
 */
function highseatRoutes() {
  return {
    name: "highseat-routes",
    hooks: {
      /** @param {{ dir: URL }} options */
      "astro:build:done": async ({ dir }) => {
        if (!HIGHSEAT_PATH) return
        const routes = { version: 1, include: [HIGHSEAT_PATH], exclude: [] }
        await writeFile(new URL("_routes.json", dir), JSON.stringify(routes, null, 2))
      },
    },
  }
}

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  markdown: {
    shikiConfig: { theme: "css-variables" },
    rehypePlugins: [[rehypeExternalLinks, { target: "_blank" }]],
  },
  env: {
    schema: {
      // Highseat analytics, loaded from the site's own proxy path (see `functions/[path].ts`).
      HIGHSEAT_SITE: envField.string({ context: "client", access: "public" }),
      HIGHSEAT_PATH: envField.string({ context: "client", access: "public", startsWith: "/" }),
    },
  },
  site: process.env.SITE_URL || "http://localhost:4321",
  integrations: [sitemap(), mdx(), preact({ compat: true }), highseatRoutes()],
  vite: { plugins: [tailwindcss()] },
})
