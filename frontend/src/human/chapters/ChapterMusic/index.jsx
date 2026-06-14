import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '@store/useStore';
import styles from './ChapterMusic.module.css';

const MUSIC_CARDS = [
  { era: 'School Days', artist: 'Linkin Park', note: 'Raw angst made sense when nothing else did.' },
  { era: 'College', artist: 'Tame Impala', note: 'Music that sounds like thinking feels.' },
  { era: 'Early Career', artist: 'Nujabes', note: 'Lo-fi before it had a name. Code music.' },
  { era: 'Now', artist: 'Jai Paul', note: 'Unfinished genius. Relatable.' },
];

export default function ChapterMusic() {
  const setCurrentChapter = useStore((s) => s.setCurrentChapter);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCurrentChapter(4); },
      { threshold: 0.3 }
    );
    const el = document.getElementById('chapter-music');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="chapter-music"
      className={`chapter-section min-h-screen relative flex items-center ${styles.section}`}
    >
      <div
        className={`absolute top-8 left-8 font-monument leading-none pointer-events-none select-none ${styles.watermark}`}
      >
        04
      </div>

      <div className="max-w-4xl mx-auto relative z-10 px-6 w-full">
        <motion.h2
          className={`font-human-italic leading-none mb-4 ${styles.title}`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Music
        </motion.h2>

        <div className={`w-24 h-[1px] mb-12 ${styles.divider}`} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {MUSIC_CARDS.map((card, i) => (
            <motion.div
              key={card.era}
              className={`group p-8 transition-colors duration-300 border ${styles.musicCard}`}
              data-interactive
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              whileHover={{
                background: '#7B1FA2',
                color: '#FFFFFF',
              }}
            >
              <p className={`font-code text-xs tracking-widest uppercase mb-2 ${styles.cardEra}`}>
                {card.era}
              </p>
              <h3 className={`font-human text-2xl md:text-3xl mb-4 ${styles.cardArtist}`}>
                {card.artist}
              </h3>
              <p className={`font-human-italic text-base ${styles.cardNote}`}>
                {card.note}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className={`font-human-italic text-4xl md:text-5xl mt-8 ${styles.japaneseText}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
        >
          音楽
        </motion.p>
        <p className={`font-code text-xs mt-2 ${styles.translationText}`}>
          ongaku — music
        </p>
      </div>
    </section>
  );
}
