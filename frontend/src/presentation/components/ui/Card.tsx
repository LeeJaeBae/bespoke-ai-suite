'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'outline' | 'elevated' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hoverable?: boolean
  clickable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      clickable = false,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    }

    const variantClasses = {
      default: 'card',
      outline: 'bg-transparent border-2 border-gray-200 rounded-2xl',
      elevated: 'bg-white rounded-2xl shadow-lg',
      flat: 'bg-gray-50 rounded-2xl',
    }

    const isInteractive = hoverable || clickable || !!onClick

    return (
      <motion.div
        ref={ref}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          isInteractive && 'card-hover cursor-pointer',
          className
        )}
        onClick={onClick}
        whileHover={isInteractive ? { scale: 1.02 } : {}}
        whileTap={clickable || !!onClick ? { scale: 0.98 } : {}}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children?: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    // title prop이 있으면 기존 방식, children이 있으면 children 사용
    if (children) {
      return (
        <div
          ref={ref}
          className={cn('mb-4', className)}
          {...props}
        >
          {children}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between mb-4', className)}
        {...props}
      >
        <div className="flex-1">
          {title && <h3 className="text-heading-md text-text-primary">{title}</h3>}
          {subtitle && (
            <p className="text-body-sm text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

// Card Content Component
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

// Card Footer Component
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, divider = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-6',
          divider && 'pt-4 border-t border-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

// List Card Component (토스 스타일)
interface ListCardProps extends CardProps {
  title: string
  subtitle?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  badge?: React.ReactNode
  onClick?: () => void
}

const ListCard = React.forwardRef<HTMLDivElement, ListCardProps>(
  (
    {
      title,
      subtitle,
      leftIcon,
      rightIcon,
      badge,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        variant="default"
        padding="none"
        clickable
        onClick={onClick}
        className={className}
        {...props}
      >
        <div className="flex items-center p-5">
          {leftIcon && (
            <div className="flex-shrink-0 mr-4 text-text-secondary">
              {leftIcon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-body-lg font-medium text-text-primary truncate">
                {title}
              </h4>
              {badge}
            </div>
            {subtitle && (
              <p className="text-body-sm text-text-secondary mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex-shrink-0 ml-4 text-text-tertiary">
            {rightIcon || <ChevronRight className="w-5 h-5" />}
          </div>
        </div>
      </Card>
    )
  }
)

ListCard.displayName = 'ListCard'

// Stat Card Component (토스 스타일 통계 카드)
interface StatCardProps extends CardProps {
  label: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: React.ReactNode
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, change, icon, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        variant="default"
        padding="md"
        className={className}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-body-sm text-text-secondary mb-2">{label}</p>
            <p className="text-heading-lg font-bold text-text-primary">
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    'text-body-xs font-medium',
                    change.type === 'increase' ? 'text-success' : 'text-error'
                  )}
                >
                  {change.type === 'increase' ? '↑' : '↓'} {Math.abs(change.value)}%
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 ml-4 text-primary-500">{icon}</div>
          )}
        </div>
      </Card>
    )
  }
)

StatCard.displayName = 'StatCard'

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  ListCard,
  StatCard,
}