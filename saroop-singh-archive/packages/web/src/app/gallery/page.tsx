'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Download,
  ExternalLink,
  Images,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

interface GalleryItem {
  id: string
  title: string
  description?: string
  date?: string
  familyMember?: string
  tags: string[]
  thumbnailUrl: string
  restorationCount: number
}

interface GalleryResponse {
  success: boolean
  items: GalleryItem[]
  hasNextPage: boolean
  totalPages: number
}

type SortOrder = 'newest' | 'oldest' | 'title'

function displayArchiveDate(date?: string) {
  if (!date) return 'Date unknown'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  useEffect(() => {
    let active = true

    async function loadCollection() {
      try {
        const collected = new Map<string, GalleryItem>()
        for (let page = 1; page <= 100; page += 1) {
          const response = await fetch(`/api/gallery?page=${page}&limit=48`)
          if (!response.ok) throw new Error('Gallery request failed')
          const data: GalleryResponse = await response.json()
          data.items.forEach(item => collected.set(item.id, item))
          if (!data.hasNextPage || page >= data.totalPages) break
        }
        if (active) setItems(Array.from(collected.values()))
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadCollection()
    return () => {
      active = false
    }
  }, [])

  const tags = useMemo(
    () =>
      Array.from(new Set(items.flatMap(item => item.tags))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [items]
  )

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase()

    return items
      .filter(item => {
        if (tag && !item.tags.includes(tag)) return false
        if (!term) return true

        return [item.title, item.description, item.familyMember, ...item.tags]
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
  }, [items, query, tag, sortOrder])

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]">
      <section className="border-b border-amber-900/10 bg-[#1f2a24] text-[#f7f0df]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[.22em] text-amber-300 uppercase">
            <Images className="h-4 w-4" /> Photographic collection
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[.95] sm:text-7xl">
            Family memory, kept distinct from the historical record.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Public photographs from the archive. Some are family images, some
            are newspaper crops, and some have a separate restoration series.
            The catalogue does not treat an enhanced image as the original
            evidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/methodology"
              className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              How the archive handles sources
            </Link>
            <Link
              href="/contribute"
              className="inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-semibold text-[#17241d] transition hover:bg-amber-200"
            >
              Contribute a family photograph
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-[2rem] border border-amber-950/10 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-amber-100 p-3 text-amber-900">
                <SlidersHorizontal className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-serif text-2xl">Explore the collection</h2>
                <p className="text-sm text-neutral-500">
                  Search titles, family notes, and archive tags.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#17241d] px-4 py-2 text-sm font-semibold text-white">
              {loading ? 'Loading…' : `${filteredItems.length} photographs`}
            </span>
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_12rem_11rem]">
            <label className="relative block">
              <span className="sr-only">Search photographs</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search photographs, people, or tags"
                className="field pl-12"
              />
            </label>
            <label>
              <span className="sr-only">Filter by tag</span>
              <select
                value={tag}
                onChange={event => setTag(event.target.value)}
                className="field"
              >
                <option value="">All tags</option>
                {tags.map(value => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Sort photographs</span>
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
              The photographic catalogue could not be loaded.
            </h2>
            <p className="mt-3 text-neutral-600">
              Nothing has been changed. Refresh this page to try again.
            </p>
          </div>
        ) : loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="aspect-[4/5] animate-pulse rounded-[2rem] bg-white"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-dashed border-amber-900/25 bg-white p-12 text-center">
            <h2 className="font-serif text-3xl">
              No photographs match that search.
            </h2>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setTag('')
                setSortOrder('newest')
              }}
              className="mt-5 min-h-11 rounded-full bg-[#17241d] px-5 font-semibold text-white"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="group overflow-hidden rounded-[2rem] border border-amber-950/10 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:ring-4 focus:ring-amber-700/20 focus:outline-none"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-6">
                  <p className="flex items-center gap-2 text-xs font-semibold tracking-[.13em] text-emerald-800 uppercase">
                    <ShieldCheck className="h-3.5 w-3.5" /> Archive photograph
                    {item.restorationCount
                      ? ` · ${item.restorationCount} related ${item.restorationCount === 1 ? 'study' : 'studies'}`
                      : ''}
                  </p>
                  <h2 className="mt-3 font-serif text-2xl leading-tight">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    {displayArchiveDate(item.date)}
                    {item.familyMember ? ` · ${item.familyMember}` : ''}
                  </p>
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-600">
                    {item.description ||
                      'Open the archival image and its available public information.'}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-amber-950/10 pt-4">
                    <span className="text-sm font-semibold text-amber-900">
                      Open photograph
                    </span>
                    <ExternalLink className="h-4 w-4 text-amber-900" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={open => {
          if (!open) setSelectedItem(null)
        }}
      >
        {selectedItem && (
          <DialogContent className="block h-[calc(100dvh-1rem)] max-w-6xl overflow-hidden border-white/10 bg-neutral-950 p-0 text-white sm:h-[min(92dvh,56rem)]">
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
              <div className="relative min-h-0 overflow-hidden bg-black">
                <Image
                  src={selectedItem.thumbnailUrl}
                  alt={`${selectedItem.title}, public archive image`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 80vw"
                  className="object-contain p-2 sm:p-4"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
                  Fit to screen · public archive image
                </span>
              </div>
              <div className="border-t border-white/10 bg-[#1f2a24] px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
                <DialogTitle className="pr-12 font-serif text-2xl text-white sm:text-3xl">
                  {selectedItem.title}
                </DialogTitle>
                <DialogDescription className="mt-2 text-stone-300">
                  {selectedItem.description || 'Public archive photograph.'}
                </DialogDescription>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-300">
                  <span>{displayArchiveDate(selectedItem.date)}</span>
                  {selectedItem.familyMember && (
                    <span>{selectedItem.familyMember}</span>
                  )}
                  <span>
                    {selectedItem.restorationCount
                      ? `${selectedItem.restorationCount} related public studies`
                      : 'No related public study'}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={selectedItem.thumbnailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-5 font-semibold text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" /> Open image
                  </a>
                  <a
                    href={selectedItem.thumbnailUrl}
                    download
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-amber-300 px-5 font-semibold text-[#17241d]"
                  >
                    <Download className="h-4 w-4" /> Download public copy
                  </a>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </main>
  )
}
