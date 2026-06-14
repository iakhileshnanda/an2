const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const router = express.Router();

const APPLIED_JOBS_PATH = path.join(
  os.homedir(),
  'jobbot-gemini/tracker/applied_jobs.json'
);

router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(APPLIED_JOBS_PATH)) {
      return res.json({
        total: 0,
        applied: 0,
        skipped: 0,
        recentJobs: []
      });
    }

    const raw = fs.readFileSync(APPLIED_JOBS_PATH, 'utf8');
    const jobs = JSON.parse(raw);

    const applied = jobs.filter(j => j.status === 'applied');
    const skipped = jobs.filter(j => j.status === 'skipped');

    // Return last 10 jobs
    const recentJobs = jobs
      .slice(-10)
      .reverse()
      .map(job => ({
        title: job.title || 'Unknown',
        company: job.company || 'Unknown',
        matchScore: job.match_score || 0,
        status: job.status || 'unknown',
        platform: job.platform || 'unknown',
        appliedAt: job.applied_at || null,
      }));

    res.json({
      total: jobs.length,
      applied: applied.length,
      skipped: skipped.length,
      recentJobs,
    });

  } catch (err) {
    console.error('[JOBS] Error:', err.message);
    res.status(500).json({ error: 'Could not read job data' });
  }
});

module.exports = router;
