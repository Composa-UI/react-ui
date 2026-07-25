import { describe, expect, it } from "vitest";
import { advanceEdgeAutoScrollViewport, collectAggregateKeyframes, createTimelineEdgeDragController, edgeAutoScrollVelocity, normalizeViewport, panViewport, reconcileUncontrolledViewport, revealTimeInViewport, tickTimes, timelineDragDeltaMs, timeToX, viewportAtZoomValue, viewportZoomValue, wheelDeltaPixels, wheelPanDelta, xToTime, zoomViewport } from "./timelineModel";

describe("timeline viewport model", () => {
  it("round-trips time and pixels inside a controlled viewport", () => {
    const viewport = { startMs: 1_000, endMs: 5_000 };
    expect(timeToX(3_000, viewport, 800)).toBe(408);
    expect(xToTime(408, viewport, 800)).toBe(3_000);
  });

  it("zooms around the cursor anchor and clamps at the duration", () => {
    expect(zoomViewport({ startMs: 0, endMs: 10_000 }, .25, .5, 10_000)).toEqual({ startMs: 1_250, endMs: 6_250 });
    expect(zoomViewport({ startMs: 0, endMs: 200 }, 0, .1, 10_000)).toEqual({ startMs: 0, endMs: 100 });
  });

  it("pans horizontally without changing span or leaving the duration", () => {
    expect(panViewport({ startMs: 1_000, endMs: 5_000 }, 200, 800, 10_000)).toEqual({ startMs: 2_000, endMs: 6_000 });
    expect(panViewport({ startMs: 7_000, endMs: 10_000 }, 200, 800, 10_000)).toEqual({ startMs: 7_000, endMs: 10_000 });
  });

  it("minimally reveals authored times with padding while preserving zoom", () => {
    expect(revealTimeInViewport({ startMs: 2_000, endMs: 6_000 }, 3_000, 10_000)).toEqual({ startMs: 2_000, endMs: 6_000 });
    expect(revealTimeInViewport({ startMs: 2_000, endMs: 6_000 }, 8_000, 10_000)).toEqual({ startMs: 4_400, endMs: 8_400 });
    expect(revealTimeInViewport({ startMs: 2_000, endMs: 6_000 }, 5_800, 10_000, 0.05, 0.25)).toEqual({ startMs: 2_800, endMs: 6_800 });
    expect(revealTimeInViewport({ startMs: 2_000, endMs: 6_000 }, 0, 10_000)).toEqual({ startMs: 0, endMs: 4_000 });
    expect(revealTimeInViewport({ startMs: 2_000, endMs: 6_000 }, Number.NaN, 10_000)).toEqual({ startMs: 2_000, endMs: 6_000 });
  });

  it("normalizes invalid ranges and produces adaptive visible ticks", () => {
    expect(normalizeViewport({ startMs: -50, endMs: 20 }, 1_000)).toEqual({ startMs: 0, endMs: 100 });
    expect(tickTimes({ startMs: 1_100, endMs: 2_100 }, 500)).toEqual([1_200, 1_400, 1_600, 1_800, 2_000]);
  });

  it("normalizes pixel, line, and page wheel delta modes", () => {
    expect(wheelDeltaPixels(3, 0, 800)).toBe(3);
    expect(wheelDeltaPixels(3, 1, 800)).toBe(48);
    expect(wheelDeltaPixels(2, 2, 800)).toBe(1_600);
    expect(wheelPanDelta(24, 90, false)).toBe(24);
    expect(wheelPanDelta(0, 90, true)).toBe(90);
    expect(wheelPanDelta(0, 90, false)).toBe(0);
  });

  it("maps the accessible zoom control to viewport span while preserving center", () => {
    const viewport = { startMs: 2_000, endMs: 8_000 };
    const zoomed = viewportAtZoomValue(viewport, .5, 10_000);
    expect(zoomed.startMs + zoomed.endMs).toBe(10_000);
    expect(viewportZoomValue(zoomed, 10_000)).toBeCloseTo(.5);
    expect(viewportAtZoomValue(zoomed, 0, 10_000)).toEqual({ startMs: 0, endMs: 10_000 });
  });

  it("follows duration while pristine but preserves a touched zoom window", () => {
    expect(reconcileUncontrolledViewport({ startMs: 0, endMs: 4_000 }, 8_000, true)).toEqual({ startMs: 0, endMs: 8_000 });
    expect(reconcileUncontrolledViewport({ startMs: 1_000, endMs: 3_000 }, 8_000, false)).toEqual({ startMs: 1_000, endMs: 3_000 });
    expect(reconcileUncontrolledViewport({ startMs: 7_000, endMs: 9_000 }, 8_000, false)).toEqual({ startMs: 6_000, endMs: 8_000 });
  });

  it("uses a symmetric quadratic client-pixel edge ramp", () => {
    expect(edgeAutoScrollVelocity(132, 100, 400)).toBe(0);
    expect(edgeAutoScrollVelocity(468, 100, 400)).toBe(0);
    expect(edgeAutoScrollVelocity(116, 100, 400)).toBe(-180);
    expect(edgeAutoScrollVelocity(484, 100, 400)).toBe(180);
    expect(edgeAutoScrollVelocity(90, 100, 400)).toBe(-720);
    expect(edgeAutoScrollVelocity(510, 100, 400)).toBe(720);
    expect(edgeAutoScrollVelocity(Number.NaN, 100, 400)).toBe(0);
  });

  it("advances continuously with a capped frame delta and preserves viewport span", () => {
    expect(advanceEdgeAutoScrollViewport({ startMs: 2_000, endMs: 6_000 }, 500, 16, 1_000, 10_000)).toEqual({ startMs: 2_032, endMs: 6_032 });
    expect(advanceEdgeAutoScrollViewport({ startMs: 2_000, endMs: 6_000 }, 500, 200, 1_000, 10_000)).toEqual({ startMs: 2_064, endMs: 6_064 });
    expect(advanceEdgeAutoScrollViewport({ startMs: 0, endMs: 4_000 }, -720, 32, 1_000, 10_000)).toEqual({ startMs: 0, endMs: 4_000 });
    expect(advanceEdgeAutoScrollViewport({ startMs: 6_000, endMs: 10_000 }, 720, 32, 1_000, 10_000)).toEqual({ startMs: 6_000, endMs: 10_000 });
  });

  it("combines pointer motion with viewport displacement at any zoom", () => {
    expect(timelineDragDeltaMs(100, 150, 1_000, { startMs: 1_400, endMs: 5_400 }, 800)).toBeCloseTo(655.1020408163265);
    expect(timelineDragDeltaMs(100, 100, 1_000, { startMs: 1_400, endMs: 3_400 }, 800)).toBe(400);
  });

  it("cancels a registered host gesture exactly once before pointer motion", () => {
    let cancellations = 0;
    const controller = createTimelineEdgeDragController({
      getViewport: () => ({ startMs: 0, endMs: 1_000 }),
      getDurationMs: () => 4_000,
      setViewport: () => undefined,
      requestFrame: () => 1,
      cancelFrame: () => undefined,
    });
    controller.start(() => { cancellations += 1; });
    controller.cancel();
    controller.cancel();
    expect(cancellations).toBe(1);
  });

  it("cancels an active frame loop and prevents stale viewport callbacks", () => {
    let viewport = { startMs: 1_000, endMs: 2_000 };
    let cancellations = 0;
    let applied = 0;
    let nextHandle = 1;
    const frames = new Map<number, FrameRequestCallback>();
    const controller = createTimelineEdgeDragController({
      getViewport: () => viewport,
      getDurationMs: () => 4_000,
      setViewport: next => { viewport = next; },
      requestFrame: callback => { const handle = nextHandle++; frames.set(handle, callback); return handle; },
      cancelFrame: handle => { frames.delete(handle); },
    });
    controller.start(() => { cancellations += 1; });
    controller.update(496, { left: 100, width: 400 }, () => { applied += 1; });
    expect(frames.size).toBe(1);
    const firstFrame = [...frames.values()][0];
    frames.clear();
    firstFrame?.(16);
    expect(viewport.startMs).toBeGreaterThan(1_000);
    expect(applied).toBe(2);
    expect(frames.size).toBe(1);
    controller.cancel();
    expect(cancellations).toBe(1);
    expect(frames.size).toBe(0);
    expect(applied).toBe(2);
  });
});

describe("timeline aggregate keys", () => {
  it("groups exact times, preserves stable IDs, and distinguishes complete aggregates", () => {
    const aggregates = collectAggregateKeyframes([
      { propertyId: "opacity", keyframeId: "opacity-0", timeMs: 500, selected: true },
      { propertyId: "x", keyframeId: "x-0", timeMs: 500, selected: true },
      { propertyId: "opacity", keyframeId: "opacity-1", timeMs: 900 },
    ], 2);
    expect(aggregates).toEqual([
      { timeMs: 500, keyframeIds: ["opacity-0", "x-0"], complete: true, selected: true },
      { timeMs: 900, keyframeIds: ["opacity-1"], complete: false, selected: false },
    ]);
  });
});
