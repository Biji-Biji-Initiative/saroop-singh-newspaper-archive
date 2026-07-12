export interface Article {
  slug: string
  title: string
  date?: string
  date_text?: string
  source?: string
  publication?: string
  page?: number
  location?: string
  people?: string[]
  events?: string[]
  category?: string
  tags?: string[]
  image?: string
  content: string
  layout?: string
  permalink?: string
}

export interface ArticleMetadata {
  slug: string
  title: string
  date?: string
  date_text?: string
  source?: string
  publication?: string
  page?: number
  location?: string
  people?: string[]
  events?: string[]
  category?: string
  tags?: string[]
  image?: string
}

export interface SearchOptions {
  query?: string
  people?: string[]
  sources?: string[]
  locations?: string[]
  tags?: string[]
  categories?: string[]
  dateFrom?: string
  dateTo?: string
}

export interface SortOptions {
  field: 'date' | 'title' | 'source'
  direction: 'asc' | 'desc'
}

export interface FilterCounts {
  sources: Record<string, number>
  people: Record<string, number>
  locations: Record<string, number>
  tags: Record<string, number>
  categories: Record<string, number>
}

export interface ArticleSearchResult {
  articles: ArticleMetadata[]
  total: number
  filters: FilterCounts
}