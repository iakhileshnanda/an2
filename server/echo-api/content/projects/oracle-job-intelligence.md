# Oracle — LLM Job Intelligence System
aliases: oracle, job intelligence, job hunt, job alerts

**Pitch:** Pipeline that parses job descriptions, scores candidate fit, and delivers ranked alerts.
**Status:** Built
**Stack:** Python, Node.js, Groq, Cerebras, NLP, PostgreSQL, Redis

## What it is
A job-hunting funnel turned into an automated, measurable system. Job descriptions
go in; ranked, scored alerts come out.

## How it works
- Python + Node.js pipeline using **Groq** and **Cerebras** for fast inference —
  multi-model routing across providers.
- NLP-based fit scoring ranks roles by match quality *before* alerting, so only
  worthwhile roles surface.
- **PostgreSQL** for persistent storage, **Redis** for caching scored results.

## Why it's interesting
It treats the job hunt as an engineering problem: instrument it, score it, rank it,
automate the boring part. Also a practical example of multi-model inference routing
— picking providers per task for speed and cost.
