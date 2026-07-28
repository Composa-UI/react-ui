import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { NumericComboInput, NumericInput } from "./Input";
import { MenuRow } from "./Menu";
import { PropertyPanel } from "./PropertyPanel";

// Duration Fixed/Hug combo on the Slide-mode Timing section. Mirrors the
// Dimensions SizingComboField contract: absent handler = plain field; a supplied
// handler renders the mode combo; editing the value pins to Fixed.
function renderSlidePanel(props: Parameters<typeof PropertyPanel>[0]) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<PropertyPanel mode="slide" slideStart={0} slideDuration={4} {...props} />); });
  return renderer!;
}

const durationCombo = (renderer: ReactTestRenderer) =>
  renderer.root.findAllByType(NumericComboInput).find(node => node.props.ariaLabel === "Duration");

describe("PropertyPanel slide Duration mode combo", () => {
  it("keeps a plain Duration field when no mode handler is supplied", () => {
    const renderer = renderSlidePanel({ mode: "slide" });
    expect(durationCombo(renderer)).toBeUndefined();
    expect(renderer.root.findAllByType(NumericInput).some(node => node.props.ariaLabel === "Duration")).toBe(true);
  });

  it("renders a Fixed/Hug combo and reports mode changes when a handler is supplied", () => {
    const onMode = vi.fn();
    const renderer = renderSlidePanel({ mode: "slide", slideDurationMode: "fixed", onSlideDurationModeChange: onMode });
    const combo = durationCombo(renderer)!;
    expect(combo.props.dataMode).toBe("fixed");

    // The mode menu offers exactly Fixed duration + Hug contents.
    let menuRenderer: ReactTestRenderer;
    act(() => { menuRenderer = create(combo.props.menu(() => {}) as never); });
    const rows = menuRenderer!.root.findAllByType(MenuRow);
    expect(rows.map(row => row.props.label)).toEqual(["Fixed duration", "Hug contents"]);

    act(() => rows.find(row => row.props.label === "Hug contents")!.props.onClick());
    expect(onMode).toHaveBeenCalledWith("hug");
  });

  it("shows a Hug idle label and pins to Fixed when the value is edited", () => {
    const onMode = vi.fn();
    const onDuration = vi.fn();
    const renderer = renderSlidePanel({ mode: "slide", slideDurationMode: "hug", onSlideDurationModeChange: onMode, onSlideDurationChange: onDuration });
    const combo = durationCombo(renderer)!;
    expect(combo.props.dataMode).toBe("hug");
    expect(combo.props.idleLabel).toBe("Hug");

    // Typing a value converts the composition to a Fixed duration (Sizing parity).
    act(() => combo.props.onChange(2.5));
    expect(onMode).toHaveBeenCalledWith("fixed");
    expect(onDuration).toHaveBeenCalledWith(2.5);
  });
});
