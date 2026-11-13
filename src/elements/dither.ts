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
