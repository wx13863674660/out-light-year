// 修改密码弹窗（PRD 2.6）：更换进入空间的暗号
// 流程：验证旧密码 → 输入新密码 + 确认 → 保存
import { useState } from 'react'
import ModalSheet from './ModalSheet'
import { useToast } from './Toast'
import { verifyPassword, updatePassword } from '../services/settingsService'
import { EyeIcon, LockIcon, CheckIcon } from './icons'

export default function ChangePasswordModal({ onClose }) {
  const toast = useToast()
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [show, setShow] = useState(false) // 明文/密文切换
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!oldPwd) return setError('请输入当前暗号')
    if (!newPwd) return setError('请输入新暗号')
    if (newPwd.length < 4) return setError('新暗号至少 4 位哦')
    if (newPwd !== confirmPwd) return setError('两次输入的新暗号不一致')

    setSaving(true)
    try {
      const ok = await verifyPassword(oldPwd)
      if (!ok) {
        setError('当前暗号不正确，请再想想～')
        return
      }
      await updatePassword(oldPwd, newPwd)
      toast('暗号已更换，下次进入请使用新暗号', 'success')
      onClose()
    } catch (err) {
      setError(err.message || '修改失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalSheet title="修改密码" subtitle="更换进入空间的暗号，请牢记新暗号" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 当前暗号 */}
        <label className="block">
          <span className="text-xs font-medium text-slate-500">当前暗号</span>
          <div className="relative mt-1.5">
            <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-love-light" />
            <input
              type={show ? 'text' : 'password'}
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              placeholder="输入现在的暗号"
              autoComplete="current-password"
              className="w-full h-12 rounded-2xl bg-white shadow-card pl-10 pr-11 text-sm outline-none focus:ring-2 ring-love/40 placeholder:text-slate-300"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 active:text-love transition-colors"
              aria-label={show ? '隐藏暗号' : '显示暗号'}
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          </div>
        </label>

        {/* 新暗号 */}
        <label className="block">
          <span className="text-xs font-medium text-slate-500">新暗号</span>
          <div className="relative mt-1.5">
            <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-love-light" />
            <input
              type={show ? 'text' : 'password'}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="至少 4 位，如 5201314"
              autoComplete="new-password"
              className="w-full h-12 rounded-2xl bg-white shadow-card pl-10 pr-4 text-sm outline-none focus:ring-2 ring-love/40 placeholder:text-slate-300"
            />
          </div>
        </label>

        {/* 确认新暗号 */}
        <label className="block">
          <span className="text-xs font-medium text-slate-500">确认新暗号</span>
          <div className="relative mt-1.5">
            <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-love-light" />
            <input
              type={show ? 'text' : 'password'}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="再输入一次新暗号"
              autoComplete="new-password"
              className="w-full h-12 rounded-2xl bg-white shadow-card pl-10 pr-4 text-sm outline-none focus:ring-2 ring-love/40 placeholder:text-slate-300"
            />
          </div>
        </label>

        {/* 错误提示 */}
        {error && (
          <p className="text-xs text-rose-500 bg-rose-50 rounded-xl px-3 py-2.5">{error}</p>
        )}

        {/* 提交 */}
        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          <CheckIcon className="w-4 h-4" />
          {saving ? '保存中…' : '保存新暗号'}
        </button>
      </form>
    </ModalSheet>
  )
}
