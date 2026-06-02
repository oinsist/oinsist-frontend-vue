import type { Directive } from 'vue'
import { useUserStore } from '@/store/modules/user'

const ALL_PERMISSION = '*:*:*'

const removeElement = (el: HTMLElement) => {
  el.parentNode?.removeChild(el)
}

const hasPermi: Directive<HTMLElement, string[]> = {
  mounted(el, binding) {
    const expected = binding.value
    if (!Array.isArray(expected) || expected.length === 0) {
      // 权限指令是视图层最后一道显示控制，必须传入明确权限数组；
      // 空值不做移除，避免模板误写时把按钮悄悄删掉，warn 让联调阶段能尽快暴露用法问题。
      console.warn('v-hasPermi usage: v-hasPermi="[\'system:user:list\']"')
      return
    }

    const userStore = useUserStore()
    const permissions = userStore.permissions
    const allowed =
      permissions.includes(ALL_PERMISSION) || expected.some((item) => permissions.includes(item))

    if (!allowed) {
      removeElement(el)
    }
  },
}

export default hasPermi
