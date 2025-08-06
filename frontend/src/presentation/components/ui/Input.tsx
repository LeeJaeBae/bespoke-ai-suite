'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react'

const inputVariants = cva(
  'input-base text-body-md transition-all duration-200',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-error focus:border-error focus:ring-error',
        success: 'border-success focus:border-success focus:ring-success',
      },
      inputSize: {
        sm: 'h-10 px-3 text-body-sm',
        md: 'h-12 px-4 text-body-md',
        lg: 'h-14 px-5 text-body-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onClear?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      variant,
      inputSize,
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      onClear,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const inputId = React.useId()

    const effectiveVariant = error ? 'error' : success ? 'success' : variant
    const isPasswordType = type === 'password'
    const inputType = isPasswordType && showPassword ? 'text' : type

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="label flex items-center gap-1"
          >
            {label}
            {required && <span className="text-error">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              inputVariants({ variant: effectiveVariant, inputSize }),
              leftIcon && 'pl-10',
              (rightIcon || isPasswordType || (onClear && props.value)) && 'pr-10',
              'transition-transform duration-200',
              isFocused && 'scale-[1.01]',
              className
            )}
            disabled={disabled}
            required={required}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {onClear && props.value && !isPasswordType && (
              <button
                type="button"
                onClick={onClear}
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4L4 12M4 4L12 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            
            {isPasswordType && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}
            
            {rightIcon && !isPasswordType && rightIcon}
            
            {error && <AlertCircle className="w-5 h-5 text-error" />}
            {success && <Check className="w-5 h-5 text-success" />}
          </div>
        </div>
        
        {(hint || error || success) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-1.5 text-body-xs',
              error && 'text-error',
              success && 'text-success',
              !error && !success && 'text-text-tertiary'
            )}
          >
            {error || success || hint}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea Component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, success, hint, required, ...props }, ref) => {
    const textareaId = React.useId()
    const [isFocused, setIsFocused] = React.useState(false)

    const effectiveVariant = error ? 'error' : success ? 'success' : 'default'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="label flex items-center gap-1"
          >
            {label}
            {required && <span className="text-error">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            inputVariants({ variant: effectiveVariant }),
            'min-h-[120px] resize-y transition-transform duration-200',
            isFocused && 'scale-[1.01]',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {(hint || error || success) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-1.5 text-body-xs',
              error && 'text-error',
              success && 'text-success',
              !error && !success && 'text-text-tertiary'
            )}
          >
            {error || success || hint}
          </motion.p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Input, Textarea }