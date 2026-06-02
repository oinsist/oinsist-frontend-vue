import request from '@/utils/request'
import type { RouterVo } from '@/types/router'

export const getRouters = () => {
  return request<RouterVo[]>({
    url: '/auth/routers',
    method: 'get',
  })
}
