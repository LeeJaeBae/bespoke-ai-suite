'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        primary: 'bg-primary-100 text-primary-700',
        secondary: 'bg-gray-100 text-gray-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        error: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
        outline: 'border border-gray-300 text-gray-700',
      },
      size: {
        xs: 'px-2 py-0.5 text-[10px]',
        sm: 'px-2.5 py-0.5 text-body-xs',
        md: 'px-3 py-1 text-body-sm',
        lg: 'px-4 py-1.5 text-body-md',
      },
      dot: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'sm',
      dot: false,
    },
  }
)

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onAnimationStart' | 'onAnimationEnd'>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean
  onRemove?: () => void
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      dot,
      removable,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    const { style, id, ...restProps } = props
    
    return (
      <motion.span
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot }), className)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
        style={style}
        id={id}
      >
        {dot && (
          <span
            className={cn(
              'rounded-full mr-1.5',
              size === 'xs' && 'w-1 h-1',
              size === 'sm' && 'w-1.5 h-1.5',
              size === 'md' && 'w-2 h-2',
              size === 'lg' && 'w-2.5 h-2.5',
              variant === 'primary' && 'bg-primary-500',
              variant === 'secondary' && 'bg-gray-500',
              variant === 'success' && 'bg-green-500',
              variant === 'warning' && 'bg-yellow-500',
              variant === 'error' && 'bg-red-500',
              variant === 'info' && 'bg-blue-500',
              variant === 'outline' && 'bg-gray-500'
            )}
          />
        )}
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            className="ml-1.5 -mr-0.5 inline-flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
          >
            <svg
              className={cn(
                size === 'xs' && 'w-2.5 h-2.5',
                size === 'sm' && 'w-3 h-3',
                size === 'md' && 'w-3.5 h-3.5',
                size === 'lg' && 'w-4 h-4'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </motion.span>
    )
  }
)

Badge.displayName = 'Badge'

// Badge Group Component
interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'sm' | 'md' | 'lg'
  wrap?: boolean
}

const BadgeGroup = React.forwardRef<HTMLDivElement, BadgeGroupProps>(
  ({ className, gap = 'sm', wrap = true, children, ...props }, ref) => {
    const gapClasses = {
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-3',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          gapClasses[gap],
          wrap && 'flex-wrap',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

BadgeGroup.displayName = 'BadgeGroup'

// Status Badge Component (토스 스타일)
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error'
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const statusConfig = {
      active: { variant: 'success' as const, label: '활성' },
      inactive: { variant: 'secondary' as const, label: '비활성' },
      pending: { variant: 'warning' as const, label: '대기중' },
      success: { variant: 'success' as const, label: '성공' },
      error: { variant: 'error' as const, label: '실패' },
    }

    const config = statusConfig[status]

    return (
      <Badge ref={ref} variant={config.variant} dot {...props}>
        {config.label}
      </Badge>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

export { Badge, BadgeGroup, StatusBadge }