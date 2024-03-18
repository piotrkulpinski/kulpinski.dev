import { defineConfig } from "astro/config"
import tailwind from "@astrojs/tailwind"
import sitemap from "@astrojs/sitemap"
import mdx from "@astrojs/mdx"
import preact from "@astrojs/preact"

import cloudflare from "@astrojs/cloudflare"

// https://astro.build/config
export default defineConfig({
  output: "hybrid",
  adapter: cloudflare({
    imageServiceSection: "cloudflare",
  }),
  markdown: {
    drafts: true,
    shikiConfig: {
      theme: "css-variables",
    },
  },
  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true,
  },
  site: "https://kulpinski.dev",
  integrations: [tailwind(), sitemap(), mdx(), preact()],
})
