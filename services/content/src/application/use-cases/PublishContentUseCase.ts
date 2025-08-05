import { ContentRepository } from '@domain/repositories/ContentRepository.js';
import { EventPublisher, ContentPublishedEvent } from '../interfaces/EventPublisher.js';
import { ContentResponse } from '../dto/ContentDTO.js';

export class PublishContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(request: { id: string; userId: string }): Promise<ContentResponse> {
    const { id: contentId, userId } = request;
    // 1. Find content
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }

    // 2. Check ownership
    if (content.getUserId() !== userId) {
      throw new Error('Unauthorized to publish this content');
    }

    // 3. Validate quality before publishing
    let qualityScore = content.getQualityScore();
    if (!qualityScore) {
      qualityScore = content.validateQuality();
    }

    if (!qualityScore.isAcceptable()) {
      throw new Error(`Content quality too low for publishing: ${qualityScore.toString()}`);
    }

    // 4. Publish content
    content.publish();

    // 5. Save updated content
    await this.contentRepository.update(content);

    // 6. Publish domain event
    const event = new ContentPublishedEvent(
      content.getId(),
      content.getUserId()
    );
    await this.eventPublisher.publish(event);

    // 7. Return published content
    return {
      id: content.getId(),
      type: content.getType(),
      title: content.getTitle(),
      body: content.getBody(),
      status: content.getStatus(),
      qualityScore: qualityScore.getValue(),
      metadata: content.getMetadata(),
      createdAt: content.getCreatedAt(),
      updatedAt: content.getUpdatedAt()
    };
  }
}