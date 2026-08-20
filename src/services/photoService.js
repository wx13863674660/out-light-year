// 相册服务：照片的上传 / 查询 / 删除（数据模型遵循 PRD 5.1 照片表）
//
// 【重要】当前为 Phase 2 的本地模拟实现（localStorage + base64），
// 接入 Supabase / Firebase 后（Phase 5），仅需替换本文件的实现为云端
// 读写（含私有桶 + 签名 URL），各页面调用方无需任何改动。
import { compressImage } from '../utils/image'

const STORAGE_KEY = 'our-light-years:photos'

/** 生成唯一 ID */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 读取本地全部照片 */
function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** 写入本地照片列表；存储配额不足时抛出可读错误 */
function writeAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    throw new Error('本地存储空间不足，请删除一些照片后再试（接入云端存储后此限制将解除）')
  }
}

/**
 * 获取全部照片（双方共享可见：一方上传、双方都能看到；按上传时间倒序）
 * @returns {Promise<Array>} 照片列表
 */
export async function getPhotos() {
  return readAll().sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * 上传照片
 * @param {File|string} source 原始图片文件，或已压缩好的 dataURL 字符串
 * @param {object} [metadata] 照片元数据（PRD 5.1）
 * @param {string} [metadata.title] 标题
 * @param {string} [metadata.description] 描述
 * @param {string} [metadata.category] 分类（travel/daily/festival/other）
 * @param {string} [uploader] 上传者身份 "他" 或 "她"（登录时选择，默认"他"）
 * @returns {Promise<object>} 新照片对象
 */
export async function uploadPhoto(source, metadata = {}, uploader) {
  // 若传入的是文件则先压缩；已压缩的 dataURL 直接使用
  const dataUrl =
    typeof source === 'string' ? source : await compressImage(source)

  const photo = {
    id: genId(),
    imageUrl: dataUrl,
    // 本地模拟：缩略图与原图相同；云端接入后可生成独立缩略图（PRD 5.1）
    thumbnailUrl: dataUrl,
    title: metadata.title || '',
    description: metadata.description || '',
    category: metadata.category || 'other',
    createdAt: Date.now(),
    // 记录上传者身份（登录时选择），双方共享可见，展示时标注上传者
    uploader: uploader || '他',
  }
  const list = readAll()
  list.push(photo)
  writeAll(list)
  return photo
}

/**
 * 删除指定照片（PRD 权限：仅上传者可操作，本地模拟下即为本设备）
 * @param {string} id 照片 ID
 */
export async function deletePhoto(id) {
  const list = readAll().filter((p) => p.id !== id)
  writeAll(list)
}

/**
 * 更新照片信息（标题 / 描述 / 分类）
 * @param {string} id 照片 ID
 * @param {object} patch 要更新的字段
 * @returns {Promise<object>} 更新后的照片对象
 */
export async function updatePhoto(id, patch) {
  const list = readAll()
  const idx = list.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error('照片不存在或已被删除')
  list[idx] = { ...list[idx], ...patch }
  writeAll(list)
  return list[idx]
}
