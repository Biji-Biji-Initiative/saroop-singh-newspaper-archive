import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  LockKeyhole,
  Mic,
  ScanFace,
  ShieldCheck,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Family Archive Day',
  description:
    'An invitation to bring one photograph, name one person, and tell one story for the Saroop Singh Archive.',
}

const kit = [
  {
    icon: Camera,
    title: 'A photograph',
    text: 'Front and back, in the best quality available. A phone photograph is welcome when the original cannot travel.',
  },
  {
    icon: ScanFace,
    title: 'A name',
    text: 'Who is pictured, what you call them, and how you know. Uncertainty is useful too.',
  },
  {
    icon: Mic,
    title: 'A story',
    text: 'A short memory in any language: where it happened, who was there, and why it matters.',
  },
]

export default function FamilyDayPage() {
  return (
    <main className="family-day-page min-h-screen bg-[#f6f1e8] text-[#17241d]">
      <section className="bg-[#17241d] text-[#f8f1e4]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold tracking-[.22em] text-amber-300 uppercase">
            An invitation to the family
          </p>
          <h1 className="mt-5 max-w-5xl font-serif text-6xl leading-[.86] sm:text-8xl">
            Bring one photograph.
            <br />
            Name one person.
            <br />
            Tell one story.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300">
            Together we can return names, voices, and context to the Saroop
            Singh family archive—without changing what the historical evidence
            actually says.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="text-xs font-semibold tracking-[.18em] text-amber-800 uppercase">
            Your family-day kit
          </p>
          <h2 className="mt-4 font-serif text-5xl">
            Everything begins with a conversation.
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {kit.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-amber-950/10"
              >
                <Icon className="h-7 w-7 text-amber-800" />
                <h3 className="mt-4 font-serif text-2xl">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {text}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-amber-100 p-5">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5" /> Nothing is published
              automatically
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-950/70">
              Every contribution remains private until identity, context,
              consent, and rights are reviewed by the archive.
            </p>
          </div>
        </div>
        <aside className="flex flex-col justify-center rounded-[2rem] bg-amber-300 p-7 text-center sm:p-10">
          <LockKeyhole className="mx-auto h-9 w-9" />
          <p className="mt-5 text-xs font-semibold tracking-[.2em] text-amber-950/75 uppercase">
            Private contribution room
          </p>
          <h2 className="mt-4 font-serif text-5xl leading-none">
            Memory still lives with you.
          </h2>
          <p className="mt-5 text-sm leading-7 text-amber-950/75">
            Open the private family room on a phone to share photographs with
            their story, or contact the archive with a name or correction.
          </p>
          <Link
            href="/remember"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white transition hover:bg-black"
          >
            Open the family room <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-5 font-mono text-xs text-amber-950/70">
            saroop.mereka.dev/remember
          </p>
        </aside>
      </section>

      <section className="family-card mx-auto mb-16 max-w-4xl border-4 border-[#17241d] bg-amber-300 p-8 text-center sm:p-12">
        <p className="text-xs font-bold tracking-[.25em] uppercase">
          Saroop Singh Archive · Family Day
        </p>
        <h2 className="mt-5 font-serif text-6xl leading-[.88]">
          Memory still lives with you.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg">
          Bring one photograph. Name one person. Tell one story.
        </p>
        <Link
          href="/contribute"
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white"
        >
          Share a family photograph <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  )
}
