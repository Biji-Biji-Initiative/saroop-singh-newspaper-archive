import * as React from 'react'
import { ArticleGrid, type ArticleGridProps } from './articlegrid'
import { ArticleFilters, type ArticleFiltersProps } from '@/components/ui/articlefilters'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Article, ArticleMetadata, SearchOptions, SortOptions } from '@/types'

export interface FilterableGridProps
  extends Omit<ArticleGridProps, 'articles'>,
    Pick<ArticleFiltersProps, 'filterCounts'> {
  /** All articles (unfiltered) */
  allArticles: (Article | ArticleMetadata)[]
  /** Filtered articles to display */
  filteredArticles: (Article | ArticleMetadata)[]
  /** Current search options */
  searchOptions: SearchOptions
  /** Current sort options */
  sortOptions: SortOptions
  /** Loading state for filtering */
  filterLoading?: boolean
  /** Callback when search options change */
  onSearchChange: (options: SearchOptions) => void
  /** Callback when sort options change */
  onSortChange: (options: SortOptions) => void
  /** Callback to clear all filters */
  onClearFilters: () => void
  /** Filter panel variant */
  filterVariant?: 'default' | 'glass' | 'sidebar'
  /** Filter panel layout */
  filterLayout?: 'vertical' | 'horizontal' | 'grid'
  /** Whether filters are collapsible on mobile */
  collapsibleFilters?: boolean
  /** Show filter toggle button */
  showFilterToggle?: boolean
  /** Custom filter panel position */
  filterPosition?: 'top' | 'left' | 'right'
  /** Sticky filters */
  stickyFilters?: boolean
}

/**
 * FilterableGrid component that combines article filtering with grid display
 * 
 * @example
 * ```tsx
 * <FilterableGrid
 *   allArticles={articles}
 *   filteredArticles={filteredArticles}
 *   searchOptions={searchOptions}
 *   sortOptions={sortOptions}
 *   onSearchChange={handleSearchChange}
 *   onSortChange={handleSortChange}
 *   onClearFilters={handleClearFilters}
 *   filterPosition="left"
 *   stickyFilters
 * />
 * ```
 */
export const FilterableGrid = React.forwardRef<HTMLDivElement, FilterableGridProps>(
  ({
    className,
    allArticles,
    filteredArticles,
    searchOptions,
    sortOptions,
    filterCounts,
    filterLoading = false,
    onSearchChange,
    onSortChange,
    onClearFilters,
    filterVariant = 'default',
    filterLayout = 'vertical',
    collapsibleFilters = true,
    showFilterToggle = true,
    filterPosition = 'left',
    stickyFilters = false,
    ...gridProps
  }, ref) => {
    const [showFilters, setShowFilters] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)

    // Detect mobile viewport
    React.useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Auto-show filters on desktop
    React.useEffect(() => {
      if (!isMobile && filterPosition === 'left') {
        setShowFilters(true)
      }
    }, [isMobile, filterPosition])

    const hasActiveFilters = React.useMemo(() => {
      return Boolean(
        searchOptions.query ||
        searchOptions.people?.length ||
        searchOptions.sources?.length ||
        searchOptions.locations?.length ||
        searchOptions.tags?.length ||
        searchOptions.categories?.length ||
        searchOptions.dateFrom ||
        searchOptions.dateTo
      )
    }, [searchOptions])

    const FiltersComponent = (
      <ArticleFilters
        searchOptions={searchOptions}
        sortOptions={sortOptions}
        filterCounts={filterCounts}
        loading={filterLoading}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
        onClearFilters={onClearFilters}
        variant={filterVariant}
        layout={filterLayout}
        collapsible={collapsibleFilters && isMobile}
        className={cn(
          stickyFilters && 'sticky top-4',
          filterPosition === 'left' && 'min-w-[280px] max-w-sm',
          filterPosition === 'right' && 'min-w-[280px] max-w-sm'
        )}
      />
    )

    if (filterPosition === 'top') {
      return (
        <div ref={ref} className={cn('space-y-6', className)}>
          {/* Filter Toggle Button (Mobile) */}
          {showFilterToggle && isMobile && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">
                  Articles ({filteredArticles.length})
                </h2>
                {hasActiveFilters && (
                  <span className="text-sm text-muted-foreground">
                    • Filtered
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-2 h-2" />
                )}
              </Button>
            </div>
          )}

          {/* Filters Panel */}
          {(showFilters || !isMobile) && (
            <div className={cn(
              isMobile && 'border rounded-lg'
            )}>
              {FiltersComponent}
            </div>
          )}

          {/* Results Grid */}
          <ArticleGrid
            articles={filteredArticles}
            loading={filterLoading}
            {...gridProps}
          />
        </div>
      )
    }

    return (
      <div ref={ref} className={cn('flex gap-6', className)}>
        {/* Left Sidebar Filters */}
        {filterPosition === 'left' && (
          <aside
            className={cn(
              'shrink-0',
              isMobile ? (showFilters ? 'block' : 'hidden') : 'block'
            )}
          >
            {FiltersComponent}
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Header with Filter Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                Articles ({filteredArticles.length})
              </h2>
              {hasActiveFilters && (
                <span className="text-sm text-muted-foreground">
                  • {allArticles.length - filteredArticles.length} filtered out
                </span>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            {showFilterToggle && isMobile && filterPosition === 'left' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-2 h-2" />
                )}
              </Button>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Grid */}
          <ArticleGrid
            articles={filteredArticles}
            loading={filterLoading}
            containerSize="full"
            {...gridProps}
          />
        </main>

        {/* Right Sidebar Filters */}
        {filterPosition === 'right' && (
          <aside
            className={cn(
              'shrink-0',
              isMobile ? (showFilters ? 'block' : 'hidden') : 'block'
            )}
          >
            {FiltersComponent}
          </aside>
        )}

        {/* Mobile Filter Overlay */}
        {isMobile && showFilters && (filterPosition === 'left' || filterPosition === 'right') && (
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setShowFilters(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-background border-l overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {FiltersComponent}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

FilterableGrid.displayName = 'FilterableGrid'
