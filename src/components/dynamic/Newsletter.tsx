import ky from "ky"
import type { FormEventHandler } from "preact/compat"
import { useState } from "preact/hooks"
import Loader from "~/components/dynamic/Loader"

export default function Newsletter() {
  const [responseMessage, setResponseMessage] = useState("")
  const [isPending, setPending] = useState(false)

  const onSubmit: FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    setPending(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const data = await ky.post("/api/subscribe", { body: formData }).json<{ message: string }>()

    if (data.message) {
      setResponseMessage(data.message)
      setPending(false)
    }
  }

  return (
    <section className="mt-auto">
      <h3 className="font-medium lg:text-lg">Newsletter</h3>
      <p className="text-sm text-secondary">Get notified when I publish new posts.</p>

      <div className="mt-4">
        {responseMessage && <p className="text-sm text-primary">{responseMessage}</p>}

        {!responseMessage && (
          <form className="relative w-full max-w-xs" onSubmit={onSubmit}>
            <input
              name="email"
              type="email"
              className="w-full rounded-md border bg-background px-3 py-2 pr-24 text-[13px] font-medium disabled:opacity-50"
              placeholder="Enter your email..."
              data-1p-ignore
              required
            />

            <button
              type="submit"
              className="absolute inset-y-1 right-1 inline-flex items-center justify-center rounded bg-foreground px-3 py-1 text-[13px] duration-200 hover:opacity-80"
            >
              <span className="invert">{isPending ? <Loader /> : "Subscribe"}</span>
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
