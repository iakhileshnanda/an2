# This Portfolio
aliases: portfolio, this site, this website, v2

**Pitch:** The site you're on — a cinematic scroll experience with a live AI droid (Echo) and a live "now" dashboard.
**Status:** Live at deal.maya-ai.dev
**Stack:** React 19, Vite, Tailwind CSS, Node.js/Express, Nginx, PM2, Oracle Cloud

## What's in it
- **Echo** — the droid. Tool-calling agent with live GitHub access, visitor memory,
  and proactive triggers (see the Echo project for the full picture).
- **Live Now dashboard** — a card in the Experience section showing what Akhilesh
  is building right now, fed by real GitHub activity with an editorial fallback.
- **Glass scroll-stack WORK section** — Lenis smooth scroll + glass-surface cards
  over a cherry aurora backdrop, with a stability fix ported into the scroll-stack
  library (layout-based measurement instead of transform-contaminated rects).
- **Returning-visitor greetings** — the droid tells you what shipped since your
  last visit, from a changelog.

## The previous version
V1 lives at akhileshnanda.maya-ai.dev — dual-world design (System / Human mode)
with a recruiter chat named Maya, driven entirely by a markdown file via a parser
and WebSocket pipeline. Still up. Maya still answers. We don't talk much.

## Why it's interesting
The whole thing is self-hosted: two Node services under PM2, Nginx in front, zero
hosting cost on Oracle Cloud. The portfolio *is* the proof of the resume claims.
