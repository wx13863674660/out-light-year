// 评论服务：日记 / 照片评论的创建、暖心回复与未读通知（数据模型遵循 PRD 5.3 评论表）
//
// 【重要】当前为本地模拟实现（localStorage），接入 Supabase / Firebase 后
// （Phase 5），仅需替换本文件的实现为云端读写，各页面调用方无需改动。
const STORAGE_KEY = 'our-light-years:comments'
const READ_KEY = 'our-light-years:comments-read'

/** 评论数据变化订阅（BottomNav 红点据此刷新） */
const listeners = new Set()

/** 生成唯一 ID */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 读取本地全部评论 */
function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 写入本地评论列表；存储配额不足时抛出可读错误 */
function writeAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    throw new Error('本地存储空间不足，请删除一些内容后再试（接入云端存储后此限制将解除）')
  }
}

/**
 * 各分类的"上次查看时间"（PRD 2.4 评论通知的已读标记）
 * 首次使用以当前时间为基准，历史评论不算未读
 */
function readState() {
  try {
    const raw = localStorage.getItem(READ_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* 本地数据损坏时按首次使用处理 */
  }
  const init = { diary: Date.now(), photo: Date.now() }
  localStorage.setItem(READ_KEY, JSON.stringify(init))
  return init
}

/** 广播评论数据变化 */
function notify() {
  listeners.forEach((fn) => fn())
}

/**
 * 订阅评论变化（新增评论 / 标记已读时触发，供未读红点等 UI 刷新）
 * @param {Function} fn 变更回调
 * @returns {Function} 取消订阅函数
 */
export function onCommentsChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * 获取某篇日记 / 某张照片的全部评论（按时间正序展示，PRD 2.4）
 * @param {string} targetId 关联的日记 ID 或照片 ID
 * @param {string} targetType "diary" 或 "photo"
 * @returns {Promise<Array>} 评论列表
 */
export async function getComments(targetId, targetType) {
  return readAll()
    .filter((c) => c.targetId === targetId && c.targetType === targetType)
    .sort((a, b) => a.createdAt - b.createdAt)
}

/**
 * 获取全部评论（列表页一次拉取后统计评论数角标）
 * @returns {Promise<Array>} 全部评论
 */
export async function getAllComments() {
  return readAll()
}

/**
 * 创建评论（PRD 权限：双方均可评论，本地模拟下通过身份选择区分"他/她"）
 * @param {object} data 评论数据（PRD 5.3）
 * @param {string} data.targetId 关联的日记 ID 或照片 ID
 * @param {string} data.targetType "diary" 或 "photo"
 * @param {string} data.content 评论内容
 * @param {string} data.author "他" 或 "她"
 * @returns {Promise<object>} 新评论对象
 */
export async function createComment(data) {
  if (!data.content || !data.content.trim()) {
    throw new Error('评论内容不能为空')
  }
  const comment = {
    id: genId(),
    targetId: data.targetId,
    targetType: data.targetType,
    content: data.content.trim(),
    author: data.author === '她' ? '她' : '他',
    createdAt: Date.now(),
  }
  const list = readAll()
  list.push(comment)
  writeAll(list)
  notify()
  return comment
}

/**
 * 暖心回复（PRD 2.4）：对一条评论追加回复，形成多轮对话
 * 多次回复按时间顺序保留在 replies 数组中，不会互相覆盖
 * @param {string} commentId 被回复的评论 id
 * @param {object} data 回复数据
 * @param {string} data.content 回复内容
 * @param {string} data.author 回复者身份 "他" 或 "她"
 * @returns {Promise<object>} 更新后的评论对象
 */
export async function replyComment(commentId, data) {
  if (!data.content || !data.content.trim()) {
    throw new Error('回复内容不能为空')
  }
  const list = readAll()
  const target = list.find((c) => c.id === commentId)
  if (!target) {
    throw new Error('评论不存在或已被删除')
  }
  // 历史数据兼容：旧的单条回复字段（reply）迁移为回复数组首条
  if (!Array.isArray(target.replies)) {
    target.replies = []
    if (target.reply) {
      target.replies.push({
        id: genId(),
        author: target.replyAuthor || '他',
        content: target.reply,
        createdAt: target.replyAt || Date.now(),
      })
    }
  }
  // 追加新的回复：多次回复按时间顺序保留，形成对话
  target.replies.push({
    id: genId(),
    author: data.author === '她' ? '她' : '他',
    content: data.content.trim(),
    createdAt: Date.now(),
  })
  writeAll(list)
  notify()
  return target
}

/**
 * 各分类的未读评论数（PRD 2.4 评论通知：对方评论后，打开网页能看到小红点提示）
 * @param {string} identity 当前登录身份 "他" 或 "她"
 * @returns {Promise<{diary: number, photo: number}>}
 */
export async function getUnreadCount(identity) {
  const state = readState()
  const count = { diary: 0, photo: 0 }
  readAll().forEach((c) => {
    // 只有"对方"的新评论才计为未读，避免自己刚发的评论出现红点
    if (identity && c.author !== identity && c.createdAt > state[c.targetType]) {
      count[c.targetType] = (count[c.targetType] || 0) + 1
    }
  })
  return count
}

/**
 * 标记某分类评论已读（进入对应页面 / 打开评论区时调用）
 * @param {string} targetType "diary" 或 "photo"
 */
export async function markCommentsRead(targetType) {
  const state = readState()
  state[targetType] = Date.now()
  localStorage.setItem(READ_KEY, JSON.stringify(state))
  notify()
}
