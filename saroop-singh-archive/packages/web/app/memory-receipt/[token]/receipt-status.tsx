"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, LockKeyhole, SearchCheck, ShieldQuestion } from "lucide-react";

const states: Record<string, { label: string; note: string; icon: typeof Clock3; colour: string }> = {
  submitted: { label: "Safely received", note: "Waiting in the private family review queue.", icon: Clock3, colour: "bg-amber-100 text-amber-950" },
  clarify: { label: "More context needed", note: "The archive may contact you privately for clarification.", icon: ShieldQuestion, colour: "bg-blue-100 text-blue-950" },
  corroborated: { label: "Corroborated", note: "The family archive found supporting context. Publication remains a separate decision.", icon: SearchCheck, colour: "bg-emerald-100 text-emerald-950" },
  approved: { label: "Approved for archive use", note: "The reviewed memory may now be used within its consent scope.", icon: CheckCircle2, colour: "bg-emerald-100 text-emerald-950" },
  private: { label: "Preserved privately", note: "This memory remains in the private family archive.", icon: CheckCircle2, colour: "bg-stone-100 text-stone-900" },
  rejected: { label: "Not accepted", note: "The submission was not added to the public archive. Its review decision remains audited.", icon: ShieldQuestion, colour: "bg-red-50 text-red-900" },
  conflicting: { label: "Conflicting evidence", note: "The archive found evidence that does not yet agree. The claim remains private while the conflict is documented.", icon: ShieldQuestion, colour: "bg-amber-100 text-amber-950" },
  withdrawn: { label: "Withdrawn", note: "This contribution has been removed from active review and will not be used publicly.", icon: LockKeyhole, colour: "bg-stone-200 text-stone-900" },
};
export function ReceiptStatus({ token }: { token: string }) { const [status, setStatus] = useState<{ status: string; createdAt: string }>(); const [failed, setFailed] = useState(false); useEffect(() => { fetch(`/api/memories/${token}`, { cache: "no-store" }).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(setStatus).catch(() => setFailed(true)); }, [token]); if (failed) return <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-900">This receipt could not be checked. Confirm that the complete private link was opened.</p>; if (!status) return <p className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking private review status…</p>; const current = states[status.status] || states.submitted; const Icon = current.icon; return <div className={`mt-6 rounded-2xl p-5 text-left ${current.colour}`}><p className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5" />{current.label}</p><p className="mt-2 text-sm leading-6 opacity-75">{current.note}</p><p className="mt-3 text-xs opacity-60">Received {new Date(status.createdAt).toLocaleString()}</p></div>; }
