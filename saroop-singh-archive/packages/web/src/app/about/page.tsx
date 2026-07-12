import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CircleHelp,
  FileText,
  ShieldCheck,
  Trophy,
} from 'lucide-react'
import { getAllArticles } from '@/lib/articles'

export const metadata: Metadata = {
  title: 'About Saroop Singh',
  description:
    'What the surviving newspaper record can—and cannot yet—tell us about Saroop Singh.',
}

const anchorRecords = [
  {
    slug: '1936-07-18_straits-times_athletic-results-saroop-singh',
    year: '1936',
    title: 'A dated one-mile result',
    text: 'The Straits Times lists Saroop Singh in the Victoria Institution sports results. The clipping records the result; it does not prove his student status.',
  },
  {
    slug: '1937-07-19_straits-times_saroop-singh-half-mile-winner-state-record-photo',
    year: '1937',
    title: 'A half-mile winner in the record',
    text: 'A published photograph and reports document a Selangor half-mile victory and state-record performance in July 1937.',
  },
  {
    slug: '1940-08-07_straits-times_st-john-ambulance-brigade-sports-saroop-singh',
    year: '1940',
    title: 'An individual championship report',
    text: 'An August report names Saroop Singh individual champion at St. John Ambulance Brigade sports.',
  },
] as const

export default async function AboutPage() {
  const articles = await getAllArticles()
  const records = anchorRecords.map(record => ({
    ...record,
    article: articles.find(article => article.slug === record.slug),
  }))

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]">
      <section className="relative overflow-hidden bg-[#17241d] text-[#f8f1e4]">
        <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_80%_20%,#f6c453,transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[.22em] text-amber-300 uppercase">
              <ShieldCheck className="h-4 w-4" /> About the record
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[.88] sm:text-8xl">
              Saroop Singh, in the surviving evidence.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300">
              This is not a complete biography. It is a family-led archive of
              the newspaper reports, photographs, and questions that have
              survived—and of the context family members may still return to
              them.
            </p>
            <Link
              href="/story"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-300 px-6 font-semibold text-[#17241d] transition hover:bg-amber-200"
            >
              Begin the guided story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
            <Image
              src="/gallery/saroop-singh-running2.png"
              alt="Newspaper portrait identifying Saroop Singh as the half-mile winner"
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-contain grayscale"
            />
            <span className="absolute bottom-4 left-4 rounded-full bg-black/75 px-4 py-2 text-xs font-semibold tracking-[.14em] text-amber-200 uppercase">
              Newspaper source crop
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[.18em] text-amber-800 uppercase">
            What the archive can say
          </p>
          <h2 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">
            A sporting life becomes visible across the records.
          </h2>
          <p className="mt-6 text-lg leading-8 text-neutral-600">
            The collection contains {articles.length} reviewed catalogue
            entries. Together, they document reported races, results, and
            community sport across pre-war and post-war Malaya. Each statement
            below links back to a surviving source.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {records.map(({ article, title, text, year }) => (
            <article
              key={year}
              className="rounded-[2rem] border border-amber-950/10 bg-white p-7 shadow-sm"
            >
              <p className="text-xs font-semibold tracking-[.18em] text-amber-800 uppercase">
                {year} · source record
              </p>
              <Trophy className="mt-5 h-7 w-7 text-amber-700" />
              <h3 className="mt-5 font-serif text-3xl leading-none">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-neutral-600">{text}</p>
              {article && (
                <Link
                  href={`/articles/${article.slug}`}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900"
                >
                  Read the source <FileText className="h-4 w-4" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_.9fr]">
          <div>
            <p className="text-xs font-semibold tracking-[.18em] text-amber-800 uppercase">
              What remains open
            </p>
            <h2 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">
              The gaps are part of the story.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              The surviving newspapers do not yet establish Saroop Singh&apos;s
              family relationships, full life dates, or whether every later
              sporting reference names the same person. The archive does not
              turn a shared surname or a plausible guess into a fact.
            </p>
            <Link
              href="/timeline"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white transition hover:bg-[#2b3b30]"
            >
              Read the evidence-led chronology{' '}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <aside className="rounded-[2rem] bg-amber-100 p-7 sm:p-9">
            <CircleHelp className="h-8 w-8 text-amber-800" />
            <h3 className="mt-6 font-serif text-4xl leading-none">
              Can your family help?
            </h3>
            <p className="mt-5 leading-7 text-amber-950/75">
              A name, a handwritten note, the reverse of a photograph, or a
              remembered connection can make a record stronger. Contributions
              are private until reviewed; uncertainty is welcome.
            </p>
            <Link
              href="/remember"
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white"
            >
              Enter the family room <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  )
}
