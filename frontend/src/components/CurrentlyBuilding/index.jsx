import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SITE } from '@constants/siteConfig';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CurrentlyBuilding() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { githubUser, activeFallback } = SITE;
    fetch(`https://api.github.com/users/${githubUser}/events/public`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((events) => {
        const push = events.find((e) => e.type === 'PushEvent');
        if (!push) throw new Error('no push');
        const commit = push.payload.commits?.[push.payload.commits.length - 1];
        setStatus({
          repo: push.repo.name.split('/')[1],
          message: commit?.message?.split('\n')[0] || 'latest commit',
          ago: timeAgo(push.created_at),
          description: activeFallback.description,
        });
      })
      .catch(() => {
        setStatus({
          repo: activeFallback.repo,
          message: activeFallback.message,
          ago: 'recently',
          description: activeFallback.description,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-3 border border-[#1B1716]/15 px-5 py-3 mb-12 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-[#1B1716]/15" />
        <div className="h-3 w-48 bg-[#1B1716]/10 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      className="inline-flex flex-col items-start border border-[#1B1716]/18 px-5 py-4 mb-12 text-left"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-[#810100] animate-pulse" />
        <span className="font-code text-xs tracking-widest text-[#810100] uppercase">
          Active Now
        </span>
      </div>
      <p className="font-monument text-[#1B1716] text-sm tracking-wide mb-1">
        {status.repo}
        <span className="text-[#1B1716]/40 font-code font-normal normal-case tracking-normal ml-3 text-xs">
          {status.ago}
        </span>
      </p>
      <p className="font-code text-xs text-[#1B1716]/50">{status.description}</p>
      <p className="font-code text-xs text-[#1B1716]/32 mt-1 truncate max-w-xs">{status.message}</p>
    </motion.div>
  );
}
