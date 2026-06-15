import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '@store/useStore';
import styles from './WorldTransition.module.css';

export default function WorldTransition() {
  const { mode, setTransitioning } = useStore();
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 267);
    const t2 = setTimeout(() => setPhase(2), 533);
    const t3 = setTimeout(() => {
      setPhase(3);
      navigate(mode === 'system' ? '/human' : '/');
    }, 800);
    const t4 = setTimeout(() => {
      setTransitioning(false);
    }, 1200);

    return () => {
      clearTimeout(t1); clearTimeout(t2);
      clearTimeout(t3); clearTimeout(t4);
    };
  }, []);

  const isToHuman = mode === 'system';
  const floodColor = isToHuman ? '#FFF3E0' : '#000000';

  return (
    <div className={`fixed inset-0 z-[8000] ${styles.container}`}>
      {/* Phase 0: Glitch Bars */}
      <AnimatePresence>
        {phase === 0 && (
          <>
            {[15, 35, 55, 72, 88].map((y, i) => (
              <motion.div
                key={`bar-${i}`}
                className="absolute left-0 w-full"
                style={{ top: `${y}%`, height: `${3 + Math.random() * 4}px`, background: '#FFF' }}
                initial={{ x: '-100%' }}
                animate={{ x: '100vw' }}
                transition={{ duration: 0.25, delay: i * 0.03, ease: 'easeInOut' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Phase 1: Fragmentation — 4×4 grid (16 fragments) */}
      {phase >= 1 && phase < 3 && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 16 }).map((_, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const delay = Math.random() * 0.15;
            const rotation = (Math.random() - 0.5) * 25;
            const xDrift = (Math.random() - 0.5) * 160;
            return (
              <motion.div
                key={`frag-${i}`}
                className={`absolute ${styles.fragment}`}
                style={{
                  left: `${col * 25}%`,
                  top: `${row * 25}%`,
                  width: '25%',
                  height: '25%',
                  background: mode === 'system' ? '#000' : floodColor,
                }}
                initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                animate={{
                  opacity: 0,
                  y: 500 + Math.random() * 300,
                  x: xDrift,
                  rotate: rotation,
                }}
                transition={{ duration: 0.5, delay, ease: 'easeIn' }}
              />
            );
          })}
        </div>
      )}

      {/* Phase 2: Color Flood */}
      {phase >= 2 && (
        <motion.div
          className="absolute inset-0"
          style={{ background: floodColor }}
          initial={{ clipPath: 'circle(0% at 50% 50%)' }}
          animate={{ clipPath: 'circle(150% at 50% 50%)' }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      )}

      {/* Phase 3: Fade out */}
      {phase >= 3 && (
        <motion.div
          className="absolute inset-0"
          style={{ background: floodColor }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}
