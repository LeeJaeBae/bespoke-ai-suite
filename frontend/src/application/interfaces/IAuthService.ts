import { User } from '@/domain/entities/User'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }>
  register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }>
  logout(): Promise<void>
  refreshToken(refreshToken: string): Promise<AuthTokens>
  getCurrentUser(): Promise<User | null>
  verifyToken(token: string): Promise<boolean>
}