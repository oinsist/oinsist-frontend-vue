// 后端 Sa-Token 统一响应契约：code === 200 表示业务成功，data 为真正负载
// 与 axios 的 module augmentation 共存：本文件作为 module 文件存在，
// 通过 import 形式的 augmentation 给 AxiosRequestConfig 注入业务字段
import 'axios'

// 统一响应结构：R<T>
export interface ApiResult<T = unknown> {
  code: number
  msg: string
  data: T
}

declare module 'axios' {
  // 给每个请求 config 注入与 Sa-Token 鉴权闭环配套的开关字段
  export interface AxiosRequestConfig {
    // 是否注入 Authorization 头；登录接口需显式设为 false
    isToken?: boolean
    // true 时拦截器内部不弹出错误提示（用于业务侧自定义错误处理）
    silent?: boolean
    // 预留：是否允许重复请求（本期不实现去重逻辑）
    repeatable?: boolean
  }
}
