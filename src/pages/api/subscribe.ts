import type { APIRoute } from "astro"
import ky from "ky"
import { z } from "zod"

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData()
  const email = formData.get("email")

  const subscriberSchema = z.object({
    email: z.string().email().min(1),
    groups: z.array(z.string()).optional(),
  })

  const { data, success } = subscriberSchema.safeParse({ email })

  if (!success) {
    return new Response(JSON.stringify({ message: "Invalid email address" }), { status: 400 })
  }

  const response = await ky.post("https://connect.mailerlite.com/api/subscribers", {
    body: JSON.stringify(data),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${import.meta.env.MAILERLITE_API_TOKEN}`,
    },
  })

  if (!response.ok) {
    return new Response(JSON.stringify({ message: "Failed to subscribe" }), { status: 400 })
  }

  // Do something with the data, then return a success response
  return new Response(JSON.stringify({ message: "Thank you for subscribing!" }), { status: 200 })
}
