"use client";

import { useEffect, useState } from "react";

type Stats = {
  total: number;
  photographs: number;
  voices: number;
  identifications: number;
  stories: number;
  updatedAt: string;
};

export function PremiereStats() {
  const [stats, setStats] = useState<Stats>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/memories/stats", { cache: "no-store" });
        if (!response.ok) throw new Error("stats unavailable");
        const data = (await response.json()) as Stats;
        if (active) {
          setStats(data);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    };
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const items = [
    { label: "Names proposed", value: stats?.identifications },
    { label: "Stories preserved", value: stats?.stories },
    { label: "Voices recorded", value: stats?.voices },
    { label: "Photographs added", value: stats?.photographs },
  ];

  return <div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{items.map(item => <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center"><p className="font-serif text-6xl text-amber-300">{item.value ?? "—"}</p><p className="mt-2 text-sm text-stone-300">{item.label}</p></div>)}</div><p role="status" className={`mt-4 text-center text-xs ${error ? "text-amber-300" : "text-stone-400"}`}>{error ? "Live totals are temporarily unavailable; no zeroes have been invented." : stats ? `All-time non-rejected totals · updated ${new Date(stats.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Loading verified contribution totals…"}</p></div>;
}
