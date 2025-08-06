import { NextRequest, NextResponse } from 'next/server'
import { CampaignObjective, CampaignStatus } from '@/domain/entities/Campaign'

// Mock 캠페인 데이터베이스
const mockCampaigns = [
  {
    id: '1',
    name: '2024 여름 프로모션 캠페인',
    description: '여름 시즌 특별 할인 이벤트를 통한 신규 고객 확보 및 매출 증대',
    objective: CampaignObjective.CONVERSION,
    status: CampaignStatus.ACTIVE,
    budget: 5000000,
    spentBudget: 3250000,
    startDate: '2024-06-01T00:00:00Z',
    endDate: '2024-08-31T23:59:59Z',
    targetAudience: {
      demographics: {
        ageRange: [25, 45],
        gender: 'ALL' as const,
        location: ['서울', '경기', '부산']
      },
      interests: ['쇼핑', '패션', '라이프스타일'],
      behaviors: ['온라인 구매 빈도 높음', '모바일 활성 사용자'],
      customAudience: []
    },
    contentIds: ['1', '2', '3'],
    performance: {
      impressions: 1250000,
      reach: 850000,
      clicks: 42500,
      conversions: 1275,
      engagementRate: 3.4,
      conversionRate: 3.0,
      roi: 285.5,
      cpc: 76,
      cpm: 2600
    },
    ownerId: '1',
    createdAt: '2024-05-15T10:00:00Z',
    updatedAt: '2024-07-20T14:30:00Z',
  },
  {
    id: '2',
    name: '신제품 인지도 향상 캠페인',
    description: '새로운 제품 라인 출시에 따른 브랜드 인지도 제고 및 관심 유도',
    objective: CampaignObjective.AWARENESS,
    status: CampaignStatus.ACTIVE,
    budget: 3000000,
    spentBudget: 1260000,
    startDate: '2024-07-01T00:00:00Z',
    endDate: '2024-09-30T23:59:59Z',
    targetAudience: {
      demographics: {
        ageRange: [20, 35],
        gender: 'ALL' as const,
        location: ['전국']
      },
      interests: ['기술', '혁신', '트렌드'],
      behaviors: ['얼리어답터', 'SNS 활성 사용자'],
      customAudience: ['기존 고객 유사 타겟']
    },
    contentIds: ['4', '5'],
    performance: {
      impressions: 2100000,
      reach: 1350000,
      clicks: 63000,
      conversions: 945,
      engagementRate: 4.7,
      conversionRate: 1.5,
      roi: 158.2,
      cpc: 20,
      cpm: 600
    },
    ownerId: '1',
    createdAt: '2024-06-20T09:00:00Z',
    updatedAt: '2024-07-25T11:15:00Z',
  },
  {
    id: '3',
    name: '고객 유지 리텐션 캠페인',
    description: '기존 고객의 재구매율 향상 및 충성도 강화를 위한 맞춤형 캠페인',
    objective: CampaignObjective.RETENTION,
    status: CampaignStatus.PAUSED,
    budget: 2000000,
    spentBudget: 850000,
    startDate: '2024-05-01T00:00:00Z',
    endDate: '2024-07-31T23:59:59Z',
    targetAudience: {
      demographics: {
        ageRange: [30, 55],
        gender: 'ALL' as const,
        location: ['서울', '경기']
      },
      interests: ['브랜드 충성도', '프리미엄 제품'],
      behaviors: ['재구매 고객', 'VIP 고객'],
      customAudience: ['기존 구매 고객']
    },
    contentIds: ['6'],
    performance: {
      impressions: 450000,
      reach: 280000,
      clicks: 13500,
      conversions: 540,
      engagementRate: 5.2,
      conversionRate: 4.0,
      roi: 312.8,
      cpc: 63,
      cpm: 1900
    },
    ownerId: '1',
    createdAt: '2024-04-25T16:00:00Z',
    updatedAt: '2024-07-10T13:45:00Z',
  },
  {
    id: '4',
    name: 'B2B 리드 생성 캠페인',
    description: '기업 대상 서비스 홍보를 통한 잠재 고객 발굴 및 리드 확보',
    objective: CampaignObjective.CONSIDERATION,
    status: CampaignStatus.DRAFT,
    budget: 4500000,
    spentBudget: 0,
    startDate: '2024-08-15T00:00:00Z',
    endDate: '2024-11-15T23:59:59Z',
    targetAudience: {
      demographics: {
        ageRange: [28, 50],
        gender: 'ALL' as const,
        location: ['서울', '경기', '대전', '대구', '부산']
      },
      interests: ['B2B 솔루션', '비즈니스 효율성', '디지털 전환'],
      behaviors: ['의사결정권자', 'B2B 구매 담당자'],
      customAudience: ['업계 관계자', '잠재 기업 고객']
    },
    contentIds: [],
    performance: {
      impressions: 0,
      reach: 0,
      clicks: 0,
      conversions: 0,
      engagementRate: 0,
      conversionRate: 0,
      roi: 0,
      cpc: 0,
      cpm: 0
    },
    ownerId: '1',
    createdAt: '2024-07-30T08:00:00Z',
    updatedAt: '2024-07-30T08:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search')
    const status = searchParams.getAll('status[]')
    const objective = searchParams.getAll('objective[]')

    // 필터링
    let filteredCampaigns = [...mockCampaigns]

    // 검색어 필터
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCampaigns = filteredCampaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.description?.toLowerCase().includes(searchLower)
      )
    }

    // 상태 필터
    if (status.length > 0) {
      filteredCampaigns = filteredCampaigns.filter(campaign =>
        status.includes(campaign.status)
      )
    }

    // 목표 필터
    if (objective.length > 0) {
      filteredCampaigns = filteredCampaigns.filter(campaign =>
        objective.includes(campaign.objective)
      )
    }

    // 계산된 필드 추가
    const enrichedCampaigns = filteredCampaigns.map(campaign => {
      const remainingBudget = campaign.budget - campaign.spentBudget
      const budgetUtilization = campaign.budget > 0 ? (campaign.spentBudget / campaign.budget) * 100 : 0
      
      const startDate = new Date(campaign.startDate)
      const endDate = new Date(campaign.endDate)
      const now = new Date()
      
      let progress = 0
      if (now >= startDate && now <= endDate) {
        const total = endDate.getTime() - startDate.getTime()
        const elapsed = now.getTime() - startDate.getTime()
        progress = Math.round((elapsed / total) * 100)
      } else if (now > endDate) {
        progress = 100
      }
      
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // 성과 점수 계산
      const { roi, conversionRate } = campaign.performance
      let performanceScore: 'good' | 'average' | 'poor' = 'poor'
      if (roi > 200 && conversionRate > 5) performanceScore = 'good'
      else if (roi > 100 && conversionRate > 2) performanceScore = 'average'

      return {
        ...campaign,
        remainingBudget,
        budgetUtilization,
        progress,
        duration,
        performanceScore,
        isActive: campaign.status === CampaignStatus.ACTIVE && now >= startDate && now <= endDate,
        canEdit: [CampaignStatus.DRAFT, CampaignStatus.PAUSED].includes(campaign.status as CampaignStatus),
        isOverBudget: campaign.spentBudget > campaign.budget
      }
    })

    // 페이지네이션
    const total = enrichedCampaigns.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedCampaigns = enrichedCampaigns.slice(start, end)

    return NextResponse.json({
      status: 'success',
      data: {
        items: paginatedCampaigns,
        total,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 새 캠페인 생성
    const newCampaign = {
      id: String(mockCampaigns.length + 1),
      ...body,
      status: CampaignStatus.DRAFT,
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
      contentIds: [],
      ownerId: '1', // 현재 사용자 ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 메모리에 추가 (실제로는 데이터베이스)
    mockCampaigns.unshift(newCampaign)

    return NextResponse.json({
      status: 'success',
      data: newCampaign,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}