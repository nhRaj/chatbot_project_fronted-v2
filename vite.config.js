import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/new-session': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/upload-statement': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ask-question': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/preview-data': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/common-questions': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/save-chat': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/start-new-chat': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/saved-chats': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/get-chat': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/providers': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
