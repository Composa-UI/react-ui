import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { shouldClaimTimelineGestureEscape, Timeline, type Track } from "./Timeline";

const numericTrack: Track = { id: "hero", name: "Hero", type: "frame", props: [
  { id: "opacity", name: "Opacity", keyframes: [500, 900] },
  { id: "x", name: "Position X", keyframes: [500] },
] };

describe("Timeline DOM contracts", () => {
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
});

describe("Timeline gesture keyboard ownership", () => {
  it("claims Escape only while a local drag or trim gesture is active", () => {
    expect(shouldClaimTimelineGestureEscape("Escape", true)).toBe(true);
    expect(shouldClaimTimelineGestureEscape("Escape", false)).toBe(false);
    expect(shouldClaimTimelineGestureEscape("Enter", true)).toBe(false);
  });
});
