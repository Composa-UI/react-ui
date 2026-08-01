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

// ── LF-5 · the row icon must follow the frame's auto-layout alignment ───────────
// The glyph was derived from the auto-layout MODE only and hardcoded to `-center`,
// and `LayerNode` had no alignment field at all, so no caller could have moved it.
// These assert through <LayerList>, not <LayerTypeIcon>, so a re-broken plumb
// (node.autoLayoutAlign not forwarded to the icon) fails here too.
describe("LayerList row icon follows the frame's auto-layout alignment", () => {
  const aligned = (mode: "horizontal" | "vertical", align: "start" | "center" | "end"): LayerNode[] =>
    [{ id: "f", name: "Stack", type: "frame", autoLayoutMode: mode, autoLayoutAlign: align }];

  const semanticFor = (mode: "horizontal" | "vertical", align: "start" | "center" | "end") => {
    const renderer = renderLayers(aligned(mode, align));
    const semantic = String(rowIcon(renderer.root, "Stack").props["data-icon-semantic"]);
    act(() => renderer.unmount());
    return semantic;
  };

  it("gives a horizontal frame three different glyphs for top / centre / bottom", () => {
    expect(semanticFor("horizontal", "start")).toBe("auto-layout-horizontal-top");
    expect(semanticFor("horizontal", "center")).toBe("auto-layout-horizontal-center");
    expect(semanticFor("horizontal", "end")).toBe("auto-layout-horizontal-bottom");
  });

  it("gives a vertical frame three different glyphs for left / centre / right", () => {
    expect(semanticFor("vertical", "start")).toBe("auto-layout-vertical-left");
    expect(semanticFor("vertical", "center")).toBe("auto-layout-vertical-center");
    expect(semanticFor("vertical", "end")).toBe("auto-layout-vertical-right");
  });

  it("draws a different glyph when only the alignment changes", () => {
    // The defect in one line: same mode, same everything else, different alignment.
    const glyphOf = (align: "start" | "center" | "end") => {
      const renderer = renderLayers(aligned("horizontal", align));
      const className = String(rowIcon(renderer.root, "Stack").props.className);
      act(() => renderer.unmount());
      return className;
    };
    const glyphs = new Set([glyphOf("start"), glyphOf("center"), glyphOf("end")]);
    expect(glyphs.size, "three alignments must render three distinct glyphs").toBe(3);
  });

  it("still ignores alignment for a frame with no auto layout", () => {
    const renderer = renderLayers([{ id: "f", name: "Board", type: "frame", autoLayoutAlign: "end" }]);
    expect(rowIcon(renderer.root, "Board").props["data-icon-semantic"]).toBe("frame");
    act(() => renderer.unmount());
  });
});

// ── LF-4 · a locked row reads as filled, not as a second outline ───────────────
describe("LayerList paints an engaged lock with a fill", () => {
  /** The lock <button> AND its contents, so the assertion cannot match the eye. */
  function lockButton(html: string, label: string) {
    const match = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>.*?</button>`, "s"))?.[0];
    expect(match, `${label} button`).toBeTruthy();
    return match!;
  }

  it("fills the padlock once the layer is locked", () => {
    const html = renderToStaticMarkup(<LayerList layers={[{ id: "a", name: "Motto", type: "text", locked: true }]} selectedIds={[]} />);
    const button = lockButton(html, "Unlock Motto");

    // `lucide-lock` as a whole class, so the open padlock cannot satisfy it.
    expect(hasClass(button, "lucide-lock"), "closed padlock").toBe(true);
    expect(hasClass(button, "fill-current"), "filled").toBe(true);
  });

  it("leaves the hover-only open padlock unfilled", () => {
    const html = renderToStaticMarkup(<LayerList layers={[{ id: "a", name: "Motto", type: "text" }]} selectedIds={[]} />);
    const button = lockButton(html, "Lock Motto");

    // Assert the control rendered before asserting the absence of the fill.
    expect(hasClass(button, "lucide-lock-open"), "open padlock").toBe(true);
    expect(button).not.toContain("fill-current");
  });

  it("fills the padlock for a child locked by its parent", () => {
    const html = renderToStaticMarkup(
      <LayerList layers={[{ id: "g", name: "Sheet", type: "frame", locked: true, children: [{ id: "c", name: "Face", type: "shape", inheritedLocked: true }] }]} selectedIds={[]} />,
    );
    expect(hasClass(lockButton(html, "Face locked by parent"), "fill-current"), "inherited lock filled").toBe(true);
  });
});
