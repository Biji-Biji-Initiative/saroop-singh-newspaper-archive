import { NextRequest, NextResponse } from 'next/server';
import preservationManifest from '@/data/generated/preservation-manifest.json';
import { curateGalleryItem } from '@/lib/gallery-curation';

interface GalleryItem {
  id: string;
  title?: string;
  date?: string;
  submittedAt: string;
  isPublic: boolean;
  thumbnailUrl?: string;
  originalImageUrl?: string;
  restorations?: Array<{ id: string; type?: string; url: string; createdAt?: string }>;
  metadata?: {
    title?: string;
    date?: string;
    familyMember?: string;
    tags?: string[];
    isPublic?: boolean;
  };
}

const galleryFiles = import.meta.glob('../../../data/gallery/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, GalleryItem | { items: GalleryItem[] }>;

const galleryIndex = galleryFiles['../../../data/gallery/index.json'] as { items: GalleryItem[] };
const detailedItems = new Map(
  Object.entries(galleryFiles)
    .filter(([file]) => !file.endsWith('/index.json'))
    .map(([, item]) => [(item as GalleryItem).id, item as GalleryItem])
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const parsedLimit = parseInt(searchParams.get('limit') || '12', 10);
  const limit = Math.min(50, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 12));
  const familyMember = searchParams.get('family');
  const tag = searchParams.get('tag');
  const sortBy = searchParams.get('sort') || 'newest';

  let items = (galleryIndex?.items || []).map(item => curateGalleryItem(detailedItems.get(item.id) || item));
  items = items.filter(item => {
    if (!(item.metadata?.isPublic ?? item.isPublic)) return false;
    if (familyMember && item.metadata?.familyMember !== familyMember) return false;
    if (tag && !item.metadata?.tags?.includes(tag)) return false;
    return true;
  });

  items.sort((a, b) => {
    if (sortBy === 'oldest') return Date.parse(a.submittedAt) - Date.parse(b.submittedAt);
    if (sortBy === 'title') return (a.metadata?.title || a.title || '').localeCompare(b.metadata?.title || b.title || '');
    return Date.parse(b.submittedAt) - Date.parse(a.submittedAt);
  });

  let studioItems: Array<{ id: string; title: string; date?: string; familyMember?: string; tags: string[]; isPublic: boolean; submittedAt: string; thumbnailUrl: string; originalUrl: string; restorations: Array<{ id: string; type: string; url: string }>; restorationCount: number }> = [];
  let degraded = false;
  try {
    const [{ desc, eq }, { getDb }, { archiveImages, restorationRuns }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const published = await getDb().select().from(archiveImages).where(eq(archiveImages.status, 'published')).orderBy(desc(archiveImages.publishedAt));
    const runs = await getDb().select().from(restorationRuns);
    studioItems = published.map(image => ({
      id: image.id,
      title: image.title,
      date: image.estimatedDate || undefined,
      familyMember: image.people || 'Saroop Singh family collection',
      tags: JSON.parse(image.tags),
      isPublic: true,
      submittedAt: image.publishedAt || image.createdAt,
      thumbnailUrl: `/api/media/${encodeURIComponent(image.originalKey)}`,
      originalUrl: `/api/media/${encodeURIComponent(image.originalKey)}`,
      restorations: runs.filter(run => run.imageId === image.id && run.status === 'ready' && run.reviewStatus === 'approved' && run.outputKey === image.publishedKey).map(run => ({ id: run.id, type: run.recipe, url: `/api/media/${encodeURIComponent(run.outputKey!)}` })),
      restorationCount: runs.filter(run => run.imageId === image.id && run.status === 'ready' && run.reviewStatus === 'approved' && run.outputKey === image.publishedKey).length,
    }));
  } catch {
    degraded = true;
    // The built-in collection remains visible, but callers are told that
    // database-backed family publications may be missing.
  }

  const staticItems = items.map(item => ({
    id: item.id,
    title: item.metadata?.title || item.title || 'Untitled',
    date: item.metadata?.date || item.date,
    familyMember: item.metadata?.familyMember,
    tags: item.metadata?.tags || [],
    isPublic: item.metadata?.isPublic ?? item.isPublic,
    submittedAt: item.submittedAt,
    thumbnailUrl: item.thumbnailUrl || '',
    originalUrl: item.originalImageUrl || item.thumbnailUrl || '',
    source: preservationManifest.collections.find(collection => collection.id === item.id)?.original,
    restorations: (item.restorations || []).map(restoration => ({ ...restoration, type: `Legacy AI experiment — ${restoration.type || 'unclassified'}; identity and detail are unverified` })),
    restorationCount: item.restorations?.length || 0,
  }));
  const combined = [...studioItems, ...staticItems];
  const total = combined.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedItems = combined.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    success: true,
    items: paginatedItems,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    degraded,
  });
}

export async function DELETE() {
  return NextResponse.json({ error: 'The published archive is read-only.' }, { status: 405 });
}
