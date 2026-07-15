import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleHelp, FileText, Users } from "lucide-react";
import { getPeopleIndex } from "@/lib/people";
import { listPublicGalleryRecords } from "@/lib/public-gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "People in the Archive", description: "An evidence-led index of people named in the Saroop Singh Archive." };

export default async function PeoplePage() {
  const [people, gallery] = await Promise.all([
    getPeopleIndex(),
    listPublicGalleryRecords(),
  ]);
  const portrait = gallery.find(record => record.familyMember?.includes("Saroop Singh"));
  const saroop = people.find(person => person.slug === "saroop-singh");
  const recurring = people.filter(person => person.slug !== "saroop-singh" && person.articles.length >= 2);
  return <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]"><section className="bg-[#17241d] text-[#f8f1e4]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-amber-300"><Users className="h-4 w-4" /> Evidence index</p><h1 className="mt-5 max-w-5xl font-serif text-6xl leading-[.92] sm:text-8xl">People named in the archive.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">These pages connect names to the newspaper records that mention them. A shared surname is not treated as a family relationship, and variant OCR spellings remain separate until a human reviews them.</p></div></section>
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">{saroop && portrait && <Link href="/people/saroop-singh" className="group grid overflow-hidden rounded-[2rem] bg-amber-300 shadow-xl transition hover:-translate-y-1 lg:grid-cols-[.8fr_1.2fr]"><div className="relative min-h-72 overflow-hidden bg-amber-200 lg:min-h-[28rem]"><Image src={portrait.originalImageUrl} alt={portrait.title} fill unoptimized sizes="(max-width: 1024px) 100vw, 40vw" className="object-contain grayscale" /></div><div className="flex flex-col justify-center p-7 sm:p-12"><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-950/70">Central archive subject</p><h2 className="mt-4 font-serif text-6xl leading-none sm:text-7xl">Saroop Singh</h2><p className="mt-5 max-w-xl text-lg leading-8 text-amber-950/75">A middle- and long-distance runner documented in results, a 1937 Selangor record, railway sport and cross-country entries. Later community and hockey references remain identity questions.</p><p className="mt-7 flex items-center gap-2 font-semibold">Open the living record <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></p></div></Link>}
      <div className="mt-14 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">Sporting network</p><h2 className="mt-2 font-serif text-4xl sm:text-5xl">Recurring names in the record</h2></div><span className="text-sm text-neutral-500">{people.length} indexed names</span></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recurring.map(person => <Link key={person.slug} href={`/people/${person.slug}`} className="group rounded-2xl border border-amber-950/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-2xl">{person.name}</h3><p className="mt-2 flex items-center gap-2 text-sm text-neutral-500"><FileText className="h-4 w-4" /> {person.articles.length} newspaper records</p></div><ArrowRight className="mt-1 h-5 w-5 text-amber-800 transition group-hover:translate-x-1" /></div></Link>)}</div>
      <div className="mt-12 flex gap-4 rounded-2xl border border-dashed border-amber-900/25 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><CircleHelp className="mt-0.5 h-6 w-6 shrink-0" /><p><strong>No family tree has been invented.</strong> The surviving sources do not yet identify Saroop Singh’s parents, spouse, siblings or children. Family members can help build that layer through reviewed contributions.</p></div>
    </section></main>;
}
