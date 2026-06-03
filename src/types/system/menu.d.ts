export type SysMenuType = 'M' | 'C' | 'F'
export type SysMenuVisible = '0' | '1'
export type SysMenuStatus = '0' | '1'

export interface SysMenuVo {
  menuId: string
  menuName: string
  parentId: string
  orderNum?: number
  path?: string
  component?: string
  perms?: string
  menuType: SysMenuType
  visible?: SysMenuVisible
  status?: SysMenuStatus
  icon?: string
  children?: SysMenuVo[] | null
}

export interface SysMenuAddDto {
  menuName: string
  parentId?: string
  orderNum?: number
  path?: string
  component?: string
  perms?: string
  menuType: SysMenuType
  visible?: SysMenuVisible
  status?: SysMenuStatus
  icon?: string
}

export interface SysMenuEditDto extends SysMenuAddDto {
  menuId: string
}
