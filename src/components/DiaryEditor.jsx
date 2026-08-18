// 日记编辑器（P0 写日记 / P1 编辑）：底部滑出弹层
// - 标题（选填）+ 正文（必填）
// - 配图：从相册选择多张，自动压缩（P1，与相册联动或单独上传）
// - 日期：默认今天，可手动修改（P1 日期标记）
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { compressImage } from '../utils/image'
import { XIcon, ImageIcon, CalendarIcon } from './icons'
import { useToast } from './Toast'

// 配图最多张数（控制本地存储体积）
const MAX_IMAGES = 6

/** 将 Date 转为 yyyy-mm-dd（本地时区） */
function toDateStr(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export default function DiaryEditor({ initial = null, saving = false, onSave, onClose }) {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState([]) // 配图 DataURL 列表
  const [dateStr, setDateStr] = useState(toDateStr(new Date()))
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef(null)

  // 编辑模式：用现有日记填充表单
  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '')
      setContent(initial.content || '')
      setImages(initial.images || [])
      setDateStr(toDateStr(new Date(initial.createdAt)))
    }
  }, [initial])

  /** 选择配图：逐个压缩后追加（最多 MAX_IMAGES 张） */
  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    const remain = MAX_IMAGES - images.length
    if (remain <= 0) {
      toast(`一篇日记最多放 ${MAX_IMAGES} 张配图哦`, 'error')
      return
    }
    setCompressing(true)
    try {
      const added = []
      // 串行压缩，避免多张大图同时解码造成内存压力
      for (const file of imageFiles.slice(0, remain)) {
        // 配图压缩得比相册更小，控制日记整体体积
        const dataUrl = await compressImage(file, { maxWidth: 1000, quality: 0.7 })
        added.push(dataUrl)
      }
      setImages((prev) => [...prev, ...added])
      if (imageFiles.length > remain) toast(`配图最多 ${MAX_IMAGES} 张，多余的已忽略`)
    } catch (err) {
      toast(err.message || '图片处理失败，请重试', 'error')
    } finally {
      setCompressing(false)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /** 保存：正文必填；日期以用户选择的为准 */
  const handleSave = () => {
    if (!content.trim()) {
      toast('写点什么再保存吧～', 'error')
      return
    }
    // 用中午时刻避免时区导致日期偏移一天
    const createdAt = new Date(`${dateStr}T12:00:00`).getTime()
    onSave({ title: title.trim(), content: content.trim(), images, createdAt })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/50"
      onClick={() => !saving && !compressing && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="absolute bottom-0 inset-x-0 max-h-[88vh] bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-love-deep">
            {initial ? '编辑这篇日记' : '写下今天的故事'}
          </h3>
          {!saving && !compressing && (
            <button
              onClick={onClose}
              className="w-11 h-11 -mr-2 flex items-center justify-center text-slate-400"
              aria-label="关闭"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-2 space-y-3">
          {/* 标题（选填） */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给这篇日记起个标题（选填）"
            maxLength={30}
            className="w-full h-11 px-4 rounded-xl bg-love-bg outline-none text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-love/40"
          />

          {/* 正文（必填） */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记录今天的小确幸、想对她说的话…"
            maxLength={5000}
            rows={6}
            className="w-full px-4 py-3 rounded-xl bg-love-bg outline-none text-sm placeholder:text-slate-300 resize-none leading-relaxed focus:ring-2 focus:ring-love/40"
          />

          {/* 配图（P1）：缩略图 + 添加按钮 */}
          <div>
            <p className="text-xs text-slate-400 mb-2">配图（可选，最多 {MAX_IMAGES} 张）</p>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-love-bg">
                  <img src={img} alt={`配图 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    disabled={saving || compressing}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center active:scale-90 transition-transform"
                    aria-label="移除配图"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={compressing}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-love-light/60 text-love-light flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  aria-label="添加配图"
                >
                  {compressing ? (
                    <span className="text-[11px]">处理中…</span>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-[11px]">添加</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 日期（P1）：默认今天，可手动修改 */}
          <label className="flex items-center gap-2 h-11 px-4 rounded-xl bg-love-bg cursor-pointer">
            <CalendarIcon className="w-4 h-4 text-love-light shrink-0" />
            <span className="text-xs text-slate-400">记录日期</span>
            <input
              type="date"
              value={dateStr}
              max={toDateStr(new Date())}
              onChange={(e) => e.target.value && setDateStr(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-love-deep min-w-0"
            />
          </label>

          {/* 隐藏的图片选择器：由"添加"按钮触发（选择后可多选） */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving || compressing}
            className="flex-1 h-12 rounded-2xl bg-love-bg text-love-deep text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || compressing}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-95 transition-transform disabled:opacity-50"
          >
            {saving ? '保存中…' : initial ? '保存修改' : '完成书写'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
