import { ContentRepository } from '@domain/repositories/ContentRepository.js';
import { ContentResponse } from '../dto/ContentDTO.js';
import { ContentStatus } from '@domain/value-objects/ContentType.js';

export class GetContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository
  ) {}

  async execute(request: { id: string; userId?: string }): Promise<ContentResponse | null> {
    const { id: contentId, userId } = request;
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      return null;
    }

    // Check if user has access to this content (if userId provided)
    if (userId && content.getUserId() !== userId && content.getStatus() !== ContentStatus.PUBLISHED) {
      throw new Error('Unauthorized access to content');
    }

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

  async getByUser(userId: string, page: number = 1, limit: number = 10) {
    const result = await this.contentRepository.findByUser(userId, {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    return {
      contents: result.items.map(content => ({
        id: content.getId(),
        type: content.getType(),
        title: content.getTitle(),
        body: content.getBody(),
        status: content.getStatus(),
        qualityScore: content.getQualityScore()?.getValue(),
        metadata: content.getMetadata(),
        createdAt: content.getCreatedAt(),
        updatedAt: content.getUpdatedAt()
      })),
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious
      }
    };
  }
}