"use client";

import Image from "next/image";
import { useState } from "react";
import { Eye } from "lucide-react";
import { RestorationCompare } from "@/components/restoration-compare";

type Study = { id: string; type: string; url: string };
function studyLabel(type: string, isLegacy: boolean) {
  if (isLegacy) return "Speculative legacy AI reconstruction";
  return type;
}

export function CompareStudio({ originalUrl, title, studies, isLegacy }: { originalUrl: string; title: string; studies: Study[]; isLegacy: boolean }) {
  const [selectedId, setSelectedId] = useState(""); const selected = studies.find(study => study.id === selectedId);
  if (!selected) return <div><div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-black"><Image src={originalUrl} alt={`${title}, preserved source`} fill unoptimized sizes="100vw" className="object-contain" /></div><p className="mt-4 text-sm text-stone-400">{studies.length ? "The source is shown first. Choose an experiment below only if you want to inspect what the earlier AI system changed." : "No restoration study has been approved for comparison yet."}</p>{studies.length > 0 && <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2">{studies.map((study, index) => <button key={study.id} type="button" onClick={() => setSelectedId(study.id)} className="min-h-11 shrink-0 snap-start rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white">Inspect {isLegacy ? `legacy experiment ${index + 1}` : study.type}</button>)}</div>}</div>;
  return <div>{isLegacy && <p className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100"><strong>Not a verified restoration.</strong> This legacy output can change likeness, clothing, text and scenery. Its canvas is not registered to the source, so the seam is illustrative rather than a pixel-accurate comparison.</p>}<RestorationCompare originalUrl={originalUrl} studyUrl={selected.url} title={title} studyLabel={studyLabel(selected.type, isLegacy)} /><div className="mt-5"><p aria-live="polite" className="flex items-center gap-2 text-sm font-semibold"><Eye className="h-4 w-4" /> Choose a labelled study</p><div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2"><button type="button" onClick={() => setSelectedId("")} className="min-h-11 shrink-0 snap-start rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white">Back to source only</button>{studies.map((study, index) => <button key={study.id} type="button" aria-pressed={study.id === selectedId} onClick={() => setSelectedId(study.id)} className={`min-h-11 shrink-0 snap-start rounded-full px-4 text-sm font-semibold ${study.id === selectedId ? "bg-amber-300 text-[#17241d]" : "border border-white/20 bg-white/10 text-white"}`}>{isLegacy ? `Legacy experiment ${index + 1}` : study.type}</button>)}</div></div></div>;
}
