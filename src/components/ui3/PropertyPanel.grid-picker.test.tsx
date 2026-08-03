import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { GridDimensionsPicker } from "./GridDimensionsPicker";
import { NumericComboInput } from "./Input";
import { PopoverMenu } from "./Menu";
import { PanelActionBtn } from "./Panel";
import { PropertyPanel, type ElementGridSettings, type ElementLayoutSettings } from "./PropertyPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const grid: ElementGridSettings = {
  rows: [{ mode: "hug", size: 100 }],
  columns: [{ mode: "hug", size: 100 }, { mode: "hug", size: 100 }, { mode: "hug", size: 100 }],
  rowGap: 10, columnGap: 10,
  justifyItems: "start", alignItems: "start", justifyContent: "start", alignContent: "start",
};
const layout: ElementLayoutSettings = { mode: "grid", grid, gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 }, align: "tl", widthMode: "fixed", heightMode: "fixed", clipsContent: false };

function renderPickerMenu(value = grid, onChange = vi.fn()) {
  let picker: ReactTestRenderer;
  act(() => { picker = create(<GridDimensionsPicker grid={value} onChange={onChange} />); });
  const popover = picker!.root.findByType(PopoverMenu);
  let menu: ReactTestRenderer;
  act(() => { menu = create(popover.props.children(() => undefined)); });
  return { picker: picker!, menu: menu!, onChange };
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
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: { ...grid, columns: [{ mode: "fixed", size: 120 }, ...grid.columns.slice(1)] } });
    act(() => { menuRenderer!.unmount(); renderedPicker!.unmount(); renderer!.unmount(); });
  });

  it("adds a hug column without rewriting existing tracks", () => {
    const { picker, menu, onChange } = renderPickerMenu();
    act(() => menu.root.findAllByType(PanelActionBtn).find(action => action.props.label === "Add column")!.props.onClick());
    expect(onChange).toHaveBeenCalledWith({ columns: [...grid.columns, { mode: "hug", size: 100 }] });
    act(() => { menu.unmount(); picker.unmount(); });
  });

  it("adds a hug row without rewriting existing tracks", () => {
    const { picker, menu, onChange } = renderPickerMenu();
    act(() => menu.root.findAllByType(PanelActionBtn).find(action => action.props.label === "Add row")!.props.onClick());
    expect(onChange).toHaveBeenCalledWith({ rows: [...grid.rows, { mode: "hug", size: 100 }] });
    act(() => { menu.unmount(); picker.unmount(); });
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
    const six = Array.from({ length: 6 }, () => ({ mode: "hug" as const, size: 100 }));
    const { picker, menu } = renderPickerMenu({ ...grid, columns: six, rows: six });
    const actions = menu.root.findAllByType(PanelActionBtn);
    expect(actions.find(action => action.props.label === "Add column")!.props.disabled).toBe(true);
    expect(actions.find(action => action.props.label === "Add row")!.props.disabled).toBe(true);
    act(() => { menu.unmount(); picker.unmount(); });
  });
});
