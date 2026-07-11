import * as React from 'react'
import { Search, X, MapPin, Users, Tag, Newspaper, Filter } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'
import { Badge } from './badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { cn } from '@/lib/utils'
import { filterVariants, type FilterVariants } from '@/lib/styles/classNames'
import type { SearchOptions, SortOptions, FilterCounts } from '@/types'

export interface ArticleFiltersProps
  extends React.HTMLAttributes<HTMLDivElement>,
    FilterVariants {
  /** Current search options */
  searchOptions: SearchOptions
  /** Filter counts for displaying available options */
  filterCounts?: FilterCounts
  /** Sort options */
  sortOptions: SortOptions
  /** Loading state */
  loading?: boolean
  /** Callback when search options change */
  onSearchChange: (options: SearchOptions) => void
  /** Callback when sort options change */
  onSortChange: (options: SortOptions) => void
  /** Callback to clear all filters */
  onClearFilters: () => void
  /** Whether to show the filters in a collapsible format */
  collapsible?: boolean
}

/**
 * ArticleFilters component for filtering and searching articles
 * 
 * @example
 * ```tsx
 * <ArticleFilters
 *   searchOptions={searchOptions}
 *   sortOptions={sortOptions}
 *   onSearchChange={handleSearchChange}
 *   onSortChange={handleSortChange}
 *   onClearFilters={handleClearFilters}
 * />
 * ```
 */
export const ArticleFilters = React.forwardRef<HTMLDivElement, ArticleFiltersProps>(
  ({
    className,
    variant,
    layout,
    searchOptions,
    filterCounts,
    sortOptions,
    loading = false,
    onSearchChange,
    onSortChange,
    onClearFilters,
    collapsible = false,
    ...props
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(!collapsible)
    
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

    const updateSearch = React.useCallback((updates: Partial<SearchOptions>) => {
      onSearchChange({ ...searchOptions, ...updates })
    }, [searchOptions, onSearchChange])

    const removeFilter = React.useCallback((type: keyof SearchOptions, value: string) => {
      const current = searchOptions[type]
      if (Array.isArray(current)) {
        updateSearch({ [type]: current.filter(item => item !== value) })
      } else {
        updateSearch({ [type]: undefined })
      }
    }, [searchOptions, updateSearch])

    const FilterContent = (
      <>
        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search articles..."
            value={searchOptions.query || ''}
            onChange={(e) => updateSearch({ query: e.target.value })}
            startIcon={<Search className="h-4 w-4" />}
            endIcon={
              searchOptions.query ? (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => updateSearch({ query: '' })}
                >
                  <X className="h-3 w-3" />
                </Button>
              ) : undefined
            }
          />
        </div>

        {/* Filter Tabs */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="date">Date</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            {/* People Filter */}
            {filterCounts?.people && Object.keys(filterCounts.people).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  People
                </label>
                <Select
                  onValueChange={(value) => {
                    const current = searchOptions.people || []
                    if (!current.includes(value)) {
                      updateSearch({ people: [...current, value] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select people..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(filterCounts.people)
                      .sort(([, a], [, b]) => b - a)
                      .map(([person, count]) => (
                        <SelectItem key={person} value={person}>
                          {person} ({count})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tags Filter */}
            {filterCounts?.tags && Object.keys(filterCounts.tags).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </label>
                <Select
                  onValueChange={(value) => {
                    const current = searchOptions.tags || []
                    if (!current.includes(value)) {
                      updateSearch({ tags: [...current, value] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tags..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(filterCounts.tags)
                      .sort(([, a], [, b]) => b - a)
                      .map(([tag, count]) => (
                        <SelectItem key={tag} value={tag}>
                          {tag} ({count})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            {/* Sources Filter */}
            {filterCounts?.sources && Object.keys(filterCounts.sources).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  Sources
                </label>
                <Select
                  onValueChange={(value) => {
                    const current = searchOptions.sources || []
                    if (!current.includes(value)) {
                      updateSearch({ sources: [...current, value] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sources..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(filterCounts.sources)
                      .sort(([, a], [, b]) => b - a)
                      .map(([source, count]) => (
                        <SelectItem key={source} value={source}>
                          {source} ({count})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Locations Filter */}
            {filterCounts?.locations && Object.keys(filterCounts.locations).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Locations
                </label>
                <Select
                  onValueChange={(value) => {
                    const current = searchOptions.locations || []
                    if (!current.includes(value)) {
                      updateSearch({ locations: [...current, value] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select locations..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(filterCounts.locations)
                      .sort(([, a], [, b]) => b - a)
                      .map(([location, count]) => (
                        <SelectItem key={location} value={location}>
                          {location} ({count})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="date" className="space-y-4 mt-4">
            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={searchOptions.dateFrom || ''}
                  onChange={(e) => updateSearch({ dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={searchOptions.dateTo || ''}
                  onChange={(e) => updateSearch({ dateTo: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Sort Options */}
        <div className="space-y-2 pt-4 border-t">
          <label className="text-sm font-medium">Sort By</label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={sortOptions.field}
              onValueChange={(value: 'date' | 'title' | 'source') =>
                onSortChange({ ...sortOptions, field: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="source">Source</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOptions.direction}
              onValueChange={(value: 'asc' | 'desc') =>
                onSortChange({ ...sortOptions, direction: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </>
    )

    return (
      <div
        ref={ref}
        className={cn(filterVariants({ variant, layout }), className)}
        {...props}
      >
        {/* Header with Clear Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Badge variant="secondary" size="sm">
                Active
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Hide' : 'Show'}
              </Button>
            )}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchOptions.people?.map((person) => (
              <Badge
                key={`person-${person}`}
                variant="secondary"
                dismissible
                onDismiss={() => removeFilter('people', person)}
              >
                👤 {person}
              </Badge>
            ))}
            {searchOptions.sources?.map((source) => (
              <Badge
                key={`source-${source}`}
                variant="secondary"
                dismissible
                onDismiss={() => removeFilter('sources', source)}
              >
                📰 {source}
              </Badge>
            ))}
            {searchOptions.locations?.map((location) => (
              <Badge
                key={`location-${location}`}
                variant="secondary"
                dismissible
                onDismiss={() => removeFilter('locations', location)}
              >
                📍 {location}
              </Badge>
            ))}
            {searchOptions.tags?.map((tag) => (
              <Badge
                key={`tag-${tag}`}
                variant="secondary"
                dismissible
                onDismiss={() => removeFilter('tags', tag)}
              >
                🏷️ {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Filter Content */}
        {(isExpanded || !collapsible) && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : (
              FilterContent
            )}
          </div>
        )}
      </div>
    )
  }
)

ArticleFilters.displayName = 'ArticleFilters'
