'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  Download,
  Heart,
  ArrowLeft,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react'
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

interface ComparisonViewProps {
  restorations: RestorationResult[]
  originalImage: string
  onDownload: (restoration: RestorationResult) => void
  onFavorite: (restoration: RestorationResult) => void
  onSelect?: (restoration: RestorationResult, selected: boolean) => void
  selectedRestorations: Set<string>
  favorites: Set<string>
  className?: string
}

export function ComparisonView({
  restorations,
  originalImage,
  onDownload,
  onFavorite,
  onSelect,
  selectedRestorations,
  favorites,
  className,
}: ComparisonViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showOriginal, setShowOriginal] = useState(false)

  const currentRestoration = restorations[currentIndex]
  const isSelected = selectedRestorations.has(currentRestoration?.id)
  const isFavorited = favorites.has(currentRestoration?.id)

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : restorations.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev < restorations.length - 1 ? prev + 1 : 0))
  }

  const handleSelect = () => {
    if (onSelect && currentRestoration) {
      onSelect(currentRestoration, !isSelected)
    }
  }

  const handleFavorite = () => {
    if (currentRestoration) {
      onFavorite(currentRestoration)
    }
  }

  const handleDownload = () => {
    if (currentRestoration) {
      onDownload(currentRestoration)
    }
  }

  if (!currentRestoration) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">
          No restorations available for comparison.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Comparison Card */}
      <Card className="overflow-hidden border border-white/20 bg-white/80 shadow-xl backdrop-blur-sm">
        <div className="relative">
          {/* Main Image Display */}
          <div className="relative aspect-[4/3] bg-gray-100 sm:aspect-[16/10]">
            {/* Original Image */}
            <div
              className={cn(
                'absolute inset-0 transition-opacity duration-500',
                showOriginal ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Image
                src={originalImage}
                alt="Original"
                fill
                className="bg-gray-50 object-contain"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                priority={true}
              />
              <div className="absolute bottom-4 left-4 rounded-lg bg-black/80 px-3 py-2 text-white">
                <span className="text-sm font-medium">Original Photo</span>
              </div>
            </div>

            {/* Restored Image */}
            <div
              className={cn(
                'absolute inset-0 transition-opacity duration-500',
                showOriginal ? 'opacity-0' : 'opacity-100'
              )}
            >
              <Image
                src={currentRestoration.imageUrl}
                alt={currentRestoration.name}
                fill
                className="bg-gray-50 object-contain"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
              />
              <div className="absolute bottom-4 left-4 rounded-lg bg-blue-600/90 px-3 py-2 text-white">
                <span className="text-sm font-medium">
                  {currentRestoration.name}
                </span>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={cn(
                'absolute top-4 right-4 z-10 rounded-full bg-white/90 p-3 text-gray-700 shadow-lg transition-all duration-200 hover:bg-white',
                showOriginal && 'ring-2 ring-blue-500'
              )}
              aria-label="Toggle between original and restored"
            >
              <Eye className="h-5 w-5" />
            </button>

            {/* Selection Button */}
            {onSelect && (
              <button
                onClick={handleSelect}
                className={cn(
                  'absolute top-4 left-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200',
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                    : 'border-gray-300 bg-white/90 hover:border-blue-400 hover:bg-white'
                )}
                aria-label={
                  isSelected ? 'Deselect restoration' : 'Select restoration'
                }
              >
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            )}

            {/* Navigation */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button
                onClick={handlePrevious}
                disabled={restorations.length <= 1}
                className="ml-4 rounded-full bg-white/90 p-2 text-gray-700 shadow-lg transition-all duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Previous restoration"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={handleNext}
                disabled={restorations.length <= 1}
                className="mr-4 rounded-full bg-white/90 p-2 text-gray-700 shadow-lg transition-all duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Next restoration"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform items-center space-x-2">
            {restorations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all duration-200',
                  index === currentIndex
                    ? 'w-6 bg-white'
                    : 'bg-white/60 hover:bg-white/80'
                )}
                aria-label={`View restoration ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {currentRestoration.name}
              </h3>
              <p className="leading-relaxed text-gray-600">
                {currentRestoration.description}
              </p>

              {/* Style Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Style: {currentRestoration.style}</span>
                <span>•</span>
                <span>
                  {currentIndex + 1} of {restorations.length}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
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
                <Heart
                  className={cn('h-5 w-5', isFavorited && 'fill-current')}
                />
              </Button>

              <Button
                onClick={handleDownload}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Navigation */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {restorations.map((restoration, index) => (
          <button
            key={restoration.id}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200',
              index === currentIndex
                ? 'border-blue-600 ring-2 ring-blue-600/20'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <Image
              src={restoration.imageUrl}
              alt={restoration.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 8vw"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-200 hover:bg-black/10" />

            {/* Selection Indicator */}
            {selectedRestorations.has(restoration.id) && (
              <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                <Check className="h-2 w-2 text-white" />
              </div>
            )}

            {/* Favorite Indicator */}
            {favorites.has(restoration.id) && (
              <div className="absolute top-1 left-1">
                <Heart className="h-3 w-3 fill-current text-red-500" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Eye className="mt-0.5 h-5 w-5 text-blue-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Comparison Mode
              </p>
              <p className="text-sm text-blue-700">
                Click the eye icon or use keyboard arrows to compare the
                original with restored versions. Click the restoration thumbnail
                below to switch between the original and the AI-assisted result.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
