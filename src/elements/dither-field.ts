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
const SCALE = 0.045
const SPEED = 0.00006

const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return h - Math.floor(h)
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Smooth 2D value noise between 0 and 1.
 */
const noise = (x: number, y: number) => {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = smooth(x - ix)
  const fy = smooth(y - iy)
  const top = hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * fx
  const bottom = hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * fx
  return top + (bottom - top) * fy
}

/**
 * A slowly drifting noise field, dithered in the section accent. It renders at a low frame rate,
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

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const n =
          0.65 * noise(x * SCALE + t, y * SCALE - t * 0.6) +
          0.35 * noise(x * SCALE * 2.3 - t * 1.4, y * SCALE * 2.3 + t)

        // Denser toward the right and bottom, so the chips on the left stay calm.
        const weight = 0.25 + 0.5 * (x / columns) + 0.25 * (y / rows)
        const amount = Math.max(0, (n - 0.35) * 1.6) * weight

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
