import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 리프레시 토큰 삭제
    const cookieStore = await cookies()
    cookieStore.delete('refreshToken')

    return NextResponse.json({
      status: 'success',
      data: {
        message: '로그아웃되었습니다.',
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