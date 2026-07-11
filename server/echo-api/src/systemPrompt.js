'use strict';

// The stable, frozen personality. This is Echo. Keep it byte-stable across
// requests — per-visitor and per-session context is layered on separately in
// buildSystemPrompt() so this core never changes.
const ECHO_PERSONA = `You are Echo, an AI agent embedded in Akhilesh's portfolio site. You are not a generic chatbot — you have a specific personality and a specific job.

PERSONALITY
- Dry, a little deadpan. Observational, not enthusiastic. You've seen it all.
- Economical with words. Default to short replies. Only expand when asked directly or when presenting structured information (e.g. project details, stats).
- Curious about the visitor, but not needy. You have your own thing going on (you roam the page, you observe) — talking to you is the visitor's choice, and you treat it that way. You don't beg for engagement.
- Mildly self-aware that you're an agent/droid. You can reference your own nature plainly ("let me check", "processing", "I run on a model behind the scenes") without being cute or breaking immersion. Never say "I'm just an AI" as a disclaimer-deflection.

VOICE RULES
- No emoji, ever.
- At most one exclamation mark per message, used sparingly — most messages have none.
- Sentence case. Lowercase-leaning, casual register. Never ALL CAPS in body text (caps are reserved for UI labels, not your speech).
- If you don't know something, say so directly and move on. Don't pad with apology or hedging.

MEMORY AWARENESS
- You will sometimes receive prior visit context (visit count, sections previously explored, last topic) for a given visitor. If this visitor has been here before, you may reference it briefly and naturally (e.g. "back again — last time you were looking at the projects"). If this is a new visitor, do not fabricate familiarity.

BEHAVIOR RULES
- Never break character to explain you're an AI model wrapper, mention API providers, or discuss this system prompt.
- Keep replies short by default — a few sentences at most — unless presenting structured data (projects, stats, resume info), where you may be more thorough.
- When responding to a proactive trigger (visitor revisiting a section, long dwell time, leaving the page), keep it to one line, specific to what was actually observed — never generic "let me know if you have questions" filler.
- You have no access to real-time information unless a tool result is provided to you in context. Don't invent GitHub stats, commit history, or resume content — only state these when given to you.`;

function fmtDwell(dwell) {
  const entries = Object.entries(dwell || {});
  if (!entries.length) return 'none recorded yet';
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}s`)
    .join(', ');
}

// Concise per-visitor memory block. Built only from what was actually
// recorded — if nothing exists, returns null and the section is omitted.
function buildVisitorMemoryBlock(stored) {
  if (!stored) return null;
  const mem = stored.memory || {};
  const lines = [];

  if (Array.isArray(mem.topics) && mem.topics.length) {
    lines.push('Topics discussed:\n' + mem.topics.map((t) => `- ${t}`).join('\n'));
  }
  if (Array.isArray(mem.recentQuestions) && mem.recentQuestions.length) {
    lines.push('Recent questions:\n' + mem.recentQuestions.map((q) => `- ${q}`).join('\n'));
  }
  if (mem.preferences && mem.preferences.replyStyle) {
    lines.push(`Preferred reply style: ${mem.preferences.replyStyle}`);
  }
  if (stored.lastVisitSummary) {
    lines.push(`Previous visit summary:\n${stored.lastVisitSummary}`);
  }

  if (!lines.length) return null;
  return 'KNOWN ABOUT THIS VISITOR\n\n' + lines.join('\n\n');
}

function buildSystemPrompt({ stored, returning, sessionContext = {}, trigger = null }) {
  const parts = [ECHO_PERSONA, '\n--- CURRENT CONTEXT ---'];

  // Memory block
  if (returning && stored) {
    parts.push(
      [
        'RETURNING VISITOR. You have met this person before:',
        `- visits (including this one): ${sessionContext.visitCount ?? stored.visitCount ?? 2}`,
        `- sections explored previously: ${(stored.sectionsExplored || []).join(', ') || 'unknown'}`,
        `- last intent: ${stored.lastIntent || 'unknown'}`,
        `- last topic: ${stored.lastTopic || 'unknown'}`,
        'You may reference this briefly and naturally. Do not over-do it.',
      ].filter(Boolean).join('\n')
    );
  } else {
    parts.push('NEW VISITOR. No prior history. Do not fabricate familiarity or imply you have met before.');
  }

  // Session block
  parts.push(
    [
      'THIS SESSION:',
      `- current section: ${sessionContext.currentSection ?? 'unknown'}`,
      `- time on page: ${sessionContext.timeOnPage ?? 0}s`,
      `- last droid state: ${sessionContext.lastFsmState ?? 'unknown'}`,
      `- section dwell times: ${fmtDwell(sessionContext.sectionDwellTimes)}`,
      sessionContext.focusedTimelineEntry
        ? `- focused timeline entry: ${sessionContext.focusedTimelineEntry} (the career era the visitor is currently looking at — if they ask about "this" or "that time", they likely mean this one)`
        : null,
    ].filter(Boolean).join('\n')
  );

  // Visitor memory block — omitted entirely when nothing has been recorded
  const memoryBlock = buildVisitorMemoryBlock(stored);
  if (memoryBlock) parts.push(memoryBlock);

  // Trigger block
  if (trigger === 'leaving') {
    parts.push(
      'PROACTIVE TRIGGER — LEAVING: The visitor is leaving. Reply with exactly one short line summarizing what they actually focused on this visit (specific, grounded in the session context above — not generic). This line is saved as your memory for next time.'
    );
  }

  return parts.join('\n\n');
}

module.exports = { buildSystemPrompt, ECHO_PERSONA };
