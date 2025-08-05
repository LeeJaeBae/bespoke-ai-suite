export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  MIXED = 'mixed'
}

export enum ContentStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  REVIEWING = 'reviewing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

export interface ContentMetadata {
  keywords: string[];
  tags: string[];
  targetAudience: string;
  tone: string;
  language: string;
}