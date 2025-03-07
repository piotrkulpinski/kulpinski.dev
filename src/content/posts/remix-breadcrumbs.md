---
pubDate: 2024-03-28
title: How to build dynamic breadcrumbs in Remix.run
description: Learn to build dynamic breadcrumbs in Remix, enhancing site navigation and SEO. This guide covers useMatches/handle capabilities, and schema metadata.
tags: ["engineering", "remix"]
image: ./images/remix-breadcrumbs.webp
---

In Remix, building dynamic breadcrumbs that reflect your route hierarchy is straightforward. This tutorial will guide you through leveraging the `useMatches` and `handle` capabilities to achieve this.

We'll also cover how to add schema metadata to your breadcrumbs for better SEO and social sharing.

## The Basics

**Breadcrumbs** are a navigation aid that helps users understand their current location within a website. They typically appear horizontally at the top of a page and show the hierarchy of the current page in relation to the site structure.

Here's an example of what breadcrumbs code could look like:

```html
<ol itemscope itemtype="https://schema.org/BreadcrumbList">
  <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
    <a href="https://example.com/" itemprop="item">
      <span itemprop="name">Home</span>
    </a>
    <meta itemprop="position" content="1" />
  </li>

  <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
    <a href="https://example.com/posts" itemprop="item">
      <span itemprop="name">Posts</span>
    </a>
    <meta itemprop="position" content="2" />
  </li>

  <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
    <a href="https://example.com/posts/slug" itemprop="item">
      <span itemprop="name">Post Title</span>
    </a>
    <meta itemprop="position" content="3" />
  </li>
</ol>
```

Now, let's see how to build dynamic breadcrumbs in Remix.

## Defining the Breadcrumbs Components

Let's start by creating the necessary component that we'll later use to render the breadcrumbs.

We'll need a `Breadcrumbs` component to render the list of breadcrumbs and a `BreadcrumbsItem` component to render each breadcrumb item.

Start by defining a wrapper component that will list all of the breadcrumbs.

```tsx
// app/components/Breadcrumbs.tsx
import { UIMatch, useMatches } from "@remix-run/react"
import { Fragment, HTMLAttributes } from "react"

type BreadcrumbMatch = UIMatch<
  Record<string, unknown>,
  { breadcrumb: (data?: unknown) => JSX.Element }
>

export const Breadcrumbs = ({ ...props }: HTMLAttributes<HTMLElement>) => {
  const matches = (useMatches() as unknown as BreadcrumbMatch[]).filter(
    ({ handle }) => handle?.breadcrumb
  )

  return (
    <ol
      itemScope
      itemType="https://schema.org/BreadcrumbList"
      className="flex flex-wrap items-center gap-2.5"
      {...props}
    >
      {matches.map(({ handle, data }, i) => (
        <Fragment key={i}>
          <li
            className="contents"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {i > 0 && <span className="text-sm">/</span>}
            {handle.breadcrumb(data)}
            <meta itemProp="position" content={`${i + 1}`} />
          </li>
        </Fragment>
      ))}
    </ol>
  )
}
```

In the example above, we're using the `useMatches` hook to get the current route matches. We then filter the matches to only include those that have a `breadcrumb` handle. We will define this handle in the routes where we want to include a breadcrumb. We then iterate over the matches and render the breadcrumb component for each match.

You may have noticed that we're also passing a `data` prop to the `handle.breadcrumb` function. This is because the `breadcrumb` handle can accept data from the route loader. We'll see how to pass data to the breadcrumb handle in the next section.

Next, let's define the `BreadcrumbsItem` component that we'll use to render each breadcrumb item.

```tsx
// app/components/BreadcrumbsItem.tsx
import { Link } from "@remix-run/react"
import { HTMLAttributes } from "react"

export const BreadcrumbsItem = ({ children, ...props }: HTMLAttributes<HTMLElement>) => {
  return (
    <Link to={props.href} itemProp="item" {...props}>
      <span itemProp="name">{children}</span>
    </Link>
  )
}
```

Now that we have our components, let's define the breadcrumbs in our routes.

## Defining the handles in the Routes

In the routes where you want to include breadcrumbs, you need to define a `breadcrumb` handle that will render the breadcrumb item.

For example, let's define the following routes:

- `/` - Home
- `/posts` - Posts
- `/posts/$slug` - Post Details

```tsx
// app/routes/index.tsx
import { BreadcrumbsItem } from "~/components/BreadcrumbsItem"

export const handle = {
  breadcrumb: () => <BreadcrumbsItem to="/">Home</BreadcrumbsItem>,
}

export default function Index() {
  return <h1>Home</h1>
}
```

```tsx
// app/routes/posts/index.tsx
import { BreadcrumbsItem } from "~/components/BreadcrumbsItem"

export const handle = {
  breadcrumb: () => <BreadcrumbsItem to="/posts">Posts</BreadcrumbsItem>,
}

export default function Posts() {
  return <h1>Posts</h1>
}
```

```tsx
// app/routes/posts.$slug.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { BreadcrumbsItem } from "~/components/BreadcrumbsItem"

export const handle = {
  breadcrumb: (data: { title: string; slug: string }) => (
    <BreadcrumbsItem to={`/posts/${data.slug}`}>{data.title}</BreadcrumbsItem>
  ),
}

export const loader = ({ params }: LoaderFunctionArgs) => {
  const post = {
    title: "Example Post",
    slug: "example-post",
  }

  return json(post)
}

export default function Post() {
  const { title } = useLoaderData<typeof loader>()

  return <h1>{title}</h1>
}
```

In the last route, we're using the `loader` function to fetch the post data. We then pass this data to the `breadcrumb` handle to render the breadcrumb item. This allows us to dynamically generate the breadcrumb item based on the post data.

## Conclusion

Hopefully, this guide has helped you understand how to implement breadcrumbs in your Remix application.

If you're interested to see how breadcrumbs can be implemented in a real-world application, you can check out the [OpenAlternative](https://openalternative.co) project, or check out the [source code](https://github.com/piotrkulpinski/openalternative).

If you have any questions or need further clarification, feel free to reach out to me on [Twitter](https://twitter.com/piotrkulpinski).
