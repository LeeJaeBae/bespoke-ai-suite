export interface AnalyticsProps {
  id: string
  entityId: string
  entityType: AnalyticsEntityType
  metrics: AnalyticsMetrics
  period: AnalyticsPeriod
  dimensions?: AnalyticsDimensions
  createdAt: Date
  updatedAt: Date
}

export enum AnalyticsEntityType {
  CONTENT = 'CONTENT',
  CAMPAIGN = 'CAMPAIGN',
  USER = 'USER',
  PLATFORM = 'PLATFORM',
}

export interface AnalyticsMetrics {
  impressions: number
  reach: number
  engagement: number
  engagementRate: number
  clicks: number
  clickThroughRate: number
  conversions: number
  conversionRate: number
  bounceRate?: number
  averageSessionDuration?: number
  shares?: number
  saves?: number
  comments?: number
  likes?: number
  followers?: number
  followersGrowth?: number
}

export interface AnalyticsPeriod {
  startDate: Date
  endDate: Date
  granularity: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
}

export interface AnalyticsDimensions {
  platform?: string
  contentType?: string
  campaignObjective?: string
  audienceSegment?: string
  device?: string
  location?: string
  ageGroup?: string
  gender?: string
}

export interface TimeSeriesData {
  timestamp: Date
  value: number
}

export class Analytics {
  private constructor(private readonly props: AnalyticsProps) {}

  static create(
    props: Omit<AnalyticsProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Analytics {
    const now = new Date()
    return new Analytics({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
  }

  static fromPersistence(props: AnalyticsProps): Analytics {
    return new Analytics(props)
  }

  get id(): string {
    return this.props.id
  }

  get entityId(): string {
    return this.props.entityId
  }

  get entityType(): AnalyticsEntityType {
    return this.props.entityType
  }

  get metrics(): AnalyticsMetrics {
    return this.props.metrics
  }

  get period(): AnalyticsPeriod {
    return this.props.period
  }

  get dimensions(): AnalyticsDimensions | undefined {
    return this.props.dimensions
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  updateMetrics(metrics: Partial<AnalyticsMetrics>): Analytics {
    return new Analytics({
      ...this.props,
      metrics: {
        ...this.props.metrics,
        ...metrics,
      },
      updatedAt: new Date(),
    })
  }

  getDuration(): number {
    return this.period.endDate.getTime() - this.period.startDate.getTime()
  }

  getGrowthRate(previousMetrics: AnalyticsMetrics, metric: keyof AnalyticsMetrics): number {
    const current = this.metrics[metric]
    const previous = previousMetrics[metric]
    
    if (typeof current !== 'number' || typeof previous !== 'number') return 0
    if (previous === 0) return current > 0 ? 100 : 0
    
    return ((current - previous) / previous) * 100
  }

  getPerformanceScore(): 'excellent' | 'good' | 'average' | 'poor' {
    const { engagementRate, conversionRate } = this.metrics
    
    if (engagementRate > 10 && conversionRate > 5) return 'excellent'
    if (engagementRate > 5 && conversionRate > 2) return 'good'
    if (engagementRate > 2 && conversionRate > 0.5) return 'average'
    return 'poor'
  }

  static aggregateMetrics(analyticsList: Analytics[]): AnalyticsMetrics {
    if (analyticsList.length === 0) {
      return {
        impressions: 0,
        reach: 0,
        engagement: 0,
        engagementRate: 0,
        clicks: 0,
        clickThroughRate: 0,
        conversions: 0,
        conversionRate: 0,
      }
    }

    const totals = analyticsList.reduce((acc, analytics) => {
      const metrics = analytics.metrics
      return {
        impressions: acc.impressions + metrics.impressions,
        reach: Math.max(acc.reach, metrics.reach), // Use max for reach to avoid double counting
        engagement: acc.engagement + metrics.engagement,
        clicks: acc.clicks + metrics.clicks,
        conversions: acc.conversions + metrics.conversions,
        shares: (acc.shares || 0) + (metrics.shares || 0),
        saves: (acc.saves || 0) + (metrics.saves || 0),
        comments: (acc.comments || 0) + (metrics.comments || 0),
        likes: (acc.likes || 0) + (metrics.likes || 0),
      }
    }, {
      impressions: 0,
      reach: 0,
      engagement: 0,
      clicks: 0,
      conversions: 0,
      shares: 0,
      saves: 0,
      comments: 0,
      likes: 0,
    })

    return {
      ...totals,
      engagementRate: totals.impressions > 0 ? (totals.engagement / totals.impressions) * 100 : 0,
      clickThroughRate: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
    }
  }

  static generateTimeSeries(
    startDate: Date,
    endDate: Date,
    granularity: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH',
    metricGenerator: (date: Date) => number
  ): TimeSeriesData[] {
    const series: TimeSeriesData[] = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      series.push({
        timestamp: new Date(current),
        value: metricGenerator(current),
      })
      
      switch (granularity) {
        case 'HOUR':
          current.setHours(current.getHours() + 1)
          break
        case 'DAY':
          current.setDate(current.getDate() + 1)
          break
        case 'WEEK':
          current.setDate(current.getDate() + 7)
          break
        case 'MONTH':
          current.setMonth(current.getMonth() + 1)
          break
      }
    }
    
    return series
  }

  toJSON() {
    return {
      id: this.id,
      entityId: this.entityId,
      entityType: this.entityType,
      metrics: this.metrics,
      period: {
        startDate: this.period.startDate.toISOString(),
        endDate: this.period.endDate.toISOString(),
        granularity: this.period.granularity,
      },
      dimensions: this.dimensions,
      performanceScore: this.getPerformanceScore(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}