import { getFeaturedArticles } from '@/lib/articles'
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
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock, FileText, Images, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Saroop Singh Archive | Malaysian Athletics Pioneer',
  description:
    'Preserving the legacy of Saroop Singh, a pioneering Sikh athlete who made significant contributions to Malaysian athletics in the 1930s and 1940s.',
  openGraph: {
    title: 'Saroop Singh Archive',
    description: 'Preserving the legacy of a Malaysian athletics pioneer',
    type: 'website',
  },
}

export default async function HomePage() {
  const featuredArticles = await getFeaturedArticles(6)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Sophisticated Modern Design */}
      <section className="to-primary-50/20 relative overflow-hidden bg-gradient-to-br from-neutral-50 via-white">
        {/* Subtle background pattern */}
        <div className="from-primary-100/30 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
        <div className="from-accent-100/20 absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] via-transparent to-transparent" />

        <ResponsiveContainer className="relative py-16 sm:py-20 lg:py-28">
          <VStack gap="lg" align="center" className="text-center">
            {/* Animated badge */}
            <div className="bg-primary-100/50 border-primary-200/50 inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm">
              <div className="bg-primary-500 h-2 w-2 animate-pulse rounded-full" />
              <span className="text-primary-700 text-sm font-medium">
                Preserving Historical Legacy
              </span>
            </div>

            <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 bg-clip-text text-transparent">
                Saroop Singh
              </span>
              <span className="from-primary-600 to-primary-500 mt-2 block bg-gradient-to-r bg-clip-text text-3xl text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
                Archive
              </span>
            </h1>

            <p className="max-w-3xl text-lg leading-relaxed text-neutral-600 sm:text-xl md:text-2xl">
              Discover the extraordinary journey of Malaysia&apos;s pioneering
              Sikh athlete through meticulously preserved historical records and
              restored photographs
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="group">
                <Link href="/articles">
                  Explore Archive
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/timeline">View Timeline</Link>
              </Button>
              <Button asChild variant="premium" size="lg">
                <Link href="/restore">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Contribute a Photo
                </Link>
              </Button>
            </div>
          </VStack>
        </ResponsiveContainer>
      </section>

      {/* About Section with Elegant Design */}
      <section className="bg-gradient-to-b from-white to-neutral-50 py-16 sm:py-20 lg:py-24">
        <ContentContainer>
          <VStack gap="xl" className="text-center">
            <div className="mx-auto max-w-4xl space-y-6">
              <h2 className="bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
                About Saroop Singh
              </h2>
              <p className="text-lg leading-relaxed text-neutral-600 sm:text-xl">
                Saroop Singh was a pioneering Sikh athlete who made significant
                contributions to Malaysian athletics in the 1930s and 1940s.
                This digital archive preserves newspaper clippings, photographs,
                and historical records documenting his extraordinary athletic
                achievements and lasting impact on Malaysian sports.
              </p>
            </div>

            {/* Feature Cards - Sophisticated Modern Grid */}
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {/* Historical Articles Card */}
              <div className="group hover:border-primary-200/60 relative rounded-2xl border border-neutral-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                <div className="from-primary-50/50 absolute inset-0 rounded-2xl bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative space-y-4">
                  <div className="from-primary-500 to-primary-600 shadow-primary-500/20 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    Historical Articles
                  </h3>
                  <p className="leading-relaxed text-neutral-600">
                    Browse through digitized newspaper clippings chronicling
                    Saroop Singh&apos;s athletic career and achievements from
                    the 1930s and 1940s.
                  </p>
                  <Link
                    href="/articles"
                    className="text-primary-600 hover:text-primary-700 group/link inline-flex items-center font-semibold transition-colors"
                  >
                    Explore Articles
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="group hover:border-primary-200/60 relative rounded-2xl border border-neutral-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    Timeline
                  </h3>
                  <p className="leading-relaxed text-neutral-600">
                    Follow the chronological journey of Saroop Singh&apos;s
                    athletic career through key milestones and achievements in
                    Malaysian sports history.
                  </p>
                  <Link
                    href="/timeline"
                    className="group/link inline-flex items-center font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                  >
                    View Timeline
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Photo Restoration Card */}
              <div className="group hover:border-accent-200/60 relative rounded-2xl border border-neutral-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                <div className="from-accent-50/50 absolute inset-0 rounded-2xl bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative space-y-4">
                  <div className="from-accent-500 to-accent-600 shadow-accent-500/20 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    Restore & Contribute
                  </h3>
                  <p className="leading-relaxed text-neutral-600">
                    Share a family photo with its story, then create one
                    conservative AI-assisted restoration for careful archive
                    review.
                  </p>
                  <Link
                    href="/restore"
                    className="text-accent-600 hover:text-accent-700 group/link inline-flex items-center font-semibold transition-colors"
                  >
                    Contribute a Photo
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Gallery Card */}
              <div className="group hover:border-primary-200/60 relative rounded-2xl border border-neutral-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/20">
                    <Images className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    Restoration Gallery
                  </h3>
                  <p className="leading-relaxed text-neutral-600">
                    Browse through a collection of AI-restored historical
                    photographs shared by the community. Discover enhanced
                    memories from the past.
                  </p>
                  <Link
                    href="/gallery"
                    className="group/link inline-flex items-center font-semibold text-rose-600 transition-colors hover:text-rose-700"
                  >
                    View Gallery
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </VStack>
        </ContentContainer>
      </section>

      {/* Featured Articles Section - Elegant Design */}
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
                    {Array.from({ length: 6 }, (_, i) => (
                      <div
                        key={i}
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
                <Button asChild size="lg" className="group">
                  <Link href="/articles">
                    View All Articles
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </VStack>
          </ContentContainer>
        </section>
      )}
    </div>
  )
}

export const revalidate = 1800 // Revalidate every 30 minutes
