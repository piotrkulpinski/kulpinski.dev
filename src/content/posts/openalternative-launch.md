---
pubDate: 2024-03-15
title: Growing OpenAlternative to 100k Unique Visitors in one week
tags: ["side-projects", "marketing"]
---

I'm a software engineer by trade, but I've always been interested in marketing and growth. I've been working on a various side projects for a while now, and I recently hit a major success: **100,000 unique visitors in one week**.

Here's how I did it 👇

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Launch week is finished for OpenAlternative, so here are some juicy stats you&#39;ve all been waiting for 🚀<br><br>🧑‍🦰 100k Unique Visitors<br>🖱️ 800k Page Views<br>😻 450 <a href="https://twitter.com/ProductHunt?ref_src=twsrc%5Etfw">@ProductHunt</a> upvotes<br>💌 250 Newsletter Subscribers<br>⬆️ 300 New Followers<br>🧑‍💻 90 Stars on GitHub<br><br>And for the most important…</p>&mdash; Piotr Kulpinski (@piotrkulpinski) <a href="https://twitter.com/piotrkulpinski/status/1767108966603980866?ref_src=twsrc%5Etfw">March 11, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## The Idea

I was collecting a list of open-source software for a while. Mostly for my own use (to learn and reuse parts of the code), but I thought it would be cool to share it with others. I was also interested in learning more about SEO and growth, so I thought this would be a good project to experiment with.

I didn't want to spend a lot of time on it, so I decided to build it within **48 hours**.

With such a short time frame, I had to be very selective about the features I wanted to include. I decided to build a simple listing with no search or filtering.

## Curating the list

I started by expanding the list of open-source software. I used a combination of Google, Reddit, and GitHub to find the most popular open-source projects. I also used my own knowledge and experience to find lesser-known projects that I thought were worth including.

I didn't want to include every open-source project I could find. I wanted to keep the list high-quality and focused on the most popular, useful software and actively maintained projects. I **collected about 70 projects** in total.

## Building the site

[Astro](https://astro.build) was always on my list of things to learn. I've been using Remix and NextJS for a while, and I was interested in trying out a new framework. I decided it would be a good opportunity to build the site with it. This decision turned out to be a great one, as it saved me a lot of money on hosting costs later on.

While browsing the Astro documentation, I found out they have a pretty easy way to implement a [View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions) so I tought it would be a nice touch to the site.

For the backend, I opted for [Airtable](https://kulp.in/airtable) as a database. It's a simple, no-code solution that I've used before. It's not the most powerful database, but it's perfect for a project like this. I could easily add, edit, and delete records, and it has an embeddable form functionality that I used for user submissions.

![](https://i.imgur.com/eLxU165.jpg)

Unfortunately, Airtable's API isn't the best for querying data, so I used a [middleware service](https://baseql.com) to turn the Airtable API into a GraphQL API. This allowed me to query the data in a more flexible way.

With the data and the site structure in place, I started building the site. I used Tailwind CSS for the styling, and I was able to build the site in about **12 hours**. The good thing about having multiple projects under my belt is that I can reuse a lot of the code I've written before.

Building an Open Source listing, it was pretty obvious that I should open-source [the code](https://github.com/piotrkulpinski/openalternative) as well.

## GitHub Data and Programmatic SEO

To make the site more useful, I decided to include some data from GitHub. I've built a scheduled Cloudflare Worker that's pulling the GitHub API data to fetch the number of stars, forks, and issues for each project.

I also pulled some related tags from each repo, like what programming language it's written in, and what it's related to (e.g. CMS, CRM, etc.). I then put this data into Airtable and used it to generate lots of pages for **Programmatic SEO**.

It's too early to tell if this will have a big impact on SEO, but I think it's a good idea to have a lot of pages for Google to index. It's already ranking for some very competitive keywords like "open source alternatives" so I think it may work pretty well.

![](https://i.imgur.com/5pDIisz.png)

## Hosting

Since Astro is a static site generator, I could host the site for free on [Cloudflare](https://cloudflare.com). I've never used Cloudflare before, but they've been pretty popular lately due to their free hosting and CDN. I was impressed with how easy it was to set up, and the performance was great.

I then picked the simplest name I could find and registered [openalternative.co](https://openalternative.co) for $6.99.

## Launch(es)

### Twitter

Like always, I posted about it on [Twitter](https://twitter.com/piotrkulpinski/status/1764561508028326128). Given that I only had 900 followers and I usually tweet to the void, I didn't expect much. But to my surprise, the tweet got some attention. Nothing crazy, but it was a good start.

For the next few days I let it sit and see what happens. I was engaging with people on Twitter to get some feedback. One of such conversations was with [Steven Tey](https://twitter.com/steventey) who seemed to like the idea and decided to share it with his audience.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Just found my new favorite site → <a href="https://t.co/1kixcT9MuC">https://t.co/1kixcT9MuC</a><br><br>It&#39;s a curation of open-source alternatives to popular software, e.g. <a href="https://twitter.com/dubdotco?ref_src=twsrc%5Etfw">@dubdotco</a>, <a href="https://twitter.com/calcom?ref_src=twsrc%5Etfw">@calcom</a>, <a href="https://twitter.com/strapijs?ref_src=twsrc%5Etfw">@strapijs</a>, etc.<br><br>Built by <a href="https://twitter.com/piotrkulpinski?ref_src=twsrc%5Etfw">@piotrkulpinski</a> with <a href="https://twitter.com/astrodotbuild?ref_src=twsrc%5Etfw">@astrodotbuild</a>&#39;s magical View Transitions effect ✨<br><br>Best part: It has some of the… <a href="https://t.co/YpAt6n6UQv">pic.twitter.com/YpAt6n6UQv</a></p>&mdash; Steven Tey (@steventey) <a href="https://twitter.com/steventey/status/1765841867017437599?ref_src=twsrc%5Etfw">March 7, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

This was a huge boost for the site, as it got a lot of traffic from his tweet.

### Product Hunt

I knew I had to keep the momentum going, so I decided to post it on [Product Hunt](https://www.producthunt.com/posts/openalternative) the next day.

I still had some nice traffic to the site, so I've added a **custom PH banner** to the top of the site to let people know about the launch. I also posted about it on Twitter and LinkedIn.

With the help of the community, we were able to get **3rd place** on the day of the launch with over 500 upvotes. This was one of the most successful PH launches I've ever had.

![](https://i.imgur.com/BGlWT2U.png)

### Hacker News

Knowing that the site was getting some attention, I decided to post it on [Hacker News](https://news.ycombinator.com/item?id=39639386) as well.

I had a feeling that it would do well on HN, as I thought it would be a good fit for the community, but I didn't expect it to get this good.

The post immediately got featured on to the front page and quickly climbed to claim the **#1 spot on the site**. It got over 150 upvotes and stayed on the front page for a few hours.

Being featured on Product Hunt is great, but #1 on Hacker News is a whole different level. The traffic was insane. I was getting thousands of visitors every hour.

![](https://i.imgur.com/P6bjnhr.png)

### Reddit

In the same time, I was also posting about it on Reddit. I've posted it on a few subreddits, but the most successful one was on [r/SelfHosted](https://www.reddit.com/r/selfhosted/comments/1b9kfwn/a_collection_of_selfhostable_opensource_software/). It quicky got over **250 upvotes** and a lot of comments.

Unfortunately, I made a mistake by trying to monetize some of the traffic by adding a Stripe Pay link to the site. For $97, a project could be featured on the top of the list. I thought it would be a good way to monetize the site, but it was a mistake. I got a lot of negative feedback and I quickly removed it.

Due to that, reddit users quickly turned on me and the site. I was getting a lot of negative comments and downvotes, and the post was **removed from the subreddit**.

Still, the traffic was great and I was able to get a lot of feedback from the community.

## Summary

The site was a huge success. It got over **100,000 visitors in the first week**, and it's still getting a few thousand visitors every day. It was a great experiment in launching a side project and growth, and I learned a lot from it.

Hopefully, you'll be able to take something away from this story and apply it to your own projects. If you have any questions or feedback, feel free to reach out to me on [Twitter](https://twitter.com/piotrkulpinski).

If you want to check out the site, you can find it at [openalternative.co](https://openalternative.co).
