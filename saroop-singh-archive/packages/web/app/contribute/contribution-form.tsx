"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Hammer,
  Palette,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PhotoDetails = {
  title: string;
  estimatedDate: string;
  people: string;
  story: string;
};

const fileKey = (file: File) =>
  `${file.name}:${file.size}:${file.lastModified}`;

export function ContributionForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    duplicates: number;
    errors: string[];
  } | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [restorationPreference, setRestorationPreference] = useState("clean-preserve");
  const [allowAiStudy, setAllowAiStudy] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<Record<string, PhotoDetails>>({});
  const [progress, setProgress] = useState<{ current: number; total: number; name: string }>();
  const previews = useMemo(
    () => files.map((file) => ({ file, key: fileKey(file), url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  function selectFiles(selected: File[]) {
    const allowed = selected.slice(0, 12);
    const tooLarge = allowed.filter((file) => file.size > 25 * 1024 * 1024);
    const safe = allowed.filter((file) => file.size <= 25 * 1024 * 1024);
    const messages = [];
    if (selected.length > 12)
      messages.push("Choose up to 12 photographs at a time.");
    if (tooLarge.length)
      messages.push(
        `${tooLarge.length} file${tooLarge.length === 1 ? " is" : "s are"} larger than 25 MB.`,
      );
    setSelectionError(messages.join(" "));
    setResult(null);
    setFiles(safe);
    setFileMetadata((current) =>
      Object.fromEntries(
        safe.map((file) => {
          const key = fileKey(file);
          return [
            key,
            current[key] || {
              title: file.name.replace(/\.[^.]+$/, ""),
              estimatedDate: "",
              people: "",
              story: "",
            },
          ];
        }),
      ),
    );
  }

  function updatePhoto(key: string, updates: Partial<PhotoDetails>) {
    setFileMetadata((current) => ({
      ...current,
      [key]: { ...current[key], ...updates },
    }));
  }

  function removePhoto(key: string) {
    setFiles((current) => current.filter((file) => fileKey(file) !== key));
    setFileMetadata((current) =>
      Object.fromEntries(Object.entries(current).filter(([entryKey]) => entryKey !== key)),
    );
    setResult(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length) return;
    setBusy(true);
    setResult(null);
    const base = new FormData(event.currentTarget);
    let sent = 0;
    let duplicates = 0;
    const errors: string[] = [];
    const failedFiles: File[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const metadata = fileMetadata[fileKey(file)];
      setProgress({ current: index + 1, total: files.length, name: file.name });
      const form = new FormData();
      for (const [key, value] of base.entries())
        if (key !== "file") form.append(key, value);
      form.set("file", file);
      form.set("title", metadata?.title || file.name.replace(/\.[^.]+$/, ""));
      form.set("estimatedDate", metadata?.estimatedDate || "");
      form.set("people", metadata?.people || "");
      form.set("story", metadata?.story || "");
      try {
        const response = await fetch("/api/contribute", {
          method: "POST",
          body: form,
        });
        const data = await response.json();
        if (response.ok && data.duplicate) duplicates += 1;
        else if (response.ok) sent += 1;
        else if (response.status === 409 && data.existingId) duplicates += 1;
        else {
          errors.push(`${file.name}: ${data.error || "Could not submit"}`);
          failedFiles.push(file);
        }
      } catch {
        errors.push(`${file.name}: connection failed`);
        failedFiles.push(file);
      }
    }
    setResult({ sent, duplicates, errors });
    setBusy(false);
    setProgress(undefined);
    setFiles(failedFiles);
    setFileMetadata((current) =>
      Object.fromEntries(
        failedFiles.map((file) => [fileKey(file), current[fileKey(file)]]),
      ),
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[.7fr_1.3fr]">
      <aside className="rounded-3xl bg-amber-100/70 p-6 sm:p-8">
        <ShieldCheck className="h-8 w-8 text-amber-900" />
        <h2 className="mt-5 font-serif text-3xl">What happens next</h2>
        <ol className="mt-6 space-y-5 text-sm leading-6">
          <li>
            <strong>1. Preserved privately.</strong>
            <br />
            We secure the exact source file and its checksum.
          </li>
          <li>
            <strong>2. Reviewed by family.</strong>
            <br />
            Names, dates and stories are checked before publication.
          </li>
          <li>
            <strong>3. Published deliberately.</strong>
            <br />
            Nothing becomes public automatically.
          </li>
        </ol>
        <p className="mt-7 flex gap-2 border-t border-amber-900/15 pt-5 text-xs leading-5 text-amber-950/70">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /> Contact details
          are for archive follow-up and are never displayed publicly.
        </p>
      </aside>
      <form
        onSubmit={submit}
        className="rounded-3xl border border-amber-950/10 bg-white p-5 shadow-sm sm:p-8"
      >
        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-900/20 bg-amber-50/60 p-5 text-center focus-within:ring-4 focus-within:ring-amber-300">
          <ImagePlus className="h-8 w-8 text-amber-800" />
          <span className="mt-3 text-lg font-semibold">
            Choose family photographs
          </span>
          <span className="mt-1 text-sm text-neutral-500">
            JPEG, PNG or WebP · up to 25 MB each · 12 at a time
          </span>
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            aria-describedby="file-help file-error"
            onChange={(event) =>
              selectFiles(Array.from(event.target.files || []))
            }
          />
        </label>
        <p id="file-help" className="sr-only">
          Choose up to twelve JPEG, PNG, or WebP photographs, no larger than 25
          megabytes each.
        </p>
        {selectionError && (
          <p
            id="file-error"
            role="alert"
            className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-900"
          >
            {selectionError}
          </p>
        )}
        {previews.length > 0 && (
          <div className="mt-5 space-y-3">
            <div>
              <h3 className="font-serif text-2xl">Describe each photograph</h3>
              <p className="mt-1 text-sm leading-6 text-neutral-500">Each file becomes its own archive record. Add only what you know; “unknown” is always acceptable.</p>
            </div>
            {previews.map(({ file, key, url }, index) => {
              const metadata = fileMetadata[key];
              return <article key={key} className="rounded-2xl border border-amber-950/10 bg-stone-50 p-3 sm:p-4">
                <div className="grid grid-cols-[5.5rem_1fr] items-start gap-3 sm:grid-cols-[7rem_1fr]">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-200"><Image src={url} alt="" fill unoptimized sizes="112px" className="object-cover" /></div>
                  <div className="min-w-0"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.14em] text-amber-800">Photo {index + 1} of {previews.length}</p><p className="mt-1 truncate text-xs text-neutral-500">{file.name}</p></div><button type="button" onClick={() => removePhoto(key)} aria-label={`Remove ${file.name}`} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600"><X className="h-4 w-4" /></button></div><label className="mt-2 block text-sm font-semibold">Title or short identification<input value={metadata?.title || ""} onChange={(event) => updatePhoto(key, { title: event.target.value })} className="field mt-1 font-normal" /></label></div>
                </div>
                <details className="mt-3 rounded-xl bg-white p-3" open={previews.length === 1}><summary className="cursor-pointer text-sm font-semibold">Add date, names and story</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Estimated date<input value={metadata?.estimatedDate || ""} onChange={(event) => updatePhoto(key, { estimatedDate: event.target.value })} placeholder="e.g. c. 1952" className="field mt-1 font-normal" /></label><label className="text-sm font-semibold">People pictured<input value={metadata?.people || ""} onChange={(event) => updatePhoto(key, { people: event.target.value })} placeholder="Left to right, if known" className="field mt-1 font-normal" /></label><label className="text-sm font-semibold sm:col-span-2">What do you know about it?<textarea value={metadata?.story || ""} onChange={(event) => updatePhoto(key, { story: event.target.value })} rows={3} placeholder="Place, occasion, writing on the back, who kept it…" className="field mt-1 resize-y font-normal" /></label></div></details>
              </article>;
            })}
          </div>
        )}
        <section className="mt-6 rounded-2xl border border-amber-950/10 bg-amber-50/70 p-4 sm:p-5"><div className="flex items-start gap-3"><input id="ai-study-consent" type="checkbox" name="aiProcessingConsent" value="yes" checked={allowAiStudy} onChange={(event) => setAllowAiStudy(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" /><label htmlFor="ai-study-consent" className="text-sm leading-6"><strong className="block text-base">Optional: allow a private AI restoration study</strong>After family review, the archive owner may send a working copy of these photographs and the notes entered here to the selected image provider (OpenAI or Google) to create a private study. The preserved source is never replaced and nothing publishes automatically. Leave this unticked to preserve only.</label></div>
        {allowAiStudy && <fieldset className="mt-5"><legend className="text-sm font-semibold">Choose one restoration intention</legend><p className="mt-1 text-xs leading-5 text-neutral-500">The family chooses the intention; the archive owner reviews the result before any publication.</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{[
          { id: "clean-preserve", title: "Clean & preserve", note: "Dust, scratches and faded tones only", icon: ShieldCheck },
          { id: "repair-damage", title: "Repair damage", note: "Tears and missing paper, reviewed closely", icon: Hammer },
          { id: "explore-colour", title: "Explore colour", note: "A labelled interpretation, never historical fact", icon: Palette },
        ].map(option => { const Icon = option.icon; return <label key={option.id} className={`cursor-pointer rounded-2xl border-2 p-4 focus-within:ring-4 focus-within:ring-amber-300 ${restorationPreference === option.id ? "border-amber-700 bg-white" : "border-neutral-200 bg-white/60"}`}><input className="sr-only" type="radio" name="restorationPreference" value={option.id} checked={restorationPreference === option.id} onChange={() => setRestorationPreference(option.id)} /><Icon className="h-6 w-6 text-amber-800" /><strong className="mt-3 block">{option.title}</strong><span className="mt-1 block text-xs leading-5 text-neutral-500">{option.note}</span></label>; })}</div></fieldset>}
        {!allowAiStudy && <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-900">Preserve only selected. These files cannot be sent to an AI provider.</p>}</section>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Your name *
            <input
              name="contributorName"
              required
              className="field mt-2 font-normal"
            />
          </label>
          <label className="text-sm font-semibold">
            Relationship to the family
            <input
              name="relationship"
              placeholder="e.g. granddaughter, cousin"
              className="field mt-2 font-normal"
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Email or phone for follow-up
            <input
              name="contact"
              inputMode="email"
              className="field mt-2 font-normal"
            />
          </label>
        </div>
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-stone-100 p-4 text-sm leading-6">
          <input
            id="private-preservation-consent"
            type="checkbox"
            name="consent"
            value="yes"
            required
            className="mt-1 h-4 w-4"
          />
          <div>
            <label htmlFor="private-preservation-consent">
            I have the right to share these files and allow the Saroop Singh
            Archive to preserve them privately for family review. Publication
            requires a separate decision.
            </label>{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="font-semibold underline underline-offset-4"
            >
              Read the privacy policy
            </Link>
            .
          </div>
        </div>
        <button
          disabled={busy || !files.length}
          aria-busy={busy}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17241d] px-5 font-semibold text-white disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}{" "}
          {busy
            ? progress
              ? `Preserving ${progress.current} of ${progress.total}…`
              : "Preserving securely…"
            : `Submit ${files.length || ""} ${files.length === 1 ? "photograph" : "photographs"}`}
        </button>
        {result && (
          <div
            aria-live="polite"
            className={`mt-4 rounded-2xl p-4 text-sm ${result.errors.length ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900"}`}
          >
            {result.sent > 0 && (
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" /> {result.sent} photograph
                {result.sent === 1 ? "" : "s"} safely received.
              </p>
            )}
            {result.duplicates > 0 && (
              <p className="mt-2 font-semibold">{result.duplicates} exact file{result.duplicates === 1 ? " was" : "s were"} already safely preserved. Your new names, story, contact and consent choice were attached as a separate private review event; no duplicate blob was created.</p>
            )}
            {result.errors.map((error) => (
              <p key={error} className="mt-2">
                {error}
              </p>
            ))}
          </div>
        )}
      </form>
    </section>
  );
}
