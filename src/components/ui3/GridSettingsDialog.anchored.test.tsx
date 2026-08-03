import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
  ANCHORED_INSPECTOR_OVERLAY_Z_CLASS,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  COMPOSA_OVERLAY_BOUNDARY_SELECTOR,
} from "./AnchoredInspectorOverlay";
import { GridSettingsDialog } from "./GridSettingsDialog";
import type { ElementGridSettings } from "./PropertyPanel";

// RP-16: the grid track editors moved out of the inline panel into this dialog.
// A dialog that opens ON TOP of the inspector would be a worse answer than the
// inline controls it replaced, so this exercises the REAL InspectorDialog →
// AnchoredInspectorOverlay chain (only Radix is mocked), exactly as
// AutoLayoutSettingsDialog.anchored.test.tsx does for its peer. The isolated
// unit test cannot see placement — it mocks InspectorDialog away.
vi.mock("@radix-ui/react-popover", async () => {
  const React = await import("react");
  const boundary = (name: string) => ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("div", { [`data-radix-${name}`]: true, ...props }, children);
  return { Root: boundary("root"), Anchor: boundary("anchor"), Portal: boundary("portal"), Content: boundary("content"), Trigger: boundary("trigger") };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const GRID: ElementGridSettings = {
  rows: [{ id: "row-1", mode: "fixed", size: 100 }, { id: "row-2", mode: "fixed", size: 100 }],
  columns: [{ id: "column-1", mode: "fixed", size: 100 }, { id: "column-2", mode: "fixed", size: 100 }],
  rowGap: 10, columnGap: 10,
  justifyItems: "start", alignItems: "start", justifyContent: "start", alignContent: "start",
};

// The trigger is the 24px action button at the right end of the Alignment/Gap
// row; the inspector surface's LEFT edge is well to the left of it.
const triggerRect = { x: 920, y: 80, width: 24, height: 24, top: 80, right: 944, bottom: 104, left: 920, toJSON: () => ({}) } as DOMRect;
const surfaceRect = { x: 760, y: 0, width: 240, height: 500, top: 0, right: 1_000, bottom: 500, left: 760, toJSON: () => ({}) } as DOMRect;

function renderOpen(onClose = vi.fn()) {
  const collisionBoundary = {
    dataset: { composaOverlayBoundary: "" },
    getBoundingClientRect: () => ({ top: 0, right: 1_000, bottom: 500, left: 0 }),
  };
  const surface = { getBoundingClientRect: () => surfaceRect };
  const trigger = {
    getBoundingClientRect: () => triggerRect,
    closest: (selector: string) =>
      selector === COMPOSA_OVERLAY_BOUNDARY_SELECTOR ? collisionBoundary
      : selector === COMPOSA_INSPECTOR_SURFACE_SELECTOR ? surface
      : { dataset: { composaMode: "light" } },
    focus: vi.fn(),
  };
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <GridSettingsDialog open grid={GRID} onClose={onClose}
        trigger={<button type="button" aria-label="Grid settings">Settings</button>} />,
      { createNodeMock: element => element.type === "span" ? { querySelector: () => trigger } : null },
    );
  });
  return { renderer: renderer!, onClose, collisionBoundary };
}

function radix(root: ReactTestInstance, name: string) {
  // The nested track-sizing PopoverMenus render mocked Content nodes too, so
  // disambiguate the outer inspector dialog by its role="dialog".
  if (name === "content") return root.find(node => node.props["data-radix-content"] && node.props.role === "dialog");
  return root.find(node => node.props[`data-radix-${name}`]);
}

describe("GridSettingsDialog — anchored InspectorDialog contract (RP-16)", () => {
  it("is the same 240px, elevation-400, left-anchored dialog as its inspector peers", () => {
    const { renderer, collisionBoundary } = renderOpen();
    const content = radix(renderer.root, "content");
    expect(content.props["aria-label"]).toBe("Grid Settings");
    expect(content.props.style.width).toBe(240);
    expect(content.props.style.boxShadow).toBe("var(--elevation-400)");
    expect(content.props.side).toBe("left");
    expect(content.props.align).toBe("start");
    expect(content.props.avoidCollisions).toBe(true);
    expect(content.props.collisionBoundary).toBe(collisionBoundary);
    expect(content.props.collisionPadding).toBe(ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING);
    expect(content.props.className).toContain(ANCHORED_INSPECTOR_OVERLAY_Z_CLASS);
    act(() => renderer.unmount());
  });

  it("anchors the side axis to the inspector SURFACE left edge, not the trigger", () => {
    const { renderer } = renderOpen();
    // A trigger-anchored dialog would place from triggerRect.x (920) and land on
    // top of the panel; a surface-anchored one collapses onto the surface edge.
    const rect = radix(renderer.root, "anchor").props.virtualRef.current.getBoundingClientRect();
    expect(rect.left).toBe(surfaceRect.left);
    expect(rect.right).toBe(surfaceRect.left);
    expect(rect.width).toBe(0);
    // Cross axis still tracks the trigger's vertical extent.
    expect(rect.top).toBe(triggerRect.top);
    act(() => renderer.unmount());
  });

  it("closes through the Escape dismissal path", () => {
    const { renderer, onClose } = renderOpen();
    const escape = { preventDefault: vi.fn() };
    act(() => radix(renderer.root, "content").props.onEscapeKeyDown(escape));
    expect(onClose).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });
});
