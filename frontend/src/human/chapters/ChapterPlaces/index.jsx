import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '@store/useStore';
import styles from './ChapterPlaces.module.css';

const PINS = [
  { name: 'Hyderabad', x: '62%', y: '42%', label: 'Where it started' },
  { name: 'Bangalore', x: '60%', y: '48%', label: 'Where it\'s happening' },
  { name: 'Tokyo', x: '82%', y: '30%', label: 'Where the soul wanders' },
];

export default function ChapterPlaces() {
  const setCurrentChapter = useStore((s) => s.setCurrentChapter);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCurrentChapter(3); },
      { threshold: 0.3 }
    );
    const el = document.getElementById('chapter-places');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="chapter-places"
      className={`chapter-section min-h-screen relative flex items-center ${styles.section}`}
    >
      <div
        className={`absolute top-8 left-8 font-monument leading-none pointer-events-none select-none ${styles.watermark}`}
      >
        03
      </div>

      <div className="max-w-5xl mx-auto relative z-10 px-6 w-full">
        <motion.h2
          className={`font-human-italic leading-none mb-4 ${styles.title}`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Places
        </motion.h2>

        <div className={`w-24 h-[1px] mb-12 ${styles.divider}`} />

        {/* Simple world map representation */}
        <div className={`relative w-full aspect-[2/1] mb-12 rounded-sm overflow-hidden ${styles.mapContainer}`}>
          {/* Simplified continents as abstract shapes */}
          <svg viewBox="0 0 1000 500" className={`w-full h-full ${styles.mapSvg}`}>
            <ellipse cx="300" cy="200" rx="200" ry="120" fill="#2E7D32" />
            <ellipse cx="600" cy="180" rx="180" ry="140" fill="#2E7D32" />
            <ellipse cx="800" cy="250" rx="100" ry="90" fill="#2E7D32" />
            <ellipse cx="250" cy="350" rx="80" ry="60" fill="#2E7D32" />
          </svg>

          {/* Pin markers */}
          {PINS.map((pin, i) => (
            <motion.div
              key={pin.name}
              className="absolute flex flex-col items-center"
              style={{ left: pin.x, top: pin.y, transform: 'translate(-50%, -100%)' }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.2 }}
            >
              <div className={`w-3 h-3 rounded-full ${styles.pinDot}`} />
              <div className={`w-[1px] h-4 ${styles.pinLine}`} />
              <div className={`mt-1 font-code text-xs whitespace-nowrap ${styles.pinLabel}`}>
                {pin.name}
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
          Every city teaches you something code can't. Hyderabad taught patience.
          Bangalore taught speed. The places I haven't been yet are teaching me
          to keep moving.
        </motion.p>

        <motion.p
          className={`font-human-italic text-4xl md:text-5xl mt-16 ${styles.japaneseText}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
        >
          旅
        </motion.p>
        <p className={`font-code text-xs mt-2 ${styles.translationText}`}>
          tabi — journey
        </p>
      </div>
    </section>
  );
}
