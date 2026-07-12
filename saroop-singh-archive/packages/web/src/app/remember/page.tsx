import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Heart, LockKeyhole, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Family Memory Room',
  description:
    'Privately add photographs, stories, and corrections to the Saroop Singh Archive.',
}

export default function RememberPage() {
  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]">
      <section className="bg-[#17241d] text-[#f8f1e4]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[.22em] text-amber-300 uppercase">
            <Heart className="h-4 w-4" /> Family Memory Room
          </p>
          <h1 className="mt-5 max-w-5xl font-serif text-6xl leading-[.88] sm:text-8xl">
            Return a name.
            <br />
            Preserve a voice.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300">
            Choose one small thing you know. A photograph, a name, a correction,
            or a story can make the record more useful for the family that
            follows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-stone-300">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <LockKeyhole className="h-4 w-4" /> Private by default
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <ShieldCheck className="h-4 w-4" /> Claims, not automatic facts
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <article className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-amber-950/10 sm:p-10">
          <p className="text-xs font-semibold tracking-[.2em] text-amber-800 uppercase">
            Photograph + story
          </p>
          <h2 className="mt-4 font-serif text-4xl">
            Share it privately with the archive.
          </h2>
          <p className="mt-5 leading-7 text-neutral-600">
            The private intake accepts family photographs with a title, date,
            people, story, and tags. Your contact details and original files
            stay in the protected review area; nothing appears in the public
            gallery until a curator explicitly publishes it.
          </p>
          <Link
            href="/contribute"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white transition hover:bg-[#2b3b30]"
          >
            Open private photo intake <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
        <article className="rounded-[2rem] border border-amber-950/10 bg-amber-100/50 p-8 sm:p-10">
          <p className="text-xs font-semibold tracking-[.2em] text-amber-800 uppercase">
            Name, correction, or account
          </p>
          <h2 className="mt-4 font-serif text-4xl">
            Help us improve the record.
          </h2>
          <p className="mt-5 leading-7 text-neutral-700">
            If there is no photograph to upload, send a correction, a name, or a
            short family account to the archive. It will be treated as a private
            contribution and reviewed before it is associated with any public
            record.
          </p>
          <a
            href="mailto:gurpreet@mereka.io?subject=Saroop%20Singh%20Archive%20memory%20or%20correction"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full border border-amber-950/20 px-6 font-semibold transition hover:bg-white"
          >
            Contact the archive <ArrowRight className="h-4 w-4" />
          </a>
        </article>
      </section>
    </main>
  )
}
