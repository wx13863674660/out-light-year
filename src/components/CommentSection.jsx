// 通用评论区（P0）：日记详情 / 照片预览共用
// - 展示：按时间正序，每条带身份标识（"💙 他说" / "💗 她说"，PRD 2.4）
// - 发表：输入框 + 发送；本地模拟下可切换"他/她"身份
// - 回复（P2 暖心回复）：对任意评论回复，形成对话
// - 打开评论区即标记该分类已读，清除未读红点（P2 评论通知）
import { useEffect, useState } from 'react'
import { getComments, createComment, replyComment, markCommentsRead } from '../services/commentService'
import { useToast } from './Toast'
import { timeAgo } from '../utils/dates'
import { ReplyIcon, XIcon } from './icons'

// 身份视觉配置：谁在说话（PRD 权限设计中，评论者只有"他/她"两方）
const AUTHORS = {
  他: { emoji: '💙', bg: 'bg-blue-50', text: 'text-blue-500', label: '他说' },
  她: { emoji: '💗', bg: 'bg-love-bg', text: 'text-love', label: '她说' },
}

export default function CommentSection({ targetId, targetType }) {
  const toast = useToast()
  const [comments, setComments] = useState([]) // 评论列表（时间正序）
  const [author, setAuthor] = useState('她') // 以谁的身份评论（默认"她"）
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState(null) // 正在回复的评论 id，null 表示普通评论

  // 加载评论；打开评论区视为已读（清除该分类的未读红点）
  useEffect(() => {
    let alive = true
    getComments(targetId, targetType).then((list) => {
      if (alive) setComments(list)
    })
    markCommentsRead(targetType)
    return () => {
      alive = false
    }
  }, [targetId, targetType])

  /** 重新拉取评论列表 */
  const refresh = async () => setComments(await getComments(targetId, targetType))

  /** 发送：回复模式调用 replyComment，普通模式调用 createComment */
  const handleSend = async () => {
    if (!text.trim()) {
      toast('写点想说的话吧～', 'error')
      return
    }
    setSending(true)
    try {
      if (replyTo) {
        await replyComment(replyTo, { content: text, author })
        toast('回复成功～')
      } else {
        await createComment({ targetId, targetType, content: text, author })
      }
      setText('')
      setReplyTo(null)
      await refresh()
    } catch (err) {
      toast(err.message || '发送失败，请重试', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      {/* 标题 + 身份切换 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-love-deep">评论 {comments.length > 0 && `(${comments.length})`}</h4>
        <div className="flex items-center gap-1.5">
          {Object.entries(AUTHORS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setAuthor(key)}
              className={`h-7 px-3 rounded-full text-xs flex items-center gap-1 transition-colors ${
                author === key
                  ? `${cfg.bg} ${cfg.text} font-semibold`
                  : 'bg-white/60 text-slate-400'
              }`}
              aria-label={`以${cfg.label}身份评论`}
            >
              <span>{cfg.emoji}</span>
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* 评论列表（PRD：按时间顺序展示） */}
      <div className="mt-3 space-y-3">
        {comments.length === 0 && (
          <p className="text-center text-xs text-slate-300 py-4">还没有评论，来抢沙发吧～</p>
        )}
        {comments.map((c) => {
          const cfg = AUTHORS[c.author] || AUTHORS.她
          return (
            <div key={c.id}>
              <div className="flex gap-2.5">
                {/* 身份头像 */}
                <div
                  className={`shrink-0 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center text-sm`}
                  aria-hidden="true"
                >
                  {cfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-[10px] text-slate-300">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600 leading-relaxed break-words">
                    {c.content}
                  </p>
                </div>
              </div>

              {/* 暖心回复（P2）：回复人身份 + 时间 + 内容 */}
              {c.reply && (
                <div className="mt-1.5 ml-10 rounded-xl bg-love-bg/70 px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[11px] font-semibold ${AUTHORS[c.replyAuthor]?.text || 'text-love'}`}>
                      {AUTHORS[c.replyAuthor]?.label || '她说'} 回复
                    </span>
                    <span className="text-[10px] text-slate-300">{timeAgo(c.replyAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600 leading-relaxed break-words">{c.reply}</p>
                </div>
              )}

              {/* 回复入口 */}
              <button
                onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                className="ml-10 mt-1.5 flex items-center gap-1 text-[11px] text-slate-400 active:text-love transition-colors"
                aria-label="回复这条评论"
              >
                <ReplyIcon className="w-3 h-3" />
                {replyTo === c.id ? '取消回复' : '回复'}
              </button>
            </div>
          )
        })}
      </div>

      {/* 回复提示条：正在回复哪条评论 */}
      {replyTo && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-love-bg text-xs text-love-deep">
          <ReplyIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 min-w-0 truncate">
            正在回复「{comments.find((c) => c.id === replyTo)?.content || ''}」
          </span>
          <button onClick={() => setReplyTo(null)} className="shrink-0 text-slate-400" aria-label="取消回复">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 输入框 + 发送 */}
      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSend()
            }
          }}
          maxLength={200}
          placeholder={
            replyTo
              ? `以${AUTHORS[author].label}的身份回复…`
              : `以${AUTHORS[author].label}的身份说点什么…`
          }
          className="flex-1 h-11 px-4 rounded-xl bg-white border border-love-light/40 outline-none text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-love/40"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="h-11 px-5 rounded-xl bg-gradient-to-r from-love to-love-light text-white text-sm font-semibold shadow-soft active:scale-95 transition-transform disabled:opacity-50"
        >
          {sending ? '…' : replyTo ? '回复' : '发送'}
        </button>
      </div>
    </div>
  )
}
