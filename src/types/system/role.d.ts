export interface SysRoleVo {
  roleId: string
  roleName: string
  roleKey: string
  status: '0' | '1'
  createTime: string
}

export interface SysRoleAddDto {
  roleName: string
  roleKey: string
  status: '0' | '1'
}

export interface SysRoleEditDto {
  roleId: string
  roleName: string
  roleKey: string
  status: '0' | '1'
}
