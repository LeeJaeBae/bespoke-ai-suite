/**
 * AI Agent Service Interface
 * Clean Architecture - Application Layer
 * 
 * Defines the contract for AI agent interactions
 * Following Dependency Inversion Principle
 */

import { ContentType } from '../../domain/value-objects/ContentType.js';
import { QualityScore } from '../../domain/value-objects/QualityScore.js';

/**
 * Research data gathered by Research Agent
 */
export interface ResearchData {
  topic: string;
  keywords: string[];
  targetAudience: string;
  competitors: Array<{
    name: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  marketTrends: string[];
  insights: string[];
  sources: string[];
}

/**
 * Content plan created by Planning Agent
 */
export interface ContentPlan {
  title: string;
  outline: string[];
  contentType: ContentType;
  targetLength: number;
  tone: 'professional' | 'casual' | 'technical' | 'creative';
  keywords: string[];
  callToAction: string;
  estimatedEngagement: number;
}

/**
 * Content generation request
 */
export interface GenerationRequest {
  research: ResearchData;
  plan: ContentPlan;
  style: {
    brand: string;
    voice: string;
    guidelines: string[];
  };
  multimodal?: {
    includeImages: boolean;
    includeVideo: boolean;
    imageStyle?: string;
  };
}

/**
 * Generated content from Creation Agent
 */
export interface GeneratedContent {
  title: string;
  body: string;
  summary: string;
  hashtags: string[];
  metadata: {
    wordCount: number;
    readingTime: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    language: string;
  };
  media?: {
    images?: Array<{
      url: string;
      alt: string;
      caption: string;
    }>;
    videos?: Array<{
      url: string;
      thumbnail: string;
      duration: number;
    }>;
  };
}

/**
 * Review feedback from Review Agent
 */
export interface ReviewFeedback {
  qualityScore: QualityScore;
  improvements: string[];
  warnings: string[];
  compliance: {
    brandGuidelines: boolean;
    legal: boolean;
    ethical: boolean;
  };
  seoScore: number;
  readabilityScore: number;
  engagementPrediction: number;
}

/**
 * AI Agent Service - Main interface for all agents
 */
export interface AIAgentService {
  /**
   * Research Agent - Gathers market intelligence and insights
   */
  research(topic: string, context?: any): Promise<ResearchData>;

  /**
   * Planning Agent - Creates content strategy and structure
   */
  plan(research: ResearchData, requirements?: any): Promise<ContentPlan>;

  /**
   * Creation Agent - Generates actual content
   */
  create(request: GenerationRequest): Promise<GeneratedContent>;

  /**
   * Review Agent - Validates and improves content
   */
  review(content: GeneratedContent, criteria?: any): Promise<ReviewFeedback>;

  /**
   * Full pipeline - Orchestrates all agents
   */
  generateContent(
    topic: string,
    contentType: ContentType,
    options?: any
  ): Promise<{
    research: ResearchData;
    plan: ContentPlan;
    content: GeneratedContent;
    review: ReviewFeedback;
  }>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retryAttempts: number;
  fallbackStrategy: 'local' | 'alternative' | 'none';
}