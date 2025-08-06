import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User } from '@/domain/entities/User'
import { AuthService } from '@/infrastructure/services/AuthService'
import { LoginUseCase } from '@/application/use-cases/auth/LoginUseCase'
import { AuthTokens, LoginCredentials, RegisterData } from '@/application/interfaces/IAuthService'
import { tokenManager } from '@/infrastructure/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  reset: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// 서비스 인스턴스
const authService = new AuthService()

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        login: async (credentials) => {
          set({ isLoading: true, error: null })
          try {
            const { user, tokens } = await authService.login(credentials)
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } catch (error) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : '로그인에 실패했습니다.',
            })
            throw error
          }
        },

        register: async (data) => {
          set({ isLoading: true, error: null })
          try {
            const { user, tokens } = await authService.register(data)
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } catch (error) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : '회원가입에 실패했습니다.',
            })
            throw error
          }
        },

        logout: async () => {
          set({ isLoading: true })
          try {
            await authService.logout()
          } finally {
            set({
              ...initialState,
              isLoading: false,
            })
          }
        },

        refreshToken: async () => {
          const refreshToken = tokenManager.getRefreshToken()
          if (!refreshToken) {
            set({
              user: null,
              isAuthenticated: false,
            })
            return
          }

          try {
            await authService.refreshToken(refreshToken)
            // 토큰 갱신 후 사용자 정보 재조회
            await get().checkAuth()
          } catch (error) {
            // 리프레시 토큰도 만료된 경우
            tokenManager.clearTokens()
            set({
              user: null,
              isAuthenticated: false,
              error: '세션이 만료되었습니다. 다시 로그인해주세요.',
            })
          }
        },

        checkAuth: async () => {
          const accessToken = tokenManager.getAccessToken()
          if (!accessToken) {
            set({
              user: null,
              isAuthenticated: false,
            })
            return
          }

          set({ isLoading: true })
          try {
            const user = await authService.getCurrentUser()
            if (user) {
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              })
            } else {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              })
            }
          } catch (error) {
            // 토큰이 유효하지 않은 경우
            tokenManager.clearTokens()
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        },

        clearError: () => {
          set({ error: null })
        },

        reset: () => {
          tokenManager.clearTokens()
          set(initialState)
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          // user 정보는 저장하지 않고 토큰 기반으로 재조회
        }),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
)

// 초기 인증 상태 확인
if (typeof window !== 'undefined') {
  const checkInitialAuth = async () => {
    const store = useAuthStore.getState()
    await store.checkAuth()
  }
  checkInitialAuth()
}