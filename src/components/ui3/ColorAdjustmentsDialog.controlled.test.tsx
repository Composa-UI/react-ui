import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  COMPOSA_OVERLAY_BOUNDARY_SELECTOR,
} from "./AnchoredInspectorOverlay";
import { ColorAdjustmentsDialog, colorAdjustmentGroupModified } from "./ColorAdjustmentsDialog";
import { NumericInput } from "./Input";
import { PropertyPanel } from "./PropertyPanel";

// Clip-grade Phase 1b: the Light group's exposure/contrast/highlights/shadows
// and the Color group's temperature/tint/saturation sliders become CONTROLLED
// via values/controlledKeys/onValueChange; every other slider (brightness,
// whites, blacks, vibrance, hue) and the Wheels/Creative groups stay
// uncontrolled/cosmetic. Radix is mocked so the anchored body renders under
// react-test-renderer, matching the peer dialog tests.
vi.mock("@radix-ui/react-popover", async () => {
  const React = await import("react");
  const boundary = (name: string) => ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("div", { [`data-radix-${name}`]: true, ...props }, children);
  return { Root: boundary("root"), Anchor: boundary("anchor"), Portal: boundary("portal"), Content: boundary("content"), Trigger: boundary("trigger") };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const triggerRect = { x: 920, y: 80, width: 24, height: 24, top: 80, right: 944, bottom: 104, left: 920, toJSON: () => ({}) } as DOMRect;
const surfaceRect = { x: 760, y: 0, width: 240, height: 500, top: 0, right: 1_000, bottom: 500, left: 760, toJSON: () => ({}) } as DOMRect;

function renderDialog(props: Partial<Parameters<typeof ColorAdjustmentsDialog>[0]>) {
  const collisionBoundary = {
    dataset: { composaOverlayBoundary: "" },
    getBoundingClientRect: () => ({ top: 0, right: 1_000, bottom: 500, left: 0 }),
  };
  const surface = { getBoundingClientRect: () => surfaceRect };
  const trigger = {
    getBoundingClientRect: () => triggerRect,
    closest: (selector: string) =>
      selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR ? collisionBoundary
      : selector === COMPOSA_INSPECTOR_SURFACE_SELECTOR ? surface
      : { dataset: { composaMode: "light" } },
    focus: vi.fn(),
  };
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <ColorAdjustmentsDialog group="light" open onClose={vi.fn()}
        trigger={<button type="button" aria-label="Light adjustments">Default</button>}
        {...props} />,
      { createNodeMock: element => element.type === "span" ? { querySelector: () => trigger } : null },
    );
  });
  return renderer!;
}

function numericByLabel(root: ReactTestInstance, ariaLabel: string) {
  return root.findAllByType(NumericInput).find(node => node.props.ariaLabel === ariaLabel)!;
}

describe("ColorAdjustmentsDialog — controlled engine keys (clip grade Phase 1b)", () => {
  it("renders a controlled value seeded from `values` for a mapped key", () => {
    const renderer = renderDialog({
      values: { exposure: 40 },
      controlledKeys: ["exposure", "contrast", "highlights", "shadows"],
      onValueChange: vi.fn(),
    });
    expect(numericByLabel(renderer.root, "Exposure value").props.value).toBe(40);
    act(() => renderer.unmount());
  });

  it("emits onValueChange (never stores internally) when a mapped key is edited", () => {
    const onValueChange = vi.fn();
    const renderer = renderDialog({
      values: { exposure: 40 },
      controlledKeys: ["exposure", "contrast", "highlights", "shadows"],
      onValueChange,
    });
    act(() => numericByLabel(renderer.root, "Exposure value").props.onChange(15));
    expect(onValueChange).toHaveBeenCalledWith("exposure", 15);
    // Controlled: the displayed value still tracks the prop, not a local write.
    expect(numericByLabel(renderer.root, "Exposure value").props.value).toBe(40);
    act(() => renderer.unmount());
  });

  it("keeps a cosmetic key (brightness) uncontrolled — no emit, local state only", () => {
    const onValueChange = vi.fn();
    const renderer = renderDialog({
      values: { exposure: 40 },
      controlledKeys: ["exposure", "contrast", "highlights", "shadows"],
      onValueChange,
    });
    act(() => numericByLabel(renderer.root, "Brightness value").props.onChange(30));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(numericByLabel(renderer.root, "Brightness value").props.value).toBe(30);
    act(() => renderer.unmount());
  });

  it("reports a group as modified when a controlled key deviates from default", () => {
    expect(colorAdjustmentGroupModified("light", { exposure: 40 })).toBe(true);
    expect(colorAdjustmentGroupModified("light", { exposure: 0 })).toBe(false);
    expect(colorAdjustmentGroupModified("color", { saturation: 0, temperature: 25 })).toBe(true);
  });
});

describe("PropertyPanel video-clip → ClipColorBody clip-grade wiring", () => {
  function renderPanel(clipAdjustments: Record<string, number>, onClipAdjustmentChange: (key: string, value: number) => void) {
    const trigger = {
      getBoundingClientRect: () => triggerRect,
      closest: (selector: string) =>
        selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR ? { dataset: { composaOverlayBoundary: "" }, getBoundingClientRect: () => ({ top: 0, right: 1_000, bottom: 500, left: 0 }) }
        : selector === COMPOSA_INSPECTOR_SURFACE_SELECTOR ? { getBoundingClientRect: () => surfaceRect }
        : { dataset: { composaMode: "light" } },
      focus: vi.fn(),
    };
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <PropertyPanel mode="video-clip" clipStart={0} clipDuration={8}
          clipAdjustments={clipAdjustments} onClipAdjustmentChange={onClipAdjustmentChange} />,
        { createNodeMock: element => element.type === "span" ? { querySelector: () => trigger } : null },
      );
    });
    return renderer!;
  }

  function openTrigger(root: ReactTestInstance, ariaLabel: string) {
    const dropdown = root.findAll(node => node.props.ariaLabel === ariaLabel && typeof node.props.onClick === "function")[0];
    act(() => dropdown.props.onClick());
  }

  it("seeds the Light group from clipAdjustments and emits the raw engine key on edit", () => {
    const onClipAdjustmentChange = vi.fn();
    // exposure is a Light-group mapped key → collapsed row reads "Modified".
    const renderer = renderPanel({ exposure: 35 }, onClipAdjustmentChange);
    openTrigger(renderer.root, "Light adjustments: Modified");
    expect(numericByLabel(renderer.root, "Exposure value").props.value).toBe(35);
    act(() => numericByLabel(renderer.root, "Exposure value").props.onChange(-10));
    expect(onClipAdjustmentChange).toHaveBeenCalledWith("exposure", -10);
    act(() => renderer.unmount());
  });

  it("maps the Color group's temperature/tint/saturation to engine keys", () => {
    const onClipAdjustmentChange = vi.fn();
    const renderer = renderPanel({ temperature: 20 }, onClipAdjustmentChange);
    openTrigger(renderer.root, "Color adjustments: Modified");
    expect(numericByLabel(renderer.root, "Temperature value").props.value).toBe(20);
    act(() => numericByLabel(renderer.root, "Saturation value").props.onChange(150));
    expect(onClipAdjustmentChange).toHaveBeenCalledWith("saturation", 150);
    act(() => renderer.unmount());
  });
});
