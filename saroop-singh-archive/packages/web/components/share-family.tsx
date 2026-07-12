"use client";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { absoluteSiteUrl } from "@/lib/site";

const url = absoluteSiteUrl("/story");
const message = "We have built a living family archive for Saroop Singh—from his newspaper record to the photographs and memories still held by our family. Begin his story:";
export function ShareFamily() { const [copied, setCopied] = useState(false); async function share() { if (navigator.share) await navigator.share({ title: "Saroop Singh Archive", text: message, url }); else { await navigator.clipboard.writeText(`${message} ${url}`); setCopied(true); } } async function copy() { await navigator.clipboard.writeText(`${message} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return <div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={share} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#17241d] px-5 font-semibold text-white"><Share2 className="h-5 w-5" /> Share invitation</button><a href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`} target="_blank" rel="noreferrer" className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#1f8f52] px-5 font-semibold text-white">Open WhatsApp</a><button type="button" onClick={copy} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-amber-950/15 px-5 font-semibold">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}{copied ? "Copied" : "Copy"}</button></div>;
}
