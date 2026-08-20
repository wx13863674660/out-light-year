// 私密入口（P0）：密码锁页面
// 第一步：输入正确密码；第二步：选择登录身份（男生/女生），随后解锁进入主空间
import { useState } from 'react'
import { motion } from 'framer-motion'
import { getSettings } from '../services/settingsService'
import { HeartIcon, EyeIcon, BoyIcon, GirlIcon } from './icons'

/** 背景飘浮爱心装饰（纯装饰，无交互） */
function FloatingHearts() {
  // 预设爱心位置与动画参数：left/top 为位置百分比，size 为像素
  const hearts = [
    { left: '6%', top: '14%', size: 22, delay: 0, duration: 5 },
    { left: '88%', top: '10%', size: 26, delay: 0.8, duration: 6 },
    { left: '12%', top: '72%', size: 18, delay: 1.5, duration: 4.5 },
    { left: '85%', top: '68%', size: 20, delay: 0.4, duration: 5.5 },
    { left: '78%', top: '34%', size: 14, delay: 2, duration: 6.5 },
    { left: '20%', top: '38%', size: 12, delay: 1, duration: 5 },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {hearts.map((h, i) => (
        <motion.span
          key={i}
          className="absolute text-love-light/40"
          style={{ left: h.left, top: h.top, width: h.size, height: h.size }}
          animate={{ y: [0, -28, 0], rotate: [0, 14, 0], opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: h.duration, repeat: Infinity, delay: h.delay, ease: 'easeInOut' }}
        >
          <HeartIcon filled className="w-full h-full" />
        </motion.span>
      ))}
    </div>
  )
}

/** 密码锁页面：密码验证通过后选择身份，回调 onUnlock(身份) */
export default function PasswordLock({ onUnlock }) {
  const [step, setStep] = useState('password') // 'password' | 'identity'
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false) // 明/暗文切换

  /** 校验密码：读取设置中的密码，比对通过则进入身份选择 */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!value || loading) return
    setLoading(true)
    setError(false)
    try {
      const settings = await getSettings()
      if (value === settings.password) {
        setStep('identity')
        setValue('')
      } else {
        setError(true)
        // 错误提示 1.2s 后自动恢复，方便再次输入
        setTimeout(() => setError(false), 1200)
      }
    } finally {
      setLoading(false)
    }
  }

  // 第二步：选择登录身份
  if (step === 'identity') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-love-bg via-[#FFEFF2] to-love-bg flex flex-col items-center justify-center px-6">
        <FloatingHearts />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-love to-love-light shadow-soft flex items-center justify-center text-white">
            <HeartIcon filled className="w-10 h-10" />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-love-deep tracking-wide">我们的光年</h1>
          <p className="mt-2 text-sm text-love-light">暗号正确！请选择你的身份</p>
          <p className="mt-1 text-xs text-slate-400">不同身份会看到属于自己的内容视角</p>

          <div className="mt-8 w-full grid grid-cols-2 gap-4">
            {/* 男生身份 */}
            <button
              type="button"
              onClick={() => onUnlock('他')}
              className="group flex flex-col items-center gap-3 rounded-3xl bg-white/90 shadow-card border-2 border-transparent hover:border-love px-4 py-8 active:scale-95 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-300 shadow-soft flex items-center justify-center text-white">
                <BoyIcon className="w-9 h-9" />
              </div>
              <span className="text-lg font-semibold text-slate-700">我是男生</span>
              <span className="text-xs text-slate-400">进入「他」的视角</span>
            </button>

            {/* 女生身份 */}
            <button
              type="button"
              onClick={() => onUnlock('她')}
              className="group flex flex-col items-center gap-3 rounded-3xl bg-white/90 shadow-card border-2 border-transparent hover:border-love px-4 py-8 active:scale-95 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-love to-love-light shadow-soft flex items-center justify-center text-white">
                <GirlIcon className="w-9 h-9" />
              </div>
              <span className="text-lg font-semibold text-slate-700">我是女生</span>
              <span className="text-xs text-slate-400">进入「她」的视角</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep('password')}
            className="mt-6 text-sm text-slate-400 underline-offset-4 hover:text-love hover:underline transition-colors"
          >
            返回重新输入密码
          </button>
        </motion.div>
      </div>
    )
  }

  // 第一步：输入密码
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-love-bg via-[#FFEFF2] to-love-bg flex flex-col items-center justify-center px-6">
      <FloatingHearts />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center text-center"
      >
        {/* 主视觉：上下缓慢浮动的爱心徽标 */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-love to-love-light shadow-soft flex items-center justify-center text-white">
            <HeartIcon filled className="w-10 h-10" />
          </div>
        </motion.div>

        <h1 className="mt-6 text-3xl font-bold text-love-deep tracking-wide">我们的光年</h1>
        <p className="mt-2 text-sm text-love-light">一个只属于两个人的小窝</p>
        <p className="mt-1 text-xs text-slate-400">请输入我们之间的暗号</p>

        <form onSubmit={handleSubmit} className="mt-8 w-full">
          <div className={error ? 'animate-shake' : ''}>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="请输入密码"
                autoFocus
                maxLength={20}
                className="w-full h-14 px-5 pr-12 rounded-2xl bg-white/90 shadow-card border-2 border-transparent focus:border-love outline-none text-center text-lg tracking-[0.3em] placeholder:tracking-normal placeholder:text-slate-300 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 active:text-love transition-colors"
                aria-label={show ? '隐藏密码' : '显示密码'}
              >
                <EyeIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-love-deep">密码不对哦，再想想～</p>}

          <button
            type="submit"
            disabled={loading || !value}
            className="mt-5 w-full h-14 rounded-2xl bg-gradient-to-r from-love to-love-light text-white text-lg font-semibold shadow-soft active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
          >
            {loading ? '验证中…' : '进入我们的空间'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
