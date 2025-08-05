import { ContentRepository } from '@domain/repositories/ContentRepository.js';
import { ContentStatus } from '@domain/value-objects/ContentType.js';
import { EventPublisher } from '../interfaces/EventPublisher.js';

export class DeleteContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(request: { id: string; userId: string; userRole: string }): Promise<void> {
    const { id: contentId, userId, userRole } = request;
    // 1. Find content
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }

    // 2. Check ownership (admins can delete any content)
    if (content.getUserId() !== userId && userRole !== 'admin') {
      throw new Error('Unauthorized to delete this content');
    }

    // 3. Check if content can be deleted
    if (content.getStatus() === ContentStatus.PUBLISHED) {
      // For published content, we archive instead of delete
      content.archive();
      await this.contentRepository.update(content);
    } else {
      // For non-published content, we can delete
      await this.contentRepository.delete(contentId);
    }
  }
}