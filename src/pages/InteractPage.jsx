// 趣味互动（模块五）：今日默契题 / 思念按钮 / 恋爱清单
// Phase 4 实现（P1×2 + P2×1）；时光胶囊与爱心雨保留"即将上线"占位（后续阶段）
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getDailyQuestion,
  getDailyAnswers,
  submitAnswer,
  sendMissingYou,
  getMissings,
  markMissingsRead,
  getBucketList,
  addBucketItem,
  toggleBucketItem,
  removeBucketItem,
  createCapsule,
  getCapsules,
  readCapsule,
  isCapsuleLocked,
  capsuleDaysLeft,
  getRainSetting,
  setRainSetting,
} from '../services/interactionService'
import { useToast } from '../components/Toast'
import FallingPetals, { HeartBurst } from '../components/FallingPetals'
import { timeAgo, formatYMD } from '../utils/dates'
import {
  InteractIcon,
  HeartIcon,
  SendIcon,
  CheckIcon,
  MailIcon,
  LockIcon,
  XIcon,
  TrashIcon,
  PlusIcon,
} from '../components/icons'

// 身份视觉（与评论区保持一致）
const AUTHORS = {
  他: { emoji: '💙', bg: 'bg-blue-50', text: 'text-blue-500', label: '他说' },
  她: { emoji: '💗', bg: 'bg-love-bg', text: 'text-love', label: '她说' },
}

export default function InteractPage() {
  const toast = useToast()
  const [identity, setIdentity] = useState('他') // 本地模拟：当前操作者身份
  const [question, setQuestion] = useState(null) // 今日默契题
  const [answers, setAnswers] = useState({ 他: '', 她: '' }) // 双方答案
  const [myAnswer, setMyAnswer] = useState('')
  const [savingAnswer, setSavingAnswer] = useState(false)
  const [missing, setMissing] = useState(null) // 未读的"对方在想你"横幅
  const [petalBurst, setPetalBurst] = useState(0) // 花瓣雨触发计数（收到心意时 +1）
  const [burstKey, setBurstKey] = useState(0) // 发送爱心迸发计数
  const [sending, setSending] = useState(false)
  const [list, setList] = useState([]) // 恋爱清单
  const [newItem, setNewItem] = useState('')
  const [capsules, setCapsules] = useState([]) // 时光胶囊列表
  const [capsuleText, setCapsuleText] = useState('') // 写信内容
  const [capsuleOpenAt, setCapsuleOpenAt] = useState('') // 解锁日期 YYYY-MM-DD
  const [savingCapsule, setSavingCapsule] = useState(false)
  const [viewingCapsule, setViewingCapsule] = useState(null) // 正在查看的胶囊 id
  const [autoRain, setAutoRain] = useState(null) // 进入自动爱心雨开关（null=加载中）
  const [rainBurst, setRainBurst] = useState(0) // 爱心雨触发计数

  /** 重新计算未读心意横幅：最近一条"对方"发的未读 */
  const refreshMissing = () => {
    getMissings().then((all) => {
      const found = all.find((m) => !m.read && m.author !== identity)
      setMissing(found || null)
    })
  }

  // 进入页面：加载今日默契题 + 双方答案 + 未读心意 + 恋爱清单 + 时光胶囊 + 爱心雨开关
  useEffect(() => {
    let alive = true
    Promise.all([getDailyQuestion(), getBucketList(), getCapsules(), getRainSetting()])
      .then(([q, l, cs, rain]) => {
        if (!alive) return
        setQuestion(q)
        setList(l)
        setCapsules(cs)
        setAutoRain(rain)
        return getDailyAnswers(q.id)
      })
      .then((a) => {
        if (alive) setAnswers(a || { 他: '', 她: '' })
      })
    refreshMissing()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 切换身份后横幅按"新身份的对方"重新判断
  useEffect(() => {
    refreshMissing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity])

  // 收到未读心意 → 播放玫瑰花瓣雨（missing 从无到有时触发一次）
  useEffect(() => {
    if (missing) setPetalBurst((b) => b + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing])

  // 开启"进入自动爱心雨"（含首次加载）→ 播放一场爱心雨
  useEffect(() => {
    if (autoRain) setRainBurst((r) => r + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRain])

  // ---------- 今日默契题 ----------
  /** 以当前身份提交今日答案 */
  const handleSubmitAnswer = async () => {
    if (!question) return
    setSavingAnswer(true)
    try {
      const a = await submitAnswer(question.id, identity, myAnswer)
      setAnswers(a)
      setMyAnswer('')
      toast(`已记录${AUTHORS[identity].label}的答案～`)
    } catch (err) {
      toast(err.message || '提交失败，请重试', 'error')
    } finally {
      setSavingAnswer(false)
    }
  }

  // 双方都已作答时比对答案（忽略首尾空格）
  const bothAnswered = Boolean(answers.他 && answers.她)
  const match = bothAnswered && answers.他.trim() === answers.她.trim()

  // ---------- 思念按钮 ----------
  /** 以当前身份发送"想你了" */
  const handleSendMissing = async () => {
    setSending(true)
    try {
      await sendMissingYou(identity)
      setBurstKey((k) => k + 1) // 按钮迸发爱心
      toast('已告诉TA，想你了～')
      refreshMissing() // 自己的心意不会显示为"对方在想你"
    } catch (err) {
      toast(err.message || '发送失败，请重试', 'error')
    } finally {
      setSending(false)
    }
  }

  /** 关闭横幅：全部心意标记已读 */
  const dismissMissing = async () => {
    await markMissingsRead()
    setMissing(null)
  }

  // ---------- 恋爱清单 ----------
  const handleAddItem = async () => {
    try {
      setList(await addBucketItem(newItem))
      setNewItem('')
    } catch (err) {
      toast(err.message || '添加失败', 'error')
    }
  }

  const handleToggle = async (id) => {
    setList(await toggleBucketItem(id))
  }

  const handleRemove = async (id) => {
    setList(await removeBucketItem(id))
  }

  // ---------- 时光胶囊 ----------
  /** 写一封给未来的信 */
  const handleCreateCapsule = async () => {
    setSavingCapsule(true)
    try {
      setCapsules(await createCapsule(capsuleText, capsuleOpenAt))
      setCapsuleText('')
      setCapsuleOpenAt('')
      toast('已封存，等那一天到来～')
    } catch (err) {
      toast(err.message || '封存失败，请重试', 'error')
    } finally {
      setSavingCapsule(false)
    }
  }

  /** 打开一颗已到期的胶囊：标记已读 + 飘一场爱心雨庆祝 */
  const handleOpenCapsule = async (id) => {
    setCapsules(await readCapsule(id))
    setViewingCapsule(id)
    setRainBurst((r) => r + 1)
  }

  // ---------- 爱心雨 ----------
  /** 切换"进入自动爱心雨"开关 */
  const handleToggleRain = async () => {
    const next = !autoRain
    setAutoRain(next)
    await setRainSetting(next)
  }

  const doneCount = list.filter((i) => i.done).length

  // 今天的本地日期字符串（给解锁日期选择器限制最小可选日期）
  const now = new Date()
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <section>
      {/* 收到"想你了"时的全屏玫瑰花瓣雨 + 爱心升起 */}
      {petalBurst > 0 && (
        <FallingPetals key={petalBurst} onFinished={() => setPetalBurst(0)} />
      )}
      {/* 爱心雨（进入页面自动 / 手动触发 / 胶囊解锁庆祝） */}
      {rainBurst > 0 && (
        <FallingPetals key={`rain-${rainBurst}`} type="heart" onFinished={() => setRainBurst(0)} />
      )}

      <h2 className="text-lg font-bold text-love-deep">趣味互动</h2>

      {/* 思念横幅（P1）：对方发来"想你了"，进入页面时滑入提示 */}
      <AnimatePresence>
        {missing && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-love to-love-light text-white shadow-soft px-4 py-3"
          >
            <span className="text-xl" aria-hidden="true">
              💌
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {AUTHORS[missing.author].emoji} {AUTHORS[missing.author].label} 在想你
              </p>
              <p className="mt-0.5 text-xs text-white/85">{timeAgo(missing.createdAt)} · 点一下让我知道你来过</p>
            </div>
            <button
              onClick={dismissMissing}
              className="shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="知道了"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 今日默契题（P1） */}
      <div className="mt-4 rounded-3xl bg-white shadow-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-love-bg flex items-center justify-center text-love-deep">
              <InteractIcon className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-bold text-love-deep">今日默契题</h3>
          </div>
          {/* 身份切换：以"谁"的身份作答 */}
          <div className="flex items-center gap-1.5">
            {Object.entries(AUTHORS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setIdentity(key)}
                className={`h-7 px-3 rounded-full text-xs flex items-center gap-1 transition-colors ${
                  identity === key
                    ? `${cfg.bg} ${cfg.text} font-semibold`
                    : 'bg-white/60 text-slate-400'
                }`}
                aria-label={`以${cfg.label}身份作答`}
              >
                <span>{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* 题目 */}
        <p className="mt-3 text-base font-semibold text-slate-700 leading-relaxed">{question?.text}</p>

        {/* 双方答案展示 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {Object.entries(AUTHORS).map(([key, cfg]) => (
            <div key={key} className={`rounded-xl px-3 py-2.5 ${cfg.bg}`}>
              <p className={`text-[11px] font-semibold ${cfg.text}`}>
                {cfg.emoji} {cfg.label}的答案
              </p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed break-words min-h-5">
                {answers[key] || <span className="text-slate-300">还没作答…</span>}
              </p>
            </div>
          ))}
        </div>

        {/* 比对结果（双方都答后显示） */}
        {bothAnswered && (
          <div className="mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-center bg-gradient-to-r from-love/10 to-love-light/10 text-love-deep">
            {match ? '心有灵犀一点通 💞' : '答案不一样哦，去聊一聊吧 🍬'}
          </div>
        )}

        {/* 作答输入（以当前身份） */}
        <div className="mt-3 flex items-center gap-2">
          <input
            value={myAnswer}
            onChange={(e) => setMyAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmitAnswer()
              }
            }}
            maxLength={50}
            placeholder={`以${AUTHORS[identity].label}的身份写下答案…`}
            className="flex-1 h-11 px-4 rounded-xl bg-white border border-love-light/40 outline-none text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-love/40"
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={savingAnswer}
            className="h-11 px-4 rounded-xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-95 transition-transform disabled:opacity-50"
          >
            {savingAnswer ? '…' : '提交'}
          </button>
        </div>
      </div>

      {/* 思念按钮（P1） */}
      <div className="mt-4 rounded-3xl bg-white shadow-card p-5 text-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-love-bg flex items-center justify-center text-love-deep">
              <HeartIcon className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-bold text-love-deep">思念按钮</h3>
          </div>
          {/* 身份切换：以"谁"的身份发心意 */}
          <div className="flex items-center gap-1.5">
            {Object.entries(AUTHORS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setIdentity(key)}
                className={`h-7 px-3 rounded-full text-xs flex items-center gap-1 transition-colors ${
                  identity === key
                    ? `${cfg.bg} ${cfg.text} font-semibold`
                    : 'bg-white/60 text-slate-400'
                }`}
                aria-label={`以${cfg.label}身份发送`}
              >
                <span>{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          想TA了，就点一下。TA 下次打开这个空间，就会看到你的心意。
        </p>
        <div className="relative inline-flex mt-3">
          <button
            onClick={handleSendMissing}
            disabled={sending}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-95 transition-transform disabled:opacity-50"
          >
            <SendIcon className="w-4 h-4" />
            {sending ? '正在送出…' : '想你了'}
          </button>
          {/* 发送成功后从按钮迸发的小爱心 */}
          {burstKey > 0 && <HeartBurst key={burstKey} onFinished={() => setBurstKey(0)} />}
        </div>
      </div>

      {/* 恋爱清单（P2） */}
      <div className="mt-4 rounded-3xl bg-white shadow-card p-5">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-love-bg flex items-center justify-center text-love-deep">
            <CheckIcon className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold text-love-deep">恋爱清单</h3>
          <span className="ml-auto text-xs text-slate-400 tabular-nums">
            已完成 {doneCount}/{list.length}
          </span>
        </div>

        {/* 进度条 */}
        {list.length > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-love-bg overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-love to-love-light transition-all duration-500"
              style={{ width: `${(doneCount / list.length) * 100}%` }}
            />
          </div>
        )}

        {/* 添加输入 */}
        <div className="mt-3 flex items-center gap-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddItem()
              }
            }}
            maxLength={50}
            placeholder="写下一件想一起做的事…"
            className="flex-1 h-11 px-4 rounded-xl bg-white border border-love-light/40 outline-none text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-love/40"
          />
          <button
            onClick={handleAddItem}
            className="h-11 px-4 rounded-xl bg-gradient-to-r from-love to-love-light text-white flex items-center justify-center shadow-soft active:scale-95 transition-transform"
            aria-label="添加清单项"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 清单列表 */}
        <div className="mt-3 space-y-2">
          {list.length === 0 && (
            <p className="text-center text-xs text-slate-300 py-4">还没有想一起做的事，写一条吧～</p>
          )}
          {list.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-love-bg/50"
            >
              {/* 打钩按钮：完成后变实心对勾 */}
              <button
                onClick={() => handleToggle(item.id)}
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-colors active:scale-90 ${
                  item.done
                    ? 'bg-gradient-to-r from-love to-love-light border-transparent text-white'
                    : 'border-love-light text-transparent'
                }`}
                aria-label={item.done ? '标记未完成' : '标记完成'}
              >
                <CheckIcon className="w-3.5 h-3.5" />
              </button>
              <span
                className={`flex-1 text-sm min-w-0 break-words transition-colors ${
                  item.done ? 'text-slate-300 line-through' : 'text-slate-600'
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => handleRemove(item.id)}
                className="shrink-0 w-8 h-8 flex items-center justify-center text-slate-300 active:text-love transition-colors"
                aria-label="删除清单项"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 时光胶囊（P2）：写一封给未来彼此的信，设定日期才能打开 */}
      <div className="mt-4 rounded-3xl bg-white shadow-card p-5">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-love-bg flex items-center justify-center text-love-deep">
            <MailIcon className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold text-love-deep">时光胶囊</h3>
          <span className="ml-auto text-[11px] text-slate-400">写给未来的你们</span>
        </div>

        {/* 写信表单 */}
        <div className="mt-3">
          <textarea
            value={capsuleText}
            onChange={(e) => setCapsuleText(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="写下想对未来的TA说的话，封存起来…"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-love-light/40 outline-none text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-love/40 resize-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <label className="flex-1 flex items-center gap-1.5 h-11 px-3 rounded-xl bg-love-bg/60 text-xs text-love-deep">
              <LockIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">解锁日</span>
              <input
                type="date"
                value={capsuleOpenAt}
                min={todayLocal}
                onChange={(e) => setCapsuleOpenAt(e.target.value)}
                className="flex-1 min-w-0 bg-transparent outline-none text-xs text-slate-600"
              />
            </label>
            <button
              onClick={handleCreateCapsule}
              disabled={savingCapsule}
              className="shrink-0 h-11 px-4 rounded-xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-95 transition-transform disabled:opacity-50"
            >
              {savingCapsule ? '封存中…' : '封存'}
            </button>
          </div>
        </div>

        {/* 胶囊列表 */}
        <div className="mt-3 space-y-2">
          {capsules.length === 0 && (
            <p className="text-center text-xs text-slate-300 py-3">还没有时光胶囊，埋一封给未来的惊喜吧～</p>
          )}
          {capsules.map((c) => {
            const locked = isCapsuleLocked(c)
            const days = capsuleDaysLeft(c)
            const open = viewingCapsule === c.id
            return (
              <div key={c.id}>
                <button
                  onClick={() => !locked && handleOpenCapsule(c.id)}
                  disabled={locked}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    locked
                      ? 'bg-love-bg/50'
                      : open
                        ? 'bg-gradient-to-r from-love/10 to-love-light/10 border border-love-light/40'
                        : 'bg-gradient-to-r from-love/10 to-love-light/10 border border-love-light/40 active:scale-[0.99]'
                  }`}
                >
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      locked ? 'bg-white text-love-light' : 'bg-white text-love'
                    }`}
                  >
                    {locked ? <LockIcon className="w-4 h-4" /> : <MailIcon className="w-4 h-4" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-love-deep">
                      {locked ? '一封写给未来的信' : '已开启 · 点击拆开 💌'}
                    </span>
                    <span className="block mt-0.5 text-[11px] text-slate-400">
                      {formatYMD(c.openAt)}开启
                    </span>
                  </span>
                  <span className="shrink-0">
                    {locked ? (
                      <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-white text-[11px] font-semibold text-love-light tabular-nums">
                        <LockIcon className="w-3 h-3" />
                        {days > 0 ? `${days} 天后` : '今日'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-white text-[11px] font-semibold text-love tabular-nums">
                        {c.opened ? '已读' : 'NEW'}
                      </span>
                    )}
                  </span>
                </button>

                {/* 展开查看信件内容 */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-2 px-3.5 py-3 rounded-xl bg-white border border-love-light/40 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {c.text}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* 爱心雨（P2）：进入页面自动 / 手动触发全屏爱心飘落 */}
      <div className="mt-4 rounded-3xl bg-white shadow-card p-5 text-center">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-love-bg flex items-center justify-center text-love-deep">
            <HeartIcon className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold text-love-deep">爱心雨</h3>
          {/* 进入自动播放开关 */}
          <button
            onClick={handleToggleRain}
            role="switch"
            aria-checked={Boolean(autoRain)}
            aria-label="每次进入自动飘爱心雨"
            className={`ml-auto relative w-10 h-6 rounded-full transition-colors ${
              autoRain ? 'bg-gradient-to-r from-love to-love-light' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                autoRain ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          开启后，每次进入这个页面都会飘一场爱心雨。想再下一场，点下面就好～
        </p>
        <button
          onClick={() => setRainBurst((r) => r + 1)}
          className="mt-3 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-love-bg text-love text-sm font-semibold active:scale-95 transition-transform"
        >
          <HeartIcon className="w-4 h-4" />
          下一场爱心雨
        </button>
      </div>
    </section>
  )
}
