import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, CircleHelp, FileText, ShieldCheck } from "lucide-react";
import { lifeChapters } from "@/data/knowledge/chapters";
import { getAllArticles } from "@/lib/articles";

export const metadata: Metadata = { title: "Timeline", description: "An evidence-led chronology of Saroop Singh and the records preserved in this archive." };

function displayDate(date?: string, recordedDateText?: string) {
  if (!date) return recordedDateText || "Date unknown";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? recordedDateText || "Date unknown" : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function TimelinePage() {
  const articles = await getAllArticles();
  const dated = articles.filter(article => article.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const unknown = articles.filter(article => !article.date);
  const underReview = articles.filter(article => article.slug.includes("olympic-games"));
  const unresolved = Array.from(
    new Map([...underReview, ...unknown].map(article => [article.slug, article])).values(),
  );
  const years = new Set(dated.map(article => article.date?.slice(0, 4)));

  return <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]">
    <header className="relative overflow-hidden bg-[#17241d] text-[#f8f1e4]">
      <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_80%_20%,#f6c453,transparent_35%)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-amber-300"><ShieldCheck className="h-4 w-4" /> Evidence-led chronology</p>
        <h1 className="mt-5 max-w-4xl font-serif text-6xl font-semibold leading-[.86] sm:text-8xl">A life, assembled from surviving traces.</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300">This is not a polished legend. It is a readable path through {dated.length} dated newspaper records, with uncertainty left visible wherever the evidence stops.</p>
        <div className="mt-9 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-white/10 px-4 py-2">{years.size} documented years</span><span className="rounded-full bg-white/10 px-4 py-2">{articles.length} total records</span><span className="rounded-full bg-white/10 px-4 py-2">{unresolved.length} unresolved records</span></div>
        <Link href="/people/saroop-singh" className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-300 px-6 font-semibold text-[#17241d]">Meet Saroop through the evidence <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">The archival arc</p><h2 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">Six chapters. No invented connective tissue.</h2></div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">{lifeChapters.map((chapter, index) => {
        const article = articles.find(item => item.slug === chapter.featuredSlug);
        return <article key={chapter.id} className="overflow-hidden rounded-[2rem] border border-amber-950/10 bg-white shadow-sm">
          <div className="grid h-full sm:grid-cols-[.72fr_1.28fr]">
            <div className="relative min-h-52 bg-stone-200">{article?.image && <Image src={article.image} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 30vw" className="object-cover" />}<span className="absolute left-4 top-4 rounded-full bg-[#17241d] px-3 py-1 text-xs font-bold text-white">{String(index + 1).padStart(2, "0")}</span></div>
            <div className="p-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-800">{chapter.years} · {chapter.eyebrow}</p><h3 className="mt-3 font-serif text-3xl leading-none">{chapter.title}</h3><p className="mt-4 text-sm leading-6 text-neutral-600">{chapter.summary}</p><p className="mt-4 text-xs font-semibold text-neutral-500">{chapter.evidence}</p>{article && <Link href={`/articles/${article.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-900">Open source <ArrowRight className="h-4 w-4" /></Link>}</div>
          </div>
        </article>;
      })}</div>
    </section>

    <section className="bg-white"><div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">Record by record</p><h2 className="mt-3 font-serif text-5xl sm:text-6xl">The documented chronology</h2>
      <div className="relative mt-10 before:absolute before:bottom-0 before:left-[1.15rem] before:top-0 before:w-px before:bg-amber-900/20 sm:before:left-[5.45rem]">{dated.filter(article => !underReview.includes(article)).map(article => <article key={article.slug} className="relative grid grid-cols-[2.4rem_1fr] gap-4 pb-8 sm:grid-cols-[9rem_1fr] sm:gap-6">
        <div className="relative z-10 flex items-start sm:justify-end"><span className="mt-1 h-3 w-3 rounded-full border-[3px] border-white bg-amber-700 ring-1 ring-amber-900/20 sm:order-2 sm:ml-4" /><time className="hidden pt-0.5 text-right text-xs font-semibold text-neutral-500 sm:block">{displayDate(article.date, article.date_text)}</time></div>
        <Link href={`/articles/${article.slug}`} className="group rounded-2xl border border-amber-950/10 bg-[#f6f1e8] p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><time className="text-xs font-semibold uppercase tracking-[.12em] text-amber-800 sm:hidden">{displayDate(article.date, article.date_text)}</time><h3 className="mt-1 font-serif text-2xl leading-tight sm:mt-0">{article.title}</h3><p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500"><span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{article.publication || article.source || "Publication unknown"}</span>{article.location && <span>{article.location}</span>}</p></Link>
      </article>)}</div>
    </div></section>

    <section className="bg-amber-200/55"><div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="flex items-start gap-4"><CircleHelp className="mt-1 h-7 w-7 shrink-0 text-amber-900" /><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-900">Research desk</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Uncertainty belongs in the archive.</h2><p className="mt-5 max-w-3xl leading-7 text-amber-950/75">A clipping filed with 1938 Olympic discussion appears to date from around July 1937. Later hockey reports may name the same Saroop Singh, but that identity is not yet proved. Records without reliable dates remain visible below. A duplicated page once miscatalogued as 1957 has been withdrawn rather than repeated as evidence.</p></div></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">{unresolved.map(article => <Link key={article.slug} href={`/articles/${article.slug}`} className="rounded-2xl border border-amber-900/15 bg-white/65 p-5"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.13em] text-amber-900"><CalendarDays className="h-4 w-4" /> Under review · {displayDate(article.date, article.date_text)}</p><h3 className="mt-2 font-serif text-2xl leading-tight">{article.title}</h3></Link>)}</div>
      <Link href="/remember?kind=correction" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#17241d] px-6 font-semibold text-white">Share corroborating evidence</Link>
    </div></section>
  </main>;
}
