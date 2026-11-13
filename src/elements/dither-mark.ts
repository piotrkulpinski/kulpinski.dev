import {
  animateProgress,
  bayer,
  cellSize,
  fitCanvas,
  onThemeChange,
  paint,
  type Rgb,
  readColor,
} from "~/elements/dither"

interface LineBox {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Highlights its text with a left-to-right Bayer gradient from the accent into its soft variant.
 * The highlight reveals once the phrase is 40% in view.
 */
class DitherMark extends HTMLElement {
  private canvas = document.createElement("canvas")
  private context = this.canvas.getContext("2d")
  private from: Rgb = [0, 0, 0]
  private to: Rgb = [0, 0, 0]
  private progress = 0
  private cleanup: (() => void)[] = []

  connectedCallback() {
    if (!this.context) {
      return
    }

    this.canvas.setAttribute("aria-hidden", "true")
    this.canvas.className = "absolute inset-0 -z-10 size-full [image-rendering:pixelated]"
    this.prepend(this.canvas)
    this.readColors()

    const resize = new ResizeObserver(() => this.draw())
    resize.observe(this)

    const visible = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }

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
    for (const stop of this.cleanup) {
      stop()
    }

    this.cleanup = []
    this.canvas.remove()
  }

  private readColors() {
    this.from = readColor(this, "--mark-from")
    this.to = readColor(this, "--mark-to")
  }

  private draw() {
    const context = this.context
    if (!context) {
      return
    }

    const cell = cellSize()
    const { columns, rows } = fitCanvas(this.canvas, this, cell)
    const image = context.createImageData(columns, rows)
    const lines = this.getLineBoxes(cell)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const isInText = lines.some(
          line => x >= line.left && x < line.right && y >= line.top && y < line.bottom,
        )
        if (!isInText) {
          continue
        }

        const threshold = bayer(x, y)
        const position = x / Math.max(1, columns - 1)

        // Reveals left to right with a dithered edge.
        if (this.progress < 1 && this.progress < 0.5 * position + 0.5 * threshold) {
          continue
        }

        const color = threshold < Math.max(0, (position - 0.1) / 0.9) ? this.to : this.from
        paint(image.data, (y * columns + x) * 4, color)
      }
    }

    context.putImageData(image, 0, 0)
  }

  /**
   * Returns one box per rendered line of text, in cells, padded like an inline highlight. A
   * wrapped phrase then gets a ragged highlight that follows its lines.
   */
  private getLineBoxes(cell: number): LineBox[] {
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
