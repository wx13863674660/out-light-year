// 日记服务：日记的创建 / 查询 / 更新 / 删除（数据模型遵循 PRD 5.2 日记表）
//
// 【重要】当前为 Phase 3 的本地模拟实现（localStorage + base64），
// 接入 Supabase / Firebase 后（Phase 5），仅需替换本文件的实现为云端
// 读写（含签名 URL），各页面调用方无需任何改动。
const STORAGE_KEY = 'our-light-years:diaries'

/** 生成唯一 ID */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 读取本地全部日记 */
function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 写入本地日记列表；存储配额不足时抛出可读错误 */
function writeAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    throw new Error('本地存储空间不足，请删除一些内容后再试（接入云端存储后此限制将解除）')
  }
}

/**
 * 获取全部日记（双方共享可见：一方记录、双方都能看到；按创建时间倒序）
 * @returns {Promise<Array>} 日记列表
 */
export async function getDiaries() {
  return readAll().sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * 获取单篇日记详情
 * @param {string} id 日记 ID
 * @returns {Promise<object|null>} 日记对象，不存在返回 null
 */
export async function getDiary(id) {
  return readAll().find((d) => d.id === id) || null
}

/**
 * 创建一篇新日记
 * @param {object} data 日记数据（PRD 5.2）
 * @param {string} data.title 标题
 * @param {string} data.content 正文内容（必填）
 * @param {string[]} [data.images] 配图 DataURL 列表
 * @param {number} [data.createdAt] 创建日期时间戳（默认当前时间，可手动修改）
 * @param {string} [author] 创建者身份 "他" 或 "她"（登录时选择，默认"他"）
 * @returns {Promise<object>} 新日记对象
 */
export async function createDiary(data, author) {
  const now = Date.now()
  const diary = {
    id: genId(),
    title: data.title || '',
    content: data.content || '',
    images: data.images || [],
    createdAt: data.createdAt || now,
    updatedAt: now,
    // 记录创建者身份（登录时选择），双方共享可见，展示时标注作者
    author: author || '他',
  }
  const list = readAll()
  list.push(diary)
  writeAll(list)
  return diary
}

/**
 * 更新日记（标题 / 正文 / 配图 / 日期）
 * @param {string} id 日记 ID
 * @param {object} patch 要更新的字段
 * @returns {Promise<object>} 更新后的日记对象
 */
export async function updateDiary(id, patch) {
  const list = readAll()
  const idx = list.findIndex((d) => d.id === id)
  if (idx === -1) throw new Error('日记不存在或已被删除')
  list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() }
  writeAll(list)
  return list[idx]
}

/**
 * 删除指定日记（PRD 权限：仅创作者可操作，本地模拟下即为本设备）
 * @param {string} id 日记 ID
 */
export async function deleteDiary(id) {
  const list = readAll().filter((d) => d.id !== id)
  writeAll(list)
}
