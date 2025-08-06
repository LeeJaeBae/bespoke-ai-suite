import { Analytics, AnalyticsEntityType, AnalyticsPeriod } from '@/domain/entities/Analytics'

export interface AnalyticsFilter {
  entityId?: string
  entityType?: AnalyticsEntityType
  period?: AnalyticsPeriod
  dimensions?: Record<string, string>
}

export interface IAnalyticsRepository {
  findById(id: string): Promise<Analytics | null>
  findByEntity(entityId: string, entityType: AnalyticsEntityType): Promise<Analytics[]>
  findAll(filter?: AnalyticsFilter): Promise<Analytics[]>
  save(analytics: Analytics): Promise<void>
  update(analytics: Analytics): Promise<void>
  delete(id: string): Promise<void>
  getAggregate(entityIds: string[], period: AnalyticsPeriod): Promise<Analytics | null>
}