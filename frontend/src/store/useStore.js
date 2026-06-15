import { create } from 'zustand';

const useStore = create((set) => ({
  // Mode: 'system' or 'human' — synced from route in App.jsx
  mode: 'system',
  setMode: (mode) => set({ mode }),

  // Transition animation
  isTransitioning: false,
  setTransitioning: (isTransitioning) => set({ isTransitioning }),

  // Current chapter (for human mode cursor color)
  currentChapter: 0,
  setCurrentChapter: (ch) => set({ currentChapter: ch }),
}));

export default useStore;
