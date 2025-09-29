import { defineCollection, z } from "astro:content"
import { file } from "astro/loaders"

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
  loader: file("src/content/projects.json"),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    url: z.string().url().optional(),
    description: z.string().optional(),
    category: z.enum(["saas", "boilerplate", "directory"]),
  }),
})

export const collections = {
  posts: postsCollection,
  projects: projectsCollection,
}
