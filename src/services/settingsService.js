// 设置服务：统一读写"空间设置"（密码、相识的日子、纪念日、空间头像等）
//
// 【重要】当前为 Phase 1 的本地模拟实现（localStorage），
// 接入 Supabase / Firebase 后（Phase 5），仅需将本文件内的
// getSettings / saveSettings 实现替换为云端读写（见 PRD 5.4 设置表），
// 各页面调用方无需任何改动。
import { appConfig } from '../config/appConfig'

const STORAGE_KEY = 'our-light-years:settings'

/** 生成唯一 ID */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 默认设置：与 .env 中的环境变量保持一致 */
const defaultSettings = {
  password: appConfig.defaultPassword,
  startDate: appConfig.startDate,
  // 空间头像（情侣头像或合影，base64 压缩图，空字符串表示未设置）
  avatar: '',
  // 纪念日列表：[{ id, name, date }]，date 格式 YYYY-MM-DD
  anniversaryDates: [],
}

/**
 * 读取空间设置（与默认值合并，避免缺字段）
 * @returns {Promise<object>} 完整设置对象
 */
export async function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const saved = raw ? JSON.parse(raw) : {}
    return { ...defaultSettings, ...saved }
  } catch {
    // 本地数据损坏时回退到默认设置，保证应用可用
    return { ...defaultSettings }
  }
}

/**
 * 保存空间设置
 * @param {object} settings 要保存的设置对象
 */
export async function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

/**
 * 校验密码是否正确（修改密码前验证旧密码）
 * @param {string} pwd 待校验的密码
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(pwd) {
  const settings = await getSettings()
  return pwd === settings.password
}

/**
 * 修改空间密码（更换进入空间的暗号，PRD 2.6）
 * @param {string} oldPwd 旧密码（需与当前密码一致）
 * @param {string} newPwd 新密码
 */
export async function updatePassword(oldPwd, newPwd) {
  const settings = await getSettings()
  if (oldPwd !== settings.password) {
    throw new Error('旧密码不正确，请再想想～')
  }
  await saveSettings({ ...settings, password: newPwd })
}

/**
 * 获取纪念日列表
 * @returns {Promise<Array<{id: string, name: string, date: string}>>}
 */
export async function getAnniversaryDates() {
  const settings = await getSettings()
  return settings.anniversaryDates || []
}

/**
 * 添加纪念日（PRD 2.6：在一起、生日等重要日子，首页倒计时展示）
 * @param {object} data 纪念日数据
 * @param {string} data.name 纪念日名称（如"在一起"）
 * @param {string} data.date 日期 YYYY-MM-DD
 * @returns {Promise<Array>} 更新后的纪念日列表
 */
export async function addAnniversaryDate({ name, date }) {
  if (!name || !name.trim()) {
    throw new Error('请给这个日子起个名字')
  }
  if (!date) {
    throw new Error('请选择日期')
  }
  const settings = await getSettings()
  const list = settings.anniversaryDates || []
  list.push({ id: genId(), name: name.trim(), date })
  await saveSettings({ ...settings, anniversaryDates: list })
  return list
}

/**
 * 删除纪念日
 * @param {string} id 纪念日 id
 * @returns {Promise<Array>} 更新后的纪念日列表
 */
export async function removeAnniversaryDate(id) {
  const settings = await getSettings()
  const list = (settings.anniversaryDates || []).filter((a) => a.id !== id)
  await saveSettings({ ...settings, anniversaryDates: list })
  return list
}

/**
 * 更换空间头像（PRD 2.6：上传情侣头像或合影作为空间标识）
 * @param {string} dataUrl 压缩后的 base64 图片
 */
export async function updateAvatar(dataUrl) {
  const settings = await getSettings()
  await saveSettings({ ...settings, avatar: dataUrl })
}

/** 移除空间头像，恢复默认爱心标识 */
export async function removeAvatar() {
  const settings = await getSettings()
  await saveSettings({ ...settings, avatar: '' })
}
