import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '@store/useStore';
import styles from './ChapterCollege.module.css';

export default function ChapterCollege() {
  const setCurrentChapter = useStore((s) => s.setCurrentChapter);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCurrentChapter(1); },
      { threshold: 0.3 }
    );
    const el = document.getElementById('chapter-college');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="chapter-college"
      className={`chapter-section min-h-screen relative flex items-center ${styles.section}`}
    >
      <div
        className={`absolute top-8 left-8 font-monument leading-none pointer-events-none select-none ${styles.watermark}`}
      >
        01
      </div>

      <div className="max-w-4xl mx-auto relative z-10 px-6">
        <motion.h2
          className={`font-human-italic leading-none mb-4 ${styles.title}`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          The College
        </motion.h2>

        <div className={`w-24 h-[1px] mb-12 ${styles.divider}`} />

        {/* Photo grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className={`aspect-square rounded-sm overflow-hidden ${styles.photoPlaceholder}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className={`font-human-italic text-lg ${styles.memoryLabel}`}>
                  {String(i).padStart(2, '0')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="font-human text-xl md:text-2xl leading-relaxed max-w-2xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          The person who showed up in 2019 was built here. Late nights in
          computer labs. Friends who became family. Lessons that had nothing
          to do with textbooks.
        </motion.p>

        <motion.p
          className={`font-human-italic text-4xl md:text-5xl mt-16 ${styles.japaneseText}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
        >
          友情
        </motion.p>
        <p className={`font-code text-xs mt-2 ${styles.translationText}`}>
          yuujou — friendship
        </p>
      </div>
    </section>
  );
}
