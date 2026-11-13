import {
  animateProgress,
  bayer,
  cellSize,
  fitCanvas,
  onThemeChange,
  type Rgb,
  readColor,
} from "~/elements/dither"

/**
 * Highlights its text with a left-to-right Bayer gradient from the section accent into its soft
 * variant. The highlight reveals once the phrase is 40% in view.
 */
class DitherMark extends HTMLElement {
  private canvas = document.createElement("canvas")
  private ctx = this.canvas.getContext("2d")
  private from: Rgb = [0, 0, 0]
  private to: Rgb = [0, 0, 0]
  private progress = 0
  private cleanup: (() => void)[] = []

  connectedCallback() {
    if (!this.ctx) return

    this.canvas.setAttribute("aria-hidden", "true")
    this.canvas.className = "absolute inset-0 -z-10 size-full [image-rendering:pixelated]"
    this.prepend(this.canvas)
    this.readColors()

    const resize = new ResizeObserver(() => this.draw())
    resize.observe(this)

    const visible = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        visible.disconnect()
        this.cleanup.push(
          animateProgress(700, progress => {
            this.progress = progress
            this.toggleAttribute("data-lit", progress > 0.25)
            this.draw()
          }),
        )
      },
      { threshold: 0.4 },
    )
    visible.observe(this)

    this.cleanup.push(
      () => resize.disconnect(),
      () => visible.disconnect(),
      onThemeChange(() => {
        this.readColors()
        this.draw()
      }),
    )
  }

  disconnectedCallback() {
    for (const fn of this.cleanup) fn()
    this.cleanup = []
    this.canvas.remove()
  }

  private readColors() {
    this.from = readColor(this, "--mark-from")
    this.to = readColor(this, "--mark-to")
  }

  private draw() {
    const { ctx } = this
    if (!ctx) return

    const cell = cellSize()
    const { columns, rows } = fitCanvas(this.canvas, this, cell)
    const image = ctx.createImageData(columns, rows)
    const out = image.data
    const lines = this.lineBoxes(cell)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        if (!lines.some(l => x >= l.left && x < l.right && y >= l.top && y < l.bottom)) continue

        const threshold = bayer(x, y)
        const position = x / Math.max(1, columns - 1)

        // Reveals left to right with a dithered edge.
        if (this.progress < 1 && this.progress < 0.5 * position + 0.5 * threshold) continue

        const color = threshold < Math.max(0, (position - 0.1) / 0.9) ? this.to : this.from
        const o = (y * columns + x) * 4
        out[o] = color[0]
        out[o + 1] = color[1]
        out[o + 2] = color[2]
        out[o + 3] = 255
      }
    }

    ctx.putImageData(image, 0, 0)
  }

  /**
   * Returns one box per rendered line of text, in cells, padded like an inline highlight. A
   * wrapped phrase then gets a ragged highlight that follows its lines.
   */
  private lineBoxes(cell: number) {
    const range = document.createRange()
    range.selectNodeContents(this)
    range.setStartAfter(this.canvas)

    const origin = this.getBoundingClientRect()
    const paddingX = 4
    const paddingY = 1

    return [...range.getClientRects()]
      .filter(rect => rect.width > 0)
      .map(rect => ({
        left: Math.floor((rect.left - origin.left - paddingX) / cell),
        right: Math.ceil((rect.right - origin.left + paddingX) / cell),
        top: Math.floor((rect.top - origin.top - paddingY) / cell),
        bottom: Math.ceil((rect.bottom - origin.top + paddingY) / cell),
      }))
  }
}

if (!customElements.get("dither-mark")) {
  customElements.define("dither-mark", DitherMark)
}
