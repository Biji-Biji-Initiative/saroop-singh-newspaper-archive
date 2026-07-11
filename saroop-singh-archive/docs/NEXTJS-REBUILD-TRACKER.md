# Next.js Rebuild Implementation Tracker

> **Historical planning snapshot.** Any Vercel deployment references below
> were superseded by the Coolify cutover. Use
> [DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md) for the supported production
> path.

## Monorepo Structure ✅
- ✅ Created proper monorepo with npm workspaces
- ✅ Four packages: web, cms, clippings, restorations
- ✅ Shared resources in `/shared/` directory
- ✅ Documentation in `/docs/`

## Current Status
**Phase**: Initial Setup
**Target**: Feature parity with Jekyll site
**Approach**: Component-by-component recreation

---

## Implementation Phases

### Phase 1: Foundation Setup ⏳
- [x] Monorepo structure created
- [x] Next.js package initialized
- [x] Tailwind CSS configured
- [ ] Install required dependencies
- [ ] Set up TypeScript configuration
- [ ] Create base layout structure
- [ ] Configure paths for shared resources

### Phase 2: Data Layer
- [ ] Move articles from `packages/cms/articles/` to `shared/data/articles/`
- [ ] Move raw images from `packages/cms/raw-files/` to `shared/assets/raw-images/`
- [ ] Create article parsing utilities
- [ ] Implement data fetching functions
- [ ] Create TypeScript types for articles
- [ ] Set up article index generation

### Phase 3: Core Components
#### Layout Components
- [ ] Header with navigation
- [ ] Footer
- [ ] Page container
- [ ] Mobile menu

#### Article Components
- [ ] ArticleCard component
- [ ] ArticleGrid component
- [ ] ArticleModal component
- [ ] ArticleContent component

#### Search & Filter Components
- [ ] SearchBar component
- [ ] FilterPanel component
- [ ] DateRangePicker component
- [ ] SourceFilter component
- [ ] PeopleFilter component

### Phase 4: Pages Implementation
#### Homepage (`/`)
- [ ] Hero section with title
- [ ] Family heritage section
- [ ] Featured articles
- [ ] Quick stats
- [ ] Navigation buttons

#### Articles Page (`/articles`)
- [ ] Article grid layout
- [ ] Search functionality
- [ ] Advanced filters
- [ ] Infinite scroll
- [ ] Article modal

#### Timeline Page (`/timeline`)
- [ ] Year selector
- [ ] Chronological display
- [ ] Interactive timeline
- [ ] Article preview

#### About Page (`/about`)
- [ ] Biography content
- [ ] Achievements section
- [ ] Historical context

#### Restorations Page (`/restorations`)
- [ ] Photo gallery
- [ ] Before/after display
- [ ] Image lightbox

### Phase 5: Features & Functionality
- [ ] Full-text search implementation
- [ ] Complex filtering logic
- [ ] URL state management
- [ ] Image optimization
- [ ] Loading states
- [ ] Error boundaries
- [ ] SEO metadata

### Phase 6: Polish & Optimization
- [ ] Animations and transitions
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Cross-browser testing

### Phase 7: Deployment
- [ ] Build optimization
- [ ] Vercel configuration
- [ ] Environment variables
- [ ] Custom domain setup
- [ ] Analytics integration

---

## Technical Checklist

### Dependencies to Install
```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "18.0.0",
    "react-dom": "18.0.0",
    "tailwindcss": "^3.4.0",
    "gray-matter": "^4.0.3",
    "date-fns": "^3.0.0",
    "fuse.js": "^7.0.0",
    "@headlessui/react": "^1.7.0",
    "clsx": "^2.0.0"
  }
}
```

### File Structure
```
packages/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── articles/
│   │   │   └── page.tsx
│   │   ├── timeline/
│   │   │   └── page.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── restorations/
│   │       └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── articles/
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── ArticleGrid.tsx
│   │   │   ├── ArticleModal.tsx
│   │   │   └── ArticleFilters.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── lib/
│   │   ├── articles.ts
│   │   ├── search.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
└── styles/
    └── globals.css
```

---

## Component Specifications

### ArticleCard
- Display: Title, date, source, excerpt
- Image: Thumbnail of newspaper clipping
- Interaction: Click to open modal
- States: Default, hover, loading

### ArticleModal
- Full article content
- Large newspaper image
- Metadata sidebar
- Navigation controls
- Close button
- Keyboard navigation (ESC to close)

### Search & Filters
- Real-time search
- Debounced input
- Filter combinations
- Clear filters button
- Results count
- Mobile-friendly

### Timeline
- Year navigation
- Smooth scrolling
- Article markers
- Interactive tooltips
- Mobile swipe support

---

## Data Structure (Preserved)
```typescript
interface Article {
  id: string;
  title: string;
  date: string;
  dateText: string;
  source: string;
  location: string;
  people: string[];
  image: string;
  tags: string[];
  content: string;
  excerpt: string;
}
```

---

## Testing Checklist
- [ ] Desktop (1920px, 1440px, 1024px)
- [ ] Tablet (768px)
- [ ] Mobile (375px, 360px)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Search functionality
- [ ] Filter combinations
- [ ] Modal interactions
- [ ] Image loading
- [ ] Accessibility (keyboard nav, screen readers)

---

## Performance Targets
- Lighthouse Performance: > 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1
- Bundle size: < 200KB (JS)

---

## Next Actions
1. Install all dependencies in web package
2. Create app directory structure
3. Set up global styles with Tailwind
4. Create base layout component
5. Start with homepage implementation

---

**Current Blockers**: None
**Risk Items**: Image optimization for large newspaper scans
**Notes**: Preserve exact UI/UX from Jekyll site
