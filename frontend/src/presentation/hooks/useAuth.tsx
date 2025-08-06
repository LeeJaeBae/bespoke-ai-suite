import React, { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/presentation/stores/useAuthStore'
import { UserRole } from '@/domain/entities/User'

interface UseAuthOptions {
  redirectTo?: string
  redirectIfAuthenticated?: string
  requiredRole?: UserRole[]
}

export function useAuth(options: UseAuthOptions = {}) {
  const router = useRouter()
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  } = useAuthStore()

  useEffect(() => {
    // 인증 상태에 따른 리다이렉트 처리
    if (!isLoading) {
      if (isAuthenticated && options.redirectIfAuthenticated) {
        router.push(options.redirectIfAuthenticated)
      } else if (!isAuthenticated && options.redirectTo) {
        router.push(options.redirectTo)
      }
    }
  }, [isAuthenticated, isLoading, options.redirectTo, options.redirectIfAuthenticated, router])

  useEffect(() => {
    // 권한 검사
    if (isAuthenticated && user && options.requiredRole) {
      const hasRequiredRole = options.requiredRole.includes(user.role)
      if (!hasRequiredRole) {
        router.push('/unauthorized')
      }
    }
  }, [isAuthenticated, user, options.requiredRole, router])

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        await login({ email, password })
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '로그인에 실패했습니다.',
        }
      }
    },
    [login]
  )

  const handleRegister = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        await register({ email, password, name })
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '회원가입에 실패했습니다.',
        }
      }
    },
    [register]
  )

  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/login')
  }, [logout, router])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkAuth,
    clearError,
  }
}

// 인증이 필요한 페이지를 위한 HOC
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: UseAuthOptions = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { isLoading } = useAuth({
      redirectTo: '/login',
      ...options,
    })

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
        </div>
      )
    }

    return <Component {...props} />
  }
}