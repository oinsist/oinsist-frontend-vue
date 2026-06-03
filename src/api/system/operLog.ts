import request from '@/utils/request'
import type { PageQuery, PageResult } from '@/types/common'
import type { SysOperLogVo } from '@/types/system/log'

export const listOperLog = (params: PageQuery) => {
  return request<PageResult<SysOperLogVo>>({
    url: '/system/operLog/list',
    method: 'get',
    params,
  })
}

export const deleteOperLog = (operIds: string[]) => {
  return request<void>({
    // 后端 @PathVariable List<Long> 接收逗号分隔 ID，前端保持字符串透传以规避雪花 ID 精度问题。
    url: `/system/operLog/${operIds.join(',')}`,
    method: 'delete',
  })
}
