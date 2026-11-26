---
isDraft: true
pubDate: 2026-11-27
title: "All my sites run on one server. Here's what happens when it dies"
shortTitle: "When my only server dies"
description: "A dead disk made me ask what happens if my only server dies. So I rebuilt all 12 apps on a fresh one from backups. It took 36 minutes and found 4 gaps."
tags: ["engineering", "side-projects", "ai"]
---

For a few weeks, one of the two disks in my only server was dead, and I had no idea.

Nothing went down. The server has two disks that mirror each other, so it kept running on the one that was left. [[How you found out about the dead disk.]] Hetzner replaced the drive, the mirror was rebuilt, and that was it.

But for those weeks, everything I run was one more failure away from gone. So on 26 November, I tested what happens when the whole server dies.

## Why one server

All 12 of my apps run on one dedicated server at Hetzner: [OpenAlternative](https://openalternative.co), [EuroAlternative](https://euroalternative.eu), [Highseat](https://highseat.com/?utm_source=kulpinski.dev&utm_medium=blog&utm_campaign=one-server), [Revinel](https://revinel.com), DevSuite, Dirstarter and the rest, plus every database behind them.

It costs **€59 a month** for 64 GB of RAM, and my apps use under 10. It was a deal Hetzner no longer sells, so I can't even order a second one at that price.

I like the simplicity. One bill, one place to look when something's slow. [Dokploy](https://dokploy.com), an open source, self-hosted alternative to Vercel or Heroku, deploys the apps and databases. [Cloudflare](https://cloudflare.com) sits in front of every site. A Mac mini at home watches the server, sends alerts to my phone and keeps a second copy of the backups, out of the server's reach.

The cost of that simplicity is obvious. When the server dies, everything dies with it, at the same time.

## The question I kept putting off

The databases were covered. Each one is backed up every day to [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/), Cloudflare's file storage, and Highseat's every hour. Dokploy backs up its own settings too, including every app's environment variables.

The server itself was another story. The firewall rules, the SSL setup, the scheduled jobs, the monitoring and a dozen small fixes I'd made over the months only existed on that one machine. If it died, I'd be rebuilding all of that from memory, during an outage, probably at night.

And I had never restored any of it. A backup you've never restored is a guess.

So I fixed the first part. The server now backs up its own configuration every night, encrypted, to R2, and I get an alert if that backup stops for more than 30 hours. Then I had to find out if any of it actually worked.

## Rehearsing the worst day

The plan was simple: rent a fresh server by the hour, rebuild everything on it from backups only, and time it. Production would keep running the whole time.

I picked a Hetzner Cloud server because it's ready in a minute. A new dedicated server can take hours or days, and in a real outage I'd run on cloud first and move later.

Before restoring anything, I cut the test server off from the real one. It couldn't reach production, it couldn't join my private network, and the restored apps had no internet access, apart from what the builds needed. Every scheduled job, backup and notification was switched off before the restored Dokploy started. A copy of a real system will happily send real emails and overwrite real backups if you let it.

The server came up just after noon my time. The base setup took 30 seconds. The server's configuration came back in 6. Dokploy, with every app and setting, took about a minute.

The databases took 9 minutes, and 8 of those were one database. DomainRapid has a large search index that has to be rebuilt from scratch. Everything else restored in seconds. Highseat's analytics database took another 3 minutes. Then all 12 apps were downloaded or built, which took 6 minutes.

**36 minutes** after the server was created, all 12 apps answered. That includes fixing four problems along the way. The server cost about **€0.11**.

[[One or two sentences on how it felt watching the apps come back, or skip.]]

## What broke

Four things weren't in any backup, and each one only showed up because something failed.

Highseat wouldn't start. Its services talk to each other over a private network I'd set up by hand once and forgotten about. Nothing recreated it.

Some apps are built on GitHub and downloaded as ready images. The server needs a login to download them, and that login lived in a file no backup covered.

DevSuite failed with "too many clients". I'd raised the connection limit on three databases at some point. That setting lives next to the data, not in it, so the restored databases went back to the default.

The last one was the riskiest. Two apps connect to the live database while they build. On a new server their builds would simply fail. In a test, they could have read real production data.

None of these is a big deal on its own. Together, they're the difference between a 36-minute recovery and a long night of guessing. All four are fixed in the scripts now.

To check the result, I compared row counts with production. 84 of 109 tables matched exactly. The rest differed only by what people wrote between the morning backup and the check, which is what you accept with daily backups. Highseat's events up to the backup matched to the last one: 20,695,211 on both.

## How agents run it

I didn't write the backup scripts or the restore steps. An AI agent ([Claude Code](https://www.anthropic.com/claude-code)) did. It read the current setup, wrote the scripts, ran the test, fixed what broke and wrote the step-by-step guide for next time. My part was approving the steps that cost money or touched production.

That's how I run the whole setup now. Before any server work, agents read a set of Markdown notes, called a skill. It describes what runs where, how to reach it and what not to touch.

The notes only describe how things are today. When something changes, the old text gets replaced, and the history goes into git. A doc full of "update from March" notes makes agents follow instructions that stopped being true months ago.

Every lesson becomes one rule with one reason. My database backups look like plain SQL files but aren't, so the usual tool reads them as garbage and still reports success. That's one line in the notes now, and no agent makes that mistake again.

The notes also say what's risky in business terms. My main directories and my paid products need my approval for any change in production. For everything else, agents fix the problem and tell me afterwards. The list follows the money. DomainRapid, my most awkward database, is on the low-risk side.

Agents never see the keys. They get credentials from a password manager they can only read, or through a service that makes the API call for them. Nothing gets pasted into a chat.

And the notes check themselves. Every Saturday, a job on the Mac mini compares them with the live servers and opens a pull request when they disagree.

The dead disk went through the same loop. There's an alert for a failed disk now, and a line in the notes about rebuilding the mirror. Every incident ends that way: an alert, and a rule an agent will read next time.

## What people asked

I [posted about the test on X](https://x.com/piotrkulpinski/status/2125921575040168198) the same day, and the replies asked good questions.

**"Why not a second server in another data center?"** A full copy running somewhere else would cut downtime from 36 minutes to a few. It would also double the bill and add a lot of moving parts. For my sites, 36 minutes once every few years is a fair trade. That changes if a paid product ever has to be up all the time.

**"Why not NixOS or Ansible?"** Both rebuild a server from config files. Almost everything I run lives in Docker, so the server underneath holds very little, and a few plain scripts in git already rebuild it. With one server, those are easier for me to read and fix.

**"Why not host on Cloudflare for free?"** I already use Cloudflare for DNS, security and file storage. But a free plan doesn't run 12 apps with their Postgres databases and an analytics database. One server does, for one flat price.

## If you run everything on one server

Back up the server's own setup, not only the databases. Then restore it all on a throwaway server and time it. It took me under an hour and about €0.11, and it found four problems I'd otherwise have found in the middle of an outage.

I'll run it again every six months, and after any big change. Hopefully the next one is boring.
