# Saroop Singh Archive - Historical CMS Reference

> **Do not use this as an operational guide.** Use
> [CONTRIBUTING.md](../CONTRIBUTING.md) for current work. The only active
> published-content directory is
> `packages/web/content/articles/published/`, and the CI command is
> `npm run validate:content` from `packages/web`. The `shared/data` layout
> described below is retained only as historical migration reference and must
> not be used for new contributions.

## Overview

The Saroop Singh Archive uses a **markdown-based Content Management System (CMS)** that provides version control, simplicity, and developer-friendly content management. This guide explains how to manage content effectively.

## CMS Architecture

### File-based Structure
```
shared/data/
├── articles/           # Article markdown files
│   ├── 1936-07-18_straits-times_athletic-results-saroop-singh.md
│   ├── 1937-02-01_unknown-newspaper_selangor-harriers-compete-ipoh-saroop-singh.md
│   └── ...            # 38 total articles
└── metadata/          # Additional metadata (optional)
    ├── people.json    # People mentioned in articles
    ├── publications.json # Newspaper sources
    └── locations.json # Geographic locations
```

### Content Loading Process
1. **Build Time**: All markdown files are read and parsed
2. **Static Generation**: Articles converted to static HTML pages
3. **Runtime**: Server Components serve pre-rendered content
4. **Revalidation**: ISR updates content without full rebuilds

## Article Schema

Each article follows a standardized frontmatter schema:

```yaml
---
title: "Article Title Here"
date: "1936-07-18"                    # ISO date format
date_text: "18 July 1936"             # Human-readable date
source: "straits-times"               # Publication identifier
publication: "The Straits Times"      # Full publication name
page: "12"                            # Page number (optional)
location: "Kuala Lumpur"              # Geographic location
people: ["Saroop Singh"]              # People mentioned
events: ["Selangor Athletic Championships"] # Events covered
category: "athletics"                 # Article category
tags: ["running", "record", "half-mile"] # Content tags
image: "/images/articles/1936-07-18_straits-times_athletic-results-saroop-singh.jpg" # Image path
---

Article content goes here in markdown format.
This supports **bold text**, *italic text*, and other markdown features.

## Results
- Saroop Singh won the half-mile race
- New state record set: 2:05.2
- Excellent performance in challenging conditions
```

## Content Management Workflows

### Adding New Articles

1. **Prepare the Article**
   ```bash
   # Create new file with proper naming convention
   YYYY-MM-DD_publication_descriptive-title.md
   ```

2. **Add Frontmatter**
   - Copy schema from existing article
   - Update all fields appropriately
   - Ensure dates are in correct format
   - Verify image paths exist

3. **Write Content**
   - Use markdown formatting
   - Include relevant details
   - Structure with headings if lengthy
   - Add lists for results/achievements

4. **Validate and Commit**
   ```bash
   # Test locally first
   npm run dev
   # Commit changes
   git add shared/data/articles/new-article.md
   git commit -m "Add article: descriptive title"
   git push
   ```

### Editing Existing Articles

1. **Locate the File**
   ```bash
   # Find articles by pattern
   find shared/data/articles -name "*keyword*"
   ```

2. **Edit Content**
   - Maintain frontmatter schema
   - Update content as needed
   - Preserve existing structure

3. **Deploy Changes**
   - Commit and push changes
   - Trigger revalidation if needed

### Content Organization

#### Naming Conventions
- **Format**: `YYYY-MM-DD_publication_descriptive-slug.md`
- **Date**: Always use ISO format (YYYY-MM-DD)
- **Publication**: Use consistent short identifiers
- **Slug**: Descriptive, SEO-friendly, kebab-case

#### Categories
- `athletics` - Running, field events
- `sports` - General sports coverage
- `profile` - Personal profiles/interviews
- `results` - Competition results
- `photo` - Photo-centric articles

#### Tags
Use consistent, descriptive tags:
- Events: `half-mile`, `mile`, `cross-country`
- Achievements: `record`, `championship`, `victory`
- Locations: `selangor`, `singapore`, `ipoh`
- Context: `training`, `competition`, `profile`

## Image Management

### Image Storage
```
packages/web/public/images/
├── articles/          # Article images
│   ├── 1936-07-18_straits-times_athletic-results-saroop-singh.jpg
│   └── ...
├── restorations/      # Enhanced/restored images
└── originals/         # Original scanned images
```

### Image Guidelines
- **Format**: JPEG for photographs, PNG for graphics
- **Naming**: Match article filename
- **Size**: Optimize for web (typically 800-1200px wide)
- **Alt Text**: Descriptive titles in frontmatter

### Adding Images
1. **Optimize Image**
   ```bash
   # Resize and optimize
   convert input.jpg -resize 1000x -quality 85 optimized.jpg
   ```

2. **Place in Correct Directory**
   ```
   packages/web/public/images/articles/filename.jpg
   ```

3. **Reference in Article**
   ```yaml
   image: "/images/articles/filename.jpg"
   ```

## Content Validation

### Automated Checks
The system validates:
- Frontmatter schema compliance
- Required fields presence
- Date format consistency
- Image path existence

### Manual Review Checklist
- [ ] Accurate historical dates
- [ ] Correct publication names
- [ ] Proper people/location tags
- [ ] Image quality and relevance
- [ ] Content accuracy and completeness
- [ ] Consistent formatting

## Advanced Content Features

### Rich Content Support
```markdown
## Event Results

| Position | Athlete | Time |
|----------|---------|------|
| 1st | Saroop Singh | 2:05.2 |
| 2nd | J. Abdullah | 2:07.1 |

> "This was an outstanding performance under challenging conditions."
> — Athletic Correspondent
```

### Cross-references
```markdown
See also: [Previous Record](../1936-07-18_straits-times_athletic-results-saroop-singh)
Related: Articles tagged with `half-mile`
```

### Metadata Enhancement
```yaml
# Enhanced frontmatter for special articles
featured: true              # Highlight on homepage
historical_significance: "First Malaysian to break 2:10 in half-mile"
weather_conditions: "Hot and humid"
attendance: "500 spectators"
```

## Search and Discovery

### SEO Optimization
- Descriptive titles and slugs
- Proper meta descriptions
- Structured data markup
- Clean URL structure

### Content Organization
- Chronological browsing
- Category filtering
- Tag-based discovery
- Publication-based grouping

## Backup and Version Control

### Git-based Versioning
- Every change is tracked
- Full revision history
- Easy rollback capability
- Collaborative editing support

### Content Backup
```bash
# Export all articles
tar -czf saroop-singh-archive-$(date +%Y%m%d).tar.gz shared/data/

# Sync to external storage
rsync -av shared/data/ backup-location/
```

## Performance Considerations

### Build-time Optimization
- All articles pre-processed during build
- Static HTML generation for fast serving
- Optimized image handling
- Efficient content indexing

### Runtime Performance
- Server Components for optimal loading
- ISR for content updates
- CDN-friendly static assets
- Minimal client-side processing

## Content Migration

### From Other Systems
```javascript
// Example migration script
const articles = require('./legacy-articles.json');

articles.forEach(article => {
  const markdown = convertToMarkdown(article);
  const filename = generateFilename(article.date, article.source, article.title);
  fs.writeFileSync(`shared/data/articles/${filename}.md`, markdown);
});
```

### Bulk Operations
```bash
# Rename files with pattern
for file in *.md; do 
  mv "$file" "${file/old-pattern/new-pattern}"
done

# Update frontmatter across files
sed -i 's/old_field: /new_field: /g' *.md
```

## Troubleshooting

### Common Issues

1. **Article Not Appearing**
   - Check file naming convention
   - Verify frontmatter syntax
   - Ensure file is in correct directory

2. **Image Not Loading**
   - Verify image path in frontmatter
   - Check file exists in public directory
   - Confirm image format is supported

3. **Build Failures**
   - Validate markdown syntax
   - Check all required frontmatter fields
   - Verify no special characters in filenames

### Debug Commands
```bash
# Validate all articles
npm run validate-articles

# Check for missing images
npm run check-images

# Lint markdown files
npm run lint-markdown
```

## Best Practices

### Content Quality
- Accurate historical information
- Consistent terminology
- Proper attribution
- Regular content review

### Technical Standards
- Follow naming conventions
- Maintain schema compliance
- Optimize images appropriately
- Test changes locally first

### Collaborative Workflow
- Use descriptive commit messages
- Review changes before publishing
- Maintain content style guide
- Document significant changes

This CMS approach provides the benefits of modern content management while maintaining simplicity, version control, and developer-friendly workflows.
