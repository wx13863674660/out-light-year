// 应用根组件：根据解锁状态切换"密码锁"与"主空间"两种形态
// 未解锁时只展示密码锁，解锁后进入带底部 Tab 的主空间路由
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import PasswordLock from './components/PasswordLock'
import MainLayout from './components/MainLayout'
import AlbumPage from './pages/AlbumPage'
import DiaryPage from './pages/DiaryPage'
import InteractPage from './pages/InteractPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  const { unlocked, unlock } = useAuth()

  // 未解锁：只展示密码锁页面
  if (!unlocked) {
    return <PasswordLock onUnlock={unlock} />
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/album" element={<AlbumPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/interact" element={<InteractPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* 默认进入相册页 */}
          <Route path="/" element={<Navigate to="/album" replace />} />
          <Route path="*" element={<Navigate to="/album" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
