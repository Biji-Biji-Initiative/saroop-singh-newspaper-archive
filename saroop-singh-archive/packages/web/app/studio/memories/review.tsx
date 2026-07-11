"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, FileQuestion, Loader2, LockKeyhole, Mic, UserRoundCheck, XCircle } from "lucide-react";
import { fetchAllPublicGallery } from "@/lib/fetch-public-gallery";
import { imageAnchorToFramePercent } from "@/lib/image-anchor";

type Memory = {
  id: string;
  kind: string;
  subjectId?: string;
  anchorX?: number | null;
  anchorY?: number | null;
  claimantName: string;
  claimantRelationship?: string;
  claimantContact?: string;
  proposedName?: string;
  certainty: string;
  story: string;
  howKnown: string;
  attribution: string;
  consentScope: string;
  status: string;
  createdAt: string;
  assetUrl?: string;
  assetType?: string;
  assetName?: string;
};

type GalleryItem = { id: string; title: string; originalUrl: string; thumbnailUrl: string };

async function fetchAllMemories() {
  const all: Memory[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const response = await fetch(`/api/studio/memories?limit=100&page=${page}`);
    if (!response.ok) throw new Error("Memory review is unavailable.");
    const data = await response.json() as { memories?: Memory[]; hasNextPage?: boolean };
    all.push(...(data.memories || []));
    if (!data.hasNextPage) return all;
  }
  throw new Error("The review queue exceeds the safe retrieval window.");
}

function SubjectEvidence({ item, source }: { item: Memory; source?: GalleryItem }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>();
  const marker = useMemo(() => {
    if (!dimensions || item.anchorX == null || item.anchorY == null) return null;
    return imageAnchorToFramePercent(
      { x: item.anchorX / 10000, y: item.anchorY / 10000 },
      4,
      3,
      dimensions.width,
      dimensions.height,
    );
  }, [dimensions, item.anchorX, item.anchorY]);
  if (!source) return item.subjectId ? <p className="rounded-xl bg-stone-100 p-3 text-xs">Linked record: {item.subjectId}</p> : null;
  return <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.14em] text-amber-800">Linked source · {source.title}</p><div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-950"><Image src={source.originalUrl || source.thumbnailUrl} alt={source.title} fill unoptimized sizes="(max-width:1024px) 100vw,40vw" className="object-contain" onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />{marker && <span aria-label="Submitted identification position" className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-amber-400/75 shadow-xl" style={{ left: `${marker.x}%`, top: `${marker.y}%` }} />}</div></div>;
}

export function MemoryReview() {
  const [items, setItems] = useState<Memory[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestAll = useCallback(() => Promise.all([fetchAllMemories(), fetchAllPublicGallery<GalleryItem>()]), []);
  const retry = useCallback(() => {
    setLoading(true); setError(false);
    requestAll().then(([memories, photos]) => { setItems(memories); setGallery(photos.items); }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [requestAll]);
  useEffect(() => {
    let active = true;
    requestAll().then(([memories, photos]) => { if (active) { setItems(memories); setGallery(photos.items); } }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestAll]);
  async function decide(id: string, status: string) {
    setBusy(id);
    try {
      const response = await fetch("/api/studio/memories", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (!response.ok) throw new Error("Decision failed");
      const [memories] = await requestAll(); setItems(memories);
    } catch { setError(true); }
    finally { setBusy(""); }
  }
  const sources = useMemo(() => new Map(gallery.map(item => [item.id, item])), [gallery]);
  return <main className="min-h-screen bg-[#f6f1e8] text-[#17241d]"><header className="bg-[#17241d] px-5 py-10 text-white sm:px-8"><div className="mx-auto max-w-6xl"><Link href="/studio" className="inline-flex min-h-11 items-center gap-2 text-sm text-stone-300"><ArrowLeft className="h-4 w-4" /> Preservation studio</Link><p className="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-amber-300"><LockKeyhole className="h-4 w-4" /> Private family evidence</p><h1 className="mt-4 font-serif text-6xl sm:text-7xl">Memory review</h1><p className="mt-5 max-w-2xl text-stone-300">Suggestions remain claims until reviewed. Approval records consent and provenance; it does not silently rewrite public metadata.</p></div></header><section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{error && <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900"><p>The private review queue could not be loaded or updated.</p><button type="button" onClick={retry} className="mt-3 min-h-11 rounded-full bg-red-900 px-5 font-semibold text-white">Try again</button></div>}{loading && <p className="py-20 text-center text-neutral-500">Loading every family memory…</p>}<div className="space-y-5">{!loading && items.map(item => <article key={item.id} className="rounded-3xl border border-amber-950/10 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-amber-800">{item.kind} · {item.certainty}</p><h2 className="mt-2 font-serif text-3xl">{item.proposedName || item.subjectId || "Family memory"}</h2></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">{item.status}</span></div><div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.8fr]"><div><p className="whitespace-pre-line leading-7 text-neutral-700">{item.story || "No additional story supplied."}</p>{item.howKnown && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm"><strong>How they know:</strong> {item.howKnown}</p>}<p className="mt-4 text-sm text-neutral-500">From {item.claimantName}{item.claimantRelationship ? ` · ${item.claimantRelationship}` : ""}{item.claimantContact ? ` · ${item.claimantContact}` : ""}</p><p className="mt-1 text-xs text-neutral-400">Attribution: {item.attribution} · Consent: {item.consentScope} · {new Date(item.createdAt).toLocaleString()}</p></div><div className="space-y-4"><SubjectEvidence item={item} source={item.subjectId ? sources.get(item.subjectId) : undefined} />{item.assetUrl && <div className="rounded-2xl bg-stone-100 p-4">{item.assetType?.startsWith("audio/") ? <><Mic className="h-6 w-6" /><audio src={item.assetUrl} controls className="mt-4 w-full" /></> : <><div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-950"><Image src={item.assetUrl} alt={item.assetName || "Private submitted source"} fill unoptimized sizes="(max-width:1024px) 100vw,40vw" className="object-contain" /></div><a href={item.assetUrl} className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-amber-900/20 bg-white text-sm font-semibold">Open private source · {item.assetName}</a></>}</div>}</div></div><div className="mt-6 grid gap-2 sm:grid-cols-5"><button onClick={() => decide(item.id, "corroborated")} disabled={busy === item.id} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-3 text-sm font-semibold text-white"><UserRoundCheck className="h-4 w-4" /> Corroborated</button><button onClick={() => decide(item.id, "clarify")} disabled={busy === item.id} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-200 px-3 text-sm font-semibold"><FileQuestion className="h-4 w-4" /> Clarify</button><button onClick={() => decide(item.id, "private")} disabled={busy === item.id} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold"><Check className="h-4 w-4" /> Keep private</button><button onClick={() => decide(item.id, "rejected")} disabled={busy === item.id} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-800"><XCircle className="h-4 w-4" /> Reject</button><button onClick={() => decide(item.id, "withdrawn")} disabled={busy === item.id} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-3 text-sm font-semibold text-white">{busy === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Withdrawn</button></div></article>)}{!loading && !error && !items.length && <p className="py-20 text-center text-neutral-500">No family memories have arrived yet.</p>}</div></section></main>;
}
