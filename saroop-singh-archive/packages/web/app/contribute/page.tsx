import type { Metadata } from "next";
import { ContributionForm } from "./contribution-form";

export const metadata: Metadata = { title: "Contribute a Family Photograph", description: "Privately submit photographs and family knowledge to the Saroop Singh Archive." };

export default function ContributePage() {
  return <main className="min-h-screen bg-[#f5efe3] text-[#17241d]">
    <section className="bg-[#17241d] text-[#f8f1e4]"><div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20"><p className="text-xs font-semibold uppercase tracking-[.22em] text-amber-300">Family contribution desk</p><h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[.98] sm:text-7xl">Help us return names and stories to the photographs.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">No account. No password. Your submission stays private until the family archive reviews and approves it.</p></div></section>
    <ContributionForm />
  </main>;
}
