import request from '@/utils/request'
import type { LoginBody, LoginVo, TenantOptionVo, UserInfoVo } from '@/types/auth'

export const login = (data: LoginBody) => {
  return request<LoginVo>({
    url: '/auth/login',
    method: 'post',
    data,
    isToken: false,
  })
}

export const getUserInfo = () => {
  return request<UserInfoVo>({
    url: '/auth/userInfo',
    method: 'get',
  })
}

export const logout = () => {
  return request<void>({
    url: '/auth/logout',
    method: 'post',
  })
}

export const listTenantOptions = () => {
  return request<TenantOptionVo[]>({
    url: '/auth/tenants',
    method: 'get',
    isToken: false,
  })
}
