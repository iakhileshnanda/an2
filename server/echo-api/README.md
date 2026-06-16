# Echo API

The backend brain for **Echo**, the portfolio companion droid. A small,
self-contained Express service — separate from `portfolio-api`. One route:
`POST /api/echo`.

It gives Echo:

- **Personality** — a fixed Echo system prompt (dry, deadpan, economical).
- **Memory** — file-based, per-visitor, keyed by an anonymous `visitorId`.
- **Real tool use** — live GitHub activity + structured résumé, via Anthropic tool calling.
- **Mode** — explicit `HIRE | COLLAB | CURIOUS`, or inferred from section dwell when none is given.

## Run

```bash
cd server/echo-api
cp .env.example .env      # set ANTHROPIC_API_KEY
npm install
npm run dev               # or: npm start  -> listens on :3005
```

The frontend dev proxy (`frontend/vite.config.js`) already routes `/api/echo`
to `http://localhost:3005`; everything else still goes to `portfolio-api`
on `:3001`. In production, add an nginx `location /api/echo` block pointing at
this service (the rest of `/api` continues to proxy to portfolio-api).

## Contract

`POST /api/echo`

**Request**

```jsonc
{
  "message": "what's he building lately?",      // omit when "trigger" is set
  "history": [{ "role": "user", "content": "…" }, { "role": "assistant", "content": "…" }],
  "intent": "HIRE" | "COLLAB" | "CURIOUS" | null,
  "visitorId": "uuid-from-frontend-localStorage",
  "sessionContext": {
    "currentSection": "projects",
    "timeOnPage": 84,
    "visitCount": 2,
    "lastFsmState": "TALKING",
    "sectionDwellTimes": { "projects": 60, "experience": 12 }
  },
  "trigger": "leaving"                            // optional: proactive visit-summary write
}
```

**Response**

```jsonc
{
  "reply": "back again — last time you were deep in the projects…",
  "nextState": "TALKING" | "THINKING" | "PRESENTING" | "LEAVING",
  "toolStatus": "SEARCHING GITHUB...",            // present only when a tool ran
  "structuredPayload": { "type": "github", "...": "..." }  // present only when a tool ran
}
```

## Memory

One JSON file per visitor under `data/visitors/<visitorId>.json` (gitignored,
created at runtime). Stored: `visitCount`, `sectionsExplored`, `lastIntent`,
`lastTopic`, `lastVisitTimestamp`, `lastVisitSummary`. Reads inject prior
context into the prompt on return visits; the `trigger: "leaving"` call writes
the summary for next time.

## Tools

- `get_github_activity` — live GitHub activity (latest repo, last commit,
  repo/follower counts, top repos) with an optional `query` to search/filter
  across all repos by name/description/language/topic. With `GITHUB_TOKEN` set,
  it authenticates as the token owner and includes **private** repos (via
  `/user/repos`); without a token it falls back to public repos for
  `GITHUB_USERNAME`. The token is only ever sent as an `Authorization` header —
  never returned in replies, `structuredPayload`, or logs.
- `get_resume` — reads `content/resume.json` fresh on every call, so editing
  that file changes Echo's answers without a restart. `RESUME_URL` (env) is
  injected into the payload.

## Config

See `.env.example`. Key vars: `ANTHROPIC_API_KEY` (required), `ECHO_MODEL`
(default `claude-opus-4-8`; use `claude-sonnet-4-6` for faster/cheaper replies),
`GITHUB_USERNAME`, `RESUME_URL`, `PORT`, `ALLOWED_ORIGINS`.
