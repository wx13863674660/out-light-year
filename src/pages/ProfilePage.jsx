// 个人中心 / 设置（模块六）
// Phase 1：展示空间标识骨架 + 数据统计占位；后续阶段实现修改密码、纪念日管理等
import { HeartIcon, LockIcon } from '../components/icons'

// 设置项列表（Phase 1 展示占位，后续阶段实现）
const menuItems = [
  { name: '修改密码', desc: '更换进入空间的暗号' },
  { name: '纪念日管理', desc: '添加重要的日子，首页倒计时展示' },
  { name: '更换头像', desc: '上传情侣头像或合影' },
]

export default function ProfilePage() {
  return (
    <section>
      {/* 空间标识：头像占位 + 昵称 */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-love to-love-light flex items-center justify-center text-white shadow-soft">
          <HeartIcon filled className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-love-deep">我们的光年</h2>
          <p className="mt-0.5 text-xs text-slate-400">这里记录着我们所有的故事</p>
        </div>
      </div>

      {/* 数据统计占位（P2） */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { num: '0', label: '照片' },
          { num: '0', label: '日记' },
          { num: '0', label: '评论' },
        ].map((s) => (
          <div key={s.label} className="py-4 rounded-2xl bg-white shadow-card text-center">
            <p className="text-xl font-bold text-love-deep">{s.num}</p>
            <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 设置项列表 */}
      <div className="mt-5 bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-love/10">
        {menuItems.map((item) => (
          <div key={item.name} className="flex items-center gap-3 px-4 py-3.5">
            <LockIcon className="w-5 h-5 text-love-light shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">{item.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
            </div>
            <span className="ml-auto shrink-0 text-xs text-love-light">下一阶段上线</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-300">「我们的光年」· 一个只属于两个人的小窝</p>
    </section>
  )
}
