import { IAuthService, LoginCredentials, RegisterData, AuthTokens } from '@/application/interfaces/IAuthService'
import { User, UserRole } from '@/domain/entities/User'
import { Email } from '@/domain/value-objects/Email'
import { UserId } from '@/domain/value-objects/UserId'
import { apiClient, API_ENDPOINTS, tokenManager } from '@/infrastructure/api'

interface UserDTO {
  id: string
  email: string
  name: string
  profileImage?: string
  role: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

interface AuthResponseDTO {
  user: UserDTO
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}

export class AuthService implements IAuthService {
  private mapUserDTOToEntity(dto: UserDTO): User {
    return User.fromPersistence({
      id: UserId.create(dto.id),
      email: Email.create(dto.email),
      name: dto.name,
      profileImage: dto.profileImage,
      role: dto.role as UserRole,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      lastLoginAt: dto.lastLoginAt ? new Date(dto.lastLoginAt) : undefined,
    })
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post<AuthResponseDTO>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    )

    const user = this.mapUserDTOToEntity(response.user)
    const tokens = response.tokens

    // 토큰 저장
    tokenManager.setTokens(tokens.accessToken, tokens.refreshToken)

    return { user, tokens }
  }

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post<AuthResponseDTO>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    )

    const user = this.mapUserDTOToEntity(response.user)
    const tokens = response.tokens

    // 토큰 저장
    tokenManager.setTokens(tokens.accessToken, tokens.refreshToken)

    return { user, tokens }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } finally {
      // 로컬 토큰 삭제
      tokenManager.clearTokens()
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<{ tokens: AuthTokens }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    )

    const tokens = response.tokens
    
    // 새 토큰 저장
    tokenManager.setTokens(tokens.accessToken, tokens.refreshToken)

    return tokens
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<UserDTO>(API_ENDPOINTS.AUTH.ME)
      return this.mapUserDTOToEntity(response)
    } catch (error) {
      // 인증되지 않은 경우 null 반환
      return null
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      // 임시로 토큰 설정
      const originalToken = tokenManager.getAccessToken()
      apiClient.setAccessToken(token)
      
      // 토큰 검증을 위해 현재 사용자 조회
      const response = await apiClient.get<UserDTO>(API_ENDPOINTS.AUTH.ME)
      
      // 원래 토큰으로 복원
      apiClient.setAccessToken(originalToken || undefined)
      
      return !!response
    } catch (error) {
      return false
    }
  }
}