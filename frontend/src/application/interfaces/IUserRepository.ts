import { User } from '@/domain/entities/User'
import { UserId } from '@/domain/value-objects/UserId'
import { Email } from '@/domain/value-objects/Email'

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  save(user: User): Promise<void>
  update(user: User): Promise<void>
  delete(id: UserId): Promise<void>
}