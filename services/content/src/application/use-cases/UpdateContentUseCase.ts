import { ContentRepository } from '@domain/repositories/ContentRepository.js';
import { ContentStatus } from '@domain/value-objects/ContentType.js';
import { UpdateContentRequest, ContentResponse } from '../dto/ContentDTO.js';
import { EventPublisher } from '../interfaces/EventPublisher.js';

export class UpdateContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(request: UpdateContentRequest): Promise<ContentResponse> {
    const { id: contentId, userId, ...updateData } = request;
    // 1. Find content
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }

    // 2. Check ownership
    if (content.getUserId() !== userId) {
      throw new Error('Unauthorized to update this content');
    }

    // 3. Check if content can be updated
    if (content.getStatus() === ContentStatus.PUBLISHED) {
      throw new Error('Cannot update published content');
    }

    // 4. Update content
    if (updateData.title !== undefined || updateData.body !== undefined) {
      content.updateContent(
        updateData.title || content.getTitle(),
        updateData.body || content.getBody()
      );
    }

    // 5. Update metadata if provided
    if (updateData.metadata) {
      const currentMetadata = content.getMetadata();
      
      if (updateData.metadata.keywords) {
        content.addKeywords(updateData.metadata.keywords);
      }
      
      if (updateData.metadata.tags) {
        content.addTags(updateData.metadata.tags);
      }
      
      // Note: For other metadata fields, we'd need to add methods to Content entity
      // For now, we'll just update what we can
    }

    // 6. Re-validate quality
    content.validateQuality();

    // 7. Save updated content
    await this.contentRepository.update(content);

    // 8. Return updated content
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