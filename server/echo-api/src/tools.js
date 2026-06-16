'use strict';

const fs = require('fs');
const path = require('path');

const RESUME_PATH = path.join(__dirname, '..', 'content', 'resume.json');

// --- Tool definitions sent to the model -------------------------------------
const TOOL_DEFS = [
  {
    name: 'get_github_activity',
    description:
      "Fetch Akhilesh's LIVE GitHub activity: latest pushed repo, its last commit, repo/follower counts, and top repositories across ALL of his repos — public and private (when a token is configured). Call this whenever the visitor asks what he's building now, his recent work, his code, his GitHub, or repo/commit stats. Optionally pass `query` to search/filter across every repo by name, description, language, or topic (e.g. \"agent\", \"neo4j\", \"angular\"); omit it for overall latest activity. Do not invent these numbers — only state them after this returns.",
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Optional search term to filter repos by name, description, language, or topic. Omit for overall latest activity.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_resume',
    description:
      "Read Akhilesh's current structured résumé: summary, skills, experience, projects, contact links, availability, and résumé URL. Call this when the visitor asks about his background, experience, skills, stack, availability, or wants the resume/CV. The data is current — prefer it over anything you remember.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

// Per-tool presentation metadata, surfaced to the frontend for the
// PRESENTING/status-line treatment.
const TOOL_STATUS = {
  get_github_activity: 'SEARCHING GITHUB...',
  get_resume: 'READING RESUME...',
};

// --- Tool implementations ---------------------------------------------------

function summarizeRepo(r) {
  return {
    name: r.name,
    private: Boolean(r.private),
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    pushedAt: r.pushed_at,
    url: r.html_url,
    topics: Array.isArray(r.topics) ? r.topics : [],
  };
}

async function getGithubActivity({ query } = {}) {
  const token = process.env.GITHUB_TOKEN;
  const fallbackUser = process.env.GITHUB_USERNAME || 'iakhileshnanda';

  // NOTE: the token lives only in this header. It is never placed into the
  // returned object (so it can't reach the model, the reply, or structuredPayload)
  // and is never logged.
  const headers = {
    'User-Agent': 'echo-droid',
    Accept: 'application/vnd.github+json',
  };
  if (token) headers.Authorization = `token ${token}`;

  // Authenticated: /user + /user/repos read the token owner and include PRIVATE
  // repos. Unauthenticated: fall back to the public profile + public repos.
  const profileUrl = token
    ? 'https://api.github.com/user'
    : `https://api.github.com/users/${fallbackUser}`;
  const reposUrl = token
    ? 'https://api.github.com/user/repos?sort=pushed&per_page=100&affiliation=owner'
    : `https://api.github.com/users/${fallbackUser}/repos?sort=pushed&per_page=100`;

  const [profileRes, reposRes] = await Promise.all([
    fetch(profileUrl, { headers }),
    fetch(reposUrl, { headers }),
  ]);

  if (!profileRes.ok) {
    throw new Error(`github profile ${profileRes.status}`);
  }
  const profile = await profileRes.json();
  const allRepos = reposRes.ok ? await reposRes.json() : [];

  // Optional filter/search across ALL repos (name, description, language, topics).
  let repos = allRepos;
  let matchedCount;
  if (query && typeof query === 'string' && query.trim()) {
    const q = query.trim().toLowerCase();
    const matched = allRepos.filter((r) =>
      [r.name, r.description, r.language, ...(Array.isArray(r.topics) ? r.topics : [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
    matchedCount = matched.length;
    if (matched.length) repos = matched; // fall back to all if nothing matched
  }

  // Repos come back sorted by pushed desc; the first is the most recent activity.
  const latest = repos[0];
  let lastCommit = null;
  if (latest) {
    try {
      const cRes = await fetch(
        `https://api.github.com/repos/${latest.full_name}/commits?per_page=1`,
        { headers }
      );
      if (cRes.ok) {
        const commits = await cRes.json();
        if (Array.isArray(commits) && commits[0]) {
          lastCommit = {
            message: commits[0].commit?.message,
            date: commits[0].commit?.author?.date,
          };
        }
      }
    } catch {
      // last-commit lookup is best-effort
    }
  }

  return {
    type: 'github',
    user: profile.login || fallbackUser,
    name: profile.name,
    authenticated: Boolean(token),
    publicRepos: profile.public_repos,
    totalRepos: token ? allRepos.length : profile.public_repos,
    privateRepos: token ? allRepos.filter((r) => r.private).length : 0,
    followers: profile.followers,
    query: query || null,
    matchedCount,
    latestRepo: latest ? summarizeRepo(latest) : null,
    lastCommit,
    topRepos: repos.slice(0, 8).map(summarizeRepo),
  };
}

function getResume() {
  // Read fresh from disk every call so edits to resume.json take effect without
  // a restart (the whole point of pulling it from a file vs. the prompt).
  const data = JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));
  if (process.env.RESUME_URL) data.resumeUrl = process.env.RESUME_URL;
  return { type: 'resume', ...data };
}

const TOOL_IMPLS = {
  get_github_activity: getGithubActivity,
  get_resume: getResume,
};

module.exports = { TOOL_DEFS, TOOL_IMPLS, TOOL_STATUS };
