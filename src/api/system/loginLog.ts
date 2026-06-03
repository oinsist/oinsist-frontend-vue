import request from '@/utils/request'
import type { PageQuery, PageResult } from '@/types/common'
import type { SysLoginLogVo } from '@/types/system/log'

export const listLoginLog = (params: PageQuery) => {
  return request<PageResult<SysLoginLogVo>>({
    url: '/system/loginLog/list',
    method: 'get',
    params,
  })
}

export const deleteLoginLog = (loginIds: string[]) => {
  return request<void>({
    // 后端 @PathVariable List<Long> 接收逗号分隔 ID，前端保持字符串透传以规避雪花 ID 精度问题。
    url: `/system/loginLog/${loginIds.join(',')}`,
    method: 'delete',
  })
}
