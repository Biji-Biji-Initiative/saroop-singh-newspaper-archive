'use client'

import React, { useState, useRef, useCallback, useMemo } from 'react'
import { Search, X, Clock, Filter, SortAsc } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileSearchProps {
  placeholder?: string
  onSearch?: (query: string, filters?: SearchFilters) => void
  className?: string
}

interface SearchFilters {
  dateRange?: string
  publication?: string
  sortBy?: 'date' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

interface SearchSuggestion {
  id: string
  text: string
  type: 'recent' | 'suggestion'
}

export function MobileSearch({ 
  placeholder = "Search articles...", 
  onSearch,
  className 
}: MobileSearchProps) {
  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)

  // Mock search suggestions - replace with real data
  const suggestions = useMemo<SearchSuggestion[]>(() => [
    { id: '1', text: 'Saroop Singh', type: 'suggestion' },
    { id: '2', text: 'athletics', type: 'suggestion' },
    { id: '3', text: 'half mile record', type: 'suggestion' },
    { id: '4', text: 'Selangor', type: 'suggestion' },
  ], [])

  const handleSearch = useCallback((searchQuery: string = query) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const newRecent: SearchSuggestion = {
        id: Date.now().toString(),
        text: searchQuery,
        type: 'recent'
      }
      setRecentSearches(prev => [newRecent, ...prev.filter(s => s.text !== searchQuery)].slice(0, 5))
      
      onSearch?.(searchQuery, filters)
      setIsExpanded(false)
    }
  }, [query, filters, onSearch])

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    handleSearch(suggestion.text)
  }

  const clearQuery = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  return (
    <div className={cn('relative w-full max-w-md mx-auto', className)}>
      {/* Search Input */}
      <div 
        className={cn(
          'relative flex items-center bg-white/90 backdrop-blur-sm rounded-full',
          'border border-gray-200/50 shadow-sm transition-all duration-300',
          isExpanded && 'ring-2 ring-blue-500/20 shadow-lg bg-white'
        )}
      >
        <Search className="absolute left-4 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder={placeholder}
          className={cn(
            'w-full py-3 pl-12 pr-20 bg-transparent rounded-full',
            'text-gray-900 placeholder-gray-500 focus:outline-none',
            'text-base' // Prevents zoom on iOS
          )}
        />
        
        {/* Action Buttons */}
        <div className="absolute right-2 flex items-center space-x-1">
          {query && (
            <button
              onClick={clearQuery}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={toggleFilters}
            className={cn(
              'p-2 hover:bg-gray-100 rounded-full transition-colors',
              showFilters && 'bg-blue-50 text-blue-600'
            )}
            aria-label="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Search Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Search Panel */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200/50 z-50 max-h-80 overflow-hidden">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Recent Searches
                </h3>
                <div className="space-y-1">
                  {recentSearches.map((search) => (
                    <button
                      key={search.id}
                      onClick={() => handleSuggestionClick(search)}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 transition-colors"
                    >
                      {search.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Suggestions */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h3>
              <div className="space-y-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 transition-colors"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200/50 z-40 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Search Filters</h3>
          
          {/* Date Range Filter */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Date Range</label>
            <select 
              className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={filters.dateRange || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value || undefined }))}
            >
              <option value="">All dates</option>
              <option value="1930s">1930s</option>
              <option value="1940s">1940s</option>
              <option value="1950s">1950s</option>
            </select>
          </div>

          {/* Publication Filter */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Publication</label>
            <select 
              className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={filters.publication || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, publication: e.target.value || undefined }))}
            >
              <option value="">All publications</option>
              <option value="straits-times">Straits Times</option>
              <option value="singapore-free-press">Singapore Free Press</option>
              <option value="malaya-tribune">Malaya Tribune</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <SortAsc className="w-4 h-4 text-gray-400" />
            <select 
              className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={`${filters.sortBy || 'date'}-${filters.sortOrder || 'desc'}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as ['date' | 'relevance', 'asc' | 'desc']
                setFilters(prev => ({ ...prev, sortBy, sortOrder }))
              }}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="relevance-desc">Most relevant</option>
            </select>
          </div>

          {/* Apply Filters Button */}
          <button
            onClick={() => {
              handleSearch()
              setShowFilters(false)
            }}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  )
}
