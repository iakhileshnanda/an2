'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const Groq = require('groq-sdk');
const { buildSystemPrompt } = require('./systemPrompt');
const { TOOL_DEFS, TOOL_IMPLS, TOOL_STATUS } = require('./tools');
const memory = require('./memory');

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const ANTHROPIC_MODEL = process.env.ECHO_MODEL || 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;
const MAX_TOOL_ROUNDS = 4;

// Convert Anthropic-style tool defs to OpenAI format for Groq
const GROQ_TOOL_DEFS = TOOL_DEFS.map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: t.input_schema },
}));

let anthropicClient = null;
function getAnthropic() {
  if (!anthropicClient) anthropicClient = new Anthropic();
  return anthropicClient;
}

let groqClient = null;
function getGroq() {
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));
}

function textFromAnthropicContent(content) {
  if (!Array.isArray(content)) return '';
  return content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

// --- Groq tool loop (OpenAI-compatible) -------------------------------------

// llama-3.3 on Groq sometimes emits the tool call as raw text
// ("<function=get_project {\"name\":\"ghost\"}</function>") instead of a proper
// tool_calls block. Groq rejects that with a 400 code=tool_use_failed but hands
// back the malformed text in failed_generation — parse the intent out of it and
// synthesize the tool_calls message the model meant to send.
function recoverMalformedToolCall(err) {
  const body = err && err.error;
  const failed =
    (body && body.error && body.error.failed_generation) ||
    (body && body.failed_generation);
  if (typeof failed !== 'string') return null;

  const m = failed.match(/<function=([\w-]+)[\s(>=]*(\{[\s\S]*?\})/);
  if (!m || !TOOL_IMPLS[m[1]]) return null;

  let args;
  try {
    args = JSON.parse(m[2]);
  } catch {
    return null;
  }

  return {
    role: 'assistant',
    content: null,
    tool_calls: [
      {
        id: `recovered_${Date.now()}`,
        type: 'function',
        function: { name: m[1], arguments: JSON.stringify(args) },
      },
    ],
  };
}

function isToolUseFailed(err) {
  const body = err && err.error;
  const code = (body && body.error && body.error.code) || (body && body.code);
  return err && err.status === 400 && code === 'tool_use_failed';
}

// One Groq round: returns { message, finish_reason }. Recovers malformed tool
// calls from the 400 body; if unparseable, retries the round once (the flake is
// stochastic) before giving up.
async function groqRound(convo, { retried = false } = {}) {
  try {
    const res = await getGroq().chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.6,
      tools: GROQ_TOOL_DEFS,
      tool_choice: 'auto',
      messages: convo,
    });
    return { message: res.choices[0].message, finish_reason: res.choices[0].finish_reason };
  } catch (err) {
    if (isToolUseFailed(err)) {
      const recovered = recoverMalformedToolCall(err);
      if (recovered) {
        console.warn('[echo] recovered malformed Groq tool call:', recovered.tool_calls[0].function.name);
        return { message: recovered, finish_reason: 'tool_calls' };
      }
      if (!retried) {
        console.warn('[echo] Groq tool_use_failed (unrecoverable), retrying round once');
        return groqRound(convo, { retried: true });
      }
    }
    throw err;
  }
}

async function runModelGroq({ system, messages }) {
  // Build OpenAI-style message list: system + history
  const convo = [
    { role: 'system', content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let lastToolPayload = null;
  let lastToolStatus = null;
  let final = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const { message: msg, finish_reason: stopReason } = await groqRound(convo);

    if (stopReason === 'tool_calls' && Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
      convo.push(msg);
      const toolResults = [];

      for (const tc of msg.tool_calls) {
        if (tc.type !== 'function') continue;
        const impl = TOOL_IMPLS[tc.function.name];
        let result;
        try {
          const args = JSON.parse(tc.function.arguments || '{}');
          result = impl ? await impl(args) : { error: `unknown tool ${tc.function.name}` };
          if (!result.error) {
            lastToolPayload = result;
            lastToolStatus = TOOL_STATUS[tc.function.name] || null;
          }
        } catch (err) {
          result = { error: String(err && err.message ? err.message : err) };
        }
        toolResults.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      convo.push(...toolResults);
      continue;
    }

    final = msg;
    break;
  }

  // Safety net: if malformed tool syntax leaked into the visible reply text,
  // strip it rather than showing the visitor raw <function=...> markup.
  const reply = final
    ? (final.content || '').replace(/<function=[\s\S]*?(<\/function>|$)/g, '').trim()
    : '';
  return { reply, payload: lastToolPayload, toolStatus: lastToolStatus };
}

// --- Anthropic tool loop (fallback) -----------------------------------------

async function runModelAnthropic({ system, messages }) {
  const convo = messages.slice();
  let lastToolPayload = null;
  let lastToolStatus = null;
  let final = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const res = await getAnthropic().messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
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
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }

      convo.push({ role: 'user', content: toolResults });
      continue;
    }

    final = res;
    break;
  }

  const reply = final ? textFromAnthropicContent(final.content) : '';
  return { reply, payload: lastToolPayload, toolStatus: lastToolStatus };
}

// --- Provider wrapper: Groq first, Anthropic fallback -----------------------

// Anthropic is optional — we only try the fallback when a real-looking key is
// present, so a placeholder/absent key surfaces the actual Groq error instead
// of a guaranteed auth failure.
function anthropicAvailable() {
  const key = process.env.ANTHROPIC_API_KEY || '';
  return key.startsWith('sk-ant-');
}

async function runModel(opts) {
  if (process.env.GROQ_API_KEY) {
    try {
      return await runModelGroq(opts);
    } catch (err) {
      if (!anthropicAvailable()) throw err;
      console.warn('[echo] Groq failed, falling back to Anthropic:', err.message);
    }
  }
  return runModelAnthropic(opts);
}

// --- Main handler -----------------------------------------------------------

async function handleEcho(body = {}) {
  const {
    message,
    history = [],
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

  const stored = visitorId ? await memory.load(visitorId) : null;
  const returning = !!stored && ((Number(sessionContext.visitCount) || 1) > 1 || !!stored.lastVisitSummary);

  const system = buildSystemPrompt({ stored, returning, sessionContext, trigger });

  const messages = sanitizeHistory(history);
  if (isLeaving) {
    messages.push({
      role: 'user',
      content: '(system trigger: the visitor is leaving. Emit your one-line visit summary now, per the LEAVING instruction.)',
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

  const { reply, payload, toolStatus } = await runModel({ system, messages });

  if (visitorId) {
    await memory.recordTurn(visitorId, { sessionContext, message });
    if (isLeaving && reply) await memory.writeSummary(visitorId, reply);
  }

  const nextState = isLeaving ? 'LEAVING' : payload ? 'PRESENTING' : 'TALKING';

  const out = { reply, nextState };
  if (toolStatus) out.toolStatus = toolStatus;
  if (payload) out.structuredPayload = payload;
  return out;
}

module.exports = { handleEcho, GROQ_MODEL, ANTHROPIC_MODEL };
