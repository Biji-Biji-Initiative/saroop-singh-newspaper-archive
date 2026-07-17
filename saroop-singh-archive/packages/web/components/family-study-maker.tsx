"use client";

import { useMemo, useState } from "react";
import { Loader2, Sparkles, WandSparkles } from "lucide-react";
import {
  buildRestorationPrompt,
  RESTORATION_MODEL_OPTIONS,
  type RestorationModel,
  type RestorationRecipe,
} from "@/lib/restoration-contract";

export type FamilyStudy = {
  id: string;
  imageId: string;
  type: string;
  url: string | null;
  provenance: "recorded" | "recovered-historical";
  provider: string;
  model: string;
  recipe: string;
  interventionClass: string;
  promptVersion: string | null;
  prompt: string | null;
  outputSha256: string | null;
  status: string;
  error: string | null;
  createdAt: string;
  workspaceOnly: boolean;
  familyRating: number | null;
  galleryRank: number | null;
  galleryVisibility: "visible" | "hidden";
};

const choices: Array<{ id: RestorationRecipe; label: string; note: string; actionLabel: string }> = [
  { id: "conservative", label: "Clean it up", note: "Keep it faithful", actionLabel: "Make a clean version" },
  { id: "structural", label: "Repair damage", note: "Mend visible tears", actionLabel: "Make a repaired version" },
  { id: "colourResearch", label: "Try colour", note: "A clearly labelled study", actionLabel: "Make a colour study" },
];

export function FamilyStudyMaker({
  image,
  onCreated,
}: {
  image: { id: string; title: string };
  onCreated: (study: FamilyStudy) => void;
}) {
  const [recipe, setRecipe] = useState<RestorationRecipe>("conservative");
  const [model, setModel] = useState<RestorationModel>("gpt-image-2");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedModel = useMemo(
    () => RESTORATION_MODEL_OPTIONS.find(option => option.id === model) || RESTORATION_MODEL_OPTIONS[0],
    [model],
  );
  const selectedChoice = choices.find(choice => choice.id === recipe) || choices[0];
  const prompt = useMemo(
    () => buildRestorationPrompt(recipe, notes, selectedModel.apiModel),
    [notes, recipe, selectedModel.apiModel],
  );

  async function createStudy() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/family/studies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageId: image.id, model, recipe, notes }),
      });
      const result = await response.json() as { data?: FamilyStudy; error?: { message?: string } };
      if (!response.ok || !result.data?.url) {
        setError(result.error?.message || "That image could not be made. Nothing was added to the archive.");
        return;
      }
      onCreated(result.data);
    } catch {
      setError("The connection dropped before a new image could be returned. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="rounded-2xl border border-emerald-900/15 bg-emerald-50 p-4 text-emerald-950" aria-labelledby="make-version-heading">
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-emerald-800"><Sparkles className="h-4 w-4" /> Family workspace</p>
    <h3 id="make-version-heading" className="mt-2 font-serif text-2xl leading-tight">Make a new version.</h3>
    <p className="mt-2 text-sm leading-5 text-emerald-950/75">Pick a direction and create it. Every new result starts from the preserved source and appears beside it below.</p>

    <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Choose the look for this new image">
      {choices.map(choice => <button key={choice.id} type="button" role="radio" aria-checked={recipe === choice.id} onClick={() => setRecipe(choice.id)} className={`flex min-h-20 flex-col items-start justify-center rounded-xl border px-3 text-left transition focus:outline-none focus:ring-4 focus:ring-amber-300 ${recipe === choice.id ? "border-emerald-800 bg-white shadow-sm" : "border-transparent bg-white/60 hover:border-emerald-800/30"}`}><span className="font-semibold leading-tight">{choice.label}</span><span className="mt-1 text-xs leading-4 text-emerald-950/65">{choice.note}</span></button>)}
    </div>

    <button type="button" onClick={createStudy} disabled={busy} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-950 disabled:opacity-60">
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <WandSparkles className="h-5 w-5" />}
      {busy ? "Making your new image…" : selectedChoice.actionLabel}
    </button>
    <p className="mt-2 text-center text-xs leading-5 text-emerald-950/70">Starts with {selectedModel.label}. The original remains untouched.</p>

    <details className="mt-4 rounded-xl border border-emerald-900/10 bg-white/70 p-3">
      <summary className="cursor-pointer text-sm font-semibold">Fine-tune this version</summary>
      <label className="mt-4 block text-sm font-semibold">Image model<select value={model} onChange={event => setModel(event.target.value as RestorationModel)} className="field mt-2 font-normal">{RESTORATION_MODEL_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label} · {option.commissioningBadge}</option>)}</select></label>
      <p className="mt-2 text-xs leading-5 text-emerald-950/65">{selectedModel.commissioningNote}</p>
      <label className="mt-4 block text-sm font-semibold">Anything that must stay true? <span className="font-normal text-emerald-950/65">(optional)</span><textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} className="field mt-2 resize-y font-normal" placeholder="Keep the writing, leave an uncertain area alone, preserve the full border…" /></label>
      <details className="mt-4 rounded-xl bg-[#17241d] p-3 text-stone-100"><summary className="cursor-pointer text-sm font-semibold">See the exact prompt we will send</summary><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-stone-200">{prompt}</pre></details>
    </details>
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-800">{error}</p>}
  </section>;
}
