import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite config with Tailwind CSS v4 plugin and API proxy configuration
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
