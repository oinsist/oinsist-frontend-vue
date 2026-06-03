export interface SysOperLogVo {
  operId: string
  title: string
  businessType: number
  method: string
  requestMethod: string
  requestUrl: string
  requestParam: string
  status: number
  errorMsg: string
  userId: string
  username: string
  ip: string
  duration: number
  operTime: string
}

export interface SysLoginLogVo {
  loginId: string
  userId: string
  username: string
  status: number
  ip: string
  userAgent: string
  msg: string
  loginTime: string
}
