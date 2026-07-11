'use client'

import React from 'react'
import Link from 'next/link'
import { Search, ArrowLeft, Home, FileText } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
          {/* 404 Illustration */}
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Page Not Found
          </h1>
          
          <p className="text-gray-600 text-base mb-8">
            The page you&apos;re looking for doesn&apos;t exist in the Saroop Singh Archive. 
            It might have been moved, deleted, or you entered an incorrect URL.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 mb-8">
            <Link 
              href="/"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Go to Homepage</span>
            </Link>
            
            <Link 
              href="/articles"
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Browse Articles</span>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Links</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/timeline"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Timeline
              </Link>
              <Link 
                href="/articles"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                All Articles
              </Link>
              <button 
                onClick={() => window.history.back()}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}