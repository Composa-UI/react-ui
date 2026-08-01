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
