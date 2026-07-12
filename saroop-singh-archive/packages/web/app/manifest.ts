import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saroop Singh Archive',
    short_name: 'SS Archive',
    description: 'A family-led archive of Saroop Singh, documented in athletics in pre-war Malaya.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f1e8',
    theme_color: '#17241d',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
