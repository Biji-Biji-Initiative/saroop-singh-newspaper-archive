'use client'

import * as React from 'react'
import { getAllArticles } from '@/lib/articles-client'
import { FilterableGrid } from '@/components/composite/filterablegrid'
import { searchArticles, getDefaultSearchOptions, getDefaultSortOptions } from '@/lib/articleUtils'
import { useDebounce } from '@/hooks/useDebounce'
import type { Article, SearchOptions, SortOptions } from '@/types'

export default function ArticlesPage() {
  // State for articles and filtering
  const [allArticles, setAllArticles] = React.useState<Article[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [retry, setRetry] = React.useState(0)
  const [searchOptions, setSearchOptions] = React.useState<SearchOptions>(getDefaultSearchOptions())
  const [sortOptions, setSortOptions] = React.useState<SortOptions>(getDefaultSortOptions())

  // Debounce search query for better performance
  const debouncedSearchOptions = useDebounce(searchOptions, 300)

  // Load articles on mount
  React.useEffect(() => {
    async function loadArticles() {
      try {
        setLoading(true)
        setError(false)
        // Fetch articles from API
        const articles = await getAllArticles()
        setAllArticles(articles)
      } catch (error) {
        console.error('Failed to load articles:', error)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [retry])

  // Search and filter articles
  const searchResult = React.useMemo(() => {
    if (loading) return { articles: [], total: 0, filters: { sources: {}, people: {}, locations: {}, tags: {}, categories: {} } }
    return searchArticles(allArticles, debouncedSearchOptions, sortOptions)
  }, [allArticles, debouncedSearchOptions, sortOptions, loading])

  // Handle filter changes
  const handleSearchChange = React.useCallback((options: SearchOptions) => {
    setSearchOptions(options)
  }, [])

  const handleSortChange = React.useCallback((options: SortOptions) => {
    setSortOptions(options)
  }, [])

  const handleClearFilters = React.useCallback(() => {
    setSearchOptions(getDefaultSearchOptions())
  }, [])

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]">
      {/* Hero Section */}
      <div className="border-b border-white/10 bg-[#17241d] text-[#f8f1e4]">
        <div className="container mx-auto px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Reviewed catalogue</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-none sm:text-7xl">
            Historical Newspaper Catalogue
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            {loading ? 'Loading the reviewed catalogue…' : `Explore ${allArticles.length} active catalogue entries.`} Crops and duplicate views are entries, not independent newspaper issues, and uncertain transcriptions remain visibly under review.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:px-8 sm:py-12">
        {error ? <div role="alert" className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-6 text-center"><h2 className="font-serif text-3xl">The catalogue could not be loaded.</h2><p className="mt-3 text-sm leading-6 text-neutral-600">Nothing has been lost. Check the connection and try the catalogue again.</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-5 min-h-12 rounded-full bg-[#17241d] px-6 font-semibold text-white">Try again</button></div> :
        <FilterableGrid
          allArticles={allArticles}
          filteredArticles={searchResult.articles}
          searchOptions={searchOptions}
          sortOptions={sortOptions}
          filterCounts={searchResult.filters}
          filterLoading={loading}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
          loading={loading}
          loadingCount={12}
          cols={3}
          gap="lg"
          articleVariant="default"
          articleHover="lift"
          showContent
          filterPosition="left"
          filterVariant="glass"
          stickyFilters
          emptyState={
            <div className="col-span-full text-center py-16">
              <div className="mx-auto w-32 h-32 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                <svg
                  className="w-12 h-12 text-amber-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#17241d] mb-2">
                No articles found
              </h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                We couldn&apos;t find any articles matching your search criteria. Try adjusting your filters or search terms.
              </p>
            </div>
          }
        />}
      </div>
    </main>
  )
}
