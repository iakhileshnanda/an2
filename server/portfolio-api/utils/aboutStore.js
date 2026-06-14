'use strict';

const fs = require('fs');
const path = require('path');
const { parseAboutMe } = require('./parseAboutMe');

// about-me.md lives at the repo root: server/portfolio-api/utils -> ../../../
const ABOUT_PATH =
  process.env.ABOUT_ME_PATH || path.join(__dirname, '..', '..', '..', 'about-me.md');

function read() {
  return fs.readFileSync(ABOUT_PATH, 'utf8');
}

function write(md) {
  fs.writeFileSync(ABOUT_PATH, md, 'utf8');
}

function readParsed() {
  return parseAboutMe(read());
}

/** Return [startIndex, endIndex) line range for a `# SECTION` (end-exclusive). */
function sectionRange(lines, sectionName) {
  const target = sectionName.toUpperCase();
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*$/);
    if (m && m[1].trim().toUpperCase() === target) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return [start, end];
}

/** Drop trailing blank lines from a [start, end) slice, return the trim point. */
function lastContentIndex(lines, start, end) {
  let i = end - 1;
  while (i > start && lines[i].trim() === '') i--;
  return i;
}

// ── Mutations ──────────────────────────────────────────────────────────────

function addProject(md, { name, pitch = '', stack = '', status = '', interesting = '' }) {
  if (!name || !name.trim()) throw new Error('project name is required');
  const lines = md.split('\n');
  const range = sectionRange(lines, 'PROJECTS');
  if (!range) throw new Error('PROJECTS section not found');
  const [start, end] = range;

  const stackStr = Array.isArray(stack) ? stack.join(', ') : String(stack);
  const block = [
    '',
    `## ${name.trim()}`,
    `- pitch: ${pitch}`.trimEnd(),
    `- stack: ${stackStr}`.trimEnd(),
    `- status: ${status || 'Built'}`,
    `- interesting: ${interesting}`.trimEnd(),
  ];

  const insertAt = lastContentIndex(lines, start, end) + 1;
  lines.splice(insertAt, 0, ...block);
  return lines.join('\n');
}

function addSkill(md, { category, skill }) {
  if (!category || !skill) throw new Error('category and skill are required');
  const lines = md.split('\n');
  const range = sectionRange(lines, 'SKILLS');
  if (!range) throw new Error('SKILLS section not found');
  const [start, end] = range;

  const wanted = category.trim().toLowerCase();
  for (let i = start + 1; i < end; i++) {
    const m = lines[i].match(/^(\s*-\s+\*\*(.+?):\*\*\s*)(.*)$/);
    if (m && m[2].trim().toLowerCase() === wanted) {
      const existing = m[3]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (existing.some((s) => s.toLowerCase() === skill.trim().toLowerCase())) {
        return md; // already present — no-op
      }
      existing.push(skill.trim());
      lines[i] = `${m[1]}${existing.join(', ')}`;
      return lines.join('\n');
    }
  }
  // Category didn't exist — create it.
  const insertAt = lastContentIndex(lines, start, end) + 1;
  lines.splice(insertAt, 0, `- **${category.trim()}:** ${skill.trim()}`);
  return lines.join('\n');
}

function setMetaField(md, key, value) {
  if (!key) throw new Error('meta key is required');
  const lines = md.split('\n');
  const range = sectionRange(lines, 'META');
  if (!range) throw new Error('META section not found');
  const [start, end] = range;

  const wanted = key.trim().toLowerCase();
  for (let i = start + 1; i < end; i++) {
    const m = lines[i].match(/^(\s*-\s+)([a-zA-Z0-9 _/&]+?):\s*(.*)$/);
    if (m && m[2].trim().toLowerCase() === wanted) {
      lines[i] = `${m[1]}${m[2]}: ${value}`;
      return lines.join('\n');
    }
  }
  const insertAt = lastContentIndex(lines, start, end) + 1;
  lines.splice(insertAt, 0, `- ${key.trim()}: ${value}`);
  return lines.join('\n');
}

/** Append a bullet under a matching `## Company...` role (defaults to the first). */
function addAchievement(md, { company = '', text }) {
  if (!text || !text.trim()) throw new Error('achievement text is required');
  const lines = md.split('\n');
  const range = sectionRange(lines, 'WORK EXPERIENCE');
  if (!range) throw new Error('WORK EXPERIENCE section not found');
  const [start, end] = range;

  // Collect each role's heading index.
  const headings = [];
  for (let i = start + 1; i < end; i++) {
    if (/^##\s+/.test(lines[i])) headings.push(i);
  }
  if (headings.length === 0) throw new Error('no roles found in WORK EXPERIENCE');

  let target = headings[0];
  if (company.trim()) {
    const wanted = company.trim().toLowerCase();
    const match = headings.find((i) => lines[i].toLowerCase().includes(wanted));
    if (match !== undefined) target = match;
  }

  // Find the end of this role's bullet block.
  const roleEnd = headings.find((i) => i > target) ?? end;
  const insertAt = lastContentIndex(lines, target, roleEnd) + 1;
  lines.splice(insertAt, 0, `- ${text.trim()}`);
  return lines.join('\n');
}

/**
 * Apply a structured admin action to about-me.md, persist it, and return the
 * freshly parsed JSON. Throws on unknown or invalid actions.
 * @param {{type: string, payload: object}} action
 */
function applyUpdate(action) {
  if (!action || typeof action.type !== 'string') {
    throw new Error('action.type is required');
  }
  const payload = action.payload || {};
  let md = read();

  switch (action.type) {
    case 'add_project':
      md = addProject(md, payload);
      break;
    case 'update_skill':
      md = addSkill(md, payload);
      break;
    case 'set_availability':
      md = setMetaField(md, 'availability', payload.value);
      break;
    case 'set_meta':
      md = setMetaField(md, payload.key, payload.value);
      break;
    case 'add_achievement':
      md = addAchievement(md, payload);
      break;
    default:
      throw new Error(`unknown action type: ${action.type}`);
  }

  write(md);
  return parseAboutMe(md);
}

module.exports = {
  ABOUT_PATH,
  read,
  readParsed,
  applyUpdate,
  // exported for unit testing
  _internal: { addProject, addSkill, setMetaField, addAchievement },
};
