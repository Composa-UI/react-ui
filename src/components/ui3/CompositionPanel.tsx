import { useRef, useState, useCallback, useEffect } from "react";
import { clsx } from "clsx";
import { SlidesPanel, type SlideData } from "./SlidesPanel";
import { LayerList, type LayerNode } from "./LayerList";

// ─── Composition panel ────────────────────────────────────────────────────────
// The default left-rail content (app-shell.md → "Composition view"). A vertical
// SPLIT: SlidesPanel on top (~40%), LayerList on the bottom (~60%), separated by a
// DRAGGABLE horizontal divider that adjusts the relative heights (pointer drag).
// 240px wide, full height, theme-aware (renders LIGHT by default, DARK under
// `data-composa-mode="dark"`). Presentational: slide/layer data + the current split
// are controllable; the editor wires real data and persists the ratio.

const MIN_PX = 80;          // spec: each panel min 80px
const DIVIDER_PX = 7;       // hit area / visible hairline row

export interface CompositionPanelProps {
  slides?: SlideData[];
  layers?: LayerNode[];
  slidesTitle?: string;
  slidesSubtitle?: string;
  layersTitle?: string;
  /** Top (slides) share of the split, 0–1. Default ~0.4 per spec. */
  split?: number;
  /** Uncontrolled default when `split` is not provided. */
  defaultSplit?: number;
  onSplitChange?: (split: number) => void;
  className?: string;
}

export function CompositionPanel({
  slides = DEMO_SLIDES,
  layers,
  slidesTitle,
  slidesSubtitle,
  layersTitle,
  split: controlledSplit,
  defaultSplit = 0.4,
  onSplitChange,
  className,
}: CompositionPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalSplit, setInternalSplit] = useState(defaultSplit);
  const split = controlledSplit ?? internalSplit;
  const [dragging, setDragging] = useState(false);

  const setSplit = useCallback(
    (next: number) => {
      if (controlledSplit == null) setInternalSplit(next);
      onSplitChange?.(next);
    },
    [controlledSplit, onSplitChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const move = (ev: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const usable = rect.height - DIVIDER_PX;
        if (usable <= 0) return;
        const raw = ev.clientY - rect.top - DIVIDER_PX / 2;
        // clamp so both panels keep their 80px minimum
        const clamped = Math.min(Math.max(raw, MIN_PX), usable - MIN_PX);
        setSplit(clamped / usable);
      };
      const up = () => {
        setDragging(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [setSplit],
  );

  // Keyboard nudge for accessibility (2% per arrow press).
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowUp") { e.preventDefault(); setSplit(Math.max(0, split - 0.02)); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setSplit(Math.min(1, split + 0.02)); }
    },
    [split, setSplit],
  );

  return (
    <div
      ref={containerRef}
      className={clsx(
        "w-[240px] shrink-0 h-full flex flex-col bg-c-bg border-r border-c-border overflow-hidden",
        className,
      )}
    >
      {/* Top — Slides (min 80px). `[&>*]:!w-full` stretches the fixed-width child to
          the 240px column; `[&>*]:!border-r-0` drops its own right border (the
          container owns it). */}
      <div className="min-h-[80px] overflow-hidden [&>*]:!w-full [&>*]:!border-r-0" style={{ flexBasis: `calc(${split} * (100% - ${DIVIDER_PX}px))`, flexGrow: 0, flexShrink: 1 }}>
        <SlidesPanel slides={slides} title={slidesTitle} subtitle={slidesSubtitle} />
      </div>

      {/* Draggable divider */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize slides and layers"
        aria-valuenow={Math.round(split * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        className={clsx(
          "shrink-0 h-[7px] flex items-center justify-center cursor-row-resize select-none",
          "border-y border-c-border group outline-none focus-visible:ring-1 focus-visible:ring-c-border-selected",
          dragging ? "bg-c-bg-selected" : "bg-c-bg-secondary hover:bg-c-bg-hover",
        )}
      >
        <span className={clsx("h-[2px] w-[20px] rounded-full transition-colors", dragging ? "bg-c-text-brand" : "bg-c-icon-secondary")} />
      </div>

      {/* Bottom — Layers (min 80px, fills the rest). Same stretch/border overrides. */}
      <div className="flex-1 min-h-[80px] overflow-hidden [&>*]:!w-full [&>*]:!border-r-0">
        <LayerList layers={layers} title={layersTitle} />
      </div>
    </div>
  );
}

// ── Demo data so the panel renders standalone ────────────────────────────────
const DEMO_SLIDES: SlideData[] = [
  { n: 1, tint: "#4f46e5" },
  { n: 2, tint: "#0ea5e9", selected: true },
  { n: 3, tint: "#f59e0b", motion: true },
  { n: 4, tint: "#10b981", group: true, expanded: true },
  { n: "4.1", tint: "#34d399", sub: true },
  { n: "4.2", tint: "#6ee7b7", sub: true, comment: 2 },
  { n: 5, tint: "#ef4444", stacked: true },
  { n: 6, tint: "#8b5cf6" },
];
