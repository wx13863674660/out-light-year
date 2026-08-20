// 互动服务：今日默契题 / 思念按钮 / 恋爱清单（模块五 趣味互动）
//
// 【重要】当前为本地模拟实现（localStorage），接入 Supabase / Firebase 后
// （Phase 5），仅需替换本文件的实现为云端读写，各页面调用方无需改动。
const ANSWER_KEY = 'our-light-years:answers'
const MISSING_KEY = 'our-light-years:missing-you'
const LIST_KEY = 'our-light-years:bucket-list'
const CAPSULE_KEY = 'our-light-years:capsules'
const RAIN_KEY = 'our-light-years:rain-setting'

/** 生成唯一 ID */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ---------- 今日默契题（P1） ----------
// 预置问题库：按日期稳定取题，同一对情侣每天看到同一道题
const QUESTIONS = [
  { id: 'q01', text: 'TA 最喜欢吃的一道菜是什么？' },
  { id: 'q02', text: 'TA 最喜欢的水果是什么？' },
  { id: 'q03', text: 'TA 的生日是几月几号？' },
  { id: 'q04', text: 'TA 最喜欢的颜色是什么？' },
  { id: 'q05', text: 'TA 最想去旅行的地方是哪里？' },
  { id: 'q06', text: 'TA 最近在追的一部剧 / 电影是什么？' },
  { id: 'q07', text: 'TA 是早起型，还是夜猫子？' },
  { id: 'q08', text: 'TA 最喜欢喝什么饮品？' },
  { id: 'q09', text: '你们第一次见面是在哪里？' },
  { id: 'q10', text: 'TA 最擅长的一件事是什么？' },
  { id: 'q11', text: 'TA 最怕什么小动物？' },
  { id: 'q12', text: 'TA 开心的时候会做什么？' },
  { id: 'q13', text: 'TA 最喜欢的季节是哪一个？' },
  { id: 'q14', text: 'TA 的鞋码是多少？' },
  { id: 'q15', text: 'TA 小时候的梦想是什么？' },
  { id: 'q16', text: 'TA 最喜欢的花是什么？' },
  { id: 'q17', text: 'TA 生气的时候，怎么哄最有效？' },
  { id: 'q18', text: 'TA 手机里最多的照片是什么内容？' },
  { id: 'q19', text: 'TA 最喜欢的一句歌词是什么？' },
  { id: 'q20', text: 'TA 一般几点睡觉？' },
  { id: 'q21', text: '你们相识的纪念日是哪一天？' },
  { id: 'q22', text: 'TA 最常夸你的一句话是什么？' },
  { id: 'q23', text: 'TA 最喜欢的小零食是什么？' },
  { id: 'q24', text: 'TA 最近最想买的东西是什么？' },
]

/** 获取今天的默契题（按天数取模，保证一天一题且稳定） */
export async function getDailyQuestion() {
  const dayIndex = Math.floor(Date.now() / 86400000)
  return QUESTIONS[dayIndex % QUESTIONS.length]
}

/** 读取全部默契题答案 */
function readAnswers() {
  try {
    const raw = localStorage.getItem(ANSWER_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** 获取今天这道题的两份答案 */
export async function getDailyAnswers(questionId) {
  const map = readAnswers()
  return map[questionId] || { 他: '', 她: '' }
}

/**
 * 以某个身份提交今天这道题的答案（覆盖式，可随时修改）
 * @param {string} questionId 问题 id
 * @param {string} author "他" 或 "她"
 * @param {string} content 答案内容
 * @returns {Promise<object>} 更新后的双方答案
 */
export async function submitAnswer(questionId, author, content) {
  if (!content || !content.trim()) {
    throw new Error('先写下你的答案吧～')
  }
  const map = readAnswers()
  map[questionId] = {
    ...(map[questionId] || {}),
    [author]: content.trim(),
    updatedAt: Date.now(),
  }
  localStorage.setItem(ANSWER_KEY, JSON.stringify(map))
  return map[questionId]
}

// ---------- 思念按钮（P1） ----------
/** 读取全部"想你了"心意 */
function readMissings() {
  try {
    const raw = localStorage.getItem(MISSING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 写入心意列表 */
function writeMissings(list) {
  localStorage.setItem(MISSING_KEY, JSON.stringify(list))
}

/**
 * 发送"想你了"（以所选身份）
 * @param {string} author 发送者身份 "他" 或 "她"
 */
export async function sendMissingYou(author) {
  const list = readMissings()
  list.push({ id: genId(), author, createdAt: Date.now(), read: false })
  writeMissings(list)
}

/** 获取全部心意（按时间倒序） */
export async function getMissings() {
  return readMissings().sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * 将"发给当前身份"的心意标记为已读（对方打开互动页并看到横幅后调用）
 * @param {string} identity 当前登录身份 "他" 或 "她"（只标记对方发来的）
 */
export async function markMissingsRead(identity) {
  const list = readMissings()
  list.forEach((m) => {
    if (identity && m.author !== identity) m.read = true
  })
  writeMissings(list)
}

// ---------- 恋爱清单（P2） ----------
/** 读取恋爱清单 */
function readList() {
  try {
    const raw = localStorage.getItem(LIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 写入恋爱清单 */
function writeList(list) {
  localStorage.setItem(LIST_KEY, JSON.stringify(list))
}

/**
 * 获取恋爱清单（双方共享可见：一方建立、双方都能看到；未完成在前，按创建时间倒序）
 */
export async function getBucketList() {
  return readList().sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return b.createdAt - a.createdAt
  })
}

/** 添加一项"想一起做的事"（记录创建者身份，供双方查看时标注） */
export async function addBucketItem(text, author) {
  if (!text || !text.trim()) {
    throw new Error('写下一件想一起做的事吧～')
  }
  const list = readList()
  list.push({ id: genId(), text: text.trim(), done: false, author: author || '他', createdAt: Date.now() })
  writeList(list)
  return getBucketList()
}

/**
 * 勾选 / 取消勾选一项（完成后打钩标记）
 * @param {string} id 清单项 id
 * @param {string} identity 当前身份（返回过滤后的列表）
 */
export async function toggleBucketItem(id) {
  const list = readList()
  const item = list.find((i) => i.id === id)
  if (item) {
    item.done = !item.done
    item.doneAt = item.done ? Date.now() : null
  }
  writeList(list)
  return getBucketList()
}

/**
 * 删除一项清单（一方删除后双方都不再看到）
 * @param {string} id 清单项 id
 */
export async function removeBucketItem(id) {
  writeList(readList().filter((i) => i.id !== id))
  return getBucketList()
}

// ---------- 时光胶囊（P2） ----------
/** 今天的日期字符串 YYYY-MM-DD（本地时区） */
function todayStr() {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mm}-${dd}`
}

/** 读取全部时光胶囊 */
function readCapsules() {
  try {
    const raw = localStorage.getItem(CAPSULE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 写入胶囊列表 */
function writeCapsules(list) {
  localStorage.setItem(CAPSULE_KEY, JSON.stringify(list))
}

/**
 * 写一封给未来彼此的信（记录写信者身份）
 * @param {string} text 信的内容
 * @param {string} openAt 解锁日期 YYYY-MM-DD（必须晚于今天）
 * @param {string} author 写信者身份 "他" 或 "她"
 * @returns {Promise<Array>} 更新后的胶囊列表
 */
export async function createCapsule(text, openAt, author) {
  if (!text || !text.trim()) {
    throw new Error('先写下想对未来的TA说的话吧～')
  }
  if (!openAt) {
    throw new Error('选一个解锁日期吧～')
  }
  if (openAt <= todayStr()) {
    throw new Error('解锁日期要选未来某一天哦～')
  }
  const list = readCapsules()
  list.push({
    id: genId(),
    text: text.trim(),
    openAt,
    author: author || '他',
    createdAt: Date.now(),
    opened: false, // 是否已被查看过（仅到期后可查看）
  })
  writeCapsules(list)
  return getCapsules()
}

/**
 * 获取时光胶囊（双方共享可见：一方封存、双方都能看到；按解锁日升序）
 */
export async function getCapsules() {
  return readCapsules().sort((a, b) => a.openAt.localeCompare(b.openAt))
}

/**
 * 判断胶囊是否仍在锁定（未到解锁日）
 * @param {{openAt: string}} c 胶囊对象
 * @returns {boolean} true 表示尚未到期
 */
export function isCapsuleLocked(c) {
  return c.openAt > todayStr()
}

/**
 * 距离解锁还有多少天
 * @param {{openAt: string}} c 胶囊对象
 * @returns {number} 剩余天数（当天到期返回 0）
 */
export function capsuleDaysLeft(c) {
  const [y, m, d] = c.openAt.split('-').map(Number)
  const open = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(Math.round((open - today) / 86400000), 0)
}

/**
 * 将一颗已到期的胶囊标记为"已查看"
 * @param {string} id 胶囊 id
 * @param {string} identity 当前身份（返回过滤后的列表）
 */
export async function readCapsule(id) {
  const list = readCapsules()
  const c = list.find((i) => i.id === id)
  if (c && !isCapsuleLocked(c)) {
    c.opened = true
  }
  writeCapsules(list)
  return getCapsules()
}

// ---------- 爱心雨（P2） ----------
/** 读取"每次进入互动页自动飘爱心雨"开关（默认开启） */
export async function getRainSetting() {
  try {
    const raw = localStorage.getItem(RAIN_KEY)
    return raw ? JSON.parse(raw) : true
  } catch {
    return true
  }
}

/** 保存爱心雨开关 */
export async function setRainSetting(on) {
  localStorage.setItem(RAIN_KEY, JSON.stringify(Boolean(on)))
}
