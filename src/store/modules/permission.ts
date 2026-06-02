import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { getRouters } from '@/api/menu'
import type { RouterVo } from '@/types/router'
import { transformDynamicRoutes } from '@/utils/dynamicRoutes'

export const usePermissionStore = defineStore('permission', () => {
  // 路由记录里包含 Vue 组件对象，必须用 shallowRef 只追踪数组引用；
  // 如果深层响应式化组件对象，运行时会产生性能警告，也会干扰路由 matcher 对组件的原样使用。
  const dynamicRoutes = shallowRef<RouteRecordRaw[]>([])
  const menuTree = ref<RouterVo[]>([])
  const isRoutesReady = ref(false)

  const generateRoutes = async () => {
    if (isRoutesReady.value) {
      return dynamicRoutes.value
    }

    // 后端是权限闭环的唯一事实源：前端只消费 /auth/routers 返回的 M/C 树，
    // 再转换为 vue-router 可识别的 RouteRecordRaw，避免把菜单权限硬编码在前端导致换账号残留。
    const routers = await getRouters()
    menuTree.value = routers
    dynamicRoutes.value = transformDynamicRoutes(routers)
    isRoutesReady.value = true
    return dynamicRoutes.value
  }

  const resetRoutes = () => {
    // 退出或切账号时必须同步清掉菜单树与 ready 标记；
    // 否则守卫会误判动态路由仍可用，造成上一个账号的路由权限继续留在内存中。
    dynamicRoutes.value = []
    menuTree.value = []
    isRoutesReady.value = false
  }

  return {
    dynamicRoutes,
    menuTree,
    isRoutesReady,
    generateRoutes,
    resetRoutes,
  }
})
