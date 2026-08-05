import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Children, type ReactElement } from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
  ANCHORED_INSPECTOR_OVERLAY_Z_CLASS,
  COMPOSA_OVERLAY_BOUNDARY_SELECTOR,
  AnchoredInspectorOverlay,
  clampAnchoredInspectorOverlayOffset,
  clampAnchoredInspectorOverlaySize,
  shouldMountAnchoredInspectorOverlay,
} from "./AnchoredInspectorOverlay";
import { INSPECTOR_DIALOG_DRAG_HANDLE_SELECTOR, InspectorDialog } from "./InspectorDialog";
import { ColorDialog } from "./ColorDialog";

vi.mock("@radix-ui/react-popover", async () => {
  const React = await import("react");
  const boundary = (name: string) => ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("div", { [`data-radix-${name}`]: true, ...props }, children);
  return {
    Root: boundary("root"),
    Trigger: boundary("trigger"),
    Anchor: boundary("anchor"),
    Portal: boundary("portal"),
    Content: boundary("content"),
  };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => vi.unstubAllGlobals());

const rect = { x: 920, y: 80, width: 24, height: 24, top: 80, right: 944, bottom: 104, left: 920, toJSON: () => ({}) } as DOMRect;

function renderOpen(mode: "light" | "dark", onClose = vi.fn(), blockOutsideDismiss = false, elevation?: 400 | 500, onInteractOutside?: () => void, surface?: "default" | "bare", dragHandleSelector?: string) {
  const focus = vi.fn();
  const collisionBoundary = {
    dataset: { composaOverlayBoundary: "" },
    getBoundingClientRect: () => ({ top: 0, right: 1_000, bottom: 500, left: 0 }),
  };
  const trigger = {
    getBoundingClientRect: () => rect,
    closest: (selector: string) => selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR
      ? collisionBoundary
      : { dataset: { composaMode: mode } },
    focus,
  };
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <AnchoredInspectorOverlay open onClose={onClose} ariaLabel={`${mode} settings`} blockOutsideDismiss={blockOutsideDismiss} elevation={elevation} surface={surface}
        dragHandleSelector={dragHandleSelector}
        onInteractOutside={onInteractOutside}
        trigger={<button type="button" aria-label={`Open ${mode}`}>Open</button>}>
        <div data-test-drag-handle><button type="button">First field</button></div>
      </AnchoredInspectorOverlay>,
      {
        createNodeMock: element => element.type === "span"
          ? { querySelector: () => trigger }
          : null,
      },
    );
  });
  return { renderer: renderer!, onClose, focus, collisionBoundary };
}

function radix(root: ReactTestInstance, name: string) {
  return root.find(node => node.props[`data-radix-${name}`]);
}

describe("AnchoredInspectorOverlay runtime contract", () => {
  it("waits for a captured trigger before mounting portalled content", () => {
    expect(shouldMountAnchoredInspectorOverlay(false, false)).toBe(false);
    expect(shouldMountAnchoredInspectorOverlay(true, false)).toBe(false);
    expect(shouldMountAnchoredInspectorOverlay(true, true)).toBe(true);
  });

  it.each(["light", "dark"] as const)("captures %s mode from its own trigger root", mode => {
    const { renderer } = renderOpen(mode);
    expect(radix(renderer.root, "content").props["data-composa-mode"]).toBe(mode);
    act(() => renderer.unmount());
  });

  it("captures a non-origin virtual anchor before mounting through the portal", () => {
    const { renderer } = renderOpen("light");
    const anchor = radix(renderer.root, "anchor");
    const portal = radix(renderer.root, "portal");
    expect(anchor.props.virtualRef.current.getBoundingClientRect()).toBe(rect);
    expect(portal.findAll(node => node.props["data-radix-content"])).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it("passes focus trap, collision, clipping, and stacking contracts to Radix", () => {
    const { renderer, collisionBoundary } = renderOpen("dark");
    const root = radix(renderer.root, "root");
    const content = radix(renderer.root, "content");
    expect(root.props.modal).toBe(true);
    expect(content.props.side).toBe("left");
    expect(content.props.align).toBe("start");
    expect(content.props.alignOffset).toBe(0);
    expect(content.props.avoidCollisions).toBe(true);
    expect(content.props.sticky).toBe("always");
    expect(content.props.collisionBoundary).toBe(collisionBoundary);
    expect(content.props.collisionPadding).toBe(ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING);
    expect(content.props.className).toContain(ANCHORED_INSPECTOR_OVERLAY_Z_CLASS);
    expect(content.props.className).toContain("max-h-[var(--radix-popover-content-available-height)]");
    expect(content.props.className).toContain("max-w-[calc(100vw-16px)]");
    expect(content.props.className).toContain("select-none");
    expect(content.props.className).toContain("[&_input]:select-text");
    expect(content.props.className).toContain("[&_textarea]:select-text");
    expect(content.props.className).toContain("[&_[contenteditable='true']]:select-text");
    expect(content.props.className).toContain("[&_[data-composa-selectable]]:select-text");
    expect(content.props.style.maxHeight).toBe("var(--radix-popover-content-available-height)");
    act(() => renderer.unmount());
  });

  it("applies the canonical elevation token directly when requested", () => {
    const { renderer } = renderOpen("light", vi.fn(), false, 400);
    expect(radix(renderer.root, "content").props.style.boxShadow).toBe("var(--elevation-400)");
    act(() => renderer.unmount());
  });

  it("can retain positioning and elevation without adding a second panel surface", () => {
    const { renderer } = renderOpen("dark", vi.fn(), false, 400, undefined, "bare");
    const content = radix(renderer.root, "content");
    expect(content.props.className).not.toContain("rounded-c-lg");
    expect(content.props.className).not.toContain("bg-c-bg");
    expect(content.props.style.boxShadow).toBe("var(--elevation-400)");
    act(() => renderer.unmount());
  });

  it("clamps transient drag deltas inside the captured overlay boundary", () => {
    const surface = { top: 80, right: 940, bottom: 280, left: 700 };
    const boundary = { top: 0, right: 1_000, bottom: 500, left: 0 };
    expect(clampAnchoredInspectorOverlayOffset(surface, boundary, { x: 500, y: 500 })).toEqual({ x: 52, y: 212 });
    expect(clampAnchoredInspectorOverlayOffset(surface, boundary, { x: -900, y: -900 })).toEqual({ x: -692, y: -72 });
  });

  it("clamps bottom-right resizing to product limits and the live overlay boundary", () => {
    const surface = { left: 300, top: 100 };
    const boundary = { top: 0, right: 1_000, bottom: 700, left: 0 };
    const limits = { minWidth: 320, minHeight: 220, maxWidth: 720, maxHeight: 520 };
    expect(clampAnchoredInspectorOverlaySize({ width: 100, height: 100 }, surface, boundary, limits))
      .toEqual({ width: 320, height: 220 });
    expect(clampAnchoredInspectorOverlaySize({ width: 900, height: 900 }, surface, boundary, limits))
      .toEqual({ width: 692, height: 520 });
  });

  it("captures header pointer drags, retains a completed offset, and restores the start on cancellation", () => {
    class MockElement {
      handle = {};
      closest(selector: string) {
        if (selector === "[data-test-drag-handle]") return this.handle;
        return null;
      }
    }
    vi.stubGlobal("Element", MockElement);
    const { renderer } = renderOpen("light", vi.fn(), false, undefined, undefined, undefined, "[data-test-drag-handle]");
    const capture = vi.fn();
    const release = vi.fn();
    const currentTarget = {
      contains: () => true,
      getBoundingClientRect: () => ({ top: 80, right: 940, bottom: 280, left: 700 }),
      setPointerCapture: capture,
      releasePointerCapture: release,
    };
    const target = new MockElement();
    const pointer = (clientX: number, clientY: number) => ({
      button: 0,
      pointerId: 7,
      clientX,
      clientY,
      target,
      currentTarget,
      preventDefault: vi.fn(),
    });
    act(() => radix(renderer.root, "content").props.onPointerDownCapture(pointer(800, 120)));
    expect(capture).toHaveBeenCalledWith(7);
    act(() => radix(renderer.root, "content").props.onPointerMove(pointer(1_300, 620)));
    expect(radix(renderer.root, "content").props.style.translate).toBe("52px 212px");
    act(() => radix(renderer.root, "content").props.onPointerUp(pointer(1_300, 620)));
    expect(release).toHaveBeenCalledWith(7);
    expect(radix(renderer.root, "content").props["data-composa-overlay-dragged"]).toBe("");

    act(() => radix(renderer.root, "content").props.onPointerDownCapture(pointer(800, 120)));
    act(() => radix(renderer.root, "content").props.onPointerMove(pointer(600, 20)));
    act(() => radix(renderer.root, "content").props.onPointerCancel(pointer(600, 20)));
    expect(radix(renderer.root, "content").props.style.translate).toBe("52px 212px");
    act(() => renderer.unmount());
  });

  it("closes through the controlled Radix dismissal path used by Escape and outside click", () => {
    const { renderer, onClose } = renderOpen("light");
    const escape = { preventDefault: vi.fn() };
    act(() => radix(renderer.root, "content").props.onEscapeKeyDown(escape));
    expect(escape.preventDefault).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });

  it("returns focus to the captured trigger after dismissal", () => {
    const { renderer, focus } = renderOpen("light");
    const event = { preventDefault: vi.fn() };
    act(() => radix(renderer.root, "content").props.onCloseAutoFocus(event));
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });

  it("blocks nested-overlay outside interaction without weakening explicit close", () => {
    const outsideCallback = vi.fn();
    const { renderer, onClose } = renderOpen("dark", vi.fn(), true, undefined, outsideCallback);
    const outside = { preventDefault: vi.fn() };
    act(() => radix(renderer.root, "content").props.onInteractOutside(outside));
    expect(outsideCallback).toHaveBeenCalledOnce();
    expect(outside.preventDefault).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    act(() => radix(renderer.root, "root").props.onOpenChange(false));
    expect(onClose).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });

  it("preserves the existing non-modal InspectorDialog compatibility contract", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <InspectorDialog open={false} onClose={() => undefined} ariaLabel="Effect details"
          trigger={<button type="button">Open effect</button>}>
          <div>Effect fields</div>
        </InspectorDialog>,
      );
    });
    const overlay = renderer!.root.findByType(AnchoredInspectorOverlay);
    expect(radix(renderer!.root, "root").props.modal).toBe(false);
    expect(overlay.props.minWidth).toBe(320);
    expect(overlay.props.elevation).toBe(400);
    expect(overlay.props.dragHandleSelector).toBe(INSPECTOR_DIALOG_DRAG_HANDLE_SELECTOR);
    const header = Children.toArray(overlay.props.children)[0] as ReactElement<Record<string, unknown>>;
    expect(header.props["data-composa-inspector-dialog-drag-handle"]).toBe("");
    act(() => renderer!.unmount());
  });

  it("forwards the opt-in focus-preservation contract for passive floating chrome", () => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <InspectorDialog open={false} onClose={() => undefined} ariaLabel="Preview" preserveFocusOnOpen>
          <div>Preview</div>
        </InspectorDialog>,
      );
    });
    const overlay = renderer.root.findByType(AnchoredInspectorOverlay);
    expect(overlay.props.preserveFocusOnOpen).toBe(true);
  });

  it("forwards the shared resize contract and renders one keyboard-addressable corner", () => {
    const resize = { minWidth: 320, minHeight: 220, maxWidth: 720, maxHeight: 520, ariaLabel: "Resize Preview" };
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <InspectorDialog open={false} onClose={() => undefined} ariaLabel="Preview" resizable={resize}>
          <div>Preview</div>
        </InspectorDialog>,
      );
    });
    expect(renderer!.root.findByType(AnchoredInspectorOverlay).props.resizable).toBe(resize);
    expect(renderer!.root.findByType(AnchoredInspectorOverlay).props.minWidth).toBe(320);
    act(() => renderer!.unmount());

    const { renderer: openRenderer } = renderOpen("light");
    act(() => openRenderer.update(
      <AnchoredInspectorOverlay open onClose={() => undefined} ariaLabel="Preview" resizable={resize}
        trigger={<button type="button">Open</button>}>
        <div>Preview</div>
      </AnchoredInspectorOverlay>,
    ));
    const handle = openRenderer.root.findByProps({ "data-composa-overlay-resize-handle": "bottom-right" });
    expect(handle.props["aria-label"]).toBe("Resize Preview");
    act(() => openRenderer.unmount());
  });

  it("tags a real dialog's header, so every InspectorDialog consumer drags from it", () => {
    // ColorDialog is the shape that matters: its children start with a comment
    // and a conditional, so the handle has to find the first ELEMENT rather than
    // the first child. Dragging lives here, not per dialog, which is why colour,
    // typography and the rest move without each implementing it.
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <ColorDialog open onClose={() => undefined} trigger={<button type="button">Open color</button>} />,
        {
          createNodeMock: element => element.type === "span"
            ? { querySelector: () => ({ getBoundingClientRect: () => rect, closest: () => null, focus: () => undefined }) }
            : null,
        },
      );
    });
    const handles = renderer!.root.findAll(instance =>
      typeof instance.type === "string"
      && instance.props["data-composa-inspector-dialog-drag-handle"] === "");
    expect(handles).toHaveLength(1);
    // …and the tagged element is the header: it owns the Close control.
    expect(handles[0].findByProps({ "aria-label": "Close" })).toBeTruthy();
    expect(renderer!.root.findByType(AnchoredInspectorOverlay).props.dragHandleSelector)
      .toBe(INSPECTOR_DIALOG_DRAG_HANDLE_SELECTOR);
    act(() => renderer!.unmount());
  });
});
