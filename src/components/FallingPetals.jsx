// 浪漫动画层（互动模块 P2）：
// - 思念花瓣雨：收到"想你了"时播放的玫瑰花瓣雨 + 爱心升起
// - 爱心雨：进入互动页 / 手动触发时全屏飘落的爱心
// 纯装饰层：fixed 全屏、pointer-events-none，不拦截任何点击；播完自动回调卸载
import { useEffect, useMemo, useRef } from 'react'

/** 玫瑰花瓣 SVG（泪滴形） */
function PetalShape({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} aria-hidden="true">
      <path d="M12 2.5C16.5 7.5 18 13 12 21.5 6 13 7.5 7.5 12 2.5Z" fill="currentColor" />
    </svg>
  )
}

/** 实心心形 SVG */
function HeartShape({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} aria-hidden="true">
      <path
        d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
        fill="currentColor"
      />
    </svg>
  )
}

// 玫瑰色系（花瓣模式），深浅交替更有层次
const PETAL_COLORS = ['#FF6B81', '#F5A0B0', '#E75480', '#FF8FA3', '#FFC0CB', '#FB8CA3']
// 爱心雨色系（更饱和，浅粉背景上更醒目）
const HEART_COLORS = ['#FF6B81', '#E75480', '#FF8FA3', '#D6336C', '#F06292', '#FB8CA3']

// 两种模式的参数配置（形状 / 数量 / 尺寸范围 / 颜色 / 下落时长范围）
const PIECE_TYPES = {
  petal: {
    count: 20,
    size: [12, 26],
    colors: PETAL_COLORS,
    fallDur: [3.4, 5.4],
    Shape: PetalShape,
  },
  heart: {
    count: 26,
    size: [14, 30],
    colors: HEART_COLORS,
    fallDur: [3.6, 5.6],
    Shape: HeartShape,
  },
}

/**
 * 全屏飘落动画（花瓣雨 / 爱心雨），播完自动结束
 * @param {'petal'|'heart'} type 飘落物类型：petal=玫瑰花瓣（思念横幅增强），heart=爱心雨
 * @param {() => void} onFinished 动画播放结束后回调（父组件卸载本层）
 */
export default function FallingPetals({ type = 'petal', onFinished }) {
  const cfg = PIECE_TYPES[type] || PIECE_TYPES.petal
  const Shape = cfg.Shape

  // 飘落物：随机横向位置 / 大小 / 颜色 / 下落时长 / 摇摆幅度
  const pieces = useMemo(
    () =>
      Array.from({ length: cfg.count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
        color: cfg.colors[i % cfg.colors.length],
        fallDur: cfg.fallDur[0] + Math.random() * (cfg.fallDur[1] - cfg.fallDur[0]),
        fallDelay: Math.random() * 1.4,
        swayDur: 1.4 + Math.random() * 1.6,
        swayX: 16 + Math.random() * 22,
        spin: Math.random() * 540 - 270,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type]
  )
  // 爱心从底部缓缓升起（仅花瓣雨模式，思念氛围）
  const hearts = useMemo(
    () =>
      type === 'heart'
        ? []
        : Array.from({ length: 8 }, (_, i) => ({
            id: i,
            left: 12 + Math.random() * 76,
            delay: 0.2 + Math.random() * 1.2,
            rise: 55 + Math.random() * 30,
            size: 16 + Math.random() * 14,
            color: i % 2 === 0 ? '#FF6B81' : '#F5A0B0',
          })),
    [type]
  )

  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished
  // 等所有飘落物落地后自动结束（最长约 5.6s）
  useEffect(() => {
    const t = setTimeout(() => onFinishedRef.current(), 5600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* 飘落物（花瓣 / 爱心） */}
      {pieces.map((p) => (
        <span
          key={`p${p.id}`}
          className="petal"
          style={{
            left: `${p.left}%`,
            color: p.color,
            fontSize: p.size,
            '--fall-dur': `${p.fallDur}s`,
            '--fall-delay': `${p.fallDelay}s`,
            '--sway-dur': `${p.swayDur}s`,
            '--sway-x': `${p.swayX}px`,
            '--spin': `${p.spin}deg`,
          }}
        >
          <Shape />
        </span>
      ))}
      {/* 爱心缓缓升起（仅花瓣雨模式） */}
      {hearts.map((h) => (
        <span
          key={`h${h.id}`}
          className="rise-heart"
          style={{
            left: `${h.left}%`,
            color: h.color,
            fontSize: h.size,
            '--rise-delay': `${h.delay}s`,
            '--rise': `${h.rise}vh`,
          }}
        >
          <HeartShape />
        </span>
      ))}
    </div>
  )
}

/**
 * 发送"想你了"成功后，从按钮处迸发的小爱心（短促、轻量）
 * @param {() => void} onFinished 动画结束后回调（父组件卸载）
 */
export function HeartBurst({ onFinished }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        dx: (Math.random() - 0.5) * 140,
        dy: -20 - Math.random() * 70,
        delay: Math.random() * 0.15,
        size: 14 + Math.random() * 12,
        color: i % 2 === 0 ? '#FF6B81' : '#F5A0B0',
        rot: (Math.random() - 0.5) * 60,
      })),
    []
  )

  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished
  useEffect(() => {
    const t = setTimeout(() => onFinishedRef.current(), 1300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="burst-heart"
          style={{
            left: '50%',
            top: '50%',
            color: h.color,
            fontSize: h.size,
            '--dx': `${h.dx}px`,
            '--dy': `${h.dy}px`,
            '--burst-delay': `${h.delay}s`,
            '--burst-rot': `${h.rot}deg`,
          }}
        >
          <HeartShape />
        </span>
      ))}
    </div>
  )
}
