import { create } from 'zustand'
import { createFSM, transition } from '../core/EchoFSM'
import type { FSMContext, FSMEvent } from '../core/EchoFSM'

interface EchoStore {
  fsm: FSMContext
  activeSection: string | null
  focusedTimeline: string | null
  hint: string | null
  dispatch: (event: FSMEvent) => void
  setActiveSection: (section: string | null) => void
  setFocusedTimeline: (entry: string | null) => void
  setHint: (hint: string | null) => void
  clearHint: () => void
}

export const useEchoStore = create<EchoStore>((set) => ({
  fsm: createFSM(),
  activeSection: null,
  focusedTimeline: null,
  hint: null,
  dispatch: (event) => set((state) => ({ fsm: transition(state.fsm, event) })),
  setActiveSection: (activeSection) => set({ activeSection }),
  setFocusedTimeline: (focusedTimeline) => set({ focusedTimeline }),
  setHint: (hint) => set({ hint }),
  clearHint: () => set({ hint: null }),
}))
