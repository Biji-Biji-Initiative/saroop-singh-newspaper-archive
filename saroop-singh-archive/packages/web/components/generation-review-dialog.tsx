"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  FileCheck2,
  Images,
  Info,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { RestorationCompare } from "@/components/restoration-compare";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type GenerationAsset = {
  id: string;
  label: string;
  url: string;
  kind: "source" | "generation";
  provider?: string;
  model?: string;
  recipe?: string;
  interventionClass?: string;
  promptVersion?: string;
  prompt?: string;
  createdAt?: string;
  reviewStatus?: string;
  outputSha256?: string | null;
};

type GenerationReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  source: GenerationAsset;
  generations: GenerationAsset[];
  initialAssetId?: string;
  privateProvenance?: boolean;
};

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function GenerationReviewDialog({
  open,
  onOpenChange,
  title,
  source,
  generations,
  initialAssetId,
  privateProvenance = false,
}: GenerationReviewDialogProps) {
  const assets = useMemo(() => [source, ...generations], [source, generations]);
  const [activeId, setActiveId] = useState(() => initialAssetId || source.id);
  const [showComparison, setShowComparison] = useState(false);
  const active = assets.find(asset => asset.id === activeId) || source;
  const isSource = active.kind === "source";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] gap-0 overflow-hidden border-0 bg-[#f6f1e8] p-0 text-[#17241d] sm:max-w-7xl sm:rounded-[2rem]">
        <DialogHeader className="border-b border-amber-950/10 px-5 pb-5 pt-6 text-left sm:px-8 sm:pt-8">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-amber-800">
            <Images className="h-4 w-4" /> Source and AI studies
          </p>
          <DialogTitle className="mt-2 pr-12 font-serif text-3xl leading-tight sm:text-4xl">
            {title}
          </DialogTitle>
          <DialogDescription className="max-w-3xl text-left leading-6 text-neutral-600">
            The preserved source is always first. AI images are labelled reviewable derivatives, never replacements.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(22rem,.6fr)]">
          <section className="min-w-0 bg-neutral-950 p-3 sm:p-5">
            <div className="relative flex min-h-[18rem] items-center justify-center overflow-hidden rounded-[1.5rem] bg-black sm:min-h-[30rem]">
              {showComparison && !isSource ? (
                <RestorationCompare
                  originalUrl={source.url}
                  studyUrl={active.url}
                  title={title}
                  studyLabel={active.label}
                  className="w-full max-w-5xl px-1 text-white"
                />
              ) : (
                <Image
                  src={active.url}
                  alt={`${title} — ${active.label}`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 68vw"
                  className="object-contain p-2 sm:p-4"
                />
              )}
              <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] ${isSource ? "bg-emerald-950/90 text-white" : "bg-amber-300 text-[#17241d]"}`}>
                {active.label}
              </span>
              {!isSource && !showComparison && (
                <button
                  type="button"
                  onClick={() => setShowComparison(true)}
                  className="absolute bottom-4 right-4 flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#17241d] shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300"
                >
                  <ScanLine className="h-4 w-4" /> Compare to source
                </button>
              )}
            </div>

            <div className="mt-4">
              <p className="px-1 text-xs font-semibold uppercase tracking-[.16em] text-stone-300">
                Choose what to feature
              </p>
              <div role="list" aria-label="Source and AI generations" className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
                {assets.map(asset => {
                  const selected = asset.id === active.id;
                  return (
                    <div
                      key={asset.id}
                      role="listitem"
                      className="w-32 shrink-0 snap-start"
                    >
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => { setActiveId(asset.id); setShowComparison(false); }}
                        className={`w-full overflow-hidden rounded-2xl border-2 text-left transition focus:outline-none focus:ring-4 focus:ring-amber-300 ${selected ? "border-amber-300 bg-white" : "border-white/15 bg-white/10 text-white hover:border-white/60"}`}
                      >
                        <span className="relative block aspect-[4/3] bg-black">
                          <Image src={asset.url} alt="" fill unoptimized sizes="128px" className="object-cover" />
                        </span>
                        <span className="block p-2">
                          <span className={`block truncate text-xs font-bold ${selected ? "text-[#17241d]" : "text-white"}`}>{asset.label}</span>
                          <span className={`mt-1 block truncate text-[10px] ${selected ? "text-neutral-500" : "text-stone-300"}`}>
                            {asset.kind === "source" ? "Original authority" : asset.model || "AI study"}
                          </span>
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto overscroll-contain p-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:p-8">
            <div className={`rounded-2xl p-4 ${isSource ? "bg-emerald-50 text-emerald-950" : "bg-amber-100/70 text-amber-950"}`}>
              {isSource ? <FileCheck2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              <h3 className="mt-3 font-serif text-2xl">{active.label}</h3>
              <p className="mt-2 text-sm leading-6 opacity-80">
                {isSource
                  ? "The original is the archive authority. It remains untouched by every study."
                  : "This is a labelled AI-generated study. Compare it against the source before treating any change as useful."}
              </p>
            </div>

            {!isSource && (
              <>
                <dl className="mt-5 divide-y divide-amber-950/10 rounded-2xl border border-amber-950/10 bg-white text-sm">
                  <div className="grid grid-cols-[7rem_1fr] gap-3 p-3"><dt className="text-neutral-500">Model</dt><dd className="font-semibold">{active.model || "Recorded in archive"}</dd></div>
                  <div className="grid grid-cols-[7rem_1fr] gap-3 p-3"><dt className="text-neutral-500">Provider</dt><dd className="font-semibold">{active.provider || "Recorded in archive"}</dd></div>
                  <div className="grid grid-cols-[7rem_1fr] gap-3 p-3"><dt className="text-neutral-500">Intent</dt><dd className="font-semibold">{active.recipe || "Preservation study"}</dd></div>
                  <div className="grid grid-cols-[7rem_1fr] gap-3 p-3"><dt className="text-neutral-500">Class</dt><dd className="font-semibold">{active.interventionClass || "Conservation"}</dd></div>
                  <div className="grid grid-cols-[7rem_1fr] gap-3 p-3"><dt className="text-neutral-500">Prompt set</dt><dd className="font-semibold">{active.promptVersion || "Recorded in archive"}</dd></div>
                  <div className="grid grid-cols-[7rem_1fr] gap-3 p-3"><dt className="text-neutral-500">Created</dt><dd className="font-semibold">{formatDate(active.createdAt)}</dd></div>
                  {active.reviewStatus && <div className="grid grid-cols-[7rem_1fr] gap-3 p-3"><dt className="text-neutral-500">Review</dt><dd className="font-semibold">{active.reviewStatus}</dd></div>}
                  {active.outputSha256 && <div className="p-3"><dt className="text-neutral-500">Output SHA-256</dt><dd className="mt-1 break-all font-mono text-[10px] text-neutral-700">{active.outputSha256}</dd></div>}
                </dl>
                {privateProvenance && active.prompt ? (
                  <details className="mt-5 rounded-2xl border border-amber-950/10 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-semibold">Read the exact prompt and family notes</summary>
                    <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-stone-100 p-3 text-xs leading-5 text-neutral-700">{active.prompt}</pre>
                  </details>
                ) : (
                  <p className="mt-5 flex gap-2 rounded-2xl bg-stone-100 p-4 text-xs leading-5 text-neutral-600">
                    <Info className="h-4 w-4 shrink-0" /> Exact prompts stay in the private preservation record because they can include family context. This public view shows the full safe provenance instead.
                  </p>
                )}
              </>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
