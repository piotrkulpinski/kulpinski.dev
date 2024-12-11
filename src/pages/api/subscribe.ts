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

  try {
    const subscriber = subscriberSchema.parse({ email })

    await ky.post("https://connect.mailerlite.com/api/subscribers", {
      body: JSON.stringify(subscriber),
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.MAILERLITE_API_TOKEN}`,
      },
    })

    // Do something with the data, then return a success response
    return new Response(JSON.stringify({ message: "Thank you for subscribing!" }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 400 })
  }
}
