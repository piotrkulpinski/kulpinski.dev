import cloudflare from "@astrojs/cloudflare"
import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import { defineConfig } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  adapter: cloudflare({
    imageServiceSection: "cloudflare",
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
  site: process.env.SITE_URL || "http://localhost:4321",
  integrations: [tailwind({ applyBaseStyles: false }), react(), sitemap(), mdx()],
})
