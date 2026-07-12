import React, { useState } from 'react';
import { motion } from 'framer-motion';

const EMAIL = 'theakhileshnanda@gmail.com';
const GITHUB = 'https://github.com/iakhileshnanda';

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const handleEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.open(`mailto:${EMAIL}`, '_blank');
    }
  };

  return (
    <section id="contact" className="flex flex-col items-center justify-center py-32 px-6">
      <motion.div
        className="flex flex-col items-center gap-10 w-full max-w-xl"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={handleEmail}
            className="flex-1 font-mono text-xs tracking-widest uppercase border border-white/20 text-white px-8 py-5 hover:bg-white hover:text-black transition-colors duration-300 cursor-pointer"
          >
            {copied ? '✓ COPIED' : '✉ HIRE·ME'}
          </button>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 font-mono text-xs tracking-widest uppercase border border-white/20 text-white px-8 py-5 hover:bg-white hover:text-black transition-colors duration-300 text-center"
          >
            ↗ GITHUB
          </a>
        </div>

        <p className="font-mono text-xs text-white/25 tracking-widest">{EMAIL}</p>
      </motion.div>

      <p className="mt-24 font-mono text-xs text-white/15 tracking-widest uppercase">
        © {new Date().getFullYear()} Akhilesh Nanda
      </p>
    </section>
  );
}
