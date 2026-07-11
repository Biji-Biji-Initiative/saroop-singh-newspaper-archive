import { getFeaturedArticles } from '@/lib/articles';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ResponsiveContainer, ContentContainer } from '@/components/layout/responsivecontainer';
import { GridLayout } from '@/components/layout/gridlayout';
import { VStack } from '@/components/layout/flexlayout';
import { MobileArticleCard } from '@/components/mobile/mobilearticlecard';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Clock, FileText, ImagePlus, Images, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Saroop Singh Archive | Runner in Pre-war Malaya' },
  description: 'A family-led archive of Saroop Singh, a Sikh middle-distance runner documented in athletics in pre-war Malaya.',
  openGraph: {
    title: 'Saroop Singh Archive',
    description: 'A family-led archive of a runner documented in pre-war Malaya',
    type: 'website',
    url: '/',
  },
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const featuredArticles = await getFeaturedArticles(6);
  
  return (
    <main className="bg-white min-h-screen">
      <section className="relative overflow-hidden bg-[#17241d] text-[#f8f1e4]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(217,165,76,.18),transparent_34%)]" />
        <ResponsiveContainer className="relative py-8 sm:py-12 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
            <div className="order-2 lg:order-1">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-amber-300"><ShieldCheck className="h-4 w-4" /> Family-led digital archive</p>
              <h1 className="mt-5 font-serif text-6xl font-semibold leading-[.88] tracking-[-.03em] sm:text-8xl lg:text-[7.6rem]">Saroop<br />Singh</h1>
              <p className="mt-6 max-w-xl font-serif text-2xl italic leading-snug text-amber-100/90 sm:text-3xl">A runner in the record. A family memory. A Malayan story returned to view.</p>
              <p className="mt-6 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">Explore the reviewed newspaper catalogue and best-available photographic sources—keeping source files visibly distinct from AI studies.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/story" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber-300 px-6 font-semibold text-[#17241d] transition hover:bg-amber-200">Begin his story <ArrowRight className="h-5 w-5" /></Link>
                <Link href="/articles" className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 font-semibold text-white hover:bg-white/10">Explore archive</Link>
                <Link href="/gallery" className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 font-semibold text-white hover:bg-white/10"><Images className="h-5 w-5" /> Photographs</Link>
                <Link href="/remember" className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 font-semibold text-white hover:bg-white/10"><ImagePlus className="h-5 w-5" /> Add a memory</Link>
              </div>
            </div>
            <figure className="order-1 lg:order-2">
              <div className="relative mx-auto aspect-[4/5] max-h-[72vh] overflow-hidden rounded-[2rem] border border-white/15 bg-black shadow-2xl shadow-black/30 sm:rounded-[2.5rem]">
                <Image src="/gallery-images/saroop-singh-running2.png" alt="Newspaper portrait identifying Saroop Singh as the half-mile winner" fill priority unoptimized sizes="(max-width: 1024px) 92vw, 45vw" className="object-contain object-center grayscale contrast-110" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-5 pt-20 sm:p-7 sm:pt-24"><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-300">Newspaper source crop</p><figcaption className="mt-2 font-serif text-xl text-white sm:text-2xl">Saroop Singh, half-mile winner · published 19 July 1937</figcaption></div>
              </div>
            </figure>
          </div>
        </ResponsiveContainer>
      </section>
      
      {/* About Section with Elegant Design */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-neutral-50">
        <ContentContainer>
          <VStack gap="xl" className="text-center">
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                About Saroop Singh
              </h2>
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
                Surviving newspaper reports document Saroop Singh as a Sikh middle- and long-distance runner in
                1930s and 1940s Malaya. This family-led archive preserves catalogue entries and best-available image
                sources while marking duplicates, transcription uncertainty, and later identity questions openly.
              </p>
            </div>
            
            {/* Feature Cards - Sophisticated Modern Grid */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Historical Articles Card */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-sm border border-neutral-200/60 hover:shadow-xl hover:border-amber-300/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/70 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="w-14 h-14 bg-[#17241d] rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Historical Articles</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Browse digitised newspaper clippings that document Saroop Singh&apos;s reported races,
                    results, and sporting activity from the 1930s and 1940s.
                  </p>
                  <Link 
                    href="/articles"
                    className="inline-flex items-center text-amber-900 font-semibold hover:text-amber-950 transition-colors group/link"
                  >
                    Explore Articles
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
              
              {/* Timeline Card */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-sm border border-neutral-200/60 hover:shadow-xl hover:border-primary-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Timeline</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Follow the chronological journey of Saroop Singh&apos;s athletic career through key 
                    reported results and appearances in the surviving Malayan newspaper record.
                  </p>
                  <Link 
                    href="/timeline"
                    className="inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700 transition-colors group/link"
                  >
                    View Timeline
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
              
              {/* Archive methodology card */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-sm border border-neutral-200/60 hover:shadow-xl hover:border-accent-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/20">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Archive Method</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Understand how scans are transcribed, dated, attributed, restored, and distinguished from physical source objects.
                  </p>
                  <Link 
                    href="/methodology"
                    className="inline-flex items-center text-accent-600 font-semibold hover:text-accent-700 transition-colors group/link"
                  >
                    Read the Method
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
              
              {/* Gallery Card */}
              <div className="group relative bg-white rounded-2xl p-8 shadow-sm border border-neutral-200/60 hover:shadow-xl hover:border-amber-300/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/70 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/10">
                    <Images className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Restoration Gallery</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    Compare best-available family scans and newspaper crops with labelled restoration studies without confusing interpretation for evidence.
                  </p>
                  <Link 
                    href="/gallery"
                    className="inline-flex items-center text-amber-900 font-semibold hover:text-amber-950 transition-colors group/link"
                  >
                    View Gallery
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </VStack>
        </ContentContainer>
      </section>

      {/* Featured Articles Section - Elegant Design */}
      {featuredArticles.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
          <ContentContainer>
            <VStack gap="xl">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-transparent mb-6">Featured Articles</h2>
                <p className="text-lg text-neutral-600">
                  Discover key moments in Saroop Singh&apos;s athletic journey through these carefully selected historical articles.
                </p>
              </div>
              
              <Suspense fallback={
                <GridLayout cols={{ default: 1, sm: 2, lg: 3 }} className="animate-pulse">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="bg-white rounded-xl h-64 border border-gray-200" />
                  ))}
                </GridLayout>
              }>
                <GridLayout cols={{ default: 1, sm: 2, lg: 3 }} gap="lg">
                  {featuredArticles.map((article) => (
                    <MobileArticleCard
                      key={article.slug}
                      article={article}
                      variant="default"
                      showImage={true}
                    />
                  ))}
                </GridLayout>
              </Suspense>
              
              <div className="text-center pt-8">
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
    </main>
  );
}

export const revalidate = 1800; // Revalidate every 30 minutes
