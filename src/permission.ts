import router from '@/router/index'
import { useUserStore } from '@/store/modules/user'

const whiteList = ['/login']

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  // 白名单必须先放行登录页：否则未登录跳 /login 时会再次进入守卫并形成循环跳转。
  if (whiteList.includes(to.path)) {
    next()
    return
  }

  if (userStore.token) {
    if (!userStore.userInfo) {
      try {
        // token 只代表本地曾经登录过，真正可用性必须由后端 /auth/userInfo 复核；
        // 复核成功后写入 roles / permissions，后续 P04 菜单和按钮权限才能共享同一份身份态。
        await userStore.getInfo()
      } catch {
        // getInfo 失败通常意味着 token 过期或服务端会话不存在，先清本地 token 再回登录页，避免守卫反复请求。
        userStore.logout()
        next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
        return
      }
    }
    next()
    return
  }

  next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
})
