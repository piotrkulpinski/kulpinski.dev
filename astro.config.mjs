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
    drafts: true,
    shikiConfig: { theme: "css-variables" },
    rehypePlugins: [[rehypeExternalLinks, { target: "_blank" }]],
  },
  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true,
  },
  env: {
    schema: {
      MAILERLITE_API_TOKEN: envField.string({ context: "server", access: "secret" }),
    },
  },
  site: process.env.SITE_URL || "http://localhost:4321",
  integrations: [tailwind({ applyBaseStyles: false }), sitemap(), mdx(), preact()],
})
