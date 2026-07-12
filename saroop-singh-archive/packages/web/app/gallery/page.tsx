'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, ExternalLink, Images, Search, ShieldCheck, X } from 'lucide-react';
import { useModalFocus } from '@/hooks/useModalFocus';
import { RestorationCompare } from '@/components/restoration-compare';
import { fetchAllPublicGallery } from '@/lib/fetch-public-gallery';

interface GalleryItem {
  id: string;
  title: string;
  date?: string;
  familyMember?: string;
  tags: string[];
  thumbnailUrl: string;
  originalUrl: string;
  restorations: Array<{ id: string; type?: string; url: string }>;
  source?: { filename: string; mimeType: string; bytes: number; sha256: string; provenanceStatus: string };
  restorationCount: number;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<{ label: string; url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const closeViewer = useCallback(() => { setSelected(null); setSelectedAsset(null); }, []);
  const viewerRef = useModalFocus<HTMLDivElement>(Boolean(selected), closeViewer);

  const requestGallery = useCallback(() => fetchAllPublicGallery<GalleryItem>(), []);
  const loadGallery = useCallback(() => {
    setLoading(true);
    setError(false);
    requestGallery()
      .then((result) => { setItems(result.items); setDegraded(result.degraded); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [requestGallery]);

  useEffect(() => {
    let active = true;
    requestGallery()
      .then((result) => { if (active) { setItems(result.items); setDegraded(result.degraded); } })
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
        {degraded && !error && <div role="status" className="my-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950"><strong>Part of the family catalogue is temporarily unavailable.</strong><p className="mt-1 text-sm">The recovered built-in collection remains visible; recently published family photographs will return when the archive database reconnects.</p></div>}
        {!loading && !error && filtered.length === 0 && <p className="py-20 text-center text-neutral-500">No photographs match that search.</p>}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setSelected(item); setSelectedAsset({ label: 'Source', url: item.originalUrl || item.thumbnailUrl }); }}
              className="group overflow-hidden rounded-2xl border border-amber-900/10 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-700"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                <Image src={item.thumbnailUrl} alt={item.title} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="p-5">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.14em] text-emerald-800"><ShieldCheck className="h-4 w-4" /> Preserved source{item.restorationCount > 0 ? ` + ${item.restorationCount} ${item.source ? 'legacy AI experiments' : item.restorationCount === 1 ? 'approved study' : 'approved studies'}` : ''}</p>
                <p className="font-serif text-xl leading-snug">{item.title}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-neutral-500">
                  <span>{item.familyMember || 'Family collection'}</span>
                  <span>{item.restorationCount ? `${item.restorationCount} ${item.source ? 'experiments' : 'studies'}` : 'Source only'}</span>
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
            <div className={`relative min-h-0 overflow-hidden bg-neutral-950 ${selectedAsset?.label !== 'Source' ? 'flex items-center overflow-y-auto p-3 sm:p-5' : ''}`}>
              {selectedAsset?.label !== 'Source' && selectedAsset?.url ? <RestorationCompare originalUrl={selected.originalUrl} studyUrl={selectedAsset.url} title={selected.title} studyLabel={selectedAsset.label} className="mx-auto w-full max-w-4xl text-white" /> : <><Image src={selected.originalUrl || selected.thumbnailUrl} alt={`${selected.title} — best available source`} fill unoptimized sizes="(max-width: 1024px) 100vw, 70vw" className="object-contain p-2 sm:p-4" /><span className="absolute bottom-3 left-3 rounded-full bg-emerald-950/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-white">Fit to screen · complete source</span></>}
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain p-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:p-10">
              <Images className="h-7 w-7 text-amber-800" />
              <h2 className="mt-5 font-serif text-3xl leading-tight">{selected.title}</h2>
              <p className="mt-4 leading-7 text-neutral-600">{selected.familyMember || 'Saroop Singh family collection'}</p>
              <p className="mt-2 text-sm text-neutral-500">{selected.source ? `${selected.restorationCount} speculative legacy AI experiments are retained for audit; their likeness and scene details are unreliable.` : selected.restorationCount ? `${selected.restorationCount} human-approved restoration study is available for comparison.` : 'No restoration study is public for this source.'}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <a href={selected.originalUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-900/20 bg-white px-3 text-sm font-semibold"><ExternalLink className="h-4 w-4" /> Open source</a>
                <a href={selected.originalUrl} download={selected.source?.filename || true} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1f2a24] px-3 text-sm font-semibold text-white"><Download className="h-4 w-4" /> Download source</a>
              </div>
              <Link href={`/gallery/${selected.id}`} className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-bold text-[#17241d]">Open full collection story</Link>
              {selected.source && <div className="mt-3 rounded-xl border border-emerald-900/10 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"><p className="font-semibold">File fixity recorded with SHA-256</p><p className="mt-1 break-all font-mono text-[10px] text-emerald-900/75">{selected.source.sha256}</p><p className="mt-1">{selected.source.filename} · {(selected.source.bytes / 1024).toFixed(0)} KB</p></div>}
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-900">View source and studies</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" aria-pressed={selectedAsset?.label === 'Source'} onClick={() => setSelectedAsset({ label: 'Source', url: selected.originalUrl || selected.thumbnailUrl })} className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${selectedAsset?.label === 'Source' ? 'bg-[#1f2a24] text-white' : 'border border-amber-900/20 bg-white'}`}>Source</button>
                  {selected.restorations.map((restoration, index) => {
                    const label = restoration.type ? restoration.type.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase()) : `Study ${index + 1}`;
                    return <button key={restoration.id} type="button" aria-pressed={selectedAsset?.url === restoration.url} onClick={() => setSelectedAsset({ label, url: restoration.url })} className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${selectedAsset?.url === restoration.url ? 'bg-amber-800 text-white' : 'border border-amber-900/20 bg-white'}`}>{label}</button>;
                  })}
                </div>
                <p className="mt-3 rounded-xl bg-amber-100/70 p-3 text-xs leading-5 text-amber-950"><strong>{selectedAsset?.label || 'Source'}:</strong> The best available source file may itself be a scan, screenshot, or crop. Every other option is a labelled derivative and must not replace it.</p>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {selected.tags.map(tag => <span key={tag} className="rounded-full bg-amber-900/8 px-3 py-1.5 text-xs font-medium text-amber-950">{tag}</span>)}
              </div>
              <p className="mt-8 border-t border-amber-900/15 pt-6 text-sm leading-6 text-neutral-500">This viewer begins with the preserved source image. Legacy AI experiments may change identity, clothing, text, or background and are not approved restorations; use them only to inspect what the earlier system produced.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
