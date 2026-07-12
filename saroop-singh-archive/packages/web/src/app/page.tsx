import { getFeaturedArticles } from '@/lib/articles'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ResponsiveContainer,
  ContentContainer,
} from '@/components/layout/responsivecontainer'
import { GridLayout } from '@/components/layout/gridlayout'
import { VStack } from '@/components/layout/flexlayout'
import { MobileArticleCard } from '@/components/mobile/mobilearticlecard'
import { Suspense } from 'react'
import {
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  Heart,
  Images,
  ShieldCheck,
} from 'lucide-react'

export const metadata: Metadata = {
  title: { absolute: 'Saroop Singh Archive | Runner in Pre-war Malaya' },
  description:
    'A family-led archive of Saroop Singh, a Sikh middle-distance runner documented in athletics in pre-war Malaya.',
  openGraph: {
    title: 'Saroop Singh Archive',
    description:
      'A family-led archive of a runner documented in pre-war Malaya',
    type: 'website',
    url: '/',
  },
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const featuredArticles = await getFeaturedArticles(6)

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-[#17241d] text-[#f8f1e4]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(217,165,76,.18),transparent_34%)]" />
        <ResponsiveContainer className="relative py-8 sm:py-12 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
            <div className="order-2 lg:order-1">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[.22em] text-amber-300 uppercase">
                <ShieldCheck className="h-4 w-4" /> Family-led digital archive
              </p>
              <h1 className="mt-5 font-serif text-6xl leading-[.88] font-semibold tracking-[-.03em] sm:text-8xl lg:text-[7.6rem]">
                Saroop
                <br />
                Singh
              </h1>
              <p className="mt-6 max-w-xl font-serif text-2xl leading-snug text-amber-100/90 italic sm:text-3xl">
                A runner in the record. A family memory. A Malayan story
                returned to view.
              </p>
              <p className="mt-6 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">
                Explore the reviewed newspaper catalogue and best-available
                photographic sources—keeping source files visibly distinct from
                AI studies.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/story"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber-300 px-6 font-semibold text-[#17241d] transition hover:bg-amber-200"
                >
                  Begin his story <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/articles"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 font-semibold text-white hover:bg-white/10"
                >
                  Explore archive
                </Link>
                <Link
                  href="/gallery"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 font-semibold text-white hover:bg-white/10"
                >
                  <Images className="h-5 w-5" /> Photographs
                </Link>
                <Link
                  href="/remember"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 font-semibold text-white hover:bg-white/10"
                >
                  <Heart className="h-5 w-5" /> Add a memory
                </Link>
              </div>
            </div>
            <figure className="order-1 lg:order-2">
              <div className="relative mx-auto aspect-[4/5] max-h-[72vh] overflow-hidden rounded-[2rem] border border-white/15 bg-black shadow-2xl shadow-black/30 sm:rounded-[2.5rem]">
                <Image
                  src="/gallery/saroop-singh-running2.png"
                  alt="Newspaper portrait identifying Saroop Singh as the half-mile winner"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 92vw, 45vw"
                  className="object-contain object-center contrast-110 grayscale"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-5 pt-20 sm:p-7 sm:pt-24">
                  <p className="text-xs font-semibold tracking-[.18em] text-amber-300 uppercase">
                    Newspaper source crop
                  </p>
                  <figcaption className="mt-2 font-serif text-xl text-white sm:text-2xl">
                    Saroop Singh, half-mile winner · published 19 July 1937
                  </figcaption>
                </div>
              </div>
            </figure>
          </div>
        </ResponsiveContainer>
      </section>

      <section className="bg-gradient-to-b from-white to-neutral-50 py-16 sm:py-20 lg:py-24">
        <ContentContainer>
          <VStack gap="xl" className="text-center">
            <div className="mx-auto max-w-4xl space-y-6">
              <h2 className="bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
                About Saroop Singh
              </h2>
              <p className="text-lg leading-relaxed text-neutral-600 sm:text-xl">
                Surviving newspaper reports document Saroop Singh as a Sikh
                middle- and long-distance runner in 1930s and 1940s Malaya. This
                family-led archive preserves catalogue entries and
                best-available image sources while marking duplicates,
                transcription uncertainty, and later identity questions openly.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              <ArchiveCard
                href="/articles"
                icon={<FileText className="h-7 w-7 text-white" />}
                iconClassName="bg-[#17241d] shadow-black/10"
                title="Historical Articles"
                body="Browse digitised newspaper clippings that document Saroop Singh’s reported races, results, and sporting activity from the 1930s and 1940s."
                action="Explore Articles"
                actionClassName="text-amber-900 hover:text-amber-950"
              />
              <ArchiveCard
                href="/timeline"
                icon={<Clock className="h-7 w-7 text-white" />}
                iconClassName="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20"
                title="Timeline"
                body="Follow the chronological journey of Saroop Singh’s athletic career through key reported results and appearances in the surviving Malayan newspaper record."
                action="View Timeline"
                actionClassName="text-emerald-600 hover:text-emerald-700"
              />
              <ArchiveCard
                href="/methodology"
                icon={<BookOpen className="h-7 w-7 text-white" />}
                iconClassName="bg-gradient-to-br from-accent-500 to-accent-600 shadow-accent-500/20"
                title="Archive Method"
                body="Understand how scans are transcribed, dated, attributed, restored, and distinguished from physical source objects."
                action="Read the Method"
                actionClassName="text-accent-600 hover:text-accent-700"
              />
              <ArchiveCard
                href="/gallery"
                icon={<Images className="h-7 w-7 text-white" />}
                iconClassName="bg-gradient-to-br from-amber-700 to-amber-900 shadow-amber-900/10"
                title="Restoration Gallery"
                body="Compare best-available family scans and newspaper crops with labelled restoration studies without confusing interpretation for evidence."
                action="View Gallery"
                actionClassName="text-amber-900 hover:text-amber-950"
              />
            </div>
          </VStack>
        </ContentContainer>
      </section>

      {featuredArticles.length > 0 && (
        <section className="bg-gradient-to-b from-neutral-50 to-white py-16 sm:py-20 lg:py-24">
          <ContentContainer>
            <VStack gap="xl">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="mb-6 bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
                  Featured Articles
                </h2>
                <p className="text-lg text-neutral-600">
                  Discover key moments in Saroop Singh&apos;s athletic journey
                  through these carefully selected historical articles.
                </p>
              </div>
              <Suspense
                fallback={
                  <GridLayout
                    cols={{ default: 1, sm: 2, lg: 3 }}
                    className="animate-pulse"
                  >
                    {Array.from({ length: 6 }, (_, index) => (
                      <div
                        key={index}
                        className="h-64 rounded-xl border border-gray-200 bg-white"
                      />
                    ))}
                  </GridLayout>
                }
              >
                <GridLayout cols={{ default: 1, sm: 2, lg: 3 }} gap="lg">
                  {featuredArticles.map(article => (
                    <MobileArticleCard
                      key={article.slug}
                      article={article}
                      variant="default"
                      showImage={true}
                    />
                  ))}
                </GridLayout>
              </Suspense>
              <div className="pt-8 text-center">
                <Link
                  href="/articles"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white transition hover:bg-[#2b3b30]"
                >
                  View All Articles <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </VStack>
          </ContentContainer>
        </section>
      )}
    </main>
  )
}

function ArchiveCard({
  href,
  icon,
  iconClassName,
  title,
  body,
  action,
  actionClassName,
}: {
  href: string
  icon: React.ReactNode
  iconClassName: string
  title: string
  body: string
  action: string
  actionClassName: string
}) {
  return (
    <article className="group relative rounded-2xl border border-neutral-200/60 bg-white p-8 text-left shadow-sm transition-all duration-300 hover:border-amber-300/60 hover:shadow-xl">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-50/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative space-y-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${iconClassName}`}
        >
          {icon}
        </div>
        <h3 className="text-xl font-bold text-neutral-900">{title}</h3>
        <p className="leading-relaxed text-neutral-600">{body}</p>
        <Link
          href={href}
          className={`group/link inline-flex items-center font-semibold transition-colors ${actionClassName}`}
        >
          {action}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </article>
  )
}

export const revalidate = 1800
