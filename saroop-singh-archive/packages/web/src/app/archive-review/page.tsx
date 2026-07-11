import type { Metadata } from 'next'

import { ArchiveReviewQueue } from '@/components/review/archive-review-queue'

export const metadata: Metadata = {
  title: 'Archive review',
  description: 'Private review queue for Saroop Singh Archive contributors.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ArchiveReviewPage() {
  return <ArchiveReviewQueue />
}
