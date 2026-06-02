import { createRouter, createWebHistory, type RouteRecordName, type RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
  },
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/index/index.vue'),
        meta: {
          title: '首页',
        },
      },
    ],
  },
]

const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/error/404.vue'),
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const dynamicRouteNames = new Set<NonNullable<RouteRecordName>>()

export const markDynamicRouteName = (name: RouteRecordName | null | undefined) => {
  if (typeof name === 'string' || typeof name === 'symbol') {
    dynamicRouteNames.add(name)
  }
}

export const resetRouter = () => {
  // vue-router4 的 addRoute 会把动态记录挂到同一个 matcher 中；
  // 换账号时只移除本轮登记过的动态 name，保留 /login、/、404 等常量路由，避免权限路由跨账号残留。
  dynamicRouteNames.forEach((name) => {
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  })
  dynamicRouteNames.clear()
}

export const ensureNotFoundRouteLast = () => {
  // 404 是兜底常量路由，但动态路由来自登录后的后端权限树；
  // 每次动态 addRoute 后把 catch-all 重新追加到最后，避免首次深链被旧 matcher 中的 404 提前吞掉。
  if (router.hasRoute('NotFound')) {
    router.removeRoute('NotFound')
  }
  router.addRoute(notFoundRoute)
}

ensureNotFoundRouteLast()

export default router
