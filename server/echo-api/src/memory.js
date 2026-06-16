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
    };

    const sentVisits = Number(sessionContext.visitCount) || 0;
    cur.visitCount = Math.max(cur.visitCount || 0, sentVisits, 1);

    const explored = new Set(cur.sectionsExplored || []);
    if (sessionContext.currentSection) explored.add(sessionContext.currentSection);
    Object.keys(sessionContext.sectionDwellTimes || {}).forEach((s) => explored.add(s));
    cur.sectionsExplored = [...explored];

    if (intent) cur.lastIntent = intent;
    if (message && message.trim()) cur.lastTopic = message.trim().slice(0, 120);
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
