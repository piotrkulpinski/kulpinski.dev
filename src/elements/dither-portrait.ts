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

const MAGNET_RADIUS = 24
const MAGNET_PULL = 0.5
const SPRING = 0.09
const DAMPING = 0.78

/**
 * Renders the `<img>` inside it as a two-tone Bayer dither. Dark areas dither in ink, saturated
 * areas in the pink accent. The image prints in when it first shows. Each lit cell is a particle
 * on a spring, and the cursor works like a magnet: it pulls nearby cells toward it, and they spring
 * back home when it leaves.
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
  private particles = {
    homeX: new Float32Array(0),
    homeY: new Float32Array(0),
    x: new Float32Array(0),
    y: new Float32Array(0),
    vx: new Float32Array(0),
    vy: new Float32Array(0),
    // 1 for ink, 2 for the pink tint.
    kind: new Uint8Array(0),
    // The print-in progress at which the cell appears.
    gate: new Float32Array(0),
  }
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

    this.buildParticles()
  }

  /**
   * Turns every lit cell of the dither into a particle resting at its home position.
   */
  private buildParticles() {
    const { columns, rows } = this
    const homeX: number[] = []
    const homeY: number[] = []
    const kind: number[] = []
    const gate: number[] = []

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const i = y * columns + x
        const threshold = bayer(x, y)
        const type = threshold < this.ink[i] ? 1 : threshold < this.tint[i] ? 2 : 0
        if (!type) continue

        homeX.push(x)
        homeY.push(y)
        kind.push(type)
        gate.push(0.55 * threshold + 0.45 * (y / rows))
      }
    }

    this.particles = {
      homeX: Float32Array.from(homeX),
      homeY: Float32Array.from(homeY),
      x: Float32Array.from(homeX),
      y: Float32Array.from(homeY),
      vx: new Float32Array(homeX.length),
      vy: new Float32Array(homeX.length),
      kind: Uint8Array.from(kind),
      gate: Float32Array.from(gate),
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
   * Steps the springs and the magnet each frame. The loop stops once the pointer has left and
   * every cell is back home.
   */
  private loop() {
    if (this.magnetFrame) return

    const tick = () => {
      const { homeX, homeY, x, y, vx, vy } = this.particles
      const pointer = this.pointer
      let motion = 0

      for (let i = 0; i < x.length; i++) {
        // Each cell springs toward a target pulled part of the way from its home to the cursor.
        // The fraction is never 1, so cells pinch toward the cursor without collapsing into it.
        let targetX = homeX[i]
        let targetY = homeY[i]

        if (pointer) {
          const dx = pointer.x - homeX[i]
          const dy = pointer.y - homeY[i]
          const distance = Math.hypot(dx, dy)

          if (distance < MAGNET_RADIUS) {
            const pull = MAGNET_PULL * (1 - distance / MAGNET_RADIUS) ** 2
            targetX += dx * pull
            targetY += dy * pull
          }
        }

        const ax = (targetX - x[i]) * SPRING
        const ay = (targetY - y[i]) * SPRING

        vx[i] = (vx[i] + ax) * DAMPING
        vy[i] = (vy[i] + ay) * DAMPING
        x[i] += vx[i]
        y[i] += vy[i]
        motion +=
          Math.abs(vx[i]) + Math.abs(vy[i]) + Math.abs(homeX[i] - x[i]) + Math.abs(homeY[i] - y[i])
      }

      this.draw()

      if (pointer || motion > 0.5) {
        this.magnetFrame = requestAnimationFrame(tick)
      } else {
        x.set(homeX)
        y.set(homeY)
        this.magnetFrame = 0
        this.draw()
      }
    }

    this.magnetFrame = requestAnimationFrame(tick)
  }

  private draw() {
    const { ctx, columns, rows, progress } = this
    if (!ctx || !columns) return

    const { x, y, kind, gate } = this.particles
    const image = ctx.createImageData(columns, rows)
    const out = image.data
    const [ir, ig, ib] = this.inkColor
    const [tr, tg, tb] = this.tintColor

    // Pink first, then ink, so ink wins where cells overlap.
    for (const pass of [2, 1]) {
      const [r, g, b] = pass === 1 ? [ir, ig, ib] : [tr, tg, tb]

      for (let i = 0; i < x.length; i++) {
        if (kind[i] !== pass || (progress < 1 && progress < gate[i])) continue

        const cx = Math.round(x[i])
        const cy = Math.round(y[i])
        if (cx < 0 || cx >= columns || cy < 0 || cy >= rows) continue

        const o = (cy * columns + cx) * 4
        out[o] = r
        out[o + 1] = g
        out[o + 2] = b
        out[o + 3] = 255
      }
    }

    ctx.putImageData(image, 0, 0)
  }
}

if (!customElements.get("dither-portrait")) {
  customElements.define("dither-portrait", DitherPortrait)
}
