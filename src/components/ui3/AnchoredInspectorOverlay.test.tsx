import * as PopoverPrimitive from "@radix-ui/react-popover";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
  ANCHORED_INSPECTOR_OVERLAY_Z_CLASS,
  COMPOSA_OVERLAY_BOUNDARY_SELECTOR,
  AnchoredInspectorOverlay,
  shouldMountAnchoredInspectorOverlay,
} from "./AnchoredInspectorOverlay";
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

const rect = { x: 920, y: 80, width: 24, height: 24, top: 80, right: 944, bottom: 104, left: 920, toJSON: () => ({}) } as DOMRect;

function renderOpen(mode: "light" | "dark", onClose = vi.fn(), blockOutsideDismiss = false, elevation?: 400 | 500, onInteractOutside?: () => void) {
  const focus = vi.fn();
  const collisionBoundary = { dataset: { composaOverlayBoundary: "" } };
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
      <AnchoredInspectorOverlay open onClose={onClose} ariaLabel={`${mode} settings`} blockOutsideDismiss={blockOutsideDismiss} elevation={elevation}
        onInteractOutside={onInteractOutside}
        trigger={<button type="button" aria-label={`Open ${mode}`}>Open</button>}>
        <button type="button">First field</button>
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
    expect(content.props.avoidCollisions).toBe(true);
    expect(content.props.sticky).toBe("always");
    expect(content.props.collisionBoundary).toBe(collisionBoundary);
    expect(content.props.collisionPadding).toBe(ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING);
    expect(content.props.className).toContain(ANCHORED_INSPECTOR_OVERLAY_Z_CLASS);
    expect(content.props.className).toContain("max-h-[var(--radix-popover-content-available-height)]");
    expect(content.props.className).toContain("max-w-[calc(100vw-16px)]");
    expect(content.props.style.maxHeight).toBe("var(--radix-popover-content-available-height)");
    act(() => renderer.unmount());
  });

  it("applies the canonical elevation token directly when requested", () => {
    const { renderer } = renderOpen("light", vi.fn(), false, 400);
    expect(radix(renderer.root, "content").props.style.boxShadow).toBe("var(--elevation-400)");
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
          Effect fields
        </InspectorDialog>,
      );
    });
    expect(radix(renderer!.root, "root").props.modal).toBe(false);
    act(() => renderer!.unmount());
  });
});
