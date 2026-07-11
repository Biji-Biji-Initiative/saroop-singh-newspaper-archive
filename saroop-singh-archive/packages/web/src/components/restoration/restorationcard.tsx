'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Download, Heart, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RestorationResult {
  id: string;
  name: string;
  style: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
}

interface RestorationCardProps {
  restoration: RestorationResult;
  originalImage?: string;
  onDownload?: (restoration: RestorationResult) => void;
  onFavorite?: (restoration: RestorationResult) => void;
  onSelect?: (restoration: RestorationResult, selected: boolean) => void;
  isSelected?: boolean;
  isFavorited?: boolean;
  showComparison?: boolean;
  showSelection?: boolean;
  className?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleDownload = async () => {
    if (!onDownload) return;
    setIsLoading(true);
    try {
      await onDownload(restoration);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(restoration);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(restoration, !isSelected);
    }
  };

  return (
    <Card className={cn(
      'group relative overflow-hidden bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300',
      isSelected && 'ring-2 ring-blue-500 border-blue-300',
      className
    )}>
      {/* Selection Indicator */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-20">
          <button
            onClick={handleSelect}
            className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 hover:border-blue-400'
            )}
            aria-label={isSelected ? 'Deselect restoration' : 'Select restoration'}
          >
            {isSelected && <Check className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {showComparison && originalImage ? (
          <div className="relative w-full h-full">
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
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={true}
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
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
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute bottom-2 left-2 bg-blue-600/80 text-white px-2 py-1 rounded text-xs">
                {restoration.name}
              </div>
            </div>

            {/* Comparison Toggle Button */}
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 z-10"
              aria-label="Toggle comparison"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Image
            src={restoration.imageUrl}
            alt={restoration.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{restoration.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{restoration.description}</p>
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
            <Download className="w-4 h-4 mr-2" />
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
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
