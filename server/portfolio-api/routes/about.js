'use strict';

const express = require('express');
const aboutStore = require('../utils/aboutStore');
const { broadcast } = require('../realtime');

const router = express.Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

/** Require a valid admin bearer token. The chat passphrase is UI-only; the
 *  real authority check is this token, which never leaves the operator. */
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: 'admin updates are not configured (ADMIN_TOKEN unset)' });
  }
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : req.get('x-admin-token');
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

// GET /api/about — parsed about-me.md as JSON (public, drives the dashboard)
router.get('/about', (req, res, next) => {
  try {
    res.json(aboutStore.readParsed());
  } catch (err) {
    next(err);
  }
});

// POST /api/update — admin-only mutation of about-me.md
// body: { type: 'add_project' | 'update_skill' | 'set_availability' | 'set_meta' | 'add_achievement', payload: {...} }
router.post('/update', requireAdmin, (req, res, next) => {
  try {
    const { type, payload } = req.body || {};
    if (!type) return res.status(400).json({ error: 'type is required' });

    const about = aboutStore.applyUpdate({ type, payload });

    // Push the new state to every connected dashboard within ~instant.
    broadcast({ type: 'about:update', data: about, action: type, ts: Date.now() });

    res.json({ ok: true, action: type, about });
  } catch (err) {
    // Validation errors from the store are client errors, not 500s.
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
