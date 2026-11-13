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

const MAGNET_RADIUS = 26
const MAGNET_PULL = 0.7
const SPRING = 0.12
const DAMPING = 0.74

/**
 * Renders the `<img>` inside it as a two-tone Bayer dither. Dark areas dither in ink, saturated
 * areas in the pink accent. The image prints in when it first shows. The cursor works like a
 * magnet: the image underneath warps toward it, while every cell keeps its own Bayer threshold, so
 * the dither pattern stays regular. The magnet point and its strength move on springs.
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
  // The magnet trails the cursor on a spring, and its strength eases in and out the same way.
  private magnet = { x: 0, y: 0, vx: 0, vy: 0, strength: 0, velocity: 0 }
  private pointer: { x: number; y: number } | null = null
  private magnetFrame = 0
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
    cancelAnimationFrame(this.magnetFrame)
    this.magnetFrame = 0
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
      const x = ((event.clientX - rect.left) / rect.width) * this.columns
      const y = ((event.clientY - rect.top) / rect.height) * this.rows

      // A fresh magnet starts under the cursor rather than flying in from its old spot.
      if (!this.pointer && this.magnet.strength < 0.05) {
        this.magnet.x = x
        this.magnet.y = y
      }

      this.pointer = { x, y }
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
   * Steps the magnet's springs each frame. The loop stops once the pointer has left and the
   * strength has settled at zero.
   */
  private loop() {
    if (this.magnetFrame) return

    const tick = () => {
      const m = this.magnet
      const pointer = this.pointer

      if (pointer) {
        m.vx = (m.vx + (pointer.x - m.x) * SPRING) * DAMPING
        m.vy = (m.vy + (pointer.y - m.y) * SPRING) * DAMPING
        m.x += m.vx
        m.y += m.vy
      }

      m.velocity = (m.velocity + ((pointer ? 1 : 0) - m.strength) * SPRING) * DAMPING
      m.strength += m.velocity

      this.draw()

      const settled = !pointer && Math.abs(m.strength) < 0.005 && Math.abs(m.velocity) < 0.005
      if (settled) {
        m.strength = 0
        m.velocity = 0
        this.magnetFrame = 0
        this.draw()
      } else {
        this.magnetFrame = requestAnimationFrame(tick)
      }
    }

    this.magnetFrame = requestAnimationFrame(tick)
  }

  /**
   * Samples a cell array with bilinear filtering, so the warp moves smoothly between cells.
   */
  private sampleAt(values: Float32Array, x: number, y: number) {
    const { columns, rows } = this
    if (x < 0 || y < 0 || x > columns - 1 || y > rows - 1) return 0

    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const x1 = Math.min(columns - 1, x0 + 1)
    const y1 = Math.min(rows - 1, y0 + 1)
    const fx = x - x0
    const fy = y - y0
    const top = values[y0 * columns + x0] * (1 - fx) + values[y0 * columns + x1] * fx
    const bottom = values[y1 * columns + x0] * (1 - fx) + values[y1 * columns + x1] * fx
    return top * (1 - fy) + bottom * fy
  }

  private draw() {
    const { ctx, columns, rows, progress } = this
    if (!ctx || !columns || !this.ink.length) return

    const image = ctx.createImageData(columns, rows)
    const out = image.data
    const [ir, ig, ib] = this.inkColor
    const [tr, tg, tb] = this.tintColor
    const { x: mx, y: my, strength } = this.magnet

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const threshold = bayer(x, y)

        // Prints top to bottom with a dithered edge.
        if (progress < 1 && progress < 0.55 * threshold + 0.45 * (y / rows)) continue

        // Each cell samples the image from a point pushed away from the magnet, which pulls the
        // picture toward it. The push fades to zero at the edge of the radius.
        let i = y * columns + x
        let ink = this.ink[i]
        let tint = this.tint[i]

        if (strength > 0.001) {
          const dx = x - mx
          const dy = y - my
          const distance = Math.hypot(dx, dy)

          if (distance < MAGNET_RADIUS) {
            const push = 1 + MAGNET_PULL * strength * (1 - distance / MAGNET_RADIUS) ** 2
            ink = this.sampleAt(this.ink, mx + dx * push, my + dy * push)
            tint = this.sampleAt(this.tint, mx + dx * push, my + dy * push)
          }
        }

        i *= 4
        if (threshold < ink) {
          out[i] = ir
          out[i + 1] = ig
          out[i + 2] = ib
          out[i + 3] = 255
        } else if (threshold < tint) {
          out[i] = tr
          out[i + 1] = tg
          out[i + 2] = tb
          out[i + 3] = 255
        }
      }
    }

    ctx.putImageData(image, 0, 0)
  }
}

if (!customElements.get("dither-portrait")) {
  customElements.define("dither-portrait", DitherPortrait)
}
