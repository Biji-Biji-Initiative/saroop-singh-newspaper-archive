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

type ContributionBatch = {
  receiptToken: string;
  uploadToken: string;
};

type ContributionFile = {
  id: string;
  file: File;
};

const opaqueToken = () =>
  `${crypto.randomUUID()}${crypto.randomUUID().replaceAll("-", "")}`;

export function ContributionForm() {
  const [files, setFiles] = useState<ContributionFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    duplicates: number;
    errors: string[];
    receiptUrl?: string;
  } | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [restorationPreference, setRestorationPreference] = useState("clean-preserve");
  const [allowAiStudy, setAllowAiStudy] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<Record<string, PhotoDetails>>({});
  const [batch, setBatch] = useState<ContributionBatch>();
  const [progress, setProgress] = useState<{ current: number; total: number; name: string }>();
  const [dropActive, setDropActive] = useState(false);
  const previews = useMemo(
    () => files.map(({ id, file }) => ({ file, key: id, url: URL.createObjectURL(file) })),
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
    setBatch(undefined);
    const selectedFiles = safe.map((file) => ({ id: crypto.randomUUID(), file }));
    setFiles(selectedFiles);
    setFileMetadata(
      Object.fromEntries(
        selectedFiles.map(({ id, file }) => [
          id,
          {
            title: file.name.replace(/\.[^.]+$/, ""),
            estimatedDate: "",
            people: "",
            story: "",
          },
        ]),
      ),
    );
  }

  function updatePhoto(id: string, updates: Partial<PhotoDetails>) {
    setFileMetadata((current) => ({
      ...current,
      [id]: { ...current[id], ...updates },
    }));
  }

  function removePhoto(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
    setFileMetadata((current) =>
      Object.fromEntries(Object.entries(current).filter(([entryKey]) => entryKey !== id)),
    );
    setResult(null);
  }

  function clearSelection() {
    setFiles([]);
    setFileMetadata({});
    setSelectionError("");
    setResult(null);
    setBatch(undefined);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length) return;
    setBusy(true);
    setResult(null);
    const activeBatch = batch || {
      receiptToken: opaqueToken(),
      uploadToken: opaqueToken(),
    };
    if (!batch) setBatch(activeBatch);
    const base = new FormData(event.currentTarget);
    let sent = 0;
    let duplicates = 0;
    const errors: string[] = [];
    const failedFiles: ContributionFile[] = [];
    let receiptUrl: string | undefined;
    for (let index = 0; index < files.length; index += 1) {
      const item = files[index];
      const { file, id: clientItemId } = item;
      const metadata = fileMetadata[clientItemId];
      setProgress({ current: index + 1, total: files.length, name: file.name });
      const form = new FormData();
      for (const [key, value] of base.entries())
        if (key !== "file") form.append(key, value);
      form.set("file", file);
      form.set("title", metadata?.title || file.name.replace(/\.[^.]+$/, ""));
      form.set("estimatedDate", metadata?.estimatedDate || "");
      form.set("people", metadata?.people || "");
      form.set("story", metadata?.story || "");
      form.set("receiptToken", activeBatch.receiptToken);
      form.set("uploadToken", activeBatch.uploadToken);
      form.set("clientItemId", clientItemId);
      try {
        const response = await fetch("/api/contribute", {
          method: "POST",
          body: form,
        });
        const data = await response.json();
        if (response.ok && data.duplicate) {
          duplicates += 1;
          receiptUrl ||= data.receiptUrl;
        } else if (response.ok) {
          sent += 1;
          receiptUrl ||= data.receiptUrl;
        } else if (response.status === 409 && data.existingId) duplicates += 1;
        else {
          errors.push(`${file.name}: ${data.error || "Could not submit"}`);
          failedFiles.push(item);
        }
      } catch {
        errors.push(`${file.name}: connection failed`);
        failedFiles.push(item);
      }
    }
    if (sent + duplicates > 0 && errors.length === 0 && receiptUrl) {
      window.location.href = receiptUrl;
      return;
    }
    setResult({ sent, duplicates, errors, receiptUrl });
    setBusy(false);
    setProgress(undefined);
    setFiles(failedFiles);
    setFileMetadata((current) =>
      Object.fromEntries(
        failedFiles.map((item) => [item.id, current[item.id]]),
      ),
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[.7fr_1.3fr]">
      <aside className="rounded-3xl bg-amber-100/70 p-6 sm:p-8">
        <ShieldCheck className="h-8 w-8 text-amber-900" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-amber-800">A gentle family workflow</p>
        <h2 className="mt-2 font-serif text-3xl">Send what you have. We will handle the archive work carefully.</h2>
        <p className="mt-4 text-sm leading-6 text-amber-950/75">You do not need a perfect scan, an account, or every answer today. Start with the photograph; names and stories can be added or corrected later.</p>
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
            <strong>3. Studied only with permission.</strong>
            <br />
            If you opt in, a curator can create a private, labelled AI study for comparison. Nothing becomes public automatically.
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
        <label
          onDragEnter={(event) => { event.preventDefault(); setDropActive(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { event.preventDefault(); setDropActive(false); }}
          onDrop={(event) => { event.preventDefault(); setDropActive(false); selectFiles(Array.from(event.dataTransfer.files)); }}
          className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition focus-within:ring-4 focus-within:ring-amber-300 ${dropActive ? "border-amber-700 bg-amber-100 shadow-inner" : "border-amber-900/20 bg-amber-50/60 hover:border-amber-700/60"}`}
        >
          <ImagePlus className="h-8 w-8 text-amber-800" />
          <span className="mt-3 text-lg font-semibold">
            Drop family photographs here or choose files
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
            onChange={(event) => {
              selectFiles(Array.from(event.target.files || []));
              event.currentTarget.value = "";
            }}
          />
        </label>
        <p id="file-help" className="mt-3 text-center text-xs leading-5 text-neutral-500">A phone photograph is fine. Send the clearest original you have; leave dates or names blank when you are unsure.</p>
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
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">Step 2 of 4</p><h3 className="mt-1 font-serif text-2xl">Describe each photograph</h3><p className="mt-1 text-sm leading-6 text-neutral-500">Each file becomes its own archive record. Add only what you know; “unknown” is always acceptable.</p></div><button type="button" onClick={clearSelection} className="min-h-11 rounded-full border border-amber-900/20 bg-white px-4 text-sm font-semibold text-amber-950">Start over</button></div>
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
        <section className="mt-6 rounded-2xl border border-amber-950/10 bg-amber-50/70 p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">Step 3 of 4 · Your choice</p><div className="mt-3 flex items-start gap-3"><input id="ai-study-consent" type="checkbox" name="aiProcessingConsent" value="yes" checked={allowAiStudy} onChange={(event) => setAllowAiStudy(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" /><label htmlFor="ai-study-consent" className="text-sm leading-6"><strong className="block text-base">May the archive create a private AI restoration study?</strong>After family review, the archive owner may send a working copy and the notes entered here to OpenAI or Google. The original remains untouched, every result is labelled with its model and prompt record, and nothing is public automatically. Leave this unticked to preserve only.</label></div>
        {allowAiStudy && <fieldset className="mt-5"><legend className="text-sm font-semibold">Choose one restoration intention</legend><p className="mt-1 text-xs leading-5 text-neutral-500">The family chooses the intention; the archive owner reviews the result before any publication.</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{[
          { id: "clean-preserve", title: "Clean & preserve", note: "Dust, scratches and faded tones only", icon: ShieldCheck },
          { id: "repair-damage", title: "Repair damage", note: "Tears and missing paper, reviewed closely", icon: Hammer },
          { id: "explore-colour", title: "Explore colour", note: "A labelled interpretation, never historical fact", icon: Palette },
        ].map(option => { const Icon = option.icon; return <label key={option.id} className={`cursor-pointer rounded-2xl border-2 p-4 focus-within:ring-4 focus-within:ring-amber-300 ${restorationPreference === option.id ? "border-amber-700 bg-white" : "border-neutral-200 bg-white/60"}`}><input className="sr-only" type="radio" name="restorationPreference" value={option.id} checked={restorationPreference === option.id} onChange={() => setRestorationPreference(option.id)} /><Icon className="h-6 w-6 text-amber-800" /><strong className="mt-3 block">{option.title}</strong><span className="mt-1 block text-xs leading-5 text-neutral-500">{option.note}</span></label>; })}</div></fieldset>}
        {!allowAiStudy && <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-900">Preserve only selected. These files cannot be sent to an AI provider.</p>}</section>
        <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">Step 4 of 4 · Who is contributing?</p><div className="mt-3 grid gap-4 sm:grid-cols-2">
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
        </div></div>
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
            {result.receiptUrl && (
              <Link
                href={result.receiptUrl}
                className="mt-4 inline-flex min-h-11 items-center rounded-full border border-current px-4 font-semibold"
              >
                Open your private receipt
              </Link>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
