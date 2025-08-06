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
  platform?: string;
  description?: string;
  industry?: string;
  targetLength?: number;
  brand?: string;
  voice?: string;
  guidelines?: string[];
  includeImages?: boolean;
  includeVideo?: boolean;
  aiMetadata?: {
    researchInsights?: string[];
    contentPlan?: string[];
    qualityScore?: number;
    seoScore?: number;
    readabilityScore?: number;
    engagementPrediction?: number;
    improvements?: string[];
    warnings?: string[];
    aiPipeline?: any[];
  };
}