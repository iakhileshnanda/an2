import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '@store/useStore';
import styles from './ChapterChild.module.css';

export default function ChapterChild() {
  const setCurrentChapter = useStore((s) => s.setCurrentChapter);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCurrentChapter(0); },
      { threshold: 0.3 }
    );
    const el = document.getElementById('chapter-child');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="chapter-child"
      className={`chapter-section min-h-screen relative flex items-center ${styles.section}`}
    >
      {/* Chapter number watermark */}
      <div
        className={`absolute top-8 left-8 font-monument leading-none pointer-events-none select-none ${styles.watermark}`}
      >
        00
      </div>

      <div className="max-w-4xl mx-auto relative z-10 px-6">
        <motion.h2
          className={`font-human-italic leading-none mb-4 ${styles.title}`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          The Child
        </motion.h2>

        <motion.div
          className={`w-24 h-[1px] mb-12 ${styles.divider}`}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ transformOrigin: 'left' }}
        />

        {/* Photo placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`aspect-[4/3] rounded-sm overflow-hidden ${styles.photoPlaceholder}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 * i }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className={`font-human-italic text-2xl ${styles.memoryLabel}`}>
                  memory {String(i).padStart(2, '0')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          className={`font-human text-xl md:text-2xl leading-relaxed max-w-2xl ${styles.bodyText}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Before the code, there was curiosity. A kid who took apart every
          gadget in the house. Who asked "why" until everyone stopped answering.
          Who found a computer and never looked back.
        </motion.p>

        <motion.p
          className={`font-human-italic text-4xl md:text-5xl mt-16 ${styles.japaneseText}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.6 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          始まり
        </motion.p>
        <p className={`font-code text-xs mt-2 ${styles.translationText}`}>
          hajimari — beginning
        </p>
      </div>
    </section>
  );
}
