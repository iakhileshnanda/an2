import React, { useState, useEffect } from 'react';
import styles from './GestureZones.module.css';

const EMAIL = 'theakhileshnanda@gmail.com';
const GITHUB = 'https://github.com/iakhileshnanda';

export default function GestureZones() {
  const [hovered, setHovered] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window);
  }, []);

  const handleLeft = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      // clipboard blocked — open mailto as fallback
      window.open(`mailto:${EMAIL}`, '_blank');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRight = () => {
    window.open(GITHUB, '_blank', 'noopener,noreferrer');
  };

  const getOpacity = (zone) => {
    if (isTouch) return hovered === zone ? 0.7 : 0.15;
    return hovered === zone ? 1 : 0;
  };

  return (
    <>
      {/* LEFT BAR — copy email to clipboard */}
      <div
        onMouseEnter={() => setHovered('left')}
        onMouseLeave={() => setHovered(null)}
        onClick={handleLeft}
        onTouchEnd={(e) => { e.preventDefault(); handleLeft(); }}
        className={`${styles.zone} ${styles.left} ${styles.zoneSystem}`}
        style={{ opacity: getOpacity('left'), zIndex: 9500 }}
        title={EMAIL}
      >
        <span className={`${styles.barText} ${styles.icon}`}>
          {copied ? '✓' : '✉'}
        </span>
        <span className={`${styles.barText} ${styles.vertical}`}>
          {copied ? 'COPIED!' : 'HIRE·ME'}
        </span>
      </div>

      {/* RIGHT BAR — open GitHub */}
      <div
        onMouseEnter={() => setHovered('right')}
        onMouseLeave={() => setHovered(null)}
        onClick={handleRight}
        onTouchEnd={(e) => { e.preventDefault(); handleRight(); }}
        className={`${styles.zone} ${styles.right} ${styles.zoneSystem}`}
        style={{ opacity: getOpacity('right'), zIndex: 9500 }}
        title="GitHub profile"
      >
        <span className={`${styles.barText} ${styles.icon}`}>↗</span>
        <span className={`${styles.barText} ${styles.vertical}`}>GITHUB</span>
      </div>
    </>
  );
}
