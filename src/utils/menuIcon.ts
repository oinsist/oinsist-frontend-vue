import type { Component } from 'vue'
import {
  Document,
  Grid,
  Menu as MenuIcon,
  OfficeBuilding,
  Promotion,
  Setting,
  User,
  UserFilled,
} from '@element-plus/icons-vue'

const iconMap: Record<string, Component> = {
  system: Setting,
  user: User,
  peoples: UserFilled,
  tenant: OfficeBuilding,
  'tree-table': Grid,
  form: Document,
  logininfor: Promotion,
}

export const resolveMenuIcon = (name?: string): Component => {
  if (!name) return MenuIcon

  const icon = iconMap[name]
  if (!icon) {
    // 菜单 icon 名由后端配置下发，前端只能覆盖当前已知枚举；
    // 未命中时兜底到通用 Menu 图标，避免一个历史 icon 配置导致整棵侧栏渲染失败。
    console.warn(`[menuIcon] missing icon mapping: ${name}`)
    return MenuIcon
  }
  return icon
}
