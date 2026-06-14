/**
 * parseAboutMe.ts — client-side types + parser for the about-me.md source of truth.
 *
 * In normal operation the frontend consumes GET /api/about (already-parsed JSON),
 * so the `AboutMe` types below are the important export. `parseAboutMe()` mirrors
 * the backend grammar (server/portfolio-api/utils/parseAboutMe.js) for any case
 * where the raw markdown is parsed in the browser (preview, offline, tests).
 */

export interface Identity {
  name: string;
  title: string;
  location: string;
  contact: string;
  tagline: string;
}

export interface Role {
  heading: string;
  company: string;
  role: string;
  dates: string;
  bullets: string[];
}

export type ProjectStatus = 'Live' | 'Built' | 'In Progress' | string;

export interface Project {
  name: string;
  pitch: string;
  stack: string[];
  status: ProjectStatus;
  interesting: string;
}

export interface AboutMeMeta {
  tone?: string;
  salary?: string;
  availability?: string;
  fallback?: string;
  [key: string]: string | undefined;
}

export interface AboutMe {
  identity: Identity;
  summary: string;
  skills: Record<string, string[]>;
  experience: Role[];
  projects: Project[];
  education: string[];
  meta: AboutMeMeta;
}

function splitSections(md: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let current: string | null = null;
  for (const line of md.split(/\r?\n/)) {
    const header = line.match(/^#\s+(.+?)\s*$/);
    if (header) {
      current = header[1].trim().toUpperCase();
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(line);
  }
  return sections;
}

function parseFieldLine(line: string): { key: string; value: string } | null {
  const m = line.match(/^\s*-\s+([a-zA-Z0-9 _/&]+?):\s*(.*)$/);
  if (!m || m[1].includes('**')) return null;
  return { key: m[1].trim().toLowerCase(), value: m[2].trim() };
}

function parseIdentity(lines: string[] = []): Identity {
  const identity: Identity = { name: '', title: '', location: '', contact: '', tagline: '' };
  for (const line of lines) {
    const f = parseFieldLine(line);
    if (f && f.key in identity) (identity as Record<string, string>)[f.key] = f.value;
  }
  return identity;
}

function parseSkills(lines: string[] = []): Record<string, string[]> {
  const skills: Record<string, string[]> = {};
  for (const line of lines) {
    const m = line.match(/^\s*-\s+\*\*(.+?):\*\*\s*(.*)$/);
    if (!m) continue;
    skills[m[1].trim()] = m[2].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return skills;
}

function parseExperience(lines: string[] = []): Role[] {
  const roles: Role[] = [];
  let current: Role | null = null;
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      const full = heading[1].trim();
      const [company, rest = ''] = full.split('—').map((s) => s.trim());
      const lastComma = rest.lastIndexOf(',');
      const role = lastComma >= 0 ? rest.slice(0, lastComma).trim() : rest;
      const dates = lastComma >= 0 ? rest.slice(lastComma + 1).trim() : '';
      current = { heading: full, company, role, dates, bullets: [] };
      roles.push(current);
      continue;
    }
    const bullet = line.match(/^\s*-\s+(.*)$/);
    if (bullet && current) current.bullets.push(bullet[1].trim());
  }
  return roles;
}

function parseProjects(lines: string[] = []): Project[] {
  const projects: Project[] = [];
  let current: Project | null = null;
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
      current.stack = f.value.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (f.key in current) {
      (current as unknown as Record<string, string>)[f.key] = f.value;
    }
  }
  return projects;
}

function parseEducation(lines: string[] = []): string[] {
  return lines
    .map((l) => l.match(/^\s*-\s+(.*)$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => m[1].trim());
}

function parseMeta(lines: string[] = []): AboutMeMeta {
  const meta: AboutMeMeta = {};
  for (const line of lines) {
    const f = parseFieldLine(line);
    if (f) meta[f.key] = f.value;
  }
  return meta;
}

export function parseAboutMe(md: string): AboutMe {
  const s = splitSections(md);
  return {
    identity: parseIdentity(s['IDENTITY']),
    summary: (s['SUMMARY'] || []).join('\n').trim(),
    skills: parseSkills(s['SKILLS']),
    experience: parseExperience(s['WORK EXPERIENCE']),
    projects: parseProjects(s['PROJECTS']),
    education: parseEducation(s['EDUCATION']),
    meta: parseMeta(s['META']),
  };
}
