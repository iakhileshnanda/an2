import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import anime from 'animejs';
import statsData from '@content/stats.json';
import CurrentlyBuilding from '@components/CurrentlyBuilding';
import styles from './Numbers.module.css';

function buildFallbackCells(data) {
  return data.cells.map((c) => ({
    label: c.label,
    value: c.value,
    text: c.text || null,
    suffix: c.suffix || '',
    color: c.color,
    apiKey: c.apiKey,
  }));
}

function mapStatsToCards(stats, fallbackCells) {
  return fallbackCells.map((cell) => {
    const raw = stats[cell.apiKey];
    if (raw === undefined || raw === null) return cell;
    if (cell.value !== null) {
      return { ...cell, value: parseFloat(raw) || null };
    }
    return { ...cell, text: String(raw) };
  });
}

const FALLBACK_CELLS = buildFallbackCells(statsData);

function SkeletonCell() {
  return (
    <div className="relative border border-gray-800 bg-black p-6 md:p-8 animate-pulse">
      <div className="h-3 w-24 bg-gray-800 rounded mb-4" />
      <div className="h-10 w-32 bg-gray-800 rounded" />
    </div>
  );
}

function DataCell({ cell, index }) {
  const cellRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(cell.text || (cell.value !== null ? '0' : '—'));
  const hasAnimated = useRef(false);

  const { scrollYProgress } = useScroll({
    target: cellRef,
    offset: ['start end', 'center center'],
  });

  const topLineWidth = useTransform(scrollYProgress, [0, 0.8], ['0%', '100%']);

  useEffect(() => {
    if (cell.value === null) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          anime({
            targets: { val: 0 },
            val: cell.value,
            round: cell.value % 1 === 0 ? 1 : 10,
            duration: 2000,
            delay: index * 150,
            easing: 'easeOutExpo',
            update: (anim) => {
              const v = anim.animations[0].currentValue;
              setDisplayValue(
                cell.value % 1 !== 0 ? v.toFixed(1) : Math.round(v).toString()
              );
            },
          });
        }
      },
      { threshold: 0.5 }
    );
    if (cellRef.current) observer.observe(cellRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cellRef} className="relative border border-white bg-black p-6 md:p-8">
      <motion.div
        className="absolute top-0 left-0 h-[2px] bg-white"
        style={{ width: topLineWidth }}
      />
      <div className="font-code text-xs tracking-widest text-gray-500 uppercase mb-4">
        {cell.label}
      </div>
      <div className="font-monument text-4xl md:text-5xl" style={{ color: cell.color }}>
        {cell.value === null && !cell.text ? '—' : displayValue}
        {cell.suffix && cell.value !== null ? cell.suffix : ''}
      </div>
    </div>
  );
}

export default function Numbers() {
  const [cells, setCells] = useState(FALLBACK_CELLS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Stats fetch failed');
      const data = await res.json();
      setCells(mapStatsToCards(data, FALLBACK_CELLS));
      setLastUpdated(new Date());
    } catch {
      setCells(FALLBACK_CELLS);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const timeLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section className="scene-section min-h-screen bg-black flex items-center py-24">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="flex items-center justify-center mb-16 gap-4">
          <h2 className={`font-monument text-white text-center ${styles.sectionTitle}`}>
            LIVE NOW
          </h2>
          <button
            onClick={fetchStats}
            disabled={statsLoading}
            className="font-code text-xs tracking-widest text-gray-500 hover:text-white border border-gray-700 hover:border-white px-3 py-1 transition-colors uppercase disabled:opacity-40"
          >
            {statsLoading ? '...' : 'REFRESH'}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {statsLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCell key={i} />)
            : cells.map((cell, i) => <DataCell key={cell.label} cell={cell} index={i} />)
          }
        </div>

        {!statsLoading && timeLabel && (
          <p className="font-code text-xs text-gray-700 text-center mt-8 tracking-widest uppercase">
            Last updated {timeLabel}
          </p>
        )}

        <div className="mt-12 flex justify-center">
          <CurrentlyBuilding />
        </div>
      </div>
    </section>
  );
}
