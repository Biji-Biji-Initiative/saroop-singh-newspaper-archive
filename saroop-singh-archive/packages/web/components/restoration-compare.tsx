"use client";

import Image from "next/image";
import { Maximize2, ScanLine } from "lucide-react";
import { useRef, useState } from "react";

export function RestorationCompare({ originalUrl, studyUrl, title, studyLabel = "Restoration study", sourceLabel = "Source", className = "" }: { originalUrl: string; studyUrl: string; title: string; studyLabel?: string; sourceLabel?: string; className?: string }) {
  const [position, setPosition] = useState(50); const frame = useRef<HTMLDivElement>(null);
  const choose = (value: number) => setPosition(value);
  return <div className={className}>
    <div ref={frame} className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-[1.5rem] bg-black shadow-2xl ring-offset-2 ring-offset-[#17241d] focus-within:ring-4 focus-within:ring-amber-300 sm:rounded-[2rem]">
      <Image src={originalUrl} alt={`${title}, preserved source`} fill unoptimized sizes="(max-width:1024px) 100vw,70vw" className="select-none object-contain" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}><Image src={studyUrl} alt={`${title}, ${studyLabel}`} fill unoptimized sizes="(max-width:1024px) 100vw,70vw" className="select-none object-contain" draggable={false} /></div>
      {position > 3 && <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-amber-300 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-[#17241d]">{studyLabel}</span>}
      {position < 97 && <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-emerald-950/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-white">{sourceLabel}</span>}
      {position > 1 && position < 99 && <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_14px_rgba(0,0,0,.9)]" style={{ left: `${position}%` }}><span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#17241d] text-white shadow-xl"><ScanLine className="h-5 w-5" /></span></div>}
      <input aria-label={`Reveal ${studyLabel}; zero percent is the source and one hundred percent is the study`} type="range" min="0" max="100" value={position} onChange={event => setPosition(Number(event.target.value))} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
    <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-sm"><button type="button" onClick={() => choose(0)} aria-pressed={position === 0} className={`min-h-11 rounded-full px-3 font-semibold ${position === 0 ? "bg-emerald-800 text-white" : "border border-current/15"}`}>{sourceLabel}</button><button type="button" onClick={() => choose(50)} aria-pressed={position > 0 && position < 100} className={`min-h-11 rounded-full px-3 font-semibold ${position > 0 && position < 100 ? "bg-amber-300 text-[#17241d]" : "border border-current/15"}`}>Split</button><button type="button" onClick={() => choose(100)} aria-pressed={position === 100} className={`min-h-11 rounded-full px-3 font-semibold ${position === 100 ? "bg-amber-800 text-white" : "border border-current/15"}`}>Study</button><button type="button" onClick={() => frame.current?.requestFullscreen?.()} aria-label="Compare full screen" className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-current/15"><Maximize2 className="h-4 w-4" /></button></div>
    <p className="mt-2 text-center text-xs opacity-60">Drag anywhere across the photograph, use arrow keys, or choose a view.</p>
  </div>;
}
