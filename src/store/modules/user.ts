import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserInfo, login, logout as logoutApi } from '@/api/auth'
import type { LoginBody, UserInfoVo } from '@/types/auth'

// 用户态是登录闭环的前端单一事实源：
// 1) token 负责让 request 拦截器能统一注入 Authorization，业务页面不需要关心协议头；
// 2) userInfo / roles / permissions 负责让路由守卫和后续按钮权限基于同一份后端身份态判断；
// 3) token 持久化而用户详情不持久化，刷新后通过 /auth/userInfo 重新校验，避免本地缓存权限过期仍被信任。
export const useUserStore = defineStore('user', () => {
  // 从本地存储恢复 token，保证刷新页面仍可保持登录态
  const token = ref<string>(localStorage.getItem('Token') ?? '')
  const userInfo = ref<UserInfoVo | null>(null)
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  // 写 token：内存与本地存储保持同步，避免拦截器与持久层失配
  const setToken = (t: string) => {
    token.value = t
    localStorage.setItem('Token', t)
  }

  const loginAction = async (data: LoginBody) => {
    const res = await login(data)
    setToken(res.tokenValue)
    return res
  }

  const getInfo = async () => {
    const res = await getUserInfo()
    userInfo.value = res
    roles.value = res.roles
    permissions.value = res.permissions
    return res
  }

  // 清本地态是所有退出路径的最终兜底：无论主动退出、401 还是 getInfo 失败，都必须回到未登录状态。
  const logout = () => {
    token.value = ''
    userInfo.value = null
    roles.value = []
    permissions.value = []
    localStorage.removeItem('Token')
  }

  const logoutAction = async () => {
    try {
      await logoutApi()
    } catch {
      // 退出必须幂等：后端会话已失效、网络异常或重复点击退出时，前端都应清掉本地态并回到登录页。
    } finally {
      logout()
    }
  }

  return {
    token,
    userInfo,
    roles,
    permissions,
    setToken,
    login: loginAction,
    getInfo,
    logout,
    logoutAction,
  }
})
