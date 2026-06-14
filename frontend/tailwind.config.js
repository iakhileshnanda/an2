/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        monument: ['"Space Grotesk"', 'sans-serif'],
        human: ['"Cormorant Garamond"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        system: {
          black: '#000000',
          white: '#FFFFFF',
          green: '#00FF41',
          red: '#FF3333',
        },
        chapter: {
          child: { bg: '#FFF3E0', accent: '#FF6B35', text: '#1A0A00' },
          college: { bg: '#E8F4FD', accent: '#1565C0', text: '#0A1628' },
          love: { bg: '#FCE4EC', accent: '#C2185B', text: '#1A0010' },
          places: { bg: '#E8F5E9', accent: '#2E7D32', text: '#001A00' },
          music: { bg: '#F3E5F5', accent: '#7B1FA2', text: '#1A0028' },
          beliefs: { bg: '#FFF8E1', accent: '#E65100', text: '#1A0800' },
          letter: { bg: '#FAFAFA', accent: '#5D4037', text: '#1C1008' },
        },
      },
    },
  },
  plugins: [],
}
