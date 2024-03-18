import type { APIRoute } from "astro"
import ky from "ky"
import { z } from "zod"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData()
  const email = data.get("email")

  const subscriberSchema = z.object({
    email: z.string().email().min(1),
    groups: z.array(z.string()).optional(),
  })

  const subscriber = subscriberSchema.parse({ email })

  const response = await ky.post("https://connect.mailerlite.com/api/subscribers", {
    body: JSON.stringify(subscriber),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${import.meta.env.MAILERLITE_API_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Fetch error: ${response}`)
  }

  // Do something with the data, then return a success response
  return new Response(JSON.stringify({ message: "Thank you for subscribing!" }), { status: 200 })
}
