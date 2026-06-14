import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '@store/useStore';
import styles from './ChapterBeliefs.module.css';

const BELIEFS = [
  {
    bold: 'Build.',
    text: 'Don\'t wait for permission. The best portfolio is a body of shipped work that nobody asked you to make.',
  },
  {
    bold: 'Obsess.',
    text: 'Surface-level knowledge is comfortable. Depth is where the power is. Go deep enough that you can teach it.',
  },
  {
    bold: 'Empathize.',
    text: 'Code runs on machines. Products run on people. Understand the human first, then write the function.',
  },
  {
    bold: 'Endure.',
    text: 'Every overnight success is years of invisible work. The gap between good and great is just time plus stubbornness.',
  },
];

export default function ChapterBeliefs() {
  const setCurrentChapter = useStore((s) => s.setCurrentChapter);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCurrentChapter(5); },
      { threshold: 0.3 }
    );
    const el = document.getElementById('chapter-beliefs');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="chapter-beliefs"
      className={`chapter-section min-h-screen relative flex items-center ${styles.section}`}
    >
      <div
        className={`absolute top-8 left-8 font-monument leading-none pointer-events-none select-none ${styles.watermark}`}
      >
        05
      </div>

      <div className="max-w-3xl mx-auto relative z-10 px-6">
        <motion.h2
          className={`font-human-italic leading-none mb-4 ${styles.title}`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Beliefs
        </motion.h2>

        <div className={`w-24 h-[1px] mb-16 ${styles.divider}`} />

        <div className="space-y-12">
          {BELIEFS.map((belief, i) => (
            <motion.p
              key={i}
              className="font-human text-xl md:text-2xl leading-relaxed"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 * i }}
            >
              <strong className={`font-human ${styles.beliefBold}`}>
                {belief.bold}
              </strong>{' '}
              {belief.text}
            </motion.p>
          ))}
        </div>

        <motion.p
          className={`font-human-italic text-4xl md:text-5xl mt-20 ${styles.japaneseText}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
        >
          信念
        </motion.p>
        <p className={`font-code text-xs mt-2 ${styles.translationText}`}>
          shinnen — belief
        </p>
      </div>
    </section>
  );
}
