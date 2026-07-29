import { useEffect, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import { clsx } from "clsx";
import { Play, Pause, Square, Circle, Diamond, Repeat, PanelBottomClose, PanelBottomOpen, PanelLeftClose, PanelLeftOpen, Eye, EyeOff, ChevronDown, ChevronRight as DisclosureRight, ChevronLeft, ChevronRight, ChevronLeft as ChevronLeftBack, Volume2, VolumeX, Plus, Lock, LockOpen, Layers, SquarePlay, AudioLines } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { collectAggregateKeyframes, createTimelineEdgeDragController, formatMasterRulerTick, normalizeViewport, panViewport, reconcileUncontrolledViewport, revealTimeInViewport, tickTimes, timelineAnchorRatioAtX, timelineDragDeltaMs, timelinePointerPanDelta, timelineScrollbarPan, timelineScrollbarThumb, timelineScrollTop, timelineViewportChanged, timeToX, viewportAtZoomValue, viewportZoomValue, wheelDeltaPixels, wheelPanDelta, xToTime, zoomViewport, type TimelineEdgeDragController, type TimelineViewport } from "./timelineModel";
import { LayerTypeIcon, type LayerAutoLayoutMode, type LayerIconType } from "./LayerTypeIcon";
import { rowSelectionHighlightClassName, type RowSelectionState } from "./RowSelectionState";
import { ScrollArea, IconButtonRow, type IconBtn } from "./Panel";
import { Menu, MenuRow } from "./Menu";
import { NumericInput } from "./Input";
import { useComposaMode } from "./useComposaMode";
import { EASING_PRESETS, easingControlPoints, easingPresetLabel, easingSvgPath, type EasingPreset, type NamedEasingPreset } from "./easing";

// ─── Timeline ───────────────────────────────────────────────────────────────────
// Polymorphic timeline region (Composa editor spec: docs/composa/specs/timeline.md).
// Two views sharing one playhead:
//   • mode="slide"  (default) — slide-local element-animation timeline
//     (After-Effects / Figma-Slides style): transport + ms-ruler + track list +
//     keyframe lanes. Componentized from the Figma export (node 2212-1693).
//   • mode="master" — full-project strip: seconds-ruler + Compositions, Base video,
//     and an Audio lane (waveform clips) + transport.
// Data-driven: tracks/blocks/keyframes/bars are positioned along a shared time→px
// scale. The active accent (playhead, keyframes, zoom fill) is Figma blue #0d99ff.

const FONT = "font-[family-name:var(--composa-font-family)]";
const LEFT_W = 297;       // track-list width
const ROW_LAYER = 28;
const ROW_PROP = 28;      // raised from 24 → contains the 20px bar with 4px above/below
const ROW_BLOCK = 62;     // master-view lane height — two-row header ([icon][label][+] + [vis][solo][mute][lock], Figma 2-4060); the lane's clip bar fills this row height (inset 4px). Raised 56→62 for more top/bottom header inset (the two header rows were vertically cramped) — the extra height reads as ~3pt of breathing room above and below via the header's justify-center, and gives the Audio lane's stacked name+waveform room.
// Accepted MIME prefixes per master lane, used to type the file-drop target
// (`useLaneFileDrop`): the Video lane accepts image + video, the Audio lane accepts
// audio. An audio file dragged over the Video lane therefore does not highlight,
// and vice-versa. Kept here (not in the host) so the drop affordance is typed by the
// DS component that owns the lane; the host still re-checks kind before placing.
const VIDEO_LANE_DROP_ACCEPT = ["image/", "video/"] as const;
const AUDIO_LANE_DROP_ACCEPT = ["audio/"] as const;
const RIGHT_OVERLAY_W = 148; // zoom slider + collapse control + padding/border
const BLUE = "#0d99ff";
// Playhead treatment (Composa#344): false = the original DISCONNECTED look (pentagon
// handle in the header, separate body line — Samuel's preference); true = the
// continuous stroke through the header ruler (#342). Flip this one constant to switch.
const PLAYHEAD_CONNECTED = false;

export type TimelineMode = "master" | "slide";
export type TimelineFrameRate = 24 | 25 | 30 | 60;
export type { TimelineViewport } from "./timelineModel";
export type TimelineViewportChangeSource = "wheel-zoom" | "wheel-pan" | "pointer-pan" | "zoom-control" | "keyframe-reveal" | "edge-drag";
export type TimelinePlayheadChangeSource = "pointer" | "keyboard";
export interface TimelinePlayheadChangeDetail {
  source: TimelinePlayheadChangeSource;
  millisecondsPerPixel: number;
}
export interface TimelineClipTrimDetail {
  source: "pointer" | "keyboard";
  millisecondsPerPixel: number;
}
export const timelineClipTrimDetail = (source: TimelineClipTrimDetail["source"], viewport: TimelineViewport, plotWidth: number): TimelineClipTrimDetail => ({
  source,
  millisecondsPerPixel: (viewport.endMs - viewport.startMs) / Math.max(1, plotWidth),
});
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

export type TrackType = LayerIconType;
export interface TimelineTrackSelectionModifiers { toggle: boolean; range: boolean; }
export const shouldActivateTimelineTrackKey = (key: string, ownsEventTarget: boolean) => ownsEventTarget && (key === "Enter" || key === " ");
export const timelineTrackExpansionForKey = (key: string) => key === "ArrowRight" ? true : key === "ArrowLeft" ? false : null;
export function timelineTrackNavigationIndex(current: number, count: number, key: string): number | null {
  if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(key)) return null;
  if (count <= 0) return current;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return Math.max(0, Math.min(count - 1, current + (key === "ArrowUp" ? -1 : 1)));
}
export type TimelineEasingPreset = EasingPreset;
export interface TimelineKeyframe {
  id: string;
  timeMs: number;
  selected?: boolean;
  easing?: TimelineEasingPreset;
  easingEditable?: boolean;
  /** Independent segment selection for the interval owned by this keyframe. */
  easingSelected?: boolean;
}
export type TimelineKeyframeValue = number | TimelineKeyframe;
export interface PropTrack {
  id?: string;
  name: string;
  value?: number;              // interpolated value at the playhead (inline value entry — #343b)
  valueEditable?: boolean;     // false for read-only compiled/preset tracks
  keyframes: TimelineKeyframeValue[]; // numbers preserve the demo/legacy contract
  bar?: [number, number];      // duration bar [start,end] ms
  hidden?: boolean;            // greyed + eye-off
  accent?: boolean;            // purple-selected track
}
/** An Animate preset shown as a labeled bar (its resolved window) — Composa#362. */
export interface TimelinePresetBar {
  id: string;
  label: string;
  timeRange: [number, number];
  phase?: "build-in" | "action" | "build-out";
  hidden?: boolean;
  /** The app owns exact authored-animation selection; selected bars are solid blue. */
  selected?: boolean;
  /** Locked ancestry remains readable and selectable, but cannot expose timing affordances. */
  editable?: boolean;
}
export interface Track {
  id?: string;
  name: string;
  type: TrackType;
  bar?: [number, number];
  props: PropTrack[];
  /** Animate-preset bars, rendered as labeled bar rows above the property rows (#362). */
  bars?: TimelinePresetBar[];
  /** Visual nesting only. Product hierarchy remains host-owned. */
  depth?: number;
  /** Controlled property-row visibility. Undefined preserves the legacy expanded state. */
  expanded?: boolean;
  selected?: boolean;
  /**
   * Controlled visual projection for hierarchy-aware selection. When omitted,
   * `selected` preserves the legacy selected/default behavior.
   */
  selectionState?: RowSelectionState;
  autoLayoutMode?: LayerAutoLayoutMode;
  /** Host-authorized duration editing. False preserves duration presentation without exposing inert controls. */
  durationBarEditable?: boolean;
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
// master-view audio clip — a clip on the Audio lane. Mirrors BaseClipBlock but
// carries an optional normalized waveform (0..1 peaks) instead of a thumbnail.
// When `waveform` is absent a deterministic stub waveform renders (real peak
// extraction from the source asset is a later effort — see AudioLaneWaveform).
export interface AudioClipBlock {
  id: string;
  name: string;
  range: [number, number];
  selected?: boolean;
  waveform?: number[];
}

// ── master lane headers (Figma 2-4060) ──────────────────────────────────────────
// The three master lanes ("Slides", "Video", "Audio"). Used to disambiguate the
// shared header control callbacks (`onLaneAdd`, `onLaneVisibilityToggle`, …).
export type MasterLane = "slides" | "video" | "audio";
// Per-lane header control state. Every field defaults to its "resting" value
// (visible, not soloed/muted/locked) when a lane is absent from `laneControls`.
// These are presentation flags: the host decides what, if anything, they mean.
export interface MasterLaneControlState {
  visible?: boolean;   // default true  — eye/eye-off
  solo?: boolean;      // default false — "S"
  muted?: boolean;     // default false — speaker/speaker-off
  locked?: boolean;    // default false — padlock
}

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
export interface TimelineEasingSegmentTarget {
  trackId: string;
  propertyId: string;
  keyframeId: string;
  nextKeyframeId: string;
  startMs: number;
  endMs: number;
  easing: TimelineEasingPreset;
}
export type TimelineGestureTarget =
  | { kind: "keyframe"; id: string; action: "move"; keyframe: KeyframeTarget }
  | { kind: "duration-bar"; id: string; action: TimelineDurationBarAction }
  | { kind: "preset-bar"; id: string; action: TimelineDurationBarAction }
  | { kind: "slide-block" | "base-clip" | "audio-clip"; id: string; action: "move" | "trim-start" | "trim-end" };

export function shouldClaimTimelineGestureEscape(key: string, gestureActive: boolean): boolean {
  return key === "Escape" && gestureActive;
}

export function stepTimelinePlayhead(timeMs: number, frameDelta: number, frameRate: TimelineFrameRate, durationMs: number): number {
  return Math.min(durationMs, Math.max(0, timeMs + frameDelta * 1000 / frameRate));
}

export const shouldBeginTimelinePointer = (button: number, isPrimary: boolean): boolean => button === 0 && isPrimary;
export const shouldBeginTimelineMiddlePan = (button: number, isPrimary: boolean, ownsPanSurface: boolean): boolean =>
  button === 1 && isPrimary && ownsPanSurface;

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

function useTimelineEdgeDragAutoScroll(
  viewportRef: MutableRefObject<TimelineViewport>,
  durationMs: number,
  setViewport: (viewport: TimelineViewport, source: TimelineViewportChangeSource) => void,
): TimelineEdgeDragController {
  const durationRef = useRef(durationMs);
  durationRef.current = durationMs;
  const setViewportRef = useRef(setViewport);
  setViewportRef.current = setViewport;
  const controller = useRef<TimelineEdgeDragController | null>(null);
  if (!controller.current) controller.current = createTimelineEdgeDragController({
    getViewport: () => viewportRef.current,
    getDurationMs: () => durationRef.current,
    setViewport: next => {
      viewportRef.current = next;
      setViewportRef.current(next, "edge-drag");
    },
    requestFrame: callback => requestAnimationFrame(callback),
    cancelFrame: handle => cancelAnimationFrame(handle),
  });
  useEffect(() => () => controller.current?.cancel(), []);
  return controller.current;
}

const keyframeTime = (keyframe: TimelineKeyframeValue) => typeof keyframe === "number" ? keyframe : keyframe.timeMs;
// Keep the legacy numeric ID byte-for-byte compatible for individual keyframe callbacks.
const keyframeId = (keyframe: TimelineKeyframeValue, index: number) => typeof keyframe === "number" ? `keyframe-${index}-${keyframe}` : keyframe.id;
// Aggregate identities must be unique across properties without changing the legacy callback contract above.
const aggregateKeyframeId = (keyframe: TimelineKeyframeValue, index: number, propertyId: string) => typeof keyframe === "number" ? `${propertyId}:aggregate-keyframe-${index}-${keyframe}` : keyframe.id;

export function timelineTimeAtClientX(clientX: number, left: number, width: number, viewport: TimelineViewport): number {
  // Route through xToTime so the origin inset (PLOT_INSET_FRACTION) is respected.
  return Math.round(Math.max(viewport.startMs, Math.min(viewport.endMs, xToTime(clientX - left, viewport, width))));
}
const percent = (timeMs: number, viewport: TimelineViewport) => `${timeToX(timeMs, viewport, 100)}%`;
const percentWidth = (startMs: number, endMs: number, viewport: TimelineViewport) => `${timeToX(endMs, viewport, 100) - timeToX(startMs, viewport, 100)}%`;

const TIMELINE_QUICK_EASING_PRESETS = EASING_PRESETS.filter(preset =>
  ["linear", "ease-in", "ease-out", "ease-in-out"].includes(preset.value));

function EasingSegment({
  target,
  propertyName,
  selected,
  lineActive = false,
  accent,
  viewport,
  onSelect,
  onPresetChange,
}: {
  target: TimelineEasingSegmentTarget;
  propertyName: string;
  selected: boolean;
  /** The property has a selected keyframe — its connecting line reads blue (Composa#320). */
  lineActive?: boolean;
  accent: boolean;
  viewport: TimelineViewport;
  onSelect?: (target: TimelineEasingSegmentTarget) => void;
  onPresetChange?: (target: TimelineEasingSegmentTarget, easing: NamedEasingPreset) => void;
}) {
  const [open, setOpen] = useState(false);
  const mode = useComposaMode();
  const interactive = !!onSelect || !!onPresetChange;
  const label = `${propertyName} ${easingPresetLabel(target.easing)} easing from ${target.startMs}ms to ${target.endMs}ms`;
  const data = {
    "data-easing-segment": `${target.trackId}:${target.propertyId}:${target.keyframeId}`,
    "data-easing-preset": target.easing,
    "data-easing-start-ms": target.startMs,
    "data-easing-end-ms": target.endMs,
  } as const;
  const segmentLeft = timeToX(target.startMs, viewport, 100);
  const segmentWidth = timeToX(target.endMs, viewport, 100) - segmentLeft;
  // Figma easing handle (Composa#321): a small SQUARE blue box holding the curve,
  // hidden by default and revealed on hover (or keyboard focus). No selected-state
  // representation — Figma has none, so we match first.
  const className = clsx(
    "group/easing absolute top-1/2 z-[1] h-[20px] w-[28px] -translate-x-1/2 -translate-y-1/2 rounded-c-sm outline-none",
    interactive && "cursor-pointer",
    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-focus-ring",
  );
  const content = (
      <span
        className={clsx(
          // Opaque bg fill so the connecting line is occluded ('cut-through'), not seen
          // passing behind the box (Composa#321).
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center size-[16px] rounded-[4px] border bg-c-bg",
          // Hidden until hover/focus — but a SELECTED segment (its easing is open in the
          // inspector) stays in view (Composa#321).
          interactive && !selected && "opacity-0 transition-opacity group-hover/easing:opacity-100 group-focus-visible/easing:opacity-100",
        )}
        style={{ borderColor: "#0d99ff" }}
      >
        <svg aria-hidden viewBox="0 0 28 10" preserveAspectRatio="xMidYMid meet" className="h-[8px] w-[12px]">
          <path d={easingSvgPath(easingControlPoints(target.easing))} fill="none" stroke="#0d99ff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
  );
  const segment = interactive ? (
    <button
      type="button"
      {...data}
      aria-label={label}
      aria-pressed={selected}
      aria-haspopup={onPresetChange ? "menu" : undefined}
      aria-keyshortcuts={onPresetChange ? "Enter Shift+Enter" : undefined}
      onClick={event => { event.stopPropagation(); onSelect?.(target); }}
      onKeyDown={event => {
        if (event.key !== "Enter" || !event.shiftKey || !onPresetChange) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
      }}
      onDoubleClick={event => {
        event.preventDefault();
        event.stopPropagation();
        if (onPresetChange) setOpen(true);
      }}
      className={className}
      style={{ left: `${segmentLeft + segmentWidth / 2}%` }}
    >
      {content}
    </button>
  ) : (
    <span
      role="img"
      {...data}
      aria-label={label}
      className={clsx(className, "pointer-events-none")}
      style={{ left: `${segmentLeft + segmentWidth / 2}%` }}
    >
      {content}
    </span>
  );
  const control = !onPresetChange ? segment : (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>{segment}</PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          data-composa-mode={mode}
          side="bottom"
          align="center"
          sideOffset={4}
          collisionPadding={8}
          avoidCollisions
          sticky="partial"
          aria-label={`${propertyName} easing presets`}
          className="z-50 outline-none"
        >
          <Menu minWidth={148}>
            {target.easing === "custom" && <MenuRow type="heading" label="Custom curve" />}
            {TIMELINE_QUICK_EASING_PRESETS.map(preset => (
              <MenuRow
                key={preset.value}
                type="checkmark"
                selectionRole="radio"
                label={preset.label}
                checked={target.easing === preset.value}
                onClick={() => {
                  onPresetChange(target, preset.value);
                  setOpen(false);
                }}
              />
            ))}
          </Menu>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
  return (
    <>
      <span
        aria-hidden
        className={clsx("pointer-events-none absolute top-1/2 h-px -translate-y-1/2", lineActive ? "bg-[#0d99ff]" : accent ? "bg-c-bg-brand" : "bg-c-text-secondary")}
        style={{ left: `${segmentLeft}%`, width: `${segmentWidth}%` }}
      />
      {control}
    </>
  );
}

export interface TimelineDurationBarProjection {
  authoredStartMs: number;
  authoredEndMs: number;
  visibleStartMs: number;
  visibleEndMs: number;
  clippedStart: boolean;
  clippedEnd: boolean;
  leftPercent: number;
  widthPercent: number;
}

export type TimelineDurationBarAction = "move" | "trim-start" | "trim-end";
export interface TimelineDurationBarChange {
  trackId: string;
  action: TimelineDurationBarAction;
  startMs: number;
  endMs: number;
}

/** A direct manipulation request for one first-class Animate preset bar. */
export interface TimelinePresetBarChange extends TimelineDurationBarChange {
  presetId: string;
}

export function timelineDurationBarTargetRange(
  range: readonly [number, number],
  action: TimelineDurationBarAction,
  deltaMs: number,
  durationMs: number,
  minimumSpanMs = 1,
): [number, number] {
  const [startMs, endMs] = range;
  const boundedDuration = Math.max(endMs, Number.isFinite(durationMs) ? durationMs : endMs);
  if (action === "move") {
    const offset = Math.max(-startMs, Math.min(boundedDuration - endMs, deltaMs));
    return [Math.round(startMs + offset), Math.round(endMs + offset)];
  }
  if (action === "trim-start") {
    return [Math.round(Math.max(0, Math.min(endMs - minimumSpanMs, startMs + deltaMs))), endMs];
  }
  return [startMs, Math.round(Math.min(boundedDuration, Math.max(startMs + minimumSpanMs, endMs + deltaMs)))];
}

/** Projects an authored parent-layer duration into the visible timeline viewport. */
export function timelineDurationBarProjection(
  range: readonly [number, number],
  viewport: TimelineViewport,
): TimelineDurationBarProjection | null {
  const [authoredStartMs, authoredEndMs] = range;
  if (![authoredStartMs, authoredEndMs].every(Number.isFinite) || authoredEndMs <= authoredStartMs) return null;
  const visibleStartMs = Math.max(authoredStartMs, viewport.startMs);
  const visibleEndMs = Math.min(authoredEndMs, viewport.endMs);
  if (visibleEndMs <= visibleStartMs) return null;
  return {
    authoredStartMs,
    authoredEndMs,
    visibleStartMs,
    visibleEndMs,
    clippedStart: visibleStartMs !== authoredStartMs,
    clippedEnd: visibleEndMs !== authoredEndMs,
    leftPercent: timeToX(visibleStartMs, viewport, 100),
    widthPercent: timeToX(visibleEndMs, viewport, 100) - timeToX(visibleStartMs, viewport, 100),
  };
}

function DurationBar({ trackId, name, range, projection, selectionState, viewport, plotWidth, duration, laneRef, edgeDrag, onChange, onGestureStart, onGestureEnd }: {
  trackId: string;
  name: string;
  range: [number, number];
  projection: TimelineDurationBarProjection;
  selectionState: RowSelectionState;
  viewport: TimelineViewport;
  plotWidth: number;
  duration: number;
  laneRef: { current: HTMLDivElement | null };
  edgeDrag: TimelineEdgeDragController;
  onChange?: (change: TimelineDurationBarChange) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
}) {
  const drag = useRef<{
    action: TimelineDurationBarAction;
    initialRange: [number, number];
    startX: number;
    startViewportStartMs: number;
  } | null>(null);
  const updateAtViewport = (clientX: number, currentViewport: TimelineViewport) => {
    const active = drag.current;
    if (!active) return;
    const deltaMs = timelineDragDeltaMs(active.startX, clientX, active.startViewportStartMs, currentViewport, plotWidth);
    const [startMs, endMs] = timelineDurationBarTargetRange(active.initialRange, active.action, deltaMs, duration);
    onChange?.({ trackId, action: active.action, startMs, endMs });
  };
  const finish = (cancelled: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    edgeDrag.stop();
    escapeOwnership.release();
    onGestureEnd?.({ kind: "duration-bar", id: trackId, action: active.action }, { cancelled });
  };
  const escapeOwnership = useGestureEscapeOwnership(() => finish(true));
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => () => finishRef.current(true), []);
  const begin = (action: TimelineDurationBarAction, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!shouldBeginTimelinePointer(event.button, event.isPrimary)) return;
    event.stopPropagation();
    edgeDrag.start(() => finish(true));
    drag.current = { action, initialRange: range, startX: event.clientX, startViewportStartMs: viewport.startMs };
    escapeOwnership.claim();
    onGestureStart?.({ kind: "duration-bar", id: trackId, action });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const rect = laneRef.current?.getBoundingClientRect();
    if (!rect) { updateAtViewport(event.clientX, viewport); return; }
    edgeDrag.update(event.clientX, { left: rect.left, width: rect.width }, next => updateAtViewport(event.clientX, next));
  };
  const step = (action: TimelineDurationBarAction, event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    event.stopPropagation();
    const target = { kind: "duration-bar", id: trackId, action } as const;
    const deltaMs = (event.shiftKey ? 1_000 : 100) * (event.key === "ArrowLeft" ? -1 : 1);
    const [startMs, endMs] = timelineDurationBarTargetRange(range, action, deltaMs, duration);
    onGestureStart?.(target);
    onChange?.({ trackId, action, startMs, endMs });
    onGestureEnd?.(target, { cancelled: false });
  };
  const barClassName = clsx(
    // Fill most of the lane height (Composa#324) — was a thin 12px bar.
    "absolute top-1/2 h-[20px] -translate-y-1/2 border",
    projection.clippedStart ? "rounded-l-none border-l-0" : "rounded-l-[4px]",
    projection.clippedEnd ? "rounded-r-none border-r-0" : "rounded-r-[4px]",
    selectionState === "selected"
      ? "border-c-border-selected-strong bg-c-bg-brand"
      // Unselected: de-emphasized light-secondary stroke (matches the timeline line /
      // diamond stroke and the secondary property-name text) — Composa#324/#320.
      : "border-c-text-secondary bg-c-bg-secondary",
  );
  const data = {
    "data-timeline-duration-bar": trackId,
    "data-duration-start-ms": projection.authoredStartMs,
    "data-duration-end-ms": projection.authoredEndMs,
    "data-visible-start-ms": projection.visibleStartMs,
    "data-visible-end-ms": projection.visibleEndMs,
    "data-clipped-start": projection.clippedStart,
    "data-clipped-end": projection.clippedEnd,
    "data-duration-bar-state": selectionState === "selected" ? "selected" : "neutral",
  } as const;
  const style = { left: `${projection.leftPercent}%`, width: `${projection.widthPercent}%` };
  if (!onChange) return <span role="img" aria-label={`${name} duration ${projection.authoredStartMs}ms to ${projection.authoredEndMs}ms`} {...data} className={clsx("pointer-events-none", barClassName)} style={style} />;
  return (
    <div role="group" aria-label={`${name} duration ${projection.authoredStartMs}ms to ${projection.authoredEndMs}ms`} {...data} className={barClassName} style={style}>
      <button type="button" aria-label={`Move ${name} duration`} aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight" data-duration-bar-action="move"
        onPointerDown={event => begin("move", event)} onPointerMove={move}
        onKeyDown={event => step("move", event)}
        onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
        className="absolute inset-0 cursor-grab rounded-[inherit] bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring active:cursor-grabbing" />
      {/* Visible L/R drag indicators (Composa#324) — grip pips inset at each edge. */}
      {!projection.clippedStart && <span className={clsx("pointer-events-none absolute left-[3px] top-1/2 z-[1] h-[10px] w-[2px] -translate-y-1/2 rounded-full", selectionState === "selected" ? "bg-white" : "bg-c-icon-secondary")} />}
      {!projection.clippedEnd && <span className={clsx("pointer-events-none absolute right-[3px] top-1/2 z-[1] h-[10px] w-[2px] -translate-y-1/2 rounded-full", selectionState === "selected" ? "bg-white" : "bg-c-icon-secondary")} />}
      {!projection.clippedStart && <button type="button" aria-label={`Scale ${name} duration from start`} aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight" data-duration-bar-action="trim-start"
        onPointerDown={event => begin("trim-start", event)} onPointerMove={move}
        onKeyDown={event => step("trim-start", event)}
        onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
        className="absolute -left-[3px] top-1/2 z-[2] h-[20px] w-[7px] -translate-y-1/2 cursor-ew-resize rounded-c-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring" />}
      {!projection.clippedEnd && <button type="button" aria-label={`Scale ${name} duration from end`} aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight" data-duration-bar-action="trim-end"
        onPointerDown={event => begin("trim-end", event)} onPointerMove={move}
        onKeyDown={event => step("trim-end", event)}
        onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
        className="absolute -right-[3px] top-1/2 z-[2] h-[20px] w-[7px] -translate-y-1/2 cursor-ew-resize rounded-c-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring" />}
    </div>
  );
}

/**
 * A first-class Animate preset window. It deliberately shares the parent duration
 * bar's pointer/keyboard and Escape semantics, while leaving scheduling and
 * persistence to the controlled host. Presets are not keyframes.
 */
function PresetBar({ trackId, preset, projection, viewport, plotWidth, duration, laneRef, edgeDrag, onSelect, onChange, onGestureStart, onGestureEnd }: {
  trackId: string;
  preset: TimelinePresetBar;
  projection: TimelineDurationBarProjection;
  viewport: TimelineViewport;
  plotWidth: number;
  duration: number;
  laneRef: { current: HTMLDivElement | null };
  edgeDrag: TimelineEdgeDragController;
  onSelect?: (trackId: string, presetId: string) => void;
  onChange?: (change: TimelinePresetBarChange) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
}) {
  const drag = useRef<{
    action: TimelineDurationBarAction;
    initialRange: [number, number];
    startX: number;
    startViewportStartMs: number;
  } | null>(null);
  const selected = !!preset.selected;
  const name = `${preset.label} animation`;
  const updateAtViewport = (clientX: number, currentViewport: TimelineViewport) => {
    const active = drag.current;
    if (!active) return;
    const deltaMs = timelineDragDeltaMs(active.startX, clientX, active.startViewportStartMs, currentViewport, plotWidth);
    const [startMs, endMs] = timelineDurationBarTargetRange(active.initialRange, active.action, deltaMs, duration);
    onChange?.({ trackId, presetId: preset.id, action: active.action, startMs, endMs });
  };
  const finish = (cancelled: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    edgeDrag.stop();
    escapeOwnership.release();
    onGestureEnd?.({ kind: "preset-bar", id: preset.id, action: active.action }, { cancelled });
  };
  const escapeOwnership = useGestureEscapeOwnership(() => finish(true));
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => () => finishRef.current(true), []);
  const select = () => onSelect?.(trackId, preset.id);
  const begin = (action: TimelineDurationBarAction, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!shouldBeginTimelinePointer(event.button, event.isPrimary)) return;
    event.stopPropagation();
    select();
    edgeDrag.start(() => finish(true));
    drag.current = { action, initialRange: preset.timeRange, startX: event.clientX, startViewportStartMs: viewport.startMs };
    escapeOwnership.claim();
    onGestureStart?.({ kind: "preset-bar", id: preset.id, action });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    const rect = laneRef.current?.getBoundingClientRect();
    if (!rect) { updateAtViewport(event.clientX, viewport); return; }
    edgeDrag.update(event.clientX, { left: rect.left, width: rect.width }, next => updateAtViewport(event.clientX, next));
  };
  const step = (action: TimelineDurationBarAction, event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    event.stopPropagation();
    select();
    const target = { kind: "preset-bar", id: preset.id, action } as const;
    const deltaMs = (event.shiftKey ? 1_000 : 100) * (event.key === "ArrowLeft" ? -1 : 1);
    const [startMs, endMs] = timelineDurationBarTargetRange(preset.timeRange, action, deltaMs, duration);
    onGestureStart?.(target);
    onChange?.({ trackId, presetId: preset.id, action, startMs, endMs });
    onGestureEnd?.(target, { cancelled: false });
  };
  const data = {
    "data-timeline-preset-bar": preset.id,
    "data-preset-track-id": trackId,
    "data-preset-start-ms": projection.authoredStartMs,
    "data-preset-end-ms": projection.authoredEndMs,
    "data-preset-bar-state": selected ? "selected" : "neutral",
  } as const;
  const style = { left: `${projection.leftPercent}%`, width: `${projection.widthPercent}%` };
  const barClassName = clsx(
    "absolute top-1/2 h-[20px] -translate-y-1/2 border overflow-hidden",
    projection.clippedStart ? "rounded-l-none border-l-0" : "rounded-l-[4px]",
    projection.clippedEnd ? "rounded-r-none border-r-0" : "rounded-r-[4px]",
    selected ? "border-c-border-selected-strong bg-c-bg-brand" : "border-[#0d99ff] bg-[#0d99ff]/10",
  );
  const labelClassName = clsx(FONT, "text-[11px] truncate", selected ? "text-white" : "text-[#0d99ff]");
  const staticButton = (
    <button type="button" aria-label={`Select ${name}`} aria-pressed={selected} onClick={select}
      className="absolute inset-0 cursor-pointer bg-transparent text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-focus-ring">
      <span className={clsx("absolute inset-y-0 left-[10px] right-[10px] flex items-center", labelClassName)}>{preset.label}</span>
    </button>
  );
  if (!onChange) return <div role="group" aria-label={`${name} ${projection.authoredStartMs}ms to ${projection.authoredEndMs}ms`} {...data} className={barClassName} style={style}>{staticButton}</div>;
  return (
    <div role="group" aria-label={`${name} ${projection.authoredStartMs}ms to ${projection.authoredEndMs}ms`} {...data} className={barClassName} style={style}>
      <button type="button" aria-label={`Move ${name}`} aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight" data-preset-bar-action="move"
        onPointerDown={event => begin("move", event)} onPointerMove={move} onKeyDown={event => step("move", event)}
        onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
        className="absolute inset-0 cursor-grab bg-transparent text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-focus-ring active:cursor-grabbing">
        <span className={clsx("absolute inset-y-0 left-[10px] right-[10px] flex items-center", labelClassName)}>{preset.label}</span>
      </button>
      {selected && !projection.clippedStart && <span aria-hidden className="pointer-events-none absolute left-[3px] top-1/2 z-[1] h-[10px] w-[2px] -translate-y-1/2 rounded-full bg-white" />}
      {selected && !projection.clippedEnd && <span aria-hidden className="pointer-events-none absolute right-[3px] top-1/2 z-[1] h-[10px] w-[2px] -translate-y-1/2 rounded-full bg-white" />}
      {selected && !projection.clippedStart && <button type="button" aria-label={`Trim ${name} from start`} aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight" data-preset-bar-action="trim-start"
        onPointerDown={event => begin("trim-start", event)} onPointerMove={move} onKeyDown={event => step("trim-start", event)}
        onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
        className="absolute -left-[3px] top-1/2 z-[2] h-[20px] w-[7px] -translate-y-1/2 cursor-ew-resize rounded-c-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring" />}
      {selected && !projection.clippedEnd && <button type="button" aria-label={`Trim ${name} from end`} aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight" data-preset-bar-action="trim-end"
        onPointerDown={event => begin("trim-end", event)} onPointerMove={move} onKeyDown={event => step("trim-end", event)}
        onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
        className="absolute -right-[3px] top-1/2 z-[2] h-[20px] w-[7px] -translate-y-1/2 cursor-ew-resize rounded-c-sm bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring" />}
    </div>
  );
}

function Lane({ prop, trackId, propertyId, active = false, height, viewport, plotWidth, edgeDrag, onSelect, onMove, onDelete, onEasingSelect, onEasingPresetChange, onGestureStart, onGestureEnd }: {
  prop: PropTrack; trackId: string; propertyId: string;
  /** Parent object has a selected keyframe — lines + unselected diamonds go blue (Composa#320). */
  active?: boolean; height: number;
  viewport: TimelineViewport; plotWidth: number;
  edgeDrag: TimelineEdgeDragController;
  onSelect?: (target: KeyframeTarget, additive: boolean) => void;
  onMove?: (target: KeyframeTarget, timeMs: number) => void;
  onDelete?: (target: KeyframeTarget) => void;
  onEasingSelect?: (target: TimelineEasingSegmentTarget) => void;
  onEasingPresetChange?: (target: TimelineEasingSegmentTarget, easing: NamedEasingPreset) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
}) {
  const laneMode = useComposaMode();
  // Right-click keyframe context menu (Composa#345) — the id of the keyframe whose menu is open.
  const [menuKeyframeId, setMenuKeyframeId] = useState<string | null>(null);
  const kfs = prop.keyframes;
  const times = kfs.map(keyframeTime);
  const first = times.length ? Math.min(...times) : 0;
  const last = times.length ? Math.max(...times) : 0;
  const laneRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; startX: number; startTime: number; startViewportStartMs: number; target: KeyframeTarget } | null>(null);
  const updateAtViewport = (clientX: number, currentViewport: TimelineViewport) => {
    const active = drag.current;
    if (!active) return;
    const deltaMs = timelineDragDeltaMs(active.startX, clientX, active.startViewportStartMs, currentViewport, plotWidth);
    onMove?.(active.target, Math.max(0, Math.round(active.startTime + deltaMs)));
  };
  const finish = (cancelled: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    edgeDrag.stop();
    escapeOwnership.release();
    onGestureEnd?.({ kind: "keyframe", id: active.target.keyframeId, action: "move", keyframe: active.target }, { cancelled });
  };
  const escapeOwnership = useGestureEscapeOwnership(() => finish(true));
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => () => finishRef.current(true), []);
  return (
    <div
      ref={laneRef}
      // Keyframes are added through the inspector diamond only — the timeline lane is
      // NOT an add surface: no crosshair cursor and no click-to-add (Composa#325).
      className="flex-1 relative overflow-hidden"
      style={{ height }}
      data-timeline-property-lane={`${trackId}:${propertyId}`}
      data-timeline-pan-surface
    >
      {prop.bar && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[20px] rounded-[4px] bg-c-bg-secondary pointer-events-none"
          style={{ left: percent(prop.bar[0], viewport), width: percentWidth(prop.bar[0], prop.bar[1], viewport) }}
        >
          {/* trim handles (edge-drag to trim start/end) — inset + wider to read as grips */}
          <span className="absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
          <span className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
        </div>
      )}
      {kfs.length > 1 && kfs.some(keyframe => typeof keyframe === "number") && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-px pointer-events-none"
          style={{ left: percent(first, viewport), width: percentWidth(first, last, viewport), backgroundColor: prop.accent ? "#8638e5" : "rgba(0,0,0,0.25)" }}
        />
      )}
      {kfs.slice(0, -1).map((keyframe, index) => {
        const next = kfs[index + 1];
        const target: TimelineEasingSegmentTarget = {
          trackId,
          propertyId,
          keyframeId: keyframeId(keyframe, index),
          nextKeyframeId: keyframeId(next, index + 1),
          startMs: keyframeTime(keyframe),
          endMs: keyframeTime(next),
          easing: typeof keyframe === "number" ? "linear" : keyframe.easing ?? "linear",
        };
        return (
          <EasingSegment
            key={`${target.keyframeId}:${target.nextKeyframeId}`}
            target={target}
            propertyName={prop.name}
            selected={typeof keyframe !== "number" && !!keyframe.easingSelected}
            lineActive={active}
            accent={!!prop.accent}
            viewport={viewport}
            onSelect={onEasingSelect}
            onPresetChange={typeof keyframe !== "number" && keyframe.easingEditable === false ? undefined : onEasingPresetChange}
          />
        );
      })}
      {kfs.map((keyframe, i) => {
        const timeMs = keyframeTime(keyframe);
        const id = keyframeId(keyframe, i);
        const target = { trackId, propertyId, keyframeId: id, timeMs };
        const selected = typeof keyframe !== "number" && keyframe.selected;
        return (
        <PopoverPrimitive.Root key={id} open={menuKeyframeId === id} onOpenChange={open => { if (!open) setMenuKeyframeId(null); }}>
        <PopoverPrimitive.Anchor asChild>
        <button
          type="button"
          data-keyframe-id={id}
          aria-label={`${prop.name} keyframe at ${timeMs}ms`}
          aria-pressed={selected}
          onContextMenu={event => { event.preventDefault(); event.stopPropagation(); onSelect?.(target, false); setMenuKeyframeId(id); }}
          onClick={event => { event.stopPropagation(); onSelect?.(target, event.shiftKey); }}
          onKeyDown={event => {
            if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); event.stopPropagation(); onDelete?.(target); }
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSelect?.(target, event.shiftKey); }
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "k", "K"].includes(event.key)) {
              event.preventDefault(); event.stopPropagation();
            }
            if (shouldClaimTimelineGestureEscape(event.key, drag.current?.id === id)) {
              event.preventDefault(); event.stopPropagation(); finish(true);
            }
          }}
          onPointerDown={event => {
            event.stopPropagation();
            if (!shouldBeginTimelinePointer(event.button, event.isPrimary)) return;
            edgeDrag.start(() => finish(true));
            drag.current = { id, startX: event.clientX, startTime: timeMs, startViewportStartMs: viewport.startMs, target }; escapeOwnership.claim(); onGestureStart?.({ kind: "keyframe", id, action: "move", keyframe: target }); event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            if (drag.current?.id !== id) return;
            const rect = laneRef.current?.getBoundingClientRect();
            if (!rect) { updateAtViewport(event.clientX, viewport); return; }
            edgeDrag.update(event.clientX, { left: rect.left, width: rect.width }, next => updateAtViewport(event.clientX, next));
          }}
          onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
          // Figma keyframe-diamond states (Composa#320): unselected = no fill + secondary
          // outline; selected = solid blue fill (no ring/scale). accent = the parent's
          // "animation applied" tint (purple), used when the parent is being animated.
          className={clsx(
            "absolute top-1/2 z-[2] size-[7px] p-0 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-c-bg",
            // selected = solid blue fill; parent-active but unselected = blue stroke with
            // the highlight-bg inner fill; otherwise = light secondary stroke, lane-bg fill.
            selected ? "border-0" : active ? "border border-[#0d99ff] bg-c-bg-selected" : "border border-c-text-secondary bg-c-bg",
          )}
          style={{ left: percent(timeMs, viewport), backgroundColor: selected ? (prop.accent ? "#8638e5" : BLUE) : undefined }}
        />
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content data-composa-mode={laneMode} side="bottom" align="start" sideOffset={6} collisionPadding={8} aria-label={`${prop.name} keyframe actions`} className="z-50 outline-none">
            <Menu minWidth={168}>
              <MenuRow type="simple" label="Delete keyframe" onClick={() => { onDelete?.(target); setMenuKeyframeId(null); }} />
            </Menu>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      );})}
    </div>
  );
}

// ── one track (layer row + its property rows) ─────────────────────────────────────
//
// Timeline children use a deliberately small, Figma-style tree: the parent stem
// leaves the object row and every child owns the elbow that terminates at its own
// name. Keeping the final stem to half a row is important — a collapsed list, or
// the last child in a list, must never leave an orphaned rule below itself.
function TimelineChildConnector({ index, count, depth }: { index: number; count: number; depth: number }) {
  const left = 28 + depth * 16;
  const last = index === count - 1;
  // Child labels begin at x=48 (+ depth). Carry the elbow to x=44 so the
  // remaining 4px reads as label breathing room, rather than as a detached
  // vertical guide. This mirrors Figma's compact "└─ Property" row anatomy.
  const elbowWidth = 16;
  return (
    <span
      aria-hidden
      data-timeline-child-connector="elbow"
      data-timeline-child-index={index}
      data-timeline-child-count={count}
      data-timeline-child-connector-gap="4"
      className="pointer-events-none absolute inset-y-0"
      style={{ left, width: elbowWidth }}
    >
      <span className="absolute left-0 top-0 w-px bg-c-border" style={{ height: last ? "50%" : "100%" }} />
      <span className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-c-border" style={{ width: elbowWidth }} />
    </span>
  );
}

function TrackRows({ track, trackIndex, focusable, leftWidth = LEFT_W, viewport, plotWidth, duration, edgeDrag, onTrackSelect, onExpandedChange, onAggregateKeyframeSelect, onKeyframeMove, onKeyframeSelect, onKeyframeDelete, onPropertyAddKeyframe, onPropertyStepKeyframe, selectedTimelineRowId, onPropertyRowSelect, onPropertyValueChange, onPropertyToggleHidden, onPresetToggleHidden, onPresetSelect, onPresetBarChange, onEasingSegmentSelect, onEasingPresetChange, onDurationBarChange, onGestureStart, onGestureEnd }: {
  track: Track; trackIndex: number;
  focusable: boolean;
  /** Track-list column width; 0 collapses the row's left column (Composa#582). */
  leftWidth?: number;
  viewport: TimelineViewport; plotWidth: number; duration: number;
  edgeDrag: TimelineEdgeDragController;
  onTrackSelect?: (trackId: string, modifiers: TimelineTrackSelectionModifiers) => void;
  onExpandedChange?: (trackId: string, expanded: boolean) => void;
  onAggregateKeyframeSelect?: (target: AggregateKeyframeTarget, additive: boolean) => void;
  onKeyframeSelect?: (target: KeyframeTarget, additive: boolean) => void;
  onKeyframeMove?: (target: KeyframeTarget, timeMs: number) => void;
  onKeyframeDelete?: (target: KeyframeTarget) => void;
  onPropertyAddKeyframe?: (trackId: string, propertyId: string, timeMs?: number) => void;
  onPropertyStepKeyframe?: (trackId: string, propertyId: string, direction: "prev" | "next") => void;
  selectedTimelineRowId?: string | null;
  onPropertyRowSelect?: (propertyId: string) => void;
  onPropertyValueChange?: (trackId: string, propertyId: string, value: number) => void;
  onPropertyToggleHidden?: (trackId: string, propertyId: string) => void;
  onPresetToggleHidden?: (trackId: string, presetId: string) => void;
  onPresetSelect?: (trackId: string, presetId: string) => void;
  onPresetBarChange?: (change: TimelinePresetBarChange) => void;
  onEasingSegmentSelect?: (target: TimelineEasingSegmentTarget) => void;
  onEasingPresetChange?: (target: TimelineEasingSegmentTarget, easing: NamedEasingPreset) => void;
  onDurationBarChange?: (change: TimelineDurationBarChange) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
}) {
  const trackId = track.id ?? `track-${trackIndex}`;
  const laneRef = useRef<HTMLDivElement>(null);
  const depth = Math.max(0, track.depth ?? 0);
  const expanded = track.expanded !== false;
  const presetCount = track.bars?.length ?? 0;
  const childCount = presetCount + track.props.length;
  const hasChildren = childCount > 0;
  const selectionState = track.selectionState ?? (track.selected ? "selected" : "none");
  const durationBar = track.bar ? timelineDurationBarProjection(track.bar, viewport) : null;
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
      <div className="group/selection-row relative flex" style={{ height: ROW_LAYER }} data-composa-row-state={selectionState}>
        <span
          aria-hidden
          data-composa-row-highlight="timeline-full-lane"
          className={clsx("pointer-events-none absolute inset-0", rowSelectionHighlightClassName(selectionState))}
        />
        <div className={clsx("relative shrink-0 flex items-center gap-[8px] pr-[8px] border-r border-c-border", leftWidth === 0 && "hidden")}
          style={{ width: leftWidth, paddingLeft: 8 + depth * 16 }}>
          {/* tree guides: a vertical line at each ancestor indent level (Composa#343) */}
          {Array.from({ length: depth }).map((_, level) => (
            <span key={`guide-${level}`} aria-hidden className="pointer-events-none absolute top-0 bottom-0 w-px bg-c-border" style={{ left: 16 + level * 16 }} />
          ))}
          {expanded && hasChildren && <span aria-hidden data-timeline-child-trunk className="pointer-events-none absolute bottom-0 top-1/2 w-px bg-c-border" style={{ left: 28 + depth * 16 }} />}
          {track.props.length ? onExpandedChange ? <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${track.name}`} aria-expanded={expanded}
            tabIndex={onTrackSelect ? -1 : undefined}
            onClick={event => { event.stopPropagation(); onExpandedChange(trackId, !expanded); }} className="size-[16px] shrink-0 rounded-c-sm flex items-center justify-center text-c-icon-secondary hover:bg-c-bg-hover focus-visible:ring-2 focus-visible:ring-c-border-selected-strong outline-none">
            {expanded ? <ChevronDown size={12} strokeWidth={1.5} /> : <DisclosureRight size={12} strokeWidth={1.5} />}
          </button> : <span aria-hidden className="size-[16px] shrink-0 flex items-center justify-center text-c-icon-secondary">
            {expanded ? <ChevronDown size={12} strokeWidth={1.5} /> : <DisclosureRight size={12} strokeWidth={1.5} />}
          </span> : <span className="size-[16px] shrink-0" />}
          <div role={onTrackSelect ? "option" : undefined} aria-selected={onTrackSelect ? selectionState === "selected" : undefined}
            aria-expanded={onTrackSelect && onExpandedChange && track.props.length ? expanded : undefined} tabIndex={onTrackSelect ? focusable ? 0 : -1 : undefined}
            onClick={onTrackSelect ? event => onTrackSelect(trackId, { toggle: event.metaKey || event.ctrlKey, range: event.shiftKey }) : undefined}
            onKeyDown={onTrackSelect ? event => {
              const expansion = timelineTrackExpansionForKey(event.key);
              if (event.currentTarget === event.target && expansion !== null && onExpandedChange && track.props.length) {
                event.preventDefault(); event.stopPropagation();
                if (expansion !== expanded) onExpandedChange(trackId, expansion);
                return;
              }
              if (event.currentTarget === event.target) {
                const options = [...(event.currentTarget.closest('[role="listbox"]')?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
                const current = options.indexOf(event.currentTarget);
                const target = timelineTrackNavigationIndex(current, options.length, event.key);
                if (target !== null) {
                  event.preventDefault(); event.stopPropagation(); options[target]?.focus(); return;
                }
              }
              if (!shouldActivateTimelineTrackKey(event.key, event.currentTarget === event.target)) return;
              event.preventDefault(); event.stopPropagation();
              onTrackSelect(trackId, { toggle: event.metaKey || event.ctrlKey, range: event.shiftKey });
            } : undefined}
            className={clsx("flex flex-1 min-w-0 h-full items-center gap-[8px] outline-none", onTrackSelect && "cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-border-selected-strong")}>
            <LayerTypeIcon type={track.type} autoLayoutMode={track.autoLayoutMode} tone="secondary" />
            <span className={clsx(FONT, "text-[11px] text-c-text truncate", selectionState === "selected" ? "font-[550]" : "font-[450]")}>{track.name}</span>
          </div>
        </div>
        <div ref={laneRef} data-timeline-pan-surface className="flex-1 relative overflow-hidden" style={{ height: ROW_LAYER }}>
          {durationBar && (
            <DurationBar trackId={trackId} name={track.name} range={track.bar!} projection={durationBar} selectionState={selectionState}
              viewport={viewport} plotWidth={plotWidth} duration={duration} laneRef={laneRef} edgeDrag={edgeDrag}
              onChange={track.durationBarEditable === false ? undefined : onDurationBarChange}
              onGestureStart={onGestureStart} onGestureEnd={onGestureEnd} />
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
      {/* When any keyframe on this object (parent) is selected, its animation reads as
          'applied': all its lines + unselected diamonds go blue (Composa#320). */}
      {/* Animate-preset bars (Composa#362) — a labeled bar per preset at its resolved
          window, ABOVE the authored keyframe rows. Presets are NOT keyframes. */}
      {expanded && track.bars?.map((preset, childIndex) => {
        const presetProjection = timelineDurationBarProjection(preset.timeRange, viewport);
        return (
        <div key={preset.id} className={clsx("group/preset flex", preset.hidden && "opacity-40")} style={{ height: ROW_PROP }}>
          <div className={clsx("relative shrink-0 flex items-center gap-[6px] pr-[8px] border-r border-c-border", leftWidth === 0 && "hidden")} style={{ width: leftWidth, paddingLeft: 48 + depth * 16 }}>
            <TimelineChildConnector index={childIndex} count={childCount} depth={depth} />
            <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] font-[450] truncate text-c-text-secondary")}>{preset.label}</span>
            {preset.editable !== false && <button type="button"
              aria-label={preset.hidden ? `Show ${preset.label} animation` : `Hide ${preset.label} animation`}
              aria-pressed={preset.hidden}
              onClick={() => onPresetToggleHidden?.(trackId, preset.id)}
              disabled={!onPresetToggleHidden}
              className={clsx("shrink-0 flex items-center justify-center disabled:opacity-0", !preset.hidden && "opacity-0 group-hover/preset:opacity-100 focus-visible:opacity-100")}>
              {preset.hidden ? <EyeOff size={14} strokeWidth={1.5} className="text-c-icon-secondary" /> : <Eye size={14} strokeWidth={1.5} className="text-c-icon-secondary" />}
            </button>}
          </div>
          <div data-timeline-pan-surface className="flex-1 relative overflow-hidden" ref={presetProjection ? laneRef : undefined}>
            {presetProjection && <PresetBar trackId={trackId} preset={preset} projection={presetProjection}
              viewport={viewport} plotWidth={plotWidth} duration={duration} laneRef={laneRef} edgeDrag={edgeDrag}
              onSelect={onPresetSelect}
              onChange={preset.editable !== false ? onPresetBarChange : undefined}
              onGestureStart={onGestureStart} onGestureEnd={onGestureEnd} />}
          </div>
        </div>
        );
      })}
      {/* property rows — a row goes blue when one of its keyframes or easing
          segments is selected (Composa#323: prop-row selection, was parent-only). */}
      {expanded && track.props.map((p, i) => {
        const propSelected = p.keyframes.some(keyframe => typeof keyframe !== "number" && (keyframe.selected || keyframe.easingSelected));
        const propertyId = p.id ?? `property-${i}`;
        const rowGraySelected = !propSelected && selectedTimelineRowId === propertyId;
        const trackActive = track.props.some(property => property.keyframes.some(keyframe => typeof keyframe !== "number" && keyframe.selected));
        return (
        <div key={i}
          className={clsx("flex", p.hidden && "opacity-40", propSelected ? "bg-c-bg-selected" : rowGraySelected && "bg-c-bg-secondary")}
          style={{ height: ROW_PROP }}
          onClick={event => { if (!(event.target as Element).closest?.("button,[data-keyframe-id],[data-easing-segment]")) onPropertyRowSelect?.(propertyId); }}>
          <div className={clsx("group/prop relative shrink-0 flex items-center gap-[6px] pr-[8px] border-r border-c-border", leftWidth === 0 && "hidden")} style={{ width: leftWidth, paddingLeft: 48 + depth * 16 }}>
            <TimelineChildConnector index={presetCount + i} count={childCount} depth={depth} />
            <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] font-[450] truncate", p.accent ? "text-[#8638e5]" : "text-c-text-secondary")}>{p.name}</span>
            {/* keyframe stepper: ◀ prev-keyframe · ◇ toggle-at-playhead · ▶ next-keyframe */}
            <button type="button" aria-label={`Previous ${p.name} keyframe`} onClick={() => onPropertyStepKeyframe?.(trackId, p.id ?? `property-${i}`, "prev")} className="shrink-0 flex items-center justify-center opacity-0 group-hover/prop:opacity-100 disabled:opacity-0" disabled={!onPropertyStepKeyframe}>
              <ChevronLeft size={14} strokeWidth={1.5} className="text-c-icon-secondary" />
            </button>
            <button type="button" aria-label={`Add ${p.name} keyframe`} onClick={() => onPropertyAddKeyframe?.(trackId, p.id ?? `property-${i}`)} className="shrink-0 flex items-center justify-center">
              <Diamond size={12} strokeWidth={1.5} className="text-c-icon-secondary" />
            </button>
            <button type="button" aria-label={`Next ${p.name} keyframe`} onClick={() => onPropertyStepKeyframe?.(trackId, p.id ?? `property-${i}`, "next")} className="shrink-0 flex items-center justify-center opacity-0 group-hover/prop:opacity-100 disabled:opacity-0" disabled={!onPropertyStepKeyframe}>
              <ChevronRight size={14} strokeWidth={1.5} className="text-c-icon-secondary" />
            </button>
            {/* inline value at the playhead — between the stepper and the eye, revealed on hover/selection (Composa#343b) */}
            {p.value !== undefined && (
              <div className={clsx("shrink-0 w-[56px] select-text", !(propSelected || rowGraySelected) && "opacity-0 group-hover/prop:opacity-100 focus-within:opacity-100")}>
                <NumericInput ariaLabel={`${p.name} value`} value={p.value} size="small" disabled={p.valueEditable === false}
                  onChange={value => onPropertyValueChange?.(trackId, propertyId, value)} />
              </div>
            )}
            <button type="button" aria-label={p.hidden ? `Show ${p.name}` : `Hide ${p.name}`} aria-pressed={p.hidden}
              onClick={() => onPropertyToggleHidden?.(trackId, propertyId)}
              className={clsx("shrink-0 flex items-center justify-center", !p.hidden && "opacity-0 group-hover/prop:opacity-100")}>
              {p.hidden ? <EyeOff size={14} strokeWidth={1.5} className="text-c-icon-secondary" /> : <Eye size={14} strokeWidth={1.5} className="text-c-icon-secondary" />}
            </button>
          </div>
          <Lane prop={p} trackId={trackId} propertyId={p.id ?? `property-${i}`} active={trackActive} height={ROW_PROP} viewport={viewport} plotWidth={plotWidth} edgeDrag={edgeDrag} onSelect={onKeyframeSelect} onMove={onKeyframeMove} onDelete={onKeyframeDelete} onEasingSelect={onEasingSegmentSelect} onEasingPresetChange={onEasingPresetChange} onGestureStart={onGestureStart} onGestureEnd={onGestureEnd} />
        </div>
        );
      })}
    </>
  );
}

// ── shared transport toolbar (identical across master + slide) ──────────────────────
// Layout, Play/Stop icons, timecode group, and loop are the SAME in both modes.
// Timecode is shown in ms (slide) or seconds (master). Keyframes are added from
// row/property diamonds or the focused Playhead's K shortcut, not extra chrome here.
function TransportIconButton({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick?: () => void; active?: boolean }) {
  return <button aria-label={label} aria-pressed={active} onClick={onClick} className={clsx("size-[24px] rounded-c-md flex items-center justify-center text-c-icon hover:bg-c-bg-hover", active && "bg-c-bg-selected")}>{children}</button>;
}

function Transport({ current, duration, mode, playing, loop, autoKeyframe = false, onPlayingChange, onStop, onLoopChange, onAutoKeyframeChange, trackListCollapsed = false, onTrackListCollapsedChange }: {
  current: number; duration: number; mode: TimelineMode; playing: boolean; loop: boolean; autoKeyframe?: boolean;
  onPlayingChange: (playing: boolean) => void; onStop?: () => void; onLoopChange: (loop: boolean) => void;
  onAutoKeyframeChange?: (value: boolean) => void;
  trackListCollapsed?: boolean;
  onTrackListCollapsedChange?: (collapsed: boolean) => void;
}) {
  const slide = mode === "slide";
  const fmt = slide
    ? (n: number) => String(Math.round(n)).padStart(5, "0")
    : (n: number) => (n / 1000).toFixed(2) + "s";
  const tcW = slide ? 42 : 54; // timecode cell width — ms strings are narrower than "4.20s"
  return (
    <div className="shrink-0 flex items-center gap-[8px] px-[8px] border-r border-c-border" style={{ width: LEFT_W }}>
      {/* shared transport controls */}
      <TransportIconButton label={playing ? "Pause" : "Play"} active={playing} onClick={() => onPlayingChange(!playing)}>{playing ? <Pause size={16} strokeWidth={1.5} /> : <Play size={16} strokeWidth={1.5} />}</TransportIconButton>
      <TransportIconButton label="Stop" onClick={onStop}><Square size={14} strokeWidth={1.5} /></TransportIconButton>
      {/* Auto-keyframe / record toggle (Composa#330) — sits ALONGSIDE Stop, does not
          replace it. When armed, edits record keyframes and the timeline shows the red
          record affordances (top-stroke + red playhead). */}
      {onAutoKeyframeChange && slide && (
        <button aria-label="Auto-keyframe" aria-pressed={autoKeyframe} onClick={() => onAutoKeyframeChange(!autoKeyframe)}
          className={clsx("size-[24px] rounded-c-md flex items-center justify-center hover:bg-c-bg-hover", autoKeyframe ? "text-[#ff3b30]" : "text-c-icon")}>
          <Circle size={14} strokeWidth={1.5} className={clsx(autoKeyframe && "fill-current")} />
        </button>
      )}
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
      <button type="button" aria-label={trackListCollapsed ? "Expand track list" : "Collapse track list"} aria-pressed={trackListCollapsed}
        disabled={!onTrackListCollapsedChange}
        onClick={onTrackListCollapsedChange ? () => onTrackListCollapsedChange(!trackListCollapsed) : undefined}
        className={clsx("size-[24px] rounded-c-md flex items-center justify-center text-c-icon", onTrackListCollapsedChange ? "hover:bg-c-bg-hover" : "opacity-40 cursor-default", trackListCollapsed && "bg-c-bg-selected")}>
        {trackListCollapsed ? <PanelLeftOpen size={16} strokeWidth={1.5} /> : <PanelLeftClose size={16} strokeWidth={1.5} />}
      </button>
    </div>
  );
}

// ── ruler (slide-local view — milliseconds) ────────────────────────────────────────
// Each tick renders a short mark AT the time position with its label to the right
// (Figma parity — Composa#326: the ticks row was previously labels-only).
function Ruler({ viewport, width }: { viewport: TimelineViewport; width: number }) {
  const ticks = tickTimes(viewport, width);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {ticks.map(t => (
        <div key={t} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: percent(t, viewport) }}>
          {/* number + tick both CENTERED on the time position; tick below the number */}
          <span className={clsx(FONT, "absolute bottom-[6px] left-0 -translate-x-1/2 text-[11px] text-c-text-secondary tabular-nums leading-none whitespace-nowrap")}>{Math.round(t)}</span>
          <span className="absolute bottom-0 left-0 -translate-x-1/2 w-px h-[4px] bg-c-text-secondary" />
        </div>
      ))}
    </div>
  );
}

// ── ruler (master view — seconds, switching to m:ss when zoomed far out) ────────────
function SecondRuler({ viewport, width }: { viewport: TimelineViewport; width: number }) {
  const ticks = tickTimes(viewport, width);
  const spanMs = viewport.endMs - viewport.startMs;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {ticks.map(timeMs => (
        <div key={timeMs} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: percent(timeMs, viewport) }}>
          <span className={clsx(FONT, "absolute bottom-[6px] left-0 -translate-x-1/2 text-[11px] text-c-text-secondary tabular-nums leading-none whitespace-nowrap")}>{formatMasterRulerTick(timeMs, spanMs)}</span>
          <span className="absolute bottom-0 left-0 -translate-x-1/2 w-px h-[4px] bg-c-text-secondary" />
        </div>
      ))}
    </div>
  );
}

// ── horizontal time-axis scrollbar ─────────────────────────────────────────────
// Visible, draggable pan affordance for the time axis (owner: "can't scroll the
// timeline horizontally"). Sits under the lanes, offset past the track-list column
// so it aligns with the plot. The thumb shows the visible window over the whole
// duration and drags to pan; when everything fits it spans the full track (nothing
// to scroll). Complements the existing shift-wheel / trackpad-x pan, giving it a
// readable position indicator. Uses the shared viewport math (timelineScrollbarPan).
function TimelineTimeScrollbar({ viewport, duration, plotWidth, leftWidth = LEFT_W, onPan }: {
  viewport: TimelineViewport;
  duration: number;
  plotWidth: number;
  leftWidth?: number;
  onPan: (next: TimelineViewport) => void;
}) {
  const drag = useRef<{ pointerId: number; startClientX: number; startViewport: TimelineViewport } | null>(null);
  const trackWidth = Math.max(1, plotWidth);
  const { leftPx, widthPx, scrollable } = timelineScrollbarThumb(viewport, duration, trackWidth);
  const begin = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!shouldBeginTimelinePointer(event.button, event.isPrimary) || !scrollable) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current = { pointerId: event.pointerId, startClientX: event.clientX, startViewport: viewport };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
  };
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    onPan(timelineScrollbarPan(active.startViewport, event.clientX - active.startClientX, duration, trackWidth));
  };
  const end = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    drag.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
  };
  return (
    <div className="flex shrink-0 h-[12px] border-t border-c-border bg-c-bg" data-timeline-time-scrollbar>
      {leftWidth > 0 && <div className="shrink-0 border-r border-c-border" style={{ width: leftWidth }} />}
      <div className="relative flex-1 min-w-0">
        <div
          role="scrollbar"
          aria-label="Scroll timeline horizontally"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, Math.round(duration))}
          aria-valuenow={Math.round(viewport.startMs)}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          className={clsx(
            "absolute top-1/2 -translate-y-1/2 h-[6px] rounded-full transition-colors",
            scrollable ? "bg-c-icon-secondary/60 hover:bg-c-icon-secondary cursor-grab active:cursor-grabbing" : "bg-c-bg-secondary cursor-default",
          )}
          style={{ left: leftPx, width: widthPx }}
        />
      </div>
    </div>
  );
}

// ── master lane header (Figma 2-4060) ───────────────────────────────────────────
// Shared left-column header for every master lane: a `[type icon] [label] [+ add]`
// top row over a `[visibility] [solo] [mute] [lock]` control row. The controls are
// presentation toggles reflecting `control`; a callback is only wired when the host
// supplies the corresponding handler — otherwise the affordance renders disabled so
// the anatomy stays visible without pretending to do something.
interface MasterLaneHeaderProps {
  icon: React.ReactNode;
  label: string;
  control?: MasterLaneControlState;
  onAdd?: () => void;
  onVisibilityToggle?: () => void;
  onSoloToggle?: () => void;
  onMuteToggle?: () => void;
  onLockToggle?: () => void;
  /** Track-list column width; 0 collapses the header out entirely (Composa#582). */
  leftWidth?: number;
}

function MasterLaneHeader({ icon, label, control, onAdd, onVisibilityToggle, onSoloToggle, onMuteToggle, onLockToggle, leftWidth = LEFT_W }: MasterLaneHeaderProps) {
  if (leftWidth === 0) return null;
  const visible = control?.visible ?? true;
  const solo = control?.solo ?? false;
  const muted = control?.muted ?? false;
  const locked = control?.locked ?? false;
  // [visibility] [solo] [mute] [lock] as grouped icon buttons — the SAME DS
  // primitive the Design-tab alignment control uses (`IconButtonRow`), not a
  // SegmentedControl. Each is an independent toggle (`active` reflects its own
  // pressed state); a toggle whose handler is absent renders disabled so the
  // anatomy stays visible without pretending to act. Icons inherit the row's
  // primary `text-c-icon` colour (not a muted/secondary token).
  const controlButtons: IconBtn[] = [
    {
      icon: visible ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />,
      label: visible ? `Hide ${label}` : `Show ${label}`,
      active: onVisibilityToggle ? !visible : undefined,
      disabled: !onVisibilityToggle,
      onClick: onVisibilityToggle,
    },
    {
      icon: <span className={clsx(FONT, "text-[11px] font-[650] leading-none")}>S</span>,
      label: solo ? `Unsolo ${label}` : `Solo ${label}`,
      active: onSoloToggle ? solo : undefined,
      disabled: !onSoloToggle,
      onClick: onSoloToggle,
    },
    {
      icon: muted ? <VolumeX size={14} strokeWidth={1.5} /> : <Volume2 size={14} strokeWidth={1.5} />,
      label: muted ? `Unmute ${label}` : `Mute ${label}`,
      active: onMuteToggle ? muted : undefined,
      disabled: !onMuteToggle,
      onClick: onMuteToggle,
    },
    {
      icon: locked ? <Lock size={14} strokeWidth={1.5} /> : <LockOpen size={14} strokeWidth={1.5} />,
      label: locked ? `Unlock ${label}` : `Lock ${label}`,
      active: onLockToggle ? locked : undefined,
      disabled: !onLockToggle,
      onClick: onLockToggle,
    },
  ];
  return (
    <div className="shrink-0 flex flex-col justify-center gap-[6px] pl-[8px] pr-[8px] border-r border-c-border" style={{ width: leftWidth, height: ROW_BLOCK }}>
      {/* top row — [type icon] [label] [+ add]. Icons use the primary c-icon token. */}
      <div className="flex items-center gap-[6px]">
        <span className={clsx("shrink-0 flex items-center", visible ? "text-c-icon" : "text-c-icon opacity-60")} aria-hidden>{icon}</span>
        <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] font-[450] truncate", visible ? "text-c-text" : "text-c-text-secondary")}>{label}</span>
        <button type="button" aria-label={`Add to ${label}`} disabled={!onAdd} onClick={onAdd}
          className={clsx("shrink-0 size-[20px] rounded-c-sm flex items-center justify-center text-c-icon",
            onAdd ? "hover:bg-c-bg-hover hover:text-c-text" : "opacity-40 cursor-default")}>
          <Plus size={14} strokeWidth={1.5} />
        </button>
      </div>
      {/* control row — grouped icon buttons (IconButtonRow, same as the Design-tab
          alignment control), hugging their content (no `fill`, not full width). */}
      <div role="group" aria-label={`${label} controls`}>
        <IconButtonRow buttons={controlButtons} />
      </div>
    </div>
  );
}

// ── master track rows: "Slides" block track + "Video"/"Audio" lanes ──────────────
function BlockTrack({ blocks, header, leftWidth, viewport, plotWidth, onSelect, onOpen, onContextMenu, onMove, onTrim, onGestureStart, onGestureEnd }: {
  blocks: SlideBlock[];
  header: MasterLaneHeaderProps;
  leftWidth: number;
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
    <div className="flex border-b border-c-border" style={{ height: ROW_BLOCK }}>
      {/* left header — [icon][label][+] + [vis][solo][mute][lock] */}
      <MasterLaneHeader {...header} leftWidth={leftWidth} />
      {/* block lane */}
      <div data-timeline-pan-surface className="flex-1 relative overflow-hidden" style={{ height: ROW_BLOCK }}>
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
                // outline-none + focus-visible ring: focusable bars must never leak the
                // raw UA focus outline (Composa#584) — keyboard focus shows the DS ring,
                // mouse click shows nothing.
                "absolute inset-y-[4px] rounded-[4px] flex items-center px-[10px] overflow-hidden border outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-focus-ring",
                b.active
                  ? "bg-[#0d99ff]/20 border-[#0d99ff]"
                  // Blue hover highlight on rest, matching every other timeline bar (Composa#583).
                  : "bg-c-bg-secondary border-c-border hover:border-c-border-selected",
              )}
              style={{ left, width }}
            >
              {/* trim handles (edge-drag to trim start/end) */}
              <span aria-label={`Trim start of ${b.name}`} role="slider" aria-valuemin={0} aria-valuemax={b.range[1]} aria-valuenow={b.range[0]} tabIndex={0} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(id, "start", Math.min(b.range[1], Math.max(0, b.range[0] + (event.key === "ArrowLeft" ? -100 : 100)))); } }} onPointerDown={event => begin(event, b, "start")} onPointerMove={event => update(event, b)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} className="absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring" />
              <span aria-label={`Trim end of ${b.name}`} role="slider" aria-valuemin={b.range[0]} aria-valuemax={Number.MAX_SAFE_INTEGER} aria-valuenow={b.range[1]} tabIndex={0} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(id, "end", Math.max(b.range[0], b.range[1] + (event.key === "ArrowLeft" ? -100 : 100))); } }} onPointerDown={event => begin(event, b, "end")} onPointerMove={event => update(event, b)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring" />
              <span className={clsx(FONT, "text-[11px] font-[450] truncate", b.active ? "text-c-text" : "text-c-text-secondary")}>{b.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Master-lane file-drop target. The empty region of a lane is the live "dropzone"
// affordance (motion-mental-model → "Media: asset, instance, dropzone") — no
// persisted placeholder clip. A file dragged over the lane body highlights it only
// when the payload matches the lane's accepted MIME prefixes, and on drop hands the
// matching files to the host, which imports→places an instance clip at the playhead.
// Hooks are called unconditionally (rules-of-hooks); the returned handlers are inert
// when the lane has no accept list or no `onDropFiles`, so an unwired lane is a plain
// pan surface. Bookkeeping via an enter/leave depth counter avoids flicker as the
// drag crosses child clip blocks.
// Whether a drag payload should light up a lane typed to `accept` (MIME prefixes).
// `fileItemTypes` are the MIME types of the drag's file items (empty string when the
// browser withholds them mid-drag); `hasFilePayload` is whether the drag carries files
// at all. With no per-item types we fall back to the presence of a file payload so a
// valid drag still highlights (the drop handler + host re-check kind before placing).
// Pure + exported for unit tests; an audio file over the Video lane returns false.
export function laneDropPayloadAccepted(accept: readonly string[], fileItemTypes: readonly string[], hasFilePayload: boolean): boolean {
  if (fileItemTypes.length === 0) return hasFilePayload;
  return fileItemTypes.some(type => type === "" || accept.some(prefix => type.startsWith(prefix)));
}

// The subset of dropped files a lane typed to `accept` will hand to the host. An
// empty-type file is kept (the host resolves kind by extension). Pure + exported.
export function laneDropAcceptedFiles<T extends { type: string }>(accept: readonly string[], files: readonly T[]): T[] {
  return files.filter(file => file.type === "" || accept.some(prefix => file.type.startsWith(prefix)));
}

function useLaneFileDrop(accept: readonly string[] | undefined, onDropFiles?: (files: File[]) => void) {
  const [dragActive, setDragActive] = useState(false);
  const depth = useRef(0);
  const enabled = !!accept && !!onDropFiles;
  const payloadAccepted = (dt: DataTransfer | null): boolean => {
    if (!accept || !dt) return false;
    const fileItems = Array.from(dt.items ?? []).filter(item => item.kind === "file");
    return laneDropPayloadAccepted(accept, fileItems.map(item => item.type), Array.from(dt.types ?? []).includes("Files"));
  };
  const reset = () => { depth.current = 0; setDragActive(false); };
  const handlers = enabled ? {
    onDragEnter: (event: React.DragEvent) => {
      if (!payloadAccepted(event.dataTransfer)) return;
      event.preventDefault();
      depth.current += 1;
      setDragActive(true);
    },
    onDragOver: (event: React.DragEvent) => {
      if (!payloadAccepted(event.dataTransfer)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: () => { depth.current = Math.max(0, depth.current - 1); if (depth.current === 0) setDragActive(false); },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      reset();
      const files = laneDropAcceptedFiles(accept!, Array.from(event.dataTransfer.files ?? []));
      if (files.length) onDropFiles!(files);
    },
  } : {};
  return { dragActive: enabled && dragActive, handlers };
}

// Dashed highlight + hint painted over a lane while a matching file is dragged over
// it. Non-interactive so it never intercepts the drop or the pan surface beneath.
function LaneDropOverlay({ hint }: { hint: string }) {
  return (
    <div aria-hidden className="absolute inset-[3px] z-20 flex items-center justify-center rounded-[6px] border border-dashed border-c-border-selected-strong bg-c-bg-brand/10 pointer-events-none">
      <span className={clsx(FONT, "text-[11px] font-[450] text-c-text-secondary")}>{hint}</span>
    </div>
  );
}

function BaseVideoTrack({ clips, header, leftWidth, viewport, plotWidth, accept, dropHint, onDropFiles, onSelect, onOpen, onMove, onTrim, onGestureStart, onGestureEnd }: {
  clips: BaseClipBlock[];
  header: MasterLaneHeaderProps;
  leftWidth: number;
  viewport: TimelineViewport; plotWidth: number;
  accept?: readonly string[];
  dropHint?: string;
  onDropFiles?: (files: File[]) => void;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  onMove?: (id: string, startMs: number) => void;
  onTrim?: (id: string, edge: "start" | "end", timeMs: number, detail?: TimelineClipTrimDetail) => void;
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
  const { dragActive, handlers: dropHandlers } = useLaneFileDrop(accept, onDropFiles);
  const update = (event: React.PointerEvent, clip: BaseClipBlock) => {
    const active = drag.current;
    if (!active || active.id !== clip.id) return;
    const delta = Math.round((event.clientX - active.startX) / Math.max(1, plotWidth) * (viewport.endMs - viewport.startMs));
    if (active.kind === "move") onMove?.(clip.id, Math.max(0, active.range[0] + delta));
    if (active.kind === "start") onTrim?.(clip.id, "start", Math.min(active.range[1], Math.max(0, active.range[0] + delta)), timelineClipTrimDetail("pointer", viewport, plotWidth));
    if (active.kind === "end") onTrim?.(clip.id, "end", Math.max(active.range[0], active.range[1] + delta), timelineClipTrimDetail("pointer", viewport, plotWidth));
  };
  return (
    <div className="flex border-b border-c-border" style={{ height: ROW_BLOCK }}>
      <MasterLaneHeader {...header} leftWidth={leftWidth} />
      <div {...dropHandlers} data-timeline-pan-surface data-lane-drop-active={dragActive || undefined} className="flex-1 relative overflow-hidden" style={{ height: ROW_BLOCK }} aria-label={clips.length ? "Base video track" : "Base video track (empty)"}>
        {dragActive && <LaneDropOverlay hint={dropHint ?? "Drop media here"} />}
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
            className={clsx("absolute inset-y-[4px] rounded-[4px] flex items-center px-[10px] overflow-hidden border bg-c-bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-focus-ring",
              // Blue hover highlight on rest (Composa#583); focus ring instead of the raw
              // UA outline (Composa#584).
              clip.selected ? "border-c-border-selected-strong" : "border-c-border hover:border-c-border-selected")}
            style={{ left, width, backgroundColor: !clip.thumbnail && !tintIsImage ? clip.tint : undefined, backgroundImage: clip.thumbnail ? `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url(${clip.thumbnail})` : tintIsImage ? clip.tint : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
            <span aria-label={`Trim start of ${clip.name}`} role="slider" aria-valuemin={0} aria-valuemax={clip.range[1]} aria-valuenow={clip.range[0]} tabIndex={0}
              onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(clip.id, "start", Math.min(clip.range[1], Math.max(0, clip.range[0] + (event.key === "ArrowLeft" ? -100 : 100))), timelineClipTrimDetail("keyboard", viewport, plotWidth)); } }}
              onPointerDown={event => begin(event, clip, "start")} onPointerMove={event => update(event, clip)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)}
              className={clsx("absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring", clip.selected ? "bg-white" : "bg-c-icon-secondary")} />
            <span aria-label={`Trim end of ${clip.name}`} role="slider" aria-valuemin={clip.range[0]} aria-valuemax={Number.MAX_SAFE_INTEGER} aria-valuenow={clip.range[1]} tabIndex={0}
              onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(clip.id, "end", Math.max(clip.range[0], clip.range[1] + (event.key === "ArrowLeft" ? -100 : 100)), timelineClipTrimDetail("keyboard", viewport, plotWidth)); } }}
              onPointerDown={event => begin(event, clip, "end")} onPointerMove={event => update(event, clip)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)}
              className={clsx("absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring", clip.selected ? "bg-white" : "bg-c-icon-secondary")} />
            <span className={clsx(FONT, "relative text-[11px] font-[450] truncate", clip.thumbnail || clip.tint ? "text-white" : "text-c-text-secondary")}>{clip.name}</span>
          </div>;
        })}
      </div>
    </div>
  );
}

// Deterministic pseudo-random peaks so an audio clip always reads as a waveform
// even before real peak extraction lands. Seeded off the clip id → stable across
// renders (no flicker) and distinct per clip. STUB — replace `waveform` peaks with
// decoded source audio when the extraction pipeline exists.
function stubWaveformPeaks(seed: string, count: number): number[] {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  const peaks: number[] = [];
  let state = hash || 1;
  for (let index = 0; index < count; index++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    peaks.push(0.25 + (state / 0x7fffffff) * 0.75);
  }
  return peaks;
}

// Resample a normalized peak series to exactly `count` bars by averaging each
// output bar over its slice of the source (so widening/narrowing the clip
// re-buckets the same audio instead of cropping it). Used to fit real decoded
// peaks to the zoom-derived bar count; the stub generates `count` directly.
function resamplePeaks(peaks: number[], count: number): number[] {
  if (count <= 0 || peaks.length === 0) return [];
  if (peaks.length === count) return peaks;
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index / count) * peaks.length);
    const end = Math.max(start + 1, Math.floor(((index + 1) / count) * peaks.length));
    let sum = 0;
    for (let i = start; i < end; i++) sum += peaks[i];
    return sum / (end - start);
  });
}

// One waveform bar per ~3px of clip width (2px bar + 1px gap), so the bars keep
// a constant density and fill the whole bar as the clip is zoomed — not a fixed
// count clustered in the middle (the pre-zoom stub).
const WAVEFORM_BAR_PITCH = 3;

// Symmetric waveform bars centred on the clip's mid-line, filling the clip's
// full width. The bar count tracks the clip's rendered pixel width (measured via
// ResizeObserver) so the waveform stays full-bleed and reads with constant
// density at every zoom level. Real peaks (when they land) are resampled to that
// count; otherwise a deterministic stub of the same count renders.
function AudioLaneWaveform({ id, peaks, active }: { id: string; peaks?: number[]; active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [barCount, setBarCount] = useState(40);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      if (width > 0) setBarCount(Math.max(1, Math.round(width / WAVEFORM_BAR_PITCH)));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const values = peaks && peaks.length ? resamplePeaks(peaks, barCount) : stubWaveformPeaks(id, barCount);
  return (
    <div ref={ref} aria-hidden className="absolute inset-0 flex items-center justify-between gap-[1px] px-[6px] opacity-70 pointer-events-none">
      {values.map((value, index) => (
        <span key={index} className={clsx("min-w-[1px] max-w-[2px] flex-1 rounded-full", active ? "bg-white" : "bg-c-icon-secondary")}
          style={{ height: `${Math.max(8, Math.round(value * 100))}%` }} />
      ))}
    </div>
  );
}

function AudioTrack({ clips, header, leftWidth, viewport, plotWidth, accept, dropHint, onDropFiles, onSelect, onOpen, onContextMenu, onMove, onTrim, onGestureStart, onGestureEnd }: {
  clips: AudioClipBlock[];
  header: MasterLaneHeaderProps;
  leftWidth: number;
  viewport: TimelineViewport; plotWidth: number;
  accept?: readonly string[];
  dropHint?: string;
  onDropFiles?: (files: File[]) => void;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  onContextMenu?: (id: string, detail: TimelineBlockContextMenuDetail) => void;
  onMove?: (id: string, startMs: number) => void;
  onTrim?: (id: string, edge: "start" | "end", timeMs: number, detail?: TimelineClipTrimDetail) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
}) {
  const drag = useRef<{ id: string; kind: "move" | "start" | "end"; startX: number; range: [number, number] } | null>(null);
  const begin = (event: React.PointerEvent, clip: AudioClipBlock, kind: "move" | "start" | "end") => {
    if (!shouldBeginTimelinePointer(event.button, event.isPrimary)) return;
    event.stopPropagation();
    drag.current = { id: clip.id, kind, startX: event.clientX, range: clip.range };
    escapeOwnership.claim();
    onGestureStart?.({ kind: "audio-clip", id: clip.id, action: kind === "start" ? "trim-start" : kind === "end" ? "trim-end" : "move" });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const finish = (cancelled: boolean) => {
    const active = drag.current;
    if (!active) return;
    drag.current = null;
    escapeOwnership.release();
    onGestureEnd?.({ kind: "audio-clip", id: active.id, action: active.kind === "start" ? "trim-start" : active.kind === "end" ? "trim-end" : "move" }, { cancelled });
  };
  const escapeOwnership = useGestureEscapeOwnership(() => finish(true));
  const { dragActive, handlers: dropHandlers } = useLaneFileDrop(accept, onDropFiles);
  const update = (event: React.PointerEvent, clip: AudioClipBlock) => {
    const active = drag.current;
    if (!active || active.id !== clip.id) return;
    const delta = Math.round((event.clientX - active.startX) / Math.max(1, plotWidth) * (viewport.endMs - viewport.startMs));
    if (active.kind === "move") onMove?.(clip.id, Math.max(0, active.range[0] + delta));
    if (active.kind === "start") onTrim?.(clip.id, "start", Math.min(active.range[1], Math.max(0, active.range[0] + delta)), timelineClipTrimDetail("pointer", viewport, plotWidth));
    if (active.kind === "end") onTrim?.(clip.id, "end", Math.max(active.range[0], active.range[1] + delta), timelineClipTrimDetail("pointer", viewport, plotWidth));
  };
  return (
    <div className="flex border-b border-c-border" style={{ height: ROW_BLOCK }}>
      <MasterLaneHeader {...header} leftWidth={leftWidth} />
      <div {...dropHandlers} data-timeline-pan-surface data-lane-drop-active={dragActive || undefined} className="flex-1 relative overflow-hidden" style={{ height: ROW_BLOCK }} aria-label={clips.length ? "Audio track" : "Audio track (empty)"}>
        {dragActive && <LaneDropOverlay hint={dropHint ?? "Drop audio here"} />}
        {clips.map(clip => {
          const left = percent(clip.range[0], viewport);
          const width = percentWidth(clip.range[0], clip.range[1], viewport);
          const hasContextMenu = !!clip.id && !!onContextMenu;
          return <div key={clip.id} role="button" tabIndex={0} aria-pressed={clip.selected} aria-label={clip.name}
            aria-haspopup={hasContextMenu ? "menu" : undefined}
            onClick={() => onSelect?.(clip.id)} onDoubleClick={() => onOpen?.(clip.id)}
            onContextMenu={event => {
              if (!hasContextMenu) return;
              event.preventDefault();
              event.stopPropagation();
              onContextMenu!(clip.id, { clientX: event.clientX, clientY: event.clientY, currentTarget: event.currentTarget, source: "pointer" });
            }}
            onKeyDown={event => {
              if (event.key === "Enter") { event.preventDefault(); onOpen?.(clip.id); }
              else if (event.key === " ") { event.preventDefault(); onSelect?.(clip.id); }
              else if (hasContextMenu && (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) {
                event.preventDefault(); event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                onContextMenu!(clip.id, { clientX: rect.left + Math.min(24, rect.width / 2), clientY: rect.top + rect.height / 2, currentTarget: event.currentTarget, source: "keyboard" });
              }
              else if (shouldClaimTimelineGestureEscape(event.key, drag.current?.id === clip.id)) {
                event.preventDefault(); event.stopPropagation(); finish(true);
              }
            }}
            onPointerDown={event => begin(event, clip, "move")} onPointerMove={event => update(event, clip)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)} onLostPointerCapture={() => finish(true)}
            className={clsx("absolute inset-y-[4px] rounded-[4px] flex flex-col justify-center gap-[2px] px-[8px] py-[5px] overflow-hidden border outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-focus-ring",
              // Selection mirrors the local (slide) timeline bar (owner): blue fill
              // + strong border; the name, waveform, and trim handles go white on it.
              // Blue hover highlight on rest (Composa#583); focus ring not raw UA outline (Composa#584).
              clip.selected ? "border-c-border-selected-strong bg-c-bg-brand" : "border-c-border bg-c-bg-secondary hover:border-c-border-selected")}
            style={{ left, width }}>
            {/* vertical stack (owner): clip name on top, waveform below — not the old
                side-by-side (name overlaid on a full-bleed waveform). */}
            <span className={clsx(FONT, "relative z-10 shrink-0 text-[11px] font-[450] truncate leading-none", clip.selected ? "text-white" : "text-c-text-secondary")}>{clip.name}</span>
            <div className="relative flex-1 min-h-0 w-full"><AudioLaneWaveform id={clip.id} peaks={clip.waveform} active={clip.selected} /></div>
            <span aria-label={`Trim start of ${clip.name}`} role="slider" aria-valuemin={0} aria-valuemax={clip.range[1]} aria-valuenow={clip.range[0]} tabIndex={0}
              onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(clip.id, "start", Math.min(clip.range[1], Math.max(0, clip.range[0] + (event.key === "ArrowLeft" ? -100 : 100))), timelineClipTrimDetail("keyboard", viewport, plotWidth)); } }}
              onPointerDown={event => begin(event, clip, "start")} onPointerMove={event => update(event, clip)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)}
              className={clsx("absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full cursor-ew-resize z-10 outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring", clip.selected ? "bg-white" : "bg-c-icon-secondary")} />
            <span aria-label={`Trim end of ${clip.name}`} role="slider" aria-valuemin={clip.range[0]} aria-valuemax={Number.MAX_SAFE_INTEGER} aria-valuenow={clip.range[1]} tabIndex={0}
              onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onTrim?.(clip.id, "end", Math.max(clip.range[0], clip.range[1] + (event.key === "ArrowLeft" ? -100 : 100)), timelineClipTrimDetail("keyboard", viewport, plotWidth)); } }}
              onPointerDown={event => begin(event, clip, "end")} onPointerMove={event => update(event, clip)} onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)}
              className={clsx("absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full cursor-ew-resize z-10 outline-none focus-visible:ring-2 focus-visible:ring-c-focus-ring", clip.selected ? "bg-white" : "bg-c-icon-secondary")} />
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
  audioClips = [],
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
  autoKeyframe = false,
  onAutoKeyframeChange,
  onAddKeyframe,
  onPropertyAddKeyframe,
  onPropertyStepKeyframe,
  selectedTimelineRowId,
  onPropertyRowSelect,
  onPropertyValueChange,
  onPropertyToggleHidden,
  onPresetToggleHidden,
  onPresetSelect,
  onPresetBarChange,
  onTrackExpandedChange,
  onTrackSelect,
  onAggregateKeyframeSelect,
  onKeyframeSelect,
  onKeyframeMove,
  onKeyframeDelete,
  onEasingSegmentSelect,
  onEasingPresetChange,
  onDurationBarChange,
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
  onAudioClipSelect,
  onAudioClipOpen,
  onAudioClipContextMenu,
  onAudioClipMove,
  onAudioClipTrim,
  onGestureStart,
  onGestureEnd,
  laneControls,
  onLaneAdd,
  onLaneDropFiles,
  onLaneVisibilityToggle,
  onLaneSoloToggle,
  onLaneMuteToggle,
  onLaneLockToggle,
  revealKeyframe,
  onKeyframeRevealHandled,
  interactionContextKey,
  onBack,
  timelineCollapsed = false,
  onTimelineCollapsedChange,
  trackListCollapsed = false,
  onTrackListCollapsedChange,
}: {
  mode?: TimelineMode;
  tracks?: Track[];
  blocks?: SlideBlock[];
  baseClips?: BaseClipBlock[];
  audioClips?: AudioClipBlock[];
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
  /** Auto-keyframe / record armed state + toggle (Composa#330). */
  autoKeyframe?: boolean;
  onAutoKeyframeChange?: (value: boolean) => void;
  onAddKeyframe?: (timeMs: number) => void;
  onPropertyAddKeyframe?: (trackId: string, propertyId: string, timeMs: number) => void;
  /** Step the playhead to the previous/next keyframe of a specific property track. */
  onPropertyStepKeyframe?: (trackId: string, propertyId: string, direction: "prev" | "next") => void;
  /** Gray row-selection (Composa#323): the property row whose row body was clicked. */
  selectedTimelineRowId?: string | null;
  onPropertyRowSelect?: (propertyId: string) => void;
  /** Edit a property's value at the playhead from its inline timeline field (#343b). */
  onPropertyValueChange?: (trackId: string, propertyId: string, value: number) => void;
  /** Toggle a property track's visibility (eye) — muted when hidden (#322). */
  onPropertyToggleHidden?: (trackId: string, propertyId: string) => void;
  /** Toggle an Animate preset bar without changing its scheduled range (#349). */
  onPresetToggleHidden?: (trackId: string, presetId: string) => void;
  /** Select one first-class Animate preset and mirror it to the inspector. */
  onPresetSelect?: (trackId: string, presetId: string) => void;
  /** Move or trim one selected editable Animate preset without compiling keyframes. */
  onPresetBarChange?: (change: TimelinePresetBarChange) => void;
  onTrackExpandedChange?: (trackId: string, expanded: boolean) => void;
  onTrackSelect?: (trackId: string, modifiers: TimelineTrackSelectionModifiers) => void;
  onAggregateKeyframeSelect?: (target: AggregateKeyframeTarget, additive: boolean) => void;
  onKeyframeSelect?: (target: KeyframeTarget, additive: boolean) => void;
  onKeyframeMove?: (target: KeyframeTarget, timeMs: number) => void;
  onKeyframeDelete?: (target: KeyframeTarget) => void;
  onEasingSegmentSelect?: (target: TimelineEasingSegmentTarget) => void;
  onEasingPresetChange?: (target: TimelineEasingSegmentTarget, easing: NamedEasingPreset) => void;
  onDurationBarChange?: (change: TimelineDurationBarChange) => void;
  onDeleteSelectedKeyframes?: () => void;
  onBlockSelect?: (id: string) => void;
  onBlockOpen?: (id: string) => void;
  onBlockContextMenu?: (id: string, detail: TimelineBlockContextMenuDetail) => void;
  onBlockMove?: (id: string, startMs: number) => void;
  onBlockTrim?: (id: string, edge: "start" | "end", timeMs: number) => void;
  onClipSelect?: (id: string) => void;
  onClipOpen?: (id: string) => void;
  onClipMove?: (id: string, startMs: number) => void;
  onClipTrim?: (id: string, edge: "start" | "end", timeMs: number, detail?: TimelineClipTrimDetail) => void;
  onAudioClipSelect?: (id: string) => void;
  onAudioClipOpen?: (id: string) => void;
  onAudioClipContextMenu?: (id: string, detail: TimelineBlockContextMenuDetail) => void;
  onAudioClipMove?: (id: string, startMs: number) => void;
  onAudioClipTrim?: (id: string, edge: "start" | "end", timeMs: number, detail?: TimelineClipTrimDetail) => void;
  onGestureStart?: (target: TimelineGestureTarget) => void;
  onGestureEnd?: (target: TimelineGestureTarget, detail: { cancelled: boolean }) => void;
  /** Per-lane master-header control state (visibility/solo/mute/lock). Absent lanes fall back to resting defaults. */
  laneControls?: Partial<Record<MasterLane, MasterLaneControlState>>;
  /** `+` add affordance per master lane (slides → composition; video/audio → clip). Omit to render the `+` disabled. */
  onLaneAdd?: (lane: MasterLane) => void;
  /**
   * Files dropped onto a master lane body (Video accepts image/video, Audio accepts
   * audio; typed by the DS, re-checked by the host). The host imports each file to a
   * `MediaAsset` and places an instance clip at the playhead — the drop is the
   * "dropzone" gesture in one motion. Omit to leave the lanes as plain pan surfaces.
   */
  onLaneDropFiles?: (lane: MasterLane, files: File[]) => void;
  /** Toggle a master lane's visibility (eye). Presentation-only unless the host maps it to real state. */
  onLaneVisibilityToggle?: (lane: MasterLane) => void;
  /** Toggle a master lane's solo ("S"). */
  onLaneSoloToggle?: (lane: MasterLane) => void;
  /** Toggle a master lane's mute (speaker). No audio-DSP semantics in v1 — visual/state only. */
  onLaneMuteToggle?: (lane: MasterLane) => void;
  /** Toggle a master lane's lock (padlock). */
  onLaneLockToggle?: (lane: MasterLane) => void;
  /** One-shot request to minimally pan a selected or newly created keyframe into the time viewport. */
  revealKeyframe?: TimelineKeyframeReveal;
  /** Acknowledges consumption so controlled hosts can clear the one-shot request. */
  onKeyframeRevealHandled?: (requestKey: string | number) => void;
  /** Stable host identity for the active composition/project interaction context. */
  interactionContextKey?: string | number;
  onBack?: () => void;
  /**
   * Collapse the whole timeline to just its header bar (Composa#582 "Collapse
   * timeline" control). Controlled — the host owns the boolean and its persistence.
   * When true the lanes body + time scrollbar are hidden and the root shrinks to the
   * header height (the `height` prop is ignored while collapsed). Mirrors the
   * track-chevron pattern: DS owns the prop + rendered state, host owns the toggle.
   */
  timelineCollapsed?: boolean;
  onTimelineCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Collapse the left track-list column (transport / lane headers / layer names) so
   * the ruler + lanes span the full width (Composa#582 "Collapse track list"
   * control). Controlled. The transport floats at the top-left while collapsed so
   * play/stop and this toggle stay reachable and can re-expand.
   */
  trackListCollapsed?: boolean;
  onTrackListCollapsedChange?: (collapsed: boolean) => void;
}) {
  const master = mode === "master";
  const [internalPlayhead, setInternalPlayhead] = useState(defaultPlayhead);
  const [internalPlaying, setInternalPlaying] = useState(defaultPlaying);
  const [internalLoop, setInternalLoop] = useState(defaultLoop);
  const [internalViewport, setInternalViewport] = useState(() => normalizeViewport(defaultViewport ?? { startMs: 0, endMs: duration }, duration));
  const [timelineWidth, setTimelineWidth] = useState(LEFT_W + 1);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const middlePan = useRef<{ pointerId: number; startClientX: number; startViewport: TimelineViewport } | null>(null);
  const viewportTouched = useRef(false);
  const previousDuration = useRef(duration);
  const previousMode = useRef(mode);
  const handledRevealKey = useRef<string | number | null>(null);
  const playhead = controlledPlayhead ?? internalPlayhead;
  const playing = controlledPlaying ?? internalPlaying;
  const loop = controlledLoop ?? internalLoop;
  const viewport = normalizeViewport(controlledViewport ?? internalViewport, duration);
  const viewportRef = useRef(viewport);
  // Effective track-list width — 0 while the left column is collapsed (Composa#582),
  // so the ruler + lanes reflow to full width and stay aligned header-to-body.
  const leftWidth = trackListCollapsed ? 0 : LEFT_W;
  const plotWidth = Math.max(1, timelineWidth - leftWidth);
  // Build the shared header contract for one master lane: resolves its control
  // state and only binds a callback when the host supplied the matching handler,
  // so an unwired affordance stays visible-but-disabled rather than a no-op.
  const laneHeaderProps = (lane: MasterLane, icon: React.ReactNode, label: string): MasterLaneHeaderProps => ({
    icon, label,
    control: laneControls?.[lane],
    onAdd: onLaneAdd ? () => onLaneAdd(lane) : undefined,
    onVisibilityToggle: onLaneVisibilityToggle ? () => onLaneVisibilityToggle(lane) : undefined,
    onSoloToggle: onLaneSoloToggle ? () => onLaneSoloToggle(lane) : undefined,
    onMuteToggle: onLaneMuteToggle ? () => onLaneMuteToggle(lane) : undefined,
    onLockToggle: onLaneLockToggle ? () => onLaneLockToggle(lane) : undefined,
  });
  const setPlayhead = (timeMs: number, source: TimelinePlayheadChangeSource) => {
    if (controlledPlayhead === undefined) setInternalPlayhead(timeMs);
    onPlayheadChange?.(timeMs, { source, millisecondsPerPixel: (viewport.endMs - viewport.startMs) / Math.max(1, plotWidth) });
  };
  const setPlaying = (next: boolean) => { if (controlledPlaying === undefined) setInternalPlaying(next); onPlayingChange?.(next); };
  const setLoop = (next: boolean) => { if (controlledLoop === undefined) setInternalLoop(next); onLoopChange?.(next); };
  const setViewport = (next: TimelineViewport, source: TimelineViewportChangeSource) => {
    const normalized = normalizeViewport(next, duration);
    viewportRef.current = normalized;
    viewportTouched.current = true;
    if (controlledViewport === undefined) setInternalViewport(normalized);
    onViewportChange?.(normalized, { source });
  };
  const edgeDrag = useTimelineEdgeDragAutoScroll(viewportRef, duration, setViewport);
  const revealTime = (timeMs: number) => {
    if (timelineWidth <= LEFT_W + 1) return;
    const next = revealTimeInViewport(viewport, timeMs, duration, 0.05, Math.max(0.1, RIGHT_OVERLAY_W / plotWidth));
    if (next.startMs !== viewport.startMs || next.endMs !== viewport.endMs) setViewport(next, "keyframe-reveal");
  };

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport.startMs, viewport.endMs]);

  useEffect(() => {
    edgeDrag.cancel();
    const activeMiddlePan = middlePan.current;
    middlePan.current = null;
    if (activeMiddlePan) {
      try { timelineRef.current?.releasePointerCapture(activeMiddlePan.pointerId); } catch {}
    }
  }, [mode, duration, interactionContextKey]);

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
        if (event.deltaY === 0) return;
        const rect = element.getBoundingClientRect();
        const ratio = timelineAnchorRatioAtX(event.clientX - rect.left - leftWidth, plotWidth);
        const deltaY = wheelDeltaPixels(event.deltaY, event.deltaMode, pageSize);
        const next = zoomViewport(viewport, ratio, Math.exp(deltaY * .002), duration);
        if (!timelineViewportChanged(viewport, next)) return;
        event.preventDefault();
        setViewport(next, "wheel-zoom");
        return;
      }
      const rawPan = wheelPanDelta(event.deltaX, event.deltaY, event.shiftKey);
      if (rawPan !== 0) {
        const next = panViewport(viewport, wheelDeltaPixels(rawPan, event.deltaMode, pageSize), plotWidth, duration);
        if (!timelineViewportChanged(viewport, next)) return;
        event.preventDefault();
        setViewport(next, "wheel-pan");
        return;
      }
      const scrollViewport = scrollViewportRef.current;
      if (!scrollViewport || event.deltaY === 0 || !(event.target instanceof Node) || !scrollViewport.contains(event.target)) return;
      const deltaY = wheelDeltaPixels(event.deltaY, event.deltaMode, Math.max(1, scrollViewport.clientHeight));
      const nextScrollTop = timelineScrollTop(scrollViewport.scrollTop, deltaY, scrollViewport.scrollHeight, scrollViewport.clientHeight);
      if (nextScrollTop === scrollViewport.scrollTop) return;
      event.preventDefault();
      scrollViewport.scrollTop = nextScrollTop;
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
  const zoomPercent = Math.round(viewportZoomValue(viewport, duration) * 100);
  const [drag, setDrag] = useState(false);
  const beginMiddlePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    const ownsPanSurface = target instanceof Element && !!target.closest("[data-timeline-pan-surface]");
    if (!shouldBeginTimelineMiddlePan(event.button, event.isPrimary, ownsPanSurface)) return;
    event.preventDefault();
    event.stopPropagation();
    middlePan.current = { pointerId: event.pointerId, startClientX: event.clientX, startViewport: viewport };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
  };
  const moveMiddlePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = middlePan.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const next = panViewport(active.startViewport, timelinePointerPanDelta(active.startClientX, event.clientX), plotWidth, duration);
    if (timelineViewportChanged(viewportRef.current, next)) setViewport(next, "pointer-pan");
  };
  const endMiddlePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = middlePan.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    middlePan.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
  };
  return (
    <div ref={timelineRef} data-timeline-viewport-start-ms={viewport.startMs} data-timeline-viewport-end-ms={viewport.endMs} data-timeline-autokeyframe={autoKeyframe || undefined}
      onPointerDownCapture={beginMiddlePan} onPointerMoveCapture={moveMiddlePan}
      onPointerUpCapture={endMiddlePan} onPointerCancelCapture={endMiddlePan} onLostPointerCapture={endMiddlePan}
      className={clsx("flex flex-col bg-c-bg border-t overflow-hidden select-none", autoKeyframe ? "border-[#ff3b30]" : "border-c-border")} style={{ height: timelineCollapsed ? undefined : height }}>
      {/* header: transport | ruler | zoom — the top bar matches a track/header row
          height (master lanes are ROW_BLOCK tall) so the ruler row and the lanes
          below read on one grid. Slide-local rows are shorter, so the transport
          keeps its compact 40px there. */}
      <div className="relative flex shrink-0 border-b border-c-border" style={{ height: master ? ROW_BLOCK : 40 }}>
        {/* When the track list is collapsed the transport floats at the top-left over
            the now-full-width ruler, so play/stop and the expand toggle stay reachable. */}
        <div className={clsx("shrink-0 flex", trackListCollapsed && "absolute left-0 top-0 bottom-0 z-30 bg-c-bg")}>
          <Transport current={playhead} duration={duration} mode={mode} playing={playing} loop={loop} onPlayingChange={setPlaying} onLoopChange={setLoop}
            autoKeyframe={autoKeyframe} onAutoKeyframeChange={onAutoKeyframeChange}
            trackListCollapsed={trackListCollapsed} onTrackListCollapsedChange={onTrackListCollapsedChange}
            onStop={() => { setPlaying(false); onStop?.(); }} />
        </div>
        <div
          data-timeline-pan-surface
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
          {/* continuous playhead stroke through the header ruler, joining the body line
              below so the playhead reads unbroken (Composa#342, gated by #344) */}
          {PLAYHEAD_CONNECTED && <div className="absolute top-[10px] bottom-0 w-px z-[15] -translate-x-1/2 pointer-events-none" style={{ left: percent(playhead, viewport), backgroundColor: autoKeyframe ? "#ff3b30" : BLUE }} />}
          {/* playhead handle — recolors red when auto-keyframe/record is armed (Composa#330) */}
          <div className="absolute top-[4px] z-20 -translate-x-1/2 pointer-events-none" style={{ left: percent(playhead, viewport) }}>
            <svg width="12" height="10" viewBox="0 0 12 10"><path d="M0 0h12v4l-6 6-6-6V0Z" fill={autoKeyframe ? "#ff3b30" : BLUE} /></svg>
          </div>
        </div>
        <div className="absolute z-10 right-0 top-0 bottom-0 flex items-center gap-[8px] px-[12px] border-l border-c-border bg-c-bg">
          <div data-timeline-zoom-control className="relative w-[91px] h-[20px]">
            <span
              aria-hidden
              data-timeline-zoom-track
              data-timeline-zoom-track-height="2"
              data-timeline-zoom-track-radius="1"
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] rounded-[1px] bg-c-bg-secondary overflow-hidden pointer-events-none"
            >
              <span
                data-timeline-zoom-fill
                className="block h-full rounded-[1px] bg-c-bg-brand"
                style={{ width: `${zoomPercent}%` }}
              />
            </span>
            <input type="range" aria-label="Timeline zoom" aria-valuetext={`${zoomPercent}%`}
              min={0} max={100} step={1} value={zoomPercent}
              onChange={event => setViewport(viewportAtZoomValue(viewport, Number(event.currentTarget.value) / 100, duration), "zoom-control")}
              className="relative appearance-none w-full h-[20px] cursor-ew-resize bg-transparent rounded-c-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-border-selected-strong [&::-webkit-slider-runnable-track]:h-[2px] [&::-webkit-slider-runnable-track]:rounded-[1px] [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-[12px] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-track]:h-[2px] [&::-moz-range-track]:rounded-[1px] [&::-moz-range-track]:bg-transparent [&::-moz-range-progress]:h-[2px] [&::-moz-range-progress]:rounded-[1px] [&::-moz-range-progress]:bg-c-bg-brand [&::-moz-range-thumb]:size-[12px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white" />
          </div>
          <button type="button" aria-label={timelineCollapsed ? "Expand timeline" : "Collapse timeline"} aria-pressed={timelineCollapsed}
            disabled={!onTimelineCollapsedChange}
            onClick={onTimelineCollapsedChange ? () => onTimelineCollapsedChange(!timelineCollapsed) : undefined}
            className={clsx("size-[24px] rounded-c-md flex items-center justify-center text-c-icon", onTimelineCollapsedChange ? "hover:bg-c-bg-hover" : "opacity-40 cursor-default", timelineCollapsed && "bg-c-bg-selected")}>
            {timelineCollapsed ? <PanelBottomOpen size={16} strokeWidth={1.5} /> : <PanelBottomClose size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* body — `contentClassName="relative"` makes the scroll CONTENT (the full
          lanes region, `min-h-full`) the positioning context for the playhead line
          below, so the line spans every lane's full height (`scrollHeight`), not just
          the visible viewport. Without it the line's `top-0 bottom-0` resolved against
          the scroll viewport's client height and came up short whenever the lanes
          overflowed (master view) — and stayed short under vertical scroll. */}
      {!timelineCollapsed && (<>
      <ScrollArea className="relative" contentClassName="relative" viewportRef={scrollViewportRef}>
        {master ? (
          <>
            <BlockTrack header={laneHeaderProps("slides", <Layers size={16} strokeWidth={1.5} />, "Compositions")} leftWidth={leftWidth} blocks={blocks} viewport={viewport} plotWidth={plotWidth} onSelect={onBlockSelect} onOpen={onBlockOpen} onContextMenu={onBlockContextMenu} onMove={onBlockMove} onTrim={onBlockTrim} onGestureStart={onGestureStart} onGestureEnd={onGestureEnd} />
            <BaseVideoTrack header={laneHeaderProps("video", <SquarePlay size={16} strokeWidth={1.5} />, "Video")} leftWidth={leftWidth} clips={baseClips} viewport={viewport} plotWidth={plotWidth} accept={VIDEO_LANE_DROP_ACCEPT} dropHint="Drop image or video here" onDropFiles={onLaneDropFiles ? files => onLaneDropFiles("video", files) : undefined} onSelect={onClipSelect} onOpen={onClipOpen} onMove={onClipMove} onTrim={onClipTrim} onGestureStart={onGestureStart} onGestureEnd={onGestureEnd} />
            <AudioTrack header={laneHeaderProps("audio", <AudioLines size={16} strokeWidth={1.5} />, "Audio")} leftWidth={leftWidth} clips={audioClips} viewport={viewport} plotWidth={plotWidth} accept={AUDIO_LANE_DROP_ACCEPT} dropHint="Drop audio here" onDropFiles={onLaneDropFiles ? files => onLaneDropFiles("audio", files) : undefined} onSelect={onAudioClipSelect} onOpen={onAudioClipOpen} onContextMenu={onAudioClipContextMenu} onMove={onAudioClipMove} onTrim={onAudioClipTrim} onGestureStart={onGestureStart} onGestureEnd={onGestureEnd} />
          </>
        ) : (
          <>
            {/* ← Project back affordance — slide-local view (you drilled INTO a slide) */}
            <div className="flex items-center" style={{ height: ROW_LAYER }}>
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to project"
                className={clsx(FONT, "shrink-0 flex items-center gap-[4px] pl-[8px] pr-[8px] h-full border-r border-c-border text-[11px] font-[450] text-c-text-secondary hover:text-c-text", leftWidth === 0 && "hidden")}
                style={{ width: leftWidth }}
              >
                <ChevronLeftBack size={14} strokeWidth={1.5} className="shrink-0" />
                <span>Project</span>
              </button>
            </div>
            <div role={onTrackSelect ? "listbox" : undefined} aria-label={onTrackSelect ? "Timeline layers" : undefined} aria-multiselectable={onTrackSelect ? true : undefined}>
            {tracks.map((t, i) => <TrackRows key={t.id ?? i} track={t} trackIndex={i} leftWidth={leftWidth} focusable={i === Math.max(0, tracks.findIndex(track => (track.selectionState ?? (track.selected ? "selected" : "none")) === "selected"))} viewport={viewport} plotWidth={plotWidth} duration={duration} edgeDrag={edgeDrag} onTrackSelect={onTrackSelect}
              onExpandedChange={onTrackExpandedChange} onAggregateKeyframeSelect={onAggregateKeyframeSelect}
              onKeyframeSelect={(target, additive) => { revealTime(target.timeMs); onKeyframeSelect?.(target, additive); }} onKeyframeMove={onKeyframeMove} onKeyframeDelete={onKeyframeDelete}
              onEasingSegmentSelect={onEasingSegmentSelect} onEasingPresetChange={onEasingPresetChange}
              onDurationBarChange={onDurationBarChange}
              onPresetSelect={onPresetSelect} onPresetBarChange={onPresetBarChange}
              onGestureStart={onGestureStart} onGestureEnd={onGestureEnd}
              onPropertyAddKeyframe={onPropertyAddKeyframe ? (trackId, propertyId, timeMs = playhead) => onPropertyAddKeyframe(trackId, propertyId, timeMs) : undefined}
              onPropertyStepKeyframe={onPropertyStepKeyframe}
              selectedTimelineRowId={selectedTimelineRowId} onPropertyRowSelect={onPropertyRowSelect} onPropertyValueChange={onPropertyValueChange}
              onPropertyToggleHidden={onPropertyToggleHidden} onPresetToggleHidden={onPresetToggleHidden} />)}
            </div>
          </>
        )}
        {/* shared playhead line spanning the FULL lanes region — above the keyframe
            diamonds (Composa#320). The wrapper's `top-0 bottom-0` resolves against the
            relatively-positioned scroll content (see `contentClassName` above), so it
            spans header-ruler-bottom through the last lane at any scroll position and in
            the empty/null state, instead of only the visible viewport height. */}
        <div className="absolute top-0 bottom-0 right-0 z-20 overflow-hidden pointer-events-none" style={{ left: leftWidth }}>
          <div className="absolute top-0 bottom-0 w-px" style={{ left: percent(playhead, viewport), backgroundColor: autoKeyframe ? "#ff3b30" : BLUE }} />
        </div>
      </ScrollArea>
      {/* horizontal time-axis scrollbar — visible, draggable pan of the viewport window */}
      <TimelineTimeScrollbar viewport={viewport} duration={duration} plotWidth={plotWidth} leftWidth={leftWidth} onPan={next => setViewport(next, "pointer-pan")} />
      </>)}
    </div>
  );
}
