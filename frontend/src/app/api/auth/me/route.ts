import { NextRequest, NextResponse } from 'next/server'

// Mock 사용자 데이터베이스
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'password123',
    name: '관리자',
    role: 'ADMIN',
    profileImage: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'password123',
    name: '사용자',
    role: 'USER',
    profileImage: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        },
        { status: 401 }
      )
    }

    // 토큰 추출
    const token = authHeader.substring(7)
    
    // Mock 토큰 검증 (실제로는 JWT 검증)
    const tokenMatch = token.match(/mock_token_(\d+)_/)
    if (!tokenMatch) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'INVALID_TOKEN',
            message: '유효하지 않은 토큰입니다.',
          },
        },
        { status: 401 }
      )
    }

    const userId = tokenMatch[1]
    const user = mockUsers.find(u => u.id === userId)

    if (!user) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      )
    }

    // 사용자 정보 반환 (비밀번호 제외)
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      status: 'success',
      data: userWithoutPassword,
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