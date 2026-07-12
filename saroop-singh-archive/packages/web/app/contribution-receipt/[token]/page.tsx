import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { ContributionReceiptStatus } from "./receipt-status";

export const metadata: Metadata = {
  title: "Private Contribution Receipt",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ContributionReceipt({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <main className="flex min-h-[75vh] items-center bg-[#f6f1e8] px-5 py-16 text-[#17241d]"><section className="mx-auto max-w-xl rounded-[2rem] border border-amber-950/10 bg-white p-7 text-center shadow-xl sm:p-10"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" /><p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-emerald-800">Private archive receipt</p><h1 className="mt-3 font-serif text-5xl">Your photographs have a place in the review queue.</h1><p className="mt-5 leading-7 text-neutral-600">Keep this unguessable receipt link. It is not a login and should only be shared with people you trust.</p><ContributionReceiptStatus token={token} /><div data-receipt-token={token} className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm"><p className="flex items-center justify-center gap-2 font-semibold"><LockKeyhole className="h-4 w-4" /> Nothing is public automatically</p><p className="mt-2 text-neutral-500">This private receipt shows only safe review totals. It never reveals a photograph, name, story, contact detail or source-file location.</p></div><div className="mt-7 flex flex-col gap-2 sm:flex-row"><Link href="/contribute" className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#17241d] px-5 font-semibold text-white">Add more photographs</Link><Link href="/" className="flex min-h-12 flex-1 items-center justify-center rounded-full border border-amber-950/15 px-5 font-semibold">Return home</Link></div></section></main>;
}
