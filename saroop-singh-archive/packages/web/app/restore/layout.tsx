import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photo Restoration | Saroop Singh Archive',
  description: 'Restore and enhance historical photographs using AI-powered restoration tools.',
};

export default function RestoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}