import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
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
  it("keeps a collapsed empty Export section free of mode controls", () => {
    const renderer = render({ exportSettings: [] });
    expect(renderer.root.findAllByType(SegmentedControl).find(node => node.props.ariaLabel === "Export mode")).toBeUndefined();
    act(() => renderer.unmount());
  });

  it("uses the approved Static and Animated wording only after Export expands", () => {
    const renderer = render();
    const mode = renderer.root.findAllByType(SegmentedControl).find(node => node.props.ariaLabel === "Export mode")!;
    expect(mode.props.value).toBe("static");
    expect(mode.props.segments).toEqual([{ value: "static", label: "Static" }, { value: "frame", label: "Animated" }]);
    expect(renderer.root.findAllByType(Button).find(node => node.props.label === "Export Rectangle")).toBeTruthy();
    act(() => renderer.unmount());
  });

  it("emits the controlled mode and labels the evaluated-still action honestly", () => {
    const onExportModeChange = vi.fn();
    const onProjectFrameRateChange = vi.fn();
    const renderer = render({ exportMode: "frame", onExportModeChange, projectFrameRate: 30, onProjectFrameRateChange });
    const mode = renderer.root.findAllByType(SegmentedControl).find(node => node.props.ariaLabel === "Export mode")!;
    expect(mode.props.value).toBe("frame");
    expect(renderer.root.findAllByType(Button).find(node => node.props.label === "Export frame")).toBeTruthy();
    act(() => mode.props.onChange("static"));
    expect(onExportModeChange).toHaveBeenCalledWith("static");

    // The bounded evaluated-still path has truthful size/format/frame-grid controls,
    // but does not advertise a video codec or duration render it cannot perform.
    const labels = renderer.root.findAll(node => typeof node.props?.label === "string").map(node => node.props.label);
    expect(labels).not.toContain("MP4");
    expect(renderer.root.findAll(node => node.props?.ariaLabel === "Export size")).toHaveLength(1);
    expect(renderer.root.findAll(node => node.props?.ariaLabel === "Export format")).toHaveLength(1);
    expect(renderer.root.findAll(node => node.props?.ariaLabel === "Export frame rate")).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it("shows JPEG quality only for the encoder path that consumes it", () => {
    const renderer = render({ exportSettings: [{ ...settings[0], format: "JPG", quality: 80 }] });
    expect(renderer.root.findAll(node => node.props?.ariaLabel === "Export quality")).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it.each([
    { name: "expanded Static", props: { exportSettings: [{ ...settings[0], format: "JPG" as const, quality: 80 }] } },
    { name: "expanded Animated", props: { exportMode: "frame" as const, projectFrameRate: 30 as const } },
  ])("aligns Remove export with the first input row in $name", ({ props }) => {
    const renderer = render(props);
    const remove = renderer.root.find(node => node.props?.label === "Remove export");
    const slot = remove.parent as ReactTestInstance;

    expect(slot.props["data-composa-export-remove-slot"]).toBe(true);
    expect(String(slot.props.className).split(/\s+/)).toEqual(expect.arrayContaining(["self-start", "pt-[17px]"]));
    expect(String(slot.props.className).split(/\s+/)).not.toContain("self-end");
    expect(slot.parent?.children[slot.parent.children.length - 1]).toBe(slot);

    act(() => renderer.unmount());
  });

  it("keeps collapsed Export free of trailing slots and preserves the Remove export callback", () => {
    const collapsed = render({ exportSettings: [] });
    expect(collapsed.root.findAll(node => node.props?.["data-composa-export-remove-slot"])).toHaveLength(0);
    act(() => collapsed.unmount());

    const onRemoveExportSetting = vi.fn();
    const expanded = render({ onRemoveExportSetting });
    const remove = expanded.root.find(node => node.props?.label === "Remove export");
    act(() => remove.props.onClick());
    expect(onRemoveExportSetting).toHaveBeenCalledWith("export-1");
    act(() => expanded.unmount());
  });
});
