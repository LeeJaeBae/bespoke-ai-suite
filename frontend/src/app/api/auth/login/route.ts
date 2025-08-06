import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Mock 사용자 데이터베이스
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'password123', // 실제로는 해시된 비밀번호
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

// Mock JWT 토큰 생성 (실제로는 jsonwebtoken 라이브러리 사용)
function generateMockToken(userId: string): string {
  return `mock_token_${userId}_${Date.now()}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'INVALID_INPUT',
            message: '이메일과 비밀번호를 입력해주세요.',
          },
        },
        { status: 400 }
      )
    }

    // 사용자 찾기
    const user = mockUsers.find(u => u.email === email)

    if (!user || user.password !== password) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '이메일 또는 비밀번호가 올바르지 않습니다.',
          },
        },
        { status: 401 }
      )
    }

    // 토큰 생성
    const accessToken = generateMockToken(user.id)
    const refreshToken = generateMockToken(user.id)

    // 쿠키 설정
    const cookieStore = await cookies()
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7일
    })

    // 사용자 정보 반환 (비밀번호 제외)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          ...userWithoutPassword,
          lastLoginAt: new Date().toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1시간
        },
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