// 底部 Tab 导航（P0）：相册 / 日记 / 互动 / 我的
// - NavLink 自动高亮当前 Tab；底部预留 iOS 安全区（safe-area-inset-bottom）
// - 未读评论红点（P2 评论通知）：相册 / 日记 Tab 显示"对方"发来的新评论数
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getUnreadCount, markCommentsRead, onCommentsChange } from '../services/commentService'
import { useAuth } from '../contexts/AuthContext'
import { AlbumIcon, DiaryIcon, InteractIcon, ProfileIcon } from './icons'

const tabs = [
  { to: '/album', label: '相册', icon: AlbumIcon, type: 'photo' },
  { to: '/diary', label: '日记', icon: DiaryIcon, type: 'diary' },
  { to: '/interact', label: '互动', icon: InteractIcon },
  { to: '/profile', label: '我的', icon: ProfileIcon },
]

export default function BottomNav() {
  const location = useLocation()
  // 当前登录身份：红点只统计"对方"发来的新评论
  const { identity: loginIdentity } = useAuth()
  const identity = loginIdentity || '他'
  const [unread, setUnread] = useState({ diary: 0, photo: 0 })

  /** 拉取最新未读数（按当前身份反向统计） */
  const refresh = () => getUnreadCount(identity).then(setUnread)

  // 挂载时 + 评论数据变化（新增/已读）时刷新
  useEffect(() => {
    refresh()
    const off = onCommentsChange(refresh)
    return off
  }, [identity])

  // 路由切换时刷新（进入新页面可能已标记已读）
  useEffect(() => {
    refresh()
  }, [location.pathname])

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 pb-[env(safe-area-inset-bottom)] bg-white/90 backdrop-blur border-t border-love/10">
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, type }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => type && markCommentsRead(type)} // 进入相册/日记页即视为已读
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                isActive ? 'text-love-deep font-semibold' : 'text-slate-400'
              }`
            }
          >
            <span className="relative">
              <Icon className="w-6 h-6" />
              {/* 未读评论红点（数量超出 99 时显示 99+） */}
              {type && unread[type] > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-love text-white text-[10px] leading-4 text-center tabular-nums shadow-soft">
                  {unread[type] > 99 ? '99+' : unread[type]}
                </span>
              )}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
