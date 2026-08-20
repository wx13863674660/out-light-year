// 通用底部滑出面板（设置类弹窗的统一容器：修改密码 / 纪念日管理 / 更换头像）
import { motion } from 'framer-motion'
import { XIcon } from './icons'

export default function ModalSheet({ title, subtitle, onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={onClose}
      role="dialog"
      aria-label={title}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-love-bg rounded-t-3xl max-h-[86vh] overflow-y-auto no-scrollbar"
      >
        {/* 顶部标题栏 */}
        <div className="sticky top-0 z-10 bg-love-bg/90 backdrop-blur flex items-center justify-between px-5 pt-4 pb-3 border-b border-love/10">
          <div>
            <h3 className="text-base font-bold text-love-deep">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 -mr-1 flex items-center justify-center text-slate-400 active:text-love active:scale-90 transition-all rounded-full"
            aria-label="关闭"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        {/* 内容区 */}
        <div className="px-5 py-5 pb-12">{children}</div>
      </motion.div>
    </motion.div>
  )
}
