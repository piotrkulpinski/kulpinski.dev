---
pubDate: 2024-12-11
title: How to post a link with embed card on Bluesky with JavaScript
description: Learn how to post a link with an OpenGraph card on Bluesky using JavaScript. This tutorial covers the basics of Bluesky's API and how to use it to create a custom link preview.
tags: ["bluesky", "engineering", "atproto"]
image: ./images/embed-card-links-on-bluesky.webp
---

As [Bluesky](https://bsky.app) continues to gain popularity, more tools are being developed around it. One of the most popular applications is post scheduling and automation.

However, Bluesky's API currently doesn't offer a direct way to post links with OpenGraph cards. This can be a challenge for users who want to share links with attractive previews.

In this tutorial, we'll show you how to use JavaScript to post a link on Bluesky with a embed card. This method works around the API limitation, allowing you to share links more effectively.

Let's get started!

## Posting on Bluesky using JavaScript API

Working with Bluesky API is pretty simple. The [docs](https://docs.bsky.app/docs/get-started) are pretty good. First up, we need to install the `@atproto/api` package from NPM:

```bash
npm install @atproto/api
```

Next, we create an instance of the Bluesky Agent and login with your Bluesky credencials.

I recommend creating a new [App Password](https://bsky.app/settings/app-passwords) for your Bluesky account, rather than using your main password. This will make it easier to revoke access if needed and keep your main account secure. Also make sure to set the `BLUESKY_USERNAME` and `BLUESKY_PASSWORD` environment variables in your project.

```ts
import { AtpAgent } from "@atproto/api"

const getBlueskyAgent = async () => {
  const agent = new AtpAgent({
    service: "https://bsky.social",
  })

  await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  })

  return agent
}
```

Once you have the agent, you can use it to post to Bluesky which is pretty straightforward.

```ts
/**
 * Send a post to Bluesky
 * @param text - The text of the post
 */
export const sendBlueskyPost = async (text: string, url?: string) => {
  const agent = await getBlueskyAgent()

  await agent.post({ text })
}
```

And there you have it, you just sent a post to Bluesky. Unfortunately, even if you include a link in the text of your post, it isn't automatically converted into an anchor link. We'll fix that shortly.

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:kv4ydqtva55jkyigrldc472e/app.bsky.feed.post/3lczxfsahah2d" data-bluesky-cid="bafyreie2pfyprgdk5rojipf6sjigtqvcv76wss4jnsrys45kn434b2tpta"><p lang="">Dub — Link management for modern marketing teams

⭐ Stars: 18,999
🔗 Forks: 2,059
⏩ Last commit: 11 days ago
⌛ First commit: 2 years ago

https://openalternative.co/dub</p>&mdash; OpenAlternative (<a href="https://bsky.app/profile/did:plc:kv4ydqtva55jkyigrldc472e?ref_src=embed">@openalternative.co</a>) <a href="https://bsky.app/profile/did:plc:kv4ydqtva55jkyigrldc472e/post/3lczxfsahah2d?ref_src=embed">December 11, 2024 at 3:23 PM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

## Detect Faceted Links on Bluesky Automatically

When you include a link in your post text on Bluesky, it isn't automatically turned into an anchor link. Instead, it appears as plain text.

To fix this, you need to detect the links and convert them into faceted links.

While there are manual methods to achieve this, fortunately, ATProto provides a `RichText` class that can automatically detect links and convert them into faceted links.

```ts
import { RichText } from "@atproto/api"

/**
 * Send a post to Bluesky
 * @param text - The text of the post
 */
export const sendBlueskyPost = async (text: string) => {
  const agent = await getBlueskyAgent()
  const rt = new RichText({ text })
  await rt.detectFacets(agent)

  await agent.post({
    text: rt.text,
    facets: rt.facets,
  })
}
```

That's great, but we still need to add the embed card to the post. Let's do that next.

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:kv4ydqtva55jkyigrldc472e/app.bsky.feed.post/3lczxg4ppks2x" data-bluesky-cid="bafyreiah3jkp2jcuj56ktrp2xyhmv4wnfyi2wo2umaypu4fraul2xza7k4"><p lang="">Dub — Link management for modern marketing teams

⭐ Stars: 18,999
🔗 Forks: 2,059
⏩ Last commit: 11 days ago
⌛ First commit: 2 years ago

https://openalternative.co/dub</p>&mdash; OpenAlternative (<a href="https://bsky.app/profile/did:plc:kv4ydqtva55jkyigrldc472e?ref_src=embed">@openalternative.co</a>) <a href="https://bsky.app/profile/did:plc:kv4ydqtva55jkyigrldc472e/post/3lczxg4ppks2x?ref_src=embed">December 11, 2024 at 3:23 PM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

## Creating an Embed Card on Bluesky

Including a link in your post is great, but it's even better if you can add a embed card.

To achieve this, we need to use the [Website card embed](https://docs.bsky.app/docs/advanced-guides/posts#website-card-embeds) feature of Bluesky. Essentially, you add an embed key to your post that includes, at a minimum, a URL, title, and description.

There are several ways to obtain the required data. If you know it at the time of posting, you can simply hardcode it. Otherwise, you can scrape the URL to gather the title, description, and image.

However, I find the easiest way is to use the [Dub.co Metatags API](https://dub.co/tools/metatags) to fetch the URL metadata and then create the embed card from that. Let's see how that works.

```ts
type Metadata = {
  title: string
  description: string
  image: string
}

/**
 * Get the URL metadata
 * @param url - The URL to get the metadata for
 * @returns The metadata
 */
const getUrlMetadata = async (url: string) => {
  const req = await fetch(`https://api.dub.co/metatags?url=${url}`)
  const metadata: Metadata = await req.json()

  return metadata
}
```

We created a simple function that fetches the URL metadata and then returns the data in a clear format.

Next, let's create a function that uses the metadata to upload the image to Bluesky and then create the embed card.

```ts
const getBlueskyEmbedCard = async (url: string | undefined, agent: AtpAgent) => {
  if (!url) return

  try {
    const metadata = await getUrlMetadata(url)
    const blob = await fetch(metadata.image).then(r => r.blob())
    const { data } = await agent.uploadBlob(blob, { encoding: "image/jpeg" })

    return {
      $type: "app.bsky.embed.external",
      external: {
        uri: url,
        title: metadata.title,
        description: metadata.description,
        thumb: data.blob,
      },
    }
  } catch (error) {
    console.error("Error fetching embed card:", error)
    return
  }
}
```

Once we have the embed card, we can add it to the post.

```ts
export const sendBlueskyPost = async (text: string, url?: string) => {
  const agent = await getBlueskyAgent()
  const rt = new RichText({ text })
  await rt.detectFacets(agent)

  await agent.post({
    text: rt.text,
    facets: rt.facets,
    embed: await getBlueskyEmbedCard(url, agent),
  })
}
```

Now we have a function that sends a post to Bluesky with an embed card.

<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:kv4ydqtva55jkyigrldc472e/app.bsky.feed.post/3lczxgeq4ot2g" data-bluesky-cid="bafyreihjyklrwippt4hzl7umncblhyahsegtqppxl6g2esdeddcely3yy4"><p lang="">Dub — Link management for modern marketing teams

⭐ Stars: 18,999
🔗 Forks: 2,059
⏩ Last commit: 11 days ago
⌛ First commit: 2 years ago

https://openalternative.co/dub<br><br><a href="https://bsky.app/profile/did:plc:kv4ydqtva55jkyigrldc472e/post/3lczxgeq4ot2g?ref_src=embed">[image or embed]</a></p>&mdash; OpenAlternative (<a href="https://bsky.app/profile/did:plc:kv4ydqtva55jkyigrldc472e?ref_src=embed">@openalternative.co</a>) <a href="https://bsky.app/profile/did:plc:kv4ydqtva55jkyigrldc472e/post/3lczxgeq4ot2g?ref_src=embed">December 11, 2024 at 3:23 PM</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>

## Complete Example

Hopefully, if you have followed along, you should have a complete code by now. If not, here is the complete code that you can copy and paste into your project. It:
- Creates a Bluesky agent
- Fetches the URL metadata
- Creates an embed card
- Sends a post to Bluesky with the embed card and automatically detects faceted links


```ts
import { AtpAgent, RichText } from "@atproto/api"

type Metadata = {
  title: string
  description: string
  image: string
}

/**
 * Get the URL metadata
 * @param url - The URL to get the metadata for
 * @returns The metadata
 */
const getUrlMetadata = async (url: string) => {
  const req = await fetch(`https://api.dub.co/metatags?url=${url}`)
  const metadata: Metadata = await req.json()

  return metadata
}

/**
 * Get the Bluesky embed card
 * @param url - The URL to get the embed card for
 * @param agent - The Bluesky agent
 * @returns The embed card
 */
const getBlueskyEmbedCard = async (url: string | undefined, agent: AtpAgent) => {
  if (!url) return

  try {
    const metadata = await getUrlMetadata(url)
    const blob = await fetch(metadata.image).then(r => r.blob())
    const { data } = await agent.uploadBlob(blob, { encoding: "image/jpeg" })

    return {
      $type: "app.bsky.embed.external",
      external: {
        uri: url,
        title: metadata.title,
        description: metadata.description,
        thumb: data.blob,
      },
    }
  } catch (error) {
    console.error("Error fetching embed card:", error)
    return
  }
}

/**
 * Get the Bluesky agent
 * @returns The Bluesky agent
 */
const getBlueskyAgent = async () => {
  const agent = new AtpAgent({
    service: "https://bsky.social",
  })

  await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  })

  return agent
}

/**
 * Send a post to Bluesky
 * @param text - The text of the post
 * @param url - The URL to include in the post
 */
export const sendBlueskyPost = async (text: string, url?: string) => {
  const agent = await getBlueskyAgent()
  const rt = new RichText({ text })
  await rt.detectFacets(agent)

  await agent.post({
    text: rt.text,
    facets: rt.facets,
    embed: await getBlueskyEmbedCard(url, agent),
  })
}
```

I hope you found this tutorial helpful and that you will consider using it in your own projects.

Happy posting!


