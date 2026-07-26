import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { shouldActivateTimelineTrackKey, shouldBeginTimelineMiddlePan, shouldBeginTimelinePointer, shouldClaimSelectedTimelinePresetDelete, shouldClaimTimelineGestureEscape, shouldDeleteSelectedTimelinePreset, shouldHandleTimelineReveal, stepTimelinePlayhead, timelineClipTrimDetail, timelineDurationBarProjection, timelineDurationBarTargetRange, timelineTimeAtClientX, timelineTrackExpansionForKey, timelineTrackNavigationIndex, Timeline, type Track } from "./Timeline";

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
    expect(html).not.toContain('aria-keyshortcuts="Delete Backspace"');
  });

  it("advertises and claims preset deletion only for a selected editable bar with a host callback", () => {
    expect(shouldDeleteSelectedTimelinePreset({
      key: "Delete", selected: true, editable: true, callbackAvailable: true,
    })).toBe(true);
    expect(shouldDeleteSelectedTimelinePreset({
      key: "Backspace", selected: true, editable: true, callbackAvailable: true, isComposing: true,
    })).toBe(false);
    expect(shouldDeleteSelectedTimelinePreset({
      key: "Delete", selected: true, editable: false, callbackAvailable: true,
    })).toBe(false);
    expect(shouldDeleteSelectedTimelinePreset({
      key: "Delete", selected: false, editable: true, callbackAvailable: true,
    })).toBe(false);
    expect(shouldDeleteSelectedTimelinePreset({
      key: "Delete", selected: true, editable: true, callbackAvailable: false,
    })).toBe(false);
    expect(shouldClaimSelectedTimelinePresetDelete({
      key: "Delete", selected: true,
    })).toBe(true);

    const withDelete = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "hero", name: "Hero", type: "frame", props: [], bars: [
        { id: "pulse", label: "Pulse", timeRange: [100, 500], selected: true },
      ],
    }]} onDeleteSelectedPresets={() => undefined} />);
    const withoutDelete = renderToStaticMarkup(<Timeline height={220} duration={2_000} tracks={[{
      id: "hero", name: "Hero", type: "frame", props: [], bars: [
        { id: "pulse", label: "Pulse", timeRange: [100, 500], selected: true },
      ],
    }]} />);
    expect(withDelete).toContain('aria-keyshortcuts="Delete Backspace"');
    expect(withoutDelete).not.toContain('aria-keyshortcuts="Delete Backspace"');
  });

  it("routes Delete and additive selection from the focused preset without leaking the event", () => {
    const onDelete = vi.fn();
    const onSelect = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(<Timeline height={220} duration={2_000} tracks={[{
        id: "hero", name: "Hero", type: "frame", props: [], bars: [
          { id: "pulse", label: "Pulse", timeRange: [100, 500], selected: true },
        ],
      }]} onPresetSelect={onSelect} onDeleteSelectedPresets={onDelete} />);
    });
    const button = renderer!.root.findByProps({ "aria-label": "Select Pulse animation" });
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    act(() => button.props.onKeyDown({
      key: "Delete", shiftKey: false, altKey: false, metaKey: false, ctrlKey: false, repeat: false,
      nativeEvent: { isComposing: false, keyCode: 46 }, preventDefault, stopPropagation,
    }));
    expect(onDelete).toHaveBeenCalledWith("hero", "pulse");
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();

    act(() => button.props.onClick({ shiftKey: true, metaKey: false, ctrlKey: false }));
    expect(onSelect).toHaveBeenCalledWith("hero", "pulse", { additive: true });
    act(() => renderer!.unmount());
  });

  it("claims Delete on a selected locked bar without advertising or invoking deletion", () => {
    const onDelete = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(<Timeline height={220} duration={2_000} tracks={[{
        id: "locked", name: "Locked", type: "frame", props: [], bars: [
          { id: "pulse", label: "Pulse", timeRange: [100, 500], selected: true, editable: false },
        ],
      }]} onDeleteSelectedPresets={onDelete} />);
    });
    const button = renderer!.root.findByProps({ "aria-label": "Select Pulse animation" });
    expect(button.props["aria-keyshortcuts"]).toBeUndefined();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    act(() => button.props.onKeyDown({
      key: "Delete", shiftKey: false, altKey: false, metaKey: false, ctrlKey: false, repeat: false,
      nativeEvent: { isComposing: false, keyCode: 46 }, preventDefault, stopPropagation,
    }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();
    act(() => renderer!.unmount());
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
      { id: "stack", name: "Stack", type: "frame", autoLayoutMode: "vertical", selected: true, props: [] },
      { id: "shape", name: "Shape", type: "shape", props: [] },
    ]} onTrackSelect={() => undefined} />);
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-multiselectable="true"');
    expect(html).toContain('role="option" aria-selected="true"');
    expect(html).toContain('role="option" aria-selected="true" tabindex="0"');
    expect(html).toContain('role="option" aria-selected="false" tabindex="-1"');
    expect(html).toContain('data-layer-icon-type="frame"');
    expect(html).toContain('data-auto-layout-mode="vertical"');
    expect(html).toContain('data-icon-semantic="auto-layout-frame"');
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
  it("renders the master audio seam and the white-thumb blue-fill zoom contract", () => {
    const html = renderToStaticMarkup(<Timeline mode="master" height={220} duration={20_000}
      viewport={{ startMs: 2_000, endMs: 12_000 }} />);
    expect(html).toContain(">Audio</span>");
    expect(html).toContain('aria-label="Audio track (coming soon)"');
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-disabled="true"');
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
