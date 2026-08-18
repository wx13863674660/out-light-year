// 应用全局配置：集中读取环境变量，代码中禁止直接写死敏感信息
export const appConfig = {
  // 默认进入密码（接入后端后，改为服务端 bcrypt 哈希校验，见 PRD 8.2 安全）
  defaultPassword: import.meta.env.VITE_APP_DEFAULT_PASSWORD || '1314',
  // 在一起的日子（恋爱计时器起点）
  startDate: import.meta.env.VITE_APP_START_DATE || '2024-02-14',
  // 背景音乐地址（为空则隐藏顶部音乐开关）
  musicUrl: import.meta.env.VITE_APP_MUSIC_URL || '',
}
