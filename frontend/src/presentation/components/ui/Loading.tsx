'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// 토스 스타일 로딩 스피너
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const variantClasses = {
    primary: 'text-primary-500',
    secondary: 'text-gray-500',
    white: 'text-white'
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1, 
        repeat: Infinity, 
        ease: "linear" 
      }}
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  )
}

// 토스 스타일 로딩 도트
interface LoadingDotsProps {
  className?: string
  dotClassName?: string
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  className,
  dotClassName
}) => {
  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            "w-2 h-2 bg-primary-500 rounded-full",
            dotClassName
          )}
          animate={{
            y: [-4, 4, -4],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// 인라인 로딩 (버튼 내부 등)
interface InlineLoadingProps {
  loading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  loading,
  children,
  loadingText,
  className
}) => {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <LoadingSpinner size="sm" />
            {loadingText && (
              <span className="text-sm">{loadingText}</span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 페이지 로딩 오버레이
interface PageLoadingProps {
  loading: boolean
  message?: string
  progress?: number
  className?: string
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  loading,
  message = "로딩 중...",
  progress,
  className
}) => {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-50 bg-white/80 backdrop-blur-sm",
            "flex items-center justify-center",
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4 p-8"
          >
            <LoadingSpinner size="xl" />
            <div className="text-center">
              <p className="text-lg font-medium text-text-primary mb-1">
                {message}
              </p>
              {progress !== undefined && (
                <div className="w-64">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-text-secondary mt-2">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 상태별 로딩 애니메이션
interface StatusLoadingProps {
  status: 'loading' | 'success' | 'error' | 'warning' | 'info'
  message?: string
  className?: string
  autoHide?: boolean
  onComplete?: () => void
}

export const StatusLoading: React.FC<StatusLoadingProps> = ({
  status,
  message,
  className,
  autoHide = true,
  onComplete
}) => {
  React.useEffect(() => {
    if (autoHide && status !== 'loading' && onComplete) {
      const timer = setTimeout(onComplete, 2000)
      return () => clearTimeout(timer)
    }
  }, [status, autoHide, onComplete])

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      default:
        return {
          icon: null,
          color: 'text-primary-500',
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "flex flex-col items-center gap-3 p-6 rounded-2xl border",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.1
        }}
      >
        {status === 'loading' ? (
          <LoadingSpinner size="lg" />
        ) : Icon ? (
          <Icon className={cn("w-8 h-8", config.color)} />
        ) : null}
      </motion.div>
      
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium text-text-primary text-center"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )
}

// 스켈레톤을 대체하는 셰이머 로딩
interface ShimmerLoadingProps {
  width?: string | number
  height?: string | number
  className?: string
  variant?: 'rectangular' | 'circular' | 'text'
}

export const ShimmerLoading: React.FC<ShimmerLoadingProps> = ({
  width = "100%",
  height = "1rem",
  className,
  variant = 'rectangular'
}) => {
  const baseStyles = "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"
  
  const variantStyles = {
    rectangular: "rounded-lg",
    circular: "rounded-full",
    text: "rounded"
  }

  return (
    <motion.div
      className={cn(
        baseStyles,
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )
}

// 프로그레스 바 컴포넌트
interface ProgressBarProps {
  progress: number
  showLabel?: boolean
  label?: string
  className?: string
  animated?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  label,
  className,
  animated = true
}) => {
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-primary">
            {label || "진행률"}
          </span>
          <span className="text-sm text-text-secondary">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: animated ? 0.5 : 0,
            ease: "easeOut"
          }}
        />
      </div>
    </div>
  )
}