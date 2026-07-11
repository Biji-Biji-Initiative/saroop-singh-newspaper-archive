'use client'

import * as React from 'react'

// Extend navigator interfaces to include experimental APIs
interface NetworkConnection extends Navigator {
  connection?: {
    effectiveType?: string
    type?: string
    saveData?: boolean
  }
  mozConnection?: {
    effectiveType?: string
    type?: string
    saveData?: boolean
  }
  webkitConnection?: {
    effectiveType?: string
    type?: string
    saveData?: boolean
  }
}

interface NavigatorMemory extends Navigator {
  deviceMemory?: number
}

interface NavigatorBattery extends Navigator {
  getBattery?: () => Promise<{
    level: number
    charging: boolean
  }>
}

export interface PerformanceMetrics {
  networkSpeed: 'slow' | 'medium' | 'fast'
  deviceMemory?: number
  hardwareConcurrency: number
  connectionType?: string
  saveData?: boolean
  batteryLevel?: number
  batteryCharging?: boolean
}

export class MobilePerformanceOptimizer {
  private metrics: PerformanceMetrics | null = null

  public async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    if (this.metrics) {
      return this.metrics
    }

    const metrics: PerformanceMetrics = {
      networkSpeed: await this.detectNetworkSpeed(),
      deviceMemory: this.getDeviceMemory(),
      hardwareConcurrency: this.getHardwareConcurrency(),
      connectionType: this.getConnectionType(),
      saveData: this.getSaveDataPreference(),
      batteryLevel: await this.getBatteryLevel(),
      batteryCharging: await this.getBatteryCharging()
    }

    this.metrics = metrics
    return metrics
  }

  private async detectNetworkSpeed(): Promise<'slow' | 'medium' | 'fast'> {
    if (typeof navigator === 'undefined') return 'medium'

    const connection = (navigator as NetworkConnection).connection || (navigator as NetworkConnection).mozConnection || (navigator as NetworkConnection).webkitConnection

    if (connection) {
      const effectiveType = connection.effectiveType

      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'slow'
        case '3g':
          return 'medium'
        case '4g':
        case '5g':
          return 'fast'
        default:
          return 'medium'
      }
    }

    // Fallback: measure actual connection speed
    return this.measureConnectionSpeed()
  }

  private async measureConnectionSpeed(): Promise<'slow' | 'medium' | 'fast'> {
    try {
      const startTime = performance.now()
      // Use a small image to test connection speed
      const response = await fetch('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', {
        cache: 'no-cache'
      })
      await response.blob()
      const endTime = performance.now()
      const duration = endTime - startTime

      if (duration > 1000) return 'slow'
      if (duration > 300) return 'medium'
      return 'fast'
    } catch {
      return 'medium'
    }
  }

  private getDeviceMemory(): number | undefined {
    const nav = navigator as NavigatorMemory
    return nav.deviceMemory
  }

  private getHardwareConcurrency(): number {
    return navigator.hardwareConcurrency || 2
  }

  private getConnectionType(): string | undefined {
    const connection = (navigator as NetworkConnection).connection || (navigator as NetworkConnection).mozConnection || (navigator as NetworkConnection).webkitConnection
    return connection?.type || connection?.effectiveType
  }

  private getSaveDataPreference(): boolean | undefined {
    const connection = (navigator as NetworkConnection).connection || (navigator as NetworkConnection).mozConnection || (navigator as NetworkConnection).webkitConnection
    return connection?.saveData
  }

  private async getBatteryLevel(): Promise<number | undefined> {
    try {
      const nav = navigator as NavigatorBattery
      if (nav.getBattery) {
        const battery = await nav.getBattery()
        return battery.level
      }
      return undefined
    } catch {
      return undefined
    }
  }

  private async getBatteryCharging(): Promise<boolean | undefined> {
    try {
      const nav = navigator as NavigatorBattery
      if (nav.getBattery) {
        const battery = await nav.getBattery()
        return battery.charging
      }
      return undefined
    } catch {
      return undefined
    }
  }

  public shouldReduceAnimations(metrics?: PerformanceMetrics): boolean {
    const m = metrics || this.metrics
    if (!m) return false

    // Reduce animations on slow devices or networks
    return (
      m.networkSpeed === 'slow' ||
      (m.deviceMemory && m.deviceMemory < 4) ||
      m.hardwareConcurrency < 4 ||
      (m.batteryLevel && m.batteryLevel < 0.2 && !(m.batteryCharging === true)) ||
      m.saveData === true
    )
  }

  public shouldReduceImageQuality(metrics?: PerformanceMetrics): boolean {
    const m = metrics || this.metrics
    if (!m) return false

    return (
      m.networkSpeed === 'slow' ||
      m.saveData === true ||
      (m.deviceMemory !== undefined && m.deviceMemory < 2)
    )
  }

  public shouldLazyLoadImages(metrics?: PerformanceMetrics): boolean {
    const m = metrics || this.metrics
    if (!m) return true // Default to lazy loading

    return (
      m.networkSpeed !== 'fast' ||
      m.saveData === true ||
      (m.deviceMemory !== undefined && m.deviceMemory < 8)
    )
  }

  public getOptimalImageFormat(): 'webp' | 'jpeg' | 'avif' {
    // Check for AVIF support
    if (this.supportsImageFormat('avif')) {
      return 'avif'
    }

    // Check for WebP support
    if (this.supportsImageFormat('webp')) {
      return 'webp'
    }

    return 'jpeg'
  }

  private supportsImageFormat(format: string): boolean {
    if (typeof document === 'undefined') return false

    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1

    try {
      return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0
    } catch {
      return false
    }
  }

  public getRecommendedConcurrency(metrics?: PerformanceMetrics): number {
    const m = metrics || this.metrics
    if (!m) return 2

    // Limit concurrent requests based on device capabilities
    if (m.networkSpeed === 'slow' || (m.deviceMemory && m.deviceMemory < 2)) {
      return 1
    }

    if (m.networkSpeed === 'medium' || (m.deviceMemory && m.deviceMemory < 4)) {
      return 2
    }

    return Math.min(m.hardwareConcurrency, 4)
  }
}

// Singleton instance
let performanceOptimizer: MobilePerformanceOptimizer | null = null

export function getPerformanceOptimizer(): MobilePerformanceOptimizer {
  if (!performanceOptimizer) {
    performanceOptimizer = new MobilePerformanceOptimizer()
  }
  return performanceOptimizer
}

// React hook for performance metrics
export function usePerformanceOptimization() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const optimizer = getPerformanceOptimizer()
    
    optimizer.getPerformanceMetrics().then((m) => {
      setMetrics(m)
      setLoading(false)
    })
  }, [])

  const optimizer = getPerformanceOptimizer()

  return {
    metrics,
    loading,
    shouldReduceAnimations: metrics ? optimizer.shouldReduceAnimations(metrics) : false,
    shouldReduceImageQuality: metrics ? optimizer.shouldReduceImageQuality(metrics) : false,
    shouldLazyLoadImages: metrics ? optimizer.shouldLazyLoadImages(metrics) : true,
    optimalImageFormat: metrics ? optimizer.getOptimalImageFormat() : 'jpeg',
    recommendedConcurrency: metrics ? optimizer.getRecommendedConcurrency(metrics) : 2
  }
}

// Utility functions for immediate use
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  return mediaQuery.matches
}

export function getConnectionQuality(): 'high' | 'low' {
  if (typeof navigator === 'undefined') return 'high'
  
  const connection = (navigator as NetworkConnection).connection
  if (!connection) return 'high'
  
  return (
    connection.saveData ||
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g'
  ) ? 'low' : 'high'
}

// Performance monitoring utilities
export function measurePerformance(name: string, fn: () => Promise<void> | void): Promise<number> | number {
  const start = performance.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.then(() => {
      const end = performance.now()
      const duration = end - start
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
      return duration
    })
  } else {
    const end = performance.now()
    const duration = end - start
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
    return duration
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
