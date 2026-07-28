export interface TimelineViewport {
  startMs: number;
  endMs: number;
}

export interface AggregateKeyInput {
  propertyId: string;
  keyframeId: string;
  timeMs: number;
  selected?: boolean;
}

export interface AggregateKeyframe {
  timeMs: number;
  keyframeIds: string[];
  complete: boolean;
  selected: boolean;
}

const MIN_VIEWPORT_MS = 100;
export const EDGE_AUTO_SCROLL_ZONE_PX = 32;
export const EDGE_AUTO_SCROLL_MAX_PX_PER_SECOND = 720;
export const EDGE_AUTO_SCROLL_MAX_FRAME_MS = 32;

export function minimumViewportSpan(durationMs: number): number {
  return Math.min(MIN_VIEWPORT_MS, Math.max(1, durationMs));
}

export function normalizeViewport(viewport: TimelineViewport, durationMs: number): TimelineViewport {
  const duration = Math.max(1, Number.isFinite(durationMs) ? durationMs : MIN_VIEWPORT_MS);
  const minimumSpan = minimumViewportSpan(duration);
  const rawStart = Number.isFinite(viewport.startMs) ? viewport.startMs : 0;
  const rawEnd = Number.isFinite(viewport.endMs) ? viewport.endMs : duration;
  const span = Math.min(duration, Math.max(minimumSpan, rawEnd - rawStart));
  const startMs = Math.max(0, Math.min(duration - span, rawStart));
  return { startMs, endMs: startMs + span };
}

// The plot origin (time = viewport.startMs) is inset from the left edge by this
// fraction of the plot width (Figma parity — Composa#326). Applied at the single
// forward/inverse chokepoint so positions (ruler, playhead, keyframes, duration
// bars) and pointer mapping (scrub, drag) stay consistent. The right edge is not
// inset: frac 0 → INSET, frac 1 → 1.
export const PLOT_INSET_FRACTION = 0.02;

export function timeToX(timeMs: number, viewport: TimelineViewport, widthPx: number): number {
  const span = Math.max(1, viewport.endMs - viewport.startMs);
  const frac = (timeMs - viewport.startMs) / span;
  return (PLOT_INSET_FRACTION + (1 - PLOT_INSET_FRACTION) * frac) * Math.max(0, widthPx);
}

export function xToTime(xPx: number, viewport: TimelineViewport, widthPx: number): number {
  const width = Math.max(1, widthPx);
  const frac = (xPx / width - PLOT_INSET_FRACTION) / (1 - PLOT_INSET_FRACTION);
  return viewport.startMs + frac * (viewport.endMs - viewport.startMs);
}

export function zoomViewport(viewport: TimelineViewport, anchorRatio: number, factor: number, durationMs: number): TimelineViewport {
  const current = normalizeViewport(viewport, durationMs);
  const ratio = Math.max(0, Math.min(1, anchorRatio));
  const anchor = current.startMs + (current.endMs - current.startMs) * ratio;
  const nextSpan = (current.endMs - current.startMs) * factor;
  return normalizeViewport({ startMs: anchor - nextSpan * ratio, endMs: anchor + nextSpan * (1 - ratio) }, durationMs);
}

export function panViewport(viewport: TimelineViewport, deltaPx: number, widthPx: number, durationMs: number): TimelineViewport {
  const current = normalizeViewport(viewport, durationMs);
  const deltaMs = deltaPx / Math.max(1, widthPx) * (current.endMs - current.startMs);
  return normalizeViewport({ startMs: current.startMs + deltaMs, endMs: current.endMs + deltaMs }, durationMs);
}

/**
 * Returns signed screen velocity for a captured pointer near a visible time-lane
 * edge. The quadratic ramp is gentle at entry and capped outside the lane.
 */
export function edgeAutoScrollVelocity(
  clientX: number,
  leftPx: number,
  widthPx: number,
  thresholdPx = EDGE_AUTO_SCROLL_ZONE_PX,
  maxPxPerSecond = EDGE_AUTO_SCROLL_MAX_PX_PER_SECOND,
): number {
  if (![clientX, leftPx, widthPx, thresholdPx, maxPxPerSecond].every(Number.isFinite) || widthPx <= 0 || thresholdPx <= 0 || maxPxPerSecond <= 0) return 0;
  const rightPx = leftPx + widthPx;
  const leftPenetration = Math.max(0, Math.min(1, (leftPx + thresholdPx - clientX) / thresholdPx));
  const rightPenetration = Math.max(0, Math.min(1, (clientX - (rightPx - thresholdPx)) / thresholdPx));
  if (leftPenetration > 0 && leftPenetration >= rightPenetration) return -maxPxPerSecond * leftPenetration ** 2;
  if (rightPenetration > 0) return maxPxPerSecond * rightPenetration ** 2;
  return 0;
}

/** Advances a viewport by one animation frame while preserving its span. */
export function advanceEdgeAutoScrollViewport(
  viewport: TimelineViewport,
  velocityPxPerSecond: number,
  elapsedMs: number,
  widthPx: number,
  durationMs: number,
): TimelineViewport {
  const frameMs = Math.max(0, Math.min(EDGE_AUTO_SCROLL_MAX_FRAME_MS, Number.isFinite(elapsedMs) ? elapsedMs : 0));
  if (!Number.isFinite(velocityPxPerSecond) || velocityPxPerSecond === 0 || frameMs === 0) return normalizeViewport(viewport, durationMs);
  return panViewport(viewport, velocityPxPerSecond * frameMs / 1000, widthPx, durationMs);
}

/**
 * Converts pointer motion plus UI-only viewport displacement into one authored
 * drag delta. This keeps a stationary captured pointer moving with auto-pan.
 */
export function timelineDragDeltaMs(
  startClientX: number,
  clientX: number,
  startViewportStartMs: number,
  viewport: TimelineViewport,
  widthPx: number,
): number {
  // Divide by the inset-compressed plot width so a dragged item tracks the cursor
  // 1:1 despite the origin inset (Composa#326).
  const pointerDeltaMs = (clientX - startClientX) / Math.max(1, widthPx * (1 - PLOT_INSET_FRACTION)) * (viewport.endMs - viewport.startMs);
  return pointerDeltaMs + (viewport.startMs - startViewportStartMs);
}

export interface TimelineEdgeDragController {
  start(cancelGesture: () => void): void;
  update(clientX: number, bounds: { left: number; width: number }, applyAtViewport: (viewport: TimelineViewport) => void): void;
  stop(): void;
  cancel(): void;
}

/**
 * Owns one edge-scroll animation loop and its corresponding host gesture.
 * Keeping cancellation in this controller lets a Timeline context change or
 * unmount terminate the document transaction even if the pointer never emits a
 * terminal event.
 */
export function createTimelineEdgeDragController({
  getViewport,
  getDurationMs,
  setViewport,
  requestFrame,
  cancelFrame,
}: {
  getViewport: () => TimelineViewport;
  getDurationMs: () => number;
  setViewport: (viewport: TimelineViewport) => void;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (handle: number) => void;
}): TimelineEdgeDragController {
  let active: { clientX: number; bounds: { left: number; width: number }; apply: (viewport: TimelineViewport) => void } | null = null;
  let cancelGesture: (() => void) | null = null;
  let frame: number | null = null;
  let previousTime = 0;

  const stopFrame = () => {
    if (frame !== null) cancelFrame(frame);
    frame = null;
    previousTime = 0;
  };
  const stop = () => {
    active = null;
    cancelGesture = null;
    stopFrame();
  };
  const cancel = () => {
    const finish = cancelGesture;
    active = null;
    cancelGesture = null;
    stopFrame();
    finish?.();
  };
  const tick = (time: number) => {
    if (!active) { stopFrame(); return; }
    const velocity = edgeAutoScrollVelocity(active.clientX, active.bounds.left, active.bounds.width);
    if (velocity === 0) { stopFrame(); return; }
    const elapsed = previousTime === 0 ? 16 : time - previousTime;
    previousTime = time;
    const viewport = getViewport();
    const next = advanceEdgeAutoScrollViewport(viewport, velocity, elapsed, active.bounds.width, getDurationMs());
    if (next.startMs === viewport.startMs && next.endMs === viewport.endMs) { stopFrame(); return; }
    setViewport(next);
    active.apply(next);
    frame = requestFrame(tick);
  };

  return {
    start(nextCancelGesture) {
      stop();
      cancelGesture = nextCancelGesture;
    },
    update(clientX, bounds, applyAtViewport) {
      active = { clientX, bounds, apply: applyAtViewport };
      applyAtViewport(getViewport());
      const velocity = edgeAutoScrollVelocity(clientX, bounds.left, bounds.width);
      if (velocity === 0) { stopFrame(); return; }
      if (frame === null) {
        previousTime = 0;
        frame = requestFrame(tick);
      }
    },
    stop,
    cancel,
  };
}

/**
 * Minimally pans a timeline window so an authored time is visible with a small
 * working margin. The time scale is preserved; this never zooms or changes the
 * document clock.
 */
export function revealTimeInViewport(viewport: TimelineViewport, timeMs: number, durationMs: number, startPaddingRatio = 0.1, endPaddingRatio = startPaddingRatio): TimelineViewport {
  const current = normalizeViewport(viewport, durationMs);
  if (!Number.isFinite(timeMs)) return current;
  const target = Math.max(0, Math.min(Math.max(0, durationMs), timeMs));
  const span = current.endMs - current.startMs;
  const startPadding = Math.min(span / 2, Math.max(0, startPaddingRatio) * span);
  const endPadding = Math.min(span / 2, Math.max(0, endPaddingRatio) * span);
  const safeStart = current.startMs + startPadding;
  const safeEnd = current.endMs - endPadding;
  if (target >= safeStart && target <= safeEnd) return current;
  const delta = target < safeStart ? target - safeStart : target - safeEnd;
  return normalizeViewport({ startMs: current.startMs + delta, endMs: current.endMs + delta }, durationMs);
}

/** Convert DOM WheelEvent deltas to CSS pixels. */
export function wheelDeltaPixels(delta: number, deltaMode: number, pageSizePx: number): number {
  if (deltaMode === 1) return delta * 16;
  if (deltaMode === 2) return delta * Math.max(1, pageSizePx);
  return delta;
}

export function wheelPanDelta(deltaX: number, deltaY: number, shiftKey: boolean): number {
  return deltaX !== 0 ? deltaX : shiftKey ? deltaY : 0;
}

/** Maps screen-space x onto the authored-time fraction after the 2% origin inset. */
export function timelineAnchorRatioAtX(xPx: number, widthPx: number): number {
  const screenRatio = xPx / Math.max(1, widthPx);
  return Math.max(0, Math.min(1, (screenRatio - PLOT_INSET_FRACTION) / (1 - PLOT_INSET_FRACTION)));
}

/** Returns the next native row-scroll offset, clamped to the visible content. */
export function timelineScrollTop(
  scrollTop: number,
  deltaPx: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const maximum = Math.max(0, scrollHeight - clientHeight);
  return Math.max(0, Math.min(maximum, scrollTop + deltaPx));
}

/** Middle-drag moves the time surface with the pointer, opposite viewport travel. */
export function timelinePointerPanDelta(startClientX: number, clientX: number): number {
  return (startClientX - clientX) / (1 - PLOT_INSET_FRACTION);
}

export function timelineViewportChanged(previous: TimelineViewport, next: TimelineViewport): boolean {
  return previous.startMs !== next.startMs || previous.endMs !== next.endMs;
}

export function viewportZoomValue(viewport: TimelineViewport, durationMs: number): number {
  const current = normalizeViewport(viewport, durationMs);
  const duration = Math.max(1, durationMs);
  const minimum = minimumViewportSpan(duration);
  if (duration === minimum) return 0;
  return Math.max(0, Math.min(1, Math.log(duration / (current.endMs - current.startMs)) / Math.log(duration / minimum)));
}

export function viewportAtZoomValue(viewport: TimelineViewport, value: number, durationMs: number): TimelineViewport {
  const current = normalizeViewport(viewport, durationMs);
  const duration = Math.max(1, durationMs);
  const minimum = minimumViewportSpan(duration);
  const normalized = Math.max(0, Math.min(1, value));
  const targetSpan = duration * (minimum / duration) ** normalized;
  return zoomViewport(current, .5, targetSpan / (current.endMs - current.startMs), duration);
}

export function reconcileUncontrolledViewport(viewport: TimelineViewport, durationMs: number, pristineFullRange: boolean): TimelineViewport {
  return pristineFullRange ? normalizeViewport({ startMs: 0, endMs: durationMs }, durationMs) : normalizeViewport(viewport, durationMs);
}

export function tickTimes(viewport: TimelineViewport, widthPx: number): number[] {
  const span = Math.max(1, viewport.endMs - viewport.startMs);
  const targetStep = span / Math.max(1, widthPx / 88);
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalized = targetStep / magnitude;
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = Math.max(1, multiplier * magnitude);
  const first = Math.ceil(viewport.startMs / step) * step;
  const result: number[] = [];
  for (let time = first; time <= viewport.endMs; time += step) result.push(time);
  return result;
}

// ── ruler unit selection (master seconds ↔ minutes) ──────────────────────────
// At high zoom the master ruler reads in seconds ("1.50s"); when zoomed far out the
// visible span crosses into minute territory and per-second labels become noise, so
// the ruler switches to `m:ss` (e.g. "1:30"). The switch is keyed off the visible
// span, not the absolute time, so the label unit tracks the zoom level. The default
// threshold is one minute of visible span (owner-confirmable).
export const MASTER_RULER_MINUTES_SPAN_MS = 60_000;

export function timelineRulerUsesMinutes(spanMs: number, thresholdMs = MASTER_RULER_MINUTES_SPAN_MS): boolean {
  return Number.isFinite(spanMs) && spanMs >= thresholdMs;
}

/** Formats one master-ruler tick: `m:ss` when zoomed far out, else seconds. */
export function formatMasterRulerTick(timeMs: number, spanMs: number, thresholdMs = MASTER_RULER_MINUTES_SPAN_MS): string {
  const ms = Number.isFinite(timeMs) ? timeMs : 0;
  if (timelineRulerUsesMinutes(spanMs, thresholdMs)) {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  return `${Number((ms / 1000).toFixed(2))}s`;
}

// ── horizontal viewport scrollbar (time-axis pan affordance) ─────────────────
// The timeline pans on shift-wheel / trackpad-x, but that is undiscoverable and
// leaves no visible position indicator. This maps the viewport window onto a
// horizontal scrollbar track so it can be read and dragged. The thumb width is the
// visible fraction of the whole duration; its offset is the scroll position.
export const TIMELINE_SCROLLBAR_MIN_THUMB_PX = 24;

export function timelineScrollbarThumb(
  viewport: TimelineViewport,
  durationMs: number,
  trackWidthPx: number,
  minThumbPx = TIMELINE_SCROLLBAR_MIN_THUMB_PX,
): { leftPx: number; widthPx: number; scrollable: boolean } {
  const track = Math.max(0, trackWidthPx);
  const duration = Math.max(1, durationMs);
  const span = Math.min(duration, Math.max(0, viewport.endMs - viewport.startMs));
  const rawWidth = (span / duration) * track;
  const widthPx = Math.max(Math.min(minThumbPx, track), Math.min(track, rawWidth));
  const maxLeft = Math.max(0, track - widthPx);
  const scrollable = duration - span > 0.5;
  const startFraction = scrollable ? viewport.startMs / (duration - span) : 0;
  const leftPx = Math.max(0, Math.min(maxLeft, startFraction * maxLeft));
  return { leftPx, widthPx, scrollable };
}

/** Pans the viewport for a horizontal-scrollbar thumb drag of `deltaPx` track pixels. */
export function timelineScrollbarPan(
  viewport: TimelineViewport,
  deltaPx: number,
  durationMs: number,
  trackWidthPx: number,
  minThumbPx = TIMELINE_SCROLLBAR_MIN_THUMB_PX,
): TimelineViewport {
  const duration = Math.max(1, durationMs);
  const current = normalizeViewport(viewport, duration);
  const span = current.endMs - current.startMs;
  if (duration - span <= 0.5 || !Number.isFinite(deltaPx)) return current;
  const { widthPx } = timelineScrollbarThumb(current, duration, trackWidthPx, minThumbPx);
  const maxLeft = Math.max(1, Math.max(0, trackWidthPx) - widthPx);
  const deltaStartMs = (deltaPx / maxLeft) * (duration - span);
  return normalizeViewport({ startMs: current.startMs + deltaStartMs, endMs: current.endMs + deltaStartMs }, duration);
}

export function collectAggregateKeyframes(keys: AggregateKeyInput[], propertyCount: number): AggregateKeyframe[] {
  const byTime = new Map<number, AggregateKeyInput[]>();
  for (const key of keys) byTime.set(key.timeMs, [...(byTime.get(key.timeMs) ?? []), key]);
  return [...byTime.entries()].sort(([left], [right]) => left - right).map(([timeMs, entries]) => ({
    timeMs,
    keyframeIds: entries.map(entry => entry.keyframeId),
    complete: new Set(entries.map(entry => entry.propertyId)).size === propertyCount,
    selected: entries.length > 0 && entries.every(entry => entry.selected),
  }));
}
