import rss from "@astrojs/rss"
import type { APIRoute } from "astro"
import { getPosts } from "~/posts"

export const GET: APIRoute = async () => {
  const posts = await getPosts()

  return rss({
    title: "Astro Learner | Blog",
    description: "My journey learning Astro",
    site: import.meta.env.SITE,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/posts/${post.id}/`,
    })),
    customData: "<language>en-us</language>",
  })
}
