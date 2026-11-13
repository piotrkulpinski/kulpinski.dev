/**
 * Shared helpers for the dithered canvas elements.
 */
export type Rgb = [number, number, number]

/**
 * The 4x4 Bayer matrix, normalized to thresholds between 0 and 1.
 */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  value => (value + 0.5) / 16,
)

let probe: CanvasRenderingContext2D | null = null

/**
 * Returns the Bayer threshold for a cell.
 */
export function bayer(x: number, y: number) {
  return BAYER[(y & 3) * 4 + (x & 3)]
}

/**
 * Returns the cell size in CSS pixels, snapped to whole device pixels so cells stay sharp.
 */
export function cellSize(base = 1.5) {
  const ratio = window.devicePixelRatio ?? 1
  return Math.max(1, Math.round(base * ratio)) / ratio
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Resolves a CSS custom property on an element to an RGB triple.
 */
export function readColor(element: Element, property: string): Rgb {
  // An unset property reads as an empty string, which falls back to black.
  const value = getComputedStyle(element).getPropertyValue(property).trim() || "#000"

  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  if (!probe) {
    return [0, 0, 0]
  }

  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = value
  probe.fillRect(0, 0, 1, 1)

  const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data
  return [red, green, blue]
}

/**
 * Calls back when the theme changes, either from the toggle or from the system setting. Returns
 * a function that stops listening.
 */
export function onThemeChange(callback: () => void) {
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
 * Runs a 0 to 1 progress animation with an ease-out curve. Under reduced motion it jumps
 * straight to 1. Returns a cancel function.
 */
export function animateProgress(duration: number, onFrame: (progress: number) => void) {
  if (prefersReducedMotion()) {
    onFrame(1)
    return () => {}
  }

  const start = performance.now()
  let frame = 0

  function tick(now: number) {
    const elapsed = Math.min(1, (now - start) / duration)
    onFrame(1 - (1 - elapsed) ** 3)

    if (elapsed < 1) {
      frame = requestAnimationFrame(tick)
    }
  }

  frame = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(frame)
}

/**
 * Sizes a canvas to a grid of cells covering the element, and returns the grid size.
 */
export function fitCanvas(canvas: HTMLCanvasElement, box: Element, cell: number) {
  const { width, height } = box.getBoundingClientRect()
  const columns = Math.max(1, Math.ceil(width / cell))
  const rows = Math.max(1, Math.ceil(height / cell))

  if (canvas.width !== columns) {
    canvas.width = columns
  }

  if (canvas.height !== rows) {
    canvas.height = rows
  }

  return { columns, rows }
}

/**
 * Writes one opaque pixel into an image buffer.
 */
export function paint(data: Uint8ClampedArray, offset: number, [red, green, blue]: Rgb) {
  data[offset] = red
  data[offset + 1] = green
  data[offset + 2] = blue
  data[offset + 3] = 255
}
