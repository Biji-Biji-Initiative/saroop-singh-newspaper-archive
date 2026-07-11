# Saroop Singh Archive - Next.js Migration Plan

> **Historical planning snapshot.** Any Vercel deployment references below
> were superseded by the Coolify cutover. Use
> [DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md) for the supported production
> path.

## Project Overview
Migrate the historical newspaper archive from Jekyll/GitHub Pages to Next.js/Vercel for better maintainability and performance.

## Current State Analysis

### What Works Well (Keep)
- **UI/UX Design**: Clean, professional archive interface
- **Data Structure**: Markdown files with YAML frontmatter work perfectly
- **Content Organization**: 38 historical articles (1936-1957) properly structured
- **Features**: Search, filtering, modal system, timeline view, responsive design

### Current Issues (Fix)
- Jekyll complexity and build issues
- File serving problems with GitHub Pages
- Over-engineered configuration
- Maintenance overhead

## Target Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI or shadcn/ui
- **Deployment**: Vercel
- **Data Source**: Markdown files (same as current)

### Project Structure
```
saroop-singh-archive/
├── legacy-jekyll/          # Archive current implementation
├── nextjs-app/            # New Next.js application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and data fetching
│   ├── public/           # Static assets
│   └── data/             # Article markdown files
├── raw-files/            # Original newspaper images
└── docs/                 # Project documentation
```

## Migration Strategy

### Phase 1: Project Setup & Organization
1. Reorganize project structure
2. Archive Jekyll implementation
3. Initialize Next.js app with proper configuration
4. Set up Tailwind CSS and UI components

### Phase 2: Data Migration
1. Move markdown articles to Next.js data directory
2. Create markdown parsing utilities
3. Implement article data fetching
4. Set up image optimization for newspaper scans

### Phase 3: UI Recreation
1. Recreate archive listing page
2. Implement search and filtering
3. Build article modal/detail view
4. Create timeline visualization
5. Ensure mobile responsiveness

### Phase 4: Features & Polish
1. Add SEO optimization
2. Implement proper error handling
3. Add loading states
4. Performance optimization

### Phase 5: Deployment
1. Configure Vercel deployment
2. Set up custom domain (if needed)
3. Test production build
4. Archive Jekyll version

## Implementation Roadmap

### Week 1: Foundation
- [ ] Project restructure and Next.js setup
- [ ] Data migration and parsing
- [ ] Basic page structure

### Week 2: Core Features
- [ ] Article listing and search
- [ ] Modal system and article detail
- [ ] Responsive design implementation

### Week 3: Advanced Features
- [ ] Timeline view
- [ ] Advanced filtering
- [ ] Performance optimization

### Week 4: Deployment & Polish
- [ ] Vercel deployment
- [ ] Final testing and bug fixes
- [ ] Documentation update

## Key Features to Preserve

### Archive Listing
- Grid/list view of articles
- Search functionality
- Date range filtering
- Source filtering
- People filtering
- Infinite scroll/pagination

### Article Detail
- Full article content display
- Newspaper image viewing
- Article metadata (date, source, people)
- Modal overlay system

### Timeline View
- Chronological article display
- Year-based navigation
- Interactive timeline visualization

### Responsive Design
- Mobile-first approach
- Touch-friendly interactions
- Optimized image loading

## Data Structure
Keep existing markdown format:
```yaml
---
title: Article Headline
date_text: DD Mon YYYY
source: Newspaper Name, Page N
location: City
people:
  - Person Name 1
  - Person Name 2
image: ../../raw-files/filename.jpg
tags: [clipping]
---
Article content...
```

## Success Criteria
1. **Feature Parity**: All current features working
2. **Performance**: Sub-2s load times
3. **Maintainability**: Clean, documented code
4. **Deployment**: Automated Vercel deployment
5. **SEO**: Proper metadata and structure
6. **Mobile**: Fully responsive design

## Risk Mitigation
- Keep Jekyll version as backup during migration
- Incremental development with frequent testing
- Use TypeScript for better maintainability
- Implement comprehensive error handling

## Next Steps
1. Execute project restructure
2. Set up Next.js foundation
3. Begin data migration
4. Start UI implementation

---
*This plan prioritizes preserving the excellent UI/UX while modernizing the technical foundation for better maintainability and deployment.*
