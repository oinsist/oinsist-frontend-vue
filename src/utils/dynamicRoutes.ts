import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'
import type { RouterVo } from '@/types/router'

type ViewModule = {
  default: Component
}

type DynamicRouteRecordRaw = RouteRecordRaw & {
  hidden?: boolean
  children?: DynamicRouteRecordRaw[]
}

const views = import.meta.glob<ViewModule>('/src/views/**/*.vue')
const notFoundView = () => import('@/views/error/404.vue')

const joinRoutePath = (parentPath: string, childPath: string) => {
  const parent = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath
  const child = childPath.startsWith('/') ? childPath.slice(1) : childPath
  return `${parent}/${child}`
}

const resolveComponent = (component: string) => {
  if (component === 'Layout') {
    return Layout
  }

  const viewPath = `/src/views/${component}.vue`
  const view = views[viewPath]
  if (!view) {
    // 动态路由由后端下发，前端不能因为单个 component 配置缺失而中断整棵菜单树；
    // 降级到 404 可以保住其它可用路由，同时 warn 暴露具体缺失项供联调修正。
    console.warn(`[dynamicRoutes] missing view component: ${component}`)
    return notFoundView
  }
  return view
}

const transformRoute = (route: RouterVo, isRoot = false): DynamicRouteRecordRaw => {
  const children = (route.children ?? []).map((child) => transformRoute(child))
  const record = {
    path: route.path,
    name: route.name,
    component: resolveComponent(route.component),
    meta: {
      title: route.meta.title,
      icon: route.meta.icon,
    },
    hidden: route.hidden,
    ...(children.length > 0 ? { children } : {}),
    ...(isRoot && children.length > 0 && route.component === 'Layout'
      ? { redirect: joinRoutePath(route.path, children[0].path) }
      : {}),
  } as DynamicRouteRecordRaw

  return record
}

export const transformDynamicRoutes = (routes: RouterVo[]): RouteRecordRaw[] => {
  return routes.map((route) => transformRoute(route, true))
}
