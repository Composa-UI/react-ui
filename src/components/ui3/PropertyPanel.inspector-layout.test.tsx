import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { Timer } from "lucide-react";
import { PanelFieldRow } from "./Panel";
import { PropertyPanel } from "./PropertyPanel";

// Slide/composition inspector layout contract (owner polish):
//  1. Start and End share one DualField row and reserve the trailing-icon slot
//     (24px + 8px gap) so the slide inspector's fields right-align with the
//     Position/Scale/Opacity fields. Reference: PanelFieldRow defaults
//     reserveRightSlot=true; the Design tab relies on that default.
//  2. Duration is pinned to a single column — a half-width `right` spacer fills
//     the second column so the control sits under Start.
//  3. Video Timeline and Trim use the same paired-row + trailing-slot contract.
function render(props: Parameters<typeof PropertyPanel>[0]) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<PropertyPanel {...props} />); });
  return renderer!;
}

const rowByLabel = (renderer: ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(PanelFieldRow).find(node => node.props.label === label);

describe("slide/composition inspector — trailing-slot + Duration column", () => {
  it("puts slide Start and End in one paired row with the trailing slot reserved", () => {
    const renderer = render({ mode: "slide", slideStart: 0, slideDuration: 4 });
    expect(rowByLabel(renderer, "Start")).toBeUndefined();
    expect(rowByLabel(renderer, "End")).toBeUndefined();
    const pair = renderer.root.findByProps({ "data-composa-dual-field": true });
    expect(pair.findAllByProps({ "aria-label": "Start" })).toHaveLength(1);
    expect(pair.findAllByProps({ "aria-label": "End" })).toHaveLength(1);
    expect(pair.props["data-reserve-right-slot"]).toBe("true");
  });

  it("reserves the trailing slot AND pins Duration to one column", () => {
    const renderer = render({ mode: "slide", slideStart: 0, slideDuration: 4 });
    const duration = rowByLabel(renderer, "Duration")!;
    expect(duration.props.reserveRightSlot).toBe(true);
    // A half-width spacer occupies the second column → Duration is 1-col wide.
    expect(duration.props.right).toBeTruthy();
    expect(renderer.root.findAllByType(Timer)).toHaveLength(1);
  });

  it("hides Layout guide by default and exposes it only through the fidelity-tools capability", () => {
    const defaultPanel = render({ mode: "slide", layoutGuides: [] });
    expect(defaultPanel.root.findAll(node => node.props.title === "Layout guide")).toHaveLength(0);

    const fidelityPanel = render({ mode: "slide", layoutGuides: [], capabilities: { layoutFidelityTools: true } });
    expect(fidelityPanel.root.findAll(node => node.props.title === "Layout guide")).toHaveLength(1);
  });

  it("reserves the trailing slot on the Background Fill type row", () => {
    const fill = rowByLabel(render({ mode: "slide", slideStart: 0, slideDuration: 4 }), "Fill type")!;
    // Default (undefined) resolves to reserved; explicitly never false here.
    expect(fill.props.reserveRightSlot).not.toBe(false);
  });

  it("pairs video Start/End and reserves trailing slots for Timeline and Trim", () => {
    const renderer = render({ mode: "video-clip", clipStart: 0, clipDuration: 8 });
    const duration = rowByLabel(renderer, "Duration")!;
    const pairs = renderer.root.findAllByProps({ "data-composa-dual-field": true });
    const pairWith = (label: string) => pairs.find(pair => pair.findAllByProps({ "aria-label": label }).length === 1)!;
    for (const pair of pairs) expect(pair.props["data-reserve-right-slot"]).toBe("true");
    expect(pairWith("Start").findAllByProps({ "aria-label": "End" })).toHaveLength(1);
    expect(pairWith("Trim in").findAllByProps({ "aria-label": "Trim out" })).toHaveLength(1);
    expect(duration.props.reserveRightSlot).toBe(true);
    expect(duration.props.right).toBeTruthy();
  });
});

describe("element mask inspector", () => {
  it("shows the native mask source and exposes one remove action", () => {
    const renderer = render({ mode: "element", elementType: "frame", mask: { sourceName: "Portrait crop", mode: "shape" }, onRemoveMask: () => undefined });
    expect(renderer.root.findAll(node => node.props.title === "Mask")).toHaveLength(1);
    expect(rowByLabel(renderer, "Source")).toBeTruthy();
    expect(rowByLabel(renderer, "Mode")).toBeTruthy();
    expect(renderer.root.findAllByProps({ "aria-label": "Remove mask" })).toHaveLength(1);
  });
});
