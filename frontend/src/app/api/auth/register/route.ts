import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Mock 사용자 데이터베이스 (메모리)
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
]

// Mock JWT 토큰 생성
function generateMockToken(userId: string): string {
  return `mock_token_${userId}_${Date.now()}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // 입력 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'INVALID_INPUT',
            message: '모든 필드를 입력해주세요.',
          },
        },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'INVALID_EMAIL',
            message: '올바른 이메일 형식이 아닙니다.',
          },
        },
        { status: 400 }
      )
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'WEAK_PASSWORD',
            message: '비밀번호는 8자 이상이어야 합니다.',
          },
        },
        { status: 400 }
      )
    }

    // 이메일 중복 검사
    const existingUser = mockUsers.find(u => u.email === email)
    if (existingUser) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'EMAIL_EXISTS',
            message: '이미 사용 중인 이메일입니다.',
          },
        },
        { status: 409 }
      )
    }

    // 새 사용자 생성
    const now = new Date().toISOString()
    const newUser = {
      id: String(mockUsers.length + 1),
      email,
      password, // 실제로는 해시 처리
      name,
      role: 'USER' as const,
      profileImage: null,
      createdAt: now,
      updatedAt: now,
    }

    // 메모리에 저장 (실제로는 데이터베이스)
    mockUsers.push(newUser)

    // 토큰 생성
    const accessToken = generateMockToken(newUser.id)
    const refreshToken = generateMockToken(newUser.id)

    // 쿠키 설정
    const cookieStore = await cookies()
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7일
    })

    // 사용자 정보 반환 (비밀번호 제외)
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      status: 'success',
      data: {
        user: userWithoutPassword,
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