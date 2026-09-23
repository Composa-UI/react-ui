import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import {
  Timeline,
  TimelineTransport,
  TimelineRuler,
  TimelineSecondRuler,
  TimelineMasterLaneHeader,
  TimelineBlockTrack,
  TimelineBaseVideoTrack,
  TimelineAudioTrack,
  TimelineTrackRows,
  TimelineLane,
  TimelineDurationBar,
  TimelineChildConnector,
  TimelineTimeScrollbar,
  TimelineTrackHeaderWidthProvider,
  timelineDurationBarProjection,
  TIMELINE_TRACK_HEADER_WIDTH,
  type Track,
  type PropTrack,
  type SlideBlock,
  type BaseClipBlock,
  type AudioClipBlock,
  type TimelineMasterLaneHeaderProps,
} from "./Timeline";
import type { TimelineViewport, TimelineEdgeDragController } from "./timelineModel";

// DEC-097: the timeline's internal track/lane/row elements are now EXPORTED
// composable components. This suite renders each one on its own (outside the
// monolithic Timeline) and asserts it mounts with the right roles + key props, so a
// host — or a second Figma-mental-model tool — can reuse the pieces. Mirrors the
// Timeline test setup (react-test-renderer, node env, ResizeObserver stub).

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

function render(el: ReactElement): ReactTestRenderer {
  let r!: ReactTestRenderer;
  act(() => { r = create(el); });
  return r;
}

const viewport: TimelineViewport = { startMs: 0, endMs: 1_000 };
// A no-op edge-drag controller: render-only tests never begin a gesture, so the
// methods are never called — but the prop is required and must be well-typed.
const edgeDrag: TimelineEdgeDragController = { start() {}, update() {}, stop() {}, cancel() {} };

const byLabel = (r: ReactTestRenderer, label: string) =>
  r.root.findAll(n => n.props["aria-label"] === label);

describe("TimelineTransport", () => {
  it("renders Play/Stop/Loop and switches Play↔Pause", () => {
    const r = render(<TimelineTransport current={300} duration={1_000} mode="slide" playing={false} loop={false}
      onPlayingChange={() => {}} onLoopChange={() => {}} />);
    expect(byLabel(r, "Play")).toHaveLength(1);
    expect(byLabel(r, "Stop")).toHaveLength(1);
    expect(byLabel(r, "Loop")).toHaveLength(1);
    expect(byLabel(r, "Pause")).toHaveLength(0);

    const playing = render(<TimelineTransport current={300} duration={1_000} mode="slide" playing loop={false}
      onPlayingChange={() => {}} onLoopChange={() => {}} />);
    expect(byLabel(playing, "Pause")).toHaveLength(1);
  });

  it("exposes the auto-keyframe toggle only when wired (slide mode)", () => {
    const wired = render(<TimelineTransport current={0} duration={1_000} mode="slide" playing={false} loop={false}
      onPlayingChange={() => {}} onLoopChange={() => {}} onAutoKeyframeChange={() => {}} />);
    expect(byLabel(wired, "Auto-keyframe")).toHaveLength(1);
    const unwired = render(<TimelineTransport current={0} duration={1_000} mode="slide" playing={false} loop={false}
      onPlayingChange={() => {}} onLoopChange={() => {}} />);
    expect(byLabel(unwired, "Auto-keyframe")).toHaveLength(0);
  });
});

describe("TimelineRuler / TimelineSecondRuler", () => {
  it("renders millisecond ticks", () => {
    const html = renderToStaticMarkup(<TimelineRuler viewport={viewport} width={500} />);
    expect(html).toContain("tabular-nums");
  });
  it("renders master (seconds) ticks", () => {
    const html = renderToStaticMarkup(<TimelineSecondRuler viewport={{ startMs: 0, endMs: 20_000 }} width={500} />);
    expect(html).toContain("tabular-nums");
  });
});

describe("TimelineMasterLaneHeader", () => {
  const header: TimelineMasterLaneHeaderProps = {
    icon: <span>V</span>,
    label: "Video",
    control: { visible: true },
    onAdd: () => {},
    onVisibilityToggle: () => {},
    onSoloToggle: () => {},
    onMuteToggle: () => {},
    onLockToggle: () => {},
  };

  it("renders the lane header anatomy with controls", () => {
    const r = render(<TimelineMasterLaneHeader {...header} />);
    // header container tagged by label + defaults to the track-header width
    const container = r.root.find(n => n.props["data-timeline-lane-header"] === "Video");
    expect(container.props.style.width).toBe(TIMELINE_TRACK_HEADER_WIDTH);
    // the four grouped controls + the add affordance, all labelled
    expect(r.root.findAll(n => n.props.role === "group" && n.props["aria-label"] === "Video controls")).toHaveLength(1);
    expect(byLabel(r, "Hide Video")).toHaveLength(1);
    expect(byLabel(r, "Solo Video")).toHaveLength(1);
    expect(byLabel(r, "Mute Video")).toHaveLength(1);
    expect(byLabel(r, "Lock Video")).toHaveLength(1);
    expect(byLabel(r, "Add to Video")).toHaveLength(1);
  });

  it("honors a TimelineTrackHeaderWidthProvider override when composed standalone", () => {
    // A host composing the pieces outside the monolithic Timeline can retune the
    // header column so it stays aligned with a custom-width plot (DEC-097 seam).
    const r = render(
      <TimelineTrackHeaderWidthProvider width={200}>
        <TimelineMasterLaneHeader {...header} />
      </TimelineTrackHeaderWidthProvider>,
    );
    const container = r.root.find(n => n.props["data-timeline-lane-header"] === "Video");
    expect(container.props.style.width).toBe(200);
    expect(container.props.style.width).not.toBe(TIMELINE_TRACK_HEADER_WIDTH);
  });
});

describe("TimelineBlockTrack", () => {
  const header: TimelineMasterLaneHeaderProps = { icon: <span>C</span>, label: "Compositions" };
  const blocks: SlideBlock[] = [{ id: "intro", name: "Intro", range: [0, 400] }];

  it("renders composition block buttons over its lane header", () => {
    const r = render(<TimelineBlockTrack blocks={blocks} header={header} viewport={viewport} plotWidth={500} onSelect={() => {}} />);
    const block = r.root.find(n => n.props.role === "button" && n.props["aria-label"] === "Intro");
    expect(block.props.tabIndex).toBe(0);
    expect(r.root.findAll(n => n.props["data-timeline-lane-header"] === "Compositions")).toHaveLength(1);
  });
});

describe("TimelineBaseVideoTrack", () => {
  const header: TimelineMasterLaneHeaderProps = { icon: <span>V</span>, label: "Video" };
  const clips: BaseClipBlock[] = [{ id: "clip-1", name: "Shot 1", range: [0, 500] }];

  it("renders the base video lane and its clips", () => {
    const r = render(<TimelineBaseVideoTrack clips={clips} header={header} viewport={viewport} plotWidth={500} onSelect={() => {}} />);
    expect(byLabel(r, "Base video track")).toHaveLength(1);
    const clip = r.root.find(n => n.props.role === "button" && n.props["aria-label"] === "Shot 1");
    expect(clip.props.tabIndex).toBe(0);
  });

  it("labels an empty lane distinctly", () => {
    const r = render(<TimelineBaseVideoTrack clips={[]} header={header} viewport={viewport} plotWidth={500} />);
    expect(byLabel(r, "Base video track (empty)")).toHaveLength(1);
  });
});

describe("TimelineAudioTrack", () => {
  const header: TimelineMasterLaneHeaderProps = { icon: <span>A</span>, label: "Audio" };
  const clips: AudioClipBlock[] = [{ id: "a-1", name: "Voiceover", range: [0, 600] }];

  it("renders audio clips with a waveform strip", () => {
    const r = render(<TimelineAudioTrack clips={clips} header={header} viewport={viewport} plotWidth={500} onSelect={() => {}} />);
    expect(byLabel(r, "Audio track")).toHaveLength(1);
    expect(r.root.find(n => n.props.role === "button" && n.props["aria-label"] === "Voiceover")).toBeTruthy();
    expect(r.root.findAll(n => n.props["data-timeline-audio-waveform"] != null).length).toBeGreaterThan(0);
  });
});

describe("TimelineTrackRows", () => {
  const track: Track = {
    id: "hero", name: "Hero", type: "frame",
    props: [{ id: "opacity", name: "Opacity", keyframes: [200, 800] }],
  };

  it("renders a selectable layer row and its property lane", () => {
    const r = render(<TimelineTrackRows track={track} trackIndex={0} focusable viewport={viewport}
      plotWidth={500} duration={1_000} edgeDrag={edgeDrag} onTrackSelect={() => {}} />);
    // layer row is a listbox option
    const option = r.root.find(n => n.props.role === "option");
    expect(option.props["aria-selected"]).toBe(false);
    expect(option.props.tabIndex).toBe(0);
    // property row exposes its keyframe lane + a keyframe diamond
    expect(r.root.findAll(n => n.props["data-timeline-property-lane"] === "hero:opacity")).toHaveLength(1);
    expect(r.root.findAll(n => typeof n.props["data-keyframe-id"] === "string").length).toBeGreaterThan(0);
  });
});

describe("TimelineLane", () => {
  const prop: PropTrack = { id: "opacity", name: "Opacity", keyframes: [100, 500, 900] };

  it("renders draggable keyframe diamonds with accessible labels", () => {
    const r = render(<TimelineLane prop={prop} trackId="hero" propertyId="opacity" height={28}
      viewport={viewport} plotWidth={500} edgeDrag={edgeDrag} onSelect={() => {}} />);
    expect(r.root.findAll(n => n.props["data-timeline-property-lane"] === "hero:opacity")).toHaveLength(1);
    const diamonds = r.root.findAll(n => typeof n.props["aria-label"] === "string" && String(n.props["aria-label"]).startsWith("Opacity keyframe at"));
    expect(diamonds).toHaveLength(3);
  });
});

describe("TimelineDurationBar", () => {
  it("renders move + trim targets when editable", () => {
    const projection = timelineDurationBarProjection([100, 800], viewport);
    expect(projection).not.toBeNull();
    const r = render(<TimelineDurationBar trackId="hero" name="Hero" range={[100, 800]} projection={projection!}
      selectionState="none" viewport={viewport} plotWidth={500} duration={1_000}
      laneRef={{ current: null }} edgeDrag={edgeDrag} onChange={() => {}} />);
    expect(r.root.findAll(n => n.props.role === "group" && n.props["aria-label"] === "Hero duration 100ms to 800ms")).toHaveLength(1);
    expect(byLabel(r, "Move Hero duration")).toHaveLength(1);
    expect(byLabel(r, "Scale Hero duration from start")).toHaveLength(1);
    expect(byLabel(r, "Scale Hero duration from end")).toHaveLength(1);
  });

  it("renders a read-only bar (role=img) when not editable", () => {
    const projection = timelineDurationBarProjection([100, 800], viewport);
    const r = render(<TimelineDurationBar trackId="hero" name="Hero" range={[100, 800]} projection={projection!}
      selectionState="none" viewport={viewport} plotWidth={500} duration={1_000}
      laneRef={{ current: null }} edgeDrag={edgeDrag} />);
    expect(r.root.findAll(n => n.props.role === "img")).toHaveLength(1);
    expect(byLabel(r, "Move Hero duration")).toHaveLength(0);
  });
});

describe("TimelineChildConnector", () => {
  it("renders an elbow tagged with its index/count", () => {
    const r = render(<TimelineChildConnector index={1} count={3} depth={0} />);
    const elbow = r.root.find(n => n.props["data-timeline-child-connector"] === "elbow");
    expect(elbow.props["data-timeline-child-index"]).toBe(1);
    expect(elbow.props["data-timeline-child-count"]).toBe(3);
  });
});

describe("Timeline renderTrackRow seam (DEC-097)", () => {
  const track: Track = {
    id: "hero", name: "Hero", type: "frame",
    props: [{ id: "opacity", name: "Opacity", keyframes: [200, 800] }],
  };

  it("uses the built-in rows by default", () => {
    const r = render(<Timeline mode="slide" duration={1_000} tracks={[track]} />);
    expect(r.root.findAll(n => n.props["data-timeline-property-lane"] === "hero:opacity")).toHaveLength(1);
  });

  it("lets a host override a track's rows and receives the row props", () => {
    const seen: string[] = [];
    const r = render(<Timeline mode="slide" duration={1_000} tracks={[track]}
      renderTrackRow={props => { seen.push(props.track.id ?? ""); return <div data-custom-row={props.track.id} />; }} />);
    expect(seen).toEqual(["hero"]);
    expect(r.root.findAll(n => n.props["data-custom-row"] === "hero")).toHaveLength(1);
    // the built-in property lane is replaced by the override
    expect(r.root.findAll(n => n.props["data-timeline-property-lane"] === "hero:opacity")).toHaveLength(0);
  });
});

describe("TimelineTimeScrollbar", () => {
  it("renders a horizontal scrollbar with the viewport as its value", () => {
    const r = render(<TimelineTimeScrollbar viewport={{ startMs: 200, endMs: 700 }} duration={2_000} plotWidth={500} onPan={() => {}} />);
    const bar = r.root.find(n => n.props.role === "scrollbar");
    expect(bar.props["aria-label"]).toBe("Scroll timeline horizontally");
    expect(bar.props["aria-orientation"]).toBe("horizontal");
    expect(bar.props["aria-valuemax"]).toBe(2_000);
    expect(bar.props["aria-valuenow"]).toBe(200);
  });
});
