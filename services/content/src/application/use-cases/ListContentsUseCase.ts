import { ContentRepository } from '@domain/repositories/ContentRepository.js';
import { ListContentRequest, ListContentResponse } from '../dto/ContentDTO.js';

export class ListContentsUseCase {
  constructor(
    private readonly contentRepository: ContentRepository
  ) {}

  async execute(request: ListContentRequest): Promise<ListContentResponse> {
    const { 
      userId,
      type,
      status,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request;

    const result = await this.contentRepository.findAll(
      {
        userId,
        type,
        status,
        tags
      },
      {
        page,
        limit,
        sortBy,
        sortOrder
      }
    );

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