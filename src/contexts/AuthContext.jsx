// 认证上下文：管理"是否已解锁"的全局状态
// 解锁状态写入 sessionStorage：关闭标签页后需重新输入密码，符合私密空间定位
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const UNLOCKED_KEY = 'our-light-years:unlocked'

export function AuthProvider({ children }) {
  // 初始值：本次会话已解锁过则保持解锁状态（刷新页面不被打断）
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(UNLOCKED_KEY) === 'true'
  )

  /** 解锁：密码验证通过后调用 */
  const unlock = () => {
    sessionStorage.setItem(UNLOCKED_KEY, 'true')
    setUnlocked(true)
  }

  return (
    <AuthContext.Provider value={{ unlocked, unlock }}>
      {children}
    </AuthContext.Provider>
  )
}

/** 读取解锁状态与解锁方法 */
export function useAuth() {
  return useContext(AuthContext)
}
