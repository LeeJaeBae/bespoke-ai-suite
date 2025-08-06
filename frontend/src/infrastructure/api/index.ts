import { ApiClient } from './ApiClient'

// API 엔드포인트 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
const CONTENT_SERVICE_URL = process.env.NEXT_PUBLIC_CONTENT_SERVICE_URL || 'http://localhost:8081'
const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8082'

// 서비스별 엔드포인트
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
  },
  CONTENT: {
    BASE: '/content',
    BY_ID: (id: string) => `/content/${id}`,
    PUBLISH: (id: string) => `/content/${id}/publish`,
    SCHEDULE: (id: string) => `/content/${id}/schedule`,
    TAGS: '/content/tags',
  },
  CAMPAIGNS: {
    BASE: '/campaigns',
    BY_ID: (id: string) => `/campaigns/${id}`,
    ACTIVATE: (id: string) => `/campaigns/${id}/activate`,
    PAUSE: (id: string) => `/campaigns/${id}/pause`,
    ANALYTICS: (id: string) => `/campaigns/${id}/analytics`,
  },
  ANALYTICS: {
    BASE: '/analytics',
    BY_ID: (id: string) => `/analytics/${id}`,
    AGGREGATE: '/analytics/aggregate',
    DASHBOARD: '/analytics/dashboard',
  },
} as const

// API 클라이언트 인스턴스
export const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'X-Client-Version': '1.0.0',
  },
})

// Content Service 클라이언트
export const contentApiClient = new ApiClient({
  baseURL: CONTENT_SERVICE_URL,
  timeout: 30000,
  headers: {
    'X-Client-Version': '1.0.0',
    'X-Service': 'frontend',
  },
})

// User Service 클라이언트
export const userApiClient = new ApiClient({
  baseURL: USER_SERVICE_URL,
  timeout: 30000,
  headers: {
    'X-Client-Version': '1.0.0',
    'X-Service': 'frontend',
  },
})

// 쿠키 관리 유틸리티
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

// 토큰 관리 유틸리티
export const tokenManager = {
  getAccessToken(): string | null {
    return getCookie('accessToken')
  },
  
  getRefreshToken(): string | null {
    return getCookie('refreshToken')
  },
  
  setTokens(accessToken: string, refreshToken: string) {
    setCookie('accessToken', accessToken, 1) // 1일
    setCookie('refreshToken', refreshToken, 7) // 7일
    apiClient.setAccessToken(accessToken)
  },
  
  clearTokens() {
    deleteCookie('accessToken')
    deleteCookie('refreshToken')
    apiClient.setAccessToken(undefined)
  },
  
  initializeTokens() {
    const accessToken = this.getAccessToken()
    if (accessToken) {
      apiClient.setAccessToken(accessToken)
    }
  },
}

// 클라이언트 사이드에서 토큰 초기화
if (typeof window !== 'undefined') {
  tokenManager.initializeTokens()
  
  // Content Service와 User Service에도 토큰 설정
  const accessToken = tokenManager.getAccessToken()
  if (accessToken) {
    contentApiClient.setAccessToken(accessToken)
    userApiClient.setAccessToken(accessToken)
  }
}

// 토큰 매니저 확장 - 모든 API 클라이언트에 토큰 설정
const originalSetTokens = tokenManager.setTokens
tokenManager.setTokens = function(accessToken: string, refreshToken: string) {
  originalSetTokens.call(this, accessToken, refreshToken)
  contentApiClient.setAccessToken(accessToken)
  userApiClient.setAccessToken(accessToken)
}

const originalClearTokens = tokenManager.clearTokens
tokenManager.clearTokens = function() {
  originalClearTokens.call(this)
  contentApiClient.setAccessToken(undefined)
  userApiClient.setAccessToken(undefined)
}