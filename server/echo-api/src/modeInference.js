'use strict';

// Map a portfolio section to the mode its attention implies.
// Heavy time on experience/résumé-ish sections -> HIRE.
// Heavy time on projects -> CURIOUS.
// COLLAB has no clean behavioral signal — it stays an explicit choice.
const SECTION_MODE = {
  experience: 'HIRE',
  numbers: 'HIRE',
  resume: 'HIRE',
  projects: 'CURIOUS',
};

/**
 * Infer a likely mode from section dwell times. Returns 'HIRE' | 'CURIOUS' | null.
 * Null means "ambiguous — ask, don't guess".
 *
 * @param {Record<string, number>} sectionDwellTimes seconds spent per section
 */
function inferMode(sectionDwellTimes = {}) {
  const totals = { HIRE: 0, CURIOUS: 0 };
  let grandTotal = 0;

  for (const [section, seconds] of Object.entries(sectionDwellTimes)) {
    const secs = Number(seconds) || 0;
    grandTotal += secs;
    const mode = SECTION_MODE[section];
    if (mode && totals[mode] !== undefined) totals[mode] += secs;
  }

  // Need a meaningful amount of attention before inferring anything.
  if (grandTotal < 8) return null;

  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const [topMode, topSecs] = ranked[0];
  const [, runnerSecs] = ranked[1] || [null, 0];

  // Top mode must dominate its share of total attention and clearly beat the runner-up.
  if (topSecs < grandTotal * 0.4) return null;
  if (topSecs < runnerSecs * 1.5) return null;

  return topMode;
}

module.exports = { inferMode };
