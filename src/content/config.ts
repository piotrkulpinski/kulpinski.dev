import { defineCollection, z } from "astro:content"

const postsCollection = defineCollection({
  schema: ({ image }) =>
    z.object({
      isDraft: z.boolean().optional(),
      title: z.string(),
      pubDate: z.date(),
      description: z.string().optional(),
      author: z.string().optional(),
      image: image().optional(),
      ogImage: image().optional(),
      tags: z.array(z.string()),
    }),
})

const projectsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    year: z.number(),
    url: z.string().url().optional(),
    description: z.string().optional(),
  }),
})

const toolsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    url: z.string().url().optional(),
    image: z.string().url().optional(),
  }),
})

export const collections = {
  posts: postsCollection,
  projects: projectsCollection,
  tools: toolsCollection,
}
