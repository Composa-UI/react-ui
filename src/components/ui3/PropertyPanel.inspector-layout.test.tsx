import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { PanelFieldRow } from "./Panel";
import { PropertyPanel } from "./PropertyPanel";

// Slide/composition inspector layout contract (owner polish):
//  1. Every Timing/Background field reserves the Design-tab trailing-icon slot
//     (24px + 8px gap) so the slide inspector's fields right-align with the
//     Position/Scale/Opacity fields. Reference: PanelFieldRow defaults
//     reserveRightSlot=true; the Design tab relies on that default.
//  2. Duration is pinned to a single column — a half-width `right` spacer fills
//     the second column so the control sits under Start.
//  3. The video-clip Timeline usage is untouched (edge-to-edge, no spacer).
function render(props: Parameters<typeof PropertyPanel>[0]) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<PropertyPanel {...props} />); });
  return renderer!;
}

const rowByLabel = (renderer: ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(PanelFieldRow).find(node => node.props.label === label);

describe("slide/composition inspector — trailing-slot + Duration column", () => {
  it("reserves the trailing-icon slot on the slide Range row", () => {
    const range = rowByLabel(render({ mode: "slide", slideStart: 0, slideDuration: 4 }), "Range")!;
    // reserveRightSlot true (not the edge-to-edge false the panel used before).
    expect(range.props.reserveRightSlot).toBe(true);
  });

  it("reserves the trailing slot AND pins Duration to one column", () => {
    const duration = rowByLabel(render({ mode: "slide", slideStart: 0, slideDuration: 4 }), "Duration")!;
    expect(duration.props.reserveRightSlot).toBe(true);
    // A half-width spacer occupies the second column → Duration is 1-col wide.
    expect(duration.props.right).toBeTruthy();
  });

  it("reserves the trailing slot on the Background Fill type row", () => {
    const fill = rowByLabel(render({ mode: "slide", slideStart: 0, slideDuration: 4 }), "Fill type")!;
    // Default (undefined) resolves to reserved; explicitly never false here.
    expect(fill.props.reserveRightSlot).not.toBe(false);
  });

  it("leaves the video-clip Timeline edge-to-edge (no reserved slot, no Duration spacer)", () => {
    const renderer = render({ mode: "video-clip", clipStart: 0, clipDuration: 8 });
    const range = rowByLabel(renderer, "Range")!;
    const duration = rowByLabel(renderer, "Duration")!;
    expect(range.props.reserveRightSlot).toBe(false);
    expect(duration.props.reserveRightSlot).toBe(false);
    expect(duration.props.right).toBeUndefined();
  });
});
