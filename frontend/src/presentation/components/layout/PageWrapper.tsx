'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from './Navigation'
import { Button } from '../ui/Button'
// Gesture components removed
import { InteractiveCard, TouchFeedback } from '../ui/Interactions'
import { ResponsiveContainer, SafeAreaWrapper, useDeviceInfo } from './ViewportMeta'
import { PageLoading } from '../ui/Loading'
import { useRouter } from 'next/navigation'

interface PageWrapperProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  backButton?: boolean
  onBack?: () => void
  className?: string
  // Gesture props removed
  loading?: boolean
  action?: React.ReactNode
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  subtitle,
  backButton = false,
  onBack,
  className,
  loading = false,
  action,
}) => {
  const router = useRouter()
  const deviceInfo = useDeviceInfo()

  // 기본 뒤로 가기 핸들러
  const handleBack = onBack || (() => router.back())

  // 로딩 상태
  if (loading) {
    return <PageLoading loading={true} />
  }

  const pageContent = (
    <div className={cn('min-h-screen bg-background-DEFAULT', className)}>
      {/* 헤더 */}
      <SafeAreaWrapper top>
        <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <ResponsiveContainer padding={false}>
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
              {/* 왼쪽: 뒤로 가기 버튼 */}
              {backButton && (
                <TouchFeedback>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    leftIcon={<ArrowLeft className="w-5 h-5" />}
                    className="touch-target p-2"
                  >
                    {!deviceInfo.isMobile && '뒤로'}
                  </Button>
                </TouchFeedback>
              )}

              {/* 중앙: 제목 */}
              <div className={cn('flex-1', backButton ? 'ml-2' : '', action ? 'mr-2' : '')}>
                <h1 className="text-heading-md font-bold text-text-primary truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-body-sm text-text-secondary truncate">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* 오른쪽: 액션 */}
              {action && (
                <div className="flex items-center gap-2">
                  {action}
                </div>
              )}
            </div>
          </ResponsiveContainer>
        </div>
      </SafeAreaWrapper>

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        <ResponsiveContainer>
          <SafeAreaWrapper bottom className="py-6">
            {children}
          </SafeAreaWrapper>
        </ResponsiveContainer>
      </main>

    </div>
  )

  return pageContent
}

// 카드 기반 페이지 래퍼
interface CardPageWrapperProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  backButton?: boolean
  onBack?: () => void
  className?: string
  cardClassName?: string
  loading?: boolean
  action?: React.ReactNode
}

export const CardPageWrapper: React.FC<CardPageWrapperProps> = ({
  children,
  cardClassName,
  ...pageProps
}) => {
  return (
    <PageWrapper {...pageProps}>
      <InteractiveCard className={cn('p-6 mb-6', cardClassName)}>
        {children}
      </InteractiveCard>
    </PageWrapper>
  )
}

// 리스트 페이지 래퍼
interface ListPageWrapperProps extends PageWrapperProps {
  items: React.ReactNode[]
  emptyState?: React.ReactNode
  itemClassName?: string
}

export const ListPageWrapper: React.FC<ListPageWrapperProps> = ({
  items,
  emptyState,
  itemClassName,
  children,
  ...pageProps
}) => {
  return (
    <PageWrapper {...pageProps}>
      {children}
      
      {items.length === 0 && emptyState ? (
        <div className="flex items-center justify-center py-12">
          {emptyState}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={itemClassName}
            >
              {item}
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}

// 대시보드 페이지 래퍼
interface DashboardPageWrapperProps extends PageWrapperProps {
  stats?: React.ReactNode
  widgets: React.ReactNode[]
  widgetColumns?: 1 | 2 | 3
}

export const DashboardPageWrapper: React.FC<DashboardPageWrapperProps> = ({
  stats,
  widgets,
  widgetColumns = 2,
  children,
  ...pageProps
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  return (
    <PageWrapper {...pageProps}>
      {children}
      
      {/* 통계 섹션 */}
      {stats && (
        <div className="mb-8">
          {stats}
        </div>
      )}
      
      {/* 위젯 그리드 */}
      <div className={cn('grid gap-6', gridCols[widgetColumns])}>
        {widgets.map((widget, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {widget}
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  )
}