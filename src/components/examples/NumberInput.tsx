export default function NumberInput() {
  const keepNumberInRange = (value: number, min?: number, max?: number) => {
    if (min !== undefined && max !== undefined) {
      return Math.min(Math.max(value, min), max)
    }
    if (min !== undefined) {
      return Math.max(value, min)
    }
    if (max !== undefined) {
      return Math.min(value, max)
    }

    return value
  }

  const parseNumericValue = (value?: string | number | null) => {
    if (value === undefined || value === null) return undefined
    const parsed = Number.parseFloat(value.toString())

    return Number.isNaN(parsed) ? undefined : parsed
  }

  const preciseRound = (value: number, decimals = 2) => {
    const factor = 10 ** decimals

    return Math.round((value + Number.EPSILON) * factor) / factor
  }

  const handleKeyUp = (e: any) => {
    if (!["ArrowUp", "ArrowDown"].includes(e.key)) {
      return
    }

    const target = e.currentTarget
    const direction = e.key === "ArrowUp" ? 1 : -1
    const min = parseNumericValue(target.getAttribute("min"))
    const max = parseNumericValue(target.getAttribute("max"))
    const step = parseNumericValue(target.getAttribute("step")) || 1
    const value = parseNumericValue(target.value) || min || 0
    const increment = step * (e.metaKey ? 100 : e.shiftKey ? 10 : e.altKey ? 1 / 10 : 1)

    const newValue = preciseRound(value + direction * Math.max(increment, 0.1), 2)

    if (newValue !== value) {
      target.value = keepNumberInRange(newValue, min, max)
      e.preventDefault()
    }
  }

  return (
    <input
      type="number"
      className="py-1 px-3 border-2 rounded border-primary w-full [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      placeholder="Try me"
      min="0"
      max="100"
      step="1"
      onKeyDown={handleKeyUp}
    />
  )
}
