import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import type { CollectionEntry } from "astro:content"
import { getOpenGraphTemplateResponse } from "~/utils/opengraph"

export async function getStaticPaths() {
  const posts = await getCollection("posts", ({ data }) => !data.isDraft)

  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }))
}

export const GET: APIRoute = async ({ props: { post } }) => {
  const { title, pubDate, tags } = (post as CollectionEntry<"posts">).data

  return await getOpenGraphTemplateResponse({ title, pubDate, tags })
}
