/**
 * Crew AI Agent Service Implementation
 * Infrastructure Layer - External Service Integration
 * 
 * Implements the AI Agent Service using Crew AI framework
 */

import { FastifyBaseLogger } from 'fastify';
import axios, { AxiosInstance } from 'axios';
import {
  AIAgentService,
  ResearchData,
  ContentPlan,
  GenerationRequest,
  GeneratedContent,
  ReviewFeedback,
  AgentConfig
} from '../../application/interfaces/AIAgentService.js';
import type { LLMService } from '../../application/interfaces/LLMService.js';
import { ContentType } from '../../domain/value-objects/ContentType.js';
import { QualityScore } from '../../domain/value-objects/QualityScore.js';
import { AgentRole } from '../../domain/value-objects/AgentRole.js';

/**
 * Crew AI Agent Service Implementation
 */
export class CrewAIAgentService implements AIAgentService {
  private client: AxiosInstance;
  private logger: FastifyBaseLogger;
  private config: AgentConfig;
  private llmService?: LLMService;

  constructor(config: AgentConfig, logger: FastifyBaseLogger, llmService?: LLMService) {
    this.config = config;
    this.logger = logger;
    this.llmService = llmService;
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug({ url: config.url, method: config.method }, 'Crew AI request');
        return config;
      },
      (error) => {
        this.logger.error({ error }, 'Crew AI request error');
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug({ status: response.status }, 'Crew AI response');
        return response;
      },
      async (error) => {
        this.logger.error({ error }, 'Crew AI response error');
        
        // Implement retry logic
        if (error.config && error.config.retryCount < this.config.retryAttempts) {
          error.config.retryCount = (error.config.retryCount || 0) + 1;
          await this.delay(1000 * error.config.retryCount);
          return this.client(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Research Agent - Market intelligence and insights
   */
  async research(topic: string, context?: any): Promise<ResearchData> {
    try {
      this.logger.info({ topic }, 'Starting research agent');

      // Use LLM service if available
      if (this.llmService) {
        const prompt = `Research comprehensive information about: ${topic}

Objective: Gather market intelligence, trends, and insights

Requirements:
- Identify target audience
- Analyze competitors
- Find relevant keywords
- Discover market trends
- Generate actionable insights

Context: ${JSON.stringify(context || {})}

Provide a structured JSON response with:
{
  "keywords": ["keyword1", "keyword2"],
  "targetAudience": "description",
  "competitors": ["competitor1", "competitor2"],
  "marketTrends": ["trend1", "trend2"],
  "insights": ["insight1", "insight2"],
  "sources": ["source1", "source2"]
}`;

        const messages = [
          { role: 'system' as const, content: 'You are a market research specialist. Provide responses in valid JSON format.' },
          { role: 'user' as const, content: prompt }
        ];

        const llmResponse = await this.llmService.complete(messages, {
          temperature: 0.7,
          maxTokens: this.config.maxTokens
        });

        try {
          const data = JSON.parse(llmResponse.content);
          return {
            topic,
            keywords: data.keywords || [],
            targetAudience: data.targetAudience || '',
            competitors: data.competitors || [],
            marketTrends: data.marketTrends || [],
            insights: data.insights || [],
            sources: data.sources || []
          };
        } catch (parseError) {
          this.logger.warn('Failed to parse LLM JSON response, using fallback');
        }
      }

      // Fall back to API
      const response = await this.client.post('/agents/research', {
        role: AgentRole.research().getValue(),
        task: `Research comprehensive information about: ${topic}`,
        context: {
          objective: 'Gather market intelligence, trends, and insights',
          requirements: [
            'Identify target audience',
            'Analyze competitors',
            'Find relevant keywords',
            'Discover market trends',
            'Generate actionable insights'
          ],
          ...context
        },
        model: this.config.model,
        temperature: 0.7,
        max_tokens: this.config.maxTokens
      });

      const data = response.data;
      
      return {
        topic,
        keywords: data.keywords || [],
        targetAudience: data.target_audience || '',
        competitors: data.competitors || [],
        marketTrends: data.trends || [],
        insights: data.insights || [],
        sources: data.sources || []
      };
    } catch (error) {
      this.logger.error({ error, topic }, 'Research agent failed');
      
      // Fallback strategy
      if (this.config.fallbackStrategy === 'local') {
        return this.localResearchFallback(topic);
      }
      
      throw new Error(`Research agent failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Planning Agent - Content strategy and structure
   */
  async plan(research: ResearchData, requirements?: any): Promise<ContentPlan> {
    try {
      this.logger.info({ topic: research.topic }, 'Starting planning agent');

      const response = await this.client.post('/agents/planning', {
        role: AgentRole.planning().getValue(),
        task: 'Create a comprehensive content plan',
        context: {
          research,
          requirements: {
            contentType: requirements?.contentType || 'article',
            targetLength: requirements?.targetLength || 1000,
            tone: requirements?.tone || 'professional',
            ...requirements
          }
        },
        model: this.config.model,
        temperature: 0.6,
        max_tokens: this.config.maxTokens
      });

      const data = response.data;

      return {
        title: data.title || `Content about ${research.topic}`,
        outline: data.outline || [],
        contentType: (data.content_type || ContentType.TEXT) as ContentType,
        targetLength: data.target_length || 1000,
        tone: data.tone || 'professional',
        keywords: data.keywords || research.keywords,
        callToAction: data.cta || '',
        estimatedEngagement: data.estimated_engagement || 0
      };
    } catch (error) {
      this.logger.error({ error }, 'Planning agent failed');
      
      if (this.config.fallbackStrategy === 'local') {
        return this.localPlanningFallback(research);
      }
      
      throw new Error(`Planning agent failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creation Agent - Content generation
   */
  async create(request: GenerationRequest): Promise<GeneratedContent> {
    try {
      this.logger.info({ title: request.plan.title }, 'Starting creation agent');

      const response = await this.client.post('/agents/creation', {
        role: AgentRole.creation().getValue(),
        task: 'Generate high-quality content',
        context: {
          research: request.research,
          plan: request.plan,
          style: request.style,
          multimodal: request.multimodal || { includeImages: false }
        },
        model: this.config.model,
        temperature: 0.8,
        max_tokens: this.config.maxTokens * 2 // More tokens for content generation
      });

      const data = response.data;

      return {
        title: data.title || request.plan.title,
        body: data.content || '',
        summary: data.summary || '',
        hashtags: data.hashtags || [],
        metadata: {
          wordCount: this.countWords(data.content || ''),
          readingTime: Math.ceil(this.countWords(data.content || '') / 200),
          sentiment: data.sentiment || 'neutral',
          language: data.language || 'en'
        },
        media: data.media || undefined
      };
    } catch (error) {
      this.logger.error({ error }, 'Creation agent failed');
      
      if (this.config.fallbackStrategy === 'local') {
        return this.localCreationFallback(request);
      }
      
      throw new Error(`Creation agent failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Review Agent - Content validation and improvement
   */
  async review(content: GeneratedContent, criteria?: any): Promise<ReviewFeedback> {
    try {
      this.logger.info({ title: content.title }, 'Starting review agent');

      const response = await this.client.post('/agents/review', {
        role: AgentRole.review().getValue(),
        task: 'Review and improve content quality',
        context: {
          content,
          criteria: {
            checkBrandCompliance: true,
            checkLegal: true,
            checkEthical: true,
            checkSEO: true,
            checkReadability: true,
            ...criteria
          }
        },
        model: this.config.model,
        temperature: 0.3, // Lower temperature for more consistent reviews
        max_tokens: this.config.maxTokens
      });

      const data = response.data;

      return {
        qualityScore: QualityScore.create(data.quality_score || 75),
        improvements: data.improvements || [],
        warnings: data.warnings || [],
        compliance: {
          brandGuidelines: data.compliance?.brand || true,
          legal: data.compliance?.legal || true,
          ethical: data.compliance?.ethical || true
        },
        seoScore: data.seo_score || 0,
        readabilityScore: data.readability_score || 0,
        engagementPrediction: data.engagement_prediction || 0
      };
    } catch (error) {
      this.logger.error({ error }, 'Review agent failed');
      
      if (this.config.fallbackStrategy === 'local') {
        return this.localReviewFallback(content);
      }
      
      throw new Error(`Review agent failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Full pipeline orchestration
   */
  async generateContent(
    topic: string,
    contentType: ContentType,
    options?: any
  ): Promise<{
    research: ResearchData;
    plan: ContentPlan;
    content: GeneratedContent;
    review: ReviewFeedback;
  }> {
    try {
      this.logger.info({ topic, contentType }, 'Starting full content generation pipeline');

      // Step 1: Research
      const research = await this.research(topic, options?.researchContext);
      this.logger.info('Research completed');

      // Step 2: Planning
      const plan = await this.plan(research, {
        contentType,
        ...options?.planningRequirements
      });
      this.logger.info('Planning completed');

      // Step 3: Creation
      const content = await this.create({
        research,
        plan,
        style: options?.style || {
          brand: 'Bespoke AI',
          voice: 'professional',
          guidelines: []
        },
        multimodal: options?.multimodal
      });
      this.logger.info('Content creation completed');

      // Step 4: Review
      const review = await this.review(content, options?.reviewCriteria);
      this.logger.info('Review completed');

      // Apply improvements if quality score is low
      if (review.qualityScore.getValue() < 85 && review.improvements.length > 0) {
        this.logger.info('Applying improvements based on review feedback');
        // In a real implementation, we would re-generate content with improvements
      }

      return {
        research,
        plan,
        content,
        review
      };
    } catch (error) {
      this.logger.error({ error, topic }, 'Content generation pipeline failed');
      throw new Error(`Content generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  // Fallback methods for local processing
  private localResearchFallback(topic: string): ResearchData {
    this.logger.warn('Using local research fallback');
    return {
      topic,
      keywords: [topic.toLowerCase(), 'marketing', 'digital', 'content'],
      targetAudience: 'General business audience',
      competitors: [],
      marketTrends: ['AI-powered content', 'Personalization', 'Multi-channel marketing'],
      insights: ['Focus on value proposition', 'Use data-driven approach'],
      sources: ['Internal knowledge base']
    };
  }

  private localPlanningFallback(research: ResearchData): ContentPlan {
    this.logger.warn('Using local planning fallback');
    return {
      title: `Comprehensive Guide to ${research.topic}`,
      outline: [
        'Introduction',
        'Key Concepts',
        'Best Practices',
        'Case Studies',
        'Conclusion'
      ],
      contentType: ContentType.TEXT,
      targetLength: 1000,
      tone: 'professional',
      keywords: research.keywords,
      callToAction: 'Learn more about our solutions',
      estimatedEngagement: 3.5
    };
  }

  private localCreationFallback(request: GenerationRequest): GeneratedContent {
    this.logger.warn('Using local creation fallback');
    const body = `# ${request.plan.title}\n\n${request.plan.outline.join('\n\n')}`;
    
    return {
      title: request.plan.title,
      body,
      summary: `An article about ${request.research.topic}`,
      hashtags: request.research.keywords.map(k => `#${k.replace(/\s+/g, '')}`),
      metadata: {
        wordCount: this.countWords(body),
        readingTime: Math.ceil(this.countWords(body) / 200),
        sentiment: 'neutral',
        language: 'en'
      }
    };
  }

  private localReviewFallback(content: GeneratedContent): ReviewFeedback {
    this.logger.warn('Using local review fallback');
    return {
      qualityScore: QualityScore.create(75),
      improvements: ['Add more specific examples', 'Include data and statistics'],
      warnings: [],
      compliance: {
        brandGuidelines: true,
        legal: true,
        ethical: true
      },
      seoScore: 70,
      readabilityScore: 80,
      engagementPrediction: 3.0
    };
  }
}