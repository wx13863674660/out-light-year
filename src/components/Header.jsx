// 顶部导航栏：应用名 + 恋爱天数 + 每日问候 + 背景音乐开关（P2，可配置）
import { useEffect, useRef, useState } from 'react'
import { appConfig } from '../config/appConfig'
import { getSettings } from '../services/settingsService'
import { getLoveDays, getGreeting, getTodayText } from '../utils/dates'
import { MusicIcon } from './icons'

export default function Header() {
  const [days, setDays] = useState(1)
  const greeting = getGreeting()
  const [musicOn, setMusicOn] = useState(false)
  const audioRef = useRef(null)

  // 进入主空间时读取"在一起的日子"，自动计算恋爱天数（P0 恋爱计时器）
  useEffect(() => {
    getSettings().then((s) => setDays(getLoveDays(s.startDate)))
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
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-love-deep truncate">我们的光年</h1>
            <p className="mt-0.5 text-xs text-slate-400">{getTodayText()}</p>
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
            {/* 恋爱计时器：在一起的第 N 天 */}
            <div className="px-4 h-11 flex items-center rounded-full bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft">
              在一起的第 {days} 天
            </div>
          </div>
        </div>
        {/* 每日问候：早安 / 午安 / 晚安 */}
        <p className="mt-2 text-sm text-love-deep/90">
          {greeting.text}呀，{greeting.hint}
        </p>
      </div>
      {appConfig.musicUrl && (
        <audio ref={audioRef} src={appConfig.musicUrl} loop preload="none" />
      )}
    </header>
  )
}
