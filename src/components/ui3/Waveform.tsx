import { useMemo } from "react";
import { clsx } from "clsx";

// ─── Waveform ─────────────────────────────────────────────────────────────────
// Small, presentational bar-waveform used as the visual for audio (e.g. the
// audio asset thumbnail, where a solid colour swatch reads wrong for sound).
//
// Peaks are deterministic: given no real decoded audio, a stable pseudo-random
// series is derived from `seed` so the same asset always draws the same shape
// (mirrors the timeline's audio-lane waveform stub). Pass explicit `peaks`
// (0–1) once real source-audio extraction lands.
//
// Renders as a stretched SVG (symmetric around the midline) so it fills any
// container. Colour comes from `currentColor`, so callers set it via text-*.

// Cheap string → 32-bit hash (FNV-1a) → seeds a small LCG so peaks are stable.
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function deterministicPeaks(seed: string, count: number): number[] {
  let state = hashSeed(seed) || 1;
  const next = () => {
    // Numerical Recipes LCG → [0, 1).
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  return Array.from({ length: count }, (_, i) => {
    // Blend a smooth envelope with per-bar noise so it reads as audio, not a
    // flat bar chart — louder toward the middle, never fully silent.
    const envelope = 0.35 + 0.65 * Math.sin((i / Math.max(1, count - 1)) * Math.PI);
    const noise = 0.4 + 0.6 * next();
    return Math.max(0.12, Math.min(1, envelope * noise));
  });
}

export interface WaveformProps {
  /** Stable seed for deterministic peaks (e.g. asset id or name). */
  seed?: string;
  /** Explicit normalized peaks (0–1). Overrides `seed` when provided. */
  peaks?: number[];
  /** Number of bars to draw when generating from `seed`. */
  bars?: number;
  className?: string;
  "aria-hidden"?: boolean;
}

export function Waveform({ seed = "", peaks, bars = 40, className, "aria-hidden": ariaHidden = true }: WaveformProps) {
  const data = useMemo(() => peaks ?? deterministicPeaks(seed, bars), [peaks, seed, bars]);

  const n = data.length;
  // Fixed viewBox; the SVG stretches to the container (preserveAspectRatio=none).
  const H = 100;
  const gap = 0.35;                        // fraction of a slot used as spacing
  const slot = n > 0 ? 100 / n : 100;
  const barWidth = slot * (1 - gap);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden={ariaHidden}
      className={clsx("size-full", className)}
    >
      {data.map((peak, i) => {
        const h = Math.max(2, peak * (H - 8));
        const x = i * slot + (slot - barWidth) / 2;
        const y = (H - h) / 2;            // symmetric around the midline
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={barWidth / 2}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}
