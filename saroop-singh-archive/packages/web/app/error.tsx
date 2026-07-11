'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {isNetworkError ? 'Connection Problem' : 'Something went wrong'}
          </h2>
          
          <p className="text-gray-600 text-sm mb-6">
            {isNetworkError 
              ? 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.'
              : 'An unexpected error occurred while loading the archive. We apologize for the inconvenience.'
            }
          </p>

          {isDevelopment && (
            <details className="text-left mb-6 p-4 bg-gray-50 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-red-600 whitespace-pre-wrap break-words">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\nStack trace:\n'}
                    {error.stack}
                  </>
                )}
              </pre>
            </details>
          )}

          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            
            <Link 
              href="/"
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Go to Homepage</span>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            If the problem persists, please contact support or try again later.
          </p>
        </div>
      </div>
    </div>
  )
}