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

const GLOW_RADIUS = 11
const GLOW_PEAK = 0.75
const GLOW_DECAY = 0.86

/**
 * Renders the `<img>` inside it as a two-tone Bayer dither. Dark areas dither in ink, saturated
 * areas in the pink accent. The image prints in when it first shows, and a pink dithered glow
 * follows the cursor, leaving a short fading trail.
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
  private heat = new Float32Array(0)
  private pointer: { x: number; y: number } | null = null
  private glowFrame = 0
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

    if (canHover()) this.bindPointer()
  }

  disconnectedCallback() {
    for (const fn of this.cleanup) fn()
    this.cleanup = []
    cancelAnimationFrame(this.glowFrame)
    this.glowFrame = 0
    this.pointer = null
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
    this.heat = new Float32Array(columns * rows)

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
    const move = (event: PointerEvent) => {
      if (prefersReducedMotion() || this.progress < 1) return

      const rect = this.getBoundingClientRect()
      this.pointer = {
        x: ((event.clientX - rect.left) / rect.width) * this.columns,
        y: ((event.clientY - rect.top) / rect.height) * this.rows,
      }
      this.loop()
    }

    const leave = () => {
      this.pointer = null
    }

    this.addEventListener("pointermove", move)
    this.addEventListener("pointerleave", leave)
    this.cleanup.push(() => {
      this.removeEventListener("pointermove", move)
      this.removeEventListener("pointerleave", leave)
    })
  }

  /**
   * Each frame the heat decays and the cursor adds a soft disc of it. The loop stops once the
   * pointer has left and the trail has faded.
   */
  private loop() {
    if (this.glowFrame) return

    const tick = () => {
      const { columns, rows } = this
      const heat = this.heat
      const pointer = this.pointer
      let peak = 0

      for (let i = 0; i < heat.length; i++) {
        heat[i] *= GLOW_DECAY
        if (heat[i] < 0.01) heat[i] = 0
      }

      if (pointer) {
        const x0 = Math.max(0, Math.floor(pointer.x - GLOW_RADIUS))
        const x1 = Math.min(columns - 1, Math.ceil(pointer.x + GLOW_RADIUS))
        const y0 = Math.max(0, Math.floor(pointer.y - GLOW_RADIUS))
        const y1 = Math.min(rows - 1, Math.ceil(pointer.y + GLOW_RADIUS))

        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            const d2 = ((x - pointer.x) ** 2 + (y - pointer.y) ** 2) / (GLOW_RADIUS * GLOW_RADIUS)
            if (d2 >= 1) continue
            const i = y * columns + x
            heat[i] = Math.max(heat[i], GLOW_PEAK * (1 - d2) ** 2)
          }
        }
      }

      for (let i = 0; i < heat.length; i++) peak = Math.max(peak, heat[i])

      this.draw()
      this.glowFrame = pointer || peak > 0 ? requestAnimationFrame(tick) : 0
    }

    this.glowFrame = requestAnimationFrame(tick)
  }

  private draw() {
    const { ctx, columns, rows } = this
    const heat = this.heat
    if (!ctx || !columns || !this.ink.length) return

    const image = ctx.createImageData(columns, rows)
    const out = image.data
    const [ir, ig, ib] = this.inkColor
    const [tr, tg, tb] = this.tintColor

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const threshold = bayer(x, y)

        // Prints top to bottom with a dithered edge.
        if (this.progress < 1 && this.progress < 0.55 * threshold + 0.45 * (y / rows)) continue

        const i = y * columns + x
        const o = i * 4

        // The glow turns ink pink under the cursor and adds pink dots around it.
        const glow = heat[i]
        const isInk = threshold < this.ink[i]

        if (isInk || threshold < glow) {
          const pink = !isInk || threshold < glow * 1.3
          out[o] = pink && glow > 0 ? tr : ir
          out[o + 1] = pink && glow > 0 ? tg : ig
          out[o + 2] = pink && glow > 0 ? tb : ib
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
