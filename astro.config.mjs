// @ts-check
import cloudflare from "@astrojs/cloudflare"
import mdx from "@astrojs/mdx"
import preact from "@astrojs/preact"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  adapter: cloudflare(),
  markdown: {
    shikiConfig: { theme: "css-variables" },
    rehypePlugins: [[rehypeExternalLinks, { target: "_blank" }]],
  },
  env: {
    schema: {
      // Analytics, served through the `analytics-proxy` Cloudflare Worker on this
      // zone (*kulpinski.dev/e/* -> https://data.kulp.in), so the script and its
      // events are same-origin and survive ad-blockers.
      ANALYTICS_URL: envField.string({ context: "client", access: "public" }),
      ANALYTICS_TOKEN: envField.string({ context: "client", access: "public" }),
    },
  },
  site: process.env.SITE_URL || "http://localhost:4321",
  integrations: [sitemap(), mdx(), preact({ compat: true })],
  vite: { plugins: [tailwindcss()] },
})
