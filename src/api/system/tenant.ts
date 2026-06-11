import request from '@/utils/request'
import type { PageQuery, PageResult } from '@/types/common'
import type { SysTenantAddDto, SysTenantEditDto, SysTenantVo } from '@/types/system/tenant'

export const listTenant = (params: PageQuery) => {
  return request<PageResult<SysTenantVo>>({
    url: '/system/tenant/list',
    method: 'get',
    params,
  })
}

export const addTenant = (data: SysTenantAddDto) => {
  return request<void>({
    url: '/system/tenant',
    method: 'post',
    data,
  })
}

export const updateTenant = (data: SysTenantEditDto) => {
  return request<void>({
    url: '/system/tenant',
    method: 'put',
    data,
  })
}

export const deleteTenant = (tenantId: string) => {
  return request<void>({
    // 雪花 ID 在前端保持字符串透传，避免 Number 精度丢失。
    url: `/system/tenant/${tenantId}`,
    method: 'delete',
  })
}
