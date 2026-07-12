import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, Mic, ScanFace, ShieldCheck } from "lucide-react";
import { ArchiveQr } from "@/components/archive-qr";
import { ShareFamily } from "@/components/share-family";
import { SITE_ORIGIN as origin } from "@/lib/site";

export const metadata: Metadata = {
  title: "Family Archive Day",
  description:
    "An invitation to bring one photograph, name one person and tell one story for the Saroop Singh Archive.",
};
export default function FamilyDayPage() {
  return (
    <main className="family-day-page min-h-screen bg-[#f6f1e8] text-[#17241d]">
      <section className="bg-[#17241d] text-[#f8f1e4]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-amber-300">
            An invitation to the family
          </p>
          <h1 className="mt-5 max-w-5xl font-serif text-6xl leading-[.86] sm:text-8xl">
            Bring one photograph.
            <br />
            Name one person.
            <br />
            Tell one story.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300">
            Together we can return names, voices and context to the Saroop Singh
            family archive—without changing what the historical evidence
            actually says.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-800">
            Your family-day kit
          </p>
          <h2 className="mt-4 font-serif text-5xl">
            Everything begins on a phone.
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Camera,
                title: "A photograph",
                text: "Front and back, in the best quality available.",
              },
              {
                icon: ScanFace,
                title: "A name",
                text: "Who is pictured—and how you know.",
              },
              {
                icon: Mic,
                title: "A voice",
                text: "A short memory in any language.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <Icon className="h-7 w-7 text-amber-800" />
                  <h3 className="mt-4 font-serif text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 rounded-2xl bg-amber-100 p-5">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5" /> Nothing is published
              automatically
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-950/70">
              Every contribution remains private until identity, context,
              consent and rights are reviewed.
            </p>
          </div>
          <div className="mt-8">
            <ShareFamily />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-amber-300 p-7 text-center">
          <ArchiveQr
            value={`${origin}/remember`}
            label="Scan to enter the Family Memory Room"
            size={220}
          />
          <Link
            href="/story"
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17241d] px-6 font-semibold text-white"
          >
            Begin the family story <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <section className="family-card mx-auto mb-16 max-w-4xl border-4 border-[#17241d] bg-amber-300 p-8 text-center sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[.25em]">
          Saroop Singh Archive · Family Day
        </p>
        <h2 className="mt-5 font-serif text-6xl leading-[.88]">
          Memory still lives with you.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg">
          Bring one photograph. Name one person. Tell one story.
        </p>
        <div className="mt-7">
          <ArchiveQr
            value={`${origin}/remember`}
            label="No login · Private family review"
            size={180}
          />
        </div>
        <p className="mt-6 font-mono text-xs">
          {origin.replace("https://", "")}
        </p>
      </section>
    </main>
  );
}
