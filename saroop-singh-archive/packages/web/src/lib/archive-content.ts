import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

import matter from 'gray-matter'

import type { Article } from '@/types'

const SAFE_ARTICLE_SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{0,180}$/

const configuredContentDirectory = process.env.ARCHIVE_CONTENT_DIR?.trim()

/**
 * The published archive is source-controlled content, deliberately kept
 * outside the web package. Docker copies it beside the app; local development
 * uses the same relative layout.
 */
export const ARCHIVE_CONTENT_DIR = path.resolve(
  configuredContentDirectory ||
    path.join(process.cwd(), '../../content/articles/published')
)

function asText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return undefined
}

function asTextList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}

function articleDateValue(article: Article): number {
  if (!article.date) {
    return 0
  }

  const value = Date.parse(article.date)
  return Number.isFinite(value) ? value : 0
}

function articleFromFile(fileName: string): Article {
  const fullPath = path.join(ARCHIVE_CONTENT_DIR, fileName)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    slug: fileName.slice(0, -'.md'.length),
    title: asText(data.title) || 'Untitled',
    date: asText(data.date),
    date_text: asText(data.date_text),
    source: asText(data.source),
    publication: asText(data.publication) || asText(data.newspaper),
    page: typeof data.page === 'number' ? data.page : undefined,
    location: asText(data.location),
    people: asTextList(data.people),
    events: asTextList(data.events),
    category: asText(data.category),
    tags: asTextList(data.tags),
    image: asText(data.image) || asText(data.image_url),
    content,
  }
}

export function isSafeArticleSlug(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ARTICLE_SLUG.test(value)
}

export function publishedArticleFileNames(): string[] {
  try {
    return fs
      .readdirSync(ARCHIVE_CONTENT_DIR, { withFileTypes: true })
      .filter(
        entry =>
          entry.isFile() &&
          entry.name.endsWith('.md') &&
          entry.name !== 'README.md' &&
          isSafeArticleSlug(entry.name.slice(0, -'.md'.length))
      )
      .map(entry => entry.name)
      .sort()
  } catch (error) {
    console.error('Unable to read published archive content', error)
    return []
  }
}

export function readPublishedArticles(): Article[] {
  const articles: Article[] = []

  for (const fileName of publishedArticleFileNames()) {
    try {
      articles.push(articleFromFile(fileName))
    } catch (error) {
      console.error('Unable to read published archive article', {
        fileName,
        error,
      })
    }
  }

  return articles.sort(
    (left, right) => articleDateValue(right) - articleDateValue(left)
  )
}

export function readPublishedArticleBySlug(slug: unknown): Article | null {
  if (!isSafeArticleSlug(slug)) {
    return null
  }

  try {
    return articleFromFile(`${slug}.md`)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null
    }

    console.error('Unable to read published archive article', { slug, error })
    return null
  }
}
