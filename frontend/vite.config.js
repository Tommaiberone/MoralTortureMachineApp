import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

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
