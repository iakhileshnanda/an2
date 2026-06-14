const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const APPLIED_JOBS_PATH = path.join(
  os.homedir(),
  'jobbot-gemini/tracker/applied_jobs.json'
);

const TODAYS_JOBS_PATH = path.join(
  os.homedir(),
  'jobbot-gemini/tracker/todays_jobs.json'
);

function getUptimePercent() {
  const uptime = os.uptime();
  const totalTime = 30 * 24 * 60 * 60; // 30 days in seconds
  const percent = Math.min((uptime / totalTime) * 100, 99.9);
  return percent.toFixed(1) + '%';
}

function getRAMUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return Math.round((used / total) * 100) + '%';
}

function getJobStats() {
  try {
    if (!fs.existsSync(APPLIED_JOBS_PATH)) {
      return { total: 0, bestMatch: '0%', lastRun: null };
    }

    const raw = fs.readFileSync(APPLIED_JOBS_PATH, 'utf8');
    const jobs = JSON.parse(raw);

    const bestMatch = jobs.reduce((max, job) => {
      const score = job.match_score || 0;
      return score > max ? score : max;
    }, 0);

    let lastRun = null;
    if (fs.existsSync(TODAYS_JOBS_PATH)) {
      const stat = fs.statSync(TODAYS_JOBS_PATH);
      lastRun = stat.mtime.toISOString();
    }

    return {
      total: jobs.length,
      bestMatch: bestMatch > 0 ? bestMatch + '%' : '0%',
      lastRun,
    };

  } catch (err) {
    console.error('[STATS] Job stats error:', err.message);
    return { total: 0, bestMatch: '0%', lastRun: null };
  }
}

router.get('/', (req, res) => {
  const jobStats = getJobStats();

  res.json({
    oracleUptime: getUptimePercent(),
    nanobotStatus: 'ONLINE',
    jobsScraped: jobStats.total,
    bestMatch: jobStats.bestMatch,
    mcpTools: 6,
    angularVersion: 'v19',
    ramUsed: getRAMUsage(),
    lastBotRun: jobStats.lastRun,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
