import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayerList, type LayerNode } from "./LayerList";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Composa#661, two row-icon defects:
//  · the trailing lock/visibility controls were painted with the de-emphasised
//    icon colour, so an engaged lock read as disabled;
//  · a line and an ellipse both fell through to the square `shape` glyph.

const PRIMITIVES: LayerNode[] = [
  { id: "rect", name: "Card", type: "shape" },
  { id: "line", name: "Divider", type: "line" },
  { id: "ellipse", name: "Bubble", type: "ellipse" },
];

/** The one <button> in a row, matched by its aria-label — not the whole tree. */
function buttonTag(html: string, label: string) {
  const tag = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0];
  expect(tag, `${label} button`).toBeTruthy();
  return tag!;
}

/** `text-c-icon` as a whole class, so `text-c-icon-secondary` cannot satisfy it. */
function hasClass(tag: string, className: string) {
  return new RegExp(`(^|[\\s"])${className}([\\s"]|$)`).test(tag);
}

function renderLayers(layers: LayerNode[]) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<LayerList layers={layers} selectedIds={[]} />); });
  return renderer!;
}

function rowIcon(root: ReactTestInstance, name: string) {
  const row = root.find(node => node.props.role === "treeitem" && node.props["aria-label"] === name);
  return row.find(node => typeof node.type === "string" && node.props["data-layer-icon-type"] !== undefined);
}

describe("LayerList trailing controls use the primary icon colour", () => {
  it("paints lock and visibility with text-c-icon, not the secondary tone", () => {
    const html = renderToStaticMarkup(<LayerList layers={[{ id: "a", name: "Motto", type: "text" }]} selectedIds={[]} />);

    for (const label of ["Lock Motto", "Hide Motto"]) {
      const tag = buttonTag(html, label);
      expect(hasClass(tag, "text-c-icon"), `${label} primary`).toBe(true);
      expect(tag).not.toContain("text-c-icon-secondary");
    }
  });

  it("keeps the same primary tone once a layer is actually locked and hidden", () => {
    const html = renderToStaticMarkup(<LayerList layers={[{ id: "a", name: "Motto", type: "text", locked: true, hidden: true }]} selectedIds={[]} />);

    for (const label of ["Unlock Motto", "Show Motto"]) {
      const tag = buttonTag(html, label);
      expect(hasClass(tag, "text-c-icon"), `${label} primary`).toBe(true);
      expect(tag).not.toContain("text-c-icon-secondary");
    }
  });

  it("leaves the LEADING disclosure chevron de-emphasised — the feedback named trailing icons only", () => {
    const html = renderToStaticMarkup(
      <LayerList layers={[{ id: "g", name: "Sheet", type: "frame", children: [{ id: "c", name: "Face", type: "shape" }] }]} selectedIds={[]} />,
    );
    expect(buttonTag(html, "Collapse")).toContain("text-c-icon-secondary");
  });
});

describe("LayerList draws each primitive with its own glyph", () => {
  it("gives line, ellipse and rectangle three different semantics", () => {
    const renderer = renderLayers(PRIMITIVES);

    expect(rowIcon(renderer.root, "Divider").props["data-icon-semantic"]).toBe("line");
    expect(rowIcon(renderer.root, "Bubble").props["data-icon-semantic"]).toBe("ellipse");
    expect(rowIcon(renderer.root, "Card").props["data-icon-semantic"]).toBe("shape");
    act(() => renderer.unmount());
  });

  it("renders the ellipse as a circle and the line as a rule — neither as a square", () => {
    const renderer = renderLayers(PRIMITIVES);
    const classOf = (name: string) => String(rowIcon(renderer.root, name).props.className);

    expect(classOf("Bubble")).toContain("lucide-circle");
    expect(classOf("Bubble")).not.toContain("lucide-square");
    expect(classOf("Divider")).toContain("lucide-minus");
    expect(classOf("Divider")).not.toContain("lucide-square");
    // …while the rectangle keeps the square it always had.
    expect(classOf("Card")).toContain("lucide-square");
    act(() => renderer.unmount());
  });
});
