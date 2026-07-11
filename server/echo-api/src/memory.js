'use strict';

const fs = require('fs/promises');
const path = require('path');

// Server-side, file-based memory keyed by visitorId. One JSON file per visitor.
const DATA_DIR = path.join(__dirname, '..', 'data', 'visitors');

// In-process write queue per visitorId — the "basic file locking" the brief
// asks for. Serializes read-modify-write so concurrent requests for the same
// visitor don't clobber each other.
const chains = new Map();

function safeId(visitorId) {
  // Only allow the shape we generate (uuid-ish). Prevents path traversal.
  if (typeof visitorId !== 'string') return null;
  const cleaned = visitorId.trim();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(cleaned)) return null;
  return cleaned;
}

function fileFor(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

// --- Lightweight visitor memory (no NLP, just keyword matching) --------------

const TOPICS_MAX = 10;
const INTERESTS_MAX = 10;
const QUESTIONS_MAX = 5;

// keyword -> canonical topic label + broad interest bucket
const TOPIC_DEFS = [
  { re: /\bangular\b/i, label: 'Angular', interest: 'frontend' },
  { re: /\breact\b/i, label: 'React', interest: 'frontend' },
  { re: /\bvue\b/i, label: 'Vue', interest: 'frontend' },
  { re: /\btypescript\b/i, label: 'TypeScript', interest: 'frontend' },
  { re: /\bjavascript\b/i, label: 'JavaScript', interest: 'frontend' },
  { re: /\btailwind\b/i, label: 'Tailwind', interest: 'frontend' },
  { re: /\bnode(?:\.?js)?\b/i, label: 'Node.js', interest: 'backend' },
  { re: /\bexpress\b/i, label: 'Express', interest: 'backend' },
  { re: /\bpython\b/i, label: 'Python', interest: 'backend' },
  { re: /\b(neo4j|mongo(?:db)?|postgres(?:ql)?|sql|database)\b/i, label: 'Databases', interest: 'backend' },
  { re: /\b(ai|llm|agents?|machine learning|ml)\b/i, label: 'AI', interest: 'ai' },
  { re: /\b(groq|claude|anthropic|gpt|openai)\b/i, label: 'LLMs', interest: 'ai' },
  { re: /\baws\b/i, label: 'AWS', interest: 'cloud' },
  { re: /\b(azure|gcp|cloud)\b/i, label: 'Cloud', interest: 'cloud' },
  { re: /\b(docker|kubernetes|k8s|devops|nginx|ci\/cd)\b/i, label: 'DevOps', interest: 'cloud' },
  { re: /\bgithub\b/i, label: 'GitHub', interest: 'code' },
  { re: /\b(resume|cv|hire|hiring|job|experience)\b/i, label: 'Resume', interest: 'hiring' },
  { re: /\b(projects?|portfolio|wing-?man|echo)\b/i, label: 'Projects', interest: 'projects' },
  { re: /\barchitecture\b/i, label: 'Architecture', interest: 'engineering' },
];

function emptyMemory() {
  return { interests: [], topics: [], recentQuestions: [], preferences: {} };
}

// Append keeping the value's latest position, deduped, capped at `max`.
function pushUnique(list, value, max) {
  const next = (Array.isArray(list) ? list : []).filter((v) => v !== value);
  next.push(value);
  return next.slice(-max);
}

// Very rough reply-style signal from the last few questions: explicit asks for
// depth win; otherwise a run of terse prompts ("yes", "ok", "next") = concise.
function inferReplyStyle(recentQuestions) {
  const joined = recentQuestions.join(' ');
  if (/\b(explain|deep dive|in detail|detailed|walk me through|architecture)\b/i.test(joined)) {
    return 'detailed';
  }
  const short = recentQuestions.filter((q) => q.length <= 12).length;
  if (recentQuestions.length >= 3 && short >= 3) return 'concise';
  return null;
}

function updateMemory(mem, message) {
  const next = { ...emptyMemory(), ...(mem || {}) };
  const text = message.trim().slice(0, 200);

  next.recentQuestions = pushUnique(next.recentQuestions, text, QUESTIONS_MAX);

  for (const def of TOPIC_DEFS) {
    if (!def.re.test(text)) continue;
    next.topics = pushUnique(next.topics, def.label, TOPICS_MAX);
    next.interests = pushUnique(next.interests, def.interest, INTERESTS_MAX);
  }

  const style = inferReplyStyle(next.recentQuestions);
  if (style) next.preferences = { ...next.preferences, replyStyle: style };

  return next;
}

async function readRaw(id) {
  try {
    const buf = await fs.readFile(fileFor(id), 'utf8');
    return JSON.parse(buf);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeRaw(id, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(fileFor(id), JSON.stringify(data, null, 2), 'utf8');
}

// Run `fn` exclusively for a given visitorId (serialized).
function withLock(id, fn) {
  const prev = chains.get(id) || Promise.resolve();
  const next = prev.then(fn, fn);
  // keep the chain alive but swallow errors so one failure doesn't poison it
  chains.set(id, next.catch(() => {}));
  return next;
}

/** Load stored memory for a visitor, or null if none exists. */
async function load(visitorId) {
  const id = safeId(visitorId);
  if (!id) return null;
  return readRaw(id);
}

/**
 * Merge this turn into the visitor's memory: bump visit count, accumulate
 * explored sections, record last intent/topic and timestamp.
 */
async function recordTurn(visitorId, { sessionContext = {}, intent = null, message = null } = {}) {
  const id = safeId(visitorId);
  if (!id) return null;

  return withLock(id, async () => {
    const cur = (await readRaw(id)) || {
      visitorId: id,
      visitCount: 0,
      sectionsExplored: [],
      lastIntent: null,
      lastTopic: null,
      lastVisitTimestamp: null,
      lastVisitSummary: null,
      memory: emptyMemory(),
    };

    const sentVisits = Number(sessionContext.visitCount) || 0;
    cur.visitCount = Math.max(cur.visitCount || 0, sentVisits, 1);

    const explored = new Set(cur.sectionsExplored || []);
    if (sessionContext.currentSection) explored.add(sessionContext.currentSection);
    Object.keys(sessionContext.sectionDwellTimes || {}).forEach((s) => explored.add(s));
    cur.sectionsExplored = [...explored];

    if (intent) cur.lastIntent = intent;
    if (message && message.trim()) {
      cur.lastTopic = message.trim().slice(0, 120);
      cur.memory = updateMemory(cur.memory, message);
    }
    cur.lastVisitTimestamp = new Date().toISOString();

    await writeRaw(id, cur);
    return cur;
  });
}

/** Store the one-line visit summary produced on LEAVING. */
async function writeSummary(visitorId, summary) {
  const id = safeId(visitorId);
  if (!id || !summary) return null;

  return withLock(id, async () => {
    const cur = (await readRaw(id)) || { visitorId: id, visitCount: 1, sectionsExplored: [] };
    cur.lastVisitSummary = String(summary).trim().slice(0, 300);
    cur.lastVisitTimestamp = new Date().toISOString();
    await writeRaw(id, cur);
    return cur;
  });
}

module.exports = { load, recordTurn, writeSummary, DATA_DIR };
