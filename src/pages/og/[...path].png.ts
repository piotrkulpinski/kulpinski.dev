import type { APIRoute, GetStaticPaths } from "astro"
import { renderHomeCard, renderPageCard } from "~/og/card"
import { getPosts } from "~/posts"
import { formatDate } from "~/utils"

interface PageCard {
  kind: "page"
  seed: string
  eyebrow: string
  title: string
  footer: string
}

interface HomeCard {
  kind: "home"
}

type Props = PageCard | HomeCard

function pluralize(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

/**
 * One Open Graph image per page: `/og/home.png`, `/og/posts/<id>.png`, `/og/posts.png`,
 * `/og/tags.png` and `/og/tags/<tag>.png`. `BaseLayout` points each page at its own.
 */
export const getStaticPaths = (async () => {
  const posts = await getPosts()
  const tags = Map.groupBy(
    posts.flatMap(post => post.data.tags),
    tag => tag,
  )

  const postCards = posts.map(post => ({
    params: { path: `posts/${post.id}` },
    props: {
      kind: "page",
      seed: post.id,
      eyebrow: post.data.tags[0] ? `#${post.data.tags[0]}` : "Writing",
      title: post.data.title,
      footer: formatDate(post.data.pubDate),
    } satisfies PageCard,
  }))

  const tagCards = [...tags].map(([tag, items]) => ({
    params: { path: `tags/${tag}` },
    props: {
      kind: "page",
      seed: tag,
      eyebrow: "Tag",
      title: `#${tag}`,
      footer: pluralize(items.length, "post"),
    } satisfies PageCard,
  }))

  return [
    { params: { path: "home" }, props: { kind: "home" } satisfies HomeCard },
    {
      params: { path: "posts" },
      props: {
        kind: "page",
        seed: "posts",
        eyebrow: "Writing",
        title: "Notes on software, SEO, open source, and shipping small things.",
        footer: pluralize(posts.length, "post"),
      } satisfies PageCard,
    },
    {
      params: { path: "tags" },
      props: {
        kind: "page",
        seed: "tags",
        eyebrow: "Tags",
        title: "Browse posts by topic.",
        footer: pluralize(tags.size, "tag"),
      } satisfies PageCard,
    },
    ...postCards,
    ...tagCards,
  ]
}) satisfies GetStaticPaths

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = props.kind === "home" ? await renderHomeCard() : await renderPageCard(props)

  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } })
}
