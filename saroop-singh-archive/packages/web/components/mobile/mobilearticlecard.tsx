'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Building2, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Article {
  slug: string
  title: string
  content: string
  date?: string
  publication?: string
  image?: string
  tags?: string[]
  readTime?: number
}

interface MobileArticleCardProps {
  article: Article
  variant?: 'default' | 'compact' | 'featured'
  showImage?: boolean
  className?: string
}

export function MobileArticleCard({ 
  article, 
  variant = 'default',
  showImage = true,
  className 
}: MobileArticleCardProps) {
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const getExcerpt = (content: string, length = 120) => {
    if (content.length <= length) return content
    return content.slice(0, length).trim() + '...'
  }

  if (variant === 'compact') {
    return (
      <Link href={`/articles/${article.slug}`} className={cn('block', className)}>
        <article className="flex space-x-3 p-4 bg-white rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-200 active:scale-98">
          {showImage && article.image && !imageError && (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={article.image}
                alt={article.title}
                width={64}
                height={64}
                unoptimized
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
              {article.title}
            </h3>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {article.date && (
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(article.date)}</span>
                </span>
              )}
              {article.publication && (
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{article.publication}</span>
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link href={`/articles/${article.slug}`} className={cn('block', className)}>
        <article className="group bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 active:scale-98">
          {showImage && article.image && !imageError && (
            <div className="aspect-[16/10] relative overflow-hidden">
              <Image
                src={article.image}
                alt={article.title}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                {article.date && (
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(article.date)}</span>
                  </span>
                )}
                {article.readTime && (
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{article.readTime} min read</span>
                  </span>
                )}
              </div>
            </div>
            
            <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {article.title}
            </h3>
            
            <p className="text-gray-600 text-sm line-clamp-3 mb-4">
              {getExcerpt(article.content, 150)}
            </p>

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.slice(0, 3).map((tag) => (
                  <span 
                    key={tag}
                    className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {article.publication && (
                <span className="flex items-center space-x-1 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{article.publication}</span>
                </span>
              )}
              
              <span className="shrink-0 text-sm font-semibold text-primary-700">Read record</span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={`/articles/${article.slug}`} className={cn('block', className)}>
      <article className="group bg-white rounded-xl border border-gray-200/50 overflow-hidden hover:shadow-lg transition-all duration-200 active:scale-98">
        {showImage && article.image && !imageError && (
          <div className="aspect-[16/9] relative overflow-hidden">
            <Image
              src={article.image}
              alt={article.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h3>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {getExcerpt(article.content)}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              {article.date && (
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(article.date)}</span>
                </span>
              )}
              {article.publication && (
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate max-w-20">{article.publication}</span>
                </span>
              )}
            </div>

            <span className="shrink-0 text-xs font-semibold text-primary-700">Read</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
