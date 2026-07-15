import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileCheck2, ImagePlus, ShieldCheck } from "lucide-react";
import { getLegacyCollections } from "@/lib/legacy-gallery";
import { getPublicGalleryRecord } from "@/lib/public-gallery-record";
import { CompareStudio } from "./compare-studio";
import { PublicIdentityImage } from "./public-identity-image";

export const dynamic = "force-dynamic";

export function generateStaticParams() { return getLegacyCollections().map(collection => ({ id: collection.id })); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params; const collection = await getPublicGalleryRecord(id);
  if (!collection) return { title: "Photograph not found", robots: { index: false, follow: false } };
  return { title: collection.title, description: collection.description, alternates: { canonical: `/gallery/${id}` }, openGraph: { images: [collection.originalImageUrl] } };
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const collection = await getPublicGalleryRecord(id); if (!collection) notFound();
  const title = collection.title;
  const original = collection.original;
  return <main className="min-h-screen bg-[#17241d] text-[#f8f1e4]">
    <header className="border-b border-white/10"><div className="mx-auto max-w-7xl px-5 py-5 sm:px-8"><Link href="/gallery" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-stone-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to photographs</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8 sm:pb-16 sm:pt-12"><div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-amber-300"><ShieldCheck className="h-4 w-4" /> Source-first collection record</p><h1 className="mt-5 font-serif text-5xl font-semibold leading-[.95] sm:text-7xl">{title}</h1><p className="mt-5 text-lg text-stone-300">{collection.date || "Date unknown"}{collection.familyMember ? ` · ${collection.familyMember}` : ""}</p>{collection.familyMember === "Saroop Singh" && <Link href="/people/saroop-singh" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-amber-300 underline decoration-amber-300/40 underline-offset-4">Explore Saroop Singh’s evidence profile</Link>}<p className="mt-6 max-w-xl leading-7 text-stone-400">{collection.description}</p></div><PublicIdentityImage src={collection.originalImageUrl} alt={`${title}, best available source file`} identityTags={collection.identityTags} /></div></section>
    <section className="border-y border-white/10 bg-black/15"><div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"><div className="mb-7 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Restoration laboratory</p><h2 className="mt-3 font-serif text-4xl sm:text-6xl">Compare without confusing source and study.</h2><p className="mt-4 leading-7 text-stone-400">The preserved source is always shown first. {collection.isLegacy ? "The recovered legacy outputs are speculative reconstructions with unknown prompts and unreliable likeness." : "One human-approved restoration derivative may be activated for comparison."} No derivative replaces the source.</p></div><CompareStudio originalUrl={collection.originalImageUrl} title={title} studies={collection.studies} isLegacy={collection.isLegacy} /></div></section>
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[2rem] bg-[#f6f1e8] p-6 text-[#17241d] sm:p-9"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-emerald-800"><FileCheck2 className="h-4 w-4" /> Preservation record</p><h2 className="mt-4 font-serif text-4xl">The source file is the authority.</h2><p className="mt-4 text-sm leading-6 text-neutral-600">Best available source file. This digital file may be a scan, screenshot, or crop; its relationship to a physical original is recorded where known.</p><dl className="mt-7 grid gap-5 text-sm sm:grid-cols-2"><div className="min-w-0"><dt className="text-neutral-500">Source file</dt><dd className="mt-1 break-words font-semibold">{original.filename}</dd></div><div><dt className="text-neutral-500">File size</dt><dd className="mt-1 font-semibold">{(original.bytes / 1024).toFixed(0)} KB · {original.mimeType}</dd></div>{original.sha256 && <div className="sm:col-span-2"><dt className="text-neutral-500">SHA-256 fixity</dt><dd className="mt-1 break-all font-mono text-xs">{original.sha256}</dd></div>}<div><dt className="text-neutral-500">Date confidence</dt><dd className="mt-1 font-semibold">{collection.dateConfidence}</dd></div><div><dt className="text-neutral-500">Public comparison outputs</dt><dd className="mt-1 font-semibold">{collection.studies.length}</dd></div><div className="sm:col-span-2"><dt className="text-neutral-500">Rights and reuse</dt><dd className="mt-1 font-semibold">{collection.rights}</dd></div></dl><a href={collection.originalImageUrl} download className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white"><Download className="h-5 w-5" /> Download source file</a></div>
      <aside className="rounded-[2rem] border border-amber-300/20 bg-amber-300 p-6 text-[#17241d] sm:p-9"><ImagePlus className="h-8 w-8" /><h2 className="mt-6 font-serif text-4xl leading-none">Who is here? What happened that day?</h2><p className="mt-5 leading-7 text-amber-950/75">Family knowledge is part of the archive. Add names, corrections, another print, or the story remembered at home.</p><Link href={`/remember?subject=${collection.id}&kind=identify`} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#17241d] px-6 font-semibold text-white">Identify someone</Link>{collection.hasIiifManifest && <a href={`/api/iiif/${collection.id}/manifest`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">IIIF museum manifest</a>}</aside>
    </section>
  </main>;
}
