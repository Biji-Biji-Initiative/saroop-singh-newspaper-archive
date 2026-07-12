"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  SearchCheck,
  ShieldQuestion,
} from "lucide-react";

type Receipt = {
  createdAt: string;
  receivedCount: number;
  duplicateCount: number;
  pendingReviewCount: number;
  status: "received" | "submitted" | "not-accepted" | "reviewed";
};

const states = {
  received: {
    label: "Safely received",
    note: "The files were already preserved; your private contribution context has been added to the review record.",
    icon: CheckCircle2,
    colour: "bg-stone-100 text-stone-900",
  },
  submitted: {
    label: "Waiting for private family review",
    note: "Nothing is public automatically. The archive will review the source, rights, names, dates and story before making any decision.",
    icon: Clock3,
    colour: "bg-amber-100 text-amber-950",
  },
  "not-accepted": {
    label: "Not accepted for archive use",
    note: "The review outcome remains private. This receipt does not expose the photographs or anyone’s details.",
    icon: ShieldQuestion,
    colour: "bg-red-50 text-red-900",
  },
  reviewed: {
    label: "Reviewed by the family archive",
    note: "The archive has completed an initial review. Publication remains a separate, deliberate decision.",
    icon: SearchCheck,
    colour: "bg-emerald-100 text-emerald-950",
  },
};

export function ContributionReceiptStatus({ token }: { token: string }) {
  const [receipt, setReceipt] = useState<Receipt>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`/api/contributions/${token}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setReceipt)
      .catch(() => setFailed(true));
  }, [token]);

  if (failed) {
    return <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-900">This receipt could not be checked. Confirm that the complete private link was opened.</p>;
  }
  if (!receipt) {
    return <p className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking private review status…</p>;
  }

  const current = states[receipt.status] || states.submitted;
  const Icon = current.icon;
  return <div className={`mt-6 rounded-2xl p-5 text-left ${current.colour}`}>
    <p className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5" /> {current.label}</p>
    <p className="mt-2 text-sm leading-6 opacity-75">{current.note}</p>
    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
      <p><strong>{receipt.receivedCount}</strong> new {receipt.receivedCount === 1 ? "photograph" : "photographs"}</p>
      <p><strong>{receipt.duplicateCount}</strong> already preserved</p>
      <p><strong>{receipt.pendingReviewCount}</strong> awaiting review</p>
    </div>
    <p className="mt-3 text-xs opacity-60">Receipt created {new Date(receipt.createdAt).toLocaleString()}</p>
  </div>;
}
