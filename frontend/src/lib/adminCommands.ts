/**
 * adminCommands.ts — parses the natural-ish admin command strings typed into the
 * Maya chat (admin mode) into structured actions the backend POST /api/update
 * endpoint applies to about-me.md.
 *
 * Supported commands:
 *   add project: <name> | <pitch> | <stack> | <status>
 *   update skill: add <skill> to <category>
 *   set availability: <text>
 *   set meta: <key> = <value>
 *   add achievement: <text>            (optionally "... at <Company>")
 */

export type AdminAction =
  | { type: 'add_project'; payload: { name: string; pitch: string; stack: string; status: string } }
  | { type: 'update_skill'; payload: { category: string; skill: string } }
  | { type: 'set_availability'; payload: { value: string } }
  | { type: 'set_meta'; payload: { key: string; value: string } }
  | { type: 'add_achievement'; payload: { text: string; company: string } };

export interface AdminParseError {
  error: string;
}

export const ADMIN_COMMAND_HELP = [
  'add project: <name> | <pitch> | <stack> | <status>',
  'update skill: add <skill> to <category>',
  'set availability: <text>',
  'set meta: <key> = <value>',
  'add achievement: <text> at <Company>',
  'exit  — leave admin mode',
].join('\n');

/** A command must start with a known verb phrase followed by a colon. */
export function looksLikeCommand(input: string): boolean {
  return /^\s*(add project|update skill|set availability|set meta|add achievement)\s*:/i.test(input);
}

function afterColon(input: string): string {
  return input.slice(input.indexOf(':') + 1).trim();
}

/**
 * Parse a raw admin input line into a structured action.
 * Returns an AdminAction, an AdminParseError, or null if it isn't a command at all.
 */
export function parseAdminCommand(input: string): AdminAction | AdminParseError | null {
  const trimmed = input.trim();
  if (!looksLikeCommand(trimmed)) return null;

  const verb = trimmed.slice(0, trimmed.indexOf(':')).trim().toLowerCase();
  const body = afterColon(trimmed);

  switch (verb) {
    case 'add project': {
      const parts = body.split('|').map((p) => p.trim());
      const [name, pitch = '', stack = '', status = 'Built'] = parts;
      if (!name) return { error: 'Project needs at least a name: "add project: Name | pitch | stack | status"' };
      return { type: 'add_project', payload: { name, pitch, stack, status } };
    }

    case 'update skill': {
      // "add <skill> to <category>"
      const m = body.match(/^add\s+(.+?)\s+to\s+(.+)$/i);
      if (!m) return { error: 'Use: "update skill: add <skill> to <category>"' };
      return { type: 'update_skill', payload: { skill: m[1].trim(), category: m[2].trim() } };
    }

    case 'set availability': {
      if (!body) return { error: 'Provide a value: "set availability: available from July 2026"' };
      return { type: 'set_availability', payload: { value: body } };
    }

    case 'set meta': {
      const m = body.match(/^(.+?)\s*=\s*(.+)$/);
      if (!m) return { error: 'Use: "set meta: <key> = <value>"' };
      return { type: 'set_meta', payload: { key: m[1].trim(), value: m[2].trim() } };
    }

    case 'add achievement': {
      if (!body) return { error: 'Provide text: "add achievement: promoted to Principal Engineer at Trustt"' };
      // Optional trailing "... at <Company>" sets which role the bullet attaches to.
      const m = body.match(/^(.*)\s+at\s+([A-Za-z0-9 .&()-]+)$/);
      if (m) return { type: 'add_achievement', payload: { text: m[1].trim(), company: m[2].trim() } };
      return { type: 'add_achievement', payload: { text: body, company: '' } };
    }

    default:
      return { error: `Unknown command "${verb}".\n${ADMIN_COMMAND_HELP}` };
  }
}

export function isParseError(x: unknown): x is AdminParseError {
  return Boolean(x) && typeof (x as AdminParseError).error === 'string';
}
