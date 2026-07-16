'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, ExternalLink, Images, Info, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useModalFocus } from '@/hooks/useModalFocus';
import { RestorationCompare } from '@/components/restoration-compare';
import { fetchAllPublicGallery } from '@/lib/fetch-public-gallery';

type GalleryRestoration = {
  id: string;
  type: string;
  url: string;
  provider: string;
  model: string;
  recipe: string;
  interventionClass: string;
  promptVersion: string;
  createdAt: string;
  reviewedAt: string | null;
  outputSha256: string | null;
};

type GalleryAsset = {
  id: string;
  label: string;
  url: string;
  kind: 'source' | 'generation';
} & Partial<Omit<GalleryRestoration, 'id' | 'type' | 'url'>>;

interface GalleryItem {
  id: string;
  title: string;
  date?: string;
  familyMember?: string;
  tags: string[];
  originalUrl: string;
  restorations: GalleryRestoration[];
  original: { filename: string; mimeType: string; bytes: number; sha256?: string | null };
  sourceProvenance: string;
  restorationCount: number;
}

function labelGeneration(restoration: GalleryRestoration, index: number) {
  return restoration.type || `AI study ${index + 1}`;
}

function sourceAsset(item: GalleryItem): GalleryAsset {
  return {
    id: `source-${item.id}`,
    label: 'Preserved source',
    url: item.originalUrl,
    kind: 'source',
  };
}

function generationAsset(restoration: GalleryRestoration, index: number): GalleryAsset {
  return {
    ...restoration,
    label: labelGeneration(restoration, index),
    kind: 'generation',
  };
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<GalleryAsset | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const closeViewer = useCallback(() => { setSelected(null); setSelectedAsset(null); setShowComparison(false); }, []);
  const viewerRef = useModalFocus<HTMLDivElement>(Boolean(selected), closeViewer);

  const requestGallery = useCallback(() => fetchAllPublicGallery<GalleryItem>(), []);
  const loadGallery = useCallback(() => {
    setLoading(true);
    setError(false);
    requestGallery()
      .then((result) => { setItems(result.items); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [requestGallery]);

  useEffect(() => {
    let active = true;
    requestGallery()
      .then((result) => { if (active) { setItems(result.items); } })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestGallery]);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter(item =>
      [item.title, item.familyMember, ...item.tags]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(term))
    );
  }, [items, query]);

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-neutral-900">
      <section className="border-b border-amber-900/10 bg-[#1f2a24] text-[#f7f0df]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Photographic collection</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-tight sm:text-7xl">Family memory, carefully distinguished from historical evidence.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
            Best-available source files from the recovered collection. Some are family-photo scans; others are newspaper crops or screenshots. AI outputs are separate, optional comparisons and never replace a source.
          </p>
          <Link href="/methodology" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-amber-300 underline decoration-amber-300/40 underline-offset-4">What “source” means—and what physical originals are still missing</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <label className="relative block max-w-xl">
          <span className="sr-only">Search photographs</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search photographs, people, or tags"
            className="w-full rounded-xl border border-amber-900/15 bg-white py-3.5 pl-12 pr-4 text-base shadow-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
          />
        </label>

        {loading && <p className="py-20 text-center text-neutral-500">Loading the collection…</p>}
        {error && <div role="alert" className="my-12 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"><p>The photographic catalogue could not be loaded.</p><button type="button" onClick={loadGallery} className="mt-3 min-h-11 rounded-full bg-red-900 px-5 font-semibold text-white">Try again</button></div>}
        {!loading && !error && filtered.length === 0 && <p className="py-20 text-center text-neutral-500">No photographs match that search.</p>}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setSelected(item); setSelectedAsset(sourceAsset(item)); setShowComparison(false); }}
              className="group overflow-hidden rounded-2xl border border-amber-900/10 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-700"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                <Image src={item.originalUrl} alt={item.title} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="p-5">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.14em] text-emerald-800"><ShieldCheck className="h-4 w-4" /> Preserved source{item.restorationCount > 0 ? ` + ${item.restorationCount} ${item.restorationCount === 1 ? 'approved study' : 'approved studies'}` : ''}</p>
                <p className="font-serif text-xl leading-snug">{item.title}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-neutral-500">
                  <span>{item.familyMember || 'Family collection'}</span>
                  <span>{item.restorationCount ? `${item.restorationCount} ${item.restorationCount === 1 ? 'study' : 'studies'}` : 'Source only'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 sm:p-8" role="dialog" aria-modal="true" aria-label={selected.title} onClick={closeViewer}>
          <div ref={viewerRef} className="relative grid h-screen h-[100dvh] min-h-0 w-full grid-rows-[minmax(20rem,56dvh)_minmax(0,1fr)] overflow-hidden bg-[#f6f1e8] shadow-2xl sm:h-[min(92dvh,56rem)] sm:max-w-6xl sm:rounded-2xl lg:grid-cols-[1.35fr_0.65fr] lg:grid-rows-1" onClick={event => event.stopPropagation()}>
            <button type="button" onClick={closeViewer} aria-label="Close photograph" className="absolute right-[max(.75rem,env(safe-area-inset-right))] top-[max(.75rem,env(safe-area-inset-top))] z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-white shadow-lg ring-1 ring-white/20 hover:bg-black focus:outline-none focus:ring-4 focus:ring-amber-300">
              <X className="h-5 w-5" />
            </button>
            <div className={`relative min-h-0 overflow-hidden bg-neutral-950 ${showComparison ? 'flex items-center overflow-y-auto p-3 sm:p-5' : ''}`}>
              {showComparison && selectedAsset?.kind === 'generation' && selectedAsset.url ? <><RestorationCompare originalUrl={selected.originalUrl} studyUrl={selectedAsset.url} title={selected.title} studyLabel={selectedAsset.label} className="mx-auto w-full max-w-4xl text-white" /><button type="button" onClick={() => setShowComparison(false)} className="absolute bottom-4 right-4 min-h-11 rounded-full bg-white px-4 text-sm font-semibold text-[#17241d] shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300">Back to featured study</button></> : <><Image src={selectedAsset?.url || selected.originalUrl} alt={`${selected.title} — ${selectedAsset?.label || 'preserved source'}`} fill unoptimized sizes="(max-width: 1024px) 100vw, 70vw" className="object-contain p-2 sm:p-4" /><span className={`absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] ${selectedAsset?.kind === 'generation' ? 'bg-amber-300 text-[#17241d]' : 'bg-emerald-950/90 text-white'}`}>{selectedAsset?.kind === 'generation' ? selectedAsset.label : 'Fit to screen · complete source'}</span></>}
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain p-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:p-10">
              <Images className="h-7 w-7 text-amber-800" />
              <h2 className="mt-5 font-serif text-3xl leading-tight">{selected.title}</h2>
              <p className="mt-4 leading-7 text-neutral-600">{selected.familyMember || 'Saroop Singh family collection'}</p>
              <p className="mt-2 text-sm text-neutral-500">{selected.restorationCount ? `${selected.restorationCount} human-approved restoration study is available for comparison.` : 'No restoration study is public for this source.'}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <a href={selected.originalUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-900/20 bg-white px-3 text-sm font-semibold"><ExternalLink className="h-4 w-4" /> Open source</a>
                <a href={selected.originalUrl} download={selected.original.filename} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1f2a24] px-3 text-sm font-semibold text-white"><Download className="h-4 w-4" /> Download source</a>
              </div>
              <Link href={`/gallery/${selected.id}`} className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-bold text-[#17241d]">Open full collection story</Link>
              <div className="mt-3 rounded-xl border border-emerald-900/10 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"><p className="font-semibold">File fixity recorded with SHA-256</p>{selected.original.sha256 && <p className="mt-1 break-all font-mono text-[10px] text-emerald-900/75">{selected.original.sha256}</p>}<p className="mt-1">{selected.original.filename} · {(selected.original.bytes / 1024).toFixed(0)} KB</p></div>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-900">Feature an image, then compare</p>
                <div role="list" aria-label="Source and approved AI studies" className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
                  {[sourceAsset(selected), ...selected.restorations.map(generationAsset)].map(asset => {
                    const active = selectedAsset?.id === asset.id;
                    return <div key={asset.id} role="listitem" className="w-32 shrink-0 snap-start"><button type="button" aria-pressed={active} onClick={() => { setSelectedAsset(asset); setShowComparison(false); }} className={`w-full overflow-hidden rounded-2xl border-2 text-left transition focus:outline-none focus:ring-4 focus:ring-amber-300 ${active ? 'border-amber-700 bg-amber-50' : 'border-amber-900/15 bg-white hover:border-amber-700/50'}`}><span className="relative block aspect-[4/3] bg-stone-200"><Image src={asset.url} alt="" fill unoptimized sizes="128px" className="object-cover" /></span><span className="block p-2"><span className="block truncate text-xs font-bold">{asset.label}</span><span className="mt-1 block truncate text-[10px] text-neutral-500">{asset.kind === 'source' ? 'Original authority' : asset.model || 'AI study'}</span></span></button></div>;
                  })}
                </div>
                <p className="mt-3 rounded-xl bg-amber-100/70 p-3 text-xs leading-5 text-amber-950"><strong>{selectedAsset?.label || 'Preserved source'}:</strong> The best available source file may itself be a scan, screenshot, or crop. Every other option is a labelled derivative and must not replace it.</p>
              </div>
              {selectedAsset?.kind === 'generation' && (
                <div className="mt-4 rounded-2xl border border-amber-900/10 bg-white p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-amber-950"><Sparkles className="h-4 w-4" /> AI study provenance</p>
                  <button type="button" onClick={() => setShowComparison(true)} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1f2a24] px-4 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-amber-300">Compare this study to the source</button>
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><div><dt className="text-neutral-500">Model</dt><dd className="mt-1 font-semibold">{selectedAsset.model}</dd></div><div><dt className="text-neutral-500">Provider</dt><dd className="mt-1 font-semibold">{selectedAsset.provider}</dd></div><div><dt className="text-neutral-500">Restoration intent</dt><dd className="mt-1 font-semibold">{selectedAsset.label}</dd></div><div><dt className="text-neutral-500">Prompt version</dt><dd className="mt-1 font-semibold">{selectedAsset.promptVersion}</dd></div><div><dt className="text-neutral-500">Intervention class</dt><dd className="mt-1 font-semibold">{selectedAsset.interventionClass}</dd></div><div><dt className="text-neutral-500">Human review</dt><dd className="mt-1 font-semibold">{selectedAsset.reviewedAt ? new Date(selectedAsset.reviewedAt).toLocaleDateString() : 'Approved before publication'}</dd></div></dl>
                  {selectedAsset.outputSha256 && <p className="mt-3 break-all font-mono text-[10px] text-neutral-500">Output SHA-256 {selectedAsset.outputSha256}</p>}
                  <p className="mt-3 flex gap-2 rounded-xl bg-stone-100 p-3 text-xs leading-5 text-neutral-600"><Info className="h-4 w-4 shrink-0" /> Exact prompts remain in the private preservation record because they can include family notes. The model, provider, intent, prompt version and review are shown here.</p>
                </div>
              )}
              <div className="mt-7 flex flex-wrap gap-2">
                {selected.tags.map(tag => <span key={tag} className="rounded-full bg-amber-900/8 px-3 py-1.5 text-xs font-medium text-amber-950">{tag}</span>)}
              </div>
              <p className="mt-8 border-t border-amber-900/15 pt-6 text-sm leading-6 text-neutral-500">This viewer begins with the preserved source image. Only a curator-approved derivative can appear beside it, and no derivative replaces the source.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
