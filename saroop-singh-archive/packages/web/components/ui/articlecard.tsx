import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { CalendarDays, Clock, MapPin, Newspaper, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { articleCardVariants, type ArticleCardVariants } from '@/lib/styles/classNames'
import type { Article, ArticleMetadata } from '@/types'

export interface ArticleCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    ArticleCardVariants {
  /** Article data */
  article: Article | ArticleMetadata
  /** Show full content or just metadata */
  showContent?: boolean
  /** Maximum number of tags to display */
  maxTags?: number
  /** Custom image aspect ratio */
  imageAspectRatio?: string
  /** Loading state */
  loading?: boolean
  /** Custom link href override */
  href?: string
  /** Whether to show action buttons */
  showActions?: boolean
  /** Custom action buttons */
  actions?: React.ReactNode
}

/**
 * ArticleCard component for displaying article information
 * 
 * @example
 * ```tsx
 * <ArticleCard
 *   article={article}
 *   variant="featured"
 *   hover="glow"
 *   showContent
 * />
 * ```
 */
export const ArticleCard = React.forwardRef<HTMLDivElement, ArticleCardProps>(
  ({ 
    className, 
    article, 
    variant,
    size,
    hover,
    showContent = false,
    maxTags = 3,
    imageAspectRatio = 'aspect-[4/3]',
    loading = false,
    href,
    showActions = false,
    actions,
    ...props 
  }, ref) => {
    const cardHref = href || `/articles/${article.slug}`
    
    if (loading) {
      return (
        <Card
          ref={ref}
          className={cn(articleCardVariants({ variant, size, hover: 'none' }), 'animate-pulse', className)}
          {...props}
        >
          <div className={cn('bg-muted rounded-t-lg', imageAspectRatio)} />
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card
        ref={ref}
        className={cn(articleCardVariants({ variant, size, hover }), className)}
        {...props}
      >
        {/* Article Image */}
        {article.image && (
          <div className={cn('relative overflow-hidden rounded-t-lg', imageAspectRatio)}>
            <Link href={cardHref}>
              <Image
                src={article.image}
                alt={article.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </Link>
            {variant === 'featured' && (
              <div className="absolute top-3 left-3">
                <Badge variant="glass" size="sm">Featured</Badge>
              </div>
            )}
          </div>
        )}

        <CardHeader className="space-y-2">
          {/* Article Title */}
          <CardTitle className="line-clamp-2">
            <Link 
              href={cardHref}
              className="hover:text-primary transition-colors"
            >
              {article.title}
            </Link>
          </CardTitle>

          {/* Article Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {article.date && (
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <time dateTime={article.date}>
                  {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </time>
              </div>
            )}
            {article.publication && (
              <div className="flex items-center gap-1">
                <Newspaper className="h-3 w-3" />
                <span>{article.publication}</span>
              </div>
            )}
            {article.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{article.location}</span>
              </div>
            )}
          </div>

          {/* Reading Time Estimate (if content available) */}
          {showContent && 'content' in article && article.content && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{Math.ceil(article.content.split(' ').length / 200)} min read</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Article Content Preview */}
          {showContent && 'content' in article && article.content && (
            <CardDescription className="line-clamp-3">
              {article.content.slice(0, 150).replace(/[#*]/g, '')}...
            </CardDescription>
          )}

          {/* People Mentioned */}
          {article.people && article.people.length > 0 && (
            <div className="flex items-start gap-2">
              <Users className="h-3 w-3 mt-1 text-muted-foreground shrink-0" />
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">People: </span>
                {article.people.slice(0, 3).join(', ')}
                {article.people.length > 3 && ` +${article.people.length - 3} more`}
              </div>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, maxTags).map((tag) => (
                <Badge
                  key={tag}
                  variant={variant === 'vintage' ? 'vintage' : 'secondary'}
                  size="sm"
                >
                  {tag}
                </Badge>
              ))}
              {article.tags.length > maxTags && (
                <Badge variant="outline" size="sm">
                  +{article.tags.length - maxTags}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={cardHref}>Read More</Link>
              </Button>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

ArticleCard.displayName = 'ArticleCard'
