import { type ReactNode } from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { InspectorDialog } from "./InspectorDialog";

vi.mock("./AnchoredInspectorOverlay", () => ({
  COMPOSA_INSPECTOR_SURFACE_SELECTOR: "[data-composa-inspector-surface]",
  AnchoredInspectorOverlay: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) =>
    <div data-anchored-inspector-overlay {...props}>{children}</div>,
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("InspectorDialog text-selection contract (#625)", () => {
  it("disables chrome selection and restores native editor selection", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<InspectorDialog open ariaLabel="Selection proof" onClose={() => undefined} draggable={false}>
        <div><span>Chrome label</span><input aria-label="Editable value" /><textarea aria-label="Editable notes" /></div>
      </InspectorDialog>);
    });
    const overlay = renderer!.root.find(node => node.props["data-anchored-inspector-overlay"] !== undefined);
    expect(overlay.props.className).toContain("select-none");
    expect(overlay.props.className).toContain("[&_input]:select-text");
    expect(overlay.props.className).toContain("[&_textarea]:select-text");
    act(() => renderer!.unmount());
  });
});
