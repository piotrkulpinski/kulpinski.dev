---
isDraft: true
pubDate: 2026-11-27
title: "All my sites run on one server. Here's what happens when it dies"
shortTitle: "When my only server dies"
description: "How 12 sites run on one €59 Hetzner server, how I rebuilt all of them from backups in 36 minutes, the 4 gaps the test found, and how AI agents manage the setup."
tags: ["engineering", "side-projects", "ai"]
---

All 12 of my sites run on one dedicated server at Hetzner. It costs **€59 a month** and has 64 GB of RAM, of which my apps use under 10.

That includes [OpenAlternative](https://openalternative.co), [EuroAlternative](https://euroalternative.eu), [Highseat](https://highseat.com/?utm_source=kulpinski.dev&utm_medium=blog&utm_campaign=one-server) and the rest of the portfolio, plus every database behind them.

On 26 November I [posted on X](https://x.com/piotrkulpinski/status/2125921575040168198) about testing what happens when that server dies. More people read it than anything I've posted in a while, and the replies asked good questions. This post has the longer version: the setup, the test, what it found, and how AI agents run most of it day to day.

## The setup

The server runs Ubuntu on two mirrored disks, so one disk can fail without taking anything down. On top of that:

- [Dokploy](https://dokploy.com) deploys the apps and the databases. It's an open source, self-hosted alternative to Vercel or Heroku.
- Docker runs everything, so the server itself holds very little: a firewall, some scripts and settings.
- [Cloudflare](https://cloudflare.com) sits in front of every site. The server only accepts web traffic that comes through Cloudflare.
- [Tailscale](https://tailscale.com) is a private network between my machines. The admin panels and databases are reachable only through it.

A Mac mini at home watches all of it. It runs [Grafana](https://grafana.com) with alerts that go to my phone, and it keeps a second copy of the backups, out of the server's reach.

The trade-off is obvious. One server means one bill and one place to look, and everything goes down at once on the day it dies.

## What was backed up, and what wasn't

The databases were covered. Each one is dumped every day to [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/), and Highseat's every hour. Dokploy backs up its own settings too, including every app's environment variables.

The server's own configuration was not. The firewall rules, the SSL setup, the cron jobs, the monitoring agents and a dozen small fixes I'd made over the months only existed on that one machine. If it died, I'd be rebuilding them from memory, during an outage, probably at night.

So the server now backs up its own config every night with [restic](https://restic.net), encrypted, to R2. If that backup stops for more than 30 hours, I get an alert.

## The test

A backup you've never restored is a guess. So I rented a fresh server by the hour and rebuilt everything on it, from backups only, while production kept running.

Before restoring anything, the test server was cut off from the real one. It couldn't reach production, it couldn't join my private network, and the restored apps had no internet access, apart from what the builds needed. Every scheduled job, backup and notification in the restored Dokploy was switched off before it started. A restored copy of a real system will happily send real emails and overwrite real backups if you let it.

Then the restore, step by step:

| Step | Time |
|---|---|
| Install Docker and the base setup | 30 s |
| Restore the server config | 6 s |
| Restore Dokploy with all apps and settings | about 1 min |
| Restore 7 Postgres databases | 9 min |
| Restore Highseat's analytics database | 3 min |
| Pull and build all 12 apps | 6 min |

**36 minutes** after creating the server, all 12 sites answered. That includes the time spent fixing the problems below as they came up. The server cost **€0.11** for the hour.

Most of that time is one database. DomainRapid has a large vector index that takes 8 minutes to rebuild. Everything else restores in seconds.

To check the result, I compared row counts with production. 84 of 109 tables matched exactly. The rest differed only by what people wrote between the morning backup and the comparison, which is the data loss you accept with daily backups. Highseat's events up to the backup matched exactly: 20,695,211 on both.

## What the test found

Four things my backups didn't have:

1. **A network I'd created by hand.** Highseat's services talk over a private Docker network that I set up once, manually, and forgot about. Nothing recreated it, so Highseat wouldn't start.
2. **The login the server uses to download app images.** Some of my apps are built in CI and pulled from GitHub's registry. The server's login for that lived in a file no backup covered.
3. **A database setting that doesn't end up in dumps.** Three databases had their connection limit raised. That setting lives next to the data, not in it, so the restored databases went back to the default. DevSuite's build then failed with "too many clients".
4. **Two apps that connect to the live database while they build.** On a new server they'd fail. In a test, they would've read production data.

None of these is a big deal on its own. Together, they're the difference between a 36-minute recovery and a long night of guessing. All four are fixed in the scripts, and the next test should run without them.

## How agents run it

I didn't write those scripts. An AI agent ([Claude Code](https://www.anthropic.com/claude-code)) did: it read the current setup, wrote the backup and restore scripts, ran the test, fixed what broke, and wrote the runbook. My part was approving the steps that cost money or touched production. This is how I manage the whole setup now.

The key piece is a skill: a set of Markdown files agents read before any infrastructure work. It describes what runs where, how to reach it, and what not to touch. A few things make it work:

- **It describes the current state only.** When something changes, the old text gets replaced, not appended. History goes into git commits. A doc full of "update from March" notes gets agents to follow instructions that stopped being true months ago.
- **Lessons become rules with a reason.** "Restore dumps with `pg_restore`, never `psql`: the files look like SQL, and `psql` reads them as garbage and still reports success." One line, and no agent makes that mistake again.
- **It says what's risky in business terms.** My flagship directories and my paid products need my approval for any production change. Everything else, agents fix and tell me afterwards. That list is about money, not about how hard a system is. My most awkward database is on the low-risk list.
- **Agents never see the keys.** Credentials come from a password manager vault the agents can only read, or through a gateway that calls the API for them. Nothing gets pasted into a chat.
- **It checks itself.** Every Saturday, a job on the Mac mini compares the skill with the live servers and opens a pull request when they disagree. A script also fails when the file grows too large or an old "remove after" date has passed.

The rule I care about most came from a dead disk. One of the mirrored disks failed, and nothing told me for weeks. The server kept running on the other one. Hetzner swapped the disk within an hour once I noticed, but now there's an alert for it and a line in the skill about rebuilding the mirror. Every incident ends that way: an alert, and a rule an agent will read next time.

## What people asked

**"Why not a second server in another data center?"** Running a full copy in another location would cut downtime from 36 minutes to a few. It would also double the bill and add a lot of moving parts. For my sites, 36 minutes once every few years is a fine trade. That changes if a paid product ever needs to be up at all times.

**"Why not NixOS, or Ansible?"** Both rebuild a server from config files in git. Almost everything I run lives in Docker, so the server is a thin layer, and plain scripts in git already rebuild it. With one server, they're easier to read and fix.

**"Why not host on Cloudflare for free?"** I use Cloudflare for DNS, the proxy and R2. But a free plan doesn't run 12 apps with their Postgres databases and an analytics database. One server does, for one flat price.

## If you run everything on one server

Back up the server's config, not only the databases. Then do a real restore on a throwaway server and time it. It took me one morning and cost €0.11, and it found four problems I'd otherwise have found mid-outage.

I'll run it again every six months, and after any big change. Hopefully the next one is boring.
