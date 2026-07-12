'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  X,
} from 'lucide-react'

import { ResponsiveContainer } from '@/components/layout/responsivecontainer'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const MAX_FILES = 12
const MAX_FILE_BYTES = 25 * 1024 * 1024

interface PhotoDetails {
  title: string
  dateText: string
  people: string
  story: string
  tags: string
}

interface SubmissionResult {
  received: number
  duplicates: number
  errors: string[]
}

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function responseError(payload: unknown, fallback: string): string {
  return typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'string'
    ? payload.error
    : fallback
}

export function FamilyContributionForm() {
  const [files, setFiles] = useState<File[]>([])
  const [details, setDetails] = useState<Record<string, PhotoDetails>>({})
  const [contributorName, setContributorName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [contact, setContact] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [progress, setProgress] = useState<{
    current: number
    total: number
  } | null>(null)

  const previews = useMemo(
    () =>
      files.map(file => ({
        file,
        key: fileKey(file),
        url: URL.createObjectURL(file),
      })),
    [files]
  )

  useEffect(
    () => () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url))
    },
    [previews]
  )

  const selectFiles = (selected: File[]) => {
    const messages: string[] = []
    if (selected.length > MAX_FILES) {
      messages.push(`Choose up to ${MAX_FILES} photographs at a time.`)
    }

    const limited = selected.slice(0, MAX_FILES)
    const safe = limited.filter(
      file => file.size > 0 && file.size <= MAX_FILE_BYTES
    )
    if (safe.length !== limited.length) {
      messages.push('Each photograph must be between 1 byte and 25 MB.')
    }

    setFiles(safe)
    setDetails(current =>
      Object.fromEntries(
        safe.map(file => {
          const key = fileKey(file)
          return [
            key,
            current[key] || {
              title: file.name.replace(/\.[^.]+$/, ''),
              dateText: '',
              people: '',
              story: '',
              tags: '',
            },
          ]
        })
      )
    )
    setSelectionError(messages.join(' ') || null)
    setResult(null)
  }

  const updateDetails = (key: string, changes: Partial<PhotoDetails>) => {
    setDetails(current => ({
      ...current,
      [key]: { ...current[key], ...changes },
    }))
  }

  const removePhoto = (key: string) => {
    setFiles(current => current.filter(file => fileKey(file) !== key))
    setDetails(current => {
      const next = { ...current }
      delete next[key]
      return next
    })
    setResult(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!files.length || !consent || !contributorName.trim()) {
      return
    }

    setBusy(true)
    setResult(null)
    const errors: string[] = []
    const failedFiles: File[] = []
    let received = 0
    let duplicates = 0

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      const metadata = details[fileKey(file)]
      setProgress({ current: index + 1, total: files.length })

      const form = new FormData()
      form.set('file', file)
      form.set('title', metadata?.title || file.name.replace(/\.[^.]+$/, ''))
      form.set('dateText', metadata?.dateText || '')
      form.set('people', metadata?.people || '')
      form.set('story', metadata?.story || '')
      form.set('tags', metadata?.tags || '')
      form.set('contributorName', contributorName.trim())
      form.set('relationship', relationship.trim())
      form.set('contact', contact.trim())
      form.set('consent', 'yes')

      try {
        const response = await fetch('/api/contribute', {
          method: 'POST',
          body: form,
        })
        const payload: unknown = await response.json()

        if (response.ok) {
          if (
            typeof payload === 'object' &&
            payload !== null &&
            'duplicate' in payload &&
            payload.duplicate === true
          ) {
            duplicates += 1
          } else {
            received += 1
          }
          continue
        }

        errors.push(
          `${file.name}: ${responseError(payload, 'Could not preserve this photograph.')}`
        )
        failedFiles.push(file)
      } catch {
        errors.push(
          `${file.name}: connection failed while preserving this photograph.`
        )
        failedFiles.push(file)
      }
    }

    setFiles(failedFiles)
    setDetails(current =>
      Object.fromEntries(
        failedFiles.map(file => [fileKey(file), current[fileKey(file)]])
      )
    )
    setResult({ received, duplicates, errors })
    setProgress(null)
    setBusy(false)
  }

  return (
    <ResponsiveContainer className="py-8 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="rounded-3xl bg-amber-100/70 p-6 sm:p-8">
          <ShieldCheck className="h-8 w-8 text-amber-900" aria-hidden="true" />
          <h2 className="mt-5 font-serif text-3xl text-amber-950">
            Preserve first
          </h2>
          <ol className="mt-6 space-y-5 text-sm leading-6 text-amber-950/90">
            <li>
              <strong>1. Kept private.</strong>
              <br />
              Your exact photograph and notes are stored for family review.
            </li>
            <li>
              <strong>2. Reviewed together.</strong>
              <br />
              Names, dates, stories, and public visibility are checked by a
              family curator.
            </li>
            <li>
              <strong>3. Published deliberately.</strong>
              <br />
              Nothing here is shared publicly without that separate decision.
            </li>
          </ol>
          <p className="mt-7 flex gap-2 border-t border-amber-900/15 pt-5 text-xs leading-5 text-amber-950/75">
            <LockKeyhole
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            This preservation path does not send your photograph to an AI
            provider. If you want a private restoration study, use the{' '}
            <Link
              href="/restore"
              className="font-semibold underline underline-offset-2"
            >
              restoration studio
            </Link>{' '}
            instead.
          </p>
        </aside>

        <Card className="border-amber-950/10 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-950">
              <ImagePlus
                className="h-6 w-6 text-amber-800"
                aria-hidden="true"
              />
              Share family photographs
            </CardTitle>
            <CardDescription>
              Add up to {MAX_FILES} JPG, PNG, or WEBP photographs at once, up to
              25 MB each. Add only details your family knows; unknown is always
              welcome.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={submit}>
              <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-900/20 bg-amber-50/60 p-5 text-center transition focus-within:ring-4 focus-within:ring-amber-300 hover:bg-amber-50">
                <ImagePlus
                  className="h-8 w-8 text-amber-800"
                  aria-hidden="true"
                />
                <span className="mt-3 text-lg font-semibold text-slate-950">
                  Choose family photographs
                </span>
                <span className="mt-1 text-sm text-slate-600">
                  JPG, PNG, or WEBP · up to 25 MB each · {MAX_FILES} at a time
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={event =>
                    selectFiles(Array.from(event.target.files || []))
                  }
                />
              </label>

              {selectionError && (
                <p
                  className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-900"
                  role="alert"
                >
                  {selectionError}
                </p>
              )}

              {previews.length > 0 && (
                <section
                  className="space-y-3"
                  aria-label="Selected family photographs"
                >
                  <div>
                    <h3 className="font-serif text-2xl text-slate-950">
                      Describe each photograph
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Each file becomes its own private archive record.
                    </p>
                  </div>
                  {previews.map(({ file, key, url }, index) => {
                    const photo = details[key]
                    return (
                      <article
                        key={key}
                        className="rounded-2xl border border-slate-200 bg-stone-50 p-3 sm:p-4"
                      >
                        <div className="grid grid-cols-[5.5rem_1fr] items-start gap-3 sm:grid-cols-[7rem_1fr]">
                          <Image
                            src={url}
                            alt=""
                            width={160}
                            height={160}
                            unoptimized
                            className="aspect-square w-full rounded-xl bg-stone-200 object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-[0.14em] text-amber-800 uppercase">
                                  Photograph {index + 1} of {previews.length}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {file.name}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                aria-label={`Remove ${file.name}`}
                                disabled={busy}
                                onClick={() => removePhoto(key)}
                              >
                                <X className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </div>
                            <label className="mt-3 block text-sm font-semibold text-slate-900">
                              Title or short identification
                              <input
                                value={photo?.title || ''}
                                maxLength={160}
                                onChange={event =>
                                  updateDetails(key, {
                                    title: event.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal shadow-sm transition outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
                              />
                            </label>
                          </div>
                        </div>
                        <details
                          className="mt-3 rounded-xl bg-white p-3"
                          open={previews.length === 1}
                        >
                          <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                            Add date, names, story, and tags
                          </summary>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label className="text-sm font-semibold text-slate-900">
                              Approximate date
                              <input
                                value={photo?.dateText || ''}
                                maxLength={100}
                                placeholder="For example: c. 1952"
                                onChange={event =>
                                  updateDetails(key, {
                                    dateText: event.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
                              />
                            </label>
                            <label className="text-sm font-semibold text-slate-900">
                              People pictured
                              <input
                                value={photo?.people || ''}
                                maxLength={240}
                                placeholder="Left to right, if known"
                                onChange={event =>
                                  updateDetails(key, {
                                    people: event.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
                              />
                            </label>
                            <label className="text-sm font-semibold text-slate-900 sm:col-span-2">
                              Story or context
                              <textarea
                                value={photo?.story || ''}
                                maxLength={2000}
                                rows={3}
                                placeholder="Place, occasion, writing on the back, or who kept it…"
                                onChange={event =>
                                  updateDetails(key, {
                                    story: event.target.value,
                                  })
                                }
                                className="mt-1 w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
                              />
                            </label>
                            <label className="text-sm font-semibold text-slate-900 sm:col-span-2">
                              Optional tags
                              <input
                                value={photo?.tags || ''}
                                maxLength={720}
                                placeholder="family album, Kuala Lumpur, athletics"
                                onChange={event =>
                                  updateDetails(key, {
                                    tags: event.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
                              />
                            </label>
                          </div>
                        </details>
                      </article>
                    )
                  })}
                </section>
              )}

              <section className="grid gap-4 rounded-2xl bg-stone-100 p-4 sm:grid-cols-2 sm:p-5">
                <label className="text-sm font-semibold text-slate-900">
                  Your name *
                  <input
                    value={contributorName}
                    required
                    maxLength={120}
                    onChange={event => setContributorName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-900">
                  Relationship to the family
                  <input
                    value={relationship}
                    maxLength={160}
                    placeholder="For example: granddaughter, cousin"
                    onChange={event => setRelationship(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-900 sm:col-span-2">
                  Email or phone for private follow-up
                  <input
                    value={contact}
                    maxLength={240}
                    inputMode="email"
                    onChange={event => setContact(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/20"
                  />
                </label>
              </section>

              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <label className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-slate-800">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={event => setConsent(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-800 focus:ring-amber-800"
                />
                <span>
                  I have the right to share these photographs and allow the
                  archive to preserve them privately for family review.
                  Publication requires a separate curator decision.
                </span>
              </label>

              <Button
                type="submit"
                size="lg"
                disabled={
                  busy ||
                  files.length === 0 ||
                  !consent ||
                  !contributorName.trim()
                }
                className="w-full bg-amber-900 text-white hover:bg-amber-950"
              >
                {busy ? (
                  <>
                    <Loader2
                      className="mr-2 h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    {progress
                      ? `Preserving ${progress.current} of ${progress.total}…`
                      : 'Preserving securely…'}
                  </>
                ) : (
                  <>
                    <ImagePlus className="mr-2 h-5 w-5" aria-hidden="true" />
                    Submit for family review
                  </>
                )}
              </Button>

              {result && (
                <div
                  className={`rounded-2xl p-4 text-sm ${
                    result.errors.length
                      ? 'bg-red-50 text-red-900'
                      : 'bg-emerald-50 text-emerald-900'
                  }`}
                  role="status"
                >
                  {result.received > 0 && (
                    <p className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      {result.received} photograph
                      {result.received === 1 ? '' : 's'} safely received for
                      private review.
                    </p>
                  )}
                  {result.duplicates > 0 && (
                    <p className="mt-2">
                      {result.duplicates} photograph
                      {result.duplicates === 1 ? ' was' : 's were'} already
                      preserved.
                    </p>
                  )}
                  {result.errors.map(error => (
                    <p key={error} className="mt-2">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  )
}
