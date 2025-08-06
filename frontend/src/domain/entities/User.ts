import { UserId } from '../value-objects/UserId'
import { Email } from '../value-objects/Email'

export interface UserProps {
  id: UserId
  email: Email
  name: string
  profileImage?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date()
    return new User({
      ...props,
      id: UserId.generate(),
      createdAt: now,
      updatedAt: now,
    })
  }

  static fromPersistence(props: UserProps): User {
    return new User(props)
  }

  get id(): UserId {
    return this.props.id
  }

  get email(): Email {
    return this.props.email
  }

  get name(): string {
    return this.props.name
  }

  get profileImage(): string | undefined {
    return this.props.profileImage
  }

  get role(): UserRole {
    return this.props.role
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt
  }

  updateProfile(name: string, profileImage?: string): User {
    return new User({
      ...this.props,
      name,
      profileImage,
      updatedAt: new Date(),
    })
  }

  updateLastLogin(): User {
    return new User({
      ...this.props,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
  }

  hasPermission(permission: string): boolean {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.ADMIN]: ['*'],
      [UserRole.MANAGER]: ['content:*', 'campaign:*', 'analytics:read'],
      [UserRole.USER]: ['content:read', 'campaign:read', 'analytics:read'],
    }

    const userPermissions = permissions[this.role]
    return userPermissions.includes('*') || userPermissions.includes(permission)
  }

  toJSON() {
    return {
      id: this.id.toString(),
      email: this.email.toString(),
      name: this.name,
      profileImage: this.profileImage,
      role: this.role,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      lastLoginAt: this.lastLoginAt?.toISOString(),
    }
  }
}