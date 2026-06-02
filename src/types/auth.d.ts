export interface LoginBody {
  username: string
  password: string
  tenantId: number
}

export interface LoginVo {
  tokenName: string
  tokenValue: string
}

export interface UserInfoVo {
  userId: number
  username: string
  nickname: string
  roles: string[]
  permissions: string[]
}
