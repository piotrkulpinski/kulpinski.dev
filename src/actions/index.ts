import { defineAction } from "astro:actions"
import { MAILERLITE_API_TOKEN } from "astro:env/server"
import { z } from "astro:schema"

export const server = {
  subscribe: defineAction({
    accept: "form",
    input: z.object({
      email: z
        .string({
          message: "Please enter a valid email address",
        })
        .email({
          message: "Please enter a valid email address",
        }),
    }),
    handler: async ({ email }) => {
      try {
        await fetch("https://connect.mailerlite.com/api/subscribers", {
          method: "POST",
          body: JSON.stringify({ email }),
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${MAILERLITE_API_TOKEN}`,
          },
        })

        return { message: "Thank you for subscribing!" }
      } catch (error) {
        console.error(error)
      }
    },
  }),
}
