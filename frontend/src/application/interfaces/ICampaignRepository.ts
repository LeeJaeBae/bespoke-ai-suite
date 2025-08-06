import { Campaign, CampaignStatus, CampaignObjective } from '@/domain/entities/Campaign'
import { UserId } from '@/domain/value-objects/UserId'
import { PaginatedResult, PaginationParams } from './IContentRepository'

export interface CampaignFilter {
  status?: CampaignStatus[]
  objective?: CampaignObjective[]
  ownerId?: UserId
  search?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ICampaignRepository {
  findById(id: string): Promise<Campaign | null>
  findAll(filter?: CampaignFilter, pagination?: PaginationParams): Promise<PaginatedResult<Campaign>>
  findActive(): Promise<Campaign[]>
  save(campaign: Campaign): Promise<void>
  update(campaign: Campaign): Promise<void>
  delete(id: string): Promise<void>
}