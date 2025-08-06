import { UserId } from '../value-objects/UserId'

export interface CampaignProps {
  id: string
  name: string
  description?: string
  objective: CampaignObjective
  status: CampaignStatus
  budget: number
  spentBudget: number
  startDate: Date
  endDate: Date
  targetAudience: TargetAudience
  contentIds: string[]
  performance: CampaignPerformance
  ownerId: UserId
  createdAt: Date
  updatedAt: Date
}

export enum CampaignObjective {
  AWARENESS = 'AWARENESS',
  CONSIDERATION = 'CONSIDERATION',
  CONVERSION = 'CONVERSION',
  RETENTION = 'RETENTION',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface TargetAudience {
  demographics: {
    ageRange?: [number, number]
    gender?: 'MALE' | 'FEMALE' | 'ALL'
    location?: string[]
  }
  interests?: string[]
  behaviors?: string[]
  customAudience?: string[]
}

export interface CampaignPerformance {
  impressions: number
  reach: number
  clicks: number
  conversions: number
  engagementRate: number
  conversionRate: number
  roi: number
  cpc: number // Cost per click
  cpm: number // Cost per mille (1000 impressions)
}

export class Campaign {
  private constructor(private readonly props: CampaignProps) {}

  static create(
    props: Omit<CampaignProps, 'id' | 'createdAt' | 'updatedAt' | 'spentBudget' | 'performance'>
  ): Campaign {
    const now = new Date()
    return new Campaign({
      ...props,
      id: crypto.randomUUID(),
      spentBudget: 0,
      performance: {
        impressions: 0,
        reach: 0,
        clicks: 0,
        conversions: 0,
        engagementRate: 0,
        conversionRate: 0,
        roi: 0,
        cpc: 0,
        cpm: 0,
      },
      createdAt: now,
      updatedAt: now,
    })
  }

  static fromPersistence(props: CampaignProps): Campaign {
    return new Campaign(props)
  }

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  get objective(): CampaignObjective {
    return this.props.objective
  }

  get status(): CampaignStatus {
    return this.props.status
  }

  get budget(): number {
    return this.props.budget
  }

  get spentBudget(): number {
    return this.props.spentBudget
  }

  get remainingBudget(): number {
    return this.budget - this.spentBudget
  }

  get budgetUtilization(): number {
    return this.budget > 0 ? (this.spentBudget / this.budget) * 100 : 0
  }

  get startDate(): Date {
    return this.props.startDate
  }

  get endDate(): Date {
    return this.props.endDate
  }

  get duration(): number {
    return Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  get progress(): number {
    const now = new Date()
    if (now < this.startDate) return 0
    if (now > this.endDate) return 100
    
    const total = this.endDate.getTime() - this.startDate.getTime()
    const elapsed = now.getTime() - this.startDate.getTime()
    return Math.round((elapsed / total) * 100)
  }

  get targetAudience(): TargetAudience {
    return this.props.targetAudience
  }

  get contentIds(): string[] {
    return this.props.contentIds
  }

  get performance(): CampaignPerformance {
    return this.props.performance
  }

  get ownerId(): UserId {
    return this.props.ownerId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  updateDetails(name: string, description?: string): Campaign {
    return new Campaign({
      ...this.props,
      name,
      description,
      updatedAt: new Date(),
    })
  }

  updateStatus(status: CampaignStatus): Campaign {
    return new Campaign({
      ...this.props,
      status,
      updatedAt: new Date(),
    })
  }

  updateBudget(budget: number): Campaign {
    return new Campaign({
      ...this.props,
      budget,
      updatedAt: new Date(),
    })
  }

  addSpending(amount: number): Campaign {
    return new Campaign({
      ...this.props,
      spentBudget: this.spentBudget + amount,
      updatedAt: new Date(),
    })
  }

  updatePerformance(performance: Partial<CampaignPerformance>): Campaign {
    return new Campaign({
      ...this.props,
      performance: {
        ...this.props.performance,
        ...performance,
      },
      updatedAt: new Date(),
    })
  }

  addContent(contentId: string): Campaign {
    if (this.contentIds.includes(contentId)) return this
    
    return new Campaign({
      ...this.props,
      contentIds: [...this.contentIds, contentId],
      updatedAt: new Date(),
    })
  }

  removeContent(contentId: string): Campaign {
    return new Campaign({
      ...this.props,
      contentIds: this.contentIds.filter(id => id !== contentId),
      updatedAt: new Date(),
    })
  }

  isActive(): boolean {
    const now = new Date()
    return (
      this.status === CampaignStatus.ACTIVE &&
      now >= this.startDate &&
      now <= this.endDate
    )
  }

  canEdit(): boolean {
    return [CampaignStatus.DRAFT, CampaignStatus.PAUSED].includes(this.status)
  }

  isOverBudget(): boolean {
    return this.spentBudget > this.budget
  }

  getPerformanceScore(): 'good' | 'average' | 'poor' {
    const { roi, conversionRate } = this.performance
    
    if (roi > 200 && conversionRate > 5) return 'good'
    if (roi > 100 && conversionRate > 2) return 'average'
    return 'poor'
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      objective: this.objective,
      status: this.status,
      budget: this.budget,
      spentBudget: this.spentBudget,
      remainingBudget: this.remainingBudget,
      budgetUtilization: this.budgetUtilization,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      duration: this.duration,
      progress: this.progress,
      targetAudience: this.targetAudience,
      contentIds: this.contentIds,
      performance: this.performance,
      performanceScore: this.getPerformanceScore(),
      ownerId: this.ownerId.toString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}