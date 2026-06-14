import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '@store/useStore';
import styles from './ChapterLove.module.css';

export default function ChapterLove() {
  const setCurrentChapter = useStore((s) => s.setCurrentChapter);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCurrentChapter(2); },
      { threshold: 0.3 }
    );
    const el = document.getElementById('chapter-love');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="chapter-love"
      className={`chapter-section min-h-screen relative flex items-center justify-center ${styles.section}`}
    >
      <div
        className={`absolute top-8 left-8 font-monument leading-none pointer-events-none select-none ${styles.watermark}`}
      >
        02
      </div>

      <div className="max-w-3xl mx-auto relative z-10 px-6 text-center">
        <motion.h2
          className={`font-human-italic leading-none mb-8 ${styles.title}`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Love
        </motion.h2>

        <div className={`w-24 h-[1px] mx-auto mb-16 ${styles.divider}`} />

        <motion.p
          className="font-human-italic text-2xl md:text-3xl leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          Some things can't go on a résumé.
        </motion.p>

        <motion.p
          className={`font-human text-lg md:text-xl leading-relaxed mt-8 max-w-xl mx-auto ${styles.reserveText}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.7 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          This page is held in reserve — for words that matter too much
          to share with everyone, but too much to leave unwritten.
        </motion.p>

        <motion.p
          className={`font-human-italic text-5xl md:text-6xl mt-20 ${styles.japaneseText}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          viewport={{ once: true }}
        >
          愛
        </motion.p>
        <p className={`font-code text-xs mt-2 ${styles.translationText}`}>
          ai — love
        </p>
      </div>
    </section>
  );
}
