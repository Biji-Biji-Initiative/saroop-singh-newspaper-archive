import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleHelp, FileText, Heart, ShieldCheck } from "lucide-react";
import { lifeChapters } from "@/data/knowledge/chapters";
import { getAllArticles } from "@/lib/articles";
import { listPublicGalleryRecords } from "@/lib/public-gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "About Saroop Singh", description: "What the surviving evidence establishes—and what remains unknown—about Saroop Singh." };

export default async function AboutPage() {
  const [articles, gallery] = await Promise.all([
    getAllArticles(),
    listPublicGalleryRecords(),
  ]);
  const portrait = gallery.find(record => record.familyMember?.includes("Saroop Singh"));
  return <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]">
    <section className="bg-[#17241d] text-[#f8f1e4]"><div className="mx-auto grid max-w-7xl items-end gap-9 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_.95fr]"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-amber-300"><ShieldCheck className="h-4 w-4" /> Evidence-led biography</p><h1 className="mt-5 font-serif text-6xl leading-[.88] sm:text-8xl">What the record tells us.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300">Saroop Singh appears across a remarkable body of newspaper evidence from pre-war Malaya. This biography says only what the reviewed collection can support—and leaves the missing human story open to his family.</p><div className="mt-8 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-white/10 px-4 py-2">{articles.length} catalogued records</span><span className="rounded-full bg-white/10 px-4 py-2">Earliest dated record: 1936</span><span className="rounded-full bg-white/10 px-4 py-2">Later identity questions preserved</span></div></div>{portrait && <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 bg-black"><Image src={portrait.originalImageUrl} alt={portrait.title} fill priority unoptimized sizes="(max-width:1024px) 100vw,45vw" className="object-contain" /></div>}</div></section>
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20"><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">Documented chapters</p><h2 className="mt-3 font-serif text-5xl sm:text-6xl">A sporting life in fragments</h2><div className="mt-9 grid gap-5 md:grid-cols-2">{lifeChapters.map(chapter => <article key={chapter.id} className="rounded-[2rem] border border-amber-950/10 bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.15em] text-amber-800">{chapter.years} · {chapter.eyebrow}</p><h3 className="mt-3 font-serif text-3xl leading-none">{chapter.title}</h3><p className="mt-4 leading-7 text-neutral-600">{chapter.summary}</p><p className="mt-5 flex items-center gap-2 text-xs font-semibold text-neutral-500"><FileText className="h-4 w-4" />{chapter.evidence}</p></article>)}</div></section>
    <section className="bg-amber-200/60"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2"><div><CircleHelp className="h-8 w-8 text-amber-900" /><h2 className="mt-5 font-serif text-5xl">What remains unknown</h2><p className="mt-5 leading-8 text-amber-950/75">The reviewed records do not yet establish Saroop’s parents, siblings, spouse, children, later occupation, retirement from competition, mentorship, or the duration of any record. Later hockey reports may describe the same man, but the identity has not been proved.</p></div><div className="rounded-[2rem] bg-white/70 p-6 sm:p-8"><Heart className="h-7 w-7 text-amber-900" /><h3 className="mt-5 font-serif text-3xl">The family holds the next chapter.</h3><p className="mt-4 leading-7 text-neutral-600">Names, relationships, remembered places and voices can deepen this record—but family testimony will always be labelled and reviewed rather than treated as automatic fact.</p><Link href="/remember" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white">Enter the Memory Room <ArrowRight className="h-4 w-4" /></Link></div></div></section>
  </main>;
}
