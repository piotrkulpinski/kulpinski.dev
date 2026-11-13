# Site redesign

Approved 2026-11-13. Inspired by piotrpasztor.com: dithered elements, mono labels, one accent per section. The system is borrowed, the page is not cloned.

## Visual system

- Type: Inter for body (15px), Geist Mono for labels, dates, the clock and chips. Labels are 11px, uppercase, wide tracking. Weights 400 and 500 only.
- Tokens: `bg`, `ink`, `dim`, `faint`, `line`, with light and dark values.
- Accents: Now is orange, Products is teal, Writing is green, Contact is pink. Each has a soft variant for dithered highlights. Pink comes from the portrait's shirt.
- Layout: one column about 640px wide. Sections use a 128px label column on wider screens and stack on phones.
- Theme: follows the system by default. The clock toggles it, the choice lives in `localStorage`, and an inline head script applies it before first paint. `--section` carries the accent into hover states.
- Motion: portrait print-in, highlight reveals, arrow nudge. All off under `prefers-reduced-motion`.

## Dither engine

Plain TypeScript custom elements, so they survive the Astro client router without re-init code and ship no framework.

- `<dither-portrait>`: draws the portrait onto a canvas with 1.5px cells snapped to device pixels. Each cell is ink or background based on brightness and a 4x4 Bayer threshold. Saturated pixels dither in the pink accent. Prints in by Bayer order over about 800ms. Cells near the cursor shift one density level on mouse devices. Redraws on theme change. Falls back to a plain `<img>` without JavaScript.
- `<dither-mark>`: a left-to-right Bayer gradient from background into the section's soft accent, behind a phrase. Reveals at 40% visibility.
- `<dither-field>`: a slowly drifting noise field in pink for the footer band. Pauses off screen. One static frame under reduced motion.

## Pages

- Header: name, role line, and a "Kraków · HH:MM:SS" clock that toggles the theme.
- Intro: dithered portrait beside the name, a headline on a `<dither-mark>`, two short paragraphs.
- Now (orange), Products (teal, grouped by category), Writing (green, latest 5), Contact (pink, chips on the dither field).
- Posts index grouped by year. Post page with a mono back link, mono meta and restyled prose. Tags and 404 use the same section shell.
- Components: `Section`, `Row`, `Arrow`, `theme-clock`. `Intro`, `Item` and `HoverList` go away.

## Edge cases and testing

- Custom elements clean up observers and animation loops on disconnect. Canvases redraw on resize. Animations pause in hidden tabs.
- Portrait canvas has `role="img"` and alt text. Marks and the field are decorative.
- `bun run build` and `bun run lint` pass. Browser check at 375px and 1280px, light and dark, reduced motion on and off, and page swaps between home and a post.
