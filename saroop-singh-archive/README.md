# Saroop Singh Historical Archive - Monorepo

This monorepo contains all the components for the Saroop Singh Historical Archive project, which digitizes and organizes athletic meet clippings from Malayan newspapers (1937-1954).

## Project Structure

```
saroop-singh-archive/
├── packages/
│   ├── web/           # Next.js website frontend
│   ├── cms/           # Content management system
│   ├── clippings/     # Newspaper processing utilities
│   └── restorations/  # AI image restoration tools
├── shared/
│   ├── data/         # Shared data files
│   ├── assets/       # Shared assets (images, restorations)
│   └── types/        # Shared TypeScript types
├── docs/             # Documentation
└── scripts/          # Build and utility scripts
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

## Family contributions

For the current, family-friendly photo, article, correction, and review
workflow, see the repository-wide [contribution guide](../CONTRIBUTING.md).
It documents the private moderation path and the exact content checks used by
continuous integration.

## Package Overview

### @saroop-singh-archive/web
Next.js website for browsing and displaying the historical archive.

### @saroop-singh-archive/cms
Content management system for processing newspaper clippings into structured Markdown articles.

### @saroop-singh-archive/clippings
Utilities for processing newspaper clippings, including image processing and metadata extraction.

### Restoration research
The public restoration feature is implemented in the web package and deployed
with the archive. Historical Python and ADK experiments are retained under
`packages/restorations/` as non-production research; see
[README-RESTORATION.md](README-RESTORATION.md).

## Available Scripts

- `npm run dev` - Start development server for the web package
- `npm run build` - Build all packages
- `npm run test` - Run tests for all packages
- `npm run lint` - Lint all packages
- `npm run cms:dev` - Start CMS development tools
- `npm run clippings:process` - Process newspaper clippings

## Migration Notes

This project has been restructured from a single directory to a monorepo. Original content:
- CMS raw-files and articles remain in `packages/cms/`
- Old family photos moved to `shared/assets/images/`
- Image generation content moved to `shared/assets/restorations/`
- Jekyll site files remain in the parent directory during transition

## Legacy Structure

The original project structure contained:
- `raw-files/` - Original scanned newspaper images
- `output/articles/` - Processed Markdown articles
- Various shell scripts for processing
- Jekyll-based website files

These have been reorganized into the monorepo structure for better maintainability and scalability.
