import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Palette,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Archive Method',
  description:
    'How the Saroop Singh Archive handles transcription, attribution, restoration, uncertainty, and citation.',
}

const principles = [
  {
    icon: ScanSearch,
    title: 'The source capture remains visible',
    body: 'Transcriptions make clippings searchable, but readers should be able to inspect the best available scan, screenshot, or crop and understand what kind of source it is.',
  },
  {
    icon: ShieldCheck,
    title: 'AI outputs never become evidence',
    body: 'A restoration study may help a family examine a photograph, but it does not replace the source or prove details the source does not contain.',
  },
  {
    icon: CheckCircle2,
    title: 'Uncertainty stays visible',
    body: 'Unknown dates, incomplete scans, variant spellings, duplicate reports, and later identity questions remain documented rather than silently invented away.',
  },
]

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#f6f1e8] text-neutral-900">
      <section className="border-b border-amber-900/10 bg-[#1f2a24] text-[#f7f0df]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="mb-5 text-sm font-semibold tracking-[0.24em] text-amber-300 uppercase">
            Archive standard
          </p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] sm:text-7xl">
            Evidence first. Enhancement second.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-stone-300 sm:text-xl">
            This archive separates what the historical record shows from what
            later transcription or restoration helps us see.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {principles.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-amber-900/10 bg-white p-7 shadow-sm"
            >
              <Icon className="h-7 w-7 text-amber-700" aria-hidden="true" />
              <h2 className="mt-5 font-serif text-2xl">{title}</h2>
              <p className="mt-3 leading-7 text-neutral-600">{body}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-[2rem] border border-amber-900/15 bg-white p-6 sm:p-10">
          <p className="text-xs font-semibold tracking-[.2em] text-amber-800 uppercase">
            Preserve first
          </p>
          <h2 className="mt-4 font-serif text-5xl text-[#17241d]">
            Original files are private and handled separately from public
            display.
          </h2>
          <div className="mt-5 grid gap-6 text-base leading-7 text-neutral-700 lg:grid-cols-2">
            <p>
              Family contributions remain private while they are reviewed. A
              contributor&apos;s contact details, original upload, and notes do
              not appear in the public gallery.
            </p>
            <p>
              Publishing is an explicit curator action. The archive can share a
              selected public derivative with a clean title, story, and tags
              while keeping the original material and private intake record
              protected.
            </p>
          </div>
          <Link
            href="/contribute"
            className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#17241d] px-6 font-semibold text-white transition hover:bg-[#2b3b30]"
          >
            Contribute a photograph or reverse scan
          </Link>
        </section>

        <section className="mt-8 rounded-[2rem] bg-[#17241d] p-6 text-[#f8f1e4] sm:p-10">
          <p className="text-xs font-semibold tracking-[.2em] text-amber-300 uppercase">
            Private preservation studies
          </p>
          <h2 className="mt-4 font-serif text-5xl">
            A study is labelled, reviewed, and never substitutes for the source.
          </h2>
          <p className="mt-5 max-w-3xl leading-7 text-stone-300">
            The archive&apos;s private studio can generate a restoration study
            only for the person who supplied the source. Generated
            interpretations are kept separate from source files and require
            human review before any public use.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [
                'Preserve the source',
                'Keep the original scan, title, date and story together.',
              ],
              [
                'Review carefully',
                'Inspect a study against the source before saving or sharing it.',
              ],
              [
                'Describe honestly',
                'Do not label an AI interpretation as recovered historical fact.',
              ],
            ].map(([title, body], index) => {
              const Icon =
                index === 0 ? ShieldCheck : index === 1 ? ScanSearch : Palette
              return (
                <article
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <Icon className="h-6 w-6 text-amber-300" />
                  <h3 className="mt-4 font-serif text-2xl">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-400">
                    {body}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <div className="mt-16 grid gap-12 border-t border-amber-900/15 pt-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <BookOpen className="h-8 w-8 text-amber-700" aria-hidden="true" />
            <h2 className="mt-5 font-serif text-3xl">
              How to cite the collection
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-neutral-700">
            <p>
              Use the article title, original publication when known, original
              date when known, and “Saroop Singh Archive,” followed by the
              article URL and your access date.
            </p>
            <div className="rounded-xl border border-amber-900/10 bg-white p-5 font-mono text-sm leading-6 text-neutral-600">
              “Article title.” <em>Original publication</em>, date. Saroop Singh
              Archive. URL. Accessed day month year.
            </div>
            <Link
              href="/articles"
              className="inline-flex items-center font-semibold text-amber-800 hover:text-amber-950"
            >
              Explore the primary sources{' '}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
