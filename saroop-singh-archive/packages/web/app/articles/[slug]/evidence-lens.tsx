"use client";

import Image from "next/image";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Download, FileText, ScanSearch, ShieldQuestion } from "lucide-react";

const EVIDENCE_TABS = [
  { id: "scan", label: "Source scan", icon: ScanSearch },
  { id: "text", label: "Catalogue text", icon: FileText },
  { id: "record", label: "Evidence status", icon: ShieldQuestion },
] as const;

export function EvidenceLens({ image, title, content }: { image: string; title: string; content: string }) {
  const [view, setView] = useState<"scan" | "text" | "record">("scan"); const [zoom, setZoom] = useState(100);
  function moveTab(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % EVIDENCE_TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + EVIDENCE_TABS.length) % EVIDENCE_TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = EVIDENCE_TABS.length - 1;
    else return;
    event.preventDefault();
    const tab = EVIDENCE_TABS[next];
    setView(tab.id);
    document.getElementById(`evidence-tab-${tab.id}`)?.focus();
  }
  return <section className="overflow-hidden rounded-[2rem] border border-amber-950/10 bg-white shadow-xl"><div role="tablist" aria-label="Evidence views" className="flex overflow-x-auto border-b bg-[#17241d] p-2 text-sm text-white">{EVIDENCE_TABS.map((option, index) => { const Icon = option.icon; return <button id={`evidence-tab-${option.id}`} type="button" role="tab" tabIndex={view === option.id ? 0 : -1} aria-selected={view === option.id} aria-controls={`evidence-${option.id}`} key={option.id} onClick={() => setView(option.id)} onKeyDown={(event) => moveTab(event, index)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-semibold ${view === option.id ? "bg-amber-300 text-[#17241d]" : "text-stone-300"}`}><Icon className="h-4 w-4" />{option.label}</button>; })}</div>
    {view === "scan" && <div id="evidence-scan" role="tabpanel" aria-labelledby="evidence-tab-scan"><div className="h-[65dvh] min-h-96 overflow-auto bg-neutral-950"><div className="mx-auto origin-top transition-[width]" style={{ width: `${zoom}%`, minWidth: "100%" }}><Image src={image} alt={`${title}, best available newspaper source capture`} width={1800} height={2400} unoptimized sizes="100vw" className="h-auto w-full object-contain" /></div></div><div className="flex flex-wrap items-center gap-3 border-t p-4"><label className="flex flex-1 items-center gap-3 text-sm font-semibold">Zoom <input type="range" min="100" max="300" step="10" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="min-w-32 flex-1" /><span className="w-12 text-right">{zoom}%</span></label><a href={image} download className="flex min-h-11 items-center gap-2 rounded-full bg-[#17241d] px-4 text-sm font-semibold text-white"><Download className="h-4 w-4" /> Source</a></div></div>}
    {view === "text" && <div id="evidence-text" role="tabpanel" aria-labelledby="evidence-tab-text" className="p-6 sm:p-9"><div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Catalogue transcription and research notes.</strong> This text improves discovery but has not yet been certified as a line-for-line diplomatic transcription. Consult the source image for names, dates, results and quotations.</div><div className="prose prose-lg max-w-none prose-headings:font-serif"><ReactMarkdown>{content}</ReactMarkdown></div></div>}
    {view === "record" && <div id="evidence-record" role="tabpanel" aria-labelledby="evidence-tab-record" className="grid gap-5 p-6 sm:grid-cols-3 sm:p-9"><div className="rounded-2xl bg-emerald-50 p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-emerald-800">Source layer</p><h3 className="mt-3 font-serif text-2xl">Best available capture</h3><p className="mt-3 text-sm leading-6 text-neutral-600">The scan, screenshot or crop is the authority for what this catalogue can currently inspect.</p></div><div className="rounded-2xl bg-amber-50 p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-amber-800">Access layer</p><h3 className="mt-3 font-serif text-2xl">Working text</h3><p className="mt-3 text-sm leading-6 text-neutral-600">Searchable text and notes may contain transcription errors.</p></div><div className="rounded-2xl bg-stone-100 p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-neutral-600">Review layer</p><h3 className="mt-3 font-serif text-2xl">Claims</h3><p className="mt-3 text-sm leading-6 text-neutral-600">Names, times and identity conclusions require source review.</p></div></div>}
  </section>;
}
