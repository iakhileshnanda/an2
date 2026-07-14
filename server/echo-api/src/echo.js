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

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4-5';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

async function openRouterRequest(body) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
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

// --- Groq streaming tool loop ------------------------------------------------
// Same tool loop as runModelGroq, but with stream: true. Text deltas are
// forwarded through emit('delta', ...) as they arrive; tool rounds surface as
// emit('status', ...). Deltas are cosmetic — the returned reply is authoritative
// and the frontend reconciles against it, which is what lets the malformed
// tool-call recovery keep working under streaming.

// Hold back this many trailing chars during emission so a partial "<function="
// at the buffer tail can't leak to the visitor before we can see what it is.
const STREAM_HOLDBACK = 12;

async function runModelGroqStream({ system, messages }, emit) {
  const convo = [
    { role: 'system', content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let lastToolPayload = null;
  let lastToolStatus = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    let content = '';
    let emittedLen = 0;
    let gated = false; // stop emitting the moment malformed tool syntax appears
    let finish = null;
    const toolCalls = [];
    let recovered = null;

    try {
      const stream = await getGroq().chat.completions.create({
        model: GROQ_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.6,
        tools: GROQ_TOOL_DEFS,
        tool_choice: 'auto',
        stream: true,
        messages: convo,
      });

      for await (const chunk of stream) {
        const choice = chunk.choices && chunk.choices[0];
        if (!choice) continue;
        if (choice.finish_reason) finish = choice.finish_reason;
        const d = choice.delta || {};

        if (Array.isArray(d.tool_calls)) {
          for (const tc of d.tool_calls) {
            const i = tc.index || 0;
            if (!toolCalls[i]) {
              toolCalls[i] = { id: tc.id || `call_${i}`, type: 'function', function: { name: '', arguments: '' } };
            }
            if (tc.id) toolCalls[i].id = tc.id;
            if (tc.function && tc.function.name) toolCalls[i].function.name += tc.function.name;
            if (tc.function && tc.function.arguments) toolCalls[i].function.arguments += tc.function.arguments;
          }
        }

        if (typeof d.content === 'string' && d.content) {
          content += d.content;
          if (!gated && content.includes('<function=')) gated = true;
          if (!gated && !toolCalls.length) {
            const safeEnd = content.length - STREAM_HOLDBACK;
            if (safeEnd > emittedLen) {
              emit('delta', { text: content.slice(emittedLen, safeEnd) });
              emittedLen = safeEnd;
            }
          }
        }
      }
    } catch (err) {
      if (!isToolUseFailed(err)) throw err;
      recovered = recoverMalformedToolCall(err);
      if (!recovered) throw err;
      console.warn('[echo] recovered malformed Groq tool call (stream):', recovered.tool_calls[0].function.name);
    }

    // Malformed tool syntax streamed as plain content — recover from the buffer.
    if (!recovered && gated && !toolCalls.length) {
      const m = content.match(/<function=([\w-]+)[\s(>=]*(\{[\s\S]*?\})/);
      if (m && TOOL_IMPLS[m[1]]) {
        try {
          recovered = {
            role: 'assistant',
            content: null,
            tool_calls: [
              { id: `recovered_${Date.now()}`, type: 'function', function: { name: m[1], arguments: JSON.stringify(JSON.parse(m[2])) } },
            ],
          };
          console.warn('[echo] recovered malformed Groq tool call (content):', m[1]);
        } catch {
          /* args unparseable — fall through to a cleaned text reply */
        }
      }
    }

    const activeToolCalls = recovered ? recovered.tool_calls : toolCalls.filter(Boolean);

    if ((finish === 'tool_calls' || recovered) && activeToolCalls.length) {
      convo.push(
        recovered || { role: 'assistant', content: content || null, tool_calls: activeToolCalls }
      );

      for (const tc of activeToolCalls) {
        const impl = TOOL_IMPLS[tc.function.name];
        const status = TOOL_STATUS[tc.function.name];
        if (status) emit('status', { status });
        let result;
        try {
          const args = JSON.parse(tc.function.arguments || '{}');
          result = impl ? await impl(args) : { error: `unknown tool ${tc.function.name}` };
          if (!result.error) {
            lastToolPayload = result;
            lastToolStatus = status || null;
          }
        } catch (err) {
          result = { error: String(err && err.message ? err.message : err) };
        }
        convo.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue;
    }

    // Final round — flush what was held back, minus any malformed markup.
    if (!gated && content.length > emittedLen) {
      emit('delta', { text: content.slice(emittedLen) });
    }
    const reply = content.replace(/<function=[\s\S]*?(<\/function>|$)/g, '').trim();
    return { reply, payload: lastToolPayload, toolStatus: lastToolStatus };
  }

  return { reply: '', payload: lastToolPayload, toolStatus: lastToolStatus };
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

function anthropicAvailable() {
  const key = process.env.ANTHROPIC_API_KEY || '';
  return key.startsWith('sk-ant-');
}

function openRouterAvailable() {
  const key = process.env.OPENROUTER_API_KEY || '';
  return key.startsWith('sk-or-');
}

function nvidiaAvailable() {
  const key = process.env.NVIDIA_API_KEY || '';
  return key.startsWith('nvapi-');
}

async function nvidiaRequest(body) {
  const res = await fetch(NVIDIA_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function runModelNvidia({ system, messages }) {
  const convo = [
    { role: 'system', content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let lastToolPayload = null;
  let lastToolStatus = null;
  let final = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const data = await nvidiaRequest({
      model: NVIDIA_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.6,
      tools: GROQ_TOOL_DEFS,
      tool_choice: 'auto',
      messages: convo,
    });

    const msg = data.choices[0].message;
    const stopReason = data.choices[0].finish_reason;

    if (stopReason === 'tool_calls' && Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
      convo.push(msg);
      for (const tc of msg.tool_calls) {
        if (tc.type !== 'function') continue;
        const impl = TOOL_IMPLS[tc.function.name];
        let result;
        try {
          const args = JSON.parse(tc.function.arguments || '{}');
          result = impl ? await impl(args) : { error: `unknown tool ${tc.function.name}` };
          if (!result.error) { lastToolPayload = result; lastToolStatus = TOOL_STATUS[tc.function.name] || null; }
        } catch (err) {
          result = { error: String(err && err.message ? err.message : err) };
        }
        convo.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue;
    }

    final = msg;
    break;
  }

  const reply = final ? (final.content || '').trim() : '';
  return { reply, payload: lastToolPayload, toolStatus: lastToolStatus };
}

async function runModelOpenRouter({ system, messages }) {
  const convo = [
    { role: 'system', content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let lastToolPayload = null;
  let lastToolStatus = null;
  let final = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const data = await openRouterRequest({
      model: OPENROUTER_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.6,
      tools: GROQ_TOOL_DEFS,
      tool_choice: 'auto',
      messages: convo,
    });

    const msg = data.choices[0].message;
    const stopReason = data.choices[0].finish_reason;

    if (stopReason === 'tool_calls' && Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
      convo.push(msg);
      for (const tc of msg.tool_calls) {
        if (tc.type !== 'function') continue;
        const impl = TOOL_IMPLS[tc.function.name];
        let result;
        try {
          const args = JSON.parse(tc.function.arguments || '{}');
          result = impl ? await impl(args) : { error: `unknown tool ${tc.function.name}` };
          if (!result.error) { lastToolPayload = result; lastToolStatus = TOOL_STATUS[tc.function.name] || null; }
        } catch (err) {
          result = { error: String(err && err.message ? err.message : err) };
        }
        convo.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue;
    }

    final = msg;
    break;
  }

  const reply = final ? (final.content || '').trim() : '';
  return { reply, payload: lastToolPayload, toolStatus: lastToolStatus };
}

async function runModel(opts) {
  if (process.env.GROQ_API_KEY) {
    try {
      return await runModelGroq(opts);
    } catch (err) {
      console.warn('[echo] Groq failed, trying fallbacks:', err.message);
      if (openRouterAvailable()) {
        try { return await runModelOpenRouter(opts); } catch (e) { console.warn('[echo] OpenRouter failed:', e.message); }
      }
      if (nvidiaAvailable()) {
        try { return await runModelNvidia(opts); } catch (e) { console.warn('[echo] NVIDIA failed:', e.message); }
      }
      if (anthropicAvailable()) return runModelAnthropic(opts);
      throw err;
    }
  }
  if (openRouterAvailable()) {
    try { return await runModelOpenRouter(opts); } catch (e) { console.warn('[echo] OpenRouter failed:', e.message); }
  }
  if (nvidiaAvailable()) return runModelNvidia(opts);
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

// Streaming variant of handleEcho for the SSE endpoint. Emits 'delta' and
// 'status' events through `emit` while the model runs; the returned object is
// the authoritative result (same shape as handleEcho) for the final 'done'
// event. The 'leaving' trigger stays on the JSON endpoint — nothing to stream.
async function handleEchoStream(body = {}, emit) {
  const { message, history = [], visitorId = null, sessionContext = {} } = body;

  if (typeof message !== 'string' || !message.trim()) {
    const err = new Error('message required');
    err.status = 400;
    throw err;
  }
  if (message.length > 1000) {
    const err = new Error('message too long');
    err.status = 400;
    throw err;
  }

  const stored = visitorId ? await memory.load(visitorId) : null;
  const returning = !!stored && ((Number(sessionContext.visitCount) || 1) > 1 || !!stored.lastVisitSummary);
  const system = buildSystemPrompt({ stored, returning, sessionContext, trigger: null });

  const messages = sanitizeHistory(history);
  messages.push({ role: 'user', content: message });

  let result;
  if (process.env.GROQ_API_KEY) {
    try {
      result = await runModelGroqStream({ system, messages }, emit);
    } catch (err) {
      console.warn('[echo] Groq stream failed, trying fallbacks:', err.message);
      if (openRouterAvailable()) {
        try { result = await runModelOpenRouter({ system, messages }); } catch (e) { console.warn('[echo] OpenRouter failed:', e.message); }
      }
      if (!result && nvidiaAvailable()) {
        try { result = await runModelNvidia({ system, messages }); } catch (e) { console.warn('[echo] NVIDIA failed:', e.message); }
      }
      if (!result && anthropicAvailable()) result = await runModelAnthropic({ system, messages });
      if (!result) throw err;
    }
  } else if (openRouterAvailable()) {
    try { result = await runModelOpenRouter({ system, messages }); } catch (e) { console.warn('[echo] OpenRouter failed:', e.message); }
    if (!result && nvidiaAvailable()) result = await runModelNvidia({ system, messages });
    if (!result) result = await runModelAnthropic({ system, messages });
  } else if (nvidiaAvailable()) {
    result = await runModelNvidia({ system, messages });
  } else {
    result = await runModelAnthropic({ system, messages });
  }

  if (visitorId) await memory.recordTurn(visitorId, { sessionContext, message });

  const out = { reply: result.reply, nextState: result.payload ? 'PRESENTING' : 'TALKING' };
  if (result.toolStatus) out.toolStatus = result.toolStatus;
  if (result.payload) out.structuredPayload = result.payload;
  return out;
}

module.exports = { handleEcho, handleEchoStream, GROQ_MODEL, ANTHROPIC_MODEL };
