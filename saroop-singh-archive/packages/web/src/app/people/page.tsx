import { getAllArticles } from '@/lib/articles'
import Image from 'next/image'
import type { Metadata } from 'next'
import { CircleHelp, FileText, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'People in the Archive',
  description:
    'An evidence-led index of people named in the Saroop Singh Archive.',
}

export default async function PeoplePage() {
  const articles = await getAllArticles()
  const people = new Map<string, number>()

  for (const article of articles) {
    for (const person of article.people ?? []) {
      const name = person.trim()
      if (name) people.set(name, (people.get(name) ?? 0) + 1)
    }
  }

  const indexedPeople = [...people.entries()]
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 18)

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]">
      <section className="bg-[#17241d] text-[#f8f1e4]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[.22em] text-amber-300 uppercase">
            <Users className="h-4 w-4" /> Evidence index
          </p>
          <h1 className="mt-5 max-w-5xl font-serif text-6xl leading-[.92] sm:text-8xl">
            People named in the archive.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            This index connects names to the newspaper records that mention
            them. A shared surname is not treated as a family relationship, and
            variant spellings remain separate until a human review can establish
            more.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
        <article className="grid overflow-hidden rounded-[2rem] bg-amber-300 shadow-xl lg:grid-cols-[.8fr_1.2fr]">
          <div className="relative min-h-72 bg-[#17241d] lg:min-h-[28rem]">
            <Image
              src="/gallery/saroop-singh-running2.png"
              alt="Newspaper portrait identifying Saroop Singh as the half-mile winner"
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain grayscale"
            />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-12">
            <p className="text-xs font-semibold tracking-[.2em] text-amber-950/70 uppercase">
              Central archive subject
            </p>
            <h2 className="mt-4 font-serif text-6xl leading-none sm:text-7xl">
              Saroop Singh
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-amber-950/75">
              The records document a middle- and long-distance runner in
              results, a 1937 Selangor record, railway sport, and cross-country
              entries. They do not establish every later reference as the same
              individual.
            </p>
          </div>
        </article>

        <div className="mt-14 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[.18em] text-amber-800 uppercase">
              Sporting network
            </p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">
              Names recurring in the record
            </h2>
          </div>
          <span className="text-sm text-neutral-500">
            {people.size} indexed names
          </span>
        </div>

        {indexedPeople.length > 0 ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {indexedPeople.map(([name, count]) => (
              <article
                key={name}
                className="rounded-2xl border border-amber-950/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <h3 className="font-serif text-2xl">{name}</h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                  <FileText className="h-4 w-4" /> {count} newspaper record
                  {count === 1 ? '' : 's'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-dashed border-amber-900/25 bg-white p-6 text-neutral-600">
            Named-person indexing will appear here as the archive records are
            reviewed.
          </div>
        )}

        <div className="mt-12 flex gap-4 rounded-2xl border border-dashed border-amber-900/25 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <CircleHelp className="mt-0.5 h-6 w-6 shrink-0" />
          <p>
            <strong>No family tree has been invented.</strong> The surviving
            sources do not yet identify Saroop Singh&apos;s parents, spouse,
            siblings, or children. Family members can help build that layer
            through reviewed contributions.
          </p>
        </div>
      </section>
    </main>
  )
}
