import React from 'react'
import { cn } from '@/lib/utils'

interface FlexLayoutProps {
  children: React.ReactNode
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  wrap?: boolean
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: {
    sm?: Partial<Pick<FlexLayoutProps, 'direction' | 'align' | 'justify'>>
    md?: Partial<Pick<FlexLayoutProps, 'direction' | 'align' | 'justify'>>
    lg?: Partial<Pick<FlexLayoutProps, 'direction' | 'align' | 'justify'>>
  }
  className?: string
}

const directionClasses = {
  row: 'flex-row',
  col: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse'
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline'
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly'
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
}

export function FlexLayout({
  children,
  direction = 'row',
  wrap = false,
  align = 'stretch',
  justify = 'start',
  gap = 'md',
  responsive,
  className
}: FlexLayoutProps) {
  const getResponsiveClasses = () => {
    const classes = []
    
    // Base classes
    classes.push('flex')
    if (direction) classes.push(directionClasses[direction])
    if (wrap) classes.push('flex-wrap')
    if (align) classes.push(alignClasses[align])
    if (justify) classes.push(justifyClasses[justify])
    if (gap) classes.push(gapClasses[gap])
    
    // Responsive classes
    if (responsive?.sm) {
      if (responsive.sm.direction) classes.push(`sm:${directionClasses[responsive.sm.direction]}`)
      if (responsive.sm.align) classes.push(`sm:${alignClasses[responsive.sm.align]}`)
      if (responsive.sm.justify) classes.push(`sm:${justifyClasses[responsive.sm.justify]}`)
    }
    
    if (responsive?.md) {
      if (responsive.md.direction) classes.push(`md:${directionClasses[responsive.md.direction]}`)
      if (responsive.md.align) classes.push(`md:${alignClasses[responsive.md.align]}`)
      if (responsive.md.justify) classes.push(`md:${justifyClasses[responsive.md.justify]}`)
    }
    
    if (responsive?.lg) {
      if (responsive.lg.direction) classes.push(`lg:${directionClasses[responsive.lg.direction]}`)
      if (responsive.lg.align) classes.push(`lg:${alignClasses[responsive.lg.align]}`)
      if (responsive.lg.justify) classes.push(`lg:${justifyClasses[responsive.lg.justify]}`)
    }
    
    return classes.join(' ')
  }

  return (
    <div className={cn(getResponsiveClasses(), className)}>
      {children}
    </div>
  )
}

// Pre-configured flex layouts for common patterns
export function HStack({ 
  children, 
  align = 'center', 
  justify = 'start', 
  gap = 'md', 
  className 
}: { 
  children: React.ReactNode
  align?: FlexLayoutProps['align']
  justify?: FlexLayoutProps['justify']
  gap?: FlexLayoutProps['gap']
  className?: string 
}) {
  return (
    <FlexLayout 
      direction="row" 
      align={align} 
      justify={justify} 
      gap={gap} 
      className={className}
    >
      {children}
    </FlexLayout>
  )
}

export function VStack({ 
  children, 
  align = 'stretch', 
  justify = 'start', 
  gap = 'md', 
  className 
}: { 
  children: React.ReactNode
  align?: FlexLayoutProps['align']
  justify?: FlexLayoutProps['justify']
  gap?: FlexLayoutProps['gap']
  className?: string 
}) {
  return (
    <FlexLayout 
      direction="col" 
      align={align} 
      justify={justify} 
      gap={gap} 
      className={className}
    >
      {children}
    </FlexLayout>
  )
}

export function Center({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <FlexLayout 
      direction="col" 
      align="center" 
      justify="center" 
      className={className}
    >
      {children}
    </FlexLayout>
  )
}

export function Spacer({ className }: { className?: string }) {
  return <div className={cn('flex-1', className)} />
}