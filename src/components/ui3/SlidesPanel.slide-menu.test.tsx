import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { SlidesPanel, type SlideData } from "./SlidesPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Slide actions live on RIGHT-CLICK only (Composa#661): the hover ⋯ chip floated
// over the thumbnail it belonged to and hid the artwork. These tests pin both
// halves — the chip is gone, and the context menu still offers every action.

const SLIDES: SlideData[] = [{ n: 1, tint: "#111" }, { n: 2, tint: "#222" }];

function slideRow(root: ReactTestInstance, n: number) {
  return root.find(node => node.props.role === "option" && node.props["aria-label"] === `Composition ${n}`);
}

function textOf(node: ReactTestInstance): string {
  return node.children.map(child => (typeof child === "string" ? child : textOf(child))).join("");
}

function menuItem(root: ReactTestInstance, label: string) {
  return root.findAll(node => node.props.role === "menuitem" && textOf(node) === label);
}

function renderPanel(overrides: Parameters<typeof SlidesPanel>[0] = { slides: SLIDES }) {
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<SlidesPanel slides={SLIDES} {...overrides} />); });
  return renderer!;
}

function rightClick(row: ReactTestInstance, at = { clientX: 120, clientY: 240 }) {
  const preventDefault = vi.fn();
  act(() => row.props.onContextMenu({ ...at, preventDefault }));
  return preventDefault;
}

describe("SlidesPanel slide actions", () => {
  it("projects an app-owned evaluated frame and exposes hover/focus preview intent", () => {
    const onPreviewChange = vi.fn();
    const renderer = renderPanel({ slides: [{ n: 1, thumb: "authored.png", previewThumb: "evaluated.png", motion: true, onPreviewChange }] });
    const row = slideRow(renderer.root, 1);
    expect(row.find(node => node.type === "img").props.src).toBe("evaluated.png");
    expect(row.findAll(node => node.props["data-composa-motion-present"] !== undefined)).toHaveLength(1);

    act(() => row.props.onMouseEnter());
    act(() => row.props.onMouseLeave());
    act(() => row.props.onFocusCapture());
    act(() => row.props.onBlurCapture());
    expect(onPreviewChange.mock.calls).toEqual([[true], [false], [true], [false]]);
    act(() => renderer.unmount());
  });

  it("puts no button — hover ⋯ or otherwise — inside a slide row", () => {
    const renderer = renderPanel({ slides: SLIDES, onRenameRequest: () => undefined, onSlideDelete: () => undefined });
    const row = slideRow(renderer.root, 1);

    // Guard first: the row itself rendered, so the absence below means something.
    expect(row).toBeTruthy();
    expect(row.findAll(node => node.type === "button")).toHaveLength(0);
    expect(renderer.root.findAll(node => node.props["aria-label"] === "Composition 1 options")).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("opens Rename · Duplicate · Delete at the cursor on right-click", () => {
    const onRenameRequest = vi.fn();
    const onSlideDuplicate = vi.fn();
    const onSlideDelete = vi.fn();
    const renderer = renderPanel({ slides: SLIDES, onRenameRequest, onSlideDuplicate, onSlideDelete });

    // Closed to begin with, so finding the rows after the right-click is meaningful.
    expect(renderer.root.findAll(node => node.props.role === "menuitem")).toHaveLength(0);

    const preventDefault = rightClick(slideRow(renderer.root, 2), { clientX: 96, clientY: 310 });
    expect(preventDefault).toHaveBeenCalledOnce();

    for (const label of ["Rename", "Duplicate", "Delete"]) {
      expect(menuItem(renderer.root, label), label).toHaveLength(1);
    }
    // Anchored at the pointer, like the assets-panel context menu.
    const anchor = renderer.root.find(node => node.type === "div" && node.props.style?.left === 96);
    expect(anchor.props.style).toMatchObject({ left: 96, top: 310 });

    act(() => menuItem(renderer.root, "Delete")[0].props.onClick());
    expect(onSlideDelete).toHaveBeenCalledWith(1);
    // Closes after acting, and nothing else fired.
    expect(renderer.root.findAll(node => node.props.role === "menuitem")).toHaveLength(0);
    expect(onRenameRequest).not.toHaveBeenCalled();
    expect(onSlideDuplicate).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });

  // Owner feedback #67: publish-to-library is DELETED from this menu, not gated
  // behind a prop. The menu has no row for it no matter what the host wires, so
  // the assertion is over the rendered rows, not over a callback.
  it("offers no publish-to-project-library row at all", () => {
    const renderer = renderPanel({ slides: SLIDES, onRenameRequest: vi.fn(), onSlideDuplicate: vi.fn(), onSlideDelete: vi.fn() });
    rightClick(slideRow(renderer.root, 2));

    // Guard: the menu did open, so the missing row is a real absence.
    expect(menuItem(renderer.root, "Duplicate")).toHaveLength(1);
    expect(menuItem(renderer.root, "Publish to project library…")).toHaveLength(0);
    expect(renderer.root.findAll(node => node.props.role === "menuitem"
      && textOf(node).toLowerCase().includes("librar"))).toHaveLength(0);
    act(() => renderer.unmount());
  });

  it("wires Rename and Duplicate to the row that was right-clicked", () => {
    const onRenameRequest = vi.fn();
    const onSlideDuplicate = vi.fn();
    const renderer = renderPanel({ slides: SLIDES, onRenameRequest, onSlideDuplicate });

    rightClick(slideRow(renderer.root, 1));
    act(() => menuItem(renderer.root, "Rename")[0].props.onClick());
    expect(onRenameRequest).toHaveBeenCalledWith(0);

    rightClick(slideRow(renderer.root, 2));
    act(() => menuItem(renderer.root, "Duplicate")[0].props.onClick());
    expect(onSlideDuplicate).toHaveBeenCalledWith(1);
    act(() => renderer.unmount());
  });

  it("stays inert on right-click when the host wires no slide actions", () => {
    const renderer = renderPanel({ slides: SLIDES });
    expect(slideRow(renderer.root, 1).props.onContextMenu).toBeUndefined();
    act(() => renderer.unmount());
  });
});

// Owner feedback #67: the split "New comp ▾ | +" control becomes one plain
// button reading "New slide". Both halves of that matter — the label, and the
// absence of the second segment/chevron that used to reach templates.
describe("SlidesPanel new-slide button", () => {
  function panelButtons(root: ReactTestInstance) {
    // Buttons outside the slide rows and outside the header title combo.
    return root.findAll(node => node.type === "button" && node.props["aria-label"] === "New slide");
  }

  it("is a single button labelled New slide", () => {
    const onNewSlide = vi.fn();
    const renderer = renderPanel({ slides: SLIDES, onNewSlide });

    const buttons = panelButtons(renderer.root);
    expect(buttons).toHaveLength(1);
    expect(textOf(buttons[0])).toContain("New slide");

    act(() => buttons[0].props.onClick());
    expect(onNewSlide).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });

  it("keeps no segmented half and no dropdown chevron", () => {
    const renderer = renderPanel({ slides: SLIDES, onNewSlide: vi.fn() });

    // Guard: the button is there, so the missing segments mean something.
    expect(panelButtons(renderer.root)).toHaveLength(1);
    for (const gone of ["New comp options", "Add comp"]) {
      expect(renderer.root.findAll(node => node.props["aria-label"] === gone), gone).toHaveLength(0);
    }
    expect(renderer.root.findAll(node => node.type === "button"
      && textOf(node).includes("New comp"))).toHaveLength(0);
    act(() => renderer.unmount());
  });
});
