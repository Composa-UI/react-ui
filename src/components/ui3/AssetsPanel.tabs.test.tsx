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

const LIBRARY_ID = "composa-assets-library";
const COMMUNITY_ID = "composa-assets-community";

function libraryBody(root: ReactTestInstance) {
  return root.findAll(node => node.props.id === LIBRARY_ID);
}

/** Which top-level bodies rendered, in order. Asserting the whole list keeps the
 *  guard ("Library is there") and the absence ("Community is not") in one place,
 *  so neither can quietly stop matching without the other noticing. */
function bodyIds(root: ReactTestInstance) {
  return root
    .findAll(node => node.props.id === LIBRARY_ID || node.props.id === COMMUNITY_ID)
    .map(node => String(node.props.id));
}

// Every string this subtree actually renders, concatenated in order.
//
// The obvious spelling — `root.findAll(node => node.props.children === text)` —
// is a trap here and produced a VACUOUS test once already: `Tabs` gives each tab
// button ARRAY children (`[icon, label]`), so an identity check against a single
// string never matches a tab, and "no node has children === 'Community'" stayed
// true with the Community tab fully restored. Walk the rendered strings instead.
function textOf(node: ReactTestInstance): string {
  return node.children.map(child => (typeof child === "string" ? child : textOf(child))).join("");
}

/** Host elements whose entire rendered text is exactly `text`. */
function labelled(root: ReactTestInstance, text: string) {
  return root.findAll(node => typeof node.type === "string" && textOf(node) === text);
}

/** Anything that would make this pane a tab control rather than a labelled view. */
function selectionAffordances(root: ReactTestInstance) {
  return root
    .findAll(node => ["tablist", "tab", "tabpanel"].includes(String(node.props.role))
      || node.props["aria-selected"] !== undefined)
    .map(node => node.props.role ?? `aria-selected=${String(node.props["aria-selected"])}`);
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
    // No tablist, no tab, no tabpanel, and nothing carrying a selected state —
    // asserted as one list so a failure names every affordance that came back.
    expect(selectionAffordances(renderer.root)).toEqual([]);
    // The heading still reads "Library", and it is a label, not a control.
    const heading = labelled(renderer.root, "Library");
    expect(heading.length).toBeGreaterThan(0);
    expect(heading.map(node => node.type)).not.toContain("button");
    act(() => renderer.unmount());
  });

  it("removes Community entirely — no tab, no panel, no empty state", () => {
    const renderer = renderPanel();

    // Library rendered and Community did not — guard and absence in one list.
    expect(bodyIds(renderer.root)).toEqual([LIBRARY_ID]);
    // Over the RENDERED TEXT, not over `props.children` — see `textOf` above.
    expect(textOf(renderer.root)).not.toContain("Community");
    expect(textOf(renderer.root)).not.toContain("No community libraries yet");
    act(() => renderer.unmount());
  });

  // `tab` / `defaultTab` / `onTabChange` are gone from `AssetsPanelProps`, so the
  // cast below is the whole point of this test: Community is not merely the
  // unselected half of a split any more — there is no second view for a stale
  // host, or a stale bundle, to select. Without this the "no Community" claim
  // above would still hold on the OLD component, whose default tab was Library.
  it("cannot be switched back to Community by a host still passing the old tab props", () => {
    const legacy = { tab: "community", defaultTab: "community", onTabChange: vi.fn() } as unknown as Partial<AssetsPanelProps>;
    const renderer = renderPanel(legacy);

    expect(bodyIds(renderer.root)).toEqual([LIBRARY_ID]);
    expect(selectionAffordances(renderer.root)).toEqual([]);
    expect(textOf(renderer.root)).not.toContain("Community");
    expect(textOf(renderer.root)).not.toContain("No community libraries yet");
    // …and the Library body is fully alive, not an empty husk standing in for it.
    expect(libraryBody(renderer.root)[0].findAll(node => node.props.placeholder === "Search assets")).toHaveLength(1);
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
    // Guard: the context menu actually opened and rendered its rows. Without it
    // this reads as "no Rename/Delete row" while really only proving no menu —
    // measured: stub out `setContextAsset` so the menu never opens and the file
    // still went 10/10 green. The row list below is the absence being claimed.
    expect(renderer.root.findAll(node => node.props.label === "Insert on slide")).toHaveLength(1);
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
