import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/live-stream': {
        target: 'http://127.0.0.1:5514',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/live-stream/, '/live')
      },
      '/api-dcc': {
        target: 'http://127.0.0.1:5513',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-dcc/, '')
      }
    }
  }
})