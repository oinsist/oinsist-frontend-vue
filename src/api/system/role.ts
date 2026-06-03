import request from '@/utils/request'
import type { PageQuery, PageResult } from '@/types/common'
import type { SysRoleAddDto, SysRoleEditDto, SysRoleVo } from '@/types/system/role'

export const listRole = (params: PageQuery) => {
  return request<PageResult<SysRoleVo>>({
    url: '/system/role/list',
    method: 'get',
    params,
  })
}

export const getRole = (roleId: string) => {
  return request<SysRoleVo>({
    // roleId 可能是数字小 ID 或雪花字符串，前端只做路径透传，避免精度转换风险。
    url: `/system/role/${roleId}`,
    method: 'get',
  })
}

export const addRole = (data: SysRoleAddDto) => {
  return request<void>({
    url: '/system/role',
    method: 'post',
    data,
  })
}

export const updateRole = (data: SysRoleEditDto) => {
  return request<void>({
    url: '/system/role',
    method: 'put',
    data,
  })
}

export const deleteRole = (roleId: string) => {
  return request<void>({
    // 删除同样保持 roleId 原样透传，由后端按真实 ID 类型完成匹配。
    url: `/system/role/${roleId}`,
    method: 'delete',
  })
}

export const getRoleMenuIds = (roleId: string) => {
  return request<string[]>({
    // 菜单 ID 可能由后端 Long 序列化为 number 或 string，业务侧统一 String() 后再用于树组件匹配。
    url: `/system/role/${roleId}/menuIds`,
    method: 'get',
  })
}

export const assignRoleMenus = (roleId: string, menuIds: string[]) => {
  return request<void>({
    // assignMenu 是覆盖语义，调用前必须完成预勾选加载，避免空数组误清空角色菜单。
    url: `/system/role/${roleId}/assignMenu`,
    method: 'put',
    data: menuIds,
  })
}
