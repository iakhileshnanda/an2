import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './Hero.module.css';

export default function Hero() {
  const heroRef = useRef(null);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    setViewportHeight(window.innerHeight);
  }, []);

  const { scrollY } = useScroll();

  const scale = useTransform(
    scrollY,
    [0, viewportHeight * 0.6],
    [1, 12]
  );

  const opacity = useTransform(
    scrollY,
    [0, viewportHeight * 0.4, viewportHeight * 0.6],
    [1, 0.8, 0]
  );

  return (
    <section ref={heroRef} className={styles.hero}>
      <motion.div
        style={{
          scale,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <motion.div
          className={styles.heroName}
          initial={{ scale: 8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.first}>Akhiles<span className={styles.mirrorLetter}>H</span></span>
          <span className={styles.last}>Nand<span className={styles.mirrorLetter}>A</span></span>
          <span className={styles.tagline}>Frontend Lead · AI Builder · Bangalore</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
