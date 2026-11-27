import {
  bayer,
  cellSize,
  fitCanvas,
  getHills,
  onThemeChange,
  paint,
  prefersReducedMotion,
  type Rgb,
  readColor,
} from "~/elements/dither"

const FRAME_INTERVAL = 60
const SPEED = 0.00012

/**
 * The dither density at a point: a sparse sky, a mid-tone far hill and a denser near hill. Each
 * band steps up at its ridge, so the hill lines stay visible, and the near hill tops out below
 * full density, so the bottom stays dithered.
 */
function getDensity(y: number, rows: number, near: number, far: number) {
  if (y >= near) {
    return 0.62 + 0.13 * ((y - near) / Math.max(1, rows - near))
  }

  if (y >= far) {
    return 0.32 + 0.08 * ((y - far) / Math.max(1, near - far))
  }

  return 0.06 + 0.08 * (y / Math.max(1, far))
}

/**
 * A slowly drifting landscape of dithered hills in the accent. It renders at a low frame rate,
 * pauses off screen, and draws one still frame under reduced motion.
 */
class DitherField extends HTMLElement {
  private canvas = document.createElement("canvas")
  private context = this.canvas.getContext("2d")
  private color: Rgb = [0, 0, 0]
  private frame = 0
  private lastFrame: number | null = null
  private time = 0
  private cleanup: (() => void)[] = []

  connectedCallback() {
    if (!this.context) {
      return
    }

    this.canvas.setAttribute("aria-hidden", "true")
    this.canvas.className = "absolute inset-0 size-full [image-rendering:pixelated]"
    this.prepend(this.canvas)
    this.color = readColor(this, "--accent")
    this.time = Math.random() * 1000

    const resize = new ResizeObserver(() => this.draw())
    resize.observe(this)

    const visible = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !prefersReducedMotion()) {
        this.start()
      } else {
        this.stop()
      }
    })
    visible.observe(this)

    this.cleanup.push(
      () => resize.disconnect(),
      () => visible.disconnect(),
      onThemeChange(() => {
        this.color = readColor(this, "--accent")
        this.draw()
      }),
    )
  }

  disconnectedCallback() {
    for (const stop of this.cleanup) {
      stop()
    }

    this.cleanup = []
    this.stop()
    this.canvas.remove()
  }

  private start() {
    if (this.frame) {
      return
    }

    const tick = (now: number) => {
      const lastFrame = this.lastFrame ?? now

      if (this.lastFrame === null || now - lastFrame >= FRAME_INTERVAL) {
        this.time += (now - lastFrame) * SPEED
        this.lastFrame = now
        this.draw()
      }

      this.frame = requestAnimationFrame(tick)
    }

    this.frame = requestAnimationFrame(tick)
  }

  private stop() {
    cancelAnimationFrame(this.frame)
    this.frame = 0
    this.lastFrame = null
  }

  private draw() {
    const context = this.context
    if (!context) {
      return
    }

    const { columns, rows } = fitCanvas(this.canvas, this, cellSize(2))
    const image = context.createImageData(columns, rows)

    for (let x = 0; x < columns; x++) {
      const { near, far } = getHills(x, columns, rows, this.time)

      for (let y = 0; y < rows; y++) {
        if (bayer(x, y) < getDensity(y, rows, near, far)) {
          paint(image.data, (y * columns + x) * 4, this.color)
        }
      }
    }

    context.putImageData(image, 0, 0)
  }
}

if (!customElements.get("dither-field")) {
  customElements.define("dither-field", DitherField)
}
