import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
  resolve: {
    alias: {
      '@store': path.resolve(__dirname, 'src/store'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@sections': path.resolve(__dirname, 'src/sections'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@system': path.resolve(__dirname, 'src/system'),
      '@human': path.resolve(__dirname, 'src/human'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@content': path.resolve(__dirname, '..', 'content'),
      '@echo': path.resolve(__dirname, 'src/echo'),
    },
  },
})
