import { getAllArticles } from '@/lib/articles'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, FileText, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guided Family Story',
  description:
    'A source-led introduction to the surviving record of Saroop Singh.',
}

export default async function StoryPage() {
  const articles = await getAllArticles()
  const chronological = [...articles]
    .filter(article => article.date)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const firstRecord = chronological[0]
  const recordYear = articles.find(
    article =>
      article.slug ===
      '1937-07-19_straits-times_saroop-singh-half-mile-winner-state-record-photo'
  )

  return (
    <main className="bg-[#17241d] text-[#f8f1e4]">
      <section className="grid min-h-[calc(100vh-5rem)] items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-[8vw]">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[.22em] text-amber-300 uppercase">
            <ShieldCheck className="h-4 w-4" /> A guided reading of the evidence
          </p>
          <h1 className="mt-5 font-serif text-6xl leading-[.88] sm:text-8xl">
            A name enters the record.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300">
            The archive begins with surviving newspaper reports, not a complete
            biography. They show an athlete in pre-war Malaya; they do not
            answer every question a family may still hold.
          </p>
          {firstRecord && (
            <Link
              href={`/articles/${firstRecord.slug}`}
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-6 font-semibold transition hover:bg-white/10"
            >
              Start with the earliest record <FileText className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
          <Image
            src="/gallery/saroop-singh-running2.png"
            alt="Newspaper portrait identifying Saroop Singh as the half-mile winner"
            fill
            priority
            unoptimized
            sizes="(max-width: 1024px) 90vw, 42vw"
            className="object-contain contrast-110 grayscale"
          />
        </div>
      </section>

      <section className="bg-amber-300 px-5 py-20 text-[#17241d] sm:px-8 lg:px-[8vw]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold tracking-[.2em] uppercase">
              1937 · a reported breakthrough
            </p>
            <div className="mt-6 font-mono text-[clamp(5rem,18vw,13rem)] leading-none font-bold tracking-[-.08em]">
              880
            </div>
            <p className="mt-2 text-xl font-semibold">
              yards. A state-record performance in the reports.
            </p>
            <p className="mt-6 max-w-xl text-sm leading-7 text-amber-950/75">
              Contemporary reports document a record performance. Where later
              reports differ in their exact timing, the archive keeps that
              uncertainty visible rather than selecting a convenient answer.
            </p>
          </div>
          <RecordImage article={recordYear} />
        </div>
        {recordYear && (
          <div className="mx-auto max-w-7xl">
            <Link
              href={`/articles/${recordYear.slug}`}
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white transition hover:bg-black"
            >
              Read the supporting report <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <section className="grid min-h-[72vh] items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-[8vw]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <Image
            src="/gallery/gemini-extended-family-portrait-1970s-group-original.jpg"
            alt="An unidentified extended family portrait held in the archive"
            fill
            unoptimized
            sizes="(max-width: 1024px) 90vw, 50vw"
            className="object-cover opacity-85"
          />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[.2em] text-amber-300 uppercase">
            The record remains unfinished
          </p>
          <h2 className="mt-5 font-serif text-5xl leading-[.9] sm:text-7xl">
            Family memory can return what print cannot hold.
          </h2>
          <p className="mt-7 text-lg leading-8 text-stone-300">
            Newspapers preserve public results. Families preserve voices,
            nicknames, relationships, and the meaning of a day. Every family
            contribution is private until an archive reviewer chooses to publish
            it.
          </p>
          <Link
            href="/remember"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-300 px-6 font-semibold text-[#17241d] transition hover:bg-amber-200"
          >
            Add to the family record <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-[#f6f1e8] px-5 py-20 text-center text-[#17241d] sm:px-8">
        <h2 className="mx-auto max-w-5xl font-serif text-5xl leading-[.9] sm:text-7xl">
          This archive is unfinished because memory still lives with you.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
          Help improve the record with a photograph, a name, a correction, or a
          story. Nothing is published automatically.
        </p>
      </section>
    </main>
  )
}

function RecordImage({
  article,
}: {
  article: Awaited<ReturnType<typeof getAllArticles>>[number] | undefined
}) {
  if (!article?.image) {
    return (
      <div className="aspect-[4/3] rounded-[2rem] bg-white/50 shadow-2xl" />
    )
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <Image
        src={article.image}
        alt={article.title}
        fill
        priority
        unoptimized
        sizes="(max-width: 1024px) 90vw, 55vw"
        className="object-contain p-3"
      />
    </div>
  )
}
