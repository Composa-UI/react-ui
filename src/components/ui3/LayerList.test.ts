import { describe, expect, it } from "vitest";
import { normalizeLayerDragRoots, type LayerNode } from "./LayerList";

const tree: LayerNode[] = [
  { id: "frame", name: "Frame", type: "frame", children: [
    { id: "child-a", name: "A", type: "shape" },
    { id: "child-b", name: "B", type: "shape" },
  ] },
  { id: "locked", name: "Locked", type: "shape", locked: true },
  { id: "tail", name: "Tail", type: "shape" },
];

describe("LayerList drag root normalization", () => {
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
