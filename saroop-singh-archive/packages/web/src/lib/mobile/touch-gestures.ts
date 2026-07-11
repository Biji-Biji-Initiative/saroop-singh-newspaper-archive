'use client'

import * as React from 'react'

export interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export interface GestureEvent {
  type: 'swipe' | 'pinch' | 'tap' | 'longPress' | 'pan'
  startPoint: TouchPoint
  endPoint: TouchPoint
  distance?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  velocity?: number
  scale?: number
  duration: number
}

export interface GestureOptions {
  swipeThreshold?: number
  pinchThreshold?: number
  tapTimeThreshold?: number
  longPressThreshold?: number
  velocityThreshold?: number
}

export class TouchGestureHandler {
  private element: HTMLElement
  private options: Required<GestureOptions>
  private startTouches: TouchPoint[] = []
  private currentTouches: TouchPoint[] = []
  private gestureStartTime: number = 0
  private longPressTimer: NodeJS.Timeout | null = null

  // Callbacks
  private onSwipe?: (event: GestureEvent) => void
  private onPinch?: (event: GestureEvent) => void
  private onTap?: (event: GestureEvent) => void
  private onLongPress?: (event: GestureEvent) => void
  private onPan?: (event: GestureEvent) => void

  constructor(element: HTMLElement, options: GestureOptions = {}) {
    this.element = element
    this.options = {
      swipeThreshold: options.swipeThreshold ?? 50,
      pinchThreshold: options.pinchThreshold ?? 0.2,
      tapTimeThreshold: options.tapTimeThreshold ?? 300,
      longPressThreshold: options.longPressThreshold ?? 500,
      velocityThreshold: options.velocityThreshold ?? 0.1
    }

    this.bindEvents()
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false })
  }

  private unbindEvents() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this))
  }

  private getTouchPoint(touch: Touch): TouchPoint {
    return {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }
  }

  private getDistance(point1: TouchPoint, point2: TouchPoint): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    )
  }

  private getDirection(start: TouchPoint, end: TouchPoint): 'up' | 'down' | 'left' | 'right' {
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }

  private getVelocity(start: TouchPoint, end: TouchPoint): number {
    const distance = this.getDistance(start, end)
    const time = end.timestamp - start.timestamp
    return time > 0 ? distance / time : 0
  }

  private handleTouchStart(event: TouchEvent) {
    this.gestureStartTime = Date.now()
    this.startTouches = Array.from(event.touches).map(touch => this.getTouchPoint(touch))
    this.currentTouches = [...this.startTouches]

    // Set up long press detection
    if (this.startTouches.length === 1) {
      this.longPressTimer = setTimeout(() => {
        if (this.onLongPress && this.startTouches.length === 1) {
          const gesture: GestureEvent = {
            type: 'longPress',
            startPoint: this.startTouches[0],
            endPoint: this.currentTouches[0],
            duration: Date.now() - this.gestureStartTime
          }
          this.onLongPress(gesture)
        }
      }, this.options.longPressThreshold)
    }
  }

  private handleTouchMove(event: TouchEvent) {
    event.preventDefault() // Prevent scrolling during gesture
    
    this.currentTouches = Array.from(event.touches).map(touch => this.getTouchPoint(touch))

    // Clear long press timer on movement
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    // Handle pan gesture (single finger movement)
    if (this.startTouches.length === 1 && this.currentTouches.length === 1 && this.onPan) {
      const gesture: GestureEvent = {
        type: 'pan',
        startPoint: this.startTouches[0],
        endPoint: this.currentTouches[0],
        distance: this.getDistance(this.startTouches[0], this.currentTouches[0]),
        direction: this.getDirection(this.startTouches[0], this.currentTouches[0]),
        velocity: this.getVelocity(this.startTouches[0], this.currentTouches[0]),
        duration: Date.now() - this.gestureStartTime
      }
      this.onPan(gesture)
    }

    // Handle pinch gesture (two finger scaling)
    if (this.startTouches.length === 2 && this.currentTouches.length === 2 && this.onPinch) {
      const startDistance = this.getDistance(this.startTouches[0], this.startTouches[1])
      const currentDistance = this.getDistance(this.currentTouches[0], this.currentTouches[1])
      const scale = currentDistance / startDistance

      if (Math.abs(scale - 1) > this.options.pinchThreshold) {
        const gesture: GestureEvent = {
          type: 'pinch',
          startPoint: this.startTouches[0],
          endPoint: this.currentTouches[0],
          scale,
          duration: Date.now() - this.gestureStartTime
        }
        this.onPinch(gesture)
      }
    }
  }

  private handleTouchEnd() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    const endTime = Date.now()
    const duration = endTime - this.gestureStartTime

    // Handle tap gesture
    if (this.startTouches.length === 1 && duration < this.options.tapTimeThreshold) {
      const distance = this.getDistance(this.startTouches[0], this.currentTouches[0])
      
      if (distance < this.options.swipeThreshold && this.onTap) {
        const gesture: GestureEvent = {
          type: 'tap',
          startPoint: this.startTouches[0],
          endPoint: this.currentTouches[0],
          duration
        }
        this.onTap(gesture)
        return
      }
    }

    // Handle swipe gesture
    if (this.startTouches.length === 1 && this.onSwipe) {
      const distance = this.getDistance(this.startTouches[0], this.currentTouches[0])
      const velocity = this.getVelocity(this.startTouches[0], this.currentTouches[0])

      if (distance > this.options.swipeThreshold || velocity > this.options.velocityThreshold) {
        const gesture: GestureEvent = {
          type: 'swipe',
          startPoint: this.startTouches[0],
          endPoint: this.currentTouches[0],
          distance,
          direction: this.getDirection(this.startTouches[0], this.currentTouches[0]),
          velocity,
          duration
        }
        this.onSwipe(gesture)
      }
    }

    // Reset state
    this.startTouches = []
    this.currentTouches = []
  }

  private handleTouchCancel() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    this.startTouches = []
    this.currentTouches = []
  }

  // Public API
  public onSwipeGesture(callback: (event: GestureEvent) => void) {
    this.onSwipe = callback
    return this
  }

  public onPinchGesture(callback: (event: GestureEvent) => void) {
    this.onPinch = callback
    return this
  }

  public onTapGesture(callback: (event: GestureEvent) => void) {
    this.onTap = callback
    return this
  }

  public onLongPressGesture(callback: (event: GestureEvent) => void) {
    this.onLongPress = callback
    return this
  }

  public onPanGesture(callback: (event: GestureEvent) => void) {
    this.onPan = callback
    return this
  }

  public destroy() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }
    this.unbindEvents()
  }
}

// Hook for using touch gestures in React components
export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  options: GestureOptions = {}
) {
  const gestureHandlerRef = React.useRef<TouchGestureHandler | null>(null)

  React.useEffect(() => {
    if (elementRef.current) {
      gestureHandlerRef.current = new TouchGestureHandler(elementRef.current, options)
    }

    return () => {
      gestureHandlerRef.current?.destroy()
    }
  }, [elementRef, options])

  return {
    onSwipe: (callback: (event: GestureEvent) => void) => {
      gestureHandlerRef.current?.onSwipeGesture(callback)
    },
    onPinch: (callback: (event: GestureEvent) => void) => {
      gestureHandlerRef.current?.onPinchGesture(callback)
    },
    onTap: (callback: (event: GestureEvent) => void) => {
      gestureHandlerRef.current?.onTapGesture(callback)
    },
    onLongPress: (callback: (event: GestureEvent) => void) => {
      gestureHandlerRef.current?.onLongPressGesture(callback)
    },
    onPan: (callback: (event: GestureEvent) => void) => {
      gestureHandlerRef.current?.onPanGesture(callback)
    }
  }
}
