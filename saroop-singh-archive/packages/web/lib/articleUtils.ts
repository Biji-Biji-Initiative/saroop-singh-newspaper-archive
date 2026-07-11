import type { 
  Article, 
  ArticleMetadata, 
  SearchOptions, 
  SortOptions, 
  FilterCounts,
  ArticleSearchResult 
} from '@/types'

/**
 * Filter articles based on search options
 */
export function filterArticles(
  articles: (Article | ArticleMetadata)[],
  searchOptions: SearchOptions
): (Article | ArticleMetadata)[] {
  return articles.filter(article => {
    // Text search
    if (searchOptions.query) {
      const searchTerm = searchOptions.query.toLowerCase()
      const searchable = [
        article.title,
        'content' in article ? article.content : '',
        article.publication || '',
        ...(article.people || []),
        ...(article.tags || []),
        article.location || ''
      ].join(' ').toLowerCase()
      
      if (!searchable.includes(searchTerm)) return false
    }

    // People filter
    if (searchOptions.people?.length) {
      if (!article.people?.some(person => 
        searchOptions.people!.includes(person)
      )) return false
    }

    // Sources filter
    if (searchOptions.sources?.length) {
      if (!article.publication || 
          !searchOptions.sources.includes(article.publication)) return false
    }

    // Locations filter
    if (searchOptions.locations?.length) {
      if (!article.location || 
          !searchOptions.locations.includes(article.location)) return false
    }

    // Tags filter
    if (searchOptions.tags?.length) {
      if (!article.tags?.some(tag => 
        searchOptions.tags!.includes(tag)
      )) return false
    }

    // Categories filter
    if (searchOptions.categories?.length) {
      if (!article.category || 
          !searchOptions.categories.includes(article.category)) return false
    }

    // Date range filter
    if (searchOptions.dateFrom || searchOptions.dateTo) {
      if (!article.date) return false
      
      const articleDate = new Date(article.date)
      
      if (searchOptions.dateFrom) {
        const fromDate = new Date(searchOptions.dateFrom)
        if (articleDate < fromDate) return false
      }
      
      if (searchOptions.dateTo) {
        const toDate = new Date(searchOptions.dateTo)
        if (articleDate > toDate) return false
      }
    }

    return true
  })
}

/**
 * Sort articles based on sort options
 */
export function sortArticles(
  articles: (Article | ArticleMetadata)[],
  sortOptions: SortOptions
): (Article | ArticleMetadata)[] {
  return [...articles].sort((a, b) => {
    let comparison = 0

    switch (sortOptions.field) {
      case 'date':
        const dateA = a.date ? new Date(a.date) : new Date(0)
        const dateB = b.date ? new Date(b.date) : new Date(0)
        comparison = dateA.getTime() - dateB.getTime()
        break
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'source':
        const sourceA = a.publication || ''
        const sourceB = b.publication || ''
        comparison = sourceA.localeCompare(sourceB)
        break
      default:
        comparison = 0
    }

    return sortOptions.direction === 'desc' ? -comparison : comparison
  })
}

/**
 * Generate filter counts for available options
 */
export function generateFilterCounts(
  articles: (Article | ArticleMetadata)[]
): FilterCounts {
  const counts: FilterCounts = {
    sources: {},
    people: {},
    locations: {},
    tags: {},
    categories: {}
  }

  articles.forEach(article => {
    // Count sources
    if (article.publication) {
      counts.sources[article.publication] = 
        (counts.sources[article.publication] || 0) + 1
    }

    // Count people
    article.people?.forEach(person => {
      counts.people[person] = (counts.people[person] || 0) + 1
    })

    // Count locations
    if (article.location) {
      counts.locations[article.location] = 
        (counts.locations[article.location] || 0) + 1
    }

    // Count tags
    article.tags?.forEach(tag => {
      counts.tags[tag] = (counts.tags[tag] || 0) + 1
    })

    // Count categories
    if (article.category) {
      counts.categories[article.category] = 
        (counts.categories[article.category] || 0) + 1
    }
  })

  return counts
}

/**
 * Search articles with full filtering and sorting
 */
export function searchArticles(
  allArticles: (Article | ArticleMetadata)[],
  searchOptions: SearchOptions,
  sortOptions: SortOptions
): ArticleSearchResult {
  // Apply filters
  const filteredArticles = filterArticles(allArticles, searchOptions)
  
  // Apply sorting
  const sortedArticles = sortArticles(filteredArticles, sortOptions)
  
  // Generate filter counts from all articles (not filtered ones)
  const filters = generateFilterCounts(allArticles)
  
  return {
    articles: sortedArticles.map(article => ({
      slug: article.slug,
      title: article.title,
      date: article.date,
      date_text: article.date_text,
      source: article.source,
      publication: article.publication,
      page: article.page,
      location: article.location,
      people: article.people,
      events: article.events,
      category: article.category,
      tags: article.tags,
      image: article.image
    })),
    total: sortedArticles.length,
    filters
  }
}

/**
 * Get default search options
 */
export function getDefaultSearchOptions(): SearchOptions {
  return {
    query: '',
    people: [],
    sources: [],
    locations: [],
    tags: [],
    categories: [],
    dateFrom: '',
    dateTo: ''
  }
}

/**
 * Get default sort options
 */
export function getDefaultSortOptions(): SortOptions {
  return {
    field: 'date',
    direction: 'desc'
  }
}