'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, label, description, size = 'md', ...props }, ref) => {
  const sizes = {
    sm: {
      root: 'w-8 h-5',
      thumb: 'w-3.5 h-3.5 data-[state=checked]:translate-x-3.5',
    },
    md: {
      root: 'w-11 h-6',
      thumb: 'w-5 h-5 data-[state=checked]:translate-x-5',
    },
    lg: {
      root: 'w-14 h-8',
      thumb: 'w-6 h-6 data-[state=checked]:translate-x-6',
    },
  }

  const switchElement = (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary-500 data-[state=unchecked]:bg-gray-200',
        sizes[size].root,
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform',
          'data-[state=checked]:bg-white',
          sizes[size].thumb
        )}
        asChild
      >
        <motion.span
          layout
          transition={{
            type: 'spring',
            stiffness: 700,
            damping: 30,
          }}
        />
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )

  if (!label && !description) {
    return switchElement
  }

  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="pt-0.5">{switchElement}</div>
      <div className="flex-1">
        {label && (
          <span className="text-body-md font-medium text-text-primary">
            {label}
          </span>
        )}
        {description && (
          <p className="text-body-sm text-text-secondary mt-0.5">
            {description}
          </p>
        )}
      </div>
    </label>
  )
})

Switch.displayName = 'Switch'

// Switch Group Component
interface SwitchGroupProps {
  children: React.ReactNode
  className?: string
}

const SwitchGroup = React.forwardRef<HTMLDivElement, SwitchGroupProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {children}
      </div>
    )
  }
)

SwitchGroup.displayName = 'SwitchGroup'

// Switch Card Component (토스 스타일)
interface SwitchCardProps extends SwitchProps {
  icon?: React.ReactNode
}

const SwitchCard = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchCardProps
>(({ icon, label, description, className, ...props }, ref) => {
  return (
    <div className="card p-4 hover:shadow-md transition-shadow duration-200">
      <label className="flex items-center gap-4 cursor-pointer">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-500">
            {icon}
          </div>
        )}
        <div className="flex-1">
          {label && (
            <span className="text-body-md font-medium text-text-primary block">
              {label}
            </span>
          )}
          {description && (
            <p className="text-body-sm text-text-secondary mt-0.5">
              {description}
            </p>
          )}
        </div>
        <Switch ref={ref} {...props} />
      </label>
    </div>
  )
})

SwitchCard.displayName = 'SwitchCard'

export { Switch, SwitchGroup, SwitchCard }