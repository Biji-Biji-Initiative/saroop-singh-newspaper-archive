'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Search } from 'lucide-react'
import Link from 'next/link'

interface ArticlesErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ArticlesError({ error, reset }: ArticlesErrorProps) {
  const isSearchError = error.message.includes('search') || error.message.includes('query')
  const isLoadError = error.message.includes('load') || error.message.includes('fetch')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Articles</h1>
            <p className="text-gray-600">Historical newspaper clippings and documents</p>
          </div>
        </div>
      </div>

      {/* Error Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {isSearchError 
                ? 'Search Problem' 
                : isLoadError 
                ? 'Loading Problem' 
                : 'Something went wrong'
              }
            </h2>
            
            <p className="text-gray-600 text-sm mb-6">
              {isSearchError 
                ? 'We encountered an error while searching the articles. Please try a different search term or filter.'
                : isLoadError 
                ? 'We\'re having trouble loading the articles. Please check your connection and try again.'
                : 'An unexpected error occurred while loading the articles. We apologize for the inconvenience.'
              }
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={reset}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              
              <Link 
                href="/articles"
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Browse All Articles</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Try refreshing the page</li>
                <li>• Check your internet connection</li>
                <li>• Clear your browser cache</li>
                {isSearchError && <li>• Try a different search term</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}