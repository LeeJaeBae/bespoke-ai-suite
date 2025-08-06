import { NextRequest, NextResponse } from 'next/server'

// Mock 분석 데이터
const mockAnalyticsData = {
  overview: {
    totalCampaigns: 4,
    activeCampaigns: 2,
    totalBudget: 14500000,
    spentBudget: 5360000,
    totalReach: 2480000,
    totalConversions: 2760,
    averageRoi: 252.1,
    averageEngagementRate: 4.3,
  },
  
  // 시간대별 성과 데이터 (최근 30일)
  timeSeriesData: Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    
    const baseReach = 50000 + Math.random() * 30000
    const baseConversions = Math.floor(baseReach * (0.02 + Math.random() * 0.03))
    const baseSpend = 150000 + Math.random() * 100000
    
    return {
      date: date.toISOString().split('T')[0],
      reach: Math.floor(baseReach + Math.sin(i / 7) * 10000),
      impressions: Math.floor(baseReach * (1.5 + Math.random() * 0.5)),
      clicks: Math.floor(baseReach * (0.03 + Math.random() * 0.02)),
      conversions: baseConversions,
      spend: Math.floor(baseSpend + Math.sin(i / 5) * 20000),
      roi: ((baseConversions * 45000) / baseSpend) * 100,
      engagementRate: 3 + Math.random() * 3,
    }
  }),
  
  // 캠페인별 성과
  campaignPerformance: [
    {
      id: '1',
      name: '2024 여름 프로모션 캠페인',
      reach: 850000,
      conversions: 1275,
      roi: 285.5,
      engagementRate: 3.4,
      spend: 3250000,
      budget: 5000000,
      status: 'ACTIVE',
      trend: 'up', // up, down, stable
    },
    {
      id: '2',
      name: '신제품 인지도 향상 캠페인',
      reach: 1350000,
      conversions: 945,
      roi: 158.2,
      engagementRate: 4.7,
      spend: 1260000,
      budget: 3000000,
      status: 'ACTIVE',
      trend: 'up',
    },
    {
      id: '3',
      name: '고객 유지 리텐션 캠페인',
      reach: 280000,
      conversions: 540,
      roi: 312.8,
      engagementRate: 5.2,
      spend: 850000,
      budget: 2000000,
      status: 'PAUSED',
      trend: 'stable',
    },
    {
      id: '4',
      name: 'B2B 리드 생성 캠페인',
      reach: 0,
      conversions: 0,
      roi: 0,
      engagementRate: 0,
      spend: 0,
      budget: 4500000,
      status: 'DRAFT',
      trend: 'stable',
    },
  ],
  
  // 채널별 성과
  channelPerformance: [
    {
      channel: 'Google Ads',
      reach: 1200000,
      conversions: 1450,
      spend: 2800000,
      roi: 267.3,
      engagementRate: 3.8,
      share: 48.4, // 전체 대비 비중
    },
    {
      channel: 'Facebook',
      reach: 850000,
      conversions: 890,
      spend: 1650000,
      roi: 234.1,
      engagementRate: 4.9,
      share: 34.3,
    },
    {
      channel: 'Instagram',
      reach: 320000,
      conversions: 320,
      spend: 670000,
      roi: 214.9,
      engagementRate: 6.2,
      share: 12.9,
    },
    {
      channel: 'YouTube',
      reach: 110000,
      conversions: 100,
      spend: 240000,
      roi: 187.5,
      engagementRate: 2.7,
      share: 4.4,
    },
  ],
  
  // 오디언스 인사이트
  audienceInsights: {
    demographics: {
      age: [
        { range: '18-24', percentage: 18.5 },
        { range: '25-34', percentage: 42.3 },
        { range: '35-44', percentage: 28.7 },
        { range: '45-54', percentage: 7.8 },
        { range: '55+', percentage: 2.7 },
      ],
      gender: [
        { type: '여성', percentage: 58.3 },
        { type: '남성', percentage: 41.7 },
      ],
      location: [
        { region: '서울', percentage: 35.2 },
        { region: '경기', percentage: 28.4 },
        { region: '부산', percentage: 12.1 },
        { region: '대구', percentage: 8.7 },
        { region: '기타', percentage: 15.6 },
      ],
    },
    interests: [
      { category: '쇼핑', percentage: 67.8 },
      { category: '패션', percentage: 54.3 },
      { category: '기술', percentage: 42.1 },
      { category: '라이프스타일', percentage: 38.9 },
      { category: '음식', percentage: 31.2 },
      { category: '여행', percentage: 28.4 },
    ],
    devices: [
      { type: '모바일', percentage: 72.5 },
      { type: '데스크톱', percentage: 23.8 },
      { type: '태블릿', percentage: 3.7 },
    ],
  },
  
  // 전환 깔때기
  conversionFunnel: [
    { stage: '노출', count: 2480000, conversionRate: 100 },
    { stage: '클릭', count: 148800, conversionRate: 6.0 },
    { stage: '방문', count: 124320, conversionRate: 83.5 },
    { stage: '관심', count: 37296, conversionRate: 30.0 },
    { stage: '고려', count: 14918, conversionRate: 40.0 },
    { stage: '구매', count: 2760, conversionRate: 18.5 },
  ],
  
  // 최근 인사이트
  insights: [
    {
      id: '1',
      type: 'optimization',
      priority: 'high',
      title: '모바일 전환율 개선 기회',
      description: '모바일 사용자의 전환율이 데스크톱 대비 23% 낮습니다. 모바일 최적화를 통해 추가 매출을 기대할 수 있습니다.',
      impact: '월 추가 매출 +₩2,450,000 예상',
      action: '모바일 랜딩페이지 최적화',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'alert',
      priority: 'medium',
      title: 'Instagram 캠페인 성과 상승',
      description: '지난 주 대비 Instagram 캠페인의 ROI가 34% 증가했습니다. 예산 증액을 검토해보세요.',
      impact: 'ROI 214.9% → 287.2%',
      action: 'Instagram 캠페인 예산 증액',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'recommendation',
      priority: 'low',
      title: '새로운 타겟 오디언스 발견',
      description: '35-44세 연령층에서 높은 전환율을 보이고 있습니다. 해당 연령층 대상 캠페인을 고려해보세요.',
      impact: '잠재 전환율 +12% 예상',
      action: '35-44세 타겟 캠페인 기획',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  
  // 예측 데이터
  predictions: {
    nextMonth: {
      expectedReach: 2850000,
      expectedConversions: 3120,
      expectedSpend: 6200000,
      expectedRoi: 268.4,
      confidence: 87.3, // 예측 신뢰도
    },
    quarterEnd: {
      expectedReach: 8500000,
      expectedConversions: 9400,
      expectedSpend: 18500000,
      expectedRoi: 275.2,
      confidence: 78.9,
    },
  },
}

export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams
    const dateRange = searchParams.get('dateRange') || '30' // 기본 30일
    const metric = searchParams.get('metric') || 'all' // 특정 메트릭만 조회
    
    // 날짜 범위에 따른 데이터 필터링 (실제로는 더 복잡한 로직)
    let responseData: any = { ...mockAnalyticsData }
    
    if (metric !== 'all') {
      // 특정 메트릭만 반환
      const allowedMetrics = ['overview', 'timeSeriesData', 'campaignPerformance', 'channelPerformance', 'audienceInsights', 'conversionFunnel', 'insights', 'predictions']
      if (allowedMetrics.includes(metric)) {
        responseData = { [metric]: mockAnalyticsData[metric as keyof typeof mockAnalyticsData] }
      }
    }
    
    // 날짜 범위에 따른 시계열 데이터 조정
    if (dateRange !== '30') {
      const days = parseInt(dateRange)
      if (!isNaN(days) && days > 0 && days <= 365) {
        responseData.timeSeriesData = mockAnalyticsData.timeSeriesData.slice(-days)
      }
    }

    return NextResponse.json({
      status: 'success',
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        dateRange: `${dateRange}일`,
      },
    })
  } catch (error) {
    console.error('Analytics API Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: '분석 데이터를 불러오는 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body
    
    // 분석 액션 처리 (예: 커스텀 리포트 생성, 인사이트 숨기기 등)
    switch (action) {
      case 'dismissInsight':
        // 인사이트 숨기기 로직
        return NextResponse.json({
          status: 'success',
          data: { message: '인사이트가 숨겨졌습니다.' },
        })
      
      case 'generateReport':
        // 커스텀 리포트 생성 로직
        return NextResponse.json({
          status: 'success',
          data: { 
            message: '리포트 생성이 시작되었습니다.',
            reportId: `report_${Date.now()}`,
          },
        })
      
      default:
        return NextResponse.json(
          {
            status: 'error',
            error: {
              code: 'INVALID_ACTION',
              message: '지원하지 않는 액션입니다.',
            },
          },
          { status: 400 }
        )
    }
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