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
    <section>
      <h3 class="font-display font-medium">Newsletter</h3>
      <p class="text-sm text-neutral-500">Get notified when I publish new posts.</p>

      <div class="mt-4">
        {responseMessage && <p class="text-sm text-green-600">{responseMessage}</p>}

        {!responseMessage && (
          <form
            class="relative w-full max-w-xs"
            onSubmit={onSubmit}
          >
            <input
              name="email"
              type="email"
              class="w-full rounded-md border bg-transparent px-3 py-2 pr-24 text-[13px] font-medium placeholder:text-inherit placeholder:opacity-40 disabled:opacity-50 dark:border-neutral-700"
              placeholder="Enter your email..."
              data-1p-ignore
              required
            />

            <button class="absolute inset-y-1 right-1 inline-flex items-center justify-center rounded bg-current px-3 py-1 text-[13px] duration-200 hover:opacity-80">
              <span class="invert">{isPending ? <Loader /> : "Subscribe"}</span>
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
