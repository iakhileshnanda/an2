'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { handleEcho, GROQ_MODEL, ANTHROPIC_MODEL } = require('./src/echo');
const { getNowSummary } = require('./src/now');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3005;
const STARTED_AT = Date.now();

// --- CORS ---
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowed.length ? allowed : true,
    methods: ['GET', 'POST'],
  })
);

app.use(express.json({ limit: '32kb' }));

// --- Health check (no rate limit) ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'echo-api',
    model: process.env.GROQ_API_KEY ? GROQ_MODEL : ANTHROPIC_MODEL,
    keyConfigured: Boolean(process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY),
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
  });
});

// --- Rate limit on the chat endpoint ---
const echoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Slow down — too many messages.' },
});

// --- Live "now" summary for the frontend dashboard card ---
// Cheap (in-memory cached), but still capped to keep GitHub happy.
const nowLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/echo/now', nowLimiter, async (req, res) => {
  try {
    res.json(await getNowSummary());
  } catch (err) {
    console.error('[now] error:', err.message);
    res.status(503).json({ error: 'Now summary unavailable.' });
  }
});

// --- Echo's brain ---
app.post('/api/echo', echoLimiter, async (req, res) => {
  if (!process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Echo is offline — no API key configured.' });
  }
  try {
    const result = await handleEcho(req.body || {});
    res.json(result);
  } catch (err) {
    const status = err.status || 502;
    if (status >= 500) console.error('[echo] error:', err.message);
    res.status(status).json({ error: status === 400 ? err.message : 'Echo is offline right now.' });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  const primary = process.env.GROQ_API_KEY ? GROQ_MODEL : ANTHROPIC_MODEL;
  console.log(`Echo API listening on :${PORT}  (model: ${primary})`);
});

module.exports = app;
