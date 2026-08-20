// 顶部导航栏：空间头像 + 应用名 + 相识天数 + 每日问候 + 纪念日倒计时 + 背景音乐开关（P2，可配置）
import { useEffect, useRef, useState } from 'react'
import { appConfig } from '../config/appConfig'
import { getSettings } from '../services/settingsService'
import { getMeetDays, getGreeting, getTodayText, getDaysUntil } from '../utils/dates'
import { MusicIcon, HeartIcon, CalendarIcon } from './icons'

export default function Header() {
  const [days, setDays] = useState(1)
  const [avatar, setAvatar] = useState('') // 空间头像（情侣头像/合影）
  const [nextAnniv, setNextAnniv] = useState(null) // 最近一个未过去的纪念日（含今天）
  const greeting = getGreeting()
  const [musicOn, setMusicOn] = useState(false)
  const audioRef = useRef(null)

  // 进入主空间时读取设置：相识天数 + 空间头像 + 纪念日倒计时（P0 相识计时器 / PRD 2.6）
  useEffect(() => {
    getSettings().then((s) => {
      setDays(getMeetDays(s.startDate))
      setAvatar(s.avatar || '')
      // 找到最近一个未过去的纪念日，展示倒计时（已过去的纪念日不参与倒计时）
      const upcoming = (s.anniversaryDates || [])
        .map((a) => ({ ...a, days: getDaysUntil(a.date) }))
        .filter((a) => a.days >= 0)
        .sort((a, b) => a.days - b.days)[0]
      setNextAnniv(upcoming || null)
    })
  }, [])

  /** 背景音乐开关：播放/暂停（P2） */
  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (musicOn) {
      audio.pause()
    } else {
      // 浏览器可能拦截自动播放，静默失败即可
      audio.play().catch(() => {})
    }
    setMusicOn((v) => !v)
  }

  return (
    <header className="sticky top-0 z-30 bg-love-bg/90 backdrop-blur border-b border-love/10">
      <div className="max-w-lg mx-auto px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* 空间头像（设置了情侣头像/合影时展示） */}
            <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-love to-love-light flex items-center justify-center text-white ring-2 ring-white shadow-soft">
              {avatar ? (
                <img src={avatar} alt="空间头像" className="w-full h-full object-cover" />
              ) : (
                <HeartIcon filled className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-love-deep truncate">我们的光年</h1>
              <p className="mt-0.5 text-xs text-slate-400">{getTodayText()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* 背景音乐开关（配置了音乐地址才显示） */}
            {appConfig.musicUrl && (
              <button
                onClick={toggleMusic}
                className="w-11 h-11 rounded-full bg-white/80 shadow-card flex items-center justify-center text-love-deep active:scale-95 transition-transform"
                aria-label={musicOn ? '关闭背景音乐' : '播放背景音乐'}
              >
                <MusicIcon className="w-5 h-5" />
              </button>
            )}
            {/* 相识计时器：相识的第 N 天 */}
            <div className="px-4 h-11 flex items-center rounded-full bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft">
              相识的第 {days} 天
            </div>
          </div>
        </div>
        {/* 每日问候：早安 / 午安 / 晚安 */}
        <p className="mt-2 text-sm text-love-deep/90">
          {greeting.text}呀，{greeting.hint}
        </p>
        {/* 纪念日倒计时：最近一个未过去的纪念日 */}
        {nextAnniv && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-white/70 shadow-sm text-xs text-love-deep">
            <CalendarIcon className="w-3.5 h-3.5 text-love" />
            {nextAnniv.days === 0
              ? `今天是${nextAnniv.name} 🎉`
              : `距离${nextAnniv.name}还有 ${nextAnniv.days} 天`}
          </p>
        )}
      </div>
      {appConfig.musicUrl && (
        <audio ref={audioRef} src={appConfig.musicUrl} loop preload="none" />
      )}
    </header>
  )
}
