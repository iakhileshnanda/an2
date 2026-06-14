import React, { useState, useRef, useEffect } from 'react';
import anime from 'animejs';
import useStore from '@store/useStore';
import styles from './PasswordGate.module.css';

export default function PasswordGate() {
  const { setShowPasswordGate, setAuthenticated, setTransitioning } = useStore();
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const password = import.meta.env.VITE_HUMAN_PASSWORD || 'akhilesh';

    if (value === password) {
      setAuthenticated(true);
      setShowPasswordGate(false);
      setTransitioning(true);
    } else {
      setError(true);
      // Shake animation
      anime({
        targets: containerRef.current,
        translateX: [0, -10, 10, -10, 10, -5, 5, 0],
        duration: 500,
        easing: 'easeInOutQuad',
      });
      setTimeout(() => {
        setError(false);
        setValue('');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[9500] bg-black flex items-center justify-center">
      <form ref={containerRef} onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
        <input
          ref={inputRef}
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="· · · · · ·"
          className={`bg-transparent border-b border-white text-white text-2xl md:text-4xl font-code text-center py-4 px-8 outline-none w-72 md:w-96 tracking-widest placeholder:text-gray-600 ${styles.input}`}
        />
        {error && (
          <span className={`text-sm font-code tracking-widest ${styles.errorText}`}>
            ACCESS DENIED
          </span>
        )}
        <span className="text-xs text-gray-700 font-code tracking-wider">
          PRESS ENTER
        </span>
      </form>
    </div>
  );
}
