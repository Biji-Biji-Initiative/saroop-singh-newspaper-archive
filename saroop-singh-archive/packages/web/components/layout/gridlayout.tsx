import React from 'react'
import { cn } from '@/lib/utils'

interface GridLayoutProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const gapClasses = {
  sm: 'gap-2 sm:gap-3',
  md: 'gap-3 sm:gap-4 md:gap-6',
  lg: 'gap-4 sm:gap-6 md:gap-8',
  xl: 'gap-6 sm:gap-8 md:gap-10'
}

export function GridLayout({
  children,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md',
  className
}: GridLayoutProps) {
  const getGridCols = () => {
    const classes = []
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`)
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`)
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
    
    return classes.join(' ')
  }

  return (
    <div
      className={cn(
        'grid',
        getGridCols(),
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

// Pre-configured grid layouts for common use cases
export function ArticleGrid({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <GridLayout
      cols={{ default: 1, sm: 2, lg: 3, xl: 4 }}
      gap="lg"
      className={className}
    >
      {children}
    </GridLayout>
  )
}

export function FeatureGrid({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <GridLayout
      cols={{ default: 1, md: 2 }}
      gap="xl"
      className={className}
    >
      {children}
    </GridLayout>
  )
}

export function CompactGrid({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <GridLayout
      cols={{ default: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
      gap="sm"
      className={className}
    >
      {children}
    </GridLayout>
  )
}

// Masonry-like layout using CSS Grid
export function MasonryGrid({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        'gap-4 sm:gap-6 auto-rows-min',
        className
      )}
      style={{
        gridTemplateRows: 'masonry' // Note: Limited browser support
      }}
    >
      {children}
    </div>
  )
}