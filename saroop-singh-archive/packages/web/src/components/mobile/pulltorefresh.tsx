'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { RefreshCw, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPullDistance?: number
  refreshingText?: string
  pullText?: string
  releaseText?: string
  disabled?: boolean
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 70,
  maxPullDistance = 120,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  disabled = false,
  className
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [startY, setStartY] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)

  const isAtTop = useCallback(() => {
    if (!containerRef.current) return false
    return containerRef.current.scrollTop === 0
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop()) return
    
    setStartY(e.touches[0].clientY)
  }, [disabled, isRefreshing, isAtTop])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY === 0) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY

    // Only allow pulling down
    if (deltaY > 0 && isAtTop()) {
      e.preventDefault() // Prevent default scroll behavior
      
      setIsPulling(true)
      
      // Calculate pull distance with diminishing returns
      const rawDistance = Math.min(deltaY, maxPullDistance)
      const dampedDistance = rawDistance * 0.6 // Apply damping
      
      setPullDistance(dampedDistance)
    }
  }, [disabled, isRefreshing, startY, maxPullDistance, isAtTop])

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        // Add a small delay to make the refresh feel more natural
        setTimeout(() => {
          setIsRefreshing(false)
          setPullDistance(0)
          setIsPulling(false)
          setStartY(0)
        }, 300)
      }
    } else {
      // Reset state if threshold wasn't met
      setPullDistance(0)
      setIsPulling(false)
      setStartY(0)
    }
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh])

  // Handle scroll events to reset pull state
  const handleScroll = useCallback(() => {
    if (isPulling && !isAtTop()) {
      setPullDistance(0)
      setIsPulling(false)
      setStartY(0)
    }
  }, [isPulling, isAtTop])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const getRefreshIndicatorText = () => {
    if (isRefreshing) return refreshingText
    if (pullDistance >= threshold) return releaseText
    return pullText
  }

  const getRefreshIndicatorOpacity = () => {
    if (isRefreshing) return 1
    return Math.min(pullDistance / threshold, 1)
  }

  const getArrowRotation = () => {
    if (isRefreshing) return 0
    if (pullDistance >= threshold) return 180
    return (pullDistance / threshold) * 180
  }

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
          transition: isRefreshing || (!isPulling && pullDistance === 0) ? 'height 0.3s ease' : 'none'
        }}
      >
        <div 
          className="flex items-center space-x-2 text-gray-600"
          style={{
            opacity: getRefreshIndicatorOpacity(),
            transition: 'opacity 0.2s ease'
          }}
        >
          {isRefreshing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowDown 
              className="w-5 h-5 transition-transform duration-200" 
              style={{
                transform: `rotate(${getArrowRotation()}deg)`
              }}
            />
          )}
          <span className="text-sm font-medium">
            {getRefreshIndicatorText()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        style={{
          transform: `translateY(${Math.max(pullDistance, isRefreshing ? 60 : 0)}px)`,
          transition: isRefreshing || (!isPulling && pullDistance === 0) ? 'transform 0.3s ease' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Hook for programmatic refresh control
export function usePullToRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async (refreshFn: () => Promise<void> | void) => {
    if (isRefreshing) return

    setIsRefreshing(true)
    
    try {
      await refreshFn()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  return {
    isRefreshing,
    refresh
  }
}
