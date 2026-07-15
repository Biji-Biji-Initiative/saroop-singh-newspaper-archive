import { NextRequest, NextResponse } from "next/server";
import { listPublicGalleryRecords } from "@/lib/public-gallery";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const requestedLimit = Number.parseInt(searchParams.get("limit") || "12", 10);
  const limit = Math.min(50, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 12));
  const familyMember = searchParams.get("family")?.trim().toLocaleLowerCase();
  const tag = searchParams.get("tag")?.trim();
  const sortBy = searchParams.get("sort") || "newest";

  const records = await listPublicGalleryRecords();
  const matching = records.filter(record => {
    if (tag && !record.tags.includes(tag)) return false;
    if (familyMember && !record.familyMember?.toLocaleLowerCase().includes(familyMember)) return false;
    return true;
  });
  matching.sort((left, right) => {
    if (sortBy === "oldest") return Date.parse(left.submittedAt) - Date.parse(right.submittedAt);
    if (sortBy === "title") return left.title.localeCompare(right.title);
    return Date.parse(right.submittedAt) - Date.parse(left.submittedAt);
  });

  const total = matching.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const items = matching.slice((page - 1) * limit, page * limit).map(record => ({
    id: record.id,
    title: record.title,
    date: record.date,
    familyMember: record.familyMember,
    tags: record.tags,
    submittedAt: record.submittedAt,
    originalUrl: record.originalImageUrl,
    original: record.original,
    sourceProvenance: record.sourceProvenance,
    restorations: record.studies,
    restorationCount: record.studies.length,
  }));

  return NextResponse.json({
    success: true,
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  });
}

export async function DELETE() {
  return NextResponse.json({ error: "The published archive is read-only." }, { status: 405 });
}
