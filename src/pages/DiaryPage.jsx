// 恋爱日记（核心模块，P0）
// - 写日记：右下角 FAB → 底部滑出编辑器（标题 / 正文 / 配图 / 日期）
// - 日记列表：按时间倒序，卡片式优雅展示（日期徽章 + 摘要 + 配图）
// - 日记详情：点击卡片全屏阅读，可编辑 / 删除
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDiaries, createDiary, updateDiary, deleteDiary } from '../services/diaryService'
import { getAllComments } from '../services/commentService'
import DiaryEditor from '../components/DiaryEditor'
import DiaryDetail from '../components/DiaryDetail'
import EmptyState from '../components/EmptyState'
import { useToast } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'
import { DiaryIcon, PlusIcon, CommentIcon } from '../components/icons'

/** 从时间戳提取日期徽章文本：{ month, day, year } */
function dateBadge(ts) {
  const d = new Date(ts)
  return {
    month: `${d.getMonth() + 1}月`,
    day: d.getDate(),
    year: d.getFullYear(),
  }
}

// 身份视觉配置：谁记录的（与评论区一致）
const AUTHORS = {
  他: { emoji: '💙', bg: 'bg-blue-50', text: 'text-blue-500', label: '他' },
  她: { emoji: '💗', bg: 'bg-love-bg', text: 'text-love', label: '她' },
}

export default function DiaryPage() {
  const toast = useToast()
  // 当前登录身份（"他"=男生 / "她"=女生），用于新日记的署名；双方共享查看所有日记
  const { identity: loginIdentity } = useAuth()
  const identity = loginIdentity || '他'
  const [diaries, setDiaries] = useState([]) // 双方共享的日记列表（时间倒序）
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState(null) // null 关闭；{ initial } 打开（写=null / 编辑=日记对象）
  const [detailId, setDetailId] = useState(null) // 详情中日记的 id，null 关闭
  const [saving, setSaving] = useState(false)
  const [commentCounts, setCommentCounts] = useState({}) // diary:id -> 评论数

  // 进入页面加载日记列表（按当前身份过滤）
  useEffect(() => {
    getDiaries().then((list) => {
      setDiaries(list)
      setLoading(false)
    })
  }, [identity])

  // 加载评论统计（PRD 2.4：卡片角标提示评论数）
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

  /** 保存日记（新建 / 编辑共用）：保存后刷新列表并关闭弹层 */
  const handleSave = async (draft) => {
    setSaving(true)
    try {
      if (editor.initial) {
        // 编辑：保留原 id
        await updateDiary(editor.initial.id, draft)
        toast('日记已更新')
      } else {
        // 新建：记录当前登录身份
        await createDiary(draft, identity)
        toast('日记已保存，时光书又厚了一页')
      }
      setDiaries(await getDiaries())
      setEditor(null)
    } catch (err) {
      toast(err.message || '保存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  /** 删除日记（详情页触发） */
  const handleDelete = async (id) => {
    try {
      await deleteDiary(id)
      toast('日记已删除')
      setDiaries(await getDiaries())
      setDetailId(null)
    } catch (err) {
      toast(err.message || '删除失败，请重试', 'error')
    }
  }

  // 详情中日记对象：从列表实时取，避免保存后读到旧数据
  const detailDiary = diaries.find((d) => d.id === detailId) || null

  return (
    <section className="relative">
      {/* 标题 + 篇数 */}
      <div className="flex items-end justify-between">
        <h2 className="text-lg font-bold text-love-deep">恋爱日记</h2>
        <span className="text-xs text-slate-400">{diaries.length} 篇时光</span>
      </div>

      {/* 加载骨架 */}
      {loading && (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/70 animate-pulse" />
          ))}
        </div>
      )}

      {/* 空状态（PRD 8.3 友好提示） */}
      {!loading && diaries.length === 0 && (
        <EmptyState
          icon={<DiaryIcon className="w-8 h-8" />}
          title="日记本还是空的"
          desc="把今天的小确幸写下来，未来的我们会感谢现在的记录"
          extra={
            <button
              onClick={() => setEditor({ initial: null })}
              className="mt-6 h-11 px-6 rounded-full bg-gradient-to-r from-love to-love-light text-white text-sm shadow-soft active:scale-95 transition-transform"
            >
              写下第一篇日记
            </button>
          }
        />
      )}

      {/* 日记卡片列表（P0）：时间倒序 */}
      {!loading && diaries.length > 0 && (
        <div className="mt-4 space-y-3">
          <AnimatePresence initial={false}>
            {diaries.map((d, i) => {
              const b = dateBadge(d.createdAt)
              const cfg = AUTHORS[d.author] || AUTHORS.他
              return (
                <motion.button
                  key={d.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  onClick={() => setDetailId(d.id)}
                  className="w-full text-left rounded-2xl bg-white shadow-card p-4 flex gap-3 active:scale-[0.98] transition-transform"
                >
                  {/* 日期徽章 */}
                  <div className="shrink-0 w-14 rounded-xl bg-love-bg flex flex-col items-center justify-center py-2">
                    <span className="text-[10px] text-love-light">{b.month}</span>
                    <span className="text-lg font-bold text-love-deep leading-none mt-0.5">
                      {b.day}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{b.year}</span>
                  </div>

                  {/* 卡片正文 */}
                  <div className="flex-1 min-w-0">
                    {/* 记录者标识：双方共享查看 */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`shrink-0 inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      <h3 className="flex-1 min-w-0 text-[15px] font-semibold text-love-deep truncate">
                        {d.title || '未命名的一天'}
                      </h3>
                    </div>
                    {/* 正文摘要：最多 3 行 */}
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed line-clamp-3">
                      {d.content}
                    </p>
                    {/* 首张配图 + 阅读提示 */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {d.images && d.images.length > 0 && (
                          <>
                            <img
                              src={d.images[0]}
                              alt="配图"
                              loading="lazy"
                              className="w-9 h-9 rounded-lg object-cover"
                            />
                            {d.images.length > 1 && (
                              <span className="text-[11px] text-slate-300">
                                +{d.images.length - 1}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {commentCounts[`diary:${d.id}`] > 0 && (
                        <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-love-bg text-love-deep text-[11px] tabular-nums">
                          <CommentIcon className="w-3.5 h-3.5" />
                          {commentCounts[`diary:${d.id}`]}
                        </span>
                      )}
                      <span className="shrink-0 text-xs text-love-light">阅读全文 →</span>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 写日记按钮（FAB）：与相册页一致，桌面端跟随内容容器右缘 */}
      <button
        onClick={() => setEditor({ initial: null })}
        className="fixed bottom-24 right-[max(1rem,calc(50%-15rem))] z-30 w-14 h-14 rounded-full bg-gradient-to-br from-love to-love-light text-white shadow-soft flex items-center justify-center active:scale-90 transition-transform"
        aria-label="写日记"
      >
        <PlusIcon className="w-7 h-7" />
      </button>

      {/* 写 / 编辑弹层 */}
      <AnimatePresence>
        {editor && (
          <DiaryEditor
            initial={editor.initial}
            saving={saving}
            onSave={handleSave}
            onClose={() => !saving && setEditor(null)}
          />
        )}
      </AnimatePresence>

      {/* 详情弹层 */}
      <AnimatePresence>
        {detailDiary && (
          <DiaryDetail
            diary={detailDiary}
            commentCount={commentCounts[`diary:${detailDiary.id}`] || 0}
            onClose={() => setDetailId(null)}
            onEdit={(d) => {
              setDetailId(null) // 先关闭详情，再打开编辑器
              setEditor({ initial: d })
            }}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
