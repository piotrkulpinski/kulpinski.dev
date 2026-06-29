import { defineCollection, z } from "astro:content"
import { file, glob } from "astro/loaders"

const postsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
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
    year: z.number(),
    month: z.number().int().min(1).max(12).optional(),
    url: z.string().url().optional(),
    description: z.string().optional(),
    category: z.enum(["saas", "boilerplate", "directory"]),
  }),
})

export const collections = {
  posts: postsCollection,
  projects: projectsCollection,
}
