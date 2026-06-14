import React from 'react';
import useStore from '@store/useStore';
import styles from './Nav.module.css';

export default function Nav() {
  const { mode } = useStore();
  const isSystem = mode === 'system';

  return (
    <nav
      className={styles.nav}
      style={{
        background: isSystem ? 'transparent' : 'rgba(255,255,255,0.05)',
        backdropFilter: isSystem ? 'none' : 'blur(10px)',
      }}
    >
      <div className={`text-xs tracking-widest uppercase ${isSystem ? 'font-code text-white' : 'font-human'}`}>
        {isSystem ? 'A.NANDA' : 'Akhilesh'}
      </div>
    </nav>
  );
}
