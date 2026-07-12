import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Common variants for article-related components
 */
export const articleCardVariants = cva(
  'group relative overflow-hidden rounded-lg border bg-card text-card-foreground transition-all duration-300 hover:shadow-md',
  {
    variants: {
      variant: {
        default: 'shadow-sm border-gray-200',
        featured: 'shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5',
        vintage: 'shadow-md border-vintage-300 bg-vintage-50/50 backdrop-blur-sm',
        glass: 'shadow-glass border-glass-border bg-glass backdrop-blur-glass-medium',
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
      hover: {
        none: '',
        subtle: 'hover:scale-[1.01]',
        lift: 'hover:scale-[1.02] hover:-translate-y-1',
        glow: 'hover:shadow-colored hover:border-primary/40',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      hover: 'subtle',
    },
  }
)

/**
 * Layout container variants
 */
export const containerVariants = cva(
  'mx-auto w-full',
  {
    variants: {
      size: {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full',
      },
      padding: {
        none: '',
        sm: 'px-4',
        md: 'px-6',
        lg: 'px-8',
      },
    },
    defaultVariants: {
      size: 'xl',
      padding: 'md',
    },
  }
)

/**
 * Grid layout variants
 */
export const gridVariants = cva(
  'grid gap-6',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        auto: 'grid-cols-[repeat(auto-fill,minmax(300px,1fr))]',
      },
      gap: {
        sm: 'gap-4',
        default: 'gap-6',
        lg: 'gap-8',
        xl: 'gap-12',
      },
    },
    defaultVariants: {
      cols: 3,
      gap: 'default',
    },
  }
)

/**
 * Text variants for consistent typography
 */
export const textVariants = cva(
  '',
  {
    variants: {
      variant: {
        h1: 'text-4xl font-bold tracking-tight lg:text-5xl',
        h2: 'text-3xl font-semibold tracking-tight',
        h3: 'text-2xl font-semibold tracking-tight',
        h4: 'text-xl font-semibold tracking-tight',
        h5: 'text-lg font-semibold tracking-tight',
        h6: 'text-base font-semibold tracking-tight',
        p: 'text-base leading-7',
        lead: 'text-xl text-muted-foreground',
        large: 'text-lg font-semibold',
        small: 'text-sm font-medium leading-none',
        muted: 'text-sm text-muted-foreground',
      },
      color: {
        default: '',
        primary: 'text-primary',
        secondary: 'text-secondary-foreground',
        destructive: 'text-destructive',
        muted: 'text-muted-foreground',
        vintage: 'text-vintage-700',
        accent: 'text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'p',
      color: 'default',
    },
  }
)

/**
 * Badge variants for tags and labels
 */
export const badgeVariants = cva(
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

/**
 * Filter variants for search and filter components
 */
export const filterVariants = cva(
  'flex flex-col gap-4 p-4 rounded-lg border bg-card',
  {
    variants: {
      variant: {
        default: 'border-gray-200',
        glass: 'border-glass-border bg-glass backdrop-blur-glass-medium',
        sidebar: 'border-r border-gray-200 bg-white/50 backdrop-blur-sm',
      },
      layout: {
        vertical: 'flex-col',
        horizontal: 'flex-row flex-wrap',
        grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      layout: 'vertical',
    },
  }
)

/**
 * Animation variants for consistent transitions
 */
export const animationVariants = cva(
  '',
  {
    variants: {
      animation: {
        none: '',
        'fade-in': 'animate-fade-in',
        'slide-in-up': 'animate-slide-in-up',
        'slide-in-left': 'animate-slide-in-left',
        'slide-in-right': 'animate-slide-in-right',
        'pulse-glow': 'animate-pulse-glow',
        float: 'animate-float',
      },
      delay: {
        none: '',
        sm: 'animation-delay-150',
        md: 'animation-delay-300',
        lg: 'animation-delay-500',
      },
    },
    defaultVariants: {
      animation: 'none',
      delay: 'none',
    },
  }
)

/**
 * Loading state variants
 */
export const loadingVariants = cva(
  'animate-pulse rounded-md bg-muted',
  {
    variants: {
      variant: {
        text: 'h-4 w-full',
        title: 'h-6 w-3/4',
        card: 'h-48 w-full',
        avatar: 'h-12 w-12 rounded-full',
        button: 'h-10 w-24',
      },
    },
    defaultVariants: {
      variant: 'text',
    },
  }
)

// Export all variant types
export type ArticleCardVariants = VariantProps<typeof articleCardVariants>
export type ContainerVariants = VariantProps<typeof containerVariants>
export type GridVariants = VariantProps<typeof gridVariants>
export type TextVariants = VariantProps<typeof textVariants>
export type BadgeVariants = VariantProps<typeof badgeVariants>
export type FilterVariants = VariantProps<typeof filterVariants>
export type AnimationVariants = VariantProps<typeof animationVariants>
export type LoadingVariants = VariantProps<typeof loadingVariants>