import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ProposedLayoutPanelLeftCheck, ProposedLayoutPanelLeftPlus } from "../../icons/proposed-lucide";
import { composaIconSemantics } from "./IconSemantics";
import { NumericComboInput, NumericInput } from "./Input";
import { PanelActionBtn, PanelFieldRow } from "./Panel";
import { PropertyPanel, type ElementGridSettings, type ElementLayoutSettings } from "./PropertyPanel";

// Owner feedback Composa#661 (auto-layout inspector). Each block below pins the
// specific failure the owner reported, scoped to the control it is about — a
// whole-tree match would pass on any panel that happens to contain the string.

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const autoLayout = (overrides: Partial<ElementLayoutSettings> = {}): ElementLayoutSettings => ({
  mode: "horizontal", gap: 12,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  align: "mc", widthMode: "fixed", heightMode: "fixed", clipsContent: false,
  ...overrides,
});

const gridSettings: ElementGridSettings = {
  rows: [{ id: "row-1", mode: "fixed", size: 100 }], columns: [{ id: "column-1", mode: "fixed", size: 100 }],
  rowGap: 10, columnGap: 10,
  justifyItems: "start", alignItems: "start", justifyContent: "start", alignContent: "start",
};

/** The group wrapper for a labelled inspector row — the scope every assertion needs. */
function group(root: ReactTestInstance, label: string) {
  return root.find(node => node.props.role === "group" && node.props["aria-label"] === label);
}

function segment(scope: ReactTestInstance, label: string) {
  return scope.find(node => node.type === "button" && node.props["aria-label"] === label);
}

function action(renderer: ReactTestRenderer, label: string) {
  return renderer.root.findAllByType(PanelActionBtn).find(node => node.props.label === label);
}

function layoutLandmarks(root: ReactTestInstance) {
  return root.findAll(node =>
    (node.type === PanelFieldRow && ["Flow", "Dimensions"].includes(node.props.label)) ||
    (node.props.role === "group" && ["Flow", "Alignment and gap", "Grid and gap"].includes(node.props["aria-label"])),
  ).map(node => node.type === PanelFieldRow ? node.props.label as string : node.props["aria-label"] as string);
}

describe("Active layout row order (#193)", () => {
  it.each([
    ["vertical", autoLayout({ mode: "vertical" }), ["Flow", "Dimensions", "Alignment and gap"]],
    ["horizontal", autoLayout({ mode: "horizontal" }), ["Flow", "Dimensions", "Alignment and gap"]],
    ["wrap", autoLayout({ mode: "horizontal", wrap: true, rowGap: 20 }), ["Flow", "Dimensions", "Alignment and gap"]],
    ["grid", autoLayout({ mode: "grid", grid: gridSettings }), ["Flow", "Dimensions", "Grid and gap"]],
  ] as const)("places Dimensions exactly once immediately after Flow for %s", (_name, layout, expected) => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType={layout.mode === "grid" ? "frame-grid" : "frame-auto"} layout={layout} />); });
    expect(layoutLandmarks(renderer!.root)).toEqual(expected);
    expect(renderer!.root.findAllByType(PanelFieldRow).filter(node => node.props.label === "Dimensions")).toHaveLength(1);
    act(() => renderer!.unmount());
  });

  it("leaves plain-frame and non-frame Dimensions topology unchanged", () => {
    let frame: ReactTestRenderer, shape: ReactTestRenderer;
    act(() => {
      frame = create(<PropertyPanel elementType="frame" />);
      shape = create(<PropertyPanel elementType="shape" />);
    });
    expect(layoutLandmarks(frame!.root)).toEqual(["Flow", "Dimensions"]);
    expect(layoutLandmarks(shape!.root)).toEqual(["Dimensions"]);
    expect(frame!.root.findAllByType(PanelFieldRow).filter(node => node.props.label === "Dimensions")).toHaveLength(1);
    expect(shape!.root.findAllByType(PanelFieldRow).filter(node => node.props.label === "Dimensions")).toHaveLength(1);
    act(() => { frame!.unmount(); shape!.unmount(); });
  });
});

describe("Flow is a four-way layout-mode selector (Composa#661 item 1)", () => {
  it("offers Grid as the fourth segment of the auto-layout Flow control and emits the grid mode", () => {
    const onLayoutChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto" layout={autoLayout()} onLayoutChange={onLayoutChange} />); });
    const flow = group(renderer!.root, "Flow");
    // Scoped to the Flow group: Grid must be a *segment*, not a header action.
    expect(flow.findAll(node => node.type === "button" && node.props["data-composa-segment"]).map(node => node.props["aria-label"]))
      .toEqual(["Freeform", "Vertical", "Horizontal", "Grid"]);
    act(() => segment(flow, "Grid").props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ mode: "grid" });
    act(() => renderer!.unmount());
  });

  it("offers Grid as the fourth segment of the plain-frame Flow control", () => {
    const onLayoutChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame" onLayoutChange={onLayoutChange} />); });
    const grid = renderer!.root.find(node => node.type === "button" && node.props["aria-label"] === "Grid");
    act(() => grid.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ mode: "grid" });
    act(() => renderer!.unmount());
  });

  it("keeps explicit plain-frame directions distinct from the generic inferred toggle", () => {
    const onLayoutChange = vi.fn();
    const onAutoLayoutEnable = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame" onLayoutChange={onLayoutChange} onAutoLayoutEnable={onAutoLayoutEnable} />); });
    act(() => renderer!.root.find(node => node.type === "button" && node.props["aria-label"] === "Horizontal").props.onClick());
    expect(onLayoutChange).toHaveBeenLastCalledWith({ mode: "horizontal" });
    act(() => renderer!.unmount());

    act(() => { renderer = create(<PropertyPanel elementType="frame" onLayoutChange={onLayoutChange} onAutoLayoutEnable={onAutoLayoutEnable} />); });
    act(() => renderer!.root.find(node => node.type === "button" && node.props["aria-label"] === "Vertical").props.onClick());
    expect(onLayoutChange).toHaveBeenLastCalledWith({ mode: "vertical" });
    expect(onAutoLayoutEnable).not.toHaveBeenCalled();
    act(() => renderer!.unmount());

    act(() => { renderer = create(<PropertyPanel elementType="frame" onLayoutChange={onLayoutChange} onAutoLayoutEnable={onAutoLayoutEnable} />); });
    act(() => action(renderer!, "Add auto-layout")!.props.onClick());
    expect(onAutoLayoutEnable).toHaveBeenCalledTimes(1);
    act(() => renderer!.unmount());
  });

  it("keeps the Flow control on screen with Grid selected once the frame IS a grid", () => {
    // Before #661 choosing Grid swapped in a Grid section with no Flow control at
    // all, so the fourth option was a one-way door that hid itself.
    const onLayoutChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-grid"
      layout={autoLayout({ mode: "grid", grid: gridSettings })} onLayoutChange={onLayoutChange} />); });
    const flow = group(renderer!.root, "Flow");
    expect(segment(flow, "Grid").props["aria-pressed"]).toBe(true);
    act(() => segment(flow, "Horizontal").props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ mode: "horizontal" });
    act(() => renderer!.unmount());
  });

  it("frees the auto-layout header slot the grid side door used to occupy", () => {
    const auto = renderToStaticMarkup(<PropertyPanel elementType="frame-auto" layout={autoLayout()} onLayoutChange={() => undefined} />);
    // Positive control first: the header gutter still renders an action.
    expect(auto).toContain('aria-label="Remove auto-layout"');
    // "Switch to grid" occupied this slot; grid is reached from Flow now.
    expect(auto).not.toContain('aria-label="Switch to grid"');
    // Grid is only a Flow mode: plain frames must not expose a second Add-grid
    // side door that creates a sibling section/dialog topology.
    expect(renderToStaticMarkup(<PropertyPanel elementType="frame" />)).not.toContain('aria-label="Add grid"');
  });
});

describe("Wrapped gap placement (Composa#661 item 2)", () => {
  it("renders the row gap inside the Alignment-and-gap row, not on its own row below it", () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ wrap: true, rowGap: 24 })} onLayoutChange={() => undefined} />); });
    const alignmentAndGap = group(renderer!.root, "Alignment and gap");
    // Scoped: the row gap field must live INSIDE the alignment/gap row…
    expect(alignmentAndGap.findAllByType(NumericInput).filter(node => node.props.ariaLabel === "Row gap")).toHaveLength(1);
    expect(alignmentAndGap.findAllByType(NumericComboInput).filter(node => node.props.ariaLabel === "Gap")).toHaveLength(1);
    // …and there must be no separate "Row gap" row left behind.
    expect(renderer!.root.findAll(node => node.props.role === "group" && node.props["aria-label"] === "Row gap")).toHaveLength(0);
    act(() => renderer!.unmount());
  });

  it("drops the unexplained link action that sat beside the row gap", () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ wrap: true, rowGap: 24 })} onLayoutChange={() => undefined} />); });
    // Positive control: a row gap field IS rendered (so the absence below is real)
    // and the header/settings action buttons ARE reachable from this scope.
    expect(renderer!.root.findAllByType(NumericInput).filter(node => node.props.ariaLabel === "Row gap")).toHaveLength(1);
    expect(renderer!.root.findAllByType(PanelActionBtn).length).toBeGreaterThan(0);
    expect(renderer!.root.findAllByType(PanelActionBtn)
      .map(node => String(node.props.label))
      .filter(label => /item and row gap/.test(label))).toEqual([]);
    act(() => renderer!.unmount());
  });

  it("keeps the item gap and the row gap independent now that nothing links them", () => {
    const onLayoutChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ wrap: true, rowGap: 24 })} onLayoutChange={onLayoutChange} />); });
    const alignmentAndGap = group(renderer!.root, "Alignment and gap");
    const gap = alignmentAndGap.findAllByType(NumericComboInput).find(node => node.props.ariaLabel === "Gap")!;
    const rowGap = alignmentAndGap.findAllByType(NumericInput).find(node => node.props.ariaLabel === "Row gap")!;
    act(() => gap.props.onChange(30));
    act(() => rowGap.props.onChange(6));
    expect(onLayoutChange.mock.calls.map(call => call[0])).toEqual([{ gap: 30 }, { rowGap: 6 }]);
    act(() => renderer!.unmount());
  });
});

describe("Auto-layout gap keyframe affordances (#625)", () => {
  const control = () => ({ active: false, onToggle: vi.fn() });

  it("projects fixed item and wrapped row-gap diamonds", () => {
    const item = control(), row = control();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ wrap: true, rowGap: 24 })}
      keyframeControls={{ layoutGap: item, layoutCounterGap: row }} />); });
    const scope = group(renderer!.root, "Alignment and gap");
    expect(scope.findByType(NumericComboInput).props.keyframe).toBe(item);
    expect(scope.findAllByType(NumericInput).find(node => node.props.ariaLabel === "Row gap")!.props.keyframe).toBe(row);
    act(() => scope.findByType(NumericComboInput).props.keyframe.onToggle());
    act(() => scope.findAllByType(NumericInput).find(node => node.props.ariaLabel === "Row gap")!.props.keyframe.onToggle());
    expect(item.onToggle).toHaveBeenCalledOnce();
    expect(row.onToggle).toHaveBeenCalledOnce();
    act(() => renderer!.unmount());
  });

  it("omits the item-gap diamond while spacing is Auto", () => {
    const item = control();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ gap: "auto" })} keyframeControls={{ layoutGap: item }} />); });
    expect(group(renderer!.root, "Alignment and gap").findByType(NumericComboInput).props.keyframe).toBeUndefined();
    act(() => renderer!.unmount());
  });

  it("projects independent Grid column-gap and row-gap diamonds", () => {
    const column = control(), row = control();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-grid"
      layout={autoLayout({ mode: "grid", grid: gridSettings })}
      keyframeControls={{ gridColumnGap: column, gridRowGap: row }} />); });
    const scope = group(renderer!.root, "Grid and gap");
    expect(scope.findAllByType(NumericInput).find(node => node.props.ariaLabel === "Column gap")!.props.keyframe).toBe(column);
    expect(scope.findAllByType(NumericInput).find(node => node.props.ariaLabel === "Row gap")!.props.keyframe).toBe(row);
    act(() => renderer!.unmount());
  });
});

describe("Auto-layout physical padding keyframe affordances (#760)", () => {
  const control = () => ({ active: false, onToggle: vi.fn() });

  it("expands equal padding into four independently targeted diamond fields", () => {
    const top = control(), right = control(), bottom = control(), left = control();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ padding: { top: 16, right: 16, bottom: 16, left: 16 } })}
      keyframeControls={{ paddingTop: top, paddingRight: right, paddingBottom: bottom, paddingLeft: left }} />); });

    const fields = renderer!.root.findAllByType(NumericInput);
    const expected = [["Top padding", top], ["Right padding", right], ["Bottom padding", bottom], ["Left padding", left]] as const;
    for (const [label, keyframe] of expected) {
      const field = fields.find(node => node.props.ariaLabel === label)!;
      expect(field.props.keyframe).toBe(keyframe);
      act(() => field.props.keyframe.onToggle());
      expect(keyframe.onToggle).toHaveBeenCalledOnce();
    }
    expect(fields.some(node => node.props.ariaLabel === "Vertical padding")).toBe(false);
    expect(fields.some(node => node.props.ariaLabel === "Horizontal padding")).toBe(false);
    act(() => renderer!.unmount());
  });

  it("keeps aggregate padding fields diamond-free without host edge controls", () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ padding: { top: 16, right: 16, bottom: 16, left: 16 } })} />); });
    const fields = renderer!.root.findAllByType(NumericInput);
    expect(fields.find(node => node.props.ariaLabel === "Vertical padding")!.props.keyframe).toBeUndefined();
    expect(fields.find(node => node.props.ariaLabel === "Horizontal padding")!.props.keyframe).toBeUndefined();
    act(() => renderer!.unmount());
  });
});

describe("Auto-layout header toggle (Composa#661 item 4)", () => {
  it("wires Resize to fit through the Shrink semantic", () => {
    const onResizeToFit = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame" onResizeToFit={onResizeToFit} />); });
    const trigger = action(renderer!, "Resize to fit")!;
    expect(trigger.props.icon.props["data-icon-semantic"]).toBe("resize-to-fit");
    act(() => trigger.props.onClick());
    expect(onResizeToFit).toHaveBeenCalledOnce();
    act(() => renderer!.unmount());
  });

  it("recombines differing padding from Top and Right", () => {
    const onPaddingChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ padding: { top: 3, right: 7, bottom: 11, left: 13 } })}
      onPaddingChange={onPaddingChange} />); });
    const combine = action(renderer!, "Combine padding")!;
    expect(combine.props.disabled).toBe(false);
    act(() => combine.props.onClick());
    expect(onPaddingChange).toHaveBeenCalledWith({ top: 3, right: 7, bottom: 3, left: 7 }, ["bottom", "left"]);
    act(() => renderer!.update(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ padding: { top: 3, right: 7, bottom: 3, left: 7 } })}
      onPaddingChange={onPaddingChange} />));
    const horizontal = renderer!.root.findAllByType(NumericInput).find(node => node.props.ariaLabel === "Horizontal padding")!;
    expect(horizontal.props.value).toBe(7);
    act(() => renderer!.unmount());
  });

  it("pins the toggle faces to the lucide panel-plus / panel-check glyphs", () => {
    expect(composaIconSemantics["auto-layout-add"]).toBe(ProposedLayoutPanelLeftPlus);
    expect(composaIconSemantics["auto-layout-frame"]).toBe(ProposedLayoutPanelLeftCheck);
  });

  it("wears panel-plus while auto layout is OFF", () => {
    const html = renderToStaticMarkup(<PropertyPanel elementType="frame" />);
    const trigger = html.match(/<button[^>]*aria-label="Add auto-layout"[\s\S]*?<\/button>/)?.[0];
    expect(trigger).toBeTruthy();
    expect(trigger).toContain('data-icon-semantic="auto-layout-add"');
    expect(trigger).not.toContain("lucide-plus");
  });

  it("wears panel-check while auto layout is ON, and actually turns it off", () => {
    const onLayoutChange = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto" layout={autoLayout()} onLayoutChange={onLayoutChange} />); });
    const toggle = action(renderer!, "Remove auto-layout")!;
    expect(toggle.props.selected).toBe(true);
    expect(toggle.props.icon.props["data-icon-semantic"]).toBe("auto-layout-frame");
    // An icon-only header button with no handler would be an inert promise.
    act(() => toggle.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ mode: "none" });
    act(() => renderer!.unmount());
  });

  it("uses the shared brand-selected treatment for Wrap and expanded padding", () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto"
      layout={autoLayout({ wrap: true, padding: { top: 3, right: 7, bottom: 11, left: 13 } })}
      onLayoutChange={() => undefined} onPaddingChange={() => undefined} />); });
    expect(action(renderer!, "Wrap")!.props.selected).toBe(true);
    expect(action(renderer!, "Combine padding")!.props.selected).toBe(true);
    act(() => renderer!.unmount());
  });
});
