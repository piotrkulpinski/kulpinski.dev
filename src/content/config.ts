import { defineCollection, z } from "astro:content"

const postsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string().optional(),
    author: z.string().optional(),

    image: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),

    tags: z.array(z.string()),
  }),
})

export const collections = {
  posts: postsCollection,
}
