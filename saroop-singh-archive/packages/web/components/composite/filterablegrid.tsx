import * as React from 'react'
import { createPortal } from 'react-dom'
import { ArticleGrid, type ArticleGridProps } from './articlegrid'
import { ArticleFilters, type ArticleFiltersProps } from '@/components/ui/articlefilters'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Article, ArticleMetadata, SearchOptions, SortOptions } from '@/types'
import { useModalFocus } from '@/hooks/useModalFocus'

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
    // Start in the safe mobile state so hydration cannot briefly open the
    // desktop sidebar as a modal on a phone before the media query runs.
    const [isMobile, setIsMobile] = React.useState(true)
    const drawerRef = useModalFocus<HTMLElement>(isMobile && showFilters, () => setShowFilters(false))

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

    React.useEffect(() => {
      const closeForAnotherOverlay = (event: Event) => {
        if ((event as CustomEvent<string>).detail !== 'filters') setShowFilters(false)
      }
      window.addEventListener('archive:overlay-open', closeForAnotherOverlay)
      return () => window.removeEventListener('archive:overlay-open', closeForAnotherOverlay)
    }, [])

    React.useEffect(() => {
      if (!isMobile || !showFilters) return
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previousOverflow
      }
    }, [isMobile, showFilters])

    const toggleFilters = () => {
      if (!showFilters) window.dispatchEvent(new CustomEvent('archive:overlay-open', { detail: 'filters' }))
      setShowFilters(value => !value)
    }

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
        collapsible={collapsibleFilters && !isMobile}
        className={cn(
          stickyFilters && !isMobile && 'sticky top-24',
          !isMobile && filterPosition === 'left' && 'min-w-[280px] max-w-sm',
          !isMobile && filterPosition === 'right' && 'min-w-[280px] max-w-sm'
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
                onClick={toggleFilters}
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
              isMobile ? 'hidden' : 'block'
            )}
          >
            {FiltersComponent}
          </aside>
        )}

        {/* Main Content Area */}
        <section className="flex-1 min-w-0" aria-labelledby="article-results-heading">
          {/* Header with Filter Toggle */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 id="article-results-heading" className="text-lg font-semibold">
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
                onClick={toggleFilters}
                aria-expanded={showFilters}
                aria-controls="mobile-filter-drawer"
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
        </section>

        {/* Right Sidebar Filters */}
        {filterPosition === 'right' && (
          <aside
            className={cn(
              'shrink-0',
              isMobile ? 'hidden' : 'block'
            )}
          >
            {FiltersComponent}
          </aside>
        )}

        {/* Mobile Filter Overlay */}
        {isMobile && showFilters && (filterPosition === 'left' || filterPosition === 'right') && createPortal(
          <div className="fixed inset-0 z-[90] md:hidden">
            <button type="button" aria-label="Close filters" className="absolute inset-0 bg-neutral-950/65 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
            <aside ref={drawerRef} id="mobile-filter-drawer" role="dialog" aria-modal="true" aria-label="Article filters" className="absolute inset-y-0 right-0 h-[100dvh] w-[min(24rem,92vw)] overflow-y-auto border-l bg-white shadow-2xl">
              <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
                <div className="flex items-center justify-between mb-4">
                  <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary-600">Refine the archive</p><h3 className="mt-1 text-2xl font-semibold">Filters</h3></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    aria-label="Close filters"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {FiltersComponent}
              </div>
            </aside>
          </div>, document.body
        )}
      </div>
    )
  }
)

FilterableGrid.displayName = 'FilterableGrid'
