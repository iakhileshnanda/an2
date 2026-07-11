import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Terminal from './Terminal';
import styles from './AwakeningScene.module.css';

export default function AwakeningScene() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const line1Y = useTransform(scrollYProgress, [0.10, 0.40], [60, 0]);
  const line1O = useTransform(scrollYProgress, [0.10, 0.35], [0, 1]);
  const line2Y = useTransform(scrollYProgress, [0.25, 0.50], [60, 0]);
  const line2O = useTransform(scrollYProgress, [0.25, 0.45], [0, 1]);
  const line3Y = useTransform(scrollYProgress, [0.40, 0.60], [60, 0]);
  const line3O = useTransform(scrollYProgress, [0.40, 0.55], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="scene-section min-h-screen flex items-center relative overflow-hidden"
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left: Cinematic text */}
        <div className="flex-1 space-y-4">
          <motion.h2
            className={`font-monument text-white leading-none ${styles.line1}`}
            style={{ y: line1Y, opacity: line1O }}
          >
            ONE NIGHT.
          </motion.h2>
          <motion.h2
            className={`font-monument text-white leading-none ${styles.line2}`}
            style={{ y: line2Y, opacity: line2O }}
          >
            ZERO BACKEND.
          </motion.h2>
          <motion.h2
            className={`font-monument text-white leading-none ${styles.line3}`}
            style={{ y: line3Y, opacity: line3O }}
          >
            ONE AGENT.
          </motion.h2>
        </div>

        {/* Right: Terminal */}
        <div className="flex-1 w-full max-w-lg">
          <Terminal />
        </div>
      </div>
    </section>
  );
}
