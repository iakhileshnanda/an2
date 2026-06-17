import { useEffect } from 'react'
import Echo from './character/Echo'
import { initEchoOverlay } from './echo-overlay'

export default function EchoRoot() {
  // Mount the green terminal overlay (idle text, input, response bubble).
  // It tracks the droid via getBoundingClientRect and never touches its logic.
  useEffect(() => {
    const overlay = initEchoOverlay()
    return () => overlay.destroy()
  }, [])

  return <Echo />
}
