# Saroop Singh Archive - Project Tracker

> **Historical planning snapshot.** Any Vercel deployment references below
> were superseded by the Coolify cutover. Use
> [DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md) for the supported production
> path.

## Migration Progress

### Phase 1: Foundation & Setup ✅
- [x] Create migration plan document
- [x] Analyze current UI/UX and features  
- [x] Reorganize project structure
- [x] Archive Jekyll implementation to `legacy-jekyll/`
- [x] Initialize Next.js app with TypeScript + Tailwind
- [x] Set up project documentation

### Phase 2: Data & Content Migration
- [ ] Create data directory structure in Next.js app
- [ ] Move markdown articles to Next.js data folder
- [ ] Copy and organize raw newspaper images
- [ ] Create markdown parsing utilities
- [ ] Implement article data fetching functions
- [ ] Set up image optimization configuration
- [ ] Test data loading and parsing

**Estimated Time**: 2-3 days

### Phase 3: Core Components
- [ ] Set up component library structure
- [ ] Create base layout and navigation
- [ ] Build article card component
- [ ] Implement article modal component
- [ ] Create search and filter components
- [ ] Add loading states and error handling
- [ ] Ensure mobile responsiveness

**Estimated Time**: 4-5 days

### Phase 4: Pages Implementation
- [ ] Homepage with hero section and featured articles
- [ ] Articles listing page with search/filter
- [ ] Article detail pages (if needed)
- [ ] Timeline visualization page
- [ ] About page content
- [ ] Restorations gallery page
- [ ] 404 and error pages

**Estimated Time**: 3-4 days

### Phase 5: Advanced Features
- [ ] Advanced search functionality
- [ ] Complex filtering system
- [ ] Timeline visualization
- [ ] Image zoom and lightbox
- [ ] URL routing and deep linking
- [ ] SEO optimization
- [ ] Performance optimization

**Estimated Time**: 3-4 days

### Phase 6: Polish & Deploy
- [ ] Add animations and micro-interactions
- [ ] Comprehensive testing on all devices
- [ ] Performance audit and optimization
- [ ] Set up Vercel deployment
- [ ] Configure custom domain (if needed)
- [ ] Final bug fixes and polish
- [ ] Documentation update

**Estimated Time**: 2-3 days

## Technical Checklist

### Dependencies Setup
- [ ] Install additional UI components (shadcn/ui or Headless UI)
- [ ] Add markdown parsing library (gray-matter, remark)
- [ ] Install date manipulation library (date-fns)
- [ ] Add image optimization libraries
- [ ] Set up search functionality (Fuse.js or similar)

### Project Structure
```
nextjs-app/
├── src/
│   ├── app/                    # App router pages
│   │   ├── page.tsx           # Homepage
│   │   ├── articles/          # Articles pages
│   │   ├── timeline/          # Timeline page
│   │   ├── about/             # About page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── layout/           # Layout components
│   │   ├── articles/         # Article-specific components
│   │   └── timeline/         # Timeline components
│   ├── lib/                  # Utilities
│   │   ├── markdown.ts       # Markdown parsing
│   │   ├── search.ts         # Search functionality
│   │   └── utils.ts          # General utilities
│   └── types/                # TypeScript types
├── public/                   # Static assets
│   ├── raw-files/           # Newspaper images
│   └── generated/           # Processed images
├── data/                    # Article markdown files
│   └── articles/           # Individual article files
└── docs/                   # Project documentation
```

### Features Checklist

#### Homepage
- [ ] Hero section with archive title
- [ ] Featured articles showcase
- [ ] Quick stats display
- [ ] Navigation to main sections
- [ ] Family heritage section

#### Articles Page
- [ ] Article grid/list view
- [ ] Search functionality
- [ ] Advanced filters:
  - [ ] Date range
  - [ ] Newspaper source
  - [ ] People mentioned
  - [ ] Quick filter buttons
- [ ] Infinite scroll or pagination
- [ ] Article modal overlay
- [ ] Responsive design

#### Article Modal
- [ ] Large newspaper image
- [ ] Full article content
- [ ] Metadata display
- [ ] Navigation controls
- [ ] Close functionality
- [ ] Keyboard navigation

#### Timeline Page
- [ ] Year navigation
- [ ] Chronological article display
- [ ] Interactive timeline
- [ ] Article preview cards
- [ ] Modal integration

#### About Page
- [ ] Biography content
- [ ] Achievement highlights
- [ ] Historical context
- [ ] Family information

#### Restorations Page
- [ ] Photo gallery
- [ ] Before/after comparisons
- [ ] Image restoration showcase

## Quality Gates

### Phase Completion Criteria
1. **Foundation**: Next.js app running with proper structure
2. **Data Migration**: All articles loading correctly
3. **Core Components**: All UI components functional
4. **Pages**: All pages implemented with basic functionality
5. **Features**: Advanced features working smoothly
6. **Deploy**: Live site with all features working

### Testing Checklist
- [ ] Desktop responsiveness (1920px, 1440px, 1024px)
- [ ] Tablet responsiveness (768px)
- [ ] Mobile responsiveness (375px, 360px)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Search functionality testing
- [ ] Filter combinations testing
- [ ] Image loading and optimization
- [ ] Performance testing (Lighthouse scores)
- [ ] Accessibility testing

## Deployment Plan
1. Set up Vercel account and project
2. Connect GitHub repository
3. Configure build settings
4. Set up environment variables
5. Configure custom domain (optional)
6. Set up analytics (if needed)
7. Monitor deployment and performance

## Risk Assessment
- **Low Risk**: UI recreation, basic functionality
- **Medium Risk**: Complex search/filter logic, timeline visualization
- **High Risk**: Performance with large image sets, mobile optimization

## Success Metrics
- All current features preserved and functional
- Lighthouse performance score > 90
- Mobile-friendly test passing
- Sub-2 second load times
- Zero critical accessibility issues
- Seamless deployment to Vercel

---

**Next Actions**:
1. Begin Phase 2: Data & Content Migration
2. Set up data directory and markdown parsing
3. Implement basic article loading functionality
