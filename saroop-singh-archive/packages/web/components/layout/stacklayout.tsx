import React from 'react'
import { cn } from '@/lib/utils'

interface StackLayoutProps {
  children: React.ReactNode
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  divider?: boolean
  dividerClassName?: string
  responsive?: {
    sm?: { spacing?: StackLayoutProps['spacing'] }
    md?: { spacing?: StackLayoutProps['spacing'] }
    lg?: { spacing?: StackLayoutProps['spacing'] }
  }
  className?: string
}

const spacingClasses = {
  none: 'space-y-0',
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8',
  '2xl': 'space-y-12'
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch'
}

export function StackLayout({
  children,
  spacing = 'md',
  align = 'stretch',
  divider = false,
  dividerClassName,
  responsive,
  className
}: StackLayoutProps) {
  const getSpacingClasses = () => {
    const classes = [spacingClasses[spacing]]
    
    if (responsive?.sm?.spacing) {
      classes.push(`sm:${spacingClasses[responsive.sm.spacing]}`)
    }
    if (responsive?.md?.spacing) {
      classes.push(`md:${spacingClasses[responsive.md.spacing]}`)
    }
    if (responsive?.lg?.spacing) {
      classes.push(`lg:${spacingClasses[responsive.lg.spacing]}`)
    }
    
    return classes.join(' ')
  }

  const childrenArray = React.Children.toArray(children)

  return (
    <div
      className={cn(
        'flex flex-col',
        getSpacingClasses(),
        alignClasses[align],
        className
      )}
    >
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {divider && index < childrenArray.length - 1 && (
            <hr className={cn('border-gray-200', dividerClassName)} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Pre-configured stack layouts
export function TightStack({ 
  children, 
  className,
  ...props 
}: Omit<StackLayoutProps, 'spacing'> & { className?: string }) {
  return (
    <StackLayout spacing="sm" className={className} {...props}>
      {children}
    </StackLayout>
  )
}

export function LooseStack({ 
  children, 
  className,
  ...props 
}: Omit<StackLayoutProps, 'spacing'> & { className?: string }) {
  return (
    <StackLayout spacing="xl" className={className} {...props}>
      {children}
    </StackLayout>
  )
}

export function DividedStack({ 
  children, 
  className,
  dividerClassName,
  ...props 
}: Omit<StackLayoutProps, 'divider'> & { className?: string, dividerClassName?: string }) {
  return (
    <StackLayout 
      divider 
      dividerClassName={dividerClassName}
      className={className} 
      {...props}
    >
      {children}
    </StackLayout>
  )
}

// Responsive stack that changes spacing based on screen size
export function ResponsiveStack({ 
  children, 
  className,
  ...props 
}: StackLayoutProps & { className?: string }) {
  return (
    <StackLayout
      spacing="sm"
      responsive={{
        sm: { spacing: 'md' },
        md: { spacing: 'lg' },
        lg: { spacing: 'xl' }
      }}
      className={className}
      {...props}
    >
      {children}
    </StackLayout>
  )
}