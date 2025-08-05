import { ContentRepository, ContentFilter, PaginationOptions } from '@domain/repositories/ContentRepository.js';

interface ContentDTO {
  id: string;
  type: string;
  title: string;
  body: string;
  userId: string;
  status: string;
  qualityScore?: number;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface ListContentRequest {
  filter: ContentFilter;
  pagination: PaginationOptions;
}

interface ListContentResponse {
  items: ContentDTO[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class ListContentUseCase {
  constructor(private readonly contentRepository: ContentRepository) {}

  async execute(request: ListContentRequest): Promise<ListContentResponse> {
    const result = await this.contentRepository.findAll(
      request.filter,
      request.pagination
    );

    return {
      items: result.items.map(content => content.toJSON()),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious
    };
  }
}