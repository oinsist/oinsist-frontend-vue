import request from '@/utils/request'
import type { SysMenuAddDto, SysMenuEditDto, SysMenuVo } from '@/types/system/menu'

export const listMenu = () => {
  return request<SysMenuVo[]>({
    url: '/system/menu/list',
    method: 'get',
  })
}

export const getMenu = (menuId: string) => {
  return request<SysMenuVo>({
    // menuId 是雪花字符串，前端只负责原样拼接路径，避免 JS number 精度丢失。
    url: `/system/menu/${menuId}`,
    method: 'get',
  })
}

export const addMenu = (data: SysMenuAddDto) => {
  return request<void>({
    url: '/system/menu',
    method: 'post',
    data,
  })
}

export const updateMenu = (data: SysMenuEditDto) => {
  return request<void>({
    url: '/system/menu',
    method: 'put',
    data,
  })
}

export const deleteMenu = (menuId: string) => {
  return request<void>({
    // 删除同样保持 menuId 原样透传，是否允许删除含子菜单节点由后端统一判定。
    url: `/system/menu/${menuId}`,
    method: 'delete',
  })
}
