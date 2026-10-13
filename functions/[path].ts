import { createProxy } from "highseat/proxy"

interface Env {
  HIGHSEAT_PATH?: string
  HIGHSEAT_SECRET?: string
}

// The first-party Highseat proxy on the site's own path. `_routes.json`, written at build from
// `HIGHSEAT_PATH` (see astro.config.mjs), sends only that path here, so every page stays a static
// asset. The zone is a proxied Cloudflare record, so the visitor's IP is in `cf-connecting-ip`.
export const onRequest: PagesFunction<Env> = ({ request, env, next }) => {
  if (!env.HIGHSEAT_PATH || !env.HIGHSEAT_SECRET) return next()

  const proxy = createProxy({
    path: env.HIGHSEAT_PATH,
    secret: env.HIGHSEAT_SECRET,
    clientIp: "cloudflare",
    fallback: () => next(),
  })
  return proxy(request)
}
