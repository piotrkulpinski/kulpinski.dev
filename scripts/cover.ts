/**
 * Turns an illustration into a blog cover in the site's dithered style: a 4x4 Bayer ordered
 * dither in the accent pink, on the light or dark background.
 *
 * Usage: bun scripts/cover.ts <input image> <output basename> [cell size in pixels]
 * Writes `<basename>.webp` (light) and `<basename>-dark.webp` at 1270x635.
 */
import sharp from "sharp"

type Rgb = [number, number, number]

const WIDTH = 1270
const HEIGHT = 635

// Mirrors `--color-pink` and `--bg` in `src/styles.css`.
const ACCENT: Rgb = [0xff, 0x5c, 0x93]
const THEMES: { suffix: string; background: Rgb }[] = [
  { suffix: "", background: [0xff, 0xff, 0xff] },
  { suffix: "-dark", background: [0x0b, 0x0b, 0x0c] },
]

// The same matrix as `src/elements/dither.ts`, normalized to thresholds between 0 and 1.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  value => (value + 0.5) / 16,
)

const [input, output, cellArg] = process.argv.slice(2)

if (!input || !output) {
  console.error("Usage: bun scripts/cover.ts <input image> <output basename> [cell size]")
  process.exit(1)
}

const cell = Number(cellArg ?? 3)

// How sharp a change in tone counts as an outline, on the Sobel scale of 0 to about 1,440.
const EDGE_THRESHOLD = 140
const columns = Math.ceil(WIDTH / cell)
const rows = Math.ceil(HEIGHT / cell)

// One grayscale value per dither cell. The illustration is centered on a white canvas.
const { data: gray } = await sharp(input)
  .flatten({ background: "#ffffff" })
  .resize(columns, rows, { fit: "contain", background: "#ffffff" })
  .grayscale()
  .raw()
  .toBuffer({ resolveWithObject: true })

/**
 * Whether a cell sits on an outline of the illustration, so light shapes keep a crisp edge
 * against the background instead of fading into it.
 */
function isEdge(x: number, y: number) {
  if (x === 0 || y === 0 || x === columns - 1 || y === rows - 1) {
    return false
  }

  const at = (dx: number, dy: number) => gray[(y + dy) * columns + x + dx]
  const horizontal = at(1, -1) + 2 * at(1, 0) + at(1, 1) - at(-1, -1) - 2 * at(-1, 0) - at(-1, 1)
  const vertical = at(-1, 1) + 2 * at(0, 1) + at(1, 1) - at(-1, -1) - 2 * at(0, -1) - at(1, -1)

  return Math.hypot(horizontal, vertical) > EDGE_THRESHOLD
}

for (const { suffix, background } of THEMES) {
  const pixels = Buffer.alloc(columns * rows * 3)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      // Dark areas of the illustration become dense accent dots.
      // Near-white reads as paper, so an off-white background stays clean.
      const density = Math.max(0, (1 - gray[y * columns + x] / 255 - 0.06) / 0.94)
      const filled = isEdge(x, y) || density > BAYER[(y & 3) * 4 + (x & 3)]
      const color = filled ? ACCENT : background
      pixels.set(color, (y * columns + x) * 3)
    }
  }

  await sharp(pixels, { raw: { width: columns, height: rows, channels: 3 } })
    .resize(columns * cell, rows * cell, { kernel: "nearest" })
    .extract({ left: 0, top: 0, width: WIDTH, height: HEIGHT })
    .webp({ lossless: true })
    .toFile(`${output}${suffix}.webp`)

  console.log(`Wrote ${output}${suffix}.webp`)
}
