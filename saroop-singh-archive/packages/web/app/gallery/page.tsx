'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp, Columns2, Download, ExternalLink, Eye, EyeOff, Images, MessageCircleHeart, Search, ShieldCheck, Star, UserRoundPlus, X } from 'lucide-react';
import { FamilyStudyMaker, type FamilyStudy } from '@/components/family-study-maker';
import { useModalFocus } from '@/hooks/useModalFocus';
import { RestorationCompare } from '@/components/restoration-compare';
import { fetchAllPublicGallery } from '@/lib/fetch-public-gallery';

type GalleryRestoration = {
  id: string;
  type: string;
  url: string;
  provenance: 'recorded' | 'recovered-historical';
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
  workspaceOnly?: boolean;
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

function defaultViewerAsset(item: GalleryItem): GalleryAsset {
  const featuredVariation = item.restorations[0];
  return featuredVariation ? generationAsset(featuredVariation, 0) : sourceAsset(item);
}

function familyStudyAsset(study: FamilyStudy): GalleryAsset {
  if (!study.url) throw new Error('A ready family study must include its image URL.');
  return {
    id: study.id,
    label: `New · ${study.type}`,
    url: study.url,
    kind: 'generation',
    provenance: study.provenance,
    provider: study.provider,
    model: study.model,
    recipe: study.recipe,
    interventionClass: study.interventionClass,
    promptVersion: study.promptVersion || undefined,
    outputSha256: study.outputSha256,
    createdAt: study.createdAt,
    workspaceOnly: true,
  };
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<GalleryAsset | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [familyStudies, setFamilyStudies] = useState<Record<string, FamilyStudy>>({});
  const [curationError, setCurationError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const openedFromUrl = useRef(false);
  const closeViewer = useCallback(() => { setSelected(null); setSelectedAsset(null); setShowComparison(false); setFamilyStudies({}); setCurationError(''); }, []);
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
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        if (openedFromUrl.current) return;
        const imageId = new URLSearchParams(window.location.search).get('image');
        const image = imageId ? result.items.find(item => item.id === imageId) : undefined;
        if (!image) return;
        openedFromUrl.current = true;
        const initialAsset = defaultViewerAsset(image);
        setSelected(image);
        setSelectedAsset(initialAsset);
        setShowComparison(initialAsset.kind === 'generation');
      })
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

  useEffect(() => {
    if (!selected) return;
    let active = true;
    const abort = new AbortController();
    const start = window.setTimeout(() => {
      setFamilyStudies({});
      fetch(`/api/family/studies?image=${encodeURIComponent(selected.id)}`, { signal: abort.signal })
        .then(async response => ({ response, body: await response.json() as { data?: { studies?: FamilyStudy[] } } }))
        .then(({ response, body }) => {
          if (!active) return;
          if (!response.ok) return;
          const studies = body.data?.studies || [];
          setFamilyStudies(Object.fromEntries(studies.map(study => [study.id, study])));
        })
        .catch(() => { /* The maker reports a configured-workspace error only if creation is requested. */ });
    }, 0);
    return () => { active = false; abort.abort(); window.clearTimeout(start); };
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
  const carouselAssets = useMemo(() => {
    if (!selected) return [];
    const visibleRestorations = selected.restorations
      .filter(study => familyStudies[study.id]?.galleryVisibility !== 'hidden')
      .sort((left, right) => {
        const leftStudy = familyStudies[left.id];
        const rightStudy = familyStudies[right.id];
        return (leftStudy?.galleryRank ?? Number.MAX_SAFE_INTEGER) - (rightStudy?.galleryRank ?? Number.MAX_SAFE_INTEGER)
          || left.createdAt.localeCompare(right.createdAt)
          || left.id.localeCompare(right.id);
      });
    const workspaceStudies = Object.values(familyStudies)
      .filter(study => study.workspaceOnly && study.galleryVisibility === 'visible' && study.status === 'ready' && study.url)
      .sort((left, right) => (left.galleryRank ?? Number.MAX_SAFE_INTEGER) - (right.galleryRank ?? Number.MAX_SAFE_INTEGER) || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
      .map(familyStudyAsset);
    return [sourceAsset(selected), ...visibleRestorations.map(generationAsset), ...workspaceStudies];
  }, [familyStudies, selected]);
  const selectedStudy = selectedAsset?.kind === 'generation' ? familyStudies[selectedAsset.id] : undefined;
  const onFamilyStudyCreated = useCallback((study: FamilyStudy) => {
    const asset = familyStudyAsset(study);
    setFamilyStudies(current => ({ ...current, [study.id]: study }));
    setSelectedAsset(asset);
    setShowComparison(true);
  }, []);
  const updateFamilyStudy = useCallback(async (id: string, changes: { rating?: number | null; rank?: number; visibility?: 'visible' | 'hidden' }) => {
    setCurationError('');
    try {
      const response = await fetch(`/api/family/studies/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const result = await response.json() as { data?: Pick<FamilyStudy, 'id' | 'familyRating' | 'galleryRank' | 'galleryVisibility'>; error?: { message?: string } };
      if (!response.ok || !result.data) {
        setCurationError(result.error?.message || 'That family choice could not be saved. Please try again.');
        return;
      }
      setFamilyStudies(current => current[id] ? { ...current, [id]: { ...current[id], ...result.data } } : current);
      if (changes.visibility === 'hidden' && selectedAsset?.id === id && selected) {
        setSelectedAsset(sourceAsset(selected));
        setShowComparison(false);
      }
    } catch {
      setCurationError('The connection dropped before that family choice was saved. Please try again.');
    }
  }, [selected, selectedAsset]);

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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const initialAsset = defaultViewerAsset(item);
                setSelected(item);
                setSelectedAsset(initialAsset);
                setShowComparison(initialAsset.kind === 'generation');
              }}
              className="group overflow-hidden rounded-2xl border border-amber-900/10 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-700"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#e9e1d4]">
                <Image src={item.originalUrl} alt={item.title} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.14em] text-emerald-800"><ShieldCheck className="h-4 w-4" /> Preserved source{item.restorationCount > 0 ? ` + ${item.restorationCount} ${item.restorationCount === 1 ? 'labelled variation' : 'labelled variations'}` : ''}</p>
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
          <div ref={viewerRef} className="relative grid h-screen h-[100dvh] min-h-0 w-full grid-rows-[minmax(20rem,56dvh)_minmax(0,1fr)] overflow-hidden bg-[#f6f1e8] shadow-2xl sm:h-[min(92dvh,60rem)] sm:w-[min(96vw,100rem)] sm:max-w-none sm:rounded-2xl lg:grid-cols-[minmax(0,1fr)_minmax(29rem,34rem)] lg:grid-rows-1" onClick={event => event.stopPropagation()}>
            <button type="button" onClick={closeViewer} aria-label="Close photograph" className="absolute right-[max(.75rem,env(safe-area-inset-right))] top-[max(.75rem,env(safe-area-inset-top))] z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-white shadow-lg ring-1 ring-white/20 hover:bg-black focus:outline-none focus:ring-4 focus:ring-amber-300">
              <X className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex min-h-0 flex-col bg-neutral-950 p-3 sm:p-5">
              <div className={`relative min-h-0 flex-1 overflow-hidden rounded-[1.5rem] bg-black ${showComparison ? 'flex items-center justify-center p-2 sm:p-3' : ''}`}>
                {showComparison && selectedAsset?.kind === 'generation' && selectedAsset.url ? <><RestorationCompare originalUrl={selected.originalUrl} studyUrl={selectedAsset.url} title={selected.title} studyLabel={selectedAsset.label} className="mx-auto w-full max-w-4xl text-white" /><button type="button" onClick={() => setShowComparison(false)} aria-label="Show selected variation only" title="Show selected variation only" className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#17241d] shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300"><Columns2 className="h-5 w-5" /></button></> : <><Image src={selectedAsset?.url || selected.originalUrl} alt={`${selected.title} — ${selectedAsset?.label || 'preserved source'}`} fill unoptimized sizes="(max-width: 1024px) 100vw, 70vw" className="object-contain p-2 sm:p-4" /><span className={`absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] ${selectedAsset?.kind === 'generation' ? 'bg-amber-300 text-[#17241d]' : 'bg-emerald-950/90 text-white'}`}>{selectedAsset?.kind === 'generation' ? selectedAsset.label : 'Fit to screen · complete source'}</span>{selectedAsset?.kind === 'generation' && <button type="button" onClick={() => setShowComparison(true)} aria-label="Compare source and selected variation" title="Compare source and selected variation" className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#17241d] shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300"><Columns2 className="h-5 w-5" /></button>}</>}
              </div>
              <div className="mt-4 px-1">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-stone-300">All images and variations</p>
                <div role="list" aria-label="Source and published image variations" className="mt-3 flex snap-x gap-2.5 overflow-x-auto pb-2">
                  {carouselAssets.map(asset => {
                    const active = selectedAsset?.id === asset.id;
                    const recovered = asset.provenance === 'recovered-historical';
                    return <div key={asset.id} role="listitem" className="w-28 shrink-0 snap-start"><button type="button" aria-pressed={active} onClick={() => { setSelectedAsset(asset); setShowComparison(asset.kind === 'generation'); }} className={`w-full overflow-hidden rounded-2xl border-2 text-left transition focus:outline-none focus:ring-4 focus:ring-amber-300 ${active ? 'border-amber-300 bg-white' : 'border-white/15 bg-white/10 text-white hover:border-white/60'}`}><span className="relative block aspect-[4/3] bg-black"><Image src={asset.url} alt="" fill unoptimized sizes="112px" className="object-cover" /></span><span className="block p-2"><span className={`block truncate text-xs font-bold ${active ? 'text-[#17241d]' : 'text-white'}`}>{asset.label}</span><span className={`mt-1 block truncate text-[10px] ${active ? 'text-neutral-500' : 'text-stone-300'}`}>{asset.kind === 'source' ? 'Original authority' : recovered ? 'Model not recorded' : asset.model || 'AI study'}</span></span></button></div>;
                  })}
                </div>
              </div>
            </div>
            <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain p-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:p-7">
              <Images className="h-7 w-7 text-amber-800" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[.16em] text-amber-800">Source and versions</p>
              <h2 className="mt-2 break-words font-serif text-3xl leading-tight">{selected.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{selected.familyMember || 'Saroop Singh family collection'}</p>

              <section aria-label="Selected image details" className="mt-5 rounded-2xl border border-amber-900/10 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-emerald-800">Now viewing</p>
                <h3 className="mt-2 font-serif text-2xl leading-tight">{selectedAsset?.label || 'Preserved source'}</h3>
                {selectedAsset?.kind !== 'generation' ? (
                  <p className="mt-2 text-sm leading-6 text-neutral-600">This is the preserved source. Every AI image beside it is a separate, labelled version.</p>
                ) : selectedAsset.provenance === 'recovered-historical' ? (
                  <p className="mt-2 text-sm leading-6 text-neutral-600">An earlier saved version. Its original model and prompt were not recorded, so we show it honestly as an unknown earlier study.</p>
                ) : (
                  <>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div><dt className="text-neutral-500">Made with</dt><dd className="mt-1 font-semibold text-neutral-900">{selectedAsset.model}</dd></div>
                      <div><dt className="text-neutral-500">Purpose</dt><dd className="mt-1 font-semibold text-neutral-900">{selectedAsset.label}</dd></div>
                    </dl>
                    {selectedStudy?.prompt ? (
                      <details className="mt-4 rounded-xl bg-stone-100 p-3" open>
                        <summary className="cursor-pointer text-sm font-semibold text-neutral-900">Exact prompt sent</summary>
                        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-neutral-700">{selectedStudy.prompt}</pre>
                      </details>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-neutral-600">No saved prompt exists for this earlier image.</p>
                    )}
                  </>
                )}
                {selectedStudy?.workspaceOnly && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"><strong>Shared family workspace version.</strong> It remains out of the published archive record until it is deliberately reviewed.</p>}
              </section>

              {selectedAsset?.kind === 'generation' && selectedStudy && (
                <section aria-label="Family choices for this image version" className="mt-4 rounded-2xl border border-amber-900/10 bg-[#fffaf1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-amber-800">Family choice</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">How good is this version?</p>
                      <div className="mt-2 flex gap-1" aria-label="Family rating">
                        {[1, 2, 3, 4, 5].map(value => <button key={value} type="button" aria-label={`${value} out of 5`} aria-pressed={selectedStudy.familyRating === value} onClick={() => updateFamilyStudy(selectedStudy.id, { rating: selectedStudy.familyRating === value ? null : value })} className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-900/15 bg-white text-amber-800 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-300"><Star className={`h-5 w-5 ${Number(selectedStudy.familyRating || 0) >= value ? 'fill-current' : ''}`} /></button>)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => updateFamilyStudy(selectedStudy.id, { rank: 1, visibility: 'visible' })} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-900/20 bg-white px-3 text-sm font-semibold transition hover:bg-amber-50"><ArrowUp className="h-4 w-4" /> Make top pick</button>
                      <button type="button" onClick={() => updateFamilyStudy(selectedStudy.id, { visibility: selectedStudy.galleryVisibility === 'hidden' ? 'visible' : 'hidden' })} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-900/20 bg-white px-3 text-sm font-semibold transition hover:bg-amber-50">{selectedStudy.galleryVisibility === 'hidden' ? <><Eye className="h-4 w-4" /> Show again</> : <><EyeOff className="h-4 w-4" /> Hide</>}</button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-neutral-600">{selectedStudy.galleryVisibility === 'hidden' ? 'Hidden from the public image rail, but kept in the family record.' : selectedStudy.galleryRank === 1 ? 'This is the family’s top pick for this photograph.' : 'Stars help the family decide; “Make top pick” puts it first in the image rail.'}</p>
                  {curationError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-800">{curationError}</p>}
                </section>
              )}

              <div className="mt-4"><FamilyStudyMaker image={{ id: selected.id, title: selected.title }} onCreated={onFamilyStudyCreated} /></div>

              <section aria-label="Add family knowledge to this photograph" className="mt-4 rounded-2xl border border-amber-900/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-amber-800">Family memory</p>
                <h3 className="mt-2 font-serif text-2xl leading-tight">Recognise someone or remember this day?</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">Add a name, correction, voice note, or story while this photograph is open. Family knowledge stays private until it is reviewed.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link href={`/remember?subject=${encodeURIComponent(selected.id)}&kind=identify`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1f2a24] px-3 text-sm font-semibold text-white"><UserRoundPlus className="h-4 w-4" /> Name someone</Link>
                  <Link href={`/remember?subject=${encodeURIComponent(selected.id)}&kind=story`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-900/20 bg-white px-3 text-sm font-semibold text-neutral-900"><MessageCircleHeart className="h-4 w-4" /> Add a memory</Link>
                </div>
              </section>

              <details className="mt-5 rounded-2xl border border-amber-900/10 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-neutral-900">Archive details</summary>
                <p className="mt-3 text-sm leading-6 text-neutral-600">The preserved source may be a scan, crop, or screenshot. Versions never replace it.</p>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div><dt className="text-neutral-500">Source file</dt><dd className="mt-1 break-words font-medium">{selected.original.filename} · {(selected.original.bytes / 1024).toFixed(0)} KB</dd></div>
                  {selected.original.sha256 && <div><dt className="text-neutral-500">Source checksum</dt><dd className="mt-1 break-all font-mono text-[11px] text-neutral-600">{selected.original.sha256}</dd></div>}
                  {selectedAsset?.kind === 'generation' && selectedAsset.outputSha256 && <div><dt className="text-neutral-500">Version checksum</dt><dd className="mt-1 break-all font-mono text-[11px] text-neutral-600">{selectedAsset.outputSha256}</dd></div>}
                </dl>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <a href={selected.originalUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-900/20 bg-white px-3 text-sm font-semibold"><ExternalLink className="h-4 w-4" /> Open source</a>
                  <a href={selected.originalUrl} download={selected.original.filename} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1f2a24] px-3 text-sm font-semibold text-white"><Download className="h-4 w-4" /> Download source</a>
                </div>
                <Link href={`/gallery/${selected.id}`} className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-bold text-[#17241d]">Open full collection story</Link>
                <div className="mt-5 flex flex-wrap gap-2">{selected.tags.map(tag => <span key={tag} className="rounded-full bg-amber-900/8 px-3 py-1.5 text-xs font-medium text-amber-950">{tag}</span>)}</div>
              </details>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
