'use client'

import * as React from 'react'
import Head from 'next/head'
import { cn } from '@/lib/utils'

interface ViewportMetaProps {
  title?: string
  description?: string
  preventZoom?: boolean
}

export const ViewportMeta: React.FC<ViewportMetaProps> = ({
  title = "Bespoke AI Suite",
  description = "AI 기반 콘텐츠 관리 플랫폼",
  preventZoom = true
}) => {
  return (
    <Head>
      {/* 모바일 뷰포트 최적화 */}
      <meta 
        name="viewport" 
        content={`width=device-width, initial-scale=1.0${preventZoom ? ', maximum-scale=1.0, user-scalable=no' : ''}`}
      />
      
      {/* 모바일 웹앱 최적화 */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={title} />
      
      {/* 터치 아이콘 */}
      <link rel="apple-touch-icon" href="/icon-192.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
      
      {/* PWA 매니페스트 */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* 테마 컬러 (토스 그린) */}
      <meta name="theme-color" content="#00B06B" />
      <meta name="msapplication-TileColor" content="#00B06B" />
      
      {/* SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* 소셜 미디어 최적화 */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      
      {/* 모바일 브라우저 최적화 */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="format-detection" content="address=no" />
    </Head>
  )
}

// 반응형 컨테이너 컴포넌트
interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = 'full',
  padding = true
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg', 
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  return (
    <div 
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}

// 모바일 Safe Area 래퍼 컴포넌트
interface SafeAreaWrapperProps {
  children: React.ReactNode
  className?: string
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  className,
  top = false,
  bottom = false,
  left = false,
  right = false
}) => {
  return (
    <div
      className={cn(
        top && 'safe-area-inset-top',
        bottom && 'safe-area-inset-bottom',
        left && 'safe-area-inset-left',
        right && 'safe-area-inset-right',
        className
      )}
    >
      {children}
    </div>
  )
}

// 모바일 전용 조건부 렌더링 훅
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024) // lg 브레이크포인트
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return isMobile
}

// 터치 디바이스 감지 훅
export const useIsTouch = () => {
  const [isTouch, setIsTouch] = React.useState(false)

  React.useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouch
}

// 디바이스 정보 훅
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = React.useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouch: false,
    screenWidth: 0,
    screenHeight: 0
  })

  React.useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        screenWidth: width,
        screenHeight: height
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    
    return () => window.removeEventListener('resize', updateDeviceInfo)
  }, [])

  return deviceInfo
}