import { Content } from '@domain/entities/Content.js';
import { ContentRepository } from '@domain/repositories/ContentRepository.js';
import { ContentType, ContentStatus } from '@domain/value-objects/ContentType.js';
import { AIAgentService } from '../interfaces/AIAgentService.js';
import { EventPublisher, ContentCreatedEvent } from '../interfaces/EventPublisher.js';
import { 
  CreateContentRequest, 
  CreateContentResponse, 
  ContentResponse 
} from '../dto/ContentDTO.js';

export class CreateContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly aiAgentService: AIAgentService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(request: CreateContentRequest): Promise<CreateContentResponse> {
    try {
      const contentType = request.type as ContentType;
      let aiPipeline: any = null;
      let contentTitle = request.title;
      let contentBody = '';
      let contentMetadata: any = {};

      // Determine if AI generation is enabled
      const useAI = request.aiGeneration?.enabled !== false; // Default to true for backward compatibility
      const prompt = request.aiGeneration?.prompt || request.prompt || request.title;

      if (useAI && prompt) {
        // 1. Execute full AI pipeline: Research → Plan → Create → Review
        console.log('Starting AI-powered content generation pipeline...');
        
        aiPipeline = await this.aiAgentService.generateContent(
          prompt,
          contentType,
          {
            researchContext: {
              targetAudience: request.aiGeneration?.config?.targetAudience || request.metadata?.targetAudience,
              industry: request.metadata?.industry
            },
            planningRequirements: {
              tone: request.aiGeneration?.config?.tone || request.metadata?.tone || 'professional',
              targetLength: request.metadata?.targetLength || 1000
            },
            style: {
              brand: request.metadata?.brand || 'Bespoke AI',
              voice: request.metadata?.voice || 'professional',
              guidelines: request.metadata?.guidelines || []
            },
            multimodal: {
              includeImages: request.metadata?.includeImages || false,
              includeVideo: request.metadata?.includeVideo || false
            },
            reviewCriteria: {
              minQualityScore: 85,
              checkCompliance: true
            }
          }
        );

        // Use AI-generated content
        contentTitle = aiPipeline.content.title || request.title;
        contentBody = aiPipeline.content.body;
        contentMetadata = {
          keywords: aiPipeline.plan.keywords,
          tags: [...(aiPipeline.content.hashtags || []), ...(request.tags || [])],
          targetAudience: aiPipeline.research.targetAudience,
          tone: aiPipeline.plan.tone,
          language: aiPipeline.content.metadata.language,
          platform: request.platform,
          description: request.description,
          // Store AI pipeline results for traceability
          aiMetadata: {
            researchInsights: aiPipeline.research.insights,
            contentPlan: aiPipeline.plan.outline,
            qualityScore: aiPipeline.review.qualityScore.getValue(),
            seoScore: aiPipeline.review.seoScore,
            readabilityScore: aiPipeline.review.readabilityScore,
            engagementPrediction: aiPipeline.review.engagementPrediction,
            improvements: aiPipeline.review.improvements,
            warnings: aiPipeline.review.warnings,
            aiPipeline: aiPipeline.metadata?.pipeline || []
          }
        };
      } else {
        // Manual content creation
        console.log('Creating content manually without AI generation...');
        contentBody = request.prompt || request.description || 'Draft content';
        contentMetadata = {
          tags: request.tags || [],
          platform: request.platform,
          description: request.description,
          ...request.metadata
        };
      }

      // 2. Create Content entity
      const content = Content.create({
        type: request.type,
        title: contentTitle,
        body: contentBody,
        userId: request.userId,
        prompt: prompt,
        metadata: contentMetadata,
        status: request.status || ContentStatus.DRAFT
      });

      // 3. Validate content quality using review feedback
      const qualityScore = content.validateQuality();
      console.log(`Content quality score: ${qualityScore.toString()}`);
      
      if (aiPipeline) {
        console.log(`AI Review score: ${aiPipeline.review.qualityScore.getValue()}`);

        // 4. Apply improvements if suggested by Review Agent
        if (aiPipeline.review.improvements.length > 0 && qualityScore.getValue() < 90) {
          console.log('Applying AI-suggested improvements...');
          // In production, we would re-generate with improvements
          // For now, we'll log the suggestions
          console.log('Suggested improvements:', aiPipeline.review.improvements);
        }

        // 5. Check compliance before saving
        if (!aiPipeline.review.compliance.legal || !aiPipeline.review.compliance.ethical) {
          throw new Error('Content failed compliance checks');
        }
      }

      // 6. Save content to repository
      await this.contentRepository.save(content);

      // 7. Publish domain event with enriched data
      const event = new ContentCreatedEvent(
        content.getId(),
        content.getUserId(),
        content.getType(),
        content.getTitle()
      );
      await this.eventPublisher.publish(event);

      // 8. Return comprehensive response
      return {
        content: this.mapToResponse(content),
        message: aiPipeline ? 'Content created successfully with AI enhancement' : 'Content created successfully',
        aiMetrics: aiPipeline ? {
          qualityScore: aiPipeline.review.qualityScore.getValue(),
          seoScore: aiPipeline.review.seoScore,
          readabilityScore: aiPipeline.review.readabilityScore,
          engagementPrediction: aiPipeline.review.engagementPrediction
        } : undefined
      };

    } catch (error) {
      console.error('Error creating content:', error);
      throw new Error(`Failed to create content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapToResponse(content: Content): ContentResponse {
    return {
      id: content.getId(),
      type: content.getType(),
      title: content.getTitle(),
      body: content.getBody(),
      status: content.getStatus(),
      qualityScore: content.getQualityScore()?.getValue(),
      metadata: content.getMetadata(),
      createdAt: content.getCreatedAt(),
      updatedAt: content.getUpdatedAt()
    };
  }
}