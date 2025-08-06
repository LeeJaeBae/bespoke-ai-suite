'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// 기본 스켈레톤 컴포넌트
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200",
          "bg-[length:200%_100%] animate-pulse rounded-xl",
          "animate-[shimmer_1.5s_linear_infinite]",
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// 텍스트 스켈레톤
interface TextSkeletonProps {
  lines?: number
  className?: string
}

const TextSkeleton: React.FC<TextSkeletonProps> = ({ lines = 3, className }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 && "w-3/4",
            i === 1 && "w-full", 
            i === 2 && "w-2/3",
            i > 2 && "w-5/6"
          )}
        />
      ))}
    </div>
  )
}

// 카드 스켈레톤
interface CardSkeletonProps {
  className?: string
  showImage?: boolean
  showBadge?: boolean
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  className, 
  showImage = false,
  showBadge = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 bg-white rounded-2xl border border-gray-200 shadow-sm",
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <div className="flex items-center gap-2">
            {showBadge && <Skeleton className="h-6 w-16 rounded-full" />}
            {showBadge && <Skeleton className="h-6 w-20 rounded-full" />}
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* 이미지 영역 */}
      {showImage && (
        <Skeleton className="h-32 w-full mb-4 rounded-xl" />
      )}

      {/* 내용 */}
      <TextSkeleton lines={2} className="mb-4" />

      {/* 메트릭스 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Skeleton className="h-4 w-12 mx-auto mb-1" />
          <Skeleton className="h-5 w-16 mx-auto" />
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Skeleton className="h-4 w-10 mx-auto mb-1" />
          <Skeleton className="h-5 w-14 mx-auto" />
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-10 rounded-xl" />
        <Skeleton className="h-10 w-20 rounded-xl" />
      </div>

      {/* 푸터 */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </motion.div>
  )
}

// 리스트 아이템 스켈레톤
const ListItemSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center p-4 bg-white rounded-xl border border-gray-200",
        className
      )}
    >
      <Skeleton className="h-12 w-12 rounded-xl mr-4" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </motion.div>
  )
}

// 통계 카드 스켈레톤
const StatCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </motion.div>
  )
}

// 페이지 스켈레톤 (전체 페이지 로딩)
interface PageSkeletonProps {
  title?: string
  showStats?: boolean
  cardCount?: number
  className?: string
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({
  title = "페이지 로딩 중...",
  showStats = true,
  cardCount = 6,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("p-6", className)}
    >
      {/* 헤더 스켈레톤 */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* 통계 카드들 */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {Array.from({ length: 4 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Skeleton className="flex-1 h-12 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-12 w-32 rounded-xl" />
          <Skeleton className="h-12 w-32 rounded-xl" />
        </div>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: cardCount }, (_, i) => (
          <CardSkeleton 
            key={i} 
            showImage={i % 3 === 0}
            showBadge={true}
          />
        ))}
      </div>
    </motion.div>
  )
}

export {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  ListItemSkeleton,
  StatCardSkeleton,
  PageSkeleton,
}