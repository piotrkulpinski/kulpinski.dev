import {
  animateProgress,
  bayer,
  canHover,
  cellSize,
  fitCanvas,
  onThemeChange,
  type Rgb,
  readColor,
} from "~/elements/dither"

const HOVER_RADIUS = 16
const HOVER_BOOST = 0.3

/**
 * Renders the `<img>` inside it as a two-tone Bayer dither. Dark areas dither in ink, saturated
 * areas in the pink accent. The image prints in when it first shows, and cells near the cursor
 * shift one density level.
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
  private pointer = { x: -1, y: -1, strength: 0, target: 0 }
  private hoverFrame = 0
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
    cancelAnimationFrame(this.hoverFrame)
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
    const move = (event: PointerEvent) => {
      const rect = this.getBoundingClientRect()
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * this.columns
      this.pointer.y = ((event.clientY - rect.top) / rect.height) * this.rows
      this.pointer.target = 1
      this.loop()
    }

    const leave = () => {
      this.pointer.target = 0
      this.loop()
    }

    this.addEventListener("pointermove", move)
    this.addEventListener("pointerleave", leave)
    this.cleanup.push(() => {
      this.removeEventListener("pointermove", move)
      this.removeEventListener("pointerleave", leave)
    })
  }

  /**
   * Eases the hover strength toward its target, redrawing until it settles.
   */
  private loop() {
    if (this.hoverFrame) return

    const tick = () => {
      const pointer = this.pointer
      pointer.strength += (pointer.target - pointer.strength) * 0.18
      this.draw()

      // Stops once settled, so a still pointer costs nothing. The next move restarts it.
      if (Math.abs(pointer.target - pointer.strength) > 0.01) {
        this.hoverFrame = requestAnimationFrame(tick)
      } else {
        pointer.strength = pointer.target
        this.hoverFrame = 0
      }
    }

    this.hoverFrame = requestAnimationFrame(tick)
  }

  private draw() {
    const { ctx, columns, rows } = this
    if (!ctx || !columns || !this.ink.length) return

    const image = ctx.createImageData(columns, rows)
    const out = image.data
    const { x: px, y: py, strength } = this.pointer
    const [ir, ig, ib] = this.inkColor
    const [tr, tg, tb] = this.tintColor

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const threshold = bayer(x, y)

        // Prints top to bottom with a dithered edge.
        if (this.progress < 1 && this.progress < 0.55 * threshold + 0.45 * (y / rows)) continue

        let boost = 0
        if (strength > 0) {
          const distance = Math.hypot(x - px, y - py)
          if (distance < HOVER_RADIUS)
            boost = (1 - distance / HOVER_RADIUS) * HOVER_BOOST * strength
        }

        const i = y * columns + x
        const o = i * 4

        if (threshold < this.ink[i] + boost) {
          out[o] = ir
          out[o + 1] = ig
          out[o + 2] = ib
          out[o + 3] = 255
        } else if (threshold < this.tint[i] + boost * this.tint[i]) {
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
