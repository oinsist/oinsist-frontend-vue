export interface SysTenantVo {
  tenantId: string
  tenantName: string
  contact?: string
  status: '0' | '1'
  createTime: string
}

export interface SysTenantAddDto {
  tenantName: string
  contact?: string
  status: '0' | '1'
}

export interface SysTenantEditDto {
  tenantId: string
  tenantName: string
  contact?: string
  status: '0' | '1'
}
