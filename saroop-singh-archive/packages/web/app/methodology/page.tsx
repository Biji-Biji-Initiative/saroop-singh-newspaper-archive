import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Hammer, Palette, ScanSearch, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Archive Method',
  description: 'How the Saroop Singh Archive handles transcription, attribution, restoration, uncertainty, and citation.',
};

const principles = [
  {
    icon: ScanSearch,
    title: 'The source capture remains visible',
    body: 'Transcriptions make clippings searchable, but readers must be able to inspect the best available scan, screenshot, or crop and understand what kind of source it is.',
  },
  {
    icon: ShieldCheck,
    title: 'AI outputs never become evidence',
    body: 'New studies require optional consent and human review. The archive does not publish an output that could alter likeness or scenery without a curator’s recorded comparison review.',
  },
  {
    icon: CheckCircle2,
    title: 'Uncertainty stays visible',
    body: 'Unknown dates, uncertain publications, incomplete scans, variant spellings, and duplicate reports are retained rather than silently invented away.',
  },
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#f6f1e8] text-neutral-900">
      <section className="border-b border-amber-900/10 bg-[#1f2a24] text-[#f7f0df]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Archive standard</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] sm:text-7xl">Evidence first. Enhancement second.</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-stone-300 sm:text-xl">
            This archive separates what the historical record shows from what later transcription or restoration helps us see.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {principles.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-amber-900/10 bg-white p-7 shadow-sm">
              <Icon className="h-7 w-7 text-amber-700" aria-hidden="true" />
              <h2 className="mt-5 font-serif text-2xl">{title}</h2>
              <p className="mt-3 leading-7 text-neutral-600">{body}</p>
            </article>
          ))}
        </div>

        <section className="mt-16 rounded-[2rem] border border-amber-900/15 bg-white p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-800">Where are the originals?</p><h2 className="mt-4 font-serif text-5xl text-[#17241d]">The physical masters are not in this repository.</h2><div className="mt-5 grid gap-6 text-base leading-7 text-neutral-700 lg:grid-cols-2"><p>The recovered collection contains best-available JPG and PNG files. Some are family-photo scans; the two Saroop athletics images are newspaper crops, and one is a screenshot. No TIFF, DNG, HEIC, RAW master, physical-print inventory, reverse scan, or custody record was recovered.</p><p>“Source” therefore means the best digital file currently available—not proof that it is the camera negative or first-generation scan. The next preservation priority is to locate the family’s physical prints, scan fronts and backs at archival quality, and record who holds each object.</p></div><Link href="/contribute" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#17241d] px-6 font-semibold text-white">Contribute a higher-quality source or reverse scan</Link></section>

        <section className="mt-8 rounded-[2rem] bg-[#17241d] p-6 text-[#f8f1e4] sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Three optional restoration intents</p><h2 className="mt-4 font-serif text-5xl">Choose the historical intent—not the model brand.</h2><p className="mt-5 max-w-3xl leading-7 text-stone-300">Preserve-only is the default. A family contributor may optionally allow a private AI study and choose one of three intentions. The archive reviewer chooses the engine, inspects geometry and content against the source, and records the dated model and versioned prompt.</p><div className="mt-8 grid gap-4 md:grid-cols-3">{[{ icon: ShieldCheck, title: "Clean & preserve", text: "Dust, scratches, fading and restrained tonal recovery. No reconstruction or colour." }, { icon: Hammer, title: "Repair damage", text: "Tears and missing paper may be reconstructed only where surrounding evidence supports a neutral continuation." }, { icon: Palette, title: "Explore colour", text: "A visibly labelled interpretation. It is never described as recovered historical colour." }].map(item => { const Icon = item.icon; return <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="h-6 w-6 text-amber-300" /><h3 className="mt-4 font-serif text-2xl">{item.title}</h3><p className="mt-3 text-sm leading-6 text-stone-400">{item.text}</p></article>; })}</div><p className="mt-6 rounded-2xl bg-white/5 p-4 text-sm leading-6 text-stone-300">Prompts are versioned. Model changes never rewrite older provenance. A derivative with material aspect-ratio drift is rejected before storage, and the source remains independently downloadable.</p></section>

        <div className="mt-16 grid gap-12 border-t border-amber-900/15 pt-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <BookOpen className="h-8 w-8 text-amber-700" aria-hidden="true" />
            <h2 className="mt-5 font-serif text-3xl">How to cite the collection</h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-neutral-700">
            <p>Use the article title, original publication when known, original date when known, and “Saroop Singh Archive,” followed by the article URL and your access date.</p>
            <div className="rounded-xl border border-amber-900/10 bg-white p-5 font-mono text-sm leading-6 text-neutral-600">
              “Article title.” <em>Original publication</em>, date. Saroop Singh Archive. URL. Accessed day month year.
            </div>
            <p>Corrections and additional primary material are welcome. The goal is a stronger record, not a frozen website.</p>
            <Link href="/articles" className="inline-flex items-center font-semibold text-amber-800 hover:text-amber-950">
              Explore the primary sources <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
