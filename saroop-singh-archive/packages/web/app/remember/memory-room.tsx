"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Mic,
  PencilLine,
  RotateCcw,
  ScanFace,
  Square,
  StopCircle,
  X,
} from "lucide-react";
import { fetchAllPublicGallery } from "@/lib/fetch-public-gallery";
import { framePointToImageAnchor, imageAnchorToFramePercent } from "@/lib/image-anchor";

type Kind =
  "identify" | "story" | "correction" | "photograph" | "reverse" | "voice";
type GalleryItem = {
  id: string;
  title: string;
  originalUrl: string;
};
const actions: Array<{
  kind: Kind;
  title: string;
  note: string;
  icon: typeof ScanFace;
}> = [
  {
    kind: "identify",
    title: "Identify someone",
    note: "Tap where they appear and suggest a name",
    icon: ScanFace,
  },
  {
    kind: "story",
    title: "Tell a story",
    note: "Preserve what happened or what was remembered",
    icon: PencilLine,
  },
  {
    kind: "correction",
    title: "Correct a detail",
    note: "Flag a name, date, place or description",
    icon: RotateCcw,
  },
  {
    kind: "photograph",
    title: "Add a photograph",
    note: "Preserve the highest-quality original you have",
    icon: ImagePlus,
  },
  {
    kind: "reverse",
    title: "Scan the back",
    note: "Capture handwriting, stamps and inscriptions",
    icon: Camera,
  },
  {
    kind: "voice",
    title: "Record a voice",
    note: "Tell a short memory in your own language",
    icon: Mic,
  },
];

export function MemoryRoom({
  initialSubject,
  initialKind,
}: {
  initialSubject?: string;
  initialKind?: string;
}) {
  const allowedKinds: Kind[] = [
    "identify",
    "story",
    "correction",
    "photograph",
    "reverse",
    "voice",
  ];
  const [kind, setKind] = useState<Kind>(
    allowedKinds.includes(initialKind as Kind)
      ? (initialKind as Kind)
      : "identify",
  );
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(false);
  const [subject, setSubject] = useState<GalleryItem>();
  const [anchor, setAnchor] = useState<{ x: number; y: number }>();
  const [positionDescription, setPositionDescription] = useState("");
  const [reverseSubjectId, setReverseSubjectId] = useState(initialSubject || "");
  const [subjectDimensions, setSubjectDimensions] = useState<{ width: number; height: number }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audio, setAudio] = useState<Blob>();
  const [pickedFile, setPickedFile] = useState<{ name: string; size: number; type: string; url: string }>();
  const recorder = useRef<MediaRecorder | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectImageRef = useRef<HTMLImageElement>(null);
  const recordingStream = useRef<MediaStream | null>(null);
  const discardOnStop = useRef(false);
  const audioUrl = useMemo(() => audio ? URL.createObjectURL(audio) : undefined, [audio]);
  const markerPosition = useMemo(
    () => anchor && subjectDimensions
      ? imageAnchorToFramePercent(anchor, 4, 3, subjectDimensions.width, subjectDimensions.height)
      : null,
    [anchor, subjectDimensions],
  );
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => () => { if (pickedFile?.url) URL.revokeObjectURL(pickedFile.url); }, [pickedFile]);
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(
      () => setRecordingSeconds((value) => Math.min(value + 1, 300)),
      1000,
    );
    const automaticStop = window.setTimeout(() => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      setRecording(false);
    }, 300_000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(automaticStop);
    };
  }, [recording]);
  useEffect(() => () => {
    discardOnStop.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
    recordingStream.current?.getTracks().forEach(track => track.stop());
  }, []);
  const acceptGallery = useCallback((result: { items: GalleryItem[] }) => {
    const loaded = result.items;
    setItems(loaded);
    setSubject((current) => {
      const requestedId = initialSubject || current?.id;
      return requestedId
        ? loaded.find((item) => item.id === requestedId)
        : undefined;
    });
  }, [initialSubject]);
  const requestGallery = useCallback(() => fetchAllPublicGallery<GalleryItem>(), []);
  const loadGallery = useCallback(() => {
    setGalleryLoading(true);
    setGalleryError(false);
    requestGallery()
      .then(acceptGallery)
      .catch(() => setGalleryError(true))
      .finally(() => setGalleryLoading(false));
  }, [acceptGallery, requestGallery]);
  useEffect(() => {
    let active = true;
    requestGallery()
      .then((loaded) => { if (active) acceptGallery(loaded); })
      .catch(() => { if (active) setGalleryError(true); })
      .finally(() => { if (active) setGalleryLoading(false); });
    return () => { active = false; };
  }, [acceptGallery, requestGallery]);
  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      clearPickedFile();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      discardOnStop.current = false;
      recordingStream.current = stream;
      setAudio(undefined);
      setRecordingSeconds(0);
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = () => {
        if (!discardOnStop.current)
          setAudio(new Blob(chunks, { type: media.mimeType || "audio/webm" }));
        stream.getTracks().forEach((track) => track.stop());
        recordingStream.current = null;
        discardOnStop.current = false;
      };
      recorder.current = media;
      media.start();
      setRecording(true);
    } catch {
      setError(
        "Microphone access was unavailable. You can upload an existing recording instead.",
      );
    }
  }
  function discardVoice() {
    discardOnStop.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
    recordingStream.current?.getTracks().forEach(track => track.stop());
    recordingStream.current = null;
    setRecording(false);
    setRecordingSeconds(0);
    setAudio(undefined);
  }
  function clearPickedFile() {
    if (pickedFile?.url) URL.revokeObjectURL(pickedFile.url);
    setPickedFile(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  function chooseFile(file?: File) {
    if (kind === "voice") discardVoice();
    if (pickedFile?.url) URL.revokeObjectURL(pickedFile.url);
    setPickedFile(file ? { name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) } : undefined);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("kind", kind);
    // A story may stand on its own or deliberately link a selected photograph.
    // Only identification and correction actions require a photo-bound subject;
    const shouldAttachSubject =
      ["identify", "correction"].includes(kind) ||
      Boolean(initialSubject) ||
      (kind === "story" && Boolean(subject));
    if (kind === "reverse" && reverseSubjectId) form.set("subjectId", reverseSubjectId);
    else if (shouldAttachSubject && subject) form.set("subjectId", subject.id);
    else if (shouldAttachSubject && initialSubject)
      form.set("subjectId", initialSubject);
    if (anchor) {
      form.set("anchorX", String(anchor.x));
      form.set("anchorY", String(anchor.y));
    }
    if (
      audio &&
      kind === "voice" &&
      !(form.get("file") instanceof File && (form.get("file") as File).size)
    )
      form.set(
        "file",
        new File([audio], `voice-memory-${Date.now()}.webm`, {
          type: audio.type,
        }),
      );
    try {
      const response = await fetch("/api/memories", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not preserve this memory.");
      location.href = data.receiptUrl;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Connection failed.");
      setBusy(false);
    }
  }
  const externalCorrection =
    kind === "correction" && Boolean(initialSubject) && !subject;
  const requiresPhoto =
    ["identify", "story", "correction"].includes(kind) && !externalCorrection;
  const hasSubject = Boolean(subject || initialSubject);
  const subjectRequired =
    ["identify", "correction"].includes(kind) && !hasSubject;
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              type="button"
              key={action.kind}
              aria-pressed={kind === action.kind}
              onClick={() => {
                if (action.kind === "photograph") {
                  window.location.href = "/contribute";
                  return;
                }
                if (action.kind !== "voice") discardVoice();
                setKind(action.kind);
                setError("");
                setAnchor(undefined);
                setPositionDescription("");
                clearPickedFile();
                if (action.kind === "reverse") setReverseSubjectId(initialSubject || "");
                requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }}
              className={`rounded-2xl border p-5 text-left transition ${kind === action.kind ? "border-amber-700 bg-amber-100 shadow-md" : "border-amber-950/10 bg-white hover:-translate-y-0.5 hover:shadow-md"}`}
            >
              <Icon className="h-7 w-7 text-amber-800" />
              <span className="mt-4 block font-serif text-2xl">
                {action.title}
              </span>
              <span className="mt-1 block text-sm leading-6 text-neutral-600">
                {action.note}
              </span>
            </button>
          );
        })}
      </div>
      <form
        ref={formRef}
        onSubmit={submit}
        className="mt-8 grid gap-7 rounded-[2rem] border border-amber-950/10 bg-white p-5 shadow-xl sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]"
      >
        <div className="min-w-0">
          {externalCorrection ? (
            <div className="rounded-2xl bg-amber-100 p-6">
              <p className="text-xs font-semibold uppercase tracking-[.15em] text-amber-800">Correction attached to record</p>
              <p className="mt-3 break-all font-mono text-sm">{initialSubject}</p>
              <p className="mt-4 text-sm leading-6 text-amber-950/70">Your correction remains linked to this source during private review.</p>
            </div>
          ) : requiresPhoto ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-800">
                {kind === "story" ? "Choose a photograph (optional)" : "Choose a photograph"}
              </p>
              {galleryLoading && <p className="mt-4 rounded-xl bg-stone-100 p-4 text-sm text-neutral-600">Loading the complete public collection…</p>}
              {galleryError && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-900"><p>The photographs could not be loaded.</p><button type="button" onClick={loadGallery} className="mt-3 min-h-11 rounded-full bg-red-900 px-5 font-semibold text-white">Try again</button></div>}
              {!galleryLoading && !galleryError && items.length === 0 && <p className="mt-4 rounded-xl bg-stone-100 p-4 text-sm text-neutral-600">No public photographs are available yet.</p>}
              <div className="mt-4 flex min-w-0 gap-3 overflow-x-auto pb-3">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={subject?.id === item.id}
                    onClick={() => {
                      setSubject(item);
                      setAnchor(undefined);
                      setPositionDescription("");
                      setSubjectDimensions(undefined);
                    }}
                    className={`w-28 shrink-0 overflow-hidden rounded-xl border-2 text-left ${subject?.id === item.id ? "border-amber-700" : "border-transparent"}`}
                  >
                    <span className="relative block aspect-square bg-stone-100">
                      <Image
                        src={item.originalUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="112px"
                        className="object-cover"
                      />
                    </span>
                    <span className="line-clamp-2 p-2 text-xs font-semibold">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
              {subject && (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-neutral-600">
                    {kind === "identify"
                      ? "Tap the person you recognise."
                      : "Selected photograph"}
                  </p>
                  <button
                    type="button"
                    aria-label={kind === "identify" ? `Mark the person in ${subject.title}` : `Selected photograph: ${subject.title}`}
                    className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-950"
                    onClick={(event) => {
                      if (kind !== "identify") return;
                      const rect = event.currentTarget.getBoundingClientRect();
                      const imageElement = subjectImageRef.current;
                      const point = imageElement ? framePointToImageAnchor(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height, imageElement.naturalWidth, imageElement.naturalHeight) : null;
                      if (!point) {
                        setError("Tap inside the photograph rather than the surrounding black bars, or describe the person’s position in words.");
                        return;
                      }
                      setError("");
                      setAnchor(point);
                    }}
                  >
                    <Image
                      ref={subjectImageRef}
                      src={subject.originalUrl}
                      alt={subject.title}
                      fill
                      unoptimized
                      sizes="(max-width:1024px) 100vw,50vw"
                      className="object-contain"
                      onLoad={(event) => setSubjectDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                    />
                    {markerPosition && (
                      <span
                        className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-amber-400/70 shadow-xl"
                        style={{
                          left: `${markerPosition.x}%`,
                          top: `${markerPosition.y}%`,
                        }}
                      />
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
            {kind === "reverse" && (
              <label className="mb-3 block text-sm font-semibold">Which front photograph does this belong to?<select value={reverseSubjectId} onChange={(event) => setReverseSubjectId(event.target.value)} className="field mt-2 font-normal"><option value="">Unknown or not yet in the collection</option>{items.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><span className="mt-1 block text-xs font-normal leading-5 text-neutral-500">Linking front and back preserves handwriting and provenance together.</span></label>
            )}
            <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-900/20 bg-amber-50 p-6 text-center focus-within:ring-4 focus-within:ring-amber-300">
              {kind === "voice" ? (
                <Mic className="h-10 w-10 text-amber-800" />
              ) : (
                <ImagePlus className="h-10 w-10 text-amber-800" />
              )}
              <span className="mt-4 font-serif text-3xl">
                {kind === "voice"
                  ? "Your voice is the original"
                  : kind === "reverse"
                    ? "Photograph the entire back"
                    : "Choose the best source file"}
              </span>
              <span className="mt-2 text-sm text-neutral-500">
                {kind === "voice"
                  ? "MP3, M4A, WAV, OGG or WebM"
                  : "JPEG, PNG or WebP · up to 50 MB"}
              </span>
              <input
                ref={fileInputRef}
                name="file"
                type="file"
                accept={
                  kind === "voice"
                    ? "audio/*"
                    : "image/jpeg,image/png,image/webp"
                }
                capture={kind === "voice" ? undefined : "environment"}
                className="sr-only"
                required={kind !== "voice" || !audio}
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
            </label>
            {pickedFile && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-amber-950/10 bg-white">
                {pickedFile.type.startsWith("image/") && <div className="relative aspect-[4/3] bg-neutral-950"><Image src={pickedFile.url} alt="Selected contribution preview" fill unoptimized sizes="(max-width:1024px) 100vw,50vw" className="object-contain" /></div>}
                {pickedFile.type.startsWith("audio/") && <div className="bg-[#17241d] p-4"><audio controls preload="metadata" src={pickedFile.url} className="w-full" /></div>}
                <div className="flex items-center justify-between gap-3 p-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold">{pickedFile.name}</p><p className="text-xs text-neutral-500">{(pickedFile.size / 1024 / 1024).toFixed(1)} MB selected</p></div><button type="button" onClick={clearPickedFile} aria-label={`Remove ${pickedFile.name}`} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200"><X className="h-4 w-4" /></button></div>
              </div>
            )}
            </>
          )}
          {kind === "voice" && (
            <div className="mt-4 rounded-2xl bg-[#17241d] p-5 text-white">
              <p className="font-semibold">Record here instead</p>
              <p className="mt-1 text-sm text-stone-400">
                Try: “What did you call him?” or “What happened just before this
                photograph?” · up to 5 minutes
              </p>
              <button
                type="button"
                onClick={toggleRecording}
                className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full font-semibold ${recording ? "bg-red-600" : "bg-amber-300 text-[#17241d]"}`}
              >
                {recording ? (
                  <>
                    <StopCircle className="h-5 w-5" /> Stop recording
                  </>
                ) : (
                  <>
                  <Mic className="h-5 w-5" /> Start recording
                </>
              )}
              {recording && <span className="font-mono tabular-nums">{Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, "0")}</span>}
              </button>
              {audio && (
                <div className="mt-4 rounded-xl bg-white/10 p-3"><p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Voice memory ready · {(audio.size / 1024).toFixed(0)} KB</p>{audioUrl && <audio controls preload="metadata" src={audioUrl} className="mt-3 w-full" />}<button type="button" onClick={discardVoice} className="mt-3 min-h-11 w-full rounded-full border border-white/20 px-4 text-sm font-semibold">Discard and record again</button></div>
              )}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-800">
            What you know
          </p>
          {subjectRequired && (
            <p
              id="memory-subject-required"
              role="status"
              className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950"
            >
              Choose a photograph above before sending this {kind === "identify" ? "identification" : "correction"}.
            </p>
          )}
          <div className="mt-4 grid gap-4">
            {kind === "identify" && (
              <><label className="text-sm font-semibold">
                Who is this?
                <input
                  name="proposedName"
                  required
                  className="field mt-2 font-normal"
                  placeholder="Their name or nickname"
                />
              </label><label className="text-sm font-semibold">Where are they in the photograph?<input name="positionDescription" value={positionDescription} onChange={(event) => setPositionDescription(event.target.value)} className="field mt-2 font-normal" placeholder="e.g. back row, second from the left" /><span className="mt-1 block text-xs font-normal leading-5 text-neutral-500">Use this keyboard-friendly description if tapping the exact person is difficult.</span></label></>
            )}
            <label className="text-sm font-semibold">
              Your name *
              <input
                name="claimantName"
                required
                className="field mt-2 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              Relationship to the family
              <input
                name="relationship"
                className="field mt-2 font-normal"
                placeholder="e.g. granddaughter, cousin, family friend"
              />
            </label>
            <label className="text-sm font-semibold">
              How do you know?
              <textarea
                name="howKnown"
                rows={3}
                className="field mt-2 resize-y font-normal"
                placeholder="I knew them personally / my mother told me / written on the back…"
              />
            </label>
            <label className="text-sm font-semibold">
              {["story", "correction"].includes(kind) ? "Memory or correction *" : "Memory or correction"}
              <textarea
                name="story"
                rows={5}
                required={["story", "correction"].includes(kind)}
                className="field mt-2 resize-y font-normal"
                placeholder="What happened, where, when, who else remembers, and what you are unsure about…"
              />
            </label>
            <label className="text-sm font-semibold">
              How certain are you?
              <select name="certainty" className="field mt-2 font-normal">
                <option value="know">I know this personally</option>
                <option value="told">I was told by someone</option>
                <option value="think">I think this is right</option>
                <option value="unsure">I am unsure</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Contact for private follow-up
              <input name="contact" className="field mt-2 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              If published, attribution
              <select name="attribution" className="field mt-2 font-normal">
                <option value="named">Use my name</option>
                <option value="anonymous">Keep me anonymous</option>
                <option value="private">Keep this entirely private</option>
              </select>
            </label>
            <label className="flex items-start gap-3 rounded-2xl bg-stone-100 p-4 text-sm leading-6">
              <input
                name="consent"
                value="yes"
                type="checkbox"
                required
                className="mt-1 h-4 w-4"
              />
              <span>
                I may share this material and allow private preservation and
                family review. Publication requires a separate review decision.
              </span>
            </label>
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-900"
              >
                {error}
              </p>
            )}
            <button
              disabled={
                busy ||
                subjectRequired ||
                (kind === "identify" && !anchor && !positionDescription.trim())
              }
              aria-busy={busy}
              aria-describedby={subjectRequired ? "memory-subject-required" : undefined}
              className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#17241d] px-5 font-semibold text-white disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Square className="h-4 w-4 fill-current" />
              )}{" "}
              {busy ? "Preserving privately…" : "Send to private review"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
