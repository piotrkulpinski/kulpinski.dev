import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { join } from "node:path"
import { type Card, createRenderer, type FontFile } from "ogier"
import sharp from "sharp"
import avatarSvg from "~/assets/piotr-kulpinski-avatar.svg?raw"
import { bayer, getHills, getSeed, mix, type Rgb } from "~/elements/dither"

/**
 * The site's dark theme. Every card is dark: an Open Graph image is one PNG for every viewer.
 */
const colors = {
  paper: "#0b0b0c",
  ink: "#f2f2f3",
  faint: "#85858a",
  accent: "#ff5c93",
  accentText: "#ff7aa8",
}

const WIDTH = 1200
const HEIGHT = 630

// Dither cells are 6px, so the pattern still reads when a feed shrinks the card to ~500px.
const CELL = 6

// The home headline, broken into the lines the card draws, each under its own highlight.
const HOME_LINES = ["I build software products", "and run them end to end."]
const HOME_TITLE_SIZE = 56
const HOME_LINE_HEIGHT = 1.12

// The gap ogier puts between the title and the element passed as `extra`.
const HEADLINE_GAP = 16

// The avatar's box on the home card. The card's right edge cuts it, as in the design.
const AVATAR = { left: 700, top: 70, size: 560 }

// Resolves from the project root, which holds the same `node_modules` in dev and in the build.
const require = createRequire(join(process.cwd(), "package.json"))

/**
 * Reads the latin and latin-ext files of a fontsource family at one weight.
 */
async function getFontFiles(family: string, weight: number): Promise<FontFile[]> {
  const subsets = ["latin", "latin-ext"]

  return Promise.all(
    subsets.map(async subset => ({
      data: await readFile(
        require.resolve(`@fontsource/${family}/files/${family}-${subset}-${weight}-normal.woff`),
      ),
      weight,
    })),
  )
}

function parseHex(hex: string): Rgb {
  return [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16)) as Rgb
}

/**
 * Draws a grid of dither cells into a PNG. A cell takes the foreground when its Bayer threshold
 * falls below the density at that cell.
 */
async function renderDither(
  width: number,
  height: number,
  [foreground, background]: [Rgb, Rgb],
  getDensity: (x: number, y: number, columns: number, rows: number) => number,
) {
  const columns = Math.ceil(width / CELL)
  const rows = Math.ceil(height / CELL)
  const pixels = Buffer.alloc(width * height * 3)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const column = Math.floor(x / CELL)
      const row = Math.floor(y / CELL)
      const color =
        bayer(column, row) < getDensity(column, row, columns, rows) ? foreground : background
      pixels.set(color, (y * width + x) * 3)
    }
  }

  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .png({ palette: true, colors: 2 })
    .toBuffer()
}

/**
 * The footer's hills turned on their side, for the right half of the card: sparse next to the
 * text and densest at the right edge. Densities are lower than the footer's, so the title leads.
 */
function renderField(seed: string) {
  const time = getSeed(seed)

  return renderDither(
    WIDTH / 2,
    HEIGHT,
    [parseHex(colors.accent), parseHex(colors.paper)],
    (column, row, columns, rows) => {
      // The ridge runs down the card, and depth grows from the left edge of the field.
      const along = rows - 1 - row
      const { near, far } = getHills(along, rows, columns, time)

      if (column >= near) {
        return 0.42 + 0.08 * ((column - near) / Math.max(1, columns - near))
      }

      if (column >= far) {
        return 0.2 + 0.05 * ((column - far) / Math.max(1, near - far))
      }

      return 0.07 * (column / Math.max(1, far))
    },
  )
}

/**
 * The `dither-mark` highlight: a left-to-right Bayer blend between two washes of the accent.
 */
function renderWash(width: number, height: number) {
  const paper = parseHex(colors.paper)
  const accent = parseHex(colors.accent)

  return renderDither(
    width,
    height,
    [mix(paper, accent, 0.12), mix(paper, accent, 0.36)],
    (column, _row, columns) => Math.max(0, (column / Math.max(1, columns - 1) - 0.1) / 0.9),
  )
}

/**
 * The home card's background: paper with the avatar at the right edge.
 */
async function renderPortrait() {
  const avatar = await sharp(Buffer.from(avatarSvg), { density: 900 })
    .resize(AVATAR.size, AVATAR.size)
    .extract({ left: 0, top: 0, width: WIDTH - AVATAR.left, height: AVATAR.size })
    .png()
    .toBuffer()

  return sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: colors.paper } })
    .composite([{ input: avatar, left: AVATAR.left, top: AVATAR.top }])
    .png()
    .toBuffer()
}

const square = {
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="24" viewBox="0 0 14 24"><rect y="5" width="14" height="14" fill="${colors.accent}"/></svg>`,
}

const fonts = Promise.all([
  getFontFiles("inter", 500),
  getFontFiles("inter", 400),
  getFontFiles("geist-mono", 400),
])

const theme = {
  bg: colors.paper,
  text: colors.ink,
  muted: colors.faint,
  header: colors.faint,
  eyebrow: colors.accentText,
  footer: colors.faint,
  accent: colors.accent,
  pattern: colors.accent,
}

const labelSizes = {
  headerText: 20,
  headerWeight: 400,
  headerTracking: "0.1em",
  headerGap: 12,
  headerIcon: 24,
  eyebrowText: 20,
  eyebrowWeight: 400,
  eyebrowTracking: "0.1em",
  footerText: 20,
  footerWeight: 400,
  footerTracking: "0.1em",
}

async function getRenderers() {
  const [title, body, label] = await fonts
  const portrait = await renderPortrait()

  const page = createRenderer({
    theme,
    fonts: { title, body, label },
    sizes: {
      ...labelSizes,
      cardPadding: { top: 52, right: 48, bottom: 52, left: 56 },
      titleText: 52,
      titleTextLong: 52,
      titleTextLongest: 44,
      titleWeight: 500,
      titleWeightLong: 500,
      titleLineHeight: 1.1,
      titleTracking: "-0.025em",
      titleTrackingLong: "-0.025em",
      titleMaxLines: 5,
    },
  })

  const home = createRenderer({
    // The title is drawn by the highlighted lines in `extra`, so the real title only holds space.
    theme: { ...theme, title: "transparent" },
    fonts: { title, body, label },
    background: { image: { data: portrait, type: "image/png" } },
    sizes: {
      ...labelSizes,
      cardPadding: { top: 52, right: 56, bottom: 52, left: 56 },
      contentWidth: 680,
      titleText: HOME_TITLE_SIZE,
      titleTextLong: HOME_TITLE_SIZE,
      titleWeight: 500,
      titleWeightLong: 500,
      titleLineHeight: HOME_LINE_HEIGHT,
      titleTracking: "-0.025em",
      titleTrackingLong: "-0.025em",
    },
  })

  return { page, home }
}

let renderers: ReturnType<typeof getRenderers> | undefined

export interface PageCardInput {
  seed: string
  eyebrow: string
  title: string
  footer: string
}

/**
 * Renders the card for a post or a listing page: the text on the left, a dithered field on the
 * right, seeded by the page so every card gets its own hills.
 */
export async function renderPageCard({ seed, eyebrow, title, footer }: PageCardInput) {
  renderers ??= getRenderers()
  const { page } = await renderers

  const card: Card = {
    header: { text: "PIOTR KULPINSKI", icon: square },
    eyebrow,
    title,
    footer: { text: footer.toUpperCase() },
    image: { data: await renderField(seed), type: "image/png", position: "right" },
  }

  return page.renderPng(card)
}

/**
 * Renders the home card: the intro line under the `dither-mark` highlight, beside the avatar.
 */
export async function renderHomeCard() {
  renderers ??= getRenderers()
  const { home } = await renderers

  const lineHeight = Math.round(HOME_TITLE_SIZE * HOME_LINE_HEIGHT)
  // One wash wider than the longest line, so each line box clips it at its own width.
  const wash = await renderWash(720, lineHeight)
  const washUri = `data:image/png;base64,${wash.toString("base64")}`

  // The highlighted lines sit over the transparent title, so they take its exact position.
  const lines = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginTop: -(HOME_LINES.length * lineHeight + HEADLINE_GAP),
        marginLeft: -10,
      },
      children: HOME_LINES.map(line => ({
        type: "div",
        props: {
          style: {
            display: "flex",
            padding: "0 10px",
            backgroundImage: `url(${washUri})`,
            backgroundRepeat: "no-repeat",
            // ogier names fonts passed as files after their role.
            fontFamily: "title",
            fontSize: HOME_TITLE_SIZE,
            fontWeight: 500,
            lineHeight: `${lineHeight}px`,
            letterSpacing: "-0.025em",
            color: colors.ink,
          },
          children: line,
        },
      })),
    },
  }

  const card: Card = {
    header: { text: "PIOTR KULPINSKI", icon: square },
    title: HOME_LINES.join(" "),
    footer: { text: "KULPINSKI.DEV" },
    extra: lines,
  }

  return home.renderPng(card)
}
