import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { Timeline } from "./Timeline";
import { Tooltip } from "./Tooltip";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Composa#628 — owner standing rule: "for most of the icon buttons, usually there's
// a tooltip." The timeline shipped with none at all. These assert the affordance by
// COMPONENT (not by rendered markup) because the DS `Tooltip` deliberately degrades
// to a passthrough without a document, so static markup can't see it.
function tooltipLabels(element: Parameters<typeof create>[0]): string[] {
  let renderer: ReturnType<typeof create>;
  act(() => { renderer = create(element); });
  const labels = renderer!.root.findAllByType(Tooltip).map(t => String(t.props.label));
  act(() => renderer!.unmount());
  return labels;
}

describe("Timeline icon-button tooltips (Composa#628)", () => {
  it("gives every transport and chrome icon button a hover tooltip", () => {
    const labels = tooltipLabels(
      <Timeline
        height={220}
        duration={2_000}
        onStop={() => undefined}
        onAutoKeyframeChange={() => undefined}
        onTrackListCollapsedChange={() => undefined}
        onTimelineCollapsedChange={() => undefined}
      />,
    );

    for (const expected of ["Play", "Stop", "Auto-keyframe", "Loop", "Collapse track list", "Collapse timeline", "Timeline zoom"]) {
      expect(labels).toContain(expected);
    }
  });

  it("tracks the toggled state so the tooltip never contradicts the icon", () => {
    const playing = tooltipLabels(
      <Timeline height={220} duration={2_000} playing onPlayingChange={() => undefined}
        trackListCollapsed timelineCollapsed
        onTrackListCollapsedChange={() => undefined} onTimelineCollapsedChange={() => undefined} />,
    );

    expect(playing).toContain("Pause");
    expect(playing).not.toContain("Play");
    expect(playing).toContain("Expand track list");
    expect(playing).toContain("Expand timeline");
  });

  it("labels the master-view lane header toggles and their add action", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(
      <Timeline mode="master" height={220} duration={2_000}
        blocks={[{ id: "intro", name: "Intro", range: [0, 1_000] }]}
        onLaneAdd={() => undefined} onLaneVisibilityToggle={() => undefined}
        onLaneSoloToggle={() => undefined} onLaneMuteToggle={() => undefined}
        onLaneLockToggle={() => undefined} />,
    ); });
    // Wired lane controls are live, so their tooltips must not be suppressed.
    const compositions = renderer!.root.findAllByType(Tooltip).filter(t => String(t.props.label).endsWith("Compositions"));
    expect(compositions.length).toBeGreaterThanOrEqual(5);
    expect(compositions.every(t => !t.props.disabled)).toBe(true);
    act(() => renderer!.unmount());

    const labels = tooltipLabels(
      <Timeline mode="master" height={220} duration={2_000}
        blocks={[{ id: "intro", name: "Intro", range: [0, 1_000] }]}
        onLaneAdd={() => undefined}
        onLaneVisibilityToggle={() => undefined}
        onLaneSoloToggle={() => undefined}
        onLaneMuteToggle={() => undefined}
        onLaneLockToggle={() => undefined} />,
    );

    for (const expected of ["Add to Compositions", "Hide Compositions", "Solo Compositions", "Mute Compositions", "Lock Compositions"]) {
      expect(labels).toContain(expected);
    }
  });

  it("suppresses the tooltip on a control the consumer left unwired", () => {
    // A natively-disabled <button> swallows hover, and an inert control has nothing
    // to explain — the same suppression `IconButtonRow`/`PanelActionBtn` already use.
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<Timeline height={220} duration={2_000} />); });
    const collapse = renderer!.root.findAllByType(Tooltip).filter(t => String(t.props.label).endsWith("timeline"));
    expect(collapse).toHaveLength(1);
    expect(collapse[0].props.disabled).toBe(true);
    act(() => renderer!.unmount());
  });
});
