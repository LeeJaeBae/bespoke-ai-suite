import { Content } from '../entities/Content.js';
import { ContentType, ContentStatus } from '../value-objects/ContentType.js';

export interface ContentFilter {
  userId?: string;
  type?: ContentType;
  status?: ContentStatus;
  fromDate?: Date;
  toDate?: Date;
  tags?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ContentRepository {
  save(content: Content): Promise<void>;
  findById(id: string): Promise<Content | null>;
  findByUser(userId: string, pagination: PaginationOptions): Promise<PaginatedResult<Content>>;
  findAll(filter: ContentFilter, pagination: PaginationOptions): Promise<PaginatedResult<Content>>;
  update(content: Content): Promise<void>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
  findByTags(tags: string[], pagination: PaginationOptions): Promise<PaginatedResult<Content>>;
}