import cloudflare from "@astrojs/cloudflare"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import { defineConfig } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"

import preact from "@astrojs/preact"

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  adapter: cloudflare({
    imageServiceSection: "cloudflare",
    platformProxy: {
      enabled: true,
    },
  }),
  markdown: {
    drafts: true,
    shikiConfig: { theme: "css-variables" },
    rehypePlugins: [[rehypeExternalLinks, { target: "_blank" }]],
  },
  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true,
  },
  vite: { ssr: { external: ["node:buffer"] } },
  site: process.env.SITE_URL || "http://localhost:4321",
  integrations: [tailwind({ applyBaseStyles: false }), preact(), sitemap(), mdx()],
})
