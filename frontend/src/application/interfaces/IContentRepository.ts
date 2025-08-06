import { Content, ContentStatus, ContentPlatform } from '@/domain/entities/Content'
import { UserId } from '@/domain/value-objects/UserId'

export interface ContentFilter {
  status?: ContentStatus[]
  platform?: ContentPlatform[]
  authorId?: UserId
  tags?: string[]
  search?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
}

export interface IContentRepository {
  findById(id: string): Promise<Content | null>
  findAll(filter?: ContentFilter, pagination?: PaginationParams): Promise<PaginatedResult<Content>>
  findByIds(ids: string[]): Promise<Content[]>
  save(content: Content): Promise<void>
  update(content: Content): Promise<void>
  delete(id: string): Promise<void>
  getPopularTags(limit?: number): Promise<string[]>
}