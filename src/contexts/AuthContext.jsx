// 认证上下文：管理"是否已解锁"与"当前身份（他/她）"的全局状态
// 解锁状态写入 sessionStorage：关闭标签页后需重新输入密码，符合私密空间定位
// 身份写入 localStorage：登录时选择并持久化，后续进入按身份区分视角
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const UNLOCKED_KEY = 'our-light-years:unlocked'
const IDENTITY_KEY = 'our-light-years:identity'

export function AuthProvider({ children }) {
  // 初始值：本次会话已解锁过则保持解锁状态（刷新页面不被打断）
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(UNLOCKED_KEY) === 'true'
  )
  // 当前登录身份："他"（男生）或 "她"（女生）
  const [identity, setIdentity] = useState(
    () => localStorage.getItem(IDENTITY_KEY) || ''
  )

  /**
   * 解锁：密码验证通过后调用，记录本次选择的身份
   * @param {string} id 登录身份 "他" 或 "她"
   */
  const unlock = (id) => {
    sessionStorage.setItem(UNLOCKED_KEY, 'true')
    if (id) {
      localStorage.setItem(IDENTITY_KEY, id)
      setIdentity(id)
    }
    setUnlocked(true)
  }

  /** 切换身份：更新持久化的身份并刷新视角 */
  const switchIdentity = (id) => {
    localStorage.setItem(IDENTITY_KEY, id)
    setIdentity(id)
  }

  /** 退出登录：清除本次会话的解锁状态，回到密码锁 */
  const logout = () => {
    sessionStorage.removeItem(UNLOCKED_KEY)
    setUnlocked(false)
  }

  return (
    <AuthContext.Provider value={{ unlocked, identity, unlock, switchIdentity, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** 读取解锁状态、当前身份与相关方法 */
export function useAuth() {
  return useContext(AuthContext)
}
