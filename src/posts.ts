import { getCollection } from "astro:content"

/**
 * Whether this build includes draft posts: in dev, and on Cloudflare Pages preview builds (every
 * branch except `main`). Production builds and local `astro build` leave drafts out.
 */
const includeDrafts =
  import.meta.env.DEV || (!!process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== "main")

/**
 * Returns the posts this build publishes.
 */
export const getPosts = () => {
  return getCollection("posts", ({ data }) => includeDrafts || !data.isDraft)
}
