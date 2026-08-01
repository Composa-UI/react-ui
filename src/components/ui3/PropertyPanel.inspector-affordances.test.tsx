import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { IconButtonRow, PanelActionBtn, PanelFieldRow } from "./Panel";
import { PropertyPanel } from "./PropertyPanel";
import { SegmentedControl, SegmentedControlItem } from "./SegmentedControl";
import { Tooltip } from "./Tooltip";

// Owner feedback batch Composa#661, inspector affordances:
//  · item 2 — icon-only inspector controls carried no hover explanation.
//  · item 4 — a detached Position row put the keyframe diamond on Y only.
//  · item 6 — a segmented row ran edge-to-edge, losing the trailing icon slot.
// Each case is scoped to the specific control it names, so an assertion cannot
// pass by matching some other part of the panel.

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(props: Parameters<typeof PropertyPanel>[0]) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<PropertyPanel {...props} />); });
  return renderer!;
}

/** The nearest ancestor of `type`, or null — used to tie a control to its row. */
function ancestorOfType(node: ReactTestInstance, type: unknown): ReactTestInstance | null {
  let current: ReactTestInstance | null = node.parent;
  while (current) {
    if (current.type === type) return current;
    current = current.parent;
  }
  return null;
}

describe("inspector tooltips (Composa#661 item 2)", () => {
  it("gives every icon-only panel action button a tooltip carrying its own label", () => {
    const renderer = render({ elementType: "text", multiSelect: true });
    const buttons = renderer.root.findAllByType(PanelActionBtn);
    expect(buttons.length).toBeGreaterThan(0); // the negative below cannot pass vacuously

    for (const button of buttons) {
      const tooltips = button.findAllByType(Tooltip);
      expect(tooltips).toHaveLength(1);
      expect(tooltips[0].props.label).toBe(button.props.tooltip ?? button.props.label);
      expect(tooltips[0].props.label).toBeTruthy();
    }
    act(() => renderer.unmount());
  });

  it("gives every alignment/rotate icon button a tooltip", () => {
    const renderer = render({ elementType: "shape" });
    const rows = renderer.root.findAllByType(IconButtonRow);
    expect(rows.length).toBeGreaterThan(0);

    let seen = 0;
    for (const row of rows) {
      for (const button of row.props.buttons as { label: string; tooltip?: string }[]) {
        seen += 1;
        const tooltip = row.findAllByType(Tooltip).find(node => node.props.label === (button.tooltip ?? button.label));
        expect(tooltip, `no tooltip for ${button.label}`).toBeTruthy();
      }
    }
    expect(seen).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it("explains each icon-only segment with its aria-label and adds none to text segments", () => {
    const renderer = render({ elementType: "text", onTextSizingModeChange: () => undefined });
    const iconOnly = renderer.root.findAllByType(SegmentedControlItem).filter(item => !item.props.label);
    expect(iconOnly.length).toBeGreaterThan(0);

    for (const item of iconOnly) {
      const tooltip = ancestorOfType(item, Tooltip);
      expect(tooltip, `no tooltip wrapping ${item.props["aria-label"]}`).toBeTruthy();
      expect(tooltip!.props.disabled).toBe(false);
      expect(tooltip!.props.label).toBe(item.props["aria-label"]);
    }
    act(() => renderer.unmount());
  });

  it("does not repeat a segment's visible text back at it", () => {
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(<SegmentedControl
        ariaLabel="Units"
        segments={[{ value: "px", label: "px" }, { value: "%", label: "%" }]}
        value="px"
        onChange={() => undefined}
      />);
    });
    const items = renderer!.root.findAllByType(SegmentedControlItem);
    expect(items).toHaveLength(2);
    for (const item of items) expect(ancestorOfType(item, Tooltip)!.props.disabled).toBe(true);
    act(() => renderer!.unmount());
  });
});

describe("detached Position keyframes (Composa#661 item 4)", () => {
  const keyframe = () => ({ active: false, onToggle: vi.fn() });

  it("puts a keyframe diamond on BOTH separated Position fields", () => {
    const position = keyframe();
    const renderer = render({
      elementType: "shape",
      positionPresentation: "separate",
      keyframeControls: { position },
    });
    const x = renderer.root.findByProps({ "aria-label": "Position X keyframe" });
    const y = renderer.root.findByProps({ "aria-label": "Position Y keyframe" });
    expect(x).toBeTruthy();
    expect(y).toBeTruthy();

    // One position keyframe, two diamonds: either drives the same control.
    act(() => x.props.onClick({ stopPropagation: () => undefined }));
    act(() => y.props.onClick({ stopPropagation: () => undefined }));
    expect(position.onToggle).toHaveBeenCalledTimes(2);
    act(() => renderer.unmount());
  });

  it("shows no diamonds at all when the host supplies no position keyframe control", () => {
    const renderer = render({ elementType: "shape", positionPresentation: "separate" });
    // Assert the row itself rendered first — otherwise the absence proves nothing.
    expect(renderer.root.findByProps({ "aria-label": "Position X" })).toBeTruthy();
    expect(renderer.root.findAllByProps({ "aria-label": "Position X keyframe" })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ "aria-label": "Position Y keyframe" })).toHaveLength(0);
    act(() => renderer.unmount());
  });
});

describe("segmented rows keep their trailing icon slot (Composa#661 item 6)", () => {
  // The rule the owner has raised repeatedly: a segmented control never runs to
  // the panel edge — the 24px right-action column stays reserved so a per-row
  // icon has somewhere to live and the right gutter stays aligned. Enforced in
  // the type by PanelSegmentedRow; this walks the rendered inspector so a future
  // plain PanelFieldRow with `reserveRightSlot={false}` fails CI instead of
  // shipping.
  const surfaces: Parameters<typeof PropertyPanel>[0][] = [
    { elementType: "text", onTextSizingModeChange: () => undefined }, // Text resizing
    { elementType: "frame" },                     // Layout / Flow
    { mode: "slide", slideStart: 0, slideDuration: 4 }, // Background fill type
  ];

  it("reserves the trailing slot on every segmented field row in the inspector", () => {
    let checked = 0;
    for (const props of surfaces) {
      const renderer = render(props);
      for (const control of renderer.root.findAllByType(SegmentedControl)) {
        const row = ancestorOfType(control, PanelFieldRow);
        // Hand-built rows (the auto-layout Flow + Wrap pair) reserve their own
        // 24px column and are not PanelFieldRows; the rule below is about rows
        // that DO delegate their geometry to the shared primitive.
        if (!row) continue;
        checked += 1;
        expect(row.props.reserveRightSlot, `${row.props.label} runs edge-to-edge`).not.toBe(false);
      }
      act(() => renderer.unmount());
    }
    // Text resizing + Layout Flow + Background fill type. Guards the assertion
    // above from passing because nothing was found.
    expect(checked).toBeGreaterThanOrEqual(3);
  });

  it("keeps the Text resizing row itself reserved", () => {
    const renderer = render({ elementType: "text" });
    const row = renderer.root.findAllByType(PanelFieldRow).find(node => node.props.label === "Text resizing");
    expect(row).toBeTruthy();
    expect(row!.props.reserveRightSlot).toBe(true);
    act(() => renderer.unmount());
  });
});
