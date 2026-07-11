/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // typedRoutes: true, // Disabled for now
  },
  outputFileTracingRoot: require('path').join(__dirname, '../..'),
  // Do not fail the build on ESLint errors in production builds
  eslint: {
    ignoreDuringBuilds: false,
  },

  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable static exports for GitHub Pages if needed
  // output: 'export',
  // trailingSlash: true,
  // basePath: '/saroop-singh-archive',

  // Webpack config to handle markdown files
  webpack: config => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    })

    return config
  },

  // Environment variables
  env: {
    SITE_NAME: 'Saroop Singh Archive',
    SITE_DESCRIPTION:
      'A digital archive documenting the athletic achievements and life of Saroop Singh',
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/gallery-images/:path*',
        destination: '/gallery/:path*',
        permanent: true,
      },
    ]
  },

  // Headers for better performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
