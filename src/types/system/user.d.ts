export interface SysUserVo {
  userId: string
  username: string
  nickname: string
  status: '0' | '1'
  createTime: string
}

export interface SysUserAddDto {
  username: string
  nickname: string
  password: string
  status: '0' | '1'
}

export interface SysUserEditDto {
  userId: string
  nickname: string
  status: '0' | '1'
}
