'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SwipeableViewsProps {
  children: React.ReactNode[]
  initialIndex?: number
  onIndexChange?: (index: number) => void
  animateHeight?: boolean
  className?: string
  containerClassName?: string
}

export function SwipeableViews({
  children,
  initialIndex = 0,
  onIndexChange,
  animateHeight = false,
  className,
  containerClassName
}: SwipeableViewsProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragCurrentX, setDragCurrentX] = useState(0)
  const [containerHeight, setContainerHeight] = useState<number | 'auto'>('auto')

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Touch/Mouse event handlers
  const handleStart = useCallback((clientX: number) => {
    setIsDragging(true)
    setDragStartX(clientX)
    setDragCurrentX(clientX)
  }, [])

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return
    setDragCurrentX(clientX)
  }, [isDragging])

  const handleEnd = useCallback(() => {
    if (!isDragging) return

    const deltaX = dragCurrentX - dragStartX
    const threshold = 50 // Minimum swipe distance
    // Determine if swipe was significant enough
    if (Math.abs(deltaX) > threshold) {
      const direction = deltaX > 0 ? -1 : 1
      const newIndex = Math.max(0, Math.min(children.length - 1, currentIndex + direction))
      
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex)
        onIndexChange?.(newIndex)
      }
    }

    setIsDragging(false)
    setDragStartX(0)
    setDragCurrentX(0)
  }, [isDragging, dragCurrentX, dragStartX, currentIndex, children.length, onIndexChange])

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX)
  }, [handleStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
    // Prevent scrolling while swiping
    if (isDragging) {
      e.preventDefault()
    }
  }, [handleMove, isDragging])

  const handleTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Mouse events (for desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX)
  }, [handleStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX)
  }, [handleMove])

  const handleMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Calculate transform based on current index and drag position
  const getTransform = () => {
    const containerWidth = containerRef.current?.offsetWidth || 0
    let translateX = -currentIndex * containerWidth

    // Add drag offset if currently dragging
    if (isDragging) {
      const dragOffset = dragCurrentX - dragStartX
      translateX += dragOffset
    }

    return `translateX(${translateX}px)`
  }

  // Update container height if animateHeight is enabled
  useEffect(() => {
    if (animateHeight && contentRef.current) {
      const activeChild = contentRef.current.children[currentIndex] as HTMLElement
      if (activeChild) {
        const height = activeChild.offsetHeight
        setContainerHeight(height)
      }
    }
  }, [currentIndex, animateHeight, children])

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden touch-pan-y', containerClassName)}
      style={animateHeight && typeof containerHeight === 'number' 
        ? { height: `${containerHeight}px`, transition: 'height 0.3s ease' }
        : undefined
      }
    >
      <div
        ref={contentRef}
        className={cn(
          'flex transition-transform duration-300 ease-out',
          isDragging && 'duration-0', // Disable transition during drag
          className
        )}
        style={{ 
          transform: getTransform(),
          width: `${children.length * 100}%`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={isDragging ? handleMouseUp : undefined}
        onMouseLeave={isDragging ? handleMouseUp : undefined}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full"
            style={{ width: `${100 / children.length}%` }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

// Dot indicator component
interface SwipeDotsProps {
  count: number
  activeIndex: number
  onDotClick?: (index: number) => void
  className?: string
}

export function SwipeDots({ 
  count, 
  activeIndex, 
  onDotClick,
  className 
}: SwipeDotsProps) {
  return (
    <div className={cn('flex items-center justify-center space-x-2 py-4', className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          onClick={() => onDotClick?.(index)}
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
            index === activeIndex
              ? 'bg-blue-600 scale-125'
              : 'bg-gray-300 hover:bg-gray-400'
          )}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  )
}

// Navigation arrows component
interface SwipeArrowsProps {
  onPrevious: () => void
  onNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  className?: string
}

export function SwipeArrows({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  className
}: SwipeArrowsProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={cn(
          'p-2 rounded-full transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
          canGoPrevious
            ? 'bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={cn(
          'p-2 rounded-full transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
          canGoNext
            ? 'bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
        aria-label="Next slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
