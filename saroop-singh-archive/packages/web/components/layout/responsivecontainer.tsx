import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  center?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-none'
}

const paddingClasses = {
  none: '',
  sm: 'px-4',
  md: 'px-4 sm:px-6',
  lg: 'px-4 sm:px-6 lg:px-8'
}

export function ResponsiveContainer({
  children,
  size = 'lg',
  padding = 'md',
  center = true,
  className
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        sizeClasses[size],
        paddingClasses[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  )
}

// Utility components for common container patterns
export function ContentContainer({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <ResponsiveContainer size="lg" padding="lg" className={className}>
      {children}
    </ResponsiveContainer>
  )
}

export function NarrowContainer({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <ResponsiveContainer size="md" padding="md" className={className}>
      {children}
    </ResponsiveContainer>
  )
}

export function WideContainer({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <ResponsiveContainer size="xl" padding="lg" className={className}>
      {children}
    </ResponsiveContainer>
  )
}