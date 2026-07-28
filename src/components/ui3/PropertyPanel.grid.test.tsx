import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { PanelActionBtn, PanelSection } from "./Panel";
import { AlignmentControl } from "./AlignmentControl";
import { PropertyPanel, type ElementGridSettings, type ElementLayoutSettings } from "./PropertyPanel";

// Grid Phase A inspector contract (grid-and-wrap-spec §3 / §5 Reading A).
// The track editor is DESIGN-SENSITIVE — these tests pin the CONTRACT (what patches
// the app receives), not pixel layout, which the owner will refine.

const grid = (overrides: Partial<ElementGridSettings> = {}): ElementGridSettings => ({
  rows: [{ mode: "fixed", size: 100 }, { mode: "fixed", size: 100 }],
  columns: [{ mode: "fixed", size: 100 }, { mode: "fixed", size: 100 }],
  rowGap: 10, columnGap: 10,
  justifyItems: "start", alignItems: "start", justifyContent: "start", alignContent: "start",
  ...overrides,
});

const layout = (g: ElementGridSettings): ElementLayoutSettings => ({
  mode: "grid", gap: 0, grid: g, padding: { top: 0, right: 0, bottom: 0, left: 0 },
  align: "tl", widthMode: "fixed", heightMode: "fixed", clipsContent: false,
});

function renderGrid(onLayoutChange = vi.fn(), g: ElementGridSettings = grid()) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<PropertyPanel mode="element" elementType="frame-grid" layout={layout(g)} onLayoutChange={onLayoutChange} />); });
  return { renderer: renderer!, onLayoutChange };
}

const actionByLabel = (renderer: ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(PanelActionBtn).find(node => node.props.label === label);

describe("grid inspector — section presence", () => {
  it("renders a distinct Grid section (not the auto-layout or freeform section)", () => {
    const { renderer } = renderGrid();
    const titles = renderer.root.findAllByType(PanelSection).map(node => node.props.title);
    expect(titles).toContain("Grid");
    expect(titles).not.toContain("Auto layout");
  });
});

describe("grid inspector — track editing contract", () => {
  it("Add column appends a hug track through onLayoutChange", () => {
    const { renderer, onLayoutChange } = renderGrid();
    act(() => actionByLabel(renderer, "Add column")!.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ columns: [
      { mode: "fixed", size: 100 }, { mode: "fixed", size: 100 }, { mode: "hug", size: 100 },
    ] }) });
  });

  it("Add row appends a hug track", () => {
    const { renderer, onLayoutChange } = renderGrid();
    act(() => actionByLabel(renderer, "Add row")!.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ rows: [
      { mode: "fixed", size: 100 }, { mode: "fixed", size: 100 }, { mode: "hug", size: 100 },
    ] }) });
  });

  it("Remove column drops that track (kept enabled while more than one remains)", () => {
    const { renderer, onLayoutChange } = renderGrid();
    const remove = actionByLabel(renderer, "Remove column 2")!;
    expect(remove.props.disabled).toBe(false);
    act(() => remove.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ columns: [{ mode: "fixed", size: 100 }] }) });
  });

  it("never lets the last column be removed (min one track per axis)", () => {
    const { renderer } = renderGrid(vi.fn(), grid({ columns: [{ mode: "fixed", size: 120 }] }));
    expect(actionByLabel(renderer, "Remove column 1")!.props.disabled).toBe(true);
  });
});

describe("grid inspector — remove + alignment mapping", () => {
  it("Remove grid returns the frame to freeform (mode: none)", () => {
    const { renderer, onLayoutChange } = renderGrid();
    act(() => actionByLabel(renderer, "Remove grid")!.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ mode: "none" });
  });

  it("the item-alignment 3×3 maps a cell code to justify/align items", () => {
    const { renderer, onLayoutChange } = renderGrid();
    // First AlignmentControl is item alignment; center-center → both center.
    const itemsControl = renderer.root.findAllByType(AlignmentControl)[0];
    act(() => itemsControl.props.onChange("mc"));
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ justifyItems: "center", alignItems: "center" }) });
  });

  it("reflects the current item alignment on the control", () => {
    const { renderer } = renderGrid(vi.fn(), grid({ justifyItems: "end", alignItems: "start" }));
    const itemsControl = renderer.root.findAllByType(AlignmentControl)[0];
    expect(itemsControl.props.value).toBe("tr"); // top(align start) + right(justify end)
  });
});
