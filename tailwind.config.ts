import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"
import plugin from "tailwindcss/plugin"

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    colors: {
      primary: "hsl(var(--color-primary) / <alpha-value>)",
      background: "hsl(var(--color-background) / <alpha-value>)",
      muted: "hsl(var(--color-muted) / <alpha-value>)",
      secondary: "hsl(var(--color-secondary) / <alpha-value>)",
      foreground: "hsl(var(--color-foreground) / <alpha-value>)",
      border: "hsl(var(--color-border) / <alpha-value>)",
      success: "hsl(var(--color-success) / <alpha-value>)",
      error: "hsl(var(--color-error) / <alpha-value>)",
    },
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),

    plugin(({ addVariant }) => {
      addVariant(
        "prose-inline-code",
        "&.prose :where(:not(pre)>code):not(:where([class~='not-prose'] *))",
      )
    }),
  ],
} satisfies Config
