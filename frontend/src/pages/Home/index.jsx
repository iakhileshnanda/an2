import React, { Suspense, lazy } from 'react'
import Hero from '@sections/Hero'
import Experience from '@sections/Experience'
import Projects from '@sections/Projects'
import Contact from '@sections/Contact'
import HeroMark from '@components/HeroMark'
import EchoRoot from '../../echo/EchoRoot'

const AwakeningScene = lazy(() => import('@system/scenes/AwakeningScene'))
const AskScene = lazy(() => import('@system/scenes/AskScene'))

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* HeroMark is position:fixed and owns the hero name + AN logo identity */}
      <HeroMark />

      <Suspense fallback={null}>
        {/* Hero is a transparent 100vh spacer that creates scroll room for HeroMark */}
        <Hero />
        <Experience />
        <Projects />
        {/* The dark closing act — one continuous backdrop across all three
            scenes so no seams show between them */}
        <div className="dark-act">
          <AwakeningScene />
          <AskScene />
          <Contact />
        </div>
      </Suspense>

      <EchoRoot />
    </div>
  )
}
