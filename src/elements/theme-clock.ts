const STORAGE_KEY = "theme"

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Warsaw",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

/**
 * Shows the local time in Kraków and toggles the theme when clicked. The choice is stored, and
 * the inline script in the page head applies it before first paint.
 */
class ThemeClock extends HTMLElement {
  private timer = 0

  connectedCallback() {
    const time = this.querySelector("[data-time]")
    const button = this.querySelector("button")

    const tick = () => {
      if (time) {
        time.textContent = formatter.format(new Date())
      }

      this.timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
    }

    tick()
    button?.addEventListener("click", this.toggle)
  }

  disconnectedCallback() {
    clearTimeout(this.timer)
    this.querySelector("button")?.removeEventListener("click", this.toggle)
  }

  private toggle = () => {
    const root = document.documentElement
    const next = root.dataset.theme === "dark" ? "light" : "dark"
    root.dataset.theme = next

    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be blocked. The theme still switches for this page view.
    }
  }
}

if (!customElements.get("theme-clock")) {
  customElements.define("theme-clock", ThemeClock)
}
