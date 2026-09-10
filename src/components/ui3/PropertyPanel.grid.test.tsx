import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { AutoLayoutSettingsDialog } from "./AutoLayoutSettingsDialog";
import { GridDimensionsPicker } from "./GridDimensionsPicker";
import { NumericInput } from "./Input";
import { PanelActionBtn, PanelSection } from "./Panel";
import { PropertyPanel, type ElementGridSettings, type ElementLayoutSettings } from "./PropertyPanel";
import { SegmentedControl } from "./SegmentedControl";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const grid: ElementGridSettings = {
  rows: [{ id: "row-1", mode: "hug", size: 100 }],
  columns: [{ id: "column-1", mode: "hug", size: 100 }, { id: "column-2", mode: "hug", size: 100 }, { id: "column-3", mode: "hug", size: 100 }],
  rowGap: 38, columnGap: 38,
  justifyItems: "start", alignItems: "start", justifyContent: "start", alignContent: "start",
};
const layout: ElementLayoutSettings = {
  mode: "grid", grid, gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 },
  align: "tl", widthMode: "fixed", heightMode: "fixed", clipsContent: false,
};

function render(onLayoutChange = vi.fn()) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<PropertyPanel mode="element" elementType="frame-grid" layout={layout} onLayoutChange={onLayoutChange} />); });
  return { renderer: renderer!, onLayoutChange };
}

describe("Grid is one Auto-layout mode", () => {
  it("renders Auto layout, never a sibling Grid section or Add Grid action", () => {
    const { renderer } = render();
    const titles = renderer.root.findAllByType(PanelSection).map(section => section.props.title);
    expect(titles).toContain("Auto layout");
    expect(titles).not.toContain("Grid");
    expect(renderer.root.findAll(node => node.type === "button" && node.props["aria-label"] === "Add grid")).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("uses the 88×56 Grid dimensions face, one flexible gap column, and shared settings trigger", () => {
    const { renderer } = render();
    const picker = renderer.root.findByType(GridDimensionsPicker);
    expect(picker.props.grid.columns).toHaveLength(3);
    const trigger = picker.find(node => node.type === "button" && node.props["aria-label"] === "Grid dimensions: 3 × Auto");
    expect(trigger.props.className).toContain("h-[56px]");
    expect(trigger.props.className).toContain("w-[88px]");
    const gaps = renderer.root.findAllByType(NumericInput).filter(field => ["Column gap", "Row gap"].includes(field.props.ariaLabel));
    expect(gaps).toHaveLength(2);
    const row = renderer.root.find(node => node.props.role === "group" && node.props["aria-label"] === "Grid and gap");
    expect(row.findAll(node => typeof node.props.className === "string" && node.props.className.includes("flex-1 min-w-0 flex flex-col"))).toHaveLength(1);
    expect(renderer.root.findAllByType(AutoLayoutSettingsDialog)).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it("persists each authored gap independently", () => {
    const { renderer, onLayoutChange } = render();
    const fields = renderer.root.findAllByType(NumericInput);
    act(() => fields.find(field => field.props.ariaLabel === "Column gap")!.props.onChange(20));
    act(() => fields.find(field => field.props.ariaLabel === "Row gap")!.props.onChange(28));
    expect(onLayoutChange).toHaveBeenNthCalledWith(1, { grid: { ...grid, columnGap: 20 } });
    expect(onLayoutChange).toHaveBeenNthCalledWith(2, { grid: { ...grid, rowGap: 28 } });
    act(() => renderer.unmount());
  });

  it("opens one Auto layout settings dialog without unrelated Grid controls", () => {
    const { renderer } = render();
    const dialog = renderer.root.findByType(AutoLayoutSettingsDialog);
    expect(dialog.props.value.mode).toBe("grid");
    expect(dialog.props.grid).toBeUndefined();
    expect(dialog.props.onGridChange).toBeUndefined();
    act(() => renderer.unmount());
  });

  it("keeps Grid selected and uses the trailing slot for automatic positioning", () => {
    const onGridAutomaticPositioningChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel mode="element" elementType="frame-grid"
      layout={{ ...layout, grid: { ...grid, automaticPositioning: true } }}
      onGridAutomaticPositioningChange={onGridAutomaticPositioningChange} />); });
    const flow = renderer.root.find(node => node.props.role === "group" && node.props["aria-label"] === "Flow");
    expect(flow.findByType(SegmentedControl).props.value).toBe("grid");
    expect(flow.findAll(node => typeof node.props.className === "string" && node.props.className.includes("w-[24px]"))).toHaveLength(1);
    expect(flow.findAll(node => node.type === "button" && node.props["aria-label"] === "Wrap")).toHaveLength(0);
    const action = flow.findAllByType(PanelActionBtn).find(node => node.props.label === "Toggle automatic positioning")!;
    expect(action.props.selected).toBe(true);
    expect(action.props.icon.props["data-icon-semantic"]).toBe("automatic-positioning");
    expect(action.props.icon.props["data-icon-semantic"]).not.toBe("absolute-position");
    act(() => action.props.onClick());
    expect(onGridAutomaticPositioningChange).toHaveBeenCalledWith(false);
    act(() => renderer.unmount());
  });

  it("resolves mixed placement into automatic positioning instead of disabling the action", () => {
    const onGridAutomaticPositioningChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel mode="element" elementType="frame-grid"
      layout={{ ...layout, grid: { ...grid, automaticPositioning: "mixed" } }}
      onGridAutomaticPositioningChange={onGridAutomaticPositioningChange} />); });
    const action = renderer!.root.findAllByType(PanelActionBtn).find(node => node.props.label === "Toggle automatic positioning")!;
    expect(action.props.disabled).toBe(false);
    act(() => action.props.onClick());
    expect(onGridAutomaticPositioningChange).toHaveBeenCalledWith(true);
    act(() => renderer!.unmount());
  });

  it("uses one visible Gap heading while retaining two accessible gap fields", () => {
    const { renderer } = render();
    const row = renderer.root.find(node => node.props.role === "group" && node.props["aria-label"] === "Grid and gap");
    expect(row.findAll(node => node.type === "div" && node.children.length === 1 && node.children[0] === "Gap")).toHaveLength(1);
    expect(row.findAll(node => node.type === "div" && node.children.length === 1 && node.children[0] === "Row gap")).toHaveLength(0);
    expect(row.findAllByType(NumericInput).map(field => field.props.ariaLabel)).toEqual(["Column gap", "Row gap"]);
    act(() => renderer.unmount());
  });

  it("clamps each grid gap independently at zero", () => {
    const { renderer, onLayoutChange } = render();
    const fields = renderer.root.findAllByType(NumericInput);
    act(() => fields.find(field => field.props.ariaLabel === "Column gap")!.props.onChange(-20));
    act(() => fields.find(field => field.props.ariaLabel === "Row gap")!.props.onChange(-28));
    expect(onLayoutChange).toHaveBeenNthCalledWith(1, { grid: { ...grid, columnGap: 0 } });
    expect(onLayoutChange).toHaveBeenNthCalledWith(2, { grid: { ...grid, rowGap: 0 } });
    act(() => renderer.unmount());
  });

  it("returns Grid to Freeform through the same Flow selector", () => {
    const { renderer, onLayoutChange } = render();
    const flow = renderer.root.find(node => node.props.role === "group" && node.props["aria-label"] === "Flow");
    act(() => flow.findByType(SegmentedControl).props.onChange("none"));
    expect(onLayoutChange).toHaveBeenCalledWith({ mode: "none" });
    act(() => renderer.unmount());
  });
});
