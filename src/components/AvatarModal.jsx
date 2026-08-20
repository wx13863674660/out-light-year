// 更换头像弹窗（PRD 2.6）：上传情侣头像或合影作为空间标识
// 上传时自动压缩为小尺寸 JPEG，节省本地存储空间
import { useEffect, useRef, useState } from 'react'
import ModalSheet from './ModalSheet'
import { useToast } from './Toast'
import { getSettings, updateAvatar, removeAvatar } from '../services/settingsService'
import { compressImage } from '../utils/image'
import { HeartIcon, ImageIcon, CheckIcon, TrashIcon } from './icons'

export default function AvatarModal({ onClose }) {
  const toast = useToast()
  const fileRef = useRef(null)
  const [avatar, setAvatar] = useState('') // 已保存的头像
  const [preview, setPreview] = useState('') // 待保存的新预览
  const [saving, setSaving] = useState(false)

  // 打开弹窗时读取当前头像
  useEffect(() => {
    getSettings().then((s) => setAvatar(s.avatar || ''))
  }, [])

  /** 选择图片 → 压缩 → 预览（不立即保存） */
  const handlePick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件', 'error')
      return
    }
    try {
      // 头像尺寸小，压缩到 400px 即可，保证清晰且省空间
      const dataUrl = await compressImage(file, { maxWidth: 400, quality: 0.8 })
      setPreview(dataUrl)
    } catch (err) {
      toast(err.message || '图片处理失败', 'error')
    } finally {
      e.target.value = '' // 允许重复选择同一文件
    }
  }

  /** 保存新头像 */
  const handleSave = async () => {
    if (!preview) return
    setSaving(true)
    try {
      await updateAvatar(preview)
      setAvatar(preview)
      setPreview('')
      toast('头像已更新，首页和个人页都会展示', 'success')
    } catch (err) {
      toast(err.message || '保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  /** 移除头像，恢复默认爱心 */
  const handleRemove = async () => {
    await removeAvatar()
    setAvatar('')
    setPreview('')
    toast('已恢复默认头像')
  }

  const shown = preview || avatar

  return (
    <ModalSheet
      title="更换头像"
      subtitle="上传情侣头像或合影，作为你们空间的标识"
      onClose={onClose}
    >
      {/* 头像预览 */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-soft">
          {shown ? (
            <img src={shown} alt="空间头像" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-love to-love-light flex items-center justify-center text-white">
              <HeartIcon filled className="w-12 h-12" />
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {preview ? '新头像预览' : avatar ? '当前空间头像' : '尚未设置头像，默认使用爱心标识'}
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="mt-2 space-y-2.5">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={saving}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          <ImageIcon className="w-4 h-4" />
          选择图片
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePick}
          className="hidden"
        />

        {preview && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-2xl bg-love-deep text-white text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            <CheckIcon className="w-4 h-4" />
            {saving ? '保存中…' : '保存新头像'}
          </button>
        )}

        {avatar && !preview && (
          <button
            onClick={handleRemove}
            className="w-full h-11 rounded-2xl bg-white text-slate-500 text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
          >
            <TrashIcon className="w-4 h-4" />
            移除头像
          </button>
        )}
      </div>
    </ModalSheet>
  )
}
