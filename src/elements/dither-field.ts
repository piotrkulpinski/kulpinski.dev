import {
  bayer,
  cellSize,
  fitCanvas,
  onThemeChange,
  paint,
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
function getHills(x: number, columns: number, rows: number, time: number) {
  const across = x / columns
  const near =
    rows * (0.3 + 0.38 * across) +
    rows * 0.06 * Math.sin(x * 0.045 - time * 0.8) +
    rows * 0.03 * Math.sin(x * 0.11 + time)
  const far =
    rows * (0.12 + 0.3 * across) +
    rows * 0.08 * Math.sin(x * 0.028 + time * 0.5 + 1.7) +
    rows * 0.03 * Math.sin(x * 0.07 - time)

  return { near, far }
}

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
