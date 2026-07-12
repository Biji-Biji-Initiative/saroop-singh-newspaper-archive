"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  ChevronRight,
  CloudUpload,
  Download,
  ImageIcon,
  Loader2,
  LockKeyhole,
  RotateCcw,
  Save,
  Sparkles,
  ShieldCheck,
  Hammer,
  Palette,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { RestorationCompare } from "@/components/restoration-compare";
import Image from "next/image";

type Run = {
  id: string;
  model: string;
  recipe: string;
  prompt: string;
  status: string;
  error?: string | null;
  outputUrl?: string | null;
};
type Item = {
  id: string;
  title: string;
  description: string;
  people: string;
  estimatedDate?: string;
  tags: string[];
  rights?: string;
  status: string;
  createdBy?: string;
  contributorName?: string;
  contributorRelationship?: string;
  contributorContact?: string;
  restorationPreference?: string;
  aiProcessingConsent?: string;
  aiProcessingConsentWordingVersion?: string | null;
  aiProcessingConsentRecordedAt?: string | null;
  originalName: string;
  originalType?: string;
  originalBytes?: number;
  originalSha256?: string;
  originalUrl: string;
  publishedUrl?: string | null;
  readOnlyLegacy?: boolean;
  runs: Run[];
  photoAnalysis?: {
    faceCount: number;
    faces: Array<{
      location: string;
      visibility: "clear" | "partial" | "uncertain";
    }>;
    photoSummary: string;
    suggestedTags: string[];
    reviewRequired: true;
  } | null;
  photoAnalysisModel?: string | null;
  photoAnalysisStatus?: string;
  photoAnalyzedAt?: string | null;
};

const models = [
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    note: "High-fidelity conservation · recommended",
  },
  {
    id: "gemini-3.1-flash-image",
    name: "Nano Banana 2",
    note: "Fast 2K preservation study",
  },
  {
    id: "gemini-3-pro-image",
    name: "Nano Banana Pro",
    note: "Complex professional restoration",
  },
];
const recipes = [
  {
    id: "conservative",
    name: "Clean & preserve",
    note: "Dust, scratches and faded tones. No new historical detail.",
    badge: "Recommended",
    icon: ShieldCheck,
  },
  {
    id: "structural",
    name: "Repair damage",
    note: "Tears, creases and missing paper. Review reconstructed areas closely.",
    badge: "AI-assisted repair",
    icon: Hammer,
  },
  {
    id: "colourResearch",
    name: "Explore colour",
    note: "A clearly labelled interpretation—not recovered historical colour.",
    badge: "Interpretive",
    icon: Palette,
  },
];

export function Studio({ displayName }: { displayName: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [model, setModel] = useState(models[0].id);
  const [recipe, setRecipe] = useState(recipes[0].id);
  const [notes, setNotes] = useState("");
  const [reviewedRuns, setReviewedRuns] = useState<Record<string, boolean>>({});
  const [publicationConfirmations, setPublicationConfirmations] = useState<Record<string, boolean>>({});
  const [aiConsentEvidence, setAiConsentEvidence] = useState("");
  const [metadataDirty, setMetadataDirty] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<{ url: string; name: string; size: number }>();
  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || items[0],
    [items, selectedId],
  );
  const isFamilyContribution = selected?.createdBy === "public-family-contribution";
  const familyReviewPending = Boolean(
    isFamilyContribution && ["submitted", "rejected"].includes(selected?.status || ""),
  );
  const familyAiBlocked = Boolean(
    isFamilyContribution &&
      (selected?.aiProcessingConsent !== "granted" ||
        !selected?.aiProcessingConsentWordingVersion ||
        !Number.isFinite(Date.parse(selected?.aiProcessingConsentRecordedAt || ""))),
  );
  const sourceIsPublic = Boolean(
    selected?.status === "published" &&
      selected.publishedUrl &&
      selected.publishedUrl === selected.originalUrl,
  );
  const hasReadyStudy = Boolean(selected?.runs.some(run => run.status === "ready" && run.outputUrl));
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/studio/images");
      if (!response.ok) throw new Error("The private intake could not be loaded.");
      const data = await response.json();
      setItems(data.images || []);
      setLoadError("");
    } catch {
      setLoadError("The private intake could not be loaded. Nothing has been changed.");
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => () => { if (uploadPreview) URL.revokeObjectURL(uploadPreview.url); }, [uploadPreview]);
  useEffect(() => { if (selected?.restorationPreference === "repair-damage") setRecipe("structural"); else if (selected?.restorationPreference === "explore-colour") setRecipe("colourResearch"); else setRecipe("conservative"); }, [selected?.id, selected?.restorationPreference]);

  function selectItem(id: string) {
    setSelectedId(id);
    setNotes("");
    setAiConsentEvidence("");
    setMetadataDirty(false);
    setMessage("");
  }

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    setBusy(true);
    setMessage("Preserving the original…");
    try {
      const response = await fetch("/api/studio/images", {
        method: "POST",
        body: new FormData(formElement),
      });
      const data = await response.json();
      if (response.ok) {
        formElement.reset(); if (uploadPreview) URL.revokeObjectURL(uploadPreview.url); setUploadPreview(undefined);
        selectItem(data.id);
        setMessage("Original secured. Ready for a conservation study.");
        await refresh();
      } else setMessage(data.error || "Upload failed.");
    } catch {
      setMessage("Connection failed. The upload may not have completed; refresh the intake before retrying.");
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (!selected) return;
    setBusy(true);
    setMessage("Running a preservation study. This can take a minute…");
    try {
      const response = await fetch("/api/studio/restore", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageId: selected.id, model, recipe, notes }),
      });
      const data = await response.json();
      setMessage(
        response.ok
          ? "Study ready. Compare it carefully before publishing."
          : data.error || "Restoration failed.",
      );
      if (response.ok) setMetadataDirty(false);
      await refresh();
    } catch {
      setMessage("Connection failed. No result was published; refresh before trying another study.");
    } finally {
      setBusy(false);
    }
  }

  async function recordAiConsent(decision: "granted" | "revoked") {
    if (!selected || aiConsentEvidence.trim().length < 5) return;
    setBusy(true);
    setMessage(decision === "granted" ? "Recording new contributor permission…" : "Recording AI permission withdrawal…");
    try {
      const response = await fetch(`/api/studio/images/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ aiProcessingConsent: decision, aiConsentEvidence }),
      });
      const data = await response.json();
      setMessage(response.ok ? decision === "granted" ? "New AI permission recorded with an audit note." : "Permission withdrawn. Future AI processing is blocked and any public study was reverted to the source." : data.error || "Consent decision could not be saved.");
      if (response.ok) setAiConsentEvidence("");
      await refresh();
    } catch {
      setMessage("Connection failed. The consent record was not changed.");
    } finally {
      setBusy(false);
    }
  }

  async function analyzeFaces() {
    if (!selected || selected.readOnlyLegacy) return;
    setBusy(true);
    setMessage("Detecting visible faces for private curator review…");
    try {
      const response = await fetch(
        `/api/studio/images/${selected.id}/analyze`,
        { method: "POST" },
      );
      const data = await response.json();
      setMessage(
        response.ok
          ? `Private face review ready: ${data.analysis.faceCount} visible ${data.analysis.faceCount === 1 ? "face" : "faces"} detected. No identities were assigned.`
          : data.error || "Visible-face detection failed.",
      );
      await refresh();
    } catch {
      setMessage(
        "Connection failed. The original remains unchanged and no observation was saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish(runId?: string, publish = true) {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageId: selected.id,
          runId,
          publish,
          publicationConfirmed: publish ? Boolean(publicationConfirmations[selected.id]) : undefined,
          comparisonConfirmed: publish && runId ? Boolean(reviewedRuns[runId]) : undefined,
        }),
      });
      const data = await response.json();
      setMessage(
        response.ok
          ? publish
            ? "Published with provenance and a recorded rights confirmation."
            : "Returned to private review."
          : data.error || "Publication decision failed.",
      );
      if (response.ok && publish) {
        setPublicationConfirmations(current => ({ ...current, [selected.id]: false }));
        if (runId) setReviewedRuns(current => ({ ...current, [runId]: false }));
      }
      await refresh();
    } catch {
      setMessage("Connection failed. Nothing was published; please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRecord(formElement: HTMLFormElement, status?: string) {
    if (!selected || selected.readOnlyLegacy) return;
    setBusy(true);
    setMessage(
      status === "rejected" ? "Recording rejection…" : "Saving archive record…",
    );
    const form = new FormData(formElement);
    const payload = {
      title: form.get("title"),
      people: form.get("people"),
      estimatedDate: form.get("estimatedDate"),
      description: form.get("description"),
      rights: form.get("rights"),
      tags: String(form.get("tags") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      ...(status ? { status } : {}),
    };
    try {
      const response = await fetch(`/api/studio/images/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setMessage(
        response.ok
          ? status === "private"
            ? "Contribution accepted into private review."
            : status === "rejected"
              ? "Contribution rejected and retained in the audit trail."
              : "Archive record saved."
          : data.error || "Could not save.",
      );
      await refresh();
    } catch {
      setMessage(
        "Connection failed. Your changes were not saved; please retry.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] text-[#18211c]">
      <section className="border-b border-white/10 bg-[#17241d] text-[#f8f2e5]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-amber-300">
              <LockKeyhole className="h-4 w-4" /> Private preservation studio
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/studio/memories"
                className="flex min-h-10 items-center gap-2 rounded-full bg-amber-300 px-4 text-sm font-semibold text-[#17241d]"
              >
                Review memories
              </a>
              <a
                href="/api/studio/export"
                className="flex min-h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold text-white hover:bg-white/10"
              >
                <Download className="h-4 w-4" /> Export records
              </a>
              <p className="hidden text-sm text-stone-400 sm:block">
                Signed in as {displayName}
              </p>
              <a
                href="/api/studio/session/logout?return_to=%2F"
                className="flex min-h-10 items-center rounded-full border border-white/20 px-4 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sign out
              </a>
            </div>
          </div>
          <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-[1.05] sm:text-6xl">
            Keep the original. Restore with restraint. Publish with proof.
          </h1>
          <div className="mt-8 grid max-w-3xl grid-cols-3 gap-2 text-xs sm:text-sm">
            <span className="rounded-full bg-white/10 px-3 py-2 text-center">
              1 · Intake
            </span>
            <span className="rounded-full bg-amber-300 px-3 py-2 text-center font-semibold text-[#17241d]">
              2 · Restore & review
            </span>
            <span className="rounded-full bg-white/10 px-3 py-2 text-center">
              3 · Publish
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-8 sm:py-10 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-5">
          <form
            onSubmit={upload}
            className="rounded-3xl border border-amber-950/10 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-amber-100 p-3">
                <CloudUpload className="h-6 w-6 text-amber-900" />
              </span>
              <div>
                <h2 className="font-serif text-2xl">Add photographs</h2>
                <p className="text-sm text-neutral-500">
                  Phone camera or files · up to 50 MB
                </p>
              </div>
            </div>
            <label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-900/20 bg-amber-50/60 p-5 text-center transition hover:border-amber-700">
              <ImageIcon className="h-7 w-7 text-amber-800" />
              <span className="mt-2 font-semibold">Choose an image</span>
              <span className="mt-1 text-xs text-neutral-500">
                JPEG, PNG, or WebP
              </span>
              <input
                className="sr-only"
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => { const file = event.target.files?.[0]; if (uploadPreview) URL.revokeObjectURL(uploadPreview.url); setUploadPreview(file ? { url: URL.createObjectURL(file), name: file.name, size: file.size } : undefined); }}
                required
              />
            </label>
            {uploadPreview && <figure className="mt-3 overflow-hidden rounded-2xl border border-amber-950/10"><div className="relative aspect-[4/3] bg-neutral-950"><Image src={uploadPreview.url} alt="Selected photograph preview" fill unoptimized sizes="320px" className="object-contain" /></div><figcaption className="flex items-center justify-between gap-3 p-3 text-xs"><span className="truncate font-semibold">{uploadPreview.name}</span><span className="shrink-0 text-neutral-500">{(uploadPreview.size / 1024 / 1024).toFixed(1)} MB</span></figcaption></figure>}
            <div className="mt-4 space-y-3">
              <input
                name="title"
                aria-label="Title"
                placeholder="Title or short identification"
                className="field"
              />
              <input
                name="people"
                aria-label="People"
                placeholder="People pictured"
                className="field"
              />
              <input
                name="estimatedDate"
                aria-label="Estimated date"
                placeholder="Date or circa, e.g. c. 1938"
                className="field"
              />
              <input
                name="tags"
                aria-label="Tags"
                placeholder="Tags, comma separated"
                className="field"
              />
              <textarea
                name="description"
                aria-label="Notes"
                placeholder="Provenance, handwriting, location, family notes…"
                rows={3}
                className="field resize-y"
              />
            </div>
            <button
              disabled={busy}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17241d] px-4 font-semibold text-white disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Archive className="h-5 w-5" />
              )}{" "}
              Preserve original
            </button>
          </form>
          <div className="rounded-3xl border border-amber-950/10 bg-white p-3 shadow-sm">
            <p className="px-2 py-2 text-xs font-semibold uppercase tracking-[.18em] text-neutral-500">
              Private intake · {items.length}
            </p>
            <div className="max-h-[52vh] space-y-1 overflow-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectItem(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left ${selected?.id === item.id ? "bg-amber-100" : "hover:bg-stone-100"}`}
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-200">
                    <Image src={item.originalUrl} alt="" fill unoptimized sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {item.title}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {item.status} · {item.runs.length} studies
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          {loadError && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p>{loadError}</p>
              <button type="button" onClick={refresh} className="mt-3 min-h-11 rounded-full bg-red-900 px-5 font-semibold text-white">Try loading again</button>
            </div>
          )}
          {message && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl border border-amber-700/20 bg-amber-100 px-4 py-3 text-sm text-amber-950"
            >
              {message}
            </div>
          )}
          {!selected ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed border-amber-900/20 bg-white p-8 text-center">
              <Archive className="h-10 w-10 text-amber-800" />
              <h2 className="mt-4 font-serif text-3xl">
                Begin with an original
              </h2>
              <p className="mt-2 max-w-md text-neutral-600">
                Upload the highest-resolution scan you have. It stays private
                until you explicitly publish it.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-amber-950/10 bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">
                      Preserved source file
                    </p>
                    <h2 className="mt-2 font-serif text-3xl">
                      {selected.title}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {selected.estimatedDate || "Date unknown"} ·{" "}
                      {selected.people || "People not yet identified"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selected.status === "published" ? "bg-emerald-100 text-emerald-900" : "bg-stone-100"}`}
                  >
                    {selected.readOnlyLegacy
                      ? "recovered legacy"
                      : selected.status}
                  </span>
                </div>
                <Image
                  src={selected.originalUrl}
                  alt={selected.title}
                  width={1600}
                  height={1200}
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  className="max-h-[65vh] w-full bg-neutral-950 object-contain"
                />
                <div className="grid gap-3 border-t p-5 text-xs text-neutral-600 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {selected.originalName}
                    </p>
                    <p className="mt-1">
                      {selected.originalType}{" "}
                      {selected.originalBytes
                        ? `· ${(selected.originalBytes / 1024).toFixed(0)} KB`
                        : ""}
                    </p>
                    {selected.originalSha256 && (
                      <p className="mt-2 break-all font-mono text-[10px]">
                        SHA-256 {selected.originalSha256}
                      </p>
                    )}
                  </div>
                  <a
                    href={selected.originalUrl}
                    download
                    className="flex min-h-11 items-center justify-center rounded-xl bg-[#17241d] px-4 font-semibold text-white"
                  >
                    Download original
                  </a>
                </div>
              </div>
              {!selected.readOnlyLegacy && (
                <form
                  key={selected.id}
                  onChange={() => setMetadataDirty(true)}
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveRecord(event.currentTarget);
                  }}
                  className="rounded-3xl border border-amber-950/10 bg-white p-5 shadow-sm sm:p-7"
                >
                  {selected.createdBy === "public-family-contribution" ||
                  selected.contributorName ? (
                    <div className="mb-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-950">
                      <p className="flex items-center gap-2 font-semibold">
                        <UserRoundCheck className="h-5 w-5" /> Family
                        contribution awaiting review
                      </p>
                      <p className="mt-2">
                        From {selected.contributorName || "Unknown contributor"}
                        {selected.contributorRelationship
                          ? ` · ${selected.contributorRelationship}`
                          : ""}
                      </p>
                      {selected.contributorContact && (
                        <p className="mt-1">
                          Private contact: {selected.contributorContact}
                        </p>
                      )}
                      <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold">Requested handling: {selected.restorationPreference === "repair-damage" ? "Repair damage" : selected.restorationPreference === "explore-colour" ? "Explore colour" : selected.restorationPreference === "original-only" ? "Preserve only — no AI processing" : "Clean & preserve"}</p>
                    </div>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold">
                      Title
                      <input
                        name="title"
                        defaultValue={selected.title}
                        className="field mt-2 font-normal"
                      />
                    </label>
                    <label className="text-sm font-semibold">
                      Estimated date
                      <input
                        name="estimatedDate"
                        defaultValue={selected.estimatedDate || ""}
                        className="field mt-2 font-normal"
                      />
                    </label>
                    <label className="text-sm font-semibold sm:col-span-2">
                      People pictured
                      <input
                        name="people"
                        defaultValue={selected.people}
                        className="field mt-2 font-normal"
                      />
                    </label>
                    <label className="text-sm font-semibold sm:col-span-2">
                      Tags
                      <input
                        name="tags"
                        defaultValue={selected.tags.join(", ")}
                        className="field mt-2 font-normal"
                      />
                    </label>
                    <label className="text-sm font-semibold sm:col-span-2">
                      Story and provenance
                      <textarea
                        name="description"
                        rows={4}
                        defaultValue={selected.description}
                        className="field mt-2 resize-y font-normal"
                      />
                    </label>
                    <label className="text-sm font-semibold sm:col-span-2">
                      Rights note
                      <input
                        name="rights"
                        defaultValue={
                          selected.rights ||
                          "Family archive — permission required"
                        }
                        className="field mt-2 font-normal"
                      />
                    </label>
                  </div>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#17241d] px-4 font-semibold text-white"
                    >
                      <Save className="h-4 w-4" /> Save record
                    </button>
                    {selected.status === "submitted" && (
                      <>
                        <button
                          type="button"
                          onClick={(event) =>
                            saveRecord(event.currentTarget.form!, "private")
                          }
                          disabled={busy}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 font-semibold text-white"
                        >
                          <Check className="h-4 w-4" /> Accept privately
                        </button>
                        <button
                          type="button"
                          onClick={(event) =>
                            saveRecord(event.currentTarget.form!, "rejected")
                          }
                          disabled={busy}
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 px-4 font-semibold text-red-800"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </form>
              )}
              {familyAiBlocked && (
                <div className="rounded-3xl border border-emerald-900/15 bg-emerald-50 p-5 text-emerald-950 shadow-sm sm:p-7">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em]"><LockKeyhole className="h-4 w-4" /> Preserve-only contribution</p>
                  <h2 className="mt-3 font-serif text-3xl">No AI processing permission was given.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6">The original remains safely preserved and can still be catalogued or published after rights review. Do not send it to OpenAI, Google, or another model unless the contributor gives new, recorded permission.</p>
                </div>
              )}
              {isFamilyContribution && !selected.readOnlyLegacy && (
                <div className="rounded-3xl border border-amber-950/10 bg-white p-5 shadow-sm sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">Contributor AI permission</p>
                  <h2 className="mt-3 font-serif text-3xl">{familyAiBlocked ? "Record new permission only when the contributor gives it." : "Permission is active and can be withdrawn."}</h2>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">Enter a private audit note such as “confirmed by email with the contributor on 11 July 2026.” Do not infer permission. Withdrawal blocks future processing and returns any public AI study to the preserved source.</p>
                  <label className="mt-4 block text-sm font-semibold">How and when was this decision confirmed?<textarea value={aiConsentEvidence} onChange={(event) => setAiConsentEvidence(event.target.value)} rows={2} className="field mt-2 resize-y font-normal" placeholder="Private consent evidence note" /></label>
                  <button type="button" onClick={() => recordAiConsent(familyAiBlocked ? "granted" : "revoked")} disabled={busy || aiConsentEvidence.trim().length < 5} className={`mt-3 min-h-11 w-full rounded-xl px-5 font-semibold text-white disabled:opacity-40 ${familyAiBlocked ? "bg-emerald-800" : "bg-red-800"}`}>{familyAiBlocked ? "Record new AI permission" : "Withdraw AI permission"}</button>
                </div>
              )}
              {!selected.readOnlyLegacy &&
                !familyReviewPending &&
                !familyAiBlocked && (
                  <div className="rounded-3xl border border-sky-900/15 bg-sky-50 p-5 text-sky-950 shadow-sm sm:p-7">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em]">
                      <UserRoundCheck className="h-4 w-4" /> Private face review
                    </p>
                    <h2 className="mt-3 font-serif text-3xl">
                      Find visible faces, then let family name the people.
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6">
                      Gemini may count visible faces and describe broad image
                      positions. It never assigns names or infers age, gender,
                      ethnicity, health, emotion, or relationships. Every
                      observation stays private until a curator and family
                      member review it.
                    </p>
                    {selected.photoAnalysis ? (
                      <div className="mt-5 rounded-2xl bg-white p-4 text-sm">
                        <p className="font-semibold">
                          {selected.photoAnalysis.faceCount} visible{" "}
                          {selected.photoAnalysis.faceCount === 1
                            ? "face"
                            : "faces"}{" "}
                          detected
                        </p>
                        <p className="mt-2 leading-6 text-neutral-700">
                          {selected.photoAnalysis.photoSummary}
                        </p>
                        {selected.photoAnalysis.faces.length > 0 && (
                          <ul className="mt-3 list-disc space-y-1 pl-5 text-neutral-700">
                            {selected.photoAnalysis.faces.map((face, index) => (
                              <li key={`${face.location}-${index}`}>
                                {face.location} · {face.visibility}
                              </li>
                            ))}
                          </ul>
                        )}
                        {selected.photoAnalysis.suggestedTags.length > 0 && (
                          <p className="mt-3 text-xs text-neutral-600">
                            Neutral tag suggestions:{" "}
                            {selected.photoAnalysis.suggestedTags.join(", ")}
                          </p>
                        )}
                        <p className="mt-3 text-xs text-neutral-500">
                          Human review required
                          {selected.photoAnalyzedAt
                            ? ` · ${new Date(selected.photoAnalyzedAt).toLocaleString()}`
                            : ""}
                        </p>
                      </div>
                    ) : selected.photoAnalysisStatus === "failed" ? (
                      <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-red-800">
                        The last detection attempt failed. The original was not
                        changed.
                      </p>
                    ) : null}
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={analyzeFaces}
                        disabled={busy}
                        className="min-h-11 flex-1 rounded-xl bg-sky-900 px-5 font-semibold text-white disabled:opacity-40"
                      >
                        {selected.photoAnalysis
                          ? "Run face detection again"
                          : "Detect visible faces"}
                      </button>
                      <a
                        href={`/remember?kind=identify&subject=${encodeURIComponent(selected.id)}`}
                        className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-sky-900/20 bg-white px-5 text-center font-semibold"
                      >
                        Ask family to identify people
                      </a>
                    </div>
                  </div>
                )}
              {familyReviewPending && (
                <div className="rounded-3xl border border-amber-900/15 bg-amber-100/70 p-5 text-amber-950 sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[.18em]">Review gate</p>
                  <h2 className="mt-3 font-serif text-3xl">{selected.status === "rejected" ? "This contribution is rejected." : "Accept it privately before any processing or publication."}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6">Source preservation is complete. Public release and AI processing remain locked until the archive owner makes a deliberate private-review decision.</p>
                </div>
              )}
              {!selected.readOnlyLegacy && !familyReviewPending && (!sourceIsPublic || hasReadyStudy) && (
                <label className="flex items-start gap-3 rounded-2xl border border-amber-900/15 bg-white p-4 text-sm leading-6 shadow-sm">
                  <input type="checkbox" disabled={metadataDirty} checked={Boolean(publicationConfirmations[selected.id])} onChange={(event) => setPublicationConfirmations(current => ({ ...current, [selected.id]: event.target.checked }))} className="mt-1 h-4 w-4 shrink-0" />
                  <span><strong className="block">Permission and public-record check completed</strong>{metadataDirty ? "Save the edited title, rights and notes before confirming publication." : "I confirmed the archive may publish this source and metadata, and that the public record contains no private contact details or unreviewed family claims."}</span>
                </label>
              )}
              {!selected.readOnlyLegacy && !familyReviewPending && !sourceIsPublic && (
                <button
                  type="button"
                  onClick={() => publish()}
                  disabled={busy || metadataDirty || !publicationConfirmations[selected.id]}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-900/20 bg-emerald-50 px-5 font-semibold text-emerald-950"
                >
                  <Check className="h-5 w-5" /> Publish source as the public version
                </button>
              )}
              {sourceIsPublic && (
                <p className="rounded-2xl bg-emerald-100 p-4 text-sm font-semibold text-emerald-950">The preserved source is the current public version.</p>
              )}
              {!selected.readOnlyLegacy && selected.status === "published" && (
                <button type="button" onClick={() => publish(undefined, false)} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 font-semibold text-red-800"><RotateCcw className="h-4 w-4" /> Withdraw photograph from public gallery</button>
              )}
              {!selected.readOnlyLegacy && !familyAiBlocked && !familyReviewPending && (
                <div className="rounded-3xl border border-amber-950/10 bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-amber-800"><Sparkles className="h-4 w-4" /> Restoration laboratory</p><h2 className="mt-2 font-serif text-3xl">What would you like to do?</h2></div><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900">Original stays untouched</span>
                  </div>
                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    {recipes.map((option) => { const Icon = option.icon; return (
                      <label key={option.id} className={`relative cursor-pointer rounded-2xl border-2 p-5 transition focus-within:ring-4 focus-within:ring-amber-300 ${recipe === option.id ? "border-amber-700 bg-amber-50 shadow-md" : "border-neutral-200 hover:border-amber-700/40"}`}>
                        <input className="sr-only" type="radio" name="recipe" value={option.id} checked={recipe === option.id} onChange={() => setRecipe(option.id)} />
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${recipe === option.id ? "bg-amber-800 text-white" : "bg-stone-100 text-neutral-600"}`}><Icon className="h-5 w-5" /></span>
                        <strong className="mt-4 block text-lg">{option.name}</strong><span className="mt-2 block text-sm leading-6 text-neutral-500">{option.note}</span><span className="mt-4 inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-neutral-600">{option.badge}</span>
                      </label>
                    ); })}
                  </div>
                  <div className="mt-6">
                    <label className="text-sm font-semibold">Anything the model must know?<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="field mt-2 resize-y font-normal" rows={3} placeholder="Optional: preserve handwriting, known uniform colour, damaged corner, location, or other verified context…" /></label>
                    <div className="mt-3 flex flex-wrap gap-2">{["Preserve all handwriting", "Do not alter faces", "Keep the full border", "Leave uncertain areas unchanged"].map(suggestion => <button type="button" key={suggestion} onClick={() => setNotes(value => value ? `${value}; ${suggestion}` : suggestion)} className="min-h-10 rounded-full border border-amber-950/15 px-3 text-xs font-semibold">+ {suggestion}</button>)}</div>
                    <details className="mt-5 rounded-2xl bg-stone-100 p-4"><summary className="cursor-pointer text-sm font-semibold">Advanced engine choice · {models.find(option => option.id === model)?.name}</summary><p className="mt-2 text-xs leading-5 text-neutral-500">The preset controls historical intent. Engine choice is technical and every exact model is recorded.</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{models.map(option => <label key={option.id} className={`cursor-pointer rounded-xl border p-3 text-sm ${model === option.id ? "border-amber-700 bg-white" : "border-transparent"}`}><input className="mr-2" type="radio" name="model" value={option.id} checked={model === option.id} onChange={() => setModel(option.id)} /><strong>{option.name}</strong><span className="mt-1 block text-xs text-neutral-500">{option.note}</span></label>)}</div></details>
                    <button
                      onClick={restore}
                      disabled={busy}
                      className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-5 font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}{" "}
                      Create {recipes.find(option => option.id === recipe)?.name.toLowerCase()} study
                    </button>
                    <p className="mt-3 text-xs leading-5 text-neutral-500">
                      Every run records the exact prompt, provider, dated model,
                      preset, reviewer and output checksum. Nothing publishes automatically.
                    </p>
                  </div>
                </div>
              )}
              {selected.runs.map((run) => (
                <article
                  key={run.id}
                  className="overflow-hidden rounded-3xl border border-amber-950/10 bg-white shadow-sm"
                >
                  <div className="border-b p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-[.16em]">{recipes.find(option => option.id === run.recipe)?.name || run.recipe} · {run.model}</p><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">{run.status}</span></div>{run.outputUrl ? <RestorationCompare originalUrl={selected.originalUrl} studyUrl={run.outputUrl} title={selected.title} studyLabel={recipes.find(option => option.id === run.recipe)?.name || "Restoration study"} /> : <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-stone-100 p-6 text-center text-sm text-neutral-500">{run.error || "Processing…"}</div>}</div>
                  <div className="p-5">
                    <details>
                      <summary className="cursor-pointer text-sm font-semibold">
                        {selected.readOnlyLegacy
                          ? "Legacy provenance note"
                          : "View exact preservation prompt"}
                      </summary>
                      <p className="mt-3 rounded-xl bg-stone-100 p-4 text-sm leading-6 text-neutral-700">
                        {run.prompt}
                      </p>
                    </details>
                    {run.outputUrl && !selected.readOnlyLegacy && (
                      <div className="mt-5"><label className="mb-3 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><input type="checkbox" checked={Boolean(reviewedRuns[run.id])} onChange={(event) => setReviewedRuns(value => ({ ...value, [run.id]: event.target.checked }))} className="mt-1 h-4 w-4 shrink-0" /><span><strong className="block">Human comparison completed</strong>I checked faces, hands, text, clothing, borders, crop and alignment against the source and accept every visible change as a labelled study.</span></label><div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => publish(run.id)}
                          disabled={busy || metadataDirty || !reviewedRuns[run.id] || !publicationConfirmations[selected.id]}
                          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Check className="h-4 w-4" /> Approve & publish study
                        </button>
                      </div></div>
                    )}
                  </div>
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
