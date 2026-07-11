# Saroop Singh Archive - Next.js Web Application

A modern, performant web application for browsing and exploring the historical newspaper archive of Saroop Singh, a pioneering athlete from Malaya (1936-1957).

## 🚀 Features

- **📰 Article Browser**: Browse 38 historical newspaper clippings with advanced search and filtering
- **🔍 Smart Search**: Full-text search with debouncing and auto-suggestions
- **🎯 Advanced Filtering**: Filter by people, sources, locations, tags, and date ranges
- **📅 Timeline View**: Chronological visualization of articles grouped by year
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🎨 Vintage Theme**: Authentic newspaper archive aesthetic with sepia tones
- **⚡ Performance**: Server-side rendering, static generation, and optimized images
- **♿ Accessibility**: Keyboard navigation, ARIA labels, and semantic HTML

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Data**: Markdown files with YAML frontmatter
- **Deployment**: Dockerized for Coolify

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🗂️ Project Structure

```
packages/web/
├── app/                    # Next.js App Router pages
│   ├── articles/          # Article listing and detail pages
│   ├── timeline/          # Timeline view page
│   ├── about/             # About page
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── article-*.tsx     # Article-specific components
│   ├── filter-*.tsx      # Filter components
│   └── timeline-*.tsx    # Timeline components
├── lib/                   # Utilities and data fetching
│   ├── articles.ts       # Article data functions
│   ├── markdown.ts       # Markdown parsing
│   └── types.ts          # TypeScript types
├── data/                  # Content
│   └── articles/         # Markdown article files
└── public/               # Static assets
```

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript type checking
npm run format      # Format code with Prettier
npm run format:check # Check code formatting
```

## 🎯 Key Features

### Article Management

- Server-side rendering for SEO
- Static generation for article pages
- Dynamic metadata for each article
- Related article suggestions

### Search & Filter System

- Real-time search with 300ms debounce
- Multi-criteria filtering
- Filter suggestions based on data
- Active filter badges with removal

### Timeline Visualization

- Articles grouped by year
- Decade quick filters
- Expandable article groups
- Chronological sorting

### Performance Optimizations

- Image optimization with Next.js Image
- Code splitting and lazy loading
- Static generation where possible
- Efficient data caching

## 🔧 Data Integration

The application works with the monorepo's content structure:

- Article data: `../../content/articles/published/`
- Images: `../../content/media/`
- Metadata: `../../content/metadata/`

Articles are stored as Markdown files with YAML frontmatter:

```yaml
---
title: "Article Title"
date: "1937-07-18"
date_text: "18 July 1937"
source: "The Straits Times, Page 15"
location: "Kuala Lumpur"
people:
  - "Saroop Singh"
  - "Other Person"
tags: ["athletics", "records"]
image: "../../assets/images/article.jpg"
---
Article content in Markdown...
```

## 🎨 Customization

### Theming

The application uses a custom vintage newspaper theme:

- `vintage.*` - Warm brown tones
- `sepia.*` - Aged yellow/brown tones

Colors are defined in `tailwind.config.ts`.

### Typography

- **Inter** - Modern sans-serif for body text and UI
- **Playfair Display** - Elegant serif for headlines

### Components

UI components are built with shadcn/ui and can be customized in `components/ui/`.

## 🚀 Deployment

### Coolify (Production)

The repository-root Dockerfile builds this package and the published archive
content together. Deploy that image through Coolify, expose port `3000`, and
attach durable storage at `/data`. The target public domain is
`https://saroop.mereka.dev`.

### Environment Variables

For local development, create `.env.local` only if needed. Production values
are managed in Infisical and injected by Coolify:

```env
GEMINI_API_KEY=development-only-key
ARCHIVE_DATA_DIR=archive-data
```

See the root [deployment guide](../../DEPLOYMENT-GUIDE.md) for production
variables, volume requirements, and verification steps.

## 📊 Performance Metrics

- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)
- **Core Web Vitals**: All green
- **Bundle Size**: Optimized with code splitting
- **Load Time**: < 2s on 3G networks

## 📚 API

### Search API

```typescript
GET /api/search
Query parameters:
{
  query?: string
  people?: string[]
  sources?: string[]
  locations?: string[]
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  sortBy?: 'date' | 'title' | 'source'
  sortOrder?: 'asc' | 'desc'
}
```

### Articles API

```typescript
GET / api / articles;
GET / api / articles / [slug];
GET / api / unique - values;
```

## 🏗️ Architecture Decisions

- **App Router**: Next.js 15's stable App Router for better performance
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS 4**: Rapid, consistent styling with custom design system
- **shadcn/ui**: Accessible, customizable UI components
- **Server Components**: Better performance with React Server Components
- **Static Generation**: Using SSG where possible for optimal performance

## 🧪 Development

### Component Development

```tsx
import { Button } from "@/components/ui/button"
import { ArticleCard } from "@/components/article-card"

// Use pre-built components
<Button variant="vintage">Browse Archive</Button>
<ArticleCard article={article} variant="featured" />
```

### Data Fetching

```typescript
import { getAllArticles, searchArticles } from "@/lib/articles";

// Server component
const articles = await getAllArticles();

// With filters
const filtered = await searchArticles({
  query: "athletics",
  people: ["Saroop Singh"],
  dateFrom: "1936-01-01",
});
```

## 🤝 Contributing

1. Follow existing code style
2. Run `npm run lint` and `npm run type-check`
3. Use conventional commit messages
4. Ensure responsive design works
5. Test on multiple browsers

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Historical content from Malaysian newspapers (1936-1957)
- Built with Next.js, React, and Tailwind CSS
- UI components from shadcn/ui
- Archive of Saroop Singh's athletic achievements

---

**Documentation**: [View Full Docs](./docs)
**Issues**: [Report Issues](https://github.com/your-repo/issues)
**Live Demo**: Coming Soon
