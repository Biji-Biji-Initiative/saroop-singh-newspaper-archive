import { getArticleBySlug, getAllArticles, getWithdrawnCanonicalSlug } from '@/lib/articles';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { personSlug } from '@/lib/people';
import { EvidenceLens } from './evidence-lens';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const article = await getArticleBySlug(slug); if (!article) return { title: 'Article Not Found', robots: { index: false, follow: false } }; return { title: article.title, description: article.content.slice(0, 160), alternates: { canonical: `/articles/${slug}` }, openGraph: { title: article.title, description: article.content.slice(0, 160), images: article.image ? [{ url: article.image }] : [] } }; }
export async function generateStaticParams() { return (await getAllArticles()).map(article => ({ slug: article.slug })); }

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const canonicalSlug = getWithdrawnCanonicalSlug(slug);
  if (canonicalSlug) permanentRedirect(`/articles/${canonicalSlug}`);
  const article = await getArticleBySlug(slug); if (!article) notFound();
  const problematic = slug.includes('olympic-games');
  return <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]"><header className="bg-[#17241d] text-[#f8f1e4]"><div className="mx-auto max-w-6xl px-5 py-5 sm:px-8"><Link href="/articles" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-stone-300"><ArrowLeft className="h-4 w-4" /> Newspaper catalogue</Link></div><div className="mx-auto max-w-6xl px-5 pb-12 pt-5 sm:px-8 sm:pb-16"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-amber-300"><ShieldCheck className="h-4 w-4" /> Reviewed catalogue source record</p><h1 className="mt-5 max-w-5xl font-serif text-5xl leading-[.95] sm:text-7xl">{article.title}</h1><div className="mt-7 flex flex-wrap gap-3 text-sm text-stone-300">{(article.date || article.date_text) && <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"><CalendarDays className="h-4 w-4" />{article.date_text || article.date}</span>}<span className="rounded-full bg-white/10 px-4 py-2">{article.publication || article.source || 'Publication unknown'}</span>{article.location && <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"><MapPin className="h-4 w-4" />{article.location}</span>}</div>{problematic && <p className="mt-7 max-w-3xl rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100"><strong>Research caution:</strong> this item has a date or identity problem and is excluded from the confirmed life chronology until corroborated.</p>}</div></header>
    <article className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">{article.image ? <EvidenceLens image={article.image} title={article.title} content={article.content} /> : <p className="rounded-2xl bg-white p-6">No scan is currently available.</p>}
      {article.people?.length ? <section className="mt-8 rounded-[2rem] border border-amber-950/10 bg-white p-6 sm:p-8"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-amber-800"><UserRound className="h-4 w-4" /> Names printed or catalogued with this record</p><div className="mt-5 flex flex-wrap gap-2">{article.people.map(person => <Link key={person} href={`/people/${personSlug(person)}`} className="inline-flex min-h-11 items-center rounded-full bg-stone-100 px-4 text-sm font-semibold hover:bg-amber-100">{person}</Link>)}</div><p className="mt-4 text-xs leading-5 text-neutral-500">Matching names are indexed exactly. A name match alone does not prove identity across different records.</p></section> : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href={`/remember?subject=${article.slug}&kind=correction`} className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-amber-300 px-5 font-semibold">Correct or add context</Link><Link href="/methodology" className="flex min-h-12 flex-1 items-center justify-center rounded-full border border-amber-950/15 px-5 font-semibold">How evidence is handled</Link></div>
    </article></main>;
}
export const revalidate = 3600;
