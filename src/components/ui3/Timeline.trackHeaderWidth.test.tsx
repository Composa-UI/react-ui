import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { Timeline, TIMELINE_TRACK_HEADER_WIDTH } from "./Timeline";

// DEC-097: the Timeline track-header column is a slot (`trackHeaderWidth`), not the
// fixed TIMELINE_TRACK_HEADER_WIDTH. The default path is covered by the existing
// Timeline suite (unchanged); this asserts the override actually reflows the
// header column — the body divider offset and the lane-header widths track it.

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

const dividerLeft = (r: ReactTestRenderer) =>
  r.root.find(n => n.props["data-timeline-track-header-divider"] === true).props.style.left;
const laneHeaderWidths = (r: ReactTestRenderer) =>
  r.root.findAll(n => n.props["data-timeline-lane-header"] != null).map(n => n.props.style.width);

describe("Timeline trackHeaderWidth slot (DEC-097)", () => {
  it("defaults to TIMELINE_TRACK_HEADER_WIDTH", () => {
    const r = render(<Timeline mode="master" baseClips={[]} audioClips={[]} />);
    expect(dividerLeft(r)).toBe(TIMELINE_TRACK_HEADER_WIDTH);
    for (const w of laneHeaderWidths(r)) expect(w).toBe(TIMELINE_TRACK_HEADER_WIDTH);
  });

  it("reflows the whole header column when overridden", () => {
    const r = render(<Timeline mode="master" trackHeaderWidth={200} baseClips={[]} audioClips={[]} />);
    expect(dividerLeft(r)).toBe(200);
    const widths = laneHeaderWidths(r);
    expect(widths.length).toBeGreaterThan(0);
    for (const w of widths) expect(w).toBe(200);
    // and nothing in the header column is left at the old fixed width
    expect(widths).not.toContain(TIMELINE_TRACK_HEADER_WIDTH);
  });
});
