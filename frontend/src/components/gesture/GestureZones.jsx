import React, { useState, useEffect } from 'react';
import useStore from '@store/useStore';
import styles from './GestureZones.module.css';

export default function GestureZones() {
  const { mode, isTransitioning, showPasswordGate } = useStore();
  const [hovered, setHovered] = useState(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window);
  }, []);

  const busy = isTransitioning || showPasswordGate;

  const handleLeft = () => {
    if (busy) return;
    if (mode === 'system') {
      window.location.reload();
    } else {
      useStore.getState().setTransitioning(true);
    }
  };

  const handleRight = () => {
    if (busy) return;
    if (mode === 'system') {
      useStore.getState().setShowPasswordGate(true);
    } else {
      useStore.getState().setTransitioning(true);
    }
  };

  const isSystem = mode === 'system';
  const modeClass = isSystem ? styles.zoneSystem : styles.zoneHuman;
  const leftIcon  = isSystem ? '↺' : '←';
  const leftText  = isSystem ? 'REFRESH' : 'SYSTEM';
  const rightIcon = isSystem ? '→' : '←';
  const rightText = isSystem ? 'HUMAN' : 'BACK';

  const zIndex = 9500;
  const textClass = `${styles.barText} ${!isSystem ? styles.barTextHuman : ''}`;

  const getOpacity = (zone) => {
    if (isTouch) return hovered === zone ? 0.6 : 0.2;
    return hovered === zone ? 1 : 0;
  };

  return (
    <>
      {/* LEFT BAR */}
      <div
        onMouseEnter={() => setHovered('left')}
        onMouseLeave={() => setHovered(null)}
        onClick={handleLeft}
        onTouchEnd={(e) => { e.preventDefault(); handleLeft(); }}
        className={`${styles.zone} ${styles.left} ${modeClass}`}
        style={{ opacity: getOpacity('left'), zIndex }}
      >
        <span className={`${textClass} ${styles.icon}`}>{leftIcon}</span>
        <span className={`${textClass} ${styles.vertical}`}>{leftText}</span>
      </div>

      {/* RIGHT BAR */}
      <div
        onMouseEnter={() => setHovered('right')}
        onMouseLeave={() => setHovered(null)}
        onClick={handleRight}
        onTouchEnd={(e) => { e.preventDefault(); handleRight(); }}
        className={`${styles.zone} ${styles.right} ${modeClass}`}
        style={{ opacity: getOpacity('right'), zIndex }}
      >
        <span className={`${textClass} ${styles.icon}`}>{rightIcon}</span>
        <span className={`${textClass} ${styles.vertical}`}>{rightText}</span>
      </div>
    </>
  );
}
