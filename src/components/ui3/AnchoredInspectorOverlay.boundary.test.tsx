import { act, create, type ReactTestInstance } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnchoredInspectorOverlay, COMPOSA_OVERLAY_BOUNDARY_SELECTOR } from "./AnchoredInspectorOverlay";
import { InspectorDialog } from "./InspectorDialog";

vi.mock("@radix-ui/react-popover", async () => {
  const React = await import("react");
  const boundary = (name: string) => ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("div", { [`data-radix-${name}`]: true, ...props }, children);
  return {
    Root: boundary("root"),
    Anchor: boundary("anchor"),
    Portal: boundary("portal"),
    Content: boundary("content"),
  };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => vi.unstubAllGlobals());

const EXPLICIT_BOUNDARY_SELECTOR = "[data-preview-canvas-boundary]";
const triggerRect = { x: 900, y: 80, width: 24, height: 24, top: 80, right: 924, bottom: 104, left: 900, toJSON: () => ({}) } as DOMRect;
const explicitBoundaryRect = { x: 100, y: 50, width: 600, height: 400, top: 50, right: 700, bottom: 450, left: 100, toJSON: () => ({}) } as DOMRect;
const nearestBoundaryRect = { x: 0, y: 0, width: 1_000, height: 700, top: 0, right: 1_000, bottom: 700, left: 0, toJSON: () => ({}) } as DOMRect;
const surfaceRect = { x: 300, y: 150, width: 200, height: 200, top: 150, right: 500, bottom: 350, left: 300, toJSON: () => ({}) } as DOMRect;

function radix(root: ReactTestInstance, name: string) {
  return root.find(node => node.props[`data-radix-${name}`]);
}

function renderBoundaryOverlay(boundarySelector: string | undefined, options: {
  nearest?: boolean;
  surface?: DOMRect;
  resizable?: boolean;
} = {}) {
  const nearestBoundary = {
    getBoundingClientRect: () => nearestBoundaryRect,
  };
  const explicitBoundary = {
    getBoundingClientRect: () => explicitBoundaryRect,
  };
  const trigger = {
    getBoundingClientRect: () => triggerRect,
    closest: (selector: string) => {
      if (selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR) return options.nearest === false ? null : nearestBoundary;
      return { dataset: { composaMode: "light" } };
    },
    focus: vi.fn(),
  };
  vi.stubGlobal("document", {
    activeElement: null,
    querySelector: (selector: string) => selector === EXPLICIT_BOUNDARY_SELECTOR ? explicitBoundary : null,
  });
  vi.stubGlobal("window", { innerWidth: 1_200, innerHeight: 800 });

  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <AnchoredInspectorOverlay
        open
        onClose={() => undefined}
        ariaLabel="Preview"
        trigger={<button type="button">Open</button>}
        boundarySelector={boundarySelector}
        dragHandleSelector="[data-drag-handle]"
        resizable={options.resizable ? { minWidth: 100, minHeight: 100, maxWidth: 1_000, maxHeight: 1_000 } : undefined}
      >
        <div data-drag-handle>Preview</div>
      </AnchoredInspectorOverlay>,
      {
        createNodeMock: element => element.type === "span"
          ? { querySelector: () => trigger }
          : null,
      },
    );
  });
  return {
    renderer: renderer!,
    explicitBoundary,
    nearestBoundary,
    surface: options.surface ?? surfaceRect,
  };
}

class MockElement {
  handle = {};
  closest(selector: string) {
    if (selector === "[data-drag-handle]") return this.handle;
    return null;
  }
}

describe("AnchoredInspectorOverlay explicit boundary", () => {
  it("uses one explicit boundary for Radix collision and all four pointer-drag edges", () => {
    vi.stubGlobal("Element", MockElement);
    const { renderer, explicitBoundary, surface } = renderBoundaryOverlay(EXPLICIT_BOUNDARY_SELECTOR);
    const content = radix(renderer.root, "content");
    expect(content.props.collisionBoundary).toBe(explicitBoundary);

    const target = new MockElement();
    const currentTarget = {
      contains: () => true,
      getBoundingClientRect: () => surface,
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    };
    const pointer = (clientX: number, clientY: number) => ({
      button: 0, pointerId: 7, clientX, clientY, target, currentTarget, preventDefault: vi.fn(),
    });

    act(() => content.props.onPointerDownCapture(pointer(350, 200)));
    act(() => content.props.onPointerMove(pointer(-1_000, -1_000)));
    expect(radix(renderer.root, "content").props.style.translate).toBe("-192px -92px");
    act(() => radix(renderer.root, "content").props.onPointerCancel(pointer(-1_000, -1_000)));

    act(() => radix(renderer.root, "content").props.onPointerDownCapture(pointer(350, 200)));
    act(() => radix(renderer.root, "content").props.onPointerMove(pointer(2_000, 2_000)));
    expect(radix(renderer.root, "content").props.style.translate).toBe("192px 92px");
    act(() => renderer.unmount());
  });

  it("clamps pointer and keyboard resize to the same explicit right and bottom edges", () => {
    const { renderer, surface } = renderBoundaryOverlay(EXPLICIT_BOUNDARY_SELECTOR, { resizable: true });
    const handle = renderer.root.findByProps({ "data-composa-overlay-resize-handle": "bottom-right" });
    const surfaceElement = { getBoundingClientRect: () => surface };
    const currentTarget = {
      closest: () => surfaceElement,
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    };
    const pointer = (clientX: number, clientY: number) => ({
      button: 0, pointerId: 9, clientX, clientY, currentTarget,
      preventDefault: vi.fn(), stopPropagation: vi.fn(),
    });
    act(() => handle.props.onPointerDown(pointer(500, 350)));
    act(() => handle.props.onPointerMove(pointer(2_000, 2_000)));
    expect(radix(renderer.root, "content").props.style).toMatchObject({ width: 392, height: 292 });
    act(() => handle.props.onPointerUp(pointer(2_000, 2_000)));
    act(() => renderer.unmount());

    const nearEdgeSurface = { ...surfaceRect, width: 388, height: 288, right: 688, bottom: 438 } as DOMRect;
    const keyboard = renderBoundaryOverlay(EXPLICIT_BOUNDARY_SELECTOR, { resizable: true, surface: nearEdgeSurface });
    const keyboardHandle = keyboard.renderer.root.findByProps({ "data-composa-overlay-resize-handle": "bottom-right" });
    const keyboardTarget = { closest: () => ({ getBoundingClientRect: () => nearEdgeSurface }) };
    act(() => keyboardHandle.props.onKeyDown({ key: "ArrowRight", shiftKey: false, currentTarget: keyboardTarget, preventDefault: vi.fn() }));
    act(() => keyboardHandle.props.onKeyDown({ key: "ArrowDown", shiftKey: false, currentTarget: keyboardTarget, preventDefault: vi.fn() }));
    expect(radix(keyboard.renderer.root, "content").props.style).toMatchObject({ width: 392, height: 292 });
    act(() => keyboard.renderer.unmount());
  });

  it("falls back unchanged to the nearest marked boundary and then the viewport", () => {
    const nearest = renderBoundaryOverlay("[data-missing-boundary]");
    expect(radix(nearest.renderer.root, "content").props.collisionBoundary).toBe(nearest.nearestBoundary);
    act(() => nearest.renderer.unmount());

    vi.stubGlobal("Element", MockElement);
    const viewport = renderBoundaryOverlay("[data-missing-boundary]", { nearest: false });
    expect(radix(viewport.renderer.root, "content").props.collisionBoundary).toBeUndefined();
    const content = radix(viewport.renderer.root, "content");
    const target = new MockElement();
    const currentTarget = {
      contains: () => true,
      getBoundingClientRect: () => viewport.surface,
      setPointerCapture: vi.fn(), releasePointerCapture: vi.fn(),
    };
    const pointer = (clientX: number, clientY: number) => ({
      button: 0, pointerId: 11, clientX, clientY, target, currentTarget, preventDefault: vi.fn(),
    });
    act(() => content.props.onPointerDownCapture(pointer(350, 200)));
    act(() => content.props.onPointerMove(pointer(2_000, 2_000)));
    expect(radix(viewport.renderer.root, "content").props.style.translate).toBe("692px 442px");
    act(() => viewport.renderer.unmount());
  });

  it("propagates the optional selector through InspectorDialog without changing its default", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <InspectorDialog open={false} onClose={() => undefined} ariaLabel="Preview" boundarySelector={EXPLICIT_BOUNDARY_SELECTOR}>
          <div>Preview</div>
        </InspectorDialog>,
      );
    });
    expect(renderer!.root.findByType(AnchoredInspectorOverlay).props.boundarySelector).toBe(EXPLICIT_BOUNDARY_SELECTOR);
    act(() => renderer!.unmount());

    act(() => {
      renderer = create(
        <InspectorDialog open={false} onClose={() => undefined} ariaLabel="Existing dialog">
          <div>Existing</div>
        </InspectorDialog>,
      );
    });
    expect(renderer!.root.findByType(AnchoredInspectorOverlay).props.boundarySelector).toBeUndefined();
    act(() => renderer!.unmount());
  });
});
