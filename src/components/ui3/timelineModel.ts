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

export function timeToX(timeMs: number, viewport: TimelineViewport, widthPx: number): number {
  const span = Math.max(1, viewport.endMs - viewport.startMs);
  return (timeMs - viewport.startMs) / span * Math.max(0, widthPx);
}

export function xToTime(xPx: number, viewport: TimelineViewport, widthPx: number): number {
  const width = Math.max(1, widthPx);
  return viewport.startMs + xPx / width * (viewport.endMs - viewport.startMs);
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
  const pointerDeltaMs = (clientX - startClientX) / Math.max(1, widthPx) * (viewport.endMs - viewport.startMs);
  return pointerDeltaMs + (viewport.startMs - startViewportStartMs);
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
