import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:shadow-primary-500/30',
        destructive: 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700',
        outline: 'border-2 border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50',
        secondary: 'bg-gradient-to-b from-neutral-100 to-neutral-200 text-neutral-900 hover:from-neutral-200 hover:to-neutral-300',
        ghost: 'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900',
        link: 'text-primary-600 underline-offset-4 hover:underline hover:text-primary-700',
        premium: 'bg-gradient-to-br from-accent-400 via-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/40',
        glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-neutral-900 hover:bg-white/20',
      },
      size: {
        default: 'h-11 px-5 py-2.5 min-h-[44px] sm:h-10 sm:min-h-0',
        sm: 'h-9 rounded-lg px-4 min-h-[40px] sm:min-h-0 text-sm',
        lg: 'h-12 rounded-xl px-8 min-h-[48px] sm:h-11 sm:min-h-0 text-base',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px] sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0',
        xs: 'h-8 rounded-lg px-3 text-xs min-h-[32px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child component instead of a button */
  asChild?: boolean
  /** Loading state */
  loading?: boolean
  /** Icon to display before content */
  leftIcon?: React.ReactNode
  /** Icon to display after content */
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    // When asChild is true, we can't add extra elements
    if (asChild) {
      return (
        <Slot
          className={cn(
            buttonVariants({ variant, size }),
            loading && 'opacity-50 cursor-not-allowed',
            className
          )}
          ref={ref}
          aria-disabled={disabled || loading}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          loading && 'opacity-50 cursor-not-allowed',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon ? (
          <span className="ml-2">{rightIcon}</span>
        ) : null}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants };