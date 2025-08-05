import { Content } from '@domain/entities/Content.js';
import { ContentRepository } from '@domain/repositories/ContentRepository.js';
import { ContentType } from '@domain/value-objects/ContentType.js';
import { CrewAIService } from '../interfaces/CrewAIService.js';
import { EventPublisher, ContentCreatedEvent } from '../interfaces/EventPublisher.js';
import { 
  CreateContentRequest, 
  CreateContentResponse, 
  ContentResponse 
} from '../dto/ContentDTO.js';

export class CreateContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly crewAIService: CrewAIService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(request: CreateContentRequest): Promise<CreateContentResponse> {
    try {
      // 1. Generate content using Crew AI
      console.log('Generating content with Crew AI...');
      const aiContent = await this.crewAIService.generateContent({
        prompt: request.prompt,
        type: request.type,
        parameters: {
          tone: request.metadata?.tone,
          targetAudience: request.metadata?.targetAudience,
          language: request.metadata?.language || 'en',
          keywords: request.metadata?.keywords
        }
      });

      // 2. Create Content entity
      const content = Content.create({
        type: request.type,
        title: aiContent.title,
        body: aiContent.body,
        userId: request.userId,
        prompt: request.prompt,
        metadata: {
          keywords: [...(request.metadata?.keywords || []), ...aiContent.metadata.keywords],
          tags: [...(request.metadata?.tags || []), ...aiContent.metadata.tags],
          targetAudience: request.metadata?.targetAudience || 'general',
          tone: request.metadata?.tone || aiContent.metadata.suggestedTone,
          language: request.metadata?.language || 'en'
        }
      });

      // 3. Validate content quality
      const qualityScore = content.validateQuality();
      console.log(`Content quality score: ${qualityScore.toString()}`);

      if (!qualityScore.isAcceptable()) {
        // Try to improve content if quality is low
        console.log('Quality below threshold, attempting to improve...');
        const improvedBody = await this.crewAIService.improveContent(
          content.getBody(),
          aiContent.suggestions || []
        );
        content.updateContent(content.getTitle(), improvedBody);
        content.validateQuality(); // Re-validate
      }

      // 4. Save content to repository
      await this.contentRepository.save(content);

      // 5. Publish domain event
      const event = new ContentCreatedEvent(
        content.getId(),
        content.getUserId(),
        content.getType(),
        content.getTitle()
      );
      await this.eventPublisher.publish(event);

      // 6. Return response
      return {
        content: this.mapToResponse(content),
        message: 'Content created successfully'
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