import { IAuthService, LoginCredentials, AuthTokens } from '@/application/interfaces/IAuthService'
import { IUserRepository } from '@/application/interfaces/IUserRepository'
import { User } from '@/domain/entities/User'
import { Email } from '@/domain/value-objects/Email'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export class LoginUseCase {
  constructor(
    private authService: IAuthService,
    private userRepository: IUserRepository
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    // Validate email format
    const email = Email.create(request.email)
    
    // Perform login
    const { user, tokens } = await this.authService.login({
      email: request.email,
      password: request.password,
    })
    
    // Update last login
    const updatedUser = user.updateLastLogin()
    await this.userRepository.update(updatedUser)
    
    return {
      user: updatedUser,
      tokens,
    }
  }
}