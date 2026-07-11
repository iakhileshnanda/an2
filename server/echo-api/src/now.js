'use strict';

// "Now" summary for the live dashboard card on the frontend timeline.
// Reuses the same GitHub integration Echo's tools use — one implementation,
// summarized server-side so raw event payloads never reach the browser.

const { TOOL_IMPLS } = require('./tools');

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = null; // { at, data }

// Repo slugs that deserve a nicer display name than dash-splitting gives.
const REPO_LABELS = {
  an2: 'Portfolio V2',
  newakhilesh: 'Portfolio V2',
  mymayamiro: 'Maya MIRO',
  'maya-miro': 'Maya MIRO',
  nanobot: 'NanoBot',
  oracle: 'Oracle — AI Job Hunter',
};

// Broad focus buckets inferred from repo languages + topics.
const FOCUS_RULES = [
  { re: /\b(agent|agents|llm|ai|rag|graphrag|neo4j|ml|prompt)\b/i, label: 'AI Agents' },
  { re: /typescript|javascript|angular|react|css|html|frontend/i, label: 'Frontend Architecture' },
  { re: /node|express|api|server|backend|postgres|redis|kafka/i, label: 'Backend Systems' },
];

function humanizeRepo(name) {
  const key = String(name || '').toLowerCase();
  if (REPO_LABELS[key]) return REPO_LABELS[key];
  return String(name || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (!Number.isFinite(diff) || diff < 0) return 'recently';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

async function buildNow() {
  const gh = await TOOL_IMPLS.get_github_activity({});
  const repos = Array.isArray(gh.topRepos) ? gh.topRepos : [];

  const building = repos.slice(0, 3).map((r) => humanizeRepo(r.name));

  const latestCommit =
    gh.lastCommit && gh.latestRepo
      ? {
          message: String(gh.lastCommit.message || '').split('\n')[0].slice(0, 80),
          repo: gh.latestRepo.name,
          timeAgo: timeAgo(gh.lastCommit.date),
        }
      : null;

  const signals = repos
    .flatMap((r) => [r.language, ...(Array.isArray(r.topics) ? r.topics : [])])
    .filter(Boolean)
    .join(' ');
  const currentFocus = FOCUS_RULES.filter((f) => f.re.test(signals)).map((f) => f.label);

  return {
    building,
    latestCommit,
    currentFocus,
    source: 'github',
    updatedAt: new Date().toISOString(),
  };
}

/** Cached "now" summary. Serves stale data over nothing if GitHub is down. */
async function getNowSummary() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  try {
    const data = await buildNow();
    cache = { at: Date.now(), data };
    return data;
  } catch (err) {
    if (cache) return cache.data; // stale beats empty
    throw err;
  }
}

module.exports = { getNowSummary };
