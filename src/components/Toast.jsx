// 全局轻提示：用于操作成功 / 失败的视觉反馈（PRD 8.3 可用性）
// 用法：const toast = useToast(); toast('已上传 3 张照片') / toast('失败啦', 'error')
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  /** 弹出提示，约 2.4s 后自动消失 */
  const push = useCallback((msg, type = 'success') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 2400)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      {/* 提示容器：固定顶部居中，不遮挡底部导航 */}
      <div className="pointer-events-none fixed top-20 inset-x-0 z-50 flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className={`px-5 py-2.5 rounded-full text-sm shadow-soft ${
                t.type === 'error'
                  ? 'bg-love-deep text-white'
                  : 'bg-white/95 text-love-deep'
              }`}
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

/** 获取 toast 方法 */
export function useToast() {
  return useContext(ToastContext)
}
