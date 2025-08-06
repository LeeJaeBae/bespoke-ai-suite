import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 인증이 필요하지 않은 공개 경로
const publicPaths = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
]

// 인증된 사용자가 접근할 수 없는 경로 (로그인/회원가입 등)
const authRestrictedPaths = [
  '/login',
  '/signup',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('accessToken')?.value

  // API 경로는 별도 처리
  if (pathname.startsWith('/api/')) {
    // 보호된 API 경로
    const protectedApiPaths = [
      '/api/auth/me',
      '/api/auth/logout',
      '/api/content',
      '/api/campaigns',
      '/api/analytics',
      '/api/users',
    ]

    const isProtectedApi = protectedApiPaths.some(path => pathname.startsWith(path))
    
    if (isProtectedApi && !request.headers.get('authorization')) {
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

    return NextResponse.next()
  }

  // 정적 파일 및 특수 경로는 통과
  if (
    pathname.includes('.') || // 파일 확장자가 있는 경우 (이미지, CSS, JS 등)
    pathname.startsWith('/_next') || // Next.js 내부 경로
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // 공개 경로 확인
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // 인증되지 않은 사용자가 보호된 경로에 접근하려는 경우
  if (!isPublicPath && !accessToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // 인증된 사용자가 로그인/회원가입 페이지에 접근하려는 경우
  if (authRestrictedPaths.includes(pathname) && accessToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 루트 경로 리다이렉트
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = accessToken ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}