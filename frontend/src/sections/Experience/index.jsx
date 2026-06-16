import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import anime from 'animejs';
import experience from '@content/experience.json';
import styles from './Experience.module.css';
import CurrentlyBuilding from '@components/CurrentlyBuilding';

const springConfig = { stiffness: 80, damping: 20, mass: 0.5 };

const PHRASES = [
  'Building AI systems that think. Multi-agent simulations where hundreds of personas debate the stock market before you trade.',
  'Knowledge graphs that connect what machines read to what humans need.',
  "Maya MIRO. Autonomous tools. The kind of software that didn't exist when I started — so I'm building it.",
];

function TypingPhrase() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState('typing');

  useEffect(() => {
    if (prefersReduced) {
      setDisplayed(PHRASES[0]);
      return;
    }
    const phrase = PHRASES[phraseIdx];
    if (phase === 'typing') {
      if (displayed.length < phrase.length) {
        const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 32);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('erasing'), 2800);
      return () => clearTimeout(t);
    }
    if (phase === 'erasing') {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 12);
        return () => clearTimeout(t);
      }
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
      setPhase('typing');
    }
  }, [displayed, phase, phraseIdx, prefersReduced]);

  return (
    <p className="font-body text-base md:text-lg leading-relaxed text-[#1B1716]/65 mb-8" style={{ minHeight: '5rem' }}>
      {displayed}
      {!prefersReduced && <span className="cursor-blink text-[#810100] ml-0.5">█</span>}
    </p>
  );
}

function getCurrentYear() {
  return new Date().getFullYear();
}

export default function Experience() {
  const sectionRef = useRef(null);
  const [dayCount, setDayCount] = useState(0);
  const hasAnimated = useRef(false);
  const currentYear = getCurrentYear();

  const daysSinceStart = Math.floor(
    (Date.now() - new Date('2019-01-01').getTime()) / (1000 * 60 * 60 * 24)
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  const rawLineWidth = useTransform(scrollYProgress, [0, 0.3], ['0%', '100%']);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          anime({
            targets: { val: 0 },
            val: daysSinceStart,
            round: 1,
            duration: 2500,
            easing: 'easeOutExpo',
            update: (anim) => {
              setDayCount(Math.round(anim.animations[0].currentValue));
            },
          });
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="scene-section relative overflow-hidden"
    >
      {/* Current year — live */}
      <div className="min-h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className={`font-monument block leading-none ${styles.yearLive}`}>
              {currentYear}
            </span>
            <div className="mt-4 flex items-center gap-2">
              <span className={styles.liveDot} />
              <span className="font-code text-xs tracking-widest text-[#810100] uppercase">
                Live
              </span>
            </div>
          </motion.div>

          <motion.div
            className="flex-1 max-w-xl"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <TypingPhrase />
            <div className="flex items-baseline gap-4 mb-8">
              <span className="font-monument text-5xl md:text-7xl text-[#1B1716]">
                {dayCount.toLocaleString()}
              </span>
              <span className="font-code text-xs tracking-widest text-[#1B1716]/50 uppercase">
                days building
              </span>
            </div>
            <CurrentlyBuilding />
          </motion.div>
        </div>
      </div>

      {/* Year blocks from experience.json */}
      {experience.map((entry, i) => (
        <YearBlock
          key={entry.year}
          year={entry.year}
          label={entry.label}
          sizeClass={styles[`year${i + 1}`]}
        >
          <p className="font-body text-base md:text-lg leading-relaxed text-[#1B1716]/65 mb-6">
            {entry.description}
          </p>
          <p className="font-body text-base md:text-lg leading-relaxed text-[#1B1716]/40">
            {entry.detail}
          </p>
        </YearBlock>
      ))}

      <motion.div
        className="absolute bottom-0 left-0 h-[1px] bg-[#810100]"
        style={{ width: rawLineWidth }}
      />
    </section>
  );
}

function YearBlock({ year, label, sizeClass, children }) {
  return (
    <div className="py-20 md:py-28 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-12 md:gap-20">
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className={`font-monument text-[#1B1716] block leading-none ${sizeClass}`}>
            {year}
          </span>
          <div className="mt-4 font-code text-xs tracking-widest text-[#1B1716]/45 uppercase">
            {label}
          </div>
        </motion.div>

        <motion.div
          className="flex-1 max-w-xl"
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
