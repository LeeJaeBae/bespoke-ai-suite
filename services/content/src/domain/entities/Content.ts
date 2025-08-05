import { ContentType, ContentStatus, ContentMetadata } from '../value-objects/ContentType.js';
import { QualityScore } from '../value-objects/QualityScore.js';

export interface ContentProps {
  type: ContentType;
  title: string;
  body: string;
  userId: string;
  prompt?: string;
  metadata?: ContentMetadata;
}

export class Content {
  private readonly id: string;
  private type: ContentType;
  private title: string;
  private body: string;
  private readonly userId: string;
  private prompt?: string;
  private status: ContentStatus;
  private qualityScore?: QualityScore;
  private metadata: ContentMetadata;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    type: ContentType,
    title: string,
    body: string,
    userId: string,
    prompt: string | undefined,
    status: ContentStatus,
    metadata: ContentMetadata,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.type = type;
    this.title = title;
    this.body = body;
    this.userId = userId;
    this.prompt = prompt;
    this.status = status;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Factory method for creating new content
  static create(props: ContentProps): Content {
    // Validate required fields
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Content title is required');
    }

    if (!props.body || props.body.trim().length === 0) {
      throw new Error('Content body is required');
    }

    if (!props.userId) {
      throw new Error('User ID is required');
    }

    const now = new Date();
    const id = generateContentId();
    
    const metadata: ContentMetadata = props.metadata || {
      keywords: [],
      tags: [],
      targetAudience: 'general',
      tone: 'professional',
      language: 'en'
    };

    return new Content(
      id,
      props.type,
      props.title.trim(),
      props.body.trim(),
      props.userId,
      props.prompt,
      ContentStatus.DRAFT,
      metadata,
      now,
      now
    );
  }

  // Factory method for reconstructing from persistence
  static reconstruct(
    id: string,
    type: ContentType,
    title: string,
    body: string,
    userId: string,
    prompt: string | undefined,
    status: ContentStatus,
    qualityScore: number | undefined,
    metadata: ContentMetadata,
    createdAt: Date,
    updatedAt: Date
  ): Content {
    const content = new Content(
      id,
      type,
      title,
      body,
      userId,
      prompt,
      status,
      metadata,
      createdAt,
      updatedAt
    );

    if (qualityScore !== undefined) {
      content.qualityScore = QualityScore.create(qualityScore);
    }

    return content;
  }

  // Business logic methods
  
  validateQuality(): QualityScore {
    let score = 100;

    // Title quality
    if (this.title.length < 10) score -= 10;
    if (this.title.length > 100) score -= 5;
    
    // Body quality
    if (this.body.length < 50) score -= 20;
    if (this.body.length < 100) score -= 10;
    
    // Metadata quality
    if (this.metadata.keywords.length === 0) score -= 10;
    if (this.metadata.tags.length === 0) score -= 5;
    
    // Content type specific rules
    switch (this.type) {
      case ContentType.TEXT:
        if (this.body.length < 300) score -= 10;
        break;
      case ContentType.IMAGE:
        if (!this.body.includes('http')) score -= 20; // Simple URL check
        break;
    }

    this.qualityScore = QualityScore.create(Math.max(0, score));
    this.updatedAt = new Date();
    
    return this.qualityScore;
  }

  publish(): void {
    if (this.status === ContentStatus.PUBLISHED) {
      throw new Error('Content is already published');
    }

    if (!this.qualityScore || !this.qualityScore.isAcceptable()) {
      throw new Error('Content quality must be validated and acceptable before publishing');
    }

    this.status = ContentStatus.PUBLISHED;
    this.updatedAt = new Date();
  }

  archive(): void {
    if (this.status === ContentStatus.ARCHIVED) {
      throw new Error('Content is already archived');
    }

    this.status = ContentStatus.ARCHIVED;
    this.updatedAt = new Date();
  }

  updateContent(title: string, body: string): void {
    if (this.status === ContentStatus.PUBLISHED) {
      throw new Error('Cannot update published content');
    }

    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }

    if (!body || body.trim().length === 0) {
      throw new Error('Body cannot be empty');
    }

    this.title = title.trim();
    this.body = body.trim();
    this.qualityScore = undefined; // Reset quality score
    this.updatedAt = new Date();
  }

  setStatus(status: ContentStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  addKeywords(keywords: string[]): void {
    const uniqueKeywords = new Set([...this.metadata.keywords, ...keywords]);
    this.metadata.keywords = Array.from(uniqueKeywords);
    this.updatedAt = new Date();
  }

  addTags(tags: string[]): void {
    const uniqueTags = new Set([...this.metadata.tags, ...tags]);
    this.metadata.tags = Array.from(uniqueTags);
    this.updatedAt = new Date();
  }

  // Getters
  getId(): string { return this.id; }
  getType(): ContentType { return this.type; }
  getTitle(): string { return this.title; }
  getBody(): string { return this.body; }
  getUserId(): string { return this.userId; }
  getPrompt(): string | undefined { return this.prompt; }
  getStatus(): ContentStatus { return this.status; }
  getQualityScore(): QualityScore | undefined { return this.qualityScore; }
  getMetadata(): ContentMetadata { return { ...this.metadata }; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      body: this.body,
      userId: this.userId,
      prompt: this.prompt,
      status: this.status,
      qualityScore: this.qualityScore?.getValue(),
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Helper function to generate unique content ID
function generateContentId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `cnt_${timestamp}_${randomPart}`;
}