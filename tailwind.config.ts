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
    },
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }],
      sm: ["0.875rem", { lineHeight: "1.5rem" }],
      base: ["1rem", { lineHeight: "1.75rem" }],
      lg: ["1.125rem", { lineHeight: "2rem" }],
      xl: ["1.25rem", { lineHeight: "2rem" }],
      "2xl": ["1.5rem", { lineHeight: "2rem" }],
      "3xl": ["2rem", { lineHeight: "2.5rem" }],
      "4xl": ["2.5rem", { lineHeight: "3rem" }],
      "5xl": ["3rem", { lineHeight: "3.5rem" }],
    },
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        display: ["Inter", ...defaultTheme.fontFamily.sans],
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
