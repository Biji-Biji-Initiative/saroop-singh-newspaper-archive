import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Providers } from './providers';
import { Suspense } from 'react';
import { OfflineRegister } from '@/components/offline-register';
import { SITE_ORIGIN } from '@/lib/site';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archiveSerif = Cormorant_Garamond({
  variable: "--font-archive-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    template: '%s | Saroop Singh Archive',
    default: 'Saroop Singh Archive | Runner in Pre-war Malaya',
  },
  description: 'A family-led archive of Saroop Singh, a Sikh middle-distance runner documented in athletics in pre-war Malaya.',
  keywords: ['Saroop Singh', 'Malayan athletics', 'historical archive', 'newspaper clippings', 'sports history'],
  authors: [{ name: 'Saroop Singh Archive' }],
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Saroop Singh Archive',
    images: [
      {
        url: '/gallery-images/saroop-singh-running2.png',
        alt: 'Saroop Singh Archive',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saroop Singh Archive',
    description: 'A family-led archive of a runner documented in pre-war Malaya',
    images: ['/gallery-images/saroop-singh-running2.png'],
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a202c' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archiveSerif.variable} antialiased bg-white text-gray-900 overflow-x-hidden`}
      >
        <a href="#main-content" className="skip-link">Skip to archive content</a>
        <OfflineRegister />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <div id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </div>
            <Suspense fallback={null}>
              <Footer />
            </Suspense>
          </div>
        </Providers>
      </body>
    </html>
  );
}
