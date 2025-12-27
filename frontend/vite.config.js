import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  appType: 'spa',
  server: {
    host: '::',
    port: 5173,
    strictPort: true
  }
})
