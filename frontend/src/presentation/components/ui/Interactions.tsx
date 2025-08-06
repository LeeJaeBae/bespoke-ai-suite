'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// 햅틱 피드백같은 터치 반응 컨테이너
interface TouchFeedbackProps {
  children: React.ReactNode
  className?: string
  onTap?: () => void
  disabled?: boolean
  feedbackScale?: number
  springConfig?: {
    type: string
    stiffness: number
    damping: number
  }
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  className,
  onTap,
  disabled = false,
  feedbackScale = 0.97,
  springConfig = { type: "spring", stiffness: 400, damping: 25 }
}) => {
  return (
    <motion.div
      className={cn("cursor-pointer", disabled && "cursor-not-allowed opacity-50", className)}
      whileTap={disabled ? {} : { scale: feedbackScale }}
      transition={springConfig}
      onTap={disabled ? undefined : onTap}
    >
      {children}
    </motion.div>
  )
}

// 카드 호버/터치 인터랙션 (토스 스타일)
interface InteractiveCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  hoverScale?: number
  tapScale?: number
  glowOnHover?: boolean
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  className,
  onClick,
  disabled = false,
  hoverScale = 1.02,
  tapScale = 0.98,
  glowOnHover = true
}) => {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        !disabled && "cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      initial={{ scale: 1, y: 0 }}
      whileHover={disabled ? {} : { 
        scale: hoverScale, 
        y: -2,
        ...(glowOnHover && {
          boxShadow: "0 10px 25px -5px rgba(0, 176, 107, 0.1), 0 10px 10px -5px rgba(0, 176, 107, 0.04)"
        })
      }}
      whileTap={disabled ? {} : { scale: tapScale }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={disabled ? undefined : onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {glowOnHover && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-primary-400/5 to-primary-500/5 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {children}
    </motion.div>
  )
}

// PullToRefresh component removed - use standard refresh button instead

// BottomSheet component removed - use standard modal instead

// SwipeableCard component removed - use standard card with action buttons instead

// 페이지 전환 애니메이션 래퍼
interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}