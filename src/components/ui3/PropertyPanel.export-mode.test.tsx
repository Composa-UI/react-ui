import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { PropertyPanel, type InspectorExportSetting } from "./PropertyPanel";
import { SegmentedControl } from "./SegmentedControl";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const settings: InspectorExportSetting[] = [{ id: "export-1", scale: 1, format: "PNG" }];

function render(props: Partial<Parameters<typeof PropertyPanel>[0]> = {}) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<PropertyPanel elementType="shape" exportSettings={settings} {...props} />); });
  return renderer!;
}

describe("Export mode (owner feedback Row 63)", () => {
  it("defaults to the current Static path and exposes Frame as the only bounded animation option", () => {
    const renderer = render();
    const mode = renderer.root.findAllByType(SegmentedControl).find(node => node.props.ariaLabel === "Export mode")!;
    expect(mode.props.value).toBe("static");
    expect(mode.props.segments).toEqual([{ value: "static", label: "Static" }, { value: "frame", label: "Frame" }]);
    expect(renderer.root.findAllByType(Button).find(node => node.props.label === "Export Rectangle")).toBeTruthy();
    act(() => renderer.unmount());
  });

  it("emits the controlled mode and labels the evaluated-still action honestly", () => {
    const onExportModeChange = vi.fn();
    const renderer = render({ exportMode: "frame", onExportModeChange });
    const mode = renderer.root.findAllByType(SegmentedControl).find(node => node.props.ariaLabel === "Export mode")!;
    expect(mode.props.value).toBe("frame");
    expect(renderer.root.findAllByType(Button).find(node => node.props.label === "Export frame")).toBeTruthy();
    act(() => mode.props.onChange("static"));
    expect(onExportModeChange).toHaveBeenCalledWith("static");

    // V1 does not advertise an encoder it does not have.
    const labels = renderer.root.findAll(node => typeof node.props?.label === "string").map(node => node.props.label);
    expect(labels).not.toContain("MP4");
    expect(labels).not.toContain("Quality");
    expect(labels).not.toContain("Frame rate");
    act(() => renderer.unmount());
  });
});
