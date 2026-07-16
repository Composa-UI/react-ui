import * as PopoverPrimitive from "@radix-ui/react-popover";
import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import {
  ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
  AnchoredInspectorOverlay,
  shouldMountAnchoredInspectorOverlay,
} from "./AnchoredInspectorOverlay";
import { InspectorDialog } from "./InspectorDialog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("AnchoredInspectorOverlay contract", () => {
  it("waits for a captured trigger before mounting portalled content", () => {
    expect(shouldMountAnchoredInspectorOverlay(false, false)).toBe(false);
    expect(shouldMountAnchoredInspectorOverlay(true, false)).toBe(false);
    expect(shouldMountAnchoredInspectorOverlay(true, true)).toBe(true);
  });

  it("uses the shared viewport collision inset", () => {
    expect(ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING).toBe(8);
  });

  it("enables the Radix modal focus scope by default", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <AnchoredInspectorOverlay open={false} onClose={() => undefined} ariaLabel="Settings"
          trigger={<button type="button">Open</button>}>
          <button type="button">First field</button>
        </AnchoredInspectorOverlay>,
      );
    });
    expect(renderer!.root.findByType(PopoverPrimitive.Root).props.modal).toBe(true);
    act(() => renderer!.unmount());
  });

  it("preserves the existing non-modal InspectorDialog compatibility contract", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <InspectorDialog open={false} onClose={() => undefined} ariaLabel="Effect details"
          trigger={<button type="button">Open effect</button>}>
          Effect fields
        </InspectorDialog>,
      );
    });
    expect(renderer!.root.findByType(PopoverPrimitive.Root).props.modal).toBe(false);
    act(() => renderer!.unmount());
  });
});
