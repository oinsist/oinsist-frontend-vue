import type { Directive } from 'vue'
import { useUserStore } from '@/store/modules/user'

const SUPER_ADMIN = 'admin'

const removeElement = (el: HTMLElement) => {
  el.parentNode?.removeChild(el)
}

const hasRole: Directive<HTMLElement, string[]> = {
  mounted(el, binding) {
    const expected = binding.value
    if (!Array.isArray(expected) || expected.length === 0) {
      // 角色指令只负责前端显示裁剪，不能替代后端鉴权；
      // 因此模板必须显式声明允许角色，空值仅 warn，避免误删业务操作入口。
      console.warn('v-hasRole usage: v-hasRole="[\'admin\']"')
      return
    }

    const userStore = useUserStore()
    const roles = userStore.roles
    const allowed = roles.includes(SUPER_ADMIN) || expected.some((item) => roles.includes(item))

    if (!allowed) {
      removeElement(el)
    }
  },
}

export default hasRole
