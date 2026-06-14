const express = require('express');
const fetch = require('node-fetch');
const { chatLimiter } = require('../middleware/rateLimit');

const labPrompt = require('../prompts/lab');
const portfolioPrompt = require('../prompts/portfolio');

const router = express.Router();

const PROMPTS = {
  lab: labPrompt,
  portfolio: portfolioPrompt,
};

const NIM_MODEL = process.env.MAYA_MODEL || 'meta/llama-3.3-70b-instruct';
const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

async function askNim(messages) {
  const res = await fetch(NIM_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KIMI_API_KEY || process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: NIM_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 220,
      stream: false,
    }),
    timeout: 10000,
  });
  if (!res.ok) throw new Error(`NIM error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function askGroqFallback(messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 220,
    }),
    timeout: 10000,
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

router.post('/', chatLimiter, async (req, res) => {
  try {
    const { message, mode } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message required', code: 400 });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: 'message too long', code: 400 });
    }
    if (!mode || !PROMPTS[mode]) {
      return res.status(400).json({ error: 'mode must be "lab" or "portfolio"', code: 400 });
    }

    const messages = [
      { role: 'system', content: PROMPTS[mode] },
      { role: 'user', content: message },
    ];

    let reply;
    try {
      reply = await askNim(messages);
    } catch (e) {
      console.warn('[MAYA] NIM failed, trying Groq:', e.message);
      try {
        reply = await askGroqFallback(messages);
      } catch (e2) {
        return res.status(503).json({ error: 'maya offline', code: 503 });
      }
    }

    res.json({
      response: reply,
      mode,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('[MAYA] unexpected:', err);
    res.status(500).json({ error: 'internal error', code: 500 });
  }
});

module.exports = router;
