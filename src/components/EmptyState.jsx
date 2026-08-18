// 通用空状态组件：用于各模块暂无数据时的友好提示（PRD 8.3 可用性）
export default function EmptyState({ icon, title, desc, extra }) {
  return (
    <div className="py-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-3xl bg-white shadow-card flex items-center justify-center text-love-light">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-love-deep">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-400 max-w-[240px] leading-relaxed">{desc}</p>
      {extra}
    </div>
  )
}
