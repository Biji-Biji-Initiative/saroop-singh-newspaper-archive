'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Download, Heart, Eye, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RestorationResult {
  id: string
  name: string
  style: string
  description: string
  imageUrl: string
  downloadUrl: string
}

interface RestorationCardProps {
  restoration: RestorationResult
  originalImage?: string
  onDownload?: (restoration: RestorationResult) => void
  onFavorite?: (restoration: RestorationResult) => void
  onSelect?: (restoration: RestorationResult, selected: boolean) => void
  isSelected?: boolean
  isFavorited?: boolean
  showComparison?: boolean
  showSelection?: boolean
  className?: string
}

export function RestorationCard({
  restoration,
  originalImage,
  onDownload,
  onFavorite,
  onSelect,
  isSelected = false,
  isFavorited = false,
  showComparison = false,
  showSelection = false,
  className,
}: RestorationCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  const handleDownload = async () => {
    if (!onDownload) return
    setIsLoading(true)
    try {
      await onDownload(restoration)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(restoration)
    }
  }

  const handleSelect = () => {
    if (onSelect) {
      onSelect(restoration, !isSelected)
    }
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-lg',
        isSelected && 'border-blue-300 ring-2 ring-blue-500',
        className
      )}
    >
      {/* Selection Indicator */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-20">
          <button
            onClick={handleSelect}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200',
              isSelected
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white hover:border-blue-400'
            )}
            aria-label={
              isSelected ? 'Deselect restoration' : 'Select restoration'
            }
          >
            {isSelected && <Check className="h-3 w-3" />}
          </button>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {showComparison && originalImage ? (
          <div className="relative h-full w-full">
            {/* Original Image */}
            <div
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                showOriginal ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Image
                src={originalImage}
                alt="Original"
                fill
                className="bg-gray-950 object-contain p-1"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={true}
              />
              <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                Original
              </div>
            </div>

            {/* Restored Image */}
            <div
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                showOriginal ? 'opacity-0' : 'opacity-100'
              )}
            >
              <Image
                src={restoration.imageUrl}
                alt={restoration.name}
                fill
                className="bg-gray-950 object-contain p-1"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute bottom-2 left-2 rounded bg-blue-600/80 px-2 py-1 text-xs text-white">
                {restoration.name}
              </div>
            </div>

            {/* Comparison Toggle Button */}
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition-all duration-200 hover:bg-white"
              aria-label="Toggle comparison"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Image
            src={restoration.imageUrl}
            alt={restoration.name}
            fill
            className="bg-gray-950 object-contain p-1"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
      </div>

      {/* Content */}
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-1 font-semibold text-gray-900">
            {restoration.name}
          </h3>
          <p className="line-clamp-2 text-sm text-gray-600">
            {restoration.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleDownload}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="flex-1 border border-gray-300 hover:border-blue-600 hover:text-blue-600"
          >
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? 'Downloading...' : 'Download'}
          </Button>

          {onFavorite && (
            <Button
              onClick={handleFavorite}
              size="sm"
              variant="ghost"
              className={cn(
                'p-2 hover:bg-gray-100',
                isFavorited && 'text-red-500 hover:text-red-600'
              )}
              aria-label={
                isFavorited ? 'Remove from favorites' : 'Add to favorites'
              }
            >
              <Heart className={cn('h-4 w-4', isFavorited && 'fill-current')} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
