import { Children, type ReactElement } from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnchoredInspectorOverlay, COMPOSA_OVERLAY_BOUNDARY_SELECTOR } from "./AnchoredInspectorOverlay";
import { INSPECTOR_DIALOG_DRAG_HANDLE_SELECTOR, InspectorDialog, InspectorDialogHeader } from "./InspectorDialog";

// Free-floating mode: a dialog with NO persistent trigger to capture. The
// mini-player is the driving case — it is opened from a menu row that closes
// itself on select, and from a `#preview` URL with no gesture at all — so the
// only alternatives were a phantom trigger element or a second, blocking
// floating-window mechanism. Composa RP-2.

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

const ANCHOR_SELECTOR = "[data-test-anchor]";

const anchorRect = { x: 1_200, y: 48, width: 240, height: 700, top: 48, right: 1_440, bottom: 748, left: 1_200, toJSON: () => ({}) } as DOMRect;
const boundaryRect = { x: 0, y: 40, width: 1_440, height: 720, top: 40, right: 1_440, bottom: 760, left: 0, toJSON: () => ({}) } as DOMRect;

/**
 * @param matches which selectors `document.querySelector` resolves. Omitting
 * ANCHOR_SELECTOR is the "the anchor is not in the DOM" case.
 */
function stubDocument(matches: readonly string[]) {
  const overlayBoundary = {
    getBoundingClientRect: () => boundaryRect,
    closest: (selector: string) => (selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR ? overlayBoundary : null),
  };
  const anchor = {
    getBoundingClientRect: () => anchorRect,
    closest: (selector: string) => {
      if (selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR) return overlayBoundary;
      if (selector === "[data-composa-mode]") return { dataset: { composaMode: "dark" } };
      return null;
    },
  };
  vi.stubGlobal("document", {
    activeElement: null,
    querySelector: (selector: string) => {
      if (!matches.includes(selector)) return null;
      if (selector === ANCHOR_SELECTOR) return anchor;
      if (selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR) return overlayBoundary;
      return null;
    },
  });
  return { anchor, overlayBoundary };
}

function radix(root: ReactTestInstance, name: string) {
  return root.find(node => node.props[`data-radix-${name}`]);
}

describe("AnchoredInspectorOverlay — free-floating (no trigger)", () => {
  it("mounts against the named anchor and renders no trigger host", () => {
    stubDocument([ANCHOR_SELECTOR, COMPOSA_OVERLAY_BOUNDARY_SELECTOR]);
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <AnchoredInspectorOverlay open onClose={() => undefined} ariaLabel="Composition preview"
          anchorSelector={ANCHOR_SELECTOR} trapFocus={false}>
          <div data-test-body>Stage</div>
        </AnchoredInspectorOverlay>,
      );
    });
    // Assert the surface rendered BEFORE asserting what is absent from it.
    const content = radix(renderer!.root, "content");
    expect(content.props["aria-label"]).toBe("Composition preview");
    expect(content.findByProps({ "data-test-body": true })).toBeTruthy();

    // The anchor supplies the rect, the collision boundary and the mode.
    expect(radix(renderer!.root, "anchor").props.virtualRef.current.getBoundingClientRect()).toBe(anchorRect);
    expect(content.props.collisionBoundary.getBoundingClientRect()).toBe(boundaryRect);
    expect(content.props["data-composa-mode"]).toBe("dark");

    // …and no trigger host span is rendered, because there is no trigger.
    expect(renderer!.root.findAll(node => node.type === "span")).toHaveLength(0);
    act(() => renderer!.unmount());
  });

  it("still opens when the anchor selector matches nothing", () => {
    // A trigger-anchored overlay can wait for its trigger; a free-floating one
    // has nothing to wait for, so a missed selector must not leave `open`
    // painting nothing — that is exactly the `#preview` new-tab landing, which
    // opens at mount with no gesture.
    stubDocument([COMPOSA_OVERLAY_BOUNDARY_SELECTOR]);
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <AnchoredInspectorOverlay open onClose={() => undefined} ariaLabel="Composition preview"
          anchorSelector={ANCHOR_SELECTOR} trapFocus={false}>
          <div data-test-body>Stage</div>
        </AnchoredInspectorOverlay>,
      );
    });
    const content = radix(renderer!.root, "content");
    expect(content.props["aria-label"]).toBe("Composition preview");
    expect(radix(renderer!.root, "anchor").props.virtualRef.current.getBoundingClientRect()).toBe(boundaryRect);
    act(() => renderer!.unmount());
  });

  it("is non-blocking and draggable through InspectorDialog, with no trigger", () => {
    stubDocument([ANCHOR_SELECTOR, COMPOSA_OVERLAY_BOUNDARY_SELECTOR]);
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <InspectorDialog open onClose={() => undefined} ariaLabel="Composition preview"
          anchorSelector={ANCHOR_SELECTOR} width="min(1040px, 92vw)">
          <InspectorDialogHeader title="Preview" onClose={() => undefined} />
          <div data-test-body>Stage</div>
        </InspectorDialog>,
      );
    });
    const content = radix(renderer!.root, "content");
    expect(content.findByProps({ "data-test-body": true })).toBeTruthy();

    // Non-blocking: no Radix modal mode, so the rest of the page keeps its
    // pointer events, and no aria-modal is claimed.
    expect(radix(renderer!.root, "root").props.modal).toBe(false);
    expect(content.props["aria-modal"]).toBe(false);

    // A string width does not pin minWidth (it would fight the max-w clamp).
    const overlay = renderer!.root.findByType(AnchoredInspectorOverlay);
    expect(overlay.props.width).toBe("min(1040px, 92vw)");
    expect(overlay.props.minWidth).toBeUndefined();

    // The shared header is still tagged as the drag handle.
    expect(overlay.props.dragHandleSelector).toBe(INSPECTOR_DIALOG_DRAG_HANDLE_SELECTOR);
    const header = Children.toArray(overlay.props.children)[0] as ReactElement<Record<string, unknown>>;
    expect(header.props["data-composa-inspector-dialog-drag-handle"]).toBe("");
    const tagged = renderer!.root.findAll(node =>
      typeof node.type === "string" && node.props["data-composa-inspector-dialog-drag-handle"] === "");
    expect(tagged).toHaveLength(1);
    expect(tagged[0].findByProps({ "aria-label": "Close" })).toBeTruthy();
    act(() => renderer!.unmount());
  });
});
