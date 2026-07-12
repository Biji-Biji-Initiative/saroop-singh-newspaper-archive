'use client'

import Image from 'next/image'
import { useState, type FormEvent } from 'react'
import { Check, LockKeyhole, RefreshCw, ShieldCheck, X } from 'lucide-react'

import { ResponsiveContainer } from '@/components/layout/responsivecontainer'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ReviewAction = 'published' | 'rejected'

interface ReviewItem {
  id: string
  status: 'pending' | 'published' | 'rejected'
  submittedAt: string
  thumbnailUrl: string | null
  restorationCount: number
  metadata: {
    title?: string
    description?: string
    date?: string
    familyMember?: string
    tags?: string[]
  }
  photoAnalysis?: {
    faceCount: number
    faces: Array<{
      location: string
      visibility: 'clear' | 'partial' | 'uncertain'
    }>
    photoSummary: string
    suggestedTags: string[]
    reviewRequired: true
  }
}

interface ReviewQueueResponse {
  success: boolean
  items: ReviewItem[]
  count: number
  error?: string
}

function displayTimestamp(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? 'Submitted date unavailable'
    : parsed.toLocaleString()
}

function responseError(payload: unknown, fallback: string): string {
  return typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'string'
    ? payload.error
    : fallback
}

export function ArchiveReviewQueue() {
  const [adminToken, setAdminToken] = useState('')
  const [items, setItems] = useState<ReviewItem[]>([])
  const [hasLoadedQueue, setHasLoadedQueue] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [publishCandidate, setPublishCandidate] = useState<ReviewItem | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const authorizationHeaders = (): HeadersInit => ({
    Authorization: `Bearer ${adminToken.trim()}`,
  })

  const loadQueue = async () => {
    if (!adminToken.trim()) {
      setError('Enter the private archive review token to continue.')
      return
    }

    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        '/api/gallery/moderation?status=pending&limit=100',
        { headers: authorizationHeaders() }
      )
      const payload = (await response.json()) as ReviewQueueResponse

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'That review token was not accepted.'
            : responseError(payload, 'Unable to load the review queue.')
        )
      }

      setItems(payload.items)
      setHasLoadedQueue(true)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load the review queue.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadQueue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await loadQueue()
  }

  const reviewContribution = async (item: ReviewItem, action: ReviewAction) => {
    if (!adminToken.trim()) {
      setError('Enter the private archive review token to continue.')
      return
    }

    setReviewingId(item.id)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/gallery?id=${encodeURIComponent(item.id)}`,
        {
          method: 'PATCH',
          headers: {
            ...authorizationHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: action }),
        }
      )
      const payload: unknown = await response.json()

      if (!response.ok) {
        throw new Error(
          responseError(payload, 'Unable to update this contribution.')
        )
      }

      setItems(current => current.filter(candidate => candidate.id !== item.id))
      setMessage(
        action === 'published'
          ? `Published “${item.metadata.title || 'Untitled memory'}” to the public gallery.`
          : `Kept “${item.metadata.title || 'Untitled memory'}” private.`
      )
      if (action === 'published') {
        setPublishCandidate(null)
      }
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Unable to update this contribution.'
      )
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      <ResponsiveContainer className="py-8 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Family archive review
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">
              Review private contributions before they become part of the public
              family archive. Publishing copies only the selected restoration;
              the contributor&apos;s original remains private.
            </p>
          </header>

          <Card className="border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-slate-950">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                Open the private queue
              </CardTitle>
              <CardDescription>
                The review token is used only for this browser session. This
                page never saves it to local storage or sends it anywhere other
                than the archive&apos;s protected review API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={handleLoadQueue}
              >
                <label className="sr-only" htmlFor="archive-review-token">
                  Archive review token
                </label>
                <input
                  id="archive-review-token"
                  type="password"
                  autoComplete="off"
                  value={adminToken}
                  onChange={event => setAdminToken(event.target.value)}
                  placeholder="Enter the private review token"
                  className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm shadow-sm transition outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20"
                />
                <Button
                  type="submit"
                  loading={isLoading}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  Load pending contributions
                </Button>
              </form>
            </CardContent>
          </Card>

          {(error || message) && (
            <div
              className={
                error
                  ? 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800'
                  : 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900'
              }
              role="status"
            >
              {error || message}
            </div>
          )}

          {hasLoadedQueue && !isLoading && items.length === 0 && !error && (
            <Card className="border-dashed border-slate-300 bg-white/70">
              <CardContent className="py-10 text-center text-slate-600">
                There are no pending contributions right now.
              </CardContent>
            </Card>
          )}

          {items.length > 0 && (
            <section
              aria-label="Pending family contributions"
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-950">
                  Pending contributions ({items.length})
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading || reviewingId !== null}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => void loadQueue()}
                >
                  Refresh
                </Button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {items.map(item => {
                  const isReviewing = reviewingId === item.id
                  const title = item.metadata.title || 'Untitled memory'

                  return (
                    <Card
                      key={item.id}
                      className="overflow-hidden border-slate-200 bg-white shadow-md"
                    >
                      {item.thumbnailUrl && (
                        <div className="relative aspect-[4/3] bg-slate-100">
                          <Image
                            src={item.thumbnailUrl}
                            alt={`Private contribution preview: ${title}`}
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <CardHeader className="space-y-2">
                        <CardTitle className="text-lg text-slate-950">
                          {title}
                        </CardTitle>
                        <CardDescription>
                          Submitted {displayTimestamp(item.submittedAt)} ·{' '}
                          {item.restorationCount} restoration
                          {item.restorationCount === 1 ? '' : 's'} selected
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {item.metadata.description && (
                          <p className="text-sm leading-relaxed text-slate-700">
                            {item.metadata.description}
                          </p>
                        )}
                        <dl className="grid gap-2 text-sm text-slate-700">
                          {item.metadata.date && (
                            <div>
                              <dt className="font-medium text-slate-900">
                                Photo date
                              </dt>
                              <dd>{item.metadata.date}</dd>
                            </div>
                          )}
                          {item.metadata.familyMember && (
                            <div>
                              <dt className="font-medium text-slate-900">
                                Family connection
                              </dt>
                              <dd>{item.metadata.familyMember}</dd>
                            </div>
                          )}
                        </dl>
                        {item.metadata.tags &&
                          item.metadata.tags.length > 0 && (
                            <div
                              className="flex flex-wrap gap-2"
                              aria-label="Contribution tags"
                            >
                              {item.metadata.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        {item.photoAnalysis && (
                          <aside className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                            <p className="font-medium">
                              Private visual notes — verify before publishing
                            </p>
                            <p>
                              {item.photoAnalysis.faceCount} visible{' '}
                              {item.photoAnalysis.faceCount === 1
                                ? 'face'
                                : 'faces'}{' '}
                              detected. The system does not identify people by
                              name.
                            </p>
                            <p>{item.photoAnalysis.photoSummary}</p>
                            {item.photoAnalysis.faces.length > 0 && (
                              <p>
                                <span className="font-medium">Locations: </span>
                                {item.photoAnalysis.faces
                                  .map(
                                    face =>
                                      `${face.location} (${face.visibility})`
                                  )
                                  .join(', ')}
                              </p>
                            )}
                            {item.photoAnalysis.suggestedTags.length > 0 && (
                              <p>
                                <span className="font-medium">
                                  Suggested tags:{' '}
                                </span>
                                {item.photoAnalysis.suggestedTags.join(', ')}
                              </p>
                            )}
                          </aside>
                        )}
                        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                          <Button
                            type="button"
                            variant="destructive"
                            className="flex-1"
                            disabled={reviewingId !== null}
                            loading={isReviewing}
                            leftIcon={<X className="h-4 w-4" />}
                            onClick={() =>
                              void reviewContribution(item, 'rejected')
                            }
                          >
                            Keep private
                          </Button>
                          <Button
                            type="button"
                            className="flex-1"
                            disabled={reviewingId !== null}
                            leftIcon={<Check className="h-4 w-4" />}
                            onClick={() => {
                              setError(null)
                              setPublishCandidate(item)
                            }}
                          >
                            Publish to gallery
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          <Dialog
            open={publishCandidate !== null}
            onOpenChange={open => {
              if (!open && reviewingId === null) {
                setPublishCandidate(null)
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publish this family contribution?</DialogTitle>
                <DialogDescription>
                  {publishCandidate
                    ? `“${publishCandidate.metadata.title || 'Untitled memory'}” will become visible in the public gallery.`
                    : 'This contribution will become visible in the public gallery.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-medium">Please check before publishing</p>
                <p>
                  You are publishing the selected restoration and its archive
                  context. The contributor&apos;s original upload remains
                  private.
                </p>
              </div>
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reviewingId !== null}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  loading={
                    publishCandidate !== null &&
                    reviewingId === publishCandidate.id
                  }
                  disabled={publishCandidate === null || reviewingId !== null}
                  leftIcon={<Check className="h-4 w-4" />}
                  onClick={() => {
                    if (publishCandidate) {
                      void reviewContribution(publishCandidate, 'published')
                    }
                  }}
                >
                  Confirm publication
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ResponsiveContainer>
    </main>
  )
}
