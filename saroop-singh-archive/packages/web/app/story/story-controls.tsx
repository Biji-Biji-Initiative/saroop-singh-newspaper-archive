"use client";

import { useEffect, useState } from "react";
import { Home, Maximize2, Minimize2, Pause, Play } from "lucide-react";
import Link from "next/link";

export function StoryControls() {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const next = max > 0 ? Math.min(1, scrollY / max) : 0;
      setProgress(next);
      if (next >= 0.995) setPlaying(false);
    };
    update();
    addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  useEffect(() => {
    document.body.classList.add("story-mode");
    return () => document.body.classList.remove("story-mode");
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        scrollBy({ top: Math.max(320, innerHeight * 0.7), behavior: "smooth" }),
      10000,
    );
    return () => clearInterval(timer);
  }, [playing]);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#101713]/90 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <Link
          href="/"
          aria-label="Leave Story Mode"
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
        >
          <Home className="h-5 w-5" />
        </Link>
        <div role="progressbar" aria-label="Story progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full bg-amber-300 transition-[width]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? "Pause guided story" : "Play guided story"}
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => fullscreen ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.()}
          aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
        >
          {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
