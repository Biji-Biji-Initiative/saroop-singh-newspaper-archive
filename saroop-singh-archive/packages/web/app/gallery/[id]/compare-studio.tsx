"use client";

import Image from "next/image";
import { useState } from "react";
import { Eye } from "lucide-react";
import { RestorationCompare } from "@/components/restoration-compare";

type Study = { id: string; type: string; url: string };

export function CompareStudio({ originalUrl, title, studies }: { originalUrl: string; title: string; studies: Study[] }) {
  const [selectedId, setSelectedId] = useState("");
  const selected = studies.find(study => study.id === selectedId);
  if (!selected) {
    return <div><div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-black"><Image src={originalUrl} alt={`${title}, preserved source`} fill unoptimized sizes="100vw" className="object-contain" /></div><p className="mt-4 text-sm text-stone-400">{studies.length ? "The source is shown first. Choose an approved study to inspect the reviewable change." : "No restoration study has been approved for comparison yet."}</p>{studies.length > 0 && <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2">{studies.map(study => <button key={study.id} type="button" onClick={() => setSelectedId(study.id)} className="min-h-11 shrink-0 snap-start rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white">Inspect {study.type}</button>)}</div>}</div>;
  }
  return <div><RestorationCompare originalUrl={originalUrl} studyUrl={selected.url} title={title} studyLabel={selected.type} /><div className="mt-5"><p aria-live="polite" className="flex items-center gap-2 text-sm font-semibold"><Eye className="h-4 w-4" /> Choose a labelled study</p><div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2"><button type="button" onClick={() => setSelectedId("")} className="min-h-11 shrink-0 snap-start rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white">Back to source only</button>{studies.map(study => <button key={study.id} type="button" aria-pressed={study.id === selectedId} onClick={() => setSelectedId(study.id)} className={`min-h-11 shrink-0 snap-start rounded-full px-4 text-sm font-semibold ${study.id === selectedId ? "bg-amber-300 text-[#17241d]" : "border border-white/20 bg-white/10 text-white"}`}>{study.type}</button>)}</div></div></div>;
}
