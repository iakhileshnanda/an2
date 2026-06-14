'use strict';

/**
 * parseAboutMe — turns the about-me.md single source of truth into structured JSON.
 *
 * The markdown grammar is intentionally simple and deterministic so it can be
 * both human-edited and machine-written (see aboutStore.js):
 *
 *   # SECTION            top-level section header
 *   ## Sub heading       project / experience entry
 *   - key: value         field line (identity, project fields, meta)
 *   - **Category:** a, b  skill category line
 *   - bullet             plain bullet (experience, education)
 *
 * It depends on nothing — no gray-matter, no remark — so it runs in plain Node.
 */

/** Split the raw file into { SECTION_NAME: linesArray } keyed by `# HEADER`. */
function splitSections(md) {
  const sections = {};
  let current = null;
  for (const rawLine of md.split(/\r?\n/)) {
    const header = rawLine.match(/^#\s+(.+?)\s*$/);
    if (header) {
      current = header[1].trim().toUpperCase();
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(rawLine);
  }
  return sections;
}

/** `- key: value` -> { key, value }, else null. Ignores `- **bold:**` lines. */
function parseFieldLine(line) {
  const m = line.match(/^\s*-\s+([a-zA-Z0-9 _/&]+?):\s*(.*)$/);
  if (!m) return null;
  if (m[1].includes('**')) return null;
  return { key: m[1].trim().toLowerCase(), value: m[2].trim() };
}

function parseIdentity(lines = []) {
  const identity = { name: '', title: '', location: '', contact: '', tagline: '' };
  for (const line of lines) {
    const f = parseFieldLine(line);
    if (f && f.key in identity) identity[f.key] = f.value;
  }
  return identity;
}

function parseSummary(lines = []) {
  return lines.join('\n').trim();
}

/** `- **Frontend:** React, TypeScript` -> { Frontend: ["React", "TypeScript"] } */
function parseSkills(lines = []) {
  const skills = {};
  for (const line of lines) {
    const m = line.match(/^\s*-\s+\*\*(.+?):\*\*\s*(.*)$/);
    if (!m) continue;
    const category = m[1].trim();
    const items = m[2]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    skills[category] = items;
  }
  return skills;
}

/** `## Company — Role, 07/2023–Present` plus following `- bullet` lines. */
function parseExperience(lines = []) {
  const roles = [];
  let current = null;
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      const full = heading[1].trim();
      // "Company — Role, dates"  (em-dash separates company from role+dates)
      const [companyPart, rest = ''] = full.split('—').map((s) => s.trim());
      const lastComma = rest.lastIndexOf(',');
      const role = lastComma >= 0 ? rest.slice(0, lastComma).trim() : rest;
      const dates = lastComma >= 0 ? rest.slice(lastComma + 1).trim() : '';
      current = { heading: full, company: companyPart, role, dates, bullets: [] };
      roles.push(current);
      continue;
    }
    const bullet = line.match(/^\s*-\s+(.*)$/);
    if (bullet && current) current.bullets.push(bullet[1].trim());
  }
  return roles;
}

/** `## Project Name` plus `- pitch:/stack:/status:/interesting:` fields. */
function parseProjects(lines = []) {
  const projects = [];
  let current = null;
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = { name: heading[1].trim(), pitch: '', stack: [], status: '', interesting: '' };
      projects.push(current);
      continue;
    }
    if (!current) continue;
    const f = parseFieldLine(line);
    if (!f) continue;
    if (f.key === 'stack') {
      current.stack = f.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (f.key in current) {
      current[f.key] = f.value;
    }
  }
  return projects;
}

function parseEducation(lines = []) {
  return lines
    .map((l) => l.match(/^\s*-\s+(.*)$/))
    .filter(Boolean)
    .map((m) => m[1].trim());
}

function parseMeta(lines = []) {
  const meta = {};
  for (const line of lines) {
    const f = parseFieldLine(line);
    if (f) meta[f.key] = f.value;
  }
  return meta;
}

/**
 * Parse an about-me.md string into the canonical AboutMe JSON shape.
 * @param {string} md
 */
function parseAboutMe(md) {
  const s = splitSections(md);
  return {
    identity: parseIdentity(s['IDENTITY']),
    summary: parseSummary(s['SUMMARY']),
    skills: parseSkills(s['SKILLS']),
    experience: parseExperience(s['WORK EXPERIENCE']),
    projects: parseProjects(s['PROJECTS']),
    education: parseEducation(s['EDUCATION']),
    meta: parseMeta(s['META']),
  };
}

module.exports = { parseAboutMe };
