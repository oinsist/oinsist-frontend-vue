export interface LoginBody {
  username: string
  password: string
  tenantId: string
}

export interface LoginVo {
  tokenName: string
  tokenValue: string
}

export interface UserInfoVo {
  userId: string
  username: string
  nickname: string
  roles: string[]
  permissions: string[]
}

export interface TenantOptionVo {
  tenantId: string
  tenantName: string
}
