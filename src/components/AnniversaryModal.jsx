// 纪念日管理弹窗（PRD 2.6）：添加 / 删除重要的日子，首页倒计时展示
// 数据模型：[{ id, name, date }]，date 为 YYYY-MM-DD
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ModalSheet from './ModalSheet'
import { useToast } from './Toast'
import {
  getAnniversaryDates,
  addAnniversaryDate,
  removeAnniversaryDate,
} from '../services/settingsService'
import { formatYMD, getDaysUntil } from '../utils/dates'
import { CalendarIcon, PlusIcon, TrashIcon } from './icons'

export default function AnniversaryModal({ onClose }) {
  const toast = useToast()
  const [list, setList] = useState([])
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  // 打开弹窗时加载纪念日列表
  useEffect(() => {
    getAnniversaryDates().then(setList)
  }, [])

  /** 添加纪念日 */
  const handleAdd = async () => {
    if (!name.trim()) return toast('请给这个日子起个名字', 'error')
    if (!date) return toast('请选择日期', 'error')
    setSaving(true)
    try {
      const updated = await addAnniversaryDate({ name, date })
      setList(updated)
      setName('')
      setDate('')
      toast('已添加，首页会展示这个日子的倒计时', 'success')
    } catch (err) {
      toast(err.message || '添加失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  /** 删除纪念日 */
  const handleRemove = async (id) => {
    setList(await removeAnniversaryDate(id))
  }

  // 未到期的纪念日（含今天）在前，已过去的排后面；都按日期排序
  const sorted = [...list].sort((a, b) => {
    const da = getDaysUntil(a.date)
    const db = getDaysUntil(b.date)
    if ((da >= 0) !== (db >= 0)) return da >= 0 ? -1 : 1
    return a.date.localeCompare(b.date)
  })

  return (
    <ModalSheet
      title="纪念日管理"
      subtitle="添加重要的日子，首页会展示倒计时"
      onClose={onClose}
    >
      {/* 添加表单 */}
      <div className="rounded-2xl bg-white shadow-card p-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-love-light shrink-0" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="日子名称，如：第一次约会"
            className="flex-1 min-w-0 h-11 rounded-xl bg-love-bg px-3 text-sm outline-none focus:ring-2 ring-love/40 placeholder:text-slate-300"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 min-w-0 h-11 rounded-xl bg-love-bg px-3 text-sm text-slate-600 outline-none focus:ring-2 ring-love/40"
          />
          <button
            onClick={handleAdd}
            disabled={saving}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-95 transition-transform disabled:opacity-60 flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            添加
          </button>
        </div>
      </div>

      {/* 纪念日列表 */}
      {sorted.length === 0 ? (
        <p className="mt-5 text-center text-xs text-slate-400 py-6">
          还没有纪念日，添加「在一起」「生日」等重要日子吧～
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          <AnimatePresence initial={false}>
            {sorted.map((a) => {
              const days = getDaysUntil(a.date)
              const upcoming = days >= 0
              return (
                <motion.li
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 rounded-2xl bg-white shadow-card px-4 py-3"
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                      upcoming ? 'bg-gradient-to-br from-love to-love-light' : 'bg-slate-200'
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{a.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{formatYMD(a.date)}</p>
                  </div>
                  {/* 倒计时：今天 / 还有 N 天 / 已过 */}
                  <span
                    className={`shrink-0 text-xs font-semibold ${
                      days === 0
                        ? 'text-love'
                        : upcoming
                          ? 'text-love-deep'
                          : 'text-slate-300'
                    }`}
                  >
                    {days === 0 ? '就是今天 🎉' : upcoming ? `还有 ${days} 天` : '已过去'}
                  </span>
                  <button
                    onClick={() => handleRemove(a.id)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center text-slate-300 active:text-rose-500 active:scale-90 transition-all rounded-full"
                    aria-label={`删除${a.name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </ModalSheet>
  )
}
