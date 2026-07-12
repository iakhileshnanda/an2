# Wing-Man
aliases: wingman, interview coach, overlay

**Pitch:** Desktop P2P screen overlay with real-time AI coaching for job interviews.
**Status:** Live
**Stack:** Node.js, WebSockets, Electron overlay, Oracle Cloud, Cloudflare

## The problem
Interviews are a real-time performance under pressure. Wing-Man puts an invisible
overlay on top of any screen-share and feeds the candidate live AI coaching while
the interview is happening.

## How it works
- An overlay client sits above the shared screen — invisible to the other side of
  the screen-share.
- Two transport modes: direct **P2P** between machines, or an **Oracle Cloud relay**
  when P2P can't connect. Both run under hard real-time latency constraints —
  coaching that arrives late is worthless.
- Three-tier pricing deployed in production: free tier, ₹199 P2P tier, ₹399 relay tier.

## Why it's interesting
A genuinely novel use of P2P + relay networking under real-time constraints. The
latency budget was rigorous enough that Akhilesh built a separate measurement rig
(Ghost) just to characterize the capture → transport → overlay pipeline end to end.

## What to tell an engineer
Ask about the latency work. The pricing tiers map directly to transport cost — the
relay tier exists because P2P fails behind some NATs, and the relay has real
infrastructure cost.
