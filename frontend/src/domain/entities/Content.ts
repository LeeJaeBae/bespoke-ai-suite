import { UserId } from '../value-objects/UserId'

export interface ContentProps {
  id: string
  title: string
  description?: string
  type: ContentType
  platform: ContentPlatform
  status: ContentStatus
  content: string
  metadata?: Record<string, any>
  tags: string[]
  authorId: UserId
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  scheduledAt?: Date
  analytics?: ContentAnalytics
}

export enum ContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  CAROUSEL = 'CAROUSEL',
  STORY = 'STORY',
}

export enum ContentPlatform {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  LINKEDIN = 'LINKEDIN',
  TIKTOK = 'TIKTOK',
  EMAIL = 'EMAIL',
  BLOG = 'BLOG',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface ContentAnalytics {
  views: number
  likes: number
  shares: number
  comments: number
  clicks: number
  conversions: number
  engagementRate: number
}

export class Content {
  private constructor(private readonly props: ContentProps) {}

  static create(props: Omit<ContentProps, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Content {
    const now = new Date()
    return new Content({
      ...props,
      id: crypto.randomUUID(),
      status: ContentStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    })
  }

  static fromPersistence(props: ContentProps): Content {
    return new Content(props)
  }

  get id(): string {
    return this.props.id
  }

  get title(): string {
    return this.props.title
  }

  get description(): string | undefined {
    return this.props.description
  }

  get type(): ContentType {
    return this.props.type
  }

  get platform(): ContentPlatform {
    return this.props.platform
  }

  get status(): ContentStatus {
    return this.props.status
  }

  get content(): string {
    return this.props.content
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata
  }

  get tags(): string[] {
    return this.props.tags
  }

  get authorId(): UserId {
    return this.props.authorId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt
  }

  get scheduledAt(): Date | undefined {
    return this.props.scheduledAt
  }

  get analytics(): ContentAnalytics | undefined {
    return this.props.analytics
  }

  updateContent(title: string, content: string, description?: string): Content {
    return new Content({
      ...this.props,
      title,
      content,
      description,
      updatedAt: new Date(),
    })
  }

  updateStatus(status: ContentStatus): Content {
    const updates: Partial<ContentProps> = {
      status,
      updatedAt: new Date(),
    }

    if (status === ContentStatus.PUBLISHED) {
      updates.publishedAt = new Date()
    }

    return new Content({
      ...this.props,
      ...updates,
    })
  }

  schedule(date: Date): Content {
    return new Content({
      ...this.props,
      status: ContentStatus.SCHEDULED,
      scheduledAt: date,
      updatedAt: new Date(),
    })
  }

  updateAnalytics(analytics: ContentAnalytics): Content {
    return new Content({
      ...this.props,
      analytics,
      updatedAt: new Date(),
    })
  }

  isPublished(): boolean {
    return this.status === ContentStatus.PUBLISHED
  }

  canEdit(): boolean {
    return [ContentStatus.DRAFT, ContentStatus.REVIEW].includes(this.status)
  }

  canPublish(): boolean {
    return this.status === ContentStatus.APPROVED
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      type: this.type,
      platform: this.platform,
      status: this.status,
      content: this.content,
      metadata: this.metadata,
      tags: this.tags,
      authorId: this.authorId.toString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      publishedAt: this.publishedAt?.toISOString(),
      scheduledAt: this.scheduledAt?.toISOString(),
      analytics: this.analytics,
    }
  }
}