# Saroop Singh Archive - Content Architecture Strategy

> **Historical planning snapshot.** Any Vercel cost or deployment references
> below were superseded by the Coolify cutover. Use
> [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for the supported production path.

## Recommended Directory Structure

```
saroop-singh-archive/
├── content/                    # All content lives here (new)
│   ├── articles/              # Markdown articles
│   │   ├── published/         # Live articles
│   │   ├── drafts/           # Work in progress
│   │   └── archived/         # Historical versions
│   ├── media/                # All media assets
│   │   ├── originals/        # Source images
│   │   │   ├── clippings/    # Newspaper clippings
│   │   │   └── photos/       # Original photographs
│   │   ├── processed/        # Optimized versions
│   │   │   ├── thumbnails/   # Auto-generated
│   │   │   ├── web/         # Web-optimized
│   │   │   └── print/       # High-res versions
│   │   └── restorations/     # AI-enhanced versions
│   │       ├── pending/      # Awaiting review
│   │       └── approved/     # Gallery-ready
│   ├── submissions/          # User submissions
│   │   ├── articles/         # Contributed articles
│   │   ├── photos/          # Contributed photos
│   │   └── corrections/     # Content corrections
│   └── metadata/            # Structured data
│       ├── people.json      # Person database
│       ├── events.json      # Event database
│       ├── publications.json # Publication sources
│       └── locations.json   # Location data
│
├── packages/
│   ├── web/                 # Public website
│   ├── admin/               # Admin interface (new)
│   ├── cms-api/            # CMS API layer (new)
│   └── workers/            # Background jobs (new)
│
└── infrastructure/          # Deployment configs
    ├── docker/
    ├── k8s/
    └── terraform/
```

## Content Types and Schemas

### 1. Article Schema (Enhanced)
```typescript
interface Article {
  // Metadata
  id: string                    // UUID
  slug: string                  // URL-friendly identifier
  version: number               // Version number
  status: 'draft' | 'review' | 'published' | 'archived'
  
  // Content
  title: string
  subtitle?: string
  content: string              // Markdown
  excerpt?: string            // Auto-generated or manual
  
  // Dates
  eventDate?: string          // When the event happened
  publicationDate?: string    // When originally published
  createdAt: string           // When added to archive
  updatedAt: string           // Last modification
  publishedAt?: string        // When made public
  
  // Source Information
  publication: {
    name: string
    slug: string
    issue?: string
    page?: number
    section?: string
  }
  
  // Relationships
  people: Person[]            // Linked person records
  events: Event[]            // Linked event records
  locations: Location[]      // Linked location records
  related: string[]         // Related article IDs
  
  // Media
  featuredImage?: MediaAsset
  images: MediaAsset[]
  documents: MediaAsset[]
  
  // Metadata
  category: Category
  tags: string[]
  keywords: string[]        // For SEO
  
  // Editorial
  author: string           // Who added it
  editor?: string         // Who reviewed it
  notes?: string         // Internal notes
  
  // Analytics
  views: number
  shares: number
}
```

### 2. Media Asset Schema
```typescript
interface MediaAsset {
  id: string
  type: 'image' | 'document' | 'video' | 'audio'
  status: 'processing' | 'ready' | 'error'
  
  // Files
  original: {
    url: string
    size: number
    format: string
    dimensions?: { width: number; height: number }
  }
  
  // Processed versions
  variants: {
    thumbnail?: string    // 150x150
    small?: string       // 400px wide
    medium?: string      // 800px wide
    large?: string       // 1600px wide
    webp?: string       // WebP format
    avif?: string       // AVIF format
  }
  
  // Restoration specific
  restorations?: {
    ai_enhanced?: string
    colorized?: string
    upscaled?: string
    denoised?: string
  }
  
  // Metadata
  title: string
  alt: string           // Accessibility
  caption?: string
  credit?: string
  copyright?: string
  license?: string
  
  // Technical
  hash: string         // For deduplication
  cdn_url?: string    // CDN URL if using CDN
  
  // Dates
  capturedAt?: string  // When photo was taken
  uploadedAt: string
  processedAt?: string
}
```

### 3. Submission Schema
```typescript
interface Submission {
  id: string
  type: 'article' | 'photo' | 'correction' | 'story'
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  
  // Submitter
  submitter: {
    name: string
    email: string
    phone?: string
    relationship?: string  // Relation to Saroop Singh
  }
  
  // Content
  title: string
  description: string
  content?: string        // For articles/stories
  files?: MediaAsset[]   // For photos/documents
  
  // Verification
  verification: {
    source?: string
    date?: string
    witnesses?: string[]
    documentation?: string
  }
  
  // Processing
  assignedTo?: string
  reviewNotes?: string
  rejectionReason?: string
  
  // Dates
  submittedAt: string
  reviewedAt?: string
  decidedAt?: string
}
```

## API Architecture

### RESTful Endpoints
```
# Public API
GET    /api/v1/articles
GET    /api/v1/articles/:slug
GET    /api/v1/gallery
GET    /api/v1/timeline
POST   /api/v1/submissions

# Admin API (Protected)
GET    /api/admin/articles
POST   /api/admin/articles
PUT    /api/admin/articles/:id
DELETE /api/admin/articles/:id
POST   /api/admin/articles/:id/publish
POST   /api/admin/articles/:id/unpublish

GET    /api/admin/media
POST   /api/admin/media/upload
DELETE /api/admin/media/:id
POST   /api/admin/media/:id/process

GET    /api/admin/submissions
PUT    /api/admin/submissions/:id/review
POST   /api/admin/submissions/:id/approve
POST   /api/admin/submissions/:id/reject
```

### GraphQL Alternative
```graphql
type Query {
  articles(
    status: ArticleStatus
    category: String
    tag: String
    search: String
    limit: Int
    offset: Int
  ): ArticleConnection!
  
  article(slug: String!): Article
  
  gallery(
    type: RestorationType
    limit: Int
    offset: Int
  ): GalleryConnection!
  
  timeline(
    startDate: Date
    endDate: Date
  ): [TimelineEvent!]!
}

type Mutation {
  submitArticle(input: ArticleSubmission!): Submission!
  submitPhoto(input: PhotoSubmission!): Submission!
  submitCorrection(input: CorrectionSubmission!): Submission!
}
```

## Technology Stack Recommendations

### Core Infrastructure
- **Database**: PostgreSQL with Prisma ORM
  - Structured data queries
  - Full-text search capabilities
  - JSON columns for flexible metadata
  
- **File Storage**: 
  - **Development**: Local filesystem
  - **Production**: S3-compatible storage (AWS S3, Cloudflare R2, or MinIO)
  
- **CDN**: Cloudflare or Fastly
  - Image optimization on-the-fly
  - Global distribution
  - Automatic format conversion (WebP/AVIF)

### Admin Interface Options

#### Option 1: Custom Next.js Admin (Recommended)
```typescript
// packages/admin/app/layout.tsx
import { AdminLayout } from '@/components/admin-layout'
import { AuthProvider } from '@/providers/auth'

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AuthProvider>
  )
}
```

**Pros:**
- Full control over UI/UX
- Seamless integration with existing codebase
- Shared components with main site

**Cons:**
- More development time
- Need to build all admin features

#### Option 2: Strapi Headless CMS
```javascript
// strapi/config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST'),
      port: env.int('DATABASE_PORT'),
      database: env('DATABASE_NAME'),
      user: env('DATABASE_USERNAME'),
      password: env('DATABASE_PASSWORD'),
    },
  },
});
```

**Pros:**
- Ready-made admin interface
- Plugin ecosystem
- Built-in user management

**Cons:**
- Another system to maintain
- Less flexibility
- Potential sync issues with Git

#### Option 3: Keystatic (Git-based CMS)
```typescript
// keystatic.config.tsx
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'your-org/saroop-singh-archive',
  },
  collections: {
    articles: collection({
      label: 'Articles',
      path: 'content/articles/*',
      schema: {
        title: fields.text({ label: 'Title' }),
        date: fields.date({ label: 'Date' }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          images: true,
        }),
      },
    }),
  },
});
```

**Pros:**
- Git-based (maintains version control)
- Visual editor for markdown
- No database required

**Cons:**
- Limited to file-based content
- Less suitable for complex workflows

### Forms and Submissions

#### Public Submission Form Component
```typescript
// packages/web/components/submission-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const submissionSchema = z.object({
  type: z.enum(['article', 'photo', 'correction']),
  name: z.string().min(2),
  email: z.string().email(),
  title: z.string().min(5),
  description: z.string().min(20),
  files: z.array(z.instanceof(File)).optional(),
  verification: z.object({
    source: z.string().optional(),
    date: z.string().optional(),
  }),
})

export function SubmissionForm() {
  const form = useForm({
    resolver: zodResolver(submissionSchema),
  })
  
  async function onSubmit(data) {
    const formData = new FormData()
    // Process submission
    await fetch('/api/submissions', {
      method: 'POST',
      body: formData,
    })
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### Background Jobs & Processing

#### Worker Package Structure
```typescript
// packages/workers/src/jobs/image-processor.ts
import sharp from 'sharp'
import { uploadToS3 } from '@/lib/s3'

export async function processImage(jobData: {
  imageId: string
  filePath: string
}) {
  const variants = {
    thumbnail: await sharp(jobData.filePath)
      .resize(150, 150)
      .toBuffer(),
    small: await sharp(jobData.filePath)
      .resize(400)
      .toBuffer(),
    medium: await sharp(jobData.filePath)
      .resize(800)
      .toBuffer(),
    large: await sharp(jobData.filePath)
      .resize(1600)
      .toBuffer(),
  }
  
  // Upload to CDN
  for (const [size, buffer] of Object.entries(variants)) {
    await uploadToS3({
      key: `processed/${jobData.imageId}/${size}.jpg`,
      body: buffer,
    })
  }
}
```

## Migration Strategy

### Phase 1: Infrastructure Setup (Week 1-2)
1. Set up PostgreSQL database
2. Create Prisma schema
3. Set up S3/R2 storage
4. Configure CDN

### Phase 2: Data Migration (Week 3-4)
1. Write migration scripts for existing content
2. Import articles to database (maintain markdown files)
3. Process and upload images to CDN
4. Set up redirects for old URLs

### Phase 3: Admin Interface (Week 5-8)
1. Build authentication system
2. Create article management interface
3. Build media library
4. Implement submission review system

### Phase 4: Public Features (Week 9-10)
1. Add submission forms
2. Implement advanced search
3. Add user accounts (optional)
4. Set up email notifications

### Phase 5: Testing & Launch (Week 11-12)
1. Content audit
2. Performance testing
3. Security audit
4. Gradual rollout

## Performance Considerations

### Image Optimization Pipeline
```typescript
// packages/cms-api/lib/image-pipeline.ts
export class ImagePipeline {
  async process(file: File) {
    // 1. Generate hash for deduplication
    const hash = await generateHash(file)
    
    // 2. Check if already processed
    const existing = await db.media.findUnique({
      where: { hash }
    })
    if (existing) return existing
    
    // 3. Upload original to S3
    const originalUrl = await uploadOriginal(file)
    
    // 4. Queue processing job
    await queue.add('process-image', {
      url: originalUrl,
      variants: ['thumbnail', 'small', 'medium', 'large'],
      formats: ['webp', 'avif'],
    })
    
    // 5. Return immediately (processing happens async)
    return { id, status: 'processing' }
  }
}
```

### Caching Strategy
```typescript
// next.config.js
module.exports = {
  staticPageGenerationTimeout: 120,
  images: {
    domains: ['cdn.saroopsingharchive.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // ISR for dynamic content
  async headers() {
    return [
      {
        source: '/api/articles',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=3600',
          },
        ],
      },
    ]
  },
}
```

## Security Considerations

### Authentication & Authorization
```typescript
// packages/admin/middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Check user role
      if (req.nextUrl.pathname.startsWith('/admin')) {
        return token?.role === 'admin' || token?.role === 'editor'
      }
      return true
    },
  },
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

### Input Validation
```typescript
// packages/cms-api/validators/article.ts
import { z } from 'zod'

export const articleSchema = z.object({
  title: z.string()
    .min(5, 'Title too short')
    .max(200, 'Title too long'),
  content: z.string()
    .min(100, 'Content too short')
    .max(50000, 'Content too long'),
  publication: z.object({
    name: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  // Sanitize HTML in markdown
  sanitizedContent: z.string().transform(val => 
    sanitizeHtml(val, { allowedTags: [] })
  ),
})
```

## Monitoring & Analytics

### Content Analytics
```typescript
// packages/web/lib/analytics.ts
export async function trackArticleView(slug: string) {
  // Increment view counter
  await db.article.update({
    where: { slug },
    data: { views: { increment: 1 } },
  })
  
  // Send to analytics service
  await analytics.track('article_view', {
    slug,
    timestamp: new Date(),
    referrer: document.referrer,
  })
}
```

### Error Monitoring
```typescript
// packages/web/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
})
```

## Backup & Disaster Recovery

### Automated Backups
```yaml
# .github/workflows/backup.yml
name: Daily Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        run: |
          pg_dump $DATABASE_URL > backup.sql
          aws s3 cp backup.sql s3://backups/$(date +%Y%m%d).sql
      
      - name: Backup Media
        run: |
          aws s3 sync s3://media s3://backups/media/$(date +%Y%m%d)/
```

### Recovery Plan
1. **Database**: Point-in-time recovery from PostgreSQL
2. **Media**: S3 versioning and cross-region replication
3. **Code**: Git repository with tagged releases
4. **Configuration**: Encrypted secrets in vault

## Cost Estimation

### Monthly Costs (Estimated)
- **Vercel**: $20 (Pro plan)
- **PostgreSQL** (Supabase): $25
- **S3/R2 Storage** (100GB): $15
- **CDN** (Cloudflare): $20
- **Domain**: $15/year
- **Total**: ~$80/month

### Alternative (Self-hosted)
- **VPS** (Hetzner/DigitalOcean): $20
- **Object Storage** (Backblaze B2): $10
- **CDN** (Cloudflare Free): $0
- **Total**: ~$30/month

## Implementation Timeline

### Month 1: Foundation
- Week 1-2: Database setup and schema design
- Week 3-4: Migration scripts and data import

### Month 2: Admin Interface
- Week 5-6: Authentication and basic CRUD
- Week 7-8: Media library and processing

### Month 3: Public Features
- Week 9-10: Submission forms and workflow
- Week 11-12: Testing and deployment

## Conclusion

This architecture provides:
1. **Scalability**: Can handle millions of articles and images
2. **Performance**: Sub-second page loads with CDN
3. **Maintainability**: Clear separation of concerns
4. **Flexibility**: Easy to add new content types
5. **Security**: Proper authentication and validation
6. **Cost-effective**: ~$80/month for professional setup

The hybrid approach maintains your excellent Git-based foundation while adding the features needed for a professional archive system.
