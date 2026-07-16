import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { LayerList, layerDomFocusSource, layerNavigationResult, layerRowTabIndex, layerSelectionRevealSignature, nextLayerSelection, normalizeLayerDragRoots, visibleLayerRows, type LayerNode } from "./LayerList";
import { LayerTypeIcon } from "./LayerTypeIcon";
import { rowSelectionHighlightClassName } from "./RowSelectionState";

const tree: LayerNode[] = [
  { id: "frame", name: "Frame", type: "frame", children: [
    { id: "child-a", name: "A", type: "shape" },
    { id: "child-b", name: "B", type: "shape" },
  ] },
  { id: "locked", name: "Locked", type: "shape", locked: true },
  { id: "tail", name: "Tail", type: "shape" },
];

describe("LayerList drag root normalization", () => {
  it("shares emphasized, descendant, and neutral hover row-state rules", () => {
    expect(rowSelectionHighlightClassName("selected")).toContain("bg-c-bg-selected");
    expect(rowSelectionHighlightClassName("selected")).not.toContain("bg-c-bg-hover");
    expect(rowSelectionHighlightClassName("descendant")).toContain("bg-c-bg-selected/50");
    expect(rowSelectionHighlightClassName("descendant")).toContain("group-hover/selection-row:bg-c-bg-selected");
    expect(rowSelectionHighlightClassName("none")).toContain("group-hover/selection-row:bg-c-bg-hover");
  });

  it("projects a selected parent as emphasized and its children as de-emphasized", () => {
    const html = renderToStaticMarkup(createElement(LayerList, {
      layers: tree,
      selectedIds: ["frame"],
      expandedIds: ["frame"],
    }));
    expect(html).toContain('aria-selected="true" data-composa-row-state="selected"');
    expect(html.match(/data-composa-row-state="descendant"/g)).toHaveLength(2);
    expect(html).toContain("bg-c-bg-selected/50 group-hover/selection-row:bg-c-bg-selected");
  });

  it.each(["horizontal", "vertical", "wrap"] as const)("uses one canonical auto-layout-frame glyph while retaining %s mode semantics", autoLayoutMode => {
    const html = renderToStaticMarkup(createElement(LayerTypeIcon, { type: "frame", autoLayoutMode }));
    expect(html).toContain('data-icon-semantic="auto-layout-frame"');
    expect(html).toContain('data-layer-icon-type="frame"');
    expect(html).toContain(`data-auto-layout-mode="${autoLayoutMode}"`);
    expect(html).not.toMatch(/grid/i);
  });

  it("uses Frame for plain frames and SquareDashed only for compatibility groups", () => {
    const frame = renderToStaticMarkup(createElement(LayerTypeIcon, { type: "frame" }));
    const group = renderToStaticMarkup(createElement(LayerTypeIcon, { type: "group" }));
    expect(frame).toContain('data-icon-semantic="frame"');
    expect(frame).toContain("lucide-frame");
    expect(frame).toContain('width="16"');
    expect(frame).toContain('height="16"');
    expect(frame).toContain('stroke-width="1.5"');
    expect(group).toContain('data-icon-semantic="group-compatibility"');
    expect(group).toContain("lucide-square-dashed");
  });

  it("keeps component accent ownership inside the canonical icon", () => {
    const html = renderToStaticMarkup(createElement(LayerTypeIcon, { type: "component", tone: "secondary" }));
    expect(html).toContain("text-accent-component");
    expect(html).not.toContain("text-c-icon-secondary");
  });
  it("uses full tree order instead of selection click order", () => {
    expect(normalizeLayerDragRoots(tree, ["tail", "child-b", "child-a"])).toEqual(["child-a", "child-b", "tail"]);
  });

  it("collapses selected descendants beneath an ancestor even when they are not visible", () => {
    expect(normalizeLayerDragRoots(tree, ["child-b", "frame", "tail"])).toEqual(["frame", "tail"]);
  });

  it("rejects the complete multi-drag when a normalized root is locked", () => {
    expect(normalizeLayerDragRoots(tree, ["tail", "locked"])).toEqual([]);
  });

  it("sanitizes missing and duplicate identifiers", () => {
    expect(normalizeLayerDragRoots(tree, ["missing", "tail", "tail"])).toEqual(["tail"]);
  });
});

describe("LayerList visible tree keyboard contract", () => {
  it("hands the one row tab stop to its inline rename input", () => {
    expect(layerRowTabIndex(true, false)).toBe(0);
    expect(layerRowTabIndex(true, true)).toBe(-1);
    expect(layerRowTabIndex(false, false)).toBe(-1);
  });

  it("reports pointer DOM focus once while suppressing keyboard and nested-control focus", () => {
    expect(layerDomFocusSource("child-a", null, true)).toBe("pointer");
    expect(layerDomFocusSource("child-a", "child-a", true)).toBeNull();
    expect(layerDomFocusSource("child-a", null, false)).toBeNull();
  });

  it("invalidates selection reveal when an unchanged selected id gains a collapsed ancestor", () => {
    const before = visibleLayerRows([{ id: "selected", name: "Selected", type: "shape" }], []);
    const afterTree: LayerNode[] = [{ id: "target", name: "Target", type: "frame", children: [
      { id: "selected", name: "Selected", type: "shape" },
    ] }];
    const after = visibleLayerRows(afterTree, ["target"]);
    expect(layerSelectionRevealSignature(["selected"], before)).not.toBe(layerSelectionRevealSignature(["selected"], after));
    expect(layerSelectionRevealSignature(["selected"], after)).toBe("selected:target");
  });

  it("projects uncontrolled Enter, Space toggle, and Shift range selection", () => {
    const order = ["frame", "child-a", "child-b", "tail"];
    const entered = nextLayerSelection([], "child-a", { toggle: false, range: false }, order, null);
    expect(entered).toEqual({ ids: ["child-a"], anchorId: "child-a" });
    const toggled = nextLayerSelection(entered.ids, "tail", { toggle: true, range: false }, order, entered.anchorId);
    expect(toggled).toEqual({ ids: ["child-a", "tail"], anchorId: "tail" });
    expect(nextLayerSelection(toggled.ids, "child-a", { toggle: false, range: true }, order, toggled.anchorId)).toEqual({
      ids: ["child-a", "child-b", "tail"], anchorId: "tail",
    });
    expect(nextLayerSelection(toggled.ids, "tail", { toggle: true, range: false }, order, toggled.anchorId)).toEqual({
      ids: ["child-a"], anchorId: "child-a",
    });
  });

  it("flattens only expanded subtrees in visual order", () => {
    expect(visibleLayerRows(tree, []).map(row => [row.node.id, row.depth])).toEqual([
      ["frame", 0], ["locked", 0], ["tail", 0],
    ]);
    expect(visibleLayerRows(tree, ["frame"]).map(row => [row.node.id, row.depth])).toEqual([
      ["frame", 0], ["child-a", 1], ["child-b", 1], ["locked", 0], ["tail", 0],
    ]);
  });

  it("moves through visible rows and supports Home and End boundaries", () => {
    const rows = visibleLayerRows(tree, ["frame"]);
    expect(layerNavigationResult(rows, "child-a", "ArrowUp")).toEqual({ focusedId: "frame" });
    expect(layerNavigationResult(rows, "child-a", "ArrowDown")).toEqual({ focusedId: "child-b" });
    expect(layerNavigationResult(rows, "child-b", "Home")).toEqual({ focusedId: "frame" });
    expect(layerNavigationResult(rows, "child-b", "End")).toEqual({ focusedId: "tail" });
    expect(layerNavigationResult(rows, "frame", "ArrowUp")).toBeNull();
    expect(layerNavigationResult(rows, "tail", "End")).toBeNull();
  });

  it("follows the spec for disclosure and parent navigation", () => {
    const collapsed = visibleLayerRows(tree, []);
    expect(layerNavigationResult(collapsed, "frame", "ArrowRight")).toEqual({ focusedId: "frame", expandedId: "frame", expanded: true });
    expect(layerNavigationResult(collapsed, "tail", "ArrowRight")).toBeNull();

    const expanded = visibleLayerRows(tree, ["frame"]);
    expect(layerNavigationResult(expanded, "frame", "ArrowRight")).toBeNull();
    expect(layerNavigationResult(expanded, "frame", "ArrowLeft")).toEqual({ focusedId: "frame", expandedId: "frame", expanded: false });
    expect(layerNavigationResult(expanded, "child-a", "ArrowLeft")).toEqual({ focusedId: "frame" });
    expect(layerNavigationResult(expanded, "frame", "ArrowLeft")?.focusedId).toBe("frame");
  });

  it("treats inherited locks as non-draggable roots", () => {
    const inherited: LayerNode[] = [{ id: "parent", name: "Parent", type: "frame", children: [
      { id: "child", name: "Child", type: "shape", inheritedLocked: true },
    ] }];
    expect(normalizeLayerDragRoots(inherited, ["child"])).toEqual([]);
  });
});
