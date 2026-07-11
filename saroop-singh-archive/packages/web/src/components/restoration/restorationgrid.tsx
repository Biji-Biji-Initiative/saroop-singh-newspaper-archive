'use client'

import React, { useState } from 'react'
import { Download, BookOpen, Filter, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RestorationCard } from './restorationcard'
import { ComparisonView } from './comparisonview'
import { cn } from '@/lib/utils'

interface RestorationResult {
  id: string
  name: string
  style: string
  description: string
  imageUrl: string
  downloadUrl: string
}

interface RestorationGridProps {
  restorations: RestorationResult[]
  originalImage: string
  onDownloadSingle: (restoration: RestorationResult) => void
  onDownloadAll: () => void
  onSubmitToGallery?: (selectedRestorations: RestorationResult[]) => void
  className?: string
}

type ViewMode = 'grid' | 'comparison'

export function RestorationGrid({
  restorations,
  originalImage,
  onDownloadSingle,
  onDownloadAll,
  onSubmitToGallery,
  className,
}: RestorationGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedRestorations, setSelectedRestorations] = useState<Set<string>>(
    new Set()
  )
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showGalleryDialog, setShowGalleryDialog] = useState(false)

  const filteredRestorations = restorations

  const handleRestorationSelect = (
    restoration: RestorationResult,
    selected: boolean
  ) => {
    const newSelected = new Set(selectedRestorations)
    if (selected) {
      newSelected.add(restoration.id)
    } else {
      newSelected.delete(restoration.id)
    }
    setSelectedRestorations(newSelected)
  }

  const handleFavorite = (restoration: RestorationResult) => {
    const newFavorites = new Set(favorites)
    if (favorites.has(restoration.id)) {
      newFavorites.delete(restoration.id)
    } else {
      newFavorites.add(restoration.id)
    }
    setFavorites(newFavorites)
  }

  const handleSubmitToGallery = () => {
    if (onSubmitToGallery) {
      const selected = restorations.filter(r => selectedRestorations.has(r.id))
      onSubmitToGallery(selected)
    }
    setShowGalleryDialog(false)
  }

  const handleSelectAll = () => {
    if (selectedRestorations.size === filteredRestorations.length) {
      setSelectedRestorations(new Set())
    } else {
      setSelectedRestorations(new Set(filteredRestorations.map(r => r.id)))
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="border border-white/20 bg-white/80 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl">
                Restoration Results
              </CardTitle>
              <CardDescription>
                {restorations.length} AI-assisted restoration generated. Compare
                it with the original before using it.
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={onDownloadAll}
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>

              {onSubmitToGallery && (
                <Dialog
                  open={showGalleryDialog}
                  onOpenChange={setShowGalleryDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      disabled={selectedRestorations.size === 0}
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Submit for Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit to Archive Review</DialogTitle>
                      <DialogDescription>
                        Submitted restorations stay private until an archive
                        administrator approves them. You have{' '}
                        {selectedRestorations.size} restoration(s) selected.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-end space-x-2 pt-4">
                      <Button
                        onClick={() => setShowGalleryDialog(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitToGallery}
                        className="bg-purple-600 text-white hover:bg-purple-700"
                      >
                        Submit for Review
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Controls */}
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Grid className="mr-2 inline h-4 w-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                  viewMode === 'comparison'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <List className="mr-2 inline h-4 w-4" />
                Compare
              </button>
            </div>
          </div>

          {/* Selection Controls */}
          {onSubmitToGallery && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-sm text-gray-600">
                {selectedRestorations.size} of {filteredRestorations.length}{' '}
                selected
              </span>
              <Button
                onClick={handleSelectAll}
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
              >
                {selectedRestorations.size === filteredRestorations.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRestorations.map(restoration => (
            <RestorationCard
              key={restoration.id}
              restoration={restoration}
              originalImage={originalImage}
              onDownload={onDownloadSingle}
              onFavorite={handleFavorite}
              onSelect={onSubmitToGallery ? handleRestorationSelect : undefined}
              isSelected={selectedRestorations.has(restoration.id)}
              isFavorited={favorites.has(restoration.id)}
              showComparison={true}
              showSelection={!!onSubmitToGallery}
            />
          ))}
        </div>
      ) : (
        <ComparisonView
          restorations={filteredRestorations}
          originalImage={originalImage}
          onDownload={onDownloadSingle}
          onFavorite={handleFavorite}
          onSelect={onSubmitToGallery ? handleRestorationSelect : undefined}
          selectedRestorations={selectedRestorations}
          favorites={favorites}
        />
      )}

      {filteredRestorations.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-500">
            <Filter className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="mb-2 text-lg font-medium">No restorations found</p>
            <p className="text-sm">
              Try changing the filter to see more results.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
