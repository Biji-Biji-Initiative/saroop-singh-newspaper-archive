import React from 'react'

export default function ArticlesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-lg w-96 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Search and Filters Skeleton */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Articles Grid Skeleton */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }, (_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ArticleCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200/50 overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-[16/9] bg-gray-200 animate-pulse" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded-lg w-full animate-pulse" />
        <div className="h-5 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded-lg w-2/3 animate-pulse" />
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
          <div className="flex space-x-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}