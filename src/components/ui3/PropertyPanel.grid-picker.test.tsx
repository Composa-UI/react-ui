import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { GridDimensionsPicker } from "./GridDimensionsPicker";
import { NumericComboInput } from "./Input";
import { PopoverMenu } from "./Menu";
import { PanelActionBtn } from "./Panel";
import { PropertyPanel, type ElementGridSettings, type ElementLayoutSettings } from "./PropertyPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const grid: ElementGridSettings = {
  rows: [{ id: "row-1", mode: "hug", size: 100 }],
  columns: [{ id: "column-1", mode: "hug", size: 100 }, { id: "column-2", mode: "hug", size: 100 }, { id: "column-3", mode: "hug", size: 100 }],
  rowGap: 10, columnGap: 10,
  justifyItems: "start", alignItems: "start", justifyContent: "start", alignContent: "start",
};
const layout: ElementLayoutSettings = { mode: "grid", grid, gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 }, align: "tl", widthMode: "fixed", heightMode: "fixed", clipsContent: false };

function renderPickerMenu(value = grid, onChange = vi.fn(), onAddTrack = vi.fn()) {
  let picker: ReactTestRenderer;
  act(() => { picker = create(<GridDimensionsPicker grid={value} onChange={onChange} onAddTrack={onAddTrack} />); });
  const popover = picker!.root.findByType(PopoverMenu);
  let menu: ReactTestRenderer;
  act(() => { menu = create(popover.props.children(() => undefined)); });
  return { picker: picker!, menu: menu!, onChange, onAddTrack };
}

describe("Grid dimensions picker", () => {
  it("opens dimensions editing through the picker contract", () => {
    const onLayoutChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel mode="element" elementType="frame-grid" layout={layout} onLayoutChange={onLayoutChange} />); });
    const picker = renderer!.root.findByType(GridDimensionsPicker);
    let renderedPicker: ReactTestRenderer;
    act(() => { renderedPicker = create(<GridDimensionsPicker grid={grid} onChange={picker.props.onChange} />); });
    const popover = renderedPicker!.root.findByType(PopoverMenu);
    const menu = popover.props.children(() => undefined);
    let menuRenderer: ReactTestRenderer;
    act(() => { menuRenderer = create(menu); });
    expect(menuRenderer!.root.findAllByType(NumericComboInput).map(field => field.props.ariaLabel)).toEqual([
      "Column 1 size", "Column 2 size", "Column 3 size", "Row 1 size",
    ]);
    act(() => menuRenderer!.root.findAllByType(NumericComboInput)[0].props.onChange(120));
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: { ...grid, columns: [{ ...grid.columns[0], mode: "fixed", size: 120 }, ...grid.columns.slice(1)] } });
    act(() => { menuRenderer!.unmount(); renderedPicker!.unmount(); renderer!.unmount(); });
  });

  it("delegates column creation to the host without manufacturing document identity", () => {
    const { picker, menu, onChange, onAddTrack } = renderPickerMenu();
    act(() => menu.root.findAllByType(PanelActionBtn).find(action => action.props.label === "Add column")!.props.onClick());
    expect(onAddTrack).toHaveBeenCalledWith("column");
    expect(onChange).not.toHaveBeenCalled();
    act(() => { menu.unmount(); picker.unmount(); });
  });

  it("delegates row creation to the host without manufacturing document identity", () => {
    const { picker, menu, onChange, onAddTrack } = renderPickerMenu();
    act(() => menu.root.findAllByType(PanelActionBtn).find(action => action.props.label === "Add row")!.props.onClick());
    expect(onAddTrack).toHaveBeenCalledWith("row");
    expect(onChange).not.toHaveBeenCalled();
    act(() => { menu.unmount(); picker.unmount(); });
  });

  it("disables creation when the host does not provide a semantic add callback", () => {
    let picker: ReactTestRenderer;
    act(() => { picker = create(<GridDimensionsPicker grid={grid} onChange={() => undefined} />); });
    const popover = picker!.root.findByType(PopoverMenu);
    let menu: ReactTestRenderer;
    act(() => { menu = create(popover.props.children(() => undefined)); });
    expect(menu!.root.findAllByType(PanelActionBtn).find(action => action.props.label === "Add column")!.props.disabled).toBe(true);
    expect(menu!.root.findAllByType(PanelActionBtn).find(action => action.props.label === "Add row")!.props.disabled).toBe(true);
    act(() => { menu!.unmount(); picker!.unmount(); });
  });

  it("forwards the PropertyPanel semantic add seam", () => {
    const onAddGridTrack = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-grid" layout={layout} onAddGridTrack={onAddGridTrack} />); });
    expect(renderer!.root.findByType(GridDimensionsPicker).props.onAddTrack).toBe(onAddGridTrack);
    act(() => renderer!.unmount());
  });

  it("removes one selected track while preserving its siblings", () => {
    const { picker, menu, onChange } = renderPickerMenu();
    act(() => menu.root.findAllByType(PanelActionBtn).find(action => action.props.label === "Remove column 2")!.props.onClick());
    expect(onChange).toHaveBeenCalledWith({ columns: [grid.columns[0], grid.columns[2]] });
    act(() => { menu.unmount(); picker.unmount(); });
  });

  it("never exposes removal of the last row", () => {
    const { picker, menu } = renderPickerMenu();
    expect(menu.root.findAllByType(PanelActionBtn).find(action => action.props.label === "Remove row 1")!.props.disabled).toBe(true);
    act(() => { menu.unmount(); picker.unmount(); });
  });

  it("caps each track axis at six entries", () => {
    const six = Array.from({ length: 6 }, (_, index) => ({ id: `track-${index}`, mode: "hug" as const, size: 100 }));
    const { picker, menu } = renderPickerMenu({ ...grid, columns: six, rows: six });
    const actions = menu.root.findAllByType(PanelActionBtn);
    expect(actions.find(action => action.props.label === "Add column")!.props.disabled).toBe(true);
    expect(actions.find(action => action.props.label === "Add row")!.props.disabled).toBe(true);
    act(() => { menu.unmount(); picker.unmount(); });
  });

  it("shows a diamond only for a Fixed track and keys it by stable track id", () => {
    const fixed = { ...grid, columns: [{ ...grid.columns[0], mode: "fixed" as const, size: 120 }, ...grid.columns.slice(1)] };
    const fixedControl = { active: true, onToggle: vi.fn() };
    let picker: ReactTestRenderer;
    act(() => { picker = create(<GridDimensionsPicker grid={fixed} keyframes={{ "column-1": fixedControl, "column-2": { active: false, onToggle: vi.fn() } }} />); });
    const popover = picker!.root.findByType(PopoverMenu);
    let menu: ReactTestRenderer;
    act(() => { menu = create(popover.props.children(() => undefined)); });
    const fields = menu!.root.findAllByType(NumericComboInput);
    expect(fields.find(field => field.props.ariaLabel === "Column 1 size")!.props.keyframe).toBe(fixedControl);
    expect(fields.find(field => field.props.ariaLabel === "Column 2 size")!.props.keyframe).toBeUndefined();
    expect(fields.find(field => field.props.ariaLabel === "Row 1 size")!.props.keyframe).toBeUndefined();
    act(() => { menu!.unmount(); picker!.unmount(); });
  });
});
