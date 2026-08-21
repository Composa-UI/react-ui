import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { AssetsPanel, type AssetItem, type AssetLibrary, type AssetsPanelProps } from "./AssetsPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Owner feedback #67: the Library / Community split (Composa#661) is gone. One
// view remains, so the pane draws a label — not a tablist with a single tab
// carrying a selection state that distinguishes nothing. The Library body still
// groups its cards under per-library section headers whose chevron opens the
// full list for that library.

const BRAND: AssetLibrary[] = [{ id: "brand", name: "Brand kit" }, { id: "stock", name: "Stock" }];

const ASSETS: AssetItem[] = [
  { id: "a1", name: "logo.png", kind: "image", libraryId: "brand" },
  { id: "a2", name: "wordmark.png", kind: "image", libraryId: "brand" },
  { id: "a3", name: "city.jpg", kind: "image", libraryId: "stock" },
  { id: "a4", name: "loose.png", kind: "image" },
];

function renderPanel(overrides: Partial<AssetsPanelProps> = {}) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<AssetsPanel assets={ASSETS} {...overrides} />); });
  return renderer!;
}

function tabs(root: ReactTestInstance) {
  return root.findAll(node => node.props.role === "tab");
}

function libraryBody(root: ReactTestInstance) {
  return root.findAll(node => node.props.id === "composa-assets-library");
}

function textNodes(root: ReactTestInstance, text: string) {
  return root.findAll(node => node.props.children === text);
}

function card(root: ReactTestInstance, name: string) {
  return root.findAll(node => node.type === "button" && node.props["aria-label"] === name);
}

function section(root: ReactTestInstance, name: string) {
  return root.findAll(node => node.type === "section" && node.props["aria-label"] === name);
}

function chevron(root: ReactTestInstance, name: string) {
  return root.findAll(node => node.type === "button" && node.props["aria-label"] === `Open ${name}`);
}

describe("AssetsPanel — single Library view", () => {
  it("labels the view instead of drawing a tablist", () => {
    const renderer = renderPanel();

    // Guard: the pane rendered its Library body, so the absences below are real.
    expect(libraryBody(renderer.root)).toHaveLength(1);
    // No tablist, no tab, no tabpanel — not one tab left selected, none at all.
    expect(renderer.root.findAll(node => node.props.role === "tablist")).toHaveLength(0);
    expect(tabs(renderer.root)).toHaveLength(0);
    expect(renderer.root.findAll(node => node.props.role === "tabpanel")).toHaveLength(0);
    // And nothing carries a selected state to reason about.
    expect(renderer.root.findAll(node => node.props["aria-selected"] !== undefined)).toHaveLength(0);
    // The label itself still reads "Library".
    expect(textNodes(renderer.root, "Library").length).toBeGreaterThan(0);
    act(() => renderer.unmount());
  });

  it("removes Community entirely — no tab, no panel, no empty state", () => {
    const renderer = renderPanel();
    expect(textNodes(renderer.root, "Community")).toHaveLength(0);
    expect(textNodes(renderer.root, "No community libraries yet")).toHaveLength(0);
    expect(renderer.root.findAll(node => node.props.id === "composa-assets-community")).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("keeps today's search, filter and grid in the Library body", () => {
    const renderer = renderPanel();
    const library = libraryBody(renderer.root)[0];

    expect(library.findAll(node => node.props.placeholder === "Search assets")).toHaveLength(1);
    expect(library.findAll(node => node.props["aria-label"] === "Filter by type")).toHaveLength(1);
    expect(card(library, "logo.png")).toHaveLength(1);
    act(() => renderer.unmount());
  });
});

describe("AssetsPanel — library section headers", () => {
  it("keeps shared-library cards consumable without exposing project-owned rename or delete controls", () => {
    const renderer = renderPanel({ assets: [{ id: "shared", name: "shared.png", kind: "image", libraryId: "brand", readOnly: true }], libraries: BRAND });
    expect(renderer.root.findAll(node => node.type === "button" && node.props["aria-label"] === "Insert on slide")).toHaveLength(1);
    expect(renderer.root.findAll(node => node.type === "button" && node.props["aria-label"] === "Delete")).toHaveLength(0);
    const thumbnailButton = card(renderer.root, "shared.png")[0];
    act(() => thumbnailButton.props.onContextMenu({ preventDefault: vi.fn(), clientX: 10, clientY: 10 }));
    expect(renderer.root.findAll(node => node.props.label === "Rename" || node.props.label === "Delete")).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("stays one flat grid when the host passes no libraries", () => {
    const renderer = renderPanel();
    // Guard: the cards rendered, so "no sections" is a real absence.
    expect(card(renderer.root, "logo.png")).toHaveLength(1);
    expect(renderer.root.findAll(node => node.type === "section")).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("groups cards under their library and files unmatched cards headerless", () => {
    const renderer = renderPanel({ libraries: BRAND });

    expect(section(renderer.root, "Brand kit")).toHaveLength(1);
    expect(section(renderer.root, "Stock")).toHaveLength(1);
    const brand = section(renderer.root, "Brand kit")[0];
    expect(card(brand, "logo.png")).toHaveLength(1);
    expect(card(brand, "wordmark.png")).toHaveLength(1);
    // A card belonging to another library must NOT land in this section…
    expect(card(brand, "city.jpg")).toHaveLength(0);
    // …and a card with no library still renders, just outside every section.
    expect(card(renderer.root, "loose.png")).toHaveLength(1);
    expect(card(section(renderer.root, "Stock")[0], "loose.png")).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("gives each header a chevron that opens that library, and only that one", () => {
    const onOpenLibrary = vi.fn();
    const renderer = renderPanel({ libraries: BRAND, onOpenLibrary });

    expect(chevron(renderer.root, "Brand kit")).toHaveLength(1);
    act(() => chevron(renderer.root, "Stock")[0].props.onClick());
    expect(onOpenLibrary).toHaveBeenCalledTimes(1);
    expect(onOpenLibrary).toHaveBeenCalledWith("stock");
    act(() => renderer.unmount());
  });

  it("omits the chevron entirely when the host cannot navigate anywhere", () => {
    const renderer = renderPanel({ libraries: BRAND });
    // Guard: the headers rendered, so the missing chevron is the point.
    expect(section(renderer.root, "Brand kit")).toHaveLength(1);
    expect(chevron(renderer.root, "Brand kit")).toHaveLength(0);
    // Not disabled, not decorative — absent. A disabled chevron would still
    // claim the "open the full library" feature exists.
    expect(renderer.root.findAll(node => String(node.props["aria-label"] ?? "").startsWith("Open "))).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("drops a section whose assets all fell out of the search", () => {
    const renderer = renderPanel({ libraries: BRAND, query: "logo" });

    expect(card(renderer.root, "logo.png")).toHaveLength(1);
    expect(section(renderer.root, "Brand kit")).toHaveLength(1);
    // "Stock" has no surviving asset — its header must go with it.
    expect(section(renderer.root, "Stock")).toHaveLength(0);
    act(() => renderer.unmount());
  });
});
