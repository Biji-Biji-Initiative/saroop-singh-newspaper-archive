'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import type { Article } from '@/types'

type SortOrder = 'newest' | 'oldest' | 'title'

function displayDate(date?: string, fallback?: string) {
  if (!date) return fallback || 'Date unknown'
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? fallback || 'Date unknown'
    : parsed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
}

function excerpt(content: string) {
  const clean = content
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .replace(/[>#*_`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return clean.length > 170 ? `${clean.slice(0, 167).trimEnd()}…` : clean
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  useEffect(() => {
    let active = true

    async function loadCatalogue() {
      try {
        const response = await fetch('/api/articles')
        if (!response.ok) throw new Error('Catalogue request failed')
        const data: Article[] = await response.json()
        if (active) setArticles(data)
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadCatalogue()
    return () => {
      active = false
    }
  }, [])

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          articles
            .map(article => String(article.date || '').slice(0, 4))
            .filter(value => /^\d{4}$/.test(value))
        )
      ).sort((a, b) => b.localeCompare(a)),
    [articles]
  )

  const filteredArticles = useMemo(() => {
    const term = query.trim().toLowerCase()

    return articles
      .filter(article => {
        if (year && !String(article.date || '').startsWith(year)) return false
        if (!term) return true

        return [
          article.title,
          article.content,
          article.publication,
          article.location,
          ...(article.people || []),
          ...(article.tags || []),
        ]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(term))
      })
      .sort((left, right) => {
        if (sortOrder === 'title') return left.title.localeCompare(right.title)
        const leftDate = Date.parse(left.date || '') || 0
        const rightDate = Date.parse(right.date || '') || 0
        return sortOrder === 'oldest'
          ? leftDate - rightDate
          : rightDate - leftDate
      })
  }, [articles, query, year, sortOrder])

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]">
      <header className="relative overflow-hidden bg-[#17241d] text-[#f8f1e4]">
        <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_80%_20%,#f6c453,transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-semibold tracking-[.2em] text-amber-300 uppercase">
            Reviewed catalogue
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-none sm:text-7xl">
            Historical newspaper catalogue
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            {loading
              ? 'Loading the reviewed catalogue…'
              : `Explore ${articles.length} active catalogue entries.`}{' '}
            Crops and duplicate views are entries, not independent newspaper
            issues, and uncertain transcriptions remain visibly under review.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-[2rem] border border-amber-950/10 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-amber-100 p-3 text-amber-900">
                <SlidersHorizontal className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-serif text-2xl">Find a record</h2>
                <p className="text-sm text-neutral-500">
                  Search across titles, places, people, tags, and
                  transcriptions.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#17241d] px-4 py-2 text-sm font-semibold text-white">
              {loading ? 'Loading…' : `${filteredArticles.length} records`}
            </span>
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_11rem_11rem]">
            <label className="relative block">
              <span className="sr-only">Search the newspaper catalogue</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search the newspaper catalogue"
                className="field pl-12"
              />
            </label>
            <label>
              <span className="sr-only">Filter by year</span>
              <select
                value={year}
                onChange={event => setYear(event.target.value)}
                className="field"
              >
                <option value="">All documented years</option>
                {years.map(value => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Sort catalogue</span>
              <select
                value={sortOrder}
                onChange={event =>
                  setSortOrder(event.target.value as SortOrder)
                }
                className="field"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title A–Z</option>
              </select>
            </label>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-10 rounded-[2rem] border border-red-200 bg-white p-8 text-center"
          >
            <h2 className="font-serif text-3xl">
              The catalogue could not be loaded.
            </h2>
            <p className="mt-3 text-neutral-600">
              Nothing has been lost. Refresh this page to try again.
            </p>
          </div>
        ) : loading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-[2rem] bg-white"
              />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-dashed border-amber-900/25 bg-white p-12 text-center">
            <h2 className="font-serif text-3xl">
              No records match that search.
            </h2>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setYear('')
                setSortOrder('newest')
              }}
              className="mt-5 min-h-11 rounded-full bg-[#17241d] px-5 font-semibold text-white"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map(article => (
              <CatalogueCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function CatalogueCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group overflow-hidden rounded-[2rem] border border-amber-950/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <article className="h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          {article.image ? (
            <Image
              src={article.image}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <FileText className="h-10 w-10" />
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-[#17241d]/90 px-3 py-1.5 text-[11px] font-bold tracking-[.12em] text-amber-100 uppercase">
            Newspaper record
          </span>
        </div>
        <div className="p-6">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[.13em] text-amber-800 uppercase">
            <CalendarDays className="h-3.5 w-3.5" />{' '}
            {displayDate(article.date, article.date_text)}
          </p>
          <h2 className="mt-3 font-serif text-2xl leading-tight text-[#17241d]">
            {article.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            {excerpt(article.content)}
          </p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-amber-950/10 pt-4 text-sm">
            <span className="truncate text-neutral-500">
              {article.publication || article.source || 'Publication unknown'}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-900">
              Open <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
