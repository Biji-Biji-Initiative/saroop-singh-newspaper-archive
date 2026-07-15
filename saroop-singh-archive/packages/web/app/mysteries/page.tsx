import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleHelp, ShieldCheck } from "lucide-react";
import { listPublicGalleryRecords } from "@/lib/public-gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cabinet of Questions", description: "Unidentified people, uncertain dates and unresolved records the family may be able to help clarify." };

export default async function MysteriesPage() {
  const records = await listPublicGalleryRecords();
  const mysteries = records.filter(record => !record.familyMember?.includes("Saroop Singh"));
  return <main className="min-h-screen bg-[#101713] text-[#f8f1e4]"><header className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-amber-300"><CircleHelp className="h-4 w-4" /> Cabinet of Questions</p><h1 className="mt-5 max-w-5xl font-serif text-6xl leading-[.88] sm:text-8xl">Not everything unknown is lost.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300">A face, handwriting or remembered room may be recognisable to someone in the family. Suggestions remain private until reviewed and corroborated.</p></header><section className="mx-auto grid max-w-7xl gap-6 px-5 pb-20 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">{mysteries.map(record => <article key={record.id} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5"><div className="relative aspect-[4/3] bg-black"><Image src={record.originalImageUrl} alt={record.title} fill unoptimized sizes="(max-width:640px) 100vw,33vw" className="object-contain" /></div><div className="p-6"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-amber-300"><ShieldCheck className="h-4 w-4" /> Best available source</p><h2 className="mt-3 font-serif text-3xl leading-none">{record.title}</h2><p className="mt-4 text-sm leading-6 text-stone-400">{record.description}</p><Link href={`/remember?subject=${record.id}&kind=identify`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-amber-300 px-5 font-semibold text-[#17241d]">I recognise someone <ArrowRight className="h-4 w-4" /></Link></div></article>)}</section></main>;
}
