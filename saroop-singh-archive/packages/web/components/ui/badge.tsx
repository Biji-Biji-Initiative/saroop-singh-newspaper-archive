import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        vintage: 'border-vintage-300 bg-vintage-100 text-vintage-800 hover:bg-vintage-200',
        glass: 'border-glass-border bg-glass backdrop-blur-glass-light text-foreground/90',
        success: 'border-transparent bg-green text-white hover:bg-green/80',
        warning: 'border-transparent bg-coral text-white hover:bg-coral/80',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Icon to display before content */
  icon?: React.ReactNode
  /** Whether the badge is dismissible */
  dismissible?: boolean
  /** Callback when badge is dismissed */
  onDismiss?: () => void
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, dismissible, onDismiss, children, ...props }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {dismissible && onDismiss && (
          <button
            type="button"
            className="ml-1 -mr-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-ring"
            onClick={onDismiss}
            aria-label="Remove"
          >
            <span className="text-xs">×</span>
          </button>
        )}
      </div>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }