import {
  bayer,
  cellSize,
  fitCanvas,
  onThemeChange,
  prefersReducedMotion,
  type Rgb,
  readColor,
} from "~/elements/dither"

const FRAME_INTERVAL = 60
const SPEED = 0.00012

/**
 * Two rolling hill lines, as heights from the top in rows. The near hill rises toward the left,
 * so the bottom left stays densest.
 */
const hills = (x: number, columns: number, rows: number, t: number) => {
  const u = x / columns
  const near =
    rows * (0.3 + 0.38 * u) +
    rows * 0.06 * Math.sin(x * 0.045 - t * 0.8) +
    rows * 0.03 * Math.sin(x * 0.11 + t)
  const far =
    rows * (0.12 + 0.3 * u) +
    rows * 0.08 * Math.sin(x * 0.028 + t * 0.5 + 1.7) +
    rows * 0.03 * Math.sin(x * 0.07 - t)
  return { near, far }
}

/**
 * The dither density at a point: a sparse sky, a mid-tone far hill and a denser near hill. Each
 * band steps up at its ridge, so the hill lines stay visible, and the near hill tops out below
 * full density, so the bottom stays dithered.
 */
const density = (y: number, rows: number, near: number, far: number) => {
  if (y >= near) return 0.62 + 0.13 * ((y - near) / Math.max(1, rows - near))
  if (y >= far) return 0.32 + 0.08 * ((y - far) / Math.max(1, near - far))
  return 0.06 + 0.08 * (y / Math.max(1, far))
}

/**
 * A slowly drifting landscape of dithered hills in the accent. It renders at a low frame rate,
 * pauses off screen, and draws one still frame under reduced motion.
 */
class DitherField extends HTMLElement {
  private canvas = document.createElement("canvas")
  private ctx = this.canvas.getContext("2d")
  private color: Rgb = [0, 0, 0]
  private frame = 0
  private last = 0
  private time = 0
  private cleanup: (() => void)[] = []

  connectedCallback() {
    if (!this.ctx) return

    this.canvas.setAttribute("aria-hidden", "true")
    this.canvas.className = "absolute inset-0 size-full [image-rendering:pixelated]"
    this.prepend(this.canvas)
    this.color = readColor(this, "--section")
    this.time = Math.random() * 1000

    const resize = new ResizeObserver(() => this.draw())
    resize.observe(this)

    const visible = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !prefersReducedMotion()) this.start()
      else this.stop()
    })
    visible.observe(this)

    this.cleanup.push(
      () => resize.disconnect(),
      () => visible.disconnect(),
      onThemeChange(() => {
        this.color = readColor(this, "--section")
        this.draw()
      }),
    )
  }

  disconnectedCallback() {
    for (const fn of this.cleanup) fn()
    this.cleanup = []
    this.stop()
    this.canvas.remove()
  }

  private start() {
    if (this.frame) return

    const tick = (now: number) => {
      if (now - this.last >= FRAME_INTERVAL) {
        this.time += (now - (this.last || now)) * SPEED
        this.last = now
        this.draw()
      }
      this.frame = requestAnimationFrame(tick)
    }

    this.frame = requestAnimationFrame(tick)
  }

  private stop() {
    cancelAnimationFrame(this.frame)
    this.frame = 0
    this.last = 0
  }

  private draw() {
    const { ctx } = this
    if (!ctx) return

    const { columns, rows } = fitCanvas(this.canvas, this, cellSize(2))
    const image = ctx.createImageData(columns, rows)
    const out = image.data
    const [r, g, b] = this.color
    const t = this.time

    for (let x = 0; x < columns; x++) {
      const { near, far } = hills(x, columns, rows, t)

      for (let y = 0; y < rows; y++) {
        const amount = density(y, rows, near, far)
        if (bayer(x, y) >= amount) continue

        const o = (y * columns + x) * 4
        out[o] = r
        out[o + 1] = g
        out[o + 2] = b
        out[o + 3] = 255
      }
    }

    ctx.putImageData(image, 0, 0)
  }
}

if (!customElements.get("dither-field")) {
  customElements.define("dither-field", DitherField)
}
