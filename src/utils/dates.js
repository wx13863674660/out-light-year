// 日期工具：恋爱天数计算、每日问候语

/**
 * 计算"在一起的第 N 天"
 * @param {string} startDateStr 在一起的日期，格式 YYYY-MM-DD
 * @returns {number} 第 N 天（在一起的当天记为第 1 天）
 */
export function getLoveDays(startDateStr) {
  const start = new Date(`${startDateStr}T00:00:00`)
  const now = new Date()
  // 以本地"当天零点"为基准，避免跨时区导致的天数偏差
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const diffMs = today - startDay
  return Math.max(Math.floor(diffMs / 86400000) + 1, 1)
}

/**
 * 根据当前时间段返回每日问候语
 * @returns {{text: string, hint: string}} text 为问候语，hint 为补充文案
 */
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) {
    return { text: '早安', hint: '新的一天，也要元气满满地想你' }
  }
  if (hour >= 11 && hour < 18) {
    return { text: '午安', hint: '记得按时吃饭，我在想你' }
  }
  return { text: '晚安', hint: '好梦，我的宝贝' }
}

/** 今日日期文案，如 "8月18日 周二" */
export function getTodayText() {
  const now = new Date()
  const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${now.getMonth() + 1}月${now.getDate()}日 ${weeks[now.getDay()]}`
}

/**
 * 格式化时间戳为日期文案，如 "2026年8月14日"
 * @param {number|string|Date} ts 时间戳或可解析的日期
 */
export function formatDate(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/**
 * 格式化 YYYY-MM-DD 日期字符串为中文文案，如 "2026年8月20日"
 * @param {string} ymd 形如 2026-08-20 的日期字符串
 */
export function formatYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

/**
 * 相对时间文案（用于评论等）：刚刚 / N 分钟前 / N 小时前 / 昨天 / N 天前 / 日期
 * @param {number|string|Date} ts 时间戳或可解析的日期
 */
export function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 2) return '昨天'
  if (day < 30) return `${day} 天前`
  return formatDate(ts)
}
