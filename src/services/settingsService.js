// 设置服务：统一读写"空间设置"（密码、在一起的日子等）
//
// 【重要】当前为 Phase 1 的本地模拟实现（localStorage），
// 接入 Supabase / Firebase 后（Phase 5），仅需将本文件内的
// getSettings / saveSettings 实现替换为云端读写（见 PRD 5.4 设置表），
// 各页面调用方无需任何改动。
import { appConfig } from '../config/appConfig'

const STORAGE_KEY = 'our-light-years:settings'

/** 默认设置：与 .env 中的环境变量保持一致 */
const defaultSettings = {
  password: appConfig.defaultPassword,
  startDate: appConfig.startDate,
}

/**
 * 读取空间设置（与默认值合并，避免缺字段）
 * @returns {Promise<{password: string, startDate: string}>}
 */
export async function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return { ...defaultSettings, ...(raw ? JSON.parse(raw) : {}) }
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
