import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import nowFallback from '@content/now.json';
import { askEcho } from '@echo/echo-overlay';

/**
 * Live "Now" dashboard card. Renders the editorial fallback immediately and
 * upgrades to live GitHub data from /api/echo/now when it arrives — the
 * section is never empty, and a dead API just means editorial mode.
 */
export default function NowCard() {
  const [live, setLive] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/echo/now')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!cancelled && Array.isArray(d.building) && d.building.length) setLive(d);
      })
      .catch(() => {
        /* editorial fallback stays */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const building = live?.building?.length ? live.building : nowFallback.building;
  const focus = live?.currentFocus?.length ? live.currentFocus : nowFallback.currentFocus;
  const commit = live?.latestCommit || nowFallback.latestCommit;

  return (
    <motion.div
      className="border border-[#1B1716]/18 px-6 py-6 md:px-8 md:py-7 mb-12 w-full text-left"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#810100] animate-pulse" />
          <span className="font-code text-xs tracking-widest text-[#810100] uppercase">Now</span>
        </div>
        <span className="font-code text-[10px] tracking-wider text-[#1B1716]/35 uppercase">
          {live ? 'updated automatically from github' : 'editorial mode'}
        </span>
      </div>

      {/* body */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        <div>
          <div className="font-code text-xs tracking-widest text-[#1B1716]/45 uppercase mb-3">
            Building
          </div>
          <ul>
            {building.slice(0, 3).map((b) => (
              <li key={b} className="font-body text-sm text-[#1B1716]/70 leading-relaxed">
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="font-code text-xs tracking-widest text-[#1B1716]/45 uppercase mb-3">
            Latest Activity
          </div>
          {commit ? (
            <>
              <p className="font-code text-sm text-[#1B1716]/70 leading-relaxed break-words">
                {commit.message}
              </p>
              <p className="font-code text-xs text-[#1B1716]/40 mt-1">
                {commit.repo} · {commit.timeAgo}
              </p>
            </>
          ) : (
            <p className="font-body text-sm text-[#1B1716]/50 leading-relaxed">
              shipping quietly — ask echo what's new.
            </p>
          )}
        </div>

        <div>
          <div className="font-code text-xs tracking-widest text-[#1B1716]/45 uppercase mb-3">
            Current Focus
          </div>
          <ul>
            {focus.slice(0, 3).map((f) => (
              <li key={f} className="font-body text-sm text-[#1B1716]/70 leading-relaxed">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* footer */}
      <button
        type="button"
        onClick={() => askEcho(nowFallback.echoPrompt)}
        className="mt-6 font-code text-xs tracking-widest text-[#810100] uppercase hover:opacity-60 transition-opacity"
      >
        ask echo →
      </button>
    </motion.div>
  );
}
