import { Content } from '@domain/entities/Content.js';
import { ContentRepository, ContentFilter, PaginationOptions, PaginatedResult } from '@domain/repositories/ContentRepository.js';
import { ContentModel, ContentDocument } from './models/ContentModel.js';
import { ContentType, ContentStatus } from '@domain/value-objects/ContentType.js';

export class MongoContentRepository implements ContentRepository {
  async save(content: Content): Promise<void> {
    const contentData = content.toJSON();
    
    const document = new ContentModel({
      _id: contentData.id,
      type: contentData.type,
      title: contentData.title,
      body: contentData.body,
      userId: contentData.userId,
      prompt: contentData.prompt,
      status: contentData.status,
      qualityScore: contentData.qualityScore,
      metadata: contentData.metadata,
      createdAt: contentData.createdAt,
      updatedAt: contentData.updatedAt
    });

    await document.save();
  }

  async findById(id: string): Promise<Content | null> {
    const document = await ContentModel.findById(id);
    
    if (!document) {
      return null;
    }

    return this.toDomainEntity(document);
  }

  async findByUser(userId: string, pagination: PaginationOptions): Promise<PaginatedResult<Content>> {
    return this.findAll({ userId }, pagination);
  }

  async findAll(filter: ContentFilter, pagination: PaginationOptions): Promise<PaginatedResult<Content>> {
    const query: any = {};

    if (filter.userId) {
      query.userId = filter.userId;
    }
    if (filter.type) {
      query.type = filter.type;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.tags && filter.tags.length > 0) {
      query['metadata.tags'] = { $in: filter.tags };
    }
    if (filter.fromDate) {
      query.createdAt = { ...query.createdAt, $gte: filter.fromDate };
    }
    if (filter.toDate) {
      query.createdAt = { ...query.createdAt, $lte: filter.toDate };
    }

    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      ContentModel
        .find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ContentModel.countDocuments(query)
    ]);

    const items = documents.map(doc => this.toDomainEntity(doc));
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  async update(content: Content): Promise<void> {
    const contentData = content.toJSON();
    
    await ContentModel.findByIdAndUpdate(
      contentData.id,
      {
        $set: {
          type: contentData.type,
          title: contentData.title,
          body: contentData.body,
          status: contentData.status,
          qualityScore: contentData.qualityScore,
          metadata: contentData.metadata,
          updatedAt: contentData.updatedAt
        }
      },
      { new: true }
    );
  }

  async delete(id: string): Promise<void> {
    await ContentModel.findByIdAndDelete(id);
  }

  async existsById(id: string): Promise<boolean> {
    const count = await ContentModel.countDocuments({ _id: id });
    return count > 0;
  }

  async countByUser(userId: string): Promise<number> {
    return ContentModel.countDocuments({ userId });
  }

  async findByTags(tags: string[], pagination: PaginationOptions): Promise<PaginatedResult<Content>> {
    return this.findAll({ tags }, pagination);
  }

  private toDomainEntity(document: ContentDocument): Content {
    return Content.reconstruct(
      document._id,
      document.type,
      document.title,
      document.body,
      document.userId,
      document.prompt,
      document.status,
      document.qualityScore,
      document.metadata,
      document.createdAt,
      document.updatedAt
    );
  }
}