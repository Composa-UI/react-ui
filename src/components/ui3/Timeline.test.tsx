import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { shouldBeginTimelinePointer, shouldClaimTimelineGestureEscape, shouldHandleTimelineReveal, stepTimelinePlayhead, timelineClipTrimDetail, Timeline, type Track } from "./Timeline";

const numericTrack: Track = { id: "hero", name: "Hero", type: "frame", props: [
  { id: "opacity", name: "Opacity", keyframes: [500, 900] },
  { id: "x", name: "Position X", keyframes: [500] },
] };

describe("Timeline DOM contracts", () => {
  it("exposes stable composition block identity for controlled context-menu adapters", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={2_000}
      blocks={[{ id: "intro", name: "Intro", range: [0, 1_000] }]} onBlockContextMenu={() => undefined} />);
    expect(html).toContain('aria-label="Intro"');
    expect(html).toContain('data-timeline-block-id="intro"');
    expect(html).toContain('aria-haspopup="menu"');
  });

  it("does not advertise unstable context identity for legacy ID-less blocks", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={2_000}
      blocks={[{ name: "Legacy", range: [0, 1_000] }]} onBlockContextMenu={() => undefined} />);
    expect(html).not.toContain("data-timeline-block-id");
    expect(html).not.toContain('aria-haspopup="menu"');
  });

  it("preserves legacy individual numeric keyframe IDs", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]} />);
    expect(html).toContain('data-keyframe-id="keyframe-0-500"');
    expect(html).toContain('data-keyframe-id="keyframe-1-900"');
    expect(html).not.toContain('data-keyframe-id="opacity:aggregate-keyframe');
  });

  it("renders disclosures without enabling aggregate product behavior when callbacks are absent", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]} />);
    expect(html).not.toContain('aria-label="Collapse Hero"');
    expect(html).not.toContain('aria-label="Hero aggregate keyframe');
    expect(html).not.toContain('data-aggregate-status="complete"');
    expect(html).not.toContain('data-aggregate-status="partial"');
  });

  it("exposes controlled disclosures and accessible aggregate status when callbacks exist", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]}
      onTrackExpandedChange={() => undefined} onAggregateKeyframeSelect={() => undefined} />);
    expect(html).toContain('aria-label="Collapse Hero"');
    expect(html).toContain('aria-label="Hero aggregate keyframe at 500ms (complete)"');
    expect(html).toContain('aria-label="Hero aggregate keyframe at 900ms (partial)"');
    expect(html).toContain("focus-visible:ring-c-border-selected-strong");
  });

  it("exposes a focusable Playhead with the active keyboard map", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]} onAddKeyframe={() => undefined} onDeleteSelectedKeyframes={() => undefined} />);
    expect(html).toContain('role="slider" tabindex="0" aria-label="Playhead"');
    expect(html).toContain('aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End Space K Delete Backspace"');
  });

  it("keeps keyframe add and delete shortcuts out of the master Playhead map", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={2_000} tracks={[numericTrack]} onDeleteSelectedKeyframes={() => undefined} />);
    expect(html).toContain('aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End Space"');
    expect(html).not.toContain('aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End Space K');
  });

  it("only advertises keyframe shortcuts backed by callbacks", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]} />);
    expect(html).toContain('aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End Space"');
  });
});

describe("Timeline Playhead frame stepping", () => {
  it.each([24, 25, 30, 60] as const)("steps by one and ten frames at %ifps", frameRate => {
    expect(stepTimelinePlayhead(300, 1, frameRate, 4_000)).toBeCloseTo(300 + 1_000 / frameRate);
    expect(stepTimelinePlayhead(300, -1, frameRate, 4_000)).toBeCloseTo(300 - 1_000 / frameRate);
    expect(stepTimelinePlayhead(300, 10, frameRate, 4_000)).toBeCloseTo(300 + 10_000 / frameRate);
    expect(stepTimelinePlayhead(300, -10, frameRate, 4_000)).toBeCloseTo(Math.max(0, 300 - 10_000 / frameRate));
  });

  it("clamps at both timeline bounds", () => {
    expect(stepTimelinePlayhead(10, -10, 30, 4_000)).toBe(0);
    expect(stepTimelinePlayhead(3_990, 10, 30, 4_000)).toBe(4_000);
  });
});

describe("Timeline gesture keyboard ownership", () => {
  it("reports the measured clock-domain tolerance for clip trim callbacks", () => {
    expect(timelineClipTrimDetail("pointer", { startMs: 2_000, endMs: 12_000 }, 1_000)).toEqual({ source: "pointer", millisecondsPerPixel: 10 });
    expect(timelineClipTrimDetail("keyboard", { startMs: 2_000, endMs: 12_000 }, 0)).toEqual({ source: "keyboard", millisecondsPerPixel: 10_000 });
  });
  it("starts move and trim gestures only from the primary left pointer", () => {
    expect(shouldBeginTimelinePointer(0, true)).toBe(true);
    expect(shouldBeginTimelinePointer(1, true)).toBe(false);
    expect(shouldBeginTimelinePointer(2, true)).toBe(false);
    expect(shouldBeginTimelinePointer(0, false)).toBe(false);
  });

  it("claims Escape only while a local drag or trim gesture is active", () => {
    expect(shouldClaimTimelineGestureEscape("Escape", true)).toBe(true);
    expect(shouldClaimTimelineGestureEscape("Escape", false)).toBe(false);
    expect(shouldClaimTimelineGestureEscape("Enter", true)).toBe(false);
  });
});

describe("Timeline controlled reveal ownership", () => {
  it("waits for a measured plot and consumes each request key once in slide mode", () => {
    expect(shouldHandleTimelineReveal(false, 1, null, 298)).toBe(false);
    expect(shouldHandleTimelineReveal(false, 1, null, 900)).toBe(true);
    expect(shouldHandleTimelineReveal(false, 1, 1, 900)).toBe(false);
    expect(shouldHandleTimelineReveal(true, 1, null, 900)).toBe(false);
  });
});
