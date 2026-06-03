import router, { ensureNotFoundRouteLast, markDynamicRouteName } from '@/router/index'
import { usePermissionStore } from '@/store/modules/permission'
import { useUserStore } from '@/store/modules/user'

const whiteList = ['/login']

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  // 白名单必须先放行登录页：否则未登录跳 /login 时会再次进入守卫并形成循环跳转。
  if (whiteList.includes(to.path)) {
    if (to.path === '/login' && userStore.token) {
      next('/')
      return
    }
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

    if (!permissionStore.isRoutesReady) {
      // 动态路由必须在确认身份后再生成：token 只证明“可能登录过”，
      // /auth/userInfo 与 /auth/routers 都成功后，前端 matcher 才能代表当前账号的真实菜单权限。
      try {
        const routes = await permissionStore.generateRoutes()
        routes.forEach((route) => {
          router.addRoute(route)
          markDynamicRouteName(route.name)
        })
        ensureNotFoundRouteLast()
        // 首次深链进入时，to 可能已经被 catch-all 解析成 NotFound；
        // 这里只保留地址信息重新匹配，避免把旧的 name/matched 一起带回去继续命中 404。
        next({ path: to.path, query: to.query, hash: to.hash, replace: true })
      } catch {
        userStore.logout()
        next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
      }
      return
    }

    next()
    return
  }

  next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
})
