# Component System Documentation

This document provides comprehensive documentation for the Saroop Singh Archive component system, including usage examples, prop specifications, and best practices.

## Table of Contents

- [Architecture](#architecture)
- [UI Components](#ui-components)
- [Composite Components](#composite-components)
- [Layout Components](#layout-components)
- [Styling System](#styling-system)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Architecture

The component system follows a modular architecture with clear separation of concerns:

```
src/components/
├── ui/                    # Basic UI primitives
├── composite/             # Complex composed components
├── layout/               # Layout and structure components
├── mobile/               # Mobile-specific components
└── README.md            # This documentation
```

### Design Principles

1. **Composition over Inheritance**: Components are built using composition patterns
2. **Consistent API**: All components follow similar prop patterns and naming conventions
3. **Accessibility First**: Components include proper ARIA attributes and keyboard navigation
4. **Performance Optimized**: Uses React.memo, useCallback, and other optimization techniques
5. **TypeScript Native**: Full type safety with comprehensive interfaces

## UI Components

### Button

Enhanced button component with loading states, icons, and multiple variants.

```tsx
import { Button } from '@/components/ui/Button'

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="vintage" size="lg">
  Vintage Button
</Button>

// With loading state
<Button loading={isLoading} loadingText="Processing...">
  Submit Form
</Button>

// With icons
<Button leftIcon={<Search />} rightIcon={<ChevronRight />}>
  Search Articles
</Button>
```

**Props:**
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'vintage' | 'glass'
- `size`: 'default' | 'sm' | 'lg' | 'icon' | 'xs'
- `loading`: boolean - Shows loading spinner
- `leftIcon`, `rightIcon`: ReactNode - Icons to display
- `asChild`: boolean - Render as child component (using Radix Slot)

### ArticleCard

Displays article information with various layouts and interactions.

```tsx
import { ArticleCard } from '@/components/ui/ArticleCard'

// Basic article card
<ArticleCard article={article} />

// Featured article with content preview
<ArticleCard
  article={article}
  variant="featured"
  hover="glow"
  showContent
  showActions
/>

// Vintage style with custom actions
<ArticleCard
  article={article}
  variant="vintage"
  maxTags={5}
  actions={
    <div className="flex gap-2">
      <Button size="sm" variant="outline">Share</Button>
      <Button size="sm" variant="outline">Save</Button>
    </div>
  }
/>
```

**Props:**
- `article`: Article | ArticleMetadata - Article data
- `variant`: 'default' | 'featured' | 'vintage' | 'glass'
- `hover`: 'none' | 'subtle' | 'lift' | 'glow'
- `showContent`: boolean - Display content preview
- `showActions`: boolean - Show action buttons
- `maxTags`: number - Maximum tags to display
- `loading`: boolean - Loading skeleton state

### Input

Enhanced input component with icons, error states, and validation.

```tsx
import { Input } from '@/components/ui/Input'
import { Search, User } from 'lucide-react'

// Basic input
<Input placeholder="Search articles..." />

// With icons
<Input
  placeholder="Search..."
  startIcon={<Search className="h-4 w-4" />}
/>

// With error state
<Input
  placeholder="Enter email"
  error={hasError}
  startIcon={<User className="h-4 w-4" />}
/>
```

**Props:**
- `error`: boolean - Error state styling
- `startIcon`, `endIcon`: ReactNode - Icons to display
- All standard HTML input props

### Badge

Flexible badge component for tags, labels, and status indicators.

```tsx
import { Badge } from '@/components/ui/Badge'

// Basic badges
<Badge>Default</Badge>
<Badge variant="vintage">Vintage</Badge>
<Badge variant="glass">Glass Effect</Badge>

// With icons and dismissible functionality
<Badge
  variant="secondary"
  icon={<Tag className="h-3 w-3" />}
  dismissible
  onDismiss={() => handleRemove()}
>
  Removable Tag
</Badge>
```

**Props:**
- `variant`: 'default' | 'secondary' | 'destructive' | 'outline' | 'vintage' | 'glass' | 'success' | 'warning'
- `size`: 'sm' | 'default' | 'lg'
- `icon`: ReactNode - Icon to display
- `dismissible`: boolean - Show dismiss button
- `onDismiss`: () => void - Callback when dismissed

## Composite Components

### ArticleGrid

Responsive grid for displaying articles with loading states, infinite scroll, and empty states.

```tsx
import { ArticleGrid } from '@/components/composite/ArticleGrid'

// Basic grid
<ArticleGrid articles={articles} />

// Advanced grid with infinite scroll
<ArticleGrid
  articles={articles}
  cols={3}
  gap="lg"
  articleVariant="vintage"
  articleHover="lift"
  showContent
  enableInfiniteScroll
  onLoadMore={handleLoadMore}
  hasMore={hasMoreArticles}
  emptyState={<CustomEmptyState />}
/>
```

**Props:**
- `articles`: (Article | ArticleMetadata)[] - Articles to display
- `cols`: 1 | 2 | 3 | 4 | 'auto' - Grid columns
- `gap`: 'sm' | 'default' | 'lg' | 'xl' - Grid gap
- `loading`: boolean - Loading state
- `enableInfiniteScroll`: boolean - Enable infinite scroll
- `onLoadMore`: () => void - Load more callback
- `articleVariant`: Article card variant
- `emptyState`: ReactNode - Custom empty state

### FilterableGrid

Complete filtering and display solution combining ArticleFilters with ArticleGrid.

```tsx
import { FilterableGrid } from '@/components/composite/FilterableGrid'

// Complete filterable article browser
<FilterableGrid
  allArticles={allArticles}
  filteredArticles={filteredArticles}
  searchOptions={searchOptions}
  sortOptions={sortOptions}
  filterCounts={filterCounts}
  onSearchChange={handleSearchChange}
  onSortChange={handleSortChange}
  onClearFilters={handleClearFilters}
  filterPosition="left"
  filterVariant="glass"
  stickyFilters
  cols={3}
  articleVariant="vintage"
/>
```

**Props:**
- `allArticles`, `filteredArticles`: Article arrays
- `searchOptions`: SearchOptions - Current search/filter state
- `sortOptions`: SortOptions - Current sort state
- `filterCounts`: FilterCounts - Available filter options with counts
- `onSearchChange`, `onSortChange`, `onClearFilters`: Callbacks
- `filterPosition`: 'top' | 'left' | 'right' - Filter panel position
- Plus all ArticleGrid props

### ArticleFilters

Comprehensive filtering interface with search, faceted filters, and sorting.

```tsx
import { ArticleFilters } from '@/components/ui/ArticleFilters'

<ArticleFilters
  searchOptions={searchOptions}
  sortOptions={sortOptions}
  filterCounts={filterCounts}
  onSearchChange={handleSearchChange}
  onSortChange={handleSortChange}
  onClearFilters={handleClearFilters}
  variant="glass"
  layout="vertical"
  collapsible={isMobile}
/>
```

**Props:**
- `searchOptions`: SearchOptions - Current search state
- `sortOptions`: SortOptions - Current sort state
- `filterCounts`: FilterCounts - Available options with counts
- `variant`: 'default' | 'glass' | 'sidebar'
- `layout`: 'vertical' | 'horizontal' | 'grid'
- `collapsible`: boolean - Whether filters can be collapsed

## Styling System

### Class Variance Authority (CVA)

The component system uses CVA for consistent variant-based styling:

```tsx
import { articleCardVariants } from '@/lib/styles/classNames'

// Use variants in components
const className = cn(
  articleCardVariants({ 
    variant: 'vintage', 
    size: 'lg', 
    hover: 'glow' 
  }),
  customClassName
)
```

### Available Variant Systems

1. **articleCardVariants**: Article card styling
2. **containerVariants**: Layout containers
3. **gridVariants**: Grid layouts
4. **textVariants**: Typography
5. **badgeVariants**: Badge styling
6. **filterVariants**: Filter panel styling
7. **animationVariants**: Animation utilities

### Theme Integration

Components integrate with the Tailwind theme system:

```css
/* Vintage color palette */
.vintage-theme {
  --vintage-50: #fdf8f3;
  --vintage-100: #faeee1;
  /* ... */
}

/* Glass morphism effects */
.glass-effect {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## Usage Examples

### Complete Article Browser Page

```tsx
import { FilterableGrid } from '@/components/composite/FilterableGrid'
import { useArticleSearch } from '@/hooks/useArticleSearch'

export default function ArticlesPage() {
  const {
    allArticles,
    filteredArticles,
    searchOptions,
    sortOptions,
    filterCounts,
    loading,
    handleSearchChange,
    handleSortChange,
    handleClearFilters
  } = useArticleSearch()

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-vintage-50 to-sepia-50 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-vintage-900 mb-4">
            Historical Articles
          </h1>
          <p className="text-lg text-vintage-700 max-w-2xl">
            Explore our comprehensive archive of historical articles.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <FilterableGrid
          allArticles={allArticles}
          filteredArticles={filteredArticles}
          searchOptions={searchOptions}
          sortOptions={sortOptions}
          filterCounts={filterCounts}
          filterLoading={loading}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
          cols={3}
          gap="lg"
          articleVariant="vintage"
          articleHover="lift"
          showContent
          filterPosition="left"
          filterVariant="glass"
          stickyFilters
        />
      </div>
    </div>
  )
}
```

### Custom Article Card Layout

```tsx
import { ArticleCard } from '@/components/ui/ArticleCard'
import { Button } from '@/components/ui/Button'
import { Share2, Bookmark, ExternalLink } from 'lucide-react'

function FeaturedArticleCard({ article, onShare, onBookmark }) {
  return (
    <ArticleCard
      article={article}
      variant="featured"
      size="lg"
      hover="glow"
      showContent
      showActions
      maxTags={5}
      imageAspectRatio="aspect-[16/9]"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onBookmark}>
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="vintage" asChild>
            <a href={`/articles/${article.slug}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Read Full Article
            </a>
          </Button>
        </div>
      }
    />
  )
}
```

## Best Practices

### Component Composition

1. **Prefer Composition**: Build complex UIs by combining simple components
2. **Use forwardRef**: For components that need ref forwarding
3. **Implement displayName**: For better debugging experience
4. **Export Variants**: Make variant functions available for custom usage

### Performance

1. **Use React.memo**: For components that render frequently
2. **Implement useCallback**: For event handlers passed as props
3. **Optimize Re-renders**: Use useMemo for expensive calculations
4. **Lazy Load**: Large components and images

### Accessibility

1. **ARIA Labels**: Provide descriptive labels for screen readers
2. **Keyboard Navigation**: Support keyboard-only users
3. **Focus Management**: Proper focus handling for modals and dropdowns
4. **Color Contrast**: Ensure sufficient contrast ratios

### TypeScript

1. **Strict Types**: Use strict TypeScript configuration
2. **Generic Components**: Make components reusable with generics
3. **Props Interfaces**: Export prop interfaces for documentation
4. **Variant Types**: Use union types for variant props

### Styling

1. **Consistent Spacing**: Use theme spacing values
2. **Responsive Design**: Mobile-first responsive components
3. **Theme Integration**: Use CSS custom properties for themes
4. **Animation**: Subtle animations for better UX

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure proper path aliases in components.json
2. **Style Conflicts**: Use cn() utility for className merging
3. **Type Errors**: Check TypeScript configuration and dependencies
4. **Performance**: Use React DevTools Profiler for optimization

### Debug Tips

1. **Use displayName**: For component identification in DevTools
2. **Add PropTypes**: For runtime prop validation (development)
3. **Console Logging**: Add debug logs for complex state changes
4. **Storybook**: Create stories for isolated component testing

This component system provides a solid foundation for building consistent, accessible, and performant user interfaces. Follow these patterns and guidelines to maintain code quality and user experience standards.