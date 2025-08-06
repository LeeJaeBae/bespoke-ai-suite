'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'btn-base rounded-xl font-semibold transition-all duration-200 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500',
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
        outline:
          'border-2 border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500',
        ghost:
          'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500',
        destructive:
          'bg-error text-white hover:bg-red-600 focus-visible:ring-error',
        success:
          'bg-success text-white hover:bg-green-600 focus-visible:ring-success',
      },
      size: {
        xs: 'h-8 px-3 text-body-xs',
        sm: 'h-10 px-4 text-body-sm',
        md: 'h-12 px-6 text-body-md',
        lg: 'h-14 px-8 text-body-lg',
        xl: 'h-16 px-10 text-heading-sm',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      loading: {
        true: 'opacity-70 cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, fullWidth, loading }),
          !isDisabled && 'transition-transform duration-200 active:scale-[0.98] hover:scale-[1.02]',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner size={size} />
            <span>로딩중...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </div>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Loading Spinner Component
const LoadingSpinner = ({ size }: { size?: string | null }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  }

  return (
    <svg
      className={cn(
        'animate-spin',
        size ? sizeClasses[size as keyof typeof sizeClasses] : 'w-5 h-5'
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export { Button, buttonVariants }