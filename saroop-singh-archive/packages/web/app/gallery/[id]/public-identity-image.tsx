"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { imageAnchorToFramePercent } from "@/lib/image-anchor";
import type { PublicIdentityTag } from "@/lib/public-identifications";

export function PublicIdentityImage({
  src,
  alt,
  identityTags,
}: {
  src: string;
  alt: string;
  identityTags: PublicIdentityTag[];
}) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>();
  const markers = useMemo(
    () =>
      dimensions
        ? identityTags.flatMap((tag) => {
            if (tag.anchorX == null || tag.anchorY == null) return [];
            const position = imageAnchorToFramePercent(
              { x: tag.anchorX / 10000, y: tag.anchorY / 10000 },
              4,
              3,
              dimensions.width,
              dimensions.height,
            );
            if (!position) return [];
            return [{ ...tag, position }];
          })
        : [],
    [dimensions, identityTags],
  );

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          unoptimized
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-contain"
          onLoad={(event) =>
            setDimensions({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
        />
        {markers.map((tag) => (
          <span
            key={tag.id}
            aria-label={`Family-identified person: ${tag.name}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${tag.position.x}%`, top: `${tag.position.y}%` }}
          >
            <span className="block h-4 w-4 rounded-full border-2 border-white bg-amber-300 shadow-lg" />
            <span className="mt-1 block max-w-40 rounded-full bg-[#17241d]/95 px-2 py-1 text-center text-xs font-semibold text-amber-100 shadow-lg">
              {tag.name}
            </span>
          </span>
        ))}
        <div className="absolute bottom-4 left-4 rounded-full bg-emerald-900/90 px-4 py-2 text-xs font-semibold uppercase tracking-[.16em] text-emerald-50">
          Best available source
        </div>
      </div>
      {identityTags.length > 0 && (
        <section className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
          <p className="font-semibold">Family-identified people</p>
          <p className="mt-1 leading-6 text-stone-300">
            {identityTags.map((tag) => tag.name).join(", ")}. These names were
            supplied by family and explicitly approved by an archive curator.
          </p>
        </section>
      )}
    </div>
  );
}
