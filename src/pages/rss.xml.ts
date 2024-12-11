import { getCollection } from "astro:content"
import rss from "@astrojs/rss"
import type { APIRoute } from "astro"

export const GET: APIRoute = async () => {
  const posts = await getCollection("posts", ({ data }) => !data.isDraft)

  return rss({
    title: "Astro Learner | Blog",
    description: "My journey learning Astro",
    site: import.meta.env.SITE,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/posts/${post.slug}/`,
    })),
    customData: "<language>en-us</language>",
  })
}
