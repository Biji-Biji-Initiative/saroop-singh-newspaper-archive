'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, MapPin, Users, Tag, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Article } from '@/types'
import Image from 'next/image'

interface TimelineEvent {
  year: number
  articles: Article[]
}

export default function TimelinePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles')
      if (response.ok) {
        const data = await response.json()
        setArticles(data)
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTimeline = useCallback((articlesData: Article[]) => {
    const filteredArticles = selectedYear === 'all' 
      ? articlesData 
      : articlesData.filter(article => {
          if (!article.date) return false
          const year = new Date(article.date).getFullYear()
          return year.toString() === selectedYear
        })

    const groupedByYear: Record<number, Article[]> = {}
    
    filteredArticles.forEach(article => {
      if (article.date) {
        const year = new Date(article.date).getFullYear()
        if (!groupedByYear[year]) {
          groupedByYear[year] = []
        }
        groupedByYear[year].push(article)
      }
    })

    const timelineData = Object.entries(groupedByYear)
      .map(([year, yearArticles]) => ({
        year: parseInt(year),
        articles: yearArticles.sort((a, b) => {
          const dateA = new Date(a.date || 0)
          const dateB = new Date(b.date || 0)
          return sortOrder === 'desc' 
            ? dateB.getTime() - dateA.getTime()
            : dateA.getTime() - dateB.getTime()
        })
      }))
      .sort((a, b) => sortOrder === 'desc' ? b.year - a.year : a.year - b.year)

    setTimeline(timelineData)
  }, [selectedYear, sortOrder])

  useEffect(() => {
    if (articles.length > 0) {
      createTimeline(articles)
    }
  }, [articles, createTimeline])

  const getAvailableYears = () => {
    const years = new Set<number>()
    articles.forEach(article => {
      if (article.date) {
        years.add(new Date(article.date).getFullYear())
      }
    })
    return Array.from(years).sort((a, b) => b - a)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vintage-50 to-sepia-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-600 mx-auto mb-4"></div>
              <p className="text-lg text-vintage-700">Loading timeline...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vintage-50 to-sepia-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-vintage-800 mb-4 font-serif">
            Timeline
          </h1>
          <p className="text-xl text-vintage-600 mb-8 leading-relaxed">
            Follow Saroop Singh&rsquo;s athletic journey through the years
          </p>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-vintage-600" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getAvailableYears().map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-vintage-600" />
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-12">
          {timeline.map((yearData, yearIndex) => (
            <div key={yearData.year} className="relative">
              {/* Year Header */}
              <div className="sticky top-4 z-10 mb-8">
                <div className="bg-vintage-200 backdrop-blur-sm border border-vintage-300 rounded-full px-6 py-3 inline-flex items-center gap-2 shadow-soft">
                  <Calendar className="h-5 w-5 text-vintage-700" />
                  <span className="text-2xl font-bold text-vintage-800 font-serif">{yearData.year}</span>
                  <Badge variant="secondary" className="bg-vintage-100">
                    {yearData.articles.length} article{yearData.articles.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {/* Timeline Line */}
              <div className="relative">
                {yearIndex < timeline.length - 1 && (
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-vintage-300 to-vintage-200"></div>
                )}

                {/* Articles */}
                <div className="space-y-6">
                  {yearData.articles.map((article) => (
                    <div key={article.slug} className="relative flex items-start gap-6">
                      {/* Timeline Dot */}
                      <div className="flex-shrink-0 w-4 h-4 bg-vintage-500 border-4 border-vintage-100 rounded-full shadow-sm mt-6"></div>

                      {/* Article Card */}
                      <Card className="flex-1 bg-white/80 backdrop-blur-sm border-vintage-200 shadow-soft hover:shadow-medium transition-all duration-300 hover:bg-white/90">
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-xl text-vintage-800 font-serif leading-tight mb-2">
                                {article.title}
                              </CardTitle>
                              
                              {/* Article Metadata */}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-vintage-600">
                                {article.date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(article.date)}</span>
                                  </div>
                                )}
                                
                                {article.source && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    <span>{article.source}</span>
                                  </div>
                                )}
                                
                                {article.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{article.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Article Image */}
                            {article.image && (
                              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative">
                                <Image
                                  src={article.image}
                                  alt={article.title}
                                  fill
                                  className="object-cover rounded-lg border border-vintage-200"
                                  sizes="(max-width: 640px) 80px, 96px"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent>
                          {/* People */}
                          {article.people && article.people.length > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="h-4 w-4 text-vintage-600" />
                              <div className="flex flex-wrap gap-1">
                                {article.people.map(person => (
                                  <Badge key={person} variant="outline" className="text-xs">
                                    {person}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                              <Tag className="h-4 w-4 text-vintage-600" />
                              <div className="flex flex-wrap gap-1">
                                {article.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs bg-vintage-100">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Content Preview */}
                          <div className="prose prose-sm max-w-none text-vintage-700 mb-4">
                            <p className="line-clamp-3">
                              {article.content.replace(/[#*]/g, '').trim().substring(0, 200)}...
                            </p>
                          </div>

                          {/* Read More Button */}
                          <Button 
                            asChild 
                            variant="outline" 
                            size="sm"
                            className="border-vintage-300 text-vintage-700 hover:bg-vintage-50"
                          >
                            <a href={`/articles/${article.slug}`}>Read Full Article</a>
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {timeline.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-vintage-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-vintage-700 mb-2">No articles found</h3>
            <p className="text-vintage-600">
              {selectedYear === 'all' 
                ? 'No articles are available in the archive.'
                : `No articles found for ${selectedYear}.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
