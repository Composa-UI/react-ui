import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { laneDropAcceptedFiles, laneDropPayloadAccepted, shouldActivateTimelineTrackKey, shouldBeginTimelineMiddlePan, shouldBeginTimelinePointer, shouldClaimTimelineGestureEscape, shouldHandleTimelineReveal, stepTimelinePlayhead, timelineClipTrimDetail, timelineDurationBarProjection, timelineDurationBarTargetRange, timelineTimeAtClientX, timelineTrackExpansionForKey, timelineTrackNavigationIndex, Timeline, type Track } from "./Timeline";

const VIDEO_ACCEPT = ["image/", "video/"] as const;
const AUDIO_ACCEPT = ["audio/"] as const;

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
    expect(html).toContain('<button type="button" data-keyframe-id="keyframe-0-500"');
    expect(html).toContain('data-keyframe-id="keyframe-0-500"');
    expect(html).toContain('data-keyframe-id="keyframe-1-900"');
    expect(html).not.toContain('data-keyframe-id="opacity:aggregate-keyframe');
    expect(html).toContain("focus-visible:ring-c-focus-ring");
  });

  it("keeps decorative lane geometry click-through for empty-lane insertion", () => {
    const track: Track = { id: "hero", name: "Hero", type: "frame", props: [
      { id: "opacity", name: "Opacity", bar: [200, 1_200], keyframes: [500, 900] },
    ] };
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[track]} onPropertyAddKeyframe={() => undefined} />);
    expect(html.match(/pointer-events-none/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('data-keyframe-id="keyframe-0-500"');
  });

  it("projects controlled visibility for Animate preset bars without removing their range", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "hero",
      name: "Hero",
      type: "frame",
      props: [],
      bars: [
        { id: "fade", label: "Fade In", timeRange: [100, 500] },
        { id: "pulse", label: "Pulse", timeRange: [700, 1_200], hidden: true },
      ],
    }]} onPresetToggleHidden={() => undefined} />);
    expect(html).toContain('aria-label="Hide Fade In animation"');
    expect(html).toContain('aria-label="Show Pulse animation"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("opacity-40");
    expect(html).toContain('aria-label="Fade In animation 100ms to 500ms"');
    expect(html).toContain('aria-label="Pulse animation 700ms to 1200ms"');
  });

  it("branches every preset and property lane directly from its parent object", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "hero", name: "Hero", type: "frame", selectionState: "selected", props: [
        { id: "position", name: "Position", keyframes: [] },
        { id: "opacity", name: "Opacity", keyframes: [{ id: "opacity-0", timeMs: 500, selected: true }] },
      ], bars: [
        { id: "pulse", label: "Pulse", timeRange: [100, 700], selected: true },
      ],
    }]} onTrackExpandedChange={() => undefined} onPresetSelect={() => undefined} />);
    expect(html).toContain("data-timeline-child-trunk");
    expect(html.match(/data-timeline-child-connector="elbow"/g)).toHaveLength(3);
    expect(html).toContain('data-timeline-child-index="0" data-timeline-child-count="3"');
    expect(html).toContain('data-timeline-child-index="2" data-timeline-child-count="3"');
    expect(html.match(/data-timeline-child-connector-gap="4"/g)).toHaveLength(3);
    expect(html.match(/left:28px;width:16px/g)).toHaveLength(3);
    expect(html).toContain('data-composa-row-highlight="timeline-full-lane"');
    expect(html).toContain('data-timeline-preset-bar="pulse"');
    expect(html).toContain('data-keyframe-id="opacity-0"');
  });

  it("keeps preset-only disclosure semantics unchanged while respecting controlled collapse", () => {
    const expanded = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "hero", name: "Hero", type: "frame", expanded: true, props: [], bars: [
        { id: "pulse", label: "A deliberately long animation preset name", timeRange: [100, 700] },
      ],
    }]} onTrackExpandedChange={() => undefined} />);
    const collapsed = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "hero", name: "Hero", type: "frame", expanded: false, props: [], bars: [
        { id: "pulse", label: "A deliberately long animation preset name", timeRange: [100, 700] },
      ],
    }]} onTrackExpandedChange={() => undefined} />);
    expect(expanded).toContain('data-timeline-child-connector="elbow"');
    expect(expanded).toContain("truncate");
    expect(expanded).not.toContain('aria-label="Collapse Hero"');
    expect(expanded).not.toContain('aria-expanded="true"');
    expect(collapsed).not.toContain('aria-label="Expand Hero"');
    expect(collapsed).not.toContain('aria-expanded="false"');
    expect(collapsed).not.toContain("data-timeline-child-trunk");
    expect(collapsed).not.toContain("data-timeline-child-connector");
    expect(collapsed).not.toContain("A deliberately long animation preset name");
  });

  it("lets an editable neutral bar select-and-move while reserving trim handles for the selected bar", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "hero", name: "Hero", type: "frame", props: [], bars: [
        { id: "fade", label: "Fade In", timeRange: [100, 500] },
        { id: "rotate", label: "Rotate", timeRange: [700, 1_200], selected: true },
      ],
    }]} onPresetSelect={() => undefined} onPresetBarChange={() => undefined} onPresetToggleHidden={() => undefined} />);
    expect(html).toContain('data-timeline-preset-bar="fade"');
    expect(html).toContain('data-preset-bar-state="neutral"');
    expect(html).toContain('aria-label="Move Fade In animation"');
    expect(html).not.toContain('aria-label="Trim Fade In animation from start"');
    expect(html).toContain('data-timeline-preset-bar="rotate"');
    expect(html).toContain('data-preset-bar-state="selected"');
    expect(html).toContain('border-c-border-selected-strong bg-c-bg-brand');
    expect(html).toContain('aria-label="Move Rotate animation"');
    expect(html).toContain('aria-label="Trim Rotate animation from start"');
    expect(html).toContain('aria-label="Trim Rotate animation from end"');
  });

  it("keeps selected locked Animate bars visible and selectable without mutation affordances", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "locked", name: "Locked", type: "frame", props: [], bars: [
        { id: "pulse", label: "Pulse", timeRange: [100, 500], selected: true, editable: false },
      ],
    }]} onPresetSelect={() => undefined} onPresetBarChange={() => undefined} />);
    expect(html).toContain('data-timeline-preset-bar="pulse"');
    expect(html).toContain('aria-label="Select Pulse animation"');
    expect(html).not.toContain('aria-label="Move Pulse animation"');
    expect(html).not.toContain('aria-label="Trim Pulse animation from start"');
    expect(html).not.toContain('aria-label="Trim Pulse animation from end"');
    expect(html).not.toContain('aria-label="Hide Pulse animation"');
  });

  it("renders disclosures without enabling aggregate product behavior when callbacks are absent", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]} />);
    expect(html).not.toContain('aria-label="Add keyframe"');
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

  it("shares canonical layer icons and exposes controlled multiselection", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[
      { id: "stack", name: "Stack", type: "frame", autoLayoutMode: "vertical", autoLayoutAlign: "center", selected: true, props: [] },
      { id: "shape", name: "Shape", type: "shape", props: [] },
    ]} onTrackSelect={() => undefined} />);
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-multiselectable="true"');
    expect(html).toContain('role="option" aria-selected="true"');
    expect(html).toContain('role="option" aria-selected="true" tabindex="0"');
    expect(html).toContain('role="option" aria-selected="false" tabindex="-1"');
    expect(html).toContain('data-layer-icon-type="frame"');
    expect(html).toContain('data-auto-layout-mode="vertical"');
    expect(html).toContain('data-icon-semantic="auto-layout-vertical-center"');
    // Alignment reaches the element row too, so Layers and the timeline cannot draw
    // two different glyphs for the same frame (Composa#661).
    expect(html).toContain('data-auto-layout-align="center"');
    expect(html).not.toMatch(/grid/i);
  });

  it("projects controlled selection states across the complete label and time lane", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[
      { id: "parent", name: "Parent", type: "frame", selectionState: "selected", props: [] },
      { id: "child", name: "Child", type: "shape", depth: 1, selectionState: "descendant", props: [] },
      { id: "peer", name: "Peer", type: "text", props: [] },
    ]} onTrackSelect={() => undefined} />);
    expect(html).toContain('data-composa-row-state="selected"');
    expect(html).toContain('data-composa-row-state="descendant"');
    expect(html.match(/data-composa-row-highlight="timeline-full-lane"/g)).toHaveLength(3);
    expect(html).toContain("bg-c-bg-selected/50 group-hover/selection-row:bg-c-bg-selected");
    expect(html).toContain('role="option" aria-selected="true" tabindex="0"');
    expect(html).toContain('role="option" aria-selected="false" tabindex="-1"');
  });

  it("exposes stable parent duration semantics and selected/neutral visual states", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={6_000} viewport={{ startMs: 1_000, endMs: 5_000 }} tracks={[
      { id: "selected", name: "Selected layer", type: "frame", bar: [1_500, 4_000], selectionState: "selected", props: [] },
      { id: "neutral", name: "Neutral layer", type: "text", bar: [2_000, 4_500], props: [] },
    ]} />);
    expect(html).toContain('role="img" aria-label="Selected layer duration 1500ms to 4000ms"');
    expect(html).toContain('data-timeline-duration-bar="selected"');
    expect(html).toContain('data-duration-start-ms="1500"');
    expect(html).toContain('data-duration-end-ms="4000"');
    expect(html).toContain('data-duration-bar-state="selected"');
    expect(html).toContain("border-c-border-selected-strong bg-c-bg-brand");
    expect(html).toContain('data-duration-bar-state="neutral"');
    expect(html).toContain("border-c-text-secondary bg-c-bg-secondary");
  });

  it("clips parent duration bars to the viewport and omits fully hidden or invalid ranges", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={8_000} viewport={{ startMs: 2_000, endMs: 6_000 }} tracks={[
      { id: "clipped-start", name: "Clipped start", type: "frame", bar: [500, 3_000], props: [] },
      { id: "clipped-end", name: "Clipped end", type: "frame", bar: [5_000, 7_500], props: [] },
      { id: "hidden", name: "Hidden", type: "frame", bar: [500, 1_500], props: [] },
      { id: "invalid", name: "Invalid", type: "frame", bar: [4_000, 4_000], props: [] },
    ]} />);
    expect(html).toContain('data-timeline-duration-bar="clipped-start"');
    expect(html).toContain('data-visible-start-ms="2000" data-visible-end-ms="3000" data-clipped-start="true" data-clipped-end="false"');
    expect(html).toContain('data-timeline-duration-bar="clipped-end"');
    expect(html).toContain('data-visible-start-ms="5000" data-visible-end-ms="6000" data-clipped-start="false" data-clipped-end="true"');
    expect(html).not.toContain('data-timeline-duration-bar="hidden"');
    expect(html).not.toContain('data-timeline-duration-bar="invalid"');
  });

  it("exposes independently operable move and scale targets only for host-authorized duration bars", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={6_000} tracks={[
      { id: "editable", name: "Editable", type: "frame", bar: [1_000, 4_000], props: [] },
      { id: "locked", name: "Locked", type: "frame", bar: [1_500, 4_500], durationBarEditable: false, props: [] },
    ]} onDurationBarChange={() => undefined} />);
    expect(html).toContain('role="group" aria-label="Editable duration 1000ms to 4000ms"');
    expect(html).toContain('aria-label="Move Editable duration"');
    expect(html).toContain('data-duration-bar-action="move"');
    expect(html).toContain('aria-label="Scale Editable duration from start"');
    expect(html).toContain('data-duration-bar-action="trim-start"');
    expect(html).toContain('aria-label="Scale Editable duration from end"');
    expect(html).toContain('data-duration-bar-action="trim-end"');
    expect(html).toContain('role="img" aria-label="Locked duration 1500ms to 4500ms"');
    expect(html).not.toContain('aria-label="Move Locked duration"');
  });

  it("does not expose a scale handle for an authored edge outside the viewport", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={8_000} viewport={{ startMs: 2_000, endMs: 6_000 }} tracks={[
      { id: "clipped-start", name: "Clipped start", type: "frame", bar: [500, 3_000], props: [] },
      { id: "clipped-end", name: "Clipped end", type: "frame", bar: [5_000, 7_500], props: [] },
    ]} onDurationBarChange={() => undefined} />);
    expect(html).not.toContain('aria-label="Scale Clipped start duration from start"');
    expect(html).toContain('aria-label="Scale Clipped start duration from end"');
    expect(html).toContain('aria-label="Scale Clipped end duration from start"');
    expect(html).not.toContain('aria-label="Scale Clipped end duration from end"');
  });

  it("does not let a nested disclosure key activate its selectable row", () => {
    expect(shouldActivateTimelineTrackKey("Enter", false)).toBe(false);
    expect(shouldActivateTimelineTrackKey(" ", false)).toBe(false);
    expect(shouldActivateTimelineTrackKey("Enter", true)).toBe(true);
    expect(shouldActivateTimelineTrackKey("ArrowDown", true)).toBe(false);
  });

  it("claims listbox navigation at both boundaries", () => {
    expect(timelineTrackNavigationIndex(0, 2, "ArrowUp")).toBe(0);
    expect(timelineTrackNavigationIndex(1, 2, "ArrowDown")).toBe(1);
    expect(timelineTrackNavigationIndex(0, 1, "Home")).toBe(0);
    expect(timelineTrackNavigationIndex(0, 1, "End")).toBe(0);
    expect(timelineTrackNavigationIndex(0, 1, "Enter")).toBeNull();
  });

  it("keeps disclosure outside the option and owns expansion on the row", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]}
      onTrackSelect={() => undefined} onTrackExpandedChange={() => undefined} />);
    expect(html.indexOf('aria-label="Collapse Hero"')).toBeLessThan(html.indexOf('role="option"'));
    expect(html).toContain('role="option" aria-selected="false" aria-expanded="true"');
    expect(timelineTrackExpansionForKey("ArrowRight")).toBe(true);
    expect(timelineTrackExpansionForKey("ArrowLeft")).toBe(false);
    expect(timelineTrackExpansionForKey("Enter")).toBeNull();
  });

  it("does not advertise expansion without an expansion callback", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]} onTrackSelect={() => undefined} />);
    expect(html).not.toContain('role="option" aria-selected="false" aria-expanded=');
  });

  it("exposes a focusable Playhead with the active keyboard map", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]} onAddKeyframe={() => undefined} onDeleteSelectedKeyframes={() => undefined} />);
    expect(html).toContain('role="slider" tabindex="0" aria-label="Playhead"');
    expect(html).toContain('aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End Space K Delete Backspace"');
    expect(html).not.toContain('aria-label="Add keyframe"');
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

  it("keeps property lanes non-insertable when a legacy host add callback is supplied", () => {
    const inert = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]} />);
    const interactive = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[numericTrack]} onPropertyAddKeyframe={() => undefined} />);
    expect(inert).not.toContain("cursor-crosshair");
    expect(interactive).toContain('data-timeline-property-lane="hero:opacity"');
    expect(interactive).not.toContain("cursor-crosshair");
  });

  it("renders one accessible easing indicator per authored keyframe pair", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={4_000} tracks={[{
      id: "hero",
      name: "Hero",
      type: "frame",
      props: [{
        id: "opacity",
        name: "Opacity",
        keyframes: [
          { id: "start", timeMs: 500, easing: "linear", easingSelected: true },
          { id: "middle", timeMs: 1_500, easing: "ease-in" },
          { id: "custom", timeMs: 2_500, easing: "custom" },
          { id: "end", timeMs: 3_500, easing: "ease-out" },
        ],
      }],
    }]} onEasingSegmentSelect={() => undefined} onEasingPresetChange={() => undefined} />);
    expect(html.match(/data-easing-segment=/g)).toHaveLength(3);
    expect(html).toContain('data-easing-segment="hero:opacity:start"');
    expect(html).toContain('data-easing-preset="linear"');
    expect(html).toContain('aria-label="Opacity Linear easing from 500ms to 1500ms"');
    expect(html).toContain('aria-pressed="true"');
    const startingMarker = html.match(/<button type="button" data-keyframe-id="start"[^>]*>/)?.[0];
    expect(startingMarker).toContain('aria-label="Opacity keyframe at 500ms"');
    expect(startingMarker).not.toContain("aria-pressed");
    expect(html).toContain('data-easing-preset="ease-in"');
    expect(html).toContain('data-easing-preset="custom"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-keyshortcuts="Enter Shift+Enter"');
    expect(html).toContain('w-[28px]');
    expect(html).toContain('style="left:26.5%"');
    expect(startingMarker).toContain('z-[2]');
    expect(html).not.toContain('data-easing-segment="hero:opacity:end"');
  });

  it("keeps easing indicators presentational when the host supplies no editing callbacks", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "hero", name: "Hero", type: "frame", props: [{
        id: "x", name: "Position X", keyframes: [
          { id: "start", timeMs: 0, easing: "ease-out" },
          { id: "end", timeMs: 1_000, easing: "linear" },
        ],
      }],
    }]} />);
    expect(html).toContain('role="img" data-easing-segment="hero:x:start"');
    expect(html).not.toContain('aria-haspopup="menu"');
  });

  it("keeps locked easing segments selectable without exposing an inert preset menu", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "locked", name: "Locked", type: "frame", props: [{
        id: "x", name: "Position X", keyframes: [
          { id: "start", timeMs: 0, easing: "ease-out", easingEditable: false },
          { id: "end", timeMs: 1_000, easing: "linear", easingEditable: false },
        ],
      }],
    }]} onEasingSegmentSelect={() => undefined} onEasingPresetChange={() => undefined} />);
    expect(html).toContain('<button type="button" data-easing-segment="locked:x:start"');
    expect(html).not.toContain('aria-haspopup="menu"');
    expect(html).not.toContain('aria-keyshortcuts="Enter Shift+Enter"');
  });

  // Playhead full-lanes-height contract (owner bug: the line came up short whenever the
  // lanes overflowed the scroll viewport — master view + under scroll — and in the empty
  // null state). jsdom has no layout engine, so we assert the structural invariant that
  // *produces* a full-height line: the playhead wrapper spans `top-0 bottom-0` and resolves
  // against the scroll CONTENT (the full lanes region, `min-h-full`), which must therefore
  // carry `relative` so it — not the shorter scroll viewport — is the positioning context.
  const playheadContract = (html: string) => {
    // The scroll content that holds the lanes is the positioning context (relative).
    const contentIdx = html.indexOf('data-composa-scroll-content');
    expect(contentIdx).toBeGreaterThan(-1);
    const contentTag = html.slice(html.lastIndexOf("<div", contentIdx), contentIdx + 200);
    expect(contentTag).toContain("min-h-full");
    expect(contentTag).toContain("relative");
    // The playhead line spans the full height of that content, and lives inside it.
    const wrapperIdx = html.indexOf("absolute top-0 bottom-0 z-20 overflow-hidden pointer-events-none");
    expect(wrapperIdx).toBeGreaterThan(contentIdx);
    expect(html).toContain('class="absolute top-0 bottom-0 w-px"');
  };

  it("spans the playhead across the full lanes region in master view (survives vertical overflow)", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={2_000}
      blocks={[{ id: "intro", name: "Intro", range: [0, 1_000] }]} />);
    playheadContract(html);
  });

  it("spans the playhead across the full lanes region in the empty/null slide-local state", () => {
    const html = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[]} />);
    playheadContract(html);
  });
});

describe("Timeline empty-lane time mapping", () => {
  it("maps and clamps client positions through the shared viewport", () => {
    const viewport = { startMs: 2_000, endMs: 6_000 };
    expect(timelineTimeAtClientX(100, 100, 400, viewport)).toBe(2_000);
    expect(timelineTimeAtClientX(304, 100, 400, viewport)).toBe(4_000);
    expect(timelineTimeAtClientX(900, 100, 400, viewport)).toBe(6_000);
  });
});

describe("Timeline parent duration projection", () => {
  it("preserves authored bounds while projecting visible geometry", () => {
    expect(timelineDurationBarProjection([500, 7_000], { startMs: 2_000, endMs: 6_000 })).toEqual({
      authoredStartMs: 500,
      authoredEndMs: 7_000,
      visibleStartMs: 2_000,
      visibleEndMs: 6_000,
      clippedStart: true,
      clippedEnd: true,
      leftPercent: 2,
      widthPercent: 98,
    });
  });

  it("returns no presentation for offscreen, reversed, or zero-length ranges", () => {
    const viewport = { startMs: 2_000, endMs: 6_000 };
    expect(timelineDurationBarProjection([0, 1_000], viewport)).toBeNull();
    expect(timelineDurationBarProjection([7_000, 8_000], viewport)).toBeNull();
    expect(timelineDurationBarProjection([4_000, 4_000], viewport)).toBeNull();
    expect(timelineDurationBarProjection([5_000, 4_000], viewport)).toBeNull();
  });
});

describe("Timeline parent duration editing", () => {
  it("moves the complete authored range and clamps it at timeline bounds", () => {
    expect(timelineDurationBarTargetRange([500, 2_500], "move", 500, 4_000)).toEqual([1_000, 3_000]);
    expect(timelineDurationBarTargetRange([500, 2_500], "move", -1_000, 4_000)).toEqual([0, 2_000]);
    expect(timelineDurationBarTargetRange([500, 2_500], "move", 5_000, 4_000)).toEqual([2_000, 4_000]);
  });

  it("scales either authored edge around the opposite fixed edge", () => {
    expect(timelineDurationBarTargetRange([500, 2_500], "trim-start", -1_000, 4_000)).toEqual([0, 2_500]);
    expect(timelineDurationBarTargetRange([500, 2_500], "trim-start", 5_000, 4_000)).toEqual([2_499, 2_500]);
    expect(timelineDurationBarTargetRange([500, 2_500], "trim-end", 3_000, 4_000)).toEqual([500, 4_000]);
    expect(timelineDurationBarTargetRange([500, 2_500], "trim-end", -3_000, 4_000)).toEqual([500, 501]);
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

  it("reserves middle-button navigation for ruler and time-lane surfaces", () => {
    expect(shouldBeginTimelineMiddlePan(1, true, true)).toBe(true);
    expect(shouldBeginTimelineMiddlePan(0, true, true)).toBe(false);
    expect(shouldBeginTimelineMiddlePan(1, false, true)).toBe(false);
    expect(shouldBeginTimelineMiddlePan(1, true, false)).toBe(false);
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

describe("Timeline master seams", () => {
  it("renders the master audio lane and the white-thumb blue-fill zoom contract", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      viewport={{ startMs: 2_000, endMs: 12_000 }} />);
    expect(html).toContain(">Audio</span>");
    // Audio lane is now a real, empty track (no longer a disabled "coming soon" seam).
    expect(html).toContain('aria-label="Audio track (empty)"');
    expect(html).not.toContain('aria-label="Audio track (coming soon)"');
    expect(html).toContain("data-timeline-zoom-track");
    expect(html).toContain("data-timeline-zoom-fill");
    expect(html).toContain("bg-c-bg-brand");
    expect(html).toContain("bg-white");
    expect(html).toContain('data-timeline-zoom-track-height="2"');
    expect(html).toContain('data-timeline-zoom-track-radius="1"');
    expect(html).toContain("h-[2px] rounded-[1px]");
    expect(html).toContain("[&amp;::-webkit-slider-runnable-track]:h-[2px]");
    expect(html).toContain("[&amp;::-webkit-slider-runnable-track]:rounded-[1px]");
    expect(html).toContain("[&amp;::-webkit-slider-thumb]:-mt-[5px]");
  });

  it("renders audio clips on the Audio lane with a waveform and selected state", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      audioClips={[
        { id: "audio-1", name: "voiceover", range: [1_000, 6_000], selected: true },
        { id: "audio-2", name: "music", range: [7_000, 12_000] },
      ]} />);
    expect(html).toContain('aria-label="Audio track"');
    expect(html).toContain('aria-label="voiceover"');
    expect(html).toContain('aria-label="music"');
    // selected clip carries the strong selection border; waveform bars render.
    expect(html).toContain("border-c-border-selected-strong");
    expect(html).toContain('aria-label="Trim start of voiceover"');
    expect(html).toContain('aria-label="Trim end of music"');
    // The clip bar fills the full track-row height (inset 4px), not the old
    // centred 20px block.
    expect(html).toContain("absolute inset-y-[4px] rounded-[4px]");
    expect(html).not.toContain("top-1/2 -translate-y-1/2 h-[20px] rounded-[4px] flex items-center px-[10px] overflow-hidden border bg-c-bg-secondary");
  });

  it("advertises a context-menu affordance on audio clips when a handler is wired", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      audioClips={[{ id: "audio-1", name: "voiceover", range: [1_000, 6_000] }]}
      onAudioClipContextMenu={() => undefined} />);
    expect(html).toContain('aria-label="voiceover"');
    expect(html).toContain('aria-haspopup="menu"');
  });

  it("does not advertise a context-menu affordance on audio clips without a handler", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      audioClips={[{ id: "audio-1", name: "voiceover", range: [1_000, 6_000] }]} />);
    expect(html).toContain('aria-label="voiceover"');
    expect(html).not.toContain('aria-haspopup="menu"');
  });

  it("stacks the audio clip name above its waveform (vertical, not side-by-side)", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      audioClips={[{ id: "audio-1", name: "voiceover", range: [1_000, 6_000] }]} />);
    // The audio clip block is a vertical column, not a horizontal `items-center` row.
    expect(html).toContain("rounded-[4px] flex flex-col justify-center gap-[2px] px-[8px] py-[5px]");
    // The name renders ABOVE the waveform: the name span precedes the waveform
    // wrapper in source order within the clip.
    const nameIndex = html.indexOf(">voiceover</span>");
    const waveformIndex = html.indexOf("relative flex-1 min-h-0 w-full");
    expect(nameIndex).toBeGreaterThan(-1);
    expect(waveformIndex).toBeGreaterThan(-1);
    expect(nameIndex).toBeLessThan(waveformIndex);
  });

  it("delineates each master lane row with a horizontal divider (header + track)", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000} />);
    // Each of the three lane rows (Compositions / Video / Audio) carries a
    // bottom divider spanning the header column and the track area.
    expect(html.match(/class="flex border-b border-c-border"/g)?.length).toBe(3);
  });

  it("renders the Figma lane header anatomy — [icon][label][+] + [vis][solo][mute][lock]", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      onLaneAdd={() => undefined} onLaneVisibilityToggle={() => undefined}
      onLaneSoloToggle={() => undefined} onLaneMuteToggle={() => undefined} onLaneLockToggle={() => undefined} />);
    // Figma-refreshed labels (Compositions / Video / Audio), sentence case. The
    // top compositions lane is "Compositions" (owner: not "Slides").
    expect(html).toContain(">Compositions</span>");
    expect(html).toContain(">Video</span>");
    expect(html).toContain(">Audio</span>");
    // The compositions lane uses the layers glyph, not the pen-tool.
    expect(html).toContain("lucide-layers");
    expect(html).not.toContain("lucide-pen-tool");
    // The Video lane uses the square-play glyph (not the clapperboard).
    expect(html).toContain("lucide-square-play");
    expect(html).not.toContain("lucide-clapperboard");
    // `+` add affordance per lane.
    expect(html).toContain('aria-label="Add to Compositions"');
    expect(html).toContain('aria-label="Add to Video"');
    expect(html).toContain('aria-label="Add to Audio"');
    // Four-control row per lane (resting labels: Hide / Solo / Mute / Lock).
    expect(html).toContain('aria-label="Hide Compositions"');
    expect(html).toContain('aria-label="Solo Video"');
    expect(html).toContain('aria-label="Mute Audio"');
    expect(html).toContain('aria-label="Lock Compositions"');
    // The four toggles are grouped icon buttons built on the SAME DS primitive as
    // the Design-tab alignment control (IconButtonRow), NOT a SegmentedControl.
    expect(html).toContain("data-composa-icon-button-row");
    expect(html).not.toContain("data-composa-segmented-surface");
    // The control group hugs its content (no `fill` → not full-width).
    expect(html).not.toMatch(/data-composa-icon-button-row[^>]*w-full/);
    // Wired controls advertise their pressed state (resting = false).
    expect(html).toContain('aria-pressed="false"');
  });

  it("renders lane header controls disabled when the host wires no handlers", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000} />);
    // Affordances stay visible so the anatomy reads, but are disabled + un-pressed.
    expect(html).toContain('aria-label="Add to Compositions"');
    expect(html).toContain('aria-label="Hide Video"');
    expect(html).toMatch(/aria-label="Add to Compositions"[^>]*disabled/);
    // Unwired toggles render disabled (order-independent: the segmented item emits
    // `disabled` ahead of the spread aria-label).
    expect(html).toMatch(/aria-label="Lock Audio"[^>]*disabled|disabled[^>]*aria-label="Lock Audio"/);
  });

  it("reflects per-lane control state and engaged labels from laneControls", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      laneControls={{ video: { visible: false, muted: true, locked: true, solo: true } }}
      onLaneVisibilityToggle={() => undefined} onLaneMuteToggle={() => undefined}
      onLaneLockToggle={() => undefined} onLaneSoloToggle={() => undefined} />);
    // Hidden lane flips the eye affordance to "Show" and marks it pressed.
    expect(html).toContain('aria-label="Show Video"');
    expect(html).toContain('aria-label="Unmute Video"');
    expect(html).toContain('aria-label="Unlock Video"');
    expect(html).toContain('aria-label="Unsolo Video"');
    // Engaged controls advertise aria-pressed="true".
    expect(html).toContain('aria-pressed="true"');
    // Untouched lanes keep resting labels.
    expect(html).toContain('aria-label="Hide Compositions"');
  });
});

describe("Timeline master ruler units", () => {
  it("labels the master ruler in seconds while zoomed in", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      viewport={{ startMs: 0, endMs: 20_000 }} />);
    expect(html).toContain(">0s</span>");
    expect(html).not.toContain(">0:00</span>");
  });

  it("switches the master ruler to m:ss when zoomed far out", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={200_000}
      viewport={{ startMs: 0, endMs: 180_000 }} />);
    expect(html).toContain(">0:00</span>");
    expect(html).not.toContain(">0s</span>");
  });
});

describe("Timeline horizontal time scrollbar", () => {
  it("renders a draggable horizontal viewport scrollbar", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      viewport={{ startMs: 4_000, endMs: 8_000 }} />);
    expect(html).toContain("data-timeline-time-scrollbar");
    expect(html).toContain('role="scrollbar"');
    expect(html).toContain('aria-orientation="horizontal"');
    expect(html).toContain('aria-label="Scroll timeline horizontally"');
  });
});

describe("Timeline shared scrollbar anatomy", () => {
  it("uses the shared overlay ScrollArea instead of a visible native scrollbar", () => {
    const html = renderToStaticMarkup(<Timeline height={120} duration={2_000} tracks={[numericTrack, numericTrack]} />);

    expect(html).toContain("relative flex-1 min-h-0");
    expect(html).toContain("[scrollbar-width:none]");
    expect(html).toContain("[&amp;::-webkit-scrollbar]:hidden");
    expect(html).not.toContain("flex-1 overflow-y-auto relative");
  });

  it("marks the ruler and time lanes as pan surfaces while leaving row labels outside", () => {
    const html = renderToStaticMarkup(<Timeline height={120} duration={2_000} tracks={[numericTrack]} />);
    expect(html.match(/data-timeline-pan-surface/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain("data-composa-scroll-viewport");
    expect(html).not.toMatch(/data-timeline-pan-surface[^>]*>[^<]*Hero/);
  });
});

describe("master lane file-drop typing (Phase 3)", () => {
  it("highlights a lane only when a file item matches its accepted MIME prefixes", () => {
    // Video lane accepts image/video; audio does not light it up (and vice-versa).
    expect(laneDropPayloadAccepted(VIDEO_ACCEPT, ["video/mp4"], true)).toBe(true);
    expect(laneDropPayloadAccepted(VIDEO_ACCEPT, ["image/png"], true)).toBe(true);
    expect(laneDropPayloadAccepted(VIDEO_ACCEPT, ["audio/mpeg"], true)).toBe(false);
    expect(laneDropPayloadAccepted(AUDIO_ACCEPT, ["audio/wav"], true)).toBe(true);
    expect(laneDropPayloadAccepted(AUDIO_ACCEPT, ["video/mp4"], true)).toBe(false);
  });

  it("falls back to the file-payload signal when per-item MIME is withheld mid-drag", () => {
    expect(laneDropPayloadAccepted(AUDIO_ACCEPT, [], true)).toBe(true);
    expect(laneDropPayloadAccepted(AUDIO_ACCEPT, [], false)).toBe(false);
    // An empty item type (browser withholding) is treated as a candidate to highlight.
    expect(laneDropPayloadAccepted(VIDEO_ACCEPT, [""], true)).toBe(true);
  });

  it("hands the host only the files a lane accepts, keeping empty-type files for extension resolution", () => {
    const files = [{ type: "audio/mpeg" }, { type: "video/mp4" }, { type: "image/png" }, { type: "" }];
    expect(laneDropAcceptedFiles(AUDIO_ACCEPT, files)).toEqual([{ type: "audio/mpeg" }, { type: "" }]);
    expect(laneDropAcceptedFiles(VIDEO_ACCEPT, files)).toEqual([{ type: "video/mp4" }, { type: "image/png" }, { type: "" }]);
  });

  it("wires a typed file-drop target onto both media lanes when the host supplies onLaneDropFiles", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={2_000} onLaneDropFiles={() => undefined} />);
    // Both media lane bodies remain pan surfaces; the drop overlay is drag-state only,
    // so it is absent at rest — the resting markup must not leak a highlight.
    expect(html).not.toContain("data-lane-drop-active");
    expect(html).toContain("Base video track");
    expect(html).toContain("Audio track");
  });
});

// Composa#583 — composition blocks and video/audio clips get the same blue hover
// highlight (and a managed focus ring instead of the raw UA outline, Composa#584).
describe("Timeline bar hover + focus (Composa#583 / #584)", () => {
  const master = (extra = {}) => renderToStaticMarkup(<Timeline mode="master" height={220} duration={4_000}
    blocks={[{ id: "intro", name: "Intro", range: [0, 1_000] }]}
    baseClips={[{ id: "v1", name: "Clip", range: [0, 1_000] }]}
    audioClips={[{ id: "a1", name: "Track", range: [0, 1_000] }]}
    {...extra} />);

  it("gives composition blocks a blue hover highlight and a managed focus ring", () => {
    const html = master();
    // The Intro composition bar carries the hover border + outline-none focus ring.
    expect(html).toContain("hover:border-c-border-selected");
    expect(html).toContain("focus-visible:ring-c-focus-ring");
  });

  it("applies the hover highlight to every master clip type (comp/video/audio)", () => {
    const html = master();
    // Three lane bars (comp, video base clip, audio clip) each pick up the hover border.
    expect(html.match(/hover:border-c-border-selected/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("makes the whole timeline non-text-selectable (chrome + headers + labels)", () => {
    expect(master()).toContain("select-none");
  });
});

// Composa#582 — the timeline collapse control is a controlled toggle.
describe("Timeline collapse controls (Composa#582)", () => {
  it("renders the collapse button disabled when the host wires no handler", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={2_000} />);
    expect(html).toContain('aria-label="Collapse timeline"');
    // Inert without handlers — disabled, not silently no-op.
    expect(html).toMatch(/aria-label="Collapse timeline"[^>]*disabled/);
  });

  it("reflects the collapsed state and hides the lanes body when timelineCollapsed", () => {
    const open = renderToStaticMarkup(<Timeline mode="master" height={220} duration={2_000}
      blocks={[{ id: "intro", name: "Intro", range: [0, 1_000] }]} onTimelineCollapsedChange={() => undefined} />);
    expect(open).toContain('aria-label="Collapse timeline"');
    expect(open).toContain('aria-label="Intro"');

    const collapsed = renderToStaticMarkup(<Timeline mode="master" height={220} duration={2_000}
      blocks={[{ id: "intro", name: "Intro", range: [0, 1_000] }]} timelineCollapsed onTimelineCollapsedChange={() => undefined} />);
    // Header stays (with an Expand affordance); the body/lanes are gone.
    expect(collapsed).toContain('aria-label="Expand timeline"');
    expect(collapsed).toContain('aria-pressed="true"');
    expect(collapsed).not.toContain('aria-label="Intro"');
  });

  // Composa#661 — the owner does not want the track header collapsible, so the
  // control (and the whole collapsed-track-list mode behind it) is gone rather than
  // left disabled: a disabled button still promises the feature exists.
  it("offers no track-list collapse control, and always renders the lane headers", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={2_000} />);
    // Guard first: if the master chrome failed to render at all, the absences below
    // would pass for the wrong reason.
    expect(html).toContain('aria-label="Playhead"');
    expect(html).toContain("Compositions");
    expect(html).toContain("Video");
    expect(html).toContain("Audio");
    expect(html).not.toContain("Collapse track list");
    expect(html).not.toContain("Expand track list");
  });
});

// ── Composa#661 ────────────────────────────────────────────────────────────────
// Feedback on the master timeline. Every assertion below is scoped to the element
// under test (found by aria-label or a data hook); matching the whole rendered tree
// passes vacuously here, because the timeline chrome already contains most of these
// tokens no matter what the lanes do.

/** The opening tag of the element carrying this aria-label. */
function tagWithLabel(html: string, label: string): string {
  const tag = new RegExp(`<[a-z]+[^>]*aria-label="${label}"[^>]*>`).exec(html)?.[0];
  if (!tag) throw new Error(`no element labelled "${label}" in the markup`);
  return tag;
}
const master = (extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(<Timeline mode="master" height={320} duration={4_000} {...extra} />);

describe("master track header aligns with the transport above it (Composa#661)", () => {
  // The owner reads the GLYPHS, not the hit boxes: the play triangle sits half a
  // gutter inside its 24px button, so a header padded to the transport row's own 8px
  // put the lane icon 4px to its left. This derives the expected inset from the
  // transport's OWN rendered numbers, so nudging the transport without moving the
  // header fails here instead of drifting silently.
  const html = master();

  it("insets the lane header by the transport's play-glyph offset", () => {
    const playButton = tagWithLabel(html, "Play");
    const box = Number(/width:\s*(\d+)px/.exec(playButton)?.[1]);
    const glyph = Number(/<svg[^>]*width="(\d+)"/.exec(html.slice(html.indexOf(playButton)))?.[1]);
    // The transport row's own horizontal inset, read off the element that wraps it.
    const rowIdx = html.indexOf(playButton);
    const rowTag = html.slice(html.lastIndexOf("<div", html.lastIndexOf("<div", rowIdx) - 1), rowIdx);
    const rowPad = Number(/padding-left:\s*(\d+)px/.exec(rowTag)?.[1]);
    expect(box).toBe(24);
    expect(glyph).toBe(16);
    expect(rowPad).toBe(8);

    const header = /<div[^>]*data-timeline-lane-header="Compositions"[^>]*>/.exec(html)?.[0];
    expect(header).toBeDefined();
    const headerPad = Number(/padding-left:\s*(\d+)px/.exec(header!)?.[1]);
    expect(headerPad).toBe(rowPad + (box - glyph) / 2);
  });
});

describe("time plot reserves the zoom/collapse gutter (Composa#661)", () => {
  // 154px = the header's right cluster (91px zoom track + 8px gap + 24px collapse
  // button + 2x12px padding + 1px border = 148) plus half the 12px playhead handle,
  // which is centred on the time position and so overhangs it. Time used to map
  // across the FULL row width, so at maximum zoom-out the handle (z-20) drew over
  // that cluster (z-10). Every plot row now stops short of it, like a scrollbar track.
  const GUTTER = 154;
  const html = master({ audioClips: [{ id: "a1", name: "vo", range: [0, 1_000] }] });

  it("insets the ruler row, every lane row and the time scrollbar by the same gutter", () => {
    // Guard: the master chrome rendered, so counting below is not counting zero.
    expect(html).toContain('aria-label="Playhead"');
    // ruler/transport header + Compositions + Video + Audio + scrollbar = 5 rows.
    expect(html.match(new RegExp(`padding-right:\\s*${GUTTER}px`, "g"))?.length).toBe(5);
  });

  it("insets the body playhead overlay by the same gutter", () => {
    const wrapperIdx = html.indexOf("absolute top-0 bottom-0 z-20 overflow-hidden pointer-events-none");
    expect(wrapperIdx).toBeGreaterThan(-1);
    const wrapper = html.slice(html.lastIndexOf("<div", wrapperIdx), html.indexOf(">", wrapperIdx) + 1);
    expect(wrapper).toContain(`right:${GUTTER}px`);
  });
});

describe("video clips carry an audio strip (Composa#661)", () => {
  it("draws the Audio lane's waveform inside the bar when peaks are supplied", () => {
    const html = master({ baseClips: [{ id: "v1", name: "shot", range: [0, 1_000], waveform: [0.2, 0.9, 0.4] }] });
    expect(() => tagWithLabel(html, "shot")).not.toThrow();
    expect(html).toContain("data-timeline-clip-waveform");
  });

  it("draws nothing when the clip has no peaks, rather than inventing them", () => {
    // No audioClips here, so a waveform anywhere in this markup could only be the
    // video lane's. The bar itself must still render, or the absence proves nothing.
    const html = master({ baseClips: [{ id: "v1", name: "shot", range: [0, 1_000] }] });
    expect(() => tagWithLabel(html, "shot")).not.toThrow();
    expect(html).not.toContain("data-timeline-clip-waveform");
  });
});

describe("a muted lane dims its bars (Composa#661)", () => {
  // Muting from the lane header used to be invisible below the header: `muted` was
  // read only by the speaker icon and never reached the bars.
  const bars: [string, string, Record<string, unknown>][] = [
    ["slides", "Intro", { blocks: [{ id: "s1", name: "Intro", range: [0, 1_000] }] }],
    ["video", "shot", { baseClips: [{ id: "v1", name: "shot", range: [0, 1_000] }] }],
    ["audio", "vo", { audioClips: [{ id: "a1", name: "vo", range: [0, 1_000] }] }],
  ];

  describe.each(bars)("%s lane", (lane, label, props) => {
    it("dims the bar while the lane is muted", () => {
      expect(tagWithLabel(master({ ...props, laneControls: { [lane]: { muted: true } } }), label)).toContain("opacity-40");
    });

    it("leaves the bar at full opacity while it is not", () => {
      expect(tagWithLabel(master({ ...props, laneControls: { [lane]: { muted: false } } }), label)).not.toContain("opacity-40");
    });
  });
});

describe("video clips raise a context menu (Composa#661)", () => {
  const clip = { baseClips: [{ id: "v1", name: "shot", range: [0, 1_000] }] };

  it("advertises the menu on the bar once a host handler is wired", () => {
    expect(tagWithLabel(master({ ...clip, onClipContextMenu: () => undefined }), "shot")).toContain('aria-haspopup="menu"');
  });

  it("promises nothing when no host handler is wired", () => {
    // The bar must still be there — otherwise the missing attribute means nothing.
    expect(tagWithLabel(master(clip), "shot")).not.toContain("aria-haspopup");
  });
});
