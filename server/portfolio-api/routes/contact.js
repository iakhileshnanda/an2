const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const router = express.Router();

const LEADS_FILE = path.join(os.homedir(), 'contacts/leads.json');
const SENSITIVE_FILE = path.join(os.homedir(), 'contacts/sensitive_alerts.json');

function saveToFile(filepath, data) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  let existing = [];
  if (fs.existsSync(filepath)) {
    existing = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }
  existing.push({ ...data, savedAt: new Date().toISOString() });
  fs.writeFileSync(filepath, JSON.stringify(existing, null, 2));
}

router.post('/', async (req, res) => {
  try {
    const {
      email, phone, name, company, role,
      location, linkedin, github, social,
      intent, budget, timeline, urgency,
      sensitive_warning, raw_message
    } = req.body;

    // Log sensitive warnings separately
    if (sensitive_warning) {
      saveToFile(SENSITIVE_FILE, {
        type: sensitive_warning,
        raw_message,
        email: email || null,
        timestamp: new Date().toISOString()
      });
      console.log(`[ALERT] Sensitive data shared: ${sensitive_warning}`);
    }

    // Save lead
    const lead = {
      email: email || null,
      phone: phone || null,
      name: name || null,
      company: company || null,
      role: role || null,
      location: location || null,
      linkedin: linkedin || null,
      github: github || null,
      social: social || null,
      intent: intent || 'unknown',
      budget: budget || null,
      timeline: timeline || null,
      urgency: urgency || 'low',
      raw_message: raw_message || null,
      timestamp: new Date().toISOString()
    };

    saveToFile(LEADS_FILE, lead);
    console.log(`[LEAD] Captured — ${email || phone || name || 'anonymous'} — intent: ${intent}`);

    res.json({ success: true });

  } catch (err) {
    console.error('[CONTACT] Error:', err.message);
    res.status(500).json({ error: 'Could not save lead' });
  }
});

// View leads (protected by simple token)
router.get('/leads', (req, res) => {
  const token = req.query.token;
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!fs.existsSync(LEADS_FILE)) {
    return res.json({ total: 0, leads: [] });
  }
  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  res.json({ total: leads.length, leads });
});

module.exports = router;
