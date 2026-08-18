// 日记详情（P0）：全屏阅读一篇日记
// - 完整展示标题、日期、正文、配图
// - 配图点击可全屏放大查看
// - 评论区：下方可发表评论（P0，PRD 2.4）
// - 创作者可编辑 / 删除（删除需二次点击确认）
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '../utils/dates'
import CommentSection from './CommentSection'
import { XIcon, TrashIcon, BackIcon, EditIcon, ImageIcon } from './icons'

export default function DiaryDetail({ diary, onClose, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [zoomIndex, setZoomIndex] = useState(null) // 配图放大索引，null 关闭

  if (!diary) return null

  /** 删除：第一次点击进入确认态，第二次执行 */
  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      // 2s 后自动取消确认态，避免误触
      setTimeout(() => setConfirmDelete(false), 2000)
      return
    }
    onDelete(diary.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-love-bg"
      role="dialog"
      aria-label="日记详情"
    >
      {/* 顶部操作栏 */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 bg-love-bg/90 backdrop-blur">
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center text-love-deep active:scale-95 transition-transform"
          aria-label="返回列表"
        >
          <BackIcon className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-love-deep">日记</span>
        <div className="flex items-center gap-2">
          {/* 编辑（PRD 权限：仅创作者） */}
          <button
            onClick={() => onEdit(diary)}
            className="h-11 px-4 rounded-full bg-white shadow-card text-sm text-love-deep flex items-center gap-1.5 active:scale-95 transition-transform"
            aria-label="编辑日记"
          >
            <EditIcon className="w-4 h-4" />
            编辑
          </button>
          {/* 删除（二次确认） */}
          <button
            onClick={handleDelete}
            className={`h-11 px-4 rounded-full flex items-center gap-1.5 text-sm transition-colors ${
              confirmDelete ? 'bg-love-deep text-white' : 'bg-white shadow-card text-love-deep'
            }`}
            aria-label="删除日记"
          >
            <TrashIcon className="w-4 h-4" />
            {confirmDelete ? '确认删除' : '删除'}
          </button>
        </div>
      </div>

      {/* 正文区（纸感卡片） */}
      <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">
        <div className="rounded-3xl bg-white shadow-card p-6">
          {/* 日期落款 */}
          <p className="text-xs text-love-light tracking-wide">
            ✦ {formatDate(diary.createdAt)}
          </p>

          {diary.title && (
            <h1 className="mt-2 text-xl font-bold text-love-deep leading-snug">{diary.title}</h1>
          )}

          {/* 正文：保留换行 */}
          <p className="mt-4 text-[15px] text-slate-600 leading-[1.9] whitespace-pre-wrap break-words">
            {diary.content}
          </p>

          {/* 配图网格（P1）：点击放大 */}
          {diary.images && diary.images.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {diary.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setZoomIndex(i)}
                  className="aspect-square rounded-xl overflow-hidden bg-love-bg active:scale-95 transition-transform"
                  aria-label="放大配图"
                >
                  <img
                    src={img}
                    alt={`配图 ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* 落款 */}
          <p className="mt-6 text-right text-sm text-love-deep/80 italic">— 他 记录</p>
        </div>

        {/* 空配图提示 */}
        {(!diary.images || diary.images.length === 0) && (
          <p className="mt-4 text-center text-xs text-slate-300 flex items-center justify-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" />
            这篇日记没有配图
          </p>
        )}
        </div>

        {/* 评论区（P0）：日记下方发表评论 */}
        <div className="mt-4 rounded-3xl bg-white shadow-card p-5">
        <CommentSection targetId={diary.id} targetType="diary" />
        </div>

      {/* 配图全屏放大 */}
      <AnimatePresence>
        {zoomIndex !== null && diary.images?.[zoomIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setZoomIndex(null)}
          >
            <img
              src={diary.images[zoomIndex]}
              alt="配图"
              className="max-w-full max-h-[85vh] object-contain"
            />
            <button
              onClick={() => setZoomIndex(null)}
              className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] right-4 w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white active:scale-95 transition-transform"
              aria-label="关闭放大"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
