// 甜蜜相册（核心模块，P0）
// - 照片上传：支持从手机相册选择单张 / 多张，自动压缩，可逐张填写描述与分类
// - 瀑布流布局：CSS columns 双列自适应，移动端优先
// - 图片预览：点击照片全屏查看，左右滑动切换
// - 照片删除：预览内操作（仅上传者）
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPhotos, uploadPhoto, deletePhoto, updatePhoto } from '../services/photoService'
import { getAllComments } from '../services/commentService'
import { compressImage } from '../utils/image'
import PhotoViewer from '../components/PhotoViewer'
import EmptyState from '../components/EmptyState'
import { useToast } from '../components/Toast'
import { AlbumIcon, PlusIcon, XIcon, CommentIcon } from '../components/icons'

// 照片分类（PRD 2.2：旅行 / 日常 / 节日）
const CATEGORIES = [
  { value: 'all', label: '全部', emoji: '🌈' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'daily', label: '日常', emoji: '🌷' },
  { value: 'festival', label: '节日', emoji: '🎉' },
  { value: 'other', label: '其他', emoji: '✨' },
]

export default function AlbumPage() {
  const toast = useToast()
  const [photos, setPhotos] = useState([]) // 全部照片（时间倒序）
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 当前分类筛选
  const [processing, setProcessing] = useState(false) // 压缩中
  const [saving, setSaving] = useState(false) // 保存中
  // 描述弹层：{ items: [{dataUrl}], current }，null 表示关闭
  const [sheet, setSheet] = useState(null)
  const [viewerIndex, setViewerIndex] = useState(null) // 全屏预览索引，null 关闭
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('other')
  const [commentCounts, setCommentCounts] = useState({}) // photo:id -> 评论数
  const fileInputRef = useRef(null)

  // 进入页面加载照片列表
  useEffect(() => {
    getPhotos().then((list) => {
      setPhotos(list)
      setLoading(false)
    })
  }, [])

  // 加载评论统计（PRD 2.4：列表角标提示评论数）
  useEffect(() => {
    getAllComments().then((list) => {
      const map = {}
      list.forEach((c) => {
        const key = `${c.targetType}:${c.targetId}`
        map[key] = (map[key] || 0) + 1
      })
      setCommentCounts(map)
    })
  }, [])

  // 按分类筛选后的照片（预览与瀑布流共用同一列表）
  const shownPhotos =
    filter === 'all' ? photos : photos.filter((p) => p.category === filter)

  /** 选择照片后：逐个压缩，全部完成后弹出描述弹层 */
  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    setProcessing(true)
    try {
      const items = []
      // 串行压缩，避免多张大图同时解码造成内存压力
      for (const file of imageFiles) {
        const dataUrl = await compressImage(file)
        items.push({ dataUrl })
      }
      setSheet({ items, current: 0 })
      setTitle('')
      setDesc('')
      setCategory('other')
    } catch (err) {
      toast(err.message || '照片处理失败，请重试', 'error')
    } finally {
      setProcessing(false)
    }
    // 允许再次选择同一批文件（input value 复位）
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /** 保存当前一张（带描述或跳过），处理完毕后刷新列表 */
  const handleSaveSheet = async (withMeta) => {
    const item = sheet.items[sheet.current]
    setSaving(true)
    try {
      await uploadPhoto(item.dataUrl, {
        title: withMeta ? title.trim() : '',
        description: withMeta ? desc.trim() : '',
        category: withMeta ? category : 'other',
      })
      if (sheet.current + 1 < sheet.items.length) {
        // 还有下一张：清空表单继续
        setSheet({ ...sheet, current: sheet.current + 1 })
        setTitle('')
        setDesc('')
        setCategory('other')
      } else {
        // 全部保存完成
        const total = sheet.items.length
        setSheet(null)
        toast(`已上传 ${total} 张照片，甜蜜存档 +${total}`)
        setPhotos(await getPhotos())
      }
    } catch (err) {
      toast(err.message || '保存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  /** 删除照片（预览内触发）：删除后自动跳到相邻照片或关闭 */
  const handleDelete = async (id) => {
    try {
      await deletePhoto(id)
      toast('照片已删除')
      const list = await getPhotos()
      setPhotos(list)
      const nextList = filter === 'all' ? list : list.filter((p) => p.category === filter)
      if (nextList.length === 0) {
        setViewerIndex(null)
      } else {
        // 保持当前浏览位置，若超出末尾则回到最后一张
        setViewerIndex(Math.min(viewerIndex ?? 0, nextList.length - 1))
      }
    } catch (err) {
      toast(err.message || '删除失败，请重试', 'error')
    }
  }

  /** 更新照片信息（标题 / 描述 / 分类），保存后刷新列表 */
  const handleUpdate = async (id, patch) => {
    try {
      await updatePhoto(id, patch)
      toast('照片信息已更新')
      setPhotos(await getPhotos())
    } catch (err) {
      toast(err.message || '更新失败，请重试', 'error')
      throw err // 抛给预览组件停止保存状态
    }
  }

  return (
    <section className="relative">
      {/* 标题 + 照片数 */}
      <div className="flex items-end justify-between">
        <h2 className="text-lg font-bold text-love-deep">甜蜜相册</h2>
        <span className="text-xs text-slate-400">{photos.length} 张回忆</span>
      </div>

      {/* 分类筛选条（P1）：横向滚动 */}
      <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={`shrink-0 h-9 px-4 rounded-full text-sm transition-colors ${
              filter === c.value
                ? 'bg-gradient-to-r from-love to-love-light text-white font-semibold shadow-soft'
                : 'bg-white text-slate-500'
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* 加载骨架 */}
      {loading && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`rounded-2xl bg-white/70 animate-pulse ${i % 2 ? 'h-40' : 'h-56'}`} />
          ))}
        </div>
      )}

      {/* 空状态（PRD 8.3 友好提示） */}
      {!loading && shownPhotos.length === 0 && (
        <EmptyState
          icon={<AlbumIcon className="w-8 h-8" />}
          title={filter === 'all' ? '相册还是空的' : '这个分类还没有照片'}
          desc={
            filter === 'all'
              ? '还没有照片，快去记录你们的点滴吧～'
              : '去别的分类逛逛，或者上传新照片吧'
          }
          extra={
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 h-11 px-6 rounded-full bg-gradient-to-r from-love to-love-light text-white text-sm shadow-soft active:scale-95 transition-transform"
            >
              上传第一张照片
            </button>
          }
        />
      )}

      {/* 瀑布流布局（P0）：双列，图片懒加载 */}
      {!loading && shownPhotos.length > 0 && (
        <div className="mt-4 columns-2 gap-3">
          {shownPhotos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setViewerIndex(i)}
              className="mb-3 block w-full break-inside-avoid relative rounded-2xl overflow-hidden bg-white shadow-card active:scale-[0.98] transition-transform"
            >
              <img
                src={p.thumbnailUrl}
                alt={p.title || '照片'}
                loading="lazy" // 图片懒加载（PRD 8.1）
                className="w-full h-auto"
              />
              {/* 描述角标：有描述时左下角小气泡 */}
              {p.description && (
                <span className="absolute left-2 bottom-2 max-w-[70%] truncate px-2 py-1 rounded-full bg-black/45 text-white/90 text-[11px] backdrop-blur-sm">
                  💬 {p.description}
                </span>
              )}
              {/* 评论数角标：右下角 */}
              {commentCounts[`photo:${p.id}`] > 0 && (
                <span className="absolute right-2 bottom-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-love-deep/80 text-white text-[10px] tabular-nums">
                  <CommentIcon className="w-3 h-3" />
                  {commentCounts[`photo:${p.id}`]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 上传按钮（FAB）：桌面端跟随内容容器右缘，移动端固定右下 */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-24 right-[max(1rem,calc(50%-15rem))] z-30 w-14 h-14 rounded-full bg-gradient-to-br from-love to-love-light text-white shadow-soft flex items-center justify-center active:scale-90 transition-transform"
        aria-label="上传照片"
      >
        <PlusIcon className="w-7 h-7" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* 压缩中提示 */}
      {processing && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
          <div className="px-6 py-4 rounded-2xl bg-white text-sm text-love-deep shadow-soft">
            正在处理照片…
          </div>
        </div>
      )}

      {/* 描述弹层（P1）：逐张填写标题 / 描述 / 分类 */}
      <AnimatePresence>
        {sheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => !saving && setSheet(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-love-deep">
                  为照片添加描述
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {sheet.current + 1} / {sheet.items.length}
                  </span>
                </h3>
                {!saving && (
                  <button
                    onClick={() => setSheet(null)}
                    className="w-11 h-11 -mr-2 flex items-center justify-center text-slate-400"
                    aria-label="关闭"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* 当前照片预览：完整显示不被裁剪，容器居中、等比缩放 */}
              <div className="mt-3 h-48 rounded-2xl overflow-hidden bg-love-bg flex items-center justify-center">
                <img
                  src={sheet.items[sheet.current].dataUrl}
                  alt="待上传"
                  className="max-w-full max-h-full object-contain rounded-2xl"
                />
              </div>

              <div className="mt-4 space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给这张照片起个名字（选填）"
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
                  {CATEGORIES.slice(1).map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`shrink-0 h-9 px-3 rounded-full text-xs transition-colors ${
                        category === c.value
                          ? 'bg-love-deep text-white'
                          : 'bg-love-bg text-slate-500'
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => handleSaveSheet(false)}
                  disabled={saving}
                  className="flex-1 h-12 rounded-2xl bg-love-bg text-love-deep text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
                >
                  跳过描述
                </button>
                <button
                  onClick={() => handleSaveSheet(true)}
                  disabled={saving}
                  className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-95 transition-transform disabled:opacity-50"
                >
                  {saving
                    ? '保存中…'
                    : sheet.current + 1 < sheet.items.length
                      ? '保存并继续'
                      : '完成上传'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 全屏预览（P0） */}
      <AnimatePresence>
        {viewerIndex !== null && (
          <PhotoViewer
            photos={shownPhotos}
            index={viewerIndex}
            onClose={() => setViewerIndex(null)}
            onIndexChange={setViewerIndex}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
