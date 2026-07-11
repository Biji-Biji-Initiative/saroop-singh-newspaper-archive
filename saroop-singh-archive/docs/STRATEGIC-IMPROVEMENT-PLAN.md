# Saroop Singh Archive - Strategic Improvement Plan

> **Historical planning snapshot.** Any Vercel deployment references below
> were superseded by the Coolify cutover. Use
> [DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md) for the supported production
> path.
*Generated: December 2024*

## Executive Summary
After comprehensive analysis, the monorepo is 45% complete with solid architecture but critical gaps in implementation. This plan provides a roadmap to production-ready status in 3-4 weeks.

---

## Current State Assessment

### ✅ What's Working Well
- **Monorepo Structure**: Clean, well-organized with proper workspace setup
- **Documentation**: Exceptional planning documents (A+ quality)
- **Data Migration**: All 38 articles successfully migrated
- **Modern Stack**: Next.js 15, React 19, Tailwind 4.0
- **UI Components**: Radix UI library fully configured

### 🔴 Critical Issues
1. **Dependency Hell**: Missing and conflicting dependencies across packages
2. **Empty Next.js Config**: No image optimization or build settings
3. **Incomplete Implementation**: Only 40% of web package completed
4. **No Data Layer**: Article parsing utilities not implemented
5. **Missing Core Features**: No search, filtering, or modal system

### 📊 Package Health Status
| Package | Completion | Health | Critical Issues |
|---------|------------|--------|-----------------|
| web | 40% | ⚠️ | Missing config, incomplete components |
| cms | 70% | ✅ | Missing markdown-it dependency |
| clippings | 85% | ✅ | Glob version conflict |
| restorations | 60% | 🔴 | Canvas dependency issue |

---

## Strategic Roadmap

### 🎯 Phase 1: Foundation Fixes (Days 1-3)
**Goal**: Resolve all blocking issues and establish solid foundation

#### Day 1: Dependency Resolution
```bash
# Priority 1: Fix all dependencies
cd packages/cms && npm install markdown-it@^13.0.0
cd packages/clippings && npm install glob@^10.3.10
cd packages/restorations && npm install canvas@^2.11.0 sharp@^0.32.0

# Priority 2: Update root workspace
cd ../.. && npm install
npm dedupe
```

#### Day 2: Next.js Configuration
- [ ] Configure next.config.ts for production
- [ ] Set up image optimization
- [ ] Configure API routes for article serving
- [ ] Add environment variables setup

#### Day 3: Core Infrastructure
- [ ] Complete article parsing utilities
- [ ] Set up error boundaries
- [ ] Implement loading states
- [ ] Create base layout components

### 🚀 Phase 2: Core Implementation (Days 4-10)
**Goal**: Implement all essential features

#### Component Development Priority
1. **Article System** (Days 4-5)
   - [ ] ArticleCard component
   - [ ] ArticleGrid with pagination
   - [ ] ArticleModal with image viewer
   - [ ] Article content renderer

2. **Search & Filter** (Days 6-7)
   - [ ] Search implementation with Fuse.js
   - [ ] Filter panel (date, source, people)
   - [ ] URL state management
   - [ ] Results display

3. **Page Implementation** (Days 8-10)
   - [ ] Homepage with hero section
   - [ ] Articles listing page
   - [ ] Timeline visualization
   - [ ] About page

### 📈 Phase 3: Enhancement & Polish (Days 11-15)
**Goal**: Production-ready features

- [ ] Performance optimization
- [ ] SEO implementation
- [ ] Mobile responsiveness
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Analytics integration
- [ ] Error tracking (Sentry)

### 🏁 Phase 4: Deployment Preparation (Days 16-20)
**Goal**: Production deployment

- [ ] Vercel configuration
- [ ] CI/CD pipeline
- [ ] Testing suite
- [ ] Documentation update
- [ ] Performance audit
- [ ] Security review

---

## Implementation Priorities

### 🔴 IMMEDIATE (Today)
1. **Fix Dependencies**
   ```json
   // packages/cms/package.json
   "dependencies": {
     "markdown-it": "^13.0.0"
   }
   
   // packages/restorations/package.json
   "dependencies": {
     "canvas": "^2.11.0",
     "sharp": "^0.32.0"
   }
   ```

2. **Configure Next.js**
   ```typescript
   // packages/web/next.config.ts
   import type { NextConfig } from 'next'
   
   const nextConfig: NextConfig = {
     images: {
       domains: ['localhost'],
       formats: ['image/avif', 'image/webp'],
       deviceSizes: [640, 750, 828, 1080, 1200, 1920],
       imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
     },
     experimental: {
       optimizeCss: true,
       optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
     },
   }
   
   export default nextConfig
   ```

3. **Complete Article Utilities**
   ```typescript
   // packages/web/src/lib/articles.ts
   export async function getArticleBySlug(slug: string): Promise<Article | null>
   export async function searchArticles(query: string): Promise<Article[]>
   export async function getArticlesByDateRange(start: Date, end: Date): Promise<Article[]>
   export async function getArticlesByPerson(person: string): Promise<Article[]>
   ```

### 🟡 HIGH PRIORITY (Week 1)
- Implement core components
- Set up data fetching
- Create basic pages
- Add error handling

### 🟢 MEDIUM PRIORITY (Week 2)
- Search functionality
- Filter system
- Timeline visualization
- Performance optimization

### 🔵 LOW PRIORITY (Week 3+)
- Analytics
- Advanced features
- Testing suite
- Documentation

---

## Architecture Improvements

### 1. Monorepo Optimization
```json
// root package.json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

### 2. Shared Configuration
Create shared configs for consistency:
- `shared/config/tsconfig.base.json`
- `shared/config/eslint.base.js`
- `shared/config/prettier.config.js`

### 3. Image Optimization Pipeline
```typescript
// packages/web/src/lib/images.ts
export async function optimizeImage(src: string): Promise<{
  src: string
  srcSet: string
  sizes: string
  placeholder: string
}>
```

### 4. Build Pipeline
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
```

---

## Success Metrics

### Technical Metrics
- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Bundle size < 200KB
- [ ] 100% TypeScript coverage

### Functional Metrics
- [ ] All 38 articles accessible
- [ ] Search returns results < 100ms
- [ ] Modal loads images < 2s
- [ ] Mobile responsive at all breakpoints
- [ ] Zero runtime errors

### Business Metrics
- [ ] Feature parity with Jekyll site
- [ ] Improved user engagement
- [ ] Faster page loads
- [ ] Better SEO rankings
- [ ] Easier maintenance

---

## Risk Mitigation

### High Risk Areas
1. **Image Performance**: Large newspaper scans
   - **Mitigation**: Progressive loading, WebP format, CDN

2. **Search Performance**: 38+ articles
   - **Mitigation**: Client-side indexing, debounced search

3. **Deployment Complexity**: Monorepo deployment
   - **Mitigation**: Vercel monorepo support, proper build config

### Contingency Plans
- **If dependencies fail**: Use alternative packages
- **If performance lags**: Implement pagination, virtualization
- **If deployment fails**: Fall back to static export

---

## Resource Requirements

### Development Time
- **Total Estimate**: 3-4 weeks
- **Daily Commitment**: 4-6 hours
- **Critical Path**: Days 1-10

### Technical Requirements
- Node.js 18+
- npm 9+
- Git
- VS Code (recommended)

### External Services
- Vercel (hosting)
- GitHub (repository)
- Cloudinary (optional, images)
- Sentry (optional, monitoring)

---

## Next Steps Checklist

### Today (Day 0)
- [ ] Review this plan
- [ ] Fix critical dependencies
- [ ] Set up development environment
- [ ] Create implementation branch

### Tomorrow (Day 1)
- [ ] Complete dependency resolution
- [ ] Configure Next.js
- [ ] Test monorepo build
- [ ] Begin component development

### This Week
- [ ] Complete Phase 1
- [ ] Start Phase 2
- [ ] Daily progress commits
- [ ] Update tracker document

---

## Monitoring & Tracking

### Daily Standup Questions
1. What was completed yesterday?
2. What will be done today?
3. Are there any blockers?

### Weekly Review
- Progress against plan
- Metric evaluation
- Risk assessment
- Plan adjustments

### Success Criteria
The project is complete when:
1. All 38 articles are accessible
2. Search and filtering work
3. Performance metrics are met
4. Deployment is successful
5. Documentation is updated

---

## Conclusion

The Saroop Singh Archive project has excellent bones but needs focused execution. With 3-4 weeks of dedicated development following this plan, the project will achieve production-ready status with modern performance and maintainability.

**Key Success Factors:**
1. Fix dependencies immediately
2. Focus on core features first
3. Test continuously
4. Deploy incrementally
5. Document everything

**Expected Outcome**: A world-class digital archive preserving Malaysian athletic history with modern web technology.
