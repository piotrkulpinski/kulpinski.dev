import { useState } from "preact/hooks"
import Loader from "~/components/dynamic/Loader"

export default function Newsletter() {
  const [responseMessage, setResponseMessage] = useState("")
  const [isPending, setPending] = useState(false)

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    setPending(true)

    const formData = new FormData(e.target as HTMLFormElement)

    const response = await fetch("/api/subscribe", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (data.message) {
      setResponseMessage(data.message)
      setPending(false)
    }
  }

  return (
    <section class="mt-auto">
      <h3 class="font-medium lg:text-lg">Newsletter</h3>
      <p class="text-sm text-secondary">Get notified when I publish new posts.</p>

      <div class="mt-4">
        {responseMessage && <p class="text-sm text-primary">{responseMessage}</p>}

        {!responseMessage && (
          <form class="relative w-full max-w-xs" onSubmit={onSubmit}>
            <input
              name="email"
              type="email"
              class="w-full rounded-md border bg-background px-3 py-2 pr-24 text-[13px] font-medium disabled:opacity-50"
              placeholder="Enter your email..."
              data-1p-ignore
              required
            />

            <button class="absolute inset-y-1 right-1 inline-flex items-center justify-center rounded bg-foreground px-3 py-1 text-[13px] duration-200 hover:opacity-80">
              <span class="invert">{isPending ? <Loader /> : "Subscribe"}</span>
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
