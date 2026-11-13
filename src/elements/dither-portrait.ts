import {
  animateProgress,
  bayer,
  canHover,
  cellSize,
  fitCanvas,
  onThemeChange,
  prefersReducedMotion,
  type Rgb,
  readColor,
} from "~/elements/dither"

const RIPPLE_DURATION = 1100
const RIPPLE_WIDTH = 6

type Ripple = { x: number; y: number; start: number }

/**
 * Renders the `<img>` inside it as a two-tone Bayer dither. Dark areas dither in ink, saturated
 * areas in the pink accent. The image prints in when it first shows. Hovering or clicking sends a
 * dithered pink ripple out from the cursor.
 */
class DitherPortrait extends HTMLElement {
  private canvas = document.createElement("canvas")
  private ctx = this.canvas.getContext("2d")
  private ink = new Float32Array(0)
  private tint = new Float32Array(0)
  private columns = 0
  private rows = 0
  private inkColor: Rgb = [0, 0, 0]
  private tintColor: Rgb = [0, 0, 0]
  private progress = 0
  private ripples: Ripple[] = []
  private rippleFrame = 0
  private cleanup: (() => void)[] = []

  connectedCallback() {
    const img = this.querySelector("img")
    if (!img || !this.ctx) return

    this.canvas.setAttribute("role", "img")
    this.canvas.setAttribute("aria-label", img.alt)
    this.canvas.className = "absolute inset-0 size-full [image-rendering:pixelated]"
    this.append(this.canvas)
    img.setAttribute("aria-hidden", "true")

    const load = () => {
      this.sample(img)
      this.readColors()
      this.reveal()
    }

    if (img.complete && img.naturalWidth) load()
    else img.addEventListener("load", load, { once: true })

    const resize = new ResizeObserver(() => {
      if (!img.naturalWidth) return
      this.sample(img)
      this.draw()
    })
    resize.observe(this)

    this.cleanup.push(
      () => resize.disconnect(),
      onThemeChange(() => {
        this.readColors()
        this.draw()
      }),
    )

    this.bindPointer()
  }

  disconnectedCallback() {
    for (const fn of this.cleanup) fn()
    this.cleanup = []
    cancelAnimationFrame(this.rippleFrame)
    this.rippleFrame = 0
    this.ripples = []
    this.canvas.remove()
  }

  /**
   * Scales the image to the cell grid and stores the ink and tint amount for each cell.
   */
  private sample(img: HTMLImageElement) {
    const { columns, rows } = fitCanvas(this.canvas, this, cellSize())
    const buffer = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    if (!buffer) return

    buffer.canvas.width = columns
    buffer.canvas.height = rows
    buffer.imageSmoothingQuality = "high"
    buffer.drawImage(img, 0, 0, columns, rows)

    const data = buffer.getImageData(0, 0, columns, rows).data
    this.columns = columns
    this.rows = rows
    this.ink = new Float32Array(columns * rows)
    this.tint = new Float32Array(columns * rows)

    for (let i = 0; i < columns * rows; i++) {
      const r = data[i * 4] / 255
      const g = data[i * 4 + 1] / 255
      const b = data[i * 4 + 2] / 255
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const chroma = Math.max(r, g, b) - Math.min(r, g, b)

      // The flat light-grey backdrop and the white face drop out entirely.
      this.ink[i] = Math.min(1, Math.max(0, (1 - luminance - 0.08) / 0.84))
      this.tint[i] = Math.min(1, chroma * 2.6)
    }
  }

  private readColors() {
    this.inkColor = readColor(this, "--color-ink")
    this.tintColor = readColor(this, "--color-pink")
  }

  private reveal() {
    this.cleanup.push(
      animateProgress(900, progress => {
        this.progress = progress
        this.draw()
      }),
    )
  }

  private bindPointer() {
    const ripple = (event: PointerEvent) => {
      if (prefersReducedMotion() || this.progress < 1) return

      const rect = this.getBoundingClientRect()
      this.ripples.push({
        x: ((event.clientX - rect.left) / rect.width) * this.columns,
        y: ((event.clientY - rect.top) / rect.height) * this.rows,
        start: performance.now(),
      })
      this.loop()
    }

    const enter = (event: PointerEvent) => {
      if (canHover()) ripple(event)
    }

    this.addEventListener("pointerenter", enter)
    this.addEventListener("pointerdown", ripple)
    this.cleanup.push(() => {
      this.removeEventListener("pointerenter", enter)
      this.removeEventListener("pointerdown", ripple)
    })
  }

  /**
   * Redraws while any ripple is running, then stops.
   */
  private loop() {
    if (this.rippleFrame) return

    const tick = (now: number) => {
      this.ripples = this.ripples.filter(r => now - r.start < RIPPLE_DURATION)
      this.draw(now)
      this.rippleFrame = this.ripples.length ? requestAnimationFrame(tick) : 0
    }

    this.rippleFrame = requestAnimationFrame(tick)
  }

  private draw(now = performance.now()) {
    const { ctx, columns, rows } = this
    if (!ctx || !columns || !this.ink.length) return

    const image = ctx.createImageData(columns, rows)
    const out = image.data
    const [ir, ig, ib] = this.inkColor
    const [tr, tg, tb] = this.tintColor
    const reach = Math.hypot(columns, rows)

    const waves = this.ripples.map(r => {
      const t = Math.min(1, (now - r.start) / RIPPLE_DURATION)
      return { x: r.x, y: r.y, radius: t * reach, strength: 1 - t * t }
    })

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const threshold = bayer(x, y)

        // Prints top to bottom with a dithered edge.
        if (this.progress < 1 && this.progress < 0.55 * threshold + 0.45 * (y / rows)) continue

        // A ring of pink cells travels outward from each ripple's origin and fades as it goes.
        let wave = 0
        for (const w of waves) {
          const band = 1 - Math.abs(Math.hypot(x - w.x, y - w.y) - w.radius) / RIPPLE_WIDTH
          if (band > 0) wave = Math.max(wave, band * w.strength)
        }

        const i = y * columns + x
        const o = i * 4

        if (threshold < wave * 0.85) {
          out[o] = tr
          out[o + 1] = tg
          out[o + 2] = tb
          out[o + 3] = 255
        } else if (threshold < this.ink[i]) {
          out[o] = ir
          out[o + 1] = ig
          out[o + 2] = ib
          out[o + 3] = 255
        } else if (threshold < this.tint[i]) {
          out[o] = tr
          out[o + 1] = tg
          out[o + 2] = tb
          out[o + 3] = 255
        }
      }
    }

    ctx.putImageData(image, 0, 0)
  }
}

if (!customElements.get("dither-portrait")) {
  customElements.define("dither-portrait", DitherPortrait)
}
