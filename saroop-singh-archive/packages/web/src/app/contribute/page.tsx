import type { Metadata } from 'next'

import { FamilyContributionForm } from '@/components/contribution/family-contribution-form'

export const metadata: Metadata = {
  title: 'Share a family memory | Saroop Singh Archive',
  description:
    'Privately preserve family photographs, names, dates, and stories for archive review.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ContributePage() {
  return <FamilyContributionForm />
}
