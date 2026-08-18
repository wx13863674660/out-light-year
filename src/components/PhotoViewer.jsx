// 全屏图片预览（P0）：支持左右滑动切换、查看/编辑描述、删除照片
// 交互：拖动图片左右切换；顶部有关闭 / 序号 / 编辑 / 删除
// 编辑面板：可修改标题、描述、分类；删除需二次点击确认
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '../utils/dates'
import { XIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, CommentIcon } from './icons'
import CommentSection from './CommentSection'

// 图片切换动画：根据滑动方向决定进出方向
const variants = {
  enter: (dir) => ({ x: dir * 90, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir * -90, opacity: 0 }),
}

// 分类选项（与相册页一致）
const CATEGORIES = [
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'daily', label: '日常', emoji: '🌷' },
  { value: 'festival', label: '节日', emoji: '🎉' },
  { value: 'other', label: '其他', emoji: '✨' },
]

export default function PhotoViewer({ photos, index, onClose, onIndexChange, onDelete, onUpdate }) {
  const [current, setCurrent] = useState(index)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false) // 编辑面板是否打开
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('other')
  const [saving, setSaving] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false) // 评论面板是否打开
  const directionRef = useRef(0) // 记录切换方向：1 下一张，-1 上一张

  // 外部索引变化（如删除后父组件调整）时同步内部状态
  useEffect(() => setCurrent(index), [index])

  const photo = photos[current]
  if (!photo) return null

  /** 切换到指定索引，并同步给父组件 */
  const goTo = (next) => {
    setConfirmDelete(false)
    setEditing(false) // 切换照片时关闭编辑面板
    setCommentOpen(false) // 同时关闭评论面板
    setCurrent(next)
    onIndexChange?.(next)
  }

  const next = () => {
    directionRef.current = 1
    goTo((current + 1) % photos.length)
  }

  const prev = () => {
    directionRef.current = -1
    goTo((current + photos.length - 1) % photos.length)
  }

  /** 处理拖动手势：横向偏移超过阈值则切换 */
  const handleDragEnd = (_, info) => {
    if (info.offset.x < -70) next()
    else if (info.offset.x > 70) prev()
  }

  /** 删除：第一次点击进入确认态，第二次执行 */
  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      // 2s 后自动取消确认态，避免误触
      setTimeout(() => setConfirmDelete(false), 2000)
      return
    }
    onDelete(photo.id)
  }

  /** 打开编辑面板：用当前照片的信息初始化表单 */
  const openEdit = () => {
    setTitle(photo.title || '')
    setDesc(photo.description || '')
    setCategory(photo.category || 'other')
    setEditing(true)
  }

  /** 保存修改后的照片信息 */
  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(photo.id, {
        title: title.trim(),
        description: desc.trim(),
        category,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const catLabel = { travel: '旅行', daily: '日常', festival: '节日', other: '其他' }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/95"
      role="dialog"
      aria-label="图片预览"
    >
      {/* 顶部操作栏 */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center active:scale-95 transition-transform"
          aria-label="关闭预览"
        >
          <XIcon className="w-5 h-5" />
        </button>
        <span className="text-sm text-white/80 tabular-nums">
          {current + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          {/* 评论（PRD 2.4 照片评论，P1） */}
          <button
            onClick={() => setCommentOpen(true)}
            className="h-11 px-4 rounded-full bg-white/10 backdrop-blur text-sm text-white/90 flex items-center gap-1.5 active:scale-95 transition-transform"
            aria-label="查看评论"
          >
            <CommentIcon className="w-4 h-4" />
            评论
          </button>
          {/* 编辑照片信息（标题 / 描述 / 分类） */}
          <button
            onClick={openEdit}
            className="h-11 px-4 rounded-full bg-white/10 backdrop-blur text-sm text-white/90 flex items-center active:scale-95 transition-transform"
            aria-label="编辑照片信息"
          >
            编辑
          </button>
          <button
            onClick={handleDelete}
            className={`h-11 px-4 rounded-full backdrop-blur flex items-center gap-1.5 text-sm transition-colors ${
              confirmDelete ? 'bg-love-deep text-white' : 'bg-white/10 text-white/90'
            }`}
            aria-label="删除照片"
          >
            <TrashIcon className="w-4 h-4" />
            {confirmDelete ? '确认删除' : '删除'}
          </button>
        </div>
      </div>

      {/* 图片区：可拖动切换（编辑面板打开时禁用拖动，避免误切换） */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence custom={directionRef.current} mode="popLayout">
          <motion.img
            key={photo.id}
            src={photo.imageUrl}
            alt={photo.title || '照片'}
            custom={directionRef.current}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            drag={editing || commentOpen ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={handleDragEnd}
            className="max-w-full max-h-[72vh] object-contain select-none cursor-grab active:cursor-grabbing"
            draggable={false}
          />
        </AnimatePresence>
      </div>

      {/* 左右切换按钮（桌面 / 大屏便利） */}
      {photos.length > 1 && !editing && !commentOpen && (
        <>
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 backdrop-blur items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="上一张"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 backdrop-blur items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="下一张"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 底部信息：分类 / 日期 / 标题 / 描述（编辑/评论面板打开时隐藏，避免重叠） */}
      {!editing && !commentOpen && (
        <div className="absolute bottom-0 inset-x-0 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] px-6 text-center">
          <div className="inline-flex items-center gap-2">
            {photo.category && (
              <span className="px-3 py-1 rounded-full bg-love-deep/20 text-love text-xs">
                {catLabel[photo.category] || '其他'}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs">
              {formatDate(photo.createdAt)}
            </span>
          </div>
          {(photo.title || photo.description) && (
            <div className="mt-3">
              {photo.title && <p className="text-white font-semibold text-base">{photo.title}</p>}
              {photo.description && (
                <p className="mt-1 text-white/75 text-sm leading-relaxed">{photo.description}</p>
              )}
            </div>
          )}
          {!photo.title && !photo.description && (
            <p className="mt-3 text-white/40 text-xs">这张照片还没有记录故事…</p>
          )}
        </div>
      )}

      {/* 编辑面板：修改标题 / 描述 / 分类 */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute bottom-0 inset-x-0 z-30 bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-love-deep">编辑照片信息</h3>
              {!saving && (
                <button
                  onClick={() => setEditing(false)}
                  className="w-11 h-11 -mr-2 flex items-center justify-center text-slate-400"
                  aria-label="取消编辑"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="mt-2 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="照片标题（选填）"
                maxLength={30}
                className="w-full h-11 px-4 rounded-xl bg-love-bg outline-none text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-love/40"
              />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="写下这一刻的心情…（选填）"
                maxLength={120}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-love-bg outline-none text-sm placeholder:text-slate-300 resize-none focus:ring-2 focus:ring-love/40"
              />
              {/* 分类选择 */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`shrink-0 h-9 px-3 rounded-full text-xs transition-colors ${
                      category === c.value ? 'bg-love-deep text-white' : 'bg-love-bg text-slate-500'
                    }`}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="flex-1 h-12 rounded-2xl bg-love-bg text-love-deep text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-95 transition-transform disabled:opacity-50"
              >
                {saving ? '保存中…' : '保存修改'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 评论面板：底部滑出（PRD 2.4 照片评论） */}
      <AnimatePresence>
        {commentOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute bottom-0 inset-x-0 z-30 bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-h-[75vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-love-deep">照片评论</h3>
              <button
                onClick={() => setCommentOpen(false)}
                className="w-11 h-11 -mr-2 flex items-center justify-center text-slate-400"
                aria-label="关闭评论"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <CommentSection targetId={photo.id} targetType="photo" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
