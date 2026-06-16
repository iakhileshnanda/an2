'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { buildSystemPrompt } = require('./systemPrompt');
const { TOOL_DEFS, TOOL_IMPLS, TOOL_STATUS } = require('./tools');
const { inferMode } = require('./modeInference');
const memory = require('./memory');

const MODEL = process.env.ECHO_MODEL || 'claude-opus-4-8';
const MAX_TOKENS = 1024;
const MAX_TOOL_ROUNDS = 4;

let client = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY
  return client;
}

// Frontend sends 'HIRE' | 'COLLAB' | 'CURIOUS' | null. Be liberal about what we
// accept (older callers may send 'recruiting' etc.) and normalize.
const INTENT_ALIASES = {
  HIRE: 'HIRE',
  COLLAB: 'COLLAB',
  CURIOUS: 'CURIOUS',
  recruiting: 'HIRE',
  collaborating: 'COLLAB',
  curious: 'CURIOUS',
};
function normalizeIntent(raw) {
  if (!raw || typeof raw !== 'string') return null;
  return INTENT_ALIASES[raw] || INTENT_ALIASES[raw.toUpperCase()] || null;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));
}

function textFromContent(content) {
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

/**
 * Run the model with the tool loop. Returns the final reply text plus any tool
 * presentation data captured along the way.
 */
async function runModel({ system, messages }) {
  const convo = messages.slice();
  let lastToolPayload = null;
  let lastToolStatus = null;
  let final = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: 'low' },
      system,
      tools: TOOL_DEFS,
      messages: convo,
    });

    if (res.stop_reason === 'tool_use') {
      convo.push({ role: 'assistant', content: res.content });
      const toolResults = [];

      for (const block of res.content) {
        if (block.type !== 'tool_use') continue;
        const impl = TOOL_IMPLS[block.name];
        let result;
        try {
          result = impl ? await impl(block.input || {}) : { error: `unknown tool ${block.name}` };
          if (!result.error) {
            lastToolPayload = result;
            lastToolStatus = TOOL_STATUS[block.name] || null;
          }
        } catch (err) {
          result = { error: String(err && err.message ? err.message : err) };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      convo.push({ role: 'user', content: toolResults });
      continue;
    }

    final = res;
    break;
  }

  const reply = final ? textFromContent(final.content) : '';
  return { reply, payload: lastToolPayload, toolStatus: lastToolStatus };
}

/**
 * Top-level handler for POST /api/echo.
 * @param {object} body request body (already JSON-parsed)
 * @returns {Promise<{reply,nextState,toolStatus?,structuredPayload?}>}
 */
async function handleEcho(body = {}) {
  const {
    message,
    history = [],
    intent: rawIntent = null,
    visitorId = null,
    sessionContext = {},
    trigger = null,
  } = body;

  const isLeaving = trigger === 'leaving';

  if (!isLeaving && (typeof message !== 'string' || !message.trim())) {
    const err = new Error('message required');
    err.status = 400;
    throw err;
  }
  if (typeof message === 'string' && message.length > 1000) {
    const err = new Error('message too long');
    err.status = 400;
    throw err;
  }

  const intent = normalizeIntent(rawIntent);
  const stored = visitorId ? await memory.load(visitorId) : null;
  const returning = !!stored && ((Number(sessionContext.visitCount) || 1) > 1 || !!stored.lastVisitSummary);
  const inferredMode = intent || inferMode(sessionContext.sectionDwellTimes || {});

  const system = buildSystemPrompt({ stored, returning, intent, inferredMode, sessionContext, trigger });

  const messages = sanitizeHistory(history);
  if (isLeaving) {
    messages.push({
      role: 'user',
      content:
        '(system trigger: the visitor is leaving. Emit your one-line visit summary now, per the LEAVING instruction.)',
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

  const { reply, payload, toolStatus } = await runModel({ system, messages });

  // Persist memory: record the turn, and on leaving store the summary line.
  if (visitorId) {
    await memory.recordTurn(visitorId, { sessionContext, intent: inferredMode, message });
    if (isLeaving && reply) await memory.writeSummary(visitorId, reply);
  }

  const nextState = isLeaving ? 'LEAVING' : payload ? 'PRESENTING' : 'TALKING';

  const out = { reply, nextState };
  if (toolStatus) out.toolStatus = toolStatus;
  if (payload) out.structuredPayload = payload;
  return out;
}

module.exports = { handleEcho, MODEL };
