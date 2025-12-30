// @ts-check
import cloudflare from "@astrojs/cloudflare"
import mdx from "@astrojs/mdx"
import preact from "@astrojs/preact"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
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
      PLAUSIBLE_DOMAIN: envField.string({ context: "client", access: "public" }),
      PLAUSIBLE_URL: envField.string({ context: "client", access: "public" }),
    },
  },
  site: process.env.SITE_URL || "http://localhost:4321",
  integrations: [tailwind({ applyBaseStyles: false }), sitemap(), mdx(), preact()],
})
