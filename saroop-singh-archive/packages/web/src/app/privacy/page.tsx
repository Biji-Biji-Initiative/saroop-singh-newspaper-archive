import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy and Contributions',
  description:
    'How the archive handles family contributions, review, publication, and private source material.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]">
      <section className="bg-[#17241d] text-[#f8f1e4]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[.22em] text-amber-300 uppercase">
            <LockKeyhole className="h-4 w-4" /> Privacy and contributions
          </p>
          <h1 className="mt-5 max-w-5xl font-serif text-5xl leading-[.95] sm:text-7xl">
            Family contributions are private first.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-stone-300">
            The archive is built to collect history without turning a family
            upload into a public post by accident.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            [
              'Private intake',
              'Your original file, contributor details, contact information, and notes are stored for curator review rather than placed in public search or the gallery.',
            ],
            [
              'Human publication decision',
              'A curator must explicitly publish an approved public version. Pending contributions and contributor contact details never appear on public archive pages.',
            ],
            [
              'Separate AI studies',
              'A private restoration study is not a public upload and does not replace the original source. The source remains separately protected.',
            ],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-amber-950/10 bg-white p-7 shadow-sm"
            >
              <ShieldCheck className="h-7 w-7 text-amber-700" />
              <h2 className="mt-5 font-serif text-2xl">{title}</h2>
              <p className="mt-3 leading-7 text-neutral-600">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-[2rem] border border-amber-950/10 bg-white p-7 sm:p-10">
          <h2 className="font-serif text-4xl">Retention and access</h2>
          <div className="mt-5 space-y-5 leading-7 text-neutral-700">
            <p>
              Private family contributions are retained for review for up to 90
              days by default. A curator can then publish an approved public
              version, keep a contribution private where appropriate, or remove
              it.
            </p>
            <p>
              Archive reviewers have access to the private review area. Public
              visitors can see only material deliberately approved for public
              display.
            </p>
          </div>
          <Link
            href="/contribute"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white transition hover:bg-[#2b3b30]"
          >
            Contribute privately <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
