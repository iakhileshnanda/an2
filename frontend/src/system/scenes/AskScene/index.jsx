import React from 'react';
import { motion } from 'framer-motion';
import styles from './AskScene.module.css';

export default function AskScene() {
  return (
    <section className="scene-section min-h-screen flex items-center justify-center relative">
      <div className="max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        <motion.h2
          className={`font-monument text-white leading-tight mb-8 ${styles.title}`}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          LET'S BUILD
          <br />
          SOMETHING THAT
          <br />
          MATTERS.
        </motion.h2>

        <motion.p
          className="font-human-italic text-gray-500 text-xl md:text-2xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          「大切なものを、一緒に作ろう」
        </motion.p>
      </div>

      {/* Easter egg hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <p className={`font-code text-gray-800 ${styles.easterEggHint}`}>
          type system.human to unlock the other side
        </p>
      </div>
    </section>
  );
}
