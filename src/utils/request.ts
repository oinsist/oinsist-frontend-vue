import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import type { ApiResult } from '@/types/request'
import { defaultErrorMsg, httpStatusText } from './errorCode'

// 该模块是 Sa-Token 鉴权闭环的前端唯一入口：
// 1) 请求侧统一注入 Authorization / Tenant-Id，避免业务页面散落鉴权细节；
// 2) 响应侧把后端 R<T> 解包为 T，让业务调用方专注数据本身；
// 3) 401 集中收敛到一次 MessageBox + logout，避免并发请求弹多个弹窗。
const SUCCESS_CODE = 200

// GET 数组参数按 key=v1&key=v2 序列化，匹配 Spring 默认绑定
const paramsSerializer = {
  serialize: (params: Record<string, unknown>) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      if (Array.isArray(v)) v.forEach((item) => search.append(k, String(item)))
      else search.append(k, String(v))
    })
    return search.toString()
  },
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000,
  // 序列化器是无状态的，挂在实例上设一次即可，不必每个请求重复赋值
  paramsSerializer,
})

// 请求拦截器：把"是否带 token"这种横切关注点从业务层抽离
instance.interceptors.request.use(
  (config) => {
    // 惰性取 store：拦截器在模块加载期注册，但执行期 Pinia 已就绪
    const userStore = useUserStore()
    if (config.isToken !== false) {
      if (userStore.token) {
        config.headers.set('Authorization', userStore.token)
      }
    }
    // 后端当前以登录 Session 中的 tenantId 为准；这里保留请求头，便于后续网关/审计链路读取。
    config.headers.set('Tenant-Id', userStore.tenantId)
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// 401 处理的模块级锁：并发请求只弹一次确认框。
// 锁在用户关闭弹窗（确认/取消/点遮罩）后释放——若用户取消后
// 再次触发 401，会重新提示，这是预期行为而非 bug。
let unauthorizedHandling = false
const handleUnauthorized = () => {
  if (unauthorizedHandling) return
  unauthorizedHandling = true
  ElMessageBox.confirm('登录状态已过期，是否重新登录？', '系统提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
    })
    .catch(() => {})
    .finally(() => {
      unauthorizedHandling = false
    })
}

// 响应拦截器：把 R<T> 的解包 + 业务码分发收敛在一处
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 二进制流（文件下载等）原样返回，交给调用方处理
    if (response.config.responseType === 'blob') {
      return response
    }
    const payload = response.data as ApiResult<unknown> | undefined
    // 兼容非标准接口：未携带 code 字段则原样返回
    if (!payload || typeof payload.code !== 'number') {
      return response.data
    }
    if (payload.code === SUCCESS_CODE) {
      return payload.data
    }
    if (payload.code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error(payload.msg || httpStatusText[401]))
    }
    if (!response.config.silent) {
      ElMessage.error(payload.msg || defaultErrorMsg)
    }
    return Promise.reject(new Error(payload.msg || defaultErrorMsg))
  },
  (error: AxiosError) => {
    // HTTP 层 401 与业务码 401 收敛到同一出口：无论后端用哪种方式表达
    // 登录态失效，都走唯一的重新登录确认流程，避免两条路径体验不一致。
    if (error.response?.status === 401) {
      handleUnauthorized()
      return Promise.reject(error)
    }
    // 区分超时、网络异常、HTTP 异常三类，给出更可读的提示
    let message = defaultErrorMsg
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      message = '请求超时'
    } else if (!error.response) {
      message = '网络异常，请检查网络连接'
    } else {
      message = httpStatusText[error.response.status] ?? defaultErrorMsg
    }
    if (!error.config?.silent) {
      ElMessage.error(message)
    }
    return Promise.reject(error)
  },
)

// 对外导出泛型函数：业务调用方拿到的就是已解包的 T，避免到处写 response.data.data
const request = <T = unknown>(config: AxiosRequestConfig): Promise<T> => {
  return instance.request<T, T>(config)
}

export default request
