import request from '@/utils/request'
import type { PageQuery, PageResult } from '@/types/common'
import type { SysUserAddDto, SysUserEditDto, SysUserVo } from '@/types/system/user'

export const listUser = (params: PageQuery) => {
  return request<PageResult<SysUserVo>>({
    url: '/system/user/list',
    method: 'get',
    params,
  })
}

export const getUser = (userId: string) => {
  return request<SysUserVo>({
    // userId 可能是数字小 ID 或雪花字符串，前端只做路径透传，避免精度转换风险。
    url: `/system/user/${userId}`,
    method: 'get',
  })
}

export const addUser = (data: SysUserAddDto) => {
  return request<void>({
    url: '/system/user',
    method: 'post',
    data,
  })
}

export const updateUser = (data: SysUserEditDto) => {
  return request<void>({
    url: '/system/user',
    method: 'put',
    data,
  })
}

export const deleteUser = (userId: string) => {
  return request<void>({
    // 删除同样保持 userId 原样透传，由后端按真实 ID 类型完成匹配。
    url: `/system/user/${userId}`,
    method: 'delete',
  })
}

export const getUserRoleIds = (userId: string) => {
  return request<string[]>({
    // 角色预勾选依赖后端返回当前全量角色 ID，前端后续统一 String() 归一化匹配。
    url: `/system/user/${userId}/roleIds`,
    method: 'get',
  })
}

export const assignUserRoles = (userId: string, roleIds: string[]) => {
  return request<void>({
    // assignRole 是覆盖语义，提交的 roleIds 即该用户最终角色集合。
    url: `/system/user/${userId}/assignRole`,
    method: 'put',
    data: roleIds,
  })
}
