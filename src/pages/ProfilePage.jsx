// 个人中心 / 设置（模块六）
// - 展示空间标识（情侣头像/合影，可更换）+ 当前登录身份（他/她），可一键切换身份或退出登录
// - 设置项：修改密码 / 纪念日管理 / 更换头像（PRD 2.6，全部已实现）
import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { getSettings } from '../services/settingsService'
import { getPhotos } from '../services/photoService'
import { getDiaries } from '../services/diaryService'
import { getAllComments } from '../services/commentService'
import ChangePasswordModal from '../components/ChangePasswordModal'
import AnniversaryModal from '../components/AnniversaryModal'
import AvatarModal from '../components/AvatarModal'
import {
  HeartIcon,
  LockIcon,
  BoyIcon,
  GirlIcon,
  CalendarIcon,
  ImageIcon,
  ChevronRightIcon,
} from '../components/icons'

// 身份视觉配置
const AUTHORS = {
  他: { emoji: '💙', icon: BoyIcon, label: '男生视角', desc: '当前以「他」的身份浏览，日记 / 相册 / 清单 / 胶囊双方共享可见，你写下的内容会标注「他」', bg: 'from-blue-500 to-blue-300' },
  她: { emoji: '💗', icon: GirlIcon, label: '女生视角', desc: '当前以「她」的身份浏览，日记 / 相册 / 清单 / 胶囊双方共享可见，你写下的内容会标注「她」', bg: 'from-love to-love-light' },
}

// 设置项列表（PRD 2.6：修改密码 / 纪念日管理 / 更换头像）
const menuItems = [
  { key: 'password', name: '修改密码', desc: '更换进入空间的暗号', Icon: LockIcon },
  { key: 'anniversary', name: '纪念日管理', desc: '添加重要的日子，首页倒计时展示', Icon: CalendarIcon },
  { key: 'avatar', name: '更换头像', desc: '上传情侣头像或合影', Icon: ImageIcon },
]

export default function ProfilePage() {
  const toast = useToast()
  const { identity, switchIdentity, logout } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [activeModal, setActiveModal] = useState(null) // null | 'password' | 'anniversary' | 'avatar'
  const [avatar, setAvatar] = useState('') // 空间头像（情侣头像/合影）
  const [stats, setStats] = useState({ photos: 0, diaries: 0, comments: 0 }) // 空间内容统计
  const cfg = AUTHORS[identity] || AUTHORS.他
  const otherKey = identity === '他' ? '她' : '他'
  const otherCfg = AUTHORS[otherKey]

  // 进入页面时读取空间头像与内容统计（照片 / 日记 / 评论，双方共享合计）
  useEffect(() => {
    getSettings().then((s) => setAvatar(s.avatar || ''))
    Promise.all([getPhotos(), getDiaries(), getAllComments()]).then(([photos, diaries, comments]) => {
      setStats({ photos: photos.length, diaries: diaries.length, comments: comments.length })
    })
  }, [])

  /** 切换身份：更新持久化身份，各页面按新身份重新加载数据 */
  const handleSwitch = () => {
    switchIdentity(otherKey)
    toast(`已切换到${otherCfg.label}，内容已按新身份刷新`, 'success')
  }

  /** 退出登录：二次确认后清除解锁状态，回到密码锁 */
  const handleLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true)
      setTimeout(() => setConfirmLogout(false), 2500)
      return
    }
    logout()
  }

  return (
    <section>
      {/* 空间标识：情侣头像/合影 + 昵称 */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-love to-love-light flex items-center justify-center text-white shadow-soft ring-2 ring-white">
          {avatar ? (
            <img src={avatar} alt="空间头像" className="w-full h-full object-cover" />
          ) : (
            <HeartIcon filled className="w-8 h-8" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-love-deep">我们的光年</h2>
          <p className="mt-0.5 text-xs text-slate-400">这里记录着我们所有的故事</p>
        </div>
      </div>

      {/* 当前身份卡片 */}
      <div className="mt-5 rounded-3xl bg-white shadow-card p-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.bg} flex items-center justify-center text-white shadow-soft shrink-0`}
          >
            <cfg.icon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-love-deep">{cfg.emoji} 当前身份：{cfg.label}</p>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{cfg.desc}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {/* 切换身份 */}
          <button
            onClick={handleSwitch}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-95 transition-transform"
          >
            {otherCfg.emoji} 切换为{otherCfg.label}
          </button>
          {/* 退出登录（二次确认） */}
          <button
            onClick={handleLogout}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-colors ${
              confirmLogout ? 'bg-love-deep text-white' : 'bg-love-bg text-love-deep'
            }`}
          >
            {confirmLogout ? '确认退出' : '退出登录'}
          </button>
        </div>
      </div>

      {/* 数据统计：照片 / 日记 / 评论（双方共享内容合计） */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { num: stats.photos, label: '照片' },
          { num: stats.diaries, label: '日记' },
          { num: stats.comments, label: '评论' },
        ].map((s) => (
          <div key={s.label} className="py-4 rounded-2xl bg-white shadow-card text-center">
            <p className="text-xl font-bold text-love-deep">{s.num}</p>
            <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 设置项列表：点击打开对应弹窗 */}
      <div className="mt-5 bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-love/10">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveModal(item.key)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-love-bg/50 transition-colors"
          >
            <item.Icon className="w-5 h-5 text-love-light shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">{item.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
            </div>
            <ChevronRightIcon className="ml-auto w-4 h-4 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-300">「我们的光年」· 一个只属于两个人的小窝</p>

      {/* 设置弹窗 */}
      <AnimatePresence>
        {activeModal === 'password' && (
          <ChangePasswordModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'anniversary' && (
          <AnniversaryModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'avatar' && (
          <AvatarModal onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}
