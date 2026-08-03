import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { GridDimensionsPicker } from "./GridDimensionsPicker";
import { NumericComboInput } from "./Input";
import { PopoverMenu } from "./Menu";
import { PropertyPanel, type ElementGridSettings, type ElementLayoutSettings } from "./PropertyPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const grid: ElementGridSettings = {
  rows: [{ mode: "hug", size: 100 }],
  columns: [{ mode: "hug", size: 100 }, { mode: "hug", size: 100 }, { mode: "hug", size: 100 }],
  rowGap: 10, columnGap: 10,
  justifyItems: "start", alignItems: "start", justifyContent: "start", alignContent: "start",
};
const layout: ElementLayoutSettings = { mode: "grid", grid, gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 }, align: "tl", widthMode: "fixed", heightMode: "fixed", clipsContent: false };

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
});
