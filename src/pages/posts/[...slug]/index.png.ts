import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import type { CollectionEntry } from "astro:content"
import { getOpenGraphTemplateResponse } from "~/utils/opengraph"

export async function getStaticPaths() {
  const blogEntries = await getCollection("posts")

  return blogEntries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }))
}

export const GET: APIRoute = async ({ request, props: { entry } }) => {
  const { title, pubDate, tags } = (entry as CollectionEntry<"posts">).data

  return await getOpenGraphTemplateResponse(request, { title, pubDate, tags })
}
