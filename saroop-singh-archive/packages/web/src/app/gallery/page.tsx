'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  Grid,
  List,
  Download,
  Eye,
} from 'lucide-react'
import { ResponsiveContainer } from '@/components/layout/responsivecontainer'
import { VStack } from '@/components/layout/flexlayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface GalleryItem {
  id: string
  title: string
  date: string
  familyMember?: string
  tags: string[]
  isPublic: boolean
  submittedAt: string
  thumbnailUrl: string
  restorationCount: number
}

interface GalleryResponse {
  success: boolean
  items: GalleryItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

type SortOption = 'newest' | 'oldest' | 'title'
type ViewMode = 'grid' | 'list'

function displayArchiveDate(date: string): string {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString()
}

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFamily, setSelectedFamily] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  // Get unique values for filters
  const [familyMembers, setFamilyMembers] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])

  const fetchGalleryItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: sortBy,
      })

      if (selectedFamily) params.append('family', selectedFamily)
      if (selectedTag) params.append('tag', selectedTag)

      const response = await fetch(`/api/gallery?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch gallery items')
      }

      const data: GalleryResponse = await response.json()

      setGalleryItems(data.items)
      setTotalPages(data.totalPages)
      setHasNextPage(data.hasNextPage)
      setHasPreviousPage(data.hasPreviousPage)

      // Extract unique family members and tags for filters
      const families = new Set<string>()
      const tags = new Set<string>()

      data.items.forEach(item => {
        if (item.familyMember) families.add(item.familyMember)
        item.tags.forEach(tag => tags.add(tag))
      })

      setFamilyMembers(Array.from(families).sort())
      setAvailableTags(Array.from(tags).sort())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [page, selectedFamily, selectedTag, sortBy])

  useEffect(() => {
    void fetchGalleryItems()
  }, [fetchGalleryItems])

  // Filter items by search term (client-side)
  const filteredItems = galleryItems.filter(
    item =>
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  )

  const handleDownloadItem = async (item: GalleryItem) => {
    try {
      const response = await fetch(item.thumbnailUrl)
      if (!response.ok) {
        throw new Error('Gallery image is unavailable')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${item.id}-preview`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch {
      setError('Failed to download item')
    }
  }

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage(prev => prev + 1)
    }
  }

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setPage(prev => prev - 1)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedFamily('')
    setSelectedTag('')
    setSortBy('newest')
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <ResponsiveContainer className="py-8 sm:py-12">
        <VStack gap="xl">
          {/* Header */}
          <div className="space-y-4 text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              Restoration Gallery
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 sm:text-xl">
              Browse archive-approved, AI-assisted restorations of historical
              photographs. Every result should be compared with its source image
              before reuse or publication.
            </p>
          </div>

          {/* Filters and Search */}
          <Card className="border border-white/20 bg-white/80 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Search & Filter</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or tags..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-4 pl-10 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Family Member Filter */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <User className="mr-1 h-4 w-4" />
                    Family Member
                  </label>
                  <select
                    value={selectedFamily}
                    onChange={e => setSelectedFamily(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">All Members</option>
                    {familyMembers.map(member => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tag Filter */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Tag className="mr-1 h-4 w-4" />
                    Style Tag
                  </label>
                  <select
                    value={selectedTag}
                    onChange={e => setSelectedTag(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">All Styles</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Calendar className="mr-1 h-4 w-4" />
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>

                {/* View Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    View Mode
                  </label>
                  <div className="flex items-center space-x-1 rounded-lg bg-gray-100 p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                        viewMode === 'grid'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <Grid className="mr-1 inline h-4 w-4" />
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                        viewMode === 'list'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <List className="mr-1 inline h-4 w-4" />
                      List
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <div className="text-sm text-gray-600">
                  Showing {filteredItems.length} of {galleryItems.length} items
                </div>
                <Button
                  onClick={clearFilters}
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Content */}
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-600">Loading gallery items...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-red-600">
                <p className="text-lg font-semibold">Error loading gallery</p>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={fetchGalleryItems} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-gray-500">
                <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="mb-2 text-lg font-medium">No items found</p>
                <p className="text-sm">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Gallery Items */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredItems.map(item => (
                    <Card
                      key={item.id}
                      className="group overflow-hidden border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          unoptimized
                        />
                      </div>
                      <CardContent className="space-y-3 p-4">
                        <div className="space-y-1">
                          <h3 className="line-clamp-2 font-semibold text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {displayArchiveDate(item.date)}
                          </p>
                          <p className="text-sm text-blue-600">
                            {item.restorationCount} restorations
                          </p>
                        </div>

                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => setSelectedItem(item)}
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            onClick={() => handleDownloadItem(item)}
                            size="sm"
                            variant="outline"
                            className="border border-gray-300 hover:border-blue-600 hover:text-blue-600"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map(item => (
                    <Card
                      key={item.id}
                      className="border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                              unoptimized
                            />
                          </div>

                          <div className="flex-grow space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {item.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {displayArchiveDate(item.date)} •{' '}
                                  {item.restorationCount} restorations
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => setSelectedItem(item)}
                                  size="sm"
                                  className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                                <Button
                                  onClick={() => handleDownloadItem(item)}
                                  size="sm"
                                  variant="outline"
                                  className="border border-gray-300 hover:border-blue-600 hover:text-blue-600"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                              </div>
                            </div>

                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={!hasPreviousPage}
                    variant="outline"
                  >
                    Previous
                  </Button>

                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>

                  <Button
                    onClick={handleNextPage}
                    disabled={!hasNextPage}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </VStack>
      </ResponsiveContainer>

      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={open => {
          if (!open) setSelectedItem(null)
        }}
      >
        {selectedItem && (
          <DialogContent className="block h-[calc(100dvh-1rem)] max-w-6xl overflow-hidden border-white/10 bg-neutral-950 p-0 text-white sm:h-[min(92dvh,56rem)]">
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
              <div className="relative min-h-0 overflow-hidden bg-black">
                <Image
                  src={selectedItem.thumbnailUrl}
                  alt={`${selectedItem.title}, complete archive image`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 80vw"
                  className="object-contain p-2 sm:p-4"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
                  Fit to screen · complete image
                </span>
              </div>
              <div className="border-t border-white/10 bg-neutral-900 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
                <DialogTitle className="pr-12 text-xl text-white sm:text-2xl">
                  {selectedItem.title}
                </DialogTitle>
                <DialogDescription className="mt-2 text-neutral-300">
                  {displayArchiveDate(selectedItem.date)}
                  {selectedItem.familyMember
                    ? ` · ${selectedItem.familyMember}`
                    : ''}
                </DialogDescription>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleDownloadItem(selectedItem)}
                    className="bg-white text-neutral-950 hover:bg-neutral-200"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download image
                  </Button>
                  <span className="flex min-h-10 items-center rounded-full bg-white/10 px-4 text-sm text-neutral-200">
                    {selectedItem.restorationCount} restoration
                    {selectedItem.restorationCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
