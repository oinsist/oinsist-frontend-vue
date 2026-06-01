import { fileURLToPath, URL } from 'node:url'
import { dirname, resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(new URL('.', import.meta.url)))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    open: true,
    proxy: {
      '/dev-api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev-api/, ''),
      },
    },
  },
  build: {
    // 【P0X 打包瘦身预留】后续有业务体量后再配置 manualChunks / chunkSizeWarningLimit。
  },
})
