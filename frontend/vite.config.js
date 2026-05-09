import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: false,
    allowedHosts: ['geophilous-allogenically-augustina.ngrok-free.dev'],
    proxy: {
      // Local dev: forward /api/* to the local serverless function runner on port 3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
