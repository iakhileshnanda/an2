import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import useStore from '@store/useStore';
import Nav from '@components/nav/Nav';
import FilmGrain from '@components/FilmGrain';
import WorldTransition from '@components/transition/WorldTransition';
import GestureZones from '@components/gesture/GestureZones';

const HomePage = lazy(() => import('@pages/Home'));
const HumanPage = lazy(() => import('@pages/Human'));

function App() {
  const location = useLocation();
  const { mode, isTransitioning, setMode } = useStore();

  // Sync store mode with current route
  useEffect(() => {
    setMode(location.pathname === '/human' ? 'human' : 'system');
  }, [location.pathname, setMode]);

  // Easter egg: "system.human" typed anywhere — directly triggers transition, no password
  useEffect(() => {
    let buffer = '';
    const handleKeyDown = (e) => {
      if (isTransitioning) return;
      buffer += e.key.toLowerCase();
      if (buffer.length > 20) buffer = buffer.slice(-20);
      if (buffer.includes('system.human')) {
        buffer = '';
        useStore.getState().setTransitioning(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTransitioning]);

  return (
    <div className="relative min-h-screen">
      <Nav />
      {mode === 'system' && <FilmGrain />}

      {isTransitioning && <WorldTransition />}

      <Suspense fallback={
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="w-8 h-8 border border-white animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/human" element={<HumanPage />} />
        </Routes>
      </Suspense>

      <GestureZones />
    </div>
  );
}

export default App;
