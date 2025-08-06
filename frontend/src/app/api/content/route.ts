import { NextRequest, NextResponse } from 'next/server'
import { ContentStatus, ContentPlatform, ContentType } from '@/domain/entities/Content'

// Mock 콘텐츠 데이터베이스
const mockContents = [
  {
    id: '1',
    title: '2024 여름 세일 프로모션',
    description: '최대 50% 할인! 여름 시즌 특별 할인 이벤트를 놓치지 마세요.',
    type: ContentType.IMAGE,
    platform: ContentPlatform.INSTAGRAM,
    status: ContentStatus.PUBLISHED,
    content: '여름 세일 콘텐츠 내용...',
    metadata: {
      thumbnailUrl: 'https://picsum.photos/400/300?random=1',
    },
    tags: ['세일', '프로모션', '여름'],
    authorId: '1',
    createdAt: '2024-06-15T09:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
    publishedAt: '2024-06-15T10:00:00Z',
    analytics: {
      views: 15234,
      likes: 1023,
      shares: 234,
      comments: 89,
      clicks: 456,
      conversions: 23,
      engagementRate: 6.7,
    },
  },
  {
    id: '2',
    title: '신제품 출시 캠페인',
    description: '혁신적인 신제품을 소개합니다.',
    type: ContentType.VIDEO,
    platform: ContentPlatform.FACEBOOK,
    status: ContentStatus.DRAFT,
    content: '신제품 소개 콘텐츠...',
    metadata: {
      thumbnailUrl: 'https://picsum.photos/400/300?random=2',
    },
    tags: ['신제품', '출시', '혁신'],
    authorId: '1',
    createdAt: '2024-06-14T14:00:00Z',
    updatedAt: '2024-06-14T14:00:00Z',
  },
  {
    id: '3',
    title: '고객 감사 이벤트',
    description: '항상 함께해주신 고객님들께 감사의 마음을 전합니다.',
    type: ContentType.CAROUSEL,
    platform: ContentPlatform.EMAIL,
    status: ContentStatus.SCHEDULED,
    content: '감사 이벤트 콘텐츠...',
    metadata: {
      thumbnailUrl: 'https://picsum.photos/400/300?random=3',
    },
    tags: ['이벤트', '감사', '고객'],
    authorId: '2',
    createdAt: '2024-06-13T11:00:00Z',
    updatedAt: '2024-06-13T11:30:00Z',
    scheduledAt: '2024-06-20T09:00:00Z',
    analytics: {
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      clicks: 0,
      conversions: 0,
      engagementRate: 0,
    },
  },
  {
    id: '4',
    title: '브랜드 스토리 시리즈 #1',
    description: '우리 브랜드의 시작과 비전을 공유합니다.',
    type: ContentType.TEXT,
    platform: ContentPlatform.BLOG,
    status: ContentStatus.PUBLISHED,
    content: '브랜드 스토리 콘텐츠...',
    metadata: {
      thumbnailUrl: 'https://picsum.photos/400/300?random=4',
    },
    tags: ['브랜드', '스토리', '비전'],
    authorId: '1',
    createdAt: '2024-06-12T10:00:00Z',
    updatedAt: '2024-06-12T15:00:00Z',
    publishedAt: '2024-06-12T15:00:00Z',
    analytics: {
      views: 8932,
      likes: 567,
      shares: 123,
      comments: 45,
      clicks: 234,
      conversions: 12,
      engagementRate: 5.2,
    },
  },
  {
    id: '5',
    title: '주간 팁: 생산성 향상 방법',
    description: '업무 효율을 높이는 5가지 실용적인 팁',
    type: ContentType.STORY,
    platform: ContentPlatform.LINKEDIN,
    status: ContentStatus.REVIEW,
    content: '생산성 팁 콘텐츠...',
    metadata: {
      thumbnailUrl: 'https://picsum.photos/400/300?random=5',
    },
    tags: ['팁', '생산성', '업무'],
    authorId: '2',
    createdAt: '2024-06-11T13:00:00Z',
    updatedAt: '2024-06-11T13:00:00Z',
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
    const platform = searchParams.getAll('platform[]')
    const type = searchParams.getAll('type[]')

    // 필터링
    let filteredContents = [...mockContents]

    // 검색어 필터
    if (search) {
      const searchLower = search.toLowerCase()
      filteredContents = filteredContents.filter(content =>
        content.title.toLowerCase().includes(searchLower) ||
        content.description?.toLowerCase().includes(searchLower) ||
        content.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // 상태 필터
    if (status.length > 0) {
      filteredContents = filteredContents.filter(content =>
        status.includes(content.status)
      )
    }

    // 플랫폼 필터
    if (platform.length > 0) {
      filteredContents = filteredContents.filter(content =>
        platform.includes(content.platform)
      )
    }

    // 유형 필터
    if (type.length > 0) {
      filteredContents = filteredContents.filter(content =>
        type.includes(content.type)
      )
    }

    // 페이지네이션
    const total = filteredContents.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedContents = filteredContents.slice(start, end)

    return NextResponse.json({
      status: 'success',
      data: {
        items: paginatedContents,
        total,
        page,
        totalPages,
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
    
    // 새 콘텐츠 생성
    const newContent = {
      id: String(mockContents.length + 1),
      ...body,
      status: ContentStatus.DRAFT,
      authorId: '1', // 현재 사용자 ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 메모리에 추가 (실제로는 데이터베이스)
    mockContents.unshift(newContent)

    return NextResponse.json({
      status: 'success',
      data: newContent,
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