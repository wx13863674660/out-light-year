import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 构建配置：React 插件 + 移动端调试方便（局域网可访问）
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允许局域网访问，方便手机真机预览
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
})
