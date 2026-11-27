---
pubDate: 2026-12-03
title: "AI let me self-host without making it a hobby"
shortTitle: "Self-hosting without the hobby"
description: "I build products and never enjoyed running servers. Now I run more of my own stack than ever, and agents do the work."
tags: ["engineering", "ai", "side-projects"]
---

Jan-Lukas Else wrote a post called [AI made self-hosting fun again](https://janlukas.blog/posts/ai-self-hosting). He has self-hosted for years, lost the excitement, and got it back once AI agents took the friction out of trying things.

My story starts somewhere else. I never had the excitement to lose. I build products, and servers were the part I put up with so the products could run. I started on Vercel, then moved to Railway. Both still needed somewhere to run everything around the apps, like Postgres, ClickHouse and Redis. And I never knew what the bill would be. Once one of my sites got popular, I was paying over $100 a month.

That changed this year. I now run more of my own stack than ever, on a fixed bill, and I still don't spend my evenings on servers. Agents do the work. I decide what runs and what goes.

## The setup is a repo now

I wrote about [the whole setup](/posts/my-hosting-setup) last week: one Hetzner server for every app, a Mac mini at home for everything else, and Cloudflare in front. The short version of how it works is that every part of it is written down.

Agents read a set of Markdown notes before they touch anything. The notes say what runs where, how to reach it, and which systems need my approval. Every scheduled job is a script in the same git repo. So when I want to change something, I describe it, an agent does the work, and the change ends up in a commit I can read.

That's the same thing Jan-Lukas describes. Once the infrastructure lives in git, an agent can work on it like any other code.

## Deleting used to be the scary part

Adding a service was always easy. You follow the install guide and it runs. Removing one was the hard part, because you never quite know what still depends on it. Some old cron job, a DNS record, a webhook in another app. So things stayed, and the pile grew.

With agents, removing things got boring in a good way. An agent can search every repo, every DNS zone and every scheduled job for a reference before anything goes. It takes a final backup first. Then it deletes, and writes down what was removed and where the archive lives.

Here's what went in the last few months:

- **Plausible**, the analytics I self-hosted for my sites. Every site now reports to [Highseat](https://highseat.com/?utm_source=kulpinski.dev&utm_medium=blog&utm_campaign=self-hosting), my own analytics product, with its full history imported. The old data sits in an archive on R2 and on the mini.
- **n8n**, the automation tool. Its jobs became plain scripts, and the last one, a bot that likes posts on Bluesky, moved over this week.
- **Multica**, a platform I used to run agent jobs. The jobs run on the mini's own scheduler now.
- **Four servers.** Two cloud servers in September, when everything moved onto the one dedicated machine. An ARM server this week, after the last client site on it moved to shared hosting. And the CI runner on the mini, which I'll come back to.
- **A few products.** TerminalDock got shut down and its domain now redirects to [DevSuite](https://devsuite.co). Pastelot is up for sale.

Every one of those is one less thing to update, monitor and back up. The notes the agents read went from 530 KB to 160 KB in one cleanup, because so much of what they described no longer existed.

## Running a friend's project

Not everything I added is mine. A friend built [SESPulse](https://github.com/venelinkochev/sespulse), a dashboard for emails sent through Amazon SES. It shows deliveries, bounces and complaints for every domain I send from. I run it on the server from my own fork.

The fun part came after it broke. After a restart, the dashboard could start returning errors. The cause was one setting: the app listened on whichever network its container name pointed to, and after a restart that could be an internal one. An agent found it and fixed it in my fork, and both that fix and a second one went back to him as [pull requests](https://github.com/venelinkochev/sespulse/pulls).

A year ago I'd have read the error, decided it wasn't worth an evening, and gone back to a paid tool.

## Projects I wouldn't have started

The other change is that small, silly ideas now get built. The best example is [Isometric Kraków](https://isometrickrakow.com), an isometric map of my city.

It's a fork of an open source project that turns open map data into isometric cities. The buildings get painted by an AI image model, one tile at a time, and the tiles are served from Cloudflare R2.

Nothing about it makes money. It runs on the same setup as everything else, so it costs me close to nothing to keep online. That's the part that makes me start things like this.

## Not everything should be self-hosted

The agents made it cheap to try things, which also makes it easy to keep things that should go. I try to ask whether I'd notice a service was gone.

The CI runner is the clearest case. It ran on the Mac mini. It worked, but it was one more thing on a machine that also runs my monitoring and backups. In November I moved CI to [Ubicloud](https://www.ubicloud.com), a hosted service, and deleted the runner. That costs a little, and I'm fine with it.

Responsibility stays with me too. Agents change production for the apps that make money only after I approve it. Everything else, they fix and tell me afterwards.

## The dependency I'm keeping

Jan-Lukas finds it ironic that AI from big tech companies makes him less dependent on big tech. He mostly uses open-weight models, so he can switch providers.

I'm more dependent than he is. Everything runs through one Claude subscription. If it went away tomorrow, the agents would stop. The notes and scripts would stay, though. They're Markdown and shell scripts in a git repo, and any other agent, or I, could pick them up.

So I'm not a self-hosting hobbyist, and I don't expect to become one. More of my stack is mine than a year ago, and it has fewer moving parts. I didn't expect both at once when I started handing this work to agents.
