import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react()
    ],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'dev',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'chart-vendor': ['recharts']
          }
        }
      }
    },
    server: {
      port: 5173,
      strictPort: false,
      host: true
    }
  }
})
