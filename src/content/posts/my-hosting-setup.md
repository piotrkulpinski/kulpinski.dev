---
isDraft: false
pubDate: 2026-11-28
title: "How I run 12 apps on one server, a Mac mini and a lot of agents"
shortTitle: "One server, a Mac mini and agents"
description: "The whole setup behind my sites: one €59 Hetzner server, a Mac mini at home, Cloudflare in front, alerts on my phone, and AI agents doing most of the work."
tags: ["engineering", "side-projects", "ai"]
image: ./images/my-hosting-setup.png
imageDark: ./images/my-hosting-setup-dark.png
---

This week I [posted on X](https://x.com/piotrkulpinski/status/2125921575040168198) about testing what happens when my only server dies. The replies asked about Ansible, NixOS, Cloudflare and second servers, and I realized I'd never written down the whole setup.

So here it is: where everything runs, how I know when something breaks, where the backups go, and how AI agents ended up doing most of the work.

I'm not a DevOps person. I build products, and I want the boring parts to stay boring. Everything below came out of that.

## One server for everything

All 12 of my apps run on one dedicated server at Hetzner. That's [OpenAlternative](https://openalternative.co), [EuroAlternative](https://euroalternative.eu), [Highseat](https://highseat.com/?utm_source=kulpinski.dev&utm_medium=blog&utm_campaign=setup), [Revinel](https://revinel.com), [DevSuite](https://devsuite.co), [Dirstarter](https://dirstarter.com) and the smaller ones, plus every database behind them.

It costs **€59 a month**. For that I get 64 GB of RAM, and my apps use under 10. It was a deal Hetzner doesn't offer anymore, so I treat this machine with care.

It wasn't always like this. Until September, the apps were spread over a handful of cheap cloud servers. I moved them all onto this one because I wanted a simpler setup: fewer machines to set up and look after, and one powerful server instead of several weak ones. Since then I've been moving everything else in too. The tool that deploys everything moved there this week, from the Mac mini.

That tool is [Dokploy](https://dokploy.com), an open source, self-hosted alternative to Vercel or Heroku. I push to GitHub, and the app gets built and deployed. A few of the bigger apps are built on GitHub first, and the server only downloads the finished result. Each app runs in its own Docker container, next to its own Postgres database and, where needed, Redis or a search engine.

The server's two disks mirror each other, so one can die without taking anything down. One did, and it went unnoticed for weeks. More on that below.

## Cloudflare in front

Every site sits behind [Cloudflare](https://cloudflare.com). The server only accepts web traffic that comes through it, so nobody can reach the apps directly.

All my domains are on Cloudflare's free plan. The only thing I pay for is Workers, Cloudflare's small serverless functions, because Highseat needs more processing time per request than the free tier allows.

Cloudflare is also where I deal with bots. OpenAlternative, EuroAlternative and DevSuite block a few countries outright, because scrapers from there got past the softer challenges at scale. I accepted losing about 5 real visitors a day in exchange.

The admin side is private. The Dokploy dashboard sits behind an extra login, and the databases are only reachable over [Tailscale](https://tailscale.com), a private network between my own machines. From anywhere else, there's nothing to connect to.

## A Mac mini at home

The second machine is a Mac mini M4 with 16 GB of RAM, sitting at home. It doesn't host any public site. It does almost everything else:

- watches the server and every site, and sends me alerts
- keeps a second copy of the backups
- runs [Immich](https://immich.app), which replaced iCloud Photos for me
- runs the scheduled agent jobs I'll get to below
- is my remote dev machine, so agents can work on my projects while my laptop is closed

Running it at home has a cost. It depends on my home internet and power. A macOS update can leave it stuck on a setup screen where nothing starts, and in that state it can't tell me anything.

## Knowing when something breaks

The mini runs [Grafana](https://grafana.com), a dashboard and alerting tool, and Prometheus, which collects the numbers it shows. Together they track how the server, each app and each database is doing. The mini also opens every public site from the outside to check it still answers.

Alerts go to my phone on Telegram. Real outages, like a site or a database going down, wake me up at any hour. Warnings, like a disk filling up or a backup running late, wait until 7 in the morning.

Most of those alerts exist because something went wrong once. The dead disk is the clearest example. The server kept running on the other one, so nothing looked broken, and nothing told me. Now a failed disk is an alert.

The mini can't report its own death, though. So an outside service, [Better Stack](https://betterstack.com), expects a ping from it every 30 minutes and emails me when it stops. A small job on the mini also checks itself every 30 minutes: that the containers are up, the external disk is mounted, and the private network still reaches the server.

## Backups, and backups of backups

Every database is backed up daily to [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/), Cloudflare's file storage. Highseat's main database is backed up every hour. Dokploy backs up its own settings, and the server backs up its own configuration every night.

Every hour, the mini copies all of it to a 4 TB external disk at home, and keeps 60 days. If the server and my Cloudflare account were both gone, I'd still have a copy. My photos go one step further: they're backed up every night to a Hetzner Storage Box for €3.20 a month.

Each backup has an alert that fires if it stops arriving. A backup that quietly stopped running last month is worse than no backup, because you think you have one.

This week I tested all of this by rebuilding every app on a fresh server, from backups only. That's the next post, on Monday.

## Agents run most of it

I didn't set most of this up by hand. AI agents did, mostly [Claude Code](https://www.anthropic.com/claude-code), with me approving the parts that matter.

That only works because agents know the setup before they touch it. They read a set of Markdown notes first, which Claude Code calls a skill. It says what runs where, how to reach it, and what not to touch. A few rules keep it useful.

The notes only describe today. When something changes, the old text gets replaced, and the history goes into git. A doc full of dated "update" notes gets agents to follow instructions that stopped being true months ago.

Every lesson becomes one rule with one reason. My database backups look like plain SQL files but aren't, so the usual tool reads them as garbage and still reports success. That's one line in the notes now, so the next agent doesn't repeat it.

Risk is measured in money. OpenAlternative, EuroAlternative, Revinel and Highseat make money or hold other people's data, so any change to them in production needs my approval. Everything else, agents fix and tell me afterwards. My most awkward database is on the low-risk list. The list follows the money, and how hard a system is to work on doesn't count.

Agents never see the keys. They read credentials from a password manager vault they can only read, or they call APIs through [Executor](https://executor.sh), a gateway on the mini that keeps the keys and makes the call for them. Nothing gets pasted into a chat.

And the notes get checked. Every Saturday, an agent compares them with the live servers and opens a pull request when they disagree. Nothing changes until I merge it.

Then there are the jobs that run on their own. The mini runs about a dozen of them on a schedule, and they report to Slack:

- Every morning, a digest of domains ending at auction that day, picked for how brandable they are.
- Every Monday, an agent scores new OpenAlternative submissions from 0 to 100 and deletes the spam.
- For every new event on OpenAlternative and EuroAlternative, an agent writes a fresh social post.
- Every 15 minutes, an agent sorts my email and drafts replies in my voice. It never sends anything. Once a week, another one looks at which drafts I sent, edited or deleted, and proposes fixes.
- Every Sunday, an agent tidies up what the other agents wrote down in their memory.

Until recently, some of this ran in n8n, some in paid tools, and some just didn't happen. Now every job is a script in one git repo, most with a prompt next to it, and an agent can fix any of them.

## What it costs, and what's missing

The core of it is **€59** for the server and **€3.20** for the photo backups, plus Cloudflare's Workers plan and email sending through AWS. The agents run on my Claude subscription.

It has real gaps. Everything runs on one server, so when it dies, everything dies with it. A second server in another data center would fix that, and double the bill. The mini sits on home internet and home power. There's no central place for logs, so when something breaks, an agent reads them on the server itself.

For now, that's the right trade for me. One bill, two machines, and a setup that agents understand well enough to fix while I'm doing something else.
