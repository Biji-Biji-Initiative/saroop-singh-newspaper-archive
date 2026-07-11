import * as React from 'react'
import { ArticleCard } from '@/components/ui/articlecard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { gridVariants, type GridVariants, containerVariants } from '@/lib/styles/classNames'
import type { Article, ArticleMetadata } from '@/types'

export interface ArticleGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    GridVariants {
  /** Array of articles to display */
  articles: (Article | ArticleMetadata)[]
  /** Loading state */
  loading?: boolean
  /** Number of skeleton cards to show when loading */
  loadingCount?: number
  /** Empty state content */
  emptyState?: React.ReactNode
  /** Error state content */
  errorState?: React.ReactNode
  /** Whether to show load more button */
  showLoadMore?: boolean
  /** Loading more articles */
  loadingMore?: boolean
  /** Load more callback */
  onLoadMore?: () => void
  /** Whether articles have more content to load */
  hasMore?: boolean
  /** Infinite scroll threshold */
  infiniteScrollThreshold?: number
  /** Enable infinite scroll */
  enableInfiniteScroll?: boolean
  /** Article card variant */
  articleVariant?: 'default' | 'featured' | 'vintage' | 'glass'
  /** Article card hover effect */
  articleHover?: 'none' | 'subtle' | 'lift' | 'glow'
  /** Whether to show article content preview */
  showContent?: boolean
  /** Container size */
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

/**
 * ArticleGrid component for displaying articles in a responsive grid layout
 * 
 * @example
 * ```tsx
 * <ArticleGrid
 *   articles={articles}
 *   cols={3}
 *   gap="lg"
 *   articleVariant="vintage"
 *   showContent
 *   enableInfiniteScroll
 *   onLoadMore={handleLoadMore}
 * />
 * ```
 */
export const ArticleGrid = React.forwardRef<HTMLDivElement, ArticleGridProps>(
  ({
    className,
    articles,
    cols,
    gap,
    loading = false,
    loadingCount = 6,
    emptyState,
    errorState,
    showLoadMore = false,
    loadingMore = false,
    onLoadMore,
    hasMore = false,
    infiniteScrollThreshold = 400,
    enableInfiniteScroll = false,
    articleVariant = 'default',
    articleHover = 'subtle',
    showContent = false,
    containerSize = 'xl',
    ...props
  }, ref) => {
    const gridRef = React.useRef<HTMLDivElement>(null)
    const loadMoreRef = React.useRef<HTMLDivElement>(null)

    // Infinite scroll implementation
    React.useEffect(() => {
      if (!enableInfiniteScroll || !onLoadMore || loadingMore || !hasMore) return

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore()
          }
        },
        { threshold: 0.1 }
      )

      if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current)
      }

      return () => observer.disconnect()
    }, [enableInfiniteScroll, onLoadMore, loadingMore, hasMore])

    // Handle scroll-based infinite loading
    React.useEffect(() => {
      if (!enableInfiniteScroll || !onLoadMore || loadingMore || !hasMore) return

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement
        if (scrollHeight - scrollTop <= clientHeight + infiniteScrollThreshold) {
          onLoadMore()
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }, [enableInfiniteScroll, onLoadMore, loadingMore, hasMore, infiniteScrollThreshold])

    // Default empty state
    const defaultEmptyState = (
      <div className="col-span-full text-center py-12">
        <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          No articles found
        </h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or filters.
        </p>
      </div>
    )

    // Loading skeletons
    const loadingSkeletons = Array.from({ length: loadingCount }, (_, i) => (
      <ArticleCard
        key={`skeleton-${i}`}
        article={{} as Article}
        loading={true}
        variant={articleVariant}
        hover="none"
      />
    ))

    return (
      <div
        ref={ref}
        className={cn(
          containerVariants({ size: containerSize, padding: 'md' }),
          className
        )}
        {...props}
      >
        <div
          ref={gridRef}
          className={cn(gridVariants({ cols, gap }))}
        >
          {/* Error State */}
          {errorState && (
            <div className="col-span-full">
              {errorState}
            </div>
          )}

          {/* Loading State */}
          {loading && loadingSkeletons}

          {/* Articles */}
          {!loading && articles.length > 0 && articles.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              variant={index === 0 && articleVariant === 'featured' ? 'featured' : articleVariant}
              hover={articleHover}
              showContent={showContent}
              className="animate-fade-in"
              style={{
                animationDelay: `${Math.min(index * 100, 500)}ms`,
                animationFillMode: 'both'
              }}
            />
          ))}

          {/* Empty State */}
          {!loading && articles.length === 0 && (
            emptyState || defaultEmptyState
          )}

          {/* Loading More Skeletons */}
          {loadingMore && Array.from({ length: 3 }, (_, i) => (
            <ArticleCard
              key={`loading-more-${i}`}
              article={{} as Article}
              loading={true}
              variant={articleVariant}
              hover="none"
            />
          ))}
        </div>

        {/* Load More Button */}
        {showLoadMore && hasMore && !enableInfiniteScroll && !loadingMore && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={onLoadMore}
              disabled={loadingMore}
              loading={loadingMore}
            >
              Load More Articles
            </Button>
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {enableInfiniteScroll && hasMore && (
          <div
            ref={loadMoreRef}
            className="flex justify-center py-8"
          >
            {loadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Loading more articles...
              </div>
            )}
          </div>
        )}

        {/* End of Results */}
        {!hasMore && articles.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>You&apos;ve reached the end of the archive.</p>
          </div>
        )}
      </div>
    )
  }
)

ArticleGrid.displayName = 'ArticleGrid'