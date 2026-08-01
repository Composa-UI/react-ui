import { type ReactNode } from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { PanelActionBtn, PanelSection } from "./Panel";
import { AlignmentControl } from "./AlignmentControl";
import { GridSettingsDialog } from "./GridSettingsDialog";
import { PropertyPanel, type ElementGridSettings, type ElementLayoutSettings } from "./PropertyPanel";

// Grid Phase A inspector contract (grid-and-wrap-spec §3 / §5 Reading A).
// The track editor is DESIGN-SENSITIVE — these tests pin the CONTRACT (what patches
// the app receives) and the INLINE-vs-EXTERNALISED split the owner asked for
// (RP-16), not pixel layout, which the owner will refine.
//
// Radix renders no children in a bare test renderer, so the settings dialog is
// mocked to render its children in place (as AutoLayoutSettingsDialog.test.tsx
// does). That is what gives "inline vs in the dialog" assertions teeth: the
// dialog's contents ARE in the tree, so an absence from the inline section is a
// real absence rather than an artifact of Radix hiding them.
vi.mock("./InspectorDialog", async () => {
  const actual = await vi.importActual<typeof import("./InspectorDialog")>("./InspectorDialog");
  return {
    ...actual,
    InspectorDialog: ({ children, trigger }: { children: ReactNode; trigger: ReactNode }) =>
      <div data-inspector-dialog>{trigger}{children}</div>,
  };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

const actionByLabel = (scope: ReactTestInstance, label: string) =>
  scope.findAllByType(PanelActionBtn).find(node => node.props.label === label);

const alignmentControls = (scope: ReactTestInstance) => scope.findAllByType(AlignmentControl);
const panelActions = (scope: ReactTestInstance) => scope.findAllByType(PanelActionBtn);

// The settings TRIGGER lives in the inline row, so the mocked dialog renders as a
// descendant of it (the real one portals out). Every "inline" assertion therefore
// subtracts what the dialog owns rather than counting the raw subtree.
function excludingDialog<T>(renderer: ReactTestRenderer, scope: ReactTestInstance, find: (scope: ReactTestInstance) => T[]): T[] {
  const inDialog = new Set<T>(find(renderer.root.findByType(GridSettingsDialog)));
  return find(scope).filter(node => !inDialog.has(node));
}

/** What the Grid PanelSection renders itself, minus everything the dialog owns. */
function inline<T>(renderer: ReactTestRenderer, find: (scope: ReactTestInstance) => T[]): T[] {
  const section = renderer.root.findAllByType(PanelSection).find(node => node.props.title === "Grid")!;
  return excludingDialog(renderer, section, find);
}

describe("grid inspector — section presence", () => {
  it("renders a distinct Grid section (not the auto-layout or freeform section)", () => {
    const { renderer } = renderGrid();
    const titles = renderer.root.findAllByType(PanelSection).map(node => node.props.title);
    expect(titles).toContain("Grid");
    expect(titles).not.toContain("Auto layout");
  });
});

// RP-16a — "we just duplicated alignment picker into 'align items' and 'align
// content'. Wrong. The change is simpler when it's grid — the alignment picker
// changes." One picker, in the slot the auto-layout section already uses.
describe("grid inspector — one alignment picker, not two", () => {
  it("renders exactly ONE alignment control inline", () => {
    const { renderer } = renderGrid();
    expect(inline(renderer, alignmentControls)).toHaveLength(1);
  });

  it("puts that picker in the same 'Alignment and gap' group the auto-layout section uses", () => {
    const { renderer } = renderGrid();
    const groups = renderer.root.findAll(
      node => node.props?.role === "group" && node.props?.["aria-label"] === "Alignment and gap",
    );
    expect(groups).toHaveLength(1);
    expect(excludingDialog(renderer, groups[0], alignmentControls)).toHaveLength(1);
  });

  it("the one inline picker is grid ITEM alignment — it maps a cell code to justify/align items", () => {
    const { renderer, onLayoutChange } = renderGrid();
    const picker = inline(renderer, alignmentControls)[0];
    expect(picker.props.ariaLabel).toBe("Grid alignment");
    act(() => picker.props.onChange("mc"));
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ justifyItems: "center", alignItems: "center" }) });
  });

  it("reflects the current item alignment on that picker", () => {
    const { renderer } = renderGrid(vi.fn(), grid({ justifyItems: "end", alignItems: "start" }));
    // top (alignItems start) + right (justifyItems end)
    expect(inline(renderer, alignmentControls)[0].props.value).toBe("tr");
  });
});

// RP-16b/d — "we just did too much by showing the columns and grid inline rather
// than externalising it to a menu or a dedicated inspector."
describe("grid inspector — track editing is externalised, not inline", () => {
  it("offers a Grid settings entry point that opens the dialog", () => {
    const { renderer } = renderGrid();
    expect(renderer.root.findByType(GridSettingsDialog).props.open).toBe(false);
    const trigger = actionByLabel(renderer.root, "Grid settings")!;
    expect(trigger).toBeDefined();
    act(() => trigger.props.onClick());
    expect(renderer.root.findByType(GridSettingsDialog).props.open).toBe(true);
  });

  it("shows no per-track column/row editing in the inline section", () => {
    const { renderer } = renderGrid();
    // The section rendered and still owns its own actions, so the absences below
    // cannot pass because nothing rendered at all (rule 3).
    const inlineActions = inline(renderer, panelActions).map(node => node.props.label);
    expect(inlineActions).toContain("Remove grid");
    expect(inlineActions).not.toContain("Add column");
    expect(inlineActions).not.toContain("Add row");
    expect(inlineActions).not.toContain("Remove column 1");
    expect(inlineActions).not.toContain("Remove row 1");
  });

  it("keeps the two gaps inline (the auto-layout Gap / Row gap analogue)", () => {
    const { renderer, onLayoutChange } = renderGrid();
    const section = renderer.root.findAllByType(PanelSection).find(node => node.props.title === "Grid")!;
    const columnGap = section.findAll(node => node.props?.ariaLabel === "Column gap");
    expect(columnGap.length).toBeGreaterThan(0);
    // Gaps are independent — editing one axis must not rewrite the other
    // (Composa#661 item 2, the reason the wrap link toggle was removed).
    act(() => columnGap[0].props.onChange(24));
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ columnGap: 24, rowGap: 10 }) });
  });

  it("no longer offers a gap link toggle", () => {
    const { renderer } = renderGrid();
    const labels = panelActions(renderer.root).map(node => node.props.label);
    expect(labels).toContain("Grid settings");
    expect(labels).not.toContain("Link column and row gap");
    expect(labels).not.toContain("Unlink column and row gap");
  });
});

// The externalised controls must keep emitting exactly the patches the app already
// consumes (RP-16e: the ElementGridSettings shape and the onLayoutChange contract
// are preserved, so no app change is needed).
//
// The PATCH SHAPES below are regression guards, not RP-16 gates — the same
// assertions passed when these controls were inline. What makes them fail on the
// unfixed panel is only their SCOPE: they resolve the controls inside
// GridSettingsDialog, which did not exist before. Read a failure here as "the
// contract moved or broke", not as proof the externalisation happened; the
// "externalised, not inline" block above is what proves that.
describe("grid inspector — track editing contract (unchanged by the move)", () => {
  const dialogOf = (renderer: ReactTestRenderer) => renderer.root.findByType(GridSettingsDialog);

  it("Add column appends a hug track through onLayoutChange", () => {
    const { renderer, onLayoutChange } = renderGrid();
    act(() => actionByLabel(dialogOf(renderer), "Add column")!.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ columns: [
      { mode: "fixed", size: 100 }, { mode: "fixed", size: 100 }, { mode: "hug", size: 100 },
    ] }) });
  });

  it("Add row appends a hug track", () => {
    const { renderer, onLayoutChange } = renderGrid();
    act(() => actionByLabel(dialogOf(renderer), "Add row")!.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ rows: [
      { mode: "fixed", size: 100 }, { mode: "fixed", size: 100 }, { mode: "hug", size: 100 },
    ] }) });
  });

  it("Remove column drops that track (kept enabled while more than one remains)", () => {
    const { renderer, onLayoutChange } = renderGrid();
    const remove = actionByLabel(dialogOf(renderer), "Remove column 2")!;
    expect(remove.props.disabled).toBe(false);
    act(() => remove.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ columns: [{ mode: "fixed", size: 100 }] }) });
  });

  it("never lets the last column be removed (min one track per axis)", () => {
    const { renderer } = renderGrid(vi.fn(), grid({ columns: [{ mode: "fixed", size: 120 }] }));
    expect(actionByLabel(dialogOf(renderer), "Remove column 1")!.props.disabled).toBe(true);
  });

  it("content alignment moved into the dialog and still maps to justify/align content", () => {
    const { renderer, onLayoutChange } = renderGrid();
    const contentPicker = dialogOf(renderer).findByType(AlignmentControl);
    expect(contentPicker.props.ariaLabel).toBe("Grid content alignment");
    act(() => contentPicker.props.onChange("mc"));
    expect(onLayoutChange).toHaveBeenCalledWith({ grid: expect.objectContaining({ justifyContent: "center", alignContent: "center" }) });
  });
});

describe("grid inspector — remove", () => {
  it("Remove grid returns the frame to freeform (mode: none)", () => {
    const { renderer, onLayoutChange } = renderGrid();
    act(() => actionByLabel(renderer.root, "Remove grid")!.props.onClick());
    expect(onLayoutChange).toHaveBeenCalledWith({ mode: "none" });
  });
});
