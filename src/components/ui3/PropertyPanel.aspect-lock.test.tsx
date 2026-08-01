import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { DimensionSizingFields, lockedAspectCounterpart, type ElementSizingAxis, type ElementSizingChange } from "./PropertyPanel";

// Composa#661 item 5: the Layout chain-link swapped its own icon and nothing
// else — `lockAspect` was never read by the sizing emitter, so widening a
// locked circle left its height alone. Every case below drives the real Width /
// Height fields and asserts on what the host is actually told.

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("lockedAspectCounterpart", () => {
  it("scales the other axis by the current ratio", () => {
    expect(lockedAspectCounterpart("width", 200, 100, 100)).toBe(200); // circle
    expect(lockedAspectCounterpart("width", 200, 100, 50)).toBe(100);  // 2:1
    expect(lockedAspectCounterpart("height", 25, 100, 50)).toBe(50);
  });

  it("refuses to invent a ratio it cannot compute", () => {
    expect(lockedAspectCounterpart("width", 200, 0, 100)).toBeUndefined();
    expect(lockedAspectCounterpart("width", 200, 100, 0)).toBeUndefined();
    expect(lockedAspectCounterpart("width", Number.NaN, 100, 100)).toBeUndefined();
    expect(lockedAspectCounterpart("width", 200, Number.POSITIVE_INFINITY, 100)).toBeUndefined();
  });
});

describe("DimensionSizingFields — locked aspect ratio", () => {
  type Emitted = [ElementSizingAxis, ElementSizingChange];

  function mount(props: Parameters<typeof DimensionSizingFields>[0]) {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<DimensionSizingFields {...props} />); });
    return renderer!;
  }
  const fieldInput = (renderer: ReactTestRenderer, label: "Width" | "Height"): ReactTestInstance =>
    renderer.root.findAll(node => node.type === "input" && node.props?.["aria-label"] === label)[0];
  const type = (renderer: ReactTestRenderer, label: "Width" | "Height", value: string) =>
    act(() => fieldInput(renderer, label).props.onChange({ target: { value } }));
  const lock = (renderer: ReactTestRenderer) =>
    act(() => renderer.root.findByProps({ "aria-label": "Lock aspect ratio" }).props.onClick());

  it("drives the height when a locked circle's width changes", () => {
    const emitted: Emitted[] = [];
    const renderer = mount({
      width: 100, height: 100,
      onSizingChange: (axis, change) => emitted.push([axis, change]),
    });
    lock(renderer);
    type(renderer, "Width", "200");

    expect(emitted).toEqual([
      ["width", { mode: "fixed", value: 200 }],
      ["height", { mode: "fixed", value: 200 }],
    ]);
    act(() => renderer.unmount());
  });

  it("preserves a non-square ratio in both directions", () => {
    const emitted: Emitted[] = [];
    const renderer = mount({
      width: 100, height: 50,
      onSizingChange: (axis, change) => emitted.push([axis, change]),
    });
    lock(renderer);

    type(renderer, "Width", "200");
    expect(emitted).toEqual([
      ["width", { mode: "fixed", value: 200 }],
      ["height", { mode: "fixed", value: 100 }],
    ]);

    emitted.length = 0;
    type(renderer, "Height", "25");
    expect(emitted).toEqual([
      ["height", { mode: "fixed", value: 25 }],
      ["width", { mode: "fixed", value: 50 }],
    ]);
    act(() => renderer.unmount());
  });

  it("changes one axis only while the lock is open", () => {
    const emitted: Emitted[] = [];
    const renderer = mount({
      width: 100, height: 100,
      onSizingChange: (axis, change) => emitted.push([axis, change]),
    });
    // Not locked. Assert the width emit landed, so the missing height emit is a
    // real absence rather than the field never having fired.
    type(renderer, "Width", "200");
    expect(emitted).toEqual([["width", { mode: "fixed", value: 200 }]]);

    // Lock, then unlock again — the pairing must follow the toggle, not stick.
    emitted.length = 0;
    lock(renderer);
    lock(renderer);
    type(renderer, "Width", "300");
    expect(emitted).toEqual([["width", { mode: "fixed", value: 300 }]]);
    act(() => renderer.unmount());
  });

  it("leaves a relative (Hug/Fill) axis alone rather than silently pinning it", () => {
    const emitted: Emitted[] = [];
    const renderer = mount({
      width: 100, height: 100,
      widthMode: "fixed", heightMode: "hug",
      onSizingChange: (axis, change) => emitted.push([axis, change]),
    });
    lock(renderer);
    type(renderer, "Width", "200");
    expect(emitted).toEqual([["width", { mode: "fixed", value: 200 }]]);
    act(() => renderer.unmount());
  });

  it("does not guess a ratio for a Mixed multi-selection", () => {
    const emitted: Emitted[] = [];
    const renderer = mount({
      width: 100, height: 100, heightValueMixed: true,
      onSizingChange: (axis, change) => emitted.push([axis, change]),
    });
    lock(renderer);
    type(renderer, "Width", "200");
    expect(emitted).toEqual([["width", { mode: "fixed", value: 200 }]]);
    act(() => renderer.unmount());
  });

  it("pairs through the uncontrolled width/height callbacks too", () => {
    const onWidthChange = vi.fn();
    const onHeightChange = vi.fn();
    const renderer = mount({ width: 100, height: 50, onWidthChange, onHeightChange });
    lock(renderer);
    type(renderer, "Width", "200");
    expect(onWidthChange).toHaveBeenCalledWith(200);
    expect(onHeightChange).toHaveBeenCalledWith(100);
    act(() => renderer.unmount());
  });
});
