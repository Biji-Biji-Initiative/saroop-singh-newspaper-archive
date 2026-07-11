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

export interface GalleryContributionDetails {
  title: string
  description: string
  date?: string
  familyMember?: string
  tags: string[]
  contributorConsent: true
}

interface RestorationGridProps {
  restorations: RestorationResult[]
  originalImage: string
  onDownloadSingle: (restoration: RestorationResult) => void
  onDownloadAll: () => void
  onSubmitToGallery?: (
    selectedRestorations: RestorationResult[],
    details: GalleryContributionDetails
  ) => Promise<void>
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [contribution, setContribution] = useState({
    title: '',
    description: '',
    date: '',
    familyMember: '',
    tags: '',
    contributorConsent: false,
  })

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

  const handleSubmitToGallery = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!onSubmitToGallery) {
      return
    }

    const title = contribution.title.trim()
    if (!title) {
      setSubmissionError('Please add a short title for this memory.')
      return
    }

    if (!contribution.contributorConsent) {
      setSubmissionError(
        'Please confirm that you have permission to submit this material.'
      )
      return
    }

    const selected = restorations.filter(r => selectedRestorations.has(r.id))
    const tags = Array.from(
      new Set(
        contribution.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean)
      )
    )

    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      await onSubmitToGallery(selected, {
        title,
        description: contribution.description.trim(),
        ...(contribution.date ? { date: contribution.date } : {}),
        ...(contribution.familyMember.trim()
          ? { familyMember: contribution.familyMember.trim() }
          : {}),
        tags,
        contributorConsent: true,
      })
      setShowGalleryDialog(false)
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'We could not submit this contribution. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
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
                        Add the context that will travel with this memory.
                        Submitted restorations stay private until an archive
                        administrator approves them. You have{' '}
                        {selectedRestorations.size} restoration(s) selected.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      className="space-y-4"
                      onSubmit={handleSubmitToGallery}
                    >
                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium text-gray-900"
                          htmlFor="contribution-title"
                        >
                          Title for this memory
                        </label>
                        <input
                          id="contribution-title"
                          value={contribution.title}
                          onChange={event =>
                            setContribution(current => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          maxLength={160}
                          required
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
                          placeholder="For example: Saroop at the Selangor games"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-gray-900"
                            htmlFor="contribution-date"
                          >
                            Approximate photo date
                          </label>
                          <input
                            id="contribution-date"
                            type="date"
                            value={contribution.date}
                            onChange={event =>
                              setContribution(current => ({
                                ...current,
                                date: event.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
                          />
                          <p className="text-xs text-gray-500">
                            Leave blank if the date is unknown; we will not
                            guess it.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-gray-900"
                            htmlFor="contribution-family-member"
                          >
                            Family member or contributor
                          </label>
                          <input
                            id="contribution-family-member"
                            value={contribution.familyMember}
                            onChange={event =>
                              setContribution(current => ({
                                ...current,
                                familyMember: event.target.value,
                              }))
                            }
                            maxLength={100}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
                            placeholder="Optional"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium text-gray-900"
                          htmlFor="contribution-description"
                        >
                          Story or context
                        </label>
                        <textarea
                          id="contribution-description"
                          value={contribution.description}
                          onChange={event =>
                            setContribution(current => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          maxLength={2000}
                          rows={4}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
                          placeholder="Who is pictured, where it came from, or why it matters."
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium text-gray-900"
                          htmlFor="contribution-tags"
                        >
                          Tags
                        </label>
                        <input
                          id="contribution-tags"
                          value={contribution.tags}
                          onChange={event =>
                            setContribution(current => ({
                              ...current,
                              tags: event.target.value,
                            }))
                          }
                          maxLength={720}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
                          placeholder="athletics, Kuala Lumpur, family album"
                        />
                        <p className="text-xs text-gray-500">
                          Separate up to 12 short tags with commas.
                        </p>
                      </div>

                      <label className="flex items-start gap-3 rounded-md bg-purple-50 p-3 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={contribution.contributorConsent}
                          onChange={event =>
                            setContribution(current => ({
                              ...current,
                              contributorConsent: event.target.checked,
                            }))
                          }
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                        />
                        <span>
                          I have permission to submit this material and
                          understand it will remain private until an archive
                          administrator reviews it.
                        </span>
                      </label>

                      {submissionError && (
                        <p
                          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                          role="alert"
                        >
                          {submissionError}
                        </p>
                      )}

                      <div className="flex items-center justify-end space-x-2 pt-2">
                        <Button
                          type="button"
                          onClick={() => setShowGalleryDialog(false)}
                          variant="outline"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            isSubmitting ||
                            !contribution.title.trim() ||
                            !contribution.contributorConsent
                          }
                          className="bg-purple-600 text-white hover:bg-purple-700"
                        >
                          {isSubmitting ? 'Submitting…' : 'Submit for Review'}
                        </Button>
                      </div>
                    </form>
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
