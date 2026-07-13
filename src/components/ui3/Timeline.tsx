import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Play, Pause, Diamond, Repeat, PanelBottomClose, PanelLeftClose, Hash, Square, Type, Minus, Eye, EyeOff, ChevronDown, ChevronRight as DisclosureRight, ChevronLeft, ChevronRight, ChevronLeft as ChevronLeftBack, Film } from "lucide-react";
import { collectAggregateKeyframes, normalizeViewport, panViewport, reconcileUncontrolledViewport, revealTimeInViewport, tickTimes, timeToX, viewportAtZoomValue, viewportZoomValue, wheelDeltaPixels, wheelPanDelta, xToTime, zoomViewport, type TimelineViewport } from "./timelineModel";

// ─── Timeline ───────────────────────────────────────────────────────────────────
// Polymorphic timeline region (Composa editor spec: docs/composa/specs/timeline.md).
// Two views sharing one playhead:
//   • mode="slide"  (default) — slide-local element-animation timeline
//     (After-Effects / Figma-Slides style): transport + ms-ruler + track list +
//     keyframe lanes. Componentized from the Figma export (node 2212-1693).
//   • mode="master" — full-project strip: seconds-ruler + a single "Slides" track of
//     horizontal slide BLOCKS in order + a "Base video" placeholder row + transport.
// Data-driven: tracks/blocks/keyframes/bars are positioned along a shared time→px
// scale. The active accent (playhead, keyframes, zoom fill) is Figma blue #0d99ff.

const FONT = "font-[family-name:var(--composa-font-family)]";
const LEFT_W = 297;       // track-list width
const ROW_LAYER = 28;
const ROW_PROP = 28;      // raised from 24 → contains the 20px bar with 4px above/below
const ROW_BLOCK = 32;     // master-view slide/video block-track row height (compact — contains 20px bar)
const RIGHT_OVERLAY_W = 148; // zoom slider + collapse control + padding/border
const BLUE = "#0d99ff";

export type TimelineMode = "master" | "slide";
export type TimelineFrameRate = 24 | 25 | 30 | 60;
export type { TimelineViewport } from "./timelineModel";
export type TimelineViewportChangeSource = "wheel-zoom" | "wheel-pan" | "zoom-control" | "keyframe-reveal";
export type TimelinePlayheadChangeSource = "pointer" | "keyboard";
export interface TimelinePlayheadChangeDetail {
  source: TimelinePlayheadChangeSource;
  millisecondsPerPixel: number;
}
export interface TimelineBlockContextMenuDetail {
  clientX: number;
  clientY: number;
  currentTarget: HTMLDivElement;
  source: "pointer" | "keyboard";
}
export interface TimelineKeyframeReveal {
  keyframeId: string;
  timeMs: number;
  /** Caller-owned interaction sequence. A new value represents a new one-shot request. */
  requestKey: string | number;
}

export type TrackType = "group" | "frame" | "text" | "line";
export interface TimelineKeyframe { id: string; timeMs: number; selected?: boolean; }
export type TimelineKeyframeValue = number | TimelineKeyframe;
export interface PropTrack {
  id?: string;
  name: string;
  keyframes: TimelineKeyframeValue[]; // numbers preserve the demo/legacy contract
  bar?: [number, number];      // duration bar [start,end] ms
  hidden?: boolean;            // greyed + eye-off
  accent?: boolean;            // purple-selected track
}
export interface Track {
  id?: string;
  name: string;
  type: TrackType;
  bar?: [number, number];
  props: PropTrack[];
  /** Visual nesting only. Product hierarchy remains host-owned. */
  depth?: number;
  /** Controlled property-row visibility. Undefined preserves the legacy expanded state. */
  expanded?: boolean;
}

// master-view slide block — a slide's [start,end] range (ms) on the project timeline
export interface SlideBlock {
  id?: string;                    // legacy demos may omit this; index fallback is presentation-only
  name: string;
  range: [number, number];     // [start,end] ms on the master timeline
  active?: boolean;            // canvas focus — visually distinct
}
const slideBlockId = (block: SlideBlock, index: number) => block.id ?? `slide-${index}`;
export interface BaseClipBlock {
  id: string;
  name: string;
  range: [number, number];
  selected?: boolean;
  thumbnail?: string;
  tint?: string;
}

const TYPE_ICON: Record<TrackType, typeof Hash> = { group: Hash, frame: Square, text: Type, line: Minus };

const DEMO_TRACKS: Track[] = [
  { name: "Top Buttons", type: "group", bar: [2600, 8000], props: [
    { name: "Opacity", bar: [2600, 8000], keyframes: [2600, 5000, 7800, 8600] },
  ] },
  { name: "Sheet", type: "frame", bar: [1900, 8000], props: [
    { name: "Position", hidden: true, keyframes: [1900] },
    { name: "Position", hidden: true, keyframes: [3000] },
    { name: "Opacity", bar: [3500, 8000], keyframes: [5000, 7800, 8100] },
  ] },
  { name: "time highlight", type: "line", bar: [2600, 8600], props: [
    { name: "Opacity", bar: [2600, 8600], keyframes: [2600, 5000, 7800, 8600] },
  ] },
  { name: "date highlight", type: "line", bar: [2600, 8600], props: [
    { name: "Opacity", bar: [2600, 8600], keyframes: [2600] },
  ] },
  { name: "Control + highlight indicator", type: "group", bar: [2600, 7400], props: [
    { name: "Opacity", keyframes: [2600, 5000, 7400, 7800] },
  ] },
];

const DEMO_BLOCKS: SlideBlock[] = [
  { id: "intro", name: "Intro", range: [0, 4000] },
  { id: "overview", name: "Overview of the quarter", range: [4000, 9000], active: true },
  { id: "metrics", name: "Metrics deep dive", range: [9000, 16000] },
  { id: "outro", name: "Outro", range: [16000, 20000] },
];

// ── keyframe lane (bar + diamonds + connecting line) ──────────────────────────────
export interface KeyframeTarget { trackId: string; propertyId: string; keyframeId: string; timeMs: number; }
export interface AggregateKeyframeTarget { trackId: string; timeMs: number; keyframeIds: string[]; complete: boolean; }
export type TimelineGestureTarget =
  | { kind: "keyframe"; id: string; action: "move"; keyframe: KeyframeTarget }
  | { kind: "slide-block" | "base-clip"; id: string; action: "move" | "trim-start" | "trim-end" };

export function shouldClaimTimelineGestureEscape(key: string, gestureActive: boolean): boolean {
  return key === "Escape" && gestureActive;
}

export function stepTimelinePlayhead(timeMs: number, frameDelta: number, frameRate: TimelineFrameRate, durationMs: number): number {
  return Math.min(durationMs, Math.max(0, timeMs + frameDelta * 1000 / frameRate));
}

export const shouldBeginTimelinePointer = (button: number, isPrimary: boolean): boolean => button === 0 && isPrimary;

export function shouldHandleTimelineReveal(master: boolean, requestKey: string | number | undefined, handledKey: string | number | null, timelineWidth: number): boolean {
  return !master && requestKey !== undefined && requestKey !== handledKey && timelineWidth > LEFT_W + 1;
}

function useGestureEscapeOwnership(cancel: () => void) {
  const cancelRef = useRef(cancel);
  const releaseRef = useRef<(() => void) | null>(null);
  cancelRef.current = cancel;
  const release = () => { releaseRef.current?.(); releaseRef.current = null; };
  const claim = () => {
    release();
    const onKeyDown = (event: KeyboardEvent) => {
      if (!shouldClaimTimelineGestureEscape(event.key, true)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      cancelRef.current();
    };
    document.addEventListener("keydown", onKeyDown, true);
    releaseRef.current = () => document.removeEventListener("keydown", onKeyDown, true);
  };
  useEffect(() => release, []);
  return { claim, release };
}

const keyframeTime = (keyframe: TimelineKeyframeValue) => typeof keyframe === "number" ? keyframe : keyframe.timeMs;
// Keep the legacy numeric ID byte-for-byte compatible for individual keyframe callbacks.
const keyframeId = (keyframe: TimelineKeyframeValue, index: number) => typeof keyframe === "number" ? `keyframe-${index}-${keyframe}` : keyframe.id;
// Aggregate identities must be unique across properties without changing the legacy callback contract above.
const aggregateKeyframeId = (keyframe: TimelineKeyframeValue, index: number, propertyId: string) => typeof keyframe === "number" ? `${propertyId}:aggregate-keyframe-${index}-${keyframe}` : keyframe.id;
const percent = (timeMs: number, viewport: TimelineViewport) => `${timeToX(timeMs, viewport, 100)}%`;
const percentWidth = (startMs: number, endMs: number, viewport: TimelineViewport) => `${timeToX(endMs, viewport, 100) - timeToX(startMs, viewport, 100)}%`;

function Lane({ prop, trackId, propertyId, height, viewport, plotWidth, onSelect, onMove, onDelete, onGestureStart, onGestureEnd }: {
  prop: PropTrack; trackId: string; propertyId: string; height: number;
  viewport: TimelineViewport; plotWidth: number;
  onSelect?: (target: KeyframeTarget, additive: boolean) => void;
  onMove?: (target: KeyframeTarget, timeMs: number) => void;
  onDelete?: (target: KeyframeTarget) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
}) {
  const kfs = prop.keyframes;
  const times = kfs.map(keyframeTime);
  const first = times.length ? Math.min(...times) : 0;
  const last = times.length ? Math.max(...times) : 0;
  const drag = useRef<{ id: string; startX: number; startTime: number; target: KeyframeTarget } | null>(null);
  const finish = (cancelled: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    escapeOwnership.release();
    onGestureEnd?.({ kind: "keyframe", id: active.target.keyframeId, action: "move", keyframe: active.target }, { cancelled });
  };
  const escapeOwnership = useGestureEscapeOwnership(() => finish(true));
  return (
    <div className="flex-1 relative overflow-hidden" style={{ height }}>
      {prop.bar && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[20px] rounded-[4px] bg-c-bg-secondary"
          style={{ left: percent(prop.bar[0], viewport), width: percentWidth(prop.bar[0], prop.bar[1], viewport) }}
        >
          {/* trim handles (edge-drag to trim start/end) — inset + wider to read as grips */}
          <span className="absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
          <span className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
        </div>
      )}
      {kfs.length > 1 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-px"
          style={{ left: percent(first, viewport), width: percentWidth(first, last, viewport), backgroundColor: prop.accent ? "#8638e5" : "rgba(0,0,0,0.25)" }}
        />
      )}
      {kfs.map((keyframe, i) => {
        const timeMs = keyframeTime(keyframe);
        const id = keyframeId(keyframe, i);
        const target = { trackId, propertyId, keyframeId: id, timeMs };
        const selected = typeof keyframe !== "number" && keyframe.selected;
        return (
        <div
          key={id}
          role="button"
          tabIndex={0}
          data-keyframe-id={id}
          aria-label={`${prop.name} keyframe at ${timeMs}ms`}
          aria-pressed={selected}
          onClick={event => onSelect?.(target, event.shiftKey)}
          onKeyDown={event => {
            if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onDelete?.(target); }
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect?.(target, event.shiftKey); }
            if (shouldClaimTimelineGestureEscape(event.key, drag.current?.id === id)) {
              event.preventDefault(); event.stopPropagation(); finish(true);
            }
          }}
          onPointerDown={event => { drag.current = { id, startX: event.clientX, startTime: timeMs, target }; escapeOwnership.claim(); onGestureStart?.({ kind: "keyframe", id, action: "move", keyframe: target }); event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={event => {
            if (drag.current?.id !== id) return;
            const deltaMs = (event.clientX - drag.current.startX) / Math.max(1, plotWidth) * (viewport.endMs - viewport.startMs);
            onMove?.(target, Math.max(0, Math.round(drag.current.startTime + deltaMs)));
          }}
          onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
          className={clsx("absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] outline-none", selected && "ring-2 ring-c-border-selected-strong")}
          style={{ left: percent(timeMs, viewport), backgroundColor: prop.accent ? "#8638e5" : BLUE }}
        />
      );})}
    </div>
  );
}

// ── one track (layer row + its property rows) ─────────────────────────────────────
function TrackRows({ track, trackIndex, viewport, plotWidth, onExpandedChange, onAggregateKeyframeSelect, onKeyframeSelect, onKeyframeMove, onKeyframeDelete, onPropertyAddKeyframe, onGestureStart, onGestureEnd }: {
  track: Track; trackIndex: number;
  viewport: TimelineViewport; plotWidth: number;
  onExpandedChange?: (trackId: string, expanded: boolean) => void;
  onAggregateKeyframeSelect?: (target: AggregateKeyframeTarget, additive: boolean) => void;
  onKeyframeSelect?: (target: KeyframeTarget, additive: boolean) => void;
  onKeyframeMove?: (target: KeyframeTarget, timeMs: number) => void;
  onKeyframeDelete?: (target: KeyframeTarget) => void;
  onPropertyAddKeyframe?: (trackId: string, propertyId: string) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
}) {
  const Icon = TYPE_ICON[track.type];
  const trackId = track.id ?? `track-${trackIndex}`;
  const depth = Math.max(0, track.depth ?? 0);
  const expanded = track.expanded !== false;
  const aggregateKeys = onAggregateKeyframeSelect ? collectAggregateKeyframes(track.props.flatMap((prop, propertyIndex) => {
    const propertyId = prop.id ?? `property-${propertyIndex}`;
    return prop.keyframes.map((keyframe, keyframeIndex) => ({
      propertyId,
      keyframeId: aggregateKeyframeId(keyframe, keyframeIndex, propertyId),
      timeMs: keyframeTime(keyframe),
      selected: typeof keyframe !== "number" && keyframe.selected,
    }));
  }), track.props.length) : [];
  return (
    <>
      {/* layer row */}
      <div className="flex" style={{ height: ROW_LAYER }}>
        <div className="shrink-0 flex items-center gap-[8px] pr-[8px] border-r border-c-border" style={{ width: LEFT_W, paddingLeft: 8 + depth * 16 }}>
          {track.props.length ? onExpandedChange ? <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${track.name}`} aria-expanded={expanded} onClick={() => onExpandedChange(trackId, !expanded)} className="size-[16px] shrink-0 rounded-c-sm flex items-center justify-center text-c-icon-secondary hover:bg-c-bg-hover focus-visible:ring-2 focus-visible:ring-c-border-selected-strong outline-none">
            {expanded ? <ChevronDown size={12} strokeWidth={1.5} /> : <DisclosureRight size={12} strokeWidth={1.5} />}
          </button> : <span aria-hidden className="size-[16px] shrink-0 flex items-center justify-center text-c-icon-secondary">
            {expanded ? <ChevronDown size={12} strokeWidth={1.5} /> : <DisclosureRight size={12} strokeWidth={1.5} />}
          </span> : <span className="size-[16px] shrink-0" />}
          <Icon size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />
          <span className={clsx(FONT, "text-[11px] font-[450] text-c-text truncate")}>{track.name}</span>
        </div>
        <div className="flex-1 relative overflow-hidden" style={{ height: ROW_LAYER }}>
          {track.bar && (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-[20px] rounded-[4px] bg-c-bg-secondary"
              style={{ left: percent(track.bar[0], viewport), width: percentWidth(track.bar[0], track.bar[1], viewport) }}
            >
              <span className="absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
              <span className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
            </div>
          )}
          {aggregateKeys.map(aggregate => {
            const status = aggregate.complete ? "complete" : "partial";
            const className = clsx("absolute top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] border outline-none", aggregate.complete ? "bg-c-icon border-c-icon" : "bg-c-bg border-c-icon-secondary", aggregate.selected && "ring-2 ring-c-border-selected-strong");
            const style = { left: percent(aggregate.timeMs, viewport) };
            return onAggregateKeyframeSelect ? <button type="button" key={aggregate.timeMs} data-aggregate-status={status}
              aria-label={`${track.name} aggregate keyframe at ${aggregate.timeMs}ms (${status})`} aria-pressed={aggregate.selected}
              onClick={event => onAggregateKeyframeSelect({ trackId, timeMs: aggregate.timeMs, keyframeIds: aggregate.keyframeIds, complete: aggregate.complete }, event.shiftKey)}
              className={clsx(className, "focus-visible:ring-2 focus-visible:ring-c-border-selected-strong")} style={style} />
              : <span aria-hidden key={aggregate.timeMs} data-aggregate-status={status} className={className} style={style} />;
          })}
        </div>
      </div>
      {/* property rows */}
      {expanded && track.props.map((p, i) => (
        <div key={i} className={clsx("flex", p.hidden && "opacity-40")} style={{ height: ROW_PROP }}>
          <div className="group/prop shrink-0 flex items-center gap-[6px] pr-[8px] border-r border-c-border" style={{ width: LEFT_W, paddingLeft: 48 + depth * 16 }}>
            <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] font-[450] truncate", p.accent ? "text-[#8638e5]" : "text-c-text-secondary")}>{p.name}</span>
            {/* keyframe stepper */}
            <ChevronLeft size={14} strokeWidth={1.5} className="text-c-icon-secondary opacity-0 group-hover/prop:opacity-100 shrink-0" />
            <button aria-label={`Add ${p.name} keyframe`} onClick={() => onPropertyAddKeyframe?.(trackId, p.id ?? `property-${i}`)} className="shrink-0 flex items-center justify-center">
              <Diamond size={12} strokeWidth={1.5} className="text-c-icon-secondary" />
            </button>
            <ChevronRight size={14} strokeWidth={1.5} className="text-c-icon-secondary opacity-0 group-hover/prop:opacity-100 shrink-0" />
            {p.hidden ? <EyeOff size={14} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" /> : <Eye size={14} strokeWidth={1.5} className="text-c-icon-secondary opacity-0 group-hover/prop:opacity-100 shrink-0" />}
          </div>
          <Lane prop={p} trackId={trackId} propertyId={p.id ?? `property-${i}`} height={ROW_PROP} viewport={viewport} plotWidth={plotWidth} onSelect={onKeyframeSelect} onMove={onKeyframeMove} onDelete={onKeyframeDelete} onGestureStart={onGestureStart} onGestureEnd={onGestureEnd} />
        </div>
      ))}
    </>
  );
}

// ── shared transport toolbar (identical across master + slide) ──────────────────────
// Layout, Play/Stop icons, timecode group, and loop are the SAME in both modes.
// Mode-specific: the keyframe (diamond) add button is slide-only — keyframes only exist
// in the slide-animation timeline. Timecode is shown in ms (slide) or seconds (master).
function Transport({ current, duration, mode, playing, loop, onPlayingChange, onStop, onLoopChange, onAddKeyframe }: {
  current: number; duration: number; mode: TimelineMode; playing: boolean; loop: boolean;
  onPlayingChange: (playing: boolean) => void; onStop?: () => void; onLoopChange: (loop: boolean) => void; onAddKeyframe?: () => void;
}) {
  const slide = mode === "slide";
  const fmt = slide
    ? (n: number) => String(Math.round(n)).padStart(5, "0")
    : (n: number) => (n / 1000).toFixed(2) + "s";
  const tcW = slide ? 42 : 54; // timecode cell width — ms strings are narrower than "4.20s"
  const IconBtn = ({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick?: () => void; active?: boolean }) => (
    <button aria-label={label} aria-pressed={active} onClick={onClick} className={clsx("size-[24px] rounded-c-md flex items-center justify-center text-c-icon hover:bg-c-bg-hover", active && "bg-c-bg-selected")}>{children}</button>
  );
  return (
    <div className="shrink-0 flex items-center gap-[8px] px-[8px] border-r border-c-border" style={{ width: LEFT_W }}>
      {/* shared transport controls */}
      <IconBtn label={playing ? "Pause" : "Play"} active={playing} onClick={() => onPlayingChange(!playing)}>{playing ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}</IconBtn>
      <IconBtn label="Stop" onClick={onStop}><Square size={14} strokeWidth={1.5} /></IconBtn>
      {/* keyframe add — slide-only (keyframes live in the slide-animation timeline) */}
      {slide && <IconBtn label="Add keyframe" onClick={onAddKeyframe}><Diamond size={16} strokeWidth={1.5} /></IconBtn>}
      <div className="w-[8px]" />
      {/* time group */}
      <div className="flex items-center h-[24px] rounded-c-md overflow-hidden">
        <div className="h-full bg-c-bg-secondary flex items-center justify-end pr-[6px]" style={{ width: tcW }}>
          <span className={clsx(FONT, "text-[11px] font-[450] text-c-text tabular-nums")}>{fmt(current)}</span>
        </div>
        <div className="h-full bg-c-bg-secondary flex items-center justify-end pr-[6px] ml-px" style={{ width: tcW }}>
          <span className={clsx(FONT, "text-[11px] font-[450] text-c-text-secondary tabular-nums")}>{fmt(duration)}</span>
        </div>
        {slide && (
          <div className="size-[24px] bg-c-bg-secondary ml-px flex items-center justify-center">
            <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>ms</span>
          </div>
        )}
        <button aria-label="Loop" aria-pressed={loop} onClick={() => onLoopChange(!loop)} className={clsx("size-[24px] bg-c-bg-secondary ml-px flex items-center justify-center text-c-icon hover:bg-c-bg-hover", loop && "!bg-c-bg-selected")}>
          <Repeat size={14} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex-1" />
      <button aria-label="Collapse track list" className="size-[24px] rounded-c-md flex items-center justify-center text-c-icon hover:bg-c-bg-hover">
        <PanelLeftClose size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ── ruler (slide-local view — milliseconds) ────────────────────────────────────────
function Ruler({ viewport, width }: { viewport: TimelineViewport; width: number }) {
  const ticks = tickTimes(viewport, width);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {ticks.map(t => (
        <span key={t} className={clsx(FONT, "absolute top-1/2 -translate-y-1/2 text-[11px] text-c-text-secondary tabular-nums")} style={{ left: percent(t, viewport) }}>{Math.round(t)}</span>
      ))}
    </div>
  );
}

// ── ruler (master view — seconds) ──────────────────────────────────────────────────
function SecondRuler({ viewport, width }: { viewport: TimelineViewport; width: number }) {
  const ticks = tickTimes(viewport, width);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {ticks.map(timeMs => (
        <span key={timeMs} className={clsx(FONT, "absolute top-1/2 -translate-y-1/2 text-[11px] text-c-text-secondary tabular-nums")} style={{ left: percent(timeMs, viewport) }}>{Number((timeMs / 1000).toFixed(2))}s</span>
      ))}
    </div>
  );
}

// ── master track rows: "Slides" block track + "Base video" placeholder ──────────────
function BlockTrack({ blocks, viewport, plotWidth, onSelect, onOpen, onContextMenu, onMove, onTrim, onGestureStart, onGestureEnd }: {
  blocks: SlideBlock[];
  viewport: TimelineViewport; plotWidth: number;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  onContextMenu?: (id: string, detail: TimelineBlockContextMenuDetail) => void;
  onMove?: (id: string, startMs: number) => void;
  onTrim?: (id: string, edge: "start" | "end", timeMs: number) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
}) {
  const drag = useRef<{ id: string; kind: "move" | "start" | "end"; startX: number; range: [number, number] } | null>(null);
  const begin = (event: React.PointerEvent, block: SlideBlock, kind: "move" | "start" | "end") => {
    if (!shouldBeginTimelinePointer(event.button, event.isPrimary)) return;
    event.stopPropagation();
    const index = blocks.indexOf(block);
    drag.current = { id: slideBlockId(block, index), kind, startX: event.clientX, range: block.range };
    escapeOwnership.claim();
    onGestureStart?.({ kind: "slide-block", id: slideBlockId(block, index), action: kind === "start" ? "trim-start" : kind === "end" ? "trim-end" : "move" });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const finish = (cancelled: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    escapeOwnership.release();
    onGestureEnd?.({ kind: "slide-block", id: active.id, action: active.kind === "start" ? "trim-start" : active.kind === "end" ? "trim-end" : "move" }, { cancelled });
  };
  const escapeOwnership = useGestureEscapeOwnership(() => finish(true));
  const update = (event: React.PointerEvent, block: SlideBlock) => {
    const active = drag.current;
    const id = slideBlockId(block, blocks.indexOf(block));
    if (!active || active.id !== id) return;
    const delta = Math.round((event.clientX - active.startX) / Math.max(1, plotWidth) * (viewport.endMs - viewport.startMs));
    if (active.kind === "move") onMove?.(id, Math.max(0, active.range[0] + delta));
    if (active.kind === "start") onTrim?.(id, "start", Math.min(active.range[1], Math.max(0, active.range[0] + delta)));
    if (active.kind === "end") onTrim?.(id, "end", Math.max(active.range[0], active.range[1] + delta));
  };
  return (
    <div className="flex" style={{ height: ROW_BLOCK }}>
      {/* left label */}
      <div className="shrink-0 flex items-center gap-[8px] pl-[8px] pr-[8px] border-r border-c-border" style={{ width: LEFT_W }}>
        <Film size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />
        <span className={clsx(FONT, "text-[11px] font-[450] text-c-text truncate")}>Compositions</span>
      </div>
      {/* block lane */}
      <div className="flex-1 relative overflow-hidden" style={{ height: ROW_BLOCK }}>
        {blocks.map((b, i) => {
          const id = slideBlockId(b, i);
          const stableId = b.id;
          const hasContextMenu = !!stableId && !!onContextMenu;
          const left = percent(b.range[0], viewport);
          const width = percentWidth(b.range[0], b.range[1], viewport);
          return (
            <div
              key={id}
              role="button" tabIndex={0} aria-label={b.name} aria-pressed={b.active}
              aria-haspopup={hasContextMenu ? "menu" : undefined} data-timeline-block-id={stableId}
              onClick={() => onSelect?.(id)}
              onDoubleClick={() => onOpen?.(id)}
              onContextMenu={event => {
                if (!hasContextMenu) return;
                event.preventDefault();
                onContextMenu(stableId, { clientX: event.clientX, clientY: event.clientY, currentTarget: event.currentTarget, source: "pointer" });
              }}
              onKeyDown={event => {
                if (event.key === "Enter") { event.preventDefault(); onOpen?.(id); }
                else if (event.key === " ") { event.preventDefault(); onSelect?.(id); }
                else if (hasContextMenu && (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) {
                  event.preventDefault(); event.stopPropagation();
                  const rect = event.currentTarget.getBoundingClientRect();
                  onContextMenu(stableId, { clientX: rect.left + Math.min(24, rect.width / 2), clientY: rect.top + rect.height / 2, currentTarget: event.currentTarget, source: "keyboard" });
                }
                else if (shouldClaimTimelineGestureEscape(event.key, drag.current?.id === id)) {
                  event.preventDefault(); event.stopPropagation(); finish(true);
                }
              }}
              onPointerDown={event => begin(event, b, "move")}
              onPointerMove={event => update(event, b)}
              onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
              className={clsx(
                "absolute top-1/2 -translate-y-1/2 h-[20px] rounded-[4px] flex items-center px-[10px] overflow-hidden border",
                b.active
                  ? "bg-[#0d99ff]/20 border-[#0d99ff]"
                  : "bg-c-bg-secondary border-c-border",
              )}
              style={{ left, width }}
            >
              {/* trim handles (edge-drag to trim start/end) */}
              <span aria-label={`Trim start of ${b.name}`} role="slider" aria-valuemin={0} aria-valuemax={b.range[1]} aria-valuenow={b.range[0]} tabIndex={0} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(id, "start", Math.min(b.range[1], Math.max(0, b.range[0] + (event.key === "ArrowLeft" ? -100 : 100)))); } }} onPointerDown={event => begin(event, b, "start")} onPointerMove={event => update(event, b)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} className="absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
              <span aria-label={`Trim end of ${b.name}`} role="slider" aria-valuemin={b.range[0]} aria-valuemax={Number.MAX_SAFE_INTEGER} aria-valuenow={b.range[1]} tabIndex={0} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(id, "end", Math.max(b.range[0], b.range[1] + (event.key === "ArrowLeft" ? -100 : 100))); } }} onPointerDown={event => begin(event, b, "end")} onPointerMove={event => update(event, b)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
              <span className={clsx(FONT, "text-[11px] font-[450] truncate", b.active ? "text-c-text" : "text-c-text-secondary")}>{b.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BaseVideoTrack({ clips, viewport, plotWidth, onSelect, onOpen, onMove, onTrim, onGestureStart, onGestureEnd }: {
  clips: BaseClipBlock[];
  viewport: TimelineViewport; plotWidth: number;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  onMove?: (id: string, startMs: number) => void;
  onTrim?: (id: string, edge: "start" | "end", timeMs: number) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
}) {
  const drag = useRef<{ id: string; kind: "move" | "start" | "end"; startX: number; range: [number, number] } | null>(null);
  const begin = (event: React.PointerEvent, clip: BaseClipBlock, kind: "move" | "start" | "end") => {
    if (!shouldBeginTimelinePointer(event.button, event.isPrimary)) return;
    event.stopPropagation();
    drag.current = { id: clip.id, kind, startX: event.clientX, range: clip.range };
    escapeOwnership.claim();
    onGestureStart?.({ kind: "base-clip", id: clip.id, action: kind === "start" ? "trim-start" : kind === "end" ? "trim-end" : "move" });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const finish = (cancelled: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    escapeOwnership.release();
    onGestureEnd?.({ kind: "base-clip", id: active.id, action: active.kind === "start" ? "trim-start" : active.kind === "end" ? "trim-end" : "move" }, { cancelled });
  };
  const escapeOwnership = useGestureEscapeOwnership(() => finish(true));
  const update = (event: React.PointerEvent, clip: BaseClipBlock) => {
    const active = drag.current;
    if (!active || active.id !== clip.id) return;
    const delta = Math.round((event.clientX - active.startX) / Math.max(1, plotWidth) * (viewport.endMs - viewport.startMs));
    if (active.kind === "move") onMove?.(clip.id, Math.max(0, active.range[0] + delta));
    if (active.kind === "start") onTrim?.(clip.id, "start", Math.min(active.range[1], Math.max(0, active.range[0] + delta)));
    if (active.kind === "end") onTrim?.(clip.id, "end", Math.max(active.range[0], active.range[1] + delta));
  };
  return (
    <div className="flex" style={{ height: ROW_BLOCK }}>
      <div className="shrink-0 flex items-center gap-[8px] pl-[8px] pr-[8px] border-r border-c-border" style={{ width: LEFT_W }}>
        <Film size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0 opacity-60" />
        <span className={clsx(FONT, "text-[11px] font-[450] text-c-text-secondary truncate")}>Base video</span>
      </div>
      <div className="flex-1 relative overflow-hidden" style={{ height: ROW_BLOCK }} aria-label={clips.length ? "Base video track" : "Base video track (empty)"}>
        {clips.map(clip => {
          const left = percent(clip.range[0], viewport);
          const width = percentWidth(clip.range[0], clip.range[1], viewport);
          const tintIsImage = clip.tint?.includes("gradient(");
          return <div key={clip.id} role="button" tabIndex={0} aria-pressed={clip.selected}
            onClick={() => onSelect?.(clip.id)} onDoubleClick={() => onOpen?.(clip.id)}
            onKeyDown={event => {
              if (event.key === "Enter") { event.preventDefault(); onOpen?.(clip.id); }
              else if (event.key === " ") { event.preventDefault(); onSelect?.(clip.id); }
              else if (shouldClaimTimelineGestureEscape(event.key, drag.current?.id === clip.id)) {
                event.preventDefault(); event.stopPropagation(); finish(true);
              }
            }}
            onPointerDown={event => begin(event, clip, "move")} onPointerMove={event => update(event, clip)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
            className={clsx("absolute top-1/2 -translate-y-1/2 h-[20px] rounded-[4px] flex items-center px-[10px] overflow-hidden border bg-c-bg-secondary",
              clip.selected ? "border-c-border-selected-strong" : "border-c-border")}
            style={{ left, width, backgroundColor: !clip.thumbnail && !tintIsImage ? clip.tint : undefined, backgroundImage: clip.thumbnail ? `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url(${clip.thumbnail})` : tintIsImage ? clip.tint : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
            <span aria-label={`Trim start of ${clip.name}`} role="slider" aria-valuemin={0} aria-valuemax={clip.range[1]} aria-valuenow={clip.range[0]} tabIndex={0}
              onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(clip.id, "start", Math.min(clip.range[1], Math.max(0, clip.range[0] + (event.key === "ArrowLeft" ? -100 : 100)))); } }}
              onPointerDown={event => begin(event, clip, "start")} onPointerMove={event => update(event, clip)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)}
              className="absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
            <span aria-label={`Trim end of ${clip.name}`} role="slider" aria-valuemin={clip.range[0]} aria-valuemax={Number.MAX_SAFE_INTEGER} aria-valuenow={clip.range[1]} tabIndex={0}
              onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(clip.id, "end", Math.max(clip.range[0], clip.range[1] + (event.key === "ArrowLeft" ? -100 : 100))); } }}
              onPointerDown={event => begin(event, clip, "end")} onPointerMove={event => update(event, clip)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)}
              className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
            <span className={clsx(FONT, "relative text-[11px] font-[450] truncate", clip.thumbnail || clip.tint ? "text-white" : "text-c-text-secondary")}>{clip.name}</span>
          </div>;
        })}
      </div>
    </div>
  );
}

export function Timeline({
  mode = "slide",
  tracks = DEMO_TRACKS,
  blocks = DEMO_BLOCKS,
  baseClips = [],
  height = 320,
  duration = mode === "master" ? 20000 : 10000,
  frameRate = 30,
  viewport: controlledViewport,
  defaultViewport,
  onViewportChange,
  playhead: controlledPlayhead,
  defaultPlayhead = 300,
  onPlayheadChange,
  playing: controlledPlaying,
  defaultPlaying = false,
  onPlayingChange,
  loop: controlledLoop,
  defaultLoop = false,
  onLoopChange,
  onStop,
  onAddKeyframe,
  onPropertyAddKeyframe,
  onTrackExpandedChange,
  onAggregateKeyframeSelect,
  onKeyframeSelect,
  onKeyframeMove,
  onKeyframeDelete,
  onDeleteSelectedKeyframes,
  onBlockSelect,
  onBlockOpen,
  onBlockContextMenu,
  onBlockMove,
  onBlockTrim,
  onClipSelect,
  onClipOpen,
  onClipMove,
  onClipTrim,
  onGestureStart,
  onGestureEnd,
  revealKeyframe,
  onKeyframeRevealHandled,
  onBack,
}: {
  mode?: TimelineMode;
  tracks?: Track[];
  blocks?: SlideBlock[];
  baseClips?: BaseClipBlock[];
  height?: number;
  duration?: number;
  frameRate?: TimelineFrameRate;
  viewport?: TimelineViewport;
  defaultViewport?: TimelineViewport;
  onViewportChange?: (viewport: TimelineViewport, detail: { source: TimelineViewportChangeSource }) => void;
  playhead?: number;
  defaultPlayhead?: number;
  onPlayheadChange?: (timeMs: number, detail: TimelinePlayheadChangeDetail) => void;
  playing?: boolean;
  defaultPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  loop?: boolean;
  defaultLoop?: boolean;
  onLoopChange?: (loop: boolean) => void;
  onStop?: () => void;
  onAddKeyframe?: (timeMs: number) => void;
  onPropertyAddKeyframe?: (trackId: string, propertyId: string, timeMs: number) => void;
  onTrackExpandedChange?: (trackId: string, expanded: boolean) => void;
  onAggregateKeyframeSelect?: (target: AggregateKeyframeTarget, additive: boolean) => void;
  onKeyframeSelect?: (target: KeyframeTarget, additive: boolean) => void;
  onKeyframeMove?: (target: KeyframeTarget, timeMs: number) => void;
  onKeyframeDelete?: (target: KeyframeTarget) => void;
  onDeleteSelectedKeyframes?: () => void;
  onBlockSelect?: (id: string) => void;
  onBlockOpen?: (id: string) => void;
  onBlockContextMenu?: (id: string, detail: TimelineBlockContextMenuDetail) => void;
  onBlockMove?: (id: string, startMs: number) => void;
  onBlockTrim?: (id: string, edge: "start" | "end", timeMs: number) => void;
  onClipSelect?: (id: string) => void;
  onClipOpen?: (id: string) => void;
  onClipMove?: (id: string, startMs: number) => void;
  onClipTrim?: (id: string, edge: "start" | "end", timeMs: number) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
  /** One-shot request to minimally pan a selected or newly created keyframe into the time viewport. */
  revealKeyframe?: TimelineKeyframeReveal;
  /** Acknowledges consumption so controlled hosts can clear the one-shot request. */
  onKeyframeRevealHandled?: (requestKey: string | number) => void;
  onBack?: () => void;
}) {
  const master = mode === "master";
  const [internalPlayhead, setInternalPlayhead] = useState(defaultPlayhead);
  const [internalPlaying, setInternalPlaying] = useState(defaultPlaying);
  const [internalLoop, setInternalLoop] = useState(defaultLoop);
  const [internalViewport, setInternalViewport] = useState(() => normalizeViewport(defaultViewport ?? { startMs: 0, endMs: duration }, duration));
  const [timelineWidth, setTimelineWidth] = useState(LEFT_W + 1);
  const timelineRef = useRef<HTMLDivElement>(null);
  const viewportTouched = useRef(false);
  const previousDuration = useRef(duration);
  const previousMode = useRef(mode);
  const handledRevealKey = useRef<string | number | null>(null);
  const playhead = controlledPlayhead ?? internalPlayhead;
  const playing = controlledPlaying ?? internalPlaying;
  const loop = controlledLoop ?? internalLoop;
  const viewport = normalizeViewport(controlledViewport ?? internalViewport, duration);
  const plotWidth = Math.max(1, timelineWidth - LEFT_W);
  const setPlayhead = (timeMs: number, source: TimelinePlayheadChangeSource) => {
    if (controlledPlayhead === undefined) setInternalPlayhead(timeMs);
    onPlayheadChange?.(timeMs, { source, millisecondsPerPixel: (viewport.endMs - viewport.startMs) / Math.max(1, plotWidth) });
  };
  const setPlaying = (next: boolean) => { if (controlledPlaying === undefined) setInternalPlaying(next); onPlayingChange?.(next); };
  const setLoop = (next: boolean) => { if (controlledLoop === undefined) setInternalLoop(next); onLoopChange?.(next); };
  const setViewport = (next: TimelineViewport, source: TimelineViewportChangeSource) => {
    const normalized = normalizeViewport(next, duration);
    viewportTouched.current = true;
    if (controlledViewport === undefined) setInternalViewport(normalized);
    onViewportChange?.(normalized, { source });
  };
  const revealTime = (timeMs: number) => {
    if (timelineWidth <= LEFT_W + 1) return;
    const next = revealTimeInViewport(viewport, timeMs, duration, 0.05, Math.max(0.1, RIGHT_OVERLAY_W / plotWidth));
    if (next.startMs !== viewport.startMs || next.endMs !== viewport.endMs) setViewport(next, "keyframe-reveal");
  };

  useEffect(() => {
    const element = timelineRef.current;
    if (!element) return;
    const measure = () => setTimelineWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const contextChanged = previousDuration.current !== duration || previousMode.current !== mode;
    previousDuration.current = duration;
    previousMode.current = mode;
    if (!contextChanged || controlledViewport !== undefined) return;
    setInternalViewport(current => reconcileUncontrolledViewport(current, duration, !viewportTouched.current && defaultViewport === undefined));
  }, [duration, mode, controlledViewport]);

  useEffect(() => {
    const element = timelineRef.current;
    if (!element) return;
    const handleWheel = (event: WheelEvent) => {
      const pageSize = Math.max(1, plotWidth);
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const rect = element.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left - LEFT_W) / plotWidth));
        const deltaY = wheelDeltaPixels(event.deltaY, event.deltaMode, pageSize);
        setViewport(zoomViewport(viewport, ratio, Math.exp(deltaY * .002), duration), "wheel-zoom");
        return;
      }
      const rawPan = wheelPanDelta(event.deltaX, event.deltaY, event.shiftKey);
      if (rawPan === 0) return;
      event.preventDefault();
      setViewport(panViewport(viewport, wheelDeltaPixels(rawPan, event.deltaMode, pageSize), plotWidth, duration), "wheel-pan");
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [viewport.startMs, viewport.endMs, plotWidth, duration, controlledViewport, onViewportChange]);

  useEffect(() => {
    if (!revealKeyframe || !shouldHandleTimelineReveal(master, revealKeyframe.requestKey, handledRevealKey.current, timelineWidth)) return;
    handledRevealKey.current = revealKeyframe.requestKey;
    revealTime(revealKeyframe.timeMs);
    onKeyframeRevealHandled?.(revealKeyframe.requestKey);
  }, [master, revealKeyframe?.requestKey, revealKeyframe?.timeMs, duration, plotWidth, timelineWidth, viewport.startMs, viewport.endMs]);

  // Measure the element the pointer events live on (the ruler container), so the
  // scrub origin can't desync from a separate ref.
  const scrub = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPlayhead(Math.min(duration, Math.max(0, Math.round(xToTime(e.clientX - r.left, viewport, r.width)))), "pointer");
  };
  const [drag, setDrag] = useState(false);
  return (
    <div ref={timelineRef} className="flex flex-col bg-c-bg border-t border-c-border overflow-hidden" style={{ height }}>
      {/* header: transport | ruler | zoom */}
      <div className="relative flex h-[40px] shrink-0 border-b border-c-border">
        <Transport current={playhead} duration={duration} mode={mode} playing={playing} loop={loop} onPlayingChange={setPlaying} onLoopChange={setLoop}
          onStop={() => { setPlaying(false); onStop?.(); }} onAddKeyframe={() => onAddKeyframe?.(playhead)} />
        <div
          className="flex-1 relative cursor-ew-resize overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-border-selected-strong"
          role="slider"
          tabIndex={0}
          aria-label="Playhead"
          aria-keyshortcuts={`ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End Space${master ? "" : `${onAddKeyframe ? " K" : ""}${onDeleteSelectedKeyframes ? " Delete Backspace" : ""}`}`}
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={playhead}
          onPointerDown={e => { setDrag(true); scrub(e); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }}
          onPointerMove={e => drag && scrub(e)}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
          onLostPointerCapture={() => setDrag(false)}
          onKeyDown={event => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            const claim = () => { event.preventDefault(); event.stopPropagation(); };
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              claim();
              const frames = (event.shiftKey ? 10 : 1) * (event.key === "ArrowLeft" ? -1 : 1);
              setPlayhead(stepTimelinePlayhead(playhead, frames, frameRate, duration), "keyboard");
            } else if (!event.shiftKey && event.key === "Home") { claim(); setPlayhead(0, "keyboard"); }
            else if (!event.shiftKey && event.key === "End") { claim(); setPlayhead(duration, "keyboard"); }
            else if (!event.shiftKey && event.key === " ") { claim(); if (!event.repeat) setPlaying(!playing); }
            else if (!event.shiftKey && !master && event.key.toLowerCase() === "k" && onAddKeyframe) { claim(); if (!event.repeat) onAddKeyframe(playhead); }
            else if (!event.shiftKey && !master && (event.key === "Delete" || event.key === "Backspace") && onDeleteSelectedKeyframes) { claim(); if (!event.repeat) onDeleteSelectedKeyframes(); }
          }}
        >
          {master ? <SecondRuler viewport={viewport} width={plotWidth} /> : <Ruler viewport={viewport} width={plotWidth} />}
          {/* playhead handle */}
          <div className="absolute top-[4px] -translate-x-1/2 pointer-events-none" style={{ left: percent(playhead, viewport) }}>
            <svg width="12" height="10" viewBox="0 0 12 10"><path d="M0 0h12v4l-6 6-6-6V0Z" fill={BLUE} /></svg>
          </div>
        </div>
        <div className="absolute z-10 right-0 top-0 bottom-0 flex items-center gap-[8px] px-[12px] border-l border-c-border bg-c-bg">
          <input type="range" aria-label="Timeline zoom" aria-valuetext={`${Math.round(viewportZoomValue(viewport, duration) * 100)}%`}
            min={0} max={100} step={1} value={Math.round(viewportZoomValue(viewport, duration) * 100)}
            onChange={event => setViewport(viewportAtZoomValue(viewport, Number(event.currentTarget.value) / 100, duration), "zoom-control")}
            className="appearance-none w-[91px] h-[20px] cursor-ew-resize bg-transparent rounded-c-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-border-selected-strong [&::-webkit-slider-runnable-track]:h-[6px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-c-bg-secondary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-[12px] [&::-webkit-slider-thumb]:-mt-[3px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-c-bg-brand [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-track]:h-[6px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-c-bg-secondary [&::-moz-range-thumb]:size-[12px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-c-bg-brand" />
          <button aria-label="Collapse timeline" className="size-[24px] rounded-c-md flex items-center justify-center text-c-icon hover:bg-c-bg-hover">
            <PanelBottomClose size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto relative">
        {master ? (
          <>
            <BlockTrack blocks={blocks} viewport={viewport} plotWidth={plotWidth} onSelect={onBlockSelect} onOpen={onBlockOpen} onContextMenu={onBlockContextMenu} onMove={onBlockMove} onTrim={onBlockTrim} onGestureStart={onGestureStart} onGestureEnd={onGestureEnd} />
            <BaseVideoTrack clips={baseClips} viewport={viewport} plotWidth={plotWidth} onSelect={onClipSelect} onOpen={onClipOpen} onMove={onClipMove} onTrim={onClipTrim} onGestureStart={onGestureStart} onGestureEnd={onGestureEnd} />
          </>
        ) : (
          <>
            {/* ← Project back affordance — slide-local view (you drilled INTO a slide) */}
            <div className="flex items-center" style={{ height: ROW_LAYER }}>
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to project"
                className={clsx(FONT, "shrink-0 flex items-center gap-[4px] pl-[8px] pr-[8px] h-full border-r border-c-border text-[11px] font-[450] text-c-text-secondary hover:text-c-text")}
                style={{ width: LEFT_W }}
              >
                <ChevronLeftBack size={14} strokeWidth={1.5} className="shrink-0" />
                <span>Project</span>
              </button>
            </div>
            {tracks.map((t, i) => <TrackRows key={t.id ?? i} track={t} trackIndex={i} viewport={viewport} plotWidth={plotWidth}
              onExpandedChange={onTrackExpandedChange} onAggregateKeyframeSelect={onAggregateKeyframeSelect}
              onKeyframeSelect={(target, additive) => { revealTime(target.timeMs); onKeyframeSelect?.(target, additive); }} onKeyframeMove={onKeyframeMove} onKeyframeDelete={onKeyframeDelete}
              onGestureStart={onGestureStart} onGestureEnd={onGestureEnd}
              onPropertyAddKeyframe={(trackId, propertyId) => onPropertyAddKeyframe?.(trackId, propertyId, playhead)} />)}
          </>
        )}
        {/* shared playhead line spanning the body */}
        <div className="absolute top-0 bottom-0 right-0 overflow-hidden pointer-events-none" style={{ left: LEFT_W }}>
          <div className="absolute top-0 bottom-0 w-px" style={{ left: percent(playhead, viewport), backgroundColor: BLUE }} />
        </div>
      </div>
    </div>
  );
}
