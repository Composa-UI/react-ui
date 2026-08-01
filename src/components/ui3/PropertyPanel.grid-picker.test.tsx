import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { AlignmentControl } from "./AlignmentControl";
import { NumericComboInput, NumericInput } from "./Input";
import { PanelSegmentedRow } from "./Panel";
import { SegmentedControl } from "./SegmentedControl";
import { PropertyPanel, type ElementGridSettings, type ElementLayoutSettings } from "./PropertyPanel";

// Iteration-3 owner feedback on the grid work (RP-16, and RP-15's Flow row).
// Verbatim:
//   • "Grid icon unchanged. No trailing action space or element beside segmented
//      control when state is in grid."
//   • "Row gap does not need a title row gap. Column gap can just say Gap."
//   • "Alignment picker does not change to grid picker."
//
// Every assertion here is scoped to the group/control it is about, and every
// ABSENCE is preceded by a positive assertion that the container rendered — a
// whole-tree match would pass vacuously on a panel that rendered nothing.

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const gridSettings = (overrides: Partial<ElementGridSettings> = {}): ElementGridSettings => ({
  rows: [{ mode: "fixed", size: 100 }, { mode: "fixed", size: 100 }],
  columns: [{ mode: "fixed", size: 100 }, { mode: "fixed", size: 100 }],
  rowGap: 10, columnGap: 10,
  justifyItems: "start", alignItems: "start", justifyContent: "start", alignContent: "start",
  ...overrides,
});

const gridLayout = (): ElementLayoutSettings => ({
  mode: "grid", gap: 0, grid: gridSettings(), padding: { top: 0, right: 0, bottom: 0, left: 0 },
  align: "tl", widthMode: "fixed", heightMode: "fixed", clipsContent: false,
});

const autoLayout = (overrides: Partial<ElementLayoutSettings> = {}): ElementLayoutSettings => ({
  mode: "horizontal", gap: 12, padding: { top: 0, right: 0, bottom: 0, left: 0 },
  align: "mc", widthMode: "fixed", heightMode: "fixed", clipsContent: false,
  ...overrides,
});

function group(root: ReactTestInstance, label: string) {
  return root.find(node => node.props.role === "group" && node.props["aria-label"] === label);
}

function renderPanel(element: React.ReactElement) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(element); });
  return renderer!;
}

const gridPanel = () =>
  renderPanel(<PropertyPanel mode="element" elementType="frame-grid" layout={gridLayout()} onLayoutChange={() => undefined} />);
const autoPanel = (overrides: Partial<ElementLayoutSettings> = {}) =>
  renderPanel(<PropertyPanel mode="element" elementType="frame-auto" layout={autoLayout(overrides)} onLayoutChange={() => undefined} />);
const freeformPanel = () => renderPanel(<PropertyPanel mode="element" elementType="frame" />);

/** Every literal string rendered anywhere inside `scope`, in tree order. */
function textsIn(scope: ReactTestInstance): string[] {
  const out: string[] = [];
  const visit = (node: ReactTestInstance) => {
    for (const child of node.children) {
      if (typeof child === "string") out.push(child);
      else visit(child);
    }
  };
  visit(scope);
  return out;
}

/** Visible sub-titles that name a gap — the thing the owner asked to collapse. */
const gapTitles = (scope: ReactTestInstance) => textsIn(scope).filter(text => /gap/i.test(text));

// ── "No trailing action space or element beside segmented control when state is
//    in grid." Grid was the only flow state whose Flow row omitted the 24px right
//    gutter, so the SegmentedControl was 32px wider and all four segments resized
//    and shifted the moment Grid was picked.
describe("grid Flow row — trailing gutter is reserved like every other flow state", () => {
  const flowRowChildCount = (renderer: ReactTestRenderer) => {
    const flow = group(renderer.root, "Flow");
    // Positive control: the Flow row really rendered its selector before we count.
    expect(flow.findAllByType(SegmentedControl)).toHaveLength(1);
    return flow.children.filter(child => typeof child !== "string").length;
  };

  it("gives the grid Flow row the same number of columns as the auto-layout Flow row", () => {
    const grid = gridPanel();
    const auto = autoPanel();
    // Grid had one column (the selector) where auto-layout has two (selector +
    // gutter), so the segments were 32px wider and shifted on switching to Grid.
    expect(flowRowChildCount(grid)).toBe(flowRowChildCount(auto));
    act(() => { grid.unmount(); auto.unmount(); });
  });

  it("matches freeform, which gets the same reservation from PanelSegmentedRow by type", () => {
    // The freeform section routes its Flow row through PanelSegmentedRow, whose
    // type forbids giving the right slot up; the hand-rolled grid/auto rows have to
    // reserve it explicitly. Assert the rendered result agrees.
    const renderer = freeformPanel();
    const row = renderer.root.findAllByType(PanelSegmentedRow).find(node => node.props.label === "Flow");
    expect(row, "freeform Flow row").toBeDefined();
    expect(row!.findAllByType(SegmentedControl)).toHaveLength(1);
    expect(row!.findAll(
      node => typeof node.type === "string" && /\bmin-w-\[24px\]/.test(String(node.props.className ?? "")),
      { deep: true },
    )).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it("reserves that trailing column at the same 24px width the other sections use", () => {
    const renderer = gridPanel();
    const flow = group(renderer.root, "Flow");
    expect(flow.findAllByType(SegmentedControl)).toHaveLength(1);
    const gutters = flow.findAll(
      node => typeof node.type === "string" && /\bw-\[24px\]/.test(String(node.props.className ?? "")),
      { deep: true },
    );
    expect(gutters).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it("puts no control in it — Wrap stays a horizontal-only modifier (RP-15)", () => {
    const renderer = gridPanel();
    const flow = group(renderer.root, "Flow");
    // Positive control before the absence.
    expect(flow.findAllByType(SegmentedControl)).toHaveLength(1);
    expect(flow.findAll(node => node.type === "button" && node.props["aria-label"] === "Wrap")).toHaveLength(0);
    act(() => renderer.unmount());
  });
});

// ── "Row gap does not need a title row gap. Column gap can just say Gap."
describe("grid gap column — one 'Gap' title over the pair", () => {
  it("titles the gap column 'Gap' and gives the row gap no title of its own", () => {
    const renderer = gridPanel();
    const alignmentAndGap = group(renderer.root, "Alignment and gap");
    // Positive control: both fields ARE rendered, so the missing title below is a
    // deleted title and not a section that failed to render.
    const fields = alignmentAndGap.findAllByType(NumericInput).map(node => node.props.ariaLabel);
    expect(fields).toContain("Column gap");
    expect(fields).toContain("Row gap");
    // Exactly one visible gap sub-title, and it reads "Gap".
    expect(gapTitles(alignmentAndGap)).toEqual(["Gap"]);
    act(() => renderer.unmount());
  });

  it("keeps both gaps individually addressable to assistive tech and to tests", () => {
    const renderer = gridPanel();
    const alignmentAndGap = group(renderer.root, "Alignment and gap");
    const byLabel = (label: string) =>
      alignmentAndGap.findAllByType(NumericInput).filter(node => node.props.ariaLabel === label);
    expect(byLabel("Column gap")).toHaveLength(1);
    expect(byLabel("Row gap")).toHaveLength(1);
    // Distinct per-axis lead icons survive the title collapse.
    expect(byLabel("Column gap")[0].props.iconLead).not.toEqual(byLabel("Row gap")[0].props.iconLead);
    act(() => renderer.unmount());
  });

  it("collapses the wrapped auto-layout gap titles the same way, so the two blocks stay identical", () => {
    const renderer = autoPanel({ wrap: true, rowGap: 24 });
    const alignmentAndGap = group(renderer.root, "Alignment and gap");
    // Positive control: the wrapped block rendered both of its gap fields.
    expect(alignmentAndGap.findAllByType(NumericComboInput).filter(node => node.props.ariaLabel === "Gap")).toHaveLength(1);
    expect(alignmentAndGap.findAllByType(NumericInput).filter(node => node.props.ariaLabel === "Row gap")).toHaveLength(1);
    expect(gapTitles(alignmentAndGap)).toEqual(["Gap"]);
    act(() => renderer.unmount());
  });
});

// ── "Alignment picker does not change to grid picker. You just changed autolayout
//    to grid settings rather than creating a dedicated dialog for grid picker."
//    ONE control whose CONTENT changes — not a second picker, not a renamed dialog.
describe("alignment picker becomes a grid picker when the flow is grid (RP-16)", () => {
  it("is still exactly one picker, in the slot the auto-layout section uses", () => {
    const renderer = gridPanel();
    const alignmentAndGap = group(renderer.root, "Alignment and gap");
    expect(alignmentAndGap.findAllByType(AlignmentControl)).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it("wears the grid face there, and the stack face on auto-layout", () => {
    const grid = gridPanel();
    const auto = autoPanel();
    expect(group(grid.root, "Alignment and gap").findByType(AlignmentControl).props.variant).toBe("grid");
    expect(group(auto.root, "Alignment and gap").findByType(AlignmentControl).props.variant ?? "stack").toBe("stack");
    act(() => { grid.unmount(); auto.unmount(); });
  });

  it("actually RENDERS differently — the two faces are not the same markup", () => {
    // The pre-existing grid test asserted only ariaLabel === "Grid alignment",
    // which would pass forever with the picker unchanged. This is the assertion
    // that has teeth: compare what the control draws.
    const stack = renderToStaticMarkup(<AlignmentControl value="tl" onChange={() => undefined} />);
    const grid = renderToStaticMarkup(<AlignmentControl value="tl" onChange={() => undefined} variant="grid" />);
    // Positive control: both rendered a nine-cell radiogroup.
    for (const markup of [stack, grid]) {
      expect(markup).toContain('role="radiogroup"');
      expect(markup.match(/role="radio"/g) ?? []).toHaveLength(9);
    }
    expect(grid).not.toBe(stack);
    // Stack face = a point in a box. Grid face = a table with one cell filled.
    expect(stack).toContain("<circle");
    expect(stack).not.toContain("<rect");
    expect(grid).not.toContain("<circle");
    expect(grid).toContain("<rect");
    expect(grid).toContain('data-alignment-variant="grid"');
  });

  it("changes face inside the real panel, not just when driven directly", () => {
    const gridMarkup = renderToStaticMarkup(
      <PropertyPanel mode="element" elementType="frame-grid" layout={gridLayout()} onLayoutChange={() => undefined} />);
    const autoMarkup = renderToStaticMarkup(
      <PropertyPanel mode="element" elementType="frame-auto" layout={autoLayout()} onLayoutChange={() => undefined} />);
    // Positive control: both panels rendered an alignment picker.
    expect(gridMarkup).toContain('data-composa-component="AlignmentControl"');
    expect(autoMarkup).toContain('data-composa-component="AlignmentControl"');
    expect(gridMarkup).toContain('data-alignment-variant="grid"');
    expect(autoMarkup).not.toContain('data-alignment-variant="grid"');
    expect(autoMarkup).toContain('data-alignment-variant="stack"');
  });

  it("keeps the justifyItems/alignItems contract the app already consumes", () => {
    // The face changed; the patch shape must not, or the app-side wiring
    // (ComposaApp consumes `patch.grid`) would need a coordinated change.
    let patched: unknown;
    const renderer = renderPanel(
      <PropertyPanel mode="element" elementType="frame-grid" layout={gridLayout()}
        onLayoutChange={patch => { patched = patch; }} />);
    const picker = group(renderer.root, "Alignment and gap").findByType(AlignmentControl);
    act(() => picker.props.onChange("br"));
    expect(patched).toEqual({ grid: expect.objectContaining({ justifyItems: "end", alignItems: "end" }) });
    act(() => renderer.unmount());
  });

  it("leaves every other caller of AlignmentControl on the stack face", () => {
    // `variant` defaults to "stack", so nothing outside the grid section moves.
    expect(renderToStaticMarkup(<AlignmentControl value="mc" onChange={() => undefined} />))
      .toContain('data-alignment-variant="stack"');
  });
});
