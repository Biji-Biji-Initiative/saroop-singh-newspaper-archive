"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function ArchiveQr({ value, label, size = 180 }: { value: string; label: string; size?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (canvas.current) QRCode.toCanvas(canvas.current, value, { width: size, margin: 2, color: { dark: "#17241d", light: "#fffdf8" }, errorCorrectionLevel: "M" }); }, [value, size]);
  return <figure className="inline-flex flex-col items-center rounded-3xl bg-[#fffdf8] p-4 text-[#17241d] shadow-2xl"><canvas ref={canvas} aria-label={label} role="img" /><figcaption className="mt-2 max-w-44 text-center text-xs font-semibold">{label}</figcaption></figure>;
}
