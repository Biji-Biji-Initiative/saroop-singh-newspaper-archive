import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Providers } from './providers'
import { Suspense } from 'react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://saroop.mereka.dev'),
  title: {
    template: '%s | Saroop Singh Archive',
    default: 'Saroop Singh Archive | Malaysian Athletics Pioneer',
  },
  description:
    'Preserving the legacy of Saroop Singh, a pioneering Sikh athlete who made significant contributions to Malaysian athletics in the 1930s and 1940s.',
  keywords: [
    'Saroop Singh',
    'Malaysian athletics',
    'historical archive',
    'newspaper clippings',
    'sports history',
  ],
  authors: [{ name: 'Saroop Singh Archive' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://saroop.mereka.dev',
    siteName: 'Saroop Singh Archive',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Saroop Singh Archive',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saroop Singh Archive',
    description: 'Preserving the legacy of a Malaysian athletics pioneer',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a202c' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} overflow-x-hidden bg-white text-gray-900 antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Suspense fallback={null}>
              <Footer />
            </Suspense>
          </div>
        </Providers>
      </body>
    </html>
  )
}
