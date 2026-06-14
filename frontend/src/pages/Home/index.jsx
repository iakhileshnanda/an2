import React, { Suspense, lazy } from 'react';
import Hero from '@sections/Hero';
import Experience from '@sections/Experience';
import Projects from '@sections/Projects';
import Numbers from '@sections/Numbers';

const AwakeningScene = lazy(() => import('@system/scenes/AwakeningScene'));
const AskScene = lazy(() => import('@system/scenes/AskScene'));

export default function HomePage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Suspense fallback={null}>
        <Hero />
        <Experience />
        <Projects />
        <AwakeningScene />
        <Numbers />
        <AskScene />
      </Suspense>
    </div>
  );
}
