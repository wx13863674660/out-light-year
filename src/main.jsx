import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import './index.css'

// 应用入口：挂载根组件
// AuthProvider 管理"是否已解锁"；ToastProvider 提供全局操作反馈提示
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // 生产环境注册离线缓存（Phase 5 PWA），本地开发不启用避免干扰
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
)
