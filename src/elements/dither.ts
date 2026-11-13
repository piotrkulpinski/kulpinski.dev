/**
 * Shared helpers for the dithered canvas elements.
 */
export type Rgb = [number, number, number]

/**
 * The 4x4 Bayer matrix, normalized to thresholds between 0 and 1.
 */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16)

/**
 * Returns the Bayer threshold for a cell.
 */
export const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)]

/**
 * Returns the cell size in CSS pixels, snapped to whole device pixels so cells stay sharp.
 */
export const cellSize = (base = 1.5) => {
  const dpr = window.devicePixelRatio || 1
  return Math.max(1, Math.round(base * dpr)) / dpr
}

export const prefersReducedMotion = () => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export const canHover = () => {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches
}

let probe: CanvasRenderingContext2D | null = null

/**
 * Resolves a CSS custom property on an element to an RGB triple.
 */
export const readColor = (el: Element, property: string): Rgb => {
  const value = getComputedStyle(el).getPropertyValue(property).trim() || "#000"

  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  if (!probe) return [0, 0, 0]

  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = value
  probe.fillRect(0, 0, 1, 1)

  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

/**
 * Calls back when the theme changes, either from the toggle or from the system setting.
 */
export const onThemeChange = (callback: () => void) => {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

  const media = window.matchMedia("(prefers-color-scheme: dark)")
  media.addEventListener("change", callback)

  return () => {
    observer.disconnect()
    media.removeEventListener("change", callback)
  }
}

/**
 * Runs a 0 to 1 progress animation with an ease-out curve. Returns a cancel function.
 */
export const animateProgress = (duration: number, onFrame: (progress: number) => void) => {
  if (prefersReducedMotion()) {
    onFrame(1)
    return () => {}
  }

  const start = performance.now()
  let frame = 0

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    onFrame(1 - (1 - t) ** 3)
    if (t < 1) frame = requestAnimationFrame(tick)
  }

  frame = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(frame)
}

/**
 * Sizes a canvas to a grid of cells covering the element, and returns the grid size.
 */
export const fitCanvas = (canvas: HTMLCanvasElement, box: Element, cell: number) => {
  const { width, height } = box.getBoundingClientRect()
  const columns = Math.max(1, Math.ceil(width / cell))
  const rows = Math.max(1, Math.ceil(height / cell))

  if (canvas.width !== columns) canvas.width = columns
  if (canvas.height !== rows) canvas.height = rows

  return { columns, rows }
}

const MAGNET_SPRING = 0.12
const MAGNET_DAMPING = 0.74

/**
 * A magnet point that trails the pointer on a spring and eases its strength in and out. Elements
 * warp their image toward it by sampling each cell from a point pushed away from the magnet,
 * while every cell keeps its own Bayer threshold, so the dither pattern stays regular.
 */
export class Magnet {
  x = 0
  y = 0
  strength = 0
  private vx = 0
  private vy = 0
  private velocity = 0
  private pointer: { x: number; y: number } | null = null

  constructor(
    private radius: number,
    private pull: number,
  ) {}

  /**
   * Points the magnet at a cell position. A fresh magnet starts there instead of flying in.
   */
  aim(x: number, y: number) {
    if (!this.pointer && this.strength < 0.05) {
      this.x = x
      this.y = y
    }
    this.pointer = { x, y }
  }

  release() {
    this.pointer = null
  }

  /**
   * Advances the springs by one frame. Returns false once the magnet has fully let go.
   */
  step() {
    const { pointer } = this

    if (pointer) {
      this.vx = (this.vx + (pointer.x - this.x) * MAGNET_SPRING) * MAGNET_DAMPING
      this.vy = (this.vy + (pointer.y - this.y) * MAGNET_SPRING) * MAGNET_DAMPING
      this.x += this.vx
      this.y += this.vy
    }

    const target = pointer ? 1 : 0
    this.velocity = (this.velocity + (target - this.strength) * MAGNET_SPRING) * MAGNET_DAMPING
    this.strength += this.velocity

    if (!pointer && Math.abs(this.strength) < 0.005 && Math.abs(this.velocity) < 0.005) {
      this.strength = 0
      this.velocity = 0
      return false
    }

    return true
  }

  /**
   * Returns how far to push a cell's sample point away from the magnet: 1 means no warp.
   */
  push(x: number, y: number) {
    if (this.strength <= 0.001) return 1

    const distance = Math.hypot(x - this.x, y - this.y)
    if (distance >= this.radius) return 1

    return 1 + this.pull * this.strength * (1 - distance / this.radius) ** 2
  }
}

/**
 * Converts a pointer event to cell coordinates on an element's grid.
 */
export const toCell = (el: Element, event: PointerEvent, columns: number, rows: number) => {
  const rect = el.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * columns,
    y: ((event.clientY - rect.top) / rect.height) * rows,
  }
}
