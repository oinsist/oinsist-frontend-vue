import { defineStore } from 'pinia'
import { ref } from 'vue'

// 用户态最小占位：仅承担 token 的内存态 + localStorage 持久化
// 角色 / 权限 / 用户信息等字段不在 P02 范围，统一在 P03+ 接入
export const useUserStore = defineStore('user', () => {
  // 从本地存储恢复 token，保证刷新页面仍可保持登录态
  const token = ref<string>(localStorage.getItem('Token') ?? '')

  // 写 token：内存与本地存储保持同步，避免拦截器与持久层失配
  const setToken = (t: string) => {
    token.value = t
    localStorage.setItem('Token', t)
  }

  // 注销：只清状态，路由跳转 / API 调用由调用方负责，避免与拦截器形成隐式耦合
  const logout = () => {
    token.value = ''
    localStorage.removeItem('Token')
  }

  return { token, setToken, logout }
})
