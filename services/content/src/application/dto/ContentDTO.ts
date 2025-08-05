import { ContentType, ContentStatus, ContentMetadata } from '@domain/value-objects/ContentType.js';

// Request DTOs
export interface CreateContentRequest {
  type: ContentType;
  title: string;
  prompt: string;
  metadata?: {
    keywords?: string[];
    tags?: string[];
    targetAudience?: string;
    tone?: string;
    language?: string;
  };
  userId: string; // This will be injected from JWT token
}

export interface UpdateContentRequest {
  id: string;
  userId: string;
  title?: string;
  body?: string;
  metadata?: Partial<ContentMetadata>;
}

export interface GenerateContentRequest {
  prompt: string;
  type: ContentType;
  parameters?: {
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    targetAudience?: string;
    language?: string;
    keywords?: string[];
  };
}

export interface ListContentRequest {
  userId?: string;
  type?: ContentType;
  status?: ContentStatus;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTOs
export interface ContentResponse {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  status: ContentStatus;
  qualityScore?: number;
  metadata: ContentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentResponse {
  content: ContentResponse;
  message: string;
}

export interface ListContentResponse {
  contents: ContentResponse[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ContentGenerationProgress {
  status: 'researching' | 'planning' | 'creating' | 'reviewing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  message?: string;
}

// AI Service DTOs
export interface AIGeneratedContent {
  title: string;
  body: string;
  metadata: {
    keywords: string[];
    tags: string[];
    suggestedTone: string;
    estimatedReadTime?: number;
  };
  qualityScore: number;
  suggestions?: string[];
}