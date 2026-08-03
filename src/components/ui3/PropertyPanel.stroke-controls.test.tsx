import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Settings2 } from "lucide-react";
import { NumericInput } from "./Input";
import { PanelActionBtn } from "./Panel";
import { PropertyPanel, type ElementStrokeSetting, type InspectorKeyframeControl } from "./PropertyPanel";
import { MenuRow, PopoverMenu } from "./Menu";
import { Tooltip } from "./Tooltip";

const keyframe = (): InspectorKeyframeControl => ({ active: false, onToggle: vi.fn() });

const customStroke: ElementStrokeSetting = {
  id: "stroke-1",
  color: "#000000",
  opacity: 100,
  visible: true,
  weight: 2,
  align: "center",
  weightMode: "custom",
  edgeWeights: { top: 1, right: 2, bottom: 3, left: 4 },
  pathTrimStart: 10,
  pathTrimEnd: 90,
  keyframes: { weight: keyframe(), pathTrimStart: keyframe(), pathTrimEnd: keyframe() },
};

function renderStroke(onUpdateStroke = vi.fn()) {
  let renderer: ReactTestRenderer;
  act(() => {
    renderer = create(<PropertyPanel
      elementType="shape"
      strokes={[customStroke]}
      onUpdateStroke={onUpdateStroke}
      onToggleStroke={() => undefined}
      onRemoveStroke={() => undefined}
    />);
  });
  return renderer!;
}

describe("Iteration 4 stroke controls", () => {
  it("exposes the Figma side selector, four Custom weights, and the two Path trim values", () => {
    const renderer = renderStroke();
    const inputs = renderer.root.findAllByType(NumericInput);
    const byLabel = new Map(inputs.map(input => [input.props.ariaLabel, input.props]));

    expect(renderer.root.findAllByType(PanelActionBtn).some(button => button.props.label === "Stroke sides: Custom")).toBe(true);
    expect(byLabel.get("Stroke weight")?.keyframe).toBe(customStroke.keyframes?.weight);
    expect(byLabel.get("Top stroke weight")?.value).toBe(1);
    expect(byLabel.get("Right stroke weight")?.value).toBe(2);
    expect(byLabel.get("Bottom stroke weight")?.value).toBe(3);
    expect(byLabel.get("Left stroke weight")?.value).toBe(4);
    expect(byLabel.get("Path trim start")).toMatchObject({ value: 10, min: 0, max: 100, suffix: "%", keyframe: customStroke.keyframes?.pathTrimStart });
    expect(byLabel.get("Path trim end")).toMatchObject({ value: 90, min: 0, max: 100, suffix: "%", keyframe: customStroke.keyframes?.pathTrimEnd });

    const tooltips = renderer.root.findAllByType(Tooltip).map(tooltip => tooltip.props.label);
    expect(tooltips).toEqual(expect.arrayContaining(["Path trim start", "Path trim end"]));
    act(() => renderer.unmount());
  });

  it("emits identity-preserving patches for a Custom side and Path trim", () => {
    const onUpdateStroke = vi.fn();
    const renderer = renderStroke(onUpdateStroke);
    const inputs = renderer.root.findAllByType(NumericInput);
    const top = inputs.find(input => input.props.ariaLabel === "Top stroke weight")!;
    const end = inputs.find(input => input.props.ariaLabel === "Path trim end")!;

    act(() => top.props.onChange(7));
    expect(onUpdateStroke).toHaveBeenCalledWith("stroke-1", {
      edgeWeights: { top: 7, right: 2, bottom: 3, left: 4 },
    });
    act(() => end.props.onChange(75));
    expect(onUpdateStroke).toHaveBeenCalledWith("stroke-1", { pathTrimEnd: 75 });
    act(() => customStroke.keyframes?.weight.onToggle());
    expect(customStroke.keyframes?.weight.onToggle).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });

  it("exposes a radio menu and emits a controlled side-mode change", () => {
    const onUpdateStroke = vi.fn();
    const renderer = renderStroke(onUpdateStroke);
    const popover = renderer.root.findAllByType(PopoverMenu).find(candidate =>
      candidate.props.trigger?.props?.label === "Stroke sides: Custom",
    )!;
    const close = vi.fn();
    const menu = popover.props.children(close);
    let menuRenderer: ReactTestRenderer;
    act(() => { menuRenderer = create(menu); });
    const rows = menuRenderer!.root.findAllByType(MenuRow);

    expect(rows).toHaveLength(6);
    expect(rows.every(row => row.props.selectionRole === "radio")).toBe(true);
    expect(rows.find(row => row.props.label === "Custom")?.props.checked).toBe(true);
    const custom = rows.find(row => row.props.label === "Custom")!;
    expect(custom.props.leading.type).toBe(Settings2);
    expect(custom.props.leading.props["data-icon-semantic"]).toBe("settings");
    act(() => rows.find(row => row.props.label === "Top")!.props.onClick());
    expect(onUpdateStroke).toHaveBeenCalledWith("stroke-1", { weightMode: "top" });
    expect(close).toHaveBeenCalledOnce();

    act(() => menuRenderer!.unmount());
    act(() => renderer.unmount());
  });

  it("keeps two 24px trailing control slots after the Path trim fields", () => {
    const renderer = renderStroke();
    const row = renderer.root.findByProps({ "data-composa-path-trim-row": true });
    const slots = row.findAllByProps({ "data-composa-trailing-control-slot": true });

    expect(row.findAllByType(NumericInput).map(input => input.props.ariaLabel)).toEqual([
      "Path trim start",
      "Path trim end",
    ]);
    expect(slots).toHaveLength(2);
    expect(slots.every(slot => slot.props.className.includes("size-[24px]") && slot.props.className.includes("shrink-0"))).toBe(true);
    act(() => renderer.unmount());
  });
});
