// 图片工具：压缩图片（PRD 8.1 上传时自动压缩，保证本地存储体积与加载速度）

/**
 * 将图片文件压缩为 JPEG DataURL（canvas 缩放）
 * @param {File} file 原始图片文件
 * @param {object} [options]
 * @param {number} [options.maxWidth=1400] 最长边限制（像素）
 * @param {number} [options.quality=0.75] JPEG 质量 0~1
 * @returns {Promise<string>} 压缩后的 base64 DataURL
 */
export function compressImage(file, { maxWidth = 1400, quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('图片解析失败'))
      img.onload = () => {
        // 等比缩放：只缩小不放大，避免大图超出最长边限制
        const scale = Math.min(1, maxWidth / img.width, maxWidth / img.height)
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        // 统一输出为 JPEG：体积小、兼容性好（透明 PNG 会以白底填充）
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
