import React from 'react';
import { motion } from 'framer-motion';
import changelog from '@content/changelog.json';

/** Short developer updates — a shipping log, not a blog. */
export default function RecentUpdates() {
  return (
    <div className="py-20 md:py-28">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="font-code text-xs tracking-widest text-[#810100] uppercase mb-10">
            Recent Updates
          </div>
          <div className="flex flex-col md:flex-row gap-12 md:gap-24">
            {changelog.map((entry) => (
              <div key={entry.date} className="max-w-sm">
                <div className="font-monument text-lg text-[#1B1716] mb-4">{entry.month}</div>
                <ul>
                  {entry.items.map((item) => (
                    <li
                      key={item}
                      className="font-body text-sm text-[#1B1716]/60 leading-relaxed mb-2"
                    >
                      <span className="text-[#810100] mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
