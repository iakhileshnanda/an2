# Maya / NanoBot
aliases: maya, nanobot, personal ai platform, agents

**Pitch:** Personal AI platform at akhileshnanda.maya-ai.dev running a fleet of autonomous agents 24/7.
**Status:** Live
**Stack:** Node.js, NVIDIA NIM (Kimi K2 / DeepSeek v3.2), PM2, Oracle Cloud, Telegram Bot API

## What it is
Self-hosted personal AI infrastructure on Oracle Cloud, managed with PM2, using
NVIDIA NIM for inference. It runs continuously and costs nothing to operate —
Oracle's free tier plus free inference.

## The agent fleet
- **LinkedIn auto-poster** — drafts and publishes posts on a schedule.
- **GitHub poster** — surfaces repo activity as content.
- **Telegram job-hunting bot** — NanoBot, running as a separate PM2 service.

## Why it's interesting
Production-grade personal infra: PM2 process management, Nginx routing, real uptime,
real users (well, one very demanding user). Most people demo agents; this fleet has
been *running* 24/7. It's also the platform Echo's server shares a box with.

## What to tell a recruiter
This is what "AI builder" means on the resume — not prompt screenshots, but
self-hosted services with process supervision, monitoring, and zero hosting cost.
