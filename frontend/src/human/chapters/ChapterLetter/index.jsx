import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '@store/useStore';
import styles from './ChapterLetter.module.css';
import AnimatedSignature from './AnimatedSignature';

export default function ChapterLetter() {
  const setCurrentChapter = useStore((s) => s.setCurrentChapter);
  const [showSignature, setShowSignature] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCurrentChapter(6);
          setShowSignature(true);
        }
      },
      { threshold: 0.3 }
    );
    const el = document.getElementById('chapter-letter');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="chapter-letter"
      ref={sectionRef}
      className={`chapter-section min-h-screen relative flex items-center ${styles.section}`}
    >
      <div
        className={`absolute top-8 left-8 font-monument leading-none pointer-events-none select-none ${styles.watermark}`}
      >
        06
      </div>

      <div className="max-w-2xl mx-auto relative z-10 px-6">
        <motion.h2
          className={`font-human-italic leading-none mb-4 ${styles.title}`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          A Letter
        </motion.h2>

        <div className={`w-24 h-[1px] mb-12 ${styles.divider}`} />

        {/* Letter styled with left margin line */}
        <motion.div
          className={`pl-8 border-l-2 space-y-6 ${styles.letterBody}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <p className="font-human-italic text-lg md:text-xl leading-relaxed">
            Dear whoever is reading this,
          </p>
          <p className="font-human text-lg md:text-xl leading-relaxed">
            If you've scrolled this far, you've seen two versions of me.
            The system — precise, fast, obsessed with building. And the human —
            messy, curious, trying to make sense of it all.
          </p>
          <p className="font-human text-lg md:text-xl leading-relaxed">
            I'm not the most experienced engineer in the room. I'm not the
            smartest. But I might be the one who cares the most about what
            we're building and why.
          </p>
          <p className="font-human text-lg md:text-xl leading-relaxed">
            The best code I've ever written wasn't judged by its elegance.
            It was judged by the fact that it worked, for someone,
            when they needed it.
          </p>
          <p className="font-human-italic text-lg md:text-xl leading-relaxed">
            Let's build something that matters.
          </p>

          {/* Animated signature */}
          {showSignature && (
            <motion.div className="pt-8">
              {/* Old SVG signature (replaced by AnimatedSignature component)
              <svg width="200" height="60" viewBox="0 0 200 60">
                <motion.path
                  d="M10 45 C20 20, 40 15, 50 30 C55 38, 45 45, 60 40 C80 30, 70 20, 90 25 C100 28, 95 40, 110 35 C120 30, 115 20, 130 25 C140 30, 135 40, 150 35 C160 30, 170 25, 185 30"
                  fill="none"
                  stroke="#5D4037"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.5, ease: 'easeInOut' }}
                />
              </svg>
              */}
              <AnimatedSignature color="#1C1008" duration={3000} />
              <p className={`font-human-italic text-sm mt-2 ${styles.signatureName}`}>
                Akhilesh Nanda
              </p>
            </motion.div>
          )}
        </motion.div>

        <motion.p
          className={`font-human-italic text-4xl md:text-5xl mt-20 ${styles.japaneseText}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          viewport={{ once: true }}
        >
          手紙
        </motion.p>
        <p className={`font-code text-xs mt-2 ${styles.translationText}`}>
          tegami — letter
        </p>
      </div>
    </section>
  );
}
